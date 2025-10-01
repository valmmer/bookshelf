'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

/* ===================== Tipos ===================== */
export type Status = 'QUERO_LER' | 'LENDO' | 'LIDO' | 'PAUSADO' | 'ABANDONADO';
export type Book = {
  id: number;
  title: string;
  author: string;
  year?: number | null;
  pages?: number | null;
  rating?: number | null;
  synopsis?: string | null;
  cover?: string | null;
  fileUrl?: string | null;
  status: 'QUERO_LER' | 'LENDO' | 'LIDO' | 'PAUSADO' | 'ABANDONADO';
  currentPage?: number | null;
  isbn?: string | null;
  notes?: string | null;
  genre?: string | null;
  genres?: string[] | null; // <-- já não aceita `null` dentro do array
  createdAt?: string;
  updatedAt?: string;
};

/* ===================== State & Actions ===================== */
type BooksState = {
  books: Book[];
};

type AddAction = { type: 'ADD'; payload: Book };
type UpdateAction = { type: 'UPDATE'; payload: Partial<Book> & { id: number } };
type DeleteAction = { type: 'DELETE'; payload: number };
type HydrateAction = { type: 'HYDRATE'; payload: Book[] };
type Action = AddAction | UpdateAction | DeleteAction | HydrateAction;

/* ===================== Normalizadores ===================== */
function normalizeStatus(b: Book): Book {
  const cp = typeof b.currentPage === 'number' ? b.currentPage : 0;
  const total = typeof b.pages === 'number' ? b.pages : undefined;
  let status: Status | undefined = b.status;
  let currentPage = cp;

  if (typeof total === 'number' && total >= 0) {
    currentPage = Math.max(0, Math.min(cp, total));
  } else {
    currentPage = Math.max(0, cp);
  }

  if (typeof total === 'number' && total > 0 && currentPage >= total) {
    status = 'LIDO';
  } else if (currentPage > 0) {
    if (status === 'QUERO_LER' || !status) status = 'LENDO';
  }

  return { ...b, currentPage, status: status ?? 'QUERO_LER' };
}

function sanitizeIncoming(b: Book): Book {
  let fileUrl = b.fileUrl;
  if (fileUrl && !fileUrl.startsWith('/ebooks/')) {
    fileUrl = `/ebooks/${fileUrl.replace(/^\/+/, '')}`;
  }
  return { ...b, fileUrl };
}

/* ===================== Reducer ===================== */
function reducer(state: BooksState, action: Action): BooksState {
  switch (action.type) {
    case 'HYDRATE':
      return { books: action.payload.map(normalizeStatus) };
    case 'ADD':
      return {
        books: [
          normalizeStatus(sanitizeIncoming(action.payload)),
          ...state.books,
        ],
      };
    case 'UPDATE':
      return {
        books: state.books.map((b) =>
          b.id === action.payload.id
            ? normalizeStatus({ ...b, ...action.payload })
            : b
        ),
      };
    case 'DELETE':
      return { books: state.books.filter((b) => b.id !== action.payload) };
    default:
      return state;
  }
}

/* ===================== Persistência ===================== */
const STORAGE_KEY = 'bookshelf:books:v1';

function safeRead(key: string): Book[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Book[]) : [];
  } catch {
    return [];
  }
}

function writeToStorage(list: Book[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

/* ===================== Contexto ===================== */
export type BooksContextType = {
  state: BooksState;
  addBook: (b: Book) => void;
  updateBook: (b: Partial<Book> & { id: number }) => void;
  deleteBook: (id: number) => void;
  replaceAll: (list: Book[]) => void;
  hydrate: (list: Book[]) => void;
  reset: () => void;
};

const BooksContext = createContext<BooksContextType | null>(null);

export function BooksProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { books: [] }, (initial) => {
    if (typeof window === 'undefined') return initial;
    return { books: safeRead(STORAGE_KEY).map(normalizeStatus) };
  });

  useEffect(() => {
    writeToStorage(state.books);
  }, [state.books]);

  const api = useMemo<BooksContextType>(
    () => ({
      state,
      addBook: (b) => dispatch({ type: 'ADD', payload: b }),
      updateBook: (b) => dispatch({ type: 'UPDATE', payload: b }),
      deleteBook: (id) => dispatch({ type: 'DELETE', payload: id }),
      replaceAll: (list) =>
        dispatch({ type: 'HYDRATE', payload: list.map(sanitizeIncoming) }),
      hydrate: (list) =>
        dispatch({ type: 'HYDRATE', payload: list.map(sanitizeIncoming) }),
      reset: () => dispatch({ type: 'HYDRATE', payload: [] }),
    }),
    [state]
  );

  return <BooksContext.Provider value={api}>{children}</BooksContext.Provider>;
}

export function useBooks(): BooksContextType {
  const ctx = useContext(BooksContext);
  if (!ctx) throw new Error('useBooks must be used inside <BooksProvider>');
  return ctx;
}
