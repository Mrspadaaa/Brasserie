import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, X } from 'lucide-react';
import type { HopSource } from '../../functions/src/hopIndexSchema';
import type { YeastFactReading } from '../../functions/src/yeastTechnicalFacts';
import type { YeastSpec } from '../types';
import { yeastSpecForCandidate, type YeastRecipeCandidate } from '../domain/yeastRecipeDesign';
import { resolveYeastDossier, type YeastDossier, type YeastDossierMeasurement } from '../domain/yeastProjection';
import { yeastHomonymKey } from '../domain/yeastCatalogue';
import { YEAST_RECIPE_PROFILES } from '../data/yeastRecipeProfiles';
import { yeastStrainInformation } from '../domain/yeastStrainInformation';
import { YeastStrainDetails } from './YeastStrainDetails';
import { YEAST_VALUE_KIND, yeastMeasurementValue, yeastValueText } from './YeastRecipeDossier';

type Candidate = YeastRecipeCandidate;
type SelectionContext = 'recipe' | 'scenario';
type DraftReference = { label: string; lab?: string; form?: string };
type Homonym = { text: string; sameLabel: boolean };
type Measurement = Pick<YeastDossierMeasurement, 'range' | 'qualifier'> & { sources?: HopSource[] };
/** A visible ceiling keeps every column readable. Alternatives are only added by the brewer. */
export const MAX_COMPARED_ALTERNATIVES = 6;
const profileByYeast = new Map(YEAST_RECIPE_PROFILES.map(profile => [profile.yeastId, profile]));

