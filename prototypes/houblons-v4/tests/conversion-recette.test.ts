import './temoin'; // témoin négatif de check:engine (B3)
// Conversion de la recette de l'app vers le moteur et retour par un patch (B5, voie p8, 23.10), sur des recettes de
// fixture de l'app (tests/fixtures : la stout du rapport HCO₃, la session NEIPA du compagnon, la Weissbier du flux
// levure, la Hazy complète). L'IBU du moteur est comparé à celui de la page recette (hotBitterness, même DI
// d'ébullition que RecipePage.tsx). Inconnu ≠ 0.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { monSuperStout } from '../../../tests/fixtures/monSuperStout';
import { companionRecipe } from '../../../tests/fixtures/companionRecipe';
import { yeastFlowRecipe } from '../../../tests/fixtures/yeastRecipeFlow';
import { fullRecipe } from '../../../tests/fixtures/fullRecipe';
import { fruty } from '../../../tests/fixtures/fruty';
import { hotBitterness } from '../../../src/domain/hopBitterness';
import { yeastRecipeBoilOg, yeastRecipeComputedOg } from '../../../src/domain/yeastProjection';
import type { Recipe } from '../../../src/types';
import { appliquerPatchHoublons as appliquerPatch, idAjout, toHopRecipe, versPatch } from '../../../src/domain/hopIndex/v4/recipeConversion';
import { configurerDonnees, lireBiere } from '../parcours/src/moteur';
import { changerDose, changerMoment, remplacer } from '../parcours/src/etat/operations';

/** La DI d'ébullition de la page recette (RecipePage.tsx:182-186, hors NoLo, rendement de la recette sinon 75 %). */
function boilOgApp(r: Recipe): number | null {
  const efficiencyPct = r.efficiencyPct ?? r.brewhouse?.efficiencyPct ?? 75;
  const og = r.ogTarget || yeastRecipeComputedOg({ fermentables: r.fermentables, volumeL: r.volumeL, efficiencyPct }) || 0;
  return yeastRecipeBoilOg({ ...r, efficiencyPct }, { og: og || null }).og;
}
const ibuApp = (r: Recipe) => hotBitterness(r.hops, r.volumeL, boilOgApp(r), r.boilMin ?? 60);

const RECETTES: Record<string, () => Recipe> = {
  'stout du rapport HCO₃ (monSuperStout)': () => structuredClone(monSuperStout),
  'session NEIPA du compagnon': companionRecipe,
  'Weissbier du flux levure': yeastFlowRecipe,
  'Hazy complète (fullRecipe)': () => structuredClone(fullRecipe),
};

beforeAll(() => configurerDonnees({ degustation: null }));
afterAll(() => configurerDonnees());

