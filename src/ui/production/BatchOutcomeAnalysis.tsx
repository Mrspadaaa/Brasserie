import React, { useState, type ReactNode } from 'react';
import type { Batch } from '../../types';
import type { CatalogEntry } from '../../domain/productionCatalog';
import { packagingBalance, type BatchDetailSection, type OutcomeMetric } from '../../domain/productionInsights';
import {
  BILAN_ECHELLE,
  BILAN_LABEL,
  BILAN_METRICS,
  BILAN_QUESTION,
  BILAN_TOLERANCE,
  legendeDe,
  lignesBilan,
  lotsConditionnes,
  nombre,
  pastillesBilan,
  positionSur,
  scoreBilan,
  titreBilan,
  valeurDe,
  type LigneBilan,
  type ScoreBilan,
  type Verdict
} from './bilan/bilanModel';
import './bilan/bilan.css';

const COULEUR: Record<Verdict, string> = {
  ok: 'rgb(var(--hop))',
  sous: 'rgb(var(--water))',
  sur: 'rgb(var(--attention))',
  cours: 'rgb(var(--cave-600))'
};
const ENCRE: Record<Verdict, string> = {
  ok: 'rgb(var(--hop-texte))',
  sous: 'rgb(var(--water-texte))',
  sur: 'rgb(var(--attention-texte))',
  cours: 'rgb(var(--cave-texte-200))'
};
const ENCRE_SCORE: Record<ScoreBilan['ton'], string> = {
  ok: ENCRE.ok,
  sous: ENCRE.sous,
  sur: ENCRE.sur,
  aucun: 'rgb(var(--cave-texte-400))'
};
const AXE: Record<OutcomeMetric, [string, string, string]> = {
  og: ['−0,006', 'cible', '+0,006'],
  fg: ['−0,008', 'bande', '+0,008'],
  abv: ['−1 pt', 'cible', '+1 pt'],
  volume: ['−3 L', 'cible', '+3 L']
};
const VISIBLES = 6;

function Ligne({
  ligne,
  metric,
  onOpen
}: {
  ligne: LigneBilan;
  metric: OutcomeMetric;
  onOpen: () => void;
}) {
  const { entry, verdict, diff } = ligne;
  const tol = BILAN_TOLERANCE[metric];
  const max = BILAN_ECHELLE[metric];
  const pos = positionSur(metric, diff);
  const cours = verdict === 'cours';
  // Un point seul quand le lot est dans la cible : une barre de quelques pixels sous le point se lit « ●) ».
  const barre = verdict !== 'ok' ? Math.abs(pos - 50) : 0;
  return (
    <button type="button" className="bil-row" onClick={onOpen} aria-label={`Mesures du brassin ${entry.id}`}>
      <span className={`bil-tint ${entry.swatch ?? 'bg-cave-700'}`} aria-hidden />
      <span className="bil-nm">
        <b>{entry.name}</b>
        <i className="font-mono tabular-nums">{entry.id}</i>
      </span>
      <span className="bil-zone" aria-hidden>
        <span className="bil-band" style={{ left: `${50 - (tol / max) * 50}%`, width: `${(tol / max) * 100}%` }} />
        <span className="bil-mid" />
        {barre > 0 && (
          <span
            className="bil-bar"
            style={{
              left: `${Math.min(50, pos)}%`,
              width: `${barre}%`,
              ...(cours
                ? {
                    background: 'repeating-linear-gradient(135deg, rgb(var(--cave-600)) 0 4px, transparent 4px 8px)',
                    border: '1px solid rgb(var(--cave-600))'
                  }
                : { background: COULEUR[verdict] })
            }}
          />
        )}
        <span
          className="bil-dot"
          style={
            cours
              ? { left: `${pos}%`, background: 'rgb(var(--cave-950))', border: '2px solid rgb(var(--cave-texte-200))' }
              : { left: `${pos}%`, background: COULEUR[verdict] }
          }
        />
      </span>
      <span className="bil-val">
        <span className="reading">{valeurDe(metric, ligne.actual)}</span>
        <i className={/^[−+0-9]/.test(legendeDe(metric, ligne)) ? 'font-mono tabular-nums' : ''} style={{ color: ENCRE[verdict] }}>
          {legendeDe(metric, ligne)}
        </i>
      </span>
    </button>
  );
}

