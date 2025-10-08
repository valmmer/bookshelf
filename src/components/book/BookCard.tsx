// src/components/book/BookCard.tsx
'use client';

import Link from 'next/link';
import type { ReadingStatus } from '@/server/db/types';
import { Progress } from '@/components/ui/progress';
import Badge from '@/components/ui/badge';

function cn(...a: Array<string | undefined | null | false>) {
  return a.filter(Boolean).join(' ');
}

/* ----------------------------- helpers ------------------------------ */
function statusBadge(status?: ReadingStatus | null) {
  if (!status) {
    return <Badge className="bg-muted text-foreground">Indefinido</Badge>;
  }
  const map: Record<ReadingStatus, { label: string; className: string }> = {
    QUERO_LER: { label: 'Pendente', className: 'bg-gray-200 text-gray-800' },
    LENDO: { label: 'Lendo', className: 'bg-blue-200 text-blue-800' },
    LIDO: { label: 'Lido', className: 'bg-green-200 text-green-800' },
    PAUSADO: { label: 'Pausado', className: 'bg-yellow-200 text-yellow-800' },
    ABANDONADO: { label: 'Abandonado', className: 'bg-red-200 text-red-800' },
  };
  const { label, className } = map[status];
  return <Badge className={className}>{label}</Badge>;
}

function statusLabel(status?: ReadingStatus | null) {
  if (!status) return 'Indefinido';
  switch (status) {
    case 'QUERO_LER':
      return 'Quero ler';
    case 'LENDO':
      return 'Lendo';
    case 'LIDO':
      return 'Lido';
    case 'PAUSADO':
      return 'Pausado';
    case 'ABANDONADO':
      return 'Abandonado';
  }
}

/** Estrelinhas simples (0..5) */
function Stars({ value = 0 }: { value?: number | null }) {
  const v = Math.max(0, Math.min(5, Math.round(value ?? 0)));
  return (
    <div
      className="flex flex-wrap items-center gap-1"
      aria-label={`Avaliação: ${v} de 5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={cn(
            'h-4 w-4',
            i < v
              ? 'fill-yellow-400 stroke-yellow-500'
              : 'fill-transparent stroke-yellow-500'
          )}
        >
          <path
            strokeWidth="1.5"
            d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          />
        </svg>
      ))}
    </div>
  );
}

/* ----------------------------- props ------------------------------ */
type Props = {
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

  className?: string;
  as?: 'li' | 'div' | 'article';
};

/* --------------------------- componente ---------------------------- */
export default function BookCard({
  id,
  title,
  author,
  year,
  pages,
  currentPage,
  status,
  genre,
  cover,
  fileUrl,
  rating,
  className,
  as = 'li',
}: Props) {
  const totalPages = pages ?? 0;
  const curr = currentPage ?? 0;
  const progress =
    totalPages > 0 ? Math.min(100, Math.round((curr / totalPages) * 100)) : 0;

  const Root: any = as;
  const rootProps = as === 'li' ? {} : { role: 'listitem' };

  const canOpen = !!(fileUrl && fileUrl.trim().length > 0);

  return (
    <Root
      {...rootProps}
      className={cn(
        'group mx-auto max-w-[240px] sm:max-w-[260px] rounded-2xl border bg-[rgb(var(--card))] p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md',
        className
      )}
    >
      {/* Capa */}
      <Link href={`/books/${id}`} className="block">
        <div className="mx-auto h-56 w-40 sm:h-64 sm:w-48 lg:h-72 lg:w-52 overflow-hidden rounded-lg border bg-muted/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={title ? `Capa de ${title}` : 'Capa'}
            src={cover || '/covers/placeholder-cover.jpg'}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      </Link>

      {/* Título + autor */}
      <h3 className="mt-3 break-anywhere text-sm font-semibold">
        {title ?? 'Sem título'}
      </h3>
      <p className="text-xs text-muted-foreground">
        {author ?? 'Autor desconhecido'}
      </p>

      {/* Metadados */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {year ? <span>Ano: {year}</span> : null}
        {pages ? <span>Páginas: {pages}</span> : null}
        {genre?.name ? <span>· {genre.name}</span> : null}
      </div>

      {/* Status (badge) */}
      <div className="mt-2">{statusBadge(status)}</div>

      {/* Progresso */}
      <div className="mt-3">
        <Progress value={progress} aria-label="Progresso de leitura" />
        <div className="mt-1 text-right text-xs text-muted-foreground">
          {progress}%
        </div>
      </div>

      {/* Ações — grid responsivo (NÃO “escapa” no mobile) */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {/* Abrir */}
        <Link
          href={canOpen ? (fileUrl as string) : '#'}
          target={canOpen ? '_blank' : undefined}
          rel={canOpen ? 'noreferrer' : undefined}
          aria-disabled={!canOpen}
          className={cn(
            'inline-flex w-full min-w-0 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm hover:bg-muted',
            !canOpen && 'pointer-events-none opacity-50'
          )}
        >
          <span className="truncate">Abrir</span>
        </Link>

        {/* Editar */}
        <Link
          href={`/books/${id}/edit`}
          className="inline-flex w-full min-w-0 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm hover:bg-muted"
        >
          <span className="truncate">Editar</span>
        </Link>

        {/* Ler — no mobile ocupa as duas colunas para não “espirrar” */}
        <Link
          href={`/books/${id}/read`}
          className="col-span-2 inline-flex w-full min-w-0 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm hover:bg-muted sm:col-span-1"
        >
          <span className="truncate">Ler</span>
        </Link>

        {/* Excluir */}
        <Link
          href={`/books/${id}/delete`}
          className="inline-flex w-full min-w-0 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm hover:bg-muted"
        >
          <span className="truncate">Excluir</span>
        </Link>
      </div>

      {/* Status + Avaliação (empilhado no mobile, lado a lado no desktop) */}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="truncate">Status: {statusLabel(status)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="shrink-0">Avaliação</span>
          <Stars value={rating ?? 0} />
        </div>
      </div>
    </Root>
  );
}
