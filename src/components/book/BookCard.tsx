// src/components/book/BookCard.tsx
'use client';

import type { ReadingStatus } from '@/server/db/types';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import Badge from '@/components/ui/badge';
import BookActions from './BookActions';

function cn(...a: Array<string | undefined | null | false>) {
  return a.filter(Boolean).join(' ');
}

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
  rating?: number | null; // 👈 vem do DB

  className?: string;
  as?: 'li' | 'div' | 'article';
};

function statusBadge(status?: ReadingStatus | null) {
  if (!status)
    return <Badge className="bg-muted text-foreground">Indefinido</Badge>;

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
  rating, // 👈 receber
  className,
  as = 'li',
}: Props) {
  const totalPages = pages ?? 0;
  const curr = currentPage ?? 0;
  const progress =
    totalPages > 0 ? Math.min(100, Math.round((curr / totalPages) * 100)) : 0;

  const Root: any = as;
  const rootProps = as === 'li' ? {} : { role: 'listitem' };

  return (
    <Root
      {...rootProps}
      className={cn(
        // 👇 limita o tamanho do card (não importa o quão largo esteja o grid)
        'group rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md max-w-[240px] sm:max-w-[260px] mx-auto',
        className
      )}
    >
      {/* Capa — usamos um contêiner de tamanho fixo responsivo para evitar blur/estouro */}
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
      <h3 className="mt-3 line-clamp-2 text-sm font-semibold">
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

      {/* Status */}
      <div className="mt-2">{statusBadge(status)}</div>

      {/* Progresso */}
      <div className="mt-3">
        <Progress value={progress} aria-label="Progresso de leitura" />
        <div className="mt-1 text-right text-xs text-muted-foreground">
          {progress}%
        </div>
      </div>

      {/* Ações — agora mandamos a nota vinda do DB */}
      <div className="mt-3 flex justify-end">
        <BookActions
          id={id}
          fileUrl={fileUrl}
          currentStatus={status ?? 'QUERO_LER'}
          currentRating={typeof rating === 'number' ? rating : null} // 👈 aqui
        />
      </div>
    </Root>
  );
}
