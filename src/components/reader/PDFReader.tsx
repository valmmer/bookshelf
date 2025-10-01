// src/components/reader/PDFReader.tsx
'use client';

import * as React from 'react';
import type { Book } from '@/types/book';
import { Progress } from '@/components/ui/progress';
import { useBooks } from '@/store/books';

/* ────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────── */
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

type ReactPDFModule = {
  Document: React.ComponentType<import('react-pdf').DocumentProps>;
  Page: React.ComponentType<import('react-pdf').PageProps>;
  pdfjs: typeof import('react-pdf').pdfjs;
};

type Props = {
  book: Book;
  fileUrl: string;
  initialScale?: number;
  initialPage?: number;
};

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

  const [ReactPDF, setReactPDF] = React.useState<ReactPDFModule | null>(null);
  const [numPages, setNumPages] = React.useState<number | null>(null);
  const [pageNumber, setPageNumber] = React.useState<number>(1);
  const [scale, setScale] = React.useState<number>(initialScale);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isDocLoading, setDocLoading] = React.useState<boolean>(true);
  const [theme, setTheme] = React.useState<ReaderThemeKey>('paper');

  // Coagir ID numérico
  const bookId = React.useMemo(() => {
    const raw = (book as any)?.id;
    const n = typeof raw === 'string' ? Number(raw) : raw;
    return Number.isFinite(n) ? (n as number) : NaN;
  }, [book]);

  if (!Number.isFinite(bookId)) {
    return (
      <div className="grid h-full place-items-center text-sm text-red-600">
        ID do livro inválido. Não foi possível salvar progresso.
      </div>
    );
  }

  const progressKey = React.useMemo(
    () => `reading_progress_${bookId}`,
    [bookId]
  );

  /* Carrega react-pdf + worker */
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const mod = await import('react-pdf');
      const workerUrl = (
        await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
      ).default as string;
      mod.pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
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

  /* Restaura página e tema */
  React.useEffect(() => {
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

    try {
      const savedTheme = localStorage.getItem(
        THEME_STORAGE_KEY
      ) as ReaderThemeKey | null;
      if (savedTheme && READER_THEMES[savedTheme]) setTheme(savedTheme);
    } catch {}
  }, [progressKey, initialPage]);

  /* Autosave com debounce */
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
      if (!Number.isFinite(bookId) || typeof updateBook !== 'function') return;
      updateBook({
        id: bookId,
        currentPage: Math.max(0, pageNumber - 1), // backend espera 0-based
      });
      lastSavedRef.current = pageNumber;
    }, 300);

    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, [pageNumber, progressKey, bookId, updateBook]);

  /* Callbacks PDF */
  const onLoadSuccess = React.useCallback((pdf: { numPages: number }) => {
    setNumPages(pdf.numPages);
    setErrorMsg(null);
    setDocLoading(false);
    setPageNumber((prev) => Math.max(1, Math.min(prev, pdf.numPages)));
  }, []);

  const onLoadError = React.useCallback((err: unknown) => {
    console.error('Não foi possível abrir o PDF:', err);
    setErrorMsg('Não foi possível abrir o PDF. Verifique o arquivo.');
    setDocLoading(false);
  }, []);

  /* Navegação / Zoom */
  const canPrev = pageNumber > 1;
  const canNext = !!numPages && pageNumber < numPages;

  const goPrev = React.useCallback(
    () => setPageNumber((p) => Math.max(1, p - 1)),
    []
  );
  const goNext = React.useCallback(
    () => setPageNumber((p) => (numPages ? Math.min(numPages, p + 1) : p + 1)),
    [numPages]
  );
  const goFirst = React.useCallback(() => setPageNumber(1), []);
  const goLast = React.useCallback(() => {
    if (numPages) setPageNumber(numPages);
  }, [numPages]);
  const zoomOut = React.useCallback(
    () => setScale((s) => Math.max(0.5, Math.round((s - 0.1) * 10) / 10)),
    []
  );
  const zoomIn = React.useCallback(
    () => setScale((s) => Math.min(2.0, Math.round((s + 0.1) * 10) / 10)),
    []
  );

  /* Atalhos */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === '+') zoomIn();
      else if (e.key === '-') zoomOut();
      else if (e.key === 'Home') goFirst();
      else if (e.key === 'End') goLast();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, zoomIn, zoomOut, goFirst, goLast]);

  /* Progresso e tema */
  const pct = React.useMemo(() => {
    if (!numPages || numPages <= 0) return 0;
    return Math.round((pageNumber / numPages) * 100);
  }, [pageNumber, numPages]);

  const themeObj = READER_THEMES[theme];
  const readerStyle: React.CSSProperties = {
    backgroundColor: themeObj.bg,
    color: themeObj.fg,
    borderColor: themeObj.border,
  };

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
    <div className="flex h-full min-h-0 flex-col gap-2">
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
            <span className="text-xs">Tema:</span>
            {(Object.keys(READER_THEMES) as ReaderThemeKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setTheme(k)}
                className={`rounded border px-2 py-1 text-xs ${
                  theme === k ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'
                }`}
              >
                {READER_THEMES[k].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progresso */}
      <div className="flex items-center gap-3">
        <Progress value={pct} className="h-2 flex-1" />
        <span className="w-12 text-right text-xs">{pct}%</span>
      </div>

      {/* Documento */}
      <div
        className="relative flex-1 min-h-0 overflow-auto rounded border"
        style={readerStyle}
      >
        {isDocLoading && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600" />
          </div>
        )}
        <div className="grid min-h-full place-items-center p-3">
          <Document
            file={normalizedFileUrl}
            onLoadSuccess={onLoadSuccess}
            onLoadError={onLoadError}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              className="mx-auto shadow-sm"
            />
          </Document>
          {errorMsg && (
            <div className="mt-2 text-xs text-red-600">{errorMsg}</div>
          )}
        </div>
      </div>
    </div>
  );
}
