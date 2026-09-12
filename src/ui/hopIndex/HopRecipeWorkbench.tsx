import { Units } from '../../services/units';
import React, { useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { TrialRecipe } from '../../domain/hopIndex/trials';
import type { HopStage } from '../../types';
import { analyseHopRecipe, applyHopRecipeAdjustment, createHopRecipeAdjustment, evaluateHopRecipeAdjustment,
  hopFitsStyle, hopRecipeKey, HOP_RECIPE_SOURCES, type HopAdjustmentMode, type HopRecipeAdjustment } from '../../domain/hopRecipeDesign';
import { yeastRecipeCandidates, type YeastRecipeGoal } from '../../domain/yeastRecipeDesign';
import { hopStyleFamily } from '../../domain/hopIndex/styleSelection';
import { rankDocumentaryHopLeads } from '../../domain/hopIndex/recipeGuide';
import aromaFamilies from '../../data/hopRecipeGuideBootstrap.json';
import { yeastReferences } from '../../domain/yeastReferences';
import { useStorageValue } from '../../hooks/useLiveData';
import { StorageService } from '../../services/storage';
import { useHopCatalogue } from './useHopCatalogue';
import { ensureGuideReferences } from './guideData';
import { hopReferenceSource, HOP_FORM_LABELS } from '../../domain/hopIndex/labels';
import { NumberInput } from '../NumberInput';
import { Combobox } from '../Combobox';
import { SegmentedControl } from '../SegmentedControl';
import './hop-recipe.css';

const fmt = (value?: number | null, digits = 1) => value != null && Number.isFinite(value) ? value.toLocaleString('fr-FR', { maximumFractionDigits: digits }) : '—';
const stageNames: Record<HopStage, string> = { firstWort: 'Premier moût', boil: 'Ébullition', whirlpool: 'Whirlpool', dryHop: 'À cru' };
const toolNames: Record<HopAdjustmentMode, string> = { ibu: 'Viser des IBU', move: 'Déplacer un ajout', replace: 'Remplacer un houblon', dryHop: 'Dose à cru' };
type SensoryGoal = 'banana' | 'clove' | 'balanced' | 'citrus' | 'tropical' | 'floral';
export interface HopRecipeWorkbenchSession {
  local: { key: string; draft: HopRecipeAdjustment };
  view: 'balance' | 'adjust' | 'flavor'; goal: SensoryGoal; allVarieties: boolean;
}
const sensoryNames: Record<SensoryGoal, string> = { banana: 'Banane', clove: 'Girofle', balanced: 'Équilibre', citrus: 'Agrumes', tropical: 'Fruits tropicaux', floral: 'Floral · épices' };
function Detail({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return <details><summary>{title}<ChevronDown size={14} aria-hidden="true" /></summary><div className="hop-detail-body">{children}</div></details>;
}

export function HopIbuRange({ current, proposed, range }: { current: number | null; proposed?: number | null; range?: { min: number; max: number } }) {
  const max = Math.max(1, (range?.max ?? 0) * 1.2, (current ?? 0) * 1.1, (proposed ?? 0) * 1.1);
  return <figure className="hop-ibu-range" aria-label="Amertume calculée et repère du style">
    <figcaption><span>IBU à chaud · Tinseth</span><strong>{fmt(current)}{proposed != null ? ` → ${fmt(proposed)}` : ''}</strong></figcaption>
    <div className="hop-ibu-track" aria-hidden="true">
      {range && <span className="hop-style-band" style={{ left: `${range.min / max * 100}%`, width: `${(range.max - range.min) / max * 100}%` }} />}
      {current != null && <i className="hop-current-mark" style={{ left: `${current / max * 100}%` }} />}
      {proposed != null && <i className="hop-proposed-mark" style={{ left: `${proposed / max * 100}%` }} />}
    </div>
    <div className="hop-scale"><span>0</span><span>{range ? `Repère du style : ${fmt(range.min)}–${fmt(range.max)} IBU` : 'Plage du style non identifiée'}</span><span>{fmt(max)}</span></div>
    {proposed != null && <p className="hop-small">Repère clair : actuel · jaune : scénario</p>}
  </figure>;
}

/** Brewing decisions first. Local previews do not save references or touch the recipe. */
export function HopRecipeWorkbench({ recipe, onChange, onNavigate, onPlanYeast, onBusyChange, session }: {
  recipe: TrialRecipe; onChange?: (recipe: TrialRecipe) => void;
  onNavigate?: (step: 'identite' | 'levure' | 'paliers' | 'eau') => void;
  onPlanYeast?: (goal: YeastRecipeGoal, yeastId?: string) => void; onBusyChange?: (busy: boolean) => void;
  /** Wizard-only draft cache: survives step navigation, never stored with the recipe. */
  session?: { current: HopRecipeWorkbenchSession | undefined };
}) {
  const uid = useId(), { varieties, loading, error: catalogueError } = useHopCatalogue();
  const knowledge = useStorageValue(StorageService.getHopKnowledge);
  const refs = useMemo(() => yeastReferences(knowledge), [knowledge]);
  const analysis = analyseHopRecipe(recipe), key = hopRecipeKey(recipe);
  const [view, setView] = useState<'balance' | 'adjust' | 'flavor'>(() => session?.current?.view ?? 'balance');
  const [local, setLocal] = useState(() => session?.current?.local ?? ({ key, draft: createHopRecipeAdjustment(recipe) }));
  const [goal, setGoal] = useState<SensoryGoal>(() => session?.current?.goal ?? 'balanced'), [allVarieties, setAllVarieties] = useState(() => session?.current?.allVarieties ?? false);
  React.useEffect(() => { if (session) session.current = { local, view, goal, allVarieties }; }, [session, local, view, goal, allVarieties]);
  const [notice, setNotice] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const latest = useRef({ recipe, onChange }); latest.current = { recipe, onChange };
  const pending = useRef(false), mounted = useRef(true);
  React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const draft = local.draft, stale = local.key !== key;
  const result = evaluateHopRecipeAdjustment(recipe, draft, varieties);
  const family = analysis.style.family;
  const ipaFamily = hopStyleFamily(recipe.style ?? '');
  const wheat = family === 'weissbier';
  const hoppy = family === 'clean-ale' || family === 'hazy-ipa' || family === 'american-wheat';
  const goals: SensoryGoal[] = wheat ? ['balanced', 'banana', 'clove'] : hoppy ? ['citrus', 'tropical', 'floral'] : ['balanced', 'floral'];
  const activeGoal = goals.includes(goal) ? goal : goals[0];
  const yeastGoal: YeastRecipeGoal = activeGoal === 'banana' || activeGoal === 'clove' ? activeGoal : hoppy ? 'hops' : 'balanced';
  const candidates = yeastRecipeCandidates(family, yeastGoal, refs, recipe.volumeL);
  const currentYeast = candidates.find(c => c.yeastId === recipe.yeast?.hopIndexId);
  const comparisons = candidates.filter(c => c.yeastId !== recipe.yeast?.hopIndexId).slice(0, 3);
  const catalogue = useMemo(() => varieties.filter(v => !v.archived && ['unknown', 'pelletT90', 'cone'].includes(v.form))
    .map(v => ({ ...v, fits: hopFitsStyle(v.name, family, v.aliases, recipe.style) }))
    .sort((a, b) => Number(b.fits) - Number(a.fits) || a.name.localeCompare(b.name, 'fr')), [varieties, family, recipe.style]);
  const flavorVarieties = useMemo(() => {
    const inStyle = catalogue.filter(v => v.fits);
    return activeGoal === 'balanced' ? inStyle : rankDocumentaryHopLeads(inStyle,
      [activeGoal], aromaFamilies as Parameters<typeof rankDocumentaryHopLeads>[2]).map(lead => lead.variety);
  }, [catalogue, activeGoal]);
  const visibleVarieties = catalogue.filter(v => allVarieties || family === 'unknown' || v.fits || v.id === draft.varietyId);
  const patch = (next: Partial<HopRecipeAdjustment>) => { setLocal(v => ({ ...v, draft: { ...v.draft, ...next } })); setNotice(''); setError(''); };
  const reset = () => { setLocal({ key, draft: createHopRecipeAdjustment(recipe) }); setError(''); setNotice('Scénario repris depuis la recette.'); };
  const chooseTool = (mode: HopAdjustmentMode) => {
    const index = mode === 'dryHop' ? recipe.hops.findIndex(h => h.stage === 'dryHop') : recipe.hops.findIndex(h => h.stage === 'boil');
    setLocal({ key, draft: createHopRecipeAdjustment(recipe, index, mode) }); setError(''); setNotice(''); setView('adjust');
  };
  const flavorRows = (rows: typeof flavorVarieties) => rows.map(v => <li key={v.id}>
    <strong>{v.name}</strong><button type="button" aria-label={`Préparer un ajout de ${v.name}`} onClick={() => {
      setLocal({ key, draft: { ...createHopRecipeAdjustment(recipe, -1, hoppy ? 'dryHop' : 'move'), name: v.name, varietyId: v.id } });
      setNotice(''); setError(''); setView('adjust');
    }}>Préparer un ajout</button>
  </li>);
  const apply = async () => {
    if (pending.current || !onChange) return;
    pending.current = true; setBusy(true); onBusyChange?.(true); setError('');
    try {
      // Validate before persisting a newly selected reference, and again after that async boundary.
      applyHopRecipeAdjustment(latest.current.recipe, draft, local.key, varieties);
      const variety = varieties.find(v => v.id === draft.varietyId);
      if (variety) await ensureGuideReferences({ varieties: [variety] });
      if (!mounted.current) return;
      const next = applyHopRecipeAdjustment(latest.current.recipe, draft, local.key, varieties);
      latest.current.onChange?.(next);
      setLocal({ key: hopRecipeKey(next), draft: { ...createHopRecipeAdjustment(next, draft.index === -1 ? next.hops.length - 1 : draft.index, draft.mode), targetIbu: draft.targetIbu, originalForm: draft.originalForm, replacementForm: draft.replacementForm, keepIbu: draft.keepIbu } });
      setNotice('Ajout repris dans la recette. Enregistre la recette pour le conserver.');
    } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'Vérifie le scénario.'); }
    finally { pending.current = false; if (mounted.current) setBusy(false); onBusyChange?.(false); }
  };
  const numeric = (label: string, field: keyof HopRecipeAdjustment, unit: string) => {
    const value = draft[field] as number | undefined;
    const invalid = field === 'dayOffset' && value === undefined ? false : value === undefined || !Number.isFinite(value)
      || value < 0 || ['alpha', 'doseGL', 'contactHours'].includes(field) && value === 0
      || field === 'alpha' && value > 100 || field === 'tempC' && value > (draft.mode === 'dryHop' ? 40 : 100)
      || field === 'timeMin' && draft.stage === 'boil' && value > recipe.boilMin;
    return <div className="hop-setting">
    <label htmlFor={`${uid}-${field}`}>{label}</label><NumberInput id={`${uid}-${field}`} aria-label={label} value={draft[field] as number | undefined} emptyValue={undefined}
      aria-invalid={invalid} aria-describedby={`${uid}-${field}-unit${result.errors.length ? ` ${uid}-errors` : ''}`}
      onValue={value => patch({ [field]: value })} /><span id={`${uid}-${field}-unit`}>{unit}</span>
  </div>; };
  const maxMass = Math.max(1, ...analysis.phases.map(p => p.grams ?? 0));
  const varietyOptions = visibleVarieties.map(v => ({ value: v.id, label: v.name,
    group: v.fits ? 'Repères pour ce style' : 'Autres usages · choix libre', detail: `${hopReferenceSource(v)} · ${HOP_FORM_LABELS[v.form]}` }));
  if (draft.name && !draft.varietyId) varietyOptions.unshift({ value: '__current', label: draft.name, group: draft.index === -1 ? 'Saisie libre' : 'Ajout actuel', detail: 'Sans référence catalogue associée' });

  return <section className="hop-workbench" aria-label="Atelier de houblonnage par style">
    <div className="hop-style-heading"><h3>{analysis.style.name || 'Style à préciser'}</h3>{onNavigate && <button type="button" disabled={busy} onClick={() => onNavigate('identite')}>Changer de style</button>}</div>
    <p className="hop-role">{analysis.style.role}</p>
    <div role="tablist" aria-label="Outils de houblonnage" className="hop-tool-tabs">{([
      { value: 'balance', label: 'Bilan' }, { value: 'adjust', label: 'Simuler' }, { value: 'flavor', label: 'Goût / levure' },
    ] as const).map((tab, i, tabs) => <button type="button" role="tab" disabled={busy} id={`${uid}-tab-${tab.value}`} aria-controls={`${uid}-panel`} key={tab.value} aria-selected={view === tab.value} tabIndex={view === tab.value ? 0 : -1} onClick={() => setView(tab.value)} onKeyDown={e => {
      const next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : undefined;
      if (next !== undefined) { e.preventDefault(); setView(tabs[next].value); document.getElementById(`${uid}-tab-${tabs[next].value}`)?.focus(); }
    }}>{tab.label}</button>)}</div>
    <div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${view}`} className="hop-tab-panel">
    {view === 'balance' && <>
      <HopIbuRange current={analysis.hot.total} range={analysis.style.ibu} />
      {analysis.hot.missing.length > 0 && <p className="hop-warning">Calcul incomplet : {analysis.hot.missing.join(' · ')}.</p>}
      <dl className="hop-phase-list" aria-label="Répartition des houblons par phase">{analysis.phases.filter(p => p.count).map(p => <div key={p.stage}>
        <dt>{stageNames[p.stage]}</dt><dd>{p.grams !== undefined && <span className="hop-mass-track" aria-hidden="true"><i style={{ width: `${p.grams / maxMass * 100}%` }} /></span>}<span>{fmt(p.grams)} g · {fmt(p.doseGL)} g/L</span></dd>
      </div>)}</dl>
      {!recipe.hops.length && <p>Aucun ajout. Prépare une masse selon l’IBU visé ou la dose à cru.</p>}
      <div className="hop-actions"><button type="button" onClick={() => chooseTool('ibu')}>Calculer ma dose amère</button>{hoppy && <button type="button" onClick={() => chooseTool('dryHop')}>Préparer le dry hop</button>}</div>
      <Detail title="Variétés à comparer dans ce style">
        <p>{catalogue.filter(v => v.fits).length} références à comparer dans le catalogue pour ce style.</p>
        <p className="hop-small">{ipaFamily ? 'Usages issus de fiches fabricant et de recettes publiées.' : 'Repères d’usage L’Affinée, non exclusifs.'} Les autres variétés restent accessibles. L’alpha vient du lot utilisé.</p>
        <button type="button" onClick={() => chooseTool(hoppy ? 'dryHop' : 'ibu')}>Ouvrir le catalogue par style</button>
      </Detail>
      {analysis.warnings.length > 0 && <div className="hop-warning"><p>{analysis.warnings[0]}</p>{analysis.warnings.length > 1 && <Detail title={`${analysis.warnings.length - 1} consigne${analysis.warnings.length > 2 ? 's' : ''} de conduite`}><ul>{analysis.warnings.slice(1).map(w => <li key={w}>{w}</li>)}</ul></Detail>}</div>}
      {analysis.dry.additions.length > 0 && <Detail title="Planning du houblonnage à cru"><ol className="hop-instructions">{analysis.dry.additions.map((h, i) => <li key={i}><strong>{h.name} · {Units.format(h.weightG, 'g')} · {fmt(h.doseGL)} g/L</strong><span>{h.phase === 'active' ? 'Fermentation active constatée' : h.phase === 'post' ? 'Après fermentation principale constatée' : 'Phase biologique à préciser'} · {fmt(h.temperatureC)} °C · {fmt(h.contactHours)} h{h.dayOffset != null ? ` · J${fmt(h.dayOffset)} indicatif` : ''}</span></li>)}</ol>
        {onNavigate && <button type="button" onClick={() => onNavigate('paliers')}>Vérifier le programme de fermentation</button>}</Detail>}
    </>}
    {view === 'adjust' && <fieldset disabled={busy} className="hop-adjustment" aria-label="Simulation de houblonnage">
      <div className="hop-select-line"><label htmlFor={`${uid}-tool`}>Outil</label><select id={`${uid}-tool`} aria-label="Outil de simulation houblon" value={draft.mode} onChange={e => chooseTool(e.target.value as HopAdjustmentMode)}>{Object.entries(toolNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div className="hop-select-line"><label htmlFor={`${uid}-addition`}>Ajout</label><select id={`${uid}-addition`} aria-label="Ajout à simuler" value={draft.index} onChange={e => { setLocal({ key, draft: createHopRecipeAdjustment(recipe, Number(e.target.value), draft.mode) }); setNotice(''); setError(''); }}>
        <option value={-1}>Nouvel ajout</option>{recipe.hops.map((h, i) => <option key={i} value={i}>{i + 1}. {h.name} · {stageNames[h.stage]}</option>)}</select></div>
      {(draft.index === -1 || draft.mode === 'replace') && <>
        <label htmlFor={`${uid}-variety`} className="hop-small">Houblon pour ce style</label>
        <Combobox compact id={`${uid}-variety`} value={draft.varietyId ?? (draft.name ? '__current' : '')} ariaLabel="Houblon du scénario" placeholder="Choisir un houblon…" options={varietyOptions} maxResults={40}
          onChange={id => { const v = varieties.find(v => v.id === id); if (v) patch({ name: v.name, varietyId: v.id, alpha: undefined }); }} />
        <label className="hop-check"><input type="checkbox" checked={allVarieties} onChange={e => setAllVarieties(e.target.checked)} />Voir aussi les autres styles</label>
        {!loading && !visibleVarieties.length && <p role="status">Aucun repère disponible. Affiche les autres styles ou utilise la saisie d’ajout sous l’atelier.</p>}
      </>}
      {draft.mode === 'replace' && (!varieties.find(v => v.id === recipe.hops[draft.index]?.hopVarietyId) || varieties.find(v => v.id === recipe.hops[draft.index]?.hopVarietyId)?.form === 'unknown') && <div className="hop-select-line"><label htmlFor={`${uid}-form`}>Produit actuel</label><select id={`${uid}-form`} aria-label="Forme du houblon actuel" value={draft.originalForm ?? ''} onChange={e => patch({ originalForm: e.target.value as 'pelletT90' | 'cone' || undefined })}><option value="">À confirmer</option><option value="pelletT90">Pellets T90</option><option value="cone">Cônes</option></select></div>}
      {draft.mode === 'replace' && varieties.find(v => v.id === draft.varietyId)?.form === 'unknown' && <div className="hop-select-line"><label htmlFor={`${uid}-new-form`}>Nouveau produit</label><select id={`${uid}-new-form`} aria-label="Forme du houblon de remplacement" value={draft.replacementForm ?? ''} onChange={e => patch({ replacementForm: e.target.value as 'pelletT90' | 'cone' || undefined })}><option value="">À confirmer</option><option value="pelletT90">Pellets T90</option><option value="cone">Cônes</option></select></div>}
      {draft.mode !== 'dryHop' ? <>
        {numeric(draft.mode === 'replace' ? 'Alpha du lot de remplacement' : 'Alpha du lot à simuler', 'alpha', '%')}
        {draft.mode === 'move' && <div className="hop-select-line"><label htmlFor={`${uid}-stage`}>Destination</label><select id={`${uid}-stage`} aria-label="Moment du scénario houblon" value={draft.stage} onChange={e => patch({ stage: e.target.value as HopStage, timeMin: undefined, tempC: undefined })}><option value="boil">Ébullition</option><option value="whirlpool">Whirlpool</option><option value="firstWort">Premier moût</option></select></div>}
        {(draft.stage === 'boil' || draft.stage === 'whirlpool') && numeric(draft.stage === 'boil' ? 'Minutes avant la fin' : 'Contact au whirlpool', 'timeMin', 'min')}
        {draft.stage === 'whirlpool' && numeric('Température du whirlpool', 'tempC', '°C')}
        {draft.mode === 'ibu' ? <>{numeric('Cible totale à chaud', 'targetIbu', 'IBU')}
          {analysis.style.ibu && <div className="hop-presets"><span>Repères :</span>{[analysis.style.ibu.min, Math.round((analysis.style.ibu.min + analysis.style.ibu.max) / 2), analysis.style.ibu.max].map(n => <button key={n} type="button" onClick={() => patch({ targetIbu: n })}>{n} IBU</button>)}</div>}</>
          : draft.mode === 'move' && <><label className="hop-check"><input type="checkbox" checked={draft.keepIbu} onChange={e => patch({ keepIbu: e.target.checked })} />Recalculer la masse pour garder les IBU actuels</label>{!draft.keepIbu && numeric('Masse du scénario', 'weightG', 'g')}</>}
      </> : <>
        {numeric('Dose de cet ajout à cru', 'doseGL', 'g/L')}
        <div className="hop-select-line"><label htmlFor={`${uid}-phase`}>Phase</label><select id={`${uid}-phase`} aria-label="Phase du dry hop" aria-invalid={!draft.phase} aria-describedby={!draft.phase ? `${uid}-errors` : undefined} value={draft.phase ?? ''} onChange={e => patch({ phase: e.target.value as HopRecipeAdjustment['phase'] })}><option value="">À préciser</option><option value="fermentation">Fermentation active constatée</option><option value="postFermentation">Après la phase principale</option></select></div>
        {numeric('Température du contact à cru', 'tempC', '°C')}{numeric('Durée de contact à cru', 'contactHours', 'h')}
        <Detail title={`Jour au calendrier · ${draft.dayOffset == null ? 'non fixé' : `J${fmt(draft.dayOffset)}`}`}>{numeric('Jour indicatif depuis ensemencement', 'dayOffset', 'j')}<p className="hop-small">Jour de planification seulement. Les mesures de fermentation décident du moment réel.</p></Detail>
      </>}
      {stale && <p role="alert" className="hop-warning">La recette a changé. <button type="button" onClick={reset}>Reprendre les données actuelles</button></p>}
      {result.errors.length > 0 ? <div id={`${uid}-errors`} className="hop-missing" role="status"><strong>À compléter pour calculer</strong><ul>{result.errors.map(e => <li key={e}>{e}</li>)}</ul></div> : <>
        <HopIbuRange current={result.beforeIbu} proposed={result.afterIbu} range={analysis.style.ibu} />
        <dl className="hop-comparison" aria-label="Comparaison actuel et scénario"><div><dt>Masse de l’ajout</dt><dd>{draft.index === -1 ? 'Nouvel ajout' : `${fmt(result.beforeGrams)} g`} → <strong>{fmt(result.afterGrams)} g</strong></dd></div>
          {draft.mode === 'dryHop' && <div><dt>Total à cru · tous les ajouts</dt><dd>{fmt(analysis.dry.doseGL)} → <strong>{fmt(result.afterDryGL)} g/L</strong></dd></div>}</dl>
        <p className="hop-small">Estimations, pas des IBU mesurés. L’amertume finale à cru reste à évaluer.</p>
      </>}
      {result.notes.map(note => <p key={note} className="hop-small">{note}</p>)}
      <div className="hop-actions">{onChange && <button type="button" className="hop-apply" disabled={busy || stale || !!result.errors.length || !result.changed} onClick={() => void apply()}>{busy ? 'Application…' : 'Appliquer cet ajout'}</button>}<button type="button" disabled={busy} onClick={reset}>Réinitialiser</button></div>
      {!onChange && <p className="hop-small">Simulation locale. Pour conserver un changement, ouvre la modification de recette.</p>}
    </fieldset>}
    {view === 'flavor' && <div className="hop-flavor" aria-label="Construire un caractère par style">
      {family === 'unknown' ? <p>Choisis un style dans Identité avant de rechercher un caractère. Aucune famille de levure n’est supposée.</p> : <>
        <SegmentedControl label="Caractère à renforcer" value={activeGoal} onChange={setGoal} options={goals.map(value => ({ value, label: sensoryNames[value] }))} />
        {wheat ? <>
          <p>{activeGoal === 'banana' ? 'La banane vient surtout de l’acétate d’isoamyle produit par la levure. Compare d’abord la souche, puis sa conduite.' : activeGoal === 'clove' ? 'Le girofle vient surtout du 4-VG de la levure. Compare une souche phénolique et le repos férulique avant saccharification.' : 'Pour garder l’équilibre banane–girofle, commence par la souche puis limite le houblon à son rôle de soutien.'}</p>
          <p className="hop-small">{currentYeast ? `Actuelle : ${currentYeast.label} · ${currentYeast.descriptor}` : `Actuelle : ${recipe.yeast?.name || 'à choisir'} · adéquation au style à vérifier.`}</p>
          <ol className="hop-instructions"><li><strong>1. Souche</strong><span>{activeGoal === 'clove' ? 'Comparer le profil épicé de WLP380 à la souche actuelle.' : 'Comparer 3068 et WLP300, puis les alternatives sèches.'}</span></li><li><strong>2. Conduite</strong><span>{activeGoal === 'clove' ? 'Examiner le précurseur au brassage et les esters qui peuvent masquer le girofle.' : 'La réponse à la température dépend de la souche. Dose viable et pression précoce comptent aussi.'}</span></li><li><strong>3. Essai</strong><span>Changer un levier, garder un témoin et comparer à dégustation. Aucun pourcentage de goût prédit.</span></li></ol>
        </> : <>
          <p>{hoppy ? 'Choisis une variété compatible avec le style, puis compare un ajout tardif ou à cru. Le lot, la souche et le contact déterminent le résultat.' : 'Compare une finition florale ou épicée au caractère de fermentation et au malt du style.'}</p>
          <p className="hop-small">{activeGoal === 'balanced'
            ? `${flavorVarieties.length} références à comparer pour l’équilibre du style.`
            : `${flavorVarieties.length} références de ce style mentionnent cet arôme dans leurs descriptions.`}</p>
          <ul className="hop-sensory-varieties">{flavorRows(flavorVarieties.slice(0, 6))}</ul>
          {flavorVarieties.length > 6 && <Detail title={`Voir les ${flavorVarieties.length - 6} autres références`}>
            <ul className="hop-sensory-varieties">{flavorRows(flavorVarieties.slice(6))}</ul>
          </Detail>}
          <p className="hop-small">Les descriptions affinent le choix après le style. Une mention aromatique ne prédit pas son intensité dans la bière.</p>
          <button type="button" onClick={()=>chooseTool(hoppy?'dryHop':'ibu')}>Explorer le catalogue du style</button>
        </>}
        <Detail title={`Alternatives de levure · ${comparisons.length} à comparer`}><ul className="hop-yeast-alternatives">{comparisons.map(c => <li key={c.yeastId}><strong>{c.label} · {c.lab}</strong><span>{c.descriptor}</span><span className="hop-small">{c.reason}</span>{onPlanYeast && <button type="button" onClick={() => onPlanYeast(yeastGoal, c.yeastId)}>Comparer cette souche</button>}</li>)}</ul><p className="hop-small">Descriptions fabricant, pas un classement universel ni des souches réputées équivalentes.</p></Detail>
        <div className="hop-actions">{onPlanYeast ? <button type="button" onClick={() => onPlanYeast(yeastGoal)}>{wheat ? `Simuler ${sensoryNames[activeGoal].toLowerCase()} avec la levure` : 'Comparer la conduite de levure'}</button> : onNavigate && <button type="button" onClick={() => onNavigate('levure')}>Comparer les levures</button>}
          {onNavigate && <button type="button" onClick={() => onNavigate('paliers')}>Voir les paliers</button>}</div>
      </>}
    </div>}
    </div>
    <Detail title="Méthode et cas documentés"><p>Le style fixe un rôle, pas une liste de variétés autorisées. Le calcul IBU reprend le volume final, la densité et les contacts de la recette. Le scénario ajuste un seul ajout en conservant les autres.</p>
      <ul className="hop-source-list">{Object.values(HOP_RECIPE_SOURCES).map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}{analysis.style.source && <li><a href={analysis.style.source.reference} target="_blank" rel="noreferrer">{analysis.style.edition} · {analysis.style.name}</a></li>}</ul>
      <p>Cas documentés : Paulaner Brewhouse compare WB-06 et W-68 pour sa bière de blé ; WeldWerks Juicy Bits combine Mosaic, Citra et El Dorado avec Wyeast 1318. Les choix et durées de ces recettes ne sont pas des optima universels.</p>
      <a href="https://fermentis.com/en/news/testimonials/german-style-wheat-beer-with-safale-range/" target="_blank" rel="noreferrer">Paulaner · témoignage publié par Fermentis</a>
      <a href="https://www.beerandbrewing.com/weldwerks-brewing-co-juicy-bits-new-england-style-ipa" target="_blank" rel="noreferrer">WeldWerks · recette de Neil Fisher, 2017</a>
    </Detail>
    {loading && <p className="hop-small" role="status">Chargement du catalogue…</p>}{catalogueError && <p role="alert" className="hop-error">{catalogueError}</p>}
    {notice && <p role="status" className="hop-notice">{notice}</p>}{error && <p role="alert" className="hop-error">{error}</p>}
  </section>;
}
