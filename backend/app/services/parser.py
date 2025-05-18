# backend/app/services/parser.py
import re
import pandas as pd
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class StatementParser:
    """Base class for parsing bank statements"""
    
    def __init__(self):
        self.transactions = []
        
    def parse(self, content: str) -> List[Dict[str, Any]]:
        """Parse the content of a bank statement"""
        raise NotImplementedError("Subclasses must implement this method")
    
    def get_standardized_transaction(self, date: str, description: str, 
                                    amount: float, transaction_type: str, 
                                    balance: Optional[float] = None) -> Dict[str, Any]:
        """Return a standardized transaction dictionary"""
        return {
            'date': date,
            'description': description,
            'amount': amount,
            'type': transaction_type,  # 'debit' or 'credit'
            'balance': balance,
            'category': self.categorize_transaction(description)
        }
    
    def categorize_transaction(self, description: str) -> str:
        """Categorize a transaction based on its description"""
        # Convert to lowercase for case-insensitive matching
        desc_lower = description.lower()
        
        # Define categories and their keywords
        categories = {
            "Salary": ["salary", "pay", "aris zinc", "az pay"],
            "Mortgage": ["home loan", "loan", "mortgage", "sierra settlement"],
            "Investment": ["investment", "saving", "86 400", "sandhurst"],
            "Credit Card": ["cr card", "credit card", "autopay", "american express", "amex"],
            "Utilities": ["electric", "water", "gas", "internet", "broadband"],
            "Groceries": ["coles", "woolworths", "aldi", "grocery", "supermarket"],
            "Dining Out": ["restaurant", "cafe", "eating", "lunch", "dinner", "sankalp"],
            "Transportation": ["fuel", "petrol", "gas station", "uber", "taxi", "transport"],
            "Cash Withdrawal": ["atm", "withdrawal", "wdl"],
            "Loans & Debts": ["nimble", "debt", "dt.", "interest"],
            "Transfers": ["transfer to", "payto", "fast transfer"],
            "Travel": ["hotel", "flight", "airbnb", "booking", "travel", "skiing"],
            "Remittances": ["remitly", "state bank of india", "eremit", "remit", "wise sydney"],
            "International": ["remitly", "wise", "nashville", "melbourne au aus"],
            "Healthcare": ["medical", "doctor", "hospital", "dentist", "pharmacy", "medicare"],
            "Strata & Property": ["strata", "cleaning", "carpet", "jimʼs", "jim's"],
            "Government": ["ato", "centrelink", "child support", "ccs"],
            "Insurance": ["insurance", "chubb"],
            "Banking Fees": ["fee", "charge", "interest charged"]
        }
        
        # Check each category
        for category, keywords in categories.items():
            if any(keyword in desc_lower for keyword in keywords):
                return category
        
        # Default category
        return "Other Expenses"


class CommonwealthBankParser(StatementParser):
    """Parser for Commonwealth Bank statements"""
    
    def parse(self, content: str) -> Dict[str, Any]:
        """Parse a Commonwealth Bank statement"""
        lines = content.split('\n')
        transactions = []
        
        # Extract statement information
        account_number = ""
        statement_period = ""
        closing_balance = 0.0
        
        # Parse statement header information
        for i in range(min(20, len(lines))):
            line = lines[i]
            if "Account Number" in line:
                account_number = line.split("Account Number")[1].strip()
            if "Statement Period" in line:
                period_text = line.split("Period")[1] if "Period" in line else ""
                statement_period = period_text.strip() if period_text else ""
            if "Closing Balance" in line:
                balance_match = re.search(r'\$[\d,]+\.\d{2} CR', line)
                if balance_match:
                    balance_str = balance_match.group(0)
                    closing_balance = float(balance_str.replace("$", "").replace(",", "").replace(" CR", ""))
        
        # Find where the transaction table starts
        transaction_start_index = 0
        for i, line in enumerate(lines):
            if ("Date" in line and "Transaction" in line and 
                "Debit" in line and "Credit" in line and 
                "Balance" in line):
                transaction_start_index = i + 1
                break
        
        # Process transaction lines
        current_date = ""
        current_transaction = None
        
        for i in range(transaction_start_index, len(lines)):
            line = lines[i].strip()
            
            # Skip empty lines or headers or footers
            if (not line or "Closing balance" in line or "Total debits" in line or
                "Opening balance" in line or (line.startswith("Statement") and "Page" in line) or 
                "CLOSING BALANCE" in line):
                current_transaction = None
                continue
            
            # Check if the line starts with a date (DD MMM)
            date_pattern = r'^\d{2} [A-Za-z]{3}'
            date_match = re.match(date_pattern, line)
            
            if date_match:
                # This is a new transaction
                date = date_match.group(0)
                
                # Extract balance (at the end of the line)
                balance_pattern = r'\$[\d,]+\.\d{2} CR$'
                balance_match = re.search(balance_pattern, line)
                balance = None
                if balance_match:
                    balance_str = balance_match.group(0)
                    balance = float(balance_str.replace("$", "").replace(",", "").replace(" CR", ""))
                
                # Extract debit amount (number followed by open parenthesis)
                debit_pattern = r'[\d,]+\.\d{2} \('
                debit_match = re.search(debit_pattern, line)
                debit = None
                if debit_match:
                    debit_str = debit_match.group(0)
                    debit = float(debit_str.replace(" (", "").replace(",", ""))
                
                # Extract credit amount (dollar amount with $ sign)
                credit = None
                credit_pattern = r'\$[\d,]+\.\d{2}'
                credit_matches = re.finditer(credit_pattern, line)
                
                credit_matches_list = list(credit_matches)
                if credit_matches_list:
                    # Check if the match is not the balance
                    potential_credit = credit_matches_list[0].group(0)
                    is_balance = line.endswith("CR") and f"{potential_credit} CR" in line
                    
                    if not is_balance or len(credit_matches_list) > 1:
                        # Use the first match if it's not the balance or there are multiple matches
                        credit = float(potential_credit.replace("$", "").replace(",", ""))
                
                # Extract description (everything between date and amounts)
                description = ""
                if date:
                    date_index = line.find(date) + len(date)
                    
                    # Find the end of the description
                    end_index = len(line)
                    
                    if debit_match:
                        end_index = line.find(debit_match.group(0))
                    elif credit is not None:
                        credit_str = f"${credit:,.2f}"
                        if line.find(credit_str) > date_index:
                            end_index = line.find(credit_str)
                    elif balance_match:
                        end_index = line.find(balance_match.group(0))
                    
                    description = line[date_index:end_index].strip()
                
                # Create and add the transaction
                if debit:
                    transaction = self.get_standardized_transaction(
                        date=date,
                        description=description,
                        amount=debit,
                        transaction_type="debit",
                        balance=balance
                    )
                    current_transaction = transaction
                    transactions.append(transaction)
                elif credit:
                    transaction = self.get_standardized_transaction(
                        date=date,
                        description=description,
                        amount=credit,
                        transaction_type="credit",
                        balance=balance
                    )
                    current_transaction = transaction
                    transactions.append(transaction)
            
            elif current_transaction:
                # This might be a continuation of the previous transaction's description
                current_transaction['description'] += " " + line
                # Update category based on the full description
                current_transaction['category'] = self.categorize_transaction(current_transaction['description'])
        
        # Return statement information and transactions
        return {
            "account_number": account_number,
            "statement_period": statement_period,
            "closing_balance": closing_balance,
            "transactions": transactions
        }