export function BatchOutcomeAnalysis({
  entries,
  onOpenBatch,
  children
}: {
  entries: CatalogEntry[];
  onOpenBatch: (b: Batch, section?: BatchDetailSection) => void;
  /** Le reste du bilan (production par mois, styles, houblons…), posé sous « De la cuve à la bouteille ». */
  children?: ReactNode;
}) {
  const [metric, setMetric] = useState<OutcomeMetric>('og');
  const [all, setAll] = useState(false);
  const parMesure = Object.fromEntries(BILAN_METRICS.map((m) => [m, lignesBilan(entries, m)])) as Record<
    OutcomeMetric,
    LigneBilan[]
  >;
  const scores = Object.fromEntries(BILAN_METRICS.map((m) => [m, scoreBilan(parMesure[m])])) as Record<
    OutcomeMetric,
    ScoreBilan
  >;
  const lignes = parMesure[metric];
  const score = scores[metric];
  const pastilles = pastillesBilan(metric, lignes);
  const balance = packagingBalance(entries);
  const lots = lotsConditionnes(entries);
  const axe = AXE[metric];
  const visibles = all ? lignes : lignes.slice(0, VISIBLES);
  return (
    <section aria-label="Écarts entre cible et résultat">
      <p className="bil-q" role="status">
        {BILAN_QUESTION[metric]} · ai-je atteint ma cible ?
      </p>
      <h4 className="bil-h1">{titreBilan(metric, score, lignes.length)}</h4>
      {pastilles.length > 0 && (
        <div className="bil-sub">
          {pastilles.map((p) => (
            <span key={p.texte} className="bil-pastille" data-ton={p.ton}>
              {p.texte}
            </span>
          ))}
        </div>
      )}
      <div className="bil-corps">
        <div>
          <div className="bil-seg" role="group" aria-label="Mesure à comparer">
            {BILAN_METRICS.map((key) => (
              <button
                type="button"
                key={key}
                className="bil-sg"
                aria-label={`Comparer ${BILAN_QUESTION[key].toLowerCase()}`}
                aria-pressed={metric === key}
                onClick={() => {
                  setMetric(key);
                  setAll(false);
                }}
              >
                <b>{BILAN_LABEL[key]}</b>
                <span className="font-mono tabular-nums" style={{ color: ENCRE_SCORE[scores[key].ton] }}>
                  {scores[key].n ? `${scores[key].ok}/${scores[key].n}` : '—'}
                </span>
              </button>
            ))}
          </div>
          {lignes.length ? (
            <div className="bil-card">
              {visibles.map((ligne) => (
                <Ligne
                  key={ligne.entry.id}
                  ligne={ligne}
                  metric={metric}
                  onOpen={() => onOpenBatch(ligne.entry.batch!, 'measurements')}
                />
              ))}
              <div className="bil-ax font-mono tabular-nums">
                <span />
                <span />
                <div>
                  <span>{axe[0]}</span>
                  <span className="font-semibold" style={{ color: 'rgb(var(--hop-texte))' }}>
                    {axe[1]}
                  </span>
                  <span>{axe[2]}</span>
                </div>
                <span className="font-sans" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  cible → réel
                </span>
              </div>
              {lignes.length > VISIBLES && (
                <button type="button" className="bil-plus" onClick={() => setAll(!all)}>
                  {all ? 'Réduire' : `Voir les ${lignes.length} brassins`}
                </button>
              )}
            </div>
          ) : (
            <p className="bil-vide">
              Il faut une cible et une mesure sur le même brassin pour comparer. Les lots planifiés et annulés restent
              hors du bilan.
            </p>
          )}
        </div>
        <div>
          {balance.count > 0 && (
            <>
              <h4 className="bil-h3">
                De la cuve à la bouteille <span className="font-mono tabular-nums">{lots.length} lot{lots.length > 1 ? 's' : ''}</span>
              </h4>
              <div className="bil-flow">
                <div className="bil-panneau bil-fl">
                  <span className="reading bil-grand">{nombre(balance.pct!)} %</span>
                  <div className="bil-fbar" role="img" aria-label={`${nombre(balance.pct!)} % du volume en cuve conditionné`}>
                    <i style={{ width: `${Math.min(100, balance.pct!)}%` }} />
                  </div>
                  <span className="font-mono tabular-nums">
                    {nombre(balance.brewed)} L → {nombre(balance.packaged)} L
                  </span>
                </div>
                <div className="bil-panneau bil-fl">
                  {lots.slice(0, 4).map((lot, i) => (
                    <div key={lot.entry.id}>
                      <b>{lot.entry.name}</b>{' '}
                      <span className="font-mono tabular-nums">
                        {nombre(lot.brewed)} → {nombre(lot.packaged)} L
                      </span>
                      <div className="bil-fbar fin" style={i === Math.min(lots.length, 4) - 1 ? { marginBottom: 0 } : undefined}>
                        <i style={{ width: `${Math.min(100, (lot.packaged / lot.brewed) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}
