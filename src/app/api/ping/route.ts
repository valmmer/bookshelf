import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    blob: process.env.BLOB_READ_WRITE_TOKEN ? 'ok' : 'missing',
    admin: process.env.ADMIN_TOKEN ? 'ok' : 'missing',
  });
}
