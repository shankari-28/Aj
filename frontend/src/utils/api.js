import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  login: (email, password, role) => api.post('/auth/login', { email, password, role }),
  getMe: () => api.get('/auth/me'),
};

export const publicAPI = {
  createApplication: (data) => api.post('/public/application', data),
  checkStatus: (data) => api.post('/public/application/status', data),
};

export const applicationsAPI = {
  getAll: () => api.get('/applications'),
  getOne: (id) => api.get(`/applications/${id}`),
  update: (id, data) => api.patch(`/applications/${id}`, data),
};

export const studentsAPI = {
  getAll: () => api.get('/students'),
  getOne: (id) => api.get(`/students/${id}`),
};

export const attendanceAPI = {
  create: (data) => api.post('/attendance', data),
  getByStudent: (studentId) => api.get(`/attendance/${studentId}`),
};

export const activitiesAPI = {
  create: (data) => api.post('/daily-activities', data),
  getByStudent: (studentId) => api.get(`/daily-activities/${studentId}`),
};

export const feesAPI = {
  getStructures: () => api.get('/fees/structure'),
  createStructure: (data) => api.post('/fees/structure', data),
  getStudentPayments: (studentId) => api.get(`/fees/payments/${studentId}`),
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
};

export const adminAPI = {
  createUser: (data) => api.post('/admin/users', data),
  getUsers: () => api.get('/admin/users'),
  resetPassword: (userId, newPassword) => api.patch(`/admin/users/${userId}/password`, { new_password: newPassword }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
};