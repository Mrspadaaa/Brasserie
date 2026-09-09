import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import type { FermentationGoal, FermentationGuide } from '../../functions/src/fermentationGuideSchema';
import type { HopRange } from '../../functions/src/hopIndexSchema';
import type { FermentationStep } from '../types';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { applyFermentationGuide, createFermentationDraft, fermentationDose, fermentationDraftErrors, fermentationDuration, fermentationGuideChanged, fermentationPlan, fermentationStateKey, FERMENTATION_GOAL_LABELS, proposedFermentationSteps, readFermentationGuide, replacePrimaryFermentation } from '../domain/fermentationGuide';
import { useStorageValue } from '../hooks/useLiveData';
import { StorageService } from '../services/storage';
import { Units } from '../services/units';
import { Button } from '../components/ui/Button';
import { NumberInput } from './NumberInput';
import { inputClass } from './FormNav';
import { HopField } from './hopIndex/HopFactsEditor';
import { HopSourceLink } from './hopIndex/HopTechnicalPanel';
import { ensureGuideReferences, guideFermentations, guideFermentationScience, guideYeasts, type GuideYeast } from './hopIndex/guideData';
import type { FermentationScience } from '../../functions/src/fermentationScienceSchema';
import { suggestFermentationGoals } from '../../functions/src/fermentationScienceCore';
import { FermentationLeversPanel, FermentationPlanningCalculations, FermentationScienceLibrary } from './FermentationSciencePanel';
import { YeastCataloguePanel } from './YeastCataloguePanel';
import { applyCatalogueYeast } from '../domain/yeastCatalogue';
import { fermentationDefaultGoal, resolveFermentationYeast } from '../domain/fermentationScenario';
import { FermentationScenarioPanel } from './FermentationScenarioPanel';
import { fermentationRangeLabel } from './fermentationPresentation';

const rangeLabel = (r: HopRange, unit: string) => fermentationRangeLabel(r, unit, Number.isInteger(r.min) && Number.isInteger(r.max) ? 0 : 1);
const isPrimary = (s: FermentationStep) => s.kind === 'primaire' || s.kind === 'reposDiacetyle';
export { FermentationTemperatureChart } from './FermentationTemperatureChart';
import { FermentationTemperatureChart } from './FermentationTemperatureChart';

