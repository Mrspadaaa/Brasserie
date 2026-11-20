// @vitest-environment jsdom
// k1 (critique 19.11), points 6 et 7 : NOLO.
//  6 — « à compléter » renvoyait le brasseur à une donnée du moteur qu'il ne peut pas saisir.
//  7 — « Plage de simulation » et « Eau proposée » étaient à découvert : le bloc restait un cockpit.
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { NoloRecipeSimulator } from '../../src/ui/NoloRecipeSimulator';
import { evaluateNoloRecipe, newNoloConfig, noloScience } from '../../src/domain/nolo';
import { recetteApercuIdentite } from '../../src/ui/identite/apercuDev';
import { fullRecipe } from '../fixtures/fullRecipe';

afterEach(cleanup);
const science = noloScience()!;
const recette = () => ({ ...recetteApercuIdentite(), nolo: { ...newNoloConfig(), enabled: true, process: 'restricted' } }) as never;

describe('k1 point 6 : « Recette actuelle » sans renvoi vers une donnée que le brasseur ne peut pas saisir', () => {
  it('quand le manque vient de la souche, la ligne le dit sans « à compléter »', () => {
    const manque = evaluateNoloRecipe(recette(), [])?.nextAction ?? '';
    expect(manque).toMatch(/absente pour cette souche/i); // le cas de la capture fin-390-nolo-cave
    render(<NoloRecipeSimulator recipe={recette()} onChange={() => undefined} science={science} />);
    const ligne = [...document.querySelectorAll('p')].find((p) => /^Recette actuelle/.test(p.textContent ?? ''))!;
    expect(ligne.textContent).not.toMatch(/compléter/i);
    expect(ligne.textContent).toMatch(/projection indisponible pour cette souche/i);
  });
});

describe('k1 point 7 : premier plan léger', () => {
  it('« Plage de simulation » et « Eau proposée » sont repliées avec les hypothèses', () => {
    const avecEau = { ...structuredClone(fullRecipe), nolo: { ...newNoloConfig(), enabled: true, process: 'restricted' } } as never; // plan d'eau présent : l'encadré Eau apparaît
    render(<NoloRecipeSimulator recipe={avecEau} onChange={() => undefined} science={science} />);
    const hypotheses = [...document.querySelectorAll('details')].find((d) => /^Réglages et détails du calcul/.test(d.querySelector('summary')?.textContent ?? ''))!;
    expect(hypotheses).toBeTruthy();
    expect(hypotheses.hasAttribute('open')).toBe(false);
    const plage = [...document.querySelectorAll('p')].find((p) => /Plage de simulation/.test(p.textContent ?? ''))!;
    expect(plage.closest('details')).toBe(hypotheses);
    const eau = document.querySelector('[aria-label="Eau proposée pour le scénario NOLO"]');
    expect(eau).toBeTruthy();
    expect(eau!.closest('details')).toBe(hypotheses);
  });
});
