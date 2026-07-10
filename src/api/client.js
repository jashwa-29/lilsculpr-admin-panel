import api from './axios';

const apiClient = {
  get: async (endpoint, options = {}) => {
    const response = await api.get(endpoint, options);
    return response.data;
  },
  
  post: async (endpoint, data) => {
    const response = await api.post(endpoint, data);
    return response.data;
  },
  
  postFormData: async (endpoint, formData) => {
    const response = await api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  put: async (endpoint, data) => {
    const response = await api.put(endpoint, data);
    return response.data;
  },
  
  delete: async (endpoint) => {
    const response = await api.delete(endpoint);
    return response.data;
  }
};

export default apiClient;
