import { describe, expect, it } from 'vitest';
import type { HopMeasurement, HopSource } from '../../functions/src/hopIndexSchema';
import {
  assessHopBiotransformation,
  type HopBiotransformationInput,
  type HopMechanismFinding,
  type HopMechanismId,
} from '../../src/domain/hopDecision/biotransformation';

const source: HopSource = {
  title: 'Fixture thiol test', author: 'Équipe de test', year: 2026,
  kind: 'research', reference: 'https://example.test/thiols',
};

function measurement(analyte: HopMeasurement['analyte'], value: number): HopMeasurement {
  return {
    analyte, unit: 'ugKgThiolEquivalent', basis: 'asIs', kind: 'point', value,
    source, confidence: 'high', method: 'fixture de test',
  };
}

function finding(result: ReturnType<typeof assessHopBiotransformation>, id: HopMechanismId): HopMechanismFinding {
  const item = result.findings.find(candidate => candidate.id === id);
  if (!item) throw new Error(`Mécanisme absent : ${id}`);
  return item;
}

const documentedContext = {
  hopMeasurements: [measurement('3mhCys', 12)],
  yeast: { betaLyase: 'positive' as const, source },
  fermentation: { state: 'active' as const, temperatureC: 20 },
  additions: [{ kind: 'whirlpool' as const, state: 'completed' as const, contactHours: 0.5, temperatureC: 80 }],
} satisfies HopBiotransformationInput;

