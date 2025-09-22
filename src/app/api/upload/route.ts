// src/app/api/upload/route.ts
// Versão LOCAL: salva arquivos no disco (public/ebooks e public/covers)
// ✔ Funciona em dev/local (Node runtime). Não persiste na Vercel.
// ⚠ Se for usar em produção, precisa de servidor com disco persistente.

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Precisa do runtime Node para usar 'fs'
export const runtime = 'nodejs';

// Mapeia MIME -> extensão segura
function extFromMime(mime?: string | null): string {
  if (!mime) return '';
  const m = mime.toLowerCase();
  if (m.includes('pdf')) return '.pdf';
  if (m.includes('png')) return '.png';
  if (m.includes('jpeg') || m.includes('jpg')) return '.jpg';
  if (m.includes('webp')) return '.webp';
  if (m.includes('gif')) return '.gif';
  if (m.includes('svg')) return '.svg';
  return '';
}

// Sanitiza nome (só letras/números/._-), limita tamanho
function safeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Form inválido: multipart/form-data requerido' },
        { status: 400 }
      );
    }

    const form = await req.formData();
    const pdf = form.get('pdf') as File | null;
    const cover = form.get('cover') as File | null;

    if (!pdf) {
      return NextResponse.json({ error: 'PDF é obrigatório' }, { status: 400 });
    }
    if (!pdf.type?.includes('pdf')) {
      return NextResponse.json(
        { error: 'Arquivo deve ser PDF' },
        { status: 400 }
      );
    }
    if (pdf.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'PDF até 50MB' }, { status: 413 });
    }
    if (cover && !cover.type?.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Capa inválida (deve ser image/*)' },
        { status: 400 }
      );
    }

    // Pastas destino
    const publicDir = path.join(process.cwd(), 'public');
    const ebooksDir = path.join(publicDir, 'ebooks');
    const coversDir = path.join(publicDir, 'covers');

    // Garante que as pastas existam
    await fs.mkdir(ebooksDir, { recursive: true });
    await fs.mkdir(coversDir, { recursive: true });

    // Nomeia arquivos de forma única
    const id = crypto.randomUUID();

    // ----- salva PDF -----
    const pdfExt =
      path.extname((pdf as any).name || '') || extFromMime(pdf.type) || '.pdf';
    const pdfFilename = safeName(`${id}${pdfExt}`);
    const pdfPath = path.join(ebooksDir, pdfFilename);

    const pdfBuffer = Buffer.from(await pdf.arrayBuffer());
    await fs.writeFile(pdfPath, pdfBuffer);

    const pdfUrl = `/ebooks/${pdfFilename}`; // acessível via Next static

    // ----- salva capa (opcional) -----
    let coverUrl: string | null = null;
    if (cover) {
      const coverExt =
        path.extname((cover as any).name || '') ||
        extFromMime(cover.type) ||
        '.jpg';
      const coverFilename = safeName(`${id}${coverExt}`);
      const coverPath = path.join(coversDir, coverFilename);

      const coverBuffer = Buffer.from(await cover.arrayBuffer());
      await fs.writeFile(coverPath, coverBuffer);

      coverUrl = `/covers/${coverFilename}`;
    }

    return NextResponse.json({ id, pdfUrl, coverUrl });
  } catch (err: any) {
    console.error('Upload LOCAL error:', err);
    return NextResponse.json(
      {
        error: 'Erro interno ao salvar localmente',
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
