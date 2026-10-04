import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HopV55ProgramEditor } from '../../src/ui/hopV55/ProgramEditor';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { createHopV55ScenarioRequest } from '../../src/services/hopV55/scenarioAdapter';
import { simulateBrewingScenario, type BrewingScenarioBranchRequest } from '../../src/domain/brewingScenario';

describe('Éditeur de programme vers le moteur', () => {
  it('compare un retrait et une correction de contact comme un seul programme, source intacte', () => {
    const prepared = prepareBrewingScenarioContext(makeHopV55FixtureContext('planning'));
    const source = structuredClone(prepared.runtime.current!.program!);
    const branches: BrewingScenarioBranchRequest[] = [];
    render(<HopV55ProgramEditor prepared={prepared} onCommit={branch => branches.push(branch)} />);
    fireEvent.change(screen.getByLabelText('Geste'), { target: { value: 'remove' } });
    fireEvent.click(screen.getByRole('button', { name: 'Garder ce geste et en régler un autre' }));
    fireEvent.change(screen.getByLabelText('Geste'), { target: { value: 'replace' } });
    fireEvent.change(screen.getByLabelText('Ajout prévu'), { target: { value: source.additions[1].id } });
    fireEvent.change(screen.getByLabelText('Masse du réglage'), { target: { value: '7,5' } });
    fireEvent.change(screen.getByLabelText('Contact du réglage'), { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: 'Garder ce geste et en régler un autre' }));
    expect(branches).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Comparer les gestes préparés' }));
    const request = createHopV55ScenarioRequest({ prepared, scenarioId: 'two-gestures-fixture', revision: 1, branches,
      intent: { question: 'Retirer le premier ajout et corriger le contact du second.', criteria: [] } });
    const result = simulateBrewingScenario(request, prepared.runtime);
    expect(result.branches[0].program!.additions).toHaveLength(1);
    expect(result.branches[0].program!.additions[0]).toMatchObject({ id: source.additions[1].id, grams: 7.5, contactHours: 60 });
    expect(prepared.runtime.current!.program).toEqual(source);
  });
  it('éprouve la dose décimale avec jour absent et refuse une saisie illisible après cette dose', () => {
    const prepared = prepareBrewingScenarioContext(makeHopV55FixtureContext('planning'));
    const branches: BrewingScenarioBranchRequest[] = [];
    render(<HopV55ProgramEditor prepared={prepared} onCommit={branch => branches.push(branch)} />);
    fireEvent.change(screen.getByLabelText('Masse du réglage'), { target: { value: '12,25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comparer ce réglage' }));
    const request = createHopV55ScenarioRequest({ prepared, scenarioId: 'real-editor-fixture', revision: 1, branches,
      intent: { question: 'Doser précisément sans renseigner de jour fictif.', criteria: [] } });
    const result = simulateBrewingScenario(request, prepared.runtime);
    expect(result.branches[0].program!.additions[0].grams).toBe(12.25);
    expect(result.branches[0].input.additions[0].dayOffset).toBeUndefined();
    fireEvent.change(screen.getByLabelText('Masse du réglage'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comparer ce réglage' }));
    expect(branches).toHaveLength(1);
    expect(screen.getByText(/matière, la masse et l’emploi/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Masse du réglage'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comparer ce réglage' }));
    expect(branches).toHaveLength(1);
  });
});
