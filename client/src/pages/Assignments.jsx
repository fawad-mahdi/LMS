import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAssignments, completeAssignment, uncompleteAssignment, updateProgress } from '../api/assignments';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

/* ─────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────── */
const FLAT_TABS = ['All', 'In Progress', 'Not Started', 'Completed', 'Overdue'];

const STATUS_OPTS = [
  { value: 'all',         label: 'All Statuses' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'completed',   label: 'Completed' },
  { value: 'overdue',     label: 'Overdue' },
];

const SORT_GROUP_OPTS = [
  { value: 'name_asc',      label: 'Name A → Z' },
  { value: 'name_desc',     label: 'Name Z → A' },
  { value: 'count_desc',    label: 'Most assigned' },
  { value: 'progress_asc',  label: 'Lowest progress' },
  { value: 'overdue_desc',  label: 'Most overdue' },
];

const SORT_FLAT_OPTS = [
  { value: 'date_desc',     label: 'Date (newest)' },
  { value: 'name_asc',      label: 'Name A → Z' },
  { value: 'due_asc',       label: 'Due date (soonest)' },
  { value: 'progress_asc',  label: 'Progress (lowest)' },
];

const statusVariant = { completed: 'success', in_progress: 'warning', not_started: 'muted' };
const statusLabel   = { completed: 'Completed', in_progress: 'In Progress', not_started: 'Not Started' };

