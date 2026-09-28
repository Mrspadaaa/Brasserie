import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { YeastStrainDetails } from '../../src/ui/YeastStrainDetails';
import { YeastRecipeWorkbench, YeastRecipeSummary } from '../../src/ui/YeastRecipeWorkbench';
import { YeastBrewDayGuide } from '../../src/ui/YeastBrewDayGuide';
import { yeastStrainInformation } from '../../src/domain/yeastStrainInformation';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import { YeastRecipeDossier } from '../../src/ui/YeastRecipeDossier';
import { readYeastFactValue } from '../../functions/src/yeastTechnicalFacts';
import type { YeastSpec } from '../../src/types';
const knowledge = vi.hoisted(() => []);
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => knowledge }));
afterEach(cleanup);
describe('Observations documentaires non numériques', () => {
  it('corrige le libellé courant explicitement sans changer le ferment ni sa documentation locale', () => {
    const change=vi.fn(),yeast:YeastSpec={name:'Culture libre QA',attenuationPct:73,attenuationBasis:'recipe',
      localDocumentary:{version:1,documentary:{declaredAttenuationPct:78,technicalSource:'SOURCE_LIBRE_QA'}}};
    render(<YeastRecipeDossier yeast={yeast} reference={null} onChange={change} />);
    fireEvent.click(screen.getByText('Corriger le nom dans cette recette'));
    fireEvent.change(screen.getByLabelText('Nom de la levure dans cette recette'),{target:{value:'Culture libre QA corrigée'}});
    expect(change).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button',{name:'Renommer'}));
    expect(change).toHaveBeenCalledWith({...yeast,name:'Culture libre QA corrigée'},'documentary');
    expect(change.mock.calls[0][0].hopIndexId).toBeUndefined();
  });
  it('lit le scalaire historique et sa source sans confondre l’hypothèse ou deviner son type', () => {
    const change=vi.fn();
    const yeast:YeastSpec={name:'Souche documentaire QA',hopIndexId:'qa-documentary-scalar',attenuationPct:73,attenuationBasis:'recipe',
      adoptedDocumentary:{version:1,hopIndexId:'qa-documentary-scalar',documentary:{declaredAttenuationPct:78,technicalSource:'SOURCE_HISTORIQUE_QA'}}};
    render(<YeastRecipeDossier yeast={yeast} reference={null} onChange={change} />);
    const row=screen.getByRole('group',{name:'Atténuation annoncée'});
    expect(row.querySelector('[data-fact-reading]')).toHaveTextContent('78 %');
    expect(row).toHaveTextContent('qualification et origine non renseignées');
    expect(row).toHaveTextContent('SOURCE_HISTORIQUE_QA');
    expect(screen.getByLabelText('Atténuation retenue pour cette recette, en pourcent')).toHaveValue('73');
    expect(change).not.toHaveBeenCalled();
    fireEvent.click(within(row).getByRole('button',{name:'Corriger Atténuation annoncée'}));
    expect(within(row).getByLabelText('Type de valeur · Atténuation annoncée')).toHaveValue('choose');
    fireEvent.click(within(row).getByRole('button',{name:'Retenir'}));
    expect(within(row).getByRole('alert')).toHaveTextContent('Choisis le type');
    expect(change).not.toHaveBeenCalled();
    fireEvent.change(within(row).getByLabelText('Type de valeur · Atténuation annoncée'),{target:{value:'reportedPoint'}});
    expect(within(row).getByLabelText('Atténuation annoncée · valeur')).toHaveValue('78');
    expect(within(row).getByLabelText('Source · Atténuation annoncée')).toHaveValue('SOURCE_HISTORIQUE_QA');
    fireEvent.click(within(row).getByRole('button',{name:'Retenir'}));
    expect(change).toHaveBeenCalledTimes(1);
    expect(change.mock.calls[0][0]).toMatchObject({attenuationPct:73,attenuationBasis:'recipe',
      technicalSelections:{attenuation:{origin:'personal',qualifier:'reportedPoint',range:{min:78,max:78},source:'SOURCE_HISTORIQUE_QA'}}});
  });
  it('montre le texte publié15%+ et sa source sans fabriquer un point ni un opérateur', () => {
    const change=vi.fn();
    render(<YeastRecipeDossier yeast={{name:'WLP099',technicalFacts:[{key:'alcoholTolerance',reported:'Very High (15%+)',origin:'manufacturer',
      source:'White Labs · WLP099',sourceUrl:'https://www.whitelabs.com/yeast-single?id=146&type=YEAST'}]}} reference={null} onChange={change} />);
    const row=screen.getByRole('group',{name:'Tolérance à l’alcool'});
    expect(row.querySelector('[data-fact-reading]')).toHaveTextContent('Lecture numérique inconnue');
    expect(within(row).getByText('Very High (15%+)')).toBeVisible();
    expect(within(row).getByRole('link',{name:'White Labs · WLP099'})).toHaveAttribute('href','https://www.whitelabs.com/yeast-single?id=146&type=YEAST');
    expect(row).toHaveTextContent('Aucun point ni opérateur numérique retenu');
    expect(change).not.toHaveBeenCalled();
  });
  it('annonce le type ponctuel une seule fois et garde exactement le9%documenté', () => {
    render(<YeastRecipeDossier yeast={{name:'Culture ponctuelle',technicalFacts:[{key:'alcoholTolerance',reported:'9% ABV',range:{min:9,max:9},
      unit:'%',qualifier:'reportedPoint',origin:'manufacturer',source:'Fiche fabricant'}]}} reference={null} onChange={vi.fn()} />);
    const row=screen.getByRole('group',{name:'Tolérance à l’alcool'});
    expect(row.querySelector('[data-fact-reading]')).toHaveTextContent('9 % vol');
    expect(row.textContent?.match(/valeur ponctuelle/g)).toHaveLength(1);
  });
});
const openInfo = () => { const summary = screen.getByText('Fiche de la souche · repères pratiques'); fireEvent.click(summary); summary.closest('details')!.open = true; return summary.closest('details')!; };
describe('Compact strain information across brewing views', () => {
  it('is closed by default and retains access to evidence and unknowns', () => {
    render(<YeastStrainDetails information={yeastStrainInformation(yeastReferences([]).find(y => y.id === 'fermentis-us05'), 'sèche')} />);
    expect(screen.getByText('Fiche de la souche · repères pratiques').closest('details')!.open).toBe(false);
    const panel = openInfo();
    expect(within(panel).getByText('Réhydratation possible')).toBeVisible();
    expect(within(panel).getByText(/25–29 °C/)).toBeVisible();
    expect(within(panel).getByText('Conditions et sources des repères').closest('details')!.open).toBe(false);
    expect(within(panel).getByText(/Non documenté :/)).toHaveTextContent('Gène STA1');
  });
  it('keeps dry preparation hidden when product form is unconfirmed', () => {
    render(<YeastStrainDetails information={yeastStrainInformation(yeastReferences([]).find(y => y.id === 'fermentis-us05'), 'levain')} />);
    openInfo(); expect(screen.getByText(/Confirmer la forme du produit/)).toBeVisible(); expect(screen.queryByText('Réhydratation possible')).not.toBeInTheDocument();
  });
  it('shows the selected reference in the editor without modifying the recipe', () => {
    const change = vi.fn(); render(<YeastRecipeWorkbench recipe={yeastFlowRecipe()} onChange={change} />);
    const panel = openInfo(); expect(panel.dataset.yeastInformation).toBe('wyeast-3068');
    expect(within(panel).getByText(/33 % d’espace libre/)).toBeVisible(); expect(change).not.toHaveBeenCalled();
  });
  it.each(['overview', 'brew-day'])('makes the same information available in %s', view => {
    const recipe = yeastFlowRecipe();
    render(view === 'overview' ? <YeastRecipeSummary recipe={recipe} /> : <YeastBrewDayGuide recipe={recipe} state={{ currentIndex: 0, steps: [], readings: [] }} phase="preparation" />);
    expect(openInfo().dataset.yeastInformation).toBe('wyeast-3068');
    expect(screen.getByText('Soufre pendant la fermentation')).toBeVisible();
  });
});

