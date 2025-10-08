// src/app/actions/bookActions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import { redirect } from 'next/navigation';

import {
  createBook,
  updateBook,
  deleteBook,
  getBook,
  upsertGenreByName,
} from '@/server/db/books';

import type { ReadingStatus } from '@/server/db/types';
import type { BookFormValues } from '@/features/books/schema';
import { bookFormSchema } from '@/features/books/schema';

// 🔹 NOVO: para apagar arquivos no Supabase quando deletar livro
import { supabaseAdmin, SUPABASE_BUCKET } from '@/server/supabase';

/* ────────────────────────────────
 * Tipos auxiliares de resultado
 * ──────────────────────────────── */
type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string };
type Result<T> = Ok<T> | Err;

const ok = <T>(data: T): Ok<T> => ({ ok: true, data });
const err = (message: string): Err => ({ ok: false, error: message });

/* ────────────────────────────────
 * Helpers
 * ──────────────────────────────── */
function toIntOrNull(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function emptyToNullStr(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function toReadingStatus(v: unknown): ReadingStatus {
  const set = new Set<ReadingStatus>([
    'QUERO_LER',
    'LENDO',
    'LIDO',
    'PAUSADO',
    'ABANDONADO',
  ]);
  const s = String(v);
  return set.has(s as ReadingStatus) ? (s as ReadingStatus) : 'QUERO_LER';
}

/** 🔹 NOVO: extrai a "key" do objeto no storage a partir da URL pública */
function supabaseKeyFromPublicUrl(url?: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
  if (!base || !url) return null;
  const prefix = `${base}/storage/v1/object/public/${SUPABASE_BUCKET}/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length); // ex.: "ebooks/abc.pdf" | "covers/img.jpg"
}

/* Helpers para Server Actions baseadas em <form action> */
const fdStr = (fd: FormData, key: string): string | undefined => {
  const v = fd.get(key);
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === '' ? '' : s; // string vazia pode significar "limpar"
};
const fdInt = (fd: FormData, key: string): number | null | undefined => {
  if (!fd.has(key)) return undefined; // campo ausente => não altera
  const v = fd.get(key);
  if (v == null || v === '') return null; // presente porém vazio => null
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

/* ────────────────────────────────
 * Normalizadores
 * ──────────────────────────────── */
async function normalizeCreate(values: unknown) {
  const data = bookFormSchema.parse(values) as BookFormValues;
  const genreId = await upsertGenreByName(data.genre);

  return {
    title: data.title,
    author: data.author,
    year: toIntOrNull(data.year),
    pages: toIntOrNull(data.pages) ?? 0,
    rating: toIntOrNull(data.rating),
    synopsis: emptyToNullStr(data.synopsis),
    cover: emptyToNullStr(data.cover),
    fileUrl: emptyToNullStr(data.fileUrl),
    status: toReadingStatus(data.status ?? 'QUERO_LER'),
    currentPage: toIntOrNull(data.currentPage) ?? 0,
    isbn: emptyToNullStr(data.isbn),
    notes: emptyToNullStr(data.notes),
    // se não existir gênero válido, não envia (evita 0/NaN)
    genreId: genreId ?? undefined,
  };
}

async function normalizeUpdate(values: Partial<BookFormValues>) {
  const partial = bookFormSchema.partial();
  const data = partial.parse(values) as Partial<BookFormValues>;

  let genreId: number | null | undefined = undefined;
  if ('genre' in data) {
    const g = emptyToNullStr(data.genre);
    genreId = g ? await upsertGenreByName(g) : null;
  }

  return {
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.author !== undefined ? { author: data.author } : {}),
    ...(data.year !== undefined ? { year: toIntOrNull(data.year) } : {}),
    ...(data.pages !== undefined
      ? { pages: toIntOrNull(data.pages) ?? 0 }
      : {}),
    ...(data.rating !== undefined ? { rating: toIntOrNull(data.rating) } : {}),
    ...(data.synopsis !== undefined
      ? { synopsis: emptyToNullStr(data.synopsis) }
      : {}),
    ...(data.cover !== undefined ? { cover: emptyToNullStr(data.cover) } : {}),
    ...(data.fileUrl !== undefined
      ? { fileUrl: emptyToNullStr(data.fileUrl) }
      : {}),
    ...(data.status !== undefined
      ? { status: toReadingStatus(data.status) }
      : {}),
    ...(data.currentPage !== undefined
      ? { currentPage: toIntOrNull(data.currentPage) ?? 0 }
      : {}),
    ...(data.isbn !== undefined ? { isbn: emptyToNullStr(data.isbn) } : {}),
    ...(data.notes !== undefined ? { notes: emptyToNullStr(data.notes) } : {}),
    ...(genreId !== undefined ? { genreId } : {}),
  };
}

/* ────────────────────────────────
 * Ações principais
 * ──────────────────────────────── */
export async function createBookAction(
  values: unknown
): Promise<Result<{ id: number }>> {
  try {
    const input = await normalizeCreate(values);
    const created = await createBook(input);

    revalidatePath('/');
    revalidatePath('/library');
    revalidatePath(`/books/${created.id}`);

    return ok({ id: created.id });
  } catch (e: unknown) {
    console.error('[createBookAction] erro:', e);
    const msg =
      e instanceof ZodError
        ? e.issues.map((x) => x.message).join('; ')
        : e instanceof Error
        ? e.message
        : 'Falha ao criar livro';
    return err(msg);
  }
}

export async function updateBookAction(
  id: number,
  patch: Partial<BookFormValues>
): Promise<Result<{ id: number }>> {
  try {
    const exists = await getBook(id);
    if (!exists) return err('Livro não encontrado');

    const input = await normalizeUpdate(patch);
    const updated = await updateBook(id, input);

    revalidatePath('/library');
    revalidatePath(`/books/${id}`);
    revalidatePath(`/books/${id}/read`);

    return ok({ id: updated.id });
  } catch (e: unknown) {
    console.error('[updateBookAction] erro:', e);
    const msg =
      e instanceof ZodError
        ? e.issues.map((x) => x.message).join('; ')
        : e instanceof Error
        ? e.message
        : 'Falha ao atualizar livro';
    return err(msg);
  }
}

export async function deleteBookAction(
  id: number
): Promise<Result<{ id: number }>> {
  try {
    const exists = await getBook(id);
    if (!exists) return err('Livro não encontrado');

    // guardo URLs para tentar remover do storage depois
    const fileUrl = exists.fileUrl ?? null;
    const coverUrl = (exists as any).cover ?? null; // se seu DTO tiver cover

    // 1) Deleta no banco
    const deleted = await deleteBook(id);

    // 2) Tenta remover PDF/capa do Supabase (não bloqueia o sucesso)
    try {
      const keys: string[] = [];
      const kPdf = supabaseKeyFromPublicUrl(fileUrl);
      const kCover = supabaseKeyFromPublicUrl(coverUrl);
      if (kPdf) keys.push(kPdf);
      if (kCover) keys.push(kCover);

      if (keys.length) {
        const supa = supabaseAdmin();
        const { error } = await supa.storage.from(SUPABASE_BUCKET).remove(keys);
        if (error)
          console.warn('[deleteBookAction] remove storage:', error.message);
      }
    } catch (e) {
      console.warn('[deleteBookAction] Falha ao remover do storage:', e);
    }

    // 3) Revalida páginas
    revalidatePath('/library');
    revalidatePath('/');
    revalidatePath(`/books/${id}`);

    return ok({ id: deleted.id });
  } catch (e: unknown) {
    console.error('[deleteBookAction] erro:', e);
    const msg = e instanceof Error ? e.message : 'Falha ao excluir livro';
    return err(msg);
  }
}

/* ────────────────────────────────
 * Ações extras
 * ──────────────────────────────── */
export async function markStatusAction(
  id: number,
  status: ReadingStatus
): Promise<Result<{ id: number }>> {
  return updateBookAction(id, { status });
}

export async function rateBookAction(
  id: number,
  rating: number
): Promise<Result<{ id: number }>> {
  return updateBookAction(id, { rating });
}

export async function duplicateBookAction(
  id: number
): Promise<Result<{ id: number }>> {
  try {
    const book = await getBook(id);
    if (!book) return err('Livro original não encontrado');

    const cloneInput = {
      title: `${book.title ?? 'Sem título'} (cópia)`,
      author: book.author ?? null,
      year: book.year ?? null,
      pages: typeof book.pages === 'number' ? book.pages : 0,
      rating: book.rating ?? null,
      synopsis: (book as any).synopsis ?? null,
      cover: (book as any).cover ?? null,
      fileUrl: book.fileUrl ?? null,
      currentPage: 0,
      status: 'QUERO_LER' as ReadingStatus,
      isbn: book.isbn ?? null,
      notes: book.notes ?? null,
      genreId: (book as any).genreId ?? (book as any).genre?.id ?? undefined,
    };

    const created = await createBook(cloneInput);

    revalidatePath('/library');
    revalidatePath(`/books/${created.id}`);

    return ok({ id: created.id });
  } catch (e: unknown) {
    console.error('[duplicateBookAction] erro:', e);
    const msg = e instanceof Error ? e.message : 'Falha ao duplicar livro';
    return err(msg);
  }
}

/* ────────────────────────────────
 * Server Actions para uso com <form action={...}>
 * ──────────────────────────────── */

/** Criação via <form action> */
export async function createBookFormAction(formData: FormData) {
  'use server';

  const payload: Partial<BookFormValues> = {
    title: fdStr(formData, 'title') ?? '',
    author: fdStr(formData, 'author') ?? '',
    status: (fdStr(formData, 'status') ?? 'QUERO_LER') as ReadingStatus,
    genre: fdStr(formData, 'genre') ?? '',
    year: fdInt(formData, 'year') ?? undefined,
    pages: fdInt(formData, 'pages') ?? undefined,
    currentPage: fdInt(formData, 'currentPage') ?? 0,
    rating: fdInt(formData, 'rating') ?? undefined,
    synopsis: fdStr(formData, 'synopsis') ?? '',
    isbn: fdStr(formData, 'isbn') ?? '',
    notes: fdStr(formData, 'notes') ?? '',
    cover: fdStr(formData, 'cover') ?? '',
    fileUrl: fdStr(formData, 'fileUrl') ?? '',
  };

  const res = await createBookAction(payload);
  if (res.ok) {
    redirect(`/books/${res.data.id}`);
  }
  throw new Error(res.error || 'Falha ao criar livro');
}

/** Edição via <form action> (bookId bind por closure na página) */
export async function updateBookFormAction(bookId: number, formData: FormData) {
  'use server';

  const patch: Partial<BookFormValues> = {
    ...(formData.has('title') ? { title: fdStr(formData, 'title') ?? '' } : {}),
    ...(formData.has('author')
      ? { author: fdStr(formData, 'author') ?? '' }
      : {}),
    ...(formData.has('status')
      ? { status: toReadingStatus(fdStr(formData, 'status')) }
      : {}),
    ...(formData.has('genre') ? { genre: fdStr(formData, 'genre') ?? '' } : {}),
    ...(formData.has('year')
      ? { year: fdInt(formData, 'year') ?? undefined }
      : {}),
    ...(formData.has('pages')
      ? { pages: fdInt(formData, 'pages') ?? undefined }
      : {}),
    ...(formData.has('currentPage')
      ? { currentPage: fdInt(formData, 'currentPage') ?? 0 }
      : {}),
    ...(formData.has('rating')
      ? { rating: fdInt(formData, 'rating') ?? undefined }
      : {}),
    ...(formData.has('synopsis')
      ? { synopsis: fdStr(formData, 'synopsis') ?? '' }
      : {}),
    ...(formData.has('isbn') ? { isbn: fdStr(formData, 'isbn') ?? '' } : {}),
    ...(formData.has('notes') ? { notes: fdStr(formData, 'notes') ?? '' } : {}),
    ...(formData.has('cover') ? { cover: fdStr(formData, 'cover') ?? '' } : {}),
    ...(formData.has('fileUrl')
      ? { fileUrl: fdStr(formData, 'fileUrl') ?? '' }
      : {}),
  };

  const res = await updateBookAction(bookId, patch);
  if (res.ok) {
    redirect(`/books/${bookId}`);
  }
  throw new Error(res.error || 'Falha ao salvar alterações');
}
