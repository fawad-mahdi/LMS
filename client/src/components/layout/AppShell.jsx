import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppShell({ children }) {
  const location = useLocation();
  const mainRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        </div>

        <div className="relative z-10 p-5 md:p-8 max-w-[1280px]">
          {children}
        </div>
      </main>
    </div>
  );
}
