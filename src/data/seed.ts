// src/data/seed.ts
import type { Book } from '@/types/book';

export const seedBooks: Book[] = [
  {
    id: '1',
    title: 'Dom Casmurro',
    author: 'Machado de Assis',
    pages: 256,
    currentPage: 0,
    status: 'NÃO LIDO',
    createdAt: new Date(),
    cover: '/covers/dom-casmurro.jpg',
    synopsis: 'Um dos maiores clássicos da literatura brasileira...',
  },
  {
    id: '2',
    title: '1984',
    author: 'George Orwell',
    pages: 328,
    currentPage: 45,
    status: 'LENDO',
    createdAt: new Date(),
    cover: '/covers/1984.jpg',
    synopsis: 'Uma distopia sobre vigilância e autoritarismo...',
  },
  {
    id: '3',
    title: 'O Hobbit',
    author: 'J.R.R. Tolkien',
    pages: 310,
    currentPage: 310,
    status: 'LIDO',
    createdAt: new Date(),
    cover: '/covers/hobbit.jpg',
    synopsis: 'As aventuras de Bilbo Bolseiro até a Montanha Solitária.',
  },
];
