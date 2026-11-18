// Banc local de l'étape Malts/sucres (voie p8-port) : la recette et le stock de la maquette `v7/s1` (NOTE.md, « Le stock de la maquette »).
// FIXTURE SIMULÉE, pas une donnée du brasseur : les quantités, couleurs et fournisseurs sont des valeurs de maquette (EBC : valeur typique de
// fiche malterie), écrites nulle part. Chargée seulement en développement, derrière `import.meta.env.DEV` et `?malts=maquette`
// (BrewWizard) : jamais dans `dist/`. Une valeur inconnue reste absente (jamais 0) : Pilsner Malz, Weizenmalz hell et Haferflocken n'ont pas de couleur.
import type { Fermentable, FermentableKind, FermentableUse, StockItem } from '../../types';

interface Article { nom: string; categorie: string; q: number; ebc?: number; fo: string; ep?: boolean }

const STOCK: Article[] = [
  { nom: 'Pilsner Malz', categorie: 'Malt', q: 18, fo: 'Weyermann', ep: true },
  { nom: 'Pale Ale Malz', categorie: 'Malt', q: 12.5, ebc: 6.5, fo: 'Weyermann', ep: true },
  { nom: 'Münchner Malz', categorie: 'Malt', q: 0, ebc: 15, fo: 'Weyermann' },
  { nom: 'Carapils', categorie: 'Malt', q: 1.2, ebc: 4, fo: 'Weyermann' },
  { nom: 'Weizenmalz hell', categorie: 'Malt', q: 6, fo: 'Weyermann' },
  { nom: 'Haferflocken', categorie: 'Céréale', q: 2.5, fo: 'Bio-Familia' },
  { nom: 'Carahell', categorie: 'Malt', q: 3, ebc: 25, fo: 'Weyermann' },
  { nom: 'Caramünch II', categorie: 'Malt', q: 0.8, ebc: 120, fo: 'Weyermann' },
  { nom: 'Dextrose', categorie: 'Sucre', q: 5, fo: 'Brouwland' },
  { nom: 'Sucre candi', categorie: 'Sucre', q: 1, fo: 'Brouwland' },
  { nom: 'Lactose', categorie: 'Sucre', q: 2, fo: 'Brouwland' },
  { nom: 'Extrait sec clair', categorie: 'Extrait', q: 0, ebc: 8, fo: 'Brouwland' },
];

export function stockApercu(): StockItem[] {
  return STOCK.map((a, k) => ({
    id: `apercu-${k + 1}`, ref: `APERCU-${k + 1}`, name: a.nom, category: a.categorie, unit: 'kg', currentStock: a.q, minStock: 0, reorder: false,
    supplier: a.fo, ...(a.ep ? { favorite: true } : {}), ...(a.ebc != null ? { colorEbc: a.ebc } : {}),
  }));
}

const L = (name: string, kind: FermentableKind, use: FermentableUse, weightKg: number, extra: Partial<Fermentable> = {}): Fermentable => ({
  name, kind, use, weightKg, fermentabilityPct: kind === 'fruit' ? 90 : 100, ...(use === 'fermentation' ? { dayOffset: 3 } : {}), ...extra,
});

/** La recette de la maquette pour un état : '' (repos), couleurs, sucre, fruit, huit, vide. */
export function fermentablesApercu(etat: string): Fermentable[] {
  const e = etat.replace(/^#/, '');
  if (e === 'vide') return [];
  // Audit métier du 08.11 (AM 1 à 3), SIMULÉ : son cas (Pilsner Malz 1,8 kg à J+4, Caramünch 32,5 kg à J+3, une donnée ancienne mal placée),
  // et une OG absurde (40 kg de grain empâté pour 30 L). Potentiel et couleur : valeurs typiques de fiche malterie, pour que l'OG se calcule.
  if (e === 'absurde' || e === 'og') {
    const stock = stockApercu();
    const lien = (f: Fermentable) => ({ ...f, stockItemRef: stock.find((s) => s.name === f.name)?.ref });
    return (e === 'absurde' ? [
      L('Pale Ale Malz', 'grain', 'empatage', 5, { colorEbc: 6.5, potentialPpg: 37 }),
      L('Pilsner Malz', 'grain', 'fermentation', 1.8, { colorEbc: 3.5, potentialPpg: 37, dayOffset: 4 }),
      L('Caramünch II', 'grain', 'fermentation', 32.5, { colorEbc: 120, potentialPpg: 34 }),
      L('Dextrose', 'sucre', 'fermentation', 0.4, { potentialPpg: 46, dayOffset: 2 }),
    ] : [
      L('Pilsner Malz', 'grain', 'empatage', 40, { colorEbc: 3.5, potentialPpg: 37 }),
      L('Caramünch II', 'grain', 'empatage', 2, { colorEbc: 120, potentialPpg: 34 }),
    ]).map(lien);
  }
  const c = e === 'couleurs' || e === 'sucre' || e === 'fruit';
  const base = [
    L('Pilsner Malz', 'grain', 'empatage', 5, c ? { colorEbc: 3.5 } : {}),
    L('Weizenmalz hell', 'grain', 'empatage', 1.5, c ? { colorEbc: 4 } : {}),
    L('Haferflocken', 'grain', 'empatage', 1.5, c ? { colorEbc: 2 } : {}),
  ];
  if (e === 'sucre') base.push(L('Dextrose', 'sucre', 'ebullition', 0.4));
  if (e === 'fruit') base.push(L('Purée de mangue', 'fruit', 'fermentation', 1));
  if (e === 'huit') {
    base.push(L('Pale Ale Malz', 'grain', 'empatage', 0.5), L('Carapils', 'grain', 'empatage', 0.3), L('Münchner Malz', 'grain', 'empatage', 0.25),
      L('Dextrose', 'sucre', 'ebullition', 0.4), L('Lactose', 'lactose', 'ebullition', 0.3, { fermentabilityPct: 0 }));
  }
  // Le stock les relie par leur nom ; une ligne que le stock ne connaît pas (la purée de mangue) reste sans lien.
  const stock = stockApercu();
  return base.map((f) => {
    const a = stock.find((s) => s.name === f.name);
    return a ? { ...f, stockItemRef: a.ref } : f;
  });
}

/** L'article que le banc « crée à stock zéro » (rien n'est écrit : il reste dans l'écran). */
export function articleApercu(stock: readonly StockItem[], name: string, category: string, unit: string): StockItem {
  return { id: `apercu-${stock.length + 1}`, ref: `APERCU-${stock.length + 1}`, name, category, unit, currentStock: 0, minStock: 0, reorder: false };
}

export function apercuMalts(etat: string) {
  // Hazy IPA : le style de la maquette (21C, OG 1,060–1,085, 6–14 EBC), 30 L.
  return { fermentables: fermentablesApercu(etat), stock: stockApercu(), style: 'Hazy IPA', volumeL: 30 };
}
