// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductionTab } from '../../src/components/tabs/ProductionTab';
import { phraseBrassins } from '../../src/ui/production/volumes/phrase';
import { StorageService } from '../../src/services/storage';
import type { Batch, BrewhouseProfile, Recipe } from '../../src/types';

/** e11a n° 1 (la phrase-réponse de la liste) et e2a n° 1 (« Rebrasser cette <style> ») de kp2. */
const JOUR = 86400000;
const iso = (d: number) => { const x = new Date(Date.now() + d * JOUR); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const brewhouse: BrewhouseProfile = { id: 'qa', name: 'Cuve QA', volumeL: 30, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 3 };
const recette: Recipe = { id: 'REC-SAISON', name: 'Saison maison', style: 'Saison', volumeL: 24, fermentables: [], hops: [] } as unknown as Recipe;
const snap = (nom: string, extra: Record<string, unknown> = {}) => ({ name: nom, style: 'x', volumeL: 24, ogTarget: 1.05, fgTarget: 1.01, abvTarget: 5, hops: [], ...extra }) as never;
const pitched = Date.now() - 5 * JOUR;
const brewDay = { steps: [], currentIndex: 0, finishedAt: pitched, pitchedAt: pitched, pitchTemperatureC: 19, pitchQuantityConfirmation: 'measured' } as never;
const LOTS: Batch[] = [
  { id: 'N', name: 'NEIPA', style: 'NEIPA', volumeL: 24, status: 'fermentation', brewDate: iso(-5), og: '1,062', volumeBrewedL: 24, brewDay,
    recipeSnapshot: snap('NEIPA', { hops: [{ name: 'Citra', alpha: 13, weightG: 100, stage: 'dryHop', dayOffset: 6 }] }) } as Batch,
  { id: 'P', name: 'Pils', style: 'Pilsner', volumeL: 24, status: 'garde', brewDate: iso(-20), og: '1,046', volumeBrewedL: 24, recipeSnapshot: snap('Pils'),
    gravityLog: [{ date: iso(-8), sg: 1.01 }, { date: iso(-1), sg: 1.01 }] } as Batch,
  { id: 'S', name: 'Saison', style: 'Saison', volumeL: 24, status: 'termine', brewDate: iso(-60), og: '1,052', fg: '1,006', volumeBrewedL: 24, volumePackagedL: 21, bottlingDate: iso(-30),
    recipeRef: 'REC-SAISON', recipeSnapshot: snap('Saison', { ogTarget: 1.052, fgTarget: 1.006 }) } as Batch,
];

function monter(extra: Partial<React.ComponentProps<typeof ProductionTab>> = {}, recettes: Recipe[] = [recette]) {
  return render(<ProductionTab recipes={recettes} batches={LOTS} brewhouses={[brewhouse]} activeBrewhouseId="qa" globalTimeFilter="all" targetSubTab="batches"
    onOpenCreateBatch={vi.fn()} onOpenRecipe={vi.fn()} onOpenBrewDay={vi.fn()} onDraftRecipe={vi.fn()} {...extra} />);
}
// m3r-a : la liste lit la période de l'application (`globalTimeFilter="all"` plus haut = « Toutes ») ; ces tests ouvrent un Terminé vieux de 60 jours.
beforeEach(() => { localStorage.clear(); vi.spyOn(StorageService, 'setUiState').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('e11a : la phrase-réponse de la liste', () => {
  it('la règle sort deux fragments vrais : Pils à confirmer, NEIPA dry hop demain', () => {
    expect(phraseBrassins(LOTS).map((f) => f.texte)).toEqual(['Pils à confirmer', 'NEIPA dry hop demain']);
  });

  it('la liste s’ouvre sur sa recherche, sans titre-compteur ; elle laisse place au Bilan et revient', () => {
    monter();
    // 19.11 (BRS-TITRE-INUTILE, LST-TITRE-COMPTEUR) : plus de titre « 2 en cuve / 1 à brasser » ; la recherche ouvre la liste.
    // q6 : les analyses se rangent dans la feuille de filtres.
    expect(screen.queryByRole('heading', { level: 2, name: /en cuve|à brasser/ })).not.toBeInTheDocument();
    const recherche = () => screen.queryByLabelText('Chercher un brassin');
    expect(recherche()).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Filtrer' }));
    fireEvent.click(screen.getByRole('button', { name: /Voir les analyses des brassins/ }));
    expect(recherche()).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retour aux brassins' }));
    expect(recherche()).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: /en cuve|à brasser/ })).not.toBeInTheDocument();
  });
});

describe('e2a : « Rebrasser cette <style> » du Terminé', () => {
  const ouvrirSaison = () => fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le brassin S' }));

  it('le pied rebrasse la recette d\'origine (par sa référence) et ferme la fiche', async () => {
    const onRebrewRecipe = vi.fn();
    monter({ onRebrewRecipe });
    ouvrirSaison();
    const dialogue = await screen.findByRole('dialog', {}, { timeout: 10000 }); // l2 : la fiche se charge à la demande
    fireEvent.click(within(dialogue).getByRole('button', { name: 'Rebrasser cette Saison' }));
    expect(onRebrewRecipe).toHaveBeenCalledWith('REC-SAISON');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sans recette retrouvée, jamais une autre recette : le pied reste « Fermer »', async () => {
    monter({ onRebrewRecipe: vi.fn() }, [{ ...recette, id: 'AUTRE', name: 'Autre' } as Recipe]);
    ouvrirSaison();
    const dialogue = await screen.findByRole('dialog', {}, { timeout: 10000 }); // l2 : la fiche se charge à la demande
    expect(within(dialogue).queryByRole('button', { name: /Rebrasser/ })).not.toBeInTheDocument();
    expect(within(dialogue).getAllByRole('button', { name: 'Fermer' }).length).toBeGreaterThan(0);
  });
});
