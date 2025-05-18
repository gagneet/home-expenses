# backend/app/api/endpoints.py - Updated version with PDF support
import os
import uuid
import json
import shutil
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, File, UploadFile, BackgroundTasks, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
import PyPDF2
import io

from app.services.parser import StatementProcessor
from app.core.security import get_api_key

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/upload/", response_model=Dict[str, Any])
async def upload_statements(
    request: Request,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    api_key: bool = Depends(get_api_key)
):
    """
    Upload bank and credit card statements for processing
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    
    # Get upload directory from app state
    upload_dir = request.app.state.upload_dir
    
    # Create session ID for this batch of files
    session_id = str(uuid.uuid4())
    session_dir = os.path.join(upload_dir, session_id)
    os.makedirs(session_dir, exist_ok=True)
    
    logger.info(f"Created processing session {session_id}")
    
    # Save uploaded files to disk
    saved_files = []
    for file in files:
        file_path = os.path.join(session_dir, file.filename)
        
        # Check file type (accept only text-based files and PDFs)
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ['.txt', '.pdf', '.csv']:
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
async def check_processing_status(
    request: Request, 
    session_id: str, 
    api_key: bool = Depends(get_api_key)
):
    """
    Check the status of a processing session
    """
    # Get upload directory from app state
    upload_dir = request.app.state.upload_dir
    
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
    
    # Still processing
    return {
        "status": "processing",
        "message": "Files are still being processed"
    }


@router.delete("/session/{session_id}", response_model=Dict[str, Any])
async def delete_session(
    request: Request, 
    session_id: str, 
    api_key: bool = Depends(get_api_key)
):
    """
    Delete a processing session and all its files
    """
    # Get upload directory from app state
    upload_dir = request.app.state.upload_dir
    
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


# Extract text from PDF file
def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file"""
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page_num in range(len(pdf_reader.pages)):
                text += pdf_reader.pages[page_num].extract_text()
    except Exception as e:
        logger.error(f"Error extracting text from PDF {pdf_path}: {str(e)}")
    return text


# Background task for processing statements
async def process_statements_task(session_id: str, session_dir: str, file_paths: List[str]):
    """Background task for processing bank statements"""
    logger.info(f"Starting background processing for session {session_id}")
    
    result_path = os.path.join(session_dir, "result.json")
    error_path = os.path.join(session_dir, "error.txt")
    
    try:
        # Initialize processor
        processor = StatementProcessor()
        
        # Process each file
        all_results = []
        for file_path in file_paths:
            try:
                # Check file extension
                file_ext = os.path.splitext(file_path)[1].lower()
                
                # Read and process file content
                if file_ext == '.pdf':
                    # Extract text from PDF
                    content = extract_text_from_pdf(file_path)
                    if not content:
                        raise Exception(f"Could not extract text from PDF file: {file_path}")
                else:
                    # Read text file
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                
                # Debug: Write extracted content to a file for inspection
                debug_content_path = os.path.join(session_dir, f"{os.path.basename(file_path)}.txt")
                with open(debug_content_path, "w", encoding="utf-8") as f:
                    f.write(content)
                
                # Process content
                result = processor.process(content)
                all_results.append(result)
                
                # Debug: Write processing result to a file for inspection
                debug_result_path = os.path.join(session_dir, f"{os.path.basename(file_path)}.json")
                with open(debug_result_path, "w", encoding="utf-8") as f:
                    json.dump(result, f, cls=JsonEncoder, indent=2)
                
            except Exception as e:
                logger.error(f"Error processing file {file_path}: {str(e)}")
                # Continue with other files
        
        if not all_results:
            raise Exception("No files were successfully processed")
        
        # Combine results from all files
        combined_result = combine_results(all_results)
        
        # Save result to file
        with open(result_path, "w") as f:
            json.dump(combined_result, f, cls=JsonEncoder, indent=2)
        
        logger.info(f"Processing completed for session {session_id}")
        
    except Exception as e:
        logger.error(f"Error processing statements for session {session_id}: {str(e)}")
        
        # Save error to file
        with open(error_path, "w") as f:
            f.write(f"Error processing statements: {str(e)}")


def combine_results(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Combine results from multiple statements"""
    if not results:
        return {}
    
    # Initialize combined result
    combined = {
        "accounts": [],
        "summary": {
            "total_income": 0.0,
            "total_expenses": 0.0,
            "net_cashflow": 0.0,
            "category_summary": {},
            "high_level_summary": {
                "Mortgage": 0.0,
                "Strata": 0.0,
                "Utilities": 0.0,
                "Groceries": 0.0,
                "Eating Out": 0.0,
                "Travel": 0.0,
                "Others": 0.0
            }
        },
        "transactions": []
    }
    
    # Combine accounts
    for result in results:
        account_info = {
            "bank": result.get("bank", "Unknown"),
            "account_number": result.get("account_number", "Unknown"),
            "statement_period": result.get("statement_period", "Unknown"),
            "closing_balance": result.get("closing_balance", 0.0)
        }
        
        # Check if account already exists
        if not any(acc.get("account_number") == account_info["account_number"] for acc in combined["accounts"]):
            combined["accounts"].append(account_info)
    
    # Combine transactions
    all_transactions = []
    for result in results:
        all_transactions.extend(result.get("transactions", []))
    
    # Sort transactions by date
    combined["transactions"] = sorted(all_transactions, key=lambda x: x.get("date", ""))
    
    # Combine summary
    for result in results:
        summary = result.get("summary", {})
        
        # Add totals
        combined["summary"]["total_income"] += summary.get("total_income", 0.0)
        combined["summary"]["total_expenses"] += summary.get("total_expenses", 0.0)
        
        # Combine category summary
        for category, data in summary.get("category_summary", {}).items():
            if category not in combined["summary"]["category_summary"]:
                combined["summary"]["category_summary"][category] = {"income": 0.0, "expenses": 0.0}
            
            combined["summary"]["category_summary"][category]["income"] += data.get("income", 0.0)
            combined["summary"]["category_summary"][category]["expenses"] += data.get("expenses", 0.0)
        
        # Combine high-level summary
        for category, amount in summary.get("high_level_summary", {}).items():
            if category in combined["summary"]["high_level_summary"]:
                combined["summary"]["high_level_summary"][category] += amount
    
    # Calculate net cashflow
    combined["summary"]["net_cashflow"] = combined["summary"]["total_income"] - combined["summary"]["total_expenses"]
    
    return combined


class JsonEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle non-serializable types"""
    def default(self, obj):
        if isinstance(obj, (set, frozenset)):
            return list(obj)
        return super().default(obj)