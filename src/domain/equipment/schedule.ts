import type { EquipmentItem } from '../../types';
import { addDays, addMonthsClamped, dateCourte, daysBetween, lireDate, moisCourt, premierDuMois } from './dates';
import { calibrationPreset } from './calibration';

export type EquipmentStatusKind = 'panne' | 'du' | 'jamais' | 'avenir' | 'sans';
export interface EquipmentStatus {
  kind: EquipmentStatusKind;
  /** Échéance calendaire (ISO) ; absente au brassin et pour l'inconnu. */
  dueDate?: string;
  /** Début de la panne (ISO). */
  since?: string;
  brewsSince?: number;
  brewsTarget?: number;
  verb: string;
  /** La sous-ligne za3, mot pour mot : « fuit au raccord · depuis le 05.11 », « étalonner · prévu le 11.11 »… */
  line: string;
  retired?: boolean;
}
export interface EquipmentContext { today: string; batches: { brewDate?: string }[] }
export interface StatusRow { item: EquipmentItem; status: EquipmentStatus }

export const PX_PAR_JOUR = 3.5;
/** Le centre du point « aujourd'hui » : y = 3,5 × j − 14. */
export const ORIGINE_PX = -14;
export const BANDE_JOURS = 30;
/** Au-delà de 50 jours (réfractomètre à 44 j sur l'échelle, cuve à 108 j coupée : za3), la distance cesse d'être à l'échelle. */
export const COUPURE_APRES_JOURS = 50;
export const SAUT_COUPURE_PX = 39;
/** Une ligne de la liste fait 28 px : 34 px de pas laissent un blanc de 6 px entre deux appareils (P6 : « dégivrer » collait à « Réfractomètre »). */
export const ESPACEMENT_MIN_PX = 34;

const yDe = (jours: number): number => PX_PAR_JOUR * jours + ORIGINE_PX;
const minuscule = (s: string): string => s.charAt(0).toLocaleLowerCase('fr') + s.slice(1);
const plur = (n: number, mot: string): string => `${n} ${mot}${n > 1 ? 's' : ''}`;

const rythmeValide = (item: EquipmentItem): item is EquipmentItem & { rhythm: NonNullable<EquipmentItem['rhythm']> } => {
  const r = item.rhythm;
  return !!r && Number.isFinite(r.every) && r.every > 0 && ['jour', 'semaine', 'mois', 'brassin'].includes(r.unit);
};

/** Dernier entretien connu : `lastDone` ou le plus récent événement entretien / étalonnage. */
export function lastDoneOf(item: EquipmentItem): string | null {
  const dates = [lireDate(item.lastDone), ...(item.history ?? []).filter(e => e.kind === 'entretien' || e.kind === 'etalonnage').map(e => lireDate(e.date))]
    .filter((d): d is string => !!d).sort();
  return dates.length ? dates[dates.length - 1] : null;
}
const aDejaEtalonne = (item: EquipmentItem): boolean => (item.history ?? []).some(e => e.kind === 'etalonnage') || !!lireDate(item.lastDone);

/** Brassins faits depuis le dernier entretien (strictement après) ; sans entretien, depuis l'achat (jour compris) ; sans aucune date, tous. */
export function brewsUsedIn(item: EquipmentItem, batches: { brewDate?: string }[]): number {
  const faits = batches.map(b => lireDate(b.brewDate)).filter((d): d is string => !!d);
  const entretien = lastDoneOf(item);
  if (entretien) return faits.filter(d => d > entretien).length;
  const achat = lireDate(item.purchaseDate);
  return achat ? faits.filter(d => d >= achat).length : faits.length;
}

/** Prochaine échéance calendaire après `date` ; null au brassin ou sans rythme. */
export function nextDueAfter(item: EquipmentItem, date: string): string | null {
  const from = lireDate(date);
  if (!from || !rythmeValide(item)) return null;
  const { every, unit } = item.rhythm;
  if (unit === 'mois') return addMonthsClamped(from, every);
  if (unit === 'semaine') return addDays(from, 7 * every);
  if (unit === 'jour') return addDays(from, every);
  return null;
}

