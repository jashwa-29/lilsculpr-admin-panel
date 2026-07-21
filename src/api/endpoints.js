// lilsculpr-admin/src/api/endpoints.js
import apiClient from './client';
import api from './axios';

export const endpoints = {
  students: {
    getAll: () => apiClient.get('/students'),
    getById: (id) => apiClient.get(`/students/${id}`),
    create: (data) => apiClient.post('/students', data),
    update: (id, data) => apiClient.put(`/students/${id}`, data),
    delete: (id) => apiClient.delete(`/students/${id}`),
  },
  batches: {
    getAll: () => apiClient.get('/batches'),
    create: (data) => apiClient.post('/batches', data),
    update: (id, data) => apiClient.put(`/batches/${id}`, data),
    delete: (id) => apiClient.delete(`/batches/${id}`),
    addStudent: (batchId, studentId) => apiClient.post(`/batches/${batchId}/students/${studentId}`),
    removeStudent: (batchId, studentId) => apiClient.delete(`/batches/${batchId}/students/${studentId}`),
  },
  fees: {
    getAll: (params) => apiClient.get('/fees/all', { params }),
    getRecords: (params) => apiClient.get('/fees/records', { params }),
    getStats: () => apiClient.get('/fees/stats'),
    updateStatus: (id, data) => apiClient.put(`/fees/records/${id}`, data),
  },
  attendance: {
    getByBatch: (batchId, date) => apiClient.get(`/attendance/batch/${batchId}?date=${date}`),
    mark: (data) => apiClient.post('/attendance/mark', data),
    getStats: (startDate, endDate) => apiClient.get(`/attendance/stats?startDate=${startDate}&endDate=${endDate}`),
  },
  compensations: {
    getAll: (status) => apiClient.get(`/compensations${status ? `?status=${status}` : ''}`),
    create: (data) => apiClient.post('/compensations', data),
    updateStatus: (id, status) => apiClient.put(`/compensations/${id}`, { status }),
  },
  gallery: {
    // Public
    getAll: (category = null) => {
      const url = category && category !== 'all' ? `/gallery?category=${category}` : '/gallery';
      return api.get(url);
    },
    getCategories: () => api.get('/gallery/categories'),
    getById: (id) => api.get(`/gallery/${id}`),
    
    // Admin (Protected)
    getAllAdmin: () => {
      console.log('🔍 Fetching all gallery items (admin)...');
      return apiClient.get('/gallery/admin/all');
    },
    create: (formData) => {
      console.log('📤 Creating gallery item...');
      // Log the form data for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value instanceof File ? value.name : value}`);
      }
      return apiClient.postFormData('/gallery/admin', formData);
    },
    update: (id, formData) => {
      console.log(`📝 Updating gallery item ${id}...`);
      return apiClient.putFormData(`/gallery/admin/${id}`, formData);
    },
    delete: (id) => {
      console.log(`🗑️ Deleting gallery item ${id}...`);
      return apiClient.delete(`/gallery/admin/${id}`);
    },
    reorder: (items) => apiClient.post('/gallery/admin/reorder', { items }),
  },
  workshops: {
    getAll: (params) => apiClient.get('/special-course/admin/registrations', { params }),
    getById: (id) => apiClient.get(`/special-course/admin/registrations/${id}`),
    getStats: () => apiClient.get('/special-course/admin/statistics'),
    expire: (data) => apiClient.post('/special-course/admin/expire-registration', data),
  }
};