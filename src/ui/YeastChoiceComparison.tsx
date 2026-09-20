import { useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { YeastRecipeCandidate } from '../domain/yeastRecipeDesign';
import { yeastStrainInformation, yeastFactValue } from '../domain/yeastStrainInformation';
import { YeastStrainDetails } from './YeastStrainDetails';

type Candidate = YeastRecipeCandidate;
const descriptor = (value: string) => value.replace(/ \((?:Description qualitative du fabricant|Descripteurs qualitatifs du fabricant)[^)]*\)\.?$/, '');
export const yeastChoiceRange = (value: Candidate['temperature'], unit: string) => value
  ? `${value.range.min.toLocaleString('fr-FR', { maximumFractionDigits: 20 })}${value.range.min === value.range.max ? '' : `–${value.range.max.toLocaleString('fr-FR', { maximumFractionDigits: 20 })}`} ${unit}`
  : 'Non documenté';

function RangeCell({ value, unit, bounds }: { value: Candidate['temperature']; unit: string; bounds?: { min: number; max: number } }) {
  return <><span className={value ? 'yc-number' : 'yeast-small'}>{yeastChoiceRange(value, unit)}</span>{value && bounds && bounds.max > bounds.min &&
    <span className="yc-range" aria-hidden="true"><span style={{ left: `${100 * (value.range.min - bounds.min) / (bounds.max - bounds.min)}%`, width: `${100 * (value.range.max - value.range.min) / (bounds.max - bounds.min)}%` }} /></span>}</>;
}

function CandidateDetails({ candidate, form, onFormChange }: { candidate: Candidate; form?: Candidate['form']; onFormChange: (form?: Candidate['form']) => void }) {
  const id = useId();
  return <div className="yc-candidate-details">
    <p>{candidate.descriptor}</p>
    <dl className="yc-facts">
      {candidate.form === 'sèche' && <div><dt>Dose sèche au volume prévu</dt><dd>{yeastChoiceRange(candidate.doseG, 'g')}</dd></div>}
      <div><dt>Usage pour le style</dt><dd>{candidate.styleMatch === 'documented' ? 'Documenté' : candidate.styleMatch === 'excluded' ? 'Déconseillé dans une source' : 'À confirmer'}</dd></div>
    </dl>
    {candidate.evidence.warnings.map(text => <p className="yeast-notice" key={text}>{text}</p>)}
    {candidate.evidence.exclusions.map((e, i) => <p className="yeast-notice" key={i}>{e.reported}</p>)}
    {!candidate.reference.form && <label className="yc-form" htmlFor={id}>Forme du produit à confirmer
      <select id={id} value={form ?? ''} onChange={e => onFormChange(e.target.value as Candidate['form'] || undefined)}>
        <option value="">À préciser</option><option value="sèche">Sèche</option><option value="liquide">Liquide</option><option value="levain">Levain</option>
      </select>
    </label>}
    <YeastStrainDetails information={yeastStrainInformation(candidate.reference, form)} />
  </div>;
}

