import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, deleteUser } from '../api/users';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const roleVariant  = { admin: 'accent', instructor: 'warning', manager: 'success', employee: 'muted' };
const roleLabel    = { admin: 'Admin', instructor: 'Instructor', manager: 'Manager', employee: 'Employee' };

function Avatar({ name }) {
  const initials = (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="w-8 h-8 rounded-lg bg-white/5 border border-border flex items-center justify-center flex-shrink-0">
      <span className="text-muted-2 font-mono text-[11px] font-bold">{initials}</span>
    </div>
  );
}

export default function Users() {
  const [users, setUsers]   = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => getUsers().then(r => setUsers(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this user? They will lose access immediately.')) return;
    await deleteUser(id);
    load();
  };

  const visible = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.department || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold text-text">Users</h1>
          <p className="text-muted text-sm mt-1">{users.filter(u => u.is_active).length} active · {users.length} total</p>
        </div>
        <Link to="/users/new">
          <Button>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New User
          </Button>
        </Link>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-sm animate-fade-up d-60">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input
          type="text"
          placeholder="Search by name, email, department…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-surface border border-border hover:border-border-2 focus:border-accent/50 focus:ring-2 focus:ring-accent/10
            rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-muted/60 outline-none transition-all duration-200"
        />
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="space-y-2">
          {[0,1,2,3].map(i => <div key={i} className="h-16 bg-surface border border-border rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <Card className="overflow-hidden animate-fade-up d-120">
          {visible.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-muted text-sm">No users found.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 text-[10px] font-mono text-muted uppercase tracking-widest font-normal">User</th>
                  <th className="text-left px-6 py-3 text-[10px] font-mono text-muted uppercase tracking-widest font-normal">Role</th>
                  <th className="text-left px-6 py-3 text-[10px] font-mono text-muted uppercase tracking-widest font-normal hidden md:table-cell">Department</th>
                  <th className="text-left px-6 py-3 text-[10px] font-mono text-muted uppercase tracking-widest font-normal">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {visible.map((u, i) => (
                  <tr
                    key={u.id}
                    className="border-b border-border last:border-0 hover:bg-white/[0.015] transition-colors duration-100 animate-fade-up"
                    style={{ animationDelay: `${150 + i * 40}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} />
                        <div>
                          <p className="text-text text-sm font-medium">{u.name}</p>
                          <p className="text-muted text-xs font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={roleVariant[u.role]}>{roleLabel[u.role]}</Badge>
                    </td>
                    <td className="px-6 py-4 text-muted text-sm hidden md:table-cell">
                      {u.department || <span className="text-muted/40">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.is_active ? 'success' : 'muted'} dot>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/users/${u.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                        {u.is_active && (
                          <Button variant="danger" size="sm" onClick={() => handleDeactivate(u.id)}>
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
