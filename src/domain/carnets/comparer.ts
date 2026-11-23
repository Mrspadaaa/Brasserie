/**
 * Carnet d'idées : comparer (R26, D-13, D-21, D-23, D-52 ; G8, G9, G20, G26). Calcul pur, local, sans IA.
 *
 * État de l'art (MISSION) : comparaison sans poids (CADRE) ; tri lexicographique par les caractéristiques des critères, dans l'ordre des
 * critères ; « moins bien partout » = dominé au sens de Pareto sur les valeurs connues des deux articles (au moins 2 caractéristiques
 * comparables, prix compris) ; `Array.prototype.sort` stable. Une valeur inconnue se range après les connues, jamais comme 0.
 */
import { parseDecimal } from '../../ui/numericInput';
import { quantitesDe, normaliser, type LigneLocale, type Quantite } from './analyseLocale';
import { nomArticle, sourceDuCritere, statutDe, type Article, type CarnetDoc, type Caracteristique, type Critere, type DonneesCarnet, type StatutCarnet, type Valeur } from './modele';

type Donnees = Pick<DonneesCarnet, 'criteres' | 'facons' | 'articles' | 'choix'>;
const donnees = (c: CarnetDoc | Donnees): Donnees => ('carnet' in c ? c.carnet : c);

/* ---------- article défini, pour des phrases justes (« le débit », « la profondeur ») ---------- */

const FEMININS = /(tion|sion|ure|ence|ance|ite|ee|ette|elle|ise|ade|ude|iere|eur)$/;
const MASCULINS_EN_EUR = /(teur|sseur|ceur)$/;
/** « le débit », « la cadence », « l'oxygène capté », « les bacs » ; une caractéristique oui-non (« tient 80 °C ») reste sans article. */
export function avecArticle(nom: string, sens?: Caracteristique['sens']): string {
  const n = nom.trim();
  if (sens === 'oui-non') return n;
  const mot = normaliser(n).split(' ')[0] ?? '';
  if (!mot) return n;
  const minuscule = n.charAt(0).toLowerCase() + n.slice(1);
  if (/^[aeiouyh]/.test(mot)) return `l'${minuscule}`;
  if (mot.length > 3 && /s$/.test(mot) && !/[adiou]s$/.test(mot)) return `les ${minuscule}`;
  const feminin = FEMININS.test(mot) && !MASCULINS_EN_EUR.test(mot);
  return `${feminin ? 'la' : 'le'} ${minuscule}`;
}

/** Tour 3, f11 (v7-1) : l'article des libellés « Comparer sur la température mini », « l’oxygène capté » (apostrophe typographique). */
export const avecArticleTypo = (nom: string): string => avecArticle(nom).replace(/^l'/, 'l’');

/* ---------- colonnes et valeurs ---------- */

/**
 * Une colonne : la caractéristique d'un critère (`critereId`, `critereTexte`), ou une valeur lue sur au moins 2 articles (`lue`, sens
 * 'texte' : montrée, jamais classée, car son sens n'est dit par aucun critère).
 */
export interface Colonne {
  nom: string; unite?: string; sens: Caracteristique['sens']; critereId?: string; critereTexte?: string; lue?: boolean;
  /** D'où vient le critère de la colonne (`sourceDuCritere`) : « proposé par l'IA » se dit dans Comparer sans relire le carnet. */
  critereSource?: 'phrase' | 'ia';
}
/** La colonne du prix (sens moins), comparée seulement entre prix connus de même devise. */
export const COLONNE_PRIX = 'prix';

/** Les caractéristiques des critères, dans l'ordre, sans doublon de nom. */
export function colonnesDe(c: CarnetDoc | Donnees): Colonne[] {
  const vues = new Set<string>();
  const sortie: Colonne[] = [];
  for (const k of donnees(c).criteres) {
    const car = k.caracteristique;
    if (!car || vues.has(normaliser(car.nom))) continue;
    vues.add(normaliser(car.nom));
    sortie.push({ nom: car.nom, ...(car.unite ? { unite: car.unite } : {}), sens: car.sens, critereId: k.id, critereTexte: k.texte, critereSource: sourceDuCritere(k) });
  }
  return sortie;
}

/**
 * Les valeurs lues sur au moins 2 articles (débit, °C…) qu'aucun critère ne porte encore : elles entrent en colonnes (P10), dans l'ordre
 * de leur première lecture, avec l'unité la plus lue. Sens 'texte' : affichées, pas classées (aucun critère ne dit si plus vaut mieux).
 */
export function colonnesLues(articles: readonly Article[], deja: readonly Colonne[]): Colonne[] {
  const vues = new Set(deja.map(k => normaliser(k.nom)));
  const comptes = new Map<string, { nom: string; n: number; unites: Map<string, number> }>();
  for (const a of articles) for (const [nom, v] of Object.entries(a.valeurs)) {
    const cle = normaliser(nom);
    if (!cle || vues.has(cle) || v === undefined || v.valeur === '') continue;
    const c = comptes.get(cle) ?? { nom, n: 0, unites: new Map<string, number>() };
    c.n += 1;
    const u = v.unite ?? '';
    c.unites.set(u, (c.unites.get(u) ?? 0) + 1);
    comptes.set(cle, c);
  }
  const sortie: Colonne[] = [];
  for (const c of comptes.values()) {
    if (c.n < 2) continue;
    const unite = [...c.unites.entries()].sort((x, y) => y[1] - x[1])[0]?.[0];
    sortie.push({ nom: c.nom, ...(unite ? { unite } : {}), sens: 'texte', lue: true });
  }
  return sortie;
}

/** Un lien dont la page n'est pas lue et dont rien n'est connu (ni prix, ni valeur) : il se relit, il ne se classe pas (P6). */
export function estARelire(a: Article): boolean {
  return a.lecture !== 'lue' && a.prixCentimes === undefined && Object.keys(a.valeurs).length === 0;
}

/** Les articles à relire d'un carnet (hors écartés), dans leur ordre d'arrivée. */
export function aRelireDe(c: CarnetDoc | Donnees): Article[] {
  const d = donnees(c);
  return d.articles.filter(a => estARelire(a) && raisonEcarte(d, a) === null);
}

/** La valeur que porte l'article lui-même ; absente si inconnue ou dans une autre unité (jamais convertie, jamais 0). */
function valeurPropre(a: Article, col: Pick<Colonne, 'nom' | 'unite'>): Valeur | undefined {
  const cle = Object.keys(a.valeurs).find(k => normaliser(k) === normaliser(col.nom));
  const v = cle ? a.valeurs[cle] : undefined;
  if (!v) return undefined;
  if (col.unite && v.unite && v.unite !== col.unite) return undefined;
  return v;
}

/**
 * Critique 6, n° 18 : l'état oui/non que porte sa façon (« ne tient pas 80 °C », pastille de la façon dans le carnet). L'article ne dit
 * rien de cette caractéristique, et tous les articles lus de la même façon qui la disent disent la même chose : la cellule prend cet
 * état, marqué `locale` (calcul local, d'après sa façon). Façon muette ou partagée : `undefined`, l'inconnu reste inconnu, jamais 0.
 */
export function valeurDeFacon(c: CarnetDoc | Donnees, a: Article, nom: string): Valeur | undefined {
  const d = donnees(c);
  /* la façon doit être une façon du carnet : c'est elle qui porte l'état (sa pastille), pas un identifiant orphelin */
  if (!a.faconId || !d.facons.some(f => f.id === a.faconId)) return undefined;
  const vus = d.articles
    .filter(x => x.id !== a.id && x.faconId === a.faconId && x.lecture === 'lue')
    .map(x => ordonnable(valeurPropre(x, { nom }), 'oui-non'))
    .filter((n): n is number => n !== null);
  if (!vus.length || vus.some(n => n !== vus[0])) return undefined;
  return { valeur: vus[0] === 1, origine: 'locale' };
}

/**
 * La valeur d'un article pour une colonne ; absente si inconnue ou dans une autre unité (jamais convertie, jamais 0). Avec le carnet et
 * une colonne oui-non, une valeur absente se lit sur sa façon (`valeurDeFacon`, critique 6 n° 18).
 */
export function valeurDe(a: Article, col: Pick<Colonne, 'nom' | 'unite'> & { sens?: Colonne['sens'] }, carnet?: CarnetDoc | Donnees): Valeur | undefined {
  const v = valeurPropre(a, col);
  if (v || !carnet || col.sens !== 'oui-non') return v;
  return valeurDeFacon(carnet, a, col.nom);
}

/** L'article avec, pour chaque colonne oui-non qu'il tait, l'état de sa façon (n° 18) ; le même objet si rien ne s'ajoute. */
function completeParFacon(d: Donnees, a: Article, colonnes: readonly Colonne[]): Article {
  let valeurs = a.valeurs;
  for (const k of colonnes) {
    if (k.sens !== 'oui-non' || valeurPropre(a, k)) continue;
    const v = valeurDeFacon(d, a, k.nom);
    if (v) valeurs = { ...valeurs, [k.nom]: v };
  }
  return valeurs === a.valeurs ? a : { ...a, valeurs };
}

/* ---------- libellé d'une caractéristique (critique 6, n° 7, L14) ---------- */

/** « ambiante » → « ambiance » : l'adjectif qui suit « température » devient le nom de ce qui est mesuré. */
const NOM_DE_L_ADJECTIF: Record<string, string> = { ambiante: 'ambiance', exterieure: 'extérieur', interieure: 'intérieur' };

/**
 * Le nom court d'une colonne, par sa caractéristique et jamais par l'unité seule : « température ambiante max » (°C) → « ambiance max »,
 * pour qu'un appareil de froid ne lise pas « 43 °C » mais « ambiance max 43 °C ». Un nom sans « température + adjectif » reste tel quel.
 */
export function libelleCaracteristique(nom: string): string {
  const n = nom.trim();
  const m = /^temp[ée]rature\s+(\S+)(.*)$/i.exec(n);
  if (!m) return n;
  const court = NOM_DE_L_ADJECTIF[normaliser(m[1])];
  return court ? `${court}${m[2]}` : n;
}

/** Valeur ordonnable : nombre pour plus/moins, booléen pour oui-non ; sinon `null` (inconnue ou non comparable). */
function ordonnable(v: Valeur | undefined, sens: Colonne['sens']): number | null {
  if (!v) return null;
  if (sens === 'oui-non') {
    if (typeof v.valeur === 'boolean') return v.valeur ? 1 : 0;
    if (typeof v.valeur === 'string') { const n = normaliser(v.valeur); return n === 'oui' ? 1 : n === 'non' ? 0 : null; }
    return null;
  }
  if (sens === 'plus' || sens === 'moins') return nombreDe(v.valeur);
  return null;
}

/** Un nombre, ou la chaîne qui n'est qu'un nombre (« 2000 » lu sur une page) ; jamais 0 par défaut. */
export function nombreDe(valeur: Valeur['valeur']): number | null {
  if (typeof valeur === 'number') return Number.isFinite(valeur) ? valeur : null;
  if (typeof valeur === 'string') return parseDecimal(valeur.trim());
  return null;
}

/**
 * « écarté : <raison> » (P41) : le nom se dit une fois, à côté (« Ventilateur de plafond 130 cm · écarté : brasse la buée sans la
 * sortir ») ; une raison qui commence déjà par « écarté » n'est pas doublée ; sans raison : « écarté ».
 */
export function libelleEcarte(raison: string): string {
  const r = raison.trim();
  if (!r) return 'écarté';
  return /^écartée?(\s|:|$)/i.test(r) || / écartée( |:|$)/.test(r) ? r : `écarté : ${r}`;
}
/** L'ancienne règle (raison « <façon> écartée : … »), gardée pour les raisons écrites avant la correction 4. */
function libelleEcarteAncien(raison: string): string {
  return / \u00e9cart\u00e9e( |:|$)/.test(raison) ? raison : `écarté : ${raison}`;
}

/** Comparaison sur une colonne : < 0 si a passe devant b. Inconnue après connue ; deux inconnues : égales. */
function comparerSur(a: number | null, b: number | null, sens: Colonne['sens']): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return sens === 'moins' ? a - b : b - a;
}

