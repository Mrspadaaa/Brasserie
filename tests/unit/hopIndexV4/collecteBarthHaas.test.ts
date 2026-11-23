// Voie c3b-europe (#180) : le lecteur BarthHaas sur un HTML synthétique qui imite la structure d'une fiche, sans copier la page.
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
// @ts-expect-error module .mjs sans déclaration
import { analyserFiche } from '../../../scripts/collecte-hop/barthhaas.mjs';
// @ts-expect-error module .mjs sans déclaration
import { lireValeur, canoniser, rattacher } from '../../../scripts/collecte-hop/europe-champs.mjs';
// @ts-expect-error module .mjs sans déclaration
import { analyserRobots, autorise } from '../../../scripts/collecte-hop/europe-commun.mjs';

const FICHE = `<html><body><main>
<section class="hp__hero hn__detail"><div class="container"><div class="row">
 <div class="hp__hero__product-image" data-rose-labels="citrus,sweet fruits,herbal"><canvas id="chart-area-xs-1" data-values="5.4,7.1,3.1"></canvas></div>
 <div class="col"><ul class="section-card-text__tastes"><li class="zitrus"> Orange </li><li class="susse-fruchte">Mango</li></ul>
 <h1>Essai® Hops</h1><p class="text-display-4-bold">ESS</p><p class="text-display-4">Germany</p><p>Texte libre de description.</p></div></div></div></section>
<div class="section-tabbar"><div class="columns-item"><canvas id="chart-area-wheel-1-0" data-values="5.4,7.1,3.1"></canvas><b class="text-copy-1">Typical Aroma Profile</b></div>
<div class="columns-item"><canvas id="chart-area-wheel-1-1" data-values="5.5,6.3,3.9"></canvas><b class="text-copy-1"> Aroma Profile 2023 </b></div></div>
<dl>
 <dt>CULTIVATION AREA</dt><dd>Germany</dd>
 <dt>ALPHA-ACIDS*</dt><dd>8 - 14.5%</dd>
 <dt>TOTAL OIL</dt><dd>1.1 - 2.1 ml/100 g</dd>
 <dt>FARNESEN (% OF TOTAL OIL)</dt><dd>up to 0.1%</dd>
 <dt>GERANIOL (% OF TOTAL OIL)</dt><dd>-</dd>
 <dt>THIOLS (µG/KG)</dt><dd>up to 10.7</dd>
</dl>
<p>All values represent the medium range of the last 4 years.</p>
<p>Ancestry</p><p>A x B</p>
<p>Did you know that Essai also comes as:</p><div class="section-card-text"><p class="section-card-text__headline">Lupomax®</p></div>
</main></body></html>`;

describe('collecte BarthHaas', () => {
  const f = analyserFiche(FICHE, JSDOM);
  it('lit le nom, le code, l’origine et les descripteurs', () => {
    expect(f.nom).toBe('Essai');
    expect(f.nomEcrit).toBe('Essai® Hops');
    expect(f.code).toBe('ESS');
    expect(f.origine).toBe('Germany');
    expect(f.pays).toEqual(['Germany']);
    expect(f.listes.descripteurs).toEqual(['Orange', 'Mango']);
    expect(f.listes.lignee).toEqual(['A x B']);
    expect(f.listes.formes).toEqual(['Lupomax®']);
    expect(f.periodeAnalyses).toBe('moyenne des 4 dernières années');
  });
  it('garde le nom écrit, la plage, l’unité et la base de chaque champ', () => {
    expect(f.champs.alpha).toMatchObject({ nom: 'ALPHA-ACIDS*', brut: '8 - 14.5%', min: 8, max: 14.5, valeur: null, unite: '%' });
    expect(f.champs.huile_totale).toMatchObject({ min: 1.1, max: 2.1, unite: 'mL/100 g' });
    expect(f.champs.farnesene).toMatchObject({ max: 0.1, min: null, qualif: 'jusqu’à', base: '% de l’huile', baseLue: true });
    expect(f.champs.thiols).toMatchObject({ max: 10.7, unite: 'µg/kg', base: 'µg/kg' });
  });
  it('un « - » est null, jamais 0', () => {
    expect(f.champs.geraniol).toMatchObject({ brut: '-', valeur: null, min: null, max: null });
  });
  it('lit les deux roses aromatiques avec leurs axes', () => {
    expect(f.listes.rose.axes).toEqual(['citrus', 'sweet fruits', 'herbal']);
    expect(f.listes.rose.profils).toEqual([
      { titre: 'Typical Aroma Profile', annee: null, valeurs: [5.4, 7.1, 3.1] },
      { titre: 'Aroma Profile 2023', annee: '2023', valeurs: [5.5, 6.3, 3.9] },
    ]);
  });
  it('une page sans titre n’est pas une fiche', () => {
    expect(analyserFiche('<html><body><main><p>rien</p></main></body></html>', JSDOM)).toBeNull();
  });
});

describe('lecteur de valeurs commun', () => {
  it('plage, borne, valeur seule, vide', () => {
    expect(lireValeur('0,4 - 1 %')).toMatchObject({ min: 0.4, max: 1, unite: '%' });
    expect(lireValeur('< 1')).toMatchObject({ min: null, max: 1, valeur: null });
    expect(lireValeur('12')).toMatchObject({ valeur: 12, min: null, max: null });
    for (const vide of ['', '-', 'Unknown', '0 - 0%', 'No Data']) expect(lireValeur(vide)).toMatchObject({ valeur: null, min: null, max: null });
  });
  it('« Trace » n’est pas 0 et un libellé répété devant le nombre est ignoré', () => {
    expect(lireValeur('Trace%')).toMatchObject({ valeur: null, min: null, max: null, qualif: 'trace' });
    expect(lireValeur('Myrcene 35-50%')).toMatchObject({ min: 35, max: 50 });
  });
  it('canonise les noms de champs', () => {
    expect(canoniser('Alpha Acid Range').cle).toBe('alpha');
    expect(canoniser('Beta Range').cle).toBe('beta');
    expect(canoniser('Linalool (% of Total Oil)')).toMatchObject({ cle: 'linalol', base: '% de l’huile', baseLue: true });
    expect(canoniser('Flavour Intensity').cle).toBe('intensite_arome');
  });
  it('rattache sans forcer : l’ambigu et l’inconnu restent null', async () => {
    expect((await rattacher('Citra® Hops', ['CIT'])).varietyId).toBe('beermaverick-citra');
    expect((await rattacher('Perle')).varietyId).toBeNull();
    expect((await rattacher('Variété qui n’existe pas')).varietyId).toBeNull();
  });
});

describe('robots.txt', () => {
  const r = analyserRobots('User-agent: grub\nDisallow: /\n\nUser-agent: *\nCrawl-delay: 10\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php\nDisallow: /*?id=*\n');
  it('lit la section * : délai, Disallow, Allow plus spécifique, jokers', () => {
    expect(r.delai).toBe(10000);
    expect(autorise(r, '/hops-and-products/hops/ariana')).toBe(true);
    expect(autorise(r, '/wp-admin/options.php')).toBe(false);
    expect(autorise(r, '/wp-admin/admin-ajax.php')).toBe(true);
    expect(autorise(r, '/page?id=4')).toBe(false);
  });
});
