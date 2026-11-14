import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { RecipePage } from '../../src/pages/RecipePage';
import { tableauMoments } from '../../src/ui/recette/tableauMoments';
import { geometrieEmpatage, legendesEmpatage } from '../../src/ui/recette/Dessins';
import { fullRecipe } from '../fixtures/fullRecipe';
import { defaultConfig } from '../../src/services/storage';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import type { Batch, Recipe } from '../../src/types';
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(cleanup);

/**
 * Page de la recette : la maquette r1 choisie (14.11, « La fiche en tableau r1 ça c'est le top »), portée telle quelle.
 * Ce test échoue sur l'écran d'avant (cartes, trois icônes dans l'en-tête, pas de tableau, pas d'Exporter) et passe sur r1 ;
 * chaque action de l'écran d'avant reste atteignable (sa plainte du jour : « régression d'action »).
 */
const recette = (): Recipe => {
  const recipe = yeastFlowRecipe();
  recipe.hops = [
    { name: 'Citra', stage: 'boil', weightG: 20, alpha: 12, timeMin: 60 },
    { name: 'Citra', stage: 'whirlpool', weightG: 28, alpha: 12, timeMin: 20 },
    { name: 'Citra', stage: 'dryHop', weightG: 85, alpha: 12, dayOffset: 3 },
    { name: 'Galaxy', stage: 'whirlpool', weightG: 28, alpha: 14, timeMin: 20 },
    { name: 'Galaxy', stage: 'dryHop', weightG: 43, alpha: 14, dayOffset: 3 }
  ] as Recipe['hops'];
  return recipe;
};
const lot = (recipe: Recipe): Batch => ({ id: 'LOT-R1', name: 'Premier lot', style: recipe.style, volumeL: 20, status: 'garde', brewDate: '10.09.2026', recipeRef: recipe.id, og: '1.050' }) as Batch;
const monter = (recipe = recette(), batches: Batch[] = []) => {
  const actions = { onClose: vi.fn(), onEdit: vi.fn(), onDuplicate: vi.fn(), onDelete: vi.fn(), onBrew: vi.fn(), onOpenBatch: vi.fn() };
  const vue = render(<RecipePage recipe={recipe} batches={batches} config={defaultConfig} {...actions} />);
  return { ...vue, actions };
};

describe('tableauMoments : la pure du tableau variété × moment', () => {
  it('une colonne par moment utilisé dans l\'ordre du procédé, une ligne par variété, jamais de 0 pour une cellule vide', () => {
    const t = tableauMoments(recette().hops);
    expect(t.colonnes.map((c) => c.label)).toEqual(['60′', 'whirlpool', 'dry hop']);
    expect(t.lignes.map((l) => l.nom)).toEqual(['Citra', 'Galaxy']);
    expect(t.lignes[0].doses).toEqual({ b60: 20, wp: 28, dh: 85 });
    expect(t.lignes[1].doses).toEqual({ wp: 28, dh: 43 });
    expect(t.lignes[1].doses.b60).toBeUndefined();
    expect(t.totalDryHop).toBe(128);
    expect(tableauMoments([]).totalDryHop).toBeNull();
  });
  it('plusieurs ajouts d\'une variété au même moment s\'additionnent', () => {
    const t = tableauMoments([{ name: 'Mosaic', stage: 'dryHop', weightG: 20, alpha: 12 }, { name: 'mosaic', stage: 'dryHop', weightG: 30, alpha: 12 }] as Recipe['hops']);
    expect(t.lignes).toHaveLength(1);
    expect(t.lignes[0].doses.dh).toBe(50);
  });
});

