// src/app/books/[id]/edit/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBook } from '@/server/db/books';
import BookForm from '@/components/book/BookForm';
import { updateBookFormAction } from '@/app/actions/bookActions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const book = await getBook(Number(id)).catch(() => null);
  const title = book?.title ? `Editar: ${book.title}` : 'Editar livro';
  return {
    title,
    description: 'Editar detalhes do livro',
    icons: undefined,
    manifest: undefined,
  };
}

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isFinite(n)) notFound();

  const book = await getBook(n);
  if (!book) notFound();

  return (
    <main className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="mb-4 text-2xl font-semibold text-foreground">
        Editar livro
      </h1>
      <BookForm
        mode="edit"
        action={updateBookFormAction.bind(null, book.id)}
        defaults={{
          title: book.title,
          author: book.author,
          year: book.year,
          pages: book.pages,
          currentPage: book.currentPage,
          status: book.status as any,
          cover: book.cover,
          fileUrl: book.fileUrl,
          synopsis: book.synopsis,
          rating: book.rating,
          genre: (book as any)?.genre?.name ?? null,
          isbn: (book as any)?.isbn ?? null,
          notes: (book as any)?.notes ?? null,
        }}
      />
    </main>
  );
}
