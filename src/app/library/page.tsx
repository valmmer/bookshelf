'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion'; // 👈 animações
import { useBooks } from '@/store/books';
import BookCard from '@/components/book/BookCard';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import AddBookFab from '@/components/actions/AddBookFab';
import LibrarySkeleton from '@/components/skeleton/Skeleton';

/* ----------------------------- Filtros fixos ----------------------------- */
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

/* ----------------------------- util: debounce ---------------------------- */
function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function LibraryPage() {
  const { state, updateBook } = useBooks();
  const router = useRouter();
  const searchParams = useSearchParams();

  /* Evita SSR mismatch e dá tempo pro skeleton aparecer */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* ------------------------- Estado de filtros (UI) ------------------------- */
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
  const [onlyWithPdf, setOnlyWithPdf] = useState<boolean>(
    () => (searchParams.get('pdf') ?? '') === '1'
  );

  const qDebounced = useDebounced(query, 250);

  /* ----------- Sincroniza filtros -> URL (sem recarregar a página) ---------- */
  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams();
    if (qDebounced) params.set('q', qDebounced);
    if (status) params.set('status', status);
    if (genre) params.set('genre', genre);
    if (sort && sort !== 'title') params.set('sort', sort);
    if (onlyWithPdf) params.set('pdf', '1');
    const qs = params.toString();
    const nextUrl = qs ? `/library?${qs}` : '/library';
    const current = window.location.pathname + window.location.search;
    if (current !== nextUrl) router.replace(nextUrl);
  }, [mounted, qDebounced, status, genre, sort, onlyWithPdf, router]);

  /* ----------- Gêneros únicos (genre + genres[]) ------------- */
  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const b of state.books) {
      if (b.genre && b.genre.trim()) set.add(b.genre.trim());
      if (Array.isArray(b.genres))
        b.genres.forEach((g) => g && set.add(g.trim()));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [state.books]);

  /* ------------------ Ação rápida: marcar como LENDO ------------------ */
  const handleMarkReading = useCallback(
    (bookId: string) => updateBook({ id: bookId, status: 'LENDO' as const }),
    [updateBook]
  );

  /* -------------------- Filtragem + ordenação memo -------------------- */
  const filtered = useMemo(() => {
    const q = qDebounced.trim().toLowerCase();
    const list = state.books.filter((b) => {
      if (onlyWithPdf && !(b.fileUrl && b.fileUrl.trim())) return false;
      if (status && b.status !== status) return false;
      if (genre) {
        const main = (b.genre ?? '').trim();
        const tags = (b.genres ?? []).map((g) => (g ?? '').trim());
        if (!(main === genre || tags.includes(genre))) return false;
      }
      if (!q) return true;
      const inTitle = (b.title ?? '').toLowerCase().includes(q);
      const inAuthor = (b.author ?? '').toLowerCase().includes(q);
      return inTitle || inAuthor;
    });
    const out = [...list];
    out.sort((a, b) => {
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
    return out;
  }, [state.books, qDebounced, status, genre, sort, onlyWithPdf]);

  /* -------------------------- Estados derivados UX ------------------------- */
  const isLoading = !mounted; // <- durante hidratação mostramos Skeleton
  const noBooks = mounted && state.books.length === 0;
  const noResults = mounted && state.books.length > 0 && filtered.length === 0;

  /* -------------------------- UI com transição ----------------------------- */
  return (
    <AnimatePresence mode="wait">
      {mounted && (
        <motion.main
          key="library-page"
          className="mx-auto max-w-6xl px-6 py-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[{ label: 'Início', href: '/' }, { label: 'Biblioteca' }]}
          />

          {/* Cabeçalho */}
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Biblioteca
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {state.books.length} livro(s){' '}
                {filtered.length !== state.books.length && (
                  <span> • mostrando {filtered.length}</span>
                )}
              </p>
            </div>
            <Link
              href="/books/new"
              className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
            >
              Adicionar livro
            </Link>
          </header>

          {/* Filtros */}
          <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Buscar por título ou autor…"
              aria-label="Buscar por título ou autor"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              aria-label="Filtrar por status"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              aria-label="Filtrar por gênero"
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
              aria-label="Ordenar por"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={onlyWithPdf}
                onChange={(e) => setOnlyWithPdf(e.target.checked)}
                className="h-4 w-4"
              />
              <span>Somente com PDF</span>
            </label>
          </section>

          {/* Conteúdo com fallback de loading suave */}
          {isLoading ? (
            <LibrarySkeleton />
          ) : noBooks ? (
            <div className="rounded-lg border p-8 text-center">
              <p className="text-slate-600">
                Você ainda não adicionou nenhum livro.
              </p>
              <Link
                href="/books/new"
                className="mt-3 inline-block rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Adicionar o primeiro livro
              </Link>
            </div>
          ) : noResults ? (
            <div className="rounded-lg border p-8 text-center">
              <p className="text-slate-600">
                Nenhum resultado para os filtros aplicados.
              </p>
              <button
                onClick={() => {
                  setQuery('');
                  setStatus('');
                  setGenre('');
                  setSort('title');
                  setOnlyWithPdf(false);
                }}
                className="mt-3 inline-flex items-center rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((bk) => (
                <motion.div
                  key={bk.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="group"
                >
                  <BookCard book={bk} />
                  {bk.status === 'QUERO_LER' && (
                    <div className="mt-2">
                      <button
                        onClick={() => handleMarkReading(bk.id)}
                        className="rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white transition hover:bg-sky-500"
                      >
                        Marcar como Lendo
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </section>
          )}

          {/* Botão flutuante (atalho N) */}
          <AddBookFab />
        </motion.main>
      )}
    </AnimatePresence>
  );
}
