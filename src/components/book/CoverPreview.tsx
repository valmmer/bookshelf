// src/components/book/CoverPreview.tsx
type Props = {
  url?: string;
  alt?: string;
  className?: string;
  /** use "3/4" se preferir; default "2/3" */
  ratio?: '2/3' | '3/4';
};

export default function CoverPreview({
  url,
  alt = 'Capa',
  className,
  ratio = '2/3',
}: Props) {
  const aspect = ratio === '3/4' ? 'aspect-[3/4]' : 'aspect-[2/3]';

  return (
    <div className={['mx-auto sm:mx-0', className].join(' ')}>
      <div
        className={[
          // largura controlada: NÃO usar w-full aqui
          'w-40 sm:w-48 lg:w-56',
          aspect,
          'overflow-hidden rounded-xl border bg-white dark:bg-slate-900',
        ].join(' ')}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
            Sem capa
          </div>
        )}
      </div>
    </div>
  );
}
