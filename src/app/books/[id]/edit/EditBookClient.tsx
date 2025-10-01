// src/app/books/[id]/edit/EditBookClient.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  useForm,
  Controller,
  useWatch,
  type SubmitHandler,
  type Resolver,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useToast } from '@/components/ui/ToastProvider';
import CoverPreview from '@/components/book/CoverPreview';
import RatingStars from '@/components/book/RatingStars';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

import { updateBookAction, deleteBookAction } from '@/app/actions/bookActions';
import { bookFormSchema } from '@/features/books/schema';
import type { z } from 'zod';
type BookFormValues = z.infer<typeof bookFormSchema>;

export default function EditBookClient({
  id,
  initial,
}: {
  id: number;
  initial: BookFormValues;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const WHITE_FIELD =
    'bg-white dark:bg-white text-slate-900 placeholder:text-slate-500';

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const resolver = zodResolver(
    bookFormSchema
  ) as unknown as Resolver<BookFormValues>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    control,
  } = useForm<BookFormValues>({
    resolver,
    defaultValues: initial,
    mode: 'onChange',
  });

  // valores observados para progresso e estrelas
  const values = useWatch({ control }) as BookFormValues;

  // Progresso (heurística simples)
  const completion = useMemo(() => {
    const checks = [
      !!values?.title?.trim(),
      !!values?.author?.trim(),
      !!values?.genre?.trim(),
      typeof values?.year === 'number' &&
        Number.isFinite(values.year) &&
        values.year > 0,
      typeof values?.pages === 'number' &&
        Number.isFinite(values.pages) &&
        values.pages > 0,
      typeof values?.currentPage === 'number' &&
        Number.isFinite(values.currentPage),
      typeof values?.rating === 'number' &&
        Number.isFinite(values.rating) &&
        values.rating > 0,
      !!values?.synopsis?.trim(),
      !!values?.isbn?.trim(),
      !!values?.notes?.trim(),
    ];
    const total = checks.length;
    const filled = checks.filter(Boolean).length;
    return total ? Math.round((filled / total) * 100) : 0;
  }, [values]);

  // preview da capa
  const coverPreviewUrl = useMemo(() => {
    if (coverFile) return URL.createObjectURL(coverFile);
    return initial.cover || undefined;
  }, [coverFile, initial.cover]);

  useEffect(() => {
    return () => {
      if (coverFile && coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverFile, coverPreviewUrl]);

  const onValid: SubmitHandler<BookFormValues> = async (formValues) => {
    try {
      let pdfUrl = formValues.fileUrl || '';
      let coverUrl = formValues.cover || '';

      // upload opcional de novos arquivos
      if (pdfFile || coverFile) {
        const fd = new FormData();
        if (pdfFile) fd.append('pdf', pdfFile);
        if (coverFile) fd.append('cover', coverFile);

        const resUp = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!resUp.ok) {
          const msg = await resUp.text().catch(() => '');
          throw new Error(msg || `Falha no upload (${resUp.status})`);
        }
        const json = await resUp.json();
        pdfUrl = json.pdfUrl || pdfUrl;
        coverUrl = json.coverUrl ?? coverUrl;
      }

      const payload: BookFormValues = {
        ...formValues,
        year: Number.isFinite(formValues.year as any)
          ? Number(formValues.year)
          : undefined,
        pages: Number.isFinite(formValues.pages as any)
          ? Number(formValues.pages)
          : undefined,
        currentPage: Number.isFinite(formValues.currentPage as any)
          ? Number(formValues.currentPage)
          : 0,
        rating: Number.isFinite(formValues.rating as any)
          ? Number(formValues.rating)
          : undefined,
        genre: formValues.genre?.trim() || '',
        cover: coverUrl || '',
        fileUrl: pdfUrl || '',
      };

      const res = await updateBookAction(id, payload);
      if (!res.ok) throw new Error(res.error || 'Erro ao salvar');

      showToast({
        title: 'Livro atualizado',
        message: 'Alterações salvas.',
        variant: 'success',
      });
      router.push(`/books/${id}`);
    } catch (err: any) {
      showToast({
        title: 'Erro ao salvar',
        message: err?.message ?? 'Tente novamente.',
        variant: 'error',
      });
    }
  };

  const onDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este livro?')) return;
    const res = await deleteBookAction(id);
    if (!res.ok) {
      showToast({
        title: 'Erro ao excluir',
        message: res.error,
        variant: 'error',
      });
      return;
    }
    showToast({
      title: 'Livro excluído',
      message: 'Removido com sucesso.',
      variant: 'success',
    });
    router.push('/library');
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Editar livro</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/books/${id}`}>Voltar</Link>
          </Button>
          <Button type="button" variant="destructive" onClick={onDelete}>
            Excluir
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-1 text-sm font-medium">Progresso</div>
        <Progress value={completion} />
      </div>

      <form
        onSubmit={handleSubmit(onValid)}
        className="grid grid-cols-1 gap-6 sm:grid-cols-[auto,1fr]"
      >
        <div>
          <CoverPreview url={coverPreviewUrl} alt="Capa do livro" />
          <p className="mt-2 text-xs text-muted-foreground">
            Preview da capa (se enviar imagem)
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Título *</label>
              <Input
                className={WHITE_FIELD}
                aria-invalid={!!errors.title}
                {...register('title', { required: 'Informe o título' })}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Autor *</label>
              <Input
                className={WHITE_FIELD}
                aria-invalid={!!errors.author}
                {...register('author', { required: 'Informe o autor' })}
              />
              {errors.author && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.author.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Gênero</label>
                <Input
                  className={WHITE_FIELD}
                  aria-invalid={!!errors.genre}
                  {...register('genre')}
                />
                {errors.genre && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.genre.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Ano</label>
                <Input
                  className={WHITE_FIELD}
                  type="number"
                  inputMode="numeric"
                  aria-invalid={!!errors.year}
                  {...register('year', {
                    setValueAs: (v) =>
                      v === '' || v === null ? undefined : Number(v),
                  })}
                />
                {errors.year && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.year.message as string}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Páginas
                </label>
                <Input
                  className={WHITE_FIELD}
                  type="number"
                  inputMode="numeric"
                  aria-invalid={!!errors.pages}
                  {...register('pages', {
                    setValueAs: (v) =>
                      v === '' || v === null ? undefined : Number(v),
                  })}
                />
                {errors.pages && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.pages.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Página atual
                </label>
                <Input
                  className={WHITE_FIELD}
                  type="number"
                  inputMode="numeric"
                  aria-invalid={!!errors.currentPage}
                  {...register('currentPage', {
                    setValueAs: (v) => (v === '' || v === null ? 0 : Number(v)),
                  })}
                />
                {errors.currentPage && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.currentPage.message as string}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Avaliação
                </label>
                <input
                  type="hidden"
                  {...register('rating', {
                    setValueAs: (v) => (v === '' ? undefined : Number(v)),
                  })}
                />
                <RatingStars
                  value={values?.rating ?? 0}
                  onChange={(n) =>
                    setValue('rating', n || undefined, { shouldDirty: true })
                  }
                />
                {errors.rating && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.rating.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        className={WHITE_FIELD}
                        aria-invalid={!!errors.status}
                      >
                        <SelectValue placeholder="Selecione…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="QUERO_LER">Quero ler</SelectItem>
                        <SelectItem value="LENDO">Lendo</SelectItem>
                        <SelectItem value="LIDO">Lido</SelectItem>
                        <SelectItem value="PAUSADO">Pausado</SelectItem>
                        <SelectItem value="ABANDONADO">Abandonado</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.status.message as string}
                  </p>
                )}
              </div>
            </div>

            {/* Substituir arquivos (opcionais) */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Substituir PDF (opcional)
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Substituir capa (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? 'Salvando…' : 'Salvar alterações'}
              </Button>
              <Button asChild variant="outline" type="button">
                <Link href={`/books/${id}`}>Cancelar</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}
