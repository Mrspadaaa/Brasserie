// D273d (suite) : une seule décision pour la bande à l'écran et pour la catégorie de l'article neuf (`categorieArticleNeuf` appelle `familleDe`).
// « Ça catégories bien les items un peu difficile ? Les bonnes famille ou sous familles, catégorie ? » — jamais une catégorie hors STOCK_CATEGORIES ;
// « Divers » seulement quand la famille est « Autres ».
import { describe, expect, it } from 'vitest';
import { categorieArticleNeuf, contexteDe, STOCK_CATEGORIES } from '../../../../src/services/stockLineMatching';
import { familleDe } from '../../../../src/ui/depense/familles';
import { scanKind } from './aide';

const neuf = (description: string, kind = 'stock', stockCategory = '', reference = '') => categorieArticleNeuf({ description, kind: scanKind(kind), stockCategory, reference } as any);

describe('D273d — la catégorie de l’article neuf suit la famille de l’écran', () => {
  const JEU: Array<[string, string, string, string]> = [
    ['Candi Syrup extra dunkel 460ml', 'stock', 'other_stock', 'Sucre'], ['Nelson Sauvin™ 9.6%', 'stock', '', 'Houblon'], ['Omega OYL-200', 'stock', 'autre', 'Levure'],
    ['CARABELGE®, Kg', 'stock', 'other_stock', 'Malt'], ['Whirlfloc', 'stock', 'xyz', 'Additif'], ['Milchsäure 80 %', 'stock', '', 'Additif'], ['Phosphorsäure 75 %', 'stock', '', 'Additif'],
    ['Kronkorken 100 Kapseln Hophead', 'packaging', '', 'Emballage'], ['Star San 1 L', 'cleaning', '', 'Désinfectant'], ['Chemipro OXI 1 kg', 'cleaning', '', 'Détergent'],
    ['Natronlauge 25 kg', 'cleaning', '', 'CIP alcalin'], ['Spray fictif', 'cleaning', '', 'Consommable'], ['Handschuhe Nitril M', 'stock', 'consumable', 'Consommable'],
    ['Produit fictif XJ-17', 'stock', '', 'Divers'], ['Produit fictif XJ-17', 'stock', 'truc bizarre', 'Divers'],
  ];
  it.each(JEU)('%s (%s / « %s ») → %s', (nom, kind, cat, attendu) => { expect(neuf(nom, kind, cat)).toBe(attendu); });

  it('la catégorie lue valide reste telle quelle (sa casse, ses synonymes) : elle n’est jamais récrite par les mots', () => {
    expect(neuf('Omega OYL-200', 'stock', 'Malt')).toBe('Malt');
    expect(neuf('Candi Syrup', 'stock', 'sugar')).toBe('Sucre');
  });

  it('jamais une catégorie hors liste : une catégorie de la liste, ou « Divers » seulement pour la famille « Autres »', () => {
    const noms = ['Nelson Sauvin™ 9.6%', 'Candi Syrup', 'Fermzilla 27 L', 'Hop Spider Bag', 'Analyse Wasserprobe', 'Kronkorken', 'Divers fictif XJ-17', 'Wyeast 1056', 'Handschuhe', 'Star San', ''];
    for (const kind of ['stock', 'equipment', 'service', 'packaging', 'cleaning', 'other', 'maintenance']) for (const nom of noms) for (const cat of ['', 'other_stock', 'yeast', 'machin']) {
      const c = neuf(nom, kind, cat);
      const famille = familleDe({ nom, kind: scanKind(kind), contexte: contexteDe({ description: nom, kind: scanKind(kind), reference: '', stockCategory: undefined } as any) });
      expect(STOCK_CATEGORIES.includes(c) || (c === 'Divers' && famille === 'autres'), `${nom} / ${kind} / ${cat} → ${c} (famille ${famille})`).toBe(true);
    }
  });

  it('un houblon est reconnu à son nom du catalogue, pas à son « % » : Milchsäure 80 % et Phosphorsäure 75 % ne sont pas des houblons', () => {
    expect(familleDe({ nom: 'Milchsäure 80 %', kind: 'stock' })).toBe('additif');
    expect(familleDe({ nom: 'Phosphorsäure 75 %', kind: 'stock' })).toBe('additif');
    expect(familleDe({ nom: 'Produit fictif 9.6%', kind: 'stock' })).toBe('autres');
    expect(familleDe({ nom: 'Motueka 7%', kind: 'stock' })).toBe('houblon');
    expect(familleDe({ nom: 'Crystal Malt 150 EBC', kind: 'stock' })).toBe('malt');
  });
});
