// src/app/books/new/page.tsx
'use client';

import { useForm, type SubmitHandler, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBooks } from '@/store/books';
import { useToast } from '@/components/ui/ToastProvider';
import CoverPreview from '@/components/book/CoverPreview';
import RatingStars from '@/components/book/RatingStars';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { Progress } from '@/components/ui/progress';
import { bookFormSchema, type BookFormValues } from '@/features/books/schema';
import type { Book } from '@/types/book'; // ✅ ADICIONADO: vamos tipar newBook como Book

export default function NewBookPage() {
  const router = useRouter();
  const { addBook } = useBooks();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    control,
  } = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: '',
      author: '',
      genre: undefined,
      year: undefined,
      pages: undefined,
      currentPage: 0,
      rating: undefined,
      synopsis: undefined,
      cover: undefined,
      status: 'QUERO_LER',
      isbn: undefined,
      notes: undefined,
      fileUrl: '',
    },
  });

  const coverUrl = watch('cover');
  const rating = watch('rating');

  // ---------------------------
  // PROGRESSO DE PREENCHIMENTO
  // ---------------------------
  const values = useWatch({ control });
  const completion = (() => {
    const checks = [
      !!values?.title?.trim(),
      !!values?.author?.trim(),
      !!values?.genre?.trim(),
      typeof values?.year === 'number' && values.year > 0,
      typeof values?.pages === 'number' && values.pages > 0,
      typeof values?.rating === 'number' && values.rating > 0,
      !!values?.synopsis?.trim(),
      !!values?.cover?.trim(),
      !!values?.isbn?.trim(),
      !!values?.notes?.trim(),
      !!values?.fileUrl?.trim(),
    ];
    const total = checks.length;
    const filled = checks.filter(Boolean).length;
    return total ? Math.round((filled / total) * 100) : 0;
  })();

  const onSubmit: SubmitHandler<BookFormValues> = (values) => {
    // ✅ MONTE UM Book COMPLETO (inclui createdAt)
    const newBook: Book = {
      id: crypto.randomUUID(),
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
      fileUrl: values.fileUrl?.startsWith('/ebooks/')
        ? values.fileUrl
        : `/ebooks/${(values.fileUrl ?? '').replace(/^\/+/, '')}`,
      createdAt: new Date(), // ✅ ESSA LINHA RESOLVE O ERRO DE TIPO
    };

    addBook(newBook);
    showToast({
      title: 'Livro criado',
      message: 'Cadastro realizado com sucesso.',
      variant: 'success',
    });
    router.push(`/books/${newBook.id}`);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Início', href: '/' },
          { label: 'Biblioteca', href: '/library' },
          { label: 'Adicionar' },
        ]}
      />

      <div className="mb-4 flex gap-2">
        <Link
          href="/library"
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Voltar
        </Link>
      </div>

      <h1 className="mb-2 text-2xl font-semibold">Adicionar novo livro</h1>

      <div className="mb-4">
        <div className="mb-1 text-sm font-medium">
          Progresso do preenchimento
        </div>
        <Progress value={completion} />
      </div>

      {isSubmitting ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-blue-500"></div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-6 sm:grid-cols-[auto,1fr]"
        >
          <div>
            <CoverPreview url={coverUrl} alt="Capa do livro" />
            <p className="mt-2 text-xs text-slate-500">Preview da capa</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Título */}
            <div>
              <label className="mb-1 block text-sm font-medium">Título *</label>
              <input
                {...register('title')}
                className={`w-full rounded-md border px-3 py-2 ${
                  errors.title ? 'border-red-600' : ''
                }`}
                placeholder="Ex.: Dom Casmurro"
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
                className={`w-full rounded-md border px-3 py-2 ${
                  errors.author ? 'border-red-600' : ''
                }`}
                placeholder="Ex.: Machado de Assis"
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
                  className={`w-full rounded-md border px-3 py-2 ${
                    errors.genre ? 'border-red-600' : ''
                  }`}
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
                  inputMode="numeric"
                  placeholder="Ex.: 1899"
                  className={`w-full rounded-md border px-3 py-2 ${
                    errors.year ? 'border-red-600' : ''
                  }`}
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
                <label className="mb-1 block text-sm font-medium">
                  Páginas
                </label>
                <input
                  {...register('pages', { valueAsNumber: true })}
                  inputMode="numeric"
                  placeholder="Ex.: 256"
                  className={`w-full rounded-md border px-3 py-2 ${
                    errors.pages ? 'border-red-600' : ''
                  }`}
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
                  inputMode="numeric"
                  placeholder="Ex.: 20"
                  className={`w-full rounded-md border px-3 py-2 ${
                    errors.currentPage ? 'border-red-600' : ''
                  }`}
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
                  className={`w-full rounded-md border px-3 py-2 ${
                    errors.status ? 'border-red-600' : ''
                  }`}
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
                placeholder="https://..."
                className={`w-full rounded-md border px-3 py-2 ${
                  errors.cover ? 'border-red-600' : ''
                }`}
              />
              {errors.cover && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.cover.message as string}
                </p>
              )}
            </div>

            {/* PDF dentro do projeto */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Arquivo PDF (caminho no projeto)
              </label>
              <input
                {...register('fileUrl')}
                className={`w-full rounded-md border px-3 py-2 ${
                  errors.fileUrl ? 'border-red-600' : ''
                }`}
                placeholder="/ebooks/dezesseis-luas-kami-garcia.pdf"
              />
              <p className="mt-1 text-xs text-slate-500">
                Coloque o arquivo em <code>public/ebooks/</code> e informe o
                caminho começando por <code>/ebooks/</code>.
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
                placeholder="Opcional"
              />
            </div>

            {/* Sinopse */}
            <div>
              <label className="mb-1 block text-sm font-medium">Sinopse</label>
              <textarea
                {...register('synopsis')}
                className="min-h-28 w-full rounded-md border px-3 py-2"
                placeholder="Opcional"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="mb-1 block text-sm font-medium">Notas</label>
              <textarea
                {...register('notes')}
                className="min-h-24 w-full rounded-md border px-3 py-2"
                placeholder="Opcional"
              />
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {isSubmitting ? 'Salvando…' : 'Salvar'}
              </button>
              <Link
                href="/library"
                className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancelar
              </Link>
            </div>
          </div>
        </form>
      )}
    </main>
  );
}
