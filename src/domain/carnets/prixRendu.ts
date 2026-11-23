/**
 * Le prix rendu chez le brasseur d'un article en euros (D421, 22.11, maquette B1) : jamais un chiffre inventé.
 * Problème d'école : conversion de devise et taxe d'import sur une base partiellement connue. Pas de bibliothèque : trois produits.
 *   base (CHF) = (prix € + port €) × taux ; TVA d'import = 8,1 % de la base ; rendu = base + TVA + frais.
 * Le taux est repris de la dernière facture en EUR de Finances (`tauxDeLaDerniereFactureEur`), sinon posé une fois par lui et gardé.
 * Sans taux : aucun rendu (l'euro reste dit en euros). Port et frais inconnus : « ? », jamais 0 ni une valeur par défaut ; le rendu
 * est alors un plancher (« dès »). Les valeurs sont en centimes.
 */
export const TVA_IMPORT = 0.081;

export interface EntreesRendu {
  eurCentimes: number;
  /** francs pour 1 euro (0,94) ; absent = inconnu */
  taux?: number;
  portEurCentimes?: number;
  fraisChfCentimes?: number;
}
export interface PrixRendu {
  /** absent tant que le taux manque */
  baseChf?: number;
  tvaChf?: number;
  /** le rendu estimé ; un plancher si `manque` contient « port » ou « frais » */
  totalChf?: number;
  portChf?: number;
  fraisChf?: number;
  manque: ('taux' | 'port' | 'frais')[];
}

const arrondi = (x: number) => Math.round(x);

export function prixRendu(e: EntreesRendu): PrixRendu {
  const manque: PrixRendu['manque'] = [];
  const tauxOk = typeof e.taux === 'number' && Number.isFinite(e.taux) && e.taux > 0;
  if (!tauxOk) manque.push('taux');
  const portOk = typeof e.portEurCentimes === 'number' && Number.isFinite(e.portEurCentimes);
  if (!portOk) manque.push('port');
  const fraisOk = typeof e.fraisChfCentimes === 'number' && Number.isFinite(e.fraisChfCentimes);
  if (!fraisOk) manque.push('frais');
  if (!tauxOk) return { manque };
  const taux = e.taux as number;
  const baseExacte = (e.eurCentimes + (portOk ? (e.portEurCentimes as number) : 0)) * taux;
  const tva = baseExacte * TVA_IMPORT;
  const frais = fraisOk ? (e.fraisChfCentimes as number) : 0;
  return {
    baseChf: arrondi(e.eurCentimes * taux), tvaChf: arrondi(tva), totalChf: arrondi(baseExacte + tva + frais),
    ...(portOk ? { portChf: arrondi((e.portEurCentimes as number) * taux) } : {}), ...(fraisOk ? { fraisChf: frais } : {}), manque
  };
}

/** Un taux lu comme on l'écrit (« 0,94 » ou « 0.94 ») ; `null` s'il n'est pas un nombre raisonnable (0,2 à 2). */
export function tauxLu(texte: string): number | null {
  const n = Number(String(texte).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0.2 && n <= 2 ? n : null;
}

/** Le taux de la dernière facture en EUR (la plus récente d'abord) ; `undefined` si aucune n'en porte. */
export function tauxDeLaDerniereFactureEur(transactions: readonly { date?: unknown; finance?: { sourceCurrency?: string; exchangeRate?: number } }[]): number | undefined {
  const lues = transactions
    .filter(t => t.finance?.sourceCurrency?.toUpperCase() === 'EUR' && typeof t.finance.exchangeRate === 'number' && t.finance.exchangeRate > 0)
    .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));
  return lues[0]?.finance?.exchangeRate;
}

/* ---------- Un prix hors franc (D447, 23.11) : converti au cours du jour, avec l'original, la taxe dite et le port lu ---------- */

