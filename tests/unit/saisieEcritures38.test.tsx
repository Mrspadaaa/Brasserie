// @vitest-environment jsdom
/**
 * Voie ecr2 (23.11 soir) : la feuille de saisie rendue pour de vrai (fixtures simulées, aucune donnée réelle).
 * E38-8 : le compte ouvre une liste ; E35-13 : Apport et Pour moi ont « Revient ? » ; E38-7 : « Impôts » et « Autre entrée » dans le badge.
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { SaisieMain } from '../../src/ui/saisie/SaisieMain';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function ouvrir(genre: string) {
  render(<SaisieMain onClose={() => undefined} onDocument={() => undefined} onArticles={() => undefined} />);
  const tuile = document.querySelector<HTMLElement>(`[data-saisie-genre="${genre}"]`);
  expect(tuile, `tuile ${genre}`).toBeTruthy();
  act(() => { fireEvent.click(tuile!); });
}

describe('E38-8 : le compte ouvre la liste des comptes', () => {
  it('un toucher sur « Banque ⌄ » ouvre Banque / Espèces / TWINT / Autre ; en choisir un le pose et referme', () => {
    ouvrir('achat');
    const ouvrirCompte = document.querySelector<HTMLElement>('[data-saisie-compte-ouvrir]')!;
    expect(ouvrirCompte.textContent).toContain('Banque');
    expect(document.querySelector('[data-saisie-comptes]')).toBeNull();
    act(() => { fireEvent.click(ouvrirCompte); });
    const noms = [...document.querySelectorAll('[data-saisie-compte]')].map((e) => e.textContent);
    expect(noms).toEqual(['Banque', 'Espèces', 'TWINT', 'Autre']);
    act(() => { fireEvent.click(document.querySelector('[data-saisie-compte="twint"]')!); });
    expect(document.querySelector('[data-saisie-comptes]')).toBeNull();
    expect(document.querySelector('[data-saisie-compte-ouvrir]')!.textContent).toContain('TWINT');
  });
});

describe('E35-13 : même structure quand le sens est le même', () => {
  it.each(['apport', 'prel', 'vente', 'achat'])('« %s » a « Revient ? »', (genre) => {
    ouvrir(genre);
    expect(document.querySelector('[data-saisie-rythme="monthly"]'), genre).toBeTruthy();
  });
  it('l’impôt n’en a pas (une charge à date fixe)', () => {
    ouvrir('impot');
    expect(document.querySelector('[data-saisie-rythme="monthly"]')).toBeNull();
  });
});

describe('E38-7, E38-2 : le badge dit ce que l’écriture est', () => {
  it('Impôts', () => { ouvrir('impot'); expect(document.querySelector('[data-saisie-carte] .finance-tag')?.textContent).toBe('Impôts'); });
  it('Autre entrée', () => { ouvrir('autrei'); expect(document.querySelector('[data-saisie-carte] .finance-tag')?.textContent).toBe('Autre entrée'); });
  it('Vente reste « Ventes »', () => { ouvrir('vente'); expect(document.querySelector('[data-saisie-carte] .finance-tag')?.textContent).toBe('Ventes'); });
});

describe('E38-4 : Modifier reprend les blocs de la saisie', () => {
  it('la date est une pastille avec sa frise, « Revient ? » est un segment, la catégorie est repliée', async () => {
    const { EditTransactionModal } = await import('../../src/components/EditTransactionModal');
    const piece = {
      id: 'ZZ-MOD', date: '2026-11-18', description: 'ZZ TEST — Achat', category: 'brassage', subcategory: 'Achat', amountHT: 3.5, tvaRate: 0, tvaAmount: 0, amountTTC: 3.5,
      finance: { version: 1, kind: 'expense', amountCents: 350, lines: [], paymentStatus: 'unpaid', recordedAt: '2026-11-18T10:00:00.000Z', dueDate: '2026-12-18' }
    };
    render(<EditTransactionModal isOpen transaction={piece as never} onClose={() => undefined} onSave={() => undefined} />);
    expect(document.querySelector('input[name="tx_edit_entry_date"]')).toBeNull();
    /* E40-4 : la date est la pastille de la carte (comme la saisie) ; la frise s'ouvre au toucher */
    const date = document.querySelector('[data-modifier-date]');
    expect(date?.tagName).toBe('BUTTON');
    expect(document.querySelector('[data-modifier-saisie] [data-modifier-bande]')?.textContent).toContain('Ça sort');
    expect(document.querySelector('[data-modifier-montant]')?.textContent).toContain('CHF');
    expect(document.body.textContent).not.toContain('sans TVA');
    expect(document.querySelectorAll('[data-modifier-revient] .mod-seg button')).toHaveLength(4);
    expect(document.querySelector('[data-modifier-revient] [aria-pressed="true"]')?.textContent).toBe('1×');
    /* l'achat choisit sa catégorie en pastilles (comme la saisie), la précision reste repliée ; plus de « catégorie, précision » en champs */
    expect(document.querySelectorAll('[data-modifier-categorie] [data-saisie-categorie]').length).toBeGreaterThanOrEqual(4);
    expect(document.querySelector('[data-modifier-categorie] [aria-pressed="true"]')?.getAttribute('data-saisie-categorie')).toBe('brassage');
    expect(document.querySelector('[data-modifier-precision]')?.hasAttribute('open')).toBe(false);
    expect(document.querySelector('select[name="tx_edit_category"]')).toBeNull();
  });
});
