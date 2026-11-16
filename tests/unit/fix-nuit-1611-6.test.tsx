// @vitest-environment jsdom
// Nuit 16.11, constat 6 : « Tout effacer » laissait la puce « À brasser » posée. On joue chaque chemin : le bouton de la liste, le lien et le pied de la feuille.
// Fixtures FICTIVES (préfixe ZZ).
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { batchEntries, DEFAULT_CATALOG_FILTERS, type CatalogFilters } from '../../src/domain/productionCatalog';
import { CRITERES_VIDES, type Criteres } from '../../src/ui/production/liste/listeModel';
import { ListeBrassins } from '../../src/ui/production/liste/ListeBrassins';
import type { Batch } from '../../src/types';

afterEach(cleanup);

const NOW = new Date(2026, 10, 16, 12).getTime();
const lot = (id: string, extra: Partial<Batch> = {}): Batch => ({
  id, name: `ZZ ${id}`, style: 'IPA', volumeL: 24, status: 'fermentation', brewDate: '2026-11-10', volumeBrewedL: 24,
  recipeSnapshot: { name: `ZZ ${id}`, style: 'IPA', volumeL: 24, hops: [] }, ...extra
}) as Batch;
const lots = [
  lot('Z1'),
  lot('Z2', { status: 'garde' }),
  lot('Z4', { status: 'planifie', plannedBrewDate: '30.11.2026', brewDate: '' })
];
const entries = batchEntries(lots);

function Banc({ avancement = [], search = '', volumeMin = '' }: { avancement?: Criteres['avancement']; search?: string; volumeMin?: string }) {
  const [filtres, setFiltres] = useState<CatalogFilters>({ ...DEFAULT_CATALOG_FILTERS, search, volumeMin });
  const [criteres, setCriteres] = useState<Criteres>({ ...CRITERES_VIDES, avancement });
  return <ListeBrassins entries={entries} filtres={filtres} onFiltres={setFiltres} criteres={criteres} onCriteres={setCriteres}
    appPeriode="all" now={NOW} onOpenBatch={vi.fn()} onBrew={vi.fn()} onFavorite={vi.fn()} onArchive={vi.fn()} onBilan={vi.fn()} />;
}
const pose = (racine: HTMLElement) => within(racine).getAllByRole('button', { name: /^À brasser/ }).map(b => b.getAttribute('aria-pressed'));

describe('constat 6 : Tout effacer retire la puce « À brasser »', () => {
  it('bouton de la liste : la puce passe à non posée', () => {
    render(<Banc />);
    fireEvent.click(screen.getByRole('button', { name: 'À brasser' }));
    expect(screen.getByRole('button', { name: 'À brasser' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /Tout effacer/ }));
    expect(screen.getByRole('button', { name: 'À brasser' }).getAttribute('aria-pressed')).toBe('false');
  });
  it('avec une recherche et un volume posés en plus', () => {
    render(<Banc avancement={['brasser']} search="ZZ" volumeMin="10" />);
    fireEvent.click(screen.getByRole('button', { name: /Tout effacer/ }));
    expect(screen.getByRole('button', { name: 'À brasser' }).getAttribute('aria-pressed')).toBe('false');
    expect((screen.getByRole('textbox', { name: 'Chercher un brassin' }) as HTMLInputElement).value).toBe('');
  });
  it('feuille de filtres : le lien « Tout effacer » vide aussi la tuile « À brasser »', () => {
    render(<Banc avancement={['brasser']} />);
    fireEvent.click(screen.getByRole('button', { name: /^Filtrer/ }));
    const feuille = screen.getByRole('dialog');
    expect(pose(feuille).includes('true')).toBe(true);
    fireEvent.click(within(feuille).getByRole('button', { name: /^Tout effacer$/ }));
    expect(pose(screen.getByRole('dialog')).every(p => p === 'false')).toBe(true);
  });
});
