import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
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

const MAP_NAME = 'Carte cliquable des catégories documentaires';

/** Text a reader actually sees: tooltips (`<title>`) are not visible labels. */
function visibleText(element: Element): string {
  const clone = element.cloneNode(true) as Element;
  clone.querySelectorAll('title').forEach((title) => title.remove());
  return clone.textContent ?? '';
}

/**
 * Synthetic territory fixture (not beer data): twelve families as in the R03 QA case, exact model terms and sourced
 * descriptions. Citra fixture is the only sheet described with both Agrumes and Fruits tropicaux; Boisé et résineux
 * and Terreux share the exact term « pin »; one sheet has no description at all.
 */
const territoryFamilies = [
  { id: 'citrus', name: 'Agrumes', terms: ['agrumes', 'citron'] },
  { id: 'woody', name: 'Boisé et résineux', terms: ['résine', 'pin'] },
  { id: 'spicy', name: 'Épicé', terms: ['poivre'] },
  { id: 'earthy', name: 'Terreux', terms: ['terre', 'pin'] },
  { id: 'floral', name: 'Floral', terms: ['floral', 'rose'] },
  { id: 'stoneFruit', name: 'Fruits à noyau', terms: ['pêche', 'abricot'] },
  { id: 'tropical', name: 'Fruits tropicaux', terms: ['mangue', 'ananas'] },
  { id: 'herbal', name: 'Herbacé aromatique', terms: ['herbe', 'menthe'] },
  { id: 'melon', name: 'Melon', terms: ['melon'] },
  { id: 'berries', name: 'Petits fruits', terms: ['cassis', 'framboise'] },
  { id: 'pome', name: 'Pomme et poire', terms: ['pomme', 'poire'] },
  { id: 'green', name: 'Végétal vert', terms: ['foin'] },
];
const alphabetical = ['Agrumes', 'Boisé et résineux', 'Épicé', 'Floral', 'Fruits à noyau', 'Fruits tropicaux',
  'Herbacé aromatique', 'Melon', 'Petits fruits', 'Pomme et poire', 'Terreux', 'Végétal vert'];
const territoryAxes: HopAxis[] = territoryFamilies.map((family) => ({
  id: family.id, kind: 'axis', name: family.name, version: 'local-1', description: `Axe documentaire ${family.name} (fixture).`,
  scale: { min: 0, max: 5 }, lowMax: 1, mediumMax: 3,
  weight: { range: { min: 1, max: 1 }, source: source(`Définition ${family.name}`) }, source: source(`Définition ${family.name}`),
}));
const territoryModel: HopExtrapolation = {
  ...extrapolation,
  id: 'territory-model',
  axes: territoryFamilies.map((family) => ({
    id: family.id, version: 'local-1', terms: family.terms,
    doseScale: { range: { min: 1, max: 1 }, central: 1, source: source(`Termes ${family.name}`) }, source: source(`Termes ${family.name}`),
  })),
};
const territoryVariety = (id: string, name: string, text?: string): HopVariety => ({
  id, name, aliases: [], form: 'pelletT90',
  descriptions: text ? [{ text, context: 'rawHop', source: source(`Fiche ${name}`) }] : [],
  analysis: [],
});
const territoryVarieties = [
  territoryVariety('citra-fixture', 'Citra fixture', 'agrumes et mangue'),
  territoryVariety('cascade-fixture', 'Cascade fixture', 'citron et pamplemousse'),
  territoryVariety('saaz-fixture', 'Saaz fixture', 'floral poivre et herbe'),
  territoryVariety('chinook-fixture', 'Chinook fixture', 'résine et pin'),
  territoryVariety('mystery-fixture', 'Matière sans description'),
];
const territoryPrepared = {
  ...prepared,
  runtime: {
    ...prepared.runtime,
    engineData: { ...prepared.runtime.engineData, varieties: territoryVarieties, knowledge: [...territoryAxes, territoryModel] },
    materials: territoryVarieties.map((variety) => ({ id: `variety:${variety.id}`, name: variety.name, form: variety.form, variety })),
  },
} as unknown as PreparedBrewingScenarioContext;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mapChip = (map: HTMLElement, name: string) => within(map).getByRole('button', { name: new RegExp(`^${escapeRegExp(name)} :`) });
const zoneNames = (zone: Element) => [...zone.querySelectorAll(':scope > .hop-v55-explorer__map-chips > button')]
  .map((chip) => chip.querySelector('.hop-v55-explorer__map-name')?.firstChild?.textContent);

