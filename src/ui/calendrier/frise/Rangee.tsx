import React from 'react';
import { ChevronRight, Eye, EyeOff, Plus, ShoppingCart } from 'lucide-react';
import { ajouterJours, ecartJours, estMarque, etiquetteS, francsSignes, jourLisible, nomRangee, type ChoseCalendrier, type JalonBrassin, type Rangee as IdRangee } from '../../../domain/calendrier';
import { Barre, formesDuree, montantBarre, type BarreProps, type CoteEtiquette } from './Barre';
import { CLASSE_TEINTE, Marque, couperNom, dureeVue, largeurPastilleLie, largeurTexte, lieMontre, type ModeDeuxLignes } from './Marque';

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
}

/** Le caddie d'un brassin (son jalon « commander »), posé sans chevauchement, avec son nom en 6 semaines (n° 19, n° 22). */
/** `lignes` (CRITIQUE-6 n° 17) : le nom du brassin puis ce qui manque, sur deux lignes, quand une seule ligne n'a pas la place. */
export interface PlaceCaddie { chose: ChoseCalendrier; jour: string; centre: number; ligne: number; texte: string | null; cote: 'gauche' | 'droite'; place: number; lignes?: [string, string] }

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

/** Une sortie dérivée d'un brassin dont le montant n'est pas renseigné : une icône, son nom vient au toucher (CAL-INFO-TROP). */
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

