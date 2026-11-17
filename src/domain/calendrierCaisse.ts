import { NB_SEMAINES_COURBE, dateDeSemaine, dimancheDe, ecartSemaines, francs, francsSignes, jourLisible, lundiDe, numeroSemaine } from './calendrier';

/**
 * La courbe de caisse du calendrier (E02, E03, E11) : le solde de départ plus les lignes DATÉES de la prévision de Finances, cumulés par
 * semaine ISO. Aucune donnée inventée : sans solde de départ, il n'y a pas de courbe (`null`), jamais une courbe à 0.
 *
 * Deux courbes : la caisse (ce que Finances prévoit, au centime) et le libre (caisse moins ce qui est mis de côté, E03). Une mise de côté
 * n'est PAS une sortie : elle réduit le libre, jamais la caisse. La caisse baisse une seule fois, à la date du paiement (pas de double compte,
 * MISSION.md E03, P7).
 *
 * Contrôle croisé : `soldeAuJour(courbe, finDeMois)` égale `buildForecast(...).months[i].balanceCents`.
 */

/** Un mouvement daté de la caisse ; `centimes` est signé (entrée positive). `tendance` : l'hypothèse de Finances, jamais nommée ni en barre. */
export interface MouvementCaisse { id: string; jour: string; centimes: number; nom: string; tendance?: boolean; choseId?: string }

/** Une mise de côté : `centimes` (positif) se met de côté chaque semaine de `du` (lundi) à `au` et se rend au paiement, la semaine de `au`. */
export interface MiseDeCote { id: string; titre: string; du: string; au: string; centimes: number }

export interface MouvementNomme { id: string; nom: string; centimes: number; jour: string; choseId?: string; /** « Frigo −1 800 » */ libelle: string }

export interface SoldeSemaine {
  index: number;
  /** Lundi ISO. */
  lundi: string;
  numero: number;
  /** Solde de caisse à la fin de la semaine. */
  caisse: number;
  /** Caisse moins ce qui est mis de côté à la fin de la semaine. */
  libre: number;
  /** Ce qui est mis de côté à la fin de la semaine. */
  reserve: number;
  /** Somme de tous les mouvements de la semaine (tendance comprise). */
  variation: number;
  /** Mouvements nommés, du plus gros au plus petit, sans la tendance. */
  mouvements: MouvementNomme[];
  /** La tendance de Finances de cette semaine, à part : une hypothèse, pas un événement. */
  tendance: number;
}

export interface CourbeCaisse {
  /** Solde de départ de Finances (`openingCashCents`). */
  depart: number;
  /** Le départ plus tout ce qui est daté avant la première semaine. */
  base: number;
  lundi0: string;
  semaines: SoldeSemaine[];
  mouvements: MouvementCaisse[];
  mises: MiseDeCote[];
}

export interface Creux { index: number; lundi: string; numero: number; centimes: number }

export const libelleMouvement = (nom: string, centimes: number): string => `${nom} ${francs(centimes) === '0' ? '' : centimes < 0 ? francs(centimes) : `+${francs(centimes)}`}`.trim();

export interface EntreeCourbe { depart: number | null | undefined; lundi0: string; nbSemaines?: number; mouvements: readonly MouvementCaisse[]; mises?: readonly MiseDeCote[] }

