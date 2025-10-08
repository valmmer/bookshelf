// src/app/books/new/page.tsx
'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ReadingStatus } from '@/server/db/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

type Values = {
  title: string;
  author: string;
  genre: string;
  year?: number | null;
  pages?: number | null;
  currentPage?: number | null; // 1-based na UI; convertemos no submit
  status: ReadingStatus;
  rating?: number | null;
  synopsis: string;
  isbn: string;
  notes: string;
};

const INPUT_BASE =
  'w-full rounded-md border bg-white dark:bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2 text-sm';
const LABEL = 'mb-1 block text-xs font-medium text-muted-foreground';

// limites também no client (alinhados com o server)
const MAX_PDF_MB = Number(process.env.NEXT_PUBLIC_MAX_PDF_MB ?? 50);
const MAX_IMG_MB = Number(process.env.NEXT_PUBLIC_MAX_IMG_MB ?? 20);

function toIntOrNull(v: FormDataEntryValue | null) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export default function NewBookPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // preview da capa
  const coverPreviewUrl = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : undefined),
    [coverFile]
  );
  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  const [submitting, setSubmitting] = useState(false);

  const [values, setValues] = useState<Values>({
    title: '',
    author: '',
    genre: '',
    year: null,
    pages: null,
    currentPage: null,
    status: 'QUERO_LER',
    rating: null,
    synopsis: '',
    isbn: '',
    notes: '',
  });

  const completion = useMemo(() => {
    const required = [!!values.title.trim(), !!values.author.trim(), !!pdfFile];
    const optional = [
      !!values.genre.trim(),
      (values.year ?? 0) > 0,
      (values.pages ?? 0) > 0,
      (values.currentPage ?? 0) > 0,
      (values.rating ?? 0) > 0,
      !!values.synopsis.trim(),
      !!values.isbn.trim(),
      !!values.notes.trim(),
      !!coverFile,
    ];
    const anyFilled = [...required, ...optional].some(Boolean);
    if (!anyFilled) return 0;

    const filled =
      required.filter(Boolean).length + optional.filter(Boolean).length;
    const total = required.length + optional.length;
    return Math.round((filled / total) * 100);
  }, [values, pdfFile, coverFile]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    const formEl = formRef.current;
    if (!formEl) {
      toast.error('Formulário não disponível.');
      return;
    }

    try {
      if (!pdfFile) {
        toast.error('Selecione o PDF do livro (obrigatório).');
        return;
      }

      setSubmitting(true);

      // 1) Upload para /api/upload
      const fd = new FormData();
      fd.append('pdf', pdfFile);
      if (coverFile) fd.append('cover', coverFile);

      const up = await fetch('/api/upload', { method: 'POST', body: fd });
      const upJson = await up.json().catch(() => ({}));
      if (!up.ok || !upJson?.ok) {
        const msg = upJson?.error || `Falha no upload (HTTP ${up.status})`;
        throw new Error(msg);
      }
      const pdfUrl: string = upJson.pdfUrl;
      const coverUrl: string | null | undefined = upJson.coverUrl;

      // 2) Ler campos do form
      const data = new FormData(formEl);

      const year = toIntOrNull(data.get('year'));
      const pages = toIntOrNull(data.get('pages'));

      // UI é 1-based; DB é 0-based — convertemos aqui
      const currentPageUI = toIntOrNull(data.get('currentPage'));
      let currentPage =
        currentPageUI == null ? 0 : Math.max(1, currentPageUI) - 1;
      if (pages != null && pages > 0) {
        if (currentPage > pages - 1) currentPage = pages - 1;
        if (currentPage < 0) currentPage = 0;
      }

      let rating = toIntOrNull(data.get('rating'));
      if (rating != null) rating = Math.max(0, Math.min(5, rating));

      // 3) Payload para a API /api/books
      const payload = {
        title: String(data.get('title') || '').trim(),
        author: String(data.get('author') || '').trim(),
        status: (data.get('status') || 'QUERO_LER') as ReadingStatus,
        genre: String(data.get('genre') || '').trim(),
        year,
        pages,
        currentPage,
        rating,
        synopsis: String(data.get('synopsis') || ''),
        isbn: String(data.get('isbn') || ''),
        notes: String(data.get('notes') || ''),
        cover: coverUrl ?? null,
        fileUrl: pdfUrl,
      };

      if (!payload.title) throw new Error('Informe um título.');
      if (!payload.author) throw new Error('Informe o autor.');

      // 4) Criar livro
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          j?.error || `Falha ao criar livro (HTTP ${res.status})`
        );
      }

      const bookId = j?.book?.id;
      toast.success('Livro criado com sucesso!', {
        description: bookId
          ? `Abrindo /books/${bookId}…`
          : 'Abrindo Biblioteca…',
      });

      if (bookId) {
        router.push(`/books/${bookId}`);
      } else {
        router.push('/library');
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Erro ao criar livro', { description: msg });
      console.error('[books/new] submit error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Novo livro</h1>
        <Link
          href="/library"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
        >
          ← Biblioteca
        </Link>
      </div>

      <div className="mb-4">
        <div className="mb-1 text-sm font-medium">Progresso</div>
        <Progress value={completion} />
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 sm:grid-cols-[auto,1fr]"
      >
        {/* Coluna esquerda: preview + uploads */}
        <div className="space-y-3">
          <div className="w-40 sm:w-48 md:w-56 overflow-hidden rounded-xl border bg-[rgb(var(--card))] shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverPreviewUrl || '/covers/placeholder-cover.jpg'}
              alt="Preview da capa"
              className="block w-full aspect-[3/4] object-cover"
            />
          </div>

          <div>
            <label className={LABEL}>Importar PDF (obrigatório)</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (f) {
                  const sizeMb = f.size / 1024 / 1024;
                  if (sizeMb > MAX_PDF_MB) {
                    toast.error(
                      `O PDF tem ${sizeMb.toFixed(
                        1
                      )}MB; o limite é ${MAX_PDF_MB}MB.`
                    );
                    e.currentTarget.value = '';
                    setPdfFile(null);
                    return;
                  }
                }
                setPdfFile(f);
              }}
              className={INPUT_BASE}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Máx. {MAX_PDF_MB}MB.
            </p>
          </div>

          <div>
            <label className={LABEL}>Importar Capa (opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (f) {
                  const sizeMb = f.size / 1024 / 1024;
                  if (sizeMb > MAX_IMG_MB) {
                    toast.error(
                      `A imagem tem ${sizeMb.toFixed(
                        1
                      )}MB; o limite é ${MAX_IMG_MB}MB.`
                    );
                    e.currentTarget.value = '';
                    setCoverFile(null);
                    return;
                  }
                }
                setCoverFile(f);
              }}
              className={INPUT_BASE}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Máx. {MAX_IMG_MB}MB.
            </p>
          </div>
        </div>

        {/* Coluna direita: campos */}
        <div className="rounded-xl border bg-[rgb(var(--card))] p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={LABEL}>Título *</label>
              <input
                name="title"
                required
                placeholder="Ex.: A Arte da Guerra"
                className={INPUT_BASE}
                onChange={(e) =>
                  setValues((v) => ({ ...v, title: e.target.value }))
                }
              />
            </div>

            <div>
              <label className={LABEL}>Autor *</label>
              <input
                name="author"
                placeholder="Ex.: Sun Tzu"
                className={INPUT_BASE}
                onChange={(e) =>
                  setValues((v) => ({ ...v, author: e.target.value }))
                }
              />
            </div>

            <div>
              <label className={LABEL}>Gênero</label>
              <input
                name="genre"
                placeholder="Ex.: Estratégia"
                className={INPUT_BASE}
                onChange={(e) =>
                  setValues((v) => ({ ...v, genre: e.target.value }))
                }
              />
            </div>

            <div>
              <label className={LABEL}>Ano</label>
              <input
                name="year"
                type="number"
                min={0}
                placeholder="Ex.: 500"
                className={INPUT_BASE}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    year: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            </div>

            <div>
              <label className={LABEL}>Páginas</label>
              <input
                name="pages"
                type="number"
                min={0}
                placeholder="Ex.: 120"
                className={INPUT_BASE}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    pages: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            </div>

            <div>
              <label className={LABEL}>Página atual</label>
              <input
                name="currentPage"
                type="number"
                min={1}
                placeholder="Ex.: 10"
                defaultValue="1"
                className={INPUT_BASE}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    currentPage: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Começa em 1.
              </p>
            </div>

            <div>
              <label className={LABEL}>Status</label>
              <select
                name="status"
                defaultValue="QUERO_LER"
                className={INPUT_BASE}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    status: e.target.value as ReadingStatus,
                  }))
                }
              >
                <option value="QUERO_LER">Quero ler</option>
                <option value="LENDO">Lendo</option>
                <option value="LIDO">Concluído</option>
                <option value="PAUSADO">Pausado</option>
                <option value="ABANDONADO">Abandonado</option>
              </select>
            </div>

            <div>
              <label className={LABEL}>Avaliação (0–5)</label>
              <input
                name="rating"
                type="number"
                min={0}
                max={5}
                placeholder="Ex.: 5"
                className={INPUT_BASE}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    rating: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            </div>

            <div>
              <label className={LABEL}>ISBN</label>
              <input
                name="isbn"
                placeholder="Opcional"
                className={INPUT_BASE}
                onChange={(e) =>
                  setValues((v) => ({ ...v, isbn: e.target.value }))
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className={LABEL}>Sinopse</label>
              <textarea
                name="synopsis"
                rows={4}
                className={INPUT_BASE}
                placeholder="Opcional"
                onChange={(e) =>
                  setValues((v) => ({ ...v, synopsis: e.target.value }))
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className={LABEL}>Notas</label>
              <textarea
                name="notes"
                rows={3}
                className={INPUT_BASE}
                placeholder="Opcional"
                onChange={(e) =>
                  setValues((v) => ({ ...v, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Link
              href="/library"
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Cancelar
            </Link>
            <Button type="submit" disabled={submitting || !pdfFile}>
              {submitting ? 'Salvando…' : 'Criar'}
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
