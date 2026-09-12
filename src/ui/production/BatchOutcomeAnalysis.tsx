import React, { useState } from 'react';
import type { Batch } from '../../types';
import type { CatalogEntry } from '../../domain/productionCatalog';
import {
  batchOutcome,
  OUTCOME_METRICS,
  packagingBalance,
  type OutcomeMetric,
  type BatchDetailSection
} from '../../domain/productionInsights';

const number = (value: number, digits = 1) =>
  value.toLocaleString('fr-CH', {
    minimumFractionDigits: digits === 3 ? 3 : 0,
    maximumFractionDigits: digits === 3 ? 5 : digits
  });
export function BatchOutcomeAnalysis({
  entries,
  onOpenBatch
}: {
  entries: CatalogEntry[];
  onOpenBatch: (b: Batch, section?: BatchDetailSection) => void;
}) {
  const [metric, setMetric] = useState<OutcomeMetric>('og');
  const [all, setAll] = useState(false);
  const spec = OUTCOME_METRICS[metric];
  const results = entries.flatMap((e) => {
    const result = batchOutcome(e, metric);
    return result ? [result] : [];
  });
  const max = Math.max(1, ...results.map((r) => Math.abs(r.delta)));
  const balance = packagingBalance(entries);
  return (
    <section className="panel p-4 space-y-4" aria-label="Écarts entre cible et résultat">
      <div>
        <h3 className="text-lg font-semibold text-cave-50">Ai-je atteint ma cible ?</h3>
        <p className="text-sm text-cave-400">
          Le résultat de chaque brassin face à sa cible d’origine.
        </p>
      </div>
      <div
        className="grid grid-cols-4 gap-1 p-1 rounded-control bg-cave-950"
        aria-label="Mesure à comparer"
      >
        {(['og', 'fg', 'volume', 'abv'] as const).map((key) => (
          <button
            type="button"
            key={key}
            aria-label={`Comparer ${OUTCOME_METRICS[key].label.toLowerCase()}`}
            aria-pressed={metric === key}
            onClick={() => {
              setMetric(key);
              setAll(false);
            }}
            className={`min-h-touch px-1 rounded-control text-sm ${metric === key ? 'bg-cave-800 text-ebc-straw font-semibold' : 'text-cave-400'}`}
          >
            {{ og: 'OG', fg: 'FG', volume: 'Litres', abv: 'Alcool' }[key]}
          </button>
        ))}
      </div>
      <p className="text-sm text-cave-400" role="status">
        {spec.label} · {results.length} brassin{results.length > 1 ? 's' : ''} comparable
        {results.length > 1 ? 's' : ''} sur {entries.length}
      </p>
      {results.length ? (
        <>
          <div className="flex justify-between text-sm text-cave-400">
            <span>Sous la cible</span>
            <span>Au-dessus</span>
          </div>
          <ul className="divide-y divide-cave-800">
            {(all ? results : results.slice(0, 6)).map(({ entry, target, actual, delta }) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onOpenBatch(entry.batch!, 'measurements')}
                  aria-label={`Mesures du brassin ${entry.id}`}
                  className="w-full min-h-touch text-left py-3 space-y-2 rounded-control"
                >
                  <span className="flex justify-between gap-2 items-start">
                    <span className="min-w-0">
                      <span className="block text-base font-semibold text-cave-50 break-words">
                        {entry.name}
                      </span>
                      <span className="text-sm text-cave-400">{entry.id}</span>
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-ebc-straw">
                      {delta > 0 ? '+' : ''}
                      {number(delta)} {spec.unit}
                    </span>
                  </span>
                  <span className="relative block h-2 rounded-full bg-cave-800" aria-hidden>
                    <span className="absolute left-1/2 -top-1 h-4 w-px bg-cave-200" />
                    {delta !== 0 && (
                      <span
                        className="absolute h-2 rounded-full bg-water"
                        style={{
                          left: `${delta < 0 ? 50 - (Math.abs(delta) / max) * 48 : 50}%`,
                          width: `${(Math.abs(delta) / max) * 48}%`
                        }}
                      />
                    )}
                  </span>
                  <span className="block text-sm text-cave-200 tabular-nums">
                    Cible {number(target, spec.digits)} → {number(actual, spec.digits)}{' '}
                    {metric === 'volume' ? 'L mesurés' : metric === 'abv' ? '% obtenus' : 'mesuré'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {results.length > 6 && (
            <button
              type="button"
              className="min-h-touch w-full text-ebc-straw text-sm"
              onClick={() => setAll(!all)}
            >
              {all ? 'Réduire' : `Voir les ${results.length} brassins`}
            </button>
          )}
          <p className="text-sm text-cave-400">
            La ligne centrale est la cible. Un écart n’indique pas à lui seul un défaut de bière.
          </p>
        </>
      ) : (
        <p className="text-sm text-cave-200 py-3">
          Il faut une cible et une mesure sur le même brassin pour comparer. Les lots planifiés et
          annulés restent hors du bilan.
        </p>
      )}
      {balance.count > 0 && (
        <div className="border-t border-cave-700 pt-4">
          <h4 className="font-semibold text-cave-50">De la cuve au conditionnement</h4>
          <p className="text-base text-cave-200 mt-1 tabular-nums">
            {number(balance.brewed)} L →{' '}
            <strong className="text-water">{number(balance.packaged)} L</strong>
          </p>
          <p className="text-sm text-cave-400 mt-1">
            {number(balance.pct!)} % du volume en cuve, sur {balance.count} lot
            {balance.count > 1 ? 's' : ''} avec les deux volumes renseignés.
          </p>
        </div>
      )}
    </section>
  );
}
