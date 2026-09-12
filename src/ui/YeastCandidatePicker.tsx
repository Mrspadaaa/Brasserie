import { useId, useMemo, useState } from 'react';
import type { YeastRecipeCandidate, YeastStyleId } from '../domain/yeastRecipeDesign';
import { normalizedYeastText } from '../domain/yeastCatalogue';
import { SegmentedControl } from './SegmentedControl';
import { Input } from './Input';

const PAGE_SIZE = 6;
const format = (range: YeastRecipeCandidate['temperature'], unit: string) => range
  ? `${range.range.min.toLocaleString('fr-FR')}${range.range.max === range.range.min ? '' : `–${range.range.max.toLocaleString('fr-FR')}`} ${unit}` : '—';
const searchTerms: Record<string, string> = { banane: 'banana', girofle: 'clove', epices: 'spice', seche: 'dry', liquide: 'liquid' };
// Generic collection notes are already explained in the caption and full details.
const preview = (description: string) => description.replace(/ \((?:Description qualitative du fabricant|Descripteurs qualitatifs du fabricant)[^)]*\)\.?$/, '');

/** The style narrows the documented uses; browsing never replaces the selected scenario. */
export function YeastCandidatePicker({ candidates, styleId, selectedId, onSelect }: {
  candidates: YeastRecipeCandidate[]; styleId: YeastStyleId; selectedId: string; onSelect: (id: string) => void;
}) {
  const uid = useId();
  const [scope, setScope] = useState<'style' | 'catalogue'>('style');
  const [query, setQuery] = useState('');
  const [lab, setLab] = useState('');
  const [form, setForm] = useState('');
  const [page, setPage] = useState(0);
  const wholeCatalogue = scope === 'catalogue' || styleId === 'unknown';
  const matching = useMemo(() => candidates.filter(c => c.styleMatch === 'documented'), [candidates]);
  const pool = wholeCatalogue ? candidates : matching;
  const labs = useMemo(() => [...new Set(pool.map(c => c.lab))].sort((a, b) => a.localeCompare(b, 'fr')), [pool]);
  const searchable = useMemo(() => new Map(candidates.map(c => [c.yeastId, normalizedYeastText([
    c.label, c.lab, c.reference.name, c.reference.id, c.reference.catalogue?.productCode ?? '', ...(c.reference.aliases ?? []),
    ...(c.reference.catalogue?.aliases ?? []), ...(c.reference.catalogue?.categories ?? []),
    ...(c.reference.catalogue?.facts ?? []).map(f => f.reported),
  ].join(' '))])), [candidates]);
  const terms = normalizedYeastText(query).split(' ').filter(Boolean);
  const normalizedQuery = normalizedYeastText(query);
  const relevance = (c: YeastRecipeCandidate) => {
    if (!normalizedQuery) return 0;
    const identifiers = [c.label, c.reference.name, c.reference.id, c.reference.catalogue?.productCode ?? '', ...(c.reference.aliases ?? [])].map(normalizedYeastText);
    return identifiers.some(s => s === normalizedQuery) ? 2 : identifiers.some(s => s.includes(normalizedQuery)) ? 1 : 0;
  };
  const filtered = pool.filter(c => (!lab || c.lab === lab) && (!form || (form === 'unknown' ? !c.reference.form : c.reference.form === form)) &&
    terms.every(term => searchable.get(c.yeastId)!.includes(term) || searchable.get(c.yeastId)!.includes(searchTerms[term] ?? term)))
    .sort((a, b) => relevance(b) - relevance(a));
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const shown = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const selected = candidates.find(c => c.yeastId === selectedId);
  const showSelected = () => {
    const inStyle = selected?.styleMatch === 'documented';
    setQuery(''); setLab(''); setForm(''); setScope(inStyle ? 'style' : 'catalogue');
    const rows = inStyle ? matching : candidates;
    setPage(Math.max(0, Math.floor(rows.findIndex(c => c.yeastId === selectedId) / PAGE_SIZE)));
  };
  const clearFilters = () => { setQuery(''); setLab(''); setForm(''); setPage(0); };
  return <div className="yeast-picker">
    {styleId !== 'unknown' && <SegmentedControl className="yeast-catalogue-scope" label="Étendue de la recherche de levure" value={scope}
      onChange={value => { setScope(value); setPage(0); setLab(''); }} options={[
        { value: 'style', label: `Style documenté · ${matching.length}` },
        { value: 'catalogue', label: `Tout le catalogue · ${candidates.length.toLocaleString('fr-FR')}` },
      ]} />}
    <label className="sr-only" htmlFor={`${uid}-search`}>Rechercher une levure</label>
    <Input id={`${uid}-search`} className="yeast-picker-search" aria-label="Rechercher une levure" type="search" value={query} placeholder="Nom, code, labo, arôme décrit…"
      onChange={e => { setQuery(e.target.value); setPage(0); }} />
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
    <p className="yeast-small" role="status">{filtered.length.toLocaleString('fr-FR')} référence{filtered.length > 1 ? 's' : ''}
      {wholeCatalogue ? ' · usages à vérifier pour ton style' : ' · usages documentés pour cette famille'}.
      {(query || lab || form) && <> <button type="button" className="yeast-link" onClick={clearFilters}>Effacer les filtres</button></>}
    </p>
    {filtered.length ? <div className="yeast-candidate-list"><table className="yeast-candidates">
      <caption>Potentiel décrit par le fabricant · aucun classement d’intensité</caption>
      <thead><tr><th scope="col">Souche et caractère</th><th scope="col">Fermentation<br />Atténuation</th></tr></thead>
      <tbody>{shown.map(c => <tr key={c.yeastId} data-selected={c.yeastId === selectedId}>
        <td><label><input type="radio" name={`${uid}-strain`} aria-label={`Comparer ${c.label}`} checked={c.yeastId === selectedId} onChange={() => onSelect(c.yeastId)} />
          <span><span className="yeast-candidate-name">{c.label}</span><span className="yeast-candidate-meta">{c.lab} · {c.reference.form ?? 'forme à préciser'}</span></span></label>
          <span className="yeast-candidate-aroma">{preview(c.descriptor)}</span>
          {wholeCatalogue && <span className="yeast-candidate-meta">{c.styleMatch === 'documented' ? 'Usage documenté pour ce style' : c.styleMatch === 'excluded' ? 'Usage déconseillé dans une source' : 'Style à confirmer'}</span>}
        </td>
        <td className="font-mono tabular-nums"><span>{format(c.temperature, '°C')}</span><span className="block">{format(c.attenuation, '%')}</span></td>
      </tr>)}</tbody>
    </table></div> : <p className="yeast-small">Aucune référence avec ces filtres.
      {!wholeCatalogue && <> <button type="button" className="yeast-link" onClick={() => { setScope('catalogue'); setLab(''); setPage(0); }}>Chercher dans tout le catalogue</button></>}
    </p>}
    {pageCount > 1 && <nav className="yeast-picker-pages" aria-label="Pages des références de levure">
      <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Précédentes</button>
      <span className="yeast-small">{currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} / {filtered.length}</span>
      <button type="button" disabled={currentPage === pageCount - 1} onClick={() => setPage(currentPage + 1)}>Suivantes</button>
    </nav>}
    {selected && !shown.some(c => c.yeastId === selectedId) && <p className="yeast-small">Scénario conservé : {selected.label}. <button type="button" className="yeast-link" onClick={showSelected}>Afficher sa ligne</button></p>}
    {wholeCatalogue && <p className="yeast-small">Le catalogue comprend aussi mélanges, bactéries et autres usages. Leur présence ne valide pas une fermentation de bière.</p>}
  </div>;
}
