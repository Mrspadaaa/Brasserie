import { hotBitterness, bitternessScience } from '../../../src/domain/hopBitterness';
import { dryHopBitterness } from '../../../functions/src/hopBitternessCore';
import { fruty } from '../../fixtures/fruty';
import { yeastFlowRecipe } from '../../fixtures/yeastRecipeFlow';
import { fermentationProposals, fermentationReadiness } from '../../../src/domain/fermentationPlanning';
import { qaInputs, qaLookup } from './functions';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { HopExplorationChart } from '../../../src/ui/hopIndex/HopAromaChart';
import { App } from '../../../src/App';
import { StorageService } from '../../../src/services/storage';
import { FirestoreRepo, qaMetrics, seedQa, releaseQaRecipe } from './repo';
import { guidePredictionKnowledge, guideYeasts, guideAxes, loadGuideVarieties, guideFermentations, guideFermentationScience } from '../../../src/ui/hopIndex/guideData';
import { evaluateFermentationScenario } from '../../../src/domain/fermentationScenario';
import { evaluateNoloRecipe,newNoloConfig,noloScience } from '../../../src/domain/nolo';
import { noloScenarioBasis } from '../../../functions/src/noloScenario';
import { noloInput } from '../../../src/domain/nolo';
import { predictStudyPhenols } from '../../../functions/src/fermentationScienceCore';
import { qaCalls } from './functions';
import { testHopData, testHopTriplet } from '../../fixtures/hopPrediction';
import { prepareHopRecipeInput } from '../../../src/domain/hopIndex/recipePrediction';
import { todayISO } from '../../../src/domain/finance/ledger';
import { predictHopRecipe } from '../../../functions/src/hopRecipePrediction';
import { predictHopTriplet } from '../../../functions/src/hopPredictionCore';
import fixture from '../../fixtures/hopScientific/test-houb.json';
import yeastCatalogue from '../../../src/data/yeastCatalogueBootstrap.json';
import dosePack from '../../../src/data/hopDoseStudyBootstrap.json';
import {nuagePilots} from '../../fixtures/nuagePilots';
import type { Recipe } from '../../../src/types';
import type { HopKnowledge, HopModel, HopTriplet } from '../../../functions/src/hopPredictionSchema';
import '../../../src/index.css';

