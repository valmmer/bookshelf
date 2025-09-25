// src/components/dashboard/KpiCard.tsx
import { FC, JSX } from 'react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  icon: JSX.Element;
  label: string;
  value: number;
  bgColor?: string;
  labelColor?: string;
  valueColor?: string;
  className?: string;
}

const KpiCard: FC<KpiCardProps> = ({
  icon,
  label,
  value,
  bgColor,
  labelColor,
  valueColor,
  className,
}) => {
  // Defaults amigáveis a Light/Dark (podem ser sobrescritos por props)
  const bg = bgColor ?? 'bg-card';
  const labelCls = labelColor ?? 'text-muted-foreground';
  const valueCls = valueColor ?? 'text-foreground';

  return (
    <div
      className={cn(
        'rounded-xl border border-border p-4 shadow-sm transition',
        'hover:shadow-md focus-within:shadow-md',
        bg,
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Ícone em destaque */}
        <div className="text-3xl text-primary">{icon}</div>

        {/* Texto */}
        <div>
          <p className={cn('text-sm', labelCls)}>{label}</p>
          <p className={cn('text-xl font-semibold leading-tight', valueCls)}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default KpiCard;
