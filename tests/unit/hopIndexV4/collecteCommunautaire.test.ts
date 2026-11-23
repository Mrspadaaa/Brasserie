// Voie c3d (#180) : les outils communs (robots.txt, lecture des valeurs, rattachement sans forcer). Aucun réseau.
import { describe, expect, it } from 'vitest';
import { analyserRobots, permis, lireValeur, rattacher, indexCatalogue, liste } from '../../../scripts/collecte-hop/communautaire-commun.mjs';

describe('robots.txt', () => {
  it('applique le groupe * et sa règle la plus longue', () => {
    const r = analyserRobots('User-agent: *\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php\nCrawl-delay: 10\n');
    expect(r.delai).toBe(10);
    expect(permis(r, '/wp-admin/x')).toBe(false);
    expect(permis(r, '/wp-admin/admin-ajax.php')).toBe(true);
    expect(permis(r, '/hops/cascade/')).toBe(true);
  });
  it('gère les jokers et les groupes d’autres agents', () => {
    const r = analyserRobots('User-agent: ClaudeBot\nDisallow: /\n\nUser-agent: *\nDisallow: /*?sort=\nDisallow: /recipe/print/$\n');
    expect(permis(r, '/hops/?sort=name')).toBe(false);
    expect(permis(r, '/recipe/print/')).toBe(false);
    expect(permis(r, '/recipe/print/x')).toBe(true);
    expect(permis(r, '/hops/')).toBe(true);
  });
  it('relève les directives d’un fichier servi sur une seule ligne', () => {
    const r = analyserRobots('# Entête # User-agent: GPTBot Disallow: / User-agent: * Disallow: /user/ Disallow: /search/ Crawl-delay: 10');
    expect(permis(r, '/search/x')).toBe(false);
    expect(permis(r, '/taxon/1')).toBe(true);
    expect(r.delai).toBe(10);
  });
});

describe('lireValeur', () => {
  it('lit plages, points, unités et décimales à virgule', () => {
    expect(lireValeur('12.5%-14%')).toMatchObject({ min: 12.5, max: 14, unite: '%' });
    expect(lireValeur('1,8-2,2 mL/100g')).toMatchObject({ min: 1.8, max: 2.2, unite: 'mL/100 g' });
    expect(lireValeur('46%')).toMatchObject({ valeur: 46 });
  });
  it('« Unknown », « - », vide et « 0-0 » sont null, jamais 0', () => {
    for (const t of ['Unknown', '-', '', '0-0', 'N/A']) expect(lireValeur(t)).toMatchObject({ valeur: null, min: null, max: null });
  });
  it('« Trace » et « None » sont qualitatifs, « < 1% » est une borne haute', () => {
    expect(lireValeur('Trace Amounts')).toMatchObject({ valeur: null, qualitatif: 'traces' });
    expect(lireValeur('None')).toMatchObject({ valeur: null, qualitatif: 'aucun' });
    expect(lireValeur('< 1%')).toMatchObject({ min: null, max: 1, borne: '<' });
  });
});

describe('rattacher', () => {
  const index = indexCatalogue([{ id: 'a', name: 'Hallertau Mittelfrüh', aliases: ['Mittelfrüh'] }, { id: 'b', name: 'Citra', aliases: ['HBC 394'] }, { id: 'c', name: 'Saaz', aliases: [] }, { id: 'd', name: 'Saaz', aliases: [] }]);
  const noms = new Map([['a', 'Hallertau Mittelfrüh'], ['b', 'Citra']]);
  it('relie par le nom (sans suffixe de pays) et par un alias de nom proche', () => {
    expect(rattacher('Citra (US)', [], index, noms)).toMatchObject({ varietyId: 'b', rattachement: 'nom' });
    expect(rattacher('Hallertau', ['Mittelfrüh'], index, noms)).toMatchObject({ varietyId: 'a', rattachement: 'alias' });
  });
  it('lit un nom avec pays tel quel (DE devient GR), et ne ramène pas un pays à un autre', () => {
    const pays = indexCatalogue([{ id: 'm-gr', name: 'Magnum (GR)', aliases: [] }, { id: 'm-us', name: 'Magnum (US)', aliases: [] }, { id: 's-cz', name: 'Saaz (CZ)', aliases: [] }]);
    const n = new Map([['m-gr', 'Magnum (GR)'], ['m-us', 'Magnum (US)'], ['s-cz', 'Saaz (CZ)']]);
    expect(rattacher('Magnum (DE)', [], pays, n)).toMatchObject({ varietyId: 'm-gr', rattachement: 'nom' });
    expect(rattacher('Magnum', [], pays, n)).toMatchObject({ varietyId: null, ambigu: ['m-gr', 'm-us'] });
    expect(rattacher('Saaz (US)', [], pays, n).varietyId).toBeNull();
    expect(rattacher('Saaz', [], pays, n)).toMatchObject({ varietyId: 's-cz' });
  });
  it('refuse un alias qui est le code d’un autre houblon, et un nom ambigu', () => {
    expect(rattacher('Cicero', ['HBC 394'], index, noms)).toMatchObject({ varietyId: null, douteux: 'b' });
    expect(rattacher('Saaz', [], index, noms)).toMatchObject({ varietyId: null, ambigu: ['c', 'd'] });
    expect(rattacher('Inconnu', [], index, noms).varietyId).toBeNull();
  });
});

describe('liste', () => {
  it('découpe sans doublon', () => {
    expect(liste('Pale Ale, IPA, Pale Ale')).toEqual(['Pale Ale', 'IPA']);
  });
});
