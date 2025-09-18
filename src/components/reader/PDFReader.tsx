// src/components/reader/PDFReader.tsx
'use client';

import * as React from 'react';
import type { Book } from '@/types/book';
import { Progress } from '@/components/ui/progress';
import { useBooks } from '@/store/books';

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────────────────────── */

/** Normaliza a URL do PDF:
 * - http/https → mantém
 * - caminho começando com /ebooks/ → mantém
 * - nome relativo → prefixa /ebooks/
 */
function normalizePdfPath(u?: string | null): string | null {
  if (!u) return null;
  const t = u.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('/ebooks/')) return t;
  return `/ebooks/${t.replace(/^\/+/, '')}`;
}

/** Temas de leitura com foco em contraste/acessibilidade */
const READER_THEMES = {
  paper: { label: 'Paper', bg: '#FFFFFF', fg: '#111827', border: '#E5E7EB' },
  cream: { label: 'Creme', bg: '#FFFBE6', fg: '#1F2937', border: '#E6E1C5' },
  sepia: { label: 'Sépia', bg: '#F6F0E6', fg: '#1F2937', border: '#E3D8C7' },
  dark: { label: 'Escuro', bg: '#0B1020', fg: '#E5E7EB', border: '#1F2937' },
  hc: {
    label: 'Alto contraste',
    bg: '#000000',
    fg: '#FFFFFF',
    border: '#FFFFFF',
  },
} as const;
type ReaderThemeKey = keyof typeof READER_THEMES;

const THEME_STORAGE_KEY = 'reader_theme';

type Props = {
  /** Livro atual (usado para salvar progresso) */
  book: Book;

  /** Caminho do PDF (relativo ou absoluto) */
  fileUrl: string;

  /** Zoom inicial (1.0 = 100%) */
  initialScale?: number;

  /** Página inicial 1-based (opcional). Se fornecida, tem prioridade. */
  initialPage?: number;
};

