// src/components/book/BookActions.tsx
'use client';

/**
 * Ações do livro:
 * - Abrir, Editar, Ler, Excluir
 * - Alterar Status (dropdown)
 * - Avaliar (0..5) — clicar na mesma estrela novamente zera a nota (toggle)
 *
 * Importante: startTransition NÃO recebe função async. Use IIFE async dentro.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  Loader2,
  ExternalLink,
  Pencil,
  BookOpen,
  Trash2,
  Check,
  Pause,
  Flame,
  Bookmark,
  Star,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import {
  deleteBookAction,
  markStatusAction,
  rateBookAction,
} from '@/app/actions/bookActions';

import type { ReadingStatus } from '@/server/db/types';

type Props = {
  id: number;
  fileUrl?: string | null;
  currentStatus?: ReadingStatus | null;
  currentRating?: number | null;
};

const STATUS_ITEMS: Array<{
  key: ReadingStatus;
  label: string;
  icon: React.ComponentType<any>;
}> = [
  { key: 'QUERO_LER', label: 'Quero ler', icon: Bookmark },
  { key: 'LENDO', label: 'Lendo', icon: Flame },
  { key: 'LIDO', label: 'Concluído', icon: Check },
  { key: 'PAUSADO', label: 'Pausado', icon: Pause },
  { key: 'ABANDONADO', label: 'Abandonado', icon: Trash2 },
];

export default function BookActions({
  id,
  fileUrl,
  currentStatus,
  currentRating,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [busy, setBusy] = useState<
    null | 'open' | 'edit' | 'read' | 'delete' | 'status' | 'rate'
  >(null);

  const [localRating, setLocalRating] = useState<number>(
    Math.max(0, Math.min(5, Number(currentRating ?? 0)))
  );

  const readingDisabled = !fileUrl;
  const loading = (k: typeof busy) => pending || busy === k;

  /** Alterar status */
  const setStatus = (status: ReadingStatus) => {
    setBusy('status');
    startTransition(() => {
      void (async () => {
        try {
          const res = await markStatusAction(id, status);
          if (!res.ok) {
            toast.error('Não foi possível alterar o status', {
              description: res.error,
            });
            return;
          }
          toast.success(
            `Status alterado para “${
              STATUS_ITEMS.find((s) => s.key === status)?.label ?? status
            }”.`
          );
          router.refresh();
        } catch (e: any) {
          toast.error('Falha ao alterar status', { description: e?.message });
        } finally {
          setBusy(null);
        }
      })();
    });
  };

  /** Excluir livro (com confirmação) */
  const onDelete = () => {
    toast('Excluir este livro?', {
      description: 'Essa ação não pode ser desfeita.',
      action: {
        label: 'Excluir',
        onClick: () => {
          setBusy('delete');
          startTransition(() => {
            void (async () => {
              try {
                const res = await deleteBookAction(id);
                if (!res.ok) {
                  toast.error('Falha ao excluir', { description: res.error });
                  return;
                }
                toast.success('Livro excluído.');
                router.refresh();
              } catch (e: any) {
                toast.error('Erro inesperado', { description: e?.message });
              } finally {
                setBusy(null);
              }
            })();
          });
        },
      },
    });
  };

  /** Avaliação — clicar na mesma estrela zera (toggle) */
  const onRate = (value: number) => {
    const newValue = value === localRating ? 0 : value;
    setBusy('rate');
    setLocalRating(newValue); // feedback imediato

    startTransition(() => {
      void (async () => {
        try {
          const res = await rateBookAction(id, newValue);
          if (!res.ok) {
            toast.error('Falha ao avaliar', { description: res.error });
            // rollback local
            setLocalRating(
              Math.max(0, Math.min(5, Number(currentRating ?? 0)))
            );
            return;
          }
          toast.success(newValue ? 'Avaliação salva.' : 'Avaliação removida.');
          router.refresh();
        } catch (e: any) {
          toast.error('Erro inesperado', { description: e?.message });
          setLocalRating(Math.max(0, Math.min(5, Number(currentRating ?? 0))));
        } finally {
          setBusy(null);
        }
      })();
    });
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Linha 1: Abrir / Editar */}
      <div className="grid grid-cols-2 gap-2">
        <Link href={`/books/${id}`} onClick={() => setBusy('open')}>
          <Button
            variant="outline"
            className="w-full h-9 justify-center gap-1 rounded-lg"
            disabled={loading('open')}
          >
            {loading('open') ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            <span className="text-sm">Abrir</span>
          </Button>
        </Link>

        <Link href={`/books/${id}/edit`} onClick={() => setBusy('edit')}>
          <Button
            variant="outline"
            className="w-full h-9 justify-center gap-1 rounded-lg"
            disabled={loading('edit')}
          >
            {loading('edit') ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            <span className="text-sm">Editar</span>
          </Button>
        </Link>
      </div>

      {/* Linha 2: Ler / Excluir */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/books/${id}/read`}
          onClick={
            readingDisabled
              ? (e) => {
                  e.preventDefault();
                  toast.warning('Este livro não possui PDF.');
                }
              : () => setBusy('read')
          }
        >
          <Button
            className="w-full h-9 justify-center gap-1 rounded-lg"
            disabled={readingDisabled || loading('read')}
          >
            {loading('read') ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BookOpen className="h-4 w-4" />
            )}
            <span className="text-sm">Ler</span>
          </Button>
        </Link>

        <Button
          variant="destructive"
          className="w-full h-9 justify-center gap-1 rounded-lg"
          onClick={onDelete}
          disabled={loading('delete')}
        >
          {loading('delete') ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          <span className="text-sm">Excluir</span>
        </Button>
      </div>

      {/* Linha 3: Status (dropdown) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-9 justify-center gap-1 rounded-lg"
            disabled={loading('status')}
          >
            {loading('status') ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            <span className="text-sm">
              Status:{' '}
              {STATUS_ITEMS.find(
                (s) => s.key === (currentStatus as ReadingStatus)
              )?.label ?? 'Definir'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Alterar status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STATUS_ITEMS.map(({ key, label, icon: Icon }) => (
            <DropdownMenuItem
              key={key}
              onClick={() => setStatus(key)}
              disabled={loading('status')}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Linha 4: Avaliação (sem botão "Limpar") */}
      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <span className="text-xs text-muted-foreground">Avaliação</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => {
            const value = i + 1;
            const filled = value <= localRating;
            return (
              <button
                key={i}
                aria-label={`Dar ${value} estrela${i ? 's' : ''}`}
                className={`p-1 ${
                  filled
                    ? 'text-yellow-500'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => onRate(value)} // clicar na mesma estrela → zera
                disabled={loading('rate')}
                title={`${value}`}
              >
                <Star className={`h-5 w-5 ${filled ? 'fill-current' : ''}`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
