import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, FlaskConical, SlidersHorizontal } from 'lucide-react';
import type { HopTrial } from '../../../functions/src/hopTrialSchema';
import type { HopRange } from '../../../functions/src/hopIndexSchema';
import { adoptHopTrial, compareHopTrial, recipeHopTiming, type TrialRecipe } from '../../domain/hopIndex/trials';
import { useStorageValue } from '../../hooks/useLiveData';
import { StorageService } from '../../services/storage';
import { ensureGuideReferences, guideAxes, guideTrials, guideYeasts } from './guideData';
import { useHopCatalogue } from './useHopCatalogue';
import { HopAromaTargetPicker } from './HopAromaTargetPicker';
import { HopTechnicalPanel, HopSourceLink } from './HopTechnicalPanel';
import { HOP_TIMING_LABELS, HOP_CONFIDENCE_LABELS } from './presentation';
import { Button } from '../../components/ui/Button';
import { inputClass } from '../FormNav';
import { HopField } from './HopFactsEditor';
import { HopExtrapolationPanel } from './HopExtrapolationPanel';

const number = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
const rangeLabel = (r: HopRange, unit: string) => `${r.min === r.max ? number(r.min) : `${number(r.min)}–${number(r.max)}`} ${unit}`;
const fold = (v: string) => v.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr');

export function HopTrialChart({ trial, recipe }: { trial: HopTrial; recipe?: TrialRecipe }) {
  const doses = trial.hops.map(h => {
    const matches = recipe?.hops.filter(r => r.hopVarietyId === h.varietyId && recipeHopTiming(r) === h.timing) ?? [];
    const current = matches.length && recipe!.volumeL > 0 ? matches.reduce((s, h) => s + h.weightG, 0) / recipe!.volumeL : undefined;
    return { ...h, current };
  });
  const max = Math.max(...doses.map(h => Math.max(h.doseGL.range.max, h.current ?? 0)));
  return <figure aria-label="Graphique du programme de houblonnage" className="space-y-4">
    <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-cave-400"><span><span className="inline-block w-3 h-2 bg-ebc-straw mr-1" />Dose de l’essai</span>{recipe && <span><span className="inline-block w-3 h-2 bg-water mr-1" />Ta recette · même référence et phase</span>}<span>Échelle commune : 0–{number(max)} g/L</span></figcaption>
    {doses.map((h, i) => <div key={i} className="space-y-1">
      <div className="flex justify-between gap-3 text-sm"><span className="text-cave-50 font-semibold">{h.name}</span><span className="font-mono text-ebc-straw shrink-0">{rangeLabel(h.doseGL.range, 'g/L')}</span></div>
      <div className="h-2 rounded bg-cave-800 overflow-hidden" aria-hidden="true"><div className="h-full bg-ebc-straw rounded" style={{ width: `${100 * h.doseGL.range.max / max}%` }} /></div>
      {h.current != null && <><div className="h-2 rounded bg-cave-800 overflow-hidden" aria-hidden="true"><div className="h-full bg-water rounded" style={{ width: `${100 * h.current / max}%` }} /></div><p className="text-xs text-water">Recette : {number(h.current)} g/L</p></>}
      <p className="text-xs text-cave-400">{HOP_TIMING_LABELS[h.timing]} · {h.temperatureC ? rangeLabel(h.temperatureC.range, '°C') : 'température non publiée'} · {h.contactHours ? rangeLabel(h.contactHours.range, 'h') : 'contact non publié'}</p>
    </div>)}
    <div className="flex items-center gap-3 pt-3 border-t border-cave-700 text-sm"><ArrowRight size={18} className="text-hop shrink-0" /><p><span className="text-hop font-semibold">{trial.yeastName}</span><span className="block text-cave-400">Fermentation : {trial.fermentationC ? rangeLabel(trial.fermentationC.range, '°C') : 'température non publiée'}</span></p></div>
  </figure>;
}

