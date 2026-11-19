import React from 'react';
import { ChevronRight, Eye, EyeOff, Plus, ShoppingCart } from 'lucide-react';
import { ajouterJours, barreLiee, ecartJours, estMarque, estPonctuel, etiquetteS, francsSignes, jourLisible, nomRangee, type ChoseCalendrier, type JalonBrassin, type Rangee as IdRangee } from '../../../domain/calendrier';
import { Barre, dureeDansBarre, formesDuree, largeurDuree, montantBarre, type BarreProps, type CoteEtiquette } from './Barre';
import { CLASSE_TEINTE, Marque, couperNom, dureeVue, largeurPastilleLie, largeurTexte, lieMontre, type ModeDeuxLignes } from './Marque';
import { appuiCommenceSur } from './usePointeur';
import { aDesJours } from '../echelle';

/**
 * Une rangée de la frise (E20 à E23) : son titre à gauche, juste au-dessus de ses barres, le carré de couleur qui porte le + blanc (E21),
 * la pastille r2-c (E23), l'œil qui masque (E22). Sa mise en page est une fonction pure (`disposer`) : une chose se pose sur la première
 * ligne où ni elle ni son nom ne en touchent une autre (E26 : deux ventes de la même semaine ne se chevauchent pas).
 *
 * Le nom (CRITIQUE-3 n° 31, CRITIQUE-5 n° 14) : entier dans la barre s'il y tient, sinon entier du côté libre (E24), sur une ligne déjà ouverte ;
 * puis, hors paysage, sur deux lignes (nom et montant, puis la pastille « lié à ») ; sinon sur une ligne libre de la rangée. Il n'est raccourci
 * (jamais sous son montant et dix lettres) que si la piste est plus étroite que lui. Rien ne se pose sous le + volant (`reserveDroite`).
 * Le caddie des courses (jalon « commander ») et le renvoi « Livraison La Cigogne · S2 › » se posent comme les autres choses, sans
 * chevauchement (n° 21, n° 22) ; le renvoi en bout de rangée, jamais sur la ligne du titre.
 * En 3 mois, 6 mois et An (`vueLarge`), une chose de moins de 24 px devient une marque (E27) ; en 6 semaines, un brassin est toujours une
 * barre, avec son nom et sa durée (n° 19).
 */

/** Une colonne de la frise : une semaine, ou un mois dans la vue An. */
export interface Colonne { debut: string; fin: string; etiquette: string }

/** Où une chose tombe dans les colonnes affichées ; `null` si elle est entièrement dehors ou sans date. */
export function positionDans(colonnes: readonly Colonne[], chose: { debut: string; fin: string }): { a: number; b: number; coupeAGauche: boolean; coupeADroite: boolean } | null {
  if (!colonnes.length || !chose.debut) return null;
  const fin = chose.fin || chose.debut;
  let a = -1, b = -1;
  colonnes.forEach((c, i) => { if (fin >= c.debut && chose.debut <= c.fin) { if (a < 0) a = i; b = i; } });
  if (a < 0) return null;
  return { a, b, coupeAGauche: chose.debut < colonnes[0].debut, coupeADroite: fin > colonnes[colonnes.length - 1].fin };
}

export interface Mesures { ligne: number; barre: number; titre: number }
/* E43 : en portrait, 6 rangées d'un coup d'œil (une ligne de 30 px porte une barre de 26 px et un texte de 14 px) ; en paysage, 48 px au plus
   la rangée médiane (une ligne de 21 px, une barre de 19 px, un texte de 14 px sur 16). */
export const MESURES_PORTRAIT: Mesures = { ligne: 30, barre: 26, titre: 24 };
/* CRITIQUE-4 n° 11 (reçu de q1) : le paysage se compacte sur les rangées, pas sur la courbe : une ligne de 20 px, une barre de 18 px. */
export const MESURES_PAYSAGE: Mesures = { ligne: 20, barre: 18, titre: 20 };

export interface Disposition {
  chose: ChoseCalendrier;
  a: number; b: number;
  gauche: number; largeur: number;
  ligne: number;
  /** Une icône ronde : trop petite pour une barre (E27), pastille de vente (E26), brassin conditionné, courses d'un brassin. */
  marque: boolean;
  /** 3 mois, 6 mois, An : l'appui long ouvre les 6 semaines (E27, D-199). Sinon la marque se glisse et s'ouvre en menu comme une barre. */
  petite: boolean;
  /** La marque porte son nom et son montant à côté (E13, E26). */
  avecLibelle: boolean;
  /** La durée d'un brassin posée à côté de son nom, entière (« J7 / 28 · prête 7 déc. ») ou courte (« J7 / 28 ») ; `null` : dans la barre ou rien. */
  duree: string | null;
  cote: CoteEtiquette;
  place: number;
  /** Le nom passe sur deux lignes à côté de la barre (n° 31). */
  deuxLignes: DeuxLignes;
  /** CRITIQUE-6 (doute Lier) : la pastille « lié à » n'a la place d'aucun côté ; le nom et le montant restent entiers, le lien vit dans le badge. */
  sansLie?: boolean;
  /**
   * CRITIQUE-9 n° 3 (E25, E29) : la phrase « J0 / 28 · prête 21 déc. » n'a la place ni à côté ni sur la ligne du nom. `barre` : la barre prend
   * deux lignes et la porte en bas (as/cap/p-repos) ; `dessous` : elle va sur la ligne sous la barre, de `x0` à `x1`.
   */
  phraseBas?: { ou: 'barre' } | { ou: 'dessous'; x0: number; x1: number };
  /**
   * CRITIQUE-12 n° 4 (E35, D-135, E33) : une étiquette posée à gauche d'une chose qui est sous le + volant finit avant sa zone (`reserveDroite`) :
   * l'écart, en px, entre la fin de l'étiquette et sa chose (absent : collée, à 6 px).
   */
  retrait?: number;
  /** D386 : un jalon d'un jour (`estPonctuel`) : icône au centre de son jour, sur une ligne sans barre de sa rangée, glissé au jour. */
  jalon?: boolean;
  /** Tour 2 n° 3 : le brassin porte son titre seul dans sa barre (« Porter d'hiver ») ; « · coût à venir » n'y tenait pas avec lui. */
  titreSeul?: boolean;
}

/** Le caddie d'un brassin (son jalon « commander »), posé sans chevauchement, avec son nom en 6 semaines (n° 19, n° 22). */
/** `lignes` (CRITIQUE-6 n° 17) : le nom du brassin puis ce qui manque, sur deux lignes, quand une seule ligne n'a pas la place. */
export interface PlaceCaddie { chose: ChoseCalendrier; jour: string; centre: number; ligne: number; texte: string | null; cote: 'gauche' | 'droite'; place: number; lignes?: [string, string]; retrait?: number }

const CADDIE_PX = 22;
const texteVu = (c: ChoseCalendrier): string => (c.brassinLie ? c.titre : c.etiquette ?? c.titre);
/** La pastille « lié à » montrée (CRITIQUE-6 n° 15 : jamais celle qui répète le nom). */
const lieVu = (c: ChoseCalendrier) => lieMontre(c, texteVu(c));
/* CRITIQUE-4 n° 24 : chaque largeur est mesurée dans la police de la page (`largeurTexte`, Marque.tsx), avec le montant que la barre écrit
   (`montantBarre`) : un nom n'est coupé que si la place libre mesurée manque vraiment. */
const parties = (c: ChoseCalendrier, lieCourt: boolean): number => {
  const m = montantBarre(c);
  const l = lieVu(c);
  return (m ? largeurTexte(m, 700) + 6 : 0) + (l ? largeurPastilleLie(l, lieCourt) + 6 : 0);
};
const debutNom = (t: string, lettres: number): string => (t.length > lettres ? `${t.slice(0, lettres)}…` : t);

/**
 * La largeur de l'étiquette posée à côté : le nom, son montant, sa pastille « lié à », et la durée d'un brassin (`duree` : la forme montrée,
 * entière ou courte ; `null` : sans durée). Par défaut, la durée entière.
 */
export const largeurEtiquette = (c: ChoseCalendrier, avecDuree: boolean | string | null = true, lieCourt = false): number => {
  const d = typeof avecDuree === 'string' ? avecDuree : avecDuree ? dureeVue(c) : null;
  return Math.ceil(largeurTexte(texteVu(c), 600) + parties(c, lieCourt) + (d ? largeurTexte(d, 500) + 8 : 0)) + 6;
};
/** Le moins qu'une étiquette garde quand la piste entière manque : son montant entier et dix lettres de son nom, jamais « F. ». */
export const largeurEtiquetteMin = (c: ChoseCalendrier, lieCourt = false): number =>
  Math.ceil(largeurTexte(debutNom(texteVu(c), 10), 600) + parties(c, lieCourt)) + 10;
/** Deux lignes (CRITIQUE-5 n° 26) : `nom`, le nom et son montant puis la pastille « lié à » ; `nomSeul`, le nom puis le montant et la pastille. */
const largeurDeuxLignes = (c: ChoseCalendrier, lieCourt: boolean, mode: 'nom' | 'nomSeul'): number => {
  const m = montantBarre(c);
  const l = lieVu(c);
  const lm = m ? largeurTexte(m, 700) + 6 : 0, ll = l ? largeurPastilleLie(l, lieCourt) : 0, ln = largeurTexte(texteVu(c), 600);
  return Math.ceil(mode === 'nom' ? Math.max(ln + lm, ll) : Math.max(ln, lm + ll)) + 8;
};

