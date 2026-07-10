import apiClient from './client';

export const endpoints = {
  students: {
    getAll: () => apiClient.get('/enrollment/students'),
    getById: (id) => apiClient.get(`/enrollment/students/${id}`),
    create: (data) => apiClient.post('/enrollment/manual', data),
    createFormData: (formData) => apiClient.postFormData('/enrollment/manual', formData),
    update: (id, data) => apiClient.put(`/enrollment/students/${id}`, data),
    delete: (id) => apiClient.delete(`/enrollment/students/${id}`),
    getFees: (id) => apiClient.get(`/enrollment/students/${id}/fees`),
    markFeePaid: (id, data) => apiClient.post(`/enrollment/students/${id}/fees`, data),
    startLevel: (id) => apiClient.post(`/students/${id}/start-level`),
    advanceLevel: (id) => apiClient.post(`/students/${id}/advance-level`),
    // ═══ ADD THIS NEW METHOD ═══
    updateLevel: (id, level) => apiClient.put(`/enrollment/students/${id}/level`, { level }),
  },
  batches: {
    getAll: () => apiClient.get('/batches'),
    create: (data) => apiClient.post('/batches', data),
    complete: (id) => apiClient.post(`/batches/${id}/complete`, {}),
  },
  fees: {
    getOverview: () => apiClient.get('/enrollment/fees/overview'),
    getByMonth: (month, year) => apiClient.get(`/enrollment/fees/month/${month}/${year}`),
  },
  attendance: {
    get: (params) => apiClient.get('/enrollment/attendance', { params }),
    update: (data) => apiClient.post('/enrollment/attendance', data),
  },
  compensations: {
    get: (params) => apiClient.get('/enrollment/compensations', { params }),
    updateStatus: (id, status) => apiClient.put(`/enrollment/compensations/${id}`, { status }),
  }
};