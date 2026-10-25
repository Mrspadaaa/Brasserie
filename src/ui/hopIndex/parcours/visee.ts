// La visée de l'onglet Ma bière, reprise de sa base v4.10 (biere.html : viserAbs, ligneFamille ; D108). Par famille, un
// palier sur l'échelle absolue 0 à 3 (classes V5.5 : points 0–100 ÷ 33,33) : 0 bannie (« visée absente »), 0,5 faible,
// 1,5 moyen, 2,5 marqué. Sans visée, la famille n'a pas d'entrée. « + » et « − » montent ou descendent d'un palier
// depuis la visée, ou depuis ma bière s'il n'y en a pas encore ; « × » la retire.
// Sans visée posée, la demande de sa dégustation du 18.10 vaut (« trop résineuse, je la veux plus florale ») : c'est
// elle que portent les puces « + floral · − résineux » au repos, comme dans la base. Pur : ni React ni moteur.
import type { FamilyId } from '../../../domain/hopIndex/v4';
import { DEMANDE_S1, donnees } from './donnees';

/** Palier visé par famille, sur 0 à 3 ; 0 = bannie. */
export type Visee = Partial<Record<FamilyId, number>>;

export const PALIERS = [0, 0.5, 1.5, 2.5] as const;
const CLASSES = ['faible', 'moyen', 'marqué'] as const;
/** Points 0–100 du moteur par niveau de l'échelle 0 à 3 (classes V5.5 : 0–33, 33–66, 66–100). */
export const POINTS_NIVEAU = 100 / 3;
export const enPoints = (niveau: number) => niveau * POINTS_NIVEAU;
export const enNiveau = (points: number) => points / POINTS_NIVEAU;

/** Le mot du palier, entre « − » et « + » (base : nomPalier). */
export const nomPalier = (v: number) => (v === 0 ? 'bannie' : CLASSES[PALIERS.indexOf(v as (typeof PALIERS)[number]) - 1] ?? String(v));

/** Un palier plus haut que `depuis` (niveau 0 à 3), 2,5 au plus. */
export const monter = (depuis: number) => PALIERS.find((p) => p > depuis + 1e-9) ?? 2.5;
/** Un palier plus bas que `depuis`, 0 (bannie) au moins. */
export const descendre = (depuis: number) => [...PALIERS].reverse().find((p) => p < depuis - 1e-9) ?? 0;

/** La demande de sa dégustation (18.10), en crans du style : ce que vaut une famille sans visée posée. */
export const DEMANDE_DEGUSTEE = DEMANDE_S1;
/** La demande en vigueur : S1 dans la maquette, vide dans l'app tant que le brasseur n'a pas posé de visée (t12d). */
export const demandeCourante = (): Partial<Record<FamilyId, 1 | -1>> => donnees().demande;

export type Sens = 1 | -1 | 'banni';
/** Le sens de la demande par famille : la visée posée face à ma bière (`points` : sa valeur, null si non située), ou, sans
 * visée, la demande dégustée. Une visée au niveau de ma bière ne demande rien. */
export function sensDe(visee: Visee, points: (f: FamilyId) => number | null): Partial<Record<FamilyId, Sens>> {
  const out: Partial<Record<FamilyId, Sens>> = {};
  for (const [f, s] of Object.entries(demandeCourante()) as [FamilyId, 1 | -1][]) if (visee[f] == null) out[f] = s;
  for (const [f, v] of Object.entries(visee) as [FamilyId, number][]) {
    if (v === 0) { out[f] = 'banni'; continue; }
    const d = enPoints(v) - (points(f) ?? 0);
    if (Math.abs(d) >= 0.05) out[f] = d > 0 ? 1 : -1;
  }
  return out;
}

// ---------- La visée posée dans Ma bière, transmise aux outils par la porte (t12e, #184) ----------
// Ma bière pose la visée (poserVisee) ; Suggérer et la fiche la lisent (lireVisee, abonnerVisee) sans que l'hôte du wizard la
// connaisse : même principe que la porte de l'étape (comparer/porte.ts). Vide : rien n'est visé, et les outils ne proposent
// rien d'inventé (aucune demande de la fixture S1 dans l'app). Une valeur inconnue n'est jamais 0 : « bannie » est un palier posé.
let VISEE_POSEE: Visee = {};
const ECOUTEURS = new Set<() => void>();
/** La visée en vigueur ; le même objet tant qu'elle ne change pas (lisible par useSyncExternalStore). */
export const lireVisee = (): Visee => VISEE_POSEE;
/** Pose la visée (une copie) ; null ou {} la retire. Prévient les lecteurs seulement si elle change. */
export function poserVisee(v: Visee | null): void {
  const suivante: Visee = {};
  for (const [f, n] of Object.entries(v ?? {}) as [FamilyId, number][]) if (Number.isFinite(n)) suivante[f] = n;
  const pareil = Object.keys(suivante).length === Object.keys(VISEE_POSEE).length
    && (Object.keys(suivante) as FamilyId[]).every((f) => VISEE_POSEE[f] === suivante[f]);
  if (pareil) return;
  VISEE_POSEE = suivante;
  ECOUTEURS.forEach((f) => f());
}
export const abonnerVisee = (f: () => void): (() => void) => { ECOUTEURS.add(f); return () => { ECOUTEURS.delete(f); }; };
