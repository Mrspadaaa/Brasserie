/**
 * Voie s6-fiche : la règle unique « même produit, donnée qui diffère » (D215, D216), exportée par stockLineMatching.ts.
 * Les trois premiers tests (R1, R6, R11) sont les témoins : ils passent par les exports d'avant (`voisinDe`, `matchStockLine`) et échouent sur HEAD par leur comportement.
 */
import { describe, expect, it } from 'vitest';
import { memeProduit, voisinDe } from '../../../../src/ui/depense/etat';
import { matchStockLine } from '../../../../src/services/stockLineMatching';
import * as regle from '../../../../src/services/stockLineMatching';

const item = (ref: string, name: string, category: string, unit: string, more: Record<string, unknown> = {}) => ({ id: ref, ref, name, category, unit, currentStock: 10, minStock: 0, reorder: false, ...more }) as any;
const ligne = (description: string, unit = 'g', more: Record<string, unknown> = {}) => ({ description, unit, quantity: 40, ...more }) as any;

describe('témoins sur HEAD : ce que la règle d’aujourd’hui ne voit pas', () => {
  it('R1 origine : « Cascade CH » face à « Cascade US » a un voisin (aujourd’hui : rien, la ligne n’a pas d’α)', () => {
    const stock = [item('C', 'Cascade US', 'Houblon', 'g')];
    expect(voisinDe(ligne('Cascade CH'), stock)?.ref).toBe('C');
  });
  it('R6 retrouver : « Target 11.3% » est reliée à « Target bis » (alphaPct 11,3) et pas à « Target » (α 11,8)', () => {
    const stock = [item('T', 'Target', 'Houblon', 'g', { alphaPct: 11.8 }), item('B', 'Target bis', 'Houblon', 'g', { alphaPct: 11.3 })];
    expect(matchStockLine(ligne('Target 11.3%'), stock)?.item.ref).toBe('B');
  });
  it('R11 famille : « Cascade 8% » a pour voisin « Houblon Cascade 6% » (aujourd’hui : nom propre différent)', () => {
    const stock = [item('C', 'Houblon Cascade 6%', 'Houblon', 'g')];
    expect(voisinDe(ligne('Cascade 8%'), stock)?.ref).toBe('C');
  });
});

describe('T5 : « bis » n’est retiré des jetons que d’un article qui porte une donnée écrite par S6', () => {
  it('« Target bis » nu (créé à la main) : jamais relié à « Target 11.3% »', () => {
    expect(matchStockLine(ligne('Target 11.3%'), [item('B', 'Target bis', 'Houblon', 'g')])).toBeUndefined();
  });
  it('« Target bis » à alphaPct 11,3 : relié ; à alphaPct 11,8 : refusé', () => {
    expect(matchStockLine(ligne('Target 11.3%'), [item('B', 'Target bis', 'Houblon', 'g', { alphaPct: 11.3 })])?.item.ref).toBe('B');
    expect(matchStockLine(ligne('Target 11.3%'), [item('B', 'Target bis', 'Houblon', 'g', { alphaPct: 11.8 })])).toBeUndefined();
  });
  it('« Target bis 2 » à alphaPct 12 est retrouvé par « Target 12% »', () => {
    expect(matchStockLine(ligne('Target 12%'), [item('B', 'Target bis 2', 'Houblon', 'g', { alphaPct: 12 })])?.item.ref).toBe('B');
  });
  it('« Cascade » à origin CH est retrouvé par « Cascade CH », pas par « Cascade US »', () => {
    const stock = [item('C', 'Cascade', 'Houblon', 'g', { origin: 'CH' })];
    expect(matchStockLine(ligne('Cascade CH'), stock)?.item.ref).toBe('C');
    expect(matchStockLine(ligne('Cascade US'), stock)).toBeUndefined();
  });
});

