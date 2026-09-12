import { describe, expect, it } from 'vitest';
import { fruty } from '../fixtures/fruty';
import { fermentationReadiness, fermentationProposals, applyFermentationProposal } from '../../src/domain/fermentationPlanning';
import { completeFromLocalReferences } from '../../src/domain/localIngredientFacts';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { resolveFermentationYeast } from '../../src/domain/fermentationScenario';
import { evaluateNoloRecipe, noloScience } from '../../src/domain/nolo';
import { readRecipeFields, writeRecipeText, parseRecipeText } from '../../src/domain/recipeTransfer';
import { changeNoloProcess, scenarioPlato } from '../../functions/src/noloScenario';

describe('Fruty, préparation NOLO commune', () => {
  it('explique les données bloquantes et reconnaît US-05 sans confondre sa fiche saisie et son domaine actuel', () => {
    const r = fruty(), before = JSON.stringify(r), d = fermentationReadiness(r);
    expect(resolveFermentationYeast(r,yeastReferences())?.id).toBe('fermentis-us05');
    expect(d.find(d=>d.id==='extract')?.message).toContain("Flocons d'Avoine");
    expect(d.find(d=>d.id==='strain')?.field).toBe('yeast');
    expect(d.find(d=>d.id==='temperature-reference')?.message).toContain('18–26');
    expect(d.some(d=>d.id==='primary-temperature')).toBe(false);
    expect(d.map(d=>d.id)).toEqual(expect.arrayContaining(['fruit','acidity','hop-contact']));
    expect(JSON.stringify(r)).toBe(before);
  });
  it('propose les quatre souches même sans PPG, sans fabriquer les masses du grain', () => {
    const r=fruty(), rows=fermentationProposals(r);
    expect(rows).toHaveLength(4);
    for(const p of rows) { expect(p.recipe.fermentables).toEqual(r.fermentables); expect(p.result?.projection.max).toBeNull(); }
    expect(rows.find(p=>p.strain.name.includes('LA-01'))?.recipe.yeast.qty).toBeCloseTo(15.6,8);
  });
  it('recalcule un programme LA-01 complet puis retrouve le calcul direct, sans transformer 6 °P en analyse', () => {
    const r=fruty(true), before=JSON.stringify(r), p=fermentationProposals(r).find(p=>p.id==='yeast-fermentis-safbrew-la-01')!;
    expect(p.result?.projectionStatus).toBe('within');
    expect(p.result?.projection.min).toBeCloseTo(.0862*6-.1208,9);
    expect(p.result?.projection.max).toBeCloseTo(.3964,9);
    expect(p.recipe.nolo?.wort.ogPlato).toBeNull();
    expect(p.recipe.nolo?.wort.sugarsGL).toEqual({});
    expect(scenarioPlato(p.recipe.ogTarget!,noloScience()!)).toBeCloseTo(6,9);
    expect(p.recipe.fermentables[1].weightKg/p.recipe.fermentables[0].weightKg).toBeCloseTo(1.9,12);
    expect(p.recipe.waterPlan?.disabled).toContain('kcl');
    expect(p.recipe.hops).toEqual(r.hops);
    const applied=applyFermentationProposal(r,p);
    expect(evaluateNoloRecipe(applied)).toEqual(p.result);
    expect(JSON.stringify(r)).toBe(before);
    expect(()=>applyFermentationProposal({...r,volumeL:25},p)).toThrow('recette a changé');
  });
  it('classe les caractères publiés selon la saisie libre sans inventer de banane', () => {
    const r=fruty(true);r.fermentationIntent={version:1,aroma:'propre et neutre',fruit:'',acidity:''};
    expect(fermentationProposals(r)[0].strain.name).toBe('LalBrew LoNa');
    r.fermentationIntent.aroma='banane intense';
    expect(fermentationProposals(r).every(p=>p.goalMatches.length===0)).toBe(true);
  });
  it('la proposition reste indéterminée pour les autres souches et compte les fruits ultérieurs', () => {
    const r=fruty(true), rows=fermentationProposals(r);
    for(const p of rows.filter(p=>p.id!=='yeast-fermentis-safbrew-la-01')) expect(p.result?.projection.max).toBeNull();
    r.fermentables.push({name:'Framboise',kind:'fruit',use:'fermentation',weightKg:2});
    expect(fermentationProposals(r).find(p=>p.id==='yeast-fermentis-safbrew-la-01')?.result?.projection.max).toBeNull();
  });
  it('complète les références locales sans écraser les bornes personnelles ni donner un PPG au nom générique', () => {
    const r=fruty(); const next=completeFromLocalReferences(r.fermentables,r.hops,r.yeast,[],[]);
    expect(next.yeast.hopIndexId).toBe('fermentis-us05');
    expect(next.yeast.fermTempMinC).toBe(12); expect(next.yeast.fermTempMaxC).toBe(22);
    expect(next.fermentables[1].potentialPpg).toBeUndefined();
  });
  it('ne change pas les opérations ou le procédé dans huit scénarios et préserve la saisie libre à l’export', () => {
    for(const process of noloScience()!.processes.map(p=>p.id)) {
      const r=fruty(true);r.nolo=changeNoloProcess(r.nolo!,process);
      for(const p of fermentationProposals(r)) { expect(p.recipe.nolo?.process).toBe(process);expect(p.recipe.nolo?.operations).toEqual(r.nolo.operations); }
    }
    const r=fruty();r.fermentationIntent={version:1,aroma:'framboise, rond',fruit:'Purée à tester',acidity:'Assemblage'};
    expect(readRecipeFields(r).fermentationIntent).toEqual(r.fermentationIntent);
  });
});
