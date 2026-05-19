import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCertifications, awardCertificate, downloadCertificate } from '../api/certifications';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function Certifications() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getCertifications()
      .then(res => setItems(res.data))
      .catch(() => toast.error('Could not load certifications'))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item => (
      item.user_name?.toLowerCase().includes(q) ||
      item.user_email?.toLowerCase().includes(q) ||
      item.training_title?.toLowerCase().includes(q) ||
      item.department?.toLowerCase().includes(q)
    ));
  }, [items, search]);

  const pendingCount = items.filter(item => !item.certificate_awarded_at).length;
  const awardedCount = items.length - pendingCount;

  const handleAward = async (id) => {
    try {
      setBusyId(id);
      await awardCertificate(id);
      toast.success('Certificate awarded');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not award certificate');
    } finally {
      setBusyId('');
    }
  };

  const handleDownload = async (id) => {
    try {
      setBusyId(id);
      const res = await downloadCertificate(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Certificate downloaded');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not download certificate');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold text-text">Certifications</h1>
          <p className="text-muted text-sm mt-1">
            {items.length} completed learners · {pendingCount} pending · {awardedCount} awarded
          </p>
        </div>
      </div>

      <div className="relative animate-fade-up d-60">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search completed learners, trainings, or departments..."
          className="w-full bg-surface border border-border hover:border-border-2 focus:border-accent/50 focus:ring-2 focus:ring-accent/10
            rounded-xl pl-9 pr-4 py-2 text-sm text-text placeholder:text-muted/50 outline-none transition-all duration-200"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => <div key={i} className="h-24 bg-surface border border-border rounded-2xl animate-pulse" />)}
        </div>
      ) : visible.length === 0 ? (
        <Card className="p-14 text-center animate-scale-in">
          <p className="text-muted text-sm">No completed trainings are eligible for certification.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((item, index) => {
            const awarded = Boolean(item.certificate_awarded_at);
            return (
              <Card key={item.id} className="p-5 animate-fade-up" style={{ animationDelay: `${index * 35}ms` }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/12 border border-accent/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent font-mono text-xs font-bold">{initials(item.user_name)}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-text text-sm font-semibold truncate">{item.user_name}</p>
                      <Badge variant={awarded ? 'accent' : 'success'} dot>
                        {awarded ? 'Certified' : 'Completed'}
                      </Badge>
                    </div>
                    <p className="text-muted text-xs mt-1">
                      {item.training_title}
                      {item.department && ` · ${item.department}`}
                    </p>
                    <p className="text-muted/70 text-[11px] font-mono mt-1">
                      Completed {formatDate(item.completed_at)}
                      {awarded && ` · Awarded ${formatDate(item.certificate_awarded_at)}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {awarded ? (
                      <Button variant="secondary" size="sm" onClick={() => handleDownload(item.id)} disabled={busyId === item.id}>
                        Download
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => handleAward(item.id)} disabled={busyId === item.id}>
                        Award Certificate
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
