import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.v1.router import api_router
from app import models  # noqa: F401

app = FastAPI(title="Squad Trip API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Setup route — only active when no DB is configured
if not os.path.exists(".env") or not settings.DATABASE_URL:
    from app.api.setup import setup_router

    app.include_router(setup_router, prefix="/setup")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
