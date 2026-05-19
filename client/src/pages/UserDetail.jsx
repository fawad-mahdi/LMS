import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUser } from '../api/users';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const roleVariant = { admin: 'accent', instructor: 'warning', manager: 'success', employee: 'muted' };

function Avatar({ name }) {
  const initials = (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
      <span className="text-accent font-mono text-lg font-bold">{initials}</span>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1">{label}</p>
      <p className="text-text text-sm">{value || <span className="text-muted">—</span>}</p>
    </div>
  );
}

export default function UserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => { getUser(id).then(r => setUser(r.data)); }, [id]);

  if (!user) return (
    <div className="flex justify-center py-24">
      <div className="w-7 h-7 border-2 border-accent/20 border-t-accent rounded-full" style={{ animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <Link to="/users" className="inline-flex items-center gap-1.5 text-muted text-xs hover:text-text transition-colors duration-150 animate-fade-up">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        Users
      </Link>

      {/* ── Profile header ── */}
      <Card className="p-6 animate-fade-up d-60">
        <div className="flex items-start gap-5">
          <Avatar name={user.name} />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-bold text-text">{user.name}</h1>
            <p className="text-muted text-sm font-mono mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-2.5">
              <Badge variant={roleVariant[user.role]}>{user.role}</Badge>
              <Badge variant={user.is_active ? 'success' : 'muted'} dot>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          <Link to={`/users/${id}/edit`}>
            <Button variant="secondary" size="sm">Edit</Button>
          </Link>
        </div>
      </Card>

      {/* ── Details ── */}
      <Card className="p-6 animate-fade-up d-120">
        <p className="text-[10px] font-mono text-muted uppercase tracking-widest mb-4">Account Details</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <Field label="Department"  value={user.department} />
          <Field label="Job Title"   value={user.job_title} />
          <Field label="Role"        value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} />
          <Field label="Member since" value={new Date(user.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
        </div>
      </Card>
    </div>
  );
}