interface Candidat { cote: CoteEtiquette; place: number; x0: number; x1: number; deux?: DeuxLignes; sansLie?: boolean }

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
    .sort((x, y) => x.p.a - y.p.a || (y.p.b - y.p.a) - (x.p.b - x.p.a) || x.c.id.localeCompare(y.c.id));
  const lignes: Array<Array<[number, number]>> = [];
  if (options.zoneTitre && options.zoneTitre > 0) lignes.push([[-1000, options.zoneTitre]]);
  const items: Disposition[] = [];
  const emprises = new Map<string, { emprise: [number, number]; o0: number; o1: number; lab: number; labCourt: number; labNom: number; w: number; marque: boolean; dureeMin: number; formes: string[] }>();
  /* l'année (colonnes d'un mois) : la chose garde sa vraie durée, au jour près ; en semaines, elle prend ses colonnes entières */
  const auJour = colonnes.length > 0 && ecartJours(colonnes[0].debut, colonnes[0].fin) >= 14;
  const xDuJour = (iso: string): number => {
    const i = colonnes.findIndex(c => iso >= c.debut && iso <= c.fin);
    if (i < 0) return iso < colonnes[0].debut ? 0 : colonnes.length * largeurColonne;
    const c = colonnes[i];
    return (i + ecartJours(c.debut, iso) / (ecartJours(c.debut, c.fin) + 1)) * largeurColonne;
  };
  const libre = (ligne: number, x0: number, x1: number) => !lignes[ligne]?.some(([a, b]) => x0 < b + 6 && x1 > a - 6);
  /** Le premier (ligne, candidat) libre, palier par palier, en commençant à la ligne `depuis` ; sinon une ligne neuve. */
  const poser = (paliers: Candidat[][], neuve: Candidat, depuis = 0): { ligne: number; c: Candidat } => {
    const ordre = [...Array(lignes.length).keys()].map(i => (i + depuis) % Math.max(1, lignes.length));
    for (const palier of paliers) for (const l of ordre) for (const c of palier) if (libre(l, c.x0, c.x1)) return { ligne: l, c };
    return { ligne: lignes.length, c: neuve };
  };
  /**
   * Les places d'un texte de largeur `l` à côté d'un objet [o0, o1], du côté libre : à droite, puis à gauche ; jamais sous le + volant
   * (`bord`), jamais hors de la frise. `deux` : sur deux lignes « nom ».
   */
  const aCote = (o0: number, o1: number, l: number, deux: DeuxLignes = false): Candidat[] => {
    const libreG = o0 - 8, libreD = bord - o1 - 8;
    return [
      ...(l > 0 && libreD >= l ? [{ cote: 'droite' as const, place: l, x0: o0, x1: o1 + 6 + l, deux }] : []),
      ...(l > 0 && libreG >= l ? [{ cote: 'gauche' as const, place: l, x0: o0 - 6 - l, x1: o1, deux }] : [])
    ];
  };
  /** Le dernier recours, quand la piste d'un côté est plus étroite que le nom : le côté le plus large, raccourci (jamais sous `min`). */
  const auPlusLarge = (o0: number, o1: number, l: number, min: number): Candidat => {
    const libreG = o0 - 8, libreD = bord - o1 - 8;
    const durD = Math.max(0, largeur - o1 - 8), durG = Math.max(0, o0 - 4);
    return libreD >= libreG
      ? { cote: 'droite', place: Math.min(Math.max(min, Math.min(l, libreD)), durD), x0: o0, x1: o1 + 6 + Math.min(Math.max(min, Math.min(l, libreD)), durD) }
      : { cote: 'gauche', place: Math.min(Math.max(min, Math.min(l, libreG)), durG), x0: o0 - 6 - Math.min(Math.max(min, Math.min(l, libreG)), durG), x1: o1 };
  };

  for (const { c, p } of places) {
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
    const marque = (tropPetite && (vueLarge || !brassin)) || pastilleVente || (deriveSansMontant(c) && !brassin) || !!c.conditionne || !!c.brassinLie;
    /* le caddie d'un brassin : son nom vient au toucher en 3 mois, 6 mois et An ; en 6 semaines il le porte */
    const avecLibelle = marque && !(deriveSansMontant(c) && !brassin) && !(c.brassinLie && vueLarge);
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
      const centre = auJour ? gauche + w / 2 : (p.a + 0.5) * largeurColonne;
      gauche = centre - 14;
      o0 = gauche; o1 = centre + 14;
    }
    const objet: Candidat = { cote: 'dedans', place: 0, x0: o0, x1: o1 };
    const dedans = (ok: boolean): Candidat[] => (!marque && ok ? [{ cote: 'dedans', place: w - 16, x0: o0, x1: o1 }] : []);
    let choix: { ligne: number; c: Candidat };
    if (marque && !avecLibelle) choix = poser([[objet]], objet);
    else {
      const dedansDuree = dedans(w - 16 >= labNom + dureeMin);
      const dedansEntier = dedans(w - 16 >= labNom);
      const entiers = aCote(o0, o1, lab), courts = labCourt < lab ? aCote(o0, o1, labCourt) : [], noms = labNom < labCourt ? aCote(o0, o1, labNom) : [];
      /* n° 26 : nom et montant ensemble d'abord ; le nom seul en tête (montant dessous) seulement si ensemble ils seraient coupés */
      const deux = deuxNom > 0 && deuxNom < labNom ? aCote(o0, o1, deuxNom, 'nom') : [];
      if (!deux.length && deuxSeul > 0 && deuxSeul < labNom) deux.push(...aCote(o0, o1, deuxSeul, 'nomSeul'));
      /* une proposition garde son nom à côté (pointillé lisible) ; un brassin garde le sien dedans, avec sa durée (as/p-repos) */
      const premier = c.proposition ? [...entiers, ...dedansDuree] : [...dedansDuree, ...entiers];
      /* CRITIQUE-5 n° 1 et 23 : un brassin dont la durée entière ne tient pas sur une ligne la garde sur deux, hors paysage (as/cap/p-repos :
         « Blonde d'automne −148 », puis « J0 / 28 ») : « Saison de ferme −137 », puis « pas brassée · prête le 15 déc. » */
      const deuxDuree = !paysage && formes.length && !lie ? aCote(o0, o1, Math.ceil(Math.max(labNom - 6, largeurTexte(formes[0], 500))) + 8, 'duree') : [];
      /* CRITIQUE-6 n° 6 : « Commande groupée » puis « de malt −540 » quand le nom et son montant n'ont la place d'aucun côté sur une ligne
         (hors paysage : une ligne de 20 px ne porte pas deux lignes de texte) ; le nom n'est raccourci que si même ainsi la place manque */
      const cp = !paysage && !lie && !formes.length ? couperNom(texteVu(c), montantBarre(c)) : null;
      const coupe = cp && cp.largeur + 8 < labNom ? aCote(o0, o1, cp.largeur + 8, 'coupe') : [];
      /* la coupe ne passe jamais devant une ligne entière : tant qu'un côté a la place du nom sur une ligne, une ligne neuve la porte */
      const uneLigne = premier.length + deuxDuree.length + courts.length + noms.length + dedansEntier.length + deux.length > 0;
      /* CRITIQUE-6, doute Lier (m390-49a) : la pastille « Blonde d’automne » n'a la place d'aucun côté de « Hotte −900 » : elle débordait de
         l'écran. Le nom et le montant restent entiers ; le lien se lit au badge de la barre, au message « Liée à … » et au détail */
      const labSansLie = lie ? Math.ceil(largeurTexte(texteVu(c), 600) + (montantBarre(c) ? largeurTexte(montantBarre(c) as string, 700) + 6 : 0)) + 6 : 0;
      const sansPastille = lie && !uneLigne ? aCote(o0, o1, labSansLie).map(k => ({ ...k, sansLie: true })) : [];
      const paliers = uneLigne ? [premier, deuxDuree, courts, noms, dedansEntier, deux] : sansPastille.length ? [sansPastille] : [coupe];
      /* aucune ligne ouverte n'a la place : une ligne libre au-dessous, où le nom tient entier ; sinon (la piste est trop étroite) au plus large */
      const neuve = premier[0] ?? deuxDuree[0] ?? courts[0] ?? noms[0] ?? dedansEntier[0] ?? deux[0] ?? sansPastille[0] ?? coupe[0] ?? auPlusLarge(o0, o1, labNom, min);
      choix = poser(paliers, neuve);
    }
    const { ligne, c: k } = choix;
    const emprise: [number, number] = [k.x0, k.x1];
    (lignes[ligne] ||= []).push(emprise);
    emprises.set(c.id, { emprise, o0, o1, lab, labCourt, labNom, w, marque, dureeMin, formes });
    const leCote = marque && !avecLibelle ? 'dedans' : k.cote;
    items.push({ chose: c, a: p.a, b: p.b, gauche, largeur: marque ? 28 : w, ligne, marque, petite: marque && vueLarge, avecLibelle, duree: null, cote: leCote, place: k.place, deuxLignes: k.deux ?? false, ...(k.sansLie ? { sansLie: true } : {}) });
  }

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
        const precedent = Math.max(0, ...autres.filter(([, b]) => b <= e.o0).map(([, b]) => b + 6));
        d.place = Math.max(d.place, e.o0 - 6 - Math.max(e.o0 - 6 - e.lab, precedent));
        e.emprise[0] = e.o0 - 6 - d.place;
      }
    }
  }
  /* « J7 / 28 · prête 7 déc. » à côté du nom s'il tient entier, sinon « J7 / 28 » ; jamais coupé (n° 30) ; sinon il vit dans la barre */
  for (const d of items) {
    const e = emprises.get(d.chose.id);
    if (!e || e.marque || !e.formes.length || d.cote === 'dedans' || d.deuxLignes) continue;
    d.duree = d.place >= e.lab - 4 ? e.formes[0] : e.formes.length > 1 && d.place >= e.labCourt - 4 ? e.formes[e.formes.length - 1] : null;
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
    const texte = vueLarge ? null : texteCaddie(d.chose, j);
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
    caddies.push({ chose: d.chose, jour: j.jour, centre, ligne: pose.ligne, texte: texteVuCaddie, cote: pose.c.cote === 'gauche' ? 'gauche' : 'droite', place: pose.c.place, ...(deuxCaddie ? { lignes: deuxCaddie } : {}) });
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

export interface Pastille { texte: string; lecture: string; part: number; solde: number | null; debut: string; fin: string }
/** E23 : « Ventes, confirmé de S47 à S52 : 2 choses, solde +900 ». Ce qui n'est pas chiffré est dit en mots, jamais compté 0. */
export function pastille(rangee: IdRangee, choses: readonly ChoseCalendrier[], colonnes: readonly Colonne[]): Pastille {
  /* le caddie d'un brassin répète une part de son budget : la pastille ne le recompte pas */
  const dedans = choses.filter(c => !c.brassinLie && positionDans(colonnes, c));
  const fermes = dedans.filter(c => !c.probable && !c.proposition);
  const probables = dedans.length - fermes.length;
  const chiffrees = fermes.filter(c => c.centimes !== undefined);
  /* CRITIQUE-5 n° 19 (E23) : un brassin posé sans budget (`coutAVenir`) ou au montant incomplet (`partiel`) a un coût à venir, dit en mots */
  const aVenir = fermes.filter(c => c.coutAVenir || c.partiel);
  const sansMontant = fermes.filter(c => c.centimes === undefined && !c.coutAVenir && !c.partiel).length;
  const solde = chiffrees.length ? chiffrees.reduce((s, c) => s + (c.centimes as number), 0) : null;
  const premier = colonnes[0]?.etiquette ?? '', dernier = colonnes[colonnes.length - 1]?.etiquette ?? '';
  const n = fermes.length;
  const nChoses = (k: number) => `${k} chose${k > 1 ? 's' : ''}`;
  const morceaux = [`${nomRangee(rangee)}, confirmé de ${premier} à ${dernier} : ${nChoses(n)}`];
  const jours = fermes.reduce((s, c) => s + (c.joursActifs ?? 0), 0);
  if (rangee === 'activites') {
    if (jours) morceaux.push(`${jours} j`);
  } else if (solde !== null) morceaux.push(`solde ${francsSignes(solde)}`);
  else if (n && !aVenir.length) morceaux.push('solde non renseigné');
  if (aVenir.length) morceaux.push('coût à venir');
  if (sansMontant && solde !== null) morceaux.push(`${sansMontant} sans montant`);
  if (probables) morceaux.push(`${probables} probable${probables > 1 ? 's' : ''}`);
  /* le nombre dit ce qu'on voit : toutes les choses de la fenêtre, probables comprises (une étiquette « 4 » devant 5 barres se contredit) ;
     jamais un chiffre seul (« 1 ») : « 1 chose », ou « coût à venir » quand c'est le coût qui manque */
  const nbVu = dedans.length;
  const enMots = aVenir.length ? 'coût à venir' : nbVu ? nChoses(nbVu) : '';
  const texte = rangee === 'activites' ? (jours ? `${jours} j` : nbVu ? nChoses(nbVu) : '')
    : solde !== null ? `${francsSignes(solde)}${aVenir.length ? ' + coût à venir' : ''}` : enMots;
  return { texte, lecture: morceaux.join(', '), part: solde === null ? 0 : Math.abs(solde), solde, debut: premier, fin: dernier };
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
}

/** Paysage : la largeur estimée du titre (carré +, nom, œil, pastille), posé sur la première ligne. */
function largeurTitre(nom: string, texteAPart: string): number {
  return Math.ceil(20 + 6 + nom.length * 8.4 + 6 + 24 + 6 + (texteAPart ? Math.max(52, texteAPart.length * 8.4 + 20) : 0) + 10);
}
const largeurRenvoi = (texte: string): number => Math.ceil(largeurTexte(texte, 700)) + 36;

/* CRITIQUE-4 n° 13 a (E33, D-200) : la bulle « S51 · 14 déc. · lâcher ici » ne se pose jamais sur un nom. Au-dessus de la colonne visée (le
   pouce couvre le dessous), sinon dessous (sa maquette, as/cap/p-f1a-pendant), décalée de côté si un nom, un titre ou une pastille est là ;
   toujours dans la frise. Mesurée après le rendu, dans le repère de sa piste. */
const OBSTACLES_BULLE = '.cal-lbl-t, .cal-lbl-m, .cal-lbl-j, .cal-lie, .cal-nom, .cal-pastille-p, .cal-conf, .cal-renvoi, .cal-cachees, .cal-vide, .cal-plus, .cal-oeil, .cal-duree';
function BulleIci({ texte, x, haut, bas, largeur, choseId }: { texte: string; x: number; haut: number; bas: number; largeur: number; choseId: string }) {
  const el = React.useRef<HTMLSpanElement | null>(null);
  React.useLayoutEffect(() => {
    const b = el.current;
    const piste = b?.parentElement;
    if (!b || !piste) return;
    const w = b.offsetWidth || Math.ceil(largeurTexte(texte, 400)) + 18, h = b.offsetHeight || 24;
    const borne = (cx: number) => Math.max(w / 2 + 2, Math.min(largeur - w / 2 - 2, cx));
    const poser = (cx: number, top: number) => { b.style.left = `${Math.round(borne(cx) - w / 2)}px`; b.style.top = `${Math.round(top)}px`; };
    const dessus = haut - h - 4, dessous = bas + 4;
    poser(x, dessus);
    if (!b.offsetWidth) return;
    const p = piste.getBoundingClientRect();
    const frise = piste.closest('[data-frise]') ?? document;
    const tenue = frise.querySelector<HTMLElement>(`[data-chose="${choseId.replace(/"/g, '')}"]`);
    const obstacles = [...frise.querySelectorAll<HTMLElement>(OBSTACLES_BULLE), ...(tenue ? [tenue] : [])]
      .filter(o => !b.contains(o))
      .map(o => o.getBoundingClientRect())
      .filter(r => r.width > 0 && r.height > 0);
    const libre = (cx: number, top: number) => {
      const g = p.left + borne(cx) - w / 2, t = p.top + top;
      return !obstacles.some(r => g < r.right + 2 && g + w > r.left - 2 && t < r.bottom + 2 && t + h > r.top - 2);
    };
    for (let i = 0; i <= 16; i++) {
      const dx = (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 24;
      for (const top of [dessus, dessous]) if (libre(x + dx, top)) { poser(x + dx, top); return; }
    }
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
  const { items, lignes, caddies, renvois: posRenvois } = React.useMemo(
    () => disposer(montrees, colonnes, largeurColonne, largeur, {
      /* CRITIQUE-5 n° 14 : partout (téléphone, paysage, 1280), un nom reste entier tant que la place existe, quitte à ouvrir une ligne */
      reserveDroite, zoneTitre, vueLarge, renvois: largeursRenvois, paysage, lieCourt
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [montrees, colonnes, largeurColonne, largeur, reserveDroite, zoneTitre, paysage, vueLarge, cleRenvois, lieCourt]
  );
  const hauteurLane = lignes === 0 ? 0 : lignes * mesures.ligne + 2;
  const fantome = drag ? items.find(i => i.chose.id === drag.id) : undefined;
  const auJour = colonnes.length > 0 && ecartJours(colonnes[0].debut, colonnes[0].fin) >= 14;
  const parts = partMax > 0 ? Math.max(8, Math.round((p.part / partMax) * 100)) : 0;

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
          <button type="button" className="cal-oeil" aria-pressed={masquee} aria-label={masquee ? `Afficher ${nom}` : `Masquer ${nom}`} onClick={() => props.onBasculerMasque(id)}>
            {masquee ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        )}
        {masquee && cause === 'oeil' ? (
          <button type="button" className="cal-cachees" aria-label={`Afficher ${nom}${cachees ? ` : ${texteCachees}` : ''}`} onClick={() => props.onBasculerMasque(id)}>
            {texteCachees || 'masquée'}
          </button>
        ) : masquee ? (
          <span className="cal-cachees-f">{texteCachees}</span>
        ) : vide ? (
          <span className="cal-vide">vide</span>
        ) : (
          <span className="cal-pastille" role="img" aria-label={p.lecture} data-pastille={id}>
            <span className="cal-pastille-p">
              <i className="cal-pastille-fond" style={{ width: `${parts}%` }} />
              <span className="cal-pastille-t">{p.texte}</span>
            </span>
            <span className="cal-conf">confirmé {p.debut}–{p.fin}</span>
          </span>
        )}
      </header>
      {hauteurLane > 0 && (
        <div className="cal-lane" style={{ height: hauteurLane }} data-lane={id}>
          {fantome && !fantome.petite && (
            <i className="cal-fantome cal-pointille" aria-hidden="true" data-fantome style={{ left: fantome.gauche, width: fantome.largeur, top: fantome.ligne * mesures.ligne + 2, height: mesures.barre }} />
          )}
          {items.map(d => {
            const c = d.chose;
            const top = d.ligne * mesures.ligne + 2;
            const surDrag = drag && drag.id === c.id;
            if (d.marque) {
              const commeBarre = !d.petite;
              return (
                <Marque
                  key={c.id} chose={c} centre={d.gauche + 14} haut={top} hauteur={Math.min(28, mesures.barre + 2)} largeurColonne={auJour ? 0 : largeurColonne}
                  epinglee={epingles.includes(c.id)} etoilee={etoiles.includes(c.id)} selectionnee={selectionId === c.id} menuOuvert={menuId === c.id} lieCourt={lieCourt}
                  libelle={d.avecLibelle ? { cote: d.cote === 'gauche' ? 'gauche' : 'droite', place: d.place, deux: d.deuxLignes, ...(c.brassinLie ? { texte: c.titre } : {}), ...(d.sansLie ? { sansLie: true } : {}) } : undefined}
                  decalage={surDrag && drag.mode === 'glisse' ? drag.k * largeurColonne : 0}
                  bornes={commeBarre ? [-d.a, colonnes.length - 1 - d.a] : undefined}
                  onToucher={props.barre.onToucher} onSixSemaines={props.onSixSemaines}
                  {...(commeBarre ? { onAppuiLong: props.barre.onAppuiLong, onGlisse: props.barre.onGlisse, onLacheGlisse: props.barre.onLacheGlisse, onRefus: (ch: ChoseCalendrier, raison: string) => props.barre.onRefus(ch, raison) } : {})}
                />
              );
            }
            return (
              <Barre
                key={c.id} chose={c} gauche={d.gauche} largeur={d.largeur} haut={top} hauteur={mesures.barre} cote={d.cote} placeEtiquette={d.place} dureeACote={d.duree} deuxLignes={d.deuxLignes} sansLie={d.sansLie}
                largeurColonne={auJour ? 0 : largeurColonne} bornes={[-d.a, colonnes.length - 1 - d.a]}
                epinglee={epingles.includes(c.id)} etoilee={etoiles.includes(c.id)} selectionnee={selectionId === c.id} menuOuvert={menuId === c.id} lieCourt={lieCourt}
                decalage={surDrag && drag.mode === 'glisse' ? drag.k * largeurColonne : 0}
                allongement={surDrag && drag.mode === 'bord' ? (drag.jours * largeurColonne) / 7 : 0}
                etiquetteDuree={etiquetteDuree && etiquetteDuree.id === c.id ? etiquetteDuree.texte : undefined}
                {...props.barre}
              />
            );
          })}
          {caddies.map(k => {
            const top = k.ligne * mesures.ligne + 2 + Math.max(0, (mesures.barre - 18) / 2);
            const aria = `Commander avant le ${jourLisible(k.jour)} · ${k.texte ?? k.chose.titre}`;
            return (
              <React.Fragment key={`cmd-${k.chose.id}`}>
                <span data-jalon="commander" data-caddie={k.chose.id} className="cal-commander" aria-label={aria} role="img" style={{ left: k.centre - 9, top }}>
                  <ShoppingCart size={12} aria-hidden="true" />
                </span>
                {k.texte && (
                  <span
                    className={`cal-lbl cal-lbl-${k.cote} cal-lbl-caddie${k.lignes ? ' cal-lbl-2n' : ''}`} aria-hidden="true"
                    style={{ ...(k.lignes ? { top: k.ligne * mesures.ligne, height: mesures.barre + 4 } : { top: k.ligne * mesures.ligne + 2, height: mesures.barre }), maxWidth: Math.max(40, k.place), ...(k.cote === 'droite' ? { left: k.centre + CADDIE_PX / 2 + 6 } : { right: `calc(100% - ${k.centre - CADDIE_PX / 2}px + 6px)` }) }}
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
            if (!pos) return null;
            return (
              <button
                key={r.chose.id} type="button" className="cal-renvoi" data-renvoi={r.chose.id}
                style={{ left: pos.x, top: pos.ligne * mesures.ligne + 2 + Math.max(0, (mesures.barre - 24) / 2), maxWidth: largeursRenvois[i] }}
                onClick={() => props.onRenvoi?.(r.chose)}
              >
                {r.texte}<ChevronRight size={14} aria-hidden="true" />
              </button>
            );
          })}
          {drag && ici && fantome && (
            <BulleIci
              texte={ici} x={(fantome.a + drag.k + 0.5) * largeurColonne} largeur={largeur} choseId={fantome.chose.id}
              haut={fantome.ligne * mesures.ligne + 2} bas={fantome.ligne * mesures.ligne + 2 + mesures.barre}
            />
          )}
        </div>
      )}
      {props.detail}
    </section>
  );
};

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
