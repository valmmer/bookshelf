// src/server/db/books.ts

import { prisma } from '../prisma';
import { Prisma, ReadingStatus as DbReadingStatus } from '@prisma/client';
import type {
  BookDTO,
  BookCreateInput,
  BookUpdateInput,
  ListOptions,
  ReadingStatus,
} from './types';

/* --------------------------------------------------------------------------
 * Helper de "case-insensitive" compatível com versões onde Prisma.QueryMode
 * não está exposto no namespace. Usamos o literal 'insensitive' (as any).
 *
 * Ex.: { title: ci('dom') } => { title: { contains: 'dom', mode: 'insensitive' } }
 * -------------------------------------------------------------------------- */
const ci = (s: string) =>
  ({ contains: s, mode: 'insensitive' as any } as const);

/* --------------------------------------------------------------------------
 * Conversões utilitárias
 * -------------------------------------------------------------------------- */
type OrderDir = 'asc' | 'desc';

const asOrderDir = (v: any): OrderDir => (v === 'asc' ? 'asc' : 'desc');

const asPositiveInt = (v: any, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

/* --------------------------------------------------------------------------
 * DTO (transforma o retorno do Prisma no shape que a UI usa)
 * -------------------------------------------------------------------------- */
function toDTO(b: any): BookDTO {
  return {
    id: b.id,
    title: b.title,
    author: b.author,
    year: b.year ?? null,
    pages: b.pages,
    rating: b.rating ?? null,
    synopsis: b.synopsis ?? null,
    cover: b.cover ?? null,
    fileUrl: b.fileUrl ?? null,
    status: b.status as ReadingStatus, // garante o union do nosso domínio
    currentPage: b.currentPage,
    isbn: b.isbn ?? null,
    notes: b.notes ?? null,
    genreId: b.genreId ?? null,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    genre: b.genre ? { id: b.genre.id, name: b.genre.name } : null,
  };
}

/* --------------------------------------------------------------------------
 * Tipos auxiliares de Prisma (para tipar filtros/orderBy)
 * -------------------------------------------------------------------------- */
type BookWhere = Prisma.BookWhereInput;
type BookOrder = Prisma.BookOrderByWithRelationInput;

/* =============================================================================
 * LISTAGEM
 * =============================================================================
 * - Filtros: q (busca livre), status, genreId
 * - Paginação: page, pageSize
 * - Ordenação: orderBy ('createdAt' | 'title' | 'author' | 'rating'), orderDir
 * - Busca case-insensitive usando o helper `ci(...)`
 * - Tipagem explícita em `andFilters: Prisma.BookWhereInput[]` evita problemas
 *   com o `OR` e o narrowing de tipos do TS.
 * ===========================================================================*/
export async function listBooks(opts: ListOptions = {}) {
  const {
    q,
    status,
    genreId,
    page: rawPage = 1,
    pageSize: rawPageSize = 12,
    orderBy = 'createdAt',
    orderDir: rawOrderDir = 'desc',
  } = opts;

  const page = asPositiveInt(rawPage, 1);
  const pageSize = asPositiveInt(rawPageSize, 12);
  const orderDir = asOrderDir(rawOrderDir);

  const andFilters: BookWhere[] = [];

  // 🔎 Busca livre (title/author/isbn) — case-insensitive
  if (q && q.trim().length > 0) {
    const needle = q.trim();
    andFilters.push({
      OR: [{ title: ci(needle) }, { author: ci(needle) }, { isbn: ci(needle) }],
    });
  }

  // 🎯 Status (enum do Prisma)
  if (status) {
    andFilters.push({
      status: status as DbReadingStatus,
    });
  }

  // 🏷️ Gênero por FK
  if (genreId) {
    andFilters.push({ genreId });
  }

  // where final (undefined se não houver filtro)
  const where: BookWhere | undefined =
    andFilters.length > 0 ? { AND: andFilters } : undefined;

  // 📚 Ordenação segura
  let orderByClause: BookOrder;
  switch (orderBy) {
    case 'title':
      orderByClause = { title: orderDir };
      break;
    case 'author':
      orderByClause = { author: orderDir };
      break;
    case 'rating':
      orderByClause = { rating: orderDir };
      break;
    default:
      orderByClause = { createdAt: orderDir };
  }

  // Execução paralela (count + rows)
  const [total, rows] = await Promise.all([
    prisma.book.count({ where }),
    prisma.book.findMany({
      where,
      include: { genre: true },
      orderBy: orderByClause,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    total,
    page,
    pageSize,
    items: rows.map(toDTO),
  };
}

/* =============================================================================
 * CRUD
 * ============================================================================= */

export async function getBook(id: number) {
  const row = await prisma.book.findUnique({
    where: { id },
    include: { genre: true },
  });
  return row ? toDTO(row) : null;
}

/** Criação — aplica defaults coerentes com o schema */
export async function createBook(input: BookCreateInput) {
  const data: Prisma.BookCreateArgs['data'] = {
    title: input.title,
    author: input.author,
    year: input.year ?? null,
    pages: input.pages ?? 0,
    rating: input.rating ?? null,
    synopsis: input.synopsis ?? null,
    cover: input.cover ?? null,
    fileUrl: input.fileUrl ?? null,
    status: (input.status ?? 'QUERO_LER') as DbReadingStatus, // default seguro
    currentPage: input.currentPage ?? 0,
    isbn: input.isbn ?? null,
    notes: input.notes ?? null,
    ...(input.genreId ? { genre: { connect: { id: input.genreId } } } : {}),
  };

  const created = await prisma.book.create({
    data,
    include: { genre: true },
  });
  return toDTO(created);
}

/** Atualização — só envia campos presentes no patch */
export async function updateBook(id: number, input: BookUpdateInput) {
  const data: Prisma.BookUpdateArgs['data'] = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.author !== undefined) data.author = input.author;
  if (input.year !== undefined) data.year = input.year;
  if (input.pages !== undefined) data.pages = input.pages;
  if (input.rating !== undefined) data.rating = input.rating;
  if (input.synopsis !== undefined) data.synopsis = input.synopsis;
  if (input.cover !== undefined) data.cover = input.cover;
  if (input.fileUrl !== undefined) data.fileUrl = input.fileUrl;

  if (input.status !== undefined) {
    data.status = input.status as DbReadingStatus;
  }

  if (input.currentPage !== undefined) data.currentPage = input.currentPage;
  if (input.isbn !== undefined) data.isbn = input.isbn;
  if (input.notes !== undefined) data.notes = input.notes;

  // Conecta/desconecta gênero
  if (input.genreId !== undefined) {
    data.genre = input.genreId
      ? { connect: { id: input.genreId } }
      : { disconnect: true };
  }

  // Atualiza
  const updated = await prisma.book.update({
    where: { id },
    data,
    include: { genre: true },
  });

  // Auto-finalização (se currentPage >= pages - 1, marca como LIDO)
  if (
    input.currentPage !== undefined &&
    typeof updated.pages === 'number' &&
    updated.pages > 0 &&
    input.currentPage >= updated.pages - 1 &&
    updated.status !== 'LIDO'
  ) {
    const finalized = await prisma.book.update({
      where: { id },
      data: { status: 'LIDO' },
      include: { genre: true },
    });
    return toDTO(finalized);
  }

  return toDTO(updated);
}

export async function deleteBook(id: number) {
  const deleted = await prisma.book.delete({
    where: { id },
    include: { genre: true },
  });
  return toDTO(deleted);
}

/* =============================================================================
 * GÊNEROS
 * ============================================================================= */

export async function listGenres() {
  return prisma.genre.findMany({ orderBy: { name: 'asc' } });
}

export async function ensureDefaultGenres() {
  const defaults = [
    'Ficção',
    'Não-ficção',
    'Tecnologia',
    'Biografia',
    'História',
  ];
  await Promise.all(
    defaults.map((name) =>
      prisma.genre.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );
}

/** Cria (ou pega) um gênero pelo nome e retorna o id; string vazia => null */
export async function upsertGenreByName(name?: string | null) {
  const n = name?.trim();
  if (!n) return null;
  const g = await prisma.genre.upsert({
    where: { name: n },
    update: {},
    create: { name: n },
  });
  return g.id;
}
