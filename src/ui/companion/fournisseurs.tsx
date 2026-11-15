/*
 * Où acheter (maquette p2a, cadre `fournisseurs`) : Fournisseurs, produitsAffiches, statutStock, dateControle.
 * Props : Fournisseurs {products, selectedUrls?, maintenant?}. Règles pures exportées pour les tests. Le stock est toujours
 * « annoncé » par le vendeur, jamais confirmé ; l'app n'achète rien ; un contrôle trop ancien ou sans date se dit « à revérifier ».
 */
import type { BrewerProduct } from '../../../functions/src/companionTypes';
import { Icone } from './parts';

const UN_JOUR = 86400000;
const TOLERANCE_HORLOGE = 300000;

const grammes = (p: BrewerProduct): number => {
  const label = p.packageLabel || p.name;
  const poids = label.match(/(\d+(?:[.,]\d+)?)\s*(kg|kilogramm(?:e)?s?|gramm(?:e)?s?|g)\b/i);
  if (poids) return Number(poids[1].replace(',', '.')) * (/^(kg|kilo)/i.test(poids[2]) ? 1000 : 1);
  if (/\b(?:gramm(?:e)?s?|g)\b/i.test(label)) return 1;
  if (/\b(?:kg|kilogramm(?:e)?s?)\b/i.test(label)) return 1000;
  return Number.MAX_SAFE_INTEGER;
};

/** Une date de contrôle est connue si elle est positive et pas dans le futur (à 5 min près). */
const datee = (p: BrewerProduct, maintenant: number) =>
  Number.isFinite(p.checkedAt) && p.checkedAt > 0 && p.checkedAt <= maintenant + TOLERANCE_HORLOGE;

export type StatutStock = { statut: 'in_stock' | 'out_of_stock' | 'unknown'; texte: string };
/** Statut affiché d'un produit : ancien, sans date ou page sans preuve de stock → inconnu ; le texte le dit. */
export function statutStock(p: BrewerProduct, maintenant: number): StatutStock {
  const dated = datee(p, maintenant);
  const ancien = !dated || maintenant - p.checkedAt > UN_JOUR;
  const statut = ancien || (p.verifiedBy === 'product-page' && p.stockEvidence === 'none') ? 'unknown' : p.availability;
  if (statut === 'in_stock') return { statut, texte: 'Annoncé en stock' };
  if (statut === 'out_of_stock') return { statut, texte: 'Indisponible' };
  return { statut: 'unknown', texte: ancien ? 'Stock à revérifier' : 'Stock non confirmé' };
}

/**
 * Les produits à montrer : liens https sans identifiants, ceux choisis par le serveur d'abord (dans son ordre), page produit
 * vérifiée, en stock, petit conditionnement ; une carte par URL ; un vendeur différent avant un deuxième du même ; six au plus.
 */
export function produitsAffiches(products: BrewerProduct[], selectedUrls?: string[]): BrewerProduct[] {
  const tries = [...products]
    .filter((p) => {
      if (selectedUrls && !selectedUrls.includes(p.url)) return false;
      try {
        const url = new URL(p.url);
        return url.protocol === 'https:' && !url.username && !url.password;
      } catch {
        return false;
      }
    })
    .sort(
      (a, b) =>
        (selectedUrls ? selectedUrls.indexOf(a.url) - selectedUrls.indexOf(b.url) : 0) ||
        Number(b.verifiedBy === 'product-page') - Number(a.verifiedBy === 'product-page') ||
        Number(b.availability === 'in_stock') - Number(a.availability === 'in_stock') ||
        grammes(a) - grammes(b)
    );
  const uniques = [...new Map([...tries].reverse().map((p) => [p.url, p])).values()].reverse();
  const vendeurs = new Set<string>();
  const premiers = uniques.filter((p) => {
    if (vendeurs.has(p.supplier)) return false;
    vendeurs.add(p.supplier);
    return true;
  });
  return [...premiers, ...uniques.filter((p) => !premiers.includes(p))].slice(0, 6);
}

/** « 14.11 · 20:59 » : le contrôle le plus récent des cartes datées ; `null` si aucune date n'est connue. */
export function dateControle(produits: BrewerProduct[], maintenant: number): string | null {
  const dates = produits.filter((p) => datee(p, maintenant)).map((p) => p.checkedAt);
  if (!dates.length) return null;
  const d = new Date(Math.max(...dates));
  const deux = (n: number) => String(n).padStart(2, '0');
  return `${deux(d.getDate())}.${deux(d.getMonth() + 1)} · ${deux(d.getHours())}:${deux(d.getMinutes())}`;
}

/**
 * Cartes des fournisseurs suisses : nom et conditionnement, prix annoncé, vendeur, pastille de stock, lien externe (un lien par URL).
 * `maintenant` : l'horloge, pour tester ; l'heure réelle par défaut.
 */
export function Fournisseurs({
  products,
  selectedUrls,
  maintenant
}: {
  products: BrewerProduct[];
  selectedUrls?: string[];
  maintenant?: number;
}) {
  const now = maintenant ?? Date.now();
  const cartes = produitsAffiches(products, selectedUrls);
  if (!cartes.length) return null;
  const controle = dateControle(cartes, now);
  return (
    <div className="cmp-fournisseurs" aria-label="Produits chez les fournisseurs suisses">
      <div className="cmp-lbl">
        <span>Où acheter</span>
        <span>{controle ? <>vérifié le <span className="cmp-n">{controle}</span></> : 'date de contrôle inconnue'}</span>
      </div>
      {cartes.map((p) => {
        const stock = statutStock(p, now);
        const classe = stock.statut === 'in_stock' ? ' cmp-ok' : stock.statut === 'out_of_stock' ? ' cmp-non' : '';
        return (
          <a
            key={p.url}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`cmp-four${stock.statut === 'out_of_stock' ? ' cmp-four-non' : ''}`}
          >
            <span className="cmp-four-h">
              <b style={{ overflowWrap: 'anywhere' }}>{p.name}</b>
              {p.packageLabel ? <span className="cmp-m">{p.packageLabel}</span> : null}
              {p.priceText ? <span className="cmp-prix cmp-m">{p.priceText}</span> : null}
            </span>
            <span className="cmp-four-b">
              <span>{p.supplier}</span>
              <span className={`cmp-stock${classe}`}>
                <Icone nom={stock.statut === 'out_of_stock' ? 'x' : 'horloge'} />
                {stock.texte}
              </span>
              <Icone nom="sortie" />
            </span>
            {p.verifiedBy === 'product-page' ? <small className="cmp-four-v">Lien produit vérifié</small> : null}
          </a>
        );
      })}
      <p className="cmp-note">
        <Icone nom="panier" />
        Stock annoncé par le vendeur, à confirmer à la commande. L’app n’achète rien.
      </p>
    </div>
  );
}
