/* Voie b-houblons (09.11) : bugs du registre déjà corrigés dans HEAD, ici verrouillés par un test (aucun n'en avait).
   BE-79 : « Enregistrer la fiche » / « Enregistrer la dégustation » à vide marquent le champ fautif (commit 9c5b20d5).
   BE-78 : un ajout de référentiel dit ce qu'il a fait (commit fa57b7b9).
   BR-110, BE-81 : la ligne de comptes de l'index est faite de pastilles séparées, sans « 0 lots 0 lots analysés » collé. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { hopTestLot, hopTestVariety } from '../fixtures/hopIndex';

const state = vi.hoisted(() => ({ varieties: [] as any[], lots: [] as any[], imported: vi.fn(async (_json: string) => 7), saveTasting: vi.fn() }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/services/storage', () => ({ StorageService: {
  getHopVarieties: () => state.varieties, getHopLots: () => state.lots, getHopKnowledge: () => [], getHopPredictions: () => [], getHopTastings: () => [],
  isReady: () => true, importHopIndex: state.imported, subscribe: () => () => {}, saveHopVariety: vi.fn(), saveHopLot: vi.fn(), saveHopKnowledge: vi.fn(),
  saveHopTasting: state.saveTasting,
} }));
import { HopIndexPanel } from '../../src/ui/hopIndex/HopIndexPanel';
import { HopTastingsPanel } from '../../src/ui/hopIndex/HopTastingsPanel';
import { HopKnowledgePanel } from '../../src/ui/hopIndex/HopKnowledgePanel';

beforeEach(() => { state.varieties = [hopTestVariety()]; state.lots = [hopTestLot()]; state.imported.mockClear(); state.saveTasting.mockClear(); });
afterEach(cleanup);

describe('BE-79 — le champ fautif est marqué', () => {
  it('une fiche sans nom : le champ « Nom de la variété » porte l’erreur, aucun « Identité de fiche houblon invalide »', () => {
    render(<HopIndexPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle variété' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la fiche' }));
    expect(document.body.textContent).not.toMatch(/Identité de fiche houblon invalide/);
    expect(screen.getByText('Indique le nom de la variété.')).toBeInTheDocument();
  });
  it('une dégustation sans bière : « Indique la bière dégustée. » au champ, jamais « Dégustation invalide. »', () => {
    render(<HopTastingsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Noter une dégustation/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la dégustation' }));
    expect(document.body.textContent).not.toMatch(/Dégustation invalide/);
    expect(screen.getByText('Indique la bière dégustée.')).toBeInTheDocument();
    expect(state.saveTasting).not.toHaveBeenCalled();
  });
});

describe('BE-78 — un ajout de référentiel dit ce qu’il a fait', () => {
  it.each(['Ajouter hops-json', 'Ajouter HopDatabase', 'Ajouter les références d’amertume à cru'])('« %s » annonce le nombre de fiches ajoutées', async nom => {
    render(<HopKnowledgePanel />);
    fireEvent.click(screen.getByRole('button', { name: nom }));
    await waitFor(() => expect(screen.getAllByRole('status').map(n => n.textContent).join('|')).toMatch(/7 fiche\(s\) ajoutée\(s\)/));
    expect(state.imported).toHaveBeenCalledOnce();
  });
  it('quand rien n’était à ajouter, il le dit aussi', async () => {
    state.imported.mockResolvedValueOnce(0);
    render(<HopKnowledgePanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter hops-json' }));
    await waitFor(() => expect(screen.getAllByRole('status').map(n => n.textContent).join('|')).toMatch(/Rien à ajouter/));
  });
});

describe('BR-110, BE-81 — les comptes de l’index', () => {
  it('« 137 références », « 1 lot », « 1 analysé » : pastilles séparées, aucun « 0 » doublé', () => {
    render(<HopIndexPanel />);
    const texte = document.body.textContent ?? '';
    expect(texte).not.toMatch(/0 lots 0 lots analysés/);
    expect(texte).toMatch(/\d+ références1 lot1 analysé/);
  });
});
