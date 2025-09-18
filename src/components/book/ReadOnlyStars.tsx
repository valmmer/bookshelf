'use client';

import * as React from 'react';
import { Star } from 'lucide-react';

type Props = {
  /** nota entre 0 e max (default 5) */
  value: number;
  /** total de estrelas (default 5) */
  max?: number;
  /** mostra o número (ex.: 4.0/5) ao lado das estrelas */
  showValue?: boolean;
  /** classe extra */
  className?: string;
  /** tamanho das estrelas (rem) */
  sizeRem?: number;
};

export default function ReadOnlyStars({
  value,
  max = 5,
  showValue = true,
  className,
  sizeRem = 1.0,
}: Props) {
  const clamped = Math.max(0, Math.min(value ?? 0, max));
  const full = Math.floor(clamped);
  const empty = Math.max(0, max - full);
  const label = `Avaliação: ${clamped} de ${max}`;

  return (
    <div
      className={`inline-flex items-center gap-1 ${className || ''}`}
      role="img"
      aria-label={label}
      title={label}
    >
      {/* estrelas preenchidas */}
      {Array.from({ length: full }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className="text-amber-500"
          style={{ width: `${sizeRem}rem`, height: `${sizeRem}rem` }}
          // lucide não tem fill por padrão; usamos currentColor + stroke
          // para "preencher", aplicamos classe 'fill-current'
          // @ts-ignore – ignoramos o tipo do prop 'fill' no JSX
          fill="currentColor"
        />
      ))}

      {/* estrelas vazias */}
      {Array.from({ length: empty }).map((_, i) => (
        <Star
          key={`empty-${i}`}
          className="text-slate-300"
          style={{ width: `${sizeRem}rem`, height: `${sizeRem}rem` }}
        />
      ))}

      {showValue && (
        <span className="ml-1 text-sm text-slate-600">
          {clamped.toFixed(1)}/{max}
        </span>
      )}
    </div>
  );
}
