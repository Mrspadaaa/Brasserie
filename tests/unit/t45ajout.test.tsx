// @vitest-environment jsdom
// T4-5 (rouvre TL-10) : à l'ajout, « Carahell », « Munich », « Melanoidin » ne proposaient que « Créer … (stock à zéro) », sans couleur ni potentiel.
// La ligne « Créer » dit désormais la plage publiée par le malteur (EBC, PPG déduit) ; un nom hors table n'affiche rien (jamais 0).
import React, { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { Fermentable, FermentableKind } from '../../src/types';
import { EtapeFermentescibles } from '../../src/ui/fermentescibles/EtapeFermentescibles';
import type { DefFamille } from '../../src/ui/fermentescibles/Ajout';

afterEach(cleanup);
const DEFS: Record<FermentableKind, DefFamille> = {
  grain: { label: 'Grain', use: 'empatage', fermentability: 100, ppg: 36, stock: ['Malt', 'Céréale'], newCat: 'Malt' },
  sucre: { label: 'Sucre', use: 'ebullition', fermentability: 100, ppg: 46, stock: ['Sucre'], newCat: 'Sucre' },
  lactose: { label: 'Lactose', use: 'ebullition', fermentability: 0, ppg: 35, stock: ['Sucre'], newCat: 'Sucre' },
  fruit: { label: 'Fruit', use: 'fermentation', fermentability: 90, ppg: 8, stock: ['Fruit', 'Additif'], newCat: 'Sucre' },
  extrait: { label: 'Extrait', use: 'ebullition', fermentability: 75, ppg: 36, stock: ['Extrait', 'Sucre'], newCat: 'Sucre' },
};
function Banc() {
  const [l, setL] = useState<Fermentable[]>([]);
  const [famille, setFamille] = useState<FermentableKind>('grain');
  return (
    <EtapeFermentescibles fermentables={l} onFermentables={setL} stockItems={[]} famille={famille} onFamille={setFamille} defs={DEFS}
      onCreateStockItem={(n, c, u) => ({ id: 'n', ref: 'N', name: n, category: c, unit: u, currentStock: 0, minStock: 0, reorder: false })}
      onLearnIngredient={() => {}} nolo={false} og={null} teinteBiere={null} rendementPct={75} rendementDeclare={false} erreur={() => undefined} />
  );
}
const creer = () => document.querySelector('[data-role="creer"]');

describe('T4-5 : la ligne « Créer » d’un malt de la table dit sa couleur et son potentiel', () => {
  it('Carahell : pastille 25 EBC, plage 20–30 et la source, potentiel déduit', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.type(screen.getByRole('combobox'), 'Carahell');
    const c = creer()!;
    expect(c).not.toBeNull();
    expect(c.querySelector('.fer-ebcp')?.textContent).toBe('25');
    expect(c.textContent).toMatch(/20–30 EBC/);
    expect(c.textContent).toMatch(/Weyermann/);
    expect(c.textContent).toMatch(/PPG \d+/);
  });
  it('Munich : plage 12–25, type 1 ou 2 dit', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.type(screen.getByRole('combobox'), 'Munich');
    expect(creer()!.textContent).toMatch(/12–25 EBC/);
    expect(creer()!.textContent).toMatch(/type 1 ou 2/);
  });
  it('Melanoidin : 60–80 EBC ; un nom hors table : aucune pastille ni chiffre', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.type(screen.getByRole('combobox'), 'Melanoidin');
    expect(creer()!.textContent).toMatch(/60–80 EBC/);
    cleanup();
    render(<Banc />);
    await u.type(screen.getByRole('combobox'), 'Castle Chateau Pilsen');
    expect(creer()!.querySelector('.fer-ebcp')).toBeNull();
    expect(creer()!.textContent).not.toMatch(/EBC/);
  });
});
