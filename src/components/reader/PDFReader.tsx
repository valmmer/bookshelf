// src/components/reader/PDFReader.tsx
'use client';

/**
 * Leitor de PDF com react-pdf:
 * - Carrega react-pdf somente no client
 * - Configura o worker via /public/pdf.worker.min.mjs
 * - Evita conflito de tipos entre múltiplas versões de pdfjs-dist
 *   usando um tipo local minimalista + cast via `unknown`
 */

import * as React from 'react';
import type { Book } from '@/types/book';
import { Progress } from '@/components/ui/progress';
import { useBooks } from '@/store/books';

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

function normalizePdfPath(u?: string | null): string | null {
  if (!u) return null;
  const t = u.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('/ebooks/')) return t;
  return `/ebooks/${t.replace(/^\/+/, '')}`;
}

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

/* ──────────────────────────────────────────────────────────────────────────
 * Props e tipos locais (sem depender de pdfjs-dist real)
 * ────────────────────────────────────────────────────────────────────────── */

type Props = {
  book: Book;
  fileUrl: string;
  initialScale?: number;
  initialPage?: number;
};

/** Tipo local: só precisamos de GlobalWorkerOptions.workerSrc */
type PdfJsLike = {
  GlobalWorkerOptions: { workerSrc: string };
};

/** Tipos mínimos do react-pdf que usamos */
type DocumentProps = {
  file: string;
  onLoadSuccess?: (info: { numPages: number }) => void;
  onLoadError?: (err: unknown) => void;
  loading?: React.ReactNode;
  error?: React.ReactNode;
  children?: React.ReactNode;
};

type PageProps = {
  pageNumber: number;
  scale?: number;
  renderAnnotationLayer?: boolean;
  renderTextLayer?: boolean;
  className?: string;
  onRenderSuccess?: () => void;
};

/* ──────────────────────────────────────────────────────────────────────────
 * Componente
 * ────────────────────────────────────────────────────────────────────────── */