/** Une sortie dérivée d'un brassin dont le montant n'est pas renseigné : une icône, avec son nom à côté (test en ligne 1, n° 1). */
const deriveSansMontant = (c: ChoseCalendrier): boolean => c.source.genre === 'prevision-brassin' && c.centimes === undefined;
/** Un brassin de la rangée Brassins (ni ses courses, ni un brassin conditionné, qui est un fait marqué à sa date). */
const estBrassin = (c: ChoseCalendrier): boolean => c.rangee === 'brassins' && !c.brassinLie && !c.conditionne;

/** Le nom court d'un brassin : son premier mot (« Blonde » pour « Blonde d'automne »), sinon son nom entier. */
export const nomCourtBrassin = (titre: string): string => {
  const mot = titre.trim().split(/\s+/)[0] ?? '';
  return mot.length >= 3 ? mot : titre;
};

/**
 * Le texte du caddie d'un brassin (CRITIQUE-5 n° 32) : il nomme toujours le brassin, puis ce qui manque (lot A, `articles`), sinon « courses » :
 * « Blonde d'automne · malt pilsner, saaz » ; `court` : « Blonde · malt pilsner, saaz ». Jamais les articles sans le brassin.
 */
export function texteCaddie(c: ChoseCalendrier, j: JalonBrassin, court = false): string {
  const articles = (j as JalonBrassin & { articles?: unknown }).articles;
  const liste = Array.isArray(articles) ? articles.filter((x): x is string => typeof x === 'string' && !!x.trim()) : [];
  const quoi = liste.length ? liste.map(x => x.trim().toLocaleLowerCase('fr')).join(', ') : 'courses';
  return `${court ? nomCourtBrassin(c.titre) : c.titre} · ${quoi}`;
}

/**
 * CRITIQUE-12, doute Papiers en An (E13, E27, D-198 ; sa maquette as/cap/p-c1d-apres-bas : « Loyer du local … −400 / mois », une barre) : en
 * An, douze « Loyer du local −400 » posés en marques prenaient douze lignes en escalier (220 px). Une série mensuelle d'un même plan récurrent
 * (3 occurrences au moins, même montant, de 28 à 31 jours d'écart) devient une barre, de la première à la dernière, au montant « / mois ». Elle
 * porte l'id de sa première occurrence (le toucher ouvre le plan, comme chacune). La pastille de la rangée compte toujours chaque occurrence.
 */
export function seriesEnBarres(choses: readonly ChoseCalendrier[]): ChoseCalendrier[] {
  const groupes = new Map<string, ChoseCalendrier[]>();
  for (const c of choses) {
    if (c.source.genre !== 'plan' || c.source.origine !== 'recurring' || c.centimes === undefined || !c.debut) continue;
    /* une série ne mêle pas une échéance proposée (pointillé, E47) et une échéance acceptée : chacune garde sa forme */
    const k = `${c.source.id}|${c.centimes}|${c.proposition ?? ''}|${c.probable ? 'probable' : ''}`;
    groupes.set(k, [...(groupes.get(k) ?? []), c]);
  }
  const premiers = new Map<string, ChoseCalendrier>();
  const suivants = new Set<string>();
  for (const g of groupes.values()) {
    const tri = [...g].sort((x, y) => x.debut.localeCompare(y.debut));
    const mensuelle = tri.length >= 3 && tri.every((c, i) => i === 0 || (ecartJours(tri[i - 1].debut, c.debut) >= 28 && ecartJours(tri[i - 1].debut, c.debut) <= 31));
    if (!mensuelle) continue;
    const dernier = tri[tri.length - 1];
    premiers.set(tri[0].id, { ...tri[0], fin: dernier.fin || dernier.debut, parMois: true });
    for (const c of tri.slice(1)) suivants.add(c.id);
  }
  return choses.flatMap(c => (suivants.has(c.id) ? [] : [premiers.get(c.id) ?? c]));
}

export interface OptionsDisposer {
  /** Largeur, à droite, où aucun nom ne se pose (le + volant, D-135). */
  reserveDroite?: number;
  /** Paysage : la largeur que le titre occupe sur la première ligne, à gauche. */
  zoneTitre?: number;
  /** Paysage (E10) : une ligne de 20 px ne porte pas deux lignes de texte ; sans place sur une ligne ouverte, le caddie se pose seul. */
  paysage?: boolean;
  /** 3 mois, 6 mois, An : une chose de moins de 24 px devient une marque, et son appui long ouvre les 6 semaines. */
  vueLarge?: boolean;
  /** Les largeurs des renvois posés en bout de rangée (E32). */
  renvois?: readonly number[];
  /** La pastille « lié à » en nom court (téléphone, 3 mois et plus : CRITIQUE-4 n° 15). */
  lieCourt?: boolean;
}

/**
 * Un nom sur deux lignes à côté de son objet, seulement pour une chose liée (CRITIQUE-3 n° 31, CRITIQUE-5 n° 26) : `nom`, le nom et son montant
 * insécables, puis la pastille « lié à » seule ; `nomSeul`, si nom et montant ensemble seraient coupés, le nom entier puis montant et pastille.
 * CRITIQUE-5 n° 28 : plus aucun texte en flot (« Hotte / −900 ») ; `false` : une ligne.
 */
export type DeuxLignes = ModeDeuxLignes;

/** `bas` (CRITIQUE-9 n° 3) : la phrase d'un brassin prend aussi la ligne au-dessous, sur `[x0, x1]` (la barre haute) ou sur `bas` (sous la barre). */
interface Candidat { cote: CoteEtiquette; place: number; x0: number; x1: number; deux?: DeuxLignes; sansLie?: boolean; bas?: { ou: 'barre' | 'dessous'; x0: number; x1: number }; retrait?: number; titreSeul?: boolean }

/**
 * Pose les choses d'une rangée sans qu'une barre ni un nom en touche un autre. Pure : `largeur` et `largeurColonne` viennent de la mesure.
 *
 * CRITIQUE-5 n° 14 (E24, D-10) : un nom n'est jamais coupé quand la place existe. Dans l'ordre : dans la barre avec sa durée ; entier du côté
 * libre (droite, puis gauche) sur une ligne déjà ouverte ; sans sa durée ; dans la barre sans durée ; sur deux lignes (nom et montant, puis la
 * pastille « lié à ») ; sinon sur une ligne libre de la rangée, au-dessous. Il n'est raccourci que si la piste entière, d'un côté de son objet,
 * est plus étroite que lui. N° 23 : faute de place, c'est « · prête … » qui cède, jamais les espaces de « J0 / 28 ».
 */
