const variants = {
  primary:   'bg-accent text-bg font-semibold hover:bg-accent-dim active:scale-[0.97] shadow-[0_0_0_1px_rgba(212,255,39,0.3),0_0_20px_rgba(212,255,39,0.12)] hover:shadow-[0_0_0_1px_rgba(212,255,39,0.4),0_0_28px_rgba(212,255,39,0.2)]',
  secondary: 'bg-surface-2 text-text border border-border hover:border-border-2 hover:bg-white/6 active:scale-[0.97]',
  danger:    'bg-danger/8 text-danger border border-danger/25 hover:bg-danger/15 active:scale-[0.97]',
  ghost:     'text-muted hover:text-text hover:bg-white/5 active:scale-[0.97]',
};

const sizes = {
  sm:  'px-3 py-1.5 text-xs gap-1.5',
  md:  'px-4 py-2 text-sm gap-2',
  lg:  'px-5 py-2.5 text-sm gap-2',
};

export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-medium
        transition-all duration-200 ease-out
        disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
