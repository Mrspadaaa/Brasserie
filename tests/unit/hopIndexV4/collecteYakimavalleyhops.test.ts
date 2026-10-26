// Voie c3c (#180) : lecteur Yakima Valley Hops sur du HTML synthétique (profil en texte, plages entre parenthèses).
import { describe, expect, it } from 'vitest';
import { lireProduitYvh, valeursDesLignes, valeursDuProfil } from '../../../scripts/collecte-hop/yakimavalleyhops.mjs';

describe('lecteur Yakima Valley Hops', () => {
  it('lit les plages citées dans le texte du profil', () => {
    const c = valeursDuProfil('Avec un alpha moyen-haut (8-11%) et la plus forte teneur en myrcene oil content (68-70%), il pousse un total oil (1.5-1.9 mL/100g).');
    expect(c.alpha).toMatchObject({ min: 8, max: 11, unite: '%' });
    expect(c.myrcene).toMatchObject({ min: 68, max: 70 });
    expect(c.huileTotale).toMatchObject({ min: 1.5, max: 1.9, unite: 'mL/100 g' });
  });
  it('le myrcène de l’huile n’est pas pris pour l’huile totale', () => {
    expect(valeursDuProfil('myrcene oil content (68-70%)').huileTotale).toBeUndefined();
  });
  it('lit le profil d’une page : arômes, substituts, mise à jour', () => {
    const html = `<html><body><div>Exemplum Hops</div><div>EXEMPLUM® c.v. Hop Profile</div><div>Un houblon alpha (8-11%) classique.</div>
    <div>Aroma: Orange, lemon and flowers</div><div>EXEMPLUM HOP SUBSTITUTIONS</div><div>Il ressemble à Cascade et Centennial: similar characteristics as Cascade, Centennial, and Cashmere, making these hops suitable.</div>
    <div>Updated Dec. 2025</div></body></html>`;
    const p = lireProduitYvh(html)!;
    expect(p.entete).toBe('EXEMPLUM c.v.');
    expect(p.champs.alpha).toMatchObject({ min: 8, max: 11 });
    expect(p.aromes).toEqual(["Orange", "lemon", "flowers"]);
    expect(p.substituts).toEqual(['Cascade', 'Centennial', 'Cashmere']);
    expect(p.maj).toBe('Dec. 2025');
  });
  it('forme 1 : tableau « Analytical Data » (libellé, puis valeur), rapport α/β, lots (voie c3g)', () => {
    const html = `<html><body><div>Add to cart</div><div>Exemplum Hop Profile</div><div>Texte.</div>
    <div>2026 Exemplum Lot Information and Analysis</div><div>LOT</div><div>Alpha Acid</div><div>Total Oils</div><div>Lot COA PDF</div><div>AB123</div><div>13.1%</div><div>2.3 ml/100g</div><div>Exemplum AB123</div>
    <div>Exemplum Analytical Data</div><div>Ancestry</div><div>Perle, Saaz</div><div>Alpha Acids</div><div>13.0 - 18.5 %</div><div>Alpha/Beta Ratio</div><div>1.3 - 2.7</div>
    <div>Cohumulone (% of AA)</div><div>32.0 - 43.0</div><div>Total Oils</div><div>2.6 - 3.3 ml/100g</div><div>Myrcene (% of total oil)</div><div>32.0 - 56.0</div><div>Farnesene (% of total oil)</div><div>&lt; 1.0</div>
    <div>Your cart</div></body></html>`;
    const p = lireProduitYvh(html)!;
    expect(p.champs.alpha).toMatchObject({ min: 13, max: 18.5, unite: '%' });
    expect(p.champs.rapportAlphaBeta).toMatchObject({ min: 1.3, max: 2.7, unite: null });
    expect(p.champs.cohumulone).toMatchObject({ min: 32, max: 43, base: '% des α' });
    expect(p.champs.huileTotale).toMatchObject({ min: 2.6, max: 3.3, unite: 'mL/100 g' });
    expect(p.champs.myrcene).toMatchObject({ min: 32, max: 56, base: "% de l'huile" });
    expect(p.champs.farnesene).toMatchObject({ max: 1, operateur: '<' });
    expect(p.lignee).toEqual(['Perle', 'Saaz']);
    expect(p.lots).toHaveLength(1);
    expect(p.lots[0]).toMatchObject({ lot: 'AB123', annee: '2026', alpha: { valeur: 13.1 }, huileTotale: { valeur: 2.3 } });
  });
  it('formes 2 à 4 : « Alpha: 3.5-5.0% », « Alpha Acids* 14 - 15 % », « Myrcene Oil 39%-42% », « 39% of total oil », « Up to », « ~ »', () => {
    const html = `<html><body><div>Add to cart</div><div>Exemplum Hop Profile</div>
    <div>Alpha: 3% to 5.5%</div><div>Beta Acids* 4.5 - 5.5 %</div><div>Cohumulone 32 - 38 % of alpha acids</div><div>Total Oil 2.5 - 4.5 ml/100g</div>
    <div>Myrcene Oil 39%-42%</div><div>Humulene</div><div>39% of total oil</div><div>Caryophyllene: Up to 8.3</div><div>Farnesene 0 % of total oil</div>
    <div>Cuhomulone</div><div>12 - 14</div><div>Alpha</div><div>Acids* 3 - 5 %</div><div>Total Oils mL/100g: 1-3</div><div>Payment &amp; Security</div></body></html>`;
    const c = lireProduitYvh(html)!.champs;
    expect(c.alpha).toMatchObject({ min: 3, max: 5.5, brut: '3% to 5.5%' });
    expect(c.beta).toMatchObject({ min: 4.5, max: 5.5 });
    expect(c.cohumulone).toMatchObject({ min: 32, max: 38, base: '% des α' });
    expect(c.huileTotale).toMatchObject({ min: 2.5, max: 4.5 });
    expect(c.myrcene).toMatchObject({ min: 39, max: 42 });
    expect(c.humulene).toMatchObject({ valeur: 39, base: "% de l'huile" });
    expect(c.caryophyllene).toMatchObject({ max: 8.3, min: null });
    expect(c.farnesene).toMatchObject({ valeur: null, zeroPublie: true });
  });
  it('un libellé suivi d’un texte n’est pas une valeur (prose de « Hop Profile »)', () => {
    const c = valeursDesLignes(['Alpha acids contribute bitterness.', 'Myrcene', 'Lemon and lime']);
    expect(c).toEqual({});
  });
  it('une page sans « Hop Profile » rend null', () => {
    expect(lireProduitYvh('<html><body><div>T-shirt</div></body></html>')).toBeNull();
  });
});
