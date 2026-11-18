// @vitest-environment jsdom
// Rejeu en ligne ff0f822e (08.11), TE-47 : fiche matériel, prix « -1 » devenait « 0 » en silence à la sortie du champ et Enregistrer restait actif.
// Attendu : refusé, message role="alert", champ aria-invalid, Enregistrer bloqué tant que le prix est invalide.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../../src/services/storage', async () => {
  const actual = await vi.importActual<typeof import('../../../src/services/storage')>('../../../src/services/storage');
  const base: Record<string, unknown> = { getUiState: (_k: string, f: unknown) => f, setUiState: vi.fn() };
  return { ...actual, StorageService: new Proxy(base, { get: (cible, nom: string) => nom in cible ? cible[nom] : nom.startsWith('get') ? () => [] : undefined }) };
});

const { EquipmentSheet } = await import('../../../src/ui/EquipmentSheet');

afterEach(cleanup);

describe('TE-47 — un prix payé négatif reste refusé après la sortie du champ', () => {
  it('« -1 » puis sortie : le champ garde -1, le message est là, Enregistrer est éteint', () => {
    const onSave = vi.fn();
    render(<EquipmentSheet item={{ id: 'EQ-x', ref: 'EQ-012', name: '', category: 'Brassage', state: 'Neuf' }} onClose={() => {}} onSave={onSave} onDelete={() => {}} />);
    fireEvent.change(document.getElementById('eq-name')!, { target: { value: 'Pompe' } });
    fireEvent.click(screen.getByText(/Achat/));
    const prix = document.getElementById('eq-price') as HTMLInputElement;
    fireEvent.focus(prix);
    fireEvent.change(prix, { target: { value: '-1' } });
    fireEvent.blur(prix);
    expect(prix.value).toBe('-1');
    expect(prix.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('alert')).toHaveTextContent(/ne peut pas être négatif/);
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.change(prix, { target: { value: '12,5' } });
    fireEvent.blur(prix);
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
  });
});
