// src/app/books/new/page.tsx
'use client';

/**
 * Página: Adicionar novo livro
 * - PDF OBRIGATÓRIO por upload
 * - Capa OPCIONAL por upload (com preview local)
 * - Campos com CAIXA BRANCA sempre (mesmo no Dark) => destaque sobre fundo/gradiente
 * - Painel (card) envolvendo os campos para melhorar leitura
 * - Acessibilidade: aria-invalid, focus-visible, ring-offset
 * - UX: botão Salvar com loading e desabilitado sem PDF
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Form
import {
  useForm,
  type SubmitHandler,
  useWatch,
  Controller,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Store / App
import { useBooks } from '@/store/books';
import { useToast } from '@/components/ui/ToastProvider';

// UI e features auxiliares
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import CoverPreview from '@/components/book/CoverPreview';
import RatingStars from '@/components/book/RatingStars';
import { Progress } from '@/components/ui/progress';

// Nossos componentes UI com tokens
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

// Schema e tipos do formulário
import { bookFormSchema, type BookFormValues } from '@/features/books/schema';

export default function NewBookPage() {
  const router = useRouter();
  const { addBook } = useBooks();
  const { showToast } = useToast();

  // Campos “sempre brancos” (mesmo no dark), para destacar sobre o fundo da página
  // - Mantém texto escuro e placeholder sutil
  const WHITE_FIELD =
    'bg-white dark:bg-white text-slate-900 placeholder:text-slate-500';

  // Estados locais para upload de arquivos
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // React Hook Form com Zod
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
      status: 'QUERO_LER',
      isbn: undefined,
      notes: undefined,
    },
  });

  // Rating atual (para o componente de estrelas)
  const rating = watch('rating');

  // Progresso visual (campos principais + PDF)
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
      !!pdfFile, // 👈 conta o upload do PDF
    ];
    const total = checks.length;
    const filled = checks.filter(Boolean).length;
    return total ? Math.round((filled / total) * 100) : 0;
  }, [values, pdfFile]);

  // Preview da capa a partir do File (URL temporária)
  const coverPreviewUrl = useMemo(() => {
    if (!coverFile) return undefined;
    return URL.createObjectURL(coverFile);
  }, [coverFile]);

  // SUBMIT
  const onSubmit: SubmitHandler<BookFormValues> = async (values) => {
    try {
      // ✅ Exigir PDF
      if (!pdfFile) {
        // Força re-render dos erros; mensagem exibida via toast e abaixo do campo
        setError('title', { type: 'manual', message: '' });
        showToast({
          title: 'PDF obrigatório',
          message: 'Selecione um arquivo em “Importar PDF”.',
          variant: 'error',
        });
        return;
      } else {
        clearErrors();
      }

      // 1) Upload dos arquivos para a API local
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

      // 2) Monta objeto Book para o store
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
        cover: uploadedCoverUrl, // 👈 capa só via upload
        status: values.status,
        isbn: values.isbn,
        notes: values.notes,
        fileUrl: uploadedPdfUrl, // 👈 PDF sempre do upload
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
      {/* Trilha de navegação */}
      <Breadcrumbs
        items={[
          { label: 'Início', href: '/' },
          { label: 'Biblioteca', href: '/library' },
          { label: 'Adicionar' },
        ]}
      />

      {/* Ação voltar */}
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link href="/library">Voltar</Link>
        </Button>
      </div>

      <h1 className="mb-2 text-2xl font-semibold">Adicionar novo livro</h1>

      {/* Barra de progresso */}
      <div className="mb-4">
        <div className="mb-1 text-sm font-medium">
          Progresso do preenchimento
        </div>
        <Progress value={completion} />
      </div>

      {/* Loader de envio */}
      {isSubmitting ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-foreground/60" />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-6 sm:grid-cols-[auto,1fr]"
        >
          {/* Coluna da esquerda: preview da capa */}
          <div>
            <CoverPreview url={coverPreviewUrl} alt="Capa do livro" />
            <p className="mt-2 text-xs text-muted-foreground">
              Preview da capa (se enviar imagem)
            </p>
          </div>

          {/* Coluna da direita: PAINEL que envolve os campos */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4">
              {/* Título */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Título *
                </label>
                <Input
                  className={WHITE_FIELD}
                  placeholder="Ex.: Dom Casmurro"
                  aria-invalid={!!errors.title}
                  autoFocus
                  {...register('title', { required: 'Informe o título' })}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Autor */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Autor *
                </label>
                <Input
                  className={WHITE_FIELD}
                  placeholder="Ex.: Machado de Assis"
                  aria-invalid={!!errors.author}
                  {...register('author', { required: 'Informe o autor' })}
                />
                {errors.author && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.author.message}
                  </p>
                )}
              </div>

              {/* Gênero + Ano */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Gênero
                  </label>
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
                    placeholder="Ex.: 1899"
                    aria-invalid={!!errors.year}
                    {...register('year', { valueAsNumber: true })}
                  />
                  {errors.year && (
                    <p className="mt-1 text-sm text-destructive">
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
                  <Input
                    className={WHITE_FIELD}
                    type="number"
                    inputMode="numeric"
                    placeholder="Ex.: 256"
                    aria-invalid={!!errors.pages}
                    {...register('pages', { valueAsNumber: true })}
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
                    placeholder="Ex.: 20"
                    aria-invalid={!!errors.currentPage}
                    {...register('currentPage', { valueAsNumber: true })}
                  />
                  {errors.currentPage && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.currentPage.message as string}
                    </p>
                  )}
                </div>
              </div>

              {/* Avaliação (estrelas) + Status (Select controlado) */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Avaliação com componente visual + campo hidden para RHF */}
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
                    <p className="mt-1 text-sm text-destructive">
                      {errors.rating.message as string}
                    </p>
                  )}
                </div>

                {/* Status com Radix Select + gatilho branco */}
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Status
                  </label>
                  <Controller
                    control={control}
                    name="status"
                    defaultValue="QUERO_LER"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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

              {/* PDF obrigatório (input nativo estilizado com fundo branco) */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Importar PDF (obrigatório)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                  aria-invalid={!pdfFile}
                  className={[
                    'w-full rounded-md border border-input px-3 py-2 text-sm',
                    // fundo SEMPRE branco (mesmo no dark)
                    'bg-white dark:bg-white text-slate-900 placeholder:text-slate-500',
                    // foco acessível
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  ].join(' ')}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Selecione o arquivo do <strong>livro em PDF</strong>. O
                  arquivo será salvo localmente em <code>public/ebooks</code> e
                  ficará disponível para leitura no app.
                </p>
                {!pdfFile && (
                  <p className="mt-1 text-sm text-destructive">
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
                  className={[
                    'w-full rounded-md border border-input px-3 py-2 text-sm',
                    'bg-white dark:bg-white text-slate-900 placeholder:text-slate-500',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  ].join(' ')}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Se enviar uma imagem, ela será salva em{' '}
                  <code>public/covers</code> e usada como capa do livro.
                </p>
              </div>

              {/* ISBN */}
              <div>
                <label className="mb-1 block text-sm font-medium">ISBN</label>
                <Input
                  className={WHITE_FIELD}
                  placeholder="Opcional"
                  aria-invalid={!!errors.isbn}
                  {...register('isbn')}
                />
                {errors.isbn && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.isbn.message as string}
                  </p>
                )}
              </div>

              {/* Sinopse */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Sinopse
                </label>
                <Textarea
                  className={`min-h-28 ${WHITE_FIELD}`}
                  placeholder="Opcional"
                  aria-invalid={!!errors.synopsis}
                  {...register('synopsis')}
                />
                {errors.synopsis && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.synopsis.message as string}
                  </p>
                )}
              </div>

              {/* Notas */}
              <div>
                <label className="mb-1 block text-sm font-medium">Notas</label>
                <Textarea
                  className={`min-h-24 ${WHITE_FIELD}`}
                  placeholder="Opcional"
                  aria-invalid={!!errors.notes}
                  {...register('notes')}
                />
                {errors.notes && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.notes.message as string}
                  </p>
                )}
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={!pdfFile}
                >
                  {isSubmitting ? 'Salvando…' : 'Salvar'}
                </Button>

                <Button asChild variant="outline" type="button">
                  <Link href="/library">Cancelar</Link>
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </main>
  );
}
