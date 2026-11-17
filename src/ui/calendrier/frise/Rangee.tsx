import React from 'react';
import { ChevronRight, Eye, EyeOff, Plus, ShoppingCart } from 'lucide-react';
import { ajouterJours, ecartJours, estMarque, etiquetteS, francsSignes, jourLisible, nomRangee, type ChoseCalendrier, type JalonBrassin, type Rangee as IdRangee } from '../../../domain/calendrier';
import { Barre, type BarreProps, type CoteEtiquette } from './Barre';
import { CLASSE_TEINTE, Marque, dureeVue } from './Marque';

/**
 * Une rangée de la frise (E20 à E23) : son titre à gauche, juste au-dessus de ses barres, le carré de couleur qui porte le + blanc (E21),
 * la pastille r2-c (E23), l'œil qui masque (E22). Sa mise en page est une fonction pure (`disposer`) : une chose se pose sur la première
 * ligne où ni elle ni son nom ne en touchent une autre (E26 : deux ventes de la même semaine ne se chevauchent pas).
 *
 * Le nom (CRITIQUE-3 n° 31) : entier dans la barre s'il y tient, sinon entier du côté libre (E24), sur une ligne déjà ouverte ; puis, hors
 * paysage, sur deux lignes à côté de la barre ; sinon une ligne de plus. Il n'est raccourci (jamais sous son montant et dix lettres) qu'en
 * paysage, où la rangée reste compacte (E10, D-174 : 48 px au plus la rangée médiane). Rien ne se pose sous le + volant (`reserveDroite`).
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
export const MESURES_PAYSAGE: Mesures = { ligne: 21, barre: 19, titre: 21 };

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
  /** Le texte « J7 / n · prête le … » tient à côté du nom d'un brassin. */
  duree: boolean;
  cote: CoteEtiquette;
  place: number;
  /** Le nom passe sur deux lignes à côté de la barre (n° 31). */
  deuxLignes: boolean;
}

/** Le caddie d'un brassin (son jalon « commander »), posé sans chevauchement, avec son nom en 6 semaines (n° 19, n° 22). */
export interface PlaceCaddie { chose: ChoseCalendrier; jour: string; centre: number; ligne: number; texte: string | null; cote: 'gauche' | 'droite'; place: number }

const CHAR_PX = 7.6;
const CADDIE_PX = 22;
const texteVu = (c: ChoseCalendrier): string => (c.brassinLie ? c.titre : c.etiquette ?? c.titre);
const montantTexte = (c: ChoseCalendrier): string => (c.rangee === 'activites' && c.joursActifs ? `${c.joursActifs} j` : c.centimes !== undefined ? francsSignes(c.centimes) : '');

export const largeurEtiquette = (c: ChoseCalendrier, avecDuree = true): number => {
  const m = montantTexte(c), d = avecDuree ? dureeVue(c) : null, l = c.lie?.texte;
  return Math.ceil((texteVu(c).length + (m ? m.length + 1 : 0) + (d ? d.length + 2 : 0)) * CHAR_PX + (l ? l.length * CHAR_PX + 22 : 0)) + 4;
};
/** Le moins qu'une étiquette garde : son montant entier et dix lettres de son nom (« Facture Ca… +1 200 »), jamais « F. ». */
export const largeurEtiquetteMin = (c: ChoseCalendrier): number => {
  const m = montantTexte(c);
  return Math.ceil((Math.min(texteVu(c).length, 10) + (m ? m.length + 1 : 0)) * CHAR_PX) + 10;
};

/** Paysage seulement (D-174) : six lettres et le montant entier, plutôt qu'une ligne de plus ; le nom entier reste au toucher et au lecteur. */
const largeurEtiquetteCompacte = (c: ChoseCalendrier, lettres: number): number => {
  const m = montantTexte(c);
  return Math.ceil((Math.min(texteVu(c).length, lettres) + (m ? m.length + 1 : 0)) * CHAR_PX) + 4;
};

/** Une sortie dérivée d'un brassin dont le montant n'est pas renseigné : une icône, son nom vient au toucher (CAL-INFO-TROP). */
const deriveSansMontant = (c: ChoseCalendrier): boolean => c.source.genre === 'prevision-brassin' && c.centimes === undefined;
/** Un brassin de la rangée Brassins (ni ses courses, ni un brassin conditionné, qui est un fait marqué à sa date). */
const estBrassin = (c: ChoseCalendrier): boolean => c.rangee === 'brassins' && !c.brassinLie && !c.conditionne;

