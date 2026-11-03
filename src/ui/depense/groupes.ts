// Calculs purs de la liste en bandes (p3c-3) : quel groupe, quels sous-totaux, quelle ligne est du port. Aucun React, aucun service.
// Règles du plan : R2 (un seul ensemble de lignes affichées), R3 (l'inconnu n'est jamais 0), centimes entiers partout, unités jamais additionnées entre elles.

import { familleDe, NOMS_FAMILLES, ORDRE_FAMILLES, SOUS_FAMILLES_RENOVATION, sousFamilleDe, type FamilleCle } from './familles';
import { linkUnit, STOCK_CATEGORIES } from '../../services/stockLineMatching';
import { Units } from '../../services/units';
import type { Niveau } from './confiance';

/** Une bande par famille (D262c, D262d, D306) : malts, houblons, levures, sucres, additifs, matériel, emballage, nettoyage, consommables, rénovation, services, autres. */
export type GroupeCle = FamilleCle;
export const NOMS_GROUPES: Record<GroupeCle, string> = NOMS_FAMILLES;
export const ORDRE_GROUPES: readonly GroupeCle[] = ORDRE_FAMILLES;
/** Les jetons de l'app qui teintent chaque famille (cinq ont une couleur par thème dans p3c.css : `dp-p3c-pt-<clé>`, `dp-p3c-fi-<clé>`) : la pastille de l'en-tête (et la barre du récap) et le filet de gauche des rangées. Le fond de l'en-tête est dans p3c.css (`dp-p3c-t-<clé>`). */
export const POINT_FAMILLE: Record<GroupeCle, string> = {
  malt: 'bg-ebc-gold', houblon: 'bg-hop', levure: 'bg-area-finances', sucre: 'bg-ebc-amber', additif: 'bg-area-agenda', materiel: 'bg-water', emballage: 'dp-p3c-pt-emballage',
  nettoyage: 'dp-p3c-pt-nettoyage', consommable: 'dp-p3c-pt-consommable', renovation: 'dp-p3c-pt-renovation', service: 'dp-p3c-pt-service', autres: 'bg-cave-400',
};
export const FILET_FAMILLE: Record<GroupeCle, string> = {
  malt: 'border-l-4 border-l-ebc-gold', houblon: 'border-l-4 border-l-hop', levure: 'border-l-4 border-l-area-finances', sucre: 'border-l-4 border-l-ebc-amber',
  additif: 'border-l-4 border-l-area-agenda', materiel: 'border-l-4 border-l-water', emballage: 'border-l-4 dp-p3c-fi-emballage', nettoyage: 'border-l-4 dp-p3c-fi-nettoyage',
  consommable: 'border-l-4 dp-p3c-fi-consommable', renovation: 'border-l-4 dp-p3c-fi-renovation', service: 'border-l-4 dp-p3c-fi-service', autres: 'border-l-4 border-l-cave-400',
};

/** La forme minimale dont le critère du port a besoin (VOIE.md, décision 7). */
export interface LigneMin { id: string; kind: string; amount?: number }

/** Un montant de ligne valide : nombre fini ≥ 0, en centimes entiers (2,005 n'en est pas un). */
export const montantValide = (a: number | undefined): a is number => typeof a === 'number' && Number.isFinite(a) && a >= 0 && Math.abs(a * 100 - Math.round(a * 100)) < 1e-6;
export const centimes = (a: number): number => Math.round(a * 100);
export const fr2 = (cents: number): string => (cents / 100).toFixed(2).replace('.', ',');

/**
 * Le critère du port, en UN seul endroit : une ligne est du port si `kind === 'shipping'`, si son montant est valide (≥ 0, centimes entiers)
 * ET si toutes les lignes ne sont pas du port. Sinon elle reste une rangée ordinaire (bande « Autres »), visible et corrigeable.
 */
