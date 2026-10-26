// Voie t6a (#165, a) : la conversion de recette vit dans src/domain/hopIndex/v4/recipeConversion.ts, et le patch
// d'un outil v4 ne touche que `hops` (et `yeast`). Il GARDE l'historique V5.5 (hopV55Applications,
// hopV55ColdEvidenceAssociations) et, pour un houblon gardé, ses liens au lot (stockItemRef, hopLotId, α).
// Quatre recettes de fixture de l'app ; aucune donnée réelle.
import { describe, expect, it } from 'vitest';
import { monSuperStout } from '../../fixtures/monSuperStout';
import { companionRecipe } from '../../fixtures/companionRecipe';
import { yeastFlowRecipe } from '../../fixtures/yeastRecipeFlow';
import { fullRecipe } from '../../fixtures/fullRecipe';
import { hopDecisionReference } from '../../../src/domain/hopDecision/measurements';
import type { Recipe } from '../../../src/types';
import { appliquerPatchHoublons, idAjout, toHopRecipe, versPatch } from '../../../src/domain/hopIndex/v4/recipeConversion';

const RECETTES: Record<string, () => Recipe> = {
  'stout (monSuperStout)': () => structuredClone(monSuperStout),
  'session NEIPA (companionRecipe)': companionRecipe,
  'Weissbier (yeastFlowRecipe)': yeastFlowRecipe,
  'Hazy complète (fullRecipe)': () => structuredClone(fullRecipe),
};

/** Deux traces V5.5 factices (scellées en vrai ; ici seul compte qu'elles survivent, octet pour octet). */
const trace = (id: string, hops: unknown) => ({ format: 'hop-v55-recipe-draft-application-v1', id, hopsReference: `ref:${id}`, hops });
const froid = (id: string) => ({ id, kind: 'cold-contact', hopLine: 0 });
/** La recette avec l'historique V5.5 et les liens de lot sur chaque ligne de houblon. */
function avecHistorique(r: Recipe): Recipe {
  return {
    ...r,
    hops: r.hops.map((h, i) => ({ ...h, stockItemRef: `stock:${i}`, hopLotId: `lot:${i}` })),
    hopV55Applications: [trace('app-1', r.hops), trace('app-2', r.hops)],
    hopV55ColdEvidenceAssociations: [froid('froid-1')],
  } as Recipe;
}

describe('toHopRecipe / patch inverse sur 4 recettes de fixture', () => {
  for (const [nom, fabriquer] of Object.entries(RECETTES)) {
    it(`${nom} : un id stable par ligne, aller-retour sans perte, l'historique V5.5 intact`, () => {
      const app = avecHistorique(fabriquer());
      const conv = toHopRecipe(app);
      expect(conv.recette.additions.map((a) => a.id)).toEqual(app.hops.map((_, i) => idAjout(i)));
      const { patch, notes } = versPatch(conv, conv.recette);
      expect(Object.keys(patch)).toEqual(['hops']);
      expect(notes).toEqual([]);
      patch.hops.forEach((h, i) => expect(h).toBe(app.hops[i]));
      const apres = appliquerPatchHoublons(app, patch);
      expect(apres).toEqual(app);
      expect(apres.hopV55Applications).toBe(app.hopV55Applications);
      expect(apres.hopV55ColdEvidenceAssociations).toBe(app.hopV55ColdEvidenceAssociations);
    });
  }
});

describe('appliquerPatchHoublons : une seule règle d’écriture', () => {
  it('ne change que hops (et yeast si le patch en porte une) ; le reste de la recette garde son objet', () => {
    const app = avecHistorique(companionRecipe());
    const hops = [{ ...app.hops[0], weightG: 25 }, app.hops[1]];
    const sans = appliquerPatchHoublons(app, { hops });
    expect(sans.hops).toBe(hops);
    expect(sans.yeast).toBe(app.yeast);
    const { hops: _h, ...resteApres } = sans; const { hops: _g, ...resteAvant } = app;
    expect(resteApres).toEqual(resteAvant);
    const levure = { name: 'SafAle US-05', hopIndexId: 'us-05' };
    const avec = appliquerPatchHoublons(app, { hops, yeast: levure });
    expect(avec.yeast).toBe(levure);
    expect(avec.fermentables).toBe(app.fermentables);
  });

  it('ne modifie jamais la recette reçue', () => {
    const app = avecHistorique(companionRecipe());
    const copie = structuredClone(app);
    appliquerPatchHoublons(app, { hops: [] });
    expect(app).toEqual(copie);
  });
});

