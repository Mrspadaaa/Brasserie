import { describe, expect, it } from 'vitest';
import type { HopKnowledge, HopYeast } from '../../functions/src/hopPredictionSchema';
import { assertHopKnowledge } from '../../functions/src/hopPredictionSchema';
import { buildYeastCompanion, yeastCompanionSummary, type YeastCompanionOptions } from '../../src/domain/yeastCompanion';
import { applyYeastRecipeDesign, createYeastRecipeDraft, type YeastRecipeDraft } from '../../src/domain/yeastRecipeDesign';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { recipe } from '../fixtures/brewCompanion';

const refs = yeastReferences();
const reference = (id: string) => refs.find(r => r.id === id)!;
function brew(id = 'wyeast-3068', style = 'Hefeweizen') {
  const y = reference(id);
  return recipe({ name: 'Lot témoin', style, hops: [],
    yeast: { name: y.name, hopIndexId: id, form: y.form!, qty: y.form === 'sèche' ? 15 : 100, unit: y.form === 'sèche' ? 'g' : 'mL', pitchTempC: 20 },
    fermentation: [
      { name: 'Principale', kind: 'primaire', tempC: 20, days: 7 },
      { name: 'Garde', kind: 'garde', tempC: 0, days: 5 }
    ]
  });
}
function adopted(r = brew(), patch: Partial<YeastRecipeDraft> = {}) {
  return applyYeastRecipeDesign(r, { ...createYeastRecipeDraft(r, refs), ...patch }, refs);
}
function personal(id: string): HopYeast {
  const { aliases: _aliases, ...saved } = structuredClone(reference(id));
  return saved;
}
function deepFreeze<T>(item: T): T {
  if (item && typeof item === 'object') {
    Object.values(item).forEach(deepFreeze);
    Object.freeze(item);
  }
  return item;
}

