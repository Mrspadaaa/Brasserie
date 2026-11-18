// @vitest-environment jsdom
// BR-62 / BE-16 (08.11) : la liste des styles faisait 190 px (la largeur du champ) : 168 noms sur 248 coupés (« Alternative Grain … »).
// Écrit avant le correctif (L13) : rouge sur le code d'alors.
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Combobox } from '../../src/ui/Combobox';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const options = ['Alternative Grain Beer', 'Alternative Sugar Beer', 'American Amber Ale'].map((s) => ({ value: s, label: s }));
const rect = (left: number, width: number) => ({ left, right: left + width, width, top: 100, bottom: 140, height: 40, x: left, y: 100, toJSON: () => ({}) }) as DOMRect;

function ouvrir(left: number, largeurEcran: number) {
  vi.stubGlobal('innerWidth', largeurEcran);
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect(left, 190));
  render(<Combobox value="" onChange={() => undefined} options={options} ariaLabel="Style de la bière" />);
  fireEvent.focus(screen.getByRole('combobox'));
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'a' } });
  return screen.getByRole('listbox');
}

describe('liste d’un champ étroit', () => {
  it('au 1280, un champ de 190 px ouvre une liste assez large pour les noms (≥ 360 px)', () => {
    const liste = ouvrir(821, 1280);
    expect(parseInt(liste.style.width, 10)).toBeGreaterThanOrEqual(360);
  });
  it('au 390, la liste tient dans l’écran : elle se décale vers la gauche au lieu de sortir à droite', () => {
    const liste = ouvrir(191, 390);
    const w = parseInt(liste.style.width, 10);
    const dx = parseInt(liste.style.left, 10);
    expect(w).toBeGreaterThanOrEqual(300);
    expect(191 + dx + w).toBeLessThanOrEqual(390);
    expect(191 + dx).toBeGreaterThanOrEqual(0);
  });
});
