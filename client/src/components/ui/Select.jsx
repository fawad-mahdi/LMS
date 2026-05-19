export default function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-muted-2 tracking-wide uppercase">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`w-full appearance-none bg-surface-2 border rounded-xl px-4 py-2.5 text-sm text-text
            outline-none transition-all duration-200 pr-10 cursor-pointer
            focus:border-accent/50 focus:ring-2 focus:ring-accent/10
            ${error ? 'border-danger/50' : 'border-border hover:border-border-2'}
            ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </div>
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}
