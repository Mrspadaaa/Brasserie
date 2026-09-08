import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlaskConical, ArrowRight } from 'lucide-react';
import type { HopRange, HopSource, HopVariety } from '../../../functions/src/hopIndexSchema';
import { HOP_TIMINGS, type HopAxis, type HopPrediction, type HopTriplet, type HopYeast } from '../../../functions/src/hopPredictionSchema';
import { hopDescriptorEvidence } from '../../../functions/src/hopExtrapolationCore';
import type { HopExtrapolation } from '../../../functions/src/hopExtrapolationSchema';
import { compareHopPredictions, createHopPredictor, predictHopTriplet, usableHopKnowledge } from '../../domain/hopIndex/engine';
import { applyHopScenario, recipeHopScenario } from '../../domain/hopIndex/exploration';
import { prefillHopScenario } from '../../domain/hopIndex/solver';
import { captureHopPrediction } from '../../domain/hopIndex/snapshots';
import type { TrialRecipe } from '../../domain/hopIndex/trials';
import { useStorageValue } from '../../hooks/useLiveData';
import { StorageService } from '../../services/storage';
import { useHopCatalogue } from './useHopCatalogue';
import { ensureGuideReferences, guideAxes, guidePredictionKnowledge, guideSolverPolicy, guideYeasts } from './guideData';
import { HopField } from './HopFactsEditor';
import { HopSourceLink } from './HopTechnicalPanel';
import { HopPredictionView } from './HopPredictionView';
import { HOP_TIMING_LABELS, hopDoseLabel, hopDurationLabel, hopIntensityLabel, hopRangeLabel } from './presentation';
import { hopReferenceSource } from '../../domain/hopIndex/labels';
import { Button } from '../../components/ui/Button';
import { Combobox } from '../Combobox';
import { NumberInput } from '../NumberInput';
import { inputClass } from '../FormNav';

const contactFactor=(t:HopTriplet)=>t.timing==='firstWort'||t.timing==='boil'||t.timing==='whirlpool'?60:1;
const sample: HopTriplet = { varietyId: 'hopsteiner-cas', yeastId: 'fermentis-us05', timing: 'postFermentation', doseGL: null, temperatureC: null, contactHours: null, matrixId: null, lotId: null };