/* ---------- tableau ---------- */

export interface LigneTableau {
  articleId: string;
  nom: string;
  /** Rang parmi les non écartés (1 = en tête) ; `null` pour un écarté. */
  rang: number | null;
  /** Une cellule par colonne ; absente = inconnue (cellule vide, jamais 0). */
  cellules: Record<string, Valeur | undefined>;
  prixCentimes?: number;
  /** « dès » : le prix lu est un plancher (D419, A1 et B1) */
  prixDes?: true;
  devise?: string;
  /** Livraison (CRB-13) : ce que l'article porte déjà (dispo, vendeur, pays) ; absent = inconnu, jamais une valeur par défaut. */
  dispo?: string;
  vendeur?: string;
  pays?: string;
  /** L-23 : la photo lue sur la page (en-tête de sa colonne dans Comparer) ; absente si aucune. */
  photo?: string;
  /** Vrai seulement s'il est dominé par CHACUN des autres articles en lice (critique 5, n° 23). */
  moinsBienPartout: boolean;
  /** Le rang de l'article en lice qui le domine sur toutes les colonnes connues des deux (`moinsBienQue`) ; absent sinon. */
  moinsBienQue?: number;
  /** Écarté (façon écartée ou écarté au choix), avec sa raison : gardé à la fin (D-52). */
  ecarte?: { raison: string };
  /**
   * Critique 6 (doute D-122) : par nom de colonne, la valeur qui manque le seuil que vous avez écrit (dans le critère ou dans une note :
   * « il faudrait au moins 1 500 m³/h ») : « sous votre minimum » ou « au-dessus de votre maximum ». Absent si tout passe ou si rien
   * n'est su.
   */
  horsSeuil?: Record<string, string>;
  /** Écarté au moment du choix (et non par sa façon) : il compte parmi ceux entre lesquels il a choisi (`placesParmiTous`). */
  ecarteAuChoix?: true;
}

/**
 * Le tableau de Comparer. `colonnes` : celles des critères, puis les valeurs lues sur au moins 2 articles (`lue`). `lignes` : les articles
 * en lice, classés, puis les écartés. `aRelire` : les liens dont la page n'est pas lue et dont rien n'est connu, jamais classés (P6 ;
 * contrat lu par l'IA et le carnet). `rangePar` : la règle même du classement, en mots (« tient 80 °C d'abord, puis le débit, puis le
 * prix ») ; `null` si rien ne classe.
 */
export interface Tableau {
  colonnes: Colonne[]; lignes: LigneTableau[]; rangePar: string | null; aRelire: Article[];
  /** Critique 6, n° 19 : les caractéristiques qui rangent, dans l'ordre (« tient 80 °C », « le débit ») ; « le prix » s'il range seul. */
  rangeParNoms?: string[];
}

/**
 * La raison d'un article écarté : écarté au choix, sinon sa façon écartée ; `null` s'il ne l'est pas. Le nom de l'article se dit à côté
 * (P41) : la raison ne le répète pas. La façon se nomme seulement quand le nom de l'article ne la contient pas (« façon gravité, la
 * mousse monte »).
 */
function raisonEcarte(c: Donnees, a: Article): string | null {
  const auChoix = c.choix?.ecartes.find(e => e.articleId === a.id);
  if (auChoix) return auChoix.raison?.trim() || 'écarté';
  const facon = a.faconId ? c.facons.find(f => f.id === a.faconId) : undefined;
  if (facon?.etat !== 'ecartee') return null;
  const raison = facon.raison?.trim();
  const nomme = normaliser(nomArticle(a)).includes(normaliser(facon.nom));
  if (nomme) return raison || 'façon écartée';
  const facNom = facon.nom.charAt(0).toLowerCase() + facon.nom.slice(1);
  return raison ? `façon ${facNom}, ${raison}` : `façon ${facNom} écartée`;
}

/** Les clés de classement, dans l'ordre : les caractéristiques des critères (sens connu), puis le prix s'il départage (même devise). */
type Cle = { sorte: 'colonne'; colonne: Colonne } | { sorte: 'prix' };

/** Le prix classe s'il est connu sur au moins 2 articles en lice, tous dans la même devise ; sinon il ne dit rien de sûr. */
function prixClasse(enLice: readonly Article[]): boolean {
  const connus = enLice.filter(a => a.prixCentimes !== undefined && Number.isFinite(a.prixCentimes));
  return connus.length >= 2 && new Set(connus.map(a => a.devise ?? 'CHF')).size === 1;
}

