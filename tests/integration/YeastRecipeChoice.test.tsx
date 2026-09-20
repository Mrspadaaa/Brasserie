import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YeastRecipeChoice } from '../../src/ui/YeastRecipeChoice';
import { YeastChoiceResults } from '../../src/ui/YeastChoiceComparison';
import { YeastRecipeQuantity } from '../../src/ui/YeastRecipeDossier';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { yeastRecipeCandidates } from '../../src/domain/yeastRecipeDesign';
import { fullRecipe } from '../fixtures/fullRecipe';
import type { Recipe } from '../../src/types';

const knowledge = vi.hoisted(() => []);
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => knowledge }));
afterEach(cleanup);
const recipe = (): Recipe => ({ ...structuredClone(fullRecipe), style: 'American Pale Ale', styleRef: undefined,
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05', form: 'sèche', qty: 20, unit: 'g', pitchTempC: 19 },
  volumeL: 20, fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 10 }],
});
function Host({ changed = vi.fn(), initialYeastId, initial = recipe(), editableQuantity = false }: { changed?: ReturnType<typeof vi.fn>; initialYeastId?: string; initial?: Recipe; editableQuantity?: boolean }) {
  const [value, setValue] = useState(initial);
  return <YeastRecipeChoice recipe={value} quantityEditor={editableQuantity
    ? <YeastRecipeQuantity yeast={value.yeast} onChange={yeast => { const next = { ...value, yeast }; changed(next); setValue(next); }} />
    : <span>Quantité de la recette : {value.yeast.qty} {value.yeast.unit}</span>}
    initialYeastId={initialYeastId} onChange={next => { changed(next); setValue(next as Recipe); return next; }} />;
}
const search = (value: string) => fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher une levure' }), { target: { value } });
const openCatalogue = () => fireEvent.click(screen.getByRole('button', { name: 'Changer / comparer' }));
const consult = (name: string) => { const summary = screen.getByLabelText(`Consulter ${name}`); fireEvent.click(summary); };
const changeNumber = (label: string, value: string) => { const input = screen.getByLabelText(label); expect(input).toBeVisible(); fireEvent.change(input, { target: { value } }); fireEvent.blur(input); };
const openScenario = () => fireEvent.click(screen.getByRole('button', { name: 'Régler / simuler' }));
const openDisclosure = (label: string) => { const summary = screen.getByText(label, { selector: 'summary' }); expect(summary).toBeVisible();
  const details = summary.closest('details')!; if (!details.open) fireEvent.click(summary); expect(details).toHaveAttribute('open'); };
const openAdjustments = () => openDisclosure('Hypothèses et réglages complémentaires');
const personal = (): Recipe => ({ ...recipe(), name: 'Essai personnel', style: 'American Pale Ale', ogTarget: 1.06,
  fermentables: [], hops: [], yeast: { name: 'Culture rare — Micro labo R-125', lab: 'Micro labo', strain: 'R-125',
    form: 'liquide', qty: 125, unit: 'mL', attenuationPct: 78, attenuationBasis: 'recipe', fermTempMinC: 18, fermTempMaxC: 24 } });

