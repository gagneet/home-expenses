import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadStatements, fetchAccounts } from '../../services/api';
import { BankOption, Account } from '../../types';

interface FileUploadProps {
  onUploadComplete: (data: any) => void;
  onError: (error: Error) => void;
}

const bankOptions: BankOption[] = [
  { id: 'commbank', name: 'Commonwealth Bank', logo: '/banks/commbank.png' },
  { id: 'anz', name: 'ANZ Bank', logo: '/banks/anz.png' },
  { id: 'westpac', name: 'Westpac', logo: '/banks/westpac.png' },
  { id: 'nab', name: 'National Australia Bank', logo: '/banks/nab.png' },
  { id: 'other', name: 'Other Bank', logo: '/banks/other.png' },
];

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete, onError }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const userAccounts = await fetchAccounts();
        setAccounts(userAccounts);
      } catch (error) {
        console.error('Failed to fetch accounts', error);
        // Optionally, show an error message to the user
      }
    };
    loadAccounts();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    }
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0 || !selectedBank || !accountId) {
      return;
    }

    setUploading(true);

    try {
      const data = await uploadStatements(files, selectedBank, accountId);
      onUploadComplete(data);
    } catch (error) {
      onError(error as Error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Bank Statements</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Your Bank
        </label>
        <div className="grid grid-cols-3 gap-3">
          {bankOptions.map(bank => (
            <div 
              key={bank.id}
              className={`border rounded-lg p-3 flex flex-col items-center cursor-pointer transition-colors
                ${selectedBank === bank.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
              onClick={() => setSelectedBank(bank.id)}
            >
              <img src={bank.logo} alt={bank.name} className="h-10 w-auto mb-2" />
              <span className="text-sm text-center">{bank.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Account
        </label>
        <select
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          disabled={accounts.length === 0}
        >
          <option value="">Select an account</option>
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.account_name} ({account.account_number})
            </option>
          ))}
        </select>
      </div>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
      >
        <input {...getInputProps()} />
        <p>Drag 'n' drop some files here, or click to select files</p>
        <p className="text-xs text-gray-500">
            Only PDF files are allowed
        </p>
      </div>
      
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold">Files:</h4>
          <ul>
            {files.map((file, i) => (
              <li key={i} className="flex justify-between items-center">
                <span>{file.name}</span>
                <button onClick={() => removeFile(i)} className="text-red-500">Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-6">
        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0 || !accountId || !selectedBank}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>
  );
};

export default FileUpload;