export default function Spinner({ size = 'md', className = '' }) {
  const s = { sm: 'w-4 h-4 border', md: 'w-7 h-7 border-2', lg: 'w-12 h-12 border-2' }[size];
  return (
    <div
      className={`${s} border-accent/20 border-t-accent rounded-full ${className}`}
      style={{ animation: 'spin 0.7s linear infinite' }}
    />
  );
}
