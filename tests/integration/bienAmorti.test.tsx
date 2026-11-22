// @vitest-environment jsdom
/**
 * m3im-c (choix du 15.11) : « Bien amorti », la cuve année par année. Chaque barre et chaque chiffre est celui de `depreciationForYear` (annual.ts, intouché),
 * recalculé ici par le domaine lui-même. L'enregistrement part en centimes et en dates ISO ; le calcul incomplet reste « — » (jamais 0).
 * Services simulés : aucune donnée réelle.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
const etat = vi.hoisted(() => ({ saveAsset: vi.fn() }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getTransactions: () => [], getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), subscribe: () => () => {} } }));
vi.mock('../../src/services/financeService', () => ({ FinanceService: { saveAsset: (...a: unknown[]) => etat.saveAsset(...a) } }));
import { AssetSheet } from '../../src/ui/finance/FinanceForms';
import { barresDuBien } from '../../src/ui/finance/bien/BienCuve';
import { depreciationForYear } from '../../src/domain/finance/annual';
import type { FinancialAsset } from '../../src/domain/finance/types';
import { poserDate } from '../helpers/poserDate';

const AUJ = '2026-11-15';
const cuve: FinancialAsset = { id: 'IMMO-CUVE', name: 'Cuve de fermentation', acquisitionDate: '2025-02-01', inServiceDate: '2025-02-01', acquisitionCents: 180_000, businessUsePct: 100, category: 'tanks', method: 'declining', ratePct: 20,
  openingYear: 2026, openingValueCents: 144_000, openingConfirmed: true, firstYearFraction: 1 };
const nbsp = (s: string) => s.replace(/[\s  ]/g, ' ');
beforeEach(() => { cleanup(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${AUJ}T10:00:00Z`)); etat.saveAsset.mockReset(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
const ouvrir = (asset?: FinancialAsset, initial?: Partial<FinancialAsset>) => render(<AssetSheet asset={asset} initial={initial} onClose={() => {}} />);
const feuille = (nom: string) => within(screen.getByRole('dialog', { name: nom }));
const resume = () => nbsp(document.querySelector('.bic-res')!.textContent!);

describe('m3im-c : la cuve année par année', () => {
  it('le titre est le nom du bien ; l’usure de l’exercice et les barres sont celles du domaine', () => {
    ouvrir(cuve);
    const d = feuille('Cuve de fermentation');
    expect(d.getByText('son usure · terme : amortissement')).toBeTruthy();
    const ligne = depreciationForYear(cuve, 2026);
    expect(ligne.depreciationCents).toBe(28_800); expect(ligne.closingCents).toBe(115_200);
    expect(resume()).toContain('Usure à garder en 2026'); expect(resume()).toContain('288,00');
    const barres = barresDuBien(cuve, 2026);
    expect(barres.map(b => b.libelle)).toEqual(['achat', '2025', '2026', '2027', '2028', '2029', '2030']);
    expect(barres.map(b => b.cents)).toEqual([180_000, 144_000, 115_200, 92_160, 73_728, 58_982, 47_186]);
    for (const b of barres.filter(x => Number(x.libelle) >= 2026)) expect(b.cents).toBe(depreciationForYear(cuve, Number(b.libelle)).closingCents);
    const lu = nbsp(document.querySelector('svg.bic-g')!.getAttribute('aria-label')!);
    expect(lu).toContain('achat 1 800'); expect(lu).toContain('2026 1 152'); expect(lu).toContain('2030 472');
  });
  it('un seul chiffre pour l’autre méthode : « si 10 % du prix : −180,00 en 2026 » = le domaine en linéaire', () => {
    ouvrir(cuve);
    expect(depreciationForYear({ ...cuve, method: 'linear', ratePct: 10 }, 2026).depreciationCents).toBe(18_000);
    expect(nbsp(document.querySelector('.bic-alt')!.textContent!)).toBe('si 10 % du prix : −180,00 en 2026');
  });
  it('toucher « 10 % du prix » : la méthode, le taux et l’usure changent ; enregistré en linéaire à 10', async () => {
    ouvrir(cuve);
    const d = feuille('Cuve de fermentation');
    expect(d.getByRole('button', { name: /20 % du reste/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(d.getByRole('button', { name: /10 % du prix/ }));
    expect(d.getByRole('button', { name: /10 % du prix/ })).toHaveAttribute('aria-pressed', 'true');
    expect(resume()).toContain('180,00');
    expect(nbsp(document.querySelector('.bic-alt')!.textContent!)).toBe('si 20 % du reste : −288,00 en 2026');
    fireEvent.click(d.getByRole('button', { name: 'Enregistrer' }));
    await vi.waitFor(() => expect(etat.saveAsset).toHaveBeenCalledWith(expect.objectContaining({ id: 'IMMO-CUVE', method: 'linear', ratePct: 10, acquisitionCents: 180_000, openingValueCents: 144_000 })));
  });
  it('la part pro baisse sous la valeur de reprise : le domaine refuse, l’usure reste « — » (jamais 0)', () => {
    ouvrir(cuve);
    const d = feuille('Cuve de fermentation');
    fireEvent.change(d.getByLabelText('Part professionnelle (%)'), { target: { value: '50' } });
    expect(resume()).toContain('—');
    expect(d.getByRole('note')).toHaveTextContent('La valeur de reprise dépasse le coût professionnel.');
    expect(d.getByText('50 %')).toBeTruthy();
  });
  it('un bien neuf : l’achat est ajouté dans son année, pas de barre de reprise', () => {
    const neuf: FinancialAsset = { ...cuve, acquisitionDate: '2026-03-01', inServiceDate: '2026-03-01', openingYear: 2026, openingValueCents: 0 };
    const barres = barresDuBien(neuf, 2026);
    expect(barres.map(b => b.libelle)).toEqual(['achat', '2026', '2027', '2028', '2029', '2030']);
    expect(barres[1].cents).toBe(depreciationForYear(neuf, 2026).closingCents);
    expect(barres[1].genre).toBe('exercice');
  });
});

describe('m3im-c : confirmation, saisie, cession', () => {
  it('non confirmé : un aperçu dit « à confirmer » ; la ligne verte se coche et se dit', () => {
    ouvrir({ ...cuve, openingConfirmed: false });
    const d = feuille('Cuve de fermentation');
    expect(d.getByText(/Aperçu : l’Annuel ne compte cette usure qu’une fois la catégorie et le départ confirmés/)).toBeTruthy();
    expect(d.getByText('Confirmer la catégorie et le départ')).toBeTruthy();
    fireEvent.click(d.getByRole('checkbox', { name: /Je confirme la catégorie/ }));
    expect(d.getByText('Catégorie et départ confirmés')).toBeTruthy();
    expect(d.queryByText(/Aperçu :/)).toBeNull();
  });
  it('un matériel neuf : « 2 500,50 » devient 250 050 centimes, dates ISO, confirmation enregistrée', async () => {
    ouvrir(undefined, { name: 'Refroidisseur', category: 'production', method: 'declining', ratePct: 30 });
    const d = feuille('Refroidisseur');
    const prix = d.getByLabelText('Valeur d’acquisition TTC (CHF)');
    fireEvent.focus(prix); fireEvent.change(prix, { target: { value: '2500,50' } }); fireEvent.blur(prix);
    poserDate('Date d’achat', '2026-05-04');
    poserDate('Mise en service', '2026-05-20');
    fireEvent.click(d.getByRole('checkbox', { name: /Je confirme la catégorie/ }));
    fireEvent.click(d.getByRole('button', { name: 'Enregistrer' }));
    await vi.waitFor(() => expect(etat.saveAsset).toHaveBeenCalledWith(expect.objectContaining({ name: 'Refroidisseur', acquisitionCents: 250_050, acquisitionDate: '2026-05-04', inServiceDate: '2026-05-20', openingConfirmed: true, category: 'production', ratePct: 30 })));
  });
  it('sans nom ni valeur : le refus du domaine s’écrit, rien n’est enregistré', async () => {
    ouvrir();
    expect(screen.getByRole('dialog', { name: 'Ajouter un amortissement' })).toBeTruthy();
    fireEvent.submit(document.getElementById('finance-form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent('Renseigne le matériel et sa valeur d’acquisition.');
    expect(etat.saveAsset).not.toHaveBeenCalled();
  });
  it('la catégorie se change dans le pli : le taux de la méthode suit (mobilier 25 %, linéaire 12,5 %)', () => {
    ouvrir(cuve);
    const d = feuille('Cuve de fermentation');
    fireEvent.change(d.getByLabelText('Catégorie AFC à confirmer'), { target: { value: 'furniture' } });
    expect(d.getByRole('button', { name: /25 % du reste/ })).toBeTruthy();
    expect(d.getByRole('button', { name: /12,5 % du prix/ })).toBeTruthy();
    expect(nbsp(document.querySelector('.bic-row em')!.textContent!)).toBe('Mobilier 25 %');
  });
  it('la cession : « non » au repos, la date au repos replié, produit en centimes', async () => {
    ouvrir(cuve);
    const d = feuille('Cuve de fermentation');
    const plis = [...document.querySelectorAll('.bic-row')] as HTMLDetailsElement[];
    expect(plis[1].querySelector('summary em')!.textContent).toBe('non');
    poserDate('Date de cession', '2026-09-10');
    const produit = d.getByLabelText('Produit de la cession (CHF)');
    fireEvent.focus(produit); fireEvent.change(produit, { target: { value: '400,05' } }); fireEvent.blur(produit);
    expect(plis[1].querySelector('summary em')!.textContent).toBe('10.09.26');
    fireEvent.click(d.getByRole('button', { name: 'Enregistrer' }));
    await vi.waitFor(() => expect(etat.saveAsset).toHaveBeenCalledWith(expect.objectContaining({ disposedDate: '2026-09-10', disposalProceedsCents: 40_005 })));
  });
  it('la 1re année : « entière » par défaut ; « moitié » enregistre 0,5', async () => {
    ouvrir(cuve);
    const d = feuille('Cuve de fermentation');
    const lue = () => [...document.querySelectorAll('.bic-date > b')].map(b => b.textContent);
    expect(lue()).toContain('entière');
    fireEvent.change(d.getByLabelText('Fraction de la première année (1 = année entière)'), { target: { value: '0.5' } });
    expect(lue()).toContain('moitié');
    fireEvent.click(d.getByRole('button', { name: 'Enregistrer' }));
    await vi.waitFor(() => expect(etat.saveAsset).toHaveBeenCalledWith(expect.objectContaining({ firstYearFraction: 0.5 })));
  });
});
