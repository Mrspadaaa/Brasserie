import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction, FinanceCategory } from '../../types';

interface ExpenseDonutChartProps {
  transactions: Transaction[];
  onSelectCategory?: (cat: FinanceCategory) => void;
  selectedCategory?: string;
}

export const ExpenseDonutChart: React.FC<ExpenseDonutChartProps> = ({
  transactions,
  onSelectCategory,
  selectedCategory
}) => {
  // Aggregate real expenses by category
  const categoryTotals: Record<string, { name: string; value: number; color: string; cat: FinanceCategory }> = {
    renovation: { name: 'Local & Rénovation', value: 0, color: '#f59e0b', cat: 'renovation' },
    brassage: { name: 'Malt & Houblon', value: 0, color: '#10b981', cat: 'brassage' },
    materiel: { name: 'Matériel & Outils', value: 0, color: '#3b82f6', cat: 'materiel' },
    nettoyage: { name: 'Nettoyage & CIP', value: 0, color: '#ec4899', cat: 'nettoyage' },
    chargesFixes: { name: 'Charges Fixes', value: 0, color: '#8b5cf6', cat: 'chargesFixes' },
    divers: { name: 'Frais Divers', value: 0, color: '#64748b', cat: 'divers' }
  };

  transactions.forEach((tx) => {
    if (tx.category !== 'apports' && tx.category !== 'recettes' && categoryTotals[tx.category]) {
      categoryTotals[tx.category].value += tx.amountTTC || tx.amountHT;
    }
  });

  const data = Object.values(categoryTotals).filter((item) => item.value > 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      const pct = totalExpenses > 0 ? ((p.value / totalExpenses) * 100).toFixed(1) : '0';
      return (
        <div className="bg-cave-900/95 border border-cave-700 p-2.5 rounded-2xl shadow-xl text-sm text-cave-50">
          <div className="font-bold flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span>{p.name}</span>
          </div>
          <div className="text-ebc-straw font-black mt-1 font-mono">
            {p.value.toFixed(2)} CHF ({pct}%)
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
            Répartition des Dépenses Réelles
          </span>
          <h3 className="font-bold text-sm text-cave-50">Structure des Coûts Brasserie</h3>
        </div>
        <span className="text-sm font-black text-ebc-straw font-mono">
          {totalExpenses.toFixed(2)} CHF
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between">
        {/* Donut Chart */}
        <div className="w-48 h-48 shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={data}
                innerRadius={52}
                outerRadius={78}
                paddingAngle={4}
                dataKey="value"
                onClick={(entry: any) => onSelectCategory && onSelectCategory(entry.cat)}
                cursor="pointer"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    stroke="#0f172a" 
                    strokeWidth={2}
                    opacity={selectedCategory === 'all' || selectedCategory === entry.cat ? 1 : 0.4}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Centered Total Indicator */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-footnote text-cave-400 font-medium">Total</span>
            <span className="text-sm font-black text-cave-50 font-mono">
              {Math.round(totalExpenses)} CHF
            </span>
          </div>
        </div>

        {/* Legend pills */}
        <div className="flex-1 w-full sm:pl-4 space-y-1.5 mt-2 sm:mt-0">
          {data.map((item) => {
            const pct = totalExpenses > 0 ? ((item.value / totalExpenses) * 100).toFixed(1) : '0';
            const isSelected = selectedCategory === item.cat;
            return (
              <div
                key={item.cat}
                onClick={() => onSelectCategory && onSelectCategory(item.cat)}
                className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition text-sm ${
                  isSelected
                    ? 'bg-cave-850 border-ebc-straw/50 shadow-sm'
                    : 'bg-cave-950/40 border-cave-800/80 hover:bg-cave-850/40'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-cave-200 font-medium text-sm truncate max-w-[130px]">
                    {item.name}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="font-bold text-cave-50 text-sm">{item.value.toFixed(2)}</span>
                  <span className="text-footnote text-cave-400 ml-1">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
