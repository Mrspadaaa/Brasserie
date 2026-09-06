import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CashflowBarChartProps {
  apports: number;
  charges: number;
  disponible: number;
}

export const CashflowBarChart: React.FC<CashflowBarChartProps> = ({
  apports,
  charges,
  disponible
}) => {
  const data = [
    { name: 'Apports', amount: apports, color: '#3b82f6' },
    { name: 'Charges', amount: charges, color: '#f43f5e' },
    { name: 'Disponible', amount: disponible, color: '#10b981' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-cave-900 border border-cave-700 p-2.5 rounded-2xl shadow-xl text-sm text-cave-50">
          <div className="font-bold">{p.name}</div>
          <div className="font-mono text-ebc-straw font-bold mt-0.5">
            {p.amount.toLocaleString('fr-CH', { minimumFractionDigits: 2 })} CHF
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 rounded-3xl bg-cave-900 border border-cave-800 shadow-xl space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-footnote text-ebc-straw uppercase font-bold tracking-wider">
            Flux de Trésorerie Global
          </span>
          <h3 className="font-bold text-sm text-cave-50">Solde & Engagements Réels</h3>
        </div>
        <span className="text-sm font-black text-hop font-mono">
          +{disponible.toLocaleString('fr-CH', { minimumFractionDigits: 0 })} CHF dispo
        </span>
      </div>

      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${Math.round(v)}`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
