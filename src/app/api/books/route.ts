// src/app/api/books/route.ts
import { NextResponse } from "next/server";
// ⚠️ Se não tiver alias "@", troque por imports relativos:
// import { createBook, getBooks } from "../../server/db/books";
// import { bookFormSchema } from "../../features/books/schema";
import { createBook, getBooks } from "@/server/db/books";
import { bookFormSchema } from "@/features/books/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const books = await getBooks();
  return NextResponse.json({ books }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 💡 fallback defensivo: transforma "" -> null em campos opcionais
    const sanitized = {
      ...body,
      year: body?.year === "" ? null : body?.year,
      pages: body?.pages === "" ? null : body?.pages,
      currentPage: body?.currentPage === "" ? null : body?.currentPage,
      rating: body?.rating === "" ? null : body?.rating,
      synopsis: body?.synopsis === "" ? null : body?.synopsis,
      isbn: body?.isbn === "" ? null : body?.isbn,
      notes: body?.notes === "" ? null : body?.notes,
      genre: body?.genre?.toString().trim() || null,
      // aceita URL http/https OU caminho relativo começando com "/"
      cover:
        typeof body?.cover === "string" &&
        (body.cover.startsWith("/") || /^https?:\/\//i.test(body.cover))
          ? body.cover
          : body?.cover
          ? null
          : null,
      fileUrl:
        typeof body?.fileUrl === "string" &&
        (body.fileUrl.startsWith("/") || /^https?:\/\//i.test(body.fileUrl))
          ? body.fileUrl
          : body?.fileUrl
          ? null
          : null,
    };

    const parsed = bookFormSchema.safeParse(sanitized);
    if (!parsed.success) {
      console.error("Zod issues:", parsed.error.flatten());
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.format() },
        { status: 400 }
      );
    }

    const book = await createBook({
      title: parsed.data.title,
      author: parsed.data.author,
      status: parsed.data.status,               // "QUERO_LER" | "LENDO" | ...
      year: parsed.data.year ?? null,
      pages: parsed.data.pages ?? null,
      rating: parsed.data.rating ?? null,
      synopsis: parsed.data.synopsis ?? null,
      cover: parsed.data.cover ?? null,
      fileUrl: parsed.data.fileUrl ?? null,
      currentPage: parsed.data.currentPage ?? 0,
      isbn: parsed.data.isbn ?? null,
      notes: parsed.data.notes ?? null,
      genre: parsed.data.genre ?? null,         // nome → server resolve genreId
    });

    return NextResponse.json({ ok: true, book }, { status: 201 });
  } catch (err: any) {
    console.error("Erro API /books POST:", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err?.message },
      { status: 500 }
    );
  }
}