/** Explorer stylesheet, relative to this test file in the same checkout (W or a copy of the project). */
const EXPLORER_CSS_FROM_THIS_TEST = '../../src/ui/hopV55/explorer.css';

/**
 * Reads the stylesheet from disk beside the running test file, whose absolute path Vitest records in the test
 * context (`task.file.filepath`). `import.meta.url` is not used: in the jsdom (web) transform, Vite rewrites
 * `new URL(…, import.meta.url)` into a served module URL that `readFileSync` refuses. A missing file throws.
 */
function readExplorerCss(testFilePath: string | undefined): { path: string; css: string } {
  if (!testFilePath || !isAbsolute(testFilePath)) {
    throw new Error(`Chemin disque du fichier de test indisponible (${String(testFilePath)}); la feuille Explorer n’est pas lue.`);
  }
  const path = resolve(dirname(testFilePath), EXPLORER_CSS_FROM_THIS_TEST);
  return { path, css: readFileSync(path, 'utf8') };
}

/** Static guard only: the real wrap behaviour is measured in the browser at 390/1280. */
function cssBlock(css: string, selector: string): string | undefined {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) return undefined;
  return css.slice(start, css.indexOf('}', start));
}

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

  it('#75 · lit la masse totale et la dose réelle du creuset selon la règle unique, sans flottant brut', () => {
    const onCompose = vi.fn<(composition: HopV55Composition) => void>();
    render(<HopV55Explorer prepared={prepared} intent={intent} onCompose={onCompose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter Poire précise au creuset' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter Agrumes frais au creuset' }));
    const reading = (label: string) => screen.getByText(label).nextElementSibling?.textContent;
    const grams = (name: string, value: string) => fireEvent.change(screen.getByRole('textbox', { name: `Quantité de ${name}` }), { target: { value } });

    grams('Poire précise', '0,1');
    grams('Agrumes frais', '0,2');
    fireEvent.change(screen.getByRole('textbox', { name: 'Volume de cette hypothèse' }), { target: { value: '1' } });
    expect.soft(reading('Masse totale saisie')).toBe('0,3\u00a0g');
    expect.soft(reading('Dose réelle calculable')).toBe('0,3\u00a0g/L');

    grams('Poire précise', '10');
    grams('Agrumes frais', '20');
    fireEvent.change(screen.getByRole('textbox', { name: 'Volume de cette hypothèse' }), { target: { value: '21' } });
    expect.soft(reading('Masse totale saisie')).toBe('30\u00a0g');
    expect.soft(reading('Dose réelle calculable')).toBe('1,429\u00a0g/L (10/7\u00a0g/L exacts)');

    // Display only: the composition still carries the entered masses and volume unchanged.
    fireEvent.change(screen.getByRole('combobox', { name: /Emploi/ }), { target: { value: 'fermentation' } });
    fireEvent.click(screen.getByRole('button', { name: 'Composer l’hypothèse' }));
    expect(onCompose).toHaveBeenCalledWith(expect.objectContaining({
      materials: [{ materialId: 'variety:pear-variety', grams: 10 }, { materialId: 'variety:citrus-variety', grams: 20 }],
      volumeL: 21,
    }));
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

  it('C03 · place les douze familles sur la carte, avec index et comptes en jetons et des noms entiers', () => {
    render(<HopV55Explorer prepared={territoryPrepared} intent={intent} onCompose={vi.fn()} />);
    const map = screen.getByRole('group', { name: MAP_NAME });
    expect(map.querySelectorAll('circle'), 'La carte est faite de régions HTML, pas de cercles SVG.').toHaveLength(0);
    expect(map).toHaveAttribute('data-map-center', 'catalogue');
    const zone = map.querySelector('[data-map-zone="families"]')!;
    expect(zoneNames(zone), 'Aucune famille chargée ne reste hors de la carte.').toEqual(alphabetical);
    expect(screen.queryByText(/Carte limitée/)).toBeNull();

    alphabetical.forEach((name, index) => {
      const chip = mapChip(map, name);
      expect(visibleText(chip), `Le nom ${name} est lisible sur la carte, pas seulement au survol.`).toContain(name);
      const nameNode = chip.querySelector('.hop-v55-explorer__map-name')!;
      expect(nameNode.firstChild?.textContent, `${name} reste un nom entier, sans césure insérée.`).toBe(name);
      const indexNode = chip.querySelector('.hop-v55-explorer__map-index')!;
      expect(indexNode.childNodes, 'L’index est un seul jeton.').toHaveLength(1);
      expect(indexNode.textContent).toBe(String(index + 1).padStart(2, '0'));
      const countNode = chip.querySelector('.hop-v55-explorer__map-count')!;
      expect(countNode.childNodes, 'Le compte est un seul jeton, séparé de l’index.').toHaveLength(1);
      expect(countNode.textContent).toMatch(/^\d+$/);
      expect(chip.getAttribute('aria-label')).toMatch(/termes documentés/);
      expect(chip.getAttribute('aria-label')).not.toMatch(/intensit|distance|ressembl/i);
    });
    expect(mapChip(map, 'Agrumes').querySelector('.hop-v55-explorer__map-count')).toHaveTextContent('2');
    expect(mapChip(map, 'Melon').querySelector('.hop-v55-explorer__map-count')).toHaveTextContent('0');

    const unknownNode = within(map).getByRole('button', { name: /^Sans descripteur relié aux axes du modèle :/ });
    expect(unknownNode.closest('[data-map-zone]'), 'L’inconnu reste hors des zones de familles.').toBeNull();
    expect(visibleText(unknownNode)).toContain('?');
    expect(visibleText(unknownNode)).toMatch(/inconnu, pas nul/);
    expect(unknownNode.querySelector('.hop-v55-explorer__map-count')).toHaveTextContent('1');
  });

  it('C03 · mène du territoire au centre, aux voisins documentés puis au creuset, au clavier', async () => {
    const user = userEvent.setup();
    render(<HopV55Explorer prepared={territoryPrepared} intent={intent} onCompose={vi.fn()} />);
    const map = screen.getByRole('group', { name: MAP_NAME });

    const citrus = mapChip(map, 'Agrumes');
    citrus.focus();
    await user.keyboard('{Enter}');
    const center = map.querySelector<HTMLElement>('[data-map-zone="center"]');
    expect(center, 'La carte expose la zone centrale après activation clavier.').not.toBeNull();
    if (!center) return;
    expect(center, 'Le focus clavier suit la famille passée au centre.').toHaveFocus();
    expect(center).toHaveTextContent('Agrumes');
    expect(center).toHaveTextContent('axe citrus · local-1');
    expect(map.getAttribute('data-map-center')).toMatch(/^citrus@local-1:/);

    const near = map.querySelector('[data-map-zone="near"]')!;
    const far = map.querySelector('[data-map-zone="far"]')!;
    expect(zoneNames(near)).toEqual(['Fruits tropicaux']);
    expect(zoneNames(far)).toEqual(alphabetical.filter((name) => name !== 'Agrumes' && name !== 'Fruits tropicaux'));
    // Counter-proof of the spatial role: alphabetical order would put « Boisé et résineux » beside Agrumes.
    // The map places the only family described in a same loaded sheet; a list-only grid cannot show this partition.
    expect(zoneNames(near)).not.toEqual(alphabetical.slice(1, 2));
    const tropical = mapChip(map, 'Fruits tropicaux');
    expect(tropical.querySelector('.hop-v55-explorer__map-index'), 'L’index reste celui de la liste après le focus.').toHaveTextContent('06');
    expect(tropical.querySelector('.hop-v55-explorer__map-count')).toHaveTextContent('1');
    expect(tropical.getAttribute('aria-label')).toMatch(/1 matière décrite aussi avec Agrumes/);

    const lens = document.querySelector('.hop-v55-explorer__focus') as HTMLElement;
    expect(lens).toHaveTextContent('axe citrus · local-1');
    expect(lens).toHaveTextContent('Termes exacts du modèle : agrumes · citron');
    expect(within(lens).getByText('Définition Agrumes')).toBeInTheDocument();
    expect(screen.getByText('2 résultats')).toBeInTheDocument();

    await user.click(within(lens).getByRole('button', { name: 'Voir la fiche décrite aussi avec Fruits tropicaux' }));
    const results = screen.getByRole('list', { name: 'Résultats du catalogue de houblons' });
    expect(within(results).getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent)).toEqual(['Citra fixture']);
    expect(within(results).getByText('Pourquoi elle décrit aussi Fruits tropicaux')).toBeInTheDocument();
    expect(within(results).getAllByText('Fiche Citra fixture').length).toBeGreaterThan(0);

    await user.click(within(results).getByRole('button', { name: 'Ajouter Citra fixture au creuset' }));
    expect(screen.getByRole('textbox', { name: 'Quantité de Citra fixture' })).toHaveValue('');

    await user.click(within(center).getByRole('button', { name: 'Revenir au catalogue' }));
    const backCenter = map.querySelector('[data-map-zone="center"]') as HTMLElement;
    expect(backCenter).toHaveFocus();
    expect(map).toHaveAttribute('data-map-center', 'catalogue');
    expect(zoneNames(map.querySelector('[data-map-zone="families"]')!)).toEqual(alphabetical);
    expect(screen.getByText('5 résultats')).toBeInTheDocument();
  });

  it('C03 · ne propose un voisin que sur une fiche ou un terme exact, et garde « ? » distinct', async () => {
    const user = userEvent.setup();
    render(<HopV55Explorer prepared={territoryPrepared} intent={intent} onCompose={vi.fn()} />);
    const map = screen.getByRole('group', { name: MAP_NAME });

    await user.click(mapChip(map, 'Boisé et résineux'));
    const woodyNear = map.querySelector<HTMLElement>('[data-map-zone="near"]');
    expect(woodyNear, 'La carte expose la zone des voisins documentés.').not.toBeNull();
    if (!woodyNear) return;
    expect(zoneNames(woodyNear)).toEqual(['Terreux']);
    expect(mapChip(map, 'Terreux')).toHaveTextContent('terme commun : pin');

    await user.click(within(map.querySelector('[data-map-zone="center"]') as HTMLElement).getByRole('button', { name: 'Revenir au catalogue' }));
    await user.click(mapChip(map, 'Melon'));
    expect(zoneNames(map.querySelector('[data-map-zone="near"]')!)).toEqual([]);
    expect(map.querySelector('[data-map-zone="near"]')).toHaveTextContent('aucun terme exact n’est partagé');
    expect(zoneNames(map.querySelector('[data-map-zone="far"]')!)).toHaveLength(11);
    expect(document.querySelector('.hop-v55-explorer__neighbours')).toHaveTextContent('Aucun voisin documenté');

    const unknownNode = within(map).getByRole('button', { name: /^Sans descripteur relié aux axes du modèle :/ });
    unknownNode.focus();
    await user.keyboard(' ');
    expect(unknownNode).toHaveAttribute('aria-pressed', 'true');
    expect(unknownNode).toHaveFocus();
    expect(document.querySelector('.hop-v55-explorer__focus')).toHaveTextContent('Aucune correspondance n’a été trouvée dans les descriptions chargées');
    const results = screen.getByRole('list', { name: 'Résultats du catalogue de houblons' });
    expect(within(results).getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent)).toEqual(['Matière sans description']);
  });

  it('C03 · garde statique : comptes insécables et noms coupés entre les mots seulement', ({ task }) => {
    const { path, css } = readExplorerCss(task.file?.filepath);
    expect(css.trim().length, `Feuille Explorer lue et non vide : ${path}`).toBeGreaterThan(0);
    const count = cssBlock(css, '.hop-v55-explorer .hop-v55-explorer__map-count');
    const index = cssBlock(css, '.hop-v55-explorer .hop-v55-explorer__map-index');
    const name = cssBlock(css, '.hop-v55-explorer .hop-v55-explorer__map-name');
    expect(count, `La règle de compte de carte existe (${path}).`).toBeDefined();
    expect(index, `La règle d’index de carte existe (${path}).`).toBeDefined();
    expect(name, `La règle de nom de carte existe (${path}).`).toBeDefined();
    if (!count || !index || !name) return;
    expect(count).toMatch(/white-space:\s*nowrap/);
    expect(index).toMatch(/white-space:\s*nowrap/);
    expect(name).toMatch(/overflow-wrap:\s*normal/);
    expect(name).not.toMatch(/anywhere|break-all/);
  });
});