export function lignesDePort(lines: readonly LigneMin[]): ReadonlySet<string> {
  if (lines.length > 0 && lines.every(l => l.kind === 'shipping')) return new Set();
  return new Set(lines.filter(l => l.kind === 'shipping' && montantValide(l.amount)).map(l => l.id));
}
/** « dont port » : somme en centimes entiers des lignes de port ; `null` quand il n'y en a aucune (un port à 0,00 est un port connu). */
export function portCents(lines: readonly LigneMin[], port: ReadonlySet<string>): number | null {
  if (port.size === 0) return null;
  return lines.filter(l => port.has(l.id)).reduce((s, l) => s + centimes(l.amount as number), 0);
}
/**
 * La famille d'une ligne : le contexte que l'identité a lu (`Malt`, `Houblon`, `Levure`), puis le `kind` de la lecture, le nom imprimé, la catégorie de
 * stock lue sur la ligne et celle de l'article rattaché (voir `familles.ts` pour l'ordre), puis la catégorie de la dépense (D306 : `renovation`). « Autres » ne reçoit que l'inclassable.
 * Les arguments absents ou d'un autre type sont ignorés (`['Malt', …].map(groupeDe)` passe un rang et un tableau).
 */
export const groupeDe = (contexte: string | undefined, kind?: unknown, description?: unknown, stockCategory?: unknown, categorieArticle?: unknown, categorie?: unknown): GroupeCle =>
  familleDe({
    contexte, kind: typeof kind === 'string' ? kind : undefined, nom: typeof description === 'string' ? description : undefined,
    stockCategory: typeof stockCategory === 'string' ? stockCategory : undefined, categorieArticle: typeof categorieArticle === 'string' ? categorieArticle : undefined,
    categorie: typeof categorie === 'string' ? categorie : undefined,
  });

/**
 * D307 : la sous-famille d'une ligne (même entrée que `groupeDe`, même famille ; `sousFamilleDe` de familles.ts). `undefined` : la famille n'en a pas (Malts, Houblons…)
 * ou la ligne n'en a pas.
 */
export const sousFamilleDeLigne = (contexte: string | undefined, kind?: unknown, description?: unknown, stockCategory?: unknown, categorieArticle?: unknown, categorie?: unknown): string | undefined => {
  const entree = {
    contexte, kind: typeof kind === 'string' ? kind : undefined, nom: typeof description === 'string' ? description : undefined,
    stockCategory: typeof stockCategory === 'string' ? stockCategory : undefined, categorieArticle: typeof categorieArticle === 'string' ? categorieArticle : undefined,
    categorie: typeof categorie === 'string' ? categorie : undefined,
  };
  return sousFamilleDe(familleDe(entree), entree);
};

/** Une ligne affichée, avec ce dont les sous-totaux ont besoin (le groupe d'une mouture rattachable est celui de son malt). */
export interface LigneBande {
  id: string; groupe: GroupeCle; amount?: number; quantity?: number; unit: string; uniteLisible: boolean;
  /** D307 : la sous-famille de la ligne (`sousFamilleDeLigne`) ; absente quand la famille n'en a pas. */
  sousFamille?: string;
  /** D307 : la ligne est jaune ou rouge (un de ses niveaux, `confiance.ts`, ou sa barre de geste) : son sous-groupe s'ouvre d'office. */
  averifier?: boolean;
  /** Vrai : une mouture posée en pastille sur son malt (comptée dans la bande du malt, pas dans ses quantités). */
  mouture: boolean;
  /** Nombre de sachets certain de la ligne (conversion sûre), sinon `undefined`. */
  sachets?: number;
  /** D277 : le niveau de l'unité de la ligne (`repris` : déduite, à contrôler) ; absent = sûre. */
  niveau?: Niveau;
  /** Une ligne hors stock sans quantité (un service, une remise) : sans objet pour les quantités de la bande, jamais un « ? ». */
  sansQuantite?: boolean;
  /** D328b : la nature de la ligne ne passe pas en stock (service, port, remise, entretien, divers…). Sans unité lisible, sa quantité est « sans objet » pour l'en-tête : jamais un « ? ». */
  horsStock?: boolean;
  /** D377 : « Item en rouge mais pas total ?? » : le montant de la ligne est là mais rouge (`confiance.ts`, rien ne le tranche) ; le total de sa bande et de son sous-groupe le porte. */
  montantDoute?: boolean;
}
/** `niveau` : le pire des lignes additionnées (`repris` : au moins une unité déduite, le sous-total se marque en jaune). */
export interface QteGroupe { unite: string; n: number; inconnue: boolean; niveau?: Niveau }
/**
 * D307 : un sous-groupe d'une bande (sa sous-famille), avec ses sous-totaux calculés comme ceux de la bande (même `quantites`, mêmes centimes).
 * `ids` : ses rangées dans l'ordre du papier. Un sous-groupe d'une seule ligne n'a ni chevron ni ligne : sa rangée seule. `libre` : les lignes sans
 * sous-famille d'une bande qui en a d'autres, rangées à la fin, sans ligne de sous-famille.
 */
