/**
 * Placement des étiquettes de l'escalier (problème d'école : « automatic label placement », Imhof 1975).
 * Décision (MISSION.md « État de l'art ») : glouton par priorité, positions candidates classées par distance à l'ancre, collision rectangle
 * contre rectangle, aucune dépendance. Ce qui ne trouve pas de place reste dans `reste` (« + N »). Pur et déterministe.
 *
 * Correctif (test d'écran P5B, constat 1) : l'ancienne version ne connaissait comme obstacles que les marges du graphe ; une étiquette large
 * se posait donc sur la courbe elle-même, et celles qui ne trouvaient rien près de leur marche s'empilaient loin, en colonne, jusqu'à 250 px.
 * Trois règles de plus, toujours dans la même méthode (glouton + candidats) :
 *  1. la courbe (traits horizontaux et verticaux de l'escalier) est un obstacle, passé par l'appelant comme les autres ;
 *  2. une étiquette qui ne trouve pas de place à `distanceMax` de son ancre passe dans « + N » au lieu d'être posée loin d'elle ;
 *  3. un fil ne traverse aucune étiquette déjà posée, et une étiquette ne recouvre aucun fil déjà posé.
 */
export interface Rect { x: number; y: number; w: number; h: number }
export interface Demande { id: string; priorite: number; ancre: { x: number; y: number }; w: number; h: number; /** Départage à priorité égale (plus grand d'abord). */ poids?: number; ordre?: number }
export interface Placee { id: string; rect: Rect; ancre: { x: number; y: number } }
export interface OptionsPlacement {
  /** Distance maximale (|dx| + 1,4 |dy| entre le centre de l'étiquette et son ancre) ; au-delà : « + N ». Aucune limite par défaut. */ distanceMax?: number;
  /** Bornes du tracé (hors graduations et marges) : une étiquette qui les dépasse est calée contre elles avant d'être abandonnée. Par défaut : le cadre. */ xMin?: number; xMax?: number }

/** Largeur estimée d'un texte : corps × coefficient par caractère (sans : 0,56 ; mono : 0,6). La même mesure en test et dans l'app : déterministe. */
export const largeurTexte = (texte: string, corps: number, mono = false) => Math.ceil([...texte].length * corps * (mono ? 0.6 : 0.56));

const ECART = 2;
export const seRecouvrent = (a: Rect, b: Rect, marge = ECART) => a.x < b.x + b.w + marge && b.x < a.x + a.w + marge && a.y < b.y + b.h + marge && b.y < a.y + a.h + marge;
const dans = (r: Rect, cadre: { w: number; h: number }) => r.x >= 0 && r.y >= 0 && r.x + r.w <= cadre.w && r.y + r.h <= cadre.h;

type Pt = { x: number; y: number };
/** Point du rectangle le plus proche de l'ancre : le fil de l'étiquette s'y accroche. */
export function pointDAccroche(r: Rect, a: Pt) { return { x: Math.min(Math.max(a.x, r.x), r.x + r.w), y: Math.min(Math.max(a.y, r.y), r.y + r.h) }; }

/** Le segment p→q passe-t-il dans le rectangle (échantillonné tous les ~4 px : un fil fait quelques dizaines de pixels) ? */
function segmentDans(p: Pt, q: Pt, r: Rect, marge = 1): boolean {
  const n = Math.max(2, Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / 4));
  for (let i = 0; i <= n; i++) {
    const x = p.x + (q.x - p.x) * i / n, y = p.y + (q.y - p.y) * i / n;
    if (x > r.x - marge && x < r.x + r.w + marge && y > r.y - marge && y < r.y + r.h + marge) return true;
  }
  return false;
}

function candidats(d: Demande, cadre: { w: number; h: number }, xMin: number, xMax: number): Rect[] {
  const { ancre: a, w, h } = d, liste: Rect[] = [];
  const dx = [6, 14, 24, 40, 62, 90, 130, 180, 240], dy = [-h - 3, 3, -Math.round(h / 2), -2 * h - 8, h + 8, -3 * h - 14, 2 * h + 16, -4 * h - 20, 3 * h + 24, -5 * h - 26, 4 * h + 32];
  for (const x of dx) for (const y of dy) liste.push({ x: a.x + x, y: a.y + y, w, h });
  for (const x of dx) for (const y of dy) liste.push({ x: a.x - x - w, y: a.y + y, w, h });
  // centrée sur la marche, bien au-dessus ou au-dessous d'elle (là où ni la droite ni la gauche n'ont la place)
  for (const y of dy) for (const m of [1, 2, 3]) liste.push({ x: Math.round(a.x - w / 2), y: a.y + y * m, w, h });
  // le même, calé contre le bord du cadre quand il le dépasse (près de la fin de l'horizon, l'étiquette se pose à gauche de la marche)
  for (const r of [...liste]) { const x = Math.min(Math.max(r.x, xMin), xMax - r.w); if (x !== r.x) liste.push({ ...r, x }); }
  return liste.sort((p, q) => dist(p, a) - dist(q, a) || p.y - q.y || p.x - q.x);
}
const dist = (r: Rect, a: Pt) => Math.abs(r.x + r.w / 2 - a.x) + 1.4 * Math.abs(r.y + r.h / 2 - a.y);

export function placerEtiquettes(demandes: Demande[], cadre: { w: number; h: number }, obstacles: Rect[], options: OptionsPlacement = {}): { placees: Placee[]; reste: string[] } {
  const ordre = [...demandes].sort((a, b) => b.priorite - a.priorite || (b.poids ?? 0) - (a.poids ?? 0) || (a.ordre ?? 0) - (b.ordre ?? 0) || a.id.localeCompare(b.id));
  const occupes: Rect[] = [...obstacles], placees: Placee[] = [], reste: string[] = [], fils: Array<{ de: Pt; a: Pt }> = [];
  const max = options.distanceMax ?? Number.POSITIVE_INFINITY, xMin = options.xMin ?? 2, xMax = options.xMax ?? cadre.w - 2;
  for (const d of ordre) {
    const trouve = candidats(d, cadre, xMin, xMax).find(r => dist(r, d.ancre) <= max && dans(r, cadre) && !occupes.some(o => seRecouvrent(r, o))
      && !fils.some(f => segmentDans(f.de, f.a, r))
      && !placees.some(p => segmentDans(d.ancre, pointDAccroche(r, d.ancre), p.rect)));
    if (trouve) { occupes.push(trouve); placees.push({ id: d.id, rect: trouve, ancre: d.ancre }); fils.push({ de: d.ancre, a: pointDAccroche(trouve, d.ancre) }); } else reste.push(d.id);
  }
  const rang = new Map(demandes.map(d => [d.id, d.ordre ?? 0]));
  placees.sort((a, b) => (rang.get(a.id) ?? 0) - (rang.get(b.id) ?? 0));
  return { placees, reste };
}

/** Les traits de l'escalier comme obstacles : chaque trait horizontal ou vertical devient un rectangle mince (le tracé fait 2 à 3 px). */
export function obstaclesDeCourbe(points: Array<{ x: number; y: number }>, epaisseur = 5): Rect[] {
  const r: Rect[] = [];
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1], q = points[i];
    r.push({ x: Math.min(p.x, q.x) - epaisseur / 2, y: Math.min(p.y, q.y) - epaisseur / 2, w: Math.abs(q.x - p.x) + epaisseur, h: Math.abs(q.y - p.y) + epaisseur });
  }
  return r;
}
