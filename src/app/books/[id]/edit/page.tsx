// src/app/books/[id]/edit/page.tsx
// src/app/books/[id]/edit/page.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
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
  // -----------------------------
  // 1) ID normalizado a partir da URL
  // -----------------------------
  const params = useParams<{ id: string | string[] }>();
  const id = useMemo(
    () => (Array.isArray(params.id) ? params.id[0] : params.id),
    [params.id]
  );

  const router = useRouter();
  const { state, updateBook } = useBooks();
  const { showToast } = useToast();

  // -----------------------------
  // 2) Busca o livro; fallback caso não exista
  // -----------------------------
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
  const book = maybeBook;

  // -----------------------------
  // 3) Estados locais para upload (fora do schema)
  // -----------------------------
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | undefined>(
    book.cover // começa mostrando a capa atual se existir
  );

  useEffect(() => {
    if (!coverFile) return;
    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  // -----------------------------
  // 4) React Hook Form + Zod
  //    (schema NÃO possui mais fileUrl nem cover URL obrigatória)
  // -----------------------------
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
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
      status: book.status ?? 'QUERO_LER',
      isbn: book.isbn,
      notes: book.notes,
      // ❌ não colocamos fileUrl/cover aqui: agora são tratados via upload
    },
  });

  const rating = watch('rating');

  // -----------------------------
  // 5) Submit
  //    - Se usuário escolher um NOVO PDF, enviamos (com a capa, se houver)
  //    - Se não escolher PDF, mantemos fileUrl atual
  //    - Se escolher capa junto com PDF, a rota salvará e retornará coverUrl
  //    - (A rota /api/upload atual exige PDF; portanto, troca de capa isolada
  //       não é suportada — precisa selecionar PDF também. Mantemos capa antiga
  //       se só a capa for escolhida sem PDF.)
  // -----------------------------
  const onSubmit: SubmitHandler<BookFormValues> = async (values) => {
    try {
      let finalFileUrl = book.fileUrl; // começa com o atual
      let finalCoverUrl = book.cover;

      if (pdfFile) {
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
        finalFileUrl = data.pdfUrl; // substitui PDF
        if (data.coverUrl) finalCoverUrl = data.coverUrl; // substitui capa se enviada
      } else {
        // Sem novo PDF: se usuário escolheu capa sozinha, avisamos que não é suportado
        if (coverFile) {
          showToast({
            title: 'Envio da capa não aplicado',
            message: 'Para substituir a capa, selecione o novo PDF junto.',
            variant: 'info',
          });
        }
      }

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
        cover: finalCoverUrl,
        status: values.status,
        isbn: values.isbn,
        notes: values.notes,
        fileUrl: finalFileUrl,
        updatedAt: new Date(),
      };

      updateBook(updated);
      showToast({
        title: 'Livro atualizado',
        message: 'Alterações salvas.',
        variant: 'success',
      });
      router.push(`/books/${book.id}`);
    } catch (err: any) {
      console.error(err);
      showToast({
        title: 'Erro ao salvar',
        message: err?.message ?? 'Tente novamente.',
        variant: 'error',
      });
    }
  };

  // -----------------------------
  // 6) UI
  // -----------------------------
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
          <CoverPreview url={coverPreviewUrl} alt="Capa do livro" />
          <p className="mt-2 text-xs text-slate-500">
            Pré-visualização da capa{' '}
            {book.cover ? '(mostrando a atual se não enviar arquivo)' : ''}
          </p>
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

          {/* Substituir PDF (opcional) */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Substituir PDF (opcional)
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-md border px-3 py-2"
            />
            <p className="mt-1 text-xs text-slate-600">
              PDF atual: <code className="break-all">{book.fileUrl}</code>. Se
              selecionar um novo, o arquivo será salvo em{' '}
              <code>public/ebooks</code> e o link será atualizado.
            </p>
          </div>

          {/* Substituir Capa (opcional, junto com PDF) */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Substituir Capa (opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-md border px-3 py-2"
            />
            <p className="mt-1 text-xs text-slate-600">
              Para aplicar a nova capa, envie-a juntamente com um novo PDF. Caso
              contrário, manteremos a capa atual.
            </p>
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
