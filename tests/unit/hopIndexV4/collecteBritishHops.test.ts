// Voie c3b-europe (#180) : le lecteur de la British Hop Association sur un HTML synthétique qui imite la structure d'une fiche.
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
// @ts-expect-error module .mjs sans déclaration
import { analyserFiche } from '../../../scripts/collecte-hop/britishhops.mjs';

const ligne = (l: string, v: string) => `<div class="row alpha"><div class="label">${l}</div><div class="value">${v}</div></div>`;
const FICHE = `<html><body><h1>Essai</h1>
<div class="row characteristics"><h2>Characteristics</h2><div class="content"><p>Lemon, spicy, marmalade.</p></div></div>
<div class="row flavour-intensity"><h2>Flavour Intensity</h2><div class="content"><p>5</p> /10</div></div>
<div class="row breeding"><h2>Breeding</h2><div class="content"><p>Bred in the UK and released in 2001, a hedgerow variety.</p></div></div>
<div class="analysis"><h2>Analysis</h2>${ligne('Alpha acid', '8-11&#37;')}${ligne('Co-Humulone', '35&#37;')}${ligne('Total Oils', '0.8-1.5&#37;')}${ligne('Myrcene', '35-40&#37;')}${ligne('Farnesene', 'trace')}</div>
</body></html>`;

describe('collecte British Hop Association', () => {
  const f = analyserFiche(FICHE, JSDOM);
  it('lit les champs du tableau Analysis', () => {
    expect(f.nom).toBe('Essai');
    expect(f.champs.alpha).toMatchObject({ nom: 'Alpha acid', min: 8, max: 11, unite: '%' });
    expect(f.champs.cohumulone).toMatchObject({ valeur: 35 });
    expect(f.champs.myrcene).toMatchObject({ min: 35, max: 40, base: '% de l’huile', baseLue: false });
  });
  it('l’huile totale reste en % (pas en mL/100 g) et une trace n’est pas 0', () => {
    expect(f.champs.huile_totale).toMatchObject({ min: 0.8, max: 1.5, unite: '%', base: null });
    expect(f.champs.farnesene).toMatchObject({ valeur: null, min: null, max: null, qualif: 'trace' });
  });
  it('intensité d’arôme sur 10, descripteurs et année de sortie', () => {
    expect(f.champs.intensite_arome).toMatchObject({ valeur: 5, base: '/10' });
    expect(f.listes.descripteurs).toEqual(['Lemon', 'spicy', 'marmalade']);
    expect(f.listes.sortie).toEqual(['2001']);
  });
  it('une page sans tableau d’analyse n’est pas une fiche', () => {
    expect(analyserFiche('<html><body><h1>Autre</h1></body></html>', JSDOM)).toBeNull();
  });
});
