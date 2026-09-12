import React, { useState } from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SaltSolver, WaterState } from '../../src/ui/SaltSolver';
import { WaterSource } from '../../src/types';

/*
 * SMOKE TESTS DE BORD — ce que l'écran fait quand on le pousse.
 *
 * ⚠️ Écrits après un signalement de Gaëtan : « certaines recettes comme la Gose
 * ne sont pas toujours correctes, le HCO₃ n'est pas toujours dans la cible, et
 * l'acide d'empâtage et de rinçage ne se met pas toujours à jour comme il
 * faut ». Ces tests-ci ne vérifient pas un calcul : ils vérifient que l'écran
 * SUIT — qu'aucun chiffre affiché ne reste en arrière quand son entrée bouge.
 */

afterEach(cleanup);

const FRIBOURG: WaterSource = {
  id: 'fribourg',
  name: 'Fribourg',
  ca: 85,
  mg: 14,
  na: 8,
  so4: 28,
  cl: 22,
  hco3: 250
};

const BASE: WaterState = {
  diRatioPct: 0,
  styleCode: '27', // Gose
  doses: {},
  disabled: [],
  acidId: 'lactique',
  mashWaterL: 20,
  spargeWaterL: 10
};

/** Monte l'atelier avec des leviers pour bouger chaque entrée. */
function monter(over: Partial<WaterState> = {}, ebc = 6, source: WaterSource = FRIBOURG) {
  function Hote() {
    const [state, setState] = useState<WaterState>({ ...BASE, ...over });
    const [eau, setEau] = useState(source);
    const set = (p: Partial<WaterState>) => setState((s) => ({ ...s, ...p }));
    return (
      <>
        <button onClick={() => set({ diRatioPct: 100 })}>osmosée pure</button>
        <button onClick={() => set({ mashWaterL: 40 })}>doubler empâtage</button>
        <button onClick={() => set({ spargeWaterL: 25 })}>plus de rinçage</button>
        <button onClick={() => set({ acidId: 'phosphorique' })}>phosphorique</button>
        <button onClick={() => set({ doses: { nahco3: 4 } })}>verser du bicarbonate</button>
        <button onClick={() => setEau({ ...eau, hco3: 40, ca: 20 })}>eau douce</button>
        <SaltSolver
          source={eau}
          onSourceChange={setEau}
          beerEbc={ebc}
          beerVolumeL={25}
          state={state}
          onChange={setState}
          noSparge={(over.spargeWaterL ?? BASE.spargeWaterL) <= 0}
          onNoSpargeChange={(off) => set({ spargeWaterL: off ? 0 : 10 })}
        />
      </>
    );
  }
  return render(<Hote />);
}

const clic = (nom: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nom }));

/** La dose d'acide affichée dans la rangée d'acide, côté empâtage ou rinçage. */
const doseAcide = (cote: 'empâtage' | 'rinçage'): number => {
  const champ = screen.queryByLabelText(
    new RegExp(`à l’${cote}, en |au ${cote}, en `)
  ) as HTMLInputElement | null;
  if (!champ) return NaN;
  return parseFloat((champ.value || '0').replace(',', '.'));
};

