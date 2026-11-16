/**
 * b1r (15.11, « certaines actions doivent toujours être possible, juste celle de l'écran actuel sont plus mis en avant.
 * Et le bouton doit toujours être flottant »). En ligne, dans l'assistant de recette, le « + » ne proposait que « Partout » :
 * les actions de la recette ne venaient pas en tête. Ici, à chaque étape, le menu du « + » montre en tête
 * (contre le +, avant « Partout ») : l'ajout d'un ingrédient de l'étape quand elle en a un, « Enregistrer la recette »,
 * « Exporter la recette », puis la rangée « Aller à » (les sept étapes) ; « Partout » reste dessous, entier.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { FloatingActions } from '../../src/ui/FloatingActions';
import { defaultConfig } from '../../src/services/storage';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import { allerEtape } from '../helpers/wizard';
import { resetFakeJobs } from './stubs/brewerJobs';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));

const KEY = 'fixture-owner:REC-PLUS';

function ouvrir(onSave = vi.fn()) {
  render(
    <>
      <BrewWizard draftKey={KEY} seed={{ recipe: { ...yeastFlowRecipe(), id: 'REC-PLUS' } }}
        config={defaultConfig} stockItems={[]} knownStyles={[]} onClose={vi.fn()} onSave={onSave} onCreateStockItem={vi.fn()}
        onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />
      <FloatingActions action={null} onAction={() => {}} companionLabel="Assistant de recette" anchor="page" />
    </>
  );
  return onSave;
}

const ouvrirMenu = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Actions rapides' }));
  return screen.getByRole('menu', { name: 'Actions rapides' });
};
const fermerMenu = () => { if (screen.queryByRole('menu')) fireEvent.click(screen.getByRole('button', { name: 'Actions rapides' })); };
/** Les lignes du menu avant la grille « Partout » (celles de la page, contre le +). */
const enTete = (menu: HTMLElement) => {
  const grille = menu.querySelector('[data-zone="partout"]')!;
  return within(menu).getAllByRole('menuitem').filter(b => b.compareDocumentPosition(grille) & Node.DOCUMENT_POSITION_FOLLOWING);
};
const noms = (menu: HTMLElement) => enTete(menu).map(b => b.textContent ?? '');

const ETAPES: Array<[string, RegExp, string | null]> = [
  ['Identité', /^Identité$/, null],
  ['Malts/sucres', /^Malts\/sucres$/, 'Ajouter un malt ou un sucre'],
  ['Houblons', /^Houblons$/, 'Ajouter un houblon'],
  ['Levure', /^Levure$/, 'Changer de levure'], // la fixture a déjà sa levure (Wyeast 3068) : « Changer », pas « Choisir »
  ['Paliers', /^Paliers$/, 'Ajouter un palier'],
  ['Eau et sels', /^Eau/, null],
  ['Récapitulatif', /^Récap/, null]
];

beforeEach(() => { resetFakeJobs(); });
afterEach(() => { cleanup(); localStorage.clear(); });

