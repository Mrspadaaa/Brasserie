/**
 * Carnet d'idées : la fixture du banc et des tests. Quatre carnets « ZZ TEST — … » qui reprennent les écrans figés (p2:g05-1, i06-1,
 * h05-3, h03-5, h01-6, g01-8, g05-11) : Ventilation (À comparer), Évier (Idée), Embouteillage et Frigo (Choisi, Frigo dans À venir).
 * Tout est **exemple** : noms, vendeurs, prix et valeurs portent `origine: 'exemple'` ; les liens visent `exemple.invalid` (aucun site réel).
 * Les veilles sont allumées par lui (R31) : `{ active, depuis }`, jamais de `releveLe` (aucune relève simulée montrée).
 */
import type { CreativeItem } from '../../types';
import type { FinanceTransaction, FinancialPayment, FinancialPlan } from '../finance/types';
import type { Article, CarnetDoc, DonneesCarnet, MessageDoc, Valeur } from './modele';

export const PREFIXE_BANC = 'ZZ TEST — ';

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

export const ID_VENTILATION = 'ZZ-CARNET-VENTILATION';
export const ID_EVIER = 'ZZ-CARNET-EVIER';
export const ID_EMBOUTEILLAGE = 'ZZ-CARNET-EMBOUTEILLAGE';
export const ID_FRIGO = 'ZZ-CARNET-FRIGO';
export const ID_PLAN_FRIGO = 'ZZ-PLAN-FRIGO';
export const ID_PLAN_EMBOUTEILLAGE = 'ZZ-PLAN-EMBOUTEILLAGE';

function ventilation(): CarnetDoc {
  return carnet(ID_VENTILATION, 'Ventilation de la salle de brassage', 'research', {
    creeLe: '2026-11-02T08:00:00.000Z', phrase: 'buées au-dessus de la cuve',
    criteres: [
      { id: 'ZZ-V-K1', texte: 'plus de condensation au plafond', origine: 'vous', messageId: 'ZZ-MSG-V1' },
      { id: 'ZZ-V-K2', texte: 'tient 80 °C', caracteristique: { nom: 'tient 80 °C', sens: 'oui-non' }, origine: 'exemple' },
      { id: 'ZZ-V-K3', texte: 'le débit', caracteristique: { nom: 'débit', unite: 'm³/h', sens: 'plus' }, origine: 'exemple' }
    ],
    facons: [
      { id: 'ZZ-V-F1', nom: 'Hotte inox + extracteur', etat: 'ouverte', origine: 'exemple' },
      { id: 'ZZ-V-F2', nom: 'Extracteur mural seul', etat: 'ouverte', origine: 'exemple' },
      // D-52, R06 : une façon écartée, avec sa raison ; son article reste à la fin du tableau de Comparer.
      { id: 'ZZ-V-F3', nom: 'Ventilateur de plafond', etat: 'ecartee', raison: 'brasse la buée sans la sortir', origine: 'exemple' }
    ],
    articles: [
      article({ id: 'ZZ-V-A1', url: lien('v1'), nom: 'Hotte inox 120 cm + moteur', prixCentimes: 260000, vendeur: 'Inox Broye', pays: 'CH', dispo: 'en stock', faconId: 'ZZ-V-F1', valeurs: { 'débit': ex(1800, 'm³/h'), 'tient 80 °C': ex(true) } }),
      article({ id: 'ZZ-V-A2', url: lien('v2'), nom: 'Hotte murale 100 cm', prixCentimes: 145000, vendeur: 'Gastro Lüftung', pays: 'DE', dispo: 'délai 4 semaines', faconId: 'ZZ-V-F1', valeurs: { 'débit': ex(1200, 'm³/h'), 'tient 80 °C': ex(true) }, veille: { active: true, depuis: '2026-11-04T09:00:00.000Z' } }),
      article({ id: 'ZZ-V-A3', url: lien('v3'), nom: 'Extracteur mural hélicoïde', prixCentimes: 42000, vendeur: 'Ventil Jura', pays: 'CH', dispo: 'en stock', faconId: 'ZZ-V-F2', valeurs: { 'débit': ex(1500, 'm³/h'), 'tient 80 °C': ex(false) } }),
      article({ id: 'ZZ-V-A4', url: lien('v4'), nom: 'Extracteur centrifuge en ligne', prixCentimes: 69000, vendeur: 'Aéro Rhône', pays: 'FR', dispo: 'en stock', faconId: 'ZZ-V-F2', valeurs: { 'débit': ex(1100, 'm³/h') } }),
      article({ id: 'ZZ-V-A5', url: lien('v5'), valeurs: {} }),
      article({ id: 'ZZ-V-A6', url: lien('v6'), nom: 'Ventilateur de plafond 130 cm', prixCentimes: 18000, vendeur: 'Ventil Jura', pays: 'CH', dispo: 'en stock', faconId: 'ZZ-V-F3', valeurs: { 'tient 80 °C': ex(false) } })
    ].map(a => ({ ...a, origine: 'exemple' as const })),
    notes: [
      { id: 'ZZ-V-N1', texte: 'attendre l’avis du ferblantier', genre: 'a-faire', messageId: 'ZZ-MSG-V2' },
      { id: 'ZZ-V-N2', texte: PHRASE_TITRE_PROPOSE, genre: 'note', messageId: 'ZZ-MSG-V3' }
    ],
    photos: []
  });
}

