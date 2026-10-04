import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { HopAdviceAssertion } from '../../src/domain/hopDecision/adviceSchema';
import type { HopDecisionMaterial } from '../../src/domain/hopDecision/types';
import type { HopPropertyAdviceIntent, HopPropertyAdviceRequest } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { HopV55PropertyAdviceIntentEditor } from '../../src/ui/hopV55/PropertyAdviceIntentEditor';

afterEach(() => cleanup());

function spanFor(question: string, text: string) {
  const start = question.indexOf(text);
  if (start < 0) throw new Error(`Fragment absent : ${text}`);
  return { start, end: start + text.length, text };
}

function makeIntent(question: string, patch: Partial<HopPropertyAdviceIntent> = {}): HopPropertyAdviceIntent {
  const label = patch.label ?? 'arôme';
  return {
    id: 'intent-aroma-target', property: 'aroma', label, role: 'target', direction: 'increase', qualification: null, required: true,
    comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] }, metric: 'sensory',
    subject: { kind: 'beer', label: 'Bière visée', materialId: null, sensoryContext: 'beer' },
    sourceSpans: [spanFor(question, label)], interpretationOrigin: 'user', basis: 'Intention formulée par le brasseur.', relatedIntentIds: [],
    ...patch,
  };
}

function makeRequest(input: { question?: string; intents?: HopPropertyAdviceIntent[]; materialIds?: string[]; policyKind?: 'explicit' | 'discover'; materials?: HopDecisionMaterial[] }): HopPropertyAdviceRequest {
  const question = input.question ?? 'Je souhaite un arôme plus marqué.';
  const assertions: HopAdviceAssertion[] = [];
  return {
    format: 'hop-documentary-request-v2', id: 'property-advice-intent-editor-test', originalQuestion: question,
    interpretation: { id: 'interpretation-test', version: '1', text: 'Lecture utilisateur, corrigible par intention.', origin: 'user' },
    propertyIntents: input.intents ?? [makeIntent(question)],
    candidatePolicy: { kind: input.policyKind ?? 'explicit', materialIds: input.materialIds ?? [], basis: 'Périmètre de test explicite.' },
    context: { stage: 'fermenting', stageBasis: 'Stade transmis par la préparation de test.', assertions,
      access: {
        bulkBeer: { state: 'unknown', basis: 'Accès non préparé.', assertionIds: [] },
        sampling: { state: 'unknown', basis: 'Accès non préparé.', assertionIds: [] },
        separatePortion: { state: 'unknown', basis: 'Accès non préparé.', assertionIds: [] },
      } },
    exclusions: [], materials: structuredClone(input.materials ?? []),
  };
}

function material(id: string, name: string): HopDecisionMaterial {
  return { id, name, form: 'pelletT90' };
}

function callbacks() {
  return {
    onChangeIntent: vi.fn(),
    onChangeCandidatePolicy: vi.fn(),
    onSearchMaterials: vi.fn(async (_query: string, _scopeIds: readonly string[]) => [] as HopDecisionMaterial[]),
    onSelectMaterials: vi.fn(async (ids: string[]) => ids.map(id => material(id, `Fiche ${id}`))),
    onChangeMaterials: vi.fn(),
    onChangeAccess: vi.fn(),
    onChangeAssertions: vi.fn(),
    onAddIntent: vi.fn(),
  };
}

function renderEditor(request: HopPropertyAdviceRequest, materialChoices: HopDecisionMaterial[], h: ReturnType<typeof callbacks>) {
  return render(<HopV55PropertyAdviceIntentEditor request={request} candidatePolicy={request.candidatePolicy}
    materialChoices={materialChoices} {...h} />);
}

