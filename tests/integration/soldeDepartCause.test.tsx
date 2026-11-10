import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
import { Previsions } from '../../src/ui/finance/previsions/Previsions';
import { Caisse } from '../../src/ui/finance/synthese/Caisse';
import { ProfileSheet } from '../../src/ui/finance/FinanceForms';
import { summarizeLedger } from '../../src/domain/finance/ledger';
import type { FinancialPayment, FinancialProfile } from '../../src/domain/finance/types';
import { ASOF, atelier, depense, profil } from './previsionsFixture';

// CP-4 (10.11) : « Ça fonctionne pas non plus… » — solde 100 saisi, case non cochée ; Prévisions disait encore « à renseigner ».
// Le registre dit la cause exacte de la caisse inconnue ; Prévisions (p5b) et Synthèse › En caisse la disent et y renvoient. Aucun chiffre inventé.
const sansSolde = profil({ openingCash: undefined });
const aConfirmer = profil({ openingCash: { date: '2026-01-08', amountCents: 10_000, confirmed: false } });
const confirme = profil({ openingCash: { date: '2026-11-01', amountCents: 10_000, confirmed: true } });
const achat = (id: string) => depense(id, `Achat ${id}`, 5_000, '2026-11-01', { paymentStatus: 'paid' }); // « payé » sans date ni paiement : à confirmer
const invalide = [{ id: 'P1', transactionId: 'ATELIER', date: 'pas une date', amountCents: 0, direction: 'out' }] as unknown as FinancialPayment[];

