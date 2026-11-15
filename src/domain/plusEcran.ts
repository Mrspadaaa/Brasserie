import type { TabType } from '../components/BottomNav';
import { fabActionFor, type AnySubTab, type FabAction } from './fabActions';

/**
 * Le menu du + selon l'écran (b1r, choisi le 15.11).
 *
 * ⚠️ Ce que ça règle : le + ouvrait le même menu partout — facture, vente,
 * recette, brassin — alors que chaque écran a ses propres gestes (BX-4, 09.11 :
 * « sur plein d'écran il est pas au bon endroit. Différents, donne pas les
 * bonnes actions »). Une table par écran dit ce que la feuille montre :
 *  - « Sur cet écran » : l'action de l'écran (`fabActionFor`, pleine, couleur de
 *    sa rubrique) puis, s'il en a, ses autres actions (demi-largeur) ;
 *  - « Depuis ici » : 0 à 3 gestes choisis pour cet écran, avec une précision
 *    quand elle informe (prochain numéro de brassin, articles à commander).
 *
 * La table est un `Record` exhaustif par écran : un écran ajouté sans menu casse
 * la compilation. Les précisions viennent de l'app (`PlusContexte`), jamais d'un
 * exemple : une donnée inconnue donne une entrée sans précision, pas un « 0 ».
 */

export type PlusCle =
  | 'ecriture' | 'facture' | 'vente' | 'brassin' | 'recette' | 'idee' | 'courses'
  | 'houblon' | 'article' | 'fut' | 'client' | 'tarif' | 'materiel';

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
}

export interface PlusEntree {
  cle: PlusCle;
  label: string;
  hint?: string;
  /** Lettre de raccourci au clavier, fixe d'un écran à l'autre. */
  lettre: string;
  ton: PlusTon;
}

export interface PlusEcranAction extends FabAction {
  lettre: 'N';
  ton: PlusTon;
}

export interface PlusMenu {
  ecran: EcranId;
  /** « Brassins › Recettes » : la rubrique et l'écran, à droite de la zone. */
  chemin: string;
  ton: PlusTon;
  /** L'action de l'écran ; `null` quand l'écran ne crée rien (Volumes, Impôt bière). */
  action: PlusEcranAction | null;
  /** Les autres actions de l'écran, en demi-largeur. */
  autres: PlusEntree[];
  /** « Depuis ici » : 0 à 3 gestes. */
  ici: PlusEntree[];
}

/** Lettre de chaque geste ; N est l'action de l'écran, C le compagnon. */
export const LETTRES: Record<PlusCle, string> = {
  ecriture: 'E', facture: 'F', vente: 'V', brassin: 'B', recette: 'R', idee: 'I', courses: 'L',
  houblon: 'H', article: 'A', fut: 'U', client: 'K', tarif: 'T', materiel: 'M'
};

const FICHE: Record<PlusCle, { label: string; ton: PlusTon }> = {
  ecriture: { label: 'Écriture', ton: 'finances' },
  facture: { label: 'Facture', ton: 'finances' },
  vente: { label: 'Vente', ton: 'finances' },
  brassin: { label: 'Brassin', ton: 'production' },
  recette: { label: 'Recette', ton: 'production' },
  idee: { label: 'Idée', ton: 'production' },
  courses: { label: 'Courses', ton: 'stocks' },
  houblon: { label: 'Houblon', ton: 'stocks' },
  article: { label: 'Article', ton: 'stocks' },
  fut: { label: 'Fût', ton: 'stocks' },
  client: { label: 'Client', ton: 'clients' },
  tarif: { label: 'Tarif', ton: 'clients' },
  materiel: { label: 'Matériel', ton: 'stocks' }
};

type Precision = string | ((c: PlusContexte) => string | undefined);
interface Ligne { cle: PlusCle; hint?: Precision }

interface Fiche {
  chemin: string;
  ton: PlusTon;
  autres: Ligne[];
  ici: Ligne[];
}

const sera = (c: PlusContexte) => (c.prochainBrassin ? `sera ${c.prochainBrassin}` : undefined);
const aCommander = (c: PlusContexte) => (c.aCommander && c.aCommander > 0 ? `${c.aCommander} à commander` : undefined);

