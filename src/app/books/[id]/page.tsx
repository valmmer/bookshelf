// src/app/books/[id]/page.tsx
// ✅ Server Component — SSR, sem libs extras, usando seus tokens/comp.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBook } from '@/server/db/books';

import Badge from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import BookActions from '@/components/book/BookActions';

// -------- Helpers seguros --------
function normalizeCover(u?: string | null) {
  if (!u) return '/covers/placeholder-cover.jpg';
  const s = String(u).trim();
  if (!s) return '/covers/placeholder-cover.jpg';
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/'))
    return s;
  if (s.startsWith('covers/')) return '/' + s;
  return '/' + s.replace(/^\/+/, '');
}
function pct(curr?: number | null, total?: number | null) {
  const t = Math.max(0, Number(total ?? 0));
  const c = Math.max(0, Math.min(Number(curr ?? 0), t || Number(curr ?? 0)));
  if (!t) return 0;
  return Math.max(0, Math.min(100, Math.round((c / t) * 100)));
}
function statusBadge(status?: string | null) {
  const s = String(status ?? '').toUpperCase();
  const base = 'px-2 py-0.5 rounded text-xs font-medium';
  const map: Record<string, string> = {
    QUERO_LER: `${base} bg-gray-200 text-gray-800`,
    LENDO: `${base} bg-blue-200 text-blue-800`,
    LIDO: `${base} bg-green-200 text-green-800`,
    PAUSADO: `${base} bg-yellow-200 text-yellow-800`,
    ABANDONADO: `${base} bg-red-200 text-red-800`,
  };
  const cls = map[s] ?? `${base} bg-muted text-foreground`;
  const label =
    s === 'QUERO_LER'
      ? 'Pendente'
      : s === 'LENDO'
      ? 'Lendo'
      : s === 'LIDO'
      ? 'Concluído'
      : s === 'PAUSADO'
      ? 'Pausado'
      : s === 'ABANDONADO'
      ? 'Abandonado'
      : 'Indefinido';
  return <Badge className={cls}>{label}</Badge>;
}

// ⚙️ metadata segura (sem ícones/manifest para evitar 404)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const book = await getBook(Number(id)).catch(() => null);
  const title = book?.title ? `${book.title}` : 'Livro';
  const description =
    book?.synopsis ?? 'Detalhes do livro, status de leitura e ações rápidas.';
  return {
    title,
    description,
    icons: undefined,
    manifest: undefined,
  };
}

export const dynamic = 'force-dynamic';

export default async function BookDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isFinite(n)) notFound();

  const book = await getBook(n);
  if (!book) notFound();

  const cover = normalizeCover(book.cover);
  const total = book.pages ?? 0;
  const curr = book.currentPage ?? 0;
  const progress = pct(curr, total);

  return (
    <main className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb / topo */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href="/library"
            className="rounded-md border px-2 py-1 text-sm hover:bg-muted"
          >
            ← Biblioteca
          </Link>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">Detalhes</span>
        </div>
      </div>

      {/* Grid principal */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Coluna da capa */}
        <div className="md:col-span-4">
          <div className="overflow-hidden rounded-xl border bg-[rgb(var(--card))] shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt={book.title ? `Capa de ${book.title}` : 'Capa do livro'}
              className="block aspect-[3/4] w-full object-cover"
            />
          </div>

          {/* Ações (reuso, sem <li>) */}
          <div className="mt-4 rounded-xl border bg-[rgb(var(--card))] p-3 shadow-sm">
            <BookActions
              id={book.id}
              fileUrl={book.fileUrl}
              currentStatus={book.status as any}
              currentRating={book.rating ?? 0}
            />
          </div>
        </div>

        {/* Coluna info */}
        <div className="md:col-span-8">
          <div className="rounded-xl border bg-[rgb(var(--card))] p-5 shadow-sm">
            <h1 className="text-2xl font-semibold text-foreground">
              {book.title ?? 'Sem título'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {book.author ?? 'Autor desconhecido'}
            </p>

            {/* Meta */}
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
              {book.genre?.name ? (
                <span className="rounded-md border px-2 py-0.5">
                  {book.genre.name}
                </span>
              ) : null}
              {book.year ? <span>Ano: {book.year}</span> : null}
              {book.pages ? <span>Páginas: {book.pages}</span> : null}
              <span>Status: {statusBadge(book.status as any)}</span>
            </div>

            {/* Progresso */}
            <div className="mt-5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium">Progresso</span>
                <span className="text-xs text-muted-foreground">
                  {progress}%{' '}
                  {total > 0
                    ? `(página ${Math.min(curr + 1, total)} de ${total})`
                    : ''}
                </span>
              </div>
              <Progress value={progress} aria-label="Progresso de leitura" />
            </div>

            {/* Sinopse */}
            {book.synopsis ? (
              <div className="prose prose-sm prose-slate dark:prose-invert mt-6 max-w-none">
                <h2 className="mb-2 text-base font-semibold">Sinopse</h2>
                <p className="whitespace-pre-wrap">{book.synopsis}</p>
              </div>
            ) : null}

            {/* Acesso rápido */}
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={`/books/${book.id}/read`}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
              >
                Abrir leitor
              </Link>
              <Link
                href={`/books/${book.id}/edit`}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
              >
                Editar
              </Link>
              {book.fileUrl ? (
                <a
                  href={book.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  Baixar PDF
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
