// @vitest-environment jsdom
/**
 * Projet matériel m3pm-d : la piste (Idée, À étudier, Devis, Prêt à acheter, Acheté, En service).
 * Ce qui se prouve ici : l'enregistrement juste (montants en centimes, mois, avancement), la station en cours, l'ouverture d'une station, les achats liés, l'archivage.
 * Aucune donnée réelle : le service d'enregistrement est simulé (comme upgradeSheetTe35.test.tsx). Le CSS n'est pas chargé : une station fermée garde ses champs
 * dans le DOM (`data-ferme`, masquée par projet.css) ; la visibilité se prouve sur capture.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
const state = vi.hoisted(() => ({ saveUpgrade: vi.fn(), transactions: [] as any[] }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getTransactions: () => state.transactions, getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getConfig: () => ({ fiscal: { isTvaRegistered: false } }) } }));
vi.mock('../../src/services/financeService', () => ({ FinanceService: { getPayments: () => [], getPlans: () => [], saveUpgrade: (...a: any[]) => state.saveUpgrade(...a) } }));
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: (read: () => unknown) => read() }));
import { UpgradeSheet } from '../../src/ui/finance/UpgradeSheet';
import { etatPiste, resumeUsure, quand } from '../../src/ui/finance/projet/piste';
import type { FinancialPlan } from '../../src/domain/finance/types';

/** Le frigo de la maquette : 2 800,00 + livraison 200,00, payé en novembre 2026, à l'étape « Prêt à acheter ». */
const frigo = (patch: Partial<FinancialPlan> = {}, upgrade: Partial<NonNullable<FinancialPlan['upgrade']>> = {}): FinancialPlan => ({
  id: 'FRIGO', title: 'Frigo', date: '2026-11-01', amountCents: 300000, direction: 'out', category: 'materiel', source: 'equipment', status: 'active', createdAt: '2026-11-15T10:00:00Z', notes: 'Cave de garde',
  upgrade: { version: 1, timing: 'soon', stage: 'ready', budgetKnown: true, datePrecision: 'month', estimateSource: 'estimate', purchaseCents: 280000, deliveryCents: 20000, purpose: 'Garder fûts et bouteilles au froid jusqu’à la vente.', ...upgrade }, ...patch });
const achatLie = () => ({ id: 'FACT-FRIGO', date: '2026-11-15', description: 'Frigo de cave', category: 'materiel', subcategory: '', amountHT: 3000, amountTTC: 3000, tvaRate: 0, tvaAmount: 0,
  finance: { version: 1, kind: 'expense', amountCents: 300000, planId: 'FRIGO', paymentStatus: 'unpaid', dueDate: '2026-12-01', lines: [{ id: '1', kind: 'equipment', description: 'Frigo', amountCents: 300000 }] } });
const station = (id: string) => document.querySelector(`li[data-station="${id}"]`) as HTMLElement;
const ouverte = (id: string) => !document.getElementById(`pjd-c-${id}`)!.hasAttribute('data-ferme');
const saisie = (label: string, value: string) => { const champ = screen.getByLabelText(label); fireEvent.change(champ, { target: { value } }); fireEvent.blur(champ); };
const enregistre = () => state.saveUpgrade.mock.calls.at(-1)![0] as FinancialPlan;

beforeEach(() => { cleanup(); state.saveUpgrade.mockReset(); state.saveUpgrade.mockResolvedValue(undefined); state.transactions = []; });
afterEach(cleanup);