const CAS = {
  absent: { profile: sansSolde, txs: [atelier()], payments: [] as FinancialPayment[] },
  'a-confirmer': { profile: aConfirmer, txs: [atelier()], payments: [] as FinancialPayment[] },
  paiements: { profile: confirme, txs: [achat('A1'), achat('A2')], payments: [] as FinancialPayment[] },
  autre: { profile: confirme, txs: [atelier()], payments: invalide },
  connue: { profile: confirme, txs: [atelier()], payments: [] as FinancialPayment[] },
};
type Cas = keyof typeof CAS;
const registre = (c: Cas) => summarizeLedger(CAS[c].txs as never, CAS[c].payments, CAS[c].profile, ASOF, { includeScheduled: true });

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${ASOF}T10:00:00Z`)); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Le registre dit pourquoi la caisse est inconnue', () => {
  it('quatre causes, et null quand la caisse est connue', () => {
    expect(registre('absent').cashCause).toBe('absent');
    expect(registre('a-confirmer').cashCause).toBe('a-confirmer');
    expect(registre('paiements').cashCause).toBe('paiements');
    expect(registre('autre').cashCause).toBe('autre');
    expect(registre('connue').cashCause).toBeNull();
    expect(registre('connue').cashComplete).toBe(true);
  });
  it('paiements : le nombre de paiements à confirmer depuis le solde, pas ceux d’avant', () => {
    expect(registre('paiements').unknownSinceOpeningCount).toBe(2);
    const avant = summarizeLedger([{ ...depense('V', 'Vieux achat', 5_000, '2026-01-02', { paymentStatus: 'paid' }), date: '2026-01-02' }, achat('A1')] as never, [], confirme, ASOF);
    expect(avant.unknownPaymentCount).toBe(2);
    expect(avant.unknownSinceOpeningCount).toBe(1);
  });
  it('autre : la première alerte du registre, mot pour mot', () => {
    expect(registre('autre').cashAlert).toBe('Des paiements ont une date ou un montant invalide.');
    expect(registre('connue').cashAlert).toBeNull();
  });
  it('solde saisi et non confirmé ET paiements à confirmer : la cause est d’abord la case', () => {
    const l = summarizeLedger([achat('A1')] as never, [], aConfirmer, ASOF);
    expect(l.cashCause).toBe('a-confirmer');
    expect(l.cashComplete).toBe(false);
    expect(l.cashCents).toBeNull();
  });
  it('rien ne change dans les calculs : caisse inconnue = null, jamais 0', () => {
    for (const c of ['absent', 'a-confirmer', 'paiements', 'autre'] as const) { expect(registre(c).cashCents === null || registre(c).cashComplete === false).toBe(true); expect(registre(c).cashComplete).toBe(false); }
    expect(registre('absent').cashCents).toBeNull();
    expect(registre('a-confirmer').cashCents).toBeNull();
  });
});

describe('Prévisions (p5b) : le bandeau pointillé suit la cause et renvoie au bon endroit', () => {
  const monter = (c: Cas, over: Record<string, unknown> = {}) => {
    const fn = { onProfile: vi.fn(), onPayments: vi.fn(), onRegistre: vi.fn() };
    render(<Previsions asOf={ASOF} horizon={90} onHorizon={() => {}} transactions={CAS[c].txs as never} payments={CAS[c].payments} plans={[]} profile={CAS[c].profile} assets={[]} batches={[]} stockItems={[]}
      ledger={registre(c)} openingCashReady={false} avecProjets onAvecProjets={() => {}} {...fn} onOpenTransaction={() => {}} onOpenPlan={() => {}} onOpenUpgrade={() => {}}
      onAddPlan={() => {}} onBudgetPicker={() => {}} onOpenBudget={() => {}} onNotice={() => {}} {...over} />);
    return fn;
  };
  // Le bandeau du solde ; « Rien de prévu » et « Tendance à calculer » (CP-7) ont la même forme mais une autre cause.
  const bandeau = () => ([...document.querySelectorAll('.prv-depart')] as HTMLElement[]).find(b => !/Rien de prévu|Tendance à calculer/.test(b.textContent ?? '')) ?? null;

  it('absent : « Solde de départ à renseigner » ouvre la feuille du solde', () => {
    const fn = monter('absent');
    expect(bandeau()).toHaveTextContent('Solde de départ à renseigner');
    fireEvent.click(bandeau()!);
    expect(fn.onProfile).toHaveBeenCalledTimes(1); expect(fn.onPayments).not.toHaveBeenCalled();
  });
  it('a-confirmer : le montant et la date saisis, la case à cocher, vers la feuille du solde', () => {
    const fn = monter('a-confirmer');
    expect(bandeau()).toHaveTextContent(/Solde de 100,00 au 8 janv\. à confirmer/);
    expect(bandeau()).toHaveTextContent(/coche « J’ai vérifié ce solde » ; sans lui, seul l’écart est connu/);
    expect(bandeau()).not.toHaveTextContent('à renseigner');
    fireEvent.click(bandeau()!);
    expect(fn.onProfile).toHaveBeenCalledTimes(1);
  });
  it('paiements : « Confirmer les paiements (2) », depuis le jour du solde, vers le journal filtré', () => {
    const fn = monter('paiements');
    expect(bandeau()).toHaveTextContent(/Confirmer les paiements \(2\)/);
    expect(bandeau()).toHaveTextContent(/depuis le 1 nov\. ; sans eux, le solde n’est pas connu/);
    expect(bandeau()).not.toHaveTextContent('à renseigner');
    fireEvent.click(bandeau()!);
    expect(fn.onPayments).toHaveBeenCalledTimes(1); expect(fn.onProfile).not.toHaveBeenCalled();
  });
  it('autre : « Données à vérifier » avec la première alerte du registre, vers le journal', () => {
    const fn = monter('autre');
    expect(bandeau()).toHaveTextContent('Données à vérifier');
    expect(bandeau()).toHaveTextContent('Des paiements ont une date ou un montant invalide.');
    fireEvent.click(bandeau()!);
    expect(fn.onRegistre).toHaveBeenCalledTimes(1); expect(fn.onProfile).not.toHaveBeenCalled();
  });
  it('autre sans geste du registre : le journal des paiements à confirmer sert de repli', () => {
    const fn = monter('autre', { onRegistre: undefined });
    fireEvent.click(bandeau()!);
    expect(fn.onPayments).toHaveBeenCalledTimes(1);
  });
  it('caisse connue : pas de bandeau', () => {
    monter('connue');
    expect(bandeau()).toBeNull();
  });
});

describe('Synthèse › En caisse : la même cause, le même renvoi', () => {
  const monter = (c: Cas) => {
    const fn = { onProfile: vi.fn(), onJournal: vi.fn() };
    const p = CAS[c].profile as FinancialProfile;
    render(<Caisse ledger={registre(c)} openingCashReady={false} openingCash={p.openingCash} {...fn} onTransaction={() => {}} onPayment={() => {}} />);
    return fn;
  };
  it('absent : « Solde de départ à renseigner » ouvre la feuille du solde', () => {
    const fn = monter('absent');
    fireEvent.click(screen.getByRole('button', { name: /Solde de départ à renseigner/ }));
    expect(fn.onProfile).toHaveBeenCalledTimes(1);
  });
  it('a-confirmer : le solde saisi, la case à cocher, vers la feuille du solde', () => {
    const fn = monter('a-confirmer');
    expect(screen.getByText(/Solde de départ saisi : .*100,00.*à confirmer/)).toBeTruthy();
    expect(screen.getByText(/Coche « J’ai vérifié ce solde »/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Solde de départ saisi/ }));
    expect(fn.onProfile).toHaveBeenCalledTimes(1);
  });
  it('paiements : « 2 paiements à confirmer » (la rangée « Confirmer les paiements » de À vérifier reste à part) ouvre le journal filtré', () => {
    const fn = monter('paiements');
    const lien = screen.getByRole('button', { name: /2 paiements à confirmer/ });
    expect(lien.parentElement).toHaveTextContent(/depuis le 1 nov\. ; sans eux, le solde n’est pas connu/);
    fireEvent.click(lien);
    expect(fn.onJournal).toHaveBeenCalledWith({ scope: 'all', allDates: true, filter: 'unknown' });
  });
  it('autre : « Données à vérifier » et l’alerte du registre ouvrent le journal', () => {
    const fn = monter('autre');
    const lien = screen.getByRole('button', { name: /Données à vérifier/ });
    expect(lien.parentElement).toHaveTextContent('Des paiements ont une date ou un montant invalide.');
    fireEvent.click(lien);
    expect(fn.onJournal).toHaveBeenCalledWith({ scope: 'all', allDates: true });
  });
  it('caisse connue : le montant, aucune note de cause', () => {
    monter('connue');
    expect(screen.queryByText(/à renseigner|à confirmer|à vérifier/)).toBeNull();
  });
});

describe('Feuille du solde : dire ce que fait la case', () => {
  const PHRASE = /Sans cette case, ce solde n[’']est compté ni dans la caisse ni dans les prévisions\./;
  const ouvrir = (p: FinancialProfile) => render(<ProfileSheet profile={p} onClose={() => {}} />);
  it('montant saisi, case non cochée : la ligne apparaît ; cochée, elle disparaît', () => {
    ouvrir(sansSolde);
    expect(screen.queryByText(PHRASE)).toBeNull();
    fireEvent.change(screen.getByLabelText('Solde de départ (CHF)'), { target: { value: '100' } });
    const dialogue = within(screen.getByRole('dialog', { name: 'Solde et paramètres financiers' }));
    expect(dialogue.getByText(PHRASE)).toBeTruthy();
    fireEvent.click(dialogue.getByRole('checkbox', { name: /J’ai vérifié ce solde/ }));
    expect(screen.queryByText(PHRASE)).toBeNull();
  });
  it('solde déjà confirmé : pas de ligne', () => {
    ouvrir(confirme);
    expect(screen.queryByText(PHRASE)).toBeNull();
  });
});

// CP-7 (10.11) : « on voit pas grand chose de plus alors qu'il y a eu des opérations durant l'année ?? » — Prévisions plate, « Prévu ~ 0,00 ».
// Quand l'escalier n'a aucune marche, deux lignes (même forme que le bandeau du solde) disent pourquoi et renvoient.
describe('Prévisions plate : dire pourquoi et renvoyer', () => {
  const loyerPrevu = { id: 'LOYER', title: 'Loyer', date: '2026-11-25', amountCents: 40_000, direction: 'out', category: 'chargesFixes', source: 'recurring', costAllocation: 'fixed', status: 'active', createdAt: '2026-10-01T00:00:00Z' };
  const monter = (profile: FinancialProfile, plans: unknown[] = []) => {
    const fn = { onProfile: vi.fn(), onHistorique: vi.fn(), onAddPlan: vi.fn(), onPayments: vi.fn() };
    const ledger = summarizeLedger([], [], profile, ASOF, { includeScheduled: true });
    render(<Previsions asOf={ASOF} horizon={90} onHorizon={() => {}} transactions={[]} payments={[]} plans={plans as never} profile={profile} assets={[]} batches={[]} stockItems={[]}
      ledger={ledger} openingCashReady avecProjets onAvecProjets={() => {}} {...fn} onOpenTransaction={() => {}} onOpenPlan={() => {}} onOpenUpgrade={() => {}}
      onBudgetPicker={() => {}} onOpenBudget={() => {}} onNotice={() => {}} />);
    return fn;
  };
  it('rien de prévu et pas d’historique : « Tendance à calculer » → paramètres ; « Rien de prévu » → prévoir', () => {
    const fn = monter(confirme);
    const tendance = screen.getByRole('button', { name: /Tendance à calculer/ });
    expect(tendance).toHaveTextContent(/indique depuis quand ton historique est complet \(3 mois au moins\)/);
    expect(tendance.className).toContain('prv-depart');
    fireEvent.click(tendance);
    expect(fn.onHistorique).toHaveBeenCalledTimes(1); expect(fn.onProfile).not.toHaveBeenCalled();
    const rien = screen.getByRole('button', { name: /Rien de prévu/ });
    expect(rien).toHaveTextContent(/un brassin ou un paiement à venir/);
    fireEvent.click(rien);
    expect(fn.onAddPlan).toHaveBeenCalledTimes(1);
  });
  it('historique déclaré complet : plus de « Tendance à calculer », « Rien de prévu » reste', () => {
    monter({ ...confirme, historyCompleteFrom: '2026-01-01' });
    expect(screen.queryByRole('button', { name: /Tendance à calculer/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Rien de prévu/ })).toBeTruthy();
  });
  it('seulement une marche aujourd’hui (ses achats du 10.11) : « Rien de prévu » reste', () => {
    monter(confirme, [{ ...loyerPrevu, id: 'AUJ', date: ASOF }]);
    expect(screen.getByRole('button', { name: /Rien de prévu/ })).toBeTruthy();
  });
  it('une sortie à venir : aucune des deux lignes', () => {
    monter(confirme, [loyerPrevu]);
    expect(screen.queryByRole('button', { name: /Tendance à calculer/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Rien de prévu/ })).toBeNull();
  });
  it('solde inconnu ET rien de prévu : le bandeau du solde reste le premier', () => {
    monter(sansSolde);
    const bandeaux = [...document.querySelectorAll('.prv-depart')].map(b => b.textContent ?? '');
    expect(bandeaux[0]).toContain('Solde de départ à renseigner');
    expect(bandeaux).toHaveLength(3);
  });
  it('feuille du solde ouverte sur « Paramètres des prévisions et des brassins » quand on y est renvoyé', () => {
    render(<ProfileSheet profile={confirme} parametres onClose={() => {}} />);
    expect((screen.getByText('Paramètres des prévisions et des brassins').closest('details') as HTMLDetailsElement).open).toBe(true);
    cleanup();
    render(<ProfileSheet profile={confirme} onClose={() => {}} />);
    expect((screen.getByText('Paramètres des prévisions et des brassins').closest('details') as HTMLDetailsElement).open).toBe(false);
  });
});
