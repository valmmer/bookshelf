// src/app/books/[id]/read/page.tsx
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useBooks } from '@/store/books';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import PDFReader from '@/components/reader/PDFReader';
import type { Book } from '@/types/book';

export default function ReadBookPage() {
  const params = useParams<{ id: string | string[] }>();
  const id = useMemo(
    () => (Array.isArray(params.id) ? params.id[0] : params.id),
    [params.id]
  );

  const { state, updateBook } = useBooks();
  const maybeBook: Book | undefined = state.books.find((b) => b.id === id);

  if (!maybeBook) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Início', href: '/' },
            { label: 'Biblioteca', href: '/library' },
            { label: 'Leitura' },
          ]}
        />
        <p className="text-slate-600">Livro não encontrado.</p>
        <Link href="/library" className="underline">
          Voltar
        </Link>
      </main>
    );
  }

  const book = maybeBook;

  if (!book.fileUrl) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Início', href: '/' },
            { label: 'Biblioteca', href: '/library' },
            { label: book.title, href: `/books/${book.id}` },
            { label: 'Leitura' },
          ]}
        />
        <p className="text-slate-600">
          Este livro ainda não tem um PDF associado. Edite o cadastro e informe
          o campo <em>Arquivo PDF</em>.
        </p>
        <div className="mt-3 flex gap-2">
          <Link
            href={`/books/${book.id}`}
            className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Voltar
          </Link>
          <Link
            href={`/books/${book.id}/edit`}
            className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Editar cadastro
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-[calc(100vh-140px)] flex-col px-4 py-4 sm:px-6">
      <Breadcrumbs
        items={[
          { label: 'Início', href: '/' },
          { label: 'Biblioteca', href: '/library' },
          { label: book.title, href: `/books/${book.id}` },
          { label: 'Leitura' },
        ]}
      />

      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="truncate text-lg font-medium" title={book.title}>
          {book.title}
        </h1>
        <div className="flex gap-2">
          <a
            href={book.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Abrir em nova aba
          </a>
          <a
            href={book.fileUrl}
            download
            className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Baixar PDF
          </a>
          <button
            className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
            onClick={() => updateBook({ ...book, status: 'LIDO' })}
          >
            Marcar como lido
          </button>
        </div>
      </header>

      {/* Leitor com zoom + progresso salvo em currentPage */}
      <div className="flex-1">
        <PDFReader book={book} fileUrl={book.fileUrl} />
      </div>
    </main>
  );
}
