from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.storage import save_upload
from app.api.deps import get_current_user, get_trip_member
from app.models.user import User
from app.models.trip import TripMember
from app.models.document import Document

router = APIRouter()


class DocumentCreateRequest(BaseModel):
    name: str
    file_url: str
    file_type: Optional[str] = None


class DocumentResponse(BaseModel):
    id: int
    name: str
    file_url: str
    file_type: Optional[str]
    uploaded_by_user_id: int
    created_at: str

    class Config:
        from_attributes = True


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(select(Document).where(Document.trip_id == trip_id))
    documents = result.scalars().all()

    return [
        DocumentResponse(
            id=d.id,
            name=d.name,
            file_url=d.file_url,
            file_type=d.file_type,
            uploaded_by_user_id=d.uploaded_by_user_id,
            created_at=d.created_at.isoformat(),
        )
        for d in documents
    ]


@router.post("", response_model=DocumentResponse)
async def create_document(
    trip_id: int,
    name: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    member: TripMember = Depends(get_trip_member),
):
    file_url = await save_upload(file, f"trips/{trip_id}/documents")
    file_type = file.content_type
    document = Document(
        trip_id=trip_id,
        name=name,
        file_url=file_url,
        file_type=file_type,
        uploaded_by_user_id=current_user.id,
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)
    return DocumentResponse(
        id=document.id,
        name=document.name,
        file_url=document.file_url,
        file_type=document.file_type,
        uploaded_by_user_id=document.uploaded_by_user_id,
        created_at=document.created_at.isoformat(),
    )


@router.delete("/{document_id}")
async def delete_document(
    trip_id: int,
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.trip_id == trip_id)
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    await db.delete(document)
    await db.commit()
    return {"message": "Document deleted"}