export interface SousGroupe {
  nom: string; ids: string[]; qte: QteGroupe[]; cents: number; incomplet: boolean;
  /** Au moins une ligne jaune ou rouge : le groupe s'ouvre d'office tant que le brasseur n'a rien choisi. */
  averifier: boolean; libre?: true;
  /** D377 : un montant de ses lignes est rouge. */
  montantDoute?: boolean;
}
export interface Bande {
  cle: GroupeCle; nom: string; ids: string[]; moutureIds: string[]; qte: QteGroupe[]; eqb?: string; cents: number;
  /** Au moins un montant absent : le sous-total n'est qu'un minimum (suffixe « + ? »). */
  incomplet: boolean;
  /** D377 : un montant de ses lignes est rouge. */
  montantDoute?: boolean;
  /** D307 : présents seulement quand les lignes de la bande se répartissent en deux sous-familles au moins ; sinon la bande est celle d'aujourd'hui. */
  sousGroupes?: SousGroupe[];
}

const arrondi = (n: number) => Math.round(n * 1e6) / 1e6;
/**
 * Les quantités d'une bande. D277 (« 7 Kg + 100 g » → « 7,1 Kg ») : les unités d'une même grandeur (masse, volume) s'additionnent dans l'unité la plus
 * présente quand chaque conversion est exacte (au millionième) ; les pièces ne s'additionnent qu'à unité égale (« Stk » et « sachet » restent à part).
 */
/** Une ligne dont la quantité ne compte pas dans l'en-tête : sans quantité hors stock, ou hors stock sans unité (D328b : rien d'inconnu, donc aucun « ? »). */
const horsCompte = (l: LigneBande): boolean => l.sansQuantite === true || (l.horsStock === true && (!l.uniteLisible || l.quantity === undefined));
function quantites(lignes: readonly LigneBande[]): QteGroupe[] {
  type Forme = { q: number; lignes: number; ordre: number };
  const parGrandeur = new Map<string, { formes: Map<string, Forme>; niveau: Niveau }>();
  let inconnu = 0, ordre = 0;
  for (const l of lignes) {
    if (horsCompte(l)) continue;
    if (!l.uniteLisible || l.quantity === undefined) { inconnu += l.quantity ?? 0; continue; }
    const cle = linkUnit(l.unit), famille = Units.familyOf(cle), g = famille === 'piece' ? `piece:${cle}` : famille;
    const e = parGrandeur.get(g) ?? { formes: new Map<string, Forme>(), niveau: 'sur' as Niveau };
    // Une forme par écriture de l'unité (« Kg » et « kg » se lisent ensemble sous l'écriture la plus fréquente).
    const forme = [...e.formes.keys()].find(f => linkUnit(f) === cle) ?? l.unit.trim();
    const f = e.formes.get(forme) ?? { q: 0, lignes: 0, ordre: ordre++ };
    f.q += l.quantity; f.lignes++; e.formes.set(forme, f);
    if (l.niveau === 'repris' || l.niveau === 'inconnu') e.niveau = e.niveau === 'inconnu' ? 'inconnu' : l.niveau;
    parGrandeur.set(g, e);
  }
  const sortie: QteGroupe[] = [];
  for (const e of parGrandeur.values()) {
    const formes = [...e.formes.entries()].sort((a, b) => b[1].lignes - a[1].lignes || a[1].ordre - b[1].ordre);
    const cible = formes[0][0];
    const convertis = formes.map(([forme, f]) => Units.convert(f.q, linkUnit(forme), linkUnit(cible)));
    const exacts = convertis.every((c, i) => c !== null && Number.isFinite(c) && Math.abs(arrondi(c) - c) < 1e-9 * Math.max(1, formes[i][1].q));
    const niveau = e.niveau === 'sur' ? {} : { niveau: e.niveau };
    if (formes.length > 1 && exacts) sortie.push({ unite: cible, n: arrondi(convertis.reduce<number>((s, c) => s + (c as number), 0)), inconnue: false, ...niveau });
    else for (const [forme, f] of formes) sortie.push({ unite: forme, n: arrondi(f.q), inconnue: false, ...niveau });
  }
  const aPart = lignes.some(l => !horsCompte(l) && (!l.uniteLisible || l.quantity === undefined));
  if (aPart) sortie.push({ unite: '?', n: Math.round(inconnu * 1e6) / 1e6, inconnue: true, niveau: 'inconnu' });
  return sortie;
}
/** D307 : l'ordre des sous-groupes d'une bande : `SOUS_FAMILLES_RENOVATION` pour la Rénovation, `STOCK_CATEGORIES` pour les autres ; un nom hors liste vient après, dans l'ordre d'arrivée. */
export const ordreSousFamilles = (cle: GroupeCle): readonly string[] => (cle === 'renovation' ? SOUS_FAMILLES_RENOVATION : STOCK_CATEGORIES);
/**
 * D307 : les sous-groupes d'une bande. `dans` : toutes ses lignes (moutures comprises, comptées dans les centimes comme dans la bande) ; les rangées et les quantités
 * ne comptent que les lignes propres, par la même fonction `quantites` que la bande. Moins de deux sous-familles nommées : `undefined`, la bande est celle d'aujourd'hui.
 */
