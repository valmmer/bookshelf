// src/components/StarRating.tsx
//
// Componente visual de avaliação (1..5 estrelas).
// - Somente exibição (read-only).
// - Acessível: tem aria-label com a nota.
// - Sem dependência externa além de React e Tailwind.

import { memo } from 'react';

type Props = {
  rating?: number; // 1..5 (aceita undefined)
  size?: 'sm' | 'md';
  className?: string;
  title?: string;
};

function clamp(r?: number) {
  if (r == null) return undefined;
  return Math.min(5, Math.max(1, Math.round(r)));
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-4 w-4 sm:h-5 sm:w-5 ${
        filled ? 'fill-amber-400 text-amber-400' : 'fill-none text-amber-400'
      }`}
    >
      <path
        className="stroke-current"
        strokeWidth="2"
        d="M12 17.27l6.18 3.73-1.64-7.03L21.5 9.24l-7.19-.61L12 2 9.69 8.63 2.5 9.24l4.96 4.73L5.82 21z"
      />
    </svg>
  );
}

function StarRatingBase({ rating, size = 'md', className, title }: Props) {
  const r = clamp(rating);
  return (
    <div
      className={`inline-flex items-center gap-1 ${
        size === 'sm' ? 'scale-90 origin-left' : ''
      } ${className ?? ''}`}
      role="img"
      aria-label={r ? `Avaliação: ${r} de 5` : 'Sem avaliação'}
      title={title ?? (r ? `${r}/5` : 'Sem avaliação')}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} filled={r ? i < r : false} />
      ))}
      {r ? (
        <span className="ml-1 text-xs text-slate-600 dark:text-slate-400">
          {r}/5
        </span>
      ) : (
        <span className="ml-1 text-xs text-slate-400">—</span>
      )}
    </div>
  );
}

export const StarRating = memo(StarRatingBase);
