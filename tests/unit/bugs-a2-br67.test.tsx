// @vitest-environment jsdom
// BR-67 / BE-21 : « Proposer l'empâtage » réécrit les paliers du brouillon ; l'écran doit le dire (un retour visible, avec les paliers posés).
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlagesStyle } from '../../src/ui/identite/PlagesStyle';
import { recetteApercuIdentite } from '../../src/ui/identite/apercuDev';
import { brewingStyles, resolveBrewingStyle } from '../../src/domain/brewingStyles';

afterEach(cleanup);

describe('BR-67 : retour visible après « Proposer l’empâtage »', () => {
  const styles = brewingStyles();
  const style = resolveBrewingStyle(recetteApercuIdentite().style, undefined, styles)!;
  const rendre = (onChange: (r: never) => void) => render(
    <PlagesStyle recipe={recetteApercuIdentite() as never} style={style} styles={styles} onChange={onChange as never} valeurs={{ og: 1.06, ibu: 55 }} />,
  );

  it('avant le geste : aucun retour ; après : une ligne role=status dit que les paliers sont posés', () => {
    const onChange = vi.fn();
    rendre(onChange);
    expect(screen.queryByRole('status', { hidden: true })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Proposer l’empâtage/, hidden: true }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const retour = screen.getByRole('status', { hidden: true });
    expect(retour.textContent).toMatch(/Empâtage « .+ » posé/);
    // dit ce qui a changé : au moins une température de palier, en °C
    expect(retour.textContent).toMatch(/\d+ °C/);
  });

  it('la proposition de conduite reçoit le même retour', () => {
    const onChange = vi.fn();
    rendre(onChange);
    fireEvent.click(screen.getByRole('button', { name: /Proposer la conduite/, hidden: true }));
    expect(screen.getByRole('status', { hidden: true }).textContent).toMatch(/Conduite « .+ » posée/);
  });
});
