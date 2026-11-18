// @vitest-environment jsdom
// Rejeu en ligne 649bcc54 (08.11), BE-98 rouvert : tarif 99999.
// (1) le refus disait « La valeur précédente ( CHF) » quand le champ n'avait pas de valeur précédente ;
// (2) l'enregistrement répondait toujours « Indique un montant positif ou nul. » : il doit dire la vraie raison.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TarifSheet } from '../../../src/ui/TarifSheet';
import { defaultConfig } from '../../../src/services/storage';
import { messageRefus } from '../../../src/ui/numericInput';
import type { PricingItem } from '../../../src/types';

afterEach(cleanup);

// Valeurs de test, simulées.
const sansPrix = { product: 'Fût 30 L', costIngredients: 2, costFixed: 1, costLabor: 0 } as unknown as PricingItem;
const avecPrix: PricingItem = { product: 'Bouteille 75 cl', costIngredients: 2, costFixed: 1, costLabor: 0, costTotal: 3, priceHT: 6, marginCHF: 3, marginPercent: 50 };

describe('BE-98 rouvert — messageRefus', () => {
  it('une valeur précédente vide (undefined, null, NaN) ne se dit jamais « valeur précédente ( CHF) »', () => {
    for (const avant of [undefined, null, Number.NaN] as unknown as (number | undefined)[]) {
      const m = messageRefus(99999, avant, { min: 0, max: 10000, unite: 'CHF' });
      expect(m).toMatch(/au-delà de 10\s000\sCHF/);
      expect(m).toContain('Le champ reste vide');
      expect(m).not.toContain('précédente');
      expect(m).not.toContain('( ');
    }
  });
});

describe('BE-98 rouvert — le tarif', () => {
  it('prix sans valeur précédente : le refus dit « Le champ reste vide », sans « valeur précédente ( CHF) »', () => {
    render(<TarifSheet item={sansPrix} config={defaultConfig} onClose={() => {}} onSave={vi.fn()} onDelete={() => {}} />);
    const champ = document.getElementById('tf-priceHT') as HTMLInputElement;
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '99999' } });
    fireEvent.blur(champ);
    const alerte = screen.getByRole('alert');
    expect(alerte.textContent).toMatch(/au-delà de 10\s000\sCHF/);
    expect(alerte.textContent).not.toContain('précédente');
  });

  it('Enregistrer avec 99999 encore dans le champ : le message dit « au-delà de 10 000 CHF », pas « positif ou nul »', () => {
    const onSave = vi.fn();
    render(<TarifSheet item={avecPrix} config={defaultConfig} onClose={() => {}} onSave={onSave} onDelete={() => {}} />);
    const champ = document.getElementById('tf-priceHT') as HTMLInputElement;
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '99999' } });
    // Pas de blur : Entrée / Enregistrer valident le champ actif.
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    const textes = screen.getAllByRole('alert').map((a) => a.textContent ?? '').join(' | ');
    expect(textes).toMatch(/au-delà de 10\s000\sCHF/);
    expect(textes).not.toContain('positif ou nul');
    expect(onSave).not.toHaveBeenCalled();
  });
});
