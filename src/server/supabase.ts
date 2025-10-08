// src/server/supabase.ts
import { createClient } from '@supabase/supabase-js';

export function supabaseAdmin() {
  // usar ['VAR'] evita substituição estática do bundler
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE'];

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL not set');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE not set');

  return createClient(url, key, { auth: { persistSession: false } });
}

export const SUPABASE_BUCKET = process.env['SUPABASE_BUCKET'] || 'uploads';
