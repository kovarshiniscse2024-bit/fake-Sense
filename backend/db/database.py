from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os

DB_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(DB_DIR, "fakesense.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def run_db_migrations():
    """Ensure newly added columns exist in existing SQLite database files."""
    import sqlite3
    try:
        if os.path.exists(DB_PATH):
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(verifications)")
            columns = [col[1] for col in cursor.fetchall()]
            
            if "timeline_json" not in columns:
                cursor.execute("ALTER TABLE verifications ADD COLUMN timeline_json TEXT DEFAULT '[]'")
            if "performance_json" not in columns:
                cursor.execute("ALTER TABLE verifications ADD COLUMN performance_json TEXT DEFAULT '{}'")
            if "media_path" not in columns:
                cursor.execute("ALTER TABLE verifications ADD COLUMN media_path TEXT")
            if "thumbnail_path" not in columns:
                cursor.execute("ALTER TABLE verifications ADD COLUMN thumbnail_path TEXT")
            if "file_size" not in columns:
                cursor.execute("ALTER TABLE verifications ADD COLUMN file_size INTEGER")
            if "mime_type" not in columns:
                cursor.execute("ALTER TABLE verifications ADD COLUMN mime_type TEXT")
            if "width" not in columns:
                cursor.execute("ALTER TABLE verifications ADD COLUMN width INTEGER")
            if "height" not in columns:
                cursor.execute("ALTER TABLE verifications ADD COLUMN height INTEGER")
            if "duration" not in columns:
                cursor.execute("ALTER TABLE verifications ADD COLUMN duration REAL")
                
            # Migrations for password_reset_otps
            cursor.execute("PRAGMA table_info(password_reset_otps)")
            otp_cols = [col[1] for col in cursor.fetchall()]
            if otp_cols:
                if "otp_hash" not in otp_cols:
                    cursor.execute("ALTER TABLE password_reset_otps ADD COLUMN otp_hash TEXT")
                if "attempt_count" not in otp_cols:
                    cursor.execute("ALTER TABLE password_reset_otps ADD COLUMN attempt_count INTEGER DEFAULT 0")
                if "verified_at" not in otp_cols:
                    cursor.execute("ALTER TABLE password_reset_otps ADD COLUMN verified_at TIMESTAMP")
                if "used_at" not in otp_cols:
                    cursor.execute("ALTER TABLE password_reset_otps ADD COLUMN used_at TIMESTAMP")
                if "reset_token_hash" not in otp_cols:
                    cursor.execute("ALTER TABLE password_reset_otps ADD COLUMN reset_token_hash TEXT")
                if "reset_token_expires_at" not in otp_cols:
                    cursor.execute("ALTER TABLE password_reset_otps ADD COLUMN reset_token_expires_at TIMESTAMP")

            conn.commit()
            conn.close()
    except Exception as e:
        print(f"Migration notice: {e}")


run_db_migrations()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
