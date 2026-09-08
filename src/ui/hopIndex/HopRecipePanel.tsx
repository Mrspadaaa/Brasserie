import React, { useState } from 'react';
import type { Recipe, RecipeSnapshot } from '../../types';
import type { HopAxis } from '../../../functions/src/hopPredictionSchema';
import { hopTripletsOfRecipe, predictHopTriplet, usableHopKnowledge } from '../../domain/hopIndex/engine';
import { useStorageValue } from '../../hooks/useLiveData';
import { StorageService } from '../../services/storage';
import { Units } from '../../services/units';
import { HopPredictionView } from './HopPredictionView';
import { Button } from '../../components/ui/Button';
import { guideAxes, guideRiskPolicies, guideTrials, guideYeasts } from './guideData';
import { useHopCatalogue } from './useHopCatalogue';
import { HopTrialChart, HopTrialComparison, HopTrialResult } from './HopWorkshop';
import { HopTechnicalPanel, HopSourceLink } from './HopTechnicalPanel';
import { HOP_TIMING_LABELS, hopDoseLabel, hopDurationLabel, hopTemperatureLabel } from './presentation';

/** Finished recipe report: no draft, no writes. Editing is the parent's explicit route. */
export function HopRecipePanel({ recipe, onEdit }: {
  recipe: Recipe | RecipeSnapshot; batchId?: string; onEdit?: () => void;
}) {
  const { varieties } = useHopCatalogue();
  const lots = useStorageValue(StorageService.getHopLots), knowledge = useStorageValue(StorageService.getHopKnowledge);
  const [technicalHop, setTechnicalHop] = useState(0);
  const valid = usableHopKnowledge(knowledge).valid;
  const axes = guideAxes(knowledge), yeasts = guideYeasts(knowledge), trials = guideTrials(knowledge);
  const trial = trials.find(t => t.id === recipe.hopTrialId);
  const data = { varieties, lots, knowledge: [...new Map([...guideRiskPolicies(knowledge), ...valid].map(k => [k.id, k])).values()] };
  const triplets = hopTripletsOfRecipe(recipe), target = recipe.hopAromaTarget ?? {};
  const predictions = triplets.map(triplet => predictHopTriplet(triplet, target, data));
  const hasRisks = predictions.some(p => p.risks.some(r => r.status !== 'unknown'));
  return <section className="space-y-5" aria-label="Potentiel aromatique de la recette">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-serif text-cave-50">Le programme aromatique</h3><p className="text-sm text-cave-400">{recipe.yeast?.name || 'Levure à choisir'} · lecture seule</p></div>{onEdit && <Button type="button" onClick={onEdit}>Modifier dans l’atelier de recette</Button>}</div>
    {!!Object.keys(target).length && <figure className="space-y-2" aria-label="Objectif aromatique de la recette"><figcaption className="text-sm font-semibold text-ebc-straw">Profil recherché · intention du brasseur</figcaption>{axes.filter(a => target[a.id]).map(a => {
      const r = target[a.id], level = r.max <= a.lowMax ? 'faible' : r.min >= a.mediumMax ? 'forte' : 'intermédiaire';
      return <div key={a.id} className="space-y-1"><p className="text-xs text-cave-200">{a.name} · présence {level}</p><div className="relative h-3 bg-cave-800 rounded overflow-hidden" aria-hidden="true"><span className="absolute inset-y-0 rounded bg-ebc-straw/70" style={{ left: `${100 * (r.min - a.scale.min) / (a.scale.max - a.scale.min)}%`, width: `${100 * (r.max - r.min) / (a.scale.max - a.scale.min)}%` }} /></div></div>;
    })}</figure>}
    {trial && <><h4 className="font-semibold text-cave-100">Repère : {trial.name}</h4><HopTrialChart trial={trial} recipe={recipe} /><HopTrialResult trial={trial} /><details><summary className="cursor-pointer min-h-touch text-water">Comparer la recette au protocole</summary><HopTrialComparison trial={trial} recipe={recipe} /></details></>}
    {recipe.hopTrialId && !trial && <p className="text-sm text-cave-400">Le programme de référence n’est plus disponible. Les ingrédients de la recette sont conservés.</p>}
    {!trial && <p className="text-sm text-cave-200">{recipe.hops.length} ajout(s) avec {recipe.yeast?.name || 'une levure à préciser'}. Aucun essai choisi comme repère ; le profil global de cette bière n’est pas chiffré.</p>}
    <div className="grid gap-2 sm:grid-cols-2">{triplets.map((t, i) => <div key={i} className="border-l-2 border-hop/70 bg-cave-900 p-3 space-y-1"><p className="text-sm font-semibold text-cave-50">{recipe.hops[i].name} · {Units.format(recipe.hops[i].weightG, 'g')}</p><p className="text-sm text-hop">{t.timing ? HOP_TIMING_LABELS[t.timing] : 'À cru · phase à préciser'}</p><p className="text-xs text-cave-400">{hopDoseLabel(t.doseGL)} · {hopTemperatureLabel(t.temperatureC)} · {hopDurationLabel(t.contactHours)}</p></div>)}</div>
    {hasRisks && <details><summary className="cursor-pointer min-h-touch text-ebc-straw">Vigilances du houblonnage</summary><div className="space-y-3">{predictions.flatMap((p, i) => p.risks.filter(r => r.status !== 'unknown').map((r, j) => <article key={`${i}-${j}`} className="text-sm space-y-1 border-l-2 border-ebc-straw pl-3"><p className="font-semibold text-cave-100">{recipe.hops[i].name} · {r.title}</p><p className="text-cave-200">{r.message}</p><p className="text-xs text-cave-400">{r.status === 'possible' ? 'Possible' : 'Signalé'} · confiance {({ low: 'faible', medium: 'moyenne', high: 'élevée' })[r.confidence]}</p><HopSourceLink source={r.source} /></article>))}</div></details>}
    <details><summary className="cursor-pointer min-h-touch text-water">Thiols, phénols et analyses techniques</summary><div className="space-y-4 pt-2">
      {recipe.hops.length > 1 && <label className="block text-sm text-cave-200">Analyse de l’ajout<select className="block w-full bg-cave-850 rounded-control p-3 mt-1" value={technicalHop} onChange={e => setTechnicalHop(Number(e.target.value))}>{recipe.hops.map((h, i) => <option key={i} value={i}>{h.name} · ajout {i + 1}</option>)}</select></label>}
      <HopTechnicalPanel variety={varieties.find(v => v.id === recipe.hops[technicalHop]?.hopVarietyId)} lot={lots.find(l => l.id === recipe.hops[technicalHop]?.hopLotId)} />
    </div></details>
    {predictions.some(p => Object.values(p.profile).some(e => e.range)) && <details><summary className="cursor-pointer min-h-touch text-cave-400">Prédictions quantitatives dans leur domaine de validité</summary>{predictions.filter(p => Object.values(p.profile).some(e => e.range)).map((p, i) => <HopPredictionView key={i} prediction={p} target={target} axes={valid.filter((k): k is HopAxis => k.kind === 'axis')} names={{ variety: varieties.find(v => v.id === p.triplet.varietyId)?.name, yeast: yeasts.find(y => y.id === p.triplet.yeastId)?.name }} />)}</details>}
  </section>;
}
