// src/components/book/RatingStars.tsx
'use client';

import { useCallback } from 'react';

type Props = {
  /** valor atual (1..5). Use 0 ou undefined para “sem avaliação” */
  value?: number;
  /** chamado quando o usuário seleciona (1..5) ou zera (0) */
  onChange?: (next: number) => void;
  /** tamanho opcional (px) */
  size?: number;
  /** classe extra */
  className?: string;
  /** rótulo para leitores de tela */
  ariaLabel?: string;
};

export default function RatingStars({
  value = 0,
  onChange,
  size = 20,
  className = '',
  ariaLabel = 'Avaliação',
}: Props) {
  // clique em uma estrela: se clicar a mesma novamente → limpa (0)
  const handleClick = useCallback(
    (n: number) => {
      if (!onChange) return;
      onChange(value === n ? 0 : n);
    },
    [onChange, value]
  );

  // setas esquerda/direita no teclado
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!onChange) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onChange(Math.min(5, (value || 0) + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onChange(Math.max(0, (value || 0) - 1));
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onChange(0);
      }
    },
    [onChange, value]
  );

  return (
    <div
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={value || 0}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`inline-flex items-center gap-1 outline-none ${className}`}
    >
      {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => {
        const filled = n <= (value || 0);
        return (
          <button
            type="button"
            key={n}
            onClick={() => handleClick(n)}
            className="rounded p-0.5 focus-visible:ring-2 focus-visible:ring-slate-400"
            aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
            title={`${n} estrela${n > 1 ? 's' : ''}`}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={filled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={1.5}
              className={filled ? 'text-amber-500' : 'text-slate-400'}
            >
              <path d="M12 3.75l2.92 5.92 6.54.95-4.73 4.61 1.12 6.53L12 18.9l-5.85 3.06 1.12-6.53-4.73-4.61 6.54-.95L12 3.75z" />
            </svg>
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onChange?.(0)}
        className="ml-2 rounded border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
        title="Limpar avaliação"
      >
        Limpar
      </button>
    </div>
  );
}
