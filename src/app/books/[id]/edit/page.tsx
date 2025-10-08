// src/app/books/[id]/edit/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBook } from '@/server/db/books';
import BookForm from '@/components/book/BookForm';
import { updateBookFormAction } from '@/app/actions/bookActions';
import type { ReadingStatus } from '@/server/db/types';

export const dynamic = 'force-dynamic';

/**
 * ✅ params é síncrono (não é Promise).
 * Pode ser async para buscar dados, sem problemas.
 */
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return {
      title: 'Editar livro',
      description: 'Editar detalhes do livro',
    };
  }

  const book = await getBook(idNum).catch(() => null);
  const title = book?.title ? `Editar: ${book.title}` : 'Editar livro';

  return {
    title,
    description: 'Editar detalhes do livro',
  };
}

/**
 * ✅ Também aqui: params é síncrono.
 */
export default async function EditBookPage({
  params,
}: {
  params: { id: string };
}) {
  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) notFound();

  const book = await getBook(idNum);
  if (!book) notFound();

  return (
    <main className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="mb-4 text-2xl font-semibold text-foreground">
        Editar livro
      </h1>

      <BookForm
        mode="edit"
        action={updateBookFormAction.bind(null, book.id)}
        /**
         * ✅ Evitamos `any` e normalizamos tipos:
         *  - strings opcionais: string vazia quando ausentes
         *  - números opcionais: `undefined` quando ausentes
         */
        defaults={{
          title: book.title ?? '',
          author: book.author ?? '',
          year: book.year ?? undefined,
          pages: typeof book.pages === 'number' ? book.pages : undefined,
          currentPage:
            typeof book.currentPage === 'number' ? book.currentPage : 0,
          status: book.status as ReadingStatus,
          cover: book.cover ?? '',
          fileUrl: book.fileUrl ?? '',
          synopsis: book.synopsis ?? '',
          rating: book.rating ?? undefined,
          genre: book.genre?.name ?? '',
          isbn: book.isbn ?? '',
          notes: book.notes ?? '',
        }}
      />
    </main>
  );
}
