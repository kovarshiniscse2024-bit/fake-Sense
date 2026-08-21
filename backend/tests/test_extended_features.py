import pytest
import io
import json
import numpy as np
import cv2
from PIL import Image
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.main import app
from backend.db.database import Base, get_db
from backend.db.models import User, Verification
from backend.auth.dependencies import get_current_user
from backend.services.explanation import generate_explainable_evidence
from backend.services.agent import VerificationAgent
from backend.services.pdf_report import generate_pdf_report
from backend.services.agent_chat import explain_single_evidence, explain_comparison

# Test database with StaticPool for in-memory SQLite cross-thread support
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create test user
    test_user = User(
        id=1,
        email="forensics_expert@fakesense.ai",
        password_hash="mock_hashed_password"
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="module")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_current_user():
        return db_session.query(User).filter(User.id == 1).first()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


def create_test_image_bytes(is_manipulated=False) -> bytes:
    """Helper to generate in-memory synthetic image bytes."""
    img = np.ones((200, 200, 3), dtype=np.uint8) * 180
    if is_manipulated:
        # Inject high-frequency noise block
        noise = np.random.randint(0, 255, (60, 60, 3), dtype=np.uint8)
        img[50:110, 50:110] = noise
    
    pil_img = Image.fromarray(img)
    buf = io.BytesIO()
    pil_img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def test_structured_evidence_generation():
    """Feature 1 & 2: Test rich structured evidence objects and anti-hallucination localization."""
    modules = {
        "visual_cnn": {
            "status": "completed",
            "suspicion_score": 0.22,
            "result": "normal_compression",
            "details": "DCT high-frequency analysis shows standard photographic noise variance."
        },
        "face_analysis": {
            "status": "completed",
            "suspicion_score": 0.85,
            "result": "boundary_inconsistency",
            "details": "Abnormal boundary seam detected in facial contour.",
            "metrics": {
                "detected_boxes": [{"x": 40, "y": 40, "w": 80, "h": 80, "severity": "High", "label": "Facial Seam Anomaly"}]
            }
        },
        "audio_visual_sync": {
            "status": "not_applicable",
            "details": "Audio stream absent in image media."
        },
        "metadata": {
            "status": "completed",
            "suspicion_score": 0.15,
            "result": "clean_headers",
            "details": "Standard web compressed format without editing signatures."
        }
    }

    evidence = generate_explainable_evidence("Likely Manipulated", 35, modules, [])
    assert len(evidence) >= 2
    
    # Check facial evidence item has localization available
    face_ev = next((e for e in evidence if e["source"] == "face_analysis"), None)
    assert face_ev is not None
    assert face_ev["severity"] == "High"
    assert face_ev["score"] == 0.85
    assert face_ev["localization"]["available"] is True
    assert len(face_ev["localization"]["boxes"]) == 1

    # Check visual CNN evidence item explicitly disclaims localization
    cnn_ev = next((e for e in evidence if e["source"] == "visual_cnn"), None)
    assert cnn_ev is not None
    assert cnn_ev["localization"]["available"] is False
    assert "Visual localization is not available" in cnn_ev["localization"]["reason"]


