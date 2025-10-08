// src/app/api/ping/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const role = process.env['SUPABASE_SERVICE_ROLE'];
  const bucket = process.env['SUPABASE_BUCKET'];
  return NextResponse.json({
    blob: url ? 'ok' : 'missing',
    admin: role ? 'ok' : 'missing',
    bucket: bucket || null,
    // para inspecionar se as chaves existem SEM mostrar valores
    seenKeys: Object.keys(process.env).filter(
      (k) => k.includes('SUPABASE') || k.includes('NEXT_PUBLIC')
    ),
  });
}
