import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
import { StorageService } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { CreativeLabTab } from '../../src/components/CreativeLabTab';

// BE-22 : un double toucher sur « Convertir en client » créait DEUX fiches client pour le même contact.
beforeEach(() => {
  window.history.replaceState({}, '', '/?dev-local');
  FirestoreRepo.startSync();
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('Convertir un contact en client', () => {
  it('deux touchers rapides ne créent qu’une fiche', () => {
    act(() => StorageService.addCreativeItem({ id: 'CR-contact', type: 'prospect', status: 'idea', title: 'ZZ Bar du Test', contactName: 'Marie', contactPhone: '026 408 33 33' } as any));
    const avant = StorageService.getClients().length;
    const message = vi.fn();
    render(<CreativeLabTab onSuccessMessage={message} openSectionRequest={{ section: 'prospect', at: 1 }} />);
    const bouton = screen.getByRole('button', { name: /Convertir en client/ });
    act(() => { fireEvent.click(bouton); fireEvent.click(bouton); });
    expect(StorageService.getClients().length).toBe(avant + 1);
    expect(StorageService.getClients().filter(c => c.name === 'ZZ Bar du Test')).toHaveLength(1);
    expect(message).toHaveBeenCalledTimes(1);
  });
});
