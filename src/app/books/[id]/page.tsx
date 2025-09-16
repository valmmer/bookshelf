'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useBooks } from '@/store/books';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastProvider';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import type { Book } from '@/types/book';

export default function BookDetailsPage() {
  const params = useParams<{ id: string | string[] }>();
  const id = useMemo(
    () => (Array.isArray(params.id) ? params.id[0] : params.id),
    [params.id]
  );

  const router = useRouter();
  const { state, deleteBook } = useBooks();
  const { showToast } = useToast();

  const maybeBook: Book | undefined = state.books.find((b) => b.id === id);

  if (!maybeBook) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Início', href: '/' },
            { label: 'Biblioteca', href: '/library' },
            { label: 'Livro não encontrado' },
          ]}
        />
        <p className="text-slate-600">Livro não encontrado.</p>
        <Link href="/library" className="underline">
          Voltar
        </Link>
      </main>
    );
  }

  const book: Book = maybeBook;

  const [confirmOpen, setConfirmOpen] = useState(false);

  const pct =
    typeof book.pages === 'number' &&
    book.pages > 0 &&
    typeof book.currentPage === 'number'
      ? Math.min(100, Math.round((book.currentPage / book.pages) * 100))
      : null;

  function handleDeleteClick() {
    setConfirmOpen(true);
  }

  function confirmDelete() {
    deleteBook(book.id);
    setConfirmOpen(false);
    showToast({
      title: 'Livro excluído',
      message: `“${book.title}” foi removido.`,
      variant: 'success',
    });
    router.push('/library');
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Breadcrumbs (título como último item, sem link) */}
      <Breadcrumbs
        items={[
          { label: 'Início', href: '/' },
          { label: 'Biblioteca', href: '/library' },
          { label: book.title },
        ]}
      />

      <div className="mb-4 flex gap-2">
        {book.fileUrl && (
          <Link
            href={`/books/${book.id}/read`}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Ler
          </Link>
        )}
        <Link
          href="/library"
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Voltar
        </Link>
        <Link
          href={`/books/${book.id}/edit`}
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Editar
        </Link>
        <button
          onClick={handleDeleteClick}
          className="inline-flex items-center rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
        >
          Excluir
        </button>
      </div>

      {/* Capa + informações */}
      <div className="flex items-start gap-4">
        {book.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover}
            alt={book.title}
            className="h-40 w-28 flex-shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="h-40 w-28 flex-shrink-0 rounded-md bg-slate-100" />
        )}

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold">{book.title}</h1>
          <p className="text-slate-600">
            {book.author}{' '}
            {typeof book.year === 'number' ? `• ${book.year}` : ''}
          </p>

          {/* Metadados */}
          <div className="mt-2 space-y-1 text-sm">
            {book.genre && <p>Gênero: {book.genre}</p>}
            {book.status && <p>Status: {book.status}</p>}

            {/* Avaliação em estrelas (se houver) */}
            {typeof book.rating === 'number' && book.rating > 0 && (
              <p>
                Avaliação:{' '}
                <span
                  className="text-amber-600"
                  aria-label={`Avaliação: ${book.rating} de 5`}
                >
                  {'★'.repeat(book.rating)}
                </span>
                <span className="text-slate-300">
                  {'★'.repeat(5 - book.rating)}
                </span>
              </p>
            )}

            {typeof pct === 'number' && <p>Progresso: {pct}%</p>}
            {typeof book.pages === 'number' &&
              typeof book.currentPage === 'number' && (
                <p>
                  Página atual: {book.currentPage} / {book.pages}
                </p>
              )}
            {book.isbn && <p>ISBN: {book.isbn}</p>}
          </div>
        </div>
      </div>

      {book.synopsis && (
        <p className="mt-6 whitespace-pre-wrap">{book.synopsis}</p>
      )}
      {book.notes && (
        <>
          <h2 className="mt-8 text-lg font-medium">Notas</h2>
          <p className="mt-2 whitespace-pre-wrap">{book.notes}</p>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir livro"
        description={`Confirma excluir “${book.title}”? Essa ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </main>
  );
}