const verbeDe = (item: EquipmentItem): string => {
  if (item.task?.trim()) return minuscule(item.task.trim());
  if (calibrationPreset(item)) return 'étalonner';
  if (item.maintenance?.trim()) return minuscule(item.maintenance.trim());
  return 'entretenir';
};

export function equipmentStatus(item: EquipmentItem, ctx: EquipmentContext): EquipmentStatus {
  const verb = verbeDe(item);
  if (item.retired) return { kind: 'sans', verb, line: '', retired: true };
  const since = lireDate(item.brokenSince);
  if (since) {
    const cause = item.brokenNote?.trim() || 'en panne';
    return { kind: 'panne', since, verb: cause, line: `${cause} · depuis le ${dateCourte(since)}` };
  }
  // Un instrument à étalonner qu'on n'a jamais étalonné : l'inconnu se dit, il n'est pas un retard.
  if (calibrationPreset(item) && !aDejaEtalonne(item)) return { kind: 'jamais', verb: 'étalonner', line: 'pas encore étalonné' };
  if (!rythmeValide(item)) return { kind: 'sans', verb, line: item.maintenance?.trim() || 'sans échéance' };

  const depart = lastDoneOf(item) ?? lireDate(item.purchaseDate);
  if (!depart) return { kind: 'sans', verb, line: 'sans échéance' };
  const { every, unit } = item.rhythm;
  if (unit === 'brassin') {
    const used = brewsUsedIn(item, ctx.batches);
    if (used >= every) return { kind: 'du', verb, brewsSince: used, brewsTarget: every, line: `${verb} · après ${plur(every, 'brassin')}` };
    return { kind: 'avenir', verb, brewsSince: used, brewsTarget: every, line: `${verb} · dans ${plur(every - used, 'brassin')}` };
  }
  const dueDate = nextDueAfter(item, depart)!;
  if (dueDate <= ctx.today) return { kind: 'du', verb, dueDate, line: `${verb} · prévu le ${dateCourte(dueDate)}` };
  return { kind: 'avenir', verb, dueDate, line: verb };
}

/** Panne d'abord, puis dû par date, puis dû au brassin, puis jamais étalonné ; retiré et avenir exclus. */
export function aTraiter(items: EquipmentItem[], ctx: EquipmentContext): StatusRow[] {
  const rang = (s: EquipmentStatus): number => s.kind === 'panne' ? 0 : s.kind === 'du' ? (s.dueDate ? 1 : 2) : 3;
  return items.map(item => ({ item, status: equipmentStatus(item, ctx) }))
    .filter(r => ['panne', 'du', 'jamais'].includes(r.status.kind))
    .sort((a, b) => {
      const ra = rang(a.status), rb = rang(b.status);
      if (ra !== rb) return ra - rb;
      if (ra === 0) return (a.status.since ?? '').localeCompare(b.status.since ?? '');
      if (ra === 1) return (a.status.dueDate ?? '').localeCompare(b.status.dueDate ?? '');
      if (ra === 2) return ((b.status.brewsSince ?? 0) - (b.status.brewsTarget ?? 0)) - ((a.status.brewsSince ?? 0) - (a.status.brewsTarget ?? 0));
      return a.item.name.localeCompare(b.item.name, 'fr');
    });
}

export interface AvenirRow extends StatusRow {
  offsetDays: number;
  /** Position à l'échelle (3,5 px/j) ; au-delà de la coupure, la position après le saut. */
  y: number;
  /** `y` écarté de la ligne précédente d'au moins 28 px, pour que les lignes ne se chevauchent pas. */
  yLigne: number;
  apresCoupure: boolean;
  /** Au brassin et à jour : pas de date, la ligne vient après les lignes datées (« détartrer · dans 5 brassins »). */
  sansDate?: boolean;
}
export interface Repere { label: string; date: string; y: number; tick: boolean }
export interface FilDuTemps {
  haut: StatusRow[];
  aujourdhui: string;
  avenir: AvenirRow[];
  reperes: Repere[];
  bande: { days: number; y: number };
  coupure: { afterDays: number; fromY: number; toY: number } | null;
  /** Sans échéance : le reste, et ce qui se compte en brassins sans être dû. */
  sansEcheance: StatusRow[];
}

