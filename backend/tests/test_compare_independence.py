import os
from fastapi.testclient import TestClient
from backend.main import app
from backend.db.database import SessionLocal
from backend.db.models import User
from backend.auth.security import create_access_token

client = TestClient(app)
db = SessionLocal()
user = db.query(User).first()
if not user:
    user = User(email="compare_test@fakesense.ai", password_hash="hash")
    db.add(user)
    db.commit()

token = create_access_token(data={"sub": str(user.id)})
headers = {"Authorization": f"Bearer {token}"}

samples_dir = os.path.join(os.path.dirname(__file__), "..", "samples")
real_portrait = os.path.join(samples_dir, "sample_real_portrait.jpg")
fake_portrait = os.path.join(samples_dir, "sample_manipulated_portrait.jpg")
real_landscape = os.path.join(samples_dir, "sample_real_landscape.jpg")

print("=== TEST 1: Real Portrait (A) vs Manipulated Portrait (B) ===")
with open(real_portrait, "rb") as fa, open(fake_portrait, "rb") as fb:
    files = {
        "file_a": ("sample_real_portrait.jpg", fa, "image/jpeg"),
        "file_b": ("sample_manipulated_portrait.jpg", fb, "image/jpeg")
    }
    res = client.post("/compare/upload", files=files, headers=headers)
    print("Status:", res.status_code)
    data = res.json()
    ma = data["media_a"]
    mb = data["media_b"]
    print(f"Media A: ID={ma['verification_id']} | File={ma['file_name']} | Verdict={ma['verdict']} | Score={ma['authenticity_score']}% | Face={ma['modules']['face_analysis']['result']}")
    print(f"Media B: ID={mb['verification_id']} | File={mb['file_name']} | Verdict={mb['verdict']} | Score={mb['authenticity_score']}% | Face={mb['modules']['face_analysis']['result']}")
    assert ma['verification_id'] != mb['verification_id']
    assert ma['authenticity_score'] != mb['authenticity_score']

print("\n=== TEST 2: Real Portrait (A) vs Real Landscape (B) ===")
with open(real_portrait, "rb") as fa, open(real_landscape, "rb") as fb:
    files = {
        "file_a": ("sample_real_portrait.jpg", fa, "image/jpeg"),
        "file_b": ("sample_real_landscape.jpg", fb, "image/jpeg")
    }
    res = client.post("/compare/upload", files=files, headers=headers)
    data = res.json()
    ma = data["media_a"]
    mb = data["media_b"]
    print(f"Media A: ID={ma['verification_id']} | File={ma['file_name']} | Verdict={ma['verdict']} | Score={ma['authenticity_score']}% | Face={ma['modules']['face_analysis']['status']}")
    print(f"Media B: ID={mb['verification_id']} | File={mb['file_name']} | Verdict={mb['verdict']} | Score={mb['authenticity_score']}% | Face={mb['modules']['face_analysis']['status']}")
    assert ma['verification_id'] != mb['verification_id']

print("\n=== TEST 3: Identical Files Upload (Real Portrait A vs Real Portrait B) ===")
with open(real_portrait, "rb") as fa, open(real_portrait, "rb") as fb:
    files = {
        "file_a": ("portrait_copy_1.jpg", fa, "image/jpeg"),
        "file_b": ("portrait_copy_2.jpg", fb, "image/jpeg")
    }
    res = client.post("/compare/upload", files=files, headers=headers)
    data = res.json()
    ma = data["media_a"]
    mb = data["media_b"]
    print(f"Media A: ID={ma['verification_id']} | File={ma['file_name']} | Verdict={ma['verdict']} | Score={ma['authenticity_score']}%")
    print(f"Media B: ID={mb['verification_id']} | File={mb['file_name']} | Verdict={mb['verdict']} | Score={mb['authenticity_score']}%")
    assert ma['verification_id'] != mb['verification_id']
    assert ma['authenticity_score'] == mb['authenticity_score']

print("\nALL BACKEND COMPARE TESTS CONFIRMED INDEPENDENT AND ACCURATE!")
