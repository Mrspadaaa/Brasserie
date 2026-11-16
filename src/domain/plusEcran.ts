import type { TabType } from '../components/BottomNav';
import { fabActionFor, type AnySubTab, type FabAction } from './fabActions';

/**
 * Le menu du + (b1s-b2 « La pile au pouce », choisi le 15.11 ; la feuille « Deux étages » b1s-a n'a pas été retenue).
 *
 * ⚠️ Ce que ça règle : le + ouvrait le même menu partout — facture, vente,
 * recette, brassin — alors que chaque écran a ses propres gestes (BX-4, 09.11 :
 * « sur plein d'écran il est pas au bon endroit. Différents, donne pas les
 * bonnes actions »). Puis b1r avait fait disparaître le commun : ses mots du
 * 15.11, « certaines actions doivent toujours être possible, juste celle de
 * l'écran actuel sont plus mis en avant ». Deux zones, empilées depuis le + :
 *  - « Sur cet écran » (en tête) : l'action de l'écran (`fabActionFor`, pleine,
 *    couleur de sa rubrique), puis ses autres actions ;
 *  - « Partout » : les cinq gestes communs (écriture, facture, vente, recette,
 *    brassin) à CASES FIXES, plus le Compagnon (dans la feuille). Un geste déjà
 *    monté en tête garde sa case, marquée d'un renvoi ↑ et toujours active
 *    (`monte`) : aucune case vide, aucun geste qui semble avoir disparu.
 *
 * La table est un `Record` exhaustif par écran : un écran ajouté sans menu casse
 * la compilation. Les précisions viennent de l'app (`PlusContexte`), jamais d'un
 * exemple : une donnée inconnue donne une entrée sans précision, pas un « 0 ».
 */

export type PlusCle =
  | 'ecriture' | 'facture' | 'vente' | 'brassin' | 'recette' | 'idee' | 'courses'
  | 'estimer' | 'houblon' | 'article' | 'fut' | 'client' | 'tarif' | 'materiel' | 'densite';

/** Couleur de rubrique : finances, brassins, stocks ; clients reste neutre. */
export type PlusTon = 'finances' | 'production' | 'stocks' | 'clients';

export type EcranId =
  | 'bord' | 'finances' | 'brassins' | 'recettes' | 'atelier' | 'volumes'
  | 'stock' | 'courses' | 'futs' | 'materiel' | 'houblons' | 'clients' | 'impot' | 'tarifs';

/** Ce que l'app sait au moment d'ouvrir la feuille. Un champ absent = inconnu. */
export interface PlusContexte {
  /** Numéro que prendra le prochain brassin (« LOT-004 »). */
  prochainBrassin?: string;
  /** Numéro que prendra le prochain fût (« F-007 »). */
  prochainFut?: string;
  /** Articles à commander (le même compte que la pastille de Stocks). */
  aCommander?: number;
  /** Brassins en fermentation ou en garde. */
  enCuve?: number;
  /** Le brassin en fermentation dont on saisirait la densité (« B-031 », J+4 quand le jour est connu). Absent : pas de geste. */
  enFermentation?: { id: string; jours?: number };
}

export interface PlusEntree {
  cle: PlusCle;
  label: string;
  /** Libellé court de la tuile au téléphone (b1s-a au 390 : « Écriture », « Facture »…) ; absent = le libellé plein. */
  court?: string;
  hint?: string;
  /** Lettre de raccourci au clavier, fixe d'un écran à l'autre. */
  lettre: string;
  ton: PlusTon;
  /** Geste commun déjà monté « Sur cet écran » : sa case reste en « Partout », avec ↑, active. */
  monte?: boolean;
}

export interface PlusEcranAction extends FabAction {
  lettre: 'N';
  ton: PlusTon;
}

export interface PlusMenu {
  ecran: EcranId;
  /** « Brassins › Recettes » : la rubrique et l'écran, à droite de la zone. */
  chemin: string;
  /** L'état de l'écran en une ligne (« 2 en cuve »), seulement quand l'app le sait. */
  etat?: string;
  ton: PlusTon;
  /** L'action de l'écran ; `null` quand l'écran ne crée rien (Volumes, Impôt bière). */
  action: PlusEcranAction | null;
  /** Les autres actions de l'écran, montées en tête avec l'action. */
  autres: PlusEntree[];
  /** « Partout » : les cinq gestes communs, dans un ordre figé (`COMMUNS`). */
  partout: PlusEntree[];
  /** Ancien « Depuis ici » (b1r) : toujours vide, gardé pour la recherche qui lit `autres` et `ici`. */
  ici: PlusEntree[];
}

/** Les gestes communs et leur ordre figé : la même case d'un écran à l'autre. */
export const COMMUNS: PlusCle[] = ['ecriture', 'facture', 'vente', 'recette', 'brassin'];

/** Lettre de chaque geste ; N est l'action de l'écran, C le compagnon. */
export const LETTRES: Record<PlusCle, string> = {
  ecriture: 'E', facture: 'F', vente: 'V', brassin: 'B', recette: 'R', idee: 'I', courses: 'L', estimer: 'S',
  houblon: 'H', article: 'A', fut: 'U', client: 'K', tarif: 'T', materiel: 'M', densite: 'D'
};

