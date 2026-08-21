import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from backend.main import app
from backend.db.database import Base, engine

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield


def test_ai_verification_agent_chat_flow():
    # 1. Register and Login
    email = "agent.tester@fakesense.ai"
    password = "SecurePassword123!"
    reg_res = client.post("/auth/register", json={"email": email, "password": password})
    if reg_res.status_code == 400:
        login_res = client.post("/auth/login", json={"email": email, "password": password})
        token = login_res.json()["access_token"]
    else:
        token = reg_res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Perform a verification to produce real context
    img = Image.new("RGB", (256, 256), color=(200, 180, 170))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    buf.seek(0)

    v_res = client.post("/verify", files={"file": ("test_portrait.jpg", buf, "image/jpeg")}, headers=headers)
    assert v_res.status_code == 200
    v_data = v_res.json()
    verification_id = v_data["verification_id"]
    verdict = v_data["verdict"]

    # 3. Test Question: General Verdict Explanation
    chat_req_1 = {
        "verification_id": verification_id,
        "question": f"Why is this {v_data['media_type']} classified as {verdict}?",
    }
    chat_res_1 = client.post("/api/agent/chat", json=chat_req_1, headers=headers)
    assert chat_res_1.status_code == 200
    ans_1 = chat_res_1.json()["answer"]
    assert len(ans_1) > 50
    assert verdict in ans_1 or "assessment" in ans_1.lower()

    # 4. Test Question: What evidence was found?
    chat_req_2 = {
        "verification_id": verification_id,
        "question": "What evidence did you find?",
        "conversation_history": [
            {"role": "user", "content": chat_req_1["question"]},
            {"role": "assistant", "content": ans_1}
        ]
    }
    chat_res_2 = client.post("/api/agent/chat", json=chat_req_2, headers=headers)
    assert chat_res_2.status_code == 200
    ans_2 = chat_res_2.json()["answer"]
    assert "evidence" in ans_2.lower() or "module" in ans_2.lower()

    # 5. Test Question: Strongest contributing signal
    chat_req_3 = {
        "verification_id": verification_id,
        "question": "Which analysis detected the strongest problem?",
    }
    chat_res_3 = client.post("/api/agent/chat", json=chat_req_3, headers=headers)
    assert chat_res_3.status_code == 200
    ans_3 = chat_res_3.json()["answer"]
    assert len(ans_3) > 30

    # 6. Test Question: Explain in simple English (Simplified Mode)
    chat_req_4 = {
        "verification_id": verification_id,
        "question": "Explain this in simple English for a non-technical user.",
    }
    chat_res_4 = client.post("/api/agent/chat", json=chat_req_4, headers=headers)
    assert chat_res_4.status_code == 200
    ans_4 = chat_res_4.json()["answer"]
    assert "simple" in ans_4.lower() or "ai" in ans_4.lower()

    # 7. Test Question: Explain in detail (Structured Audit Mode)
    chat_req_5 = {
        "verification_id": verification_id,
        "question": "Explain in detail with a structured report.",
    }
    chat_res_5 = client.post("/api/agent/chat", json=chat_req_5, headers=headers)
    assert chat_res_5.status_code == 200
    ans_5 = chat_res_5.json()["answer"]
    assert "verdict" in ans_5.lower() or "authenticity" in ans_5.lower() or "confidence" in ans_5.lower()

    # 8. Test Question: Certainty & Definiteness Check
    chat_req_6 = {
        "verification_id": verification_id,
        "question": "Is it 100% definitely fake or real?",
    }
    chat_res_6 = client.post("/api/agent/chat", json=chat_req_6, headers=headers)
    assert chat_res_6.status_code == 200
    ans_6 = chat_res_6.json()["answer"]
    assert "100%" in ans_6 or "probabilistic" in ans_6.lower() or "not" in ans_6.lower()

    # 9. Test Security: Unauthenticated request must return 401
    unauth_res = client.post("/api/agent/chat", json=chat_req_1)
    assert unauth_res.status_code == 401
