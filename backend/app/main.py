from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import tempfile
import shutil
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create a temporary directory for uploads
UPLOAD_DIR = tempfile.mkdtemp()
logger.info(f"Created temporary directory for uploads: {UPLOAD_DIR}")

# Create FastAPI app
app = FastAPI(
    title="Home Expenditure Calculator API",
    description="API for processing bank statements and analyzing expenses",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
from app.api.endpoints import router as api_router
app.include_router(api_router, prefix="/api/v1")

# Make upload directory available to other modules
app.state.upload_dir = UPLOAD_DIR

# Cleanup function to run when the application shuts down
@app.on_event("shutdown")
async def cleanup():
    """Clean up temporary files on shutdown"""
    try:
        shutil.rmtree(UPLOAD_DIR)
        logger.info(f"Cleaned up temporary directory: {UPLOAD_DIR}")
    except Exception as e:
        logger.error(f"Error cleaning up temporary directory: {str(e)}")

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to the Home Expenditure Calculator API"}