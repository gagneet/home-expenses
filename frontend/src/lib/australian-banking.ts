export class AustralianBankingUtils {
  static BSB_RANGES: { [key: string]: { start: number; end: number }[] } = {
    'Commonwealth Bank': [
      { start: 62000, end: 62999 },
      { start: 64000, end: 64999 }
    ],
    'ANZ': [
      { start: 13000, end: 13999 }
    ],
    'Westpac': [
      { start: 3000, end: 3999 },
      { start: 32000, end: 36999 }
    ],
    'NAB': [
      { start: 8000, end: 8999 },
      { start: 82000, end: 87999 }
    ],
    'ING': [
      { start: 92000, end: 92999 }
    ]
  };

  static validateBSB(bsb: string | null | undefined): { valid: boolean; error: string | null; bank: string | null } {
    if (!bsb) return { valid: true, error: null, bank: null }; // Allow null BSB in some cases, but form will require it.

    const bsbRegex = /^\d{3}-\d{3}$/;
    if (!bsbRegex.test(bsb)) {
      return { valid: false, error: 'BSB must be in format XXX-XXX', bank: null };
    }

    const bank = this.identifyBankByBSB(bsb);

    return {
      valid: bank !== null,
      error: bank ? null : 'BSB not recognized',
      bank: bank
    };
  }

  static identifyBankByBSB(bsb: string): string | null {
    if (!bsb) return null;

    const bsbNumber = parseInt(bsb.replace('-', ''), 10);
    if (isNaN(bsbNumber)) return null;

    for (const [bankName, ranges] of Object.entries(this.BSB_RANGES)) {
      for (const range of ranges) {
        if (bsbNumber >= range.start && bsbNumber <= range.end) {
          return bankName;
        }
      }
    }
    return null;
  }

  static validateAccountNumber(accountNumber: string | null | undefined, bsb: string | null = null): { valid: boolean; error: string | null; cleanNumber: string | null } {
    if (!accountNumber || accountNumber.trim() === '') {
      return { valid: false, error: 'Account number is required', cleanNumber: null };
    }

    const cleanNumber = accountNumber.replace(/[\s-]/g, '');

    if (!/^\d{4,10}$/.test(cleanNumber)) {
      return {
        valid: false,
        error: 'Account number must be 4-10 digits',
        cleanNumber: null
      };
    }

    return { valid: true, error: null, cleanNumber };
  }
}