export function HopTrialResult({ trial }: { trial: HopTrial }) {
  return <div className="space-y-3 border-l-2 border-hop pl-4 py-1">
    <p className="text-xs uppercase tracking-wider text-hop">Résultat observé dans la source</p>
    <p className="text-cave-50">{trial.result}</p>
    {trial.sensory.map((s, i) => <figure key={i} aria-label={`Plage publiée : ${s.name}`} className="space-y-2">
      <figcaption className="text-sm text-cave-200">{s.name} · {rangeLabel(s.range, '')} sur {number(s.scale.max)}</figcaption>
      <div className="relative h-5 bg-cave-800 rounded" aria-hidden="true"><span className="absolute inset-y-0 rounded bg-hop/70" style={{ left: `${100 * (s.range.min - s.scale.min) / (s.scale.max - s.scale.min)}%`, width: `${100 * (s.range.max - s.range.min) / (s.scale.max - s.scale.min)}%` }} /></div>
      <p className="text-xs text-cave-400">{number(s.scale.min)} — échelle du panel — {number(s.scale.max)}. Plage observée, sans garantie pour un autre brassin.</p>
      <HopSourceLink source={s.source} />
    </figure>)}
    {!trial.sensory.length && <p className="text-xs text-cave-400">Résultat qualitatif ; intensité et dispersion non publiées.</p>}
    <p className="text-xs text-cave-400">Confiance de transposition : {HOP_CONFIDENCE_LABELS[trial.confidence]}.</p>
    <HopSourceLink source={trial.source} />
    <details className="text-xs text-cave-400"><summary className="cursor-pointer py-2">Comment cette confiance est-elle appréciée ?</summary><p>{trial.assessmentSource.locator}</p><HopSourceLink source={trial.assessmentSource} /></details>
  </div>;
}

export function HopTrialComparison({ recipe, trial }: { recipe: TrialRecipe; trial: HopTrial }) {
  const differences = compareHopTrial(recipe, trial);
  return <section aria-label="Écarts au programme documenté" className="space-y-3">
    <div><h4 className="font-semibold text-cave-100">Ton adaptation · à valider en brassant</h4><p className="text-sm text-cave-400">Le résultat de l’essai reste un repère. Il n’est pas recopié comme prédiction de ta recette.</p></div>
    <div className="divide-y divide-cave-800">{differences.map((d, i) => <div key={i} className="py-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-sm">
      <span className="text-cave-200">{d.label}</span><span className={d.status === 'same' ? 'text-hop' : d.status === 'changed' ? 'text-ebc-straw' : 'text-cave-400'}>{d.status === 'same' ? 'Concorde' : d.status === 'changed' ? 'Diffère' : 'À vérifier'}</span>
      {d.status !== 'same' && <p className="col-span-2 text-xs text-cave-400">{d.detail}</p>}
    </div>)}</div>
    <p className="text-xs text-cave-400">{trial.matrix}</p>
  </section>;
}

