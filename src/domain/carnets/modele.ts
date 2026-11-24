/**
 * Carnet d'idées (Stocks › Matériel › Carnets, port du 17.11) : le modèle.
 *
 * Deux types de `CreativeItem`, dans la collection `creativeItems` déjà permise par les règles :
 * - `type: 'carnet'` : une idée. `title` = son titre ; `status` : `idea` (Idée), `research` (À comparer), `validated` (Choisi) ; son contenu dans `carnet`.
 * - `type: 'carnet-message'` : un message du fil, gardé tel quel (`title` = le texte brut, `status: 'done'`) ; ce qu'il a rangé dans `carnetMessage.effets`.
 *
 * Honnêteté des données : une valeur inconnue est absente, jamais 0 ni « ? ». `origine` dit d'où vient chaque valeur (picto de provenance, Q19).
 * Lecture tolérante : `lireCarnet` et `lireMessage` rendent `null` sur une forme inconnue (autre appareil, version future) ; ils ne cassent rien.
 * Aucun gabarit par objet (C2) : rien ici ne dépend d'une catégorie d'objet.
 */
import { lireDomainePose, type DomainePose } from './domaines';
import type { CreativeItem } from '../../types';
import { prioriserValeurs, traduireValeurs } from '../../../functions/src/lienLibelles';
import { lundiDe } from '../calendrier';
import { analyserLigne, prixTousDe, urlsDe } from './analyseLocale';

export const VERSION_CARNET = 1 as const;

/** D'où vient une valeur : saisie par lui, lue par l'IA, lue sur la page, calcul local, ou exemple simulé. */
export type Origine = 'vous' | 'ia' | 'page' | 'locale' | 'exemple';
export const ORIGINES: readonly Origine[] = ['vous', 'ia', 'page', 'locale', 'exemple'];

/** Sens d'une caractéristique : plus = mieux, moins = mieux, oui-non (oui = mieux), texte (non comparé). */
export type Sens = 'plus' | 'moins' | 'oui-non' | 'texte';
export const SENS: readonly Sens[] = ['plus', 'moins', 'oui-non', 'texte'];

export interface Caracteristique { nom: string; unite?: string; sens: Sens }

/**
 * « Ce qui compte » : un critère, avec la caractéristique qui le mesure si elle est connue. `source` (critique 5, n° 1) : `phrase` s'il est
 * tiré de ses mots, `ia` s'il est proposé par l'IA ; absent sur les critères d'avant : `sourceDuCritere` le déduit.
 */
export interface Critere { id: string; texte: string; raison?: string; caracteristique?: Caracteristique; origine: Origine; messageId?: string; source?: 'phrase' | 'ia' }

/**
 * Critique 5, n° 1 (pour les lots B, C, D) : « tiré de votre phrase » (`phrase`) ou « proposé par l'IA » (`ia`). La source écrite prime ;
 * sans elle : `ia` pour un critère d'origine `ia`, `phrase` pour ses mots (`vous`), le repli local (`locale`) et le reste.
 */
export const sourceDuCritere = (k: Pick<Critere, 'origine' | 'source'>): 'phrase' | 'ia' => k.source ?? (k.origine === 'ia' ? 'ia' : 'phrase');

export type EtatFacon = 'ouverte' | 'retenue' | 'ecartee';
/** Une façon de faire (D-16) : ouverte, retenue ou écartée, avec sa raison. */
export interface Facon { id: string; nom: string; etat: EtatFacon; raison?: string; origine: Origine; messageId?: string }

/** Une valeur lue pour une caractéristique (clé = son nom). `luLe` : date de lecture, si elle a été lue. */
export interface Valeur { valeur: number | string | boolean; unite?: string; origine: Origine; luLe?: string }

/** `introuvable` (D447) : le lien ne mène plus à la fiche (page morte, redirigée vers la recherche ou l'accueil, domaine disparu). */
export type LectureArticle = 'a-lire' | 'en-cours' | 'lue' | 'illisible' | 'introuvable';
/** D447 : ce que la page dit du produit (« en stock », « plus disponible ») ; un lien mort se dit « lien introuvable », rien n'est inventé. */
export function dispoDe(a: { dispo?: string; lecture?: string }): string | undefined {
  return a.lecture === 'introuvable' ? 'lien introuvable' : a.dispo;
}
/** Le port vers la Suisse lu sur la page (D447), en centimes de `devise` ; jamais inventé : absent = la page ne le dit pas. */
export interface LivraisonArticle { prixCentimes?: number; devise?: string; gratuite?: true; refusee?: true }
/** Le cours du jour vers le franc (BCE), tel que la lecture l'a posé : 1 unité de la devise d'origine = `taux` CHF. */
export interface ChangeArticle { taux: number; date: string; source: 'BCE' }
/**
 * Veille du prix (R31, D-28). Un article naît sans veille ; seul son toucher l'allume. `releveLe` n'est écrit par aucun code de ce port : la
 * relève réelle attend son accord. Tant qu'il manque, la fiche dit « demandée · pas encore relevée ».
 */
export interface Veille { active: boolean; depuis: string; releveLe?: string }

/** PX (R39) : une quantité de poids ou de volume, telle que la page l'écrit. */
export type UniteQuantite = 'g' | 'kg' | 'ml' | 'cl' | 'dl' | 'l';
const UNITES_QUANTITE: readonly string[] = ['g', 'kg', 'ml', 'cl', 'dl', 'l'];
export interface ConditionnementArticle { valeur: number; unite: UniteQuantite }
/** Le prix à l'unité tel que la page l'écrit : `prix` (unités de la devise, fractionnaire) pour 1 `unite` ; paliers : à partir de `des` `unite`. */
export interface PrixUniteArticle { prix: number; unite: UniteQuantite; paliers?: { des: number; prix: number }[] }
/** Un conditionnement publié par la page et son prix (centimes de la devise de l'article). */
export interface OffreArticle { valeur: number; unite: UniteQuantite; prixCentimes: number }

