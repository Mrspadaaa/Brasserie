// @vitest-environment jsdom
/**
 * m3pr-c (choix du 15.11) : « Ajouter une prévision ». L'effet sur la fin de l'horizon n'est pas une copie : c'est la chaîne de Prévisions
 * (buildForecast, regrouperTendance, construireEscalier) appelée avec et sans la prévision ; ici le domaine recalcule les mêmes nombres.
 * Enregistrement en centimes et en date ISO ; inconnu = « — » (jamais 0). Services simulés : aucune donnée réelle.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
const etat = vi.hoisted(() => ({ savePlan: vi.fn(), profile: null as unknown, plans: [] as unknown[] }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getTransactions: () => [], getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getBatches: () => [], subscribe: () => () => {} } }));
vi.mock('../../src/services/financeService', () => ({ FinanceService: { getPayments: () => [], getPlans: () => etat.plans, getProfile: () => etat.profile, getAssets: () => [], savePlan: (...a: unknown[]) => etat.savePlan(...a) } }));
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: (read: () => unknown) => read() }));
import { PlanSheet } from '../../src/ui/finance/FinanceForms';
import { effetDeLaPrevision } from '../../src/ui/finance/prevision/PlanSheetC';
import { montant } from '../../src/ui/finance/previsions/format';
import type { FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';

const AUJ = '2026-11-15';
const profilConnu: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified', openingCash: { date: '2026-01-01', amountCents: 400_000, confirmed: true } };
const donnees = (profile: FinancialProfile) => ({ transactions: [], payments: [], plans: [], profile, assets: [], batches: [], stocks: { rawMaterials: [], cleaning: [], equipment: [] } } as never);
const nbsp = (s: string) => s.replace(/[\s  ]/g, ' ');
beforeEach(() => { cleanup(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${AUJ}T10:00:00Z`)); etat.savePlan.mockReset(); etat.profile = profilConnu; etat.plans = []; });
afterEach(() => { cleanup(); vi.useRealTimers(); });
const ouvrir = (plan?: FinancialPlan) => render(<PlanSheet plan={plan} onClose={() => {}} />);
const feuille = (nom = 'Prévoir une dépense') => within(screen.getByRole('dialog', { name: nom }));
const saisir = (d: ReturnType<typeof feuille>, libelle: string, chf: string) => {
  fireEvent.change(d.getByPlaceholderText(/Loyer, commande de malt/), { target: { value: libelle } });
  const m = d.getByLabelText('Montant (CHF)'); fireEvent.focus(m); fireEvent.change(m, { target: { value: chf } }); fireEvent.blur(m);
};

describe('m3pr-c : enregistrer', () => {
  it('« Loyer » 500,50 chaque mois : centimes, date ISO, répétition, mouvement à payer', async () => {
    ouvrir();
    const d = feuille();
    saisir(d, 'Loyer', '500,50');
    fireEvent.click(d.getByRole('button', { name: 'Chaque mois' }));
    fireEvent.click(d.getByRole('button', { name: 'Enregistrer' }));
    await vi.waitFor(() => expect(etat.savePlan).toHaveBeenCalledWith(expect.objectContaining({ title: 'Loyer', amountCents: 50_050, date: AUJ, direction: 'out', category: 'chargesFixes', source: 'recurring', status: 'active', recurrence: { frequency: 'monthly', endDate: undefined } })));
  });
  it('« À recevoir » et une date choisie : sens et date enregistrés', async () => {
    ouvrir();
    const d = feuille();
    saisir(d, 'Vente de drêche', '120');
    fireEvent.change(d.getByLabelText('Mouvement'), { target: { value: 'in' } });
    fireEvent.change(d.getByLabelText('Date de paiement prévue'), { target: { value: '2026-12-02' } });
    fireEvent.click(d.getByRole('button', { name: 'Enregistrer' }));
    await vi.waitFor(() => expect(etat.savePlan).toHaveBeenCalledWith(expect.objectContaining({ direction: 'in', date: '2026-12-02', amountCents: 12_000, source: 'manual' })));
    expect(etat.savePlan.mock.calls[0][0]).not.toHaveProperty('recurrence');
  });
  it('sans libellé ni montant : le refus est écrit, rien n’est enregistré', async () => {
    ouvrir();
    fireEvent.submit(document.getElementById('finance-form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent('Un libellé et un montant positif sont nécessaires.');
    expect(etat.savePlan).not.toHaveBeenCalled();
  });
  it('modifier : le titre change, l’état et le fournisseur sont dans la rangée repliée', () => {
    const plan = { id: 'P1', title: 'Assurance', date: '2026-12-01', amountCents: 30_000, direction: 'out', category: 'chargesFixes', source: 'manual', status: 'active', createdAt: '2026-01-01T00:00:00Z' } as FinancialPlan;
    ouvrir(plan);
    const d = feuille('Modifier la prévision');
    expect(d.getByText(/Fournisseur, note, état/)).toBeTruthy();
    expect((d.getByLabelText('État') as HTMLSelectElement).value).toBe('active');
  });
});

describe('m3pr-c : l’effet affiché est celui du domaine', () => {
  const brouillon = (over: Partial<FinancialPlan> = {}): FinancialPlan => ({ id: 'X', title: 'Loyer', date: AUJ, amountCents: 50_050, direction: 'out', category: 'chargesFixes', source: 'recurring', status: 'active', createdAt: '', recurrence: { frequency: 'monthly' }, ...over } as FinancialPlan);
  it('la fin de l’horizon, avant (barré) et après, = effetDeLaPrevision ; le nombre d’échéances aussi', () => {
    ouvrir();
    const d = feuille();
    saisir(d, 'Loyer', '500,50');
    fireEvent.click(d.getByRole('button', { name: 'Chaque mois' }));
    const effet = effetDeLaPrevision(brouillon({ id: document.querySelector('.pvc') ? 'X' : 'X' }), AUJ, donnees(profilConnu));
    const zone = document.querySelector('.pvc-eff')!;
    expect(nbsp(zone.querySelector('s')!.textContent!)).toBe(nbsp(montant(effet.avant.soldeFinCents!)));
    expect(nbsp(zone.querySelector('b')!.textContent!)).toBe(nbsp(montant(effet.apres.soldeFinCents!)));
    expect(effet.apres.soldeFinCents).toBe(effet.avant.soldeFinCents! - 50_050 * effet.occurrences.length);
    expect(effet.occurrences.length).toBe(3);
    expect(nbsp(zone.textContent!)).toContain(`3 × ${nbsp(montant(50_050))} dans les 90 jours`);
  });
  it('une fois : une seule échéance, l’effet est le montant', () => {
    ouvrir();
    const d = feuille();
    saisir(d, 'Malt', '200');
    const effet = effetDeLaPrevision(brouillon({ title: 'Malt', amountCents: 20_000, recurrence: undefined, source: 'manual' }), AUJ, donnees(profilConnu));
    expect(effet.apres.soldeFinCents).toBe(effet.avant.soldeFinCents! - 20_000);
    expect(nbsp(document.querySelector('.pvc-eff b')!.textContent!)).toBe(nbsp(montant(effet.apres.soldeFinCents!)));
  });
  it('sans montant : l’effet reste « — », jamais 0', () => {
    ouvrir();
    expect(document.querySelector('.pvc-eff b')!.textContent).toBe('—');
    expect(feuille().getByText('montant à saisir pour voir l’effet')).toBeTruthy();
  });
  it('sans solde de départ confirmé : c’est l’écart qui est dit, pas un solde', () => {
    etat.profile = { ...profilConnu, openingCash: undefined };
    ouvrir();
    const d = feuille();
    saisir(d, 'Loyer', '500,50');
    expect(d.getByText(/Solde de départ non confirmé : c’est l’écart depuis aujourd’hui, pas un solde/)).toBeTruthy();
    const effet = effetDeLaPrevision(brouillon({ recurrence: undefined, source: 'manual' }), AUJ, donnees({ ...profilConnu, openingCash: undefined }));
    expect(effet.avant.departCents).toBeNull();
    expect(nbsp(document.querySelector('.pvc-eff b')!.textContent!)).toBe(nbsp(montant(effet.apres.ecartFinCents)));
  });
  it('« Compte dans mon litre ? » : seulement pour une sortie qui se répète ; le choix est enregistré', async () => {
    ouvrir();
    const d = feuille();
    saisir(d, 'Loyer', '500,50');
    expect(d.queryByText('Compte dans mon litre ?')).toBeNull();
    fireEvent.click(d.getByRole('button', { name: 'Chaque mois' }));
    expect(d.getByText('Compte dans mon litre ?')).toBeTruthy();
    fireEvent.change(d.getByLabelText('Coût de revient des brassins'), { target: { value: 'fixed' } });
    fireEvent.click(d.getByRole('button', { name: 'Enregistrer' }));
    await vi.waitFor(() => expect(etat.savePlan).toHaveBeenCalledWith(expect.objectContaining({ costAllocation: 'fixed' })));
  });
});

describe('Calendrier › « Prévoir une dépense en S50 » : une écriture prévue, datée de la semaine touchée', () => {
  it('la feuille s’ouvre sur le lundi 7 déc. 2026 (S50), à payer ; enregistrée, la prévision est active et datée du lundi, jamais d’aujourd’hui', async () => {
    render(<PlanSheet onClose={() => {}} date="2026-12-07" />);
    const d = feuille();
    expect(d.getByLabelText('Date de paiement prévue')).toHaveValue('2026-12-07');
    expect(d.getByLabelText('Mouvement')).toHaveValue('out');
    saisir(d, 'Commande de malt', '300');
    fireEvent.click(d.getByRole('button', { name: 'Enregistrer' }));
    await vi.waitFor(() => expect(etat.savePlan).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-12-07', status: 'active', direction: 'out', amountCents: 30_000 })));
    expect(etat.savePlan.mock.calls[0][0].date).not.toBe(AUJ);
  });
  it('une date illisible retombe sur aujourd’hui, sans rien inventer', () => {
    render(<PlanSheet onClose={() => {}} date="n’importe quoi" />);
    expect(feuille().getByLabelText('Date de paiement prévue')).toHaveValue(AUJ);
  });
});
