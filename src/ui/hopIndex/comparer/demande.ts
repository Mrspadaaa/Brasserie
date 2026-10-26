// La demande que les écrans lisent (a2-demande-reelle, D84, D158) : jamais une demande inventée.
// Avant, Comparer, Dryhopper, Levure et la puce de Ma bière disaient « plus floral, moins résineux » sur toute recette : c'était
// la dégustation de test S1 de la maquette (18.10). Désormais, dans cet ordre :
//  1. sa visée, si elle est posée (Ma bière la pose, la porte la transmet : parcours/visee.ts) → « ta demande » ;
//  2. sinon une demande dégustée : la fixture S1 de la maquette (donnees().demande), ou, dans l'app, sa dégustation de la
//     recette lue face au style (une famille perçue au-dessus de la bande : « moins » ; une famille attendue perçue en
//     dessous : « plus ») → « ta dégustation » ;
//  3. sinon les familles attendues du style de la recette → « attendu en <code du style> » (la règle « Au style », D68),
//     sans flèche : le style n'est pas une demande du brasseur.
// Pur, sauf le crochet : ni écriture ni moteur ; les données viennent de l'adaptateur (donnees()).
import { useMemo, useSyncExternalStore } from 'react';
import { valueVerdict, type FamilyId, type Tasting } from '../../../domain/hopIndex/v4';
import type { StyleScale } from '../../../domain/hopIndex/v4';
import { COURT } from '../familyTokens';
import { donnees, lireBiere, style } from '../parcours/adaptateur';
import type { RecetteParcours } from '../parcours/types';
import { abonnerVisee, enPoints, lireVisee, type Visee } from '../parcours/visee';

/** Critère de classement (y1b, r6n2 : « Face à ta stout, par [floral ⌄] ») : la famille et le sens qu'on veut. */
export interface Critere { id: string; famille: FamilyId; sens: 1 | -1; nom: string }
/** Les critères du menu de Comparer, fixes ; ceux de la demande qui n'y sont pas s'y ajoutent (criteresDe). */
export const CRITERES: Critere[] = [
  { id: 'floral', famille: 'floral', sens: 1, nom: 'floral' },
  { id: 'agrumes', famille: 'citrus', sens: 1, nom: 'agrumes' },
  { id: 'tropicaux', famille: 'tropical', sens: 1, nom: 'tropicaux' },
  { id: 'moins-resineux', famille: 'resin', sens: -1, nom: 'moins résineux' },
];

export type OrigineDemande = 'visee' | 'degustation' | 'style';
export interface DemandeEcran {
  origine: OrigineDemande;
  /** Familles à monter (ou, pour le style, attendues), dans l'ordre du style. */
  plus: FamilyId[];
  /** Familles à descendre (« trop de … », visée plus basse ou bannie). Toujours vide pour le style. */
  moins: FamilyId[];
  /** Le mot de l'origine : « ta demande », « ta dégustation » ou « attendu en 21C ». */
  mot: string;
  /** Vrai quand ce sont des mots du brasseur (flèches et couleurs « dans son sens » permises) ; faux pour le style. */
  voulue: boolean;
  /** La demande signée en crans, pour le Défi ; vide pour le style (rien n'est visé). */
  visees: Partial<Record<FamilyId, 1 | -1>>;
}

export interface EntreeDemande {
  /** Le style de la recette (échelle des bandes et des familles attendues). */
  sc: StyleScale;
  /** Sa visée posée dans Ma bière (niveaux 0 à 3), {} si aucune. */
  visee: Visee;
  /** La valeur de ma bière sur une famille, en points 0 à 100 ; null si non située. */
  points: (f: FamilyId) => number | null;
  /** La demande dégustée de la maquette (donnees().demande) : vide dans l'app. */
  demandeDegustee: Partial<Record<FamilyId, 1 | -1>>;
  /** Sa dégustation de la recette ; null : aucune. */
  tasting: Tasting | null;
}

/** La demande lue d'une dégustation face au style : jamais une famille que le brasseur n'a pas dite. */
export function demandeDeDegustation(tasting: Tasting, sc: StyleScale): Partial<Record<FamilyId, 1 | -1>> {
  const out: Partial<Record<FamilyId, 1 | -1>> = {};
  if (!sc.documented) return out;
  for (const f of sc.order) {
    const a = tasting.axes.find((x) => x.family === f);
    if (!a?.perceivedRange) continue;
    const v = valueVerdict({ range: a.perceivedRange }, sc.families[f]).verdict;
    if (v === 'trop' || v === 'hors style') out[f] = -1;
    else if (v === 'peu' && sc.families[f].status === 'attendue') out[f] = 1;
  }
  return out;
}

