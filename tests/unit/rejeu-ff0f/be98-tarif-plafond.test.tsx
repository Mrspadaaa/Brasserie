// @vitest-environment jsdom
// Rejeu en ligne ff0f822e (08.11), BE-98 : Finances, tarifs : un prix de 99999 est refusé avec « Indique un montant positif ou nul. » (message faux).
// Attendu : le message dit le plafond (10 000) et la valeur gardée.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TarifSheet } from '../../../src/ui/TarifSheet';
import { defaultConfig } from '../../../src/services/storage';
import type { PricingItem } from '../../../src/types';

afterEach(cleanup);

// Valeurs de test, simulées.
const tarif: PricingItem = { product: 'Bouteille 75 cl', costIngredients: 2, costFixed: 1, costLabor: 0, costTotal: 3, priceHT: 6, marginCHF: 3, marginPercent: 50 };

describe('BE-98 — un prix hors plafond dit le plafond et la valeur gardée', () => {
  it('99999 : message role="alert" avec « 10 000 CHF » et la valeur précédente, champ aria-invalid, valeur d’avant rétablie', () => {
    const onSave = vi.fn();
    render(<TarifSheet item={tarif} config={defaultConfig} onClose={() => {}} onSave={onSave} onDelete={() => {}} />);
    const champ = document.getElementById('tf-priceHT') as HTMLInputElement;
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '99999' } });
    fireEvent.blur(champ);
    expect(champ.value).toBe('6,00'); // le champ prix écrit deux décimales (B12, constat Prix 3 du test d'écran)
    expect(champ.getAttribute('aria-invalid')).toBe('true');
    const alerte = screen.getByRole('alert');
    expect(alerte.textContent).toContain('au-delà de 10 000 CHF');
    expect(alerte.textContent).toContain('La valeur précédente (6 CHF) est conservée');
    expect(alerte.textContent).not.toContain('positif ou nul');
    expect(onSave).not.toHaveBeenCalled();
  });
});