/** La courbe de 52 semaines ; `null` quand le solde de départ est inconnu (E02 : « Solde de départ inconnu »). */
export function courbeCaisse(entree: EntreeCourbe): CourbeCaisse | null {
  if (typeof entree.depart !== 'number' || !Number.isFinite(entree.depart)) return null;
  const lundi0 = lundiDe(entree.lundi0), n = Math.max(1, entree.nbSemaines ?? NB_SEMAINES_COURBE);
  const mises = [...(entree.mises ?? [])].filter(m => m.centimes > 0 && m.au >= m.du);
  const parSemaine: MouvementCaisse[][] = Array.from({ length: n }, () => []);
  let base = entree.depart;
  for (const m of entree.mouvements) {
    if (!Number.isFinite(m.centimes)) continue;
    const i = m.jour < lundi0 ? -1 : ecartSemaines(lundi0, m.jour);
    if (i < 0) base += m.centimes; else if (i < n) parSemaine[i].push(m);
  }
  const reserveA = (w: number) => mises.reduce((somme, mise) => {
    const wDu = ecartSemaines(lundi0, mise.du), wPaiement = ecartSemaines(lundi0, mise.au), fenetre = wPaiement - wDu + 1;
    if (fenetre <= 1 || w < wDu || w >= wPaiement) return somme;
    return somme + Math.round((mise.centimes * (w - wDu + 1)) / fenetre);
  }, 0);
  let caisse = base;
  const semaines = parSemaine.map<SoldeSemaine>((lignes, index) => {
    const lundi = new Date(Date.parse(`${lundi0}T00:00:00Z`) + index * 7 * 86400000).toISOString().slice(0, 10);
    const variation = lignes.reduce((s, m) => s + m.centimes, 0);
    caisse += variation;
    const reserve = reserveA(index);
    const nommes = lignes.filter(m => !m.tendance).map<MouvementNomme>(m => ({ id: m.id, nom: m.nom, centimes: m.centimes, jour: m.jour, ...(m.choseId ? { choseId: m.choseId } : {}), libelle: libelleMouvement(m.nom, m.centimes) }))
      .sort((a, b) => Math.abs(b.centimes) - Math.abs(a.centimes) || a.id.localeCompare(b.id));
    return { index, lundi, numero: numeroSemaine(lundi), caisse, libre: caisse - reserve, reserve, variation, mouvements: nommes, tendance: lignes.filter(m => m.tendance).reduce((s, m) => s + m.centimes, 0) };
  });
  return { depart: entree.depart, base, lundi0, semaines, mouvements: [...entree.mouvements], mises };
}

/** Le solde de caisse à la fin d'un jour (tendance comprise) ; `null` hors des semaines de la courbe. */
export function soldeAuJour(courbe: CourbeCaisse, jour: string): number | null {
  if (jour < courbe.lundi0) return null;
  const i = ecartSemaines(courbe.lundi0, jour);
  if (i >= courbe.semaines.length) return null;
  const avant = i === 0 ? courbe.base : courbe.semaines[i - 1].caisse;
  return avant + courbe.mouvements.filter(m => m.jour >= courbe.semaines[i].lundi && m.jour <= jour && m.jour >= courbe.lundi0).reduce((s, m) => s + m.centimes, 0);
}

/** Le solde de caisse à la fin du mois `AAAA-MM` (le contrôle croisé avec `months[i].balanceCents`). */
export function soldeFinDeMois(courbe: CourbeCaisse, mois: string): number | null {
  const dernier = new Date(Date.UTC(Number(mois.slice(0, 4)), Number(mois.slice(5, 7)), 0)).toISOString().slice(0, 10);
  return soldeAuJour(courbe, dernier);
}

/** Pour chaque position, le plus petit des valeurs de cette position à la fin (minimum suffixe). */
export function minimumSuffixe(valeurs: readonly number[]): number[] {
  const sortie = new Array<number>(valeurs.length);
  let min = Infinity;
  for (let i = valeurs.length - 1; i >= 0; i--) { min = Math.min(min, valeurs[i]); sortie[i] = min; }
  return sortie;
}

/**
 * « À dépenser sans passer sous 0 » (E01) : le minimum de la courbe libre de la semaine `depuis` à la fin, avec sa semaine. Dépenser plus
 * ferait passer la courbe sous 0 à cette semaine. Au creux égal, la plus proche. Négatif : on passe déjà sous 0.
 */
export function creuxDepuis(courbe: CourbeCaisse, depuis = 0): Creux | null {
  let creux: Creux | null = null;
  for (const s of courbe.semaines.slice(Math.max(0, depuis))) {
    if (!creux || s.libre < creux.centimes) creux = { index: s.index, lundi: s.lundi, numero: s.numero, centimes: s.libre };
  }
  return creux;
}

export type LigneLecture = { genre: 'mouvement'; texte: string; centimes: number } | { genre: 'autres'; texte: string } | { genre: 'semaine'; texte: string; centimes: number };
export interface LectureSemaine {
  index: number; lundi: string; dimanche: string; numero: number;
  /** « S12, 16 – 22 mars » */
  date: string;
  caisse: number; libre: number; variation: number;
  /** La tête (E11) : « 3 801 CHF · S12 · 16 mars −487 ». */
  tete: string;
  /** Au plus trois lignes : les plus gros mouvements, « +n autres », « la semaine −487 ». */
  lignes: LigneLecture[];
}

