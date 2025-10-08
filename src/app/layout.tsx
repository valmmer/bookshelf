
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// src/app/layout.tsx
import type { Metadata } from 'next';
import Script from 'next/script';
import '@/app/globals.css';
import { Roboto } from 'next/font/google';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { BooksProvider } from '@/store/books';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

// ✅ next/font já cuida de preload/swap e evita layout shift de fonte
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
});

// ✅ Metadata centralizada: deixe o Next gerar <head> automaticamente
export const metadata: Metadata = {
  title: { default: 'BookShelf', template: '%s | BookShelf' },
  description: 'Sua biblioteca pessoal',
  // Evita warning de URL relativa em ambientes sem NEXT_PUBLIC_SITE_URL
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ),
  // Aponte apenas para arquivos reais em /public
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    // apple: '/apple-touch-icon.png', // habilite só se existir
  },
  // Manter manifest desativado enquanto não houver ícones gerados
  manifest: undefined,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ Script anti-flash: aplica "dark" cedo se tema = system/dark
  //    IMPORTANTE: alinhar a mesma key do seu ThemeProvider (bookshelf-theme)
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
    })();
  `;

  return (
    // ✅ suppressHydrationWarning: evita dif entre server/client ao trocar tema
    <html lang="pt-BR" suppressHydrationWarning>
      {/* ❌ Não criar <head> manual. O Next lida via `metadata` */}
      <body className={`${roboto.className} min-h-screen flex flex-col`}>
        {/* Carrega o anti-flash ANTES de qualquer render do app */}
        <Script
          id="no-flash"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: noFlash }}
        />

        {/* 🔒 Ordem dos providers:
            - ThemeProvider (classe .dark no <html>/<body>)
            - ToastProvider (toasts globais)
            - BooksProvider (estado do app)
        */}
        <ThemeProvider>
          <ToastProvider>
            <BooksProvider>
              <Header />

              {/* 
                🔧 MAIN: layout simples, sem quebrar seu padrão visual.
                Se quiser evitar conteúdo encostado nas bordas, ative a linha
                com "container" abaixo (opcional e sem mudar tema):
              */}
              <main className="flex-1">
                <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                  {children}
                </div>
              </main>

              <Footer />
            </BooksProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
