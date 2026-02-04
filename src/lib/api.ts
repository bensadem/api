import axios from 'axios';
import Cookies from 'js-cookie';

// In browser (client-side), ALWAYS use relative path '/api'
// In server-side (SSR), use environment variable or default to localhost
const API_URL = typeof window !== 'undefined'
  ? '/api'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api');

console.log('API Client Config:', {
  isBrowser: typeof window !== 'undefined',
  API_URL
});

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('admin_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/control-panel-access';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string, securityCode?: string) =>
    api.post('/auth/login', { email, password, securityCode }),
  getProfile: () => api.get('/auth/profile'),
};

// Channels
export const channelsApi = {
  getAll: (params?: any) => api.get('/admin/channels', { params }),
  getById: (id: string) => api.get(`/channels/${id}`),
  create: (data: any) => api.post('/admin/channels', data),
  update: (id: string, data: any) => api.put(`/admin/channels/${id}`, data),
  delete: (id: string) => api.delete(`/admin/channels/${id}`),
  parseM3U8: (url: string) => api.post('/admin/channels/parse-m3u8', { url }),
  reorder: (id: string, direction: 'up' | 'down') => api.put(`/admin/channels/${id}/reorder`, { direction }),
};

// Categories
export const categoriesApi = {
  getAll: (params?: any) => api.get('/admin/categories', { params }),
  create: (data: any) => api.post('/admin/categories', data),
  update: (id: string, data: any) => api.put(`/admin/categories/${id}`, data),
  delete: (id: string, params?: any) => api.delete(`/admin/categories/${id}`, { params }),
  reorder: (id: string, direction: 'up' | 'down') => api.put(`/admin/categories/${id}/reorder`, { direction }),
};

// Movies
export const moviesApi = {
  getAll: (params?: any) => api.get('/admin/movies', { params }),
  getById: (id: string) => api.get(`/movies/${id}`),
  create: (data: any) => api.post('/admin/movies', data),
  update: (id: string, data: any) => api.put(`/admin/movies/${id}`, data),
  delete: (id: string) => api.delete(`/admin/movies/${id}`),
};

// Series
export const seriesApi = {
  getAll: (params?: any) => api.get('/admin/series', { params }),
  getById: (id: string) => api.get(`/series/${id}`),
  create: (data: any) => api.post('/admin/series', data),
  update: (id: string, data: any) => api.put(`/admin/series/${id}`, data),
  delete: (id: string) => api.delete(`/admin/series/${id}`),
  // Episodes
  getEpisodes: (seriesId: string, params?: any) =>
    api.get(`/series/${seriesId}/episodes`, { params }),
  createEpisode: (seriesId: string, data: any) =>
    api.post(`/admin/series/${seriesId}/episodes`, data),
  updateEpisode: (seriesId: string, episodeId: string, data: any) =>
    api.put(`/admin/series/${seriesId}/episodes/${episodeId}`, data),
  deleteEpisode: (seriesId: string, episodeId: string) =>
    api.delete(`/admin/series/${seriesId}/episodes/${episodeId}`),
};

// Users
export const usersApi = {
  getAll: (params?: any) => api.get('/admin/users', { params }),
  getById: (id: string) => api.get(`/admin/users/${id}`),
  create: (data: any) => api.post('/admin/users', data),
  update: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  delete: (id: string) => api.delete(`/admin/users/${id}`),
};

// Analytics
export const analyticsApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStats: (params?: any) => api.get('/admin/analytics/stats', { params }),
};

// App Config
export const configApi = {
  get: () => api.get('/admin/config'),
  update: (data: any) => api.put('/admin/config', data),
};

// Activation Codes
export const activationCodesApi = {
  getAll: (params?: any) => api.get('/admin/activation-codes', { params }),
  create: (data: any) => api.post('/admin/activation-codes', data),
  update: (id: string, data: any) => api.put(`/admin/activation-codes/${id}`, data),
  delete: (id: string) => api.delete(`/admin/activation-codes/${id}`),
};

// Notifications
export const notificationsApi = {
  getAll: (params?: any) => api.get('/admin/notifications', { params }),
  getById: (id: string) => api.get(`/admin/notifications/${id}`),
  create: (data: any) => api.post('/admin/notifications', data),
  update: (id: string, data: any) => api.put(`/admin/notifications/${id}`, data),
  delete: (id: string) => api.delete(`/admin/notifications/${id}`),
};

export default api;
