/**
 * Voie s1-stock — chasse étendue : les variantes de chaque règle du plan (PLAN.md § 10) et les cas de la revue des deux regards.
 * Données synthétiques. Attendu exact : `attendu` = référence proposée, `undefined` = aucune proposition.
 * Règle du pilote : une proposition perdue est permise, une fausse ne l'est pas ; dans le doute, rien.
 */
import { describe, expect, it } from 'vitest';
import { proposeStockItem } from '../../../../src/services/stockLineMatching';
import type { StockItem } from '../../../../src/types';

const item = (ref: string, name: string, category = 'Malt', unit = 'kg', extra: Partial<StockItem> = {}): StockItem =>
  ({ id: ref, ref, name, category, unit, currentStock: 1, minStock: 0, reorder: false, ...extra });
const hop = (ref: string, name: string, extra: Partial<StockItem> = {}) => item(ref, name, 'Houblon', 'g', extra);
const yeast = (ref: string, name: string, unit = 'sachet') => item(ref, name, 'Levure', unit);

interface Ligne { description: string; unit: string; quantity: number; vendor?: string; kind?: string; stockCategory?: string; reference?: string }
const l = (description: string, unit = 'kg', quantity = 25, extra: Partial<Ligne> = {}): Ligne => ({ description, unit, quantity, vendor: '', kind: 'ingredient', ...extra });
const ref = (ligne: Ligne, stock: StockItem[]) => proposeStockItem(ligne as never, stock)?.ref;

const cas = (id: string, ligne: Ligne, stock: StockItem[], attendu?: string) => ({ id, ligne, stock, attendu });
const joue = (titre: string, liste: ReturnType<typeof cas>[]) => describe(titre, () => {
  for (const k of liste) it(`${k.id} : « ${k.ligne.description} » ${k.ligne.quantity} ${k.ligne.unit} → ${k.attendu ?? 'rien'}`, () => expect(ref(k.ligne, k.stock)).toBe(k.attendu));
});

joue('R1 / R2 : un nombre n’est conditionnement que séparé du nom par une virgule ou un point médian ET s’il divise la quantité', [
  cas('E1', l('Carafa 3 Kg', 'kg', 3), [item('C', 'Malt Carafa')]),
  cas('E2', l('Carafa 3 Kg', 'kg', 6), [item('C', 'Malt Carafa')]),
  cas('E3', l('Haferflocken, 1 Kg', 'Kg', 2), [item('H', 'Haferflocken')], 'H'),
  cas('E3b', l('Gerstenflocken, 1 Kg', 'Kg', 1), [item('G', 'Gerstenflocken')], 'G'),
  cas('E3c', l('Haferflocken, 3 Kg', 'Kg', 2), [item('H', 'Haferflocken')]),
  cas('E4', l('Carafa, 2 Kg', 'kg', 2), [item('C1', 'Malt Carafa 1'), item('C', 'Malt Carafa')]),
  cas('E4b', l('CARAMÜNCH® Typ 2 Kg', 'Kg', 1), [item('T2', 'Caramünch Typ 2')], 'T2'),
  cas('E4c', l('CARAMÜNCH® Typ 1 Kg', 'Kg', 1), [item('T', 'Caramünch Typ')]),
  cas('E4d', l('CARAMÜNCH® Typ 3 Kg', 'Kg', 1), [item('T', 'Caramünch Typ')]),
  cas('E4e', l('CARAMÜNCH® Typ 2 Kg', 'Kg', 1), [item('T1', 'Caramünch Typ 1'), item('T3', 'Caramünch Typ 3')]),
  cas('E27', l('Malt Blond, 25 kg', 'kg', 25), [item('P', 'Malt Blond')], 'P'),
  cas('E27b', l('Malt Blond 25 kg', 'kg', 25), [item('P', 'Malt Blond')]),
  cas('E27c', l('Blond', 'kg', 25), [item('P', 'Malt Blond, 25 kg')], 'P')
]);

