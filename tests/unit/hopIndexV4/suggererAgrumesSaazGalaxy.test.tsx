// @vitest-environment jsdom
// 08.11, capture du brasseur (app en ligne, 390 px, « Suggestions et comparez ne fonctionne plus ??? ») : style 21A, Saaz (CZ) + Galaxy, visée « Plus agrumes »,
// levure « ? » (sans identifiant de l'index, yeast.hopIndexId absent) : Suggérer disait « Aucune voie houblon », ne proposait que des levures, « Comparer (0) ».
// Cause : `yeastId` null → le moteur lit « levure non référencée : aucune prédiction aromatique » ; Ma bière et la conversion supposaient US-05, les voies non.
// Un houblon agrumes du catalogue (Citra, Nectaron, Galaxy) doit monter les agrumes. Stockage simulé : aucune donnée réelle, aucun appel Gemini.
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';

vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: () => () => {},
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => [],
    getHopTastings: () => [],
  },
}));

import EcranSuggererApp from '../../../src/ui/hopIndex/suggerer/EcranApp';
import { poserPorteEtape } from '../../../src/ui/hopIndex/comparer/porte';
import { poserVisee } from '../../../src/ui/hopIndex/parcours/visee';
import { viderComparaison } from '../../../src/ui/hopIndex/fiche/comparaison';

/** IBU ~69 (α du lot connu), OG 1,027 : la recette de la capture ; `levure` null : la levure n'a pas d'identifiant de l'index. */
const recette21A = (levure: Recipe['yeast'] | null) => ({
  id: 'REC-21A', name: 'IPA saaz galaxy', style: '21A', volumeL: 20, boilMin: 60, ogTarget: 1.027, colorEbc: 12,
  fermentables: [{ name: 'Pilsner', weightKg: 2.2, kind: 'grain', use: 'empatage', colorEbc: 3.5, potentialPpg: 37 }],
  hops: [
    { name: 'Saaz (CZ)', alpha: 3, weightG: 60, stage: 'boil', timeMin: 60 },
    { name: 'Galaxy', alpha: 14, weightG: 44, stage: 'boil', timeMin: 15 },
    { name: 'Galaxy', alpha: 0, weightG: 25, stage: 'whirlpool', timeMin: 20 },
  ],
  yeast: levure ?? { name: '' },
}) as unknown as Recipe;

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => { cleanup(); poserPorteEtape(null); poserVisee(null); viderComparaison(); });

async function ouvrir(recipe: Recipe) {
  poserVisee({ citrus: 2.5 });
  poserPorteEtape({ recipe, boilOg: 1.027, draftId: 'REC-21A', onChange: () => {} });
  const { container } = render(<EcranSuggererApp onClose={() => {}} />);
  await waitFor(() => expect(container.querySelector('[aria-label="Objectifs"]')).not.toBeNull());
  await new Promise((r) => setTimeout(r, 1500)); // le repos du navigateur : l'appel complet arrive après le premier affichage
  return container;
}

describe('Suggérer, 21A avec Saaz et Galaxy, « Plus agrumes »', () => {
  it('levure reconnue (US-05) : des voies houblon', async () => {
    const c = await ouvrir(recette21A({ name: 'SafAle US-05', hopIndexId: 'fermentis-us05' } as Recipe['yeast']));
    expect(c.textContent).not.toMatch(/Aucune\s*voie houblon/);
    expect(c.querySelectorAll('[data-voie]').length).toBeGreaterThan(0);
  }, 40000);

  it('levure sans identifiant de l\'index (« ? ») : les mêmes voies houblon, et le pied dit la supposition', async () => {
    const c = await ouvrir(recette21A(null));
    expect(c.textContent).not.toMatch(/Aucune\s*voie houblon/);
    expect(c.querySelectorAll('[data-voie]').length).toBeGreaterThan(0);
    expect(c.textContent).toMatch(/Citra|Nectaron|Galaxy/);
    expect(c.textContent).toMatch(/levure non reconnue, .+ supposée/);
  }, 40000);
});
