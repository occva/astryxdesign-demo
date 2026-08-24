import type {AppNotification, DashboardData} from '../types';
import {apiRequest} from './apiClient';

export const applicationApi = {
  getDashboard: () => apiRequest<DashboardData>('/dashboard'),
  getNotifications: () => apiRequest<AppNotification[]>('/notifications'),
  markNotificationRead: (id: string) => apiRequest<{updated: boolean}>(`/notifications/${encodeURIComponent(id)}/read`, {method: 'PUT'}),
  markAllNotificationsRead: () => apiRequest<{updated: boolean}>('/notifications/read-all', {method: 'PUT'}),
};
