// Une ligne de la liste du Stock (maquette choisie sy/fA, barres g6 et teintes c3b) : ce que la ligne DIT, d'une seule règle.
// Fonctions pures ; l'écran (LigneStock) ne fait que les dessiner. Une donnée inconnue reste inconnue (jamais 0).
import type { StockItem } from '../../types';
import type { ArticleACommander } from '../stockLevel';
import { ECHELLES, coupeBarre, quantiteBarre, xBarre, type ClasseLigne, type InfoLigne, type TriListe } from './liste';
import { rayonDuMur, type RayonMurNom } from './murRayon';
import { statutDurabilite } from './regles';
import { nombreFr } from '../nombreAffiche';
import { Units } from '../../services/units';

/** Les six familles de la teinte c3b : 0 Malts (caramel), 1 Houblons (vert), 2 Levures (crème), 3 additifs (ardoise), 4 emballage (brun), 5 nettoyage (bleu). */
export type FamilleTeinte = 0 | 1 | 2 | 3 | 4 | 5;

const sansAccent = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function familleTeinte(item: Pick<StockItem, 'category' | 'name'>): FamilleTeinte {
  const r = rayonDuMur(item as StockItem);
  if (r === 'Malts') return 0;
  if (r === 'Houblons') return 1;
  if (r === 'Levures') return 2;
  const c = sansAccent(item.category);
  if (/^emballage/.test(c)) return 4;
  if (/^(cip|desinfectant|detergent|sols|epi|consommable)/.test(c)) return 5;
  return 3;
}

/** Le rayon d'un en-tête de groupe de la liste (« Malt », « Sucre », « Houblons », « Levure »…) ; null = autre catégorie. */
export function rayonDuGroupe(nom: string): RayonMurNom | null {
  const c = sansAccent(nom);
  if (/^(malt|sucre)/.test(c)) return 'Malts';
  if (/^houblon/.test(c)) return 'Houblons';
  if (/^levure/.test(c)) return 'Levures';
  return null;
}

/** La famille de teinte d'un en-tête de groupe, d'après sa catégorie. */
export const familleTeinteGroupe = (nom: string): FamilleTeinte => familleTeinte({ category: nom, name: nom });

/** La légende de l'ordre de chaque rayon sous son nom (celle de la maquette) ; l'ordre « par défaut » est celui du métier. */
export const LEGENDE_RAYON: Record<RayonMurNom, string> = {
  Malts: 'par couleur, du plus clair au plus foncé',
  Houblons: "par amertume, la plus forte d'abord",
  Levures: 'par date, la plus proche d’abord',
};
/** La phrase de l'en-tête de rayon suit le tri choisi (verdict 5cdcd12e n° 2) : l'ordre du métier seulement au tri par défaut. */
export const legendeRayon = (rayon: RayonMurNom, tri: TriListe = 'defaut'): string =>
  tri === 'nom' ? 'par nom, de A à Z'
    : tri === 'quantite' ? 'par quantité, la plus grande d’abord'
      : tri === 'manque' ? 'par manque, les plus à court d’abord'
        : LEGENDE_RAYON[rayon];

/** Le paragraphe du bouton ⓘ « Lire l'échelle » : une phrase par rayon. */
export const LIRE_ECHELLE: Record<RayonMurNom, string> = {
  Malts: "La barre dit la quantité en kg. De 0 à 5 kg, elle est à l'échelle : 0,5 kg se voit. Au-delà du trait, elle est resserrée (marque ⫽) : 120 kg ne fait pas 240 fois plus long, le chiffre fait foi.",
  Houblons: "La barre dit la quantité en grammes. De 0 à 250 g, elle est à l'échelle : 50 g se voit. Au-delà du trait, elle est resserrée (marque ⫽) : 1 kg ne fait pas quatre fois plus long, le chiffre fait foi.",
  Levures: "La barre dit le nombre de sachets. De 0 à 5 sachets, elle est à l'échelle : 1 sachet se voit. Au-delà du trait, elle est resserrée (marque ⫽), le chiffre fait foi.",
};

export interface BarreLigne { x: number; coupe: number | null }
/** La barre d'une ligne des trois rayons : null pour une quantité inconnue (jamais 0), nulle ou un article hors rayon. */
export function barreLigne(item: StockItem): BarreLigne | null {
  const rayon = rayonDuMur(item);
  if (!rayon) return null;
  const q = quantiteBarre(item);
  if (q === null || q <= 0) return null;
  const e = ECHELLES[rayon];
  return { x: xBarre(q, e), coupe: coupeBarre(q, e) };
}