describe('La page de la recette reprend la maquette r1', () => {
  it('le tableau Houblons est ouvert, avec ses colonnes, ses doses réelles et le total dry hop sous la colonne', () => {
    const { container } = monter();
    const section = container.querySelector('details[data-recipe-section="Houblons"]') as HTMLDetailsElement;
    expect(section.open).toBe(true);
    const tableau = section.querySelector('[data-booster="tableau-moments"]') as HTMLElement;
    for (const colonne of ['60′', 'whirlpool', 'dry hop']) expect(within(tableau).getByText(colonne)).toBeInTheDocument();
    expect(within(tableau).getByText('α 12')).toBeInTheDocument();
    expect(within(tableau).getByText('α 14')).toBeInTheDocument();
    expect(within(tableau).getByText('85')).toBeInTheDocument();
    expect(section.querySelector('[data-element="r1-total-dryhop"]')).toHaveTextContent('128 g');
    // Une variété sans dose à un moment laisse la cellule vide.
    expect(within(tableau).getAllByRole('cell').filter((c) => c.textContent === '0')).toHaveLength(0);
  });

  it('le bandeau Grain · OG · IBU · EBC, puis la rangée style · FG · ABV', () => {
    const { container } = monter();
    const bandeau = container.querySelector('[data-element="r1-bandeau"]') as HTMLElement;
    for (const mot of ['Grain', 'OG', 'IBU', 'EBC']) expect(within(bandeau).getByText(mot)).toBeInTheDocument();
    const rangee = container.querySelector('[data-element="r1-style"]') as HTMLElement;
    expect(rangee).toHaveTextContent('Weissbier'); // « Hefeweizen » saisi, nom BJCP du catalogue (10A)
    expect(within(rangee).getByText('FG')).toBeInTheDocument();
    expect(within(rangee).getByText('ABV')).toBeInTheDocument();
  });

  it('la Levure est au premier plan, les sections suivent dans l\'ordre de la maquette, repliées', () => {
    const { container } = monter(recette(), [lot(recette())]);
    const noms = [...container.querySelectorAll('details[data-recipe-section]')].map((d) => d.getAttribute('data-recipe-section'))
      .filter((n) => ['Houblons', 'Levure', 'Grain', 'Empâtage', 'Ébullition', 'Fermentation', 'Brassins'].includes(n as string));
    expect(noms).toEqual(['Houblons', 'Levure', 'Grain', 'Empâtage', 'Ébullition', 'Fermentation', 'Brassins']);
    for (const nom of ['Levure', 'Grain', 'Empâtage', 'Ébullition', 'Fermentation', 'Brassins'])
      expect((container.querySelector(`details[data-recipe-section="${nom}"]`) as HTMLDetailsElement).open).toBe(false);
    expect(container.querySelector('details[data-recipe-section="Levure"] summary')).toHaveTextContent('Wyeast 3068');
  });

  it('Modifier et Exporter sont des actions nommées sous l\'en-tête ; Dupliquer à gauche et Supprimer éloigné viennent après les sections', () => {
    const { container } = monter();
    const actions = container.querySelector('[data-element="r1-actions"]') as HTMLElement;
    expect(within(actions).getByRole('button', { name: 'Modifier la recette' })).toHaveTextContent('Modifier');
    expect(within(actions).getByRole('button', { name: 'Exporter la recette' })).toHaveTextContent('Exporter');
    const rangee = container.querySelector('[data-element="r1-supprimer"]') as HTMLElement;
    const boutons = within(rangee).getAllByRole('button');
    expect(boutons.map((b) => b.textContent)).toEqual(['Dupliquer', 'Supprimer la recette']);
    const derniereSection = [...container.querySelectorAll('details[data-recipe-section]')].pop()!;
    expect(derniereSection.compareDocumentPosition(rangee) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Un seul geste principal : « Préparer un brassin ».
    expect(screen.getAllByRole('button', { name: /Préparer un brassin/ })).toHaveLength(1);
  });
});

describe('Aucune action de l\'écran d\'avant n\'est perdue', () => {
  it('Modifier, Dupliquer et Préparer un brassin appellent leur geste', () => {
    const { actions } = monter();
    fireEvent.click(screen.getByRole('button', { name: 'Modifier la recette' })); expect(actions.onEdit).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Dupliquer la recette' })); expect(actions.onDuplicate).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /Préparer un brassin/ })); expect(actions.onBrew).toHaveBeenCalledTimes(1);
  });

  it('Supprimer demande confirmation, et ne supprime qu\'à la confirmation', async () => {
    const { actions } = monter();
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer la recette' }));
    expect((await screen.findAllByText('Supprimer cette recette ?')).length).toBeGreaterThan(0);
    expect(actions.onDelete).not.toHaveBeenCalled();
    const confirmer = screen.getAllByRole('button', { name: 'Supprimer la recette' }).pop()!;
    fireEvent.click(confirmer);
    expect(actions.onDelete).toHaveBeenCalledTimes(1);
  });

  it('Exporter ouvre le texte de la recette', async () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Exporter la recette' }));
    expect(await screen.findByRole('button', { name: /Copier la recette en texte/ })).toBeInTheDocument();
  });

  it('un brassin issu de la recette s\'ouvre depuis la section Brassins, où le budget est rangé', () => {
    const recipe = recette();
    const { container, actions } = monter(recipe, [lot(recipe)]);
    const section = container.querySelector('details[data-recipe-section="Brassins"]') as HTMLDetailsElement;
    expect(within(section).getByRole('button', { name: 'Estimer le budget de ce brassin' })).toBeInTheDocument();
    fireEvent.click(within(section).getByRole('button', { name: /LOT-R1/ }));
    expect(actions.onOpenBatch).toHaveBeenCalledTimes(1);
  });

  it('la section Brassins reste sans brassin, avec son budget', () => {
    const { container } = monter();
    const section = container.querySelector('details[data-recipe-section="Brassins"]') as HTMLDetailsElement;
    expect(section).toHaveTextContent('aucun brassin');
    expect(within(section).getByRole('button', { name: 'Estimer le budget de ce brassin' })).toBeInTheDocument();
  });

  it('une recette sans houblon : Houblons dit « aucun », sans tableau', () => {
    const recipe = recette(); recipe.hops = [];
    const { container } = monter(recipe);
    expect(container.querySelector('[data-booster="tableau-moments"]')).toBeNull();
    expect(container.querySelector('[data-element="r1-houblons-vide"]')).toHaveTextContent('Aucun houblon renseigné');
  });
});

