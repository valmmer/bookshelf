'use client';

// Página de criação de livro (modo simples):
// - PDF OBRIGATÓRIO via upload (sem caminho local)
// - Capa OPCIONAL via upload (removido o campo de URL)
// - Mensagens claras e UX: botão salvar desabilita sem PDF

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
import { useMemo, useState } from 'react';

export default function NewBookPage() {
  const router = useRouter();
  const { addBook } = useBooks();
  const { showToast } = useToast();

  // Estados locais para upload
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    control,
    setError,
    clearErrors,
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
      // ❌ removido: cover URL e fileUrl local
      status: 'QUERO_LER',
      isbn: undefined,
      notes: undefined,
    },
  });

  const rating = watch('rating');

  // Progresso visual (só campos úteis do formulário)
  const values = useWatch({ control });
  const completion = useMemo(() => {
    const checks = [
      !!values?.title?.trim(),
      !!values?.author?.trim(),
      !!values?.genre?.trim(),
      typeof values?.year === 'number' && values.year > 0,
      typeof values?.pages === 'number' && values.pages > 0,
      typeof values?.rating === 'number' && values.rating > 0,
      !!values?.synopsis?.trim(),
      !!values?.isbn?.trim(),
      !!values?.notes?.trim(),
      !!pdfFile, // 👈 agora conta o upload do PDF
    ];
    const total = checks.length;
    const filled = checks.filter(Boolean).length;
    return total ? Math.round((filled / total) * 100) : 0;
  }, [values, pdfFile]);

  // Preview da capa: se houver upload, faz URL local temporária
  const coverPreviewUrl = useMemo(() => {
    if (!coverFile) return undefined;
    return URL.createObjectURL(coverFile);
  }, [coverFile]);

  // SUBMIT
  const onSubmit: SubmitHandler<BookFormValues> = async (values) => {
    try {
      // ✅ PDF é obrigatório
      if (!pdfFile) {
        setError('title', { type: 'manual', message: '' }); // força re-render dos erros
        showToast({
          title: 'PDF obrigatório',
          message: 'Selecione um arquivo em “Importar PDF”.',
          variant: 'error',
        });
        return;
      } else {
        clearErrors();
      }

      // 1) Sobe o(s) arquivo(s) para a API local (/api/upload)
      const fd = new FormData();
      fd.append('pdf', pdfFile);
      if (coverFile) fd.append('cover', coverFile);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        let serverMsg = 'Falha no upload';
        try {
          const data = await res.json();
          serverMsg = data?.error || data?.detail || serverMsg;
        } catch {
          try {
            serverMsg = await res.text();
          } catch {}
        }
        throw new Error(`(${res.status}) ${serverMsg}`);
      }

      const data = (await res.json()) as {
        pdfUrl: string;
        coverUrl?: string | null;
      };
      const uploadedPdfUrl = data.pdfUrl;
      const uploadedCoverUrl = data.coverUrl ?? undefined;

      // 2) Cria o objeto Book
      const now = new Date();
      const newBook = {
        id: crypto.randomUUID(),
        title: values.title,
        author: values.author,
        genre: values.genre,
        year: values.year,
        pages: values.pages,
        currentPage: values.currentPage ?? 0,
        rating: values.rating,
        synopsis: values.synopsis,
        cover: uploadedCoverUrl, // 👈 só via upload (pode ser undefined)
        status: values.status,
        isbn: values.isbn,
        notes: values.notes,
        fileUrl: uploadedPdfUrl, // 👈 sempre do upload
        createdAt: now,
        updatedAt: now,
      };

      addBook(newBook);
      showToast({
        title: 'Livro criado',
        message: 'Cadastro realizado com sucesso.',
        variant: 'success',
      });
      router.push(`/books/${newBook.id}`);
    } catch (err: any) {
      console.error(err);
      showToast({
        title: 'Erro ao salvar',
        message: err?.message ?? 'Tente novamente.',
        variant: 'error',
      });
    }
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

      {/* Barra de progresso – métrica visual do preenchimento */}
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
          {/* Coluna da esquerda: preview da capa */}
          <div>
            <CoverPreview url={coverPreviewUrl} alt="Capa do livro" />
            <p className="mt-2 text-xs text-slate-500">
              Preview da capa (se enviar imagem)
            </p>
          </div>

          {/* Coluna da direita: campos */}
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
                autoFocus
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

            {/* IMPORTANTE: PDF obrigatório via upload */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Importar PDF (obrigatório)
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                className={`w-full rounded-md border px-3 py-2 ${
                  !pdfFile ? 'border-red-600' : ''
                }`}
              />
              <p className="mt-1 text-xs text-slate-600">
                Selecione o arquivo do <strong>livro em PDF</strong>. O arquivo
                será salvo localmente em <code>public/ebooks</code> e ficará
                disponível para leitura no app.
              </p>
              {!pdfFile && (
                <p className="mt-1 text-sm text-red-600">
                  O PDF do livro é obrigatório.
                </p>
              )}
            </div>

            {/* Upload de capa (opcional) */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Importar Capa (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-md border px-3 py-2"
              />
              <p className="mt-1 text-xs text-slate-600">
                Se enviar uma imagem, ela será salva em{' '}
                <code>public/covers</code> e usada como capa do livro.
              </p>
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
                disabled={isSubmitting || !pdfFile} // 👈 UX: desabilita sem PDF
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