describe('Le rinçage affiche son alcalinité après la dose retenue', () => {
  it('actualise le panneau et le graphique quand seule la dose de rinçage change', () => {
    monter({ acidOverride: { mash: 0, sparge: 2 } });
    fireEvent.click(screen.getByRole('tab', { name: 'Rinçage' }));
    // 250 − 2 × 600 / 10 = 130 ppm HCO3, soit 107 ppm équivalent CaCO3.
    const remaining = () => screen.getByText(/Alcalinité restante/).parentElement!;
    const radar = () => screen.getByRole('img', { name: /Profil ionique/ });
    expect(remaining()).toHaveTextContent('107');
    expect(radar()).toHaveAccessibleName(/Alcalinité .*210 ppm/);

    clic(/Ajouter 0,5 mL — rinçage/i);
    expect(doseAcide('empâtage')).toBe(0);
    expect(remaining()).toHaveTextContent('82');
    expect(radar()).toHaveAccessibleName(/Alcalinité .*200 ppm/);
    expect(screen.getByLabelText('HCO₃ après acide — rinçage')).toHaveTextContent('100');
  });

  it('ne déclare pas le rinçage sans alcalinité quand la dose est ramenée à zéro', () => {
    monter({ acidOverride: { mash: 0, sparge: 0 } });
    fireEvent.click(screen.getByRole('tab', { name: 'Rinçage' }));
    expect(screen.queryByText(/Rien à acidifier/)).not.toBeInTheDocument();
    expect(screen.getByText(/Alcalinité restante/).parentElement).toHaveTextContent('205');
  });

  it('explique le plancher zéro sans annoncer que le pH est validé', () => {
    monter({ acidOverride: { mash: 0, sparge: 5 } });
    fireEvent.click(screen.getByRole('tab', { name: 'Rinçage' }));
    expect(screen.getByLabelText('HCO₃ après acide — rinçage')).toHaveTextContent('0');
    expect(screen.getByText(/ne diminue plus le HCO₃/)).toHaveTextContent(/pH/);
    expect(screen.getByRole('img', { name: /Profil ionique/ })).toHaveAccessibleName(/Alcalinité .*166,7 ppm/);
  });
});

describe('L’acide suit son eau', () => {
  /*
   * ⚠️ LE CŒUR DU SIGNALEMENT. Chaque entrée qui change la composition de l'eau
   * doit déplacer la dose d'acide. Un seul de ces cas qui ne bouge pas, et le
   * brasseur verse une correction calculée pour une autre eau.
   */
  const bouge = (nom: string, action: () => void, cote: 'empâtage' | 'rinçage' = 'empâtage') => {
    it(`⚠️ ${nom} déplace l’acide d’${cote}`, () => {
      monter();
      const avant = doseAcide(cote);
      expect(Number.isNaN(avant)).toBe(false);
      action();
      expect(doseAcide(cote)).not.toBe(avant);
    });
  };

  bouge('couper à l’osmosée', () => clic('osmosée pure'));
  bouge('doubler l’eau d’empâtage', () => clic('doubler empâtage'));
  bouge('changer d’acidifiant', () => clic('phosphorique'));
  bouge('adoucir l’eau du réseau', () => clic('eau douce'));
  bouge('verser du bicarbonate à la main', () => clic('verser du bicarbonate'));
  bouge('allonger le rinçage', () => clic('plus de rinçage'), 'rinçage');

  /*
   * ⚠️ Et l'acide de RINÇAGE suit sa propre eau : il vise un pH, pas l'AR.
   * Les deux doses ne bougent pas pour les mêmes raisons, et confondre les deux
   * ferait doser le rinçage sur l'alcalinité de la maische.
   */
  it('⚠️ couper à l’osmosée déplace AUSSI l’acide de rinçage', () => {
    monter();
    const avant = doseAcide('rinçage');
    clic('osmosée pure');
    expect(doseAcide('rinçage')).not.toBe(avant);
  });

  it('sans rinçage, il n’y a pas de dose de rinçage à afficher', () => {
    monter({ spargeWaterL: 0 });
    expect(Number.isNaN(doseAcide('rinçage'))).toBe(true);
  });
});

