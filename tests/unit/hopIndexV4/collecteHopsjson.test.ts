// Voie c3d (#180) : l'extraction d'une entrée hops-json (JSON synthétique, aucune copie du fichier réel).
import { describe, expect, it } from 'vitest';
import { ficheHopsJson } from '../../../scripts/collecte-hop/hopsjson.mjs';
import { indexCatalogue } from '../../../scripts/collecte-hop/communautaire-commun.mjs';

const index = indexCatalogue([{ id: 'x-essai', name: 'Essai', aliases: [] }]);
const entree = { Id: 7, Aroma: 'Floral, citrus', BrewingUsage: 2, Name: 'Essai (US)', Pedigree: 'Croisement de A et B', AlphaMax: 6.3, AlphaMin: 5.7, BetaMax: 6.5, BetaMin: 5,
  CoHumuloneMax: 35, CoHumuloneMin: 30, Info: 'Une longue phrase qui ne doit pas entrer dans le dépôt suivi.', Styles: 'Pale Ale, IPA', TotalOilMax: 0, TotalOilMin: 0, Trade: 'Une phrase d’usage.' };

describe('ficheHopsJson', () => {
  const f = ficheHopsJson(entree, { index, releve: '2026-01-01T00:00:00.000Z' });
  it('lit les plages, relie le nom sans son pays, et lit l’origine du suffixe', () => {
    expect(f.varietyId).toBe('x-essai');
    expect(f.listes.origine).toEqual(['US']);
    expect(f.champs.alpha).toMatchObject({ min: 5.7, max: 6.3 });
    expect(f.champs.cohumulone).toMatchObject({ min: 30, max: 35 });
  });
  it('une huile 0–0 est inconnue, pas zéro', () => {
    expect(f.champs.huileTotale).toMatchObject({ min: null, max: null, zeroParDefaut: true });
  });
  it('découpe arômes et styles en listes, garde le code d’usage sans l’interpréter', () => {
    expect(f.listes.descripteurs).toEqual(['Floral', 'citrus']);
    expect(f.listes.styles).toEqual(['Pale Ale', 'IPA']);
    expect(f.codeUsage).toBe(2);
  });
  it('ne copie pas la prose (Info, Trade) ; elle est comptée', () => {
    const texte = JSON.stringify(f);
    expect(texte).not.toContain('longue phrase');
    expect(texte).not.toContain('phrase d’usage');
    expect(f.proseNonCopiee.info).toBeGreaterThan(5);
  });
});
