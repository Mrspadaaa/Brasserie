// @vitest-environment jsdom
// CT4C (g1, tour 2) n° 2 et 3 : à 844×340, (2) au moins une rangée entière de l'étagère de plus au premier écran ; (3) la recherche n'est plus
// tronquée (placeholder court) et « Ajouter un article » garde un mot à côté de son « + ».
// jsdom n'évalue pas les @media : les règles de paysageBas.css se lisent dans le texte de la feuille ; la preuve à l'écran est la capture 844×340.
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Recherche, PLACEHOLDER_RECHERCHE, PLACEHOLDER_RECHERCHE_COURT } from '../../src/ui/stock/OutilsStock';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const css = () => readFileSync(join(process.cwd(), 'src/ui/stock/paysageBas.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const bloc = () => css().match(/@media \(orientation:landscape\) and \(max-height:480px\)\{([\s\S]*)\}\s*$/)?.[1] ?? '';
const matchMedia = (matches: boolean) => vi.fn().mockImplementation((query: string) => ({ matches, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }));

describe('CT4C n° 3 : recherche non tronquée en paysage bas', () => {
  it('au téléphone couché, le placeholder est court ; ailleurs, il garde ses trois critères', () => {
    vi.stubGlobal('matchMedia', matchMedia(true));
    render(<Recherche q="" onQ={vi.fn()} />);
    expect(screen.getByRole('searchbox').getAttribute('placeholder')).toBe(PLACEHOLDER_RECHERCHE_COURT);
    cleanup();
    vi.stubGlobal('matchMedia', matchMedia(false));
    render(<Recherche q="" onQ={vi.fn()} />);
    expect(screen.getByRole('searchbox').getAttribute('placeholder')).toBe(PLACEHOLDER_RECHERCHE);
    expect(PLACEHOLDER_RECHERCHE_COURT.length).toBeLessThanOrEqual(14);
  });
  it('« Ajouter un article » garde un mot en paysage bas (plus de « + » muet) : « Article » s\'écrit à la place du texte long, sans nœud de texte à 0 px', () => {
    const b = bloc();
    expect(b).toMatch(/button\[aria-label="Ajouter un article"\]::after\{[^}]*content:"Article"/);
    expect(b).not.toMatch(/font-size:0[;}]/);
  });
  it('le mur perd sa marge haute de 4 px en paysage bas (la rangée Houblons doit finir au-dessus de la barre du bas)', () => {
    expect(bloc()).toMatch(/\.stock-mur \.l1e-mur\{[^}]*margin-top:0!important/);
    expect(bloc()).toMatch(/\.stock-mur \.l1e-r\{[^}]*padding-top:1px!important/);
  });
});

describe('CT4C n° 2 : en-tête du Stock plus bas, une rangée entière de plus', () => {
  it('« Comparer une recette » n\'a plus de marge verticale, la ligne d\'outils et les onglets du mur se resserrent', () => {
    const b = bloc();
    expect(b).toMatch(/details\.shrink-0>summary\{[^}]*padding-top:0[^}]*padding-bottom:0/);
    expect(b).toMatch(/\.stock-outils\.pt-1\{[^}]*padding-top:0/);
    expect(b).toMatch(/\.stock-mur \.sv-tab\{[^}]*min-height:(3[0-4]|2\d)px/);
  });
});
