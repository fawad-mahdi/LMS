import { Link } from 'react-router-dom';
import useCountUp from '../../hooks/useCountUp';
import Card from './Card';

export default function StatCard({ label, value, sub, accent, icon, delay = 0, className = '', to }) {
  const isPercent = typeof value === 'string' && value.includes('%');
  const raw = isPercent ? parseFloat(value) : (typeof value === 'number' ? value : null);
  const animated = useCountUp(raw, { delay });
  const display = raw !== null
    ? (isPercent ? `${animated}%` : animated.toLocaleString())
    : value;

  const inner = (
    <Card className={`p-6 group transition-all duration-300 hover:border-border-2 ${to ? 'cursor-pointer hover:shadow-card-hover' : ''} ${className}`}>
      <div className="flex items-start justify-between">
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-white/4 border border-border flex items-center justify-center text-muted mb-5
            group-hover:text-accent group-hover:border-accent/25 group-hover:bg-accent/6 transition-all duration-300">
            {icon}
          </div>
        )}
        {to && (
          <svg className="text-muted/0 group-hover:text-muted/40 transition-all duration-200 mt-1" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
        )}
      </div>
      <p className={`font-display text-[2.25rem] font-bold tracking-tight leading-none animate-fade-up ${accent ? 'text-accent' : 'text-text'}`}
         style={{ animationDelay: `${delay}ms` }}>
        {display ?? '—'}
      </p>
      <p className="text-muted text-[11px] font-mono uppercase tracking-widest mt-2">{label}</p>
      {sub && <p className="text-muted/60 text-xs mt-2 leading-snug">{sub}</p>}
    </Card>
  );

  if (to) return <Link to={to} className="block">{inner}</Link>;
  return inner;
}
