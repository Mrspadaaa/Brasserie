import type { EquipmentEvent, EquipmentItem, EquipmentReading } from '../../types';
import { lireDate } from './dates';
import { calibrationPreset } from './calibration';
import { equipmentStatus, type EquipmentContext } from './schedule';

/**
 * Gestes purs : chacun renvoie un nouvel appareil, l'original n'est jamais modifié (le toast « Annuler » rétablit l'ancien).
 * Aucune clé `undefined` n'est écrite : Firestore refuse `undefined`.
 */
const jour = (date: string): string => lireDate(date) ?? date;
const evenement = (e: EquipmentEvent): EquipmentEvent => {
  const out: EquipmentEvent = { date: e.date, kind: e.kind };
  if (e.readings?.length) out.readings = e.readings.map(r => ({ ...r }));
  if (e.note?.trim()) out.note = e.note.trim();
  return out;
};
const avec = (item: EquipmentItem, e: EquipmentEvent): EquipmentEvent[] => [...(item.history ?? []), evenement(e)];

/** Fait / étalonné : nouvelle date de départ, événement journalisé, « À entretenir » levé (une panne reste). */
export function recordDone(item: EquipmentItem, done: { date: string; readings?: EquipmentReading[] }): EquipmentItem {
  const date = jour(done.date);
  const etalonne = !!done.readings?.length || /talonn/i.test(item.task ?? '') || (!item.task?.trim() && !!calibrationPreset(item));
  const state = item.brokenSince ? 'À réparer' : item.state === 'À entretenir' ? 'Bon' : item.state;
  return { ...item, lastDone: date, state, history: avec(item, { date, kind: etalonne ? 'etalonnage' : 'entretien', readings: done.readings }) };
}

export function markBroken(item: EquipmentItem, broken: { date: string; note?: string }): EquipmentItem {
  const date = jour(broken.date);
  const next: EquipmentItem = { ...item, brokenSince: date, state: 'À réparer', history: avec(item, { date, kind: 'panne', note: broken.note }) };
  if (broken.note?.trim()) next.brokenNote = broken.note.trim(); else delete next.brokenNote;
  return next;
}

export function markRepaired(item: EquipmentItem, repaired: { date: string }): EquipmentItem {
  const { brokenSince: _s, brokenNote: _n, ...rest } = item;
  return { ...rest, state: 'Bon', history: avec(item, { date: jour(repaired.date), kind: 'reparation' }) };
}

/** Sortie du parc : vendu ou réformé. Hors du fil et du compte ; l'historique et les dépenses restent. */
export function retire(item: EquipmentItem, out: { date: string; reason: 'vendu' | 'réformé' }): EquipmentItem {
  const date = jour(out.date);
  return { ...item, retired: { date, reason: out.reason }, history: avec(item, { date, kind: 'sortie', note: out.reason }) };
}

/** L'état à écrire pour la compatibilité (`state`) : panne → À réparer, dû → À entretenir, sinon l'état choisi (« À … » levé → Bon). */
export function stateFor(item: EquipmentItem, ctx: EquipmentContext): string {
  const kind = equipmentStatus(item, ctx).kind;
  if (kind === 'panne') return 'À réparer';
  if (kind === 'du') return 'À entretenir';
  return item.state === 'À réparer' || item.state === 'À entretenir' ? 'Bon' : item.state;
}
