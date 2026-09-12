import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YeastCandidatePicker } from '../../src/ui/YeastCandidatePicker';
import { yeastRecipeCandidates, type YeastRecipeCandidate } from '../../src/domain/yeastRecipeDesign';
import { yeastReferences } from '../../src/domain/yeastReferences';

const us05 = yeastRecipeCandidates('clean-ale', 'balanced', yeastReferences().filter(row => row.id === 'fermentis-us05'), 20)[0];
type CandidateOptions = { lab?: string; form?: YeastRecipeCandidate['reference']['form']; styleMatch?: YeastRecipeCandidate['styleMatch'] };
function candidate(index: number, options: CandidateOptions = {}): YeastRecipeCandidate {
  const lab = options.lab ?? 'Laboratoire Alpha', form = Object.hasOwn(options, 'form') ? options.form : 'sèche';
  const id = `picker-culture-${index}`, label = `Culture ${String(index).padStart(2, '0')}`;
  const { form: _form, ...reference } = us05.reference;
  return {
    ...us05, yeastId: id, label, lab, form, preferred: false, styleMatch: options.styleMatch ?? 'documented',
    descriptor: 'Caractère de la fiche de contrôle.',
    reference: {
      ...reference, id, name: label, aliases: [], ...(form ? { form } : {}),
      catalogue: { ...reference.catalogue!, manufacturer: lab, productCode: `P${index}`, aliases: [], categories: [], facts: [] }
    }
  };
}
const rows = () => Array.from({ length: 13 }, (_, index) => candidate(index + 1));
const visibleChoices = () => screen.queryAllByRole('radio', { name: /^Comparer / });
const search = () => screen.getByRole('searchbox', { name: 'Rechercher une levure' });
const laboratory = () => screen.getByRole('combobox', { name: 'Laboratoire à comparer' });
const productForm = () => screen.getByRole('combobox', { name: 'Forme à comparer' });

