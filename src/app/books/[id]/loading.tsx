// src/app/books/[id]/loading.tsx
export default function BookLoading() {
  return (
    <main className="px-4 py-8 max-w-3xl mx-auto">
      <div className="space-y-6">
        {/* Skeleton para o título */}
        <div className="h-8 bg-slate-200 animate-pulse rounded-md w-1/3" />

        {/* Skeleton para a descrição do livro */}
        <div className="h-6 bg-slate-200 animate-pulse rounded-md w-1/4" />

        {/* Skeleton para a imagem de capa */}
        <div className="h-48 bg-slate-200 animate-pulse rounded-md w-32" />

        {/* Skeleton para a barra de progresso */}
        <div className="h-2 bg-slate-200 animate-pulse rounded-full w-full" />

        {/* Skeleton para metadados do livro */}
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 animate-pulse rounded-md w-1/2" />
          <div className="h-4 bg-slate-200 animate-pulse rounded-md w-3/4" />
        </div>
      </div>
    </main>
  );
}
