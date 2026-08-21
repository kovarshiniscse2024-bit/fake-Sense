import os
import json
import httpx

BASE_URL = "http://127.0.0.1:8000"
SAMPLES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "samples")

try:
    from fastapi.testclient import TestClient
    from ..main import app
    client = TestClient(app)
except Exception:
    client = httpx.Client(base_url=BASE_URL, timeout=30.0)


def test_complete_system():
    print("=" * 60)
    print("FAKESENSE E2E SYSTEM INTEGRATION AUDIT")
    print("=" * 60)
    h_res = client.get("/health")
    print(f"[1] Health Check: {h_res.status_code} -> {h_res.json()}")
    assert h_res.status_code == 200

    # 2. Registration & Login
    email = "demo.auditor@fakesense.ai"
    password = "SecurePassword123!"
    client.post("/auth/register", json={"email": email, "password": password})
    login_res = client.post("/auth/login", json={"email": email, "password": password})
    print(f"[2] Login: {login_res.status_code}")
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Test Sample 1: Authentic Portrait
    real_sample_path = os.path.join(SAMPLES_DIR, "sample_real_portrait.jpg")
    with open(real_sample_path, "rb") as f:
        v_real_res = client.post("/verify", files={"file": ("sample_real_portrait.jpg", f, "image/jpeg")}, headers=headers)
    print(f"[3] Verify Real Portrait: {v_real_res.status_code}")
    assert v_real_res.status_code == 200
    real_data = v_real_res.json()
    print(f"    Verdict: {real_data['verdict']} | Score: {real_data['authenticity_score']}% | Confidence: {real_data['confidence']}")
    print(f"    Evidence: {real_data['evidence']}")
    real_id = real_data["verification_id"]
    assert real_data["verdict"] in ["Likely Real", "Likely Authentic"]
    assert real_data["authenticity_score"] >= 68

    # 4. Test Sample 2: Manipulated Portrait
    manip_sample_path = os.path.join(SAMPLES_DIR, "sample_manipulated_portrait.jpg")
    with open(manip_sample_path, "rb") as f:
        v_manip_res = client.post("/verify", files={"file": ("sample_manipulated_portrait.jpg", f, "image/jpeg")}, headers=headers)
    print(f"[4] Verify Manipulated Portrait: {v_manip_res.status_code}")
    assert v_manip_res.status_code == 200
    manip_data = v_manip_res.json()
    print(f"    Verdict: {manip_data['verdict']} | Score: {manip_data['authenticity_score']}% | Confidence: {manip_data['confidence']}")
    print(f"    Evidence: {manip_data['evidence']}")
    manip_id = manip_data["verification_id"]
    assert manip_data["verdict"] in ["Likely Manipulated", "Likely AI-Generated", "Inconclusive"]
    assert manip_data["authenticity_score"] <= 60

    # 5. Test Sample 3: Video sample
    video_sample_path = os.path.join(SAMPLES_DIR, "sample_test_video.mp4")
    with open(video_sample_path, "rb") as f:
        v_video_res = client.post("/verify", files={"file": ("sample_test_video.mp4", f, "video/mp4")}, headers=headers)
    print(f"[5] Verify Video: {v_video_res.status_code}")
    assert v_video_res.status_code == 200
    video_data = v_video_res.json()
    print(f"    Verdict: {video_data['verdict']} | Score: {video_data['authenticity_score']}% | Confidence: {video_data['confidence']}")
    video_id = video_data["verification_id"]

    # 6. Test PDF Reports for all generated results
    for v_id in [real_id, manip_id, video_id]:
        pdf_res = client.get(f"/verify/{v_id}/report", headers=headers)
        print(f"[6] Download PDF for {v_id}: status={pdf_res.status_code}, bytes={len(pdf_res.content)}")
        assert pdf_res.status_code == 200
        assert len(pdf_res.content) > 1000

    # 7. Test History retrieval & Search filter
    hist_res = client.get("/history", headers=headers)
    print(f"[7] User History List: status={hist_res.status_code}, total_items={hist_res.json()['total']}")
    assert hist_res.json()["total"] >= 3

    search_res = client.get("/history?search=manipulated", headers=headers)
    print(f"    History Search 'manipulated': items={len(search_res.json()['items'])}")
    assert len(search_res.json()["items"]) >= 1

    # 8. Test Dashboard Summary & Aggregations
    dash_res = client.get("/dashboard/summary", headers=headers)
    print(f"[8] Dashboard Summary: {dash_res.status_code}")
    dash_data = dash_res.json()
    print(f"    Total: {dash_data['total_verifications']}")
    print(f"    Likely Real: {dash_data['likely_real_count']}")
    print(f"    Likely Manipulated: {dash_data['likely_manipulated_count']}")
    print(f"    Inconclusive: {dash_data['inconclusive_count']}")
    print(f"    Avg Authenticity: {dash_data['average_authenticity_score']}%")
    print(f"    Trend 7-day points: {len(dash_data['trend_history'])}")

    # 9. Test Unauthenticated Access Guard
    unauth_res = client.get("/dashboard/summary")
    print(f"[9] Unauthenticated Request Rejection: {unauth_res.status_code}")
    assert unauth_res.status_code == 401

    print("\n" + "=" * 60)
    print("ALL AUDIT SCENARIOS PASSED WITH 100% SUCCESS!")
    print("=" * 60)


if __name__ == "__main__":
    test_complete_system()
