import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PreparedBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import type { BrewingScenarioBranchRequest } from '../../src/domain/brewingScenario';
import { BiologicalInputsEditor } from '../../src/ui/hopV55/BiologicalInputsEditor';

const prepared = {
  version: 'brewing-scenario-context-v1',
  runtime: { engineData: { varieties: [], lots: [], knowledge: [] }, materials: [] },
  limitations: [], provenance: [],
} as unknown as PreparedBrewingScenarioContext;

describe('éditeur des entrées biologiques', () => {
  it('crée une branche si nécessaire, garde les quantités vides comme inconnues et soumet uniquement après ajout explicite', async () => {
    const user = userEvent.setup();
    const onRevise = vi.fn();
    const view = render(<BiologicalInputsEditor prepared={prepared} onRevise={onRevise} />);
    const firstForm = within(view.container.querySelector('form')!);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Type de contribution biologique' }), 'yeastOwnProducts');
    expect(screen.getByText(/Produit propre de la levure · quantité déclarée/)).toBeInTheDocument();
    expect(onRevise).not.toHaveBeenCalled();
    await user.type(firstForm.getByLabelText(/^Analyte · Produit propre de la levure/), 'ester de travail');
    await user.type(firstForm.getByLabelText(/^Unité · Produit propre de la levure/), 'mg/L');
    await user.type(firstForm.getByLabelText(/^Base · Produit propre de la levure/), 'bière conditionnée');
    await user.type(firstForm.getByLabelText(/^Minimum · Produit propre de la levure/), '2,5');
    await user.type(firstForm.getByLabelText(/^Maximum · Produit propre de la levure/), '4,5');
    await user.type(firstForm.getByLabelText(/^Pourquoi cette quantité/), 'Déclaration de travail pour comparer les branches.');
    await user.click(firstForm.getByRole('radio', { name: 'Déclaration personnelle · Produit propre' }));
    await user.type(firstForm.getByLabelText(/^Libellé de la déclaration · Produit propre/), 'Déclaration du brasseur');
    await user.type(firstForm.getByLabelText(/^Auteur de la déclaration · Produit propre/), 'Brasseur fixture');
    await user.type(firstForm.getByLabelText(/^Conditions d’application/), 'Sous le procédé déclaré.');
    await user.type(firstForm.getByLabelText(/^Limites de l’hypothèse/), 'Pas une mesure de bière.');
    await user.click(screen.getByRole('button', { name: 'Ajouter et recalculer la branche' }));

    await waitFor(() => expect(onRevise).toHaveBeenCalledTimes(1));
    const first = onRevise.mock.calls[0][0] as BrewingScenarioBranchRequest;
    expect(first.id).not.toBe('baseline');
    expect(first.biologicalInputs?.[0]).toMatchObject({
      kind: 'yeastOwnProducts',
      amount: {
        analyte: 'ester de travail', unit: 'mg/L', basis: 'bière conditionnée',
        range: { min: 2.5, max: 4.5 }, origin: 'userHypothesis',
      },
    });
    const firstAmount = first.biologicalInputs?.[0];
    expect(firstAmount?.kind === 'yeastOwnProducts' ? firstAmount.amount : null).not.toHaveProperty('value');
    expect(firstAmount?.kind === 'yeastOwnProducts' ? firstAmount.amount : null).not.toHaveProperty('central');
    expect(firstAmount?.kind === 'yeastOwnProducts' ? firstAmount.amount : null).not.toHaveProperty('matrixId');
    expect(firstAmount?.kind === 'yeastOwnProducts' ? firstAmount.amount : null).not.toHaveProperty('timepoint');
    expect(first.biologicalInputs?.[0]?.kind === 'yeastOwnProducts'
      ? first.biologicalInputs[0].amount.sourceRefs[0]
      : null).toMatchObject({ kind: 'judgment', year: null, author: 'Brasseur fixture' });
    expect(first.assumptions).toHaveLength(1);
    expect(first.assumptions[0]).toMatchObject({ status: 'selected', origin: 'userHypothesis', range: { min: 2.5, max: 4.5 } });
    expect(screen.getByRole('status')).toHaveTextContent('Révision de prévision transmise au scénario');
    expect(screen.getByText(/Aucune entrée biologique déclarée/)).toBeInTheDocument();

    view.rerender(<BiologicalInputsEditor prepared={prepared} branch={first} onRevise={onRevise} />);
    const secondForm = within(view.container.querySelector('form')!);
    expect(screen.getByText(/Déclaration du brasseur · Brasseur fixture/)).toBeInTheDocument();
    expect(screen.getByText(/Hypothèse utilisateur/)).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Type de contribution biologique' }), 'hopPrecursorTransformation');
    await user.type(secondForm.getByLabelText(/^Analyte · Quantité du précurseur/), 'précurseur lié');
    await user.type(secondForm.getByLabelText(/^Unité · Quantité du précurseur/), 'mg/kg');
    await user.type(secondForm.getByLabelText(/^Base · Quantité du précurseur/), 'produit de houblon');
    await user.type(secondForm.getByLabelText(/^Minimum · Quantité du précurseur/), '1');
    await user.type(secondForm.getByLabelText(/^Maximum · Quantité du précurseur/), '3');
    await user.type(secondForm.getByLabelText(/^Pourquoi cette quantité/), 'Source à convertir explicitement.');
    await user.click(secondForm.getByRole('radio', { name: 'Déclaration personnelle · Précurseur' }));
    await user.type(secondForm.getByLabelText(/^Libellé de la déclaration · Précurseur/), 'Précurseur fourni');
    await user.type(secondForm.getByLabelText(/^Auteur de la déclaration · Précurseur/), 'Brasseur fixture');
    await user.type(secondForm.getByLabelText(/^Analyte produit/), 'composé libre');
    await user.type(secondForm.getByLabelText(/^Unité produit/), 'mg/L');
    await user.type(secondForm.getByLabelText(/^Base produit/), 'bière');
    await user.type(secondForm.getByLabelText(/^Minimum · Fraction de conversion/), '0,1');
    await user.type(secondForm.getByLabelText(/^Maximum · Fraction de conversion/), '0,2');
    await user.type(secondForm.getByLabelText(/^Pourquoi cette fraction/), 'Fraction déclarée.');
    await user.click(secondForm.getByRole('radio', { name: 'Déclaration personnelle · Fraction de conversion' }));
    await user.type(secondForm.getByLabelText(/^Libellé de la déclaration · Fraction de conversion/), 'Conversion fraction');
    await user.type(secondForm.getByLabelText(/^Auteur de la déclaration · Fraction de conversion/), 'Brasseur fixture');
    await user.type(secondForm.getByLabelText(/^Conditions d’application/), 'Conditions précisées.');
    await user.type(secondForm.getByLabelText(/^Limites de l’hypothèse/), 'Sans rapport molaire, sortie inconnue.');
    expect(screen.getByText(/Sans rapport exact entre les deux analytes\/unités/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ajouter et recalculer la branche' }));
    await waitFor(() => expect(onRevise).toHaveBeenCalledTimes(2));

    const second = onRevise.mock.calls[1][0] as BrewingScenarioBranchRequest;
    expect(second.biologicalInputs).toHaveLength(2);
    expect(second.biologicalInputs?.[0]).toEqual(first.biologicalInputs?.[0]);
    expect(second.biologicalInputs?.[1]).toMatchObject({
      kind: 'hopPrecursorTransformation',
      productAnalyte: 'composé libre',
      productUnit: 'mg/L',
      conversionFraction: { unit: 'fraction', range: { min: 0.1, max: 0.2 }, origin: 'userHypothesis' },
    });
    expect(second.biologicalInputs?.[1]?.kind === 'hopPrecursorTransformation'
      ? second.biologicalInputs[1].conversionRatio
      : 'missing-kind').toBeUndefined();
    expect(second.assumptions).toHaveLength(3);
  });

  it('exige une matrice et un temps cibles explicites pour le transfert', async () => {
    const user = userEvent.setup();
    const onRevise = vi.fn();
    const view = render(<BiologicalInputsEditor prepared={prepared} onRevise={onRevise} />);
    const form = within(view.container.querySelector('form')!);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Type de contribution biologique' }), 'compoundTransferLoss');
    await user.type(form.getByLabelText(/^Analyte · Quantité à transférer/), 'composé source');
    await user.type(form.getByLabelText(/^Unité · Quantité à transférer/), 'mg/kg');
    await user.type(form.getByLabelText(/^Base · Quantité à transférer/), 'produit de houblon');
    await user.type(form.getByLabelText(/^Minimum · Quantité à transférer/), '10');
    await user.type(form.getByLabelText(/^Maximum · Quantité à transférer/), '20');
    await user.type(form.getByLabelText(/^Pourquoi cette quantité/), 'Quantité source explicitement déclarée.');
    await user.click(form.getByRole('radio', { name: 'Déclaration personnelle · Quantité source' }));
    await user.type(form.getByLabelText(/^Libellé de la déclaration · Quantité source/), 'Matière de départ');
    await user.type(form.getByLabelText(/^Auteur de la déclaration · Quantité source/), 'Brasseur fixture');

    const extraction = within(screen.getByText('Fraction d’extraction · facteur fractionnaire').closest('fieldset')!);
    await user.type(extraction.getByLabelText(/^Minimum · Fraction d’extraction/), '0,2');
    await user.type(extraction.getByLabelText(/^Maximum · Fraction d’extraction/), '0,5');
    await user.type(extraction.getByLabelText(/^Pourquoi cette fraction/), 'Extraction dépendante du procédé.');
    await user.click(extraction.getByRole('radio', { name: 'Déclaration personnelle · Extraction' }));
    await user.type(extraction.getByLabelText(/^Libellé de la déclaration · Extraction/), 'Essai extraction');
    await user.type(extraction.getByLabelText(/^Auteur de la déclaration · Extraction/), 'Brasseur fixture');

    const retention = within(screen.getByText('Fraction de rétention · facteur fractionnaire').closest('fieldset')!);
    await user.type(retention.getByLabelText(/^Minimum · Fraction de rétention/), '0,5');
    await user.type(retention.getByLabelText(/^Maximum · Fraction de rétention/), '0,8');
    await user.type(retention.getByLabelText(/^Pourquoi cette fraction/), 'Rétention dépendante de la matrice.');
    await user.click(retention.getByRole('radio', { name: 'Déclaration personnelle · Rétention' }));
    await user.type(retention.getByLabelText(/^Libellé de la déclaration · Rétention/), 'Essai rétention');
    await user.type(retention.getByLabelText(/^Auteur de la déclaration · Rétention/), 'Brasseur fixture');

    await user.type(form.getByLabelText(/^Conditions d’application/), 'Sous les conditions déclarées.');
    await user.type(form.getByLabelText(/^Limites de l’hypothèse/), 'Aucune mesure de la bière n’est rapportée.');
    expect(form.getByLabelText(/^Matrice cible/)).toHaveValue('');
    expect(form.getByLabelText(/^Point temporel cible/)).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Ajouter et recalculer la branche' }));
    expect(onRevise).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Matrice cible');

    await user.type(form.getByLabelText(/^Matrice cible/), 'biere-conditionnee');
    await user.type(form.getByLabelText(/^Point temporel cible/), 'après conditionnement');
    await user.click(screen.getByRole('button', { name: 'Ajouter et recalculer la branche' }));
    await waitFor(() => expect(onRevise).toHaveBeenCalledTimes(1));
    expect(onRevise.mock.calls[0][0].biologicalInputs?.[0]).toMatchObject({
      kind: 'compoundTransferLoss',
      extractionFraction: { range: { min: 0.2, max: 0.5 }, unit: 'fraction', origin: 'userHypothesis', fromAnalyte: 'composé source', toAnalyte: 'composé source', fromUnit: 'mg/kg', toUnit: 'mg/kg' },
      retentionFraction: { range: { min: 0.5, max: 0.8 }, unit: 'fraction', origin: 'userHypothesis', fromAnalyte: 'composé source', toAnalyte: 'composé source', fromUnit: 'mg/kg', toUnit: 'mg/kg' },
      targetMatrixId: 'biere-conditionnee',
      targetTimepoint: 'après conditionnement',
    });
  });
});
