// src/components/ui/badge.tsx
'use client';

import { cn } from '@/lib/utils';

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
    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors';

  const styles: Record<NonNullable<Props['variant']>, string> = {
    default:
      // borda/fundo neutros, legíveis em ambos temas
      'border-border bg-muted/60 text-foreground dark:bg-muted/30',
    muted: 'border-transparent bg-muted text-muted-foreground dark:bg-muted/20',
    success:
      'border-green-200 bg-green-50 text-green-800 dark:border-emerald-600/40 dark:bg-emerald-900/30 dark:text-emerald-200',
    warning:
      'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-600/40 dark:bg-amber-900/30 dark:text-amber-200',
    danger:
      'border-red-200 bg-red-50 text-red-800 dark:border-red-600/40 dark:bg-red-900/30 dark:text-red-200',
    info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-sky-600/40 dark:bg-sky-900/30 dark:text-sky-200',
  };

  return (
    <span className={cn(base, styles[variant], className)}>{children}</span>
  );
}
  