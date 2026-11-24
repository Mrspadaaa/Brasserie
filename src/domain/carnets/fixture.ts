/**
 * Carnet d'idées : la fixture du banc et des tests. Cinq carnets « ZZ TEST — … » qui reprennent les écrans figés (p2:g05-1, i06-1,
 * h05-3, h03-5, h01-6, g01-8, g05-11) : Ventilation (À comparer), Évier (Idée), Embouteillage et Frigo (Choisi, Frigo dans À venir),
 * Densimètre (Choisi, choix revu : état 29, R34). Titres stables pour le rejeu : `TITRES_BANC`.
 * Tout est **exemple** : noms, vendeurs, prix et valeurs portent `origine: 'exemple'` ; les liens visent `exemple.invalid` (aucun site réel).
 * Les veilles sont allumées par lui (R31) : `{ active, depuis }`, jamais de `releveLe` (aucune relève simulée montrée).
 */
import type { CreativeItem } from '../../types';
import type { FinanceTransaction, FinancialPayment, FinancialPlan } from '../finance/types';
import type { Article, CarnetDoc, DonneesCarnet, EtatOption, Etiquette, EvenementSuivi, Facon, MessageDoc, Note, PasOption, Photo, Tache, Valeur } from './modele';

export const PREFIXE_BANC = 'ZZ TEST — ';

/**
 * La note en vrac à taper au banc (états 22 et 23, D-139, D-140). Critique 6, doute : une note tapée à la main portait une pompe à
 * « 1 800 m³/h » (absurde : une pompe de transfert de brasserie débite 2 à 5 m³/h, 30 à 80 L/min). Valeurs plausibles, exemples.
 */
export const NOTE_EN_VRAC_BANC = 'Pour le bac : 2 bacs de lavage.\nPour la hotte : tient 80 °C.\nPour la pompe : 3 m³/h.';

/**
 * Critique 6, n° 20 (R05, D-78, p2:h01-6) : une « photo de la page collée » **simulée**, pour prouver la photo lue de l'article ouvert.
 * Image locale (SVG en URL de données : aucun réseau, aucun site réel), dessinée pour le banc : une hotte inox au-dessus d'une cuve,
 * sur un mur carrelé. Les articles qui la portent sont des exemples (`origine: 'exemple'`), l'écran le dit (« exemple »).
 */
export const PHOTO_BANC_HOTTE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent([
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">',
  '<defs><linearGradient id="m" x1="0" x2="1"><stop offset="0" stop-color="#9aa6ad"/><stop offset=".5" stop-color="#e4e9ec"/><stop offset="1" stop-color="#8d989f"/></linearGradient>',
  '<pattern id="c" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#eef1ee"/><path d="M40 0H0V40" fill="none" stroke="#d3d9d4" stroke-width="2"/></pattern></defs>',
  '<rect width="640" height="360" fill="url(#c)"/>',
  '<rect y="300" width="640" height="60" fill="#c9c2b6"/>',
  '<rect x="290" y="0" width="60" height="70" fill="url(#m)" stroke="#7d878d" stroke-width="2"/>',
  '<path d="M200 150 L270 70 H370 L440 150 Z" fill="url(#m)" stroke="#6f797f" stroke-width="3"/>',
  '<rect x="186" y="150" width="268" height="18" rx="4" fill="#b8c1c6" stroke="#6f797f" stroke-width="3"/>',
  '<path d="M260 190 q10 -14 0 -28 M320 196 q10 -14 0 -28 M380 190 q10 -14 0 -28" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity=".9"/>',
  '<rect x="236" y="205" width="168" height="95" rx="8" fill="url(#m)" stroke="#6f797f" stroke-width="3"/>',
  '<rect x="226" y="198" width="188" height="14" rx="5" fill="#a9b3b8" stroke="#6f797f" stroke-width="3"/>',
  '</svg>'
].join(''))}`;

const ex = (valeur: number | string | boolean, unite?: string): Valeur => (unite ? { valeur, unite, origine: 'exemple' } : { valeur, origine: 'exemple' });
const lien = (n: string) => `https://exemple.invalid/${n}`;
const article = (a: Omit<Article, 'lecture' | 'domaine' | 'devise'> & { devise?: string }): Article => ({
  ...a, ...(a.url ? { domaine: 'exemple.invalid' } : {}), ...(a.prixCentimes !== undefined ? { devise: a.devise ?? 'CHF' } : {}), lecture: a.nom ? 'lue' : 'illisible'
});

const carnet = (id: string, titre: string, status: CarnetDoc['status'], d: Omit<DonneesCarnet, 'version'>): CarnetDoc =>
  ({ id, type: 'carnet', title: `${PREFIXE_BANC}${titre}`, status, carnet: { version: 1, ...d } });

const message = (id: string, texte: string, le: string, depuis: string, effets: MessageDoc['carnetMessage']['effets'], titrePropose?: MessageDoc['carnetMessage']['titrePropose']): MessageDoc =>
  ({ id, type: 'carnet-message', title: texte, status: 'done', carnetMessage: { texte, le, depuis, rangement: 'simulee', effets, ...(titrePropose ? { titrePropose } : {}) } });

/** G29 (R46) : le titre que l'IA (simulée) a proposé pour Ventilation, d'après la phrase du message ZZ-MSG-V3 ; pas encore appliqué. */
export const TITRE_PROPOSE_VENTILATION = `${PREFIXE_BANC}Évacuer la buée de la cuve`;
export const PHRASE_TITRE_PROPOSE = 'surtout la buée de la cuve pendant l’ébullition, pas tant la salle';

/**
 * G11 (« Même chose que la note du 12 nov. · Garder à part ») : à taper dans Ventilation. Elle répète la note ZZ-V-N1 ; `doublons.ts`
 * (Jaccard 0,75 ≥ 0,4) et l'IA simulée (`doublonDe`) la reconnaissent.
 */
export const PHRASE_DOUBLON = 'attendre l’avis du ferblantier sur la hotte';

/** P15 : le critère de Ventilation tiré de « plus de condensation au plafond » (il n'en veut plus). */
export const CRITERE_CONDENSATION = 'Moins de condensation au plafond : capter la buée';
/** P19 : la note de Ventilation qui ressemble à un critère (G25 à G27). */
export const NOTE_COMME_CRITERE = 'il faudrait au moins 1 500 m³/h';

/**
 * P11 (R19, R36, g5:v01-16) : une note en vrac à coller depuis la liste, comme celles de son téléphone : un geste, une question, un achat,
 * dans deux carnets (Évier, Ventilation). L'IA (simulée) et le repli local la rendent typée, mise en forme, l'achat en tête.
 */
export const NOTE_VRAC_BANC = 'ZZ TEST — demander au ferblantier le diamètre d’évacuation de l’évier, jeudi\nhotte 120 cm trop large pour la salle ?\ngaine alu Ø 150 mm, 2 pièces';

/**
 * Critique 5, n° 7 et 30 (R18, R19, g5:v01-15, g5:v01-16) : une note en vrac de 3 lignes qui va dans 2 carnets : un achat dans Évier
 * (carnet existant), une question et un conseil dans UN carnet neuf, « Moulin à malt » (titre mis en forme, état Idée). Trois sortes.
 */
export const NOTE_VRAC_DEUX_CARNETS = 'ZZ TEST — commander un robinet à pédale pour l’évier\nmoulin à malt : est-ce que 2 cylindres suffisent ?\nattention à la poussière du moulin, prévoir une aspiration';

export const ID_VENTILATION = 'ZZ-CARNET-VENTILATION';
export const ID_EVIER = 'ZZ-CARNET-EVIER';
export const ID_EMBOUTEILLAGE = 'ZZ-CARNET-EMBOUTEILLAGE';
export const ID_FRIGO = 'ZZ-CARNET-FRIGO';
export const ID_DENSIMETRE = 'ZZ-CARNET-DENSIMETRE';
/** P20 (G35) : le carnet proche de Ventilation, qui reçoit ses articles en veille quand on la supprime. */
export const ID_EXTRACTION = 'ZZ-CARNET-EXTRACTION';
export const ID_PLAN_FRIGO = 'ZZ-PLAN-FRIGO';
export const ID_PLAN_EMBOUTEILLAGE = 'ZZ-PLAN-EMBOUTEILLAGE';

/**
 * Les titres stables que le rejeu du banc cherche (m390-29, d1280-29, états 29, 30, 38, 49, 50), un par état difficile à atteindre :
 * - `choixRevu` : un choix revu, « Choix d'avant » lisible (état 29) ;
 * - `lienAVenir` : le Frigo, dans À venir (« 1 lien le retient », états 30, 38, 49) ;
 * - `planRealise` : l'Embouteillage, dont le plan est réalisé avec `&realise=1` (« Archiver » seul, état 50 ; `fixturePlanRealise`).
 */
