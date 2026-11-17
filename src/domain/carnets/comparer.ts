/**
 * Carnet d'idées : comparer (R26, D-13, D-21, D-23, D-52 ; G8, G9, G20, G26). Calcul pur, local, sans IA.
 *
 * État de l'art (MISSION) : comparaison sans poids (CADRE) ; tri lexicographique par les caractéristiques des critères, dans l'ordre des
 * critères ; « moins bien partout » = dominé au sens de Pareto sur les valeurs connues des deux articles (au moins 2 caractéristiques
 * comparables, prix compris) ; `Array.prototype.sort` stable. Une valeur inconnue se range après les connues, jamais comme 0.
 */
import { quantitesDe, normaliser, type LigneLocale, type Quantite } from './analyseLocale';
import { nomArticle, statutDe, type Article, type CarnetDoc, type Caracteristique, type Critere, type DonneesCarnet, type StatutCarnet, type Valeur } from './modele';

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

/* ---------- colonnes et valeurs ---------- */

export interface Colonne { nom: string; unite?: string; sens: Caracteristique['sens']; critereId?: string }
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
    sortie.push({ nom: car.nom, ...(car.unite ? { unite: car.unite } : {}), sens: car.sens, critereId: k.id });
  }
  return sortie;
}

/** La valeur d'un article pour une colonne ; absente si inconnue ou dans une autre unité (jamais convertie, jamais 0). */
export function valeurDe(a: Article, col: Pick<Colonne, 'nom' | 'unite'>): Valeur | undefined {
  const cle = Object.keys(a.valeurs).find(k => normaliser(k) === normaliser(col.nom));
  const v = cle ? a.valeurs[cle] : undefined;
  if (!v) return undefined;
  if (col.unite && v.unite && v.unite !== col.unite) return undefined;
  return v;
}

/** Valeur ordonnable : nombre pour plus/moins, booléen pour oui-non ; sinon `null` (inconnue ou non comparable). */
function ordonnable(v: Valeur | undefined, sens: Colonne['sens']): number | null {
  if (!v) return null;
  if (sens === 'oui-non') {
    if (typeof v.valeur === 'boolean') return v.valeur ? 1 : 0;
    if (typeof v.valeur === 'string') { const n = normaliser(v.valeur); return n === 'oui' ? 1 : n === 'non' ? 0 : null; }
    return null;
  }
  if (sens === 'plus' || sens === 'moins') return typeof v.valeur === 'number' && Number.isFinite(v.valeur) ? v.valeur : null;
  return null;
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
  devise?: string;
  moinsBienPartout: boolean;
  /** Écarté (façon écartée ou écarté au choix), avec sa raison : gardé à la fin (D-52). */
  ecarte?: { raison: string };
}

export interface Tableau { colonnes: Colonne[]; lignes: LigneTableau[]; rangePar: string | null }

/** La raison d'un article écarté : écarté au choix, sinon sa façon écartée ; `null` s'il ne l'est pas. */
function raisonEcarte(c: Donnees, a: Article): string | null {
  const auChoix = c.choix?.ecartes.find(e => e.articleId === a.id);
  if (auChoix) return auChoix.raison || 'écarté';
  const facon = a.faconId ? c.facons.find(f => f.id === a.faconId) : undefined;
  if (facon?.etat === 'ecartee') return facon.raison ? `${facon.nom} écartée : ${facon.raison}` : `${facon.nom} écartée`;
  return null;
}

/** L'ordre des articles non écartés : lexicographique sur les colonnes, dans l'ordre des critères ; stable. */
function trier(articles: readonly Article[], colonnes: readonly Colonne[]): Article[] {
  const triables = colonnes.filter(k => k.sens !== 'texte');
  return [...articles].sort((a, b) => {
    for (const k of triables) {
      const d = comparerSur(ordonnable(valeurDe(a, k), k.sens), ordonnable(valeurDe(b, k), k.sens), k.sens);
      if (d !== 0) return d;
    }
    return 0;
  });
}

const prixComparable = (a: Article, b: Article): boolean => a.prixCentimes !== undefined && b.prixCentimes !== undefined && (a.devise ?? 'CHF') === (b.devise ?? 'CHF');

