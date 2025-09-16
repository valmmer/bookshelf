// src/components/dashboard/KpiCard.tsx
'use client';

type Props = {
  label: string;
  value: number | string;
  hint?: string;
};

export default function KpiCard({ label, value, hint }: Props) {
  return (
    <div className="rounded-2xl border border-slate-300 px-5 py-4 shadow-sm">
      <div className="text-3xl font-semibold leading-none tracking-tight">
        {value}
      </div>
      <div className="mt-1 text-sm text-slate-600">{label}</div>
      {hint ? (
        <div className="mt-0.5 text-xs text-slate-500">{hint}</div>
      ) : null}
    </div>
  );
}