/** Un article (un produit d'un vendeur). Tout est facultatif sauf `id`, `valeurs` et `lecture` : l'inconnu est absent. */
export interface Article {
  id: string;
  url?: string;
  domaine?: string;
  nom?: string;
  prixCentimes?: number;
  /** « dès » : la page publie plusieurs prix, `prixCentimes` est le plus bas (jamais présenté comme LE prix). */
  prixDes?: true;
  /** PX (R39, R41) : la quantité à laquelle `prixCentimes` se rapporte (50 g ; 1 kg pour un prix donné au gramme, converti) ; absent : la page ne la dit pas. */
  conditionnement?: ConditionnementArticle;
  /** PX (R40) : le prix donné à l'unité par la page (0,1044 CHF/g, 0,08 dès 1 000 g), gardé tel quel à côté du prix au kilo. */
  prixUnite?: PrixUniteArticle;
  /** D450 : les deux lectures de la page (données structurées, IA sur la page entière) se contredisent ; dit pourquoi. Absent : elles s'accordent, ou une seule a lu. */
  doute?: string;
  /** PX (R41) : tous les conditionnements publiés (50 g, 250 g, 500 g, 1 kg) avec leur prix. */
  offres?: OffreArticle[];
  devise?: string;
  vendeur?: string;
  pays?: string;
  /** `ht` : le prix lu est hors taxe ; `ttc` : taxe comprise. Absent : la page ne le dit pas. */
  taxe?: 'ht' | 'ttc';
  /** Le prix taxe comprise, quand la page publie aussi le HT (centimes de `devise`). */
  prixTTCCentimes?: number;
  livraison?: LivraisonArticle;
  change?: ChangeArticle;
  dispo?: string;
  /** La première photo (cartes, vignettes) ; `photos` les garde toutes, la première comprise (D446). */
  photo?: string;
  photos?: string[];
  faconId?: string;
  valeurs: Record<string, Valeur>;
  lecture: LectureArticle;
  veille?: Veille;
  messageId?: string;
  /** D'où viennent son nom, son prix et son vendeur (picto de provenance, Q19) ; « exemple » au banc. Absent : inconnu. */
  origine?: Origine;
}

export type GenreNote = 'a-acheter' | 'a-faire' | 'question' | 'conseil' | 'note';
export const GENRES_NOTE: readonly GenreNote[] = ['a-acheter', 'a-faire', 'question', 'conseil', 'note'];

/** Une note. `groupe` : « Regrouper » (G27) ; `fusionDe` : textes d'origine gardés après une fusion (G11). */
export interface Note { id: string; texte: string; genre: GenreNote; modifieeLe?: string; messageId?: string; groupe?: { id: string; libelle: string }; fusionDe?: string[] }

/** Une photo réduite (≤ 150 ko), rangée dans le carnet ; non lue par l'IA (accord). */
export interface Photo { id: string; jpeg: string; messageId?: string; /** L-24 : la lecture l'a lue ; gardé à la lecture du document. */ lue?: true }

/** Le choix (ADR du CADRE) : un choix revu passe dans `remplaces` et reste lisible (D-20, R34). */
export interface Choix {
  articleId: string;
  faconId?: string;
  pourquoi: string;
  ecartes: { articleId: string; raison: string }[];
  aRevoirSi?: string;
  le: string;
  remplaces: Choix[];
}

/** Le contenu d'une idée (version 1). */
export interface DonneesCarnet {
  version: typeof VERSION_CARNET;
  creeLe: string;
  /** Le message d'origine, cité « votre phrase en titre ». */
  phrase: string;
  criteres: Critere[];
  facons: Facon[];
  articles: Article[];
  notes: Note[];
  photos: Photo[];
  choix?: Choix;
  /** Le plan d'À venir créé par « Envoyer dans À venir » (R32). */
  sortie?: { planId: string; le: string };
  /** Suppression v2 (D-47b) : une idée dont le plan est réalisé s'archive ; elle quitte la liste et garde tout. */
  archive?: { le: string; raison: string };
  /** D437 : le domaine posé (par lui, ou par l'IA au rangement) ; absent, il se déduit (domaines.ts). */
  domaine?: DomainePose;
}

export type CibleEffet = 'carnet' | 'critere' | 'facon' | 'article' | 'note' | 'photo';
export const CIBLES_EFFET: readonly CibleEffet[] = ['carnet', 'critere', 'facon', 'article', 'note', 'photo'];

/**
 * Ce qu'un message a rangé. `carnetSupprime` : le carnet a été supprimé depuis ; le message reste (L33).
 * `fusion` (P7) : le message a précisé un critère déjà là, de même caractéristique (« le débit » → « … : 1 200 m³/h au moins ») ; l'effet
 * garde le critère d'avant, que `remplacerRangement` remet au lieu de retirer le critère.
 */
export interface EffetMessage {
  carnetId: string; cible: CibleEffet; id: string; carnetSupprime?: true; fusion?: { texte: string; origine: Origine; messageId?: string };
  /** T25-5 : un lien déjà dans ce carnet (même adresse canonique) : le message renvoie à l'article qui y était, sans en créer un ; le défaire ne le retire pas. */
  existant?: true;
}

/**
 * P10, P23 (D-35, D-24) : un critère que l'IA propose sans l'écrire (la caractéristique commune lue sur deux articles). Il reste sur le
 * message ; « accepter » (`accepterProposition`) le range comme une ligne ordinaire.
 */
export interface PropositionCritere { carnetId: string; texte: string; caracteristique?: Caracteristique; origine: Origine }

export type Rangement = 'ia' | 'locale' | 'simulee' | 'brut';

/** Un message du fil (D-142). `depuis` : 'liste' ou l'id du carnet ouvert. `titrePropose` : G29 (R46), jamais appliqué sans son geste. */
export interface DonneesMessage {
  texte: string;
  le: string;
  depuis: 'liste' | string;
  rangement: Rangement;
  effets: EffetMessage[];
  titrePropose?: { carnetId: string; titre: string; applique?: boolean };
  /** G11 : « Garder à part » touché ; la proposition de fusion ne revient pas pour ce message. */
  gardeAPart?: true;
  /** P10, P23 : les critères proposés par l'IA, pas encore acceptés. */
  propositions?: PropositionCritere[];
}

export type StatutCarnet = 'idea' | 'research' | 'validated';

export type CarnetDoc = CreativeItem & { type: 'carnet'; status: StatutCarnet; carnet: DonneesCarnet };
export type MessageDoc = CreativeItem & { type: 'carnet-message'; carnetMessage: DonneesMessage };

/* ---------- lecture tolérante ---------- */

