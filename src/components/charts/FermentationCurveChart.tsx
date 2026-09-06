import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Batch } from '../../types';

interface FermentationCurveChartProps {
  batch: Batch;
}

export const FermentationCurveChart: React.FC<FermentationCurveChartProps> = ({ batch }) => {
  const ogNum = parseFloat(batch.og || '1.062');
  const fgTarget = 1.018;

  // Build points
  const data: Array<{ name: string; date: string; sg: number; tempC?: number; isTarget?: boolean }> = [];

  data.push({
    name: 'Brassage',
    date: batch.brewDate || '01.05',
    sg: ogNum,
    tempC: 18.5
  });

  if (batch.gravityLog && batch.gravityLog.length > 0) {
    batch.gravityLog.forEach((log, idx) => {
      data.push({
        name: `Relevé ${idx + 1}`,
        date: log.date,
        sg: log.sg,
        tempC: log.tempC
      });
    });
  }

  // Add target FG reference point
  data.push({
    name: 'Cible FG',
    date: 'Est. J+14',
    sg: fgTarget,
    isTarget: true
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-cave-900 border border-cave-700 p-2.5 rounded-2xl shadow-xl text-sm text-cave-50">
          <div className="font-bold text-ebc-straw">{p.name} ({p.date})</div>
          <div className="text-cave-200 mt-1 font-mono">
            Densité : <strong>{p.sg.toFixed(3)}</strong>
          </div>
          {p.tempC && (
            <div className="text-cave-400 text-footnote">Température : {p.tempC}°C</div>
          )}
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
            Courbe de Fermentation Active
          </span>
          <h3 className="font-bold text-sm text-cave-50">{batch.name} ({batch.id})</h3>
        </div>
        <div className="text-right font-mono">
          <span className="text-sm font-black text-hop">
            {batch.fg || '1.032'}
          </span>
          <span className="text-footnote text-cave-400 block">Cible : {fgTarget}</span>
        </div>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
            />
            <YAxis 
              domain={[1.010, 1.070]} 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false}
              tickFormatter={(v) => v.toFixed(3)}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={fgTarget} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'FG', fill: '#10b981', fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="sg"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6, fill: '#fbbf24' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between items-center text-footnote text-cave-400 bg-cave-950/60 p-2 rounded-xl border border-cave-800/80">
        <span>Densité Initiale : <strong className="text-cave-200 font-mono">{batch.og || '1.062'}</strong></span>
        <span>Atténuation apparente : <strong className="text-hop font-mono">~48%</strong></span>
        <span>Cible : <strong className="text-cave-200 font-mono">{fgTarget}</strong></span>
      </div>
    </div>
  );
};