const descriptor = (value: string) => value.replace(/ \((?:Description qualitative du fabricant|Descripteurs qualitatifs du fabricant)[^)]*\)\.?$/, '').trim();
const displayNumber = (value: number) => value.toLocaleString('fr-FR', { maximumFractionDigits: 20 });
const signed = (value: number) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${displayNumber(Math.abs(value))}`;

/** Published measurement in one line: a range reads as a range, a bound keeps its operator, a point stays a point. */
export const yeastChoiceRange = (value: Measurement | undefined, unit: string) => value
  ? yeastValueText(yeastMeasurementValue(value), unit).replace(' · valeur ponctuelle', ' (point)') : 'Inconnu';

function SourceCitation({ source }: { source?: HopSource }) {
  if (!source) return null;
  const label = `Source : ${[source.author, source.title, source.year].filter(Boolean).join(' · ')}`;
  return /^https?:\/\//.test(source.reference)
    ? <a className="yeast-source underline underline-offset-2" href={source.reference} target="_blank" rel="noreferrer">{label}</a>
    : <span className="yeast-small">{label}{source.locator ? ` · ${source.locator}` : ''}</span>;
}

function documentedDescription(candidate: Candidate) {
  const value = candidate.evidence.descriptor?.trim();
  const source = candidate.evidence.descriptorSource;
  return value && source ? { value: descriptor(value), source } : undefined;
}

function comparisonDescription(candidate: Candidate) {
  const profile = profileByYeast.get(candidate.yeastId);
  if (profile?.descriptor && profile.source) return { value: profile.descriptor, source: profile.source };
  const description = documentedDescription(candidate);
  return { value: description?.value.split(/(?<=[.!?])\s/)[0] || 'Inconnu', source: description?.source };
}

function sourceLabel(source?: HopSource) {
  if (!source) return 'source non précisée';
  const origin = source.author || source.title || source.reference.replace(/^https?:\/\/(?:www\.)?/, '').split('/')[0];
  return `source ${[origin, source.year].filter(Boolean).join(' ')}`;
}

/** A category reading keeps its own provenance; no source is invented for it. */
function readingSource(reading: YeastFactReading): HopSource | undefined {
  if (!reading.source && !reading.sourceUrl) return undefined;
  return { author: reading.origin === 'manufacturer' ? 'Fiche fabricant' : reading.origin === 'ai' ? 'Recherche IA' : 'Donnée personnelle',
    title: reading.source ?? reading.sourceUrl!, reference: reading.sourceUrl ?? reading.source!, kind: reading.origin === 'manufacturer' ? 'manufacturer' : 'observation', year: null };
}

/** Same product name is signalled, never merged: each row keeps its own id, form, source and facts. */
function homonymHints(candidates: Candidate[]) {
  const groups = new Map<string, Candidate[]>();
  for (const candidate of candidates) {
    const key = yeastHomonymKey(candidate.label, candidate.lab);
    if (key) groups.set(key, [...groups.get(key) ?? [], candidate]);
  }
  const traits: ((candidate: Candidate) => string)[] = [
    candidate => candidate.lab || 'laboratoire non précisé',
    candidate => candidate.reference.form ?? 'forme non publiée',
    candidate => candidate.reference.catalogue?.productCode ? `code ${candidate.reference.catalogue.productCode}` : 'sans code imprimé',
    candidate => sourceLabel(candidate.reference.source),
    candidate => `${candidate.reference.catalogue?.facts?.length ?? 0} faits sourcés`,
  ];
  const hints = new Map<string, Homonym>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const distinct = traits.filter(trait => new Set(group.map(trait)).size > 1).slice(0, 2);
    const texts = group.map(candidate => distinct.map(trait => trait(candidate)).join(' · '));
    group.forEach((candidate, index) => {
      const unique = !!texts[index] && texts.filter(text => text === texts[index]).length === 1;
      hints.set(candidate.yeastId, {
        text: unique ? texts[index] : [texts[index], `fiche ${candidate.yeastId}`].filter(Boolean).join(' · '),
        sameLabel: group.some(other => other !== candidate && other.label === candidate.label),
      });
    });
  }
  return hints;
}

/** Same marks as the other criteria: the value is read above, the mark only says whether it matches. */
function formDelta(candidate: Candidate, referenceForm?: string) {
  if (!candidate.reference.form) return '';
  if (!referenceForm) return 'forme de référence inconnue';
  return candidate.reference.form === referenceForm ? '= référence' : '≠ référence';
}

/** Linked catalogue sheet of the reference, without what its identity line already says (its name included). */
function catalogueLine(candidate: Candidate, shown: DraftReference) {
  const key = (text?: string) => (text ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const label = key(candidate.label), code = candidate.reference.catalogue?.productCode;
  return [label === key(shown.label) ? '' : candidate.label,
    candidate.lab && key(candidate.lab) !== key(shown.lab) && !label.includes(key(candidate.lab)) ? candidate.lab : '',
    code && !label.includes(key(code)) ? `code ${code}` : '',
  ].filter(Boolean).join(' · ') || 'fiche liée';
}

type ColumnSource = { source: HopSource; rows: Set<string> };
const sourceKey = (source: HopSource) => JSON.stringify([source.reference, source.title ?? '', source.locator ?? '']);
/** The source most facts of one column share: said once in the column head; a cell keeps only a source of its own. */
function sharedColumnSource(entries: [string, HopSource | undefined][]): ColumnSource | undefined {
  const groups = new Map<string, ColumnSource>();
  for (const [row, source] of entries) {
    if (!source) continue;
    const group = groups.get(sourceKey(source)) ?? { source, rows: new Set<string>() };
    group.rows.add(row); groups.set(sourceKey(source), group);
  }
  const best = [...groups.values()].sort((a, b) => b.rows.size - a.rows.size)[0];
  return best && best.rows.size > 1 ? best : undefined;
}

/** Compare compatible published shapes; no midpoint or point is derived from a range/bound. */
export function rangeDelta(value: Measurement | undefined, reference: Measurement | undefined, unit: string, same: string) {
  if (!value || !reference) return 'Écart inconnu';
  if (value.qualifier === 'range' && reference.qualifier === 'range') {
    if (value.range.min === reference.range.min && value.range.max === reference.range.max) return same;
    const overlap = value.range.min <= reference.range.max && reference.range.min <= value.range.max;
    return `${overlap ? 'Chevauche' : 'Ne chevauche pas'} · min ${signed(value.range.min - reference.range.min)}, max ${signed(value.range.max - reference.range.max)} ${unit}`;
  }
  if (value.qualifier === 'reportedPoint' && reference.qualifier === 'range')
    return value.range.min >= reference.range.min && value.range.min <= reference.range.max ? 'Point dans la plage de la référence' : 'Point hors de la plage de la référence';
  if (JSON.stringify([value.range, value.qualifier]) === JSON.stringify([reference.range, reference.qualifier])) return 'Même valeur que la référence';
  const reading = yeastMeasurementValue(value), baseline = yeastMeasurementValue(reference);
  if (reading.kind === 'point' && baseline.kind === 'point') return `Écart publié ${signed(reading.value - baseline.value)} ${unit}`;
  if (reading.kind === 'bound' && baseline.kind === 'bound') return 'Bornes publiées distinctes : aucune valeur ponctuelle comparée';
  return `Types différents (${YEAST_VALUE_KIND[yeastMeasurementValue(value).kind]} / ${YEAST_VALUE_KIND[yeastMeasurementValue(reference).kind]}) : pas d’écart calculé`;
}

/** Cell reading of the same comparison: the bar shows the overlap, the text keeps only what differs.
 * Same shapes as rangeDelta; no midpoint, no point derived from a range or a bound. */
export function compactRangeDelta(value: Measurement | undefined, reference: Measurement | undefined, unit: string) {
  if (!value) return '';
  if (!reference) return 'référence inconnue';
  const moved = (delta: number) => Math.abs(delta) > 1e-9;
  if (value.qualifier === 'range' && reference.qualifier === 'range') {
    const min = value.range.min - reference.range.min, max = value.range.max - reference.range.max;
    if (!moved(min) && !moved(max)) return '= référence';
    const overlap = value.range.min <= reference.range.max && reference.range.min <= value.range.max;
    const bounds = [moved(min) ? `min ${signed(min)}` : '', moved(max) ? `max ${signed(max)}` : ''].filter(Boolean).join(' · ');
    return `${overlap ? '' : 'sans chevauchement · '}${bounds} ${unit}`;
  }
  if (value.qualifier === 'reportedPoint' && reference.qualifier === 'range')
    return value.range.min >= reference.range.min && value.range.min <= reference.range.max ? 'point dans la plage de référence' : 'point hors de la plage de référence';
  if (JSON.stringify([value.range, value.qualifier]) === JSON.stringify([reference.range, reference.qualifier])) return '= référence';
  const reading = yeastMeasurementValue(value), baseline = yeastMeasurementValue(reference);
  if (reading.kind === 'point' && baseline.kind === 'point') return `écart ${signed(reading.value - baseline.value)} ${unit}`;
  if (reading.kind === 'bound' && baseline.kind === 'bound') return 'bornes distinctes : pas d’écart calculé';
  return `types différents (${YEAST_VALUE_KIND[reading.kind]} / ${YEAST_VALUE_KIND[baseline.kind]}) : pas d’écart calculé`;
}

function styleUseText(candidate: Candidate) {
  return candidate.styleMatch === 'documented' ? 'Usage documenté'
    : candidate.styleMatch === 'excluded' ? 'Une source déconseille cet usage'
      : candidate.styleMatch === 'other-style' ? 'Adéquation à cette famille inconnue'
        : 'Usage inconnu';
}

/** A search result outside the documented family stays visible with its uncertainty. */
function styleNote(candidate: Candidate, styleLabel: string | null) {
  if (candidate.styleMatch === 'excluded') return 'Une source déconseille cet usage';
  if (!styleLabel || candidate.styleMatch === 'documented') return undefined;
  return `Usage pour ${styleLabel} non documenté`;
}

/** `withFacts` is false in the side by side, whose rows already align these values with their sources. */
function SourceAndConditions({ candidate, form, onFormChange, allowFormChange, reading, withFacts = true }: {
  candidate: Candidate; form?: Candidate['form']; onFormChange: (form?: Candidate['form']) => void; allowFormChange: boolean; reading: YeastDossier;
  withFacts?: boolean;
}) {
  const id = useId();
  const description = documentedDescription(candidate);
  const reason = Object.values(candidate.evidence.goalReasons).find(item => item?.text === candidate.reason);
  const flocculation = reading.flocculation.value.kind === 'category' ? reading.flocculation.value.value : 'Inconnue';
  return <div className="yc-candidate-details pt-1">
    {description ? <p>{description.value}<span className="block yeast-small"><SourceCitation source={description.source} /></span></p>
      : <p className="yeast-small">Caractère publié : Inconnu.</p>}
    {reason && <p>{reason.text}<span className="block yeast-small"><SourceCitation source={reason.source} /></span></p>}
    {withFacts && <dl className="yc-facts">
      <div><dt>Usage de style</dt><dd>{styleUseText(candidate)}</dd></div>
      <div><dt>Forme publiée</dt><dd>{candidate.reference.form ?? 'Inconnue'}<span className="block"><SourceCitation source={candidate.reference.source} /></span></dd></div>
      <div><dt>Plage fabricant</dt><dd>{yeastChoiceRange(reading.temperature, '°C')}<span className="block"><SourceCitation source={reading.temperature?.sources[0]} /></span></dd></div>
      <div><dt>Atténuation annoncée</dt><dd>{yeastChoiceRange(reading.documentedAttenuation, '%')}<span className="block"><SourceCitation source={reading.documentedAttenuation?.sources[0]} /></span></dd></div>
      <div><dt>Tolérance à l’alcool</dt><dd>{yeastChoiceRange(reading.alcoholTolerance, '% vol')}</dd></div>
      <div><dt>Floculation</dt><dd>{flocculation}</dd></div>
    </dl>}
    {!candidate.reference.form && allowFormChange && <label className="yc-form" htmlFor={id}>Forme du produit pour ce choix
      <select id={id} value={form ?? ''} onChange={e => onFormChange((e.target.value as Candidate['form']) || undefined)}>
        <option value="">À préciser</option><option value="sèche">Sèche</option><option value="liquide">Liquide</option><option value="levain">Levain</option>
      </select>
    </label>}
    {candidate.evidence.warnings.map((text, index) => <p className="yeast-notice" key={`${text}-${index}`}>{text}</p>)}
    {candidate.evidence.exclusions.map((item, index) => <p className="yeast-notice" key={`${item.reported}-${index}`}>{item.reported}</p>)}
    <YeastStrainDetails information={yeastStrainInformation(candidate.reference, form ?? candidate.reference.form)} />
  </div>;
}

function FactSource({ source }: { source?: HopSource }) {
  if (!source) return null;
  return <details className="yc-fact-source"><summary>Source <ChevronDown size={11} aria-hidden="true" /></summary><SourceCitation source={source} /></details>;
}

/** Column head: the shared source once, with the criteria it covers, so a cell without its own link is not read as unsourced. */
function ColumnSourceNote({ shared, labels }: { shared?: ColumnSource; labels: string[] }) {
  if (!shared) return null;
  return <details className="yc-fact-source yc-column-source"><summary>Source commune <ChevronDown size={11} aria-hidden="true" /></summary>
    <SourceCitation source={shared.source} /><span className="block">Pour : {labels.join(', ')}.</span></details>;
}

function Described({ candidate, withSource = true }: { candidate: Candidate; withSource?: boolean }) {
  const description = comparisonDescription(candidate);
  return <>{description.value}{withSource && <FactSource source={description.source} />}</>;
}

/** Only published ranges and points share a drawn scale; a one-sided bound is read, not drawn as a band. */
const drawable = (value?: Measurement): value is Measurement => !!value && (value.qualifier === 'range' || value.qualifier === 'reportedPoint');
function sharedScale(values: (Measurement | undefined)[]) {
  const known = values.filter(drawable);
  if (!known.length) return undefined;
  const low = Math.min(...known.map(value => value.range.min));
  const high = Math.max(...known.map(value => value.range.max));
  const pad = Math.max(1, (high - low) * 0.1);
  return { min: Math.floor(low - pad), max: Math.ceil(high + pad) };
}

/** Dashed band = reference, solid bar = the column's own published range, on one scale per criterion. */
function ComparisonRange({ value, baseline, scale }: { value?: Measurement; baseline?: Measurement; scale?: { min: number; max: number } }) {
  const shown = drawable(value) ? value : undefined, reference = drawable(baseline) ? baseline : undefined;
  if (!scale || scale.max <= scale.min || (!shown && !reference)) return null;
  const percent = (point: number) => Math.max(0, Math.min(100, (point - scale.min) / (scale.max - scale.min) * 100));
  return <span className="yc-range" aria-hidden="true" data-scale-min={scale.min} data-scale-max={scale.max}>
    {reference && <i className="yc-range-baseline" style={{ left: `${percent(reference.range.min)}%`, width: `${percent(reference.range.max) - percent(reference.range.min)}%` }} />}
    {shown && <span style={{ left: `${percent(shown.range.min)}%`, width: `${percent(shown.range.max) - percent(shown.range.min)}%` }} />}
  </span>;
}

/** Search results are chosen directly: « Choisir » calls onChoose, which makes the strain the draft's.
 * Comparison stays optional and secondary: the brewer adds alternatives, opens the side by side, and each
 * column offers the same direct choice plus, with onTry, a local conduct trial. Nothing here writes the recipe itself. */
export function YeastChoiceResults({ candidates, shown, selectedId, onChoose, onTry, controls, afterList, selectionContext = 'recipe', styleLabel = 'la famille sélectionnée', trialId, draftReference,
  sheetYeast, sheetRevision, renderSheet, referenceDossier, referenceYeast, onEditReference, compareRequest }: {
  candidates: Candidate[]; shown: Candidate[]; selectedId: string;
  /** @deprecated Ignored: no alternative is compared without an explicit choice. */
  comparisonCandidates?: Candidate[];
  onChoose: (id: string, form?: Candidate['form']) => void;
  /** Local conduct trial of a compared alternative; the draft keeps its strain until that trial is applied. */
  onTry?: (id: string, form?: Candidate['form']) => void;
  controls?: ReactNode; afterList?: ReactNode;
  selectionContext?: SelectionContext;
  /** null when no style family is known: a usage note would only repeat that unknown. */
  styleLabel?: string | null;
  trialId?: string;
  /** Draft strain outside the catalogue: still the reference column, with unknown published criteria. */
  draftReference?: DraftReference;
  /** Documentary state of a candidate: its local corrected sheet when any, otherwise its catalogue sheet. */
  sheetYeast?: (candidate: Candidate) => YeastSpec;
  /** Local sheet revision; 0 means the catalogue sheet is uncorrected. */
  sheetRevision?: (candidate: Candidate) => number;
  /** In-flow editor of one candidate's local sheet, named for that candidate. */
  renderSheet?: (candidate: Candidate, close: () => void) => ReactNode;
  /** Reading the recipe projection uses for the draft strain: values, types and provenance of the reference column. */
  referenceDossier?: YeastDossier;
  referenceYeast?: YeastSpec;
  /** Opens the correction of the draft strain itself (recipe scope), never a candidate sheet. */
  onEditReference?: () => void;
  /** Adds one candidate to the side by side and opens it, on the brewer's explicit request. */
  compareRequest?: { id: string; nonce: number };
}) {
  const [ids, setIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [position, setPosition] = useState(0);
  const [inspectedId, setInspectedId] = useState('');
  const [sheetTarget, setSheetTarget] = useState<{ id: string; place: 'list' | 'comparison' }>();
  const [compareRequestNotice, setCompareRequestNotice] = useState('');
  const [forms, setForms] = useState<Record<string, Candidate['form']>>({});
  const uid = useId();
  const comparisonHeading = useRef<HTMLHeadingElement>(null);
  const sheetPanel = useRef<HTMLElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const byId = useMemo(() => new Map(candidates.map(candidate => [candidate.yeastId, candidate])), [candidates]);
  const byIdRef = useRef(byId); byIdRef.current = byId;
  const selectedIdRef = useRef(selectedId); selectedIdRef.current = selectedId;
  const idsRef = useRef(ids); idsRef.current = ids;
  const compareRequestRef = useRef(compareRequest); compareRequestRef.current = compareRequest;
  const processedCompareNonce = useRef<number | undefined>(undefined);
  const comparisonHeadingRef = useRef<(() => void)>(() => {});
  const homonyms = useMemo(() => homonymHints(candidates), [candidates]);
  useEffect(() => {
    setIds(previous => {
      const next = previous.filter(id => id !== selectedId && byId.has(id));
      return next.length === previous.length ? previous : next;
    });
  }, [byId, selectedId]);
  const alternatives = ids.flatMap(id => byId.get(id) ?? []);
  useEffect(() => {
    if (!alternatives.length) setCompareOpen(false);
    setPosition(previous => Math.min(previous, Math.max(0, alternatives.length - 1)));
  }, [alternatives.length]);
  // Navigation and the swipe hint only where columns actually overflow. An unmeasured
  // width (no layout yet) keeps them: hiding a way to reach a column is the worse error.
  const [overflow, setOverflow] = useState(true);
  useLayoutEffect(() => {
    const element = scroller.current;
    if (!compareOpen || !element) return;
    const measure = () => setOverflow(!(element.clientWidth > 0 && element.scrollWidth <= element.clientWidth + 1));
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, [compareOpen, alternatives.length]);
  useEffect(() => {
    const request = compareRequestRef.current;
    if (!request || processedCompareNonce.current === request.nonce || request.id === selectedIdRef.current || !byIdRef.current.has(request.id)) return;
    processedCompareNonce.current = request.nonce;
    if (idsRef.current.includes(request.id)) {
      setCompareRequestNotice('');
      comparisonHeadingRef.current();
      return;
    }
    if (idsRef.current.length >= MAX_COMPARED_ALTERNATIVES) {
      const requested = byIdRef.current.get(request.id);
      setCompareRequestNotice(`Comparaison pleine : ${requested?.label ?? request.id} n’a pas été ajouté. Retire une alternative, puis relance « Comparer avec… ».`);
      return;
    }
    setCompareRequestNotice('');
    setIds(previous => previous.includes(request.id) || previous.length >= MAX_COMPARED_ALTERNATIVES ? previous : [...previous, request.id]);
    comparisonHeadingRef.current();
  }, [compareRequest?.nonce, byId, selectedId]);

  const baseline = byId.get(selectedId);
  // The recipe/stock name is the actual reference identity. The linked catalogue
  // entry remains a separate source, even when its hopIndexId is known.
  const reference: DraftReference | undefined = draftReference ?? (baseline
    ? { label: baseline.label, lab: baseline.lab, form: baseline.reference.form } : undefined);
  const referenceForm = draftReference ? draftReference.form : baseline?.reference.form;
  const showCatalogueReference = !!baseline && !!draftReference && (baseline.label !== draftReference.label || baseline.lab !== draftReference.lab || baseline.reference.form !== draftReference.form);
  const referenceWord = selectionContext === 'recipe' ? 'brouillon' : 'essai';
  const selectedLabel = selectionContext === 'recipe' ? 'Dans la recette' : 'Dans l’essai';
  const nameOf = (candidate: Candidate) => {
    const hint = homonyms.get(candidate.yeastId);
    return hint?.sameLabel ? `${candidate.label} (${hint.text})` : candidate.label;
  };
  const hintId = (candidate: Candidate) => homonyms.has(candidate.yeastId) ? `${uid}-homonym-${candidate.yeastId}` : undefined;
  const formOf = (candidate: Candidate) => forms[candidate.yeastId] ?? candidate.reference.form;
  const setForm = (candidate: Candidate) => (form?: Candidate['form']) => setForms(previous => ({ ...previous, [candidate.yeastId]: form }));
  const yeastOf = (candidate: Candidate) => sheetYeast?.(candidate) ?? yeastSpecForCandidate(candidate);
  const corrected = (candidate: Candidate) => (sheetRevision?.(candidate) ?? 0) > 0;
  const readingOf = (candidate: Candidate): YeastDossier => {
    const reading = resolveYeastDossier(yeastOf(candidate), candidate.reference);
    // An uncorrected candidate keeps the published measurements of its catalogue card; a corrected sheet is read as corrected.
    return corrected(candidate) ? reading : { ...reading, temperature: candidate.temperature, documentedAttenuation: candidate.attenuation };
  };
  const toggle = (id: string) => { setCompareRequestNotice(''); setIds(previous => previous.includes(id) ? previous.filter(value => value !== id)
    : id === selectedId || previous.length >= MAX_COMPARED_ALTERNATIVES ? previous : [...previous, id]); };
  const remove = (id: string) => { setCompareRequestNotice(''); setIds(previous => previous.filter(value => value !== id)); };
  function openComparison() {
    setCompareOpen(true);
    requestAnimationFrame(() => { comparisonHeading.current?.focus({ preventScroll: true }); comparisonHeading.current?.scrollIntoView?.({ block: 'start' }); });
  }
  comparisonHeadingRef.current = openComparison;
  const openSheet = (candidate: Candidate, place: 'list' | 'comparison') => {
    setSheetTarget({ id: candidate.yeastId, place });
    if (place === 'list') setInspectedId(candidate.yeastId);
    requestAnimationFrame(() => { sheetPanel.current?.focus({ preventScroll: true }); sheetPanel.current?.scrollIntoView?.({ block: 'start' }); });
  };
  const closeSheet = () => setSheetTarget(undefined);
  const backToColumn = (candidate: Candidate) => {
    setSheetTarget(undefined);
    const index = alternatives.findIndex(item => item.yeastId === candidate.yeastId);
    requestAnimationFrame(() => { comparisonHeading.current?.scrollIntoView?.({ block: 'start' }); if (index >= 0) showAlternative(index); });
  };
  const columns = () => [...scroller.current?.querySelectorAll<HTMLElement>('th[data-role="alternative"]') ?? []];
  const referenceWidth = () => scroller.current?.querySelector<HTMLElement>('th[data-role="reference"]')?.offsetWidth ?? 0;
  function showAlternative(index: number) {
    const column = columns()[index];
    if (!column) return;
    setPosition(index);
    scroller.current?.scrollTo?.({ left: column.offsetLeft - referenceWidth(), behavior: 'smooth' });
  }
  const followScroll = () => {
    const left = (scroller.current?.scrollLeft ?? 0) + referenceWidth();
    const distances = columns().map(column => Math.abs(column.offsetLeft - left));
    if (distances.length) setPosition(distances.indexOf(Math.min(...distances)));
  };
  const formValue = (candidate: Candidate) => candidate.reference.form
    ?? (forms[candidate.yeastId] ? `Choix d’essai : ${forms[candidate.yeastId]}` : 'Forme non publiée');
  const sheet = (candidate: Candidate, editable: boolean) => <details className="yc-sheet">
    <summary aria-label={`Voir source et conditions de ${nameOf(candidate)}`}>Fiche <ChevronDown size={12} aria-hidden="true" /></summary>
    <SourceAndConditions candidate={candidate} form={formOf(candidate)} onFormChange={setForm(candidate)} allowFormChange={editable} reading={readingOf(candidate)} withFacts={false} />
  </details>;
  const readings = new Map(alternatives.map(candidate => [candidate.yeastId, readingOf(candidate)]));
  // The reference column reads what the recipe projection reads for the draft strain, corrections included.
  const baselineReading = referenceDossier ?? (baseline ? readingOf(baseline) : undefined);
  const hypothesis = referenceYeast && (referenceYeast.attenuationBasis === 'recipe' || referenceYeast.attenuationBasis === 'measured') && Number.isFinite(referenceYeast.attenuationPct)
    ? `${referenceYeast.attenuationBasis === 'measured' ? 'Retour mesuré' : 'Hypothèse de cette recette'} : ${displayNumber(referenceYeast.attenuationPct!)} %` : undefined;
  const unknown = <span className="yc-compare-missing">Inconnu</span>;
  const stockRef = referenceYeast?.stockItemRef;
  const styleRow = !!styleLabel || [baseline, ...alternatives].some(candidate => candidate?.styleMatch === 'excluded');
  const styleSource = (candidate: Candidate) => candidate.evidence.styleMatches[0]?.source ?? candidate.evidence.exclusions[0]?.source;
  /** Row → source of each cell of one column, as the cells below cite them. */
  const cellSources = (reading: YeastDossier | undefined, candidate: Candidate | undefined, alternative: boolean): [string, HopSource | undefined][] => [
    ['character', candidate && comparisonDescription(candidate).source],
    ['form', alternative ? candidate?.reference.source : undefined],
    ['temperature', reading?.temperature?.sources[0]], ['documentedAttenuation', reading?.documentedAttenuation?.sources[0]], ['alcoholTolerance', reading?.alcoholTolerance?.sources[0]],
    ['flocculation', reading?.flocculation.value.kind === 'category' ? readingSource(reading.flocculation) : undefined],
    ['style', alternative && styleRow && candidate ? styleSource(candidate) : undefined],
  ];
  const sharedSources = new Map<string, ColumnSource | undefined>([['reference', sharedColumnSource(cellSources(baselineReading, baseline, false))],
    ...alternatives.map(candidate => [candidate.yeastId, sharedColumnSource(cellSources(readings.get(candidate.yeastId), candidate, true))] as [string, ColumnSource | undefined])]);
  const namedInHead = (column: string, row: string) => !!sharedSources.get(column)?.rows.has(row);
  /** A cell cites its source only when the column head does not already name it. */
  const own = (column: string, row: string, source?: HopSource) => namedInHead(column, row) ? undefined : source;
  const measuredRow = (key: 'temperature' | 'documentedAttenuation' | 'alcoholTolerance', label: string, unit: string, missing: string, same: string) => {
    const scale = sharedScale([baselineReading?.[key], ...alternatives.map(candidate => readings.get(candidate.yeastId)?.[key])]);
    const cellValue = (value?: YeastDossierMeasurement) => value
      ? <><span className="yc-compare-value" data-value-kind={yeastMeasurementValue(value).kind}>{yeastValueText(yeastMeasurementValue(value), unit)}</span>
        {!drawable(value) && <span className="yc-delta">{YEAST_VALUE_KIND[yeastMeasurementValue(value).kind]} publiée, sans plage</span>}</>
      : <span className="yc-compare-missing" data-value-kind="unknown">{missing}</span>;
    return { key, label,
      reference: <>{cellValue(baselineReading?.[key])}<ComparisonRange baseline={baselineReading?.[key]} scale={scale} /><FactSource source={own('reference', key, baselineReading?.[key]?.sources[0])} />
        {key === 'documentedAttenuation' && hypothesis && <span className="yc-delta" data-reference-hypothesis>{hypothesis}</span>}</>,
      cell: (candidate: Candidate) => {
        const value = readings.get(candidate.yeastId)?.[key];
        // Without a reference column there is nothing to measure a difference against.
        const delta = reference ? compactRangeDelta(value, baselineReading?.[key], unit) : '';
        return <>{cellValue(value)}{value && <ComparisonRange value={value} baseline={baselineReading?.[key]} scale={scale} />}
          {delta && <span className="yc-delta" title={value && baselineReading?.[key] ? rangeDelta(value, baselineReading[key], unit, same) : undefined}>{delta}</span>}<FactSource source={own(candidate.yeastId, key, value?.sources[0])} /></>;
      } };
  };
  const flocculationCell = (column: string, reading?: YeastDossier) => reading?.flocculation.value.kind === 'category'
    ? <><span className="yc-compare-value" data-value-kind="category">{reading.flocculation.value.value}</span><span className="yc-delta">catégorie publiée</span><FactSource source={own(column, 'flocculation', readingSource(reading.flocculation))} /></>
    : <span className="yc-compare-missing" data-value-kind="unknown">Inconnue</span>;
  const rows: { key: string; label: string; reference: ReactNode; cell: (candidate: Candidate) => ReactNode }[] = [
    { key: 'character', label: 'Caractère documenté', reference: baseline ? <Described candidate={baseline} withSource={!namedInHead('reference', 'character')} /> : unknown,
      cell: candidate => <Described candidate={candidate} withSource={!namedInHead(candidate.yeastId, 'character')} /> },
    { key: 'form', label: 'Forme',
      reference: <><span className="yc-compare-value">{referenceForm ?? 'Non renseignée pour cette référence'}</span>
        {showCatalogueReference && baseline?.reference.form && baseline.reference.form !== referenceForm && <span className="yc-delta" data-catalogue-form>Fiche catalogue : {baseline.reference.form}</span>}</>,
      cell: candidate => { const delta = reference ? formDelta(candidate, referenceForm) : '';
        return <><span className="yc-compare-value">{formValue(candidate)}</span>{delta && <span className="yc-delta">{delta}</span>}<FactSource source={own(candidate.yeastId, 'form', candidate.reference.source)} /></>; } },
    measuredRow('temperature', 'Température publiée', '°C', 'Plage non publiée', 'Même plage que la référence'),
    measuredRow('documentedAttenuation', 'Atténuation annoncée', '%', 'Inconnu', 'Même plage que la référence'),
    measuredRow('alcoholTolerance', 'Tolérance à l’alcool', '% vol', 'Inconnue', 'Même plage que la référence'),
    { key: 'flocculation', label: 'Floculation', reference: flocculationCell('reference', baselineReading),
      cell: candidate => flocculationCell(candidate.yeastId, readings.get(candidate.yeastId)) },
    // A linked stock article is aligned with the alternatives' unknown stock; the catalogue sheet stays in the column head.
    // Without any article, the shared unknown is said once under the table.
    ...(reference && stockRef ? [{ key: 'stock', label: 'Stock personnel',
      reference: <span className="yc-compare-value" data-reference-stock>Lot {stockRef}</span>,
      cell: () => <span className="yc-compare-missing" data-value-kind="unknown">Non consulté ici</span> }] : []),
    ...(styleRow ? [{
      key: 'style', label: styleLabel ? `Usage pour ${styleLabel}` : 'Usage de style',
      reference: baseline ? styleUseText(baseline) : unknown,
      cell: (candidate: Candidate) => <>{styleUseText(candidate)}<FactSource source={own(candidate.yeastId, 'style', styleSource(candidate))} /></>,
    }] : []),
    { key: 'details', label: 'Fiche, source et conditions',
      reference: baseline ? sheet(baseline, false) : <span className="yc-compare-missing">Fiche catalogue non reconnue</span>,
      cell: candidate => sheet(candidate, selectionContext === 'recipe') },
  ];
  const comparable = shown.some(candidate => candidate.yeastId !== selectedId);
  const target = sheetTarget && byId.get(sheetTarget.id);
  const sheetRegion = (candidate: Candidate, place: 'list' | 'comparison') => renderSheet && sheetTarget?.id === candidate.yeastId && sheetTarget.place === place &&
    <section ref={sheetPanel} tabIndex={-1} className="yc-sheet-editor" aria-label={`Fiche de ${nameOf(candidate)}`} data-sheet-candidate={candidate.yeastId}>
      {renderSheet(candidate, closeSheet)}
      <div className="yc-sheet-editor-back">{place === 'comparison'
        ? <button type="button" className="yeast-link" onClick={() => backToColumn(candidate)}>Revenir au côte à côte · colonne {nameOf(candidate)}</button>
        : <button type="button" className="yeast-link" onClick={closeSheet}>Fermer la fiche de {nameOf(candidate)}</button>}</div>
    </section>;
  const sheetButton = (candidate: Candidate, place: 'list' | 'comparison', text: string) => renderSheet &&
    <button type="button" className="yc-sheet-action" aria-label={`Compléter ou corriger la fiche de ${nameOf(candidate)}`} aria-expanded={sheetTarget?.id === candidate.yeastId && sheetTarget.place === place}
      onClick={() => sheetTarget?.id === candidate.yeastId && sheetTarget.place === place ? closeSheet() : openSheet(candidate, place)}><Pencil size={12} aria-hidden="true" />{text}</button>;

  return <>
    {controls}
    {shown.length > 0 && <div className="yc-list-head" aria-hidden="true"><span>Levure</span><span>Plage fabricant</span></div>}
    <ul className="yc-list" aria-label="Références de levure à comparer">{shown.map(candidate => {
      const current = candidate.yeastId === selectedId, compared = ids.includes(candidate.yeastId);
      const hint = homonyms.get(candidate.yeastId), note = current ? undefined : styleNote(candidate, styleLabel);
      const temperature = readingOf(candidate).temperature;
      return <li key={candidate.yeastId} data-candidate-id={candidate.yeastId} data-current={current} data-trial={!current && candidate.yeastId === trialId}>
        <div className="yc-row">
          <div className="yc-identity"><strong>{candidate.label}</strong>
            <span className="yeast-small">{candidate.lab} · {candidate.reference.form ?? `forme non publiée${forms[candidate.yeastId] ? ` · choix ${forms[candidate.yeastId]}` : ''}`}</span>
            {hint && <span className="yc-homonym" id={hintId(candidate)}>Même nom qu’une autre fiche · {hint.text}</span>}
            {current && <span className="yc-tag">Levure du {referenceWord} · référence de comparaison</span>}
            {!current && candidate.yeastId === trialId && <span className="yc-tag yc-tag-trial">En essai local</span>}
            {!current && corrected(candidate) && <span className="yc-tag" data-sheet-corrected>Fiche corrigée localement</span>}
            {!current && <span className="yc-quick-difference">{comparisonDescription(candidate).value}</span>}
            {note && <span className={candidate.styleMatch === 'excluded' ? 'yeast-notice' : 'yc-style-note'}>{note}</span>}
          </div>
          <dl className="yc-values"><div><dt className="sr-only">Plage de fermentation publiée</dt><dd className={!temperature ? 'yc-missing' : undefined}>{yeastChoiceRange(temperature, '°C')}</dd></div></dl>
        </div>
        <div className="yc-row-actions">
          <button type="button" className="yc-choose" disabled={current} aria-label={current ? `${nameOf(candidate)} · ${selectedLabel.toLowerCase()}` : `Choisir ${nameOf(candidate)} pour le ${referenceWord}`} aria-describedby={hintId(candidate)}
            data-choose={candidate.yeastId} onClick={() => onChoose(candidate.yeastId, formOf(candidate))}>{current ? selectedLabel : 'Choisir'}</button>
          {!current && <label className="yc-compare-toggle"><input type="checkbox" aria-label={`Comparer ${nameOf(candidate)}`} aria-describedby={hintId(candidate)} checked={compared}
            disabled={!compared && ids.length >= MAX_COMPARED_ALTERNATIVES} onChange={() => toggle(candidate.yeastId)} />Comparer</label>}
          <button type="button" className="yeast-link" aria-label={`Consulter ${nameOf(candidate)}`} aria-expanded={inspectedId === candidate.yeastId} aria-controls={`${uid}-${candidate.yeastId}`}
            onClick={() => setInspectedId(value => value === candidate.yeastId ? '' : candidate.yeastId)}>Fiche <ChevronDown size={14} aria-hidden="true" /></button>
        </div>
        <div id={`${uid}-${candidate.yeastId}`} hidden={inspectedId !== candidate.yeastId} className="yc-consult">{inspectedId === candidate.yeastId && <>
          <SourceAndConditions candidate={candidate} form={formOf(candidate)} onFormChange={setForm(candidate)} allowFormChange={selectionContext === 'recipe'} reading={readingOf(candidate)} />
          {!current && sheetButton(candidate, 'list', 'Compléter ou corriger la fiche')}
          {current && onEditReference && <button type="button" className="yc-sheet-action" onClick={onEditReference}><Pencil size={12} aria-hidden="true" />Corriger la fiche du {referenceWord}</button>}
        </>}</div>
        {!current && sheetRegion(candidate, 'list')}
      </li>;
    })}</ul>
    {afterList}
    {/* Without a draft strain, no instruction line: the « Comparer » boxes stay available, silent until used. */}
    {((comparable && !!reference) || alternatives.length > 0) && <div className="yc-compare-tray" data-count={alternatives.length} role="group" aria-label="Levures à comparer">
      {compareRequestNotice && <p role="status" className="yeast-notice" data-compare-request-error>{compareRequestNotice}</p>}
      {alternatives.length ? <>
        {/* Once the side by side is open, its column heads name and remove the alternatives. */}
        {!compareOpen && <ul className="yc-compare-chips" aria-label="Alternatives choisies">{alternatives.map(candidate => <li key={candidate.yeastId}>
          <span>{candidate.label}</span>
          <button type="button" aria-label={`Retirer ${nameOf(candidate)} de la comparaison`} onClick={() => remove(candidate.yeastId)}><X size={14} aria-hidden="true" /></button>
        </li>)}</ul>}
        <div className="yc-compare-tray-actions">
          <button type="button" className="yc-compare-open" aria-expanded={compareOpen} aria-controls={`${uid}-comparison`}
            onClick={() => compareOpen ? setCompareOpen(false) : openComparison()}>
            {compareOpen ? 'Masquer le côte à côte' : `Comparer côte à côte · ${alternatives.length} alternative${alternatives.length > 1 ? 's' : ''}`}
          </button>
          <button type="button" className="yeast-link" onClick={() => setIds([])}>Vider</button>
        </div>
        {alternatives.length >= MAX_COMPARED_ALTERNATIVES && <p className="yeast-small">{MAX_COMPARED_ALTERNATIVES} alternatives au plus : retire-en une pour en ajouter une autre.</p>}
      </> : <p className="yeast-small">Pour comparer, coche « Comparer » sur une ou plusieurs levures ; elles s’afficheront à côté de {reference!.label}.</p>}
    </div>}
    {compareOpen && alternatives.length > 0 && <section id={`${uid}-comparison`} className="yc-comparison" aria-label="Comparaison des levures">
      <div className="yc-compare-head">
        <h3 ref={comparisonHeading} tabIndex={-1}>Côte à côte · {alternatives.length} alternative{alternatives.length > 1 ? 's' : ''}</h3>
        {alternatives.length > 1 && overflow && <div className="yc-compare-nav">
          <button type="button" aria-label="Alternative précédente" disabled={position === 0} onClick={() => showAlternative(position - 1)}><ChevronLeft size={16} aria-hidden="true" /></button>
          <span className="yeast-small">Alternative {position + 1}/{alternatives.length}</span>
          <button type="button" aria-label="Alternative suivante" disabled={position >= alternatives.length - 1} onClick={() => showAlternative(position + 1)}><ChevronRight size={16} aria-hidden="true" /></button>
        </div>}
      </div>
      {/* One legend line; the pinned column head already says which strain is the reference. */}
      <p className="yeast-small" data-compare-legend>{reference ? 'Pointillé = référence' : 'Aucune levure dans le brouillon : alternatives comparées entre elles'} · valeurs de fiche typées, pas une prévision de la recette{alternatives.length > 1 && overflow ? ' · glisse pour les autres colonnes' : ''}.</p>
      <div ref={scroller} className="yc-compare-scroll" tabIndex={0} role="region" aria-label="Colonnes comparées" onScroll={followScroll}>
        <table className="yc-compare-table" data-reference={!!reference} aria-label="Critères comparés pour chaque levure">
          <caption className="sr-only">{reference ? `Première colonne : ${reference.label}, levure du ${referenceWord} et référence. ` : ''}Colonnes suivantes : alternatives choisies.</caption>
          <thead><tr>
            {reference && <th scope="col" id={`${uid}-column-reference`} data-role="reference" data-candidate-id={baseline?.yeastId}>
              <div className="yc-compare-col">
                <span className="yc-tag">Référence · {referenceWord}</span>
                <strong>{reference.label}</strong>
                {/* The form is read in its own row. An unknown recipe laboratory is not repeated when the linked catalogue line names one. */}
                {(reference.lab || !(showCatalogueReference && baseline?.lab)) && <span className="yeast-small">{reference.lab || 'laboratoire à préciser'}</span>}
                {showCatalogueReference && baseline && <span className="yc-style-note" data-reference-catalogue>Catalogue : {catalogueLine(baseline, reference)}</span>}
                {baseline && homonyms.get(baseline.yeastId) && <span className="yc-homonym">{homonyms.get(baseline.yeastId)!.text}</span>}
                {!baseline && <span className="yc-style-note">{referenceDossier ? 'Hors catalogue : valeurs de la recette, avec leur provenance.' : 'Fiche catalogue non reconnue : critères publiés inconnus.'}</span>}
                <ColumnSourceNote shared={sharedSources.get('reference')} labels={rows.filter(row => namedInHead('reference', row.key)).map(row => row.label)} />
                {onEditReference && <button type="button" className="yc-sheet-action" aria-label={`Corriger la fiche de ${reference.label}, levure du ${referenceWord}`} onClick={onEditReference}><Pencil size={12} aria-hidden="true" />Corriger</button>}
              </div>
            </th>}
            {alternatives.map((candidate, index) => <th scope="col" key={candidate.yeastId} id={`${uid}-column-${index}`} data-role="alternative" data-candidate-id={candidate.yeastId}>
              <div className="yc-compare-col">
                <span className="yc-compare-index">Alternative {index + 1}{candidate.yeastId === trialId ? ' · en essai local' : ''}</span>
                <strong>{candidate.label}</strong>
                <span className="yeast-small">{candidate.lab || 'laboratoire non précisé'}</span>
                {homonyms.get(candidate.yeastId) && <span className="yc-homonym">{homonyms.get(candidate.yeastId)!.text}</span>}
                {corrected(candidate) && <span className="yc-tag" data-sheet-corrected>Fiche corrigée localement</span>}
                <ColumnSourceNote shared={sharedSources.get(candidate.yeastId)} labels={rows.filter(row => namedInHead(candidate.yeastId, row.key)).map(row => row.label)} />
                <span className="yc-compare-col-actions">
                  {sheetButton(candidate, 'comparison', 'Corriger la fiche')}
                  <button type="button" className="yc-compare-remove" aria-label={`Retirer ${nameOf(candidate)} de la comparaison`} onClick={() => remove(candidate.yeastId)}><X size={12} aria-hidden="true" />Retirer</button>
                </span>
              </div>
            </th>)}
          </tr></thead>
          {rows.map(row => <tbody key={row.key} aria-labelledby={`${uid}-criterion-${row.key}`} data-criterion={row.key}>
            <tr className="yc-criterion"><th scope="rowgroup" colSpan={alternatives.length + (reference ? 1 : 0)} id={`${uid}-criterion-${row.key}`}><span>{row.label}</span></th></tr>
            <tr>
              {reference && <td data-role="reference" data-comparison-row={row.key} headers={`${uid}-criterion-${row.key} ${uid}-column-reference`}>{row.reference}</td>}
              {alternatives.map((candidate, index) => <td key={candidate.yeastId} data-candidate-id={candidate.yeastId} data-comparison-row={row.key}
                headers={`${uid}-criterion-${row.key} ${uid}-column-${index}`}>{row.cell(candidate)}</td>)}
            </tr>
          </tbody>)}
          <tfoot><tr>
            {reference && <td data-role="reference"><span className="yc-tag">{selectedLabel}</span></td>}
            {alternatives.map(candidate => <td key={candidate.yeastId} data-candidate-id={candidate.yeastId}>
              <span className="yc-compare-decide">
                <button type="button" className="yc-choose" data-choose={candidate.yeastId} aria-label={`Choisir ${nameOf(candidate)} pour le ${referenceWord}`}
                  onClick={() => onChoose(candidate.yeastId, formOf(candidate))}>Choisir {candidate.label}</button>
                {onTry && <button type="button" className="yeast-link yc-try" data-try={candidate.yeastId} aria-label={`Essayer la conduite avec ${nameOf(candidate)}, sans changer le ${referenceWord}`}
                  onClick={() => onTry(candidate.yeastId, formOf(candidate))}>{candidate.yeastId === trialId ? 'Conduite en essai' : 'Essayer la conduite'}</button>}
              </span>
            </td>)}
          </tr></tfoot>
        </table>
      </div>
      {target && alternatives.includes(target) && sheetRegion(target, 'comparison')}
      {!(reference && stockRef) && <p className="yeast-small">Stock personnel non consulté ici : vérifie-le avant de prévoir un produit.</p>}
    </section>}
  </>;
}