describe('un geste d’outil : la dose du même houblon', () => {
  it('garde stockItemRef, hopLotId et α du lot ; seuls les grammes changent', () => {
    const app = avecHistorique(companionRecipe());
    const conv = toHopRecipe(app);
    const r = structuredClone(conv.recette);
    r.additions[0] = { ...r.additions[0], grams: 33 };
    const { patch, notes } = versPatch(conv, r);
    expect(notes).toEqual([]);
    expect(patch.hops[0]).toEqual({ ...app.hops[0], weightG: 33 });
    expect(patch.hops[0]).toMatchObject({ stockItemRef: 'stock:0', hopLotId: 'lot:0', alpha: 12 });
    expect(patch.hops[1]).toBe(app.hops[1]);
    const apres = appliquerPatchHoublons(app, patch);
    expect(apres.hopV55Applications).toBe(app.hopV55Applications);
    expect(apres.hopV55ColdEvidenceAssociations).toBe(app.hopV55ColdEvidenceAssociations);
  });
});

describe('un houblon remplacé : ce qui est perdu est dit', () => {
  it('le lot, le stock et l’α de l’ancien houblon sont nommés dans les notes ; l’historique V5.5 reste', () => {
    const app = avecHistorique(structuredClone(monSuperStout));
    const conv = toHopRecipe(app);
    const r = structuredClone(conv.recette);
    r.additions[0] = { ...r.additions[0], hopKey: 'beermaverick-galaxy', alphaLot: undefined };
    const { patch, notes } = versPatch(conv, r);
    expect(patch.hops[0]).toMatchObject({ name: 'Galaxy', hopVarietyId: 'beermaverick-galaxy' });
    expect(patch.hops[0].stockItemRef).toBeUndefined();
    expect(patch.hops[0].hopLotId).toBeUndefined();
    const texte = notes.join(' | ');
    expect(texte).toMatch(/Nuget/);
    expect(texte).toMatch(/stock:0/);
    expect(texte).toMatch(/lot:0/);
    expect(texte).toMatch(/13/); // l'α de l'ancien lot
    expect(texte).toMatch(/V5\.5/); // l'historique reste, il décrit l'ancienne ligne
    const apres = appliquerPatchHoublons(app, patch);
    expect(apres.hopV55Applications).toBe(app.hopV55Applications);
    expect(apres.hopV55ColdEvidenceAssociations).toBe(app.hopV55ColdEvidenceAssociations);
  });

  it('sans historique V5.5, aucune mention de V5.5', () => {
    const app = structuredClone(monSuperStout);
    const conv = toHopRecipe(app);
    const r = structuredClone(conv.recette);
    r.additions[0] = { ...r.additions[0], hopKey: 'beermaverick-galaxy', alphaLot: undefined };
    expect(versPatch(conv, r).notes.join(' ')).not.toMatch(/V5\.5/);
  });
});

describe('alterner v4 et V5.5 sur la même recette', () => {
  it('un hopV55Applications survit au remplacement de sa ligne par v4 ; la trace n’est plus celle du brouillon', () => {
    // V5.5 applique : ses lignes entrent dans la recette avec sa trace (scellée sur ces lignes).
    const depart = structuredClone(monSuperStout);
    const lignesV55 = [{ ...depart.hops[0], weightG: 45 }];
    const apresV55: Recipe = { ...depart, hops: lignesV55, hopV55Applications: [trace('v55-a', lignesV55)] } as Recipe;
    const refV55 = hopDecisionReference(apresV55.hops);

    // v4 remplace cette ligne.
    const conv1 = toHopRecipe(apresV55);
    const r1 = structuredClone(conv1.recette);
    r1.additions[0] = { ...r1.additions[0], hopKey: 'beermaverick-galaxy', alphaLot: undefined };
    const apresV4 = appliquerPatchHoublons(apresV55, versPatch(conv1, r1).patch);
    expect(apresV4.hopV55Applications).toEqual([trace('v55-a', lignesV55)]);
    // L'application V5.5 décrit une ligne qui n'existe plus : sa référence ne correspond plus aux houblons.
    expect(hopDecisionReference(apresV4.hops)).not.toBe(refV55);

    // V5.5 applique de nouveau (il ajoute à la suite), puis v4 règle une dose.
    const apresV55bis: Recipe = { ...apresV4, hopV55Applications: [...(apresV4.hopV55Applications ?? []), trace('v55-b', apresV4.hops)] } as Recipe;
    const conv2 = toHopRecipe(apresV55bis);
    const r2 = structuredClone(conv2.recette);
    r2.additions[0] = { ...r2.additions[0], grams: 80 };
    const final = appliquerPatchHoublons(apresV55bis, versPatch(conv2, r2).patch);
    expect((final.hopV55Applications as { id: string }[]).map((a) => a.id)).toEqual(['v55-a', 'v55-b']);
    expect(final.hops[0].weightG).toBe(80);
    expect(final.hopV55Applications).toBe(apresV55bis.hopV55Applications);
  });
});
