import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTraining, deleteTraining, updateTraining } from '../api/trainings';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const statusVariant = { published: 'success', draft: 'warning', archived: 'muted' };
const typeLabel      = { self_paced: 'Self-paced', instructor_led: 'Instructor-led' };
const matIcon = {
  video:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  document:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  link:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  presentation: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21l4-4 4 4M12 17v4"/></svg>,
};

export default function TrainingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [training, setTraining] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getTraining(id).then(r => setTraining(r.data)).finally(() => setLoading(false));
  }, [id]);

  const toast = useToast();
  const canEdit = ['admin', 'instructor'].includes(user?.role);

  const handleDelete = async () => {
    if (!confirm('Delete this training? This cannot be undone.')) return;
    await deleteTraining(id);
    toast.success('Training deleted');
    navigate('/trainings');
  };

  const handlePublish = async () => {
    try {
      await updateTraining(id, { ...training, status: 'published' });
      const refreshed = await getTraining(id);
      setTraining(refreshed.data);
      toast.success('Training published successfully');
    } catch {
      toast.error('Failed to publish training');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full" style={{ animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  if (!training) return (
    <div className="py-24 text-center">
      <p className="text-muted">Training not found.</p>
      <Link to="/trainings" className="text-accent text-sm hover:underline mt-2 inline-block">← Back to library</Link>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── Breadcrumb ── */}
      <Link to="/trainings" className="inline-flex items-center gap-1.5 text-muted text-xs hover:text-text transition-colors duration-150 animate-fade-up">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        Training Library
      </Link>

      {/* ── Title block ── */}
      <div className="flex items-start justify-between gap-4 animate-fade-up d-60">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-2">
            <Badge variant={statusVariant[training.status] || 'muted'} dot>{training.status}</Badge>
            {training.is_mandatory && <Badge variant="danger" dot>Mandatory</Badge>}
          </div>
          <h1 className="font-display text-4xl font-bold text-text">{training.title}</h1>
          <p className="text-muted text-sm mt-2">
            {typeLabel[training.type]}
            {training.category && ` · ${training.category}`}
            {training.duration_hrs && ` · ${training.duration_hrs}h`}
            {training.created_by_name && ` · by ${training.created_by_name}`}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2 flex-shrink-0">
            {training.status === 'draft' && (
              <Button size="sm" onClick={handlePublish}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12l5 5L20 7"/></svg>
                Publish
              </Button>
            )}
            <Link to={`/trainings/${id}/edit`}><Button variant="secondary" size="sm">Edit</Button></Link>
            {user?.role === 'admin' && <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>}
          </div>
        )}
      </div>

      {/* ── Description ── */}
      <Card className="p-6 animate-fade-up d-120">
        <p className="text-[11px] font-mono text-muted uppercase tracking-widest mb-3">Description</p>
        <p className="text-muted-2 text-sm leading-relaxed">{training.description || 'No description provided.'}</p>
      </Card>

      {/* ── Materials ── */}
      <div className="animate-fade-up d-180">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-mono text-muted uppercase tracking-widest">Materials</p>
          <span className="text-muted text-xs font-mono">{(training.materials || []).length} item{(training.materials || []).length !== 1 ? 's' : ''}</span>
        </div>

        {(!training.materials || training.materials.length === 0) ? (
          <Card className="p-10 text-center">
            <p className="text-muted text-sm">No materials added yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {training.materials.map((m, i) => (
              <Card key={m.id} className="px-5 py-4 flex items-center gap-4 hover:border-border-2 transition-colors duration-150 animate-fade-up"
                style={{ animationDelay: `${200 + i * 50}ms` }}>
                <div className="w-8 h-8 rounded-lg bg-white/4 border border-border flex items-center justify-center text-muted flex-shrink-0">
                  {matIcon[m.type]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-text text-sm font-medium">{m.title}</p>
                  {m.url && (
                    <a href={m.url} target="_blank" rel="noreferrer"
                      className="text-accent text-xs truncate block hover:underline mt-0.5 font-mono">
                      {m.url}
                    </a>
                  )}
                </div>
                <Badge variant="muted">{m.type}</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
