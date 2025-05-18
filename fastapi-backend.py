from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import uuid
import logging
import asyncio
from typing import List, Dict, Any, Optional
import json
import boto3
from botocore.exceptions import ClientError
import pandas as pd
import numpy as np
from io import BytesIO
import tempfile
import shutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Home Expenditure Calculator API",
    description="API for processing bank and credit card statements to analyze expenses",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a temporary directory for uploads
UPLOAD_DIR = tempfile.mkdtemp()
logger.info(f"Created temporary upload directory: {UPLOAD_DIR}")

# AWS S3 client for storing processed results
try:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
        region_name=os.environ.get('AWS_REGION', 'us-east-1')
    )
    logger.info("AWS S3 client initialized successfully")
except Exception as e:
    logger.warning(f"Could not initialize AWS S3 client: {str(e)}")
    s3_client = None

# Import our processing modules
# Normally these would be in separate files, but for brevity they're included here
# These classes are similar to the ones in the Python parser artifact
class StatementParser:
    """Base class for all statement parsers"""
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.file_extension = os.path.splitext(file_path)[1].lower()
        self.transactions = []
        
    async def parse(self) -> List[Dict[str, Any]]:
        """Parse the statement file and return a list of standardized transactions"""
        raise NotImplementedError("Subclasses must implement this method")
        
    def get_standardized_transaction(self, date, description, amount, category=None) -> Dict[str, Any]:
        """Return a standardized transaction dictionary"""
        return {
            'date': date,
            'description': description,
            'amount': amount,
            'category': category,
            'source_file': os.path.basename(self.file_path)
        }

class ExcelStatementParser(StatementParser):
    """Parser for Excel format statements"""
    
    async def parse(self) -> List[Dict[str, Any]]:
        logger.info(f"Parsing Excel statement: {self.file_path}")
        
        try:
            # Read Excel file
            df = pd.read_excel(self.file_path)
            
            # Try to identify the transaction data
            # This is a simplified approach - production code would need more robust detection
            date_cols = [col for col in df.columns if 'date' in str(col).lower()]
            amount_cols = [col for col in df.columns if any(term in str(col).lower() for term in ['amount', 'debit', 'credit'])]
            desc_cols = [col for col in df.columns if any(term in str(col).lower() for term in ['desc', 'narration', 'particulars', 'detail'])]
            
            if not (date_cols and (amount_cols or (any('debit' in str(col).lower() for col in df.columns) and 
                                              any('credit' in str(col).lower() for col in df.columns))) and desc_cols):
                # If we can't identify columns easily, try to find the transaction table
                for i, row in df.iterrows():
                    if any('date' in str(cell).lower() for cell in row) and any('amount' in str(cell).lower() for cell in row):
                        # This might be the header row
                        header_row = i
                        df = pd.read_excel(self.file_path, header=header_row)
                        break
            
            # Clean column names and normalize
            df.columns = [str(col).strip() for col in df.columns]
            
            # Map common column names
            date_col = next((col for col in df.columns if 'date' in col.lower()), None)
            desc_col = next((col for col in df.columns if any(term in col.lower() for term in ['desc', 'narration', 'particulars', 'detail'])), None)
            
            # Handle amount columns - could be a single amount or separate debit/credit
            amount_col = next((col for col in df.columns if 'amount' in col.lower()), None)
            debit_col = next((col for col in df.columns if 'debit' in col.lower() or 'withdrawal' in col.lower()), None)
            credit_col = next((col for col in df.columns if 'credit' in col.lower() or 'deposit' in col.lower()), None)
            
            if not (date_col and (amount_col or (debit_col and credit_col)) and desc_col):
                logger.warning(f"Could not identify all required columns in {self.file_path}")
                return []
            
            # Extract transactions
            for _, row in df.iterrows():
                if pd.isna(row[date_col]):
                    continue
                    
                # Determine amount
                amount = 0
                if amount_col:
                    amount = float(row[amount_col]) if not pd.isna(row[amount_col]) else 0
                    # Some banks use negative for expenses, others use debit/credit columns
                    # We standardize to positive=income, negative=expense
                elif debit_col and credit_col:
                    debit = float(row[debit_col]) if not pd.isna(row[debit_col]) else 0
                    credit = float(row[credit_col]) if not pd.isna(row[credit_col]) else 0
                    amount = credit - debit  # Positive for income, negative for expenses
                
                transaction = self.get_standardized_transaction(
                    date=row[date_col],
                    description=str(row[desc_col]) if not pd.isna(row[desc_col]) else '',
                    amount=amount
                )
                
                self.transactions.append(transaction)
            
            logger.info(f"Successfully parsed {len(self.transactions)} transactions from Excel statement")
            return self.transactions
            
        except Exception as e:
            logger.error(f"Error parsing Excel statement: {str(e)}")
            raise

