// Voie c3d (#180) : l'extraction d'une entrée HopDatabase (JSON synthétique, aucune copie du fichier réel).
import { describe, expect, it } from 'vitest';
import { ficheHopDatabase, plage } from '../../../scripts/collecte-hop/hopdatabase.mjs';
import { indexCatalogue } from '../../../scripts/collecte-hop/communautaire-commun.mjs';

const index = indexCatalogue([{ id: 'x-essai', name: 'Essai', aliases: ['HE 1'] }]);
const entree = {
  name: 'Essai', country: 'USA', source: 'Crosby Hops / Hopsteiner', href: 'https://exemple.test/essai', alpha_from: 3.5, alpha_to: 5.5, beta_from: 3, beta_to: 4.6,
  oil_from: 0.8, oil_to: 2.5, co_h_from: 0, co_h_to: 0, notes: ['citrus', 'herbal'],
  aromas: { Citrus: 0, 'Resin/Pine': 0, Spice: 0, Herbal: 0, Grassy: 0, Floral: 0, Berry: 0, 'Stone Fruit': 0, 'Tropical Fruit': 0 },
  additional_properties: { xantholhumol_from: 0.7, xantholhumol_to: 0.8, polyphenoles_from: 0, polyphenoles_to: 0, linalool_oil_from: 0.4, linalool_oil_to: 0.6, farnesen_from: 4, farnesen_to: 8 },
  brewing_stats: { brewing_purpose: 'Aroma', avg_alpha: 4.5, avg_beta: 3.8, avg_oil: 1.65, avg_cohumulone: 0, alpha_classification: 'Low', oil_classification: 'Medium' },
  product_variants: [{ type: 'T-90 Pellets', alpha_from: '4.5', alpha_to: '7', beta_from: '4.5', beta_to: '7', oil_from: '0.7', oil_to: '1.4', co_h_from: '0', co_h_to: '0' }],
};

describe('plage', () => {
  it('lit une plage, un point, et traite 0–0 comme inconnu (jamais 0)', () => {
    expect(plage('a', 3.5, 5.5)).toMatchObject({ min: 3.5, max: 5.5, valeur: null, unite: null, base: null });
    expect(plage('a', 2, 2)).toMatchObject({ min: 2, max: 2, valeur: 2 });
    expect(plage('a', 0, 0)).toMatchObject({ min: null, max: null, valeur: null, zeroParDefaut: true });
    expect(plage('a', undefined, undefined)).toMatchObject({ brut: null, min: null });
    expect(plage('a', 6, 4)).toMatchObject({ min: null });
  });
});

describe('ficheHopDatabase', () => {
  const f = ficheHopDatabase(entree, { index, releve: '2026-01-01T00:00:00.000Z' });
  it('garde tous les champs, y compris les composés détaillés, et rattache par le nom', () => {
    expect(f.varietyId).toBe('x-essai');
    expect(f.champs.alpha).toMatchObject({ min: 3.5, max: 5.5 });
    expect(f.champs.cohumulone).toMatchObject({ min: null, zeroParDefaut: true });
    expect(f.champs.xanthohumol).toMatchObject({ min: 0.7, max: 0.8 });
    expect(f.champs.polyphenols).toMatchObject({ min: null });
    expect(f.champs.linalolHuile).toMatchObject({ min: 0.4, max: 0.6 });
    expect(f.champs.farnesene).toMatchObject({ min: 4, max: 8 });
  });
  it('un profil d’arôme entièrement à zéro est null, pas un profil plat', () => {
    expect(f.arome).toBeNull();
    expect(ficheHopDatabase({ ...entree, aromas: { Citrus: 3, Spice: 0 } }, { index }).arome).toMatchObject({ citrus: 3, spice: 0 });
  });
  it('sépare les moyennes dérivées, les listes et les variantes de forme', () => {
    expect(f.derives.moyenneAlpha.valeur).toBe(4.5);
    expect(f.derives.moyenneCohumulone).toMatchObject({ valeur: null, zeroParDefaut: true });
    expect(f.listes.fournisseurs).toEqual(['Crosby Hops', 'Hopsteiner']);
    expect(f.listes.descripteurs).toEqual(['citrus', 'herbal']);
    expect(f.variantes[0].champs.alpha).toMatchObject({ min: 4.5, max: 7 });
    expect(f.variantes[0].champs.cohumulone.min).toBeNull();
  });
  it('un nom inconnu du catalogue reste gardé, sans id', () => {
    expect(ficheHopDatabase({ ...entree, name: 'Inconnu' }, { index }).varietyId).toBeNull();
  });
});
