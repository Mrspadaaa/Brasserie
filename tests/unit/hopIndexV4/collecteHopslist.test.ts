// Voie c3d (#180) : le lecteur des fiches Hopslist sur un HTML synthétique qui imite la structure (tableau étiquette / valeur).
// Aucune copie de page réelle, aucun réseau.
import { describe, expect, it } from 'vitest';
import { lireFicheHopslist, lireRendement, lireConservation, urlsDuSitemap } from '../../../scripts/collecte-hop/hopslist.mjs';

const tr = (a: string, b: string) => `<tr><td>${a}</td><td>${b}</td></tr>`;
const page = (rows: string) => `<html><body><h1 class="entry-title">Houblon d’essai®</h1><div class="entry-content"><p>Texte libre à ne pas recopier.</p>
<table width="620"><tbody>${rows}</tbody></table><table><tr><td>Where to buy</td></tr></table></div></body></html>`;
const base = tr('Also Known As', 'HE-1, Essai Gold') + tr('Characteristics', '') + tr('Purpose', 'Aroma') + tr('Alpha Acid Composition', '12.5%-14%')
  + tr('Beta Acid Composition', 'Unknown') + tr('Co-Humulone Composition', '32%-35%') + tr('Country', 'US') + tr('Yield Amount', '2450-2550 kg/hectare (2190-2275 lbs/acre)')
  + tr('Storability', 'Retains 60%-70% alpha acid after 6 months storage at 20ºC (68ºF)') + tr('Total Oil Composition', '1.5-2.8 mls/100 grams')
  + tr('Myrcene Oil Composition', '40%-45%') + tr('Farnesene Oil', 'Trace Amounts') + tr('Caryophyllene Oil', '< 1%') + tr('Linalool', '0.4-0.8%')
  + tr('Substitutes', '<a href="http://www.hopslist.com/hops/dual-purpose-hops/nugget/">Nugget</a>, <a href="http://www.hopslist.com/hops/bittering-hops/galena/">Galena</a>')
  + tr('Style Guide', 'India Pale Ale, Pale Ale') + tr('Lineage', 'Cross of A & B');

describe('lireFicheHopslist', () => {
  const f = lireFicheHopslist(page(base), 'https://www.hopslist.com/hops/aroma-hops/essai/')!;
  it('lit le nom, la marque et la catégorie de l’adresse', () => {
    expect(f.nom).toBe('Houblon d’essai');
    expect(f.marque).toBe(true);
    expect(f.categorie).toBe('aroma');
  });
  it('lit les plages avec leur unité, et un « Unknown » reste null', () => {
    expect(f.champs.alpha).toMatchObject({ min: 12.5, max: 14, unite: '%', brut: '12.5%-14%' });
    expect(f.champs.beta).toMatchObject({ min: null, max: null, valeur: null, brut: 'Unknown' });
    expect(f.champs.huileTotale).toMatchObject({ min: 1.5, max: 2.8, unite: 'mL/100 g' });
    expect(f.champs.cohumulone).toMatchObject({ min: 32, max: 35, base: '% des α' });
  });
  it('garde la base écrite par l’étiquette (huile) et jamais un zéro pour un qualitatif', () => {
    expect(f.champs.myrcene).toMatchObject({ min: 40, max: 45, base: '% de l’huile' });
    expect(f.champs.farnesene).toMatchObject({ valeur: null, min: null, qualitatif: 'traces' });
    expect(f.champs.caryophyllene).toMatchObject({ min: null, max: 1, borne: '<' });
    expect(f.champs.linalol).toMatchObject({ min: 0.4, max: 0.8 });
  });
  it('lit le rendement, la conservation, les listes et la lignée', () => {
    expect(f.champs.rendement).toMatchObject({ min: 2450, max: 2550, unite: 'kg/ha' });
    expect(f.champs.conservation).toMatchObject({ min: 60, max: 70, moisStockage: 6, temperatureC: 20 });
    expect(f.listes.alias).toEqual(['HE-1', 'Essai Gold']);
    expect(f.listes.substituts.map((s: { nom: string }) => s.nom)).toEqual(['Nugget', 'Galena']);
    expect(f.listes.styles).toEqual(['India Pale Ale', 'Pale Ale']);
    expect(f.listes.origine).toEqual(['US']);
    expect(f.listes.lignee).toEqual(['Cross of A & B']);
  });
  it('ne copie pas la prose de la page', () => {
    expect(JSON.stringify(f)).not.toContain('Texte libre');
  });
  it('rend null pour une page sans tableau de caractéristiques', () => {
    expect(lireFicheHopslist('<html><body><h1>Autre page</h1></body></html>', 'https://www.hopslist.com/x/')).toBeNull();
  });
});

describe('lireRendement et lireConservation', () => {
  it('lit une valeur seule et une faute de frappe du site', () => {
    expect(lireRendement('1120 kg/ hectare (1000 lbs/acre)')).toMatchObject({ valeur: 1120, unite: 'kg/ha' });
    expect(lireRendement('220 kg/gectare (200 lbs/acre)')).toMatchObject({ valeur: 220 });
    expect(lireRendement('')).toMatchObject({ valeur: null, brut: null });
  });
  it('lit « 20 degrees C » et laisse un texte qualitatif en brut', () => {
    expect(lireConservation('Retains 85% alpha acid after 6 months storage at 20 degrees C')).toMatchObject({ valeur: 85, temperatureC: 20 });
    expect(lireConservation('Poor')).toMatchObject({ valeur: null, brut: 'Poor' });
  });
});

describe('urlsDuSitemap', () => {
  it('ne garde que les fiches de variété, en https, triées et sans doublon', () => {
    const xml = '<urlset><url><loc>http://www.hopslist.com/hops/aroma-hops/b/</loc></url><url><loc>http://www.hopslist.com/hops/aroma-hops/a/</loc></url><url><loc>http://www.hopslist.com/blog-posts/x/</loc></url><url><loc>http://www.hopslist.com/hops/aroma-hops/a/</loc></url></urlset>';
    expect(urlsDuSitemap(xml)).toEqual(['https://www.hopslist.com/hops/aroma-hops/a/', 'https://www.hopslist.com/hops/aroma-hops/b/']);
  });
});
