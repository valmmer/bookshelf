'use client';

import * as React from 'react';
import type {
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdfjs-dist/types/src/display/api';

/**
 * Carrega pdfjs dinamicamente no client. Evita problemas de SSR e worker.
 */
async function loadPdfjs() {
  const pdfjsLib = await import('pdfjs-dist');
  // Em bundlers modernos normalmente não precisa setar workerSrc manualmente.
  // Se precisar, você pode habilitar algo assim:
  // const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs');
  // (pdfjsLib as any).GlobalWorkerOptions.workerSrc = worker;  // evitar se possível
  return pdfjsLib;
}

type Props = {
  fileUrl?: string | null;
  scale?: number; // default 1.2
  page?: number; // default 1
  className?: string;
};

export default function PDFReader({
  fileUrl,
  scale = 1.2,
  page = 1,
  className,
}: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [pdf, setPdf] = React.useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Carrega documentos quando fileUrl muda
  React.useEffect(() => {
    let alive = true;

    (async () => {
      setError(null);
      setLoading(true);
      setPdf(null);
      setNumPages(0);

      if (!fileUrl) {
        setLoading(false);
        return;
      }

      try {
        const pdfjsLib = await loadPdfjs();
        const task = pdfjsLib.getDocument(fileUrl);
        const loaded: PDFDocumentProxy = await task.promise;

        if (!alive) return;
        setPdf(loaded);
        setNumPages(loaded.numPages);
      } catch (e) {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : 'Falha ao carregar PDF';
        setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [fileUrl]);

  const renderPage = React.useCallback(
    async (doc: PDFDocumentProxy | null, pageNumber: number, s: number) => {
      if (!doc || !canvasRef.current) return;

      const p: PDFPageProxy = await doc.getPage(pageNumber);
      const viewport = p.getViewport({ scale: s });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      await p.render({ canvasContext: ctx, viewport }).promise;
    },
    []
  );

  // Renderiza quando pdf/scale/page mudam
  React.useEffect(() => {
    if (!pdf) return;
    const p = Math.min(Math.max(1, page), numPages || 1);
    void renderPage(pdf, p, scale);
  }, [pdf, page, scale, numPages, renderPage]);

  return (
    <div className={className}>
      {loading && <div>Carregando PDF…</div>}
      {error && <div className="text-red-500">Erro: {error}</div>}
      {!loading && !error && <canvas ref={canvasRef} />}
      {numPages > 1 && (
        <div className="mt-2 text-xs text-muted-foreground">
          Página {Math.min(page, numPages)} de {numPages}
        </div>
      )}
    </div>
  );
}