/** Une table par écran : ce que la feuille du + montre là, et rien d'autre. */
const MENUS: Record<EcranId, Fiche> = {
  bord: { chemin: 'Bord', ton: 'finances', autres: [{ cle: 'facture', hint: 'photo' }, { cle: 'vente' }], ici: [{ cle: 'brassin', hint: sera }, { cle: 'courses', hint: aCommander }, { cle: 'recette' }] },
  finances: { chemin: 'Finances', ton: 'finances', autres: [{ cle: 'facture', hint: 'photo ou PDF' }, { cle: 'vente' }], ici: [] },
  brassins: { chemin: 'Brassins › Brassins', ton: 'production', autres: [], ici: [{ cle: 'recette' }, { cle: 'idee' }, { cle: 'courses', hint: aCommander }] },
  recettes: { chemin: 'Brassins › Recettes', ton: 'production', autres: [], ici: [{ cle: 'brassin', hint: sera }, { cle: 'idee' }, { cle: 'houblon' }] },
  atelier: { chemin: 'Brassins › Atelier R&D', ton: 'production', autres: [], ici: [{ cle: 'recette' }, { cle: 'brassin', hint: sera }] },
  volumes: { chemin: 'Brassins › Volumes', ton: 'production', autres: [], ici: [{ cle: 'brassin', hint: sera }, { cle: 'recette' }, { cle: 'courses', hint: aCommander }] },
  stock: { chemin: 'Stocks › Articles', ton: 'stocks', autres: [], ici: [{ cle: 'facture', hint: 'achat reçu' }, { cle: 'courses', hint: aCommander }, { cle: 'houblon' }] },
  courses: { chemin: 'Stocks › Courses', ton: 'stocks', autres: [], ici: [{ cle: 'article' }, { cle: 'facture', hint: 'achat reçu' }] },
  futs: { chemin: 'Stocks › Fûts', ton: 'stocks', autres: [], ici: [{ cle: 'vente', hint: 'fût vendu' }, { cle: 'client' }, { cle: 'materiel' }] },
  materiel: { chemin: 'Stocks › Matériel', ton: 'stocks', autres: [], ici: [{ cle: 'fut' }, { cle: 'ecriture', hint: 'achat' }] },
  houblons: { chemin: 'Stocks › Houblons', ton: 'stocks', autres: [], ici: [{ cle: 'article', hint: 'en stock' }, { cle: 'recette' }, { cle: 'courses', hint: aCommander }] },
  clients: { chemin: 'Clients › Carnet', ton: 'clients', autres: [], ici: [{ cle: 'vente' }, { cle: 'tarif' }, { cle: 'fut', hint: 'en prêt' }] },
  impot: { chemin: 'Clients › Impôt bière', ton: 'clients', autres: [], ici: [{ cle: 'vente' }] },
  tarifs: { chemin: 'Clients › Prix', ton: 'clients', autres: [], ici: [{ cle: 'client' }, { cle: 'vente' }] }
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

function entree(l: Ligne, c: PlusContexte): PlusEntree {
  const f = FICHE[l.cle];
  const hint = typeof l.hint === 'function' ? l.hint(c) : l.hint;
  return { cle: l.cle, label: f.label, hint, lettre: LETTRES[l.cle], ton: f.ton };
}

/** Le menu du + pour l'écran (onglet, sous-onglet) et ce que l'app en sait. */
export function plusMenuFor(tab: TabType, subTab?: AnySubTab | null, contexte: PlusContexte = {}): PlusMenu {
  const ecran = ecranId(tab, subTab);
  const fiche = MENUS[ecran];
  const brute = fabActionFor(tab, subTab);
  return {
    ecran,
    chemin: fiche.chemin,
    ton: fiche.ton,
    // `quickAction` = l'écran ne crée rien (BX-4) : pas d'action pleine.
    action: brute.intent === 'quickAction' ? null : actionDeLEcran(brute, fiche.ton, contexte),
    autres: fiche.autres.map((l) => entree(l, contexte)),
    ici: fiche.ici.map((l) => entree(l, contexte))
  };
}

/** Menu d'une page plein écran (assistant, jour de brassage…) : les gestes de partout, sans action d'écran. */
export function plusMenuPage(contexte: PlusContexte = {}): PlusMenu {
  return {
    ecran: 'bord',
    chemin: '',
    ton: 'finances',
    action: null,
    autres: [],
    ici: [{ cle: 'facture' }, { cle: 'vente' }, { cle: 'recette' }, { cle: 'brassin', hint: sera }].map((l) => entree(l as Ligne, contexte))
  };
}

/** Toutes les entrées et leur lettre, montrées ou non sur l'écran : une lettre reste active partout. */
export function lettresActives(menu: PlusMenu): Record<string, PlusCle | 'ecran' | 'compagnon'> {
  const table: Record<string, PlusCle | 'ecran' | 'compagnon'> = { C: 'compagnon' };
  (Object.keys(LETTRES) as PlusCle[]).forEach((cle) => { table[LETTRES[cle]] = cle; });
  if (menu.action) table.N = 'ecran';
  return table;
}
