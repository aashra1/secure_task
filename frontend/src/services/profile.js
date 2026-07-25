import api from './api';

export const getProfile = () => api.get('/profile/me').then((r) => r.data);
export const updateProfile = (payload) => api.put('/profile/me', payload).then((r) => r.data);
export const uploadAvatar = (avatarUrl) => api.post('/profile/me/avatar', { avatarUrl }).then((r) => r.data);
export const exportData = () => api.get('/profile/me/export').then((r) => r.data);
export const importData = (payload) => api.post('/profile/me/import', payload).then((r) => r.data);
export const adminGetUsers = () => api.get('/profile/admin/users').then((r) => r.data);
export const adminUpdateUser = (id, payload) => api.put(`/profile/admin/users/${id}`, payload).then((r) => r.data);
