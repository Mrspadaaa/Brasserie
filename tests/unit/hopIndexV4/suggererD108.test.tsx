// @vitest-environment jsdom
// Voie f6-suggerer-fini (D108) : la préchauffe des apports au repos (étape Houblons), l'appel complet de Suggérer demandé après le premier affichage (client différé comme client immédiat),
// et le même appel lu tout de suite quand il a déjà été autorisé dans la session. Stockage simulé : aucune donnée réelle, aucun appel Gemini.
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';
import { toHopRecipe } from '../../../src/domain/hopIndex/v4/recipeConversion';
import { creerClient, servirSurFilPrincipal } from '../../../src/domain/hopIndex/v4/client';
import { CALCULS, OPTIONS_CLIENT, calcul, poserClient } from '../../../src/ui/hopIndex/parcours/calcul';
import { enPrechauffage } from '../../../src/ui/hopIndex/parcours/mesure';
import type { RecetteParcours } from '../../../src/ui/hopIndex/parcours/types';
import { cleDeChauffe, DIRECTION_DE_CHAUFFE, estChauffee, oublierChauffe, prechauffer, usePrechauffeSuggerer } from '../../../src/ui/hopIndex/suggerer/prechauffe';
import { oublierAutorisations, PLACE_REMPLACER_PX, useCalculApres } from '../../../src/ui/hopIndex/suggerer/differe';

