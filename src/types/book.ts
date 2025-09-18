// src/types/book.ts

/**
 * Status de leitura possíveis para um livro.
 */
export type ReadingStatus =
  | 'QUERO_LER'
  | 'LENDO'
  | 'LIDO'
  | 'PAUSADO'
  | 'ABANDONADO'
  | 'NÃO LIDO'; // suporte explícito ao rótulo em PT

/**
 * Interface principal (entidade persistida).
 * Campos opcionais deixam o app resiliente a rascunhos/migrações.
 */
export interface Book {
  id: string;
  title: string;
  author?: string;
  year?: number;

  // gêneros
  genre?: string;
  genres?: string[];

  // leitura
  pages?: number;
  currentPage?: number;
  rating?: number;
  status?: ReadingStatus;

  // mídia
  cover?: string;
  fileUrl?: string; // caminho do PDF ou URL externa

  // extras
  synopsis?: string; // sinopse/resumo
  notes?: string; // anotações pessoais
  isbn?: string; // ISBN opcional

  /** Data de criação (controlada pelo store/localStorage) */
  createdAt: Date;
}

/** Lista pré-definida de gêneros (pode expandir) */
export const GENRES = [
  'Literatura Brasileira',
  'Ficção Científica',
  'Realismo Mágico',
  'Ficção',
  'Fantasia',
  'Romance',
  'Biografia',
  'História',
  'Autoajuda',
  'Tecnologia',
  'Programação',
  'Negócios',
  'Psicologia',
  'Filosofia',
  'Poesia',
] as const;

export type Genre = (typeof GENRES)[number];

/* ------------------------------------------------------------------ */
/* Tipos derivados — úteis no store, forms e ações                     */
/* ------------------------------------------------------------------ */

/** Para criação: sem id; você pode deixar defaults no formulário */
export type NewBook = Omit<Book, 'id'> & { id?: never };

/** Para update: id obrigatório + parciais */
export type BookPatch = Partial<Book> & { id: string };

/** Versão “completa” quando você tem tudo preenchido */
export type RequiredBook = Required<
  Omit<
    Book,
    | 'synopsis'
    | 'isbn'
    | 'notes'
    | 'genres'
    | 'rating'
    | 'cover'
    | 'fileUrl'
    | 'genre'
  >
> &
  Book;

/* ------------------------------------------------------------------ */
/* UX helpers — centralizam regras em um lugar                         */
/* ------------------------------------------------------------------ */

/** Labels para status — ideal para usar no Badge/tooltips */
export const STATUS_LABEL: Record<ReadingStatus, string> = {
  QUERO_LER: 'Quero ler',
  LENDO: 'Lendo',
  LIDO: 'Lido',
  PAUSADO: 'Pausado',
  ABANDONADO: 'Abandonado',
  'NÃO LIDO': 'Não lido',
};

/** Cores sugeridas (Tailwind) por status */
export const STATUS_STYLE: Record<
  ReadingStatus,
  { bg: string; text: string; border?: string }
> = {
  QUERO_LER: {
    bg: 'bg-sky-100',
    text: 'text-sky-800',
    border: 'border-sky-200',
  },
  LENDO: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  LIDO: {
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-200',
  },
  PAUSADO: {
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-200',
  },
  ABANDONADO: {
    bg: 'bg-rose-100',
    text: 'text-rose-800',
    border: 'border-rose-200',
  },
  'NÃO LIDO': {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
};

/** Progresso em % (arredondado) — retorna null quando não dá pra calcular */
export function computeProgress(
  currentPage?: number,
  pages?: number
): number | null {
  if (
    typeof currentPage !== 'number' ||
    typeof pages !== 'number' ||
    pages <= 0
  )
    return null;
  return Math.min(100, Math.max(0, Math.round((currentPage / pages) * 100)));
}

/** Garante que currentPage fique no intervalo [1, pages] */
export function clampPage(page: number, pages?: number): number {
  if (!Number.isFinite(page) || page < 1) return 1;
  if (typeof pages === 'number' && pages > 0) return Math.min(page, pages);
  return page;
}

/** Normaliza capa: remove http(s)://localhost:3000, força caminho relativo, aplica fallback */
export function normalizeCoverUrl(u?: string | null): string {
  if (!u) return '/file.svg';
  const noLocal = u
    .replace(/^https?:\/\/localhost:\d+/i, '')
    .replace(/^https?:\/\/127\.0\.0\.1:\d+/i, '');
  const withSlash = noLocal.startsWith('/') ? noLocal : `/${noLocal}`;
  return withSlash || '/file.svg';
}

/** Normaliza caminho do PDF — usada pelo leitor */
export function normalizePdfPath(u?: string | null): string | null {
  if (!u) return null;
  const t = u.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t; // URL absoluta
  if (t.startsWith('/ebooks/')) return t; // já normalizado
  return `/ebooks/${t.replace(/^\/+/, '')}`; // nome relativo -> prefixa
}

/* ------------------------------------------------------------------ */
/* Type guards — úteis para checagens antes de ações                   */
/* ------------------------------------------------------------------ */

export function hasFile(book: Book): book is Book & { fileUrl: string } {
  return typeof book.fileUrl === 'string' && book.fileUrl.trim().length > 0;
}

export function hasCover(book: Book): book is Book & { cover: string } {
  return typeof book.cover === 'string' && book.cover.trim().length > 0;
}