export function HopExplorationChart({ prediction, axes, target, baseline, highlighted }: {
  prediction: HopPrediction; axes: HopAxis[]; target: Record<string, HopRange>; baseline?: HopPrediction; highlighted: string[];
}) {
  const rows = axes.filter(a => highlighted.includes(a.id) || target[a.id]);
  const other = axes.filter(a => !rows.includes(a));
  const plot = (axis: HopAxis, uncertain = false) => {
    const estimate = prediction.profile[axis.id], r = estimate?.range;
    const start = (n: number) => 100 * (n - axis.scale.min) / (axis.scale.max - axis.scale.min);
    const before = baseline?.profile[axis.id]?.range;
    return <div key={axis.id} className="space-y-1">
      <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm"><span className={uncertain ? 'text-cave-400' : 'font-semibold text-cave-50'}>{axis.name}</span><span className="text-cave-200">{!uncertain && estimate?.central !== undefined ? `Tendance ${hopIntensityLabel({ ...estimate, range: { min: estimate.central, max: estimate.central } }, axis)}` : uncertain ? 'Peu documenté' : hopIntensityLabel(estimate, axis)}</span></div>
      <div className="relative h-6 rounded bg-cave-800 overflow-hidden" aria-hidden="true">
        {[axis.lowMax, axis.mediumMax].map(n => <span key={n} className="absolute h-full border-l border-cave-600" style={{ left: `${start(n)}%` }} />)}
        {target[axis.id] && <span className="absolute inset-y-0 border-x-2 border-ebc-straw/70 bg-ebc-straw/10" style={{ left: `${start(target[axis.id].min)}%`, width: `${start(target[axis.id].max) - start(target[axis.id].min)}%` }} />}
        {before && <span className="absolute h-1 bottom-0 bg-cave-400" style={{ left: `${start(before.min)}%`, width: `${start(before.max) - start(before.min)}%` }} />}
        {r && <span className={`absolute top-1 h-3 rounded ${uncertain ? 'bg-cave-500/40' : 'bg-hop/40'}`} style={{ left: `${start(r.min)}%`, width: `${start(r.max) - start(r.min)}%` }} />}
        {!uncertain && estimate?.central !== undefined && <span className="absolute top-0 bottom-0 w-1 -translate-x-1/2 rounded bg-hop" style={{ left: `${start(estimate.central)}%` }} />}
      </div>
      <p className="text-xs text-cave-400">{r ? `Plage ${hopRangeLabel(r)} · confiance faible` : 'Données à préciser'}{uncertain ? ' · présence non établie' : ''}</p>
    </div>;
  };
  return <figure className="space-y-3" aria-label="Graphe de la prédiction expérimentale">
    <figcaption className="space-y-1"><p className="text-lg font-serif text-cave-50">Ce que ce scénario pourrait exprimer</p><p className="text-xs text-cave-400">Faible → moyenne → forte · indice local 0–100. Trait vert : hypothèse centrale. Bande : incertitude du modèle. {baseline && 'Trait gris : scénario précédent. '}{Object.keys(target).length > 0 && 'Doré : ton objectif.'}</p></figcaption>
    {rows.map(a => plot(a))}
    {!rows.length && <p className="text-sm text-cave-200">Aucune famille caractérisée dans les sources de cette combinaison. Le modèle conserve des plages larges ; ajoute une description sourcée pour les préciser.</p>}
    {other.length > 0 && <details><summary className="min-h-touch cursor-pointer text-sm text-cave-400">Autres familles · {other.length} incertitudes à explorer</summary><div className="space-y-4 pt-2">{other.map(a => plot(a, true))}</div></details>}
  </figure>;
}

