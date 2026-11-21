import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

/**
 * CAL-FRISE-PRIX, CFP-8 (21.11) : « Enregistrement sur le serveur… » poussait tout l'écran (66 px relevés en ligne) dès qu'une période posée
 * s'écrivait, la courbe descendait sous le doigt. Le bandeau se pose par-dessus (fixed), hors du flux ; seul « Actualiser » prend le doigt.
 */
const etat = vi.hoisted(() => ({ courant: { pending: true } as Record<string, unknown> }));
vi.mock('../../src/services/firestoreRepo', () => ({
  FirestoreRepo: { subscribe: () => () => {}, syncStatus: () => etat.courant, resumeSync: vi.fn() }
}));
import { PersistenceStatus } from '../../src/ui/PersistenceStatus';

describe('CFP-8 : le bandeau de persistance ne pousse pas l’écran', () => {
  it('« Enregistrement sur le serveur… » est posé par-dessus, sans prendre le doigt', () => {
    etat.courant = { pending: true };
    render(<PersistenceStatus />);
    const b = screen.getByRole('status');
    expect(b.textContent).toContain('Enregistrement sur le serveur');
    expect(b.className.split(/\s+/)).toEqual(expect.arrayContaining(['fixed', 'pointer-events-none']));
  });
  it('« Actualiser » reste touchable', () => {
    etat.courant = { fromCache: true };
    render(<PersistenceStatus />);
    expect(screen.getByRole('button', { name: 'Actualiser' }).className.split(/\s+/)).toContain('pointer-events-auto');
  });
});