/** Le sens de sa visée face à ma bière : un palier au-dessus de sa valeur « plus », en dessous « moins », 0 (bannie) « moins ».
 * Une visée au niveau de ma bière ne demande rien. Même règle que `sensDe` (parcours/visee.ts), sans la demande dégustée de la
 * maquette : ici, seule sa visée parle. */
function sensDeLaVisee(visee: Visee, points: (f: FamilyId) => number | null): Partial<Record<FamilyId, 1 | -1>> {
  const out: Partial<Record<FamilyId, 1 | -1>> = {};
  for (const [f, v] of Object.entries(visee) as [FamilyId, number][]) {
    if (v === 0) { out[f] = -1; continue; }
    const d = enPoints(v) - (points(f) ?? 0);
    if (Math.abs(d) >= 0.05) out[f] = d > 0 ? 1 : -1;
  }
  return out;
}

const pareDe = (sc: StyleScale, d: Partial<Record<FamilyId, 1 | -1>>) => {
  const plus = sc.order.filter((f) => d[f] === 1);
  const moins = sc.order.filter((f) => d[f] === -1);
  const visees: Partial<Record<FamilyId, 1 | -1>> = {};
  for (const f of plus) visees[f] = 1;
  for (const f of moins) visees[f] = -1;
  return { plus, moins, visees };
};

export function demandeDe(e: EntreeDemande): DemandeEcran {
  const deVisee = sensDeLaVisee(e.visee, e.points);
  if (Object.keys(deVisee).length) return { origine: 'visee', mot: 'ta demande', voulue: true, ...pareDe(e.sc, deVisee) };
  const deg = Object.keys(e.demandeDegustee).length ? e.demandeDegustee : e.tasting ? demandeDeDegustation(e.tasting, e.sc) : {};
  if (Object.keys(deg).length) return { origine: 'degustation', mot: 'ta dégustation', voulue: true, ...pareDe(e.sc, deg) };
  const attendues = e.sc.documented ? e.sc.order.filter((f) => e.sc.families[f].status === 'attendue') : [];
  return { origine: 'style', mot: `attendu en ${e.sc.code}`, voulue: false, plus: attendues, moins: [], visees: {} };
}

/** La demande de l'écran pour cette recette (relue quand la visée posée change). */
export function useDemande(recette: RecetteParcours): DemandeEcran {
  const visee = useSyncExternalStore(abonnerVisee, lireVisee, lireVisee);
  const d = donnees();
  return useMemo(() => {
    const sc = style(recette.styleCode);
    return demandeDe({
      sc, visee, demandeDegustee: d.demande, tasting: d.degustation?.tasting ?? null,
      points: (f) => (Object.keys(visee).length ? lireBiere(recette).profil[f].valeur?.centre ?? null : null),
    });
  }, [recette, visee, d.demande, d.degustation]);
}

/** Le critère d'une famille : celui de la liste fixe s'il y est, sinon un critère construit (« noyau », « moins épicé »). */
export const critereDe = (famille: FamilyId, sens: 1 | -1): Critere =>
  CRITERES.find((c) => c.famille === famille && c.sens === sens)
  ?? { id: sens > 0 ? famille : `moins-${famille}`, famille, sens, nom: sens > 0 ? COURT[famille].toLowerCase() : `moins ${COURT[famille].toLowerCase()}` };

/** Les critères du menu : la liste fixe, plus ceux de la demande qui n'y sont pas. */
export function criteresDe(demande: DemandeEcran): Critere[] {
  const liste = [...CRITERES];
  const ajoute = (c: Critere) => { if (!liste.some((x) => x.id === c.id)) liste.push(c); };
  demande.plus.forEach((f) => ajoute(critereDe(f, 1)));
  demande.moins.forEach((f) => ajoute(critereDe(f, -1)));
  return liste;
}

/** Le critère de départ : la première famille à monter, sinon la première à descendre ; pour un style non documenté (rien
 * d'attendu), la première famille de l'ordre du style. Il ne fait que classer : le brasseur le change d'un toucher. */
export function critereParDefaut(demande: DemandeEcran, sc: StyleScale): Critere {
  if (demande.plus[0]) return critereDe(demande.plus[0], 1);
  if (demande.moins[0]) return critereDe(demande.moins[0], -1);
  return critereDe(sc.order[0], 1);
}

/** Les familles que Dryhopper et Levure montrent d'abord (n au plus) : la demande, complétée par les attendues du style. */
export function famillesDeLaDemande(demande: DemandeEcran, sc: StyleScale, n = 3): FamilyId[] {
  const out: FamilyId[] = [];
  for (const f of [...demande.plus, ...demande.moins, ...sc.order]) if (!out.includes(f) && out.length < n) out.push(f);
  return out;
}