/** « Malt, houblon · Stout maison » : les articles qui manquent (lot A, `articles`), sinon « Courses ». */
export function texteCaddie(c: ChoseCalendrier, j: JalonBrassin): string {
  const articles = (j as JalonBrassin & { articles?: unknown }).articles;
  const liste = Array.isArray(articles) ? articles.filter((x): x is string => typeof x === 'string' && !!x.trim()) : [];
  const quoi = liste.length ? liste.map((x, i) => (i === 0 ? x.charAt(0).toLocaleUpperCase('fr') + x.slice(1) : x.toLocaleLowerCase('fr'))).join(', ') : 'Courses';
  return `${quoi} · ${c.titre}`;
}

export interface OptionsDisposer {
  /** Largeur, à droite, où aucun nom ne se pose (le + volant, D-135). */
  reserveDroite?: number;
  /** Paysage : la largeur que le titre occupe sur la première ligne, à gauche. */
  zoneTitre?: number;
  /** Paysage, et le téléphone en 6 semaines : un nom se raccourcit jusqu'à son minimum plutôt qu'ouvrir une ligne (D-174, E43), puis
   *  s'allonge dans la place restée libre. */
  compact?: boolean;
  /** Avec `compact` : essayer d'abord le nom entier du côté libre (portrait) ; sinon la plus petite emprise d'abord (paysage). */
  entierDabord?: boolean;
  /** Avec `compact` : les lettres que garde un nom raccourci (6 en paysage, 10 au téléphone), toujours avec son montant. */
  lettresMin?: number;
  /** 3 mois, 6 mois, An : une chose de moins de 24 px devient une marque, et son appui long ouvre les 6 semaines. */
  vueLarge?: boolean;
  /** Les largeurs des renvois posés en bout de rangée (E32). */
  renvois?: readonly number[];
}

interface Candidat { cote: CoteEtiquette; place: number; x0: number; x1: number; deux?: boolean }

