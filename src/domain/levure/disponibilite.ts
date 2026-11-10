/**
 * Où l'acheter, du plus proche au plus rare :
 *  - `ici`    : une offre CH, FR ou DE dans les offres (src/data/yeastSupplyBootstrap.json) ;
 *  - `europe` : « fabricant présent en Europe », validé par une preuve (src/data/levure/fabricantsEurope.json : siège ou
 *               distributeur européen) ou par une offre dans un autre pays d'Europe ;
 *  - `rare`   : le reste.
 */
import supply from '../../data/yeastSupplyBootstrap.json';
import europe from '../../data/levure/fabricantsEurope.json';
import type { Disponibilite, RangDisponibilite } from './contrat';
import type { YeastReference } from '../yeastReferences';

type Pays = 'CH' | 'FR' | 'DE';
const ICI: readonly string[] = ['CH', 'FR', 'DE'];
/** Pays d'Europe (UE, AELE, Royaume-Uni) où une offre prouve la présence du fabricant. */
const EUROPE = new Set(['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'NO', 'IS', 'LI', 'GB', 'UK']);

export const RANG_ORDRE: Record<RangDisponibilite, number> = { ici: 0, europe: 1, rare: 2 };

interface Offre { pays: string; montant?: number; devise?: string; enStock: boolean; statut: string; releveLe: string; note?: string }
const idParProduit = new Map<string, string>(
  (supply.products as Array<{ id: string; referenceId: string }>).map((p) => [p.id, p.referenceId])
);
const offresParRef = new Map<string, Offre[]>();
for (const o of supply.offers as Array<{ productId: string; sellerCountry: string; stock?: { status: string; text?: string; source?: { checkedAt?: string } }; price?: { amount: number; currency: string; packs?: number } }>) {
  const ref = idParProduit.get(o.productId);
  if (!ref) continue;
  const l = offresParRef.get(ref) ?? [];
  l.push({ pays: o.sellerCountry, enStock: o.stock?.status === 'in-stock', statut: o.stock?.status ?? 'unknown', releveLe: o.stock?.source?.checkedAt ?? '', ...(o.stock?.text ? { note: o.stock.text } : {}), ...(o.price ? { montant: o.price.amount / (o.price.packs || 1), devise: o.price.currency } : {}) });
  offresParRef.set(ref, l);
}

/** Les fabricants dont la présence en Europe est prouvée (liste sourcée). */
export const FABRICANTS_EUROPE: ReadonlyArray<{ fabricant: string; type: string; force: string; preuve: string; source: { libelle: string; url: string } }> =
  europe.fabricants as never;
const fabricantsEurope = new Set(FABRICANTS_EUROPE.map((f) => f.fabricant));
export const FABRICANTS_ECARTES = europe.ecartes;

/** Le stock au relevé : une offre en stock suffit ; sinon épuisée si toutes le sont ; sinon inconnu. La date est celle du relevé. */
function stockDe(offres: Offre[]): NonNullable<Disponibilite['stock']> | undefined {
  if (!offres.length) return undefined;
  const dates = offres.map((o) => o.releveLe).filter(Boolean).sort();
  const en = offres.find((o) => o.statut === 'in-stock');
  if (en) return { statut: 'en-stock', releveLe: en.releveLe };
  const releveLe = dates[dates.length - 1] ?? '';
  if (offres.every((o) => o.statut === 'out-of-stock')) return { statut: 'epuise', releveLe, ...(offres[0].note ? { note: offres[0].note } : {}) };
  return { statut: 'inconnu', releveLe, ...(offres[0].note ? { note: offres[0].note } : {}) };
}

export function disponibilite(levure: YeastReference): Disponibilite {
  const offres = offresParRef.get(levure.id) ?? [];
  const locales = offres.filter((o) => ICI.includes(o.pays));
  if (locales.length) {
    const pays = [...new Set(locales.map((o) => o.pays))] as Pays[];
    const tarifs = locales.filter((o) => o.montant != null && o.devise);
    // Deux devises ne se comparent pas : le prix le plus bas se lit en CHF s'il y en a, sinon en EUR.
    const devise = tarifs.some((o) => o.devise === 'CHF') ? 'CHF' : tarifs[0]?.devise;
    const prix = tarifs.filter((o) => o.devise === devise).map((o) => o.montant!);
    return {
      rang: 'ici', pays, offres: offres.length, ...(stockDe(locales) ? { stock: stockDe(locales) } : {}),
      ...(prix.length && (devise === 'CHF' || devise === 'EUR') ? { prixMin: { montant: Math.min(...prix), devise } } : {})
    };
  }
  const horsPays = offres.some((o) => EUROPE.has(o.pays));
  if (horsPays || fabricantsEurope.has(levure.catalogue?.manufacturer ?? '')) return { rang: 'europe', offres: offres.length, ...(stockDe(offres) ? { stock: stockDe(offres) } : {}) };
  return { rang: 'rare', offres: offres.length };
}

/**
 * Une offre ici annonce du stock (« in-stock » à la date du relevé) ? Sert à ranger deux levures vendues ici : celle qu'on peut
 * acheter avant celle qui est épuisée (1007 « épuisée 27.09 »). Ne change pas le rang : une offre épuisée reste « ici ».
 */
export const enStockIci = (id: string): boolean => (offresParRef.get(id) ?? []).some((o) => ICI.includes(o.pays) && o.enStock);
