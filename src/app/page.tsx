// app/page.tsx
// Server Component — lê do Prisma e renderiza tudo no servidor.

import Link from 'next/link';
import Image from 'next/image';
import { listBooks } from '@/server/db/books';
import KpiCard from '@/components/dashboard/KpiCard';
import { Progress } from '@/components/ui/progress';
import Badge from '@/components/ui/badge';
import { FaBook, FaBookReader, FaTasks, FaClipboardList } from 'react-icons/fa';

/* ───────────────────────────────────────────────
 * Helpers de status/leitura (mantém sua regra)
 * ─────────────────────────────────────────────── */
function isFinished(b: any): boolean {
  const status = (b.status ?? '').toString().toUpperCase();
  const cp = typeof b.currentPage === 'number' ? b.currentPage : 0; // 0-based no DB
  const pages = typeof b.pages === 'number' ? b.pages : undefined;
  if (status === 'LIDO') return true;
  if (pages !== undefined && pages > 0 && cp >= pages) return true;
  return false;
}
function isReading(b: any): boolean {
  const status = (b.status ?? '').toString().toUpperCase();
  const cp = typeof b.currentPage === 'number' ? b.currentPage : 0;
  if (status === 'LENDO') return true;
  if (cp > 0 && !isFinished(b)) return true;
  return false;
}

