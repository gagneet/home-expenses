// frontend/src/components/App.jsx
import React, { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import Summary from './Summary';
import { checkProcessingStatus } from '../services/api';

const App = () => {
  const [sessionId, setSessionId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check processing status when sessionId changes
  useEffect(() => {
    if (!sessionId) return;
    
    const checkStatus = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const statusResponse = await checkProcessingStatus(sessionId);
        setProcessingStatus(statusResponse.status);
        
        if (statusResponse.status === 'completed' && statusResponse.result) {
          setSummaryData(statusResponse.result);
        } else if (statusResponse.status === 'error') {
          setError(statusResponse.message || 'An error occurred during processing');
        } else if (statusResponse.status === 'processing') {
          // If still processing, check again in 3 seconds
          setTimeout(checkStatus, 3000);
        }
      } catch (err) {
        setError(`Error checking status: ${err.message}`);
        setProcessingStatus('error');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkStatus();
  }, [sessionId]);

  const handleUploadComplete = (newSessionId) => {
    setSessionId(newSessionId);
    setProcessingStatus('processing');
    setSummaryData(null);
    setError(null);
  };

  const handleReset = () => {
    setSessionId(null);
    setProcessingStatus(null);
    setSummaryData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Home Expenditure Calculator</h1>
          <p className="text-gray-600 mt-2">
            Upload your bank statements and credit card statements to analyze your spending
          </p>
        </header>
        
        {!sessionId ? (
          <FileUpload onUploadComplete={handleUploadComplete} />
        ) : (
          <div>
            {isLoading && processingStatus === 'processing' && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h2 className="text-xl font-semibold text-blue-800 mb-2">Processing...</h2>
                <p className="text-blue-600">
                  Please wait while we analyze your statements. This may take a few moments.
                </p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 p-4 rounded-lg mb-6">
                <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
                <p className="text-red-600">{error}</p>
                <button 
                  onClick={handleReset}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Start Over
                </button>
              </div>
            )}
            
            {summaryData && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Results</h2>
                  <button 
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Upload New Statements
                  </button>
                </div>
                <Summary summaryData={summaryData} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;