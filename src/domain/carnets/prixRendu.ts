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
