// @vitest-environment jsdom
// Rejeu en ligne ff0f822e (08.11), N-4 / BR-16 : « -1 » tapé dans la masse d'une ligne de malt revenait à l'ancienne valeur sans un mot ni aria-invalid.
// Attendu, comme VI-9 (SaltDoseControl) : valeur précédente rétablie ET message role="alert" qui le dit, champ aria-invalid tant que la saisie est refusée.
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Fermentable, FermentableKind } from '../../../src/types';
import { EtapeFermentescibles } from '../../../src/ui/fermentescibles/EtapeFermentescibles';
import type { DefFamille } from '../../../src/ui/fermentescibles/Ajout';

afterEach(cleanup);

const DEFS: Record<FermentableKind, DefFamille> = {
  grain: { label: 'Grain', use: 'empatage', fermentability: 100, stock: ['Malt', 'Céréale'], newCat: 'Malt' },
  sucre: { label: 'Sucre', use: 'ebullition', fermentability: 100, ppg: 46, stock: ['Sucre'], newCat: 'Sucre' },
  lactose: { label: 'Lactose', use: 'ebullition', fermentability: 0, ppg: 35, stock: ['Sucre'], newCat: 'Sucre' },
  fruit: { label: 'Fruit', use: 'fermentation', fermentability: 90, ppg: 8, stock: ['Fruit', 'Additif'], newCat: 'Sucre' },
  extrait: { label: 'Extrait', use: 'ebullition', fermentability: 75, ppg: 36, stock: ['Extrait', 'Sucre'], newCat: 'Sucre' },
};
// Valeurs de test, simulées.
const essai: Fermentable = { name: 'Malt essai', kind: 'grain', use: 'empatage', weightKg: 2, potentialPpg: 37, colorEbc: 3.5 };
const autre: Fermentable = { name: 'Autre malt', kind: 'grain', use: 'empatage', weightKg: 3, potentialPpg: 37, colorEbc: 5 };

let courant: Fermentable[] = [];
function Banc() {
  const [l, setL] = useState<Fermentable[]>([essai, autre]);
  const [famille, setFamille] = useState<FermentableKind>('grain');
  courant = l;
  return (
    <EtapeFermentescibles fermentables={l} onFermentables={setL} stockItems={[]} famille={famille} onFamille={setFamille} defs={DEFS}
      onCreateStockItem={(n, c, u) => ({ id: 'n', ref: 'N', name: n, category: c, unit: u, currentStock: 0, minStock: 0, reorder: false })}
      onLearnIngredient={() => {}} nolo={false} og={null} teinteBiere={null} rendementPct={75} rendementDeclare={false} erreur={() => undefined} />
  );
}
const masse = (i: number) => document.querySelector<HTMLInputElement>(`[data-role="kg-ligne"][data-kl="${i}"]`)!;

describe('N-4 / BR-16 — « -1 » dans la masse d’une ligne', () => {
  it('le champ est aria-invalid pendant la frappe et un message role="alert" dit que la masse précédente est conservée', () => {
    render(<Banc />);
    const champ = masse(0);
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '-1' } });
    expect(champ.getAttribute('aria-invalid')).toBe('true');
    const alerte = screen.getByRole('alert');
    expect(alerte.textContent).toMatch(/négative|négatif/);
    expect(alerte.textContent).toContain('La valeur précédente (2,0 kg) est conservée');
    expect(courant[0].weightKg).toBe(2);
  });

  it('à la sortie du champ la masse d’avant est rétablie et le message reste lisible', () => {
    render(<Banc />);
    const champ = masse(0);
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '-1' } });
    fireEvent.blur(champ);
    expect(masse(0).value).toBe('2,0');
    expect(courant[0].weightKg).toBe(2);
    expect(screen.getByRole('alert').textContent).toContain('La valeur précédente (2,0 kg) est conservée');
  });

  it('une saisie valable efface le message', () => {
    render(<Banc />);
    const champ = masse(0);
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '-1' } });
    fireEvent.change(champ, { target: { value: '2,5' } });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(champ.getAttribute('aria-invalid')).toBeNull();
    expect(courant[0].weightKg).toBe(2.5);
  });
});