describe('Évaluation mécanistique de la biotransformation du houblon', () => {
  it('reste utile sans fiche, souche, recette ni cible aromatique', () => {
    const result = assessHopBiotransformation();
    expect(result.schemaVersion).toBe('hop-biotransformation-v1');
    expect(result.findings.map(item => item.id)).toEqual([
      'thiolRelease', 'geraniolToCitronellol', 'fermentationAroma', 'hopCreep',
    ]);
    expect(result.findings.map(item => item.status)).toEqual(['unknown', 'unknown', 'unknown', 'unknown']);
    expect(result.comparisonPlan.question).toContain('quels changements mesurés');
    expect(result.findings[0].reasons.join(' ')).toContain('aucune mesure fournie ; cela signifie inconnu, pas zéro');
  });

  it('ne convertit pas une activité β-lyase documentée en rendement ou prédiction sensorielle', () => {
    const result = assessHopBiotransformation(documentedContext);
    const thiols = finding(result, 'thiolRelease');
    expect(thiols.status).toBe('contextuallyRelevant');
    expect(thiols.yeastBetaLyaseActivity).toBe('positive');
    expect(thiols.statusMeaning).toContain('ne confirme ni rendement');
    expect(thiols.statement).toContain('ne fournit pas un taux de conversion');
    expect(thiols).not.toHaveProperty('yield');
    expect(thiols).not.toHaveProperty('score');
    expect(thiols).not.toHaveProperty('sensoryIntensity');
    expect(thiols.statusMeaning).toContain('concentration finale');
  });

  it('garde inconnue, négative et positive comme états documentaires distincts', () => {
    const unknown = finding(assessHopBiotransformation({
      ...documentedContext, yeast: { ...documentedContext.yeast, betaLyase: 'unknown' },
    }), 'thiolRelease');
    const negative = finding(assessHopBiotransformation({
      ...documentedContext, yeast: { ...documentedContext.yeast, betaLyase: 'negative' },
    }), 'thiolRelease');
    const positive = finding(assessHopBiotransformation(documentedContext), 'thiolRelease');
    expect([unknown.yeastBetaLyaseActivity, negative.yeastBetaLyaseActivity, positive.yeastBetaLyaseActivity])
      .toEqual(['unknown', 'negative', 'positive']);
    expect(unknown.reasons.join(' ')).toContain('inconnue');
    expect(negative.reasons.join(' ')).toContain('négative');
    expect(unknown.reasons).not.toEqual(negative.reasons);
    expect(unknown.status).not.toBe('notCurrentlyActive');
    expect(negative.unknownsThatCouldChangeDecision.join(' ')).toContain('n’exclut pas toutes les voies');
  });

  it('ne transforme pas une non-détection sous limite en précurseur absent', () => {
    const censored: HopMeasurement = {
      ...measurement('3mhCys', 0), kind: 'below', value: undefined, limit: 0.4, limitKind: 'loq',
    };
    const result = assessHopBiotransformation({
      ...documentedContext, hopMeasurements: [censored],
    });
    const thiols = finding(result, 'thiolRelease');
    expect(thiols.reasons.join(' ')).toContain('sous 0.4 (loq) ; non-détection non assimilée à une absence');
    expect(thiols.reasons.join(' ')).not.toContain('précurseur absent');
    expect(thiols.status).toBe('conditional');
  });

  it('compare les mesures de précurseurs analyte par analyte et par portée compatible', () => {
    const context = { ...documentedContext, hopMeasurements: [
      measurement('3mhCys', 24), measurement('4mmpCys', 0),
    ] };
    const distinctCompounds = finding(assessHopBiotransformation(context), 'thiolRelease');
    const oneCompound = finding(assessHopBiotransformation({
      ...documentedContext, hopMeasurements: [measurement('3mhCys', 24)],
    }), 'thiolRelease');
    expect(distinctCompounds.status).toBe(oneCompound.status);
    expect(distinctCompounds.status).toBe('contextuallyRelevant');
    expect(distinctCompounds.reasons.join(' ')).toContain('3mhCys');
    expect(distinctCompounds.reasons.join(' ')).toContain('4mmpCys');
    expect(distinctCompounds.reasons.join(' ')).not.toContain('rapports fournis ne concordent pas');

    const sameAnalyteConflict = finding(assessHopBiotransformation({
      ...documentedContext, hopMeasurements: [measurement('3mhCys', 24), measurement('3mhCys', 0)],
    }), 'thiolRelease');
    expect(sameAnalyteConflict.status).toBe('conditional');
    expect(sameAnalyteConflict.reasons.join(' ')).toContain('3mhCys');
    expect(sameAnalyteConflict.reasons.join(' ')).toContain('même analyte');

    const otherMethodAndBasis: HopMeasurement = {
      ...measurement('3mhCys', 0), basis: 'dryMatter', method: 'seconde méthode',
    };
    const incomparableReports = finding(assessHopBiotransformation({
      ...documentedContext, hopMeasurements: [measurement('3mhCys', 24), otherMethodAndBasis],
    }), 'thiolRelease');
    expect(incomparableReports.status).toBe('contextuallyRelevant');
    expect(incomparableReports.reasons.join(' ')).toContain('avec unités, bases ou méthodes différentes');
  });

  it.each([
    ['NaN', { ...measurement('3mhCys', Number.NaN) }],
    ['unité/base incompatibles', { ...measurement('3mhCys', 24), unit: 'ngL' as const }],
    ['point sans valeur', { ...measurement('3mhCys', 24), value: undefined }],
    ['plage inversée', { ...measurement('3mhCys', 24), kind: 'range' as const, value: undefined, range: { min: 3, max: 2 } }],
  ])('refuse une mesure invalide au lieu de la traiter comme zéro (%s)', (_label, invalidMeasurement) => {
    const result = assessHopBiotransformation({
      ...documentedContext, hopMeasurements: [invalidMeasurement as HopMeasurement],
    });
    const thiols = finding(result, 'thiolRelease');
    expect(thiols.status).not.toBe('contextuallyRelevant');
    expect(thiols.reasons.join(' ')).toContain('mesure invalide pour le schéma');
    expect(thiols.reasons.join(' ')).not.toContain('rapportée à zéro');
  });

  it('ne demande pas de dry-hop pour étudier une biotransformation pendant la fermentation', () => {
    const withoutDryHop = assessHopBiotransformation({
      ...documentedContext,
      additions: [
        { kind: 'boil', state: 'completed' },
        { kind: 'whirlpool', state: 'completed' },
      ],
    });
    const thiols = finding(withoutDryHop, 'thiolRelease');
    expect(thiols.status).toBe('contextuallyRelevant');
    expect(thiols.conditions.join(' ')).toContain('Le dry-hop n’est pas une condition nécessaire');
    expect(thiols.evidence.some(item => item.id === 'samia-2024-thiol-fermentation')).toBe(true);
  });

  it('sépare absence de levure viable, transformations déjà formées et hop creep', () => {
    const result = assessHopBiotransformation({
      ...documentedContext,
      fermentation: { state: 'noViableYeast' },
      additions: [{ kind: 'dryHop', state: 'completed' }],
      fermentableDextrins: 'documented',
    });
    expect(finding(result, 'thiolRelease').status).toBe('notCurrentlyActive');
    expect(finding(result, 'geraniolToCitronellol').status).toBe('notCurrentlyActive');
    expect(finding(result, 'fermentationAroma').status).toBe('unknown');
    expect(finding(result, 'hopCreep').refermentationContext).toBe('notCurrentWithoutViableYeast');
    expect(finding(result, 'hopCreep').statement).toContain('distinct d’une transformation aromatique');
    expect(finding(result, 'thiolRelease').statusMeaning).toContain('composés déjà formés');
  });

  it('qualifie le hop creep par contact, activité du houblon, substrat et levure', () => {
    const result = assessHopBiotransformation({
      ...documentedContext,
      additions: [{ kind: 'dryHop', state: 'planned', contactHours: 36, temperatureC: 18 }],
      hopDextrinEnzymeActivity: 'positive',
      fermentableDextrins: 'documented',
    });
    const creep = finding(result, 'hopCreep');
    expect(creep.status).toBe('contextuallyRelevant');
    expect(creep.refermentationContext).toBe('possibleInThisContext');
    expect(creep.statement).toContain('distinct d’une transformation aromatique');
    expect(creep.unknownsThatCouldChangeDecision.join(' ')).toContain('aucun délai de stabilisation');
    expect(creep.reasons.join(' ')).toContain('36 h');
    expect(creep.reasons.join(' ')).toContain('sans seuil de conversion');
  });

  it('garde conditionnel un dry-hop dont l’état prévu/réalisé est inconnu', () => {
    const result = assessHopBiotransformation({
      ...documentedContext,
      additions: [{ kind: 'dryHop', state: 'unknown' }],
      hopDextrinEnzymeActivity: 'positive',
      fermentableDextrins: 'documented',
    });
    const creep = finding(result, 'hopCreep');
    expect(creep.status).toBe('conditional');
    expect(creep.refermentationContext).toBe('unknown');
    expect(creep.reasons.join(' ')).toContain('état prévu/réalisé reste inconnu');
  });

  it.each(['fermentation', 'postFermentation'] as const)('reconnaît un ajout de houblon en phase froide pour le hop creep (%s)', kind => {
    const result = assessHopBiotransformation({
      ...documentedContext,
      additions: [{ kind, state: 'completed', contactHours: 48, temperatureC: 20 }],
      hopDextrinEnzymeActivity: 'positive',
      fermentableDextrins: 'documented',
    });
    const creep = finding(result, 'hopCreep');
    expect(creep.status).not.toBe('unknown');
    expect(creep.refermentationContext).toBe('possibleInThisContext');
    expect(creep.reasons.join(' ')).toContain(`Ajout 1 (${kind})`);
    expect(creep.reasons.join(' ')).not.toContain('Aucun dry-hop ne figure');
    expect(creep.unknownsThatCouldChangeDecision.join(' ')).toContain('n’est pas un dry-hop explicite');
  });

  it('un stade conditionné ne propose pas de conduite ni de réécriture du brassin', () => {
    const result = assessHopBiotransformation({ ...documentedContext, stage: 'packaged' });
    expect(result.comparisonPlan.scope).toBe('existingSamplesOrFutureTrial');
    expect(result.comparisonPlan.limit).toContain('ne propose aucune conduite de ce lot');
    expect(result.limits.join(' ')).toContain('ne sont ni réécrites ni modifiées');
    expect(result).not.toHaveProperty('operationsToApply');
    expect(result).not.toHaveProperty('mutations');
  });

  it('ne branche pas le mécanisme sur le nom affiché lorsque les propriétés restent identiques', () => {
    const first = assessHopBiotransformation({ ...documentedContext, subjectLabel: 'Nom A' });
    const second = assessHopBiotransformation({ ...documentedContext, subjectLabel: 'Nom B' });
    expect(first.subjectLabel).toBe('Nom A');
    expect(second.subjectLabel).toBe('Nom B');
    expect(first.findings).toEqual(second.findings);
    expect(first.comparisonPlan).toEqual(second.comparisonPlan);
  });
});
