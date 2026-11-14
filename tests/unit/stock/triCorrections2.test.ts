// Voie ta, suite : trois erreurs de tri de la facture au mur (N2 houblons peu typés, N3 pastille Saison, N4 « 10gr »).
import { describe, expect, it } from 'vitest';
import type { StockItem } from '../../../src/types';
import { COLONNES_STYLE, SEUIL_TYPICITE, classerHoublons } from '../../../src/domain/stock/mur';
import { construireMur } from '../../../src/domain/stock/murDonnees';
import { sourcesDeLApp } from '../../../src/domain/stock/murSources';
import { readProductLabel } from '../../../src/services/ingredientIdentity';
import { stockQuantityFor } from '../../../src/services/purchaseEntry';

const art = (o: Partial<StockItem>): StockItem => ({ id: o.ref ?? 'x', ref: 'x', name: 'x', category: 'Houblon', unit: 'g', currentStock: 200, reorder: false, ...o } as StockItem);
const houblon = (name: string, alphaPct: number, origin?: string) => art({ ref: name, name, alphaPct, origin, category: 'Houblon' });
/** Colonne du mur (id) de chaque houblon du stock. */
function colonnes(items: StockItem[]): Record<string, string> {
  const m = construireMur(items, sourcesDeLApp);
  const r: Record<string, string> = {};
  for (const g of m.rayons.find((x) => x.nom === 'Houblons')!.groupes) for (const k of g.marques) r[k.nom] = g.id;
  return r;
}

const CINQ = [houblon('Motueka', 7, 'NZ'), houblon('Glacier', 5.5, 'US'), houblon('Aramis', 7.5, 'FR'), houblon('Barbe Rouge', 8.6, 'FR'), houblon('Willamette', 5, 'US')];
/** Un stock plein : huit houblons nets qui préfèrent tous Hazy (de quoi saturer les six places). */
const HAZY_NETS = ['Citra', 'Mosaic', 'Galaxy', 'El Dorado', 'Azacca', 'Vic Secret', 'Strata', 'Cashmere'].map((n) => houblon(n, 12, 'US'));

describe('N2 : un houblon aux parts de style minuscules ne passe pas par le flot', () => {
  it('Motueka, Glacier, Aramis, Barbe Rouge ne sont plus rangés en Stouts', () => {
    const c = colonnes(CINQ);
    for (const n of ['Motueka', 'Glacier', 'Aramis', 'Barbe Rouge']) expect(c[n], n).not.toBe('stouts');
  });
  it('un houblon sous le seuil va à la colonne de sa famille, dit « par défaut » ; sans famille : Pale', () => {
    const r = classerHoublons([
      { id: 'faible', parts: { '16C': SEUIL_TYPICITE / 2, '21C': SEUIL_TYPICITE / 3 }, famille: 'modernes' },
      { id: 'faibleSansFamille', parts: { '16C': 0.01 } },
      { id: 'net', parts: { '16C': SEUIL_TYPICITE } },
    ]);
    expect(r.faible).toEqual({ colonne: 'hazy', parDefaut: true, deplace: false });
    expect(r.faibleSansFamille).toEqual({ colonne: 'pale', parDefaut: true, deplace: false });
    expect(r.net).toEqual({ colonne: 'stouts', parDefaut: false, deplace: false });
  });
  it('Nelson Sauvin tombe dans la même colonne seul et dans un stock plein', () => {
    const ns = houblon('Nelson Sauvin', 11.8, 'NZ');
    const seul = colonnes([ns])['Nelson Sauvin'];
    const plein = colonnes([ns, ...HAZY_NETS, ...CINQ])['Nelson Sauvin'];
    expect(seul).toBe('hazy');
    expect(plein).toBe(seul);
  });
  it('un houblon net garde sa colonne : Citra, East Kent Goldings, Saaz, Hallertau Mittelfrüh', () => {
    const c = colonnes([houblon('Citra', 12, 'US'), houblon('East Kent Goldings', 5.5, 'UK'), houblon('Saaz', 3.5, 'CZ'), houblon('Hallertau Mittelfrüh', 4, 'DE')]);
    expect(c.Citra).toBe('hazy');
    expect(c.Saaz).toBe('lager');
    expect(c['Hallertau Mittelfrüh']).toBe('lager');
    expect(c['East Kent Goldings']).toBe('pale');
  });
  it('les six colonnes gardent au plus six houblons classés par le flot', () => {
    const r = classerHoublons(Array.from({ length: 9 }, (_, i) => ({ id: 'h' + i, parts: { '21C': 0.5 - i * 0.01, '21A': 0.3 } })));
    for (const col of COLONNES_STYLE) expect(Object.values(r).filter((x) => x.colonne === col.id && !x.parDefaut).length).toBeLessThanOrEqual(6);
  });
});

