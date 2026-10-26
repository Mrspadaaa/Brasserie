// Voie c3h (#180) : lecteur Beer Analytics, sur une page et des graphiques synthétiques (structure imitée, rien copié du site).
import { describe, expect, it } from 'vitest';
import { construireFiche, lireGraphique, lirePage, lireRobots, lireSitemap } from '../../../scripts/collecte-hop/beeranalytics.mjs';

const page = `<html><body><div class="detail-head"><header><h1>Exemplum Hops</h1></header>
<dl class="detail-info"><dt>Recipes:</dt><dd>1,234</dd><dt>Purpose:</dt><dd>Dual Purpose</dd><dt>Alpha:</dt><dd>High</dd><dt>Origin:</dt><dd>Utopia</dd></dl>
<figure class="badge-list"><figcaption>Substitutes:</figcaption><ul><li><a href="/hops/aroma/aa/" class="badge bg-primary">Aa</a></li></ul></figure>
<figure class="badge-list"><figcaption>Pairings:</figcaption><ol><li><a href="/hops/aroma/bb/" class="badge bg-secondary">Bb</a></li><li><a href="/hops/aroma/cc/" class="badge bg-secondary">Cc</a></li></ol></figure>
<figure class="badge-list"><figcaption>Flavor:</figcaption><ul><li><a href="/hops/flavors/citrus/" class="badge bg-citrus">Citrus</a></li></ul></figure></div>
<section id="profile"><div class="detail-long-description"><p>Un long paragraphe qui ne doit pas sortir.</p></div></section>
<div class="card-header"><h3 class="h5 mb-0">Alpha Acid</h3></div><div class="card-body">
  10.0
  &lt; <strong>12.5</strong>
  &lt; 14.0 <small class="text-muted">%</small></div>
<div class="card-header"><h3 class="h5 mb-0">Usage</h3></div><div class="card-body">Purpose: <strong>Dual Purpose</strong></div>
<div class="chart-s" data-chart="/hops/dual-purpose/exemplum/charts/usage-types.json"></div>
<div class="chart-s" data-chart="/hops/dual-purpose/exemplum/charts/trending-yeasts.json"></div>
</body></html>`;

describe('lecteur Beer Analytics : page', () => {
  const p = lirePage(page)!;
  it('lit le nom, la fiche d’en-tête et les listes dans l’ordre de la page', () => {
    expect(p.nom).toBe('Exemplum');
    expect(p.details).toEqual({ Recipes: '1,234', Purpose: 'Dual Purpose', Alpha: 'High', Origin: 'Utopia' });
    expect(p.listes.Pairings.map(x => x.nom)).toEqual(['Bb', 'Cc']);
    expect(p.listes.Flavor[0]).toMatchObject({ nom: 'Citrus', groupe: 'citrus' });
  });
  it('lit la plage min < milieu < max et l’unité, et ne garde pas la prose', () => {
    expect(p.cartes['Alpha Acid']).toMatchObject({ min: 10, milieu: 12.5, max: 14, unite: '%' });
    expect(JSON.stringify(p)).not.toContain('long paragraphe');
    expect(p.graphiques).toEqual(['/hops/dual-purpose/exemplum/charts/usage-types.json', '/hops/dual-purpose/exemplum/charts/trending-yeasts.json']);
  });
  it('une page sans titre n’est pas une fiche de houblon', () => { expect(lirePage('<html><body>Not found</body></html>')).toBeNull(); });
  it('construit une fiche : nombre de recettes, jamais 0 pour l’inconnu', () => {
    const lireGr = (u: string) => u.endsWith('usage-types.json')
      ? lireGraphique('usage-types', { data: [{ x: ['Boil', 'Dry Hop'], y: [10, 4], type: 'bar' }] })
      : null;   // « no_data » → graphique vide
    const f = construireFiche({ url: 'https://x/hops/dual-purpose/exemplum/', slug: 'exemplum', categorie: 'dual-purpose', releve: '2026-10-26' }, p, lireGr);
    expect(f.champs.recettes).toMatchObject({ brut: '1,234', valeur: 1234 });
    expect(f.champs.alphaClasse).toMatchObject({ brut: 'High', valeur: null });
    expect(f.listes.accords).toEqual(['Bb', 'Cc']);
    expect(f.stats['usage-types'].parMoment).toEqual([{ moment: 'Boil', recettes: 10 }, { moment: 'Dry Hop', recettes: 4 }]);
    expect(f.graphiquesVides).toEqual(['trending-yeasts']);
    expect(f.varietyId).toBeNull();   // « Exemplum » n'est pas au catalogue
  });
});

