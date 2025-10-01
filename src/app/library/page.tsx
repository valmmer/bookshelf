// src/app/library/page.tsx
// ✅ Server Component — SSR, tokens do seu globals.css e sem libs extras

import Link from 'next/link';
import { listBooks } from '@/server/db/books';
import BookCard from '@/components/book/BookCard';

/** Helper: pega o primeiro valor de um possível array de searchParams */
type RawSearchParams = Record<string, string | string[] | undefined>;
function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

/** 🔒 força render dinâmico (evita cache estático) */
export const dynamic = 'force-dynamic';

type Props = {
  searchParams?: Promise<RawSearchParams> | RawSearchParams;
};

export default async function LibraryPage({ searchParams }: Props) {
  // Next 15 às vezes entrega searchParams como Promise → resolvemos seguro
  const sp: RawSearchParams =
    typeof (searchParams as any)?.then === 'function'
      ? await (searchParams as Promise<RawSearchParams>)
      : (searchParams as RawSearchParams) ?? {};

  // 🔎 filtros/ordenação vindos da query
  const q = (first(sp.q) ?? '').trim();
  const status = first(sp.status) ?? '';
  const orderBy =
    (first(sp.orderBy) as 'createdAt' | 'title' | 'author' | 'rating') ??
    'createdAt';
  const orderDir = (first(sp.orderDir) ?? 'desc') as 'asc' | 'desc';
  const page = Number(first(sp.page) ?? '1') || 1;
  const pageSize = 24;

  // 📚 busca no servidor (Prisma)
  const { items, total } = await listBooks({
    page,
    pageSize,
    orderBy,
    orderDir,
    status: (status || undefined) as any,
  });

  // 🔍 filtro local por q (até ter busca no listBooks)
  const norm = (s: unknown) =>
    (typeof s === 'string' ? s : '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();

  const qn = norm(q);
  const itemsFiltered = q
    ? items.filter((b: any) => {
        const t = norm(b?.title);
        const a = norm(b?.author);
        return t.includes(qn) || a.includes(qn);
      })
    : items;

  const hasItems = itemsFiltered.length > 0;

  // 📄 paginação (server) — mostrada só quando não há q
  const showPagination = !q;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="py-2 mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
      {/* ==================== HEADER ==================== */}
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Biblioteca</h1>
          <p className="text-sm text-muted-foreground">
            {q
              ? `${itemsFiltered.length} resultado${
                  itemsFiltered.length === 1 ? '' : 's'
                }`
              : `${total} ${total === 1 ? 'livro' : 'livros'} no acervo`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/books/new"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2"
          >
            Adicionar livro
          </Link>
        </div>
      </header>

      {/* ==================== FILTROS (compactos) ==================== */}
      <div className="sticky top-[calc(56px+8px)] z-20 mb-4 rounded-lg border bg-[rgb(var(--card))]/60 p-2 supports-[backdrop-filter]:backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* 🔎 Busca (GET/SSR) */}
          <form action="/library" method="get" className="flex-1">
            {status ? (
              <input type="hidden" name="status" value={status} />
            ) : null}
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por título ou autor…"
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            />
          </form>

          {/* Filtros */}
          <form
            className="flex items-center gap-2"
            action="/library"
            method="get"
          >
            {q ? <input type="hidden" name="q" value={q} /> : null}

            <select
              name="status"
              defaultValue={status}
              className="rounded-md border bg-transparent px-2 py-1 text-sm"
            >
              <option value="">Todos</option>
              <option value="QUERO_LER">Quero ler</option>
              <option value="LENDO">Lendo</option>
              <option value="LIDO">Lido</option>
              <option value="PAUSADO">Pausado</option>
              <option value="ABANDONADO">Abandonado</option>
            </select>

            <select
              name="orderBy"
              defaultValue={orderBy}
              className="rounded-md border bg-transparent px-2 py-1 text-sm"
            >
              <option value="createdAt">Recentes</option>
              <option value="title">Título</option>
              <option value="author">Autor</option>
              <option value="rating">Avaliação</option>
            </select>

            <select
              name="orderDir"
              defaultValue={orderDir}
              className="rounded-md border bg-transparent px-2 py-1 text-sm"
            >
              <option value="desc">↓</option>
              <option value="asc">↑</option>
            </select>

            <button
              type="submit"
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Aplicar
            </button>
          </form>
        </div>
      </div>

      {/* ==================== GRID ==================== */}
      {hasItems ? (
        <ul
          className="
            grid
            justify-start            /* tracks empacotados à ESQUERDA */
            justify-items-start      /* conteúdo de cada célula à esquerda */
            items-start
            gap-[36px]               /* ~1cm de espaço entre cards (36~38px) */
            [grid-template-columns:repeat(auto-fill,minmax(260px,260px))]
            /* ↑ colunas de largura fixa (260px). Sobra de espaço vai para a direita,
               mantendo a grade alinhada ao lado esquerdo, mesmo em telas largas. */
          "
        >
          {itemsFiltered.map((b: any) => (
            <BookCard
              key={b.id}
              id={b.id}
              title={b.title}
              author={b.author}
              year={b.year}
              pages={b.pages}
              currentPage={b.currentPage}
              status={b.status}
              genre={b.genre}
              cover={b.cover}
              fileUrl={b.fileUrl}
              rating={b.rating}
              /* BookCard por padrão já renderiza <li> */
            />
          ))}
        </ul>
      ) : (
        // ==================== EMPTY STATE ====================
        <div className="rounded-2xl border p-10 text-center">
          <p className="text-muted-foreground">
            Nenhum livro encontrado com os filtros atuais.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Link
              href="/library"
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Limpar filtros
            </Link>
            <Link
              href="/books/new"
              className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
            >
              Adicionar livro
            </Link>
          </div>
        </div>
      )}

      {/* ==================== PAGINAÇÃO ==================== */}
      {showPagination && totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const active = p === page;
            const params = new URLSearchParams({
              ...(q ? { q } : {}),
              ...(status ? { status } : {}),
              orderBy,
              orderDir,
              page: String(p),
            }).toString();

            return (
              <Link
                key={p}
                href={`/library?${params}`}
                className={[
                  'rounded-md border px-3 py-1.5 text-sm',
                  active ? 'bg-muted' : 'hover:bg-muted',
                ].join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                {p}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
