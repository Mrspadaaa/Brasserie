// @vitest-environment jsdom
import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ChampNombre } from '../../../src/ui/identite/ChampNombre';

/** Fait croire à l'application qu'elle tourne sur un écran tactile (ou à la souris). */
function pointeur(grossier: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('pointer: coarse') ? grossier : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false
  })) as unknown as typeof window.matchMedia;
}

const original = window.matchMedia;
afterEach(() => { cleanup(); window.matchMedia = original; });

function Volume({ auContenu = false, depart = 24 }: { auContenu?: boolean; depart?: number }) {
  const [v, setV] = useState(depart);
  return (
    <ChampNombre
      libelle="Volume en fermenteur" valeur={v} onValeur={setV} pas={1} min={0} max={500}
      auContenu={auContenu} id="wz-volume" data-element="r4a-volume-champ" decrit="aide-volume" invalide
    />
  );
}
const champ = () => screen.getByRole('textbox', { name: 'Volume en fermenteur' }) as HTMLInputElement | HTMLTextAreaElement;

describe('ChampNombre : composant protégé Input', () => {
  describe('à la souris', () => {
    beforeEach(() => pointeur(false));

    it('est un input texte, jamais type="number"', () => {
      render(<Volume />);
      expect(champ().tagName).toBe('INPUT');
      expect((champ() as HTMLInputElement).type).toBe('text');
      expect(document.querySelectorAll('input[type="number"]')).toHaveLength(0);
      expect(champ().getAttribute('inputmode')).toBe('decimal');
    });
  });

  describe('au toucher ((pointer: coarse) simulé)', () => {
    beforeEach(() => pointeur(true));

    it('est un textarea d’une ligne, sans type="number", avec ses attributs', () => {
      render(<Volume auContenu />);
      const t = champ();
      expect(t.tagName).toBe('TEXTAREA');
      expect(t.getAttribute('rows')).toBe('1');
      expect(t.getAttribute('data-single-line')).toBe('true');
      expect(t.getAttribute('inputmode')).toBe('decimal');
      expect(t.getAttribute('enterkeyhint')).toBe('done');
      expect(t.getAttribute('autocomplete')).toBe('off');
      expect(t.id).toBe('wz-volume');
      expect(t.getAttribute('data-element')).toBe('r4a-volume-champ');
      expect(t.getAttribute('aria-describedby')).toBe('aide-volume');
      expect(t.getAttribute('aria-invalid')).toBe('true');
      expect(t.classList.contains('idn-champ')).toBe(true);
      expect(t.value).toBe('24');
      // Largeur au contenu : « 24 » = 2 chiffres + 0,4 ch.
      expect(t.style.width).toBe('2.4ch');
      expect(t.style.resize).toBe('none');
      expect(document.querySelectorAll('input[type="number"]')).toHaveLength(0);
    });

    it('sélectionne tout au focus', () => {
      render(<Volume />);
      act(() => champ().focus());
      expect(champ().selectionStart).toBe(0);
      expect(champ().selectionEnd).toBe(2);
    });

    it('le premier mouseup ne défait pas la sélection (annulé), le second passe', () => {
      render(<Volume />);
      act(() => champ().focus());
      expect(fireEvent.mouseUp(champ())).toBe(false);
      expect(fireEvent.mouseUp(champ())).toBe(true);
    });

    it('taper puis Entrée valide sur place, sans retour à la ligne, et quitte le champ', async () => {
      const user = userEvent.setup();
      render(<Volume />);
      await user.click(champ());
      await user.keyboard('22,5{Enter}');
      expect(champ().value).toBe('22,5');
      expect(champ().value).not.toMatch(/[\r\n]/);
      expect(document.activeElement).not.toBe(champ());
    });

    it('Entrée ne remonte pas au parent (le formulaire ne passe pas au champ suivant)', async () => {
      const user = userEvent.setup();
      let vue = 0;
      render(<div onKeyDown={() => { vue++; }}><Volume /></div>);
      await user.click(champ());
      await user.keyboard('{Enter}');
      expect(vue).toBe(0);
    });

    it('Échap rend la valeur d’avant', async () => {
      const user = userEvent.setup();
      render(<Volume />);
      await user.click(champ());
      await user.keyboard('88');
      expect(champ().value).toBe('88');
      await user.keyboard('{Escape}');
      expect(champ().value).toBe('24');
      expect(document.activeElement).not.toBe(champ());
    });

    it('↑ ↓ ajoutent un pas de 1 L', async () => {
      const user = userEvent.setup();
      render(<Volume />);
      act(() => champ().focus());
      await user.keyboard('{ArrowUp}{ArrowUp}{ArrowDown}');
      expect(champ().value).toBe('25');
    });

    it('un texte illisible n’écrase rien et vider reste vide, jamais 0', async () => {
      const user = userEvent.setup();
      render(<Volume />);
      await user.click(champ());
      await user.keyboard('abc{Enter}');
      expect(champ().value).toBe('24');
      await user.click(champ());
      await user.keyboard('{Backspace}{Backspace}{Enter}');
      expect(champ().value).toBe('');
    });
  });
});