describe('Contexte levure : intention adoptée et recette actuelle', () => {
  it('restaure un filtre explicitement adopté avec un style personnel et conserve 0 bar', () => {
    const r = adopted(brew('wyeast-3068', 'Style de la maison'), { styleId: 'weissbier', goal: 'clove', pressureBar: 0, ferulicRest: true });
    const data = buildYeastCompanion(r);
    expect(data.style).toMatchObject({ recipeStyle: 'Style de la maison', recipeFamily: 'unknown', comparisonFamily: 'weissbier', comparisonOrigin: 'adopted-filter' });
    expect(data.snapshotStatus).toBe('current');
    expect(data.adoptedIntent).toMatchObject({ goal: 'clove', pressureBar: 0, ferulicRest: true, stale: false, applicable: true });
    expect(data.current?.pressure).toEqual({ plannedBar: 0, unit: 'bar-relative', origin: 'adopted-intent', measured: false });
    expect(data.current?.mash[0]).toEqual({ name: 'Repos férulique · proposition L’Affinée', tempC: 44, durationMin: 15 });
    expect(data.analysis).toMatchObject({ goal: 'clove', goalOrigin: 'adopted', scenario: false });
    expect(data.missingData.some(m => m.id === 'yeast.pressure')).toBe(false);
  });

  it('laisse la pression et la dose viable inconnues au lieu de les déduire du flacon', () => {
    const data = buildYeastCompanion(brew());
    expect(data.current?.pressure).toEqual({ plannedBar: null, unit: 'bar-relative', origin: 'unknown', measured: false });
    expect(data.current?.yeast.quantity).toEqual({ value: 100, unit: 'mL', status: 'known', grams: null });
    expect(data.analysis?.candidate?.dryDoseG).toBeNull();
    expect(data.missingData.map(m => m.id)).toEqual(expect.arrayContaining(['yeast.pressure', 'yeast.viableCells']));
    expect(data.analysis?.proposedChanges).toEqual([]);
  });

  it('utilise les vrais paliers, la dose et les houblons après modification du scénario adopté', () => {
    const r = adopted(brew('lallemand-munich-classic'), { goal: 'banana', pressureBar: 0.8 });
    r.yeast.qty = 18;
    r.fermentation![0].tempC = 23;
    r.hops = [{ name: 'Citra du lot', stage: 'dryHop', weightG: 40, alpha: 12, dayOffset: 4, aromaTiming: 'postFermentation', aromaContactHours: 36, aromaTemperatureC: 15 }];
    const data = buildYeastCompanion(r);
    expect(data.snapshotStatus).toBe('stale');
    expect(data.adoptedIntent).toMatchObject({ goal: 'banana', stale: true, applicable: true });
    expect(data.current?.yeast.quantity.grams).toBe(18);
    expect(data.current?.fermentation[0].tempC).toBe(23);
    expect(data.current?.hops[0]).toMatchObject({ name: 'Citra du lot', weightG: 40, doseGL: 2, biologicalContext: 'post', contactHours: 36, temperatureC: 15 });
    expect(data.analysis?.effects.find(e => e.id === 'temperature')?.impact).toContain('23 °C');
    expect(data.analysis?.warnings.join(' ')).toContain('Les valeurs actuelles de recette');
    expect(r.yeastDesign!.applied.yeast.qty).toBe(15);
    expect(r.yeastDesign!.applied.fermentation[0].tempC).toBe(20);
  });

  it('relit les houblons et la DI sans prétendre les avoir dans l’ancien snapshot', () => {
    const r = adopted();
    r.ogTarget = 1.06;
    r.hops = [{ name: 'Mosaic', stage: 'dryHop', weightG: 40, alpha: 12, dayOffset: 4 }];
    const data = buildYeastCompanion(r);
    expect(data.snapshotStatus).toBe('current');
    expect(data.current?.ogTarget).toBe(1.06);
    expect(data.current?.dryHop.totalG).toBe(40);
    expect(data.analysis?.finalGravity.range?.min).toBeCloseTo(1.0138, 10);
    expect(data.analysis?.effects.some(e => e.id === 'hop-creep')).toBe(true);
    expect(data.limits.join(' ')).toContain('Houblons et DI sont toujours relus');
  });

  it('révise la famille quand le vrai style change et ne recycle pas la banane adoptée', () => {
    const r = adopted(brew(), { goal: 'banana', pressureBar: 0.5 });
    r.style = 'NEIPA';
    const data = buildYeastCompanion(r);
    expect(data.style).toMatchObject({ recipeFamily: 'hazy-ipa', comparisonFamily: 'hazy-ipa', comparisonOrigin: 'recipe-style' });
    expect(data.adoptedIntent).toMatchObject({ goal: 'banana', applicable: false, stale: true });
    expect(data.analysis).toMatchObject({ goal: 'hops', goalOrigin: 'style-default' });
    expect(data.analysis?.proposedSettings).toBeNull();
    expect(data.current?.pressure.plannedBar).toBe(0.5);
    expect(data.alternatives.every(a => a.styleMatch === 'documented' && a.styleEvidence.some(e => e.styleId === 'hazy-ipa'))).toBe(true);
    expect(new Set(data.alternatives.map(a => a.lab)).size).toBeGreaterThan(3);
  });

  it('garde une ancienne intention comme trace quand la souche actuelle a changé', () => {
    const r = adopted(brew(), { goal: 'clove', pressureBar: 0.8 });
    r.yeast = { ...brew('white-labs-wlp300').yeast };
    const data = buildYeastCompanion(r);
    expect(data.current?.yeast.resolvedId).toBe('white-labs-wlp300');
    expect(data.current?.pressure.plannedBar).toBeNull();
    expect(data.adoptedIntent).toMatchObject({ yeastId: 'wyeast-3068', goal: 'clove', applicable: false });
    expect(data.analysis?.goalOrigin).toBe('style-default');
    expect(data.snapshotStatus).toBe('stale');
  });

  it('lit les anciens snapshots sans identité de style, puis laisse gagner un nouveau style reconnu', () => {
    const r = adopted(brew('wyeast-3068', 'Style maison'), { styleId: 'weissbier', goal: 'clove', pressureBar: 0 });
    delete r.yeastDesign!.applied.style;
    delete r.yeastDesign!.applied.styleRef;
    expect(buildYeastCompanion(r).analysis).toMatchObject({ goal: 'clove', goalOrigin: 'adopted' });
    r.styleRef = { guideId: 'bjcp-2021', version: '2021', styleId: 'german-pils' };
    const data = buildYeastCompanion(r);
    expect(data.style).toMatchObject({ recipeFamily: 'lager', comparisonFamily: 'lager' });
    expect(data.analysis?.goal).toBe('clean');
    expect(data.adoptedIntent?.applicable).toBe(false);
  });

  it('ne reconstitue pas une version inconnue ou un objectif enregistré incompatible', () => {
    const invalid = adopted();
    (invalid.yeastDesign as any).modelVersion = 'yeast-recipe-future';
    const unreadable = buildYeastCompanion(invalid);
    expect(unreadable.snapshotStatus).toBe('invalid');
    expect(unreadable.adoptedIntent).toBeNull();
    expect(unreadable.missingData.some(m => m.id === 'yeastDesign')).toBe(true);
    const incompatible = adopted(brew(), { styleId: 'lager', goal: 'banana' });
    const data = buildYeastCompanion(incompatible);
    expect(data.adoptedIntent?.applicable).toBe(false);
    expect(data.analysis?.goal).toBe('clean');
    expect(data.missingData.some(m => m.id === 'yeastDesign.goal')).toBe(true);
  });
});

