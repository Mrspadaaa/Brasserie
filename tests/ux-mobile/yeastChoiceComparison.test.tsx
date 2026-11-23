// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { applyYeastRecipeDesign, createYeastRecipeDraft, yeastRecipeCandidates } from '../../src/domain/yeastRecipeDesign';
import { yeastReferences } from '../../src/domain/yeastReferences';
import type { YeastRecipeCandidate } from '../../src/domain/yeastRecipeDesign';
import { YeastCandidatePicker } from '../../src/ui/YeastCandidatePicker';
import { YeastChoiceResults } from '../../src/ui/YeastChoiceComparison';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';

function realCandidates() {
  const recipe = yeastFlowRecipe();
  const refs = yeastReferences([]);
  const draft = createYeastRecipeDraft(recipe, refs);
  const candidates = yeastRecipeCandidates(draft.styleId, draft.goal, refs, recipe.volumeL, { includeOtherStyles: true });
  const selectedId = recipe.yeast.hopIndexId ?? candidates[0]?.yeastId;
  if (!selectedId || !candidates.some(candidate => candidate.yeastId === selectedId)) throw new Error('La fixture doit référencer une levure présente dans les références locales.');
  return { recipe, refs, draft, candidates, selectedId };
}

function missingCandidate(candidate: YeastRecipeCandidate, label = 'Référence aux données manquantes'): YeastRecipeCandidate {
  return {
    ...candidate,
    yeastId: 'fixture-levure-incomplete',
    label,
    form: undefined,
    temperature: undefined,
    descriptor: 'Caractère aromatique non documenté.',
    reference: { ...candidate.reference, id: 'fixture-levure-incomplete', name: label, form: undefined, catalogue: undefined },
    reason: 'Caractère aromatique non documenté.',
    evidence: { ...candidate.evidence, culture: 'yeast', descriptor: undefined, descriptorSource: undefined, goalReasons: {} },
  };
}

function renderedPicker(recipe: ReturnType<typeof yeastFlowRecipe>, onChange = vi.fn()) {
  const refs = yeastReferences([]), draft = createYeastRecipeDraft(recipe, refs);
  const candidates = yeastRecipeCandidates(draft.styleId, draft.goal, refs, recipe.volumeL, { includeOtherStyles: true });
  const selectedId = recipe.yeast.hopIndexId!;
  const onSelect = vi.fn();
  const onChoose = (yeastId: string, form?: YeastRecipeCandidate['form']) => {
    const nextDraft = createYeastRecipeDraft(recipe, refs, draft.styleId, yeastId);
    onChange(applyYeastRecipeDesign(recipe, { ...nextDraft, goal: draft.goal, form, formYeastId: yeastId }, refs, 'strain'));
  };
  const view = render(<YeastCandidatePicker candidates={candidates} styleId={draft.styleId} selectedId={selectedId} onSelect={onSelect}
    recipeChoice={{ volumeL: recipe.volumeL, onChoose }} />);
  return { view, refs, draft, candidates, selectedId, onSelect, onChange };
}

const resultList = () => screen.getByRole('list', { name: 'Références de levure à comparer' });
const rowOf = (id: string) => {
  const row = [...resultList().children].find((item): item is HTMLElement => item instanceof HTMLElement && item.dataset.candidateId === id);
  expect(row, id).toBeDefined();
  return row!;
};
const tryButton = (row: HTMLElement) => within(row).getByRole('button', { name: /^Essayer .* en local$/ });
const comparedTable = () => screen.getByRole('table', { name: 'Critères comparés pour chaque levure' });

