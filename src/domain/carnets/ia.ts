/**
 * Carnet d'idées (lot B) : le garde côté client de la tâche `rangerCarnet`, même rôle que `lireReponse` de `rangerNote.ts`.
 * La réponse du modèle (réelle ou simulée) devient des lignes validées, ou `null` : alors le repli local (`analyseLocale.ts`, lot A)
 * reste seul. Règles (MISSION.md, § IA, B2 et B7) :
 *  - forme : un objet `{ lignes }`, 1 à 12 lignes ; au-delà, ou hors schéma, ou vide : `null` ;
 *  - une ligne d'une sorte inconnue, ou sans texte, est refusée (les autres restent) ;
 *  - `carnetId` inconnu → `carnetNeuf` ; aucun lien, prix, quantité ni vendeur absents du message ou de la page lue ;
 *  - aides : `doublonDe` et `regrouperAvec` ne citent que des notes connues, `commeCritere` seulement sur une note, `consequence` ne
 *    cite aucun nombre absent du carnet ni du message, `titrePropose` seulement sur une idée connue, différent et de 60 caractères au plus ;
 *  - un champ inconnu est absent, jamais 0 ; textes rognés à 300 caractères ; les achats en tête (D-128).
 * Aucun gabarit par objet : ce fichier ne connaît aucune catégorie (C2, R30).
 */
import { estDomaine, type DomaineCarnet } from './domaines';
import {
  CARNETS_MAX, CHEMIN_NIVEAUX_MAX, DERNIERS_MAX, ETATS_SUIVI_IA, ETIQUETTES_CARNET, GENRES_CARNET, GENRES_SUIVI, LIGNES_MAX, PAGES_MAX, QUAND_TACHE, SENS_CARNET, SORTES_CARNET, cheminLu,
  type ContexteRangerCarnet, type EtatSuiviIA, type EtiquetteCarnet, type GenreCarnet, type GenreSuivi, type PageLue, type SensCarnet, type SorteCarnet
} from '../../../functions/src/carnetIA';
import { estimeAutour, jetons, prixTousDe } from './analyseLocale';
import { estUnMemo } from './memo';
import type { CarnetDoc, Etiquette, MessageDoc, PropositionSuivi, Rattache } from './modele';
import { rapprocherChemin } from './arbre';
import { echeanceDe } from './taches';
import { etatDe, etatOption, genreDe } from './suivi';

export type { PageLue } from '../../../functions/src/carnetIA';
export type SorteLigne = SorteCarnet;
export type GenreLigne = GenreCarnet;
export type SensCaracteristique = SensCarnet;
export interface Caracteristique { nom: string; unite?: string; sens: SensCaracteristique }

/** Une ligne rangée, validée. `origine` : `ia` (Gemini) ou `exemple` (réponse simulée du banc et des tests). */
export interface LigneCarnet {
  sorte: SorteLigne;
  genre?: GenreLigne;
  texte: string;
  titre?: string;
  /** Un carnet connu. Sinon `carnetNeuf` (titre de l'idée à créer) ; ni l'un ni l'autre : l'appelant décide (carnet neuf). */
  carnetId?: string;
  carnetNeuf?: string;
  /** D437 : le domaine du carnet neuf (local, brasserie, meuble, outils, papiers) ; hors liste, retiré. */
  domaine?: DomaineCarnet;
  raisonCarnet?: string;
  url?: string;
  prixCentimes?: number;
  devise?: string;
  /** D'où vient le prix : écrit dans le message, ou lu sur la page du lien. */
  prixSource?: 'texte' | 'page';
  /** « dès » : le prix est le plus bas d'une page à plusieurs prix. */
  prixDes?: true;
  quantite?: number;
  unite?: string;
  vendeur?: string;
  caracteristique?: Caracteristique;
  consequence?: string;
  doublonDe?: string;
  commeCritere?: true;
  regrouperAvec?: string[];
  titrePropose?: string;
  /**
   * P10, P23 (D-35, D-24) : un critère que l'IA propose sans l'écrire (la caractéristique commune lue sur les deux premiers articles d'un
   * carnet qui n'a pas de critère). `ranger` le garde sur le message ; l'accepter = le ranger sans `propose` (`accepterProposition`).
   */
  propose?: true;
  /** La page lue du lien de la ligne, telle que `lireLien` l'a rendue. */
  page?: PageLue;
  /**
   * `ia` (Gemini) ou `exemple` (simulation, B7 : toute ligne simulée reste marquée « exemple »). `locale` (L-1) : le repli quand le
   * rangement de l'IA échoue après la lecture des pages : l'analyse locale, avec ce que les pages ont rendu.
   */
  origine: 'ia' | 'exemple' | 'locale';
  /**
   * L-2 (23.11) : depuis la liste, le carnet existant où l'IA rangerait la ligne. Il n'est jamais écrit sans confirmation : la ligne va là
   * où l'aperçu l'a annoncée ; ce carnet n'est qu'une suggestion (« Y ajouter ? »).
   */
  carnetSuggere?: string;
  /**
   * Critique 5, n° 1 : d'où vient un critère, décidé par le garde (`critereTireDe`), réponse réelle ou simulée : `phrase` s'il est tiré de
   * ses mots (« tiré de votre phrase »), sinon `ia` (« proposé par l'IA »). Absent sur les autres sortes.
   */
  source?: 'phrase' | 'ia';
  /**
   * D451 (le suivi) : ce que la ligne dit du fil, déjà gardé. `etiquette` : le jeton sous la bulle (son montant est `prixCentimes`, écrit dans le
   * message, `estime` si « ≈ ») ; `option` : le nom de la solution visée ; `genreCarnet`, `chemin`, `etatPropose` : d'une idée neuve (le
   * consommateur ne les applique qu'à un carnet que ce message crée) ; `tachePropose` : une tâche ou la date d'une option (sans `texte`), jamais écrite
   * seule ; `citation` : une sous-chaîne exacte du message.
   */
  etiquette?: EtiquetteCarnet;
  estime?: true;
  option?: string;
  genreCarnet?: GenreSuivi;
  chemin?: string[];
  etatPropose?: EtatSuiviIA;
  tachePropose?: TachePropose;
  citation?: string;
}

