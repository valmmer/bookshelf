'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export default function AddBookFab() {
  const router = useRouter();
  const [isNavigating, setNavigating] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (typing) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setNavigating(true);
        router.push('/books/new');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  // ✅ Tipado corretamente: ou é undefined, ou é um Variants válido
  const floatVariants: Variants | undefined = reduceMotion
    ? undefined
    : {
        initial: { y: 0 },
        animate: {
          y: [0, -4, 0],
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        },
      };

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-40"
      // ✅ Só passa initial/animate/variants quando há animação
      initial={reduceMotion ? false : 'initial'}
      animate={reduceMotion ? undefined : 'animate'}
      variants={floatVariants}
      whileHover={reduceMotion ? undefined : { scale: 1.04 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
    >
      {!reduceMotion && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -m-1 rounded-full ring-2 ring-sky-400/30 blur-[1.5px] animate-pulse"
        />
      )}

      <Link
        href="/books/new"
        aria-label="Adicionar livro (atalho: N)"
        onClick={() => setNavigating(true)}
        className={`group relative inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-3 text-white shadow-lg transition
          hover:bg-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500
          ${isNavigating ? 'pointer-events-none opacity-80' : ''}`}
      >
        <span className="relative inline-flex h-5 w-5 items-center justify-center">
          {isNavigating ? (
            <Spinner />
          ) : (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
          )}
        </span>

        <span className="text-sm font-medium">
          {isNavigating ? 'Abrindo…' : 'Adicionar livro'}
        </span>

        <span className="ml-1 hidden rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/90 sm:inline-block">
          N
        </span>

        <span
          aria-hidden
          className="pointer-events-none absolute -inset-0.5 -z-10 rounded-full bg-gradient-to-r from-sky-600 to-cyan-500 opacity-40 blur-md transition group-hover:opacity-60"
        />
      </Link>
    </motion.div>
  );
}
