import api from './axios';

export const getAssignments = () => api.get('/api/assignments');
export const createAssignment = (data) => api.post('/api/assignments', data);
export const updateProgress = (id, progress_pct) => api.patch(`/api/assignments/${id}/progress`, { progress_pct });
export const completeAssignment = (id) => api.patch(`/api/assignments/${id}/complete`);
export const uncompleteAssignment = (id) => api.patch(`/api/assignments/${id}/uncomplete`);
export const deleteAssignment = (id) => api.delete(`/api/assignments/${id}`);
export const exportCompletionReport = (format, status = 'all') => api.get('/api/reports/completion', {
  params: { format, status },
  responseType: 'blob',
});