export const quantiteDite = (n: number, u: string): string => unite(n, u);
const unite = (n: number, u: string) => {
  const k = u.trim().toLowerCase();
  if (k === 'kg') return `${nombreFr(n, 2)} kg`;
  if (k === 'g') return n >= 1000 ? `${nombreFr(n / 1000, 2)} kg` : `${nombreFr(n, n >= 10 ? 0 : 1)} g`;
  return Units.format(n, u); // « 1 sachet », « 4 sachets » : l'unité comptée s'accorde
};

/** « 0,5 kg » comme la maquette (un kg inférieur à 1 reste en kg) ; « à compter » n'est pas ici : la quantité inconnue est dite par la ligne. */
export const quantiteDeLigne = (item: StockItem): string => unite(item.currentStock, item.unit);

export interface EtatDit { texte: string; classe: ClasseLigne }
/**
 * Le deuxième rang de la ligne : l'état en mots, le seuil ou le manque. Même mots que la maquette :
 * « assez · seuil 0,3 kg », « au seuil · seuil 0,5 kg », « bas · seuil 2 kg », « manque 0,4 kg », « épuisé · seuil 200 g »,
 * « à compter · manque inconnu », « sans seuil », « DDM dépassée · au seuil ».
 */
export function etatDit(item: StockItem, info: InfoLigne, cmd: ArticleACommander | undefined, aujourdhui: string): EtatDit {
  const seuil = typeof item.minStock === 'number' && item.minStock > 0 ? item.minStock : null;
  const dSeuil = seuil !== null ? `seuil ${unite(seuil, item.unit)}` : 'sans seuil';
  const manque = cmd && cmd.missing > 0 ? `manque ${cmd.auMoins ? 'au moins ' : ''}${unite(cmd.missing, item.unit)}` : 'manque inconnu';
  let texte: string; let classe: ClasseLigne = info.classe;
  switch (info.classe) {
    case 'compter': texte = cmd ? `à compter · ${manque}` : 'à compter'; break;
    case 'epuise': texte = `épuisé · ${dSeuil}`; break;
    case 'manque': texte = manque; break;
    case 'bas': {
      const egal = seuil !== null && item.currentStock === seuil;
      classe = egal ? 'seuil' : 'bas';
      texte = `${egal ? 'au seuil' : 'bas'} · ${dSeuil}`; break;
    }
    case 'assez': texte = `assez · ${dSeuil}`; break;
    default: texte = 'sans seuil';
  }
  if (info.etats.includes('ddm')) {
    // Une seule phrase pour le fait, avec les jours (verdict 5cdcd12e n° 7) : « périmée depuis 44 j · au seuil », plus de « DDM dépassée » suivi d'un « Périmé depuis 44 j » dessous.
    const { statut, jours } = statutDurabilite(item.yeastLot?.expiresOn, aujourdhui);
    const ddm = statut === 'perime' && jours !== null ? `périmée depuis ${-jours} j` : jours === 0 ? 'périme aujourd’hui' : jours !== null ? `périme dans ${jours} j` : 'DDM proche';
    // la maquette ne répète pas le seuil : « … · au seuil »
    texte = info.classe === 'assez' || info.classe === 'sans' ? ddm : `${ddm} · ${texte.split(' · ')[0]}`;
    classe = 'ddm';
  }
  return { texte, classe };
}

export interface RepereLigne { texte: string; couleur: string | null; inconnu: boolean; alerte: boolean }
/** La pastille de repère : EBC (malts), α (houblons), DDM (levures) ; null pour les autres rayons. L'inconnu se dit « non connu ». */
export function repereLigne(item: StockItem, info: InfoLigne, couleurMalt: (ebc: number) => string): RepereLigne | null {
  const rayon = rayonDuMur(item);
  if (rayon === 'Malts') {
    const e = item.colorEbc;
    if (typeof e !== 'number' || !Number.isFinite(e)) return { texte: 'EBC non connu', couleur: null, inconnu: true, alerte: false };
    return { texte: `EBC ${nombreFr(e, 1).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`, couleur: couleurMalt(e), inconnu: false, alerte: false };
  }
  if (rayon === 'Houblons') {
    const a = item.alphaPct;
    if (typeof a !== 'number' || !Number.isFinite(a)) return { texte: 'α non connu', couleur: null, inconnu: true, alerte: false };
    return { texte: `α ${nombreFr(a, 1)} %`, couleur: null, inconnu: false, alerte: false };
  }
  if (rayon === 'Levures') {
    const m = /^(\d{4})-(\d{2})/.exec(item.yeastLot?.expiresOn ?? '');
    if (!m) return { texte: 'DDM non connue', couleur: null, inconnu: true, alerte: false };
    return { texte: `DDM ${m[2]}.${m[1]}`, couleur: null, inconnu: false, alerte: info.etats.includes('ddm') };
  }
  return null;
}
