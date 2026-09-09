import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../../../src/App';
import { StorageService } from '../../../src/services/storage';
import { FirestoreRepo, qaMetrics, seedQa } from './repo';
import { guidePredictionKnowledge, guideYeasts, guideAxes, loadGuideVarieties, guideFermentations, guideFermentationScience } from '../../../src/ui/hopIndex/guideData';
import { evaluateFermentationScenario } from '../../../src/domain/fermentationScenario';
import { evaluateNoloRecipe,newNoloConfig,noloScience } from '../../../src/domain/nolo';
import { noloInputBasis } from '../../../functions/src/noloCore';
import { noloInput } from '../../../src/domain/nolo';
import { predictStudyPhenols } from '../../../functions/src/fermentationScienceCore';
import { qaCalls } from './functions';
import { testHopData, testHopTriplet } from '../../fixtures/hopPrediction';
import { prepareHopRecipeInput } from '../../../src/domain/hopIndex/recipePrediction';
import { predictHopRecipe } from '../../../functions/src/hopRecipePrediction';
import { predictHopTriplet } from '../../../functions/src/hopPredictionCore';
import fixture from '../../fixtures/hopScientific/test-houb.json';
import yeastCatalogue from '../../../src/data/yeastCatalogueBootstrap.json';
import dosePack from '../../../src/data/hopDoseStudyBootstrap.json';
import type { Recipe } from '../../../src/types';
import type { HopKnowledge, HopModel, HopTriplet } from '../../../functions/src/hopPredictionSchema';
import '../../../src/index.css';

