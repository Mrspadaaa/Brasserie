import React, { useEffect, useId, useRef, useState } from 'react';
import type { HopRange } from '../../functions/src/hopIndexSchema';
import {
  editFermentationTimelineStep, planFermentationTimeline, positionFermentationContact, positionFermentationSteps,
  type FermentationTimelineStep, type PositionedFermentationStep,
} from '../domain/fermentationTimeline';

export type FermentationChartStep = FermentationTimelineStep;
export { positionFermentationSteps } from '../domain/fermentationTimeline';
export type { PositionedFermentationStep };
/** One axis of one phase: a temperature handle never edits a duration, and the reverse. */
export type FermentationChartAxis = 'temperature' | 'duration';
/** A committed chart edit, phrased for the brewer and for an undo next to the chart. */
export interface FermentationChartEdit { index: number; label: string; source: 'pointer' | 'keyboard'; axis?: FermentationChartAxis }

const number = (n: number) => n.toLocaleString('fr-FR', { maximumSignificantDigits: 4 });
const phaseDate = (step: PositionedFermentationStep) => step.start === null
  ? 'début inconnu, fin inconnue'
  : step.end === null
    ? `début J${number(step.start)}, fin inconnue`
    : `début J${number(step.start)}, fin J${number(step.end)}`;
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const snap = (value: number, step: number) => Math.round(value / step) * step;
/** Steps of 0.5 stay exact: +step then −step gives back the stored value. */
const exact = (value: number) => Math.round(value * 1e6) / 1e6;
const sameSteps = (a: readonly FermentationChartStep[], b: readonly FermentationChartStep[]) =>
  a.length === b.length && a.every((step, index) => step.kind === b[index].kind && step.name === b[index].name && step.tempC === b[index].tempC && step.days === b[index].days && step.note === b[index].note);
/** A touch shorter than this keeps the stored value exactly. */
const DEAD_PX = 4;
/** Releasing this far outside the chart cancels the gesture. */
const CANCEL_PX = 48;
const TEMP_STEP = 0.5, DAY_STEP = 0.5, PAGE_STEPS = 4;

/** Brewer-facing reading of one change: durations stay stored, later phases only move. */
export function describeFermentationEdit(before: readonly FermentationChartStep[], after: readonly FermentationChartStep[], index: number): string {
  const was = positionFermentationSteps(before), now = positionFermentationSteps(after);
  const b = was[index], a = now[index];
  if (!a) return '';
  const days = (v?: number) => finite(v) ? `${number(v)} j` : 'durée inconnue';
  const temp = (v?: number) => finite(v) ? `${number(v)} °C` : 'température inconnue';
  const parts = [`Palier ${index + 1} · ${a.name} : ${b && b.days !== a.days ? `${days(b.days)} → ${days(a.days)}` : days(a.days)} · ${b && b.tempC !== a.tempC ? `${temp(b.tempC)} → ${temp(a.tempC)}` : temp(a.tempC)}`];
  const shift = b?.end != null && a.end != null ? a.end - b.end : 0;
  if (Math.abs(shift) > 1e-9 && index < now.length - 1) parts.push(`suivants décalés ${shift > 0 ? '+' : ''}${number(shift)} j, durées conservées`);
  const end = now.at(-1)?.end;
  parts.push(end == null ? 'fin prévue inconnue' : `fin prévue J${number(end)}`);
  return parts.join(' · ');
}

export interface FermentationChartContact {
  name: string; dayOffset?: number; contactHours?: number; temperatureC?: number;
  phase?: 'fermentation' | 'postFermentation';
}
const contactContext = (contact: FermentationChartContact) => `${contact.name} · ${Number.isFinite(contact.contactHours) ? `${number(contact.contactHours!)} h` : 'durée à préciser'} · ${Number.isFinite(contact.temperatureC) ? `${number(contact.temperatureC!)} °C` : 'température à préciser'} · ${contact.phase === 'fermentation' ? 'fermentation active déclarée' : contact.phase === 'postFermentation' ? 'après fermentation déclarée' : 'phase biologique à préciser'}`;

type ChartFrame = { axisEnd: number; min: number; max: number; left: number; right: number; top: number; bottom: number; height: number };
type ChartDrag = {
  index: number; axis: FermentationChartAxis; pointerId: number; origin: FermentationChartStep[]; preview: FermentationChartStep[];
  startX: number; startY: number; handleX: number; handleY: number; frame: ChartFrame; outside: boolean;
};

/** Small arrows drawn in the handle; no icon dependency for a control this central. */
const HandleArrows = ({ axis }: { axis: FermentationChartAxis }) => <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  {axis === 'temperature' ? <path d="M4 4.5 7 1.5l3 3M4 9.5l3 3 3-3M7 2v10" /> : <path d="M4.5 4 1.5 7l3 3M9.5 4l3 3-3 3M2 7h10" />}
</svg>;

/** A programme of setpoints, not a growth curve. An unknown duration interrupts
 * the timeline; an unknown temperature leaves a gap without hiding other steps.
 * With onStepsChange, touching a phase selects it and shows two handles:
 * ↕ on its setpoint for the temperature, ↔ under the day axis at its END for
 * its duration. Each handle edits one axis only; the rest of the chart scrolls. */