export const TITRES_BANC = {
  choixRevu: `${PREFIXE_BANC}Densimètre de paillasse`,
  lienAVenir: `${PREFIXE_BANC}Frigo de garde pour fûts`,
  planRealise: `${PREFIXE_BANC}Embouteillage`
} as const;

function ventilation(): CarnetDoc {
  return carnet(ID_VENTILATION, 'Ventilation de la salle de brassage', 'research', {
    creeLe: '2026-11-02T08:00:00.000Z', phrase: 'buées au-dessus de la cuve',
    criteres: [
      /* P15 : sa phrase « plus de condensation au plafond » dit une gêne ; le critère dit ce qu'il veut (la phrase reste dans ZZ-MSG-V1, R25).
         Sans caractéristique : c'est lui que G8 propose pour trancher entre les deux façons (« capte la buée / ne la capte pas »). */
      { id: 'ZZ-V-K1', texte: CRITERE_CONDENSATION, origine: 'vous', messageId: 'ZZ-MSG-V1' },
      /* critique 5, n° 1 : ni « tient 80 °C » ni « le débit » ne viennent de sa phrase (« buées au-dessus de la cuve ») : proposés par l'IA */
      { id: 'ZZ-V-K2', texte: 'tient 80 °C', caracteristique: { nom: 'tient 80 °C', sens: 'oui-non' }, origine: 'ia', source: 'ia' },
      { id: 'ZZ-V-K3', texte: 'le débit', caracteristique: { nom: 'débit', unite: 'm³/h', sens: 'plus' }, origine: 'ia', source: 'ia' }
    ],
    facons: [
      { id: 'ZZ-V-F1', nom: 'Hotte inox + extracteur', etat: 'ouverte', origine: 'exemple' },
      { id: 'ZZ-V-F2', nom: 'Extracteur mural seul', etat: 'ouverte', origine: 'exemple' },
      // D-52, R06 : une façon écartée, avec sa raison ; son article reste à la fin du tableau de Comparer.
      { id: 'ZZ-V-F3', nom: 'Ventilateur de plafond', etat: 'ecartee', raison: 'brasse la buée sans la sortir', origine: 'exemple' }
    ],
    articles: [
      article({ id: 'ZZ-V-A1', url: lien('v1'), nom: 'Hotte inox 120 cm + moteur', prixCentimes: 260000, vendeur: 'Inox Broye', pays: 'CH', dispo: 'en stock', faconId: 'ZZ-V-F1', valeurs: { 'débit': ex(1800, 'm³/h'), 'tient 80 °C': ex(true) } }),
      article({ id: 'ZZ-V-A2', url: lien('v2'), nom: 'Hotte murale 100 cm', photo: PHOTO_BANC_HOTTE, prixCentimes: 145000, vendeur: 'Gastro Lüftung', pays: 'DE', dispo: 'délai 4 semaines', faconId: 'ZZ-V-F1', valeurs: { 'débit': ex(1200, 'm³/h'), 'tient 80 °C': ex(true) }, veille: { active: true, depuis: '2026-11-04T09:00:00.000Z' } }),
      article({ id: 'ZZ-V-A3', url: lien('v3'), nom: 'Extracteur mural hélicoïde', prixCentimes: 42000, vendeur: 'Ventil Jura', pays: 'CH', dispo: 'en stock', faconId: 'ZZ-V-F2', valeurs: { 'débit': ex(1500, 'm³/h'), 'tient 80 °C': ex(false) } }),
      article({ id: 'ZZ-V-A4', url: lien('v4'), nom: 'Extracteur centrifuge en ligne', prixCentimes: 69000, vendeur: 'Aéro Rhône', pays: 'FR', dispo: 'en stock', faconId: 'ZZ-V-F2', valeurs: { 'débit': ex(1100, 'm³/h') } }),
      article({ id: 'ZZ-V-A5', url: lien('v5'), valeurs: {} }),
      article({ id: 'ZZ-V-A6', url: lien('v6'), nom: 'Ventilateur de plafond 130 cm', prixCentimes: 18000, vendeur: 'Ventil Jura', pays: 'CH', dispo: 'en stock', faconId: 'ZZ-V-F3', valeurs: { 'tient 80 °C': ex(false) } })
    ].map(a => ({ ...a, origine: 'exemple' as const })),
    notes: [
      { id: 'ZZ-V-N1', texte: 'attendre l’avis du ferblantier', genre: 'a-faire', messageId: 'ZZ-MSG-V2' },
      { id: 'ZZ-V-N2', texte: PHRASE_TITRE_PROPOSE, genre: 'note', messageId: 'ZZ-MSG-V3' },
      // P19 : une note qui ressemble à un critère (G25 à G27, « Ressemble à un critère · Passer »).
      { id: 'ZZ-V-N3', texte: NOTE_COMME_CRITERE, genre: 'note', messageId: 'ZZ-MSG-V4' }
    ],
    photos: []
  });
}

function evier(): CarnetDoc {
  return carnet(ID_EVIER, 'Évier inox', 'idea', {
    creeLe: '2026-11-15T17:00:00.000Z', phrase: '2 bacs pour laver les fûts',
    criteres: [
      /* critique 5, n° 1 : « 2 bacs » est de sa phrase (« 2 bacs pour laver les fûts ») ; « assez profond pour un fût », proposé par l'IA */
      { id: 'ZZ-E-K1', texte: '2 bacs', caracteristique: { nom: 'bacs', sens: 'plus' }, origine: 'vous', source: 'phrase', messageId: 'ZZ-MSG-E1' },
      { id: 'ZZ-E-K2', texte: 'assez profond pour un fût', caracteristique: { nom: 'fond de bac', unite: 'cm', sens: 'plus' }, origine: 'ia', source: 'ia', messageId: 'ZZ-MSG-E1' }
    ],
    facons: [], articles: [], notes: [], photos: []
  });
}

function embouteillage(): CarnetDoc {
  const o = (n: number) => ex(n, 'ppb'), cad = (n: number) => ex(n, 'bt/h');
  return carnet(ID_EMBOUTEILLAGE, 'Embouteillage', 'validated', {
    creeLe: '2026-10-20T08:00:00.000Z', phrase: 'embouteillage',
    criteres: [{ id: 'ZZ-B-K1', texte: 'minimiser l’oxygène', caracteristique: { nom: 'oxygène capté', unite: 'ppb', sens: 'moins' }, origine: 'vous', messageId: 'ZZ-MSG-B3' }],
    facons: [
      { id: 'ZZ-B-F1', nom: 'Gravité', etat: 'ecartee', raison: 'trop d’oxygène capté', origine: 'vous', messageId: 'ZZ-MSG-B2' },
      { id: 'ZZ-B-F2', nom: 'Isobarique (contre-pression)', etat: 'retenue', origine: 'exemple' }
    ],
    articles: [
      article({ id: 'ZZ-B-A1', url: lien('e1'), nom: 'Remplisseuse contre-pression manuelle 1 bec', prixCentimes: 19000, vendeur: 'Brauladen Nord', pays: 'DE', faconId: 'ZZ-B-F2', valeurs: { 'oxygène capté': o(220), cadence: cad(60) } }),
      article({ id: 'ZZ-B-A2', url: lien('e2'), nom: 'Isobarique 2 becs de table', prixCentimes: 185000, vendeur: 'Enotecnica Sud', pays: 'IT', faconId: 'ZZ-B-F2', valeurs: { 'oxygène capté': o(120), cadence: cad(150) } }),
      article({ id: 'ZZ-B-A3', url: lien('e3'), nom: 'Isobarique 4 becs semi-auto', prixCentimes: 640000, vendeur: 'Enotecnica Sud', pays: 'IT', faconId: 'ZZ-B-F2', valeurs: { 'oxygène capté': o(90), cadence: cad(380) } }),
      article({ id: 'ZZ-B-A4', url: lien('e4'), nom: 'Isobarique 4 becs pré-évacuation', prixCentimes: 1120000, vendeur: 'Abfülltechnik West', pays: 'DE', faconId: 'ZZ-B-F2', valeurs: { 'oxygène capté': o(40), cadence: cad(400) }, veille: { active: true, depuis: '2026-11-05T09:00:00.000Z' } }),
      article({ id: 'ZZ-B-A5', url: lien('e5'), nom: 'Isobarique 4 becs pré-évacuation', prixCentimes: 1170000, vendeur: 'Brassage Romandie', pays: 'CH', faconId: 'ZZ-B-F2', valeurs: { 'oxygène capté': o(40), cadence: cad(400) }, veille: { active: true, depuis: '2026-11-08T09:00:00.000Z' } }),
      article({ id: 'ZZ-B-A6', url: lien('e6'), nom: 'Monobloc isobarique 6 becs', prixCentimes: 2150000, vendeur: 'Macchine Lago', pays: 'IT', faconId: 'ZZ-B-F2', valeurs: { 'oxygène capté': o(50), cadence: cad(900) } })
    ].map(a => ({ ...a, origine: 'exemple' as const })),
    notes: [
      { id: 'ZZ-B-N1', texte: 'gravité 4 becs vu chez un collègue, pas mal', genre: 'note', messageId: 'ZZ-MSG-B2' }
    ],
    photos: [],
    choix: {
      articleId: 'ZZ-B-A5', faconId: 'ZZ-B-F2', pourquoi: 'oxygène le plus bas, SAV suisse', le: '2026-11-14T10:00:00.000Z', aRevoirSi: 'le volume dépasse 1 000 L par mois',
      ecartes: [
        { articleId: 'ZZ-B-A2', raison: 'cadence trop basse pour 300 L' },
        { articleId: 'ZZ-B-A6', raison: 'double prix pour une cadence inutile' },
        { articleId: 'ZZ-B-A4', raison: 'même machine, SAV à l’étranger' }
      ],
      remplaces: []
    }
  });
}

