# backend/app/api/endpoints.py
import os
import uuid
import json
import shutil
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, File, UploadFile, BackgroundTasks, HTTPException, Depends
from fastapi.responses import JSONResponse

from app.core.security import get_api_key
from app.services.processor import BankStatementProcessor
from app.utils.aws import aws_client

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/upload/", response_model=Dict[str, Any])
async def upload_statements(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    api_key: bool = Depends(get_api_key)
):
    """
    Upload bank and credit card statements for processing
    """
    from fastapi import Request
    
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    
    # Get app instance to access upload directory
    request = Request.scope["app"]
    upload_dir = request.state.upload_dir
    
    # Create session ID for this batch of files
    session_id = str(uuid.uuid4())
    session_dir = os.path.join(upload_dir, session_id)
    os.makedirs(session_dir, exist_ok=True)
    
    logger.info(f"Created processing session {session_id}")
    
    # Save uploaded files to disk
    saved_files = []
    for file in files:
        file_path = os.path.join(session_dir, file.filename)
        
        # Check file type
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ['.xlsx', '.xls', '.csv', '.pdf']:
            continue
        
        # Save the file
        try:
            with open(file_path, "wb") as f:
                shutil.copyfileobj(file.file, f)
            saved_files.append(file_path)
            logger.info(f"Saved {file.filename} to {file_path}")
        except Exception as e:
            logger.error(f"Error saving {file.filename}: {str(e)}")
            continue
    
    if not saved_files:
        raise HTTPException(status_code=400, detail="No valid files uploaded")
    
    # Process files in the background
    background_tasks.add_task(process_statements_task, session_id, session_dir, saved_files)
    
    return {
        "status": "processing",
        "message": "Files uploaded successfully. Processing started.",
        "session_id": session_id,
        "num_files": len(saved_files)
    }


@router.get("/status/{session_id}", response_model=Dict[str, Any])
async def check_processing_status(session_id: str, api_key: bool = Depends(get_api_key)):
    """
    Check the status of a processing session
    """
    from fastapi import Request
    
    # Get app instance to access upload directory
    request = Request.scope["app"]
    upload_dir = request.state.upload_dir
    
    # Check if result file exists
    result_path = os.path.join(upload_dir, session_id, "result.json")
    if os.path.exists(result_path):
        try:
            with open(result_path, "r") as f:
                result = json.load(f)
            return {
                "status": "completed",
                "result": result
            }
        except Exception as e:
            logger.error(f"Error reading result file: {str(e)}")
            return {
                "status": "error",
                "message": "Error reading processing results"
            }
    
    # Check if error file exists
    error_path = os.path.join(upload_dir, session_id, "error.txt")
    if os.path.exists(error_path):
        try:
            with open(error_path, "r") as f:
                error_message = f.read()
            return {
                "status": "error",
                "message": error_message
            }
        except Exception:
            return {
                "status": "error",
                "message": "An unknown error occurred during processing"
            }
    
    # Check if results are in DynamoDB if not found locally
    dynamodb_result = aws_client.get_result_from_dynamodb(session_id)
    if dynamodb_result:
        return {
            "status": "completed",
            "result": dynamodb_result
        }
    
    # Still processing
    return {
        "status": "processing",
        "message": "Files are still being processed"
    }


@router.delete("/session/{session_id}", response_model=Dict[str, Any])
async def delete_session(session_id: str, api_key: bool = Depends(get_api_key)):
    """
    Delete a processing session and all its files
    """
    from fastapi import Request
    
    # Get app instance to access upload directory
    request = Request.scope["app"]
    upload_dir = request.state.upload_dir
    
    session_dir = os.path.join(upload_dir, session_id)
    
    if not os.path.exists(session_dir):
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        shutil.rmtree(session_dir)
        logger.info(f"Deleted session {session_id}")
        return {
            "status": "success",
            "message": f"Session {session_id} deleted successfully"
        }
    except Exception as e:
        logger.error(f"Error deleting session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting session")


@router.get("/health", response_model=Dict[str, str])
async def health_check():
    """
    Simple health check endpoint
    """
    return {"status": "healthy"}


# Background task for processing statements
async def process_statements_task(session_id: str, session_dir: str, file_paths: List[str]):
    """Background task for processing bank statements"""
    logger.info(f"Starting background processing for session {session_id}")
    
    result_path = os.path.join(session_dir, "result.json")
    error_path = os.path.join(session_dir, "error.txt")
    
    try:
        # Create processor
        processor = BankStatementProcessor()
        
        # Process statements
        await processor.process_statements(file_paths)
        
        # Generate summary
        summary = await processor.generate_summary()
        
        # Save result to file
        with open(result_path, "w") as f:
            json.dump(summary, f)
        
        logger.info(f"Processing completed for session {session_id}")
        
        # Upload to S3 and save to DynamoDB
        aws_client.upload_to_s3(result_path, f"{session_id}/result.json")
        aws_client.save_result_to_dynamodb(session_id, summary)
        
    except Exception as e:
        logger.error(f"Error processing statements for session {session_id}: {str(e)}")
        
        # Save error to file
        with open(error_path, "w") as f:
            f.write(f"Error processing statements: {str(e)}")