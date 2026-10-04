import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HopMeasurement, HopSource, hopMeasurementError } from '../../functions/src/hopIndexSchema';
import { HopFactsEditor } from '../../src/ui/hopIndex/HopFactsEditor';

afterEach(cleanup);

const source: HopSource = {
  title: 'Certificat de fixture', author: 'Laboratoire de fixture', year: 2025,
  kind: 'coa', reference: 'fixture:hop-coa-1',
};

const reading = (over: Partial<HopMeasurement> & Pick<HopMeasurement, 'analyte'>): HopMeasurement => ({
  analyte: over.analyte, unit: 'percentMass', basis: 'unknown', kind: 'point', value: 8.6,
  confidence: 'medium', source: structuredClone(source), ...over,
});

function EditorHost({ initial = [], onSave = () => {} }: {
  initial?: HopMeasurement[];
  onSave?: (measurements: HopMeasurement[]) => void;
}) {
  const [measurements, setMeasurements] = useState(initial);
  const [saved, setSaved] = useState<HopMeasurement[] | null>(null);
  return <main>
    <HopFactsEditor value={measurements} sourceKind="coa" onChange={setMeasurements} />
    <div className="flex gap-2 py-3">
      <button type="button" onClick={() => {
        const snapshot = structuredClone(measurements);
        setSaved(snapshot); onSave(snapshot);
      }}>Enregistrer la fixture</button>
      <button type="button" disabled={!saved} onClick={() => setMeasurements(structuredClone(saved ?? []))}>
        Réouvrir la fixture
      </button>
    </div>
    <output data-testid="fixture-state">{JSON.stringify(measurements)}</output>
  </main>;
}

const current = (): HopMeasurement[] => JSON.parse(screen.getByTestId('fixture-state').textContent || '[]');
const group = (label: string) => within(screen.getByRole('group', { name: label }));
const select = (scope: ReturnType<typeof group>, label: string) => scope.getByLabelText(label);

