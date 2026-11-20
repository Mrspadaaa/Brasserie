// @vitest-environment jsdom
// Décision du brasseur du 20.11 (SPEC-BRASSEUR) : TE-27 — « retirer l'atelier V5.5 de l'étape Houblons ».
// Test écrit avant le correctif (L13) : sur le code d'avant, l'atelier est encore là, derrière un dépliant.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { brewerJobs } from '../../src/services/brewerJobs';
import { recetteApercuIdentite } from '../../src/ui/identite/apercuDev';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); vi.clearAllMocks(); });

const attendre = (ms = 250) => new Promise(r => setTimeout(r, ms));

describe('TE-27 (décision 20.11) : l’étape Houblons n’a plus d’atelier V5.5', () => {
  it('ni dépliant « Atelier houblons avancé », ni panneau V5.5 ; les lignes de houblon restent', async () => {
    render(<BrewWizard localOnly config={defaultConfig} stockItems={[]} knownStyles={['Pale Ale']} onClose={vi.fn()} onSave={vi.fn()}
      onCreateStockItem={vi.fn()} onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()}
      ownerKey="ZZ-d20" draftKey="ZZ-d20:REC-TE27" seed={{ recipe: recetteApercuIdentite(), step: 'houblons' }} />);
    await attendre(600);
    expect(screen.getByText(/Mes ajouts de houblons/), 'les lignes de houblon restent en tête').toBeTruthy();
    expect(document.querySelector('[data-role="atelier-houblons-v55"]'), 'aucun dépliant d’atelier').toBeNull();
    expect(screen.queryByText(/Atelier houblons avancé/)).toBeNull();
    expect(screen.queryByText(/Ouverture de l’atelier Houblons V5\.5/)).toBeNull();
    expect(screen.getByText(/Lots, COA et conditions de contact/), 'les lots et conditions de contact (hors atelier) restent').toBeTruthy();
  }, 30000);
});
