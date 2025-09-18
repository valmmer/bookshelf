// src/data/store.ts
'use client';

import type { Book } from '@/types/book';

const STORAGE_KEY = 'bookshelf:books:v1';

/** Converte um objeto cru (do JSON) para o tipo Book, re-hidratando o Date. */
function reviveBook(raw: any): Book {
  return {
    ...raw,
    createdAt: raw?.createdAt ? new Date(raw.createdAt) : new Date(),
  };
}

/** Lê todos os livros do localStorage. */
function readAll(): Book[] {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return []; // 👉 Sem seed, apenas retorna vazio
  }

  try {
    const arr = JSON.parse(raw) as any[];
    return Array.isArray(arr) ? arr.map(reviveBook) : [];
  } catch {
    return []; // 👉 Se corrompido, começa do zero
  }
}

/** Escreve a lista completa no localStorage. */
function writeAll(books: Book[]) {
  if (typeof window === 'undefined') return;

  const safe = books.map((b) => ({
    ...b,
    createdAt:
      b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
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
    writeAll([]); // 👉 Reset agora só limpa tudo
  },

  replaceAll(books: Book[]) {
    writeAll(books);
  },
};