/** A shortlist is reading state only. Choosing a strain is a separate, explicit action. */
export function YeastChoiceResults({ candidates, shown, selectedId, volumeL, onChoose }: {
  candidates: Candidate[]; shown: Candidate[]; selectedId: string; volumeL: number;
  onChoose: (id: string, form?: Candidate['form']) => void;
}) {
  const [ids, setIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [inspectedId, setInspectedId] = useState('');
  const [forms, setForms] = useState<Record<string, Candidate['form']>>({});
  const uid = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const shortlist = ids.flatMap(id => { const c = candidates.find(c => c.yeastId === id); return c ? [c] : []; });
  const toggle = (id: string) => setIds(previous => previous.includes(id) ? previous.filter(value => value !== id) : previous.length < 3 ? [...previous, id] : previous);
  const bounds = (key: 'temperature' | 'attenuation' | 'doseG') => {
    const ranges = shortlist.flatMap(c => c[key] ? [c[key]!.range] : []);
    return ranges.length ? { min: Math.min(...ranges.map(r => r.min)), max: Math.max(...ranges.map(r => r.max)) } : undefined;
  };
  return <>
    <div className="yc-comparison-bar">
      <span className="yeast-small">{shortlist.length ? `${shortlist.length}/3 à comparer` : 'Comparer 2 ou 3 levures'}</span>
      <button type="button" disabled={shortlist.length < 2} aria-expanded={open && shortlist.length > 1} onClick={() => {
        setOpen(value => !value);
        if (!open) requestAnimationFrame(() => heading.current?.focus());
      }}>{open && shortlist.length > 1 ? 'Fermer la comparaison' : `Comparer (${shortlist.length})`}</button>
      {shortlist.length > 0 && <button className="yeast-link" type="button" onClick={() => { setIds([]); setOpen(false); }}>Vider</button>}
    </div>
    {shortlist.length > 0 && <div className="yc-shortlist">{shortlist.map(c => <button type="button" key={c.yeastId} aria-label={`Retirer ${c.label} de la comparaison`} onClick={() => toggle(c.yeastId)}>{c.label}<span aria-hidden="true"> ×</span></button>)}</div>}
    {open && shortlist.length > 1 && <section className="yc-comparison" aria-label="Comparaison des levures">
      <h3 tabIndex={-1} ref={heading}>Repères fabricant</h3>
      <p className="yeast-small">Même échelle par ligne · aucune intensité aromatique chiffrée.{shortlist.length === 3 ? ' Fais défiler le tableau horizontalement.' : ''}</p>
      <div className="yc-table-scroll" tabIndex={0} role="region" aria-label="Tableau comparatif des levures">
        <table className="yc-table" data-count={shortlist.length}>
          <thead><tr><th scope="col">Repère</th>{shortlist.map(c => <th scope="col" key={c.yeastId}>{c.label}<span className="yeast-small">{c.lab}</span>{c.yeastId === selectedId && <span className="yc-tag">Dans la recette</span>}</th>)}</tr></thead>
          <tbody>
            <tr><th scope="row">Forme</th>{shortlist.map(c => <td key={c.yeastId}>{c.reference.form ?? 'À confirmer'}</td>)}</tr>
            <tr><th scope="row" aria-label="Température de fermentation en degrés Celsius">T° de ferm.<br />°C</th>{shortlist.map(c => <td key={c.yeastId}><RangeCell value={c.temperature} unit="°C" bounds={bounds('temperature')} /></td>)}</tr>
            <tr><th scope="row">Atténuation<br />%</th>{shortlist.map(c => <td key={c.yeastId}><RangeCell value={c.attenuation} unit="%" bounds={bounds('attenuation')} /></td>)}</tr>
            {(['alcoholTolerance', 'flocculation'] as const).filter(key => shortlist.some(c => c.reference.catalogue?.facts.some(f => f.key === key))).map(key => <tr key={key}>
              <th scope="row">{key === 'alcoholTolerance' ? 'Tolérance alcool' : 'Floculation'}</th>
              {shortlist.map(c => { const facts = c.reference.catalogue?.facts.filter(f => f.key === key) ?? [], contexts = [...new Set(facts.flatMap(f => f.context && f.context !== 'Beer' ? [f.context] : []))]; return <td key={c.yeastId}>{facts.length ? <>{[...new Set(facts.map(yeastFactValue))].map(value => <div key={value}>{value}</div>)}{contexts.length > 0 && <details><summary>Conditions</summary>{contexts.map(context => <p className="yeast-small" key={context}>{context}</p>)}</details>}</> : <span className="yeast-small">Non documenté</span>}</td>; })}
            </tr>)}
            {shortlist.some(c => c.form === 'sèche') && <tr><th scope="row">Dose sèche<br />pour {Number.isFinite(volumeL) ? volumeL.toLocaleString('fr-FR') : '—'} L</th>{shortlist.map(c => <td key={c.yeastId}>{c.form === 'sèche' ? <RangeCell value={c.doseG} unit="g" bounds={bounds('doseG')} /> : c.form ? 'Sans objet' : 'Forme à préciser'}</td>)}</tr>}
            <tr><th scope="row">Caractère décrit</th>{shortlist.map(c => { const full = descriptor(c.descriptor), first = full.split(/(?<=[.!?])\s/)[0]; return <td key={c.yeastId}><p>{first}</p>{first !== full && <details><summary>Profil complet</summary><p>{full}</p></details>}</td>; })}</tr>
            <tr><th scope="row">Style</th>{shortlist.map(c => <td key={c.yeastId}>{c.styleMatch === 'documented' ? 'Usage documenté' : c.styleMatch === 'excluded' ? 'Usage déconseillé' : 'À confirmer'}</td>)}</tr>
            <tr><th scope="row">Choix</th>{shortlist.map(c => <td key={c.yeastId}><button type="button" disabled={c.yeastId === selectedId} aria-label={`Choisir ${c.label} depuis la comparaison`} onClick={() => onChoose(c.yeastId, forms[c.yeastId] ?? c.reference.form)}>{c.yeastId === selectedId ? 'Choisie' : 'Choisir'}</button></td>)}</tr>
          </tbody>
        </table>
      </div>
      <p className="yeast-small">L’atténuation dépend du moût.{shortlist.some(c => c.form === 'sèche') ? ' Une dose en grammes ne donne ni un nombre de sachets ni la viabilité.' : ''}</p>
    </section>}
    {shown.length > 0 && <div className="yc-list-head" aria-hidden="true"><span>Souche</span><span>°C / attén. %</span></div>}
    <ul className="yc-list" aria-label="Levures à consulter">{shown.map(c => <li key={c.yeastId} data-current={c.yeastId === selectedId}>
      <div className="yc-row">
        <div className="yc-identity"><strong>{c.label}</strong><span className="yeast-small">{c.lab} · {c.reference.form ?? 'forme à préciser'}</span>
          {c.yeastId === selectedId && <span className="yc-tag"><Check size={12} aria-hidden="true" /> Dans la recette</span>}
        </div>
        <dl className="yc-values"><div><dt className="sr-only">Fermentation</dt><dd className={!c.temperature ? 'yc-missing' : undefined}>{yeastChoiceRange(c.temperature, '°C')}</dd></div><div><dt className="sr-only">Atténuation</dt><dd className={!c.attenuation ? 'yc-missing' : undefined}>{yeastChoiceRange(c.attenuation, '%')}</dd></div></dl>
      </div>
      <div className="yc-row-actions"><label><input type="checkbox" aria-label={`Comparer ${c.label}`} checked={ids.includes(c.yeastId)} disabled={!ids.includes(c.yeastId) && ids.length >= 3} onChange={() => toggle(c.yeastId)} />Comparer</label>
        {c.styleMatch !== 'documented' && <span className={c.styleMatch === 'excluded' ? 'yeast-notice' : 'yeast-small'}>{c.styleMatch === 'excluded' ? 'Usage déconseillé' : 'Style à confirmer'}</span>}
        <button type="button" className="yeast-link" aria-label={`Consulter ${c.label}`} aria-expanded={inspectedId === c.yeastId} aria-controls={`${uid}-${c.yeastId}`} onClick={() => setInspectedId(value => value === c.yeastId ? '' : c.yeastId)}>Détails<ChevronDown size={14} aria-hidden="true" /></button>
        <button type="button" className="yc-choose" disabled={c.yeastId === selectedId} aria-label={`Choisir ${c.label} dans la recette`} onClick={() => onChoose(c.yeastId, forms[c.yeastId] ?? c.reference.form)}>{c.yeastId === selectedId ? 'Choisie' : 'Choisir'}</button>
      </div>
      <div id={`${uid}-${c.yeastId}`} hidden={inspectedId !== c.yeastId} className="yc-consult">{inspectedId === c.yeastId && <CandidateDetails candidate={c} form={forms[c.yeastId] ?? c.reference.form} onFormChange={form => setForms(previous => ({ ...previous, [c.yeastId]: form }))} />}</div>
    </li>)}</ul>
  </>;
}
