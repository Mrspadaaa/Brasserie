import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Sheet } from './Sheet';
import { inputClass } from './FormNav';
import { Input, Textarea } from './Input';
import { StorageService } from '../services/storage';
import { YeastDbCorrections, type YeastDbCorrectionClientReceipt,
  type YeastDbCorrectionPanelTarget, type YeastDbCorrectionProposal } from '../services/yeastDbCorrections';
import { yeastCitations, yeastFactLabel, yeastObservationText, yeastShortUrl, type YeastCitation } from './YeastRecipeDossier';
import type { BrewerTurn } from '../../functions/src/companionTypes';
import type { YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';
import type { YeastStarterProtocol } from '../../functions/src/yeastSupplySchema';

type Props = {
  target: YeastDbCorrectionPanelTarget | null;
  /** A precomputed manual-create proposal opens directly in review without another AI request. */
  initialProposal?: YeastDbCorrectionProposal;
  onClose: () => void;
  onUpdated?: (receipt: YeastDbCorrectionClientReceipt) => void;
};

const qualifierLabel: Record<string, string> = {
  range: 'plage', point: 'point publié', reportedPoint: 'point publié', approximate: 'environ',
  'lower-bound': 'au moins', atLeast: 'au moins', greaterThan: 'strictement supérieur à',
  'upper-bound': 'au plus', upTo: 'au plus', lessThan: 'strictement inférieur à'
};
const statusLabel: Record<string, string> = {
  'in-stock': 'En stock', 'out-of-stock': 'Hors stock', unknown: 'Inconnu',
  yes: 'Oui', no: 'Non'
};
const fieldLabel: Record<string, string> = {
  amount: 'Montant', currency: 'Devise', packs: 'Base de packs', status: 'Statut', text: 'Texte relevé',
  destination: 'Destination', conditions: 'Conditions', sku: 'Référence vendeur', kind: 'Type',
  min: 'Minimum', max: 'Maximum', unit: 'Unité', qualifier: 'Qualification',
  yeastLab: 'Laboratoire', yeastStrain: 'Code de souche', yeastForm: 'Forme',
  yeastAttenuationPct: 'Atténuation annoncée', yeastTempMinC: 'Température minimale',
  yeastTempMaxC: 'Température maximale', yeastFlocculation: 'Floculation',
  yeastAlcoholTolerancePct: 'Tolérance à l’alcool', 'product.dose': 'Dose fabricant',
  'product.create': 'Produit exact', 'offer.create': 'Offre exacte', 'product.starter': 'Notice de préparation',
  'offer.price': 'Prix', 'offer.stock': 'Disponibilité', 'offer.shipping': 'Livraison vers la Suisse', 'offer.sku': 'Référence vendeur'
};
const citationFields = new Set(['source', 'sourceUrl', 'url', 'retrievedAt', 'checkedAt', 'linkCorrection']);
const record = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const frNumber = (value: number, money = false) => value.toLocaleString('fr-FR', {
  ...(money ? { minimumFractionDigits: 2 } : {}), maximumFractionDigits: 20
});
const humanField = (key: string) => fieldLabel[key] ?? key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, first => first.toLocaleUpperCase('fr'));

