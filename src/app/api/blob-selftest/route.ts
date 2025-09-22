import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'edge';

export async function POST() {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'BLOB_READ_WRITE_TOKEN ausente' },
        { status: 500 }
      );
    }

    const id = crypto.randomUUID();
    const content = new Blob([`hello selftest ${new Date().toISOString()}\n`], {
      type: 'text/plain',
    });

    const result = await put(`${id}.txt`, content, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'text/plain',
      token,
    });

    return NextResponse.json({ ok: true, url: result.url });
  } catch (e: any) {
    console.error('Blob selftest error:', e);
    return NextResponse.json(
      { error: 'Selftest falhou', detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
