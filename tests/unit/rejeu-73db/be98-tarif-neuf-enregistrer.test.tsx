// @vitest-environment jsdom
// Rejeu en ligne 73db7eaa (08.11), BE-98 rouvert : tarif NEUF, prix 99999 refusé (le champ reste vide, le message dit le plafond), puis « Enregistrer »
// répond « Indique un montant positif ou nul. ». Attendu : la raison reste celle du refus (au-delà de 10 000 CHF).
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TarifSheet } from '../../../src/ui/TarifSheet';
import { defaultConfig } from '../../../src/services/storage';

afterEach(cleanup);

describe('BE-98 — tarif neuf : après un refus, Enregistrer garde la raison du refus', () => {
  it('99999 puis Enregistrer : « au-delà de 10 000 CHF », jamais « positif ou nul »', () => {
    const onSave = vi.fn();
    render(<TarifSheet item={{ product: '', priceHT: undefined } as never} config={defaultConfig} onClose={() => {}} onSave={onSave} onDelete={() => {}} />);
    const champ = document.getElementById('tf-priceHT') as HTMLInputElement;
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '99999' } });
    fireEvent.blur(champ);
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));
    const prix = document.getElementById('tf-priceHT-error');
    expect(prix?.textContent).toMatch(/au-delà de 10[\s  ]000 CHF/u);
    expect(prix?.textContent).not.toContain('positif ou nul');
    // L'emballage voisin est facultatif : vide, il ne reproche rien (jamais « positif ou nul », qui se lisait comme le refus du prix).
    expect(document.getElementById('tf-emballageUnite-error')).toBeNull();
    expect(document.body.textContent).not.toContain('positif ou nul');
    expect(onSave).not.toHaveBeenCalled();
  });
});
