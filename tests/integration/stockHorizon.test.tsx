// Pastille C (16.11) : l'horizon commun « S49 · 6 sem. · Tout » règle le chiffre clé ET la pastille.
// Semaines ISO 8601 vérifiées à la main (le 1er janvier 2026 est un jeudi : la semaine 1 commence le lundi 29.12.2025).
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { etiquetteSemaine, indiceSemaine, lignesDeHorizon, numeroSemaineIso, phraseHorizon, prochainBrassin, vueHorizon } from '../../src/domain/stock/horizon';
import type { ArticleACommander } from '../../src/domain/stockLevel';
import type { SourceBesoin } from '../../src/domain/stock/disponibilite';
import type { Batch, StockItem } from '../../src/types';
import { ChiffreACommander } from '../../src/ui/stock/ChiffreACommander';
import { useHorizonStock } from '../../src/ui/stock/useHorizonStock';
import { StorageService } from '../../src/services/storage';

const semaineDe = (iso: string) => {
  const [a, m, j] = iso.split('-').map(Number);
  return numeroSemaineIso(indiceSemaine(Math.floor(Date.UTC(a, m - 1, j) / 86_400_000)));
};

describe('semaines ISO', () => {
  it.each([
    ['2026-11-16', 47], ['2026-11-22', 47], ['2026-11-23', 48], ['2026-12-07', 50],
    ['2026-01-01', 1], ['2025-12-29', 1], ['2026-12-28', 53], ['2027-01-03', 53], ['2027-01-04', 1],
    ['2020-12-31', 53], ['2021-01-03', 53], ['2021-01-04', 1], ['2024-12-30', 1]
  ])('%s est en semaine %i', (jour, n) => expect(semaineDe(jour)).toBe(n));

  it('l’étiquette passe l’année : 5 semaines après S50 de 2026 donne S3', () => {
    const s50 = indiceSemaine(Math.floor(Date.UTC(2026, 11, 7) / 86_400_000));
    expect([0, 1, 2, 3, 4, 5].map((i) => etiquetteSemaine(s50 + i))).toEqual(['S50', 'S51', 'S52', 'S53', 'S1', 'S2']);
  });
});

const article = (ref: string, nom: string, sources: SourceBesoin[], extra: Partial<StockItem> = {}): ArticleACommander => ({
  item: { id: ref, ref, name: nom, currentStock: 1, minStock: 0, unit: 'kg', category: 'Malt', reorder: false, kind: 'rawMaterials', ...extra } as StockItem,
  missing: 2, rupture: false, auMoins: false, sources
});
const src = (genre: SourceBesoin['genre'], nom: string, date: string | null): SourceBesoin => ({ genre, id: nom, nom, date, quantite: 1 });
const brassin = (id: string, nom: string, date: string, extra: Partial<Batch> = {}) => ({ id, name: nom, status: 'planifie', plannedBrewDate: date, ...extra } as unknown as Batch);

// Aujourd'hui : lundi 16.11.2026 (S47). Porter le 03.12 (S49), Pils de Noël le 15.12 (S51).
const AUJOURDHUI = '2026-11-16';
const batches = [brassin('B1', 'Porter', '2026-12-03'), brassin('B2', 'Pils de Noël', '2026-12-15')];
const liste = [
  article('a-late', 'Soude caustique', [src('brassin', 'Porter', '2026-11-10')]), // brassin en retard : cette semaine
  article('a-porter', 'Munich', [src('brassin', 'Porter', '2026-12-03')]),
  article('a-porter-2', 'Fuggle', [src('brassin', 'Pils de Noël', '2026-12-15'), src('brassin', 'Porter', '2026-12-03')]), // le plus tôt date le besoin
  article('a-pils', 'Saaz', [src('brassin', 'Pils de Noël', '2026-12-15')]),
  article('a-loin', 'CO₂', [src('brassin', 'Fûts', '2027-03-01')]), // au-delà de six semaines : colonne « seuil », Tout seulement
  article('a-dry', 'Mosaic', [{ genre: 'ajouts-restants', id: 'B0', nom: 'IPA', date: '2026-11-02', quantite: 1 }]), // dû tout de suite
  article('a-recette', 'Simcoe', [src('recette', 'IPA écrite', '2026-10-01')]), // la date de création ne date rien
  article('a-seuil', 'Gypse', [], { minStock: 5, currentStock: 3 })
];

