import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from ..auth.dependencies import get_current_user
from ..db.models import User
from ..utils.file_validation import detect_file_type, validate_file_size

router = APIRouter(prefix="/upload", tags=["Upload Validation"])


@router.post("/validate")
async def validate_upload(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    header = await file.read(2048)
    await file.seek(0)

    try:
        media_type, normalized_format = detect_file_type(header, file.filename or "unknown")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "status": "valid",
        "file_name": file.filename,
        "media_type": media_type,
        "format": normalized_format
    }
