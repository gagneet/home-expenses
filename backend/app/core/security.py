# backend/app/core/security.py
from fastapi import Security, HTTPException, status
from fastapi.security.api_key import APIKeyHeader
from starlette.status import HTTP_403_FORBIDDEN
import os

API_KEY_NAME = "X-API-Key"
API_KEY = os.environ.get("API_KEY")

api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    """
    Validate API key if security is enabled
    """
    # If API_KEY is not set in environment, no authentication is required
    if API_KEY is None:
        return True
    
    if api_key_header == API_KEY:
        return True
    else:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Invalid API Key",
        )