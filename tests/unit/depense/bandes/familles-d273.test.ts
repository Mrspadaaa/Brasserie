// D273d (01.11, nuit) : « Ça catégories bien les items un peu difficile ? », « Même seul jamais eu en stock ? ». Les articles difficiles de ses
// 14 pièces, tels que la lecture EN LIGNE les a rendus (kind, catégorie lue), jamais en stock : la famille de l'écran et la catégorie de l'article
// neuf. 28 sur 30 étaient justes ; restent faux un houblon sans catégorie lue et un sucre lu « other_stock » rangé en Divers à la création.
import { describe, expect, it } from 'vitest';
import { familleDe } from '../../../../src/ui/depense/familles';
import { categorieArticleNeuf } from '../../../../src/services/stockLineMatching';

const justes: [string, string, string, string][] = [
  ['Hop Spider Bag', 'equipment', '', 'materiel'], ['Hopfensack fein', 'equipment', '', 'materiel'], ['CARABELGE®, Kg', 'stock', 'malt', 'malt'],
  ['SPECIAL W®, Gramm', 'stock', 'malt', 'malt'], ['Candi Syrup Golden 460ml', 'stock', 'sucre', 'sucre'], ['Candi Syrup extra dunkel 460ml', 'stock', 'other_stock', 'sucre'],
  ['Wyeast 3787, Belgian High Gravity', 'stock', 'levure', 'levure'], ['Wyeast 1007, German Ale XL', 'stock', 'yeast', 'levure'], ['US West Coast M44, 10gr', 'stock', 'yeast', 'levure'],
  ['CH-BIO Goldings EU 4.2%', 'stock', 'hop', 'houblon'], ['Irish Moss 250 g', 'stock', '', 'additif'], ['White Labs Nutrient', 'stock', 'autre', 'additif'],
  ['Malzextraktpulver hell 1 Kg', 'stock', 'malt', 'malt'], ['Gärtank 30 Liter rund mit Deckel', 'equipment', '', 'materiel'], ['Kronkorken 100 Kapseln Hophead', 'packaging', '', 'emballage'],
  ['Röstgerste, Kg', 'stock', 'malt', 'malt'], ['Baumwollfilter', 'equipment', '', 'materiel'], ['Erlenmeyerkolben 3 Liter Hobby', 'equipment', '', 'materiel'],
  ['French Saison M29, 10gr', 'stock', 'levure', 'levure'], ['Cryo Hops Citra 24.8% 25g', 'stock', 'houblon', 'houblon'], ['Gäreimer 17 Liter komplett', 'equipment', '', 'materiel'],
];

describe('D273d — articles difficiles jamais en stock, lus en ligne', () => {
  it.each(justes)('%s (%s/%s) → %s', (nom, kind, stockCategory, famille) => {
    expect(familleDe({ nom, kind, stockCategory })).toBe(famille);
  });

  it('un houblon à son α, sans catégorie lue, reste un houblon (Nelson Sauvin)', () => {
    expect(familleDe({ nom: 'Nelson Sauvin™ 9.6%', kind: 'stock', stockCategory: '' })).toBe('houblon');
  });

  it('l’article neuf prend la catégorie de sa famille : un sirop candi lu « other_stock » est un Sucre', () => {
    expect(categorieArticleNeuf({ description: 'Candi Syrup extra dunkel 460ml', stockCategory: 'other_stock', kind: 'ingredient' } as any)).toBe('Sucre');
  });
});

// Suite D273d (01.11, nuit) : « j'ai l'impression qu'il y a trop d'items en autre ? » — les lignes de brassage rangées en « Autres » par la mesure du pilote
// sur ses 232 articles lus. `hasHopWord` ne prend que le premier mot d'un nom (4 lettres au moins) : « El » et « Barbe » ne disent rien ; l'extrait de malt sec
// n'a ni « malt » ni « Malz » comme mot entier. Les noms sont ceux du catalogue public des houblons.
describe('D273d (suite) — brassage rangé en « Autres » à tort', () => {
  it.each([['Barbe Rouge 8.6%'], ['Barbe Rouge 8.9%'], ['El Dorado 12.3%'], ['El Dorado® 11.7%']])('%s (stock, sans catégorie lue) → houblon', (nom) => {
    expect(familleDe({ nom, kind: 'stock', stockCategory: '' })).toBe('houblon');
  });
  it.each([['Malzextraktpulver hell 1 Kg'], ['Malzextrakt flüssig 5 Kg'], ['DME Light 1 Kg']])('%s (stock, sans catégorie lue) → malt', (nom) => {
    expect(familleDe({ nom, kind: 'stock', stockCategory: '' })).toBe('malt');
  });
  it('les témoins : un « % » seul ne fait pas un houblon ; un nom simple du catalogue demande son α ; un acide reste un additif', () => {
    expect(familleDe({ nom: 'Milchsäure 80 %', kind: 'stock' })).toBe('additif');
    expect(familleDe({ nom: 'Produit fictif 12.3%', kind: 'stock' })).toBe('autres');
    expect(familleDe({ nom: 'Bergamot 8%', kind: 'stock' })).toBe('houblon');
    expect(familleDe({ nom: 'Bergamot fictif', kind: 'stock' })).toBe('autres');
    expect(familleDe({ nom: 'Dorado fictif', kind: 'stock' })).toBe('autres');
  });
  it('l’article neuf d’un houblon sans catégorie lue est un Houblon, celui d’un extrait de malt un Malt', () => {
    expect(categorieArticleNeuf({ description: 'El Dorado® 11.7%', stockCategory: '', kind: 'ingredient' } as any)).toBe('Houblon');
    expect(categorieArticleNeuf({ description: 'Malzextraktpulver hell 1 Kg', stockCategory: '', kind: 'ingredient' } as any)).toBe('Malt');
  });
});
