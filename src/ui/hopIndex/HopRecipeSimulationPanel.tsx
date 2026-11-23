import React, { useId, useMemo, useRef, useState } from 'react';
import { predictHopRecipe } from '../../../functions/src/hopRecipePrediction';
import type { HopExtrapolation } from '../../../functions/src/hopExtrapolationSchema';
import type { TrialRecipe } from '../../domain/hopIndex/trials';
import { prepareHopRecipeInput } from '../../domain/hopIndex/recipePrediction';
import { captureHopRecipePrediction } from '../../domain/hopIndex/snapshots';
import { useStorageValue } from '../../hooks/useLiveData';
import { StorageService } from '../../services/storage';
import { guideAxes, guidePredictionKnowledge, guideTrials, guideYeasts } from './guideData';
import { useHopCatalogue } from './useHopCatalogue';
import { HopExplorationChart } from './HopAromaChart';
import { HopRecipeChemistry } from './HopRecipeChemistry';
import { HopExtrapolationPanel } from './HopExtrapolationPanel';
import { HopTechnicalPanel, HopSourceLink } from './HopTechnicalPanel';
import { HopTrialResult, HopTrialComparison } from './HopTrialEvidence';
import { HOP_TIMING_LABELS, hopDoseLabel, hopDurationLabel, hopTemperatureLabel } from './presentation';
import { Button } from '../../components/ui/Button';
import { inputClass } from '../FormNav';
import { noloPlanningSource } from '../../domain/nolo';
import type { HopRange } from '../../../functions/src/hopIndexSchema';
import { RangeInput } from '../NoloPanel';

const EMPTY_TARGET = Object.freeze({});

