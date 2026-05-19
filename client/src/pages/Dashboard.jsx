import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminDashboard, getManagerDashboard, getInstructorDashboard, getEmployeeDashboard } from '../api/dashboard';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';

const fetchFn = {
  admin:      getAdminDashboard,
  manager:    getManagerDashboard,
  instructor: getInstructorDashboard,
  employee:   getEmployeeDashboard,
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ── Stat icon SVGs ─────────────────────── */
const IcoUsers = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);
const IcoBook = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
  </svg>
);
const IcoCheck = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IcoAlert = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IcoProgress = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
  </svg>
);

/* ── Role dashboards ───────────────────── */
function AdminDash({ d }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Active Users"      value={d.total_users}             icon={IcoUsers}    delay={0}   to="/users" />
      <StatCard label="Published Courses" value={d.total_trainings}         icon={IcoBook}     delay={80}  to="/trainings" />
      <StatCard label="Completion Rate"   value={`${d.completion_rate}%`}   icon={IcoCheck}    accent delay={160} to="/assignments?status=completed" />
      <StatCard label="Overdue"           value={d.overdue}                 icon={IcoAlert}    delay={240} to="/assignments?status=overdue"
        sub={`${d.in_progress} in progress`} />
    </div>
  );
}

function ManagerDash({ d }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Team Size"         value={parseInt(d.team_size)}         icon={IcoUsers}    delay={0}   to="/assignments" />
      <StatCard label="Total Assignments" value={parseInt(d.total_assignments)} icon={IcoBook}     delay={80}  to="/assignments" />
      <StatCard label="Completed"         value={parseInt(d.completed)}         icon={IcoCheck}    accent delay={160} to="/assignments?status=completed" />
      <StatCard label="Overdue"           value={parseInt(d.overdue)}           icon={IcoAlert}    delay={240} to="/assignments?status=overdue"
        sub={`${parseInt(d.in_progress)} in progress`} />
    </div>
  );
}

function InstructorDash({ d }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Courses Created"  value={parseInt(d.trainings_created)}           icon={IcoBook}     delay={0}   to="/trainings" />
      <StatCard label="Total Learners"   value={parseInt(d.total_learners)}              icon={IcoUsers}    delay={80}  to="/assignments" />
      <StatCard label="Completions"      value={parseInt(d.completed_learners)}          icon={IcoCheck}    accent delay={160} to="/assignments?status=completed" />
      <StatCard label="Avg Progress"     value={`${Math.round(d.avg_progress || 0)}%`}  icon={IcoProgress} delay={240} to="/assignments" />
    </div>
  );
}

function EmployeeDash({ d }) {
  const total    = parseInt(d.total);
  const completed = parseInt(d.completed);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Assigned"     value={total}                   icon={IcoBook}     delay={0}   to="/assignments" />
      <StatCard label="Completed"    value={completed}               icon={IcoCheck}    accent delay={80}  to="/assignments?status=completed" />
      <StatCard label="In Progress"  value={parseInt(d.in_progress)} icon={IcoProgress} delay={160} to="/assignments?status=in_progress" />
      <StatCard label="Overdue"      value={parseInt(d.overdue)}     icon={IcoAlert}    delay={240} to="/assignments?status=overdue"
        sub={`${pct}% overall completion`} />
    </div>
  );
}

const DashMap = { admin: AdminDash, manager: ManagerDash, instructor: InstructorDash, employee: EmployeeDash };

/* ── Quick action links ─────────────────── */
const quickActions = {
  admin:      [{ label: 'New Training', to: '/trainings/new' }, { label: 'Assign Training', to: '/assignments/new' }, { label: 'Add User', to: '/users/new' }],
  instructor: [{ label: 'New Training', to: '/trainings/new' }, { label: 'View Library', to: '/trainings' }],
  manager:    [{ label: 'Team Progress', to: '/assignments' }, { label: 'View Library', to: '/trainings' }],
  employee:   [{ label: 'My Trainings', to: '/assignments' }, { label: 'Browse Library', to: '/trainings' }],
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fn = fetchFn[user?.role];
    if (!fn) return;
    fn().then(r => setData(r.data)).catch(() => setError('Could not load dashboard data.'));
  }, [user?.role]);

  const Dash    = DashMap[user?.role];
  const actions = quickActions[user?.role] || [];

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <div className="flex items-end justify-between animate-fade-up">
        <div>
          <p className="text-muted text-sm font-mono mb-1">{greeting()}</p>
          <h1 className="font-display text-4xl font-bold text-text">
            {user?.name?.split(' ')[0]}
            <span className="text-muted">.</span>
          </h1>
          <p className="text-muted text-sm mt-2 capitalize">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              {user?.role} · {user?.department || 'No department'}
            </span>
          </p>
        </div>

        {actions.length > 0 && (
          <div className="flex items-center gap-2 animate-fade-up d-120">
            {actions.map((a, i) => (
              <Link key={a.to} to={a.to}>
                <Button variant={i === 0 ? 'primary' : 'secondary'} size="sm">
                  {i === 0 && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  )}
                  {a.label}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-border animate-fade-in d-60" />

      {/* ── Stats ── */}
      {error && (
        <div className="bg-danger/6 border border-danger/20 rounded-2xl px-5 py-4 text-danger text-sm">
          {error}
        </div>
      )}

      {!data && !error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => (
            <div key={i} className="h-36 bg-surface border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {data && Dash && (
        <div className="animate-fade-up d-120">
          <Dash d={data} />
        </div>
      )}

      {/* ── Decorative footer line ── */}
      <div className="flex items-center gap-3 pt-4 animate-fade-in d-300">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-mono text-muted/40 tracking-widest uppercase">10Pearls Learning & Development</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
