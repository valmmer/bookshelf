// src/components/dashboard/KpiCard.tsx
import { FC, JSX } from 'react';

interface KpiCardProps {
  icon: JSX.Element; // Aceita ícones do tipo JSX.Element
  label: string;
  value: number;
  bgColor: string; // Cor de fundo do card
  labelColor: string; // Cor do texto do label
  valueColor: string; // Cor do texto do valor
}

const KpiCard: FC<KpiCardProps> = ({
  icon,
  label,
  value,
  bgColor,
  labelColor,
  valueColor,
}) => {
  return (
    <div
      className={`rounded-lg p-4 ${bgColor} shadow-lg hover:shadow-xl transition-all duration-300`}
    >
      <div className="flex items-center gap-4">
        {/* Ícone */}
        <div className="text-3xl text-primary">{icon}</div>
        {/* Informações do KPI */}
        <div>
          <p className={`text-sm ${labelColor}`}>{label}</p>
          <p className={`text-xl font-semibold ${valueColor}`}>{value}</p>
        </div>
      </div>
    </div>
  );
};

export default KpiCard;
