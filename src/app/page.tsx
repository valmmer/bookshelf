// app/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // ✅ substitui <img> pelo componente otimizado
import { motion, AnimatePresence } from 'framer-motion';
import { useBooks } from '@/store/books';
import type { Book } from '@/types/book'; // ✅ usa o tipo real em vez de any
import KpiCard from '@/components/dashboard/KpiCard';
import { FaBook, FaBookReader, FaTasks, FaClipboardList } from 'react-icons/fa';

/* ------------------------ Regras robustas para KPIs ----------------------- */
function isFinished(b: Book): boolean {
  const status = (b.status ?? '').toString().toUpperCase();
  const cp = typeof b.currentPage === 'number' ? b.currentPage : 0;
  const pages = typeof b.pages === 'number' ? b.pages : undefined;
  if (status === 'LIDO') return true;
  if (pages !== undefined && pages > 0 && cp >= pages) return true;
  return false;
}

function isReading(b: Book): boolean {
  const status = (b.status ?? '').toString().toUpperCase();
  const cp = typeof b.currentPage === 'number' ? b.currentPage : 0;
  if (status === 'LENDO') return true;
  if (cp > 0 && !isFinished(b)) return true;
  return false;
}

/* ----------------------------- Frases acolhedoras ----------------------------- */
const MESSAGES = [
  'Acompanhe seu progresso, celebre cada conquista.',
  'Sua biblioteca pessoal, organizada e sempre por perto.',
  'Cada página lida é um passo na sua jornada.',
  'Descubra, releia, sinta — a leitura é sua.',
  'Transforme cada capítulo em motivo de orgulho.',
];

export default function HomePage() {
  const { state } = useBooks();

  // evita “piscada” na hidratação
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // rotaciona mensagens a cada 6s
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  // KPIs robustos
  const { total, lendo, lidos, paginasLidas, emProgresso } = useMemo(() => {
    const books = state.books ?? [];
    let lendo = 0;
    let lidos = 0;
    let paginas = 0;
    const progress: Book[] = []; // ✅ tipado corretamente

    for (const b of books) {
      const cp = typeof b.currentPage === 'number' ? b.currentPage : 0;
      const pages = typeof b.pages === 'number' ? b.pages : undefined;

      paginas += Math.max(0, pages ? Math.min(cp, pages) : cp);

      if (isFinished(b)) lidos += 1;
      else if (isReading(b)) {
        lendo += 1;
        progress.push(b);
      }
    }

    return {
      total: books.length,
      lendo,
      lidos,
      paginasLidas: paginas,
      emProgresso: progress,
    };
  }, [state.books]);

  // micro-loading só para um “respiro” estético
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, [mounted]);

  return (
    <main className="relative mx-auto max-w-6xl px-6 py-10">
      {/* ... blobs e header permanecem iguais ... */}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-slate-900/70" />
        </div>
      ) : (
        <>
          {/* ... KPIs permanecem iguais ... */}

          {/* --------------------------- Lista “Atualmente lendo” --------------------------- */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              Atualmente lendo
            </h2>

            {emProgresso.length === 0 ? (
              <p className="italic text-slate-600">
                Nenhum livro em andamento. Que tal começar um agora?
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {emProgresso.map((book) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link
                      href={`/books/${book.id}/read`}
                      className="
                        group block rounded-xl bg-white/90 shadow-md ring-1 ring-black/5
                        transition hover:shadow-lg focus:outline-none focus-visible:ring-2
                        focus-visible:ring-sky-500
                      "
                      aria-label={`Ler agora: ${book.title}`}
                    >
                      {/* ✅ substituímos <img> por <Image /> */}
                      <Image
                        src={book.cover || '/file.svg'}
                        alt={`Capa de ${book.title}`}
                        width={400}
                        height={300}
                        className="mb-4 h-48 w-full rounded-t-xl object-cover"
                      />

                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-sky-700">
                          {book.title}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {book.author ?? 'Autor desconhecido'}
                        </p>

                        <div className="mt-3 flex items-center justify-between text-sm text-slate-700">
                          {typeof book.pages === 'number' &&
                          typeof book.currentPage === 'number' ? (
                            <span>
                              {book.currentPage}/{book.pages} páginas
                            </span>
                          ) : typeof book.currentPage === 'number' ? (
                            <span>{book.currentPage} páginas lidas</span>
                          ) : (
                            <span>—</span>
                          )}

                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-200">
                            LENDO
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
