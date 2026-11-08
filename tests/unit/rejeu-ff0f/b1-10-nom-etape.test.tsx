// @vitest-environment jsdom
// Rejeu en ligne ff0f822e (08.11), B1-10 : le titre de l'étape disait « Fermentescibles — étape 2 sur 7 » quand le rail disait « Malts/sucres ».
// Un seul nom d'écran, celui du rail, partout où l'étape se nomme (rail, titre, annonce, bouton « Suivant »).
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrewWizard } from '../../../src/pages/BrewWizard';
import { defaultConfig } from '../../../src/services/storage';
import { fullRecipe } from '../../fixtures/fullRecipe';

vi.mock('../../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));

afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });

function monter() {
  return render(
    <BrewWizard seed={{ recipe: structuredClone(fullRecipe) }} stockItems={[]} config={defaultConfig} knownStyles={[]} onClose={vi.fn()} onSave={vi.fn()}
      writeError={null} onDismissWriteError={vi.fn()} onCreateStockItem={vi.fn()} onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />,
  );
}

describe('B1-10 — un seul nom pour l’étape des malts et sucres', () => {
  it('le rail, le titre et l’annonce disent « Malts/sucres », jamais « Fermentescibles »', () => {
    monter();
    const rail = screen.getAllByRole('navigation', { name: 'Étapes' })[0];
    const noms = Array.from(rail.querySelectorAll('button')).map((b) => b.getAttribute('aria-label'));
    expect(noms).toContain('Malts/sucres');
    expect(noms).not.toContain('Fermentescibles');
    fireEvent.click(screen.getAllByRole('button', { name: 'Malts/sucres' })[0]);
    expect(screen.getByRole('main', { name: 'Malts/sucres' })).toBeInTheDocument();
    const annonces = Array.from(document.querySelectorAll('[aria-live="polite"]')).map((e) => e.textContent ?? '').join('|');
    expect(annonces).toContain('Malts/sucres — étape 2 sur 7');
    expect(annonces).not.toContain('Fermentescibles');
    expect(screen.queryAllByText(/^Fermentescibles\b/)).toHaveLength(0);
  });

  it('le bouton « Suivant » de l’étape d’avant porte le même nom', () => {
    monter();
    const suivants = screen.getAllByRole('button').filter((b) => /^Suivant/.test(b.textContent ?? ''));
    expect(suivants.map((b) => b.textContent).join('|')).toContain('Suivant — Malts/sucres');
  });
});
