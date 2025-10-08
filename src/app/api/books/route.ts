// src/app/api/books/route.ts
import { NextResponse } from 'next/server';
import { createBook, listBooks } from '@/server/db/books';
import { bookFormSchema } from '@/features/books/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/books
export async function GET() {
  // usamos a listagem oficial do server
  const data = await listBooks({});
  // sempre devolve array
  return NextResponse.json({ books: data.items ?? [] }, { status: 200 });
}

// POST /api/books
export async function POST(req: Request) {
  try {
    // trate o corpo como unknown para evitar any
    const raw: unknown = await req.json();

    // 🔧 Sanitização leve: converte "" para undefined/null conforme o campo
    // (trabalhamos em cima de um objeto "plain", sem modificar o raw)
    const b =
      raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

    const sanitized = {
      ...b,
      year: b?.year === '' ? undefined : b?.year,
      pages: b?.pages === '' ? undefined : b?.pages,
      currentPage: b?.currentPage === '' ? undefined : b?.currentPage,
      rating: b?.rating === '' ? undefined : b?.rating,
      synopsis: b?.synopsis === '' ? null : b?.synopsis,
      isbn: b?.isbn === '' ? null : b?.isbn,
      notes: b?.notes === '' ? null : b?.notes,
      genre:
        typeof b?.genre === 'string' && b.genre.trim().length > 0
          ? b.genre.trim()
          : undefined,
      cover:
        typeof b?.cover === 'string' &&
        (b.cover.startsWith('/') || /^https?:\/\//i.test(b.cover))
          ? b.cover
          : undefined,
      fileUrl:
        typeof b?.fileUrl === 'string' &&
        (b.fileUrl.startsWith('/') || /^https?:\/\//i.test(b.fileUrl))
          ? b.fileUrl
          : undefined,
    };

    // ✅ validação com Zod (sem any)
    const parsed = bookFormSchema.safeParse(sanitized);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: parsed.error.format() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    // ✅ Monta o input SEM enviar null para campos numéricos opcionais,
    //    e só inclui quando forem number de fato
    const input = {
      title: d.title,
      author: d.author,
      status: d.status, // "QUERO_LER" | "LENDO" | ...

      ...(typeof d.year === 'number' ? { year: d.year } : {}),
      ...(typeof d.pages === 'number' ? { pages: d.pages } : {}),
      ...(typeof d.rating === 'number' ? { rating: d.rating } : {}),
      ...(typeof d.currentPage === 'number'
        ? { currentPage: d.currentPage }
        : {}),

      synopsis: d.synopsis ?? null,
      cover: d.cover ?? null,
      fileUrl: d.fileUrl ?? null,
      isbn: d.isbn ?? null,
      notes: d.notes ?? null,

      // gênero como string | undefined (o server resolve genreId)
      ...(d.genre ? { genre: d.genre } : {}),
    } as const;

    const book = await createBook(input);
    return NextResponse.json({ ok: true, book }, { status: 201 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : String(err ?? 'unknown error');
    return NextResponse.json(
      { error: 'Erro interno', detail: message },
      { status: 500 }
    );
  }
}
