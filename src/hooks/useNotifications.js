import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const useNotifications = (isLoggedIn) => {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn) return;   // guard: never call when logged out
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // silent — 401s are handled by api.js interceptor
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]); // clear on logout
      return;
    }
    fetchNotifications();
    // Poll every 60s for new notifications
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications, isLoggedIn]);

  const markRead = useCallback(async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all/all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  }, []);

  const deleteNotif = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {}
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotif,
  };
};