/** E11 : ce que lit le doigt sur la semaine `i`. */
export function lectureSemaine(courbe: CourbeCaisse, index: number): LectureSemaine | null {
  const s = courbe.semaines[index];
  if (!s) return null;
  const mouvements = s.mouvements;
  const lignes: LigneLecture[] = [];
  const montrees = mouvements.length <= 2 ? mouvements : mouvements.slice(0, 1);
  for (const m of montrees) lignes.push({ genre: 'mouvement', texte: m.libelle, centimes: m.centimes });
  if (mouvements.length > montrees.length) lignes.push({ genre: 'autres', texte: `+${mouvements.length - montrees.length} autres` });
  lignes.push({ genre: 'semaine', texte: `la semaine ${francsSignes(s.variation)}`, centimes: s.variation });
  return {
    index, lundi: s.lundi, dimanche: dimancheDe(s.lundi), numero: s.numero, date: dateDeSemaine(s.lundi), caisse: s.caisse, libre: s.libre, variation: s.variation,
    tete: `${francs(s.libre)} CHF · S${s.numero} · ${jourLisible(s.lundi)} ${francsSignes(s.variation)}`, lignes
  };
}

const rebatir = (c: CourbeCaisse, mouvements: readonly MouvementCaisse[], mises: readonly MiseDeCote[]) =>
  courbeCaisse({ depart: c.depart, lundi0: c.lundi0, nbSemaines: c.semaines.length, mouvements, mises })!;
const decaler = (jour: string, jours: number) => new Date(Date.parse(`${jour}T00:00:00Z`) + jours * 86400000).toISOString().slice(0, 10);

/** La courbe si la chose `choseId` bougeait de `jours` jours : ses mouvements et sa mise de côté la suivent (aperçu de f1-a, effet du geste). */
export function courbeDecalee(courbe: CourbeCaisse, choseId: string, jours: number): CourbeCaisse {
  return rebatir(courbe,
    courbe.mouvements.map(m => (m.choseId === choseId ? { ...m, jour: decaler(m.jour, jours) } : m)),
    courbe.mises.map(m => (m.id === choseId ? { ...m, du: decaler(m.du, jours), au: decaler(m.au, jours) } : m)));
}
/** La courbe si la chose `choseId` n'y était plus (Retirer, plan annulé). */
export function courbeSans(courbe: CourbeCaisse, choseId: string): CourbeCaisse {
  return rebatir(courbe, courbe.mouvements.filter(m => m.choseId !== choseId), courbe.mises.filter(m => m.id !== choseId));
}
/** La courbe avec des mouvements et des mises en plus (Dupliquer, accepter une vente probable). */
export function courbeAvec(courbe: CourbeCaisse, mouvements: readonly MouvementCaisse[], mises: readonly MiseDeCote[] = []): CourbeCaisse {
  return rebatir(courbe, [...courbe.mouvements, ...mouvements], [...courbe.mises, ...mises]);
}
/** La courbe avec la mise de côté de `choseId` posée ou retirée ; le paiement ne bouge pas (E03, A10). */
export function courbeAvecMise(courbe: CourbeCaisse, mise: MiseDeCote | null, choseId: string): CourbeCaisse {
  return rebatir(courbe, courbe.mouvements, [...courbe.mises.filter(m => m.id !== choseId), ...(mise ? [mise] : [])]);
}

export interface EffetCaisse {
  index: number; lundi: string; numero: number;
  avant: number; apres: number;
  /** « S51 : 5 064 → 4 524 » : la semaine n'est dite qu'une fois. */
  texte: string;
}

/**
 * L'effet d'un geste sur la courbe libre (celle que la tête montre) : la première semaine qui change, en francs entiers. `null` quand rien ne
 * change à la semaine près (les écarts de moins d'un franc ne se disent pas) ou quand la courbe est inconnue.
 */
export function effetCaisse(avant: CourbeCaisse | null, apres: CourbeCaisse | null): EffetCaisse | null {
  if (!avant || !apres) return null;
  const n = Math.min(avant.semaines.length, apres.semaines.length);
  for (let i = 0; i < n; i++) {
    const a = avant.semaines[i], b = apres.semaines[i];
    if (Math.round(a.libre / 100) !== Math.round(b.libre / 100)) {
      return { index: i, lundi: a.lundi, numero: a.numero, avant: a.libre, apres: b.libre, texte: `S${a.numero} : ${francs(a.libre)} → ${francs(b.libre)}` };
    }
  }
  return null;
}
