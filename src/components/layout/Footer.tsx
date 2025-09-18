// src/components/layout/Footer.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Footer() {
  const year = new Date().getFullYear();

  // Controla se botão "voltar ao topo" aparece
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScroll(window.scrollY > 200);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="relative border-t bg-gradient-to-r from-sky-50 via-indigo-50 to-pink-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 transition-colors">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-slate-600 dark:text-slate-300 md:flex-row">
        {/* Texto institucional com efeito suave */}
        <p className="text-center md:text-left animate-fadeIn">
          © {year}{' '}
          <span className="font-semibold text-sky-600 dark:text-sky-400">
            BookShelf
          </span>{' '}
          — Criando sua jornada literária com carinho 📖✨
        </p>

        {/* Navegação secundária */}
        <nav className="flex flex-wrap items-center justify-center gap-4 animate-fadeIn delay-200">
          <Link
            href="/"
            className="transition-transform duration-300 hover:scale-105 hover:text-sky-600 dark:hover:text-sky-400"
          >
            Início
          </Link>
          <Link
            href="/library"
            className="transition-transform duration-300 hover:scale-105 hover:text-sky-600 dark:hover:text-sky-400"
          >
            Biblioteca
          </Link>
          <Link
            href="/books/new"
            className="transition-transform duration-300 hover:scale-105 hover:text-sky-600 dark:hover:text-sky-400"
          >
            Adicionar livro
          </Link>
        </nav>
      </div>

      {/* Botão flutuante de voltar ao topo */}
      {showScroll && (
        <button
          onClick={scrollToTop}
          className="absolute right-6 bottom-6 rounded-full bg-sky-600 p-3 text-white shadow-lg transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
          aria-label="Voltar ao topo"
        >
          ↑
        </button>
      )}

      {/* Estilos extras de animação */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease forwards;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </footer>
  );
}
