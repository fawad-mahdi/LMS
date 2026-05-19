const cfg = {
  success: { bg: 'bg-success/12 text-success border-success/20',  dot: 'bg-success' },
  warning: { bg: 'bg-warning/12 text-warning border-warning/20',  dot: 'bg-warning' },
  danger:  { bg: 'bg-danger/12  text-danger  border-danger/20',   dot: 'bg-danger' },
  muted:   { bg: 'bg-white/6   text-muted-2  border-white/8',     dot: 'bg-muted' },
  accent:  { bg: 'bg-accent/12  text-accent   border-accent/20',  dot: 'bg-accent' },
};

export default function Badge({ children, variant = 'muted', dot = false }) {
  const { bg, dot: dotColor } = cfg[variant] ?? cfg.muted;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-mono font-medium border ${bg}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0`} />}
      {children}
    </span>
  );
}
