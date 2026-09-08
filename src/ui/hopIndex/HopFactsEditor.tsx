import React from 'react';
import { HOP_ANALYTES, HOP_UNITS, HopAnalyte, HopMeasurement, HopSource, hopMeasurementError } from '../../../functions/src/hopIndexSchema';
import { HOP_ANALYTE_LABELS, HOP_UNIT_LABELS } from '../../domain/hopIndex/labels';
import { Field as FormField, TextInput, inputClass } from '../FormNav';
import { NumberInput } from '../NumberInput';
import { Button } from '../../components/ui/Button';

export const blankHopSource = (kind: HopSource['kind'] = 'manufacturer'): HopSource => ({ title: '', author: '', reference: '', year: null, kind });

/** Associate the visible label with native and shared form controls. */
export function HopField({ children, ...props }: React.ComponentProps<typeof FormField>) {
  const id = React.useId();
  return <FormField {...props} htmlFor={id}>{React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<{ id?: string }>, { id }) : children}</FormField>;
}
const Field = HopField;

export function HopSourceEditor({ value, onChange }: { value: HopSource; onChange: (value: HopSource) => void }) {
  return <div className="grid gap-3 sm:grid-cols-2">
    <Field label="Titre de la source"><TextInput value={value.title} onChange={title => onChange({ ...value, title })} /></Field>
    <Field label="Auteur ou organisme"><TextInput value={value.author} onChange={author => onChange({ ...value, author })} /></Field>
    <Field label="Référence ou URL" className="sm:col-span-2"><TextInput value={value.reference} onChange={reference => onChange({ ...value, reference })} /></Field>
    <Field label="Année de la source" hint="Laisser vide si inconnue ; ce n’est pas la date de consultation."><NumberInput className={inputClass} value={value.year ?? undefined} emptyValue={undefined} integer onValue={year => onChange({ ...value, year: year ?? null })} /></Field>
    <Field label="Page ou tableau"><TextInput value={value.locator ?? ''} onChange={locator => onChange({ ...value, locator })} /></Field>
    <Field label="Nature de la source"><select className={inputClass} value={value.kind} onChange={e => onChange({ ...value, kind: e.target.value as HopSource['kind'] })}>
      {Object.entries({ coa: 'Certificat d’analyse', manufacturer: 'Fiche fabricant', research: 'Étude scientifique', review: 'Revue scientifique', observation: 'Observation personnelle', community: 'Communauté', judgment: 'Jugement documenté' }).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
    </select></Field>
  </div>;
}

export function HopFactsEditor({ value, onChange, sourceKind = 'manufacturer' }: {
  value: HopMeasurement[]; onChange: (v: HopMeasurement[]) => void; sourceKind?: HopSource['kind'];
}) {
  const patch = (index: number, next: HopMeasurement) => onChange(value.map((m, i) => i === index ? next : m));
  const add = (analyte: HopAnalyte) => onChange([...value, { analyte, unit: analyte === 'hsi' ? 'index' : analyte === 'totalOil' ? 'ml100g' : ['alpha', 'beta'].includes(analyte) ? 'percentMass' : 'ugKg',
    basis: 'asIs', kind: 'point', confidence: 'low', source: value[value.length - 1]?.source ?? blankHopSource(sourceKind) }]);
  return <div className="space-y-4">
    {value.map((m, index) => <fieldset key={m.analyte} className="border border-cave-700 rounded-control p-3 space-y-3">
      <legend className="px-1 font-semibold text-cave-50">{HOP_ANALYTE_LABELS[m.analyte]}</legend>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Type de résultat"><select className={inputClass} value={m.kind} onChange={e => {
          const { value: _v, range: _r, limit: _l, limitKind: _k, ...rest } = m;
          patch(index, { ...rest, kind: e.target.value as HopMeasurement['kind'] });
        }}>
          <option value="point">Valeur rapportée</option><option value="range">Plage publiée</option>
          <option value="below">Non détecté / non quantifié</option><option value="unknown">Non déterminé</option>
        </select></Field>
        <Field label="Unité"><select className={inputClass} value={m.unit} onChange={e => patch(index, { ...m, unit: e.target.value as HopMeasurement['unit'],
          basis: e.target.value === 'percentOil' ? 'oil' : ['ngL', 'ugL', 'ugLInternalStandardEquivalent'].includes(e.target.value) ? 'beer' : ['unknown', 'ugKgThiolEquivalent'].includes(e.target.value) ? 'unknown' : 'asIs' })}>
          {HOP_UNITS.map(unit => <option key={unit} value={unit}>{HOP_UNIT_LABELS[unit]}</option>)}
        </select></Field>
        <Field label="Base de mesure"><select className={inputClass} value={m.basis} onChange={e => patch(index, { ...m, basis: e.target.value as HopMeasurement['basis'] })}>
          {Object.entries({ asIs: 'Produit tel quel', dryMatter: 'Matière sèche', oil: 'Fraction d’huile', beer: 'Bière', unknown: 'Non précisée' }).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select></Field>
        {m.kind === 'point' && <Field label="Valeur"><NumberInput className={inputClass} value={m.value} emptyValue={undefined} onValue={v => patch(index, { ...m, value: v })} /></Field>}
        {(m.kind === 'range' || m.kind === 'point') && <>
          <Field label={m.kind === 'point' ? 'Borne basse publiée (facultative)' : 'Borne basse'}><NumberInput className={inputClass} value={m.range?.min} emptyValue={undefined} onValue={min => {
            const range = { min, max: m.range?.max };
            patch(index, { ...m, range: min == null && range.max == null ? undefined : range });
          }} /></Field>
          <Field label={m.kind === 'point' ? 'Borne haute publiée (facultative)' : 'Borne haute'}><NumberInput className={inputClass} value={m.range?.max} emptyValue={undefined} onValue={max => {
            const range = { min: m.range?.min, max };
            patch(index, { ...m, range: max == null && range.min == null ? undefined : range });
          }} /></Field>
        </>}
        {m.kind === 'below' && <>
          <Field label="Limite publiée (facultative)"><NumberInput className={inputClass} value={m.limit} emptyValue={undefined} onValue={limit => patch(index, { ...m, limit })} /></Field>
          <Field label="Nature de la limite"><select className={inputClass} value={m.limitKind ?? ''} onChange={e => patch(index, { ...m, limitKind: e.target.value ? e.target.value as 'lod' | 'loq' : undefined })}>
            <option value="">Non précisée</option><option value="lod">Détection (LOD)</option><option value="loq">Quantification (LOQ)</option>
          </select></Field>
        </>}
        <Field label="Méthode analytique"><TextInput value={m.method ?? ''} onChange={method => patch(index, { ...m, method })} /></Field>
      </div>
      {m.kind === 'point' && !m.range && <p className="text-sm text-cave-400">Sans marge publiée, la valeur restera ponctuelle. Aucune précision ne sera inventée.</p>}
      <details open={!m.source.reference}><summary className="min-h-touch cursor-pointer text-cave-200">Source de cette mesure {m.source.title && `: ${m.source.title}`}</summary>
        <HopSourceEditor value={m.source} onChange={source => patch(index, { ...m, source })} />
      </details>
      {hopMeasurementError(m) && <p className="text-sm text-ebc-straw">À compléter : {hopMeasurementError(m)}</p>}
      <Button type="button" intent="ghost" onClick={() => onChange(value.filter((_, i) => i !== index))}>Retirer cette mesure</Button>
    </fieldset>)}
    <Field label="Ajouter une mesure"><select className={inputClass} value="" onChange={e => { if (e.target.value) add(e.target.value as HopAnalyte); }}>
      <option value="">Choisir un composé…</option>
      {HOP_ANALYTES.filter(a => !value.some(m => m.analyte === a)).map(a => <option key={a} value={a}>{HOP_ANALYTE_LABELS[a]}</option>)}
    </select></Field>
  </div>;
}
