/**
 * Carnet d'idées : analyse locale d'un message (repli sans IA, hors ligne, et aperçu « pendant » sans un appel par frappe ; G3, G9, G14).
 *
 * État de l'art (MISSION « ## État de l'art ») : découpe en lignes, URL par motif candidat puis parseur WHATWG `URL` (ponctuation finale retirée),
 * prix par motifs du format suisse puis `parseDecimal`, quantités dans une liste fermée d'unités du métier, genre par mots-clés. Aucune
 * dépendance nouvelle. Règle d'honnêteté : un nombre rendu figure dans la phrase ; une phrase sans prix n'a pas de `prixCentimes`.
 * Aucun gabarit par objet (C2) : aucun mot propre à une catégorie d'objet ici.
 */
import { parseDecimal } from '../../ui/numericInput';
import type { GenreNote } from './modele';

/* ---------- normalisation partagée (rattacher.ts, doublons.ts) ---------- */

/** Minuscules, sans accents (NFD), ponctuation en espaces. */
export function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Mots vides du français courant (aucun mot du métier). */
export const MOTS_VIDES = new Set([
  'le', 'la', 'les', 'l', 'un', 'une', 'des', 'de', 'du', 'd', 'au', 'aux', 'a', 'et', 'ou', 'en', 'dans', 'sur', 'sous', 'pour', 'par', 'avec', 'sans',
  'chez', 'ce', 'cet', 'cette', 'ces', 'ca', 'cela', 'qui', 'que', 'quoi', 'dont', 'il', 'elle', 'ils', 'elles', 'on', 'je', 'j', 'tu', 'nous', 'vous',
  'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs', 'est', 'sont', 'etre', 'avoir', 'ai',
  'as', 'avons', 'faut', 'fait', 'plus', 'moins', 'tres', 'trop', 'pas', 'ne', 'n', 'se', 's', 'y', 'si', 'mais', 'donc', 'car', 'comme', 'aussi',
  'tout', 'tous', 'toute', 'toutes', 'bien', 'peu', 'vu', 'vue', 'mettre', 'faire', 'deja', 'encore', 'alors', 'ici', 'la', 'cm', 'mm', 'kg', 'chf',
  'fr', 'eur', 'http', 'https', 'www', 'com', 'ch', 'qu', 'c', 'm', 't', 'zz', 'test', 'autre', 'autres', 'meme', 'quelque', 'petit', 'petite',
  'gros', 'grosse', 'grand', 'grande', 'nouveau', 'nouvelle', 'pourquoi', 'quand', 'comment', 'combien', 'chose', 'truc', 'genre', 'idee'
]);

/** Racine légère : pluriels en -s, -x retirés (bacs → bac, fûts → fut). */
export const racine = (mot: string): string => (mot.length > 3 && /[sx]$/.test(mot) && !/(ss|is|us)$/.test(mot) ? mot.slice(0, -1) : mot);

/** Jetons significatifs d'un texte : normalisés, sans mots vides ni nombres, racinés. */
export function jetons(texte: string): string[] {
  return normaliser(texte).split(' ').filter(m => m.length >= 3 && !/^\d+$/.test(m) && !MOTS_VIDES.has(m)).map(racine);
}

/* ---------- découpe ---------- */

/** Lignes d'un message : retours à la ligne, puces (- • * –), « ; ». Lignes vides retirées, puce de tête ôtée. */
export function decouper(texte: string): string[] {
  return texte.split(/\r?\n|;/)
    .map(l => l.replace(/^\s*(?:[-•*–—]|\d+[.)])\s+/, '').trim())
    .filter(l => l !== '');
}

/* ---------- URL ---------- */

export interface LienTrouve { url: string; domaine: string; debut: number; fin: number }

const MOTIF_URL = /\b(?:https?:\/\/|www\.)[^\s<>"«»]+|\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:ch|com|de|fr|it|at|eu|net|org|io|shop|swiss)\/[^\s<>"«»]*|\b[a-z0-9][a-z0-9-]*\.(?:ch|com|de|fr|it|at|eu|net|org|shop|swiss)\b(?!\.[a-z])/gi;

