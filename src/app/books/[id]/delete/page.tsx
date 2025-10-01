// src/app/books/[id]/delete/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/ToastProvider';

export default function DeleteBookPage() {
  const params = useParams<{ id: string }>();
  const idStr = params?.id;
  const id = Number(idStr);
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!Number.isFinite(id)) {
      showToast({ title: 'Erro', message: 'ID inválido.', variant: 'error' });
      return;
    }
    if (!confirm('Tem certeza que deseja excluir este livro?')) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Falha ao excluir (${res.status})`);
      }
      showToast({
        title: 'Livro excluído',
        message: 'Removido com sucesso.',
        variant: 'success',
      });
      // volta para a biblioteca e força revalidação
      router.replace('/library');
      router.refresh();
    } catch (err: any) {
      showToast({
        title: 'Erro ao excluir',
        message: err?.message ?? 'Tente novamente.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">Excluir livro</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Esta ação é permanente. Tem certeza de que deseja excluir o livro #
        {idStr}?
      </p>

      <div className="flex gap-2">
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Excluindo…' : 'Confirmar exclusão'}
        </Button>

        <Button asChild variant="outline">
          <Link href={`/books/${idStr}`}>Cancelar</Link>
        </Button>
      </div>
    </main>
  );
}
