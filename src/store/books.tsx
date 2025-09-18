'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import type { Book, ReadingStatus } from '@/types/book';

/* -----------------------------------------------------------------------------
   Types de estado e ações
----------------------------------------------------------------------------- */

type BooksState = {
  books: Book[];
};

type AddAction = { type: 'ADD'; payload: Book };
type UpdateAction = { type: 'UPDATE'; payload: Partial<Book> & { id: string } };
type DeleteAction = { type: 'DELETE'; payload: string };
type HydrateAction = { type: 'HYDRATE'; payload: Book[] };

type Action = AddAction | UpdateAction | DeleteAction | HydrateAction;

/* -----------------------------------------------------------------------------
   Helpers
----------------------------------------------------------------------------- */

/** Normaliza e aplica regras de status com base em currentPage/pages */
function normalizeStatus(b: Book): Book {
  const cp = typeof b.currentPage === 'number' ? b.currentPage : 0;
  const total = typeof b.pages === 'number' ? b.pages : undefined;
  let status: ReadingStatus | undefined = b.status;

  // clamp de currentPage (não deixa passar do total se houver)
  let currentPage = cp;
  if (typeof total === 'number' && total >= 0) {
    currentPage = Math.max(0, Math.min(cp, total));
  } else {
    currentPage = Math.max(0, cp);
  }

  // ↔ regras automáticas
  if (typeof total === 'number' && total > 0 && currentPage >= total) {
    status = 'LIDO';
  } else if (currentPage > 0) {
    // estava QUERO_LER? passa a LENDO
    if (status === 'QUERO_LER' || !status) status = 'LENDO';
  } else {
    // opcional: se voltou para 0 e não estiver LIDO, volta para QUERO_LER
    // if (status !== 'LIDO') status = 'QUERO_LER';
  }

  return { ...b, currentPage, status };
}

/** Normaliza campos "auxiliares" antes de salvar */
function sanitizeIncoming(b: Book): Book {
  // normaliza fileUrl opcionalmente (se vier "dezesseis.pdf", prefixa /ebooks/)
  let fileUrl = b.fileUrl;
  if (fileUrl && !fileUrl.startsWith('/ebooks/')) {
    fileUrl = `/ebooks/${fileUrl.replace(/^\/+/, '')}`;
  }
  return { ...b, fileUrl };
}

/* -----------------------------------------------------------------------------
   Reducer
----------------------------------------------------------------------------- */

function reducer(state: BooksState, action: Action): BooksState {
  switch (action.type) {
    case 'HYDRATE': {
      // garante que livros antigos recebam normalização
      const books = action.payload.map((bk) => normalizeStatus(bk));
      return { books };
    }

    case 'ADD': {
      const newBook = normalizeStatus(sanitizeIncoming(action.payload));
      return { books: [newBook, ...state.books] };
    }

    case 'UPDATE': {
      const patch = action.payload;
      return {
        books: state.books.map((b) => {
          if (b.id !== patch.id) return b;

          // merge parcial + normalizações
          const merged: Book = {
            ...b,
            ...patch,
          };

          // se páginas foram reduzidas e currentPage ficou "maior", clamp
          if (
            typeof merged.pages === 'number' &&
            typeof merged.currentPage === 'number'
          ) {
            merged.currentPage = Math.min(merged.currentPage, merged.pages);
          }

          // normaliza URL do arquivo, se vier
          if (merged.fileUrl && !merged.fileUrl.startsWith('/ebooks/')) {
            merged.fileUrl = `/ebooks/${merged.fileUrl.replace(/^\/+/, '')}`;
          }

          return normalizeStatus(merged);
        }),
      };
    }

    case 'DELETE': {
      return { books: state.books.filter((b) => b.id !== action.payload) };
    }

    default:
      return state;
  }
}

/* -----------------------------------------------------------------------------
   Persistência (localStorage) + Provider
----------------------------------------------------------------------------- */

const STORAGE_KEY = 'books';

function readFromStorage(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Book[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type BooksContextType = {
  state: BooksState;
  addBook: (b: Book) => void;
  updateBook: (b: Partial<Book> & { id: string }) => void;
  deleteBook: (id: string) => void;
};

const BooksContext = createContext<BooksContextType | null>(null);

export function BooksProvider({ children }: { children: React.ReactNode }) {
  // lazy init: carrega do localStorage uma vez
  const [state, dispatch] = useReducer(reducer, { books: [] }, (initial) => {
    if (typeof window === 'undefined') return initial;
    const books = readFromStorage();
    return { books: books.map((b) => normalizeStatus(b)) };
  });

  // salva no localStorage quando o estado muda
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.books));
    } catch {
      // ignore
    }
  }, [state.books]);

  // API estável (memo) para evitar re-renders desnecessários
  const api = useMemo<BooksContextType>(
    () => ({
      state,
      addBook: (b) => {
        dispatch({ type: 'ADD', payload: b });
      },
      updateBook: (b) => {
        dispatch({ type: 'UPDATE', payload: b });
      },
      deleteBook: (id) => {
        dispatch({ type: 'DELETE', payload: id });
      },
    }),
    [state]
  );

  return <BooksContext.Provider value={api}>{children}</BooksContext.Provider>;
}

/* -----------------------------------------------------------------------------
   Hook de consumo
----------------------------------------------------------------------------- */

export function useBooks(): BooksContextType {
  const ctx = useContext(BooksContext);
  if (!ctx) {
    throw new Error('useBooks must be used inside <BooksProvider>');
  }
  return ctx;
}
