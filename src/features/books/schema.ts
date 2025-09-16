import { z } from 'zod';

export const bookFormSchema = z
  .object({
    title: z.string().min(2, 'Título é obrigatório (mín. 2)'),
    author: z.string().min(2, 'Autor é obrigatório (mín. 2)'),
    genre: z.string().optional(),
    year: z
      .number()
      .int()
      .min(0, 'Ano inválido')
      .max(2100, 'Ano inválido')
      .optional(),
    pages: z.number().int().min(1, 'Páginas deve ser ≥ 1').optional(),
    currentPage: z.number().int().min(0, 'Página atual ≥ 0').optional(),
    rating: z.number().int().min(1).max(5).optional(),
    synopsis: z.string().optional(),
    cover: z
      .string()
      .url('URL inválida')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    status: z
      .enum(['QUERO_LER', 'LENDO', 'LIDO', 'PAUSADO', 'ABANDONADO'])
      .optional(),
    isbn: z.string().optional(),
    notes: z.string().optional(),

    // ← aceita caminho local (não uso z.url aqui, pois /ebooks/... não é URL absoluta)
    fileUrl: z.string().trim().min(1, 'Informe o caminho do PDF').optional(),
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
