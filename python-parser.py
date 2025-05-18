import os
import pandas as pd
import numpy as np
from typing import Dict, List, Any
import re
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class StatementParser:
    """Base class for all statement parsers"""
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.file_extension = os.path.splitext(file_path)[1].lower()
        self.transactions = []
        
    def parse(self) -> List[Dict[str, Any]]:
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

class BankAStatementParser(StatementParser):
    """Parser for Bank A statements (Excel format)"""
    
    def parse(self) -> List[Dict[str, Any]]:
        logger.info(f"Parsing Bank A statement: {self.file_path}")
        
        try:
            # Load Excel file with pandas
            df = pd.read_excel(self.file_path)
            
            # Identify the transactions table in the sheet
            # This assumes a specific structure for Bank A
            # Real implementation would need to handle variations
            transactions_start = 0
            for i, row in df.iterrows():
                if 'Date' in str(row.values) and 'Description' in str(row.values) and 'Amount' in str(row.values):
                    transactions_start = i + 1
                    header_row = i
                    break
            
            # Extract transactions using column names from header row
            transactions_df = pd.read_excel(
                self.file_path, 
                header=header_row,
                skiprows=lambda x: x < transactions_start
            )
            
            # Clean column names
            transactions_df.columns = [str(col).strip() for col in transactions_df.columns]
            
            # Extract only rows with valid dates
            transactions_df = transactions_df[transactions_df['Date'].notna()]
            
            # Convert to standardized format
            for _, row in transactions_df.iterrows():
                # Convert amount - bank statements often have credits as positive and debits as negative
                # This standardizes to: positive = income, negative = expense
                amount = float(row.get('Amount', 0))
                if 'Debit' in transactions_df.columns and pd.notna(row.get('Debit')):
                    amount = -float(row.get('Debit', 0))
                elif 'Credit' in transactions_df.columns and pd.notna(row.get('Credit')):
                    amount = float(row.get('Credit', 0))
                
                transaction = self.get_standardized_transaction(
                    date=row.get('Date'),
                    description=row.get('Description', ''),
                    amount=amount
                )
                
                self.transactions.append(transaction)
                
            logger.info(f"Successfully parsed {len(self.transactions)} transactions from Bank A statement")
            return self.transactions
            
        except Exception as e:
            logger.error(f"Error parsing Bank A statement: {str(e)}")
            raise

class BankBStatementParser(StatementParser):
    """Parser for Bank B statements (CSV format)"""
    
    def parse(self) -> List[Dict[str, Any]]:
        logger.info(f"Parsing Bank B statement: {self.file_path}")
        
        try:
            # Load CSV file with pandas
            df = pd.read_csv(self.file_path)
            
            # Different banks might use different column names
            # Map Bank B's column names to our standardized names
            column_mapping = {
                'Transaction Date': 'Date',
                'Transaction Description': 'Description',
                'Withdrawal Amount': 'Debit',
                'Deposit Amount': 'Credit'
            }
            
            # Rename columns according to our mapping
            df.rename(columns=column_mapping, inplace=True)
            
            # Convert to standardized format
            for _, row in df.iterrows():
                # Determine amount (positive for income, negative for expenses)
                amount = 0
                if pd.notna(row.get('Credit')):
                    amount = float(row.get('Credit', 0))
                if pd.notna(row.get('Debit')):
                    amount = -float(row.get('Debit', 0))
                
                transaction = self.get_standardized_transaction(
                    date=row.get('Date'),
                    description=row.get('Description', ''),
                    amount=amount
                )
                
                self.transactions.append(transaction)
                
            logger.info(f"Successfully parsed {len(self.transactions)} transactions from Bank B statement")
            return self.transactions
            
        except Exception as e:
            logger.error(f"Error parsing Bank B statement: {str(e)}")
            raise

class CreditCardStatementParser(StatementParser):
    """Parser for credit card statements (PDF format)"""
    
    def parse(self) -> List[Dict[str, Any]]:
        logger.info(f"Parsing Credit Card statement: {self.file_path}")
        
        try:
            # In a real implementation, you would use a PDF parsing library like tabula-py
            # For this example, we'll simulate parsing a PDF
            
            # Simulated transactions from a PDF
            # In a real implementation, this would come from parsing the PDF
            simulated_transactions = [
                {'date': '2023-05-01', 'description': 'GROCERY STORE 123', 'amount': -85.47},
                {'date': '2023-05-03', 'description': 'RESTAURANT XYZ', 'amount': -45.00},
                {'date': '2023-05-05', 'description': 'GAS STATION', 'amount': -35.25},
                {'date': '2023-05-10', 'description': 'ONLINE SHOPPING', 'amount': -129.99},
                {'date': '2023-05-15', 'description': 'PHARMACY', 'amount': -22.50},
            ]
            
            # Convert to standardized format
            for tx in simulated_transactions:
                transaction = self.get_standardized_transaction(
                    date=tx['date'],
                    description=tx['description'],
                    # Credit card transactions are typically negative (expenses)
                    amount=tx['amount']
                )
                
                self.transactions.append(transaction)
                
            logger.info(f"Successfully parsed {len(self.transactions)} transactions from Credit Card statement")
            return self.transactions
            
        except Exception as e:
            logger.error(f"Error parsing Credit Card statement: {str(e)}")
            raise

