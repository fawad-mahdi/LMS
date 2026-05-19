import api from './axios';

export const getAdminDashboard = () => api.get('/api/dashboard/admin');
export const getManagerDashboard = () => api.get('/api/dashboard/manager');
export const getInstructorDashboard = () => api.get('/api/dashboard/instructor');
export const getEmployeeDashboard = () => api.get('/api/dashboard/employee');