describe('N3 : la pastille Saison ou Sour du rayon Levures ne dit « rien en stock » que si aucune levure n’est de ce style', () => {
  const levure = (name: string) => art({ ref: name, name, category: 'Levure', unit: 'Stk', currentStock: 2 });
  /** Quatre colonnes remplies (IPA, Anglaise, Blé, Lager) : il ne reste de place, parmi les trois pastilles, que pour Saison et Sour. */
  const QUATRE = [levure('Safale US-05'), levure('Lalbrew Nottingham'), levure('Safale WB-06'), levure('Saflager W-34/70')];
  const vides = (items: StockItem[]) => construireMur(items, sourcesDeLApp).rayons.find((x) => x.nom === 'Levures')!.vides;
  it('French Saison M29 en stock : plus de pastille Saison, et aucune colonne créée', () => {
    expect(vides(QUATRE)).toEqual(['Saison', 'Sour']);
    const m = construireMur([...QUATRE, levure('French Saison M29, 10gr')], sourcesDeLApp);
    const l = m.rayons.find((x) => x.nom === 'Levures')!;
    expect(l.vides).toEqual(['Sour']);
    expect(l.groupes.map((g) => g.id)).toEqual(['ipa', 'anglaise', 'ble', 'lager', 'autres']);
  });
  it('chaque pastille se tait seule, au nom de la levure', () => {
    expect(vides([...QUATRE, levure('Wyeast 3724 Belgian Saison')])).toEqual(['Sour']);
    expect(vides([...QUATRE, levure('Lactobacillus brevis')])).toEqual(['Saison']);
    expect(vides([...QUATRE, levure('Wyeast 1007 German Ale')])).toEqual(['Saison', 'Sour']);
  });
});

describe('N4 : « 10gr » est un poids de sachet pour la lecture comme pour l\'enregistrement', () => {
  it('readProductLabel lit « gr » et « gr. » comme des grammes (levure)', () => {
    for (const d of ['French Saison M29, 10gr', 'French Saison M29 10 gr', 'French Saison M29 10gr.', 'French Saison M29 10 Gr.']) {
      expect(readProductLabel(d, { unit: 'Stk', yeast: true, side: 'line' }).pieceWeight, d).toEqual({ value: 10, unit: 'g', source: 'libellé' });
    }
    expect(readProductLabel('French Saison M29, 10g', { unit: 'Stk', yeast: true, side: 'line' }).pieceWeight?.value).toBe(10);
  });
  it('« gr » n\'est pas lu dans un mot (« Grain », « Gris ») ni hors levure', () => {
    expect(readProductLabel('Levure 10 grains', { unit: 'Stk', yeast: true, side: 'line' }).pieceWeight).toBeUndefined();
    expect(readProductLabel('Pilsner 25gr', { unit: 'Stk', side: 'line' }).pieceWeight).toBeUndefined();
  });
  it('le rattachement proposé pour « French Saison M29, 10gr » n\'est plus refusé à l\'enregistrement', () => {
    const cible = { name: 'French Saison M29, 10gr', unit: 'Stk', category: 'Levure' };
    for (const unit of ['sachet', 'Stk']) {
      const r = stockQuantityFor({ description: 'French Saison M29, 10gr', quantity: 2, unit }, cible);
      expect(r, unit).toMatchObject({ ok: true, quantity: 2 });
    }
    // Un vrai doute reste un refus : deux mesures, ou un multiplicateur.
    expect(stockQuantityFor({ description: 'French Saison M29 10gr x10', quantity: 1, unit: 'sachet' }, cible)).toMatchObject({ ok: false });
    expect(stockQuantityFor({ description: 'French Saison M29 10gr 500 g', quantity: 1, unit: 'sachet' }, cible)).toMatchObject({ ok: false });
  });
});
