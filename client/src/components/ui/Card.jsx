export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`border border-border bg-surface rounded-2xl shadow-card ${
        hover ? 'transition-all duration-200 hover:border-accent/20 hover:shadow-card-hover hover:-translate-y-px cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
