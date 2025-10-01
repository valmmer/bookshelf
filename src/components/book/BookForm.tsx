// src/components/book/BookForm.tsx
'use client';

import { useId } from 'react';
import { useFormStatus } from 'react-dom';
import type { ReadingStatus } from '@/server/db/types';
import { Button } from '@/components/ui/button';

type BaseValues = {
  title?: string | null;
  author?: string | null;
  year?: number | null;
  pages?: number | null;
  currentPage?: number | null;
  status?: ReadingStatus | null;
  cover?: string | null;
  fileUrl?: string | null;
  synopsis?: string | null;
  rating?: number | null;
  genre?: string | null;
  isbn?: string | null;
  notes?: string | null;
};

type CreateProps = {
  mode: 'create';
  /** Server Action recebida do Server Component */
  action: (formData: FormData) => Promise<any>;
  defaults?: BaseValues;
};

type EditProps = {
  mode: 'edit';
  /** Server Action recebida do Server Component (bind com o id) */
  action: (formData: FormData) => Promise<any>;
  defaults: BaseValues;
};

type Props = CreateProps | EditProps;

const statuses: { key: ReadingStatus; label: string }[] = [
  { key: 'QUERO_LER', label: 'Quero ler' },
  { key: 'LENDO', label: 'Lendo' },
  { key: 'LIDO', label: 'Concluído' },
  { key: 'PAUSADO', label: 'Pausado' },
  { key: 'ABANDONADO', label: 'Abandonado' },
];

function SubmitBtn({ mode }: { mode: 'create' | 'edit' }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? mode === 'create'
          ? 'Criando…'
          : 'Salvando…'
        : mode === 'create'
        ? 'Criar'
        : 'Salvar'}
    </Button>
  );
}

export default function BookForm(props: Props) {
  const d: BaseValues =
    props.mode === 'edit'
      ? props.defaults ?? {}
      : {
          ...(props.defaults ?? {}),
          status: (props.defaults?.status ?? 'QUERO_LER') as ReadingStatus,
        };

  // ids estáveis para labels/inputs (a11y)
  const fid = (name: string) => `${useId()}-${name}`;

  return (
    <form action={props.action} className="mx-auto w-full max-w-2xl">
      <div className="rounded-xl border bg-[rgb(var(--card))] p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Título */}
          <div className="md:col-span-2">
            <label
              htmlFor={fid('title')}
              className="block text-xs font-medium text-muted-foreground"
            >
              Título *
            </label>
            <input
              id={fid('title')}
              name="title"
              required
              defaultValue={d.title ?? ''}
              placeholder="Ex.: A Arte da Guerra"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Autor */}
          <div>
            <label
              htmlFor={fid('author')}
              className="block text-xs font-medium text-muted-foreground"
            >
              Autor
            </label>
            <input
              id={fid('author')}
              name="author"
              defaultValue={d.author ?? ''}
              placeholder="Ex.: Sun Tzu"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Ano */}
          <div>
            <label
              htmlFor={fid('year')}
              className="block text-xs font-medium text-muted-foreground"
            >
              Ano
            </label>
            <input
              id={fid('year')}
              name="year"
              type="number"
              min={0}
              defaultValue={d.year ?? ''}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Páginas */}
          <div>
            <label
              htmlFor={fid('pages')}
              className="block text-xs font-medium text-muted-foreground"
            >
              Páginas
            </label>
            <input
              id={fid('pages')}
              name="pages"
              type="number"
              min={0}
              defaultValue={d.pages ?? ''}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Página atual */}
          <div>
            <label
              htmlFor={fid('currentPage')}
              className="block text-xs font-medium text-muted-foreground"
            >
              Página atual
            </label>
            <input
              id={fid('currentPage')}
              name="currentPage"
              type="number"
              min={0}
              defaultValue={d.currentPage ?? 0}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor={fid('status')}
              className="block text-xs font-medium text-muted-foreground"
            >
              Status
            </label>
            <select
              id={fid('status')}
              name="status"
              defaultValue={(d.status as ReadingStatus) ?? 'QUERO_LER'}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {statuses.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Gênero (texto livre) */}
          <div>
            <label
              htmlFor={fid('genre')}
              className="block text-xs font-medium text-muted-foreground"
            >
              Gênero
            </label>
            <input
              id={fid('genre')}
              name="genre"
              defaultValue={d.genre ?? ''}
              placeholder="Ex.: Estratégia"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Capa */}
          <div className="md:col-span-2">
            <label
              htmlFor={fid('cover')}
              className="block text-xs font-medium text-muted-foreground"
            >
              URL da capa
            </label>
            <input
              id={fid('cover')}
              name="cover"
              defaultValue={d.cover ?? ''}
              placeholder="/covers/arquivo.jpg"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* PDF */}
          <div className="md:col-span-2">
            <label
              htmlFor={fid('fileUrl')}
              className="block text-xs font-medium text-muted-foreground"
            >
              URL do PDF
            </label>
            <input
              id={fid('fileUrl')}
              name="fileUrl"
              defaultValue={d.fileUrl ?? ''}
              placeholder="/ebooks/arquivo.pdf"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Avaliação */}
          <div>
            <label
              htmlFor={fid('rating')}
              className="block text-xs font-medium text-muted-foreground"
            >
              Avaliação (0–5)
            </label>
            <input
              id={fid('rating')}
              name="rating"
              type="number"
              min={0}
              max={5}
              defaultValue={d.rating ?? ''}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* ISBN */}
          <div>
            <label
              htmlFor={fid('isbn')}
              className="block text-xs font-medium text-muted-foreground"
            >
              ISBN
            </label>
            <input
              id={fid('isbn')}
              name="isbn"
              defaultValue={d.isbn ?? ''}
              placeholder="Opcional"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Sinopse */}
          <div className="md:col-span-2">
            <label
              htmlFor={fid('synopsis')}
              className="block text-xs font-medium text-muted-foreground"
            >
              Sinopse
            </label>
            <textarea
              id={fid('synopsis')}
              name="synopsis"
              defaultValue={d.synopsis ?? ''}
              rows={4}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Notas */}
          <div className="md:col-span-2">
            <label
              htmlFor={fid('notes')}
              className="block text-xs font-medium text-muted-foreground"
            >
              Notas
            </label>
            <textarea
              id={fid('notes')}
              name="notes"
              defaultValue={d.notes ?? ''}
              rows={3}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Ações */}
        <div className="mt-4 flex items-center justify-end gap-2">
          {/* botão de cancelar: deixe o back simples; se quiser, pode trocar para /library */}
          <a
            href="/library"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Cancelar
          </a>
          <SubmitBtn mode={props.mode} />
        </div>
      </div>
    </form>
  );
}