describe('éditeur des intentions V2', () => {
  it('ajoute une annotation depuis la deuxième occurrence exacte, relie une intention et reprend le DTO appendé', () => {
    const question = 'Je veux floral avec banane. 🍺 Je veux floral avec banane.';
    const banana = makeIntent(question, { id: 'intent-banana-context', property: 'aroma', label: 'banane', role: 'preference',
      direction: null, required: false, comparisonBasis: { kind: 'none', assertionIds: [] },
      sourceSpans: [spanFor(question, 'banane')], basis: 'Contexte de partenaire rapporté par le brasseur.' });
    const request = makeRequest({ question, intents: [banana] });
    const h = callbacks();
    const view = renderEditor(request, [], h);
    fireEvent.click(screen.getByText('Ajouter un terme oublié, depuis un passage exact de la question'));
    fireEvent.change(screen.getByLabelText('Fragment exact à annoter'), { target: { value: 'floral' } });
    expect(screen.getByLabelText('Occurrence du fragment exact')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Occurrence du fragment exact'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Propriété de la nouvelle intention'), { target: { value: 'aroma' } });
    fireEvent.change(screen.getByLabelText('Rôle de la nouvelle intention'), { target: { value: 'target' } });
    fireEvent.change(screen.getByLabelText('Direction de la nouvelle intention'), { target: { value: 'increase' } });
    fireEvent.change(screen.getByLabelText('Base de comparaison de la nouvelle intention'), { target: { value: 'qualitativeTarget' } });
    fireEvent.change(screen.getByLabelText('Sujet de la nouvelle intention'), { target: { value: 'beer' } });
    fireEvent.change(screen.getByLabelText('Libellé du sujet de la nouvelle intention'), { target: { value: 'Bière visée' } });
    fireEvent.change(screen.getByLabelText('Motif de la nouvelle intention'), { target: { value: 'Cible florale reliée au partenaire présent dans la question.' } });
    fireEvent.click(screen.getByLabelText('Nouvelle intention essentielle'));
    fireEvent.click(screen.getByLabelText('Nouvelle intention liée à banane'));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter cette intention à la lecture' }));

    expect(h.onAddIntent).toHaveBeenCalledTimes(1);
    const added = h.onAddIntent.mock.calls[0][0] as HopPropertyAdviceIntent;
    const secondStart = question.lastIndexOf('floral');
    expect(secondStart).toBe(Array.from(question.slice(0, secondStart)).length + 1);
    expect(added).toMatchObject({
      property: 'aroma', label: 'floral', role: 'target', direction: 'increase', required: true,
      comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] }, metric: 'unspecified',
      subject: { kind: 'beer', label: 'Bière visée', materialId: null, sensoryContext: 'unspecified' },
      sourceSpans: [{ start: secondStart, end: secondStart + 'floral'.length, text: 'floral' }],
      interpretationOrigin: 'user', basis: 'Cible florale reliée au partenaire présent dans la question.',
      relatedIntentIds: [banana.id],
    });
    expect(added.id).toMatch(/^property-intent:/);
    expect(added).not.toHaveProperty('value');
    expect(added.subject.materialId).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent(/Terme ajouté à la lecture à valider/);

    view.rerender(<HopV55PropertyAdviceIntentEditor request={{ ...request, propertyIntents: [...request.propertyIntents, added] }}
      candidatePolicy={request.candidatePolicy} materialChoices={[]} {...h} />);
    expect(screen.getByText('« banane »', { selector: 'h5' })).toBeInTheDocument();
    expect(screen.getByText('« floral »', { selector: 'h5' })).toBeInTheDocument();
    expect(h.onChangeIntent).not.toHaveBeenCalled();
  });

  it('refuse un fragment absent et une intention doublon de la même occurrence/propriété/rôle', () => {
    const question = 'Je veux floral et je garde floral.';
    const existing = makeIntent(question, { id: 'intent-floral-existing', property: 'aroma', label: 'floral', role: 'target',
      direction: 'increase', sourceSpans: [spanFor(question, 'floral')], basis: 'Intention déjà transmise.' });
    const request = makeRequest({ question, intents: [existing] });
    const h = callbacks();
    renderEditor(request, [], h);
    fireEvent.click(screen.getByText('Ajouter un terme oublié, depuis un passage exact de la question'));
    fireEvent.change(screen.getByLabelText('Fragment exact à annoter'), { target: { value: 'flore' } });
    expect(screen.getByText('Aucune occurrence exacte trouvée dans la question.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajouter cette intention à la lecture' })).toBeDisabled();
    expect(h.onAddIntent).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Fragment exact à annoter'), { target: { value: 'floral' } });
    fireEvent.change(screen.getByLabelText('Propriété de la nouvelle intention'), { target: { value: 'aroma' } });
    fireEvent.change(screen.getByLabelText('Rôle de la nouvelle intention'), { target: { value: 'target' } });
    fireEvent.change(screen.getByLabelText('Motif de la nouvelle intention'), { target: { value: 'Même fragment et même interprétation.' } });
    expect(screen.getByText('Ce passage porte déjà un terme de même nature et de même sujet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajouter cette intention à la lecture' })).toBeDisabled();
    expect(h.onAddIntent).not.toHaveBeenCalled();
  });

  it('réutilise un ID stable si l’append du parent échoue et que le brasseur réessaie', () => {
    const question = 'Je veux floral.';
    const request = makeRequest({ question, intents: [] });
    const h = callbacks();
    h.onAddIntent.mockImplementationOnce(() => { throw new Error('Append refusé par le parent.'); });
    renderEditor(request, [], h);
    fireEvent.click(screen.getByText('Ajouter un terme oublié, depuis un passage exact de la question'));
    fireEvent.change(screen.getByLabelText('Fragment exact à annoter'), { target: { value: 'floral' } });
    fireEvent.change(screen.getByLabelText('Propriété de la nouvelle intention'), { target: { value: 'aroma' } });
    fireEvent.change(screen.getByLabelText('Rôle de la nouvelle intention'), { target: { value: 'target' } });
    fireEvent.change(screen.getByLabelText('Motif de la nouvelle intention'), { target: { value: 'Cible ajoutée après correction.' } });
    const add = screen.getByRole('button', { name: 'Ajouter cette intention à la lecture' });
    fireEvent.click(add);
    expect(screen.getByRole('alert')).toHaveTextContent('Append refusé par le parent.');
    fireEvent.click(add);
    const calls = h.onAddIntent.mock.calls.map(call => call[0] as HopPropertyAdviceIntent);
    expect(calls).toHaveLength(2);
    expect(calls[0].id).toBe(calls[1].id);
    expect(calls[1].sourceSpans).toEqual([spanFor(question, 'floral')]);
  });

  it('garde une faible amertume comme cible qualitative sans direction de baisse', () => {
    const question = 'Je veux une légère amertume, sans demander de baisse.';
    const intent = makeIntent(question, { id: 'intent-light-bitterness', property: 'bitterness', label: 'légère amertume', role: 'target',
      direction: null, qualification: 'légère', comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] },
      sourceSpans: [spanFor(question, 'légère amertume')], basis: 'Cible qualitative; aucun delta demandé.' });
    const request = makeRequest({ question, intents: [intent] });
    const h = callbacks();
    const view = renderEditor(request, [], h);

    expect(screen.getByLabelText('Rôle de l’intention 1')).toHaveValue('target');
    expect(screen.getByLabelText('Direction de l’intention 1')).toHaveValue('');
    expect(screen.getByLabelText('Base de comparaison de l’intention 1')).toHaveValue('qualitativeTarget');
    expect(screen.getByLabelText('Motif de l’intention 1')).toHaveValue('Cible qualitative; aucun delta demandé.');
    expect(screen.getByText('légère amertume', { selector: 'q' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Direction de l’intention 1'), { target: { value: 'keep' } });
    expect(h.onChangeIntent).toHaveBeenCalledWith(intent.id, expect.objectContaining({ direction: 'keep',
      comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] } }));
    const revisedIntent = h.onChangeIntent.mock.calls[0][1] as HopPropertyAdviceIntent;
    view.rerender(<HopV55PropertyAdviceIntentEditor request={{ ...request, propertyIntents: [revisedIntent] }}
      candidatePolicy={request.candidatePolicy} materialChoices={[]} {...h} />);
    expect(screen.getByText(/« Garder » ou « en avoir moins » se compare à l’état actuel/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Comparer à l’état actuel' })).toBeInTheDocument();
  });

  it('garde explicit[] vide et borne discover au périmètre exact sans cocher les autres matières chargées', async () => {
    const first = material('variety:exact-a', 'Variété A');
    const second = material('variety:exact-b', 'Variété B');
    const explicit = makeRequest({ materials: [], materialIds: [], policyKind: 'explicit' });
    const h = callbacks();
    const view = renderEditor(explicit, [first, second], h);
    expect(screen.getByLabelText('Candidate policy')).toHaveValue('explicit');
    expect(screen.getByLabelText(`Matière candidate ${first.name}`)).not.toBeChecked();
    expect(screen.getByLabelText(`Matière candidate ${second.name}`)).not.toBeChecked();
    expect(screen.getByRole('option', { name: 'Rechercher dans le périmètre exact' })).toBeDisabled();
    expect(h.onChangeCandidatePolicy).not.toHaveBeenCalled();
    expect(h.onSearchMaterials).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText(`Matière candidate ${first.name}`));
    await waitFor(() => expect(h.onChangeCandidatePolicy).toHaveBeenCalledWith(expect.objectContaining({
      kind: 'explicit', materialIds: [first.id],
    })));
    const explicitScope = { ...explicit, candidatePolicy: { ...explicit.candidatePolicy, materialIds: [first.id] } };
    view.rerender(<HopV55PropertyAdviceIntentEditor request={explicitScope} candidatePolicy={explicitScope.candidatePolicy}
      materialChoices={[first, second]} {...h} />);
    fireEvent.change(screen.getByLabelText('Candidate policy'), { target: { value: 'discover' } });
    expect(h.onChangeCandidatePolicy).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'discover', materialIds: [first.id] }));

    const missingId = 'variety:not-loaded-exact-scope';
    const discover = { ...explicit, candidatePolicy: { kind: 'discover' as const,
      materialIds: [first.id, missingId], basis: 'Deux identités exactes; la deuxième n’est pas chargée.' } };
    view.rerender(<HopV55PropertyAdviceIntentEditor request={discover} candidatePolicy={discover.candidatePolicy}
      materialChoices={[first, second]} {...h} />);
    expect(screen.getByLabelText(`Matière candidate ${first.name}`)).toBeChecked();
    expect(screen.getByLabelText(`Matière candidate ${second.name}`)).not.toBeChecked();
    const missingDetails = screen.getByText(/1 identité demandée non chargée, conservée/i).closest('details');
    expect(missingDetails).not.toHaveAttribute('open');
    expect(missingDetails).toHaveTextContent(missingId);

    fireEvent.change(screen.getByLabelText('Recherche de matière canonique'), { target: { value: 'Variété A' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher' }));
    await waitFor(() => expect(h.onSearchMaterials).toHaveBeenCalledWith('Variété A', [first.id, missingId]));
    expect(h.onChangeCandidatePolicy).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByLabelText(`Matière candidate ${first.name}`));
    await waitFor(() => expect(h.onChangeCandidatePolicy).toHaveBeenLastCalledWith(expect.objectContaining({
      kind: 'discover', materialIds: [missingId], basis: discover.candidatePolicy.basis,
    })));
    expect(h.onSelectMaterials).toHaveBeenLastCalledWith([]);
    expect(screen.getByLabelText(`Matière candidate ${second.name}`)).not.toBeChecked();
  });

  it('ajoute une attestation d’accès locale au draft sans toucher aux assertions préparées', () => {
    const request = makeRequest({});
    const before = structuredClone(request.context.assertions);
    const h = callbacks();
    renderEditor(request, [], h);
    const card = screen.getByText('Bière entière').closest('.hvp-access-card');
    if (!card) throw new Error('Carte d’accès bière entière absente.');
    fireEvent.click(within(card).getByText('Corriger cet accès par une nouvelle déclaration'));
    fireEvent.change(within(card).getByLabelText('État d’accès Bière entière'), { target: { value: 'yes' } });
    fireEvent.change(within(card).getByLabelText('Motif d’accès Bière entière'), { target: { value: 'Une portion séparée est disponible.' } });
    fireEvent.change(within(card).getByLabelText('Déclaration d’accès Bière entière'), { target: { value: 'Le brasseur confirme l’accès à une portion séparée.' } });
    fireEvent.change(within(card).getByLabelText('Accès Bière entière · Mode de source'), { target: { value: 'personal' } });
    fireEvent.change(within(card).getByLabelText('Accès Bière entière · Titre de la déclaration'), { target: { value: 'Note d’accès du brasseur' } });
    fireEvent.change(within(card).getByLabelText('Accès Bière entière · Acteur de la déclaration'), { target: { value: 'Brasseur fixture' } });
    fireEvent.change(within(card).getByLabelText('Accès Bière entière · Motif de la déclaration'), { target: { value: 'Attestation locale pour la lecture corrigée.' } });
    fireEvent.click(within(card).getByRole('button', { name: 'Ajouter cette attestation à la lecture' }));

    expect(h.onChangeAssertions).toHaveBeenCalledTimes(1);
    const assertions = h.onChangeAssertions.mock.calls[0][0] as HopAdviceAssertion[];
    expect(assertions.slice(0, before.length)).toEqual(before);
    const appended = assertions[assertions.length - 1];
    expect(appended).toMatchObject({ subject: 'bulkBeer', state: 'reported', value: true,
      statement: 'Le brasseur confirme l’accès à une portion séparée.',
      source: { title: 'Note d’accès du brasseur', author: 'Brasseur fixture', year: null, kind: 'observation' } });
    expect(appended.id).toMatch(/^property-access-assertion:/);
    expect(appended.source?.reference).toBe(`local-declaration:${appended.id}`);
    expect(h.onChangeAccess).toHaveBeenCalledWith('bulkBeer', expect.objectContaining({ state: 'yes',
      basis: 'Une portion séparée est disponible.', assertionIds: [appended.id] }));
    expect(screen.getByRole('status')).toHaveTextContent(/ajoutée à la lecture à valider/);
    expect(request.context.assertions).toEqual(before);
  });
});