/** Passe de corrections du 14.11 (revue du pilote, écarts n° 1, 2, 3, 4, 5, 7) : chaque test échoue sur la version d'avant. */
describe('Corrections de la passe du 14.11 : la page ressemble à la maquette r1', () => {
  it('n° 1 : le « + » a sa case dans le pied, à côté de « Préparer un brassin », et ne flotte pas sur les rangées', () => {
    const { container } = monter();
    const pied = container.querySelector('[data-page-shell] footer') as HTMLElement;
    expect(within(pied).getByRole('button', { name: /Préparer un brassin/ })).toBeInTheDocument();
    expect(pied.querySelector('[data-action-dock="page-compact"]')).not.toBeNull();
  });

  it('n° 2 : la pastille de style porte le nom du catalogue (NEIPA → Hazy IPA 21C)', () => {
    const recipe = recette(); recipe.style = 'NEIPA';
    const { container } = monter(recipe);
    const pastille = container.querySelector('[data-role="style"]') as HTMLElement;
    expect(pastille).toHaveTextContent('Hazy IPA');
    expect(pastille).toHaveTextContent('21C');
    expect(pastille).not.toHaveTextContent('NEIPA');
  });

  it('n° 3 : l\'en-tête tient sur une ligne, nom et volume ensemble, sans sous-titre', () => {
    const { container } = monter();
    const entete = container.querySelector('[data-page-shell] header h1') as HTMLElement;
    expect(entete).toHaveTextContent(/Weissbier essai girofle 20 L$/);
    expect(container.querySelector('[data-page-shell] header p')).toBeNull();
  });

  it('n° 4 : pas de carte « Détail » ni « Potentiel » au repos ; leurs liens sont sur la ligne du total, et chaque action reste atteignable', async () => {
    const onOpenHopV55 = vi.fn();
    const recipe = recette();
    const { container } = render(<RecipePage recipe={recipe} batches={[]} config={defaultConfig} onClose={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} onBrew={vi.fn()} onOpenBatch={vi.fn()} onOpenHopV55={onOpenHopV55} />);
    expect(container.querySelector('[data-recipe-section="Détail des ajouts et IBU"]')).toBeNull();
    expect(container.querySelector('[data-recipe-section="Potentiel aromatique"]')).toBeNull();
    const liens = container.querySelector('[data-element="r1-houblons-liens"]') as HTMLElement;
    const total = container.querySelector('[data-element="r1-total-dryhop"]') as HTMLElement;
    expect(liens.compareDocumentPosition(total) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const detail = container.querySelector('[data-element="r1-detail-ajouts"]') as HTMLElement;
    expect(detail.hidden).toBe(true);
    fireEvent.click(within(liens).getByRole('button', { name: 'Détail des ajouts et IBU' }));
    expect(detail.hidden).toBe(false);
    expect(detail).toHaveTextContent('IBU');
    // Le toucher d'un nom souligné ouvre aussi le détail.
    fireEvent.click(within(liens).getByRole('button', { name: 'Détail des ajouts et IBU' }));
    expect(detail.hidden).toBe(true);
    fireEvent.click(container.querySelector('[data-houblon="citra"]') as HTMLElement);
    expect(detail.hidden).toBe(false);
    // Le potentiel aromatique : le rapport, et l'atelier Houblons V5.5.
    fireEvent.click(within(liens).getByRole('button', { name: 'Potentiel aromatique' }));
    expect(await screen.findByLabelText('Potentiel aromatique de la recette')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir l’atelier Houblons V5.5' }));
    expect(onOpenHopV55).toHaveBeenCalledTimes(1);
  });

  it('n° 7 : les noms de houblon sont des boutons soulignés en pointillé', () => {
    const { container } = monter();
    const nom = container.querySelector('[data-houblon="citra"]') as HTMLElement;
    expect(nom.tagName).toBe('BUTTON');
    expect(nom).toHaveTextContent('Citra');
  });

  it('n° 5 : sans plan de levure, la conduite n\'a pas de rangée à elle : elle est dans la Fermentation dépliée', async () => {
    const recipe = recette(); delete recipe.yeastDesign;
    const { container } = monter(recipe);
    expect(container.querySelector('[data-recipe-section="Conduite de levure"]')).toBeNull();
    const fermentation = container.querySelector('details[data-recipe-section="Fermentation"]') as HTMLDetailsElement;
    expect(fermentation.querySelector('[data-element="r1-conduite-levure"]')).toBeNull();
    fermentation.open = true; fireEvent(fermentation, new Event('toggle'));
    expect(await within(fermentation).findByLabelText('Conduite de levure de la recette')).toBeInTheDocument();
    expect(within(fermentation).getByRole('button', { name: 'Simuler une variante de levure' })).toBeInTheDocument();
    expect(container.querySelector('details[data-recipe-section="Levure"]')?.querySelector('[aria-label="Conduite de levure de la recette"]')).toBeNull();
  });
});

describe('Empâtage déplié : la courbe de la maquette r1 (état après le geste)', () => {
  const recetteEmpatage = (): Recipe => {
    const recipe = recette();
    recipe.mash = { ...recipe.mash, steps: [{ name: 'Empâtage', tempC: 67, durationMin: 60 }, { name: 'Mash-out', tempC: 76, durationMin: 10 }], ratioLPerKg: 3.2, spargeType: 'fly', spargeTempC: 76 } as Recipe['mash'];
    recipe.waterPlan = { ...fullRecipe.waterPlan!, mashWaterL: 18.5, spargeWaterL: 12.5 };
    return recipe;
  };
  const ouvrir = () => {
    const { container } = monter(recetteEmpatage());
    const section = container.querySelector('details[data-recipe-section="Empâtage"]') as HTMLDetailsElement;
    section.open = true; fireEvent(section, new Event('toggle'));
    return { container, section, svg: section.querySelector('[data-booster="courbe-empatage"]') as SVGElement };
  };

  it('la géométrie : montée depuis le plancher de l\'axe, aplat sous chaque palier, axe 60 · 70 · 80', () => {
    const g = geometrieEmpatage([{ nom: 'Empâtage', tempC: 67, durationMin: 60 }, { nom: 'Mash-out', tempC: 76, durationMin: 10 }]);
    expect(g.courbe.startsWith(`M26 ${g.plancher}L`)).toBe(true); // la montée de départ part du plancher de l'axe
    expect(g.graduations.map((x) => x.t)).toEqual([60, 70, 80]);
    expect(g.paliers).toHaveLength(2);
    expect(g.paliers[0].y).toBeGreaterThan(g.paliers[1].y); // 76 °C est plus haut que 67 °C (y vers le bas)
    expect(g.paliers[0].x1).toBeLessThan(g.paliers[1].x0); // la montée vers le mash-out sépare les deux paliers
  });

  it('la légende : le maintien long à 60-72 °C sous un nom générique devient « saccharification », le reste garde son nom', () => {
    expect(legendesEmpatage([{ nom: 'Empâtage', tempC: 67, durationMin: 60 }, { nom: 'Mash-out', tempC: 76, durationMin: 10 }])).toEqual(['saccharification', 'mash-out']);
    expect(legendesEmpatage([{ nom: 'Protéase', tempC: 55, durationMin: 15 }, { nom: 'Beta-amylase', tempC: 63, durationMin: 45 }])).toEqual(['protéase', 'beta-amylase']);
  });

  it('l\'en-tête dit « ≈ 70′ de maintien » ; la courbe porte « 67 °C · 60′ », « 76 °C · 10′ », ses légendes, ses graduations et deux aplats', () => {
    const { section, svg } = ouvrir();
    expect(section.querySelector('summary')).toHaveTextContent('≈ 70′ de maintien');
    const texte = svg.textContent ?? '';
    for (const t of ['67 °C · 60′', '76 °C · 10′', 'saccharification', 'mash-out', '60', '70', '80']) expect(texte).toContain(t);
    expect(svg.querySelectorAll('[data-role="aplat"]')).toHaveLength(2);
    expect(svg.querySelector('path[stroke-width="3"]')?.getAttribute('d')).toMatch(/^M26 104L/);
  });

  it('les pastilles d\'eau : « empâtage 18,5 L · 3,2 L/kg » et « rinçage continu 12,5 L · 76 °C »', () => {
    const { container } = ouvrir();
    const puces = container.querySelector('[data-element="r1-puces-empatage"]') as HTMLElement;
    expect(puces).toHaveTextContent('empâtage 18,5 L · 3,2 L/kg');
    expect(puces).toHaveTextContent('rinçage continu 12,5 L · 76 °C');
  });

  it('l\'Empâtage ouvert = courbe + pastilles + un repli : la liste des paliers et le repère de chauffe sont dans « Montées… »', () => {
    const { section } = ouvrir();
    const repli = section.querySelector('details[data-recipe-section="Montées, repères de chauffe, refroidissement"]') as HTMLElement;
    expect(repli).not.toBeNull();
    expect(repli).toHaveTextContent('Eau de rinçage');
    const enfants = [...(section.querySelector(':scope > .rc-body') as HTMLElement).children].map((c) => c.tagName.toLowerCase());
    expect(enfants).toEqual(['svg', 'div', 'details']);
  });
});

describe('Le mot d\'arôme de la rangée est le descripteur signature de la variété (L14, problème 9)', () => {
  const ligne = (container: HTMLElement, nom: string) => container.querySelector(`[data-houblon="${nom.toLowerCase()}"]`)!.closest('[role="row"]') as HTMLElement;
  const avec = (...noms: string[]): Recipe => {
    const r = recette();
    r.hops = noms.map((name) => ({ name, stage: 'dryHop', weightG: 20, alpha: 12, dayOffset: 3 })) as Recipe['hops'];
    return r;
  };

  it('Citra : « groseille à maquereau », hors des 12 familles, en pastille pointillée, entier', () => {
    const { container } = monter(avec('Citra', 'Mosaic'));
    const mot = ligne(container, 'Citra').querySelector('[data-element="r1-mot"]') as HTMLElement;
    expect(mot).toHaveTextContent(/^groseille à maquereau$/);
    expect(mot).toHaveAttribute('data-hors', 'true');
    expect(mot.className).toContain('rc-hf');
  });

  it('Mosaic : « myrtille », le mot que six fiches citent, en couleur de sa famille (baies), non pointillé', () => {
    const { container } = monter(avec('Citra', 'Mosaic'));
    const mot = ligne(container, 'Mosaic').querySelector('[data-element="r1-mot"]') as HTMLElement;
    expect(mot).toHaveTextContent(/^myrtille$/);
    expect(mot).toHaveAttribute('data-hors', 'false');
    expect(mot.className).not.toContain('rc-hf');
  });

  it('Nelson Sauvin : son mot signature est hors des familles ; une variété hors des fiches n\'a aucun mot', () => {
    const { container } = monter(avec('Nelson Sauvin', 'Houblon Inventé ZZ'));
    expect(ligne(container, 'Nelson Sauvin').querySelector('[data-element="r1-mot"]')).toHaveAttribute('data-hors', 'true');
    expect(ligne(container, 'Houblon Inventé ZZ').querySelector('[data-element="r1-mot"]')).toBeNull();
  });

  it('le mot n\'est jamais coupé par la mise en page : ni points de suspension, ni masquage du débordement', () => {
    const css = readFileSync(resolve(__dirname, '../../src/ui/recette/recette.css'), 'utf8');
    const regle = (sel: string) => css.split('}').filter((b) => b.trim().startsWith(sel)).join(';');
    expect(regle('.rc-mot')).not.toMatch(/text-overflow|overflow:\s*hidden/);
    expect(regle('.rc-hn2')).not.toMatch(/overflow:\s*hidden/);
  });
});