async function start() {
  const appRoot=createRoot(document.getElementById('root')!);
  const varieties = await loadGuideVarieties();
  const knowledge = guidePredictionKnowledge(yeastCatalogue.filter(y => ['lalbrew-diamond', 'fermentis-us05', 'lalbrew-verdant-ipa'].includes(y.id)) as HopKnowledge[]);
  const mobilePoc = new URLSearchParams(location.search).get('ux-poc');
  if (mobilePoc === 'reset' || !localStorage.getItem('__HOP_RECIPE_QA_ONLY__')) seedQa({ hopVarieties: varieties, hopKnowledge: knowledge,
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
  const seedMobilePoc = () => {
    const candidate = recipe(2);
    candidate.id = 'qa-poc-candidate'; candidate.name = 'Lager de contrôle';
    candidate.fermentables[0].name = 'Pilsner Malz'; candidate.fermentables[0].stockItemRef = 'qa-pilsner';
    candidate.yeast = { name: 'SafAle US-05', form: 'sèche', qty: 11, unit: 'g', stockItemRef: 'qa-us05' };
    candidate.fermentation = [
      { kind: 'primaire', name: 'Primaire', tempC: 18, days: 7 },
      { kind: 'reposDiacetyle', name: 'Repos', tempC: 20, days: 2 },
      { kind: 'garde', name: 'Froid', tempC: 3, days: 3 },
    ];
    StorageService.addRecipe(candidate);
    const committed = structuredClone(candidate);
    committed.id = 'qa-poc-committed'; committed.name = 'Lager déjà planifiée';
    committed.fermentables[0].weightKg = 2; committed.hops = [];
    StorageService.addRecipe(committed);
    const planned = StorageService.planRecipeBatch(committed, 'QA-POC-PLAN');
    StorageService.addBatch({ ...planned, id: 'QA-POC-RESERVED', status: 'fermentation', brewDate: '2026-09-20',
      stockConsumption: { appliedAt: '2026-09-20T08:00:00.000Z', eventId: 'QA-PENDING-1',
        items: [{ stockItemRef: 'qa-pilsner', quantity: 1, unit: 'kg' }],
        pendingItems: [{ stockItemRef: 'qa-pilsner', quantity: 1, unit: 'kg' }], completedStages: ['brewday'] } });
    StorageService.addStockItem('rawMaterials', { id: 'qa-pilsner', ref: 'qa-pilsner', name: 'Pilsner Malz', category: 'Malt', currentStock: 5, minStock: 1, unit: 'kg', reorder: false });
    StorageService.addStockItem('rawMaterials', { id: 'qa-cascade', ref: 'qa-cascade', name: 'Cascade', category: 'Houblon', currentStock: 50, minStock: 0, unit: 'g', reorder: false });
    StorageService.addStockItem('rawMaterials', { id: 'qa-us05', ref: 'qa-us05', name: 'SafAle US-05', category: 'Levure', currentStock: 1, minStock: 0, unit: 'sachet', reorder: false });
    const water = fruty(); water.id = 'qa-poc-water'; water.name = 'Eau de contrôle';
    StorageService.addRecipe(water);
    const splitWater = fruty(); splitWater.id = 'qa-poc-water-split'; splitWater.name = 'Eau répartie de contrôle';
    splitWater.waterPlan = { ...splitWater.waterPlan!, allSaltsInMash: false,
      mash: { gypse: 1.2, cacl2: 2.8 }, sparge: { gypse: 0.8 } };
    StorageService.addRecipe(splitWater);
    const yeast = yeastFlowRecipe(); yeast.id = 'qa-poc-yeast'; yeast.name = 'Weissbier de contrôle';
    yeast.yeast.stockItemRef = 'QA-LOT-3068';
    StorageService.addRecipe(yeast);
    const yeastLiquid = yeastFlowRecipe(); yeastLiquid.id = 'qa-poc-yeast-liquid'; yeastLiquid.name = 'Weissbier liquide de contrôle';
    yeastLiquid.yeast.stockItemRef = 'QA-LOT-3068';
    StorageService.addRecipe(yeastLiquid);
    const lateContact = yeastFlowRecipe(); lateContact.id = 'qa-poc-yeast-late-contact'; lateContact.name = 'Weissbier contact tardif';
    lateContact.fermentation = [{ ...lateContact.fermentation[0], days: 11 }, { ...lateContact.fermentation[1], days: 8 }];
    lateContact.yeastDesign = undefined;
    lateContact.hops = lateContact.hops.map(hop => hop.stage === 'dryHop' ? { ...hop, dayOffset: 18, aromaContactHours: 72 } : hop);
    StorageService.addRecipe(lateContact);
    const zeroContact = yeastFlowRecipe(); zeroContact.id = 'qa-poc-yeast-zero-contact'; zeroContact.name = 'Weissbier zéro et contact';
    zeroContact.fermentation = [{ ...zeroContact.fermentation[0], days: 0 }];
    zeroContact.yeastDesign = undefined;
    zeroContact.hops = zeroContact.hops.map(hop => hop.stage === 'dryHop' ? { ...hop, dayOffset: 0, aromaContactHours: undefined } : hop);
    StorageService.addRecipe(zeroContact);
    const launched = StorageService.planRecipeBatch(yeast, 'QA-POC-3068-LAUNCHED');
    StorageService.updateBatch({ ...launched, status: 'fermentation', brewDate: '2026-09-20' });
    const launchedLiquid = StorageService.planRecipeBatch(yeastLiquid, 'QA-POC-3068-LIQUID-LAUNCHED');
    StorageService.updateBatch({ ...launchedLiquid, status: 'fermentation', brewDate: '2026-09-21' });
    const goal = yeastFlowRecipe(); goal.id = 'qa-poc-yeast-goal'; goal.name = 'Weissbier objectif de contrôle';
    StorageService.addRecipe(goal);
    // Generic counter-example outside the historical strains: personal culture, unequal 4/2/7 j programme.
    const generic = yeastFlowRecipe(); generic.id = 'qa-poc-generic-programme'; generic.name = 'Programme générique de contrôle';
    generic.style = 'Ale ambrée personnelle'; generic.yeastDesign = undefined;
    generic.yeast = { name: 'Culture maison R-7', lab: 'Labo local', form: 'liquide', qty: 1, unit: 'L',
      technicalFacts: [{ key: 'temperature', reported: '16–22 °C', range: { min: 16, max: 22 }, qualifier: 'range', unit: '°C', origin: 'personal', source: 'Fiche de contrôle R-7' }] };
    generic.fermentation = [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 4 },
      { kind: 'reposDiacetyle', name: 'Repos', tempC: 21, days: 2 }, { kind: 'garde', name: 'Garde', tempC: 3, days: 7 }];
    generic.hops = generic.hops.filter(hop => hop.stage !== 'dryHop');
    StorageService.addRecipe(generic);
    for (const [id, date, description, amountTTC, category] of [
      ['QA-AUG-1', '12.08.2026', 'Malt août', 45, 'brassage'],
      ['QA-SEP-1', '03.09.2026', 'Houblon septembre', 30, 'brassage'],
      ['QA-SEP-2', '18.09.2026', 'Nettoyage septembre', 20, 'nettoyage'],
    ] as const) StorageService.addTransaction({ id, date, description, amountHT: amountTTC, amountTTC, tvaAmount: 0, tvaRate: 0, category, subcategory: 'Fixture POC' });
    const today = todayISO(), recordedAt = `${today}T12:00:00.000Z`;
    const dateIn = (days: number) => { const value = new Date(recordedAt); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); };
    for (const [id, description, amountCents, direction, dueDate] of [
      ['QA-FACTURE-MALT', 'Facture de malt à régler', 15475, 'out', dateIn(18)],
      ['QA-FACTURE-VENTE', 'Facture de vente à encaisser', 38000, 'in', dateIn(47)],
    ] as const) StorageService.addTransaction({ id, date: today, description, category: direction === 'in' ? 'recettes' : 'brassage', subcategory: 'Fixture POC',
      amountHT: amountCents / 100, amountTTC: amountCents / 100, tvaAmount: 0, tvaRate: 0,
      proofUrl: `data:application/pdf;base64,${btoa('%PDF-1.4\nFixture locale de facture\n%%EOF')}`, proofType: 'application/pdf', proofFileName: `${id}.pdf`,
      finance: { version: 1, kind: direction === 'in' ? 'income' : 'expense', amountCents, paymentStatus: 'unpaid', dueDate, recordedAt, lines: [] } });
    FirestoreRepo.put('financialPlans', 'QA-PLAN-EMBALLAGES', { id: 'QA-PLAN-EMBALLAGES', title: 'Estimation emballages', date: dateIn(2), amountCents: 4250,
      direction: 'out', category: 'brassage', source: 'manual', status: 'active', createdAt: recordedAt });
    FirestoreRepo.put('financialProfiles', 'current', { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified',
      openingCash: { date: today, amountCents: 825000, confirmed: true }, historyCompleteFrom: `${today.slice(0, 4)}-01-01`, annualProductionL: 1500 });
    localStorage.setItem('__UX_MOBILE_POC_SEEDED__', '1');
  };
  if (mobilePoc && (mobilePoc === 'reset' || !localStorage.getItem('__UX_MOBILE_POC_SEEDED__'))) seedMobilePoc();
  (window as any).__hopQa = {
    bitterness: {hot:hotBitterness, cold:dryHopBitterness, science:bitternessScience},
    marker: '__HOP_RECIPE_QA_ONLY__', metrics: qaMetrics, calls: qaCalls, storage: StorageService, recipe, documented, seedMobilePoc,
    seedRecipes: (recipes: Recipe[]) => { for (const row of recipes) FirestoreRepo.put('recipes', row.id, row); },
    documentaryReference: () => {
      const { aliases: _aliases, ...row } = guideYeasts(StorageService.getHopKnowledge())[0];
      return row;
    },
    nolo: {
      pilots:nuagePilots,
      fruty, proposals:(r:Recipe)=>fermentationProposals(r,StorageService.getHopKnowledge()),
      readiness:(r:Recipe)=>fermentationReadiness(r,StorageService.getHopKnowledge()),
      inputs:qaInputs,
      mockHop:()=>qaLookup.set('Ariana',{found:true,name:'Ariana',source:'Fixture QA synthétique · aucune analyse commerciale',alphaPct:12}),
      mockOats:()=>qaLookup.set("Flocons d'Avoine",{found:true,name:"Flocons d'Avoine",source:'Fixture QA synthétique · aucune analyse commerciale',colorEbc:2,potentialPpg:33}) ,
      raw:(r:Recipe)=>evaluateNoloRecipe(r,StorageService.getHopKnowledge()),
      recipe:(count=20)=>({...recipe(count),id:'qa-nolo',name:'QA hefeweisse NOLO',style:'Hefeweisse',
        nolo:newNoloConfig(),yeast:{name:'Fermentis SafBrew LA-01',hopIndexId:'yeast-fermentis-safbrew-la-01',form:'sèche',qty:12,unit:'g'},
        fermentation:[{kind:'primaire',name:'Primaire NOLO',tempC:20,days:2}]}),
      basis:(r:Recipe,after?:string)=>noloScenarioBasis(noloInput(r),after),
      science:()=>noloScience(StorageService.getHopKnowledge())
    },
    yeast: {
      // Local replay of explicitly captured public provider answers. This QA
      // entry point is excluded from the production build and never calls AI.
      setLookupResponse: (name: string, response: unknown) => qaLookup.set(name, response),
      mockM20Review: () => qaLookup.set('M20 · Bavarian Wheat', {
        found: true, name: 'M20 · Bavarian Wheat', form: 'liquide', tempMinC: 18, tempMaxC: 28,
        source: 'Fixture QA synthétique · aucune fiche commerciale', sourceUrl: 'https://example.invalid/m20', technicalFacts: [
          { key: 'temperature', reported: '18–28 °C', range: { min: 18, max: 28 }, unit: '°C',
            qualifier: 'range', origin: 'ai', source: 'Fixture QA synthétique', sourceUrl: 'https://example.invalid/m20' }
        ]
      }),
      raw: (r: Recipe) => evaluateFermentationScenario(r, guideYeasts(StorageService.getHopKnowledge()), guideFermentations(StorageService.getHopKnowledge())),
      guides: () => guideFermentations(StorageService.getHopKnowledge()),
      science: () => guideFermentationScience(StorageService.getHopKnowledge())[0],
      phenols: predictStudyPhenols,
    },
    axes: () => guideAxes(StorageService.getHopKnowledge()),
    rawTriplet(triplet: HopTriplet, target: Recipe['hopAromaTarget'] = {}) {
      return predictHopTriplet(triplet, target ?? {}, { varieties: StorageService.getHopVarieties(), lots: StorageService.getHopLots(), knowledge: guidePredictionKnowledge(StorageService.getHopKnowledge()) });
    },
    raw(selected: Recipe, cumulative = true, index = 0, context?: import('../../../functions/src/hopRecipePrediction').HopRecipeInput['aromaContext']) {
      const data = { varieties: StorageService.getHopVarieties(), lots: StorageService.getHopLots(), knowledge: guidePredictionKnowledge(StorageService.getHopKnowledge()) };
      const { input } = prepareHopRecipeInput(selected, data.varieties, guideYeasts(data.knowledge));
      if(context)input.aromaContext=context;
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
    rejectNextRecipe() { qaMetrics.rejectNextRecipe = true; },
    holdNextRecipe() { qaMetrics.holdNextRecipe = true; },
    releaseRecipe: releaseQaRecipe,
    forgetKnowledge(id: string) { FirestoreRepo.remove('hopKnowledge', id); },
    ready: () => FirestoreRepo.isReady()
    ,showAromaChart(props:React.ComponentProps<typeof HopExplorationChart>) { appRoot.render(<main className="max-w-2xl mx-auto p-5"><p className="text-sm text-cave-400 mb-4">Banc visuel · données synthétiques</p><HopExplorationChart {...props}/></main>); }
  };
  appRoot.render(<App />);
}
start().catch(e => { document.body.textContent = String(e); throw e; });
