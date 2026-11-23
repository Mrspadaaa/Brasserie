/**
 * Lecture des champs bruts de la fiche levure : niveaux (« Low to Medium »), plages (« 50 to 80 g/hl at ideally 18-26°C »),
 * POF, STA1, descripteurs d'arôme. Fonctions pures, sans données : la logique des comptes de la passe 4
 * (`work/missions/2026-11-09-ecran-levure/p2/c6a/comptes-p4.mjs`), reprise et testée.
 */

const normaliser = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();

const SANS_NIVEAU = /no info|no data|unknown|varies|non document|aucune? |not (?:documented|specified)|very low\s*[-–]\s*high|low\s*[-–]\s*high|slow\s*[-–]\s*very fast|^n\/?a$/;
const MOT_NIVEAU = /very[- ](?:low|slow)|très (?:faible|bas|lent)|very[- ](?:high|fast)|très (?:élevé|haut|rapide)|low|faible|slow|lent|niska|minimal|medium|moderate|moyen|normal|high|élev|haut|fast|rapide|strong/g;

const RANG_DU_MOT = (mot: string): number => {
  if (/^(?:very[- ](?:low|slow)|très (?:faible|bas|lent))$/.test(mot)) return 0;
  if (/^(?:very[- ](?:high|fast)|très (?:élevé|haut|rapide))$/.test(mot)) return 4;
  if (/^(?:low|faible|slow|lent|niska|minimal)$/.test(mot)) return 1;
  if (/^(?:medium|moderate|moyen|normal)$/.test(mot)) return 2;
  return 3;
};

/**
 * Niveau ordinal d'un texte : 0 très faible, 1 faible, 2 moyen, 3 élevé, 4 très élevé ; une étendue (« Low to Medium »)
 * donne la moyenne de ses bornes (1,5). `null` quand le texte ne dit pas de niveau (« No info », « Very Low - High », nombre seul).
 * Le texte entre parenthèses et après « ; » est un commentaire : il ne compte pas.
 */
export function rangNiveau(texte: string): number | null {
  const t = normaliser(texte).replace(/\([^)]*\)/g, ' ').split(/[;]/)[0];
  if (!t || SANS_NIVEAU.test(t)) return null;
  const mots = [...t.matchAll(MOT_NIVEAU)].map((m) => m[0]);
  if (!mots.length || mots.length > 2) return null;
  const rangs = mots.map(RANG_DU_MOT);
  return rangs.reduce((a, b) => a + b, 0) / rangs.length;
}

/**
 * Niveau d'un défaut (H₂S, SO₂) : « négatif », « non détectable », « none » disent l'absence (0), pas un niveau inconnu.
 * Sinon, comme `rangNiveau`.
 */
export function rangDefaut(texte: string): number | null {
  const t = normaliser(texte);
  if (/\b(?:négatif|negatif|negative|non détectable|not detect|none|absent|aucun|no h2s|no so2)\b/.test(t) && !/\blow\b|faible/.test(t)) return 0;
  return rangNiveau(texte);
}

export type Niveau3 = 'faible' | 'moyen' | 'eleve';
/** Un rang → l'un des trois niveaux publiés (Faible / Moyen / Élevé). */
export const niveauDuRang = (rang: number): Niveau3 => (rang <= 1.25 ? 'faible' : rang < 2.75 ? 'moyen' : 'eleve');
export const MOT_DU_NIVEAU: Record<Niveau3, string> = { faible: 'faible', moyen: 'moyen', eleve: 'élevé' };
export const RANG_DU_NIVEAU: Record<Niveau3, number> = { faible: 1, moyen: 2, eleve: 3 };

const nombre = (s: string) => parseFloat(s.replace(',', '.'));
/** Plage ou point dans un texte : « 18-26°C », « 73 à 77 % », « 10% ». `null` sans nombre. */
export function plageDuTexte(texte: string): [number, number] | null {
  const m = texte.match(/(\d+(?:[.,]\d+)?)\s*%?\s*(?:°\s*[CF])?\s*(?:[-–]|à|to)\s*(\d+(?:[.,]\d+)?)/);
  if (m) return [nombre(m[1]), nombre(m[2])];
  const s = texte.match(/(\d+(?:[.,]\d+)?)/);
  if (s) { const v = nombre(s[1]); return [v, v]; }
  return null;
}

/** POF d'un texte de fiche : 1 positif, 0 négatif, `null` quand la fiche ne dit rien (« No data », champ vide). */
export function statutPof(texte: string): 1 | 0 | null {
  const r = normaliser(texte);
  if (!r || /no (?:data|info)|non document|unknown|champ présent|sans valeur/.test(r)) return null;
  if (/^[–−-]$/.test(r) || /^pof\s*[-–−]$/.test(r)) return 0;
  if (r === '+' || /^pof\s*\+$/.test(r)) return 1;
  if (/\bnon\b|^no\b|negative|negatif|négatif|\bneg\b/.test(r)) return 0;
  if (/yes|posit|phenolic|phénolique/.test(r)) return 1;
  return null;
}

/** STA1 / diastaticus : 'pos' (risque de surcarbonatation), 'neg' (déclaré sans), `null` (non documenté). Un positif l'emporte. */
export function statutSta1(textes: string[]): 'pos' | 'neg' | null {
  let neg = false;
  for (const brut of textes) {
    const r = normaliser(brut);
    if (!r || /no (?:data|info)|unknown|non document/.test(r)) continue;
    if (/non[- ]diastatic|negative|negatif|négatif|^no\b|^non\b/.test(r)) neg = true;
    else if (/positive|positif|diastatic|^yes\b|contains brett/.test(r)) return 'pos';
  }
  return neg ? 'neg' : null;
}

