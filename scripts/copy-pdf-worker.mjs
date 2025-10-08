// scripts/copy-pdf-worker.mjs
import { mkdir, copyFile } from 'fs/promises';

const src = 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'; // pdfjs v4 usa .mjs
const destDir = 'public';
const dest = `${destDir}/pdf.worker.min.mjs`;

await mkdir(destDir, { recursive: true });
await copyFile(src, dest);

console.log(`[pdfjs] Copiado: ${src} -> ${dest}`);
