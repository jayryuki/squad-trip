import os, uuid
from pathlib import Path
from fastapi import UploadFile
from app.core.config import settings

async def save_upload(file: UploadFile, subfolder: str = "general") -> str:
    """Saves file locally. Returns relative URL path."""
    dest = Path(settings.UPLOAD_DIR) / subfolder
    dest.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix
    filename = f"{uuid.uuid4().hex}{ext}"
    path = dest / filename
    content = await file.read()
    with open(path, "wb") as f:
        f.write(content)
    return f"/uploads/{subfolder}/{filename}"

async def delete_upload(url_path: str):
    """Deletes a file by its relative URL path."""
    full_path = Path(settings.UPLOAD_DIR).parent / url_path.lstrip("/")
    if full_path.exists():
        full_path.unlink()
