import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

const CREDS = [
  { role: 'admin',      label: 'Admin',      email: 'admin@10pearls.com',      password: 'Admin@123',      color: 'accent' },
  { role: 'instructor', label: 'Instructor', email: 'instructor@10pearls.com', password: 'Instructor@123', color: 'warning' },
  { role: 'manager',    label: 'Manager',    email: 'manager@10pearls.com',    password: 'Manager@123',    color: 'success' },
  { role: 'employee',   label: 'Employee',   email: 'employee@10pearls.com',   password: 'Employee@123',   color: 'muted' },
];

const roleStyle = {
  accent:  { badge: 'bg-accent/10 text-accent border-accent/20',   ring: 'hover:border-accent/30 hover:bg-accent/4' },
  warning: { badge: 'bg-warning/10 text-warning border-warning/20', ring: 'hover:border-warning/30 hover:bg-warning/4' },
  success: { badge: 'bg-success/10 text-success border-success/20', ring: 'hover:border-success/30 hover:bg-success/4' },
  muted:   { badge: 'bg-white/6 text-muted-2 border-white/10',       ring: 'hover:border-border-2 hover:bg-white/4' },
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await apiLogin(email, password);
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fill = (c) => { setEmail(c.email); setPassword(c.password); setError(''); };

  return (
    <div className="min-h-screen bg-bg flex">

      {/* ── Left: Brand + Form ─────────────────── */}
      <div className="flex-1 flex flex-col justify-between px-12 py-10 max-w-[540px] border-r border-border relative">
        {/* Dot grid */}
        <div className="dot-grid absolute inset-0 opacity-40 pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3 animate-fade-up">
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" fill="#09090D" fillOpacity="0.9"/>
              <circle cx="16.5" cy="16.5" r="3" fill="#09090D"/>
            </svg>
          </div>
          <span className="font-display text-base font-bold text-text">10Pearls LMS</span>
        </div>

        {/* Form area */}
        <div className="relative space-y-8">
          <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
            <h1 className="font-display text-[2.6rem] font-bold text-text leading-[1.1] mb-2">
              Welcome<br />back.
            </h1>
            <p className="text-muted text-sm">Sign in to your training portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-up" style={{ animationDelay: '120ms' }}>
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-muted-2 tracking-widest uppercase">Email</label>
              <input
                type="email"
                placeholder="you@10pearls.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="bg-surface-2 border border-border hover:border-border-2 focus:border-accent/50 focus:ring-2 focus:ring-accent/10
                  rounded-xl px-4 py-3 text-sm text-text placeholder:text-muted/50 outline-none transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-muted-2 tracking-widest uppercase">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="bg-surface-2 border border-border hover:border-border-2 focus:border-accent/50 focus:ring-2 focus:ring-accent/10
                  rounded-xl px-4 py-3 text-sm text-text placeholder:text-muted/50 outline-none transition-all duration-200"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 bg-danger/6 border border-danger/20 rounded-xl px-4 py-3 animate-scale-in">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F04438" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-accent text-bg font-semibold text-sm
                rounded-xl py-3 mt-2
                shadow-[0_0_0_1px_rgba(212,255,39,0.3),0_0_24px_rgba(212,255,39,0.12)]
                hover:bg-accent-dim hover:shadow-[0_0_0_1px_rgba(212,255,39,0.4),0_0_32px_rgba(212,255,39,0.2)]
                active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Spinner size="sm" /> : null}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="relative text-muted text-xs animate-fade-up" style={{ animationDelay: '200ms' }}>
          © 2026 10Pearls. Internal use only.
        </p>
      </div>

      {/* ── Right: Dev Credentials ─────────────── */}
      <div className="flex-1 flex flex-col justify-center px-12 py-10 bg-surface">
        <div className="max-w-sm animate-fade-up" style={{ animationDelay: '180ms' }}>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-mono text-muted uppercase tracking-widest px-2">Dev Credentials</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {CREDS.map((c, i) => {
              const { badge, ring } = roleStyle[c.color];
              return (
                <button
                  key={c.role}
                  onClick={() => fill(c)}
                  className={`text-left p-4 bg-bg border border-border rounded-2xl transition-all duration-200 group
                    ${ring} animate-fade-up`}
                  style={{ animationDelay: `${240 + i * 60}ms` }}
                >
                  <span className={`inline-flex px-2.5 py-[3px] rounded-full text-[10px] font-mono border ${badge}`}>
                    {c.label}
                  </span>
                  <p className="text-text text-sm font-medium mt-2.5 leading-none truncate">{c.email}</p>
                  <p className="text-muted text-[11px] font-mono mt-1.5">{c.password}</p>
                  <p className="text-muted/50 text-[10px] mt-3 group-hover:text-muted transition-colors duration-150">
                    Click to fill →
                  </p>
                </button>
              );
            })}
          </div>

          <p className="text-muted/40 text-[10px] text-center mt-6 font-mono">
            Visible in development mode only
          </p>
        </div>
      </div>
    </div>
  );
}