function evier(): CarnetDoc {
  return carnet(ID_EVIER, 'Évier inox', 'idea', {
    creeLe: '2026-11-15T17:00:00.000Z', phrase: '2 bacs pour laver les fûts',
    criteres: [
      { id: 'ZZ-E-K1', texte: '2 bacs', caracteristique: { nom: 'bacs', sens: 'plus' }, origine: 'exemple', messageId: 'ZZ-MSG-E1' },
      { id: 'ZZ-E-K2', texte: 'assez profond pour un fût', caracteristique: { nom: 'fond de bac', unite: 'cm', sens: 'plus' }, origine: 'exemple', messageId: 'ZZ-MSG-E1' }
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

function messages(): MessageDoc[] {
  return [
    message('ZZ-MSG-B1', 'embouteillage', '2026-10-20T08:00:00.000Z', 'liste', [{ carnetId: ID_EMBOUTEILLAGE, cible: 'carnet', id: ID_EMBOUTEILLAGE }]),
    message('ZZ-MSG-B2', 'gravité 4 becs vu chez un collègue, pas mal', '2026-10-21T08:00:00.000Z', ID_EMBOUTEILLAGE, [{ carnetId: ID_EMBOUTEILLAGE, cible: 'note', id: 'ZZ-B-N1' }, { carnetId: ID_EMBOUTEILLAGE, cible: 'facon', id: 'ZZ-B-F1' }]),
    message('ZZ-MSG-B3', 'il faut minimiser l’oxygène', '2026-10-22T08:00:00.000Z', ID_EMBOUTEILLAGE, [{ carnetId: ID_EMBOUTEILLAGE, cible: 'critere', id: 'ZZ-B-K1' }]),
    message('ZZ-MSG-F1', 'frigo de garde pour fûts', '2026-09-30T08:00:00.000Z', 'liste', [{ carnetId: ID_FRIGO, cible: 'carnet', id: ID_FRIGO }]),
    message('ZZ-MSG-F2', 'la porte du local fait 80 cm', '2026-10-01T08:00:00.000Z', ID_FRIGO, [{ carnetId: ID_FRIGO, cible: 'note', id: 'ZZ-F-N1' }, { carnetId: ID_FRIGO, cible: 'critere', id: 'ZZ-F-K2' }]),
    message('ZZ-MSG-V1', 'buées au-dessus de la cuve', '2026-11-02T08:00:00.000Z', 'liste', [{ carnetId: ID_VENTILATION, cible: 'carnet', id: ID_VENTILATION }, { carnetId: ID_VENTILATION, cible: 'critere', id: 'ZZ-V-K1' }]),
    message('ZZ-MSG-V2', 'attendre l’avis du ferblantier', '2026-11-12T08:00:00.000Z', ID_VENTILATION, [{ carnetId: ID_VENTILATION, cible: 'note', id: 'ZZ-V-N1' }]),
    message('ZZ-MSG-V3', PHRASE_TITRE_PROPOSE, '2026-11-14T08:00:00.000Z', ID_VENTILATION, [{ carnetId: ID_VENTILATION, cible: 'note', id: 'ZZ-V-N2' }],
      { carnetId: ID_VENTILATION, titre: TITRE_PROPOSE_VENTILATION }),
    message('ZZ-MSG-E1', '2 bacs pour laver les fûts', '2026-11-15T17:00:00.000Z', 'liste', [{ carnetId: ID_EVIER, cible: 'carnet', id: ID_EVIER }, { carnetId: ID_EVIER, cible: 'critere', id: 'ZZ-E-K1' }, { carnetId: ID_EVIER, cible: 'critere', id: 'ZZ-E-K2' }])
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
  { texte: 'Plus gros seau ?' },
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
}

/** Les documents de la fixture (idées et messages), copies neuves à chaque appel. */
export function fixtureCarnets(o: OptionsFixture = {}): CreativeItem[] {
  const v = ventilation();
  if (o.articles === 1 || o.articles === 2) {
    const garde = new Set<string>(ARTICLES_REDUITS.slice(0, o.articles));
    v.carnet.articles = v.carnet.articles.filter(a => garde.has(a.id));
    v.carnet.facons = v.carnet.facons.filter(f => f.etat !== 'ecartee');
  }
  return JSON.parse(JSON.stringify([v, evier(), embouteillage(), frigo(), ...messages()])) as CreativeItem[];
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