describe('Outil de conseil : demande explicite, famille et propositions sourcées', () => {
  it('traduit phenolic en girofle pour une Weissbier sans adopter le preset', () => {
    const r = brew(), before = structuredClone(r);
    const data = buildYeastCompanion(r, [], { goal: 'phenolic', maxAlternatives: 8 });
    expect(data.request.goal).toMatchObject({ value: 'phenolic', mappedGoal: 'clove', status: 'accepted' });
    expect(data.analysis).toMatchObject({ goal: 'clove', goalOrigin: 'explicit-request', scenario: true });
    expect(data.analysis?.proposedSettings).toMatchObject({ patch: { temperatureC: 18, ferulicRest: true }, source: { kind: 'judgment' } });
    expect(data.analysis?.proposedSettings?.patch.quantityG).toBeUndefined();
    expect(data.analysis?.proposedSettings?.patch.pressureBar).toBeUndefined();
    expect(data.sources).toContainEqual(data.analysis?.proposedSettings?.source);
    const wlp380 = buildYeastCompanion(r, [], { goal: 'phenolic', yeastId: 'white-labs-wlp380' }).analysis!.candidate!;
    expect(wlp380.preferred).toBe(true);
    expect(wlp380.sources.some(s => s.reference.includes('whitelabs.com'))).toBe(true);
    expect(data.alternatives.map(a => a.yeastId)).not.toContain('wyeast-3944');
    expect(data.alternatives.map(a => a.yeastId)).not.toContain('wyeast-1010');
    expect(data.current?.fermentation[0].tempC).toBe(20);
    expect(data.current?.mash[0].tempC).toBe(67);
    expect(data.adoptedIntent).toBeNull();
    expect(r).toEqual(before);
  });

  it('refuse banana pour une Lager tout en donnant ses alternatives de Lager', () => {
    const r = brew('lalbrew-diamond', 'German Pils');
    r.fermentation![0].tempC = 12; r.yeast.pitchTempC = 12;
    const data = buildYeastCompanion(r, [], { goal: 'banana' });
    expect(data.request.goal.status).toBe('rejected');
    expect(data.analysis).toMatchObject({ goal: 'clean', goalOrigin: 'style-default', scenario: false });
    expect(data.alternatives).toHaveLength(5);
    expect(data.alternatives.every(a => a.styleEvidence.some(e => e.styleId === 'lager'))).toBe(true);
    expect(data.alternativeCount).toBeGreaterThan(6); expect(data.alternativesLimited).toBe(true);
    expect(data.alternatives.some(a => a.yeastId === 'wyeast-3068')).toBe(false);
  });

  it('examine thiols comme interaction avec les houblons, sans promesse de fruité', () => {
    const data = buildYeastCompanion(brew('lalbrew-verdant-ipa', 'NEIPA'), [], { goal: 'thiols' });
    expect(data.request.goal).toMatchObject({ mappedGoal: 'hops', status: 'accepted' });
    expect(data.request.goal.reason).toContain('ne signifie pas un gain de fruité garanti');
    expect(data.analysis?.effects.find(e => e.id === 'hop-sensory')).toMatchObject({ impact: 'Thiols mesurés ≠ fruité prédit', state: 'conditional' });
    expect(data.alternatives).toHaveLength(5);
    expect(data.alternatives.every(a => a.styleEvidence.some(e => e.styleId === 'hazy-ipa'))).toBe(true);
  });

  it('compare une souche dans la famille avec sa propre atténuation, en conservant la vraie levure', () => {
    const r = brew('lalbrew-verdant-ipa', 'Hazy IPA'); r.ogTarget = 1.06;
    const data = buildYeastCompanion(r, [], { yeastId: 'wyeast-1318' });
    expect(data.request.yeastId.status).toBe('accepted');
    expect(data.current?.yeast.resolvedId).toBe('lalbrew-verdant-ipa');
    expect(data.current?.yeast.quantity.grams).toBe(15);
    expect(data.analysis).toMatchObject({ yeastId: 'wyeast-1318', scenario: true });
    expect(data.analysis?.candidate?.attenuationPct?.range).toEqual({ min: 71, max: 75 });
    expect(data.analysis?.finalGravity.range?.min).toBeCloseTo(1.015, 10);
    expect(data.analysis?.finalGravity.range?.max).toBeCloseTo(1.0174, 10);
    expect(data.analysis?.proposedChanges.some(c => c.id === 'yeast')).toBe(true);
    expect(data.alternatives.map(a => a.yeastId)).not.toContain('wyeast-1318');
    expect(data.alternatives.map(a => a.yeastId)).not.toContain('lalbrew-verdant-ipa');
    expect(data.alternatives.every(a => a.styleMatch === 'documented')).toBe(true);
  });

  it('refuse une souche hors style ou un ID absent sans remplacement implicite', () => {
    for (const yeastId of ['wyeast-3944', 'missing-3068']) {
      const data = buildYeastCompanion(brew(), [], { yeastId });
      expect(data.request.yeastId.status).toBe('rejected');
      expect(data.analysis?.yeastId).toBe('wyeast-3068');
      expect(data.analysis?.scenario).toBe(false);
    }
    const r = brew(); r.yeast.hopIndexId = 'missing-3068';
    const data = buildYeastCompanion(r);
    expect(data.current?.yeast.resolvedId).toBeNull();
    expect(data.analysis?.candidate).toBeNull();
    expect(data.analysis?.finalGravity.range).toBeNull();
  });

  it('demande une famille pour un style inconnu au lieu d’énumérer tout le catalogue', () => {
    const data = buildYeastCompanion(brew('wyeast-3068', 'Bière de blé maison'), [], { goal: 'banana', yeastId: 'white-labs-wlp300' });
    expect(data.style.comparisonFamily).toBe('unknown');
    expect(data.request.goal.status).toBe('rejected');
    expect(data.request.yeastId.status).toBe('rejected');
    expect(data.analysis?.goal).toBeNull();
    expect(data.analysis?.proposedSettings).toBeNull();
    expect(data.alternatives).toEqual([]);
  });

  it('sépare une DI fournie pour simulation de la cible actuelle et accepte l’inconnue explicite', () => {
    const r = brew();
    const data = buildYeastCompanion(r, [], { og: 1.06 });
    expect(data.current?.ogTarget).toBe(1.05);
    expect(data.analysis).toMatchObject({ og: 1.06, gravityOrigin: 'explicit-scenario-not-certified', scenario: true });
    expect(data.request.og.status).toBe('accepted');
    expect(data.analysis?.finalGravity.range?.min).toBeCloseTo(1.0138, 10);
    const unknown = buildYeastCompanion(r, [], { og: null });
    expect(unknown.analysis?.og).toBeNull(); expect(unknown.analysis?.finalGravity.range).toBeNull();
    expect(unknown.current?.ogTarget).toBe(1.05);
    expect(buildYeastCompanion(r, [], { og: 12 }).request.og.status).toBe('rejected');
  });

  it('rejette les options mal formées sans exception ni pollution du mappage', () => {
    for (const options of [{ goal: '__proto__' }, { goal: 'constructor' }, { goal: 0 }, { yeastId: 3068 }, { og: Infinity }] as unknown as YeastCompanionOptions[]) {
      const data = buildYeastCompanion(brew(), [], options);
      const status = options.goal !== undefined ? data.request.goal : options.yeastId !== undefined ? data.request.yeastId : data.request.og;
      expect(status.status).toBe('rejected');
      expect(() => JSON.stringify(data)).not.toThrow();
      expect(data.analysis?.goal).toBe('balanced');
    }
  });
});

