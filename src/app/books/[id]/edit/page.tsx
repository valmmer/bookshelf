// src/app/books/[id]/page.tsx
'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { useBooks } from '@/store/books';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import ReadOnlyStars from '@/components/book/ReadOnlyStars';
import { normalizeCoverUrl, hasFile, type Book } from '@/types/book';

export default function BookDetailsPage() {
  // 1) params/id sempre no topo
  const params = useParams<{ id: string | string[] }>();
  const id = useMemo(
    () => (Array.isArray(params.id) ? params.id[0] : params.id),
    [params.id]
  );

  const router = useRouter();
  const { state, deleteBook, updateBook } = useBooks();

  // 2) TODOS os hooks no topo — NUNCA dentro de if
  // (coloque aqui TUDO que estava nas linhas 75..81)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [noteDraft, setNoteDraft] = useState<string>('');

  // 3) pegue o livro
  const book: Book | undefined = state.books.find((b) => b.id === id);

  // 4) efeitos/derivações que dependem do book, mas SEM mover hooks
  useEffect(() => {
    // exemplo: sincronizar página atual quando o book mudar
    if (book?.currentPage && Number.isFinite(book.currentPage)) {
      setCurrentPage(book.currentPage!);
    }
  }, [book]);

  // 5) render “not found” SÓ AQUI (depois dos hooks já terem sido chamados)
  if (!book) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Início', href: '/' },
            { label: 'Biblioteca', href: '/library' },
            { label: 'Detalhes' },
          ]}
        />
        <p className="text-slate-600">Livro não encontrado.</p>
        <Link href="/library" className="underline">
          Voltar
        </Link>
      </main>
    );
  }

  // 6) handlers (podem usar setStates livremente)
  const openReader = () => setIsReaderOpen(true);
  const closeReader = () => setIsReaderOpen(false);

  const toggleMenu = () => setIsMenuOpen((s) => !s);
  const openDelete = () => setIsDeleteOpen(true);
  const closeDelete = () => setIsDeleteOpen(false);

  const goToEdit = () => router.push(`/books/${book.id}/edit`);

  // 7) UI
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Início', href: '/' },
          { label: 'Biblioteca', href: '/library' },
          { label: book.title },
        ]}
      />

      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/library"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Voltar
        </Link>
        <button
          onClick={goToEdit}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Editar
        </button>
        <div className="relative">
          <button
            onClick={toggleMenu}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Mais
          </button>
          {isMenuOpen && (
            <div className="absolute z-10 mt-2 w-40 rounded-md border bg-white p-2 text-sm shadow">
              <button
                onClick={openDelete}
                className="block w-full rounded px-2 py-1 text-left hover:bg-slate-50"
              >
                Remover
              </button>
              {hasFile(book) && (
                <button
                  onClick={openReader}
                  className="mt-1 block w-full rounded px-2 py-1 text-left hover:bg-slate-50"
                >
                  Ler PDF
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <section className="flex gap-6">
        <img
          src={normalizeCoverUrl(book.cover)}
          alt={book.title}
          className="h-48 w-36 rounded-md border object-cover"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{book.title}</h1>
          {book.author && <p className="text-slate-600">{book.author}</p>}
          <div className="mt-2">
            <ReadOnlyStars value={book.rating ?? 0} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-700">
            {book.year && (
              <p>
                <span className="text-slate-500">Ano:</span> {book.year}
              </p>
            )}
            {book.pages && (
              <p>
                <span className="text-slate-500">Páginas:</span> {book.pages}
              </p>
            )}
            {book.genre && (
              <p>
                <span className="text-slate-500">Gênero:</span> {book.genre}
              </p>
            )}
            {typeof book.currentPage === 'number' && (
              <p>
                <span className="text-slate-500">Página atual:</span>{' '}
                {currentPage}
              </p>
            )}
          </div>

          {book.synopsis && (
            <p className="mt-4 whitespace-pre-wrap text-slate-800">
              {book.synopsis}
            </p>
          )}
        </div>
      </section>

      {/* Modal de remover (exemplo) */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-md bg-white p-4 shadow">
            <p className="mb-4">
              Tem certeza que deseja remover “{book.title}”?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeDelete}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteBook(book.id);
                  router.push('/library');
                }}
                className="rounded-md bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-500"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leitor PDF (exemplo toggle) */}
      {isReaderOpen && hasFile(book) && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/60 p-4">
          <div className="h-[90vh] w-full max-w-5xl rounded-md bg-white p-2 shadow">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-medium">Lendo: {book.title}</h2>
              <button
                onClick={closeReader}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>
            {/* Troque por seu componente real de leitura */}
            <iframe
              src={book.fileUrl}
              className="h-[80vh] w-full rounded border"
            />
          </div>
        </div>
      )}
    </main>
  );
}
