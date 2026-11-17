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
import type { CreativeItem } from '../../types';
import { lundiDe } from '../calendrier';

export const VERSION_CARNET = 1 as const;

/** D'où vient une valeur : saisie par lui, lue par l'IA, lue sur la page, calcul local, ou exemple simulé. */
export type Origine = 'vous' | 'ia' | 'page' | 'locale' | 'exemple';
export const ORIGINES: readonly Origine[] = ['vous', 'ia', 'page', 'locale', 'exemple'];

/** Sens d'une caractéristique : plus = mieux, moins = mieux, oui-non (oui = mieux), texte (non comparé). */
export type Sens = 'plus' | 'moins' | 'oui-non' | 'texte';
export const SENS: readonly Sens[] = ['plus', 'moins', 'oui-non', 'texte'];

export interface Caracteristique { nom: string; unite?: string; sens: Sens }

/** « Ce qui compte » : un critère, avec la caractéristique qui le mesure si elle est connue. */
export interface Critere { id: string; texte: string; raison?: string; caracteristique?: Caracteristique; origine: Origine; messageId?: string }

export type EtatFacon = 'ouverte' | 'retenue' | 'ecartee';
/** Une façon de faire (D-16) : ouverte, retenue ou écartée, avec sa raison. */
export interface Facon { id: string; nom: string; etat: EtatFacon; raison?: string; origine: Origine; messageId?: string }

/** Une valeur lue pour une caractéristique (clé = son nom). `luLe` : date de lecture, si elle a été lue. */
export interface Valeur { valeur: number | string | boolean; unite?: string; origine: Origine; luLe?: string }

export type LectureArticle = 'a-lire' | 'en-cours' | 'lue' | 'illisible';
/**
 * Veille du prix (R31, D-28). Un article naît sans veille ; seul son toucher l'allume. `releveLe` n'est écrit par aucun code de ce port : la
 * relève réelle attend son accord. Tant qu'il manque, la fiche dit « demandée · pas encore relevée ».
 */
export interface Veille { active: boolean; depuis: string; releveLe?: string }

/** Un article (un produit d'un vendeur). Tout est facultatif sauf `id`, `valeurs` et `lecture` : l'inconnu est absent. */
export interface Article {
  id: string;
  url?: string;
  domaine?: string;
  nom?: string;
  prixCentimes?: number;
  devise?: string;
  vendeur?: string;
  pays?: string;
  dispo?: string;
  photo?: string;
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
export interface Photo { id: string; jpeg: string; messageId?: string }

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
}

export type CibleEffet = 'carnet' | 'critere' | 'facon' | 'article' | 'note' | 'photo';
export const CIBLES_EFFET: readonly CibleEffet[] = ['carnet', 'critere', 'facon', 'article', 'note', 'photo'];

/** Ce qu'un message a rangé. `carnetSupprime` : le carnet a été supprimé depuis ; le message reste (L33). */
export interface EffetMessage { carnetId: string; cible: CibleEffet; id: string; carnetSupprime?: true }

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

function lireCaracteristique(v: unknown): Caracteristique | undefined {
  if (!estObjet(v) || !texteNonVide(v.nom) || !SENS.includes(v.sens as Sens)) return undefined;
  return sansIndefinis({ nom: v.nom, unite: optTexte(v.unite), sens: v.sens as Sens });
}

function lireCritere(v: unknown): Critere | null {
  if (!estObjet(v) || !texteNonVide(v.id) || !texteNonVide(v.texte)) return null;
  return sansIndefinis({ id: v.id, texte: v.texte, raison: optTexte(v.raison), caracteristique: lireCaracteristique(v.caracteristique), origine: origineLue(v.origine), messageId: optTexte(v.messageId) });
}

function lireFacon(v: unknown): Facon | null {
  if (!estObjet(v) || !texteNonVide(v.id) || !texteNonVide(v.nom)) return null;
  const etat: EtatFacon = v.etat === 'retenue' || v.etat === 'ecartee' ? v.etat : 'ouverte';
  return sansIndefinis({ id: v.id, nom: v.nom, etat, raison: optTexte(v.raison), origine: origineLue(v.origine), messageId: optTexte(v.messageId) });
}

function lireValeurs(v: unknown): Record<string, Valeur> {
  const sortie: Record<string, Valeur> = {};
  if (!estObjet(v)) return sortie;
  for (const [nom, brut] of Object.entries(v)) {
    if (!estObjet(brut)) continue;
    const valeur = brut.valeur;
    /* une valeur inconnue est absente : null, NaN, chaîne vide ne deviennent jamais 0 */
    if (!(nombreFini(valeur) || typeof valeur === 'boolean' || texteNonVide(valeur))) continue;
    sortie[nom] = sansIndefinis({ valeur, unite: optTexte(brut.unite), origine: origineLue(brut.origine), luLe: optTexte(brut.luLe) });
  }
  return sortie;
}

