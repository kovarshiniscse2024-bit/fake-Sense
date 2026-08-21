from backend.services.agent_chat import generate_agent_explanation

mock_context = {
    "verification_id": "VS-A1B2C3",
    "file_name": "test_portrait.jpg",
    "media_type": "image",
    "verdict": "Likely Real",
    "authenticity_score": 72,
    "confidence": 0.86,
    "coverage_factor": 0.75,
    "modules": {
        "visual_cnn": {"status": "completed", "suspicion_score": 0.12, "details": "Natural sensor noise covariance across color channels."},
        "face_analysis": {"status": "completed", "suspicion_score": 0.28, "details": "Facial boundary and skin-tone transitions show continuous blending.", "metrics": {"faces_found": 1, "face_instances": [{"bbox": [100, 80, 200, 200], "seam_score": 0.18, "color_mismatch": 0.22, "texture_discrepancy": 0.15}]}},
        "metadata": {"status": "completed", "suspicion_score": 0.08, "details": "Authentic camera hardware tags present (Canon EOS 5D).", "metrics": {"provenance_verified": True, "camera_tags_found": 2}}
    },
    "evidence": [
        {"id": "ev-1", "title": "Camera Provenance Intact", "description": "Verified physical camera hardware tags", "severity": "info"},
        {"id": "ev-2", "title": "Uniform Sensor Noise", "description": "Consistent Bayer CFA noise variance", "severity": "info"}
    ]
}

tests = [
    ("1. Greeting", "hi"),
    ("2. Casual Chat", "thanks"),
    ("3. Result Question", "why is this image real?"),
    ("4. Follow-up", "why?"),
    ("5. Module Pivot", "what about the face?"),
    ("6. Simplification", "explain that simply"),
    ("7. Score Meaning", "what does 72% mean?"),
    ("8. Certainty", "are you 100% sure?"),
    ("9. Expansion", "tell me more"),
    ("10. Comparison Guidance", "compare this with the other image"),
    ("11. Evidence Summary", "what did you find?"),
    ("12. Trust & Reliability", "can I trust this result?")
]

def run_all_tests():
    history = []
    for label, q in tests:
        ans = generate_agent_explanation(mock_context, q, history)
        print(f"=== {label} ===\nUser: {q}\nAI:\n{ans}\n")
        history.append({"role": "user", "content": q})
        history.append({"role": "assistant", "content": ans})

import sys
import io

if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

if __name__ == "__main__":
    run_all_tests()

