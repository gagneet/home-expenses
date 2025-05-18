# backend/app/utils/pdf_utils.py
import logging
import re
import PyPDF2
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        Extracted text from the PDF
    """
    text = ""
    
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            num_pages = len(pdf_reader.pages)
            
            logger.info(f"PDF has {num_pages} pages")
            
            for page_num in range(num_pages):
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()
                
                # If page text extraction fails, try alternative methods
                if not page_text:
                    logger.warning(f"Standard text extraction failed for page {page_num+1}, trying alternative method")
                    # Alternative methods could be added here
                
                text += page_text + "\n\n"
                
                logger.debug(f"Extracted {len(page_text)} characters from page {page_num+1}")
    
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
    
    return text

def preprocess_commonwealth_bank_statement(text: str) -> str:
    """
    Preprocess Commonwealth Bank statement text to make it easier to parse.
    
    Args:
        text: Raw text extracted from PDF
        
    Returns:
        Preprocessed text
    """
    # Replace multiple spaces with a single space
    text = re.sub(r' {2,}', ' ', text)
    
    # Remove page breaks and headers that repeat on every page
    text = re.sub(r'Statement \d+ \(Page \d+ of \d+\)', '', text)
    
    # Standardize line endings
    text = re.sub(r'\r\n', '\n', text)
    
    # Handle continuation lines (lines that don't start with a date)
    lines = text.split('\n')
    processed_lines = []
    
    date_pattern = r'^\d{2} [A-Za-z]{3}'
    current_line = ""
    
    for line in lines:
        line = line.strip()
        if not line:
            if current_line:
                processed_lines.append(current_line)
                current_line = ""
            continue
            
        # If line starts with a date, it's a new transaction
        if re.match(date_pattern, line):
            if current_line:
                processed_lines.append(current_line)
            current_line = line
        else:
            # If it doesn't start with a date, it might be a continuation
            # But only append if it's not a header/footer
            if "Account Number" not in line and "Page" not in line and "Statement" not in line:
                if current_line:
                    current_line += " " + line
                else:
                    current_line = line
    
    # Add the last line if any
    if current_line:
        processed_lines.append(current_line)
    
    return '\n'.join(processed_lines)

def parse_commonwealth_bank_statement_pdf(pdf_path: str) -> Dict[str, Any]:
    """
    Parse a Commonwealth Bank statement PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        Parsed data including account information and transactions
    """
    # Extract text from PDF
    raw_text = extract_text_from_pdf(pdf_path)
    
    # Save raw text for debugging
    debug_path = pdf_path + ".raw.txt"
    with open(debug_path, 'w', encoding='utf-8') as f:
        f.write(raw_text)
    
    # Preprocess text
    processed_text = preprocess_commonwealth_bank_statement(raw_text)
    
    # Save processed text for debugging
    debug_path = pdf_path + ".processed.txt"
    with open(debug_path, 'w', encoding='utf-8') as f:
        f.write(processed_text)
    
    # Extract account information
    account_number = ""
    statement_period = ""
    closing_balance = 0.0
    
    account_match = re.search(r'Account Number\s+(\d{2}\s+\d{4}\s+\d{8})', raw_text)
    if account_match:
        account_number = account_match.group(1)
    
    period_match = re.search(r'Statement\s+Period\s+(.*?)(?:\n|Closing)', raw_text, re.DOTALL)
    if period_match:
        statement_period = period_match.group(1).strip()
    
    balance_match = re.search(r'Closing Balance\s+\$([\d,]+\.\d{2})\s+CR', raw_text)
    if balance_match:
        closing_balance = float(balance_match.group(1).replace(',', ''))
    
    # Extract transactions
    transactions = []
    
    # Find the transaction table
    transaction_section_match = re.search(r'Date\s+Transaction\s+Debit\s+Credit\s+Balance(.*?)(?:CLOSING BALANCE|Opening balance)', raw_text, re.DOTALL)
    transaction_section = transaction_section_match.group(1) if transaction_section_match else ""
    
    # Parse transactions
    if transaction_section:
        # Split into lines
        transaction_lines = transaction_section.strip().split('\n')
        
        for line in transaction_lines:
            # Parse transaction line
            date_match = re.match(r'(\d{2} [A-Za-z]{3})', line)
            if date_match:
                date = date_match.group(1)
                
                # Extract description (after date until debit or credit amount)
                desc_match = re.search(r'\d{2} [A-Za-z]{3}\s+(.*?)(?:\d+\.\d{2} \(|\$\d+\.\d{2})', line)
                description = desc_match.group(1).strip() if desc_match else ""
                
                # Extract debit amount
                debit_match = re.search(r'([\d,]+\.\d{2}) \(', line)
                debit = float(debit_match.group(1).replace(',', '')) if debit_match else None
                
                # Extract credit amount
                credit_match = re.search(r'\$([\d,]+\.\d{2})', line)
                credit = float(credit_match.group(1).replace(',', '')) if credit_match else None
                
                # Extract balance
                balance_match = re.search(r'\$([\d,]+\.\d{2}) CR$', line)
                balance = float(balance_match.group(1).replace(',', '')) if balance_match else None
                
                # Create transaction
                transaction = {
                    'date': date,
                    'description': description,
                    'debit': debit,
                    'credit': credit,
                    'balance': balance
                }
                
                transactions.append(transaction)
    
    # Return parsed data
    return {
        'account_number': account_number,
        'statement_period': statement_period,
        'closing_balance': closing_balance,
        'transactions': transactions
    }