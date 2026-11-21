// @vitest-environment jsdom
// PI-2 (R12, 21.11) : « un entré … du clavier sur mobile confirme ». Entrée valide ou prend le champ suivant, et ferme le clavier.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Input, surEntree } from '../../src/ui/Input';

const tactile = (oui: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: oui && q.includes('coarse'), media: q, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn()
  })) as unknown as typeof window.matchMedia;
};

afterEach(() => { cleanup(); tactile(false); });

describe('Input : onEntree', () => {
  for (const doigt of [false, true]) {
    describe(doigt ? 'au doigt (textarea d’une ligne)' : 'à la souris (input)', () => {
      it('Entrée lance l’action, ferme le clavier et pose enterkeyhint="done"', () => {
        tactile(doigt);
        const action = vi.fn();
        render(<Input aria-label="Nom" defaultValue="ZZ TEST" onEntree={action} />);
        const champ = screen.getByLabelText('Nom');
        expect(champ.tagName).toBe(doigt ? 'TEXTAREA' : 'INPUT');
        expect(champ.getAttribute('enterkeyhint')).toBe('done');
        champ.focus();
        fireEvent.keyDown(champ, { key: 'Enter' });
        expect(action).toHaveBeenCalledWith(champ);
        expect(document.activeElement).not.toBe(champ);
      });

      it('l’action prime sur le formulaire : il n’est pas envoyé', () => {
        tactile(doigt);
        const envoi = vi.fn((e: React.FormEvent) => e.preventDefault());
        const action = vi.fn();
        render(<form onSubmit={envoi}><Input aria-label="Nom" onEntree={action} /></form>);
        fireEvent.keyDown(screen.getByLabelText('Nom'), { key: 'Enter' });
        expect(action).toHaveBeenCalledTimes(1);
        expect(envoi).not.toHaveBeenCalled();
      });
    });
  }

  it('un refus (false) garde le clavier ouvert', () => {
    render(<Input aria-label="Nom" onEntree={() => false} />);
    const champ = screen.getByLabelText('Nom');
    champ.focus();
    fireEvent.keyDown(champ, { key: 'Enter' });
    expect(document.activeElement).toBe(champ);
  });

  it('« suivant » : l’action prend le champ suivant, le clavier reste', () => {
    render(<><Input aria-label="Pays" enterKeyHint="next" onEntree={() => { (screen.getByLabelText('Site') as HTMLElement).focus(); }} /><Input aria-label="Site" /></>);
    const pays = screen.getByLabelText('Pays');
    expect(pays.getAttribute('enterkeyhint')).toBe('next');
    pays.focus();
    fireEvent.keyDown(pays, { key: 'Enter' });
    expect(document.activeElement).toBe(screen.getByLabelText('Site'));
  });

  it('pendant une composition IME, Maj+Entrée ou une autre touche : rien', () => {
    const action = vi.fn();
    render(<Input aria-label="Nom" onEntree={action} />);
    const champ = screen.getByLabelText('Nom');
    fireEvent.keyDown(champ, { key: 'Enter', isComposing: true });
    fireEvent.keyDown(champ, { key: 'Enter', keyCode: 229 });
    fireEvent.keyDown(champ, { key: 'Enter', shiftKey: true });
    fireEvent.keyDown(champ, { key: 'a' });
    expect(action).not.toHaveBeenCalled();
  });

  it('sans onEntree, rien ne change : aucun enterkeyhint posé', () => {
    render(<Input aria-label="Nom" />);
    expect(screen.getByLabelText('Nom').hasAttribute('enterkeyhint')).toBe(false);
  });
});

describe('surEntree : un champ natif garde son dessin', () => {
  it('valide et ferme le clavier', () => {
    const action = vi.fn();
    render(<input aria-label="Nom" {...surEntree<HTMLInputElement>(action)} />);
    const champ = screen.getByLabelText('Nom');
    expect(champ.getAttribute('enterkeyhint')).toBe('done');
    champ.focus();
    fireEvent.keyDown(champ, { key: 'Enter' });
    expect(action).toHaveBeenCalledWith(champ);
    expect(document.activeElement).not.toBe(champ);
  });
});
