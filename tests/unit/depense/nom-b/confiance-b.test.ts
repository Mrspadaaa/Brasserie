import { describe, expect, it } from 'vitest';
import { confianceLigne } from '../../../../src/ui/depense/confiance';
import { ligneConfianceDe } from '../../../../src/ui/depense/rangees';
import { memeProduit } from '../../../../src/ui/depense/etat';
import { memeNom } from '../../../../src/services/stockLineMatching';
import { art, brouillon } from './aide';

/**
 * « Confiance = plateau » (revue du code, n° 1) : la pastille de confiance (`confiance.ts` ← `rangees.ts` ← `etat.ts`) lit la même ligne que l'écran :
 * son nom français (`nameFr`) et son nom imprimé lu (`nomLu`). Chaque test échoue quand on retire l'une de ces trois lectures (mutations jouées, RESULTAT.md).
 */
const contexte = (articles: any[], ligne: any) => ({ lignes: [ligneConfianceDe(ligne)], articles, fournisseur: 'Fournisseur test', total: 15 });
const article = (ligne: any, articles: any[]) => confianceLigne(ligneConfianceDe(ligne), contexte(articles, ligne) as any).article;
const aucun = (ligne: any, articles: any[]) => (article(ligne, articles).raison ?? '').includes('aucun article choisi');

describe('confiance = plateau : la confiance lit nameFr et nomLu', () => {
  it('nameFr : « Wiener Malz » (français « Malt de Vienne ») face à « Malt de Vienne » : article proposé, pas « aucun article choisi »', () => {
    const ligne = brouillon('line-1', 'Wiener Malz', { stockAction: 'none', nameFr: 'Malt de Vienne' });
    expect(article(ligne, [art('A', 'Malt de Vienne')]).valeur).toBe('Malt de Vienne');
    expect(aucun(brouillon('line-1', 'Wiener Malz', { stockAction: 'none' }), [art('A', 'Malt de Vienne')])).toBe(true);
  });
  it('nomLu : « Wiener Malz · gemahlen » (nom lu « Wiener Malz ») face à « Vienna Malt » qui garde « Wiener Malz » : article proposé', () => {
    const vienna = art('V', 'Vienna Malt', 'Malt', 'kg', { nomsFacture: ['Wiener Malz'] });
    expect(article(brouillon('line-1', 'Wiener Malz · gemahlen', { stockAction: 'none', nomLu: 'Wiener Malz' }), [vienna]).valeur).toBe('Vienna Malt');
    expect(aucun(brouillon('line-1', 'Wiener Malz · gemahlen', { stockAction: 'none' }), [vienna])).toBe(true);
  });
});

describe('memeProduit (le menu « Créer ») lit les mêmes noms', () => {
  it('nameFr et nomLu comptent ; sans eux, rien', () => {
    expect(memeProduit('Wiener Malz', 'Kg', [art('A', 'Malt de Vienne')], 5, undefined, { nameFr: 'Malt de Vienne' })?.name).toBe('Malt de Vienne');
    expect(memeProduit('Wiener Malz', 'Kg', [art('A', 'Malt de Vienne')], 5)).toBeUndefined();
    const vienna = art('V', 'Vienna Malt', 'Malt', 'kg', { nomsFacture: ['Wiener Malz'] });
    expect(memeProduit('Wiener Malz · gemahlen', 'Kg', [vienna], 5, undefined, { nomLu: 'Wiener Malz' })?.name).toBe('Vienna Malt');
  });
});

describe('memeNom : la même égalité à l\'écriture (N2, N4) et à la fiche (N5)', () => {
  it('apostrophe, trait d\'union, point, casse, espaces, marques', () => {
    expect(memeNom('Flocons d\'Avoine', 'flocons  d\'avoine')).toBe(true);
    expect(memeNom('CARABELGE®', 'CARABELGE')).toBe(true);
    expect(memeNom('Malt Pilsner Premium', 'Premium Pilsner Malt')).toBe(false); // le même NOM, pas le même ensemble de mots
    expect(memeNom('Pale-Ale Malt', 'pale ale malt')).toBe(memeNom('pale ale malt', 'Pale-Ale Malt'));
    expect(memeNom('St. Austell', 'st austell')).toBe(memeNom('st austell', 'St. Austell'));
    expect(memeNom('Vienna Malt', 'Wiener Malz')).toBe(false);
  });
});
