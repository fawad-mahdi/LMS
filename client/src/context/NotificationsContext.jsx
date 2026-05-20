import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getNotifications, markRead as apiMarkRead, markAllRead as apiMarkAllRead } from '../api/notifications';

const NotificationsContext = createContext(null);
export const useNotifications = () => useContext(NotificationsContext);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const load = useCallback(() => {
    if (!user) return;
    getNotifications().then(r => setNotifications(r.data)).catch(() => {});
  }, [user]);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const markRead = useCallback(async (id) => {
    await apiMarkRead(id);
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: now } : n));
  }, []);

  const markAllRead = useCallback(async () => {
    await apiMarkAllRead();
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || now })));
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, panelOpen, setPanelOpen }}>
      {children}
    </NotificationsContext.Provider>
  );
}
