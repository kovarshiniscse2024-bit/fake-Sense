import os
import aiofiles
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from ..db.models import User
from ..utils.file_validation import detect_file_type, validate_file_size
from ..utils.security import sanitize_filename, generate_safe_filepath
from ..utils.cleanup import safe_remove_files
from .agent import VerificationAgent

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


async def execute_media_verification(
    file: UploadFile,
    current_user: User,
    db: Session
) -> dict:
    """
    Unified, single verification execution service.
    Directly reused by both 'Verify Media' and 'Compare Mode' pipelines.
    No separate or duplicate verification logic exists.
    """
    safe_name = sanitize_filename(file.filename or "media")
    
    # Read initial chunk to detect MIME and header magic numbers
    header_bytes = await file.read(2048)
    if not header_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    try:
        media_type, _ = detect_file_type(header_bytes, safe_name)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Generate isolated safe path with unique UUID
    unique_id, temp_path = generate_safe_filepath(UPLOAD_DIR, safe_name)
    total_bytes = len(header_bytes)

    try:
        async with aiofiles.open(temp_path, "wb") as f:
            await f.write(header_bytes)
            while chunk := await file.read(1024 * 1024):
                total_bytes += len(chunk)
                await f.write(chunk)

        # Validate total file size limits
        validate_file_size(total_bytes, media_type)

        # Execute full FakeSense agentic verification pipeline
        agent = VerificationAgent(db)
        result = agent.orchestrate_verification(
            file_path=temp_path,
            original_filename=safe_name,
            media_type=media_type,
            user=current_user
        )

        return result

    finally:
        # Retention cleanup: purge temporary disk file immediately after extraction
        safe_remove_files([temp_path])
