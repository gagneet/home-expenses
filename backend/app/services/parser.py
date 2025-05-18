# backend/app/services/parser.py
import os
import pandas as pd
import logging
from typing import List, Dict, Any
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class StatementParser(ABC):
    """Base class for all statement parsers"""
    
    def __init__(self, file_path: str):
        """Initialize with file path"""
        self.file_path = file_path
        self.file_extension = os.path.splitext(file_path)[1].lower()
        self.transactions = []
        
    @abstractmethod
    async def parse(self) -> List[Dict[str, Any]]:
        """Parse the statement file and return a list of standardized transactions"""
        pass
        
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
    """Parser for Excel format bank statements"""
    
    async def parse(self) -> List[Dict[str, Any]]:
        """Parse an Excel bank statement"""
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
    """Parser for CSV format bank statements"""
    
    async def parse(self) -> List[Dict[str, Any]]:
        """Parse a CSV bank statement"""
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
    """Parser for PDF format credit card statements"""
    
    async def parse(self) -> List[Dict[str, Any]]:
        """Parse a PDF credit card statement"""
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


def get_parser(file_path: str) -> StatementParser:
    """Factory function to get the appropriate parser for a file"""
    file_ext = os.path.splitext(file_path)[1].lower()
    
    if file_ext in ['.xlsx', '.xls']:
        return ExcelStatementParser(file_path)
    elif file_ext == '.csv':
        return CSVStatementParser(file_path)
    elif file_ext == '.pdf':
        return PDFStatementParser(file_path)
    else:
        raise ValueError(f"Unsupported file format: {file_ext}")