'use client';

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
} from 'react';
import type { Book } from '@/types/book';
import { seedBooks } from '@/data/seed';

// ──────────────────────────────
// 1. Tipos do state e actions
// ──────────────────────────────
type State = { books: Book[] };

type Action =
  | { type: 'HYDRATE'; payload: Book[] }
  | { type: 'ADD'; payload: Book }
  | { type: 'UPDATE'; payload: Book }
  | { type: 'DELETE'; payload: string }
  | { type: 'RESET' };

// ──────────────────────────────
// 2. Reducer
// ──────────────────────────────
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { books: action.payload };
    case 'ADD':
      return { books: [...state.books, action.payload] };
    case 'UPDATE':
      return {
        books: state.books.map((b) =>
          b.id === action.payload.id ? action.payload : b
        ),
      };
    case 'DELETE':
      return { books: state.books.filter((b) => b.id !== action.payload) };
    case 'RESET':
      return { books: [] };
    default:
      return state;
  }
}

// ──────────────────────────────
// 3. Context type (Ctx)
// ──────────────────────────────
type Ctx = {
  state: State;
  addBook: (book: Book) => void;
  updateBook: (book: Book) => void;
  deleteBook: (id: string) => void;
  reset: () => void;
};

// cria o contexto
const BooksContext = createContext<Ctx | undefined>(undefined);

// ──────────────────────────────
// 4. Provider
// ──────────────────────────────
export function BooksProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { books: [] });

  // hidrata com localStorage ou seed inicial
  useEffect(() => {
    const saved = localStorage.getItem('books');
    if (saved) {
      dispatch({ type: 'HYDRATE', payload: JSON.parse(saved) });
    } else {
      dispatch({ type: 'HYDRATE', payload: seedBooks });
    }
  }, []);

  // persiste no localStorage
  useEffect(() => {
    localStorage.setItem('books', JSON.stringify(state.books));
  }, [state.books]);

  const value: Ctx = {
    state,
    addBook: (book) => dispatch({ type: 'ADD', payload: book }),
    updateBook: (book) => dispatch({ type: 'UPDATE', payload: book }),
    deleteBook: (id) => dispatch({ type: 'DELETE', payload: id }),
    reset: () => dispatch({ type: 'RESET' }),
  };

  return (
    <BooksContext.Provider value={value}>{children}</BooksContext.Provider>
  );
}

// ──────────────────────────────
// 5. Hook para consumir o contexto
// ──────────────────────────────
export function useBooks(): Ctx {
  const ctx = useContext(BooksContext);
  if (!ctx) {
    throw new Error('useBooks must be used within <BooksProvider>');
  }
  return ctx;
}