function lireVeille(v: unknown): Veille | undefined {
  if (!estObjet(v) || typeof v.active !== 'boolean' || !texteNonVide(v.depuis)) return undefined;
  return sansIndefinis({ active: v.active, depuis: v.depuis, releveLe: optTexte(v.releveLe) });
}

const LECTURES: readonly LectureArticle[] = ['a-lire', 'en-cours', 'lue', 'illisible'];

function lireArticle(v: unknown): Article | null {
  if (!estObjet(v) || !texteNonVide(v.id)) return null;
  return sansIndefinis({
    id: v.id, url: optTexte(v.url), domaine: optTexte(v.domaine), nom: optTexte(v.nom),
    prixCentimes: nombreFini(v.prixCentimes) && v.prixCentimes >= 0 ? Math.round(v.prixCentimes) : undefined,
    devise: optTexte(v.devise), vendeur: optTexte(v.vendeur), pays: optTexte(v.pays), dispo: optTexte(v.dispo), photo: optTexte(v.photo),
    faconId: optTexte(v.faconId), valeurs: lireValeurs(v.valeurs), lecture: LECTURES.includes(v.lecture as LectureArticle) ? (v.lecture as LectureArticle) : 'a-lire',
    veille: lireVeille(v.veille), messageId: optTexte(v.messageId), origine: ORIGINES.includes(v.origine as Origine) ? (v.origine as Origine) : undefined
  });
}

function lireNote(v: unknown): Note | null {
  if (!estObjet(v) || !texteNonVide(v.id) || !texteNonVide(v.texte)) return null;
  const groupe = estObjet(v.groupe) && texteNonVide(v.groupe.id) && typeof v.groupe.libelle === 'string' ? { id: v.groupe.id, libelle: v.groupe.libelle } : undefined;
  const fusionDe = Array.isArray(v.fusionDe) ? v.fusionDe.filter(texteNonVide) : undefined;
  return sansIndefinis({
    id: v.id, texte: v.texte, genre: GENRES_NOTE.includes(v.genre as GenreNote) ? (v.genre as GenreNote) : 'note', modifieeLe: optTexte(v.modifieeLe),
    messageId: optTexte(v.messageId), groupe, fusionDe: fusionDe && fusionDe.length ? fusionDe : undefined
  });
}

function lirePhoto(v: unknown): Photo | null {
  if (!estObjet(v) || !texteNonVide(v.id) || !texteNonVide(v.jpeg)) return null;
  return sansIndefinis({ id: v.id, jpeg: v.jpeg, messageId: optTexte(v.messageId) });
}

function lireChoix(v: unknown, profondeur = 0): Choix | undefined {
  if (!estObjet(v) || !texteNonVide(v.articleId) || typeof v.pourquoi !== 'string' || !texteNonVide(v.le) || profondeur > 20) return undefined;
  const ecartes = Array.isArray(v.ecartes) ? v.ecartes.filter((e): e is { articleId: string; raison: string } => estObjet(e) && texteNonVide(e.articleId) && typeof e.raison === 'string').map(e => ({ articleId: e.articleId, raison: e.raison })) : [];
  const remplaces = Array.isArray(v.remplaces) ? v.remplaces.map(r => lireChoix(r, profondeur + 1)).filter((r): r is Choix => !!r) : [];
  return sansIndefinis({ articleId: v.articleId, faconId: optTexte(v.faconId), pourquoi: v.pourquoi, ecartes, aRevoirSi: optTexte(v.aRevoirSi), le: v.le, remplaces });
}

const liste = <T>(v: unknown, lire: (x: unknown) => T | null): T[] | null => {
  if (v === undefined) return [];
  if (!Array.isArray(v)) return null;
  return v.map(lire).filter((x): x is T => x !== null);
};

