import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useNotifications } from '../../context/NotificationsContext';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const typeIcon = {
  assignment_created: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  ),
  certificate_awarded: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 012-2z"/><path d="M8 8h8M8 12h5"/>
    </svg>
  ),
  course_completed: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/>
    </svg>
  ),
  training_published: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
    </svg>
  ),
  quiz_available: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
    </svg>
  ),
  quiz_completed: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
};

const entityRoute = {
  assignment_created:  '/assignments',
  certificate_awarded: '/certifications',
  course_completed:    '/assignments',
  training_published:  '/trainings',
  quiz_available:      '/trainings',
  quiz_completed:      '/assignments',
};

function NotificationPanel() {
  const { notifications, unreadCount, markRead, markAllRead, panelOpen, setPanelOpen } = useNotifications();
  const navigate = useNavigate();

  if (!panelOpen) return null;

  const handleClick = async (n) => {
    if (!n.read_at) await markRead(n.id);
    const route = entityRoute[n.type];
    if (route) navigate(route);
    setPanelOpen(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setPanelOpen(false)} />
      <div className="fixed right-0 top-0 h-screen w-[360px] max-w-[90vw] bg-surface border-l border-border z-50
        flex flex-col shadow-2xl animate-fade-up" style={{ animationDuration: '150ms' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <p className="font-display font-bold text-text text-base">Notifications</p>
            {unreadCount > 0 && (
              <span className="text-[10px] font-mono font-bold bg-accent text-bg px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="text-xs font-mono text-muted hover:text-accent transition-colors duration-150">
                Mark all read
              </button>
            )}
            <button onClick={() => setPanelOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-text hover:bg-white/5 transition-all duration-150">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-white/4 border border-border flex items-center justify-center text-muted">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
              </div>
              <p className="text-muted text-sm">No notifications yet.</p>
            </div>
          ) : (
            <div>
              {notifications.map(n => {
                const unread = !n.read_at;
                return (
                  <button key={n.id} onClick={() => handleClick(n)}
                    className={`w-full text-left flex items-start gap-3 px-5 py-4 border-b border-border/50
                      hover:bg-white/3 transition-colors duration-150 last:border-0
                      ${unread ? 'bg-accent/3' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5
                      ${unread ? 'bg-accent/15 text-accent border border-accent/20' : 'bg-white/4 text-muted border border-border'}`}>
                      {typeIcon[n.type] || typeIcon.assignment_created}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${unread ? 'text-text font-medium' : 'text-muted-2'}`}>
                        {n.message}
                      </p>
                      <p className="text-[11px] font-mono text-muted/60 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {unread && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-2" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function AppShell({ children }) {
  const location = useLocation();
  const mainRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount, setPanelOpen } = useNotifications();

  // Close sidebar and scroll to top on route change
  useEffect(() => {
    setSidebarOpen(false);
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main
        ref={mainRef}
        key={location.pathname}
        className="flex-1 md:ml-[232px] min-h-screen overflow-y-auto animate-fade-in"
      >
        {/* Dot grid background */}
        <div className="dot-grid fixed inset-0 md:ml-[232px] pointer-events-none opacity-60" />

        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3
          bg-surface/95 border-b border-border" style={{ backdropFilter: 'blur(8px)' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-text hover:bg-white/5 transition-all duration-150"
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" fill="#09090D" fillOpacity="0.9"/>
              </svg>
            </div>
            <p className="font-display text-sm font-bold text-text">10Pearls LMS</p>
          </div>
          {/* Bell — mobile */}
          <button onClick={() => setPanelOpen(true)}
            className="ml-auto relative w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-text hover:bg-white/5 transition-all duration-150">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-bg text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative z-10 p-5 md:p-8 max-w-[1280px]">
          {children}
        </div>
      </main>

      <NotificationPanel />
    </div>
  );
}
