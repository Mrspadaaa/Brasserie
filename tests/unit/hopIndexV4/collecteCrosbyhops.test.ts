// Voie c3c (#180) : lecteur Crosby Hops sur du HTML synthétique (structure imitée, rien copié).
import { describe, expect, it } from 'vitest';
import { lireProduitCrosby, lireVarieteCrosby } from '../../../scripts/collecte-hop/crosbyhops.mjs';

const lignes = (...l: string[]) => `<html><body><h1>${l[0]}</h1>${l.slice(1).map(x => `<div>${x}</div>`).join('')}</body></html>`;

describe('lecteur Crosby Hops', () => {
  it('lit une page de variété : valeurs de brassage, formats, styles, accords', () => {
    const html = lignes('Exemplum™', 'Available Formats', 'T-90', 'CGX®', 'Characteristics', 'Vif', 'Frais', 'Profile', 'Citron vert et fleurs.',
      'Beer Styles IPA, Pale Ale', 'Pairings', 'Citra, Mosaic', 'Brewing Values', 'Alpha Acids', '6.5-9.4%', 'Total Oils', '1.3-2.8 ml/100g',
      'Farnesene', '10-15%', 'Linalool', '0.6-0.9%', 'Sensory Analysis', 'Un avis de brasseur.');
    const v = lireVarieteCrosby(html)!;
    expect(v.nom).toBe('Exemplum');
    expect(v.champs.alpha).toMatchObject({ min: 6.5, max: 9.4, unite: '%' });
    expect(v.champs.huileTotale).toMatchObject({ min: 1.3, max: 2.8 });
    expect(v.champs.farnesene).toMatchObject({ min: 10, max: 15 });
    expect(v.champs.linalol).toMatchObject({ min: 0.6, max: 0.9 });
    expect(v.listes.formats).toEqual(['T-90', 'CGX']);
    expect(v.listes.styles).toEqual(['IPA', 'Pale Ale']);
    expect(v.listes.accords).toEqual(['Citra', 'Mosaic']);
  });
  it('lit une page produit : arômes, cohumulone, conservation, « <1.0 % »', () => {
    const html = lignes('Exemplum', 'Hop Description', 'Un texte long qui reste dans le cache.', 'Aroma Profile', 'Herbal, Cedar, Orange Zest',
      'Alpha', '4 - 6 %', 'Beta', '5 - 6.7 %', 'Cohumulone', '20 - 26 %', 'Caryophyline', '4.0 - 8.0 %', 'Farnesene', '&lt;1.0 %', 'Storage', 'Very Good');
    const p = lireProduitCrosby(html)!;
    expect(p.listes.aromes).toEqual(['Herbal', 'Cedar', 'Orange Zest']);
    expect(p.champs.cohumulone).toMatchObject({ min: 20, max: 26 });
    expect(p.champs.caryophyllene).toMatchObject({ min: 4, max: 8 });
    expect(p.champs.farnesene).toMatchObject({ max: 1, operateur: '<', min: null });
    expect(p.champs.conservation).toMatchObject({ brut: 'Very Good', valeur: null });
  });
  it('rend null pour une page sans données (« No information currently available »)', () => {
    expect(lireProduitCrosby(lignes('Cluster', 'No information currently available.'))).toBeNull();
    expect(lireVarieteCrosby(lignes('Autre', 'Rien ici'))).toBeNull();
  });
});
