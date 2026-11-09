/**
 * Placement des étiquettes de l'escalier (problème d'école : « automatic label placement », Imhof 1975).
 * Décision (MISSION.md « État de l'art ») : glouton par priorité, positions candidates classées par distance à l'ancre, collision rectangle
 * contre rectangle, aucune dépendance. Ce qui ne trouve pas de place reste dans `reste` (« + N »). Pur et déterministe.
 */
export interface Rect { x: number; y: number; w: number; h: number }
export interface Demande { id: string; priorite: number; ancre: { x: number; y: number }; w: number; h: number; /** Départage à priorité égale (plus grand d'abord). */ poids?: number; ordre?: number }
export interface Placee { id: string; rect: Rect; ancre: { x: number; y: number } }

/** Largeur estimée d'un texte : corps × coefficient par caractère (sans : 0,56 ; mono : 0,6). La même mesure en test et dans l'app : déterministe. */
export const largeurTexte = (texte: string, corps: number, mono = false) => Math.ceil([...texte].length * corps * (mono ? 0.6 : 0.56));

const ECART = 2;
export const seRecouvrent = (a: Rect, b: Rect, marge = ECART) => a.x < b.x + b.w + marge && b.x < a.x + a.w + marge && a.y < b.y + b.h + marge && b.y < a.y + a.h + marge;
const dans = (r: Rect, cadre: { w: number; h: number }) => r.x >= 0 && r.y >= 0 && r.x + r.w <= cadre.w && r.y + r.h <= cadre.h;

function candidats(d: Demande, cadre: { w: number; h: number }): Rect[] {
  const { ancre: a, w, h } = d, liste: Rect[] = [];
  const dx = [6, 22, 48, 84, 130, 190, 250], dy = [-h - 4, 4, -Math.round(h / 2), -2 * h - 10, h + 12, -3 * h - 16, 2 * h + 20, 3 * h + 28, -4 * h - 22, 4 * h + 36, -5 * h - 28];
  for (const x of dx) for (const y of dy) liste.push({ x: a.x + x, y: a.y + y, w, h });
  for (const x of dx) for (const y of dy) liste.push({ x: a.x - x - w, y: a.y + y, w, h });
  // le même, calé contre le bord du cadre quand il le dépasse (près de la fin de l'horizon, l'étiquette se pose à gauche de la marche)
  for (const r of [...liste]) { const x = Math.min(Math.max(r.x, 2), cadre.w - r.w - 2); if (x !== r.x) liste.push({ ...r, x }); }
  return liste.sort((p, q) => dist(p, a) - dist(q, a) || p.y - q.y || p.x - q.x);
}
const dist = (r: Rect, a: { x: number; y: number }) => Math.abs(r.x + r.w / 2 - a.x) + 1.4 * Math.abs(r.y + r.h / 2 - a.y);

export function placerEtiquettes(demandes: Demande[], cadre: { w: number; h: number }, obstacles: Rect[]): { placees: Placee[]; reste: string[] } {
  const ordre = [...demandes].sort((a, b) => b.priorite - a.priorite || (b.poids ?? 0) - (a.poids ?? 0) || (a.ordre ?? 0) - (b.ordre ?? 0) || a.id.localeCompare(b.id));
  const occupes: Rect[] = [...obstacles], placees: Placee[] = [], reste: string[] = [];
  for (const d of ordre) {
    const trouve = candidats(d, cadre).find(r => dans(r, cadre) && !occupes.some(o => seRecouvrent(r, o)));
    if (trouve) { occupes.push(trouve); placees.push({ id: d.id, rect: trouve, ancre: d.ancre }); } else reste.push(d.id);
  }
  placees.sort((a, b) => (demandes.find(d => d.id === a.id)?.ordre ?? 0) - (demandes.find(d => d.id === b.id)?.ordre ?? 0));
  return { placees, reste };
}

/** Point du rectangle le plus proche de l'ancre : le fil de l'étiquette s'y accroche. */
export function pointDAccroche(r: Rect, a: { x: number; y: number }) { return { x: Math.min(Math.max(a.x, r.x), r.x + r.w), y: Math.min(Math.max(a.y, r.y), r.y + r.h) }; }
