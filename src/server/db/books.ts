// src/server/db/books.ts

import { prisma } from '../prisma';
import type {
  BookDTO,
  BookCreateInput,
  BookUpdateInput,
  ListOptions,
  ReadingStatus,
} from './types';

/* ============================================================================
 * Tipos locais (sem depender de tipos do Prisma)
 * ========================================================================== */

/** Mesmo union do seu domínio/DB */
type DbReadingStatus = ReadingStatus;

/** Ordenação permitida na UI/API */
type OrderBy = 'createdAt' | 'title' | 'author' | 'rating';
type OrderDir = 'asc' | 'desc';

/** Shape mínimo do que o Prisma retorna quando include: { genre: true } */
interface BookRow {
  id: number;
  title: string;
  author: string;
  year: number | null;
  pages: number;
  rating: number | null;
  synopsis: string | null;
  cover: string | null;
  fileUrl: string | null;
  status: DbReadingStatus; // enum em string
  currentPage: number;
  isbn: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  genreId: number | null;
  genre: { id: number; name: string } | null;
}

/** Resultado tipado para paginação */
export type ListBooksResult = {
  total: number;
  page: number;
  pageSize: number;
  items: BookDTO[];
};

/* ============================================================================
 * Helpers
 * ========================================================================== */

/** contains case-insensitive (shape aceito pelo Prisma em filtros) */
const ci = (s: string) => ({ contains: s, mode: 'insensitive' as const });

const asOrderDir = (v: unknown): OrderDir => (v === 'asc' ? 'asc' : 'desc');

const asPositiveInt = (v: unknown, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

/** Garante enum válido de status (fallback para QUERO_LER) */
const toDbStatus = (s: unknown): DbReadingStatus => {
  const ok: readonly DbReadingStatus[] = [
    'QUERO_LER',
    'LENDO',
    'LIDO',
    'PAUSADO',
    'ABANDONADO',
  ] as const;
  return ok.includes(s as DbReadingStatus)
    ? (s as DbReadingStatus)
    : 'QUERO_LER';
};

/** Converte a linha do DB para o DTO que a UI espera */
function toDTO(b: BookRow): BookDTO {
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
    status: b.status,
    currentPage: b.currentPage,
    isbn: b.isbn ?? null,
    notes: b.notes ?? null,
    genreId: b.genreId ?? null,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    genre: b.genre ? { id: b.genre.id, name: b.genre.name } : null,
  };
}

/* ============================================================================
 * LISTAGEM com busca, ordenação e paginação
 * ========================================================================== */