export function HopWorkshop({ recipe, onChange, onBusyChange, contextEditor, onEditAdditions }: {
  recipe?: TrialRecipe; onChange?: (next: TrialRecipe) => void; onBusyChange?: (busy: boolean) => void; contextEditor?: React.ReactNode; onEditAdditions?: () => void;
}) {
  const knowledge = useStorageValue(StorageService.getHopKnowledge);
  const { varieties, loading, error: catalogueError } = useHopCatalogue();
  const trials = useMemo(() => guideTrials(knowledge), [knowledge]);
  const yeasts = useMemo(() => guideYeasts(knowledge), [knowledge]), axes = useMemo(() => guideAxes(knowledge), [knowledge]);
  const [selectedId, setSelectedId] = useState(recipe?.hopTrialId ?? 'trial-split-verdant-2026');
  const [view, setView] = useState<'trials' | 'adapt' | 'technical'>(recipe?.hopTrialId ? 'adapt' : 'trials');
  const [query, setQuery] = useState(''), [family, setFamily] = useState('');
  const [localTarget, setLocalTarget] = useState<Record<string, HopRange>>({});
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [preview, setPreview] = useState(false);
  const pending = useRef(false), latest = useRef({ recipe, onChange }); latest.current = { recipe, onChange };
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const anchor = trials.find(t => t.id === recipe?.hopTrialId);
  const target = recipe?.hopAromaTarget ?? localTarget;
  const initialSelection = useRef(selectedId);
  const namedText = (t: HopTrial) => fold([t.name, t.yeastName, ...t.hops.map(h => `${h.name} ${HOP_TIMING_LABELS[h.timing]}`)].join(' '));
  const filtered = trials.filter(t => (!family || t.families.includes(family)) && `${namedText(t)} ${fold(t.result)}`.includes(fold(query)))
    .sort((a, b) => Number(namedText(b).includes(fold(query))) - Number(namedText(a).includes(fold(query)))
      || Number(b.id === initialSelection.current) - Number(a.id === initialSelection.current));
  const selected = filtered.find(t => t.id === selectedId) ?? filtered[0];
  const change = (next: TrialRecipe) => { if (mounted.current) latest.current.onChange?.(next); };
  const run = async (fn: () => Promise<void>) => {
    if (pending.current) return;
    pending.current = true; setBusy(true); onBusyChange?.(true); setError(''); setNotice('');
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : 'Modification impossible.'); }
    finally { pending.current = false; setBusy(false); onBusyChange?.(false); }
  };
  const persistTrial = async (trial: HopTrial) => {
    const refs = trial.hops.map(h => varieties.find(v => v.id === h.varietyId));
    const yeast = yeasts.find(y => y.id === trial.yeastId);
    if (refs.some(v => !v || v.archived) || !yeast) throw Error('Une référence de cet essai est indisponible. Consulte son protocole ou choisis un autre essai.');
    await ensureGuideReferences({ varieties: refs, knowledge: [trial, yeast] });
  };
  const adopt = () => run(async () => {
    const current = latest.current.recipe;
    if (!current || !selected) return;
    // Validate before any import and reject a stale preview after concurrent draft edits.
    const fingerprint = JSON.stringify([current.hops, current.yeast, current.volumeL]);
    const next = adoptHopTrial(current, selected);
    await persistTrial(selected);
    const latestRecipe = latest.current.recipe;
    if (!latestRecipe || JSON.stringify([latestRecipe.hops, latestRecipe.yeast, latestRecipe.volumeL]) !== fingerprint) throw Error('La recette a changé. Relis le programme avant de l’appliquer.');
    change({ ...latestRecipe, hops: next.hops, yeast: next.yeast, hopTrialId: next.hopTrialId, hopMatrixId: undefined, hopPredictionIds: undefined });
    setPreview(false); setView('adapt'); setNotice('Programme repris. Complète les alpha du lot, les contacts, la quantité de levure et le programme de fermentation.');
  });
  return <section aria-label="Atelier aromatique" className="min-w-0 border border-cave-700 rounded-panel bg-cave-900 overflow-hidden">
    <header className="p-4 sm:p-5 bg-gradient-to-br from-hop/10 to-cave-900 border-b border-cave-700">
      <p className="text-xs uppercase tracking-widest text-hop mb-2">Houblon × levure × timing</p>
      <h2 className="font-serif text-2xl sm:text-3xl text-cave-50">Construire le goût de ta bière</h2>
      <p className="text-sm text-cave-200 mt-2 max-w-2xl">Pars d’un essai documenté ou simule ta propre combinaison, puis compare les variantes avant de composer.</p>
    </header>
    <div className="p-3 sm:p-5 space-y-5">
      <nav aria-label="Étapes de l’atelier aromatique" className="grid grid-cols-3 gap-1">
        {([{ id: 'trials', name: 'Essais documentés', Icon: BookOpen }, { id: 'adapt', name: 'Mon adaptation', Icon: SlidersHorizontal }, { id: 'technical', name: 'Chimie', Icon: FlaskConical }] as const).map(({ id, name, Icon }) => <button key={id} type="button" disabled={busy} onClick={() => setView(id)} aria-current={view === id ? 'page' : undefined} className={`min-h-touch px-2 py-2 rounded-control text-xs sm:text-sm flex items-center justify-center flex-wrap gap-1 ${view === id ? 'bg-ebc-straw/10 text-ebc-straw border border-ebc-straw/40' : 'text-cave-200 bg-cave-850 border border-transparent'}`}><Icon size={16} />{name}</button>)}
      </nav>
      {view === 'trials' && <>
        <div className="grid sm:grid-cols-2 gap-3"><HopField label="Rechercher un essai"><input className={inputClass} disabled={busy} placeholder="Cascade, Verdant, goyave…" value={query} onChange={e => { setQuery(e.target.value); setSelectedId(''); setPreview(false); }} /></HopField>
          <HopField label="Ce que tu veux retrouver"><select className={inputClass} disabled={busy} value={family} onChange={e => { setFamily(e.target.value); setSelectedId(''); setPreview(false); }}><option value="">Tous les résultats documentés</option>{axes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></HopField></div>
        {!filtered.length && <div className="text-sm text-cave-200 space-y-2"><p>Aucun essai de ce catalogue ne documente ce choix. Tu peux choisir un repère proche et conserver ton objectif dans « Mon adaptation ».</p><Button onClick={() => { setQuery(''); setFamily(''); }}>Voir les essais disponibles</Button></div>}
        <div className="grid lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.2fr)] gap-5">
          <div className="space-y-2 max-h-52 overflow-y-auto lg:max-h-none pr-1" role="group" aria-label="Programmes documentés">{filtered.map(t => <button key={t.id} type="button" aria-pressed={selected?.id === t.id} onClick={() => { setSelectedId(t.id); setPreview(false); }} className={`w-full text-left p-3 rounded-control border space-y-1 ${selected?.id === t.id ? 'border-ebc-straw/60 bg-ebc-straw/5' : 'border-cave-700 hover:bg-cave-850'}`}>
            <span className="block font-semibold text-cave-50 text-sm">{t.name}</span>{!t.families.length && <span className="text-xs text-ebc-straw">Contre-exemple à étudier</span>}<span className="block text-xs text-cave-200">{[...new Set(t.hops.map(h => h.name))].join(' + ')} × {t.yeastName}</span><span className="block text-xs text-cave-400">{[...new Set(t.hops.map(h => HOP_TIMING_LABELS[h.timing]))].join(' / ')} · {t.source.year}</span>
          </button>)}</div>
          {selected && <article aria-label="Protocole sélectionné" className="space-y-5 min-w-0 lg:border-l lg:border-cave-700 lg:pl-5">
            <h3 className="text-lg font-semibold text-cave-50">{selected.name}</h3>
            <HopTrialChart trial={selected} recipe={recipe} />
            <HopTrialResult trial={selected} />
            <details className="text-sm text-cave-400"><summary className="cursor-pointer min-h-touch">Grist, limites et conditions à reproduire</summary><p className="mb-2">{selected.matrix}</p><ul className="list-disc pl-5 space-y-1">{selected.limitations.map(l => <li key={l}>{l}</li>)}</ul></details>
            {recipe && onChange ? <div className="space-y-3 border-t border-cave-700 pt-4">
              {!preview ? <div className="flex flex-wrap gap-2"><Button intent="primary" disabled={busy || loading} onClick={() => setPreview(true)}>Préparer ce programme pour {number(recipe.volumeL)} L</Button><Button disabled={busy || loading} onClick={() => void run(async () => { await persistTrial(selected); change({ ...latest.current.recipe!, hopTrialId: selected.id }); setView('adapt'); setNotice('Essai choisi comme repère. Tes ingrédients sont conservés.'); })}>Comparer à ma recette</Button></div>
                : <div aria-label="Aperçu du programme" className="space-y-3 bg-cave-850 rounded-control p-3"><p className="font-semibold text-cave-50">À reprendre dans ta recette</p>
                  <p className="text-sm text-cave-200">{recipe.hops.length} ajout(s) actuel(s) et {recipe.yeast?.name || 'la levure non choisie'} seront remplacés par :</p>
                  <ul className="list-disc pl-4 text-sm text-cave-200 space-y-1">{selected.hops.map((h, i) => <li key={i}>{h.name} · {rangeLabel({ min: h.doseGL.range.min * recipe.volumeL, max: h.doseGL.range.max * recipe.volumeL }, 'g')} · {HOP_TIMING_LABELS[h.timing]}</li>)}<li>{selected.yeastName} · quantité à renseigner</li></ul>
                  <p className="text-xs text-cave-400">Le grist et les paliers de fermentation restent à adapter au protocole. Alpha, températures et contacts absents restent à compléter.</p>
                  <div className="flex flex-wrap gap-2"><Button intent="primary" disabled={busy} onClick={() => void adopt()}>Remplacer le houblonnage et la levure</Button><Button disabled={busy} onClick={() => setPreview(false)}>Annuler</Button></div>
                </div>}
            </div> : <p className="text-sm text-cave-400">Pour composer avec ce programme, ouvre l’atelier aromatique au début de la création d’une recette.</p>}
          </article>}
        </div>
      </>}
      {view === 'adapt' && <div className="space-y-5">
        {onEditAdditions && <Button onClick={onEditAdditions} disabled={busy}>Ajuster les quantités et les moments d’ajout ↓</Button>}
        <HopAromaTargetPicker axes={axes} target={target} disabled={busy} onChange={(next, axis) => {
          if (!recipe || !onChange) { setLocalTarget(next); return; }
          void run(async () => { if (next[axis.id]) await ensureGuideReferences({ knowledge: [axis] }); change({ ...latest.current.recipe!, hopAromaTarget: next }); });
        }} />
        <p className="text-xs text-cave-400">Le graphe ci-dessus représente ton intention. Les familles et leur échelle sont des choix de formulation de L’Affinée, pas des mesures de bière.</p>
        <HopExtrapolationPanel recipe={recipe} onChange={onChange} onBusyChange={next => { setBusy(next); onBusyChange?.(next); }} target={target} />
        {recipe && anchor && <details><summary className="cursor-pointer min-h-touch text-water">Comparer au protocole choisi : {anchor.name}</summary><div className="space-y-4"><HopTrialChart trial={anchor} recipe={recipe} /><HopTrialComparison trial={anchor} recipe={recipe} /></div></details>}
        {contextEditor}
        {recipe && <p className="text-sm text-cave-400">Ajuste les quantités et les moments sur les lignes de houblons de la recette. Change une condition à la fois si tu veux comprendre son effet à la dégustation.</p>}
      </div>}
      {view === 'technical' && <HopTechnicalPanel variety={varieties.find(v => v.id === (recipe?.hops[0]?.hopVarietyId ?? selected?.hops[0]?.varietyId))} />}
      {busy && <p role="status" className="text-sm text-cave-400">Traitement en cours…</p>}
      {notice && <p role="status" className="text-sm text-hop">{notice}</p>}
      {(error || catalogueError) && <p role="alert" className="text-sm text-alert">{error || catalogueError}</p>}
    </div>
  </section>;
}
