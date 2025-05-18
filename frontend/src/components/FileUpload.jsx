// frontend/src/components/FileUpload.jsx
import React, { useState, useRef } from 'react';

const FileUpload = ({ onUploadComplete }) => {
  const [statements, setStatements] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setStatements(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setStatements(prev => prev.filter((_, i) => i !== index));
  };

  const uploadStatements = async () => {
    if (statements.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    // Simulate API call with timeout for now
    setTimeout(() => {
      // Generate a mock session ID
      const mockSessionId = 'session-' + Math.random().toString(36).substring(2, 15);
      onUploadComplete(mockSessionId);
      setIsUploading(false);
    }, 1500);
    
    /* Uncomment this once you have the API service ready
    try {
      // Create form data
      const formData = new FormData();
      statements.forEach(file => {
        formData.append('files', file);
      });
      
      // Make API call
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/upload/`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Call the callback with the session ID
      if (data.session_id) {
        onUploadComplete(data.session_id);
      } else {
        throw new Error('No session ID returned from server');
      }
    } catch (err) {
      setError(`Error uploading files: ${err.message}`);
      console.error(err);
    } finally {
      setIsUploading(false);
    }
    */
  };

  const clearAll = () => {
    setStatements([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold mb-4">Upload Bank & Credit Card Statements</h2>
      
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Upload your statements (Bank & Credit Card)
        </label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          accept=".pdf,.csv,.xlsx,.xls"
          ref={fileInputRef}
        />
      </div>
      
      {/* File List */}
      {statements.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium mb-2">Selected Files:</h3>
          <ul className="space-y-2">
            {statements.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm truncate mr-2">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                  type="button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex space-x-4">
        <button
          onClick={uploadStatements}
          disabled={statements.length === 0 || isUploading}
          className={`px-4 py-2 rounded-md ${
            statements.length === 0 || isUploading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          type="button"
        >
          {isUploading ? 'Uploading...' : 'Upload & Process'}
        </button>
        
        <button
          onClick={clearAll}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
          type="button"
        >
          Clear All
        </button>
      </div>
      
      {error && (
        <div className="mt-4 text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;