function clesDe(colonnes: readonly Colonne[], enLice: readonly Article[]): Cle[] {
  const cles: Cle[] = colonnes.filter(k => k.critereId && k.sens !== 'texte').map(colonne => ({ sorte: 'colonne' as const, colonne }));
  if (prixClasse(enLice)) cles.push({ sorte: 'prix' });
  return cles;
}

/** L'ordre des articles en lice : lexicographique sur les clés (critères, puis prix croissant) ; inconnu après connu ; stable. */
function trier(articles: readonly Article[], cles: readonly Cle[]): Article[] {
  return [...articles].sort((a, b) => {
    for (const k of cles) {
      const d = k.sorte === 'prix'
        ? comparerSur(a.prixCentimes ?? null, b.prixCentimes ?? null, 'moins')
        : comparerSur(ordonnable(valeurDe(a, k.colonne), k.colonne.sens), ordonnable(valeurDe(b, k.colonne), k.colonne.sens), k.colonne.sens);
      if (d !== 0) return d;
    }
    return 0;
  });
}

/** La règle en mots, tirée des clés mêmes du tri : ce qu'affiche l'en-tête est ce qui classe (P32). */
function rangeParCles(cles: readonly Cle[]): string | null {
  const noms = cles.map(k => (k.sorte === 'prix' ? 'le prix' : avecArticle(k.colonne.nom, k.colonne.sens)));
  if (!noms.length) return null;
  return noms.length === 1 ? noms[0] : `${noms[0]} d'abord, ${noms.slice(1).map(n => `puis ${n}`).join(', ')}`;
}

const prixComparable = (a: Article, b: Article): boolean => a.prixCentimes !== undefined && b.prixCentimes !== undefined && (a.devise ?? 'CHF') === (b.devise ?? 'CHF');

/**
 * `a` est-il moins bien partout que `b` (dominé au sens de Pareto) ? Sur les caractéristiques comparables (connues des deux, sens plus,
 * moins, oui-non ; prix compris si même devise) : au moins 2, `b` au moins aussi bon partout et meilleur sur une.
 */
export function domine(a: Article, b: Article, colonnes: readonly Colonne[]): boolean {
  const ecarts: number[] = [];
  for (const k of colonnes) {
    if (k.sens === 'texte') {
      /* tour 3, f5b n° 10 : une colonne sans sens (le débit lu, pas encore un critère : 40 contre 25 L/min) où les deux diffèrent :
         rien ne dit qui y gagne, donc « moins bien … sur tout » serait faux */
      const ta = valeurDe(a, k), tb = valeurDe(b, k);
      if (ta && tb && normaliser(`${ta.valeur} ${ta.unite ?? ''}`) !== normaliser(`${tb.valeur} ${tb.unite ?? ''}`)) return false;
      continue;
    }
    const va = ordonnable(valeurDe(a, k), k.sens), vb = ordonnable(valeurDe(b, k), k.sens);
    if (va === null || vb === null) continue;
    ecarts.push(comparerSur(vb, va, k.sens)); /* < 0 : b meilleur */
  }
  if (prixComparable(a, b)) ecarts.push(b.prixCentimes! - a.prixCentimes!);
  return ecarts.length >= 2 && ecarts.every(e => e <= 0) && ecarts.some(e => e < 0);
}

/**
 * « moins bien partout » (critique 5, n° 23) : vrai seulement s'il est dominé par CHACUN des autres articles (non écartés) ; un article
 * moins cher que la 1re n'est jamais « moins bien partout ». Faux s'il est seul.
 */
export function moinsBienPartout(article: Article, autres: readonly Article[], colonnes: readonly Colonne[]): boolean {
  const vs = autres.filter(b => b.id !== article.id);
  return vs.length > 0 && vs.every(b => domine(article, b, colonnes));
}

/**
 * Critique 5, n° 23 : le rang (1 = en tête de `autres`, dans leur ordre) du premier article qui le domine sur toutes les colonnes connues
 * des deux (Pareto, prix compris ; inconnu n'est pas pire, il ne compte pas) ; `null` si aucun ne le domine. Texte : `texteMoinsBienQue`.
 */
export function moinsBienQue(article: Article, autres: readonly Article[], colonnes: readonly Colonne[]): number | null {
  const i = autres.findIndex(b => b.id !== article.id && domine(article, b, colonnes));
  return i < 0 ? null : i + 1;
}

/** « moins bien que la 3e sur tout » (critique 5, n° 23). */
export const texteMoinsBienQue = (rang: number): string => `moins bien que ${rang === 1 ? 'la 1re' : `la ${rang}e`} sur tout`;

/**
 * « tient 80 °C d'abord, puis le débit, puis le prix » : la règle même du tri de `tableau` (P32), prix compris quand il départage ;
 * `null` si rien ne classe.
 */
export function rangePar(c: CarnetDoc | Donnees): string | null {
  const d = donnees(c);
  const enLice = d.articles.filter(a => raisonEcarte(d, a) === null && !estARelire(a));
  return rangeParCles(clesDe(colonnesDe(d), enLice));
}

/** La forme courte d'un critère, pour le citer : la part après « : » (« Moins de condensation au plafond : capter la buée » → « capter la buée »). */
export function critereCourt(texte: string): string {
  const i = texte.lastIndexOf(' : ');
  return (i > 0 ? texte.slice(i + 3) : texte).trim();
}

/**
 * Critique 5, n° 22 (pour les lots B et C) : ce qui range, nommé, et les critères qui ne rangent pas faute de valeur mesurable.
 * - `texte` : `rangePar` (« tient 80 °C d'abord, puis le débit, puis le prix ») ; `null` si rien ne classe ;
 * - `critere` : le critère dont la caractéristique range en premier (id, texte, nom de la caractéristique) ; `prix` si seul le prix classe ;
 * - `sansValeur` : les critères placés avant lui (ou tous, si rien ne classe) qui n'ont pas de caractéristique mesurable ;
 * - `phrase` : « rangé par tient 80 °C ; « capter la buée » n'a pas de valeur mesurable » ; `null` si rien ne classe et rien à dire.
 */
export interface RangeParDetail {
  texte: string | null;
  critere: { id: string; texte: string; nom: string } | 'prix' | null;
  sansValeur: Array<{ id: string; texte: string; court: string }>;
  phrase: string | null;
}

export function rangeParDetail(c: CarnetDoc | Donnees): RangeParDetail {
  const d = donnees(c);
  const enLice = d.articles.filter(a => raisonEcarte(d, a) === null && !estARelire(a));
  const cles = clesDe(colonnesDe(d), enLice);
  const texte = rangeParCles(cles);
  const premiere = cles[0];
  const critere: RangeParDetail['critere'] = !premiere ? null : premiere.sorte === 'prix' ? 'prix'
    : { id: premiere.colonne.critereId!, texte: premiere.colonne.critereTexte ?? premiere.colonne.nom, nom: premiere.colonne.nom };
  const idx = critere && critere !== 'prix' ? d.criteres.findIndex(k => k.id === critere.id) : d.criteres.length;
  const sansValeur = d.criteres.slice(0, idx < 0 ? d.criteres.length : idx)
    .filter(k => !k.caracteristique || k.caracteristique.sens === 'texte')
    .map(k => ({ id: k.id, texte: k.texte, court: critereCourt(k.texte) }));
  const cites = sansValeur.map(k => `« ${k.court} »`);
  const dit = cites.length === 0 ? '' : cites.length === 1 ? `${cites[0]} n'a pas de valeur mesurable`
    : `${cites.slice(0, -1).join(', ')} et ${cites[cites.length - 1]} n'ont pas de valeur mesurable`;
  const tete = texte ? `rangé par ${premiere?.sorte === 'colonne' ? avecArticle(premiere.colonne.nom, premiere.colonne.sens) : 'le prix'}` : '';
  const phrase = [tete, dit].filter(Boolean).join(' ; ') || null;
  return { texte, critere, sansValeur, phrase };
}

/**
 * Le tableau de Comparer : absent à 0 ou 1 article, présent dès le 2e (G20). Écartés à la fin, avec leur raison (D-52). Un lien non lu
 * et sans valeur n'y entre pas : il va dans `aRelire` (P6).
 */
