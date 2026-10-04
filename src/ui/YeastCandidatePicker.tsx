import { useEffect, useId, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { YEAST_STYLE_FAMILIES, type YeastRecipeCandidate, type YeastStyleId } from '../domain/yeastRecipeDesign';
import { normalizedYeastText, yeastSearchIndex, yeastSearchScore } from '../domain/yeastCatalogue';
import { SegmentedControl } from './SegmentedControl';
import { Input } from './Input';
import { YeastChoiceResults } from './YeastChoiceComparison';

/** Candidate sheets, shared pitching context and explicit compare requests pass unchanged to the side by side. */
type SheetProps = Pick<ComponentProps<typeof YeastChoiceResults>, 'sheetYeast' | 'sheetRevision' | 'renderSheet' | 'referenceDossier' | 'referenceYeast' | 'onEditReference' | 'compareRequest'
  | 'supply' | 'comparisonWort' | 'comparisonRecipeContext' | 'recipeProductCopy' | 'recipeOfferCopy'>;

const PAGE_SIZE = 6;
type Scope = 'style' | 'catalogue';
const FORM_FILTERS: Record<string, string> = { 'sèche': 'sèches', liquide: 'liquides', levain: 'levains', unknown: 'forme à préciser' };
const format = (value: { range: { min: number; max: number } } | null | undefined, unit: string) => value
  ? `${value.range.min.toLocaleString('fr-FR')}${value.range.max === value.range.min ? '' : `–${value.range.max.toLocaleString('fr-FR')}`} ${unit}` : '—';
const preview = (description: string) => description.replace(/ \((?:Description qualitative du fabricant|Descripteurs qualitatifs du fabricant)[^)]*\)\.?$/, '');
const documentedFirst = (candidate: YeastRecipeCandidate) => candidate.styleMatch === 'documented' ? 1 : 0;
const documentedFacts = (candidate: YeastRecipeCandidate) => candidate.reference.catalogue?.facts?.length ?? 0;

/** One search contract for direct choice and comparison. Browsing starts in the documented family;
 * a query searches the whole catalogue unless the brewer explicitly keeps that family. */
