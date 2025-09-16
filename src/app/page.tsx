// src/app/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useBooks } from '@/store/books';
import KpiCard from '@/components/dashboard/KpiCard';

export default function DashboardPage() {
  const { state } = useBooks();

  // Evita "mismatch" entre SSR e cliente enquanto hidrata o localStorage
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // KPIs derivados
  const { total, lendo, lidos, paginasLidas } = useMemo(() => {
    const books = state.books ?? [];

    const total = books.length;

    const lendo = books.reduce(
      (acc, b) => acc + (b.status === 'LENDO' ? 1 : 0),
      0
    );

    const lidos = books.reduce(
      (acc, b) => acc + (b.status === 'LIDO' ? 1 : 0),
      0
    );

    // páginas lidas: soma de min(currentPage, pages) por livro (com defaults)
    const paginasLidas = books.reduce((acc, b) => {
      const pages = typeof b.pages === 'number' ? b.pages : 0;
      const current = typeof b.currentPage === 'number' ? b.currentPage : 0;
      return acc + Math.min(current, pages);
    }, 0);

    return { total, lendo, lidos, paginasLidas };
  }, [state.books]);

  // Enquanto não montou no cliente, mostra um travessão (—)
  const V = (n: number) => (mounted ? n : '—');

  const isEmpty = mounted && total === 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Cabeçalho */}
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">BookShelf</h1>
        <p className="mt-1 text-slate-600">
          Acompanhe suas leituras e organize sua biblioteca.
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total de livros" value={V(total)} />
        <KpiCard label="Lendo agora" value={V(lendo)} />
        <KpiCard label="Finalizados" value={V(lidos)} />
        <KpiCard label="Páginas lidas" value={V(paginasLidas)} />
      </section>

      {/* Ações rápidas */}
      <section className="mt-8">
        <h2 className="mb-3 text-base font-medium">Ações rápidas</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/books/new"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
          >
            Adicionar livro
          </Link>
          <Link
            href="/library"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
          >
            Abrir biblioteca
          </Link>
        </div>
      </section>

      {/* Estado vazio (mostra só quando já montou no cliente e não há livros) */}
      {isEmpty && (
        <section className="mt-10 rounded-2xl border border-dashed p-6 text-slate-600">
          <p className="text-sm">
            Sua biblioteca ainda está vazia. Comece cadastrando o primeiro
            livro.
          </p>
          <div className="mt-3">
            <Link
              href="/books/new"
              className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
            >
              Cadastrar livro
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
