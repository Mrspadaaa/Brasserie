/**
 * Carnet d'idées : analyse locale d'un message (repli sans IA, hors ligne, et aperçu « pendant » sans un appel par frappe ; G3, G9, G14).
 *
 * État de l'art (MISSION « ## État de l'art ») : découpe en lignes, URL par motif candidat puis parseur WHATWG `URL` (ponctuation finale retirée),
 * prix par motifs du format suisse puis `parseDecimal`, quantités dans une liste fermée d'unités du métier, genre par mots-clés. Aucune
 * dépendance nouvelle. Règle d'honnêteté : un nombre rendu figure dans la phrase ; une phrase sans prix n'a pas de `prixCentimes`.
 * Aucun gabarit par objet (C2) : aucun mot propre à une catégorie d'objet ici.
 */
import { nombreFr } from '../nombreAffiche';
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
  'gros', 'grosse', 'grand', 'grande', 'nouveau', 'nouvelle', 'pourquoi', 'quand', 'comment', 'combien', 'chose', 'truc', 'genre', 'idee',
  /* critique 6, n° 1 : un jour dit quand, jamais de quoi parle la ligne (« …, jeudi » va dans le carnet de son objet) */
  'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche', 'demain', 'aujourd', 'hui', 'semaine'
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
    .filter(l => l !== '')
    .flatMap(phrasesEtiquetees);
}

/** Une étiquette de tête (« Pour le bac : », « Sol local : ») : 2 à 40 caractères sans chiffre ni fin de phrase, puis « : ». */
const ETIQUETTE = /^[^:.!?\d]{2,40}?\s?:\s*\S/u;

/**
 * Critique 6, n° 1 (390 clair-22) : une note tapée sur une seule ligne qui enchaîne des phrases étiquetées (« Pour le bac : 2 bacs de
 * lavage. Pour la hotte : tient 80 °C. Pour la pompe : 1 800 m³/h. ») est une note en vrac : une ligne par phrase. Toutes les phrases
 * doivent porter leur étiquette ; sinon la ligne reste entière (« Fr. 189,90 », « env. 30 L » ne coupent rien).
 */
export function phrasesEtiquetees(ligne: string): string[] {
  const parts = phrasesDe(ligne);
  if (parts.length < 2) return [ligne];
  if (parts.every(s => ETIQUETTE.test(sansPrefixeBanc(s)))) return parts.map(s => s.replace(/\.\s*$/, '').trim());
  /* Critique 7, n° 1 (390 clair-22 ; R18, D-139) : « Sachets de levure x2. Prochain brassage mardi. Tient 80 °C pour la hotte. » est une note
     en vrac tapée sur une ligne. Une phrase qui suit la précédente sans objet à elle (« Doit tenir 80 °C. », « 1 800 m³/h. ») la complète ;
     les autres font chacune leur ligne. Une seule idée (« Hotte inox 120 cm. Doit tenir 80 °C. ») reste entière. */
  const groupes: string[] = [];
  for (const p of parts) {
    if (groupes.length && completePrecedente(p)) groupes[groupes.length - 1] += ` ${p}`;
    else groupes.push(p);
  }
  return groupes.length < 2 ? [ligne] : groupes.map(s => s.replace(/\.\s*$/, '').trim());
}

