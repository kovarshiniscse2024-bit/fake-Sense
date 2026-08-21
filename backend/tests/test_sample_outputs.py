import os
import glob
from backend.services.agent import VerificationAgent
from backend.db.database import SessionLocal, Base, engine
from backend.db.models import User, Verification

Base.metadata.create_all(bind=engine)
db = SessionLocal()
user = db.query(User).first()
if not user:
    user = User(email="test@fakesense.ai", password_hash="hash")
    db.add(user)
    db.commit()

agent = VerificationAgent(db)
samples = glob.glob("backend/samples/*")
print("Found samples:", samples)

for s in samples:
    media_type = "video" if s.endswith(".mp4") else "image"
    res = agent.orchestrate_verification(s, os.path.basename(s), media_type, user)
    print(f"[{res['file_name']}] ID={res['verification_id']} Score={res['authenticity_score']}% Verdict={res['verdict']} Vis={res['modules'].get('visual_cnn',{}).get('suspicion_score')} Face={res['modules'].get('face_analysis',{}).get('suspicion_score')} Meta={res['modules'].get('metadata',{}).get('suspicion_score')}")