/** Une tâche proposée : `echeance` est un lundi (précision `semaine` ou `mois`), absente pour « un jour » ; le coût seulement s'il est écrit. */
export interface TachePropose { texte?: string; echeance?: string; precision?: 'semaine' | 'mois'; coutCentimes?: number; devise?: string; coutEstime?: true }

/** La forme minimale d'une idée pour l'IA ; `CarnetsVue.tsx` (lot D) la tire du modèle du lot A. */
export interface CarnetPourIA {
  id: string;
  titre: string;
  /** Dernière activité (ms) : au plus 30 carnets, les plus récents d'abord. */
  majLe?: number;
  /** D451, facultatifs : le suivi du carnet (voir `pourIASuivi`). */
  genre?: GenreSuivi;
  etat?: EtatSuiviIA;
  domaine?: DomaineCarnet;
  chemin?: readonly string[];
  /** Les options qui ne sont pas de simples pistes (veille, écartée, retenue) ; une option absente est une piste. */
  options?: ReadonlyArray<{ nom: string; etat: 'piste' | 'veille' | 'ecartee' | 'retenue' }>;
  taches?: readonly string[];
  derniers?: readonly string[];
  /** `origine` et `source` (L-6) : un critère de sa phrase compte comme ses mots quand l'IA le reprend. */
  criteres?: ReadonlyArray<{ texte: string; caracteristique?: Caracteristique; origine?: string; source?: string }>;
  facons?: ReadonlyArray<{ nom: string; etat?: string }>;
  articles?: ReadonlyArray<{ nom?: string; valeurs?: Readonly<Record<string, { valeur: unknown; unite?: string }>> }>;
  notes?: ReadonlyArray<{ id: string; texte: string }>;
}

const TEXTE_LIGNE = 300;
const TITRE_MAX = 60;
const SORTES = new Set<string>(SORTES_CARNET);
const GENRES = new Set<string>(GENRES_CARNET);
const SENS = new Set<string>(SENS_CARNET);

export const sansAccents = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const espaces = (s: string) => s.replace(/\s+/g, ' ').trim();
const chaine = (v: unknown, max = TEXTE_LIGNE): string | undefined => typeof v === 'string' && espaces(v) ? espaces(v).slice(0, max) : undefined;

/**
 * Les nombres écrits dans un texte, au format suisse compris : « 1'450.– » → 1450, « 1 450 CHF » → 1450, « 12,50 » → 12.5,
 * « 38 cm » → 38. Sert à vérifier qu'un nombre rendu par l'IA est bien écrit quelque part.
 */
