import { describe, expect, it } from 'vitest';
import type { HopSource, HopVariety } from '../../functions/src/hopIndexSchema';
import {
  applyBrewerCatalogueCommand, canonicalBrewerCatalogueFingerprintInput, projectBrewerCatalogueEntity,
  stampBrewerCatalogueFingerprint
} from '../../functions/src/brewerCatalogueCore';
import {
  assertBrewerCatalogueCommand, assertBrewerCatalogueMeta, brewerCatalogueIdentityKeys, describeBrewerCatalogueCommand,
  type BrewerCatalogueClaim, type BrewerCatalogueCommand
} from '../../functions/src/brewerCatalogueSchema';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import { brewingStyleGuides, brewingStyles, matchBrewingStyles, resolveBrewingStyle } from '../../src/domain/brewingStyles';
import { catalogueIdentityAliases, yeastSearchIndex, yeastSearchScore } from '../../src/domain/yeastCatalogue';

const at = '2026-10-01T12:00:00.000Z';
const manufacturer: HopSource = {
  title: 'Fiche fabricant fictive', author: 'Fabricant exemple', year: 2026,
  kind: 'manufacturer', reference: 'https://example.test/catalogue/item', locator: 'Tableau fictif'
};
const personal: HopSource = {
  title: 'Déclaration personnelle fictive', author: 'Brasseur exemple', year: null,
  kind: 'judgment', reference: 'example://personal-claim'
};
const claim = (id: string, property: string, reported: string, options: Partial<BrewerCatalogueClaim> = {}): BrewerCatalogueClaim => ({
  id, scope: 'variety', property, reported, epistemic: 'measured', source: manufacturer,
  dates: { retrievedAt: at, recordedAt: at }, ...options
});

function applied(result: ReturnType<typeof applyBrewerCatalogueCommand>) {
  if (result.status !== 'applied') throw new Error(`${result.status}: ${result.reason}`);
  return result;
}
const execution = (allocatedId: string, extra: Record<string, unknown> = {}) => ({
  allocatedId, identityCheckComplete: true, identityCandidates: [], recordedAt: at, ...extra
});
function createHop(name = 'Hop de test'): BrewerCatalogueCommand {
  return {
    schemaVersion: 1, operationId: 'create-hop-one', operation: 'create',
    entity: { kind: 'hopVariety', value: { name, aliases: [], form: 'unknown', descriptions: [], analysis: [] } },
    claims: [], unmapped: [], projectionChoices: []
  };
}
function target(kind: 'hopVariety' | 'yeastStrain' | 'brewingStyle', id: string, extra: Record<string, unknown> = {}) {
  return { kind, id, expectedRevision: 1, expectedFingerprint: 'a'.repeat(64), ...extra };
}

