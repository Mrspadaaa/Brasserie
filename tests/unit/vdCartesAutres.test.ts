// Voie vd, ST-V6 (verdict bdd71433 n° 6) : une carte d'Autres stocks dit « manque », comme la pastille et la ligne, pas « bas ».
import { describe, expect, it } from 'vitest';
import { cartesAutres } from '../../src/domain/stock/murDonnees';
import { infoLigne } from '../../src/domain/stock/liste';
import type { StockItem } from '../../src/types';

const art = (ref: string, name: string, category: string, currentStock: number, minStock: number, unit = 'L'): StockItem =>
  ({ id: ref, ref, name, category, unit, currentStock, minStock, reorder: false } as StockItem);

describe('cartes d\'Autres stocks : les mots des pastilles', () => {
  const acide = art('a1', 'Acide lactique', 'Additif', 0.5, 2);      // manque 1,5 L
  const sels = art('a2', 'Sels de brassage', 'Additif', 2, 1, 'kg');  // assez
  const caps = art('e1', 'Capsules', 'Emballage', 120, 500, 'pièce'); // manque
  const cip = art('n1', 'Détergent CIP', 'CIP alcalin', 3, 3);        // pile au seuil : bas
  const items = [acide, sels, caps, cip];
  const aCommander = new Map([
    ['a1', { item: acide, missing: 1.5, auMoins: false, sources: [] }],
    ['e1', { item: caps, missing: 380, auMoins: false, sources: [] }],
  ]);
  const infos = new Map(items.map((i) => [i.ref, infoLigne(i, aCommander as never, '2026-11-14')] as const));
  const cartes = cartesAutres(items, [], [], infos);
  const ligne = (id: string) => cartes.find((c) => c.id === id)!.lignes;

  it('Additifs : « 1 manque », jamais « 1 bas » quand la ligne dit « manque 1,5 L »', () => {
    expect(ligne('Additifs')).toEqual([{ n: 1, texte: 'manque', alerte: true }]);
    expect(infos.get('a1')!.etats).toContain('manque');
  });
  it('Emballage : « 1 manque » ; Nettoyage pile au seuil : « 1 bas » (la pastille « bas »)', () => {
    expect(ligne('Emballage')).toEqual([{ n: 1, texte: 'manque', alerte: true }]);
    expect(ligne('Nettoyage')).toEqual([{ n: 1, texte: 'bas', alerte: false }]);
  });
  it('le nombre « manque » des cartes égale celui de la pastille', () => {
    const pastille = items.filter((i) => infos.get(i.ref)!.etats.includes('manque')).length;
    const cartesManque = cartes.reduce((s, c) => s + (c.lignes.find((l) => l.texte === 'manque')?.n ?? 0), 0);
    expect(cartesManque).toBe(pastille);
  });
});