/** Every toggle is local presentation state. Only the explicit variant editor can apply a recipe change. */
export function HopRecipeSimulationPanel({ recipe, onChange, onBusyChange, readOnly = false }: {
  recipe: TrialRecipe; onChange?: (recipe: TrialRecipe) => void; onBusyChange?: (busy: boolean) => void; readOnly?: boolean;
}) {
  const { varieties, loading } = useHopCatalogue();
  const controlId = useId();
  const saved = useStorageValue(StorageService.getHopKnowledge), lots = useStorageValue(StorageService.getHopLots);
  const knowledge = useMemo(() => guidePredictionKnowledge(saved), [saved]);
  const axes = useMemo(() => guideAxes(saved), [saved]), yeasts = useMemo(() => guideYeasts(saved), [saved]);
  const data = useMemo(() => ({ varieties, lots, knowledge }), [varieties, lots, knowledge]);
  const prepared = useMemo(() => prepareHopRecipeInput(recipe, varieties, yeasts), [recipe, varieties, yeasts]);
  const [showAll, setShowAll] = useState(false), [cumulative, setCumulative] = useState(false), [addition, setAddition] = useState(0), [variantOpen, setVariantOpen] = useState(false), [technicalOpen, setTechnicalOpen] = useState(false);
  const [saving, setSaving] = useState(false), [saveNotice, setSaveNotice] = useState(''), [saveError, setSaveError] = useState('');
  const [afterTreatment,setAfterTreatment]=useState(false);
  const [transfer,setTransfer]=useState<Record<string,HopRange|null>>({});
  const effectiveTransfer=useMemo(()=>Object.fromEntries(Object.entries({...recipe.nolo?.planning?.aromaTransfer?.axes,...transfer}).filter((e):e is [string,HopRange]=>e[1]!==null)),[recipe.nolo?.planning?.aromaTransfer?.axes,transfer]);
  const savingRef = useRef(false), lastCapture = useRef<{ signature: string; snapshot: ReturnType<typeof captureHopRecipePrediction> }>(undefined);
  const selected = Math.min(addition, Math.max(0, prepared.input.additions.length - 1));
  const input = useMemo(() => {
    const input=cumulative?prepared.input:{...prepared.input,additions:prepared.input.additions.slice(selected,selected+1)};
    return input.aromaDomain&&afterTreatment?{...input,aromaContext:{stage:'packaged' as const,transfer:{axes:effectiveTransfer,source:noloPlanningSource}}}:input;
  }, [prepared.input,cumulative,selected,afterTreatment,effectiveTransfer]);
  const target = recipe.hopAromaTarget ?? EMPTY_TARGET;
  const result = useMemo(() => predictHopRecipe(input, target, data), [input, target, data]);
  const prediction = cumulative ? result.overall : result.additions[0] ?? result.overall;
  const triplet = input.additions[0]?.triplet;
  const variety = varieties.find(v => v.id === triplet?.varietyId);
  const technicalTriplet = prepared.input.additions[selected]?.triplet;
  const technicalVariety = varieties.find(v => v.id === technicalTriplet?.varietyId), technicalLot = lots.find(l => l.id === technicalTriplet?.lotId);
  const models = useMemo(() => knowledge.filter((k): k is HopExtrapolation => k.kind === 'extrapolation' && k.enabled), [knowledge]);
  const trial = useMemo(() => guideTrials(saved).find(t => t.id === recipe.hopTrialId), [saved, recipe.hopTrialId]);
  const notices = [...new Set([...prepared.proposed, ...result.warnings])];
  const risks = [...new Map(prediction.risks.filter(r => r.status !== 'unknown').map(r => [r.code, r])).values()];
  const save = async () => {
    if (savingRef.current || readOnly) return;
    savingRef.current = true; setSaving(true); setSaveError(''); setSaveNotice(''); onBusyChange?.(true);
    try {
      const signature = JSON.stringify([input, target, data]);
      if (lastCapture.current?.signature !== signature) lastCapture.current = { signature, snapshot: captureHopRecipePrediction(input, target, data, {
        id: crypto.randomUUID(), name: `${recipe.name} · ${cumulative ? 'programme complet' : input.additions[0]?.name ?? 'ajout'}`,
        createdAt: new Date().toISOString(), ...('id' in recipe ? { recipeId: recipe.id } : {})
      }) };
      StorageService.saveHopPrediction(lastCapture.current.snapshot);
      await StorageService.confirmPendingWrites();
      setSaveNotice('Simulation conservée avec ses conditions et ses sources pour la dégustation.');
    } catch (error) { setSaveError(error instanceof Error ? error.message : 'Enregistrement non confirmé.'); }
    finally { savingRef.current = false; setSaving(false); onBusyChange?.(false); }
  };
  return <section aria-label="Simulation de mes ajouts" className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><h3 className="font-sans text-base font-semibold text-cave-50">{cumulative ? 'Ensemble du houblonnage' : input.additions[0]?.name ?? 'Mes ajouts'}</h3><span className="text-sm text-hop">× {recipe.yeast?.name || 'Levure à préciser'}</span></div>
    <div className="flex flex-wrap gap-x-5 gap-y-1 border-y border-cave-800 py-1">
      <label htmlFor={`${controlId}-complete`} className="min-h-touch inline-flex items-center gap-2 text-sm text-cave-200"><input id={`${controlId}-complete`} name="hop-profile-complete" aria-label="Toutes les saveurs et la chimie" type="checkbox" className="accent-hop" checked={showAll} onChange={e => setShowAll(e.target.checked)} />Toutes les saveurs et la chimie</label>
      <label htmlFor={`${controlId}-cumulative`} className="min-h-touch inline-flex items-center gap-2 text-sm text-cave-200"><input id={`${controlId}-cumulative`} name="hop-program-cumulative" aria-label="Cumuler tous les ajouts" type="checkbox" className="accent-hop" checked={cumulative} onChange={e => setCumulative(e.target.checked)} />Cumuler tous les ajouts</label>
    </div>
    {result.aromaStage&&<div className="space-y-2">
      <label className="block text-sm text-cave-200">Étape aromatique<select aria-label="Étape aromatique" className={inputClass} value={afterTreatment?'after':'before'} onChange={e=>setAfterTreatment(e.target.value==='after')}><option value="before">Avant traitement · bière de référence</option><option value="after">Après traitement · hypothèses du pilote</option></select></label>
      <p className="text-sm text-water">{result.aromaStage.label}</p>
      {afterTreatment&&<details><summary className="min-h-touch cursor-pointer text-sm text-water">Hypothèses sensorielles par famille</summary><p className="text-xs text-cave-400">Fraction d’intensité supposée conservée. Jugement de préparation ; aucune assimilation à un rendement chimique. Vide = inconnu. La restitution se vérifie sur les fractions dégustées.</p><div className="grid sm:grid-cols-2 gap-2">{axes.map(axis=>{
        const r=effectiveTransfer[axis.id];
        return <RangeInput key={axis.id} label={axis.name+' conservé'} unit="%" max={100} value={r?{min:r.min*100,max:r.max*100}:null} onChange={next=>setTransfer(old=>({...old,[axis.id]:next?{min:next.min/100,max:next.max/100}:null}))}/>;
      })}</div>{onChange&&!readOnly&&<Button onClick={()=>onChange({...recipe,nolo:{...recipe.nolo!,planning:{version:1,source:noloPlanningSource,...recipe.nolo?.planning,aromaTransfer:{axes:effectiveTransfer,source:noloPlanningSource}}}})}>Retenir ces hypothèses dans la recette</Button>}</details>}
    </div>}
    {!cumulative && recipe.hops.length > 1 && <label className="block text-sm text-cave-200">Ajout simulé<select name="hop-simulated-addition" aria-label="Ajout simulé" className={`${inputClass} mt-1`} value={selected} onChange={e => setAddition(Number(e.target.value))}>{recipe.hops.map((h, i) => <option key={i} value={i}>Ajout {i + 1} · {h.name}</option>)}</select></label>}
    <p className="text-xs text-cave-400">{cumulative ? `${input.additions.length} ajout${input.additions.length > 1 ? 's' : ''} · enveloppe expérimentale du programme` : triplet ? `${triplet.timing ? HOP_TIMING_LABELS[triplet.timing] : recipe.hops[selected]?.stage === 'dryHop' ? 'À cru · phase à préciser' : 'Moment à préciser'} · ${hopDoseLabel(triplet.doseGL)} · ${hopTemperatureLabel(triplet.temperatureC)} · ${hopDurationLabel(triplet.contactHours)}` : 'Ajoute un houblon pour simuler son effet.'}</p>
    {loading ? <p role="status" className="text-sm text-cave-400">Chargement des références…</p> : <HopExplorationChart prediction={prediction} axes={axes} target={target} variety={cumulative ? undefined : variety} models={models} showAll={showAll} />}
    {risks.some(r => r.status === 'flagged') && <p role="status" className="text-sm text-ebc-straw">{risks.find(r => r.status === 'flagged')!.title} · {risks.find(r => r.status === 'flagged')!.message}</p>}
    {showAll && <HopRecipeChemistry chemistry={result.chemistry} finalLabel={result.aromaStage?.id==='packaged'?'Concentrations après traitement':result.aromaStage?'Concentrations dans la bière de référence':undefined} />}
    <div className="divide-y divide-cave-800 border-t border-cave-800">
      {(notices.length > 0 || risks.length > 0) && <details><summary className="cursor-pointer min-h-touch text-sm text-ebc-straw">Conditions et vigilances · {notices.length + risks.length} point(s)</summary><div className="space-y-2 pb-3 text-sm text-cave-200">{notices.map((notice, i) => <p key={i}>{notice}</p>)}{risks.map(r => <div key={r.code}><p>{r.title} · {r.message}</p><HopSourceLink source={r.source} /></div>)}</div></details>}
      <details onToggle={e => setTechnicalOpen(e.currentTarget.open)}><summary className="cursor-pointer min-h-touch text-sm text-cave-200">Composition, thiols et phénols</summary>{technicalOpen && <div className="py-3 space-y-3">{recipe.hops.length > 1 && <label className="block text-sm text-cave-200">Composition de l’ajout<select name="hop-composition-addition" aria-label="Composition de l’ajout" className={`${inputClass} mt-1`} value={selected} onChange={e => setAddition(Number(e.target.value))}>{recipe.hops.map((h, i) => <option key={i} value={i}>Ajout {i + 1} · {h.name}</option>)}</select></label>}<HopTechnicalPanel variety={technicalVariety} lot={technicalLot} /></div>}</details>
      {trial && <details><summary className="cursor-pointer min-h-touch text-sm text-water">Essai documenté · {trial.name}</summary><div className="py-3 space-y-4"><HopTrialResult trial={trial} /><HopTrialComparison recipe={recipe} trial={trial} /></div></details>}
      <details><summary className="cursor-pointer min-h-touch text-sm text-cave-400">Calcul et portée du résultat</summary><div className="pb-3 space-y-2 text-xs text-cave-400">{prediction.extrapolatedAxes?.length ? <p>Les axes extrapolés montrent des plages conditionnelles au modèle, pas des intervalles de confiance statistique.</p> : <p>Les plages documentées gardent leur échelle et leur domaine d’observation ; elles ne garantissent pas le résultat d’un autre brassin.</p>}{cumulative && result.overall.interactionsNonQuantifiees && <p>Les interactions non documentées peuvent modifier le mélange perçu.</p>}{prediction.reasons.map((reason, i) => <p key={i}>{reason}</p>)}<p>Modèles : {prediction.modelRefs.map(m => `${m.id} (${m.version})`).join(', ') || 'aucun applicable'}</p></div></details>
    </div>
    <div className="flex flex-wrap gap-2"><Button aria-expanded={variantOpen} onClick={() => setVariantOpen(open => !open)}>{variantOpen ? 'Fermer la variante' : 'Explorer une variante'}</Button>{!readOnly && <Button disabled={saving || loading || !input.additions.length} onClick={() => void save()}>{cumulative ? 'Conserver le programme pour une dégustation' : 'Conserver cet ajout pour une dégustation'}</Button>}</div>
    {saveNotice && <p role="status" className="text-sm text-hop">{saveNotice}</p>}{saveError && <p role="alert" className="text-sm text-alert">{saveError}</p>}
    {variantOpen && <HopExtrapolationPanel recipe={recipe} target={target} readOnly={readOnly} onChange={readOnly ? undefined : onChange} onBusyChange={onBusyChange} initiallyExpanded />}
  </section>;
}
