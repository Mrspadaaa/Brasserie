import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
import { StorageService } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { CreativeLabTab } from '../../src/components/CreativeLabTab';

// Constats 10 et 11 (jeu en ligne 16.11). Données fictives « ZZ ».
beforeEach(() => {
  window.history.replaceState({}, '', '/?dev-local');
  FirestoreRepo.startSync();
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

const items = () => StorageService.getCreativeItems();

describe('Atelier › Tarifs › Noter (constat 10)', () => {
  it('« Noter » ouvre la saisie d’une idée de prix, pas la note du Carnet ; Garder l’idée crée un pricing-test et aucune note', () => {
    const avant = items().length;
    render(<CreativeLabTab openSectionRequest={{ section: 'pricing-test', at: 1 }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Noter' }));
    const groupe = screen.getByRole('group', { name: 'Nouvelle idée de prix' });
    expect(groupe).toBeInTheDocument();
    expect(screen.queryByText('Nouvelle note / piste')).not.toBeInTheDocument();
    fireEvent.click(within(groupe).getByRole('button', { name: 'Fût' }));
    fireEvent.change(within(groupe).getByLabelText('Prix visé en CHF HT'), { target: { value: '150' } });
    act(() => { fireEvent.click(within(groupe).getByRole('button', { name: 'Garder l’idée' })); });
    const neufs = items().slice(avant);
    expect(neufs.map((i) => i.type)).toEqual(['pricing-test']);
    expect(items().some((i) => i.type === ('note' as string))).toBe(false);
  });
});

describe('Idées de prix dans le Carnet « Tout » (constat 11)', () => {
  beforeEach(() => {
    act(() => {
      StorageService.addCreativeItem({ id: 'CR-1000', type: 'pricing-test', status: 'idea', title: 'ZZ idée', format: 'fut', targetPrice: 145 } as any);
      StorageService.addCreativeItem({ id: 'CR-2000', type: 'pricing-test', status: 'idea', title: 'ZZ sans prix', format: 'growler' } as any);
      StorageService.addCreativeItem({ id: 'CR-3000', type: 'pricing-test', status: 'idea', title: 'ZZ rangée', format: 'carton', targetPrice: 40, archivedAt: '2026-11-15T10:00:00Z' } as any);
    });
  });

  it('une idée de prix se lit dans le Carnet « Tout », avec son type « Tarif », son prix, ou « prix à estimer » ; une idée archivée non', () => {
    render(<CreativeLabTab />);
    fireEvent.click(screen.getByRole('button', { name: 'Carnet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tout' }));
    const fut = screen.getByRole('button', { name: /Idée de prix Fût 20 L/ });
    expect(within(fut).getByText('Tarif')).toBeInTheDocument();
    expect(fut).toHaveTextContent('145,00 CHF HT');
    expect(screen.getByRole('button', { name: /Idée de prix Growler 2 L/ })).toHaveTextContent('prix à estimer');
    expect(screen.queryByRole('button', { name: /Carton/ })).not.toBeInTheDocument();
  });

  it('la toucher ouvre Tarifs', () => {
    render(<CreativeLabTab />);
    fireEvent.click(screen.getByRole('button', { name: 'Carnet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tout' }));
    fireEvent.click(screen.getByRole('button', { name: /Idée de prix Fût 20 L/ }));
    expect(screen.getByRole('button', { name: 'Tarifs' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('une note écrite depuis le Carnet reste une note : jamais un pricing-test', () => {
    render(<CreativeLabTab />);
    fireEvent.click(screen.getByRole('button', { name: 'Carnet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tout' }));
    const avant = items().length;
    fireEvent.change(screen.getByRole('textbox', { name: 'Noter' }), { target: { value: 'ZZ idée de prix pour les fûts' } });
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Envoyer la note' })); });
    const neuf = items().slice(avant);
    expect(neuf).toHaveLength(1);
    expect(neuf[0].type).toBe('note');
  });
});
