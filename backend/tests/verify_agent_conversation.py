import httpx
import os
import json

BASE_URL = "http://127.0.0.1:8000"
SAMPLES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "samples")


def test_agent_dialogue():
    print("=" * 65)
    print("FAKESENSE AI VERIFICATION AGENT CONVERSATIONAL AUDIT")
    print("=" * 65)

    client = httpx.Client(base_url=BASE_URL, timeout=30.0)

    # 1. Login
    email = "researcher@fakesense.ai"
    password = "SecurePassword123!"
    login_res = client.post("/auth/login", json={"email": email, "password": password})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[1] Auth: Successfully logged in as researcher.")

    # 2. Verify Manipulated Portrait
    manip_path = os.path.join(SAMPLES_DIR, "sample_manipulated_portrait.jpg")
    with open(manip_path, "rb") as f:
        v_res = client.post("/verify", files={"file": ("sample_manipulated_portrait.jpg", f, "image/jpeg")}, headers=headers)
    assert v_res.status_code == 200
    v_data = v_res.json()
    v_id = v_data["verification_id"]
    print(f"[2] Media Verified: ID={v_id} | Verdict={v_data['verdict']} | Score={v_data['authenticity_score']}% | Confidence={v_data['confidence']}")

    # 3. Conversational Multi-Turn Test (Section 3 & 21)
    conversation_history = []

    questions = [
        "Why is this photo fake?",
        "Which analysis detected the strongest problem?",
        "What does that mean?",
        "Can you explain that in simple English?",
        "Explain in detail",
        "Is it definitely fake?"
    ]

    for i, q in enumerate(questions):
        print(f"\n--- Turn {i+1} ---")
        print(f"User: {q}")
        req = {
            "verification_id": v_id,
            "question": q,
            "conversation_history": conversation_history
        }
        res = client.post("/api/agent/chat", json=req, headers=headers)
        assert res.status_code == 200, f"Error on turn {i+1}: {res.text}"
        ans = res.json()["answer"]
        print(f"[Agent]:\n{ans}")

        # Update history
        conversation_history.append({"role": "user", "content": q})
        conversation_history.append({"role": "assistant", "content": ans})

    # 4. Test Authentic Image Context Dialogue
    real_path = os.path.join(SAMPLES_DIR, "sample_real_portrait.jpg")
    with open(real_path, "rb") as f:
        v_real_res = client.post("/verify", files={"file": ("sample_real_portrait.jpg", f, "image/jpeg")}, headers=headers)
    assert v_real_res.status_code == 200
    real_data = v_real_res.json()
    real_id = real_data["verification_id"]
    print(f"\n[4] Real Media Verified: ID={real_id} | Verdict={real_data['verdict']} | Score={real_data['authenticity_score']}%")

    req_real = {
        "verification_id": real_id,
        "question": "Why did you classify this as real?"
    }
    res_real = client.post("/api/agent/chat", json=req_real, headers=headers)
    assert res_real.status_code == 200
    print(f"\nUser: Why did you classify this as real?")
    print(f"[Agent]:\n{res_real.json()['answer']}")


    print("\n" + "=" * 65)
    print("ALL AI AGENT CONVERSATIONAL SCENARIOS PASSED WITH 100% SUCCESS!")
    print("=" * 65)


if __name__ == "__main__":
    test_agent_dialogue()
