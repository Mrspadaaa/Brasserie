import React, { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { NoloBrewTools } from '../../src/ui/NoloBrewTools';
import { evaluateNoloRecipe, noloInput, noloRecipeForBatch, noloScenarioInput, noloScience } from '../../src/domain/nolo';
import { noloScenarioBasis } from '../../functions/src/noloScenario';
import { noloToolContext } from '../../src/domain/noloToolContext';
import { assertNoloConfig } from '../../functions/src/noloSchema';
import { readRecipeFields, readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { fruty } from '../fixtures/fruty';
import type { Recipe, Batch } from '../../src/types';

afterEach(cleanup);
const science = noloScience()!;
const fixture = () => {
  const r = fruty(true);
  r.volumeL = 20; r.hops = [];
  r.nolo!.targetAbvPct = .4;
  r.nolo!.brewTools = { version: 1, baseMode: 'hypothesis', baseAbvPct: { min: .6, max: .6 } };
  return r;
};
const fill = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const tab = (name: string) => fireEvent.click(screen.getByRole('tab', { name }));
function mount(initial = fixture()) {
  if (initial.nolo?.brewTools?.baseAbvPct) initial.nolo.brewTools.baseBasis = noloToolContext(initial);
  let latest = initial;
  function Host() {
    const [recipe, setRecipe] = useState(initial); latest = recipe;
    return <NoloBrewTools recipe={recipe} onChange={r => setRecipe(r as Recipe)} science={science} saved={[]} result={evaluateNoloRecipe(recipe)}/>;
  }
  render(<Host/>);
  return () => latest;
}

describe('outils NOLO dans le brouillon', () => {
  it('compare les huit voies sans changer le procédé avant application', () => {
    const original = fixture(), latest = mount(original);
    expect(within(screen.getByLabelText('Procédé à comparer')).getAllByRole('option')).toHaveLength(8);
    for (const process of ['lowExtract', 'coldContact', 'restored', 'coldExtraction', 'secondRunnings', 'dealcoholized', 'arrested']) {
      fill('Procédé à comparer', process);
      expect(latest().nolo!.process).toBe('restricted');
      expect(latest().yeast).toEqual(original.yeast);
    }
    fill('Densité d’arrêt à comparer minimum', '1,020'); fill('Densité d’arrêt à comparer maximum', '1,022');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer ce procédé' }));
    expect(latest().nolo!.process).toBe('arrested');
    expect(latest().nolo!.planning?.stopSg).toEqual({ min: 1.02, max: 1.022 });
    expect(latest().fermentables).toEqual(original.fermentables);
  });

  it('dimensionne le moût avec saisie française, puis applique et exporte les quantités', () => {
    const original = fixture(), latest = mount(original); tab('Moût');
    fill('Atténuation envisagée minimum', '13'); fill('Atténuation envisagée maximum', '20');
    fill(/Réserve au volume de base/, '0,1');
    fireEvent.click(screen.getByRole('button', { name: 'Essayer l’OG limite' }));
    expect(latest().fermentables).toEqual(original.fermentables);
    expect(screen.getByLabelText('Quantités de fermentescibles avant et après')).toHaveTextContent('Malt Maris Otter');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer ces quantités' }));
    expect(latest().fermentables[0].weightKg).toBeLessThan(original.fermentables[0].weightKg);
    expect(latest().fermentables[1].weightKg / latest().fermentables[0].weightKg).toBeCloseTo(1.9);
    expect(latest().waterPlan).toEqual(original.waterPlan);
    expect(latest().nolo!.planning?.exactExtract).toBe(true);
    const restored = readRecipeText(writeRecipeText(latest()));
    expect(restored?.nolo?.brewTools).toEqual(latest().nolo!.brewTools);
    expect(restored?.fermentables[0].weightKg).toBeCloseTo(latest().fermentables[0].weightKg, 5);
  });

  it('conserve une variante non appliquée quand le brasseur consulte un autre outil', () => {
    const latest = mount();
    fill('Procédé à comparer', 'secondRunnings');
    fill(/Volume récupéré à comparer/, '12'); fill(/Densité récupérée à comparer/, '1,012');
    tab('Ajouts'); tab('Procédés');
    expect(screen.getByLabelText('Procédé à comparer')).toHaveValue('secondRunnings');
    expect(screen.getByLabelText(/Volume récupéré à comparer/)).toHaveValue('12');
    expect(screen.getByLabelText(/Densité récupérée à comparer/)).toHaveValue('1,012');
    expect(latest().nolo!.process).toBe('restricted');
  });

  it('bloque une plage de procédé incohérente jusqu’à sa correction', () => {
    mount(); fill('Procédé à comparer', 'arrested');
    fill('Densité d’arrêt à comparer minimum', '1,016'); fill('Densité d’arrêt à comparer maximum', '1,015');
    expect(screen.getByRole('alert')).toHaveTextContent('minimum dépasse');
    expect(screen.getByRole('button', { name: 'Appliquer ce procédé' })).toBeDisabled();
    tab('Ajouts'); tab('Procédés');
    expect(screen.getByRole('button', { name: 'Appliquer ce procédé' })).toBeDisabled();
    fill('Densité d’arrêt à comparer minimum', '1,014');
    expect(screen.getByRole('button', { name: 'Appliquer ce procédé' })).toBeEnabled();
  });

  it('laisse les champs vides inconnus et permet de corriger une plage inversée', () => {
    const latest = mount(); tab('Moût');
    fill('Atténuation envisagée minimum', '20'); fill('Atténuation envisagée maximum', '10');
    expect(screen.getByRole('alert')).toHaveTextContent('minimum dépasse');
    expect(latest().nolo!.brewTools!.attenuationPct).toBeNull();
    fill('Atténuation envisagée maximum', '22');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fill(/Réserve au volume de base/, '0,1'); fill(/OG à simuler/, '1,010');
    fill(/OG à simuler/, '');
    expect(latest().nolo!.brewTools!.simulationSg).toBeNull();
    expect(screen.queryByRole('button', { name: 'Appliquer ces quantités' })).not.toBeInTheDocument();
  });

  it('crée le fruit et lie ses sucres une seule fois, y compris après navigation', () => {
    const latest = mount(); tab('Ajouts');
    fill('Nom de l’ajout', 'Purée de framboise'); fill(/Masse de fruit/, '2');
    fill(/Sucres de la fiche produit/, '5'); fill(/Volume net apporté/, '1,8');
    expect(latest().fermentables).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer le fruit et son bilan' }));
    const fruit = latest().fermentables[2], op = latest().nolo!.operations[0];
    expect(fruit).toMatchObject({ kind: 'fruit', use: 'fermentation', weightKg: 2 });
    expect(op).toMatchObject({ kind: 'sugar', unclassifiedSugarG: { min: 100, max: 100 }, recipeAddition: { index: 2, basis: JSON.stringify(fruit) } });
    expect(noloInput(latest()).untrackedFermentationAdditions).toBe(false);
    tab('Moût'); tab('Ajouts');
    expect(screen.getByRole('button', { name: 'Appliquer le fruit et son bilan' })).toBeDisabled();
    expect(latest().nolo!.operations).toHaveLength(1);
  });

  it('peut budgéter un fruit existant sans ajouter un second ingrédient', () => {
    const r = fixture(); r.fermentables.push({ name: 'Purée existante', kind: 'fruit', use: 'fermentation', weightKg: 3 });
    const latest = mount(r); tab('Ajouts'); fill('Ingrédient lié', '2');
    expect(screen.getByLabelText(/Masse de fruit/)).toHaveValue('3');
    fill(/Sucres de la fiche produit/, '7'); fill(/Volume net apporté/, '2,5');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer le fruit et son bilan' }));
    expect(latest().fermentables).toHaveLength(3);
    expect(noloInput(latest()).untrackedFermentationAdditions).toBe(false);
  });

  it('utilise le volume de l’analyse liée, puis réserve le resucrage au conditionnement réel', () => {
    const r = fixture(); r.nolo!.brewTools = { version: 1, baseMode: 'recipe' };
    r.nolo!.measurements = [{ id: 'assay', stage: 'primary', date: '2026-09-12', method: 'Analyse du pilote', abvPct: { min: .2, max: .2 }, volumeL: 15, basis: noloScenarioBasis(noloInput(r)) }];
    const latest = mount(r); tab('Ajouts'); fill('Type d’ajout', 'priming'); fill(/Dose de resucrage/, '6');
    expect(screen.getByLabelText('Bilan de l’ajout')).toHaveTextContent('90 g');
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter au bilan NOLO' }));
    expect(latest().nolo!.operations).toHaveLength(1);
    expect(latest().nolo!.operations[0].id).toBe('planned-priming');
    const batch = { recipeSnapshot: latest(), volumeL: 15, carbonation: { method: 'priming', sugarG: 80 } } as Batch;
    const actual = noloRecipeForBatch(batch)!;
    expect(actual.nolo!.operations).toHaveLength(1);
    expect(actual.nolo!.operations[0]).toMatchObject({ id: 'batch-priming', unclassifiedSugarG: { min: 80, max: 80 } });
    expect(noloRecipeForBatch({ ...batch, carbonation: { method: 'forced' } } as Batch)!.nolo!.operations).toHaveLength(0);
  });

  it('conserve le volume et l’alcool de l’analyse avant un nouveau fruit tardif', () => {
    const r = fixture(); r.volumeL = 30; r.nolo!.brewTools = { version: 1, baseMode: 'recipe' };
    r.nolo!.measurements = [{ id: 'assay', stage: 'primary', date: '2026-09-12', method: 'Analyse du pilote', abvPct: { min: .3, max: .3 }, volumeL: 27, basis: noloScenarioBasis(noloInput(r)) }];
    const latest = mount(r); tab('Ajouts'); fill(/Masse de fruit/, '1'); fill(/Sucres de la fiche produit/, '10'); fill(/Volume net apporté/, '1');
    expect(screen.getByLabelText('Bilan de l’ajout')).toHaveTextContent('28 L');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer le fruit et son bilan' }));
    const result = evaluateNoloRecipe(latest())!;
    expect(result.volumeL).toBe(28);
    expect(result.projection.min).toBeCloseTo(.3 * 27 / 28);
    expect(result.projection.max).toBeCloseTo(.537245146);
    expect(result.alerts.some(a => a.code === 'stale-measurement')).toBe(false);
    expect(latest().nolo!.measurements[0]).toMatchObject({ volumeL: 27, method: 'Analyse du pilote', abvPct: { min: .3, max: .3 } });
  });

  it('invalide les hypothèses du mélange quand une opération est retirée', () => {
    const r = fixture(); r.nolo!.operations = [{ id: 'water', name: 'Eau du pilote', kind: 'dilution', volumeL: 4 }];
    const latest = mount(r); tab('Dilution'); fill(/IBU avant dilution/, '20');
    fireEvent.click(screen.getByRole('button', { name: 'Retirer Eau du pilote' }));
    expect(screen.getByText(/Le mélange a changé/)).toBeInTheDocument();
    expect(screen.getByLabelText('Alcool avant opération minimum')).toHaveValue('');
    expect(screen.getByLabelText(/IBU avant dilution/)).toHaveValue('');
    fill(/Eau à ajouter/, '0');
    expect(screen.queryByRole('button', { name: /L pour la cible/ })).not.toBeInTheDocument();
    expect(latest().nolo!.operations).toHaveLength(0);
  });

  it('chiffre la dilution, sa capacité et le volume final sans la rejouer après application', () => {
    const latest = mount(); tab('Dilution'); fill(/Eau à ajouter/, '10');
    fill(/IBU avant dilution/, '18'); fill(/Capacité utile du contenant/, '29');
    expect(screen.getByLabelText('Effets de la dilution')).toHaveTextContent('30 L');
    expect(screen.getByLabelText('Effets de la dilution')).toHaveTextContent('12');
    expect(screen.getByRole('button', { name: 'Ajouter cette dilution au bilan' })).toBeDisabled();
    fill(/Capacité utile du contenant/, '30');
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter cette dilution au bilan' }));
    expect(latest().volumeL).toBe(20);
    expect(latest().nolo!.operations[0]).toMatchObject({ kind: 'dilution', volumeL: 10 });
    expect(latest().nolo!.brewTools!.waterL).toBeNull();
    expect(latest().nolo!.brewTools!.baseAbvPct).toBeNull();
  });

  it('calcule un assemblage en incluant les sucres du composant', () => {
    const r = fixture(); r.nolo!.brewTools!.baseAbvPct = { min: .2, max: .2 };
    const latest = mount(r); tab('Ajouts'); fill('Type d’ajout', 'blend'); fill(/Bière à assembler/, '1');
    fill('Alcool de la bière ajoutée minimum', '5'); fill('Alcool de la bière ajoutée maximum', '5');
    expect(screen.getByRole('button', { name: 'Ajouter au bilan NOLO' })).toBeDisabled();
    fill(/Sucres résiduels de cette bière/, '0');
    expect(within(screen.getByRole('tabpanel')).getByLabelText('Comparaison de l’alcool avant et après')).toHaveTextContent('0,428–0,429');
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter au bilan NOLO' }));
    expect(latest().nolo!.operations[0]).toMatchObject({ kind: 'blend', volumeL: 1, remainingSugarG: { min: 0, max: 0 } });
  });

  it('met un essai à l’échelle et relie la lecture de densité à l’exploration du moût', () => {
    const r = fixture(); r.volumeL = 37.8;
    const latest = mount(r); tab('Essais'); fill('Produit à tester', 'Extrait pilote');
    fill(/Bière par échantillon/, '250'); fill(/Dose centrale à tester/, '0,3');
    expect(screen.getByLabelText('Plan des verres de dégustation')).toHaveTextContent('Témoin');
    expect(screen.getByText('45,36 mL de produit')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Conserver cet essai' }));
    expect(latest().nolo!.trials![0]).toMatchObject({ dosageML: .3, volumeL: .25 });
    fireEvent.click(screen.getByRole('button', { name: 'Reporter la dose dans Ajouts' }));
    expect(screen.getByRole('tab', { name: 'Ajouts' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText(/Dose de produit/)).toHaveValue('45,36');
    expect(latest().nolo!.brewTools!.aromaML).toBeCloseTo(45.36, 12);
    tab('Essais'); fill(/OG relevée/, '1,025'); fill(/FG relevée/, '1,0205'); fill(/Tolérance de chaque lecture/, '0,001');
    fireEvent.click(screen.getByRole('button', { name: 'Explorer cette atténuation dans Moût' }));
    expect(screen.getByRole('tab', { name: 'Moût' })).toHaveAttribute('aria-selected', 'true');
    expect(latest().nolo!.brewTools!.attenuationPct!.min).toBeCloseTo(10.4166667);
    expect(latest().nolo!.measurements).toHaveLength(0);
  });

  it('préserve le clavier des onglets et distingue simulations enregistrées et analyses', () => {
    const latest = mount();
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Procédés' }), { key: 'End' });
    expect(screen.getByRole('tab', { name: 'Essais' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Essais' })).toHaveAttribute('tabindex', '0');
    const fields = readRecipeFields(latest());
    expect({ ...fields.nolo!.brewTools, baseBasis: undefined }).toEqual({ ...latest().nolo!.brewTools, baseBasis: undefined });
    expect(fields.nolo!.brewTools!.baseBasis).toBe(noloToolContext(fields as Recipe));
    expect(() => assertNoloConfig({ ...latest().nolo, brewTools: { version: 1, baseAbvPct: { min: 1, max: 0 } } })).toThrow();
    expect(() => assertNoloConfig({ ...latest().nolo, brewTools: { version: 1, blendSugarGL: -1 } })).toThrow();
  });

  it('écarte le rendement chaud en extraction froide et accepte une OG réellement relevée', () => {
    const r = fixture(); r.nolo!.process = 'coldExtraction';
    expect(noloScenarioInput(r).og).toBeUndefined();
    expect(evaluateNoloRecipe(r)!.projection.max).toBeNull();
    r.nolo!.measurements = [{ id: 'wort', date: '2026-09-12', stage: 'wort', method: 'Densimètre corrigé', sg: 1.009, basis: noloScenarioBasis(noloInput(r)) }];
    expect(noloScenarioInput(r).og).toMatchObject({ range: { min: 1.009, max: 1.009 }, origin: 'measurement' });
  });

  it('ne remplace pas un rendement absent par 75 % dans le comparateur', () => {
    const r = fixture(); r.nolo!.process = 'lowExtract'; delete r.efficiencyPct; delete r.brewhouse;
    expect(noloScenarioInput(r).og).toBeUndefined();
    expect(evaluateNoloRecipe(r)!.projection.max).toBeNull();
  });
});
