import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore", 
        protected_namespaces=()
    )

    fl_server_host: str = "localhost"
    fl_server_port: int = 8080
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    num_rounds: int = 10
    num_clients: int = 3
    local_epochs: int = 2
    batch_size: int = 32
    learning_rate: float = 0.001
    data_type: str = "imaging"
    secret_key: str = "changethisinproduction"
    log_level: str = "INFO"
    metrics_file: str = "logs/metrics.json"
    model_save_path: str = "models/global_model.pt"
    cors_origins: str = "http://localhost:3000"

    # V22 FIX: Prevent secret_key from appearing in logs/repr
    def __repr__(self) -> str:
        fields = {k: v for k, v in self.__dict__.items() if k != 'secret_key'}
        fields['secret_key'] = '***REDACTED***'
        return f"Settings({fields})"

    def __str__(self) -> str:
        return self.__repr__()

    # V10 FIX: Validate metrics_file stays within allowed directory
    @field_validator('metrics_file')
    @classmethod
    def validate_metrics_path(cls, v):
        """Prevent path traversal — metrics_file must resolve inside logs/."""
        resolved = os.path.realpath(v)
        allowed_dir = os.path.realpath('logs')
        if not resolved.startswith(allowed_dir + os.sep) and resolved != allowed_dir:
            raise ValueError(f"metrics_file must be within the logs/ directory, got: {v}")
        return v

    # V10 FIX: Validate model_save_path stays within allowed directory
    @field_validator('model_save_path')
    @classmethod
    def validate_model_path(cls, v):
        """Prevent path traversal — model_save_path must resolve inside models/."""
        resolved = os.path.realpath(v)
        allowed_dir = os.path.realpath('models')
        if not resolved.startswith(allowed_dir + os.sep) and resolved != allowed_dir:
            raise ValueError(f"model_save_path must be within the models/ directory, got: {v}")
        return v


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings singleton."""
    return Settings()
