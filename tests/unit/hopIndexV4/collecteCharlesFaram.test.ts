// Voie c3b-europe (#180) : le lecteur Charles Faram (Hop Oracle) sur un HTML synthétique qui imite la structure d'une fiche.
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
// @ts-expect-error module .mjs sans déclaration
import { analyserFiche, lireIcone } from '../../../scripts/collecte-hop/charlesfaram.mjs';

const champ = (t: string) => `<div class="jet-listing-dynamic-field__content">${t}</div>`;
const FICHE = `<html><body>
<script type="application/ld+json">{"datePublished":"2024-12-23T11:55:08+00:00","dateModified":"2026-09-10T17:49:57+00:00"}</script>
<h1>Essai™<br />Hop Variety Characteristics</h1>
<h3 class="elementor-heading-title">Hop Variety Tech Specs</h3>
${champ('<a href="/alpha-acids/">Alpha Acid Range</a>: 13-15&#37;')}
${champ('Beta Range: 3-6.5&#37;')}
${champ('Total Oil: 1.5-3.0ml/100g')}
${champ('Flavour Intensity: No Data')}
<h3 class="elementor-heading-title">Oil Composition</h3>
${champ('Myrcene: Myrcene 30-50&#37;')}
${champ('Farnesene: Trace&#37;')}
<h3>In THe Beer</h3><img alt="Citrus" src="https://x/CharlesFaram-icon-citrus-01-citrus-1-300x300.png">
<h3>In The Rub</h3><img alt="pink grapefruit" src="https://x/CharlesFaram-icon-citrus-06-pinkgrapefruit-1-300x300.png"><img alt="logo" src="https://x/logo.svg">
<h3>More Information About Essai</h3>
</body></html>`;

describe('collecte Charles Faram', () => {
  const f = analyserFiche(FICHE, JSDOM);
  it('nom sans marque ni « Hop », dates publiées', () => {
    expect(f.nom).toBe('Essai');
    expect(f.nomEcrit).toBe('Essai™');
    expect(f.publie).toBe('2024-12-23T11:55:08+00:00');
    expect(f.modifie).toBe('2026-09-10T17:49:57+00:00');
  });
  it('champs : nom écrit, plage, unité, base', () => {
    expect(f.champs.alpha).toMatchObject({ nom: 'Alpha Acid Range', min: 13, max: 15, unite: '%' });
    expect(f.champs.beta).toMatchObject({ min: 3, max: 6.5 });
    expect(f.champs.huile_totale).toMatchObject({ min: 1.5, max: 3, unite: 'mL/100g' });
    expect(f.champs.myrcene).toMatchObject({ min: 30, max: 50, base: '% de l’huile', baseLue: true, section: 'Oil Composition' });
  });
  it('« No Data » et « Trace » ne deviennent jamais 0', () => {
    expect(f.champs.intensite_arome).toMatchObject({ valeur: null, min: null, max: null });
    expect(f.champs.farnesene).toMatchObject({ valeur: null, min: null, max: null, qualif: 'trace' });
  });
  it('descripteurs : icônes de la bière et du rub, sans le logo', () => {
    expect(f.listes.descripteursBiere).toEqual(['citrus']);
    expect(f.listes.descripteursRub).toEqual(['pinkgrapefruit']);
    expect(f.listes.famillesRub).toEqual(['citrus']);
  });
  it('lit le nom d’une icône', () => {
    expect(lireIcone('https://x/charlesfaram-icon-woody-03-resinous-1-300x300.png')).toEqual({ famille: 'woody', mot: 'resinous' });
    expect(lireIcone('logo.svg')).toBeNull();
  });
  it('une page sans titre n’est pas une fiche', () => {
    expect(analyserFiche('<html><body></body></html>', JSDOM)).toBeNull();
  });
});
