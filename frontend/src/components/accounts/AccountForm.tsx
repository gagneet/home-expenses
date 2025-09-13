import React, { useState } from 'react';
import { AustralianBankingUtils } from '../../lib/australian-banking';
import { createAccount, NewAccountData } from '../../services/api';

interface AccountFormProps {
  onSubmitSuccess: (account: any) => void;
  onCancel: () => void;
}

type FormErrors = {
  general?: string;
  accountName?: string;
  accountNumber?: string;
  bsb?: string;
};

export default function AccountForm({ onSubmitSuccess, onCancel }: AccountFormProps) {
  const [formData, setFormData] = useState<NewAccountData>({
    accountName: '',
    accountNumber: '',
    bsb: '',
    accountType: 'checking', // Default value
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [bankInfo, setBankInfo] = useState<{ bankName: string | null } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBSBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const bsb = e.target.value;
    setFormData(prev => ({ ...prev, bsb }));

    if (bsb.length < 7) {
      setBankInfo(null);
      setErrors(prev => ({ ...prev, bsb: undefined }));
      return;
    }

    const validation = AustralianBankingUtils.validateBSB(bsb);
    if (validation.valid && validation.bank) {
      setBankInfo({ bankName: validation.bank });
      setErrors(prev => ({ ...prev, bsb: undefined }));
    } else {
      setErrors(prev => ({ ...prev, bsb: validation.error || 'Invalid BSB' }));
      setBankInfo(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    }
    const bsbValidation = AustralianBankingUtils.validateBSB(formData.bsb);
    if (!bsbValidation.valid) {
      newErrors.bsb = bsbValidation.error || 'Invalid BSB';
    }
    const accountValidation = AustralianBankingUtils.validateAccountNumber(formData.accountNumber);
    if (!accountValidation.valid) {
      newErrors.accountNumber = accountValidation.error || 'Invalid account number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await createAccount(formData);
      if (result.success) {
        onSubmitSuccess(result.account);
      } else {
        setErrors({ general: result.error || 'An unknown error occurred.' });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.details || error.message || 'Failed to create account. Please try again.';
      setErrors({ general: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800">Add New Bank Account</h2>

      {errors.general && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {errors.general}
        </div>
      )}

      <div>
        <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">Account Name</label>
        <input
          type="text"
          id="accountName"
          name="accountName"
          value={formData.accountName}
          onChange={handleInputChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
            errors.accountName ? 'border-red-500' : ''
          }`}
          placeholder="e.g., Everyday Banking"
        />
        {errors.accountName && <p className="mt-1 text-sm text-red-600">{errors.accountName}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="bsb" className="block text-sm font-medium text-gray-700">BSB</label>
          <input
            type="text"
            id="bsb"
            name="bsb"
            value={formData.bsb}
            onChange={handleBSBChange}
            placeholder="062-123"
            maxLength={7}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.bsb ? 'border-red-500' : ''
            }`}
          />
          {errors.bsb && <p className="mt-1 text-sm text-red-600">{errors.bsb}</p>}
          {bankInfo?.bankName && (
            <p className="mt-1 text-sm text-green-600 font-medium">✓ {bankInfo.bankName}</p>
          )}
        </div>

        <div>
          <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">Account Number</label>
          <input
            type="text"
            id="accountNumber"
            name="accountNumber"
            value={formData.accountNumber}
            onChange={handleInputChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.accountNumber ? 'border-red-500' : ''
            }`}
            placeholder="12345678"
          />
          {errors.accountNumber && <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="accountType" className="block text-sm font-medium text-gray-700">Account Type</label>
        <select
          id="accountType"
          name="accountType"
          value={formData.accountType}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="checking">Everyday Banking</option>
          <option value="savings">Savings Account</option>
          <option value="credit_card">Credit Card</option>
          <option disabled value="investment">Investment Account</option>
          <option disabled value="superannuation">Superannuation</option>
        </select>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-2 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Adding...' : 'Add Account'}
        </button>
      </div>
    </form>
  );
}
