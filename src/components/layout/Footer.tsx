// src/components/layout/Footer.tsx

import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4 text-sm text-slate-600">
        <p className="truncate">© {year} BookShelf — feito com Next.js</p>
        <nav className="flex flex-wrap items-center gap-3">
          <Link href="/library" className="hover:underline">
            Biblioteca
          </Link>
          <Link href="/books/new" className="hover:underline">
            Adicionar livro
          </Link>
          <Link href="/" className="hover:underline">
            Início
          </Link>
        </nav>
      </div>
    </footer>
  );
}
