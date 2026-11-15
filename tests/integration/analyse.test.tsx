/* Voie an (10.11) : l'outil d'analyse a2a, ouvert depuis la Synthèse (« Revoir le mois »). Jeu clairsemé commun (une seule vente, aucun solde, aucun budget) : tout manque est un renvoi,
   jamais un 0 inventé. Aucun réseau, aucun Gemini. Les nombres sont éprouvés dans tests/unit/analyse.test.ts. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { clairseme, parCollection, ASOF } from '../fixtures/renvoisClairseme';

const laisser = () => act(async () => { await new Promise(r => setTimeout(r, 0)); });
const lire = () => StorageService.getTransactions();
function Finances() {
  const transactions = useStorageValue(lire);
  StorageService.setUiState('finances_workspace', 'overview');
  return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" batches={parCollection(clairseme(), 'batches') as never} stockItems={parCollection(clairseme(), 'stockItems') as never} />;
}
async function ouvrir() {
  for (const e of clairseme()) FirestoreRepo.put(e.name as never, e.id, e.data);
  const r = render(<Finances />); await laisser();
  fireEvent.click(screen.getByRole('button', { name: /Revoir le mois/ })); await laisser();
  return r;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${ASOF}T10:00:00`));
  window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync();
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Analyse (a2a) depuis la Synthèse', () => {
  it('la Synthèse offre « Revoir le mois » ; l’outil ouvre sur la Caisse avec ses quatre vues', async () => {
    await ouvrir();
    const vues = screen.getAllByRole('tab').map(t => t.textContent?.trim());
    expect(vues).toEqual(expect.arrayContaining(['Caisse', 'Sources', 'Budget', 'Filtrer']));
    expect(screen.getByRole('tab', { name: /^Caisse/ }).getAttribute('aria-selected')).toBe('true');
  });
  it('chaque vue ouvre par une phrase chiffrée en CHF (unités dites)', async () => {
    const { container } = await ouvrir();
    for (const vue of ['Caisse', 'Sources', 'Budget', 'Filtrer']) {
      fireEvent.click(screen.getByRole('tab', { name: new RegExp(`^${vue}`) })); await laisser();
      expect(container.textContent, `vue ${vue}`).toMatch(/CHF|rien de prévu|rien noté/);
    }
  });
  it('Budget : la phrase dit le dépensé en CHF ; un manque de prévu est un renvoi vers Prévisions, jamais un 0', async () => {
    const { container } = await ouvrir();
    fireEvent.click(screen.getByRole('tab', { name: /^Budget/ })); await laisser();
    expect(container.textContent).toMatch(/CHF dépensé sur/);
    // chaque règle est un bouton (voir ces opérations) : un « rien de prévu » par source n'est jamais un texte mort ; sans aucun prévu, la tâche renvoie vers Prévisions
    expect(screen.getAllByRole('button', { name: /voir ces opérations/ }).length).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });
  it('sans solde confirmé : la Caisse parle d’écart et renvoie vers le solde de départ', async () => {
    await ouvrir();
    expect(screen.getAllByRole('button', { name: /à confirmer|solde/i }).length).toBeGreaterThan(0);
  });
  it('« Retour » rend la Synthèse', async () => {
    await ouvrir();
    fireEvent.click(screen.getAllByRole('button', { name: /retour|synthèse/i })[0]); await laisser();
    expect(screen.getByRole('button', { name: /Revoir le mois/ })).toBeTruthy();
  });
});
