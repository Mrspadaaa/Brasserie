import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlaskConical, Thermometer } from 'lucide-react';
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
import { FermentationLeversPanel, FermentationPlanningCalculations, FermentationScienceLibrary, FermentationRecipeAdvice } from './FermentationSciencePanel';
import { YeastCataloguePanel, YeastCatalogueDetails } from './YeastCataloguePanel';
import { applyCatalogueYeast } from '../domain/yeastCatalogue';

const rangeLabel = (r: HopRange, unit: string) => `${Units.format(r.min, '').trim()}–${Units.format(r.max, unit)}`;
const isPrimary = (s: FermentationStep) => s.kind === 'primaire' || s.kind === 'reposDiacetyle';
const validStep = (s: FermentationStep) => Number.isFinite(s.tempC) && Number.isFinite(s.days) && s.days >= 0;

/** A temperature programme, never a fabricated gravity or ester-production curve. */
export function FermentationTemperatureChart({ steps, bands = [], pitchTempC }: { steps: FermentationStep[]; bands?: HopRange[]; pitchTempC?: number }) {
  const box = useRef<HTMLDivElement>(null), [width, setWidth] = useState(400);
  const total = steps.reduce((sum, s) => sum + s.days, 0);
  const drawable = steps.length > 0 && steps.every(validStep) && Number.isFinite(total) && total > 0;
  useEffect(() => {
    if (!box.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => { if (entry.contentRect.width > 0) setWidth(Math.max(200, entry.contentRect.width)); });
    observer.observe(box.current); return () => observer.disconnect();
  }, [drawable]);
  if (!drawable) return <p className="text-sm text-cave-400">Renseigne les paliers pour afficher le calendrier.</p>;
  const temperatures = [...steps.map(s => s.tempC), ...bands.flatMap(b => [b.min, b.max]), ...(Number.isFinite(pitchTempC) ? [pitchTempC!] : [])];
  const min = Math.floor(Math.min(...temperatures)) - 1, max = Math.ceil(Math.max(...temperatures)) + 1;
  const left = 42, right = width - 18, top = 20, bottom = 166;
  const x = (day: number) => left + day / total * (right - left), y = (temp: number) => bottom - (temp - min) / (max - min) * (bottom - top);
  let elapsed = 0;
  const segments = steps.map((s, i) => { const start = elapsed; elapsed += s.days; return { ...s, start, end: elapsed, band: bands[i] }; });
  const line = segments.flatMap(s => [`${x(s.start)},${y(s.tempC)}`, `${x(s.end)},${y(s.tempC)}`]).join(' ');
  return <figure aria-label="Calendrier des températures de fermentation" className="space-y-2">
    <figcaption className="text-sm text-cave-200">Température de la bière · jours indicatifs</figcaption>
    <div ref={box} className="w-full min-w-0">
      <svg className="w-full" height="205" viewBox={`0 0 ${width} 205`} role="img" aria-label="Consignes de température en fonction des jours de fermentation">
        <title>Calendrier proposé, à ajuster à la densité et à la dégustation</title>
        {[...new Set([0, 1, 2, 3].map(i => Math.round(min + (max - min) * i / 3)))].map(t => <g key={t}>
          <line x1={left} x2={right} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-cave-700" />
          <text x={left - 6} y={y(t) + 4} textAnchor="end" fill="currentColor" className="text-cave-400" fontSize="12">{Units.format(t, '')}</text>
        </g>)}
        {segments.map((s, i) => <g key={i}>
          {s.band && <rect x={x(s.start)} width={x(s.end) - x(s.start)} y={y(s.band.max)} height={Math.max(2, y(s.band.min) - y(s.band.max))} fill="currentColor" className="text-ebc-straw/20" />}
          <line x1={x(s.end)} x2={x(s.end)} y1={top} y2={bottom} stroke="currentColor" className="text-cave-600" strokeDasharray="3 4" />
        </g>)}
        <polyline points={line} fill="none" stroke="currentColor" className="text-ebc-straw" strokeWidth="3" />
        {Number.isFinite(pitchTempC) && <circle cx={x(0)} cy={y(pitchTempC!)} r="4" fill="currentColor" className="text-water" />}
        {[0, total / 2, total].map((day, i) => <text key={i} x={x(day)} y={190} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'} fill="currentColor" className="text-cave-300" fontSize="12">J{Units.format(day, '')}</text>)}
        <text x="3" y="12" fill="currentColor" className="text-cave-400" fontSize="12">°C</text>
      </svg>
    </div>
    <p className="text-xs text-cave-400">Trait : consignes. Point bleu : ensemencement.{bands.length > 0 ? ' Bande : plage proposée, confiance faible ; ce n’est pas un intervalle statistique.' : ' Le calendrier ne confirme pas la fin de fermentation.'}</p>
  </figure>;
}

function FermentationPreview({ recipe, guide, yeast, goal, science, onChange, onBusyChange }: {
  recipe: TrialRecipe; guide: FermentationGuide; yeast: GuideYeast; goal: FermentationGoal;
  onChange: (next: TrialRecipe) => void; onBusyChange?: (busy: boolean) => void;
  science?: FermentationScience;
}) {
  const plan = fermentationPlan(guide, goal)!;
  const [draft, setDraft] = useState(() => createFermentationDraft(guide, goal)!);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const pending = useRef(false), latest = useRef({ recipe, onChange }); latest.current = { recipe, onChange };
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
      await ensureGuideReferences({ knowledge: [yeastReference, guide] });
      const current = guideFermentations(StorageService.getHopKnowledge()).find(g => g.id === guide.id);
      if (!current || fermentationStateKey(current) !== fermentationStateKey(guide)) throw Error('Le guide a changé pendant la préparation. Vérifie sa nouvelle proposition.');
      if (fermentationStateKey(latest.current.recipe) !== before) throw Error('La recette a changé pendant la préparation. Vérifie le programme avant de le reprendre.');
      latest.current.onChange(applyFermentationGuide(latest.current.recipe, guide, yeastReference, draft, withProgram));
      setNotice(withProgram ? 'Levure et paliers appliqués. Enregistre la recette pour les conserver.' : 'Levure appliquée. Le programme existant reste à vérifier pour cette souche.');
    } catch (e) { setError((e as Error).message); }
    finally { pending.current = false; setBusy(false); onBusyChange?.(false); }
  };
  const outsideDose = dose && draft.quantityG != null && (draft.quantityG < dose.range.min || draft.quantityG > dose.range.max);
  return <section aria-label="Programme de levure proposé" className="border-t border-cave-700 pt-4 space-y-4">
    <div>
      <h4 className="font-serif text-xl text-ebc-straw">{yeast.name}</h4>
      <p className="text-sm text-cave-200 mt-2">{plan.rationale}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-cave-400">
        <span>Fenêtre fabricant : {rangeLabel(guide.temperatureC.range, '°C')}</span>
        <span>Principale et repos : {rangeLabel(fermentationDuration(plan), 'j')} · confiance faible</span>
      </div>
    </div>
    <FermentationTemperatureChart steps={proposed} bands={plan.phases.map(s => s.temperatureC.range)} pitchTempC={draft.pitchTempC} />
    <details className="border-b border-cave-700 pb-2"><summary className="cursor-pointer min-h-touch flex items-center text-water">Conseils pour développer ce profil</summary><FermentationLeversPanel science={science} goal={goal} guide={guide} /></details>
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
    {retained.length > 0 && <details className="text-sm text-cave-300"><summary className="cursor-pointer min-h-touch py-2 text-water">Programme complet après application · étapes conservées</summary>
      <p>Les ajouts, la garde et la refermentation sont conservés. Vérifie leur nouveau placement sur ce calendrier avant d’appliquer.</p>
      <ol className="mt-2 space-y-1">{fullProgram.map((s, i) => <li key={i}>{i + 1}. {s.name} · {Units.format(s.tempC, '°C')} · {Units.format(s.days, 'j')}{!isPrimary(s) ? ' · conservé' : ''}</li>)}</ol>
    </details>}
    <details className="space-y-3 border-t border-cave-800 pt-2">
      <summary className="cursor-pointer min-h-touch py-2 text-water">Comprendre la conduite · chimie et sources</summary>
      <p className="text-sm text-cave-200">{guide.aroma.summary ?? guide.aroma.banana} {guide.aroma.phenols} Esters, phénols et libération des thiols sont des propriétés distinctes.</p>
      {guide.attenuationPct && <p className="text-sm text-cave-300">Atténuation apparente fabricant : {rangeLabel(guide.attenuationPct.range, '%')}. Ce n’est pas une mesure de ce moût et le guide n’en impose pas une moyenne.</p>}
      <HopSourceLink source={guide.aroma.source} /><HopSourceLink source={guide.temperatureC.source} />
      {guide.dryPitchGHL && <HopSourceLink source={guide.dryPitchGHL.source} />}
      {plan.notes.map((n, i) => <div className="text-sm space-y-1 text-cave-300" key={i}><p>{n.text}</p><HopSourceLink source={n.source} /></div>)}
      <p className="text-xs text-cave-400">Les consignes et durées sont des propositions éditoriales datées. Les fiches sans date gardent « année inconnue ». Le guide appliqué est enregistré dans l’Index puis modifiable dans ses connaissances, avec une nouvelle version.</p>
      <HopSourceLink source={plan.source} />
    </details>
    <FermentationPlanningCalculations science={science} guide={guide} ogInitial={recipe.ogTarget} />
    {errors.map((e, i) => <p key={i} className="text-sm text-ebc-straw">{e}</p>)}
    {error && <p role="alert" className="text-sm text-alert">{error}</p>}
    {notice && <p role="status" className="text-sm text-hop">{notice}</p>}
    <div className="flex flex-col sm:flex-row gap-2">
      <Button intent="primary" disabled={busy || errors.length > 0} onClick={() => apply(true)}>Appliquer cette levure et ces paliers</Button>
      <Button disabled={busy || fermentationDraftErrors(guide, draft, false).length > 0} onClick={() => apply(false)}>Choisir la levure seulement</Button>
    </div>
  </section>;
}

