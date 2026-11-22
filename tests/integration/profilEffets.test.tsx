// @vitest-environment jsdom
/**
 * m4pf-c (choix du 15.11) : « Solde et paramètres » montre ce que chaque réglage change.
 * Les nombres affichés sont ceux du domaine (summarizeLedger, annualBrewFixedCosts, tvaThresholdStatus), recalculés ici par le domaine lui-même.
 * L'enregistrement part en centimes et en dates ISO. Services simulés : aucune donnée réelle, aucun Gemini.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
const etat = vi.hoisted(() => ({ saveProfile: vi.fn(), transactions: [] as unknown[], payments: [] as unknown[], plans: [] as unknown[], stocks: [] as unknown[] }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getTransactions: () => etat.transactions, getStocks: () => ({ rawMaterials: etat.stocks, cleaning: [], equipment: [] }), getBatches: () => [],
  getConfig: () => ({ fiscal: { isTvaRegistered: false, tvaThresholdTurnover: 100000 } }), subscribe: () => () => {} } }));
vi.mock('../../src/services/financeService', () => ({ FinanceService: { getPayments: () => etat.payments, getPlans: () => etat.plans, getAssets: () => [], saveProfile: (...a: unknown[]) => etat.saveProfile(...a) } }));
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: (read: () => unknown) => read() }));
import { ProfileSheet } from '../../src/ui/finance/FinanceForms';
import { annualBrewFixedCosts, estimateBrewBudget } from '../../src/domain/finance/brewBudget';
import { summarizeLedger } from '../../src/domain/finance/ledger';
import { tvaThresholdStatus } from '../../src/domain/finance/tvaThreshold';
import { moisCompletsDepuis, courbeDeCaisse } from '../../src/ui/finance/profil/ProfilEffets';
import { coutLitre, troisNotions } from '../../src/domain/finance/chaineLitre';
import { nomCourtBrassin } from '../../src/ui/finance/profil/brassinProfil';
import { litreFr } from '../../src/ui/finance/previsions/format';
import type { FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';
import type { FinanceTransaction } from '../../src/domain/finance/types';
import { poserDate, zoneDate } from '../helpers/poserDate';

const AUJ = '2026-11-15';
const profil: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified', annualProductionL: 1200, historyCompleteFrom: '2026-01-01',
  openingCash: { date: '2026-01-01', amountCents: 100_000, confirmed: true } };
const loyer = { id: 'LOYER', title: 'Loyer', date: '2026-12-01', amountCents: 50_000, direction: 'out', category: 'chargesFixes', source: 'recurring', costAllocation: 'fixed', status: 'active', createdAt: '2026-01-01T00:00:00Z', recurrence: { frequency: 'monthly' } } as unknown as FinancialPlan;
const paiement = (id: string, date: string, amountCents: number, direction: 'in' | 'out') => ({ id, date, amountCents, direction, method: 'bank', recordedAt: `${date}T10:00:00Z` });
const vente = (id: string, date: string, chf: number) => ({ id, date, description: id, category: 'recettes', amountHT: chf, amountTTC: chf, tvaAmount: 0, tvaRate: 0, finance: { version: 1, kind: 'income', amountCents: Math.round(chf * 100), lines: [] } }) as unknown as FinanceTransaction;
const nbsp = (s: string) => s.replace(/[\s  ]/g, ' ');

beforeEach(() => { cleanup(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${AUJ}T10:00:00Z`));
  etat.saveProfile.mockReset(); etat.stocks = []; etat.transactions = []; etat.plans = [loyer]; etat.payments = [paiement('P1', '2026-03-10', 50_000, 'in'), paiement('P2', '2026-06-01', 20_000, 'out')]; });
afterEach(() => { cleanup(); vi.useRealTimers(); });
const ouvrir = (p: FinancialProfile = profil, parametres = false) => render(<ProfileSheet profile={p} parametres={parametres} onClose={() => {}} />);
const dialogue = () => within(screen.getByRole('dialog', { name: 'Solde et paramètres' }));

describe('m4pf-c : le solde et sa frise', () => {
  it('le titre est celui de la maquette ; « aujourd’hui » = la caisse du domaine, centimes compris', () => {
    ouvrir();
    const caisse = summarizeLedger([], etat.payments as never, profil, AUJ).cashCents;
    expect(caisse).toBe(130_000);
    expect(nbsp(document.querySelector('.pfc-pin')!.textContent!)).toContain('1 300,00');
  });
  it('la courbe : un point par mois, chaque point est la caisse du domaine à cette date', () => {
    const pts = courbeDeCaisse(profil, 100_000, '2026-01-01', AUJ, { transactions: [] as never, payments: etat.payments as never });
    expect(pts[0]).toEqual({ date: '2026-01-01', cents: 100_000 });
    expect(pts[pts.length - 1]).toEqual({ date: AUJ, cents: 130_000 });
    for (const p of pts) expect(p.cents).toBe(summarizeLedger([], etat.payments as never, profil, p.date).cashCents);
    expect(pts.find(p => p.date === '2026-03-31')?.cents).toBe(150_000);
  });
  it('sans solde saisi : pas de courbe inventée, pas de 0', () => {
    ouvrir({ ...profil, openingCash: undefined });
    expect(document.querySelector('.pfc-pin')).toBeNull();
    expect(dialogue().getByText(/la courbe de la caisse s’affiche ici/)).toBeTruthy();
  });
  it('enregistre : « 3 250,50 » devient 325 050 centimes, date ISO, case cochée', () => {
    ouvrir({ ...profil, openingCash: undefined });
    const champ = dialogue().getByLabelText('Solde de départ (CHF)');
    fireEvent.focus(champ); fireEvent.change(champ, { target: { value: '3250,50' } }); fireEvent.blur(champ);
    poserDate('Date du solde', '2026-02-01');
    expect(dialogue().getByRole('note')).toHaveTextContent(/Sans cette case/);
    fireEvent.click(dialogue().getByRole('checkbox', { name: /J’ai vérifié ce solde/ }));
    expect(screen.queryByText(/Sans cette case/)).toBeNull();
    fireEvent.click(dialogue().getByRole('button', { name: 'Enregistrer' }));
    return vi.waitFor(() => expect(etat.saveProfile).toHaveBeenCalledWith(expect.objectContaining({ openingCash: { date: '2026-02-01', amountCents: 325_050, confirmed: true } })));
  });
  it('une date du solde changée retire la vérification (comme avant)', () => {
    ouvrir();
    expect((dialogue().getByRole('checkbox', { name: /J’ai vérifié ce solde/ }) as HTMLInputElement).checked).toBe(true);
    poserDate('Date du solde', '2026-02-01');
    expect((dialogue().getByRole('checkbox', { name: /J’ai vérifié ce solde/ }) as HTMLInputElement).checked).toBe(false);
  });
});

describe('m4pf-c : tout est noté depuis', () => {
  it('compte les mois pleins avant le mois courant : janvier à octobre = 10', () => {
    expect(moisCompletsDepuis('2026-01-01', AUJ)).toBe(10);
    expect(moisCompletsDepuis('2026-11-01', AUJ)).toBe(0);
    expect(moisCompletsDepuis(undefined, AUJ)).toBe(0);
    ouvrir();
    expect(dialogue().getByText('10 mois complets : la tendance est calculée.')).toBeTruthy();
  });
  it('toucher un mois place le début : août → 3 mois (tendance), octobre → 1 mois (pas de tendance) ; enregistré en AAAA-MM-01', () => {
    ouvrir();
    fireEvent.click(dialogue().getByRole('button', { name: 'Tout est noté depuis août 2026' }));
    expect(dialogue().getByText('3 mois complets : la tendance est calculée.')).toBeTruthy();
    fireEvent.click(dialogue().getByRole('button', { name: 'Tout est noté depuis octobre 2026' }));
    expect(dialogue().getByText('1 mois complet : pas encore de tendance, il en faut 3.')).toBeTruthy();
    expect(dialogue().getByRole('button', { name: 'Tout est noté depuis décembre 2026' })).toBeDisabled();
    fireEvent.click(dialogue().getByRole('button', { name: 'Enregistrer' }));
    return vi.waitFor(() => expect(etat.saveProfile).toHaveBeenCalledWith(expect.objectContaining({ historyCompleteFrom: '2026-10-01' })));
  });
});

describe('m4pf-c : la production et ses trois effets', () => {
  it('charges fixes par litre = annualBrewFixedCosts ÷ litres du curseur', () => {
    ouvrir();
    const fixes = annualBrewFixedCosts([loyer]).amountCHF!;
    expect(fixes).toBe(6000);
    const carte = document.querySelector('.pfc-eff > span') as HTMLElement;
    expect(carte.textContent).toContain('5,00/L');
    expect(nbsp(carte.textContent!)).toContain('6 000 ÷ 1 200');
    fireEvent.change(dialogue().getByLabelText('Production annuelle, curseur'), { target: { value: '2000' } });
    expect((document.querySelector('.pfc-eff > span') as HTMLElement).textContent).toContain('3,00/L');
    expect(nbsp((document.querySelector('.pfc-eff > span') as HTMLElement).textContent!)).toContain('6 000 ÷ 2 000');
  });
  it('sans production : « — » (jamais 0) et le champ reste vide', () => {
    ouvrir({ ...profil, annualProductionL: undefined });
    const carte = document.querySelector('.pfc-eff > span') as HTMLElement;
    expect(carte.querySelector('b')!.textContent).toBe('—');
    expect(carte.textContent).toContain('production à saisir');
    expect((dialogue().getByLabelText('Production annuelle prévue (litres conditionnés)') as HTMLInputElement).value).toBe('');
  });
  it('aucun brassin planifié : le nombre de brassins et le coût du litre restent « — »', () => {
    ouvrir();
    const [, brassins, litre] = [...document.querySelectorAll('.pfc-eff > span')] as HTMLElement[];
    expect(brassins.querySelector('b')!.textContent).toBe('—'); expect(brassins.textContent).toContain('aucun brassin planifié');
    expect(litre.querySelector('b')!.textContent).toBe('—');
  });
  it('enregistre la production du curseur en litres entiers ; le champ texte suit', () => {
    ouvrir();
    fireEvent.change(dialogue().getByLabelText('Production annuelle, curseur'), { target: { value: '2500' } });
    // t1, problème 4 : au repos le champ montre les milliers comme la maquette (« 2 500 »).
    expect(nbsp((dialogue().getByLabelText('Production annuelle prévue (litres conditionnés)') as HTMLInputElement).value)).toBe('2 500');
    fireEvent.click(dialogue().getByRole('button', { name: 'Enregistrer' }));
    return vi.waitFor(() => expect(etat.saveProfile).toHaveBeenCalledWith(expect.objectContaining({ annualProductionL: 2500 })));
  });
  it('le curseur à zéro remet la production à « non renseignée », pas à 0', () => {
    ouvrir();
    fireEvent.change(dialogue().getByLabelText('Production annuelle, curseur'), { target: { value: '0' } });
    fireEvent.click(dialogue().getByRole('button', { name: 'Enregistrer' }));
    return vi.waitFor(() => expect(etat.saveProfile.mock.calls[0][0].annualProductionL).toBeUndefined());
  });
});

describe('m4pf-c : la TVA', () => {
  it('ventes sur 12 mois et seuil = tvaThresholdStatus ; sous 80 % : « ✓ sans TVA »', () => {
    etat.transactions = [vente('V1', '2026-10-01', 18_640)];
    ouvrir();
    const s = tvaThresholdStatus(etat.transactions as never, AUJ, 100_000, false)!;
    expect(s.turnoverCents).toBe(1_864_000);
    const texte = nbsp(dialogue().getByLabelText('TVA').textContent!);
    expect(texte).toContain('✓ sans TVA'); expect(texte).toContain('18 640'); expect(texte).toContain('100 000');
  });
  it('au-dessus de 80 % : le seuil proche est dit', () => {
    etat.transactions = [vente('V1', '2026-10-01', 85_000)];
    ouvrir();
    expect(dialogue().getByLabelText('TVA')).toHaveTextContent('⚠ proche du seuil');
  });
});

describe('t1, bloquant 3 : le prochain brassin du profil', () => {
  const budgetBrassage = (jour: string): FinancialPlan => {
    const recette = { id: 'R1', name: 'Pale Ale', style: 'Pale Ale', volumeL: 30, fermentables: [], hops: [], ogTarget: 1.05 } as never;
    const snap = { ...estimateBrewBudget({ recipe: recette, stockItems: [], batches: [], brewDate: jour, netVolumeL: 27, now: `${jour}T10:00:00Z`,
      settings: { costs: { energy: { enabled: true, amountTTC: 8 }, cleaning: { enabled: true, amountTTC: 3 }, packaging: { enabled: true, amountTTC: 24 }, beerTax: { enabled: true, amountTTC: 6.84 } }, annualVolumeL: 1200, annualFixedCHF: 4800, annualDepreciationCHF: 360 } }), netVolumeSource: 'saisi' as const };
    return { id: 'BUDGET', title: 'Pale Ale', date: jour, amountCents: 6426, direction: 'out', category: 'brassage', source: 'brew', status: 'active', createdAt: '2026-11-01T00:00:00Z', brewEstimate: snap } as unknown as FinancialPlan;
  };
  it('sans brassin planifié mais avec un budget de brassin prévu (net saisi 27 L) : « ≈ 44 brassins de 27 L », pas « aucun brassin planifié »', () => {
    etat.plans = [loyer, budgetBrassage('2026-11-20')];
    ouvrir();
    const zone = dialogue().getByLabelText('Production prévue');
    expect(zone.textContent).not.toContain('aucun brassin planifié');
    expect(nbsp(zone.textContent!)).toContain('≈ 44');
    expect(nbsp(zone.textContent!)).toContain('brassins de 27 L');
    expect(zone.textContent).toContain('Pale Ale');
  });
  it('t2, point 2 : le prix du litre du profil est celui du budget du même brassin (mêmes réglages enregistrés, même fonction), pas un second calcul', () => {
    // La pièce du banc de démonstration : 25 kg de Pilsner achetés 186,80, une recette de 6 kg, un budget complet de 27 L nets (c3a).
    const malt = { id: 'DEMO-MALT', ref: 'DEMO-MALT', name: 'Pilsner', category: 'Malt', unit: 'kg', currentStock: 3, minStock: 2, reorder: false, kind: 'rawMaterials' };
    const achat = { id: 'DEMO-T1', date: '2026-11-15', description: 'Malt', amountHT: 186.8, amountTTC: 186.8, tvaAmount: 0, tvaRate: 0, category: 'brassage', subcategory: '',
      finance: { version: 1, kind: 'expense', amountCents: 18680, vendor: 'Comptoir', paymentStatus: 'unpaid', recordedAt: '2026-11-15T10:00:00Z', lines: [{ id: 'malt', description: 'Pilsner', kind: 'ingredient', quantity: 25, unit: 'kg', stockItemRef: 'DEMO-MALT', amountCents: 18680 }] } };
    etat.stocks = [malt]; etat.transactions = [achat];
    const recette = { id: 'DEMO-PALE', name: 'Pale Ale', style: 'Pale Ale', volumeL: 30, fermentables: [{ name: 'Pilsner', weightKg: 6, kind: 'grain', use: 'empatage', stockItemRef: 'DEMO-MALT' }], hops: [], yeast: { name: '', qty: 0, unit: 'sachet', form: 'sèche' }, ogTarget: 1.05, abvTarget: 5.2 } as never;
    const reglages = { costs: { energy: { enabled: true, amountTTC: 8 }, cleaning: { enabled: true, amountTTC: 3 }, packaging: { enabled: true, amountTTC: 24 }, beerTax: { enabled: true, amountTTC: 6.84 } }, annualVolumeL: 1200, annualFixedCHF: 4800, annualDepreciationCHF: 360, includeFixed: true, includeDepreciation: true };
    const calcul = (settings: object) => estimateBrewBudget({ recipe: recette, stockItems: [malt] as never, batches: [], transactions: [achat] as never, brewDate: '2026-11-20', netVolumeL: 27, og: 1.05, abv: 5.2, settings, now: '2026-11-15T10:00:00Z' });
    const snap = { ...calcul(reglages), netVolumeSource: 'saisi' as const };
    etat.plans = [loyer, { id: 'BUDGET', title: 'Pale Ale', date: '2026-11-20', amountCents: 6426, direction: 'out', category: 'brassage', source: 'brew', status: 'active', createdAt: '2026-11-01T00:00:00Z', brewEstimate: snap } as unknown as FinancialPlan];
    // Le loyer vit à 6 000 CHF/an : le budget enregistré garde ses 4 800 ; le profil ne doit pas les remplacer.
    const attendu = coutLitre({ notions: troisNotions(snap), litres: 27 })!.affiche.complet;
    expect(attendu).toBeGreaterThan(0);
    ouvrir();
    expect(nbsp(dialogue().getByLabelText('Production prévue').textContent!)).toContain(`≥ ${litreFr(attendu)}/L`);
  });
  it('t2, point 3 : la tuile du brassin porte un nom court sans coupure et « ≥ » comme m4pf-c', () => {
    expect(nomCourtBrassin('Pale Ale de septembre')).toBe('Pale Ale');
    expect(nomCourtBrassin('IPA d’octobre')).toBe('IPA');
    expect(nomCourtBrassin('Stout · 20 nov.')).toBe('Stout');
    expect(nomCourtBrassin('Saison de ferme')).toBe('Saison de ferme');
    expect(nomCourtBrassin('Blanche 12.11')).toBe('Blanche');
    expect(nomCourtBrassin('Mai')).toBe('Mai');
  });
  it('sans aucun brassin ni budget : « aucun brassin planifié » reste dit (l’inconnu n’est jamais 0)', () => {
    ouvrir();
    expect(dialogue().getByLabelText('Production prévue').textContent).toContain('aucun brassin planifié');
  });
  it('le Solde de départ saisi « 3250,5 » se lit « 3 250,50 » au repos', () => {
    ouvrir({ ...profil, openingCash: { date: '2026-01-01', amountCents: 325_050, confirmed: true } });
    expect(nbsp((dialogue().getByLabelText('Solde de départ (CHF)') as HTMLInputElement).value)).toBe('3 250,50');
  });
});

describe('m4pf-c : les renvois', () => {
  it('`parametres` amène sur les réglages (carte « Tout est noté depuis » dans la vue)', () => {
    const vise = vi.fn(), avant = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView');
    Element.prototype.scrollIntoView = vise as never;
    try { ouvrir(profil, true); expect(vise).toHaveBeenCalledTimes(1); expect((vise.mock.contexts[0] as HTMLElement).getAttribute('aria-label')).toBe('Tout est noté depuis'); }
    finally { if (avant) Object.defineProperty(Element.prototype, 'scrollIntoView', avant); else delete (Element.prototype as unknown as Record<string, unknown>).scrollIntoView; }
  });
  it('un solde saisi ne reste jamais sans date valide : la frise porte toujours un jour, la garde du domaine reste la seconde sécurité', async () => {
    ouvrir();
    /* GESTE-DATE-PARTOUT (D425) : la frise ne vide pas une date, donc « sans date » n'est plus atteignable au geste ; ce qui se prouve : le jour porté est un vrai jour ISO,
     * posé au geste il est écrit tel quel, et rien ne part sans lui. (La garde « Choisis la date du solde. » de `save` reste, pour une pièce corrompue.) */
    expect(zoneDate('Date du solde').getAttribute('data-valeur')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    poserDate('Date du solde', '2026-02-10');
    expect(zoneDate('Date du solde')).toHaveAttribute('data-valeur', '2026-02-10');
    fireEvent.submit(document.getElementById('finance-form')!);
    await waitFor(() => expect(etat.saveProfile).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(JSON.stringify(etat.saveProfile.mock.calls[0][0].openingCash)).toContain('2026-02-10');
  });
});
