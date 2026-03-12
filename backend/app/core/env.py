from pydantic_settings import BaseSettings,SettingsConfigDict
from typing import List, Union
import json
from pathlib import Path

ENV_FILE = Path(__file__).resolve().parent.parent.parent.parent / ".env"



class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_FILE), env_file_encoding="utf-8", extra="ignore")
    # Database — use full asyncpg URL directly, no conversion needed
    DATABASE_URL: str = "postgresql+asyncpg://user:password@db:5432/dairydrop"

    # Redis
    REDIS_URL: str = "redis://redis:6379"

    # Security
    SECRET_KEY: str = "supersecretkey_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # App
    ENVIRONMENT: str = ""

    STRIPE_SECRET_KEY: str = "sk_test_123"

    # Admin registration
    ADMIN_REGISTRATION_CODE: str = "ADMIN_CODE"

    # CORS — accepts either a JSON array string or comma-separated string
    CORS_ORIGINS: Union[str, List[str]] = '["http://localhost:3000","http://localhost"]'

    def get_cors_origins(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        raw = self.CORS_ORIGINS.strip()
        if raw.startswith("["):
            return json.loads(raw)
        return [o.strip() for o in raw.split(",") if o.strip()]

    # Loyalty
    POINTS_PER_DOLLAR: int = 10
    POINTS_TO_DOLLAR_RATE: int = 500


env = Settings()