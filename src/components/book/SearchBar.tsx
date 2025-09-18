// src/components/book/SearchBar.tsx
'use client';
export default function SearchBar({
  query,
  onQuery,
}: { query: string; onQuery: (v: string) => void }) {
  return (
    <input
      value={query}
      onChange={(e) => onQuery(e.target.value)}
      placeholder="Buscar por título ou autor..."
      className="w-full md:w-80 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-400"
      aria-label="Buscar livro"
    />
  );
}
