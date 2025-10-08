// src/app/books/[id]/read/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';
import { getBook } from '@/server/db/books';
import ReaderClient from './ReaderClient';

function normalizeUrl(u?: string | null): string | null {
  if (!u) return null;
  const s = String(u).trim().toLowerCase();
  if (
    !s ||
    s === 'undefined' ||
    s === 'null' ||
    s === '#' ||
    s === 'about:blank'
  )
    return null;
  // absolutas e caminhos conhecidos
  return u.startsWith('http') || u.startsWith('/')
    ? u
    : /^ebooks\//i.test(u)
    ? `/${u}`
    : `/ebooks/${u}`;
}

function isValidAssetUrl(u?: string | null): u is string {
  if (!u) return false;
  const s = String(u).trim().toLowerCase();
  if (
    !s ||
    s === 'undefined' ||
    s === 'null' ||
    s === '#' ||
    s === 'about:blank'
  )
    return false;
  return (
    u.startsWith('/') || u.startsWith('http://') || u.startsWith('https://')
  );
}

type PageProps = { params: Promise<{ id: string }> };

const loadBook = cache(async (id: number) => {
  const book = await getBook(id);
  if (!book) throw new Error('NOT_FOUND');
  return book;
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum))
    return { title: 'Leitor de PDF', description: 'Leitura de livros em PDF' };

  try {
    const book = await loadBook(idNum);
    const title = `Lendo: ${book.title}`;
    const description = book.synopsis ?? 'Leitura de livros em PDF';
    const images = isValidAssetUrl(book.cover)
      ? [{ url: book.cover }]
      : undefined;
    return {
      title,
      description,
      openGraph: images
        ? { title, description, images }
        : { title, description },
    };
  } catch {
    return { title: 'Leitor de PDF', description: 'Leitura de livros em PDF' };
  }
}

export default async function ReadBookPage({ params }: PageProps) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  let book;
  try {
    book = await loadBook(id);
  } catch {
    notFound();
  }

  const pdfUrl = normalizeUrl(book.fileUrl);
  const startPage =
    typeof book.currentPage === 'number'
      ? Math.max(1, book.currentPage + 1)
      : 1;

  if (!pdfUrl) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="mb-4 text-sm text-destructive">
          Arquivo do livro não encontrado ou inválido.
        </p>
        <Link className="underline" href={`/books/${id}`}>
          ← Voltar ao livro
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-64px)] flex-col">
      <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-2">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href={`/books/${id}`}
              className="rounded-md border px-2 py-1 text-sm hover:bg-muted"
            >
              ← Voltar
            </Link>
            <h1 className="text-sm font-medium line-clamp-1">{book.title}</h1>
          </div>
        </header>
      </div>

      <div className="flex-1">
        <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <section
            className="mx-auto h-[calc(100vh-64px-52px)] w-full max-w-[980px] lg:max-w-[1100px] overflow-hidden rounded-xl border bg-[rgb(var(--card))] shadow-sm isolate"
            aria-label="Área de leitura"
          >
            <div
              className="h-full overflow-auto overscroll-auto touch-pan-y"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <ReaderClient
                id={id}
                title={book.title}
                fileUrl={pdfUrl}
                initialPage={startPage}
                pages={typeof book.pages === 'number' ? book.pages : undefined}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
