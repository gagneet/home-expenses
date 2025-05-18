# backend/app/core/config.py
from pydantic import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Home Expenditure Calculator API"
    APP_DESCRIPTION: str = "API for processing bank and credit card statements to analyze expenses"
    APP_VERSION: str = "1.0.0"
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]  # In production, replace with specific origins
    
    # AWS Configuration
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: str = "finance-calculator-results"
    
    # Security
    API_KEY_NAME: str = "api_key"
    API_KEY: str = None
    
    class Config:
        env_file = ".env"


settings = Settings()
