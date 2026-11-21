// @vitest-environment jsdom
// Voie p3 : coque de l'onglet (e11a), Adapter les volumes (e10c), filtre de période. Vraies fonctions du domaine, aucune IA.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ProductionTab } from '../../src/components/tabs/ProductionTab';
import { StorageService } from '../../src/services/storage';
import type { Batch, BrewhouseProfile, Recipe } from '../../src/types';
import { scaleBrewRecipeScenario } from '../../src/domain/finance/brewBudgetScaling';
import { ecartAffiche, etapesDe, totauxDe } from '../../src/ui/production/volumes/etapes';
import { etatVolume } from '../../src/ui/production/volumes/AdapterVolumes';
import { dryHopDans, fgAConfirmer, phraseBrassins, phraseRecettes, retardDe } from '../../src/ui/production/volumes/phrase';
import { batchesVisiblesSousPeriode } from '../../src/ui/production/volumes/periode';

const brewhouse: BrewhouseProfile = { id: 'qa', name: 'Système 30 L', volumeL: 30, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 3 };
const recette = {
  id: 'r1', name: 'ZZ NEIPA', style: 'New England IPA', volumeL: 24, boilMin: 60,
  fermentables: [
    { name: 'ZZ Pale Ale', weightKg: 5, kind: 'grain', use: 'empatage', potentialPpg: 37, colorEbc: 5 },
    { name: 'ZZ Avoine', weightKg: 0.8, kind: 'grain', use: 'empatage', potentialPpg: 33, colorEbc: 3 }
  ],
  hops: [
    { name: 'ZZ Houblon amer', weightG: 10, stage: 'boil', timeMin: 60, alpha: 12 },
    { name: 'ZZ Houblon arôme', weightG: 60, stage: 'whirlpool', timeMin: 20, alpha: 12 },
    { name: 'ZZ Houblon arôme', weightG: 100, stage: 'dryHop', dayOffset: 6, alpha: 12 }
  ],
  yeast: { name: 'ZZ Levure', qty: 1, unit: 'sachet' }
} as unknown as Recipe;