export function tableau(c: CarnetDoc | Donnees): Tableau | null {
  const d0 = donnees(c);
  if (d0.articles.length < 2) return null;
  const aRelire = aRelireDe(d0);
  const relire = new Set(aRelire.map(a => a.id));
  const criteres = colonnesDe(d0);
  /* n° 18 : une cellule oui-non muette prend l'état de sa façon, partout (tri, places, compromis, « moins bien que ») */
  const d: Donnees = { ...d0, articles: d0.articles.map(a => completeParFacon(d0, a, criteres)) };
  const ecartes = d.articles.filter(a => raisonEcarte(d, a) !== null);
  const libres = d.articles.filter(a => raisonEcarte(d, a) === null && !relire.has(a.id));
  const seuils = seuilsDe(c, d.criteres);
  const colonnes = [...criteres, ...colonnesLues([...libres, ...ecartes], criteres)];
  const cles = clesDe(criteres, libres);
  const enLice = trier(libres, cles);
  /* L4-4 : deux colonnes, deux lignes ou deux candidats de la bulle G8 ne se nomment jamais pareil */
  const ordre = [...enLice, ...ecartes];
  const noms = new Map(nomsDistincts(ordre).map((n, i) => [ordre[i].id, n]));
  const ligne = (a: Article, rang: number | null): LigneTableau => {
    const cellules: Record<string, Valeur | undefined> = {};
    for (const k of colonnes) { const v = valeurDe(a, k); if (v) cellules[k.nom] = v; }
    const raison = raisonEcarte(d, a);
    const dominant = rang !== null ? moinsBienQue(a, enLice, colonnes) : null;
    const hors: Record<string, string> = {};
    for (const s of seuils) {
      const v = ordonnable(cellules[s.colonne], s.sens);
      if (v === null) continue;
      /* tour 3, PCN-136 : le seuil s'écrit (« sous votre minimum de 1 500 m³/h ») */
      const u = colonnes.find(k => k.nom === s.colonne)?.unite;
      if (s.sens === 'plus' ? v < s.valeur : v > s.valeur) hors[s.colonne] = `${s.sens === 'plus' ? 'sous votre minimum' : 'au-dessus de votre maximum'} de ${nombreTexte(s.valeur)}${u ? ` ${u}` : ''}`;
    }
    return {
      articleId: a.id, nom: noms.get(a.id) ?? nomArticle(a), rang, cellules,
      ...(a.prixCentimes !== undefined ? { prixCentimes: a.prixCentimes } : {}), ...(a.prixDes ? { prixDes: true as const } : {}),
      ...(a.devise ? { devise: a.devise } : {}),
      ...(a.dispo ? { dispo: a.dispo } : {}), ...(a.vendeur ? { vendeur: a.vendeur } : {}), ...(a.pays ? { pays: a.pays } : {}),
      ...(a.photo ? { photo: a.photo } : {}),
      moinsBienPartout: rang !== null && moinsBienPartout(a, enLice, colonnes),
      ...(dominant !== null ? { moinsBienQue: dominant } : {}),
      ...(raison !== null ? { ecarte: { raison } } : {}),
      ...(d.choix?.ecartes.some(e => e.articleId === a.id) ? { ecarteAuChoix: true as const } : {}),
      ...(Object.keys(hors).length ? { horsSeuil: hors } : {})
    };
  };
  const rangeParNoms = cles.some(k => k.sorte === 'colonne')
    ? cles.flatMap(k => (k.sorte === 'colonne' ? [avecArticle(k.colonne.nom, k.colonne.sens)] : []))
    : cles.length ? ['le prix'] : [];
  return { colonnes, lignes: [...enLice.map((a, i) => ligne(a, i + 1)), ...ecartes.map(a => ligne(a, null))], rangePar: rangeParCles(cles), aRelire, rangeParNoms };
}

/**
 * CRB-5 : le rang qui se montre. Sans critère ni prix pour classer (`rangePar` nul), l'ordre des articles n'est que celui de leur arrivée :
 * un « 1 » en pastille verte dirait « le meilleur » sans rien qui le justifie. Le rang de la ligne (`rang`, qui dit « en lice ») reste ;
 * ce qui s'affiche vaut `null` tant que rien ne classe, et pour un écarté.
 */
export function rangVisible(t: Pick<Tableau, 'rangePar'>, l: Pick<LigneTableau, 'rang' | 'ecarte'>): number | null {
  return t.rangePar !== null && l.rang !== null && !l.ecarte ? l.rang : null;
}

/**
 * CRB-14 : l'ordre des lignes de Comparer, celui de sa décision. Le prix d'abord (0), ce qui classe (1), le volume (2), les dimensions
 * extérieures puis intérieures (3), la porte (4), la livraison : dispo, vendeur, pays (5), le reste du groupe dans l'ordre de la page (6),
 * la couleur en bas (7). Le tri est stable : deux lignes du même rang gardent l'ordre où le tableau les donne.
 */
export const LIGNE_PRIX = 0, LIGNE_CRITERE = 1, LIGNE_VOLUME = 2, LIGNE_DIMENSIONS = 3, LIGNE_PORTE = 4, LIGNE_LIVRAISON = 5, LIGNE_GROUPE = 6, LIGNE_COULEUR = 7;
export function groupeDeLigne(nom: string, critere = false): number {
  const n = normaliser(nom);
  if (n === COLONNE_PRIX) return LIGNE_PRIX;
  if (critere) return LIGNE_CRITERE;
  if (/\b(couleur|coloris|teinte)\b/.test(n)) return LIGNE_COULEUR;
  if (/\bporte\b/.test(n)) return LIGNE_PORTE;
  if (/\b(volume|capacite|contenance)\b/.test(n)) return LIGNE_VOLUME;
  if (/\b(dimensions?|largeur|profondeur|longueur|hauteur|encombrement)\b/.test(n)) return LIGNE_DIMENSIONS;
  if (/\b(dispo|disponibilite|vendeur|pays|livraison|delai)\b/.test(n)) return LIGNE_LIVRAISON;
  return LIGNE_GROUPE;
}

/* ---------- seuils écrits par lui : dans le critère, sinon dans une note (critique 6, doute D-122) ---------- */

type NoteLue = { texte: string };
const notesDe = (c: CarnetDoc | Donnees): NoteLue[] => {
  const n = 'carnet' in c ? c.carnet.notes : (c as { notes?: unknown }).notes;
  return Array.isArray(n) ? n.filter((x): x is NoteLue => !!x && typeof (x as NoteLue).texte === 'string') : [];
};
const MOTS_MINIMUM = /(au moins|minimum|pas moins de|\bmin\b)/i;
const MOTS_MAXIMUM = /(au plus|maximum|pas plus de|\bmax\b)/i;

/**
 * Le seuil d'un critère chiffré : écrit dans le critère (`seuilDe`), sinon dans une note du carnet qui le borne, dans l'unité de sa
 * caractéristique (« il faudrait au moins 1 500 m³/h » : minimum d'un critère « plus » en m³/h). `null` si rien ne le dit. Le nombre
 * vient de son texte, jamais d'ailleurs.
 */
export function seuilDuCarnet(c: CarnetDoc | Donnees, k: Critere): (Quantite & { source: 'critere' | 'note' }) | null {
  const car = k.caracteristique;
  if (!car || (car.sens !== 'plus' && car.sens !== 'moins')) return null;
  const s = seuilDe(k);
  if (s) return { ...s, source: 'critere' };
  if (!car.unite) return null;
  const mots = car.sens === 'plus' ? MOTS_MINIMUM : MOTS_MAXIMUM;
  for (const n of notesDe(c)) {
    if (!mots.test(n.texte)) continue;
    const q = quantitesDe(n.texte).find(x => x.unite === car.unite);
    if (q) return { ...q, source: 'note' };
  }
  return null;
}

function seuilsDe(c: CarnetDoc | Donnees, criteres: readonly Critere[]): Array<{ colonne: string; sens: 'plus' | 'moins'; valeur: number }> {
  const sortie: Array<{ colonne: string; sens: 'plus' | 'moins'; valeur: number }> = [];
  for (const k of criteres) {
    const car = k.caracteristique;
    if (!car || (car.sens !== 'plus' && car.sens !== 'moins')) continue;
    const s = seuilDuCarnet(c, k);
    if (s && !sortie.some(x => normaliser(x.colonne) === normaliser(car.nom))) sortie.push({ colonne: car.nom, sens: car.sens, valeur: s.valeur });
  }
  return sortie;
}

