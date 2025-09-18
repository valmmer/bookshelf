'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useBooks } from '@/store/books';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';

// 🔒 carrega o leitor só no client
const PDFReader = dynamic(() => import('@/components/reader/PDFReader'), {
  ssr: false,
  loading: () => (
    <div className="flex h-40 items-center justify-center text-sm text-slate-500">
      Carregando leitor…
    </div>
  ),
});

export default function ReadBookPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { state } = useBooks();
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const book = state.books.find((b) => b.id === id);

  if (!book) {
    return (
      <main className="px-4 py-8">
        <Breadcrumbs
          items={[{ label: 'Início', href: '/' }, { label: 'Leitura' }]}
        />
        <p>Livro não encontrado.</p>
      </main>
    );
  }

  if (!isClient) return null;

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
            href={book.fileUrl || '#'}
            target="_blank"
            rel="noreferrer"
            className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-60"
            aria-disabled={!book.fileUrl}
            onClick={(e) => !book.fileUrl && e.preventDefault()}
          >
            Abrir em nova aba
          </a>
          <a
            href={book.fileUrl || '#'}
            download
            className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-60"
            aria-disabled={!book.fileUrl}
            onClick={(e) => !book.fileUrl && e.preventDefault()}
          >
            Baixar PDF
          </a>
        </div>
      </header>

      {/* Passa o valor salvo; o PDFReader normaliza */}
      <div className="flex-1">
        <PDFReader
          book={book}
          fileUrl={book.fileUrl ?? ''}
          /* 👇 se currentPage não existir, começa na 1 */
          initialPage={
            typeof book.currentPage === 'number' && book.currentPage > 0
              ? book.currentPage
              : 1
          }
        />
      </div>
    </main>
  );
}
