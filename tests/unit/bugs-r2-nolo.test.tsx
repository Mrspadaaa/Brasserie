// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { NoloRecipeSimulator } from '../../src/ui/NoloRecipeSimulator';
import { noloScience } from '../../src/domain/nolo';
import { fruty } from '../fixtures/fruty';
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(() => { cleanup(); localStorage.clear(); });

// BK2-6 (k2, 20.11) : « Appliquer à la recette » en brun sur fond sombre (clair : fond = --ebc-straw, presque noir ; encre = --ct-211b15, brun).
// Le thème clair blanchit le texte de tout élément « .bg-ebc-straw » (themes.css) : la classe sur le bouton lui donne l'encre qui s'inverse avec le thème.
describe('bugs r2 : NOLO, bouton Appliquer', () => {
  it('le bouton porte la classe d’aplat paille, dont le thème clair blanchit l’encre (plus de brun fixe sur fond noir)', () => {
    render(<NoloRecipeSimulator recipe={fruty(true)} onChange={() => {}} science={noloScience()!} />);
    expect(screen.getByRole('button', { name: 'Appliquer à la recette' }).className).toMatch(/bg-ebc-straw/);
  });
});