joue('R3 : la catégorie tranche, jamais l’unité', [
  cas('E5', l('Crystal', 'kg', 25), [hop('HC', 'Houblon Crystal')]),
  cas('E6', l('Crystal', 'kg', 25), [item('K', 'Malt Crystal')]),
  cas('E5b', l('Houblon Crystal', 'g', 100), [hop('HC', 'Houblon Crystal'), item('K', 'Malt Crystal')], 'HC'),
  cas('E5c', l('Hop Pellets Cascade', 'g', 100, { reference: 'MA0001' }), [hop('H', 'Cascade')]),
  cas('E5d', l('Cascade', 'g', 100, { stockCategory: 'malt' }), [hop('H', 'Cascade')]),
  cas('E5e', l('Cascade', 'g', 100, { reference: 'HO0102' }), [hop('H', 'Cascade')], 'H'),
  cas('E7', l('Acide lactique', 'L', 1), [item('A', 'Acide lactique', 'CIP acide', 'L')]),
  cas('E8', l('Sel', 'kg', 1), [item('S', 'Sel', 'Détergent', 'kg')]),
  cas('E8b', l('Détergent', 'kg', 1, { kind: 'cleaning' }), [item('D', 'Détergent', 'Détergent', 'kg')], 'D'),
  cas('E8c', l('Sucre candi', 'kg', 1, { kind: 'cleaning' }), [item('S', 'Sucre candi', 'Sucre', 'kg')]),
  cas('E8d', l('Cartons', 'pièce', 10, { kind: 'packaging' }), [item('C', 'Cartons', 'Malt', 'pièce')]),
  cas('E8e', l('Divers carton', 'pièce', 10, { kind: 'packaging' }), [item('C', 'Divers carton', 'Divers', 'pièce')], 'C')
]);

joue('R4 : l’α et la récolte sortent de l’identité ; différentes des deux côtés → rien', [
  cas('E10', l('Target 11.8%', 'g', 40), [hop('T', 'Target 11.3%')]),
  cas('E10b', l('Target 11.3%', 'g', 40), [hop('T', 'Target 11.3%')], 'T'),
  cas('E10c', l('Target 11.3%', 'g', 40), [hop('T', 'Target')], 'T'),
  cas('E10d', l('Target', 'g', 40), [hop('T', 'Target 11.3%')], 'T'),
  cas('E10e', l('Target 11.3%', 'g', 40), [hop('T', 'Target', { alphaPct: 11.3 })], 'T'),
  cas('E10f', l('Target 11.3%', 'g', 40), [hop('T', 'Target', { alphaPct: 12 })]),
  cas('E10g', l('Target 11.8%', 'g', 40), [hop('A', 'Target 11.3%'), hop('B', 'Target 12.4%')]),
  cas('E11', l('Cascade 2024', 'g', 100), [hop('H', 'Houblon Cascade 2023')]),
  cas('E11b', l('Cascade 2024', 'g', 100), [hop('H', 'Houblon Cascade')], 'H'),
  cas('E11c', l('Cascade 2024', 'g', 100), [hop('H', 'Houblon Cascade 2024')], 'H'),
  cas('E9', l('Acide phosphorique 75%', 'L', 20, { kind: 'cleaning' }), [item('A', 'Acide phosphorique 85%', 'CIP acide', 'L')]),
  cas('E9b', l('Acide phosphorique 75%', 'L', 20, { kind: 'cleaning' }), [item('A', 'Acide phosphorique 75%', 'CIP acide', 'L')], 'A'),
  cas('E26', l('Wyeast 2007', 'g', 125), [yeast('Y8', 'Wyeast 2008', 'g')]),
  cas('E26b', l('Wyeast 2007', 'g', 125), [yeast('Y7', 'Wyeast 2007', 'g')], 'Y7'),
  cas('E12', l('Goldings East Kent 5.5%', 'g', 20), [hop('G', 'East Kent Goldings')], 'G')
]);

joue('R5 : unités de pièce et poids du sachet (levure)', [
  cas('E13', l('Safale US-05 11,5g', 'Stk', 2), [yeast('U', 'Safale US-05')], 'U'),
  cas('E14', l('Safale US-05 11,5g', 'Stk', 2), [yeast('U', 'Safale US-05 500 g')]),
  cas('E15', l('Safale US-05', 'Stk', 2), [yeast('U', 'Safale US-05 11,5 g')]),
  cas('E16', l('Safale US-05 11,5 g', 'Stk', 2), [yeast('U', 'Safale US-05 11,5 g')], 'U'),
  cas('E16b', l('Safale US-05 11,5 g', 'sachet', 2), [yeast('U', 'Safale US-05 11.5g')], 'U'),
  cas('E16c', l('LEVURE DU BANC LB-04 11,5 g', 'g', 23, { vendor: 'Malterie du Banc SA' }), [item('lb04', 'Levure du Banc LB-04', 'Levure', 'g'), item('lb05', 'Levure du Banc LB-05', 'Levure', 'g')], 'lb04'),
  cas('E17', l('Bouchons', 'Stk', 100, { kind: 'packaging' }), [item('B', 'Bouchons', 'Emballage', 'sachet')]),
  cas('E18', l('Bouchons', 'Stk', 100, { kind: 'packaging' }), [item('B', 'Bouchons', 'Emballage', 'pce')], 'B'),
  cas('E18b', l('Safale US-05 11,5g', 'Stk', 2), [item('B', 'Safale US-05', 'Malt', 'sachet')]),
  cas('E18c', l('Safale US-05', 'Stk', 2), [yeast('U', 'Safale US-05', 'Stk')], 'U'),
  cas('E19', l('Safale US-05', 'kg', 1), [yeast('U', 'Safale US-05')])
]);

