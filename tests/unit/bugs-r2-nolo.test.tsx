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
// L'encre d'un aplat paille est `cave-950` partout dans l'app (Button primary, AiAssist, atelier) : elle s'inverse avec le thème.
describe('bugs r2 : NOLO, bouton Appliquer', () => {
  it('l’encre du bouton suit le jeu cave-950 (lisible sur l’aplat paille dans les deux thèmes), pas un brun fixe', () => {
    render(<NoloRecipeSimulator recipe={fruty(true)} onChange={() => {}} science={noloScience()!} />);
    expect(screen.getByRole('button', { name: 'Appliquer à la recette' }).className).toMatch(/text-cave-950/);
  });
});
