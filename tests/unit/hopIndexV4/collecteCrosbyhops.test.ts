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
  it('lit « Up to », « 31.3 % - 45.4 % », « Less than », « %% », « B-Pinene » et la faute « Gernaniol » (voie c3g)', () => {
    const html = lignes('Exemplum', 'Brewing Values', 'Alpha Acids', '3.5 - 5.5%', 'Humulene', '31.3 % - 45.4 %', 'Myrcene', 'Up to 33.7%',
      'Linalool', 'Up to 0.6%%', 'Gernaniol', 'Up to 0.1%', 'B-Pinene', '0.93%', 'Farnesene', 'Less than 0.25%', 'Sensory Analysis', 'Avis.');
    const v = lireVarieteCrosby(html)!;
    expect(v.champs.humulene).toMatchObject({ min: 31.3, max: 45.4 });
    expect(v.champs.myrcene).toMatchObject({ max: 33.7, min: null, operateur: '<' });
    expect(v.champs.linalol).toMatchObject({ max: 0.6 });
    expect(v.champs.geraniol).toMatchObject({ max: 0.1 });
    expect(v.champs.betaPinene).toMatchObject({ valeur: 0.93 });
    expect(v.champs.farnesene).toMatchObject({ max: 0.25 });
  });
  it('lit les thiols en µg/kg (« Up to 2.3 µg/kg »), voie c3g', () => {
    const v = lireVarieteCrosby(lignes('Exemplum', 'Brewing Values', 'Alpha Acids', '9-18%', 'Thiols', 'Up to 2.3 µg/kg', 'Sensory Analysis', 'Avis.'))!;
    expect(v.champs.thiols).toMatchObject({ max: 2.3, min: null, unite: 'µg/kg' });
  });
  it('un « 0 » ou « NA - NA » de remplissage reste null, jamais 0 (voie c3g)', () => {
    const html = lignes('Exemplum', 'Aroma Profile', 'Herbal', 'Alpha', '4 - 6 %', 'Cohumulone', 'NA - NA %', 'Myrcene', '0');
    const p = lireProduitCrosby(html)!;
    expect(p.champs.cohumulone?.valeur ?? null).toBeNull();
    expect(p.champs.cohumulone?.min ?? null).toBeNull();
    expect(p.champs.myrcene?.valeur ?? null).toBeNull();
  });
  it('rend null pour une page sans données (« No information currently available »)', () => {
    expect(lireProduitCrosby(lignes('Cluster', 'No information currently available.'))).toBeNull();
    expect(lireVarieteCrosby(lignes('Autre', 'Rien ici'))).toBeNull();
  });
});
