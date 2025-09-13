interface FrankingResult {
  cashDividend: number;
  frankedPortion: number;
  unfrankedPortion: number;
  frankingCredit: number;
  grossedUpDividend: number;
  totalAssessableIncome: number;
  frankingPercentage: number;
}

export class FrankingCreditsCalculator {
  static COMPANY_TAX_RATE = 0.30; // 30% company tax rate in Australia

  static calculate(dividendAmount: number | string, frankingPercentage: number | string): FrankingResult {
    const dividend = typeof dividendAmount === 'string' ? parseFloat(dividendAmount) : dividendAmount;
    const percentage = typeof frankingPercentage === 'string' ? parseFloat(frankingPercentage) : frankingPercentage;

    if (isNaN(dividend) || isNaN(percentage)) {
      throw new Error('Invalid dividend amount or franking percentage');
    }

    if (percentage > 100) {
      throw new Error('Franking percentage cannot exceed 100%');
    }

    const frankingRate = percentage / 100;

    // Calculate the franking credit
    const frankedPortion = dividend * frankingRate;
    // Gross-up formula: Gross-up Amount = Franked Dividend / (1 - Company Tax Rate)
    const grossedUpDividend = frankedPortion / (1 - this.COMPANY_TAX_RATE);
    const frankingCredit = Math.round((grossedUpDividend - frankedPortion) * 100) / 100;

    // Unfranked portion
    const unfrankedPortion = Math.round((dividend * (1 - frankingRate)) * 100) / 100;

    // Total assessable income for tax purposes
    const totalAssessable = Math.round((dividend + frankingCredit) * 100) / 100;

    return {
      cashDividend: dividend,
      frankedPortion: Math.round(frankedPortion * 100) / 100,
      unfrankedPortion,
      frankingCredit,
      grossedUpDividend: Math.round(grossedUpDividend * 100) / 100,
      totalAssessableIncome: totalAssessable,
      frankingPercentage: percentage
    };
  }
}