function frigo(): CarnetDoc {
  return carnet(ID_FRIGO, 'Frigo de garde pour fûts', 'validated', {
    creeLe: '2026-09-30T08:00:00.000Z', phrase: 'frigo de garde pour fûts',
    criteres: [
      { id: 'ZZ-F-K1', texte: 'tenir 2 °C stable en été', caracteristique: { nom: 'température ambiante max', unite: '°C', sens: 'plus' }, origine: 'vous' },
      { id: 'ZZ-F-K2', texte: 'passe la porte de 80 cm', caracteristique: { nom: 'passe la porte de 80 cm', sens: 'oui-non' }, origine: 'vous', messageId: 'ZZ-MSG-F2' }
    ],
    facons: [
      { id: 'ZZ-F-F1', nom: 'Chambre froide en kit', etat: 'retenue', origine: 'exemple' },
      { id: 'ZZ-F-F2', nom: 'Frigo vitrine pro', etat: 'ecartee', raison: 'ne passe pas la porte', origine: 'exemple' }
    ],
    articles: [
      article({ id: 'ZZ-F-A1', url: lien('f1'), nom: 'Chambre froide en kit 2 m³', prixCentimes: 490000, vendeur: 'Froid Léman', pays: 'CH', faconId: 'ZZ-F-F1', valeurs: { 'température ambiante max': ex(43, '°C'), 'passe la porte de 80 cm': ex(true), 'fûts de 20 L': ex(30) } }),
      article({ id: 'ZZ-F-A2', url: lien('f2'), nom: 'Vitrine pro 700 L', prixCentimes: 230000, vendeur: 'Gastrokälte Süd', pays: 'DE', faconId: 'ZZ-F-F2', valeurs: { 'température ambiante max': ex(30, '°C'), 'passe la porte de 80 cm': ex(false), 'fûts de 20 L': ex(8) } }),
      article({ id: 'ZZ-F-A3', url: lien('f3'), nom: 'Vitrine d’occasion 600 L', prixCentimes: 65000, vendeur: 'Annonce locale', pays: 'CH', faconId: 'ZZ-F-F2', valeurs: { 'passe la porte de 80 cm': ex(false), 'fûts de 20 L': ex(6) } }),
      article({ id: 'ZZ-F-A4', url: lien('f4'), nom: 'Chambre froide en kit 2,5 m³', prixCentimes: 430000, vendeur: 'Celle Frigo', pays: 'IT', faconId: 'ZZ-F-F1', valeurs: { 'température ambiante max': ex(38, '°C'), 'passe la porte de 80 cm': ex(true), 'fûts de 20 L': ex(40) } })
    ].map(a => ({ ...a, origine: 'exemple' as const })),
    notes: [{ id: 'ZZ-F-N1', texte: 'la porte du local fait 80 cm', genre: 'note', messageId: 'ZZ-MSG-F2' }],
    photos: [],
    choix: {
      articleId: 'ZZ-F-A1', faconId: 'ZZ-F-F1', pourquoi: 'tient 2 °C en été, 6 fûts', le: '2026-10-10T10:00:00.000Z',
      ecartes: [{ articleId: 'ZZ-F-A3', raison: 'pas de garantie sur le compresseur' }, { articleId: 'ZZ-F-A4', raison: 'délai de 4 semaines, SAV en Italie' }],
      remplaces: [{ articleId: 'ZZ-F-A2', faconId: 'ZZ-F-F2', pourquoi: 'moins cher', le: '2026-10-03T10:00:00.000Z', ecartes: [], remplaces: [] }]
    },
    sortie: { planId: ID_PLAN_FRIGO, le: '2026-11-16T10:00:00.000Z' }
  });
}

/**
 * État 29 (R34, D-20, p2:g05-9 ; m390-29, d1280-29) : un choix revu, l'ancien choix lisible (« Choix d'avant », ADR). Choisi, pas encore
 * dans À venir (le Frigo, lui, y est déjà) : on l'ouvre, « Voir le choix », et l'ancien choix se lit avec sa date et sa raison.
 */
function densimetre(): CarnetDoc {
  return carnet(ID_DENSIMETRE, 'Densimètre de paillasse', 'validated', {
    creeLe: '2026-10-05T08:00:00.000Z', phrase: 'mesurer la densité finale au millième près',
    criteres: [
      { id: 'ZZ-D-K1', texte: 'précision au millième', caracteristique: { nom: 'précision', unite: 'g/cm³', sens: 'moins' }, origine: 'vous', messageId: 'ZZ-MSG-D1' },
      { id: 'ZZ-D-K2', texte: 'ne dérive pas pendant la mesure', caracteristique: { nom: 'stable sur une heure', sens: 'oui-non' }, origine: 'vous', messageId: 'ZZ-MSG-D2' }
    ],
    facons: [
      { id: 'ZZ-D-F1', nom: 'Densimètre numérique', etat: 'retenue', origine: 'exemple' },
      { id: 'ZZ-D-F2', nom: 'Aréomètre en verre', etat: 'ecartee', raison: 'lecture à l’œil, corrigée en température à la main', origine: 'exemple' }
    ],
    articles: [
      article({ id: 'ZZ-D-A1', url: lien('d1'), nom: 'Densimètre numérique portable', prixCentimes: 39000, vendeur: 'Labo Exemple', pays: 'CH', faconId: 'ZZ-D-F1', valeurs: { 'précision': ex(0.001, 'g/cm³'), 'stable sur une heure': ex(false) } }),
      article({ id: 'ZZ-D-A2', url: lien('d2'), nom: 'Densimètre de paillasse à oscillation', prixCentimes: 210000, vendeur: 'Mesure Exemple', pays: 'DE', faconId: 'ZZ-D-F1', valeurs: { 'précision': ex(0.0001, 'g/cm³'), 'stable sur une heure': ex(true) } }),
      article({ id: 'ZZ-D-A3', url: lien('d3'), nom: 'Aréomètre en verre 1,000–1,100', prixCentimes: 2500, vendeur: 'Verre Exemple', pays: 'CH', faconId: 'ZZ-D-F2', valeurs: { 'précision': ex(0.001, 'g/cm³') } })
    ].map(a => ({ ...a, origine: 'exemple' as const })),
    notes: [{ id: 'ZZ-D-N1', texte: 'le portable dérive de 2 millièmes au bout d’une heure', genre: 'note', messageId: 'ZZ-MSG-D2' }],
    photos: [],
    choix: {
      articleId: 'ZZ-D-A2', faconId: 'ZZ-D-F1', pourquoi: 'stable sur une heure, au dix-millième', le: '2026-11-10T10:00:00.000Z', aRevoirSi: 'un portable aussi stable sort',
      ecartes: [{ articleId: 'ZZ-D-A3', raison: 'lecture à l’œil' }],
      remplaces: [{ articleId: 'ZZ-D-A1', faconId: 'ZZ-D-F1', pourquoi: 'le moins cher des numériques', le: '2026-10-12T10:00:00.000Z', ecartes: [{ articleId: 'ZZ-D-A3', raison: 'lecture à l’œil' }], remplaces: [] }]
    }
  });
}

/**
 * P20 (G35, R23, g4:v02-18) : une idée proche de Ventilation (même nom de façon, même salle), sans article : « N articles en veille : les
 * déplacer dans Extraction… · Déplacer » a sa cible quand on supprime Ventilation (`carnetProche`).
 */
function extraction(): CarnetDoc {
  return carnet(ID_EXTRACTION, 'Extracteur pour la salle de fermentation', 'idea', {
    creeLe: '2026-11-16T08:00:00.000Z', phrase: 'sortir le CO₂ de la salle de fermentation avec un extracteur mural',
    criteres: [], facons: [{ id: 'ZZ-X-F1', nom: 'Extracteur mural seul', etat: 'ouverte', origine: 'exemple' }], articles: [], notes: [], photos: []
  });
}

