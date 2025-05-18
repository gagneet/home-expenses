// frontend/src/services/api.js
/**
 * API client for interacting with the backend
 */

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_PATH = '/api/v1';

/**
 * Upload statement files for processing
 * 
 * @param {File[]} files - Array of statement files to upload
 * @returns {Promise<Object>} - Response with session ID
 */
export const uploadStatements = async (files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  
  try {
    const response = await fetch(`${BASE_URL}${API_PATH}/upload/`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading statements:', error);
    throw error;
  }
};

/**
 * Check the status of a processing session
 * 
 * @param {string} sessionId - The session ID to check
 * @returns {Promise<Object>} - Status and results if available
 */
export const checkProcessingStatus = async (sessionId) => {
  try {
    const response = await fetch(`${BASE_URL}${API_PATH}/status/${sessionId}`);
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking processing status:', error);
    throw error;
  }
};

/**
 * Delete a processing session
 * 
 * @param {string} sessionId - The session ID to delete
 * @returns {Promise<Object>} - Deletion status
 */
export const deleteSession = async (sessionId) => {
  try {
    const response = await fetch(`${BASE_URL}${API_PATH}/session/${sessionId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Session deletion failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};

/**
 * Health check for API
 * 
 * @returns {Promise<Object>} - Health status
 */
export const healthCheck = async () => {
  try {
    const response = await fetch(`${BASE_URL}${API_PATH}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API health check failed:', error);
    throw error;
  }
};