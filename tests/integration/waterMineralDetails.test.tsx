import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { SaltMineralDetails } from '../../src/ui/SaltMineralDetails';
import { WaterAdditivesTable } from '../../src/ui/WaterAdditivesTable';
import { IonComparison } from '../../src/ui/IonComparison';
import { styleByCode, styleFromTargetIons } from '../../src/domain/waterStyles';

afterEach(cleanup);

describe('Lecture des minéraux au moment de la pesée', () => {
  it('craie : détail inclut la demi-solubilité utilisée par le calcul', () => {
    render(<SaltMineralDetails saltId="caco3" grams={2} totalWaterL={20} />);
    expect(screen.getByText(/CaCO₃ · Empâtage uniquement/)).toBeVisible();
    expect(screen.getByText('+20')).toBeVisible();
    expect(screen.getByText('+61')).toBeVisible();
    expect(screen.getByText(/avant neutralisation/)).toBeVisible();
    expect(screen.getByText(/n’en compte déjà que la moitié/)).toBeVisible();
  });
  it('KCl : montre aussi le potassium absent du graphique', () => {
    render(<SaltMineralDetails saltId="kcl" grams={2} totalWaterL={10} />);
    expect(screen.getByText('K⁺')).toBeVisible();
    expect(screen.getByText('+104,9')).toBeVisible();
    expect(screen.getByText('+95,1')).toBeVisible();
  });
  it('une dose à zéro reste distincte d’un calcul sans volume', () => {
    const { rerender } = render(<SaltMineralDetails saltId="gypse" grams={0} totalWaterL={20} />);
    expect(screen.getByText('Dose à zéro : aucun minéral ajouté par ce sel.')).toBeVisible();
    rerender(<SaltMineralDetails saltId="gypse" grams={2} totalWaterL={0} />);
    expect(screen.getByText(/Renseigner le volume/)).toBeVisible();
    expect(screen.queryByText(/NaN|Infinity/)).toBeNull();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });
  it('la feuille sans doses ne prétend pas que le profil est atteint', () => {
    render(<WaterAdditivesTable doses={{ gypse: 0, cacl2: 0 }} split={{ mash: {}, sparge: {} }} acidId="lactique" mashAcid={{ amount: 0, unit: 'mL' }} spargeAcid={{ amount: 0, unit: 'mL' }} totalWaterL={20} hasSparge spargeTargetPh={5.5} />);
    expect(screen.getByText(/Aucun ajout dosé/)).toBeVisible();
    expect(screen.queryByText(/déjà dans la fourchette/)).toBeNull();
    expect(screen.queryByText('Gypse')).toBeNull();
  });
  it('doses inférieures au centième et acide de rinçage restent lisibles', () => {
    render(<WaterAdditivesTable doses={{ gypse: 0.004 }} split={{ mash: { gypse: 0.004 }, sparge: {} }} acidId="lactique" mashAcid={{ amount: 0, unit: 'mL' }} spargeAcid={{ amount: 1.5, unit: 'mL' }} totalWaterL={20} hasSparge spargeTargetPh={5.5} />);
    const saltRow = screen.getByRole('row', { name: /Gypse/ });
    expect(within(saltRow).getAllByText('<0.01 g')).toHaveLength(2);
    expect(screen.getAllByText('1.5 mL')).toHaveLength(2);
    expect(screen.queryByText('Aucun ajout dosé.')).toBeNull();
  });
  it('signale un HCO₃ sous la cible pour les profils de style et les profils personnels', () => {
    const ions = { ca: 40, mg: 2, na: 5, so4: 60, cl: 60, hco3: 10 };
    const { rerender } = render(<IonComparison start={ions} achieved={ions} style={styleByCode('20C')} />);
    expect(screen.getByRole('listitem', { name: /Alcalinité.*sous la cible/ })).toBeVisible();
    rerender(<IonComparison start={ions} achieved={ions} style={styleFromTargetIons({ hco3: 50 })} />);
    expect(screen.getByRole('listitem', { name: /Alcalinité.*sous la cible/ })).toBeVisible();
  });
  it('ne présente pas 49.9 ppm comme conforme à un minimum de 50', () => {
    const ions = { ca: 49.9, mg: 2, na: 5, so4: 60, cl: 60, hco3: 10 };
    const style = { ...styleByCode('20C'), ions: { ...styleByCode('20C').ions, ca: { min: 50, max: 100 } } };
    render(<IonComparison start={ions} achieved={ions} style={style} />);
    expect(screen.getByRole('listitem', { name: /Calcium.*corrigée 49.9 ppm ; sous la cible/ })).toBeVisible();
  });
});
