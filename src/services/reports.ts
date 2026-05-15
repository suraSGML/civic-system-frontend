/**
 * Report API service functions.
 */
import api from './api';

export interface Report {
  id: number;
  title: string;
  description: string;
  category: string;
  category_display: string;
  severity: string;
  severity_display: string;
  status: string;
  status_display: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  is_emergency: boolean;
  is_anonymous: boolean;
  upvote_count: number;
  reporter_name: string;
  media_count: number;
  created_at: string;
}

export interface ReportFilters {
  category?: string;
  severity?: string;
  status?: string;
  is_emergency?: boolean;
  city?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export const reportsApi = {
  list: (filters?: ReportFilters) =>
    api.get('/reports/', { params: filters }).then((r) => r.data),

  detail: (id: number) =>
    api.get(`/reports/${id}/`).then((r) => r.data),

  create: (data: FormData | object) =>
    api.post('/reports/', data).then((r) => r.data),

  update: (id: number, data: object) =>
    api.patch(`/reports/${id}/`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/reports/${id}/`),

  updateStatus: (id: number, status: string, notes?: string) =>
    api.patch(`/reports/${id}/status/`, { status, notes }).then((r) => r.data),

  upvote: (id: number) =>
    api.post(`/reports/${id}/upvote/`).then((r) => r.data),

  addComment: (id: number, content: string) =>
    api.post(`/reports/${id}/comments/`, { content }).then((r) => r.data),

  myReports: (filters?: ReportFilters) =>
    api.get('/reports/my/', { params: filters }).then((r) => r.data),

  emergency: () =>
    api.get('/reports/emergency/').then((r) => r.data),

  mapData: (filters?: ReportFilters) =>
    api.get('/reports/map/', { params: filters }).then((r) => r.data),

  nearby: (lat: number, lng: number, radius?: number) =>
    api.get('/reports/nearby/', { params: { lat, lng, radius } }).then((r) => r.data),

  uploadMedia: (reportId: number, formData: FormData) =>
    api.post(`/media/reports/${reportId}/upload/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
};

export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard/').then((r) => r.data),
  byCategory: () => api.get('/analytics/by-category/').then((r) => r.data),
  bySeverity: () => api.get('/analytics/by-severity/').then((r) => r.data),
  trend: (days?: number) => api.get('/analytics/trend/', { params: { days } }).then((r) => r.data),
  heatmap: (filters?: object) => api.get('/analytics/heatmap/', { params: filters }).then((r) => r.data),
  workers: () => api.get('/analytics/workers/').then((r) => r.data),
  responseTime: () => api.get('/analytics/response-time/').then((r) => r.data),
};

export const assignmentsApi = {
  list: () => api.get('/assignments/').then((r) => r.data),
  create: (data: object) => api.post('/assignments/', data).then((r) => r.data),
  myAssignments: () => api.get('/assignments/my/').then((r) => r.data),
  updateMy: (id: number, data: object) =>
    api.patch(`/assignments/my/${id}/`, data).then((r) => r.data),
  cancel: (id: number, reason: string) =>
    api.post(`/assignments/${id}/cancel/`, { reason }).then((r) => r.data),
};

export const notificationsApi = {
  list: (unread?: boolean) =>
    api.get('/notifications/', { params: unread ? { unread: 'true' } : {} }).then((r) => r.data),
  unreadCount: () => api.get('/notifications/unread-count/').then((r) => r.data),
  markRead: (id: number) => api.post(`/notifications/${id}/read/`).then((r) => r.data),
  markAllRead: () => api.post('/notifications/mark-all-read/').then((r) => r.data),
};

export const adminApi = {
  users: (params?: object) => api.get('/auth/admin/users/', { params }).then((r) => r.data),
  banUser: (id: number, action: 'ban' | 'unban', reason?: string) =>
    api.post(`/auth/admin/users/${id}/ban/`, { action, reason }).then((r) => r.data),
  workers: () => api.get('/auth/workers/').then((r) => r.data),
};