/** Pose les choses d'une rangée sans qu'une barre ni un nom en touche un autre. Pure : `largeur` et `largeurColonne` viennent de la mesure. */
export function disposer(choses: readonly ChoseCalendrier[], colonnes: readonly Colonne[], largeurColonne: number, largeur: number, options: OptionsDisposer = {}): { items: Disposition[]; lignes: number; caddies: PlaceCaddie[]; renvois: Array<{ ligne: number; x: number }> } {
  const reserve = Math.max(0, options.reserveDroite ?? 0);
  const compact = !!options.compact, vueLarge = !!options.vueLarge;
  const entierDabord = !!options.entierDabord, lettres = options.lettresMin ?? 6;
  const bord = largeur - reserve;
  const places = choses.flatMap(c => { const p = positionDans(colonnes, c); return p ? [{ c, p }] : []; })
    .sort((x, y) => x.p.a - y.p.a || (y.p.b - y.p.a) - (x.p.b - x.p.a) || x.c.id.localeCompare(y.c.id));
  const lignes: Array<Array<[number, number]>> = [];
  if (options.zoneTitre && options.zoneTitre > 0) lignes.push([[-1000, options.zoneTitre]]);
  const items: Disposition[] = [];
  const emprises = new Map<string, { emprise: [number, number]; o0: number; o1: number; lab: number; w: number; marque: boolean }>();
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
  /** Les places d'un nom à côté d'un objet [o0, o1] : entier (droite, gauche), puis sur deux lignes (hors paysage) ou raccourci (paysage). */
  const cotes = (o0: number, o1: number, lab: number, min: number): { entiers: Candidat[]; repli: Candidat[]; meilleur: Candidat } => {
    const libreG = o0 - 8, libreD = bord - o1 - 8;
    const droite = (place: number, deux = false): Candidat => ({ cote: 'droite', place, x0: o0, x1: o1 + 6 + place, deux });
    const gauche = (place: number, deux = false): Candidat => ({ cote: 'gauche', place, x0: o0 - 6 - place, x1: o1, deux });
    const entiers = [...(libreD >= lab ? [droite(lab)] : []), ...(libreG >= lab ? [gauche(lab)] : [])];
    const repli: Candidat[] = [];
    if (compact) {
      if (libreD >= min) repli.push(droite(Math.min(lab, libreD)));
      if (libreG >= min) repli.push(gauche(Math.min(lab, libreG)));
    } else {
      const moitie = Math.max(min, Math.ceil(lab / 2) + 14);
      if (libreD >= moitie) repli.push(droite(Math.min(lab, libreD), true));
      if (libreG >= moitie) repli.push(gauche(Math.min(lab, libreG), true));
    }
    const meilleur = entiers[0] ?? (libreD >= libreG ? droite(Math.max(min, Math.min(lab, libreD))) : gauche(Math.max(min, Math.min(lab, libreG))));
    return { entiers, repli, meilleur };
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
    /* le caddie d'un brassin : son nom vient au toucher en 3 mois, 6 mois et An ; en 6 semaines il le porte (« Malt, houblon · Stout maison ») */
    const avecLibelle = marque && !(deriveSansMontant(c) && !brassin) && !(c.brassinLie && vueLarge);
    const lab = largeurEtiquette(c), min = Math.min(lab, largeurEtiquetteMin(c));
    /* dans la barre, le nom et le montant suffisent : la durée y a sa place à droite, entière ou courte (as/p-repos) */
    const labDedans = largeurEtiquette(c, false);
    let o0 = gauche, o1 = gauche + w;
    if (marque) {
      const centre = auJour ? gauche + w / 2 : (p.a + 0.5) * largeurColonne;
      gauche = centre - 14;
      o0 = gauche; o1 = centre + 14;
    }
    const objet: Candidat = { cote: 'dedans', place: 0, x0: o0, x1: o1 };
    let choix: { ligne: number; c: Candidat };
    if (marque && !avecLibelle) choix = poser([[objet]], objet);
    else if (compact) {
      /* paysage (E10, D-174) : d'abord la plus petite emprise (le nom entier dans la barre, ou six lettres et le montant contre elle), pour
         ne pas ouvrir de ligne ; le nom s'allonge ensuite dans la place laissée libre (plus bas) */
      const mini = Math.min(lab, largeurEtiquetteCompacte(c, lettres));
      const dedansEntier: Candidat[] = !marque && w - 16 >= labDedans ? [{ cote: 'dedans', place: w - 16, x0: o0, x1: o1 }] : [];
      const dedansCourt: Candidat[] = !marque && w - 16 >= mini ? [{ cote: 'dedans', place: w - 16, x0: o0, x1: o1 }] : [];
      const libreG = o0 - 8, libreD = bord - o1 - 8;
      const cotesMini: Candidat[] = [
        ...(libreD >= mini ? [{ cote: 'droite' as const, place: mini, x0: o0, x1: o1 + 6 + mini }] : []),
        ...(libreG >= mini ? [{ cote: 'gauche' as const, place: mini, x0: o0 - 6 - mini, x1: o1 }] : [])
      ];
      const { entiers, meilleur } = cotes(o0, o1, lab, min);
      /* au téléphone en portrait : le nom entier du côté libre d'abord (E24), raccourci seulement plutôt qu'une ligne de plus (E43) */
      const paliers = entierDabord ? [dedansEntier, entiers, cotesMini, dedansCourt] : [dedansEntier, cotesMini, dedansCourt];
      const neuve = dedansEntier[0] ?? (entierDabord ? entiers[0] : undefined) ?? cotesMini[0] ?? dedansCourt[0] ?? meilleur;
      choix = poser(paliers, neuve);
    } else {
      const { entiers, repli, meilleur } = cotes(o0, o1, lab, min);
      const dedansEntier: Candidat[] = !marque && w - 16 >= labDedans ? [{ cote: 'dedans', place: w - 16, x0: o0, x1: o1 }] : [];
      const dedansCourt: Candidat[] = !marque && w - 16 >= min ? [{ cote: 'dedans', place: w - 16, x0: o0, x1: o1 }] : [];
      /* une proposition garde son nom à côté (pointillé lisible) ; un brassin long garde le sien dedans, avec sa durée */
      const premier = c.proposition ? [...entiers, ...dedansEntier] : [...dedansEntier, ...entiers];
      /* une ligne neuve : le nom entier ; sinon (la place manque même seule) sur deux lignes, ou dans la barre, ou au plus large */
      const neuve = premier[0] ?? repli[0] ?? dedansCourt[0] ?? meilleur;
      choix = poser([premier, repli], neuve);
    }
    const { ligne, c: k } = choix;
    const emprise: [number, number] = [k.x0, k.x1];
    (lignes[ligne] ||= []).push(emprise);
    emprises.set(c.id, { emprise, o0, o1, lab, w, marque });
    const leCote = marque && !avecLibelle ? 'dedans' : k.cote;
    items.push({ chose: c, a: p.a, b: p.b, gauche, largeur: marque ? 28 : w, ligne, marque, petite: marque && vueLarge, avecLibelle, duree: false, cote: leCote, place: k.place, deuxLignes: !!k.deux });
  }

  /* paysage : chaque nom raccourci s'allonge dans la place libre de sa ligne (jusqu'à l'objet suivant, jamais sous le + volant), d'abord
     ceux de droite, puis ceux de gauche ; un nom qui tiendrait mieux dans sa barre y retourne */
  if (compact) {
    for (const passe of ['droite', 'gauche'] as const) {
      for (const d of items) {
        const e = emprises.get(d.chose.id);
        if (!e || d.cote !== passe || d.place >= e.lab) continue;
        const autres = (lignes[d.ligne] ?? []).filter(x => x !== e.emprise);
        if (passe === 'droite') {
          const suivant = Math.min(bord, ...autres.filter(([a]) => a >= e.o1).map(([a]) => a - 6));
          const x1 = Math.min(e.o1 + 6 + e.lab, suivant);
          d.place = Math.max(d.place, x1 - e.o1 - 6);
          e.emprise[1] = e.o1 + 6 + d.place;
        } else {
          const precedent = Math.max(0, ...autres.filter(([, b]) => b <= e.o0).map(([, b]) => b + 6));
          const x0 = Math.max(e.o0 - 6 - e.lab, precedent);
          d.place = Math.max(d.place, e.o0 - 6 - x0);
          e.emprise[0] = e.o0 - 6 - d.place;
        }
        if (!e.marque && e.w - 16 > d.place && d.place < e.lab) { d.cote = 'dedans'; d.place = e.w - 16; e.emprise[0] = e.o0; e.emprise[1] = e.o1; }
      }
    }
  }
  /* « J7 / 28 · prête 7 déc. » ne se montre à côté que s'il tient en entier (jamais coupé, n° 30) ; sinon il vit dans la barre */
  for (const d of items) {
    const e = emprises.get(d.chose.id);
    d.duree = !!e && !d.marque && !!dureeVue(d.chose) && d.cote !== 'dedans' && !d.deuxLignes && d.place >= e.lab - 4;
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
    let pose: { ligne: number; c: Candidat };
    if (!texte) pose = poser([[{ cote: 'dedans', place: 0, x0: o0, x1: o1 }]], { cote: 'dedans', place: 0, x0: o0, x1: o1 }, d.ligne);
    else {
      const lab = Math.ceil(texte.length * CHAR_PX) + 4, min = Math.min(lab, Math.ceil(Math.min(texte.length, 14) * CHAR_PX) + 10);
      const { entiers, repli, meilleur } = cotes(o0, o1, lab, min);
      /* paysage : sans place pour son nom sur une ligne ouverte, le caddie seul (son nom au toucher) plutôt qu'une ligne de plus */
      const seul: Candidat = { cote: 'dedans', place: 0, x0: o0, x1: o1 };
      pose = poser(compact ? [entiers, repli, [seul]] : [entiers], entiers[0] ?? meilleur, d.ligne);
      if (pose.c.deux) pose = { ...pose, c: { ...pose.c, deux: false } };
    }
    (lignes[pose.ligne] ||= []).push([pose.c.x0, pose.c.x1]);
    caddies.push({ chose: d.chose, jour: j.jour, centre, ligne: pose.ligne, texte: pose.c.cote === 'dedans' ? null : texte, cote: pose.c.cote === 'gauche' ? 'gauche' : 'droite', place: pose.c.place });
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
  const sansMontant = fermes.length - chiffrees.length;
  const solde = chiffrees.length ? chiffrees.reduce((s, c) => s + (c.centimes as number), 0) : null;
  const premier = colonnes[0]?.etiquette ?? '', dernier = colonnes[colonnes.length - 1]?.etiquette ?? '';
  const n = fermes.length;
  const morceaux = [`${nomRangee(rangee)}, confirmé de ${premier} à ${dernier} : ${n} chose${n > 1 ? 's' : ''}`];
  const jours = fermes.reduce((s, c) => s + (c.joursActifs ?? 0), 0);
  if (rangee === 'activites') {
    if (jours) morceaux.push(`${jours} j`);
  } else if (solde !== null) morceaux.push(`solde ${francsSignes(solde)}`);
  else if (n) morceaux.push('solde non renseigné');
  if (sansMontant && solde !== null) morceaux.push(`${sansMontant} sans montant`);
  if (probables) morceaux.push(`${probables} probable${probables > 1 ? 's' : ''}`);
  /* le nombre dit ce qu'on voit : toutes les choses de la fenêtre, probables comprises (une étiquette « 4 » devant 5 barres se contredit) */
  const nbVu = dedans.length;
  const texte = rangee === 'activites' ? (jours ? `${jours} j` : nbVu ? `${nbVu}` : '') : solde !== null ? francsSignes(solde) : nbVu ? `${nbVu}` : '';
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
const largeurRenvoi = (texte: string): number => Math.ceil(texte.length * CHAR_PX) + 34;

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
  const { items, lignes, caddies, renvois: posRenvois } = React.useMemo(
    () => disposer(montrees, colonnes, largeurColonne, largeur, {
      reserveDroite, zoneTitre, vueLarge, renvois: largeursRenvois,
      /* compact : le paysage (E10), et le téléphone en 6 semaines au repos (E43 : 6 rangées d'un coup d'œil) ; en 3 mois et au 1280, les
         noms restent entiers, sur deux lignes au besoin (n° 31) */
      compact: paysage || (!vueLarge && largeur < 700), entierDabord: !paysage, lettresMin: paysage ? 6 : 10
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [montrees, colonnes, largeurColonne, largeur, reserveDroite, zoneTitre, paysage, vueLarge, cleRenvois]
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
                  epinglee={epingles.includes(c.id)} etoilee={etoiles.includes(c.id)} selectionnee={selectionId === c.id} menuOuvert={menuId === c.id}
                  libelle={d.avecLibelle ? { cote: d.cote === 'gauche' ? 'gauche' : 'droite', place: d.place, ...(c.brassinLie ? { texte: c.titre } : {}) } : undefined}
                  decalage={surDrag && drag.mode === 'glisse' ? drag.k * largeurColonne : 0}
                  bornes={commeBarre ? [-d.a, colonnes.length - 1 - d.a] : undefined}
                  onToucher={props.barre.onToucher} onSixSemaines={props.onSixSemaines}
                  {...(commeBarre ? { onAppuiLong: props.barre.onAppuiLong, onGlisse: props.barre.onGlisse, onLacheGlisse: props.barre.onLacheGlisse, onRefus: (ch: ChoseCalendrier, raison: string) => props.barre.onRefus(ch, raison) } : {})}
                />
              );
            }
            return (
              <Barre
                key={c.id} chose={c} gauche={d.gauche} largeur={d.largeur} haut={top} hauteur={mesures.barre} cote={d.cote} placeEtiquette={d.place} avecDuree={d.duree} deuxLignes={d.deuxLignes}
                largeurColonne={auJour ? 0 : largeurColonne} bornes={[-d.a, colonnes.length - 1 - d.a]}
                epinglee={epingles.includes(c.id)} etoilee={etoiles.includes(c.id)} selectionnee={selectionId === c.id} menuOuvert={menuId === c.id}
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
                    className={`cal-lbl cal-lbl-${k.cote} cal-lbl-caddie`} aria-hidden="true"
                    style={{ top: k.ligne * mesures.ligne + 2, height: mesures.barre, maxWidth: Math.max(40, k.place), ...(k.cote === 'droite' ? { left: k.centre + CADDIE_PX / 2 + 6 } : { right: `calc(100% - ${k.centre - CADDIE_PX / 2}px + 6px)` }) }}
                  ><span className="cal-lbl-t">{k.texte}</span></span>
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
            <span className="cal-ici" data-ici style={{ left: Math.max(4, Math.min(largeur - 8, (fantome.a + drag.k + 0.5) * largeurColonne)), top: fantome.ligne * mesures.ligne + 2 + mesures.barre + 2 }}>{ici}</span>
          )}
        </div>
      )}
      {props.detail}
    </section>
  );
};

/** « Livraison La Cigogne · S1 › » : le renvoi d'une vente liée à un brassin visible, quand la vente est hors de la vue (E32). */
export function texteRenvoi(c: ChoseCalendrier): string {
  return `Livraison ${c.lie?.client ?? c.titre} · ${etiquetteS(c.debut)}`;
}
