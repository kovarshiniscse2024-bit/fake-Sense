import os
import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from backend.main import app
from backend.db.database import get_db, Base, engine
from backend.db.models import User, Verification
from backend.auth.security import create_access_token, get_password_hash


@pytest.fixture
def client_and_users():
    # Setup test client
    client = TestClient(app)
    db = next(get_db())

    # Create test user A
    user_a = db.query(User).filter(User.email == "usera_test@fakesense.ai").first()
    if not user_a:
        user_a = User(email="usera_test@fakesense.ai", password_hash=get_password_hash("password123"))
        db.add(user_a)
        db.commit()
        db.refresh(user_a)

    # Create test user B
    user_b = db.query(User).filter(User.email == "userb_test@fakesense.ai").first()
    if not user_b:
        user_b = User(email="userb_test@fakesense.ai", password_hash=get_password_hash("password123"))
        db.add(user_b)
        db.commit()
        db.refresh(user_b)

    token_a = create_access_token({"sub": str(user_a.id)})
    token_b = create_access_token({"sub": str(user_b.id)})

    return client, user_a, token_a, user_b, token_b, db


def create_solid_image_bytes(color=(255, 0, 0), size=(300, 300)):
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_media_persistence_and_history_workflow(client_and_users):
    client, user_a, token_a, user_b, token_b, db = client_and_users

    # TEST 1: Upload image A (Red) as User A
    red_bytes = create_solid_image_bytes(color=(255, 0, 0))
    res_a = client.post(
        "/verify",
        headers={"Authorization": f"Bearer {token_a}"},
        files={"file": ("red_image.jpg", red_bytes, "image/jpeg")}
    )
    assert res_a.status_code == 200
    data_a = res_a.json()
    id_a = data_a["verification_id"]
    assert "media_url" in data_a and data_a["media_url"] is not None
    assert "thumbnail_url" in data_a and data_a["thumbnail_url"] is not None

    # TEST 2: Upload image B (Blue) as User A
    blue_bytes = create_solid_image_bytes(color=(0, 0, 255))
    res_b = client.post(
        "/verify",
        headers={"Authorization": f"Bearer {token_a}"},
        files={"file": ("blue_image.jpg", blue_bytes, "image/jpeg")}
    )
    assert res_b.status_code == 200
    data_b = res_b.json()
    id_b = data_b["verification_id"]
    assert id_a != id_b

    # Verify User A can fetch media A and thumbnail A
    media_res_a = client.get(f"/media/{id_a}?token={token_a}")
    assert media_res_a.status_code == 200
    assert media_res_a.headers["content-type"] in ["image/jpeg", "image/jpg"]
    assert len(media_res_a.content) > 0

    thumb_res_a = client.get(f"/media/{id_a}/thumbnail?token={token_a}")
    assert thumb_res_a.status_code == 200
    assert thumb_res_a.headers["content-type"] == "image/jpeg"

    # Verify History contains both items with valid thumbnail and media URLs
    hist_res = client.get(
        "/history?page=1&page_size=10",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    items = hist_data["items"]
    assert len(items) >= 2

    item_ids = [it["id"] for it in items]
    assert id_a in item_ids
    assert id_b in item_ids

    # TEST 3: History filtering by Search
    search_res = client.get(
        f"/history?search=red_image",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert search_res.status_code == 200
    assert any(it["id"] == id_a for it in search_res.json()["items"])

    # TEST 4: PDF report generation contains actual media
    pdf_res = client.get(
        f"/verify/{id_a}/report",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 1000

    # TEST 5: Security / Ownership isolation (User B attempting to access User A's media)
    unauthorized_media = client.get(f"/media/{id_a}?token={token_b}")
    assert unauthorized_media.status_code == 403
    assert "Access denied" in unauthorized_media.json()["detail"]

    unauthorized_thumb = client.get(f"/media/{id_a}/thumbnail?token={token_b}")
    assert unauthorized_thumb.status_code == 403

    # Clean up test verifications
    client.delete(f"/verify/{id_a}", headers={"Authorization": f"Bearer {token_a}"})
    client.delete(f"/verify/{id_b}", headers={"Authorization": f"Bearer {token_a}"})
