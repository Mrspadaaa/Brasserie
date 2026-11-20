// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import catalogue from '../../src/data/yeastCatalogueBootstrap.json';
const memory = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: (get: () => unknown) => get() }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getHopKnowledge: () => memory.rows } }));
import { YeastCataloguePanel } from '../../src/ui/YeastCataloguePanel';
afterEach(cleanup);

// BK2-4 (k2, 20.11) : le catalogue des levures parlait en jargon (« Forme non documentée », « référence(s) trouvée(s) »).
describe('bugs r2 : catalogue des levures', () => {
  it('compte au singulier et au pluriel, sans « (s) »', () => {
    memory.rows = catalogue;
    const { container } = render(<YeastCataloguePanel />);
    expect(container.textContent).not.toMatch(/\(s\)/);
    fireEvent.change(screen.getByLabelText('Nom, code ou arôme documenté'), { target: { value: 'WLP300' } });
    expect(container.textContent).toMatch(/1 référence trouvée/);
    expect(container.textContent).not.toMatch(/1 références/);
  });

  it('une fiche sans forme ne dit pas « Forme non documentée » et accorde « caractéristique(s) »', () => {
    memory.rows = catalogue.map((r: any) => ({ ...r, form: undefined }));
    const { container } = render(<YeastCataloguePanel />);
    expect(screen.getAllByRole('article').length).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(/Forme non documentée/);
    expect(container.textContent).not.toMatch(/caractéristique\(s\)/);
  });
});
