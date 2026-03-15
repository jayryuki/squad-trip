from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/squad-trip.db"
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_USE_OPENSSL_RAND_HEX_32"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:4173"]
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 20
    SETUP_COMPLETE: bool = False

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