beforeEach(() => {
  // Exercise the real Input's touch-device textarea, not a mocked text field.
  vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
    matches: query === '(pointer: coarse)', media: query, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false
  }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Parcours du sélecteur de candidats levure', () => {
  it('place US-05 avant les occurrences dans des faits et des identifiants techniques', async () => {
    const decoys = Array.from({ length: 7 }, (_, index) => candidate(index + 1));
    for (const decoy of decoys) decoy.reference.catalogue!.facts = [{
      key: 'application', label: 'Comparaison documentaire', reported: 'Essai comparatif avec US-05.', source: us05.reference.source
    }];
    decoys[0].reference.id = decoys[0].yeastId = 'technical-reference-us-05-comparison';
    const onSelect = vi.fn(), user = userEvent.setup();
    render(<YeastCandidatePicker candidates={[...decoys, us05]} styleId="clean-ale" selectedId="" onSelect={onSelect} />);
    expect(search().tagName).toBe('TEXTAREA');
    await user.type(search(), 'US-05');
    expect(screen.getByRole('status')).toHaveTextContent('8 références');
    expect(visibleChoices()).toHaveLength(6);
    expect(visibleChoices()[0]).toHaveAccessibleName(`Comparer ${us05.label}`);
    expect(onSelect).not.toHaveBeenCalled();
    await user.click(visibleChoices()[0]);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('fermentis-us05');
  });

  it('trouve un code fabricant même si le nom de la fiche a été personnalisé', async () => {
    const renamed = candidate(1);
    renamed.reference.catalogue!.productCode = 'US-05';
    const onSelect = vi.fn(), user = userEvent.setup();
    render(<YeastCandidatePicker candidates={[renamed]} styleId="clean-ale" selectedId="" onSelect={onSelect} />);
    await user.type(search(), 'US-05');
    expect(screen.getByRole('radio', { name: `Comparer ${renamed.label}` })).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('combine laboratoire et forme sans assimiler une forme inconnue à une levure sèche', async () => {
    const onSelect = vi.fn(), user = userEvent.setup();
    const candidates = [candidate(1), candidate(2, { form: 'liquide' }), candidate(3, { lab: 'Laboratoire Bêta' }),
      candidate(4, { lab: 'Laboratoire Bêta', form: 'liquide' }), candidate(5, { form: undefined }), candidate(6, { form: 'levain' })];
    render(<YeastCandidatePicker candidates={candidates} styleId="clean-ale" selectedId="" onSelect={onSelect} />);
    await user.selectOptions(laboratory(), 'Laboratoire Bêta');
    await user.selectOptions(productForm(), 'liquide');
    expect(visibleChoices()).toHaveLength(1);
    expect(visibleChoices()[0]).toHaveAccessibleName('Comparer Culture 04');
    await user.selectOptions(laboratory(), '');
    await user.selectOptions(productForm(), 'unknown');
    expect(visibleChoices()).toHaveLength(1);
    expect(visibleChoices()[0]).toHaveAccessibleName('Comparer Culture 05');
    expect(screen.getByText('Laboratoire Alpha · forme à préciser')).toBeInTheDocument();
    await user.selectOptions(productForm(), 'levain');
    expect(visibleChoices()[0]).toHaveAccessibleName('Comparer Culture 06');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('pagine par six références et ne sélectionne rien pendant la navigation', async () => {
    const onSelect = vi.fn(), user = userEvent.setup();
    render(<YeastCandidatePicker candidates={rows()} styleId="clean-ale" selectedId="" onSelect={onSelect} />);
    expect(visibleChoices()).toHaveLength(6);
    expect(screen.getByText('1–6 / 13')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Précédentes' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Suivantes' }));
    expect(visibleChoices()).toHaveLength(6);
    expect(visibleChoices()[0]).toHaveAccessibleName('Comparer Culture 07');
    expect(screen.getByText('7–12 / 13')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Suivantes' }));
    expect(visibleChoices()).toHaveLength(1);
    expect(visibleChoices()[0]).toHaveAccessibleName('Comparer Culture 13');
    expect(screen.getByText('13–13 / 13')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Suivantes' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Précédentes' }));
    expect(screen.getByText('7–12 / 13')).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it.each(['documented', 'unclassified'] as const)('retrouve une sélection %s hors page ou masquée sans la remplacer', async styleMatch => {
    const candidates = [...rows().slice(0, 12), candidate(13, { lab: 'Laboratoire Bêta', form: 'liquide', styleMatch })];
    const selectedId = candidates[12].yeastId, onSelect = vi.fn(), user = userEvent.setup();
    render(<YeastCandidatePicker candidates={candidates} styleId="clean-ale" selectedId={selectedId} onSelect={onSelect} />);
    expect(screen.getByText(/Scénario conservé : Culture 13/)).toBeInTheDocument();
    await user.selectOptions(laboratory(), 'Laboratoire Alpha');
    await user.selectOptions(productForm(), 'sèche');
    await user.type(search(), 'aucun résultat');
    expect(screen.getByText(/Aucune référence avec ces filtres/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Afficher sa ligne' }));
    expect(search()).toHaveValue('');
    expect(laboratory()).toHaveValue('');
    expect(productForm()).toHaveValue('');
    expect(screen.getByRole('radio', { name: 'Comparer Culture 13' })).toBeChecked();
    const scope = screen.getByRole('radiogroup', { name: 'Étendue de la recherche de levure' });
    expect(within(scope).getByRole('radio', { name: styleMatch === 'documented' ? /Style documenté/ : /Tout le catalogue/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByRole('button', { name: 'Afficher sa ligne' })).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('préserve le choix explicite quand une recherche le masque puis que les filtres sont effacés', async () => {
    const candidates = rows(), onSelect = vi.fn(), user = userEvent.setup();
    function Host() {
      const [selectedId, setSelectedId] = useState('');
      return <YeastCandidatePicker candidates={candidates} styleId="clean-ale" selectedId={selectedId}
        onSelect={id => { onSelect(id); setSelectedId(id); }} />;
    }
    render(<Host />);
    await user.click(screen.getByRole('radio', { name: 'Comparer Culture 02' }));
    expect(screen.getByRole('radio', { name: 'Comparer Culture 02' })).toBeChecked();
    await user.type(search(), 'Culture 13');
    expect(screen.getByText(/Scénario conservé : Culture 02/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Comparer Culture 13' })).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Effacer les filtres' }));
    expect(screen.getByRole('radio', { name: 'Comparer Culture 02' })).toBeChecked();
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('picker-culture-2');
  });

  it('efface tous les filtres et revient à la première page en conservant la portée et le scénario', async () => {
    const candidates = rows(), onSelect = vi.fn(), user = userEvent.setup();
    render(<YeastCandidatePicker candidates={candidates} styleId="clean-ale" selectedId={candidates[1].yeastId} onSelect={onSelect} />);
    await user.click(screen.getByRole('radio', { name: /Tout le catalogue/ }));
    await user.selectOptions(laboratory(), 'Laboratoire Alpha');
    await user.selectOptions(productForm(), 'sèche');
    await user.type(search(), 'Culture');
    await user.click(screen.getByRole('button', { name: 'Suivantes' }));
    expect(screen.getByText('7–12 / 13')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Effacer les filtres' }));
    expect(search()).toHaveValue('');
    expect(laboratory()).toHaveValue('');
    expect(productForm()).toHaveValue('');
    expect(screen.getByText('1–6 / 13')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Tout le catalogue/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Comparer Culture 02' })).toBeChecked();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('garde un état vide corrigeable et permet de chercher hors de la famille documentée', async () => {
    const onSelect = vi.fn(), user = userEvent.setup(), outside = candidate(1, { styleMatch: 'unclassified' });
    const view = render(<YeastCandidatePicker candidates={[outside]} styleId="clean-ale" selectedId="" onSelect={onSelect} />);
    expect(screen.getByRole('status')).toHaveTextContent('0 référence');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Chercher dans tout le catalogue' }));
    expect(screen.getByRole('radio', { name: 'Comparer Culture 01' })).toBeInTheDocument();
    expect(screen.getByText('Style à confirmer')).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
    view.rerender(<YeastCandidatePicker candidates={[]} styleId="unknown" selectedId="" onSelect={onSelect} />);
    expect(screen.getByText(/Aucune référence avec ces filtres/)).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    await user.type(search(), 'US-05');
    await user.click(screen.getByRole('button', { name: 'Effacer les filtres' }));
    expect(search()).toHaveValue('');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('change la portée au clavier avec le SegmentedControl réel, sans changer de souche', () => {
    const onSelect = vi.fn();
    render(<YeastCandidatePicker candidates={[candidate(1), candidate(2, { styleMatch: 'unclassified' })]} styleId="clean-ale" selectedId="picker-culture-1" onSelect={onSelect} />);
    const style = screen.getByRole('radio', { name: /Style documenté/ });
    style.focus(); fireEvent.keyDown(style, { key: 'ArrowRight' });
    const catalogue = screen.getByRole('radio', { name: /Tout le catalogue/ });
    expect(catalogue).toHaveFocus();
    expect(catalogue).toHaveAttribute('aria-checked', 'true');
    expect(visibleChoices()).toHaveLength(2);
    expect(screen.getByRole('radio', { name: 'Comparer Culture 01' })).toBeChecked();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
