import api from './axios';

export const login = (email, password) => api.post('/api/auth/login', { email, password });
export const logout = () => api.post('/api/auth/logout');
export const getMe = () => api.get('/api/auth/me');
