// Voie c3c (#180) : lecteur NZ Hops sur du HTML synthétique.
import { describe, expect, it } from 'vitest';
import { lireProduitNz } from '../../../scripts/collecte-hop/nzhops.mjs';

const page = (corps: string[]) => `<html><body>${corps.map(x => `<div>${x}</div>`).join('')}<a href="https://cdn.shopify.com/s/files/x/Exemplum_Variety_Sheet_English.pdf?v=1">fiche</a></body></html>`;

describe('lecteur NZ Hops', () => {
  it('lit le nom, l’α en plage, l’accroche courte et les années de récolte', () => {
    const p = lireProduitNz(page(['Exemplum™', '(5.5-10% AA)', 'Un houblon d’arôme citronné.', 'Crop Year', '2019', '2020', '2019', 'Pack', '1 kg']))!;
    expect(p.nom).toBe('Exemplum');
    expect(p.alpha).toMatchObject({ min: 5.5, max: 10, unite: '%' });
    expect(p.accroche).toBe('Un houblon d’arôme citronné.');
    expect(p.recoltes).toEqual(['2019', '2020']);
    expect(p.pdfs).toHaveLength(1);
  });
  it('un produit sans « % AA » (levure, etc.) rend null', () => {
    expect(lireProduitNz(page(['Levure sèche', 'Fermentis']))).toBeNull();
  });
});