const estObjet = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const texteNonVide = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const optTexte = (v: unknown): string | undefined => (typeof v === 'string' && v !== '' ? v : undefined);
const origineLue = (v: unknown): Origine => (ORIGINES.includes(v as Origine) ? (v as Origine) : 'vous');
const nombreFini = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Retire les clés `undefined` (Firestore les refuse, et `toEqual` les distingue). */
export function sansIndefinis<T extends object>(o: T): T {
  const r: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) r[k] = v;
  return r as T;
}

/**
 * Passe-plat (D451, PLAN § Risques 1 ; lecteur tolérant, patron expand/contract) : les clés qu'un lecteur ne connaît pas (écrites par une
 * version plus récente, un autre appareil) survivent à la lecture et à la réécriture du document ; sans lui, l'ancien client les jette et
 * efface le travail du neuf. `connues` : tout ce que le lecteur regarde, même s'il écarte une valeur mal formée (comportement d'avant).
 */
export function inconnues(brut: Record<string, unknown>, connues: readonly string[]): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(brut)) if (!connues.includes(k) && v !== undefined) r[k] = v;
  return r;
}

const CLES_CARACTERISTIQUE = ['nom', 'unite', 'sens'];
function lireCaracteristique(v: unknown): Caracteristique | undefined {
  if (!estObjet(v) || !texteNonVide(v.nom) || !SENS.includes(v.sens as Sens)) return undefined;
  return { ...inconnues(v, CLES_CARACTERISTIQUE), ...sansIndefinis({ nom: v.nom, unite: optTexte(v.unite), sens: v.sens as Sens }) };
}

const CLES_CRITERE = ['id', 'texte', 'raison', 'caracteristique', 'origine', 'messageId', 'source'];
function lireCritere(v: unknown): Critere | null {
  if (!estObjet(v) || !texteNonVide(v.id) || !texteNonVide(v.texte)) return null;
  return {
    ...inconnues(v, CLES_CRITERE),
    ...sansIndefinis({
      id: v.id, texte: v.texte, raison: optTexte(v.raison), caracteristique: lireCaracteristique(v.caracteristique), origine: origineLue(v.origine), messageId: optTexte(v.messageId),
      source: v.source === 'phrase' || v.source === 'ia' ? v.source : undefined
    })
  };
}

const CLES_FACON = ['id', 'nom', 'etat', 'raison', 'origine', 'messageId'];
function lireFacon(v: unknown): Facon | null {
  if (!estObjet(v) || !texteNonVide(v.id) || !texteNonVide(v.nom)) return null;
  const etat: EtatFacon = v.etat === 'retenue' || v.etat === 'ecartee' ? v.etat : 'ouverte';
  return { ...inconnues(v, CLES_FACON), ...sansIndefinis({ id: v.id, nom: v.nom, etat, raison: optTexte(v.raison), origine: origineLue(v.origine), messageId: optTexte(v.messageId) }) };
}

const CLES_VALEUR = ['valeur', 'unite', 'origine', 'luLe'];
function lireValeurs(v: unknown): Record<string, Valeur> {
  const sortie: Record<string, Valeur> = {};
  if (!estObjet(v)) return sortie;
  for (const [nom, brut] of Object.entries(v)) {
    if (!estObjet(brut)) continue;
    const valeur = brut.valeur;
    /* une valeur inconnue est absente : null, NaN, chaîne vide ne deviennent jamais 0 */
    if (!(nombreFini(valeur) || typeof valeur === 'boolean' || texteNonVide(valeur))) continue;
    sortie[nom] = { ...inconnues(brut, CLES_VALEUR), ...sansIndefinis({ valeur, unite: optTexte(brut.unite), origine: origineLue(brut.origine), luLe: optTexte(brut.luLe) }) };
  }
  return sortie;
}

const CLES_VEILLE = ['active', 'depuis', 'releveLe'];
function lireVeille(v: unknown): Veille | undefined {
  if (!estObjet(v) || typeof v.active !== 'boolean' || !texteNonVide(v.depuis)) return undefined;
  return { ...inconnues(v, CLES_VEILLE), ...sansIndefinis({ active: v.active, depuis: v.depuis, releveLe: optTexte(v.releveLe) }) };
}

/**
 * Décode les entités HTML (`&apos;`, `&#39;`, `&amp;`, `&nbsp;`…) : méthode standard du navigateur (DOMParser), aucune regex maison. Le `<` est
 * protégé pour qu'un texte n'ouvre jamais une balise. Sans DOMParser (hors navigateur et jsdom) ou sans `&` : le texte tel quel.
 * L-25 : une page qui encode deux fois (« d&amp;#039;acier ») se lisait « d&#039;acier » sur les articles lus avant CRP-2, que le serveur
 * n'a jamais décodés : le décodage se répète jusqu'au point fixe, trois passes au plus.
 */
export function decoderEntites(s: string): string {
  let t = s;
  for (let passe = 0; passe < 3 && t.includes('&') && typeof DOMParser !== 'undefined'; passe += 1) {
    const d = new DOMParser().parseFromString(`<!doctype html><body>${t.replace(/</g, '&lt;')}`, 'text/html').body.textContent ?? t;
    if (d === t) break;
    t = d;
  }
  return t;
}

const sansAccentsBas = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/** CRB-9 : « Chambre froide - Modèle 6 m³ » dans le carnet « Chambre froide » se lit « Modèle 6 m³ » ; un nom égal au titre ou autre : inchangé. */
export function nomSansTitre(nom: string, titre: string): string {
  const t = sansAccentsBas(titre);
  if (!t) return nom;
  const debut = nom.replace(/^\s+/, '');
  if (!sansAccentsBas(debut).startsWith(t)) return nom;
  const m = /^\s*[-–—:]\s+(\S[\s\S]*)$/.exec(debut.slice(titre.trim().length));
  return m ? m[1].trim() : nom;
}

/**
 * T28-12, T28-13, T30-13, T30-14 : les noms et valeurs lus sur une page allemande ou anglaise se disent en français, par la même table que le
 * serveur (`lienLibelles.ts`, `lienValeurs.ts`) : un article rangé avant ces tables garde, dans le carnet, « Full volume » et « 143.50 cm » ;
 * ici ils se lisent « Volume total » et « 143,5 cm ». Ce que le brasseur a écrit (origine « vous ») et les oui-non ne sont jamais touchés ;
 * un nombre reste un nombre. Idempotent : du français repasse tel quel. Rien n'est réécrit dans le carnet.
 */