describe('Connaissances personnelles, inconnues et limites de calcul', () => {
  it('utilise les observations personnelles du même ID avec leur source, sans écraser le catalogue', () => {
    const saved = personal('wyeast-3068'); saved.name = '3068 du lot cave';
    const source = { title: 'Fiche du lot cave', author: 'La cave', year: 2026, kind: 'observation' as const, reference: 'Journal cave / lot 42' };
    for (const fact of saved.catalogue!.facts) {
      if (fact.key === 'temperature') Object.assign(fact, { range: { min: 19, max: 22 }, reported: '19–22 °C', source });
      if (fact.key === 'attenuation') Object.assign(fact, { range: { min: 70, max: 72 }, reported: '70–72 %', source });
    }
    expect(() => assertHopKnowledge(saved)).not.toThrow();
    const data = buildYeastCompanion(brew(), [saved]);
    expect(data.current?.yeast.referenceName).toBe('3068 du lot cave');
    expect(data.analysis?.candidate?.temperatureC).toEqual({ range: { min: 19, max: 22 }, source });
    expect(data.analysis?.candidate?.attenuationPct?.range).toEqual({ min: 70, max: 72 });
    expect(data.analysis?.finalGravity.range?.min).toBeCloseTo(1.014, 10);
    expect(data.sources).toContainEqual(source);
    expect(buildYeastCompanion(brew()).analysis?.candidate?.temperatureC?.range).toEqual({ min: 18, max: 24 });
  });

  it('laisse un conflit de source visible et la plage inconnue au lieu de calculer une moyenne', () => {
    const saved = personal('wyeast-3068');
    const fact = saved.catalogue!.facts.find(f => f.key === 'temperature')!;
    saved.catalogue!.facts.push({ ...fact, range: { min: 19, max: 22 }, reported: '19–22 °C', source: { ...fact.source, reference: 'Fiche personnelle contradictoire' } });
    const data = buildYeastCompanion(brew(), [saved], { goal: 'banana' });
    expect(data.analysis?.candidate?.temperatureC).toBeNull();
    expect(data.analysis?.candidate?.observations.filter(f => f.key === 'temperature').map(f => f.range)).toEqual([{ min: 18, max: 24 }, { min: 19, max: 22 }]);
    expect(data.analysis?.proposedSettings).toBeNull();
    expect(data.analysis?.warnings.join(' ')).toContain('sources non concordantes');
    expect(data.sources.some(s => s.reference === 'Fiche personnelle contradictoire')).toBe(true);
  });

  it('enrichit un ancien bootstrap sans catalogue mais ne ressuscite pas une entrée personnelle invalide', () => {
    const old = personal('wyeast-3068'); delete old.catalogue; old.name = 'Mon ancien nom';
    const enriched = buildYeastCompanion(brew(), [old]);
    expect(enriched.current?.yeast.referenceName).toBe('Mon ancien nom');
    expect(enriched.analysis?.candidate?.temperatureC?.range).toEqual({ min: 18, max: 24 });
    const invalid = { ...personal('wyeast-3068'), form: 'introuvable' } as unknown as HopKnowledge;
    const masked = buildYeastCompanion(brew(), [invalid]);
    expect(masked.current?.yeast.resolvedId).toBeNull();
    expect(masked.analysis?.candidate).toBeNull();
    expect(masked.alternatives.some(a => a.yeastId === 'wyeast-3068')).toBe(false);
  });

  it('conserve une quantité en sachets et affiche la dose documentaire sans conversion arbitraire', () => {
    const r = brew('lallemand-munich-classic'); r.yeast.qty = 2; r.yeast.unit = 'sachets';
    const data = buildYeastCompanion(r);
    expect(data.current?.yeast.quantity).toEqual({ value: 2, unit: 'sachets', status: 'known', grams: null });
    expect(data.analysis?.candidate?.dryDoseG?.range).toEqual({ min: 10, max: 20 });
    expect(data.missingData.some(m => m.id === 'yeast.grams')).toBe(true);
    expect(data.analysis?.proposedChanges).toEqual([]);
    r.yeast.qty = 0;
    expect(buildYeastCompanion(r).current?.yeast.quantity.status).toBe('missing');
  });

  it('signale une forme différente de la référence sans transformer la dose actuelle', () => {
    const r = brew('white-labs-wlp066', 'NEIPA');
    r.yeast = { ...r.yeast, form: 'sèche', qty: 15, unit: 'g' };
    const data = buildYeastCompanion(r);
    expect(data.current?.yeast).toMatchObject({ form: 'sèche', quantity: { grams: 15 } });
    expect(data.analysis?.candidate).toMatchObject({ form: 'liquide', dryDoseG: null });
    expect(data.missingData.some(m => m.id === 'yeast.formMismatch')).toBe(true);
  });

  it('préserve les zéros réels de garde et d’ajout mais les durées absentes restent nulles', () => {
    const r = brew();
    r.fermentation = [
      { name: 'Principale vide', kind: 'primaire', tempC: undefined, days: undefined },
      { name: 'Ajout prévu', kind: 'ajout', tempC: 20, days: 0 },
      { name: 'Garde froide', kind: 'garde', tempC: 0, days: 5 }
    ] as any;
    const data = buildYeastCompanion(r);
    expect(data.current?.fermentation[0]).toMatchObject({ tempC: null, days: null });
    expect(data.current?.fermentation[1].days).toBe(0);
    expect(data.current?.fermentation[2].tempC).toBe(0);
    expect(data.missingData.map(m => m.id)).toEqual(expect.arrayContaining(['fermentation.0.temperature', 'fermentation.0.days']));
    expect(data.missingData.some(m => m.id === 'fermentation.1.days')).toBe(false);
    expect(data.analysis?.proposedSettings?.source.kind).toBe('judgment');
    expect(r.fermentation[0].days).toBeUndefined();
  });
});