function messages(): MessageDoc[] {
  return [
    message('ZZ-MSG-B1', 'embouteillage', '2026-10-20T08:00:00.000Z', 'liste', [{ carnetId: ID_EMBOUTEILLAGE, cible: 'carnet', id: ID_EMBOUTEILLAGE }]),
    message('ZZ-MSG-B2', 'gravité 4 becs vu chez un collègue, pas mal', '2026-10-21T08:00:00.000Z', ID_EMBOUTEILLAGE, [{ carnetId: ID_EMBOUTEILLAGE, cible: 'note', id: 'ZZ-B-N1' }, { carnetId: ID_EMBOUTEILLAGE, cible: 'facon', id: 'ZZ-B-F1' }]),
    message('ZZ-MSG-B3', 'il faut minimiser l’oxygène', '2026-10-22T08:00:00.000Z', ID_EMBOUTEILLAGE, [{ carnetId: ID_EMBOUTEILLAGE, cible: 'critere', id: 'ZZ-B-K1' }]),
    message('ZZ-MSG-F1', 'frigo de garde pour fûts', '2026-09-30T08:00:00.000Z', 'liste', [{ carnetId: ID_FRIGO, cible: 'carnet', id: ID_FRIGO }]),
    message('ZZ-MSG-F2', 'la porte du local fait 80 cm', '2026-10-01T08:00:00.000Z', ID_FRIGO, [{ carnetId: ID_FRIGO, cible: 'note', id: 'ZZ-F-N1' }, { carnetId: ID_FRIGO, cible: 'critere', id: 'ZZ-F-K2' }]),
    // P15 : sa phrase d'origine, « plus de condensation au plafond » comprise, reste dans le message (R25) ; le critère K1 la met en forme.
    message('ZZ-MSG-V1', 'buées au-dessus de la cuve, plus de condensation au plafond', '2026-11-02T08:00:00.000Z', 'liste', [{ carnetId: ID_VENTILATION, cible: 'carnet', id: ID_VENTILATION }, { carnetId: ID_VENTILATION, cible: 'critere', id: 'ZZ-V-K1' }]),
    message('ZZ-MSG-V2', 'attendre l’avis du ferblantier', '2026-11-12T08:00:00.000Z', ID_VENTILATION, [{ carnetId: ID_VENTILATION, cible: 'note', id: 'ZZ-V-N1' }]),
    message('ZZ-MSG-V3', PHRASE_TITRE_PROPOSE, '2026-11-14T08:00:00.000Z', ID_VENTILATION, [{ carnetId: ID_VENTILATION, cible: 'note', id: 'ZZ-V-N2' }],
      { carnetId: ID_VENTILATION, titre: TITRE_PROPOSE_VENTILATION }),
    message('ZZ-MSG-V4', NOTE_COMME_CRITERE, '2026-11-15T08:00:00.000Z', ID_VENTILATION, [{ carnetId: ID_VENTILATION, cible: 'note', id: 'ZZ-V-N3' }]),
    message('ZZ-MSG-X1', 'sortir le CO₂ de la salle de fermentation avec un extracteur mural', '2026-11-16T08:00:00.000Z', 'liste', [{ carnetId: ID_EXTRACTION, cible: 'carnet', id: ID_EXTRACTION }]),
    message('ZZ-MSG-E1', '2 bacs pour laver les fûts', '2026-11-15T17:00:00.000Z', 'liste', [{ carnetId: ID_EVIER, cible: 'carnet', id: ID_EVIER }, { carnetId: ID_EVIER, cible: 'critere', id: 'ZZ-E-K1' }, { carnetId: ID_EVIER, cible: 'critere', id: 'ZZ-E-K2' }]),
    message('ZZ-MSG-D1', 'mesurer la densité finale au millième près', '2026-10-05T08:00:00.000Z', 'liste', [{ carnetId: ID_DENSIMETRE, cible: 'carnet', id: ID_DENSIMETRE }, { carnetId: ID_DENSIMETRE, cible: 'critere', id: 'ZZ-D-K1' }]),
    message('ZZ-MSG-D2', 'le portable dérive de 2 millièmes au bout d’une heure', '2026-11-09T08:00:00.000Z', ID_DENSIMETRE, [{ carnetId: ID_DENSIMETRE, cible: 'note', id: 'ZZ-D-N1' }, { carnetId: ID_DENSIMETRE, cible: 'critere', id: 'ZZ-D-K2' }])
  ];
}

/**
 * Les 30 phrases d'essai de l'analyse locale (A4) et de G9 (A13) : embouteillage, frigo, ventilation, évier, et les trois notes de son
 * téléphone (`ref/note-sol-local.jpg`, `note-ajoute-prevision.jpg`, `note-prochain-brassage.jpg`) transcrites. `url` et `centimes` : ce qui
 * doit être lu, exactement (absent = rien à lire). Prix et liens : exemples.
 */
export const PHRASES_ESSAI: readonly { texte: string; urls?: string[]; centimes?: number; devise?: 'CHF' | 'EUR' }[] = [
  { texte: 'embouteillage' },
  { texte: 'gravité 4 becs vu chez un collègue, pas mal' },
  { texte: 'il faut minimiser l’oxygène' },
  { texte: 'https://exemple.invalid/iso-4 Isobarique 4 becs 11\'700.–', urls: ['https://exemple.invalid/iso-4'], centimes: 1170000 },
  { texte: 'Isobarique 2 becs de table CHF 1\'850.- chez Enotecnica', centimes: 185000 },
  { texte: 'monobloc 6 becs vu à 21 500 CHF, trop cher', centimes: 2150000 },
  { texte: 'remplisseuse manuelle 190 € sur brauladen.de/remplisseuse', urls: ['https://brauladen.de/remplisseuse'], centimes: 19000, devise: 'EUR' },
  { texte: 'frigo de garde pour fûts' },
  { texte: 'la porte du local fait 80 cm' },
  { texte: 'chambre froide 2 m³ à 4\'900.– chez Froid Léman', centimes: 490000 },
  { texte: 'tenir 2 °C stable en été' },
  { texte: 'vitrine 700 L d’occasion Fr. 650.-', centimes: 65000 },
  { texte: 'www.exemple.invalid/vitrine (vue hier)', urls: ['https://www.exemple.invalid/vitrine'] },
  { texte: 'buées au-dessus de la cuve' },
  { texte: 'hotte inox 120 cm, 1800 m³/h, 2\'600 CHF', centimes: 260000 },
  { texte: 'extracteur mural https://exemple.invalid/v3.', urls: ['https://exemple.invalid/v3'] },
  { texte: 'attendre l’avis du ferblantier' },
  { texte: 'Extracteur centrifuge 690 CHF, 49 dB', centimes: 69000 },
  { texte: 'tient 80 °C ?' },
  { texte: '2 bacs pour laver les fûts' },
  { texte: 'fond de bac 38 cm minimum' },
  { texte: 'évier inox 2 bacs à poser 1\'450.–', centimes: 145000 },
  { texte: 'évier sur pieds (gastro-inox.de/spuele) 890 €', urls: ['https://gastro-inox.de/spuele'], centimes: 89000, devise: 'EUR' },
  { texte: 'douchette à 45.50 CHF', centimes: 4550 },
  { texte: 'Sol local\nRouleau qui pousse plutôt qui absorbe.\n2 couches, petit pinceau ou plus facile. Tout jetter...\nPlus gros seau ?\nPetit récipient pour transférer' },
  { texte: 'Ajoute\nPrévision prix pour prochains brassin + ajout aussi de combien l’estimation d’upgrade dans le dashboard principal' },
  { texte: 'À faire au prochain brassage\nPrédictions de coûts\nCoûts et visu, tout est déjà payer\nHoublon\nLevures\nVolume' },
  /* critique 5 (n° 7) : la note de 3 lignes et 2 carnets remplace « Plus gros seau ? », déjà une ligne de la note « Sol local » ci-dessus */
  { texte: NOTE_VRAC_DEUX_CARNETS },
  { texte: 'commander 2 fûts de 20 L à 85 CHF pièce', centimes: 8500 },
  { texte: 'lien : https://exemple.invalid/f1?ref=12, prix 4 900 CHF', urls: ['https://exemple.invalid/f1?ref=12'], centimes: 490000 }
];

/**
 * Banc `&articles=1|2` (état 52, G20) : Ventilation, le carnet de comparaison, réduit à 1 article (pas de tableau) ou à 2 (le tableau
 * naît). On garde, dans cet ordre, Hotte inox 120 cm (façon Hotte) puis Extracteur mural (façon Extracteur) : deux articles lus, en lice,
 * de deux façons ; la façon écartée et ses articles partent, pour que le tableau n'ait que ces lignes.
 */
