import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { HOP_ANALYTES, HOP_FORMS, HOP_UNITS } from '../../../functions/src/hopIndexSchema';
import type { HopDescription, HopMeasurement, HopSource, HopUnit } from '../../../functions/src/hopIndexSchema';
import type {
  BrewerCatalogueClaim, BrewerCatalogueCommand, BrewerCatalogueIdentityCandidate,
  BrewerCatalogueKind, BrewerCatalogueNormalized,
  BrewerCatalogueProjectionChoice, BrewerCatalogueUnmappedValue
} from '../../../functions/src/brewerCatalogueSchema';
import type { BrewerCatalogueLookupRecord } from '../../../functions/src/brewerCatalogueStore';
import type { BrewingStyle, BrewingStyleGuide } from '../../../functions/src/brewingStyleSchema';
import type { HopYeast } from '../../../functions/src/hopPredictionSchema';
import type { HopVariety } from '../../../functions/src/hopIndexSchema';
import { HOP_ANALYTE_LABELS, HOP_FORM_LABELS, HOP_UNIT_LABELS } from '../../domain/hopIndex/labels';
import type { HopV55Services } from '../../services/hopV55/contracts';
import { Input, Textarea } from '../Input';
import './catalogue.css';

type Props = {
  services: HopV55Services;
  onCanonicalRecord?(record: BrewerCatalogueLookupRecord): void;
  onUseRecord?(record: BrewerCatalogueLookupRecord): void;
};

type SourceDraft = { title: string; author: string; year: string; kind: string; reference: string; locator: string };
type ClaimDraft = {
  id: string; projectionId: string; recordedAt: string; publishedAt: string; retrievedAt: string; observedAt: string; scope: string; property: string; label: string;
  reported: string; epistemic: string; normalizedKind: 'none' | 'text' | 'category' | 'point' | 'range' | 'bound';
  value: string; min: string; max: string; unit: string; basis: string; qualifier: string;
  operator: string; limitKind: string; rawJson: string; method: string; confidence: string; sensoryContext: HopDescription['context'];
  context: string; projectionMode: 'none' | 'scenario' | 'legacy'; targetField: string; projectionReason: string;
};
type CreateDraft = {
  name: string; origin: string; yeastForm: string; version: string; edition: string; attribution: string;
  enabled: string; styleCode: string; styleName: string; styleFamily: string; styleStat: string; styleStatMin: string; styleStatMax: string; createdAt: string;
};
type UnmappedDraft = { sourcePath: string; rawJson: string; reason: string; recordedAt: string; sourceEnabled: boolean; source: SourceDraft };
type Mode = 'browse' | 'details' | 'create' | 'enrich';
type WithoutOperationId<T> = T extends { operationId: string } ? Omit<T, 'operationId'> : never;
type CataloguePayload = WithoutOperationId<BrewerCatalogueCommand>;

