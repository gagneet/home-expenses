# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import tempfile
import shutil
import logging

from app.core.config import settings
from app.api.endpoints import router as api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create a temporary directory for uploads
UPLOAD_DIR = tempfile.mkdtemp()
logger.info(f"Created temporary upload directory: {UPLOAD_DIR}")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")

# Cleanup function to run when the application shuts down
@app.on_event("shutdown")
async def cleanup():
    """Clean up temporary files on shutdown"""
    try:
        shutil.rmtree(UPLOAD_DIR)
        logger.info(f"Cleaned up temporary directory: {UPLOAD_DIR}")
    except Exception as e:
        logger.error(f"Error cleaning up temporary directory: {str(e)}")

# Make upload directory available to other modules
app.state.upload_dir = UPLOAD_DIR