/* ---------- places, compromis, pourquoi (P14, P16, P17) : calcul local, chaque nombre vient du tableau ---------- */

/** « 1 800 », « 2,5 » : un nombre lisible (espace avant les milliers) ; une chaîne reste telle quelle ; un booléen : « oui » ou « non ». */
export function nombreTexte(v: Valeur['valeur'] | number): string {
  if (typeof v === 'boolean') return v ? 'oui' : 'non';
  if (typeof v === 'string') { const n = nombreDe(v); return n === null ? v.trim() : nombreTexte(n); }
  if (!Number.isFinite(v)) return '';
  const [e, dec] = String(Math.abs(v)).split('.');
  const groupe = e.length > 3 ? e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : e;
  return `${v < 0 ? '−' : ''}${groupe}${dec ? `,${dec}` : ''}`;
}

/** « 2 600 CHF » ; `null` si le prix est inconnu (jamais 0). */
export function prixTexte(centimes: number | undefined, devise?: string): string | null {
  if (centimes === undefined || !Number.isFinite(centimes)) return null;
  const f = centimes / 100;
  return `${nombreTexte(Number.isInteger(f) ? f : Math.round(f * 100) / 100)} ${devise ?? 'CHF'}`;
}

/** La place d'un article sur une colonne (ou le prix), parmi les articles en lice dont la valeur est connue. */
export interface Place {
  /** Nom de la colonne (« débit », « prix »). */
  nom: string;
  unite?: string;
  sens: Colonne['sens'];
  /** La valeur dite (« 1 800 m³/h », « 2 600 CHF », « oui »). */
  texte: string;
  /** Rang (1 = le meilleur) ; absent si la colonne ne classe pas (sens texte) ou si la valeur est inconnue. */
  rang?: number;
  exAequo?: boolean;
  /** Critique 6, n° 6 : le nombre d'articles qui partagent la valeur (ex aequo) ; « 1er sur 2 ex aequo » se compte sur eux seuls. */
  partage?: number;
  /** Critique 6, n° 19 : le rang sur cette colonne, dit avec son nom : « 3e pour le débit », « 1er ex aequo pour tient 80 °C ». */
  rangColonne?: string;
  /** Critique 6, n° 7 : le nom court de la caractéristique (« ambiance max » pour « température ambiante max »). */
  libelle?: string;
  /** Le nombre d'articles en lice dont la valeur est connue. */
  sur: number;
  /** Pour la réglette : la valeur, la meilleure et la pire connues, et toutes les valeurs connues (rangs). */
  valeur?: number;
  meilleure?: number;
  pire?: number;
  toutes?: number[];
  critere: boolean;
}

function lignesEnLice(t: Tableau): LigneTableau[] { return t.lignes.filter(l => l.rang !== null); }

/** Le nombre ordonnable d'une cellule (oui = 1, non = 0) ; `null` si inconnue. */
function nombreCellule(l: LigneTableau, k: Colonne): number | null {
  return ordonnable(l.cellules[k.nom], k.sens === 'texte' ? 'plus' : k.sens);
}

function placeSur(lignes: readonly LigneTableau[], tous: boolean, l: LigneTableau, nom: string, unite: string | undefined, sens: Colonne['sens'], lire: (x: LigneTableau) => number | null, texte: string | null, critere: boolean): Place | null {
  if (texte === null) return null;
  const connues = lignes.map(lire).filter((n): n is number => n !== null);
  const v = lire(l);
  const libelle = nom === 'prix' ? 'prix' : libelleCaracteristique(nom);
  const base: Place = { nom, ...(unite ? { unite } : {}), sens, texte, sur: connues.length, critere, ...(libelle !== nom ? { libelle } : {}) };
  if (v === null || sens === 'texte' || (!tous && l.rang === null)) return base;
  const mieux = (a: number, b: number) => (sens === 'moins' ? a < b : a > b);
  const rang = 1 + connues.filter(x => mieux(x, v)).length;
  /* n° 6 : l'ex aequo se compte sur les seuls articles qui partagent la valeur (« 1er sur 2 ex aequo »), jamais sur tous les connus */
  const partage = connues.filter(x => x === v).length;
  const exAequo = partage > 1;
  const meilleure = sens === 'moins' ? Math.min(...connues) : Math.max(...connues);
  const pire = sens === 'moins' ? Math.max(...connues) : Math.min(...connues);
  const rangColonne = `${ordinal(rang)}${exAequo ? ' ex aequo' : ''} pour ${nom === 'prix' ? 'le prix' : avecArticle(libelle, sens)}`;
  return { ...base, rang, ...(exAequo ? { exAequo, partage } : {}), rangColonne, valeur: v, meilleure, pire, toutes: connues };
}

function placesSelon(t: Tableau, articleId: string, tous: boolean): Place[] {
  const l = t.lignes.find(x => x.articleId === articleId);
  if (!l) return [];
  const lignes = tous ? t.lignes.filter(x => x.rang !== null || x.ecarteAuChoix) : lignesEnLice(t);
  const sortie: Place[] = [];
  const devise = t.lignes.find(x => x.devise)?.devise ?? 'CHF';
  const deCol = (k: Colonne) => {
    const v = l.cellules[k.nom];
    const texte = v ? `${nombreTexte(v.valeur)}${v.unite && typeof v.valeur !== 'boolean' ? ` ${v.unite}` : ''}` : null;
    return placeSur(lignes, tous, l, k.nom, k.unite, k.sens, x => nombreCellule(x, k), texte, !!k.critereId);
  };
  for (const k of t.colonnes.filter(x => x.critereId)) { const p = deCol(k); if (p) sortie.push(p); }
  const prix = placeSur(lignes, tous, l, 'prix', devise, 'moins', x => x.prixCentimes ?? null, prixTexte(l.prixCentimes, l.devise), false);
  if (prix) sortie.push(prix);
  for (const k of t.colonnes.filter(x => !x.critereId)) { const p = deCol(k); if (p) sortie.push(p); }
  return sortie;
}

/**
 * Les places d'un article parmi les articles en lice : chaque colonne connue (critères, valeurs lues), et le prix ; dans l'ordre de
 * Comparer (critères, prix, lues). Même tableau que Comparer, donc même rang (n° 6). `rangColonne` dit le rang d'une colonne avec son nom
 * (« 3e pour le débit », n° 19) ; le rang général se lit par `rangGeneral`.
 */
export function placesDe(t: Tableau, articleId: string): Place[] {
  return placesSelon(t, articleId, false);
}

/**
 * Les places d'un article parmi ceux entre lesquels il a choisi : les articles en lice et les écartés au choix (g05-11, « 1er sur 5 » :
 * le choix revu se mesure à ce qu'il a départagé, même quand le choix a écarté les autres). Un article d'une façon écartée n'y est pas :
 * il répond à une autre façon de faire.
 */
export function placesParmiTous(t: Tableau, articleId: string): Place[] {
  return placesSelon(t, articleId, true);
}

/**
 * Critique 6, n° 19 : le seul rang général d'un article, nommé : « 2e sur 4, rangé par tient 80 °C puis le débit ». `null` pour un écarté
 * ou un article hors du tableau. Le rang d'une colonne, lui, se dit « 3e pour le débit » (`Place.rangColonne`).
 */
export function rangGeneral(t: Tableau, articleId: string): string | null {
  const l = t.lignes.find(x => x.articleId === articleId);
  if (!l || l.rang === null) return null;
  const n = lignesEnLice(t).length;
  const noms = t.rangeParNoms ?? [];
  return `${ordinal(l.rang)} sur ${n}${noms.length ? `, rangé par ${noms.join(' puis ')}` : ''}`;
}

const rangF = (n: number) => (n === 1 ? 'la 1re' : `la ${n}e`);
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);


/**
 * Le compromis, calculé sur le tableau (P14, g01-8 « Compromis : la 1re, … ») quand l'IA n'en a pas dit. Parmi les articles en lice qui
 * tiennent les mêmes critères oui-non que la 1re et coûtent moins, celui qui perd le moins sur le premier critère chiffré : « la 2e,
 * 1 450 CHF, soit 1 150 CHF de moins que la 1re ; le débit 1 200 m³/h au lieu de 1 800 m³/h ». Aucun moins cher : la 1re, et pourquoi.
 * Rien d'inventé : chaque valeur vient du tableau ; `null` à moins de 2 articles en lice.
 */
