// @vitest-environment jsdom
// Rejeu en ligne 649bcc54 (08.11), TE-47 partiel : fiche matériel, prix « -1 » : Enregistrer s'éteint mais aucun message n'est visible ni annoncé
// (le champ est dans la section « Achat », repliable : fermée, le message est caché et le bouton éteint ne dit pas pourquoi).
// Attendu : un message role="alert" VISIBLE sous le champ, la section s'ouvre, le bouton éteint y renvoie (aria-describedby).
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

// Valeurs de test, simulées.
const materiel = { id: 'EQ-x', ref: 'EQ-012', name: 'Pompe', category: 'Brassage', state: 'Neuf' };

describe('TE-47 — le prix négatif se dit, visiblement, et le bouton éteint y renvoie', () => {
  it('« -1 » tapé, section « Achat » refermée : le message reste visible, annoncé, relié au champ et au bouton', () => {
    render(<EquipmentSheet item={materiel} onClose={() => {}} onSave={vi.fn()} onDelete={() => {}} />);
    fireEvent.click(screen.getByText(/Achat/));
    const prix = document.getElementById('eq-price') as HTMLInputElement;
    fireEvent.focus(prix);
    fireEvent.change(prix, { target: { value: '-1' } });
    fireEvent.blur(prix);
    // Le brasseur referme la section ou sa disposition la replie : le refus doit rester lisible.
    fireEvent.click(screen.getByText(/Achat/));
    const alerte = screen.getByRole('alert');
    expect(alerte).toHaveTextContent(/ne peut pas être négatif/);
    expect(alerte).toBeVisible();
    expect(prix).toHaveAttribute('aria-invalid', 'true');
    expect(prix.getAttribute('aria-describedby')).toBe(alerte.id);
    const bouton = screen.getByRole('button', { name: 'Enregistrer' });
    expect(bouton).toBeDisabled();
    expect(bouton.getAttribute('aria-describedby')).toBe(alerte.id);
  });

  it('une fiche rouverte avec un prix négatif déjà enregistré montre le message sans qu’on ouvre « Achat »', () => {
    render(<EquipmentSheet item={{ ...materiel, purchasePrice: -1 }} onClose={() => {}} onSave={vi.fn()} onDelete={() => {}} />);
    expect(screen.getByRole('alert')).toBeVisible();
  });
});
