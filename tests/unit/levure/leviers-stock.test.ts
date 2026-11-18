import { describe, expect, it } from 'vitest';
import { levure } from '../../../src/domain/levure';

const us05 = () => levure.trouver('fermentis-us05')!;

describe('S2 : levier structuré', () => {
  it('thiols + : axe « temperature » et plage 15–30 °C lus dans levierDetail, plus dans la phrase', () => {
    const s = levure_suggestions();
    expect(s.length).toBeGreaterThan(0);
    for (const x of s) {
      expect(x.levierDetail).toMatchObject({ axe: 'temperature', plage: { min: 15, max: 30 } });
      expect(x.levierDetail!.texte).toBe(x.levier); // `levier` reste le repli texte
      expect(x.levierDetail!.source?.libelle).toBe('Samia 2026');
    }
  });
  it('attenuation − : le levier est l’empâtage, sans axe ni plage inventés', () => {
    const d = levure.suggerer(us05(), [{ axe: 'attenuation', sens: -1 }], 1)[0].levierDetail!;
    expect(d.texte).toMatch(/Malts\/sucres/);
    expect(d.axe).toBeUndefined();
    expect(d.plage).toBeUndefined();
  });
  it('clarté + : aucun levier, ni texte ni structure', () => {
    const x = levure.suggerer(us05(), [{ axe: 'clarte', sens: 1 }], 1)[0];
    expect(x.levier).toBeUndefined();
    expect(x.levierDetail).toBeUndefined();
  });
});
const levure_suggestions = () => levure.suggerer(us05(), [{ axe: 'thiols', sens: 1 }], 5);

describe('M6 : floculation de la 1056 et stock des offres', () => {
  it('la floculation de la 1056 existe au catalogue (« Low Medium ») : rendue moyenne, dite « faible à moyen »', () => {
    const v = levure.valeurAxe(levure.trouver('wyeast-1056')!, 'clarte')!;
    expect(v.niveau).toBe('moyen');
    expect(v.mots).toContain('faible à moyen');
    expect(v.source?.libelle).toMatch(/Wyeast/);
  });
  it('US-05 : floculation non documentée, c’est juste (ni catalogue ni fait versé)', () => {
    expect(levure.valeurAxe(us05(), 'clarte')).toBeNull();
  });
  it('1007 : épuisée au relevé du 2026-09-27 (pas de date de rupture dans les offres) ; US-05 en stock', () => {
    const d = levure.disponibilite(levure.trouver('wyeast-1007')!);
    expect(d.rang).toBe('ici');
    expect(d.stock).toMatchObject({ statut: 'epuise', releveLe: '2026-09-27' });
    expect(d.stock!.note).toMatch(/Out of stock/);
    expect(levure.disponibilite(us05()).stock).toMatchObject({ statut: 'en-stock', releveLe: '2026-09-27' });
  });
  it('1056 (offre aux Pays-Bas) : stock inconnu, la date « 23-3 » sans année n’est pas lue comme un état', () => {
    const d = levure.disponibilite(levure.trouver('wyeast-1056')!);
    expect(d.rang).toBe('europe');
    expect(d.stock?.statut).toBe('inconnu');
    expect(d.stock?.note).toMatch(/23-3/);
  });
  it('une levure sans offre n’a pas de champ stock', () => {
    expect(levure.disponibilite(levure.trouver('lalbrew-diamond')!).stock).toBeUndefined();
  });
});
