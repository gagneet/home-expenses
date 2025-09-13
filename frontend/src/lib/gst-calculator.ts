type GstTreatment = 'GST_INCLUSIVE' | 'GST_FREE' | 'INPUT_TAXED' | 'NOT_APPLICABLE';

interface GstCalculationResult {
  totalAmount: number;
  netAmount: number;
  gstAmount: number;
  gstRate: number;
}

export class GSTCalculator {
  static GST_RATE = 0.10; // 10% GST rate in Australia

  static calculateFromTotal(totalAmount: number | string, treatment: GstTreatment = 'GST_INCLUSIVE'): GstCalculationResult {
    const amount = typeof totalAmount === 'string' ? parseFloat(totalAmount) : totalAmount;

    if (isNaN(amount)) {
      // In a component, you might want to return a default state instead of throwing
      return { totalAmount: 0, netAmount: 0, gstAmount: 0, gstRate: 0 };
    }

    switch (treatment) {
      case 'GST_INCLUSIVE':
        const gstAmount = Math.round((amount / 11) * 100) / 100;
        const netAmount = Math.round((amount - gstAmount) * 100) / 100;
        return {
          totalAmount: amount,
          netAmount,
          gstAmount,
          gstRate: this.GST_RATE
        };

      case 'GST_FREE':
      case 'INPUT_TAXED':
      case 'NOT_APPLICABLE':
        return {
          totalAmount: amount,
          netAmount: amount,
          gstAmount: 0.00,
          gstRate: 0.00
        };

      default:
        return {
          totalAmount: amount,
          netAmount: amount,
          gstAmount: 0.00,
          gstRate: 0.00
        };
    }
  }

  static addGSTToNet(netAmount: number | string): GstCalculationResult {
    const net = typeof netAmount === 'string' ? parseFloat(netAmount) : netAmount;

    if (isNaN(net)) {
        return { totalAmount: 0, netAmount: 0, gstAmount: 0, gstRate: 0 };
    }

    const gstAmount = Math.round((net * this.GST_RATE) * 100) / 100;
    const totalAmount = Math.round((net + gstAmount) * 100) / 100;

    return {
      netAmount: net,
      gstAmount,
      totalAmount,
      gstRate: this.GST_RATE
    };
  }
}