type Precision = string | ((c: PlusContexte) => string | undefined);

const sera = (c: PlusContexte) => (c.prochainBrassin ? `sera ${c.prochainBrassin}` : undefined);
const brassinEnCuve = (c: PlusContexte) => c.enFermentation
  ? `${c.enFermentation.id}${c.enFermentation.jours !== undefined && c.enFermentation.jours >= 0 ? ` · J+${c.enFermentation.jours}` : ''}`
  : undefined;
const aCommander = (c: PlusContexte) => (c.aCommander && c.aCommander > 0 ? `${c.aCommander} à commander` : undefined);

/** Libellé (même verbe aux deux largeurs), couleur et précision d'usage de chaque geste. */
const FICHE: Record<PlusCle, { label: string; court?: string; ton: PlusTon; hint?: Precision }> = {
  ecriture: { label: 'Nouvelle écriture', court: 'Écriture', ton: 'finances', hint: 'à la main' },
  facture: { label: 'Entrer une facture', court: 'Facture', ton: 'finances', hint: 'photo ou PDF' },
  vente: { label: 'Encaisser une vente', court: 'Vente', ton: 'finances' },
  brassin: { label: 'Lancer un brassin', court: 'Brassin', ton: 'production', hint: sera },
  recette: { label: 'Créer une recette', court: 'Recette', ton: 'production' },
  idee: { label: 'Nouvelle idée', ton: 'production' },
  courses: { label: 'Courses', ton: 'stocks', hint: aCommander },
  /* Finances : l'ancien « + » de la ligne du coût du litre (action de l'écran, une seule fois à l'écran : le + flottant). */
  estimer: { label: 'Estimer un brassin', ton: 'finances', hint: 'coût du litre' },
  houblon: { label: 'Nouvelle variété', ton: 'stocks' },
  article: { label: 'Nouvel article', ton: 'stocks' },
  fut: { label: 'Nouveau fût', ton: 'stocks' },
  client: { label: 'Nouveau client', ton: 'clients' },
  tarif: { label: 'Nouveau tarif', ton: 'clients' },
  materiel: { label: 'Nouveau matériel', ton: 'stocks' },
  /* b1s-a : « Saisir une densité · B-031 · J+4 » ; ouvre la fiche du brassin aux Mesures. Absent sans brassin en fermentation. */
  densite: { label: 'Saisir une densité', ton: 'production', hint: brassinEnCuve }
};

interface Fiche {
  chemin: string;
  ton: PlusTon;
  /** Les autres gestes de l'écran, en tête sous l'action. */
  autres: PlusCle[];
  etat?: (c: PlusContexte) => string | undefined;
}

const enCuve = (c: PlusContexte) => (c.enCuve && c.enCuve > 0 ? `${c.enCuve} en cuve` : undefined);

/** Une table par écran : ce que la feuille met en tête là (l'action de l'écran vient de `fabActions`). */
const MENUS: Record<EcranId, Fiche> = {
  bord: { chemin: 'Bord', ton: 'finances', autres: ['courses'] },
  finances: { chemin: 'Finances', ton: 'finances', autres: ['estimer', 'facture', 'vente'] },
  /* Décision du pilote (16.11) : la partie écran de la pile de Brassins = « Nouveau brassin », « Saisir une densité » (seulement si un brassin est en fermentation), « Créer une recette » ; pas de Courses. Écriture, facture, vente et Compagnon restent sous « Partout ». */
  brassins: { chemin: 'Brassins', ton: 'production', autres: ['densite', 'recette'], etat: enCuve },
  recettes: { chemin: 'Brassins › Recettes', ton: 'production', autres: ['brassin'] },
  atelier: { chemin: 'Brassins › Atelier R&D', ton: 'production', autres: ['brassin'] },
  volumes: { chemin: 'Brassins › Volumes', ton: 'production', autres: ['brassin', 'courses'] },
  stock: { chemin: 'Stocks › Articles', ton: 'stocks', autres: ['courses'], etat: aCommander },
  courses: { chemin: 'Stocks › Courses', ton: 'stocks', autres: ['article'], etat: aCommander },
  futs: { chemin: 'Stocks › Fûts', ton: 'stocks', autres: ['vente'] },
  materiel: { chemin: 'Stocks › Matériel', ton: 'stocks', autres: [] },
  houblons: { chemin: 'Stocks › Houblons', ton: 'stocks', autres: ['courses'], etat: aCommander },
  clients: { chemin: 'Clients › Carnet', ton: 'clients', autres: ['vente', 'tarif'] },
  impot: { chemin: 'Clients › Impôt bière', ton: 'clients', autres: [] },
  tarifs: { chemin: 'Clients › Prix', ton: 'clients', autres: ['client'] }
};