describe('Conversion de la recette de l’app (B5)', () => {
  for (const [nom, fabriquer] of Object.entries(RECETTES)) {
    it(`${nom} : aller-retour sans perte, un id stable par ajout`, () => {
      const app = fabriquer();
      const conv = toHopRecipe(app);
      expect(conv.recette.additions.map((a) => a.id)).toEqual(app.hops.map((_, i) => idAjout(i)));
      expect(toHopRecipe(app).recette).toEqual(conv.recette);
      const { patch, notes } = versPatch(conv, conv.recette);
      expect(Object.keys(patch)).toEqual(['hops']);
      expect(notes).toEqual([]);
      patch.hops.forEach((h, i) => expect(h).toBe(app.hops[i]));
      expect(appliquerPatch(app, patch)).toEqual(app);
    });

    it(`${nom} : IBU du moteur = IBU de la page recette, ajout par ajout (même DI d’ébullition)`, () => {
      const app = fabriquer();
      const conv = toHopRecipe(app, { boilOg: boilOgApp(app) });
      const biere = lireBiere(conv.recette);
      const attendu = ibuApp(app);
      app.hops.forEach((h, i) => {
        const moteur = biere.ibuParAjout[idAjout(i)];
        if (h.stage === 'dryHop') { expect(moteur.ibu).toBeNull(); expect(attendu.additions[i].ibu).toBe(0); return; }
        if (attendu.additions[i].ibu == null) { expect(moteur.ibu).toBeNull(); return; }
        expect(moteur.ibu?.valeur).toBeCloseTo(attendu.additions[i].ibu!, 9);
      });
      if (attendu.total == null) expect(biere.ibu.inconnus.length).toBeGreaterThan(0);
      else { expect(biere.ibu.inconnus).toEqual([]); expect(biere.ibu.valeur).toBeCloseTo(attendu.total, 9); }
    });
  }

  it('écart d’IBU sans la DI d’ébullition de l’app : un apport tardif (mangue) baisse la DI d’ébullition, la conversion le dit', () => {
    const app = companionRecipe();
    app.fermentables = [...app.fermentables, { name: 'Purée de mangue', weightKg: 1.5, kind: 'fruit', use: 'fermentation', dayOffset: 4, potentialPpg: 8 } as Recipe['fermentables'][number]];
    const sansDi = toHopRecipe(app);
    expect(sansDi.suppositions.some((s) => s.includes('boilOg'))).toBe(true);
    const ibuMoteur = lireBiere(sansDi.recette).ibu.valeur;
    const ibuPage = ibuApp(app).total!;
    const ecart = ibuMoteur - ibuPage;
    console.log(`ÉCART IBU (session NEIPA + 1,5 kg de mangue en fermentation) : moteur ${ibuMoteur.toFixed(2)} (DI ${app.ogTarget}) − page ${ibuPage.toFixed(2)} (DI d’ébullition ${boilOgApp(app)?.toFixed(4)}) = ${ecart.toFixed(2)} IBU`);
    expect(ecart).toBeLessThan(0); // une DI plus haute isomérise moins (Tinseth) : le moteur sous-estime
    expect(lireBiere(toHopRecipe(app, { boilOg: boilOgApp(app) }).recette).ibu.valeur).toBeCloseTo(ibuPage, 9);
  });

  it('α inconnu → inconnu, jamais 0 (à chaud : IBU inconnu ; à froid : α null)', () => {
    const app = companionRecipe();
    app.hops[0] = { ...app.hops[0], alpha: 0 };
    const conv = toHopRecipe(app, { boilOg: boilOgApp(app) });
    expect(conv.recette.additions[0].alphaLot).toBeNull();
    const biere = lireBiere(conv.recette);
    expect(biere.ibuParAjout.a1.ibu).toBeNull();
    expect(biere.ibuParAjout.a1.raison).toMatch(/^α du lot inconnu/);
    expect(biere.ibu.inconnus).toContain('a1');
    expect(ibuApp(app).total).toBeNull();
    // Dry hop à α 0 (Ariana de « Fruty », Mandarina de la Weissbier) : α null, pas 0.
    expect(toHopRecipe(fruty()).recette.additions[0].alphaLot).toBeNull();
    expect(toHopRecipe(yeastFlowRecipe()).recette.additions[1].alphaLot).toBeNull();
  });

  it('DI inconnue → IBU à chaud inconnus, jamais calculés sur 1,050', () => {
    const app = companionRecipe();
    const conv = toHopRecipe(app, { boilOg: null });
    const biere = lireBiere(conv.recette);
    expect(biere.ibuParAjout.a1.ibu).toBeNull();
    expect(biere.ibu.inconnus).toEqual(['a1']);
  });

  it('un geste dans un outil devient un patch de hops seulement, les autres champs de l’ajout restent', () => {
    const app = companionRecipe();
    const conv = toHopRecipe(app, { boilOg: boilOgApp(app) });
    // Dose de Citra à 15′, puis dry hop passé en fermentation active 4 j.
    let r = changerDose(conv.recette, 'a1', 25);
    r = changerMoment(r, 'a2', { type: 'dryhop', phase: 'actif', jours: 4 });
    const { patch, notes } = versPatch(conv, r);
    expect(notes).toEqual([]);
    expect(patch.yeast).toBeUndefined();
    expect(patch.hops[0]).toEqual({ ...app.hops[0], weightG: 25 });
    // Le jour de début suit l'outil (placer : actif à J+2, CONDITIONS.jourDebut) : ce qui a été simulé s'enregistre.
    expect(patch.hops[1]).toEqual({ ...app.hops[1], aromaTiming: 'fermentation', aromaContactHours: 96, dayOffset: 2 });
    const apres = appliquerPatch(app, patch);
    expect({ ...apres, hops: undefined }).toEqual({ ...app, hops: undefined });
    // Relue par le moteur, la recette patchée redonne les mêmes ajouts.
    const relue = toHopRecipe(apres, { boilOg: boilOgApp(apres) }).recette.additions;
    expect(relue[0]).toMatchObject({ id: 'a1', grams: 25, minutes: 15 });
    expect(relue[1]).toMatchObject({ id: 'a2', moment: 'dryActive', jours: 4 });
  });

  it('un houblon remplacé perd les liens et l’α du lot d’origine', () => {
    const app = monSuperStout;
    const conv = toHopRecipe(structuredClone(app), { boilOg: boilOgApp(app) });
    const r = remplacer(conv.recette, 'a1', 'beermaverick-galaxy');
    expect(r.additions[0].alphaLot).toBeUndefined();
    const { patch } = versPatch(conv, r);
    expect(patch.hops[0]).toMatchObject({ name: 'Galaxy', hopVarietyId: 'beermaverick-galaxy', stage: 'boil', timeMin: 75 });
    expect(patch.hops[0].alpha).toBeGreaterThanOrEqual(0);
  });
});
