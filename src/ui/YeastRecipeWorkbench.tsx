import React, { useId, useMemo, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import type { HopSource } from '../../functions/src/hopIndexSchema';
import {
  YEAST_STYLE_FAMILIES, YEAST_RECIPE_GOAL_LABELS,
  inferYeastRecipeStyle, yeastRecipeCandidates, createYeastRecipeDraft,
  evaluateYeastRecipeDesign, applyYeastRecipeDesign, calculateYeastCellRequirement, proposeYeastGoalSettings,
  readYeastRecipeDesign, yeastRecipeDesignChanged, yeastRecipeFormWarning,
  type YeastRecipeDraft, type YeastRecipeGoal, type YeastStyleId,
} from '../domain/yeastRecipeDesign';
import { fermentationStateKey } from '../domain/fermentationGuide';
import { yeastReferences } from '../domain/yeastReferences';
import { StorageService } from '../services/storage';
import { useStorageValue } from '../hooks/useLiveData';
import { NumberInput } from './NumberInput';
import { SegmentedControl } from './SegmentedControl';
import { YeastRangeComparison } from './YeastRangeComparison';
import { FermentationTemperatureChart } from './FermentationTemperatureChart';
import { NoloFermentationWorkshop } from './NoloFermentationWorkshop';
import { YeastStrainDetails } from './YeastStrainDetails';
import { YeastCandidatePicker } from './YeastCandidatePicker';
import { yeastStrainInformation } from '../domain/yeastStrainInformation';
import './yeast-recipe.css';

export type YeastRecipeDestination = 'identite' | 'fermentescibles' | 'houblons' | 'paliers' | 'eau';
const number = (n?: number | null, digits = 1) => Number.isFinite(n)
  ? n!.toLocaleString('fr-FR', { maximumFractionDigits: digits }) : '—';
const range = (r?: { range: { min: number; max: number } } | null, unit = '') => r
  ? `${number(r.range.min)}${r.range.min === r.range.max ? '' : `–${number(r.range.max)}`} ${unit}`.trim() : 'Non documenté';
const baseKey = (recipe: TrialRecipe) => fermentationStateKey({
  style: recipe.style, styleRef: recipe.styleRef, volumeL: recipe.volumeL, og: recipe.ogTarget,
  yeast: recipe.yeast, yeastDesign: recipe.yeastDesign, hops: recipe.hops,
  fermentation: recipe.fermentation, mash: recipe.mash, fermentables: recipe.fermentables,
});

function Source({ source }: { source: HopSource }) {
  const url = /^https?:\/\//.test(source.reference) ? source.reference : undefined;
  return url ? <a className="yeast-source" href={url} target="_blank" rel="noreferrer">{source.author} · {source.title}</a>
    : <span>{source.author} · {source.title}</span>;
}

function Disclosure({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return <details><summary>{title}<ChevronDown size={14} aria-hidden="true" /></summary><div>{children}</div></details>;
}

/** Local exploration is separate from the editable recipe; apply is synchronous and explicit. */
export function YeastRecipeWorkbench({ recipe, onChange, onNavigate, simulationOnly = false, initialGoal, initialYeastId }: {
  recipe: TrialRecipe; onChange: (next: TrialRecipe) => TrialRecipe | void;
  onNavigate?: (destination: YeastRecipeDestination) => void; simulationOnly?: boolean;
  initialGoal?: YeastRecipeGoal; initialYeastId?: string;
}) {
  const saved = useStorageValue(StorageService.getHopKnowledge);
  const refs = useMemo(() => yeastReferences(saved), [saved]);
  const uid = useId();
  const key = baseKey(recipe);
  const [local, setLocal] = useState(() => {
    const draft = createYeastRecipeDraft(recipe, refs, undefined, initialYeastId);
    const goals = YEAST_STYLE_FAMILIES.find(style => style.id === draft.styleId)?.goals ?? [];
    return { key, draft: { ...draft, ...(initialGoal && goals.includes(initialGoal) ? { goal: initialGoal } : {}) } };
  });
  const [compareOpen, setCompareOpen] = useState(!recipe.yeast?.hopIndexId || !!initialYeastId);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [cellRate, setCellRate] = useState<number>();
  const [viableCells, setViableCells] = useState<number>();
  const stale = local.key !== key;
  const draft = local.draft;
  const style = YEAST_STYLE_FAMILIES.find(s => s.id === draft.styleId);
  const recipeStyle = inferYeastRecipeStyle(recipe);
  const candidates = useMemo(() => yeastRecipeCandidates(draft.styleId, draft.goal, refs, recipe.volumeL, { includeOtherStyles: true }), [draft.styleId, draft.goal, refs, recipe.volumeL]);
  const styleCount = candidates.filter(c => c.styleMatch === 'documented').length;
  const result = useMemo(() => evaluateYeastRecipeDesign(recipe, draft, refs), [recipe, draft, refs]);
  const selected = result.candidate;
  const proposedSettings = proposeYeastGoalSettings(recipe, draft, refs);
  const suggestion = proposedSettings && Object.entries(proposedSettings.patch).some(([key, value]) => draft[key] !== value) ? proposedSettings : undefined;
  const mainEffects = new Set(['temperature', 'ferulic', 'pressure']);
  const currentDraft = createYeastRecipeDraft(recipe, refs);
  const current = evaluateYeastRecipeDesign(recipe, currentDraft, refs);
  const currentFormWarning = yeastRecipeFormWarning(recipe, current.candidate?.reference);
  const cell = calculateYeastCellRequirement({ volumeL: recipe.volumeL, og: recipe.ogTarget,
    pitchRateMillionPerMlPlato: cellRate, viableCellsBillion: viableCells });
  const patch = (updates: Partial<YeastRecipeDraft>) => {
    setLocal(value => ({ ...value, draft: { ...value.draft, ...updates } })); setNotice(''); setError('');
  };
  const reset = () => {
    setLocal({ key, draft: createYeastRecipeDraft(recipe, refs) }); setNotice('Scénario repris depuis la recette.'); setError('');
  };
  const chooseStyle = (styleId: YeastStyleId) => {
    setLocal({ key, draft: createYeastRecipeDraft(recipe, refs, styleId) }); setNotice(''); setError('');
    setCompareOpen(true);
  };
  const chooseStrain = (yeastId: string) => {
    const next = createYeastRecipeDraft(recipe, refs, draft.styleId, yeastId);
    setLocal(value => ({ key: value.key, draft: { ...next, goal: draft.goal, pressureBar: draft.pressureBar, ferulicRest: draft.ferulicRest } }));
    setNotice(''); setError('');
  };
  const apply = (mode: 'strain' | 'settings') => {
    try {
      if (stale) throw Error('Reprends les données actuelles avant d’appliquer ce scénario.');
      const next = applyYeastRecipeDesign(recipe, draft, refs, mode);
      // The wizard completes local ingredient facts before accepting the proposal.
      // Compare future edits with that accepted recipe, including its snapshot.
      const applied = onChange(next) || next;
      setLocal({ key: baseKey(applied), draft: createYeastRecipeDraft(applied, refs, draft.styleId, draft.yeastId) });
      setNotice(simulationOnly ? 'Variante locale mise à jour.' : mode === 'strain' ? 'Souche reprise dans la recette. Quantité et paliers à vérifier.' : 'Scénario repris dans la recette. Enregistre la recette pour le conserver.');
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Vérifie les réglages du scénario.'); }
  };
  let preview: TrialRecipe | undefined;
  if (!result.errors.length && selected) {
    try { preview = applyYeastRecipeDesign(recipe, draft, refs, 'settings'); } catch { /* Errors are shown in the result. */ }
  }
  if (recipe.nolo?.enabled) return <NoloFermentationWorkshop recipe={recipe} onChange={onChange} />;

  return <section className="yeast-workbench" aria-label="Choix et simulation de levure" data-engine="yeast-recipe-1">
    <div className="yeast-filter">
      <label htmlFor={`${uid}-style`}>Style</label>
      <select id={`${uid}-style`} aria-label="Filtrer les levures par style" value={draft.styleId} onChange={e => chooseStyle(e.target.value as YeastStyleId)}>
        <option value="unknown">Autre style · choix libre</option>
        {YEAST_STYLE_FAMILIES.filter(s => s.id !== 'unknown').map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      {onNavigate && <button type="button" className="yeast-link" onClick={() => onNavigate('identite')}>Recette</button>}
    </div>
    {draft.styleId !== recipeStyle && <p className="yeast-notice">Comparaison pour un autre style. Recette : {recipe.style || 'style à définir'}.</p>}
    {currentFormWarning && <p className="yeast-notice">{currentFormWarning}</p>}
    {stale && <div role="alert" className="yeast-notice">La recette a changé pendant la comparaison. <button type="button" onClick={reset}>Reprendre les données actuelles</button></div>}
    {draft.styleId === 'unknown' && <p className="yeast-small">Style non reconnu : explore le catalogue et vérifie les usages de la souche. Tu peux préciser la famille à tout moment.</p>}
      {draft.styleId === 'unknown' ? <div className="yeast-filter"><label htmlFor={`${uid}-goal`}>Caractère recherché</label>
        <select id={`${uid}-goal`} value={draft.goal} onChange={e => patch({ goal: e.target.value as YeastRecipeGoal })}>
          {(style?.goals ?? []).map(goal => <option key={goal} value={goal}>{YEAST_RECIPE_GOAL_LABELS[goal]}</option>)}
        </select></div> : <SegmentedControl className="yeast-goals" label="Caractère recherché" value={draft.goal} onChange={goal => patch({ goal })}
        options={(style?.goals ?? []).map(goal => ({ value: goal as YeastRecipeGoal, label: YEAST_RECIPE_GOAL_LABELS[goal] }))} />}
      <details open={compareOpen} onToggle={e => setCompareOpen(e.currentTarget.open)} className="yeast-strain-comparison">
        <summary>Comparer les souches du style · {draft.styleId === 'unknown' ? 'catalogue entier' : styleCount}<ChevronDown size={14} aria-hidden="true" /></summary>
        <YeastCandidatePicker key={draft.styleId} candidates={candidates} styleId={draft.styleId} selectedId={draft.yeastId} onSelect={chooseStrain} />
      </details>
      {selected ? <section className="yeast-scenario" aria-label="Scénario de levure">
        <div className="flex items-baseline justify-between gap-2"><h3 className="font-semibold text-cave-50">{selected.label}</h3><span className="yeast-small">Scénario à comparer</span></div>
        <p className="yeast-small">{selected.lab} · {selected.form ?? 'forme à préciser'}</p>
        {(!selected.reference.form || selected.form !== selected.reference.form) && <div className="yeast-setting-line">
          <label htmlFor={`${uid}-product-form`}>Forme du produit utilisé</label>
          <select id={`${uid}-product-form`} value={draft.form ?? ''} onChange={e => patch({ form: e.target.value as YeastRecipeDraft['form'] || undefined, formYeastId: draft.yeastId, quantityG: undefined })}>
            <option value="">À confirmer</option><option value="sèche">Sèche</option><option value="liquide">Liquide</option><option value="levain">Levain</option>
          </select>
        </div>}
        <Disclosure title={`Usages et caractère · ${selected.styleMatch === 'documented' ? 'style documenté' : 'style à confirmer'}`}>
          <p className="text-[13px]">{selected.descriptor}</p><p className="yeast-small">{selected.reason}</p>
          {selected.evidence.styleMatches.length ? <dl className="yeast-strain-notes">{selected.evidence.styleMatches.map((match, i) => <div key={i}>
            <dt>{YEAST_STYLE_FAMILIES.find(f => f.id === match.styleId)?.label}</dt>
            <dd>{match.reported}{match.context ? ` · ${match.context}` : ''}<span className="block yeast-small"><Source source={match.source} /></span></dd>
          </div>)}</dl> : <p className="yeast-small">Aucun usage de bière reconnu dans les faits disponibles. Le nom ou l’arôme seul ne suffit pas à valider un style.</p>}
          {selected.evidence.exclusions.map((match, i) => <p key={i} className="yeast-notice">{match.reported} <Source source={match.source} /></p>)}
        </Disclosure>
        {suggestion && <div className="yeast-suggestion">
          <button type="button" onClick={() => { patch(suggestion.patch); setNotice(suggestion.rationale); }}>{suggestion.label}</button>
          <span className="yeast-small"> Proposition à comparer avant application.</span>
        </div>}
        <div className="yeast-simulation-grid">
          <div>
            <div className="yeast-setting-line">
              <label htmlFor={`${uid}-temp`}>Température principale</label>
              <NumberInput id={`${uid}-temp`} aria-label="Température principale du scénario" value={draft.temperatureC} emptyValue={undefined} onValue={temperatureC => patch({ temperatureC })} />
              <span>°C</span>
            </div>
            {selected.temperature && <>
              {draft.temperatureC != null && draft.temperatureC >= selected.temperature.range.min && draft.temperatureC <= selected.temperature.range.max ? <input type="range" className="yeast-temperature-range" aria-label="Explorer la température de fermentation"
                min={selected.temperature.range.min} max={selected.temperature.range.max} step={0.5}
                value={draft.temperatureC} onChange={e => patch({ temperatureC: Number(e.target.value) })} />
                : <div className="yeast-range-unknown h-4" aria-hidden="true" />}
              <div className="yeast-temperature-limits"><span>{number(selected.temperature.range.min)} °C</span><span>Fenêtre fabricant</span><span>{number(selected.temperature.range.max)} °C</span></div>
            </>}
            <Disclosure title={`Pression précoce · ${draft.pressureBar == null ? 'à préciser' : `${number(draft.pressureBar)} bar rel.`}`}>
            <div className="yeast-setting-line">
              <label htmlFor={`${uid}-bar`}>Contre-pression précoce</label>
              <NumberInput id={`${uid}-bar`} aria-label="Contre-pression du scénario en bar" value={draft.pressureBar} emptyValue={undefined} onValue={pressureBar => patch({ pressureBar })} /><span>bar rel.</span>
            </div>
            <p className="yeast-small mt-1">Vide : inconnue · 0 : sans contre-pression. Séparée de la carbonatation finale.</p>
            </Disclosure>
            {(draft.styleId === 'weissbier' || draft.styleId === 'witbier') && <label className="yeast-check mt-2">
              <input type="checkbox" checked={draft.ferulicRest} onChange={e => patch({ ferulicRest: e.target.checked })} />
              <span>Repos férulique pour le girofle<span className="block yeast-small">44 °C · 15 min si absent. Proposition L’Affinée.</span></span>
            </label>}
          </div>
          <dl className="yeast-effects" aria-label="Effets attendus des réglages">
            {result.effects.filter(effect => mainEffects.has(effect.id)).map(effect => <div className="yeast-effect" key={effect.id} data-effect={effect.id}>
              <dt>{effect.label}</dt><dd><strong>{effect.impact}</strong></dd>
            </div>)}
          </dl>
        </div>
        <div className="yeast-figures">
          <YeastRangeComparison label="Densité finale documentaire" unit="SG" digits={3} current={current.fg.range} proposed={result.fg.range} />
          {selected.form === 'sèche' ? <YeastRangeComparison label={`Dose fabricant pour ${number(recipe.volumeL)} L`} unit="g" current={recipe.yeast.form === 'sèche' ? current.doseG?.range : undefined} proposed={result.doseG?.range} quantity={draft.quantityG} />
            : <dl className="text-[13px]"><dt className="text-cave-400">Alcool documentaire</dt><dd className="font-mono">{result.abv.range ? `${number(result.abv.range.min)}–${number(result.abv.range.max)} % vol` : 'Non quantifiable'}</dd></dl>}
        </div>
        <p className="yeast-small">Enveloppes documentaires · confiance faible. Intensité des arômes non chiffrée.</p>
        <YeastStrainDetails key={selected.yeastId} information={yeastStrainInformation(selected.reference, selected.form)} />
        <Disclosure title="Comprendre les effets des réglages">
          <p className="text-[13px]">{selected.reason}</p>
          <dl className="yeast-effects">{result.effects.filter(e => mainEffects.has(e.id)).map(e => <div className="yeast-effect" key={e.id}><dt>{e.label}</dt><dd>{e.detail}<span className="block yeast-small">{e.state === 'documented' ? 'Description documentée' : e.state === 'unknown' ? 'Donnée manquante' : e.state === 'warning' ? 'À vérifier' : 'Tendance conditionnelle'}</span></dd></div>)}</dl>
        </Disclosure>
        <Disclosure title="Ensemencement et durée à préparer">
          <div className="space-y-2">
            <div className="yeast-setting-line"><label htmlFor={`${uid}-pitch`}>Température d’ensemencement</label><NumberInput id={`${uid}-pitch`} aria-label="Température d’ensemencement du scénario" value={draft.pitchTempC} emptyValue={undefined} onValue={pitchTempC => patch({ pitchTempC })} /><span>°C</span></div>
            <div className="yeast-setting-line"><label htmlFor={`${uid}-days`}>Durée principale à planifier</label><NumberInput id={`${uid}-days`} aria-label="Durée principale du scénario en jours" value={draft.days} emptyValue={undefined} onValue={days => patch({ days })} /><span>j</span></div>
            <p className="yeast-small">Les jours servent au calendrier. La fin de fermentation se vérifie par des mesures, après le dernier houblonnage à cru.</p>
            {selected.form === 'sèche' ? <>
              <div className="yeast-setting-line"><label htmlFor={`${uid}-grams`}>Levure sèche prévue</label><NumberInput id={`${uid}-grams`} aria-label="Masse de levure du scénario en grammes" min={0} value={draft.quantityG} emptyValue={undefined} onValue={quantityG => patch({ quantityG })} /><span>g</span></div>
              <p className="yeast-small">Repère fabricant : {range(result.doseG, 'g')}. Aucune masse de sachet ni viabilité supposée ; la quantité reste à choisir.</p>
            </> : selected.evidence.culture === 'bacteria' || selected.evidence.culture === 'other-fermentation' ? <p className="yeast-small">Cette culture demande son protocole spécifique. Le taux d’ensemencement d’une levure de bière ne lui est pas transféré.</p> : <>
              <div className="yeast-setting-line"><label htmlFor={`${uid}-rate`}>Taux visé · M cellules/mL/°P</label><NumberInput id={`${uid}-rate`} aria-label="Taux de cellules visé par mL et degré Plato" value={cellRate} emptyValue={undefined} onValue={setCellRate} /></div>
              <div className="yeast-setting-line"><label htmlFor={`${uid}-cells`}>Cellules viables disponibles</label><NumberInput id={`${uid}-cells`} aria-label="Cellules viables disponibles en milliards" value={viableCells} emptyValue={undefined} onValue={setViableCells} /><span>Md</span></div>
              <output className="block text-[13px]" aria-live="polite">{cell.requiredBillion != null ? `${number(cell.requiredBillion)} milliards de cellules nécessaires${cell.balanceBillion != null ? ` · écart disponible ${number(cell.balanceBillion)} Md` : ''}.` : 'Renseigne volume, densité et taux d’ensemencement pour calculer le besoin.'}</output>
              {cell.errors.map(text => <p key={text} className="yeast-error">{text}</p>)}
              <p className="yeast-small">Le taux est ton hypothèse de travail. Sans comptage viable, aucun nombre de flacons ni volume de levain n’est déduit.</p>
            </>}
          </div>
        </Disclosure>
        <Disclosure title={<>Interactions avec la recette · {number(result.hops.doseGL)} g/L à cru</>}>
          <div className="space-y-2 text-[13px]">
            <dl className="grid grid-cols-3 gap-2"><div><dt className="text-cave-400">Actif</dt><dd>{number(result.hops.activeG)} g</dd></div><div><dt className="text-cave-400">Après fermentation</dt><dd>{number(result.hops.postG)} g</dd></div><div><dt className="text-cave-400">Phase inconnue</dt><dd>{number(result.hops.unknownG)} g</dd></div></dl>
            {result.hops.additions.length > 0 && <table className="yeast-contacts"><caption className="sr-only">Contacts des houblons avec la fermentation</caption><thead><tr><th>Ajout prévu</th><th>Contexte</th><th>Contact</th></tr></thead><tbody>{result.hops.additions.map((hop, i) => <tr key={i}>
              <th scope="row">{hop.name}<span className="block yeast-small">{hop.dayOffset == null ? 'Jour inconnu' : `J+${number(hop.dayOffset)}`} · {number(hop.doseGL)} g/L</span></th>
              <td>{hop.phase === 'active' ? 'Fermentation active' : hop.phase === 'post' ? 'Après fermentation' : 'À préciser'}</td><td>{number(hop.contactHours)} h<br />{number(hop.temperatureC)} °C</td>
            </tr>)}</tbody></table>}
            {result.effects.filter(effect => !mainEffects.has(effect.id) && effect.id !== 'strain').map(effect => <div key={effect.id}><strong>{effect.label} · {effect.impact}</strong><p>{effect.detail}</p></div>)}
            {result.warnings.map(text => <p key={text} className="yeast-notice">{text}</p>)}
            <div className="yeast-actions">
              {onNavigate && <><button type="button" onClick={() => onNavigate('houblons')}>Vérifier les houblons<ArrowRight className="inline ml-1" size={12} aria-hidden="true" /></button><button type="button" onClick={() => onNavigate('paliers')}>Vérifier les paliers</button></>}
            </div>
          </div>
        </Disclosure>
        {result.warnings.length > 0 && <p className="yeast-notice">{result.warnings[0]}{result.warnings.length > 1 ? ` ${result.warnings.length - 1} autre${result.warnings.length > 2 ? 's' : ''} point${result.warnings.length > 2 ? 's' : ''} dans les interactions.` : ''}</p>}
        <Disclosure title={`Recette → scénario · ${result.changes.length} changement${result.changes.length > 1 ? 's' : ''}`}>
          {result.changes.length ? <table className="yeast-contacts"><thead><tr><th scope="col">Réglage</th><th scope="col">Recette</th><th scope="col">Scénario</th></tr></thead><tbody>
            {result.changes.map(change => <tr key={change.id}><th scope="row">{change.label}</th><td>{change.before}</td><td>{change.after}</td></tr>)}
          </tbody></table> : <p className="yeast-small">Les réglages sont identiques à ceux de la recette.</p>}
          {preview && <FermentationTemperatureChart steps={preview.fermentation ?? []} pitchTempC={preview.yeast.pitchTempC} />}
        </Disclosure>
        {result.errors.map(text => <p key={text} role="alert" className="yeast-error">{text}</p>)}
        {error && <p role="alert" className="yeast-error">{error}</p>}
        {notice && <p role="status" className="yeast-notice">{notice}</p>}
        <div className="yeast-actions">
          <button type="button" disabled={stale || result.errors.length > 0} onClick={() => apply('settings')}>Appliquer le scénario</button>
          <button type="button" disabled={stale} onClick={() => apply('strain')}>Choisir cette souche</button>
          <button type="button" className="yeast-link" onClick={reset}>Réinitialiser</button>
        </div>
        <p className="yeast-small">{simulationOnly ? 'Simulation locale à la consultation.' : 'La recette enregistrée est modifiée seulement lors de son enregistrement.'}</p>
        <Disclosure title="Pourquoi ces conseils ? Sources et limites">
          <div className="space-y-2 text-[13px]">
            {result.fg.reasons.map(reason => <p key={reason}>{reason}</p>)}
            {result.sources.map((source, i) => <p key={i}><Source source={source} /></p>)}
            <p>Les descriptions de deux laboratoires ne prouvent ni une identité de souche ni une supériorité universelle. Pour départager deux conduites, divise le même moût, ne change qu’un facteur et compare à l’aveugle.</p>
          </div>
        </Disclosure>
      </section> : <p>Choisis une souche du comparatif pour préparer le scénario.</p>}
  </section>;
}

/** Live cross-step reading: saved intent, current ingredients, current temperatures. */
export function YeastRecipeContext({ recipe, onChooseYeast }: { recipe: TrialRecipe; onChooseYeast?: () => void }) {
  const saved = useStorageValue(StorageService.getHopKnowledge);
  const refs = useMemo(() => yeastReferences(saved), [saved]);
  const snapshot = readYeastRecipeDesign(recipe);
  if (!snapshot || recipe.nolo?.enabled) return null;
  const draft = createYeastRecipeDraft(recipe, refs);
  const result = evaluateYeastRecipeDesign(recipe, draft, refs);
  const relevant = result.effects.filter(e => e.id.startsWith('hop-') || e.id === 'style-hops');
  return <aside className="yeast-workbench border-t border-cave-700 pt-2" aria-label="Levure et conduite liées à la recette">
    <div className="flex items-center justify-between gap-2"><p><strong>{recipe.yeast.name}</strong> · {YEAST_RECIPE_GOAL_LABELS[snapshot.goal]}</p>{onChooseYeast && <button type="button" onClick={onChooseYeast}>Comparer</button>}</div>
    {yeastRecipeDesignChanged(recipe, snapshot) && <p className="yeast-notice">Des réglages ont changé depuis l’application. Recompare la conduite avec les valeurs actuelles.</p>}
    {result.hops.additions.length > 0 && <p className="text-[13px]">{number(result.hops.doseGL)} g/L à cru · {number(result.hops.activeG)} g en phase active · {number(result.hops.postG)} g après fermentation{result.hops.unknownCount ? ` · ${result.hops.unknownCount} phase${result.hops.unknownCount > 1 ? 's' : ''} à préciser` : ''}.</p>}
    {relevant.length > 0 && <Disclosure title="Ce que cela change avec les houblons"><div className="space-y-2 text-[13px]">{relevant.map(e => <p key={e.id}><strong>{e.impact}.</strong> {e.detail}</p>)}</div></Disclosure>}
  </aside>;
}

/** Closed overview keeps the adopted intent separate from today's actual setpoint. */
export function YeastRecipeHeading({ recipe }: { recipe: TrialRecipe }) {
  const intent = readYeastRecipeDesign(recipe);
  const primary = recipe.fermentation?.find(s => s.kind === 'primaire');
  return <span>{recipe.yeast.name || 'Souche à préciser'} · {recipe.yeast.qty > 0 && recipe.yeast.unit ? `${number(recipe.yeast.qty)} ${recipe.yeast.unit}` : 'quantité à préciser'}{intent && <span className="block">Objectif : {YEAST_RECIPE_GOAL_LABELS[intent.goal]} · primaire {number(primary?.tempC)} °C{yeastRecipeDesignChanged(recipe, intent) ? ' · réglages modifiés' : ''}</span>}</span>;
}

export function YeastRecipeSummary({ recipe, onEdit }: { recipe: TrialRecipe; onEdit?: () => void }) {
  const [variant, setVariant] = useState<TrialRecipe>();
  const saved = useStorageValue(StorageService.getHopKnowledge);
  const refs = useMemo(() => yeastReferences(saved), [saved]);
  const draft = createYeastRecipeDraft(recipe, refs);
  const result = evaluateYeastRecipeDesign(recipe, draft, refs);
  const formWarning = yeastRecipeFormWarning(recipe, result.candidate?.reference);
  const intent = readYeastRecipeDesign(recipe);
  return <section className="yeast-workbench" aria-label="Conduite de levure de la recette">
    {variant ? <>
      <button type="button" onClick={() => setVariant(undefined)}>Fermer la variante de levure</button>
      <YeastRecipeWorkbench recipe={variant} onChange={setVariant} simulationOnly />
    </> : <>
      {intent && yeastRecipeDesignChanged(recipe, intent) && <p className="yeast-notice">Des réglages ont changé depuis l’application de l’objectif. Les consignes ci-dessous sont celles de la recette actuelle.</p>}
      {formWarning && <p className="yeast-notice">{formWarning}</p>}
      <dl className="grid grid-cols-2 gap-2 text-[13px]">
        <div><dt className="text-cave-400">Primaire</dt><dd>{number(draft.temperatureC)} °C · {number(draft.days)} j prévus</dd></div>
        <div><dt className="text-cave-400">Pression prévue au départ</dt><dd>{draft.pressureBar == null ? 'À préciser' : `${number(draft.pressureBar)} bar rel.`}</dd></div>
        <div><dt className="text-cave-400">Levure à préparer</dt><dd>{recipe.yeast.qty > 0 && recipe.yeast.unit ? `${number(recipe.yeast.qty)} ${recipe.yeast.unit}` : 'Quantité à préciser'} · {recipe.yeast.form || 'forme à préciser'}</dd></div>
        <div><dt className="text-cave-400">Ensemencement</dt><dd>{number(recipe.yeast.pitchTempC)} °C</dd></div>
      </dl>
      <FermentationTemperatureChart compact steps={recipe.fermentation ?? []} pitchTempC={recipe.yeast.pitchTempC} />
      {result.hops.additions.length > 0 && <p className="text-[13px]">À cru : {number(result.hops.doseGL)} g/L · {result.hops.unknownCount ? `${result.hops.unknownCount} phase${result.hops.unknownCount > 1 ? 's' : ''} à préciser` : `${number(result.hops.activeG)} g en phase active · ${number(result.hops.postG)} g après fermentation`}.</p>}
      <YeastStrainDetails information={yeastStrainInformation(result.candidate?.reference, recipe.yeast.form)} />
      <Disclosure title="Conséquences, houblons et références">
        <p className="text-[13px]">Densité finale documentaire : {result.fg.range ? `${number(result.fg.range.min, 3)}–${number(result.fg.range.max, 3)} SG` : 'non quantifiable'}.</p>
        <p className="yeast-small">DI de travail : {number(recipe.ogTarget, 3)} SG · enveloppe d’atténuation, confiance faible. Les jours du programme ne prouvent pas la fin de fermentation.</p>
        <div className="space-y-2 text-[13px]">{result.effects.filter(e => ['temperature', 'ferulic', 'pressure', 'dose', 'diastatic'].includes(e.id) && !(e.id === 'dose' && formWarning)).map(e => <p key={e.id}><strong>{e.impact}.</strong> {e.detail}</p>)}
          {result.effects.filter(e => e.id.startsWith('hop-') || e.id === 'style-hops').map(e => <p key={e.id}><strong>{e.impact}.</strong> {e.detail}</p>)}
          {recipe.yeast.notes && <p>{recipe.yeast.notes}</p>}
          {result.sources.map((s, i) => <p key={i}><Source source={s} /></p>)}
        </div>
      </Disclosure>
      <div className="yeast-actions"><button type="button" onClick={() => setVariant(structuredClone(recipe))}>Simuler une variante de levure</button>{onEdit && <button type="button" onClick={onEdit}>Modifier la conduite de fermentation</button>}</div>
    </>}
  </section>;
}
