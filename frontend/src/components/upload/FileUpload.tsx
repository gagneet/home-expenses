// frontend/src/components/upload/FileUpload.tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadStatements } from '../../services/api';
import { BankOption } from '../../types';

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
  const [accountId, setAccountId] = useState<string>(''); // Assuming accountId is needed for upload

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    }
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0 || !selectedBank || !accountId) {
      // Add a check for accountId
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
      
      {/* Bank Selection */}
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
      
      {/* Account ID */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Account ID
        </label>
        <input
          type="text"
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          placeholder="Enter the account ID for this statement"
        />
      </div>
      
      {/* File Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-gray-600">
            Drag and drop your statement files here, or click to select files
          </p>
          <p className="text-xs text-gray-500">
            Supports PDF, CSV, XLS, and XLSX files
          </p>
        </div>
      </div>
      
      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files</h3>
          <ul className="divide-y divide-gray-200 border rounded-md overflow-hidden">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between p-3 hover:bg-gray-50">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm truncate max-w-xs">{file.name}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Upload Button */}
      <div className="mt-6">
        <button
          type="button"
          onClick={handleUpload}
          disabled={files.length === 0 || !selectedBank || uploading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${files.length === 0 || !selectedBank ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
        >
          {uploading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </span>
          ) : (
            'Upload Statements'
          )}
        </button>
      </div>
    </div>
  );
};

export default FileUpload;