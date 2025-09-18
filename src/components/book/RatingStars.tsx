// src/components/book/RatingStars.tsx
'use client';

import { Star } from 'lucide-react';

type Props = {
  value: number;
  onChange?: (val: number) => void;
};

export default function RatingStars({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Avaliação em estrelas"
      className="flex gap-1"
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const starVal = i + 1;
        const checked = value === starVal;
        return (
          <label
            key={i}
            aria-label={`${starVal} estrela${starVal > 1 ? 's' : ''}`}
            className="cursor-pointer"
          >
            <input
              type="radio"
              name="rating"
              value={starVal}
              checked={checked}
              onChange={() => onChange?.(starVal)}
              className="sr-only"
            />
            <Star
              className={`w-5 h-5 ${
                checked
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          </label>
        );
      })}
    </div>
  );
}
