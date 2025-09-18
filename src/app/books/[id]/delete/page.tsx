// src/app/books/[id]/delete/page.tsx
'use client';

import { useRouter } from 'next/router';
import { useBooks } from '@/store/books';
import { useState } from 'react';

export default function DeleteBookPage() {
  const router = useRouter();
  const { id } = router.query; // Captura o id do livro na URL
  const { deleteBook } = useBooks();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleDelete = () => {
    deleteBook(id as string); // Exclui o livro do estado global
    router.push('/library'); // Redireciona para a biblioteca
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Excluir Livro</h1>
      <p className="mb-4">Tem certeza de que deseja excluir este livro?</p>

      <div className="flex gap-2">
        {!isConfirming ? (
          <button
            onClick={() => setIsConfirming(true)}
            className="rounded-md bg-red-500 px-4 py-2 text-sm text-white"
          >
            Sim, Excluir
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="rounded-md bg-red-700 px-4 py-2 text-sm text-white"
            >
              Confirmar Exclusão
            </button>
            <button
              onClick={() => setIsConfirming(false)}
              className="rounded-md bg-gray-400 px-4 py-2 text-sm text-white"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
