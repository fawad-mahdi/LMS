import api from './axios';

export const getNotifications = () => api.get('/api/notifications');
export const markRead = (id) => api.patch(`/api/notifications/${id}/read`);
export const markAllRead = () => api.patch('/api/notifications/read-all');
