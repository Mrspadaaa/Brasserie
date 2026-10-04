import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopAxis } from '../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import type { HopDecisionMaterial } from '../../src/domain/hopDecision/types';
import type { PreparedBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { HopV55Explorer, type HopV55Composition } from '../../src/ui/hopV55/Explorer';

const source = (title: string) => ({
  title,
  author: 'Brasserie témoin',
  year: 2025,
  kind: 'observation' as const,
  reference: `https://example.test/${encodeURIComponent(title)}`,
});

const varieties: HopVariety[] = [
  {
    id: 'pear-variety',
    name: 'Poire précise',
    aliases: ['Pear selection'],
    form: 'pelletT90',
    descriptions: [{ text: 'Poire nette et mûre', context: 'rawHop', source: source('Fiche Poire') }],
    analysis: [],
  },
  {
    id: 'citrus-variety',
    name: 'Agrumes frais',
    aliases: [],
    form: 'pelletT45',
    descriptions: [{ text: 'Citron vert et agrumes', context: 'infusion', source: source('Infusion Agrumes') }],
    analysis: [],
  },
  {
    id: 'unknown-variety',
    name: 'Matière inconnue',
    aliases: [],
    form: 'unknown',
    descriptions: [],
    analysis: [],
  },
];

const axes: HopAxis[] = [
  {
    id: 'pear', kind: 'axis', name: 'Poire documentée', version: '1', description: 'Axe lexical précis.',
    scale: { min: 0, max: 5 }, lowMax: 1, mediumMax: 3,
    weight: { range: { min: 1, max: 1 }, source: source('Définition poire') }, source: source('Définition poire'),
  },
  {
    id: 'citrus', kind: 'axis', name: 'Agrumes', version: '1', description: 'Axe lexical agrumes.',
    scale: { min: 0, max: 5 }, lowMax: 1, mediumMax: 3,
    weight: { range: { min: 1, max: 1 }, source: source('Définition agrumes') }, source: source('Définition agrumes'),
  },
];

const extrapolation: HopExtrapolation = {
  id: 'documentary-model', kind: 'extrapolation', name: 'Modèle documentaire', version: '1', enabled: true,
  source: source('Modèle documentaire'), evidence: [source('Corpus documentaire')], limitations: ['Test isolé.'],
  axes: [
    { id: 'pear', version: '1', terms: ['poire'], doseScale: { range: { min: 1, max: 1 }, central: 1, source: source('Terme poire') }, source: source('Terme poire') },
    { id: 'citrus', version: '1', terms: ['agrumes', 'citron'], doseScale: { range: { min: 1, max: 1 }, central: 1, source: source('Termes agrumes') }, source: source('Termes agrumes') },
  ],
  descriptor: {
    mentioned: { range: { min: 0, max: 1 }, central: 0.5, source: source('Descripteur mentionné') },
    unmentioned: { range: { min: 0, max: 1 }, central: 0.5, source: source('Descripteur non mentionné') },
    unknown: { range: { min: 0, max: 1 }, central: 0.5, source: source('Descripteur inconnu') },
  },
  gain: { range: { min: 0, max: 1 }, central: 0.5, source: source('Gain') },
  residual: { range: { min: -1, max: 1 }, central: 0, source: source('Résidu') },
  matrix: { range: { min: 0, max: 1 }, central: 0.5, source: source('Matrice') },
  sourceUncertainty: {
    coa: { range: { min: 0, max: 1 }, central: 0.5, source: source('COA') },
    manufacturer: { range: { min: 0, max: 1 }, central: 0.5, source: source('Fabricant') },
    research: { range: { min: 0, max: 1 }, central: 0.5, source: source('Recherche') },
    review: { range: { min: 0, max: 1 }, central: 0.5, source: source('Revue') },
    observation: { range: { min: 0, max: 1 }, central: 0.5, source: source('Observation') },
    community: { range: { min: 0, max: 1 }, central: 0.5, source: source('Communauté') },
    judgment: { range: { min: 0, max: 1 }, central: 0.5, source: source('Jugement') },
  },
  undatedUncertainty: { range: { min: 0, max: 1 }, central: 0.5, source: source('Date inconnue') },
  unknownFormUncertainty: { range: { min: 0, max: 1 }, central: 0.5, source: source('Forme inconnue') },
  timings: {
    firstWort: { expression: { range: { min: 0, max: 1 }, central: 0.5, source: source('Premier moût') }, halfSaturationGL: { range: { min: 1, max: 1 }, central: 1, source: source('Premier moût') }, extractionHours: { range: { min: 1, max: 1 }, central: 1, source: source('Premier moût') }, decayHours: null, temperatureC: { range: { min: 20, max: 20 }, central: 20, source: source('Premier moût') }, outsideTemperatureUncertainty: { range: { min: 0, max: 1 }, central: 0.5, source: source('Premier moût') } },
    boil: { expression: { range: { min: 0, max: 1 }, central: 0.5, source: source('Ébullition') }, halfSaturationGL: { range: { min: 1, max: 1 }, central: 1, source: source('Ébullition') }, extractionHours: { range: { min: 1, max: 1 }, central: 1, source: source('Ébullition') }, decayHours: null, temperatureC: { range: { min: 100, max: 100 }, central: 100, source: source('Ébullition') }, outsideTemperatureUncertainty: { range: { min: 0, max: 1 }, central: 0.5, source: source('Ébullition') } },
    whirlpool: { expression: { range: { min: 0, max: 1 }, central: 0.5, source: source('Whirlpool') }, halfSaturationGL: { range: { min: 1, max: 1 }, central: 1, source: source('Whirlpool') }, extractionHours: { range: { min: 1, max: 1 }, central: 1, source: source('Whirlpool') }, decayHours: null, temperatureC: { range: { min: 80, max: 80 }, central: 80, source: source('Whirlpool') }, outsideTemperatureUncertainty: { range: { min: 0, max: 1 }, central: 0.5, source: source('Whirlpool') } },
    fermentation: { expression: { range: { min: 0, max: 1 }, central: 0.5, source: source('Fermentation') }, halfSaturationGL: { range: { min: 1, max: 1 }, central: 1, source: source('Fermentation') }, extractionHours: { range: { min: 1, max: 1 }, central: 1, source: source('Fermentation') }, decayHours: null, temperatureC: { range: { min: 18, max: 18 }, central: 18, source: source('Fermentation') }, outsideTemperatureUncertainty: { range: { min: 0, max: 1 }, central: 0.5, source: source('Fermentation') } },
    postFermentation: { expression: { range: { min: 0, max: 1 }, central: 0.5, source: source('Après fermentation') }, halfSaturationGL: { range: { min: 1, max: 1 }, central: 1, source: source('Après fermentation') }, extractionHours: { range: { min: 1, max: 1 }, central: 1, source: source('Après fermentation') }, decayHours: null, temperatureC: { range: { min: 4, max: 4 }, central: 4, source: source('Après fermentation') }, outsideTemperatureUncertainty: { range: { min: 0, max: 1 }, central: 0.5, source: source('Après fermentation') } },
  },
  defaultYeast: {
    aroma: { range: { min: 0, max: 1 }, central: 0.5, source: source('Levure inconnue') },
    expression: { range: { min: 0, max: 1 }, central: 0.5, source: source('Levure inconnue') },
  },
  yeasts: [],
};

const materials: HopDecisionMaterial[] = varieties.map((variety) => ({
  id: `variety:${variety.id}`,
  name: variety.name,
  form: variety.form,
  variety,
}));

const prepared = {
  version: 'brewing-scenario-context-v1',
  limitations: [],
  provenance: [],
  runtime: {
    engineData: { varieties, lots: [], knowledge: [...axes, extrapolation], predictions: [], tastings: [], truncated: [] },
    materials,
  },
} as unknown as PreparedBrewingScenarioContext;

const intent = { question: 'Comparer sans perdre les nuances', criteria: [] };

describe('HopV55Explorer', () => {
  it('garde une masse décimale, une matière inconnue et les choix du creuset après un changement de focus', () => {
    const onCompose = vi.fn<(composition: HopV55Composition) => void>();
    render(<HopV55Explorer prepared={prepared} intent={intent} onCompose={onCompose} />);

    expect(screen.getByText(/positions servent au repérage/)).toBeInTheDocument();
    expect(screen.getByText(/pas une absence sensorielle/)).toBeInTheDocument();
    expect(screen.getByText('Forme inconnue')).toBeInTheDocument();

    const familyList = within(screen.getByRole('group', { name: 'Familles et termes documentaires' }));
    fireEvent.click(familyList.getByRole('button', { name: /Poire documentée/ }));
    expect(screen.getByText(/Poire nette et mûre/)).toBeInTheDocument();
    expect(screen.getByText('Fiche Poire')).toBeInTheDocument();
    expect(screen.getByText(/Modèle documentaire · v1 · activé/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ouvrir la source Fiche Poire' })).toHaveAttribute('href', 'https://example.test/Fiche%20Poire');
    fireEvent.click(familyList.getByRole('button', { name: /Tout le catalogue/ }));

    fireEvent.click(screen.getByRole('button', { name: 'Ajouter Matière inconnue au creuset' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter Poire précise au creuset' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Volume de cette hypothèse' }), { target: { value: '20' } });
    fireEvent.change(screen.getByRole('combobox', { name: /Emploi/ }), { target: { value: 'fermentation' } });
    fireEvent.click(screen.getByRole('button', { name: 'Composer l’hypothèse' }));
    expect(onCompose).not.toHaveBeenCalled();
    expect(screen.getByText(/Renseigne une masse positive/)).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Quantité de Matière inconnue' }), { target: { value: '12,25' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Quantité de Poire précise' }), { target: { value: '3,5' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Température' }), { target: { value: '18' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Contact' }), { target: { value: 'abc' } });
    expect(screen.getByText(/Valeur illisible ou inférieure/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Composer l’hypothèse' }));
    expect(onCompose).not.toHaveBeenCalled();
    expect(screen.getByText(/Corrige ou efface la saisie invalide/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Contact' }), { target: { value: '36' } });

    fireEvent.click(familyList.getByRole('button', { name: /Agrumes/ }));

    expect(screen.getByRole('textbox', { name: 'Quantité de Matière inconnue' })).toHaveValue('12,25');
    expect(screen.getByRole('textbox', { name: 'Quantité de Poire précise' })).toHaveValue('3,5');
    expect(screen.getByText('Descripteurs de ces axes inconnus pour cette matière ; elle reste composable.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Composer l’hypothèse' }));
    expect(onCompose).toHaveBeenCalledOnce();
    expect(onCompose).toHaveBeenCalledWith({
      label: 'Exploration de houblons',
      materials: [
        { materialId: 'variety:unknown-variety', grams: 12.25 },
        { materialId: 'variety:pear-variety', grams: 3.5 },
      ],
      use: 'fermentation',
      temperatureC: 18,
      contactHours: 36,
      volumeL: 20,
    });
  });

  it('cherche dans tout le catalogue même quand les matières tardives ne sont pas rendues au départ', () => {
    const largeMaterials: HopDecisionMaterial[] = Array.from({ length: 15 }, (_, index) => {
      const variety: HopVariety = {
        id: `series-${index}`,
        name: `Série ${String(index).padStart(2, '0')}`,
        aliases: index === 14 ? ['Terme rare 14'] : [],
        form: 'unknown',
        descriptions: [],
        analysis: [],
      };
      return { id: `variety:${variety.id}`, name: variety.name, form: variety.form, variety };
    });
    const largePrepared = {
      ...prepared,
      runtime: { ...prepared.runtime, materials: largeMaterials },
    } as unknown as PreparedBrewingScenarioContext;

    render(<HopV55Explorer prepared={largePrepared} intent={intent} onCompose={vi.fn()} />);

    expect(screen.getByText('15 matières chargées')).toBeInTheDocument();
    expect(screen.getByText(/12 sur 15 rendues, recherche complète/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ajouter Série 14 au creuset' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Matière, lot, variété, description, source ou terme documentaire' }), {
      target: { value: 'Terme rare 14' },
    });

    expect(screen.getByRole('button', { name: 'Ajouter Série 14 au creuset' })).toBeInTheDocument();
    expect(screen.getByText(/1 résultat/)).toBeInTheDocument();
  });

  it('reçoit une sélection du Catalogue sans inventer sa masse et conserve les choix à la demande suivante', () => {
    const onCompose = vi.fn<(composition: HopV55Composition) => void>();
    const props = { prepared, intent, onCompose,
      selectionRequest: { id: 'catalogue-use-1', materialId: 'variety:unknown-variety', yeastId: 'unloaded-yeast' } };
    const view = render(<HopV55Explorer {...props} />);

    expect(screen.getAllByRole('button', { name: 'Retirer Matière inconnue du creuset' })
      .some(button => button.getAttribute('aria-pressed') === 'true')).toBe(true);
    expect(screen.getByRole('textbox', { name: 'Quantité de Matière inconnue' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: /Souche de levure/ })).toHaveValue('unloaded-yeast');

    view.rerender(<HopV55Explorer {...props} selectionRequest={{ id: 'catalogue-use-2', materialId: 'variety:pear-variety' }} />);

    expect(screen.getAllByRole('button', { name: 'Retirer Matière inconnue du creuset' })
      .some(button => button.getAttribute('aria-pressed') === 'true')).toBe(true);
    expect(screen.getAllByRole('button', { name: 'Retirer Poire précise du creuset' })
      .some(button => button.getAttribute('aria-pressed') === 'true')).toBe(true);
    expect(screen.getByRole('textbox', { name: 'Quantité de Matière inconnue' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Quantité de Poire précise' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: /Souche de levure/ })).toHaveValue('unloaded-yeast');
    expect(onCompose).not.toHaveBeenCalled();
  });
  it('compare sans composer puis place l’alternative au creuset sans masse ni emploi', () => {
    const onCompose = vi.fn<(composition: HopV55Composition) => void>();
    render(<HopV55Explorer prepared={prepared} intent={intent} onCompose={onCompose} />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Source de la comparaison' }), { target: { value: 'variety:pear-variety' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Alternative de la comparaison' }), { target: { value: 'variety:citrus-variety' } });
    expect(screen.getByText('Mention présente dans la source initiale seulement · pas une perte mesurée')).toBeInTheDocument();
    expect(screen.getByText('Mention ajoutée dans la description de l’alternative · aucune mesure sensorielle')).toBeInTheDocument();
    expect(screen.getByText(/Aucune matière choisie/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Placer Agrumes frais dans le creuset' }));
    expect(screen.getByRole('textbox', { name: 'Quantité de Agrumes frais' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: /Emploi/ })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Source de la comparaison' })).toHaveValue('variety:pear-variety');
    expect(onCompose).not.toHaveBeenCalled();
  });

  it('transmet toutes les matières d’une voie sans créer de doses et conserve les termes', () => {
    render(<HopV55Explorer prepared={prepared} intent={intent} onCompose={vi.fn()} selectionRequest={{
      id: 'advice-two-materials', materialIds: ['variety:unknown-variety', 'variety:pear-variety'], terms: ['poire'],
    }} />);
    expect(screen.getByRole('textbox', { name: 'Quantité de Matière inconnue' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Quantité de Poire précise' })).toHaveValue('');
    expect(screen.getByRole('searchbox', { name: 'Matière, lot, variété, description, source ou terme documentaire' })).toHaveValue('poire');
  });
});
