// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CreativeItem } from '../../src/types';
import { LigneAgenda } from '../../src/components/tabs/DashboardTab';

/* T29-4 (23.11, test en ligne) : au Bord › Agenda, toucher le nom d'une fête la cochait « Fait » (la ligne était un <label>), vraie donnée.
   Sa règle (CALP-11, 21.11) : la fête, l'événement, l'idée s'ouvrent dans une feuille SUR PLACE ; seule la case coche. */

const fete = { id: 'e1', type: 'event', title: 'ZZ TEST — fête', status: 'todo', date: '2026-12-12', createdAt: '2026-11-01' } as unknown as CreativeItem;

afterEach(cleanup);

describe('T29-4 : nom → feuille, case → fait', () => {
  it('toucher le nom ouvre la feuille de la ligne et ne coche rien', () => {
    const ouvrir = vi.fn(), cocher = vi.fn();
    const { container } = render(<LigneAgenda item={fete} jour="2026-11-23" onOuvrir={ouvrir} onCocher={cocher} />);
    fireEvent.click(container.querySelector('[data-agenda-nom="e1"]') as HTMLElement);
    expect(ouvrir).toHaveBeenCalledTimes(1);
    expect(ouvrir).toHaveBeenCalledWith(fete);
    expect(cocher).not.toHaveBeenCalled();
  });

  it('seule la case coche : elle n’ouvre pas la feuille', () => {
    const ouvrir = vi.fn(), cocher = vi.fn();
    const { getByRole } = render(<LigneAgenda item={fete} jour="2026-11-23" onOuvrir={ouvrir} onCocher={cocher} />);
    fireEvent.click(getByRole('checkbox', { name: 'Fait : ZZ TEST — fête' }));
    expect(cocher).toHaveBeenCalledTimes(1);
    expect(cocher).toHaveBeenCalledWith(fete);
    expect(ouvrir).not.toHaveBeenCalled();
  });

  it('la ligne n’est plus un <label> : le texte de la ligne ne relaie aucun clic à la case', () => {
    const { container } = render(<LigneAgenda item={fete} jour="2026-11-23" onOuvrir={vi.fn()} onCocher={vi.fn()} />);
    expect(container.querySelector('label')).toBeNull();
  });

  it('une fête passée et pas faite dit « en retard » avec sa date ; faite, elle propose « Refaire »', () => {
    const { container, getByRole, rerender } = render(<LigneAgenda item={{ ...fete, date: '2026-10-12' }} jour="2026-11-23" onOuvrir={vi.fn()} onCocher={vi.fn()} />);
    expect(container.textContent).toContain('en retard');
    rerender(<LigneAgenda item={{ ...fete, status: 'done' }} jour="2026-11-23" onOuvrir={vi.fn()} onCocher={vi.fn()} />);
    expect(getByRole('checkbox', { name: 'Refaire : ZZ TEST — fête' })).toBeTruthy();
    expect(container.textContent).not.toContain('en retard');
  });
});