async function start() {
  const varieties = await loadGuideVarieties();
  const knowledge = guidePredictionKnowledge(yeastCatalogue.filter(y => ['lalbrew-diamond', 'fermentis-us05', 'lalbrew-verdant-ipa'].includes(y.id)) as HopKnowledge[]);
  if (!localStorage.getItem('__HOP_RECIPE_QA_ONLY__')) seedQa({ hopVarieties: varieties, hopKnowledge: knowledge,
    stockItems: [{ id: 'qa-us05', ref: 'qa-us05', name: 'SafAle US-05', category: 'Levure', kind: 'rawMaterials', currentStock: 1, unit: 'sachet', price: 0 }] });
  const recipe = (count = 2): Recipe => ({ ...structuredClone(fixture),
    hops: count === 2 ? structuredClone(fixture.hops) : Array.from({ length: count }, (_, i) => ({ ...fixture.hops[i % 2], weightG: 24 })) } as Recipe);
  const documented = (): Recipe => {
    const model = dosePack.find(k => k.kind === 'model') as HopModel;
    const base = recipe(1), scope = model.scope;
    return { ...base, id: 'qa-documented', name: 'Cascade documenté', hopMatrixId: scope.matrixId,
      yeast: { ...base.yeast, form: 'liquide', hopIndexId: scope.yeastId, name: knowledge.find(k => k.id === scope.yeastId)?.name ?? scope.yeastId },
      hops: [{ name: 'Cascade', weightG: 3.86 * base.volumeL, alpha: 6, stage: 'dryHop', hopVarietyId: scope.varietyId,
        aromaTiming: 'postFermentation', aromaTemperatureC: 14, aromaContactHours: 24 }], fermentation: [], hopAromaTarget: { floral: { min: 0, max: 33 } } };
  };
  (window as any).__hopQa = {
    marker: '__HOP_RECIPE_QA_ONLY__', metrics: qaMetrics, calls: qaCalls, storage: StorageService, recipe, documented,
    nolo: {
      raw:(r:Recipe)=>evaluateNoloRecipe(r,StorageService.getHopKnowledge()),
      recipe:(count=20)=>({...recipe(count),id:'qa-nolo',name:'QA hefeweisse NOLO',style:'Hefeweisse',
        nolo:newNoloConfig(),yeast:{name:'Fermentis SafBrew LA-01',hopIndexId:'yeast-fermentis-safbrew-la-01',form:'sèche',qty:12,unit:'g'},
        fermentation:[{kind:'primaire',name:'Primaire NOLO',tempC:20,days:2}]}),
      basis:(r:Recipe,after?:string)=>noloInputBasis(noloInput(r),after),
      science:()=>noloScience(StorageService.getHopKnowledge())
    },
    yeast: {
      raw: (r: Recipe) => evaluateFermentationScenario(r, guideYeasts(StorageService.getHopKnowledge()), guideFermentations(StorageService.getHopKnowledge())),
      guides: () => guideFermentations(StorageService.getHopKnowledge()),
      science: () => guideFermentationScience(StorageService.getHopKnowledge())[0],
      phenols: predictStudyPhenols,
    },
    axes: () => guideAxes(StorageService.getHopKnowledge()),
    rawTriplet(triplet: HopTriplet, target: Recipe['hopAromaTarget'] = {}) {
      return predictHopTriplet(triplet, target ?? {}, { varieties: StorageService.getHopVarieties(), lots: StorageService.getHopLots(), knowledge: guidePredictionKnowledge(StorageService.getHopKnowledge()) });
    },
    raw(selected: Recipe, cumulative = true, index = 0) {
      const data = { varieties: StorageService.getHopVarieties(), lots: StorageService.getHopLots(), knowledge: guidePredictionKnowledge(StorageService.getHopKnowledge()) };
      const { input } = prepareHopRecipeInput(selected, data.varieties, guideYeasts(data.knowledge));
      return predictHopRecipe(cumulative ? input : { ...input, additions: input.additions.slice(index, index + 1) }, selected.hopAromaTarget ?? {}, data);
    },
    seedRecipe(r: Recipe) { StorageService.addRecipe(r); },
    partialCoa() {
      const variety = varieties.find(v => v.id === 'hopsteiner-cas')!;
      StorageService.saveHopLot({ id: 'qa-partial-coa', varietyId: variety.id, name: 'COA partiel QA · alpha seulement', form: 'pelletT90',
        analysis: [{ analyte: 'alpha', unit: 'percentMass', basis: 'asIs', kind: 'range', range: { min: 6, max: 7 }, confidence: 'high',
          source: { title: 'COA synthétique de contrôle', author: 'Banc QA local', year: 2026, kind: 'coa', reference: 'tests/qa/hop-recipe — fixture sans valeur scientifique' } }] });
      return variety.id;
    },
    syntheticConfidence(confidence: 'medium' | 'high') {
      const data = testHopData();
      for (const item of [...data.varieties, ...data.lots]) for (const measurement of item.analysis) measurement.confidence = confidence;
      // Synthetic source categories exercise both UI classes; this fixture is not scientific evidence.
      const classifySyntheticSources = (value: unknown): void => {
        if (!value || typeof value !== 'object') return;
        if ('reference' in value && 'kind' in value && value.kind === 'observation') value.kind = 'research';
        Object.values(value).forEach(classifySyntheticSources);
      };
      classifySyntheticSources(data);
      for (const k of data.knowledge) {
        if (k.kind === 'axis') { k.id = 'qa-citrus'; k.name = 'Axe synthétique QA'; }
        if (k.kind === 'model') { k.outputs[0].target = 'axis:qa-citrus'; k.confidence = confidence; k.version = `qa-${confidence}`; }
        if (k.kind === 'confidence') k.caps.observation = confidence;
      }
      data.varieties.forEach(v => StorageService.saveHopVariety(v)); data.lots.forEach(l => StorageService.saveHopLot(l));
      data.knowledge.forEach(k => StorageService.saveHopKnowledge(k));
      const r = { ...recipe(1), id: 'qa-confidence', name: 'Contrôle synthétique de confiance', hopMatrixId: testHopTriplet.matrixId!,
        yeast: { name: 'Levure témoin', form: 'sèche', qty: 1, unit: 'sachet', hopIndexId: testHopTriplet.yeastId! },
        hops: [{ name: 'Variété témoin', hopVarietyId: testHopTriplet.varietyId!, hopLotId: 'test-lot', weightG: 96, alpha: 0, stage: 'dryHop', aromaTiming: 'fermentation', aromaContactHours: 48, aromaTemperatureC: 20 }],
        hopAromaTarget: { 'qa-citrus': { min: 5, max: 7 } } } as Recipe;
      StorageService.addRecipe(r); return r;
    },
    failNext() { qaMetrics.failNext = true; },
    forgetKnowledge(id: string) { FirestoreRepo.remove('hopKnowledge', id); },
    ready: () => FirestoreRepo.isReady()
  };
  createRoot(document.getElementById('root')!).render(<App />);
}
start().catch(e => { document.body.textContent = String(e); throw e; });
