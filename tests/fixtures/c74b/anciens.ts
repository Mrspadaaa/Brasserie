/**
 * Voie c74b-tests (25.11) : des carnets à la FORME de ses vieux carnets, lus avant les correctifs (L28), anonymisés (vendeurs, prix et phrases d'exemple ; aucune donnée personnelle).
 * Ce qui les rend « vieux » (relevé sur ses carnets réels, voies/reel-73/RESULTAT.md) :
 *  - articles sans `conditionnement`, sans `offres`, sans `prixUnite` : le prix est un nombre nu ; la quantité n'existe que dans une ligne « Poids » de la page ;
 *  - un prix de houblon « dès 0,10 CHF » qui est le prix du GRAMME, sans que rien ne le dise ;
 *  - aucun `genre`, `domaine`, `categorie`, `suivi` posés (champs d'après D451) ;
 *  - un fil en messages bruts (`rangement: 'brut'`), sans étiquette, sans proposition, le titre redit en 1re bulle ;
 *  - un carnet importé du Planning (3 sept.) : budget en « critère », dates en note, « Quand » dérivé de `date`.
 */
import type { CreativeItem } from '../../../src/types';
import { carnetDeTache, type TachePlanning } from '../../../scripts/planning-vers-carnet/correspondance';

const PREFIXE = 'ZZ TEST — ';
type Valeur = { valeur: number | string; unite?: string; origine: 'page' };
const v = (valeur: number | string, unite?: string): Valeur => ({ valeur, ...(unite ? { unite } : {}), origine: 'page' });

/** Le carnet d'un test : champs de base d'avant D451, rien de plus. */
function carnet(id: string, titre: string, d: Record<string, unknown>, extra: Record<string, unknown> = {}): CreativeItem {
  return JSON.parse(JSON.stringify({
    id, type: 'carnet', title: `${PREFIXE}${titre}`, status: 'research', ...extra,
    carnet: { version: 1, creeLe: '2026-11-24T08:00:00.000Z', phrase: `${PREFIXE}${titre}`, criteres: [], facons: [], articles: [], notes: [], photos: [], ...d }
  })) as CreativeItem;
}

/* ------------------------------------------------------------------------------------------ houblons : deux articles lus avant les correctifs */

export const ID_CITRA = 'ZZ-C74B-CITRA';
export const TITRE_CITRA = `${PREFIXE}houblons citra`;
/**
 * A (« Brau ») : « Citra 13.6% », prix « dès 0,10 CHF » = 0,1044 CHF le gramme (0,08 dès 1 000 g), gardé comme un nombre nu : `prixCentimes: 10`, `prixDes`.
 * B (« MotlerHops ») : « CITRA® (US) », 3,72 € TTC les 50 g, cours 0,918 : 73,80 CHF/kg rendu (3,72 × 0,918 × 1,081 × 20) ; la ligne « Poids » dit « 50 g, 250 g et 500 g » sans un prix de plus.
 */
export function citraAncien(): CreativeItem {
  return carnet(ID_CITRA, 'houblons citra', {
    articles: [
      {
        id: 'H-A', nom: 'Citra 13.6%', domaine: 'houblonnerie-exemple.test', url: 'https://www.houblonnerie-exemple.test/citra-136', lecture: 'lue', vendeur: 'Houblonnerie Exemple', pays: 'CH', dispo: 'en stock',
        prixCentimes: 10, prixDes: true, devise: 'CHF', taxe: 'ht',
        valeurs: { Citra: v(13.6, '%'), Arômes: v('citron vert, mangue, fruits tropicaux'), Origine: v('USA') }
      },
      {
        id: 'H-B', nom: 'CITRA® (US)', domaine: 'pellets-exemple.test', url: 'https://www.pellets-exemple.test/citra-us', lecture: 'lue', vendeur: 'Pellets Exemple', pays: 'FR', dispo: 'en stock',
        prixCentimes: 372, devise: 'EUR', taxe: 'ttc', change: { taux: 0.918, date: '2026-11-24', source: 'BCE' },
        valeurs: { Origine: v('États-Unis'), Poids: v('50 g, 250 g et 500 g'), "Taux d'acides alpha": v('10 % - 15 %') }
      }
    ]
  });
}