export const ARTICLES_REDUITS = ['ZZ-V-A1', 'ZZ-V-A3'] as const;

export interface OptionsFixture {
  /** 1 ou 2 : Ventilation réduite (état 52). Toute autre valeur : la fixture entière. */
  articles?: number;
  /**
   * Critique 5, n° 21 : la bulle G8 ne vise qu'une caractéristique que les deux premiers n'ont pas. Vrai : Ventilation reçoit « pas trop de
   * bruit » (bruit, dB, proposé par l'IA), qu'aucune page n'a donné ; G8 la propose. Défaut : absent (Ventilation n'a rien à trancher).
   */
  g8?: boolean;
  /**
   * Critique 5, n° 27 : G35 ne propose qu'un carnet de même catégorie d'objet. Vrai : une 2e idée de ventilation (« Ventilation de la
   * cave de garde ») reçoit les articles en veille. Défaut : absente (Ventilation n'a pas de carnet proche ; l'extracteur CO₂ n'en est pas un).
   */
  g35?: boolean;
}

export const ID_VENTILATION_CAVE = 'ZZ-CARNET-VENTILATION-CAVE';
/** Le critère de G8 (option `g8`) : une caractéristique mesurable, inconnue des deux premiers articles. */
export const CRITERE_BRUIT = 'pas trop de bruit';

function ventilationCave(): CarnetDoc {
  return carnet(ID_VENTILATION_CAVE, 'Ventilation de la cave de garde', 'idea', {
    creeLe: '2026-11-17T08:00:00.000Z', phrase: 'renouveler l’air de la cave de garde', criteres: [], facons: [], articles: [], notes: [], photos: []
  });
}

/**
 * Tour 3, f4c (PCN-20 ; critique 6, n° 31) : la 2e idée du MÊME besoin (la salle), seule cible de G35 quand on supprime Ventilation ;
 * la cave de garde (autre besoin) et l'extracteur CO₂ (autre objet) ne le sont jamais.
 */
export const ID_VENTILATION_SALLE_2 = 'ZZ-CARNET-VENTILATION-SALLE-2';
function ventilationSalle2(): CarnetDoc {
  return carnet(ID_VENTILATION_SALLE_2, 'Ventilation de la salle de brassage, 2e idée', 'idea', {
    creeLe: '2026-11-18T08:00:00.000Z', phrase: 'une autre façon de ventiler la salle de brassage', criteres: [], facons: [], articles: [], notes: [], photos: []
  });
}

/** Les documents de la fixture (idées et messages), copies neuves à chaque appel. */
export function fixtureCarnets(o: OptionsFixture = {}): CreativeItem[] {
  const v = ventilation();
  if (o.articles === 1 || o.articles === 2) {
    const garde = new Set<string>(ARTICLES_REDUITS.slice(0, o.articles));
    v.carnet.articles = v.carnet.articles.filter(a => garde.has(a.id));
    v.carnet.facons = v.carnet.facons.filter(f => f.etat !== 'ecartee');
  }
  if (o.g8) {
    /* critique 6, n° 17 : « pas trop de bruit » ne tranche que si un 3e article le porte (valeurs d'exemple, marquées) */
    const bruit: Record<string, Valeur> = { 'ZZ-V-A3': ex(62, 'dB'), 'ZZ-V-A4': ex(58, 'dB') };
    for (const a of v.carnet.articles) if (bruit[a.id]) a.valeurs = { ...(a.valeurs ?? {}), bruit: bruit[a.id] };
  }
  if (o.g8) v.carnet.criteres.push({ id: 'ZZ-V-K4', texte: CRITERE_BRUIT, caracteristique: { nom: 'bruit', unite: 'dB', sens: 'moins' }, origine: 'ia', source: 'ia' });
  return JSON.parse(JSON.stringify([v, evier(), embouteillage(), frigo(), densimetre(), extraction(), ...(o.g35 ? [ventilationCave(), ventilationSalle2()] : []), ...messages()])) as CreativeItem[];
}

const planDe = (id: string, titre: string, carnetId: string, cents: number, vendor: string, createdAt: string): FinancialPlan => ({
  id, title: `${PREFIXE_BANC}${titre}`, date: '', amountCents: cents, direction: 'out', category: 'materiel', source: 'equipment', status: 'draft', createdAt, vendor,
  upgrade: { version: 1, timing: 'soon', stage: 'ready', budgetKnown: true, datePrecision: 'month', estimateSource: 'estimate', purchaseCents: cents, deliveryCents: 0, installationCents: 0, sourceCarnetId: carnetId, sourceCarnetTitre: `${PREFIXE_BANC}${titre}` }
});

/** Le plan d'À venir du Frigo (« Dans À venir depuis le 16 nov. »), sans dépense : il est à venir. */
export function fixturePlans(): FinancialPlan[] {
  return [planDe(ID_PLAN_FRIGO, 'Frigo de garde pour fûts', ID_FRIGO, 490000, 'Froid Léman', '2026-11-16T10:00:00.000Z')];
}

/**
 * Variante « plan réalisé » (Suppression v2, D-47b) : l'Embouteillage envoyé dans À venir, avec une dépense liée payée en entier (exemple).
 * `estRealise` est vrai : seul « Archiver » est proposé.
 */
export function fixturePlanRealise(): { items: CreativeItem[]; plans: FinancialPlan[]; transactions: FinanceTransaction[]; payments: FinancialPayment[] } {
  const items = fixtureCarnets().map(d => (d.id === ID_EMBOUTEILLAGE ? { ...d, carnet: { ...d.carnet!, sortie: { planId: ID_PLAN_EMBOUTEILLAGE, le: '2026-11-15T10:00:00.000Z' } } } : d));
  const plan = planDe(ID_PLAN_EMBOUTEILLAGE, 'Embouteillage', ID_EMBOUTEILLAGE, 1170000, 'Brassage Romandie', '2026-11-15T10:00:00.000Z');
  const transaction = {
    id: 'ZZ-TX-EMBOUTEILLAGE', date: '2026-11-16', description: `${PREFIXE_BANC}Facture embouteilleuse (exemple)`, category: 'materiel', subcategory: '',
    amountHT: 11700, amountTTC: 11700, tvaRate: 0, tvaAmount: 0,
    finance: { version: 1, kind: 'expense', amountCents: 1170000, planId: ID_PLAN_EMBOUTEILLAGE, paymentStatus: 'paid', lines: [{ id: '1', kind: 'equipment', description: 'Achat', amountCents: 1170000 }] }
  } as unknown as FinanceTransaction;
  const paiement: FinancialPayment = { id: 'ZZ-PAY-EMBOUTEILLAGE', transactionId: transaction.id, date: '2026-11-16', amountCents: 1170000, direction: 'out', method: 'bank', recordedAt: '2026-11-16T10:00:00.000Z' };
  return { items, plans: [...fixturePlans(), plan], transactions: [transaction], payments: [paiement] };
}

/* ---------- D451 : le suivi d'un problème (3 histoires et 3 usages de la maquette, 4 cas neufs) ---------- */

/** « Aujourd'hui » de la fixture du suivi : un mardi ; la semaine va du 23 au 29 nov. 2026. */
export const MAINTENANT_SUIVI = '2026-11-24T12:00:00.000Z';
export const ANNEE_SUIVI = 2026;
/**
 * Les carnets de la fixture du suivi. Tout est **exemple** (titres « ZZ TEST — », `origine: 'exemple'`, liens `exemple.invalid`) : produits, prix,
 * dates et entreprises sont inventés pour le banc, aucun ne vient de ses données.
 * Histoires : vapeur (décidé, 4 options, 2 photos), écoulement (je cherche, devis), CO2 (décidé, cause trouvée). Usages : fusible (inspection,
 * photo, tâches), malt (options retenue, veille, piste, écartée), moisissure et fenêtre (notés, sans suivi écrit). Cas neufs : fête, assurance,
 * photo seule, chambre froide sans suivi (ancien carnet, état dérivé). Plus : deux résolus de l'année, un projet du Planning.
 */
