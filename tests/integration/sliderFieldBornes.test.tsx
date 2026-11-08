import React, { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DilutionField } from '../../src/ui/DilutionField';

afterEach(cleanup);

function Hote({ vu }: { vu: (pct: number) => void }) {
  const [pct, setPct] = useState(50);
  return <DilutionField label="Osmosée — empâtage" value={pct} onChange={(v) => { vu(v); setPct(v); }} volumeL={20} />;
}

/** Le focus sélectionne tout : le premier caractère remplace ; les suivants s'ajoutent à ce que le champ affiche à cet instant. */
function tape(champ: HTMLElement, texte: string) {
  fireEvent.focus(champ);
  [...texte].forEach((c, i) => fireEvent.change(champ, { target: { value: (i === 0 ? '' : (champ as HTMLInputElement).value) + c } }));
}
const pourcentage = () => screen.getAllByRole('textbox').find(e => !(e.getAttribute('aria-label') ?? '').startsWith('Litres'))! as HTMLInputElement;

describe('BR-78, BE-2 : la part d’osmosée ne sort jamais de 0–100 % vers le calcul', () => {
  it('« 99999 » % : le calcul reçoit 100, jamais 99999, et l’écran dit la borne', () => {
    const vus: number[] = [];
    render(<Hote vu={(v) => vus.push(v)} />);
    const champ = pourcentage();
    tape(champ, '99999');
    expect(Math.max(...vus)).toBeLessThanOrEqual(100);
    expect(Math.min(...vus)).toBeGreaterThanOrEqual(0);
    expect(champ.value).toBe('99999');                    // la frappe n'est pas réécrite (BR-80)
    expect(screen.getByRole('status')).toHaveTextContent(/99\s?999 % est hors bornes : de 0 à 100 %\. 100 % retenu/);
    fireEvent.blur(champ);
    expect(champ.value).toBe('100');
  });
  it('« −1 » % : le calcul reçoit 0, jamais −1', () => {
    const vus: number[] = [];
    render(<Hote vu={(v) => vus.push(v)} />);
    const champ = pourcentage();
    tape(champ, '-1');
    expect(vus.every(v => v >= 0 && v <= 100)).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent(/hors bornes/);
  });
  it('« 4,99999 » L d’osmosée : pas de chiffres résiduels, 20 L au plus retenus (BR-80)', () => {
    render(<Hote vu={() => {}} />);
    const litres = screen.getByLabelText(/Litres d’osmosée/) as HTMLInputElement;
    litres.focus();
    tape(litres, '99999');
    expect(litres.value).toBe('99999');
    fireEvent.blur(litres);
    expect(litres.value).toBe('20');
  });
  it('une valeur dans les bornes ne dit rien', () => {
    render(<Hote vu={() => {}} />);
    const champ = pourcentage();
    fireEvent.change(champ, { target: { value: '35' } });
    expect(screen.queryByRole('status')).toBeNull();
  });
});