export function compromisDe(t: Tableau | null): string | null {
  if (!t) return null;
  const L = lignesEnLice(t);
  if (L.length < 2) return null;
  const premier = L[0];
  const criteres = t.colonnes.filter(k => k.critereId && k.sens !== 'texte');
  const ouiNon = criteres.filter(k => k.sens === 'oui-non');
  const chiffre = criteres.find(k => k.sens === 'plus' || k.sens === 'moins');
  const memeDevise = (x: LigneTableau) => (x.devise ?? 'CHF') === (premier.devise ?? 'CHF');
  const p1 = premier.prixCentimes;
  const unite = (k: Colonne) => (k.unite ? ` ${k.unite}` : '');
  const val = (x: LigneTableau, k: Colonne) => { const v = x.cellules[k.nom]; return v ? `${nombreTexte(v.valeur)}${unite(k)}` : null; };
  if (p1 !== undefined) {
    /* tour 3, PCN-106 : jamais une proposition sous son minimum (ou au-dessus de son maximum) */
    const candidats = L.slice(1).filter(x => !x.horsSeuil && x.prixCentimes !== undefined && memeDevise(x) && x.prixCentimes < p1
      && ouiNon.every(k => nombreCellule(x, k) !== null && nombreCellule(x, k) === nombreCellule(premier, k)));
    if (candidats.length) {
      const perte = (x: LigneTableau) => {
        if (!chiffre) return 0;
        const a = nombreCellule(x, chiffre), b = nombreCellule(premier, chiffre);
        return a === null || b === null ? Number.POSITIVE_INFINITY : Math.abs(a - b);
      };
      const c = [...candidats].sort((x, y) => perte(x) - perte(y) || x.prixCentimes! - y.prixCentimes!)[0];
      const parts = [`${rangF(c.rang!)}, ${prixTexte(c.prixCentimes, c.devise)}, soit ${prixTexte(p1 - c.prixCentimes!, c.devise)} de moins que la 1re`];
      if (chiffre) {
        const vc = val(c, chiffre), v1 = val(premier, chiffre);
        if (vc && v1 && vc !== v1) parts.push(`${avecArticle(chiffre.nom, chiffre.sens)} ${vc} au lieu de ${v1}`);
        else if (vc && v1) parts.push(`${avecArticle(chiffre.nom, chiffre.sens)} ${vc}, comme la 1re`);
      }
      for (const k of ouiNon) parts.push(`${k.nom} : ${nombreTexte(nombreCellule(c, k) === 1)}, comme la 1re`);
      return parts.join(' ; ');
    }
  }
  /* tour 3, PCN-106 (g01-8) : la 1re seule à tenir un critère oui-non dit sa raison et son écart, sans aligner les valeurs */
  const seuls = ouiNon.filter(k => nombreCellule(premier, k) === 1 && L.slice(1).every(x => !!x.horsSeuil || nombreCellule(x, k) !== 1));
  if (seuls.length) {
    const d2 = L[1];
    const ecart = p1 !== undefined && d2.prixCentimes !== undefined && memeDevise(d2) ? d2.prixCentimes - p1 : null;
    const tx = ecart === null || ecart === 0 ? '' : ecart < 0 ? `, pour ${prixTexte(-ecart, premier.devise)} de plus que la 2e` : `, et ${prixTexte(ecart, premier.devise)} de moins que la 2e`;
    /* un article qui tient aussi ce critère mais hors de son seuil : « la seule » dit aussi le seuil, sinon la phrase contredit le tableau */
    const horsTenants = L.slice(1).filter(x => !!x.horsSeuil && seuls.some(k => nombreCellule(x, k) === 1));
    const seuil = !horsTenants.length ? '' : horsTenants.some(x => Object.values(x.horsSeuil!).some(v => /maximum/.test(v))) ? ' et votre maximum' : ' et votre minimum';
    return `la 1re, la seule ${seuls.map(k => aFaire(k.nom)).join(' et ')}${seuil}${tx}`;
  }
  /* aucun moins cher qui tienne les mêmes critères : la 1re, avec ce qui la met devant */
  const dits: string[] = [];
  for (const k of criteres) { const v = val(premier, k); if (v) dits.push(k.sens === 'oui-non' ? `${k.nom} : ${v}` : `${avecArticle(k.nom, k.sens)} ${v}`); }
  const prix = prixTexte(p1, premier.devise);
  const deuxieme = L[1];
  if (prix) {
    const autres = L.slice(1).filter(x => x.prixCentimes !== undefined && memeDevise(x));
    const moinsCher = autres.length > 0 && autres.every(x => x.prixCentimes! >= p1!);
    dits.push(moinsCher ? `${prix}, la moins chère` : prix);
  } else dits.push('prix non lu');
  if (!criteres.length && deuxieme) {
    /* rangé par le prix seul : la 1re est la moins chère ; les valeurs lues se citent, sans jugement (leur sens n'est dit par aucun critère) */
    const ecart = p1 !== undefined && deuxieme.prixCentimes !== undefined && memeDevise(deuxieme) ? prixTexte(deuxieme.prixCentimes - p1, premier.devise) : null;
    if (ecart) dits.push(`${ecart} de moins que la 2e`);
    for (const k of t.colonnes.filter(x => x.lue)) {
      const a = val(premier, k), b = val(deuxieme, k);
      if (a && b && a !== b) dits.push(/^(oui|non)$/.test(a) ? `${k.nom} : ${a} contre ${b}` : `${avecArticle(k.nom)} ${a} contre ${b}`);
    }
  }
  return `la 1re, ${dits.join(' ; ')}`;
}

/** « tient 80 °C » → « à tenir 80 °C » ; « passe la porte » → « à passer la porte » ; un état (« stable sur une heure ») → « à être … ». */
const INFINITIFS: Record<string, string> = {
  tient: 'tenir', passe: 'passer', aspire: 'aspirer', capte: 'capter', sort: 'sortir', resiste: 'résister', supporte: 'supporter',
  entre: 'entrer', rentre: 'rentrer', garde: 'garder', fait: 'faire', a: 'avoir', est: 'être', monte: 'monter', chauffe: 'chauffer'
};
function aFaire(nom: string): string {
  const m = /^(\S+)(.*)$/.exec(nom.trim());
  if (!m) return `à être ${nom.trim()}`;
  const inf = INFINITIFS[normaliser(m[1])];
  return inf ? `à ${inf}${m[2]}` : `à être ${nom.trim()}`;
}

/** « le plus gros débit », « le moins d'oxygène capté », « la cadence la plus haute », « l'ambiance max la plus haute ». */
function superlatif(k: Colonne): string {
  const nom = libelleCaracteristique(k.nom);
  const n = normaliser(nom);
  if (/^debit/.test(n)) return `le plus ${k.sens === 'plus' ? 'gros' : 'petit'} ${nom}`;
  if (/^precision/.test(n)) return 'la meilleure précision';
  if (k.sens === 'moins') return `le moins ${/^[aeiouyh]/.test(n) ? "d'" : 'de '}${nom}`;
  const art = avecArticle(nom, k.sens);
  if (art.startsWith('les ')) return `le plus de ${nom}`;
  const mot = n.split(' ')[0] ?? '';
  const feminin = art.startsWith('la ') || (art.startsWith("l'") && FEMININS.test(mot) && !MASCULINS_EN_EUR.test(mot));
  return `${art} ${feminin ? 'la plus haute' : 'le plus haut'}`;
}

/**
 * Critique 6, n° 21 (D-13, D-20) : le problème que l'article règle, en mots, sans recopier les chiffres (ils sont dans le tableau et sur
 * les réglettes) : « la seule à tenir 80 °C », ou « le plus gros débit des deux à tenir 80 °C ». Calcul sur le tableau : les critères oui-non qu'il tient
 * resserrent le groupe ; seule du groupe : « la seule à … » ; sinon la meilleure du groupe sur le premier critère chiffré : « … avec le
 * plus gros débit » ; puis le prix s'il départage (« la moins chère », « moins chère que la 1re »). En lice : parmi les articles en
 * lice ; choix revu (lui seul en lice) : parmi tous ceux du tableau, écartés compris. `null` si rien ne le distingue.
 */
