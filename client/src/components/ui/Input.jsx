export default function Input({ label, error, hint, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-muted-2 tracking-wide uppercase">
          {label}
        </label>
      )}
      <input
        className={`bg-surface-2 border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/60
          outline-none ring-0
          transition-all duration-200
          focus:border-accent/50 focus:ring-2 focus:ring-accent/10
          ${error ? 'border-danger/50 focus:border-danger focus:ring-danger/10' : 'border-border hover:border-border-2'}
          ${className}`}
        {...props}
      />
      {hint  && !error && <p className="text-[11px] text-muted">{hint}</p>}
      {error && <p className="text-[11px] text-danger flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        {error}
      </p>}
    </div>
  );
}