/** Deux houblons sans AUCUNE base de quantité (ni conditionnement, ni « Poids », ni prix à l'unité) : aucun CHF/kg ne peut se calculer. */
export const ID_SANS_BASE = 'ZZ-C74B-SANSBASE';
export const TITRE_SANS_BASE = `${PREFIXE}houblons sans quantité`;
export function houblonsSansBase(): CreativeItem {
  return carnet(ID_SANS_BASE, 'houblons sans quantité', {
    articles: [
      { id: 'S-A', nom: 'Citra pellets T90', domaine: 'houblonnerie-exemple.test', url: 'https://www.houblonnerie-exemple.test/citra-t90', lecture: 'lue', vendeur: 'Houblonnerie Exemple', pays: 'CH', dispo: 'en stock', prixCentimes: 450, devise: 'CHF', taxe: 'ht', valeurs: { Citra: v(13.2, '%') } },
      { id: 'S-B', nom: 'Citra T90 en sachet', domaine: 'pellets-exemple.test', url: 'https://www.pellets-exemple.test/citra-t90', lecture: 'lue', vendeur: 'Pellets Exemple', pays: 'CH', dispo: 'en stock', prixCentimes: 420, devise: 'CHF', taxe: 'ht', valeurs: { Citra: v(12.8, '%') } }
    ]
  });
}

/* ------------------------------------------------------------------------------------------ Chambre froide : deux articles, vingt caractéristiques chacun */

export const ID_CHAMBRE = 'ZZ-C74B-CHAMBRE';
const CARACS: Array<[string, number | string, string?]> = [
  ['Volume', 4.06, 'm³'], ['Température', '0 à 8 °C'], ['Tension', '230 V'], ['Puissance', 1200, 'W'], ['Longueur', 1500, 'mm'], ['Largeur', 1200, 'mm'], ['Hauteur', 2100, 'mm'],
  ['Épaisseur des parois', 80, 'mm'], ['Isolation', 'mousse polyuréthane'], ['Réfrigérant', 'R290'], ['Porte', 'battante, serrure'], ['Éclairage', 'LED intérieure'],
  ['Revêtement', 'tôle galvanisée'], ['Sol', 'plancher renforcé'], ['Évaporateur', 'à dégivrage automatique'], ['Groupe', 'monobloc inclus'], ['Niveau sonore', 52, 'dB'],
  ['Poids', 310, 'kg'], ['Garantie', '24 mois'], ['Livraison', 'sur palette']
];
export function chambreAncienne(): CreativeItem {
  const valeurs = (volume: number) => Object.fromEntries(CARACS.map(([nom, val, unite]) => [nom, nom === 'Volume' ? v(volume, 'm³') : v(val, unite)]));
  return carnet(ID_CHAMBRE, 'chambre froide', {
    articles: [
      { id: 'CF-1', nom: 'Chambre froide 1500 x 1200 mm - 2,6 m³ - groupe inclus', domaine: 'gastro-exemple.test', url: 'https://www.gastro-exemple.test/cf-26', lecture: 'lue', vendeur: 'gastro-exemple.test', pays: 'DE', dispo: 'en stock', prixCentimes: 269774, devise: 'CHF', taxe: 'ttc', valeurs: valeurs(2.6) },
      { id: 'CF-2', nom: 'Chambre froide 1800 x 1500 mm - 4,06 m³ - groupe inclus', domaine: 'gastro-exemple.test', url: 'https://www.gastro-exemple.test/cf-406', lecture: 'lue', vendeur: 'gastro-exemple.test', pays: 'DE', dispo: 'en stock', prixCentimes: 298751, devise: 'CHF', taxe: 'ttc', valeurs: valeurs(4.06) }
    ]
  });
}

/* ------------------------------------------------------------------------------------------ un fil écrit avant le port D451 : des bulles brutes */

export const ID_MALT = 'ZZ-C74B-MALT';
export const PHRASES_MALT = [
  `${PREFIXE}malt pilsner en rupture chez le fournisseur`,
  'Pilsner 25 kg en rupture jusqu’à mi-décembre.',
  'Brassin du 3 déc. à décaler ou à faire avec un autre malt.',
  'Autre fournisseur : en stock, 4 CHF de plus le sac.',
  'Commandé 2 sacs chez l’autre, brassin maintenu.'
] as const;
/** Le carnet et ses 5 messages `brut` (aucune étiquette, aucune proposition, `effets` vers les notes) : tel qu'écrit le 24.11 avant le port du suivi. */
export function filBrutMalt(): CreativeItem[] {
  const heures = ['21:21', '21:29', '21:29', '21:29', '21:30'];
  const notes = PHRASES_MALT.slice(1).map((texte, i) => ({ id: `${ID_MALT}-N${i + 1}`, texte, genre: 'note', modifieeLe: `2026-11-24T${heures[i + 1]}:00.000Z`, messageId: `${ID_MALT}-M${i + 2}` }));
  const messages = PHRASES_MALT.map((texte, i) => ({
    id: `${ID_MALT}-M${i + 1}`, type: 'carnet-message', title: texte, status: 'done',
    carnetMessage: {
      texte, le: `2026-11-24T${heures[i]}:00.000Z`, depuis: i === 0 ? 'liste' : ID_MALT, rangement: 'brut',
      effets: i === 0 ? [{ carnetId: ID_MALT, cible: 'carnet', id: ID_MALT }] : [{ carnetId: ID_MALT, cible: 'note', id: `${ID_MALT}-N${i}` }]
    }
  }));
  return [carnet(ID_MALT, 'malt pilsner en rupture chez le fournisseur', { phrase: PHRASES_MALT[0], notes }, { status: 'idea' }), ...(JSON.parse(JSON.stringify(messages)) as CreativeItem[])];
}