const KIND_LABEL: Record<BrewerCatalogueKind, string> = {
  hopVariety: 'Houblons', yeastStrain: 'Levures', brewingStyle: 'Styles'
};
const STYLE_STAT_OPTIONS = [
  { key: 'og', label: 'Densité initiale (OG)', unit: 'SG' }, { key: 'fg', label: 'Densité finale (FG)', unit: 'SG' },
  { key: 'abv', label: 'Alcool (ABV)', unit: '% vol' }, { key: 'ibu', label: 'Amertume (IBU)', unit: 'IBU' }, { key: 'srm', label: 'Couleur (SRM)', unit: 'SRM' }
] as const;
const EPISTEMIC_LABEL: Record<string, string> = {
  measured: 'Mesure', manufacturerClaim: 'Donnée fabricant', researchClaim: 'Résultat de recherche',
  personalObservation: 'Observation personnelle', estimate: 'Estimation', hypothesis: 'Hypothèse', modelOutput: 'Sortie de modèle'
};
const SOURCE_LABEL: Record<string, string> = {
  coa: 'Certificat d’analyse', manufacturer: 'Fabricant', research: 'Recherche', review: 'Revue',
  observation: 'Observation', community: 'Communauté', judgment: 'Jugement documenté'
};
const freshId = () => globalThis.crypto?.randomUUID?.() ?? `catalogue-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const freshSource = (): SourceDraft => ({ title: '', author: '', year: '', kind: '', reference: '', locator: '' });
const freshClaim = (): ClaimDraft => ({
  id: freshId(), projectionId: freshId(), recordedAt: new Date().toISOString(), publishedAt: '', retrievedAt: '', observedAt: '', scope: '', property: '', label: '',
  reported: '', epistemic: '', normalizedKind: 'none', value: '', min: '', max: '', unit: '', basis: '', qualifier: '',
  operator: '>=', limitKind: '', rawJson: '', method: '', confidence: '', context: '', sensoryContext: 'unspecified', projectionMode: 'scenario', targetField: '',
  projectionReason: 'Conservée comme donnée de scénario sans remplacer le fait du catalogue.'
});
const freshUnmapped = (): UnmappedDraft => ({ sourcePath: '', rawJson: '', reason: '', recordedAt: new Date().toISOString(), sourceEnabled: false, source: freshSource() });
const freshCreate = (name = ''): CreateDraft => ({
  name, origin: '', yeastForm: '', version: '', edition: '', attribution: '', enabled: '',
  styleCode: '', styleName: '', styleFamily: '', styleStat: '', styleStatMin: '', styleStatMax: '', createdAt: today()
});

function parseNumber(value: string, label: string): number {
  const normalized = value.trim().replace(',', '.');
  if (!normalized || !/^-?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) throw new Error(`${label} doit être une valeur numérique finie.`);
  const number = Number(normalized);
  if (!Number.isFinite(number)) throw new Error(`${label} doit être une valeur numérique finie.`);
  return number;
}

function sourceFromDraft(draft: SourceDraft): HopSource {
  if (!draft.title.trim() || !draft.author.trim() || !draft.reference.trim() || !draft.kind) {
    throw new Error('Titre, auteur, référence et nature sont requis pour la source.');
  }
  let year: number | null = null;
  if (draft.year.trim()) {
    const parsed = Number(draft.year.trim());
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 9999) throw new Error('L’année de source doit être un entier positif ou rester vide.');
    year = parsed;
  }
  return {
    title: draft.title.trim(), author: draft.author.trim(), year,
    kind: draft.kind as HopSource['kind'], reference: draft.reference.trim(),
    ...(draft.locator.trim() ? { locator: draft.locator.trim() } : {})
  };
}

function normalizedFromDraft(draft: ClaimDraft): BrewerCatalogueNormalized | undefined {
  const basis = draft.basis.trim() || undefined;
  const qualifier = draft.qualifier.trim() || undefined;
  if (draft.normalizedKind === 'none') return undefined;
  if (draft.normalizedKind === 'text' || draft.normalizedKind === 'category') {
    if (!draft.value.trim()) throw new Error('La valeur descriptive normalisée est requise.');
    return { kind: draft.normalizedKind, value: draft.value.trim() };
  }
  if (!draft.unit.trim()) throw new Error('L’unité de la valeur normalisée est requise.');
  if (draft.normalizedKind === 'point') return { kind: 'point', value: parseNumber(draft.value, 'La valeur'), unit: draft.unit.trim(), ...(basis ? { basis } : {}), ...(qualifier ? { qualifier } : {}) };
  if (draft.normalizedKind === 'range') {
    const min = parseNumber(draft.min, 'La borne basse'), max = parseNumber(draft.max, 'La borne haute');
    if (min > max) throw new Error('La borne basse doit être inférieure ou égale à la borne haute.');
    return { kind: 'range', min, max, unit: draft.unit.trim(), ...(basis ? { basis } : {}), ...(qualifier ? { qualifier } : {}) };
  }
  return {
    kind: 'bound', value: parseNumber(draft.value, 'La valeur de borne'), unit: draft.unit.trim(),
    operator: draft.operator as '>' | '>=' | '<' | '<=', ...(draft.limitKind ? { limitKind: draft.limitKind as 'lod' | 'loq' } : {}),
    ...(basis ? { basis } : {}), ...(qualifier ? { qualifier } : {})
  };
}

function claimFromDraft(draft: ClaimDraft, source: HopSource): BrewerCatalogueClaim {
  if (!draft.scope.trim() || !draft.property.trim() || !draft.reported.trim() || !draft.epistemic) {
    throw new Error('La portée, la propriété, la valeur rapportée et le statut de la donnée sont requis.');
  }
  let rawValue: unknown;
  if (draft.rawJson.trim()) {
    try { rawValue = JSON.parse(draft.rawJson); }
    catch { throw new Error('La valeur brute doit être un JSON valide.'); }
  }
  const normalized = normalizedFromDraft(draft);
  return {
    id: draft.id, scope: draft.scope.trim(), property: draft.property.trim(),
    ...(draft.label.trim() ? { label: draft.label.trim() } : {}), reported: draft.reported.trim(),
    ...(rawValue !== undefined ? { rawValue: rawValue as BrewerCatalogueClaim['rawValue'] } : {}),
    ...(normalized ? { normalized } : {}), epistemic: draft.epistemic as BrewerCatalogueClaim['epistemic'], source,
    dates: { recordedAt: draft.recordedAt, ...(draft.publishedAt ? { publishedAt: draft.publishedAt } : {}),
      ...(draft.retrievedAt ? { retrievedAt: draft.retrievedAt } : {}), ...(draft.observedAt ? { observedAt: draft.observedAt } : {}) },
    ...(draft.property === 'hop.description'
      ? { context: { sensoryContext: draft.sensoryContext, ...(draft.context.trim() ? { conditions: draft.context.trim() } : {}) } }
      : draft.context.trim() ? { context: draft.context.trim() } : {}),
    ...(draft.confidence ? { confidence: draft.confidence as BrewerCatalogueClaim['confidence'] } : {}),
    ...(draft.method.trim() ? { method: draft.method.trim() } : {})
  };
}

function projectionTargets(kind: BrewerCatalogueKind, claim: BrewerCatalogueClaim, styleId?: string): string[] {
  const value = claim.normalized;
  const factual = !['estimate', 'hypothesis', 'modelOutput'].includes(claim.epistemic);
  if (!factual || !value) return [];
  if (kind === 'hopVariety') {
    if (claim.scope === 'identity' && claim.property === 'identity.alias' && ['text', 'category'].includes(value.kind)) return ['identity.alias'];
    if (claim.scope === 'variety' && claim.property === 'hop.form' && value.kind === 'category' && HOP_FORMS.includes(value.value as HopVariety['form']) && value.value !== 'unknown') return ['form'];
    const context = claim.context && typeof claim.context === 'object' && !Array.isArray(claim.context) ? claim.context : undefined;
    if (claim.scope === 'variety' && claim.property === 'hop.description' && value.kind === 'text' && context &&
        ['rawHop', 'infusion', 'beer', 'unspecified'].includes(String(context.sensoryContext))) return ['hop.description'];
    const match = /^(?:hop\.|analysis\.)([A-Za-z0-9]+)$/.exec(claim.property);
    if (claim.scope === 'variety' && match && HOP_ANALYTES.includes(match[1] as typeof HOP_ANALYTES[number]) && ['point', 'range'].includes(value.kind) && claim.confidence) return [`analysis.${match[1]}`];
  }
  if (kind === 'yeastStrain') {
    if (claim.scope === 'identity' && claim.property === 'identity.alias' && ['text', 'category'].includes(value.kind)) return ['identity.alias'];
    if (claim.scope === 'strain' && claim.property === 'yeast.betaLyase' && value.kind === 'category') return ['betaLyase'];
    const match = /^yeast\.(?:technical\.)?(temperature|attenuation|alcoholTolerance|flocculation)$/.exec(claim.property);
    if (claim.scope === 'strain' && match && ['point', 'range', 'category', 'text'].includes(value.kind)) return [`reviewedDocumentary.technicalSelections.${match[1]}`];
  }
  if (kind === 'brewingStyle' && styleId) {
    if (claim.scope === 'style' || claim.scope === `style:${styleId}`) {
      if (claim.property === `style.${styleId}.identity.alias` && ['text', 'category'].includes(value.kind)) return [`styles.${styleId}.aliases`];
      const match = /^(og|fg|abv|ibu|srm)$/.exec(claim.property.replace(`style.${styleId}.stats.`, ''));
      if (claim.property.startsWith(`style.${styleId}.stats.`) && match && value.kind === 'range') return [`styles.${styleId}.stats.${match[1]}`];
    }
  }
  return [];
}

function nameOf(row: BrewerCatalogueLookupRecord): string {
  if (row.kind === 'brewingStyle') {
    const guide = row.record as BrewingStyleGuide;
    const style = row.styleId ? guide.styles.find(item => item.id === row.styleId) : undefined;
    return style ? `${style.name} · ${guide.name}` : guide.name;
  }
  return (row.record as HopVariety | HopYeast).name;
}

function sourceLink(reference: string) {
  return /^https?:\/\//i.test(reference) ? <a href={reference} target="_blank" rel="noreferrer">{reference}</a> : <code>{reference}</code>;
}

function formatNormalized(value?: BrewerCatalogueNormalized): string | null {
  if (!value) return null;
  const normalizedUnit = 'unit' in value ? value.unit : '';
  const unit = HOP_UNIT_LABELS[normalizedUnit as HopUnit] ?? normalizedUnit;
  const basis = 'basis' in value && value.basis ? ({ asIs: 'produit tel quel', dryMatter: 'matière sèche', oil: 'fraction d’huile', beer: 'bière', unknown: 'base non précisée' } as Record<string, string>)[value.basis] ?? value.basis : '';
  if (value.kind === 'range') return `${value.min}–${value.max} ${unit}${basis ? ` · ${basis}` : ''}`;
  if (value.kind === 'bound') return `${value.operator} ${value.value} ${unit}${value.limitKind ? ` · ${value.limitKind.toUpperCase()}` : ''}`;
  if (value.kind === 'point') return `${value.value} ${unit}${basis ? ` · ${basis}` : ''}`;
  return value.value;
}

function RecordFacts({ row }: { row: BrewerCatalogueLookupRecord }) {
  if (row.kind === 'hopVariety') {
    const hop = row.record as HopVariety;
    return <div className="hv55-hop-facts">
      <dl className="hv55-facts">
        <div><dt>Forme de produit</dt><dd>{hop.form === 'unknown' ? 'Non précisée' : HOP_FORM_LABELS[hop.form]}</dd></div>
        <div><dt>Origine</dt><dd>{hop.origin || 'Non renseignée'}</dd></div>
        <div><dt>Alias</dt><dd>{hop.aliases.length ? hop.aliases.join(', ') : 'Aucun alias attribué'}</dd></div>
        <div><dt>Analyses directes</dt><dd>{hop.analysis.length ? `${hop.analysis.length} valeur(s)` : 'Aucune analyse consignée'}</dd></div>
      </dl>
      <section className="hv55-hop-descriptions" aria-label="Descriptions sourcées de la variété">
        <h4>Descriptions sourcées <span>{hop.descriptions.length}</span></h4>
        {hop.descriptions.length ? hop.descriptions.map((description, index) => <article key={`${index}:${description.context}:${description.source.reference}`}>
          <p>{description.text}</p>
          <small>{contextLabel(description.context)} · {description.source.title} · {SOURCE_LABEL[description.source.kind] || description.source.kind}</small>
          <small>{description.source.author}{description.source.year ? ` · ${description.source.year}` : ''} · {sourceLink(description.source.reference)}{description.source.locator ? ` · ${description.source.locator}` : ''}</small>
        </article>) : <p className="hv55-muted">Aucune description attribuée.</p>}
      </section>
    </div>;
  }
  if (row.kind === 'yeastStrain') {
    const yeast = row.record as HopYeast;
    return <dl className="hv55-facts">
      <div><dt>β-lyase</dt><dd>{yeast.betaLyase === 'unknown' ? 'Non documentée' : yeast.betaLyase === 'positive' ? 'Positive' : 'Négative'}</dd></div>
      <div><dt>Forme</dt><dd>{yeast.form || 'Non renseignée'}</dd></div>
      <div><dt>Source de la fiche</dt><dd>{yeast.source.title} · {sourceLink(yeast.source.reference)}</dd></div>
      <div><dt>Informations produit</dt><dd>{yeast.catalogue ? 'Documentées' : 'Non renseignées'}</dd></div>
    </dl>;
  }
  const guide = row.record as BrewingStyleGuide;
  const selected = row.styleId ? guide.styles.filter(style => style.id === row.styleId) : guide.styles;
  return <div className="hv55-stylefacts">
    <p><strong>{guide.edition}</strong> · version {guide.version} · {guide.enabled ? 'actif' : 'inactif'}</p>
    {selected.map(style => <section className="hv55-stylefact" key={style.id}>
      <h4>{style.name} <span>{style.code} · {style.family}</span></h4>
      <dl className="hv55-facts">
        {(['og', 'fg', 'abv', 'ibu', 'srm'] as const).map(key => <div key={key}>
          <dt>{key.toUpperCase()}</dt><dd>{style.stats[key] ? `${style.stats[key]!.min}–${style.stats[key]!.max} ${STYLE_STAT_OPTIONS.find(option => option.key === key)?.unit}` : 'Non renseigné'}</dd>
        </div>)}
      </dl>
    </section>)}
  </div>;
}

function RecordDetails({ row }: { row: BrewerCatalogueLookupRecord }) {
  const meta = row.record.catalogueMeta;
  const claims = meta?.claims ?? [];
  const repetitions = new Map<string, Set<string>>();
  claims.forEach(claim => {
    const values = repetitions.get(claim.property) ?? new Set<string>();
    values.add(claim.reported); repetitions.set(claim.property, values);
  });
  return <div className="hv55-record-detail">
    <RecordFacts row={row} />
    <section className="hv55-claims" aria-label="Assertions sourcées">
      <h4>Assertions et sources <span>{claims.length}</span></h4>
      {claims.length === 0 && <p className="hv55-muted">Aucune assertion additionnelle. Les champs inconnus restent visibles.</p>}
      {claims.map(claim => {
        const divergent = (repetitions.get(claim.property)?.size ?? 0) > 1;
        const conflict = divergent || !!claim.conflictGroupId;
        return <article key={claim.id} className={`hv55-claim${conflict ? ' is-conflict' : ''}`}>
          <div className="hv55-claim-head"><strong>{claim.label || 'Donnée sourcée'}</strong><span>{EPISTEMIC_LABEL[claim.epistemic] || claim.epistemic}</span></div>
          {conflict && <p className="hv55-conflict-label">{divergent ? 'Valeurs rapportées divergentes' : 'Groupe de conflit renseigné'} · aucune assertion n’est effacée.</p>}
          <p>{claim.reported}</p>
          {formatNormalized(claim.normalized) && <p className="hv55-normalized">Valeur structurée · {formatNormalized(claim.normalized)}</p>}
          <small>{claim.source.title} · {SOURCE_LABEL[claim.source.kind] || claim.source.kind}</small>
          <small>{claim.source.author}{claim.source.year ? ` · ${claim.source.year}` : ''} · {sourceLink(claim.source.reference)}{claim.source.locator ? ` · ${claim.source.locator}` : ''}</small>
          {(claim.dates.publishedAt || claim.dates.retrievedAt || claim.dates.observedAt) && <small>
            {claim.dates.publishedAt ? `Publiée ${claim.dates.publishedAt}` : ''}{claim.dates.retrievedAt ? ` · consultée ${claim.dates.retrievedAt}` : ''}{claim.dates.observedAt ? ` · observée ${claim.dates.observedAt}` : ''}
          </small>}
          {claim.context !== undefined && <small>Contexte · {contextLabel(claim.context) ?? JSON.stringify(claim.context)}</small>}
          <details><summary>Détails de l’assertion</summary><div className="hv55-technical-meta">
            <small>Portée · <code>{claim.scope}</code> · propriété · <code>{claim.property}</code> · ID · <code>{claim.id}</code></small>
            <small>Enregistrée · {claim.dates.recordedAt}</small>
            {claim.confidence && <small>Confiance déclarée · {claim.confidence}</small>}
            {claim.method && <small>Méthode · {claim.method}</small>}
            {claim.rawValue !== undefined && <details><summary>Valeur brute conservée</summary><pre>{JSON.stringify(claim.rawValue, null, 2)}</pre></details>}
          </div></details>
        </article>;
      })}
    </section>
    {!!meta?.projections.length && <section className="hv55-claims">
      <h4>Choix de projection conservés</h4>
      {meta.projections.map(decision => <details className="hv55-projection" key={decision.id}>
        <summary>{decision.mode === 'legacy' ? 'Champ de la fiche mis à jour' : 'Donnée liée à un scénario'}</summary>
        <p>{decision.reason}</p><small>Cible technique · <code>{decision.targetField}</code> · décision · <code>{decision.id}</code> · assertion · <code>{decision.claimId}</code></small>
        {decision.previousValue !== undefined && <><br /><small>Valeur remplacée conservée : {JSON.stringify(decision.previousValue)}</small></>}
      </details>)}
    </section>}
    {!!meta?.unmapped.length && <details className="hv55-raw">
      <summary>Valeurs sources non projetées · {meta.unmapped.length}</summary>
      {meta.unmapped.map(value => <article key={value.id}><strong>{value.sourcePath}</strong><p>{value.reason}</p><pre>{JSON.stringify(value.rawValue, null, 2)}</pre>
        {value.source && <small>{value.source.title} · {sourceLink(value.source.reference)}</small>}</article>)}
    </details>}
    <details className="hv55-raw"><summary>Fiche canonique complète</summary><pre>{JSON.stringify(row.record, null, 2)}</pre></details>
  </div>;
}

function SourceFields({ value, onChange, required }: { value: SourceDraft; onChange(next: SourceDraft): void; required: boolean }) {
  const patch = (key: keyof SourceDraft) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange({ ...value, [key]: event.target.value });
  return <fieldset className="hv55-fieldset">
    <legend>Source {required ? 'requise' : 'de la donnée'}</legend>
    <div className="hv55-grid two">
      <label>Titre<Input value={value.title} onChange={patch('title')} placeholder="Document ou observation" /></label>
      <label>Auteur<Input value={value.author} onChange={patch('author')} placeholder="Auteur indiqué par la source" /></label>
      <label>Nature<select value={value.kind} onChange={patch('kind')}><option value="">Choisir…</option>{Object.entries(SOURCE_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>Année, si connue<Input inputMode="numeric" value={value.year} onChange={patch('year')} placeholder="Inconnue" /></label>
    </div>
    <label>Référence<Input value={value.reference} onChange={patch('reference')} placeholder="URL, DOI, référence de certificat…" /></label>
    <label>Emplacement, si utile<Input value={value.locator} onChange={patch('locator')} placeholder="Page, tableau, numéro de lot…" /></label>
  </fieldset>;
}

type GuidedField = 'alias' | 'form' | 'analysis' | 'description' | 'yeastForm' | 'temperature' | 'attenuation' |
  'flocculation' | 'alcoholTolerance' | 'betaLyase' | 'styleAlias' | 'styleStat' | 'styleDescription';
type GuidedDefinition = { scope: string; property: string; label: string; normalizedKind: ClaimDraft['normalizedKind']; target?: string; unit?: string };

const GUIDED_FIELD_LABELS: Record<BrewerCatalogueKind, Partial<Record<GuidedField, string>>> = {
  hopVariety: { alias: 'Alias ou autre nom exact', form: 'Forme de produit', analysis: 'Analyse du houblon', description: 'Description liée à son contexte' },
  yeastStrain: { alias: 'Alias ou code de souche', yeastForm: 'Forme indiquée par la source', temperature: 'Plage de fermentation', attenuation: 'Atténuation apparente',
    flocculation: 'Floculation', alcoholTolerance: 'Tolérance à l’alcool', betaLyase: 'Activité β-lyase', description: 'Description issue d’une source' },
  brewingStyle: { styleAlias: 'Alias du style', styleStat: 'Statistique du style', styleDescription: 'Description du style' }
};

const GUIDED_FIELD_ORDER: Record<BrewerCatalogueKind, GuidedField[]> = {
  hopVariety: ['alias', 'form', 'analysis', 'description'],
  yeastStrain: ['alias', 'yeastForm', 'temperature', 'attenuation', 'flocculation', 'alcoholTolerance', 'betaLyase', 'description'],
  brewingStyle: ['styleAlias', 'styleStat', 'styleDescription']
};

const YEAST_FIELD_LABEL: Partial<Record<GuidedField, string>> = {
  temperature: 'Température de fermentation', attenuation: 'Atténuation apparente', flocculation: 'Floculation', alcoholTolerance: 'Tolérance à l’alcool', betaLyase: 'Activité β-lyase'
};
const GUIDED_PROJECTION_REASON = 'Valeur rapportée par la source et retenue pour cette fiche.';

function guidedDefinition(kind: BrewerCatalogueKind, field: GuidedField, dynamicValue = '', styleId?: string): GuidedDefinition {
  if (field === 'alias') return { scope: 'identity', property: 'identity.alias', label: 'Alias exact', normalizedKind: 'text', target: kind === 'brewingStyle' ? undefined : 'identity.alias' };
  if (field === 'form' && kind === 'hopVariety') return { scope: 'variety', property: 'hop.form', label: 'Forme de produit', normalizedKind: 'category', target: 'form' };
  if (field === 'analysis' && kind === 'hopVariety') return { scope: 'variety', property: dynamicValue ? `analysis.${dynamicValue}` : '', label: dynamicValue ? `Analyse · ${HOP_ANALYTE_LABELS[dynamicValue as keyof typeof HOP_ANALYTE_LABELS]}` : 'Analyse du houblon', normalizedKind: 'none', target: dynamicValue ? `analysis.${dynamicValue}` : undefined };
  if (field === 'description' && kind === 'hopVariety') return { scope: 'variety', property: 'hop.description', label: 'Description de variété', normalizedKind: 'text', target: 'hop.description' };
  if (field === 'yeastForm' && kind === 'yeastStrain') return { scope: 'strain', property: 'yeast.form', label: 'Forme de culture', normalizedKind: 'category' };
  if (['temperature', 'attenuation', 'flocculation', 'alcoholTolerance'].includes(field) && kind === 'yeastStrain') {
    const key = field as 'temperature' | 'attenuation' | 'flocculation' | 'alcoholTolerance';
    const units = { temperature: '°C', attenuation: '%', flocculation: '', alcoholTolerance: '% vol' };
    return { scope: 'strain', property: `yeast.${key}`, label: YEAST_FIELD_LABEL[key]!, normalizedKind: key === 'flocculation' ? 'text' : 'none',
      target: `reviewedDocumentary.technicalSelections.${key}`, unit: units[key] };
  }
  if (field === 'betaLyase' && kind === 'yeastStrain') return { scope: 'strain', property: 'yeast.betaLyase', label: 'Activité β-lyase', normalizedKind: 'category', target: 'betaLyase' };
  if (field === 'description' && kind === 'yeastStrain') return { scope: 'strain', property: 'yeast.description', label: 'Description de souche', normalizedKind: 'text' };
  if (field === 'styleAlias' && kind === 'brewingStyle') return { scope: styleId ? `style:${styleId}` : 'style', property: styleId ? `style.${styleId}.identity.alias` : 'style.identity.alias', label: 'Alias de style', normalizedKind: 'text',
    target: styleId ? `styles.${styleId}.aliases` : undefined };
  if (field === 'styleStat' && kind === 'brewingStyle') {
    const key = dynamicValue as 'og' | 'fg' | 'abv' | 'ibu' | 'srm';
    const units = { og: 'SG', fg: 'SG', abv: '% vol', ibu: 'IBU', srm: 'SRM' };
    return { scope: styleId ? `style:${styleId}` : 'style', property: styleId && key ? `style.${styleId}.stats.${key}` : key ? `style.stats.${key}` : '',
      label: key ? `Statistique · ${STYLE_STAT_OPTIONS.find(option => option.key === key)?.label}` : 'Plage de statistique de style', normalizedKind: 'range', target: styleId && key ? `styles.${styleId}.stats.${key}` : undefined, unit: key ? units[key] : '' };
  }
  if (field === 'styleDescription' && kind === 'brewingStyle') return { scope: styleId ? `style:${styleId}` : 'style', property: styleId ? `style.${styleId}.description` : 'style.description', label: 'Description de style', normalizedKind: 'text' };
  return { scope: '', property: '', label: '', normalizedKind: 'none' };
}

function contextLabel(context: unknown): string | undefined {
  const labels = { rawHop: 'Houblon brut', infusion: 'Infusion', beer: 'Bière', unspecified: 'Contexte non précisé' } as Record<string, string>;
  if (typeof context === 'string') return labels[context] ?? context;
  if (!context || typeof context !== 'object' || Array.isArray(context)) return undefined;
  const row = context as Record<string, unknown>;
  const sensory = typeof row.sensoryContext === 'string' ? labels[row.sensoryContext] ?? row.sensoryContext : undefined;
  const conditions = typeof row.conditions === 'string' ? row.conditions : undefined;
  return [sensory, conditions].filter(Boolean).join(' · ') || JSON.stringify(context);
}

function basisForGuidedUnit(unit: string): HopMeasurement['basis'] | undefined {
  if (unit === 'percentOil') return 'oil';
  if (['ngL', 'ugL', 'ugLInternalStandardEquivalent'].includes(unit)) return 'beer';
  return undefined;
}

const HOP_THIOL_ANALYTES = new Set(['4mmpFree', '4mmpCys', '4mmpGsh', '3mhFree', '3mhCys', '3mhGsh', '3mhGluCys', '3mhCysGly', '3s4mpFree', '3mhaFree']);
function guidedHopUnits(analyte: string, showAll: boolean): HopUnit[] {
  const compatible = HOP_UNITS.filter(unit => unit !== 'unknown' &&
    (unit !== 'index' || analyte === 'hsi') && (unit === 'index' || analyte !== 'hsi') &&
    (unit !== 'ugKgThiolEquivalent' || HOP_THIOL_ANALYTES.has(analyte)));
  if (showAll) return compatible;
  const suggested = analyte === 'hsi' ? ['index'] : ['alpha', 'beta'].includes(analyte) ? ['percentMass']
    : analyte === 'totalOil' ? ['ml100g']
      : ['ugKg', ...(HOP_THIOL_ANALYTES.has(analyte) ? ['ugKgThiolEquivalent'] : []), 'ngL', 'ugL'];
  return compatible.filter(unit => suggested.includes(unit));
}

function freshGuidedClaim(): ClaimDraft {
  return { ...freshClaim(), scope: '', property: '', label: '', normalizedKind: 'none', projectionMode: 'none', targetField: '' };
}

function GuidedClaimFields({ kind, operation, draft, onChange, styleId }: {
  kind: BrewerCatalogueKind; operation: 'create' | 'enrich'; draft: ClaimDraft; onChange(next: ClaimDraft): void; styleId?: string;
}) {
  const [field, setField] = useState<GuidedField | ''>('');
  const [analyte, setAnalyte] = useState('');
  const [showAllUnits, setShowAllUnits] = useState(false);
  const [styleStat, setStyleStat] = useState('');
  const definition = field ? guidedDefinition(kind, field, field === 'analysis' ? analyte : styleStat, styleId) : null;
  const patch = (changes: Partial<ClaimDraft>) => onChange({ ...draft, ...changes });
  const chooseField = (next: GuidedField | '') => {
    setField(next); setAnalyte(''); setStyleStat(''); setShowAllUnits(false);
    if (!next) return;
    const nextDefinition = guidedDefinition(kind, next, '', styleId);
    patch({ scope: nextDefinition.scope, property: nextDefinition.property, label: nextDefinition.label,
      normalizedKind: nextDefinition.normalizedKind, value: '', min: '', max: '', reported: '', unit: nextDefinition.unit ?? '',
      basis: '', qualifier: '', confidence: '', context: '', sensoryContext: 'unspecified', method: '', projectionMode: nextDefinition.target ? 'legacy' : 'none',
      targetField: nextDefinition.target ?? '', projectionReason: nextDefinition.target ? GUIDED_PROJECTION_REASON : draft.projectionReason });
  };
  const setDynamic = (which: 'analysis' | 'style', value: string) => {
    if (which === 'analysis') { setAnalyte(value); setShowAllUnits(false); } else setStyleStat(value);
    if (!definition) return;
    const nextDefinition = guidedDefinition(kind, field as GuidedField, value, styleId);
    patch({ scope: nextDefinition.scope, property: nextDefinition.property, label: nextDefinition.label, normalizedKind: nextDefinition.normalizedKind,
      unit: nextDefinition.unit ?? '', targetField: nextDefinition.target ?? '', projectionMode: nextDefinition.target ? 'legacy' : 'none',
      value: '', min: '', max: '', reported: '', confidence: '', basis: '', projectionReason: nextDefinition.target ? GUIDED_PROJECTION_REASON : draft.projectionReason });
  };
  const factual = !!draft.epistemic && !['estimate', 'hypothesis', 'modelOutput'].includes(draft.epistemic);
  const canProject = !!definition?.target && factual && projectionTargets(kind, {
    id: draft.id, scope: draft.scope || 'unknown', property: draft.property || 'unknown', reported: draft.reported || 'unknown',
    epistemic: (draft.epistemic || 'measured') as BrewerCatalogueClaim['epistemic'], source: { title: '', author: '', year: null, kind: 'judgment', reference: '' },
    dates: { recordedAt: draft.recordedAt }, ...(draft.normalizedKind === 'point' && draft.value ? { normalized: { kind: 'point' as const, value: Number(draft.value.replace(',', '.')), unit: draft.unit || 'unknown', ...(draft.basis ? { basis: draft.basis } : {}) } } : {}),
    ...(draft.normalizedKind === 'range' && draft.min && draft.max ? { normalized: { kind: 'range' as const, min: Number(draft.min.replace(',', '.')), max: Number(draft.max.replace(',', '.')), unit: draft.unit || 'unknown', ...(draft.basis ? { basis: draft.basis } : {}) } } : {}),
    ...(draft.normalizedKind === 'text' && draft.value ? { normalized: { kind: 'text' as const, value: draft.value } } : {}),
    ...(draft.normalizedKind === 'category' && draft.value ? { normalized: { kind: 'category' as const, value: draft.value } } : {}),
    ...(draft.confidence ? { confidence: draft.confidence as BrewerCatalogueClaim['confidence'] } : {}),
    ...(draft.property === 'hop.description' ? { context: { sensoryContext: draft.sensoryContext, ...(draft.context.trim() ? { conditions: draft.context.trim() } : {}) } }
      : draft.context.trim() ? { context: draft.context.trim() } : {})
  }, styleId).includes(definition.target);
  const updateEpistemic = (epistemic: string) => {
    const promotes = !['estimate', 'hypothesis', 'modelOutput'].includes(epistemic);
    patch({ epistemic, projectionMode: definition?.target && promotes ? 'legacy' : 'none', targetField: promotes ? definition?.target ?? '' : '',
      projectionReason: definition?.target && promotes ? GUIDED_PROJECTION_REASON : draft.projectionReason });
  };
  const setText = (value: string, keepReported = true) => patch({ normalizedKind: 'text', value, ...(keepReported ? { reported: value } : {}) });
  const setCategory = (value: string, reported = value) => patch({ normalizedKind: 'category', value, reported });

  return <section className="hv55-guided-claim" aria-label="Saisie guidée d’une donnée sourcée">
    <label>Renseignement à ajouter<select aria-label="Renseignement à ajouter" value={field} onChange={event => chooseField(event.target.value as GuidedField | '')}>
      <option value="">Choisir une famille de donnée…</option>
      {GUIDED_FIELD_ORDER[kind].filter(item => !(kind === 'brewingStyle' && !styleId && ['styleStat', 'styleAlias'].includes(item))).map(item => <option key={item} value={item}>{GUIDED_FIELD_LABELS[kind][item]}</option>)}
    </select></label>
    {field && definition && <>
      {field === 'analysis' && <label>Composé mesuré<select required aria-label="Composé mesuré" value={analyte} onChange={event => setDynamic('analysis', event.target.value)}>
        <option value="">Choisir un composé…</option>{HOP_ANALYTES.map(item => <option key={item} value={item}>{HOP_ANALYTE_LABELS[item]}</option>)}
      </select></label>}
      {field === 'styleStat' && <label>Statistique<select required aria-label="Statistique" value={styleStat} onChange={event => setDynamic('style', event.target.value)}>
        <option value="">Choisir une statistique…</option>{[['og','Densité initiale (OG)'],['fg','Densité finale (FG)'],['abv','Alcool (ABV)'],['ibu','Amertume (IBU)'],['srm','Couleur (SRM)']].map(([key,label]) => <option key={key} value={key}>{label}</option>)}
      </select></label>}
      {field === 'description' && kind === 'hopVariety' && <label>Contexte de la description<select aria-label="Contexte de la description" value={draft.sensoryContext} onChange={event => patch({ sensoryContext: event.target.value as HopDescription['context'] })}>
        <option value="rawHop">Houblon brut</option><option value="infusion">Infusion</option><option value="beer">Bière</option><option value="unspecified">Contexte non précisé</option>
      </select></label>}
      {field === 'description' && kind === 'hopVariety' && <label>Conditions détaillées de la source, si utiles<Input value={draft.context} onChange={event => patch({ context: event.target.value })} placeholder="Conditions rapportées, sans remplacer le contexte sensoriel" /></label>}
      {field === 'alias' || field === 'styleAlias' ? <label>Alias exact<Input value={draft.value} onChange={event => { patch({ normalizedKind: 'text', value: event.target.value, reported: event.target.value }); }} placeholder="Transcrire le nom ou code de la source" /></label> : null}
      {field === 'description' || field === 'styleDescription' ? <label>Description transcrite de la source<Textarea value={draft.value} onChange={event => setText(event.target.value)} rows={3} placeholder="Garder les mots et conditions de la source" /></label> : null}
      {field === 'form' && <label>Forme indiquée<select aria-label="Forme indiquée" value={draft.value} onChange={event => setCategory(event.target.value, HOP_FORM_LABELS[event.target.value as HopVariety['form']] || event.target.value)}>
        <option value="">Choisir une forme…</option>{HOP_FORMS.filter(item => item !== 'unknown').map(item => <option key={item} value={item}>{HOP_FORM_LABELS[item]}</option>)}
      </select></label>}
      {field === 'yeastForm' && <label>Forme indiquée<select aria-label="Forme indiquée" value={draft.value} onChange={event => setCategory(event.target.value)}>
        <option value="">Choisir une forme…</option><option value="sèche">Sèche</option><option value="liquide">Liquide</option><option value="levain">Levain</option>
      </select></label>}
      {field === 'betaLyase' && <label>Résultat rapporté<select aria-label="Résultat rapporté" value={draft.value} onChange={event => setCategory(event.target.value)}>
        <option value="">Choisir…</option><option value="positive">Positive</option><option value="negative">Négative</option><option value="unknown">Non déterminée par la source</option>
      </select></label>}
      {field === 'flocculation' && <label>Terme rapporté<Input value={draft.value} onChange={event => { setText(event.target.value); }} placeholder="Transcrire le terme de la source" /></label>}
      {field === 'analysis' && <>
        {analyte && <label>Type de résultat<select aria-label="Type de résultat" value={draft.normalizedKind === 'point' || draft.normalizedKind === 'range' ? draft.normalizedKind : ''} onChange={event => patch({ normalizedKind: event.target.value as ClaimDraft['normalizedKind'], value: '', min: '', max: '' })}>
          <option value="">Choisir…</option><option value="point">Valeur ponctuelle</option><option value="range">Plage publiée</option>
        </select></label>}
        {analyte && draft.normalizedKind === 'point' && <label>Valeur exacte<Input inputMode="decimal" value={draft.value} onChange={event => patch({ value: event.target.value })} placeholder="Valeur de la source" /></label>}
        {analyte && draft.normalizedKind === 'range' && <div className="hv55-grid two"><label>Minimum publié<Input inputMode="decimal" value={draft.min} onChange={event => patch({ min: event.target.value })} placeholder="Borne basse publiée" /></label><label>Maximum publié<Input inputMode="decimal" value={draft.max} onChange={event => patch({ max: event.target.value })} placeholder="Borne haute publiée" /></label></div>}
        {analyte && <>
          <label>Unité suggérée<select aria-label="Unité de mesure" value={draft.unit} onChange={event => patch({ unit: event.target.value, basis: basisForGuidedUnit(event.target.value) ?? '' })}>
            <option value="">Choisir l’unité…</option>{guidedHopUnits(analyte, showAllUnits).map(unit => <option key={unit} value={unit}>{HOP_UNIT_LABELS[unit]}</option>)}
          </select></label>
          <label className="hv55-check"><input type="checkbox" checked={showAllUnits} onChange={event => setShowAllUnits(event.target.checked)} />Afficher les autres unités autorisées par le schéma</label>
        </>}
        {analyte && <label>Base de mesure<select aria-label="Base de mesure" value={draft.basis || 'unknown'} onChange={event => patch({ basis: event.target.value === 'unknown' ? '' : event.target.value })}>
          <option value="unknown">Non précisée</option><option value="asIs">Produit tel quel</option><option value="dryMatter">Matière sèche</option><option value="oil">Fraction d’huile</option><option value="beer">Bière</option>
        </select></label>}
        {analyte && <label>Confiance d’analyse<select aria-label="Confiance d’analyse" value={draft.confidence} onChange={event => patch({ confidence: event.target.value, projectionMode: event.target.value && factual ? 'legacy' : 'none' })}>
          <option value="">À préciser</option><option value="low">Faible</option><option value="medium">Moyenne</option><option value="high">Élevée</option>
        </select></label>}
        {analyte && <label>Méthode analytique, si indiquée<Input value={draft.method} onChange={event => patch({ method: event.target.value })} placeholder="Méthode citée par la source" /></label>}
      </>}
      {['temperature', 'attenuation', 'alcoholTolerance'].includes(field) && <>
        <label>Type de valeur<select aria-label="Type de valeur" value={draft.normalizedKind === 'point' || draft.normalizedKind === 'range' ? draft.normalizedKind : ''} onChange={event => patch({ normalizedKind: event.target.value as ClaimDraft['normalizedKind'], value: '', min: '', max: '' })}>
          <option value="">Choisir…</option><option value="range">Plage publiée</option><option value="point">Valeur ponctuelle</option>
        </select></label>
        {draft.normalizedKind === 'point' && <label>Valeur exacte ({definition.unit})<Input inputMode="decimal" value={draft.value} onChange={event => patch({ value: event.target.value, unit: definition.unit ?? '' })} /></label>}
        {draft.normalizedKind === 'range' && <div className="hv55-grid two"><label>Minimum documenté ({definition.unit})<Input inputMode="decimal" value={draft.min} onChange={event => patch({ min: event.target.value, unit: definition.unit ?? '' })} /></label><label>Maximum documenté ({definition.unit})<Input inputMode="decimal" value={draft.max} onChange={event => patch({ max: event.target.value, unit: definition.unit ?? '' })} /></label></div>}
      </>}
      {field === 'styleStat' && styleStat && <div className="hv55-grid two"><label>Minimum ({definition.unit})<Input inputMode="decimal" value={draft.min} onChange={event => patch({ min: event.target.value })} /></label><label>Maximum ({definition.unit})<Input inputMode="decimal" value={draft.max} onChange={event => patch({ max: event.target.value })} /></label></div>}
      {['form', 'yeastForm', 'betaLyase'].includes(field) && <label>Transcription exacte de la source<Input value={draft.reported} onChange={event => patch({ reported: event.target.value })} placeholder="Mots ou code de la source" /></label>}
      {['analysis', 'temperature', 'attenuation', 'alcoholTolerance', 'styleStat'].includes(field) && <label>Valeur rapportée par la source<Input value={draft.reported} onChange={event => patch({ reported: event.target.value })} placeholder="Transcrire la formulation de la source" /></label>}
      <label>Nature de l’information<select aria-label="Nature de l’information" value={draft.epistemic} onChange={event => updateEpistemic(event.target.value)}>
        <option value="">Choisir…</option>{Object.entries(EPISTEMIC_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select></label>
      {(kind === 'yeastStrain' || kind === 'brewingStyle') && <label>Condition ou contexte, si utile<Input value={draft.context} onChange={event => patch({ context: event.target.value })} placeholder="Contexte exact indiqué par la source" /></label>}
      <fieldset className="hv55-fieldset hv55-guided-destination"><legend>Enregistrement</legend>
        {definition.target ? <label className="hv55-check"><input type="checkbox" checked={draft.projectionMode === 'legacy'} disabled={!canProject}
          onChange={event => patch({ projectionMode: event.target.checked ? 'legacy' : 'none', targetField: event.target.checked ? definition.target! : '' })} />Ajouter aussi cette donnée à la fiche · {definition.label}</label>
          : <p className="hv55-muted">L’assertion et sa source seront conservées. Aucun champ catalogue compatible n’est disponible dans le contrat lu.</p>}
        {definition.target && !canProject && <p className="hv55-muted">Pour projeter cette donnée, choisissez une nature factuelle et complétez les valeurs exigées. Une estimation ou hypothèse reste séparée.</p>}
        {draft.projectionMode === 'legacy' && definition.target && <label>Pourquoi cette donnée doit-elle devenir la valeur de la fiche ?<Input value={draft.projectionReason} onChange={event => patch({ projectionReason: event.target.value })} placeholder="Motif lié à la source et à la fiche" /></label>}
      </fieldset>
      {field === 'description' && kind === 'hopVariety' && <p className="hv55-warning">{operation === 'create' && factual && ['rawHop', 'infusion', 'beer', 'unspecified'].includes(draft.sensoryContext)
        ? 'La description, son contexte et sa source seront ajoutés à la nouvelle fiche et conservés dans l’assertion.'
        : operation === 'create' ? 'Cette information reste une assertion sourcée; une estimation ou un contexte non reconnu ne devient pas une description de fiche.'
          : 'La description et sa source s’ajoutent à la fiche sans remplacer les autres descriptions. Seul un doublon strict est ignoré.'}</p>}
      {field === 'styleStat' && !styleId && <p className="hv55-warning">Une nouvelle fiche de style n’a pas encore d’ID. Ajoutez ses plages au formulaire d’identité, ou enregistrez cette assertion sans projection.</p>}
    </>}
  </section>;
}

function UnmappedFields({ rows, onChange }: { rows: UnmappedDraft[]; onChange(next: UnmappedDraft[]): void }) {
  const patchRow = (index: number, changes: Partial<UnmappedDraft>) => onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...changes } : row));
  return <details className="hv55-advanced hv55-unmapped-entry">
    <summary>Conserver des valeurs sources hors du schéma courant</summary>
    <p className="hv55-muted">Gardez le chemin et le JSON tels que fournis. Ces valeurs restent consultables; elles ne sont pas converties en faits de calcul.</p>
    {rows.map((row, index) => <fieldset className="hv55-fieldset" key={index}>
      <legend>Valeur source {rows.length > 1 ? index + 1 : ''}</legend>
      <label>Chemin dans la source<Input value={row.sourcePath} onChange={event => patchRow(index, { sourcePath: event.target.value })} placeholder="Chemin ou nom du champ original" /></label>
      <label>Valeur brute en JSON<Textarea value={row.rawJson} onChange={event => patchRow(index, { rawJson: event.target.value })} rows={3} placeholder="Texte, nombre, tableau ou objet exact" /></label>
      <label>Pourquoi la conserver sans correspondance ?<Input value={row.reason} onChange={event => patchRow(index, { reason: event.target.value })} placeholder="Champ absent, unité non résolue…" /></label>
      <label className="hv55-check"><input type="checkbox" checked={row.sourceEnabled} onChange={event => patchRow(index, { sourceEnabled: event.target.checked })} />Ajouter la source exacte</label>
      {row.sourceEnabled && <SourceFields value={row.source} onChange={source => patchRow(index, { source })} required={false} />}
      {rows.length > 1 && <button type="button" className="secondary" onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}>Retirer cette valeur</button>}
    </fieldset>)}
    <button type="button" className="secondary" onClick={() => onChange([...rows, freshUnmapped()])}>Ajouter une autre valeur source</button>
  </details>;
}

function ClaimFields({ kind, draft, onChange, source, onSourceChange, styleId, showSourceFields = true }: {
  kind: BrewerCatalogueKind; draft: ClaimDraft; onChange(next: ClaimDraft): void;
  source: SourceDraft; onSourceChange(next: SourceDraft): void; styleId?: string; showSourceFields?: boolean;
}) {
  const patch = (key: keyof ClaimDraft) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange({ ...draft, [key]: event.target.value });
  const sourceRequired = true;
  const provisionalClaim: BrewerCatalogueClaim = {
    id: draft.id, scope: draft.scope || 'unknown', property: draft.property || 'unknown', reported: draft.reported || 'unknown',
    epistemic: (draft.epistemic || 'measured') as BrewerCatalogueClaim['epistemic'], source: { title: '', author: '', year: null, kind: 'judgment', reference: '' },
    dates: { recordedAt: draft.recordedAt }, ...(draft.normalizedKind === 'range' && draft.min && draft.max ? { normalized: { kind: 'range' as const, min: Number(draft.min), max: Number(draft.max), unit: draft.unit || 'unknown' } } : {}),
    ...(draft.normalizedKind === 'category' && draft.value ? { normalized: { kind: 'category' as const, value: draft.value } } : {}),
    ...(draft.confidence ? { confidence: draft.confidence as BrewerCatalogueClaim['confidence'] } : {}),
    ...(draft.property === 'hop.description' ? { context: { sensoryContext: draft.sensoryContext, ...(draft.context.trim() ? { conditions: draft.context.trim() } : {}) } }
      : draft.context.trim() ? { context: draft.context.trim() } : {})
  };
  const targets = projectionTargets(kind, provisionalClaim, styleId);
  const canLegacy = targets.length > 0;
  const patchNormalization = (key: keyof ClaimDraft) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...draft, [key]: event.target.value });
  return <div className="hv55-claim-editor">
    <div className="hv55-grid two">
      <label>Portée<Input value={draft.scope} onChange={patch('scope')} placeholder={kind === 'hopVariety' ? 'variety' : kind === 'yeastStrain' ? 'strain' : 'style'} /></label>
      <label>Propriété<Input value={draft.property} onChange={patch('property')} placeholder="Propriété ouverte, ex. yeast.technical.attenuation" /></label>
    </div>
    <label>Nom lisible, si utile<Input value={draft.label} onChange={patch('label')} placeholder="Nom affiché pour cette donnée" /></label>
    <label>Valeur rapportée<Textarea value={draft.reported} onChange={patch('reported')} rows={2} placeholder="Transcrire la valeur ou description de la source" /></label>
    {kind === 'hopVariety' && draft.property === 'hop.description' && <label>Contexte sensoriel (saisie avancée)<select value={draft.sensoryContext} onChange={event => onChange({ ...draft, sensoryContext: event.target.value as HopDescription['context'] })}>
      <option value="rawHop">Houblon brut</option><option value="infusion">Infusion</option><option value="beer">Bière</option><option value="unspecified">Contexte non précisé</option>
    </select></label>}
    <label>{kind === 'hopVariety' && draft.property === 'hop.description' ? 'Contexte détaillé (mode avancé)' : 'Contexte ou conditions rapportés, si utiles'}<Input value={draft.context} onChange={patch('context')} placeholder="Contexte exact de la donnée" /></label>
    <div className="hv55-grid two">
      <label>Nature de la donnée<select value={draft.epistemic} onChange={patch('epistemic')}><option value="">Choisir…</option>{Object.entries(EPISTEMIC_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>Valeur structurée<select value={draft.normalizedKind} onChange={patchNormalization('normalizedKind')}>
        <option value="none">Aucune · texte seul</option><option value="text">Texte</option><option value="category">Catégorie</option><option value="point">Valeur ponctuelle</option><option value="range">Plage</option><option value="bound">Borne ouverte</option>
      </select></label>
    </div>
    {(draft.normalizedKind === 'text' || draft.normalizedKind === 'category') && <label>Valeur normalisée<Input value={draft.value} onChange={patch('value')} /></label>}
    {(draft.normalizedKind === 'point' || draft.normalizedKind === 'bound') && <div className="hv55-grid two">
      {draft.normalizedKind === 'bound' && <label>Opérateur<select value={draft.operator} onChange={patch('operator')}><option value=">=">≥</option><option value=">">&gt;</option><option value="<=">≤</option><option value="<">&lt;</option></select></label>}
      <label>Valeur<Input inputMode="decimal" value={draft.value} onChange={patch('value')} placeholder="À saisir" /></label>
      <label>Unité<Input value={draft.unit} onChange={patch('unit')} placeholder="Ex. % vol, IBU, ng/L" /></label>
    </div>}
    {draft.normalizedKind === 'range' && <div className="hv55-grid two">
      <label>Minimum<Input inputMode="decimal" value={draft.min} onChange={patch('min')} placeholder="Borne basse" /></label>
      <label>Maximum<Input inputMode="decimal" value={draft.max} onChange={patch('max')} placeholder="Borne haute" /></label>
      <label>Unité<Input value={draft.unit} onChange={patch('unit')} placeholder="Ex. % vol, IBU, ng/L" /></label>
    </div>}
    {(draft.normalizedKind === 'point' || draft.normalizedKind === 'range' || draft.normalizedKind === 'bound') && <div className="hv55-grid two">
      <label>Base, si connue<Input value={draft.basis} onChange={patch('basis')} placeholder="Non renseignée" /></label>
      <label>Qualificatif, si utile<Input value={draft.qualifier} onChange={patch('qualifier')} placeholder="Ex. matière sèche" /></label>
      {draft.normalizedKind === 'bound' && <label>Limite<select value={draft.limitKind} onChange={patch('limitKind')}><option value="">Sans précision</option><option value="lod">LOD</option><option value="loq">LOQ</option></select></label>}
    </div>}
    {(kind === 'hopVariety' && (draft.property.startsWith('hop.') || draft.property.startsWith('analysis.')) || draft.projectionMode === 'legacy' && kind === 'hopVariety') && <label>Confiance requise pour une analyse HOP<select value={draft.confidence} onChange={patch('confidence')}><option value="">Non renseignée</option><option value="low">Faible</option><option value="medium">Moyenne</option><option value="high">Élevée</option></select></label>}
    {draft.normalizedKind === 'bound' && <p className="hv55-muted">Une borne décrit une limite rapportée. Elle ne devient pas une concentration mesurée.</p>}
    {showSourceFields && <SourceFields value={source} onChange={onSourceChange} required={sourceRequired} />}
    <fieldset className="hv55-fieldset">
      <legend>Dates de la donnée, si connues</legend>
      <div className="hv55-grid three">
        <label>Publication<input type="date" value={draft.publishedAt} onChange={patch('publishedAt')} /></label>
        <label>Consultation<input type="date" value={draft.retrievedAt} onChange={patch('retrievedAt')} /></label>
        <label>Observation<input type="date" value={draft.observedAt} onChange={patch('observedAt')} /></label>
      </div>
    </fieldset>
    <details className="hv55-advanced"><summary>Valeur brute et méthode, si la source les fournit</summary>
      <label>JSON brut facultatif<Textarea value={draft.rawJson} onChange={patch('rawJson')} rows={2} placeholder="Ex. { &quot;valeurOriginale&quot;: &quot;…&quot; }" /></label>
      <label>Méthode, si indiquée<Input value={draft.method} onChange={patch('method')} placeholder="Méthode annoncée par la source" /></label>
    </details>
    <fieldset className="hv55-fieldset">
      <legend>Projection explicite</legend>
      <label className="hv55-radio"><input type="radio" name="hv55-projection" checked={draft.projectionMode === 'none'} onChange={() => onChange({ ...draft, projectionMode: 'none', targetField: '' })} />Conserver l’assertion sourcée sans projection</label>
      <label className="hv55-radio"><input type="radio" name="hv55-projection" checked={draft.projectionMode === 'scenario'} onChange={() => onChange({ ...draft, projectionMode: 'scenario', targetField: '' })} />Conserver comme donnée de scénario, sans remplacer un fait.</label>
      <label className={`hv55-radio${canLegacy ? '' : ' is-disabled'}`}><input type="radio" name="hv55-projection" checked={draft.projectionMode === 'legacy'} disabled={!canLegacy} onChange={() => onChange({ ...draft, projectionMode: 'legacy', targetField: targets[0] || '' })} />Projeter vers un champ catalogue compatible.</label>
      {draft.projectionMode === 'legacy' && canLegacy && <div className="hv55-grid two">
        <label>Champ cible<select value={draft.targetField} onChange={patch('targetField')}>{targets.map(target => <option key={target}>{target}</option>)}</select></label>
        <label>Pourquoi appliquer cette projection ?<Input value={draft.projectionReason} onChange={patch('projectionReason')} placeholder="Motif documenté" /></label>
      </div>}
      {!canLegacy && <p className="hv55-muted">Aucun champ direct compatible avec ces propriétés et cette valeur. L’assertion reste consultable et peut alimenter un scénario.</p>}
    </fieldset>
  </div>;
}

export function HopV55Catalogue({ services, onCanonicalRecord, onUseRecord }: Props) {
  const [kind, setKind] = useState<BrewerCatalogueKind>('hopVariety');
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<BrewerCatalogueLookupRecord[]>([]);
  const [collisionRecords, setCollisionRecords] = useState<BrewerCatalogueLookupRecord[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [searching, setSearching] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [mode, setMode] = useState<Mode>('browse');
  const [selected, setSelected] = useState<BrewerCatalogueLookupRecord | null>(null);
  const [create, setCreate] = useState<CreateDraft>(() => freshCreate());
  const [claim, setClaim] = useState<ClaimDraft>(() => freshClaim());
  const [source, setSource] = useState<SourceDraft>(() => freshSource());
  const [unmappedDrafts, setUnmappedDrafts] = useState<UnmappedDraft[]>(() => [freshUnmapped()]);
  const [addInitialClaim, setAddInitialClaim] = useState(false);
  const [nextStyleVersion, setNextStyleVersion] = useState('');
  const [writing, setWriting] = useState(false);
  const [writeError, setWriteError] = useState('');
  const [notice, setNotice] = useState('');
  const [identityCandidates, setIdentityCandidates] = useState<BrewerCatalogueIdentityCandidate[]>([]);
  const [identityReason, setIdentityReason] = useState('');
  const operationIds = useRef(new Map<string, string>());
  const claimIds = useRef(new Map<string, string>());
  const projectionIds = useRef(new Map<string, string>());
  const unmappedIds = useRef(new Map<string, string>());
  const requestGeneration = useRef(0);
  const skipSearchEffect = useRef<string | null>(null);

  useEffect(() => {
    const text = query.trim();
    if (!text) { setRecords([]); setTruncated(false); setLookupError(''); setSearching(false); return; }
    const key = `${kind}:${text}`;
    if (skipSearchEffect.current === key) { skipSearchEffect.current = null; return; }
    let live = true;
    const generation = ++requestGeneration.current;
    setSearching(true); setLookupError('');
    const timer = window.setTimeout(() => {
      services.catalogue.lookup(kind, text).then(result => {
        if (!live || generation !== requestGeneration.current) return;
        setRecords(result.records); setTruncated(result.truncated); setSearching(false);
      }).catch(error => {
        if (!live || generation !== requestGeneration.current) return;
        setLookupError(error instanceof Error ? error.message : 'Recherche du catalogue impossible.');
        setRecords([]); setTruncated(false); setSearching(false);
      });
    }, 180);
    return () => { live = false; window.clearTimeout(timer); };
  }, [kind, query, services]);

  const sourceIsRequired = kind !== 'hopVariety' || addInitialClaim;
  const selectedStyleId = selected?.kind === 'brewingStyle' ? selected.styleId : undefined;

  const selectKind = (next: BrewerCatalogueKind) => {
    setKind(next); setSelected(null); setRecords([]); setCollisionRecords([]); setTruncated(false); setSearching(!!query.trim()); setMode('browse'); setWriteError(''); setNotice('');
  };
  const openCreate = () => {
    setCreate(freshCreate(query.trim())); setSource(freshSource()); setClaim(freshGuidedClaim()); setUnmappedDrafts([freshUnmapped()]);
    setAddInitialClaim(false); setIdentityCandidates([]); setCollisionRecords([]); setIdentityReason(''); setSelected(null); setMode('create');
    setWriteError(''); setNotice('');
  };
  const openEnrich = () => {
    setClaim(freshGuidedClaim()); setSource(freshSource()); setUnmappedDrafts([freshUnmapped()]); setNextStyleVersion(''); setIdentityCandidates([]); setCollisionRecords([]);
    setIdentityReason(''); setMode('enrich'); setWriteError(''); setNotice('');
  };
  const selectRecord = (row: BrewerCatalogueLookupRecord) => {
    setSelected(row); setMode('details'); setWriteError(''); setNotice('');
  };
  const lookupNow = async (searchKind: BrewerCatalogueKind, searchText: string) => {
    const q = searchText.trim();
    if (!q) return null;
    setSearching(true); setLookupError('');
    const generation = ++requestGeneration.current;
    try {
      const found = await services.catalogue.lookup(searchKind, q);
      if (generation === requestGeneration.current) { setRecords(found.records); setTruncated(found.truncated); setSearching(false); }
      return found;
    } catch (error) {
      if (generation === requestGeneration.current) { setLookupError(error instanceof Error ? error.message : 'Recherche du catalogue impossible.'); setSearching(false); }
      return null;
    }
  };

  const buildProjection = (claimRow: BrewerCatalogueClaim, styleId?: string): BrewerCatalogueProjectionChoice[] => {
    if (claim.projectionMode === 'none') return [];
    if (claim.projectionMode === 'scenario') {
      const descriptor = { claimId: claimRow.id, targetField: 'scenario', mode: 'scenario' as const,
        reason: claim.projectionReason.trim() || 'Conservée comme donnée de scénario sans remplacer un fait.' };
      const id = getStableDraftId(projectionIds.current, JSON.stringify(descriptor));
      return [{ id, ...descriptor }];
    }
    const targets = projectionTargets(kind, claimRow, styleId);
    if (!targets.includes(claim.targetField)) throw new Error('Projection incompatible avec cette donnée. Conservation comme donnée de scénario possible; propriétés et unités à vérifier.');
    if (!claim.projectionReason.trim()) throw new Error('Le motif de projection est requis.');
    const descriptor = { claimId: claimRow.id, targetField: claim.targetField, mode: 'legacy' as const, reason: claim.projectionReason.trim() };
    const id = getStableDraftId(projectionIds.current, JSON.stringify(descriptor));
    return [{ id, ...descriptor }];
  };

  const getOperationId = (payload: Record<string, unknown>) => {
    const signature = JSON.stringify(payload);
    const current = operationIds.current.get(signature);
    if (current) return current;
    const operationId = freshId();
    operationIds.current.set(signature, operationId);
    if (operationIds.current.size > 30) operationIds.current.delete(operationIds.current.keys().next().value as string);
    return operationId;
  };

  const getStableDraftId = (ids: Map<string, string>, signature: string) => {
    const current = ids.get(signature);
    if (current) return current;
    const id = freshId();
    ids.set(signature, id);
    if (ids.size > 60) ids.delete(ids.keys().next().value as string);
    return id;
  };

  const readCollisionCandidates = async (candidates: BrewerCatalogueIdentityCandidate[]) => {
    const pages = await Promise.allSettled(candidates.map(candidate => services.catalogue.lookup(candidate.kind, candidate.id)));
    const rows: BrewerCatalogueLookupRecord[] = [];
    pages.forEach((page, index) => {
      if (page.status !== 'fulfilled') return;
      const candidate = candidates[index];
      const row = page.value.records.find(item => item.id === candidate.id && item.kind === candidate.kind);
      if (row) rows.push({ ...row, ...(candidate.styleId ? { styleId: candidate.styleId } : {}) });
    });
    if (rows.length) setCollisionRecords(current => [...rows, ...current.filter(row => !rows.some(candidate => candidate.kind === row.kind && candidate.id === row.id && candidate.styleId === row.styleId))]);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (writing) return;
    setWriting(true); setWriteError(''); setNotice('');
    try {
      const claimRows: BrewerCatalogueClaim[] = [];
      const unmapped: BrewerCatalogueUnmappedValue[] = [];
      const choices: BrewerCatalogueProjectionChoice[] = [];
      const needsClaim = mode === 'enrich' || (mode === 'create' && addInitialClaim);
      let sourceRow: HopSource | undefined;
      if (needsClaim || sourceIsRequired) sourceRow = sourceFromDraft(source);
      for (const draft of unmappedDrafts) {
        const hasContent = !!(draft.sourcePath.trim() || draft.rawJson.trim() || draft.reason.trim() || draft.sourceEnabled);
        if (!hasContent) continue;
        if (!draft.sourcePath.trim() || !draft.rawJson.trim() || !draft.reason.trim()) throw new Error('Une valeur source non mappée exige son chemin, son JSON brut et un motif de conservation.');
        let rawValue: unknown;
        try { rawValue = JSON.parse(draft.rawJson); }
        catch { throw new Error('La valeur source non mappée doit être un JSON valide.'); }
        const unmappedSource = draft.sourceEnabled ? sourceFromDraft(draft.source) : undefined;
        const value = { sourcePath: draft.sourcePath.trim(), rawValue: rawValue as BrewerCatalogueUnmappedValue['rawValue'],
          ...(unmappedSource ? { source: unmappedSource } : {}), recordedAt: draft.recordedAt, reason: draft.reason.trim() };
        const id = getStableDraftId(unmappedIds.current, JSON.stringify(value));
        unmapped.push({ id, ...value });
      }
      if (needsClaim) {
        const draftedClaim = claimFromDraft(claim, sourceRow!);
        const { id: _draftId, ...claimContent } = draftedClaim;
        const claimId = getStableDraftId(claimIds.current, JSON.stringify(claimContent));
        const claimRow = { ...draftedClaim, id: claimId };
        claimRows.push(claimRow); choices.push(...buildProjection(claimRow, selectedStyleId));
      }
      let payload: CataloguePayload;
      if (mode === 'create') {
        if (!create.name.trim()) throw new Error('Le nom de la nouvelle fiche est requis.');
        if (kind === 'hopVariety') payload = {
          schemaVersion: 1, operation: 'create', entity: { kind, value: { name: create.name.trim(), aliases: [], form: 'unknown', descriptions: [], analysis: [], ...(create.origin.trim() ? { origin: create.origin.trim() } : {}) } },
          claims: claimRows, unmapped, projectionChoices: choices,
          ...(identityCandidates.length && identityReason.trim() ? { identityResolution: { decision: 'distinct' as const, candidates: identityCandidates, reason: identityReason.trim() } } : {})
        };
        else if (kind === 'yeastStrain') payload = {
          schemaVersion: 1, operation: 'create', entity: { kind, value: { kind: 'yeast', name: create.name.trim(), betaLyase: 'unknown', source: sourceRow!, ...(create.yeastForm ? { form: create.yeastForm as HopYeast['form'] } : {}) } },
          claims: claimRows, unmapped, projectionChoices: choices,
          ...(identityCandidates.length && identityReason.trim() ? { identityResolution: { decision: 'distinct' as const, candidates: identityCandidates, reason: identityReason.trim() } } : {})
        };
        else {
          if (!create.version.trim() || !create.edition.trim() || !create.attribution.trim() || !create.styleCode.trim() || !create.styleName.trim() || !create.styleFamily.trim() || !create.enabled) {
            throw new Error('Pour un guide de style, renseignez version, édition, attribution et statut, puis code, nom et famille du style.');
          }
          let stats: BrewingStyle['stats'] = {};
          if (create.styleStat) {
            if (!create.styleStatMin.trim() || !create.styleStatMax.trim()) throw new Error('Les deux bornes de la statistique de style sont nécessaires, ou laissez le champ sans statistique.');
            const min = parseNumber(create.styleStatMin, 'Le minimum de la statistique');
            const max = parseNumber(create.styleStatMax, 'Le maximum de la statistique');
            if (min > max || min < 0) throw new Error('La plage de style doit avoir deux bornes positives dans le bon ordre.');
            const stat = create.styleStat as keyof BrewingStyle['stats'];
            stats = { [stat]: { min, max } };
          }
          payload = {
            schemaVersion: 1, operation: 'create', entity: { kind, value: {
              kind: 'styleGuide', name: create.name.trim(), version: create.version.trim(), enabled: create.enabled === 'true', edition: create.edition.trim(),
              retrievedAt: null, createdAt: create.createdAt, attribution: create.attribution.trim(), source: sourceRow!,
              styles: [{ code: create.styleCode.trim(), name: create.styleName.trim(), aliases: [], family: create.styleFamily.trim(), stats, source: sourceRow! }]
            } }, claims: claimRows, unmapped, projectionChoices: choices,
            ...(identityCandidates.length && identityReason.trim() ? { identityResolution: { decision: 'distinct' as const, candidates: identityCandidates, reason: identityReason.trim() } } : {})
          };
        }
      } else {
        if (!selected) throw new Error('Une fiche relue est requise pour l’enrichissement.');
        if (kind === 'brewingStyle' && (!selected.styleId || !nextStyleVersion.trim())) throw new Error('Un style du guide et une nouvelle version du guide sont requis.');
        payload = {
          schemaVersion: 1, operation: 'enrich', target: {
            kind, id: selected.id, expectedRevision: selected.revision, expectedFingerprint: selected.fingerprint,
            ...(kind === 'brewingStyle' ? { styleId: selected.styleId, nextVersion: nextStyleVersion.trim() } : {})
          }, claims: claimRows, unmapped, projectionChoices: choices
        };
      }
      const operationId = getOperationId(payload as Record<string, unknown>);
      const result = await services.catalogue.write({ ...payload, operationId } as BrewerCatalogueCommand);
      if ('reason' in result) {
        const candidates = result.identityCandidates ?? [];
        setWriteError(result.reason); setIdentityCandidates(candidates);
        if (candidates.length) await readCollisionCandidates(candidates);
        return;
      }
      const createdStyleId = result.kind === 'brewingStyle' && 'kind' in result.record && result.record.kind === 'styleGuide' && result.record.styles.length === 1
        ? result.record.styles[0].id : undefined;
      const canonical: BrewerCatalogueLookupRecord = {
        kind: result.kind, id: result.id, record: result.record, revision: result.revision,
        fingerprint: result.fingerprint, origin: 'persisted', ...((selected?.styleId ?? createdStyleId) ? { styleId: selected?.styleId ?? createdStyleId } : {})
      };
      onCanonicalRecord?.(canonical);
      const canonicalName = canonical.kind === 'brewingStyle' && canonical.styleId && 'kind' in canonical.record && canonical.record.kind === 'styleGuide'
        ? canonical.record.styles.find(style => style.id === canonical.styleId)?.name ?? nameOf(canonical)
        : nameOf(canonical);
      const successText = `${result.status === 'duplicate' ? 'Opération déjà appliquée' : 'Fiche enregistrée'} dans le catalogue ${result.scope === 'fixture' ? 'fixture' : 'serveur'}.`;
      setNotice(`${successText} Relecture en cours…`); setMode('details'); setSelected(canonical);
      setIdentityCandidates([]); setIdentityReason(''); setAddInitialClaim(false); setClaim(freshClaim()); setUnmappedDrafts([freshUnmapped()]);
      skipSearchEffect.current = canonicalName === query.trim() ? null : `${kind}:${canonicalName}`; setQuery(canonicalName);
      let finalRecord = canonical;
      const reread = await lookupNow(kind, canonicalName);
      const reloaded = reread?.records.find(row => row.id === result.id && row.kind === result.kind && (!canonical.styleId || row.styleId === canonical.styleId));
      if (reloaded) finalRecord = reloaded;
      else if (reread) setNotice(`${successText} La recherche après écriture n’a pas retrouvé l’identifiant ${result.id}; la réponse canonique reçue reste affichée.`);
      else setNotice(`${successText} La relecture a échoué; la réponse canonique reçue reste affichée.`);
      setSelected(finalRecord); setRecords(old => old.some(row => row.id === finalRecord.id && row.styleId === finalRecord.styleId) ? old : [finalRecord, ...old]);
      if (reloaded) setNotice(successText);
    } catch (error) {
      setWriteError(error instanceof Error ? error.message : 'Écriture du catalogue impossible.');
    } finally {
      setWriting(false);
    }
  };

  const rereadAfterConflict = async () => {
    if (!selected) return;
    const result = await lookupNow(kind, nameOf(selected));
    const latest = result?.records.find(row => row.id === selected.id && row.kind === selected.kind && (!selected.styleId || row.styleId === selected.styleId));
    if (latest) { setSelected(latest); setNotice(`Fiche relue · révision ${latest.revision}. Votre donnée en préparation est conservée.`); }
    else setLookupError('La fiche cible n’a pas été retrouvée. Votre saisie reste ouverte.');
  };

  const candidateLabel = (candidate: BrewerCatalogueIdentityCandidate) => {
    const found = collisionRecords.find(row => row.kind === candidate.kind && row.id === candidate.id && row.styleId === candidate.styleId)
      ?? records.find(row => row.kind === candidate.kind && row.id === candidate.id && row.styleId === candidate.styleId);
    return found ? nameOf(found) : `${candidate.id}${candidate.styleId ? ` · style ${candidate.styleId}` : ''}`;
  };

  return <section className="hv55-catalogue" aria-labelledby="hv55-catalogue-title">
    <header className="hv55-catalogue-header">
      <div><p className="hv55-eyebrow">Références · recherche et conservation</p><h2 id="hv55-catalogue-title">Catalogues du brasseur</h2></div>
      <small>Recherche {services.catalogue.scope === 'fixture' ? 'fixture isolée' : 'serveur'} · écriture contrôlée par le service</small>
    </header>
    <div className="hv55-kind-tabs" role="tablist" aria-label="Type de catalogue">
      {(Object.keys(KIND_LABEL) as BrewerCatalogueKind[]).map(item => <button key={item} type="button" role="tab" aria-selected={kind === item} onClick={() => selectKind(item)}>{KIND_LABEL[item]}</button>)}
    </div>
    <form className="hv55-search" autoComplete="off" onSubmit={event => { event.preventDefault(); void lookupNow(kind, query); }}>
      <label htmlFor="hv55-catalogue-search">Rechercher {KIND_LABEL[kind].toLocaleLowerCase('fr')}</label>
      <div><Input id="hv55-catalogue-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nom, code, alias ou donnée sourcée" />
        <button type="submit" disabled={!query.trim() || searching}>{searching ? 'Recherche…' : 'Chercher'}</button></div>
    </form>
    {lookupError && <p className="hv55-error" role="alert">{lookupError}</p>}
    {searching && <p className="hv55-muted" role="status">Recherche du catalogue…</p>}
    {notice && mode !== 'create' && mode !== 'enrich' && <p className="hv55-notice" role="status">{notice}</p>}
    {query.trim() && !searching && !lookupError && <div className="hv55-search-results" aria-live="polite">
      <p className="hv55-result-count">{records.length} résultat(s){truncated ? ' · recherche incomplète' : ''}</p>
      {records.map(row => <article className="hv55-result" key={`${row.kind}:${row.id}:${row.styleId || ''}`}>
        <button type="button" className="hv55-result-main" onClick={() => selectRecord(row)}>
          <strong>{nameOf(row)}</strong><span>{row.origin === 'bundled' ? 'Référence embarquée' : 'Fiche persistée'} · révision {row.revision}</span>
        </button>
        {row.kind === 'brewingStyle' && !row.styleId && <div className="hv55-style-picks">{(row.record as BrewingStyleGuide).styles.map(style => <button type="button" key={style.id} onClick={() => selectRecord({ ...row, styleId: style.id })}>Ouvrir {style.name} · {style.code}</button>)}</div>}
      </article>)}
      {records.length === 0 && <p className="hv55-muted">Aucune fiche trouvée pour cette recherche.</p>}
      {truncated && <p className="hv55-warning">La recherche est tronquée. L’absence n’est pas établie ; création indisponible jusqu’à une recherche complète.</p>}
      {!truncated && <button className="hv55-create-shortcut" type="button" onClick={openCreate}>{records.length ? 'Créer une fiche distincte si son identité diffère' : 'Créer une fiche absente'}</button>}
    </div>}

    {selected && mode !== 'create' && <section className="hv55-selected" aria-label="Fiche sélectionnée">
      <div className="hv55-selected-head"><div><p className="hv55-eyebrow">{selected.origin === 'bundled' ? 'Référence embarquée' : 'Fiche relue'} · {KIND_LABEL[selected.kind]}</p><h3>{nameOf(selected)}</h3>
        <p className="hv55-muted">Révision {selected.revision} · lecture catalogue</p>
        <details className="hv55-technical-meta"><summary>Identifiants techniques</summary><small>Identité · <code>{selected.id}</code>{selected.styleId ? <> · style · <code>{selected.styleId}</code></> : null} · empreinte · <code>{selected.fingerprint}</code></small></details></div>
        <div className="hv55-selected-actions">{onUseRecord && <button type="button" onClick={() => onUseRecord(selected)}>Utiliser cette fiche</button>}<button type="button" className="secondary" onClick={openEnrich}>Enrichir</button></div>
      </div>
      <RecordDetails row={selected} />
      {mode === 'details' && <p className="hv55-muted">« Enrichir » ajoute une assertion sourcée. « Utiliser cette fiche » la transmet au parcours.</p>}
    </section>}

    {(mode === 'create' || mode === 'enrich') && <form className="hv55-write-form" autoComplete="off" onSubmit={submit}>
      <header><div><p className="hv55-eyebrow">{mode === 'create' ? 'Nouvelle identité' : `Fiche cible · ${selected ? nameOf(selected) : ''}`}</p><h3>{mode === 'create' ? `Créer · ${KIND_LABEL[kind]}` : 'Ajouter une assertion'}</h3></div>
        <button type="button" className="hv55-close" onClick={() => setMode(selected ? 'details' : 'browse')} aria-label="Fermer le formulaire">Fermer</button></header>
      {mode === 'create' && <>
        <label>Nom de la fiche<Input value={create.name} onChange={event => setCreate({ ...create, name: event.target.value })} placeholder="Nom documenté par la source" /></label>
        {kind === 'hopVariety' && <label>Origine, si connue<Input value={create.origin} onChange={event => setCreate({ ...create, origin: event.target.value })} placeholder="Non renseignée" /></label>}
        {kind === 'yeastStrain' && <label>Forme, si connue<select value={create.yeastForm} onChange={event => setCreate({ ...create, yeastForm: event.target.value })}><option value="">Non renseignée</option><option value="sèche">Sèche</option><option value="liquide">Liquide</option><option value="levain">Levain</option></select></label>}
        {kind === 'brewingStyle' && <>
          <p className="hv55-warning">Une plage ci-dessous décrit la référence de style. Elle ne mesure pas un brassin.</p>
          <div className="hv55-grid two">
            <label>Version<Input value={create.version} onChange={event => setCreate({ ...create, version: event.target.value })} placeholder="Version publiée ou choisie" /></label>
            <label>Édition<Input value={create.edition} onChange={event => setCreate({ ...create, edition: event.target.value })} placeholder="Édition ou référence personnelle" /></label>
            <label>Statut<select value={create.enabled} onChange={event => setCreate({ ...create, enabled: event.target.value })}><option value="">Choisir…</option><option value="true">Actif</option><option value="false">Inactif</option></select></label>
            <label>Attribution<Input value={create.attribution} onChange={event => setCreate({ ...create, attribution: event.target.value })} placeholder="Attribution affichée dans la fiche" /></label>
          </div>
          <div className="hv55-grid three">
            <label>Code du style<Input value={create.styleCode} onChange={event => setCreate({ ...create, styleCode: event.target.value })} placeholder="Code sourcé" /></label>
            <label>Nom du style<Input value={create.styleName} onChange={event => setCreate({ ...create, styleName: event.target.value })} placeholder="Nom sourcé" /></label>
            <label>Famille<Input value={create.styleFamily} onChange={event => setCreate({ ...create, styleFamily: event.target.value })} placeholder="Famille attribuée" /></label>
          </div>
          <fieldset className="hv55-fieldset">
            <legend>Plage de style facultative</legend>
            <label>Statistique<select aria-label="Statistique de création" value={create.styleStat} onChange={event => setCreate({ ...create, styleStat: event.target.value, styleStatMin: '', styleStatMax: '' })}>
              <option value="">Aucune plage maintenant</option>{STYLE_STAT_OPTIONS.map(option => <option key={option.key} value={option.key}>{option.label} · {option.unit}</option>)}
            </select></label>
            {create.styleStat && <div className="hv55-grid two">
              <label>Minimum ({STYLE_STAT_OPTIONS.find(option => option.key === create.styleStat)?.unit})<Input inputMode="decimal" value={create.styleStatMin} onChange={event => setCreate({ ...create, styleStatMin: event.target.value })} /></label>
              <label>Maximum ({STYLE_STAT_OPTIONS.find(option => option.key === create.styleStat)?.unit})<Input inputMode="decimal" value={create.styleStatMax} onChange={event => setCreate({ ...create, styleStatMax: event.target.value })} /></label>
            </div>}
            <p className="hv55-muted">Les unités figurent à côté des bornes. La source de style déclarée plus bas s’applique à cette plage.</p>
          </fieldset>
          <p className="hv55-muted">Les alias s’ajoutent après l’attribution de l’identifiant du style, depuis sa fiche relue.</p>
          <p className="hv55-muted">Date de création de cette fiche : {create.createdAt}. Elle décrit l’enregistrement, pas la date d’une source.</p>
        </>}
        {kind === 'yeastStrain' && <SourceFields value={source} onChange={setSource} required />}
        {kind === 'brewingStyle' && <SourceFields value={source} onChange={setSource} required />}
        <label className="hv55-check"><input type="checkbox" checked={addInitialClaim} onChange={event => { setAddInitialClaim(event.target.checked); if (event.target.checked) setClaim(freshGuidedClaim()); }} />Ajouter une première donnée sourcée</label>
      </>}
      {mode === 'enrich' && kind === 'brewingStyle' && <label>Nouvelle version du guide<Input value={nextStyleVersion} onChange={event => setNextStyleVersion(event.target.value)} placeholder="Version distincte de l’actuelle" /></label>}
      {(mode === 'enrich' || (mode === 'create' && addInitialClaim)) && <div className="hv55-claim-entry">
        <GuidedClaimFields kind={kind} operation={mode} draft={claim} onChange={setClaim} styleId={selectedStyleId} />
        {(mode === 'enrich' || kind === 'hopVariety') && <SourceFields value={source} onChange={setSource} required />}
        <details className="hv55-advanced"><summary>Saisie avancée · portée, propriété et champs ouverts</summary>
          <ClaimFields kind={kind} draft={claim} onChange={setClaim} source={source} onSourceChange={setSource} styleId={selectedStyleId} showSourceFields={false} />
        </details>
      </div>}
      {mode === 'create' && identityCandidates.length > 0 && <section className="hv55-collision" aria-label="Identités candidates retournées par le serveur">
        <h4>Le contrôle d’identité a trouvé des candidats</h4><p>Candidats à relire avant la création d’une fiche distincte. Leurs ID et empreintes seront transmis tels que retournés.</p>
        {identityCandidates.map(candidate => <details key={`${candidate.kind}:${candidate.id}:${candidate.styleId || ''}`}><summary>{candidateLabel(candidate)} · {KIND_LABEL[candidate.kind]}</summary><small>ID · <code>{candidate.id}</code>{candidate.styleId ? <> · style · <code>{candidate.styleId}</code></> : null} · empreinte · <code>{candidate.fingerprint}</code></small></details>)}
        {identityCandidates.map(candidate => {
          const candidateRecord = collisionRecords.find(row => row.kind === candidate.kind && row.id === candidate.id && row.styleId === candidate.styleId)
            ?? records.find(row => row.kind === candidate.kind && row.id === candidate.id && row.styleId === candidate.styleId);
          return candidateRecord ? <details key={`detail:${candidate.kind}:${candidate.id}:${candidate.styleId || ''}`}><summary>Relire {candidateLabel(candidate)}</summary><RecordDetails row={candidateRecord} /></details> : null;
        })}
        <label>Pourquoi cette nouvelle identité est-elle distincte ?<Textarea value={identityReason} onChange={event => setIdentityReason(event.target.value)} rows={2} placeholder="Décrire la différence d’identité à partir des sources" /></label>
      </section>}
      {mode === 'enrich' && identityCandidates.length > 0 && <section className="hv55-collision" aria-label="Fiches en conflit" >
        <h4>Identité déjà attribuée</h4><p>Le service n’a pas fusionné cette fiche. Les entrées concernées restent à relire; le nom ou l’alias peut être ajusté.</p>
        {identityCandidates.map(candidate => <details key={`${candidate.kind}:${candidate.id}:${candidate.styleId || ''}`}><summary>{candidateLabel(candidate)} · {KIND_LABEL[candidate.kind]}</summary><small>ID · <code>{candidate.id}</code> · empreinte · <code>{candidate.fingerprint}</code></small></details>)}
        {identityCandidates.map(candidate => {
          const candidateRecord = collisionRecords.find(row => row.kind === candidate.kind && row.id === candidate.id && row.styleId === candidate.styleId)
            ?? records.find(row => row.kind === candidate.kind && row.id === candidate.id && row.styleId === candidate.styleId);
          return candidateRecord ? <details key={`detail:${candidate.kind}:${candidate.id}:${candidate.styleId || ''}`}><summary>Relire {candidateLabel(candidate)}</summary><RecordDetails row={candidateRecord} /></details> : null;
        })}
      </section>}
      {writeError && <div className="hv55-error" role="alert">{writeError}{mode === 'enrich' && /révision|empreinte|changé|cible/i.test(writeError) && <button type="button" className="hv55-inline" onClick={() => void rereadAfterConflict()}>Relire la fiche en conservant la saisie</button>}</div>}
      {notice && <p className="hv55-notice" role="status">{notice}</p>}
      <UnmappedFields rows={unmappedDrafts} onChange={setUnmappedDrafts} />
      <footer><button type="button" className="secondary" onClick={() => setMode(selected ? 'details' : 'browse')}>Retour à la fiche</button>
        <button type="submit" disabled={writing}>{writing ? 'Écriture…' : mode === 'create' ? 'Créer la fiche' : 'Enregistrer l’enrichissement'}</button></footer>
      {mode === 'create' && <p className="hv55-muted">Le service vérifie l’identité complète et fournit l’ID. Une fixture confirme uniquement son écriture locale isolée.</p>}
      {mode === 'enrich' && selected && <p className="hv55-muted">Fiche relue · révision {selected.revision}. Un conflit laisse cette saisie disponible.</p>}
    </form>}
  </section>;
}
