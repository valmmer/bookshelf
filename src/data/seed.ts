// src/data/store.ts
// src/data/store.ts
'use client';

import type { Book } from '@/types/book';

const STORAGE_KEY = 'bookshelf:books:v1';

/** Re-hidrata datas e garante um objeto compatível com Book (sem usar `any`). */
function reviveBook(raw: unknown): Book {
  const obj =
    typeof raw === 'object' && raw !== null
      ? (raw as Record<string, unknown>)
      : {};

  const createdAtRaw = obj['createdAt'];
  const createdAt =
    createdAtRaw != null ? new Date(String(createdAtRaw)) : new Date();

  // Dica: se quiser ser ainda mais estrito, valide campos essenciais aqui.
  return { ...(obj as unknown as Book), createdAt };
}

/** Lê todos os livros do localStorage (tolerante a JSON vazio/corrompido). */
function readAll(): Book[] {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return []; // sem seed: retorna vazio

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(reviveBook);
  } catch {
    return []; // corrompido: começa do zero
  }
}

/** Serializa a lista inteira (normaliza createdAt para string ISO se for Date). */
function writeAll(books: Book[]) {
  if (typeof window === 'undefined') return;

  const safe = books.map((b) => ({
    ...b,
    createdAt:
      (b as { createdAt?: unknown }).createdAt instanceof Date
        ? (b as { createdAt: Date }).createdAt.toISOString()
        : (b as { createdAt?: unknown }).createdAt,
  }));

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
}

export const store = {
  list(): Book[] {
    return readAll();
  },

  get(id: string): Book | undefined {
    return readAll().find((b) => b.id === id);
  },

  add(book: Book) {
    const data = readAll();
    data.unshift(book);
    writeAll(data);
  },

  update(id: string, patch: Partial<Book>) {
    const updated = readAll().map((b) =>
      b.id === id ? { ...b, ...patch } : b
    );
    writeAll(updated);
  },

  remove(id: string) {
    const filtered = readAll().filter((b) => b.id !== id);
    writeAll(filtered);
  },

  reset() {
    writeAll([]); // reset = limpa tudo
  },

  replaceAll(books: Book[]) {
    writeAll(books);
  },
};