def test_verification_timeline_and_performance(client, db_session):
    """Feature 4, 5, 6: Test stage timing, timeline generation, and performance summary."""
    img_bytes = create_test_image_bytes(is_manipulated=False)
    
    response = client.post(
        "/verify",
        files={"file": ("genuine_test.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()

    assert "timeline" in data
    assert "performance_summary" in data
    
    timeline = data["timeline"]
    assert len(timeline) >= 6
    
    # Verify stages
    stage_names = [t["module"] for t in timeline]
    assert any("Visual" in s for s in stage_names)
    assert any("Audio" in s for s in stage_names)
    
    # Audio on image must be marked as not_applicable
    av_stage = next(t for t in timeline if "Audio" in t["module"])
    assert av_stage["status"] == "not_applicable"

    # Performance summary checks
    perf = data["performance_summary"]
    assert perf["total_duration_seconds"] > 0
    assert perf["modules_completed"] >= 2
    assert perf["confidence_percentage"] >= 60



def test_explain_single_evidence_api(client, db_session):
    """Feature 3: Test explain single evidence endpoint without hallucinated facial coordinates."""
    img_bytes = create_test_image_bytes(is_manipulated=False)
    v_res = client.post("/verify", files={"file": ("portrait.jpg", img_bytes, "image/jpeg")}).json()
    v_id = v_res["verification_id"]

    ev_target = v_res["evidence"][0]
    ev_id = ev_target["id"]

    response = client.post(
        "/api/agent/explain-evidence",
        json={
            "verification_id": v_id,
            "evidence_id": ev_id,
            "evidence_data": ev_target
        }
    )
    assert response.status_code == 200
    res_data = response.json()
    assert "answer" in res_data
    assert "Evidence Inspection" in res_data["answer"] or ev_target["finding"] in res_data["answer"]


def test_compare_mode_upload_and_explain(client):
    """Feature 7 & 8: Test dual independent verification and AI comparative reasoning."""
    img_a = create_test_image_bytes(is_manipulated=False)
    img_b = create_test_image_bytes(is_manipulated=True)

    response = client.post(
        "/compare/upload",
        files={
            "file_a": ("media_a_real.jpg", img_a, "image/jpeg"),
            "file_b": ("media_b_fake.jpg", img_b, "image/jpeg")
        }
    )
    assert response.status_code == 200
    comp_data = response.json()
    assert "media_a" in comp_data
    assert "media_b" in comp_data
    assert comp_data["media_a"]["verdict"] in ["Likely Real", "Likely Authentic", "Likely AI-Generated", "Likely Manipulated", "Inconclusive"]

    # Test compare explain endpoint
    id_a = comp_data["media_a"]["verification_id"]
    id_b = comp_data["media_b"]["verification_id"]

    exp_res = client.post(
        "/compare/explain",
        json={"id_a": id_a, "id_b": id_b}
    )
    assert exp_res.status_code == 200
    exp_data = exp_res.json()
    assert "Comparative Forensic" in exp_data["answer"]
    assert "media_a_real.jpg" in exp_data["answer"]
    assert "media_b_fake.jpg" in exp_data["answer"]


def test_pdf_report_generation(client):
    """Feature 9: Test PDF report containing timeline, performance, and structured evidence."""
    img_bytes = create_test_image_bytes(is_manipulated=False)
    v_res = client.post("/verify", files={"file": ("report_test.jpg", img_bytes, "image/jpeg")}).json()
    v_id = v_res["verification_id"]

    rep_res = client.get(f"/verify/{v_id}/report")
    assert rep_res.status_code == 200
    assert rep_res.headers["content-type"] == "application/pdf"
    assert len(rep_res.content) > 1000
    assert rep_res.content[:4] == b"%PDF"


def test_delete_verification_privacy(client, db_session):
    """Feature 11: Test deletion and ensuring AI Agent no longer has access to purged record."""
    img_bytes = create_test_image_bytes(is_manipulated=False)
    v_res = client.post("/verify", files={"file": ("delete_me.jpg", img_bytes, "image/jpeg")}).json()
    v_id = v_res["verification_id"]

    # Verify record exists
    get_res = client.get(f"/verify/{v_id}")
    assert get_res.status_code == 200

    # Delete record
    del_res = client.delete(f"/verify/{v_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"

    # Verify GET now returns 404
    get_after = client.get(f"/verify/{v_id}")
    assert get_after.status_code == 404

    # Verify AI Agent chat now returns 404
    agent_res = client.post(
        "/api/agent/chat",
        json={"verification_id": v_id, "question": "Why is this real?"}
    )
    assert agent_res.status_code == 404
