// NUIT-H1 (27.11, couverture H) : la feuille idée acceptait et enregistrait un coût « -12 » CHF. Un coût et un prix visé ne sont jamais négatifs.
import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CreativeItemSheet } from '../../src/ui/CreativeItemSheet';

const idee = { id: 'zz-i1', type: 'event', title: 'ZZ TEST — fête', status: 'idee', createdAt: '2026-11-27' } as never;

describe('Feuille idée : coût et prix jamais négatifs', () => {
  it('« -12 » n’est pas retenu dans « Coût estimé » ni « Prix visé »', () => {
    render(<CreativeItemSheet item={idee} onClose={() => {}} onSave={() => {}} onDelete={() => {}} />);
    for (const nom of ['Coût estimé (CHF)', 'Prix visé (CHF)']) {
      const champ = screen.getByLabelText(nom) as HTMLInputElement;
      fireEvent.focus(champ);
      fireEvent.change(champ, { target: { value: '-12' } });
      fireEvent.blur(champ);
      expect(champ.value, nom).not.toMatch(/-|−/);
    }
  });
});
