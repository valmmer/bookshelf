'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBooks } from '@/store/books';
import BookCard from '@/components/book/BookCard';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'QUERO_LER', label: 'Quero ler' },
  { value: 'LENDO', label: 'Lendo' },
  { value: 'LIDO', label: 'Lido' },
  { value: 'PAUSADO', label: 'Pausado' },
  { value: 'ABANDONADO', label: 'Abandonado' },
] as const;

const SORT_OPTIONS = [
  { value: 'title', label: 'Título (A→Z)' },
  { value: 'year_desc', label: 'Ano (mais recente)' },
  { value: 'rating_desc', label: 'Avaliação (maior primeiro)' },
  { value: 'pages_desc', label: 'Páginas (maior primeiro)' },
] as const;

export default function LibraryPage() {
  const { state } = useBooks();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [query, setQuery] = useState<string>(() => searchParams.get('q') ?? '');
  const [status, setStatus] = useState<string>(
    () => searchParams.get('status') ?? ''
  );
  const [genre, setGenre] = useState<string>(
    () => searchParams.get('genre') ?? ''
  );
  const [sort, setSort] = useState<string>(
    () => searchParams.get('sort') ?? 'title'
  );

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const b of state.books) {
      if (b.genre && b.genre.trim()) set.add(b.genre.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [state.books]);

  useEffect(() => {
    const qs = new URLSearchParams();
    const qTrim = query.trim();
    if (qTrim) qs.set('q', qTrim);
    if (status) qs.set('status', status);
    if (genre) qs.set('genre', genre);
    if (sort && sort !== 'title') qs.set('sort', sort);
    const queryString = qs.toString();
    const path = queryString ? `/library?${queryString}` : '/library';
    router.replace(path, { scroll: false });
  }, [query, status, genre, sort, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const list = state.books.filter((b) => {
      if (status && b.status !== status) return false;
      if (genre && (b.genre ?? '').trim() !== genre) return false;
      if (!q) return true;
      const inTitle = b.title.toLowerCase().includes(q);
      const inAuthor = b.author.toLowerCase().includes(q);
      return inTitle || inAuthor;
    });

    list.sort((a, b) => {
      switch (sort) {
        case 'year_desc': {
          const ay = typeof a.year === 'number' ? a.year : -Infinity;
          const by = typeof b.year === 'number' ? b.year : -Infinity;
          if (by !== ay) return by - ay;
          return a.title.localeCompare(b.title);
        }
        case 'rating_desc': {
          const ar = typeof a.rating === 'number' ? a.rating : -Infinity;
          const br = typeof b.rating === 'number' ? b.rating : -Infinity;
          if (br !== ar) return br - ar;
          return a.title.localeCompare(b.title);
        }
        case 'pages_desc': {
          const ap = typeof a.pages === 'number' ? a.pages : -Infinity;
          const bp = typeof b.pages === 'number' ? b.pages : -Infinity;
          if (bp !== ap) return bp - ap;
          return a.title.localeCompare(b.title);
        }
        case 'title':
        default:
          return a.title.localeCompare(b.title);
      }
    });

    list.sort((a, b) => {
      if (a.status === 'LENDO' && b.status !== 'LENDO') return -1;
      if (b.status === 'LENDO' && a.status !== 'LENDO') return 1;
      return 0;
    });

    return list;
  }, [state.books, query, status, genre, sort]);

  const hasActiveFilters =
    query !== '' || status !== '' || genre !== '' || sort !== 'title';

  function clearFilters() {
    setQuery('');
    setStatus('');
    setGenre('');
    setSort('title');
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[{ label: 'Início', href: '/' }, { label: 'Biblioteca' }]}
      />

      {/* Cabeçalho */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Biblioteca</h1>
        <Link
          href="/books/new"
          className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
        >
          Adicionar livro
        </Link>
      </header>

      {/* Filtros + Ordenação */}
      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Buscar por título ou autor…"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Status: {opt.label}
            </option>
          ))}
        </select>

        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="">Gênero: Todos</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Ordenar por: {opt.label}
            </option>
          ))}
        </select>
      </section>

      {hasActiveFilters && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>Filtros:</span>
          {query && (
            <span className="rounded-full border px-2 py-0.5">
              Busca: “{query}”
            </span>
          )}
          {status && (
            <span className="rounded-full border px-2 py-0.5">
              Status: {status}
            </span>
          )}
          {genre && (
            <span className="rounded-full border px-2 py-0.5">
              Gênero: {genre}
            </span>
          )}
          {sort !== 'title' && (
            <span className="rounded-full border px-2 py-0.5">
              Ordenação: {SORT_OPTIONS.find((s) => s.value === sort)?.label}
            </span>
          )}
          <button
            onClick={clearFilters}
            className="ml-2 rounded-lg border px-2 py-1 hover:bg-slate-50"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {mounted && filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-6 text-slate-600">
          <p className="text-sm">
            Nenhum livro encontrado com os filtros atuais.
          </p>
          <button
            onClick={clearFilters}
            className="mt-3 inline-flex rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((bk) => (
            <BookCard key={bk.id} book={bk} />
          ))}
        </section>
      )}
    </main>
  );
}