describe('la règle : cinq cas', () => {
  const R = (l: any, stock: any[], brouillon: any[] = []) => (regle as any).regleProduit(l, stock, brouillon);
  const T = item('T', 'Target', 'Houblon', 'g', { alphaPct: 11.8 });
  it('inconnu : famille vide, nom propre', () => {
    expect(R(ligne('Sabro® 13.4%'), [T])).toMatchObject({ cas: 'inconnu', nom: 'Sabro' });
    expect(R(ligne('Maris Otter, Kg', 'Kg', { quantity: 6 }), [])).toMatchObject({ cas: 'inconnu', nom: 'Maris Otter' });
  });
  it('neuf (α) : « Target bis », puis « Target bis 2 » avec un membre virtuel ou un bis déjà au stock', () => {
    expect(R(ligne('Target 11.3%'), [T])).toMatchObject({ cas: 'neuf', nom: 'Target bis', motif: 'bis', ecarts: ['alpha'] });
    expect(R(ligne('Target 12.5%'), [T, item('B', 'Target bis', 'Houblon', 'g', { alphaPct: 11.3 })])).toMatchObject({ cas: 'neuf', nom: 'Target bis 2' });
    expect(R(ligne('Target 12%'), [T], [{ nom: 'Target bis' }])).toMatchObject({ cas: 'neuf', nom: 'Target bis 2' });
  });
  it('neuf (origine) : « Cascade CH » ; nom pris par un autre α : « Cascade CH bis »', () => {
    const US = item('U', 'Cascade US', 'Houblon', 'g');
    expect(R(ligne('Cascade CH'), [US])).toMatchObject({ cas: 'neuf', nom: 'Cascade CH', motif: 'origine', ecarts: ['origine'] });
    expect(R(ligne('Cascade CH 6%'), [US, item('H', 'Cascade', 'Houblon', 'g', { origin: 'CH', alphaPct: 8 })])).toMatchObject({ cas: 'neuf', nom: 'Cascade CH bis' });
  });
  it('neuf : Hallertauer Blanc CH face à « Hallertauer Blanc DE 9.5% » ; α seul : « bis », l’origine lue est gardée', () => {
    expect(R(ligne('Hallertauer Blanc 9.5% CH'), [item('H', 'Hallertauer Blanc DE 9.5%', 'Houblon', 'g')])).toMatchObject({ cas: 'neuf', nom: 'Hallertauer Blanc CH', motif: 'origine' });
    expect(R(ligne('Hallertauer Blanc 9.5% CH'), [item('H', 'Hallertauer Blanc', 'Houblon', 'g', { alphaPct: 9 })])).toMatchObject({ cas: 'neuf', nom: 'Hallertauer Blanc bis', motif: 'bis' });
  });
  it('neuf (EBC) : « Münchner Malz 15 EBC » face à colorEbc 20 → « bis » ; 20 → même article', () => {
    const M = item('M', 'Münchner Malz', 'Malt', 'kg', { colorEbc: 20 });
    expect(R(ligne('Münchner Malz 15 EBC', 'kg', { quantity: 5 }), [M])).toMatchObject({ cas: 'neuf', nom: 'Münchner Malz bis', ecarts: ['ebc'] });
    expect(R(ligne('Münchner Malz 20 EBC', 'kg', { quantity: 5 }), [M]).cas).not.toBe('neuf');
    // 0,5 point d'écart : sous le seuil de 1 point, pas un écart
    expect(R(ligne('Münchner Malz 20.5 EBC', 'kg', { quantity: 5 }), [M]).cas).not.toBe('neuf');
  });
  it('incertain : une donnée connue d’un seul côté, aucun lien automatique (lignes 11 et 13 du plan)', () => {
    expect(R(ligne('Hallertauer Blanc 9.0% CH'), [item('H', 'Hallertauer Blanc', 'Houblon', 'g', { alphaPct: 9 })])).toMatchObject({ cas: 'incertain', nom: 'Hallertauer Blanc CH' });
    expect(R(ligne('Münchner Malz 15 EBC', 'kg', { quantity: 5 }), [item('M', 'Münchner Malz', 'Malt', 'kg')])).toMatchObject({ cas: 'incertain', nom: 'Münchner Malz bis' });
  });
  it('ambigu : « Target » sans α face à Target et Target bis ; le nom est libre', () => {
    const stock = [T, item('B', 'Target bis', 'Houblon', 'g', { alphaPct: 11.3 })];
    expect(R(ligne('Target'), stock)).toMatchObject({ cas: 'ambigu', nom: 'Target bis 2' });
  });
  it('famille sur les jetons : « Houblon Cascade 6% » est de la famille de « Cascade 8% » (nom « Cascade bis »), « Cascade Cryo » non', () => {
    expect(R(ligne('Cascade 8%'), [item('C', 'Houblon Cascade 6%', 'Houblon', 'g')])).toMatchObject({ cas: 'neuf', nom: 'Cascade bis' });
    expect(R(ligne('Cascade Cryo 8%'), [item('C', 'Cascade 6%', 'Houblon', 'g')]).cas).toBe('inconnu');
  });
  it('un ancien « Münchner Malz 20 EBC » (EBC lu dans le nom) est de la famille', () => {
    expect(R(ligne('Münchner Malz 15 EBC', 'kg', { quantity: 5 }), [item('M', 'Münchner Malz 20 EBC', 'Malt', 'kg')])).toMatchObject({ cas: 'neuf', nom: 'Münchner Malz bis' });
  });
  it('levure : un poids de sachet connu des deux côtés qui diffère garde le libellé (le poids est déjà dans le nom)', () => {
    const r = R(ligne('Safale US-05 11,5g', 'Stk', { quantity: 2 }), [item('Y', 'Safale US-05 11 g', 'Levure', 'sachet')]);
    expect(r).toMatchObject({ cas: 'neuf', nom: 'Safale US-05 11,5g' });
  });
  it('hors houblon et malt : le libellé reste, sans suffixe inutile', () => {
    expect(R(ligne('Étiquettes autocollantes', 'pce', { quantity: 100, kind: 'packaging' }), []).nom).toBe('Étiquettes autocollantes');
  });
});

