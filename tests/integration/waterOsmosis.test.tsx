import React, { useState } from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SaltSolver, WaterState } from '../../src/ui/SaltSolver';
import { WaterSource } from '../../src/types';
import { changeWaterRatio } from '../helpers/waterRatio';
import {
  waterFromPlan,
  ionsAfterAcid,
  residualAlkalinity,
  raAcidTarget,
  targetRaForColor
} from '../../src/domain/water';

// Les anciens smoke tests exigeaient une cible HCO3 dépendant des doses, et
// une continuité que la politique de repli par couleur n’offre pas à 21 EBC.
// Ici on vérifie les quantités réellement versées, leur bilan de masse et
// la stabilité du repère HCO3. Limites : docs/water-style-audit.md.
afterEach(cleanup);
const OSMOSEE: WaterSource = {
  id: 'ro',
  name: 'Osmosée',
  ca: 0,
  mg: 0,
  na: 0,
  so4: 0,
  cl: 0,
  hco3: 0
};
const BASE: WaterState = {
  diRatioPct: 100,
  styleCode: '21A',
  doses: {},
  disabled: [],
  acidId: 'lactique',
  mashWaterL: 20,
  spargeWaterL: 10
};
let current: WaterState;
function monter(over: Partial<WaterState> = {}, ebc = 12) {
  function Hote() {
    const [state, setState] = useState({ ...BASE, ...over });
    current = state;
    return (
      <SaltSolver
        source={OSMOSEE}
        onSourceChange={() => {}}
        beerEbc={ebc}
        beerVolumeL={25}
        state={state}
        onChange={setState}
        noSparge={false}
        onNoSpargeChange={() => {}}
      />
    );
  }
  return render(<Hote />);
}
const doser = () => fireEvent.click(screen.getByRole('button', { name: /Proposer les doses/i }));
const graphique = () => screen.getByRole('img', { name: /Profil ionique/ });
const doseAcide = () =>
  Number((screen.getByLabelText(/à l’empâtage, en /) as HTMLInputElement).value.replace(',', '.'));
const ions = () => waterFromPlan(OSMOSEE, current.doses, 20, 10).mash;
const cible = (ion: string) =>
  graphique()
    .getAttribute('aria-label')!
    .match(new RegExp(`${ion}[^)]*\\)\\s*([\\d.,]+) ppm pour (\\d+(?:\\.\\d+)?) à (\\d+(?:\\.\\d+)?)`));

describe('Osmosée — sels et acides réellement pesés', () => {
  it.each([4, 8, 12, 16, 20])(
    'à %i EBC, aucun bicarbonate ni acide acheté pour une IPA pâle',
    (ebc) => {
      monter({}, ebc);
      doser();
      expect(
        (current.doses.nahco3 ?? 0) + (current.doses.chaux ?? 0) + (current.doses.caco3 ?? 0)
      ).toBe(0);
      expect(doseAcide()).toBe(0);
      expect(ions().hco3).toBe(0);
      expect(graphique().getAttribute('aria-label')).not.toContain('repère indicatif');
      expect(cible('Alcalinité')!.slice(2)).toEqual(['0', '60']);
    }
  );

  it.each([30, 45, 60, 80])(
    'à %i EBC, la proposition alcaline suit la maische et son bilan de masse',
    (ebc) => {
      monter({ styleCode: '20C' }, ebc);
      doser();
      expect(ions().hco3).toBeGreaterThan(0);
      const treated = ionsAfterAcid(ions(), doseAcide(), 'lactique', 20);
      const ra = residualAlkalinity(treated);
      const band = targetRaForColor(ebc);
      // The requested water profile stays the same for every grist. Its pH
      // implications are reported separately, never hidden by lowering HCO3.
      const label = graphique().getAttribute('aria-label')!;
      const shown = Number(label.match(/Alcalinité[^)]*\)\s*([\d.,]+) ppm/)?.[1].replace(',', '.'));
      // Tous les alcalins à l’empâtage, rinçage RO à zéro : dilution 20 / 30.
      expect(shown).toBeCloseTo(Math.round((treated.hco3 * 20) / 30 * 10) / 10, 1);
      expect(shown).toBeGreaterThanOrEqual(120);
      expect(shown).toBeLessThanOrEqual(250);
      expect(label).not.toContain('repère indicatif');
      expect(cible('Alcalinité')!.slice(2)).toEqual(['120', '250']);
    }
  );

  it.each(['23G', '20C', 'NA-STOUT'])(
    '%s reçoit du sodium lorsque le profil en demande',
    (code) => {
      monter({ styleCode: code }, 12);
      doser();
      const axis = cible('Sodium')!;
      expect(axis).not.toBeNull();
      expect(Number(axis[1])).toBeGreaterThan(0);
      // 0.1 g de NaCl dans 30 L = 1.31 ppm, plus arrondi d’affichage au ppm.
      expect(Number(axis[1])).toBeGreaterThanOrEqual(Number(axis[2]) - 2);
      expect(Number(axis[1])).toBeLessThanOrEqual(Number(axis[3]));
    }
  );

  it('une cible explicite de Mg et Na est cherchée depuis zéro', () => {
    monter({
      customTarget: {
        name: 'Recette',
        ions: { ca: 70, mg: 15, na: 30, so4: 150, cl: 100, hco3: 0 }
      }
    });
    doser();
    for (const ion of ['Magnésium', 'Sodium']) {
      const a = cible(ion)!;
      expect(Number(a[1])).toBeGreaterThanOrEqual(Number(a[2]) - 2);
      expect(Number(a[1])).toBeLessThanOrEqual(Number(a[3]) + 1);
    }
    expect((current.doses.epsom ?? 0) + (current.doses.mgcl2 ?? 0)).toBeGreaterThan(0);
    expect(cible('Alcalinité')).not.toBeNull();
  });

  it('les zones cibles ne suivent ni le bicarbonate, ni l’Epsom, ni le ratio', () => {
    monter({ styleCode: '21B' });
    doser();
    const bands = () =>
      ['Chlorure', 'Sulfate', 'Calcium', 'Magnésium', 'Sodium', 'Alcalinité'].map((ion) => cible(ion)!.slice(2));
    const before = bands();
    const sectors = () => Array.from(graphique().querySelectorAll('[data-ion-target]')).map(p => p.getAttribute('d'));
    expect(sectors()).toHaveLength(6);
    const beforeSectors = sectors();
    for (const name of ['Bicarbonate de soude', 'Sel d’Epsom']) {
      fireEvent.click(screen.getByRole('button', { name: `Ajouter 0.5 g de ${name}` }));
      expect(bands()).toEqual(before);
      expect(sectors()).toEqual(beforeSectors);
    }
    changeWaterRatio(screen.getByRole('slider', { name: 'SO₄ ⇄ Cl' }), 2.8);
    expect(bands()).toEqual(before);
    expect(sectors()).toEqual(beforeSectors);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter 0.5 mL — empâtage' }));
    expect(bands()).toEqual(before);
    expect(sectors()).toEqual(beforeSectors);
  });

  it('Doser reste reproductible et conserve une correction acide manuelle', () => {
    monter({ styleCode: '23G', acidOverride: { mash: 5 } });
    doser();
    const doses = { ...current.doses };
    expect(current.acidOverride).toEqual({ mash: 5 });
    doser();
    expect(current.doses).toEqual(doses);
    expect(screen.getByRole('button', { name: /Proposer les doses/i })).not.toBeDisabled();
  });
});
