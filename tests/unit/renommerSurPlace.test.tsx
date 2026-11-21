// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RenommerSurPlace, nomRenomme } from '../../src/ui/saisie/RenommerSurPlace';

afterEach(cleanup);

const monter = (onRenommer = vi.fn()) => {
  render(<RenommerSurPlace valeur="ZZ TEST Fermenteur 120 L" quoi="l'appareil" onRenommer={onRenommer} />);
  return onRenommer;
};
const titre = () => screen.getByRole('button', { name: /ZZ TEST Fermenteur 120 L · renommer l'appareil/ });
const champ = () => screen.getByLabelText("Renommer l'appareil") as HTMLInputElement;

describe('RenommerSurPlace (PI-5)', () => {
  it('au repos : le titre est un bouton dans son h1, sans champ', () => {
    monter();
    expect(titre().closest('h1')).not.toBeNull();
    expect(screen.queryByLabelText("Renommer l'appareil")).toBeNull();
  });

  it('toucher le titre donne un champ focalisé, texte sélectionné, Entrée enregistre et rend le focus au titre', () => {
    const fn = monter();
    fireEvent.click(titre());
    const c = champ();
    expect(document.activeElement).toBe(c);
    expect(c.value).toBe('ZZ TEST Fermenteur 120 L');
    expect([c.selectionStart, c.selectionEnd]).toEqual([0, c.value.length]);
    expect(c.getAttribute('enterkeyhint')).toBe('done');
    fireEvent.change(c, { target: { value: '  ZZ TEST   Nom ' } });
    fireEvent.keyDown(c, { key: 'Enter' });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('ZZ TEST Nom');
    expect(screen.queryByLabelText("Renommer l'appareil")).toBeNull();
    expect(document.activeElement?.tagName).toBe('BUTTON');
  });

  it('Échap annule ; un vide ou un nom inchangé ne renomme rien', () => {
    const fn = monter();
    fireEvent.click(titre());
    fireEvent.change(champ(), { target: { value: 'Autre' } });
    fireEvent.keyDown(champ(), { key: 'Escape' });
    fireEvent.click(titre());
    fireEvent.change(champ(), { target: { value: '   ' } });
    fireEvent.keyDown(champ(), { key: 'Enter' });
    fireEvent.click(titre());
    fireEvent.keyDown(champ(), { key: 'Enter' });
    expect(fn).not.toHaveBeenCalled();
    expect(titre()).toBeTruthy();
  });

  it('la sortie du champ enregistre, une seule fois', () => {
    const fn = monter();
    fireEvent.click(titre());
    fireEvent.change(champ(), { target: { value: 'ZZ TEST Pompe' } });
    fireEvent.blur(champ());
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('ZZ TEST Pompe');
  });

  it('Entrée pendant une composition IME ne valide pas', () => {
    const fn = monter();
    fireEvent.click(titre());
    fireEvent.change(champ(), { target: { value: 'ZZ TEST' } });
    fireEvent.keyDown(champ(), { key: 'Enter', isComposing: true });
    expect(fn).not.toHaveBeenCalled();
    expect(champ()).toBeTruthy();
  });

  it('nomRenomme : espaces réduits, vide et identique refusés', () => {
    expect(nomRenomme(' a  b ', 'x')).toBe('a b');
    expect(nomRenomme('  ', 'x')).toBeNull();
    expect(nomRenomme('x ', 'x')).toBeNull();
  });
});
