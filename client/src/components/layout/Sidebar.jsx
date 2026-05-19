import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout as apiLogout } from '../../api/auth';

/* ── SVG icon set ─────────────────────────── */
const Ico = {
  Dashboard: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  Training: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
    </svg>
  ),
  Assignment: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  ),
  Certificate: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 012-2z"/>
      <path d="M8 8h8M8 12h5"/>
    </svg>
  ),
  Users: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  Logout: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
  ),
};

/* ── Nav config ───────────────────────────── */
const navItems = {
  admin: [
    { to: '/dashboard',   label: 'Dashboard',   Icon: Ico.Dashboard },
    { to: '/trainings',   label: 'Trainings',   Icon: Ico.Training },
    { to: '/assignments', label: 'Assignments',  Icon: Ico.Assignment },
    { to: '/certifications', label: 'Certifications', Icon: Ico.Certificate },
    { to: '/users',       label: 'Users',        Icon: Ico.Users },
  ],
  instructor: [
    { to: '/dashboard',   label: 'Dashboard',   Icon: Ico.Dashboard },
    { to: '/trainings',   label: 'Trainings',   Icon: Ico.Training },
    { to: '/assignments', label: 'My Learners', Icon: Ico.Assignment },
  ],
  manager: [
    { to: '/dashboard',   label: 'Dashboard',     Icon: Ico.Dashboard },
    { to: '/assignments', label: 'Team Progress', Icon: Ico.Assignment },
    { to: '/certifications', label: 'Certifications', Icon: Ico.Certificate },
    { to: '/trainings',   label: 'Library',        Icon: Ico.Training },
  ],
  employee: [
    { to: '/dashboard',   label: 'Dashboard',     Icon: Ico.Dashboard },
    { to: '/assignments', label: 'My Trainings', Icon: Ico.Assignment },
    { to: '/trainings',   label: 'Library',        Icon: Ico.Training },
  ],
};

const roleColors = {
  admin: 'text-accent bg-accent/10 border-accent/20',
  instructor: 'text-warning bg-warning/10 border-warning/20',
  manager: 'text-success bg-success/10 border-success/20',
  employee: 'text-muted-2 bg-white/5 border-border',
};

function UserAvatar({ name }) {
  const initials = (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="w-9 h-9 rounded-xl bg-accent/12 border border-accent/25 flex items-center justify-center flex-shrink-0">
      <span className="text-accent font-mono text-xs font-bold">{initials}</span>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = navItems[user?.role] || [];

  const handleLogout = async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  return (
    <aside className={`
      fixed left-0 top-0 h-screen w-[232px] bg-surface border-r border-border flex flex-col z-40
      transition-transform duration-300 ease-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0
    `}>

      {/* ── Brand ── */}
      <div className="px-4 pt-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" fill="#09090D" fillOpacity="0.9"/>
              <circle cx="16.5" cy="16.5" r="3" fill="#09090D"/>
            </svg>
          </div>
          <div>
            <p className="font-display text-sm font-bold text-text leading-none">10Pearls</p>
            <p className="text-[10px] font-mono text-muted mt-0.5 tracking-widest uppercase">LMS Portal</p>
          </div>
        </div>
        <button onClick={onClose}
          className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-text hover:bg-white/5 transition-colors duration-150">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* ── Divider ── */}
      <div className="mx-4 h-px bg-border" />

      {/* ── Nav ── */}
      <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium
              transition-all duration-150 ease-out group relative
              ${isActive
                ? 'bg-accent/8 text-accent border border-accent/15'
                : 'text-muted hover:text-text hover:bg-white/4 border border-transparent'
              }
            `}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-full" />
                )}
                <span className={`transition-colors duration-150 ${isActive ? 'text-accent' : 'text-muted group-hover:text-muted-2'}`}>
                  <Icon />
                </span>
                <span className="flex-1">{label}</span>
                {isActive && (
                  <span className="text-accent/40">
                    <Ico.ChevronRight />
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Divider ── */}
      <div className="mx-4 h-px bg-border" />

      {/* ── User section ── */}
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl">
          <UserAvatar name={user?.name} />
          <div className="min-w-0 flex-1">
            <p className="text-text text-sm font-medium truncate leading-none">{user?.name}</p>
            <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono border capitalize ${roleColors[user?.role] || roleColors.employee}`}>
              {user?.role}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-muted
            hover:text-danger hover:bg-danger/6 border border-transparent hover:border-danger/15
            transition-all duration-150 group"
        >
          <span className="text-muted group-hover:text-danger transition-colors duration-150">
            <Ico.Logout />
          </span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
