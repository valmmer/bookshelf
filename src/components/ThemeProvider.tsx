'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

type Props = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: Props) {
  return (
    <NextThemesProvider
      attribute="class" // ← add/remove "dark" no <html>
      defaultTheme="system" // ← padrão: seguir sistema
      enableSystem // ← permite alternar conforme SO
      disableTransitionOnChange // ← reduz flicker
      storageKey="bookshelf-theme" // ← chave do localStorage
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