export function disposer(choses: readonly ChoseCalendrier[], colonnes: readonly Colonne[], largeurColonne: number, largeur: number, options: OptionsDisposer = {}): { items: Disposition[]; lignes: number; caddies: PlaceCaddie[]; renvois: Array<{ ligne: number; x: number }> } {
  const reserve = Math.max(0, options.reserveDroite ?? 0);
  const paysage = !!options.paysage, vueLarge = !!options.vueLarge;
  const lieCourt = !!options.lieCourt;
  const bord = largeur - reserve;
  const places = choses.flatMap(c => { const p = positionDans(colonnes, c); return p ? [{ c, p }] : []; })
    .map(o => ({ ...o, j: estPonctuel(o.c) }))
    /* D386 : les barres d'abord, puis les jalons, sur leurs lignes à eux (jamais sur une ligne qui porte une barre) */
    .sort((x, y) => Number(x.j) - Number(y.j) || x.p.a - y.p.a || (y.p.b - y.p.a) - (x.p.b - x.p.a) || x.c.id.localeCompare(y.c.id));
  const lignesJalon = new Set<number>(), lignesAutres = new Set<number>();
  let jalonCourant: boolean | null = null;
  const lignes: Array<Array<[number, number]>> = [];
  if (options.zoneTitre && options.zoneTitre > 0) lignes.push([[-1000, options.zoneTitre]]);
  const items: Disposition[] = [];
  const emprises = new Map<string, { emprise: [number, number]; o0: number; o1: number; lab: number; labCourt: number; labNom: number; w: number; marque: boolean; dureeMin: number; formes: string[] }>();
  /* l'année (colonnes d'un mois) : la chose garde sa vraie durée, au jour près ; en semaines, elle prend ses colonnes entières. D385 : un axe qui
     porte des jours (vue Jour, semaine dépliée) pose aussi chaque chose au jour près, sur ses colonnes d'un jour */
  const auJour = (colonnes.length > 0 && ecartJours(colonnes[0].debut, colonnes[0].fin) >= 14) || aDesJours(colonnes);
  const xDuJour = (iso: string): number => {
    const i = colonnes.findIndex(c => iso >= c.debut && iso <= c.fin);
    if (i < 0) return iso < colonnes[0].debut ? 0 : colonnes.length * largeurColonne;
    const c = colonnes[i];
    return (i + ecartJours(c.debut, iso) / (ecartJours(c.debut, c.fin) + 1)) * largeurColonne;
  };
  const libre = (ligne: number, x0: number, x1: number) => !lignes[ligne]?.some(([a, b]) => x0 < b + 6 && x1 > a - 6);
  /* une phrase posée en bas prend aussi la ligne au-dessous : elle doit y être libre (une ligne pas encore ouverte l'est) */
  const genreOk = (l: number) => jalonCourant === null || (jalonCourant ? !lignesAutres.has(l) : !lignesJalon.has(l));
  const libreCandidat = (l: number, c: Candidat) => genreOk(l) && libre(l, c.x0, c.x1) && (!c.bas || libre(l + 1, c.bas.x0, c.bas.x1));
  /** Le premier (ligne, candidat) libre, palier par palier, en commençant à la ligne `depuis` ; sinon une ligne neuve. */
  const poser = (paliers: Candidat[][], neuve: Candidat, depuis = 0): { ligne: number; c: Candidat } => {
    const ordre = [...Array(lignes.length).keys()].map(i => (i + depuis) % Math.max(1, lignes.length));
    for (const palier of paliers) for (const l of ordre) for (const c of palier) if (libreCandidat(l, c)) return { ligne: l, c };
    return { ligne: lignes.length, c: neuve };
  };
  /**
   * Les places d'un texte de largeur `l` à côté d'un objet [o0, o1], du côté libre : à droite, puis à gauche ; jamais sous le + volant
   * (`bord`), jamais hors de la frise. `deux` : sur deux lignes « nom ».
   */
  /*
   * CRITIQUE-12 n° 4 (E35, D-135, E33) : le + reste à sa place, c'est l'étiquette qui cède. Une chose posée sous le + (au-delà de `bord`) peut y
   * rester ; son étiquette, posée à gauche, finit avant la zone du + (largeur du + et 8 px) : `finG`, et l'écart `retrait` jusqu'à sa chose.
   */
  const finGauche = (o0: number) => Math.min(o0 - 6, bord);
  const aCote = (o0: number, o1: number, l: number, deux: DeuxLignes = false): Candidat[] => {
    const finG = finGauche(o0), retrait = o0 - 6 - finG;
    const libreG = finG - 2, libreD = bord - o1 - 8;
    return [
      ...(l > 0 && libreD >= l ? [{ cote: 'droite' as const, place: l, x0: o0, x1: o1 + 6 + l, deux }] : []),
      ...(l > 0 && libreG >= l ? [{ cote: 'gauche' as const, place: l, x0: finG - l, x1: o1, deux, ...(retrait > 0 ? { retrait } : {}) }] : [])
    ];
  };
  /** Le dernier recours, quand la piste d'un côté est plus étroite que le nom : le côté le plus large, raccourci (jamais sous `min`). */
  const auPlusLarge = (o0: number, o1: number, l: number, min: number): Candidat => {
    const finG = finGauche(o0), retrait = o0 - 6 - finG;
    const libreG = finG - 2, libreD = bord - o1 - 8;
    const durD = Math.max(0, largeur - o1 - 8), durG = Math.max(0, finG + 2);
    return libreD >= libreG
      ? { cote: 'droite', place: Math.min(Math.max(min, Math.min(l, libreD)), durD), x0: o0, x1: o1 + 6 + Math.min(Math.max(min, Math.min(l, libreD)), durD) }
      : { cote: 'gauche', place: Math.min(Math.max(min, Math.min(l, libreG)), durG), x0: finG - Math.min(Math.max(min, Math.min(l, libreG)), durG), x1: o1, ...(retrait > 0 ? { retrait } : {}) };
  };

  for (const { c, p, j: jalon } of places) {
    jalonCourant = jalon;
    let gauche = p.a * largeurColonne + 2;
    let w = Math.max(0, (p.b - p.a + 1) * largeurColonne - 4);
    if (auJour) {
      const g = Math.max(0, xDuJour(c.debut)), d = Math.min(colonnes.length * largeurColonne, xDuJour(ajouterJours(c.fin || c.debut, 1)));
      gauche = g + 1; w = Math.max(0, d - g - 2);
    }
    const brassin = estBrassin(c);
    const tropPetite = estMarque(w);
    const pastilleVente = c.rangee === 'ventes' && p.a === p.b && !c.proposition;
    /* n° 19 : en 6 semaines, un brassin n'est jamais une icône ; ses courses et un brassin conditionné le sont */
    const marque = jalon || (tropPetite && (vueLarge || !brassin)) || (pastilleVente && !c.fin) || (deriveSansMontant(c) && !brassin) || !!c.conditionne || !!c.brassinLie;
    /* test en ligne 1, n° 1 (18.11, « C'est quoi ces deux paniers ? ») : toute marque porte son nom à côté, dans chaque vue, comme au banc
       (« Emballage · Jhhh », « Impôt sur la bière · 4 brassins ») ; jamais une icône dont le nom n'existe que pour le lecteur d'écran */
    const avecLibelle = marque;
    /* la durée d'un brassin : entière, puis courte (« J0 / 28 », « pas brassée ») ; le nom ne cède jamais pour elle */
    const duree = marque ? null : dureeVue(c);
    const formes = duree ? formesDuree(duree) : [];
    const courte = formes.length > 1 ? formes[formes.length - 1] : null;
    const lab = largeurEtiquette(c, duree, lieCourt);
    const labCourt = courte ? largeurEtiquette(c, courte, lieCourt) : lab;
    const labNom = largeurEtiquette(c, false, lieCourt);
    const min = Math.min(labNom, largeurEtiquetteMin(c, lieCourt));
    const dureeMin = formes.length ? Math.ceil(largeurTexte(formes[formes.length - 1], 600)) + 8 : 0;
    /* deux lignes « nom » : seulement pour une chose liée (la pastille passe dessous), et jamais en paysage (une ligne de 20 px) */
    const lie = lieVu(c);
    const deuxNom = lie && !paysage ? largeurDeuxLignes(c, lieCourt, 'nom') : 0;
    const deuxSeul = lie && !paysage ? largeurDeuxLignes(c, lieCourt, 'nomSeul') : 0;
    let o0 = gauche, o1 = gauche + w;
    if (marque) {
      /* D386 : un jalon se pose au centre de SON jour, pas au milieu de sa semaine */
      const centre = auJour ? gauche + w / 2 : jalon ? (xDuJour(c.debut) + xDuJour(ajouterJours(c.debut, 1))) / 2 : (p.a + 0.5) * largeurColonne;
      gauche = centre - 14;
      o0 = gauche; o1 = centre + 14;
    }
    const objet: Candidat = { cote: 'dedans', place: 0, x0: o0, x1: o1 };
    /* CRITIQUE-10 n° 2 (E24, D-9, option a) : les jours actifs (« 5 j ») sont des points sur leur propre ligne de la piste, sous le nom : posé
       dans la barre, le nom prend la ligne du haut et la barre devient haute (la ligne au-dessous lui est réservée, comme la phrase d'un
       brassin) ; le nom ne couvre jamais un point. Hors de la barre, il est à côté, du côté libre (E24), et les points gardent toute la barre. */
    const points = !marque && !brassin && (c.joursActifs ?? 0) > 0;
    const dedans = (ok: boolean): Candidat[] => (!marque && ok
      ? [{ cote: 'dedans', place: w - 16, x0: o0, x1: o1, ...(points && !paysage ? { bas: { ou: 'barre' as const, x0: o0, x1: o1 } } : {}) }]
      : []);
    let choix: { ligne: number; c: Candidat };
    if (marque && !avecLibelle) choix = poser([[objet]], objet);
    else {
      const dedansDuree = dedans(w - 16 >= labNom + dureeMin);
      const dedansEntier = dedans(w - 16 >= labNom);
      const entiers = aCote(o0, o1, lab), courts = labCourt < lab ? aCote(o0, o1, labCourt) : [], noms = labNom < labCourt ? aCote(o0, o1, labNom) : [];
      /* n° 26 : nom et montant ensemble d'abord ; le nom seul en tête (montant dessous) seulement si ensemble ils seraient coupés */
      const deux = deuxNom > 0 && deuxNom < labNom ? aCote(o0, o1, deuxNom, 'nom') : [];
      if (!deux.length && deuxSeul > 0 && deuxSeul < labNom) deux.push(...aCote(o0, o1, deuxSeul, 'nomSeul'));
      /* CRITIQUE-9 n° 3 (E25, E29) : la phrase entière d'un brassin, « J0 / 28 · prête 21 déc. ». Elle a une place si la barre la porte à côté
         du nom, ou à côté de la barre, ou sur deux lignes à côté, ou seule dans la barre (le nom à côté) ; hors paysage, la barre haute la porte
         en bas (as/cap/p-repos), sinon la ligne sous la barre. Tant qu'une de ces places existe, « J0 / 28 » seul n'est jamais choisi. */
      const phrase = !marque && formes.length > 1 ? formes[0] : null;
      const pleinDedans = phrase ? dedans(dureeDansBarre(c, w, true) === phrase) : dedansDuree;
      /* une proposition garde son nom à côté (pointillé lisible) ; un brassin garde le sien dedans, avec sa durée (as/p-repos) */
      const premier = c.proposition ? [...entiers, ...pleinDedans] : [...pleinDedans, ...entiers];
      const nomsPlein = phrase && dureeDansBarre(c, w, false) === phrase ? aCote(o0, o1, labNom) : [];
      /* CAL-BARRE-HAUTE (18.11, « Pas besoin d'avoir autant de place, la stout maison est au bon format, juste un mini espace entre les
         évènements(brassin) ») : un brassin n'a plus de barre haute (nom en haut, phrase en bas, vide entre) ni de phrase sur la ligne sous sa
         barre. Toute barre de brassin est au format de Stout maison : une ligne de texte (nom, montant, phrase) puis le pied d'étapes ; quand la
         phrase entière n'y tient pas, la barre porte sa forme courte (« J0 / 28 · 21 déc. », puis « J0 / 28 »), la phrase entière au détail. */
      /* CRITIQUE-5 n° 1 et 23 : un brassin dont la durée entière ne tient pas sur une ligne la garde sur deux, hors paysage (as/cap/p-repos :
         « Blonde d'automne −148 », puis « J0 / 28 ») : « Saison de ferme −137 », puis « pas brassée · prête le 15 déc. » */
      /* Lot A du test en ligne (18.11, n° 5) : plus de durée sur une 2e ligne non plus (« Ttt −148 », puis « pas brassée · prête le 3 déc. ») ;
         CAL-BARRE-HAUTE : une ligne de texte, la forme courte qui tient, la phrase entière au détail */
      const deuxDuree: Candidat[] = [];
      /* CRITIQUE-6 n° 6 : « Commande groupée » puis « de malt −540 » quand le nom et son montant n'ont la place d'aucun côté sur une ligne
         (hors paysage : une ligne de 20 px ne porte pas deux lignes de texte) ; le nom n'est raccourci que si même ainsi la place manque */
      const cp = !paysage && !lie && !formes.length ? couperNom(texteVu(c), montantBarre(c)) : null;
      const coupe = cp && cp.largeur + 8 < labNom ? aCote(o0, o1, cp.largeur + 8, 'coupe') : [];
      /* la coupe ne passe jamais devant une ligne entière : tant qu'un côté a la place du nom sur une ligne, une ligne neuve la porte */
      /* sans aucune place pour la phrase entière : l'ordre d'avant, la durée courte dans la barre d'abord */
      /* en paysage (une ligne de 20 px), une barre à points garde son nom à côté d'abord : la barre n'a pas de seconde ligne pour les points */
      const premierCourt = c.proposition || (points && paysage) ? [...entiers, ...dedansDuree] : [...dedansDuree, ...entiers];
      const uneLigne = premierCourt.length + deuxDuree.length + courts.length + noms.length + dedansEntier.length + deux.length > 0;
      /* CRITIQUE-6, doute Lier (m390-49a) : la pastille « Blonde d’automne » n'a la place d'aucun côté de « Hotte −900 » : elle débordait de
         l'écran. Le nom et le montant restent entiers ; le lien se lit au badge de la barre, au message « Liée à … » et au détail */
      const labSansLie = lie ? Math.ceil(largeurTexte(texteVu(c), 600) + (montantBarre(c) ? largeurTexte(montantBarre(c) as string, 700) + 6 : 0)) + 6 : 0;
      const sansPastille = lie && !uneLigne ? aCote(o0, o1, labSansLie).map(k => ({ ...k, sansLie: true })) : [];
      /* Tour 2 n° 3 (19.11, verdict n° 4 : « IPA de printemps » poussé à droite de sa barre par « coût à venir », « Porter d'hiver · coût à
         venir » à gauche de la sienne) : le nom d'un brassin reste DANS sa barre dès qu'il y tient. La phrase entière cède d'abord (forme courte,
         puis rien : elle reste au détail), puis « · coût à venir » (le titre seul entre ; la rangée et le détail le disent encore). À côté
         seulement quand même le titre seul ne tient pas dans la barre. */
      const nomDansBarre = brassin && !c.proposition;
      const titreSeul = nomDansBarre && !dedansEntier.length && !!c.etiquette && c.etiquette !== c.titre && !c.brassinLie
        && w - 16 >= largeurEtiquette({ ...c, etiquette: undefined }, false, lieCourt)
        ? dedans(true).map(k => ({ ...k, titreSeul: true })) : [];
      const dansBarre = nomDansBarre && dedansEntier.length ? [phrase ? pleinDedans : [], dedansDuree, dedansEntier] : titreSeul.length ? [titreSeul] : null;
      if (dansBarre) choix = poser(dansBarre, (dansBarre.find(x => x.length > 0) as Candidat[])[0]);
      else {
        const pleins = [premier, deuxDuree, nomsPlein];
        const aPlein = !!phrase && pleins.some(x => x.length > 0);
        const paliers = aPlein ? pleins : uneLigne ? [premierCourt, deuxDuree, courts, noms, dedansEntier, deux] : sansPastille.length ? [sansPastille] : [coupe];
        /* aucune ligne ouverte n'a la place : une ligne libre au-dessous, où le nom tient entier ; sinon (la piste est trop étroite) au plus large */
        const neuve = aPlein
          ? (premier[0] ?? deuxDuree[0] ?? nomsPlein[0]) as Candidat
          : premierCourt[0] ?? deuxDuree[0] ?? courts[0] ?? noms[0] ?? dedansEntier[0] ?? deux[0] ?? sansPastille[0] ?? coupe[0] ?? auPlusLarge(o0, o1, labNom, min);
        choix = poser(paliers, neuve);
      }
    }
    const { ligne, c: k } = choix;
    const emprise: [number, number] = [k.x0, k.x1];
    (lignes[ligne] ||= []).push(emprise);
    (jalon ? lignesJalon : lignesAutres).add(ligne);
    if (k.bas) (lignes[ligne + 1] ||= []).push([k.bas.x0, k.bas.x1]);
    emprises.set(c.id, { emprise, o0, o1, lab, labCourt, labNom, w, marque, dureeMin, formes });
    const leCote = marque && !avecLibelle ? 'dedans' : k.cote;
    const phraseBas = k.bas ? (k.bas.ou === 'barre' ? { ou: 'barre' as const } : { ou: 'dessous' as const, x0: k.bas.x0, x1: k.bas.x1 }) : undefined;
    items.push({ chose: c, a: p.a, b: p.b, gauche, largeur: marque ? 28 : w, ligne, marque, petite: marque && vueLarge, avecLibelle, duree: null, cote: leCote, place: k.place, deuxLignes: k.deux ?? false, ...(k.sansLie ? { sansLie: true } : {}), ...(phraseBas ? { phraseBas } : {}), ...(k.cote === 'gauche' && k.retrait ? { retrait: k.retrait } : {}), ...(jalon ? { jalon: true } : {}), ...(k.titreSeul ? { titreSeul: true } : {}) });
  }
  jalonCourant = null;

  /* chaque étiquette posée à côté s'allonge dans la place libre de sa ligne (jusqu'à l'objet suivant, jamais sous le + volant), d'abord celles
     de droite, puis celles de gauche : un nom raccourci y retrouve des lettres, un nom entier y gagne sa durée */
  for (const passe of ['droite', 'gauche'] as const) {
    for (const d of items) {
      const e = emprises.get(d.chose.id);
      if (!e || d.cote !== passe || d.deuxLignes || d.place >= e.lab) continue;
      const autres = (lignes[d.ligne] ?? []).filter(x => x !== e.emprise);
      if (passe === 'droite') {
        const suivant = Math.min(bord, ...autres.filter(([a]) => a >= e.o1).map(([a]) => a - 6));
        d.place = Math.max(d.place, Math.min(e.o1 + 6 + e.lab, suivant) - e.o1 - 6);
        e.emprise[1] = e.o1 + 6 + d.place;
      } else {
        /* la fin de l'étiquette : collée à sa chose, ou avant la zone du + (`retrait`, CRITIQUE-12 n° 4) */
        const fin = e.o0 - 6 - (d.retrait ?? 0);
        const precedent = Math.max(0, ...autres.filter(([, b]) => b <= fin).map(([, b]) => b + 6));
        d.place = Math.max(d.place, fin - Math.max(fin - e.lab, precedent));
        e.emprise[0] = fin - d.place;
      }
    }
  }
  /* « J7 / 28 · prête 7 déc. » à côté du nom s'il tient entier, sinon « J7 / 28 » ; jamais coupé (n° 30) ; sinon il vit dans la barre */
  for (const d of items) {
    const e = emprises.get(d.chose.id);
    if (!e || e.marque || !e.formes.length || d.cote === 'dedans' || d.deuxLignes) continue;
    /* CRITIQUE-9 n° 3 : la forme courte à côté seulement si la barre ne porte pas la phrase entière (elle y reste alors, dedans) */
    const barrePleine = e.formes.length > 1 && dureeDansBarre(d.chose, e.w, false) === e.formes[0];
    d.duree = d.place >= e.lab - 4 ? e.formes[0] : e.formes.length > 1 && !barrePleine && d.place >= e.labCourt - 4 ? e.formes[e.formes.length - 1] : null;
  }

  /* n° 22 : le caddie d'un brassin (jalon « commander ») se pose comme une chose, d'abord sur la ligne de son brassin */
  const caddies: PlaceCaddie[] = [];
  for (const d of items) {
    const j = d.chose.jalons?.find(x => x.id === 'commander');
    if (!j || d.marque) continue;
    const col = colonnes.findIndex(cl => j.jour >= cl.debut && j.jour <= cl.fin);
    if (col < 0) continue;
    const centre = auJour ? xDuJour(j.jour) : col * largeurColonne + largeurColonne / 2;
    const o0 = centre - CADDIE_PX / 2, o1 = centre + CADDIE_PX / 2;
    /* test en ligne 1, n° 1 : le caddie nomme son brassin dans chaque vue, 3 mois, 6 mois et An compris */
    const texte = texteCaddie(d.chose, j);
    const seul: Candidat = { cote: 'dedans', place: 0, x0: o0, x1: o1 };
    let pose: { ligne: number; c: Candidat };
    let texteVuCaddie: string | null = null;
    let deuxCaddie: [string, string] | null = null;
    if (!texte) pose = poser([[seul]], seul, d.ligne);
    else {
      /* CRITIQUE-5 n° 32 : en 6 semaines, le caddie nomme toujours son brassin : « Blonde d'automne · malt pilsner, saaz », sinon
         « Blonde · malt pilsner, saaz », quitte à ouvrir une ligne. En paysage seulement, sans place sur une ligne ouverte, le caddie seul
         (son nom au toucher) plutôt qu'une ligne de plus (E10). */
      const court = texteCaddie(d.chose, j, true);
      const mesure = (t: string) => Math.ceil(largeurTexte(t, 500)) + 6;
      const lab = mesure(texte), labCourt = mesure(court);
      /* CRITIQUE-6 n° 17 : le nom court ne vient qu'en manque de place réel, jamais parce que le brassin a bougé : la ligne entière (quitte à
         ouvrir une ligne), puis, hors paysage, deux lignes « Blonde d'automne » et « malt pilsner, saaz » ; le nom court en dernier */
      const quoi = texte.slice(d.chose.titre.length + 3);
      const labDeux = Math.max(mesure(d.chose.titre), mesure(quoi)) + 2;
      const plein = aCote(o0, o1, lab), deuxL = !paysage && labDeux < lab ? aCote(o0, o1, labDeux, 'coupe') : [], bref = aCote(o0, o1, labCourt);
      const paliers = paysage ? [plein, bref, [seul]] : plein.length ? [plein] : deuxL.length ? [deuxL] : [bref];
      pose = poser(paliers, plein[0] ?? deuxL[0] ?? bref[0] ?? auPlusLarge(o0, o1, labCourt, labCourt), d.ligne);
      if (pose.c.cote !== 'dedans') texteVuCaddie = pose.c.deux === 'coupe' || pose.c.place >= lab ? texte : court;
      if (pose.c.deux === 'coupe') deuxCaddie = [d.chose.titre, quoi];
    }
    (lignes[pose.ligne] ||= []).push([pose.c.x0, pose.c.x1]);
    caddies.push({ chose: d.chose, jour: j.jour, centre, ligne: pose.ligne, texte: texteVuCaddie, cote: pose.c.cote === 'gauche' ? 'gauche' : 'droite', place: pose.c.place, ...(deuxCaddie ? { lignes: deuxCaddie } : {}), ...(pose.c.cote === 'gauche' && pose.c.retrait ? { retrait: pose.c.retrait } : {}) });
  }

  /* n° 21 : le renvoi « Livraison La Cigogne · S2 › » en bout de rangée, dans la piste, sur la première ligne où il ne touche rien */
  const renvois = (options.renvois ?? []).map(wr => {
    const x1 = bord - 2, x0 = x1 - wr;
    let l = 0;
    while (!libre(l, x0, x1)) l++;
    (lignes[l] ||= []).push([x0, x1]);
    return { ligne: l, x: x0 };
  });

  const occupees = lignes.reduce((n, l, i) => (l.some(([a]) => a > -1000) ? i + 1 : n), 0);
  return { items, lignes: occupees, caddies, renvois };
}