/** Badge de status com as mesmas cores do BookCard */
function StatusBadge({ status }: { status?: string | null }) {
  if (!status)
    return <Badge className="bg-muted text-foreground">Indefinido</Badge>;
  const map: Record<string, { label: string; className: string }> = {
    QUERO_LER: { label: 'Quero ler', className: 'bg-gray-200 text-gray-800' },
    LENDO: { label: 'Lendo', className: 'bg-blue-200 text-blue-800' },
    LIDO: { label: 'Concluído', className: 'bg-green-200 text-green-800' },
    PAUSADO: { label: 'Pausado', className: 'bg-yellow-200 text-yellow-800' },
    ABANDONADO: { label: 'Abandonado', className: 'bg-red-200 text-red-800' },
  };
  const k = (status || '').toUpperCase();
  const cfg = map[k] ?? {
    label: status,
    className: 'bg-muted text-foreground',
  };
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

export default async function HomePage() {
  const { items } = await listBooks({
    page: 1,
    pageSize: 200,
    orderBy: 'createdAt',
    orderDir: 'desc',
  });

  /* ───────────────── KPIs ──────────────── */
  const total = items.length;
  const lidos = items.filter(isFinished).length;
  const lendo = items.filter(isReading).length;
  const paginasLidas = items.reduce((acc, b) => {
    const cp = typeof b.currentPage === 'number' ? b.currentPage : 0;
    const pages = typeof b.pages === 'number' ? b.pages : undefined;
    return acc + Math.max(0, pages ? Math.min(cp, pages) : cp);
  }, 0);

  // cards “em progresso” (mostra só alguns)
  const emProgresso = items.filter(isReading).slice(0, 9);

  return (
    <main className="relative mx-auto max-w-6xl px-6 py-10">
      {/* Cabeçalho de boas-vindas */}
      <header className="mb-8">
        <div className="mx-auto max-w-3xl rounded-xl px-5 py-4 bg-background/70 supports-[backdrop-filter]:backdrop-blur-sm ring-1 ring-border/50 dark:bg-black/30 dark:ring-white/10">
          <h1 className="text-foreground text-4xl sm:text-5xl font-extrabold tracking-tight text-center">
            Bem-vindo(a) à sua jornada de leitura
          </h1>
          <p className="mt-3 text-center text-sm sm:text-base text-muted-foreground">
            Transforme cada capítulo em motivo de orgulho.
          </p>
        </div>
      </header>

      {/* KPIs (mantém seu KpiCard) */}
      <section className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: (
              <FaBook className="text-[rgb(var(--primary-foreground))] text-3xl" />
            ),
            label: 'Total de Livros',
            value: total,
            bg: 'bg-[rgb(var(--primary))]',
          },
          {
            icon: (
              <FaBookReader className="text-[rgb(var(--accent-foreground))] text-3xl" />
            ),
            label: 'Atualmente Lendo',
            value: lendo,
            bg: 'bg-[rgb(var(--accent))]',
          },
          {
            icon: (
              <FaTasks className="text-[rgb(var(--secondary-foreground))] text-3xl" />
            ),
            label: 'Livros Concluídos',
            value: lidos,
            bg: 'bg-[rgb(var(--secondary))]',
          },
          {
            icon: (
              <FaClipboardList className="text-[rgb(var(--foreground))] text-3xl" />
            ),
            label: 'Páginas Lidas',
            value: paginasLidas,
            bg: 'bg-[rgb(var(--card-foreground))]',
            valueColor: 'text-[rgb(var(--card))] font-bold text-2xl',
            labelColor: 'text-[rgb(var(--card))]/90',
          },
        ].map((kpi, i) => (
          <div
            key={i}
            className="transform-gpu transition hover:-translate-y-1 hover:scale-[1.03] hover:shadow-xl rounded-2xl"
          >
            <KpiCard
              icon={kpi.icon}
              label={kpi.label}
              value={kpi.value}
              bgColor={kpi.bg}
              labelColor={
                kpi.labelColor ?? 'text-[rgb(var(--primary-foreground))]/90'
              }
              valueColor={
                kpi.valueColor ??
                'text-[rgb(var(--primary-foreground))] font-bold text-2xl'
              }
            />
          </div>
        ))}
      </section>

      {/* “Atualmente lendo” com capa correta + status + progresso */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Atualmente lendo
          </h2>
          <Link
            href="/library"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2"
          >
            Ver biblioteca
          </Link>
        </div>

        {emProgresso.length === 0 ? (
          <p className="italic text-muted-foreground">
            Nenhum livro em andamento. Que tal começar um agora?{' '}
            <Link href="/books/new" className="underline">
              Adicionar livro
            </Link>
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {emProgresso.map((b) => {
              const pages = typeof b.pages === 'number' ? b.pages : 0;
              const cp0 = typeof b.currentPage === 'number' ? b.currentPage : 0; // 0-based (DB)
              const pct =
                pages > 0 ? Math.min(100, Math.round((cp0 / pages) * 100)) : 0;

              return (
                <li key={b.id}>
                  {/* Link no card todo para abrir o leitor */}
                  <Link
                    href={`/books/${b.id}/read`}
                    className="
                      group block rounded-xl border bg-[rgb(var(--card))] ring-1 ring-border/60
                      hover:-translate-y-[2px] hover:shadow-md transition transform-gpu
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2
                    "
                  >
                    <div className="flex gap-3 p-3">
                      {/* Capa: mantemos 3/4, sem cortar nem esticar */}
                      <div className="shrink-0 overflow-hidden rounded-lg border bg-muted/20">
                        <Image
                          src={b.cover || '/covers/placeholder-cover.jpg'}
                          alt={`Capa de ${b.title}`}
                          width={112} // ~ w-28
                          height={150} // 3/4
                          className="h-auto w-[112px] object-cover aspect-[3/4]"
                          sizes="112px"
                        />
                      </div>

                      {/* Conteúdo */}
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-base font-semibold text-foreground group-hover:text-[rgb(var(--accent))]">
                          {b.title ?? 'Sem título'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {b.author ?? 'Autor desconhecido'}
                        </p>

                        {/* Status */}
                        <div className="mt-2">
                          <StatusBadge status={b.status} />
                        </div>

                        {/* Barra de progresso + label (mostra “xx% • atual/total”) */}
                        <div className="mt-3">
                          <Progress
                            value={pct}
                            aria-label="Progresso de leitura"
                          />
                          <div className="mt-1 text-xs text-muted-foreground">
                            {pct}%
                            {pages
                              ? ` • ${Math.min(cp0, pages)}/${pages}`
                              : null}
                          </div>
                        </div>
                      </div>

                      {/* CTA sutil de leitura */}
                      <div className="self-start">
                        <span className="rounded-md border px-2 py-1 text-xs text-foreground/80 group-hover:bg-muted">
                          Ler →
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
