import axios from 'axios';

// Use relative path so Vite's dev proxy (vite.config.js) handles routing to the backend.
// In production (behind nginx), the same relative path is reverse-proxied.
// Only fall back to a full URL if VITE_API_URL is explicitly set.
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

// API key — must match the backend's SECRET_KEY in .env
const API_KEY = import.meta.env.VITE_API_KEY || '';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
  },
});

// Response interceptor — log errors, re-reject for component handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.detail || error.response?.data?.error || error.message;
    console.error('API Error:', msg);
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
 * GET /api/v1/health
 * Returns: { success, message, data: { api, disk_write } }
 */
export const getHealth = () => apiClient.get('/health');

