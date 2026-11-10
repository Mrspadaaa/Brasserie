// @vitest-environment jsdom
// Mission levure-port, voie b-stock (09.11) : BE-42 — l'étiquette d'une consigne ne se pose ni sur son trait ni sur un trait de la grille.
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { FermentationTemperatureChart, setpointLabelBaseline } from '../../../src/ui/FermentationTemperatureChart';
import type { FermentationChartStep } from '../../../src/ui/FermentationTemperatureChart';

afterEach(cleanup);
const GLYPHE_HAUT = 9, GLYPHE_BAS = 3; // police de 11 px : ce que couvre l'étiquette autour de sa ligne de base

function etiquetteEtTraits(steps: FermentationChartStep[]) {
  const { container } = render(<FermentationTemperatureChart compact steps={steps} />);
  const svg = container.querySelector('svg[role="img"]')!;
  const traitsHorizontaux = [...svg.querySelectorAll('line')].filter((l) => l.getAttribute('y1') === l.getAttribute('y2')).map((l) => Number(l.getAttribute('y1')));
  const etiquettes = [...svg.querySelectorAll('[data-setpoint-label]')].map((t) => ({ index: Number(t.getAttribute('data-setpoint-label')), y: Number(t.getAttribute('y')), texte: t.textContent }));
  const consignes = [...svg.querySelectorAll('line[data-setpoint]')].map((l) => Number(l.getAttribute('y1')));
  return { traitsHorizontaux, etiquettes, consignes };
}

describe('BE-42 — étiquette de consigne', () => {
  it('« 20,5 °C » (programme de la capture) ne recouvre ni le trait de consigne ni la grille', () => {
    const steps: FermentationChartStep[] = [
      { kind: 'primaire', name: 'Fermentation primaire', tempC: 20.5, days: 7 },
      { kind: 'reposDiacetyle', name: 'Repos diacétyle', tempC: 22, days: 2 },
      { kind: 'garde', name: 'Garde', tempC: 3, days: 7 }
    ];
    const { traitsHorizontaux, etiquettes, consignes } = etiquetteEtTraits(steps);
    expect(etiquettes.length).toBeGreaterThan(0);
    for (const e of etiquettes) {
      const haut = e.y - GLYPHE_HAUT, bas = e.y + GLYPHE_BAS;
      expect(consignes[e.index] < haut || consignes[e.index] > bas, `${e.texte} sur son trait de consigne`).toBe(true);
      for (const ligne of traitsHorizontaux) expect(ligne < haut || ligne > bas, `${e.texte} sur un trait horizontal à ${ligne}`).toBe(true);
    }
  });
  it('la fonction : sous le trait quand il n’y a pas de place au-dessus, en évitant la grille', () => {
    // trait à 27,4 sous un haut de graphe à 20 : au-dessus, l'étiquette sortirait du cadre ; grille à 28,9 et 43,7.
    const b = setpointLabelBaseline(27.4, 20, 82, [28.9, 43.7, 58.5, 73.2]);
    expect(b).toBeGreaterThan(27.4 + 2 + GLYPHE_HAUT);
    expect(b + GLYPHE_BAS).toBeLessThan(43.7);
    expect(b - GLYPHE_HAUT).toBeGreaterThan(28.9);
  });
  it('de la place au-dessus : l’étiquette reste au-dessus, comme avant', () => {
    expect(setpointLabelBaseline(60, 20, 82, [])).toBe(52);
  });
});