describe('Qualification de la base dans l’éditeur de faits houblon', () => {
  it('ajoute sans prétendre connaître la base, permet le choix manuel et conserve la saisie au retour', async () => {
    const user = userEvent.setup(), onSave = vi.fn();
    render(<EditorHost onSave={onSave} />);
    await user.selectOptions(screen.getByLabelText('Ajouter une mesure'), 'alpha');
    expect(current()[0]).toMatchObject({ analyte: 'alpha', unit: 'percentMass', basis: 'unknown', kind: 'point', confidence: 'low', source: { kind: 'coa', reference: '' } });

    const alpha = group('Acides alpha');
    await user.selectOptions(select(alpha, 'Base de mesure'), 'asIs');
    expect(current()[0].basis).toBe('asIs');
    await user.selectOptions(select(alpha, 'Base de mesure'), 'dryMatter');
    const value = within(screen.getByRole('group', { name: 'Acides alpha' })).getByLabelText('Valeur');
    await user.type(value, '8.6');
    await user.tab();
    await user.type(screen.getByLabelText('Titre de la source'), 'Certificat saisi');
    await user.type(screen.getByLabelText('Auteur ou organisme'), 'Brasseur');
    await user.type(screen.getByLabelText('Référence ou URL'), 'fixture:manual-alpha');
    await user.selectOptions(select(group('Acides alpha'), 'Unité'), 'mg100g');

    const qualified = current()[0];
    expect(qualified).toMatchObject({ unit: 'mg100g', basis: 'dryMatter', kind: 'point', value: 8.6,
      source: { title: 'Certificat saisi', author: 'Brasseur', reference: 'fixture:manual-alpha', kind: 'coa' } });
    expect(hopMeasurementError(qualified)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Enregistrer la fixture' }));
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave.mock.calls[0][0][0]).toMatchObject({ value: 8.6, basis: 'dryMatter', source: { reference: 'fixture:manual-alpha' } });

    await user.selectOptions(select(group('Acides alpha'), 'Base de mesure'), 'asIs');
    await user.click(screen.getByRole('button', { name: 'Réouvrir la fixture' }));
    expect(current()[0]).toMatchObject({ value: 8.6, unit: 'mg100g', basis: 'dryMatter', source: { reference: 'fixture:manual-alpha' } });
    await user.selectOptions(screen.getByLabelText('Ajouter une mesure'), 'hsi');
    expect(current()[1]).toMatchObject({ analyte: 'hsi', unit: 'index', basis: 'unknown' });
    await user.selectOptions(select(group('Indice de stockage (HSI)'), 'Unité'), 'unknown');
    expect(current()[1]).toMatchObject({ unit: 'unknown', basis: 'unknown' });
  });

  it('préserve les bases compatibles et garde valeur, plage, non-détection et source lors du changement d’unité', async () => {
    const user = userEvent.setup();
    const original = [
      reading({ analyte: 'alpha', unit: 'percentMass', basis: 'dryMatter', value: 9.2, range: { min: 9, max: 9.4 } }),
      reading({ analyte: 'myrcene', unit: 'mg100g', basis: 'dryMatter', kind: 'range', value: undefined, range: { min: 1.1, max: 1.7 } }),
      reading({ analyte: '3mhaFree', unit: 'ugKgThiolEquivalent', basis: 'dryMatter', kind: 'below', value: undefined, range: undefined, limit: 6, limitKind: 'loq' }),
    ];
    render(<EditorHost initial={original} />);
    await user.selectOptions(select(group('Acides alpha'), 'Unité'), 'mg100g');
    await user.selectOptions(select(group('Myrcène'), 'Unité'), 'ugKg');
    await user.selectOptions(select(group('3SHA (3MHA) libre'), 'Unité'), 'ugKg');
    expect(current()).toEqual(JSON.parse(JSON.stringify([
      { ...original[0], unit: 'mg100g' },
      { ...original[1], unit: 'ugKg' },
      { ...original[2], unit: 'ugKg' },
    ])));
  });

  it('suit les unités dont le libellé qualifie la matrice, conserve les preuves, et réserve la base implicite aux vrais dénominateurs', async () => {
    const user = userEvent.setup();
    const original = [
      reading({ analyte: '4mmpFree', unit: 'ugKg', basis: 'dryMatter', value: 12, range: { min: 10, max: 14 } }),
      reading({ analyte: 'linalool', unit: 'ngL', basis: 'beer', value: 3, range: undefined }),
      reading({ analyte: 'humulene', unit: 'ugKg', basis: 'unknown', value: 4, range: undefined }),
      reading({ analyte: 'gammaNonalactone', unit: 'ugKg', basis: 'unknown', value: 6, range: undefined }),
      reading({ analyte: 'citronellol', unit: 'ugL', basis: 'beer', value: 15, range: { min: 14, max: 16 } }),
    ];
    render(<EditorHost initial={original} />);
    await user.selectOptions(select(group('4MMP libre'), 'Unité'), 'ugL');
    await user.selectOptions(select(group('Linalol'), 'Unité'), 'ugL');
    await user.selectOptions(select(group('Humulène'), 'Unité'), 'percentOil');
    await user.selectOptions(select(group('γ-Nonalactone'), 'Unité'), 'ugLInternalStandardEquivalent');
    await user.selectOptions(select(group('Citronellol'), 'Unité'), 'mg100g');
    expect(current()).toEqual(JSON.parse(JSON.stringify([
      { ...original[0], unit: 'ugL', basis: 'beer' },
      { ...original[1], unit: 'ugL', basis: 'beer' },
      { ...original[2], unit: 'percentOil', basis: 'oil' },
      { ...original[3], unit: 'ugLInternalStandardEquivalent', basis: 'unknown' },
      { ...original[4], unit: 'mg100g', basis: 'unknown' },
    ])));
    expect(current().slice(0, 3).map(hopMeasurementError)).toEqual([null, null, null]);
    expect(hopMeasurementError(current()[3])).toMatch(/matrice bière/);
    expect(hopMeasurementError(current()[4])).toBeNull();

    await user.selectOptions(select(group('γ-Nonalactone'), 'Base de mesure'), 'beer');
    expect(current()[3]).toMatchObject({ value: 6, unit: 'ugLInternalStandardEquivalent', basis: 'beer', source });
  });
});
