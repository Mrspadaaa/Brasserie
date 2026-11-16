import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { RecipePage } from '../../src/pages/RecipePage';
import { FloatingActions } from '../../src/ui/FloatingActions';
import { defaultConfig } from '../../src/services/storage';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(() => { cleanup(); localStorage.clear(); });

/**
 * Matin 16.11, décision du pilote (option b) : « Supprimer la recette » se déclare aussi parmi les actions de la page de la
 * recette, dans le menu du « + » (mécanisme `usePlusPage`, b1r), même feuille de confirmation ; le bouton du bas reste.
 */
const monter = () => {
  const onDelete = vi.fn();
  const vue = render(
    <>
      <RecipePage recipe={yeastFlowRecipe()} batches={[]} config={defaultConfig}
        onClose={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={onDelete} onBrew={vi.fn()} onOpenBatch={vi.fn()} />
      <FloatingActions action={null} onAction={() => {}} companionLabel="Recette" anchor="page" />
    </>
  );
  return { ...vue, onDelete };
};
const ouvrirMenu = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Actions rapides' }));
  return screen.getByRole('menu', { name: 'Actions rapides' });
};

describe('Le « + » de la page de la recette propose Supprimer la recette', () => {
  it('Supprimer la recette est en tête du menu (avant « Partout ») ; il ouvre la même feuille et ne supprime qu\'à la confirmation', async () => {
    const { onDelete } = monter();
    const menu = ouvrirMenu();
    const ligne = menu.querySelector('[data-page-action="supprimer"]') as HTMLElement;
    expect(ligne).toBeTruthy();
    expect(ligne).toHaveTextContent('Supprimer la recette');
    const grille = menu.querySelector('[data-zone="partout"]')!;
    expect(ligne.compareDocumentPosition(grille) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(ligne);
    // Menu refermé, feuille de confirmation ouverte, rien supprimé.
    expect(screen.queryByRole('menu')).toBeNull();
    expect((await screen.findAllByText('Supprimer cette recette ?')).length).toBeGreaterThan(0);
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('button', { name: 'Supprimer la recette' }).pop()!);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('le menu montre les actions de la recette contre le + d’abord, Supprimer en dernier (le plus loin), en rouge', () => {
    const onBrew = vi.fn(); const onEdit = vi.fn(); const onDuplicate = vi.fn();
    render(
      <>
        <RecipePage recipe={yeastFlowRecipe()} batches={[]} config={defaultConfig}
          onClose={vi.fn()} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={vi.fn()} onBrew={onBrew} onOpenBatch={vi.fn()} />
        <FloatingActions action={null} onAction={() => {}} companionLabel="Recette" anchor="page" />
      </>
    );
    const menu = ouvrirMenu();
    const ids = [...menu.querySelectorAll<HTMLElement>('[data-page-action]')].map(b => b.dataset.pageAction);
    // L'ordre du DOM est celui de la pile lue depuis le + : la première ligne est la plus proche du pouce.
    expect(ids).toEqual(['brasser', 'modifier', 'dupliquer', 'exporter', 'supprimer']);
    const noms = [...menu.querySelectorAll<HTMLElement>('[data-page-action]')].map(b => b.textContent ?? '');
    expect(noms[0]).toMatch(/^Préparer un brassin/);
    expect(noms[1]).toMatch(/^Modifier/);
    expect(noms[2]).toMatch(/^Dupliquer/);
    expect(noms[3]).toMatch(/^Exporter/);
    expect(menu.querySelector('[data-page-action="supprimer"]')!.className).toMatch(/plus-pp--danger/);
    expect(menu.querySelector('[data-page-action="modifier"]')!.className).not.toMatch(/plus-pp--danger/);
    fireEvent.click(menu.querySelector('[data-page-action="modifier"]')!);
    expect(onEdit).toHaveBeenCalledTimes(1);
    fireEvent.click(ouvrirMenu().querySelector('[data-page-action="dupliquer"]')!);
    expect(onDuplicate).toHaveBeenCalledTimes(1);
    fireEvent.click(ouvrirMenu().querySelector('[data-page-action="brasser"]')!);
    expect(onBrew).toHaveBeenCalledTimes(1);
  });

  it('« Exporter » du menu ouvre la feuille d’export de la page', async () => {
    monter();
    fireEvent.click(ouvrirMenu().querySelector('[data-page-action="exporter"]')!);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(await screen.findByRole('button', { name: /Copier la recette en texte/ })).toBeInTheDocument();
  });

  it('la feuille ne répète pas le nom (style = nom) ; ses boutons font 44 px', async () => {
    const recette = { ...yeastFlowRecipe(), name: 'American IPA', style: 'American IPA' };
    render(
      <RecipePage recipe={recette} batches={[]} config={defaultConfig}
        onClose={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} onBrew={vi.fn()} onOpenBatch={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer la recette' }));
    const quoi = (await screen.findAllByText(/^American IPA — /)).find(e => e.tagName === 'P')!;
    expect(quoi.textContent).toMatch(/^American IPA — [\d.,]+ ?L$/);
    expect((quoi.textContent!.match(/American IPA/g) ?? []).length).toBe(1);
    const annuler = screen.getByRole('button', { name: 'Annuler' });
    const confirmer = screen.getAllByRole('button', { name: 'Supprimer la recette' }).pop()!;
    expect(annuler.className).toMatch(/min-h-\[44px\]/);
    expect(confirmer.className).toMatch(/min-h-\[44px\]/);
  });

  it('un style différent du nom reste dit', async () => {
    render(
      <RecipePage recipe={{ ...yeastFlowRecipe(), name: 'Ma blonde', style: 'Blonde Ale' }} batches={[]} config={defaultConfig}
        onClose={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} onBrew={vi.fn()} onOpenBatch={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer la recette' }));
    expect((await screen.findAllByText(/^Ma blonde — Blonde Ale, /)).length).toBeGreaterThan(0);
  });

  it('le bouton du bas reste, éloigné de Dupliquer ; la page retirée, le menu perd la ligne', () => {
    const { container, unmount } = monter();
    expect(within(container.querySelector('[data-element="r1-supprimer"]') as HTMLElement).getByRole('button', { name: 'Supprimer la recette' })).toBeTruthy();
    unmount();
    render(<FloatingActions action={null} onAction={() => {}} companionLabel="Ailleurs" anchor="page" />);
    expect(ouvrirMenu().querySelector('[data-page-action="supprimer"]')).toBeNull();
  });
});