export default function PDFReader({
  book,
  fileUrl,
  initialScale = 1.0,
  initialPage, // 👈 agora aceitamos a prop
}: Props) {
  /* ──────────────────────────────────────────────────────────────────────────
   * Estado/Contexto
   * ────────────────────────────────────────────────────────────────────────── */
  const normalizedFileUrl = React.useMemo(
    () => normalizePdfPath(fileUrl),
    [fileUrl]
  );

  // ⚠️ Pegue APENAS a função estável do store — evita loops.
  const { updateBook } = useBooks();

  // Carrega react-pdf só no cliente (evita SSR/DOMMatrix)
  const [ReactPDF, setReactPDF] = React.useState<null | {
    Document: any;
    Page: any;
    pdfjs: any;
  }>(null);

  const [numPages, setNumPages] = React.useState<number | null>(null);
  const [pageNumber, setPageNumber] = React.useState<number>(1); // 1-based
  const [scale, setScale] = React.useState<number>(initialScale);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isDocLoading, setDocLoading] = React.useState<boolean>(true);

  const [theme, setTheme] = React.useState<ReaderThemeKey>('paper');

  // Chave de persistência local (fallback)
  const progressKey = React.useMemo(
    () => `reading_progress_${book.id}`,
    [book.id]
  );

  /* ──────────────────────────────────────────────────────────────────────────
   * Carregar react-pdf no client + configurar worker local
   * ────────────────────────────────────────────────────────────────────────── */
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const mod = await import('react-pdf'); // lazy-client-only
      mod.pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'; // worker em /public
      if (mounted)
        setReactPDF({
          Document: mod.Document,
          Page: mod.Page,
          pdfjs: mod.pdfjs,
        });
    })().catch((err) => {
      console.error('Falha ao carregar react-pdf:', err);
      setErrorMsg('Falha ao inicializar o leitor de PDF.');
    });
    return () => {
      mounted = false;
    };
  }, []);

  /* ──────────────────────────────────────────────────────────────────────────
   * Restaurar último tema e página salvos (prioridade: initialPage > localStorage)
   * ────────────────────────────────────────────────────────────────────────── */
  React.useEffect(() => {
    // define página inicial com prioridade para a prop initialPage (se válida)
    let start = 1;
    if (typeof initialPage === 'number' && initialPage > 0) {
      start = initialPage;
    } else {
      try {
        const savedPage = localStorage.getItem(progressKey);
        if (savedPage) {
          const n = Number(savedPage);
          if (Number.isFinite(n) && n > 0) start = n;
        }
      } catch {}
    }
    setPageNumber(start);

    // tema salvo
    try {
      const savedTheme = localStorage.getItem(
        THEME_STORAGE_KEY
      ) as ReaderThemeKey | null;
      if (savedTheme && READER_THEMES[savedTheme]) setTheme(savedTheme);
    } catch {
      /* ignore */
    }
  }, [progressKey, initialPage]);

  /* ──────────────────────────────────────────────────────────────────────────
   * Autosave do progresso — deps estáveis + debounce
   * ────────────────────────────────────────────────────────────────────────── */
  const lastSavedRef = React.useRef<number>(-1);
  const saveDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  React.useEffect(() => {
    // 1) salva localmente rápido
    try {
      localStorage.setItem(progressKey, String(pageNumber));
    } catch {}

    // 2) evita re-disparar se for o mesmo valor
    if (lastSavedRef.current === pageNumber) return;

    // 3) debounce para reduzir writes
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      if (!book.id || typeof updateBook !== 'function') return;
      updateBook({
        id: book.id,
        currentPage: pageNumber,
        // se quiser promover status automaticamente:
        // status: book.status === 'QUERO_LER' ? 'LENDO' : book.status,
      });
      lastSavedRef.current = pageNumber;
    }, 200);

    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, [pageNumber, progressKey, book.id, updateBook]);

  /* ──────────────────────────────────────────────────────────────────────────
   * Callbacks do PDF
   * ────────────────────────────────────────────────────────────────────────── */
  const onLoadSuccess = React.useCallback((pdf: { numPages: number }) => {
    setNumPages(pdf.numPages);
    setErrorMsg(null);
    setDocLoading(false);

    // clamp da página atual ao total
    setPageNumber((prev) => Math.max(1, Math.min(prev, pdf.numPages)));
  }, []);

  const onLoadError = React.useCallback((err: unknown) => {
    console.error('Não foi possível abrir o PDF:', err);
    setErrorMsg('Não foi possível abrir o PDF. Verifique o caminho/arquivo.');
    setDocLoading(false);
  }, []);

  /* ──────────────────────────────────────────────────────────────────────────
   * Navegação/Zoom/Atalhos
   * ────────────────────────────────────────────────────────────────────────── */
  const canPrev = pageNumber > 1;
  const canNext = numPages ? pageNumber < numPages : false;

  const goPrev = () => canPrev && setPageNumber((p) => p - 1);
  const goNext = () => canNext && setPageNumber((p) => p + 1);
  const goFirst = () => setPageNumber(1);
  const goLast = () => numPages && setPageNumber(numPages);

  const zoomOut = () =>
    setScale((s) => Math.max(0.5, Math.round((s - 0.1) * 10) / 10));
  const zoomIn = () =>
    setScale((s) => Math.min(2.0, Math.round((s + 0.1) * 10) / 10));

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === '+') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goFirst();
      } else if (e.key === 'End') {
        e.preventDefault();
        goLast();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, zoomIn, zoomOut, goFirst, goLast]);

  /* ──────────────────────────────────────────────────────────────────────────
   * Progresso e tema
   * ────────────────────────────────────────────────────────────────────────── */
  const pct = React.useMemo(() => {
    if (!numPages || numPages <= 0) return 0;
    return Math.min(
      100,
      Math.max(0, Math.round((pageNumber / numPages) * 100))
    );
  }, [pageNumber, numPages]);

  const themeObj = READER_THEMES[theme];
  const readerStyle: React.CSSProperties = {
    backgroundColor: themeObj.bg,
    color: themeObj.fg,
    borderColor: themeObj.border,
  };

  function handleThemeChange(k: ReaderThemeKey) {
    setTheme(k);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, k);
    } catch {}
  }

  /* ──────────────────────────────────────────────────────────────────────────
   * Placeholders / erros
   * ────────────────────────────────────────────────────────────────────────── */
  if (!ReactPDF) {
    return (
      <div className="grid h-full place-items-center text-sm text-slate-500">
        Preparando leitor…
      </div>
    );
  }
  if (!normalizedFileUrl) {
    return (
      <div className="grid h-full place-items-center text-sm text-red-600">
        Caminho do PDF ausente.
      </div>
    );
  }

  const { Document, Page } = ReactPDF;

  /* ──────────────────────────────────────────────────────────────────────────
   * UI
   * ────────────────────────────────────────────────────────────────────────── */
  return (
    <div className="flex h-full flex-col gap-2">
      {/* Toolbar: navegação | zoom | tema */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Navegação */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={goPrev}
            disabled={!canPrev}
            className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
            aria-label="Página anterior (←)"
            title="Página anterior (←)"
          >
            ← Anterior
          </button>
          <button
            onClick={goNext}
            disabled={!canNext}
            className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
            aria-label="Próxima página (→)"
            title="Próxima página (→)"
          >
            Próxima →
          </button>

          <span className="ml-1 text-sm">
            Página {pageNumber}
            {numPages ? ` / ${numPages}` : ''}
          </span>
        </div>

        {/* Zoom + Tema */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              className="rounded border px-2 py-1.5 text-sm"
              title="Diminuir zoom (-)"
            >
              −
            </button>
            <span className="w-12 text-center text-sm">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="rounded border px-2 py-1.5 text-sm"
              title="Aumentar zoom (+)"
            >
              +
            </button>
          </div>

          <div className="ml-3 flex items-center gap-1">
            <span className="text-xs text-slate-600">Tema:</span>
            {(Object.keys(READER_THEMES) as ReaderThemeKey[]).map((k) => {
              const t = READER_THEMES[k];
              const active = theme === k;
              return (
                <button
                  key={k}
                  onClick={() => handleThemeChange(k)}
                  className={`rounded border px-2 py-1 text-xs transition ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'hover:bg-slate-50'
                  }`}
                  title={t.label}
                  aria-pressed={active}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progresso */}
      <div className="flex items-center gap-3">
        <Progress value={pct} className="h-2 flex-1" />
        <span className="w-12 text-right text-xs text-slate-600">{pct}%</span>
      </div>

      {/* Área do documento (centralizada e tematizada) */}
      <div
        className="relative flex-1 overflow-auto rounded border"
        style={readerStyle}
      >
        {isDocLoading && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600" />
          </div>
        )}

        <div className="grid min-h-full place-items-center p-3">
          <Document
            file={normalizedFileUrl}
            onLoadSuccess={onLoadSuccess}
            onLoadError={onLoadError}
            loading={
              <div className="p-6 text-center text-sm opacity-80">
                Carregando PDF…
              </div>
            }
            error={
              <div className="p-6 text-center text-sm text-red-600">
                {errorMsg}
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              className="mx-auto shadow-sm"
              onRenderSuccess={() => setDocLoading(false)}
            />
          </Document>

          {errorMsg && (
            <div className="mt-2 text-center text-xs text-red-600">
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
