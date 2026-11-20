// @vitest-environment jsdom
// T4-7 (passe 5 en ligne, 20.11) : « Fûts › Marquer propre enchaîne cinq questions de dose, une par produit (Soude, Acide phosphorique,
// Désinfectant, Star San, PBW), et les repose à chaque lavage tant qu'on répond « Pas maintenant » ; sans dose, rien n'est décompté
// et aucun Annuler n'est offert. »
// Lecture étroite : UNE feuille qui liste les produits et leurs doses ; « Pas maintenant » retenu (plus redemandé, lavage suivant compris,
// tant qu'on ne rouvre pas le réglage) ; un Annuler du lavage même sans dose (le fût est remis à laver).
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Geste, RegleConsommation } from '../../src/domain/consommation/gestes';
import { tableDuGeste } from '../../src/domain/consommation/gestes';
import { BandeauEffets } from '../../src/ui/BandeauEffets';
import { EffetsGeste } from '../../src/services/effetsGeste';

const NOMS: [string, string, string][] = [['SOUDE', 'Soude', 'kg'], ['ACIDE', 'Acide phosphorique', 'L'], ['DESINF', 'Désinfectant', 'L'], ['STARSAN', 'Star San', 'L'], ['PBW', 'PBW', 'kg']];
const banc = vi.hoisted(() => ({
  regles: [] as unknown[], doses: [] as [string, number][], reportees: [] as string[], rouvertes: [] as string[], rejoues: 0, annules: 0,
  mouvements: [] as { gesteId: string; type: string }[]
}));

vi.mock('../../src/services/storage', async () => {
  const { EffetsGeste: E } = await import('../../src/services/effetsGeste');
  return {
    StorageService: {
      getStocks: () => ({ rawMaterials: [], cleaning: NOMS.map(([ref, name, unit]) => ({ ref, name, unit, category: 'CIP alcalin', currentStock: 5, minStock: 0 })) }),
      getMouvementsGestes: () => banc.mouvements,
      retenirDose: (r: { id: string }, q: number) => { banc.doses.push([r.id, q]); },
      reporterDoses: (rs: { id: string }[]) => { rs.forEach(r => banc.reportees.push(r.id)); },
      rouvrirDoses: (rs: { id: string }[]) => { rs.forEach(r => banc.rouvertes.push(r.id)); },
      enregistrerGeste: (g: Geste) => { banc.rejoues += 1; return { gesteId: 'G', mouvements: [], effets: [], manquantes: [], alertes: [], g, E }; },
      annulerGeste: () => { banc.annules += 1; return { success: true, message: 'Déjà annulé ; rien à rendre.' }; }
    }
  };
});

const geste: Geste = { type: 'lavage-fut', objet: 'ZZ-F7', cycle: 1, libelle: 'Fût ZZ-F7 lavé', quantites: { unites: 1 } };
const regles = (reportee = false): RegleConsommation[] => NOMS.map(([ref, , unit]) => ({ id: `LAVAGE-FUT-${ref}`, geste: 'lavage-fut', stockItemRef: ref, unite: unit === 'kg' ? 'g' : 'ml', par: 'unite' as const, active: true, ...(reportee ? { reportee: true } : {}) }));
const annonce = (manquantes: RegleConsommation[]) => act(() => { EffetsGeste.annoncer({ geste, gesteId: 'GESTE-LAVAGE-FUT-ZZ-F7-1', effets: [], manquantes, alertes: [] }); });

beforeEach(() => { banc.doses = []; banc.reportees = []; banc.rouvertes = []; banc.rejoues = 0; banc.annules = 0; banc.mouvements = []; });
afterEach(() => { act(() => { EffetsGeste.fermer(); }); cleanup(); });

describe('T4-7 · une seule feuille de doses pour un lavage', () => {
  it('cinq produits sans dose : une feuille qui les liste tous, une question et non cinq', () => {
    render(<BandeauEffets />);
    annonce(regles());
    expect(document.querySelectorAll('[data-effet-question]')).toHaveLength(1);
    const feuille = document.querySelector('[data-effet-question]') as HTMLElement;
    for (const [, nom] of NOMS) expect(within(feuille).getByText(nom)).toBeTruthy();
    expect(within(feuille).getAllByRole('slider')).toHaveLength(5);
    expect(within(feuille).getAllByRole('button', { name: 'Pas maintenant' })).toHaveLength(1);
  });

  it('« Pas maintenant » : les cinq sont retenus à reporter, la feuille disparaît, rien n’est redemandé', () => {
    render(<BandeauEffets />);
    annonce(regles());
    fireEvent.click(screen.getByRole('button', { name: 'Pas maintenant' }));
    expect(banc.reportees).toHaveLength(5);
    expect(document.querySelector('[data-effet-question]')).toBeNull();
    expect(banc.doses).toEqual([]);
  });

  it('un lavage suivant dont les doses sont déjà reportées ne repose aucune question, et dit comment les régler', () => {
    render(<BandeauEffets />);
    annonce(regles(true));
    expect(document.querySelector('[data-effet-question]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Régler les doses/ }));
    expect(banc.rouvertes).toHaveLength(5);
    expect(document.querySelector('[data-effet-question]')).not.toBeNull();
  });

  it('« Retenir » écrit chaque dose donnée, reporte les autres, et rejoue le geste une seule fois', () => {
    render(<BandeauEffets />);
    annonce(regles());
    const feuille = document.querySelector('[data-effet-question]') as HTMLElement;
    const curseurs = within(feuille).getAllByRole('slider');
    fireEvent.change(curseurs[4], { target: { value: '30' } }); // PBW 30 g
    fireEvent.click(within(feuille).getByRole('button', { name: 'Retenir' }));
    expect(banc.doses).toEqual([['LAVAGE-FUT-PBW', 30]]);
    expect(banc.reportees).toHaveLength(4);
    expect(banc.rejoues).toBe(1);
  });

  it('sans dose, le lavage garde un Annuler (le fût est remis à laver) ; il défait et le dit', () => {
    const defaire = vi.fn();
    render(<BandeauEffets />);
    annonce(regles(true));
    act(() => { EffetsGeste.surAnnulation('GESTE-LAVAGE-FUT-ZZ-F7-1', { dit: 'le fût est remis à laver', defaire }); });
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(defaire).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Annulé : le fût est remis à laver/)).toBeTruthy();
    expect(screen.queryByText(/le stock est rendu/)).toBeNull();
  });
});

describe('T4-7 · la table d’un geste garde le report', () => {
  it('une règle reportée reste dans la table, sans dose, avec son report', () => {
    const table = tableDuGeste('lavage-fut', regles(true), []);
    expect(table.every(r => r.reportee && r.quantite === undefined)).toBe(true);
  });
});
