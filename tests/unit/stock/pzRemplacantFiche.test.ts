import { describe, expect, it } from 'vitest';
import { phraseRemplacant, remplacantDe } from '../../../src/domain/stock/ficheArticle';
import type { StockItem } from '../../../src/types';

/**
 * Voie pz, part y (14.11, choix 01 : fiche k2) — la fiche d'un houblon dit un remplaçant concret : « ou Mosaic · en stock 250 g · proche »,
 * pas « dans l'outil houblons ». Fixture fictive ; le classement vient du moteur de substitution v4, rien n'est inventé.
 */
const art = (ref: string, name: string, g: number, extra: Partial<StockItem> = {}): StockItem =>
  ({ ref, name, category: 'Houblon', currentStock: g, unit: 'g', ...extra } as StockItem);

describe('pz-y — le remplaçant concret de la fiche k2', () => {
  it('un houblon avec un autre houblon en stock : le remplaçant est en stock, avec ses grammes et son palier', async () => {
    const tous = [art('H1', 'Citra', 300), art('H2', 'Mosaic', 250), art('H3', 'Cascade', 1200)];
    const r = await remplacantDe(tous[0], tous);
    expect(r).not.toBeNull();
    expect(r!.nom).not.toBe('Citra');
    expect(r!.etat).toBe('en stock');
    expect(r!.libre).toBeGreaterThan(0);
    expect(['très proche', 'proche', 'partiel']).toContain(r!.palier);
    const p = phraseRemplacant(r!);
    expect(p.nom).toBe(`ou ${r!.nom}`);
    expect(p.reste).toMatch(/^ · en stock [\d  ,]+ g · (très proche|proche|partiel)$/);
  });

  it('le remplaçant n’est jamais le houblon lui-même, ni un autre lot de sa variété', async () => {
    const tous = [art('H1', 'Citra', 300), art('H1b', 'Citra bis', 100), art('H2', 'Mosaic', 250)];
    const r = await remplacantDe(tous[0], tous);
    expect(r!.nom.toLowerCase()).not.toContain('citra');
  });

  it('sans autre houblon en stock : un remplaçant « à acheter », dit comme tel, sans grammes inventés', async () => {
    const r = await remplacantDe(art('H1', 'Citra', 300), [art('H1', 'Citra', 300)]);
    expect(r).not.toBeNull();
    expect(r!.etat).toBe('à acheter');
    expect(r!.libre).toBeNull();
    expect(phraseRemplacant(r!).reste).toMatch(/^ · à acheter · /);
  });

  it('un article qui n’est pas un houblon, ou une variété inconnue du catalogue : aucun remplaçant (jamais deviné)', async () => {
    expect(await remplacantDe({ ref: 'M1', name: 'Pilsner', category: 'Malt', currentStock: 5, unit: 'kg' } as StockItem, [])).toBeNull();
    expect(await remplacantDe(art('H9', 'Zzzxqv inconnu', 100), [art('H9', 'Zzzxqv inconnu', 100)])).toBeNull();
  });
});
