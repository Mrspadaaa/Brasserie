// @vitest-environment jsdom
/**
 * Critique tour 4 (c), voie g3.
 * CT4C-7 : Finances › Synthèse à 390 : le + flottant passait sur « 4 181,60 CHF » (carte En caisse) et la pastille « Compagnon hors connexion » sur une ligne
 *          de la carte. La carte garde sa colonne de droite libre (largeur du +) ; la pastille devient un point sans texte visible,
 *          puis (CRN-19, 21.11 : « il ne veut rien dire ») plus rien de visible.
 * CT4C-9 : Vendre à 844×340 : en paysage bas, la feuille s'élargit et passe sur deux colonnes (panier et « Facturer » à droite, visibles).
 * jsdom ne mesure pas la mise en page : les règles CSS se lisent dans les feuilles (même fichier que celui qui est chargé) ; la mesure réelle
 * (rectangles du + et des montants, 390/844/1280, clair et cave) est au banc `voies/g3/bench.mjs`, résultats dans RESULTAT.md.
 */
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/brewerChat', () => ({
  BrewerChat: { userKey: vi.fn(), history: vi.fn(), activity: vi.fn(), reset: vi.fn(), submit: vi.fn(), status: vi.fn(), markRead: vi.fn(), retry: vi.fn() },
  brewerChatError: () => 'Erreur de connexion.'
}));
import { BrewerActivity } from '../../src/ui/BrewerActivity';

const css = (f: string) => fs.readFileSync(path.resolve(__dirname, '../../src', f), 'utf8');
/** Corps du premier bloc `@media <condition> { … }` dont l'entête contient `condition`. */
const bloc = (source: string, condition: string): string | null => {
  const i = source.indexOf(`@media ${condition}`);
  if (i < 0) return null;
  const debut = source.indexOf('{', i);
  let prof = 0;
  for (let j = debut; j < source.length; j++) {
    if (source[j] === '{') prof++;
    if (source[j] === '}' && --prof === 0) return source.slice(debut + 1, j);
  }
  return null;
};
afterEach(() => cleanup());

describe('CT4C-7 : rien de couvert dans la carte En caisse (390)', () => {
  it('la carte réserve au moins 4,5 rem à droite sur téléphone (le + fait 56 px à 12 px du bord)', () => {
    const b = bloc(css('ui/finance/synthese.css'), '(max-width: 899px)');
    expect(b).not.toBeNull();
    const m = /\.syn-caisse\s*\{[^}]*padding-right:\s*([\d.]+)rem/.exec(b!);
    expect(m).not.toBeNull();
    expect(parseFloat(m![1])).toBeGreaterThanOrEqual(4.5);
  });
  it('la pastille « mode local » ne se voit pas : le sens reste dit au lecteur d’écran (CRN-19)', () => {
    window.history.replaceState({}, '', '/?dev-local');
    render(<BrewerActivity localOnly />);
    const pastille = screen.getByRole('status');
    expect(pastille).toHaveTextContent('Compagnon hors connexion · mode local');
    expect(pastille.className).toBe('sr-only');
  });
});

describe('CT4C-9 : Vendre en paysage bas (844×340)', () => {
  const b = bloc(css('ui/vente/caisse.css'), '(orientation: landscape) and (max-height: 480px)');
  it('la feuille s’élargit : le dialogue qui porte la caisse monte à 96 % de l’écran', () => {
    expect(b).not.toBeNull();
    expect(b).toMatch(/\[role='dialog'\]:has\(\.cs-app\)\s*\{\s*max-width:\s*min\(96vw,/);
  });
  it('la caisse passe sur deux colonnes : le panier et « Facturer » (colonne de droite) arrivent dans le premier écran', () => {
    expect(b).toMatch(/\.cs-app\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1fr\)/);
    expect(b).toMatch(/\.cs-right\s*\{\s*grid-column:\s*2/);
  });
});