describe('comparateur mobile des levures', () => {
  it('n’ajoute aucune alternative sans choix, puis garde la référence en colonne fixe et fait défiler plusieurs alternatives', async () => {
    const user = userEvent.setup();
    const { candidates, selectedId } = realCandidates();
    const onChoose = vi.fn();
    render(<YeastChoiceResults candidates={candidates} shown={candidates.slice(0, 6)} selectedId={selectedId} onChoose={onChoose} styleLabel="Blanche" />);

    expect(within(resultList()).getAllByRole('checkbox').some(box => (box as HTMLInputElement).checked)).toBe(false);
    expect(screen.queryByRole('button', { name: /^Comparer côte à côte/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    const baseline = candidates.find(candidate => candidate.yeastId === selectedId)!;
    const alternatives = candidates.slice(0, 6).filter(candidate => candidate.yeastId !== selectedId).slice(0, 3);
    expect(alternatives).toHaveLength(3);
    for (const candidate of alternatives) await user.click(within(rowOf(candidate.yeastId)).getByRole('checkbox'));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Comparer côte à côte · 3 alternatives' }));

    const comparison = screen.getByRole('region', { name: 'Comparaison des levures' });
    const scroller = within(comparison).getByRole('region', { name: 'Colonnes comparées' });
    expect(scroller).toHaveAttribute('tabindex', '0');
    const table = within(scroller).getByRole('table', { name: 'Critères comparés pour chaque levure' });
    const heads = [...table.querySelectorAll<HTMLElement>('thead th')];
    expect(heads.map(head => head.dataset.role)).toEqual(['reference', 'alternative', 'alternative', 'alternative']);
    expect(heads[0]).toHaveTextContent(baseline.label); expect(heads[0]).toHaveTextContent('Référence');
    expect(heads.slice(1).map(head => head.dataset.candidateId)).toEqual(alternatives.map(candidate => candidate.yeastId));
    for (const criterion of ['Caractère documenté', 'Forme', 'Température publiée', 'Atténuation annoncée', 'Usage pour Blanche']) {
      const group = within(table).getByRole('rowgroup', { name: criterion });
      expect(group.querySelector('td[data-role="reference"]'), criterion).not.toBeNull();
      expect(group.querySelectorAll('td[data-candidate-id]'), criterion).toHaveLength(3);
      expect(group.querySelector('.yc-criterion'), criterion).not.toHaveTextContent(baseline.label);
    }
    expect(screen.queryByText(/Dose sèche|disponibilité commerciale|score global/i)).not.toBeInTheDocument();

    const sourceDetails = table.querySelector(`td[data-candidate-id="${alternatives[0].yeastId}"][data-comparison-row="details"] summary`);
    expect(sourceDetails).toHaveAttribute('aria-label', expect.stringMatching(/^Voir source et conditions de /));
    fireEvent.click(sourceDetails!);
    expect(within(table).getAllByRole('link', { name: /^Source/ }).length).toBeGreaterThan(0);

    expect(within(comparison).getByText('Alternative 1/3')).toBeInTheDocument();
    await user.click(within(comparison).getByRole('button', { name: 'Alternative suivante' }));
    expect(within(comparison).getByText('Alternative 2/3')).toBeInTheDocument();

    await user.click(within(heads[2]).getByRole('button', { name: /^Retirer .* de la comparaison$/ }));
    expect([...table.querySelectorAll<HTMLElement>('thead th[data-role="alternative"]')].map(head => head.dataset.candidateId))
      .toEqual([alternatives[0].yeastId, alternatives[2].yeastId]);
    expect(within(rowOf(alternatives[1].yeastId)).getByRole('checkbox')).not.toBeChecked();
    expect(onChoose).not.toHaveBeenCalled();

    const choose = tryButton(rowOf(alternatives[0].yeastId));
    choose.focus();
    await user.keyboard('{Enter}');
    expect(onChoose).toHaveBeenCalledExactlyOnceWith(alternatives[0].yeastId, alternatives[0].reference.form);
  });

  it('montre forme et plage absentes comme inconnues sans rien déduire du nom de la souche', async () => {
    const user = userEvent.setup();
    const { candidates, selectedId } = realCandidates();
    const baseline = candidates.find(candidate => candidate.yeastId === selectedId)!;
    const pool = candidates.filter(candidate => candidate.yeastId !== selectedId && candidate.styleMatch !== 'excluded'
      && candidate.evidence.culture !== 'bacteria' && candidate.evidence.culture !== 'other-fermentation');
    const [missingSource, other] = pool;
    // The name evokes a cold lager: neither temperature nor form may be inferred from it.
    const missing = missingCandidate(missingSource, 'Lager froide de Bavière sans fiche');
    render(<YeastChoiceResults candidates={[baseline, missing, other]} shown={[missing, other]} selectedId={selectedId} onChoose={vi.fn()} />);

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await user.click(within(rowOf(missing.yeastId)).getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Comparer côte à côte · 1 alternative' }));
    const cell = (criterion: string) => within(comparedTable()).getByRole('rowgroup', { name: criterion })
      .querySelector<HTMLElement>(`td[data-candidate-id="${missing.yeastId}"]`)!;
    expect(cell('Forme')).toHaveTextContent('Forme non publiée');
    expect(cell('Forme')).toHaveTextContent('Écart de forme inconnu');
    expect(cell('Température publiée')).toHaveTextContent('Plage non publiée');
    expect(cell('Température publiée')).toHaveTextContent('Écart inconnu');
    expect(cell('Température publiée').textContent).not.toMatch(/\d\s*°C/);
    expect(cell('Température publiée').querySelector('.yc-range')).toBeNull();
    expect(cell('Caractère documenté')).toHaveTextContent('Inconnu');
  });

  it('transmet identité et forme au callback recette seulement au bouton, sans reprendre les données de l’ancienne souche', async () => {
    const user = userEvent.setup();
    const recipe = yeastFlowRecipe();
    recipe.yeast = { ...recipe.yeast, stockItemRef: 'Y-ANCIEN', qty: 12, unit: 'g', notes: 'Lot de l’ancienne souche', attenuationPct: 80 };
    const startedBatchSnapshot = structuredClone(recipe);
    const onChange = vi.fn();
    const { candidates, selectedId } = renderedPicker(recipe, onChange);
    const unknownForm = candidates.find(candidate => candidate.yeastId !== selectedId && candidate.styleMatch === 'documented' && !candidate.reference.form);
    expect(unknownForm).toBeDefined();

    const search = screen.getByRole('searchbox', { name: 'Rechercher une levure' });
    await user.type(search, unknownForm!.label);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Vider' })).not.toBeInTheDocument();
    await user.click(within(rowOf(unknownForm!.yeastId)).getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Comparer côte à côte · 1 alternative' }));
    expect(onChange).not.toHaveBeenCalled();
    const detailsCell = comparedTable().querySelector(`td[data-candidate-id="${unknownForm!.yeastId}"][data-comparison-row="details"]`) as HTMLElement;
    fireEvent.click(detailsCell.querySelector('summary') as HTMLElement);
    const formSelect = within(detailsCell).getByLabelText('Forme du produit pour ce choix');
    await user.selectOptions(formSelect, 'sèche');
    expect(onChange).not.toHaveBeenCalled();

    await user.click(tryButton(rowOf(unknownForm!.yeastId)));
    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0];
    expect(updated.yeast).toMatchObject({ hopIndexId: unknownForm!.yeastId, form: 'sèche' });
    expect(updated.yeast.qty).toBeUndefined();
    expect(updated.yeast.unit).toBeUndefined();
    expect(updated.yeast.stockItemRef).toBeUndefined();
    expect(updated.yeast.notes).toBeUndefined();
    expect(updated.yeast.attenuationPct).toBeUndefined();
    expect(recipe.yeast).toMatchObject({ stockItemRef: 'Y-ANCIEN', qty: 12, unit: 'g' });
    expect(startedBatchSnapshot.yeast).toMatchObject({ stockItemRef: 'Y-ANCIEN', qty: 12, hopIndexId: selectedId });
  });

  it('attend une recherche en style libre et n’ouvre le côte à côte que sur demande', async () => {
    const user = userEvent.setup();
    const { recipe, candidates, selectedId } = realCandidates();
    const onSelect = vi.fn(), onChoose = vi.fn();
    render(<YeastCandidatePicker candidates={candidates} styleId="unknown" selectedId={selectedId} onSelect={onSelect}
      recipeChoice={{ volumeL: recipe.volumeL, onChoose }} />);

    expect(screen.queryByRole('table', { name: 'Critères comparés pour chaque levure' })).not.toBeInTheDocument();
    const search = screen.getByRole('searchbox', { name: 'Rechercher une levure' });
    await user.type(search, 'Hefeweizen');
    await user.click(screen.getAllByRole('checkbox', { name: /^Comparer / })[0]);
    expect(screen.queryByRole('table', { name: 'Critères comparés pour chaque levure' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Comparer côte à côte · 1 alternative' }));
    const table = await screen.findByRole('table', { name: 'Critères comparés pour chaque levure' });
    expect([...table.querySelectorAll<HTMLElement>('thead th')].map(head => head.dataset.role)).toEqual(['reference', 'alternative']);
    expect(document.querySelector('.yeast-candidates')).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled(); expect(onChoose).not.toHaveBeenCalled();
  });

  it('distingue deux fiches homonymes sans les fusionner, dans la recherche comme dans le côte à côte', async () => {
    const user = userEvent.setup();
    const { recipe, candidates, selectedId } = realCandidates();
    const original = candidates.find(candidate => candidate.yeastId !== selectedId && !!candidate.reference.form && candidate.styleMatch !== 'excluded')!;
    const otherForm = original.reference.form === 'sèche' ? 'liquide' : 'sèche';
    const twinId = `${original.yeastId}-autre-lot`;
    const twin: YeastRecipeCandidate = { ...original, yeastId: twinId, form: otherForm, reference: { ...original.reference, id: twinId, form: otherForm } };
    const onChoose = vi.fn();
    render(<YeastCandidatePicker candidates={[...candidates, twin]} styleId="unknown" selectedId={selectedId} onSelect={vi.fn()}
      recipeChoice={{ volumeL: recipe.volumeL, onChoose }} />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher une levure' }), { target: { value: original.label } });

    const rows = [rowOf(original.yeastId), rowOf(twinId)];
    const hints = rows.map(row => row.querySelector('.yc-homonym')?.textContent ?? '');
    expect(hints.every(hint => hint.startsWith('Même nom qu’une autre fiche · '))).toBe(true);
    expect(new Set(hints).size).toBe(2);
    expect(hints[1]).toContain(otherForm);
    expect(new Set(rows.map(row => tryButton(row).getAttribute('aria-label'))).size).toBe(2);

    for (const row of rows) await user.click(within(row).getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Comparer côte à côte · 2 alternatives' }));
    const heads = [...comparedTable().querySelectorAll<HTMLElement>('thead th[data-role="alternative"]')];
    expect(heads.map(head => head.dataset.candidateId)).toEqual([original.yeastId, twinId]);
    expect(heads.map(head => head.querySelector('.yc-homonym')?.textContent)).toEqual(hints.map(hint => hint.replace('Même nom qu’une autre fiche · ', '')));
    await user.click(tryButton(rowOf(twinId)));
    expect(onChoose).toHaveBeenCalledExactlyOnceWith(twinId, otherForm);
  });
});