// ─── Descripteurs : « estimé », jamais un niveau publié ─────────────────────────────────────────────────────────

const NEG_ESTERS = /\b(?:low|minimal|little|subtle|slight|less|without|no|very low|faible|peu)[ -]+(?:fruit|ester)/;
/** Négation élargie (hors passe 4) : « mild ester production » dit aussi peu d'esters. */
const NEG_ESTERS_LARGE = new RegExp(NEG_ESTERS.source.replace('|peu)', '|peu|mild)'), 'g');
const PLUS_ESTERS = /banan|isoamyl|fruit|estery|esters? (?:élev|high)|high esters|tropical|bubblegum|pear\b|apricot|peach|stone fruit|abricot|pêche|peche|poire/;
const MOINS_ESTERS = /very clean|ultra[- ]clean|neutral|cleanest|crisp, clean|clean, crisp|très neutre|tres neutre/;
const PLUS_PHENOLS = /clove|girofle|phenolic|phénolique|spic|épic|pepper|poivr|smok|\bfum[ée]/;
const MOINS_PHENOLS = /non-phenolic|non phenolic|no phenol|pof-|pof negative|phenol-free|produce any spic|no spic|won't produce any spic/;
const PLUS_THIOLS = /β-lyase|beta-lyase|thiol|irc7|high biotransformation|enhanced biotransformation/;
const PLUS_TERPENES = /terpen|geraniol|linalool|citronellol/;

/** Les mots de la fiche, en français, pour un axe d'arôme. Une table : jamais un mot que la fiche n'écrit pas. */
const MOTS_ESTERS: Array<[RegExp, string]> = [
  [/banan/, 'banane'], [/isoamyl/, 'acétate d’isoamyle'], [/tropical/, 'tropical'], [/apricot|abricot/, 'abricot'],
  [/peach|pêche|peche/, 'pêche'], [/citrus|agrume/, 'agrumes'], [/pear\b|poire/, 'poire'], [/bubblegum/, 'chewing-gum'], [/stone fruit/, 'fruits à noyau'],
  [/fruit|estery/, 'fruité'], [/esters? (?:élev|high)|high esters/, 'esters élevés']
];
const MOTS_PHENOLS: Array<[RegExp, string]> = [
  [/clove|girofle/, 'girofle'], [/pepper|poivr/, 'poivré'], [/smok|\bfum[ée]/, 'fumé'], [/spic|épic/, 'épicé'], [/phenolic|phénolique/, 'phénolique']
];
const GENERIQUES = new Set(['fruité', 'épicé', 'phénolique', 'esters élevés']);
/** Les mots trouvés ; un mot précis (banane, girofle…) remplace le générique qui l'englobe (fruité, épicé). */
const mots = (t: string, table: Array<[RegExp, string]>) => {
  const trouves = table.filter(([re]) => re.test(t)).map(([, m]) => m);
  const precis = trouves.filter((m) => !GENERIQUES.has(m));
  return precis.length ? precis : trouves;
};

export type SensDescripteur = 'plus' | 'moins' | null;
export interface DescripteurArome { sens: SensDescripteur; mots: string[] }

/** Lit un texte descriptif (nom, arômes, styles, faits d'arôme) pour un axe d'arôme. `sens` null : le texte n'en dit rien. */
/**
 * `passe4` : les règles exactes des comptes de la passe 4 (une négation « low fruit » annule tout le texte). Par défaut, un segment nié
 * (« low fruitness », « mild ester production ») est retiré avant de chercher un arôme : « very clean, low fruitness » lit « moins d'esters ».
 */
export function descripteurArome(axe: 'esters' | 'phenols' | 'thiols' | 'terpenes', texteBrut: string, passe4 = false): DescripteurArome {
  const t = normaliser(texteBrut);
  if (axe === 'esters') {
    if (passe4) {
      if (PLUS_ESTERS.test(t) && !NEG_ESTERS.test(t)) return { sens: 'plus', mots: mots(t, MOTS_ESTERS) };
      if (MOINS_ESTERS.test(t) && !/banan|isoamyl|fruit|estery|tropical/.test(t)) return { sens: 'moins', mots: ['neutre'] };
      return { sens: null, mots: [] };
    }
    const sansNegation = t.replace(NEG_ESTERS_LARGE, ' ');
    if (PLUS_ESTERS.test(sansNegation)) return { sens: 'plus', mots: mots(sansNegation, MOTS_ESTERS) };
    if (MOINS_ESTERS.test(t) || t.search(NEG_ESTERS_LARGE) >= 0) return { sens: 'moins', mots: ['neutre'] };
    return { sens: null, mots: [] };
  }
  if (axe === 'phenols') {
    const moins = MOINS_PHENOLS.test(t);
    if (moins) return { sens: 'moins', mots: ['sans phénols'] };
    if (PLUS_PHENOLS.test(t)) return { sens: 'plus', mots: mots(t, MOTS_PHENOLS) };
    return { sens: null, mots: [] };
  }
  if (axe === 'thiols') return PLUS_THIOLS.test(t) ? { sens: 'plus', mots: ['thiols'] } : { sens: null, mots: [] };
  return PLUS_TERPENES.test(t) ? { sens: 'plus', mots: ['terpènes'] } : { sens: null, mots: [] };
}

/** Sans alcool : levures à maltose négatif ou déclarées faible alcool. */
export const estSansAlcool = (texte: string) =>
  /maltose[- ]?neg|non[- ]alcoh|alcohol[- ]free|low[- ]alcohol|\bna\b|lona|zero hero|ne consomme ni maltose|maltose et maltotriose négatifs/i.test(texte);
