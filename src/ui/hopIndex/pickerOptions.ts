// Les choix du sélecteur de houblon de la recette (étape Houblons), purs : stock du brasseur, puis catalogue de référence.
//
// Constats du 08.11 (MV-22, BR-36, BR-37, BR-40) : taper « Citra » puis Entrée ajoutait « Altus » ; la recherche floue lisait toute la ligne de détail
// (« Hopsteiner · Forme non précisée · disponibilité non renseignée »), où une requête de 5 lettres trouve un peu partout, et le premier de la liste
// passait devant le nom exact. La recherche ne lit donc que le NOM et les noms voisins (alias) ; le détail n'est que de l'affichage. Le détail dit ce qui
// décide un brasseur, dans l'ordre de L04 : α, arômes, puis la provenance, avec la virgule des autres écrans (« 12,5 % AA », pas « 12.5 »).
import type { HopMeasurement, HopVariety } from '../../../functions/src/hopIndexSchema';
import type { StockItem } from '../../types';
import { Units } from '../../services/units';
import { HOP_FORM_LABELS, hopReferenceSource } from '../../domain/hopIndex/labels';
import type { ComboOption } from '../Combobox';

/** La recherche lit le nom et les noms voisins, jamais la ligne de détail. */
export const CLES_RECHERCHE: Array<keyof ComboOption> = ['label', 'keywords'];

const fr = (x: number) => x.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/** L'α publié d'une variété (« 12–14 % AA », « 12,5 % AA »), ou `null` quand aucune mesure d'α en % ne l'écrit : jamais 0. */
export function alphaDeReference(v: HopVariety): string | null {
  const m = v.analysis.find((a: HopMeasurement) => a.analyte === 'alpha' && a.unit === 'percentMass' && a.kind !== 'unknown' && a.kind !== 'below');
  if (!m) return null;
  if (m.kind === 'range' && m.range) return `${fr(m.range.min)}–${fr(m.range.max)} % AA`;
  if (typeof m.value === 'number' && Number.isFinite(m.value)) return `${fr(m.value)} % AA`;
  return null;
}

const court = (t: string, n = 56) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);

/** Le détail d'un houblon du catalogue : α, arômes, puis la source et la forme. */
export function detailReference(v: HopVariety): string {
  const aromes = v.descriptions.find((d) => d.text.trim())?.text.trim();
  return [alphaDeReference(v) ?? 'α non publié', aromes ? court(aromes) : null, hopReferenceSource(v), HOP_FORM_LABELS[v.form]].filter(Boolean).join(' · ');
}

export function optionsStock(stock: readonly StockItem[]): ComboOption[] {
  return stock.map((i) => ({
    value: `stock:${i.ref}`, label: i.name, group: 'Mes articles',
    detail: `${i.alphaPct ? `${fr(i.alphaPct)} % AA · ` : ''}${i.ref}${i.supplier ? ` · ${i.supplier}` : ''} · ${Units.format(i.currentStock, i.unit)} en stock`,
    keywords: [i.ref, i.supplier].filter(Boolean).join(' '), favorite: i.favorite,
  }));
}

export function optionsReference(varieties: readonly HopVariety[], groupe: (v: HopVariety) => string): ComboOption[] {
  return varieties.map((v) => ({ value: `ref:${v.id}`, label: v.name, group: groupe(v), detail: detailReference(v), keywords: v.aliases.join(' ') }));
}
