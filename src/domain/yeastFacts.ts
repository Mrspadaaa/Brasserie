import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import { harvestedYeastTechnicalFact, readYeastDocumentarySheet, yeastTechnicalFactIdentity } from '../../functions/src/yeastDocumentarySheet';
import type { YeastCatalogueFact, YeastCatalogue } from '../../functions/src/yeastCatalogueSchema';
import type { HopSource } from '../../functions/src/hopIndexSchema';
import { readYeastTechnicalFacts, type YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';

/**
 * Faits techniques d'une levure (catalogue récolté + fiche documentaire revue). Ces fonctions ne lisent AUCUN fichier de données :
 * elles vivent ici, et non dans `yeastReferences.ts`, pour que l'accueil (qui les importe via yeastProjection) ne tire pas la
 * bibliothèque de levures de 1,4 Mo (voie l2, 10.11). `yeastReferences.ts` les ré-exporte : aucun importeur ne change.
 */
const rawFact = (fact: YeastCatalogueFact, catalogue: YeastCatalogue): YeastTechnicalFact => harvestedYeastTechnicalFact(fact, catalogue);
function catalogueFactFromTechnical(fact: YeastTechnicalFact): YeastCatalogueFact {
  const sourceUrl = fact.sourceUrl;
  let kind: YeastCatalogueFact['source']['kind'] = fact.origin === 'personal' ? 'observation' : 'review';
  if (fact.origin === 'manufacturer') kind = 'manufacturer';
  const year = fact.retrievedAt ? new Date(fact.retrievedAt).getUTCFullYear() : null;
  return {
    key: fact.key, label: fact.key, reported: fact.reported,
    source: { title: fact.source ?? 'Source consultée', author: fact.source ?? 'Source consultée', year: Number.isFinite(year) ? year : null,
      kind, reference: sourceUrl ?? fact.source ?? 'Source à préciser' },
    ...(fact.range ? { range: { ...fact.range }, unit: fact.unit as YeastCatalogueFact['unit'], qualifier: fact.qualifier } : {}),
    ...(fact.context ? { context: fact.context } : {})
  };
}
/** Keep the collected catalogue intact and overlay only the facts explicitly
 * superseded by a reviewed correction. Unrelated and conflicting observations remain visible. */
export function effectiveYeastTechnicalFacts(reference: HopYeast): YeastTechnicalFact[] {
  const catalogue = reference.catalogue;
  const harvested = catalogue?.facts.map(fact => rawFact(fact, catalogue)) ?? [];
  const sheet = readYeastDocumentarySheet(reference.reviewedDocumentary, reference.id);
  const replacements = reference.reviewedDocumentaryRevision?.replacements ?? [];
  const superseded = new Set(replacements.map(pair => pair.before));
  const overlay = sheet?.technicalFacts ?? [];
  const effective = [
    ...harvested.filter(fact => !superseded.has(yeastTechnicalFactIdentity(fact))),
    ...overlay
  ];
  return readYeastTechnicalFacts(effective) ?? [];
}
/** Keep the complete citation object for harvested facts while synthesizing a
 * conservative source label for a reviewed AI/personal replacement. */
export function effectiveYeastTechnicalFactSources(reference: HopYeast): Map<string, HopSource[]> {
  const catalogue = reference.catalogue;
  const replacements = new Set((reference.reviewedDocumentaryRevision?.replacements ?? []).map(pair => pair.before));
  const sources = new Map<string, HopSource[]>();
  const normalized = (fact: YeastTechnicalFact) => readYeastTechnicalFacts([fact])?.[0];
  for (const fact of catalogue?.facts ?? []) {
    const technical = normalized(rawFact(fact, catalogue!));
    if (!technical) continue;
    const identity = yeastTechnicalFactIdentity(technical);
    if (!replacements.has(identity)) sources.set(identity, [fact.source]);
  }
  const sheet = readYeastDocumentarySheet(reference.reviewedDocumentary, reference.id);
  for (const fact of sheet?.technicalFacts ?? []) {
    const technical = normalized(fact);
    if (!technical || !technical.source && !technical.sourceUrl) continue;
    const identity = yeastTechnicalFactIdentity(technical);
    const year = technical.retrievedAt ? new Date(technical.retrievedAt).getUTCFullYear() : null;
    sources.set(identity, [{
      author: technical.origin === 'manufacturer' ? 'Fiche fabricant' : technical.origin === 'ai' ? 'Source proposée' : 'Fiche personnelle',
      title: technical.source ?? technical.reported,
      reference: technical.sourceUrl ?? technical.source!,
      kind: technical.origin === 'manufacturer' ? 'manufacturer' : 'observation',
      year: Number.isFinite(year) ? year : null
    }]);
  }
  return sources;
}
export function effectiveYeastCatalogueFacts(reference: HopYeast): YeastCatalogueFact[] {
  const catalogue = reference.catalogue;
  const sheet = readYeastDocumentarySheet(reference.reviewedDocumentary, reference.id);
  const superseded = new Set((reference.reviewedDocumentaryRevision?.replacements ?? []).map(pair => pair.before));
  return [
    ...(catalogue?.facts.filter(fact => !superseded.has(yeastTechnicalFactIdentity(rawFact(fact, catalogue)))) ?? []),
    ...(sheet?.technicalFacts ?? []).map(catalogueFactFromTechnical)
  ];
}
/** Original harvested fact and its effective reviewed replacement, for provenance display. */
export function reviewedYeastReplacements(reference: HopYeast): Array<{ before: YeastCatalogueFact; after: YeastCatalogueFact }> {
  const catalogue = reference.catalogue;
  const sheet = readYeastDocumentarySheet(reference.reviewedDocumentary, reference.id);
  if (!catalogue || !sheet) return [];
  const before = new Map(catalogue.facts.map(fact => {
    const technical = rawFact(fact, catalogue);
    return [yeastTechnicalFactIdentity(technical), fact] as const;
  }));
  const after = new Map((sheet.technicalFacts ?? []).map(fact => [yeastTechnicalFactIdentity(fact), catalogueFactFromTechnical(fact)] as const));
  return (reference.reviewedDocumentaryRevision?.replacements ?? []).flatMap(pair => {
    const oldFact = before.get(pair.before), newFact = after.get(pair.after);
    return oldFact && newFact ? [{ before: oldFact, after: newFact }] : [];
  });
}