class StatementAnalyzer:
    """Analyzes transactions to generate financial summaries"""
    
    def analyze(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate financial summary from transactions"""
        summary = {
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
        }
        
        # Process all transactions
        for transaction in transactions:
            if transaction['type'] == 'credit':
                # Income
                summary['total_income'] += transaction['amount']
                
                # Add to category summary
                category = transaction['category']
                if category not in summary['category_summary']:
                    summary['category_summary'][category] = {'income': 0.0, 'expenses': 0.0}
                
                summary['category_summary'][category]['income'] += transaction['amount']
            
            elif transaction['type'] == 'debit':
                # Expenses
                summary['total_expenses'] += transaction['amount']
                
                # Add to category summary
                category = transaction['category']
                if category not in summary['category_summary']:
                    summary['category_summary'][category] = {'income': 0.0, 'expenses': 0.0}
                
                summary['category_summary'][category]['expenses'] += transaction['amount']
                
                # Map to high-level summary
                if category == "Mortgage":
                    summary['high_level_summary']['Mortgage'] += transaction['amount']
                elif category == "Strata & Property":
                    summary['high_level_summary']['Strata'] += transaction['amount']
                elif category == "Utilities":
                    summary['high_level_summary']['Utilities'] += transaction['amount']
                elif category == "Groceries":
                    summary['high_level_summary']['Groceries'] += transaction['amount']
                elif category == "Dining Out":
                    summary['high_level_summary']['Eating Out'] += transaction['amount']
                elif category == "Travel":
                    summary['high_level_summary']['Travel'] += transaction['amount']
                else:
                    summary['high_level_summary']['Others'] += transaction['amount']
        
        # Calculate net cashflow
        summary['net_cashflow'] = summary['total_income'] - summary['total_expenses']
        
        return summary


class StatementProcessor:
    """Main processor for bank statements"""
    
    def __init__(self):
        self.parsers = {
            'commonwealth': CommonwealthBankParser()
            # Add more parsers for other banks as needed
        }
        self.analyzer = StatementAnalyzer()
    
    def detect_bank(self, content: str) -> str:
        """Detect which bank the statement is from"""
        content_lower = content.lower()
        
        if 'commonwealth bank' in content_lower or 'commbank' in content_lower:
            return 'commonwealth'
        
        # Default to Commonwealth Bank parser for now
        return 'commonwealth'
    
    def process(self, content: str) -> Dict[str, Any]:
        """Process a bank statement"""
        # Detect bank
        bank = self.detect_bank(content)
        
        # Parse statement
        if bank in self.parsers:
            parser = self.parsers[bank]
            parsed_data = parser.parse(content)
            
            # Analyze transactions
            summary = self.analyzer.analyze(parsed_data['transactions'])
            
            # Combine results
            result = {
                'bank': bank,
                'account_number': parsed_data['account_number'],
                'statement_period': parsed_data['statement_period'],
                'closing_balance': parsed_data['closing_balance'],
                'summary': summary,
                'transactions': parsed_data['transactions']
            }
            
            return result
        else:
            logger.error(f"No parser available for bank type: {bank}")
            raise ValueError(f"Unsupported bank type: {bank}")