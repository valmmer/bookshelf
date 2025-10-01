// src/app/books/[id]/read/ReaderClient.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/ToastProvider';
import { updateBookAction } from '@/app/actions/bookActions';

type Props = {
  id: number;
  title?: string | null;
  fileUrl: string;
  pages?: number;
  initialPage?: number; // 1-based
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

function normalizeFileUrl(input: string): string {
  if (!input) return '';
  if (input.startsWith('/')) return input;
  if (input.startsWith('ebooks/')) return '/' + input;
  return '/' + input.replace(/^\/+/, '');
}

function useDebounced<T>(value: T, ms = 120) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function ReaderClient({
  id,
  title,
  fileUrl,
  pages,
  initialPage,
}: Props) {
  const { showToast } = useToast();

  const [numPages, setNumPages] = useState<number>(pages ?? 0);
  const [page, setPage] = useState<number>(() => {
    if (typeof initialPage === 'number' && initialPage >= 1) return initialPage;
    return 1;
  });
  const [scale, setScale] = useState<number>(1.0);
  const debouncedScale = useDebounced(scale, 120);

  const [loadingDoc, setLoadingDoc] = useState(true);
  const [rendering, setRendering] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const loadingTaskRef = useRef<any>(null);

  /** “tick” para disparar o 1º render quando o doc termina de carregar */
  const [docReadyTick, setDocReadyTick] = useState(0);

  const normalizedUrl = useMemo(() => normalizeFileUrl(fileUrl), [fileUrl]);

  // Carregamento do PDF
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!normalizedUrl)
          throw new Error('Caminho do PDF vazio ou inválido.');

        setLoadingDoc(true);

        const pdfjsLib = await import('pdfjs-dist/build/pdf');
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const origin =
          typeof window !== 'undefined' ? window.location.origin + '/' : '/';

        try {
          loadingTaskRef.current?.destroy?.();
        } catch {}
        loadingTaskRef.current = null;

        const loadingTask = (pdfjsLib as any).getDocument({
          url: normalizedUrl,
          baseUrl: origin,
          disableRange: true,
          disableAutoFetch: true,
          disableStream: true,
          cMapUrl: undefined,
          cMapPacked: true,
          standardFontDataUrl: undefined,
          isEvalSupported: true,
          disableFontFace: false,
        });
        loadingTaskRef.current = loadingTask;

        const doc = await loadingTask.promise;
        if (cancelled) return;

        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setPage((prev) => clamp(prev, 1, doc.numPages));

        // garante que o layout já mediu o container antes do 1º render
        requestAnimationFrame(() => setDocReadyTick((t) => t + 1));
      } catch (err: any) {
        const msg = String(err?.message || '');
        const name = String(err?.name || '');
        const isCancel =
          cancelled ||
          name === 'AbortException' ||
          name === 'RenderingCancelledException' ||
          msg.includes('Worker was destroyed') ||
          msg.includes('Loading aborted') ||
          msg.includes('cancelled');

        if (isCancel) {
          console.debug('[ReaderClient] load abortado:', name || msg);
          return;
        }

        console.error('Erro ao abrir PDF:', err);
        showToast({
          title: 'Erro ao carregar PDF',
          message: err?.message ?? 'Não foi possível abrir o documento.',
          variant: 'error',
        });
      } finally {
        if (!cancelled) setLoadingDoc(false);
      }
    })();

    return () => {
      cancelled = true;
      try {
        loadingTaskRef.current?.destroy?.();
      } catch {}
      loadingTaskRef.current = null;
      try {
        renderTaskRef.current?.cancel?.();
      } catch {}
      renderTaskRef.current = null;
      try {
        pdfDocRef.current?.destroy?.();
      } catch {}
      pdfDocRef.current = null;
    };
  }, [normalizedUrl, showToast]);

  // Renderização
  const renderPage = useCallback(async () => {
    const doc = pdfDocRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!doc || !canvas || !container) return;

    // Se o container ainda não tem largura, tenta novamente no próximo frame
    if ((container.clientWidth || 0) === 0) {
      requestAnimationFrame(() => void renderPage());
      return;
    }

    try {
      setRendering(true);

      const pdfPage = await doc.getPage(page);
      const baseVp1 = pdfPage.getViewport({ scale: 1 });

      const cw = Math.max(200, (container.clientWidth || 800) - 16);
      const fitScale = cw / baseVp1.width;
      const finalScale = Math.max(debouncedScale, fitScale);
      const viewport = pdfPage.getViewport({ scale: finalScale });

      const dpr =
        (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
      const outputScale = Math.max(1, Math.min(dpr, 3));

      const displayWidth = Math.floor(viewport.width);
      const displayHeight = Math.floor(viewport.height);

      canvas.width = displayWidth * outputScale;
      canvas.height = displayHeight * outputScale;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      // contexto padrão (alpha: true) + fundo branco manual (evita preto)
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      (ctx as CanvasRenderingContext2D).setTransform(1, 0, 0, 1, 0, 0);
      (ctx as CanvasRenderingContext2D).clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );
      (ctx as CanvasRenderingContext2D).fillStyle = '#ffffff';
      (ctx as CanvasRenderingContext2D).fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Cancela render anterior
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
        try {
          await renderTaskRef.current.promise;
        } catch {}
        renderTaskRef.current = null;
      }

      const task = pdfPage.render({
        canvasContext: ctx as CanvasRenderingContext2D,
        viewport,
        transform: [outputScale, 0, 0, outputScale, 0, 0],
        background: 'rgb(255,255,255)',
      });
      renderTaskRef.current = task;

      try {
        await task.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Erro renderizando página', err);
        }
      } finally {
        if (renderTaskRef.current === task) renderTaskRef.current = null;
        try {
          pdfPage.cleanup?.();
        } catch {}
      }

      // fallback: se por algum motivo o canvas ficou com largura 0, tenta de novo
      if (canvas.width === 0 || displayWidth === 0) {
        setTimeout(() => void renderPage(), 0);
      }
    } catch (err) {
      console.error('Erro renderizando página', err);
    } finally {
      setRendering(false);
    }
  }, [page, debouncedScale, numPages]);

  // Render quando muda page/zoom/numPages
  useEffect(() => {
    void renderPage();
  }, [renderPage]);

  // 1º render assim que o documento estiver pronto
  useEffect(() => {
    if (pdfDocRef.current) void renderPage();
  }, [docReadyTick]);

  // Re-render on resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => void renderPage());
    ro.observe(el);
    return () => ro.disconnect();
  }, [renderPage]);

  // Navegação & zoom
  const goNext = () => setPage((p) => clamp(p + 1, 1, numPages || 1));
  const goPrev = () => setPage((p) => clamp(p - 1, 1, numPages || 1));
  const goFirst = () => setPage(1);
  const goLast = () => setPage(numPages || 1);
  const zoomIn = () =>
    setScale((s) => clamp(Number((s + 0.1).toFixed(2)), 0.5, 4));
  const zoomOut = () =>
    setScale((s) => clamp(Number((s - 0.1).toFixed(2)), 0.5, 4));
  const zoomReset = () => setScale(1.0);

  // Salvar progresso (debounced)
  useEffect(() => {
    if (!pdfDocRef.current) return;
    const t = setTimeout(async () => {
      try {
        const zeroBased = Math.max(0, page - 1);
        await updateBookAction(id, {
          currentPage: zeroBased,
          status: numPages && page >= numPages ? 'LIDO' : 'LENDO',
        });
      } catch (err) {
        console.error('Falha ao salvar progresso', err);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [id, page, numPages]);

  const pageLabel = useMemo(
    () => (numPages ? `${page} / ${numPages}` : `${page}`),
    [page, numPages]
  );

  return (
    <div className="mx-auto max-w-5xl">
      {/* Toolbar */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-medium">{title ?? 'Leitor de PDF'}</div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={goFirst}
            disabled={page <= 1}
          >
            « Início
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={goPrev}
            disabled={page <= 1}
          >
            ← Anterior
          </Button>
          <span className="min-w-[80px] text-center text-sm">
            {loadingDoc ? 'Carregando…' : pageLabel}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={goNext}
            disabled={numPages ? page >= numPages : false}
          >
            Próxima →
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={goLast}
            disabled={!numPages || page >= numPages}
          >
            Fim »
          </Button>
          <div className="ml-3 flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={zoomOut}>
              −
            </Button>
            <Button size="sm" variant="outline" onClick={zoomReset}>
              100%
            </Button>
            <Button size="sm" variant="outline" onClick={zoomIn}>
              +
            </Button>
          </div>
        </div>
      </div>

      {/* Área do canvas */}
      <div
        ref={containerRef}
        className="relative w-full rounded-md border bg-background p-2 min-h-[60vh]"
      >
        {(loadingDoc || (rendering && !loadingDoc)) && (
          <div className="absolute inset-0 grid place-items-center bg-background/60 z-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/50 border-t-transparent" />
              {loadingDoc ? 'Carregando documento…' : 'Renderizando página…'}
            </div>
          </div>
        )}

        {/* bg-white evita “fundo preto” mesmo se o render for cancelado */}
        <canvas ref={canvasRef} className="mx-auto block max-w-full bg-white" />

        <div className="border-t px-3 py-1 text-center text-xs text-muted-foreground">
          {`Página ${pageLabel}`}
        </div>
      </div>
    </div>
  );
}
