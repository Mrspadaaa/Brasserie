// Voie c3a-hopsteiner (#180) : le lecteur des fiches Hopsteiner sur un HTML synthétique qui imite la structure de la page
// (en-tête, graphique d'arôme, tableaux <dl> par section, variétés alternatives, date). Aucune copie de page réelle, aucun réseau.
import { describe, expect, it } from 'vitest';
import { lireFiche, lireValeur, liensFiches, rattacher } from '../../../scripts/collecte-hop/hopsteiner.mjs';

const ligne = (dt: string, dd: string) => `<div class="d-flex"><dt class="w-50 fw-semibold">${dt}</dt><dd class="w-50">${dd}</dd></div>`;
const chart = (notes: Record<string, number>) =>
  `<pim-chart class="x" taste="${JSON.stringify(notes).replace(/"/g, '&quot;')}"></pim-chart>`;
const fiche = (notes: Record<string, number>, extra = '') => `<html><body><main>
  <section class="c-hop-variety-header"><h1>Houblon d&#039;essai</h1>
    <div class="c-hop-variety-header__tag text-taste-fruity"> Fruity </div>
    <div class="c-hop-variety-header__tag text-taste-spicy"> Spicy </div>
    <p class="mt-4"><span class="fw-semibold">Genetic origin</span>: Croisement fictif A × B ; first released in 1999.</p></section>
  <section class="c-hop-variety-content"><h2 class="h6"> Aroma evaluation </h2>${chart(notes)}
    <h2 class="h6"> Aroma description </h2><p>Mango, resin &amp; pine</p></section>
  <section><h2>Agronomic Aspects</h2><h3>Growing</h3><dl>${ligne('Yield (kg/ ha)', '1600 - 2200')}${ligne('Maturity', 'early')}${ligne('Main growing country', 'Germany')}</dl>
    <h2>Ingredients</h2><h3>Bitter Components</h3><dl>${ligne('Alpha acids %', '12.0 - 14.0')}${ligne('Beta acids %', '-')}${ligne('Co-humulone % rel.', '31 - 34')}</dl>
    <h3>Aroma Components</h3><dl>${ligne('Total oil (ml/100g)', '1.1 - 1.5')}${ligne('Farnesene % rel. of total oil', '&lt; 0.1')}${ligne('Linalool % rel. of total oil', '0.4 - 0.7')}${ligne('Geraniol % rel. of total oil', '0 - 0')}${ligne('Thiol impact', 'high')}${extra}</dl></section>
  <div><h2>Alternative varieties</h2><h3>Brewhouse</h3><div class="hstack gap-3 mt-2"><a href="/en/products/all-hop-varieties/detail/abc" target="_self">Autre A</a><span>Bitter hops</span></div>
  <h3>Dry Hopping</h3><div class="hstack gap-3 mt-2"><a href="/en/products/all-hop-varieties/detail/def">Autre D</a></div></div>
  <p>Last updated: 10/02/2025</p></main></body></html>`;

const notes = { citrusy: 3, fruity: 4, floral: 1, herbal: 2, spicy: 0, resinous: 2, sugarlike: 0, miscellaneous: 1 };

describe('lireValeur', () => {
  it('lit une plage, une valeur, une borne haute et une valeur approchée', () => {
    expect(lireValeur('12.0 - 14.0')).toMatchObject({ min: 12, max: 14, valeur: null });
    expect(lireValeur('1600')).toMatchObject({ valeur: 1600, min: null });
    expect(lireValeur('< 0.1')).toMatchObject({ max: 0.1, min: null, valeur: null, qualificatif: '<' });
    expect(lireValeur('ca. 5')).toMatchObject({ valeur: 5, qualificatif: 'ca.' });
    expect(lireValeur('high')).toMatchObject({ valeur: 'high' });
  });
  it('un « - », un vide, « Unknown » et « 0 - 0 » donnent null, jamais 0', () => {
    for (const brut of ['-', '', 'Unknown', '0 - 0']) {
      expect(lireValeur(brut)).toMatchObject({ valeur: null, min: null, max: null });
    }
  });
});