const monter = (extra: Partial<React.ComponentProps<typeof ProductionTab>> = {}) => render(
  <ProductionTab recipes={[recette]} batches={[]} brewhouses={[brewhouse]} activeBrewhouseId="qa" globalTimeFilter="all" targetSubTab="scaler"
    onOpenCreateBatch={vi.fn()} onOpenRecipe={vi.fn()} onOpenBrewDay={vi.fn()} onDraftRecipe={vi.fn()} {...extra} />
);
beforeEach(() => { localStorage.clear(); vi.spyOn(StorageService, 'setUiState').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const taper = (texte: string) => {
  fireEvent.click(screen.getByRole('button', { name: 'Taper le volume' }));
  const champ = screen.getByRole('textbox', { name: 'Volume cible' });
  fireEvent.change(champ, { target: { value: texte } });
  fireEvent.keyDown(champ, { key: 'Enter' });
};

describe('e10c · Adapter les volumes', () => {
  it('au repos : volume de la recette, × 1,00, totaux, moments dans l’ordre du jour, aucun écart', () => {
    monter();
    expect(screen.getByText('À peser pour', { exact: false })).toHaveTextContent('À peser pour 24 L');
    expect(screen.getByText(/recette 24 L/)).toHaveTextContent('× 1');
    const titres = [...document.querySelectorAll('[data-etape]')].map(e => e.getAttribute('data-etape'));
    expect(titres).toEqual(['empatage', 'rincage', 'ebullition', 'whirlpool', 'levurage', 'dryhop']);
    expect(document.querySelector('.pv-pastille[data-ton="attention"]')).toBeNull();
    expect(screen.getByRole('checkbox', { name: 'Pesé : ZZ Pale Ale' })).toHaveAttribute('aria-checked', 'false');
  });

  it('l’eau : un nombre quand le calcul aboutit, « — » (jamais 0 L) sans grain à l’empâtage ; décimales fixes', () => {
    monter();
    expect(document.querySelector('[data-ligne="m0"] .pv-q')?.textContent).toBe('5,00 kg');
    expect(document.querySelector('[data-ligne="eau-empatage"] .pv-q')?.textContent).not.toBe('—');
    cleanup();
    monter({ recipes: [{ ...recette, fermentables: [] } as unknown as Recipe] });
    const eau = document.querySelector('[data-ligne="eau-empatage"] .pv-q') as HTMLElement;
    expect(eau.textContent).toBe('—');
    expect(document.querySelector('[aria-label="Totaux"]')?.textContent).toContain('eau—');
  });

  it('jamais type="number" ; le curseur donne un volume à la virgule ; l’écart apparaît à 30 L', () => {
    monter();
    expect(document.querySelector('input[type="number"]')).toBeNull();
    fireEvent.change(screen.getByRole('slider', { name: 'Volume cible, curseur' }), { target: { value: '30' } });
    expect(screen.getByText('À peser pour', { exact: false })).toHaveTextContent('À peser pour 30 L');
    const pale = document.querySelector('[data-ligne="m0"]') as HTMLElement;
    expect(within(pale).getByText('6,25')).toBeInTheDocument();
    expect(pale.querySelector('.pv-pastille')).toHaveTextContent('+1,25');
  });

  it('valeur tapée à la virgule : 18,5 L', () => {
    monter();
    taper('18,5');
    expect(screen.getByText('À peser pour', { exact: false })).toHaveTextContent('À peser pour 18,5 L');
  });

  it('au-delà de la cuve : dit « ne tiennent pas dans » avec la capacité, sans inventer de cuve', () => {
    monter();
    taper('40');
    expect(screen.getByText(/ne tiennent pas dans Système 30 L/)).toBeInTheDocument();
    expect(screen.getByText('Système 30 L prend 30 L au plus.')).toBeInTheDocument();
  });

  it('volume refusé : la borne est dite, toutes les quantités sont « — », jamais 0', () => {
    monter();
    taper('99999');
    expect(screen.getByRole('alert')).toHaveTextContent(/Au plus 2\s?000 L/);
    document.querySelectorAll('.pv-reading').forEach(l => expect(l.textContent).not.toBe('0'));
    const lignes = [...document.querySelectorAll('.pv-row .pv-q')];
    expect(lignes.length).toBeGreaterThan(0);
    lignes.forEach(l => expect(l).toHaveTextContent('—'));
    taper('0');
    expect(screen.getByRole('alert')).toHaveTextContent('0,5 L ou plus');
    taper('abc');
    expect(screen.getByRole('alert')).toHaveTextContent(/non reconnu/);
  });

  it('une quantité se coche ; carnet vide : « Rien à peser » et le bouton ouvre l’assistant de recette', () => {
    const creer = vi.fn();
    const { unmount } = monter();
    const coche = screen.getByRole('checkbox', { name: 'Pesé : ZZ Pale Ale' });
    fireEvent.click(coche);
    expect(coche).toHaveAttribute('aria-checked', 'true');
    unmount();
    monter({ recipes: [], onOpenCreateBatch: creer });
    expect(screen.getByText(/Rien à peser/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Créer une recette/ }));
    expect(creer).toHaveBeenCalledTimes(1);
  });

  it('étapes : les quantités sortent du calcul existant, écart = cible − recette', () => {
    const base = scaleBrewRecipeScenario(recette, 24, brewhouse, brewhouse);
    const cible = scaleBrewRecipeScenario(recette, 40, brewhouse, brewhouse);
    const etapes = etapesDe(recette, cible, base);
    const dry = etapes.find(e => e.id === 'dryhop')!;
    expect(dry.detail).toBe('J+6');
    expect(dry.lignes[0].valeur).toBe(cible.scaledRecipe.hops.find(h => h.stage === 'dryHop')!.weightG);
    expect(dry.lignes[0].ecart).toBe(dry.lignes[0].valeur! - 100);
    expect(totauxDe(base).houblonG).toBe(170);
    expect(ecartAffiche(3.333, 2)).toBe('+3,33');
    expect(ecartAffiche(-0.5, 1)).toBe('−0,5');
    expect(ecartAffiche(0.001, 2)).toBe('');
    expect(etapesDe(recette, base, null).every(e => e.lignes.every(l => l.ecart === undefined))).toBe(true);
  });

  it('bornes : 0,5 à 2 000 L, refus dit', () => {
    expect(etatVolume(24).genre).toBe('ok');
    expect(etatVolume(2000).genre).toBe('ok');
    expect(etatVolume(2500)).toMatchObject({ genre: 'refuse', tete: expect.stringContaining('2') });
    expect(etatVolume(0.2).genre).toBe('refuse');
    expect(etatVolume(Number.NaN).genre).toBe('refuse');
  });
});

const jour = (d: number) => { const x = new Date(Date.now() + d * 86400000); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const lot = (id: string, status: string, extra: Record<string, unknown> = {}) => ({ id, name: `ZZ ${id}`, style: 'IPA', volumeL: 24, status, brewDate: '', recipeSnapshot: { name: `ZZ ${id}`, hops: [] }, ...extra }) as unknown as Batch;

describe('e11a · la coque', () => {
  it('quatre sous-onglets, compteurs en pastilles, plus de bouton « Atelier Houblons V5.5 »', () => {
    monter({ batches: [lot('A', 'fermentation', { brewDate: jour(-2) })], onOpenHopV55: vi.fn() });
    const groupe = screen.getByRole('group', { name: 'Vue de production' });
    expect(within(groupe).getAllByRole('button').map(b => b.getAttribute('aria-label'))).toEqual(['Brassins (1)', 'Recettes (1)', 'Atelier', 'Adapter les volumes']);
    expect(groupe.querySelectorAll('.pv-n')).toHaveLength(2);
    expect(screen.queryByText(/V5\.5/)).toBeNull();
  });

  it('phrase-réponse : seulement des faits ; rien de vrai, pas de phrase', () => {
    const retard = lot('P', 'planifie', { plannedBrewDate: jour(-6) });
    const stable = lot('S', 'garde', { gravityLog: [{ date: jour(-9), sg: 1.010 }, { date: jour(-4), sg: 1.010 }] });
    expect(retardDe(retard)).toBe(6);
    expect(fgAConfirmer(stable)).toBe(true);
    expect(fgAConfirmer({ ...stable, fg: '1,010' } as Batch)).toBe(false);
    expect(phraseBrassins([retard, stable]).map(f => f.texte)).toEqual(['ZZ P en retard de 6 j', 'ZZ S à confirmer']);
    expect(phraseRecettes([retard])[0]).toMatchObject({ texte: 'ZZ P attend son brassin', fin: 'depuis 6 j' });
    expect(phraseBrassins([lot('C', 'termine')])).toEqual([]);
    const dry = lot('D', 'fermentation', { brewDate: jour(-5), brewDay: { steps: [], currentIndex: 0, pitchedAt: Date.now() - 5 * 86400000 }, recipeSnapshot: { name: 'ZZ D', hops: [{ name: 'H', alpha: 10, weightG: 50, stage: 'dryHop', dayOffset: 6 }] } });
    expect(dryHopDans(dry)).toBe(1);
    expect(phraseBrassins([dry])[0]).toEqual({ texte: 'ZZ D dry hop demain', ton: 'hop' });
  });
});

describe('filtre de période : un brassin en cours reste visible, la période ne juge que les terminés', () => {
  const vieux = (id: string, status: string) => lot(id, status, { brewDate: jour(-200), plannedBrewDate: jour(-200) });
  const lots = [vieux('PLAN', 'planifie'), vieux('FERM', 'fermentation'), vieux('GARDE', 'garde'), vieux('FINI', 'termine')];

  it('fonction : « Ce mois » garde les trois en cours, retire le terminé ancien', () => {
    const ids = batchesVisiblesSousPeriode(lots, 'this-month').map(b => b.id);
    expect(ids).toEqual(['PLAN', 'FERM', 'GARDE']);
    expect(batchesVisiblesSousPeriode(lots, 'all')).toHaveLength(4);
  });

  it('à l’écran : sous « Ce mois », les cartes des brassins en cours sont là, pas celle du terminé', () => {
    monter({ batches: lots, globalTimeFilter: 'this-month', targetSubTab: 'batches' });
    ['PLAN', 'FERM', 'GARDE'].forEach(id => expect(screen.getByRole('button', { name: `Ouvrir le brassin ${id}` })).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Ouvrir le brassin FINI' })).toBeNull();
  });
});
