import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { defaultConfig } from '../../src/services/storage';
import { AppConfig, Batch } from '../../src/types';

/**
 * Le rattrapage d'acide, LÀ OÙ IL SERT.
 *
 * ⚠️ Signalé ainsi : « l'helper de pH doit être aussi et surtout durant le
 * brassage. Lors de la création je connais pas le pH du mash ». C'est exact —
 * rien ne se mesure tant que l'eau n'a pas touché le grain. L'outil vivait dans
 * l'assistant de recette ; il vit désormais aussi dans le jour de brassage,
 * minuteur en main.
 *
 * Ces tests décrivent QUAND il apparaît et ce qu'il dit, pas comment il est
 * câblé : le bloc pourra changer de place sans qu'ils cessent d'être vrais.
 */

afterEach(cleanup);

const CONFIG = { ...defaultConfig, activeBrewhouseId: 'bh-30' } as AppConfig;

/** Un brassin arrêté sur l'étape voulue, avec le relevé de pH voulu. */
function brassin(stepId: string, ph?: number): Batch {
  return {
    id: 'LOT-1',
    name: 'Essai',
    volumeBrewedL: 20,
    recipeSnapshot: {
      id: 'R1',
      name: 'Essai',
      totalGristKg: 5,
      fermentables: [],
      hops: [],
      waterPlan: {
        sourceId: 'reseau',
        diRatioPct: 0,
        mashWaterL: 20,
        spargeWaterL: 10,
        mash: {},
        sparge: {},
        acid: { id: 'lactique', mash: 0, sparge: 0 },
        targetPh: 5.4
      }
    },
    brewDay: {
      steps: [{ id: stepId, label: 'Étape', durationMin: 60 }],
      currentIndex: 0,
      readings:
        ph == null
          ? []
          : [{ at: Date.now(), stepId, roomTemp: true, kind: 'ph', value: ph, unit: '' }]
    }
  } as unknown as Batch;
}

const monter = (b: Batch) =>
  render(
    <BrewDayPage
      batch={b}
      config={CONFIG}
      onClose={() => {}}
      onSave={() => {}}
      onFinish={() => {}}
    />
  );

describe('pH de maische, le jour du brassage', () => {
  it('⚠️ chiffre la dose d’acide à rattraper, sur le pH relevé', () => {
    monter(brassin('mash-0', 5.7));
    // 20 L à 4 L/kg, écart de 0.3 pH : environ 6.9 mL de lactique.
    expect(
      within(screen.getByRole('region', { name: 'Mesures de cette étape' })).getByText(
        /Au-dessus de la fenêtre/
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /J’ai ajouté/ })).toBeInTheDocument();
    expect(screen.getByText(/Moitié de l’estimation totale.*acide lactique/i)).toBeInTheDocument();
  });

  it('se tait quand le pH relevé est dans la fenêtre', () => {
    monter(brassin('mash-0', 5.35));
    expect(
      within(screen.getByRole('region', { name: 'Mesures de cette étape' })).getByText(
        /rien à ajouter/i
      )
    ).toBeInTheDocument();
  });

  it('sous la fenêtre, il dit de ne RIEN ajouter — jamais de sel pour remonter', () => {
    monter(brassin('mash-0', 5.05));
    expect(
      within(screen.getByRole('region', { name: 'Mesures de cette étape' })).getByText(
        /déjà acide/i
      )
    ).toBeInTheDocument();
  });

  it('sans relevé, il rappelle le geste au lieu d’un chiffre', () => {
    monter(brassin('mash-0'));
    expect(screen.getByText(/Mesure dix à quinze minutes/)).toBeInTheDocument();
  });

  /*
   * ⚠️ LE CADRAGE QUI COMPTE. Un relevé de pH ne dit pas de quelle eau il
   * vient ; c'est l'étape en cours qui le dit. Passé la filtration, le grain
   * n'est plus dans l'eau : proposer une dose serait proposer un geste
   * impossible.
   */
  it('⚠️ n’apparaît pas une fois le rinçage commencé', () => {
    monter(brassin('sparge', 5.7));
    expect(screen.queryByText(/pH de maische/)).not.toBeInTheDocument();
  });

  it('reste présent au mashout — le grain y est encore', () => {
    monter(brassin('mashout', 5.7));
    expect(screen.getByText(/pH de maische/)).toBeInTheDocument();
  });
});
