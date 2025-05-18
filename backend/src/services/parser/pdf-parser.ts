// backend/src/services/parser/pdf-parser.ts
import * as pdfParse from 'pdf-parse';
import { Transaction } from '../../models/transaction';
import { BankStatement, StatementType } from '../../types';

/**
 * Parser for Commonwealth Bank PDF statements
 */
export class CommonwealthPDFParser {
  /**
   * Extracts structured data from Commonwealth Bank PDF statements
   */
  public async parse(buffer: Buffer): Promise<BankStatement> {
    const data = await pdfParse(buffer);
    const text = data.text;
    
    // Extract account details
    const accountNumber = this.extractAccountNumber(text);
    const statementPeriod = this.extractStatementPeriod(text);
    const closingBalance = this.extractClosingBalance(text);
    
    // Extract transactions
    const transactions = this.extractTransactions(text);
    
    return {
      bankName: 'Commonwealth Bank',
      accountNumber,
      statementPeriod,
      closingBalance,
      transactions,
      type: StatementType.BANK,
      rawData: text
    };
  }
  
  private extractAccountNumber(text: string): string {
    // Example implementation based on Commonwealth Bank statement format
    const match = text.match(/Account Number\s+(\d{2}\s\d{4}\s\d{8})/);
    return match ? match[1].replace(/\s/g, '') : '';
  }
  
  private extractStatementPeriod(text: string): { start: Date, end: Date } {
    // Example implementation
    const match = text.match(/Statement\s+Period\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})\s+-\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})/);
    
    if (match) {
      return {
        start: new Date(match[1]),
        end: new Date(match[2])
      };
    }
    
    return { start: new Date(), end: new Date() };
  }
  
  private extractClosingBalance(text: string): number {
    const match = text.match(/Closing Balance\s+\$([0-9,.]+)\s+CR/);
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
  }
  
  private extractTransactions(text: string): Transaction[] {
    const transactions: Transaction[] = [];
    
    // Split text into lines
    const lines = text.split('\n');
    
    // Find the transaction section
    let transactionSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      // Detect the start of transaction list (usually after "Date Transaction Debit Credit Balance" header)
      if (lines[i].includes('Date') && lines[i].includes('Transaction') && 
          lines[i].includes('Debit') && lines[i].includes('Credit') && 
          lines[i].includes('Balance')) {
        transactionSection = true;
        continue;
      }
      
      // Stop processing once we're past transactions
      if (transactionSection && lines[i].includes('CLOSING BALANCE')) {
        break;
      }
      
      // Skip non-transaction lines
      if (!transactionSection || !lines[i].trim()) {
        continue;
      }
      
      // Parse transaction line
      const transaction = this.parseTransactionLine(lines[i]);
      if (transaction) {
        transactions.push(transaction);
      }
    }
    
    return transactions;
  }
  
  private parseTransactionLine(line: string): Transaction | null {
    // Example pattern for Commonwealth Bank statement transaction lines
    // Format: DD MMM YYYY Description Amount Balance
    const datePattern = /(\d{2}\s+[A-Za-z]{3})\s+/;
    const dateMatch = line.match(datePattern);
    
    if (!dateMatch) return null;
    
    // Extract date (assumes current year if not provided)
    const dateStr = dateMatch[1];
    const currentYear = new Date().getFullYear();
    const date = new Date(`${dateStr} ${currentYear}`);
    
    // Extract description (everything between date and amount)
    const descStart = line.indexOf(dateMatch[0]) + dateMatch[0].length;
    
    // Look for debit/credit amounts
    const debitMatch = line.match(/(\d{1,3}(,\d{3})*\.\d{2})\s+\(/);
    const creditMatch = line.match(/\$?(\d{1,3}(,\d{3})*\.\d{2})/);
    
    let amount = 0;
    let isDebit = false;
    
    if (debitMatch) {
      amount = parseFloat(debitMatch[1].replace(/,/g, ''));
      isDebit = true;
    } else if (creditMatch) {
      amount = parseFloat(creditMatch[1].replace(/,/g, ''));
      isDebit = false;
    }
    
    // Extract balance
    const balanceMatch = line.match(/\$?(\d{1,3}(,\d{3})*\.\d{2})\s+CR/);
    const balance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : 0;
    
    // Extract description
    let description = line.substring(descStart);
    
    // Trim description to remove amount and balance
    if (debitMatch) {
      description = description.substring(0, description.indexOf(debitMatch[0])).trim();
    } else if (creditMatch) {
      description = description.substring(0, description.indexOf(creditMatch[0])).trim();
    }
    
    return {
      date,
      description,
      amount: isDebit ? -amount : amount,
      balance,
      category: null, // Will be filled by categorizer
      raw: line
    };
  }
}

/**
 * Factory to create appropriate parser based on statement type
 */
export class PDFParserFactory {
  static createParser(bankName: string) {
    switch (bankName.toLowerCase()) {
      case 'commonwealth':
      case 'commbank':
        return new CommonwealthPDFParser();
      // Add other bank parsers
      default:
        throw new Error(`No parser available for bank: ${bankName}`);
    }
  }
}