function show(value: unknown, citations: CitationModel, depth = 0): React.ReactNode {
  if (value == null) return 'Aucune valeur enregistrée';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? frNumber(value) : 'Valeur non numérique';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (Array.isArray(value)) return value.length
    ? <ul className="list-disc space-y-1 pl-4">{value.map((item, index) => <li key={index}>{show(item, citations, depth + 1)}</li>)}</ul>
    : 'Aucune valeur';
  if (!record(value)) return 'Valeur non disponible';
  const row = value;
  if (isStarterProtocol(row)) return <StarterProtocolView protocol={row} citations={citations} depth={depth} />;
  if (isTechnicalFact(row)) {
    const observation = yeastObservationText(row);
    return <>{[observation.value, observation.wording ? `Texte de la source : ${observation.wording}` : '',
      row.context ? `Contexte : ${row.context}` : ''].filter(Boolean).join(' · ')}{depth > 0 && <> <CitationMark reference={correctionCitationRef(row)} citations={citations} /></>}</>;
  }
  if (typeof row.amount === 'number' && typeof row.currency === 'string') {
    return <>{`${frNumber(row.amount, true)} ${row.currency}${typeof row.packs === 'number' ? ` · base de ${frNumber(row.packs)} pack${row.packs > 1 ? 's' : ''}` : ''}`}{depth > 0 && <> <CitationMark reference={correctionCitationRef(row)} citations={citations} /></>}</>;
  }
  if (record(row.range) && Number.isFinite(row.range.min) && Number.isFinite(row.range.max)) {
    const label = qualifierLabel[row.qualifier] ?? '';
    const range = `${row.range.min === row.range.max ? frNumber(row.range.min) : `${frNumber(row.range.min)}–${frNumber(row.range.max)}`}${row.unit ? ` ${row.unit}` : ''}`;
    return <>{[label ? `${label} ${range}` : range, row.conditions ? `Conditions : ${row.conditions}` : '',
      row.kind ? `Base : ${row.kind === 'viable' ? 'cellules viables' : row.kind === 'total' ? 'cellules totales' : row.kind}` : '']
      .filter(Boolean).join(' · ')}{depth > 0 && <> <CitationMark reference={correctionCitationRef(row)} citations={citations} /></>}</>;
  }
  if (typeof row.status === 'string') {
    const status = statusLabel[row.status] ?? humanField(row.status);
    const destination = row.destination === 'CH' ? 'Destination : Suisse' : row.destination;
    return <>{[destination, status, row.text ? `Texte relevé : ${row.text}` : '',
      row.conditions ? `Conditions : ${row.conditions}` : ''].filter(Boolean).join(' · ')}{depth > 0 && <> <CitationMark reference={correctionCitationRef(row)} citations={citations} /></>}</>;
  }
  const entries = Object.entries(row).filter(([key, entry]) => !citationFields.has(key) && entry !== undefined && entry !== null);
  if (!entries.length) return depth > 0 && correctionCitationRef(row)
    ? <CitationMark reference={correctionCitationRef(row)} citations={citations} />
    : 'Aucune valeur enregistrée';
  return <>
    <dl className="grid gap-x-2 gap-y-1 sm:grid-cols-2 text-xs">
      {entries.map(([key, entry]) => <div key={key} className="min-w-0">
        <dt className="inline text-cave-400">{humanField(key)} : </dt>
        <dd className="inline break-words text-cave-200">{show(entry, citations, depth + 1)}</dd>
      </div>)}
    </dl>
    {depth > 0 && <CitationMark reference={correctionCitationRef(row)} citations={citations} />}
  </>;
}
function targetName(target: YeastDbCorrectionPanelTarget): string {
  if (target.scope === 'catalogue') return target.fallback?.name ?? StorageService.getHopKnowledge().find(row => row.id === target.id)?.name ?? target.id;
  if (target.scope === 'stock') return StorageService.getStocks().rawMaterials.find(row => row.ref === target.ref)?.name ?? target.ref;
  const product = target.fallback?.product ?? StorageService.getYeastProducts().find(row => row.id === target.id)?.product;
  return `${product?.label ?? target.id}${target.scope === 'offer' ? ` · offre ${target.offerId}` : ''}`;
}
function targetKey(target: YeastDbCorrectionPanelTarget | YeastDbCorrectionClientReceipt['target'] | null) {
  if (!target) return '';
  if (target.scope === 'catalogue') return `catalogue:${target.id}`;
  if (target.scope === 'stock') return `stock:${'ref' in target ? target.ref : target.id}`;
  return `${target.scope}:${target.id}${target.scope === 'offer' ? `:${target.offerId}` : ''}`;
}
const manualCreationFields = new Set(['product.create', 'offer.create']);
function selectedByDefault(proposal: YeastDbCorrectionProposal): string[] {
  const defaults: string[] = [], ambiguity = new Set<string>();
  for (const change of proposal.changes) {
    if (change.group?.startsWith('ambigu-')) {
      if (!ambiguity.has(change.group)) { defaults.push(change.id); ambiguity.add(change.group); }
    } else defaults.push(change.id);
  }
  return defaults;
}
function sourceOrigin(source: Record<string, any> | undefined) {
  if (source?.origin === 'ai') return 'Source reprise par Gemini';
  if (source?.origin === 'merchant') return 'Source vendeur';
  if (source?.origin === 'manufacturer') return 'Fiche fabricant';
  if (source?.origin === 'manual') return 'Saisie manuelle';
  return 'Origine non précisée';
}
/** A starter notice read as a notice: method, medium, target SG, published duration and its meaning, conditions, ordered steps. */
function isStarterProtocol(value: unknown): value is YeastStarterProtocol {
  return record(value) && value.medium === 'malt-extract' && Array.isArray(value.steps) && record(value.leadHours) && typeof value.targetSg === 'number';
}
const LEAD_MEANING: Record<string, string> = { culture: 'culture seule ; activation, ébullition et refroidissement en plus', 'total-preparation': 'toute la préparation' };
function StarterProtocolView({ protocol, citations, depth }: { protocol: YeastStarterProtocol; citations: CitationModel; depth: number }) {
  const hours = protocol.leadHours.min === protocol.leadHours.max ? frNumber(protocol.leadHours.min) : `${frNumber(protocol.leadHours.min)}–${frNumber(protocol.leadHours.max)}`;
  return <div className="space-y-1 text-xs text-cave-200" data-starter-protocol={protocol.id}>
    <p className="text-sm text-cave-50">{protocol.label}</p>
    <p>{protocol.method}</p>
    <p>Milieu : extrait de malt · SG cible {protocol.targetSg.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</p>
    <p>Durée publiée : {hours} h · {protocol.leadHoursMeaning ? LEAD_MEANING[protocol.leadHoursMeaning] : 'sens non précisé par la notice'}</p>
    <p>Conditions : {protocol.conditions}</p>
    <ol className="list-decimal space-y-0.5 pl-4" aria-label="Étapes de la notice">{protocol.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
    {depth > 0 && <CitationMark reference={correctionCitationRef(protocol)} citations={citations} />}
  </div>;
}
function isTechnicalFact(value: unknown): value is YeastTechnicalFact {
  return !!value && typeof value === 'object' && !Array.isArray(value) && typeof (value as any).key === 'string' && typeof (value as any).reported === 'string';
}

type CitedValue = { source?: string; sourceUrl?: string; retrievedAt?: string };
type CorrectionCitationRef = { citation: CitedValue; origin?: string; previousUrl?: string; correctedAt?: string };
type CitationModel = ReturnType<typeof yeastCitations>;
function correctionCitationRef(value: unknown): CorrectionCitationRef | undefined {
  if (!record(value)) return undefined;
  // An offer URL identifies the commercial entry; its dated stock/shipping/price
  // observations carry the provenance. Do not turn the bare offer URL into a fact source.
  if (typeof value.productId === 'string' && typeof value.seller === 'string' && record(value.stock)) return undefined;
  const source = record(value.source) ? value.source : value;
  const title = typeof source.title === 'string' ? source.title : typeof source.source === 'string' ? source.source : undefined;
  const url = typeof source.url === 'string' ? source.url : typeof source.sourceUrl === 'string' ? source.sourceUrl : undefined;
  const date = typeof source.checkedAt === 'string' ? source.checkedAt : typeof source.retrievedAt === 'string' ? source.retrievedAt : undefined;
  if (!title?.trim() && !url?.trim()) return undefined;
  const correction = record(source.linkCorrection) ? source.linkCorrection : undefined;
  return { citation: { ...(title ? { source: title } : {}), ...(url ? { sourceUrl: url } : {}), ...(date ? { retrievedAt: date } : {}) },
    ...(typeof source.origin === 'string' ? { origin: source.origin } : typeof value.origin === 'string' ? { origin: value.origin } : {}),
    ...(typeof correction?.originalUrl === 'string' ? { previousUrl: correction.originalUrl } : {}),
    ...(typeof correction?.correctedAt === 'string' ? { correctedAt: correction.correctedAt } : {}) };
}
function correctionCitations(changes: YeastDbCorrectionProposal['changes']): CitationModel {
  const cited: CitedValue[] = [];
  const seen = new Set<object>();
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object' || seen.has(value as object)) return;
    seen.add(value as object);
    const reference = correctionCitationRef(value);
    if (reference) {
      cited.push(reference.citation);
      if (reference.previousUrl) cited.push({ source: 'Lien précédent', sourceUrl: reference.previousUrl, retrievedAt: reference.correctedAt });
    }
    if (Array.isArray(value)) value.forEach(visit);
    else Object.values(value as Record<string, unknown>).forEach(visit);
  };
  for (const change of changes) {
    visit(change.before); visit(change.value); visit(change.source);
  }
  return yeastCitations(cited);
}
function CitationMark({ reference, citations }: { reference?: CorrectionCitationRef; citations: CitationModel }) {
  if (!reference) return null;
  const citation = citations.of(reference.citation);
  const mark = citation && citations.list.length > 1
    ? citation.url
      ? <a className="text-water underline" href={citation.url} target="_blank" rel="noreferrer" aria-label={`Source ${citation.index} : ${citation.title}`}>[{citation.index}]</a>
      : <span>[{citation.index}]</span>
    : null;
  const previous = reference.previousUrl
    ? <span className="block text-cave-400">Lien précédent conservé : <a className="text-water underline" href={reference.previousUrl} target="_blank" rel="noreferrer" title={reference.previousUrl}>{yeastShortUrl(reference.previousUrl)}</a></span>
    : null;
  return <span className="block mt-1 text-xs text-cave-400 break-words">
    {sourceOrigin({ origin: reference.origin })}
    {citation && (citations.list.length === 1 ? ' · source commune' : <> · {mark}</>)}
    {previous}
  </span>;
}
function CitationList({ citations }: { citations: CitationModel }) {
  if (!citations.list.length) return null;
  return <details className="rounded-control border border-cave-700 p-3" aria-label="Sources des corrections">
    <summary className="min-h-touch cursor-pointer text-xs text-water">{citations.list.length === 1 ? 'Source commune' : 'Sources des valeurs'} · {citations.list.length}</summary>
    <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-cave-400">
      {citations.list.map(citation => <li key={citation.key}>
        {citation.url ? <a className="text-water underline break-words" href={citation.url} target="_blank" rel="noreferrer" title={citation.url}>{citation.title}</a> : citation.title}
        {citation.dates.length ? ` · date indiquée : ${citation.dates.join(', ')}` : ''}
      </li>)}
    </ol>
  </details>;
}

function correctionLabel(change: YeastDbCorrectionProposal['changes'][number]) {
  const fact = isTechnicalFact(change.value) ? change.value : isTechnicalFact(change.before) ? change.before : undefined;
  if (fact) return yeastFactLabel(fact.key);
  return fieldLabel[change.field] ?? fieldLabel[change.field.replace(/^stock\./, '')] ?? change.label;
}
function valueContext(value: unknown): string | undefined {
  if (!record(value)) return undefined;
  return typeof value.context === 'string' ? value.context : typeof value.conditions === 'string' ? value.conditions : undefined;
}
function ChangeCard({ change, selected, disabled, onToggle, citations }: {
  change: YeastDbCorrectionProposal['changes'][number]; selected: boolean; disabled: boolean;
  onToggle: (checked: boolean) => void; citations: CitationModel;
}) {
  const before = change.before;
  const after = change.value;
  const beforeSource = correctionCitationRef(before);
  // The offer's nested observations already show their own origin and grouped citation.
  const afterSource = change.field === 'offer.create' ? undefined
    : correctionCitationRef(after) ?? correctionCitationRef(change.source);
  const context = change.context?.trim();
  const contextAlreadyShown = !context || [valueContext(before), valueContext(after)].includes(context);
  return <article className="rounded-control border border-cave-700 bg-cave-850 p-3 space-y-2">
    <label className="flex items-start gap-2 cursor-pointer">
      <input className="mt-1 min-h-touch-sm min-w-touch-sm accent-amber-300" type="checkbox" checked={selected} disabled={disabled} onChange={event => onToggle(event.target.checked)} />
      <span className="min-w-0 flex-1">
        <strong className="block text-sm text-cave-50">{correctionLabel(change)}</strong>
        <span className="block mt-1 text-xs text-cave-400">{change.reason}</span>
        {context && !contextAlreadyShown && <span className="block mt-1 text-xs text-cave-400">Contexte de la proposition : {context}</span>}
      </span>
    </label>
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="min-w-0 rounded-control border border-cave-700 p-2">
        <span className="block text-[0.7rem] uppercase tracking-wide text-cave-400">Avant</span>
        <div className="block mt-1 break-words text-sm text-cave-200">{show(before, citations)}</div>
        <CitationMark reference={beforeSource} citations={citations} />
      </div>
      <div className="min-w-0 rounded-control border border-ebc-straw/40 p-2">
        <span className="block text-[0.7rem] uppercase tracking-wide text-ebc-straw">Après · proposition</span>
        <div className="block mt-1 break-words text-sm text-cave-50">{show(after, citations)}</div>
        <CitationMark reference={afterSource} citations={citations} />
      </div>
    </div>
  </article>;
}

function AlternativeResult({ turn }: { turn: BrewerTurn }) {
  const products = turn.evidence.flatMap(entry => entry.products ?? []);
  return <section className="space-y-3 rounded-control border border-water/40 bg-cave-850 p-3" aria-label="Alternatives documentées">
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-water">Alternatives à examiner · aucun changement adopté</h3>
      <p className="text-sm text-cave-50">{turn.advice.summary}</p>
      <p className="text-sm text-cave-200">{turn.advice.action}</p>
      {turn.advice.why && <p className="text-xs text-cave-400">{turn.advice.why}</p>}
      {turn.advice.watch && <p className="text-xs text-cave-400">Limites : {turn.advice.watch}</p>}
    </div>
    {turn.evidence.map(entry => entry.sources?.length ? <div key={entry.id} className="space-y-1">
      <h4 className="text-xs font-semibold text-cave-400">{entry.label}</h4>
      {entry.sources.map(source => <a key={`${source.url}:${source.title}`} href={source.url} target="_blank" rel="noreferrer" className="block text-xs text-water underline break-all">{source.title}</a>)}
    </div> : null)}
    {products.length > 0 && <div className="space-y-2">
      <h4 className="text-xs font-semibold text-cave-400">Pages produit lues par le serveur</h4>
      {products.map((product, index) => <article key={`${product.url}:${product.sku ?? index}`} className="rounded-control border border-cave-700 p-2">
        <a className="text-sm text-water underline break-words" href={product.url} target="_blank" rel="noreferrer">{product.name}</a>
        <p className="text-xs text-cave-400">{product.supplier}{product.packageLabel ? ` · ${product.packageLabel}` : ''}</p>
        <p className="text-xs text-cave-400">{product.availabilityText} · {new Date(product.checkedAt).toLocaleDateString('fr-CH')}</p>
      </article>)}
    </div>}
  </section>;
}

export function YeastDbCorrectionsPanel({ target, initialProposal, onClose, onUpdated }: Props) {
  const resolvedTarget = useMemo(() => target && initialProposal?.fallback
    ? { ...target, fallback: initialProposal.fallback } as YeastDbCorrectionPanelTarget : target,
  [target, initialProposal?.id]);
  const key = targetKey(resolvedTarget);
  const fallback = resolvedTarget && 'fallback' in resolvedTarget ? resolvedTarget.fallback : undefined;
  const name = useMemo(() => resolvedTarget ? targetName(resolvedTarget) : '', [key, fallback]);
  const [request, setRequest] = useState('');
  const [rawProposal, setProposal] = useState<YeastDbCorrectionProposal | null>(initialProposal ?? null);
  const proposal = rawProposal && targetKey(rawProposal.target) === key ? rawProposal : null;
  const [selected, setSelected] = useState<string[]>(initialProposal ? selectedByDefault(initialProposal) : []);
  const [rawReceipt, setReceipt] = useState<YeastDbCorrectionClientReceipt | null>(null);
  const receipt = rawReceipt && targetKey(rawReceipt.target) === key ? rawReceipt : null;
  const [alternatives, setAlternatives] = useState<BrewerTurn | null>(null);
  const [manualKind, setManualKind] = useState<'stock' | 'shipping'>('stock');
  const [manualStatus, setManualStatus] = useState<'in-stock' | 'out-of-stock' | 'unknown' | 'yes' | 'no'>('unknown');
  const [manualText, setManualText] = useState('');
  const [manualSourceTitle, setManualSourceTitle] = useState('');
  const [manualSourceUrl, setManualSourceUrl] = useState('');
  const [manualCheckedAt, setManualCheckedAt] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [busy, setBusy] = useState<'proposal' | 'apply' | 'alternatives' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const session = useRef(0), requestNumber = useRef(0), activeKey = useRef(key);
  activeKey.current = key;
  const beginRequest = () => {
    const openSession = session.current, number = ++requestNumber.current, requestedKey = key;
    return () => session.current === openSession && requestNumber.current === number && activeKey.current === requestedKey;
  };
  const citations = useMemo(() => correctionCitations(proposal?.changes ?? []), [proposal?.changes]);
  const currentManualCreation = !!proposal?.changes.some(change => manualCreationFields.has(change.field));
  // A typed starter notice is reviewed as submitted: no Gemini request, and no creation wording unless the parent is absent.
  const manualStarter = !!proposal?.changes.some(change => change.field === 'product.starter');

  useEffect(() => {
    session.current += 1; requestNumber.current += 1;
    const initial = initialProposal && targetKey(initialProposal.target) === key ? initialProposal : null;
    setRequest(''); setProposal(initial); setSelected(initial ? selectedByDefault(initial) : []);
    setReceipt(null); setAlternatives(null); setBusy(null); setError('');
    setNotice(initial ? initial.changes.some(change => change.field === 'product.starter')
      ? 'Notice manuelle prête à relire. Aucune valeur n’a été enregistrée.' : 'Création manuelle prête à relire. Aucune valeur n’a été enregistrée.' : '');
    setManualKind('stock'); setManualStatus('unknown'); setManualText(''); setManualSourceTitle(''); setManualSourceUrl(''); setManualCheckedAt(''); setManualReason('');
    return () => { session.current += 1; requestNumber.current += 1; };
  }, [key, initialProposal?.id]);

  const bootstrapOnly = !!resolvedTarget && (
    !currentManualCreation && (resolvedTarget?.scope === 'catalogue' && !StorageService.getHopKnowledge().some(row => row.id === resolvedTarget.id) ||
    (resolvedTarget?.scope === 'product' || resolvedTarget?.scope === 'offer') && !StorageService.getYeastProducts().some(row => row.id === resolvedTarget.id))
  );
  const ask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resolvedTarget || request.trim().length < 2) return;
    const currentRequest = beginRequest();
    setBusy('proposal'); setError(''); setNotice(''); setAlternatives(null); setReceipt(null);
    try {
      const next = await YeastDbCorrections.propose(resolvedTarget, request);
      if (!currentRequest()) return;
      if (targetKey(next.target) !== key) throw new Error('Cette proposition appartient à une autre cible. Relance la demande pour la fiche ouverte.');
      setProposal(next);
      setSelected(selectedByDefault(next));
      setNotice('Proposition locale prête. Aucune valeur n’a été enregistrée.');
    } catch (cause) { if (currentRequest()) setError(cause instanceof Error ? cause.message : 'Gemini n’a pas rendu de proposition.'); }
    finally { if (currentRequest()) setBusy(null); }
  };
  const toggle = (change: YeastDbCorrectionProposal['changes'][number], checked: boolean) => {
    setSelected(ids => {
      if (change.group?.startsWith('ambigu-')) {
        return checked ? [...ids.filter(id => !proposal?.changes.some(row => row.id === id && row.group === change.group)), change.id] : ids.filter(id => id !== change.id);
      }
      if (change.group) {
        const linked = proposal?.changes.filter(row => row.group === change.group).map(row => row.id) ?? [change.id];
        return checked ? [...new Set([...ids, ...linked])] : ids.filter(id => !linked.includes(id));
      }
      return checked ? [...new Set([...ids, change.id])] : ids.filter(id => id !== change.id);
    });
  };
  const confirm = async () => {
    if (!proposal || !resolvedTarget || targetKey(proposal.target) !== key || !selected.length) return;
    const currentRequest = beginRequest();
    setBusy('apply'); setError(''); setNotice('');
    try {
      const saved = await YeastDbCorrections.apply(proposal, selected);
      if (!currentRequest()) return;
      if (targetKey(saved.target) !== key) throw new Error('Le reçu appartient à une autre cible; la fiche ouverte reste inchangée.');
      setReceipt(saved);
      setNotice(saved.readback === 'refreshed'
        ? 'Correction confirmée par le serveur; la fiche est actualisée.'
        : 'Correction confirmée par le serveur. La mise à jour de la fiche locale est encore en attente.');
      onUpdated?.(saved);
    } catch (cause) { if (currentRequest()) setError(cause instanceof Error ? cause.message : 'Le serveur n’a pas confirmé la correction. La proposition reste locale.'); }
    finally { if (currentRequest()) setBusy(null); }
  };
  const requestClose = () => {
    if (busy === 'apply') {
      setNotice('La confirmation serveur est en cours. Attends le reçu ou le refus avant de fermer.');
      return;
    }
    session.current += 1; requestNumber.current += 1;
    onClose();
  };
  const searchAlternatives = async () => {
    if (!resolvedTarget || request.trim().length < 2) return;
    const currentRequest = beginRequest();
    setBusy('alternatives'); setError(''); setNotice(''); setProposal(null); setReceipt(null);
    try {
      const result = await YeastDbCorrections.searchAlternatives(resolvedTarget, request, resolvedTarget.context ?? {});
      if (!currentRequest()) return;
      setAlternatives(result);
      setNotice('Recherche terminée. Les alternatives sont des pistes, aucune recette ni identité n’a changé.');
    } catch (cause) { if (currentRequest()) setError(cause instanceof Error ? cause.message : 'La recherche d’alternatives a échoué.'); }
    finally { if (currentRequest()) setBusy(null); }
  };
  const proposeManualOfferObservation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resolvedTarget || resolvedTarget.scope !== 'offer' || manualReason.trim().length < 2) return;
    const currentRequest = beginRequest();
    setBusy('proposal'); setError(''); setNotice(''); setAlternatives(null); setReceipt(null);
    try {
      const checkedAt = new Date(manualCheckedAt).toISOString();
      const source = { title: manualSourceTitle.trim(), url: manualSourceUrl.trim(), checkedAt };
      const manual = manualKind === 'stock'
        ? { kind: 'stock' as const, status: manualStatus as 'in-stock' | 'out-of-stock' | 'unknown', text: manualText.trim(), source }
        : { kind: 'shipping' as const, status: manualStatus as 'yes' | 'no' | 'unknown', conditions: manualText.trim(), source };
      const next = await YeastDbCorrections.propose(resolvedTarget, manualReason, manual);
      if (!currentRequest()) return;
      if (targetKey(next.target) !== key) throw new Error('Cette proposition appartient à une autre cible. Relance la demande pour la fiche ouverte.');
      setProposal(next);
      setSelected(next.changes.map(change => change.id));
      setNotice('Observation manuelle préparée. Le serveur vérifiera la révision et enregistrera l’audit; il ne valide pas lui-même la page source.');
    } catch (cause) { if (currentRequest()) setError(cause instanceof Error ? cause.message : 'L’observation manuelle n’a pas pu être préparée.'); }
    finally { if (currentRequest()) setBusy(null); }
  };

  const createdFields = new Set(proposal?.changes.filter(change => manualCreationFields.has(change.field)).map(change => change.field) ?? []);
  const title = resolvedTarget ? `Levure · ${name}` : 'Correction des données levure';
  const primaryLabel = manualStarter ? 'Enregistrer la notice dans la base'
    : createdFields.has('product.create') ? 'Créer le produit exact'
    : createdFields.has('offer.create') ? 'Ajouter l’offre exacte'
      : proposal?.targetExists === false
        ? resolvedTarget?.scope === 'catalogue' ? 'Enregistrer la fiche personnelle corrigée' : 'Créer la fiche produit/offre corrigée'
        : 'Confirmer la correction dans la base';
  const proposalLabel = manualStarter ? 'Notice de préparation manuelle'
    : createdFields.has('product.create') ? 'Création manuelle du produit exact'
    : createdFields.has('offer.create') ? 'Ajout manuel d’une offre'
      : proposal?.model === 'Saisie manuelle' ? 'Observation manuelle' : 'Proposition Gemini';
  const receiptCreation = receipt?.entityCreated === 'product' ? ' · produit exact créé'
    : receipt?.entityCreated === 'offer' ? ` · offre ajoutée${receipt.targetCreated ? ' · fiche produit créée' : ''}`
      : receipt?.targetCreated ? ` · ${receipt.target.scope === 'catalogue' ? 'fiche catalogue' : 'fiche produit'} créée${manualStarter ? ' · notice enregistrée' : ''}`
        : receipt && manualStarter ? ' · notice enregistrée' : '';
  return <Sheet open={!!resolvedTarget} onClose={requestClose} title={title} subtitle="Une source et une révision sont contrôlées avant toute écriture." className="max-w-3xl mx-auto"
    footer={proposal ? <div className="flex gap-2 p-2">
      {receipt ? <Button className="flex-1" intent="primary" disabled={busy !== null} onClick={requestClose}>Fermer</Button> : <>
        <Button className="flex-1" disabled={busy !== null} onClick={() => {
          if (initialProposal) { requestClose(); return; }
          setProposal(null); setSelected([]); setNotice('Proposition écartée. Aucune donnée modifiée.');
        }}>Écarter</Button>
        <Button className="flex-[2] min-w-0" intent="primary" disabled={busy !== null || !selected.length} onClick={confirm} icon={<ArrowRight size={16} />}>{busy === 'apply' ? 'Confirmation serveur…' : primaryLabel}</Button>
      </>}
    </div> : undefined}>
    <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 space-y-4">
      {resolvedTarget && <div className="rounded-control border border-cave-700 bg-cave-850 p-3 text-sm text-cave-200">
        <strong className="text-cave-50">Portée : {resolvedTarget.scope === 'catalogue' ? 'fiche documentaire levure' : resolvedTarget.scope === 'stock' ? `article de stock ${resolvedTarget.ref}` : resolvedTarget.scope === 'product' ? 'produit exact' : `offre ${resolvedTarget.offerId}`}</strong>
        {bootstrapOnly && <p className="mt-1 text-xs text-attention">Cette ligne vient du catalogue bootstrap et n’existe pas encore dans la base personnelle. La confirmer créera explicitement sa fiche canonique; rien ne sera écrit à la sélection.</p>}
        {resolvedTarget.scope === 'catalogue' && <p className="mt-1 text-xs text-cave-400">La collecte brute et son empreinte restent intactes. La correction enregistrée forme une surcouche sourcée; une fiche déjà adoptée dans une recette ne sera pas réécrite.</p>}
      </div>}
      {currentManualCreation && <p className="rounded-control border border-attention/30 bg-cave-850 p-3 text-sm text-attention">
        Cette saisie propose une création canonique du {createdFields.has('product.create') ? 'produit exact' : 'de l’offre exacte'}. Le serveur contrôlera l’identité, la forme et la révision, pas les faits ni les sources marchandes. Rien ne sera écrit avant confirmation.
      </p>}
      {manualStarter && <p className="rounded-control border border-attention/30 bg-cave-850 p-3 text-sm text-attention" data-manual-starter>
        Cette saisie propose d’enregistrer la notice de préparation de ce produit exact, telle que tu l’as citée. Le serveur contrôle le produit et la révision, pas le contenu de la notice ni la page citée. Aucune croissance ni cellule n’est calculée ; le plan reste à faire dans la recette.
      </p>}
      {!currentManualCreation && !manualStarter && <form autoComplete="off" onSubmit={ask} className="space-y-2">
        <label htmlFor="yeast-db-correction-request" className="block text-sm font-semibold text-cave-200">Que vérifier ou corriger?</label>
        <Textarea id="yeast-db-correction-request" className={`${inputClass} w-full min-h-[5.5rem]`} value={request} maxLength={3000} rows={3} onChange={event => setRequest(event.target.value)} placeholder="Ex. Vérifie la plage de température et sa source, même si elle est déjà enregistrée." />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" intent="primary" disabled={busy !== null || request.trim().length < 2} icon={<Sparkles size={16} />}>{busy === 'proposal' ? 'Gemini vérifie…' : 'Proposer une correction'}</Button>
          <Button type="button" disabled={busy !== null || request.trim().length < 2} onClick={searchAlternatives} icon={<Search size={16} />}>{busy === 'alternatives' ? 'Recherche…' : 'Rechercher des alternatives'}</Button>
        </div>
        <p className="text-xs text-cave-400">La source citée aide à vérifier la proposition; elle ne prouve pas à elle seule chaque valeur. Le stock vendeur n’est proposé qu’après lecture serveur de sa page produit exacte.</p>
      </form>}
      {error && <p role="alert" className="rounded-control border border-alert/40 bg-alert/10 p-2 text-sm text-alert">{error}</p>}
      {notice && <p role="status" aria-live="polite" className="rounded-control border border-cave-700 p-2 text-sm text-cave-200">{notice}</p>}
      {receipt && <section className="space-y-1 rounded-control border border-water/40 bg-cave-850 p-3" aria-label="Reçu serveur">
        <h3 className="text-sm font-semibold text-water">Reçu serveur confirmé</h3>
        <p className="text-xs text-cave-400">Révision {receipt.revisionBefore.slice(0, 12)} → {receipt.revisionAfter.slice(0, 12)} · audit {receipt.auditId}{receiptCreation}</p>
        {receipt.readback === 'pending' && <p className="text-xs text-attention">Le serveur a confirmé l’écriture; la lecture dans le cache local reste en attente.</p>}
      </section>}
      {!currentManualCreation && resolvedTarget?.scope === 'offer' && <details className="rounded-control border border-cave-700 p-3">
        <summary className="min-h-touch cursor-pointer text-sm text-cave-200">Saisir une observation manuelle</summary>
        <form autoComplete="off" onSubmit={proposeManualOfferObservation} className="mt-3 space-y-2">
          <p className="text-xs text-cave-400">Utile si la page ne peut pas être lue. La date, le lien et le texte sont ta propre observation; la confirmation serveur porte sur l’enregistrement, pas sur la véracité de la page.</p>
          <label className="block text-sm text-cave-200">Observation à corriger
            <select className={`${inputClass} mt-1 w-full`} value={manualKind} onChange={event => { setManualKind(event.target.value as typeof manualKind); setManualStatus('unknown'); setManualText(''); }}>
              <option value="stock">Disponibilité</option><option value="shipping">Livraison en Suisse</option>
            </select>
          </label>
          <label className="block text-sm text-cave-200">{manualKind === 'stock' ? 'Disponibilité observée' : 'Livraison vers CH'}
            <select className={`${inputClass} mt-1 w-full`} value={manualStatus} onChange={event => setManualStatus(event.target.value as typeof manualStatus)}>
              {manualKind === 'stock' ? <><option value="unknown">Inconnue</option><option value="in-stock">En stock · annoncé</option><option value="out-of-stock">Hors stock · annoncé</option></>
                : <><option value="unknown">Non précisée</option><option value="yes">Oui · conditions relevées</option><option value="no">Non · refus relevé</option></>}
            </select>
          </label>
          <label className="block text-sm text-cave-200">{manualKind === 'stock' ? 'Texte vu sur la fiche vendeur' : 'Conditions de livraison lues'}
            <Textarea className={`${inputClass} mt-1 w-full`} value={manualText} maxLength={manualKind === 'stock' ? 500 : 2000} rows={2} onChange={event => setManualText(event.target.value)} placeholder={manualKind === 'stock' ? 'Ex. En stock — prêt à être expédié' : 'Ex. Frais et restrictions pour la Suisse…'} />
          </label>
          <label className="block text-sm text-cave-200">Titre de la source
            <Input className={`${inputClass} mt-1 w-full`} value={manualSourceTitle} maxLength={500} onChange={event => setManualSourceTitle(event.target.value)} placeholder="Fiche produit exacte" />
          </label>
          <label className="block text-sm text-cave-200">URL directe de la page source
            <Input type="url" className={`${inputClass} mt-1 w-full`} value={manualSourceUrl} maxLength={2000} onChange={event => setManualSourceUrl(event.target.value)} placeholder="https://vendeur.example/produit/format" />
          </label>
          <label className="block text-sm text-cave-200">Date et heure de l’observation
            <input type="datetime-local" className={`${inputClass} mt-1 w-full`} value={manualCheckedAt} onChange={event => setManualCheckedAt(event.target.value)} />
          </label>
          <label className="block text-sm text-cave-200">Motif de la correction
            <Textarea className={`${inputClass} mt-1 w-full`} value={manualReason} maxLength={2000} rows={2} onChange={event => setManualReason(event.target.value)} placeholder="Ex. L’offre indiquait une disponibilité datée ancienne." />
          </label>
          <Button type="submit" disabled={busy !== null || manualReason.trim().length < 2 || !manualText.trim() || !manualSourceTitle.trim() || !manualSourceUrl.trim() || !manualCheckedAt}>
            Préparer cette observation
          </Button>
        </form>
      </details>}
      {proposal && <section className="space-y-3" aria-label={proposalLabel}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><h3 className="text-base font-semibold text-cave-50">{proposal.title}</h3><p className="text-xs text-cave-400">Proposition locale · {proposal.model} · {new Date(proposal.generatedAt).toLocaleString('fr-CH')}</p></div>
          <span className="rounded-control border border-cave-700 px-2 py-1 text-xs text-cave-400">{selected.length}/{proposal.changes.length} changements sélectionnés</span>
        </div>
        {proposal.model === 'Saisie manuelle' && !currentManualCreation && <p className="rounded-control border border-attention/30 bg-cave-850 p-2 text-xs text-attention">Le serveur pourra confirmer l’écriture et l’auditer; il n’a pas vérifié la page ou l’observation saisie.</p>}
        {proposal.targetExists === false && !currentManualCreation && <p className="text-sm text-attention">La cible canonique est absente; la confirmation créera le document depuis cette fiche bootstrap, uniquement si le serveur la trouve toujours absente.</p>}
        {proposal.changes.some(change => change.group?.startsWith('ambigu-')) && <p className="text-xs text-attention">Plusieurs observations partagent le même champ et contexte. Choisis une seule ligne à remplacer; les autres sources restent visibles.</p>}
        <div className="space-y-2">{proposal.changes.map(change => <ChangeCard key={change.id} change={change} selected={selected.includes(change.id)} disabled={busy !== null || !!receipt} onToggle={checked => toggle(change, checked)} citations={citations} />)}</div>
        <CitationList citations={citations} />
      </section>}
      {alternatives && <AlternativeResult turn={alternatives} />}
    </div>
  </Sheet>;
}
