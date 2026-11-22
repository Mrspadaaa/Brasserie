// @vitest-environment jsdom
// Audit métier du 08.11 (work/missions/2026-11-08-audit-metier/RAPPORT.md), AM 1, 2, 3 et 9. Chaque test échoue sur 65d3c645 (L13).
// Son cas : Pilsner Malz 1,8 kg à « fermentation » J+4, Caramünch 32,5 kg à J+3, comptés dans l'OG (1,290) et l'EBC, sans alerte.
// « Donc le fait que on puisse mettre du malt après la fermentation, ça a pas posé de problème ???? »
import React, { useState } from 'react';
import { cleanup, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { Batch, Fermentable, FermentableKind, HopIngredient, Recipe, StockItem } from '../../../src/types';
import { EtapeFermentescibles } from '../../../src/ui/fermentescibles/EtapeFermentescibles';
import { Reperes } from '../../../src/ui/fermentescibles/Reperes';
import type { DefFamille } from '../../../src/ui/fermentescibles/Ajout';
import { yeastRecipeComputedOg } from '../../../src/domain/yeastProjection';
import { recipeSaveIssues } from '../../../src/domain/recipeValidation';
import { computeBeerColor } from '../../../src/domain/beerColor';
import { BrewingMath } from '../../../src/services/brewingMath';
import { prepareBrewStockConsumption } from '../../../src/domain/finance/brewStockConsumption';
import { hotBitterness } from '../../../src/domain/hopBitterness';

afterEach(cleanup);

// Valeurs de test, simulées : potentiel et couleur typiques de fiche (Weyermann), pas une donnée du brasseur.
const pale: Fermentable = { name: 'Pale Ale Malz', kind: 'grain', use: 'empatage', weightKg: 5, potentialPpg: 37, colorEbc: 6.5 };
const pilsFerm: Fermentable = { name: 'Pilsner Malz', kind: 'grain', use: 'fermentation', weightKg: 1.8, dayOffset: 4, potentialPpg: 37, colorEbc: 3.5 };
const caraFerm: Fermentable = { name: 'Caramünch Typ 2', kind: 'grain', use: 'fermentation', weightKg: 32.5, dayOffset: 3, potentialPpg: 34, colorEbc: 120 };
const caraBouilli: Fermentable = { ...caraFerm, use: 'ebullition', dayOffset: undefined };
const dextroseFerm: Fermentable = { name: 'Dextrose', kind: 'sucre', use: 'fermentation', weightKg: 0.4, dayOffset: 2, potentialPpg: 46, fermentabilityPct: 100 };

const recette = (fermentables: Fermentable[], hops: HopIngredient[] = []): Recipe =>
  ({ id: 'R', name: 'Pale', volumeL: 30, boilMin: 60, fermentables, hops } as unknown as Recipe);

describe('AM 1 — un grain en fermentation ne compte pas et se signale', () => {
  it('OG : Pilsner et Caramünch à « fermentation » ne changent pas l’OG du seul grain empâté', () => {
    const seul = yeastRecipeComputedOg({ fermentables: [pale], volumeL: 30, efficiencyPct: 75 });
    const cas = yeastRecipeComputedOg({ fermentables: [pale, pilsFerm, caraFerm], volumeL: 30, efficiencyPct: 75 });
    expect(seul).not.toBeNull();
    expect(cas).toBeCloseTo(seul!, 6);
    // Le sucre au fermenteur, lui, compte toujours.
    expect(yeastRecipeComputedOg({ fermentables: [pale, dextroseFerm], volumeL: 30, efficiencyPct: 75 })!).toBeGreaterThan(seul!);
  });

  it('EBC : le Caramünch en fermentation n’entre pas dans la couleur', () => {
    const seul = computeBeerColor([pale], 30)!;
    expect(computeBeerColor([pale, caraFerm], 30)!.ebc).toBe(seul.ebc);
  });

  it('validation : la ligne de grain en fermentation est signalée, celle du sucre non', () => {
    const issues = recipeSaveIssues(recette([pale, pilsFerm, dextroseFerm]));
    const ligne = issues.find((i) => i.field === 'wz-fermentable-1');
    expect(ligne?.message).toMatch(/Pilsner Malz.*s’empâte/);
    expect(issues.some((i) => i.field === 'wz-fermentable-2')).toBe(false);
  });

  it('stock : un grain prévu en fermentation n’est pas réservé au fermenteur ; le déstockage demande la correction', () => {
    const stocks: StockItem[] = [{ id: 'P', ref: 'P', name: 'Pilsner Malz', unit: 'kg', currentStock: 20, category: 'Malt', minStock: 0, reorder: false }];
    const batch = { id: 'B', status: 'fermentation', name: 'Pale', brewDate: '08.11.2026', volumeL: 30,
      recipeSnapshot: { sourceRecipeId: 'R', capturedAt: '', name: 'Pale', volumeL: 30, hops: [],
        fermentables: [{ ...pilsFerm, stockItemRef: 'P' }] } } as unknown as Batch;
    const r = prepareBrewStockConsumption(batch, stocks, { now: '2026-11-08T10:00:00Z' });
    expect(r.status).toBe('needs-review');
    expect(r.issues.join(' ')).toMatch(/Pilsner Malz.*empâte/);
  });
});

describe('AM 2 — un grain à l’ébullition ne compte pas', () => {
  it('OG et extrait : le Caramünch bouilli ne compte pas avec le rendement d’empâtage', () => {
    const seul = yeastRecipeComputedOg({ fermentables: [pale], volumeL: 30, efficiencyPct: 75 });
    expect(yeastRecipeComputedOg({ fermentables: [pale, caraBouilli], volumeL: 30, efficiencyPct: 75 })).toBeCloseTo(seul!, 6);
    const ext = BrewingMath.extractPoints([pale, caraBouilli], 30, 75, 'full')!;
    expect(ext.total).toBeCloseTo(BrewingMath.extractPoints([pale], 30, 75, 'full')!.total, 6);
  });
  it('validation : grain à l’ébullition signalé', () => {
    expect(recipeSaveIssues(recette([pale, caraBouilli])).find((i) => i.field === 'wz-fermentable-1')?.message).toMatch(/s’empâte/);
  });
});

// Les familles de l'assistant (KIND_DEF), recopiées comme dans etape.test.tsx.
const DEFS: Record<FermentableKind, DefFamille> = {
  grain: { label: 'Grain', use: 'empatage', fermentability: 100, stock: ['Malt', 'Céréale'], newCat: 'Malt' },
  sucre: { label: 'Sucre', use: 'ebullition', fermentability: 100, ppg: 46, stock: ['Sucre'], newCat: 'Sucre' },
  lactose: { label: 'Lactose', use: 'ebullition', fermentability: 0, ppg: 35, stock: ['Sucre'], newCat: 'Sucre' },
  fruit: { label: 'Fruit', use: 'fermentation', fermentability: 90, ppg: 8, stock: ['Fruit', 'Additif'], newCat: 'Sucre' },
  extrait: { label: 'Extrait', use: 'ebullition', fermentability: 75, ppg: 36, stock: ['Extrait', 'Sucre'], newCat: 'Sucre' },
};
let courant: Fermentable[] = [];
function Banc({ depart }: { depart: Fermentable[] }) {
  const [l, setL] = useState<Fermentable[]>(depart);
  const [famille, setFamille] = useState<FermentableKind>('grain');
  courant = l;
  return (
    <EtapeFermentescibles fermentables={l} onFermentables={setL} stockItems={[]} famille={famille} onFamille={setFamille} defs={DEFS}
      onCreateStockItem={(n, c, u) => ({ id: 'n', ref: 'N', name: n, category: c, unit: u, currentStock: 0, minStock: 0, reorder: false })}
      onLearnIngredient={() => {}} nolo={false} og={null} teinteBiere={null} rendementPct={75} rendementDeclare={false} erreur={() => undefined} />
  );
}
const ligne = (i: number) => document.querySelectorAll<HTMLElement>('[data-sel]')[i];
const moment = (i: number) => ligne(i).querySelector<HTMLElement>('[data-role="moment-ligne"]')!;

describe('AM 1 et 2 — la pastille de moment', () => {
  it('un grain reste à l’empâtage : jamais ébullition ni fermentation, jamais de J+', async () => {
    const u = userEvent.setup();
    render(<Banc depart={[pale, dextroseFerm]} />);
    await u.click(moment(0));
    await u.click(moment(0));
    expect(courant[0].use).toBe('empatage');
    expect(ligne(0).querySelector('[data-role="jour-ligne"]')).toBeNull();
    expect(ligne(0).textContent).not.toMatch(/fermentation|ébullition|J\+/);
  });
  it('un sucre tourne entre ébullition et fermentation, J+ en fermentation', async () => {
    const u = userEvent.setup();
    render(<Banc depart={[pale, { ...dextroseFerm, use: 'ebullition', dayOffset: undefined }]} />);
    await u.click(moment(1));
    expect(courant[1].use).toBe('fermentation');
    expect(ligne(1).querySelector('[data-role="jour-ligne"]')).not.toBeNull();
    await u.click(moment(1));
    expect(courant[1].use).toBe('ebullition');
  });
  it('donnée ancienne : le Pilsner en fermentation est signalé sur sa ligne, sans J+, et un toucher le remet à l’empâtage', async () => {
    const u = userEvent.setup();
    render(<Banc depart={[pale, pilsFerm]} />);
    expect(ligne(1).querySelector('[data-role="jour-ligne"]')).toBeNull();
    expect(document.querySelector('[data-role="alertes"]')!.textContent).toMatch(/Pilsner Malz.*s’empâte/);
    await u.click(moment(1));
    expect(courant[1].use).toBe('empatage');
    expect(document.querySelector('[data-role="alertes"]')!.textContent).not.toMatch(/Pilsner Malz/);
  });
});

describe('AM 3 — une OG absurde est une erreur de saisie, jamais « plus de grain »', () => {
  it('à 1,290 : la note parle de saisie (masse, volume), jamais de grain à ajouter', () => {
    const note = BrewingMath.efficiencyAtGravity(75, 1.29).note ?? '';
    expect(note).not.toMatch(/plus de grain/);
    expect(note).toMatch(/1,130/);
    expect(note).toMatch(/masse|volume/);
    // Une vraie bière forte garde le conseil de saturation.
    expect(BrewingMath.efficiencyAtGravity(75, 1.1).note).toMatch(/sature/);
  });
  it('les repères ne collent pas l’OG au bord en silence : « hors échelle » est dit', () => {
    render(<Reperes rendementPct={75} rendementDeclare og={1.29} ogPlage={{ min: 1.06, max: 1.085 }} teinteBiere={null} aRenseigner={0} ouvert onBascule={() => {}} onRenseigner={() => {}} />);
    const reps = document.querySelector('[data-role="reps"]')!;
    expect(reps.querySelector('[data-hors="og"]')).not.toBeNull();
    expect(reps.textContent).toMatch(/1,290/);
  });
});

describe('AM 9 — un alpha au-delà de 30 % est à confirmer', () => {
  const citra = (alpha: number, extra: object = {}): HopIngredient => ({ name: 'Citra', alpha, weightG: 30, stage: 'boil', timeMin: 60, ...extra } as HopIngredient);
  it('80 % (pour 8,0) : pas d’IBU recalculé en silence', () => {
    const r = hotBitterness([citra(80)], 30, 1.05, 60);
    expect(r.total).toBeNull();
    expect(r.missing.join(' ')).toMatch(/Citra.*à confirmer/);
    expect(hotBitterness([citra(8)], 30, 1.05, 60).total).toBeGreaterThan(0);
  });
  it('la validation demande de confirmer, et la confirmation de la même valeur lève le blocage', () => {
    const issue = recipeSaveIssues(recette([pale], [citra(80)])).find((i) => i.field === 'wz-hop-alpha-0');
    expect(issue?.message).toMatch(/80.*(8,0)/);
    expect(recipeSaveIssues(recette([pale], [citra(80, { alphaConfirme: 80 })])).some((i) => i.field === 'wz-hop-alpha-0')).toBe(false);
    expect(hotBitterness([citra(80, { alphaConfirme: 80 })], 30, 1.05, 60).total).toBeGreaterThan(0);
  });
});
