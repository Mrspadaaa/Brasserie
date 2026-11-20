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

// k3 (20.11), point 9 : au survol en clair, nolo-simulator.css reposait un fond ocre sous le texte blanc (≈ 3,6:1).
// Le survol garde donc le fond de l'aplat (blanc sur fond noir en clair, encre sombre sur ambre en cave) et ne l'éclaircit que d'un filtre.
describe('bugs r2 : NOLO, survol d’Appliquer (k3 point 9)', () => {
  it('le survol ne remplace pas le fond par l’ocre --c-e0af3c', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/ui/nolo-simulator.css', 'utf8');
    const regle = css.split('\n').find((l) => l.startsWith('.nolo-solver-apply:hover'))!;
    expect(regle).toBeTruthy();
    expect(regle).not.toMatch(/c-e0af3c/);
    expect(regle).toMatch(/--ebc-straw/);
  });
});

// k3, point 10 : deux phrases de jargon dans « Objectif NOLO ».
describe('bugs r2 : NOLO, mots de brasseur (k3 point 10)', () => {
  it('ni « projection indisponible pour cette souche » ni « avec ces hypothèses »', () => {
    render(<NoloRecipeSimulator recipe={fruty(true)} onChange={() => {}} science={noloScience()!} />);
    const texte = document.body.textContent ?? '';
    expect(texte).not.toMatch(/projection indisponible/i);
    expect(texte).not.toMatch(/avec ces hypothèses/i);
    expect(texte).toMatch(/Sous la consigne avec ces réglages|dépasse la consigne|Compléter les points/);
  });
});