class CSVStatementParser(StatementParser):
    """Parser for CSV format statements"""
    
    async def parse(self) -> List[Dict[str, Any]]:
        logger.info(f"Parsing CSV statement: {self.file_path}")
        
        try:
            # Read CSV file
            df = pd.read_csv(self.file_path)
            
            # Map columns similar to Excel parser
            date_col = next((col for col in df.columns if 'date' in col.lower()), None)
            desc_col = next((col for col in df.columns if any(term in col.lower() for term in ['desc', 'narration', 'particulars', 'detail'])), None)
            
            # Handle amount columns - could be a single amount or separate debit/credit
            amount_col = next((col for col in df.columns if 'amount' in col.lower()), None)
            debit_col = next((col for col in df.columns if 'debit' in col.lower() or 'withdrawal' in col.lower()), None)
            credit_col = next((col for col in df.columns if 'credit' in col.lower() or 'deposit' in col.lower()), None)
            
            if not (date_col and (amount_col or (debit_col and credit_col)) and desc_col):
                logger.warning(f"Could not identify all required columns in {self.file_path}")
                return []
            
            # Extract transactions (similar to Excel parser)
            for _, row in df.iterrows():
                if pd.isna(row[date_col]):
                    continue
                    
                # Determine amount
                amount = 0
                if amount_col:
                    amount = float(row[amount_col]) if not pd.isna(row[amount_col]) else 0
                elif debit_col and credit_col:
                    debit = float(row[debit_col]) if not pd.isna(row[debit_col]) else 0
                    credit = float(row[credit_col]) if not pd.isna(row[credit_col]) else 0
                    amount = credit - debit
                
                transaction = self.get_standardized_transaction(
                    date=row[date_col],
                    description=str(row[desc_col]) if not pd.isna(row[desc_col]) else '',
                    amount=amount
                )
                
                self.transactions.append(transaction)
            
            logger.info(f"Successfully parsed {len(self.transactions)} transactions from CSV statement")
            return self.transactions
            
        except Exception as e:
            logger.error(f"Error parsing CSV statement: {str(e)}")
            raise

class PDFStatementParser(StatementParser):
    """Parser for PDF format statements"""
    
    async def parse(self) -> List[Dict[str, Any]]:
        logger.info(f"Parsing PDF statement: {self.file_path}")
        
        try:
            # In a real implementation, we'd use a library like tabula-py or PyPDF2
            # For this example, we'll simulate parsing with mock data
            
            # Mock transactions for demonstration
            mock_transactions = [
                {'date': '2023-05-01', 'description': 'GROCERY STORE 123', 'amount': -85.47},
                {'date': '2023-05-03', 'description': 'RESTAURANT XYZ', 'amount': -45.00},
                {'date': '2023-05-05', 'description': 'GAS STATION', 'amount': -35.25},
                {'date': '2023-05-10', 'description': 'ONLINE SHOPPING', 'amount': -129.99},
                {'date': '2023-05-15', 'description': 'PHARMACY', 'amount': -22.50},
            ]
            
            # Process mock transactions
            for tx in mock_transactions:
                transaction = self.get_standardized_transaction(
                    date=tx['date'],
                    description=tx['description'],
                    amount=tx['amount']
                )
                
                self.transactions.append(transaction)
                
            logger.info(f"Successfully parsed {len(self.transactions)} transactions from PDF statement")
            return self.transactions
            
        except Exception as e:
            logger.error(f"Error parsing PDF statement: {str(e)}")
            raise

