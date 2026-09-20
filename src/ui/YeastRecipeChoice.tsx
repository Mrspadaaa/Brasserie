import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import {
  applyYeastRecipeDesign, createYeastRecipeDraft, evaluateYeastRecipeDesign, yeastRecipeCandidates, inferYeastRecipeStyle,
  YEAST_STYLE_FAMILIES, type YeastRecipeGoal, type YeastStyleId, type YeastRecipeCandidate,
} from '../domain/yeastRecipeDesign';
import { yeastReferences } from '../domain/yeastReferences';
import { yeastStrainInformation } from '../domain/yeastStrainInformation';
import { useStorageValue } from '../hooks/useLiveData';
import { StorageService } from '../services/storage';
import { YeastCandidatePicker } from './YeastCandidatePicker';
import { YeastRecipeWorkbench, type YeastRecipeDestination } from './YeastRecipeWorkbench';
import { YeastStrainDetails } from './YeastStrainDetails';
import { YeastRecipePlan, YeastProjectionReading, projectionRange, yeastWarningsForReading } from './YeastRecipePlan';
import { YeastBeerTargetPanel } from './YeastBeerTargetPanel';
import './yeast-choice.css';

/** Creation-only composition. Browsing and local proposals never mutate saved recipes. */
export function YeastRecipeChoice({ recipe, onChange, onNavigate, quantityEditor, identityEditor, factsEditor, programEditor, initialGoal, initialYeastId }: {
  recipe: TrialRecipe; onChange: (next: TrialRecipe) => TrialRecipe | void;
  onNavigate?: (destination: YeastRecipeDestination) => void; quantityEditor: ReactNode;
  identityEditor?: ReactNode; factsEditor?: ReactNode; programEditor?: ReactNode;
  initialGoal?: YeastRecipeGoal; initialYeastId?: string;
}) {
  const saved = useStorageValue(StorageService.getHopKnowledge);
  const refs = useMemo(() => yeastReferences(saved), [saved]);
  const currentDraft = useMemo(() => createYeastRecipeDraft(recipe, refs), [recipe, refs]);
  const current = useMemo(() => evaluateYeastRecipeDesign(recipe, currentDraft, refs), [recipe, currentDraft, refs]);
  const [styleId, setStyleId] = useState<YeastStyleId>(currentDraft.styleId);
  const [goal, setGoal] = useState<YeastRecipeGoal>(initialGoal ?? currentDraft.goal);
  const [catalogueOpen, setCatalogueOpen] = useState(!recipe.yeast.name && !initialYeastId);
  const [catalogueVisited, setCatalogueVisited] = useState(catalogueOpen);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [consumedInitial, setConsumedInitial] = useState(false);
  const invalidQuantity = recipe.yeast.qty != null && (!Number.isFinite(recipe.yeast.qty) || recipe.yeast.qty <= 0);
  const [pitchOpen, setPitchOpen] = useState(invalidQuantity);
  useEffect(() => { if (invalidQuantity) setPitchOpen(true); }, [invalidQuantity]);
  const heading = useRef<HTMLHeadingElement>(null);
  const catalogue = useRef<HTMLElement>(null);
  const showCatalogue = () => {
    setCatalogueVisited(true);
    setCatalogueOpen(true);
    requestAnimationFrame(() => { catalogue.current?.focus({ preventScroll: true }); catalogue.current?.scrollIntoView({ block: 'start' }); });
  };
  const id = useId();
  const candidates = useMemo(() => catalogueVisited
    ? yeastRecipeCandidates(styleId, goal, refs, recipe.volumeL, { includeOtherStyles: true }) : [],
  [catalogueVisited, styleId, goal, refs, recipe.volumeL]);
  const choose = (yeastId: string, form?: YeastRecipeCandidate['form']) => {
    try {
      const draft = createYeastRecipeDraft(recipe, refs, styleId, yeastId);
      onChange(applyYeastRecipeDesign(recipe, { ...draft, goal, form, formYeastId: yeastId }, refs, 'strain'));
      setCatalogueOpen(false); setConsumedInitial(true); setError('');
      setNotice('Levure choisie.');
      requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: 'start' }); });
    } catch (e) { setError(e instanceof Error ? e.message : 'Le choix n’a pas pu être appliqué.'); }
  };
  const selected = current.candidate, dossier = current.projection?.dossier;
  const temperature = dossier?.temperature;
  const attenuation = dossier?.documentedAttenuation ?? (recipe.yeast.attenuationBasis === 'declared' ? dossier?.attenuation : undefined);
  const recipeStyle = inferYeastRecipeStyle(recipe);
  const warnings = yeastWarningsForReading(current).filter(text => !text.startsWith('Quantité de levure sèche à renseigner') && !text.startsWith('Style non reconnu'));
  const quantityKnown = !invalidQuantity && recipe.yeast.qty != null && !!recipe.yeast.unit;
  if (recipe.nolo?.enabled) return <><YeastRecipeWorkbench recipe={recipe} onChange={onChange} onNavigate={onNavigate} />{quantityEditor}{identityEditor}{factsEditor}</>;
  const fieldRange = (value: typeof temperature, unit: string) => value ? `${value.qualifier === 'atLeast' ? '≥ ' : value.qualifier === 'upTo' ? '≤ ' : ''}${value.range.min.toLocaleString('fr-FR', { maximumFractionDigits: 20 })}${value.range.min === value.range.max ? '' : `–${value.range.max.toLocaleString('fr-FR', { maximumFractionDigits: 20 })}`} ${unit}` : 'Non documenté';
  return <div className="yeast-workbench yeast-choice" aria-label="Choisir la levure de la recette">
    <section className="yc-current" aria-label="Levure choisie dans la recette">
      <div className="yc-current-heading"><h3 tabIndex={-1} ref={heading}>{recipe.yeast.name || 'Choisir une levure'}</h3>
        {recipe.yeast.name && <span className="yc-tag"><Check size={12} aria-hidden="true" /> Recette</span>}</div>
      {recipe.yeast.name && <p className="yeast-small">{selected?.lab || recipe.yeast.lab || 'Laboratoire à préciser'}{recipe.yeast.strain ? ` · ${recipe.yeast.strain}` : ''} · {recipe.yeast.form || 'forme à préciser'}</p>}
      <div className="yc-actions"><button type="button" aria-expanded={catalogueOpen} aria-controls={`${id}-catalogue`} onClick={() => catalogueOpen ? setCatalogueOpen(false) : showCatalogue()}>{catalogueOpen ? 'Fermer le choix' : recipe.yeast.name ? 'Changer / comparer' : 'Catalogue, stock ou saisie libre'}</button></div>
      {recipe.yeast.name && <>
        <YeastProjectionReading result={current} />
        {warnings.length > 0 && <ul className="yc-alerts" aria-label="Points à vérifier pour la levure choisie">{warnings.map(text => <li key={text}>{text}</li>)}</ul>}
        {current.errors.map(text => <p className="yeast-error" role="alert" key={text}>{text} Ouvre « Régler / simuler » pour corriger.</p>)}
      </>}
      {notice && <p role="status" className="yeast-small">{notice}</p>}
    </section>
    <section hidden={!catalogueOpen} ref={catalogue} tabIndex={-1} id={`${id}-catalogue`} aria-label="Catalogue pour choisir une levure" className="yc-catalogue">
      {catalogueVisited && <>
      {identityEditor && <div className="yc-personal"><h4>Mon stock ou une autre souche</h4>{identityEditor}</div>}
      {!selected && recipe.yeast.name && <p className="yeast-small">Choix personnel conservé : <strong>{recipe.yeast.name}</strong>. Le catalogue n’est pas nécessaire pour simuler cette recette.</p>}
      <div className="yeast-filter"><label htmlFor={`${id}-style`}>Famille</label><select id={`${id}-style`} aria-label="Filtrer les levures par style" value={styleId} onChange={e => setStyleId(e.target.value as YeastStyleId)}>{YEAST_STYLE_FAMILIES.map(style => <option key={style.id} value={style.id}>{style.id === 'unknown' ? 'Tous · choix libre' : style.label}</option>)}</select></div>
      {styleId !== 'unknown' && styleId !== recipeStyle && <p className="yeast-small">Famille de comparaison distincte du style de la recette : {recipe.style || 'à préciser'}.</p>}
      <YeastCandidatePicker candidates={candidates} styleId={styleId} selectedId={currentDraft.yeastId} onSelect={choose} recipeChoice={{ volumeL: recipe.volumeL, onChoose: choose }} />
      {error && <p role="alert" className="yeast-error">{error}</p>}
      </>}
    </section>
    {recipe.yeast.name && <>
      <YeastBeerTargetPanel recipe={recipe} refs={refs} onChange={onChange} onNavigate={onNavigate} />
      <YeastRecipePlan key={currentDraft.yeastId || recipe.yeast.name} recipe={recipe} refs={refs} onChange={onChange} onGoal={setGoal} onCompare={showCatalogue} initialGoal={consumedInitial ? undefined : initialGoal} initialYeastId={consumedInitial ? undefined : initialYeastId} />
      <details className="yc-pitch" open={pitchOpen} onToggle={e => setPitchOpen(e.currentTarget.open)}><summary><span>Ensemencement <span className={quantityKnown ? 'yeast-small' : 'yeast-notice'}>· {quantityKnown ? `${recipe.yeast.qty!.toLocaleString('fr-FR', { maximumFractionDigits: 20 })} ${recipe.yeast.unit}` : 'quantité à renseigner'}</span></span><ChevronDown size={14} aria-hidden="true" /></summary>
        <div className="yc-quantity">{quantityEditor}</div>
        {recipe.yeast.form === 'sèche' && current.doseG && <p className="yeast-small">Repère pour {recipe.volumeL.toLocaleString('fr-FR')} L : <span className="yc-number">{projectionRange(current.doseG.range, 1)} g</span>{recipe.yeast.unit !== 'g' ? ' · masse du conditionnement à vérifier.' : '.'}</p>}
      </details>
    </>}
    <details className="yc-dossier" aria-label="Dossier de la levure"><summary>Fiche, sources et données de la souche<ChevronDown size={14} aria-hidden="true" /></summary><div>
      {selected && <p className="yc-selected-profile">{selected.descriptor}</p>}
      {recipeStyle === 'unknown' && <p className="yeast-small">Style libre : {recipe.style || 'non précisé'}. Le catalogue permet une comparaison toutes familles.</p>}
      <dl className="yc-facts"><div><dt>Fermentation · fiche</dt><dd>{fieldRange(temperature, '°C')}</dd></div><div><dt>Atténuation · fiche</dt><dd>{fieldRange(attenuation, '%')}</dd></div></dl>
      {factsEditor}
      <YeastStrainDetails information={yeastStrainInformation(selected?.reference, recipe.yeast.form)} />
      {programEditor && <details><summary>Programme détaillé et guides enregistrés<ChevronDown size={14} aria-hidden="true" /></summary><div>{programEditor}</div></details>}
    </div></details>
  </div>;
}
