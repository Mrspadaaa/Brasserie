import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { assertBrewerCatalogueCommand, readBrewerCatalogueHopDescriptionClaim, type BrewerCatalogueCommand } from '../../functions/src/brewerCatalogueSchema';
import type { BrewerCatalogueLookupRecord } from '../../functions/src/brewerCatalogueStore';
import type { HopSource, HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import type { BrewingStyleGuide } from '../../functions/src/brewingStyleSchema';
import type { HopV55Services } from '../../src/services/hopV55/contracts';
import { HopV55Catalogue } from '../../src/ui/hopV55/Catalogue';

afterEach(cleanup);

const currentDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const source: HopSource = { title: 'Donnée source de test', author: 'Brasseur de test', year: null, kind: 'manufacturer', reference: 'fixture://catalogue/source-1' };
const existingClaim = {
  id: 'claim-old', scope: 'variety', property: 'hop.alpha', label: 'Acides alpha', reported: '5 %',
  normalized: { kind: 'point' as const, value: 5, unit: 'percentMass' }, epistemic: 'manufacturerClaim' as const,
  source, dates: { recordedAt: '2026-09-01T10:00:00.000Z' }
};
const makeHop = (id = 'cascade-id', claims = [existingClaim], revision = 4): BrewerCatalogueLookupRecord => ({
  kind: 'hopVariety', id, record: {
    id, name: 'Cascade de test', aliases: [], form: 'unknown', descriptions: [], analysis: [],
    catalogueMeta: { schemaVersion: 1, entityKind: 'hopVariety', revision, fingerprint: 'b'.repeat(64), claims, unmapped: [], projections: [], corrections: [], identityResolutions: [] }
  } as HopVariety,
  revision, fingerprint: 'b'.repeat(64), origin: 'persisted'
});

function serviceHarness(overrides: {
  lookup?: ReturnType<typeof vi.fn>;
  write?: ReturnType<typeof vi.fn>;
} = {}) {
  const lookup = overrides.lookup ?? vi.fn(async () => ({ records: [], truncated: false }));
  const write = overrides.write ?? vi.fn();
  const services = {
    scope: 'fixture', ownerKey: 'fixture-owner',
    catalogue: { scope: 'fixture', lookup, write },
    scenarios: {}, workspaces: {}, loadContext: vi.fn(), close: vi.fn()
  } as unknown as HopV55Services;
  return { services, lookup, write };
}

const searchFor = async (text: string) => {
  fireEvent.change(screen.getByLabelText(/Rechercher/), { target: { value: text } });
  await waitFor(() => expect(screen.getByText(/résultat\(s\)/)).toBeInTheDocument());
};

function openAdvancedClaim() {
  const summary = screen.getByText('Saisie avancée · portée, propriété et champs ouverts');
  const details = summary.closest('details');
  if (details && !details.open) fireEvent.click(summary);
  fireEvent.click(screen.getByRole('radio', { name: /Conserver comme donnée de scénario/ }));
}

function fillSharedSource() {
  fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'COA lot fictif' } });
  fireEvent.change(screen.getByLabelText('Auteur'), { target: { value: 'Laboratoire exemple' } });
  fireEvent.change(screen.getByLabelText('Nature'), { target: { value: 'manufacturer' } });
  fireEvent.change(screen.getByLabelText('Référence'), { target: { value: 'fixture://coa/lot-1' } });
}

function fillRangeClaim(property = 'hop.alpha', reported = '6–8 %') {
  openAdvancedClaim();
  fireEvent.change(screen.getByLabelText('Portée'), { target: { value: 'variety' } });
  fireEvent.change(screen.getByLabelText('Propriété'), { target: { value: property } });
  fireEvent.change(screen.getByLabelText('Valeur rapportée'), { target: { value: reported } });
  fireEvent.change(screen.getByLabelText('Nature de la donnée'), { target: { value: 'manufacturerClaim' } });
  fireEvent.change(screen.getByLabelText('Valeur structurée'), { target: { value: 'range' } });
  fireEvent.change(screen.getByLabelText('Minimum'), { target: { value: '6' } });
  fireEvent.change(screen.getByLabelText('Maximum'), { target: { value: '8' } });
  fireEvent.change(screen.getByLabelText('Unité'), { target: { value: 'percentMass' } });
}

