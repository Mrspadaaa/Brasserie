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
import {
  CARNETS_MAX, GENRES_CARNET, LIGNES_MAX, PAGES_MAX, SENS_CARNET, SORTES_CARNET,
  type ContexteRangerCarnet, type GenreCarnet, type PageLue, type SensCarnet, type SorteCarnet
} from '../../../functions/src/carnetIA';
import { jetons } from './analyseLocale';

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
  raisonCarnet?: string;
  url?: string;
  prixCentimes?: number;
  devise?: string;
  /** D'où vient le prix : écrit dans le message, ou lu sur la page du lien. */
  prixSource?: 'texte' | 'page';
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
  /** `ia` (Gemini) ou `exemple` (simulation, B7 : toute ligne simulée reste marquée « exemple »). */
  origine: 'ia' | 'exemple';
  /**
   * Critique 5, n° 1 : d'où vient un critère, décidé par le garde (`critereTireDe`), réponse réelle ou simulée : `phrase` s'il est tiré de
   * ses mots (« tiré de votre phrase »), sinon `ia` (« proposé par l'IA »). Absent sur les autres sortes.
   */
  source?: 'phrase' | 'ia';
}

/** La forme minimale d'une idée pour l'IA ; `CarnetsVue.tsx` (lot D) la tire du modèle du lot A. */
export interface CarnetPourIA {
  id: string;
  titre: string;
  /** Dernière activité (ms) : au plus 30 carnets, les plus récents d'abord. */
  majLe?: number;
  criteres?: ReadonlyArray<{ texte: string; caracteristique?: Caracteristique }>;
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
      notes: (c.notes ?? []).map((n) => ({ id: n.id, texte: n.texte }))
    }))
  };
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
 * Critique 5, n° 1 : un critère est-il tiré des mots du message ? Ses mots significatifs (hors nom de sa caractéristique, que l'IA
 * peut nommer : « débit » pour « 150 kg/h ») sont pour 60 % au moins dans le message, et chacun de ses nombres y est écrit. Un critère
 * qui n'a ni mot propre ni nombre (« le débit ») n'est pas tiré du message : il est proposé par l'IA.
 */
export function critereTireDe(texte: string, caracteristique: { nom: string } | undefined, message: string): boolean {
  const nom = new Set(jetons(caracteristique?.nom ?? ''));
  const mots = [...new Set(jetons(texte))].filter(m => !nom.has(m));
  const nombres = nombresDe(texte);
  if (!mots.length && !nombres.length) return false;
  const dits = nombresDe(message);
  if (!nombres.every(n => contient(dits, n))) return false;
  if (!mots.length) return true;
  const ecrits = new Set(jetons(message));
  return mots.filter(m => ecrits.has(m)).length / mots.length >= 0.6;
}

const memeTitre = (a: string, b: string) => sansAccents(espaces(a)) === sansAccents(espaces(b));
const ACHAT = (l: LigneCarnet) => l.sorte === 'article' || l.genre === 'a-acheter';

export interface ContexteGarde {
  texte: string;
  carnets: readonly CarnetPourIA[];
  depuis?: string | null;
  pages?: readonly PageLue[];
  origine?: LigneCarnet['origine'];
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
    const connu = idDemande !== undefined && parId.has(idDemande);
    if (connu) ligne.carnetId = idDemande;
    else {
      const neuf = chaine(r.carnetNeuf, TITRE_MAX) ?? (idDemande ? (titre ?? texte).slice(0, TITRE_MAX) : undefined);
      if (neuf) ligne.carnetNeuf = neuf;
      else if (ctx.depuis && parId.has(ctx.depuis)) ligne.carnetId = ctx.depuis;
    }
    const raison = chaine(r.raisonCarnet, 120);
    if (raison) ligne.raisonCarnet = raison;

    // Lien : écrit dans le message, sinon retiré. La page lue de ce lien suit la ligne.
    const url = chaine(r.url, 2000);
    if (url && urlDansTexte(url, ctx.texte)) {
      ligne.url = url;
      const page = (ctx.pages ?? []).find((p) => formeUrl(p.url) === formeUrl(url));
      if (page) ligne.page = page;
    }
    const pagesDeLigne = ligne.page?.statut === 'lue' ? [ligne.page] : pagesLues;

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
      ligne.source = critereTireDe(texte, ligne.caracteristique, ctx.texte) ? 'phrase' : 'ia';
    }
    const propose = chaine(r.titrePropose, 200);
    if (propose && sorte === 'idee' && connu && propose.length <= TITRE_MAX && !memeTitre(propose, parId.get(idDemande!)!.titre))
      ligne.titrePropose = propose;

    sortie.push(ligne);
  }
  if (!sortie.length) return null;
  // Les achats en tête, le reste dans l'ordre rendu (tri stable).
  return sortie.map((l, i) => [l, i] as const).sort(([a, i], [b, j]) => Number(ACHAT(b)) - Number(ACHAT(a)) || i - j).map(([l]) => l);
}

/** Ce que l'IA a rangé, dit en une ligne (R19, G23) : « 3 lignes · 2 carnets · 1 achat » ; « pas d'achat » quand il n'y en a pas. */
export function resume(lignes: readonly LigneCarnet[]): { lignes: number; carnets: number; achats: number } {
  const carnets = new Set(lignes.map((l) => l.carnetId ?? (l.carnetNeuf ? `neuf:${sansAccents(l.carnetNeuf)}` : 'sans')));
  return { lignes: lignes.length, carnets: carnets.size, achats: lignes.filter(ACHAT).length };
}
