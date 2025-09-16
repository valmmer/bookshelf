// src/components/book/BookCard.tsx
'use client';

import { useState, useMemo } from 'react';
import type { Book } from '@/types/book';
import { useBooks } from '@/store/books';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastProvider';
// 🔧 se o arquivo é "Badge.tsx", importe com B maiúsculo:
import Badge from '@/components/ui/badge';
import Link from 'next/link';

function statusVariant(status?: Book['status']) {
  switch (status) {
    case 'LENDO':
      return 'info';
    case 'LIDO':
      return 'success';
    case 'PAUSADO':
      return 'warning';
    case 'ABANDONADO':
      return 'danger';
    case 'QUERO_LER':
    default:
      return 'muted';
  }
}

export default function BookCard({ book }: { book: Book }) {
  const { deleteBook } = useBooks();
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const pct = useMemo(() => {
    const pages = typeof book.pages === 'number' ? book.pages : 0;
    const current = typeof book.currentPage === 'number' ? book.currentPage : 0;
    if (pages <= 0) return null;
    return Math.min(100, Math.round((Math.min(current, pages) / pages) * 100));
  }, [book.pages, book.currentPage]);

  const handleDelete = () => setConfirmOpen(true);

  const confirmDelete = () => {
    deleteBook(book.id);
    setConfirmOpen(false);
    showToast({
      title: 'Livro excluído',
      message: `“${book.title}” foi removido com sucesso.`,
      variant: 'success',
    });
  };

  return (
    <article className="rounded-xl border p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Capa */}
        {book.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover}
            alt={book.title}
            className="h-24 w-16 rounded-md object-cover"
          />
        ) : (
          <div className="h-24 w-16 rounded-md bg-slate-100" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-semibold">{book.title}</h3>
              <p className="truncate text-sm text-slate-600">{book.author}</p>

              {/* ⭐ rating (se houver). O typeof + > 0 faz o TS "narrow" para number */}
              {typeof book.rating === 'number' && book.rating > 0 && (
                <p
                  className="mt-1 text-xs text-amber-600"
                  aria-label={`Avaliação: ${book.rating} de 5`}
                >
                  {'★'.repeat(book.rating)}{' '}
                  <span className="text-slate-400">
                    {'★'.repeat(5 - book.rating)}
                  </span>
                </p>
              )}

              {/* meta: ano • páginas */}
              <p className="mt-1 text-xs text-slate-500">
                {book.year ? `${book.year} • ` : ''}
                {book.pages ? `${book.pages} págs.` : ''}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              {book.genre && <Badge variant="muted">{book.genre}</Badge>}
              <Badge variant={statusVariant(book.status)}>
                {book.status ?? '—'}
              </Badge>
            </div>
          </div>

          {/* Barra de progresso (quando houver dados) */}
          {typeof pct === 'number' && (
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900 transition-[width]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-600">{pct}% lido</p>
            </div>
          )}

          {/* Ações */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/books/${book.id}`}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Ver
            </Link>
            {book.fileUrl && (
              <Link
                href={`/books/${book.id}/read`}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Ler
              </Link>
            )}

            <Link
              href={`/books/${book.id}/edit`}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Editar
            </Link>
            <button
              onClick={handleDelete}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir livro"
        description={`Tem certeza que deseja excluir “${book.title}”? Essa ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </article>
  );
}
