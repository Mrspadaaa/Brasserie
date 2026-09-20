import { useId, useState } from 'react';
import type { YeastSpec } from '../types';
import { Input, Textarea } from './Input';
import { NumberInput } from './NumberInput';
import { Units } from '../services/units';
import { YEAST_FACT_LABELS } from '../domain/yeastCatalogue';

const units = ['g', 'kg', 'mL', 'L', 'sachet', 'flacon', 'paquet'];

function AttenuationRangeEditor({ yeast, onChange }: { yeast: YeastSpec; onChange: (value: YeastSpec) => void }) {
  const existingIndex = yeast.technicalFacts?.findIndex(fact => fact.key === 'attenuation' && fact.origin === 'personal') ?? -1;
  const existing = yeast.technicalFacts?.[existingIndex];
  const [min, setMin] = useState<number | undefined>(existing?.range?.min);
  const [max, setMax] = useState<number | undefined>(existing?.range?.max);
  const [qualifier, setQualifier] = useState<'range' | 'reportedPoint' | 'atLeast' | 'upTo'>(existing?.qualifier ?? 'range');
  const [source, setSource] = useState(existing?.source ?? '');
  const [error, setError] = useState('');
  const retain = () => {
    const upper = qualifier === 'range' ? max : min;
    if (min == null || upper == null || !Number.isFinite(min) || !Number.isFinite(upper) || min < 0 || upper > 100 || min > upper) { setError('Saisis une valeur entre 0 et 100 %, avec un maximum supérieur ou égal au minimum.'); return; }
    const fact = { key: 'attenuation' as const, reported: `Atténuation ${qualifier === 'atLeast' ? '≥ ' : qualifier === 'upTo' ? '≤ ' : ''}${min}${min === upper ? '' : `–${upper}`} %`, range: { min, max: upper }, qualifier, unit: '%' as const, origin: 'personal' as const,
      ...(source.trim() ? { source: source.trim(), .../^https?:\/\//.test(source.trim()) ? { sourceUrl: source.trim() } : {} } : {}) };
    const facts = [...yeast.technicalFacts ?? []];
    if (existingIndex >= 0) facts[existingIndex] = fact; else facts.push(fact);
    onChange({ ...yeast, technicalFacts: facts }); setError('');
  };
  return <details><summary>Saisir une plage ou une borne d’atténuation</summary><div className="yc-dossier-fields">
    <label>Type de valeur<select aria-label="Type de repère d’atténuation" value={qualifier} onChange={e => setQualifier(e.target.value as typeof qualifier)}><option value="range">Plage</option><option value="reportedPoint">Valeur ponctuelle</option><option value="atLeast">Au moins</option><option value="upTo">Au plus</option></select></label>
    <div className="yc-input-pair"><label>{qualifier === 'range' ? 'Minimum' : 'Valeur'} · %<NumberInput aria-label="Atténuation documentaire minimale" min={0} max={100} value={min} emptyValue={undefined} onValue={setMin} /></label>
      {qualifier === 'range' && <label>Maximum · %<NumberInput aria-label="Atténuation documentaire maximale" min={0} max={100} value={max} emptyValue={undefined} onValue={setMax} /></label>}</div>
    <label>Source du repère<Input aria-label="Source de la plage d’atténuation" value={source} onChange={e => setSource(e.target.value)} placeholder="Fiche, URL, retour de brassin…" /></label>
    <p className="yeast-small">La plage est conservée exactement, à côté de l’hypothèse de recette. Les observations d’autres sources restent accessibles.</p>
    {error && <p className="yeast-error" role="alert">{error}</p>}
    <button type="button" onClick={retain}>Conserver ce repère</button>
  </div></details>;
}

/** Product form and packaging are independent. Only physical unit conversions are automatic. */
export function YeastRecipeQuantity({ yeast, onChange, invalid }: { yeast: YeastSpec; onChange: (value: YeastSpec) => void; invalid?: boolean }) {
  const id = useId();
  const [notice, setNotice] = useState('');
  const invalidNumber = yeast.qty != null && (!Number.isFinite(yeast.qty) || yeast.qty < 0);
  const changeUnit = (unit: string) => {
    const converted = yeast.unit && yeast.qty != null ? Units.convert(yeast.qty, yeast.unit, unit) : null;
    setNotice(converted === null && yeast.qty != null ? `Quantité à ressaisir en ${unit} : aucune conversion depuis ${yeast.unit || 'une unité inconnue'}.` : '');
    onChange({ ...yeast, unit: unit || undefined, qty: converted ?? undefined });
  };
  return <div className="yc-quantity-editor">
    <div className="yc-dose-input"><label htmlFor="wz-yeast-qty">Quantité prévue</label>
      <NumberInput id="wz-yeast-qty" aria-label={`Quantité de levure${yeast.unit ? `, en ${yeast.unit}` : ''}`} value={yeast.qty} emptyValue={undefined} required aria-invalid={invalid || invalidNumber} onValue={qty => { if (qty != null && qty > 0) setNotice(''); onChange({ ...yeast, qty }); }} />
      <select aria-label="Unité de la quantité de levure" value={yeast.unit ?? ''} onChange={e => changeUnit(e.target.value)}>
        <option value="">Unité…</option>{[...new Set([...units, ...yeast.unit ? [yeast.unit] : []])].map(unit => <option key={unit}>{unit}</option>)}
      </select>
    </div>
    <div className="yc-form-input"><label htmlFor={id}>Forme</label><select id={id} aria-label="Forme de la levure" value={yeast.form ?? ''} onChange={e => onChange({ ...yeast, form: e.target.value as YeastSpec['form'] || undefined })}>
      <option value="">À préciser</option><option value="sèche">Sèche</option><option value="liquide">Liquide</option><option value="levain">Levain / récup.</option>
    </select></div>
    {notice && <p className="yeast-notice" role="status">{notice}</p>}
    {invalidNumber && <p className="yeast-error" role="alert">La quantité de levure doit être un nombre positif ou nul.</p>}
  </div>;
}

/** Optional dossier: an absent field stays absent; a personal hypothesis is labelled as such. */
export function YeastRecipeDossier({ yeast, onChange }: { yeast: YeastSpec; onChange: (value: YeastSpec) => void }) {
  const id = useId();
  const patch = (value: Partial<YeastSpec>) => onChange({ ...yeast, ...value });
  // Display an identical observation from the same URL once. The underlying
  // records, alternate sources and different conditions are all preserved.
  const facts = [...new Map((yeast.technicalFacts ?? []).map(fact => [JSON.stringify([fact.key, fact.reported, fact.range, fact.unit, fact.qualifier ?? (fact.range && fact.range.min !== fact.range.max ? 'range' : undefined), fact.origin, fact.sourceUrl ?? fact.source, fact.context]), fact])).values()];
  const documented = (key: string) => [...new Set(facts.filter(fact => fact.key === key).map(fact => fact.reported))].join(' · ');
  return <div className="yc-dossier-fields">
    <p className="yeast-small">Complète ou corrige les données connues. Les observations publiées restent conservées ci-dessous ; une valeur manquante n’est pas inventée.</p>
    <label>Laboratoire<Input aria-label="Laboratoire de la levure" value={yeast.lab ?? ''} onChange={e => patch({ lab: e.target.value || undefined })} /></label>
    <label>Code de souche<Input aria-label="Code de souche" value={yeast.strain ?? ''} onChange={e => patch({ strain: e.target.value || undefined })} /></label>
    <div className="yeast-setting-line"><label htmlFor={`${id}-att`}>Atténuation connue</label><NumberInput id={`${id}-att`} aria-label="Atténuation de la levure, en pourcent" min={0} max={100} value={yeast.attenuationPct} emptyValue={undefined} onValue={attenuationPct => patch({ attenuationPct, attenuationBasis: yeast.attenuationBasis ?? 'recipe' })} /><span>%</span></div>
    {yeast.attenuationPct == null && documented('attenuation') && <p className="yeast-small">Fiche : {documented('attenuation')}. Aucune valeur centrale n’est choisie.</p>}
    <label>Nature de cette valeur<select aria-label="Origine de l’atténuation saisie" value={yeast.attenuationBasis ?? 'recipe'} onChange={e => patch({ attenuationBasis: e.target.value as YeastSpec['attenuationBasis'] })}>
      <option value="recipe">Hypothèse de cette recette</option><option value="declared">Valeur annoncée</option><option value="measured">Retour mesuré d’un brassin</option>
    </select></label>
    <AttenuationRangeEditor key={JSON.stringify([yeast.name, yeast.technicalFacts])} yeast={yeast} onChange={onChange} />
    <div className="yc-input-pair">
      <label>Fermentation mini · °C<NumberInput aria-label="Température minimale de la fiche saisie" value={yeast.fermTempMinC} emptyValue={undefined} onValue={fermTempMinC => patch({ fermTempMinC })} /></label>
      <label>Fermentation maxi · °C<NumberInput aria-label="Température maximale de la fiche saisie" value={yeast.fermTempMaxC} emptyValue={undefined} onValue={fermTempMaxC => patch({ fermTempMaxC })} /></label>
    </div>
    {yeast.fermTempMinC != null && yeast.fermTempMaxC != null && yeast.fermTempMinC > yeast.fermTempMaxC && <p role="alert" className="yeast-error">La température minimale dépasse la maximale. Corrige les repères.</p>}
    <div className="yeast-setting-line"><label htmlFor={`${id}-alcohol`}>Tolérance à l’alcool annoncée</label><NumberInput id={`${id}-alcohol`} aria-label="Tolérance à l’alcool, en pourcent" min={0} max={100} value={yeast.alcoholTolerancePct} emptyValue={undefined} onValue={alcoholTolerancePct => patch({ alcoholTolerancePct })} /><span>% vol</span></div>
    {yeast.alcoholTolerancePct == null && documented('alcoholTolerance') && <p className="yeast-small">Fiche : {documented('alcoholTolerance')}</p>}
    <label>Floculation<Input aria-label="Floculation" value={yeast.flocculation ?? ''} onChange={e => patch({ flocculation: e.target.value || undefined })} /></label>
    {!yeast.flocculation && documented('flocculation') && <p className="yeast-small">Fiche : {documented('flocculation')}</p>}
    <div className="yeast-setting-line"><label htmlFor={`${id}-days`}>Durée indicative de la fiche</label><NumberInput id={`${id}-days`} aria-label="Durée indicative de la fiche, en jours" min={0} value={yeast.fermentDays} emptyValue={undefined} onValue={fermentDays => patch({ fermentDays })} /><span>j</span></div>
    {yeast.fermentDays == null && documented('fermentationTime') && <p className="yeast-small">Fiche : {documented('fermentationTime')}</p>}
    <label>Source / notice<Input aria-label="Source de la fiche technique" value={yeast.technicalSource ?? ''} onChange={e => patch({ technicalSource: e.target.value || undefined })} /></label>
    <label>Notes sur la souche<Textarea aria-label="Notes sur la levure" value={yeast.notes ?? ''} onChange={e => patch({ notes: e.target.value || undefined })} rows={3} /></label>
    {!!facts.length && <details aria-label="Données documentaires conservées"><summary>Données documentaires · {facts.length} observations</summary>
      <dl className="yeast-strain-notes">{facts.map((fact, i) => <div key={`${fact.key}-${i}`}><dt>{YEAST_FACT_LABELS[fact.key]}</dt><dd>
        <p>{fact.reported}</p>
        {fact.range && <span className="yc-number">{fact.qualifier === 'atLeast' ? '≥ ' : fact.qualifier === 'upTo' ? '≤ ' : ''}{fact.range.min.toLocaleString('fr-FR', { maximumFractionDigits: 20 })}{fact.range.max !== fact.range.min ? `–${fact.range.max.toLocaleString('fr-FR', { maximumFractionDigits: 20 })}` : ''} {fact.unit}</span>}
        {fact.context && fact.context !== 'Beer' && <p>{fact.context}</p>}<span className="yeast-small">{fact.origin === 'manufacturer' ? 'Fabricant' : fact.origin === 'ai' ? 'Recherche IA' : 'Donnée personnelle'}{fact.source ? ` · ${fact.source}` : ''}</span>
        {fact.sourceUrl && <a className="yeast-source block" href={fact.sourceUrl} target="_blank" rel="noreferrer">Voir la source</a>}
      </dd></div>)}</dl>
    </details>}
  </div>;
}
