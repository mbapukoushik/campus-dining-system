import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true, // Necessary if the backend requires cookies/sessions
});

// fetchVendors() -> GET /api/vendors
export const fetchVendors = () => {
  return api.get('/api/vendors');
};

// fetchMenu(vendorId) -> GET /api/vendors/:id/menu
export const fetchMenu = (vendorId) => {
  return api.get(`/api/vendors/${vendorId}/menu`);
};

// calculateBudget(payload) -> POST /api/planner/recommend
export const calculateBudget = (payload) => {
  return api.post('/api/planner/recommend', payload);
};

// reportWaitTime(vendorId, minutes) -> POST /api/vendors/:id/wait-time
export const reportWaitTime = (vendorId, minutes) => {
  return api.post(`/api/vendors/${vendorId}/wait-time`, { minutes });
};

export default api;
