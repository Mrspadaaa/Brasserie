// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { fabActionFor } from '../../src/domain/fabActions';
import { FloatingActions } from '../../src/ui/FloatingActions';
import { CatalogAnalysis } from '../../src/ui/production/CatalogAnalysis';
import { ProductionCatalog } from '../../src/ui/production/ProductionCatalog';
import { batchEntries } from '../../src/domain/productionCatalog';
import { StorageService } from '../../src/services/storage';
import type { Batch } from '../../src/types';

afterEach(() => {
  cleanup();
  document.documentElement.style.removeProperty('--floating-actions-nav-dock');
});

const lot = (id: string, extra: Record<string, unknown> = {}): Batch =>
  ({
    id,
    name: `ZZ ${id}`,
    style: 'Pilsner',
    volumeL: 24,
    status: 'termine',
    brewDate: '2026-09-10',
    og: '1,050',
    fg: '1,010',
    volumeBrewedL: 24,
    volumePackagedL: 21,
    recipeSnapshot: { name: 'x', style: 'Pilsner', volumeL: 24, ogTarget: 1.05, fgTarget: 1.01, abvTarget: 5.2, hops: [] },
    ...extra
  }) as unknown as Batch;

describe('e11a · le + dit ce qu’il crée (fabActions)', () => {
  it('Brassins : « Brassin » ; Recettes : « Recette » ; l’Atelier garde un + nu', () => {
    expect(fabActionFor('production', 'batches')).toMatchObject({ intent: 'newBatch', court: 'Brassin', menu: 'brassins', hint: 'Sur Brassins' });
    expect(fabActionFor('production', 'recipes')).toMatchObject({ intent: 'newRecipe', court: 'Recette', menu: 'brassins' });
    expect(fabActionFor('production', 'lab').court).toBeUndefined();
  });
  it('les autres onglets ne changent pas (ni nom court ni menu de la maquette)', () => {
    for (const [tab, sub] of [['stocks', 'stock'], ['clients', 'crm'], ['finances', undefined], ['dashboard', undefined]] as const) {
      const a = fabActionFor(tab, sub as never);
      expect(a.court).toBeUndefined();
      expect(a.menu).toBeUndefined();
    }
  });
});