describe('contrat et reducer pur des catalogues du brasseur', () => {
  it('décrit les trois commandes create/enrich sans ID et fournit des exemples qui passent le contrat', () => {
    for (const kind of ['hopVariety', 'yeastStrain', 'brewingStyle'] as const) {
      const description = describeBrewerCatalogueCommand(kind);
      expect(description.examplesAreFictional).toBe(true);
      expect(description.examples.create).not.toHaveProperty('entity.id');
      expect(() => assertBrewerCatalogueCommand(description.examples.create)).not.toThrow();
      expect(() => assertBrewerCatalogueCommand(description.examples.enrich)).not.toThrow();
    }
  });

  it('crée une variété à partir d’une absence d’ID, puis scelle une empreinte hors champ fingerprint', () => {
    const created = applied(applyBrewerCatalogueCommand(null, createHop('Amertume fictive'), execution('hop-allocated-1')));
    expect(created.record).toMatchObject({ id: 'hop-allocated-1', name: 'Amertume fictive', analysis: [], catalogueMeta: { revision: 1, entityKind: 'hopVariety' } });
    expect(created.record.catalogueMeta?.fingerprint).toBeUndefined();
    const input = canonicalBrewerCatalogueFingerprintInput(created.record);
    const stamped = stampBrewerCatalogueFingerprint(created.record, 'b'.repeat(64));
    expect(canonicalBrewerCatalogueFingerprintInput(stamped)).toBe(input);
    expect(stamped.catalogueMeta?.fingerprint).toBe('b'.repeat(64));
  });

  it('n’accepte pas un analyte ou une β-lyase déjà encodés comme fait sans claim/projection', () => {
    const directAnalysis: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'create-hop-direct-measurement', operation: 'create', entity: {
      kind: 'hopVariety', value: { name: 'Variété de test', aliases: [], form: 'unknown', descriptions: [],
        analysis: [{ analyte: 'alpha', unit: 'percentMass', basis: 'asIs', kind: 'point', value: 12, confidence: 'medium', source: manufacturer }] }
    }, claims: [], unmapped: [], projectionChoices: [] };
    expect(applyBrewerCatalogueCommand(null, directAnalysis, execution('hop-direct-analysis'))).toMatchObject({ status: 'invalid' });
    const directLyase: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'create-yeast-direct-lyase', operation: 'create',
      entity: { kind: 'yeastStrain', value: { kind: 'yeast', name: 'Souche de test', betaLyase: 'positive', source: manufacturer } },
      claims: [], unmapped: [], projectionChoices: [] };
    expect(applyBrewerCatalogueCommand(null, directLyase, execution('yeast-direct-lyase'))).toMatchObject({ status: 'invalid' });
  });

  it('refuse un create sans scan exhaustif, et ne confond pas une collision de nom avec une identité à fusionner', () => {
    const noScan = applyBrewerCatalogueCommand(null, createHop(), { allocatedId: 'hop-1', recordedAt: at });
    expect(noScan).toMatchObject({ status: 'conflict' });
    const existing = applied(applyBrewerCatalogueCommand(null, createHop(), execution('hop-existing'))).record;
    const candidate = { kind: 'hopVariety' as const, id: existing.id, fingerprint: 'c'.repeat(64) };
    const collision = applyBrewerCatalogueCommand(null, createHop(), execution('hop-another', { identityCandidates: [candidate] }));
    expect(collision).toMatchObject({ status: 'conflict' });

    const distinct = createHop('Hop de test');
    if (distinct.operation !== 'create') throw Error('create expected');
    distinct.identityResolution = { decision: 'distinct', candidates: [candidate], reason: 'Deux identités homonymes; les codes fabricant diffèrent.' };
    const separate = applied(applyBrewerCatalogueCommand(null, distinct, execution('hop-separate', { identityCandidates: [candidate] })));
    expect(separate.record.id).toBe('hop-separate');
    expect(separate.record.catalogueMeta?.identityResolutions).toHaveLength(1);
  });

  it('normalise nom/alias pour détecter le candidat, sans rendre les codes de style ou de produit globaux', () => {
    const keys = brewerCatalogueIdentityKeys({ kind: 'hopVariety', value: { name: 'CITRÀ', aliases: ['Citra Brand'], form: 'unknown', descriptions: [], analysis: [] } });
    expect(keys).toContain('hopVariety:citra');
    expect(keys).toContain('hopVariety:citra brand');
    const yeastKeys = brewerCatalogueIdentityKeys({ kind: 'yeastStrain', value: {
      kind: 'yeast', name: 'Culture 001', betaLyase: 'unknown', source: manufacturer,
      catalogue: { manufacturer: 'Lab A', productId: 'test', productCode: '001', aliases: ['Culture Lab A'], categories: [], status: 'listed', facts: [], documents: [],
        retrievals: [{ url: 'https://example.test/yeast', retrievedAt: at, sha256: 'd'.repeat(64), etag: null, lastModified: null }],
        publishedAt: null, pageUpdatedAt: null, parserVersion: 'test', contentSha256: 'e'.repeat(64), gaps: [] }
    } });
    expect(yeastKeys).toContain('yeastStrain:lab a 001');
    expect(yeastKeys).not.toContain('yeastStrain:001');
    const styleValue = (guide: string, edition: string) => ({ kind: 'brewingStyle' as const, value: {
      kind: 'styleGuide' as const, name: guide, version: edition, enabled: true, edition, createdAt: '2026-10-01', retrievedAt: null,
      attribution: 'fictif', source: personal,
      styles: [{ code: 'PERS', name: `Style ${guide}`, aliases: [], family: 'personal', stats: {}, source: personal }]
    } });
    const styleKeysA = brewerCatalogueIdentityKeys(styleValue('Guide A', 'v1'));
    const styleKeysB = brewerCatalogueIdentityKeys(styleValue('Guide B', 'v1'));
    expect(styleKeysA).not.toContain('brewingStyle:pers');
    expect(styleKeysA).not.toEqual(styleKeysB);
  });

  it('ne rend un alias identité calculable en recherche qu’après projection explicite, jamais depuis une hypothèse', () => {
    const yeastCreate: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'create-alias-yeast', operation: 'create',
      entity: { kind: 'yeastStrain', value: { kind: 'yeast', name: 'Souche canonique', betaLyase: 'unknown', source: manufacturer } },
      claims: [], unmapped: [], projectionChoices: [] };
    const yeast = applied(applyBrewerCatalogueCommand(null, yeastCreate, execution('yeast-alias-id'))).record as HopYeast;
    const yeastAlias = claim('yeast-alias', 'identity.alias', 'Alias fabricant retenu', {
      scope: 'identity', normalized: { kind: 'text', value: 'Alias fabricant retenu' }
    });
    const yeastUpdate: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'enrich-alias-yeast', operation: 'enrich', target: target('yeastStrain', yeast.id),
      claims: [yeastAlias], unmapped: [], projectionChoices: [{ id: 'yeast-alias-projection', claimId: yeastAlias.id,
        targetField: 'identity.alias', mode: 'legacy', reason: 'Alias exact qualifié' }] };
    const yeastAfter = applied(applyBrewerCatalogueCommand(yeast, yeastUpdate, { currentFingerprint: 'a'.repeat(64), recordedAt: at })).record as HopYeast;
    expect(catalogueIdentityAliases(yeastAfter)).toEqual(['Alias fabricant retenu']);
    const yeastUnselected = { ...yeastAfter, catalogueMeta: { ...yeastAfter.catalogueMeta!, projections: [] } } as HopYeast;
    expect(catalogueIdentityAliases(yeastUnselected)).toEqual([]);
    expect(yeastSearchScore(yeastSearchIndex(yeastAfter), 'Alias fabricant retenu'))
      .toBeGreaterThan(yeastSearchScore(yeastSearchIndex(yeastUnselected), 'Alias fabricant retenu'));

    const hop = applied(applyBrewerCatalogueCommand(null, createHop('Variété canonique'), execution('hop-alias-id'))).record as HopVariety;
    const hopAlias = claim('hop-alias', 'identity.alias', 'Alias exact qualifié', {
      scope: 'identity', normalized: { kind: 'text', value: 'Alias exact qualifié' }
    });
    const hopAliasCommand: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'enrich-hop-alias', operation: 'enrich', target: target('hopVariety', hop.id),
      claims: [hopAlias], unmapped: [], projectionChoices: [{ id: 'hop-alias-projection', claimId: hopAlias.id,
        targetField: 'identity.alias', mode: 'legacy', reason: 'Alias source-confirmé' }] };
    const hopAfterAlias = applied(applyBrewerCatalogueCommand(hop, hopAliasCommand, { currentFingerprint: 'a'.repeat(64), recordedAt: at })).record as HopVariety;
    expect(hopAfterAlias.aliases).toContain('Alias exact qualifié');
    expect(brewerCatalogueIdentityKeys(hopAfterAlias)).toContain('hopVariety:alias exact qualifie');

    const hypothesisBase = applied(applyBrewerCatalogueCommand(null, createHop('Variété canonique'), execution('hop-alias-hypothesis'))).record as HopVariety;
    const unsupported = claim('hypothetical-alias', 'identity.alias', 'Alias encore hypothétique', {
      scope: 'identity', epistemic: 'hypothesis', normalized: { kind: 'text', value: 'Alias encore hypothétique' }, source: personal
    });
    const hypotheticalAliasKeys = brewerCatalogueIdentityKeys({ kind: 'hopVariety', value: { name: 'Variété canonique', aliases: [], form: 'unknown', descriptions: [], analysis: [] } },
      [unsupported], [{ id: 'hypothetical-alias-projection', claimId: unsupported.id, targetField: 'identity.alias', mode: 'legacy', reason: 'Hypothèse' }]);
    expect(hypotheticalAliasKeys).not.toContain('hopVariety:alias encore hypothetique');
    const forbidden: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'enrich-alias-hop', operation: 'enrich', target: target('hopVariety', hypothesisBase.id),
      claims: [unsupported], unmapped: [], projectionChoices: [{ id: 'hypothetical-alias-projection', claimId: unsupported.id,
        targetField: 'identity.alias', mode: 'legacy', reason: 'Ne pas promouvoir' }] };
    expect(applyBrewerCatalogueCommand(hypothesisBase, forbidden, { currentFingerprint: 'a'.repeat(64), recordedAt: at })).toMatchObject({ status: 'invalid' });
    expect(() => assertBrewerCatalogueMeta({ schemaVersion: 1, entityKind: 'hopVariety', revision: 2, claims: [unsupported], unmapped: [], corrections: [],
      identityResolutions: [], projections: [{ id: 'tampered-alias-projection', claimId: unsupported.id, targetField: 'identity.alias', mode: 'legacy',
        reason: 'Ne pas promouvoir', recordedAt: at }] }, 'hopVariety')).toThrow();
  });

  it('détecte une réécriture legacy par fingerprint même si la révision catalogue reste inchangée', () => {
    const base = applied(applyBrewerCatalogueCommand(null, createHop(), execution('hop-cas'))).record as HopVariety;
    const changedByOldWriter = { ...base, aliases: ['Alias écrit sans incrément de révision'] };
    const command: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'enrich-after-legacy-write', operation: 'enrich',
      target: target('hopVariety', base.id), claims: [], unmapped: [], projectionChoices: [] };
    expect(applyBrewerCatalogueCommand(changedByOldWriter, command, { currentFingerprint: 'b'.repeat(64), recordedAt: at }))
      .toMatchObject({ status: 'conflict' });
  });

  it('projette une forme HOP attestée à la référence et n’impose pas unknown comme plafond', () => {
    const base = applied(applyBrewerCatalogueCommand(null, createHop('Variété sourcée'), execution('hop-form'))).record as HopVariety;
    const form = claim('hop-form-claim', 'hop.form', 'Pellets T90', { scope: 'variety', source: manufacturer,
      normalized: { kind: 'category', value: 'pelletT90' } });
    const command: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'enrich-hop-form', operation: 'enrich', target: target('hopVariety', base.id),
      claims: [form], unmapped: [], projectionChoices: [{ id: 'project-hop-form', claimId: form.id, targetField: 'form', mode: 'legacy', reason: 'Forme de référence publiée' }] };
    const result = applied(applyBrewerCatalogueCommand(base, command, { currentFingerprint: 'a'.repeat(64), recordedAt: at }));
    expect((result.record as HopVariety).form).toBe('pelletT90');
    expect(result.record.catalogueMeta?.projections[0].claimId).toBe(form.id);
  });

  it('enrichit une variété avec une contradiction et une hypothèse sans modifier la mesure déjà consommée', () => {
    const base = applied(applyBrewerCatalogueCommand(null, createHop(), execution('hop-enrich'))).record as HopVariety;
    base.analysis = [{ analyte: 'alpha', unit: 'percentMass', basis: 'asIs', kind: 'point', value: 10, confidence: 'high', source: manufacturer }];
    const contradiction = claim('alpha-second-source', 'hop.alpha', '12 % massique', {
      epistemic: 'personalObservation',
      rawValue: { value: 12, unit: '% massique' }, normalized: { kind: 'point', value: 12, unit: 'percentMass', basis: 'asIs' }, source: personal, confidence: 'low'
    });
    const hypothesis = claim('alpha-hypothesis', 'hop.alpha', 'Scénario hypothétique à 13 %', {
      epistemic: 'hypothesis', rawValue: { value: 13, unit: '%' }, normalized: { kind: 'point', value: 13, unit: 'percentMass', basis: 'asIs' }, source: personal
    });
    const unmapped = { id: 'extra-unit-field', sourcePath: 'analysis.newCompound', rawValue: { value: 'texte source brut', unitLabel: 'unit de la source' },
      source: personal, recordedAt: at, reason: 'Unité sans convertisseur typé.' };
    const command: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'enrich-hop-one', operation: 'enrich', target: target('hopVariety', base.id),
      claims: [contradiction, hypothesis], unmapped: [unmapped], projectionChoices: [] };
    const result = applied(applyBrewerCatalogueCommand(base, command, { currentFingerprint: 'a'.repeat(64), recordedAt: at }));
    expect((result.record as HopVariety).analysis).toEqual(base.analysis);
    expect(result.record.catalogueMeta?.claims.map(row => row.id)).toEqual(['alpha-second-source', 'alpha-hypothesis']);
    expect(result.record.catalogueMeta?.claims.map(row => row.epistemic)).toEqual(['personalObservation', 'hypothesis']);
    expect(result.record.catalogueMeta?.unmapped).toContainEqual(unmapped);
  });

  it('projet un claim HOP choisi explicitement et conserve la mesure remplacée, mais refuse une hypothèse en champ legacy', () => {
    const base = applied(applyBrewerCatalogueCommand(null, createHop(), execution('hop-project'))).record as HopVariety;
    base.analysis = [{ analyte: 'alpha', unit: 'percentMass', basis: 'asIs', kind: 'point', value: 10, confidence: 'high', source: manufacturer }];
    const selected = claim('alpha-selected', 'hop.alpha', '12 % masse', {
      normalized: { kind: 'point', value: 12, unit: 'percentMass', basis: 'asIs' }, confidence: 'medium'
    });
    const command: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'enrich-hop-project', operation: 'enrich', target: target('hopVariety', base.id),
      claims: [selected], unmapped: [], projectionChoices: [{ id: 'projection-alpha-1', claimId: selected.id, targetField: 'analysis.alpha', mode: 'legacy', reason: 'Choix explicite de projection' }] };
    const result = applied(applyBrewerCatalogueCommand(base, command, { currentFingerprint: 'a'.repeat(64), recordedAt: at }));
    expect((result.record as HopVariety).analysis[0]).toMatchObject({ analyte: 'alpha', value: 12, source: manufacturer });
    expect(result.record.catalogueMeta?.projections[0]).toMatchObject({ claimId: selected.id, targetField: 'analysis.alpha', previousValue: base.analysis[0] });

    const hypothesis = claim('alpha-not-a-fact', 'hop.alpha', 'Hypothèse 14 %', {
      epistemic: 'hypothesis', normalized: { kind: 'point', value: 14, unit: 'percentMass', basis: 'asIs' }, confidence: 'low'
    });
    const bad: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'enrich-hop-project-bad', operation: 'enrich', target: target('hopVariety', base.id),
      claims: [hypothesis], unmapped: [], projectionChoices: [{ id: 'projection-hypothesis', claimId: hypothesis.id, targetField: 'analysis.alpha', mode: 'legacy', reason: 'Interdit' }] };
    expect(applyBrewerCatalogueCommand(base, bad, { currentFingerprint: 'a'.repeat(64), recordedAt: at })).toMatchObject({ status: 'invalid' });
  });

  it('garde une hypothèse choisie pour un scénario sans la promouvoir en analyse', () => {
    const base = applied(applyBrewerCatalogueCommand(null, createHop(), execution('hop-scenario'))).record as HopVariety;
    base.analysis = [{ analyte: 'alpha', unit: 'percentMass', basis: 'asIs', kind: 'point', value: 10, confidence: 'high', source: manufacturer }];
    const hypothesis = claim('alpha-scenario', 'hop.alpha', 'Hypothèse 14 %', {
      epistemic: 'hypothesis', normalized: { kind: 'point', value: 14, unit: 'percentMass', basis: 'asIs' }
    });
    const projected = projectBrewerCatalogueEntity({ ...base, catalogueMeta: { ...base.catalogueMeta!, revision: 2, claims: [hypothesis] } },
      [{ id: 'scenario-alpha', claimId: hypothesis.id, targetField: 'scenario.alpha', mode: 'scenario', reason: 'Scénario demandé' }], at);
    expect((projected.record as HopVariety).analysis[0].value).toBe(10);
    expect(projected.scenarioInputs.map(input => input.claim.id)).toEqual([hypothesis.id]);
  });

  it('crée et projette une souche sans confondre fait documentaire et sélection retenue', () => {
    const create: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'create-yeast', operation: 'create',
      entity: { kind: 'yeastStrain', value: { kind: 'yeast', name: 'Souche d’essai', betaLyase: 'unknown', source: manufacturer } },
      claims: [], unmapped: [], projectionChoices: [] };
    const yeast = applied(applyBrewerCatalogueCommand(null, create, execution('yeast-id'))).record as HopYeast;
    const fact = claim('yeast-temp', 'yeast.temperature', '18 à 22 °C', { scope: 'strain', normalized: { kind: 'range', min: 18, max: 22, unit: '°C' } });
    const lyase = claim('yeast-lyase', 'yeast.betaLyase', 'β-lyase positive', { scope: 'strain', normalized: { kind: 'category', value: 'positive' } });
    const enrich: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'enrich-yeast', operation: 'enrich', target: target('yeastStrain', yeast.id),
      claims: [fact, lyase], unmapped: [], projectionChoices: [
        { id: 'select-temp', claimId: fact.id, targetField: 'reviewedDocumentary.technicalSelections.temperature', mode: 'legacy', reason: 'Fenêtre explicitement retenue' },
        { id: 'select-lyase', claimId: lyase.id, targetField: 'betaLyase', mode: 'legacy', reason: 'État source explicitement retenu' }
      ] };
    const result = applied(applyBrewerCatalogueCommand(yeast, enrich, { currentFingerprint: 'a'.repeat(64), recordedAt: at })).record as HopYeast;
    expect(result.betaLyase).toBe('positive');
    expect(result.reviewedDocumentary?.technicalFacts?.[0]).toMatchObject({ key: 'temperature', range: { min: 18, max: 22 }, unit: '°C', origin: 'manufacturer' });
    expect(result.reviewedDocumentary?.technicalSelections?.temperature).toMatchObject({ key: 'temperature', range: { min: 18, max: 22 } });
    expect(result.catalogueMeta?.claims[0].source).toEqual(manufacturer);
  });

  it('crée un style personnel sans année/récupération fictives et garde résoluble son ancienne version', () => {
    const create: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'create-style', operation: 'create', entity: {
      kind: 'brewingStyle', value: { kind: 'styleGuide', name: 'Guide personnel', version: 'personal-v1', enabled: true, edition: 'Profil personnel',
        retrievedAt: null, createdAt: '2026-10-01', attribution: 'Déclaration du brasseur', source: personal,
        styles: [{ code: 'PERS', name: 'Style personnel', aliases: [], family: 'personnel', stats: {}, source: personal }] }
    }, claims: [], unmapped: [], projectionChoices: [] };
    const created = applied(applyBrewerCatalogueCommand(null, create, execution('style-guide-id', { allocatedStyleIds: ['style-row-id'] }))).record;
    expect('kind' in created ? created.kind : 'hopVariety').toBe('styleGuide');
    const guide = created as any;
    expect(guide.source.year).toBeNull();
    expect(guide.retrievedAt).toBeNull();
    const previousRef = { guideId: guide.id, version: guide.version, styleId: 'style-row-id' };
    const ibu = claim('style-ibu', 'style.style-row-id.stats.ibu', '20–30 IBU', { scope: 'style', source: manufacturer,
      normalized: { kind: 'range', min: 20, max: 30, unit: 'IBU' } });
    const styleAlias = claim('style-alias', 'style.style-row-id.identity.alias', 'Style personnel bis', { scope: 'style', source: personal,
      normalized: { kind: 'text', value: 'Style personnel bis' } });
    const update: BrewerCatalogueCommand = { schemaVersion: 1, operationId: 'enrich-style', operation: 'enrich',
      target: target('brewingStyle', guide.id, { styleId: 'style-row-id', nextVersion: 'personal-v2' }),
      claims: [ibu, styleAlias], unmapped: [], projectionChoices: [
        { id: 'style-ibu-projection', claimId: ibu.id, targetField: 'styles.style-row-id.stats.ibu', mode: 'legacy', reason: 'Plage explicitement qualifiée' },
        { id: 'style-alias-projection', claimId: styleAlias.id, targetField: 'styles.style-row-id.aliases', mode: 'legacy', reason: 'Alias personnel explicitement retenu' }
      ] };
    const updated = applied(applyBrewerCatalogueCommand(guide, update, { currentFingerprint: 'a'.repeat(64), recordedAt: at })).record;
    expect((updated as any).history[0].version).toBe('personal-v1');
    expect((updated as any).styles[0].stats.ibu).toEqual({ min: 20, max: 30 });
    expect((updated as any).styles[0].aliases).toEqual(['Style personnel bis']);
    const styles = brewingStyles([updated as any]);
    expect(resolveBrewingStyle('Style personnel', previousRef, styles)?.historical).toBe(true);
    expect(matchBrewingStyles('Style personnel', styles)).toHaveLength(1);
    expect(matchBrewingStyles('Style personnel bis', styles)).toHaveLength(1);

    const disabled = { ...(updated as any), enabled: false };
    expect(brewingStyleGuides([disabled]).some(row => row.id === disabled.id)).toBe(false);
    const readable = brewingStyles([disabled]);
    expect(readable.filter(row => row.ref.guideId === disabled.id).every(row => row.selectable === false)).toBe(true);
    expect(matchBrewingStyles('Style personnel bis', readable)).toEqual([]);
    expect(resolveBrewingStyle('Style personnel', previousRef, readable)?.historical).toBe(true);
    expect(resolveBrewingStyle('Style personnel bis', { guideId: disabled.id, version: disabled.version, styleId: 'style-row-id' }, readable)?.selectable).toBe(false);
  });
});
