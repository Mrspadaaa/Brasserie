/**
 * Fiche d'un appareil (za3) : ce qui se calcule, sans écran. Pur et testé ; `Detail.tsx` ne fait que dessiner.
 * Aucune valeur inventée : un prix, une date ou une lecture inconnus restent `null` et se disent (« prix inconnu »), jamais 0.
 */
import type { EquipmentEvent, EquipmentItem, EquipmentReading } from '../../types';
import {
  brewsUsedIn, calibrationPreset, dateCourte, daysBetween, lireDate, moisCourt, nextDueAfter, premierDuMois,
  addMonthsClamped, PX_PAR_JOUR, type EquipmentStatus,
} from '../../domain/equipment';

const SANS_ACCENT_ESPACE = / | /g;
export const MOINS = '−';

/** « 24,90 CHF » : séparateur de milliers suisse, virgule décimale. */
export const chf = (cents: number): string =>
  `${(cents / 100).toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(SANS_ACCENT_ESPACE, ' ')} CHF`;

/** Le jour de l'appareil (heure locale, pas UTC : à minuit en Suisse, UTC est encore la veille). */
export function aujourdhuiIso(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const pluriel = (n: number, mot: string): string => `${n} ${mot}${n > 1 ? 's' : ''}`;

/** Nombre de décimales d'une valeur lue : celles de la tolérance (0,05 → 2 ; 0,002 → 3 ; 0,2 → 1). */
export function decimalesDe(tolerance: number): number {
  const s = String(tolerance);
  if (s.includes('e-')) return Number(s.split('e-')[1]);
  return Math.max(1, s.split('.')[1]?.length ?? 1);
}

const decimalesDuNombre = (n: number): number => {
  const s = String(n);
  if (s.includes('e-')) return Math.min(3, Number(s.split('e-')[1]));
  return Math.min(3, s.split('.')[1]?.length ?? 0);
};

/**
 * Décimales des lectures et des écarts : le maximum de celles de la tolérance, de celles des valeurs lues (saisies ou gardées dans l'historique)
 * et du plancher de l'unité (un pH se juge au centième, quelle que soit la tolérance posée). Jamais plus de 3.
 */
export function decimalesLecture(preset: { unit?: string; tolerance: number }, valeurs: number[]): number {
  const plancher = preset.unit === 'pH' ? 2 : 0;
  return Math.min(3, Math.max(decimalesDe(preset.tolerance), plancher, ...valeurs.map(decimalesDuNombre)));
}

export const fmt = (n: number, decimales: number): string => n.toFixed(decimales).replace('.', ',');

/** « +0,01 », « −0,12 », « 0,00 ». */
export function fmtEcart(delta: number, decimales: number): string {
  const abs = fmt(Math.abs(delta), decimales);
  if (Math.abs(delta) < 1e-9) return abs;
  return `${delta > 0 ? '+' : MOINS}${abs}`;
}

/** Saisie décimale : virgule ou point, jamais `type="number"`. Vide ou illisible → null (l'inconnu n'est pas 0). */
export function lireNombre(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Ce qu'on laisse taper : chiffres et un seul séparateur décimal. */
export function filtrerSaisie(text: string): string {
  const net = text.replace(/[^\d.,]/g, '');
  const premier = net.search(/[.,]/);
  return premier < 0 ? net : net.slice(0, premier + 1) + net.slice(premier + 1).replace(/[.,]/g, '');
}

/** Libellé court d'une étape d'étalonnage : « pH 7,00 » → « pH 7 », « Eau 1,000 » → « Eau ». */
export function etapeCourte(label: string): string {
  if (/^pH/i.test(label)) return label.replace(/[.,]0+(?=\s|$)/, '');
  return label.split(/\s+/)[0];
}

export interface Etape { key: string; label: string; pointIndex: number | null }
/** rincer, un point par valeur de référence, ranger. */
export function etapesDe(points: { label: string }[]): Etape[] {
  return [
    { key: 'rincer', label: 'rincer', pointIndex: null },
    ...points.map((p, i) => ({ key: `p${i}`, label: etapeCourte(p.label), pointIndex: i })),
    { key: 'ranger', label: 'ranger', pointIndex: null },
  ];
}

export interface Titre { fort: string; doux: string }
const capitale = (s: string): string => s.charAt(0).toLocaleUpperCase('fr') + s.slice(1);

/** La ligne d'état de la fiche : « À étalonner · prévu le 11.11 » (za3). Le fort en 20 px, le doux en gris. */
export function titreEtat(status: EquipmentStatus, retiredReason?: { date: string; reason: string }): Titre {
  if (retiredReason) return { fort: capitale(retiredReason.reason), doux: `le ${dateCourte(retiredReason.date)}` };
  switch (status.kind) {
    case 'panne': return { fort: capitale(status.verb), doux: `depuis le ${dateCourte(status.since!)}` };
    case 'jamais': return { fort: 'Pas encore étalonné', doux: '' };
    case 'du': return {
      fort: `À ${status.verb}`,
      doux: status.dueDate ? `prévu le ${dateCourte(status.dueDate)}` : `après ${pluriel(status.brewsTarget ?? 0, 'brassin')}`,
    };
    case 'avenir': return {
      fort: 'À jour',
      doux: status.dueDate ? `prochain le ${dateCourte(status.dueDate)}` : `encore ${pluriel((status.brewsTarget ?? 0) - (status.brewsSince ?? 0), 'brassin')}`,
    };
    default: return { fort: 'Sans échéance', doux: '' };
  }
}

/** « Mesure · utilisé dans 7 brassins » : depuis l'achat (ou tous les brassins faits sans date) ; rien de dit s'il n'y en a aucun. */
export function sousTitre(item: EquipmentItem, batches: { brewDate?: string }[]): { categorie: string; brassins: number } {
  const brassins = brewsUsedIn({ ...item, lastDone: undefined, history: [] }, batches);
  return { categorie: item.category, brassins };
}

export interface LigneHisto { date: string; label: string; valeur: string; kind: EquipmentEvent['kind'] }

/** Lectures rangées par valeur attendue croissante (za3 : « 4,03 · 7,02 »). */
export function lecturesTexte(readings: EquipmentReading[] | undefined, decimales: number): string {
  if (!readings?.length) return '';
  return [...readings].sort((a, b) => a.expected - b.expected).map(r => fmt(r.read, decimales)).join(' · ');
}

const LIBELLE_EVT: Record<EquipmentEvent['kind'], string> = {
  etalonnage: 'Étalonné', entretien: 'Fait', panne: 'En panne', reparation: 'Réparée', sortie: 'Sorti du parc',
};

/** Historique, le plus récent d'abord. */
export function historique(item: EquipmentItem, decimales: number): LigneHisto[] {
  return (item.history ?? [])
    .map((e, i) => ({ e, i, d: lireDate(e.date) }))
    .filter((x): x is { e: EquipmentEvent; i: number; d: string } => !!x.d)
    .sort((a, b) => b.d.localeCompare(a.d) || b.i - a.i)
    .map(({ e, d }) => ({
      date: d,
      kind: e.kind,
      label: LIBELLE_EVT[e.kind],
      valeur: e.kind === 'etalonnage' ? lecturesTexte(e.readings, decimales) : e.note?.trim() ?? '',
    }));
}

export interface Prochain { date: string | null; texte: string }
/** Le prochain, « si étalonné » / « si fait » : la date calendaire, ou « après N brassins ». Rien sans rythme. */
export function prochain(item: EquipmentItem, today: string, etalonne: boolean): Prochain | null {
  const r = item.rhythm;
  if (!r || !(r.every > 0)) return null;
  const si = etalonne ? 'si étalonné' : 'si fait';
  if (r.unit === 'brassin') return { date: null, texte: `après ${pluriel(r.every, 'brassin')}, ${si}` };
  const date = nextDueAfter(item, today);
  return date ? { date, texte: `prochain, ${si}` } : null;
}

/* Rythme : les quatre pastilles de za3. « 3 mois » = trois mois ; « brassin » = tous les 5 brassins tant que rien d'autre n'est dit. */
export interface RythmeChoix { id: string; label: string; every: number; unit: 'jour' | 'semaine' | 'mois' | 'brassin' }
export const RYTHMES: RythmeChoix[] = [
  { id: 'semaine', label: 'semaine', every: 1, unit: 'semaine' },
  { id: 'mois', label: 'mois', every: 1, unit: 'mois' },
  { id: '3mois', label: '3 mois', every: 3, unit: 'mois' },
  { id: 'brassin', label: 'brassin', every: 5, unit: 'brassin' },
];
/** La pastille allumée ; null quand le rythme de l'appareil n'est aucune des quatre (« an », 2 semaines…) : rien n'est allumé. */
export function rythmeActif(item: EquipmentItem): string | null {
  const r = item.rhythm;
  if (!r) return null;
  return RYTHMES.find(c => c.unit === r.unit && (c.unit === 'brassin' ? true : c.every === r.every))?.id ?? null;
}

export const ETATS = ['Neuf', 'Bon', 'À entretenir', 'À réparer'] as const;

/* Le fil de l'appareil à 1280 : même échelle que la liste (3,5 px par jour), « aujourd'hui » à 280 px. */
export const FIL_AUJOURDHUI_Y = 280;
export const FIL_Y_MAX = 470;
const FIL_ECART_MIN = 32;
const FIL_PREVU_Y_MAX = FIL_AUJOURDHUI_Y - 28;

export interface FilPoint {
  id: string;
  y: number;
  date: string;
  texte: string;
  /** fait : plein vert ; prevu : anneau ambre ; prochain : pointillé vert */
  style: 'fait' | 'prevu' | 'prochain' | 'panne';
}
export interface FilPanneau {
  points: FilPoint[];
  reperes: { label: string; y: number }[];
  bande: { top: number; height: number };
  /** Vrai quand un point a été ramené à FIL_Y_MAX : la distance n'est plus à l'échelle, on le dit par la coupure. */
  coupure: boolean;
  aujourdhui: number;
}

const yDe = (today: string, date: string): number => FIL_AUJOURDHUI_Y + PX_PAR_JOUR * daysBetween(today, date);

export function filPanneau(item: EquipmentItem, status: EquipmentStatus, today: string, decimales: number, etalonne: boolean): FilPanneau {
  const points: FilPoint[] = [];
  // Le passé : chaque entretien ou étalonnage fait, du plus récent au plus ancien, jamais à moins de 32 px du suivant.
  let limite = status.kind === 'du' && status.dueDate ? FIL_PREVU_Y_MAX - FIL_ECART_MIN : FIL_AUJOURDHUI_Y - 28;
  historique(item, decimales).filter(h => h.kind === 'etalonnage' || h.kind === 'entretien').forEach((h, i) => {
    const y = Math.min(yDe(today, h.date), limite);
    if (y < 14) return;
    limite = y - FIL_ECART_MIN;
    points.push({ id: `h${i}`, y, date: h.date, style: 'fait', texte: `${h.label.toLocaleLowerCase('fr')}${h.valeur ? ` ${h.valeur}` : ''}` });
  });
  if (status.kind === 'du' && status.dueDate) {
    points.push({ id: 'prevu', y: Math.min(yDe(today, status.dueDate), FIL_PREVU_Y_MAX), date: status.dueDate, style: 'prevu', texte: 'prévu' });
  }
  let coupure = false;
  const suite = status.kind === 'avenir' && status.dueDate ? status.dueDate : prochain(item, today, etalonne)?.date ?? null;
  if (suite) {
    let y = yDe(today, suite);
    if (y > FIL_Y_MAX) { y = FIL_Y_MAX; coupure = true; }
    points.push({ id: 'prochain', y, date: suite, style: 'prochain', texte: status.kind === 'avenir' ? status.verb : `prochain, si ${etalonne ? 'étalonné' : 'fait'}` });
  }
  // Repères de mois : le 1er de chaque mois entre le haut visible et le point le plus loin.
  const reperes: { label: string; y: number }[] = [];
  const m = premierDuMois(today);
  for (let k = -5; k <= 6; k++) {
    const d = addMonthsClamped(m, k);
    const y = yDe(today, d);
    if (y >= 8 && y <= FIL_Y_MAX && d !== today) reperes.push({ label: moisCourt(d), y });
  }
  return { points, reperes, bande: { top: FIL_AUJOURDHUI_Y + 14, height: 91 }, coupure, aujourdhui: FIL_AUJOURDHUI_Y };
}

export { calibrationPreset };
