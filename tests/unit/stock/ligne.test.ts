import { describe, expect, it } from 'vitest';
import type { StockItem } from '../../../src/types';
import type { ArticleACommander } from '../../../src/domain/stockLevel';
import { infoLigne } from '../../../src/domain/stock/liste';
import { barreLigne, etatDit, familleTeinte, familleTeinteGroupe, quantiteDeLigne, rayonDuGroupe, repereLigne } from '../../../src/domain/stock/ligne';

const art = (o: Partial<StockItem>): StockItem => ({ id: o.ref ?? 'x', ref: o.ref ?? 'x', name: 'A', category: 'Malt', unit: 'kg', currentStock: 1, reorder: false, ...o });
const vide = new Map<string, ArticleACommander>();
const J = '2026-11-14';
const dit = (i: StockItem, cmd?: ArticleACommander) => etatDit(i, infoLigne(i, cmd ? new Map([[i.ref, cmd]]) : vide, J), cmd, J);

describe('la barre de la ligne (g6)', () => {
  it('à l\'échelle sous le coude, resserrée et coupée au-delà ; rien pour l\'inconnu, le nul et les autres rayons', () => {
    expect(barreLigne(art({ currentStock: 0.5 }))).toEqual({ x: expect.closeTo(0.045, 4), coupe: null });
    const pils = barreLigne(art({ currentStock: 120 }))!;
    expect(pils.x).toBeCloseTo(0.9238, 3);
    expect(pils.coupe).toBeCloseTo(48.71, 1);
    expect(barreLigne(art({ currentStock: 0 }))).toBeNull();
    expect(barreLigne(art({ currentStock: Number.NaN }))).toBeNull();
    expect(barreLigne(art({ category: 'Emballage', unit: 'pièces', currentStock: 480 }))).toBeNull();
  });
  it('houblons en g (coude 250 g), un houblon en kg est converti ; levures en sachets', () => {
    expect(barreLigne(art({ category: 'Houblon', unit: 'g', currentStock: 100 }))!.x).toBeCloseTo(0.18, 4);
    expect(barreLigne(art({ category: 'Houblon', unit: 'kg', currentStock: 0.45 }))!.coupe).not.toBeNull();
    expect(barreLigne(art({ category: 'Levure', unit: 'sachet', currentStock: 3 }))!.x).toBeCloseTo(0.27, 4);
  });
  it('un sucre se range au rayon Malts : il a sa barre', () => {
    expect(barreLigne(art({ category: 'Sucre', name: 'Dextrose', currentStock: 2 }))).not.toBeNull();
  });
});

describe('ce que la ligne dit', () => {
  it('assez, au seuil, bas, sans seuil, épuisé, à compter, avec les mots de la maquette', () => {
    expect(dit(art({ currentStock: 0.5, minStock: 0.3 })).texte).toBe('assez · seuil 0,3 kg');
    expect(dit(art({ currentStock: 0.5, minStock: 0.5 }))).toEqual({ texte: 'au seuil · seuil 0,5 kg', classe: 'seuil' });
    expect(dit(art({ currentStock: 0.8, minStock: 2 }))).toEqual({ texte: 'bas · seuil 2 kg', classe: 'bas' });
    expect(dit(art({ currentStock: 1 })).texte).toBe('sans seuil');
    expect(dit(art({ category: 'Houblon', unit: 'g', currentStock: 0, minStock: 200 })).texte).toBe('épuisé · seuil 200 g');
    expect(dit(art({ currentStock: Number.NaN })).texte).toBe('à compter');
  });
  it('manque : la quantité connue, ou « au moins » quand une source est inconnue', () => {
    const a = art({ category: 'Houblon', unit: 'g', currentStock: 450, minStock: 100 });
    const cmd = (o: Partial<ArticleACommander>): ArticleACommander => ({ item: a, missing: 50, rupture: false, auMoins: false, sources: [], ...o });
    expect(dit(a, cmd({})).texte).toBe('manque 50 g');
    expect(dit(a, cmd({ auMoins: true })).texte).toBe('manque au moins 50 g');
  });
  it('un seuil absent n\'est pas 0 : « sans seuil » et pas de pot de seuil', () => {
    const i = art({ currentStock: 2 });
    expect(infoLigne(i, vide, J).pot!.seuil).toBeNull();
    expect(dit(i).texte).toBe('sans seuil');
  });
  it('levure à DDM dépassée : dit « périmée depuis 44 j » (vd2 n° 7, une seule phrase)', () => {
    const l = art({ category: 'Levure', unit: 'sachet', currentStock: 1, minStock: 1, yeastLot: { expiresOn: '2026-10-01' } as never });
    expect(dit(l).texte).toBe('périmée depuis 44 j · au seuil');
    expect(dit(l).classe).toBe('ddm');
  });
});

describe('repère, quantité, teintes', () => {
  const clair = () => '#F2C14E';
  it('EBC, α, DDM ; l\'inconnu se dit « non connu » et jamais 0', () => {
    const v = (i: StockItem) => repereLigne(i, infoLigne(i, vide, J), clair);
    expect(v(art({ colorEbc: 3.5 }))!.texte).toBe('EBC 3,5');
    expect(v(art({ colorEbc: 1300 }))!.texte).toBe('EBC 1 300');
    expect(v(art({}))).toMatchObject({ texte: 'EBC non connu', inconnu: true });
    expect(v(art({ category: 'Houblon', unit: 'g', alphaPct: 15.2 }))!.texte).toBe('α 15,2 %');
    expect(v(art({ category: 'Houblon', unit: 'g' }))!.texte).toBe('α non connu');
    expect(v(art({ category: 'Levure', unit: 'sachet', yeastLot: { expiresOn: '2027-05-30' } as never }))!.texte).toBe('DDM 05.2027');
    expect(v(art({ category: 'Emballage', unit: 'pièces' }))).toBeNull();
  });
  it('la quantité reste en kg comme la maquette (0,5 kg), un houblon passe en kg à 1 000 g', () => {
    expect(quantiteDeLigne(art({ currentStock: 0.5 }))).toBe('0,5 kg');
    expect(quantiteDeLigne(art({ category: 'Houblon', unit: 'g', currentStock: 1200 }))).toBe('1,2 kg');
    expect(quantiteDeLigne(art({ category: 'Houblon', unit: 'g', currentStock: 450 }))).toBe('450 g');
  });
  it('six familles de teinte c3b, la même pour un article et pour l\'en-tête de son groupe', () => {
    const f = (c: string, n = 'x') => familleTeinte({ category: c, name: n });
    expect([f('Malt'), f('Houblon'), f('Levure'), f('Additif'), f('Emballage'), f('CIP acide')]).toEqual([0, 1, 2, 3, 4, 5]);
    expect(f('Sucre', 'Sucre candi')).toBe(0);
    expect(['Malt', 'Houblon', 'Levure', 'Additif', 'Emballage', 'Désinfectant'].map(familleTeinteGroupe)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(rayonDuGroupe('Houblon')).toBe('Houblons');
    expect(rayonDuGroupe('Emballage')).toBeNull();
  });
});
