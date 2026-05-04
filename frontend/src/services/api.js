import axios from 'axios';

// Support both development and production URLs
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://meter-flow-2qqi.onrender.com' 
    : 'http://localhost:5000');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const authService = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

export const apiService = {
  // API Management
  createAPI: (data) => api.post('/api', data),
  getAPIs: () => api.get('/api'),
  getAPI: (id) => api.get(`/api/${id}`),
  updateAPI: (id, data) => api.put(`/api/${id}`, data),
  deleteAPI: (id) => api.delete(`/api/${id}`),

  // API Keys
  createKey: (data) => api.post('/api/keys', data),
  getKeys: () => api.get('/api/keys'),
  getKey: (id) => api.get(`/api/keys/${id}`),
  revokeKey: (id) => api.delete(`/api/keys/${id}`),
  rotateKey: (id) => api.post(`/api/keys/${id}/rotate`),
  updateKey: (id, data) => api.put(`/api/keys/${id}`, data)
};

export const billingService = {
  getBilling: async () => {
    const res = await api.get('/billing');
    console.log('🔍 getBilling response:', res);
    return res;
  },
  getBillingHistory: (limit) => api.get('/billing/history', { params: { limit } }),
  getInvoice: (id) => api.get(`/billing/invoice/${id}`),
  generateInvoice: (data) => api.post('/billing/generate', data),
  markInvoicePaid: (id, data) => api.post(`/billing/invoice/${id}/paid`, data),
  getUsageStats: () => api.get('/billing/stats'),
  getTopEndpoints: (limit) => api.get('/billing/analytics/endpoints', { params: { limit } }),
  getStatusDistribution: (days) => api.get('/billing/analytics/status', { params: { days } }),
  getPeakTimes: (days) => api.get('/billing/analytics/peak-times', { params: { days } })
};

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getDetailedAnalytics: (days, period) => api.get('/analytics/detailed', { params: { days, period } }),
  getApiKeyStats: (keyId) => api.get(`/analytics/key/${keyId}`),
  getRealtimeMetrics: () => api.get('/analytics/realtime'),
  exportAnalytics: (startDate, endDate, format) => api.get('/analytics/export', { 
    params: { startDate, endDate, format },
    responseType: format === 'csv' ? 'blob' : 'json'
  })
};

export const subscriptionService = {
  getPlans: () => api.get('/subscription/plans'),
  getCurrentPlan: () => api.get('/subscription/current'),
  upgradePlan: (planName) => api.post('/subscription/upgrade', { planName }),
  downgradePlan: (planName) => api.post('/subscription/downgrade', { planName })
};

export const adminService = {
  getAllUsers: (page, limit, role) => api.get('/admin/users', { params: { page, limit, role } }),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  suspendUser: (userId) => api.post(`/admin/users/${userId}/suspend`),
  getSystemStats: () => api.get('/admin/stats'),
  getRevenueStats: (months) => api.get('/admin/revenue', { params: { months } })
};

export default api;
