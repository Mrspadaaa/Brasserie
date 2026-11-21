// @vitest-environment jsdom
// CHE-3 et CHE-4 (chasse Calendrier 21.11) : le champ CHF prend Entrée (F-ENTREE) et ne redessine pas son texte dans l'événement de sortie.
import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ChampMontant } from '../../src/ui/finance/ChampMontant';

const Feuille: React.FC<{ onEntree?: () => void }> = ({ onEntree }) => {
  const [v, setV] = useState<number | undefined>(undefined);
  return (
    <div role="dialog">
      <ChampMontant value={v} onValue={setV} max={10_000_000} maxDecimales={2} aria-label="Montant en CHF" onEntree={onEntree} />
      <button type="button">Garder</button>
      <input aria-label="Nom" />
    </div>
  );
};

beforeEach(() => { vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('Entrée dans le champ de montant (CHE-4)', () => {
  it('prend le champ de saisie suivant de la feuille, sans passer par un bouton', () => {
    render(<Feuille />);
    const chf = screen.getByLabelText('Montant en CHF');
    chf.focus();
    fireEvent.keyDown(chf, { key: 'Enter' });
    expect(document.activeElement).toBe(screen.getByLabelText('Nom'));
  });

  it('annonce « suivant » par défaut, « terminé » quand Entrée valide', () => {
    const { unmount } = render(<Feuille />);
    expect(screen.getByLabelText('Montant en CHF').getAttribute('enterkeyhint')).toBe('next');
    unmount();
    render(<Feuille onEntree={() => undefined} />);
    expect(screen.getByLabelText('Montant en CHF').getAttribute('enterkeyhint')).toBe('done');
  });

  it('une action donnée remplace le passage au champ suivant (valider la feuille)', () => {
    const valider = vi.fn();
    render(<Feuille onEntree={valider} />);
    const chf = screen.getByLabelText('Montant en CHF');
    chf.focus();
    fireEvent.keyDown(chf, { key: 'Enter' });
    expect(valider).toHaveBeenCalledTimes(1);
    expect(document.activeElement).not.toBe(screen.getByLabelText('Nom'));
  });

  it('sans champ suivant, le clavier se ferme', () => {
    render(<ChampMontant value={undefined} onValue={() => undefined} max={1000} aria-label="seul" />);
    const chf = screen.getByLabelText('seul');
    chf.focus();
    fireEvent.keyDown(chf, { key: 'Enter' });
    expect(document.activeElement).toBe(document.body);
  });

  it('Entrée pendant une composition (IME) ne fait rien', () => {
    render(<Feuille />);
    const chf = screen.getByLabelText('Montant en CHF');
    chf.focus();
    fireEvent.keyDown(chf, { key: 'Enter', isComposing: true });
    expect(document.activeElement).toBe(chf);
  });
});

describe('Sortie du champ après « 1000 » (CHE-3)', () => {
  it('le texte « 1 000 » ne se redessine pas dans l\'événement de sortie, mais juste après', () => {
    vi.useFakeTimers();
    render(<Feuille />);
    const chf = screen.getByLabelText<HTMLInputElement>('Montant en CHF');
    fireEvent.focus(chf);
    fireEvent.change(chf, { target: { value: '1000' } });
    expect(chf.value).toBe('1000');
    fireEvent.blur(chf);
    // dans l'événement de sortie : le nœud du champ n'est pas touché (le piège de focus de la feuille ne rend pas le focus à la feuille)
    expect(chf.value).toBe('1000');
    act(() => { vi.runAllTimers(); });
    expect(chf.value).toMatch(/^1\s000$/);
  });

  it('un champ repris avant le retard garde le nombre brut', () => {
    vi.useFakeTimers();
    render(<Feuille />);
    const chf = screen.getByLabelText<HTMLInputElement>('Montant en CHF');
    fireEvent.focus(chf);
    fireEvent.change(chf, { target: { value: '1000' } });
    fireEvent.blur(chf);
    fireEvent.focus(chf);
    act(() => { vi.runAllTimers(); });
    expect(chf.value).toBe('1000');
  });

  it('une valeur sous le minimum est ramenée à la sortie', () => {
    vi.useFakeTimers();
    const onValue = vi.fn();
    render(<ChampMontant value={2} onValue={onValue} max={100} min={5} aria-label="min" />);
    const champ = screen.getByLabelText('min');
    fireEvent.focus(champ);
    fireEvent.blur(champ);
    expect(onValue).toHaveBeenCalledWith(5);
  });
});