describe('lecteur Beer Analytics : graphiques', () => {
  it('« no_data » → null', () => { expect(lireGraphique('trending-yeasts', { no_data: true })).toBeNull(); });
  it('boîtes par style : les six statistiques, en fraction du poids', () => {
    const t = { type: 'box', name: 'IPA', lowerfence: [0.05], q1: [0.1], median: [0.2], mean: [0.25], q3: [0.3], upperfence: [0.9] };
    const g = lireGraphique('amount-used-per-style', { data: [t], layout: { yaxis: { title: { text: '% of Weight in Recipe' } } } })!;
    expect(g.parStyle[0]).toEqual({ style: 'IPA', borneBasse: 0.05, q1: 0.1, mediane: 0.2, moyenne: 0.25, q3: 0.3, borneHaute: 0.9 });
    expect(g.unite).toBe('% of Weight in Recipe');
  });
  it('houblons associés : un groupe par sous-graphique', () => {
    const b = (name: string, xaxis: string) => ({ type: 'box', name, xaxis, median: [0.3] });
    const g = lireGraphique('hop-pairings', { data: [b('Bb', 'x'), b('Exemplum', 'x'), b('Exemplum', 'x2'), b('Cc', 'x2')] })!;
    expect(g.associes.map((a: { houblons: { nom: string }[] }) => a.houblons.map(h => h.nom))).toEqual([['Bb', 'Exemplum'], ['Exemplum', 'Cc']]);
  });
  it('histogramme : classes « (a, b] » lues en nombres', () => {
    const g = lireGraphique('alpha-histogram', { data: [{ x: ['(12.8, 13.1]'], y: [7] }] })!;
    expect(g.classes).toEqual([{ de: 12.8, a: 13.1, compte: 7 }]);
  });
  it('popularité : série mensuelle (mois AAAA-MM), rangée à part des statistiques', () => {
    const g = lireGraphique('popularity', { data: [{ x: ['2012-01-01T00:00:00', '2012-02-01T00:00:00'], y: [0.01, 0.02] }] })!;
    expect(g.serie).toBe(true);
    expect(g.mensuelle).toEqual({ mois: ['2012-01', '2012-02'], valeur: [0.01, 0.02] });
  });
});

describe('robots.txt et sitemap', () => {
  it('seul /wa/ est interdit pour le robot générique', () => {
    const permis = lireRobots('User-agent: *\nDisallow: /wa/\nAllow: /\n\nUser-agent: GPTBot\nDisallow: /\n');
    expect(permis('/hops/dual-purpose/galaxy/charts/popularity.json')).toBe(true);
    expect(permis('/wa/t')).toBe(false);
  });
  it('le sitemap donne les houblons (hors « flavors ») et les styles', () => {
    const xml = `<urlset><url><loc>https://www.beer-analytics.com/hops/aroma/amarillo/</loc></url><url><loc>https://www.beer-analytics.com/hops/flavors/citrus/</loc></url>
      <url><loc>https://www.beer-analytics.com/styles/pale-commonwealth-beer/english-ipa/</loc></url></urlset>`;
    const { houblons, styles } = lireSitemap(xml);
    expect(houblons).toEqual([{ url: 'https://www.beer-analytics.com/hops/aroma/amarillo/', categorie: 'aroma', slug: 'amarillo' }]);
    expect(styles.get('englishipa')).toEqual(['pale-commonwealth-beer/english-ipa']);
  });
});