/**
 * `estime` (CRITIQUE-12 n° 2) : la somme des choses hors courbe (`horsCourbe`, une fête du carnet), jamais dans `solde` ; `confirme` : la
 * pastille garde « confirmé S47–S52 » (faux quand le seul argent de la rangée est estimé hors courbe).
 */
export interface Pastille { texte: string; lecture: string; part: number; solde: number | null; estime: number | null; confirme: boolean; debut: string; fin: string }
/** E23 : « Ventes, confirmé de S47 à S52 : 2 choses, solde +900 ». Ce qui n'est pas chiffré est dit en mots, jamais compté 0. */
export function pastille(rangee: IdRangee, choses: readonly ChoseCalendrier[], colonnes: readonly Colonne[]): Pastille {
  /* le caddie d'un brassin répète une part de son budget : la pastille ne le recompte pas */
  const dedans = choses.filter(c => !c.brassinLie && positionDans(colonnes, c));
  const fermes = dedans.filter(c => !c.probable && !c.proposition);
  const probables = dedans.length - fermes.length;
  /* CRITIQUE-12 n° 2 (E23, D-165, A2) : une fête hors courbe (« Marché de Noël +1 180 ») n'est ni comptée au solde confirmé, ni dite
     « confirmé » : « +1 180 estimé », « recette estimée +1 180, hors courbe (pas dans Finances) » */
  const estimees = fermes.filter(c => c.horsCourbe && c.centimes !== undefined);
  const comptees = fermes.filter(c => !(c.horsCourbe && c.centimes !== undefined));
  const chiffrees = comptees.filter(c => c.centimes !== undefined);
  /* CRITIQUE-5 n° 19 (E23) : un brassin posé sans budget (`coutAVenir`) ou au montant incomplet (`partiel`) a un coût à venir, dit en mots */
  const aVenir = comptees.filter(c => c.coutAVenir || c.partiel);
  const sansMontant = comptees.filter(c => c.centimes === undefined && !c.coutAVenir && !c.partiel).length;
  const solde = chiffrees.length ? chiffrees.reduce((s, c) => s + (c.centimes as number), 0) : null;
  const estime = estimees.length ? estimees.reduce((s, c) => s + (c.centimes as number), 0) : null;
  /* seule l'estimation porte l'argent de la rangée : le mot « confirmé » part ; une rangée sans argent (Activités en jours) le garde */
  const confirme = !(solde === null && estime !== null && !aVenir.length);
  const premier = colonnes[0]?.etiquette ?? '', dernier = colonnes[colonnes.length - 1]?.etiquette ?? '';
  const n = fermes.length;
  const nChoses = (k: number) => `${k} chose${k > 1 ? 's' : ''}`;
  const morceaux = [`${nomRangee(rangee)}, ${confirme ? 'confirmé ' : ''}de ${premier} à ${dernier} : ${nChoses(n)}`];
  const jours = fermes.reduce((s, c) => s + (c.joursActifs ?? 0), 0);
  if (rangee === 'activites') {
    if (jours) morceaux.push(`${jours} j`);
  } else if (solde !== null) morceaux.push(`solde ${francsSignes(solde)}`);
  else if (comptees.length && !aVenir.length) morceaux.push('solde non renseigné');
  if (aVenir.length) morceaux.push('coût à venir');
  if (sansMontant && solde !== null) morceaux.push(`${sansMontant} sans montant`);
  if (estime !== null) morceaux.push(`${estime < 0 ? 'coût' : 'recette'} estimée ${francsSignes(estime)}, hors courbe (pas dans Finances)`);
  if (probables) morceaux.push(`${probables} probable${probables > 1 ? 's' : ''}`);
  /* le nombre dit ce qu'on voit : toutes les choses de la fenêtre, probables comprises (une étiquette « 4 » devant 5 barres se contredit) ;
     jamais un chiffre seul (« 1 ») : « 1 chose », ou « coût à venir » quand c'est le coût qui manque */
  const nbVu = dedans.length;
  const enMots = aVenir.length ? 'coût à venir' : nbVu ? nChoses(nbVu) : '';
  const texte = rangee === 'activites' ? (jours ? `${jours} j` : nbVu ? nChoses(nbVu) : '')
    : solde !== null ? `${francsSignes(solde)}${aVenir.length ? ' + coût à venir' : ''}`
      : estime !== null && !aVenir.length ? `${francsSignes(estime)} estimé` : enMots;
  return { texte, lecture: morceaux.join(', '), part: Math.abs(solde ?? (aVenir.length ? 0 : estime ?? 0)), solde, estime, confirme, debut: premier, fin: dernier };
}