function FermentationPreview({ recipe, guide, yeast, goal, science, onChange, onBusyChange, simulationOnly = false }: {
  recipe: TrialRecipe; guide: FermentationGuide; yeast: GuideYeast; goal: FermentationGoal;
  onChange: (next: TrialRecipe) => void; onBusyChange?: (busy: boolean) => void;
  science?: FermentationScience;
  simulationOnly?: boolean;
}) {
  const plan = fermentationPlan(guide, goal)!;
  const [draft, setDraft] = useState(() => createFermentationDraft(guide, goal)!);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const pending = useRef(false), latest = useRef({ recipe, onChange }); latest.current = { recipe, onChange };
  const mounted = useRef(true);
  const busyCallback = useRef(onBusyChange); busyCallback.current = onBusyChange;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; if (pending.current) busyCallback.current?.(false); }; }, []);
  const errors = fermentationDraftErrors(guide, draft), dose = fermentationDose(guide, recipe.volumeL);
  const proposed = proposedFermentationSteps(guide, draft);
  const retained = (recipe.fermentation ?? []).filter(s => !isPrimary(s));
  const fullProgram = replacePrimaryFermentation(recipe.fermentation ?? [], proposed);
  const { aliases: _aliases, ...yeastReference } = yeast;
  const apply = async (withProgram: boolean) => {
    if (pending.current) return;
    pending.current = true; setBusy(true); onBusyChange?.(true); setError(''); setNotice('');
    const before = fermentationStateKey(latest.current.recipe);
    try {
      // Fail before writes for incomplete settings; references are imported only by this explicit action.
      applyFermentationGuide(latest.current.recipe, guide, yeastReference, draft, withProgram);
      if (!simulationOnly) await ensureGuideReferences({ knowledge: [yeastReference, guide] });
      if (!mounted.current) return;
      const current = guideFermentations(StorageService.getHopKnowledge()).find(g => g.id === guide.id);
      if (!current || fermentationStateKey(current) !== fermentationStateKey(guide)) throw Error('Le guide a changé pendant la préparation. Vérifie sa nouvelle proposition.');
      if (fermentationStateKey(latest.current.recipe) !== before) throw Error('La recette a changé pendant la préparation. Vérifie le programme avant de le reprendre.');
      latest.current.onChange(applyFermentationGuide(latest.current.recipe, guide, yeastReference, draft, withProgram));
      setNotice(withProgram ? 'Levure et paliers appliqués. Enregistre la recette pour les conserver.' : 'Levure appliquée. Le programme existant reste à vérifier pour cette souche.');
    } catch (e) { if (mounted.current) setError((e as Error).message); }
    finally { pending.current = false; if (mounted.current) { setBusy(false); onBusyChange?.(false); } }
  };
  const outsideDose = dose && draft.quantityG != null && (draft.quantityG < dose.range.min || draft.quantityG > dose.range.max);
  return <section aria-label="Programme de levure proposé" className="border-t border-cave-700 pt-4 space-y-4">
    <div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-cave-400">
        <span>Fenêtre fabricant : {rangeLabel(guide.temperatureC.range, '°C')}</span>
        <span>Principale et repos : {rangeLabel(fermentationDuration(plan), 'j')} · confiance faible</span>
      </div>
    </div>
    <FermentationTemperatureChart steps={proposed} bands={plan.phases.map(s => s.temperatureC.range)} pitchTempC={draft.pitchTempC} />
    {errors.map((e, i) => <p key={i} className="text-sm text-ebc-straw">{e}</p>)}
    {error && <p role="alert" className="text-sm text-alert">{error}</p>}
    {notice && <p role="status" className="text-sm text-hop">{simulationOnly ? 'Variante locale mise à jour. La recette enregistrée reste inchangée.' : notice}</p>}
    <div className="flex flex-col sm:flex-row gap-2">
      <Button intent="primary" disabled={busy || errors.length > 0} onClick={() => apply(true)}>Appliquer cette levure et ces paliers</Button>
      <Button disabled={busy || fermentationDraftErrors(guide, draft, false).length > 0} onClick={() => apply(false)}>Choisir la levure seulement</Button>
    </div>
    <details><summary className="cursor-pointer min-h-touch flex items-center text-water">Ajuster l’ensemencement et les paliers</summary><div className="space-y-4 pt-3">
    <HopField label="Ensemencement proposé (°C)" hint={`Réglage proposé : ${rangeLabel(plan.pitchTemperatureC.range, '°C')}. Température du moût à l’ajout de levure.`}>
      <NumberInput className={inputClass} value={draft.pitchTempC} emptyValue={undefined} disabled={busy} onValue={pitchTempC => setDraft({ ...draft, pitchTempC })} />
    </HopField>
    <ol className="space-y-4">
      {plan.phases.map((phase, i) => <li key={phase.id} className="border-l-2 border-ebc-straw/40 pl-3 space-y-2">
        <p className="font-semibold text-sm text-cave-100">{i + 1}. {phase.name}</p>
        <div className="grid grid-cols-2 gap-3">
          <HopField label={`Température du palier ${i + 1} (°C)`} hint={`Proposé : ${rangeLabel(phase.temperatureC.range, '°C')}`}><NumberInput className={inputClass} value={draft.phases[i].tempC} emptyValue={undefined} disabled={busy} onValue={tempC => setDraft({ ...draft, phases: draft.phases.map((p, j) => j === i ? { ...p, tempC } : p) })} /></HopField>
          <HopField label={`Durée du palier ${i + 1} (jours)`} hint={`Prévoir ${rangeLabel(phase.days.range, 'j')}`}><NumberInput className={inputClass} value={draft.phases[i].days} emptyValue={undefined} disabled={busy} onValue={days => setDraft({ ...draft, phases: draft.phases.map((p, j) => j === i ? { ...p, days } : p) })} /></HopField>
        </div>
        <p className="text-sm text-cave-300">{phase.completeWhen}</p>
      </li>)}
    </ol>
    {yeast.form === 'sèche' ? <div className="border-t border-cave-800 pt-3 space-y-2">
      <p className="text-sm text-cave-200">{dose ? <>Dose fabricant pour {Units.format(recipe.volumeL, 'L')} : <strong>{rangeLabel(dose.range, 'g')}</strong>. Confiance {dose.confidence === 'low' ? 'faible' : 'moyenne'} pour ce brassin.</> : 'Dose à renseigner : volume ou plage fabricant manquants.'}</p>
      <p className="text-xs text-cave-400">Conversion au volume seulement. Densité, fraîcheur et conditions d’ensemencement restent à vérifier ; aucune masse de sachet n’est supposée.</p>
      <HopField label="Quantité prévue de levure sèche (g)" hint="Facultative à ce stade ; une valeur vide reste à renseigner dans la recette."><NumberInput className={inputClass} value={draft.quantityG} emptyValue={undefined} disabled={busy} onValue={quantityG => setDraft({ ...draft, quantityG })} /></HopField>
      {outsideDose && <p role="status" className="text-sm text-ebc-straw">Quantité hors de la plage fabricant calculée au volume. Vérifie ce choix avec la densité et l’état de la levure.</p>}
    </div> : <p className="text-sm text-cave-300">Quantité de levure liquide à établir avec les cellules viables et la densité. Le guide ne suppose ni un flacon suffisant, ni une atténuation au milieu de la plage.</p>}
    </div></details>
    {retained.length > 0 && <details className="text-sm text-cave-300"><summary className="cursor-pointer min-h-touch py-2 text-water">Programme complet après application · étapes conservées</summary>
      <p>Les ajouts, la garde et la refermentation sont conservés. Vérifie leur nouveau placement sur ce calendrier avant d’appliquer.</p>
      <ol className="mt-2 space-y-1">{fullProgram.map((s, i) => <li key={i}>{i + 1}. {s.name} · {Units.format(s.tempC, '°C')} · {Units.format(s.days, 'j')}{!isPrimary(s) ? ' · conservé' : ''}</li>)}</ol>
    </details>}
    <details className="space-y-3 border-t border-cave-800 pt-2">
      <summary className="cursor-pointer min-h-touch py-2 text-water">Conseils pour développer ce profil · chimie et sources</summary>
      <p className="text-sm text-cave-200">{plan.rationale}</p><FermentationLeversPanel science={science} goal={goal} guide={guide} />
      <p className="text-sm text-cave-200">{guide.aroma.summary ?? guide.aroma.banana} {guide.aroma.phenols} Esters, phénols et libération des thiols sont des propriétés distinctes.</p>
      {guide.attenuationPct && <p className="text-sm text-cave-300">Atténuation apparente fabricant : {rangeLabel(guide.attenuationPct.range, '%')}. Ce n’est pas une mesure de ce moût et le guide n’en impose pas une moyenne.</p>}
      <HopSourceLink source={guide.aroma.source} /><HopSourceLink source={guide.temperatureC.source} />
      {guide.dryPitchGHL && <HopSourceLink source={guide.dryPitchGHL.source} />}
      {plan.notes.map((n, i) => <div className="text-sm space-y-1 text-cave-300" key={i}><p>{n.text}</p><HopSourceLink source={n.source} /></div>)}
      <p className="text-xs text-cave-400">Les consignes et durées sont des propositions éditoriales datées. Les fiches sans date gardent « année inconnue ». Le guide appliqué est enregistré dans l’Index puis modifiable dans ses connaissances, avec une nouvelle version.</p>
      <HopSourceLink source={plan.source} />
      <FermentationPlanningCalculations science={science} guide={guide} ogInitial={recipe.ogTarget} />
    </details>
  </section>;
}