/** Les abréviations qui finissent par un point sans finir la phrase (« Fr. 189,90 », « env. 30 L », « p. ex. »). */
const ABREVIATION = /(?:^|[\s(])(?:fr|sfr|env|ca|cf|max|min|mini|maxi|ex|p|n|no|nr|art|réf|ref|vol|st|ste|mt|dr|resp|etc)\.$/i;

/**
 * Les phrases d'une ligne : coupure après « . ! ? » suivis d'une espace et d'une majuscule ou d'un chiffre ; jamais après une abréviation
 * (`ABREVIATION`) ni un nombre seul (« 2. »). Méthode des segmenteurs de phrases (règles de fin de phrase et liste d'abréviations) ;
 * `Intl.Segmenter` n'est pas dans la cible ES2020 du projet et coupe « Fr. 189,90 CHF ».
 */
export function phrasesDe(ligne: string): string[] {
  const parts: string[] = [];
  let debut = 0;
  for (const m of ligne.matchAll(/[.!?]+\s+(?=[\p{Lu}\d])/gu)) {
    const fin = (m.index ?? 0) + m[0].length;
    const avant = ligne.slice(debut, (m.index ?? 0) + m[0].trimEnd().length);
    if (/[.]$/.test(avant) && (ABREVIATION.test(avant) || /(?:^|\s)\d+\.$/.test(avant))) continue;
    parts.push(avant.trim());
    debut = fin;
  }
  parts.push(ligne.slice(debut).trim());
  return parts.filter(Boolean);
}

/** Une phrase qui complète la précédente : elle commence par un renvoi ou une exigence sans sujet (« Doit… », « Elle… », « Avec… »),
 *  ou par une mesure (« 1 800 m³/h minimum »), et ne nomme pas son propre objet (« … pour la hotte »). */
const RENVOI = /^(?:il|elle|ils|elles|ce|cette|ces|ca|cela|c|doit|doivent|devra|tient|tiennent|supporte|resiste|faut|il faut|avec|sans|et|mais|ou|donc|aussi|pas|plutot|sinon|ideal|ideale|idealement|de preference|dont|en|y|on|le tout|soit|meme)\b/;
function completePrecedente(phrase: string): boolean {
  const n = normaliser(sansPrefixeBanc(phrase));
  if (/\bpour (?:la|le|les|l) \p{L}{3,}/u.test(n)) return false;
  if (RENVOI.test(n)) return true;
  const q = quantitesDe(phrase)[0];
  return !!q && normaliser(phrase).startsWith(normaliser(q.texte)) && !/^\d+\s+(?!(?:cm|mm|kg|l|w|kw|db|bar|m3|m)\b)\p{L}{3,}/u.test(n);
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
/* P40 (décision pilote) : une devise placée AVANT le nombre ne compte que si elle n'est pas collée à une lettre ; « moteur 189,90 CHF »
   ne se lit pas « eur 189,90 » (la fin de « moteur »), mais « 189,90 CHF » par le motif suivant. */
const MOTIFS_PRIX: { re: RegExp; nombre: number; devise: number | null }[] = [
  { re: new RegExp(String.raw`(?<!\p{L})${DEVISE_AVANT}\s?(${NOMBRE})(?:${TIRET})?(?![\d])`, 'giu'), nombre: 2, devise: 1 },
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
  /* les unités composées d'abord (« 150 kg/h » n'est pas « 150 kg ») : l'alternance du motif garde la première qui lit */
  ['m³/h', 'm³/h'], ['m3/h', 'm³/h'], ['kg/h', 'kg/h'], ['L/min', 'L/min'], ['l/min', 'L/min'], ['L/h', 'L/h'], ['l/h', 'L/h'], ['°C', '°C'], ['° C', '°C'], ['kW', 'kW'], ['kg', 'kg'], ['dB', 'dB'], ['bar', 'bar'], ['cm', 'cm'], ['mm', 'mm'],
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

/** Un nombre de pièces (« 2 pièces », « 3 pcs », « x2 », « 2x ») ou un diamètre (« Ø 150 ») : la ligne désigne une chose à acheter. */
const PIECES = /\b\d+\s?(?:pieces?|pcs|pce|x|sachets?|paquets?|boites?|sacs?|bidons?)\b|\bx\s?\d+\b/;
const DIAMETRE = /[Øø⌀]\s?\d/;

/**
 * Critique 6, n° 2 (D-124) : une étiquette de tête qui dit le genre (« Ajoute : 2 sachets de levure », « À faire : », « Question : »).
 * Le même genre pendant (aperçu local) et après (IA simulée, `formerLigne`) : un seul tableau, ici.
 */
export const GENRE_PAR_ETIQUETTE: ReadonlyArray<readonly [RegExp, GenreNote]> = [
  [/^(?:ajoute|ajouter|a acheter|acheter|achats?|courses|commander)$/, 'a-acheter'], [/^(?:a faire|todo|faire)$/, 'a-faire'],
  [/^questions?$/, 'question'], [/^(?:conseils?|astuces?)$/, 'conseil']
];
/** Le genre dit par l'étiquette de tête d'une ligne, sinon `undefined`. */
export function genreDEtiquette(ligne: string): GenreNote | undefined {
  const lib = /^([^:]{2,30}?)\s*:\s*\S/.exec(sansPrefixeBanc(ligne).trim())?.[1];
  if (!lib) return undefined;
  const n = normaliser(lib);
  return GENRE_PAR_ETIQUETTE.find(([re]) => re.test(n))?.[1];
}

/**
 * Le brassin (le métier même de la brasserie, pas une catégorie d'objet) : une ligne qui parle du prochain brassin, de ses ingrédients
 * ou de son jour (« 2 sachets de levure », « Prochain brassage mardi »). Critique 6, n° 1 : ces lignes vont ensemble dans « Prochain
 * brassin » (G23, g5:v02-19), jamais dans le carnet d'un objet voisin (« Sol local »).
 */
/* « malt » n'y est pas : « moulin à malt » est un équipement, pas le brassin */
const MOTS_BRASSIN = /\b(?:brassin|brassins|brassage|brasser|levure|levures|houblon|houblons|empatage|ebullition|whirlpool|recette)\b/;
export const parleDuBrassin = (texte: string): boolean => MOTS_BRASSIN.test(normaliser(sansPrefixeBanc(texte)));
export const TITRE_BRASSIN = 'Prochain brassin';

/**
 * Critique 6, n° 1 : l'objet d'une ligne, qui titre le carnet neuf qu'elle ouvre — jamais la note entière. L'étiquette de tête si elle
 * nomme une chose (« Sol local : 2 bacs » → « Sol local » ; « Pour la pompe : … » → « Pompe »), pas si elle dit le genre (« Ajoute : »).
 * Sinon le début de la ligne, avant sa première mesure (« Hotte 120 cm trop large » → « Hotte »), sans compte de tête (« 2 sachets de
 * levure » → « Levure »). 40 caractères au plus, coupé sur un mot.
 */
export function objetDe(ligne: string): string {
  const t = sansPrefixeBanc(ligne).trim();
  /* critique 7, n° 1 et 2 : « Tient 80 °C pour la hotte » parle de la hotte ; son objet est la hotte, jamais « Tient » */
  const pour = RENVOI.test(normaliser(t)) ? /\bpour\s+(?:la|le|les|l['’])\s*([^,.;:!?()]{3,40})/i.exec(t) : null;
  if (pour) return majuscule(pour[1].trim());
  const lib = /^([^:]{2,40}?)\s*:\s*\S/.exec(t);
  let o = lib && /\p{L}/u.test(lib[1]) && !genreDEtiquette(t) ? lib[1] : lib && genreDEtiquette(t) ? t.slice(lib[0].length - 1) : t.split(/[,;?!(]/)[0];
  o = o.trim()
    .replace(/^(?:pour|chez|a propos d[eu]|à propos d[eu])\s+/i, '')
    .replace(/^(?:l['’]\s*|les\s+|le\s+|la\s+|une?\s+|des\s+|du\s+)/i, '')
    .replace(/^\d+\s+\p{L}+\s+(?:de\s+|d['’]\s*)/u, '');
  const avantMesure = o.split(/\s+(?=[\dØø⌀])/)[0].trim();
  if (avantMesure.length >= 3) o = avantMesure;
  o = o.replace(/[\s.:·\-–—]+$/, '').trim();
  /* tour 3, PCN-159 : « …pour le moût chaud » (48 car.) gardait « pour le » ; 60 car. au plus, jamais fini sur un mot-outil */
  if (o.length > 60) o = o.slice(0, 60).replace(/\s+\S*$/, '');
  o = o.replace(/(?:\s+(?:pour|le|la|les|de|du|des|à|au|aux|en|et|avec|sur|par))+$/i, '');
  return o ? majuscule(o) : majuscule(t.slice(0, 40));
}

/**
 * Le genre d'une ligne, par mots-clés : question, achat dit (acheter, prix, lien), conseil, à faire (verbe en tête), achat devinée (pièces,
 * diamètre), sinon note. Le préfixe des données de test « ZZ TEST — » est ignoré (P11, P22).
 */
export function genreLocal(ligne: string, indices: { prix?: boolean; url?: boolean } = {}): GenreNote {
  const brut = sansPrefixeBanc(ligne);
  const n = normaliser(brut);
  const parEtiquette = genreDEtiquette(brut);
  if (parEtiquette) return parEtiquette;
  if (/\?\s*$/.test(brut.trim()) || /^(est ce|faut il|combien|pourquoi|quel|quelle|comment)\b/.test(n)) return 'question';
  if (indices.prix || indices.url || /\b(acheter|achat|achats|commander|commande|racheter|devis|prix|budget)\b/.test(n)) return 'a-acheter';
  if (/^(penser a|pense a|conseil|astuce|attention|eviter|ne pas)\b/.test(n) || /\bconseil\b/.test(n)) return 'conseil';
  const premier = n.split(' ')[0] ?? '';
  if (premier.length > 3 && /(er|ir|re)$/.test(premier) && !PAS_VERBES.has(premier)) return 'a-faire';
  if (PIECES.test(n) || DIAMETRE.test(brut)) return 'a-acheter';
  return 'note';
}

/* ---------- mise en forme (P4, P7, P11 : l'aperçu et le repli rangent une ligne propre, jamais la phrase brute) ---------- */

/** Le préfixe des données de test (L05). Il reste sur le message et le titre du carnet, jamais dans une ligne rangée. */
const PREFIXE_BANC = /^\s*ZZ TEST\s*[—–-]\s*/i;
export const sansPrefixeBanc = (t: string): string => t.replace(PREFIXE_BANC, '');
const majuscule = (t: string): string => (t ? t.charAt(0).toLocaleUpperCase('fr-CH') + t.slice(1) : t);

/** Les tournures qui annoncent un geste : « il faut appeler », « penser à commander » → « Appeler », « Commander » (infinitif en tête). */
const ANNONCE_GESTE = /^(?:il\s+faut\s+que\s+je\s+|il\s+faudrait\s+|il\s+faut\s+|faut\s+|je\s+dois\s+|on\s+doit\s+|je\s+vais\s+|penser\s+à\s+|pense\s+à\s+|ne\s+pas\s+oublier\s+de\s+|n[’']oublie\s+pas\s+de\s+)/i;

/** Une ligne mise en forme : sans préfixe de test, l'infinitif en tête quand une tournure l'annonce, une majuscule si elle a changé. */
export function mettreEnForme(ligne: string): string {
  const sans = sansPrefixeBanc(ligne).trim();
  const m = ANNONCE_GESTE.exec(sans);
  const reste = m ? sans.slice(m[0].length) : sans;
  const verbe = normaliser(reste).split(' ')[0] ?? '';
  const t = m && verbe.length > 3 && /(er|ir|re)$/.test(verbe) && !PAS_VERBES.has(verbe) ? reste : sans;
  return t === ligne.trim() ? t : majuscule(t);
}

/**
 * Le critère d'une ligne : la partie qui se mesure, sans titre ni préfixe (P4, G5). « ZZ TEST — Moulin à malt : 2 cylindres, 150 kg/h
 * minimum » → « 2 cylindres, 150 kg/h minimum » ; « buées au-dessus de la cuve, 1 200 m³/h » → « Buées au-dessus de la cuve : 1 200 m³/h ».
 * `seule` : la ligne est tout le message ; dans une note en vrac, le libellé « cave : » reste (il dit où ranger la ligne).
 */
export function critereDe(ligne: string, seule = true): string {
  const t = mettreEnForme(ligne);
  const deux = /^([^:]{2,60}?)\s*:\s*(.+)$/.exec(t);
  if (seule && deux && (/\d/.test(deux[2]) || MOTS_CRITERE.test(normaliser(deux[2])))) return deux[2].trim();
  const virgule = /^([^,:\d]{3,}?),\s*(\d[\d'’   .,]*\s?\S.*)$/.exec(t);
  if (virgule && quantitesDe(virgule[2]).length > 0) return `${majuscule(virgule[1].trim())} : ${virgule[2].trim()}`;
  return t;
}

/* ---------- critères tirés d'une phrase (critique 5, n° 2, 4, 24) ---------- */

/**
 * Le nom d'une caractéristique déduit de son unité (liste fermée du § État de l'art), quand la phrase ne le dit pas : « 150 kg/h » → débit.
 * Les unités de compte (bacs, becs, fûts) se nomment elles-mêmes. cm et mm n'ont pas de nom sûr (largeur, profondeur…) : la phrase doit le dire.
 */
const NOM_PAR_UNITE: Readonly<Record<string, string>> = {
  'm³/h': 'débit', 'kg/h': 'débit', 'L/min': 'débit', 'L/h': 'débit', kW: 'puissance', W: 'puissance', dB: 'bruit', bar: 'pression', L: 'volume',
  kg: 'poids', '°C': 'température', bacs: 'bacs', becs: 'becs', 'fûts': 'fûts'
};
const UNITES_DE_COMPTE = new Set(['bacs', 'becs', 'fûts']);
/** Les mots qui bordent le nom d'une caractéristique sans en faire partie (« il faudrait au moins … », « la porte du local fait … »). */
const BORDS = new Set([
  'le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd', 'a', 'au', 'aux', 'en', 'pour', 'avec', 'il', 'faut', 'faudrait', 'doit', 'doivent',
  'fait', 'font', 'fasse', 'mesure', 'avoir', 'ait', 'moins', 'plus', 'minimum', 'mini', 'min', 'maximum', 'maxi', 'max', 'pas', 'environ', 'env',
  'garder', 'tenir', 'maintenir', 'qui', 'que', 'soit', 'est', 'sont', 'et', 'ou', 'sur', 'dans', 'vers', 'tient', 'supporte', 'jusqu', 'il', 'on'
]);
const SEUIL_BAS = /\b(?:au plus|maximum|maxi|max|pas plus de|moins de|jusqu a)\b/;
const SEUIL_HAUT = /\b(?:au moins|minimum|mini|min|pas moins de|plus de)\b/;
const MOT_SEUIL = /\b(au moins|au plus|minimum|maximum|mini|maxi|min|max)\b/;
const MOINS_MIEUX = /bruit|prix|poids|consommation|oxygene|delai|encombrement/;
/** « tient 80 °C », « supporte 90 °C » : une caractéristique oui-non, nommée par la phrase (comme « tient 80 °C » des pages lues). */
const TIENT = /\b(?:tient|tenir|tiennent|supporte|supporter|resiste|resister)\s+(?:a\s+|jusqu'?\s?a\s+)?(\d+(?:[.,]\d+)?)\s?°\s?c\b/;

/** Un critère tiré des mots de la phrase : sa caractéristique (nom, unité, sens) quand la phrase la mesure. */
export interface CritereLu {
  texte: string;
  caracteristique?: { nom: string; unite?: string; sens: 'plus' | 'moins' | 'oui-non' };
  quantite?: Quantite;
}
/** Ce qu'une phrase dit de mesurable (`criteres`) et ce qui décrit une façon de faire, sans seuil (« 2 cylindres » : `facons`). */
export interface CriteresLus { criteres: CritereLu[]; facons: string[] }

const sansAccentsMin = (t: string): string => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const estBord = (mot: string): boolean => { const n = normaliser(mot); return n === '' || n.split(' ').every(m => BORDS.has(m)); };

/** Les mots avant le nombre, sans leurs bords : le nom de la caractéristique quand il tient en 1 à 4 mots ; sinon `undefined`. */
function nomAvant(avant: string): string | undefined {
  const mots = avant.trim().split(/\s+/).filter(Boolean);
  while (mots.length && estBord(mots[0])) mots.shift();
  while (mots.length && estBord(mots[mots.length - 1])) mots.pop();
  if (!mots.length || mots.length > 4 || !/\p{L}/u.test(mots.join(' '))) return undefined;
  const nom = mots.join(' ');
  return nom.charAt(0).toLowerCase() + nom.slice(1);
}

/**
 * Les critères d'une phrase, tirés de ses mots (§ État de l'art : motifs et liste fermée d'unités ; aucun nombre qui n'y soit pas). Le libellé
 * de tête (« Moulin à malt : … ») est le titre de l'idée, jamais un critère ; liens et prix (un article) sont masqués. Chaque morceau (entre
 * virgules) qui porte une quantité de la liste devient un critère : « fond de bac 38 cm minimum » → « Fond de bac 38 cm minimum » (fond de
 * bac, cm, plus) ; « 150 kg/h » → « Débit : 150 kg/h au moins » (débit, kg/h, plus). « tient 80 °C » → oui-non. Un compte sans unité de la
 * liste (« 2 cylindres ») décrit une façon, pas un seuil. Une phrase sans mesure : aucun critère (l'écran dit « l'IA le proposera »).
 */
export function extraireCriteres(texte: string): CriteresLus {
  const ligne = sansPrefixeBanc(texte).trim();
  const lib = /^([^:]{2,60}?)\s*:\s*(.+)$/.exec(ligne);
  const libelle = lib && /\p{L}/u.test(lib[1]) && !/(?:^|\s)https?$/i.test(lib[1].trim()) ? lib[1].trim() : undefined;
  const corps = libelle ? lib![2] : ligne;
  const masque = masquer(corps, [...urlsDe(corps), ...prixTousDe(corps)]);
  const criteres: CritereLu[] = [];
  const facons: string[] = [];
  const vus = new Set<string>();
  const garder = (k: CritereLu) => { const cle = normaliser(k.texte); if (cle && !vus.has(cle)) { vus.add(cle); criteres.push(k); } };
  for (const brut of masque.split(/[,;]/)) {
    const seg = brut.replace(/\s+/g, ' ').trim();
    if (!seg) continue;
    const bas = sansAccentsMin(seg);
    const tient = TIENT.exec(bas);
    if (tient) { const degres = nombreFr(Number(tient[1].replace(',', '.')), 1); garder({ texte: `Tient ${degres} °C`, caracteristique: { nom: `tient ${degres} °C`, sens: 'oui-non' } }); continue; }
    const q = quantitesDe(seg)[0];
    if (!q) {
      if (/^\d+\s+\p{L}[\p{L}-]{2,}$/u.test(seg)) facons.push(seg);
      /* tour 3, f4a (v1-neuf 1) : « Moulin à malt 2 cylindres, 150 kg/h » : le compte qui suit l'objet est une façon (comme « Moulin à
         malt : 2 cylindres ») ; un compte d'achat (« 2 pièces ») n'en est pas une */
      else {
        const queue = /\s(\d+\s+\p{L}[\p{L}-]{2,})$/u.exec(seg)?.[1];
        if (queue && !/^\d+\s+(?:pi[eè]ces?|pcs|sachets?|paquets?|bo[iî]tes?|sacs?|bidons?)$/iu.test(queue)) facons.push(queue);
      }
      continue;
    }
    const n = normaliser(seg);
    const avant = nomAvant(seg.slice(0, Math.max(0, seg.indexOf(q.texte))));
    const compte = UNITES_DE_COMPTE.has(q.unite);
    const nom = avant ?? NOM_PAR_UNITE[q.unite] ?? (libelle ? libelle.charAt(0).toLowerCase() + libelle.slice(1) : undefined);
    if (!nom) continue;
    const sens: 'plus' | 'moins' = SEUIL_BAS.test(n) ? 'moins' : SEUIL_HAUT.test(n) ? 'plus' : MOINS_MIEUX.test(normaliser(nom)) || q.unite === 'dB' ? 'moins' : 'plus';
    const mot = MOT_SEUIL.exec(n)?.[1];
    const seuil = mot ? ` ${/^min/.test(mot) ? 'minimum' : /^max/.test(mot) ? 'maximum' : mot}` : compte ? '' : sens === 'moins' ? ' au plus' : ' au moins';
    const valeur = `${q.texte} ${q.unite}${seuil}`;
    const t = avant && !compte ? `${avant} ${valeur}` : compte ? valeur : `${nom} : ${valeur}`;
    garder({ texte: majuscule(t), caracteristique: { nom, unite: q.unite, sens }, quantite: q });
  }
  return { criteres, facons };
}

const MOTS_CRITERE = /\b(minimum|maximum|mini|maxi|min|max|au moins|au plus|il faut|faut que|doit|doivent|pas plus de|pas moins de|tient|tenir|supporte|minimiser|maximiser|eviter)\b/;

export type SorteLocale = 'article' | 'critere' | 'note';

/** Une ligne analysée en local. `origine: 'locale'` : picto distinct du ✻ de l'IA (Q19). */
export interface LigneLocale {
  /** La ligne mise en forme (sans préfixe de test ; pour un critère, la partie mesurable seule : P4, P7). */
  texte: string;
  /** La ligne telle qu'il l'a tapée (le message la garde aussi, R25). */
  phrase: string;
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
export function analyserLigne(texte: string, seule = true): LigneLocale {
  const lien = urlsDe(texte)[0];
  const prix = prixDe(texte);
  const quantites = quantitesDe(texte);
  const genre = genreLocal(texte, { prix: !!prix, url: !!lien });
  const n = normaliser(texte);
  const sorte: SorteLocale = lien || prix ? 'article'
    : genre !== 'question' && genre !== 'a-acheter' && (MOTS_CRITERE.test(n) || (quantites.length > 0 && genre === 'note')) ? 'critere'
      : 'note';
  const forme = sorte === 'critere' ? critereDe(texte, seule) : mettreEnForme(texte);
  return {
    texte: forme, phrase: texte, sorte, genre, quantites, origine: 'locale',
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

const estAchat = (l: LigneLocale) => l.sorte === 'article' || l.genre === 'a-acheter';

/** Analyse d'un message entier : une ligne analysée par ligne découpée, les achats en tête (R35, tri stable). Instantané, sans réseau. */
export function analyserTexte(texte: string): LigneLocale[] {
  const lignes = decouper(texte);
  const analysees = lignes.map(l => analyserLigne(l, lignes.length === 1));
  return analysees.map((l, i) => [l, i] as const).sort(([a, i], [b, j]) => Number(estAchat(b)) - Number(estAchat(a)) || i - j).map(([l]) => l);
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