describe('Houblons : ingrédients et contacts réellement renseignés', () => {
  it('sépare contact actif, post-fermentation et J+3 inconnu avec les doses du vrai volume', () => {
    const r = brew('lalbrew-verdant-ipa', 'NEIPA');
    r.hops = [
      { name: 'Citra actif', stage: 'dryHop', alpha: 12, weightG: 50, dayOffset: 3, aromaTiming: 'fermentation', aromaContactHours: 48, aromaTemperatureC: 20 },
      { name: 'Mosaic post', stage: 'dryHop', alpha: 12, weightG: 75, dayOffset: 3, aromaTiming: 'postFermentation', aromaContactHours: 24, aromaTemperatureC: 15 },
      { name: 'Citra inconnu', stage: 'dryHop', alpha: 12, weightG: 25, dayOffset: 3 }
    ];
    const data = buildYeastCompanion(r);
    expect(data.current?.dryHop).toEqual({ totalG: 150, doseGL: 7.5, activeG: 50, postG: 75, unknownG: 25, unknownCount: 1 });
    expect(data.current?.hops.map(h => h.biologicalContext)).toEqual(['active', 'post', 'unknown']);
    expect(data.current?.hops[2]).toMatchObject({ dayOffset: 3, contactHours: null, temperatureC: null });
    expect(data.missingData.find(m => m.id === 'hops.2.biologicalContext')?.detail).toContain('J+3 ne le détermine pas');
    expect(data.analysis?.effects.map(e => e.id)).toEqual(expect.arrayContaining(['hop-active', 'hop-post', 'hop-creep']));
    expect(data.analysis?.finalGravity.reasons.join(' ')).toContain('hop creep');
  });

  it('ne convertit pas le rang historique en jour et laisse les masses manquantes inconnues', () => {
    const r = brew();
    r.hops = [
      { name: 'Ancien houblon', step: 'Dry hop #2', alpha: 12, weightG: 30 },
      { name: 'Poids absent', stage: 'dryHop', alpha: 12, weightG: NaN, aromaTiming: 'fermentation' },
      { name: 'Étape absente', weightG: 10, alpha: 5 }
    ] as any;
    const data = buildYeastCompanion(r);
    expect(data.current?.hops[0]).toMatchObject({ stage: 'dryHop', stageOrigin: 'legacy-label', dayOffset: null, biologicalContext: 'unknown', contactHours: null });
    expect(data.current?.hops[1].weightG).toBeNull();
    expect(data.current?.dryHop).toMatchObject({ totalG: null, doseGL: null, activeG: null, unknownG: 30 });
    expect(data.current?.hops[2]).toMatchObject({ stage: null, stageOrigin: 'unknown', biologicalContext: 'unknown' });
    expect(data.missingData.some(m => m.id === 'hops.2.stage')).toBe(true);
  });

  it('maintient le contrôle hop creep pour une souche sans STA1 et sans date de fin certaine', () => {
    const r = brew('lalbrew-farmhouse', 'Saison');
    r.hops = [{ name: 'Saaz', stage: 'dryHop', alpha: 4, weightG: 30, aromaTiming: 'postFermentation', aromaContactHours: 48, aromaTemperatureC: 20 }];
    const data = buildYeastCompanion(r);
    expect(data.analysis?.effects.find(e => e.id === 'diastatic')?.impact).toContain('non diastatique');
    expect(data.analysis?.effects.find(e => e.id === 'hop-creep')?.detail).toContain('stabilité de densité et diacétyle');
    expect(data.analysis?.effects.find(e => e.id === 'hop-post')?.detail).toContain('sans date de fin');
  });

  it('ne crée pas de houblon depuis une simple phase du calendrier', () => {
    const r = brew(); r.hops = [];
    r.fermentation!.push({ name: 'Houblonnage à cru', kind: 'ajout', tempC: 20, days: 0 });
    const data = buildYeastCompanion(r);
    expect(data.current?.dryHop.totalG).toBe(0);
    expect(data.current?.hops).toEqual([]);
    expect(data.analysis?.effects.some(e => e.id === 'hop-creep')).toBe(false);
    expect(data.analysis?.warnings.join(' ')).toContain('aucun ajout à cru');
  });
});

