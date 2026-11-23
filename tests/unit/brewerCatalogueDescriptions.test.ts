import { describe, expect, it } from 'vitest';
import type { HopDescription, HopSource, HopVariety } from '../../functions/src/hopIndexSchema';
import {
  applyBrewerCatalogueCommand, projectBrewerCatalogueEntity
} from '../../functions/src/brewerCatalogueCore';
import {
  assertBrewerCatalogueCommand, assertBrewerCatalogueMeta, describeBrewerCatalogueCommand,
  type BrewerCatalogueClaim, type BrewerCatalogueCommand, type BrewerCatalogueEpistemic,
  type BrewerCatalogueProjectionChoice
} from '../../functions/src/brewerCatalogueSchema';

const at = '2026-10-02T10:00:00.000Z';
const sourceA: HopSource = {
  title: 'Catalogue fictif A', author: 'Fabricant exemple', year: 2026,
  kind: 'manufacturer', reference: 'https://example.test/hop/a', locator: 'section sensorielle'
};
const sourceAReordered: HopSource = {
  locator: 'section sensorielle', reference: 'https://example.test/hop/a', kind: 'manufacturer',
  year: 2026, author: 'Fabricant exemple', title: 'Catalogue fictif A'
};
const sourceB: HopSource = {
  title: 'Étude fictive B', author: 'Chercheuse exemple', year: 2025,
  kind: 'research', reference: 'https://example.test/paper/b', locator: 'table 2'
};

function claim(id: string, options: Partial<BrewerCatalogueClaim> = {}): BrewerCatalogueClaim {
  return {
    id, scope: 'variety', property: 'hop.description', label: 'Description sensorielle',
    reported: 'Texte rapporté dans la source fictive.', normalized: { kind: 'text', value: '  Floral, agrumes  ' },
    epistemic: 'measured', source: sourceA,
    dates: { publishedAt: '2026-01-01', retrievedAt: '2026-09-20T09:00:00Z', observedAt: '2026-09-21', recordedAt: at },
    context: { sensoryContext: 'rawHop', conditions: { temperatureC: 20, method: 'Exemple fictif' } },
    ...options
  };
}

function createHop(descriptions: HopDescription[] = []): HopVariety {
  const command: BrewerCatalogueCommand = {
    schemaVersion: 1, operationId: 'create-description-fixture', operation: 'create',
    entity: { kind: 'hopVariety', value: { name: 'Variété fictive', aliases: [], form: 'unknown', descriptions, analysis: [] } },
    claims: [], unmapped: [], projectionChoices: []
  };
  const result = applyBrewerCatalogueCommand(null, command, {
    allocatedId: 'hop-description-fixture', identityCheckComplete: true, identityCandidates: [], recordedAt: at
  });
  if (result.status !== 'applied') throw new Error(`${result.status}: ${result.reason}`);
  return result.record as HopVariety;
}

function choice(id: string, claimId: string, options: Partial<BrewerCatalogueProjectionChoice> = {}): BrewerCatalogueProjectionChoice {
  return { id, claimId, targetField: 'hop.description', mode: 'legacy', reason: 'Description source conservée.', ...options };
}

function update(
  current: HopVariety,
  options: { claims?: BrewerCatalogueClaim[]; choices?: BrewerCatalogueProjectionChoice[]; operationId?: string } = {}
): HopVariety {
  const fingerprint = 'f'.repeat(64);
  const command: BrewerCatalogueCommand = {
    schemaVersion: 1, operationId: options.operationId ?? 'enrich-description-fixture', operation: 'enrich',
    target: { kind: 'hopVariety', id: current.id, expectedRevision: current.catalogueMeta?.revision ?? 0, expectedFingerprint: fingerprint },
    claims: options.claims ?? [], unmapped: [], projectionChoices: options.choices ?? []
  };
  const result = applyBrewerCatalogueCommand(current, command, { currentFingerprint: fingerprint, recordedAt: at });
  if (result.status !== 'applied') throw new Error(`${result.status}: ${result.reason}`);
  return result.record as HopVariety;
}