export function FermentationWorkshop({ recipe, onChange, onBusyChange }: { recipe: TrialRecipe; onChange: (next: TrialRecipe) => void; onBusyChange?: (busy: boolean) => void }) {
  const saved = useStorageValue(StorageService.getHopKnowledge);
  const guides = useMemo(() => guideFermentations(saved), [saved]), yeasts = useMemo(() => guideYeasts(saved), [saved]);
  const science = useMemo(() => guideFermentationScience(saved)[0], [saved]);
  const initial = readFermentationGuide(recipe);
  const [goal, setGoal] = useState<FermentationGoal>(initial?.goal ?? guides.find(g => g.yeastId === recipe.yeast.hopIndexId)?.plans[0]?.goal ?? 'banana');
  const [aromaQuery, setAromaQuery] = useState('');
  const suggestions = suggestFermentationGoals(science, aromaQuery);
  const [form, setForm] = useState('all'), [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState(initial?.guide.id ?? '');
  const [catalogueNotice, setCatalogueNotice] = useState('');
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const choices = guides.filter(g => fermentationPlan(g, goal) && yeasts.some(y => y.id === g.yeastId && (form === 'all' || y.form === form)));
  const selected = choices.find(g => g.id === selectedId) ?? choices.find(g => g.yeastId === recipe.yeast.hopIndexId) ?? choices.find(g => yeasts.find(y => y.id === g.yeastId)?.form === recipe.yeast.form) ?? choices[0];
  const yeast = selected && yeasts.find(y => y.id === selected.yeastId);
  return <section aria-label="Atelier des arômes de levure" className="mb-6 p-3 sm:p-5 rounded-panel border border-ebc-straw/30 bg-cave-900 space-y-4">
    <div className="flex items-start gap-3"><FlaskConical className="text-ebc-straw shrink-0 mt-1" size={22} /><div>
      <h3 className="text-xl sm:text-2xl font-semibold text-cave-50">Quel goût doit apporter la levure ?</h3>
      <p className="text-sm text-cave-200 mt-2">Choisis un arôme, compare les souches documentées, puis ajuste les paliers à ton moût.</p>
    </div></div>
    <HopField label="Arôme ou style recherché" hint="Par exemple : banane, pêche, girofle, lager ou thiols.">
      <input className={inputClass} value={aromaQuery} disabled={busy} placeholder="Banane, pêche, girofle…" onChange={e => setAromaQuery(e.target.value)} autoComplete="off" />
    </HopField>
    {aromaQuery.trim() && <div className="flex flex-wrap gap-2" role="group" aria-label="Suggestions d’objectif">{suggestions.length ? suggestions.map(s => <Button key={s.id} disabled={busy} onClick={() => { setGoal(s.id); setSelectedId(''); setAromaQuery(''); }}>{FERMENTATION_GOAL_LABELS[s.id]}</Button>) : <p className="text-sm text-cave-400">Aucun objectif documenté avec ces mots. Le catalogue complet et la saisie manuelle restent disponibles.</p>}</div>}
    <details className="border border-cave-700 rounded-control p-3" onToggle={e=>setCatalogueOpen(e.currentTarget.open)}><summary className="cursor-pointer min-h-touch text-cave-100">Chercher dans toutes les levures et consulter leurs caractéristiques</summary>{catalogueOpen&&<div className="pt-3"><YeastCataloguePanel selectedId={recipe.yeast.hopIndexId} initialForm={recipe.yeast.form} disabled={busy} onSelect={(y,form)=>{
      onChange(applyCatalogueYeast(recipe,y,form));
      const documented=guides.find(g=>g.yeastId===y.id);
      if(documented){setSelectedId(documented.id);setForm(form);if(!fermentationPlan(documented,goal))setGoal(documented.plans[0].goal);}
      setCatalogueNotice(`${y.name} sélectionnée. Vérifie la quantité et les paliers avant d’enregistrer la recette.`);
    }}/>{catalogueNotice&&<p role="status" className="mt-3 text-sm text-ebc-straw">{catalogueNotice}</p>}</div>}</details>
    <div className="grid sm:grid-cols-2 gap-3">
      <HopField label="Objectif de fermentation"><select className={inputClass} value={goal} disabled={busy} onChange={e => setGoal(e.target.value as FermentationGoal)}>{Object.entries(FERMENTATION_GOAL_LABELS).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></HopField>
      <HopField label="Forme recherchée"><select className={inputClass} value={form} disabled={busy} onChange={e => setForm(e.target.value)}><option value="all">Toutes les formes</option><option value="sèche">Levure sèche</option><option value="liquide">Levure liquide</option></select></HopField>
    </div>
    <div className="grid sm:grid-cols-2 gap-2" role="group" aria-label="Souches documentées pour cet objectif">
      {choices.map(g => <button key={g.id} type="button" disabled={busy} aria-pressed={g.id === selected?.id} onClick={() => setSelectedId(g.id)} className={`text-left min-h-touch p-3 rounded-control border transition-colors ${g.id === selected?.id ? 'border-ebc-straw bg-ebc-straw/10' : 'border-cave-700 hover:border-cave-400'}`}>
        <span className="block font-semibold text-cave-100">{yeasts.find(y => y.id === g.yeastId)?.name}</span>
        <span className="block text-xs text-ebc-straw mt-1">{yeasts.find(y => y.id === g.yeastId)?.form} · {rangeLabel(g.temperatureC.range, '°C')}</span>
        <span className="block text-sm text-cave-200 mt-2">{g.aroma.summary ?? g.aroma.banana}</span>
      </button>)}
    </div>
    <p className="text-sm text-cave-400">{science?.goals.find(g => g.id === goal)?.description} Intensité finale non quantifiée ; l’ordre des souches n’est pas un classement de performance.</p>
    {selected && yeast ? <FermentationPreview key={`${selected.id}/${selected.version}/${goal}`} recipe={recipe} guide={selected} yeast={yeast} goal={goal} science={science} onChange={onChange} onBusyChange={value => { setBusy(value); onBusyChange?.(value); }} /> : <p role="status" className="text-cave-300">Aucune conduite active pour ce choix. La saisie manuelle de la recette reste disponible.</p>}
    <FermentationScienceLibrary science={science} />
  </section>;
}

/** Recipe pages show the frozen reference; opening a recipe cannot apply or import anything. */
export function FermentationRecipeSummary({ recipe, onEdit }: { recipe: TrialRecipe; onEdit?: () => void }) {
  const saved=useStorageValue(StorageService.getHopKnowledge);
  const catalogued=saved.find((k):k is import('../../functions/src/hopPredictionSchema').HopYeast=>k.kind==='yeast'&&k.id===recipe.yeast.hopIndexId&&!!k.catalogue);
  const s = readFermentationGuide(recipe);
  const catalogueDetails=catalogued&&<details className="space-y-3"><summary className="cursor-pointer min-h-touch text-water">Caractéristiques actuelles de la levure et sources fabricant</summary><YeastCatalogueDetails yeast={catalogued}/></details>;
  if (!s) return <div className="pt-3 space-y-2">{catalogueDetails}<p className="text-sm text-cave-400">L’atelier propose des souches et des conduites selon l’arôme recherché.</p><FermentationRecipeAdvice recipe={recipe}/>{onEdit && <Button onClick={onEdit}>Modifier la recette pour choisir les arômes de levure</Button>}</div>;
  const plan = fermentationPlan(s.guide, s.goal)!, changed = fermentationGuideChanged(recipe, s);
  return <section aria-label="Conduite de levure de la recette" className="pt-4 mt-4 border-t border-cave-700 space-y-3">
    <div className="flex items-center gap-2 text-ebc-straw"><Thermometer size={18} /><h3 className="font-semibold">{FERMENTATION_GOAL_LABELS[s.goal]}</h3></div>
    <p className="text-sm text-cave-200">Référence conservée : {s.yeast.name} · version {s.guide.version}.</p>
    <p className="text-sm text-cave-400">{s.programApplied ? `Principale et repos proposés : ${rangeLabel(fermentationDuration(plan), 'j')}, confiance faible. Garde et conditionnement s’ajoutent à ce budget.` : 'Souche choisie seule : le programme de fermentation reste à adapter.'} La fin dépend de la densité et de la dégustation.</p>
    {changed && <p role="status" className="text-sm text-ebc-straw">La recette diffère des réglages adoptés : souche, dose, volume ou programme modifié. La référence conservée ne certifie plus cette conduite.</p>}
    <FermentationTemperatureChart steps={recipe.fermentation ?? []} pitchTempC={recipe.yeast.pitchTempC} />
    {catalogueDetails}
    <details className="space-y-2 text-sm text-cave-300"><summary className="cursor-pointer min-h-touch py-2 text-water">Profil technique et sources conservées</summary>
      <p>{s.guide.aroma.summary ?? s.guide.aroma.banana} {s.guide.aroma.phenols}</p><p>Esters, phénols et thiols ont des voies distinctes ; aucune intensité universelle calculée ici.</p>
      <p>Fenêtre fabricant : {rangeLabel(s.guide.temperatureC.range, '°C')}.</p><HopSourceLink source={s.guide.temperatureC.source} />
      {plan.phases.map(p => <p key={p.id}>{p.name} : {p.completeWhen}</p>)}
      <HopSourceLink source={plan.source} />
    </details>
    <FermentationRecipeAdvice recipe={recipe}/>
    {onEdit && <Button onClick={onEdit}>Modifier la conduite de fermentation</Button>}
  </section>;
}