export function FermentationTemperatureChart({ steps, referenceSteps = [], bands = [], pitchTempC, compact = false, contacts = [], bandLabel = 'plage proposée, confiance faible (non statistique)', onSelectStep, selectedStepIndex, onStepsChange }: {
  steps: FermentationChartStep[]; bands?: (HopRange | undefined)[]; pitchTempC?: number; compact?: boolean;
  referenceSteps?: FermentationChartStep[];
  contacts?: FermentationChartContact[]; bandLabel?: string;
  onSelectStep?: (index: number, keyboard: boolean) => void; selectedStepIndex?: number;
  /** Present only where the brewer may edit: commits one gesture or key press at a time. */
  onStepsChange?: (next: FermentationChartStep[], edit: FermentationChartEdit) => void;
}) {
  const box = useRef<HTMLDivElement>(null), plot = useRef<SVGSVGElement>(null), [width, setWidth] = useState(400);
  const hintId = useId();
  const editable = !!onStepsChange;
  const [drag, setDragState] = useState<ChartDrag | null>(null);
  const dragRef = useRef<ChartDrag | null>(null);
  // The editable frame only grows while this chart lives: a committed value never makes the scale jump back.
  const stableScale = useRef<{ min: number; max: number; axisEnd: number } | null>(null);
  const [readout, setReadout] = useState('');
  const setDrag = (value: ChartDrag | null) => { dragRef.current = value; setDragState(value); };
  const shown = drag?.preview ?? steps;
  const timeline = planFermentationTimeline(shown);
  const segments = timeline.phases.map((step, index) => {
    const candidate = bands[index];
    const band = candidate && Number.isFinite(candidate.min) && Number.isFinite(candidate.max) && candidate.min <= candidate.max ? candidate : undefined;
    return { ...step, band };
  });
  const placed = segments.filter(step => step.start !== null && step.end !== null);
  const total = timeline.endDay;
  const known = placed.filter(step => Number.isFinite(step.tempC));
  const referenceTimeline = planFermentationTimeline(referenceSteps);
  const reference = referenceTimeline.phases.filter(step => step.start !== null && step.end !== null && Number.isFinite(step.tempC));
  const contactPositions = contacts.map((contact, index) => ({ ...contact, index, ...positionFermentationContact(contact) }));
  const placedContacts = contactPositions.filter(contact => contact.start !== null);
  const dataAxisEnd = Math.max(total ?? 0, referenceTimeline.endDay ?? 0, ...placed.map(step => step.end!),
    ...referenceTimeline.phases.filter(step => step.end !== null).map(step => step.end!),
    ...placedContacts.map(contact => contact.end ?? contact.start!));
  const drawable = editable ? segments.length > 0 : dataAxisEnd > 0 && (known.length > 0 || reference.length > 0);
  const allPunctualAtJ0 = segments.length > 0 && segments.every(step => step.start === 0 && step.end === 0 && Number.isFinite(step.tempC));
  const selectable = !!onSelectStep;
  const withoutScale = segments.filter(step => step.start === null || step.end === null || step.start === step.end);
  const unknownTemperature = segments.some(step => !Number.isFinite(step.tempC));
  const unknownDurationIndex = segments.findIndex(step => !Number.isFinite(step.days) || step.days! < 0);
  const pitchDrawn = Number.isFinite(pitchTempC);
  useEffect(() => {
    if (!box.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => { if (entry.contentRect.width > 0) setWidth(Math.max(200, entry.contentRect.width)); });
    observer.observe(box.current); return () => observer.disconnect();
  }, [drawable, editable]);

  const choose = (index: number, event: React.MouseEvent<HTMLButtonElement>) => onSelectStep?.(index, event.detail === 0);
  const selectButton = (step: PositionedFermentationStep, context = '') => <button
    key={step.index} type="button" data-phase-choice={step.index}
    aria-label={`Sélectionner le palier ${step.index + 1} : ${step.name}, ${phaseDate(step)}${context ? ` · ${context}` : ''}`}
    aria-pressed={selectedStepIndex === step.index} onClick={event => choose(step.index, event)}
    className="inline-flex min-h-touch items-center rounded-control border border-cave-700 bg-cave-900 px-2 py-1 text-left text-xs text-cave-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-area-production">
    <span className="min-w-0 break-words"><strong>Palier {step.index + 1} · {step.name}</strong><span className="block">{phaseDate(step)}</span>{context && <span className="block text-cave-400">{context}</span>}</span>
  </button>;
  const undrawnContext = (step: PositionedFermentationStep) => [
    !Number.isFinite(step.tempC) ? 'température inconnue' : '',
    !Number.isFinite(step.days) ? 'durée inconnue' : Number.isFinite(step.days) ? `${number(step.days!)} j prévus` : '',
    step.start === null ? 'jour de début inconnu' : '',
  ].filter(Boolean).join(' · ');
  const dayReadings = <ol className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-cave-200" aria-label="Jours de bascule et fin de consigne">
    <li>J0 · début prévu du programme</li>
    {timeline.transitions.map(transition => <li key={transition.phaseIndex} data-transition-reading={transition.phaseIndex}>{transition.day === null ? 'Jour inconnu' : `J${number(transition.day)}`} · {timeline.phases[transition.phaseIndex].name}{transition.kind === 'same-temperature' ? ' · même température' : transition.kind === 'unknown-temperature' ? ' · température inconnue' : ' · nouvelle consigne'}</li>)}
    <li>{total === null ? 'Fin de consigne inconnue' : `Fin de consigne J${number(total)}`}</li>
  </ol>;

  if (!drawable && allPunctualAtJ0) return <figure aria-label="Calendrier des températures de fermentation" data-total-days="0" data-axis-end-day="0" className="space-y-2">
    <figcaption className="text-sm text-cave-200">Consignes ponctuelles · J0, début prévu du programme</figcaption>
    <svg className="block w-full" height={52 + placedContacts.length * 9} viewBox={`0 0 200 ${52 + placedContacts.length * 9}`} role="img" aria-label="Palier ponctuel à J0, sans durée">
      {segments.map(step => <circle key={step.index} data-zero-step={step.index} cx="24" cy="20" r="5" fill="currentColor" className="text-ebc-straw"><title>{step.name} · 0 j à J0</title></circle>)}
      <text x="38" y="24" fill="currentColor" className="text-cave-50" fontSize="12">J0 · étape sans durée</text>
      {placedContacts.map((contact, index) => <circle key={contact.index} data-contact-start-day={contact.start} cx="24" cy={38 + index * 9} r="3" fill="currentColor" className="text-cave-200"><title>Contact à cru J0 · {contactContext(contact)}</title></circle>)}
    </svg>
    {selectable && <div role="group" aria-label="Paliers à sélectionner" className="grid gap-1">{segments.map(step => selectButton(step, '0 j · aucun jour supplémentaire'))}</div>}
    <p className="text-xs text-cave-200">Fin de consigne J0. Une étape à 0 j n’est ni absente ni accomplie.</p>
    {contacts.length > 0 && <ul className="text-xs text-cave-200" aria-label="Contacts de houblon à cru">{contactPositions.map(contact => <li key={contact.index}>{contact.start === null ? 'Contact à cru : jour inconnu' : contact.end === null ? `Contact à cru J${number(contact.start)} · fin inconnue` : `Contact à cru J${number(contact.start)} → J${number(contact.end)}`} · {contactContext(contact)}</li>)}</ul>}
  </figure>;

  if (!drawable) return <figure aria-label="Calendrier des températures de fermentation" data-total-days={total ?? 'inconnu'} data-axis-end-day={dataAxisEnd} className="space-y-2">
    <figcaption className="text-sm text-cave-400">Jours prévus lisibles ci-dessous ; températures non dessinées tant que les consignes manquent.</figcaption>
    {dayReadings}
    {selectable && segments.length > 0 && <div role="group" aria-label="Paliers à sélectionner" className="grid gap-1">{segments.map(step => selectButton(step, undrawnContext(step)))}</div>}
    {contacts.length > 0 && <ul className="text-xs text-cave-200">{contactPositions.map(contact => <li key={contact.index}>{contact.start === null ? 'Contact : jour inconnu' : `Contact à cru J${number(contact.start)}${contact.end === null ? ' · fin inconnue' : ` → J${number(contact.end)}`}`} · {contactContext(contact)}</li>)}</ul>}
  </figure>;

  const temperatures = [...known.map(step => step.tempC!), ...reference.map(step => step.tempC!), ...known.flatMap(step => step.band ? [step.band.min, step.band.max] : []), ...(pitchDrawn ? [pitchTempC!] : [])];
  let min: number, max: number, axisEnd: number;
  if (drag) ({ min, max, axisEnd } = drag.frame);
  else if (editable) {
    // 0–30 °C holds most ale, lager and cold phases; the frame grows by 5 °C only when a value reaches its edge.
    const values = temperatures.length ? temperatures : [12, 20];
    const low = Math.min(...values), high = Math.max(...values);
    const needMin = Math.min(0, Math.floor((low - 1) / 5) * 5), needMax = Math.max(30, Math.ceil((high + 1) / 5) * 5);
    const needEnd = Math.max(7, Math.ceil(dataAxisEnd + Math.max(3, dataAxisEnd * 0.25)));
    const previous = stableScale.current;
    const next = previous && Number.isFinite(needMin) && Number.isFinite(needMax) ? {
      min: Math.min(previous.min, needMin), max: Math.max(previous.max, needMax),
      // Room to lengthen the last phase; the day axis widens only once the plan reaches it.
      axisEnd: previous.axisEnd >= dataAxisEnd + 0.5 ? previous.axisEnd : Math.max(previous.axisEnd, needEnd),
    } : { min: needMin, max: needMax, axisEnd: needEnd };
    if (Number.isFinite(next.min) && Number.isFinite(next.max)) stableScale.current = next;
    ({ min, max, axisEnd } = next);
  } else { min = Math.floor(Math.min(...temperatures)) - 1; max = Math.ceil(Math.max(...temperatures)) + 1; axisEnd = dataAxisEnd; }
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0 || span > 1000) return <p role="status" className="text-sm text-cave-400">Échelle de température non lisible : vérifie les valeurs saisies. Les valeurs exactes restent dans les champs du programme.</p>;
  const mobileEditingChart = editable && width < 640;
  const left = mobileEditingChart ? 30 : 42, right = width - (mobileEditingChart ? 22 : 18);
  const top = editable ? 26 : 20, bottom = drag ? drag.frame.bottom : editable ? (mobileEditingChart ? 236 : 256) : compact ? 82 : 166;
  const axisY = bottom + (placedContacts.length ? 13 + placedContacts.length * 9 : 0);
  // The duration lane sits under the day labels, far enough from the lowest setpoint that two 44 px targets never overlap.
  const laneY = Math.max(axisY + 44, bottom + 48);
  const chartHeight = editable ? laneY + 26 : axisY + 54;
  const x = (day: number) => left + day / axisEnd * (right - left), y = (temp: number) => bottom - (temp - min) / (max - min) * (bottom - top);
  const currentTransitions = timeline.transitions.filter(transition => transition.day !== null);
  const referenceTransitions = referenceTimeline.transitions.filter(transition => transition.day !== null);
  const usedCurrent = new Set<number>();
  const shiftedReferenceTransitions = referenceTransitions.filter(transition => {
    const phase = referenceTimeline.phases[transition.phaseIndex];
    const match = currentTransitions.findIndex((candidate, index) => !usedCurrent.has(index) &&
      timeline.phases[candidate.phaseIndex].kind === phase.kind && timeline.phases[candidate.phaseIndex].name === phase.name);
    if (match >= 0) usedCurrent.add(match);
    return match < 0 || currentTransitions[match].day !== transition.day;
  });
  const referenceEnd = referenceTimeline.endDay;
  const tickOrder = 10 ** Math.floor(Math.log10(span / 5));
  const tickFraction = span / 5 / tickOrder;
  const tickSize = editable && span <= 40 ? 5 : (tickFraction <= 1 ? 1 : tickFraction <= 2 ? 2 : tickFraction <= 5 ? 5 : 10) * tickOrder;
  const firstTick = Math.ceil(min / tickSize);
  const temperatureTicks = Array.from({ length: Math.min(editable ? 9 : 7, Math.max(0, Math.floor(max / tickSize) - firstTick + 1)) }, (_, index) => (firstTick + index) * tickSize);
  const transitionDays = [...new Set(currentTransitions.map(transition => transition.day!))].filter(day => day !== 0);

  // Handles belong to the selected phase and need its drawn position: an unknown start,
  // duration or temperature leaves the exact fields as the only way to edit that value.
  const selectedPhase = editable && selectedStepIndex !== undefined ? timeline.phases[selectedStepIndex] : undefined;
  const drawnPhase = selectedPhase && selectedPhase.start !== null && selectedPhase.end !== null ? selectedPhase : undefined;
  const tempHandle = drawnPhase && finite(drawnPhase.tempC) ? {
    x: clamp((x(drawnPhase.start!) + x(drawnPhase.end!)) / 2, left, right), y: clamp(y(drawnPhase.tempC), top, bottom),
  } : undefined;
  const durationHandle = drawnPhase ? { x: clamp(x(drawnPhase.end!), left, right), y: laneY } : undefined;
  /** Setpoint value: above the ↕ handle of the selected phase (below it near the top), never under it. */
  const setpointLabelY = (index: number, tempC: number) => tempHandle && drawnPhase?.index === index
    ? (tempHandle.y - 26 >= top + 11 ? tempHandle.y - 26 : tempHandle.y + 34) : Math.max(top + 11, y(tempC) - 8);
  /** The editable chart folds its legend, so a range band names itself inside, clear of the setpoint, its label and the ↕ handle; none without room. */
  const bandLabelY = (step: (typeof known)[number]) => {
    const band = step.band, startX = x(step.start!), width = x(step.end!) - startX;
    if (!editable || !band || band.max <= band.min || width <= 90 || y(band.min) - y(band.max) < 14) return undefined;
    const labelRight = startX + 84, taken: [number, number][] = [[y(step.tempC!) - 3, y(step.tempC!) + 3]];
    if (width > 42 && labelRight >= startX + width / 2 - 20) { const at = setpointLabelY(step.index, step.tempC!); taken.push([at - 11, at + 2]); }
    if (tempHandle && drawnPhase?.index === step.index && labelRight >= tempHandle.x - 22) taken.push([tempHandle.y - 22, tempHandle.y + 22]);
    const clear = (at: number) => taken.every(([from, to]) => at + 2 < from || at - 9 > to);
    const inTop = y(band.max) + 11, inBottom = y(band.min) - 3;
    return clear(inTop) ? inTop : clear(inBottom) ? inBottom : undefined;
  };
  const frame: ChartFrame = { axisEnd, min, max, left, right, top, bottom, height: chartHeight };
  const handleFor = (axis: FermentationChartAxis) => axis === 'temperature' ? tempHandle : durationHandle;
  const cancelled = (index: number) => `Geste annulé · palier ${index + 1} inchangé.`;

  const startDrag = (axis: FermentationChartAxis) => (event: React.PointerEvent<HTMLDivElement>) => {
    const handle = handleFor(axis);
    if (!handle || !drawnPhase || !onStepsChange || event.button > 0) return;
    event.preventDefault(); event.stopPropagation();
    event.currentTarget.focus({ preventScroll: true });
    // Capture keeps the gesture on the handle when the finger leaves it; some engines lack it.
    try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch { /* Gesture still follows pointer events on the handle. */ }
    const origin = steps.map(step => ({ ...step }));
    setDrag({ index: drawnPhase.index, axis, pointerId: event.pointerId, origin, preview: origin, startX: event.clientX, startY: event.clientY,
      handleX: handle.x, handleY: handle.y, frame, outside: false });
    setReadout(describeFermentationEdit(origin, origin, drawnPhase.index));
  };
  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || event.pointerId !== d.pointerId) return;
    event.preventDefault();
    const surface = box.current?.getBoundingClientRect();
    const outside = !!surface && (event.clientX < surface.left - CANCEL_PX || event.clientX > surface.right + CANCEL_PX
      || event.clientY < surface.top - CANCEL_PX || event.clientY > surface.bottom + CANCEL_PX);
    // Relative to the handle at pointer-down: no jump when the finger is not exactly centred.
    const rect = plot.current?.getBoundingClientRect();
    const scaleX = rect && rect.width > 0 ? width / rect.width : 1, scaleY = rect && rect.height > 0 ? d.frame.height / rect.height : 1;
    const f = d.frame;
    let next = d.origin;
    if (!outside && d.axis === 'temperature') {
      const dy = event.clientY - d.startY;
      if (Math.abs(dy) >= DEAD_PX) {
        const py = clamp(d.handleY + dy * scaleY, f.top, f.bottom);
        const temp = clamp(snap(f.min + (f.bottom - py) / (f.bottom - f.top) * (f.max - f.min), TEMP_STEP), Math.max(0, f.min), Math.min(60, f.max));
        next = editFermentationTimelineStep(d.origin, d.index, { tempC: exact(temp) });
      }
    } else if (!outside) {
      const dx = event.clientX - d.startX, start = positionFermentationSteps(d.origin)[d.index]?.start;
      if (Math.abs(dx) >= DEAD_PX && start != null) {
        const px = clamp(d.handleX + dx * scaleX, f.left, f.right);
        const days = Math.max(0, snap((px - f.left) / (f.right - f.left) * f.axisEnd - start, DAY_STEP));
        next = editFermentationTimelineStep(d.origin, d.index, { days: exact(days) });
      }
    }
    setDrag({ ...d, outside, preview: next });
    setReadout(outside ? `Relâcher ici annule le geste · palier ${d.index + 1} inchangé.` : describeFermentationEdit(d.origin, next, d.index));
  };
  const endDrag = (event: React.PointerEvent<HTMLDivElement>, commit: boolean) => {
    const d = dragRef.current;
    if (!d || event.pointerId !== d.pointerId) return;
    // Ended before releasing: the capture loss that follows finds no gesture to cancel.
    setDrag(null);
    try { if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* Already released. */ }
    if (!commit || d.outside) { setReadout(cancelled(d.index)); return; }
    if (sameSteps(d.origin, d.preview)) { setReadout(''); return; }
    const label = describeFermentationEdit(d.origin, d.preview, d.index);
    setReadout(label);
    onStepsChange?.(d.preview, { index: d.index, label, source: 'pointer', axis: d.axis });
  };
  const keyStep = (axis: FermentationChartAxis, key: string) => axis === 'temperature'
    ? ({ ArrowUp: TEMP_STEP, ArrowDown: -TEMP_STEP, PageUp: TEMP_STEP * PAGE_STEPS, PageDown: -TEMP_STEP * PAGE_STEPS } as Record<string, number>)[key]
    : ({ ArrowRight: DAY_STEP, ArrowLeft: -DAY_STEP, PageUp: DAY_STEP * PAGE_STEPS, PageDown: -DAY_STEP * PAGE_STEPS } as Record<string, number>)[key];
  const nudge = (axis: FermentationChartAxis) => (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      if (event.key === 'Escape') { event.preventDefault(); const index = dragRef.current.index; setDrag(null); setReadout(cancelled(index)); }
      return;
    }
    if (!drawnPhase || !onStepsChange) return;
    const step = keyStep(axis, event.key);
    if (!step) return;
    event.preventDefault();
    const phase = steps[drawnPhase.index];
    const next = axis === 'temperature'
      ? finite(phase.tempC) ? editFermentationTimelineStep(steps, drawnPhase.index, { tempC: exact(clamp(phase.tempC + step, 0, 60)) }) : undefined
      : finite(phase.days) ? editFermentationTimelineStep(steps, drawnPhase.index, { days: exact(Math.max(0, phase.days + step)) }) : undefined;
    if (!next || sameSteps(steps, next)) return;
    const label = describeFermentationEdit(steps, next, drawnPhase.index);
    setReadout(label);
    onStepsChange(next, { index: drawnPhase.index, label, source: 'keyboard', axis });
  };
  const originPhase = drag ? positionFermentationSteps(drag.origin)[drag.index] : undefined;
  const previewPhase = drag ? positionFermentationSteps(drag.preview)[drag.index] : undefined;
  const handleName = drawnPhase ? `palier ${drawnPhase.index + 1} · ${drawnPhase.name}` : '';
  const handleHint = !editable || selectedStepIndex === undefined ? '' : !selectedPhase ? 'Touche un palier pour le régler.'
    : selectedPhase.start === null ? `Palier ${selectedPhase.index + 1} : début inconnu après une durée manquante. Règle-le dans les champs ci-dessous.`
      : selectedPhase.end === null ? `Palier ${selectedPhase.index + 1} : durée inconnue, saisis-la ci-dessous.`
        : !tempHandle ? `Palier ${selectedPhase.index + 1} : ↔ durée ; température inconnue, saisis-la ci-dessous.`
          : `Palier ${selectedPhase.index + 1} : ↕ température · ↔ fin du palier (durée). Les suivants gardent leur durée.`;
  const handleClass = 'yc-chart-handle absolute z-30 grid place-items-center border-0 bg-transparent p-0 focus-visible:outline-none';
  const dragging = (axis: FermentationChartAxis) => drag?.axis === axis ? 'true' : undefined;

  return <figure aria-label="Calendrier des températures de fermentation" className={editable ? 'yc-editable-chart space-y-2' : 'space-y-2'} data-total-days={total ?? 'inconnu'} data-axis-end-day={dataAxisEnd} data-temp-min={min} data-temp-max={max} data-editing={editable ? 'true' : undefined}>
    {editable ? <figcaption className="text-sm text-cave-200">Consignes °C · jours depuis J0{selectable ? ' · touche un palier pour le régler' : ''}</figcaption>
      : <figcaption className="text-sm text-cave-200">Consignes de température · jours écoulés depuis le début prévu J0{selectable ? ' · toucher un palier pour régler sa durée' : ''}</figcaption>}
    {handleHint && <p id={hintId} className="yc-chart-hint">{handleHint}<span className="sr-only"> Clavier : poignée ↕, flèches haut et bas 0,5 °C ; poignée ↔, flèches gauche et droite 0,5 j ; Page haut et bas, pas de 2 ; Échap annule le geste.</span></p>}
    <div ref={box} className={selectable || editable ? 'yc-chart-surface relative w-full min-w-0' : 'yc-chart-surface w-full min-w-0'}>
      <svg ref={plot} className="block w-full" height={chartHeight} viewBox={`0 0 ${width} ${chartHeight}`} role="img" aria-label="Consignes de température et contacts à cru positionnés en fonction des jours"
        data-plot-left={editable ? left : undefined} data-plot-right={editable ? right : undefined} data-plot-top={editable ? top : undefined} data-plot-bottom={editable ? bottom : undefined}
        data-scale-end-day={editable ? axisEnd : undefined} data-scale-min={editable ? min : undefined} data-scale-max={editable ? max : undefined}>
        <title>Calendrier de consignes, à ajuster à la densité et à la dégustation</title>
        {temperatureTicks.map(t => <g key={t}><line x1={left} x2={right} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-cave-700" /><text x={left - 6} y={y(t) + 4} textAnchor="end" fill="currentColor" className="text-cave-400" fontSize="12">{number(t)}</text></g>)}
        {shiftedReferenceTransitions.map((transition, index) => <g key={`reference-transition-${transition.phaseIndex}`} data-reference-transition-day={transition.day}>
          <line x1={x(transition.day!)} x2={x(transition.day!)} y1={top} y2={bottom} stroke="currentColor" strokeDasharray="2 3" className="text-cave-200" />
          {(() => { const nextDay = shiftedReferenceTransitions[index + 1]?.day ?? referenceEnd;
            return nextDay === null || x(nextDay) - x(transition.day!) > 70; })()
            && <text x={x(transition.day!)} y={top - 7} textAnchor="end" fill="currentColor" className="text-cave-200" fontSize="10">brouillon J{number(transition.day!)}</text>}
          <title>Brouillon : passage à {referenceTimeline.phases[transition.phaseIndex].name} à J{number(transition.day!)}</title>
        </g>)}
        {referenceEnd !== null && referenceEnd !== total && <g data-reference-programme-end-day={referenceEnd}>
          <line x1={x(referenceEnd)} x2={x(referenceEnd)} y1={top} y2={bottom} stroke="currentColor" strokeDasharray="2 3" className="text-cave-200" />
          <text x={Math.min(right, x(referenceEnd))} y={top - 7} textAnchor="end" fill="currentColor" className="text-cave-200" fontSize="10">brouillon fin J{number(referenceEnd)}</text>
        </g>}
        {reference.map(step => <line key={`reference-${step.index}`} data-reference-step={step.index} x1={x(step.start!)} x2={x(step.end!)} y1={y(step.tempC!)} y2={y(step.tempC!)} stroke="currentColor" strokeWidth="6" strokeDasharray="4 4" className="text-cave-200" />)}
        {selectable && placed.filter(step => step.index === selectedStepIndex).map(step => <rect key={`selected-${step.index}`} x={x(step.start!)} y={top} width={Math.max(0, x(step.end!) - x(step.start!))} height={bottom - top} fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeDasharray="3 3" className="text-area-production" />)}
        {known.map(step => <g key={step.index} data-step={step.index} data-start={step.start} data-end={step.end} data-temp={step.tempC}>
          {step.band && (step.band.max === step.band.min ? <line x1={x(step.start!)} x2={x(step.end!)} y1={y(step.band.min)} y2={y(step.band.max)} className="text-ebc-straw/40" stroke="currentColor" /> : <rect data-band="temperature" x={x(step.start!)} width={x(step.end!) - x(step.start!)} y={y(step.band.max)} height={y(step.band.min) - y(step.band.max)} fill="currentColor" className="text-ebc-straw/20" />)}
          {step.band && bandLabelY(step) !== undefined && <text data-band-label={step.index} x={x(step.start!) + 4} y={bandLabelY(step)} textAnchor="start" fill="currentColor" className="text-cave-200" fontSize="10">plage levure {number(step.band.min)}–{number(step.band.max)} °C</text>}
          {step.index > 0 && Number.isFinite(segments[step.index - 1].tempC) && <line x1={x(step.start!)} x2={x(step.start!)} y1={y(segments[step.index - 1].tempC!)} y2={y(step.tempC!)} stroke="currentColor" className="text-ebc-straw" strokeWidth="2" />}
          <line data-setpoint="true" x1={x(step.start!)} x2={x(step.end!)} y1={y(step.tempC!)} y2={y(step.tempC!)} stroke="currentColor" className="text-ebc-straw" strokeWidth="3" />
          {x(step.end!) - x(step.start!) > 42 && !(drag?.axis === 'temperature' && drag.index === step.index) && <text x={(x(step.start!) + x(step.end!)) / 2} y={setpointLabelY(step.index, step.tempC!)}
            textAnchor="middle" fill="currentColor" className="text-cave-50" fontSize="11" fontWeight="600" data-setpoint-label={step.index}>{number(step.tempC!)} °C</text>}
        </g>)}
        {currentTransitions.map(transition => <g key={`transition-${transition.phaseIndex}`} data-transition-day={transition.day} data-transition-kind={transition.kind}>
          <line x1={x(transition.day!)} x2={x(transition.day!)} y1={top} y2={bottom} stroke="currentColor" className="text-ebc-straw" strokeDasharray="3 4" />
          <circle cx={x(transition.day!)} cy={transition.toTempC === undefined ? bottom : y(transition.toTempC)} r="4" fill="currentColor" className="text-ebc-straw" />
          <title>J{number(transition.day!)} · {timeline.phases[transition.phaseIndex].name} · {transition.kind === 'temperature-change' ? 'nouvelle consigne de température' : transition.kind === 'same-temperature' ? 'même consigne de température' : 'température à préciser'}</title>
        </g>)}
        {total !== null && <g data-programme-end-day={total}>
          <line x1={x(total)} x2={x(total)} y1={top} y2={bottom} stroke="currentColor" strokeWidth="2" className="text-cave-50" />
          <rect x={x(total) - 3} y={bottom - 3} width="6" height="6" fill="currentColor" className="text-cave-50"><title>Fin de consigne J{number(total)}</title></rect>
        </g>}
        {known.filter(step => step.start === step.end).map(step => <circle key={`zero-${step.index}`} data-zero-step={step.index} cx={x(step.start!)} cy={y(step.tempC!)} r="5" fill="currentColor" className="text-ebc-straw" />)}
        {pitchDrawn && <circle data-pitch-temp={pitchTempC} cx={x(0)} cy={y(pitchTempC!)} r="4" fill="currentColor" className="text-water"><title>Température d’ensemencement · {number(pitchTempC!)} °C</title></circle>}
        {placedContacts.map((contact, index) => contact.end === null
          ? <circle key={contact.index} data-contact-start-day={contact.start} cx={x(contact.start!)} cy={bottom + 10 + index * 9} r="3" fill="currentColor" className="text-cave-200"><title>{contactContext(contact)} · fin inconnue</title></circle>
          : <rect key={contact.index} data-contact={contact.index} data-contact-start-day={contact.start} data-day={contact.start} data-hours={contact.contactHours} x={x(contact.start!)} y={bottom + 8 + index * 9} width={Math.max(2, x(contact.end) - x(contact.start!))} height="5" fill="currentColor" className="text-cave-200"><title>{contactContext(contact)} · J{number(contact.start!)} à J{number(contact.end)}</title></rect>)}
        {/* The duration handle stays tied to the phase end it moves. */}
        {durationHandle && <line data-duration-guide={drawnPhase!.index} x1={durationHandle.x} x2={durationHandle.x} y1={tempHandle ? tempHandle.y : top} y2={laneY - 11} stroke="currentColor" strokeDasharray="2 3" className="text-area-production" />}
        {editable && <line x1={left} x2={right} y1={laneY} y2={laneY} stroke="currentColor" className="text-cave-800" strokeWidth="2" strokeLinecap="round" />}
        {drag?.axis === 'duration' && originPhase?.end != null && <line data-gesture-origin-day={originPhase.end} x1={x(originPhase.end)} x2={x(originPhase.end)} y1={top} y2={laneY} stroke="currentColor" strokeDasharray="1 3" className="text-cave-400" />}
        {drag?.axis === 'duration' && durationHandle && <g data-gesture-day={previewPhase?.end ?? undefined}>
          <line x1={durationHandle.x} x2={durationHandle.x} y1={top} y2={bottom} stroke="currentColor" strokeWidth="1.5" className="text-area-production" />
          <text x={clamp(durationHandle.x, left + 36, right - 36)} y={top - 9} textAnchor="middle" fill="currentColor" className="text-area-production" fontSize="12" fontWeight="700">{drag.outside ? 'annulé' : previewPhase?.end == null ? 'fin ?' : `J${number(previewPhase.end)} · ${number(previewPhase.days!)} j`}</text>
        </g>}
        {drag?.axis === 'temperature' && originPhase && finite(originPhase.tempC) && originPhase.start !== null && originPhase.end !== null && <line data-gesture-origin-temp={originPhase.tempC} x1={x(originPhase.start)} x2={x(originPhase.end)} y1={y(originPhase.tempC)} y2={y(originPhase.tempC)} stroke="currentColor" strokeDasharray="1 3" className="text-cave-400" />}
        {drag?.axis === 'temperature' && tempHandle && <text data-gesture-temp={previewPhase?.tempC} x={clamp(tempHandle.x, left + 44, right - 44)} y={tempHandle.y - 30 < top ? tempHandle.y + 40 : tempHandle.y - 30} textAnchor="middle" fill="currentColor" className="text-area-production" fontSize="13" fontWeight="700">
          {drag.outside ? 'annulé' : `${originPhase && finite(originPhase.tempC) && originPhase.tempC !== previewPhase?.tempC ? `${number(originPhase.tempC)} → ` : ''}${finite(previewPhase?.tempC) ? number(previewPhase!.tempC!) : '?'} °C`}</text>}
        <text x={left} y={axisY + (editable ? 16 : 20)} textAnchor="start" fill="currentColor" className="text-cave-200" fontSize="12">J0</text>
        {transitionDays.map((day, index) => <text key={`transition-day-${day}`} x={x(day)} y={axisY + (editable ? 16 : 20) + index % 2 * (editable ? 12 : 14)} textAnchor="middle" fill="currentColor" className="text-ebc-straw" fontSize="12">J{number(day)}</text>)}
        {total !== null && <text x={x(total)} y={editable ? axisY + 16 + transitionDays.length % 2 * 12 : axisY + 47} textAnchor={total === axisEnd || x(total) > right - 24 ? 'end' : 'middle'} fill="currentColor" className="text-cave-50" fontSize="11">fin J{number(total)}</text>}
        <text x="3" y="12" fill="currentColor" className="text-cave-400" fontSize="12">°C</text>
      </svg>
      {selectable && placed.filter(step => step.end! > step.start!).map(step => {
        const startX = x(step.start!), endX = x(step.end!);
        return <button key={step.index} type="button" data-phase-select={step.index}
          aria-label={`Sélectionner le palier ${step.index + 1} : ${step.name}, ${phaseDate(step)}${Number.isFinite(step.tempC) ? `, ${number(step.tempC!)} °C` : ', température inconnue'}${Number.isFinite(step.days) ? `, ${number(step.days!)} j` : ', durée inconnue'}`}
          aria-pressed={selectedStepIndex === step.index} onClick={event => choose(step.index, event)}
          className="absolute z-10 rounded-sm border-0 bg-transparent p-0 focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-area-production"
          style={{ left: `${startX / width * 100}%`, top: `${top}px`, width: `${(endX - startX) / width * 100}%`, height: `${bottom - top}px` }}>
          <span className="sr-only">Palier {step.index + 1} · {step.name}</span>
        </button>;
      })}
      {selectable && known.filter(step => step.start === step.end).map(step => <button key={`zero-choice-${step.index}`} type="button" data-phase-select={step.index}
        aria-label={`Sélectionner le palier ${step.index + 1} : ${step.name}, durée nulle 0 j, début J${number(step.start!)}`}
        aria-pressed={selectedStepIndex === step.index} onClick={event => choose(step.index, event)}
        className="absolute z-20 h-6 w-6 rounded-full border border-ebc-straw bg-cave-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-area-production"
        style={{ left: `${x(step.start!) / width * 100}%`, top: `${y(step.tempC!) - 12}px`, transform: 'translateX(-50%)' }} />)}
      {tempHandle && drawnPhase && <div role="slider" tabIndex={0} data-phase-handle={drawnPhase.index} data-handle-axis="temperature" data-dragging={dragging('temperature')}
        aria-orientation="vertical" aria-valuemin={0} aria-valuemax={60} aria-valuenow={drawnPhase.tempC}
        aria-valuetext={`${number(drawnPhase.tempC!)} °C`} aria-label={`Température du ${handleName}`} aria-describedby={hintId}
        className={`${handleClass} yc-chart-handle-temp`}
        style={{ left: `${tempHandle.x / width * 100}%`, top: `${tempHandle.y}px`, width: 44, height: 44, transform: 'translate(-50%, -50%)', touchAction: 'none', cursor: drag ? 'grabbing' : 'ns-resize' }}
        onPointerDown={startDrag('temperature')} onPointerMove={moveDrag} onPointerUp={event => endDrag(event, true)} onPointerCancel={event => endDrag(event, false)}
        onLostPointerCapture={event => endDrag(event, false)} onKeyDown={nudge('temperature')}>
        <span aria-hidden="true"><HandleArrows axis="temperature" /></span>
      </div>}
      {durationHandle && drawnPhase && <div role="slider" tabIndex={0} data-phase-handle={drawnPhase.index} data-handle-axis="duration" data-dragging={dragging('duration')}
        aria-orientation="horizontal" aria-valuemin={0} aria-valuemax={Math.max(drawnPhase.days ?? 0, axisEnd - drawnPhase.start!)} aria-valuenow={drawnPhase.days}
        aria-valuetext={`${number(drawnPhase.days!)} j · fin J${number(drawnPhase.end!)}`} aria-label={`Durée du ${handleName}, poignée de fin`} aria-describedby={hintId}
        className={`${handleClass} yc-chart-handle-days`}
        style={{ left: `${durationHandle.x / width * 100}%`, top: `${durationHandle.y}px`, width: 44, height: 44, transform: 'translate(-50%, -50%)', touchAction: 'none', cursor: drag ? 'grabbing' : 'ew-resize' }}
        onPointerDown={startDrag('duration')} onPointerMove={moveDrag} onPointerUp={event => endDrag(event, true)} onPointerCancel={event => endDrag(event, false)}
        onLostPointerCapture={event => endDrag(event, false)} onKeyDown={nudge('duration')}>
        <span aria-hidden="true"><HandleArrows axis="duration" /></span>
      </div>}
    </div>
    {/* Visible during the gesture and after a cancel; a commit is read in the plan's « Dernier réglage » line. */}
    {editable && <p className={drag || readout.startsWith('Geste annulé') ? 'yc-chart-readout' : 'sr-only'} aria-live="polite" data-chart-readout data-gesture-outside={drag?.outside ? 'true' : undefined}>{readout}</p>}
    {!editable && dayReadings}
    {!editable && <p className="text-xs text-cave-400">Trait : consigne prévue, pas trajectoire mesurée{reference.length ? ' · pointillé : brouillon avant essai' : ''}{pitchDrawn ? ' · bleu : ensemencement' : ''}{bands.some(Boolean) ? ` · bande : ${bandLabel}` : ''}{placedContacts.length > 0 ? ' · barres/points : contacts à cru positionnés.' : '.'}</p>}
    {selectable && withoutScale.length > 0 && <div role="group" aria-label="Paliers sans largeur temporelle" className="flex min-w-0 flex-wrap gap-1">
      {withoutScale.map(step => selectButton(step, step.start === null || step.end === null ? 'durée inconnue · position non calculable' : 'durée nulle · sélection dans la liste'))}
    </div>}
    {contacts.length > 0 && <ul className="text-xs text-cave-200" aria-label="Contacts de houblon à cru">{contactPositions.map(contact => <li key={contact.index}><strong>{contact.start === null ? 'Contact à cru : jour inconnu' : contact.end === null ? `Contact à cru J${number(contact.start)} · fin inconnue` : `Contact à cru J${number(contact.start)} → J${number(contact.end)}`}</strong> · {contactContext(contact)}{contact.start === null ? ' · non placé sur la frise' : ''}</li>)}</ul>}
    {(unknownTemperature || unknownDurationIndex >= 0) && <p role="status" className="text-xs text-ebc-straw">Calendrier partiel : {unknownTemperature && 'les températures inconnues ne sont pas dessinées. '}{unknownDurationIndex >= 0 && (unknownDurationIndex < segments.length - 1
      ? 'Après une durée inconnue, les paliers gardent leur ordre mais leur position n’est pas calculable.'
      : 'La fin du dernier palier reste inconnue tant que sa durée manque.')}</p>}
    {editable && <details className="yc-chart-details"><summary>Jours de bascule et légende</summary>
      {dayReadings}
      <p className="text-xs text-cave-400">Trait : consigne prévue, pas trajectoire mesurée{reference.length ? ' · pointillé : brouillon avant essai' : ''}{pitchDrawn ? ' · bleu : ensemencement' : ''}{bands.some(Boolean) ? ` · bande : ${bandLabel}` : ''}{placedContacts.length > 0 ? ' · barres/points : contacts à cru positionnés' : ''} · ↕ température, ↔ fin du palier. Relâcher à plus de 48 px du graphe annule le geste. J0 est le début prévu du programme, sans date calendaire ; la fin de consigne n’atteste pas la fin biologique.</p>
    </details>}
  </figure>;
}
