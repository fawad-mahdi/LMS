import { createContext, useCallback, useContext, useReducer } from 'react';

const Ctx = createContext(null);

let uid = 0;
const reducer = (s, a) => {
  if (a.type === 'ADD')    return [...s, a.toast];
  if (a.type === 'REMOVE') return s.filter(t => t.id !== a.id);
  return s;
};

const CONF = {
  success: {
    cls: 'border-success/30 bg-success/8 text-success',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  },
  error: {
    cls: 'border-danger/30 bg-danger/8 text-danger',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  },
  warning: {
    cls: 'border-warning/30 bg-warning/8 text-warning',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  },
  info: {
    cls: 'border-accent/30 bg-accent/8 text-accent',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  },
};

function ToastItem({ toast, onRemove }) {
  const { cls, icon } = CONF[toast.type] || CONF.info;
  return (
    <div className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-lg
      max-w-[340px] min-w-[260px] animate-toast-in ${cls}`}
      style={{ backdropFilter: 'blur(8px)' }}>
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <p className="text-sm flex-1 leading-snug font-medium">{toast.message}</p>
      <button
        onClick={onRemove}
        className="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity duration-150 mt-0.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={() => onRemove(t.id)} />
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const remove = useCallback((id) => dispatch({ type: 'REMOVE', id }), []);

  const add = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++uid;
    dispatch({ type: 'ADD', toast: { id, message, type } });
    if (duration > 0) setTimeout(() => remove(id), duration);
  }, [remove]);

  const toast = {
    success: (m, d) => add(m, 'success', d),
    error:   (m, d) => add(m, 'error',   d),
    warning: (m, d) => add(m, 'warning', d),
    info:    (m, d) => add(m, 'info',    d),
  };

  return (
    <Ctx.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(Ctx);