/** L'écran affiché, depuis l'onglet et le sous-onglet. Un sous-onglet absent = le premier de l'onglet. */
export function ecranId(tab: TabType, subTab?: AnySubTab | null): EcranId {
  switch (tab) {
    case 'dashboard': return 'bord';
    case 'finances': return 'finances';
    case 'production':
      return ({ recipes: 'recettes', lab: 'atelier', scaler: 'volumes' } as Record<string, EcranId>)[subTab ?? ''] ?? 'brassins';
    case 'stocks':
      return ({ courses: 'courses', futs: 'futs', materiel: 'materiel', hops: 'houblons' } as Record<string, EcranId>)[subTab ?? ''] ?? 'stock';
    case 'clients':
      return ({ ofdf: 'impot', tarifs: 'tarifs' } as Record<string, EcranId>)[subTab ?? ''] ?? 'clients';
  }
}

const tonDe = (intent: FabAction['intent'], repli: PlusTon): PlusTon => {
  if (intent === 'newTransaction') return 'finances';
  return repli;
};

/** Le geste commun que l'action de l'écran reprend, quand il y en a un : sa case de « Partout » porte alors ↑. */
const COMMUN_DE_L_ACTION: Partial<Record<FabAction['intent'], PlusCle>> = {
  newTransaction: 'ecriture', newBatch: 'brassin', newRecipe: 'recette'
};

/** L'action de l'écran porte une précision quand l'app la connaît (prochain numéro, articles). */
function actionDeLEcran(action: FabAction, ton: PlusTon, c: PlusContexte): PlusEcranAction {
  const hint =
    action.intent === 'newTransaction' ? 'facture ou à la main'
    : action.intent === 'newBatch' ? sera(c)
    : action.intent === 'newKeg' ? (c.prochainFut ? `sera ${c.prochainFut}` : undefined)
    : action.intent === 'copyShoppingList' ? (c.aCommander && c.aCommander > 0 ? `${c.aCommander} ${c.aCommander > 1 ? 'articles' : 'article'}` : undefined)
    : undefined;
  return { ...action, hint, lettre: 'N', ton: tonDe(action.intent, ton) };
}

function entree(cle: PlusCle, c: PlusContexte, monte?: boolean): PlusEntree {
  const f = FICHE[cle];
  const hint = typeof f.hint === 'function' ? f.hint(c) : f.hint;
  return { cle, label: f.label, ...(f.court ? { court: f.court } : {}), hint, lettre: LETTRES[cle], ton: f.ton, ...(monte ? { monte: true } : {}) };
}

/** Le menu du + pour l'écran (onglet, sous-onglet) et ce que l'app en sait. */
export function plusMenuFor(tab: TabType, subTab?: AnySubTab | null, contexte: PlusContexte = {}): PlusMenu {
  const ecran = ecranId(tab, subTab);
  const fiche = MENUS[ecran];
  const brute = fabActionFor(tab, subTab);
  // `quickAction` = l'écran ne crée rien (BX-4) : pas d'action pleine.
  const action = brute.intent === 'quickAction' ? null : actionDeLEcran(brute, fiche.ton, contexte);
  /* Un geste qui dépend de l'app (la densité d'un brassin en fermentation) n'est proposé que si l'app a de quoi l'ouvrir : jamais un geste vide. */
  const autres = fiche.autres.filter((cle) => cle !== 'densite' || contexte.enFermentation);
  const montes = new Set<PlusCle>(autres);
  const reprise = COMMUN_DE_L_ACTION[brute.intent];
  if (action && reprise) montes.add(reprise);
  return {
    ecran,
    chemin: fiche.chemin,
    etat: fiche.etat?.(contexte),
    ton: fiche.ton,
    action,
    autres: autres.map((cle) => entree(cle, contexte)),
    partout: COMMUNS.map((cle) => entree(cle, contexte, montes.has(cle))),
    ici: []
  };
}

/**
 * Menu d'une page plein écran (assistant, jour de brassage…) : les gestes de partout. Sans `action`, aucune action d'écran ;
 * avec, elle est en tête et son geste commun garde sa case, marquée ↑ (le même contrat que `plusMenuFor`).
 */
export function plusMenuPage(contexte: PlusContexte = {}, action?: FabAction | null): PlusMenu {
  const reprise = action ? COMMUN_DE_L_ACTION[action.intent] : undefined;
  return {
    ecran: 'bord',
    chemin: '',
    ton: 'finances',
    action: action ? { ...action, lettre: 'N', ton: 'clients' } : null,
    autres: [],
    partout: COMMUNS.map((cle) => entree(cle, contexte, cle === reprise)),
    ici: []
  };
}

/** Toutes les entrées et leur lettre, montrées ou non sur l'écran : une lettre reste active partout. */
export function lettresActives(menu: PlusMenu): Record<string, PlusCle | 'ecran' | 'compagnon'> {
  const table: Record<string, PlusCle | 'ecran' | 'compagnon'> = { C: 'compagnon' };
  (Object.keys(LETTRES) as PlusCle[]).forEach((cle) => { table[LETTRES[cle]] = cle; });
  if (menu.action) table.N = 'ecran';
  return table;
}
