// src/app/books/[id]/edit/page.tsx
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useBooks } from '@/store/books';
import { useToast } from '@/components/ui/ToastProvider';
import CoverPreview from '@/components/book/CoverPreview';
import RatingStars from '@/components/book/RatingStars';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { bookFormSchema, type BookFormValues } from '@/features/books/schema';
import type { Book } from '@/types/book';

export default function EditBookPage() {
  // 1) Normaliza o id (params.id pode vir como string | string[])
  const params = useParams<{ id: string | string[] }>();
  const id = useMemo(
    () => (Array.isArray(params.id) ? params.id[0] : params.id),
    [params.id]
  );

  const router = useRouter();
  const { state, updateBook } = useBooks();
  const { showToast } = useToast();

  // 2) Busca o livro; pode ser undefined → fazemos early return (type guard)
  const maybeBook: Book | undefined = state.books.find((b) => b.id === id);
  if (!maybeBook) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Início', href: '/' },
            { label: 'Biblioteca', href: '/library' },
            { label: 'Editar' },
          ]}
        />
        <p className="text-slate-600">Livro não encontrado.</p>
        <Link href="/library" className="underline">
          Voltar
        </Link>
      </main>
    );
  }

  // Daqui pra baixo, "book" é 100% Book (evita “possibly undefined” em closures)
  const book: Book = maybeBook;

  // 3) React Hook Form + Zod
  //    - defaultValues populados com os dados do livro
  //    - valueAsNumber nos campos numéricos (converte string → number)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: book.title,
      author: book.author,
      genre: book.genre,
      year: book.year,
      pages: book.pages,
      currentPage: book.currentPage ?? 0,
      rating: book.rating,
      synopsis: book.synopsis,
      cover: book.cover,
      status: book.status ?? 'QUERO_LER',
      isbn: book.isbn,
      notes: book.notes,
      fileUrl: book.fileUrl, // ← novo: caminho/URL do PDF dentro de /public
    },
  });

  // Observa valores reativos (para preview e estrelas)
  const coverUrl = watch('cover');
  const rating = watch('rating');

  // 4) Submit tipado: inclui "fileUrl" ao atualizar
  const onSubmit: SubmitHandler<BookFormValues> = (values) => {
    const updated: Book = {
      ...book,
      title: values.title,
      author: values.author,
      genre: values.genre,
      year: values.year,
      pages: values.pages,
      currentPage: values.currentPage ?? 0,
      rating: values.rating,
      synopsis: values.synopsis,
      cover: values.cover,
      status: values.status,
      isbn: values.isbn,
      notes: values.notes,
      fileUrl: values.fileUrl, // ← garante que salvamos o PDF
    };

    updateBook(updated);
    showToast({
      title: 'Livro atualizado',
      message: 'Alterações salvas.',
      variant: 'success',
    });
    router.push(`/books/${book.id}`);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Início', href: '/' },
          { label: 'Biblioteca', href: '/library' },
          { label: book.title, href: `/books/${book.id}` },
          { label: 'Editar' },
        ]}
      />

      {/* Ações de topo */}
      <div className="mb-4 flex gap-2">
        <Link
          href={`/books/${book.id}`}
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Voltar
        </Link>
      </div>

      <h1 className="mb-4 text-2xl font-semibold">Editar livro</h1>

      {/* Formulário */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-6 sm:grid-cols-[auto,1fr]"
      >
        {/* Preview da capa à esquerda */}
        <div>
          <CoverPreview url={coverUrl} alt="Capa do livro" />
          <p className="mt-2 text-xs text-slate-500">Preview da capa</p>
        </div>

        {/* Campos */}
        <div className="grid grid-cols-1 gap-4">
          {/* Título */}
          <div>
            <label className="mb-1 block text-sm font-medium">Título *</label>
            <input
              {...register('title')}
              className="w-full rounded-md border px-3 py-2"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Autor */}
          <div>
            <label className="mb-1 block text-sm font-medium">Autor *</label>
            <input
              {...register('author')}
              className="w-full rounded-md border px-3 py-2"
            />
            {errors.author && (
              <p className="mt-1 text-sm text-red-600">
                {errors.author.message}
              </p>
            )}
          </div>

          {/* Gênero + Ano */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Gênero</label>
              <input
                {...register('genre')}
                className="w-full rounded-md border px-3 py-2"
              />
              {errors.genre && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.genre.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Ano</label>
              <input
                {...register('year', { valueAsNumber: true })}
                className="w-full rounded-md border px-3 py-2"
                inputMode="numeric"
              />
              {errors.year && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.year.message as string}
                </p>
              )}
            </div>
          </div>

          {/* Páginas + Página atual */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Páginas</label>
              <input
                {...register('pages', { valueAsNumber: true })}
                className="w-full rounded-md border px-3 py-2"
                inputMode="numeric"
              />
              {errors.pages && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.pages.message as string}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Página atual
              </label>
              <input
                {...register('currentPage', { valueAsNumber: true })}
                className="w-full rounded-md border px-3 py-2"
                inputMode="numeric"
              />
              {errors.currentPage && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.currentPage.message as string}
                </p>
              )}
            </div>
          </div>

          {/* Avaliação + Status */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Avaliação
              </label>
              {/* input oculto para RHF manter o campo como number */}
              <input
                type="hidden"
                {...register('rating', { valueAsNumber: true })}
              />
              <RatingStars
                value={rating ?? 0}
                onChange={(n) =>
                  setValue('rating', n || undefined, { shouldDirty: true })
                }
              />
              {errors.rating && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.rating.message as string}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select
                {...register('status')}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="QUERO_LER">Quero ler</option>
                <option value="LENDO">Lendo</option>
                <option value="LIDO">Lido</option>
                <option value="PAUSADO">Pausado</option>
                <option value="ABANDONADO">Abandonado</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.status.message as string}
                </p>
              )}
            </div>
          </div>

          {/* URL da capa */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              URL da capa
            </label>
            <input
              {...register('cover')}
              className="w-full rounded-md border px-3 py-2"
              placeholder="https://..."
            />
            {errors.cover && (
              <p className="mt-1 text-sm text-red-600">
                {errors.cover.message as string}
              </p>
            )}
          </div>

          {/* 🔽 NOVO: Caminho do PDF dentro do projeto */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Arquivo PDF (caminho no projeto)
            </label>
            <input
              {...register('fileUrl')}
              className="w-full rounded-md border px-3 py-2"
              placeholder="/ebooks/dezesseis-luas-kami-garcia.pdf"
            />
            <p className="mt-1 text-xs text-slate-500">
              O arquivo deve estar em <code>public/ebooks/</code>. Ex.:{' '}
              <code>/ebooks/dezesseis-luas-kami-garcia.pdf</code>
            </p>
            {errors.fileUrl && (
              <p className="mt-1 text-sm text-red-600">
                {errors.fileUrl.message as string}
              </p>
            )}
          </div>

          {/* ISBN */}
          <div>
            <label className="mb-1 block text-sm font-medium">ISBN</label>
            <input
              {...register('isbn')}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          {/* Sinopse */}
          <div>
            <label className="mb-1 block text-sm font-medium">Sinopse</label>
            <textarea
              {...register('synopsis')}
              className="min-h-28 w-full rounded-md border px-3 py-2"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="mb-1 block text-sm font-medium">Notas</label>
            <textarea
              {...register('notes')}
              className="min-h-24 w-full rounded-md border px-3 py-2"
            />
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {isSubmitting ? 'Salvando…' : 'Salvar alterações'}
            </button>
            <Link
              href={`/books/${book.id}`}
              className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </form>
    </main>
  );
}