/**
 * D447 : « un prix qui n'est pas en CHF à la base s'affiche converti, avec la mention des frais possibles (douane, TVA d'import, port,
 * export, envoi) ; frais lus sur la page quand elle les donne, jamais inventés ». La page lue donne le prix d'origine, sa devise, le cours du
 * jour (BCE, par Frankfurter : `change`), « HT » ou « TTC » quand elle le dit, et le port vers la Suisse quand elle le publie.
 * Le prix d'origine n'est jamais remplacé : la conversion s'affiche à côté.
 */
export interface PrixArticleDonnees {
  prixCentimes?: number;
  devise?: string;
  taxe?: 'ht' | 'ttc';
  prixTTCCentimes?: number;
  livraison?: { prixCentimes?: number; devise?: string; gratuite?: true; refusee?: true };
  change?: { taux: number; date: string; source: 'BCE' };
}

export const MENTION_FRAIS = 'douane, port et envoi non comptés';
const deviseDe = (a: PrixArticleDonnees) => (a.devise ?? 'CHF').toUpperCase();
/** Hors franc : un prix qui se convertit. */
export const estEtranger = (a: PrixArticleDonnees): boolean => a.prixCentimes !== undefined && deviseDe(a) !== 'CHF';

/**
 * Le cours vers le franc d'un article : l'euro prend d'abord le taux de la dernière facture en EUR (ou posé une fois), les autres devises
 * le cours du jour de la lecture. Aucun cours : `undefined` (le prix reste dans sa devise, jamais un cours inventé).
 */
export function tauxVersChf(a: PrixArticleDonnees, tauxEur?: number): { taux: number; source: 'facture' | 'BCE' } | undefined {
  if (!estEtranger(a)) return undefined;
  if (deviseDe(a) === 'EUR' && typeof tauxEur === 'number' && tauxEur > 0) return { taux: tauxEur, source: 'facture' };
  const c = a.change;
  return c && c.taux > 0 && Number.isFinite(c.taux) ? { taux: c.taux, source: 'BCE' } : undefined;
}

/**
 * Le port vers la Suisse, en centimes de la devise de l'article : « gratuite » vaut 0 (la page le dit) ; un port publié dans une autre
 * devise que le prix n'est pas converti ici (aucun cours inventé) : inconnu. « Refusée » : pas de port à compter.
 */
export function portCentimes(a: PrixArticleDonnees): number | undefined {
  const l = a.livraison;
  if (!l || l.refusee) return undefined;
  if (l.gratuite) return 0;
  if (typeof l.prixCentimes === 'number' && Number.isFinite(l.prixCentimes) && l.prixCentimes >= 0 && (l.devise ?? deviseDe(a)).toUpperCase() === deviseDe(a)) return l.prixCentimes;
  return undefined;
}

/** Le prix converti seul (D447), au cours choisi, sans TVA d'import ni frais : « ≈ 1 360 CHF » pour « 1 450 USD ». */
export function convertiChf(a: PrixArticleDonnees, tauxEur?: number): number | undefined {
  const t = tauxVersChf(a, tauxEur);
  return t && a.prixCentimes !== undefined ? Math.round(a.prixCentimes * t.taux) : undefined;
}

/** Le rendu estimé d'un article hors franc (D421 généralisé à toute devise) ; `null` en francs, ou sans prix. */
export function renduArticle(a: PrixArticleDonnees, tauxEur?: number): PrixRendu | null {
  if (!estEtranger(a)) return null;
  const t = tauxVersChf(a, tauxEur);
  const port = portCentimes(a);
  return prixRendu({ eurCentimes: a.prixCentimes as number, ...(t ? { taux: t.taux } : {}), ...(port !== undefined ? { portEurCentimes: port } : {}) });
}

/**
 * La mention des frais (D447) : hors franc, « douane, port et envoi non comptés » ; port lu, « douane et envoi non comptés » ; port
 * refusé par la page, elle ne livre pas en Suisse. En francs : aucune mention.
 */
export function mentionFrais(a: PrixArticleDonnees): string | null {
  if (!estEtranger(a)) return null;
  if (a.livraison?.refusee) return 'la page ne livre pas en Suisse';
  return portCentimes(a) !== undefined ? 'douane et envoi non comptés' : MENTION_FRAIS;
}
