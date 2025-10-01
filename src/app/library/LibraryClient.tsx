// src/app/library/LibraryClient.tsx
'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import BookCard from '@/components/book/BookCard';
import type { ReadingStatus } from '@/server/db/types';

type Book = {
  id: number;
  title: string;
  author?: string | null;
  year?: number | null;
  pages?: number | null;
  currentPage?: number | null;
  status?: ReadingStatus | null;
  genre?: { name: string } | null;
  cover?: string | null;
  fileUrl?: string | null;
  rating?: number | null;
};

type Props = {
  initialBooks: Book[];
  total: number;
  page: number;
  totalPages: number;
  query: string;
  statusFilter?: ReadingStatus;
};

const STATUS_OPTIONS: { key?: ReadingStatus; label: string }[] = [
  { label: 'Todos' },
  { key: 'QUERO_LER', label: 'Pendente' },
  { key: 'LENDO', label: 'Lendo' },
  { key: 'LIDO', label: 'Lido' },
  { key: 'PAUSADO', label: 'Pausado' },
  { key: 'ABANDONADO', label: 'Abandonado' },
];

export default function LibraryClient({
  initialBooks,
  total,
  page,
  totalPages,
  query,
  statusFilter,
}: Props) {
  const selectedKey = statusFilter;

  const countLabel = useMemo(() => {
    const base = `${total} ${total === 1 ? 'livro' : 'livros'}`;
    if (query) return `${base} para “${query}”`;
    return base;
  }, [total, query]);

  // helper para compor URL com q e status
  const urlWith = (params: {
    page?: number;
    q?: string;
    status?: ReadingStatus | '';
  }) => {
    const p = new URLSearchParams();
    if (params.q !== undefined) {
      if (params.q) p.set('q', params.q);
    } else if (query) {
      p.set('q', query);
    }
    if (params.status !== undefined) {
      if (params.status) p.set('status', params.status);
    } else if (selectedKey) {
      p.set('status', selectedKey);
    }
    const targetPage = params.page ?? page;
    if (targetPage > 1) p.set('page', String(targetPage));
    const qs = p.toString();
    return `/library${qs ? `?${qs}` : ''}`;
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Topo: título + adicionar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Minha Biblioteca</h1>
        <Link
          href="/books/new"
          className="inline-flex items-center rounded-lg border px-3 py-2 text-sm shadow-sm transition hover:-translate-y-0.5 hover:bg-muted"
        >
          + Adicionar livro
        </Link>
      </div>

      {/* Busca */}
      <form action="/library" method="GET" className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Buscar por título, autor ou ISBN…"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        {/* Preserve status atual na submissão da busca */}
        {selectedKey ? (
          <input type="hidden" name="status" value={selectedKey} />
        ) : null}
        <button
          type="submit"
          className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          Buscar
        </button>
      </form>

      {/* Filtros de status (badges) */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map(({ key, label }) => {
          const active = key === selectedKey || (!key && !selectedKey);
          return (
            <Link
              key={label}
              href={urlWith({ page: 1, status: (key ?? '') as any })}
              className={[
                'rounded-full border px-3 py-1 text-xs transition',
                active ? 'bg-foreground text-background' : 'hover:bg-muted',
              ].join(' ')}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Contagem */}
      <p className="mb-3 text-sm text-muted-foreground">{countLabel}</p>

      {/* Lista / vazio */}
      {initialBooks.length === 0 ? (
        <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
          {query || selectedKey ? (
            <>
              Nenhum resultado.{' '}
              <Link className="underline" href="/library">
                Limpar filtros
              </Link>
            </>
          ) : (
            <>
              Nenhum livro cadastrado.{' '}
              <Link className="underline" href="/books/new">
                Adicione o primeiro
              </Link>
              .
            </>
          )}
        </div>
      ) : (
        <>
          {/* Grid de cards */}
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {initialBooks.map((b) => (
              <BookCard key={b.id} {...b} />
            ))}
          </ul>

          {/* Paginação */}
          {totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-2 text-sm">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={urlWith({ page: p })}
                  className={[
                    'rounded-md border px-3 py-1 transition',
                    p === page
                      ? 'bg-foreground text-background'
                      : 'hover:bg-muted',
                  ].join(' ')}
                >
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </>
      )}
    </main>
  );
}
