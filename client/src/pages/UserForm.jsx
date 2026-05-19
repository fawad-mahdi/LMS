import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getUser, createUser, updateUser } from '../api/users';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';

const defaultForm = { name: '', email: '', password: '', role: 'employee', department: '', job_title: '' };

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(id);

  const [form, setForm]       = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!isEdit) return;
    getUser(id)
      .then(r => {
        const u = r.data;
        setForm({ name: u.name || '', email: u.email || '', password: '',
          role: u.role || 'employee', department: u.department || '', job_title: u.job_title || '' });
      })
      .finally(() => setFetching(false));
  }, [id, isEdit]);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        const payload = { name: form.name, email: form.email, role: form.role,
          department: form.department, job_title: form.job_title };
        await updateUser(id, payload);
        toast.success('User updated successfully');
        navigate(`/users/${id}`);
      } else {
        await createUser(form);
        toast.success('User created successfully');
        navigate('/users');
      }
    } catch (err) {
      const msg = err.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} user.`;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex justify-center py-24">
      <div className="w-7 h-7 border-2 border-accent/20 border-t-accent rounded-full" style={{ animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  return (
    <div className="max-w-xl space-y-6">
      <Link to={isEdit ? `/users/${id}` : '/users'}
        className="inline-flex items-center gap-1.5 text-muted text-xs hover:text-text transition-colors duration-150 animate-fade-up">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        {isEdit ? 'Back to user' : 'Users'}
      </Link>

      <div className="animate-fade-up d-60">
        <h1 className="font-display text-3xl font-bold text-text">{isEdit ? 'Edit User' : 'New User'}</h1>
        <p className="text-muted text-sm mt-1">
          {isEdit ? 'Update this account\'s details.' : 'Create a new account and assign a role.'}
        </p>
      </div>

      <Card className="p-6 animate-fade-up d-120">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" value={form.name} onChange={set('name')} placeholder="Jane Smith" required />
            <Select label="Role" value={form.role} onChange={set('role')}>
              <option value="employee">Employee</option>
              <option value="instructor">Instructor</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </Select>
          </div>

          <Input label="Email Address" type="email" value={form.email} onChange={set('email')}
            placeholder="jane@10pearls.com" required />

          {!isEdit && (
            <Input label="Password" type="password" value={form.password} onChange={set('password')}
              placeholder="Minimum 8 characters" required
              hint="Use a strong password — they'll be prompted to change it later." />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Department" value={form.department} onChange={set('department')} placeholder="e.g. Engineering" />
            <Input label="Job Title" value={form.job_title} onChange={set('job_title')} placeholder="e.g. Software Engineer" />
          </div>

          {error && (
            <div className="flex items-center gap-2.5 bg-danger/6 border border-danger/20 rounded-xl px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F04438" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Button type="submit" disabled={loading}>
              {loading ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save changes' : 'Create user')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
