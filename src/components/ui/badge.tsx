'use client';

type Props = {
  children: React.ReactNode;
  variant?: 'default' | 'muted' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
};

export default function Badge({
  children,
  variant = 'default',
  className = '',
}: Props) {
  const base =
    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium';
  const styles: Record<NonNullable<Props['variant']>, string> = {
    default: 'border-slate-300 bg-white text-slate-800',
    muted: 'border-slate-200 bg-slate-100 text-slate-700',
    success: 'border-green-200 bg-green-50 text-green-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
  };

  return (
    <span className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
