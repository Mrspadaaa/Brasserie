import React, { useState } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TextInput } from '../../src/ui/TextInput';

function pretendTouchDevice(coarse: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('pointer: coarse') ? coarse : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('TextInput — comportement desktop et mobile', () => {
  describe('sur ordinateur (!coarse)', () => {
    beforeEach(() => pretendTouchDevice(false));

    it('rend un <input type="text"> standard pour la saisie clavier', () => {
      render(
        <TextInput
          id="beer-name"
          name="beer_name"
          value="Pale Ale"
          onChange={() => {}}
          placeholder="Nom de la bière"
        />
      );

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.tagName).toBe('INPUT');
      expect(input.type).toBe('text');
      expect(input.value).toBe('Pale Ale');
      expect(input).toHaveAttribute('autocomplete', 'off');
    });

    it('appelle onChange lors de la saisie au clavier', () => {
      const onChange = vi.fn();
      render(<TextInput value="" onChange={onChange} placeholder="Tapez ici" />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Stout' } });
      expect(onChange).toHaveBeenCalledWith('Stout');
    });
  });

  describe('sur mobile (coarse)', () => {
    beforeEach(() => pretendTouchDevice(true));

    it('rend un éditeur natif sur une ligne, exclu des accessoires de remplissage Chrome', () => {
      render(
        <TextInput
          id="beer-name"
          name="beer_name"
          value="NEIPA"
          onChange={() => {}}
          placeholder="Nom de la bière"
        />
      );

      const el = screen.getByRole('textbox');
      expect(el.tagName).toBe('TEXTAREA');
      expect(el).toHaveAttribute('data-single-line', 'true');
      expect(el).toHaveValue('NEIPA');
    });

    it('n’ouvre JAMAIS de clavier automatiquement (pas d’autoFocus)', () => {
      render(
        <TextInput
          value=""
          onChange={() => {}}
          placeholder="Pas de focus"
          autoFocus={true}
        />
      );

      // Sur mobile, l'élément ne doit pas avoir autoFocus posé
      const el = screen.getByRole('textbox');
      expect(el).not.toHaveAttribute('autofocus');
      expect(document.activeElement).not.toBe(el);
    });

    it('remonte le texte saisi lors de la frappe', () => {
      const onChange = vi.fn();
      render(<TextInput value="" onChange={onChange} placeholder="Nom" />);

      const el = screen.getByRole('textbox');
      fireEvent.change(el, { target: { value: 'Blonde' } });
      expect(onChange).toHaveBeenCalledWith('Blonde');
    });
  });
});
