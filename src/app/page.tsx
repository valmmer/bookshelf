'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useBooks } from '@/store/books';
import KpiCard from '@/components/dashboard/KpiCard';
import { BookOpen, LibraryBig, PlusCircle } from 'lucide-react';

export default function DashboardPage() {
  const { state } = useBooks();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { total, lendo, lidos, paginasLidas } = useMemo(() => {
    const books = state.books ?? [];
    const total = books.length;
    const lendo = books.filter((b) => b.status === 'LENDO').length;
    const lidos = books.filter((b) => b.status === 'LIDO').length;
    const paginasLidas = books.reduce((acc, b) => {
      const pages = typeof b.pages === 'number' ? b.pages : 0;
      const current = typeof b.currentPage === 'number' ? b.currentPage : 0;
      return acc + Math.min(current, pages);
    }, 0);
    return { total, lendo, lidos, paginasLidas };
  }, [state.books]);

  const V = (n: number) => (mounted ? n : '—');
  const isEmpty = mounted && total === 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      {/* Hero */}
      <header className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-200 to-yellow-100 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
          <BookOpen size={18} />
          Bem-vindo à sua estante
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900">
          BookShelf
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Acompanhe suas leituras e organize sua biblioteca pessoal.
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total de livros" value={V(total)} icon={<LibraryBig />} />
        <KpiCard label="Lendo agora" value={V(lendo)} icon={<BookOpen />} />
        <KpiCard label="Finalizados" value={V(lidos)} icon={<BookOpen />} />
        <KpiCard label="Páginas lidas" value={V(paginasLidas)} icon={<BookOpen />} />
      </section>

      {/* Ações rápidas */}
      <section className="mt-12">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Ações rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/books/new"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-300 to-yellow-200 px-5 py-2 text-sm font-medium text-slate-900 shadow hover:opacity-90"
          >
            <PlusCircle size={18} />
            Adicionar livro
          </Link>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <LibraryBig size={18} />
            Abrir biblioteca
          </Link>
        </div>
      </section>

      {/* Estado vazio */}
      {isEmpty && (
        <section className="mt-14 rounded-2xl border border-dashed bg-white/70 p-10 text-center text-slate-600 shadow-inner">
          <BookOpen className="mx-auto mb-4 h-10 w-10 text-slate-400" />
          <p className="text-base">
            Sua biblioteca ainda está vazia. Comece cadastrando o primeiro livro.
          </p>
          <div className="mt-5">
            <Link
              href="/books/new"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <PlusCircle size={18} />
              Cadastrar livro
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