describe('Correction documentaire d’une borne stricte', () => {
  it('lit >90 comme une borne, la corrige sans en faire un point ni perdre la provenance', () => {
    const change = vi.fn();
    render(<YeastRecipeDossier yeast={{ name: 'Culture personnelle', technicalFacts: [{
      key: 'attenuation', reported: '>90 %', qualifier: 'greaterThan', range: { min: 90, max: 90 }, unit: '%', origin: 'personal',
      source: 'Fiche de la culture', sourceUrl: 'https://example.invalid/culture', context: 'Moût de bière', retrievedAt: '2026-09-20'
    }] }} onChange={change} />);
    const row = screen.getByRole('group', { name: 'Atténuation annoncée' });
    // The retained value is read before any correction: a bound, never an empty scalar box.
    expect(row).toHaveAttribute('data-value-kind', 'bound');
    expect(row.querySelector('[data-fact-reading]')).toHaveTextContent('> 90 %');
    expect(within(row).queryByRole('textbox')).not.toBeInTheDocument();
    fireEvent.click(within(row).getByRole('button', { name: 'Corriger Atténuation annoncée' }));
    expect(within(row).getByLabelText('Type de valeur · Atténuation annoncée')).toHaveValue('greaterThan');
    expect(within(row).queryByLabelText('Atténuation annoncée · maximum')).not.toBeInTheDocument();
    const value = within(row).getByLabelText('Atténuation annoncée · valeur');
    expect(value).toHaveValue('90');
    fireEvent.change(value, { target: { value: '91' } }); fireEvent.blur(value);
    fireEvent.click(within(row).getByRole('button', { name: 'Retenir' }));
    const accepted = change.mock.calls.at(-1)![0].technicalSelections.attenuation;
    expect(readYeastFactValue(accepted)).toMatchObject({
      value: { kind: 'bound', operator: '>', value: 91 }, source: 'Fiche de la culture',
      sourceUrl: 'https://example.invalid/culture', context: 'Moût de bière', retrievedAt: '2026-09-20'
    });
    expect(change.mock.calls.at(-1)![0].attenuationPct).toBeUndefined();
  });

  it('corrige une plage, un point et une catégorie par leur type, et marque un inconnu sans ancien scalaire', () => {
    let current: YeastSpec = { name: 'Culture typée', fermTempMinC: 18, fermTempMaxC: 24, alcoholTolerancePct: 11, flocculation: 'Medium' };
    const change = vi.fn((next: YeastSpec) => { current = next; });
    const view = render(<YeastRecipeDossier yeast={current} onChange={change} reference={null} />);
    const rerender = () => view.rerender(<YeastRecipeDossier yeast={current} onChange={change} reference={null} />);
    const row = (name: string) => screen.getByRole('group', { name });
    expect(row('Température de fermentation').querySelector('[data-fact-reading]')).toHaveTextContent('18–24 °C');
    expect(row('Tolérance à l’alcool').querySelector('[data-fact-reading]')).toHaveTextContent('11 % vol · valeur ponctuelle');
    expect(row('Floculation').querySelector('[data-fact-reading]')).toHaveTextContent('Medium');
    // A range is corrected with its two bounds, prefilled from the retained reading.
    fireEvent.click(within(row('Température de fermentation')).getByRole('button', { name: 'Corriger Température de fermentation' }));
    expect(within(row('Température de fermentation')).getByLabelText('Température de fermentation · minimum')).toHaveValue('18');
    const max = within(row('Température de fermentation')).getByLabelText('Température de fermentation · maximum');
    expect(max).toHaveValue('24');
    fireEvent.change(max, { target: { value: '22' } }); fireEvent.blur(max);
    fireEvent.click(within(row('Température de fermentation')).getByRole('button', { name: 'Retenir' }));
    expect(current).toMatchObject({ fermTempMinC: 18, fermTempMaxC: 22 });
    expect(readYeastFactValue(current.technicalSelections!.temperature)).toMatchObject({ value: { kind: 'range', min: 18, max: 22 } });
    rerender();
    // An upper bound stays a bound: the legacy scalar is cleared rather than turned into a point.
    fireEvent.click(within(row('Tolérance à l’alcool')).getByRole('button', { name: 'Corriger Tolérance à l’alcool' }));
    fireEvent.change(within(row('Tolérance à l’alcool')).getByLabelText('Type de valeur · Tolérance à l’alcool'), { target: { value: 'upTo' } });
    fireEvent.click(within(row('Tolérance à l’alcool')).getByRole('button', { name: 'Retenir' }));
    expect(current.alcoholTolerancePct).toBeUndefined();
    expect(readYeastFactValue(current.technicalSelections!.alcoholTolerance)).toMatchObject({ value: { kind: 'bound', operator: '≤', value: 11 } });
    rerender();
    expect(row('Tolérance à l’alcool').querySelector('[data-fact-reading]')).toHaveTextContent('≤ 11 % vol');
    fireEvent.click(within(row('Floculation')).getByRole('button', { name: 'Corriger Floculation' }));
    expect(within(row('Floculation')).getByLabelText('Floculation · catégorie')).toHaveValue('Moyenne');
    fireEvent.change(within(row('Floculation')).getByLabelText('Type de valeur · Floculation'), { target: { value: 'unknown' } });
    fireEvent.click(within(row('Floculation')).getByRole('button', { name: 'Retenir' }));
    expect(current.technicalSelections?.flocculation).toBeNull();
    expect(current.flocculation).toBeUndefined();
    rerender();
    expect(row('Floculation').querySelector('[data-fact-reading]')).toHaveTextContent('Inconnue après revue');
  });

  it('refuse une plage inversée et garde l’hypothèse de recette séparée de la valeur annoncée', () => {
    const change = vi.fn();
    render(<YeastRecipeDossier yeast={{ name: 'Culture hypothèse', attenuationPct: 76, attenuationBasis: 'recipe', technicalFacts: [
      { key: 'attenuation', reported: '78–82 %', range: { min: 78, max: 82 }, unit: '%', qualifier: 'range', origin: 'manufacturer', source: 'Fiche fabricant' }] }}
      onChange={change} reference={null} />);
    expect(screen.getByRole('group', { name: 'Atténuation annoncée' }).querySelector('[data-fact-reading]')).toHaveTextContent('78–82 %');
    const hypothesis = screen.getByRole('group', { name: 'Hypothèse de cette recette' });
    expect(within(hypothesis).getByLabelText('Atténuation retenue pour cette recette, en pourcent')).toHaveValue('76');
    fireEvent.click(screen.getByRole('button', { name: 'Corriger Atténuation annoncée' }));
    const row = screen.getByRole('group', { name: 'Atténuation annoncée' });
    fireEvent.change(within(row).getByLabelText('Atténuation annoncée · minimum'), { target: { value: '85' } });
    fireEvent.blur(within(row).getByLabelText('Atténuation annoncée · minimum'));
    fireEvent.click(within(row).getByRole('button', { name: 'Retenir' }));
    expect(within(row).getByRole('alert')).toHaveTextContent('Le maximum doit dépasser le minimum');
    expect(change).not.toHaveBeenCalled();
  });
});
