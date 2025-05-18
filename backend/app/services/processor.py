# backend/app/services/processor.py
import logging
import os
from typing import List, Dict, Any

from app.services.parser import get_parser
from app.services.categorizer import TransactionCategorizer
from app.services.summarizer import FinancialSummary

logger = logging.getLogger(__name__)


class BankStatementProcessor:
    """Main processor for bank statements"""
    
    def __init__(self):
        self.categorizer = TransactionCategorizer()
        self.transactions = []
        
    async def process_statement(self, file_path: str) -> List[Dict[str, Any]]:
        """Process a single statement file"""
        logger.info(f"Processing statement: {file_path}")
        
        # Get appropriate parser for the file
        try:
            parser = get_parser(file_path)
            
            # Parse transactions
            transactions = await parser.parse()
            
            # Add to the transaction list
            self.transactions.extend(transactions)
            
            return transactions
        except Exception as e:
            logger.error(f"Error processing statement {file_path}: {str(e)}")
            raise
    
    async def process_statements(self, file_paths: List[str]) -> List[Dict[str, Any]]:
        """Process multiple statement files"""
        logger.info(f"Processing {len(file_paths)} statements")
        
        # Reset transactions
        self.transactions = []
        
        # Process each file
        for file_path in file_paths:
            if os.path.exists(file_path):
                await self.process_statement(file_path)
            else:
                logger.warning(f"File does not exist: {file_path}")
        
        # Categorize all transactions
        if self.transactions:
            self.transactions = await self.categorizer.categorize(self.transactions)
        
        logger.info(f"Processed a total of {len(self.transactions)} transactions")
        return self.transactions
    
    async def generate_summary(self) -> Dict[str, Any]:
        """Generate financial summary"""
        if not self.transactions:
            logger.warning("No transactions to summarize")
            return {}
        
        # Create summary generator
        summary_generator = FinancialSummary(self.transactions)
        
        # Generate monthly summary
        summary = await summary_generator.generate_monthly_summary()
        
        # Also include transaction history
        history = await summary_generator.generate_transaction_history()
        summary['transaction_history'] = history['history']
        
        return summary