export function valeursEnFrancais(valeurs: Record<string, Valeur>): Record<string, Valeur> {
  const entrees = Object.entries(valeurs);
  const lues = entrees.filter(([, v]) => v.origine !== 'vous' && typeof v.valeur !== 'boolean');
  if (!lues.length) return valeurs;
  const liste = lues.map(([nom, v]) => ({ nom, valeur: String(v.valeur), ...(v.unite ? { unite: v.unite } : {}), orig: v }));
  const traduites = traduireValeurs(liste) ?? liste;
  const sortie: Record<string, Valeur> = {};
  for (const t of traduites) {
    const o = t.orig;
    const { valeur: _v, unite: _u, ...autres } = o;
    /* un nombre reste un nombre, sauf quand la fusion en a fait une plage (C50-3 : « 0 à 8 °C » réunit deux bornes) */
    const plage = typeof o.valeur === 'number' && t.valeur !== String(o.valeur) && / à /.test(t.valeur);
    sortie[t.nom] = { ...autres, valeur: typeof o.valeur === 'number' && !plage ? o.valeur : t.valeur, ...(t.unite ? { unite: t.unite } : {}) };
  }
  for (const [nom, v] of entrees) if (v.origine === 'vous' || typeof v.valeur === 'boolean') sortie[nom] = v;
  /* E47-5 (rouvert en ligne) : l'essentiel (volume, matière, induction, énergie, consommation, température) d'abord, les numéros en dernier, QUEL QUE
     SOIT l'ordre dans lequel l'article a été gardé (ordre de la page, ou de Firestore) : la fiche et le résumé de la carte lisent cet ordre. */
  return Object.fromEntries(prioriserValeurs(Object.entries(sortie).map(([nom, v]) => ({ nom, valeur: String(v.valeur ?? ''), ...(v.unite ? { unite: v.unite } : {}), v })), (x) => x.nom, false).map(x => [x.nom, x.v]));
}

/** CRP-2, CRB-9 (à la lecture, rien n'est réécrit) : entités décodées, « Couleur : » sans ses deux-points, nom sans le titre du carnet. */
function articleNet(a: Article, titre: string): Article {
  const valeurs: Record<string, Valeur> = {};
  for (const [nom, v] of Object.entries(a.valeurs)) {
    const net = decoderEntites(nom).replace(/\s*[:：]\s*$/, '').trim() || nom;
    valeurs[net] = { ...v, ...(typeof v.valeur === 'string' ? { valeur: decoderEntites(v.valeur) } : {}) };
  }
  const nom = a.nom !== undefined ? nomSansTitre(decoderEntites(a.nom), titre) : undefined;
  return sansIndefinis({ ...a, nom, valeurs: valeursEnFrancais(valeurs) });
}

const LECTURES: readonly LectureArticle[] = ['a-lire', 'en-cours', 'lue', 'illisible', 'introuvable'];
const PHOTOS_MAX = 12;

function lireLivraison(v: unknown): LivraisonArticle | undefined {
  if (!estObjet(v)) return undefined;
  const l = sansIndefinis<LivraisonArticle>({
    prixCentimes: nombreFini(v.prixCentimes) && v.prixCentimes >= 0 ? Math.round(v.prixCentimes) : undefined, devise: optTexte(v.devise),
    gratuite: v.gratuite === true ? true : undefined, refusee: v.refusee === true ? true : undefined
  });
  return Object.keys(l).length ? l : undefined;
}
const uniteQuantite = (v: unknown): UniteQuantite | undefined => (typeof v === 'string' && UNITES_QUANTITE.includes(v) ? (v as UniteQuantite) : undefined);
function lireConditionnement(v: unknown): ConditionnementArticle | undefined {
  const u = estObjet(v) ? uniteQuantite(v.unite) : undefined;
  return estObjet(v) && u && nombreFini(v.valeur) && v.valeur > 0 ? { valeur: v.valeur, unite: u } : undefined;
}
function lirePrixUnite(v: unknown): PrixUniteArticle | undefined {
  const u = estObjet(v) ? uniteQuantite(v.unite) : undefined;
  if (!estObjet(v) || !u || !nombreFini(v.prix) || !(v.prix > 0)) return undefined;
  const paliers = Array.isArray(v.paliers) ? v.paliers.filter((p): p is { des: number; prix: number } => estObjet(p) && nombreFini(p.des) && p.des > 0 && nombreFini(p.prix) && p.prix > 0).map(p => ({ des: p.des, prix: p.prix })) : [];
  return { prix: v.prix, unite: u, ...(paliers.length ? { paliers } : {}) };
}
function lireOffres(v: unknown): OffreArticle[] | undefined {
  const l = Array.isArray(v) ? v.flatMap((o): OffreArticle[] => { const u = estObjet(o) ? uniteQuantite(o.unite) : undefined; return estObjet(o) && u && nombreFini(o.valeur) && o.valeur > 0 && nombreFini(o.prixCentimes) && o.prixCentimes > 0 ? [{ valeur: o.valeur, unite: u, prixCentimes: Math.round(o.prixCentimes) }] : []; }) : [];
  return l.length ? l : undefined;
}
function lireChange(v: unknown): ChangeArticle | undefined {
  return estObjet(v) && nombreFini(v.taux) && v.taux > 0 && texteNonVide(v.date) ? { taux: v.taux, date: v.date, source: 'BCE' } : undefined;
}
function lirePhotos(v: unknown): string[] | undefined {
  const l = Array.isArray(v) ? [...new Set(v.filter(texteNonVide))].slice(0, PHOTOS_MAX) : [];
  return l.length ? l : undefined;
}

