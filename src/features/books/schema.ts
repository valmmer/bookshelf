import { z } from 'zod';

export const bookFormSchema = z
  .object({
    title: z.string().min(2, 'Título é obrigatório (mín. 2)'),
    author: z.string().min(2, 'Autor é obrigatório (mín. 2)'),
    genre: z.string().optional(),
    year: z.number().int().min(0).max(2100).optional(),
    pages: z.number().int().min(1).optional(),
    currentPage: z.number().int().min(0).optional(),
    rating: z.number().int().min(1).max(5).optional(),
    synopsis: z.string().optional(),
    // ❌ removido: cover URL (se quiser manter, deixe como optional string)
    status: z
      .enum(['QUERO_LER', 'LENDO', 'LIDO', 'PAUSADO', 'ABANDONADO'])
      .optional(),
    isbn: z.string().optional(),
    notes: z.string().optional(),
    // ❌ removido: fileUrl (caminho local)
  })
  .superRefine((data, ctx) => {
    if (
      data.pages !== undefined &&
      data.currentPage !== undefined &&
      data.currentPage > data.pages
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Página atual não pode ser maior que total de páginas',
        path: ['currentPage'],
      });
    }
  });

export type BookFormValues = z.infer<typeof bookFormSchema>;