describe('Catalogue de la tranche V5.5', () => {
  it('recherche chacun des trois types via le client injecté', async () => {
    const lookup = vi.fn(async () => ({ records: [], truncated: false }));
    const { services } = serviceHarness({ lookup });
    render(<HopV55Catalogue services={services} />);
    await searchFor('Cascade');
    await waitFor(() => expect(lookup).toHaveBeenCalledWith('hopVariety', 'Cascade'));

    fireEvent.click(screen.getByRole('tab', { name: 'Levures' }));
    await searchFor('Saison sèche');
    await waitFor(() => expect(lookup).toHaveBeenCalledWith('yeastStrain', 'Saison sèche'));

    fireEvent.click(screen.getByRole('tab', { name: 'Styles' }));
    await searchFor('Style local');
    await waitFor(() => expect(lookup).toHaveBeenCalledWith('brewingStyle', 'Style local'));
  });

  it('crée une variété absente sans inventer analyse ou alias, puis relit le record canonique', async () => {
    const canonical = makeHop('provider-created', [], 1);
    const lookup = vi.fn(async () => ({ records: [], truncated: false }));
    const write = vi.fn(async () => ({ status: 'applied', kind: 'hopVariety', id: canonical.id, record: canonical.record,
      revision: canonical.revision, fingerprint: canonical.fingerprint, receipt: {} as never, scope: 'fixture' as const }));
    const onCanonicalRecord = vi.fn();
    const { services } = serviceHarness({ lookup, write });
    render(<HopV55Catalogue services={services} onCanonicalRecord={onCanonicalRecord} />);
    await searchFor('Cascade de test');
    fireEvent.click(screen.getByRole('button', { name: 'Créer une fiche absente' }));
    expect(screen.getByLabelText('Nom de la fiche')).toHaveValue('Cascade de test');
    fireEvent.click(screen.getByRole('button', { name: 'Créer la fiche' }));

    await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    const command = write.mock.calls[0][0] as BrewerCatalogueCommand;
    assertBrewerCatalogueCommand(command);
    expect(command.operation).toBe('create');
    if (command.operation !== 'create') throw new Error('Création attendue.');
    expect(command.entity.kind).toBe('hopVariety');
    expect('id' in command.entity.value).toBe(false);
    expect(command.entity.value).toEqual(expect.objectContaining({ form: 'unknown', aliases: [], analysis: [], descriptions: [] }));
    expect(command.claims).toEqual([]);
    expect(command.projectionChoices).toEqual([]);
    await waitFor(() => expect(onCanonicalRecord).toHaveBeenCalledWith(expect.objectContaining({ id: canonical.id, record: canonical.record })));
    expect(lookup).toHaveBeenCalledWith('hopVariety', 'Cascade de test');
    expect(screen.getByRole('status')).toHaveTextContent('catalogue fixture');
  });

  it('conserve une valeur hors schéma avec son chemin JSON et sa source exacte sous les détails avancés', async () => {
    const canonical = makeHop('raw-value-record', [], 1);
    const write = vi.fn()
      .mockImplementationOnce(async (command: BrewerCatalogueCommand) => {
        assertBrewerCatalogueCommand(command);
        return { status: 'conflict' as const, reason: 'Écriture interrompue; reprendre la même commande.' };
      })
      .mockImplementationOnce(async (command: BrewerCatalogueCommand) => {
        assertBrewerCatalogueCommand(command);
        return { status: 'applied' as const, kind: 'hopVariety' as const, id: canonical.id, record: canonical.record, revision: 1,
          fingerprint: canonical.fingerprint, receipt: {} as never, scope: 'fixture' as const };
      });
    const { services } = serviceHarness({ lookup: vi.fn(async () => ({ records: [], truncated: false })), write });
    render(<HopV55Catalogue services={services} />);
    await searchFor('Variété à documenter');
    fireEvent.click(screen.getByRole('button', { name: 'Créer une fiche absente' }));
    fireEvent.click(screen.getByText('Conserver des valeurs sources hors du schéma courant'));
    fireEvent.change(screen.getByLabelText('Chemin dans la source'), { target: { value: 'analysis.precursor.unspecified' } });
    fireEvent.change(screen.getByLabelText('Valeur brute en JSON'), { target: { value: '{"value":"6-8","unit":"unknown"}' } });
    fireEvent.change(screen.getByLabelText('Pourquoi la conserver sans correspondance ?'), { target: { value: 'Unité non établie dans le document.' } });
    fireEvent.click(screen.getByLabelText('Ajouter la source exacte'));
    fillSharedSource();
    fireEvent.click(screen.getByRole('button', { name: 'Créer la fiche' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('reprendre la même commande'));
    fireEvent.click(screen.getByRole('button', { name: 'Créer la fiche' }));
    await waitFor(() => expect(write).toHaveBeenCalledTimes(2));
    const firstCommand = write.mock.calls[0][0] as BrewerCatalogueCommand;
    const command = write.mock.calls[1][0] as BrewerCatalogueCommand;
    assertBrewerCatalogueCommand(command);
    assertBrewerCatalogueCommand(firstCommand);
    expect(command.operation).toBe('create');
    if (command.operation !== 'create') throw new Error('Création attendue.');
    if (firstCommand.operation !== 'create') throw new Error('Reprise de création attendue.');
    expect(command.operationId).toBe(firstCommand.operationId);
    expect(command.unmapped[0].id).toBe(firstCommand.unmapped[0].id);
    expect(command.claims).toEqual([]);
    expect(command.unmapped).toHaveLength(1);
    expect(command.unmapped[0]).toEqual(expect.objectContaining({ sourcePath: 'analysis.precursor.unspecified',
      rawValue: { value: '6-8', unit: 'unknown' }, reason: 'Unité non établie dans le document.', source: expect.objectContaining({ reference: 'fixture://coa/lot-1' }) }));
  });

  it('crée une souche et un style avec leurs minima métier, source commune et plages laissées inconnues', async () => {
    const formSource: HopSource = { title: 'COA lot fictif', author: 'Laboratoire exemple', year: null, kind: 'manufacturer', reference: 'fixture://coa/lot-1' };
    const yeastRecord = { id: 'yeast-created', kind: 'yeast', name: 'Souche de test', betaLyase: 'unknown', source,
      catalogueMeta: { schemaVersion: 1, entityKind: 'yeastStrain', revision: 1, fingerprint: 'd'.repeat(64), claims: [], unmapped: [], projections: [], corrections: [], identityResolutions: [] } } as HopYeast;
    const yeastWrite = vi.fn(async (command: BrewerCatalogueCommand) => {
      assertBrewerCatalogueCommand(command);
      return { status: 'applied' as const, kind: 'yeastStrain' as const, id: yeastRecord.id, record: yeastRecord, revision: 1,
        fingerprint: 'd'.repeat(64), receipt: {} as never, scope: 'fixture' as const };
    });
    const yeastServices = serviceHarness({ lookup: vi.fn(async () => ({ records: [], truncated: false })), write: yeastWrite }).services;
    const { unmount } = render(<HopV55Catalogue services={yeastServices} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Levures' }));
    await searchFor('Souche de test');
    fireEvent.click(screen.getByRole('button', { name: 'Créer une fiche absente' }));
    fireEvent.click(screen.getByLabelText('Ajouter une première donnée sourcée'));
    openAdvancedClaim();
    fireEvent.change(screen.getByLabelText('Portée'), { target: { value: 'strain' } });
    fireEvent.change(screen.getByLabelText('Propriété'), { target: { value: 'yeast.process.openNote' } });
    fireEvent.change(screen.getByLabelText('Valeur rapportée'), { target: { value: 'Observation textuelle de test' } });
    fireEvent.change(screen.getByLabelText('Nature de la donnée'), { target: { value: 'personalObservation' } });
    fireEvent.change(screen.getByLabelText('Valeur structurée'), { target: { value: 'text' } });
    fireEvent.change(screen.getByLabelText('Valeur normalisée'), { target: { value: 'Observation textuelle de test' } });
    fillSharedSource();
    fireEvent.click(screen.getByRole('button', { name: 'Créer la fiche' }));
    await waitFor(() => expect(yeastWrite).toHaveBeenCalledTimes(1));
    const yeastCommand = yeastWrite.mock.calls[0][0];
    expect(yeastCommand.operation).toBe('create');
    if (yeastCommand.operation !== 'create') throw new Error('Création de souche attendue.');
    expect(yeastCommand.entity).toEqual({ kind: 'yeastStrain', value: expect.objectContaining({ kind: 'yeast', betaLyase: 'unknown', source: formSource }) });
    expect(yeastCommand.claims[0].property).toBe('yeast.process.openNote');
    expect(yeastCommand.claims[0].source.reference).toBe(formSource.reference);
    unmount();

    const styleRecord = { id: 'style-guide-created', kind: 'styleGuide', name: 'Guide de test', version: 'édition-test-1', enabled: false,
      edition: 'Profil documenté', retrievedAt: null, createdAt: currentDate(), attribution: 'Brasseur de test', source,
      styles: [{ id: 'style-created', code: 'TEST', name: 'Style de test', aliases: [], family: 'famille attribuée', stats: {}, source }],
      catalogueMeta: { schemaVersion: 1, entityKind: 'brewingStyle', revision: 1, fingerprint: 'e'.repeat(64), claims: [], unmapped: [], projections: [], corrections: [], identityResolutions: [] }
    } as BrewingStyleGuide;
    const styleWrite = vi.fn(async (command: BrewerCatalogueCommand) => {
      assertBrewerCatalogueCommand(command);
      return { status: 'applied' as const, kind: 'brewingStyle' as const, id: styleRecord.id, record: styleRecord, revision: 1,
        fingerprint: 'e'.repeat(64), receipt: {} as never, scope: 'fixture' as const };
    });
    const styleLookupRow: BrewerCatalogueLookupRecord = { kind: 'brewingStyle', id: styleRecord.id, styleId: 'style-created', record: styleRecord,
      revision: 1, fingerprint: 'e'.repeat(64), origin: 'persisted' };
    const styleLookup = vi.fn().mockResolvedValueOnce({ records: [], truncated: false }).mockResolvedValue({ records: [styleLookupRow], truncated: false });
    const styleServices = serviceHarness({ lookup: styleLookup, write: styleWrite }).services;
    render(<HopV55Catalogue services={styleServices} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Styles' }));
    await searchFor('Guide de test');
    fireEvent.click(screen.getByRole('button', { name: 'Créer une fiche absente' }));
    fireEvent.change(screen.getByLabelText('Version'), { target: { value: 'édition-test-1' } });
    fireEvent.change(screen.getByLabelText('Édition'), { target: { value: 'Profil documenté' } });
    fireEvent.change(screen.getByLabelText('Statut'), { target: { value: 'false' } });
    fireEvent.change(screen.getByLabelText('Attribution'), { target: { value: 'Brasseur de test' } });
    fireEvent.change(screen.getByLabelText('Code du style'), { target: { value: 'TEST' } });
    fireEvent.change(screen.getByLabelText('Nom du style'), { target: { value: 'Style de test' } });
    fireEvent.change(screen.getByLabelText('Famille'), { target: { value: 'famille attribuée' } });
    fireEvent.change(screen.getByLabelText('Statistique de création'), { target: { value: 'og' } });
    fireEvent.change(screen.getByLabelText('Minimum (SG)'), { target: { value: '1.040' } });
    fireEvent.change(screen.getByLabelText('Maximum (SG)'), { target: { value: '1.050' } });
    fillSharedSource();
    fireEvent.click(screen.getByRole('button', { name: 'Créer la fiche' }));
    await waitFor(() => expect(styleWrite).toHaveBeenCalledTimes(1));
    const styleCommand = styleWrite.mock.calls[0][0];
    expect(styleCommand.operation).toBe('create');
    if (styleCommand.operation !== 'create') throw new Error('Création de style attendue.');
    expect(styleCommand.entity.kind).toBe('brewingStyle');
    if (styleCommand.entity.kind !== 'brewingStyle') throw new Error('Guide de style attendu.');
    expect(styleCommand.entity.value).toEqual(expect.objectContaining({ enabled: false, retrievedAt: null, attribution: 'Brasseur de test' }));
    expect(styleCommand.entity.value.styles[0]).toEqual(expect.objectContaining({ aliases: [], stats: { og: { min: 1.04, max: 1.05 } }, source: formSource }));
    expect(styleCommand.claims).toEqual([]);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enrichir' })).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Style de test · Guide de test' })).toBeInTheDocument();
    expect(styleLookup).toHaveBeenLastCalledWith('brewingStyle', 'Style de test');
    expect(screen.queryByText(/recherche après écriture/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Identifiants techniques'));
    expect(screen.getByText('style-created')).toBeInTheDocument();
  });

  it('conserve le formulaire au conflit, reprend le même payload avec le même operationId et garde la source brute', async () => {
    const write = vi.fn()
      .mockResolvedValueOnce({ status: 'conflict', reason: 'Relecture de conflit demandée.' })
      .mockResolvedValueOnce({ status: 'conflict', reason: 'Même commande relue, reprise encore nécessaire.' })
      .mockResolvedValueOnce({ status: 'conflict', reason: 'Correction reçue, relecture encore nécessaire.' })
      .mockImplementationOnce(async (command: BrewerCatalogueCommand) => {
        assertBrewerCatalogueCommand(command);
        if (command.operation !== 'create') throw new Error('Création de variété attendue.');
        const canonical = makeHop('created-alpha', command.claims, 1);
        return { status: 'applied' as const, kind: 'hopVariety' as const, id: canonical.id, record: canonical.record,
          revision: canonical.revision, fingerprint: canonical.fingerprint, receipt: {} as never, scope: 'fixture' as const };
      });
    const { services } = serviceHarness({ lookup: vi.fn(async () => ({ records: [], truncated: false })), write });
    render(<HopV55Catalogue services={services} />);
    await searchFor('Nouvelle variété');
    fireEvent.click(screen.getByRole('button', { name: 'Créer une fiche absente' }));
    fireEvent.click(screen.getByLabelText('Ajouter une première donnée sourcée'));
    fillRangeClaim(); fillSharedSource();
    fireEvent.click(screen.getByText('Valeur brute et méthode, si la source les fournit'));
    fireEvent.change(screen.getByLabelText('JSON brut facultatif'), { target: { value: '{"assay":"Lot-1","reported":"6–8 %"}' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer la fiche' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Relecture de conflit demandée'));
    expect(screen.getByLabelText('Valeur rapportée')).toHaveValue('6–8 %');
    expect(screen.getByLabelText('JSON brut facultatif')).toHaveValue('{"assay":"Lot-1","reported":"6–8 %"}');
    fireEvent.click(screen.getByRole('button', { name: 'Créer la fiche' }));
    await waitFor(() => expect(write).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Même commande relue'));
    const first = write.mock.calls[0][0] as BrewerCatalogueCommand;
    const second = write.mock.calls[1][0] as BrewerCatalogueCommand;
    assertBrewerCatalogueCommand(first); assertBrewerCatalogueCommand(second);
    if (first.operation !== 'create' || second.operation !== 'create') throw new Error('Deux créations attendues.');
    expect(first.operationId).toBe(second.operationId);
    expect(first.claims[0].id).toBe(second.claims[0].id);
    fireEvent.change(screen.getByLabelText('Valeur rapportée'), { target: { value: '6–9 %' } });
    fireEvent.change(screen.getByLabelText('JSON brut facultatif'), { target: { value: '{"assay":"Lot-1","reported":"6–9 %"}' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer la fiche' }));
    await waitFor(() => expect(write).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Correction reçue'));
    const corrected = write.mock.calls[2][0] as BrewerCatalogueCommand;
    assertBrewerCatalogueCommand(corrected);
    if (corrected.operation !== 'create') throw new Error('Correction de création attendue.');
    expect(corrected.operationId).not.toBe(second.operationId);
    expect(corrected.claims[0].id).not.toBe(second.claims[0].id);
    expect(corrected.claims[0].source.reference).toBe('fixture://coa/lot-1');
    expect(corrected.claims[0].reported).toBe('6–9 %');
    expect(corrected.claims[0].rawValue).toEqual({ assay: 'Lot-1', reported: '6–9 %' });
    expect(corrected.projectionChoices[0]).toEqual(expect.objectContaining({ mode: 'scenario', targetField: 'scenario', claimId: corrected.claims[0].id }));
    fireEvent.click(screen.getByRole('button', { name: 'Créer la fiche' }));
    await waitFor(() => expect(write).toHaveBeenCalledTimes(4));
    const correctedRetry = write.mock.calls[3][0] as BrewerCatalogueCommand;
    expect(correctedRetry.operationId).toBe(corrected.operationId);
    expect(correctedRetry.operation === 'create' && correctedRetry.claims[0].id).toBe(corrected.claims[0].id);
    fireEvent.click(screen.getByText('Valeur brute conservée'));
    const rawClaimDetails = screen.getByText('Valeur brute conservée').closest('details');
    expect(rawClaimDetails).not.toBeNull();
    expect(within(rawClaimDetails!).getByText(/"assay": "Lot-1"/)).toBeInTheDocument();
  });

  it('ENRICH cible ID, révision et empreinte relus; garde l’ancienne assertion contradictoire et permet Utiliser', async () => {
    const initial = makeHop();
    const old = initial.record.catalogueMeta!.claims[0];
    const next = { id: 'new-claim', scope: 'variety', property: 'hop.alpha', label: 'Acides alpha', reported: '6–8 %',
      normalized: { kind: 'range' as const, min: 6, max: 8, unit: 'percentMass' }, epistemic: 'researchClaim' as const,
      source: { ...source, title: 'Étude distincte', kind: 'research' as const }, dates: { recordedAt: '2026-09-02T10:00:00.000Z' }, confidence: 'medium' as const };
    const canonical = makeHop(initial.id, [old, next], 5);
    const lookup = vi.fn()
      .mockResolvedValueOnce({ records: [initial], truncated: false })
      .mockResolvedValue({ records: [canonical], truncated: false });
    const write = vi.fn(async () => ({ status: 'applied', kind: 'hopVariety', id: canonical.id, record: canonical.record,
      revision: canonical.revision, fingerprint: canonical.fingerprint, receipt: {} as never, scope: 'fixture' as const }));
    const onUseRecord = vi.fn(), onCanonicalRecord = vi.fn();
    const { services } = serviceHarness({ lookup, write });
    render(<HopV55Catalogue services={services} onUseRecord={onUseRecord} onCanonicalRecord={onCanonicalRecord} />);
    await searchFor('Cascade');
    fireEvent.click(screen.getByRole('button', { name: /Cascade de test/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enrichir' }));
    fillRangeClaim('hop.alpha', '6–8 %');
    fireEvent.change(screen.getByLabelText('Confiance requise pour une analyse HOP'), { target: { value: 'medium' } });
    fillSharedSource();
    fireEvent.click(screen.getByRole('radio', { name: /Projeter vers un champ catalogue compatible/ }));
    fireEvent.change(screen.getByLabelText('Pourquoi appliquer cette projection ?'), { target: { value: 'La source cible explicitement la fiche variété.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’enrichissement' }));
    await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    const command = write.mock.calls[0][0] as BrewerCatalogueCommand;
    assertBrewerCatalogueCommand(command);
    expect(command.operation).toBe('enrich');
    if (command.operation !== 'enrich') throw new Error('Enrichissement attendu.');
    expect(command.target).toEqual({ kind: 'hopVariety', id: initial.id, expectedRevision: 4, expectedFingerprint: 'b'.repeat(64) });
    expect(command.claims).toHaveLength(1);
    expect(command.claims[0].source.reference).toBe('fixture://coa/lot-1');
    expect(command.projectionChoices[0]).toEqual(expect.objectContaining({ mode: 'legacy', targetField: 'analysis.alpha' }));
    await waitFor(() => expect(screen.getAllByText('Valeurs rapportées divergentes · aucune assertion n’est effacée.')).toHaveLength(2));
    expect(screen.getByText('5 %')).toBeInTheDocument();
    expect(screen.getByText('6–8 %')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser cette fiche' }));
    expect(onUseRecord).toHaveBeenCalledWith(expect.objectContaining({ id: initial.id, revision: 5 }));
    expect(onCanonicalRecord).toHaveBeenCalledWith(expect.objectContaining({ id: initial.id, revision: 5 }));
  });

  it('saisie guidée d’une analyse envoie propriété, valeurs, base, confiance et source dans la commande exacte', async () => {
    const initial = makeHop('cascade-guided', [], 3);
    const oldClaim = { ...existingClaim, id: 'claim-alpha-old', reported: '5 %', epistemic: 'manufacturerClaim' as const };
    const sourceRow: HopSource = { title: 'Fiche technique fictive', author: 'Laboratoire exemple', year: null, kind: 'manufacturer', reference: 'fixture://hop/alpha-guided', locator: 'tableau 2' };
    const nextClaim = { id: 'guided-alpha', scope: 'variety', property: 'analysis.alpha', label: 'Analyse · Acides alpha', reported: '6–8 % sur matière sèche',
      normalized: { kind: 'range' as const, min: 6, max: 8, unit: 'percentMass', basis: 'dryMatter' }, epistemic: 'manufacturerClaim' as const, source: sourceRow,
      dates: { recordedAt: '2026-10-02T10:00:00.000Z' }, confidence: 'medium' as const, method: 'Méthode HPLC' };
    const canonical = makeHop(initial.id, [oldClaim, nextClaim], 4);
    const lookup = vi.fn().mockResolvedValueOnce({ records: [initial], truncated: false }).mockResolvedValue({ records: [canonical], truncated: false });
    const write = vi.fn(async (command: BrewerCatalogueCommand) => {
      assertBrewerCatalogueCommand(command);
      return { status: 'applied' as const, kind: 'hopVariety' as const, id: canonical.id, record: canonical.record, revision: 4,
        fingerprint: canonical.fingerprint, receipt: {} as never, scope: 'fixture' as const };
    });
    const { services } = serviceHarness({ lookup, write });
    render(<HopV55Catalogue services={services} />);
    await searchFor('Cascade');
    fireEvent.click(screen.getByRole('button', { name: /Cascade de test/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enrichir' }));
    fireEvent.change(screen.getByLabelText('Renseignement à ajouter'), { target: { value: 'analysis' } });
    fireEvent.change(screen.getByLabelText('Composé mesuré'), { target: { value: 'alpha' } });
    fireEvent.change(screen.getByLabelText('Type de résultat'), { target: { value: 'range' } });
    fireEvent.change(screen.getByLabelText('Minimum publié'), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText('Maximum publié'), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('Unité de mesure'), { target: { value: 'percentMass' } });
    fireEvent.change(screen.getByLabelText('Base de mesure'), { target: { value: 'dryMatter' } });
    fireEvent.change(screen.getByLabelText('Confiance d’analyse'), { target: { value: 'medium' } });
    fireEvent.change(screen.getByLabelText('Valeur rapportée par la source'), { target: { value: '6–8 % sur matière sèche' } });
    fireEvent.change(screen.getByLabelText('Nature de l’information'), { target: { value: 'manufacturerClaim' } });
    fireEvent.change(screen.getByLabelText('Méthode analytique, si indiquée'), { target: { value: 'Méthode HPLC' } });
    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: sourceRow.title } });
    fireEvent.change(screen.getByLabelText('Auteur'), { target: { value: sourceRow.author } });
    fireEvent.change(screen.getByLabelText('Nature'), { target: { value: sourceRow.kind } });
    fireEvent.change(screen.getByLabelText('Référence'), { target: { value: sourceRow.reference } });
    fireEvent.change(screen.getByLabelText('Emplacement, si utile'), { target: { value: sourceRow.locator } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’enrichissement' }));

    await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    const command = write.mock.calls[0][0] as BrewerCatalogueCommand;
    assertBrewerCatalogueCommand(command);
    expect(command.operation).toBe('enrich');
    if (command.operation !== 'enrich') throw new Error('Enrichissement attendu.');
    expect(command.target).toEqual({ kind: 'hopVariety', id: initial.id, expectedRevision: 3, expectedFingerprint: 'b'.repeat(64) });
    expect(command.claims[0]).toEqual(expect.objectContaining({ scope: 'variety', property: 'analysis.alpha', reported: '6–8 % sur matière sèche',
      normalized: { kind: 'range', min: 6, max: 8, unit: 'percentMass', basis: 'dryMatter' }, epistemic: 'manufacturerClaim', source: sourceRow,
      confidence: 'medium', method: 'Méthode HPLC' }));
    expect(command.projectionChoices[0]).toEqual(expect.objectContaining({ mode: 'legacy', targetField: 'analysis.alpha', claimId: command.claims[0].id }));
  });

  it('projette une description sourcée dans un houblon créé avec son contexte exact', async () => {
    const canonical = makeHop('description-record', [], 1);
    const sourceRow: HopSource = { title: 'Note d’analyse fictive', author: 'Laboratoire exemple', year: null, kind: 'research', reference: 'fixture://hop/description', locator: 'p. 4' };
    const write = vi.fn(async (command: BrewerCatalogueCommand) => {
      assertBrewerCatalogueCommand(command);
      return { status: 'applied' as const, kind: 'hopVariety' as const, id: canonical.id, record: canonical.record, revision: 1,
        fingerprint: canonical.fingerprint, receipt: {} as never, scope: 'fixture' as const };
    });
    const { services } = serviceHarness({ lookup: vi.fn(async () => ({ records: [], truncated: false })), write });
    render(<HopV55Catalogue services={services} />);
    await searchFor('Houblon avec description');
    fireEvent.click(screen.getByRole('button', { name: 'Créer une fiche absente' }));
    fireEvent.click(screen.getByLabelText('Ajouter une première donnée sourcée'));
    fireEvent.change(screen.getByLabelText('Renseignement à ajouter'), { target: { value: 'description' } });
    fireEvent.change(screen.getByLabelText('Contexte de la description'), { target: { value: 'beer' } });
    fireEvent.change(screen.getByLabelText('Description transcrite de la source'), { target: { value: 'Pêche blanche, floral léger' } });
    fireEvent.change(screen.getByLabelText('Nature de l’information'), { target: { value: 'researchClaim' } });
    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: sourceRow.title } });
    fireEvent.change(screen.getByLabelText('Auteur'), { target: { value: sourceRow.author } });
    fireEvent.change(screen.getByLabelText('Nature'), { target: { value: sourceRow.kind } });
    fireEvent.change(screen.getByLabelText('Référence'), { target: { value: sourceRow.reference } });
    fireEvent.change(screen.getByLabelText('Emplacement, si utile'), { target: { value: sourceRow.locator } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer la fiche' }));
    await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    const command = write.mock.calls[0][0] as BrewerCatalogueCommand;
    assertBrewerCatalogueCommand(command);
    expect(command.operation).toBe('create');
    if (command.operation !== 'create') throw new Error('Création attendue.');
    expect(command.claims[0]).toEqual(expect.objectContaining({ scope: 'variety', property: 'hop.description', reported: 'Pêche blanche, floral léger',
      normalized: { kind: 'text', value: 'Pêche blanche, floral léger' }, context: { sensoryContext: 'beer' }, epistemic: 'researchClaim', source: sourceRow }));
    expect(readBrewerCatalogueHopDescriptionClaim(command.claims[0])).toEqual({ text: 'Pêche blanche, floral léger', context: 'beer', source: sourceRow });
    expect(command.entity.kind === 'hopVariety' && command.entity.value.descriptions).toEqual([]);
    expect(command.projectionChoices[0]).toEqual(expect.objectContaining({ mode: 'legacy', targetField: 'hop.description', claimId: command.claims[0].id }));
  });

  it('ENRICH ajoute la description au même ID, garde la contradiction et choisit le target append-only', async () => {
    const sourceRow: HopSource = { title: 'Note de dégustation fictive', author: 'Panel exemple', year: null, kind: 'research', reference: 'fixture://hop/description-enrich', locator: 'ligne 3' };
    const oldClaim = { id: 'description-old', scope: 'variety', property: 'hop.description', label: 'Description de variété', reported: 'Agrume discret',
      normalized: { kind: 'text' as const, value: 'Agrume discret' }, context: { sensoryContext: 'beer' }, epistemic: 'researchClaim' as const, source,
      dates: { recordedAt: '2026-09-01T10:00:00.000Z' } };
    const initial = makeHop('description-enrich', [oldClaim], 4);
    (initial.record as HopVariety).descriptions = [{ text: 'Agrume discret', context: 'beer', source }];
    const nextClaim = { id: 'description-new', scope: 'variety', property: 'hop.description', label: 'Description de variété', reported: 'Pêche blanche, floral léger',
      normalized: { kind: 'text' as const, value: 'Pêche blanche, floral léger' }, context: { sensoryContext: 'infusion', conditions: 'Infusion 78 °C, 20 min' },
      epistemic: 'researchClaim' as const, source: sourceRow, dates: { recordedAt: '2026-10-02T10:00:00.000Z' } };
    const canonical = makeHop(initial.id, [oldClaim, nextClaim], 5);
    (canonical.record as HopVariety).descriptions = [
      { text: 'Agrume discret', context: 'beer', source },
      { text: 'Pêche blanche, floral léger', context: 'infusion', source: sourceRow }
    ];
    (canonical.record as HopVariety).catalogueMeta!.projections = [{ id: 'description-projection', claimId: 'description-new', targetField: 'hop.description',
      mode: 'legacy', reason: 'Description rattachée à son contexte sensoriel et sa source.', recordedAt: '2026-10-02T10:00:00.000Z' }];
    const lookup = vi.fn().mockResolvedValueOnce({ records: [initial], truncated: false }).mockResolvedValue({ records: [canonical], truncated: false });
    const write = vi.fn(async (command: BrewerCatalogueCommand) => {
      assertBrewerCatalogueCommand(command);
      return { status: 'applied' as const, kind: 'hopVariety' as const, id: canonical.id, record: canonical.record, revision: 5,
        fingerprint: canonical.fingerprint, receipt: {} as never, scope: 'fixture' as const };
    });
    const { services } = serviceHarness({ lookup, write });
    render(<HopV55Catalogue services={services} />);
    await searchFor('Cascade');
    fireEvent.click(screen.getByRole('button', { name: /Cascade de test/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enrichir' }));
    fireEvent.change(screen.getByLabelText('Renseignement à ajouter'), { target: { value: 'description' } });
    fireEvent.change(screen.getByLabelText('Contexte de la description'), { target: { value: 'infusion' } });
    fireEvent.change(screen.getByLabelText('Conditions détaillées de la source, si utiles'), { target: { value: 'Infusion 78 °C, 20 min' } });
    fireEvent.change(screen.getByLabelText('Description transcrite de la source'), { target: { value: 'Pêche blanche, floral léger' } });
    fireEvent.change(screen.getByLabelText('Nature de l’information'), { target: { value: 'researchClaim' } });
    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: sourceRow.title } });
    fireEvent.change(screen.getByLabelText('Auteur'), { target: { value: sourceRow.author } });
    fireEvent.change(screen.getByLabelText('Nature'), { target: { value: sourceRow.kind } });
    fireEvent.change(screen.getByLabelText('Référence'), { target: { value: sourceRow.reference } });
    fireEvent.change(screen.getByLabelText('Emplacement, si utile'), { target: { value: sourceRow.locator } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’enrichissement' }));
    await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    const command = write.mock.calls[0][0] as BrewerCatalogueCommand;
    assertBrewerCatalogueCommand(command);
    expect(command.operation).toBe('enrich');
    if (command.operation !== 'enrich') throw new Error('Enrichissement attendu.');
    expect(command.target).toEqual({ kind: 'hopVariety', id: initial.id, expectedRevision: 4, expectedFingerprint: 'b'.repeat(64) });
    expect(command.claims[0]).toEqual(expect.objectContaining({ scope: 'variety', property: 'hop.description', reported: 'Pêche blanche, floral léger',
      normalized: { kind: 'text', value: 'Pêche blanche, floral léger' }, context: { sensoryContext: 'infusion', conditions: 'Infusion 78 °C, 20 min' }, source: sourceRow }));
    expect(readBrewerCatalogueHopDescriptionClaim(command.claims[0])).toEqual({ text: 'Pêche blanche, floral léger', context: 'infusion', source: sourceRow });
    expect(command.projectionChoices[0]).toEqual(expect.objectContaining({ mode: 'legacy', targetField: 'hop.description', claimId: command.claims[0].id }));
    expect(command.projectionChoices[0]).not.toHaveProperty('supersedesProjectionId');
    await waitFor(() => expect(screen.getAllByText('Agrume discret')).toHaveLength(2));
    expect(screen.getAllByText('Pêche blanche, floral léger')).toHaveLength(2);
    expect(screen.getAllByText('Valeurs rapportées divergentes · aucune assertion n’est effacée.')).toHaveLength(2);
    expect(screen.getByText('Contexte · Infusion · Infusion 78 °C, 20 min')).toBeInTheDocument();
  });

  it('ENRICH un style par son ID de guide et son ID de style, avec une nouvelle version demandée', async () => {
    const guide: BrewingStyleGuide = { id: 'guide-local', kind: 'styleGuide', name: 'Guide local', version: 'v1', enabled: true,
      edition: 'Édition de test', retrievedAt: null, createdAt: currentDate(), attribution: 'Brasseur exemple', source,
      styles: [{ id: 'style-existing-id', code: 'X-1', name: 'Style ambré', aliases: [], family: 'famille existante', stats: {}, source }],
      history: [], catalogueMeta: { schemaVersion: 1, entityKind: 'brewingStyle', revision: 6, fingerprint: 'f'.repeat(64), claims: [], unmapped: [], projections: [], corrections: [], identityResolutions: [] } };
    const selectedRecord: BrewerCatalogueLookupRecord = { kind: 'brewingStyle', id: guide.id, styleId: 'style-existing-id', record: guide,
      revision: 6, fingerprint: 'f'.repeat(64), origin: 'persisted' };
    const nextGuide: BrewingStyleGuide = { ...guide, version: 'v2', history: [{ version: guide.version, edition: guide.edition, enabled: guide.enabled,
      retrievedAt: guide.retrievedAt, createdAt: guide.createdAt, attribution: guide.attribution, source: guide.source, styles: guide.styles }] };
    const canonical: BrewerCatalogueLookupRecord = { ...selectedRecord, record: nextGuide, revision: 7 };
    const lookup = vi.fn(async () => ({ records: [selectedRecord], truncated: false }));
    const write = vi.fn(async (command: BrewerCatalogueCommand) => {
      assertBrewerCatalogueCommand(command);
      return { status: 'applied' as const, kind: 'brewingStyle' as const, id: guide.id, record: nextGuide, revision: 7,
        fingerprint: 'e'.repeat(64), receipt: {} as never, scope: 'fixture' as const };
    });
    const onCanonicalRecord = vi.fn();
    const { services } = serviceHarness({ lookup, write });
    render(<HopV55Catalogue services={services} onCanonicalRecord={onCanonicalRecord} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Styles' }));
    await searchFor('Style ambré');
    fireEvent.click(screen.getByRole('button', { name: /Style ambré/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enrichir' }));
    fireEvent.change(screen.getByLabelText('Nouvelle version du guide'), { target: { value: 'v2' } });
    fireEvent.change(screen.getByLabelText('Renseignement à ajouter'), { target: { value: 'styleStat' } });
    fireEvent.change(screen.getByLabelText('Statistique'), { target: { value: 'ibu' } });
    fireEvent.change(screen.getByLabelText('Minimum (IBU)'), { target: { value: '18' } });
    fireEvent.change(screen.getByLabelText('Maximum (IBU)'), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText('Valeur rapportée par la source'), { target: { value: '18–25 IBU' } });
    fireEvent.change(screen.getByLabelText('Nature de l’information'), { target: { value: 'researchClaim' } });
    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Référence de style' } });
    fireEvent.change(screen.getByLabelText('Auteur'), { target: { value: 'Organisme fictif' } });
    fireEvent.change(screen.getByLabelText('Nature'), { target: { value: 'research' } });
    fireEvent.change(screen.getByLabelText('Référence'), { target: { value: 'fixture://style/ibu' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’enrichissement' }));
    await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    const command = write.mock.calls[0][0] as BrewerCatalogueCommand;
    assertBrewerCatalogueCommand(command);
    expect(command.operation).toBe('enrich');
    if (command.operation !== 'enrich') throw new Error('Enrichissement de style attendu.');
    expect(command.target).toEqual({ kind: 'brewingStyle', id: 'guide-local', expectedRevision: 6, expectedFingerprint: 'f'.repeat(64), styleId: 'style-existing-id', nextVersion: 'v2' });
    expect(command.claims[0]).toEqual(expect.objectContaining({ scope: 'style:style-existing-id', property: 'style.style-existing-id.stats.ibu',
      normalized: { kind: 'range', min: 18, max: 25, unit: 'IBU' }, source: expect.objectContaining({ reference: 'fixture://style/ibu' }) }));
    expect(canonical.record.history?.[0].styles[0].id).toBe('style-existing-id');
    await waitFor(() => expect(onCanonicalRecord).toHaveBeenCalledWith(expect.objectContaining({ id: 'guide-local', styleId: 'style-existing-id', revision: 7 })));
  });

  it('saisie guidée de levure relie température, unité, contexte et source au claim de la souche', async () => {
    const yeast: HopYeast = { id: 'saison-id', kind: 'yeast', name: 'Saison de test', betaLyase: 'unknown', source,
      catalogueMeta: { schemaVersion: 1, entityKind: 'yeastStrain', revision: 2, fingerprint: 'a'.repeat(64), claims: [], unmapped: [], projections: [], corrections: [], identityResolutions: [] } };
    const initial: BrewerCatalogueLookupRecord = { kind: 'yeastStrain', id: yeast.id, record: yeast, revision: 2, fingerprint: 'a'.repeat(64), origin: 'persisted' };
    const recordedSource: HopSource = { title: 'Fiche de fermentation', author: 'Fabricant exemple', year: null, kind: 'manufacturer', reference: 'fixture://yeast/temperature' };
    const canonical: BrewerCatalogueLookupRecord = { ...initial, revision: 3, record: { ...yeast, catalogueMeta: { ...yeast.catalogueMeta!, revision: 3, claims: [{
      id: 'temperature-claim', scope: 'strain', property: 'yeast.temperature', label: 'Température de fermentation', reported: '10–20 °C',
      normalized: { kind: 'range', min: 10, max: 20, unit: '°C' }, context: 'Fermentation haute indiquée par la fiche', epistemic: 'manufacturerClaim', source: recordedSource,
      dates: { recordedAt: '2026-10-02T10:00:00.000Z' }
    }], projections: [{ id: 'temperature-projection', claimId: 'temperature-claim', targetField: 'reviewedDocumentary.technicalSelections.temperature', mode: 'legacy',
      reason: 'Valeur de la source retenue pour cette fiche.', recordedAt: '2026-10-02T10:00:00.000Z' }] } } };
    const lookup = vi.fn().mockResolvedValueOnce({ records: [initial], truncated: false }).mockResolvedValue({ records: [canonical], truncated: false });
    const write = vi.fn(async (command: BrewerCatalogueCommand) => {
      assertBrewerCatalogueCommand(command);
      return { status: 'applied' as const, kind: 'yeastStrain' as const, id: yeast.id, record: canonical.record, revision: 3,
        fingerprint: canonical.fingerprint, receipt: {} as never, scope: 'fixture' as const };
    });
    const { services } = serviceHarness({ lookup, write });
    render(<HopV55Catalogue services={services} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Levures' }));
    await searchFor('Saison de test');
    fireEvent.click(screen.getByRole('button', { name: /Saison de test/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enrichir' }));
    fireEvent.change(screen.getByLabelText('Renseignement à ajouter'), { target: { value: 'temperature' } });
    fireEvent.change(screen.getByLabelText('Type de valeur'), { target: { value: 'range' } });
    fireEvent.change(screen.getByLabelText('Minimum documenté (°C)'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Maximum documenté (°C)'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Valeur rapportée par la source'), { target: { value: '10–20 °C' } });
    fireEvent.change(screen.getByLabelText('Nature de l’information'), { target: { value: 'manufacturerClaim' } });
    fireEvent.change(screen.getByLabelText('Condition ou contexte, si utile'), { target: { value: 'Fermentation haute indiquée par la fiche' } });
    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: recordedSource.title } });
    fireEvent.change(screen.getByLabelText('Auteur'), { target: { value: recordedSource.author } });
    fireEvent.change(screen.getByLabelText('Nature'), { target: { value: recordedSource.kind } });
    fireEvent.change(screen.getByLabelText('Référence'), { target: { value: recordedSource.reference } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’enrichissement' }));
    await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    const command = write.mock.calls[0][0] as BrewerCatalogueCommand;
    assertBrewerCatalogueCommand(command);
    expect(command.operation).toBe('enrich');
    if (command.operation !== 'enrich') throw new Error('Enrichissement de souche attendu.');
    expect(command.target).toEqual({ kind: 'yeastStrain', id: yeast.id, expectedRevision: 2, expectedFingerprint: 'a'.repeat(64) });
    expect(command.claims[0]).toEqual(expect.objectContaining({ scope: 'strain', property: 'yeast.temperature',
      normalized: { kind: 'range', min: 10, max: 20, unit: '°C' }, context: 'Fermentation haute indiquée par la fiche', source: recordedSource }));
    expect(command.projectionChoices[0]).toEqual(expect.objectContaining({ mode: 'legacy', targetField: 'reviewedDocumentary.technicalSelections.temperature' }));
  });

  it('demande une raison de distinction des homonymes sans perdre le brouillon ni réutiliser un ID avec payload modifié', async () => {
    const candidate: BrewerCatalogueIdentityCandidate = { kind: 'hopVariety', id: 'cascade-known', fingerprint: 'c'.repeat(64) };
    const candidateRecord = makeHop(candidate.id);
    const write = vi.fn()
      .mockResolvedValueOnce({ status: 'conflict', reason: 'Identité similaire.', identityCandidates: [candidate] })
      .mockResolvedValueOnce({ status: 'conflict', reason: 'Une seconde preuve reste nécessaire.', identityCandidates: [candidate] });
    const lookup = vi.fn(async (_kind: string, query: string) => ({ records: query === candidate.id ? [candidateRecord] : [], truncated: false }));
    const { services } = serviceHarness({ lookup, write });
    render(<HopV55Catalogue services={services} />);
    await searchFor('Cascade variante distincte');
    fireEvent.click(screen.getByRole('button', { name: 'Créer une fiche absente' }));
    fireEvent.change(screen.getByLabelText('Origine, si connue'), { target: { value: 'Origine déclarée par le fournisseur' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer la fiche' }));
    await waitFor(() => expect(screen.getByLabelText('Pourquoi cette nouvelle identité est-elle distincte ?')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Relire Cascade de test'));
    expect(screen.getByText('Aucun alias attribué')).toBeInTheDocument();
    expect(screen.getByLabelText('Nom de la fiche')).toHaveValue('Cascade variante distincte');
    expect(screen.getByLabelText('Origine, si connue')).toHaveValue('Origine déclarée par le fournisseur');
    const first = write.mock.calls[0][0] as BrewerCatalogueCommand;
    fireEvent.change(screen.getByLabelText('Pourquoi cette nouvelle identité est-elle distincte ?'), { target: { value: 'Cultivar différent selon la source jointe.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer la fiche' }));
    await waitFor(() => expect(write).toHaveBeenCalledTimes(2));
    const second = write.mock.calls[1][0] as BrewerCatalogueCommand;
    expect(second.operationId).not.toBe(first.operationId);
    if (second.operation !== 'create') throw new Error('Création distincte attendue.');
    expect(second.identityResolution).toEqual({ decision: 'distinct', candidates: [candidate], reason: 'Cultivar différent selon la source jointe.' });
    expect(screen.getByLabelText('Origine, si connue')).toHaveValue('Origine déclarée par le fournisseur');
  });

  it('ne propose pas CREATE quand la recherche ne prouve pas une absence complète', async () => {
    const { services } = serviceHarness({ lookup: vi.fn(async () => ({ records: [], truncated: true })) });
    render(<HopV55Catalogue services={services} />);
    await searchFor('Variété hors page');
    await waitFor(() => expect(screen.getByText(/recherche est tronquée/i)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Créer une fiche/ })).not.toBeInTheDocument();
  });
});
