import React from 'react';
import type { HopTrial } from '../../../functions/src/hopTrialSchema';
import { compareHopTrial, type TrialRecipe } from '../../domain/hopIndex/trials';
import { HOP_CONFIDENCE_LABELS, hopRangeLabel } from './presentation';
import { HopSourceLink } from './HopTechnicalPanel';

export function HopTrialResult({ trial }: { trial: HopTrial }) {
  return <section aria-label="Résultat documenté de l’essai" className="space-y-3 border-l-2 border-hop pl-4 py-1">
    <h4 className="font-semibold text-cave-50">Ce que l’essai a montré</h4>
    <p className="text-xs text-hop">Repère expérimental documenté · {trial.sensory.length ? 'observations chiffrées disponibles' : 'résultat qualitatif'}</p>
    <p className="text-cave-50">{trial.result}</p>
    {trial.sensory.map((s, i) => <figure key={i} aria-label={`Plage publiée : ${s.name}`} className="space-y-2">
      <figcaption className="text-sm text-cave-200">{s.name} · {hopRangeLabel(s.range)} sur {s.scale.max.toLocaleString('fr')}</figcaption>
      <div className="relative h-5 bg-cave-800 rounded" aria-hidden="true"><span className="absolute inset-y-0 rounded bg-hop/70" style={{ left: `${100 * (s.range.min - s.scale.min) / (s.scale.max - s.scale.min)}%`, width: `${100 * (s.range.max - s.range.min) / (s.scale.max - s.scale.min)}%` }} /></div>
      <p className="text-xs text-cave-400">{s.scale.min.toLocaleString('fr')} — échelle du panel — {s.scale.max.toLocaleString('fr')}. Plage observée, sans garantie pour un autre brassin.</p>
      <HopSourceLink source={s.source} />
    </figure>)}
    {!trial.sensory.length && <p className="text-sm text-cave-200">Ce résultat documente une direction aromatique. Il ne fournit pas de plage d’intensité par arôme transposable à l’échelle du graphe.</p>}
    <p className="text-xs text-cave-400">{trial.matrix} Le résultat porte sur le programme complet, pas sur chaque ajout isolé.</p>
    <HopSourceLink source={trial.source} />
    <details className="space-y-1 text-xs text-cave-200"><summary className="cursor-pointer min-h-touch flex items-center">Limites de l’essai</summary>{trial.limitations.map((limitation, i) => <p key={i}>{limitation}</p>)}</details>
    <details className="text-xs text-cave-400"><summary className="cursor-pointer py-2">Confiance de transposition du repère : {HOP_CONFIDENCE_LABELS[trial.confidence]}</summary><p>Appréciation documentaire ; la confiance de la prédiction chiffrée est évaluée séparément. Les écarts de ta recette restent à examiner.</p><p>{trial.assessmentSource.locator}</p><HopSourceLink source={trial.assessmentSource} /></details>
  </section>;
}

export function HopTrialComparison({ recipe, trial }: { recipe: TrialRecipe; trial: HopTrial }) {
  const differences = compareHopTrial(recipe, trial);
  return <section aria-label="Écarts au programme documenté" className="space-y-3">
    <div><h4 className="font-semibold text-cave-50">Ta recette actuelle face à l’essai</h4><p className="text-sm text-cave-400">Les conditions concordantes rendent l’essai utile comme repère ; les différences limitent sa transposition.</p></div>
    <div className="divide-y divide-cave-800">{differences.map((d, i) => <div key={i} className="py-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-sm">
      <span className="text-cave-200">{d.label}</span><span className={d.status === 'same' ? 'text-hop' : d.status === 'changed' ? 'text-ebc-straw' : 'text-cave-400'}>{d.status === 'same' ? 'Concorde' : d.status === 'changed' ? 'Diffère' : 'À vérifier'}</span>
      <p className="col-span-2 text-xs text-cave-400">{d.detail}</p>
    </div>)}</div>
    <p className="text-xs text-cave-400">{trial.matrix}</p>
  </section>;
}