class TransactionCategorizer:
    """Categorizes transactions based on rules and patterns"""
    
    def __init__(self):
        # Define categorization rules
        # These rules would typically be loaded from a configuration file
        # and refined over time based on user feedback
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
    
    def categorize(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Categorize a list of transactions based on rules"""
        logger.info(f"Categorizing {len(transactions)} transactions")
        
        categorized_transactions = []
        
        for transaction in transactions:
            description = transaction['description'].lower()
            amount = transaction['amount']
            
            # Income is generally a positive amount
            if amount > 0:
                transaction['category'] = 'Income'
                categorized_transactions.append(transaction)
                continue
            
            # Try to match description to category rules
            matched = False
            for category, keywords in self.category_rules.items():
                if any(keyword.lower() in description for keyword in keywords):
                    transaction['category'] = category
                    matched = True
                    break
            
            # If no match, categorize as Other
            if not matched:
                transaction['category'] = 'Other'
                
            categorized_transactions.append(transaction)
            
        logger.info("Transaction categorization complete")
        return categorized_transactions

class FinancialSummary:
    """Generates financial summaries from categorized transactions"""
    
    def __init__(self, transactions: List[Dict[str, Any]]):
        self.transactions = transactions
        
    def generate_monthly_summary(self) -> Dict[str, Any]:
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
            }
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
        
        logger.info("Monthly financial summary generated successfully")
        return summary

class BankStatementProcessor:
    """Main processor class for handling bank statements"""
    
    def __init__(self):
        self.parsers = {
            '.xlsx': BankAStatementParser,
            '.xls': BankAStatementParser,
            '.csv': BankBStatementParser,
            '.pdf': CreditCardStatementParser
        }
        self.categorizer = TransactionCategorizer()
        self.transactions = []
        
    def process_statement(self, file_path: str) -> List[Dict[str, Any]]:
        """Process a single statement file"""
        logger.info(f"Processing statement: {file_path}")
        
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext not in self.parsers:
            logger.error(f"Unsupported file format: {file_ext}")
            raise ValueError(f"Unsupported file format: {file_ext}")
        
        # Create appropriate parser for the file
        parser = self.parsers[file_ext](file_path)
        
        # Parse the statement
        transactions = parser.parse()
        
        # Add to the full list of transactions
        self.transactions.extend(transactions)
        
        return transactions
    
    def process_statements(self, file_paths: List[str]) -> List[Dict[str, Any]]:
        """Process multiple statement files"""
        logger.info(f"Processing {len(file_paths)} statements")
        
        # Reset transactions list
        self.transactions = []
        
        # Process each statement
        for file_path in file_paths:
            self.process_statement(file_path)
        
        # Categorize all transactions
        self.transactions = self.categorizer.categorize(self.transactions)
        
        logger.info(f"Processed a total of {len(self.transactions)} transactions")
        return self.transactions
    
    def generate_summary(self) -> Dict[str, Any]:
        """Generate a financial summary from processed transactions"""
        if not self.transactions:
            logger.warning("No transactions to summarize")
            return {}
        
        # Create summary generator
        summary_generator = FinancialSummary(self.transactions)
        
        # Generate monthly summary
        return summary_generator.generate_monthly_summary()

# Example usage
if __name__ == "__main__":
    # In a real application, these would be uploaded files
    statements = [
        "bank_a_statement.xlsx",
        "bank_b_statement.csv",
        "credit_card_statement.pdf"
    ]
    
    # Create processor
    processor = BankStatementProcessor()
    
    # Process statements
    transactions = processor.process_statements(statements)
    
    # Generate summary
    summary = processor.generate_summary()
    
    # Print summary
    print("=== Financial Summary ===")
    print(f"Total Income: ${summary['total_income']:.2f}")
    print(f"Total Expenses: ${summary['total_expenses']:.2f}")
    print(f"Net Cashflow: ${summary['net_cashflow']:.2f}")
    
    print("\n=== Expenses by Category ===")
    for category, amount in sorted(summary['high_level_summary'].items(), key=lambda x: x[1], reverse=True):
        print(f"{category}: ${amount:.2f}")