export interface DragEtat { id: string; mode: 'glisse' | 'bord'; k: number; jours: number }

/** Un renvoi vers une chose hors de la vue (E32 : « Livraison La Cigogne · S1 › »). */
export interface Renvoi { chose: ChoseCalendrier; texte: string }

export interface RangeeProps {
  id: IdRangee;
  /** Toutes les choses de cette rangée (la rangée filtre ce qu'elle montre). */
  choses: readonly ChoseCalendrier[];
  colonnes: readonly Colonne[];
  largeurColonne: number;
  largeur: number;
  mesures: Mesures;
  /** Paysage : le titre sur la première ligne, la rangée compacte (E10). */
  paysage?: boolean;
  /** 3 mois, 6 mois, An (E27) : les petites choses en marques, l'appui long d'une marque ouvre les 6 semaines. */
  vueLarge?: boolean;
  /** Largeur à droite où aucun nom ne se pose (le + volant). */
  reserveDroite?: number;
  /** Rangée masquée par l'œil ou par un filtre : seules les choses épinglées restent. */
  masquee: boolean;
  /** Pourquoi : l'œil (réaffichable d'un toucher) ou un filtre de la visite. */
  cause: 'oeil' | 'filtre' | null;
  epingles: readonly string[];
  etoiles: readonly string[];
  /** Part de la plus grosse pastille de la frise (0..1 de |solde| / max). */
  partMax: number;
  selectionId?: string | null;
  menuId?: string | null;
  drag: DragEtat | null;
  /** Une phrase pendant le glisser (« S51 · 14 déc. · lâcher ici »). */
  ici?: string | null;
  etiquetteDuree?: { id: string; texte: string } | null;
  renvois?: readonly Renvoi[];
  onRenvoi?: (chose: ChoseCalendrier) => void;
  onAjouter: (r: IdRangee) => void;
  onBasculerMasque: (r: IdRangee) => void;
  barre: Pick<BarreProps, 'onToucher' | 'onAppuiLong' | 'onGlisse' | 'onLacheGlisse' | 'onBord' | 'onLacheBord' | 'onRefus'>;
  /** Appui long sur une marque en 3 mois, 6 mois ou An : la vue 6 semaines centrée sur elle (E27, D-199). Absent : rien. */
  onSixSemaines?: (chose: ChoseCalendrier) => void;
  /** Le détail de la chose choisie de cette rangée, posé sous ses barres (f4-b). */
  detail?: React.ReactNode;
  /** CRITIQUE-13 n° 1 (règle n° 1, `as/cap/p-f6b-apres`) : l'alerte f6-b, dans le flux sous la vente promise ; elle pousse la suite. */
  alerte?: React.ReactNode;
  /** D385 : la grille des jours (vue Jour, semaine dépliée), posée sous les choses de la piste ; absente : les traits de semaine, comme avant. */
  grille?: React.ReactNode;
  /** D386 : une barre touchée qui a des jalons liés : leurs ids (ils s'allument, les autres jalons pâlissent) ; absent : rien. */
  eclairage?: ReadonlySet<string> | null;
  /** D390 : la rangée de chaque barre (id → rangée), pour le point d'un jalon lié ; absent : aucun point. */
  rangeeDeBarre?: ReadonlyMap<string, IdRangee>;
}

