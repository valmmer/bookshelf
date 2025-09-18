// src/components/skeleton/Skeleton.tsx
'use client';

/**
 * Skeleton básico com efeito shimmer (brilho animado).
 * Use a prop `className` para ajustar altura/largura/formato.
 */
export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-slate-200 ${className}`}
      role="status"
      aria-label="Carregando"
    >
      <span className="sr-only">Carregando…</span>

      {/* Barra de brilho animada (shimmer) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"
      />

      {/* Keyframes customizados para o shimmer */}
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
