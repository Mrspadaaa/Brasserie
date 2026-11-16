// @vitest-environment jsdom
/**
 * Voie v1, constat 33 (rejeu de nuit 16.11) : Réglages › Période disait « Tout l’historique » alors que la plage affichée disait « 30 jours · 1 opération »
 * et que « Du … au » restait vide. La Période et la plage disent la même chose, d'une seule source (la période de l'app).
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
import { ChoixPlage } from '../../src/components/periode/ChoixPlage';
import { titre, type Periode } from '../../src/components/periode/periode';
import type { Transaction } from '../../src/types';

const depense = (id: string, date: string): Transaction => ({
  id, description: `Dépense ${id}`, date, category: 'brassage', subcategory: '', amountHT: 10, amountTTC: 10, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents: 1000, paymentStatus: 'unpaid', recordedAt: `${date}T12:00:00Z`, lines: [] },
});
const transactions = [depense('A', '2025-03-04'), depense('B', '2026-01-20'), depense('C', '2026-11-10')];
const maintenant = new Date(2026, 10, 15);
/** Ce que Réglages › Plus montre : le titre de la période (en gras) et le choix de la plage dessous. */
const Reglages: React.FC<{ periode: Periode }> = ({ periode }) => <section><h2>Période<b>{titre(periode)}</b></h2><ChoixPlage periode={periode} onChoisir={() => {}} transactions={transactions} maintenant={maintenant} /></section>;
afterEach(cleanup);

describe('33 : la Période et la plage disent la même chose', () => {
  it('« Tout l’historique » : aucune durée en jours, un compte de toutes les opérations, « Du … au » porte l’étendue réelle', () => {
    const { container } = render(<Reglages periode={{ genre: 'tout' }} />);
    expect(screen.getAllByText(/Tout l’historique/).length).toBeGreaterThan(1);
    expect(container.textContent).not.toMatch(/\d\s*jours?\b/);
    expect(container.textContent).toMatch(/3\s*opérations/);
    expect((screen.getByLabelText('Du (jj.mm)') as HTMLInputElement).placeholder).toBe('04.03.2025');
    expect((screen.getByLabelText('Au (jj.mm)') as HTMLInputElement).placeholder).toBe('10.11.2026');
  });

  it('un historique vide : ni « 0 jour », ni champ vide muet', () => {
    const { container } = render(<section><h2>Période<b>{titre({ genre: 'tout' })}</b></h2><ChoixPlage periode={{ genre: 'tout' }} onChoisir={() => {}} transactions={[]} maintenant={maintenant} /></section>);
    expect(container.textContent).not.toMatch(/\d\s*jours?\b/);
    expect(container.textContent).toMatch(/aucune opération/i);
  });

  it('une plage de 30 jours : la Période le dit (même plage), la frise compte 30 jours', () => {
    const periode: Periode = { genre: 'dates', du: '2026-10-16', au: '2026-11-14' };
    const { container } = render(<Reglages periode={periode} />);
    expect(container.querySelector('h2 b')!.textContent).toBe('16 oct. → 14 nov.');
    expect(container.textContent).toMatch(/30\s*jours/);
    expect((screen.getByLabelText('Du (jj.mm)') as HTMLInputElement).value).toBe('16.10');
    expect((screen.getByLabelText('Au (jj.mm)') as HTMLInputElement).value).toBe('14.11');
  });

  it('un mois : titre du mois et durée du mois', () => {
    const { container } = render(<Reglages periode={{ genre: 'mois', annee: 2026, mois: 11 }} />);
    expect(container.querySelector('h2 b')!.textContent).toBe('Novembre 2026');
    expect(container.textContent).toMatch(/30\s*jours/);
  });
});
