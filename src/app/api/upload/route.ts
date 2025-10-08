// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabaseAdmin, SUPABASE_BUCKET } from '@/server/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ----------------------------- helpers ----------------------------- */
function safeBaseName(name: string) {
  return (name || 'file')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s+/g, '-') // espaços -> hífen
    .replace(/[^a-zA-Z0-9._-]/g, '') // chars perigosos
    .slice(0, 80);
}

function extFromMime(mime: string | undefined, fallback = '.bin') {
  const m = (mime || '').toLowerCase();
  if (m === 'application/pdf') return '.pdf';
  if (m === 'image/jpeg') return '.jpg';
  if (m === 'image/png') return '.png';
  if (m === 'image/webp') return '.webp';
  if (m === 'image/gif') return '.gif';
  return fallback;
}

/** Checagem simples da assinatura “%PDF-” */
function looksLikePdf(buf: Buffer) {
  return (
    buf.length >= 5 &&
    buf[0] === 0x25 && // %
    buf[1] === 0x50 && // P
    buf[2] === 0x44 && // D
    buf[3] === 0x46 && // F
    buf[4] === 0x2d //  -
  );
}

/* ------------------------ limites configuráveis -------------------- */
/** Use variáveis públicas (Railway) para controlar limites */
const MAX_PDF_MB = Number(process.env.NEXT_PUBLIC_MAX_PDF_MB ?? 50); // limite global do projeto (Supabase free)
const MAX_IMG_MB = Number(process.env.NEXT_PUBLIC_MAX_IMG_MB ?? 20);

const MAX_PDF_BYTES = MAX_PDF_MB * 1024 * 1024;
const MAX_IMG_BYTES = MAX_IMG_MB * 1024 * 1024;

/* ------------------------------- POST ------------------------------ */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const pdf = form.get('pdf');
    const cover = form.get('cover');

    if (!(pdf instanceof File)) {
      return NextResponse.json(
        { ok: false, error: 'Arquivo PDF é obrigatório (campo "pdf").' },
        { status: 400 }
      );
    }

    // valida PDF
    if (pdf.type && pdf.type !== 'application/pdf') {
      return NextResponse.json(
        { ok: false, error: 'O arquivo enviado não é um PDF válido.' },
        { status: 400 }
      );
    }
    if (typeof pdf.size === 'number' && pdf.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        { ok: false, error: `PDF excede ${MAX_PDF_MB}MB (limite do projeto).` },
        { status: 400 }
      );
    }

    // valida capa (opcional)
    if (cover instanceof File) {
      if (cover.type && !cover.type.startsWith('image/')) {
        return NextResponse.json(
          { ok: false, error: 'A capa deve ser uma imagem.' },
          { status: 400 }
        );
      }
      if (typeof cover.size === 'number' && cover.size > MAX_IMG_BYTES) {
        return NextResponse.json(
          { ok: false, error: `Imagem excede ${MAX_IMG_MB}MB.` },
          { status: 400 }
        );
      }
    }

    const supabase = supabaseAdmin();

    // ---- PDF -> uploads/ebooks/<uuid> ----
    const pdfBuf = Buffer.from(await pdf.arrayBuffer());
    if (!looksLikePdf(pdfBuf)) {
      return NextResponse.json(
        { ok: false, error: 'O arquivo não parece ser um PDF válido.' },
        { status: 400 }
      );
    }

    const pdfKey = `ebooks/${randomUUID()}_${safeBaseName(
      pdf.name || 'livro'
    )}${extFromMime(pdf.type, '.pdf')}`;
    {
      const { error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(pdfKey, pdfBuf, {
          contentType: pdf.type || 'application/pdf',
          upsert: false,
          cacheControl: '31536000', // 1 ano
        });
      if (error) {
        // erro amigável para MIME bloqueado no bucket
        const msg =
          error.message?.toLowerCase().includes('mime type') ||
          error.message?.toLowerCase().includes('not supported')
            ? `O bucket está restringindo tipos de arquivo. Habilite "application/pdf" nas configurações do bucket ou remova a restrição de MIME.`
            : error.message;
        console.error('[upload/pdf] storage error:', error);
        return NextResponse.json({ ok: false, error: msg }, { status: 500 });
      }
    }
    const { data: pdfPub } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(pdfKey);
    const pdfUrl = pdfPub?.publicUrl;

    // ---- CAPA -> uploads/covers/<uuid> ----
    let coverUrl: string | null = null;
    if (cover instanceof File && cover.size > 0) {
      const coverBuf = Buffer.from(await cover.arrayBuffer());
      const coverKey = `covers/${randomUUID()}_${safeBaseName(
        cover.name || 'cover'
      )}${extFromMime(cover.type, '.jpg')}`;
      const { error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(coverKey, coverBuf, {
          contentType: cover.type || 'image/jpeg',
          upsert: false,
          cacheControl: '31536000',
        });
      if (error) {
        console.error('[upload/cover] storage error:', error);
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 }
        );
      }
      const { data: coverPub } = supabase.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(coverKey);
      coverUrl = coverPub?.publicUrl ?? null;
    }

    return NextResponse.json({ ok: true, pdfUrl, coverUrl }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Falha ao processar upload';
    console.error('[api/upload] error:', err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