const CLES_ARTICLE = [
  'id', 'url', 'domaine', 'nom', 'prixCentimes', 'prixDes', 'doute', 'conditionnement', 'prixUnite', 'offres', 'taxe', 'prixTTCCentimes', 'livraison', 'change', 'devise', 'vendeur', 'pays',
  'dispo', 'photo', 'photos', 'faconId', 'valeurs', 'lecture', 'veille', 'messageId', 'origine'
];
function lireArticle(v: unknown): Article | null {
  if (!estObjet(v) || !texteNonVide(v.id)) return null;
  const prixOk = nombreFini(v.prixCentimes);
  return { ...inconnues(v, CLES_ARTICLE), ...lireArticleConnu(v, v.id, prixOk) };
}
function lireArticleConnu(v: Record<string, unknown>, id: string, prixOk: boolean): Article {
  return sansIndefinis({
    id, url: optTexte(v.url), domaine: optTexte(v.domaine), nom: optTexte(v.nom),
    prixCentimes: nombreFini(v.prixCentimes) && v.prixCentimes >= 0 ? Math.round(v.prixCentimes) : undefined,
    prixDes: v.prixDes === true && nombreFini(v.prixCentimes) ? true : undefined,
    doute: optTexte(v.doute),
    conditionnement: prixOk ? lireConditionnement(v.conditionnement) : undefined, prixUnite: prixOk ? lirePrixUnite(v.prixUnite) : undefined, offres: prixOk ? lireOffres(v.offres) : undefined,
    taxe: prixOk && (v.taxe === 'ht' || v.taxe === 'ttc') ? v.taxe : undefined,
    prixTTCCentimes: prixOk && nombreFini(v.prixTTCCentimes) && v.prixTTCCentimes > 0 ? Math.round(v.prixTTCCentimes) : undefined,
    livraison: lireLivraison(v.livraison), change: prixOk ? lireChange(v.change) : undefined,
    devise: optTexte(v.devise), vendeur: optTexte(v.vendeur), pays: optTexte(v.pays), dispo: optTexte(v.dispo), photo: optTexte(v.photo), photos: lirePhotos(v.photos),
    faconId: optTexte(v.faconId), valeurs: lireValeurs(v.valeurs), lecture: LECTURES.includes(v.lecture as LectureArticle) ? (v.lecture as LectureArticle) : 'a-lire',
    veille: lireVeille(v.veille), messageId: optTexte(v.messageId), origine: ORIGINES.includes(v.origine as Origine) ? (v.origine as Origine) : undefined
  });
}

const CLES_NOTE = ['id', 'texte', 'genre', 'modifieeLe', 'messageId', 'groupe', 'fusionDe'];
function lireNote(v: unknown): Note | null {
  if (!estObjet(v) || !texteNonVide(v.id) || !texteNonVide(v.texte)) return null;
  const groupe = estObjet(v.groupe) && texteNonVide(v.groupe.id) && typeof v.groupe.libelle === 'string' ? { id: v.groupe.id, libelle: v.groupe.libelle } : undefined;
  const fusionDe = Array.isArray(v.fusionDe) ? v.fusionDe.filter(texteNonVide) : undefined;
  return {
    ...inconnues(v, CLES_NOTE),
    ...sansIndefinis({
      id: v.id, texte: v.texte, genre: GENRES_NOTE.includes(v.genre as GenreNote) ? (v.genre as GenreNote) : 'note', modifieeLe: optTexte(v.modifieeLe),
      messageId: optTexte(v.messageId), groupe, fusionDe: fusionDe && fusionDe.length ? fusionDe : undefined
    })
  };
}

const CLES_PHOTO = ['id', 'jpeg', 'messageId', 'lue'];
function lirePhoto(v: unknown): Photo | null {
  if (!estObjet(v) || !texteNonVide(v.id) || !texteNonVide(v.jpeg)) return null;
  return { ...inconnues(v, CLES_PHOTO), ...sansIndefinis({ id: v.id, jpeg: v.jpeg, messageId: optTexte(v.messageId), lue: v.lue === true ? (true as const) : undefined }) };
}

const CLES_CHOIX = ['articleId', 'faconId', 'pourquoi', 'ecartes', 'aRevoirSi', 'le', 'remplaces'];
function lireChoix(v: unknown, profondeur = 0): Choix | undefined {
  if (!estObjet(v) || !texteNonVide(v.articleId) || typeof v.pourquoi !== 'string' || !texteNonVide(v.le) || profondeur > 20) return undefined;
  const ecartes = Array.isArray(v.ecartes) ? v.ecartes.filter((e): e is { articleId: string; raison: string } => estObjet(e) && texteNonVide(e.articleId) && typeof e.raison === 'string').map(e => ({ articleId: e.articleId, raison: e.raison })) : [];
  const remplaces = Array.isArray(v.remplaces) ? v.remplaces.map(r => lireChoix(r, profondeur + 1)).filter((r): r is Choix => !!r) : [];
  return { ...inconnues(v, CLES_CHOIX), ...sansIndefinis({ articleId: v.articleId, faconId: optTexte(v.faconId), pourquoi: v.pourquoi, ecartes, aRevoirSi: optTexte(v.aRevoirSi), le: v.le, remplaces }) };
}

const liste = <T>(v: unknown, lire: (x: unknown) => T | null): T[] | null => {
  if (v === undefined) return [];
  if (!Array.isArray(v)) return null;
  return v.map(lire).filter((x): x is T => x !== null);
};

const CLES_CARNET = ['version', 'creeLe', 'phrase', 'criteres', 'facons', 'articles', 'notes', 'photos', 'choix', 'sortie', 'archive', 'domaine'];

/** Le contenu d'une idée, normalisé ; `null` si la forme est inconnue. Les clés inconnues sont gardées (passe-plat, D451). */
export function lireDonneesCarnet(v: unknown): DonneesCarnet | null {
  if (!estObjet(v) || v.version !== VERSION_CARNET || typeof v.creeLe !== 'string' || typeof v.phrase !== 'string') return null;
  const criteres = liste(v.criteres, lireCritere), facons = liste(v.facons, lireFacon), articles = liste(v.articles, lireArticle);
  const notes = liste(v.notes, lireNote), photos = liste(v.photos, lirePhoto);
  if (!criteres || !facons || !articles || !notes || !photos) return null;
  const sortie = estObjet(v.sortie) && texteNonVide(v.sortie.planId) && typeof v.sortie.le === 'string' ? { planId: v.sortie.planId, le: v.sortie.le } : undefined;
  const archive = estObjet(v.archive) && typeof v.archive.le === 'string' && typeof v.archive.raison === 'string' ? { le: v.archive.le, raison: v.archive.raison } : undefined;
  return { ...inconnues(v, CLES_CARNET), ...sansIndefinis({ version: VERSION_CARNET, creeLe: v.creeLe, phrase: v.phrase, criteres, facons, articles, notes, photos, choix: lireChoix(v.choix), sortie, archive, domaine: lireDomainePose(v.domaine) }) };
}