function badUpdate(current: HopVariety, selected: BrewerCatalogueClaim, selectedChoice = choice(`project-${selected.id}`, selected.id)) {
  const fingerprint = 'f'.repeat(64);
  const command: BrewerCatalogueCommand = {
    schemaVersion: 1, operationId: `bad-${selected.id}`, operation: 'enrich',
    target: { kind: 'hopVariety', id: current.id, expectedRevision: current.catalogueMeta?.revision ?? 0, expectedFingerprint: fingerprint },
    claims: [selected], unmapped: [], projectionChoices: [selectedChoice]
  };
  return applyBrewerCatalogueCommand(current, command, { currentFingerprint: fingerprint, recordedAt: at });
}

const sensoryContexts = ['rawHop', 'infusion', 'beer', 'unspecified'] as const;
const factualEpistemics: BrewerCatalogueEpistemic[] = ['measured', 'manufacturerClaim', 'researchClaim', 'personalObservation'];

describe('projection legacy des descriptions sensorielles HOP', () => {
  for (const sensoryContext of sensoryContexts) {
    for (const epistemic of factualEpistemics) {
      it(`projette exactement ${sensoryContext} depuis un claim ${epistemic}`, () => {
        const source = epistemic === 'researchClaim' ? sourceB : epistemic === 'personalObservation'
          ? { ...sourceA, title: 'Observation fictive', kind: 'observation' as const }
          : sourceA;
        const selected = claim(`${sensoryContext}-${epistemic}`, {
          epistemic, source,
          normalized: { kind: 'text', value: '\n  Floral, agrumes  \n' },
          context: { sensoryContext, conditions: { temperatureC: 20, panel: 'fictif' } }
        });
        const base = createHop();
        const before = structuredClone(base);
        const result = update(base, { claims: [selected], choices: [choice(`projection-${selected.id}`, selected.id)] });

        expect(result.descriptions).toEqual([{ text: '\n  Floral, agrumes  \n', context: sensoryContext, source }]);
        expect(result.descriptions[0].text).toBe(selected.normalized?.kind === 'text' ? selected.normalized.value : '');
        expect(result.descriptions[0].source).not.toBe(selected.source);
        expect(result.catalogueMeta?.claims).toEqual([selected]);
        expect(result.catalogueMeta?.claims[0]).toMatchObject({ reported: selected.reported, source: selected.source, dates: selected.dates, context: selected.context });
        expect(result.catalogueMeta?.projections).toHaveLength(1);
        expect(result.catalogueMeta?.projections[0]).not.toHaveProperty('supersedesProjectionId');
        expect(result.catalogueMeta?.projections[0]).not.toHaveProperty('previousValue');
        expect(result.catalogueMeta?.revision).toBe(2);
        expect(before).toEqual(base);
      });
    }
  }

  it('refuse scope, propriété, type normalisé ou sensoryContext incompatibles', () => {
    const base = createHop();
    const invalid = [
      claim('wrong-scope', { scope: 'lot' }),
      claim('wrong-property', { property: 'hop.flavour' }),
      claim('wrong-normalized-kind', { normalized: { kind: 'category', value: 'floral' } }),
      claim('missing-sensory-context', { context: { conditions: 'Exemple' } }),
      claim('unknown-sensory-context', { context: { sensoryContext: 'dryHop', conditions: 'Exemple' } }),
      claim('non-object-context', { context: ['rawHop'] })
    ];
    for (const selected of invalid) expect(badUpdate(base, selected)).toMatchObject({ status: 'invalid' });
  });

  it('refuse un ancien historique legacy hop.description incohérent lors de la lecture des métadonnées', () => {
    const malformed = claim('malformed-history', { context: { conditions: 'Sans matrice sensorielle explicite' } });
    const meta = {
      schemaVersion: 1, entityKind: 'hopVariety', revision: 2, claims: [malformed], unmapped: [], corrections: [], identityResolutions: [],
      projections: [{ id: 'malformed-history-projection', claimId: malformed.id, targetField: 'hop.description', mode: 'legacy',
        reason: 'Choix invalide', recordedAt: at }]
    };
    expect(() => assertBrewerCatalogueMeta(meta, 'hopVariety')).toThrow();
  });

  it('laisse les estimates, hypothèses et sorties modèle en scénario, y compris sans ancien contexte sensoriel', () => {
    const base = createHop();
    for (const epistemic of ['estimate', 'hypothesis', 'modelOutput'] as const) {
      const selected = claim(`scenario-${epistemic}`, {
        epistemic, scope: 'old-scope', property: 'legacy.description', normalized: undefined, context: undefined
      });
      const scenarioChoice = choice(`scenario-projection-${epistemic}`, selected.id, { mode: 'scenario' });
      const result = badUpdate(base, selected, scenarioChoice);
      expect(result).toMatchObject({ status: 'applied' });
      if (result.status !== 'applied') continue;
      expect((result.record as HopVariety).descriptions).toEqual([]);
      expect(result.projection.scenarioInputs).toHaveLength(1);
      expect(result.projection.scenarioInputs[0].claim).toEqual(selected);
    }
  });

  it('lit un ancien scénario hop.description sans contexte et applique sa supersession historique', () => {
    const oldScenario = claim('old-scenario', {
      scope: 'legacy-scope', property: 'legacy.description', epistemic: 'hypothesis',
      normalized: undefined, context: undefined
    });
    const first = update(createHop(), {
      claims: [oldScenario], choices: [choice('old-scenario-choice', oldScenario.id, { mode: 'scenario' })]
    });
    const replacement = claim('new-scenario', {
      scope: 'another-legacy-scope', property: 'old.property', epistemic: 'modelOutput',
      normalized: undefined, context: undefined
    });
    const result = update(first, {
      claims: [replacement], choices: [choice('new-scenario-choice', replacement.id, {
        mode: 'scenario', supersedesProjectionId: 'old-scenario-choice'
      })]
    });

    expect(result.descriptions).toEqual([]);
    expect(result.catalogueMeta?.projections).toHaveLength(2);
    expect(result.catalogueMeta?.projections[0].targetField).toBe('hop.description');
    expect(result.catalogueMeta?.projections[1]).toMatchObject({ mode: 'scenario', supersedesProjectionId: 'old-scenario-choice' });
    expect(() => assertBrewerCatalogueMeta(result.catalogueMeta, 'hopVariety')).not.toThrow();
    expect(result.catalogueMeta?.claims).toEqual([oldScenario, replacement]);
    expect(projectBrewerCatalogueEntity(result).scenarioInputs.map(input => input.claim.id)).toEqual(['new-scenario']);
  });

  it('déduplique le seul triple projeté malgré l’ordre des clés source et garde chaque claim/décision', () => {
    const firstClaim = claim('collected-first', {
      normalized: { kind: 'text', value: 'Florale' },
      context: { sensoryContext: 'rawHop', conditions: { panel: 'premier', temperatureC: 18 } },
      source: sourceA
    });
    const secondClaim = claim('collected-second', {
      reported: 'Même citation de catalogue, autre date de collecte.',
      normalized: { kind: 'text', value: 'Florale' },
      context: { sensoryContext: 'rawHop', conditions: { panel: 'second', temperatureC: 22 } },
      source: sourceAReordered,
      dates: { publishedAt: '2026-01-01', retrievedAt: '2026-09-28T09:00:00Z', observedAt: '2026-09-27', recordedAt: at }
    });
    let result = update(createHop(), { claims: [firstClaim] });
    expect(result.descriptions).toEqual([]);
    result = update(result, { claims: [secondClaim] });
    expect(result.descriptions).toEqual([]);
    expect(result.catalogueMeta?.claims).toEqual([firstClaim, secondClaim]);

    const choices = [choice('project-collected-first', firstClaim.id), choice('project-collected-second', secondClaim.id)];
    result = update(result, { choices, operationId: 'select-collected-descriptions' });
    expect(result.descriptions).toEqual([{ text: 'Florale', context: 'rawHop', source: sourceA }]);
    expect(result.catalogueMeta?.claims).toEqual([firstClaim, secondClaim]);
    expect(result.catalogueMeta?.projections).toHaveLength(2);
    expect(result.catalogueMeta?.projections.every(decision => decision.supersedesProjectionId === undefined)).toBe(true);
    expect(projectBrewerCatalogueEntity(result).activeLegacyClaims.map(row => row.claim.id)).toEqual(['collected-first', 'collected-second']);

    const retried = update(result, { choices, operationId: 'select-collected-descriptions' });
    expect(retried.descriptions).toEqual(result.descriptions);
    expect(retried.catalogueMeta?.projections).toHaveLength(2);
    expect(projectBrewerCatalogueEntity(retried).activeLegacyClaims).toHaveLength(2);
  });

  it('conserve les descriptions divergentes par texte, contexte sensoriel ou source', () => {
    const claims = [
      claim('variant-raw-hop', { normalized: { kind: 'text', value: 'Floral' }, context: { sensoryContext: 'rawHop' }, source: sourceA }),
      claim('variant-infusion', { normalized: { kind: 'text', value: 'Floral' }, context: { sensoryContext: 'infusion' }, source: sourceA }),
      claim('variant-source', { normalized: { kind: 'text', value: 'Floral' }, context: { sensoryContext: 'infusion' }, source: sourceB }),
      claim('variant-text', { normalized: { kind: 'text', value: 'Floral intense' }, context: { sensoryContext: 'infusion' }, source: sourceB })
    ];
    const result = update(createHop(), {
      claims, choices: claims.map(selected => choice(`projection-${selected.id}`, selected.id))
    });

    expect(result.descriptions).toHaveLength(4);
    expect(result.descriptions.map(({ text, context }) => [text, context])).toEqual([
      ['Floral', 'rawHop'], ['Floral', 'infusion'], ['Floral', 'infusion'], ['Floral intense', 'infusion']
    ]);
    expect(result.descriptions.map(description => description.source)).toEqual([sourceA, sourceA, sourceB, sourceB]);
    expect(projectBrewerCatalogueEntity(result).activeLegacyClaims.map(row => row.claim.id)).toEqual(claims.map(row => row.id));
  });

  it('refuse supersedes legacy, mais laisse inchangée une description directe de CREATE', () => {
    const direct: HopDescription = { text: 'Description directe conservée', context: 'beer', source: sourceA };
    expect(createHop([direct]).descriptions).toEqual([direct]);

    const selected = claim('append-only-claim');
    const invalid = badUpdate(createHop(), selected, choice('append-only-choice', selected.id, {
      supersedesProjectionId: 'previous-description-projection'
    }));
    expect(invalid).toMatchObject({ status: 'invalid' });
  });

  it('valide les examples fictifs et annonce les champs exacts du target hop.description', () => {
    const description = describeBrewerCatalogueCommand('hopVariety');
    expect(description.projectionTargets).toContain('hop.description');
    expect(description.rules.join(' ')).toContain('context.sensoryContext=rawHop|infusion|beer|unspecified');
    const enrich = description.examples.enrich as BrewerCatalogueCommand;
    expect(() => assertBrewerCatalogueCommand(enrich)).not.toThrow();
    expect(enrich.projectionChoices).toEqual([expect.objectContaining({
      targetField: 'hop.description', mode: 'legacy', claimId: 'example-hop-description-claim'
    })]);
    expect(enrich.claims[0]).toMatchObject({ scope: 'variety', property: 'hop.description', normalized: { kind: 'text' }, context: { sensoryContext: 'rawHop' } });
  });
});