describe('e11a · le menu du +', () => {
  const montrer = (sub: 'batches' | 'recipes') => {
    const onRecipe = vi.fn();
    render(
      <FloatingActions action={fabActionFor('production', sub)} onAction={vi.fn()} companionLabel="hors connexion · local"
        onInvoice={vi.fn()} onSale={vi.fn()} onRecipe={onRecipe} onBrew={vi.fn()} anchor="nav" />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Actions rapides' }));
    return { onRecipe };
  };

  /* Fusion avec le tag brassins : le menu du + est celui de b1s-a « Deux étages » (choisi le 15.11, `PlusSheet`), qui remplace les groupes
     en dur de e11a ; l'action de l'écran reste en tête, « Sur Brassins ». Sans « Outils houblons » (retiré par d4523967). */
  it('Brassins : l’action de l’écran en tête, puis les gestes de partout (Deux étages)', () => {
    montrer('batches');
    const noms = screen.getAllByRole('menuitem').map((b) => b.textContent);
    expect(noms).toEqual([
      'Nouveau brassinSur Brassins',
      'Écriture',
      'Facture',
      'Vente',
      'Recette',
      'Brassin↑',
      'Compagnon'
    ]);
    expect(noms).not.toContain('Outils houblons');
  });

  it('Recettes : l’action de l’écran en tête, sans doublon « Créer une recette »', () => {
    montrer('recipes');
    const noms = screen.getAllByRole('menuitem').map((b) => b.textContent);
    expect(noms[0]).toBe('Nouvelle recetteSur Recettes');
    expect(noms.filter((n) => n === 'Créer une recette')).toHaveLength(0);
    expect(noms).not.toContain('Outils houblons');
  });

  it('« Outils houblons » n’est plus au menu du +', () => {
    montrer('batches');
    expect(screen.queryByRole('menuitem', { name: 'Outils houblons' })).toBeNull();
  });

  /* Décision du pilote (16.11) : le + de Brassins garde le carré de b1s-b2, sans texte ; le nom de l'action vit en tête de la pile (« Nouveau brassin »). */
  it('le + de Brassins est le carré de b1s-b2 : aucun texte à côté du +, le nom de l’action est en tête de la pile', () => {
    montrer('batches');
    expect(screen.getByRole('button', { name: 'Actions rapides' }).textContent).toBe('');
    expect(screen.getAllByRole('menuitem')[0].textContent).toContain('Nouveau brassin');
  });

  it('un autre onglet garde son menu et son bouton nu', () => {
    render(
      <FloatingActions action={fabActionFor('stocks', 'stock')} onAction={vi.fn()} companionLabel="Stock" onInvoice={vi.fn()}
        onSale={vi.fn()} onRecipe={vi.fn()} onBrew={vi.fn()} anchor="nav" />
    );
    expect(screen.getByRole('button', { name: 'Actions rapides' }).textContent).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Actions rapides' }));
    expect(screen.queryByRole('menuitem', { name: 'Outils houblons' })).toBeNull();
  });
});

describe('e7a · « ‹ Le bilan » et un seul réglage des archives', () => {
  const entries = batchEntries([lot('A'), lot('B', { archivedAt: '2026-11-01' }), lot('C', { brewDate: '2026-10-05' })]);

  it('la flèche ramène à la liste', () => {
    const onBack = vi.fn();
    render(<CatalogAnalysis kind="batches" entries={entries} onFilter={vi.fn()} onOpenBatch={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retour aux brassins' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('l’interrupteur pilote le dossier de l’app quand onFolder est donné', () => {
    const onFolder = vi.fn();
    const { rerender } = render(
      <CatalogAnalysis kind="batches" entries={entries} onFilter={vi.fn()} onOpenBatch={vi.fn()} includeArchivedBatches onFolder={onFolder} />
    );
    const interrupteur = () => screen.getByRole('button', { name: /^Archives/ });
    expect(interrupteur().getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(interrupteur());
    expect(onFolder).toHaveBeenLastCalledWith('current');
    rerender(<CatalogAnalysis kind="batches" entries={entries} onFilter={vi.fn()} onOpenBatch={vi.fn()} includeArchivedBatches={false} onFolder={onFolder} />);
    expect(interrupteur().getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(interrupteur());
    expect(onFolder).toHaveBeenLastCalledWith('all');
  });

  it('le catalogue en vue Bilan : plus de barre de la liste, la flèche revient, l’interrupteur reste actif et garde les archives dans la liste', () => {
    StorageService.setUiState('catalog-batches-view', 'analysis');
    StorageService.setUiState('catalog-batches-analysis-folder', 'all');
    const onVueChange = vi.fn();
    render(
      <ProductionCatalog kind="batches" recipes={[]} batches={[lot('A'), lot('B', { archivedAt: '2026-11-01' })]} globalTimeFilter="all"
        onOpenRecipe={vi.fn()} onEditRecipe={vi.fn()} onOpenBatch={vi.fn()} onOpenBrewDay={vi.fn()} onVueChange={onVueChange} />
    );
    expect(onVueChange).toHaveBeenCalledWith('analysis');
    expect(screen.queryByPlaceholderText(/Nom, lot/)).toBeNull();
    const interrupteur = screen.getByRole('button', { name: /^Archives/ }) as HTMLButtonElement;
    expect(interrupteur.disabled).toBe(false);
    expect(interrupteur.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(interrupteur);
    expect((screen.getByRole('button', { name: /^Archives/ }) as HTMLButtonElement).getAttribute('aria-pressed')).toBe('false');
    // l'archive exclue reste comptée : on peut la remettre
    expect(screen.getByRole('button', { name: /1 brassin archivé/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retour aux brassins' }));
    expect(onVueChange).toHaveBeenLastCalledWith('list');
  });
});
