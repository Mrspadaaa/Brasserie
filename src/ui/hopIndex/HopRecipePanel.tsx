import React, { useState } from 'react';
import { Recipe, RecipeSnapshot } from '../../types';
import { HopAxis, HopYeast } from '../../../functions/src/hopPredictionSchema';
import { hopTripletsOfRecipe, predictHopTriplet, usableHopKnowledge } from '../../domain/hopIndex/engine';
import { captureHopPrediction } from '../../domain/hopIndex/snapshots';
import { useStorageValue, useSyncedDraft } from '../../hooks/useLiveData';
import { StorageService } from '../../services/storage';
import { Units } from '../../services/units';
import { HopPredictionView } from './HopPredictionView';
import { HopRecipeGuide } from './HopRecipeGuide';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../Sheet';
import { assertHopPredictionSnapshot } from '../../../functions/src/hopPredictionValidation';

export function HopRecipePanel({ recipe, batchId, onSave }: {
  recipe: Recipe | RecipeSnapshot; batchId?: string; onSave?: (recipe: Recipe) => void;
}) {
  const varieties = useStorageValue(StorageService.getHopVarieties);
  const lots = useStorageValue(StorageService.getHopLots);
  const knowledge = useStorageValue(StorageService.getHopKnowledge);
  const [editing, setEditing] = useState(false), [notice, setNotice] = useState('');
  const [guideBusy, setGuideBusy] = useState(false);
  const recipeId = 'id' in recipe ? recipe.id : recipe.sourceRecipeId;
  const [draft, setDraft] = useSyncedDraft(recipe, recipeId);
  const valid = usableHopKnowledge(knowledge).valid;
  const axes = valid.filter((k): k is HopAxis => k.kind === 'axis');
  const yeasts = valid.filter((k): k is HopYeast => k.kind === 'yeast');
  const data = { varieties, lots, knowledge }, triplets = hopTripletsOfRecipe(recipe);
  const target = recipe.hopAromaTarget ?? {};
  const predictions = triplets.map(triplet => predictHopTriplet(triplet, target, data));
  const canFreeze = predictions.some(p => [...Object.values(p.profile), ...Object.values(p.compounds)].some(e => e.range) || p.risks.some(r => r.status !== 'unknown'));
  const freeze = () => {
    if (!canFreeze) return;
    try {
      const snapshots = triplets.map((triplet, i) => captureHopPrediction(triplet, target, data, {
        id: crypto.randomUUID(), createdAt: new Date().toISOString(),
        name: `${recipe.name} · ${recipe.hops[i].name} · ajout ${i + 1}`,
        ...(recipeId ? { recipeId } : {}), ...(batchId ? { batchId } : {})
      }));
      snapshots.forEach(snapshot => assertHopPredictionSnapshot(snapshot));
      snapshots.forEach(snapshot => StorageService.saveHopPrediction(snapshot));
      if (onSave) onSave({ ...recipe, hopPredictionIds: snapshots.map(s => s.id) } as Recipe);
      setNotice('Prédictions figées avec les COA, les sources et les versions utilisés.');
    } catch (e) { setNotice((e as Error).message); }
  };
  const save = () => {
    if (guideBusy) return;
    try { onSave?.(draft as Recipe); setEditing(false); setNotice('Profil recherché et références enregistrés.'); }
    catch (e) { setNotice((e as Error).message); }
  };
  return <section className="space-y-3" aria-label="Potentiel aromatique de la recette">
    <h3 className="text-lg font-semibold text-cave-100">Houblon × levure × timing</h3>
    <p className="text-sm text-cave-400">Chaque ajout est évalué avec la levure et son moment d’ajout. Le guide aide à choisir un profil et des références documentées. Le profil total d’un assemblage reste non modélisé.</p>
    {!valid.some(k => k.kind === 'risk' && k.enabled) && <p className="text-sm text-cave-400">Aucune règle de vigilance active. L’absence d’alerte ne signifie pas l’absence de risque.</p>}
    <div className="flex flex-wrap gap-2">
      {onSave && <Button type="button" onClick={() => { setDraft(structuredClone(recipe)); setEditing(true); }}>Choisir le profil et les références</Button>}
      {canFreeze && <Button type="button" onClick={freeze}>Figer ces prédictions</Button>}
    </div>
    {canFreeze && <p className="text-sm text-cave-400">Les données actuelles peuvent différer d’une prédiction conservée avant brassage.</p>}
    {notice && <p role="status" className="text-cave-200">{notice}</p>}
    {predictions.map((prediction, i) => <details className="border-b border-cave-700 py-2" key={i}>
      <summary className="cursor-pointer text-cave-100 min-h-touch">Ajout {i + 1} · {recipe.hops[i].name} · {Units.format(recipe.hops[i].weightG, 'g')}</summary>
      <HopPredictionView prediction={prediction} target={target}
        axes={axes.filter(a => !!target[a.id] || !!prediction.profile[a.id]?.range)}
        names={{ variety: varieties.find(v => v.id === prediction.triplet.varietyId)?.name || recipe.hops[i].name,
          yeast: yeasts.find(y => y.id === prediction.triplet.yeastId)?.name || recipe.yeast?.name }} />
    </details>)}
    <Sheet open={editing} dismissible={!guideBusy} onClose={() => { if (!guideBusy) setEditing(false); }} title="Profil aromatique et ajouts"
      footer={<Button type="button" full intent="primary" disabled={guideBusy} onClick={save}>Enregistrer le profil et les références</Button>}>
      <div className="pb-4"><HopRecipeGuide recipe={draft} onChange={setDraft} onBusyChange={setGuideBusy} /></div>
    </Sheet>
  </section>;
}
