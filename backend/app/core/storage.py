import os, uuid
from pathlib import Path
from fastapi import UploadFile
from PIL import Image, ImageOps
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


def generate_thumbnail(
    image_paths: list[str],
    size: tuple[int, int] = (200, 200),
    output_prefix: str = "thumb",
) -> str | None:
    """Generate a collage thumbnail from multiple images. Returns relative URL path."""
    if not image_paths:
        return None

    dest = Path(settings.UPLOAD_DIR) / "thumbnails"
    dest.mkdir(parents=True, exist_ok=True)

    target_count = min(len(image_paths), 4)
    paths_to_use = image_paths[:target_count]

    thumbnails = []
    for path in paths_to_use:
        full_path = Path(settings.UPLOAD_DIR).parent / path.lstrip("/")
        if not full_path.exists():
            continue
        try:
            with Image.open(full_path) as img:
                img = ImageOps.fit(img, size, centering=(0.5, 0.5))
                thumbnails.append(img)
        except Exception:
            continue

    if not thumbnails:
        return None

    if len(thumbnails) == 1:
        filename = f"{output_prefix}.jpg"
        thumbnails[0].save(dest / filename, "JPEG", quality=85)
        return f"/uploads/thumbnails/{filename}"

    cols = 2
    rows = 2
    thumb_w, thumb_h = size
    collage = Image.new("RGB", (cols * thumb_w, rows * thumb_h), (255, 255, 255))

    for i, thumb in enumerate(thumbnails):
        row = i // cols
        col = i % cols
        collage.paste(thumb, (col * thumb_w, row * thumb_h))

    filename = f"{output_prefix}.jpg"
    collage.save(dest / filename, "JPEG", quality=85)
    return f"/uploads/thumbnails/{filename}"