/** URLs d'un texte : motif candidat, ponctuation finale retirée (parenthèse non ouverte comprise), puis `new URL`. */
export function urlsDe(texte: string): LienTrouve[] {
  const sortie: LienTrouve[] = [];
  for (const m of texte.matchAll(MOTIF_URL)) {
    let brut = m[0];
    /* ponctuation finale : point, virgule, etc. ; une parenthèse fermante sans ouvrante */
    for (;;) {
      const avant = brut;
      brut = brut.replace(/[.,;:!?'"»]+$/, '');
      if (brut.endsWith(')') && (brut.match(/\(/g)?.length ?? 0) < (brut.match(/\)/g)?.length ?? 0)) brut = brut.slice(0, -1);
      if (brut === avant) break;
    }
    const debut = m.index ?? 0;
    /* une adresse courriel n'est pas un lien */
    if (debut > 0 && texte[debut - 1] === '@') continue;
    const complet = /^https?:\/\//i.test(brut) ? brut : `https://${brut}`;
    try {
      const u = new URL(complet);
      if (!u.hostname.includes('.')) continue;
      sortie.push({ url: /^https?:\/\//i.test(brut) ? brut : complet, domaine: u.hostname.replace(/^www\./, ''), debut, fin: debut + brut.length });
    } catch { /* candidat illisible : ignoré */ }
  }
  return sortie;
}

/* ---------- prix ---------- */

export interface PrixTrouve { centimes: number; devise: 'CHF' | 'EUR'; texte: string; debut: number; fin: number }

/* un nombre : milliers séparés par ' ’ ou espace (insécable comprise), décimales en . ou , (1 ou 2 chiffres) */
const NOMBRE = String.raw`\d{1,3}(?:['’   ]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?`;
const TIRET = String.raw`[.,]?\s?[–—-]{1,2}`;
const DEVISE_AVANT = String.raw`(CHF|SFr\.?|Fr\.|€|EUR)`;
const DEVISE_APRES = String.raw`(CHF|SFr\.?|Fr\.|francs?|€|EUR|euros?)`;
const MOTIFS_PRIX: { re: RegExp; nombre: number; devise: number | null }[] = [
  { re: new RegExp(String.raw`${DEVISE_AVANT}\s?(${NOMBRE})(?:${TIRET})?(?![\d])`, 'gi'), nombre: 2, devise: 1 },
  { re: new RegExp(String.raw`(?<![\d.,'’])(${NOMBRE})(?:${TIRET})?\s?${DEVISE_APRES}(?![a-zà-ÿ])`, 'gi'), nombre: 1, devise: 2 },
  { re: new RegExp(String.raw`(?<![\d.,'’])(${NOMBRE})\s?[.,]\s?[–—-]{1,2}(?![\d])`, 'g'), nombre: 1, devise: null }
];

const deviseDe = (brut: string | undefined): 'CHF' | 'EUR' => (brut && /€|eur/i.test(brut) ? 'EUR' : 'CHF');

/** Montant lu en centimes, par `parseDecimal` (séparateurs de milliers retirés). */
function centimesDe(nombre: string): number | null {
  const sansMilliers = nombre.replace(/['’   ](?=\d{3}(?:\D|$))/g, '');
  const n = parseDecimal(sansMilliers);
  return n === null || n < 0 ? null : Math.round(n * 100);
}

/** Le premier prix d'un texte (hors liens), au format suisse : « 1'450.– », « 1 450 CHF », « CHF 690.- », « Fr. 45.50 », « 120 € ». */
export function prixDe(texte: string): PrixTrouve | null {
  return prixTousDe(texte)[0] ?? null;
}

/** Tous les prix d'un texte, dans l'ordre, sans chevauchement ; les liens sont masqués avant. */
export function prixTousDe(texte: string): PrixTrouve[] {
  const masque = masquer(texte, urlsDe(texte));
  const trouves: PrixTrouve[] = [];
  for (const { re, nombre, devise } of MOTIFS_PRIX) {
    for (const m of masque.matchAll(re)) {
      const debut = m.index ?? 0, fin = debut + m[0].length;
      if (trouves.some(t => debut < t.fin && fin > t.debut)) continue;
      const centimes = centimesDe(m[nombre]);
      if (centimes === null) continue;
      trouves.push({ centimes, devise: deviseDe(devise === null ? undefined : m[devise]), texte: m[0].trim(), debut, fin });
    }
  }
  return trouves.sort((a, b) => a.debut - b.debut);
}

/** Remplace des plages par des espaces (mêmes positions). */
function masquer(texte: string, plages: readonly { debut: number; fin: number }[]): string {
  let s = texte;
  for (const p of plages) s = s.slice(0, p.debut) + ' '.repeat(p.fin - p.debut) + s.slice(p.fin);
  return s;
}

/* ---------- quantités ---------- */

/** Liste fermée des unités du métier (MISSION) ; variantes écrites ramenées à la forme canonique. */
const UNITES: readonly [string, string][] = [
  ['m³/h', 'm³/h'], ['m3/h', 'm³/h'], ['°C', '°C'], ['° C', '°C'], ['kW', 'kW'], ['kg', 'kg'], ['dB', 'dB'], ['bar', 'bar'], ['cm', 'cm'], ['mm', 'mm'],
  ['W', 'W'], ['L', 'L'], ['l', 'L'], ['bacs', 'bacs'], ['bac', 'bacs'], ['becs', 'becs'], ['bec', 'becs'], ['fûts', 'fûts'], ['fût', 'fûts'], ['futs', 'fûts'], ['fut', 'fûts']
];
const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, ch => '\\' + ch);
const MOTIF_QUANTITE = new RegExp(
  String.raw`(?<![\d.,'’])(\d{1,3}(?:['’   ]\d{3})+|\d+(?:[.,]\d+)?)\s?(` + UNITES.map(([u]) => echapper(u)).join('|') + String.raw`)(?![a-zA-Zà-ÿ0-9²³'’])`, 'g'
);

export interface Quantite { valeur: number; unite: string; /** le nombre tel qu'il est tapé (« 2,5 ») */ texte: string }

/** Quantités d'un texte, unités de la liste fermée ; liens et prix masqués avant. */
export function quantitesDe(texte: string): Quantite[] {
  const masque = masquer(texte, [...urlsDe(texte), ...prixTousDe(texte)]);
  const sortie: Quantite[] = [];
  for (const m of masque.matchAll(MOTIF_QUANTITE)) {
    const valeur = parseDecimal(m[1].replace(/['’   ](?=\d{3})/g, ''));
    const unite = UNITES.find(([u]) => u === m[2])?.[1];
    if (valeur === null || !unite) continue;
    sortie.push({ valeur, unite, texte: m[1] });
  }
  return sortie;
}

/* ---------- genre et sorte ---------- */

const PAS_VERBES = new Set(['pour', 'entre', 'notre', 'votre', 'autre', 'contre', 'leur', 'premier', 'dernier', 'hier', 'fer', 'mer', 'cher', 'super', 'hiver', 'quatre', 'litre', 'metre', 'filtre', 'centre', 'cidre', 'sucre', 'ordre', 'titre', 'chiffre', 'nombre', 'cadre', 'poudre', 'vitre', 'lettre', 'plutot', 'desir', 'plaisir', 'loisir', 'avenir', 'soir', 'noir', 'espoir', 'tiroir', 'miroir', 'couloir', 'reservoir', 'arrosoir', 'entonnoir', 'comptoir', 'pressoir', 'laminoir', 'evier', 'panier', 'papier', 'acier', 'atelier', 'calendrier', 'fournisseur', 'boucher', 'boulanger', 'rocher', 'plancher', 'escalier', 'dossier', 'fichier', 'cahier', 'clavier', 'collier', 'levier', 'quartier', 'chantier', 'sentier', 'mobilier', 'premiere', 'derniere', 'bière', 'biere', 'verre']);

/** Le genre d'une ligne, par mots-clés : achat, question, conseil, à faire (verbe en tête), sinon note. */
export function genreLocal(ligne: string, indices: { prix?: boolean; url?: boolean } = {}): GenreNote {
  const n = normaliser(ligne);
  if (/\?\s*$/.test(ligne.trim()) || /^(est ce|faut il|combien|pourquoi|quel|quelle|comment)\b/.test(n)) return 'question';
  if (indices.prix || indices.url || /\b(acheter|achat|achats|commander|commande|racheter|devis|prix|budget)\b/.test(n)) return 'a-acheter';
  if (/^(penser a|pense a|conseil|astuce|attention|eviter|ne pas)\b/.test(n) || /\bconseil\b/.test(n)) return 'conseil';
  const premier = n.split(' ')[0] ?? '';
  if (premier.length > 3 && /(er|ir|re)$/.test(premier) && !PAS_VERBES.has(premier)) return 'a-faire';
  return 'note';
}

const MOTS_CRITERE = /\b(minimum|maximum|mini|maxi|min|max|au moins|au plus|il faut|faut que|doit|doivent|pas plus de|pas moins de|tient|tenir|supporte|minimiser|maximiser|eviter)\b/;

export type SorteLocale = 'article' | 'critere' | 'note';

/** Une ligne analysée en local. `origine: 'locale'` : picto distinct du ✻ de l'IA (Q19). */
export interface LigneLocale {
  texte: string;
  sorte: SorteLocale;
  genre: GenreNote;
  url?: string;
  domaine?: string;
  prixCentimes?: number;
  devise?: 'CHF' | 'EUR';
  quantites: Quantite[];
  origine: 'locale';
}

/** Analyse une ligne : lien, prix, quantités, genre, sorte (lien ou prix → article ; mots de seuil ou quantité seule → critère ; sinon note). */
export function analyserLigne(texte: string): LigneLocale {
  const lien = urlsDe(texte)[0];
  const prix = prixDe(texte);
  const quantites = quantitesDe(texte);
  const genre = genreLocal(texte, { prix: !!prix, url: !!lien });
  const n = normaliser(texte);
  const sorte: SorteLocale = lien || prix ? 'article'
    : genre !== 'question' && genre !== 'a-acheter' && (MOTS_CRITERE.test(n) || (quantites.length > 0 && genre === 'note')) ? 'critere'
      : 'note';
  return {
    texte, sorte, genre, quantites, origine: 'locale',
    ...(lien ? { url: lien.url, domaine: lien.domaine } : {}),
    ...(prix ? { prixCentimes: prix.centimes, devise: prix.devise } : {})
  };
}

/* ---------- R13 « Va dans » (g5:v02-10) : puces de correction, préchoisies par l'aperçu local ---------- */

export type RubriqueVaDans = 'critere' | 'note' | 'facon';
/** Les puces de la maquette g5:v02-10, dans son ordre. */
export const PUCES_VA_DANS: readonly { id: RubriqueVaDans; libelle: string }[] = [
  { id: 'critere', libelle: 'Ce qui compte' }, { id: 'note', libelle: 'Note' }, { id: 'facon', libelle: 'Façon' }
];

/**
 * La rubrique que l'aperçu local choisit pour une phrase tapée dans un carnet, cochée d'avance ; les puces ne servent qu'à corriger.
 * `null` (aucune puce) : texte vide, plusieurs lignes (note en vrac, découpée par l'IA) ou article (lien, prix : il va aux Articles).
 */
export function vaDansDe(texte: string): RubriqueVaDans | null {
  const lignes = analyserTexte(texte);
  if (lignes.length !== 1 || lignes[0].sorte === 'article') return null;
  return lignes[0].sorte;
}

/** Analyse d'un message entier : une ligne analysée par ligne découpée. Instantané, sans réseau. */
export function analyserTexte(texte: string): LigneLocale[] {
  return decouper(texte).map(analyserLigne);
}

/** Les nombres écrits dans un texte (pour vérifier qu'aucun nombre n'est inventé). Milliers recollés. */
export function nombresEcrits(texte: string): number[] {
  const sortie: number[] = [];
  for (const m of texte.matchAll(new RegExp(NOMBRE, 'g'))) {
    const c = centimesDe(m[0]);
    if (c !== null) sortie.push(c / 100);
    const brut = parseDecimal(m[0].replace(/['’   ]/g, ''));
    if (brut !== null) sortie.push(brut);
    for (const morceau of m[0].split(/['’   ]/)) { const x = parseDecimal(morceau); if (x !== null) sortie.push(x); }
  }
  return sortie;
}