function sousGroupesDe(cle: GroupeCle, dans: readonly LigneBande[]): SousGroupe[] | undefined {
  const noms = [...new Set(dans.map(l => l.sousFamille).filter((n): n is string => Boolean(n)))];
  if (noms.length < 2) return undefined;
  const ordre = ordreSousFamilles(cle);
  const rang = (n: string) => { const i = ordre.indexOf(n); return i < 0 ? ordre.length : i; };
  const tries = noms.map((n, i) => ({ n, i })).sort((a, b) => rang(a.n) - rang(b.n) || a.i - b.i).map(x => x.n);
  const faire = (nom: string, lignes: readonly LigneBande[], libre?: true): SousGroupe => {
    const propres = lignes.filter(l => !l.mouture);
    return {
      nom, ids: propres.map(l => l.id), qte: quantites(propres), averifier: propres.some(l => l.averifier === true),
      cents: lignes.reduce((s, l) => s + (l.amount === undefined || !Number.isFinite(l.amount) ? 0 : centimes(l.amount)), 0),
      incomplet: lignes.some(l => l.amount === undefined || !Number.isFinite(l.amount)), ...(lignes.some(l => l.montantDoute) ? { montantDoute: true } : {}), ...(libre ? { libre } : {}),
    };
  };
  const sortie = tries.map(n => faire(n, dans.filter(l => l.sousFamille === n)));
  const sans = dans.filter(l => !l.sousFamille);
  if (sans.length) sortie.push(faire('', sans, true));
  return sortie;
}

/** Les bandes (ordre fixe : malt, houblon, levure, autres) ; une bande sans ligne n'existe pas. L'ordre dans la bande est celui du papier. */
export function bandes(lignes: readonly LigneBande[]): Bande[] {
  const sortie: Bande[] = [];
  for (const cle of ORDRE_GROUPES) {
    const dans = lignes.filter(l => l.groupe === cle);
    if (!dans.length) continue;
    const propres = dans.filter(l => !l.mouture);
    const cents = dans.reduce((s, l) => s + (l.amount === undefined || !Number.isFinite(l.amount) ? 0 : centimes(l.amount)), 0);
    const sachets = cle === 'levure' && propres.length > 0 && propres.every(l => l.sachets !== undefined) ? propres.reduce((s, l) => s + (l.sachets as number), 0) : undefined;
    sortie.push({
      cle, nom: NOMS_GROUPES[cle], ids: propres.map(l => l.id), moutureIds: dans.filter(l => l.mouture).map(l => l.id), qte: quantites(propres),
      ...(sachets !== undefined ? { eqb: `= ${sachets} sachet${sachets > 1 ? 's' : ''}` } : {}), cents, incomplet: dans.some(l => l.amount === undefined || !Number.isFinite(l.amount)), ...(dans.some(l => l.montantDoute) ? { montantDoute: true } : {}),
      ...(() => { const sg = sousGroupesDe(cle, dans); return sg ? { sousGroupes: sg } : {}; })(),
    });
  }
  return sortie;
}

/**
 * D307 : le choix du brasseur sur chaque sous-groupe, `true` ouvert, `false` replié, par `cleGroupe(bande, nom)`. Sans choix, un sous-groupe est replié, sauf s'il
 * porte une ligne à vérifier (`averifier`). Un état d'écran seulement : rien n'est écrit.
 */