/* ─────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────── */
function isOverdue(a) {
  return a.due_date && a.status !== 'completed' && new Date(a.due_date) < new Date();
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function groupStats(items) {
  const total      = items.length;
  const completed  = items.filter(a => a.status === 'completed').length;
  const inProgress = items.filter(a => a.status === 'in_progress').length;
  const overdue    = items.filter(isOverdue).length;
  const avgPct     = total > 0
    ? Math.round(items.reduce((s, a) => s + (a.progress_pct || 0), 0) / total)
    : 0;
  return { total, completed, inProgress, overdue, avgPct };
}

function paramToTab(p) {
  if (p === 'in_progress') return 'In Progress';
  if (p === 'not_started') return 'Not Started';
  if (p === 'completed')   return 'Completed';
  if (p === 'overdue')     return 'Overdue';
  return 'All';
}

function applyStatusFilter(items, status) {
  if (!status || status === 'all') return items;
  if (status === 'overdue')     return items.filter(isOverdue);
  return items.filter(a => a.status === status);
}

function applySearch(items, q, mode) {
  if (!q) return items;
  const lq = q.toLowerCase();
  if (mode === 'by_user')     return items.filter(a => (a.user_name || '').toLowerCase().includes(lq));
  return items.filter(a => (a.training_title || '').toLowerCase().includes(lq));
}

function sortItems(items, sort) {
  const copy = [...items];
  switch (sort) {
    case 'name_asc':     return copy.sort((a, b) => (a.training_title||'').localeCompare(b.training_title||''));
    case 'name_desc':    return copy.sort((a, b) => (b.training_title||'').localeCompare(a.training_title||''));
    case 'due_asc':      return copy.sort((a, b) => (!a.due_date ? 1 : !b.due_date ? -1 : new Date(a.due_date) - new Date(b.due_date)));
    case 'progress_asc': return copy.sort((a, b) => (a.progress_pct||0) - (b.progress_pct||0));
    default:             return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // date_desc
  }
}

function sortGroups(groups, sort) {
  const copy = [...groups];
  switch (sort) {
    case 'name_desc':    return copy.sort((a, b) => b.label.localeCompare(a.label));
    case 'count_desc':   return copy.sort((a, b) => b.items.length - a.items.length);
    case 'progress_asc': return copy.sort((a, b) => groupStats(a.items).avgPct - groupStats(b.items).avgPct);
    case 'overdue_desc': return copy.sort((a, b) => groupStats(b.items).overdue - groupStats(a.items).overdue);
    default:             return copy.sort((a, b) => a.label.localeCompare(b.label)); // name_asc
  }
}

function buildGroups(items, mode) {
  const map = new Map();
  for (const a of items) {
    const key   = mode === 'by_user' ? a.user_id : a.training_id;
    const label = mode === 'by_user' ? a.user_name : a.training_title;
    const sub   = mode === 'by_user' ? a.department : (a.category || a.training_type);
    if (!map.has(key)) map.set(key, { key, label: label || '—', sub, items: [] });
    map.get(key).items.push(a);
  }
  return [...map.values()];
}

/* ─────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────── */
function ProgressBar({ pct, thin = false }) {
  const color = pct === 100 ? 'var(--success)' : pct > 50 ? 'var(--accent)' : 'var(--warning)';
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex-1 bg-white/6 rounded-full overflow-hidden ${thin ? 'h-1' : 'h-1.5'}`}>
        <div className="h-full rounded-full progress-animate" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-mono text-muted w-8 text-right flex-shrink-0">{pct}%</span>
    </div>
  );
}

// Compact row inside grouped accordion
function AssignmentRow({ a, mode, onComplete, onUncomplete, canAct }) {
  const overdue = isOverdue(a);
  const nameLabel = mode === 'by_user' ? a.training_title : a.user_name;
  const subLabel  = mode === 'by_user' ? (a.category || '') : (a.department || '');

  return (
    <div className={`flex items-center gap-4 px-5 py-3 border-b border-border/40 last:border-0 hover:bg-white/2 transition-colors duration-100 ${overdue ? 'bg-danger/2' : ''}`}>
      {/* Avatar / indicator */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0
        ${a.status === 'completed' ? 'bg-success/15 text-success' : a.status === 'in_progress' ? 'bg-accent/15 text-accent' : 'bg-white/5 text-muted'}`}>
        {mode === 'by_user'
          ? <span>{a.training_title?.[0]?.toUpperCase() || '?'}</span>
          : <span>{initials(a.user_name)}</span>
        }
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-text text-sm font-medium truncate">{nameLabel || '—'}</span>
          {overdue && <Badge variant="danger" dot>Overdue</Badge>}
        </div>
        {subLabel && <span className="text-muted text-xs">{subLabel}</span>}
      </div>

      {/* Progress */}
      <div className="w-32 flex-shrink-0">
        <ProgressBar pct={a.progress_pct || 0} />
      </div>

      {/* Status badge */}
      <div className="flex-shrink-0">
        <Badge variant={statusVariant[a.status]} dot>{statusLabel[a.status]}</Badge>
      </div>

      {/* Actions */}
      {canAct && (
        <div className="flex-shrink-0">
          {a.status === 'completed' ? (
            <button onClick={() => onUncomplete(a.id)}
              className="text-[11px] font-mono text-muted/60 hover:text-warning transition-colors duration-150 underline underline-offset-2 whitespace-nowrap">
              Undo
            </button>
          ) : (
            <button onClick={() => onComplete(a.id)}
              className="text-[11px] font-mono text-muted/60 hover:text-accent transition-colors duration-150 whitespace-nowrap">
              Mark done
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Collapsible group accordion
function GroupAccordion({ group, mode, onComplete, onUncomplete, canAct, expandAll }) {
  const [open, setOpen] = useState(false);
  const stats = groupStats(group.items);

  // Sync with expand-all toggle; local click still overrides
  useEffect(() => { setOpen(expandAll); }, [expandAll]);

  const progressColor = stats.avgPct === 100 ? 'var(--success)' : stats.avgPct > 50 ? 'var(--accent)' : 'var(--warning)';

  return (
    <Card className="overflow-hidden transition-all duration-200">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors duration-150"
      >
        {/* Chevron */}
        <svg
          className={`text-muted flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>

        {/* Avatar */}
        {mode === 'by_user' ? (
          <div className="w-8 h-8 rounded-full bg-accent/15 text-accent text-[11px] font-bold flex items-center justify-center flex-shrink-0">
            {initials(group.label)}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-border text-muted text-[11px] flex items-center justify-center flex-shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
          </div>
        )}

        {/* Label + sub */}
        <div className="text-left flex-1 min-w-0">
          <p className="text-text text-sm font-medium truncate">{group.label}</p>
          {group.sub && <p className="text-muted text-xs capitalize">{group.sub}</p>}
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {stats.overdue > 0 && (
            <span className="text-[10px] font-mono text-danger bg-danger/10 px-2 py-0.5 rounded-full">
              {stats.overdue} overdue
            </span>
          )}
          <span className="text-[10px] font-mono text-muted">
            {stats.completed}/{stats.total} done
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="w-24 flex-shrink-0 hidden sm:flex items-center gap-2">
          <div className="flex-1 h-1 bg-white/6 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${stats.avgPct}%`, background: progressColor, transition: 'width 0.4s ease-out' }} />
          </div>
          <span className="text-[10px] font-mono text-muted w-6 text-right">{stats.avgPct}%</span>
        </div>
      </button>

      {/* Expanded rows */}
      {open && (
        <div className="border-t border-border">
          {group.items.map(a => (
            <AssignmentRow
              key={a.id}
              a={a}
              mode={mode}
              onComplete={onComplete}
              onUncomplete={onUncomplete}
              canAct={canAct}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────────────
   Flat card with interactive progress slider
───────────────────────────────────────────────── */
function pctColor(p) {
  if (p === 100) return '#17B26A';
  if (p > 50)    return '#D4FF27';
  return '#F79009';
}

function FlatCard({ a, onComplete, onUncomplete, onUpdateProgress, canAct, i }) {
  const overdue = isOverdue(a);
  const [localPct, setLocalPct] = useState(a.progress_pct || 0);

  // Sync when parent refreshes assignment data
  useEffect(() => { setLocalPct(a.progress_pct || 0); }, [a.progress_pct]);

  const handleSliderChange = (e) => setLocalPct(Number(e.target.value));

  const handleSliderCommit = async (e) => {
    const pct = Number(e.target.value);
    if (pct === (a.progress_pct || 0)) return;
    if (pct === 100) {
      await onComplete(a.id);
    } else {
      await onUpdateProgress(a.id, pct);
    }
  };

  const color = pctColor(localPct);
  const sliderBg = `linear-gradient(to right, ${color} ${localPct}%, rgba(255,255,255,0.07) ${localPct}%)`;

  return (
    <Card className={`p-5 group transition-all duration-150 hover:border-border-2 animate-fade-up ${overdue ? 'border-danger/20' : ''}`}
      style={{ animationDelay: `${i * 35}ms` }}>
      <div className="flex items-start gap-5">
        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
          a.status === 'completed' ? 'bg-success' :
          a.status === 'in_progress' ? 'bg-accent' : 'bg-border-2'
        }`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-text text-base">{a.training_title}</h3>
                {overdue && <Badge variant="danger" dot>Overdue</Badge>}
              </div>
              {a.user_name && <p className="text-muted text-xs mt-0.5">{a.user_name} · {a.department}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={statusVariant[a.status]} dot>{statusLabel[a.status]}</Badge>
              {canAct && (
                a.status === 'completed' ? (
                  <button onClick={() => onUncomplete(a.id)}
                    className="text-[11px] font-mono text-muted/60 hover:text-warning transition-colors duration-150 underline underline-offset-2">
                    Undo
                  </button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => onComplete(a.id)}>Mark done</Button>
                )
              )}
            </div>
          </div>

          {/* Interactive progress slider — thumb appears on group hover */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0" max="100" step="5"
                  value={localPct}
                  onChange={handleSliderChange}
                  onMouseUp={handleSliderCommit}
                  onTouchEnd={handleSliderCommit}
                  disabled={!canAct || a.status === 'completed'}
                  className="prog-slider w-full"
                  style={{ background: sliderBg }}
                  title={`${localPct}% — drag to update progress`}
                />
              </div>
              <span className="text-[11px] font-mono text-muted w-8 text-right flex-shrink-0">{localPct}%</span>
            </div>
            {canAct && a.status !== 'completed' && (
              <p className="text-[10px] text-muted/40 font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                drag slider to update progress
              </p>
            )}
            {a.due_date && (
              <div className="flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  className={overdue ? 'text-danger' : 'text-muted'}>
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span className={`text-[11px] font-mono ${overdue ? 'text-danger' : 'text-muted'}`}>
                  Due {new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────
   Styled select for filter controls
───────────────────────────────────────────────── */
function FilterSelect({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none bg-surface border border-border hover:border-border-2 text-text text-sm rounded-xl
          pl-3 pr-8 py-2 outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all duration-200 cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   View mode toggle
───────────────────────────────────────────────── */
function ViewToggle({ value, onChange, options }) {
  return (
    <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden">
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          title={o.label}
          className={`flex items-center justify-center w-9 h-9 transition-all duration-150 border-r border-border last:border-0
            ${value === o.value ? 'bg-accent/10 text-accent' : 'text-muted hover:text-muted-2 hover:bg-white/3'}`}>
          {o.icon}
        </button>
      ))}
    </div>
  );
}

const IcoList = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const IcoBook = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>;
const IcoUsers = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;

/* ─────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────── */
export default function Assignments() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [all, setAll]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [flatTab, setFlatTab] = useState(() => paramToTab(searchParams.get('status')));

  // Controls
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState(() => {
    const p = searchParams.get('status');
    return p && p !== '' ? p : 'all';
  });
  const [sortFlat, setSortFlat]   = useState('date_desc');
  const [sortGroup, setSortGroup] = useState('name_asc');

  // View mode — employees can only see flat list (their own assignments)
  const isEmployee = user?.role === 'employee';
  const isInstructor = user?.role === 'instructor';

  const viewOptions = useMemo(() => {
    const opts = [{ value: 'flat', label: 'Individual', icon: IcoList }];
    if (!isEmployee) opts.push({ value: 'by_training', label: 'By Training', icon: IcoBook });
    if (!isEmployee && !isInstructor) opts.push({ value: 'by_user', label: 'By User', icon: IcoUsers });
    return opts;
  }, [isEmployee, isInstructor]);

  const [view, setView] = useState('flat');

  const [expandAll, setExpandAll] = useState(false);

  const canAssign = user?.role === 'admin';
  // Managers viewing others' assignments shouldn't be able to mark complete/undo
  const canAct = user?.role !== 'manager';

  const load = useCallback(() => {
    setLoading(true);
    getAssignments().then(r => setAll(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Sync status dropdown → flat tab when in flat view
  useEffect(() => {
    if (view !== 'flat') return;
    if (status === 'all')         setFlatTab('All');
    else if (status === 'in_progress') setFlatTab('In Progress');
    else if (status === 'not_started') setFlatTab('Not Started');
    else if (status === 'completed')   setFlatTab('Completed');
    else if (status === 'overdue')     setFlatTab('Overdue');
  }, [status, view]);

  const handleComplete = useCallback(async (id) => {
    await completeAssignment(id);
    toast.success('Marked as complete');
    load();
  }, [load, toast]);

  const handleUncomplete = useCallback(async (id) => {
    await uncompleteAssignment(id);
    toast.info('Reset to not started');
    load();
  }, [load, toast]);

  const handleUpdateProgress = useCallback(async (id, pct) => {
    await updateProgress(id, pct);
    toast.success(`Progress updated to ${pct}%`);
    load();
  }, [load, toast]);

  /* ── Derived data ── */

  // Flat view: filter by tab, then search, then sort
  const flatVisible = useMemo(() => {
    let items = [...all];
    if (flatTab === 'In Progress')  items = items.filter(a => a.status === 'in_progress');
    else if (flatTab === 'Not Started') items = items.filter(a => a.status === 'not_started');
    else if (flatTab === 'Completed')   items = items.filter(a => a.status === 'completed');
    else if (flatTab === 'Overdue')     items = items.filter(isOverdue);
    if (search) items = items.filter(a => (a.training_title || '').toLowerCase().includes(search.toLowerCase()));
    return sortItems(items, sortFlat);
  }, [all, flatTab, search, sortFlat]);

  // Grouped view: filter by status + search, then group, then sort groups
  const groups = useMemo(() => {
    if (view === 'flat') return [];
    let items = applyStatusFilter(all, status);
    items = applySearch(items, search, view);
    const raw = buildGroups(items, view);
    return sortGroups(raw, sortGroup);
  }, [all, view, status, search, sortGroup]);

  const flatTabCount = (tab) => {
    if (tab === 'All')         return all.length;
    if (tab === 'In Progress') return all.filter(a => a.status === 'in_progress').length;
    if (tab === 'Not Started') return all.filter(a => a.status === 'not_started').length;
    if (tab === 'Completed')   return all.filter(a => a.status === 'completed').length;
    return all.filter(isOverdue).length;
  };

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold text-text">Assignments</h1>
          <p className="text-muted text-sm mt-1">
            {all.length} total · {all.filter(a => a.status === 'completed').length} completed · {all.filter(isOverdue).length} overdue
          </p>
        </div>
        {canAssign && (
          <Link to="/assignments/new">
            <Button>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Assign Training
            </Button>
          </Link>
        )}
      </div>

      {/* ── Controls row ── */}
      <div className="flex items-center gap-2 flex-wrap animate-fade-up d-60">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={view === 'by_user' ? 'Search users…' : 'Search trainings…'}
            className="w-full bg-surface border border-border hover:border-border-2 focus:border-accent/50 focus:ring-2 focus:ring-accent/10
              rounded-xl pl-9 pr-4 py-2 text-sm text-text placeholder:text-muted/50 outline-none transition-all duration-200"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>

        {/* View toggle */}
        {viewOptions.length > 1 && (
          <ViewToggle value={view} onChange={v => { setView(v); setSearch(''); }} options={viewOptions} />
        )}

        {/* Status filter (only in grouped view; flat uses tabs) */}
        {view !== 'flat' && (
          <FilterSelect value={status} onChange={setStatus} options={STATUS_OPTS} />
        )}

        {/* Sort */}
        {view === 'flat'
          ? <FilterSelect value={sortFlat}  onChange={setSortFlat}  options={SORT_FLAT_OPTS}  />
          : <FilterSelect value={sortGroup} onChange={setSortGroup} options={SORT_GROUP_OPTS} />
        }

        {/* Expand/collapse all (grouped only) */}
        {view !== 'flat' && groups.length > 0 && (
          <button
            onClick={() => setExpandAll(v => !v)}
            className="text-xs font-mono text-muted hover:text-text transition-colors duration-150 whitespace-nowrap px-1"
          >
            {expandAll ? 'Collapse all' : 'Expand all'}
          </button>
        )}
      </div>

      {/* ── Flat view: status tabs ── */}
      {view === 'flat' && (
        <div className="flex items-center gap-1 border-b border-border animate-fade-up d-80">
          {FLAT_TABS.map(t => (
            <button key={t} onClick={() => { setFlatTab(t); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all duration-150
                ${flatTab === t ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-muted-2'}`}>
              {t}
              <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${flatTab === t ? 'bg-accent/15 text-accent' : 'bg-white/5 text-muted'}`}>
                {flatTabCount(t)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="space-y-3">
          {[0,1,2,3].map(i => <div key={i} className="h-20 bg-surface border border-border rounded-2xl animate-pulse" />)}
        </div>
      ) : view === 'flat' ? (
        /* Flat list */
        flatVisible.length === 0 ? (
          <Card className="p-14 text-center animate-scale-in">
            <svg className="mx-auto mb-3 text-muted" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            <p className="text-muted text-sm">No assignments match this filter.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {flatVisible.map((a, i) => (
              <FlatCard key={a.id} a={a} i={i}
                onComplete={handleComplete}
                onUncomplete={handleUncomplete}
                onUpdateProgress={handleUpdateProgress}
                canAct={canAct} />
            ))}
          </div>
        )
      ) : (
        /* Grouped view */
        groups.length === 0 ? (
          <Card className="p-14 text-center animate-scale-in">
            <p className="text-muted text-sm">No assignments match this filter.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-mono text-muted px-1">
              {groups.length} {view === 'by_user' ? 'user' : 'training'}{groups.length !== 1 ? 's' : ''} · {all.length} assignments total
            </p>
            {groups.map(g => (
              <GroupAccordion
                key={g.key}
                group={g}
                mode={view}
                onComplete={handleComplete}
                onUncomplete={handleUncomplete}
                canAct={canAct}
                expandAll={expandAll}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
