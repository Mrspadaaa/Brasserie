// @vitest-environment jsdom
/**
 * JUS-1 (#105) — appariement des lignes lues avec le stock (M4) et catégorie canonique (M3).
 * Données synthétiques « du Banc ».
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { canonicalStockCategory, proposeStockItem } from '../../src/services/stockLineMatching';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { seedQa } from '../qa/hop-recipe/repo';
import type { StockItem } from '../../src/types';

vi.mock('../../src/services/firestoreRepo', () => import('../qa/hop-recipe/repo'));
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));

const item = (ref: string, name: string, category = 'Malt', unit = 'kg'): StockItem => ({ id: ref, ref, name, category, unit, currentStock: 1, minStock: 0, reorder: false });
// Les lignes viennent d'un justificatif de la Malterie du Banc : son nom peut figurer dans celui d'un article.
const line = (description: string, unit = 'Kg', quantity: number | undefined = 1, vendor = 'Malterie du Banc SA') => ({ description, unit, quantity, vendor });

describe('catégorie de stock canonique', () => {
  it('ramène casse, accents, pluriels et allemand aux catégories de l’app', () => {
    expect(['malt', 'MALTS', 'Malz', 'céréales', 'houblon', 'Hopfen', 'levures', 'hefe', 'desinfectant', 'cip ALCALIN', 'epi'].map(canonicalStockCategory))
      .toEqual(['Malt', 'Malt', 'Malt', 'Malt', 'Houblon', 'Houblon', 'Levure', 'Levure', 'Désinfectant', 'CIP alcalin', 'EPI']);
  });
  it('garde une catégorie inconnue, initiale en capitale, et une valeur vide', () => {
    expect(canonicalStockCategory('épices du Banc')).toBe('Épices du Banc');
    expect(['constructor', 'toString', '__proto__'].map(canonicalStockCategory)).toEqual(['Constructor', 'ToString', '__proto__']);
    expect(canonicalStockCategory('  ')).toBe('');
    expect(canonicalStockCategory(undefined)).toBe('');
  });
});

describe('proposition d’un article existant pour une ligne lue', () => {
  const stock = [item('banc-fume', 'Malt fumé du Banc'), item('banc-froment', 'Froment du Banc'), item('banc-h', 'Houblon Cascade du Banc', 'Houblon', 'g'), item('banc-l', 'Levure sèche du Banc', 'Levure', 'sachet')];
  it('reconnaît un libellé en capitales sans accents', () => {
    expect(proposeStockItem(line('MALT FUME DU BANC'), stock)?.ref).toBe('banc-fume');
  });
  it('convertit l’unité lue : des grammes de houblon vont sur l’article en g, pas des kilos sur un sachet', () => {
    expect(proposeStockItem(line('Cascade pellets', 'g', 100), stock)?.ref).toBe('banc-h');
    expect(proposeStockItem(line('Levure sèche', 'kg', 1), stock)).toBeUndefined();
  });
  it('ne propose rien sur un mot générique seul, sans quantité ou sans unité', () => {
    expect(proposeStockItem(line('Malt'), stock)).toBeUndefined();
    expect(proposeStockItem(line('Malt pâle', 'Kg', undefined), stock)).toBeUndefined();
    expect(proposeStockItem(line('Malt fumé', ''), stock)).toBeUndefined();
    expect(proposeStockItem(line('Seigle maltés du Moulin'), stock)).toBeUndefined();
  });
  it('ne propose pas un article dont une précision contredit la ligne, ni sur la seule catégorie ou un mot court inclus', () => {
    const shelf = [item('sucre-roux', 'Sucre roux du Banc', 'Sucre'), item('acide', 'Acide phosphorique', 'CIP acide', 'L'), item('bouteilles', 'Bouteilles 33 cl', 'Emballage', 'pièce'), item('pale', 'Pale du Banc')];
    expect(proposeStockItem(line('Sucre candi', 'kg', 2), shelf)).toBeUndefined();
    expect(proposeStockItem(line('Acide citrique', 'L', 1), shelf)).toBeUndefined();
    expect(proposeStockItem(line('Emballage carton', 'pièce', 2), shelf)).toBeUndefined();
    expect(proposeStockItem(line('Ale anglaise'), shelf)).toBeUndefined();
    expect(proposeStockItem(line('Sucre roux 25kg', 'kg', 25), shelf)?.ref).toBe('sucre-roux');
  });
  it('préfère l’article le mieux couvert et s’abstient sur une égalité', () => {
    const twins = [item('a', 'Froment Banc'), item('b', 'Froment Banc clair')];
    expect(proposeStockItem(line('Froment Banc 5 kg'), twins)?.ref).toBe('a');
    // Correction V3 : sans fournisseur, « Banc » et « Moulin » sont des précisions que la ligne n'a pas ; avec le
    // justificatif de la Malterie du Banc, son froment est proposé ; deux articles identiques restent une égalité.
    expect(proposeStockItem(line('Froment', 'Kg', 1, ''), [item('a', 'Froment Banc'), item('b', 'Froment Moulin')])).toBeUndefined();
    expect(proposeStockItem(line('Froment'), [item('a', 'Froment Banc'), item('b', 'Froment Moulin')])?.ref).toBe('a');
    expect(proposeStockItem(line('Froment'), [item('a', 'Froment'), item('b', 'Froment')])).toBeUndefined();
  });
});

describe('Correction V3 n° 1 : mots composés, références chiffrées, articles plus précis (B-V3-2, m-b)', () => {
  it('un malt Cara- ne reçoit pas le malt de base : le reste du mot composé n’est pas générique', () => {
    expect(proposeStockItem(line('Munich Malt 25 kg', 'kg', 25), [item('cara-m', 'Malt Caramunich')])).toBeUndefined();
    expect(proposeStockItem(line('Vienna Malt', 'kg', 25), [item('cara-v', 'Malt Caravienna')])).toBeUndefined();
    expect(proposeStockItem(line('Aroma Malt', 'kg', 5), [item('cara-a', 'Caraaroma du Banc')])).toBeUndefined();
    expect(proposeStockItem(line('Amber Malt', 'kg', 5), [item('cara-b', 'Malt Caraamber')])).toBeUndefined();
    expect(proposeStockItem(line('Malz Hell', 'kg', 5), [item('cara-h', 'Malt Carahell')])).toBeUndefined();
  });
  it('témoins justes : vrai Munich au stock, Caramunich lu, reste générique ou mots séparés', () => {
    const shelf = [item('cara-m', 'Malt Caramunich'), item('munich', 'Malt Munich')];
    expect(proposeStockItem(line('Munich Malt 25 kg', 'kg', 25), shelf)?.ref).toBe('munich');
    expect(proposeStockItem(line('CARAMUNICH 25 kg', 'kg', 25), shelf)?.ref).toBe('cara-m');
    expect(proposeStockItem(line('Cara Munich', 'kg', 5), shelf)?.ref).toBe('cara-m');
    expect(proposeStockItem(line('Roggenmalz', 'kg', 25), [item('rog', 'Malt Roggen')])?.ref).toBe('rog');
    expect(proposeStockItem(line('Roggen Malz', 'kg', 25), [item('rog', 'Roggenmalz')])?.ref).toBe('rog');
  });
  it('un nombre de la référence ne suffit pas à reconnaître un article', () => {
    expect(proposeStockItem(line('Malt 500', 'kg', 5), [item('MP-500', 'Froment du Banc')])).toBeUndefined();
  });
  it('un article plus précis que la ligne n’est pas proposé, sauf si son mot en plus est le nom du fournisseur', () => {
    const cryo = item('cryo', 'Houblon Cascade Cryo', 'Houblon', 'g');
    expect(proposeStockItem(line('Cascade', 'g', 100), [cryo])).toBeUndefined();
    // Un mot porté par d'autres articles reste une précision : « Cryo », « Extra ».
    expect(proposeStockItem(line('Cascade', 'g', 100), [cryo, item('amarillo', 'Houblon Amarillo Cryo', 'Houblon', 'g')])).toBeUndefined();
    expect(proposeStockItem(line('Roggen Malz', 'kg', 25), [item('rog-x', 'Malt Roggen Extra'), item('munich-x', 'Malt Munich Extra')])).toBeUndefined();
    expect(proposeStockItem(line('Cascade pellets', 'g', 100, ''), [item('banc-h', 'Houblon Cascade du Banc', 'Houblon', 'g')])).toBeUndefined();
    expect(proposeStockItem(line('Cascade', 'g', 100), [cryo, item('cascade', 'Houblon Cascade', 'Houblon', 'g')])?.ref).toBe('cascade');
    expect(proposeStockItem(line('Cascade Cryo', 'g', 100), [cryo])?.ref).toBe('cryo');
    expect(proposeStockItem(line('Roggen Malt', 'kg', 25), [{ ...item('rog', 'Malt Roggen Moulin'), supplier: 'Moulin du Banc SA' }])?.ref).toBe('rog');
    expect(proposeStockItem(line('Sucre candi', 'kg', 2), [item('sucre', 'Sucre', 'Sucre')])).toBeUndefined();
  });
  it('un code de souche ou de variété départage deux articles', () => {
    expect(proposeStockItem(line('Levure du Banc LB-04', 'g', 500), [item('lb05', 'Levure du Banc LB-05', 'Levure', 'g')])).toBeUndefined();
    expect(proposeStockItem(line('Magnum T90', 'g', 100), [item('t45', 'Magnum T45', 'Houblon', 'g')])).toBeUndefined();
    expect(proposeStockItem(line('WLP001 California Ale', 'g', 1), [item('wlp2', 'WLP002 California Ale', 'Levure', 'g')])).toBeUndefined();
    expect(proposeStockItem(line('LEVURE DU BANC LB-04 11,5 g', 'g', 23), [item('lb05', 'Levure du Banc LB-05', 'Levure', 'g'), item('lb04', 'Levure du Banc LB-04', 'Levure', 'g')])?.ref).toBe('lb04');
  });
});

describe('Correction V3 n° 2 : correspondance sûre', () => {
  // B-V3-3, ARB-M4 : cas de la sonde de l'arbitre (V-*, W-*, I-*), sans fournisseur sauf mention ; nom synthétique quand
  // celui de la sonde figure dans un justificatif réel, structure du cas inchangée. Une précision de la ligne absente de
  // l'article empêche la proposition au lieu d'être ignorée : le brasseur choisit ou crée l'article.
  type Case = { id: string; d: string; items: StockItem[]; want: string | undefined; unit: string; qty: number; vendor: string };
  const c = (id: string, d: string, items: StockItem[], want: string | undefined, unit = 'kg', qty = 1, vendor = ''): Case => ({ id, d, items, want, unit, qty, vendor });
  const none = (id: string, d: string, items: StockItem[], unit?: string, qty?: number) => c(id, d, items, undefined, unit, qty);
  const hop = (ref: string, name: string) => item(ref, name, 'Houblon', 'g');
  const yeast = (ref: string, name: string, unit = 'g') => item(ref, name, 'Levure', unit);
  const piece = (ref: string, name: string, category = 'Emballage') => item(ref, name, category, 'pièce');
  const caraShelf = [item('cara-m', 'Malt Caramunich'), item('munich', 'Malt Munich')];
  const BANC = 'Malterie du Banc SA';
  const check = (cases: Case[]) => cases.forEach(k => it(`${k.id} : « ${k.d} » → ${k.want ?? 'rien'}`, () => {
    expect(proposeStockItem(line(k.d, k.unit, k.qty, k.vendor), k.items)?.ref).toBe(k.want);
  }));

  it('rien sans quantité reçue, même sur un nom identique', () => {
    const shelf = [item('P', 'Malt Blond')];
    expect(proposeStockItem(line('Malt Blond', 'kg', 1, ''), shelf)?.ref).toBe('P');
    expect(proposeStockItem(line('Malt Blond', 'kg', 0, ''), shelf)).toBeUndefined();
    expect(proposeStockItem({ description: 'Malt Blond', unit: 'kg', vendor: '' }, shelf)).toBeUndefined();
  });

  describe('négatifs : rien n’est proposé', () => check([
    ...['Munich', 'Vienna', 'Aroma', 'Amber', 'Hell'].flatMap(n => [
      none(`V-cara-${n}`, `Cara ${n}`, [item('MP-9', `Malt ${n}`)]),
      none(`V-cara-${n}-tiret`, `Cara-${n}`, [item('MP-9', `Malt ${n}`)])
    ]),
    none('V-cryo', 'Cascade Cryo', [hop('H', 'Houblon Cascade')], 'g'),
    none('V-choc', 'Chocolate Wheat', [item('W', 'Malt Wheat')]),
    none('V-dunkel', 'Munich Dunkel', [item('M', 'Malt Munich')]),
    none('V-wyeast', 'Wyeast 1056', [yeast('Y', 'Wyeast 1968')], 'g'),
    none('V-wyeast-long', 'Wyeast 1056 American Ale', [yeast('Y', 'Wyeast 1968')], 'g'),
    // La ligne a moins que l'article : choix manuel (l'article est plus précis).
    none('V-wyeast-moins', 'Wyeast 1056', [yeast('Y', 'Wyeast 1968'), yeast('Y2', 'Wyeast 1056 American Ale')], 'g'),
    none('I-carafa-3v2', 'Carafa III', [item('C2', 'Malt Carafa II')]),
    none('I-carafa-2v3', 'Carafa II', [item('C3', 'Malt Carafa III')]),
    none('I-carafa-sp2v2', 'Carafa Special II', [item('C2', 'Malt Carafa II')]),
    none('I-carafa-2vsp', 'Carafa II', [item('CS', 'Carafa Special II')]),
    none('I-crystal-60v120', 'Crystal 60', [item('K', 'Crystal 120')]),
    none('I-crystal-60Lv120L', 'Crystal 60L', [item('K', 'Malt Crystal 120L')]),
    none('I-crystal-ebc', 'Crystal 150 EBC', [item('K', 'Crystal 300 EBC')]),
    none('I-tettnang-blanc', 'Tettnang Blanc', [hop('H', 'Houblon Tettnang')], 'g'),
    none('I-fume-munich', 'Munich Buchen', [item('M', 'Malt Munich')]),
    none('I-fumemalz-vs-munich', 'Buchenmalz', [item('M', 'Malt Munich')]),
    none('I-sauer', 'Blond Sauer', [item('P', 'Malt Blond')]),
    none('I-us05-vs-s04', 'Fermbanc US-05', [yeast('S', 'Fermbanc S-04', 'sachet')], 'sachet'),
    // À la pièce, « 50 cl », « 30 L » ou « 10 kg » nomment l'article, pas la quantité reçue.
    none('I-bouteilles-50v33', 'Bouteilles 50 cl', [piece('B33', 'Bouteilles 33 cl')], 'pièce', 24),
    none('I-fut-30v20', 'Fût inox 30 L', [piece('F20', 'Fût inox 20 L')], 'pièce'),
    none('I-co2-10v6', 'Bouteille CO2 10 kg', [piece('CO2', 'Bouteille CO2 6 kg', 'Consommable')], 'pièce'),
    none('I-acide-75v85', 'Acide phosphorique 75%', [item('A', 'Acide phosphorique 85%', 'CIP acide', 'L')], 'L', 20),
    none('I-bio', 'Blond bio', [item('P', 'Malt Blond')]),
    none('I-seche', 'Levure sèche US-05', [yeast('S', 'Levure US-05', 'sachet')], 'sachet'),
    none('I-tie', 'Blond', [item('P1', 'Malt Blond'), item('P2', 'Blond Malt')])
  ]));

  describe('positifs', () => check([
    c('V-cara-present', 'Cara Munich', caraShelf, 'cara-m'),
    c('I-dunkel-ok', 'Munich Dunkel', [item('M', 'Malt Munich'), item('MD', 'Malt Munich Dunkel')], 'MD'),
    c('V-wyeast-exact', 'Wyeast 1056', [yeast('Y', 'Wyeast 1968'), yeast('Y1', 'Levure Wyeast 1056')], 'Y1', 'g'),
    c('I-carafa-both', 'Carafa II', [item('C2', 'Malt Carafa II'), item('C3', 'Malt Carafa III')], 'C2'),
    c('I-crystal-ok', 'Crystal 60', [item('K60', 'Malt Crystal 60'), item('K120', 'Malt Crystal 120')], 'K60'),
    c('I-bouteilles-33', 'Bouteilles 33 cl', [piece('B33', 'Bouteilles 33 cl'), piece('B50', 'Bouteilles 50 cl')], 'B33', 'pièce', 24),
    c('I-fumemalz', 'Buchenmalz', [item('R', 'Malt Buchen')], 'R'),
    c('I-sauermalz', 'Sauermalz', [item('S', 'Malt Sauer')], 'S'),
    c('I-inverse', 'Malt Munich', [item('M', 'Munich Malt')], 'M'),
    c('I-inverse-marque', 'Blond Weyermann', [item('P', 'Weyermann Blond')], 'P'),
    c('I-us05-code', 'US-05', [yeast('S', 'Levure US-05', 'sachet')], 'S', 'sachet'),
    // Dans la famille d'unité de la ligne, « 25 kg » ou « 20 L » est la quantité reçue, pas l'identité.
    c('I-sac-25', 'Malt Blond 25 kg', [item('P', 'Malt Blond')], 'P', 'kg', 25),
    c('I-sac-25-item', 'Blond', [item('P', 'Malt Blond 25 kg')], 'P', 'kg', 25),
    c('I-acide-20v5', 'Acide phosphorique 20 L', [item('A', 'Acide phosphorique 5 L', 'CIP acide', 'L')], 'A', 'L', 20),
    c('I-vendor-line', 'Cascade du Banc', [hop('H', 'Houblon Cascade')], 'H', 'g', 100, BANC),
    c('I-doc5-kg', 'Orge Oberland, kg', [item('MO', 'Orge Oberland')], 'MO', 'kg', 6),
    c('I-doc5-accent', 'Örge Obérland', [item('MO', 'Orge Oberland')], 'MO', 'kg', 6),
    c('I-glue-false', 'Pale Ale', [item('PA', 'Malt Pale Ale'), item('P', 'Malt Pale')], 'PA'),
    c('I-unit', 'Cascade', [hop('H', 'Houblon Cascade'), item('HK', 'Houblon Cascade', 'Houblon', 'sachet')], 'H', 'g', 100)
  ]));

  describe('témoins du relecteur', () => check([
    c('W-R1c', 'Blond Malt 25 kg', [item('P', 'Malt Blond')], 'P', 'kg', 25),
    c('W-R2', 'Cascade T90 Pellets', [hop('H', 'Houblon Cascade')], 'H', 'g'),
    c('W-R2b', 'Cascade T-90', [hop('H', 'Houblon Cascade')], 'H', 'g'),
    c('W-munich', 'Munich Malt', caraShelf, 'munich'),
    c('W-caramunich', 'Caramunich', caraShelf, 'cara-m'),
    c('W-s04', 'Levure S-04', [yeast('L1', 'Levure du Banc S-05', 'sachet'), yeast('L2', 'Levure du Banc S-04', 'sachet')], 'L2', 'sachet', 1, BANC),
    c('W-suisse', 'Cascade', [hop('H1', 'Houblon Cascade Suisse')], 'H1', 'g', 1, 'Houblons Suisse SA')
  ]));

  // Pertes de rappel assumées (ARB-M4, mineur) : une marque ou une spécification de la ligne que l'article n'a pas est
  // une précision comme une autre ; l'ignorer rouvrirait B-V3-3 (« Cara » en est une ; « 150 EBC » et « 300 EBC »
  // nomment deux malts). Le brasseur choisit l'article dans la liste. Changer ces attentes demande une décision numérotée.
  describe('pertes assumées', () => check([
    none('W-R1-perte', 'Weyermann Blond 3-4 EBC', [item('P', 'Malt Blond')]),
    c('W-R1b', 'Weyermann Blond 3-4 EBC', [item('P', 'Weyermann Blond 3-4 EBC')], 'P'),
    none('W-tettnang-perte', 'Tettnang', [hop('H2', 'Tettnanger Mittelfrüh')], 'g'),
    none('I-us05-marque-perte', 'Fermentis US-05', [yeast('S', 'Levure US-05', 'sachet')], 'sachet')
  ]));

  // Décision 114 : le fournisseur de l'article ne s'efface que de son nom (F1) ; à la pièce, l'unité seule d'un nom
  // compte (F2). Une précision de la ligne ne disparaît plus parce qu'elle ressemble au nom d'un fournisseur.
  const sup = (row: StockItem, supplier: string): StockItem => ({ ...row, supplier });
  describe('suite F1/F2 : fournisseur de l’article et unité à la pièce', () => check([
    none('F1-cara', 'Cara Munich', [sup(item('M', 'Malt Munich'), 'Cara Malt SA')]),
    none('F1-cryo', 'Cascade Cryo', [sup(hop('H', 'Houblon Cascade'), 'Cryo Hops AG')], 'g'),
    none('F1-dunkel', 'Munich Dunkel', [sup(item('D', 'Malt Dunkel'), 'Munich Malt GmbH')]),
    c('F1-meme-fournisseur', 'Cascade du Banc', [sup(hop('H', 'Houblon Cascade du Banc'), BANC)], 'H', 'g', 100, BANC),
    c('F1-nom-article', 'Cascade', [sup(hop('H', 'Houblon Cascade Moulin'), 'Moulin SA')], 'H', 'g', 100),
    none('F2-bouteilles-cl-l', 'Bouteilles 50 cl', [piece('B', 'Bouteilles 50 l')], 'pièce', 24),
    none('F2-fut-l-kg', 'Fût inox 30 L', [piece('F', 'Fût inox 30 kg')], 'pièce'),
    none('F2-co2-kg-l', 'Bouteille CO2 10 kg', [piece('C', 'Bouteille CO2 10 L', 'Consommable')], 'pièce'),
    c('F2-bouteilles-cl', 'Bouteilles 50 cl', [piece('Bcl', 'Bouteilles 50 cl'), piece('Bl', 'Bouteilles 50 l')], 'Bcl', 'pièce', 24),
    // Un « l' » dans le nom du fournisseur est une liaison, pas l'unité du nom de l'article.
    c('F2-liaison-fournisseur', 'Fût inox 30 L', [sup(piece('F', 'Fût inox 30 L'), 'Verrerie de l’Ouest')], 'F', 'pièce')
  ]));
});

describe('Stocks : lecture tolérante des catégories déjà écrites en minuscules', () => {
  beforeEach(() => {
    localStorage.clear(); StorageService.clearMemoryCache();
    seedQa({ stockItems: [item('banc-old', 'Malt ancien du Banc', 'malt'), item('banc-new', 'Malt neuf du Banc', 'Malt')].map(row => ({ ...row, kind: 'rawMaterials' })) });
  });
  afterEach(cleanup);
  it('range « malt » et « Malt » dans un seul groupe, sans réécrire l’article', async () => {
    render(createElement(VirtuosoMockContext.Provider, { value: { viewportHeight: 1000, itemHeight: 54 } },
      createElement(StocksTab, { stocks: StorageService.getStocks(), batches: [], onOpenQuickAction: () => {} })));
    await screen.findByRole('button', { name: 'Ouvrir Malt ancien du Banc' });
    const headings = screen.getAllByText(/^malt$/i).filter(node => !node.closest('button'));
    expect(headings.map(node => node.textContent)).toEqual(['Malt']);
    expect(StorageService.getStocks().rawMaterials.find(row => row.ref === 'banc-old')?.category).toBe('malt');
    // L'en-tête de groupe porte le nombre d'articles à côté du nom.
    expect(headings[0].nextElementSibling).toHaveTextContent('2');
  });
});
