// src/components/reader/PDFReader.tsx
'use client';

/**
 * Leitor de PDF com:
 * - navegação anterior/próxima página
 * - zoom (– / 100% / +)
 * - layout responsivo (ajusta à largura do container)
 * - salvamento automático do progresso em `book.currentPage`
 *
 * IMPORTANTE (correção do warning "API version X ≠ Worker version Y"):
 * A linha do worker abaixo busca o pdf.worker.min.mjs da MESMA versão
 * que o `react-pdf` está usando internamente (`pdfjs.version`).
 * Assim, worker e API ficam sempre alinhados.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { Book } from '@/types/book';
import { useBooks } from '@/store/books';

// CSS do texto/anotações (opcional)
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

/* -----------------------------------------------------------
   CONFIGURAÇÃO DO WORKER (SOLUÇÃO A — RECOMENDADA)
   Alinha SEMPRE o worker com a versão da API do pdfjs usada pelo react-pdf.
   Evita o warning: "UnknownErrorException: The API version 'x' does not match the Worker version 'y'".
   Requer internet (baixa do CDN unpkg).
----------------------------------------------------------- */
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/* -----------------------------------------------------------
   Se você quiser SEM CDN (opção B), com tudo local, comente a linha acima
   e DESCOMENTE o bloco abaixo, mas garanta que a versão de `pdfjs-dist`
   instalada no projeto seja a MESMA que o react-pdf usa (ex.: 5.3.93).
   Para isso, remova o pdfjs-dist top-level ou use "overrides" no package.json.

   // pdfjs.GlobalWorkerOptions.workerSrc = new URL(
   //   'pdfjs-dist/build/pdf.worker.min.mjs',
   //   import.meta.url
   // ).toString();

----------------------------------------------------------- */

type Props = {
  /** Livro atual (usado para salvar progresso) */
  book: Book;
  /** Caminho do PDF (ex.: "/ebooks/arquivo.pdf") */
  fileUrl: string;
};

export default function PDFReader({ book, fileUrl }: Props) {
  const { updateBook } = useBooks();

  // Página atual (1-based). Se não houver `currentPage`, começa na 1.
  const [page, setPage] = useState<number>(Math.max(1, book.currentPage ?? 1));
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);

  // Largura responsiva para o <Page />
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  // Observa tamanho do container para ajustar o width do PDF
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) setContainerWidth(w);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Ao carregar o documento com sucesso, define total de páginas
  const onLoadSuccess = useCallback((info: { numPages: number }) => {
    setNumPages(info.numPages);
    // Se `currentPage` estiver fora do limite, clampa
    setPage((p) => Math.max(1, Math.min(p, info.numPages)));
  }, []);

  // Tratamento de erro de carregamento (útil para debug)
  const onLoadError = useCallback((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Erro ao carregar PDF:', err);
  }, []);

  // Debounce para não salvar em cada clique de página (salva após 400ms)
  useEffect(() => {
    const id = setTimeout(() => {
      if (book.currentPage !== page) {
        updateBook({ ...book, currentPage: page });
      }
    }, 400);
    return () => clearTimeout(id);
  }, [page, book, updateBook]);

  // Navegação e zoom
  const canPrev = page > 1;
  const canNext = page < (numPages || Infinity);
  const prev = () => canPrev && setPage((p) => p - 1);
  const next = () => canNext && setPage((p) => p + 1);
  const zoomOut = () => setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(2)));
  const zoomIn = () => setScale((s) => Math.min(2.0, +(s + 0.1).toFixed(2)));
  const fit = () => setScale(1);

  // Limita largura máxima e aplica scale
  const width = useMemo(() => Math.min(1200, containerWidth), [containerWidth]);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={prev}
          disabled={!canPrev}
          className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
        >
          ← Anterior
        </button>
        <button
          onClick={next}
          disabled={!canNext}
          className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Próxima →
        </button>

        <span className="mx-2 text-sm text-slate-600">
          Página {page} {numPages ? `de ${numPages}` : ''}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="rounded border px-3 py-1.5 text-sm"
            title="Diminuir zoom"
          >
            –
          </button>
          <button
            onClick={fit}
            className="rounded border px-3 py-1.5 text-sm"
            title="Resetar zoom (100%)"
          >
            100%
          </button>
          <button
            onClick={zoomIn}
            className="rounded border px-3 py-1.5 text-sm"
            title="Aumentar zoom"
          >
            +
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto rounded-lg border bg-white"
      >
        <div className="mx-auto max-w-full p-3">
          <Document
            file={fileUrl}
            onLoadSuccess={onLoadSuccess}
            onLoadError={onLoadError}
            loading={<LoadingDoc />}
            // error prop opcional: mostra UI custom em caso de erro
            error={<LoadErrorUI />}
            // options: { cMapUrl, cMapPacked, ... } se precisar
          >
            {numPages > 0 && (
              <Page
                pageNumber={page}
                width={Math.round(width * scale)}
                renderTextLayer
                renderAnnotationLayer
                loading={<LoadingPage />}
              />
            )}
          </Document>
        </div>
      </div>
    </div>
  );
}

function LoadingDoc() {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-slate-600">
      Carregando documento…
    </div>
  );
}

function LoadingPage() {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-slate-600">
      Carregando página…
    </div>
  );
}

function LoadErrorUI() {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-red-600">
      Não foi possível abrir o PDF. Verifique o caminho/arquivo.
    </div>
  );
}