describe('La dose posée à la main gèle l’acide — et le dit', () => {
  /*
   * ⚠️ L'HYPOTHÈSE LA PLUS PROBABLE DERRIÈRE « l'acide ne s'update pas ».
   *
   * Les ± de la rangée d'acide écrivent un `acidOverride` : une seule pression,
   * et la dose cesse de suivre l'eau — pour toujours, jusqu'au retour au calcul.
   * C'est voulu, mais il faut que ce soit VISIBLE, et que le retour marche.
   */
  it('⚠️ après un appui sur +, l’acide ne suit plus l’eau', () => {
    monter();
    const avant = doseAcide('empâtage');
    clic(/Ajouter 0,5 mL — empâtage/i);
    expect(doseAcide('empâtage')).toBeCloseTo(avant + 0.5, 1);

    // L'eau change du tout au tout : la dose forcée, elle, ne bouge pas.
    const force = doseAcide('empâtage');
    clic('osmosée pure');
    expect(doseAcide('empâtage')).toBe(force);
  });

  it('⚠️ et l’écran annonce que la dose est à la main', () => {
    monter();
    clic(/Ajouter 0,5 mL — empâtage/i);
    expect(document.body.textContent).toMatch(/à la main/);
  });

  it('⚠️ le retour au calcul rend l’acide à son eau', () => {
    monter();
    const calcule = doseAcide('empâtage');
    clic(/Ajouter 0,5 mL — empâtage/i);
    expect(doseAcide('empâtage')).not.toBe(calcule);

    fireEvent.click(screen.getByRole('button', { name: 'Revenir aux doses d’acide calculées' }));
    expect(doseAcide('empâtage')).toBe(calcule);

    // Et il suit de nouveau.
    clic('osmosée pure');
    expect(doseAcide('empâtage')).not.toBe(calcule);
  });

  it('Doser conserve l’acide manuel et propose un retour explicite au calcul', () => {
    monter();
    const calcule = doseAcide('empâtage');
    clic(/Ajouter 0,5 mL — empâtage/i);
    fireEvent.click(screen.getByRole('button', { name: /Proposer les doses/i }));
    expect(screen.getByRole('button', { name: 'Revenir aux doses d’acide calculées' })).toBeInTheDocument();
    expect(doseAcide('empâtage')).toBe(calcule + 0.5);
  });
});

describe('La Gose — le sel fait la recette', () => {
  /*
   * ⚠️ Signalé : « certaines recettes telles que la Gose ne sont pas toujours
   * correctes ». La Gose est le seul style dont le PLANCHER de sodium est haut
   * (60 ppm) : c'est le sel de table qui doit le porter, pas le CaCl₂.
   */
  it('⚠️ le sodium atteint son plancher, par le sel de table', () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: /Proposer les doses/i }));
    const sel = screen.getByLabelText(/Dose de Sel de table en grammes/) as HTMLInputElement;
    expect(parseFloat(sel.value.replace(',', '.'))).toBeGreaterThan(0);
  });

  it('⚠️ depuis l’osmosée aussi', () => {
    monter({ diRatioPct: 100 });
    fireEvent.click(screen.getByRole('button', { name: /Proposer les doses/i }));
    const sel = screen.getByLabelText(/Dose de Sel de table en grammes/) as HTMLInputElement;
    expect(parseFloat(sel.value.replace(',', '.'))).toBeGreaterThan(0);
  });
});

describe('L’alcalinité se juge à la maische, pas sur une cible mobile de style', () => {
  for (const [nom, over] of [
    ['Gose sur réseau', {}],
    ['Gose sur osmosée', { diRatioPct: 100 }],
    ['Gose sans rinçage', { spargeWaterL: 0 }]
  ] as Array<[string, Partial<WaterState>]>) {
    it(nom, () => {
      monter(over);
      fireEvent.click(screen.getByRole('button', { name: /Proposer les doses/i }));
      const label = screen.getByRole('img', { name: /Profil ionique/ }).getAttribute('aria-label');
      expect(label).toMatch(
        /Alcalinité[^)]*\)\s*[\d.,]+ ppm pour [\d.]+ à [\d.]+/
      );
      expect(document.body.textContent).toMatch(/Après l’acide|rien à corriger/);
      expect(document.body.textContent).toMatch(/repère -?\d+ à -?\d+ ppm/);
    });
  }

  it('la mesure de bicarbonate réagit toujours à l’acide', () => {
    monter({ acidOverride: { mash: 0, sparge: 0 } });
    const mesure = () =>
      Number(
        screen
          .getByRole('img', { name: /Profil ionique/ })
          .getAttribute('aria-label')!
          .match(/Alcalinité[^)]*\)\s*([\d.,]+) ppm/)?.[1].replace(',', '.')
      );
    const avant = mesure();
    fireEvent.change(screen.getByLabelText(/à l’empâtage, en /), { target: { value: '4' } });
    expect(mesure()).toBeLessThan(avant);
  });
});