/** Paysage : la largeur estimée du titre (carré +, nom, œil, pastille), posé sur la première ligne. */
function largeurTitre(nom: string, texteAPart: string): number {
  return Math.ceil(20 + 6 + nom.length * 8.4 + 6 + 24 + 6 + (texteAPart ? Math.max(52, texteAPart.length * 8.4 + 20) : 0) + 10);
}
const largeurRenvoi = (texte: string): number => Math.ceil(largeurTexte(texte, 700)) + 36;

/*
 * La bulle « S51 · 14 déc. · lâcher ici » (E28, D-46, D-189 ; E33 « jamais sur un nom »).
 * CRITIQUE-4 n° 13 a : elle ne se pose pas sur un nom. CRITIQUE-11 n° 6 : à 390 en 6 mois, toutes les places près du doigt touchaient un nom,
 * et la bulle restait à sa première place, au-dessus de la barre, sur le titre « Brassins » et sa pastille (m390-clair-09).
 * Règle, comme sa maquette (as/cap/p-f1a-pendant, `poser` de as-gestes.js : chaque place notée par la surface de texte couverte) :
 *  - un titre de rangée (`.cal-rh`, son +, son œil, sa pastille r2-c) est un mur : aucune place qui le croise n'est retenue ;
 *  - les autres noms, montants et barres sont notés par la surface couverte (une barre pèse moins qu'un texte) ;
 *  - les places, dans la piste de la barre glissée : au-dessus du doigt (le pouce couvre le dessous), sinon sous la barre ; plus loin, en
 *    hauteur comme de côté, chaque pixel d'écart se paie ; sans place dans la piste, sur la barre tenue elle-même, jamais sur un titre.
 * Mesurée après le rendu, dans le repère de l'écran ; la place retenue est écrite dans le repère de la piste.
 */
export interface Boite { left: number; top: number; right: number; bottom: number }
export interface Obstacle extends Boite { poids: number }
export interface PlaceBulle { left: number; top: number }

const croise = (a: Boite, b: Boite, marge = 2) => a.left < b.right + marge && a.right > b.left - marge && a.top < b.bottom + marge && a.bottom > b.top - marge;
const surface = (a: Boite, b: Boite) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

/**
 * La place de la bulle (fonction pure). `piste` : la boîte de la piste à l'écran ; `x` le centre de la colonne visée, `haut` et `bas` la barre
 * tenue, `largeur` la largeur de la piste : tout dans le repère de la piste. `murs` : les titres de rangée ; `obstacles` : le reste, pondéré.
 */
export function placerBulle(o: { w: number; h: number; x: number; haut: number; bas: number; largeur: number; piste: { left: number; top: number; height?: number }; murs: readonly Boite[]; obstacles: readonly Obstacle[] }): PlaceBulle {
  const { w, h, x, haut, bas, largeur, piste, murs, obstacles } = o;
  const gaucheMax = Math.max(2, largeur - w - 2);
  const dessus = haut - h - 4, dessous = bas + 4;
  /* Les hauteurs : au-dessus du doigt (prix 0), sous la barre (prix 6), puis toute la hauteur de la piste par pas de 4 px, chaque pixel
     d'écart à ces deux places payé 0,5. Une place hors de la piste mesurée n'est pas retenue ; sans mesure (jsdom), les deux places seules. */
  const hauteur = piste.height ?? 0;
  const tops = new Map<number, number>();
  const ajouter = (t: number) => {
    if (hauteur > 0 && (t < 0 || t + h > hauteur)) return;
    const prix = Math.min(Math.abs(t - dessus) * 0.5, 6 + Math.abs(t - dessous) * 0.5);
    tops.set(Math.round(t), Math.min(tops.get(Math.round(t)) ?? Infinity, prix));
  };
  ajouter(dessus);
  ajouter(dessous);
  if (hauteur > 0) for (let t = 0; t + h <= hauteur; t += 4) ajouter(t);
  /* sans place dans la piste : sur la barre tenue (le doigt la couvre déjà), jamais sur un titre */
  if (!tops.size) tops.set(Math.round(haut + (bas - haut - h) / 2), 600);
  /* Les places de côté : toute la largeur de la piste, par pas de 8 px, chaque pixel d'écart à la colonne visée payé 0,5. */
  const gauches = new Set<number>([Math.max(2, Math.min(gaucheMax, x - w / 2))]);
  for (let g = 2; g <= gaucheMax; g += 8) gauches.add(g);
  gauches.add(gaucheMax);
  let meilleure: (PlaceBulle & { note: number; mur: number }) | null = null;
  for (const [top, prix] of tops) {
    for (const left of gauches) {
      const boite: Boite = { left: piste.left + left, top: piste.top + top, right: piste.left + left + w, bottom: piste.top + top + h };
      const mur = murs.reduce((s, m) => s + (croise(boite, m) ? 1 + surface(boite, m) : 0), 0);
      if (meilleure && mur > meilleure.mur) continue;
      const note = prix + Math.abs(left + w / 2 - x) * 0.5 + obstacles.reduce((s, ob) => s + surface(boite, ob) * ob.poids, 0);
      if (!meilleure || mur < meilleure.mur || note < meilleure.note) meilleure = { left, top, note, mur };
    }
  }
  return { left: Math.round(meilleure!.left), top: Math.round(meilleure!.top) };
}

const MURS_BULLE = '.cal-rh, .cal-pastille, .cal-plus, .cal-oeil, .cal-cachees';
/* un nom pèse plus qu'un montant, un montant plus qu'une durée ; une barre moins qu'un texte */
const TEXTES_BULLE: ReadonlyArray<[string, number]> = [
  ['.cal-lbl-t, .cal-lie, .cal-renvoi', 3],
  ['.cal-lbl-m', 2],
  ['.cal-lbl-j, .cal-conf, .cal-vide, .cal-duree, .cal-duree-in', 1]
];
function BulleIci({ texte, x, haut, bas, largeur, choseId }: { texte: string; x: number; haut: number; bas: number; largeur: number; choseId: string }) {
  const el = React.useRef<HTMLSpanElement | null>(null);
  React.useLayoutEffect(() => {
    const b = el.current;
    const piste = b?.parentElement;
    if (!b || !piste) return;
    const w = b.offsetWidth || Math.ceil(largeurTexte(texte, 400)) + 18, h = b.offsetHeight || 24;
    const frise = piste.closest('[data-frise]') ?? document;
    const tenue = frise.querySelector<HTMLElement>(`[data-chose="${choseId.replace(/"/g, '')}"]`);
    const boites = (sel: string) => [...frise.querySelectorAll<HTMLElement>(sel)]
      .filter(e => !b.contains(e))
      .map(e => e.getBoundingClientRect())
      .filter(r => r.width > 0 && r.height > 0);
    const p = piste.getBoundingClientRect();
    const obstacles: Obstacle[] = [
      ...TEXTES_BULLE.flatMap(([sel, poids]) => boites(sel).map(r => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, poids }))),
      ...[...frise.querySelectorAll<HTMLElement>('.cal-barre, .cal-marque')].filter(e => e !== tenue).map(e => e.getBoundingClientRect())
        .filter(r => r.width > 0 && r.height > 0).map(r => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, poids: 0.4 })),
      /* la barre tenue est sous le pouce : une bulle posée dessus ne se lit pas */
      ...(tenue ? [tenue.getBoundingClientRect()].filter(r => r.width > 0).map(r => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, poids: 3 })) : [])
    ];
    /* seuls comptent les obstacles à la hauteur de la piste (et de la barre tenue, si la piste est trop basse) */
    const bande = (r: Boite) => !(p.height > 0) || (r.bottom > p.top + Math.min(0, haut - h - 4) && r.top < p.top + Math.max(p.height, bas + h + 4));
    const place = placerBulle({ w, h, x, haut, bas, largeur, piste: { left: p.left, top: p.top, height: p.height }, murs: boites(MURS_BULLE), obstacles: obstacles.filter(bande) });
    b.style.left = `${place.left}px`;
    b.style.top = `${place.top}px`;
  }, [texte, x, haut, bas, largeur, choseId]);
  return <span ref={el} className="cal-ici" data-ici>{texte}</span>;
}