describe('Projet matériel m3pm-d : l’enregistrement', () => {
  it('un projet neuf chiffré à la piste s’enregistre en centimes, avec son mois, son échéance et son avancement', async () => {
    const onSaved = vi.fn(), onClose = vi.fn();
    render(<UpgradeSheet onClose={onClose} onSaved={onSaved} />);
    fireEvent.change(screen.getByLabelText('Matériel ou aménagement'), { target: { value: '  Frigo ' } });
    fireEvent.change(screen.getByLabelText('À quoi va-t-il servir ?'), { target: { value: 'Garder fûts et bouteilles au froid' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bientôt', exact: true }));
    saisie('Prix estimé TTC (CHF)', '2800'); saisie('Livraison TTC (CHF)', '200');
    fireEvent.input(screen.getByLabelText('Paiement prévu en'), { target: { value: '2026-11' } });
    fireEvent.click(screen.getByRole('button', { name: 'Placer le projet à l’étape Prêt à acheter' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Inclure dans mes prévisions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le projet' }));
    await waitFor(() => expect(state.saveUpgrade).toHaveBeenCalledTimes(1));
    const plan = enregistre();
    expect(plan).toMatchObject({ title: 'Frigo', date: '2026-11-01', amountCents: 300000, status: 'active', direction: 'out', category: 'materiel', source: 'equipment',
      upgrade: { stage: 'ready', timing: 'soon', budgetKnown: true, datePrecision: 'month', purchaseCents: 280000, deliveryCents: 20000, purpose: 'Garder fûts et bouteilles au froid' } });
    expect(plan.upgrade!.installationCents).toBeUndefined(); // la pose non chiffrée reste inconnue : jamais 0
    await waitFor(() => { expect(onSaved).toHaveBeenCalled(); expect(onClose).toHaveBeenCalled(); });
  });

  it('une idée sans prix ni date : budget « — » à l’en-tête, enregistrée à 0 centime avec budgetKnown faux (l’inconnu n’est pas un prix)', async () => {
    render(<UpgradeSheet onClose={() => {}} />);
    expect(document.querySelector('.pjd-b')).toHaveTextContent('—');
    fireEvent.change(screen.getByLabelText('Matériel ou aménagement'), { target: { value: 'Nouvelle cuverie' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le projet' }));
    await waitFor(() => expect(state.saveUpgrade).toHaveBeenCalled());
    expect(enregistre()).toMatchObject({ title: 'Nouvelle cuverie', status: 'draft', date: '', amountCents: 0, upgrade: { budgetKnown: false, stage: 'idea', timing: 'later' } });
  });

  it('un projet existant : toucher le rond « Devis » le place à cette étape, le budget et la date restent', async () => {
    render(<UpgradeSheet plan={frigo({}, { stage: 'idea' })} onClose={() => {}} />);
    expect(station('idea')).toHaveAttribute('aria-current', 'step');
    fireEvent.click(screen.getByRole('button', { name: 'Placer le projet à l’étape Devis' }));
    expect(station('quote')).toHaveAttribute('aria-current', 'step');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le projet' }));
    await waitFor(() => expect(state.saveUpgrade).toHaveBeenCalled());
    expect(enregistre()).toMatchObject({ id: 'FRIGO', amountCents: 300000, date: '2026-11-01', status: 'active', notes: 'Cave de garde', upgrade: { stage: 'quote', purchaseCents: 280000 } });
  });

  it('un devis noté (fournisseur, référence) et l’usure (durée, catégorie, mise en service) vont au projet', async () => {
    render(<UpgradeSheet plan={frigo()} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Noter un devis/ }));
    expect(ouverte('quote')).toBe(true);
    fireEvent.change(screen.getByLabelText('Fournisseur'), { target: { value: 'Frigoshop' } });
    fireEvent.change(screen.getByLabelText('Référence ou détails du devis'), { target: { value: 'D-2026-14, valable 30 jours' } });
    fireEvent.change(screen.getByLabelText('Durée d’usage (années)'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Mise en service prévue'), { target: { value: '2026-12' } });
    fireEvent.change(screen.getByLabelText('Catégorie d’usure'), { target: { value: 'furniture' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le projet' }));
    await waitFor(() => expect(state.saveUpgrade).toHaveBeenCalled());
    expect(enregistre()).toMatchObject({ vendor: 'Frigoshop', upgrade: { quoteReference: 'D-2026-14, valable 30 jours', usefulLifeYears: 5, inServiceMonth: '2026-12', depreciationCategory: 'furniture' } });
  });
});

describe('Projet matériel m3pm-d : la piste', () => {
  it('le frigo à « Prêt à acheter » : trois stations cochées, celle-ci en cours et ouverte, les suivantes grises ; budget en mono à l’en-tête', () => {
    render(<UpgradeSheet plan={frigo()} onClose={() => {}} />);
    expect(document.querySelector('.pjd-b')).toHaveTextContent(/^3\s000,00$/);
    expect(['idea', 'research', 'quote'].map(id => station(id).classList.contains('pjd-fait'))).toEqual([true, true, true]);
    expect(station('ready')).toHaveAttribute('aria-current', 'step');
    expect(['bought', 'service'].map(id => station(id).classList.contains('pjd-pas'))).toEqual([true, true]);
    expect(['idea', 'research', 'quote', 'ready', 'bought', 'service'].map(ouverte)).toEqual([false, false, false, true, false, false]);
    expect(station('research')).toHaveTextContent(/2\s800,00 \+ livraison 200,00 · pose \?/); // la pose non chiffrée est dite « ? »
    expect(station('bought')).toHaveTextContent('achats liés : aucun');
    expect(station('service')).toHaveTextContent('mise en service ?');
    expect(screen.getByRole('checkbox', { name: 'Inclure dans mes prévisions' })).toBeChecked();
    expect(station('ready')).toHaveTextContent('compté dans les sorties de nov. 2026');
  });

  it('toucher une station l’ouvre et ferme l’autre ; la piste n’en tient qu’une ouverte', () => {
    render(<UpgradeSheet plan={frigo()} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /^À étudier/ }));
    expect(ouverte('research')).toBe(true); expect(ouverte('ready')).toBe(false);
    expect(screen.getByRole('button', { name: /^À étudier/ })).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: /^À étudier/ }));
    expect(ouverte('research')).toBe(false);
  });

  it('un achat lié fait passer Acheté ; « Marquer comme réalisé » enregistre le projet réalisé', async () => {
    state.transactions = [achatLie()];
    render(<UpgradeSheet plan={frigo()} onClose={() => {}} />);
    expect(station('bought').classList.contains('pjd-fait')).toBe(true);
    expect(station('bought')).toHaveTextContent(/1 achat lié : 3\s000,00/);
    expect(station('service')).toHaveAttribute('aria-current', 'step');
    fireEvent.click(screen.getByRole('button', { name: /^Acheté/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Marquer comme réalisé' }));
    await waitFor(() => expect(state.saveUpgrade).toHaveBeenCalled());
    expect(enregistre()).toMatchObject({ id: 'FRIGO', status: 'completed', amountCents: 300000 });
  });

  it('la facture liée s’ouvre depuis la station Acheté', () => {
    state.transactions = [achatLie()];
    const ouvre = vi.fn();
    render(<UpgradeSheet plan={frigo()} onClose={() => {}} onOpenTransaction={ouvre} />);
    fireEvent.click(screen.getByRole('button', { name: /Frigo de cave/ }));
    expect(ouvre).toHaveBeenCalledWith(expect.objectContaining({ id: 'FACT-FRIGO' }));
  });

  it('Archiver enregistre « cancelled » ; sur un projet archivé, « Reprendre ce projet » le remet en idée', async () => {
    const { unmount } = render(<UpgradeSheet plan={frigo()} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Archiver ce projet' }));
    expect(state.saveUpgrade).not.toHaveBeenCalled(); // u2 (27) et fix-materiel : « Archiver » demande d'abord
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Oui, archiver' }));
    await waitFor(() => expect(state.saveUpgrade).toHaveBeenCalled());
    expect(enregistre()).toMatchObject({ id: 'FRIGO', status: 'cancelled', amountCents: 300000 });
    unmount(); state.saveUpgrade.mockClear();
    render(<UpgradeSheet plan={frigo({ status: 'cancelled' })} onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Archiver ce projet' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre ce projet' }));
    await waitFor(() => expect(state.saveUpgrade).toHaveBeenCalled());
    expect(enregistre()).toMatchObject({ status: 'draft' });
  });

  it('inclure sans mois : le refus s’affiche et la station « Prêt à acheter » s’ouvre sur son champ', async () => {
    state.saveUpgrade.mockRejectedValueOnce(new Error('Choisis le mois ou la date de paiement prévue.'));
    render(<UpgradeSheet plan={frigo({ date: '', status: 'draft' }, { stage: 'research' })} onClose={() => {}} />);
    expect(ouverte('research')).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Inclure dans mes prévisions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le projet' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Choisis le mois');
    await waitFor(() => expect(ouverte('ready')).toBe(true));
  });

  it('un nouveau projet : Annuler ferme sans rien écrire', () => {
    const onClose = vi.fn();
    render(<UpgradeSheet onClose={onClose} />);
    expect(screen.queryByRole('button', { name: /Noter l’achat/ })).toBeNull(); // pas d'achat à lier à un projet pas encore enregistré
    fireEvent.click(screen.getByRole('button', { name: 'Annuler', exact: true }));
    expect(onClose).toHaveBeenCalled(); expect(state.saveUpgrade).not.toHaveBeenCalled();
  });
});

describe('Projet matériel m3pm-d : les règles de la piste (fonctions pures)', () => {
  it('etatPiste : étape saisie, achat lié, réalisé, mise en service échue', () => {
    expect(etatPiste(frigo({}, { stage: 'quote' }), 0, '2026-11')).toEqual({ faites: new Set(['idea', 'research']), actuelle: 'quote' });
    expect(etatPiste(frigo(), 1, '2026-11')).toEqual({ faites: new Set(['idea', 'research', 'quote', 'ready', 'bought']), actuelle: 'service' });
    expect(etatPiste(frigo({ status: 'completed' }, { stage: 'idea' }), 0, '2026-11').actuelle).toBe('service');
    const enService = etatPiste(frigo({}, { inServiceMonth: '2026-11' }), 1, '2026-11');
    expect(enService.actuelle).toBeNull(); expect(enService.faites.size).toBe(6);
    expect(etatPiste(frigo({}, { inServiceMonth: '2027-01' }), 1, '2026-11').actuelle).toBe('service'); // mise en service pas encore échue
    expect(etatPiste(frigo({}, { inServiceMonth: '2025-01' }), 0, '2026-11').actuelle).toBe('ready'); // sans achat, pas en service
  });
  it('resumeUsure : durée saisie, sinon 100 ÷ taux AFC ; sans budget ou sans durée, inconnu (jamais 0)', () => {
    expect(resumeUsure(frigo({}, { usefulLifeYears: 5 }))).toMatchObject({ ans: 5, parAnCents: 60000 });
    expect(resumeUsure(frigo({}, { depreciationCategory: 'tanks' }))).toMatchObject({ ans: 10, parAnCents: 30000 });
    expect(resumeUsure(frigo())).toMatchObject({ ans: null, parAnCents: null });
    expect(resumeUsure(frigo({ amountCents: 0 }, { usefulLifeYears: 5, budgetKnown: false })).parAnCents).toBeNull();
  });
  it('quand : le mois court, ou le jour d’un ancien projet ; rien sans date', () => {
    expect(quand(frigo())).toBe('nov. 2026');
    expect(quand(frigo({ date: '2026-11-15' }, { datePrecision: 'day' }))).toBe('15 nov. 2026');
    expect(quand(frigo({ date: '' }))).toBeNull();
  });
});
