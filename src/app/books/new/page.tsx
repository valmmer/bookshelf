// src/app/books/new/page.tsx
'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ReadingStatus } from '@/server/db/types';
import { createBookAction } from '@/app/actions/bookActions';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

type Values = {
  title: string;
  author: string;
  genre: string;
  year?: number | null;
  pages?: number | null;
  currentPage?: number | null; // usado só para calcular a barra de progresso
  status: ReadingStatus;
  rating?: number | null;
  synopsis: string;
  isbn: string;
  notes: string;
};

const INPUT_BASE =
  'w-full rounded-md border bg-white dark:bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2 text-sm';
const LABEL = 'mb-1 block text-xs font-medium text-muted-foreground';

function toIntOrNull(v: FormDataEntryValue | null) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export default function NewBookPage() {
  const router = useRouter();

  // ref direto do <form> (garante HTMLFormElement real no submit)
  const formRef = useRef<HTMLFormElement | null>(null);

  // uploads locais
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

  // estado base só para calcular a barra de progresso (inputs continuam não-controlados)
  const [values, setValues] = useState<Values>({
    title: '',
    author: '',
    genre: '',
    year: null,
    pages: null,
    currentPage: null, // UI mostra 1 por padrão, mas o state só muda se o usuário digitar
    status: 'QUERO_LER',
    rating: null,
    synopsis: '',
    isbn: '',
    notes: '',
  });

  // progresso: conta campos realmente preenchidos (nada preenchido = 0%)
  const completion = useMemo(() => {
    const required = [!!values.title.trim(), !!values.author.trim(), !!pdfFile];

    const optional = [
      !!values.genre.trim(),
      (values.year ?? 0) > 0,
      (values.pages ?? 0) > 0,
      (values.currentPage ?? 0) > 0, // só conta se o usuário mexer
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

      // 1) Upload dos arquivos
      const fd = new FormData();
      fd.append('pdf', pdfFile);
      if (coverFile) fd.append('cover', coverFile);

      const up = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!up.ok) {
        let msg = 'Falha no upload';
        try {
          const j = await up.json();
          msg = j?.error || msg;
        } catch {}
        throw new Error(msg);
      }
      const { pdfUrl, coverUrl }: { pdfUrl: string; coverUrl?: string | null } =
        await up.json();

      // 2) Lê os campos do form
      const data = new FormData(formEl);

      const year = toIntOrNull(data.get('year'));
      const pages = toIntOrNull(data.get('pages'));

      // UI é 1-based; DB é 0-based —> convertemos aqui
      // Ex.: usuário digita 1 → salvamos 0; 10 → 9.
      const currentPageUI = toIntOrNull(data.get('currentPage')); // 1, 2, 3...
      let currentPage =
        currentPageUI == null ? 0 : Math.max(1, currentPageUI) - 1;

      // Corrige limites com base no total de páginas (se informado)
      if (pages != null && pages > 0) {
        // 0 … pages-1
        if (currentPage > pages - 1) currentPage = pages - 1;
        if (currentPage < 0) currentPage = 0;
      }

      // Clamp da avaliação (0..5) caso alguém digite valores fora do range
      let rating = toIntOrNull(data.get('rating'));
      if (rating != null) {
        rating = Math.max(0, Math.min(5, rating));
      }

      // 3) Payload alinhado ao schema/ações do servidor
      const payload = {
        title: String(data.get('title') || '').trim(),
        author: String(data.get('author') || '').trim(),
        status: (data.get('status') || 'QUERO_LER') as ReadingStatus,
        genre: String(data.get('genre') || '').trim(),
        year,
        pages,
        currentPage, // 👈 já convertido para 0-based
        rating,
        synopsis: String(data.get('synopsis') || ''),
        isbn: String(data.get('isbn') || ''),
        notes: String(data.get('notes') || ''),
        cover: coverUrl ?? '',
        fileUrl: pdfUrl, // URL pública devolvida pelo /api/upload
      };

      if (!payload.title) throw new Error('Informe um título.');
      if (!payload.author) throw new Error('Informe o autor.');

      // 4) Criação no servidor
      const res = await createBookAction(payload);
      if (!res.ok) throw new Error(res.error || 'Erro ao salvar');

      // ✅ feedback claro antes do redirect
      toast.success('Livro criado com sucesso!', {
        description: 'Redirecionando para a Biblioteca…',
      });

      // Spinner curto enquanto navegamos
      const loadingId = toast.loading('Abrindo Biblioteca…');

      // dá tempo do usuário perceber o sucesso e o loading
      setTimeout(() => {
        router.push('/library'); // ← vai para a Biblioteca
        router.refresh();
        setTimeout(() => toast.dismiss(loadingId), 300);
      }, 700);
    } catch (err: any) {
      toast.error('Erro ao criar livro', { description: err?.message });
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

      {/* o ref garante que temos um HTMLFormElement real no submit */}
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
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              className={INPUT_BASE}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Selecione o arquivo do livro em PDF.
            </p>
          </div>

          <div>
            <label className={LABEL}>Importar Capa (opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className={INPUT_BASE}
            />
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

            {/* Página atual — 1-based na UI; convertemos para 0-based no submit */}
            <div>
              <label className={LABEL}>Página atual</label>
              <input
                name="currentPage"
                type="number"
                min={1} // 👈 começa em 1 para a pessoa
                placeholder="Ex.: 10"
                defaultValue="1" // 👈 mostra 1 por padrão
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