export function nombresDe(texte: string): number[] {
  const lire = (t: string) => [...t.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace(',', '.'))).filter(Number.isFinite);
  // Milliers séparés par ' ou espace : lus joints (1450) et séparés (« 2 300 L » peut aussi dire 2 et 300) ; on vérifie, on n'additionne pas.
  const joints = texte.replace(/(\d)['’   ](?=\d{3}(?!\d))/g, (_m, d: string) => d);
  return [...new Set([...lire(joints), ...lire(texte)])];
}
const contient = (nombres: readonly number[], n: number) => nombres.some((x) => Math.abs(x - n) < 0.005);

/** Les liens écrits dans un message (motif, puis `new URL`), ponctuation finale retirée ; `www.` et domaine nu reçoivent https. */
export function liensDuTexte(texte: string): string[] {
  const vus = new Set<string>();
  for (const m of texte.matchAll(/\b(?:https?:\/\/|www\.)[^\s<>"'«»]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:ch|com|de|fr|it|at|eu|net|org|shop|store)\/[^\s<>"'«»]*/gi)) {
    let brut = m[0].replace(/[.,;:!?)\]]+$/, '');
    if (!/^https?:\/\//i.test(brut)) brut = 'https://' + brut;
    try { vus.add(new URL(brut).href); } catch { /* pas un lien */ }
  }
  return [...vus];
}

/** Une URL rendue par l'IA n'est gardée que si elle est écrite dans le message (schéma, `www.` et `/` final ignorés). */
const formeUrl = (u: string) => u.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[/#?]+$/, '');
const urlDansTexte = (url: string, texte: string) => {
  const f = formeUrl(url);
  return f.length > 3 && liensDuTexte(texte).some((l) => formeUrl(l) === f);
};

/** Le contexte compact envoyé à `rangerCarnet` : 30 carnets au plus, les plus récents ; le message tel quel. */
export function contexteModele(texte: string, saisie: Date, depuis: string | null, carnets: readonly CarnetPourIA[], pages: readonly PageLue[] = []): ContexteRangerCarnet {
  const jour = `${saisie.getFullYear()}-${String(saisie.getMonth() + 1).padStart(2, '0')}-${String(saisie.getDate()).padStart(2, '0')}`;
  const tries = [...carnets].sort((a, b) => (b.majLe ?? 0) - (a.majLe ?? 0) || Number(b.id === depuis) - Number(a.id === depuis));
  // Le carnet ouvert entre toujours, même s'il n'est pas parmi les 30 plus récents.
  const garde = tries.slice(0, CARNETS_MAX);
  const ouvert = depuis ? carnets.find((c) => c.id === depuis) : undefined;
  if (ouvert && !garde.includes(ouvert)) garde[garde.length - 1] = ouvert;
  const ctx: ContexteRangerCarnet = {
    texte, saisie: jour, depuis,
    carnets: garde.map((c) => ({
      id: c.id, titre: c.titre,
      criteres: (c.criteres ?? []).map((k) => (k.caracteristique ? { texte: k.texte, caracteristique: k.caracteristique } : { texte: k.texte })),
      facons: (c.facons ?? []).map((f) => f.nom),
      articles: (c.articles ?? []).flatMap((a) => {
        if (!a.nom) return [];
        const v = Object.entries(a.valeurs ?? {}).flatMap(([k, x]) => x && x.valeur !== undefined && x.valeur !== null ? [[k, `${String(x.valeur)}${x.unite ? ' ' + x.unite : ''}`]] : []);
        return [v.length ? { nom: a.nom, valeurs: Object.fromEntries(v) } : { nom: a.nom }];
      }),
      notes: (c.notes ?? []).map((n) => ({ id: n.id, texte: n.texte })),
      /* D451 : le suivi, borné (12 options, 8 tâches, 3 messages de 160 caractères) ; aucune photo n'est jamais envoyée (accord du 17.11) */
      ...(c.genre ? { genre: c.genre } : {}),
      ...(c.etat ? { etat: c.etat } : {}),
      ...(c.domaine ? { domaine: c.domaine } : {}),
      ...(c.chemin?.length ? { chemin: [...c.chemin] } : {}),
      ...(c.options?.length ? { options: c.options.slice(0, 12).map((o) => ({ nom: o.nom, etat: o.etat })) } : {}),
      ...(c.taches?.length ? { taches: c.taches.slice(0, 8).map((t) => t.slice(0, 160)) } : {}),
      ...(c.derniers?.length ? { derniers: c.derniers.slice(0, DERNIERS_MAX).map((t) => t.slice(0, 160)) } : {})
    }))
  };
  const chemins = [...new Map(garde.flatMap((c) => (c.chemin?.length ? [[c.chemin.join('\u0000'), [...c.chemin]] as const] : []))).values()];
  if (chemins.length) ctx.chemins = chemins.slice(0, 40).map((c) => [...c]);
  const lues = pages.filter((p) => p.statut === 'lue').slice(0, PAGES_MAX)
    .map(({ url, domaine, nom, prix, devise, vendeur, valeurs }) => Object.fromEntries(Object.entries({ url, domaine, nom, prix, devise, vendeur, valeurs }).filter(([, v]) => v !== undefined)) as NonNullable<ContexteRangerCarnet['pages']>[number]);
  if (lues.length) ctx.pages = lues;
  return ctx;
}

/** Tous les nombres écrits dans un carnet : titre, critères, façons, articles (valeurs comprises), notes. */
function nombresDuCarnet(c: CarnetPourIA | undefined): number[] {
  if (!c) return [];
  const morceaux = [c.titre, ...(c.criteres ?? []).map((k) => k.texte), ...(c.facons ?? []).map((f) => f.nom), ...(c.notes ?? []).map((n) => n.texte)];
  for (const a of c.articles ?? []) {
    if (a.nom) morceaux.push(a.nom);
    for (const v of Object.values(a.valeurs ?? {})) if (typeof v?.valeur === 'number' || typeof v?.valeur === 'string') morceaux.push(String(v.valeur));
  }
  return nombresDe(morceaux.join(' \n '));
}

/**
 * Critique 5, n° 1 : un critère est-il tiré des mots du message ? Chacun de ses nombres y est écrit, et la moitié au moins de ses mots
 * significatifs. Le nom de sa caractéristique, que l'IA peut nommer (« débit » pour « 150 kg/h »), ne compte que s'il est écrit. Un
 * critère qui n'a ni mot écrit ni nombre (« le débit ») n'est pas tiré du message : il est proposé par l'IA.
 * L-6 (23.11, M1-13) : « Vanne papillon en bas » (nom « vanne papillon ») et « Budget max 400 CHF » étaient dits « proposé par l'IA » :
 * le nom écrit dans sa phrase est compté, un mot de forme (« max ») ne fait plus tomber sous le seuil, et `autres` (les critères de sa
 * phrase déjà dans le carnet) comptent comme ses mots.
 */
export function critereTireDe(texte: string, caracteristique: { nom: string } | undefined, message: string, autres: readonly string[] = []): boolean {
  const corpus = [message, ...autres].join(' \n ');
  const ecrits = new Set(jetons(corpus));
  const nom = new Set(jetons(caracteristique?.nom ?? ''));
  const mots = [...new Set(jetons(texte))].filter(m => !nom.has(m) || ecrits.has(m));
  const nombres = nombresDe(texte);
  if (!mots.length && !nombres.length) return false;
  const dits = nombresDe(corpus);
  if (!nombres.every(n => contient(dits, n))) return false;
  if (!mots.length) return true;
  return mots.filter(m => ecrits.has(m)).length / mots.length >= 0.5;
}

const SANS_PREFIXE = (s: string) => s.replace(/^\s*ZZ TEST\s*[—–-]\s*/i, '');
/** Un lien écrit tel quel dans un texte (même motif que `liensDuTexte`). */
const MOTIF_LIEN = /\b(?:https?:\/\/|www\.)[^\s<>"'«»]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:ch|com|de|fr|it|at|eu|net|org|shop|store)\/[^\s<>"'«»]*/gi;

/**
 * L-5 (23.11, M3-7) : une ligne de son message que les lignes rendues reprennent : la moitié au moins de ses mots, chacun de ses nombres
 * et ses liens. Une reformulation (« voir » → « Vérifier ») n'est pas une perte. Même mesure que `morceauxPerdus` (CarnetsVue).
 */
function ligneReprise(brute: string, lignes: readonly LigneCarnet[]): boolean {
  const dits = lignes.map(l => [l.texte, l.titre, l.carnetNeuf, l.caracteristique?.nom, l.caracteristique?.unite, l.unite].filter(Boolean).join(' ')).join(' \n ');
  const mots = new Set(jetons(dits));
  const nombres = [...nombresDe(dits), ...lignes.flatMap(l => [l.quantite, l.prixCentimes !== undefined ? l.prixCentimes / 100 : undefined]).filter((n): n is number => n !== undefined)];
  const urls = new Set(lignes.flatMap(l => (l.url ? [formeUrl(l.url)] : [])));
  if (liensDuTexte(brute).some(u => !urls.has(formeUrl(u)))) return false;
  const sansLien = brute.replace(MOTIF_LIEN, ' ');
  const ms = jetons(sansLien);
  if (nombresDe(sansLien).some(n => !contient(nombres, n))) return false;
  return ms.filter(m => !mots.has(m)).length <= ms.length / 2;
}

const memeTitre = (a: string, b: string) => sansAccents(espaces(a)) === sansAccents(espaces(b));
const ACHAT = (l: LigneCarnet) => l.sorte === 'article' || l.genre === 'a-acheter';

export interface ContexteGarde {
  texte: string;
  carnets: readonly CarnetPourIA[];
  depuis?: string | null;
  pages?: readonly PageLue[];
  origine?: LigneCarnet['origine'];
  /** Le jour de la saisie : une tâche « cette semaine » ou « ce mois » en prend son lundi. Absent : maintenant. */
  maintenant?: Date;
}

/* ---------- D451 : le suivi d'une ligne (étiquette, option, genre, chemin, état, tâche, citation) ---------- */

const ETIQUETTES = new Set<string>(ETIQUETTES_CARNET);
const GENRES_NEUF = new Set<string>(GENRES_SUIVI);
const ETATS_IA = new Set<string>(ETATS_SUIVI_IA);
const QUAND = new Set<string>(QUAND_TACHE);
const majuscule = (t: string) => `${t.charAt(0).toLocaleUpperCase('fr-CH')}${t.slice(1)}`;
export const jourDe = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * D451 : ce que la réponse dit du suivi, gardé ligne par ligne. Une énumération hors liste est ignorée ; un montant (étiquette ou tâche) n'existe
 * que s'il est écrit dans le message (l'étiquette reprend le prix déjà gardé de la ligne) ; une citation est une sous-chaîne EXACTE du message ;
 * un chemin a 1 à 2 niveaux de 30 caractères au plus et se rapproche du vocabulaire des carnets (le plus proche, sinon tel quel).
 */
function suiviDeLigne(r: Record<string, unknown>, ligne: LigneCarnet, ctx: ContexteGarde, nombresTexte: readonly number[]): void {
  if (typeof r.etiquette === 'string' && ETIQUETTES.has(r.etiquette)) {
    ligne.etiquette = r.etiquette as EtiquetteCarnet;
    if (ligne.prixCentimes !== undefined && ligne.prixSource === 'texte' && estimeAutour(ctx.texte, ligne.prixCentimes / 100)) ligne.estime = true;
  }
  const option = chaine(r.option, 80);
  if (option) ligne.option = option;
  if (typeof r.genreCarnet === 'string' && GENRES_NEUF.has(r.genreCarnet)) ligne.genreCarnet = r.genreCarnet as GenreSuivi;
  if (typeof r.etatPropose === 'string' && ETATS_IA.has(r.etatPropose)) ligne.etatPropose = r.etatPropose as EtatSuiviIA;
  const brut = cheminLu(r.chemin);
  if (brut) {
    const vocabulaire = ctx.carnets.flatMap((c) => (c.chemin?.length ? [c.chemin] : []));
    ligne.chemin = rapprocherChemin(brut.slice(0, CHEMIN_NIVEAUX_MAX).map(majuscule), vocabulaire).map((s) => s.slice(0, 30));
  }
  const citation = typeof r.citation === 'string' ? r.citation.trim() : '';
  if (citation.length >= 3 && ctx.texte.includes(citation)) ligne.citation = citation;
  const t = r.tachePropose as Record<string, unknown> | null | undefined;
  if (t && typeof t === 'object' && typeof t.quand === 'string' && QUAND.has(t.quand)) {
    const texte = chaine(t.texte, 120);
    // Sans texte, c'est la date d'une option : il faut l'option et une date.
    if (texte || (option && t.quand !== 'un-jour')) {
      const precision = t.quand === 'mois' ? 'mois' : t.quand === 'semaine' ? 'semaine' : undefined;
      const echeance = precision ? echeanceDe(jourDe(ctx.maintenant ?? new Date()), precision) ?? undefined : undefined;
      const tache: TachePropose = { ...(texte ? { texte } : {}), ...(echeance && precision ? { echeance, precision } : {}) };
      if (typeof t.prix === 'number' && Number.isFinite(t.prix) && t.prix > 0 && contient(nombresTexte, t.prix)) {
        const centimes = Math.round(t.prix * 100);
        tache.coutCentimes = centimes;
        const lu = prixTousDe(ctx.texte).find((x) => x.centimes === centimes);
        if (lu) tache.devise = lu.devise;
        if (estimeAutour(ctx.texte, t.prix)) tache.coutEstime = true;
      }
      ligne.tachePropose = tache;
    }
  }
}

/**
 * Relit la réponse. `null` : réponse hors schéma, vide, trop longue ou sans ligne valable ; l'appelant garde le rangement local.
 * Une ligne fautive perd son champ fautif (lien, prix, aide…), jamais la phrase du brasseur.
 */
/**
 * Paquet 1, PCN-176 et 181 (tests en ligne 2 et 3) : le champ vendeur du modèle a porté son raisonnement (« galaxus.ch (Darlac Ciseaux /
 * Galaxus marketplace ou Galaxus, gardons le domaine… »), des balises cassées, l'URL entière, ou le nom répété cinq fois. Un vendeur est un
 * nom court : un mot répété se réduit à un ; une adresse, une parenthèse, une balise ou une phrase n'en sont pas (le domaine de la page
 * reste, lui, sur l'article).
 */
export function vendeurPropre(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const mots = v.split(/\s+/).filter(Boolean);
  if (mots.length > 1 && mots.every((m) => sansAccents(m) === sansAccents(mots[0]))) return mots[0];
  if (/[/\\<>[\](){}|;=?!"«»…]|https?:|www\./i.test(v) || mots.length > 5 || v.length > 40) return undefined;
  return v;
}

export function lireReponse(brut: unknown, ctx: ContexteGarde): LigneCarnet[] | null {
  if (!brut || typeof brut !== 'object') return null;
  const lignes = (brut as { lignes?: unknown }).lignes;
  if (!Array.isArray(lignes) || lignes.length === 0 || lignes.length > LIGNES_MAX) return null;
  const parId = new Map(ctx.carnets.map((c) => [c.id, c]));
  const notesConnues = new Set(ctx.carnets.flatMap((c) => (c.notes ?? []).map((n) => n.id)));
  const pagesLues = (ctx.pages ?? []).filter((p) => p.statut === 'lue');
  const nombresTexte = nombresDe(ctx.texte);
  const texteNormal = sansAccents(ctx.texte);
  const origine = ctx.origine ?? 'ia';
  const sortie: LigneCarnet[] = [];
  /*
   * Test en ligne 4 (PCN-183, 187, 190) : écrite depuis un carnet ouvert, une idée est un AUTRE carnet quand son titre ne partage aucun mot
   * avec celui de l'ouvert. L'IA l'a rendue sans carnet (« idée, Moulin à malt », envoi 6 depuis le Fermenteur), ou avec l'id de l'ouvert ;
   * le repli « dans depuis » en faisait le carnet ouvert lui-même, puis l'écran la jetait et gardait la phrase brute en note. Elle devient
   * le carnet neuf qu'elle nomme ; les lignes sans carnet du même message qui parlent d'elle la suivent (« 20 fûts » ne devient pas un
   * critère de la Pompe). Un titre proposé (`titrePropose`) reste un renommage de l'ouvert.
   */
  const ouvert = ctx.depuis ? parId.get(ctx.depuis) : undefined;
  const phraseDeListe = !ctx.depuis && !liensDuTexte(ctx.texte).length && ctx.texte.split(/\r?\n/).filter((s) => s.trim()).length <= 1;
  const motsOuvert = new Set(jetons(ouvert?.titre ?? ''));
  const ideesAilleurs = new Map<object, { titre: string; mots: Set<string>; nombres: number[] }>();
  if (ouvert) for (const l of lignes) {
    if (!l || typeof l !== 'object') continue;
    const r = l as Record<string, unknown>;
    const texte = chaine(r.texte);
    if (r.sorte !== 'idee' || !texte || chaine(r.carnetNeuf, TITRE_MAX) || chaine(r.titrePropose, 200)) continue;
    const id = chaine(r.carnetId, 120);
    if (id && id !== ouvert.id && parId.has(id)) continue;
    const titre = chaine(r.titre, TITRE_MAX) ?? texte.slice(0, TITRE_MAX);
    const mots = jetons(titre);
    if (!mots.length || mots.some((m) => motsOuvert.has(m))) continue;
    ideesAilleurs.set(l, { titre, mots: new Set([...mots, ...jetons(texte)]), nombres: nombresDe(texte) });
  }
  /** La seule idée neuve du message dont une ligne sans carnet parle (un mot ou un nombre en commun) ; sinon aucune. */
  const ideeDe = (texte: string): string | undefined => {
    if (ideesAilleurs.size !== 1) return undefined;
    const [i] = ideesAilleurs.values();
    const parle = jetons(texte).some((m) => i.mots.has(m)) || nombresDe(texte).some((n) => contient(i.nombres, n));
    return parle ? i.titre : undefined;
  };

  for (const l of lignes) {
    if (!l || typeof l !== 'object') continue;
    const r = l as Record<string, unknown>;
    const texte = chaine(r.texte);
    if (!SORTES.has(r.sorte as string) || !texte) continue;
    const sorte = r.sorte as SorteLigne;
    const ligne: LigneCarnet = { sorte, texte, origine };
    if (typeof r.genre === 'string' && GENRES.has(r.genre)) ligne.genre = r.genre as GenreLigne;
    const titre = chaine(r.titre, 120);
    if (titre) ligne.titre = titre;

    // Rangement : un id connu, sinon une idée neuve (jamais un id inventé).
    const idDemande = chaine(r.carnetId, 120);
    const ailleurs = ideesAilleurs.get(l as object);
    const connuDemande = idDemande !== undefined && parId.has(idDemande) && !ailleurs;
    /* L-2 (23.11, M3-1, M4-23) : une phrase seule, sans lien, tapée sur la liste : l'aperçu a annoncé « Nouveau carnet » (ou le carnet proche
       qu'il a fait choisir). L'IA ne la verse jamais dans un autre carnet existant sans confirmation : la ligne suit l'annonce, le carnet de
       l'IA n'est qu'une suggestion. Un lien collé (G21 : « Rangé dans … · Déplacer ») et une note en vrac (découpe annoncée ligne à ligne)
       gardent le carnet de l'IA. */
    /* une proposition de critère (P10, P23) n’écrit rien : elle reste permise */
    /* R67 (C67B-5) : un MÉMO (un fait accompli, « a très bien tenu », « est réglé ») est une note du carnet de son sujet : l'IA le verse dans le carnet existant qu'elle désigne, jamais une idée neuve
       (maquette v01-memo : « une note réussi dans le carnet Sol ») ; l'écriture se défait d'un toucher (« Annuler », « Changer »). Une idée, un besoin, un souci, une question gardent l'annonce. */
    const memoDeListe = phraseDeListe && sorte === 'note' && estUnMemo(ctx.texte);
    const connu = connuDemande && (!phraseDeListe || memoDeListe || (r.propose === true && r.sorte === 'critere'));
    /* BL-1 (banc réel de liens, 23.11) : un lien collé DANS un carnet ouvert y reste, quoi que propose l'IA (4 articles versés dans un vrai
       carnet du brasseur) : son carnet existant n'est qu'une suggestion « Déplacer vers … ? », son carnet neuf rien. Depuis la liste (G21),
       inchangé. */
    const urlLigne = chaine(r.url, 2000);
    const lienIci = !!ouvert && liensDuTexte(ctx.texte).length > 0 && (sorte === 'article' || (!!urlLigne && urlDansTexte(urlLigne, ctx.texte)));
    if (lienIci) {
      ligne.carnetId = ouvert!.id;
      if (connuDemande && idDemande !== ouvert!.id) ligne.carnetSuggere = idDemande;
    } else if (ouvert && connuDemande && idDemande !== ouvert.id) {
      /* R47 (C64-8, 24.11, données réelles touchées) : un message tapé dans un carnet OUVERT reste dans ce carnet. « Achat prévu fin du mois »,
         tapé dans un carnet de test, a été écrit par l'IA dans le carnet réel des achats. Le carnet que l'IA désigne n'est qu'une suggestion
         (« Déplacer vers … ? », au toucher du brasseur), jamais une écriture. */
      ligne.carnetId = ouvert.id;
      ligne.carnetSuggere = idDemande;
    } else if (connu) ligne.carnetId = idDemande;
    else if (ailleurs) ligne.carnetNeuf = ailleurs.titre;
    else if (connuDemande) ligne.carnetSuggere = idDemande;
    else {
      const neuf = chaine(r.carnetNeuf, TITRE_MAX) ?? (idDemande ? (titre ?? texte).slice(0, TITRE_MAX) : undefined) ?? ideeDe(texte);
      if (neuf) ligne.carnetNeuf = neuf;
      else if (ctx.depuis && parId.has(ctx.depuis)) ligne.carnetId = ctx.depuis;
    }
    const raison = chaine(r.raisonCarnet, 120);
    if (raison) ligne.raisonCarnet = raison;
    if (ligne.carnetNeuf && estDomaine(r.domaine)) ligne.domaine = r.domaine;

    // Lien : écrit dans le message, sinon retiré. La page lue de ce lien suit la ligne.
    const url = chaine(r.url, 2000);
    if (url && urlDansTexte(url, ctx.texte)) {
      ligne.url = url;
      const page = (ctx.pages ?? []).find((p) => formeUrl(p.url) === formeUrl(url));
      if (page) ligne.page = page;
    }
    const pagesDeLigne = ligne.page?.statut === 'lue' ? [ligne.page] : pagesLues;

    /* L-7 (23.11, M2-15) : une note dont le texte n'est que l'adresse d'un lien (Wikipédia, sans prix) prend le nom lu sur sa page ; le lien
       reste sur la ligne. Ce n'est pas un conseil caché : une note. Page non lue : l'adresse reste (rien d'autre n'est connu). */
    const seulLien = liensDuTexte(texte);
    if (sorte === 'note' && seulLien.length === 1 && !jetons(texte.replace(MOTIF_LIEN, ' ')).length) {
      const page = ligne.page ?? (ctx.pages ?? []).find((p) => formeUrl(p.url) === formeUrl(seulLien[0]));
      if (!ligne.url && urlDansTexte(seulLien[0], ctx.texte)) ligne.url = seulLien[0];
      if (page) ligne.page = page;
      if (page?.statut === 'lue' && page.nom) ligne.texte = `${page.nom} (${page.domaine})`.slice(0, TEXTE_LIGNE);
      if (ligne.genre === 'conseil') ligne.genre = 'note';
    }

    // Prix et quantité : écrits dans le message ou lus sur la page, sinon absents (jamais 0).
    if (typeof r.prix === 'number' && Number.isFinite(r.prix) && r.prix > 0) {
      const page = pagesDeLigne.find((p) => p.prix !== undefined && Math.abs(p.prix - (r.prix as number)) < 0.005);
      if (contient(nombresTexte, r.prix) || page) {
        ligne.prixCentimes = Math.round(r.prix * 100);
        ligne.prixSource = contient(nombresTexte, r.prix) ? 'texte' : 'page';
        const dev = typeof r.devise === 'string' && /^[A-Z]{3}$/.test(r.devise.trim()) ? r.devise.trim() : page?.devise;
        if (dev) ligne.devise = dev;
      }
    }
    /* CRP-1, maillon 2 : le prix lu sur la page de CETTE ligne (lue, devise présente) arrive à l'article même si le modèle ne le rend pas ;
       jamais 0, jamais la page d'une autre ligne. */
    if (ligne.prixCentimes === undefined && ligne.page?.statut === 'lue') {
      const pg = ligne.page;
      if (typeof pg.prix === 'number' && Number.isFinite(pg.prix) && pg.prix > 0 && pg.devise) {
        ligne.prixCentimes = Math.round(pg.prix * 100); ligne.devise = pg.devise; ligne.prixSource = 'page';
      }
    }
    if (ligne.prixSource === 'page' && ligne.page?.prixDes === true && ligne.page.prix !== undefined && ligne.prixCentimes === Math.round(ligne.page.prix * 100)) ligne.prixDes = true;
    if (typeof r.quantite === 'number' && Number.isFinite(r.quantite) && r.quantite > 0) {
      const surPage = pagesDeLigne.some((p) => contient(nombresDe((p.valeurs ?? []).map((v) => v.valeur).join(' ')), r.quantite as number));
      if (contient(nombresTexte, r.quantite) || surPage) {
        ligne.quantite = r.quantite;
        const unite = chaine(r.unite, 12);
        if (unite) ligne.unite = unite;
      }
    }

    // D-35 : un vendeur n'est gardé que si le message ou la page lue le nomment.
    const vendeur = vendeurPropre(chaine(r.vendeur, 80));
    if (vendeur) {
      const v = sansAccents(vendeur);
      const nomme = texteNormal.includes(v) || pagesDeLigne.some((p) =>
        (p.vendeur !== undefined && sansAccents(p.vendeur) === v) || sansAccents(p.domaine).split('.')[0] === v.replace(/\s+/g, ''));
      if (nomme) ligne.vendeur = vendeur;
    }

    const k = r.caracteristique as Record<string, unknown> | null | undefined;
    const nomK = k && typeof k === 'object' ? chaine(k.nom, 60) : undefined;
    if (k && nomK && SENS.has(k.sens as string)) {
      const unite = chaine(k.unite, 12);
      ligne.caracteristique = { nom: nomK, sens: k.sens as SensCaracteristique, ...(unite ? { unite } : {}) };
    }

    // Aides (R40) : chacune sur sa sorte, avec des ids connus et des nombres écrits.
    const cible = parId.get(ligne.carnetId ?? '');
    const consequence = chaine(r.consequence, 160);
    if (consequence && sorte !== 'idee' && sorte !== 'facon') {
      const permis = [...nombresTexte, ...nombresDuCarnet(cible)];
      if (nombresDe(consequence).every((n) => contient(permis, n))) ligne.consequence = consequence;
    }
    if (sorte === 'note') {
      const doublon = chaine(r.doublonDe, 120);
      if (doublon && notesConnues.has(doublon)) ligne.doublonDe = doublon;
      if (r.commeCritere === true) ligne.commeCritere = true;
      if (Array.isArray(r.regrouperAvec)) {
        const ids = [...new Set(r.regrouperAvec.filter((x): x is string => typeof x === 'string').map((x) => x.trim()))];
        if (ids.length && ids.every((id) => notesConnues.has(id))) ligne.regrouperAvec = ids;
      }
    }
    // P10, P23 : une proposition n'existe que sur un critère d'un carnet connu, avec sa caractéristique (sinon rien à comparer).
    // Une proposition mal formée est retirée : jamais écrite comme si elle était acceptée.
    if (r.propose === true) {
      /* critique 6, n° 9 (D-35) : aussi dans le carnet neuf que le message ouvre (les caractéristiques de sa catégorie, en puces) */
      if (sorte !== 'critere' || !(connu || typeof r.carnetNeuf === 'string') || !ligne.caracteristique) continue;
      ligne.propose = true;
    } else if (sorte === 'critere') {
      /* critique 5, n° 1 : sa source réelle, jamais celle de la réponse entière */
      const deSaPhrase = (parId.get(ligne.carnetId ?? '')?.criteres ?? [])
        .filter((k) => k.origine === 'vous' || k.origine === 'locale' || k.source === 'phrase').map((k) => k.texte);
      ligne.source = critereTireDe(texte, ligne.caracteristique, ctx.texte, deSaPhrase) ? 'phrase' : 'ia';
    }
    const propose = chaine(r.titrePropose, 200);
    if (propose && sorte === 'idee' && connu && propose.length <= TITRE_MAX && !memeTitre(propose, parId.get(idDemande!)!.titre))
      ligne.titrePropose = propose;

    suiviDeLigne(r, ligne, ctx, nombresTexte);

    sortie.push(ligne);
  }
  /* L-5 (23.11, M3-7) : écrite dans un carnet ouvert, une note de plusieurs lignes ne perd aucune ligne. Une ligne que l'IA ne reprend pas,
     ou qu'elle rend en « idée » du carnet ouvert (que l'écran ne range pas), reste en note dans ce carnet, telle qu'il l'a écrite. */
  if (ouvert && sortie.length) {
    const brutes = ctx.texte.split(/\r?\n/).map((b) => b.replace(/^\s*[-•*–]\s+/, '').trim()).filter(Boolean);
    const rendues = sortie.filter((l) => l.sorte !== 'idee' || (l.carnetNeuf && !l.carnetId));
    if (brutes.length > 1) for (const b of brutes) {
      if (!ligneReprise(SANS_PREFIXE(b), rendues)) sortie.push({ sorte: 'note', genre: 'note', texte: espaces(b).slice(0, TEXTE_LIGNE), carnetId: ouvert.id, origine });
    }
  }
  if (!sortie.length) return null;
  // Les achats en tête, le reste dans l'ordre rendu (tri stable).
  return sortie.map((l, i) => [l, i] as const).sort(([a, i], [b, j]) => Number(ACHAT(b)) - Number(ACHAT(a)) || i - j).map(([l]) => l);
}

/* ---------- D451 : du contexte à lire, et de la réponse à écrire ---------- */

/**
 * Ce que le suivi ajoute au contexte d'un carnet (genre, état, domaine, chemin, options hors pistes, tâches ouvertes, 3 derniers messages tronqués à 160
 * caractères). Une valeur absente est absente, jamais 0 ; aucune photo (accord du 17.11). Rend, par id, les champs à fusionner dans `CarnetPourIA`.
 */
export function pourIASuivi(carnets: readonly CarnetDoc[], messages: readonly MessageDoc[]): Map<string, Partial<CarnetPourIA>> {
  const recents = [...messages].sort((a, b) => b.carnetMessage.le.localeCompare(a.carnetMessage.le));
  return new Map(carnets.map((c) => {
    const options = c.carnet.facons.flatMap((f) => { const e = etatOption(f); return e === 'piste' ? [] : [{ nom: f.nom, etat: e }]; });
    const taches = (c.carnet.taches ?? []).filter((t) => !t.faiteLe).map((t) => t.texte);
    const derniers = recents.filter((m) => m.carnetMessage.depuis === c.id || m.carnetMessage.effets.some((e) => e.carnetId === c.id))
      .slice(0, DERNIERS_MAX).map((m) => espaces(m.carnetMessage.texte).slice(0, 160));
    const domaine = c.carnet.domaine?.valeur;
    const chemin = c.carnet.categorie?.chemin;
    return [c.id, {
      genre: genreDe(c), etat: etatDe(c),
      ...(domaine ? { domaine } : {}), ...(chemin?.length ? { chemin } : {}),
      ...(options.length ? { options } : {}), ...(taches.length ? { taches } : {}), ...(derniers.length ? { derniers } : {})
    }] as const;
  }));
}

/** Ce que l'écran doit savoir du rangement pour écrire le suivi : où est rangée chaque ligne, ce que ce message crée, les options d'un carnet. */
export interface EntreeSuivi {
  texte: string;
  /** Le carnet ouvert quand il a écrit ; `null` depuis la liste. */
  depuis: string | null;
  /** Le carnet où une ligne est rangée (connu, ou celui que ce message crée) ; `undefined` : on ne sait pas. */
  cibleDe: (l: LigneCarnet) => string | undefined;
  /** Les carnets que ce message crée. */
  crees: ReadonlySet<string>;
  /** L'id de l'option d'un carnet qui porte ce nom (sans accent ni casse) ; `undefined` : aucune. */
  optionDe: (carnetId: string, nom: string) => string | undefined;
  /** L'état d'un carnet (pour ne pas proposer de résoudre un résolu). */
  etatDe: (carnetId: string) => EtatSuiviIA | undefined;
}
export interface SuiviDesLignes {
  etiquettes: Etiquette[];
  /** Les cartes « OK · Non » : jamais écrites avant son geste. */
  propositions: PropositionSuivi[];
  /** Depuis la liste : « rattaché : « … » », la citation exacte qui a fait choisir le carnet. */
  rattache?: Rattache;
  /** Les carnets créés par ce message : genre, chemin, état initial que l'IA leur pose (annulable, jamais sur ce qu'il a posé). */
  neufs: Array<{ carnetId: string; genre?: GenreSuivi; chemin?: string[]; etat?: EtatSuiviIA }>;
}

const ETIQUETTES_MONTANT = new Set<string>(['cout', 'devis', 'achat']);
const ETIQUETTES_MAX = 8;
const PROPOSITIONS_MAX = 6;

/**
 * D451 : les lignes gardées deviennent étiquettes (jetons sous la bulle), cartes « OK · Non » et réglages d'un carnet neuf. Rien n'écrit
 * un état, un choix, une date ni une tâche : retenir, dater, résoudre, veiller, tâche restent des propositions.
 * MESSAGE-RESTE-DANS-SON-CARNET (C64-8) : une ligne rangée dans le carnet ouvert qui visait un autre carnet (`carnetSuggere`) devient la proposition
 * « Rattacher à … ? » (`deplacer`), jamais une écriture ailleurs.
 */
export function suiviDesLignes(lignes: readonly LigneCarnet[], o: EntreeSuivi): SuiviDesLignes {
  const etiquettes: Etiquette[] = [];
  const propositions: PropositionSuivi[] = [];
  const neufs = new Map<string, { carnetId: string; genre?: GenreSuivi; chemin?: string[]; etat?: EtatSuiviIA }>();
  let rattache: Rattache | undefined;
  const vues = new Set<string>();
  const proposer = (p: PropositionSuivi) => {
    const cle = JSON.stringify([p.sorte, p.carnetId, p.optionId ?? null, p.sorte === 'deplacer' ? null : p.texte ?? null, p.versCarnetId ?? null]);
    if (vues.has(cle) || propositions.length >= PROPOSITIONS_MAX) return;
    vues.add(cle);
    propositions.push(p);
  };
  const sans = <T extends object>(x: T): T => Object.fromEntries(Object.entries(x).filter(([, v]) => v !== undefined)) as T;

  for (const l of lignes) {
    const cid = o.cibleDe(l);
    if (o.depuis && cid === o.depuis && l.carnetSuggere && l.carnetSuggere !== o.depuis)
      proposer(sans({ sorte: 'deplacer' as const, carnetId: o.depuis, versCarnetId: l.carnetSuggere, texte: l.citation, origine: l.origine }));
    if (!cid) continue;
    const nouveau = o.crees.has(cid);
    if (nouveau && (l.genreCarnet || l.chemin || l.etatPropose)) {
      const n = neufs.get(cid) ?? { carnetId: cid };
      neufs.set(cid, { ...n, genre: n.genre ?? l.genreCarnet, chemin: n.chemin ?? l.chemin, etat: n.etat ?? l.etatPropose });
    }
    const optionId = l.option && !nouveau ? o.optionDe(cid, l.option) : undefined;
    if (l.etiquette && etiquettes.length < ETIQUETTES_MAX) {
      const montant = ETIQUETTES_MONTANT.has(l.etiquette) && l.prixCentimes !== undefined && l.prixSource === 'texte';
      const devise = montant ? l.devise ?? prixTousDe(o.texte).find((x) => x.centimes === l.prixCentimes)?.devise : undefined;
      etiquettes.push(sans({
        carnetId: cid, sorte: l.etiquette, texte: l.option && !optionId ? l.option : undefined,
        montantCentimes: montant ? l.prixCentimes : undefined, devise, estime: montant && l.estime ? true as const : undefined,
        optionId, origine: l.origine
      }));
    }
    if (!o.depuis && !rattache && l.citation && !nouveau) rattache = { carnetId: cid, citation: l.citation };
    if (nouveau) {
      // un carnet qui naît n'a ni option ni état à changer : seule une tâche se propose
      if (l.tachePropose?.texte) proposer(sans({ sorte: 'tache' as const, carnetId: cid, texte: l.tachePropose.texte, echeance: l.tachePropose.echeance, precision: l.tachePropose.precision,
        coutCentimes: l.tachePropose.coutEstime ? undefined : l.tachePropose.coutCentimes, devise: l.tachePropose.coutEstime ? undefined : l.tachePropose.devise, origine: l.origine }));
      continue;
    }
    if (l.tachePropose) {
      const t = l.tachePropose;
      // Un coût « à peu près » n'est pas porté par la proposition (elle n'a pas de drapeau « estimé ») : absent plutôt que faussement ferme.
      const cout = t.coutEstime ? {} : { coutCentimes: t.coutCentimes, devise: t.devise };
      if (t.texte) proposer(sans({ sorte: 'tache' as const, carnetId: cid, texte: t.texte, echeance: t.echeance, precision: t.precision, optionId, ...cout, origine: l.origine }));
      else if (optionId && t.echeance) proposer(sans({ sorte: 'dater' as const, carnetId: cid, optionId, texte: l.option, echeance: t.echeance, precision: t.precision, origine: l.origine }));
    }
    if (optionId && (l.etiquette === 'retenu' || l.etatPropose === 'decide')) proposer({ sorte: 'retenir', carnetId: cid, optionId, origine: l.origine });
    if (optionId && l.etiquette === 'veille') proposer({ sorte: 'veiller', carnetId: cid, optionId, origine: l.origine });
    if (l.etatPropose === 'resolu' && o.etatDe(cid) !== 'resolu') proposer(sans({ sorte: 'resoudre' as const, carnetId: cid, optionId, origine: l.origine }));
  }
  return { etiquettes, propositions, ...(rattache ? { rattache } : {}), neufs: [...neufs.values()].map((n) => sans(n)) };
}

/** Ce que l'IA a rangé, dit en une ligne (R19, G23) : « 3 lignes · 2 carnets · 1 achat » ; « pas d'achat » quand il n'y en a pas. */
export function resume(lignes: readonly LigneCarnet[]): { lignes: number; carnets: number; achats: number } {
  const carnets = new Set(lignes.map((l) => l.carnetId ?? (l.carnetNeuf ? `neuf:${sansAccents(l.carnetNeuf)}` : 'sans')));
  return { lignes: lignes.length, carnets: carnets.size, achats: lignes.filter(ACHAT).length };
}