export const Rangee: React.FC<RangeeProps> = props => {
  const { id, choses, colonnes, largeurColonne, largeur, mesures, paysage = false, vueLarge = false, reserveDroite = 0, masquee, cause, epingles, etoiles, partMax, selectionId, menuId, drag, ici, etiquetteDuree, renvois = [] } = props;
  const nom = nomRangee(id);
  const dedans = choses.filter(c => positionDans(colonnes, c));
  const montrees = masquee ? dedans.filter(c => epingles.includes(c.id)) : dedans;
  const cachees = masquee ? dedans.length - montrees.length : 0;
  const p = pastille(id, masquee ? [] : dedans, colonnes);
  const vide = dedans.length === 0;
  const texteCachees = cachees ? `${cachees} chose${cachees > 1 ? 's' : ''} cachée${cachees > 1 ? 's' : ''}` : '';
  const zoneTitre = paysage ? largeurTitre(nom, masquee ? (texteCachees || 'masquée') : vide ? 'vide' : p.texte) : 0;
  const largeursRenvois = renvois.map(r => largeurRenvoi(r.texte));
  const cleRenvois = largeursRenvois.join(',');
  /* n° 15 : au téléphone et dès 3 mois, la pastille « lié à » dit l'icône lien et le nom court ; au 1280, le texte entier */
  const lieCourt = largeur < 700 || vueLarge;
  const auJourVue = colonnes.length > 0 && ecartJours(colonnes[0].debut, colonnes[0].fin) >= 14;
  const { items, lignes, caddies, renvois: posRenvois } = React.useMemo(
    /* en An, une série mensuelle se pose en une barre (doute Papiers en An, CRITIQUE-12) */
    () => disposer(auJourVue ? seriesEnBarres(montrees) : montrees, colonnes, largeurColonne, largeur, {
      /* CRITIQUE-5 n° 14 : partout (téléphone, paysage, 1280), un nom reste entier tant que la place existe, quitte à ouvrir une ligne */
      reserveDroite, zoneTitre, vueLarge, renvois: largeursRenvois, paysage, lieCourt
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [montrees, colonnes, largeurColonne, largeur, reserveDroite, zoneTitre, paysage, vueLarge, cleRenvois, lieCourt, auJourVue]
  );
  const hauteurLane = lignes === 0 ? 0 : lignes * mesures.ligne + 2;
  /*
   * CAL-FICHE-CACHE-BARRE (paquet G n° 4, 19.11) : la fiche d'une chose touchée s'ouvrait en fin de rangée, d'autres barres entre elle et la
   * barre touchée. Elle s'ouvre juste sous la ligne de sa barre : la piste se coupe après cette ligne (et après toute chose qui la déborde,
   * phrase ou points posés sur la ligne au-dessous), les lignes suivantes descendent sous la fiche et remontent à sa fermeture. Une chose
   * qui n'est pas posée dans la rangée (masquée, série d'An) garde l'ancienne place, en fin de rangée.
   */
  const choisie = props.detail && selectionId ? items.find(d => d.chose.id === selectionId) : undefined;
  const coupe = choisie ? ligneDeCoupe(items, choisie) : -1;
  const fantome = drag ? items.find(i => i.chose.id === drag.id) : undefined;
  const auJour = colonnes.length > 0 && ecartJours(colonnes[0].debut, colonnes[0].fin) >= 14;
  /* D385 : le bord se tire au jour ; sa colonne de fin dit la largeur d'un jour (une colonne d'un jour, ou 1/7 d'une semaine) */
  const largeurJourA = (pos: { b: number } | null): number => {
    const c = pos ? colonnes[Math.min(colonnes.length - 1, pos.b)] : undefined;
    return c && c.debut === c.fin ? largeurColonne : largeurColonne / 7;
  };
  const parts = partMax > 0 ? Math.max(8, Math.round((p.part / partMax) * 100)) : 0;
  /* CRITIQUE-11 n° 2 a (E22) : l'œil, et « n choses cachées », n'agissent que sur un toucher voulu : un clic de pointeur (`detail > 0`) dont
     l'appui n'a pas commencé sur le bouton (le clic que Chrome émet au lâcher d'un glissé de 14 px, sur des rangées poussées) ne fait rien.
     Le clavier (`detail` 0) agit toujours. */
  const basculerVoulu = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.detail > 0 && !appuiCommenceSur(e.currentTarget)) return;
    props.onBasculerMasque(id);
  };

  return (
    <section
      className={`cal-rangee ${CLASSE_TEINTE[id]}${masquee ? ' cal-masquee' : ''}${paysage ? ' cal-rangee-l' : ''}`}
      data-rangee={id}
      aria-label={nom}
      style={{ ['--cw' as string]: `${largeurColonne}px`, ...(paysage ? { minHeight: mesures.ligne + 2 } : {}) }}
    >
      <header className="cal-rh" style={{ height: paysage ? mesures.ligne : mesures.titre }}>
        <button type="button" className="cal-plus" data-plus={id} aria-label={`Ajouter dans ${nom}`} onClick={() => props.onAjouter(id)}>
          <Plus size={16} strokeWidth={3} aria-hidden="true" />
        </button>
        <h3 className="cal-nom">{nom}</h3>
        {/* gi2 : l'œil est collé au titre, puis la pastille r2-c (remplie en proportion, avec son montant) et ce qu'elle compte */}
        {cause !== 'filtre' && (
          <button type="button" className="cal-oeil" aria-pressed={masquee} aria-label={masquee ? `Afficher ${nom}` : `Masquer ${nom}`} onClick={basculerVoulu}>
            {masquee ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        )}
        {masquee && cause === 'oeil' ? (
          <button type="button" className="cal-cachees" aria-label={`Afficher ${nom}${cachees ? ` : ${texteCachees}` : ''}`} onClick={basculerVoulu}>
            {texteCachees || 'masquée'}
          </button>
        ) : masquee ? (
          <span className="cal-cachees-f">{texteCachees}</span>
        ) : vide ? (
          <span className="cal-vide">vide</span>
        ) : (
          <span className="cal-pastille" role="img" aria-label={p.lecture} data-pastille={id}>
            <span className={`cal-pastille-p${p.confirme ? '' : ' cal-pastille-estime'}`}>
              <i className="cal-pastille-fond" style={{ width: `${parts}%` }} />
              <span className="cal-pastille-t">{p.texte}</span>
            </span>
            {/* CRITIQUE-12 n° 2 : une estimation hors courbe n'est jamais « confirmé » : seule, elle se dit « hors courbe » ; à côté d'un solde
                compté, « confirmé S47–S52 · +200 estimé » */}
            <span className="cal-conf">{p.confirme ? `confirmé ${p.debut}–${p.fin}${p.estime !== null ? ` · ${francsSignes(p.estime)} estimé` : ''}` : 'hors courbe'}</span>
          </span>
        )}
      </header>
      {hauteurLane > 0 && (coupe < 0 || coupe >= lignes - 1
        ? piste(0, lignes - 1, hauteurLane, false)
        : piste(0, coupe, (coupe + 1) * mesures.ligne, false))}
      {choisie && (
        <div className="cal-det-sous" data-detail-sous={choisie.chose.id} data-detail-ligne={coupe}>{props.detail}</div>
      )}
      {hauteurLane > 0 && coupe >= 0 && coupe < lignes - 1 && piste(coupe + 1, lignes - 1, (lignes - coupe - 1) * mesures.ligne + 2, true)}
      {props.alerte}
      {!choisie && props.detail}
    </section>
  );

  /**
   * Une piste : les lignes `de` à `a` de la rangée, dans une boîte de hauteur `hauteur` ; chaque chose y garde sa place, remontée de `de`
   * lignes. Sans fiche ouverte, une seule piste porte toutes les lignes (comme avant) ; `suite` : la piste sous la fiche.
   */
  function piste(de: number, a: number, hauteur: number, suite: boolean): React.ReactNode {
    const y = (ligne: number) => (ligne - de) * mesures.ligne + 2;
    const dedansPiste = (ligne: number) => ligne >= de && ligne <= a;
    /* la grille des jours se pose dans chaque morceau ; son mot « auj. » au pied du dernier seulement */
    const grille = props.grille && React.isValidElement<{ mot?: boolean }>(props.grille) && coupe >= 0 && !suite && a < lignes - 1
      ? React.cloneElement(props.grille, { mot: false }) : props.grille;
    return (
        <div className={`cal-lane${props.grille ? ' cal-lane-jours' : ''}`} style={{ height: hauteur }} data-lane={id} {...(suite ? { 'data-lane-suite': '' } : {})}>
          {grille}
          {fantome && !fantome.petite && dedansPiste(fantome.ligne) && (
            <i className="cal-fantome cal-pointille" aria-hidden="true" data-fantome style={{ left: fantome.gauche, width: fantome.largeur, top: y(fantome.ligne), height: mesures.barre }} />
          )}
          {items.filter(d => dedansPiste(d.ligne)).map(d => {
            const c = d.chose;
            const top = y(d.ligne);
            const surDrag = drag && drag.id === c.id;
            if (d.marque) {
              const commeBarre = !d.petite;
              /* paquet D n° 2 (D385) : un jalon se glisse comme une barre, à la semaine en vue Semaine (son jour de la semaine se garde : le
                 4 déc. glissé d'une colonne donne le 11), au jour sur un axe en jours. Le pas d'1/7 de colonne donnait +10 j pour 1,4 colonne. */
              const pas = largeurColonne;
              const ton = d.jalon && props.eclairage ? (props.eclairage.has(c.id) ? 'allume' as const : 'pale' as const) : undefined;
              const lieA = d.jalon ? barreLiee(c) : undefined;
              const pointLie = lieA ? props.rangeeDeBarre?.get(lieA) : undefined;
              return (
                <Marque
                  key={c.id} chose={c} centre={d.gauche + 14} haut={top} hauteur={Math.min(28, mesures.barre + 2)} largeurColonne={pas}
                  {...(d.jalon ? { jalon: true, lieA, ton, ...(pointLie ? { pointLie } : {}) } : {})}
                  epinglee={epingles.includes(c.id)} etoilee={etoiles.includes(c.id)} selectionnee={selectionId === c.id} menuOuvert={menuId === c.id} lieCourt={lieCourt}
                  libelle={d.avecLibelle ? { cote: d.cote === 'gauche' ? 'gauche' : 'droite', place: d.place, deux: d.deuxLignes, ...(c.brassinLie ? { texte: c.titre } : {}), ...(d.sansLie ? { sansLie: true } : {}), ...(d.retrait ? { retrait: d.retrait } : {}) } : undefined}
                  decalage={surDrag && drag.mode === 'glisse' ? drag.k * pas : 0}
                  bornes={[-d.a, colonnes.length - 1 - d.a]}
                  onToucher={props.barre.onToucher} onSixSemaines={props.onSixSemaines}
                  onGlisse={props.barre.onGlisse} onLacheGlisse={props.barre.onLacheGlisse} onRefus={(ch: ChoseCalendrier, raison: string) => props.barre.onRefus(ch, raison)}
                  /* test en ligne du paquet E : la petite marque (Mois, 3 mois, An) se glisse comme une barre ; son appui long garde les 6 semaines (E27) */
                  {...(commeBarre ? { onAppuiLong: props.barre.onAppuiLong } : {})}
                />
              );
            }
            /* doute Porter glissé (CRITIQUE-12) : une barre coupée au bord de la fenêtre y rogne ses jalons, jamais ne les tasse */
            const pos = positionDans(colonnes, c);
            const coupe = pos && (pos.coupeAGauche || pos.coupeADroite)
              ? { ...(pos.coupeAGauche ? { du: colonnes[0].debut } : {}), ...(pos.coupeADroite ? { au: colonnes[colonnes.length - 1].fin } : {}) } : undefined;
            return (
              <Barre
                key={c.id} chose={c} gauche={d.gauche} largeur={d.largeur} coupe={coupe} haut={top} hauteur={d.phraseBas?.ou === 'barre' ? mesures.barre + mesures.ligne : mesures.barre} cote={d.cote}
                phraseBas={d.phraseBas ? (d.phraseBas.ou === 'barre' ? { ou: 'barre' } : { ou: 'dessous', x: d.phraseBas.x0, dy: mesures.ligne }) : null} placeEtiquette={d.place} retrait={d.retrait} dureeACote={d.duree} deuxLignes={d.deuxLignes} sansLie={d.sansLie} titreSeul={d.titreSeul}
                largeurColonne={largeurColonne} bornes={[-d.a, colonnes.length - 1 - d.a]}
                epinglee={epingles.includes(c.id)} etoilee={etoiles.includes(c.id)} selectionnee={selectionId === c.id} menuOuvert={menuId === c.id} lieCourt={lieCourt}
                decalage={surDrag && drag.mode === 'glisse' ? drag.k * largeurColonne : 0}
                largeurJour={largeurJourA(pos)}
                allongement={surDrag && drag.mode === 'bord' ? drag.jours * largeurJourA(pos) : 0}
                etiquetteDuree={etiquetteDuree && etiquetteDuree.id === c.id ? etiquetteDuree.texte : undefined}
                {...props.barre}
              />
            );
          })}
          {caddies.filter(k => dedansPiste(k.ligne)).map(k => {
            const top = y(k.ligne) + Math.max(0, (mesures.barre - 18) / 2);
            const aria = `Commander avant le ${jourLisible(k.jour)} · ${k.texte ?? k.chose.titre}`;
            return (
              <React.Fragment key={`cmd-${k.chose.id}`}>
                <span data-jalon="commander" data-caddie={k.chose.id} className="cal-commander" aria-label={aria} role="img" style={{ left: k.centre - 9, top }}>
                  <ShoppingCart size={12} aria-hidden="true" />
                </span>
                {k.texte && (
                  <span
                    className={`cal-lbl cal-lbl-${k.cote} cal-lbl-caddie${k.lignes ? ' cal-lbl-2n' : ''}`} aria-hidden="true"
                    style={{ ...(k.lignes ? { top: y(k.ligne) - 2, height: mesures.barre + 4 } : { top: y(k.ligne), height: mesures.barre }), maxWidth: Math.max(40, k.place), ...(k.cote === 'droite' ? { left: k.centre + CADDIE_PX / 2 + 6 } : { right: `calc(100% - ${k.centre - CADDIE_PX / 2 - (k.retrait ?? 0)}px + 6px)` }) }}
                  >
                    {k.lignes
                      ? <><span className="cal-lbl-l1"><span className="cal-lbl-t cal-lbl-ent">{k.lignes[0]}</span></span><span className="cal-lbl-l2"><span className="cal-lbl-t cal-lbl-ent">{k.lignes[1]}</span></span></>
                      : <span className="cal-lbl-t">{k.texte}</span>}
                  </span>
                )}
              </React.Fragment>
            );
          })}
          {renvois.map((r, i) => {
            const pos = posRenvois[i];
            if (!pos || !dedansPiste(pos.ligne)) return null;
            return (
              <button
                key={r.chose.id} type="button" className="cal-renvoi" data-renvoi={r.chose.id}
                style={{ left: pos.x, top: y(pos.ligne) + Math.max(0, (mesures.barre - 24) / 2), maxWidth: largeursRenvois[i] }}
                onClick={() => props.onRenvoi?.(r.chose)}
              >
                {r.texte}<ChevronRight size={14} aria-hidden="true" />
              </button>
            );
          })}
          {drag && ici && fantome && dedansPiste(fantome.ligne) && (
            <BulleIci
              texte={ici} x={(fantome.a + drag.k + 0.5) * largeurColonne} largeur={largeur} choseId={fantome.chose.id}
              haut={y(fantome.ligne)} bas={y(fantome.ligne) + mesures.barre}
            />
          )}
        </div>
    );
  }
};

/**
 * La dernière ligne que la fiche de `choisie` laisse au-dessus d'elle (paquet G n° 4) : la ligne de sa chose, ou la suivante quand sa phrase
 * ou ses points y sont posés ; puis toute chose d'une ligne déjà gardée qui déborde plus bas l'emporte aussi (jamais une barre coupée).
 */
export function ligneDeCoupe(items: readonly Pick<Disposition, 'ligne' | 'phraseBas'>[], choisie: Pick<Disposition, 'ligne' | 'phraseBas'>): number {
  const fin = (d: Pick<Disposition, 'ligne' | 'phraseBas'>) => d.ligne + (d.phraseBas ? 1 : 0);
  let coupe = fin(choisie);
  for (let encore = true; encore;) {
    encore = false;
    for (const d of items) if (d.ligne <= coupe && fin(d) > coupe) { coupe = fin(d); encore = true; }
  }
  return coupe;
}

/** « Livraison La Cigogne · S1 › » : le renvoi d'une vente liée à un brassin visible, quand la vente est hors de la vue (E32). */
export function texteRenvoi(c: ChoseCalendrier): string {
  return `Livraison ${clientDe(c) ?? c.titre} · ${etiquetteS(c.debut)}`;
}

/**
 * Le client d'une vente : `lie.client`, sinon le morceau « La Cigogne · client » de l'aperçu. CRITIQUE-6 n° 15 : quand le titre le dit déjà
 * (« 3 fûts La Cigogne »), le lien ne porte plus `client` (lot A) ; le renvoi garde « Livraison La Cigogne · S1 › » (E32).
 */
export function clientDe(c: Pick<ChoseCalendrier, 'lie'>): string | undefined {
  if (c.lie?.client) return c.lie.client;
  const suffixe = ' · client';
  const morceau = c.lie?.apercu.split(' ; ').map(x => x.trim()).find(x => x.endsWith(suffixe));
  return morceau ? morceau.slice(0, -suffixe.length) || undefined : undefined;
}
