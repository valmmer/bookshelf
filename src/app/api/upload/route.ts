// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs'; // garante acesso ao fs local
export const dynamic = 'force-dynamic'; // evita cache desse endpoint

/** Sanitiza o “corpo” do nome (sem caminho) */
function safeBaseName(name: string) {
  const base = path.basename(name || 'file');
  return base
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
    .replace(/\s+/g, '-') // espaços -> hífen
    .replace(/[^a-zA-Z0-9._-]/g, '') // remove chars perigosos
    .slice(0, 80);
}

/** Extensão por MIME (não confia no nome original) */
function extFromMime(mime: string, fallback = '.bin') {
  const m = mime.toLowerCase();
  if (m === 'application/pdf') return '.pdf';
  if (m === 'image/jpeg') return '.jpg';
  if (m === 'image/png') return '.png';
  if (m === 'image/webp') return '.webp';
  if (m === 'image/gif') return '.gif';
  return fallback;
}

async function ensureDir(absPath: string) {
  await fs.mkdir(absPath, { recursive: true });
}

/** Checagem simples de “assinatura mágica” de PDF */
function looksLikePdf(buf: Buffer) {
  // %PDF- (0x25 0x50 0x44 0x46 0x2D)
  return (
    buf.length >= 5 &&
    buf[0] === 0x25 &&
    buf[1] === 0x50 &&
    buf[2] === 0x44 &&
    buf[3] === 0x46 &&
    buf[4] === 0x2d
  );
}

const MAX_PDF_BYTES = 100 * 1024 * 1024; // 100MB
const MAX_IMG_BYTES = 20 * 1024 * 1024; // 20MB

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const pdf = form.get('pdf');
    const cover = form.get('cover');

    if (!(pdf instanceof File)) {
      return NextResponse.json(
        { error: 'Arquivo PDF é obrigatório (campo "pdf").' },
        { status: 400 }
      );
    }

    // ---- Validações de tipo/tamanho (PDF) ----
    if (pdf.type && pdf.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'O arquivo enviado não é um PDF válido.' },
        { status: 400 }
      );
    }
    if (typeof pdf.size === 'number' && pdf.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: `PDF excede ${Math.round(MAX_PDF_BYTES / (1024 * 1024))}MB.` },
        { status: 400 }
      );
    }

    // ---- Validações de capa (opcional) ----
    if (cover instanceof File) {
      if (cover.type && !cover.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'A capa deve ser uma imagem.' },
          { status: 400 }
        );
      }
      if (typeof cover.size === 'number' && cover.size > MAX_IMG_BYTES) {
        return NextResponse.json(
          {
            error: `Imagem excede ${Math.round(
              MAX_IMG_BYTES / (1024 * 1024)
            )}MB.`,
          },
          { status: 400 }
        );
      }
    }

    const root = process.cwd();
    const ebooksDir = path.join(root, 'public', 'ebooks');
    const coversDir = path.join(root, 'public', 'covers');
    await Promise.all([ensureDir(ebooksDir), ensureDir(coversDir)]);

    // ---- Salvar PDF ----
    const pdfBuf = Buffer.from(await pdf.arrayBuffer());

    // checagem de “assinatura” do PDF (mais robusto que confiar no nome)
    if (!looksLikePdf(pdfBuf)) {
      return NextResponse.json(
        { error: 'O arquivo não parece ser um PDF válido.' },
        { status: 400 }
      );
    }

    const pdfExt = extFromMime(pdf.type || 'application/pdf', '.pdf');
    const pdfName = `${safeBaseName(
      pdf.name || 'livro'
    )}-${randomUUID()}${pdfExt}`;
    await fs.writeFile(path.join(ebooksDir, pdfName), pdfBuf);
    const pdfUrl = `/ebooks/${pdfName}`; // URL pública

    // ---- Salvar capa (opcional) ----
    let coverUrl: string | null = null;
    if (cover instanceof File && cover.size > 0) {
      const coverBuf = Buffer.from(await cover.arrayBuffer());
      const coverExt = extFromMime(cover.type || '', '.jpg');
      const coverName = `${safeBaseName(
        cover.name || 'cover'
      )}-${randomUUID()}${coverExt}`;
      await fs.writeFile(path.join(coversDir, coverName), coverBuf);
      coverUrl = `/covers/${coverName}`;
    }

    return NextResponse.json({ pdfUrl, coverUrl }, { status: 200 });
  } catch (err: any) {
    console.error('[api/upload] error:', err);
    return NextResponse.json(
      { error: err?.message || 'Falha ao processar upload' },
      { status: 500 }
    );
  }
}
