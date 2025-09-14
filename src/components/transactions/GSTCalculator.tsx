import React, { useState, useEffect } from 'react';
import { GSTCalculator } from '../../lib/gst-calculator';
import { processGst } from '../../services/api';

type GstTreatment = 'GST_INCLUSIVE' | 'GST_FREE' | 'INPUT_TAXED' | 'NOT_APPLICABLE';

interface GSTCalculatorComponentProps {
  transactionId: string;
  initialAmount: number;
  onGstProcessed: (updatedTransaction: any) => void;
}

interface GstCalculation {
  totalAmount: number;
  netAmount: number;
  gstAmount: number;
  gstRate: number;
}

export default function GSTCalculatorComponent({ transactionId, initialAmount, onGstProcessed }: GSTCalculatorComponentProps) {
  const [gstTreatment, setGstTreatment] = useState<GstTreatment>('GST_INCLUSIVE');
  const [calculation, setCalculation] = useState<GstCalculation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Automatically calculate when treatment or amount changes
    handleCalculate();
  }, [gstTreatment, initialAmount]);

  const handleCalculate = () => {
    const result = GSTCalculator.calculateFromTotal(initialAmount, gstTreatment);
    setCalculation(result);
  };

  const handleSaveChanges = async () => {
    if (!calculation) {
      setError("Please calculate GST first.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await processGst({
        transactionId,
        amount: initialAmount,
        gstTreatment,
      });

      if (result.success) {
        setSuccess('GST details saved successfully!');
        onGstProcessed(result.updatedTransaction);
      } else {
        setError(result.error || 'An unknown error occurred.');
      }
    } catch (err: any) {
      setError(err.response?.data?.details || err.message || 'Failed to save GST details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-3">GST Calculation</h3>

      <div className="space-y-4">
        <div>
          <label htmlFor="gstTreatment" className="block text-sm font-medium text-gray-700">GST Treatment</label>
          <select
            id="gstTreatment"
            value={gstTreatment}
            onChange={(e) => setGstTreatment(e.target.value as GstTreatment)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="GST_INCLUSIVE">GST Inclusive</option>
            <option value="GST_FREE">GST Free</option>
            <option value="INPUT_TAXED">Input Taxed</option>
            <option value="NOT_APPLICABLE">Not Applicable</option>
          </select>
        </div>

        {calculation && (
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-medium text-gray-800">${initialAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-gray-600">Net Amount (excl. GST):</span>
              <span className="font-medium text-gray-800">${calculation.netAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-600 font-semibold">GST Amount:</span>
              <span className="font-bold text-lg text-blue-600">${calculation.gstAmount.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="pt-2">
            <button
              onClick={handleSaveChanges}
              disabled={isSubmitting || !calculation}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save GST to Transaction'}
            </button>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
      </div>
    </div>
  );
}