class TransactionCategorizer:
    """Categorizes transactions based on predefined rules"""
    
    def __init__(self):
        # Define category rules - in production, these might be loaded from a database
        self.category_rules = {
            'Mortgage': ['mortgage', 'home loan', 'principal', 'interest'],
            'Investment Loans': ['investment loan', 'property loan'],
            'Car Loans': ['auto loan', 'car loan', 'vehicle finance'],
            'Groceries': ['supermarket', 'grocery', 'food', 'market'],
            'Fuel': ['petrol', 'gas station', 'fuel', 'shell', 'bp', 'caltex'],
            'Electricity': ['power', 'electric', 'energy'],
            'Water': ['water bill', 'utilities water'],
            'Internet': ['internet', 'broadband', 'nbn', 'fiber'],
            'Strata': ['strata', 'body corporate', 'owners corporation'],
            'Eating Out': ['restaurant', 'cafe', 'dining', 'takeaway', 'food delivery'],
            'Travel': ['airline', 'hotel', 'motel', 'accommodation', 'booking.com', 'airbnb'],
            'Income': ['salary', 'wage', 'deposit', 'interest earned']
        }
    
    async def categorize(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Categorize transactions based on rules"""
        logger.info(f"Categorizing {len(transactions)} transactions")
        
        categorized_transactions = []
        
        for transaction in transactions:
            description = transaction['description'].lower()
            amount = transaction['amount']
            
            # Income is generally positive
            if amount > 0:
                transaction['category'] = 'Income'
                categorized_transactions.append(transaction)
                continue
            
            # Match description to categories
            matched = False
            for category, keywords in self.category_rules.items():
                if any(keyword.lower() in description for keyword in keywords):
                    transaction['category'] = category
                    matched = True
                    break
            
            # Default category
            if not matched:
                transaction['category'] = 'Other'
                
            categorized_transactions.append(transaction)
            
        logger.info("Transaction categorization complete")
        return categorized_transactions

class FinancialSummary:
    """Generates financial summary from transactions"""
    
    def __init__(self, transactions: List[Dict[str, Any]]):
        self.transactions = transactions
        
    async def generate_monthly_summary(self) -> Dict[str, Any]:
        """Generate monthly financial summary"""
        logger.info("Generating monthly financial summary")
        
        # Initialize summary structure
        summary = {
            'total_income': 0,
            'total_expenses': 0,
            'net_cashflow': 0,
            'categories': {},
            'high_level_summary': {
                'Mortgage': 0,
                'Strata': 0,
                'Utilities': 0,  # Electricity + Water + Internet
                'Groceries': 0,
                'Eating Out': 0,
                'Travel': 0,
                'Others': 0
            }
        }
        
        # Process transactions
        for transaction in self.transactions:
            amount = transaction['amount']
            category = transaction['category']
            
            # Update totals
            if amount > 0:
                summary['total_income'] += amount
            else:
                summary['total_expenses'] += abs(amount)
            
            # Update category totals
            if category not in summary['categories']:
                summary['categories'][category] = 0
            summary['categories'][category] += amount if amount > 0 else abs(amount)
            
            # Update high-level summary
            if category in summary['high_level_summary']:
                summary['high_level_summary'][category] += abs(amount) if amount < 0 else 0
            elif category in ['Electricity', 'Water', 'Internet']:
                summary['high_level_summary']['Utilities'] += abs(amount) if amount < 0 else 0
            elif amount < 0:  # Only count expenses
                summary['high_level_summary']['Others'] += abs(amount)
        
        # Calculate net cashflow
        summary['net_cashflow'] = summary['total_income'] - summary['total_expenses']
        
        logger.info("Monthly financial summary generated successfully")
        return summary

class BankStatementProcessor:
    """Main processor for bank statements"""
    
    def __init__(self):
        self.parsers = {
            '.xlsx': ExcelStatementParser,
            '.xls': ExcelStatementParser,
            '.csv': CSVStatementParser,
            '.pdf': PDFStatementParser
        }
        self.categorizer = TransactionCategorizer()
        self.transactions = []
        
    async def process_statement(self, file_path: str) -> List[Dict[str, Any]]:
        """Process a single statement file"""
        logger.info(f"Processing statement: {file_path}")
        
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext not in self.parsers:
            logger.error(f"Unsupported file format: {file_ext}")
            raise ValueError(f"Unsupported file format: {file_ext}")
        
        # Create parser for this file type
        parser = self.parsers[file_ext](file_path)
        
        # Parse transactions
        transactions = await parser.parse()
        
        # Add to the transaction list
        self.transactions.extend(transactions)
        
        return transactions
    
    async def process_statements(self, file_paths: List[str]) -> List[Dict[str, Any]]:
        """Process multiple statement files"""
        logger.info(f"Processing {len(file_paths)} statements")
        
        # Reset transactions
        self.transactions = []
        
        # Process each file
        for file_path in file_paths:
            await self.process_statement(file_path)
        
        # Categorize all transactions
        self.transactions = await self.categorizer.categorize(self.transactions)
        
        logger.info(f"Processed a total of {len(self.transactions)} transactions")
        return self.transactions
    
    async def generate_summary(self) -> Dict[str, Any]:
        """Generate financial summary"""
        if not self.transactions:
            logger.warning("No transactions to summarize")
            return {}
        
        # Create summarizer
        summary_generator = FinancialSummary(self.transactions)
        
        # Generate and return summary
        return await summary_generator.generate_monthly_summary()

# API endpoints
@app.post("/upload/", response_model=Dict[str, Any])
async def upload_statements(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
):
    """
    Upload bank and credit card statements for processing
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    
    # Create session ID for this batch of files
    session_id = str(uuid.uuid4())
    session_dir = os.path.join(UPLOAD_DIR, session_id)
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
    background_tasks.add_task(process_statements_task, session_id, saved_files)
    
    return {
        "status": "processing",
        "message": "Files uploaded successfully. Processing started.",
        "session_id": session_id,
        "num_files": len(saved_files)
    }

@app.get("/status/{session_id}", response_model=Dict[str, Any])
async def check_processing_status(session_id: str):
    """
    Check the status of a processing session
    """
    # Check if result file exists
    result_path = os.path.join(UPLOAD_DIR, session_id, "result.json")
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
    error_path = os.path.join(UPLOAD_DIR, session_id, "error.txt")
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

@app.delete("/session/{session_id}", response_model=Dict[str, Any])
async def delete_session(session_id: str):
    """
    Delete a processing session and all its files
    """
    session_dir = os.path.join(UPLOAD_DIR, session_id)
    
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

# Background task for processing statements
async def process_statements_task(session_id: str, file_paths: List[str]):
    """Background task for processing bank statements"""
    logger.info(f"Starting background processing for session {session_id}")
    
    result_path = os.path.join(UPLOAD_DIR, session_id, "result.json")
    error_path = os.path.join(UPLOAD_DIR, session_id, "error.txt")
    
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
        
        # Upload to S3 if client is available
        if s3_client:
            try:
                s3_client.upload_file(
                    result_path,
                    os.environ.get('S3_BUCKET', 'home-expenses-results'),
                    f"{session_id}/result.json"
                )
                logger.info(f"Uploaded results to S3 for session {session_id}")
            except Exception as s3_error:
                logger.error(f"Error uploading to S3: {str(s3_error)}")
        
    except Exception as e:
        logger.error(f"Error processing statements for session {session_id}: {str(e)}")
        
        # Save error to file
        with open(error_path, "w") as f:
            f.write(f"Error processing statements: {str(e)}")

# Cleanup function to run when the application shuts down
@app.on_event("shutdown")
async def cleanup():
    """Clean up temporary files on shutdown"""
    try:
        shutil.rmtree(UPLOAD_DIR)
        logger.info(f"Cleaned up temporary directory: {UPLOAD_DIR}")
    except Exception as e:
        logger.error(f"Error cleaning up temporary directory: {str(e)}")

# Main entry point
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