describe('Choix de levure réservé à la création de recette', () => {
  it('montre le choix réel puis compare deux références sans modifier la recette ni les valeurs absentes', () => {
    const changed = vi.fn(); render(<Host changed={changed} />);
    expect(screen.queryByLabelText('Rechercher une levure')).not.toBeInTheDocument();
    const current = screen.getByRole('region', { name: 'Levure choisie dans la recette' });
    openDisclosure('Fiche, sources et données de la souche');
    const dossier = screen.getByRole('group', { name: 'Dossier de la levure' });
    expect(current).toHaveTextContent('SafAle US-05'); expect(dossier).toHaveTextContent('18–26 °C'); expect(dossier).toHaveTextContent('78–82 %');
    openCatalogue();
    fireEvent.change(screen.getByLabelText('Filtrer les levures par style'), { target: { value: 'unknown' } });
    search('US-05'); fireEvent.click(screen.getByRole('checkbox', { name: 'Comparer SafAle US-05', exact: true }));
    search('S-04'); fireEvent.click(screen.getByRole('checkbox', { name: 'Comparer SafAle S-04', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Comparer (2)' }));
    const table = screen.getByRole('region', { name: 'Comparaison des levures' });
    expect(table).toHaveTextContent('SafAle US-05'); expect(table).toHaveTextContent('SafAle S-04');
    expect(table).toHaveTextContent('18–26 °C'); expect(table).toHaveTextContent('78–82 %');
    search('aucune levure xyz'); expect(screen.getByText(/Aucune référence avec ces filtres/)).toBeInTheDocument();
    expect(table).toBeInTheDocument(); expect(current).toHaveTextContent('SafAle US-05'); expect(changed).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Choisir SafAle S-04 depuis la comparaison' }));
    expect(changed).toHaveBeenCalledTimes(1); expect(changed.mock.calls[0][0].yeast.hopIndexId).toBe('yeast-fermentis-safale-s-e2-80-9104');
    expect(changed.mock.calls[0][0].fermentation).toEqual(recipe().fermentation);
    expect(current).toHaveTextContent('SafAle S-04'); expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    openCatalogue();
    expect(screen.getByRole('searchbox', { name: 'Rechercher une levure' })).toHaveValue('aucune levure xyz');
    expect(screen.getByLabelText('Filtrer les levures par style')).toHaveValue('unknown');
    expect(screen.getByRole('region', { name: 'Comparaison des levures' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Retirer SafAle US-05 de la comparaison' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Retirer SafAle S-04 de la comparaison' })).toBeVisible();
  });

  it('garde un essai en repliant le panneau, sans écrire avant application', () => {
    const changed = vi.fn(); render(<Host changed={changed} />);
    openScenario();
    const temperature = screen.getByLabelText('Température du palier 1'); expect(temperature).toBeVisible();
    fireEvent.change(temperature, { target: { value: '22' } }); fireEvent.blur(temperature);
    fireEvent.click(screen.getByRole('button', { name: 'Replier l’essai' }));
    openScenario();
    expect(screen.getByLabelText('Température du palier 1')).toHaveValue('22'); expect(changed).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer les changements' }));
    expect(changed.mock.calls[0][0].fermentation[0].tempC).toBe(22);
    expect(screen.queryByText(/La recette a changé pendant/)).not.toBeInTheDocument();
  });

  it('consomme la suggestion initiale après un autre choix explicite', () => {
    render(<Host initialYeastId="lalbrew-verdant-ipa" />); openCatalogue();
    fireEvent.change(screen.getByLabelText('Filtrer les levures par style'), { target: { value: 'unknown' } });
    search('S-04');
    expect(screen.getByRole('button', { name: 'Consulter SafAle S-04' })).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Choisir SafAle S-04 dans la recette' }));
    openScenario();
    expect(screen.getByLabelText('Scénario de levure')).toHaveTextContent('SafAle S-04');
    expect(screen.getByLabelText('Scénario de levure')).not.toHaveTextContent('Verdant');
  });

  it('choisit en un clic dans la liste et garde recherche, labo, forme et comparaison au retour', async () => {
    const changed = vi.fn(), user = userEvent.setup(); render(<Host changed={changed} />); openCatalogue();
    await user.selectOptions(screen.getByLabelText('Filtrer les levures par style'), 'unknown');
    await user.selectOptions(screen.getByLabelText('Laboratoire à comparer'), 'Fermentis');
    await user.selectOptions(screen.getByLabelText('Forme à comparer'), 'sèche');
    search('US-05'); await user.click(screen.getByRole('checkbox', { name: 'Comparer SafAle US-05', exact: true }));
    search('S-04'); await user.click(screen.getByRole('checkbox', { name: 'Comparer SafAle S-04', exact: true }));
    expect(screen.getByRole('button', { name: 'Consulter SafAle S-04' })).toHaveAttribute('aria-expanded', 'false');
    await user.click(screen.getByRole('button', { name: 'Choisir SafAle S-04 dans la recette' }));
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed.mock.lastCall![0].yeast.name).toContain('S-04');
    openCatalogue();
    expect(screen.getByRole('searchbox', { name: 'Rechercher une levure' })).toHaveValue('S-04');
    expect(screen.getByLabelText('Laboratoire à comparer')).toHaveValue('Fermentis');
    expect(screen.getByLabelText('Forme à comparer')).toHaveValue('sèche');
    expect(screen.getByRole('checkbox', { name: 'Comparer SafAle S-04', exact: true })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Choisir SafAle S-04 dans la recette' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Comparer (2)' }));
    expect(screen.getByRole('region', { name: 'Comparaison des levures' })).toBeVisible();
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('autorise une forme inconnue et conserve les trous documentaires sans inventer une dose', async () => {
    const base = yeastRecipeCandidates('clean-ale', 'balanced', yeastReferences().filter(r => r.id === 'fermentis-us05'), 20)[0];
    const unknown = { ...base, yeastId: 'unknown', label: 'Culture sans fiche', temperature: undefined, attenuation: undefined, doseG: undefined, form: undefined,
      reference: { ...base.reference, id: 'unknown', form: undefined } };
    const choose = vi.fn(); const user = userEvent.setup();
    render(<div className="yeast-choice"><YeastChoiceResults candidates={[unknown]} shown={[unknown]} selectedId="" volumeL={20} onChoose={choose} /></div>);
    expect(screen.getAllByText('Non documenté')).toHaveLength(2);
    expect(screen.queryByText('Dose sèche au volume prévu')).not.toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Choisir Culture sans fiche dans la recette' }); expect(button).toBeEnabled();
    expect(screen.queryByLabelText('Forme du produit à confirmer')).not.toBeInTheDocument();
    await user.click(button); expect(choose).toHaveBeenCalledExactlyOnceWith('unknown', undefined);
  });

  it('affiche les avertissements métier de dose en dehors des détails repliés', () => {
    const value = recipe(); value.yeast.qty = 1;
    render(<YeastRecipeChoice recipe={value} quantityEditor={null} onChange={vi.fn()} />);
    expect(within(screen.getByRole('list', { name: 'Points à vérifier pour la levure choisie' })).getByText(/Quantité prévue hors du repère/i)).toBeVisible();
  });

  it('garde la quantité invalide accessible à la correction même pendant la consultation du catalogue', () => {
    const value = recipe(); value.yeast.qty = NaN;
    const view = render(<YeastRecipeChoice recipe={value} quantityEditor={<input aria-label="Quantité à corriger" />} onChange={vi.fn()} />);
    openCatalogue();
    expect(screen.getByRole('textbox', { name: 'Quantité à corriger' })).toBeVisible();
    view.rerender(<YeastRecipeChoice recipe={{ ...value, yeast: { ...value.yeast, qty: 14 } }} quantityEditor={<input aria-label="Quantité à corriger" />} onChange={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: 'Quantité à corriger' })).toBeVisible();
  });

  it('choisit depuis le comparatif une forme inconnue sans imposer un détour ni une valeur fictive', async () => {
    const base = yeastRecipeCandidates('clean-ale', 'balanced', yeastReferences().filter(r => r.id === 'fermentis-us05'), 20)[0];
    const unknown = { ...base, yeastId: 'unknown', label: 'Culture sans fiche', reference: { ...base.reference, id: 'unknown', form: undefined } };
    const choose = vi.fn(); const user = userEvent.setup();
    render(<YeastChoiceResults candidates={[base, unknown]} shown={[base, unknown]} selectedId={base.yeastId} volumeL={20} onChoose={choose} />);
    await user.click(screen.getByRole('checkbox', { name: `Comparer ${base.label}` }));
    await user.click(screen.getByRole('checkbox', { name: 'Comparer Culture sans fiche' }));
    await user.click(screen.getByRole('button', { name: 'Comparer (2)' }));
    expect(screen.queryByLabelText('Forme du produit à confirmer')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Choisir Culture sans fiche depuis la comparaison' }));
    expect(choose).toHaveBeenCalledExactlyOnceWith('unknown', undefined);
  });

  it('consulte une fiche et permet une précision volontaire de forme avant le choix', async () => {
    const base = yeastRecipeCandidates('clean-ale', 'balanced', yeastReferences().filter(r => r.id === 'fermentis-us05'), 20)[0];
    const unknown = { ...base, yeastId: 'unknown', label: 'Culture sans fiche', form: undefined,
      reference: { ...base.reference, id: 'unknown', form: undefined } };
    const choose = vi.fn(), user = userEvent.setup();
    render(<YeastChoiceResults candidates={[base, unknown]} shown={[base, unknown]} selectedId="" volumeL={20} onChoose={choose} />);
    consult('Culture sans fiche');
    const form = screen.getByLabelText('Forme du produit à confirmer'); expect(form).toBeVisible();
    await user.selectOptions(form, 'liquide'); expect(choose).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Choisir Culture sans fiche dans la recette' }));
    expect(choose).toHaveBeenCalledExactlyOnceWith('unknown', 'liquide');
    choose.mockClear();
    await user.click(screen.getByRole('checkbox', { name: `Comparer ${base.label}` }));
    await user.click(screen.getByRole('checkbox', { name: 'Comparer Culture sans fiche' }));
    await user.click(screen.getByRole('button', { name: 'Comparer (2)' }));
    await user.click(screen.getByRole('button', { name: 'Choisir Culture sans fiche depuis la comparaison' }));
    expect(choose).toHaveBeenCalledExactlyOnceWith('unknown', 'liquide');
  });

  it('projette une souche personnelle liquide ou de forme inconnue avec une atténuation explicite', () => {
    const original = personal(), onChange = vi.fn();
    const view = render(<YeastRecipeChoice recipe={original} onChange={onChange} quantityEditor={null} />);
    const projection = screen.getByRole('region', { name: 'Aperçu de la fermentation de cette recette' });
    expect(projection).toHaveTextContent('1,013'); expect(projection).toHaveTextContent('6,1');
    expect(projection).toHaveTextContent('hypothèse de recette');
    view.rerender(<YeastRecipeChoice recipe={{ ...original, yeast: { ...original.yeast, form: undefined } }} onChange={onChange} quantityEditor={null} />);
    expect(projection).toHaveTextContent('1,013'); expect(projection).toHaveTextContent('6,1');
    expect(screen.getByRole('region', { name: 'Levure choisie dans la recette' })).toHaveTextContent('forme à préciser');
    openScenario();
    expect(screen.getByLabelText('Température du palier 1')).toBeVisible();
    expect(screen.getByLabelText('Température du palier 1')).toHaveValue('19');
    expect(screen.getByRole('button', { name: 'Appliquer les changements' })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('montre l’effet d’une hypothèse sans toucher la recette et annule complètement cet essai', () => {
    const changed = vi.fn(); render(<Host initial={personal()} changed={changed} />);
    openScenario(); openAdjustments(); changeNumber('Atténuation retenue pour le scénario', '85');
    const comparison = screen.getByRole('figure', { name: 'Densité finale' });
    expect(comparison).toHaveTextContent('1,013 SG'); expect(comparison).toHaveTextContent('1,009 SG');
    expect(screen.getByRole('figure', { name: 'Alcool estimé' })).toHaveTextContent('6,7 % vol');
    expect(changed).not.toHaveBeenCalled();
    expect(screen.getByRole('region', { name: 'Aperçu de la fermentation de cette recette' })).toHaveTextContent('1,013');
    fireEvent.click(screen.getByRole('button', { name: 'Annuler l’essai' }));
    expect(screen.getByText('Essai annulé. La recette reste inchangée.')).toBeVisible();
    openScenario(); openAdjustments(); expect(screen.getByLabelText('Atténuation retenue pour le scénario')).toHaveValue('78');
    expect(changed).not.toHaveBeenCalled();
  });

  it('oublie le profil annulé avant de choisir une autre souche', async () => {
    const initial: Recipe = { ...personal(), style: 'Munich Helles',
      yeast: { name: 'SafLager W-34/70', hopIndexId: 'yeast-fermentis-saflager-w-34-70', form: 'sèche', qty: 20, unit: 'g' },
      fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 12, days: 10 }] };
    const changed = vi.fn(), user = userEvent.setup(); render(<Host initial={initial} changed={changed} />);
    expect(screen.getByLabelText('Profil recherché')).toHaveValue('clean');
    await user.selectOptions(screen.getByLabelText('Profil recherché'), 'low-sulfur');
    expect(screen.getByRole('region', { name: 'Programme proposé' })).toBeVisible();
    expect(screen.getByLabelText('Température du palier 2')).toHaveValue('14');
    await user.click(screen.getByRole('button', { name: 'Annuler l’essai' }));
    expect(screen.getByLabelText('Profil recherché')).toHaveValue('clean');
    expect(changed).not.toHaveBeenCalled();
    openCatalogue(); search('Diamond');
    await user.click(screen.getByRole('button', { name: 'Choisir Diamond Lager dans la recette' }));
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed.mock.lastCall![0].yeastDesign).toMatchObject({ yeastId: 'lalbrew-diamond', goal: 'clean' });
    expect(changed.mock.lastCall![0].yeastDesign.programme).toBeUndefined();
    expect(changed.mock.lastCall![0].fermentation).toEqual(initial.fermentation);
    expect(screen.getByLabelText('Profil recherché')).toHaveValue('clean');
  });

  it('refuse un essai périmé après enrichissement de la fiche puis reprend les nouvelles données', () => {
    const original = personal(), onChange = vi.fn();
    const view = render(<YeastRecipeChoice recipe={original} onChange={onChange} quantityEditor={null} />);
    openScenario(); openAdjustments(); changeNumber('Atténuation retenue pour le scénario', '85');
    view.rerender(<YeastRecipeChoice recipe={{ ...original, yeast: { ...original.yeast, attenuationPct: 80,
      technicalSource: 'Nouvelle fiche acceptée' } }} onChange={onChange} quantityEditor={null} />);
    expect(screen.getByRole('alert')).toHaveTextContent('La recette ou la fiche de la souche a changé');
    expect(screen.getByRole('button', { name: 'Appliquer les changements' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre les données actuelles' }));
    expect(screen.getByLabelText('Atténuation retenue pour le scénario')).toHaveValue('80');
    expect(screen.getByRole('button', { name: 'Appliquer les changements' })).toBeDisabled();
    changeNumber('Atténuation retenue pour le scénario', '81');
    expect(screen.getByRole('button', { name: 'Appliquer les changements' })).toBeEnabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('réexamine aussi un essai quand la DI retenue change sans modification des ingrédients', () => {
    const original = personal(), onChange = vi.fn();
    const view = render(<YeastRecipeChoice recipe={original} onChange={onChange} quantityEditor={null} />);
    openScenario(); openAdjustments(); changeNumber('Atténuation retenue pour le scénario', '85');
    view.rerender(<YeastRecipeChoice recipe={{ ...original, ogTarget: 1.07 }} onChange={onChange} quantityEditor={null} />);
    expect(screen.getByRole('alert')).toHaveTextContent('La recette ou la fiche de la souche a changé');
    expect(screen.getByRole('button', { name: 'Appliquer les changements' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre les données actuelles' }));
    expect(screen.getByLabelText('Atténuation retenue pour le scénario')).toHaveValue('78');
    expect(screen.getByRole('figure', { name: 'Densité finale' })).toHaveTextContent('1,015');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('convertit les unités physiques, conserve la quantité lors du changement de forme et refuse une conversion de conditionnement', () => {
    const changed = vi.fn(); render(<Host initial={personal()} changed={changed} editableQuantity />);
    fireEvent.click(screen.getByText('Ensemencement', { exact: false, selector: '.yc-pitch summary > span' }).closest('summary')!);
    fireEvent.change(screen.getByLabelText('Unité de la quantité de levure'), { target: { value: 'L' } });
    expect(screen.getByLabelText('Quantité de levure, en L')).toHaveValue('0,125');
    expect(changed.mock.lastCall![0].yeast).toMatchObject({ qty: 0.125, unit: 'L', form: 'liquide' });
    fireEvent.change(screen.getByLabelText('Forme de la levure'), { target: { value: 'levain' } });
    expect(changed.mock.lastCall![0].yeast).toMatchObject({ qty: 0.125, unit: 'L', form: 'levain' });
    fireEvent.change(screen.getByLabelText('Unité de la quantité de levure'), { target: { value: 'flacon' } });
    expect(screen.getByLabelText('Quantité de levure, en flacon')).toHaveValue('');
    expect(changed.mock.lastCall![0].yeast.qty).toBeUndefined();
    expect(screen.getByText(/aucune conversion depuis L/)).toBeVisible();
    changeNumber('Quantité de levure, en flacon', '2');
    expect(changed.mock.lastCall![0].yeast).toMatchObject({ qty: 2, unit: 'flacon' });
    expect(screen.queryByText(/Quantité à ressaisir/)).not.toBeInTheDocument();
  });

  it('signale une consigne hors fenêtre sans la censurer et bloque une valeur invalide jusqu’à sa correction', () => {
    const changed = vi.fn(); render(<Host initial={personal()} changed={changed} />);
    openScenario(); changeNumber('Température du palier 1', '30');
    const warnings = screen.getByRole('list', { name: 'Points à vérifier dans le scénario' });
    expect(warnings).toHaveTextContent(/hors (de la )?(fenêtre|plage)/);
    expect(warnings).toBeVisible(); expect(warnings.closest('details')).toBeNull();
    expect(screen.getByRole('button', { name: 'Appliquer les changements' })).toBeEnabled();
    expect(changed).not.toHaveBeenCalled();
    changeNumber('Température du palier 1', '61');
    expect(screen.getAllByRole('alert').some(alert => /Température/.test(alert.textContent ?? ''))).toBe(true);
    expect(screen.getByRole('button', { name: 'Appliquer les changements' })).toBeDisabled();
    changeNumber('Température du palier 1', '22,5');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer les changements' }));
    expect(changed.mock.lastCall![0].fermentation[0].tempC).toBe(22.5);
  });

  it('laisse corriger un palier effacé sans rétablir silencieusement son ancienne durée', () => {
    const changed = vi.fn(); render(<Host initial={personal()} changed={changed} />); openScenario();
    changeNumber('Durée du palier 1', '');
    expect(screen.getByLabelText('Durée du palier 1')).toHaveValue('');
    expect(screen.getAllByRole('alert').some(alert => /durée|renseigne/i.test(alert.textContent ?? ''))).toBe(true);
    expect(screen.getByRole('button', { name: 'Appliquer les changements' })).toBeDisabled();
    expect(changed).not.toHaveBeenCalled();
    changeNumber('Durée du palier 1', '14');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer les changements' }));
    expect(changed.mock.lastCall![0].fermentation).toEqual([{ ...personal().fermentation[0], days: 14 }]);
  });

  it('édite chaque rampe primaire indépendamment sans écraser les autres températures et durées', () => {
    const initial: Recipe = { ...personal(), fermentation: [personal().fermentation[0],
      { name: 'Deuxième rampe', kind: 'primaire', tempC: 21, days: 2 }, { name: 'Garde', kind: 'garde', tempC: 4, days: 7 }] };
    const changed = vi.fn(); render(<Host initial={initial} changed={changed} />); openScenario();
    expect(screen.getByLabelText('Température du palier 1')).toHaveValue('19');
    expect(screen.getByLabelText('Température du palier 2')).toHaveValue('21');
    expect(screen.getByLabelText('Durée du palier 2')).toHaveValue('2');
    changeNumber('Température du palier 2', '22'); changeNumber('Durée du palier 2', '3');
    expect(screen.getByLabelText('Température du palier 1')).toHaveValue('19');
    expect(screen.getByLabelText('Durée du palier 1')).toHaveValue('10');
    expect(changed).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer les changements' }));
    expect(changed.mock.lastCall![0].fermentation).toEqual([initial.fermentation[0],
      { ...initial.fermentation[1], tempC: 22, days: 3 }, initial.fermentation[2]]);
  });

  it('conserve les consignes des houblons par défaut et ne les aligne qu’après choix explicite', () => {
    const initial = { ...personal(), style: 'NEIPA', hops: [
      { name: 'Citra', weightG: 100, alpha: 12, stage: 'dryHop' as const, aromaTiming: 'fermentation' as const, aromaTemperatureC: 19, aromaContactHours: 48 },
      { name: 'Mosaic', weightG: 50, alpha: 11, stage: 'dryHop' as const, aromaTiming: 'postFermentation' as const, aromaTemperatureC: 14, aromaContactHours: 24 }
    ] };
    const changed = vi.fn(); render(<Host initial={initial} changed={changed} />);
    openScenario(); changeNumber('Température du palier 1', '23');
    const align = screen.getByRole('checkbox', { name: /Aligner les ajouts en fermentation active/ });
    expect(align).not.toBeChecked();
    expect(screen.getByRole('list', { name: 'Points à vérifier dans le scénario' })).toHaveTextContent('Température de contact distincte');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer les changements' }));
    expect(changed.mock.lastCall![0].hops.map(hop => hop.aromaTemperatureC)).toEqual([19, 14]);
    openScenario(); fireEvent.click(screen.getByRole('checkbox', { name: /Aligner les ajouts en fermentation active/ }));
    expect(changed).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer les changements' }));
    expect(changed.mock.lastCall![0].hops.map(hop => hop.aromaTemperatureC)).toEqual([23, 14]);
    expect(changed.mock.lastCall![0].yeastDesign.applied.hops.map(hop => hop.aromaTemperatureC)).toEqual([23, 14]);
  });

  it('garde la DF conditionnelle d’une Sour et ne chiffre l’alcool qu’après choix du procédé adapté', () => {
    const changed = vi.fn(); render(<Host initial={{ ...personal(), style: 'Sour' }} changed={changed} />);
    const current = screen.getByRole('region', { name: 'Aperçu de la fermentation de cette recette' });
    expect(current).toHaveTextContent('1,013'); expect(current).toHaveTextContent('À préciser');
    expect(current).toHaveTextContent('Procédé acidulé non précisé');
    openScenario(); fireEvent.change(screen.getByLabelText('Procédé de fermentation'), { target: { value: 'preacidified' } });
    expect(screen.getByRole('figure', { name: 'Alcool estimé' })).toHaveTextContent('6,1 % vol');
    expect(changed).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Procédé de fermentation'), { target: { value: 'acidifying-yeast' } });
    expect(within(screen.getByRole('figure', { name: 'Alcool estimé' })).getAllByText('À renseigner')).toHaveLength(2);
    expect(screen.getByRole('list', { name: 'Points à vérifier dans le scénario' })).toHaveTextContent('pH, durée et stabilité finale non simulés');
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une culture' }));
    const name = screen.getByLabelText('Culture 1'); fireEvent.change(name, { target: { value: 'Culture acidifiante R-125' } }); fireEvent.blur(name);
    fireEvent.change(screen.getByLabelText('Rôle de la culture 1'), { target: { value: 'acidifying' } });
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer les changements' }));
    expect(changed.mock.lastCall![0].yeastDesign).toMatchObject({ process: 'acidifying-yeast', cultureRoles: [{ name: 'Culture acidifiante R-125', role: 'acidifying' }] });
    expect(screen.getByRole('region', { name: 'Aperçu de la fermentation de cette recette' })).toHaveTextContent('répartition alcool/acides');
  });

  it('montre une masse de houblon inconnue comme inconnue dans les contacts prévus', () => {
    const initial: Recipe = { ...personal(), style: 'NEIPA', hops: [{ name: 'Citra sans masse', weightG: undefined as unknown as number,
      alpha: 12, stage: 'dryHop', aromaTiming: 'fermentation', aromaTemperatureC: 19, aromaContactHours: 48 }] };
    render(<Host initial={initial} />); openScenario(); openDisclosure('Contacts, calcul et sources');
    const contacts = screen.getByRole('region', { name: 'Conduite et contacts des houblons' });
    const active = within(contacts).getAllByRole('listitem').find(item => item.textContent?.startsWith('Fermentation'))!;
    expect(active).toBeVisible(); expect(active).toHaveTextContent('— g à cru'); expect(active).not.toHaveTextContent('0 g à cru');
    expect(within(contacts).getByRole('row', { name: /Citra sans masse/ })).toHaveTextContent('— g/L');
    expect(screen.getByRole('list', { name: 'Points à vérifier dans le scénario' })).toHaveTextContent('Masse de houblon à cru manquante');
  });

  it('garde l’alerte de tolérance visible sans plafonner artificiellement la projection', () => {
    const high = { ...personal(), style: 'Barleywine', ogTarget: 1.13,
      yeast: { ...personal().yeast, attenuationPct: 78, alcoholTolerancePct: 11 } };
    render(<Host initial={high} />);
    expect(screen.getByRole('region', { name: 'Aperçu de la fermentation de cette recette' })).toHaveTextContent('13,3');
    const alerts = screen.getByRole('list', { name: 'Points à vérifier pour la levure choisie' });
    expect(alerts).toHaveTextContent('au-delà de la tolérance annoncée (11 % vol)'); expect(alerts).toBeVisible();
    expect(alerts.closest('details')).toBeNull();
  });
});