describe('vueHorizon : dater chaque besoin', () => {
  const v = vueHorizon(liste, batches, AUJOURDHUI);

  it('le prochain brassin planifié, jamais dans le passé', () => {
    expect(prochainBrassin(batches, AUJOURDHUI)).toMatchObject({ nom: 'Porter' });
    expect(etiquetteSemaine(v.limiteBrassin)).toBe('S49');
    expect(prochainBrassin([brassin('B3', 'Vieux', '2026-10-01')], AUJOURDHUI)?.semaine).toBe(v.courante);
    expect(prochainBrassin([brassin('B4', 'Fait', '2026-12-03', { stockConsumption: { appliedAt: 1 } } as Partial<Batch>), { ...brassin('B5', 'Brassé', '2026-12-03'), status: 'fermentation' } as unknown as Batch], AUJOURDHUI)).toBeNull();
    expect(prochainBrassin([], AUJOURDHUI)).toBeNull();
  });

  it('trois comptes : avant le prochain brassin, six semaines, tout', () => {
    expect(v.comptes).toEqual({ brassin: 4, six: 5, tout: 8 }); // Soude, Mosaic (dus), Munich, Fuggle (S49) ; + Saaz (S51) ; Tout : + CO₂ (S9), Simcoe, Gypse
    expect(lignesDeHorizon(v, 'brassin').map((l) => l.item.name).sort()).toEqual(['Fuggle', 'Mosaic', 'Munich', 'Soude caustique']);
    expect(lignesDeHorizon(v, 'six').map((l) => l.item.name)).toContain('Saaz');
    expect(lignesDeHorizon(v, 'tout')).toHaveLength(8);
  });

  it('une recette écrite et un article au seuil n’ont pas de semaine inventée : ils ne comptent qu’en Tout', () => {
    const recette = v.lignes.find((l) => l.item.name === 'Simcoe')!;
    expect(recette).toMatchObject({ semaine: null, recetteSeule: true, pour: 'recette écrite : IPA écrite' });
    const seuil = v.lignes.find((l) => l.item.name === 'Gypse')!;
    expect(seuil).toMatchObject({ semaine: null, pour: null });
    for (const nom of ['Simcoe', 'Gypse', 'CO₂']) expect(lignesDeHorizon(v, 'six').map((l) => l.item.name)).not.toContain(nom);
  });

  it('l’histogramme : six semaines depuis la semaine en cours, puis « seuil »', () => {
    expect(v.colonnes.map((c) => `${c.etiquette}:${c.n}`)).toEqual(['S47:2', 'S48:0', 'S49:2', 'S50:0', 'S51:1', 'S52:0', 'seuil:3']);
    expect(v.colonnes.reduce((n, c) => n + c.n, 0)).toBe(v.comptes.tout);
  });

  it('la liste suit les semaines, puis la rupture, puis le nom', () => {
    expect(v.lignes.map((l) => l.item.name)).toEqual(['Mosaic', 'Soude caustique', 'Fuggle', 'Munich', 'Saaz', 'CO₂', 'Gypse', 'Simcoe']);
  });

  it('la phrase du chiffre clé', () => {
    expect(phraseHorizon(v, 'brassin')).toBe('avant S49 · Porter');
    expect(phraseHorizon(v, 'six')).toBe('d’ici S52 · 6 sem.');
    expect(phraseHorizon(v, 'tout')).toBe('tout, seuil compris');
    expect(phraseHorizon(vueHorizon(liste, [], AUJOURDHUI), 'brassin')).toBe('cette semaine · aucun brassin prévu');
  });

  it('rien à commander : zéro partout', () => {
    expect(vueHorizon([], batches, AUJOURDHUI).comptes).toEqual({ brassin: 0, six: 0, tout: 0 });
  });
});

