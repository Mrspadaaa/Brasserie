import { describe, expect, it } from 'vitest';
import type { StockItem } from '../../src/types';
import { construireMur } from '../../src/domain/stock/murDonnees';
import { sourcesDeLApp } from '../../src/domain/stock/murSources';

const a = (o: Partial<StockItem>): StockItem => ({ id: o.ref ?? 'x', ref: o.ref ?? 'x', name: 'A', category: 'Malt', unit: 'kg', currentStock: 1, reorder: false, ...o });
/** Le nom de la colonne du mur où se trouve l'article. */
const colonneDe = (items: StockItem[], nom: string): { rayon: string; colonne: string; titre: string } => {
  for (const r of construireMur(items, sourcesDeLApp).rayons) for (const g of r.groupes) for (const m of g.marques) if (m.nom === nom) return { rayon: r.nom, colonne: g.mot, titre: m.titre ?? '' };
  throw new Error(`absent du mur : ${nom}`);
};
const houblon = (name: string, o: Partial<StockItem> = {}) => a({ ref: name, name, category: 'Houblon', unit: 'g', currentStock: 200, ...o });

/** ST-T25, 35, 46, 47 : le classement du mur, confronté au sens métier (le brasseur lit la colonne comme une vérité). */
describe('classement du mur (ST-T25, 26, 35, 46, 47)', () => {
  it('Hallertau Blanc (vin blanc, fruit de la passion) n\'est pas Lager quand son α manque ; Saaz le reste', () => {
    const items = [houblon('Hallertau Blanc', { origin: 'DE' }), houblon('Saaz', { origin: 'CZ' })];
    expect(colonneDe(items, 'Hallertau Blanc').colonne).not.toBe('Lager');
    expect(colonneDe(items, 'Saaz').colonne).toBe('Lager');
  });
  it('Hallertauer Blanc α 9 : jamais Lager (α > 6)', () => {
    expect(colonneDe([houblon('Hallertauer Blanc', { alphaPct: 9, origin: 'DE' })], 'Hallertauer Blanc').colonne).not.toBe('Lager');
  });
  it('Malt Brown : Torréfiés ; extrait de malt clair : Base ; SPECIAL W : Spéciaux', () => {
    const items = [a({ ref: 'm1', name: 'Malt Brown', colorEbc: 150 }), a({ ref: 'm2', name: 'Extrait de malt en poudre clair', colorEbc: 10 }), a({ ref: 'm3', name: 'SPECIAL W', colorEbc: 300 })];
    expect(colonneDe(items, 'Malt Brown').colonne).toBe('Torréfiés');
    expect(colonneDe(items, 'Extrait de malt en poudre clair').colonne).toBe('Base');
    expect(colonneDe(items, 'SPECIAL W').colonne).toBe('Spéciaux');
  });
  it('levures : BE-256 (Abbaye) reste en Autres, nommée Belge ; Wyeast 1007 German Ale, nommée Kölsch', () => {
    const items = [a({ ref: 'y1', name: 'Fermentis SafAle BE-256 Abbaye', category: 'Levure', unit: 'sachet' }), a({ ref: 'y2', name: 'Wyeast 1007 German Ale', category: 'Levure', unit: 'sachet', yeastForm: 'liquide' })];
    const be = colonneDe(items, 'Fermentis SafAle BE-256 Abbaye'), g = colonneDe(items, 'Wyeast 1007 German Ale');
    expect(be.colonne).toBe('Autres'); expect(be.titre).toContain('style Belge');
    expect(g.colonne).toBe('Autres'); expect(g.titre).toContain('style Kölsch');
  });
});
