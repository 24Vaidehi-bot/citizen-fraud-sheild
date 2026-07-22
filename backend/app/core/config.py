"""
Centralized application configuration.
Values are loaded from environment variables / a .env file so the same
codebase can run unmodified across dev, staging and production.
"""
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Citizen Fraud Shield API"
    debug: bool = True
    api_prefix: str = "/api"

    cors_origins: str = "http://localhost:5173,http://localhost:3000,https://citizen-fraud-shield.vercel.app,https://citizen-fraud-sheild.vercel.app"

    upload_dir: str = "uploads"
    database_url: str = "sqlite:///./storage/fraud_shield.db"

    max_upload_mb: int = 8

    @property
    def cors_origin_list(self) -> List[str]:
        if not self.cors_origins or self.cors_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


    @property
    def upload_path(self) -> Path:
        path = Path(self.upload_dir)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance so the .env file is parsed once per process."""
    return Settings()