export function YeastCandidatePicker({ candidates, styleId, selectedId, onSelect, recipeChoice, filters, collapsed = false, onActivate, onExpand, onCollapse, resetRequest, placeholder, searchLabel = 'Rechercher une levure' }: {
  candidates: YeastRecipeCandidate[]; styleId: YeastStyleId; selectedId: string; onSelect: (id: string) => void;
  recipeChoice?: { volumeL: number; onChoose: (id: string, form?: YeastRecipeCandidate['form']) => void; trialId?: string;
    /** Local conduct trial, offered only in the side by side. */
    onTry?: (id: string, form?: YeastRecipeCandidate['form']) => void;
    draftReference?: { label: string; lab?: string; form?: string } } & SheetProps;
  /** Further explicit filters (e.g. the style family), shown with laboratory and form. */
  filters?: ReactNode;
  /** The search field stays visible; results appear with the first letter or on « Parcourir ». */
  collapsed?: boolean;
  /** First focus or letter: lets the parent load the catalogue without moving the focus. */
  onActivate?: () => void;
  onExpand?: () => void;
  /** Where the list can fold back to the field alone (a strain is already chosen). */
  onCollapse?: () => void;
  /** Incremented by the parent after a choice: the query is cleared, the comparison is kept. */
  resetRequest?: number;
  placeholder?: string; searchLabel?: string;
}) {
  const uid = useId();
  // Unset follows the query: documented family while browsing, whole catalogue while searching.
  const [scopeChoice, setScopeChoice] = useState<Scope>();
  const [query, setQuery] = useState('');
  const [lab, setLab] = useState('');
  const [form, setForm] = useState('');
  const [page, setPage] = useState(0);
  const [browseAll, setBrowseAll] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => { setLab(''); setScopeChoice(undefined); setPage(0); }, [styleId]);
  useEffect(() => { if (resetRequest) { setQuery(''); setPage(0); setBrowseAll(false); } }, [resetRequest]);
  const normalizedQuery = normalizedYeastText(query);
  const scope: Scope = styleId === 'unknown' ? 'catalogue' : scopeChoice ?? (normalizedQuery ? 'catalogue' : 'style');
  const wholeCatalogue = scope === 'catalogue';
  const matching = useMemo(() => candidates.filter(c => c.styleMatch === 'documented'), [candidates]);
  const pool = wholeCatalogue ? candidates : matching;
  const labs = useMemo(() => [...new Set(pool.map(c => c.lab))].sort((a, b) => a.localeCompare(b, 'fr')), [pool]);
  const indexes = useMemo(() => new Map(candidates.map(c => [c.yeastId,
    yeastSearchIndex(c.reference, { names: [c.label], makers: [c.lab], descriptive: [c.descriptor] })])), [candidates]);
  const scores = useMemo(() => normalizedQuery
    ? new Map(candidates.map(c => [c.yeastId, yeastSearchScore(indexes.get(c.yeastId)!, normalizedQuery)])) : undefined,
  [candidates, indexes, normalizedQuery]);
  const filtered = useMemo(() => {
    const kept = pool.filter(c => (!lab || c.lab === lab) && (!form || (form === 'unknown' ? !c.reference.form : c.reference.form === form))
      && (!scores || scores.get(c.yeastId)! > 0));
    // Relevance first; among equals, a use documented for this family, then the richer sheet.
    // Homonyms stay distinct rows; the stable sort keeps the catalogue order otherwise.
    return scores ? kept.sort((a, b) => scores.get(b.yeastId)! - scores.get(a.yeastId)!
      || documentedFirst(b) - documentedFirst(a) || documentedFacts(b) - documentedFacts(a)) : kept;
  }, [pool, lab, form, scores]);
  const matchCount = useMemo(() => scores ? candidates.filter(c => scores.get(c.yeastId)! > 0).length : 0, [candidates, scores]);
  const hiddenByFilters = scores ? matchCount - filtered.length : 0;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  // With no identified style or query, the first alphabetical page is not a
  // useful recommendation among the whole catalogue. Let the brewer search or
  // explicitly browse it; neither action changes the recipe.
  const searchFirst = styleId === 'unknown' && !browseAll && !normalizedQuery && !lab && !form;
  // With a strain already chosen, the field alone stays in view until the brewer types or browses.
  const listHidden = collapsed && !normalizedQuery;
  const shown = searchFirst || listHidden ? [] : filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const selected = candidates.find(c => c.yeastId === selectedId);
  // The current strain is the comparison reference, not an alternative: when the query finds it
  // but filters hide it, say so instead of reporting an empty catalogue.
  const referenceMatches = !!selected && !!scores && scores.get(selectedId)! > 0;
  const referenceOwner = recipeChoice ? 'du brouillon' : 'de l’essai';
  const styleLabel = YEAST_STYLE_FAMILIES.find(style => style.id === styleId)?.label ?? 'la famille sélectionnée';
  const showSelected = () => {
    const inStyle = selected?.styleMatch === 'documented';
    setQuery(''); setLab(''); setForm(''); setScopeChoice(inStyle ? 'style' : 'catalogue'); setBrowseAll(true);
    const rows = inStyle ? matching : candidates;
    setPage(Math.max(0, Math.floor(rows.findIndex(c => c.yeastId === selectedId) / PAGE_SIZE)));
  };
  const clearFilters = () => { setLab(''); setForm(''); setScopeChoice(undefined); setPage(0); };
  const activeFilters = [wholeCatalogue ? '' : `usage documenté · ${styleLabel}`, lab, form ? FORM_FILTERS[form] : ''].filter(Boolean);
  const plural = (count: number) => count > 1 ? 's' : '';
  const searchControls = <div className="yc-search" data-collapsed={listHidden || undefined}>
    <label className="sr-only" htmlFor={`${uid}-search`}>{searchLabel}</label>
    <Input id={`${uid}-search`} className="yeast-picker-search" aria-label={searchLabel} type="search" value={query} placeholder={placeholder ?? 'Nom, code, fabricant, arôme…'}
      onFocus={() => onActivate?.()} onChange={e => { onActivate?.(); setQuery(e.target.value); setPage(0); }} />
    {listHidden ? onExpand && <p className="yc-search-more"><button type="button" className="yeast-link" onClick={() => { onActivate?.(); onExpand(); }}>Parcourir le catalogue</button></p> : <>
    <details className="yc-filters" open={filtersOpen} onToggle={e => setFiltersOpen(e.currentTarget.open)}>
      <summary>Filtres{activeFilters.length ? ` · ${activeFilters.join(' · ')}` : ''}<ChevronDown size={14} aria-hidden="true" /></summary>
      <div>
        {filters}
        {styleId !== 'unknown' && <SegmentedControl className="yeast-catalogue-scope" label="Étendue de la recherche de levure" value={scope}
          onChange={value => { setScopeChoice(value); setPage(0); setLab(''); }} options={[
            { value: 'style', label: `Style documenté · ${matching.length}` },
            { value: 'catalogue', label: `Tout le catalogue · ${candidates.length.toLocaleString('fr-FR')}` },
          ]} />}
        <div className="yeast-picker-filters">
          <label className="sr-only" htmlFor={`${uid}-lab`}>Laboratoire à comparer</label>
          <select id={`${uid}-lab`} value={lab} onChange={e => { setLab(e.target.value); setPage(0); }}>
            <option value="">Tous les labos</option>{labs.map(l => <option key={l}>{l}</option>)}
          </select>
          <label className="sr-only" htmlFor={`${uid}-form`}>Forme à comparer</label>
          <select id={`${uid}-form`} value={form} onChange={e => { setForm(e.target.value); setPage(0); }}>
            <option value="">Toute forme</option><option value="sèche">Sèches</option><option value="liquide">Liquides</option><option value="levain">Levains</option><option value="unknown">À préciser</option>
          </select>
        </div>
      </div>
    </details>
    {/* The field's placeholder already says what can be searched; browsing stays one touch away. */}
    {searchFirst ? <p className="yc-search-first"><button type="button" className="yeast-link" onClick={() => setBrowseAll(true)}>Parcourir les {filtered.length.toLocaleString('fr-FR')} références</button></p>
      : <p className="yeast-small" role="status">{filtered.length.toLocaleString('fr-FR')} {normalizedQuery ? `résultat${plural(filtered.length)}` : `référence${plural(filtered.length)}`}
        {wholeCatalogue ? ' · tout le catalogue' : ` · usage documenté pour ${styleLabel}`}.
        {hiddenByFilters > 0 && <> {hiddenByFilters.toLocaleString('fr-FR')} autre{plural(hiddenByFilters)} masquée{plural(hiddenByFilters)} par les filtres. <button type="button" className="yeast-link" onClick={clearFilters}>Tout afficher</button></>}
        {!hiddenByFilters && (lab || form || scopeChoice) && <> <button type="button" className="yeast-link" onClick={clearFilters}>Effacer les filtres</button></>}
      </p>}
    {onCollapse && <button type="button" className="yeast-link yc-search-close" onClick={() => { setQuery(''); setPage(0); setBrowseAll(false); onCollapse(); }}>Fermer la recherche</button>}
    </>}
  </div>;
  const emptyState = !searchFirst && !listHidden && !filtered.length && <p className="yeast-small">{referenceMatches
    ? <>Aucune autre levure ne correspond ici. <strong>{selected!.label}</strong> est la levure {referenceOwner} : elle reste la référence de comparaison.</>
    : hiddenByFilters ? 'Aucun résultat avec ces filtres.'
      : normalizedQuery ? `Aucune référence ne correspond à « ${query.trim()} ». Vérifie l’orthographe ou saisis ta souche hors catalogue.`
        : <>Aucune référence avec ces filtres.{!wholeCatalogue && <> <button type="button" className="yeast-link" onClick={() => { setScopeChoice('catalogue'); setLab(''); setPage(0); }}>Chercher dans tout le catalogue</button></>}</>}
  </p>;
  const pagination = !searchFirst && !listHidden && pageCount > 1 && <nav className="yeast-picker-pages" aria-label="Pages des références de levure">
    <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Précédentes</button>
    <span className="yeast-small">{currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} / {filtered.length}</span>
    <button type="button" disabled={currentPage === pageCount - 1} onClick={() => setPage(currentPage + 1)}>Suivantes</button>
  </nav>;
  const referenceLine = !listHidden && selected && !shown.some(c => c.yeastId === selectedId) && !(referenceMatches && !filtered.length)
    && <p className="yeast-small">{recipeChoice ? `Levure du brouillon : ${selected.label} · référence de comparaison` : `Scénario conservé : ${selected.label}`}. <button type="button" className="yeast-link" onClick={showSelected}>Afficher sa ligne</button></p>;
  const cultureNote = wholeCatalogue && shown.some(c => c.evidence.culture && c.evidence.culture !== 'yeast')
    && <p className="yeast-small">Le catalogue comprend aussi mélanges, bactéries et autres usages. Leur présence ne valide pas une fermentation de bière.</p>;
  return <div className="yeast-picker">
    {recipeChoice && <YeastChoiceResults candidates={candidates} shown={shown} selectedId={selectedId}
      controls={searchControls} afterList={<>{emptyState}{pagination}{referenceLine}{cultureNote}</>} selectionContext="recipe"
      styleLabel={styleId === 'unknown' ? null : styleLabel} trialId={recipeChoice.trialId} draftReference={recipeChoice.draftReference} onChoose={recipeChoice.onChoose} onTry={recipeChoice.onTry}
      sheetYeast={recipeChoice.sheetYeast} sheetRevision={recipeChoice.sheetRevision} renderSheet={recipeChoice.renderSheet} referenceDossier={recipeChoice.referenceDossier}
      referenceYeast={recipeChoice.referenceYeast} onEditReference={recipeChoice.onEditReference} compareRequest={recipeChoice.compareRequest}
      supply={recipeChoice.supply} comparisonWort={recipeChoice.comparisonWort} comparisonRecipeContext={recipeChoice.comparisonRecipeContext}
      recipeProductCopy={recipeChoice.recipeProductCopy} recipeOfferCopy={recipeChoice.recipeOfferCopy} />}
    {!recipeChoice && <>
      {searchControls}
      {filtered.length > 0 && <div className="yeast-candidate-list"><table className="yeast-candidates">
        <caption>Potentiel décrit par le fabricant · aucun classement d’intensité</caption>
        <thead><tr><th scope="col">Souche et caractère</th><th scope="col">Fermentation<br />Atténuation</th></tr></thead>
        <tbody>{shown.map(candidate => <tr key={candidate.yeastId} data-selected={candidate.yeastId === selectedId}>
          <td><label><input type="radio" name={`${uid}-strain`} aria-label={`Comparer ${candidate.label}`} checked={candidate.yeastId === selectedId} onChange={() => onSelect(candidate.yeastId)} />
            <span><span className="yeast-candidate-name">{candidate.label}</span><span className="yeast-candidate-meta">{candidate.lab} · {candidate.reference.form ?? 'forme à préciser'}</span></span></label>
            <span className="yeast-candidate-aroma">{preview(candidate.descriptor)}</span>
            {wholeCatalogue && <span className="yeast-candidate-meta">{candidate.styleMatch === 'documented' ? 'Usage documenté pour ce style' : candidate.styleMatch === 'excluded' ? 'Usage déconseillé dans une source' : 'Style à confirmer'}</span>}
          </td>
          <td className="font-mono tabular-nums"><span>{format(candidate.temperature, '°C')}</span><span className="block">{format(candidate.attenuation, '%')}</span></td>
        </tr>)}</tbody>
      </table></div>}
      {emptyState}{pagination}{referenceLine}{cultureNote}
    </>}
  </div>;
}
