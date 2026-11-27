// NUIT-F3 (27.11, couverture F) : vider le champ « Stock réellement compté » le lisait 0 : « Écart -25 kg » et « Enregistrer l'écart » actif,
// tout le stock effacé en un geste. Un champ vide n'est pas un compte : rien ne s'enregistre tant que le compté n'est pas saisi.
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { InventoryCorrectionSheet } from '../../src/ui/InventoryCorrectionSheet';
import type { StockItem } from '../../src/types';

const item = { ref: 'zz-pils', name: 'ZZ TEST — Pilsner', category: 'Malt', unit: 'kg', currentStock: 25, minStock: 0 } as unknown as StockItem;

describe('Correction d’inventaire : champ compté vidé', () => {
  it('un champ vide ne compte pas pour 0 et n’enregistre rien', () => {
    const onConfirm = vi.fn();
    render(<InventoryCorrectionSheet open item={item} onClose={() => {}} onConfirm={onConfirm} />);
    const champ = screen.getByLabelText('Stock réellement compté (kg)') as HTMLInputElement;
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '' } });
    fireEvent.blur(champ);
    expect(champ.value).toBe('');
    expect(screen.queryByText(/-25|−25/)).toBeNull();
    const bouton = screen.getByRole('button', { name: /Enregistrer|Aucun écart|Saisir/ });
    expect(bouton).toBeDisabled();
    fireEvent.click(bouton);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('un compté saisi reste enregistrable', () => {
    render(<InventoryCorrectionSheet open item={item} onClose={() => {}} onConfirm={() => {}} />);
    const champ = screen.getByLabelText('Stock réellement compté (kg)') as HTMLInputElement;
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '24' } });
    fireEvent.blur(champ);
    expect(screen.getByRole('button', { name: 'Enregistrer l’écart' })).toBeEnabled();
  });
});
