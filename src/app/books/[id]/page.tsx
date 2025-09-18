'use client';

/**
 * Página de detalhes do livro.
 * - Mostra capa + metadados + sinopse/notas
 * - Ações: Ler, Voltar, Editar, Excluir
 * - Efeitos de carregamento (spinners) nos botões ao clicar
 * - Diálogo de confirmação para excluir
 * - Barra de progresso visual (Progress do shadcn)
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ReadOnlyStars from '@/components/book/ReadOnlyStars';

import { useBooks } from '@/store/books'; // Store global (com persistência no localStorage)
import type { Book } from '@/types/book'; // Tipo Book vindo do store
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { useToast } from '@/components/ui/ToastProvider'; // Toasts de sucesso/erro
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Progress } from '@/components/ui/progress'; // Barra de progresso (Radix + shadcn)

/** Mini spinner visual reutilizável para os botões */
function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export default function BookDetailsPage() {
  /** Obtém o id da rota /books/[id] */
  const params = useParams<{ id: string | string[] }>();
  const id = useMemo(
    () => (Array.isArray(params.id) ? params.id[0] : params.id),
    [params.id]
  );

  const router = useRouter();
  const { state, deleteBook } = useBooks();
  const { showToast } = useToast();

  /** Busca o livro no estado global */
  const maybeBook: Book | undefined = state.books.find((b) => b.id === id);

  /** Se não encontrar, mostra uma tela simples de “não encontrado” */
  if (!maybeBook) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Início', href: '/' },
            { label: 'Biblioteca', href: '/library' },
            { label: 'Livro não encontrado' },
          ]}
        />
        <p className="text-slate-600">Livro não encontrado.</p>
        <Link
          href="/library"
          className="underline text-primary hover:text-blue-700"
        >
          Voltar
        </Link>
      </main>
    );
  }

  /** A partir daqui já temos o livro */
  const book: Book = maybeBook;

  /** Estado do diálogo de confirmação de exclusão */
  const [confirmOpen, setConfirmOpen] = useState(false);

  /** Estados de carregamento por ação (para trocar rótulo → spinner) */
  const [isReading, setReading] = useState(false);
  const [isBack, setBack] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const [isDeleting, setDeleting] = useState(false);

  /** Calcula o % de progresso (clamp 0–100) */
  const pct =
    typeof book.pages === 'number' &&
    book.pages > 0 &&
    typeof book.currentPage === 'number'
      ? Math.min(100, Math.round((book.currentPage / book.pages) * 100))
      : null;

  /** Ao clicar no botão Excluir (fora do diálogo), abre o modal */
  function handleDeleteClick() {
    setConfirmOpen(true);
  }

  /** Confirma exclusão dentro do modal */
  function confirmDelete() {
    setDeleting(true); // ativa spinner no botão “Excluir” da barra de ações
    deleteBook(book.id);
    setConfirmOpen(false);
    showToast({
      title: 'Livro excluído',
      message: `“${book.title}” foi removido.`,
      variant: 'success',
    });
    router.push('/library'); // navega e desmonta a página (spinners somem naturalmente)
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Navegação hierárquica */}
      <Breadcrumbs
        items={[
          { label: 'Início', href: '/' },
          { label: 'Biblioteca', href: '/library' },
          { label: book.title },
        ]}
      />

      {/* Ações principais com estados de carregamento */}
      <div className="mb-4 flex gap-2">
        {book.fileUrl && (
          <Link
            href={`/books/${book.id}/read`}
            onClick={() => setReading(true)}
            aria-busy={isReading}
            className={`inline-flex items-center rounded-md border px-3 py-1.5 text-sm transition-all duration-300 ${
              isReading ? 'pointer-events-none opacity-60' : 'hover:bg-slate-50'
            }`}
          >
            {isReading ? (
              <>
                <Spinner /> <span className="ml-2">Abrindo…</span>
              </>
            ) : (
              'Ler'
            )}
          </Link>
        )}

        <Link
          href="/library"
          onClick={() => setBack(true)}
          aria-busy={isBack}
          className={`inline-flex items-center rounded-md border px-3 py-1.5 text-sm transition-all duration-300 ${
            isBack ? 'pointer-events-none opacity-60' : 'hover:bg-slate-50'
          }`}
        >
          {isBack ? (
            <>
              <Spinner /> <span className="ml-2">Voltando…</span>
            </>
          ) : (
            'Voltar'
          )}
        </Link>

        <Link
          href={`/books/${book.id}/edit`}
          onClick={() => setEditing(true)}
          aria-busy={isEditing}
          className={`inline-flex items-center rounded-md border px-3 py-1.5 text-sm transition-all duration-300 ${
            isEditing ? 'pointer-events-none opacity-60' : 'hover:bg-slate-50'
          }`}
        >
          {isEditing ? (
            <>
              <Spinner /> <span className="ml-2">Abrindo editor…</span>
            </>
          ) : (
            'Editar'
          )}
        </Link>

        <button
          onClick={handleDeleteClick}
          aria-busy={isDeleting}
          disabled={isDeleting}
          className={`inline-flex items-center rounded-md border border-red-200 px-3 py-1.5 text-sm transition-all duration-200 ${
            isDeleting
              ? 'text-red-700 opacity-60'
              : 'text-red-700 hover:bg-red-50'
          }`}
        >
          {isDeleting ? (
            <>
              <Spinner /> <span className="ml-2">Excluindo…</span>
            </>
          ) : (
            'Excluir'
          )}
        </button>
      </div>

      {/* Capa + informações do livro */}
      <div className="flex items-start gap-4">
        {book.cover ? (
          // Dica: aqui você pode trocar para <Image /> do next com normalização de URL,
          // mas mantendo <img> simples funciona.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover}
            alt={book.title}
            className="h-40 w-28 flex-shrink-0 rounded-md object-cover transition-all duration-300 ease-in-out"
          />
        ) : (
          <div className="h-40 w-28 flex-shrink-0 rounded-md bg-slate-100" />
        )}

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-primary">{book.title}</h1>
          <p className="text-slate-600">
            {book.author}{' '}
            {typeof book.year === 'number' ? `• ${book.year}` : ''}
          </p>

          {/* Metadados */}
          <div className="mt-2 space-y-1 text-sm">
            {book.genre && <p>Gênero: {book.genre}</p>}
            {book.status && <p>Status: {book.status}</p>}

            {/* Avaliação em estrelas (texto com ícones).
               Se quiser, posso trocar por um componente ReadOnlyStars. */}
            {typeof book.rating === 'number' && book.rating > 0 && (
              <div className="mt-1">
                <ReadOnlyStars
                  value={book.rating}
                  max={5}
                  showValue
                  sizeRem={1.0}
                />
              </div>
            )}

            {/* ✅ Progresso visual (barra) */}
            {typeof pct === 'number' && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso</span>
                  <span aria-live="polite">{pct}%</span>
                </div>
                <Progress value={pct} className="mt-1 h-2" />
              </div>
            )}

            {/* Página atual / total */}
            {typeof book.pages === 'number' &&
              typeof book.currentPage === 'number' && (
                <p>
                  Página atual: {book.currentPage} / {book.pages}
                </p>
              )}
            {book.isbn && <p>ISBN: {book.isbn}</p>}
          </div>
        </div>
      </div>

      {/* Sinopse e Notas */}
      {book.synopsis && (
        <p className="mt-6 whitespace-pre-wrap">{book.synopsis}</p>
      )}
      {book.notes && (
        <>
          <h2 className="mt-8 text-lg font-medium">Notas</h2>
          <p className="mt-2 whitespace-pre-wrap">{book.notes}</p>
        </>
      )}

      {/* Diálogo de confirmação para excluir */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Excluir livro"
        description={`Confirma excluir “${book.title}”? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={confirmDelete}
      />
    </main>
  );
}
