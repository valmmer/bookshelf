// src/components/Header.tsx
'use client';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold">BookShelf</Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/library" className="hover:underline">Biblioteca</Link>
          <Link href="/books/new" className="hover:underline">Novo</Link>
        </nav>
      </div>
    </header>
  );
}
