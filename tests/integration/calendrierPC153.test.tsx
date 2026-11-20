import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup } from '@testing-library/react';
import { ajouterJours, etiquetteS, lundiDe, type ChoseCalendrier } from '../../src/domain/calendrier';
import { pastille, type Colonne } from '../../src/ui/calendrier/frise/Rangee';

/* PC-153 : test écrit par la voie 2, il échouait tant que pastille() disait « 2 choses ». */
afterEach(() => cleanup());
const L = lundiDe('2026-11-16');
const semainesDe = (n: number): Colonne[] => Array.from({ length: n }, (_, i) => ({ debut: ajouterJours(L, i * 7), fin: ajouterJours(L, i * 7 + 6), etiquette: etiquetteS(ajouterJours(L, i * 7)) }));

describe('PC-153 : une rangée dont le seul argent est probable dit son montant, sans le dire confirmé', () => {
  const loyer = (k: number): ChoseCalendrier => ({
    id: `loyer-${k}`, rangee: 'papiers', titre: 'Loyer du local', debut: ajouterJours(L, 10 + k * 28), fin: ajouterJours(L, 10 + k * 28), centimes: -40000,
    proposition: 'echeance', probable: true, source: { genre: 'plan', id: 'P-LOYER', origine: 'recurring', statut: 'active' }, ouvre: { ecran: 'plan', id: 'P-LOYER' }, deplacable: { raison: 'Finances.' }
  } as unknown as ChoseCalendrier);

  it('« −800 probable », hors de « confirmé » (E47 c) ; la lecture le dit et ne compte aucun solde confirmé', () => {
    const p = pastille('papiers', [loyer(0), loyer(1)], semainesDe(6).concat(semainesDe(6)));
    expect(p.texte).not.toMatch(/choses?/);
    expect(p.texte).toMatch(/^−800 probable$/);
    expect(p.confirme).toBe(false);
    expect(p.solde).toBeNull();
    expect(p.part).toBe(80000);
    expect(p.lecture).toMatch(/2 probables/);
    expect(p.lecture).toMatch(/−800/);
    expect(p.lecture).not.toMatch(/confirmé/);
  });

  it('un solde confirmé reste le montant de la pastille ; sans montant connu, « n choses » comme avant', () => {
    const colonnes = semainesDe(12);
    const confirmee = { ...loyer(0), id: 'tva', proposition: undefined, probable: undefined, titre: 'TVA T4', centimes: -30000 } as unknown as ChoseCalendrier;
    expect(pastille('papiers', [confirmee, loyer(0)], colonnes).texte).toBe('−300');
    const sansMontant = { ...loyer(0), centimes: undefined } as unknown as ChoseCalendrier;
    expect(pastille('papiers', [sansMontant, { ...sansMontant, id: 'l2' } as ChoseCalendrier], colonnes).texte).toBe('2 choses');
  });
});

