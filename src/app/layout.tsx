// src/app/layout.tsx
import type { Metadata } from 'next';
import '@/app/globals.css';
import { Roboto } from 'next/font/google';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

import { BooksProvider } from '@/store/books';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BookShelf',
  description: 'Sua biblioteca pessoal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const noFlash = `
  (function() {
    try {
      var key = 'bookshelf-theme';
      var theme = localStorage.getItem(key);
      if (!theme || theme === 'system') {
        var m = window.matchMedia('(prefers-color-scheme: dark)');
        if (m.matches) document.documentElement.classList.add('dark');
      } else if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  })();`;

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>

      {/* ⬅️ min-h-screen + flex col garantem footer no rodapé mesmo com pouco conteúdo */}
      <body className={`${roboto.className} min-h-screen flex flex-col`}>
        <ThemeProvider>
          <ToastProvider>
            <BooksProvider>
              <Header />

              {/* ⬅️ flex-1 ocupa o espaço livre entre header e footer */}
              <main className="flex-1 px-4 sm:px-6 lg:px-12">{children}</main>

              <Footer />
            </BooksProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