/**
 * `a` est-il moins bien partout que `b` (dominé au sens de Pareto) ? Sur les caractéristiques comparables (connues des deux, sens plus,
 * moins, oui-non ; prix compris si même devise) : au moins 2, `b` au moins aussi bon partout et meilleur sur une.
 */
export function domine(a: Article, b: Article, colonnes: readonly Colonne[]): boolean {
  const ecarts: number[] = [];
  for (const k of colonnes) {
    if (k.sens === 'texte') continue;
    const va = ordonnable(valeurDe(a, k), k.sens), vb = ordonnable(valeurDe(b, k), k.sens);
    if (va === null || vb === null) continue;
    ecarts.push(comparerSur(vb, va, k.sens)); /* < 0 : b meilleur */
  }
  if (prixComparable(a, b)) ecarts.push(b.prixCentimes! - a.prixCentimes!);
  return ecarts.length >= 2 && ecarts.every(e => e <= 0) && ecarts.some(e => e < 0);
}

/** « moins bien partout » : un autre article (non écarté) le domine. */
export function moinsBienPartout(article: Article, autres: readonly Article[], colonnes: readonly Colonne[]): boolean {
  return autres.some(b => b.id !== article.id && domine(article, b, colonnes));
}

/** « tient 80 °C d'abord, puis le débit » ; `null` sans caractéristique ordonnable. */
export function rangePar(c: CarnetDoc | Donnees): string | null {
  const noms = colonnesDe(c).filter(k => k.sens !== 'texte').map(k => avecArticle(k.nom, k.sens));
  if (!noms.length) return null;
  return noms.length === 1 ? noms[0] : `${noms[0]} d'abord, ${noms.slice(1).map(n => `puis ${n}`).join(', ')}`;
}

/** Le tableau de Comparer : absent à 0 ou 1 article, présent dès le 2e (G20). Écartés à la fin, avec leur raison (D-52). */
export function tableau(c: CarnetDoc | Donnees): Tableau | null {
  const d = donnees(c);
  if (d.articles.length < 2) return null;
  const colonnes = colonnesDe(d);
  const ecartes = d.articles.filter(a => raisonEcarte(d, a) !== null);
  const enLice = trier(d.articles.filter(a => raisonEcarte(d, a) === null), colonnes);
  const ligne = (a: Article, rang: number | null): LigneTableau => {
    const cellules: Record<string, Valeur | undefined> = {};
    for (const k of colonnes) { const v = valeurDe(a, k); if (v) cellules[k.nom] = v; }
    const raison = raisonEcarte(d, a);
    return {
      articleId: a.id, nom: nomArticle(a), rang, cellules,
      ...(a.prixCentimes !== undefined ? { prixCentimes: a.prixCentimes } : {}), ...(a.devise ? { devise: a.devise } : {}),
      moinsBienPartout: rang !== null && moinsBienPartout(a, enLice, colonnes),
      ...(raison !== null ? { ecarte: { raison } } : {})
    };
  };
  return { colonnes, lignes: [...enLice.map((a, i) => ligne(a, i + 1)), ...ecartes.map(a => ligne(a, null))], rangePar: rangePar(d) };
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
function passe(a: Article, k: Critere): boolean | null {
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
 * Le premier critère dont la caractéristique manque, ou est inconnue pour les deux premiers du tableau, et les deux candidats qu'il peut
 * départager : les deux premières façons non écartées, sinon les deux premiers articles non écartés. `null` s'il y a moins de deux candidats.
 */
export function critereQuiTranche(c: CarnetDoc | Donnees): Tranche | null {
  const d = donnees(c);
  const facons = d.facons.filter(f => f.etat !== 'ecartee');
  const t = tableau(d);
  const premiers = t ? t.lignes.filter(l => l.rang !== null).slice(0, 2) : [];
  const entre: string[] = facons.length >= 2 ? facons.slice(0, 2).map(f => f.nom) : premiers.map(l => l.nom);
  if (entre.length < 2) return null;
  const articles = premiers.map(l => d.articles.find(a => a.id === l.articleId)!);
  const critere = d.criteres.find(k => !k.caracteristique || (articles.length === 2 && articles.every(a => !valeurDe(a, k.caracteristique!))));
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
