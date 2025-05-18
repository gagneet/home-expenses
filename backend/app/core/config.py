# app/core/config.py
from typing import List, Optional
from pydantic import BaseSettings, validator

class Settings(BaseSettings):
    APP_NAME: str = "Home Expenditure Calculator API"
    APP_DESCRIPTION: str = "API for processing bank and credit card statements to analyze expenses"
    APP_VERSION: str = "1.0.0"
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]  # In production, replace with specific origins,  default to allowing all origins
    
    # Parse CORS_ORIGINS from string to list if needed
    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            if v == "*":
                # Special case for wildcard
                return ["*"]
            # Split by comma if it's a comma-separated string
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    # AWS Configuration
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: str = "home-expenses-results"
    
    # Security
    API_KEY_NAME: str = "api_key"
    API_KEY: Optional[str] = None
    
    class Config:
        env_file = ".env"


settings = Settings()