joue('R6 : le fournisseur du justificatif n’est pas une variante', [
  cas('E20a', l('Cara Munich', 'kg', 25), [item('M', 'Malt Munich', 'Malt', 'kg', { supplier: 'Cara Malt SA' })]),
  cas('E20b', l('Munich Rauch', 'kg', 25, { vendor: 'Rauch AG' }), [item('M', 'Malt Munich')]),
  cas('E20c', l('Munich Rauch', 'kg', 25, { vendor: 'Rauch AG' }), [item('M', 'Malt Munich'), item('MR', 'Malt Munich Rauch')], 'MR'),
  // s1b (31.10) : ce cas était « proposé » (REVUE-PLAN Co 10, passe 2 du fournisseur). Il devient « rien » : « rauch » décrit un malt fumé,
  // c'est un mot de la liste fermée `PRODUCT_DESCRIPTORS` jamais retiré du nom d'un article ; la sûreté gagne, une proposition est perdue.
  cas('E20d', l('Munich', 'kg', 25, { vendor: 'Rauch AG' }), [item('MR', 'Malt Munich Rauch')]),
  cas('E20e', l('Munich II', 'kg', 25, { vendor: 'Rauch AG' }), [item('MR', 'Malt Munich Rauch')]),
  cas('E20f', l('Cascade de la Malterie du Banc', 'g', 100, { vendor: 'Malterie du Banc SA' }), [hop('H', 'Houblon Cascade')], 'H')
]);

const CEREALES = ['avoine', 'hafer', 'oat', 'froment', 'ble', 'wheat', 'weizen', 'orge', 'gerste', 'barley', 'seigle', 'roggen', 'rye', 'epeautre', 'épeautre', 'dinkel', 'spelt', 'sarrasin', 'buchweizen', 'buckwheat', 'millet', 'hirse', 'sorgho', 'sorghum', 'triticale', 'mais', 'maïs', 'riz', 'reis', 'rice', 'kamut'];
joue('R8 : malté ≠ non malté pour une céréale qui existe crue (deux sens, une céréale par cas)', CEREALES.flatMap(c => [
  cas(`E21-${c}-malt`, l(`Malt de ${c}`, 'kg', 25), [item('X', c.charAt(0).toUpperCase() + c.slice(1))]),
  cas(`E21-${c}-cru`, l(c.charAt(0).toUpperCase() + c.slice(1), 'kg', 25), [item('X', `Malt de ${c}`)])
]));
joue('R8 : témoins (les deux côtés disent malt, ou aucun)', [
  cas('E21t1', l('Roggenmalz', 'kg', 25), [item('R', 'Malt Roggen')], 'R'),
  cas('E21t2', l('Weizenmalz hell, Kg', 'Kg', 2), [item('W', 'Weizenmalz hell')], 'W'),
  cas('E21t3', l('Munich', 'kg', 25), [item('M', 'Malt Munich')], 'M')
]);

joue('R7 / R9 / R10 : lovibond, annotation, fabricant', [
  cas('E25', l('Crystal 60L', 'kg', 25), [item('K', 'Malt Crystal 60')]),
  cas('E22', l('Cascade T90 (Cryo)', 'g', 100), [hop('H', 'Houblon Cascade')]),
  cas('E22b', l('Pilsner (bio)', 'kg', 25), [item('P', 'Malt Pilsner')]),
  cas('E23', l('Safale BE-256 (Abbaye) 11.5 g', 'Stk', 1), [yeast('B', 'Safale BE-256')], 'B'),
  cas('E23b', l('Safale (Abbaye)', 'Stk', 1), [yeast('B', 'Safale')]),
  cas('E24', l('LALLEMAND Verdant IPA 11g', 'Stk', 2), [yeast('V', 'Verdant IPA')], 'V'),
  cas('E24b', l('Lallemand Abbaye', 'Stk', 2), [yeast('A', 'Abbaye')]),
  cas('E24c', l('LALLEMAND Windsor 11g', 'Stk', 2), [yeast('W', 'LALLEMAND Windsor')], 'W'),
  cas('E24d', l('Fermentis Windsor 11g', 'Stk', 2), [yeast('W', 'Lallemand Windsor')], 'W')
]);

describe('lignes de service : jamais de proposition (mouture)', () => {
  it('« Zuschlag Schrotung » ne ressemble à aucun article', () => {
    const stock = [item('MO', 'Maris Otter'), item('P', 'Pilsner Malz'), item('R', 'Röstgerste')];
    expect(ref(l('Zuschlag Schrotung', 'Kg', 6, { kind: 'service' }), stock)).toBeUndefined();
  });
});
