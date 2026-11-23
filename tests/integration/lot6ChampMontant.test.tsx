// Lot 6 du Carnet (23.11), L-36 et L-38 : le prix du plan (À venir › Modifier › Prix estimé TTC, `MoneyInput` → `ChampNombre`) et le champ
// montant de Finances (`ChampMontant`), tapés touche par touche comme au téléphone. « 12,345.67 » gardait 12,34 en silence ; « 12’345,50 »
// était refusé. Attendu : la lecture 12 345,67 / 12 345,5, ou un refus net qui rend la valeur d'avant — jamais un morceau de frappe.
import React, { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChampNombre } from '../../src/ui/depense/ChampNombre';
import { ChampMontant } from '../../src/ui/finance/ChampMontant';

type Champ = 'nombre' | 'montant';
function Banc({ champ, depart, onValeur }: { champ: Champ; depart?: number; onValeur: (v: number | undefined) => void }) {
  const [v, setV] = useState<number | undefined>(depart);
  const props = { 'aria-label': 'Prix', value: v, onValue: (n: number | undefined) => { setV(n); onValeur(n); }, max: 1_000_000, maxDecimales: 2, dire: true };
  return <>{champ === 'nombre' ? <ChampNombre {...props}/> : <ChampMontant {...props}/>}<button type="button">ailleurs</button></>;
}

async function taper(champ: Champ, texte: string, depart?: number) {
  let derniere: number | undefined = depart;
  render(<Banc champ={champ} depart={depart} onValeur={v => { derniere = v; }}/>);
  const entree = screen.getByLabelText('Prix');
  const u = userEvent.setup();
  await u.click(entree);
  await new Promise(r => setTimeout(r, 40)); // ChampMontant sélectionne le texte à l'image suivante (requestAnimationFrame), avant la frappe du doigt
  await u.clear(entree);
  await u.type(entree, texte);
  fireEvent.blur(entree);
  return { valeur: () => derniere, alerte: () => screen.queryByRole('alert')?.textContent ?? null };
}

for (const champ of ['nombre', 'montant'] as const) {
  describe(`${champ === 'nombre' ? 'ChampNombre (prix du plan)' : 'ChampMontant'} : montants suisses`, () => {
    it('L-36 : « 12,345.67 » donne 12 345,67, sans refus', async () => {
      const r = await taper(champ, '12,345.67', 1234.5);
      expect(r.valeur()).toBe(12345.67);
      expect(r.alerte()).toBeNull();
    });
    it('L-38 : « 12’345,50 » (apostrophe iPhone) donne 12 345,5', async () => {
      const r = await taper(champ, '12’345,50', 1234.5);
      expect(r.valeur()).toBe(12345.5);
      expect(r.alerte()).toBeNull();
    });
    it('un groupement faux (« 12’34,5 ») est refusé et rend la valeur d’avant, jamais un morceau de frappe', async () => {
      const r = await taper(champ, '12’34,5', 1234.5);
      expect(r.valeur()).toBe(1234.5);
      expect(r.alerte()).toMatch(/pas un nombre.*1\s?234,5/);
    });
    it('trois décimales restent refusées (« 12,345 »)', async () => {
      const r = await taper(champ, '12,345', 1234.5);
      expect(r.valeur()).toBe(1234.5);
      expect(r.alerte()).toMatch(/au plus 2 décimales/);
    });
  });
}
