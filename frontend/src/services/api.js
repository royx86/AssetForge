import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000
});

// Attach Authorization Bearer token to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('assetforge_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors cleanly
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      if (error.response.status === 401 && !window.location.pathname.includes('/login')) {
        // Token invalid or expired
        localStorage.removeItem('assetforge_token');
        localStorage.removeItem('assetforge_user');
      }
      const message =
        error.response.data?.error?.message ||
        error.response.data?.message ||
        `Request failed with status ${error.response.status}`;
      return Promise.reject(new Error(message));
    }
    return Promise.reject(new Error(error.message || 'Network error occurred'));
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/password', data)
};

export const projectAPI = {
  list: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`)
};

export const apiKeyAPI = {
  list: (projectId) => api.get(`/projects/${projectId}/api-keys`),
  create: (projectId, data) => api.post(`/projects/${projectId}/api-keys`, data),
  delete: (projectId, id) => api.delete(`/projects/${projectId}/api-keys/${id}`)
};

export const assetAPI = {
  list: (projectId, params = {}) =>
    api.get(`/projects/${projectId}/assets`, { params }),
  get: (projectId, id) =>
    api.get(`/projects/${projectId}/assets/${id}`),
  upload: (projectId, formData, onProgress) =>
    api.post(`/projects/${projectId}/assets`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
    }),
  transform: (projectId, id, options) =>
    api.post(`/projects/${projectId}/assets/${id}/transform`, options),
  delete: (projectId, id) =>
    api.delete(`/projects/${projectId}/assets/${id}`),
  getSignedUrl: (projectId, id, params = {}) =>
    api.get(`/projects/${projectId}/assets/${id}/url`, { params })
};

export const usageAPI = {
  get: (projectId) => api.get(`/projects/${projectId}/usage`)
};

export const logAPI = {
  list: (projectId, params = {}) =>
    api.get(`/projects/${projectId}/logs`, { params })
};

export default api;
