// src/server/db/types.ts

export type ReadingStatus =
  | 'QUERO_LER'
  | 'LENDO'
  | 'LIDO'
  | 'PAUSADO'
  | 'ABANDONADO';

export interface BookDTO {
  id: number;
  title: string;
  author: string;
  year?: number | null;
  pages: number;
  rating?: number | null; // 0..5, por exemplo
  synopsis?: string | null;
  cover?: string | null;
  fileUrl?: string | null;
  status: ReadingStatus;
  currentPage: number;
  isbn?: string | null;
  notes?: string | null;
  genreId?: number | null;
  createdAt: Date;
  updatedAt: Date;
  genre?: { id: number; name: string } | null;
}

export interface BookCreateInput {
  title: string;
  author: string;
  year?: number | null;
  pages?: number; // default 0
  rating?: number | null;
  synopsis?: string | null;
  cover?: string | null;
  fileUrl?: string | null;
  status?: ReadingStatus; // default QUERO_LER
  currentPage?: number; // default 0
  isbn?: string | null;
  notes?: string | null;
  genreId?: number | null; // pode vir string na UI → convertemos na action
}

/**
 * ✅ Use type alias em vez de interface vazia estendendo Partial<...>
 * (evita @typescript-eslint/no-empty-object-type)
 */
export type BookUpdateInput = Partial<BookCreateInput>;

export interface ListOptions {
  q?: string; // busca por título/autor
  status?: ReadingStatus;
  genreId?: number;
  page?: number; // 1-based
  pageSize?: number; // default 12-20
  orderBy?: 'createdAt' | 'title' | 'author' | 'rating';
  orderDir?: 'asc' | 'desc';
}