const STATUTS: readonly StatutCarnet[] = ['idea', 'research', 'validated'];

/** Une idée du carnet, normalisée ; `null` si ce n'en est pas une ou si sa forme est inconnue. */
export function lireCarnet(item: CreativeItem | null | undefined): CarnetDoc | null {
  if (!item || item.type !== 'carnet' || !texteNonVide(item.id)) return null;
  const carnet = lireDonneesCarnet(item.carnet);
  if (!carnet) return null;
  const status: StatutCarnet = STATUTS.includes(item.status as StatutCarnet) ? (item.status as StatutCarnet) : statutDe(carnet);
  return { ...item, type: 'carnet', status, carnet: { ...carnet, articles: carnet.articles.map(a => articleNet(a, item.title)) } };
}

const RANGEMENTS: readonly Rangement[] = ['ia', 'locale', 'simulee', 'brut'];
const CLES_EFFET = ['carnetId', 'cible', 'id', 'carnetSupprime', 'fusion', 'existant'];
const CLES_TITRE_PROPOSE = ['carnetId', 'titre', 'applique'];
const CLES_PROPOSITION = ['carnetId', 'texte', 'caracteristique', 'origine'];
const CLES_MESSAGE = ['texte', 'le', 'depuis', 'rangement', 'effets', 'titrePropose', 'gardeAPart', 'propositions'];

/** Un message du fil, normalisé ; `null` si ce n'en est pas un. Un `titrePropose` mal formé est ignoré (R46). */
export function lireMessage(item: CreativeItem | null | undefined): MessageDoc | null {
  if (!item || item.type !== 'carnet-message' || !texteNonVide(item.id)) return null;
  const m = item.carnetMessage as unknown;
  if (!estObjet(m) || typeof m.texte !== 'string' || typeof m.le !== 'string' || !texteNonVide(m.depuis)) return null;
  const effets = Array.isArray(m.effets)
    ? m.effets.filter((e): e is EffetMessage => estObjet(e) && texteNonVide(e.carnetId) && CIBLES_EFFET.includes(e.cible as CibleEffet) && texteNonVide(e.id))
      .map(e => {
        const f = (e as { fusion?: unknown }).fusion;
        const fusion = estObjet(f) && typeof f.texte === 'string' && typeof f.origine === 'string'
          ? sansIndefinis({ texte: f.texte, origine: f.origine as Origine, messageId: texteNonVide(f.messageId) ? f.messageId : undefined }) : undefined;
        return { ...inconnues(e as unknown as Record<string, unknown>, CLES_EFFET), ...sansIndefinis({ carnetId: e.carnetId, cible: e.cible, id: e.id, carnetSupprime: e.carnetSupprime === true ? (true as const) : undefined, fusion, existant: e.existant === true ? (true as const) : undefined }) };
      })
    : [];
  const t = m.titrePropose;
  const titrePropose = estObjet(t) && texteNonVide(t.carnetId) && texteNonVide(t.titre)
    ? { ...inconnues(t, CLES_TITRE_PROPOSE), ...sansIndefinis({ carnetId: t.carnetId, titre: t.titre, applique: t.applique === true ? true : undefined }) } : undefined;
  const propositions = Array.isArray(m.propositions)
    ? m.propositions.filter((p): p is PropositionCritere => estObjet(p) && texteNonVide(p.carnetId) && texteNonVide(p.texte) && typeof p.origine === 'string')
      .map(p => ({ ...inconnues(p as unknown as Record<string, unknown>, CLES_PROPOSITION), ...sansIndefinis({ carnetId: p.carnetId, texte: p.texte, origine: p.origine, caracteristique: estObjet(p.caracteristique) ? { ...p.caracteristique } : undefined }) }))
    : [];
  const carnetMessage: DonneesMessage = {
    ...inconnues(m, CLES_MESSAGE),
    ...sansIndefinis({
      texte: m.texte, le: m.le, depuis: m.depuis, rangement: RANGEMENTS.includes(m.rangement as Rangement) ? (m.rangement as Rangement) : 'brut', effets, titrePropose,
      gardeAPart: m.gardeAPart === true ? (true as const) : undefined, propositions: propositions.length ? propositions : undefined
    })
  };
  return { ...item, type: 'carnet-message', carnetMessage };
}

/** Un document du carnet d'idées (idée ou message) : jamais lu par l'Atelier, le calendrier en rangée, À venir ni le compte des tâches. */
export const estDocCarnet = (item: Pick<CreativeItem, 'type'> | null | undefined): boolean => !!item && (item.type === 'carnet' || item.type === 'carnet-message');

/** Statut d'après le contenu : un choix → Choisi ; au moins un article → À comparer ; sinon Idée. */
export function statutDe(carnet: Pick<DonneesCarnet, 'articles' | 'choix'>): StatutCarnet {
  if (carnet.choix) return 'validated';
  /* tour 3, PCN-155 : « À comparer » demande au moins un article lu ; un lien à lire ou illisible laisse l'idée en Idée */
  return carnet.articles.some(a => a.lecture === 'lue') ? 'research' : 'idea';
}

/** Les idées de la liste : lisibles et non archivées (une archivée se rouvre depuis Réalisés). `archives: true` les rend aussi. */
export function lireCarnets(items: readonly CreativeItem[], options: { archives?: boolean } = {}): CarnetDoc[] {
  return items.map(lireCarnet).filter((c): c is CarnetDoc => !!c && (options.archives === true || !c.carnet.archive));
}

/** Les messages du fil, lisibles. */
export const lireMessages = (items: readonly CreativeItem[]): MessageDoc[] => items.map(lireMessage).filter((m): m is MessageDoc => !!m);

/* ---------- le fil (R25, R39) ---------- */

export interface EntreeFil { message: MessageDoc; carnetSupprime: boolean }

/**
 * Le fil : les messages en ordre chronologique (puis par id, stable). `carnetId` null : tout le fil ; sinon ceux écrits depuis ce carnet ou qui
 * y ont rangé quelque chose. Les messages d'un carnet supprimé restent, marqués `carnetSupprime` (effet marqué, ou carnet absent de `carnets`).
 */