export const IDS_SUIVI = {
  vapeur: 'ZZ-SUIVI-VAPEUR', ecoulement: 'ZZ-SUIVI-ECOULEMENT', co2: 'ZZ-SUIVI-CO2', fusible: 'ZZ-SUIVI-FUSIBLE', malt: 'ZZ-SUIVI-MALT', moisissure: 'ZZ-SUIVI-MOISISSURE', fenetre: 'ZZ-SUIVI-FENETRE',
  fete: 'ZZ-SUIVI-FETE', assurance: 'ZZ-SUIVI-ASSURANCE', photo: 'ZZ-SUIVI-PHOTO', chambreFroide: 'ZZ-SUIVI-CHAMBRE-FROIDE', pompe: 'ZZ-SUIVI-POMPE', joint: 'ZZ-SUIVI-JOINT', planning: 'CARNET-PLANNING-ZZ-SUIVI'
} as const;
/** Les options de vapeur (ids stables pour les tests). */
export const OPTIONS_VAPEUR = { condB: 'ZZ-SUIVI-VAPEUR-FB', condA: 'ZZ-SUIVI-VAPEUR-FA', hotte: 'ZZ-SUIVI-VAPEUR-FH', humid: 'ZZ-SUIVI-VAPEUR-FU' } as const;
export const OPTIONS_MALT = { autre: 'ZZ-SUIVI-MALT-FA', attendre: 'ZZ-SUIVI-MALT-FT', pale: 'ZZ-SUIVI-MALT-FP', decaler: 'ZZ-SUIVI-MALT-FD' } as const;

const PHOTO_SUIVI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 60" width="80" height="60"><rect width="80" height="60" fill="#d9dee2"/><path d="M10 50 L30 20 L45 40 L55 28 L72 50 Z" fill="#9aa6ad"/></svg>')}`;
const nov = (jour: number, heure = 12): string => `2026-11-${String(jour).padStart(2, '0')}T${String(heure).padStart(2, '0')}:00:00.000Z`;

interface MsgSuivi { id: string; le: string; texte: string; photo?: true; et?: { sorte: Etiquette['sorte']; texte?: string; montantCentimes?: number; estime?: true; optionId?: string }[] }

/** Les notes, photos et messages d'un carnet : chaque message range une note (et une photo), comme le rangement le fait. */
function filSuivi(carnetId: string, specs: readonly MsgSuivi[]): { notes: Note[]; photos: Photo[]; messages: MessageDoc[] } {
  const notes: Note[] = [], photos: Photo[] = [], messages: MessageDoc[] = [];
  specs.forEach((s, i) => {
    const noteId = `${s.id}-N`, photoId = `${s.id}-P`;
    notes.push({ id: noteId, texte: s.texte, genre: 'note', modifieeLe: s.le, messageId: s.id });
    if (s.photo) photos.push({ id: photoId, jpeg: PHOTO_SUIVI, messageId: s.id });
    const effets: MessageDoc['carnetMessage']['effets'] = [
      ...(i === 0 ? [{ carnetId, cible: 'carnet' as const, id: carnetId }] : []), { carnetId, cible: 'note', id: noteId }, ...(s.photo ? [{ carnetId, cible: 'photo' as const, id: photoId }] : [])
    ];
    const etiquettes: Etiquette[] = (s.et ?? []).map(e => ({ carnetId, origine: 'exemple' as const, ...e, ...(e.montantCentimes !== undefined ? { devise: 'CHF' } : {}) }));
    messages.push({
      id: s.id, type: 'carnet-message', title: s.texte, status: 'done',
      carnetMessage: { texte: s.texte, le: s.le, depuis: i === 0 ? 'liste' : carnetId, rangement: 'simulee', effets, ...(etiquettes.length ? { etiquettes } : {}) }
    });
  });
  return { notes, photos, messages };
}

const evSuivi = (id: string, le: string, sorte: EvenementSuivi['sorte'], x: Partial<EvenementSuivi> = {}): EvenementSuivi => ({ id, le, sorte, ...x, origine: 'exemple' });
const optionSuivi = (id: string, nom: string, etat: EtatOption, historique: PasOption[], raison?: string): Facon => ({
  id, nom, etat: etat === 'retenue' ? 'retenue' : etat === 'ecartee' ? 'ecartee' : 'ouverte', ...(raison ? { raison } : {}), origine: 'exemple', suivi: { etat, historique }
});
const pas = (etat: EtatOption, le: string, raison?: string): PasOption => ({ etat, le, ...(raison ? { raison } : {}), origine: 'exemple' });
const tacheSuivi = (id: string, texte: string, creeeLe: string, x: Partial<Tache> = {}): Tache => ({ id, texte, ...x, origine: 'exemple', creeeLe });

function problemeSuivi(id: string, titre: string, phrase: string, creeLe: string, f: ReturnType<typeof filSuivi>, plus: Partial<DonneesCarnet>): CarnetDoc {
  return carnet(id, titre, 'idea', { creeLe, phrase, criteres: [], facons: [], articles: [], notes: f.notes, photos: f.photos, genre: { valeur: 'probleme', origine: 'ia' }, ...plus });
}