export default function PDFReader({
  book,
  fileUrl,
  initialScale = 1.0,
  initialPage,
}: Props) {
  const normalizedFileUrl = React.useMemo(
    () => normalizePdfPath(fileUrl),
    [fileUrl]
  );
  const { updateBook } = useBooks();

  // Guardamos apenas Document/Page; não precisamos carregar `pdfjs` no estado
  const [ReactPDF, setReactPDF] = React.useState<null | {
    Document: React.ComponentType<DocumentProps>;
    Page: React.ComponentType<PageProps>;
  }>(null);

  const [numPages, setNumPages] = React.useState<number | null>(null);
  const [pageNumber, setPageNumber] = React.useState<number>(1);
  const [scale, setScale] = React.useState<number>(initialScale);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isDocLoading, setDocLoading] = React.useState<boolean>(true);
  const [theme, setTheme] = React.useState<ReaderThemeKey>('paper');

  const progressKey = React.useMemo(
    () => `reading_progress_${book.id}`,
    [book.id]
  );

  // Carrega react-pdf no client e configura o worker
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const mod = await import('react-pdf');

      // 👇 EVITA CONFLITO DE TIPOS:
      // `mod.pdfjs` pode vir de uma versão aninhada (node_modules/react-pdf/node_modules/pdfjs-dist)
      // então tipamos como `unknown` e convertemos para o tipo local `PdfJsLike`.
      const pdfjs = mod.pdfjs as unknown as PdfJsLike;
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      if (mounted) {
        setReactPDF({
          Document: mod.Document as React.ComponentType<DocumentProps>,
          Page: mod.Page as React.ComponentType<PageProps>,
        });
      }
    })().catch((err) => {
      console.error('Falha ao carregar react-pdf:', err);
      setErrorMsg('Falha ao inicializar o leitor de PDF.');
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Restaurar página inicial (prop > localStorage) e tema
  React.useEffect(() => {
    let start = 1;
    if (typeof initialPage === 'number' && initialPage > 0) {
      start = initialPage;
    } else {
      try {
        const saved = localStorage.getItem(progressKey);
        if (saved) {
          const n = Number(saved);
          if (Number.isFinite(n) && n > 0) start = n;
        }
      } catch {}
    }
    setPageNumber(start);

    try {
      const savedTheme = localStorage.getItem(
        THEME_STORAGE_KEY
      ) as ReaderThemeKey | null;
      if (savedTheme && READER_THEMES[savedTheme]) setTheme(savedTheme);
    } catch {}
  }, [progressKey, initialPage]);

  // Autosave do progresso (local + store) com debounce
  const lastSavedRef = React.useRef<number>(-1);
  const saveDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  React.useEffect(() => {
    try {
      localStorage.setItem(progressKey, String(pageNumber));
    } catch {}

    if (lastSavedRef.current === pageNumber) return;

    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      updateBook({ id: book.id, currentPage: pageNumber });
      lastSavedRef.current = pageNumber;
    }, 200);

    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, [pageNumber, progressKey, book.id, updateBook]);

  // Callbacks do PDF
  const onLoadSuccess = React.useCallback((pdf: { numPages: number }) => {
    setNumPages(pdf.numPages);
    setErrorMsg(null);
    setDocLoading(false);
    setPageNumber((prev) => Math.max(1, Math.min(prev, pdf.numPages)));
  }, []);

  const onLoadError = React.useCallback((err: unknown) => {
    console.error('Erro ao abrir PDF:', err);
    setErrorMsg('Não foi possível abrir o PDF.');
    setDocLoading(false);
  }, []);

  // Navegação e zoom com deps estáveis
  const canPrev = pageNumber > 1;
  const canNext = numPages ? pageNumber < numPages : false;

  const goPrev = React.useCallback(
    () => canPrev && setPageNumber((p) => p - 1),
    [canPrev]
  );
  const goNext = React.useCallback(
    () => canNext && setPageNumber((p) => p + 1),
    [canNext]
  );
  const goFirst = React.useCallback(() => setPageNumber(1), []);
  const goLast = React.useCallback(
    () => numPages && setPageNumber(numPages),
    [numPages]
  );

  const zoomOut = React.useCallback(
    () => setScale((s) => Math.max(0.5, Math.round((s - 0.1) * 10) / 10)),
    []
  );
  const zoomIn = React.useCallback(
    () => setScale((s) => Math.min(2.0, Math.round((s + 0.1) * 10) / 10)),
    []
  );

  // Atalhos de teclado
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === '+') zoomIn();
      if (e.key === '-') zoomOut();
      if (e.key === 'Home') goFirst();
      if (e.key === 'End') goLast();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, zoomIn, zoomOut, goFirst, goLast]);

  // Progresso e tema
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

  // Placeholders
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

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            disabled={!canPrev}
            className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            ← Anterior
          </button>
          <button
            onClick={goNext}
            disabled={!canNext}
            className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Próxima →
          </button>
          <span className="ml-1 text-sm">
            Página {pageNumber}
            {numPages ? ` / ${numPages}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="rounded border px-2 py-1.5 text-sm"
          >
            −
          </button>
          <span className="w-12 text-center text-sm">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="rounded border px-2 py-1.5 text-sm"
          >
            +
          </button>

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
                  aria-pressed={active}
                  title={t.label}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="flex items-center gap-3">
        <Progress value={pct} className="h-2 flex-1" />
        <span className="w-12 text-right text-xs text-slate-600">{pct}%</span>
      </div>

      {/* Área do documento */}
      <div
        className="relative flex-1 overflow-auto rounded border"
        style={readerStyle}
      >
        {isDocLoading && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600" />
          </div>
        )}

        <div className="grid min-h-full place-items-center p-3">
          <Document
            file={normalizedFileUrl}
            onLoadSuccess={onLoadSuccess}
            onLoadError={onLoadError}
            loading={
              <div className="p-6 text-sm opacity-80">Carregando PDF…</div>
            }
            error={
              <div className="p-6 text-sm text-red-600">
                {errorMsg ?? 'Erro ao carregar PDF.'}
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
