from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os

router = APIRouter()

class SetupCompleteRequest(BaseModel):
    db: str
    host: str = None
    port: int = 5432
    database: str = None
    username: str = None
    password: str = None

@router.get("/status")
async def get_status():
    setup_complete = os.path.exists(".env")
    return {"setup_complete": setup_complete}

@router.post("/complete")
async def complete_setup(req: SetupCompleteRequest):
    if req.db == "sqlite":
        return {"message": "SQLite configured"}
    elif req.db == "postgres":
        if not all([req.host, req.database, req.username]):
            raise HTTPException(status_code=400, detail="Missing required fields")
        return {"message": "PostgreSQL configured"}
    raise HTTPException(status_code=400, detail="Invalid db type")

@router.post("/test-connection")
async def test_connection(req: SetupCompleteRequest):
    return {"success": True}
