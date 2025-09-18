'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import ReadOnlyStars from '@/components/book/ReadOnlyStars';
import { Progress } from '@/components/ui/progress';

export type Book = {
  id: string;
  title: string;
  author?: string;
  cover?: string | null;
  genres?: string[];
  rating?: number;
  status?: string;
  pages?: number;
  currentPage?: number;
};

type Props = { book: Book };

/**
 * Normaliza a URL da capa:
 * - "http(s)://localhost:PORT/..."  -> "/..."
 * - "http(s)://127.0.0.1:PORT/..."  -> "/..."
 * - já relativa ("/covers/x.jpg")    -> mantém
 * - vazia/erro                        -> "/file.svg"
 */
function normalizeCoverUrl(u?: string | null) {
  if (!u) return '/file.svg';
  try {
    const noLocalhost = u
      .replace(/^https?:\/\/localhost:\d+/i, '')
      .replace(/^https?:\/\/127\.0\.0\.1:\d+/i, '');
    const withSlash = noLocalhost.startsWith('/')
      ? noLocalhost
      : `/${noLocalhost}`;
    return withSlash || '/file.svg';
  } catch {
    return '/file.svg';
  }
}

export default function BookCard({ book }: Props) {
  // calcula progresso (se houver páginas)
  const pct =
    typeof book.pages === 'number' &&
    book.pages > 0 &&
    typeof book.currentPage === 'number'
      ? Math.min(100, Math.round((book.currentPage / book.pages) * 100))
      : null;

  // src reativa (normalizada) + fallback em caso de erro
  const [imgSrc, setImgSrc] = useState<string>(normalizeCoverUrl(book.cover));

  // se a prop "cover" mudar, re-normaliza e reseta o fallback
  useEffect(() => {
    setImgSrc(normalizeCoverUrl(book.cover));
  }, [book.cover]);

  return (
    <Link
      href={`/books/${book.id}`}
      className="group rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Abrir detalhes de ${book.title}`}
    >
      <Card className="overflow-hidden rounded-2xl transition group-hover:shadow-md">
        <CardHeader className="p-0">
          {/* Área fixa para evitar layout shift */}
          <div className="relative mx-auto mt-4 h-[192px] w-[128px] sm:h-[240px] sm:w-[160px]">
            <Image
              src={imgSrc}
              alt={`Capa de ${book.title}`}
              fill
              sizes="(max-width: 640px) 128px, 160px"
              className="rounded-xl bg-muted object-cover"
              onError={() => setImgSrc('/file.svg')}
              priority={false}
            />
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <h3
            className="line-clamp-2 text-base font-semibold sm:text-lg"
            title={book.title}
          >
            {book.title}
          </h3>

          {book.author && (
            <p className="line-clamp-1 text-sm text-muted-foreground">
              {book.author}
            </p>
          )}

          {/* Estrelas (pequenas) */}
          {typeof book.rating === 'number' && book.rating > 0 && (
            <div className="mt-1">
              <ReadOnlyStars
                value={book.rating}
                showValue={false}
                sizeRem={0.875}
              />
            </div>
          )}

          {/* Status */}
          {book.status && (
            <div className="mt-2">
              <Badge variant="muted" className="rounded-full text-xs">
                {book.status}
              </Badge>
            </div>
          )}

          {/* Progresso */}
          {typeof pct === 'number' && (
            <div className="mt-2">
              <Progress value={pct} className="h-1.5" />
            </div>
          )}

          {/* Gêneros (até 2 para não poluir) */}
          {book.genres && book.genres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {book.genres.slice(0, 2).map((g) => (
                <Badge key={g} variant="muted" className="rounded-full text-xs">
                  {g}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
