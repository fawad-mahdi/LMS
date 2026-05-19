import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createAssignment } from '../api/assignments';
import { getTrainings } from '../api/trainings';
import { getUsers } from '../api/users';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';

export default function AssignmentForm() {
  const navigate = useNavigate();
  const [trainings, setTrainings]         = useState([]);
  const [users, setUsers]                 = useState([]);
  const [trainingId, setTrainingId]       = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [dueDate, setDueDate]             = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  useEffect(() => {
    Promise.all([getTrainings(), getUsers({ role: 'employee' })]).then(([t, u]) => {
      setTrainings(t.data.filter(tr => tr.status === 'published'));
      setUsers(u.data);
    });
  }, []);

  const toggle = id => setSelectedUsers(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelectedUsers(selectedUsers.length === users.length ? [] : users.map(u => u.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trainingId || !selectedUsers.length) return setError('Please select a training and at least one employee.');
    setLoading(true);
    setError('');
    try {
      await createAssignment({ training_id: trainingId, user_ids: selectedUsers, due_date: dueDate || undefined });
      navigate('/assignments');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create assignments.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <Link to="/assignments" className="inline-flex items-center gap-1.5 text-muted text-xs hover:text-text transition-colors duration-150 animate-fade-up">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        Assignments
      </Link>

      <div className="animate-fade-up d-60">
        <h1 className="font-display text-3xl font-bold text-text">Assign Training</h1>
        <p className="text-muted text-sm mt-1">Select a training and the employees to assign it to.</p>
      </div>

      <Card className="p-6 animate-fade-up d-120">
        <form onSubmit={handleSubmit} className="space-y-5">

          <Select label="Training" value={trainingId} onChange={e => setTrainingId(e.target.value)} required>
            <option value="">Choose a published training…</option>
            {trainings.map(t => <option key={t.id} value={t.id}>{t.title} ({t.duration_hrs}h)</option>)}
          </Select>

          <Input label="Due Date (optional)" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />

          {/* Employee selector */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-muted-2 tracking-wide uppercase">
                Employees
              </label>
              <button type="button" onClick={toggleAll}
                className="text-[11px] text-accent hover:text-accent-dim transition-colors duration-150">
                {selectedUsers.length === users.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
              <div className="px-3 py-1.5 bg-surface-2 border-b border-border">
                <span className="text-[11px] font-mono text-muted">{selectedUsers.length} of {users.length} selected</span>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {users.length === 0 ? (
                  <p className="text-center text-muted text-sm py-8">No employees found.</p>
                ) : users.map((u) => (
                  <label key={u.id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/3 border-b border-border last:border-0 transition-colors duration-100 group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-150
                      ${selectedUsers.includes(u.id) ? 'bg-accent border-accent' : 'bg-surface-2 border-border group-hover:border-border-2'}`}>
                      {selectedUsers.includes(u.id) && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#09090D" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </div>
                    <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggle(u.id)} className="sr-only" />
                    <div className="flex-1 min-w-0">
                      <p className="text-text text-sm font-medium">{u.name}</p>
                      <p className="text-muted text-xs font-mono truncate">{u.email}</p>
                    </div>
                    <span className="text-xs text-muted flex-shrink-0">{u.department}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 bg-danger/6 border border-danger/20 rounded-xl px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F04438" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Button type="submit" disabled={loading || !trainingId || !selectedUsers.length}>
              {loading ? 'Assigning…' : `Assign to ${selectedUsers.length || 0} employee${selectedUsers.length !== 1 ? 's' : ''}`}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
