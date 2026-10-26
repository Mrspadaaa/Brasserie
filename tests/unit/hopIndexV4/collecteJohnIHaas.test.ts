// Voie c3b-europe (#180) : le lecteur John I. Haas (texte des PDF et pages variété) sur des textes synthétiques qui imitent la structure.
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
// @ts-expect-error module .mjs sans déclaration
import { analyserPdfTexte, analyserPage, stylesDepuisAtterrissage } from '../../../scripts/collecte-hop/johnihaas.mjs';

const brut = (champs: Record<string, { brut: string }>) => Object.fromEntries(Object.entries(champs).map(([k, v]) => [k, v.brut]));

describe('collecte John I. Haas — PDF', () => {
  it('fiche « mini spec » : une ligne par champ, descripteurs sous le pays', () => {
    const texte = ['J O H N I . H A A S', 'UNITED STATES', 'Mango, grapefruit flesh, lime zest.',
      'Alpha (%) 11.0-13.0', 'Beta (%) 3.5-4.5', 'Cohumulone (% of Alpha Acids) 22-24', 'Total Oil (ml/100g) 2.2-2.8',
      'Myrcene (% of Total Oil) 60-65', 'Farnesene (% of Total Oil) < 1', 'Linalool (% of Total Oil) 1-2'].join('\n');
    const a = analyserPdfTexte(texte);
    expect(brut(a.champs)).toMatchObject({ alpha: '11.0-13.0', cohumulone: '22-24', huile_totale: '2.2-2.8', myrcene: '60-65', farnesene: '< 1', linalol: '1-2' });
    expect(a.champs.alpha).toMatchObject({ min: 11, max: 13, unite: '%' });
    expect(a.champs.farnesene).toMatchObject({ min: null, max: 1, base: '% de l’huile' });
    expect(a.champs.huile_totale).toMatchObject({ unite: 'mL/100 g', min: 2.2, max: 2.8 });
    expect(a.listes.pays).toEqual(['UNITED STATES']);
    expect(a.listes.descripteurs).toEqual(['Mango', 'grapefruit flesh', 'lime zest']);
  });
  it('plusieurs paires sur une ligne', () => {
    const a = analyserPdfTexte('Alpha 17.4 – 19.1% Beta 7.2 – 7.9%\nCohumulone 33.0 – 37.0% of α-acids\nTotal oil 2.5 – 3.0ml/100g');
    expect(a.champs.alpha).toMatchObject({ min: 17.4, max: 19.1 });
    expect(a.champs.beta).toMatchObject({ min: 7.2, max: 7.9 });
    expect(a.champs.cohumulone).toMatchObject({ min: 33, max: 37 });
    expect(a.champs.huile_totale).toMatchObject({ min: 2.5, max: 3 });
  });
  it('libellés en bloc puis valeurs dans le même ordre, avec « Myrcene » rejeté après les valeurs', () => {
    const a = analyserPdfTexte(['Humulene', 'Caryophyllene', 'Farnesene', '32.0–56.0 0.8–2.2 7.0–14.7 2.8–5.1', 'Essai', 'Myrcene'].join('\n'));
    expect(brut(a.champs)).toEqual({ myrcene: '32.0–56.0', humulene: '0.8–2.2', caryophyllene: '7.0–14.7', farnesene: '2.8–5.1' });
    expect(a.champs.myrcene.appariement).toMatch(/ordre du flux/);
  });
  it('valeurs avant le bloc de libellés, et valeurs une par ligne avec unité', () => {
    const avant = analyserPdfTexte(['34.0-40.0 16.3–19.4 5.9–14.1', 'Myrcene', 'Humulene', 'Caryophyllene'].join('\n'));
    expect(brut(avant.champs)).toEqual({ myrcene: '34.0-40.0', humulene: '16.3–19.4', caryophyllene: '5.9–14.1' });
    const lignes = analyserPdfTexte(['Alpha Acids*', 'Beta Acids', 'Total Oil', '8.1 – 9.5%', '8.3 – 10.2%', '2.0 – 2.7 ml/100g'].join('\n'));
    expect(lignes.champs.huile_totale).toMatchObject({ min: 2, max: 2.7, unite: 'mL/100 g' });
    expect(lignes.champs.beta).toMatchObject({ min: 8.3, max: 10.2 });
  });
  it('le rapport humulène/caryophyllène n’écrase pas l’humulène ; une virgule décimale est lue', () => {
    const a = analyserPdfTexte('ALPHA ACIDS (%) 5,5 - 7,5\nHumulene (%) 19 - 21\nHumulene/Caryophyllene (%) 2,5 - 2,7');
    expect(a.champs.alpha).toMatchObject({ min: 5.5, max: 7.5 });
    expect(a.champs.humulene).toMatchObject({ min: 19, max: 21 });
    expect(a.champs.rapport_humulene_caryophyllene).toMatchObject({ min: 2.5, max: 2.7 });
  });
  it('la prose n’est pas lue comme des champs', () => {
    const a = analyserPdfTexte('Cascade was released in 1972 and it has alpha 5 times more aroma than many other hop varieties in the world of brewing today');
    expect(a.champs).toEqual({});
    expect(a.listes.sortie).toEqual(['1972']);
  });
});