describe('b1r : le « + » de l’assistant met les actions de la recette en tête, « Partout » dessous', () => {
  it.each(ETAPES)('étape %s : enregistrer, exporter et « Aller à » avant « Partout »', (_nom, bouton, ajout) => {
    ouvrir();
    allerEtape(bouton);
    const menu = ouvrirMenu();
    const lignes = noms(menu);
    expect(lignes.some(t => /Enregistrer la recette/.test(t))).toBe(true);
    expect(lignes.some(t => /Exporter la recette/.test(t))).toBe(true);
    // Pas de « Aller à » (16.11) : le fil d'étapes, visible en haut, le fait déjà ; le menu reste court (3 lignes au plus en tête).
    expect(within(menu).queryByRole('group', { name: 'Aller à une étape' })).toBeNull();
    expect(menu.querySelector('[data-page-etapes]')).toBeNull();
    expect(lignes.length).toBeLessThanOrEqual(3);
    expect(lignes.length).toBeGreaterThanOrEqual(2);
    if (ajout) expect(lignes.some(t => t.includes(ajout))).toBe(true);
    else expect(lignes.some(t => /^Ajouter|^Choisir|^Changer/.test(t))).toBe(false);
    // « Partout » reste entier, dessous : écriture, facture, vente, recette, brassin, compagnon.
    const partout = within(menu.querySelector<HTMLElement>('[data-zone="partout"]')!).getAllByRole('menuitem');
    expect(partout.length).toBeGreaterThanOrEqual(6);
    expect(screen.getByText('Partout')).toBeInTheDocument();
    // La zone de la page se nomme.
    expect(menu.querySelector('[data-zone="ecran"]')!.textContent).toMatch(/^Sur /);
  });

  it('l’ajout vient avant l’enregistrement, l’enregistrement avant l’export (contre le + d’abord)', () => {
    ouvrir();
    allerEtape(/^Malts\/sucres$/);
    const lignes = noms(ouvrirMenu());
    const i = (re: RegExp) => lignes.findIndex(t => re.test(t));
    expect(i(/Ajouter un malt/)).toBeGreaterThanOrEqual(0);
    expect(i(/Ajouter un malt/)).toBeLessThan(i(/Enregistrer la recette/));
    expect(i(/Enregistrer la recette/)).toBeLessThan(i(/Exporter la recette/));
  });

  it('le fil d’étapes reste le moyen d’aller à une autre étape ; le menu ne le double pas', () => {
    ouvrir();
    expect(within(ouvrirMenu()).queryByRole('group', { name: 'Aller à une étape' })).toBeNull();
    fermerMenu();
    allerEtape(/^Houblons$/);
    expect(screen.getByRole('main', { name: 'Houblons' })).toBeInTheDocument();
  });

  /* Le bloquant du matin : à Paliers le geste visait un `button` ; le « + » de la courbe est un élément SVG. Ici, dans le VRAI rendu de l'étape. */
  it('« Ajouter un palier » ajoute un palier à la courbe de l’étape (le même geste que son « + »)', () => {
    ouvrir();
    allerEtape(/^Paliers$/);
    const paliers = () => (screen.getByRole('group', { name: /^Courbe/ }).getAttribute('aria-label') ?? '').split('pendant').length - 1;
    const avant = paliers();
    expect(avant).toBeGreaterThan(0);
    expect(screen.queryByRole('slider', { name: /Température du palier/ })).toBeNull();
    fireEvent.click(within(ouvrirMenu()).getByRole('menuitem', { name: /Ajouter un palier/ }));
    expect(screen.queryByRole('menu')).toBeNull();
    expect(paliers()).toBe(avant + 1);
    // Le nouveau palier est touché d'office (le bandeau et sa poignée de température existent).
    expect(screen.getByRole('slider', { name: /Température du palier \d/ })).toBeInTheDocument();
  });

  it('Levure : « Changer de levure » met le curseur dans le champ de recherche de l’étape', () => {
    ouvrir();
    allerEtape(/^Levure$/);
    fireEvent.click(within(ouvrirMenu()).getByRole('menuitem', { name: /Changer de levure/ }));
    expect(screen.queryByRole('menu')).toBeNull();
    const champ = document.activeElement as HTMLElement | null;
    expect(champ?.tagName).toBe('INPUT');
    expect(champ?.getAttribute('aria-label') ?? '').toMatch(/levure|Nom, fabricant ou code/i);
  });

  it('« Ajouter un malt ou un sucre » met le curseur dans le champ d’ajout de l’étape', () => {
    ouvrir();
    allerEtape(/^Malts\/sucres$/);
    fireEvent.click(within(ouvrirMenu()).getByRole('menuitem', { name: /Ajouter un malt ou un sucre/ }));
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(document.querySelector('input[data-role="ajout"]'));
  });

  it('« Enregistrer la recette » enregistre depuis n’importe quelle étape', async () => {
    const onSave = ouvrir();
    allerEtape(/^Paliers$/);
    fireEvent.click(within(ouvrirMenu()).getByRole('menuitem', { name: /Enregistrer la recette/ }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][1]).toBe(false);
  });

  it('« Exporter la recette » copie le texte, dit « Recette copiée. » et reste à l’étape en cours', async () => {
    const copie = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: copie }, configurable: true });
    ouvrir();
    allerEtape(/^Levure$/);
    fireEvent.click(within(ouvrirMenu()).getByRole('menuitem', { name: /Exporter la recette/ }));
    await waitFor(() => expect(copie).toHaveBeenCalledTimes(1));
    expect(copie.mock.calls[0][0]).toMatch(/\S/);
    expect(await screen.findByText('Recette copiée.')).toBeInTheDocument();
    expect(screen.getByRole('main', { name: 'Levure' })).toBeInTheDocument();
  });

  it('« Exporter la recette » : une copie refusée se dit, jamais en silence', async () => {
    const copie = vi.fn().mockRejectedValue(Object.assign(new Error('refusé'), { name: 'NotAllowedError' }));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: copie }, configurable: true });
    ouvrir();
    fireEvent.click(within(ouvrirMenu()).getByRole('menuitem', { name: /Exporter la recette/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Copie refusée/);
  });

  it('un geste de « Partout » garde sa place : « Créer une recette » reste dans le menu de l’assistant', () => {
    ouvrir();
    const menu = ouvrirMenu();
    expect(within(menu.querySelector<HTMLElement>('[data-zone="partout"]')!).getByRole('menuitem', { name: /Créer une recette/ })).toBeInTheDocument();
    fermerMenu();
  });

  it('hors de l’assistant, le « + » ne montre rien de la recette', () => {
    render(<FloatingActions action={null} onAction={() => {}} companionLabel="Ailleurs" anchor="page" />);
    const menu = ouvrirMenu();
    expect(within(menu).queryByRole('menuitem', { name: /Enregistrer la recette/ })).toBeNull();
    expect(menu.querySelector('[data-page-etapes]')).toBeNull();
  });
});
