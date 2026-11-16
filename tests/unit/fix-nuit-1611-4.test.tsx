// @vitest-environment jsdom
// Nuit 16.11, constat 4 : la feuille « Ranger » s'étalait sur toute la largeur à 1280. Comme les autres feuilles : colonne centrée.
// Fixture FICTIVE (préfixe ZZ).
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CatalogItemMenu } from '../../src/ui/production/CatalogItemMenu';
import type { CatalogEntry } from '../../src/domain/productionCatalog';

afterEach(cleanup);

const brassin = { id: 'ZZ-100', name: 'ZZ Blonde de soif', archivedAt: undefined } as unknown as CatalogEntry;
const recette = { id: 'zz-r1', name: 'ZZ Blonde de soif', version: 2, recipe: { id: 'zz-r1' }, archivedAt: undefined } as unknown as CatalogEntry;

describe('constat 4 : la feuille Ranger est une colonne centrée sur grand écran', () => {
  it.each([['brassin', brassin, 'Ranger le brassin ZZ-100'], ['recette', recette, 'Ranger la recette ZZ Blonde de soif, V2']])('%s', (_n, entry, nom) => {
    render(<CatalogItemMenu entry={entry} onArchive={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: nom }));
    const classes = screen.getByRole('dialog').className;
    expect(classes).toContain('lg:max-w-xl');
    expect(classes).toContain('lg:mx-auto');
  });
});