const COMPTE_EN_LETTRES: Record<number, string> = { 2: 'deux', 3: 'trois', 4: 'quatre', 5: 'cinq', 6: 'six', 7: 'sept', 8: 'huit', 9: 'neuf', 10: 'dix' };
function problemeRegle(t: Tableau, l: LigneTableau): string | null {
  const enLice = lignesEnLice(t);
  const pool = l.rang !== null && enLice.length >= 2 ? enLice : t.lignes.filter(x => x.rang !== null || x.ecarteAuChoix);
  if (pool.length < 2) return null;
  const criteres = t.colonnes.filter(k => k.critereId && k.sens !== 'texte');
  let groupe = pool;
  const tenus: string[] = [];
  for (const k of criteres.filter(x => x.sens === 'oui-non')) {
    if (nombreCellule(l, k) !== 1) continue;
    tenus.push(k.nom);
    groupe = groupe.filter(x => nombreCellule(x, k) === 1);
  }
  const morceaux: string[] = [];
  const faire = tenus.map(aFaire).join(' et ');
  const chiffre = criteres.find(k => (k.sens === 'plus' || k.sens === 'moins') && nombreCellule(l, k) !== null);
  let sup: string | null = null;
  let egal = false;
  if (chiffre) {
    const v = nombreCellule(l, chiffre)!;
    const autres = groupe.filter(x => x.articleId !== l.articleId).map(x => nombreCellule(x, chiffre)).filter((n): n is number => n !== null);
    if (autres.length && !autres.some(x => (chiffre.sens === 'moins' ? x < v : x > v))) { sup = superlatif(chiffre); egal = autres.includes(v); }
  }
  const p = l.prixCentimes;
  const memes = groupe.filter(x => x.articleId !== l.articleId && x.prixCentimes !== undefined && (x.devise ?? 'CHF') === (l.devise ?? 'CHF'));
  const moinsChere = p !== undefined && memes.length > 0 && memes.every(x => x.prixCentimes! > p);
  let prixDit = false;
  if (tenus.length && groupe.length === 1) morceaux.push(`la seule ${faire}`);
  /* Critique 7, n° 6 : plusieurs tiennent le critère (« 1er sur 2 ex aequo ») ; jamais « la seule », le nombre vient du groupe présent. */
  else if (tenus.length && sup && !egal) morceaux.push(`${sup} des ${COMPTE_EN_LETTRES[groupe.length] ?? groupe.length} ${faire}`);
  else if (tenus.length && sup) morceaux.push(`${tenus.join(' et ')}, avec ${sup} ex aequo`);
  else if (tenus.length && moinsChere) { morceaux.push(`la moins chère qui ${tenus.join(' et ')}`); prixDit = true; }
  else if (tenus.length) morceaux.push(tenus.join(' et '));
  else if (sup) morceaux.push(egal ? `${sup}, ex aequo` : sup);
  if (!prixDit && p !== undefined) {
    const premier = enLice[0];
    if (moinsChere) morceaux.push(morceaux.length ? 'et la moins chère' : 'la moins chère');
    else if (l.rang !== null && l.rang > 1 && premier?.prixCentimes !== undefined && premier.prixCentimes > p) morceaux.push('moins chère que la 1re');
  }
  return morceaux.length ? morceaux.join(', ') : null;
}

/**
 * Le pourquoi proposé à Choisir (P16) et redit sous « Pourquoi ce choix » (P17). Critique 6, n° 21 : il dit le problème réglé, pas les
 * chiffres : « Le plus gros débit des deux à tenir 80 °C ; en stock, Inox Broye (CH). » Modifiable par lui ; `null` si rien n'est
 * à dire.
 */
export function pourquoiDe(c: CarnetDoc | Donnees, articleId: string): string | null {
  const d = donnees(c);
  const t = tableau(c);
  const a = d.articles.find(x => x.id === articleId);
  if (!a) return null;
  const parts: string[] = [];
  const l = t?.lignes.find(x => x.articleId === articleId);
  const regle = t && l ? problemeRegle(t, l) : null;
  if (regle) parts.push(regle);
  const chez = [a.dispo, a.vendeur ? `${a.vendeur}${a.pays ? ` (${a.pays})` : ''}` : null].filter(Boolean).join(', ');
  if (chez) parts.push(chez);
  if (!parts.length) return null;
  return `${majuscule(parts.join(' ; '))}.`;
}

/**
 * Tour 3, PCN-164 : d'où viennent les valeurs comparées. Un article sans lien vient de sa phrase ; un lien lu, de la page du vendeur.
 */
export function mentionValeurs(articles: readonly Pick<Article, 'url' | 'lecture'>[]): string {
  const vous = articles.some(a => !a.url), vendeurs = articles.some(a => !!a.url && a.lecture === 'lue');
  return vous && vendeurs ? 'Valeurs annoncées par les vendeurs ou écrites par vous' : vous ? 'Valeurs écrites par vous' : 'Valeurs annoncées par les vendeurs';
}

/** Statut après un dépôt : Choisi reste Choisi ; sinon d'après le contenu (Idée → À comparer au 1er article). */
export function statutApres(avant: StatutCarnet | string, c: CarnetDoc | Donnees): StatutCarnet {
  if (avant === 'validated') return 'validated';
  return statutDe(donnees(c));
}

/* ---------- seuils tirés du texte d'un critère (G26) ---------- */

/** Le seuil écrit dans un critère : la quantité de l'unité de sa caractéristique (ou la seule quantité). */
export function seuilDe(k: Critere): Quantite | null {
  if (!k.caracteristique) return null;
  const q = quantitesDe(k.texte);
  const unite = k.caracteristique.unite;
  return (unite ? q.find(x => x.unite === unite) : undefined) ?? (q.length === 1 ? q[0] : null);
}

/** L'article passe-t-il le critère ? `null` si inconnu (valeur absente ou critère sans seuil). */
export function passe(a: Article, k: Critere): boolean | null {
  const car = k.caracteristique;
  if (!car) return null;
  if (car.sens === 'oui-non') return ordonnable(valeurDe(a, car), 'oui-non') === null ? null : ordonnable(valeurDe(a, car), 'oui-non') === 1;
  const s = seuilDe(k);
  const v = ordonnable(valeurDe(a, car), car.sens);
  if (!s || v === null) return null;
  return car.sens === 'plus' ? v >= s.valeur : car.sens === 'moins' ? v <= s.valeur : null;
}

const ordinal = (n: number) => (n === 1 ? '1er' : `${n}e`);

/**
 * Ce qu'un dépôt change pour comparer (G20, G26) : « <nom> rangé, 2e » pour un article neuf classé ; « <nom> ne passerait plus » ou
 * « <nom> passerait » quand le seuil d'un critère change. Les nombres cités viennent des données (rang compté, noms) ; rien d'inventé.
 */
export function difference(avant: CarnetDoc | Donnees, apres: CarnetDoc | Donnees): string[] {
  const a = donnees(avant), b = donnees(apres);
  const sortie: string[] = [];
  const t = tableau(b);
  const connus = new Set(a.articles.map(x => x.id));
  for (const art of b.articles) {
    if (connus.has(art.id)) continue;
    const l = t?.lignes.find(x => x.articleId === art.id);
    if (l?.rang) sortie.push(`${l.nom} rangé, ${ordinal(l.rang)}`);
  }
  for (const k of b.criteres) {
    if (!k.caracteristique) continue;
    const ancien = a.criteres.find(x => x.id === k.id);
    if (ancien && ancien.texte === k.texte && JSON.stringify(ancien.caracteristique) === JSON.stringify(k.caracteristique)) continue;
    for (const art of b.articles) {
      if (raisonEcarte(b, art) !== null) continue;
      const pAvant = ancien ? passe(art, ancien) : true;
      const pApres = passe(art, k);
      if (pAvant === true && pApres === false) sortie.push(`${nomArticle(art)} ne passerait plus`);
      else if (pAvant === false && pApres === true) sortie.push(`${nomArticle(art)} passerait`);
    }
  }
  return sortie;
}

/* ---------- G8 : le critère qui peut trancher (R44) ---------- */

export interface Tranche { critere: Critere; entre: [string, string] }

/**
 * « exemple.test/hotte-inox-120 » : le domaine et le dernier bout du chemin (le plus parlant : la fiche du produit), extension retirée,
 * rogné à 24 caractères ; `undefined` sans lien lisible (parseur WHATWG `URL`, comme `liensDuTexte`).
 */
