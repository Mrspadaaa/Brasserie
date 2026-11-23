import { describe, expect, it } from 'vitest';
import { formeLevureLue } from '../../src/domain/stock/articleNeuf';
import { newStockItem, type PurchaseLineDraft } from '../../src/services/purchaseEntry';
import { construireMur } from '../../src/domain/stock/murDonnees';
import { sourcesDeLApp } from '../../src/domain/stock/murSources';

const ligne = (description: string, unit = 'Stk', quantity = 1): PurchaseLineDraft => ({ id: 'l1', description, kind: 'ingredient', quantity, unit, stockAction: 'new', equipmentAction: 'none', stockCategory: 'Levure' });
const neuf = (d: string, unit?: string) => newStockItem(ligne(d, unit), { vendor: 'Fournisseur' }, 'MP-900');

/** ST-T33 : Wyeast 3944 (liquide) était dite « 1 sachet · sèche » et entrait en « Stk ». */
describe('levure liquide : forme et unité à l\'entrée d\'une facture (ST-T33)', () => {
  it('la forme se lit du libellé : marque ou mot', () => {
    expect(formeLevureLue('Wyeast 3944 Belgian Witbier')).toBe('liquide');
    expect(formeLevureLue('White Labs WLP530 Abbey Ale')).toBe('liquide');
    expect(formeLevureLue('Levure liquide Kveik')).toBe('liquide');
    expect(formeLevureLue('Fiole Omega Yeast OYL-004')).toBe('liquide');
    expect(formeLevureLue('Fermentis SafAle US-05 11,5 g')).toBe('sèche');
    expect(formeLevureLue('Lallemand Verdant IPA')).toBe('sèche');
    expect(formeLevureLue('Levure sèche Nottingham')).toBe('sèche');
    expect(formeLevureLue('Levure inconnue Maison')).toBeUndefined(); // jamais devinée
  });
  it('un article neuf Wyeast : sachet (pas Stk), liquide', () => {
    const it = neuf('Wyeast 3944 Belgian Witbier');
    expect(it.category).toBe('Levure');
    expect(it.unit).toBe('sachet');
    expect(it.yeastForm).toBe('liquide');
  });
  it('un article neuf Fermentis : sachet, sèche ; sans signe, aucune forme écrite', () => {
    expect(neuf('SafAle US-05 11,5 g').yeastForm).toBe('sèche');
    expect(neuf('Levure inconnue Maison').yeastForm).toBeUndefined();
    expect(neuf('Levure inconnue Maison').unit).toBe('sachet');
  });
  it('un poids lu reste : une levure en kg n\'est pas changée en sachet', () => {
    expect(neuf('Levure sèche en vrac', 'kg').unit).toBe('kg');
  });
  it('la bulle du mur dit « liquide » et « fiole » pour l\'article neuf', () => {
    const it = { ...neuf('Wyeast 3944 Belgian Witbier'), id: 'MP-900' };
    const mur = construireMur([it as never], sourcesDeLApp);
    const lev = JSON.stringify(mur);
    expect(lev).toContain('1 fiole');
    expect(lev).toContain('liquide');
    expect(lev).not.toContain('sèche');
  });
});
