// src/features/books/schema.ts
import { z } from 'zod';

// enum client-safe
export const READING_STATUSES = [
  'QUERO_LER',
  'LENDO',
  'LIDO',
  'PAUSADO',
  'ABANDONADO',
] as const;
export type ReadingStatus = (typeof READING_STATUSES)[number];

export const bookFormSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  author: z.string().min(1, 'Autor é obrigatório'),
  genre: z.string().optional(),
  year: z.number().int().optional().nullable(),
  pages: z.number().int().optional().nullable(),
  currentPage: z.number().int().optional().nullable(),
  rating: z.number().int().optional().nullable(),
  synopsis: z.string().optional().nullable(),
  status: z.enum(READING_STATUSES).default('QUERO_LER'),
  isbn: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  cover: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
});

export type BookFormValues = z.infer<typeof bookFormSchema>;
