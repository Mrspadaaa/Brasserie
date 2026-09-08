import React, { useState } from 'react';
import { Recipe, RecipeSnapshot } from '../../types';
import { HopAxis, HopYeast } from '../../../functions/src/hopPredictionSchema';
import { hopTripletsOfRecipe, predictHopTriplet, usableHopKnowledge } from '../../domain/hopIndex/engine';
import { captureHopPrediction } from '../../domain/hopIndex/snapshots';
import { useStorageValue, useSyncedDraft } from '../../hooks/useLiveData';
import { StorageService } from '../../services/storage';
import { HopPredictionView } from './HopPredictionView';
import { HopField } from './HopFactsEditor';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../Sheet';
import { TextInput, inputClass } from '../FormNav';
import { NumberInput } from '../NumberInput';
import { HOP_FORM_LABELS, hopReferenceLabel } from '../../domain/hopIndex/labels';
import { assertHopPredictionSnapshot } from '../../../functions/src/hopPredictionValidation';

export function HopRecipePanel({ recipe, batchId, onSave }: { recipe: Recipe | RecipeSnapshot; batchId?: string; onSave?: (recipe: Recipe) => void }) {
  const varieties = useStorageValue(StorageService.getHopVarieties), lots = useStorageValue(StorageService.getHopLots), knowledge = useStorageValue(StorageService.getHopKnowledge);
  const [editing, setEditing] = useState(false), [notice, setNotice] = useState('');
  const [draft, setDraft] = useSyncedDraft(recipe, 'id' in recipe ? recipe.id : recipe.sourceRecipeId);
  const valid = usableHopKnowledge(knowledge).valid, axes = valid.filter((k): k is HopAxis => k.kind === 'axis'), yeasts = valid.filter((k): k is HopYeast => k.kind === 'yeast');
  const data = { varieties, lots, knowledge }, triplets = hopTripletsOfRecipe(recipe);
  const recipeId = 'id' in recipe ? recipe.id : recipe.sourceRecipeId;
  const target = recipe.hopAromaTarget ?? {};
  const freeze = () => {
    try {
      const snapshots = triplets.map((triplet, i) => captureHopPrediction(triplet, target, data, { id: crypto.randomUUID(), createdAt: new Date().toISOString(), name: `${recipe.name} · ${recipe.hops[i].name} · ajout ${i + 1}`, ...(recipeId ? { recipeId } : {}), ...(batchId ? { batchId } : {}) }));
      snapshots.forEach(snapshot => assertHopPredictionSnapshot(snapshot)); snapshots.forEach(snapshot => StorageService.saveHopPrediction(snapshot));
      if (onSave) onSave({ ...recipe, hopPredictionIds: snapshots.map(s => s.id) } as Recipe);
      setNotice('Prédictions figées avec les COA, les sources et les versions utilisés.');
    } catch (e) { setNotice((e as Error).message); }
  };
  const save = () => {
    try { onSave?.(draft as Recipe); setEditing(false); setNotice('Associations aromatiques enregistrées.'); }
    catch (e) { setNotice((e as Error).message); }
  };
  return <section className="space-y-3" aria-label="Potentiel aromatique de la recette">
    <h3 className="text-lg font-semibold text-cave-100">Houblon × levure × timing</h3>
    <p className="text-sm text-cave-400">Chaque ajout est évalué dans son contexte. Le profil total d’un assemblage de houblons reste non modélisé. Les données actuelles peuvent différer d’une prédiction conservée avant brassage.</p>
    <div className="flex flex-wrap gap-2">{onSave && <Button onClick={() => { setDraft(structuredClone(recipe)); setEditing(true); }}>Associer les lots et la levure</Button>}<Button disabled={!triplets.length} onClick={freeze}>Figer ces prédictions</Button></div>
    {notice && <p role="status" className="text-cave-200">{notice}</p>}
    {triplets.map((t, i) => {
      const prediction = predictHopTriplet(t, target, data);
      return <details className="border-b border-cave-700 py-2" key={i}><summary className="cursor-pointer text-cave-100 min-h-touch">Ajout {i + 1} · {recipe.hops[i].name} · {recipe.hops[i].weightG} g</summary><HopPredictionView prediction={prediction} target={target} axes={axes.filter(a => !!target[a.id] || !!prediction.profile[a.id]?.range)} names={{ variety: varieties.find(v => v.id === t.varietyId)?.name || recipe.hops[i].name, yeast: yeasts.find(y => y.id === t.yeastId)?.name }} /></details>;
    })}
    <Sheet open={editing} onClose={() => setEditing(false)} title="Contexte aromatique de la recette" footer={<Button full intent="primary" onClick={save}>Enregistrer les associations</Button>}>
      <div className="space-y-4 pb-4">
        <HopField label={`Souche du référentiel correspondant à ${draft.yeast?.name || 'la levure de la recette'}`}><select className={inputClass} value={draft.yeast?.hopIndexId ?? ''} onChange={e => setDraft({ ...draft, yeast: { ...draft.yeast, hopIndexId: e.target.value || undefined } })}><option value="">Non identifiée</option>{yeasts.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select></HopField>
        <HopField label="Référence du contexte de bière"><TextInput value={draft.hopMatrixId ?? ''} onChange={hopMatrixId => setDraft({ ...draft, hopMatrixId })} /></HopField>
        <p className="text-sm text-cave-400">Ces associations doivent désigner les ingrédients réellement prévus. La dose est calculée depuis la masse de la recette et son volume.</p>
        {draft.hops.map((hop, i) => {
          const patch = (change: Partial<typeof hop>) => setDraft({ ...draft, hops: draft.hops.map((v, j) => j === i ? { ...v, ...change } : v) });
          return <fieldset className="border border-cave-700 rounded-control p-3 space-y-3" key={i}><legend className="text-cave-100">{hop.name} · {hop.weightG} g</legend>
            <HopField label={`Variété de l’ajout ${i + 1}`}><select className={inputClass} value={hop.hopVarietyId ?? ''} onChange={e => patch({ hopVarietyId: e.target.value || undefined, hopLotId: undefined })}><option value="">Non identifiée</option>{varieties.map(v => <option key={v.id} value={v.id}>{hopReferenceLabel(v)} · {HOP_FORM_LABELS[v.form]}</option>)}</select></HopField>
            <HopField label={`Lot de l’ajout ${i + 1}`}><select className={inputClass} value={hop.hopLotId ?? ''} onChange={e => patch({ hopLotId: e.target.value || undefined })}><option value="">Référence variété</option>{lots.filter(l => l.varietyId === hop.hopVarietyId && (!l.referenceOnly || l.id === hop.hopLotId)).map(l => <option key={l.id} value={l.id}>{l.name}{l.referenceOnly ? ' · référence documentaire' : ''}</option>)}</select></HopField>
            {hop.stage === 'dryHop' && <HopField label={`Phase du dry-hop ${i + 1}`}><select className={inputClass} value={hop.aromaTiming ?? ''} onChange={e => patch({ aromaTiming: e.target.value as any || undefined })}><option value="">Non précisée</option><option value="fermentation">Fermentation active</option><option value="postFermentation">Après fermentation</option></select></HopField>}
            <HopField label={`Température de contact de l’ajout ${i + 1} (°C)`}><NumberInput className={inputClass} value={hop.aromaTemperatureC ?? hop.tempC} emptyValue={undefined} onValue={aromaTemperatureC => patch({ aromaTemperatureC })} /></HopField>
            <HopField label={`Contact de l’ajout ${i + 1} (h)`}><NumberInput className={inputClass} value={hop.aromaContactHours ?? (hop.stage !== 'dryHop' && hop.timeMin != null ? hop.timeMin / 60 : undefined)} emptyValue={undefined} onValue={aromaContactHours => patch({ aromaContactHours })} /></HopField>
          </fieldset>;
        })}
        <h4 className="text-cave-100 font-semibold">Profil cible</h4>
        {axes.map(a => <HopField key={a.id} label={`${a.name} recherché`}><select className={inputClass} value={!draft.hopAromaTarget?.[a.id] ? '' : draft.hopAromaTarget[a.id].min === a.scale.min ? 'low' : draft.hopAromaTarget[a.id].min === a.lowMax ? 'medium' : 'high'} onChange={e => {
          const hopAromaTarget = { ...draft.hopAromaTarget }; if (!e.target.value) delete hopAromaTarget[a.id]; else hopAromaTarget[a.id] = e.target.value === 'low' ? { min: a.scale.min, max: a.lowMax } : e.target.value === 'medium' ? { min: a.lowMax, max: a.mediumMax } : { min: a.mediumMax, max: a.scale.max }; setDraft({ ...draft, hopAromaTarget });
        }}><option value="">Sans préférence</option><option value="low">Faible</option><option value="medium">Moyen</option><option value="high">Fort</option></select></HopField>)}
      </div>
    </Sheet>
  </section>;
}
