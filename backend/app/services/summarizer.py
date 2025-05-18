# backend/app/services/summarizer.py
import logging
from typing import List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class FinancialSummary:
    """Generates financial summaries from categorized transactions"""
    
    def __init__(self, transactions: List[Dict[str, Any]]):
        self.transactions = transactions
        
    async def generate_monthly_summary(self) -> Dict[str, Any]:
        """Generate a monthly summary from the transactions"""
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
            },
            'date_generated': datetime.now().isoformat()
        }
        
        # Process each transaction
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
        
        # Add percentage of total expenses for each category
        if summary['total_expenses'] > 0:
            summary['category_percentages'] = {}
            for category, amount in summary['high_level_summary'].items():
                summary['category_percentages'][category] = (amount / summary['total_expenses']) * 100
        
        logger.info("Monthly financial summary generated successfully")
        return summary
    
    async def generate_transaction_history(self) -> Dict[str, Any]:
        """Generate a chronological history of transactions"""
        logger.info("Generating transaction history")
        
        # Sort transactions by date
        sorted_transactions = sorted(
            self.transactions,
            key=lambda x: datetime.fromisoformat(str(x['date'])) if isinstance(x['date'], str) else x['date']
        )
        
        # Group by date
        transaction_history = {}
        for transaction in sorted_transactions:
            date_str = str(transaction['date'])
            if date_str not in transaction_history:
                transaction_history[date_str] = []
            
            transaction_history[date_str].append({
                'description': transaction['description'],
                'amount': transaction['amount'],
                'category': transaction['category']
            })
        
        logger.info("Transaction history generated successfully")
        return {'history': transaction_history}