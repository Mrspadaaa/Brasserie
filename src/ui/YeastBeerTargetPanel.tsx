import { useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { HopRange } from '../../functions/src/hopIndexSchema';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import type { YeastReference } from '../domain/yeastReferences';
import { createYeastRecipeDraft } from '../domain/yeastRecipeDesign';
import {
  applyYeastBeerVariation, prepareYeastBeerVariation, previewYeastBeerTarget,
  type YeastBeerTarget, type YeastBeerVariation,
} from '../domain/yeastBeerTarget';
import type { YeastRecipeDestination } from './YeastRecipeWorkbench';
import { NumberInput } from './NumberInput';
import { Input } from './Input';
import { useNumericDraft } from './numericInput';

const identityVariation = (): YeastBeerVariation => ({ fermentableScale: 1, hotHopScale: 1 });
const unchangedVariation = identityVariation();
const emptyTarget: YeastBeerTarget = {};
const numeric = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const format = (n: number, digits = 1) => n.toLocaleString('fr-FR', { maximumFractionDigits: digits });
const rangeText = (range?: HopRange | null, digits = 1) => range && numeric(range.min) && numeric(range.max)
  ? `${format(range.min, digits)}${range.min === range.max ? '' : `–${format(range.max, digits)}`}` : 'À préciser';
const finishLabels = { unspecified: 'Sans préférence', dry: 'Sèche', round: 'Ronde / douce', sweet: 'Sucrée' };
const targetSummary = (target?: YeastBeerTarget) => [target?.label, target?.finish && target.finish !== 'unspecified' ? finishLabels[target.finish] : '', target?.accent === 'chocolate' ? 'Chocolat' : '', target?.sparkling ? 'Effervescente' : ''].filter(Boolean).join(' · ');

/** Keep calculated precision, but do not cram a solver's decimal expansion into a phone field. */
function PercentInput({ value, label, invalid, onValue }: { value?: number; label: string; invalid: boolean; onValue: (n?: number) => void }) {
  const [focused, setFocused] = useState(false);
  const emitted = useRef(value);
  // Multiplication back from a factor must not overwrite "13,9" with a floating-point artefact.
  const stableValue = numeric(value) && numeric(emitted.current) && Math.abs(value - emitted.current) <= Number.EPSILON * Math.max(1, Math.abs(value)) * 4 ? emitted.current : value;
  const { draft, push, settle } = useNumericDraft(stableValue, next => { emitted.current = next; onValue(next); }, { emptyValue: undefined });
  return <Input aria-label={label} aria-invalid={invalid} inputMode="decimal" autoComplete="off"
    title={numeric(value) ? `${value.toLocaleString('fr-FR', { maximumFractionDigits: 20 })} % · valeur exacte à la saisie` : undefined}
    value={focused ? draft : numeric(value) ? format(value, 2) : ''}
    onFocus={e => { const input = e.currentTarget; setFocused(true); requestAnimationFrame(() => input.select()); }}
    onChange={e => push(e.target.value)} onBlur={() => { settle(); setFocused(false); }} />;
}

/** The examples record intent only. They do not assign an alcohol/IBU threshold to a taste word. */
const examples: Record<string, YeastBeerTarget> = {
  champagne: { label: 'Bière de Champagne assez sucrée', finish: 'sweet', sparkling: true },
  stout: { label: 'Stout très amère et chocolatée', accent: 'chocolate' },
  session: { label: 'Session NEIPA douce, peu amère, très légère', finish: 'round' },
};

/** One real common numeric axis. The target is an intention, the bars conditional estimates. */
function TargetRange({ label, unit, current, variant, target, showVariant, invalidVariant }: {
  label: string; unit: string; current?: HopRange | null; variant?: HopRange | null; target?: HopRange; showVariant: boolean; invalidVariant?: boolean;
}) {
  const ranges = [current, showVariant ? variant : undefined, target].filter((r): r is HopRange => !!r && numeric(r.min) && numeric(r.max) && r.min >= 0 && r.min <= r.max);
  const max = Math.max(unit === 'IBU' ? 10 : 1, ...ranges.map(r => r.max)) * 1.1;
  const position = (n: number) => n / max * 100;
  const validTarget = target && numeric(target.min) && numeric(target.max) && target.min >= 0 && target.min <= target.max;
  const result = showVariant ? variant : current;
  const epsilon = 1e-9 * Math.max(1, result?.max ?? 0, target?.max ?? 0);
  const state = invalidVariant ? 'Variante à corriger' : !validTarget ? target ? 'Cible à préciser' : 'Sans cible chiffrée' : !result ? 'Prévision indisponible'
    : result.min >= target.min - epsilon && result.max <= target.max + epsilon ? 'Estimation dans la cible'
      : result.max < target.min - epsilon || result.min > target.max + epsilon ? 'Estimation hors cible' : 'Cible partiellement couverte';
  return <figure className="yc-target-range" aria-label={label}>
    <figcaption><strong>{label}</strong><span className="yeast-small">{unit}</span></figcaption>
    {([{ label: 'Cible', range: validTarget ? target : undefined, kind: 'target' }, { label: 'Recette', range: current, kind: 'current' }, ...(showVariant ? [{ label: 'Variante', range: variant, kind: 'variant' }] : [])]).map(row => <div className="yc-target-range-row" key={row.kind}>
      <span>{row.label}</span><span className="yc-target-track" aria-hidden="true" data-scale-min={0} data-scale-max={max}>
        {row.range && numeric(row.range.min) && numeric(row.range.max) && row.range.min <= row.range.max && <span data-kind={row.kind} data-min={row.range.min} data-max={row.range.max} style={{ left: `${position(row.range.min)}%`, width: `${position(row.range.max) - position(row.range.min)}%` }} />}
      </span><output title={row.range ? `${rangeText(row.range, 20)} ${unit}` : undefined}>{row.kind === 'target' && !target ? 'Non fixée' : rangeText(row.range)}</output>
    </div>)}
    <p className="yeast-small">{state}</p>
  </figure>;
}

function SensoryLevers({ target, recipe, onNavigate, saveTarget }: { target: YeastBeerTarget; recipe: TrialRecipe; onNavigate?: (destination: YeastRecipeDestination) => void; saveTarget?: boolean }) {
  const chocolate = (recipe.fermentables ?? []).filter(f => /chocolat|chocolate|cacao|cocoa|carafa/i.test(f.name));
  const nonfermentables = (recipe.fermentables ?? []).filter(f => f.kind === 'lactose' || f.fermentabilityPct === 0);
  const sugars = (recipe.fermentables ?? []).filter(f => f.kind === 'sucre');
  const ingredientQuantity = (f: NonNullable<TrialRecipe['fermentables']>[number]) => `${f.name} (${numeric(f.weightKg) && f.weightKg >= 0 ? `${format(f.weightKg, 3)} kg` : 'quantité à préciser'})`;
  const dry = recipe.hops.filter(h => h.stage === 'dryHop');
  const dryG = dry.every(h => numeric(h.weightG)) ? dry.reduce((sum, h) => sum + h.weightG, 0) : undefined;
  const go = (where: YeastRecipeDestination, label: string) => onNavigate && <button type="button" className="yeast-link" onClick={() => onNavigate(where)}>{saveTarget ? `Conserver la cible et ${label.toLocaleLowerCase('fr')}` : label}</button>;
  return <div className="yc-target-levers" aria-label="Leviers pour le profil recherché">
    {target.finish && target.finish !== 'unspecified' && <div><strong>Finale {finishLabels[target.finish].toLocaleLowerCase('fr')}</strong>
      <p>{target.finish === 'dry' ? 'L’atténuation et le moût conditionnent la finale. Vérifie la fin de fermentation.' : 'La densité finale ne mesure ni le sucre résiduel ni la douceur perçue.'}</p>
      {nonfermentables.length > 0 && <p className="yeast-small">Apports déclarés non fermentescibles : {nonfermentables.map(ingredientQuantity).join(', ')}. Leur effet sensoriel reste à valider.</p>}
      {sugars.length > 0 && target.finish === 'sweet' && <p className="yeast-notice">{sugars.map(f => f.name).join(', ')} : un sucre consommé par la culture augmente l’alcool ; il ne garantit pas une finale sucrée.</p>}
      {go('fermentescibles', 'Examiner malts et sucres')}
    </div>}
    {target.accent === 'chocolate' && <div><strong>Chocolat</strong><p>{chocolate.length ? `À examiner dans la recette : ${chocolate.map(ingredientQuantity).join(', ')}.` : 'Aucun malt ou ajout nommé chocolat/cacao/Carafa repéré dans la recette.'}</p>
      <p className="yeast-small">Le nom repère un ingrédient à consulter, pas une intensité. Ni la couleur ni la température de fermentation ne prédisent le goût chocolaté.</p>{go('fermentescibles', 'Choisir les malts / ajouts')}
    </div>}
    {(target.ibu || dry.length > 0 || /am[eè]r/i.test(target.label ?? '')) && <div><strong>Amertume et houblons</strong><p>Les IBU à chaud décrivent le calcul de houblonnage, pas toute l’amertume ressentie.{dry.length > 0 ? ` À cru : ${numeric(dryG) && recipe.volumeL > 0 ? `${format(dryG / recipe.volumeL, 2)} g/L` : 'dose à préciser'}, conservés dans la variante.` : ''}</p>{go('houblons', 'Examiner les houblons')}
    </div>}
    {target.sparkling && <div><strong>Effervescence et sucre</strong><p>Précise si la culture sert en primaire ou en refermentation. Une levure de Champagne ne garantit pas une bière sèche ou sucrée.</p>
      <p className="yeast-notice">Garder du sucre fermentescible puis refermenter exige un procédé de stabilisation maîtrisé. Refroidir seul n’atteste pas la stabilité.</p>{go('paliers', 'Examiner la refermentation')}
    </div>}
  </div>;
}

/** A saved brewing intention and a local, explicitly applied recipe variant. */
export function YeastBeerTargetPanel({ recipe, refs, onChange, onNavigate }: {
  recipe: TrialRecipe; refs: YeastReference[]; onChange: (next: TrialRecipe) => TrialRecipe | void;
  onNavigate?: (destination: YeastRecipeDestination) => void;
}) {
  const id = useId();
  const launcher = useRef<HTMLButtonElement>(null);
  const currentDraft = useMemo(() => createYeastRecipeDraft(recipe, refs), [recipe, refs]);
  const recipeKey = JSON.stringify({ yeast: recipe.yeast, design: recipe.yeastDesign, fermentables: recipe.fermentables, hops: recipe.hops,
    volumeL: recipe.volumeL, ogTarget: recipe.ogTarget, efficiencyPct: recipe.efficiencyPct, boilMin: recipe.boilMin, fermentation: recipe.fermentation });
  const [open, setOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(!currentDraft.beerTarget);
  const [local, setLocal] = useState<{ key: string; target: YeastBeerTarget; variation: YeastBeerVariation; baseKey?: string }>();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [variantOpen, setVariantOpen] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const target = local?.target ?? currentDraft.beerTarget ?? emptyTarget;
  const variation = local?.variation ?? unchangedVariation;
  const draft = useMemo(() => ({ ...currentDraft, beerTarget: target }), [currentDraft, target]);
  const preview = useMemo(() => previewYeastBeerTarget(recipe, draft, refs, variation), [recipe, draft, refs, variation]);
  const stale = !!local && local.key !== recipeKey;
  const patch = (changes: Partial<YeastBeerTarget>) => {
    setLocal({ key: local?.key ?? recipeKey, target: { ...target, ...changes }, variation, baseKey: local?.baseKey ?? preview.baseKey });
    setNotice(''); setError(''); setReasons([]);
  };
  const vary = (changes: Partial<YeastBeerVariation>) => {
    setLocal({ key: local?.key ?? recipeKey, target, variation: { ...variation, ...changes }, baseKey: local?.baseKey ?? preview.baseKey }); setError(''); setNotice(''); setReasons([]);
  };
  const rangeChange = (key: 'abv' | 'ibu', bound: 'min' | 'max', value?: number) => {
    const other = target[key]?.[bound === 'min' ? 'max' : 'min'];
    patch({ [key]: value === undefined && !numeric(other) ? undefined : { min: target[key]?.min ?? NaN, max: target[key]?.max ?? NaN, [bound]: value ?? NaN } });
  };
  const reset = () => { setLocal(undefined); setError(''); setReasons([]); setVariantOpen(false); setNotice('Essai annulé. La recette est inchangée.'); };
  const cancelVariation = () => { setLocal(local ? { ...local, variation: identityVariation() } : undefined); setError(''); setReasons([]); setVariantOpen(false); setNotice('Variations annulées, recette inchangée. La cible reste à confirmer.'); };
  const apply = () => {
    try {
      if (stale) throw Error('La recette a changé pendant cet essai. Reprends ses données avant d’appliquer.');
      const next = applyYeastBeerVariation(recipe, draft, refs, variation, local?.baseKey ?? preview.baseKey);
      onChange(next); setLocal(undefined); setVariantOpen(false); setEditingTarget(false); setOpen(false); setError(''); setReasons([]); setNotice('Cible et variante reprises dans le brouillon. Enregistre la recette pour les conserver.');
      requestAnimationFrame(() => launcher.current?.focus());
    } catch (e) { setError(e instanceof Error ? e.message : 'La variante n’a pas pu être appliquée.'); }
  };
  const prepare = () => {
    try {
      const proposal = prepareYeastBeerVariation(recipe, draft, refs, variation);
      setLocal({ key: recipeKey, target, variation: proposal.variation, baseKey: proposal.preview.baseKey });
      setVariantOpen(true); setEditingTarget(false); setReasons(proposal.reasons); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Précise les données nécessaires.'); }
  };
  const navigate = (destination: YeastRecipeDestination) => {
    try {
      if (local) {
        if (stale) throw Error('La recette a changé. Reprends ses données avant de conserver la cible.');
        onChange(applyYeastBeerVariation(recipe, draft, refs, identityVariation(), local.baseKey));
        setLocal(undefined); setVariantOpen(false);
      }
      onNavigate?.(destination);
    } catch (e) { setError(e instanceof Error ? e.message : 'La cible n’a pas pu être conservée.'); }
  };
  const changedAmounts = variation.fermentableScale !== 1 || variation.hotHopScale !== 1 || variation.attenuationPct !== undefined;
  const showVariant = variantOpen || changedAmounts;
  const showAlcohol = !!target.abv || variation.fermentableScale !== 1 || variation.attenuationPct !== undefined;
  const showIbu = !!target.ibu || variation.fermentableScale !== 1 || variation.hotHopScale !== 1;
  const ibuRange = (value: number | null | undefined) => numeric(value) ? { min: value, max: value } : undefined;
  const hasTarget = !!targetSummary(currentDraft.beerTarget) || !!currentDraft.beerTarget?.abv || !!currentDraft.beerTarget?.ibu;
  const warnings = [...new Set(preview.warnings)].filter(warning => !/^(Finale souhaitée|Accent chocolat|Effervescence) :/.test(warning));
  const rangeInvalid = (key: 'abv' | 'ibu') => !!target[key] && (!numeric(target[key]!.min) || !numeric(target[key]!.max) || target[key]!.min < 0 || target[key]!.min > target[key]!.max || key === 'abv' && target[key]!.max > 100);
  const exampleKey = Object.entries(examples).find(([, sample]) => sample.label === target.label && sample.finish === target.finish && sample.accent === target.accent && sample.sparkling === target.sparkling)?.[0] ?? '';
  return <section className="yc-beer-target" aria-label="Cible de la bière">
    <div className="yc-projection-title"><h4>Ce que je veux obtenir</h4><button ref={launcher} type="button" aria-expanded={open} aria-controls={`${id}-body`} onClick={() => setOpen(v => !v)}>{open ? 'Replier la cible' : local ? 'Reprendre mon essai' : hasTarget ? 'Ajuster ma cible' : 'Définir ma cible'}</button></div>
    {!open && local && <p className="yeast-small">Essai non appliqué · {targetSummary(local.target) || 'cible personnelle'}</p>}
    {!open && hasTarget && <p className="yc-target-summary">{targetSummary(currentDraft.beerTarget)}{currentDraft.beerTarget?.abv ? ` · ${rangeText(currentDraft.beerTarget.abv)} % vol visés` : ''}{currentDraft.beerTarget?.ibu ? ` · ${rangeText(currentDraft.beerTarget.ibu)} IBU à chaud visés` : ''}</p>}
    <div id={`${id}-body`} hidden={!open}>
      {!editingTarget && <div className="yc-projection-title"><p className="yc-target-summary">{targetSummary(target) || 'Ma cible chiffrée'}</p><button type="button" className="yeast-link" onClick={() => setEditingTarget(true)}>Modifier la cible</button></div>}
      <div hidden={!editingTarget} className="yc-target-editor">
      <div className="yc-target-example"><label htmlFor={`${id}-example`}>Point de départ</label><select id={`${id}-example`} value={exampleKey} onChange={e => { const selected = examples[e.target.value] ?? {}; setLocal({ key: recipeKey, target: { ...selected }, variation: identityVariation(), baseKey: preview.baseKey }); setVariantOpen(false); setReasons([]); setError(''); }}>
        <option value="">Cible personnelle</option><option value="champagne">Champagne sucrée</option><option value="stout">Stout amère et chocolatée</option><option value="session">Session NEIPA douce et légère</option>
      </select></div>
      <label className="yc-target-name" htmlFor={`${id}-label`}>Ma cible<Input id={`${id}-label`} value={target.label ?? ''} onChange={e => patch({ label: e.target.value })} placeholder="Décris la bière que tu veux" /></label>
      <div className="yc-target-numbers">
        {([{ key: 'abv', name: 'Alcool', unit: '% vol' }, { key: 'ibu', name: 'IBU à chaud', unit: 'IBU' }] as const).map(field => <div className="yc-target-bound-row" key={field.key}>
          <span>{field.name}</span><NumberInput aria-label={`${field.name} cible minimum`} aria-invalid={rangeInvalid(field.key)} value={numeric(target[field.key]?.min) ? target[field.key]!.min : undefined} emptyValue={undefined} onValue={n => rangeChange(field.key, 'min', n)} placeholder="min" /><span>–</span><NumberInput aria-label={`${field.name} cible maximum`} aria-invalid={rangeInvalid(field.key)} value={numeric(target[field.key]?.max) ? target[field.key]!.max : undefined} emptyValue={undefined} onValue={n => rangeChange(field.key, 'max', n)} placeholder="max" /><span>{field.unit}</span>
        </div>)}
      </div>
      <p className="yeast-small">Plages facultatives, choisies par toi. « Douce » et « légère » ne fixent aucun chiffre automatiquement.</p>
      <div className="yc-target-sensory"><label>Finale recherchée<select aria-label="Finale recherchée" value={target.finish ?? 'unspecified'} onChange={e => patch({ finish: e.target.value as YeastBeerTarget['finish'] })}>{Object.entries(finishLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Accent recherché<select aria-label="Accent recherché" value={target.accent ?? 'none'} onChange={e => patch({ accent: e.target.value as YeastBeerTarget['accent'] })}><option value="none">Libre</option><option value="chocolate">Chocolat</option></select></label></div>
      <label className="yeast-check"><input type="checkbox" checked={target.sparkling ?? false} onChange={e => patch({ sparkling: e.target.checked })} />Effervescence marquée recherchée</label>
      </div>
      {(showAlcohol || showIbu) && <div className="yc-target-gauges" aria-label="Recette et variante face à la cible">
        {showAlcohol && <TargetRange label="Alcool estimé" unit="% vol" target={target.abv} current={preview.current.projection.abv.range} variant={preview.errors.length ? null : preview.variant.projection.abv.range} showVariant={showVariant} invalidVariant={showVariant && preview.errors.length > 0} />}
        {showIbu && <TargetRange label="Amertume calculée à chaud" unit="IBU" target={target.ibu} current={ibuRange(preview.current.ibu.total)} variant={preview.errors.length ? null : ibuRange(preview.variant.ibu.total)} showVariant={showVariant} invalidVariant={showVariant && preview.errors.length > 0} />}
      </div>}
      {!preview.variant.projection.abv.range && <p className="yeast-notice">{preview.variant.projection.abv.reasons[0]}</p>}
      {!variantOpen ? <SensoryLevers target={target} recipe={recipe} onNavigate={onNavigate ? navigate : undefined} saveTarget={!!local} /> : <details><summary>Leviers sensoriels · à valider au brassin<ChevronDown size={14} aria-hidden="true" /></summary><SensoryLevers target={target} recipe={recipe} onNavigate={onNavigate ? navigate : undefined} saveTarget={!!local} />{local && <p className="yeast-small">Ces liens conservent la cible seule ; les quantités de la variante ne sont pas appliquées.</p>}</details>}
      {variantOpen && target.sparkling && target.finish === 'sweet' && <p className="yeast-notice">Sucre résiduel et refermentation : stabilité à confirmer avant conditionnement. Refroidir seul ne suffit pas.</p>}
      {stale && <p className="yeast-notice" role="alert">La recette a changé pendant cet essai. <button type="button" onClick={reset}>Reprendre les données actuelles</button></p>}
      <div className="yc-actions"><button type="button" disabled={stale || !target.abv && !target.ibu || preview.errors.length > 0} onClick={prepare}>Préparer une variante chiffrée</button><button type="button" className="yeast-link" aria-expanded={variantOpen} onClick={() => { setVariantOpen(v => !v); if (!variantOpen) setEditingTarget(false); }}>{variantOpen ? 'Replier les variations' : 'Essayer mes réglages'}</button></div>
      <div hidden={!variantOpen} className="yc-target-variation" aria-label="Variations de recette">
        <p className="yeast-small">Même volume et rendement. Échelles de quantités, pas des curseurs de goût.</p>
        {([{ key: 'fermentableScale', label: 'Tous les fermentescibles', max: 200 }, { key: 'hotHopScale', label: 'Houblons à chaud', max: 300 }] as const).map(control => {
          const pct = variation[control.key] * 100, valid = numeric(pct) && (control.key === 'fermentableScale' ? pct > 0 : pct >= 0);
          return <div className="yc-variation-control" key={control.key}>
            <label htmlFor={`${id}-${control.key}`}>{control.label}</label><div><input id={`${id}-${control.key}`} aria-label={`${control.label}, variation en pourcent`} type="range" disabled={!valid} min={control.key === 'fermentableScale' ? Math.min(1, valid ? pct : 1) : 0} max={Math.max(control.max, valid ? pct : 100)} step="any" value={valid ? pct : 100} onChange={e => vary({ [control.key]: Number(e.target.value) / 100 })} /><PercentInput label={`${control.label}, pourcentage exact`} invalid={!valid} value={numeric(pct) ? pct : undefined} onValue={n => vary({ [control.key]: numeric(n) ? n / 100 : NaN })} /><span>%</span></div>
            {!valid && <p className="yeast-error">{control.key === 'fermentableScale' ? 'Pourcentage positif requis.' : 'Pourcentage positif ou nul requis.'}</p>}
          </div>;
        })}
        <div className="yc-target-bound-row"><label htmlFor={`${id}-att`}>Atténuation sur ce moût</label><NumberInput id={`${id}-att`} aria-label="Hypothèse d’atténuation de la variante" aria-invalid={variation.attenuationPct !== undefined && (!numeric(variation.attenuationPct) || variation.attenuationPct < 0 || variation.attenuationPct > 100)} value={variation.attenuationPct} emptyValue={undefined} onValue={n => vary({ attenuationPct: n })} placeholder="Base" /><span>%</span></div>
        <p className="yeast-small">Saisir l’atténuation crée une hypothèse de recette ; cela ne commande pas la levure. Vide : conserver la base actuelle.</p>
        <p className="yc-number">DF : {rangeText(preview.current.projection.fg.range, 3)} → {preview.errors.length ? 'À corriger' : rangeText(preview.variant.projection.fg.range, 3)} SG</p>
        <p className="yeast-small">Les ajouts à cru restent inchangés. Réduire l’extrait peut réduire la matière en bouche ; aucune douceur garantie.</p>
      </div>
      {reasons.length > 0 && <ul className="yc-target-reasons">{reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>}
      {warnings.length > 0 && <ul className="yc-alerts">{warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>}
      {preview.changes.length > 0 && changedAmounts && <details className="yc-diff"><summary>Quantités et hypothèses modifiées · {preview.changes.length}<ChevronDown size={14} aria-hidden="true" /></summary><table><thead><tr><th>Élément</th><th>Recette</th><th>Variante</th></tr></thead><tbody>{preview.changes.map((change, i) => <tr key={i}><th scope="row">{change.label}</th><td>{change.before}</td><td>{change.after}</td></tr>)}</tbody></table></details>}
      {preview.errors.map(message => <p key={message} className="yeast-error" role="alert">{message}</p>)}
      {error && <p className="yeast-error" role="alert">{error}</p>}
      <div className="yc-actions"><button type="button" className="yc-apply" disabled={!local || stale || preview.errors.length > 0} onClick={apply}>{changedAmounts ? 'Appliquer cible et variante' : 'Conserver cette cible'}</button>{local && <button type="button" onClick={cancelVariation}>Annuler la variante</button>}</div>
      <details><summary>Hypothèses du calcul<ChevronDown size={14} aria-hidden="true" /></summary>{preview.basis.map(reason => <p className="yeast-small" key={reason}>{reason}</p>)}<p className="yeast-small">Aucune cible sensorielle n’est certifiée par ces nombres. Le procédé de conditionnement et une analyse de la bière restent distincts de la prévision de recette.</p></details>
    </div>
    {notice && <p className="yeast-small" role="status">{notice}</p>}
  </section>;
}