export function filDe(items: readonly CreativeItem[], carnetId: string | null, carnets?: readonly CreativeItem[]): EntreeFil[] {
  const existants = carnets ? new Set(carnets.filter(c => c.type === 'carnet').map(c => c.id)) : null;
  return lireMessages(items)
    .filter(m => carnetId === null || m.carnetMessage.depuis === carnetId || m.carnetMessage.effets.some(e => e.carnetId === carnetId))
    .map(message => {
      const vises = message.carnetMessage.effets.filter(e => carnetId === null || e.carnetId === carnetId);
      const supprime = vises.some(e => e.carnetSupprime === true || (existants !== null && !existants.has(e.carnetId)));
      return { message, carnetSupprime: supprime };
    })
    .sort((a, b) => a.message.carnetMessage.le.localeCompare(b.message.carnetMessage.le) || a.message.id.localeCompare(b.message.id));
}

/* ---------- constructeurs ---------- */

export const nouvelIdCarnet = (prefixe: string): string => `${prefixe}-${globalThis.crypto.randomUUID()}`;
const maintenant = (): string => new Date().toISOString();

/** Un carnet vide, né d'une phrase. Aucune valeur inventée. */
export function donneesVides(phrase: string, creeLe: string): DonneesCarnet {
  return { version: VERSION_CARNET, creeLe, phrase, criteres: [], facons: [], articles: [], notes: [], photos: [] };
}

/** Un lien écrit sans « https:// » (« inox-riviera.ch/evier ») : le même motif que `liensDuTexte` (ia.ts), domaine connu suivi de « / ». */
const DOMAINE_NU = /^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:ch|com|de|fr|it|at|eu|net|org|shop|store)\/\S*$/i;

/**
 * Le domaine d'un texte qui n'est qu'un lien (« https://www.exemple.invalid/a » → « exemple.invalid ») ; `null` s'il porte autre chose
 * qu'un lien (un mot, une phrase, un lien entouré de texte). Parseur WHATWG `URL`, comme `liensDuTexte` (§ État de l'art).
 */
export function domaineDuLienSeul(texte: string): string | null {
  const t = texte.trim().replace(/[.,;:!?)\]]+$/, '');
  if (!t || /\s/.test(t)) return null;
  const adresse = /^https?:\/\//i.test(t) ? t : /^www\./i.test(t) || DOMAINE_NU.test(t) ? `https://${t}` : null;
  if (!adresse) return null;
  try {
    const hote = new URL(adresse).hostname.replace(/^www\./i, '');
    return hote.includes('.') ? hote : null;
  } catch { return null; }
}

/** Vrai si la phrase n'est qu'un lien : elle ne peut pas servir de titre (« votre phrase en titre » ne se dit pas). */
export const estLienSeul = (phrase: string): boolean => domaineDuLienSeul(phrase) !== null;

