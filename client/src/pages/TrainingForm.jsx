import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTraining, getTrainings, createTraining, updateTraining, addMaterial, deleteMaterial } from '../api/trainings';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';

const defaultForm = {
  title: '', description: '', type: 'self_paced', category: '',
  duration_hrs: '', is_mandatory: false, status: 'draft',
};

const defaultMatForm = { title: '', type: 'link', url: '' };

const matTypeLabel = { video: 'Video', document: 'Document / PDF', link: 'Link', presentation: 'Presentation' };

const MatIcon = ({ type }) => {
  if (type === 'video') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
  );
  if (type === 'document') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
  );
  if (type === 'presentation') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21l4-4 4 4M12 17v4"/></svg>
  );
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
  );
};

export default function TrainingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const toast = useToast();
  const [form, setForm]       = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError]     = useState('');

  // Materials state
  const [existingMats, setExistingMats] = useState([]);
  const [pendingMats, setPendingMats]   = useState([]);
  const [matForm, setMatForm]           = useState(defaultMatForm);
  const [showMatForm, setShowMatForm]   = useState(false);
  const [matError, setMatError]         = useState('');

  // Prerequisites state
  const [allTrainings, setAllTrainings] = useState([]);
  const [hasPrereqs, setHasPrereqs]     = useState(false);
  const [prereqs, setPrereqs]           = useState([]); // [{id, title, category}]

  useEffect(() => {
    getTrainings().then(r => setAllTrainings(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    getTraining(id)
      .then(r => {
        const t = r.data;
        setForm({
          title: t.title || '', description: t.description || '',
          type: t.type || 'self_paced', category: t.category || '',
          duration_hrs: t.duration_hrs || '', is_mandatory: t.is_mandatory || false,
          status: t.status || 'draft',
        });
        setExistingMats(t.materials || []);
        if (t.prerequisites?.length) {
          setHasPrereqs(true);
          setPrereqs(t.prerequisites.map(p => ({ id: p.id, title: p.title, category: p.category })));
        }
      })
      .finally(() => setFetching(false));
  }, [id, isEdit]);

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const setMat = f => e => setMatForm(prev => ({ ...prev, [f]: e.target.value }));

  const handleAddMaterial = () => {
    setMatError('');
    if (!matForm.title.trim()) { setMatError('Title is required.'); return; }
    if (!matForm.url.trim())   { setMatError('URL is required.'); return; }
    setPendingMats(prev => [...prev, { ...matForm, title: matForm.title.trim(), url: matForm.url.trim() }]);
    setMatForm(defaultMatForm);
    setShowMatForm(false);
  };

  const handleDeleteExisting = async (materialId) => {
    await deleteMaterial(id, materialId);
    setExistingMats(prev => prev.filter(m => m.id !== materialId));
  };

  const selectedPrereqIds = useMemo(() => new Set(prereqs.map(p => p.id)), [prereqs]);
  const availablePrereqs = useMemo(
    () => allTrainings.filter(t => t.id !== id && !selectedPrereqIds.has(t.id)),
    [allTrainings, id, selectedPrereqIds]
  );

  const addPrereq = (e) => {
    const tid = e.target.value;
    if (!tid) return;
    const t = allTrainings.find(t => t.id === tid);
    if (t) setPrereqs(prev => [...prev, { id: t.id, title: t.title, category: t.category }]);
    e.target.value = '';
  };

  const removePrereq = (i) => setPrereqs(prev => prev.filter((_, j) => j !== i));

  const movePrereq = (i, dir) => {
    setPrereqs(prev => {
      const copy = [...prev];
      const j = i + dir;
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const prereqPayload = hasPrereqs
        ? prereqs.map((p, i) => ({ id: p.id, order_index: i }))
        : [];
      let trainingId = id;
      if (isEdit) {
        await updateTraining(id, { ...form, prerequisites: prereqPayload });
      } else {
        const { data } = await createTraining({ ...form, prerequisites: prereqPayload });
        trainingId = data.id;
      }
      // POST each pending material sequentially
      for (const mat of pendingMats) {
        await addMaterial(trainingId, mat);
      }
      toast.success(isEdit ? 'Training updated' : 'Training created');
      navigate(`/trainings/${trainingId}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save training.';
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

  const totalMats = existingMats.length + pendingMats.length;

  return (
    <div className="max-w-2xl space-y-6">
      {/* ── Breadcrumb ── */}
      <Link to="/trainings" className="inline-flex items-center gap-1.5 text-muted text-xs hover:text-text transition-colors duration-150 animate-fade-up">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        {isEdit ? 'Back to training' : 'Training Library'}
      </Link>

      <div className="animate-fade-up d-60">
        <h1 className="font-display text-3xl font-bold text-text">
          {isEdit ? 'Edit Training' : 'New Training'}
        </h1>
        <p className="text-muted text-sm mt-1">
          {isEdit ? 'Update the training details below.' : 'Fill in the details to create a new training course.'}
        </p>
      </div>

      <Card className="p-6 animate-fade-up d-120">
        <form onSubmit={handleSubmit} className="space-y-5">

          <Input
            label="Title"
            value={form.title}
            onChange={set('title')}
            placeholder="e.g. React Fundamentals"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-muted-2 tracking-wide uppercase">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={4}
              placeholder="Describe what learners will gain from this training…"
              className="bg-surface-2 border border-border hover:border-border-2 focus:border-accent/50 focus:ring-2 focus:ring-accent/10
                rounded-xl px-4 py-3 text-sm text-text placeholder:text-muted/50 outline-none transition-all duration-200 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" value={form.type} onChange={set('type')}>
              <option value="self_paced">Self-paced</option>
              <option value="instructor_led">Instructor-led</option>
            </Select>

            <Select label="Status" value={form.status} onChange={set('status')}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Category" value={form.category} onChange={set('category')} placeholder="e.g. Frontend, DevOps" />
            <Input label="Duration (hours)" type="number" step="0.5" min="0" value={form.duration_hrs} onChange={set('duration_hrs')} placeholder="e.g. 8" />
          </div>

          {/* Mandatory toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150
              ${form.is_mandatory ? 'bg-accent border-accent' : 'bg-surface-2 border-border group-hover:border-border-2'}`}>
              {form.is_mandatory && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#09090D" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </div>
            <input type="checkbox" checked={form.is_mandatory} onChange={set('is_mandatory')} className="sr-only" />
            <div>
              <p className="text-sm text-text font-medium">Mark as mandatory</p>
              <p className="text-xs text-muted">Learners will see an urgent badge on this training</p>
            </div>
          </label>

          {/* ── Prerequisites ── */}
          <div className="pt-1 border-t border-border space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group pt-1">
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150 flex-shrink-0
                ${hasPrereqs ? 'bg-accent border-accent' : 'bg-surface-2 border-border group-hover:border-border-2'}`}>
                {hasPrereqs && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#09090D" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </div>
              <input type="checkbox" checked={hasPrereqs} onChange={e => { setHasPrereqs(e.target.checked); if (!e.target.checked) setPrereqs([]); }} className="sr-only" />
              <div>
                <p className="text-sm text-text font-medium">This training has prerequisites</p>
                <p className="text-xs text-muted">Learners should complete these trainings first, in the order listed</p>
              </div>
            </label>

            {hasPrereqs && (
              <div className="space-y-2 pl-8">
                {prereqs.length === 0 && (
                  <p className="text-xs text-muted/60 font-mono py-1">No prerequisites added yet.</p>
                )}

                {prereqs.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 bg-surface-2 border border-border rounded-xl px-4 py-3 group/row">
                    <span className="w-6 h-6 rounded-md bg-accent/12 border border-accent/20 text-accent text-[11px] font-mono font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-text text-sm font-medium truncate">{p.title}</p>
                      {p.category && <p className="text-muted text-[11px] font-mono mt-0.5">{p.category}</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-60 group-hover/row:opacity-100 transition-opacity duration-150">
                      <button type="button" disabled={i === 0} onClick={() => movePrereq(i, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/6 text-muted hover:text-text disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 15l-6-6-6 6"/></svg>
                      </button>
                      <button type="button" disabled={i === prereqs.length - 1} onClick={() => movePrereq(i, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/6 text-muted hover:text-text disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                      <button type="button" onClick={() => removePrereq(i)}
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-danger/10 text-muted hover:text-danger transition-all duration-150 ml-0.5">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>
                ))}

                {availablePrereqs.length > 0 && (
                  <div className="relative mt-1">
                    <select
                      defaultValue=""
                      onChange={addPrereq}
                      className="w-full appearance-none bg-surface-2 border border-dashed border-border hover:border-accent/40 focus:border-accent/50
                        text-muted text-sm rounded-xl pl-4 pr-9 py-2.5 outline-none transition-all duration-200 cursor-pointer"
                    >
                      <option value="" disabled>+ Add a prerequisite…</option>
                      {availablePrereqs.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.title}{t.category ? ` — ${t.category}` : ''}
                        </option>
                      ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                )}

                {availablePrereqs.length === 0 && prereqs.length > 0 && (
                  <p className="text-xs text-muted/50 font-mono py-0.5">All available trainings have been added.</p>
                )}
              </div>
            )}
          </div>

          {/* ── Materials ── */}
          <div className="pt-1 border-t border-border space-y-3">
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-sm font-medium text-text">Materials</p>
                <p className="text-xs text-muted mt-0.5">Links, documents, PDFs, videos, or presentations</p>
              </div>
              {!showMatForm && (
                <button
                  type="button"
                  onClick={() => setShowMatForm(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors duration-150"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add material
                </button>
              )}
            </div>

            {/* Inline add form */}
            {showMatForm && (
              <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Type" value={matForm.type} onChange={setMat('type')}>
                    <option value="link">Link</option>
                    <option value="document">Document / PDF</option>
                    <option value="video">Video</option>
                    <option value="presentation">Presentation</option>
                  </Select>
                  <Input label="Title" value={matForm.title} onChange={setMat('title')} placeholder="e.g. Module 1 slides" />
                </div>
                <Input
                  label="URL"
                  value={matForm.url}
                  onChange={setMat('url')}
                  placeholder="https://…"
                  hint="For documents/PDFs, paste a shareable link (Google Drive, SharePoint, etc.)"
                />
                {matError && <p className="text-danger text-xs">{matError}</p>}
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" onClick={handleAddMaterial}>Add</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => { setShowMatForm(false); setMatError(''); setMatForm(defaultMatForm); }}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Existing materials (edit mode) */}
            {existingMats.map(m => (
              <div key={m.id} className="flex items-center gap-3 bg-surface-2 border border-border rounded-xl px-4 py-3">
                <div className="w-7 h-7 rounded-lg bg-white/4 border border-border flex items-center justify-center text-muted flex-shrink-0">
                  <MatIcon type={m.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-text text-sm font-medium truncate">{m.title}</p>
                  <p className="text-muted text-xs font-mono truncate mt-0.5">{m.url}</p>
                </div>
                <span className="text-[10px] font-mono text-muted bg-white/4 px-2 py-0.5 rounded-md flex-shrink-0">{matTypeLabel[m.type]}</span>
                {isEdit && (
                  <button type="button" onClick={() => handleDeleteExisting(m.id)}
                    className="text-muted hover:text-danger transition-colors duration-150 flex-shrink-0 ml-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
            ))}

            {/* Pending (unsaved) materials */}
            {pendingMats.map((m, i) => (
              <div key={i} className="flex items-center gap-3 bg-accent/4 border border-accent/15 rounded-xl px-4 py-3">
                <div className="w-7 h-7 rounded-lg bg-white/4 border border-border flex items-center justify-center text-muted flex-shrink-0">
                  <MatIcon type={m.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-text text-sm font-medium truncate">{m.title}</p>
                  <p className="text-muted text-xs font-mono truncate mt-0.5">{m.url}</p>
                </div>
                <span className="text-[10px] font-mono text-accent/70 bg-accent/8 px-2 py-0.5 rounded-md flex-shrink-0">pending</span>
                <button type="button" onClick={() => setPendingMats(prev => prev.filter((_, j) => j !== i))}
                  className="text-muted hover:text-danger transition-colors duration-150 flex-shrink-0 ml-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}

            {totalMats === 0 && !showMatForm && (
              <p className="text-muted text-xs py-2">No materials added yet.</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 bg-danger/6 border border-danger/20 rounded-xl px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F04438" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create training'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