/** Les documents de la fixture du suivi (carnets et messages), copies neuves à chaque appel. */
export function fixtureSuivi(): CreativeItem[] {
  const ia = 'ia' as const;
  /* vapeur : décidé, 4 options, « écarté, 2e fois », une veille sans lien, 2 photos (avant le 3 nov., après le 22 nov.) */
  const vapeurFil = filSuivi(IDS_SUIVI.vapeur, [
    { id: 'ZZ-SV-M1', le: nov(3), texte: 'Trop de buée au plafond pendant l’ébullition. Photo du plafond.', photo: true, et: [{ sorte: 'constat' }] },
    { id: 'ZZ-SV-M2', le: nov(4), texte: 'Humidificateur : peut-être, à voir.', et: [{ sorte: 'piste', optionId: OPTIONS_VAPEUR.humid }] },
    { id: 'ZZ-SV-M3', le: nov(6), texte: 'Non, l’humidificateur ne suffit pas.', et: [{ sorte: 'ecart', optionId: OPTIONS_VAPEUR.humid }] },
    { id: 'ZZ-SV-M4', le: nov(8, 9), texte: 'Condenseur A : dispo, adapté à la cuve. 690 CHF.', et: [{ sorte: 'piste', optionId: OPTIONS_VAPEUR.condA }, { sorte: 'cout', montantCentimes: 69000, optionId: OPTIONS_VAPEUR.condA }] },
    { id: 'ZZ-SV-M5', le: nov(8, 10), texte: 'Le B, 2e meilleur, plus en stock aux États-Unis. Je mets une veille.', et: [{ sorte: 'veille', optionId: OPTIONS_VAPEUR.condB }] },
    { id: 'ZZ-SV-M6', le: nov(12), texte: 'Autre système : hotte + extracteur au plafond.', et: [{ sorte: 'piste', optionId: OPTIONS_VAPEUR.hotte }] },
    { id: 'ZZ-SV-M7', le: nov(20, 9), texte: 'Condenseur B de nouveau en stock : 540 CHF.', et: [{ sorte: 'veille', texte: 'de nouveau en stock', optionId: OPTIONS_VAPEUR.condB }, { sorte: 'cout', montantCentimes: 54000, optionId: OPTIONS_VAPEUR.condB }] },
    { id: 'ZZ-SV-M8', le: nov(20, 10), texte: 'Je le prends fin du mois.', et: [{ sorte: 'retenu', texte: 'Je le prends fin du mois', optionId: OPTIONS_VAPEUR.condB }] },
    { id: 'ZZ-SV-M9', le: nov(21), texte: 'Les humidificateurs, j’en ai quand même besoin ?', et: [{ sorte: 'piste', optionId: OPTIONS_VAPEUR.humid }] },
    { id: 'ZZ-SV-M10', le: nov(22), texte: 'Non, en fait. Photo du plafond après la pose provisoire.', photo: true, et: [{ sorte: 'ecart', optionId: OPTIONS_VAPEUR.humid }] }
  ]);
  const vapeur = problemeSuivi(IDS_SUIVI.vapeur, 'Trop de vapeur au brassage', 'buée au plafond pendant l’ébullition', nov(3), vapeurFil, {
    domaine: { valeur: 'brasserie', origine: ia }, categorie: { chemin: ['Brassage', 'Vapeur'], origine: ia },
    facons: [
      optionSuivi(OPTIONS_VAPEUR.condB, 'Condenseur B', 'retenue', [pas('piste', nov(5)), pas('veille', nov(8, 10)), pas('piste', nov(20, 9)), pas('retenue', nov(20, 10))]),
      optionSuivi(OPTIONS_VAPEUR.condA, 'Condenseur A', 'piste', [pas('piste', nov(8, 9))]),
      optionSuivi(OPTIONS_VAPEUR.hotte, 'Hotte + extracteur', 'piste', [pas('piste', nov(12))]),
      optionSuivi(OPTIONS_VAPEUR.humid, 'Humidificateur', 'ecartee', [pas('piste', nov(4)), pas('ecartee', nov(6), 'pas assez'), pas('piste', nov(21)), pas('ecartee', nov(22), 'non, en fait')], 'non, en fait')
    ],
    articles: [{ id: 'ZZ-SV-A1', url: 'https://exemple.invalid/condenseur-a', domaine: 'exemple.invalid', nom: 'Condenseur A (exemple)', prixCentimes: 69000, devise: 'CHF', faconId: OPTIONS_VAPEUR.condA, valeurs: {}, lecture: 'lue', origine: 'exemple' }],
    taches: [tacheSuivi('ZZ-SV-T1', 'Acheter le condenseur B', nov(20, 10), { echeance: '2026-11-30', precision: 'mois', coutCentimes: 54000, devise: 'CHF', optionId: OPTIONS_VAPEUR.condB })],
    suivi: {
      etat: 'decide', evenements: [
        evSuivi('ZZ-SV-E1', nov(3), 'etat', { de: 'note', vers: 'cherche' }), evSuivi('ZZ-SV-E2', nov(6), 'option', { optionId: OPTIONS_VAPEUR.humid, de: 'piste', vers: 'ecartee', raison: 'pas assez' }),
        evSuivi('ZZ-SV-E3', nov(8, 10), 'veille', { optionId: OPTIONS_VAPEUR.condB, de: 'piste', vers: 'veille' }), evSuivi('ZZ-SV-E4', nov(20, 10), 'option', { optionId: OPTIONS_VAPEUR.condB, de: 'piste', vers: 'retenue' }),
        evSuivi('ZZ-SV-E5', nov(20, 10), 'etat', { de: 'cherche', vers: 'decide' }), evSuivi('ZZ-SV-E6', nov(21), 'option', { optionId: OPTIONS_VAPEUR.humid, de: 'ecartee', vers: 'piste' }),
        evSuivi('ZZ-SV-E7', nov(22), 'option', { optionId: OPTIONS_VAPEUR.humid, de: 'piste', vers: 'ecartee', raison: 'non, en fait' })
      ]
    }
  });
  /* écoulement : je cherche, deux pas trouvé, une cause, un devis ; tâches de la semaine */
  const ecoulFil = filSuivi(IDS_SUIVI.ecoulement, [
    { id: 'ZZ-SE-M1', le: nov(2), texte: 'L’écoulement fuit sous la grille, flaque côté évier.', photo: true, et: [{ sorte: 'constat' }] },
    { id: 'ZZ-SE-M2', le: nov(2, 14), texte: 'Siphon propre. Pas ça.', et: [{ sorte: 'pas-trouve' }] },
    { id: 'ZZ-SE-M3', le: nov(3), texte: 'Joint de la grille : il tient.', et: [{ sorte: 'pas-trouve' }] },
    { id: 'ZZ-SE-M4', le: nov(9), texte: 'Plans demandés à la gérance. Pas trouvé seul, contacté l’entreprise X.', et: [{ sorte: 'contact', texte: 'gérance' }, { sorte: 'contact', texte: 'entreprise X' }] },
    { id: 'ZZ-SE-M5', le: nov(18), texte: 'Raccord desserré sous la dalle. Devis 850 CHF, + manchon PVC 110 et colle ≈ 60 CHF.', et: [{ sorte: 'cause' }, { sorte: 'trouve' }, { sorte: 'devis', montantCentimes: 85000 }, { sorte: 'cout', montantCentimes: 6000, estime: true }] }
  ]);
  const ecoulement = problemeSuivi(IDS_SUIVI.ecoulement, 'Écoulement qui fuit', 'l’écoulement fuit sous la grille', nov(2), ecoulFil, {
    domaine: { valeur: 'local', origine: ia }, categorie: { chemin: ['Eau'], origine: ia },
    taches: [
      tacheSuivi('ZZ-SE-T1', 'Répondre au devis de l’entreprise X', nov(18), { echeance: '2026-11-23', precision: 'semaine', coutCentimes: 85000, devise: 'CHF' }),
      tacheSuivi('ZZ-SE-T2', 'Acheter manchon PVC 110 + colle', nov(18), { echeance: '2026-11-23', precision: 'semaine', coutCentimes: 6000, devise: 'CHF', coutEstime: true })
    ],
    suivi: { etat: 'cherche', evenements: [evSuivi('ZZ-SE-E1', nov(2), 'etat', { de: 'note', vers: 'cherche' })] }
  });
  /* CO2 : décidé (cause trouvée), un coût estimé sans date */
  const co2Fil = filSuivi(IDS_SUIVI.co2, [
    { id: 'ZZ-SC-M1', le: nov(10), texte: 'Bouteille de 10 kg vide en 2 semaines au lieu de 6.', photo: true, et: [{ sorte: 'constat' }] },
    { id: 'ZZ-SC-M2', le: nov(10, 14), texte: 'Eau savonneuse sur les raccords : rien.', et: [{ sorte: 'pas-trouve' }] },
    { id: 'ZZ-SC-M3', le: nov(12), texte: 'Tête du fût 3 : joint en bon état.', et: [{ sorte: 'pas-trouve' }] },
    { id: 'ZZ-SC-M4', le: nov(15), texte: 'Le détendeur siffle, l’aiguille basse pression descend la nuit.', et: [{ sorte: 'cause' }, { sorte: 'trouve' }] }
  ]);
  const co2 = problemeSuivi(IDS_SUIVI.co2, 'CO2 qui baisse dans un fût', 'bouteille de CO2 vide trop vite', nov(10), co2Fil, {
    domaine: { valeur: 'brasserie', origine: ia }, categorie: { chemin: ['Fûts'], origine: ia },
    taches: [tacheSuivi('ZZ-SC-T1', 'Joint de détendeur', nov(15), { coutCentimes: 1200, devise: 'CHF', coutEstime: true })],
    suivi: { etat: 'decide', evenements: [evSuivi('ZZ-SC-E1', nov(10), 'etat', { de: 'note', vers: 'cherche' }), evSuivi('ZZ-SC-E2', nov(15), 'etat', { de: 'cherche', vers: 'decide' })] }
  });
  /* fusible : l'usage « inspection électrique » (photo, constat, tâches de la semaine et de fin de mois) */
  const fusFil = filSuivi(IDS_SUIVI.fusible, [
    { id: 'ZZ-SF-M1', le: nov(24, 9), texte: 'Inspection électrique : un fusible du tableau à revoir. Besoin de matériel adapté.', photo: true, et: [{ sorte: 'constat' }] }
  ]);
  const fusible = problemeSuivi(IDS_SUIVI.fusible, 'Fusible du tableau', 'un fusible du tableau à revoir', nov(24, 9), fusFil, {
    domaine: { valeur: 'local', origine: ia }, categorie: { chemin: ['Électricité'], origine: ia },
    taches: [
      tacheSuivi('ZZ-SF-T1', 'Acheter un testeur de tension', nov(24, 9), { echeance: '2026-11-23', precision: 'semaine', coutCentimes: 3500, devise: 'CHF', coutEstime: true }),
      tacheSuivi('ZZ-SF-T2', 'Fusibles de rechange ×5', nov(24, 9), { echeance: '2026-11-30', precision: 'mois', coutCentimes: 2500, devise: 'CHF', coutEstime: true })
    ],
    suivi: { etat: 'cherche', evenements: [evSuivi('ZZ-SF-E1', nov(24, 9), 'etat', { de: 'note', vers: 'cherche' })] }
  });
  /* malt : options retenue, veille (sans article), piste, écartée */
  const maltFil = filSuivi(IDS_SUIVI.malt, [
    { id: 'ZZ-SM-M1', le: nov(18), texte: 'Pils 25 kg en rupture chez le fournisseur. Brassin prévu en S49.', et: [{ sorte: 'constat' }] },
    { id: 'ZZ-SM-M2', le: nov(18, 14), texte: 'Je mets une veille sur le retour en stock.', et: [{ sorte: 'veille', optionId: OPTIONS_MALT.attendre }] },
    { id: 'ZZ-SM-M3', le: nov(19), texte: 'Malt pale à la place ? Ça change la couleur et le goût.', et: [{ sorte: 'piste', optionId: OPTIONS_MALT.pale }] },
    { id: 'ZZ-SM-M4', le: nov(21), texte: 'Décaler le brassin : non, les fûts sont réservés.', et: [{ sorte: 'ecart', optionId: OPTIONS_MALT.decaler }] },
    { id: 'ZZ-SM-M5', le: nov(22), texte: 'Autre fournisseur, 4 CHF de plus par sac. Je commande le 26.', et: [{ sorte: 'retenu', optionId: OPTIONS_MALT.autre }] }
  ]);
  const malt = problemeSuivi(IDS_SUIVI.malt, 'Malt pils en rupture', 'pils 25 kg en rupture', nov(18), maltFil, {
    domaine: { valeur: 'brasserie', origine: ia }, categorie: { chemin: ['Matières'], origine: ia },
    facons: [
      optionSuivi(OPTIONS_MALT.autre, 'Autre fournisseur', 'retenue', [pas('retenue', nov(22))]), optionSuivi(OPTIONS_MALT.attendre, 'Attendre', 'veille', [pas('veille', nov(18, 14))]),
      optionSuivi(OPTIONS_MALT.pale, 'Malt pale', 'piste', [pas('piste', nov(19))]), optionSuivi(OPTIONS_MALT.decaler, 'Décaler S49', 'ecartee', [pas('ecartee', nov(21), 'les fûts sont réservés')], 'les fûts sont réservés')
    ],
    taches: [tacheSuivi('ZZ-SM-T1', 'Commander le pils chez l’autre fournisseur', nov(22), { echeance: '2026-11-23', precision: 'semaine', optionId: OPTIONS_MALT.autre })],
    suivi: { etat: 'decide', evenements: [evSuivi('ZZ-SM-E1', nov(18), 'etat', { de: 'note', vers: 'cherche' }), evSuivi('ZZ-SM-E2', nov(22), 'etat', { de: 'cherche', vers: 'decide' })] }
  });
  /* moisissure et fenêtre : des constats courts, aucun suivi écrit (l'état « noté » se dérive) */
  const court = (id: string, titre: string, phrase: string, jour: number, chemin: string[]): { carnet: CarnetDoc; messages: MessageDoc[] } => {
    const f = filSuivi(id, [{ id: `${id}-M1`, le: nov(jour), texte: phrase, et: [{ sorte: 'constat' }] }]);
    return { carnet: problemeSuivi(id, titre, phrase, nov(jour), f, { domaine: { valeur: 'local', origine: ia }, categorie: { chemin, origine: ia } }), messages: f.messages };
  };
  const moisi = court(IDS_SUIVI.moisissure, 'Moisissure dans un coin', 'moisissure dans un coin de la salle', 14, ['Bâtiment']);
  const fenetre = court(IDS_SUIVI.fenetre, 'Fenêtre qui ferme mal', 'la fenêtre ferme mal', 16, ['Bâtiment']);
  /* cas neuf : une fête (genre idée, pistes), une assurance (genre mémo, décidée, échéance fin décembre) */
  const feteFil = filSuivi(IDS_SUIVI.fete, [{ id: 'ZZ-SX-M1', le: nov(19), texte: 'Fête de la brasserie le 14 juin : tireuse, 4 fûts, food truck ?', et: [{ sorte: 'piste', texte: 'tireuse' }, { sorte: 'piste', texte: 'food truck' }] }]);
  const fete = carnet(IDS_SUIVI.fete, 'Fête de la brasserie, 14 juin', 'idea', {
    creeLe: nov(19), phrase: 'Fête de la brasserie le 14 juin', criteres: [], articles: [], notes: feteFil.notes, photos: [], genre: { valeur: 'idee', origine: ia }, domaine: { valeur: 'brasserie', origine: ia },
    categorie: { chemin: ['Événements'], origine: ia },
    facons: [optionSuivi('ZZ-SX-F1', 'Tireuse', 'piste', [pas('piste', nov(19))]), optionSuivi('ZZ-SX-F2', 'Food truck', 'piste', [pas('piste', nov(19))])],
    suivi: { etat: 'cherche', evenements: [evSuivi('ZZ-SX-E1', nov(19), 'etat', { de: 'note', vers: 'cherche' })] }
  });
  const assurFil = filSuivi(IDS_SUIVI.assurance, [{ id: 'ZZ-SA-M1', le: nov(20), texte: 'Assurance RC à renouveler : je la garde, échéance 31 déc.', et: [{ sorte: 'retenu', texte: 'je la garde' }] }]);
  const assurance = carnet(IDS_SUIVI.assurance, 'Assurance RC à renouveler', 'idea', {
    creeLe: nov(20), phrase: 'Assurance RC à renouveler', criteres: [], articles: [], notes: assurFil.notes, photos: [], genre: { valeur: 'memo', origine: ia }, domaine: { valeur: 'papiers', origine: ia },
    categorie: { chemin: ['Assurances'], origine: ia }, facons: [optionSuivi('ZZ-SA-F1', 'La garder', 'retenue', [pas('retenue', nov(20))])],
    taches: [tacheSuivi('ZZ-SA-T1', 'Renouveler l’assurance RC', nov(20), { echeance: '2026-12-28', precision: 'mois' })],
    suivi: { etat: 'decide', evenements: [evSuivi('ZZ-SA-E1', nov(20), 'etat', { de: 'note', vers: 'decide' })] }
  });
  /* cas neuf : une photo seule, sans texte : ni domaine, ni genre, ni suivi (reste dans « À ranger », état noté) */
  const photoSeule = carnet(IDS_SUIVI.photo, 'Photo du 24 nov.', 'idea', {
    creeLe: nov(24, 11), phrase: '', criteres: [], facons: [], articles: [], notes: [], photos: [{ id: 'ZZ-SP-P1', jpeg: PHOTO_SUIVI, messageId: 'ZZ-SP-M1' }]
  });
  const photoMsg: MessageDoc = {
    id: 'ZZ-SP-M1', type: 'carnet-message', title: 'photo', status: 'done',
    carnetMessage: { texte: '', le: nov(24, 11), depuis: 'liste', rangement: 'simulee', effets: [{ carnetId: IDS_SUIVI.photo, cible: 'carnet', id: IDS_SUIVI.photo }, { carnetId: IDS_SUIVI.photo, cible: 'photo', id: 'ZZ-SP-P1' }] }
  };
  /* cas neuf : une chambre froide d'avant le suivi (articles, aucun suivi, genre ni catégorie : tout se dérive) */
  const chambreFroide = carnet(IDS_SUIVI.chambreFroide, 'Chambre froide', 'research', {
    creeLe: '2026-10-20T12:00:00.000Z', phrase: 'une chambre froide pour la cave', criteres: [], notes: [], photos: [], domaine: { valeur: 'brasserie', origine: ia },
    facons: [{ id: 'ZZ-SCF-F1', nom: 'Modèle 6 m³', etat: 'ouverte', origine: 'exemple' }],
    articles: [
      { id: 'ZZ-SCF-A1', url: 'https://exemple.invalid/froid-6', domaine: 'exemple.invalid', nom: 'Chambre froide 6 m³ (exemple)', prixCentimes: 480000, devise: 'CHF', faconId: 'ZZ-SCF-F1', valeurs: {}, lecture: 'lue', origine: 'exemple' },
      { id: 'ZZ-SCF-A2', url: 'https://exemple.invalid/froid-8', domaine: 'exemple.invalid', nom: 'Chambre froide 8 m³ (exemple)', prixCentimes: 590000, devise: 'CHF', valeurs: {}, lecture: 'lue', origine: 'exemple' }
    ]
  });
  /* deux résolus de l'année (14 oct., 16 nov.) pour « résolus 2026 » */
  const resolu = (id: string, titre: string, creeLe: string, le: string, texte: string): CarnetDoc => carnet(id, titre, 'idea', {
    creeLe, phrase: titre, criteres: [], facons: [], articles: [], notes: [], photos: [], genre: { valeur: 'probleme', origine: ia }, domaine: { valeur: 'brasserie', origine: ia }, categorie: { chemin: ['Transfert'], origine: ia },
    suivi: { etat: 'resolu', evenements: [evSuivi(`${id}-E1`, le, 'resolu', { de: 'cherche', vers: 'resolu' })], resolu: { le, par: { sorte: 'texte', texte } } }
  });
  const pompe = resolu(IDS_SUIVI.pompe, 'Pompe qui cavite', '2026-10-02T12:00:00.000Z', '2026-10-14T12:00:00.000Z', 'crépine nettoyée');
  const joint = resolu(IDS_SUIVI.joint, 'Joint de vanne', '2026-11-04T12:00:00.000Z', nov(16), 'joint changé');
  /* un projet du Planning : sa note de dates se lit comme une bulle du fil et une tâche dérivée */
  const planning = carnet(IDS_SUIVI.planning, 'Rangement et étagères inox', 'idea', {
    creeLe: '2026-11-01T12:00:00.000Z', phrase: 'Rangement et étagères inox', criteres: [], facons: [], articles: [], photos: [],
    notes: [{ id: 'ZZ-SPL-N1', texte: 'À faire du 01.12.2026 au 15.01.2027 (Planning, Structure)', genre: 'a-faire' }]
  });
  const tous = [vapeur, ecoulement, co2, fusible, malt, moisi.carnet, fenetre.carnet, fete, assurance, photoSeule, chambreFroide, pompe, joint, planning];
  const messages = [...vapeurFil.messages, ...ecoulFil.messages, ...co2Fil.messages, ...fusFil.messages, ...maltFil.messages, ...moisi.messages, ...fenetre.messages, ...feteFil.messages, ...assurFil.messages, photoMsg];
  return JSON.parse(JSON.stringify([...tous, ...messages])) as CreativeItem[];
}
