import pytest
import io
from PIL import Image
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.scoring import calculate_model_agreement, compute_risk_radar, compute_what_if_analysis

client = TestClient(app)


def get_authenticated_headers():
    unique_email = "forensic_platform_test@fakesense.ai"
    reg_res = client.post("/auth/register", json={"email": unique_email, "password": "StrongPassword123!"})
    if reg_res.status_code == 201:
        token = reg_res.json()["access_token"]
    else:
        login_res = client.post("/auth/login", json={"email": unique_email, "password": "StrongPassword123!"})
        token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_test_image_bytes():
    img = Image.new("RGB", (120, 120), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def test_model_agreement_and_risk_radar_calculation():
    # Test high agreement
    modules_agree = {
        "visual_cnn": {"status": "completed", "suspicion_score": 0.10, "result": "normal"},
        "face_analysis": {"status": "completed", "suspicion_score": 0.12, "result": "normal"},
        "metadata": {"status": "completed", "suspicion_score": 0.10, "result": "normal"},
    }
    agr = calculate_model_agreement(modules_agree)
    assert agr["state"] in ["HIGH AGREEMENT", "MODERATE AGREEMENT"]
    assert agr["variance"] >= 0.0

    radar = compute_risk_radar(modules_agree, 85, 0.90)
    assert radar["visual_integrity"] == "NORMAL"
    assert radar["facial_consistency"] == "NORMAL"

    # Test disagreement
    modules_disagree = {
        "visual_cnn": {"status": "completed", "suspicion_score": 0.90, "result": "manipulated"},
        "face_analysis": {"status": "completed", "suspicion_score": 0.15, "result": "normal"},
        "metadata": {"status": "completed", "suspicion_score": 0.10, "result": "neutral"},
    }
    agr_dis = calculate_model_agreement(modules_disagree)
    assert agr_dis["state"] in ["MODERATE DISAGREEMENT", "HIGH DISAGREEMENT"]


def test_what_if_analysis_service_and_endpoint():
    headers = get_authenticated_headers()

    # Upload valid test image
    image_bytes = create_test_image_bytes()
    verify_res = client.post(
        "/verify",
        files={"file": ("what_if_test.png", image_bytes, "image/png")},
        headers=headers
    )
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    v_id = v_data["verification_id"]

    # Call What-If endpoint
    what_if_res = client.post(
        "/verify/what-if",
        json={"verification_id": v_id, "excluded_signals": ["metadata"]},
        headers=headers
    )
    assert what_if_res.status_code == 200
    w_data = what_if_res.json()
    assert w_data["verification_id"] == v_id
    assert "original_score" in w_data
    assert "simulated_score" in w_data
    assert "simulated_verdict" in w_data
    assert w_data["is_hypothetical"] is True
    assert "explanation" in w_data


def test_agent_conversational_chat_intents():
    headers = get_authenticated_headers()

    # Upload valid test image
    image_bytes = create_test_image_bytes()
    verify_res = client.post(
        "/verify",
        files={"file": ("conversational_agent_test.png", image_bytes, "image/png")},
        headers=headers
    )
    v_id = verify_res.json()["verification_id"]

    # 1. Greeting
    res_hi = client.post("/api/agent/chat", json={"verification_id": v_id, "question": "hi"}, headers=headers)
    assert res_hi.status_code == 200
    ans_hi = res_hi.json()["answer"]
    assert "Hi! 👋" in ans_hi

    # 2. What-If conversational intent
    res_whatif = client.post("/api/agent/chat", json={"verification_id": v_id, "question": "what if metadata was removed?"}, headers=headers)
    assert res_whatif.status_code == 200
    assert "Hypothetical" in res_whatif.json()["answer"]

    # 3. Model agreement conversational intent
    res_agr = client.post("/api/agent/chat", json={"verification_id": v_id, "question": "why do the models agree or disagree?"}, headers=headers)
    assert res_agr.status_code == 200
    assert "Model Agreement" in res_agr.json()["answer"]
