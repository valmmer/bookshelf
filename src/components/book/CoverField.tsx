// src/components/book/CoverField.tsx
'use client';

import { useEffect, useRef } from 'react';
import CoverPreview from '@/components/book/CoverPreview';

type Props = {
  /** valor atual do campo cover (pode ser URL absoluta, caminho do public/ ou blob: para prévia local) */
  value?: string;
  /** chamado quando a URL muda (integra com RHF via setValue) */
  onChangeUrl: (url: string | undefined) => void;
  /** mensagem de erro de validação (exibida abaixo do input) */
  error?: string;
  /** placeholder opcional no input */
  placeholder?: string;
};

export default function CoverField({
  value,
  onChangeUrl,
  error,
  placeholder = '/covers/16-luas.jpg',
}: Props) {
  // guardamos o último blob criado para dar URL.revokeObjectURL e evitar vazamento de memória
  const lastBlobUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // quando a URL mudar e for um blob antigo, podemos revogar
  useEffect(() => {
    return () => {
      if (lastBlobUrlRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(lastBlobUrlRef.current);
        lastBlobUrlRef.current = null;
      }
    };
  }, []);

  function handlePickLocalFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // libera o blob anterior (se houver)
    if (lastBlobUrlRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(lastBlobUrlRef.current);
      lastBlobUrlRef.current = null;
    }
    // cria URL temporária só para PRÉVIA
    const objectUrl = URL.createObjectURL(file);
    lastBlobUrlRef.current = objectUrl;
    onChangeUrl(objectUrl); // atualiza o form com a URL temporária de prévia
  }

  function handleClear() {
    // libera blob antigo se for o caso
    if (lastBlobUrlRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(lastBlobUrlRef.current);
      lastBlobUrlRef.current = null;
    }
    onChangeUrl(undefined);
    // limpa o input file (para poder escolher o mesmo arquivo de novo se quiser)
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div>
      {/* Pré-visualização */}
      <CoverPreview url={value} alt="Capa do livro" />
      <p className="mt-2 text-xs text-slate-500">Prévia da capa</p>

      {/* Ações rápidas: escolher arquivo local ou limpar */}
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Selecionar imagem…
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Limpar
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePickLocalFile}
        />
      </div>

      {/* Campo de URL/caminho (persiste de verdade se for do /public ou URL externa) */}
      <div className="mt-3">
        <label className="mb-1 block text-sm font-medium">URL da capa</label>
        <input
          value={value ?? ''}
          onChange={(e) => onChangeUrl(e.target.value || undefined)}
          className="w-full rounded-md border px-3 py-2"
          placeholder={placeholder}
        />
        {error ? (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">
            Dica: para persistir, coloque a imagem em{' '}
            <code>public/covers/</code> e use o caminho começando por{' '}
            <code>/covers/</code>. Ex.: <code>/covers/16-luas.jpg</code>
          </p>
        )}
      </div>
    </div>
  );
}
