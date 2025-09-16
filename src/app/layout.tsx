// src/app/layout.tsx
import type { Metadata } from 'next';
import '@/app/globals.css';
import Header from '@/components/Header';
import Footer from '@/components/layout/Footer';
import { BooksProvider } from '@/store/books';
import { ToastProvider } from '@/components/ui/ToastProvider';

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
    <html lang="pt-BR">
      {/* body como flex-col para grudar footer no fim */}
      <body className="flex min-h-screen flex-col bg-white text-slate-900">
        <ToastProvider>
          <BooksProvider>
            <Header />
            {/* main cresce para empurrar o footer para a base */}
            <main className="flex-1">{children}</main>
            <Footer />
          </BooksProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
