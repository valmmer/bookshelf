// app/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooks } from '@/store/books';
import KpiCard from '@/components/dashboard/KpiCard';
import { FaBook, FaBookReader, FaTasks, FaClipboardList } from 'react-icons/fa';

/* ------------------------ Regras robustas para KPIs ----------------------- */
function isFinished(b: any): boolean {
  const status = (b.status ?? '').toString().toUpperCase();
  const cp = typeof b.currentPage === 'number' ? b.currentPage : 0;
  const pages = typeof b.pages === 'number' ? b.pages : undefined;
  if (status === 'LIDO') return true;
  if (pages !== undefined && pages > 0 && cp >= pages) return true;
  return false;
}
function isReading(b: any): boolean {
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
    const progress: typeof books = [];

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
      {/* --------- Blobs de fundo (efeito acolhedor, sutis e leves) --------- */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-pink-300 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
          className="absolute right-[-8%] top-[10%] h-80 w-80 rounded-full bg-sky-300 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          className="absolute bottom-[-12%] left-[30%] h-96 w-96 rounded-full bg-emerald-300 blur-3xl"
        />
      </div>

      {/* --------------------------- Cabeçalho acolhedor --------------------------- */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-8 text-center"
      >
        <h1 className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
          Bem-vindo(a) à sua jornada de leitura
        </h1>

        <div className="relative mt-3 inline-flex items-center justify-center">
          {/* sublinhado suave */}
          <span className="absolute -bottom-1 h-[2px] w-full rounded bg-slate-900/10" />
          {/* mensagem rotativa */}
          <div className="min-h-[1.5rem] px-1 text-slate-700">
            <AnimatePresence mode="wait">
              <motion.p
                key={msgIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
                className="text-sm sm:text-base"
              >
                {MESSAGES[msgIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      {/* --------------------------- KPIs (com micro motion) --------------------------- */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-slate-900/70" />
        </div>
      ) : (
        <>
          <section className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            >
              <KpiCard
                icon={<FaBook className="text-white text-3xl" />}
                label="Total de Livros"
                value={total}
                bgColor="bg-blue-700"
                labelColor="text-white"
                valueColor="text-white font-bold text-2xl"
              />
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            >
              <KpiCard
                icon={<FaBookReader className="text-white text-3xl" />}
                label="Atualmente Lendo"
                value={lendo}
                bgColor="bg-orange-600"
                labelColor="text-white"
                valueColor="text-white font-bold text-2xl"
              />
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            >
              <KpiCard
                icon={<FaTasks className="text-white text-3xl" />}
                label="Livros Concluídos"
                value={lidos}
                bgColor="bg-green-600"
                labelColor="text-white"
                valueColor="text-white font-bold text-2xl"
              />
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            >
              <KpiCard
                icon={<FaClipboardList className="text-white text-3xl" />}
                label="Páginas Lidas"
                value={paginasLidas}
                bgColor="bg-yellow-500"
                labelColor="text-white"
                valueColor="text-white font-bold text-2xl"
              />
            </motion.div>
          </section>

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
                  // ⬇️ Card inteiro é um Link para o leitor
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={book.cover || '/file.svg'}
                        alt={`Capa de ${book.title}`}
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
                          {/* páginas lidas */}
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

                          {/* status em “pill” */}
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
