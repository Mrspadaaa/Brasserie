// Les choix du sélecteur de houblon de la recette (étape Houblons), purs : stock du brasseur, puis catalogue de référence.
//
// Constats du 08.11 (MV-22, BR-36, BR-37, BR-40) : taper « Citra » puis Entrée ajoutait « Altus » ; la recherche floue lisait toute la ligne de détail
// (« Hopsteiner · Forme non précisée · disponibilité non renseignée »), où une requête de 5 lettres trouve un peu partout, et le premier de la liste
// passait devant le nom exact. La recherche ne lit donc que le NOM et les noms voisins (alias) ; le détail n'est que de l'affichage. Le détail dit ce qui
// décide un brasseur, dans l'ordre de L04 : α, arômes, puis la provenance, avec la virgule des autres écrans (« 12,5 % α », jamais « 12.5 % AA » : TE-23).
import type { HopMeasurement, HopVariety } from '../../../functions/src/hopIndexSchema';
import type { StockItem } from '../../types';
import { Units } from '../../services/units';
import { refAffichable } from '../../domain/stock/regles';
import { HOP_FORM_LABELS, hopReferenceSource } from '../../domain/hopIndex/labels';
import type { ComboOption } from '../Combobox';

/** La recherche lit le nom et les noms voisins, jamais la ligne de détail. */
export const CLES_RECHERCHE: Array<keyof ComboOption> = ['label', 'keywords'];

const fr = (x: number) => x.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/** L'α publié d'une variété (« 12–14 % α », « 12,5 % α »), ou `null` quand aucune mesure d'α en % ne l'écrit : jamais 0. */
export function alphaDeReference(v: HopVariety): string | null {
  const m = v.analysis.find((a: HopMeasurement) => a.analyte === 'alpha' && a.unit === 'percentMass' && a.kind !== 'unknown' && a.kind !== 'below');
  if (!m) return null;
  if (m.kind === 'range' && m.range) return `${fr(m.range.min)}–${fr(m.range.max)} % α`;
  if (typeof m.value === 'number' && Number.isFinite(m.value)) return `${fr(m.value)} % α`;
  return null;
}

const court = (t: string, n = 56) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);

/** Le détail d'un houblon du catalogue : α, arômes, puis la source et la forme. */
export function detailReference(v: HopVariety, alphaVoisin?: { alpha: string; source: string } | null): string {
  const aromes = v.descriptions.find((d) => d.text.trim())?.text.trim();
  // RV-1 (08.11) : « Citra · α non publié » en tête d'un houblon phare. Une autre fiche de la MÊME variété publie-t-elle un α ? Il se montre, avec sa source.
  const alpha = alphaDeReference(v) ?? (alphaVoisin ? `${alphaVoisin.alpha} (${alphaVoisin.source})` : 'α non publié');
  return [alpha, aromes ? court(aromes) : null, hopReferenceSource(v), HOP_FORM_LABELS[v.form]].filter(Boolean).join(' · ');
}

const cleVariete = (nom: string) => nom.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function optionsStock(stock: readonly StockItem[]): ComboOption[] {
  return stock.map((i) => ({
    value: `stock:${i.ref}`, label: i.name, group: 'Mes articles',
    // TE-23 : jamais l'identifiant interne d'une fiche apprise (FICHE-Houblon%3A…), « α » et non « AA », « stock épuisé » plutôt que « 0 g en stock ».
    detail: [i.alphaPct ? `${fr(i.alphaPct)} % α` : null, refAffichable(i.ref) || null, i.supplier || null,
      i.currentStock > 0 ? `${Units.format(i.currentStock, i.unit)} en stock` : 'stock épuisé'].filter(Boolean).join(' · '),
    keywords: [i.ref, i.supplier].filter(Boolean).join(' '), favorite: i.favorite,
  }));
}

export function optionsReference(varieties: readonly HopVariety[], groupe: (v: HopVariety) => string): ComboOption[] {
  // L'α publié de chaque variété, par nom et par alias (la première fiche qui en publie un).
  const alphas = new Map<string, { alpha: string; source: string }>();
  for (const v of varieties) {
    const a = alphaDeReference(v);
    if (!a) continue;
    for (const nom of [v.name, ...v.aliases]) { const k = cleVariete(nom); if (k && !alphas.has(k)) alphas.set(k, { alpha: a, source: hopReferenceSource(v) }); }
  }
  // Les fiches qui publient un α passent devant celles qui n'en ont pas (tri stable : l'ordre du catalogue est gardé sinon).
  const triees = [...varieties].sort((a, b) => Number(!alphaDeReference(a)) - Number(!alphaDeReference(b)));
  return triees.map((v) => ({ value: `ref:${v.id}`, label: v.name, group: groupe(v),
    detail: detailReference(v, alphaDeReference(v) ? null : alphas.get(cleVariete(v.name)) ?? null), keywords: v.aliases.join(' ') }));
}