/* Mots qui annoncent un prix (« à 45.50 CHF », « prix 4 900 CHF ») et qui le suivent (« 85 CHF pièce ») : retirés avec lui du titre. */
/* L-29 : « budget 400 CHF », « budget max de 400 CHF », « max 250 CHF » partent aussi, sans laisser « budget » en bout de titre */
const AVANT_PRIX = /(?:^|\s)(?:au prix de|à partir de|(?:budget|plafond)(?:\s+max(?:imum|\.)?)?(?:\s+(?:de|à))?|max(?:imum|\.)?(?:\s+(?:de|à))?|jusqu['’]à|prix|à|a|pour|de|dès|env\.?|environ|vers|pr\.?)\s*$/i;
const APRES_PRIX = /^\s*(?:la pièce|pièces?|pce|pc|\/\s*pièce|l['’]unité|chacune?|HT|TTC)(?=$|[\s.,;:!?)])/i;
const PREFIXE_TEST = /^ZZ TEST\s*[—–-]\s*/i;
const MARQUE_TEST_SEULE = /^ZZ TEST(?:\s*[—–-]\s*)?/i;
export interface PrixLu { centimes: number; devise: 'CHF' | 'EUR'; debut: number; fin: number }

/**
 * Les prix d'un texte : `prixTousDe` (§ État de l'art), qui ne lit plus une devise collée à la fin d'un mot (P40, « moteur 189,90 CHF »
 * → 189,90 CHF). Appelants inchangés.
 */
export function prixLus(texte: string): PrixLu[] {
  return prixTousDe(texte).map(({ centimes, devise, debut, fin }) => ({ centimes, devise, debut, fin }));
}

/**
 * Une ligne sans ses liens ni ses prix (P1, vision 3 ; R11 g5:v04-4 « votre phrase en titre ») : ils vont à l'article (lien en clair
 * dans le message, R16, R25), pas dans le titre. Liens et prix lus par `analyseLocale` (motifs + `new URL`, `parseDecimal` : § État de
 * l'art), via `prixLus` ; un mot qui annonce le prix (« à », « prix ») ou le suit (« pièce ») part avec lui ; parenthèses vides et
 * séparateurs en bout de ligne retirés.
 */
export function sansLiensNiPrix(ligne: string): string {
  const plages: { debut: number; fin: number }[] = urlsDe(ligne).map(u => ({ debut: u.debut, fin: u.fin }));
  for (const p of prixLus(ligne)) {
    let { debut, fin } = p;
    const avant = AVANT_PRIX.exec(ligne.slice(0, debut));
    if (avant) debut = avant.index + (/^\s/.test(avant[0]) ? 1 : 0);
    const apres = APRES_PRIX.exec(ligne.slice(fin));
    if (apres) fin += apres[0].length;
    plages.push({ debut, fin });
  }
  plages.sort((a, b) => a.debut - b.debut);
  let sortie = '', curseur = 0;
  for (const p of plages) {
    if (p.debut < curseur) { curseur = Math.max(curseur, p.fin); continue; }
    sortie += `${ligne.slice(curseur, p.debut)} `;
    curseur = p.fin;
  }
  sortie += ligne.slice(curseur);
  if (!plages.length) return ligne.trim();
  return sortie
    /* « sur brauladen.de/… » : la préposition qui menait au lien retiré ne reste pas seule en bout de ligne */
    .replace(/\s(?:sur|chez|via|voir|ici)\s*$/i, () => ' ')
    .replace(/\(\s*\)|\[\s*\]/g, () => ' ')
    .replace(/\s+/g, () => ' ')
    .replace(/\s+([,;.)])/g, (_m, signe: string) => signe)
    .replace(/([,;])(?:\s*[,;])+/g, (_m, signe: string) => signe)
    .replace(/^[\s,;:·\-–—]+/, () => '')
    .replace(/[\s,;:.·\-–—]+$/, () => '')
    .trim();
}

/**
 * Le titre tiré d'une phrase : sa première ligne non vide, sans liens ni prix (`sansLiensNiPrix`), rognée à 120 caractères. Une ligne
 * qui n'est qu'un lien ne devient jamais le titre : son domaine la remplace (P3, g5:v03-10), jusqu'à ce que la page lue donne un nom.
 * Une ligne sans un mot une fois liens et prix retirés : le domaine de son lien (préfixe « ZZ TEST — » gardé), sinon la ligne telle quelle.
 * `carnet.phrase` garde, elle, la phrase entière (R25).
 */
export function titreDePhrase(phrase: string): string {
  const ligne = phrase.split(/\r?\n/).map(l => l.trim()).find(l => l !== '') ?? '';
  const domaine = domaineDuLienSeul(ligne);
  if (domaine) return domaine;
  const propre = sansLiensNiPrix(ligne);
  let titre = propre;
  if (!/\p{L}/u.test(propre.replace(MARQUE_TEST_SEULE, ''))) {
    const lien = urlsDe(ligne)[0];
    const prefixe = PREFIXE_TEST.exec(ligne)?.[0] ?? '';
    titre = lien ? `${prefixe}${lien.domaine}` : ligne;
  }
  /* P4 (G5, g5:v01-4) : « Moulin à malt : 2 cylindres, 150 kg/h minimum » → titre « Moulin à malt » ; le critère va dans Ce qui compte. */
  const deux = /^(.{2,60}?)\s*:\s*(.+)$/u.exec(titre);
  if (deux && /\p{L}/u.test(deux[1].replace(MARQUE_TEST_SEULE, '')) && analyserLigne(deux[2]).sorte === 'critere') titre = deux[1].trim();
  return titre.length > 120 ? `${titre.slice(0, 119).trimEnd()}…` : titre;
}

/** Les verbes d'achat qui précèdent l'objet (« commander un robinet à pédale ») : retirés du titre d'un carnet neuf, avec leur article. */
const VERBE_ACHAT = /^(?:commander|acheter|racheter|prendre|trouver)\s+(?:(?:une|un|des|du|de la|les|le|la)\s+|l['’]\s*)/i;

/**
 * Critique 5, n° 30 : le titre d'un carnet né d'une note en vrac, mis en forme. Le nom de l'objet : la ligne sans liens ni prix
 * (`titreDePhrase`), sans préfixe de test, son libellé de tête s'il y en a un (« Moulin à malt : est-ce que… » → « Moulin à malt »),
 * sinon jusqu'à la première virgule ou au « ? », sans verbe d'achat en tête ; une majuscule initiale ; 60 caractères au plus (coupé à un mot).
 * Le préfixe « ZZ TEST — » de la ligne est gardé (données de test, L05). Rien d'inventé : chaque mot vient de la ligne.
 */
export function titreNeufDe(ligne: string): string {
  const brut = titreDePhrase(ligne);
  const prefixe = PREFIXE_TEST.exec(brut)?.[0] ?? '';
  let t = brut.slice(prefixe.length).trim();
  const lib = /^([^:]{2,60}?)\s*:\s*\S/.exec(t);
  if (lib && /\p{L}/u.test(lib[1])) t = lib[1];
  else t = t.split(/[,;?!]/)[0];
  t = t.replace(VERBE_ACHAT, () => '').replace(/[\s.:·\-–—]+$/, () => '').trim() || brut.slice(prefixe.length).trim();
  if (t.length > 60) t = `${t.slice(0, 60).replace(/\s+\S*$/, () => '')}…`;
  return `${prefixe}${t.charAt(0).toLocaleUpperCase('fr-CH')}${t.slice(1)}`;
}

/**
 * R17 (g5:v06-10, D-138) : « lu sur la page : nom, prix, photo, débit, tient 80 °C » : ce que la page lue a donné à l'article, dans cet
 * ordre ; `null` si l'article n'a pas de lien lu ou si rien n'a été lu. Les noms des valeurs sont ceux de la page, rien d'inventé.
 */
export function extraitLu(a: Pick<Article, 'url' | 'lecture' | 'nom' | 'prixCentimes' | 'photo' | 'valeurs'>): string | null {
  if (!a.url || a.lecture !== 'lue') return null;
  const lu = [
    a.nom ? 'nom' : null, a.prixCentimes !== undefined ? 'prix' : null, a.photo ? 'photo' : null,
    ...Object.entries(a.valeurs).filter(([, v]) => v.origine === 'page' || v.origine === 'exemple').map(([nom]) => nom)
  ].filter((x): x is string => !!x);
  return lu.length ? `lu sur la page : ${lu.join(', ')}` : null;
}

/**
 * R48 (L1, D-40, D-72) : l'idée notée au calendrier devient un carnet d'idées, sans IA, état Idée ; la phrase gardée en `carnet.phrase` et en
 * titre (un lien seul : son domaine en titre, jamais l'URL brute, P3) ; `date` = le lundi de la semaine si elle est donnée (sinon aucun champ `date`). Un seul document : le calendrier garde son Annuler.
 * Phrase vide : `null` (refusée).
 */
export function carnetDepuisPhrase(phrase: string, options: { id?: string; le?: string; date?: string } = {}): CarnetDoc | null {
  const texte = phrase.trim();
  if (!texte) return null;
  const le = options.le ?? maintenant();
  const jour = options.date && /^\d{4}-\d{2}-\d{2}/.test(options.date) ? options.date.slice(0, 10) : undefined;
  const doc: CarnetDoc = {
    id: options.id ?? nouvelIdCarnet('CARNET'), type: 'carnet', title: titreDePhrase(texte), status: 'idea',
    ...(jour ? { date: lundiDe(jour) } : {}),
    carnet: donneesVides(texte, le)
  };
  return doc;
}

/** Nom affiché d'un article : son nom, sinon son domaine, sinon « lien » (jamais un nom inventé). */
export const nomArticle = (a: Pick<Article, 'nom' | 'domaine'>): string => a.nom ?? a.domaine ?? 'lien';
