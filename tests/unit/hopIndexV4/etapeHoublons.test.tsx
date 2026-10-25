// @vitest-environment jsdom
// Voie t12-ma-biere (#170) : l'étape 3 du wizard, drapeau hopV4 allumé, rend l'écran de la maquette (une seule copie, dans
// src/ui/hopIndex/maBiere/) sur la recette du brouillon, et chaque geste passe par la porte d'écriture du wizard (un patch
// de `hops`). Stockage simulé : aucune donnée réelle, aucun appel Gemini.
import fs from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';

vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: () => () => {},
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => [],
    getHopTastings: () => [],
  },
}));

import EtapeHoublons from '../../../src/ui/hopIndex/maBiere/EtapeHoublons';
import type { ChangementHoublonsV4 } from '../../../src/domain/hopIndex/v4/recipeConversion';

const RECETTE = {
  id: 'REC-T12', name: 'Stout export', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
  fermentables: [], hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;

afterEach(cleanup);

describe('étape Houblons v4 (T12)', () => {
  it('rend l\'écran choisi sur la recette du brouillon : bandeau, frise, carte, profil', async () => {
    const { container } = render(<EtapeHoublons recipe={RECETTE} boilOg={1.066} draftId="REC-T12" onChange={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="ma-biere"]')).not.toBeNull());
    expect(container.querySelector('[data-element="etape-bandeau"]')?.textContent).toMatch(/60/);
    expect(container.querySelector('[data-role="ligne-houblon"]')?.textContent).toContain('Nugget');
    expect(container.querySelector('[data-role="moment-pouce"]')?.textContent).toBe('60′');
    expect(container.querySelector('[data-element="etape-profil"]')).not.toBeNull();
    // Aucun état d'attente : ni roue ni « chargement ».
    expect(container.textContent).not.toMatch(/chargement/i);
  });

  it('un geste écrit un patch de hops par la porte du wizard (dose +, puis retirer)', async () => {
    const changements: ChangementHoublonsV4[] = [];
    const { container } = render(<EtapeHoublons recipe={RECETTE} boilOg={1.066} draftId="REC-T12" onChange={(c) => changements.push(c)} />);
    await waitFor(() => expect(container.querySelector('[data-role="dose-plus"]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-role="dose-plus"]')!);
    expect(changements).toHaveLength(1);
    expect(changements[0].draftId).toBe('REC-T12');
    expect(changements[0].patch.hops).toHaveLength(1);
    expect(changements[0].patch.hops[0].weightG).toBeGreaterThan(46);
    expect(changements[0].patch.hops[0].name).toBe('Nugget');
    fireEvent.click(container.querySelector('[data-role="retirer"]')!);
    expect(changements[1].patch.hops).toHaveLength(0);
  });

  it('un refus de la porte (brouillon en lecture seule) est dit, la recette reste celle du brouillon', async () => {
    const { container } = render(<EtapeHoublons recipe={RECETTE} boilOg={1.066} draftId="REC-T12" onChange={() => { throw new Error('Ce brouillon est conservé en lecture seule; aucun outil ne le remplace.'); }} />);
    await waitFor(() => expect(container.querySelector('[data-role="retirer"]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-role="retirer"]')!);
    expect(screen.getByRole('alert').textContent).toContain('lecture seule');
    expect(container.querySelector('[data-role="ligne-houblon"]')?.textContent).toContain('Nugget');
  });
});

describe('wizard (T12) : drapeau et une seule copie', () => {
  const racine = path.resolve(__dirname, '../../..');
  const wizard = fs.readFileSync(path.join(racine, 'src/pages/BrewWizard.tsx'), 'utf8');
  it('l\'étape 3 rend l\'écran v4 drapeau allumé et garde l\'atelier V5.5 drapeau éteint', () => {
    expect(wizard).toMatch(/step === 'houblons' && hopV4Actif && \(/);
    expect(wizard).toMatch(/step === 'houblons' && !hopV4Actif && \(/);
    expect(wizard).toMatch(/<HopV55RecipeStep /);
    expect(wizard).toMatch(/onChange=\{applyHopV4Change\}/);
  });
  it('l\'écran n\'a plus de copie dans la maquette', () => {
    const dossier = path.join(racine, 'prototypes/houblons-v4/parcours/src/ecrans/ma-biere');
    const restes = fs.existsSync(dossier) ? fs.readdirSync(dossier).filter((f) => /\.tsx?$/.test(f)) : [];
    expect(restes).toEqual([]);
  });
});
