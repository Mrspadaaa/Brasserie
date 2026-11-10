// @vitest-environment jsdom
// PC-3 (10.11) : la liste du Combobox « Catégorie » de Nouvel article ne montrait que 2 lignes à 390 dans une feuille courte
// (plancher de 96 px, liste absolue coincée entre le haut de la feuille et le champ). Écrit avant le correctif (L13) : rouge sur le tag.
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Combobox } from '../../src/ui/Combobox';

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const noms = ['Malt', 'Houblon', 'Levure', 'Adjuvant', 'Capsules', 'CIP', 'Divers', 'Épices', 'Fruits', 'Emballage'];
const options = noms.map((s) => ({ value: s, label: s }));
const rect = (top: number, left = 16, width = 358) =>
  ({ left, right: left + width, width, top, bottom: top + 40, height: 40, x: left, y: top, toJSON: () => ({}) }) as DOMRect;

// Feuille courte : le champ est bas, le haut du conteneur défilant (le corps de la feuille) est juste au-dessus du champ.
function ouvrir({ largeur, hauteur, champTop, nOptions = options.length }: { largeur: number; hauteur: number; champTop: number; nOptions?: number }) {
  vi.stubGlobal('innerWidth', largeur);
  vi.stubGlobal('innerHeight', hauteur);
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect(champTop));
  render(
    <div style={{ overflowY: 'auto' }}>
      <Combobox value="" onChange={() => undefined} options={options.slice(0, nOptions)} ariaLabel="Catégorie" />
    </div>
  );
  fireEvent.focus(screen.getByRole('combobox'));
  return screen.getByRole('listbox');
}
const hauteurMax = (liste: HTMLElement) => {
  const m = liste.style.maxHeight.match(/min\((\d+)px/) ?? liste.style.maxHeight.match(/(\d+)px/);
  return m ? Number(m[1]) : Infinity;
};

describe('Combobox : liste en feuille courte au téléphone (PC-3)', () => {
  it('390, champ bas et peu de place au-dessus et au-dessous : 5 options au moins de hauteur disponible, liste dans le flux', () => {
    const liste = ouvrir({ largeur: 390, hauteur: 844, champTop: 790 });
    expect(hauteurMax(liste)).toBeGreaterThanOrEqual(5 * 40);
    // dans le flux : la feuille grandit au lieu de rogner la liste
    expect(liste.className).not.toMatch(/\babsolute\b/);
  });
  it('390, clavier ouvert (fenêtre courte) : toujours 5 options', () => {
    const liste = ouvrir({ largeur: 390, hauteur: 520, champTop: 440 });
    expect(hauteurMax(liste)).toBeGreaterThanOrEqual(5 * 40);
    expect(liste.className).not.toMatch(/\babsolute\b/);
  });
  it('une liste de 2 options n’a pas besoin du flux : elle reste flottante', () => {
    const liste = ouvrir({ largeur: 390, hauteur: 844, champTop: 790, nOptions: 2 });
    expect(liste.className).toMatch(/\babsolute\b/);
  });
  it('autres usages inchangés : champ haut avec de la place dessous, la liste reste flottante et ouvre vers le bas', () => {
    const liste = ouvrir({ largeur: 390, hauteur: 844, champTop: 100 });
    expect(liste.className).toMatch(/\babsolute\b/);
    expect(liste.className).toMatch(/top-full/);
  });
  it('autres usages inchangés : au 1280, la liste reste flottante, même sans place', () => {
    const liste = ouvrir({ largeur: 1280, hauteur: 800, champTop: 760 });
    expect(liste.className).toMatch(/\babsolute\b/);
  });
});
