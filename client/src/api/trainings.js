import api from './axios';

export const getTrainings = () => api.get('/api/trainings');
export const getTraining = (id) => api.get(`/api/trainings/${id}`);
export const createTraining = (data) => api.post('/api/trainings', data);
export const updateTraining = (id, data) => api.put(`/api/trainings/${id}`, data);
export const deleteTraining = (id) => api.delete(`/api/trainings/${id}`);
export const addMaterial = (id, data) => api.post(`/api/trainings/${id}/materials`, data);
export const deleteMaterial = (id, materialId) => api.delete(`/api/trainings/${id}/materials/${materialId}`);
