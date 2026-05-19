import api from './axios';

export const getMyFeedback = () => api.get('/api/feedback/my');
export const submitFeedback = (training_id, rating, comment) =>
  api.post('/api/feedback', { training_id, rating, comment });
