// D420 point 2 (22.11) : les pastilles de filtre du Stock ne montrent que ce qui existe aujourd'hui (n > 0), dans un ordre de pertinence fixe.
// Règles pures, sans lecture de stockage. Le filtre actif reste toujours montré (pour pouvoir l'ôter), même à 0.
import type { ComptesEtats, EtatLigne } from './liste';

export type FiltreDynamique = 'brassin' | 'recents';
export type IdPuce = EtatLigne | FiltreDynamique;
export interface Puce { id: IdPuce; mot: string; n: number }

/** « Récents » : un mouvement de stock (achat, usage, comptage…) dans les 14 derniers jours. */
export const JOURS_RECENTS = 14;
/** Largeur d'une rangée : 4 pastilles à 390, 6 à partir de 768 (une seule ligne, l'étoile en plus au bout). */
export const MAX_PUCES_MOBILE = 4;
export const MAX_PUCES_LARGE = 6;

/** L'ordre de pertinence : ce qui presse d'abord (manque, épuisés, DDM), puis ce qui vient (brassin), puis ce qui se prépare. */
export const ORDRE_PUCES: ReadonlyArray<IdPuce> = ['manque', 'epuise', 'ddm', 'brassin', 'bas', 'compter', 'recents'];
export const MOT_PUCE: Record<IdPuce, string> = {
  manque: 'manque', epuise: 'épuisés', ddm: 'DDM', brassin: 'brassin', bas: 'bas', compter: 'à compter', recents: 'récents',
};

export interface MouvementDate { date?: string; createdAt?: string; timestamp?: string; stockItemRef?: string; itemRef?: string }

/** Les articles qui ont bougé depuis `jours` jours (aujourdhui : AAAA-MM-JJ). Un mouvement sans date lisible ne compte pas. */
export function refsRecents(mouvements: ReadonlyArray<MouvementDate>, aujourdhui: string, jours = JOURS_RECENTS): Set<string> {
  const t = Date.parse(`${aujourdhui}T00:00:00Z`);
  const r = new Set<string>();
  if (!Number.isFinite(t)) return r;
  const depuis = new Date(t - jours * 86_400_000).toISOString().slice(0, 10);
  for (const m of mouvements) {
    const ref = m.stockItemRef ?? m.itemRef; const j = (m.date ?? m.createdAt ?? m.timestamp ?? '').slice(0, 10);
    if (ref && /^\d{4}-\d{2}-\d{2}$/.test(j) && j >= depuis && j <= aujourdhui) r.add(ref);
  }
  return r;
}

/** Les articles qu'un brassin planifié attend (la source « brassin » de la disponibilité). */
export function refsBrassin(aCommander: Iterable<{ item: { ref: string }; sources: ReadonlyArray<{ genre: string }> }>): Set<string> {
  const r = new Set<string>();
  for (const a of aCommander) if (a.sources.some((s) => s.genre === 'brassin')) r.add(a.item.ref);
  return r;
}

export interface EnsemblesFiltres { recents: ReadonlySet<string>; brassin: ReadonlySet<string> }

/** Les pastilles à montrer : seulement n > 0 (« manque » compte ses « au moins »), dans l'ordre fixe, `max` au plus, le filtre actif toujours montré. */
export function pucesVisibles(c: ComptesEtats, e: EnsemblesFiltres, actif: string | null, max: number): Puce[] {
  const n = (id: IdPuce): number => id === 'manque' ? c.manque + c.manquePlus : id === 'brassin' ? e.brassin.size : id === 'recents' ? e.recents.size : c[id];
  const toutes = ORDRE_PUCES.map((id) => ({ id, mot: MOT_PUCE[id], n: n(id) })).filter((p) => p.n > 0 || p.id === actif);
  const gardees = toutes.slice(0, Math.max(1, max));
  const act = toutes.find((p) => p.id === actif);
  if (act && !gardees.includes(act)) gardees[gardees.length - 1] = act;
  return gardees;
}