const BRUT = {
  id: 'REC-D108', name: 'Stout export', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
  fermentables: [], hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;
const RECETTE = toHopRecipe(BRUT, {}).recette as RecetteParcours;

// Le « repos » du navigateur est piloté par le test (requestIdleCallback absent de jsdom).
type Idle = { requestIdleCallback?: (f: () => void) => number; cancelIdleCallback?: (n: number) => void };
const file: (() => void)[] = [];
const annulees = new Set<number>();
const auRepos = () => act(() => { file.splice(0).forEach((f) => f()); });
beforeEach(() => {
  file.length = 0; annulees.clear(); oublierChauffe(); oublierAutorisations();
  (window as unknown as Idle).requestIdleCallback = (f) => { file.push(f); return file.length; };
  (window as unknown as Idle).cancelIdleCallback = (n) => { annulees.add(n); file[n - 1] = () => {}; };
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks();
  delete (window as unknown as Idle).requestIdleCallback; delete (window as unknown as Idle).cancelIdleCallback;
  poserClient(creerClient(servirSurFilPrincipal(CALCULS, { differer: false, prechauffage: enPrechauffage }), OPTIONS_CLIENT), false);
});

describe('préchauffe au repos de l\'étape Houblons (D108, 1)', () => {
  it('rien avant le repos ; au repos, un seul appel proposerRapide, sans visée particulière', async () => {
    const espion = vi.spyOn(calcul(), 'prechauffer').mockResolvedValue();
    prechauffer(RECETTE);
    expect(espion).not.toHaveBeenCalled();
    await auRepos();
    expect(espion).toHaveBeenCalledTimes(1);
    expect(espion).toHaveBeenCalledWith('proposerRapide', RECETTE, { ...DIRECTION_DE_CHAUFFE });
  });

  it('une dose changée ne chauffe pas deux fois ; un autre volume, une autre levure ou une autre durée, oui ; sans ajout, jamais', async () => {
    const espion = vi.spyOn(calcul(), 'prechauffer').mockResolvedValue();
    prechauffer(RECETTE); await auRepos();
    prechauffer({ ...RECETTE, additions: RECETTE.additions.map((a) => ({ ...a, grams: a.grams + 10 })) }); await auRepos();
    expect(espion).toHaveBeenCalledTimes(1); // les apports du pool ne lisent pas les grammes du Nugget
    prechauffer({ ...RECETTE, volumeL: 24 }); await auRepos();
    prechauffer({ ...RECETTE, yeastId: 'lallemand-verdant' }); await auRepos();
    prechauffer({ ...RECETTE, boilMin: 90 }); await auRepos();
    expect(espion).toHaveBeenCalledTimes(4);
    expect(new Set([RECETTE, { ...RECETTE, volumeL: 24 }, { ...RECETTE, yeastId: 'lallemand-verdant' }, { ...RECETTE, boilMin: 90 }].map(cleDeChauffe)).size).toBe(4);
    prechauffer({ ...RECETTE, volumeL: 30, additions: [] }); await auRepos();
    expect(espion).toHaveBeenCalledTimes(4);
  });

  it('annulée avant le repos (l\'étape se ferme), elle ne calcule rien', async () => {
    const espion = vi.spyOn(calcul(), 'prechauffer').mockResolvedValue();
    const annuler = prechauffer(RECETTE);
    annuler();
    await auRepos();
    expect(espion).not.toHaveBeenCalled();
  });

  it('le crochet de l\'étape chauffe à l\'affichage, pas à chaque geste sur une dose', async () => {
    const espion = vi.spyOn(calcul(), 'prechauffer').mockResolvedValue();
    const { rerender } = renderHook(({ r }) => usePrechauffeSuggerer(r), { initialProps: { r: RECETTE } });
    await auRepos();
    expect(espion).toHaveBeenCalledTimes(1);
    rerender({ r: { ...RECETTE, additions: RECETTE.additions.map((a) => ({ ...a, grams: a.grams + 5 })) } });
    await auRepos();
    expect(espion).toHaveBeenCalledTimes(1);
  });
});

describe('l\'appel complet de Suggérer, après le premier affichage (D108, 4)', () => {
  const direction = { floral: 1 };
  it('client différé : rien avant le repos ; au repos, la réponse arrive, celle des arguments courants', async () => {
    poserClient(creerClient(servirSurFilPrincipal(CALCULS, { differer: true, prechauffage: enPrechauffage }), OPTIONS_CLIENT), false);
    const { result } = renderHook(() => useCalculApres('proposer', [RECETTE, direction]));
    expect(result.current).toBeUndefined();
    await auRepos();
    await waitFor(() => expect(result.current).toBeDefined(), { timeout: 20000 });
    expect(result.current!.valeur.voies.length).toBeGreaterThan(0);
    expect(result.current!.args[1]).toEqual(direction);
  }, 30000);

  it('client immédiat : rien avant le repos, puis la réponse ; un deuxième affichage la lit tout de suite', async () => {
    const premier = renderHook(() => useCalculApres('proposer', [RECETTE, direction]));
    expect(premier.result.current).toBeUndefined();
    await auRepos();
    await waitFor(() => expect(premier.result.current).toBeDefined(), { timeout: 20000 });
    premier.unmount();
    const second = renderHook(() => useCalculApres('proposer', [RECETTE, direction]));
    expect(second.result.current).toBeDefined(); // déjà autorisée : aucune arrivée après le premier rendu
    const autre = renderHook(() => useCalculApres('proposer', [RECETTE, { floral: 2 }]));
    expect(autre.result.current).toBeUndefined(); // une autre visée repart du premier affichage
  }, 40000);

  it('la place réservée au groupe « Remplacer » est celle d\'un titre et d\'une ligne (42 px, mesurés) ; elle ne sert que sans préchauffe (D111)', () => {
    expect(PLACE_REMPLACER_PX).toBe(42);
  });

  it('estChauffee : faux avant la préchauffe, vrai après, pour la même clé (volume, levure, durée) ; faux pour un autre volume', async () => {
    vi.spyOn(calcul(), 'prechauffer').mockResolvedValue();
    expect(estChauffee(RECETTE)).toBe(false);
    prechauffer(RECETTE);
    expect(estChauffee(RECETTE)).toBe(false); // programmée, pas encore partie
    await auRepos();
    expect(estChauffee(RECETTE)).toBe(true);
    expect(estChauffee({ ...RECETTE, additions: RECETTE.additions.map((a) => ({ ...a, grams: a.grams + 10 })) })).toBe(true);
    expect(estChauffee({ ...RECETTE, volumeL: 24 })).toBe(false);
  });
});
