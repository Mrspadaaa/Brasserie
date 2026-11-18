import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FloatingActions } from '../../src/ui/FloatingActions';
import { BottomNav } from '../../src/components/BottomNav';
import { brewerJobs } from '../../src/services/brewerJobs';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));

beforeEach(() => { brewerJobs.stop(); localStorage.clear(); });
afterEach(() => { cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); });

const sansNom = (racine: ParentNode) => [...racine.querySelectorAll<HTMLElement>('button, [role="menuitem"], a[href]')]
  .filter(el => !(el.getAttribute('aria-label') ?? '').trim() && !(el.textContent ?? '').replace(/\s+/g, ' ').trim() && !(el.getAttribute('title') ?? '').trim());

describe('TE-48 : chaque entrée du menu « + » et chaque bouton de la barre du bas a un nom accessible', () => {
  it('la barre du bas', () => {
    render(<BottomNav activeTab="dashboard" onChangeTab={() => {}} criticalStockCount={2} />);
    expect(sansNom(document.body)).toEqual([]);
    for (const nom of ['Bord', 'Finances', 'Brassins', 'Stocks', 'Clients']) expect(screen.getByRole('button', { name: new RegExp(nom) })).toBeInTheDocument();
  });

  it('le menu « + », ouvert', () => {
    render(<FloatingActions action={{ intent: 'newClient', label: 'Nouveau client' }} onAction={() => {}} companionLabel="Clients" anchor="nav"
      onInvoice={() => {}} onSale={() => {}} onRecipe={() => {}} onBrew={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Actions rapides/ }));
    expect(sansNom(document.body)).toEqual([]);
    expect(screen.getAllByRole('menuitem').length).toBeGreaterThanOrEqual(3);
  });
});
