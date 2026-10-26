// Voie c3c (#180) : lecteur Yakima Valley Hops sur du HTML synthétique (profil en texte, plages entre parenthèses).
import { describe, expect, it } from 'vitest';
import { lireProduitYvh, valeursDuProfil } from '../../../scripts/collecte-hop/yakimavalleyhops.mjs';

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
  it('une page sans « Hop Profile » rend null', () => {
    expect(lireProduitYvh('<html><body><div>T-shirt</div></body></html>')).toBeNull();
  });
});
