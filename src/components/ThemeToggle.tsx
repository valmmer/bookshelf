// src/components/ThemeToggle.tsx
//
// Botão para alternar entre tema claro (light) e escuro (dark)
// usando next-themes. Mostra um ícone simples e atualiza a classe
// `dark` no <html> automaticamente (ThemeProvider em layout.tsx).
//
// Acessibilidade: tem rótulo visível para leitores de tela e
// title no botão para dica visual.

'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Evita "hydration mismatch": só renderiza o ícone depois que montar no client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Alterna entre "light" e "dark"
  function toggle() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-9 items-center rounded-md border px-3 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
      aria-label="Alternar tema claro/escuro"
      title="Alternar tema"
    >
      {/* Ícone simples em texto para manter leve; se quiser pode trocar por lucide-react */}
      {mounted ? (theme === 'dark' ? '☀️ Claro' : '🌙 Escuro') : 'Tema'}
    </button>
  );
}