export type ChoixGroupes = ReadonlyMap<string, boolean>;
export const cleGroupe = (bande: string, nom: string): string => `${bande}/${nom}`;
/** Un sous-groupe se plie s'il porte une ligne de sous-famille et au moins deux rangées ; un sous-groupe d'une ligne n'a ni chevron ni ligne. */
export const pliable = (sg: SousGroupe): boolean => !sg.libre && sg.ids.length >= 2;
/**
 * Ouvert à l'écran ? Un sous-groupe non pliable : toujours. `forces` : les rangées qu'on doit voir (plateau ouvert, filtre des comptes) ouvrent leur sous-groupe
 * quel que soit le choix. Sinon le choix du brasseur, à défaut l'ouverture d'office d'une ligne à vérifier.
 */
export function groupeOuvert(bande: string, sg: SousGroupe, choix: ChoixGroupes, forces?: ReadonlySet<string>): boolean {
  if (!pliable(sg)) return true;
  if (forces && sg.ids.some(id => forces.has(id))) return true;
  return choix.get(cleGroupe(bande, sg.nom)) ?? sg.averifier;
}
/** Le choix du brasseur sur un sous-groupe. */
export function poserGroupe(choix: ChoixGroupes, bande: string, nom: string, ouvert: boolean): ChoixGroupes {
  const m = new Map(choix); m.set(cleGroupe(bande, nom), ouvert); return m;
}
const reglerTous = (liste: readonly Bande[], choix: ChoixGroupes, ouvert: boolean, bande?: string): ChoixGroupes => {
  const m = new Map(choix);
  // D333 : « Plié » ferme TOUS les groupes, même celui qui porte une ligne à voir (son en-tête garde le compte et la couleur) ; « Déplié » ouvre tout.
  for (const b of liste) if (!bande || b.cle === bande) for (const sg of b.sousGroupes ?? []) if (pliable(sg)) m.set(cleGroupe(b.cle, sg.nom), ouvert);
  return m;
};
/**
 * D311, D333 (« Plié », son choix E) : tous les sous-groupes pliables, de toutes les bandes ou d'une seule (`bande`), repliés, sans exception. Un raccourci : rien n'est figé,
 * chaque groupe se rouvre ou se referme ensuite d'un toucher (`poserGroupe`).
 */
export const toutPlier = (liste: readonly Bande[], choix: ChoixGroupes, bande?: string): ChoixGroupes => reglerTous(liste, choix, false, bande);
/** « Déplié » : tous les sous-groupes pliables, de toutes les bandes ou d'une seule, ouverts. */
export const toutDeplier = (liste: readonly Bande[], choix: ChoixGroupes, bande?: string): ChoixGroupes => reglerTous(liste, choix, true, bande);
/**
 * D311 : l'état du segment « Plié | Déplié », CALCULÉ sur l'état réel des groupes (`groupeOuvert`, rangées forcées comprises), jamais gardé : `plie` quand chaque
 * sous-groupe pliable est replié (D333 : même celui d'une ligne à vérifier), `deplie` quand tous sont ouverts, aucun des deux sinon
 * (état mêlé). `visible` : au moins un sous-groupe pliable dans les bandes (sinon le segment n'a rien à plier).
 */
export function etatSegment(liste: readonly Bande[], choix: ChoixGroupes, forces?: ReadonlySet<string>): { visible: boolean; plie: boolean; deplie: boolean } {
  const pl = liste.flatMap(b => (b.sousGroupes ?? []).filter(pliable).map(sg => ({ bande: b.cle, sg, ouvert: groupeOuvert(b.cle, sg, choix, forces) })));
  if (!pl.length) return { visible: false, plie: false, deplie: false };
  return { visible: true, plie: pl.every(x => !x.ouvert), deplie: pl.every(x => x.ouvert) };
}
/** « 18 Kg », « 270 g + 30 ? » : le texte de la colonne des quantités d'un sous-total. */
export const texteQte = (q: readonly QteGroupe[]): string => q.map(e => (e.inconnue ? `${e.n ? `${String(e.n).replace('.', ',')} ` : ''}?` : `${String(e.n).replace('.', ',')} ${e.unite === 'sachet' && e.n > 1 ? 'sachets' : e.unite}`)).join(' + ');

/** Le numéro d'une rangée en ordre Papier : son rang dans le brouillon (un port écarté laisse un trou, comme les libellés « ligne n »). */
export function numerosPapier(lines: readonly LigneMin[], port: ReadonlySet<string>): Map<string, number> {
  const m = new Map<string, number>();
  lines.forEach((l, i) => { if (!port.has(l.id)) m.set(l.id, i + 1); });
  return m;
}
