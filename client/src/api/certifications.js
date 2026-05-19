import api from './axios';

export const getCertifications = () => api.get('/api/certifications');
export const awardCertificate = (id) => api.post(`/api/certifications/${id}/award`);
export const downloadCertificate = (id) => api.get(`/api/certifications/${id}/download`, { responseType: 'blob' });
