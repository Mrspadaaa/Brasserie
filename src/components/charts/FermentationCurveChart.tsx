import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import type { Batch } from '../../types';
import { fermentationReadings } from '../../domain/fermentationReadings';

export function FermentationCurveChart({ batch }: { batch: Batch }) {
  const { points, target, latest, attenuation } = fermentationReadings(batch);
  return (
    <section className="panel p-4 space-y-3" aria-label="Courbe des densités mesurées">
      <div className="flex justify-between items-start gap-3">
        <div>
          <h3 className="text-base font-semibold text-cave-50">Densité au fil du brassin</h3>
          <p className="text-sm text-cave-400">
            {points.length} mesure{points.length > 1 ? 's' : ''} enregistrée
            {points.length > 1 ? 's' : ''}
          </p>
        </div>
        {latest !== undefined && (
          <span className="reading text-lg text-hop">{latest.toFixed(3)}</span>
        )}
      </div>
      {points.length ? (
        <>
          <div
            className="h-48 w-full"
            role="img"
            aria-label="Courbe des relevés réels, détail disponible sous le graphique"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ left: -15, right: 8, top: 10 }}>
                <XAxis dataKey="name" tick={{ fill: '#9A8A7E', fontSize: 12 }} />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(value: number) => value.toFixed(3)}
                  tick={{ fill: '#9A8A7E', fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    const p = payload?.[0]?.payload;
                    return active && p ? (
                      <div className="p-3 bg-cave-850 border border-cave-700 rounded-control text-sm text-cave-50">
                        <p>
                          {p.name} · {p.date}
                        </p>
                        <p>
                          {p.sg.toFixed(3)}
                          {p.tempC != null ? ` · ${p.tempC} °C` : ''}
                        </p>
                      </div>
                    ) : null;
                  }}
                />
                {target !== undefined && (
                  <ReferenceLine
                    y={target}
                    ifOverflow="extendDomain"
                    stroke="#6E9B5B"
                    strokeDasharray="4 4"
                    label={{
                      value: 'FG cible',
                      fill: '#8DAE79',
                      fontSize: 12,
                      position: 'insideTopRight'
                    }}
                  />
                )}
                <Line
                  type="linear"
                  dataKey="sg"
                  stroke="#F2C14E"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <details className="text-sm text-cave-400">
            <summary className="min-h-touch flex items-center cursor-pointer">
              Voir les relevés
            </summary>
            <ul className="space-y-2">
              {points.map((p, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>
                    {p.name} · {p.date}
                  </span>
                  <span className="reading">{p.sg.toFixed(3)}</span>
                </li>
              ))}
            </ul>
          </details>
        </>
      ) : (
        <p className="text-sm text-cave-400 py-3">
          Renseigne l’OG ou un relevé de densité pour tracer la courbe.
        </p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-cave-400">
        {target !== undefined && <span>FG cible de la recette : {target.toFixed(3)}</span>}
        {attenuation !== undefined && (
          <span>Atténuation apparente : {Math.round(attenuation)} %</span>
        )}
      </div>
    </section>
  );
}