export function FermentationWorkshop({ recipe, onChange, onBusyChange, simulationOnly = false }: { recipe: TrialRecipe; onChange: (next: TrialRecipe) => void; onBusyChange?: (busy: boolean) => void; simulationOnly?: boolean }) {
  const saved = useStorageValue(StorageService.getHopKnowledge);
  const guides = useMemo(() => guideFermentations(saved), [saved]), yeasts = useMemo(() => guideYeasts(saved), [saved]);
  const science = useMemo(() => guideFermentationScience(saved)[0], [saved]);
  const initial = readFermentationGuide(recipe);
  const currentYeast = useMemo(() => resolveFermentationYeast(recipe, yeasts), [recipe, yeasts]);
  const currentGuide = guides.find(g => g.yeastId === currentYeast?.id);
  const [chosenGoal, setGoal] = useState<FermentationGoal>();
  const goal = chosenGoal ?? (initial?.yeast.id === currentYeast?.id ? initial?.goal : undefined) ?? fermentationDefaultGoal(currentGuide);
  const [mode, setMode] = useState<'current' | 'choose'>(recipe.yeast.name ? 'current' : 'choose');
  const [aromaQuery, setAromaQuery] = useState('');
  const suggestions = suggestFermentationGoals(science, aromaQuery);
  const [form, setForm] = useState('all'), [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState(initial?.guide.id ?? '');
  const [catalogueNotice, setCatalogueNotice] = useState('');
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const choices = guides.filter(g => fermentationPlan(g, goal) && yeasts.some(y => y.id === g.yeastId && (form === 'all' || y.form === form)));
  const selected = choices.find(g => g.id === selectedId) ?? choices.find(g => g.yeastId === currentYeast?.id) ?? choices.find(g => yeasts.find(y => y.id === g.yeastId)?.form === recipe.yeast.form) ?? choices[0];
  const yeast = selected && yeasts.find(y => y.id === selected.yeastId);
  if(recipe.nolo?.enabled)return <NoloPanel recipe={recipe} onChange={onChange}/>;
  return <section aria-label="Atelier des arômes de levure" className="mb-6 p-3 sm:p-5 rounded-panel border border-ebc-straw/30 bg-cave-900 space-y-4">
    <div className="flex items-start gap-3"><FlaskConical className="text-ebc-straw shrink-0 mt-1" size={22} /><div>
      <h3 className="text-xl sm:text-2xl font-semibold text-cave-50">Levure & fermentation</h3>
      {simulationOnly && <p className="text-xs text-cave-400 mt-1">Variante locale · recette enregistrée inchangée</p>}
    </div></div>
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Parcours de fermentation">
      <Button disabled={busy} aria-pressed={mode === 'current'} onClick={() => setMode('current')}>Analyser ma levure</Button>
      <Button disabled={busy} aria-pressed={mode === 'choose'} onClick={() => setMode('choose')}>Choisir pour un arôme</Button>
    </div>
    {mode === 'current' ? <FermentationScenarioPanel recipe={recipe} yeasts={yeasts} guides={guides} science={science} goal={goal} onChange={onChange}/> : <>
    <HopField label="Objectif de fermentation"><select className={inputClass} value={goal} disabled={busy} onChange={e => setGoal(e.target.value as FermentationGoal)}>{Object.entries(FERMENTATION_GOAL_LABELS).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></HopField>
    <HopField label="Souche documentée"><select className={inputClass} value={selected?.id ?? ''} disabled={busy || !choices.length} onChange={e => setSelectedId(e.target.value)}>{!choices.length && <option value="">Aucune conduite active</option>}{choices.map(g => <option key={g.id} value={g.id}>{yeasts.find(y => y.id === g.yeastId)?.name}</option>)}</select></HopField>
    <details><summary className="cursor-pointer min-h-touch flex items-center text-water">Comparer les souches et affiner la recherche</summary><div className="space-y-3 pt-2">
    <HopField label="Arôme ou style recherché" hint="Par exemple : banane, pêche, girofle, lager ou thiols.">
      <input className={inputClass} value={aromaQuery} disabled={busy} placeholder="Banane, pêche, girofle…" onChange={e => setAromaQuery(e.target.value)} autoComplete="off" />
    </HopField>
    {aromaQuery.trim() && <div className="flex flex-wrap gap-2" role="group" aria-label="Suggestions d’objectif">{suggestions.length ? suggestions.map(s => <Button key={s.id} disabled={busy} onClick={() => { setGoal(s.id); setSelectedId(''); setAromaQuery(''); }}>{FERMENTATION_GOAL_LABELS[s.id]}</Button>) : <p className="text-sm text-cave-400">Aucun objectif documenté avec ces mots. Le catalogue complet et la saisie manuelle restent disponibles.</p>}</div>}
      <HopField label="Forme recherchée"><select className={inputClass} value={form} disabled={busy} onChange={e => setForm(e.target.value)}><option value="all">Toutes les formes</option><option value="sèche">Levure sèche</option><option value="liquide">Levure liquide</option></select></HopField>
    <div className="grid sm:grid-cols-2 gap-2" role="group" aria-label="Souches documentées pour cet objectif">
      {choices.map(g => <button key={g.id} type="button" disabled={busy} aria-pressed={g.id === selected?.id} onClick={() => setSelectedId(g.id)} className={`text-left min-h-touch p-3 rounded-control border transition-colors ${g.id === selected?.id ? 'border-ebc-straw bg-ebc-straw/10' : 'border-cave-700 hover:border-cave-400'}`}>
        <span className="block font-semibold text-cave-100">{yeasts.find(y => y.id === g.yeastId)?.name}</span>
        <span className="block text-xs text-ebc-straw mt-1">{yeasts.find(y => y.id === g.yeastId)?.form} · {rangeLabel(g.temperatureC.range, '°C')}</span>
      </button>)}
    </div>
    <details className="border border-cave-700 rounded-control p-3" onToggle={e=>setCatalogueOpen(e.currentTarget.open)}><summary className="cursor-pointer min-h-touch text-cave-100">Chercher dans toutes les levures et consulter leurs caractéristiques</summary>{catalogueOpen&&<div className="pt-3"><YeastCataloguePanel selectedId={recipe.yeast.hopIndexId} initialForm={recipe.yeast.form} disabled={busy} onSelect={(y,form)=>{
      onChange(applyCatalogueYeast(recipe,y,form));
      const documented=guides.find(g=>g.yeastId===y.id);
      if(documented){setSelectedId(documented.id);setForm(form);if(!fermentationPlan(documented,goal))setGoal(documented.plans[0].goal);}
      setCatalogueNotice(`${y.name} sélectionnée. Vérifie la quantité et les paliers avant d’enregistrer la recette.`);
    }}/>{catalogueNotice&&<p role="status" className="mt-3 text-sm text-ebc-straw">{catalogueNotice}</p>}</div>}</details>
    </div></details>
    {selected && yeast ? <FermentationPreview key={`${selected.id}/${selected.version}/${goal}`} recipe={recipe} guide={selected} yeast={yeast} goal={goal} science={science} onChange={onChange} simulationOnly={simulationOnly} onBusyChange={value => { setBusy(value); onBusyChange?.(value); }} /> : <p role="status" className="text-cave-300">Aucune conduite active pour ce choix. La saisie manuelle de la recette reste disponible.</p>}
    </>}
    <details className="border-t border-cave-700 pt-2"><summary className="cursor-pointer min-h-touch flex items-center text-water">Bibliothèque scientifique</summary><FermentationScienceLibrary science={science} /></details>
  </section>;
}

/** Saved recipes remain read-only. A variant has its own local state and no persistence adapter. */
export function FermentationRecipeSummary({ recipe, onEdit }: { recipe: TrialRecipe; onEdit?: () => void }) {
  const saved = useStorageValue(StorageService.getHopKnowledge);
  const yeasts = useMemo(() => guideYeasts(saved), [saved]), guides = useMemo(() => guideFermentations(saved), [saved]);
  const science = useMemo(() => guideFermentationScience(saved)[0], [saved]);
  const [variant, setVariant] = useState<TrialRecipe>();
  const snapshot = readFermentationGuide(recipe);
  const current = resolveFermentationYeast(recipe, yeasts);
  const goal = (snapshot?.yeast.id === current?.id ? snapshot?.goal : undefined) ?? fermentationDefaultGoal(guides.find(g => g.yeastId === current?.id));
  if (recipe.nolo?.enabled) return null; // The shared NOLO panel already owns this result and its variant.
  return <section aria-label="Conduite de levure de la recette" className="pt-4 mt-4 border-t border-cave-700 space-y-3">
    {variant ? <>
      <Button onClick={() => setVariant(undefined)}>Fermer la variante de levure</Button>
      <FermentationWorkshop recipe={variant} onChange={setVariant} simulationOnly />
    </> : <>
      <FermentationScenarioPanel recipe={recipe} yeasts={yeasts} guides={guides} science={science} goal={goal}/>
      {snapshot && <>
        {fermentationGuideChanged(recipe,snapshot) && <p role="status" className="text-sm text-ebc-straw">La recette diffère des réglages adoptés. La référence conservée ne certifie plus cette conduite.</p>}
        <details><summary className="cursor-pointer min-h-touch flex items-center text-water">Conduite et sources conservées</summary><div className="space-y-2 text-sm text-cave-300 py-2">
          <p>{snapshot.yeast.name} · {FERMENTATION_GOAL_LABELS[snapshot.goal]} · version {snapshot.guide.version}</p>
          <p>{snapshot.guide.aroma.summary ?? snapshot.guide.aroma.banana} {snapshot.guide.aroma.phenols}</p>
          <p>Fenêtre conservée : {rangeLabel(snapshot.guide.temperatureC.range,'°C')}. Les informations du panneau principal utilisent les références actuelles.</p>
          <HopSourceLink source={snapshot.guide.temperatureC.source}/>
          {fermentationPlan(snapshot.guide,snapshot.goal)?.phases.map(p => <p key={p.id}>{p.name} : {p.completeWhen}</p>)}
        </div></details>
      </>}
      <div className="flex flex-col sm:flex-row gap-2"><Button onClick={() => setVariant(structuredClone(recipe))}>Simuler une variante de levure</Button>
        {onEdit && <Button onClick={onEdit}>Modifier la conduite de fermentation</Button>}
      </div>
    </>}
  </section>;
}
import { NoloPanel } from './NoloPanel';