describe('le réglage commun', () => {
  beforeEach(() => { localStorage.clear(); StorageService.clearMemoryCache(); });
  afterEach(cleanup);

  it('deux lecteurs (chiffre clé, pastille) suivent le même réglage, et il se garde', () => {
    const a = renderHook(() => useHorizonStock());
    const b = renderHook(() => useHorizonStock());
    expect(a.result.current[0]).toBe('brassin');
    act(() => a.result.current[1]('tout'));
    expect(b.result.current[0]).toBe('tout');
    expect(StorageService.getUiState('stocks_horizon', 'brassin')).toBe('tout');
    const c = renderHook(() => useHorizonStock());
    expect(c.result.current[0]).toBe('tout');
  });

  it('une valeur inconnue en mémoire revient à « avant le prochain brassin »', () => {
    StorageService.setUiState('stocks_horizon', 'n’importe quoi');
    expect(renderHook(() => useHorizonStock()).result.current[0]).toBe('brassin');
  });
});

describe('ChiffreACommander', () => {
  afterEach(cleanup);
  const v = vueHorizon(liste, batches, AUJOURDHUI);
  const monter = (horizon: 'brassin' | 'six' | 'tout', vue = v) => {
    const onHorizon = vi.fn(); const onOuvrir = vi.fn(); const onCommander = vi.fn();
    render(<ChiffreACommander vue={vue} horizon={horizon} onHorizon={onHorizon} onOuvrir={onOuvrir} onCommander={onCommander} />);
    return { onHorizon, onOuvrir, onCommander };
  };

  it('le gros chiffre suit l’horizon, et toucher « Tout » le règle', () => {
    const { onHorizon } = monter('brassin');
    expect(screen.getByTestId('cac-gros')).toHaveTextContent('4');
    expect(screen.getByText('avant S49 · Porter')).toBeVisible();
    fireEvent.click(screen.getByRole('radio', { name: /Tout/ }));
    expect(onHorizon).toHaveBeenCalledWith('tout');
    expect(screen.getByRole('radio', { name: /S49/ })).toBeChecked();
  });

  it('en Tout : huit articles, les six premiers, le reste dépliable ; une ligne ouvre la fiche, « Commander ces 8 » va aux courses', () => {
    const { onOuvrir, onCommander } = monter('tout');
    expect(screen.getByTestId('cac-gros')).toHaveTextContent('8');
    expect(screen.getAllByRole('button', { name: /^Ouvrir / })).toHaveLength(6);
    fireEvent.click(screen.getByRole('button', { name: 'Voir les 2 autres' }));
    expect(screen.getAllByRole('button', { name: /^Ouvrir / })).toHaveLength(8);
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir Munich' }));
    expect(onOuvrir).toHaveBeenCalledWith(expect.objectContaining({ ref: 'a-porter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Commander ces 8' }));
    expect(onCommander).toHaveBeenCalled();
  });

  it('une ligne datée dit sa semaine et son brassin ; une ligne sans date le dit, sans semaine inventée', () => {
    monter('tout');
    fireEvent.click(screen.getByRole('button', { name: 'Voir les 2 autres' }));
    expect(screen.getByRole('button', { name: 'Ouvrir Munich' })).toHaveTextContent(/S49 · Porter/);
    expect(screen.getByRole('button', { name: 'Ouvrir Gypse' })).toHaveTextContent(/au seuil · aucun brassin prévu/);
    expect(screen.getByRole('button', { name: 'Ouvrir Simcoe' })).toHaveTextContent(/sans date · recette écrite : IPA écrite/);
  });

  it('quantités par Units.format, jamais un champ numérique', () => {
    monter('brassin');
    expect(screen.getByRole('button', { name: 'Ouvrir Munich' })).toHaveTextContent('2 kg');
    expect(document.querySelector('input[type="number"]')).toBeNull();
  });

  it('rien à commander : état vide, pas de réglage ni de bouton', () => {
    monter('brassin', vueHorizon([], batches, AUJOURDHUI));
    expect(screen.getByTestId('cac-gros')).toHaveTextContent('0');
    expect(screen.getByRole('status')).toHaveTextContent('Rien à commander');
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.queryByRole('button', { name: /Commander/ })).toBeNull();
  });

  it('rien avant le brassin mais des articles plus tard : le dit, et propose Tout', () => {
    const plusTard = vueHorizon([liste[6], liste[7]], batches, AUJOURDHUI);
    monter('brassin', plusTard);
    expect(screen.getByTestId('cac-gros')).toHaveTextContent('0');
    expect(screen.getByText(/2 articles viennent plus tard/)).toBeVisible();
    expect(screen.queryByRole('button', { name: /Commander/ })).toBeNull();
  });
});
