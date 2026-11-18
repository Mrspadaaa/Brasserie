/**
 * Carnet d'idées : la fixture du banc et des tests. Cinq carnets « ZZ TEST — … » qui reprennent les écrans figés (p2:g05-1, i06-1,
 * h05-3, h03-5, h01-6, g01-8, g05-11) : Ventilation (À comparer), Évier (Idée), Embouteillage et Frigo (Choisi, Frigo dans À venir),
 * Densimètre (Choisi, choix revu : état 29, R34). Titres stables pour le rejeu : `TITRES_BANC`.
 * Tout est **exemple** : noms, vendeurs, prix et valeurs portent `origine: 'exemple'` ; les liens visent `exemple.invalid` (aucun site réel).
 * Les veilles sont allumées par lui (R31) : `{ active, depuis }`, jamais de `releveLe` (aucune relève simulée montrée).
 */
import type { CreativeItem } from '../../types';
import type { FinanceTransaction, FinancialPayment, FinancialPlan } from '../finance/types';
import type { Article, CarnetDoc, DonneesCarnet, MessageDoc, Valeur } from './modele';

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
  return JSON.parse(JSON.stringify([v, evier(), embouteillage(), frigo(), densimetre(), extraction(), ...(o.g35 ? [ventilationCave()] : []), ...messages()])) as CreativeItem[];
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
