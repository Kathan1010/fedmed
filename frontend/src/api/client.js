import axios from 'axios';

// Vite env vars use import.meta.env.VITE_* — NEVER process.env.REACT_APP_*
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — log errors, re-reject for component handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * GET /api/v1/status
 * Returns: { status, current_round, total_rounds, connected_clients }
 */
export const getStatus = () => apiClient.get('/status');

/**
 * GET /api/v1/metrics
 * Returns: { rounds, total_rounds_completed, current_accuracy, current_loss }
 */
export const getMetrics = () => apiClient.get('/metrics');

/**
 * POST /api/v1/start-training
 * Body: { data_type: string, num_rounds?: number }
 * Returns: { success, message }
 */
export const startTraining = (dataType, numRounds = null) => {
  const body = { data_type: dataType };
  if (numRounds !== null) body.num_rounds = numRounds;
  return apiClient.post('/start-training', body);
};

/**
 * POST /api/v1/stop-training
 * Returns: { success, message }
 */
export const stopTraining = () => apiClient.post('/stop-training');

/**
 * GET /api/v1/model-info
 * Returns: { architecture, total_parameters, model_size_kb, save_path }
 */
export const getModelInfo = () => apiClient.get('/model-info');

/**
 * GET /health
 * Returns: { success, message, data: { api, disk_write } }
 */
export const getHealth = () => apiClient.get('/health');
