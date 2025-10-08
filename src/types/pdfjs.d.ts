// src/types/pdfjs.d.ts

import type {
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask,
  RenderParameters,
} from 'pdfjs-dist/types/src/display/api';

declare global {
  type PdfDocument = PDFDocumentProxy;
  type PdfPage = PDFPageProxy;
  type PdfRenderTask = RenderTask;
  type PdfRenderParams = RenderParameters;
}
