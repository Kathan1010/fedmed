import axios from 'axios';

// Connect to the FastAPI backend running on port 8000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// V3 FIX: Frontend must send API key header to authenticate
const API_KEY = import.meta.env.VITE_API_KEY || '';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
});

export const flApi = {
  // Start training with a specific data type
  startTraining: async (dataType) => {
    const response = await apiClient.post('/training/start', {
      data_type: dataType
    });
    return response.data;
  },

  // Stop current training
  stopTraining: async () => {
    const response = await apiClient.post('/training/stop');
    return response.data;
  },

  // Check if training is running
  getStatus: async () => {
    const response = await apiClient.get('/training/status');
    return response.data.data.is_running;
  },

  // Get live metrics
  getMetrics: async () => {
    const response = await apiClient.get('/metrics');
    return response.data;
  }
};