/* ------------------------------------------------------------------------------------------ un carnet importé du Planning, tel que `migrer` l'a écrit le 3 sept. */

export const ID_EMBOUTEILLAGE = 'CARNET-PLANNING-T-01';
export const ID_FRIGO = 'CARNET-PLANNING-T-02';
const TACHES: TachePlanning[] = [
  { id: 'T-1', creeLe: '2026-09-03T08:00:00.000Z', category: 'Équipements', description: 'Embouteillage', cost: 850, startDate: '01.05.2027', endDate: '01.07.2027' },
  { id: 'T-2', creeLe: '2026-09-03T08:00:01.000Z', category: 'Équipements', description: 'Frigo + congel', cost: 400, startDate: '01.05.2027', endDate: '01.08.2027' }
];
/** Les docs écrits par l'import : carnet (`date` = lundi du début), message `locale`, critère « Budget du Planning : … », note « À faire du … au … (Planning, Équipements) ». */
export function importPlanning(): CreativeItem[] {
  return TACHES.flatMap(t => carnetDeTache(t, '2026-09-03T08:00:00.000Z').docs.map(d => JSON.parse(JSON.stringify(d)) as CreativeItem)).map(d => (d.type === 'carnet' ? { ...d, title: `${PREFIXE}${d.title}` } as CreativeItem : d));
}

/* ------------------------------------------------------------------------------------------ le fil de « Houblons citra » : deux liens collés en clair (gclid, utm) */

export const LIEN_MOTLER = 'https://www.pellets-exemple.test/collections/tous-nos-houblons/products/citra-us?utm_source=newsletter&utm_medium=email&utm_campaign=automne&gclid=Cj0KCQiAexemple';
/** Une adresse de 400 caractères, comme celle de Chambre froide (paramètres de suivi à rallonge). */
export const LIEN_LONG = `https://www.gastro-exemple.test/froid/chambres/chambre-froide-1500-1200?gclid=${'Ab1Cd2Ef3Gh4'.repeat(26)}&utm_source=google&utm_medium=cpc`;
export function citraAvecFil(): CreativeItem[] {
  const doc = citraAncien() as unknown as { carnet: { articles: Array<Record<string, unknown>>; notes: unknown[] } };
  doc.carnet.articles[1].messageId = 'ZZ-C74B-ML1';
  const msg = (id: string, texte: string, le: string, effet: string) => ({
    id, type: 'carnet-message', title: texte, status: 'done',
    carnetMessage: { texte, le, depuis: ID_CITRA, rangement: 'brut', effets: [{ carnetId: ID_CITRA, cible: 'article', id: effet }] }
  });
  return [doc as unknown as CreativeItem, ...(JSON.parse(JSON.stringify([
    msg('ZZ-C74B-ML1', LIEN_MOTLER, '2026-11-24T16:44:00.000Z', 'H-B'),
    msg('ZZ-C74B-ML2', 'https://www.houblonnerie-exemple.test/citra-136', '2026-11-24T16:45:00.000Z', 'H-A')
  ])) as CreativeItem[])];
}
/** Chambre froide avec sa longue adresse dans le fil. */
export function chambreAvecFil(): CreativeItem[] {
  const m = { id: 'ZZ-C74B-ML3', type: 'carnet-message', title: LIEN_LONG, status: 'done', carnetMessage: { texte: LIEN_LONG, le: '2026-11-24T17:00:00.000Z', depuis: ID_CHAMBRE, rangement: 'brut', effets: [{ carnetId: ID_CHAMBRE, cible: 'article', id: 'CF-2' }] } };
  const d = chambreAncienne() as unknown as { carnet: { articles: Array<Record<string, unknown>> } };
  d.carnet.articles[1].messageId = 'ZZ-C74B-ML3';
  return [d as unknown as CreativeItem, JSON.parse(JSON.stringify(m)) as CreativeItem];
}

/** Un problème neuf, ouvert, sans rien dedans : le décor des gestes (une phrase tapée, l'IA éteinte ou simulée). */
export const ID_PROBLEME = 'ZZ-C74B-PROBLEME';
export function problemeVide(titre = 'pompe qui chauffe'): CreativeItem {
  return carnet(ID_PROBLEME, titre, { genre: { valeur: 'probleme', origine: 'ia' }, suivi: { etat: 'cherche', evenements: [] }, domaine: { valeur: 'brasserie', origine: 'ia' }, categorie: { chemin: ['Brassage'], origine: 'ia' } }, { status: 'idea' });
}
