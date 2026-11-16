// @vitest-environment jsdom
/**
 * Voie v2, problème 1 (bloquant) du test d'écran 8b9e1732 (constat 33) : en « Tout l’historique », la ligne disait 01.06.2024 → 25.11.2026 mais la frise
 * dessinait novembre seul (1er → 30, poignées aux bouts). La frise couvre alors de la première à la dernière opération, et la ligne de compte dit la période.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
import { ChoixPlage } from '../../src/components/periode/ChoixPlage';
import { etiquettesAxe } from '../../src/ui/finance/operations/plage';
import type { Periode } from '../../src/components/periode/periode';
import type { Transaction } from '../../src/types';

const depense = (id: string, date: string): Transaction => ({
  id, description: `Dépense ${id}`, date, category: 'brassage', subcategory: '', amountHT: 10, amountTTC: 10, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents: 1000, paymentStatus: 'unpaid', recordedAt: `${date}T12:00:00Z`, lines: [] },
});
const transactions = [depense('A', '2024-06-01'), depense('B', '2025-09-20'), depense('C', '2026-11-10')];
const maintenant = new Date(2026, 10, 16);
afterEach(cleanup);

const jourDe = (el: HTMLElement) => Number(el.getAttribute('aria-valuenow'));
const joursDepuis2000 = (iso: string) => Math.round((Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) - Date.UTC(2000, 0, 1)) / 86_400_000);

describe('1 : en « Tout », la frise couvre tout l’historique', () => {
  it('les poignées bornent la première et la dernière opération, la frise dessine plus d’un mois', () => {
    const { container } = render(<ChoixPlage periode={{ genre: 'tout' } as Periode} onChoisir={() => {}} transactions={transactions} maintenant={maintenant}/>);
    const debut = screen.getByRole('slider', { name: 'Début' }), fin = screen.getByRole('slider', { name: 'Fin' });
    expect(jourDe(debut)).toBe(joursDepuis2000('2024-06-01'));
    expect(jourDe(fin)).toBe(joursDepuis2000('2026-11-10'));
    expect(container.querySelectorAll('.ops-fjours > .ops-fj').length).toBeGreaterThan(31 * 12);
    expect(container.textContent).toMatch(/Tout l’historique · 3\s*opérations/);
    expect(container.textContent).not.toMatch(/\d\s*jours?\b/);
    expect(screen.queryByRole('button', { name: 'Revenir au mois entier' })).toBeNull();
  });

  it('rien ne déborde de la piste : colonnes sans plancher de largeur, et la piste coupe ce qui dépasse', () => {
    const { container } = render(<ChoixPlage periode={{ genre: 'tout' } as Periode} onChoisir={() => {}} transactions={transactions} maintenant={maintenant}/>);
    expect((container.querySelector('.ops-fjours') as HTMLElement).style.gridTemplateColumns).toMatch(/^repeat\(\d+, minmax\(0(px)?, 1fr\)\)$/);
    expect(readFileSync('src/ui/finance/operations.css', 'utf8')).toMatch(/\.ops-fjours\s*\{[^}]*overflow-x:\s*clip/);
  });

  it('sur plus d’un an, l’axe dit l’année des bornes et marque chaque 1er janvier ; sur un mois il reste inchangé', () => {
    const longue = etiquettesAxe({ debut: '2024-06-01', nb: 908 }, { du: '2024-06-01', au: '2026-11-25' }, '2026-11-16').map(e => e.texte);
    expect(longue).toEqual(expect.arrayContaining(['juin 2024', 'nov. 2026', '2025', '2026']));
    const mois = etiquettesAxe({ debut: '2026-11-01', nb: 30 }, { du: '2026-11-01', au: '2026-11-30' }, '2026-11-16').map(e => e.texte);
    expect(mois.some(t => /20\d\d/.test(t))).toBe(false);
  });

  it('un mois seul : la frise reste celle du mois (inchangé)', () => {
    const { container } = render(<ChoixPlage periode={{ genre: 'mois', annee: 2026, mois: 11 } as Periode} onChoisir={() => {}} transactions={transactions} maintenant={maintenant}/>);
    expect(container.querySelectorAll('.ops-fjours > .ops-fj').length).toBe(30);
  });
});