describe('lireFiche', () => {
  const f = lireFiche(fiche(notes));
  it('lit le nom, la date de mise à jour et les listes', () => {
    expect(f.nom).toBe("Houblon d'essai");
    expect(f.publie).toEqual({ brut: '10/02/2025', date: '2025-02-10' });
    expect(f.listes.etiquettes).toEqual(['Fruity', 'Spicy']);
    expect(f.listes.descripteurs).toEqual(['Mango', 'resin & pine']);
    expect(f.listes.substituts).toEqual({
      Brewhouse: [{ nom: 'Autre A', code: 'abc' }, { nom: 'Bitter hops', code: null }],
      'Dry Hopping': [{ nom: 'Autre D', code: 'def' }],
    });
  });
  it('garde le champ tel qu’écrit, sa section, son unité et sa base', () => {
    expect(f.champs.alpha).toMatchObject({ champ: 'Alpha acids %', section: 'Bitter Components', min: 12, max: 14, unite: '%' });
    expect(f.champs.cohumulone).toMatchObject({ min: 31, max: 34, base: 'relatif aux α (% rel.)' });
    expect(f.champs.huile_totale).toMatchObject({ min: 1.1, max: 1.5, unite: 'mL/100 g' });
    expect(f.champs.linalol).toMatchObject({ min: 0.4, max: 0.7, base: '% rel. de l’huile totale' });
    expect(f.champs.farnesene).toMatchObject({ max: 0.1, qualificatif: '<' });
    expect(f.champs.rendement).toMatchObject({ min: 1600, max: 2200, unite: 'kg/ha' });
    expect(f.champs.thiol_impact.valeur).toBe('high');
    expect(f.champs.premiere_mise_sur_le_marche.valeur).toBe(1999);
  });
  it('l’inconnu n’est jamais 0', () => {
    expect(f.champs.beta).toMatchObject({ brut: '-', valeur: null, min: null, max: null });
    expect(f.champs.geraniol).toMatchObject({ brut: '0 - 0', valeur: null, min: null, max: null });
  });
  it('lit les notes d’arôme 0-5, un 0 isolé reste une note', () => {
    expect(f.champs.arome_fruity.valeur).toBe(4);
    expect(f.champs.arome_spicy.valeur).toBe(0);
  });
  it('un graphique entièrement à 0 est non évalué : valeur null, brut gardé', () => {
    const z = lireFiche(fiche(Object.fromEntries(Object.keys(notes).map(k => [k, 0]))));
    expect(z.champs.arome_fruity).toMatchObject({ brut: '0', valeur: null });
  });
});

describe('liensFiches et rattacher', () => {
  it('liste les codes des fiches sans doublon', () => {
    const html = '<a href="/en/products/all-hop-varieties/detail/nsn"></a><a href="/en/products/all-hop-varieties/detail/nsn"></a><a href="/en/products/all-hop-varieties/detail/cbs-tom"></a><a href="/en/products/all-hop-varieties?x=1"></a>';
    expect(liensFiches(html)).toEqual(['nsn', 'cbs-tom']);
  });
  const cat = [
    { id: 'a', name: 'Alpha', aliases: ['ALP'], hs: { reference: 'https://x/detail/alp' } },
    { id: 'b1', name: 'Beta (GR)', aliases: ['BET'] },
    { id: 'b2', name: 'Beta (US)', aliases: ['BET'] },
    { id: 'c', name: 'Gamma', aliases: ['GAM'] },
  ];
  it('rattache par lien Hopsteiner, par nom, par code unique ; jamais par force', () => {
    expect(rattacher('alp', 'Alpha', cat)).toMatchObject({ varietyId: 'a', methode: 'reference-hopsteiner' });
    expect(rattacher('xxx', 'Gamma', cat)).toMatchObject({ varietyId: 'c', methode: 'nom' });
    expect(rattacher('gam', 'Autre nom', cat)).toMatchObject({ varietyId: 'c', methode: 'code' });
    expect(rattacher('bet', 'Beta', cat)).toMatchObject({ varietyId: null, methode: 'ambigu', candidats: ['b1', 'b2'] });
    expect(rattacher('zzz', 'Inconnu', cat)).toMatchObject({ varietyId: null, methode: null });
  });
});
