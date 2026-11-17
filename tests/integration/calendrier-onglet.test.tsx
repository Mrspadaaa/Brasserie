import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { Batch } from '../../src/types';
import { CalendrierTab } from '../../src/components/tabs/CalendrierTab';
import { BottomNav } from '../../src/components/BottomNav';
import { plusMenuFor } from '../../src/domain/plusEcran';
import { fabActionFor } from '../../src/domain/fabActions';
import { semainesDe } from '../../src/domain/calendrier';
import { usePlusPageActions } from '../../src/ui/plusPage';
import { todayISO } from '../../src/domain/finance/ledger';

afterEach(cleanup);

const aujourdhui = todayISO();
const semaines = semainesDe(aujourdhui);
const suisse = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
const props = (batches: Batch[]) => ({
  transactions: [], batches, stockItems: [], onOpenBatch: vi.fn(), onOpenFinances: vi.fn(), onOpenAgenda: vi.fn(),
  onOpenCourses: vi.fn(), onPoserBrassin: vi.fn(), onPoserFete: vi.fn(), onPoserDepense: vi.fn()
});
const planifie = (semaine: number): Batch => ({ id: 'B-040', name: 'Porter d’hiver', status: 'planifie', brewDate: '', plannedBrewDate: suisse(semaines[semaine].debut) } as unknown as Batch);

describe('Onglet Calendrier (onglet/v1)', () => {
  it('la barre compte six onglets, Calendrier entre Finances et Brassins', () => {
    render(<BottomNav activeTab="calendrier" onChangeTab={() => undefined} criticalStockCount={0} />);
    const noms = within(screen.getByRole('navigation', { name: 'Navigation principale' })).getAllByRole('button').map(b => b.textContent?.trim()).filter(t => t !== 'Compagnon');
    expect(noms).toEqual(['Bord', 'Finances', 'Calendrier', 'Brassins', 'Stocks', 'Clients']);
    expect(screen.getByRole('button', { name: 'Calendrier' })).toHaveAttribute('aria-current', 'page');
  });

  it('le + du Calendrier : pas d’action pleine, ses trois gestes viennent de l’écran, avec la semaine touchée', () => {
    expect(fabActionFor('calendrier').intent).toBe('quickAction');
    expect(plusMenuFor('calendrier').ecran).toBe('calendrier');
    const p = props([]);
    function Lecteur() { const decl = usePlusPageActions(); return <ul>{decl?.actions.map(a => <li key={a.id}>{a.label}</li>)}</ul>; }
    render(<><CalendrierTab {...p} /><Lecteur /></>);
    expect(screen.getByText(/^Poser un brassin en S\d+$/)).toBeInTheDocument();
    expect(screen.getByText('Poser une fête ou un marché')).toBeInTheDocument();
    expect(screen.getByText(/^Prévoir une dépense en S\d+$/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('tab')[2]);
    const sem = semaines[2].numero;
    expect(screen.getByText(`Poser un brassin en S${sem}`)).toBeInTheDocument();
  });

  it('sans rien de posé, l’écran le dit sans exemple inventé', () => {
    render(<CalendrierTab {...props([])} />);
    expect(screen.getByText('Rien de posé sur ces 6 semaines.')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(6);
  });

  it('un brassin planifié à la semaine 3 : la semaine courante est vide, toucher S+3 le montre, « Aujourd’hui » revient', () => {
    const p = props([planifie(3)]);
    render(<CalendrierTab {...p} />);
    expect(screen.getByText('Rien cette semaine.')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('tab')[3]);
    const rangee = screen.getAllByRole('button', { name: /B-040 Porter d’hiver/ })[0];
    expect(rangee).toHaveTextContent(/brassage prévu le/);
    fireEvent.click(rangee);
    expect(p.onOpenBatch).toHaveBeenCalledWith('B-040');
    fireEvent.click(screen.getByRole('button', { name: 'Aujourd’hui' }));
    expect(screen.getByText('Rien cette semaine.')).toBeInTheDocument();
  });
});
