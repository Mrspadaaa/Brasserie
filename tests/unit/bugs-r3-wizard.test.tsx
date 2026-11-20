// @vitest-environment jsdom
/**
 * Voie r3 (relance 20.11) — éditeur de recette (BrewWizard).
 *  - B1-NOTE-3 : « Abandonner » est dans l'en-tête dès l'ouverture d'un brouillon, avant le premier geste.
 *  - BR-91 / BE-15 : un seul nom pour l'étape de l'eau, « Eau » (rail, titre, renvois), jamais « Eau et sels ».
 *  - TE-13 : « OG visée 1,072 · calculée 1,0xx avec tes malts » (plus « OG retenue »), avec un `title` qui explique l'écart.
 * Rouge avant : chaque test échoue sur le code du 19.11.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import type { Recipe } from '../../src/types';
import { fullRecipe } from '../fixtures/fullRecipe';
import { allerEtape } from '../helpers/wizard';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));

afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });

function wizard({ recipe = structuredClone(fullRecipe), draftKey }: { recipe?: Recipe; draftKey?: string } = {}) {
  const onClose = vi.fn();
  render(<BrewWizard seed={{ recipe }} draftKey={draftKey} stockItems={[]} config={defaultConfig} knownStyles={[]}
    onClose={onClose} onSave={vi.fn()} writeError={null} onDismissWriteError={vi.fn()} onCreateStockItem={vi.fn()}
    onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
  return { onClose };
}
const abandonner = () => screen.queryByRole('button', { name: 'Abandonner le brouillon' });

describe('B1-NOTE-3 : « Abandonner » dès l\'ouverture du brouillon', () => {
  it('sans aucun geste, le bouton est dans l\'en-tête ; il ouvre « Supprimer ce brouillon ? », « Garder » la referme', () => {
    wizard({ draftKey: 'r3:ouverture' });
    expect(abandonner()).not.toBeNull();
    fireEvent.click(abandonner()!);
    expect(screen.getByText('Supprimer ce brouillon ?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Garder', exact: true }));
    expect(screen.queryByText('Supprimer ce brouillon ?')).toBeNull();
    expect(abandonner()).not.toBeNull();
  });

  it('confirmé, l\'éditeur se ferme', () => {
    const { onClose } = wizard({ draftKey: 'r3:confirme' });
    fireEvent.click(abandonner()!);
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner', exact: true }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('sans clé de brouillon, il n\'y est pas', () => {
    wizard({});
    expect(abandonner()).toBeNull();
  });
});

describe('BR-91 / BE-15 : un seul nom, « Eau »', () => {
  it('le rail, le titre et le renvoi « Suivant » disent « Eau », jamais « Eau et sels »', () => {
    wizard({});
    expect(screen.getAllByRole('button', { name: 'Eau' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Eau et sels/ })).toBeNull();
    allerEtape('Eau');
    expect(document.body.textContent).not.toMatch(/Eau et sels/);
    expect(document.body.textContent).toMatch(/Eau\s*6\/7/);
    allerEtape('Paliers');
    expect(screen.getByRole('button', { name: /^Suivant — Eau$/ })).toBeTruthy();
  });
});

describe('TE-13 : « OG visée … · calculée … avec tes malts »', () => {
  const ligne = () => document.querySelector<HTMLElement>('p[data-role="ecart-og"]');
  it('dit « visée » et « avec tes malts », jamais « retenue », et explique l\'écart au toucher (title)', () => {
    wizard({ recipe: { ...structuredClone(fullRecipe), ogTarget: 1.06, fermentables: [structuredClone(fullRecipe.fermentables[0])] } });
    const p = ligne();
    expect(p).not.toBeNull();
    expect(p!.textContent).toMatch(/^OG visée 1,060 · calculée 1,046 avec tes malts$/);
    expect(p!.textContent).not.toMatch(/retenue/);
    expect(p!.getAttribute('title')).toBe('La cible saisie ; le calcul diffère car les malts ou le rendement ont changé');
  });
  it('sans fermentescible : « OG visée … · aucun fermentescible pour la calculer »', () => {
    wizard({ recipe: { ...structuredClone(fullRecipe), ogTarget: 1.066, fermentables: [], totalGristKg: 0 } });
    const p = ligne();
    expect(p).not.toBeNull();
    expect(p!.textContent).toMatch(/^OG visée 1,066 · aucun fermentescible pour la calculer$/);
    expect(p!.getAttribute('title')).toBeTruthy();
  });
});
