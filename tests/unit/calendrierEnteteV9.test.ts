import { describe, expect, it } from 'vitest';
import { causeCaisseInconnue, libellePastille } from '../../src/ui/calendrier/entete/EnTete';

describe('V9 : pastille de période et cause de la caisse inconnue', () => {
  it('libellePastille (CHV-5) : un mois dit ses semaines, jamais deux fois la même durée, ni pour An, 3 mois, 6 mois', () => {
    expect(libellePastille('Nov.', 6, false)).toBe('Nov. · 6 sem.');
    expect(libellePastille('6 sem.', 6, false)).toBe('6 sem.');
    expect(libellePastille('An', 52, true)).toBe('An');
    expect(libellePastille('T4', 13, false)).toBe('T4');
    expect(libellePastille('S1', 26, false)).toBe('S1');
  });
  it('causeCaisseInconnue (CHN-1) : des pièces payées sans paiement ne se disent plus « solde de départ inconnu »', () => {
    const c = causeCaisseInconnue('paiements');
    expect(`${c.avant} ${c.lien}`).toMatch(/paiement/i);
    expect(`${c.avant}`).not.toMatch(/Solde de départ inconnu/);
    expect(causeCaisseInconnue(null).avant).toMatch(/Solde de départ inconnu/);
  });
});
