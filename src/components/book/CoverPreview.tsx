// src/components/book/CoverPreview.tsx
'use client';

import { useEffect, useState } from 'react';

type Props = {
  url?: string | null; // pode vir vazio
  alt?: string;
  className?: string;
  // tamanho padrão da capa no form; ajuste se quiser
  width?: number;
  height?: number;
  rounded?: string; // ex.: "rounded-lg"
};

export default function CoverPreview({
  url,
  alt = 'Capa do livro',
  className = '',
  width = 128, // 8rem
  height = 192, // 12rem (proporção 2:3)
  rounded = 'rounded-lg',
}: Props) {
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState(false);

  // quando a URL muda, tenta pré-carregar
  useEffect(() => {
    if (!url) {
      setLoading(false);
      setError(false);
      return;
    }
    setLoading(true);
    setError(false);

    const img = new Image();
    img.onload = () => setLoading(false);
    img.onerror = () => {
      setLoading(false);
      setError(true);
    };
    img.src = url;
  }, [url]);

  const boxClasses = `${rounded} border bg-slate-50 shadow-sm overflow-hidden ${className}`;

  // Placeholder (sem URL, erro ou carregando)
  if (!url || error || loading) {
    return (
      <div
        className={boxClasses}
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label={
          error ? 'Falha ao carregar capa' : 'Pré-visualização da capa'
        }
      >
        {loading ? (
          // Skeleton
          <div className="h-full w-full animate-pulse bg-slate-200" />
        ) : (
          // Ícone/placeholder simples
          <PlaceholderIcon />
        )}
      </div>
    );
  }

  // Imagem carregada
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={url}
      alt={alt}
      width={width}
      height={height}
      className={`${boxClasses} object-cover`}
      style={{ width, height }}
    />
  );
}

function PlaceholderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-10 w-10 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
      <path d="M3 15l4-4 3 3 5-5 6 6" />
      <circle cx="8.5" cy="8.5" r="1.25" />
    </svg>
  );
}
