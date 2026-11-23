/** Les contrats du Carnet d'idées (props, vue interne, retour affiché, annonce d'un envoi), sortis de CarnetsVue.tsx ; CarnetsVue réexporte les siens. */
import type { FinanceTransaction, FinancialPayment, FinancialPlan } from '../../domain/finance/types';
import type { CreativeItem } from '../../types';
import type { MagasinCarnets } from '../../services/carnetsStore';
import type { Destination, EcritureCarnet } from '../../domain/carnets/operations';
import type { LigneLocale, RubriqueVaDans } from '../../domain/carnets/analyseLocale';
import type { AidesCarnet, ModeCarnetIA } from '../../config/carnetIA';
import type { AppelsIA } from './rangement';
import type { BandeauV } from './Bandeau';
import type { LigneVracV } from './NoteEnVrac';

export interface FinancesCarnet { plans: FinancialPlan[]; transactions: FinanceTransaction[]; payments: FinancialPayment[] }

export interface CarnetsVueProps {
  className?: string;
  /** Le magasin ; défaut : Firestore (l'app). Le banc et les tests passent le magasin mémoire. */
  magasin?: MagasinCarnets;
  /** Plans, transactions, paiements (liens, Suppression v2) ; défaut : ceux de l'app. */
  finances?: FinancesCarnet;
  /** Écrit le plan d'À venir ; défaut : `FinanceService.saveUpgrade`. */
  ecrirePlan?: (plan: FinancialPlan) => Promise<void> | void;
  /** T11-1 : retire l'achat prévu que « Au calendrier » vient de poser (Annuler) ; défaut : `StorageService.deleteUpgradePlan`. */
  retirerPlan?: (plan: FinancialPlan) => Promise<void> | void;
  mode?: ModeCarnetIA;
  appels?: AppelsIA;
  aides?: AidesCarnet;
  /** Force hors ligne (banc `&hors-ligne=1`) ; sinon `navigator.onLine`. */
  horsLigne?: boolean;
  /** Ouvrir ce carnet (« Ouvrir le carnet » d'À venir, icône du calendrier) ; une idée archivée se rouvre aussi. */
  ouvrir?: { id: string; at: number } | null;
  /** + « Nouvelle idée » : le champ du bas prend le focus. */
  focusChamp?: number | null;
  /** CRN-ONGLET-RETOUR : l'onglet actif « Carnet » touché ramène à la liste ; le texte du champ reste (une note en modification n'est pas défaite). */
  racine?: number | null;
  onVoirAVenir?: () => void;
  /** « Voir » d'un carnet dont le plan est payé (critique 7, n° 5) : Réalisés ; sans lui, À venir. */
  onVoirRealises?: () => void;
  onMessage?: (texte: string) => void;
  maintenant?: () => Date;
  /** h1, tour 2 (D2) : tous les éléments de l'ancien carnet (le magasin ne lit que les idées) ; défaut : ceux de l'app, sauf avec un magasin passé (banc, tests). */
  anciens?: readonly CreativeItem[];
  /** Banc seulement (`&texte=…`) : le champ arrive rempli, pour atteindre un état « pendant » par une adresse (D-131). */
  texteInitial?: string;
}

export type Vue =
  | { sorte: 'liste' }
  | { sorte: 'carnet'; id: string }
  | { sorte: 'article'; id: string; articleId: string }
  | { sorte: 'comparer'; id: string }
  /* critique 6, n° 4 : « Retenir la hotte » ouvre Choisir sur cette façon */
  | { sorte: 'choisir'; id: string; faconId?: string }
  | { sorte: 'renommer'; id: string }
  | { sorte: 'supprimer'; id: string };

/**
 * Un retour « après » affiché. `id` : sa clé stable (P8, tour 3) ; le bandeau est monté sous cette clé, jamais sous l'index ni le
 * texte. La réponse de l'IA qui complète un retour déjà affiché garde son `id` et son bandeau : seul `inverse` (ce qu'Annuler défait)
 * change, donc le bouton sous le doigt reste le même.
 */
export interface Retour {
  id: number; bandeau: BandeauV; inverse: EcritureCarnet[]; messageId?: string; carnetId?: string; consequence?: string;
  /** P22, P36 : l'IA n'a pas rangé (éteinte, hors ligne, en échec) : l'avis le dit dans le bandeau même, une seule ligne d'état. */
  avis?: AvisIA;
  /** Ce qui a été rangé, et où (« Notes : « … » · dans Frigo ») : dit avec l'avis, puisque l'IA n'a pas mis en forme. */
  detail?: string;
  /** Lot 11 (L-2) : le carnet existant que l'IA proposait pour une phrase tapée sur la liste (`carnetSuggere`) ; « Y ajouter ? ». */
  suggestion?: { carnetId: string; titre: string };
}
export type AvisIA = { sorte: 'eteint' | 'hors-ligne' | 'echec'; texte: string };
/**
 * P23 (D-35) : un critère que l'IA propose sans le ranger (`propose`, contrat du lot A : gardé sur le message, `propositions`), le plus
 * souvent la caractéristique sur laquelle comparer. Il paraît en puce d'un toucher sous le bandeau du carnet ; le toucher le range sans
 * `propose` (`accepterProposition`).
 */
export interface Proposee { cle: string; messageId: string; index: number; carnetId: string; ligne: { texte: string; caracteristique?: { nom: string; unite?: string }; origine: string } }
export type RetourNeuf = Omit<Retour, 'id'>;
/** La photo jointe au champ (P7, tour 3) : `jeton` écarte une lecture finie après un ✕. */
export interface Jointe { jeton: number; jpeg?: string }

/**
 * Ce que le cadre « pendant » a annoncé, depuis la liste, et que l'envoi tient (vision 2, m390-1, m390-2, d1280-1) :
 * - `cree` : une phrase (pas un lien seul) crée SON carnet, sa phrase en titre (R10, R11 ; g5:v08-3, g5:v04-4). Le carnet proche de la
 *   bulle ne la prend que par « Y ajouter en façon ». L'IA met en forme dans ce carnet ; elle ne le retitre pas (son titre devient un
 *   titre proposé, G29) et ne range pas ailleurs ;
 * - `vrac` : chaque ligne d'une note va dans le carnet annoncé pour elle (R18, R19 ; `planVrac`). L'IA met en forme et type les lignes.
 * Un lien seul n'a pas d'annonce figée : le cadre dit « range le lien dans le carnet qui en parle, sinon dans un nouveau » (G21).
 */
export type Annonce =
  | { sorte: 'cree'; carnetId: string; titre: string; phrase: string }
  /* Critique 5, n° 7 : `vues` et `carnets`, la découpe telle que le pendant « ✻ L'IA découpe votre note » la montre */
  | { sorte: 'vrac'; lignes: { texte: string; dest: Destination; sorte?: LigneLocale['sorte'] }[]; vues: LigneVracV[]; carnets: number }
  /* Critique 5, n° 3 et 6 : écrit dans un carnet ouvert, tout va dans le carnet annoncé (l'ouvert, ou celui que le cadre a nommé) */
  /* Critique 7, n° 3 : `rubrique` : la puce « Va dans » cochée d'avance à l'envoi (Ce qui compte, Note, Façon) ; l'IA met en forme, la
     rubrique annoncée tient */
  /* Test en ligne 2 : `choisi` : le carnet corrigé d'un toucher (« Ici », ou un autre) ; un choix du brasseur, l'IA ne le change pas */
  | { sorte: 'ici'; carnetId: string; rubrique?: RubriqueVaDans; choisi?: true; /** CRN-2 : « Va dans : Note » était coché */ noteChoisie?: true };
