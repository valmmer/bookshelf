// src/components/layout/Footer.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  // mostra a seta após rolar a página
  const [showScroll, setShowScroll] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowScroll(window.scrollY > 280);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer
      className={[
        'relative w-full border-t border-border',
        // gradiente mais claro no tema light; escuro no dark
        'bg-gradient-to-r from-sky-50 via-indigo-50 to-pink-50',
        'dark:from-gray-900 dark:via-gray-950 dark:to-gray-900',
        'transition-colors',
      ].join(' ')}
    >
      {/* bloco central (texto sempre legível) */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div
          className={[
            'mx-auto max-w-xl text-center rounded-full shadow-sm backdrop-blur-sm',
            // pílula clara no light e escura no dark — garante contraste
            'bg-white/90 text-slate-900 ring-1 ring-black/10',
            'dark:bg-zinc-900/70 dark:text-zinc-100 dark:ring-white/10',
          ].join(' ')}
        >
          <p className="px-5 py-2 text-sm">
            © {year} <span className="font-semibold">BookShelf</span> — Criando
            sua jornada literária com carinho 📖✨
          </p>
        </div>
      </div>

      {/* Botão “voltar ao topo” */}
      <AnimatePresence>
        {showScroll && (
          <motion.button
            key="backtotop"
            onClick={scrollToTop}
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={[
              'fixed bottom-6 right-6 z-50 group rounded-full p-3 md:p-3.5 shadow-lg',
              'bg-sky-600 text-white hover:bg-sky-500',
              'ring-1 ring-black/10 dark:ring-white/10',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
            ].join(' ')}
            aria-label="Voltar ao topo"
            title="Voltar ao topo"
          >
            <ArrowUp
              aria-hidden
              className="h-5 w-5 transition-transform group-hover:-translate-y-0.5"
            />
            <span className="sr-only">Voltar ao topo</span>
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
}
