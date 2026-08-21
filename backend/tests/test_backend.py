import io
import os
import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw
import numpy as np
from backend.main import app
from backend.db.database import Base, engine

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield


def get_authenticated_headers():
    email = "forensic_researcher@fakesense.ai"
    password = "SecurePassword123!"
    reg_res = client.post("/auth/register", json={"email": email, "password": password})
    if reg_res.status_code == 400:
        login_res = client.post("/auth/login", json={"email": email, "password": password})
        token = login_res.json()["access_token"]
    else:
        token = reg_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, token


def create_test_image(mode="synthetic", size=(400, 400)):
    if mode == "synthetic":
        np.random.seed(42)
        img = Image.new("RGB", size, color=(140, 160, 190))
        draw = ImageDraw.Draw(img)
        for y in range(size[1]):
            draw.line([(0, y), (size[0], y)], fill=(int(70 + y * 0.2), int(90 + y * 0.1), int(150 - y * 0.1)))
        cx, cy = size[0] // 2, size[1] // 2
        draw.ellipse([cx - 80, cy - 100, cx + 80, cy + 100], fill=(240, 190, 155))
        draw.ellipse([cx - 45, cy - 30, cx - 18, cy - 12], fill=(255, 255, 255))
        draw.ellipse([cx - 35, cy - 25, cx - 25, cy - 15], fill=(20, 20, 20))
        draw.ellipse([cx + 18, cy - 35, cx + 45, cy - 12], fill=(255, 255, 255))
        draw.ellipse([cx + 25, cy - 25, cx + 35, cy - 15], fill=(20, 20, 20))
        draw.ellipse([cx - 30, cy + 35, cx + 30, cy + 55], fill=(215, 75, 75))

        arr = np.array(img, dtype=np.float32)
        arr[::8, :, :] += 14.0
        arr[:, ::8, :] += 14.0
        arr[::16, :, :] += 18.0
        arr[:, ::16, :] += 18.0
        pil_img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
        buf = io.BytesIO()
        pil_img.save(buf, format="JPEG", quality=92)
        buf.seek(0)
        return buf

    elif mode == "genuine":
        np.random.seed(42)
        img = Image.new("RGB", size, color=(130, 150, 180))
        draw = ImageDraw.Draw(img)
        draw.rectangle([0, int(size[1] * 0.45), size[0], size[1]], fill=(65, 110, 55))
        draw.ellipse([int(size[0] * 0.35), int(size[1] * 0.15), int(size[0] * 0.65), int(size[1] * 0.45)], fill=(240, 220, 90))

        arr = np.array(img, dtype=np.float32)
        poisson_noise = np.random.normal(0, np.sqrt(np.maximum(1.0, arr * 0.08)))
        arr = np.clip(arr + poisson_noise, 0, 255).astype(np.uint8)
        pil_img = Image.fromarray(arr)
        exif = pil_img.getexif()
        exif[271] = "Sony"
        exif[272] = "ILCE-7RM4"
        exif[36867] = "2025:08:14 11:32:00"
        buf = io.BytesIO()
        pil_img.save(buf, format="JPEG", quality=95, exif=exif)
        buf.seek(0)
        return buf

    elif mode == "spliced":
        np.random.seed(42)
        bg = Image.new("RGB", size, color=(140, 160, 190))
        draw = ImageDraw.Draw(bg)
        draw.rectangle([0, int(size[1] * 0.5), size[0], size[1]], fill=(70, 120, 60))
        arr_bg = np.array(bg, dtype=np.float32)
        noise_bg = np.random.normal(0, 3.0, arr_bg.shape)
        bg_pil = Image.fromarray(np.clip(arr_bg + noise_bg, 0, 255).astype(np.uint8))

        pw, ph = int(size[0] * 0.35), int(size[1] * 0.35)
        px, py = int(size[0] * 0.3), int(size[1] * 0.3)
        patch = Image.new("RGB", (pw, ph), color=(220, 90, 70))
        draw_p = ImageDraw.Draw(patch)
        draw_p.ellipse([10, 10, pw - 10, ph - 10], fill=(255, 200, 80))
        buf_p = io.BytesIO()
        patch.save(buf_p, format="JPEG", quality=35)
        buf_p.seek(0)
        patch_reloaded = Image.open(buf_p)

        bg_pil.paste(patch_reloaded, (px, py))
        buf = io.BytesIO()
        bg_pil.save(buf, format="JPEG", quality=90)
        buf.seek(0)
        return buf

    img = Image.new("RGB", (40, 40), color=(100, 100, 100))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92)
    buf.seek(0)
    return buf


