import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
import { StorageService } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { CreativeLabTab } from '../../src/components/CreativeLabTab';

/* Passe 2 de fix-tarifs : « Ouvrir la vente » reste dans l'Atelier. La vente s'ouvre dans sa feuille PAR-DESSUS Tarifs ; la fermer
   (ou la corriger) laisse Tarifs sous les yeux, sans filtre posé dans Finances. Données fictives « ZZ TEST ». */

const vente = (id: string, date: string, vendor: string, fmt: string, litres: number, q: number, cents: number) => ({
  id, date, description: `Vente ${q} × Bière — ${vendor}`, category: 'recettes', subcategory: 'Ventes', amountHT: cents / 100, amountTTC: cents / 100, tvaRate: 0, tvaAmount: 0,
  finance: { version: 1, kind: 'income', amountCents: cents, vendor, paymentStatus: 'paid', lines: [{ id: `${id}-0`, description: 'Bière', kind: 'other', quantity: q, unit: 'pièce', unitPriceCents: Math.round(cents / q), amountCents: cents, sourceReference: `vente:-:${fmt}:${litres}` }] }
});

beforeEach(() => {
  window.history.replaceState({}, '', '/?dev-local');
  FirestoreRepo.startSync();
  act(() => {
    StorageService.saveClients([{ id: 'CL-ZZ', name: 'ZZ TEST Restaurant', type: 'Pro', contact: '', phone: '', email: '' }] as any);
    for (const t of [vente('ZZ-V1', '05.11.2026', 'ZZ TEST Café', 'fut', 20, 1, 14000), vente('ZZ-V2', '08.11.2026', 'ZZ TEST Café', '33cl', 0.33, 24, 8400), vente('ZZ-V4', '10.11.2026', 'ZZ TEST Restaurant', '75cl', 0.75, 10, 569500)]) FirestoreRepo.put('transactions' as any, t.id, t as any);
  });
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('a · « Ouvrir la vente » ne quitte pas l\'Atelier', () => {
  it('A-1 · la vente s\'ouvre dans sa feuille par-dessus Tarifs, sans demander à l\'app de changer d\'onglet ; Fermer (44 px) ramène sur Tarifs, intact', () => {
    const quitter = vi.fn((e: Event) => e.preventDefault());
    window.addEventListener('affinee:ouvrir-operation', quitter);
    try {
      render(<CreativeLabTab openSectionRequest={{ section: 'pricing-test', at: 1 }} />);
      const groupe = screen.getByRole('group', { name: 'Prix à vérifier' });
      fireEvent.click(within(groupe).getByRole('button', { name: /Ouvrir la vente/ }));
      expect(quitter).not.toHaveBeenCalled();
      const feuille = screen.getByRole('dialog', { name: /Vente 10 × Bière — ZZ TEST Restaurant/ });
      expect(within(feuille).getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
      // Tarifs reste monté dessous : la rangée « à vérifier » est toujours là.
      expect(screen.getByRole('group', { name: 'Prix à vérifier', hidden: true })).toBeInTheDocument();
      fireEvent.click(feuille.querySelector('.fiche-x') as HTMLElement);
      expect(screen.queryByRole('dialog', { name: /Vente 10 × Bière/ })).not.toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Prix à vérifier' })).toBeInTheDocument();
    } finally { window.removeEventListener('affinee:ouvrir-operation', quitter); }
  });

  it('A-2 · corrigée par Modifier dans la feuille, la vente quitte « à vérifier » et revient sur l\'axe, sans quitter Tarifs', () => {
    render(<CreativeLabTab openSectionRequest={{ section: 'pricing-test', at: 1 }} />);
    fireEvent.click(within(screen.getByRole('group', { name: 'Prix à vérifier' })).getByRole('button', { name: /Ouvrir la vente/ }));
    fireEvent.click(within(screen.getByRole('dialog', { name: /Vente 10 × Bière/ })).getByRole('button', { name: 'Modifier' }));
    // Le formulaire de saisie s'ouvre à son tour, toujours dans l'Atelier.
    expect(screen.getAllByRole('dialog').length).toBeGreaterThan(0);
    act(() => {
      const t = StorageService.getTransactions().find((x) => x.id === 'ZZ-V4')!;
      const l = { ...t.finance!.lines![0], amountCents: 56950, unitPriceCents: 5695 };
      FirestoreRepo.put('transactions' as any, t.id, { ...t, amountHT: 569.5, amountTTC: 569.5, finance: { ...t.finance, amountCents: 56950, lines: [l] } } as any);
    });
    expect(screen.queryByRole('group', { name: 'Prix à vérifier' })).not.toBeInTheDocument();
  });
});
