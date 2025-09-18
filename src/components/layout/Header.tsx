// src/components/Header.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Header com:
 * - mesmo gradiente do Footer (acolhedor)
 * - barra de progresso no topo durante a navegação
 * - micro-animações em links
 * - versão mobile com menu deslizante
 */
export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // progress bar
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // sombra sutil quando rolar
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // inicia barra
  const startProgress = () => {
    setIsNavigating(true);
    setProgress(10);
    timerRef.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.max(1, (90 - p) * 0.08) : p));
    }, 120);
  };

  // conclui ao trocar rota
  useEffect(() => {
    if (!isNavigating) return;
    setProgress(100);
    const t = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleNav = (href: string) => (e: React.MouseEvent) => {
    if (isNavigating) return e.preventDefault();
    e.preventDefault();
    setIsMenuOpen(false);
    startProgress();
    router.push(href);
  };

  const navItems = useMemo(
    () => [
      { label: 'Biblioteca', href: '/library' },
      { label: 'Novo', href: '/books/new' },
    ],
    []
  );

  return (
    <header
      className={[
        'sticky top-0 z-40 border-b',
        // ⬇️ Mesmo gradiente do Footer (claro e dark)
        'bg-gradient-to-r from-sky-50 via-indigo-50 to-pink-50',
        'dark:from-gray-800 dark:via-gray-900 dark:to-gray-800',
        'transition-shadow duration-300',
        scrolled ? 'shadow-sm' : 'shadow-none',
      ].join(' ')}
      aria-label="Barra de navegação"
    >
      {/* Barra de progresso (cor harmonizada) */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            key="progress"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: `${progress}%`, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="pointer-events-none absolute left-0 top-0 h-[3px] w-0 bg-sky-700 dark:bg-sky-300"
          />
        )}
      </AnimatePresence>

      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            href="/"
            className="select-none text-lg font-semibold text-slate-900 dark:text-slate-100"
            aria-label="Ir para a página inicial"
            onClick={handleNav('/')}
          >
            BookShelf
          </Link>
        </motion.div>

        {/* Navegação desktop */}
        <nav className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <motion.a
                key={item.href}
                onClick={handleNav(item.href)}
                className={[
                  'relative cursor-pointer select-none text-sm transition-colors',
                  active
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-800 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white',
                ].join(' ')}
                whileHover={{ y: -1 }}
              >
                {item.label}
                {/* sublinhado sutil */}
                <span
                  className={[
                    'absolute -bottom-1 left-0 h-[2px] w-full rounded',
                    active ? 'bg-sky-700 dark:bg-sky-300' : 'bg-transparent',
                  ].join(' ')}
                  aria-hidden
                />
                {!active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 h-[2px] w-0 rounded bg-sky-700 dark:bg-sky-300"
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.2 }}
                    aria-hidden
                  />
                )}
              </motion.a>
            );
          })}
        </nav>

        {/* Botão hambúrguer (mobile) */}
        <button
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          aria-label="Abrir/fechar menu"
          className="md:hidden rounded p-2 text-slate-800 dark:text-slate-100 outline-none ring-sky-700/30 focus:ring-2"
        >
          {isMenuOpen ? (
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Navegação mobile (com o mesmo fundo) */}
      <AnimatePresence initial={false}>
        {isMenuOpen && (
          <motion.nav
            id="mobile-nav"
            key="mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={[
              'md:hidden overflow-hidden border-t px-4 py-3',
              'bg-gradient-to-r from-sky-50 via-indigo-50 to-pink-50',
              'dark:from-gray-800 dark:via-gray-900 dark:to-gray-800',
            ].join(' ')}
          >
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    onClick={handleNav(item.href)}
                    className="block cursor-pointer rounded px-2 py-2 text-slate-800 hover:bg-white/50 dark:text-slate-100 dark:hover:bg-white/5"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>

      <span className="sr-only" aria-live="polite">
        {isNavigating ? 'Carregando…' : 'Pronto'}
      </span>
    </header>
  );
}
