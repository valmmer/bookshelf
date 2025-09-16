// src/data/store.ts
//
// Responsável por ler/gravar a lista de livros usando localStorage (lado do cliente).
// Mantém funções de CRUD: list, get, add, update, remove, reset.
//
// Observações importantes:
// - Como o localStorage só existe no browser, marcamos o módulo como "use client".
// - Salvamos datas como string (ISO) e, ao ler, "revivemos" para Date novamente.
// - Se não houver nada salvo, inicializamos com o seed (dados de exemplo).

'use client';

import type { Book } from '@/types/book';
import { seedBooks } from './seed';

// Chave onde vamos salvar o array de Books no localStorage.
// Mudou o esquema? Troque a versão no final (ex.: v2) para "resetar" seguro.
const STORAGE_KEY = 'bookshelf:books:v1';

/** Converte um objeto cru (do JSON) para o tipo Book, re-hidratando o Date. */
function reviveBook(raw: any): Book {
  return {
    ...raw,
    // createdAt volta a ser Date (ao salvar, foi transformado em string ISO)
    createdAt: raw?.createdAt ? new Date(raw.createdAt) : new Date(),
  };
}

/** Lê todos os livros do localStorage. Se não existir, inicializa com o seed. */
function readAll(): Book[] {
  if (typeof window === 'undefined') return []; // segurança no lado do servidor

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    // Primeira execução: sem dados → gravar o seed e retornar
    writeAll(seedBooks);
    return seedBooks;
  }

  try {
    const arr = JSON.parse(raw) as any[];
    return Array.isArray(arr) ? arr.map(reviveBook) : [];
  } catch {
    // Em caso de JSON corrompido, recomeça com o seed
    writeAll(seedBooks);
    return seedBooks;
  }
}

/** Escreve a lista completa no localStorage (datas viram string ISO). */
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
  /** Lista todos os livros. */
  list(): Book[] {
    return readAll();
  },

  /** Busca um livro pelo id. */
  get(id: string): Book | undefined {
    return readAll().find((b) => b.id === id);
  },

  /** Adiciona um novo livro (no topo da lista). */
  add(book: Book) {
    const data = readAll();
    data.unshift(book);
    writeAll(data);
  },

  /** Atualiza um livro existente (merge raso com patch). */
  update(id: string, patch: Partial<Book>) {
    const updated = readAll().map((b) =>
      b.id === id ? { ...b, ...patch } : b
    );
    writeAll(updated);
  },

  /** Remove um livro pelo id. */
  remove(id: string) {
    const filtered = readAll().filter((b) => b.id !== id);
    writeAll(filtered);
  },

  /** Restaura os dados do seed (útil para testes). */
  reset() {
    writeAll(seedBooks);
  },

  /** Substitui toda a coleção (import/export futuro, por exemplo). */
  replaceAll(books: Book[]) {
    writeAll(books);
  },
};