export function domaineEtChemin(a: Pick<Article, 'url' | 'domaine'>): string | undefined {
  if (!a.url) return undefined;
  try {
    const u = new URL(a.url);
    const hote = u.hostname.replace(/^www\./i, '');
    const bout = u.pathname.split('/').filter(Boolean).pop();
    if (!bout) return hote;
    const court = decodeURIComponent(bout).replace(/\.(html?|php|aspx?)$/i, '');
    return `${hote}/${court.length > 24 ? `${court.slice(0, 23)}…` : court}`;
  } catch {
    return undefined;
  }
}

/** « 1 450 CHF » : le prix lu, pour départager deux homonymes ; `undefined` s'il est inconnu (jamais 0). */
function prixCourt(a: Pick<Article, 'prixCentimes' | 'devise'>): string | undefined {
  if (a.prixCentimes === undefined || !Number.isFinite(a.prixCentimes)) return undefined;
  const francs = a.prixCentimes / 100;
  const texte = Number.isInteger(francs) ? String(francs) : francs.toFixed(2);
  const [entier, decimales] = texte.split('.');
  const groupe = entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${decimales ? `${groupe}.${decimales}` : groupe} ${a.devise ?? 'CHF'}`;
}

/**
 * Les noms affichés de candidats (G8, R44), jamais deux pareils. Chaque article garde son nom lu (sinon son domaine) ; quand deux se
 * ressemblent, on cherche ce qui les sépare, dans l'ordre : nom lu, puis vendeur, puis domaine avec un bout du chemin, puis prix. Le
 * premier signe qui les distingue tous est ajouté (« Hotte · Inox Broye ») ou remplace le domaine nu (« exemple.test/hotte-120 »).
 * Rien ne les sépare : leur place (« 1er », « 2e »). Rien n'est inventé : chaque mot vient de l'article.
 */
export function nomsDistincts(articles: readonly Article[]): string[] {
  const base = articles.map(a => nomArticle(a));
  const sortie = [...base];
  const signes: ((a: Article) => string | undefined)[] = [a => a.nom, a => a.vendeur, domaineEtChemin, prixCourt];
  const traites = new Set<number>();
  base.forEach((nom, i) => {
    if (traites.has(i)) return;
    const groupe = base.map((n, j) => (normaliser(n) === normaliser(nom) ? j : -1)).filter(j => j >= 0);
    groupe.forEach(j => traites.add(j));
    if (groupe.length < 2) return;
    for (const signe of signes) {
      const valeurs = groupe.map(j => signe(articles[j]));
      if (valeurs.some(v => !v)) continue;
      if (new Set(valeurs.map(v => normaliser(v!))).size !== groupe.length) continue;
      groupe.forEach((j, k) => {
        const v = valeurs[k]!;
        const a = articles[j];
        /* un nom lu se garde et se précise ; un domaine nu cède la place au signe (vendeur, chemin) */
        sortie[j] = a.nom && normaliser(v) !== normaliser(a.nom) ? `${a.nom} · ${v}` : signe === prixCourt ? `${base[j]} · ${v}` : v;
      });
      return;
    }
    groupe.forEach((j, k) => { sortie[j] = `${base[j]} · ${ordinal(k + 1)}`; });
  });
  return sortie;
}

/**
 * Le premier critère dont la caractéristique manque, ou est inconnue pour les deux premiers du tableau, et les deux candidats qu'il peut
 * départager : les deux premières façons non écartées, sinon les deux premiers articles non écartés. `null` s'il y a moins de deux candidats.
 * Les deux candidats ne se nomment jamais pareil (`nomsDistincts` ; deux façons homonymes : « 1re », « 2e »).
 */
export function critereQuiTranche(c: CarnetDoc | Donnees): Tranche | null {
  const d = donnees(c);
  const facons = d.facons.filter(f => f.etat !== 'ecartee');
  const t = tableau(d);
  const premiers = t ? t.lignes.filter(l => l.rang !== null).slice(0, 2) : [];
  const articles = premiers.map(l => d.articles.find(a => a.id === l.articleId)!);
  let entre: string[];
  if (facons.length >= 2) {
    entre = facons.slice(0, 2).map(f => f.nom);
    if (normaliser(entre[0]) === normaliser(entre[1])) entre = [`${entre[0]} · 1re`, `${entre[1]} · 2e`];
  } else {
    /* les noms du tableau, déjà distincts (`nomsDistincts` dans `tableau`) : la bulle nomme comme les colonnes */
    entre = premiers.map(l => l.nom);
  }
  if (entre.length < 2) return null;
  /* critique 5, n° 21 : seulement une caractéristique mesurable que les deux premiers n'ont pas (absente ou inconnue) ; jamais un critère
     sans caractéristique (« capter la buée » dit le besoin, il ne départage rien).
     Critique 6, n° 17 (R44, D-133) : et seulement si cette caractéristique a une colonne, c'est-à-dire au moins une valeur connue dans le
     tableau. Un critère déjà affiché dont personne n'a la valeur (« pas trop de bruit », aucune colonne de bruit) ne tranche rien. */
  const colonneConnue = (k: Critere): boolean => {
    const col = t?.colonnes.find(x => x.critereId === k.id);
    return !!col && !!t && t.lignes.some(l => l.cellules[col.nom] !== undefined) && premiers.every(l => l.cellules[col.nom] === undefined);
  };
  const critere = articles.length === 2
    ? d.criteres.find(k => k.caracteristique && k.caracteristique.sens !== 'texte' && articles.every(a => !valeurDe(a, k.caracteristique!, d)) && colonneConnue(k))
    : undefined;
  return critere ? { critere, entre: [entre[0], entre[1]] } : null;
}

/** Le texte de la bulle G8 (picto local, pas le ✻ : Q19). */
export const texteTranche = (t: Tranche): string => `Le critère « ${t.critere.texte} » peut trancher entre ${t.entre[0]} et ${t.entre[1]}`;

/* ---------- G9 : la conséquence pendant la frappe (R45) ---------- */

/** Les caractéristiques connues d'un carnet : celles des critères, puis celles lues sur les articles (sens inconnu → 'texte'). */
export function caracteristiquesDe(c: CarnetDoc | Donnees): Caracteristique[] {
  const d = donnees(c);
  const sortie: Caracteristique[] = colonnesDe(d).map(k => ({ nom: k.nom, ...(k.unite ? { unite: k.unite } : {}), sens: k.sens }));
  const vues = new Set(sortie.map(k => normaliser(k.nom)));
  for (const a of d.articles) for (const [nom, v] of Object.entries(a.valeurs)) {
    if (vues.has(normaliser(nom))) continue;
    vues.add(normaliser(nom));
    sortie.push({ nom, ...(v.unite ? { unite: v.unite } : {}), sens: 'texte' });
  }
  return sortie;
}

/**
 * « les articles seront rangés sur le fond de bac, 38 cm au moins » : une ligne de l'aperçu local (critère, ou porteuse d'une quantité) croisée
 * avec une caractéristique du carnet de même nom ou de même unité. Le nombre vient de la phrase tapée, jamais d'ailleurs ; « au moins » si
 * sens plus, « au plus » si sens moins ; sans nombre : « les articles seront rangés sur <caractéristique> ». Aucune voisine : `null`.
 */
export function consequenceApercu(c: CarnetDoc | Donnees, lignes: readonly LigneLocale[]): string | null {
  const caracs = caracteristiquesDe(c);
  for (const l of lignes) {
    if (l.sorte !== 'critere' && l.quantites.length === 0) continue;
    const texte = ` ${normaliser(l.texte)} `;
    const parNom = caracs.find(k => normaliser(k.nom) !== '' && texte.includes(` ${normaliser(k.nom)} `));
    const parUnite = parNom ? undefined : caracs.find(k => k.unite && l.quantites.some(q => q.unite === k.unite));
    const k = parNom ?? parUnite;
    if (!k) continue;
    const q = k.unite ? l.quantites.find(x => x.unite === k.unite) : l.quantites.length === 1 ? l.quantites[0] : undefined;
    const debut = `les articles seront rangés sur ${avecArticle(k.nom, k.sens)}`;
    if (!q || (k.sens !== 'plus' && k.sens !== 'moins')) return debut;
    return `${debut}, ${q.texte} ${q.unite} ${k.sens === 'plus' ? 'au moins' : 'au plus'}`;
  }
  return null;
}
