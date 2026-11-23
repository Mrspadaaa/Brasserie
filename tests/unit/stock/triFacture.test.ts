/**
 * Tri d'une facture de fournisseur brassicole (voie « ta », 14.11) : trois erreurs de colonne du mur trouvées en rejouant de vraies lectures (noms de produits publics, aucune valeur d'une pièce).
 * - Weizenflocken (flocons de blé) rangés en « Base » : « flocken » n'était pas lu comme flocons ;
 * - Windsor (anglaise) et M44 (US West Coast) en « Autres » ; une levure de champagne (« Trockenhefe », levure sèche) en « Blé » à cause de « hefe » ;
 * - « Cryo Hops Citra 25g » sans variété donc sans style (Pale « par défaut ») : le poids du paquet et « Hops » empêchaient la reconnaissance.
 */
import { describe, expect, it } from 'vitest';
import { typeMaltParNom } from '../../../src/domain/stock/murDonnees';
import { sourcesDeLApp } from '../../../src/domain/stock/murSources';
import type { StockItem } from '../../../src/types';

const art = (name: string, category: string, extra: Partial<StockItem> = {}): StockItem => ({ id: name, ref: name, name, category, unit: 'g', currentStock: 100, minStock: 0, reorder: false, ...extra } as StockItem);

describe('mur : colonne d’un malt lu en allemand', () => {
  it('les flocons (Flocken) sont des spéciaux, jamais de la base', () => {
    for (const n of ['Weizenflocken', 'Gerstenflocken', 'Haferflocken', 'Maisflocken', 'Roggenflocken']) expect(typeMaltParNom(n, null), n).toBe('speciaux');
  });
  it('le blé malté reste de la base', () => {
    for (const n of ['Weizenmalz hell', 'Pilsner Malz / Schweiz', 'Wiener Malz']) expect(typeMaltParNom(n, null), n).toBe('base');
  });
});

describe('mur : colonne d’une levure', () => {
  const col = (n: string) => sourcesDeLApp.colonneLevure(art(n, 'Levure', { unit: 'Stk' }));
  it('Windsor est anglaise, M44 (US West Coast) est IPA', () => {
    expect(col('LALLEMAND Windsor 11g')).toBe('anglaise');
    expect(col('US West Coast M44, 10gr')).toBe('ipa');
  });
  it('une levure de champagne n’est pas du blé ; une levure de blé l’est', () => {
    expect(col('Sekt/Champagner Trockenhefe für 50 Liter')).toBeNull();
    expect(col('Weizenhefe Weihenstephan')).toBe('ble');
    expect(col('Safale WB-06')).toBe('ble');
    expect(col('Wyeast 3944, Belgian Witbier')).toBe('ble');
  });
});

describe('mur : la variété d’un houblon vendu en paquet', () => {
  it('« Cryo Hops Citra 25g » est un Citra (style connu), pas un houblon sans variété', () => {
    const inf = sourcesDeLApp.houblon(art('Cryo Hops Citra 25g', 'Houblon', { unit: 'Pck', alphaPct: 24.8 }));
    expect(inf?.id).toBe('beermaverick-citra');
  });
  it('un nom déjà reconnu ne change pas', () => {
    expect(sourcesDeLApp.houblon(art('Citra', 'Houblon'))?.id).toBe('beermaverick-citra');
    expect(sourcesDeLApp.houblon(art('Hallertauer Tradition', 'Houblon'))?.id).toBeNull();
  });
});
