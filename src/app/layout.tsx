// src/app/layout.tsx
import type { Metadata } from 'next';
import '@/app/globals.css';
import { Roboto } from 'next/font/google';

// ✅ Componentes de layout
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// ✅ Providers (precisam ser Client Components)
//    garanta que os arquivos BooksProvider e ToastProvider
//    comecem com 'use client'
import { BooksProvider } from '@/store/books';
import { ToastProvider } from '@/components/ui/ToastProvider';

// ⚙️ Fonte otimizada via next/font (carrega CSS crítico automaticamente)
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap', // evita flash de fonte bloqueando render
});

export const metadata: Metadata = {
  title: 'BookShelf',
  description: 'Gerencie sua biblioteca pessoal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ⚠️ Se você for alternar o tema no cliente, pode usar
    // suppressHydrationWarning para evitar mismatch do className.
    // <html lang="pt-BR" className={roboto.className} suppressHydrationWarning>
    <html lang="pt-BR" className={roboto.className}>
      {/* 
        📌 IMPORTANTE:
        - Este layout é um Server Component (por padrão).
        - Podemos renderizar Client Components (Providers) DENTRO do <body>.
        - O que estiver aqui PERSISTE entre rotas do App Router.
      */}
      <body className="flex min-h-screen flex-col bg-white text-slate-900">
        {/* 
          🔔 ToastProvider: mantém um portal/global state para toasts.
          Colocamos FORA do BooksProvider para que toasts funcionem em
          qualquer lugar, independente do estado da store.
        */}
        <ToastProvider>
          {/* 
            📚 BooksProvider: CONTEXTO GLOBAL da biblioteca.
            Fica NO LAYOUT RAIZ para NÃO re-montar a cada navegação.
            Isso garante que o estado + localStorage funcionem de forma
            consistente (hidratação/persistência).
          */}
          <BooksProvider>
            {/* 
              🧭 Header e Footer: componentes estáveis do layout.
              Se algum for Client Component, tudo bem — o App Router
              mantém a árvore montada.
            */}
            <Header />

            {/* 
              🧩 Área principal de páginas.
              Mantemos paddings responsivos e flex-grow para empurrar
              o Footer para o final da página.
            */}
            <main className="flex-grow px-4 sm:px-6 lg:px-12">{children}</main>

            <Footer />
          </BooksProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