/** One shared engine for a free scenario, the recipe assistant and the saved report. */
export function HopExtrapolationPanel({ recipe, onChange, onBusyChange, target = {}, readOnly = false }: {
  recipe?: TrialRecipe; onChange?: (recipe: TrialRecipe) => void; onBusyChange?: (busy: boolean) => void;
  target?: Record<string, HopRange>; readOnly?: boolean;
}) {
  const savedKnowledge = useStorageValue(StorageService.getHopKnowledge), lots = useStorageValue(StorageService.getHopLots);
  const { varieties: catalogue, loading } = useHopCatalogue();
  const [personalVarieties, setPersonalVarieties] = useState<HopVariety[]>([]), [personalYeasts, setPersonalYeasts] = useState<HopYeast[]>([]);
  const [newYeast, setNewYeast] = useState<string | null>(null);
  const varieties = useMemo(() => [...new Map([...personalVarieties, ...catalogue].map(v => [v.id, v])).values()], [personalVarieties, catalogue]);
  const knowledge = useMemo(() => guidePredictionKnowledge([...personalYeasts, ...savedKnowledge]), [savedKnowledge, personalYeasts]);
  const valid = useMemo(() => usableHopKnowledge(knowledge), [knowledge]);
  const axes = useMemo(() => guideAxes(savedKnowledge), [savedKnowledge]), yeasts = useMemo(() => guideYeasts([...personalYeasts, ...savedKnowledge]), [savedKnowledge, personalYeasts]);
  const models = valid.valid.filter((k): k is HopExtrapolation => k.kind === 'extrapolation' && k.enabled);
  const [addition, setAddition] = useState(0);
  const [variantOpen, setVariantOpen] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const recipeScenario = recipe ? recipeHopScenario(recipe, addition, varieties, yeasts) : null;
  const solverPolicy = useMemo(() => guideSolverPolicy(savedKnowledge), [savedKnowledge]);
  const proposedConditions = solverPolicy && !readOnly ? prefillHopScenario(recipeScenario?.triplet ?? sample, solverPolicy, recipe) : undefined;
  const initial = proposedConditions?.triplet ?? recipeScenario?.triplet ?? sample;
  const fingerprint = JSON.stringify(initial);
  const recipeFingerprint = JSON.stringify([recipe?.hops[addition], recipe?.yeast, recipe?.volumeL, addition]);
  const edited = useRef(false), previousRecipe = useRef(recipeFingerprint);
  const [scenario, setScenario] = useState<HopTriplet>(initial);
  const [comparison, setComparison] = useState<HopPrediction>();
  const [ranked, setRanked] = useState<HopPrediction[] | null>(null);
  const [rankedAssociations, setRankedAssociations] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [timingDefaults, setTimingDefaults] = useState(false);
  const pending = useRef(false), latest = useRef(recipe); latest.current = recipe;
  const mounted = useRef(true), busyCallback = useRef(onBusyChange); busyCallback.current = onBusyChange;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; busyCallback.current?.(false); }; }, []);
  useEffect(() => {
    if (previousRecipe.current !== recipeFingerprint) { edited.current = false; previousRecipe.current = recipeFingerprint; }
    if (!edited.current) { setScenario(initial); setComparison(undefined); setRanked(null); }
  }, [fingerprint, recipeFingerprint, addition]);
  useEffect(() => { setRanked(null); }, [JSON.stringify(target), knowledge, varieties]);
  const data = useMemo(() => ({ varieties, lots, knowledge }), [varieties, lots, knowledge]);
  const querySignature = JSON.stringify([scenario, target]);
  const latestQuery = useRef({ querySignature, data }); latestQuery.current = { querySignature, data };
  const prediction = useMemo(() => predictHopTriplet(scenario, target, data), [scenario, target, data]);
  const variety = varieties.find(v => v.id === scenario.varietyId), yeast = yeasts.find(y => y.id === scenario.yeastId);
  const strainFacts = models.flatMap(m => m.yeasts.filter(y => y.yeastId === scenario.yeastId));
  const highlighted = axes.filter(a => (!prediction.extrapolatedAxes?.includes(a.id) && !!prediction.profile[a.id]?.range) || models.some(m =>
    (variety && hopDescriptorEvidence(variety, m.axes.find(d => d.id === a.id)?.terms ?? []).length > 0) || !!m.yeasts.find(y => y.yeastId === scenario.yeastId)?.aroma[a.id]?.range.min)).map(a => a.id);
  const update = (patch: Partial<HopTriplet>) => { edited.current = true; setScenario(s => ({ ...s, ...patch, matrixId: null })); setRanked(null); setNotice(''); };
  const personalSource = (): HopSource => ({ title: 'Référence de travail saisie dans le simulateur', author: 'Brasseur de L’Affinée', year: new Date().getFullYear(), kind: 'observation', reference: 'Saisie directe dans l’atelier aromatique', locator: 'Identité et éventuels descripteurs saisis par le brasseur, sans analyse chimique ni capacité enzymatique attestée.' });
  const run = async (fn: () => Promise<void>) => {
    if (pending.current) return;
    pending.current = true; setBusy(true); onBusyChange?.(true); setError(''); setNotice('');
    try { await fn(); } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'Scénario indisponible.'); }
    finally { pending.current = false; if (mounted.current) { setBusy(false); busyCallback.current?.(false); } }
  };
  const saveEvidence = () => ensureGuideReferences({ varieties: variety ? [variety] : [], knowledge: valid.valid.filter(k => k.kind !== 'trial' && k.kind !== 'note') });
  const search = (associations: boolean) => run(async () => {
    setRanked(null); setRankedAssociations(associations);
    const timings = associations && ['fermentation', 'postFermentation'].includes(scenario.timing ?? '') ? ['fermentation', 'postFermentation'] as const : [scenario.timing];
    const yeastIds = associations ? yeasts.map(y => y.id) : [scenario.yeastId];
    const hops=varieties.filter(v=>!v.archived),total=hops.length*yeastIds.length*timings.length;
    const predict=createHopPredictor(data);
    const results: HopPrediction[] = [];
    // Cooperative batches keep the controls responsive; the comparator is the
    // same shared function, and batching cannot alter the numerical result.
    for (let i = 0; i < total; i += 40) {
      if (!mounted.current) return;
      if (latestQuery.current.querySignature !== querySignature || latestQuery.current.data !== data) { setNotice('Les critères ou références ont changé. Relance la comparaison pour les prendre en compte.'); return; }
      for(let j=i;j<Math.min(i+40,total);j++){
        const pair=Math.floor(j/timings.length);
        const candidate=predict({...scenario,varietyId:hops[Math.floor(pair/yeastIds.length)].id,yeastId:yeastIds[pair%yeastIds.length],timing:timings[j%timings.length],lotId:null,matrixId:null},target);
        if(candidate.score.range){results.push(candidate);results.sort(compareHopPredictions);results.splice(5);}
      }
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    if (mounted.current && latestQuery.current.querySignature === querySignature && latestQuery.current.data === data) setRanked(results.filter(p => p.score.range).sort(compareHopPredictions).slice(0, 5));
  });
  const apply = () => run(async () => {
    const current = latest.current;
    if (!current || !variety || !yeast || !onChange) return;
    const before = JSON.stringify(current);
    const next = applyHopScenario(current, addition, scenario, variety, yeast);
    await saveEvidence();
    if (!mounted.current) return;
    if (JSON.stringify(latest.current) !== before) throw Error('La recette a changé pendant l’enregistrement. Relis le scénario avant de l’appliquer.');
    onChange(next); setNotice('Scénario appliqué. Vérifie les alpha, la quantité de levure et les paliers de fermentation.');
  });
  const controls = <div className="space-y-3">
    <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-3"><HopField label="Houblon à simuler"><Combobox ariaLabel="Houblon à simuler" value={scenario.varietyId ?? ''} disabled={busy || loading} placeholder="Cascade, Idaho 7…" options={varieties.filter(v => !v.archived).map(v => ({ value: v.id, label: v.name, detail: `${hopReferenceSource(v)} · ${v.aliases.join(', ')}` }))} onChange={id => update({ varietyId: id, lotId: null })} allowCreate createLabel={name => `Simuler « ${name} » hors catalogue`} onCreate={name => {
        const v: HopVariety = { id: crypto.randomUUID(), name: name.trim(), aliases: [], form: 'unknown', analysis: [], descriptions: [{ text: 'Référence libre : aucun descripteur aromatique renseigné.', context: 'unspecified', source: personalSource() }] };
        setPersonalVarieties(rows => [...rows, v]); update({ varietyId: v.id, lotId: null });
      }} /></HopField>
      <HopField label="Levure à simuler"><select className={inputClass} disabled={busy} value={newYeast === null ? scenario.yeastId ?? '' : '__new'} onChange={e => { if (e.target.value === '__new') setNewYeast(''); else { setNewYeast(null); update({ yeastId: e.target.value || null }); } }}><option value="">Choisir une souche</option>{yeasts.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}<option value="__new">Autre souche, à renseigner…</option></select></HopField>
    </div>
    {newYeast !== null && <div className="space-y-2"><HopField label="Nom de la souche hors catalogue"><input className={inputClass} disabled={busy} value={newYeast} onChange={e => setNewYeast(e.target.value)} /></HopField><Button disabled={!newYeast.trim() || busy} onClick={() => {
      const y: HopYeast = { id: crypto.randomUUID(), kind: 'yeast', name: newYeast.trim(), betaLyase: 'unknown', source: personalSource() };
      setPersonalYeasts(rows => [...rows, y]); update({ yeastId: y.id }); setNewYeast(null);
    }}>Utiliser cette souche</Button><p className="text-xs text-cave-400">Souche non caractérisée : plage large, aucune neutralité ou activité enzymatique supposée.</p></div>}
    {personalVarieties.some(v => v.id === scenario.varietyId) && !catalogue.some(v => v.id === scenario.varietyId) && <HopField label="Descripteurs connus du houblon (facultatif)"><input className={inputClass} disabled={busy} placeholder="Tes observations : agrumes, floral…" value={personalVarieties.find(v => v.id === scenario.varietyId)?.descriptions[1]?.text ?? ''} onChange={e => setPersonalVarieties(rows => rows.map(v => v.id === scenario.varietyId ? { ...v, descriptions: e.target.value.trim() ? [v.descriptions[0], { text: e.target.value, context: 'unspecified', source: personalSource() }] : [v.descriptions[0]] } : v))} /></HopField>}
    <HopField label="Moment de l’ajout simulé"><select className={inputClass} disabled={busy} value={scenario.timing ?? ''} onChange={e => { const next = { ...scenario, timing: e.target.value as HopTriplet['timing'], contactHours: null, temperatureC: null }; update(solverPolicy ? prefillHopScenario(next, solverPolicy, recipe).triplet : next); setTimingDefaults(true); }}><option value="" disabled>Choisir un moment</option>{HOP_TIMINGS.map(t => <option key={t} value={t}>{HOP_TIMING_LABELS[t]}</option>)}</select></HopField>
    <div className="grid grid-cols-3 gap-2">{([{ key: 'doseGL', label: 'Dose (g/L)' }, { key: 'temperatureC', label: 'Contact (°C)' }, { key: 'contactHours', label: contactFactor(scenario)===60?'Durée (min)':'Durée (h)' }] as const).map(f => <HopField key={f.key} label={f.label}><NumberInput aria-label={f.label} className={inputClass} disabled={busy} value={scenario[f.key]===null?undefined:scenario[f.key]*(f.key==='contactHours'?contactFactor(scenario):1)} emptyValue={undefined} onValue={n => update({ [f.key]: n===undefined?null:n/(f.key==='contactHours'?contactFactor(scenario):1) })} /></HopField>)}</div>
    {!!lots.filter(l => l.varietyId === scenario.varietyId).length && <HopField label="Lot ou analyse de référence"><select className={inputClass} disabled={busy} value={scenario.lotId ?? ''} onChange={e => update({ lotId: e.target.value || null })}><option value="">Référence variétale</option>{lots.filter(l => l.varietyId === scenario.varietyId).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></HopField>}
    <p className="text-xs text-cave-400">Un champ vide élargit la plage. La température est celle du contact avec le houblon. Un COA partiel reste consultable ; il ne resserre que les modèles qui utilisent réellement ses analyses.</p>
    {(proposedConditions?.conditions.length || timingDefaults) && <p className="text-xs text-water">Les conditions manquantes ont été préremplies pour explorer ce scénario, à partir du guide de formulation ou d’un palier de la recette. Ce sont des valeurs proposées, à confirmer avant application.</p>}
  </div>;
  return <section aria-label="Simulateur aromatique expérimental" className="space-y-5 rounded-panel border border-hop/30 bg-cave-950/40 p-3 sm:p-4">
    <header className="space-y-2"><div className="flex gap-2 items-center"><FlaskConical size={18} className="text-hop" /><h3 className="font-serif text-xl text-cave-50">Tester une combinaison libre</h3></div><p className="text-sm text-cave-200">Change un ingrédient ou un ajout, compare, puis applique.</p><p className="text-xs text-ebc-straw">Modèle expérimental · confiance faible · plages non validées par dégustation.</p></header>
    {recipe && recipe.hops.length > 1 && <HopField label="Ajout à explorer"><select className={inputClass} value={addition} disabled={busy} onChange={e => setAddition(Number(e.target.value))}>{recipe.hops.map((h, i) => <option key={i} value={i}>Ajout {i + 1} · {h.name}</option>)}</select></HopField>}
    {!recipeScenario && <p className="text-xs text-cave-400">Simulation libre, initialisée avec un exemple à adapter. Elle ne modifie pas la recette avant application.</p>}
    {!!recipeScenario?.proposed.length && <div className="border-l-2 border-ebc-straw pl-3 text-xs text-ebc-straw space-y-1">{recipeScenario.proposed.map(p => <p key={p}>{p}</p>)}<p>Ces propositions ne modifient pas la recette.</p></div>}
    <div className={readOnly ? 'space-y-4' : 'grid lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] gap-5'}><div className="space-y-4">
    {readOnly ? <div className="space-y-3"><Button onClick={() => setVariantOpen(v => !v)} aria-expanded={variantOpen}>Explorer une variante sans modifier la recette</Button>{variantOpen && controls}</div> : controls}
    <div><p className="font-semibold text-cave-50">{variety?.name ?? recipe?.hops[addition]?.name ?? 'Houblon à choisir'} × {yeast?.name ?? recipe?.yeast?.name ?? 'Levure à choisir'}</p><p className="text-sm text-hop">{scenario.timing ? HOP_TIMING_LABELS[scenario.timing] : 'Moment à choisir'} · {hopDoseLabel(scenario.doseGL)} · {hopDurationLabel(scenario.contactHours)}</p></div>
    <details><summary className="cursor-pointer min-h-touch text-sm text-water">Profil de levure, phénols et thiols</summary><div className="text-sm text-cave-200 space-y-2">{strainFacts.length ? strainFacts.map((y, i) => <div key={i} className="space-y-2"><p>{y.notes[0]}</p>{y.evidence.map((s, j) => <HopSourceLink key={j} source={s} />)}</div>) : <p>Profil de cette souche non caractérisé dans le modèle. Ni neutralité, ni statut phénolique, ni rendement de libération des thiols ne sont déduits de son nom.</p>}<p>3SH/3MH et 4MSP/4MMP : libération de précurseurs selon les voies enzymatiques. 3SHA/3MHA : transformation distincte du 3SH. POF décrit les phénols de levure ; il ne mesure pas la β-lyase. Les quantités finales restent non calculées ici.</p></div></details>
    </div><div className="space-y-4 min-w-0">
    <HopExplorationChart prediction={prediction} axes={axes} target={target} baseline={comparison} highlighted={highlighted} />
    {prediction.score.range && <p className="text-sm text-ebc-straw">Adéquation à ton objectif : {hopRangeLabel(prediction.score.range)} / 100 · convention de classement, pas probabilité de réussite.</p>}
    {prediction.risks.filter(r => r.status !== 'unknown').map(r => <p key={r.code} className="border-l-2 border-ebc-straw pl-3 text-sm text-ebc-straw">{r.title} · {r.message}</p>)}
    </div></div>
    {!prediction.modelRefs.length && <p role="status" className="text-sm text-ebc-straw">{!variety || !yeast || !scenario.timing ? 'Précise les trois membres du scénario dans les champs ci-dessus.' : 'Le modèle expérimental est absent ou désactivé dans les connaissances.'}</p>}
    {prediction.modelRefs.length > 0 && <div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => setComparison(prediction)}>Garder ce graphe pour comparer</Button>
      {!readOnly && <Button disabled={busy} onClick={() => void run(async () => {
        const snapshot = captureHopPrediction(scenario, target, data, { id: crypto.randomUUID(), name: `${variety?.name} × ${yeast?.name} · ${HOP_TIMING_LABELS[scenario.timing!]}`, createdAt: new Date().toISOString(), ...(recipe && 'id' in recipe ? { recipeId: recipe.id } : {}) });
        await saveEvidence(); StorageService.saveHopPrediction(snapshot); setNotice('Prédiction conservée avec ses sources et hypothèses, disponible dans les dégustations.');
      })}>Conserver pour une dégustation</Button>}
    </div>}
    {!readOnly && !!Object.keys(target).length && <div className="space-y-3 border-t border-cave-700 pt-3"><div className="flex flex-wrap gap-2"><Button disabled={busy || loading || !yeast || !scenario.timing} onClick={() => void search(false)}>Chercher des houblons pour cet objectif</Button><Button disabled={busy || loading || !scenario.timing} onClick={() => void search(true)}>Comparer aussi les levures</Button></div>
      {busy && <p role="status" className="text-xs text-cave-400">Traitement du scénario…</p>}
      {ranked && <><p className="text-xs text-cave-400">{rankedAssociations ? 'Associations comparées à dose, température et contact identiques. À cru, les phases active et après fermentation sont comparées.' : 'Même levure, timing et dose.'} Ordre par borne basse d’adéquation, puis plage la plus étroite. Les plages se recouvrent : ce classement ne désigne pas un gagnant démontré.</p>{ranked.map(p => <button key={JSON.stringify(p.triplet)} type="button" className="w-full min-h-touch flex gap-3 justify-between text-left rounded-control bg-cave-850 p-3 text-sm" onClick={() => { setComparison(prediction); edited.current = true; setScenario(p.triplet); setRanked(null); }}><span><span className="block text-cave-50">{varieties.find(v => v.id === p.triplet.varietyId)?.name}</span><span className="block text-xs text-cave-400">{yeasts.find(y => y.id === p.triplet.yeastId)?.name} · {HOP_TIMING_LABELS[p.triplet.timing!]}</span></span><span className="text-hop flex gap-2 items-center">{hopRangeLabel(p.score.range)} <ArrowRight size={16} /></span></button>)}</>}
    </div>}
    {recipe && onChange && !readOnly && <div className="space-y-2 border-t border-cave-700 pt-4"><p className="text-sm text-cave-200">Appliquer remplace {recipe.hops[addition] ? `l’ajout ${addition + 1}` : 'le premier ajout à créer'} et la souche de la recette. Les autres houblons restent en place.</p><Button intent="primary" disabled={busy || !variety || !yeast || !scenario.timing} onClick={() => void apply()}>Appliquer ce scénario à la recette</Button></div>}
    <details onToggle={e => setExplanationOpen(e.currentTarget.open)}><summary className="cursor-pointer min-h-touch text-sm text-cave-400">Calcul, voies chimiques et sources</summary>{explanationOpen && <div className="pt-2"><HopPredictionView prediction={prediction} axes={axes.filter(a => highlighted.includes(a.id) || target[a.id])} target={target} names={{ variety: variety?.name, yeast: yeast?.name }} /></div>}</details>
    <details><summary className="cursor-pointer min-h-touch text-sm text-cave-400">Hypothèses modifiables et validation</summary><div className="text-sm text-cave-400 space-y-3"><p>Le modèle n’a pas encore de validation indépendante. Conserve un scénario avant brassage, puis lie une dégustation pour suivre son écart. Les bières commerciales renseignent cet écart si leur triplet est connu ; un triplet inconnu ne sert pas de calibration.</p>{models.map(m => <div key={m.id}><p>{m.name} · {m.version}</p><HopSourceLink source={m.source} /></div>)}<p>Les versions enregistrées se modifient dans Index houblon → Connaissances → édition avancée. Elles priment immédiatement sur les données initiales, sans redéploiement.</p>{!readOnly && <Button disabled={busy} onClick={() => void run(async () => { await saveEvidence(); setNotice('Hypothèses enregistrées dans les connaissances, modifiables sans redéploiement.'); })}>Enregistrer les hypothèses dans mes connaissances</Button>}</div></details>
    {recipe && recipe.hops.length > 1 && <p className="text-xs text-cave-400">Ce graphe décrit un ajout avec la levure. Les graphes de plusieurs ajouts ne s’additionnent pas ; le profil global du mélange reste à valider.</p>}
    {valid.errors.length > 0 && <p role="alert" className="text-sm text-ebc-straw">{valid.errors.join(' ')}</p>}
    {error && <p role="alert" className="text-sm text-alert">{error}</p>}{notice && <p role="status" className="text-sm text-hop">{notice}</p>}
  </section>;
}