describe('R7 : « matchStockLine relie » implique « meme » du même article', () => {
  const stock = [
    item('T', 'Target', 'Houblon', 'g', { alphaPct: 11.8 }), item('G', 'Galaxy', 'Houblon', 'g'), item('B', 'Target bis', 'Houblon', 'g', { alphaPct: 11.3 }),
    item('C', 'Cascade', 'Houblon', 'g', { origin: 'CH' }), item('M', 'Münchner Malz', 'Malt', 'kg', { colorEbc: 20 }), item('P', 'Pilsner Malz', 'Malt', 'kg'),
    item('MO', 'Maris Otter', 'Malt', 'kg'), item('Y', 'Safale US-05', 'Levure', 'sachet'), item('W', 'LALLEMAND Windsor', 'Levure', 'sachet'), item('H', 'Hallertauer Blanc DE 9.5%', 'Houblon', 'g'),
  ];
  const lignes: Array<[string, string, number]> = [
    ['Target 11.3%', 'g', 40], ['Target 11.8%', 'g', 40], ['Target 12%', 'g', 40], ['Target', 'g', 40], ['Galaxy 17.2%', 'g', 60], ['Galaxy', 'g', 60], ['Cascade CH', 'g', 30], ['Cascade US', 'g', 30],
    ['Cascade', 'g', 30], ['Münchner Malz 20 EBC', 'kg', 5], ['Münchner Malz 15 EBC', 'kg', 5], ['Münchner Malz', 'kg', 5], ['Pilsner Malz, Kg', 'Kg', 5], ['Pilsner Malz 3 EBC', 'kg', 5], ['Maris Otter, Kg', 'Kg', 6],
    ['Maris Otter', 'kg', 6], ['Safale US-05 11,5g', 'Stk', 2], ['Safale US-05 500 g', 'Stk', 2], ['LALLEMAND Windsor 11g', 'Stk', 2], ['Windsor', 'Stk', 2], ['Hallertauer Blanc 9.5% CH', 'g', 30], ['Hallertauer Blanc 9.5%', 'g', 30],
    ['Hallertauer Blanc DE 9.5%', 'g', 30], ['Hallertauer Blanc', 'g', 30], ['Sabro® 13.4%', 'g', 30], ['Houblon Galaxy 17.2%', 'g', 60], ['Pilsner', 'kg', 5], ['Target bis', 'g', 40], ['Cascade Cryo', 'g', 30],
    ['Münchner Malz hell', 'kg', 5], ['Gerstenflocken, 1 Kg', 'Kg', 1], ['Röstgerste, Kg', 'Kg', 1], ['Galaxy 17.2% CH', 'g', 60], ['Galaxy 16%', 'g', 60], ['Target 11.3% US', 'g', 40], ['Cascade 8%', 'g', 30],
    ['Münchner Malz 20.4 EBC', 'kg', 5], ['Pilsner Malz', 'kg', 5], ['Safale US-05', 'Stk', 2], ['Safale US-05 11 g', 'Stk', 2],
  ];
  it(`${lignes.length} paires : la règle ne contredit jamais s1`, () => {
    expect(lignes.length).toBeGreaterThanOrEqual(40);
    for (const [description, unit, quantity] of lignes) {
      const l = ligne(description, unit, { quantity });
      const s1 = matchStockLine(l, stock);
      const r = (regle as any).regleProduit(l, stock);
      if (s1) { expect(r.cas, description).toBe('meme'); expect(r.article.ref, description).toBe(s1.item.ref); }
      else expect(r.cas, description).not.toBe('meme');
    }
  });
  it('memeProduit (R6) ne relie que ce que s1 relie', () => {
    expect(memeProduit('Galaxy 17.2%', 'g', stock)?.ref).toBe('G');
    expect(memeProduit('Hallertauer Blanc 9.0% CH', 'g', [item('H', 'Hallertauer Blanc', 'Houblon', 'g', { alphaPct: 9 })])).toBeUndefined();
    expect(memeProduit('Münchner Malz 15 EBC', 'kg', [item('M', 'Münchner Malz', 'Malt', 'kg')])).toBeUndefined();
  });
});

describe('tri n° 2 (R2) : le fournisseur de la facture voyage jusqu’à la règle (passe 2 de s1)', () => {
  it('« Cascade du Banc » chez « Malterie du Banc » : reliée à « Cascade » quand le brouillon donne son fournisseur, pas sans lui', async () => {
    const { ligneDeBrouillon } = await import('../../../../src/domain/stock/articleNeuf');
    const stock = [item('C', 'Cascade', 'Houblon', 'g')];
    const brut = { description: 'Cascade du Banc', unit: 'g', quantity: 30, kind: 'ingredient' };
    expect(matchStockLine(ligneDeBrouillon(brut, 'Malterie du Banc'), stock)?.item.ref).toBe('C');
    expect(((regle as any).regleProduit(ligneDeBrouillon(brut, 'Malterie du Banc'), stock)).cas).toBe('meme');
    expect(matchStockLine(ligneDeBrouillon(brut), stock)).toBeUndefined();
    expect(ligneDeBrouillon(brut, '  ').vendor).toBeUndefined();
  });
});
