// src/components/book/Filters.tsx
'use client';
import { GENRES } from '@/types/book';

export default function Filters({
  genre,
  onGenre,
}: { genre: string; onGenre: (v: string) => void }) {
  return (
    <select
      value={genre}
      onChange={(e) => onGenre(e.target.value)}
      className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-400"
      aria-label="Filtrar por gênero"
    >
      <option value="">Todos os gêneros</option>
      {GENRES.map((g) => (
        <option key={g} value={g}>{g}</option>
      ))}
    </select>
  );
}