def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_ai_generated_portrait_detection():
    headers, _ = get_authenticated_headers()
    img_buf = create_test_image("synthetic", (400, 400))
    files = {"file": ("ai_generated_portrait.jpg", img_buf, "image/jpeg")}

    res = client.post("/verify", files=files, headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["verdict"] in ["Likely AI-Generated", "Likely Manipulated", "Inconclusive"]
    # Critical verification: Must NOT default to old false "Likely Real 73%"
    assert not (data["verdict"] == "Likely Real" and data["authenticity_score"] == 73)
    assert "ai_generated_detector" in data["modules"]
    assert "score_ai_generated" in data["modules"]["ai_generated_detector"]
    assert "confidence" in data
    assert 0.0 <= data["confidence"] <= 1.0


def test_genuine_photograph_verification():
    headers, _ = get_authenticated_headers()
    img_buf = create_test_image("genuine", (400, 400))
    files = {"file": ("natural_camera_photo.jpg", img_buf, "image/jpeg")}

    res = client.post("/verify", files=files, headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["verdict"] in ["Likely Authentic", "Likely Real", "Inconclusive"]
    assert 0 <= data["authenticity_score"] <= 100
    assert data["modules"]["visual_cnn"]["status"] == "completed"


def test_spliced_manipulated_image_detection():
    headers, _ = get_authenticated_headers()
    img_buf = create_test_image("spliced", (400, 400))
    files = {"file": ("spliced_edit.jpg", img_buf, "image/jpeg")}

    res = client.post("/verify", files=files, headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["verdict"] in ["Likely Manipulated", "Likely AI-Generated", "Inconclusive"]
    assert data["modules"]["visual_cnn"]["suspicion_score"] is not None


def test_low_quality_small_image_handling():
    headers, _ = get_authenticated_headers()
    img_buf = create_test_image("small", (40, 40))
    files = {"file": ("tiny_icon.jpg", img_buf, "image/jpeg")}

    res = client.post("/verify", files=files, headers=headers)
    assert res.status_code == 200
    data = res.json()

    # Small images should trigger quality warning and return Inconclusive or low confidence
    assert data["verdict"] == "Inconclusive"
    assert data["confidence"] <= 0.65


def test_deterministic_scores_same_image():
    headers, _ = get_authenticated_headers()
    img_buf1 = create_test_image("synthetic", (350, 350))
    img_bytes = img_buf1.getvalue()

    files1 = {"file": ("test_upload_1.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    res1 = client.post("/verify", files=files1, headers=headers)
    assert res1.status_code == 200
    data1 = res1.json()

    files2 = {"file": ("test_upload_2_different_name.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    res2 = client.post("/verify", files=files2, headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()

    # Same file content must produce identical core scores and SHA-256
    assert data1["sha256_hash"] == data2["sha256_hash"]
    assert data1["authenticity_score"] == data2["authenticity_score"]
    assert data1["verdict"] == data2["verdict"]


def test_independent_scores_different_images():
    headers, _ = get_authenticated_headers()
    img_buf_synth = create_test_image("synthetic", (350, 350))
    img_buf_gen = create_test_image("genuine", (350, 350))

    files_a = {"file": ("sample_a.jpg", img_buf_synth, "image/jpeg")}
    res_a = client.post("/verify", files=files_a, headers=headers)
    assert res_a.status_code == 200
    data_a = res_a.json()

    files_b = {"file": ("sample_b.jpg", img_buf_gen, "image/jpeg")}
    res_b = client.post("/verify", files=files_b, headers=headers)
    assert res_b.status_code == 200
    data_b = res_b.json()

    # Different images must have different SHA-256 hashes
    assert data_a["sha256_hash"] != data_b["sha256_hash"]


def test_compare_mode_endpoint():
    headers, _ = get_authenticated_headers()
    img_buf_a = create_test_image("synthetic", (300, 300))
    img_buf_b = create_test_image("genuine", (300, 300))

    files = {
        "file_a": ("media_a.jpg", img_buf_a, "image/jpeg"),
        "file_b": ("media_b.jpg", img_buf_b, "image/jpeg")
    }
    res = client.post("/compare/upload", files=files, headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert "media_a" in data
    assert "media_b" in data
    assert data["media_a"]["verification_id"] != data["media_b"]["verification_id"]


def test_agent_chat_endpoint():
    headers, _ = get_authenticated_headers()
    img_buf = create_test_image("synthetic", (320, 320))
    files = {"file": ("chat_test.jpg", img_buf, "image/jpeg")}
    verify_res = client.post("/verify", files=files, headers=headers)
    assert verify_res.status_code == 200
    verif_id = verify_res.json()["verification_id"]

    # Test greeting
    chat_res1 = client.post(
        "/api/agent/chat",
        json={"verification_id": verif_id, "question": "Hi"},
        headers=headers
    )
    assert chat_res1.status_code == 200
    assert len(chat_res1.json()["answer"]) > 10

    # Test why fake inquiry
    chat_res2 = client.post(
        "/api/agent/chat",
        json={"verification_id": verif_id, "question": "Why?"},
        headers=headers
    )
    assert chat_res2.status_code == 200
    assert len(chat_res2.json()["answer"]) > 10


def test_pdf_report_and_thumbnail_serving():
    headers, token = get_authenticated_headers()
    img_buf = create_test_image("synthetic", (320, 320))
    files = {"file": ("report_test.jpg", img_buf, "image/jpeg")}
    verify_res = client.post("/verify", files=files, headers=headers)
    assert verify_res.status_code == 200
    verif_id = verify_res.json()["verification_id"]

    # 1. Test PDF report download
    pdf_res = client.get(f"/verify/{verif_id}/report", headers=headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 1000

    # 2. Test secure thumbnail serving with token query param
    thumb_res = client.get(f"/media/{verif_id}/thumbnail?token={token}")
    assert thumb_res.status_code == 200
    assert "image" in thumb_res.headers["content-type"]
    assert len(thumb_res.content) > 100