export async function listBooks(
  opts: ListOptions = {}
): Promise<ListBooksResult> {
  const {
    q,
    status,
    genreId,
    page: rawPage = 1,
    pageSize: rawPageSize = 12,
    orderBy = 'createdAt' as OrderBy,
    orderDir: rawOrderDir = 'desc',
  } = opts;

  const page = asPositiveInt(rawPage, 1);
  const pageSize = asPositiveInt(rawPageSize, 12);
  const orderDir = asOrderDir(rawOrderDir);

  const andFilters: unknown[] = [];

  // 🔎 Busca livre (title/author/isbn) — case-insensitive
  if (q && q.trim().length > 0) {
    const needle = q.trim();
    andFilters.push({
      OR: [{ title: ci(needle) }, { author: ci(needle) }, { isbn: ci(needle) }],
    });
  }

  // 🎯 Status (enum)
  if (status) andFilters.push({ status: toDbStatus(status) });

  // 🏷️ Gênero (FK)
  if (genreId) andFilters.push({ genreId });

  const where = andFilters.length > 0 ? { AND: andFilters } : undefined;

  // 📚 Ordenação segura
  const orderByClause =
    orderBy === 'title'
      ? { title: orderDir }
      : orderBy === 'author'
      ? { author: orderDir }
      : orderBy === 'rating'
      ? { rating: orderDir }
      : { createdAt: orderDir };

  const [total, rows] = await Promise.all([
    prisma.book.count({ where: where as any }),
    prisma.book.findMany({
      where: where as any,
      include: { genre: true },
      orderBy: orderByClause as any,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { total, page, pageSize, items: (rows as BookRow[]).map(toDTO) };
}

/* ============================================================================
 * Compatibilidade: getBooks simples (usado pela /api/books GET)
 * ========================================================================== */
export async function getBooks(): Promise<BookDTO[]> {
  const rows = await prisma.book.findMany({
    include: { genre: true },
    orderBy: { createdAt: 'desc' },
  });
  return (rows as BookRow[]).map(toDTO);
}

/* ============================================================================
 * CRUD
 * ========================================================================== */
export async function getBook(id: number): Promise<BookDTO | null> {
  const row = await prisma.book.findUnique({
    where: { id },
    include: { genre: true },
  });
  return row ? toDTO(row as BookRow) : null;
}

/**
 * Criação — aceita `genre` (nome) OU `genreId`.
 * Não usamos tipos do Prisma; montamos o objeto de dados de forma segura.
 */
export async function createBook(
  input: BookCreateInput & { genre?: string; genreId?: number }
): Promise<BookDTO> {
  // Resolve gênero por nome ou usa o id se vier direto
  let resolvedGenreId: number | null = null;
  if (typeof input.genre === 'string' && input.genre.trim().length > 0) {
    resolvedGenreId = await upsertGenreByName(input.genre);
  } else if (typeof input.genreId === 'number') {
    resolvedGenreId = input.genreId;
  }

  // Construímos o `data` como objeto literal (sem mutação) para o TS inferir corretamente
  const data = {
    title: input.title,
    author: input.author,
    year: input.year ?? null,
    pages: input.pages ?? 0,
    rating: input.rating ?? null,
    synopsis: input.synopsis ?? null,
    cover: input.cover ?? null,
    fileUrl: input.fileUrl ?? null,
    status: toDbStatus(input.status ?? 'QUERO_LER'),
    currentPage: input.currentPage ?? 0,
    isbn: input.isbn ?? null,
    notes: input.notes ?? null,
    ...(resolvedGenreId ? { genre: { connect: { id: resolvedGenreId } } } : {}),
  };

  const created = await prisma.book.create({
    data: data as any,
    include: { genre: true },
  });
  return toDTO(created as BookRow);
}

/**
 * Atualização — aplica somente campos presentes; controla (des)conexão do gênero por `genreId`.
 */
export async function updateBook(
  id: number,
  input: BookUpdateInput & { genreId?: number | null }
): Promise<BookDTO> {
  // Usamos spreads condicionais para inferir corretamente o shape
  const data = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.author !== undefined ? { author: input.author } : {}),
    ...(input.year !== undefined ? { year: input.year } : {}),
    ...(input.pages !== undefined ? { pages: input.pages } : {}),
    ...(input.rating !== undefined ? { rating: input.rating } : {}),
    ...(input.synopsis !== undefined ? { synopsis: input.synopsis } : {}),
    ...(input.cover !== undefined ? { cover: input.cover } : {}),
    ...(input.fileUrl !== undefined ? { fileUrl: input.fileUrl } : {}),
    ...(input.status !== undefined ? { status: toDbStatus(input.status) } : {}),
    ...(input.currentPage !== undefined
      ? { currentPage: input.currentPage }
      : {}),
    ...(input.isbn !== undefined ? { isbn: input.isbn } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.genreId !== undefined
      ? input.genreId === null
        ? { genre: { disconnect: true } }
        : { genre: { connect: { id: input.genreId } } }
      : {}),
  };

  const updated = await prisma.book.update({
    where: { id },
    data: data as any,
    include: { genre: true },
  });

  // Auto-finalização: se currentPage >= pages - 1, marca como LIDO
  if (
    input.currentPage !== undefined &&
    typeof (updated as BookRow).pages === 'number' &&
    (updated as BookRow).pages > 0 &&
    input.currentPage >= (updated as BookRow).pages - 1 &&
    (updated as BookRow).status !== 'LIDO'
  ) {
    const finalized = await prisma.book.update({
      where: { id },
      data: { status: 'LIDO' } as any,
      include: { genre: true },
    });
    return toDTO(finalized as BookRow);
  }

  return toDTO(updated as BookRow);
}

export async function deleteBook(id: number): Promise<BookDTO> {
  const deleted = await prisma.book.delete({
    where: { id },
    include: { genre: true },
  });
  return toDTO(deleted as BookRow);
}

/* ============================================================================
 * GÊNEROS
 * ========================================================================== */
export async function listGenres(): Promise<
  Array<{ id: number; name: string; createdAt: Date }>
> {
  return prisma.genre.findMany({ orderBy: { name: 'asc' } });
}

export async function ensureDefaultGenres(): Promise<void> {
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
export async function upsertGenreByName(
  name?: string | null
): Promise<number | null> {
  const n = name?.trim();
  if (!n) return null;
  const g = await prisma.genre.upsert({
    where: { name: n },
    update: {},
    create: { name: n },
  });
  return g.id;
}
