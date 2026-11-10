import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuditLogModal } from '../../src/components/AuditLogModal';
import type { AuditLog } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));

const journal: AuditLog[] = [{
  id: 'L1', timestamp: '2026-11-08T09:41:52.000Z', user: 'Gaëtan', action: 'Création', category: 'Finances',
  entityId: 'REC-df46da79-dce9-4a7a-8de3-41d4c49f8b3c', summary: 'Vente ZZ TEST', details: ''
} as AuditLog];
afterEach(() => cleanup());

describe('Journal des modifications (TE-59)', () => {
  it('porte le même nom que le menu et n’affiche pas l’identifiant technique entier', () => {
    render(<AuditLogModal isOpen onClose={() => {}} logs={journal} />);
    expect(screen.getByRole('heading', { name: 'Journal des modifications' })).toBeVisible();
    expect(screen.queryByText(/Journal d.Audit/)).toBeNull();
    expect(screen.queryByText('REC-df46da79-dce9-4a7a-8de3-41d4c49f8b3c')).toBeNull();
    // Le début reste lisible, l'identifiant complet est au survol (title).
    expect(screen.getByTitle('REC-df46da79-dce9-4a7a-8de3-41d4c49f8b3c')).toHaveTextContent('REC-df46da79');
  });
});