/** Le contenu d'une idée, normalisé ; `null` si la forme est inconnue. */
export function lireDonneesCarnet(v: unknown): DonneesCarnet | null {
  if (!estObjet(v) || v.version !== VERSION_CARNET || typeof v.creeLe !== 'string' || typeof v.phrase !== 'string') return null;
  const criteres = liste(v.criteres, lireCritere), facons = liste(v.facons, lireFacon), articles = liste(v.articles, lireArticle);
  const notes = liste(v.notes, lireNote), photos = liste(v.photos, lirePhoto);
  if (!criteres || !facons || !articles || !notes || !photos) return null;
  const sortie = estObjet(v.sortie) && texteNonVide(v.sortie.planId) && typeof v.sortie.le === 'string' ? { planId: v.sortie.planId, le: v.sortie.le } : undefined;
  const archive = estObjet(v.archive) && typeof v.archive.le === 'string' && typeof v.archive.raison === 'string' ? { le: v.archive.le, raison: v.archive.raison } : undefined;
  return sansIndefinis({ version: VERSION_CARNET, creeLe: v.creeLe, phrase: v.phrase, criteres, facons, articles, notes, photos, choix: lireChoix(v.choix), sortie, archive });
}

const STATUTS: readonly StatutCarnet[] = ['idea', 'research', 'validated'];

/** Une idée du carnet, normalisée ; `null` si ce n'en est pas une ou si sa forme est inconnue. */
export function lireCarnet(item: CreativeItem | null | undefined): CarnetDoc | null {
  if (!item || item.type !== 'carnet' || !texteNonVide(item.id)) return null;
  const carnet = lireDonneesCarnet(item.carnet);
  if (!carnet) return null;
  const status: StatutCarnet = STATUTS.includes(item.status as StatutCarnet) ? (item.status as StatutCarnet) : statutDe(carnet);
  return { ...item, type: 'carnet', status, carnet };
}

const RANGEMENTS: readonly Rangement[] = ['ia', 'locale', 'simulee', 'brut'];

/** Un message du fil, normalisé ; `null` si ce n'en est pas un. Un `titrePropose` mal formé est ignoré (R46). */
export function lireMessage(item: CreativeItem | null | undefined): MessageDoc | null {
  if (!item || item.type !== 'carnet-message' || !texteNonVide(item.id)) return null;
  const m = item.carnetMessage as unknown;
  if (!estObjet(m) || typeof m.texte !== 'string' || typeof m.le !== 'string' || !texteNonVide(m.depuis)) return null;
  const effets = Array.isArray(m.effets)
    ? m.effets.filter((e): e is EffetMessage => estObjet(e) && texteNonVide(e.carnetId) && CIBLES_EFFET.includes(e.cible as CibleEffet) && texteNonVide(e.id))
      .map(e => sansIndefinis({ carnetId: e.carnetId, cible: e.cible, id: e.id, carnetSupprime: e.carnetSupprime === true ? (true as const) : undefined }))
    : [];
  const t = m.titrePropose;
  const titrePropose = estObjet(t) && texteNonVide(t.carnetId) && texteNonVide(t.titre)
    ? sansIndefinis({ carnetId: t.carnetId, titre: t.titre, applique: t.applique === true ? true : undefined }) : undefined;
  const carnetMessage: DonneesMessage = sansIndefinis({
    texte: m.texte, le: m.le, depuis: m.depuis, rangement: RANGEMENTS.includes(m.rangement as Rangement) ? (m.rangement as Rangement) : 'brut', effets, titrePropose,
    gardeAPart: m.gardeAPart === true ? (true as const) : undefined
  });
  return { ...item, type: 'carnet-message', carnetMessage };
}

/** Un document du carnet d'idées (idée ou message) : jamais lu par l'Atelier, le calendrier en rangée, À venir ni le compte des tâches. */
export const estDocCarnet = (item: Pick<CreativeItem, 'type'> | null | undefined): boolean => !!item && (item.type === 'carnet' || item.type === 'carnet-message');

/** Statut d'après le contenu : un choix → Choisi ; au moins un article → À comparer ; sinon Idée. */
export function statutDe(carnet: Pick<DonneesCarnet, 'articles' | 'choix'>): StatutCarnet {
  if (carnet.choix) return 'validated';
  return carnet.articles.length > 0 ? 'research' : 'idea';
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

/**
 * Le titre tiré d'une phrase : sa première ligne non vide, rognée à 120 caractères. Une ligne qui n'est qu'un lien ne devient jamais
 * le titre : son domaine la remplace (P3, g5:v03-10), jusqu'à ce que la page lue donne un nom.
 */
export function titreDePhrase(phrase: string): string {
  const ligne = phrase.split(/\r?\n/).map(l => l.trim()).find(l => l !== '') ?? '';
  const domaine = domaineDuLienSeul(ligne);
  if (domaine) return domaine;
  return ligne.length > 120 ? `${ligne.slice(0, 119).trimEnd()}…` : ligne;
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