describe('collecte John I. Haas — pages', () => {
  const HTML = `<html><body><section class="spotlight-hero"><h1 class="spotlight-hero__title">Essai®</h1><p class="spotlight-hero__subtitle">Dual Purpose</p>
  <div class="spotlight-hero__stat"><span class="spotlight-hero__stat-label">Origin</span><span class="spotlight-hero__stat-value">USA</span></div></section>
  <ul><li class="spotlight-profile__trait"><span class="spotlight-profile__trait-label">Citrus</span></li></ul>
  <div class="spotlight-profile__row"><span class="spotlight-profile__label">Alpha Acids (%)*</span><span class="spotlight-profile__value">4.5-7.0</span></div>
  <div class="spotlight-profile__row"><span class="spotlight-profile__label">Farnesene (% of Total Oil)</span><span class="spotlight-profile__value">3-7</span></div>
  <div class="spotlight-pairings__card"><h3 class="spotlight-pairings__heading">Style Recommendations</h3><ul class="spotlight-pairings__styles"><li>IPA</li><li>Porter</li></ul></div>
  <div class="spotlight-pairings__card"><h3 class="spotlight-pairings__heading">Similar Varieties</h3><ul><li><span class="spotlight-pairings__name">Autre™</span><span class="spotlight-pairings__meta">Citrus, floral</span></li></ul></div>
  </body></html>`;
  it('lit les champs, les caractères dominants, les styles et les variétés proches', () => {
    const a = analyserPage(HTML, JSDOM);
    expect(a.estSpotlight).toBe(true);
    expect(a.nom).toBe('Essai');
    expect(a.origine).toBe('USA');
    expect(a.champs.alpha).toMatchObject({ min: 4.5, max: 7, unite: '%' });
    expect(a.champs.farnesene).toMatchObject({ min: 3, max: 7, base: '% de l’huile', baseLue: true });
    expect(a.listes.descripteurs).toEqual(['Citrus']);
    expect(a.listes.styles).toEqual(['IPA', 'Porter']);
    expect(a.listes.substituts).toEqual([{ nom: 'Autre™', aromes: 'Citrus, floral' }]);
    expect(a.listes.usage).toEqual(['Dual Purpose']);
  });
  it('fiche HopFrance : unité nue après le libellé (« TOTAL OILS ml/100g », « FARNESENE mg/100g »), voie c3g', () => {
    const a = analyserPdfTexte('ALPHA ACIDS (%) 5,5 - 7,5\nTOTAL OILS ml/100g 1,2 - 1,6\nFARNESENE mg/100g 2 - 4\nLINALOOL mg/100g 10 - 16');
    expect(a.champs.huile_totale ?? a.champs.huileTotale).toMatchObject({ min: 1.2, max: 1.6, unite: 'mL/100 g' });
    expect(a.champs.farnesene).toMatchObject({ min: 2, max: 4, unite: 'mg/100 g' });
    expect(a.champs.linalol).toMatchObject({ min: 10, max: 16, unite: 'mg/100 g' });
  });
  it('page d’atterrissage : seulement une vraie liste de styles', () => {
    expect(stylesDepuisAtterrissage('RECOMMENDED STYLES Wheat Ale, Golden Ale, India Pale Ale (IPA) Hear the latest HopCast')).toEqual(['Wheat Ale', 'Golden Ale', 'India Pale Ale (IPA)']);
    expect(stylesDepuisAtterrissage('Recommended styles As a dual-purpose hop, it works in all beer styles. Hear the latest')).toEqual([]);
  });
});