describe('Limites de transport IA et résumé métier', () => {
  it('retourne une absence de recette exploitable sans fabriquer de fermentation', () => {
    const data = buildYeastCompanion(null, [], { goal: 'banana', yeastId: 'wyeast-3068', og: 1.05 });
    expect(data).toMatchObject({ mode: 'no-recipe', current: null, analysis: null, alternatives: [], readOnly: true });
    expect(data.request.goal.status).toBe('rejected'); expect(data.request.yeastId.status).toBe('rejected');
    expect(yeastCompanionSummary(undefined).join(' ')).toContain('recette absente');
  });

  it('route NOLO vers son modèle sans conseils ou alternatives de bière alcoolisée', () => {
    const r = adopted(brew(), { goal: 'banana', pressureBar: 0 });
    r.nolo = { enabled: true } as any;
    const data = buildYeastCompanion(r, [], { goal: 'banana', yeastId: 'white-labs-wlp300', og: 1.02 });
    expect(data).toMatchObject({ mode: 'nolo', analysis: null, alternatives: [], alternativeCount: 0 });
    expect(data.current?.yeast.resolvedId).toBe('wyeast-3068');
    expect(data.adoptedIntent?.applicable).toBe(false);
    expect(data.request.goal.status).toBe('rejected'); expect(data.request.og.status).toBe('rejected');
    const summary = yeastCompanionSummary(r).join(' ');
    expect(summary).toContain('non applicable au scénario actuel');
    expect(summary).toContain('NOLO : analyser avec le moteur dédié');
    expect(summary).not.toContain('Objectif examiné :');
  });

  it('produit du JSON détaché, borné, sans modifier la recette ni le catalogue personnel', () => {
    const r = deepFreeze(adopted(brew(), { goal: 'clove', pressureBar: 0 }));
    const knowledge = [personal('wyeast-3068')]; deepFreeze(knowledge);
    const beforeRecipe = JSON.stringify(r), beforeKnowledge = JSON.stringify(knowledge);
    const data = buildYeastCompanion(r, knowledge, { maxAlternatives: 999 });
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
    expect(data.alternatives.length).toBe(8);
    expect(JSON.stringify(data).length).toBeLessThan(80000);
    expect(data.analysis?.effects.every(e => !('score' in e) && !('intensity' in e) && !('percent' in e))).toBe(true);
    data.current!.mash[0].tempC = 99;
    data.analysis!.candidate!.temperatureC!.range.min = 99;
    data.analysis!.candidate!.observations[0].reported = 'Autre texte';
    data.sources[0].title = 'Autre source';
    expect(JSON.stringify(r)).toBe(beforeRecipe);
    expect(JSON.stringify(knowledge)).toBe(beforeKnowledge);
    expect(buildYeastCompanion(r, knowledge).analysis?.candidate?.temperatureC?.range.min).toBe(18);
  });

  it('annonce une liste volontairement limitée et permet de ne demander que le contexte', () => {
    const limited = buildYeastCompanion(brew(), [], { maxAlternatives: 2 });
    expect(limited.alternatives.length).toBe(2);
    expect(limited.alternativeCount).toBeGreaterThan(7); expect(limited.alternativesLimited).toBe(true);
    expect(buildYeastCompanion(brew(), [], { maxAlternatives: 0 }).alternatives).toEqual([]);
  });

  it('résume la conduite actuelle, le filtre explicite et les inconnues sans nommer un défaut comme intention adoptée', () => {
    const r = adopted(brew('wyeast-3068', 'Style maison'), { styleId: 'weissbier', goal: 'clove', pressureBar: 0 });
    r.fermentation![0].tempC = 21;
    r.hops = [{ name: 'Mosaic', stage: 'dryHop', alpha: 12, weightG: 40, dayOffset: 3 }];
    const summary = yeastCompanionSummary(r).join('\n');
    expect(summary).toContain('filtre adopté');
    expect(summary).toContain('snapshot devenu ancien');
    expect(summary).toContain('0 bar relatif');
    expect(summary).toContain('Principale 21 °C / 7 j');
    expect(summary).toContain('contexte biologique inconnu, contact inconnu');
    expect(summary).toContain('elles ne modifient pas la recette');
    const defaultSummary = yeastCompanionSummary(brew()).join(' ');
    expect(defaultSummary).toContain('Intention adoptée : non renseignée');
    expect(defaultSummary).toContain('orientation de style, pas demande de maximiser un goût');
  });
});
