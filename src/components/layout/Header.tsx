// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MeteorShower from '@/components/fx/MeteorShower';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

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
  }, [pathname, isNavigating]);

  const handleNav = (href: string) => (e: React.MouseEvent) => {
    if (isNavigating) return e.preventDefault();
    e.preventDefault();
    setIsMenuOpen(false);
    startProgress();
    router.push(href);
  };

  const navItems = useMemo(
    () => [
      { label: 'Início', href: '/' },
      { label: 'Biblioteca', href: '/library' },
      { label: 'Novo', href: '/books/new' },
    ],
    []
  );

  const isActive = (href: string) =>
    href === '/'
      ? pathname === '/'
      : pathname === href || pathname.startsWith(href + '/');

  return (
    <header
      className={[
        'sticky top-0 z-40 w-full',
        'border-b border-border',
        'bg-background/80 supports-[backdrop-filter]:backdrop-blur',
        'bg-gradient-to-r from-sky-50 via-indigo-50 to-pink-50',
        'dark:from-gray-800 dark:via-gray-900 dark:to-gray-800',
        'transition-colors transition-shadow duration-300',
        'relative overflow-hidden',
        scrolled ? 'shadow-sm' : 'shadow-none',
      ].join(' ')}
      aria-label="Barra de navegação"
    >
      {/* 🌠 Meteors */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <MeteorShower />
      </div>

      {/* Barra de progresso */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            key="progress"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: `${progress}%`, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="pointer-events-none absolute left-0 top-0 h-[3px] bg-sky-700 dark:bg-sky-300"
          />
        )}
      </AnimatePresence>

      {/* Conteúdo */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        {/* Marca */}
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
        <nav className="relative hidden items-center gap-2 md:flex">
          {/* pill animado (fundo do item ativo) */}
          <div className="relative flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <div key={item.href} className="relative">
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-sky-600/10 ring-1 ring-sky-600/20 dark:bg-sky-300/15 dark:ring-sky-300/25"
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                      }}
                      aria-hidden
                    />
                  )}
                  <motion.a
                    onClick={handleNav(item.href)}
                    aria-current={active ? 'page' : undefined}
                    className={[
                      'relative z-[1] inline-flex cursor-pointer select-none items-center',
                      'px-3 py-1.5 text-sm font-medium',
                      'text-slate-800 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white',
                      'rounded-lg transition-colors focus:outline-none focus-visible:ring-2',
                      'focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    ].join(' ')}
                    whileHover={{ y: -1 }}
                  >
                    {item.label}
                    <span
                      className={[
                        'absolute -bottom-[2px] left-2 right-2 h-[2px] rounded',
                        active
                          ? 'bg-sky-700/70 dark:bg-sky-300/80'
                          : 'bg-transparent group-hover:bg-slate-900/20 dark:group-hover:bg-white/20',
                      ].join(' ')}
                      aria-hidden
                    />
                  </motion.a>
                </div>
              );
            })}
          </div>
        </nav>

        {/* Ações à direita */}
        <div className="flex items-center gap-3">
          {/* ThemeToggle maior, com área de clique ampliada */}
          <div className="inline-flex scale-[1.15] items-center justify-center">
            <div className="rounded-xl border border-border/60 p-1.5 hover:bg-muted/60">
              <ThemeToggle />
            </div>
          </div>

          {/* Hambúrguer (mobile) */}
          <button
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            aria-label="Abrir/fechar menu"
            className="md:hidden rounded p-2 text-slate-800 outline-none ring-sky-700/30 focus:ring-2 dark:text-slate-100"
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
      </div>

      {/* Menu mobile */}
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
              'relative z-10 md:hidden overflow-hidden border-t',
              'bg-background/80 supports-[backdrop-filter]:backdrop-blur',
              'px-4 py-3',
              'bg-gradient-to-r from-sky-50 via-indigo-50 to-pink-50',
              'dark:from-gray-800 dark:via-gray-900 dark:to-gray-800',
            ].join(' ')}
          >
            <ul className="space-y-2">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <a
                      onClick={handleNav(item.href)}
                      aria-current={active ? 'page' : undefined}
                      className={[
                        'block cursor-pointer rounded px-3 py-2',
                        active
                          ? 'bg-sky-600/10 text-slate-900 ring-1 ring-sky-600/20 dark:bg-sky-300/15 dark:text-white dark:ring-sky-300/25'
                          : 'text-slate-800 hover:bg-white/50 dark:text-slate-100 dark:hover:bg-white/5',
                      ].join(' ')}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>

            {/* Tema dentro do menu mobile (maior também) */}
            <div className="mt-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Tema
                </span>
                <div className="scale-[1.15]">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
