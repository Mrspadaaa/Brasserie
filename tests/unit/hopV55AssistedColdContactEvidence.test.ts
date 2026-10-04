import { describe, expect, it } from 'vitest';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { getColdHopBuCalibration, interpolateColdHopBuFromMass, interpolateColdHopBuReference } from '../../src/domain/hopDecision/coldIbuReference';
import { readAssistedColdContactEvidence } from '../../src/services/hopV55/assistedColdContactEvidence';

const coldTool = 'cold_contact_bitterness_reference';
const runColdTool = (doseGL: number) => runBrewerTool(
  coldTool,
  { doseGL },
  {} as Parameters<typeof runBrewerTool>[2],
);
const evidence = (data: unknown) => ({ id: 'E-cold-fixture', name: coldTool, data });

describe('lecture de preuve BU au contact froid', () => {
  it('lie au tour un vrai résultat runBrewerTool et restitue son snapshot après JSON', () => {
    const toolEvidence = runColdTool(3.86);
    const roundTrippedEvidence = JSON.parse(JSON.stringify({ ...toolEvidence, id: 'E-cold-fixture' }));

    const projected = readAssistedColdContactEvidence(roundTrippedEvidence);

    expect(projected).toMatchObject({ status: 'ready', evidenceId: 'E-cold-fixture' });
    if (projected.status !== 'ready') return;
    expect(projected.resultReference).toBe((toolEvidence.data as { reference: string }).reference);
    expect(projected.snapshot).toEqual(toolEvidence.data);
    expect(projected.snapshot.status).toBe('publishedObservation');
    expect(projected.snapshot.valueBU).toBe(21);
    expect(projected.snapshot.doseInput).toEqual({ value: 3.86, unit: 'g/L' });
    expect(projected.snapshot.doseEffectiveGPerHL).toBe(386);
    expect(projected.snapshot.controlBU).toBe(17);
    expect(projected.snapshot.contrastToControlBU).toBe(4);
    expect(projected.facts).toContain('Observation publiée : 21 BU spectrophotométriques.');
    expect(projected.facts.some((fact) => fact.includes('Tinseth'))).toBe(false);
    expect(projected.sources).toEqual([{ title: projected.snapshot.source.title, url: projected.snapshot.source.reference }]);
    expect(projected.limits).toContain('Le contraste au témoin ne s’ajoute pas automatiquement aux IBU calculés par Tinseth.');
  });

  it('refuse un snapshot froid modifié sans recalculer sa référence', () => {
    const toolEvidence = runColdTool(3.86);
    const mutated = JSON.parse(JSON.stringify(toolEvidence.data));
    mutated.reference = 'cold-result-forged';

    expect(readAssistedColdContactEvidence(evidence(mutated))).toMatchObject({ status: 'invalid', evidenceId: 'E-cold-fixture' });
  });

  it('garde une dose hors domaine comme preuve manquante, sans BU ni extrapolation', () => {
    const toolEvidence = runColdTool(16.0001);
    const projected = readAssistedColdContactEvidence({ ...toolEvidence, id: 'E-cold-outside' });

    expect(projected).toMatchObject({ status: 'missing', evidenceId: 'E-cold-outside', reason: 'outOfDomain' });
    if (projected.status !== 'missing') return;
    expect(projected.snapshot.status).toBe('outOfDomain');
    expect(projected.snapshot.valueBU).toBeNull();
    expect(projected.snapshot.contrastToControlBU).toBeNull();
    expect(projected.snapshot.domainGPerHL).toEqual({ min: 0, max: 1600 });
    expect(projected.facts).toContain('Aucun résultat BU disponible pour cette dose.');
    expect(projected.facts.some((fact) => /(?:résultat|observation|interpolation).*\d.*BU/i.test(fact))).toBe(false);
  });

  it('garde une dose inconnue inconnue au lieu de la convertir en zéro', () => {
    const unknownDose = interpolateColdHopBuReference({ dose: { value: null, unit: 'g/L' } });
    const projected = readAssistedColdContactEvidence(evidence(JSON.parse(JSON.stringify(unknownDose))));

    expect(projected).toMatchObject({ status: 'missing', reason: 'doseUnknown', resultReference: unknownDose.reference });
    if (projected.status !== 'missing') return;
    expect(projected.snapshot.doseInput.value).toBeNull();
    expect(projected.snapshot.doseEffectiveGPerHL).toBeNull();
    expect(projected.snapshot.valueBU).toBeNull();
    expect(projected.snapshot.nodesUsed).toEqual([]);
    expect(projected.facts).toContain('Dose du contact inconnue : aucune valeur BU n’est attribuée.');
  });

  it('utilise le rationnel exact pour refuser le domaine même si la dose affichée tombe sur la borne', () => {
    const exactOutOfDomain = interpolateColdHopBuFromMass({ massesGrams: [320, 1e-20], volumeL: 20 });
    expect(exactOutOfDomain.doseInput.value).toBe(16);
    expect(exactOutOfDomain.doseEffectiveGPerHL).toBe(1600);
    expect(exactOutOfDomain.status).toBe('outOfDomain');

    const projected = readAssistedColdContactEvidence(evidence(JSON.parse(JSON.stringify(exactOutOfDomain))));

    expect(projected).toMatchObject({ status: 'missing', reason: 'outOfDomain', resultReference: exactOutOfDomain.reference });
    if (projected.status !== 'missing') return;
    expect(projected.snapshot).toEqual(exactOutOfDomain);
    expect(projected.facts).toContain('La coordonnée exacte conservée dans la preuve gouverne le domaine; la dose affichée est arrondie.');
  });

  it('garde une coordonnée positive dont l’affichage est zéro comme interpolation, pas comme nœud zéro', () => {
    const tinyPositive = interpolateColdHopBuFromMass({ massesGrams: [Number.MIN_VALUE], volumeL: 1e9 });
    expect(tinyPositive.doseInput.value).toBe(0);
    expect(tinyPositive.doseEffectiveGPerHL).toBe(0);
    expect(BigInt(tinyPositive.doseExactGPerHL!.numerator)).toBeGreaterThan(0n);
    expect(tinyPositive.status).toBe('interpolation');

    const projected = readAssistedColdContactEvidence(evidence(JSON.parse(JSON.stringify(tinyPositive))));

    expect(projected).toMatchObject({ status: 'ready', resultReference: tinyPositive.reference });
    if (projected.status !== 'ready') return;
    expect(projected.snapshot).toEqual(tinyPositive);
    expect(projected.snapshot.status).toBe('interpolation');
    expect(projected.snapshot.nodesUsed[0].doseGPerHL).toBe(0);
    expect(projected.facts).toContain('La coordonnée exacte conservée dans la preuve gouverne le domaine; la dose affichée est arrondie.');
  });

  it('laisse opaque une future version froide et conserve son payload brut', () => {
    const future = { format: 'cold-hop-bu-reference-result-v2', version: 'hop-cold-bu-reference-v3', hidden: { value: 999 } };

    expect(readAssistedColdContactEvidence(evidence(future))).toEqual({
      status: 'unsupportedFormat', evidenceId: 'E-cold-fixture', format: future.format, version: future.version, raw: future,
    });
    expect(readAssistedColdContactEvidence(evidence({ format: 'cold-hop-bu-reference-result-v1', version: null })))
      .toMatchObject({ status: 'invalid', evidenceId: 'E-cold-fixture' });
  });

  it('signale explicitement un outil qui ne porte pas la référence froide', () => {
    expect(readAssistedColdContactEvidence({ id: 'E-other', name: 'lookup_hop_reference', data: {} }))
      .toEqual({ status: 'unsupportedTool', evidenceId: 'E-other', toolName: 'lookup_hop_reference' });
  });

  it('garde une référence textuelle sans la publier comme URL', () => {
    const calibration = getColdHopBuCalibration();
    calibration.source.reference = 'doi:10.1002/jib.517';
    const coldResult = interpolateColdHopBuReference({ calibration, dose: { value: 3.86, unit: 'g/L' } });

    const projected = readAssistedColdContactEvidence(evidence(coldResult));

    expect(projected).toMatchObject({ status: 'ready' });
    if (projected.status !== 'ready') return;
    expect(projected.sources).toEqual([]);
    expect(projected.facts).toContain('Référence de source : doi:10.1002/jib.517.');
  });
});