export function filDuTemps(items: EquipmentItem[], ctx: EquipmentContext): FilDuTemps {
  const haut = aTraiter(items, ctx);
  const dansHaut = new Set(haut.map(r => r.item));
  const reste = items.filter(i => !dansHaut.has(i)).map(item => ({ item, status: equipmentStatus(item, ctx) })).filter(r => !r.status.retired);
  const dates = reste.filter(r => r.status.kind === 'avenir' && r.status.dueDate)
    .sort((a, b) => a.status.dueDate!.localeCompare(b.status.dueDate!) || a.item.name.localeCompare(b.item.name, 'fr'));
  // Au brassin et à jour (c2, N3) : une ligne sans date après les lignes datées, comme « après 5 brassins » pour le dû ; hors de la grille sans échéance.
  const auBrassin = reste.filter(r => r.status.kind === 'avenir' && !r.status.dueDate && r.status.brewsTarget !== undefined)
    .sort((a, b) => ((a.status.brewsTarget ?? 0) - (a.status.brewsSince ?? 0)) - ((b.status.brewsTarget ?? 0) - (b.status.brewsSince ?? 0)) || a.item.name.localeCompare(b.item.name, 'fr'));
  const sansEcheance = reste.filter(r => !(r.status.kind === 'avenir' && (r.status.dueDate || r.status.brewsTarget !== undefined)));

  const coupeY = yDe(COUPURE_APRES_JOURS);
  let rangApres = 0;
  let precedent = -Infinity;
  const avenir: AvenirRow[] = dates.map(r => {
    const offsetDays = daysBetween(ctx.today, r.status.dueDate!);
    const apresCoupure = offsetDays > COUPURE_APRES_JOURS;
    const y = apresCoupure ? coupeY + SAUT_COUPURE_PX + ESPACEMENT_MIN_PX * rangApres++ : yDe(offsetDays);
    const yLigne = Math.max(y, precedent + ESPACEMENT_MIN_PX);
    precedent = yLigne;
    return { ...r, offsetDays, y, yLigne, apresCoupure };
  });
  for (const r of auBrassin) {
    const apresCoupure = avenir.some(a => a.apresCoupure);
    const y = precedent > -Infinity ? precedent + ESPACEMENT_MIN_PX : 30;
    precedent = y;
    avenir.push({ ...r, offsetDays: Number.NaN, y, yLigne: y, apresCoupure, sansDate: true });
  }

  const reperes: Repere[] = [];
  const vus = new Set<string>();
  // Début de chaque mois posé à sa vraie distance, tant qu'il reste dans l'échelle.
  for (let mois = premierDuMois(addMonthsClamped(ctx.today, 1)); daysBetween(ctx.today, mois) <= COUPURE_APRES_JOURS; mois = addMonthsClamped(mois, 1)) {
    reperes.push({ label: moisCourt(mois), date: mois, y: yDe(daysBetween(ctx.today, mois)), tick: true });
    vus.add(mois.slice(0, 7));
  }
  // Après la coupure : le mois seul, à la hauteur de sa première ligne, sans trait d'échelle.
  for (const r of avenir.filter(a => a.apresCoupure && !a.sansDate)) {
    const mois = r.status.dueDate!.slice(0, 7);
    if (vus.has(mois)) continue;
    vus.add(mois);
    reperes.push({ label: moisCourt(r.status.dueDate!), date: premierDuMois(r.status.dueDate!), y: r.y, tick: false });
  }
  return {
    haut,
    aujourdhui: ctx.today,
    avenir,
    reperes,
    bande: { days: BANDE_JOURS, y: yDe(BANDE_JOURS) },
    coupure: avenir.some(a => a.apresCoupure && !a.sansDate) ? { afterDays: COUPURE_APRES_JOURS, fromY: coupeY, toY: coupeY + SAUT_COUPURE_PX } : null,
    sansEcheance,
  };
}
