// TL-42 (07.11) : « Unité en deux langues et deux casses (« pièce »/« Stk », « Kg »/« kg ») ». La casse est réglée depuis c4c36583 ; ici la langue : une pièce s'écrit « pièce » à l'écran,
// quelle que soit l'écriture imprimée (Stk, Stück, pce), et deux écritures de la pièce dans une même bande s'additionnent au lieu de rester « 3 Stk + 2 pièce ».
// Ce que la facture imprime reste lisible dans « imprimé » et dans la ligne : la correction ne touche que l'unité affichée, jamais celle qui s'écrit au stock.
import { describe, expect, it } from 'vitest';
import { bandes, texteQte } from '../../../../src/ui/depense/groupes';
import { motUnite } from '../../../../src/ui/depense/calculPlateau';
import { uniteAffichee } from '../../../../src/ui/depense/rangees';

describe('TL-42 — la pièce s’affiche en français, une seule fois', () => {
  it.each(['Stk', 'stk', 'Stück', 'Stk.', 'pce', 'Pcs', 'pièce', 'pieces'])('« %s » s’affiche « pièce »', unite => {
    expect(uniteAffichee(unite)).toBe('pièce');
    expect(motUnite(unite, 1)).toBe('pièce');
  });
  it('les autres unités gardent leur écriture : Kg et L en capitales, g, Pck tel qu’imprimé', () => {
    expect(uniteAffichee('kg')).toBe('Kg');
    expect(uniteAffichee('l')).toBe('L');
    expect(uniteAffichee('g')).toBe('g');
    expect(uniteAffichee('Pck')).toBe('Pck');
  });
  it('« 3 Stk » et « 2 pièce » dans une même bande font « 5 pièces »', () => {
    const lignes = [
      { id: 'a', groupe: 'materiel' as const, amount: 1, quantity: 3, unit: 'Stk', uniteLisible: true, mouture: false },
      { id: 'b', groupe: 'materiel' as const, amount: 1, quantity: 2, unit: 'pièce', uniteLisible: true, mouture: false },
    ];
    expect(texteQte(bandes(lignes)[0].qte)).toBe('5 pièces');
  });
  it('une seule pièce reste au singulier', () => {
    const lignes = [{ id: 'a', groupe: 'materiel' as const, amount: 1, quantity: 1, unit: 'Stk', uniteLisible: true, mouture: false }];
    expect(texteQte(bandes(lignes)[0].qte)).toBe('1 pièce');
  });
});
