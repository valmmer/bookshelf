'use client';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type Toast = {
  id: string;
  title?: string;
  message: string;
  // 'success' | 'error' | 'info'
  variant?: 'success' | 'error' | 'info';
  // auto dismiss em ms (default 3.5s)
  duration?: number;
};

type ToastContextType = {
  showToast: (t: Omit<Toast, 'id'>) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    const toast: Toast = { id, duration: 3500, variant: 'info', ...t };
    setToasts((prev) => [...prev, toast]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, toast.duration);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Container fixo no topo-direita */}
      <div className="fixed right-4 top-4 z-[1000] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={[
              'w-[min(90vw,360px)] rounded-xl border px-4 py-3 shadow-lg transition-all',
              t.variant === 'success' &&
                'border-green-300 bg-green-50 text-green-900',
              t.variant === 'error' && 'border-red-300 bg-red-50 text-red-900',
              t.variant === 'info' &&
                'border-slate-300 bg-white text-slate-900',
            ].join(' ')}
          >
            {t.title && <p className="mb-0.5 font-medium">{t.title}</p>}
            <p className="text-sm opacity-90">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
