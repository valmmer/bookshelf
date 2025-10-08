// src/lib/url.ts
/**
 * Devolve uma URL que o browser possa usar direto.
 * - Se já for absoluta (http/https), retorna como está.
 * - Se começar com "/", mantém relativa ao app.
 * - Do contrário, prefixa com "/".
 */
export function asPublicUrl(u?: string | null): string {
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u; // já é absoluta (Supabase, etc.)
  if (u.startsWith('/')) return u; // já é relativa válida
  return `/${u}`; // normaliza "covers/foo.jpg" -> "/covers/foo.jpg"
}
