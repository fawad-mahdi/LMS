import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTrainings } from '../api/trainings';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const statusVariant = { published: 'success', draft: 'warning', archived: 'muted' };
const typeLabel      = { self_paced: 'Self-paced', instructor_led: 'Instructor-led' };

const categoryColors = [
  'border-l-accent', 'border-l-[#60A5FA]', 'border-l-[#A78BFA]',
  'border-l-[#34D399]', 'border-l-[#F97316]', 'border-l-[#EC4899]',
];

function getCategoryColor(category) {
  if (!category) return categoryColors[0];
  const i = category.charCodeAt(0) % categoryColors.length;
  return categoryColors[i];
}

const FILTERS = ['All', 'Self-paced', 'Instructor-led', 'Mandatory'];

export default function Trainings() {
  const { user } = useAuth();
  const [all, setAll]       = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrainings().then(r => setAll(r.data)).finally(() => setLoading(false));
  }, []);

  const visible = all.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.category || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'All' ? true :
      filter === 'Self-paced' ? t.type === 'self_paced' :
      filter === 'Instructor-led' ? t.type === 'instructor_led' :
      filter === 'Mandatory' ? t.is_mandatory :
      true;
    return matchSearch && matchFilter;
  });

  const canCreate = ['admin', 'instructor'].includes(user?.role);

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold text-text">Training Library</h1>
          <p className="text-muted text-sm mt-1">{all.length} course{all.length !== 1 ? 's' : ''} available</p>
        </div>
        {canCreate && (
          <Link to="/trainings/new">
            <Button>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Training
            </Button>
          </Link>
        )}
      </div>

      {/* ── Search + filters ── */}
      <div className="flex items-center gap-3 flex-wrap animate-fade-up d-60">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Search trainings…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface border border-border hover:border-border-2 focus:border-accent/50 focus:ring-2 focus:ring-accent/10
              rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-muted/60 outline-none transition-all duration-200"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150
                ${filter === f
                  ? 'bg-accent/10 text-accent border-accent/20'
                  : 'bg-transparent text-muted border-border hover:border-border-2 hover:text-muted-2'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="grid gap-3">
          {[0,1,2,3].map(i => (
            <div key={i} className="h-24 bg-surface border border-border rounded-2xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card className="p-14 text-center animate-scale-in">
          <svg className="mx-auto mb-3 text-muted" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
          <p className="text-muted text-sm">No trainings found.</p>
          {search && <button onClick={() => setSearch('')} className="text-accent text-xs mt-2 hover:underline">Clear search</button>}
        </Card>
      ) : (
        <div className="grid gap-3">
          {visible.map((t, i) => (
            <Link key={t.id} to={`/trainings/${t.id}`}>
              <Card className={`p-5 hover:border-accent/20 hover:-translate-y-px transition-all duration-200 border-l-4 ${getCategoryColor(t.category)} animate-fade-up`}
                style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-center gap-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display font-bold text-text text-base">{t.title}</h2>
                      {t.is_mandatory && <Badge variant="danger" dot>Mandatory</Badge>}
                    </div>
                    <p className="text-muted text-sm mt-1 line-clamp-1">{t.description}</p>
                    <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
                      {t.category && <Badge variant="muted">{t.category}</Badge>}
                      <Badge variant="muted">{typeLabel[t.type]}</Badge>
                      {t.duration_hrs && (
                        <span className="text-muted text-[11px] font-mono">{t.duration_hrs}h</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant={statusVariant[t.status] || 'muted'} dot>{t.status}</Badge>
                    <svg className="text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
