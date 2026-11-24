// @vitest-environment jsdom
/**
 * Voie ecr6 (24.11, tour 44) : E44-1 (les dates annoncées par la saisie sont celles du Calendrier), E44-2 (le retrait annonce les remboursements liés
 * que la liste affichée ne montre pas), E44-3 (la Référence d'un apport n'est pas un n° de facture), erreurs du serveur en français.
 * Fixtures simulées, aucune donnée réelle.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';

const store = new Map<string, Map<string, Record<string, unknown>>>();
const fakeRepo = {
  all: <T,>(name: string): T[] => Array.from(store.get(name)?.entries() ?? []).map(([__docId, doc]) => ({ ...doc, __docId }) as T),
  put: (name: string, id: string, doc: unknown, options?: { merge?: boolean }) => {
    if (!store.has(name)) store.set(name, new Map());
    const value = options?.merge ? { ...store.get(name)!.get(id), ...(doc as object) } : doc;
    store.get(name)!.set(id, JSON.parse(JSON.stringify(value)));
  },
  adjustNumber: () => {}, remove: (name: string, id: string) => { store.get(name)?.delete(id); },
  startSync: () => {}, isReady: () => true, subscribe: () => () => {}, consumeWriteError: () => null, clearMemoryCache: () => store.clear()
};
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: fakeRepo, ALL_COLLECTIONS: [] }));
const { StorageService } = await import('../../src/services/storage');
const { FinanceService } = await import('../../src/services/financeService');
const { EditTransactionModal } = await import('../../src/components/EditTransactionModal');
const { avecGenre, brouillonNeuf, preparer, indicationReference, GENRES } = await import('../../src/ui/saisie/modele');
const { datesDesOccurrences, decalageDeLEcheance, planOccurrences } = await import('../../src/domain/finance/forecast');
const { ecrituresLieesDans, phraseDuRetrait } = await import('../../src/domain/finance/retraitEcriture');
const { texteErreurServeur, codeServeur } = await import('../../src/domain/finance/erreurServeur');

beforeEach(() => { store.clear(); localStorage.clear(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-24T10:00:00')); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('E44-1 : une règle des dates d’une écriture qui revient', () => {
  it('« à payer d’ici le 24.12 », mensuelle : 24.12, 24.01, 24.02, 24.03 (l’échéance, plus la date du jour)', () => {
    expect(datesDesOccurrences('2026-11-24', 'monthly', undefined, '2026-12-24', 4)).toEqual(['2026-12-24', '2027-01-24', '2027-02-24', '2027-03-24']);
  });
  it('trimestrielle : 24.12, 24.03 ; payée (sans échéance) : les dates de la pièce, comme avant', () => {
    expect(datesDesOccurrences('2026-11-24', 'quarterly', undefined, '2026-12-24', 2)).toEqual(['2026-12-24', '2027-03-24']);
    expect(datesDesOccurrences('2026-11-24', 'quarterly', undefined, undefined, 3)).toEqual(['2026-11-24', '2027-02-24', '2027-05-24']);
    expect(datesDesOccurrences('2026-11-24', 'monthly', undefined, '2026-11-24', 2)).toEqual(['2026-11-24', '2026-12-24']);
  });
  it('la fin s’applique à la date de la pièce (comme au Calendrier) ; un 31 se ramène au dernier jour du mois ; annuelle', () => {
    expect(datesDesOccurrences('2026-11-24', 'monthly', '2027-01-24', '2026-12-24', 9)).toEqual(['2026-12-24', '2027-01-24', '2027-02-24']);
    expect(datesDesOccurrences('2026-01-31', 'monthly', undefined, undefined, 3)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
    expect(datesDesOccurrences('2026-11-24', 'yearly', undefined, '2026-12-24', 2)).toEqual(['2026-12-24', '2027-12-24']);
  });
  it('délai en jours quand l’échéance n’est pas le même quantième (20 jours) : le même décalage que le Calendrier', () => {
    expect(datesDesOccurrences('2026-11-24', 'monthly', undefined, '2026-12-14', 3)).toEqual(['2026-12-14', '2027-01-13', '2027-02-13']);
  });
  it('identique, pour une vraie saisie à payer, à ce que le Calendrier calcule (planOccurrences décalées par decalageDeLEcheance)', () => {
    for (const rythme of ['monthly', 'quarterly'] as const) {
      const e = preparer({ ...avecGenre(brouillonNeuf('2026-11-24'), 'salaire'), cents: 500, nom: 'ZZ TEST — Salaire', reglement: 'apayer', echeance: '2026-12-24', rythme, fin: 'sans' } as never,
        { id: `TX-${rythme}`, maintenant: '2026-11-24T10:00:00Z', transactions: [], tvaInscrit: false });
      expect(e.plan?.recurrence?.frequency).toBe(rythme);
      const decaler = decalageDeLEcheance(e.plan!, [e.transaction as never]);
      const calendrier = planOccurrences(e.plan!, '2026-11-01', '2028-12-31').map(o => decaler(o.date)).slice(0, 4);
      expect(datesDesOccurrences('2026-11-24', rythme, undefined, e.transaction.finance?.dueDate, 4)).toEqual(calendrier);
      expect(calendrier[0]).toBe('2026-12-24');
    }
  });
});

describe('E44-2 : le retrait annonce les remboursements liés, même ceux que la liste affichée ne montre pas', () => {
  async function poser() {
    const achat = preparer({ ...avecGenre(brouillonNeuf('2026-11-19'), 'achat'), cents: 200, nom: 'ZZ TEST — Achat lié' }, { id: 'TX-A', maintenant: '2026-11-19T10:00:00Z', transactions: [], tvaInscrit: false });
    StorageService.addTransaction(achat.transaction as never);
    FinanceService.recordPayment(achat.paiement!);
    const r = preparer({ ...avecGenre(brouillonNeuf('2026-11-20'), 'rembt'), cents: 50, pieceId: 'TX-A', nom: 'ZZ TEST — Remboursement' }, { id: 'TX-R', maintenant: '2026-11-20T10:00:00Z', transactions: [achat.transaction], tvaInscrit: false });
    StorageService.addTransaction(r.transaction as never);
    FinanceService.recordPayment(r.paiement!);
    return StorageService.getTransactions();
  }
  it('règle du domaine : ecrituresLieesDans rend les avoirs en vigueur, le plus éloigné d’abord ; phraseDuRetrait les nomme', async () => {
    const txs = await poser();
    const liees = ecrituresLieesDans('TX-A', txs as never);
    expect(liees.map(t => t.id)).toEqual(['TX-R']);
    expect(phraseDuRetrait(200, liees)).toMatch(/Son paiement de .*2,00.* est d’abord inversé/);
    expect(phraseDuRetrait(200, liees)).toMatch(/Son remboursement lié \(ZZ TEST — Remboursement .*\) est retiré avec elle, paiement inversé compris/);
    expect(phraseDuRetrait(0, [])).toMatch(/^Retirer cette écriture \? Aucun paiement n’est noté : rien à inverser\. Une écriture ne se supprime jamais/);
  });
  it('la fiche dit « remboursement lié » alors que la liste reçue ne contient pas le remboursement', async () => {
    const { TransactionDetails } = await import('../../src/ui/finance/TransactionDetails');
    const txs = await poser();
    const listeAffichee = txs.filter(t => t.id !== 'TX-R');
    render(<TransactionDetails transaction={listeAffichee.find(t => t.id === 'TX-A')!} transactions={listeAffichee} payments={FinanceService.getPayments()} plans={[]}
      onClose={() => undefined} onEdit={() => undefined} onPay={() => undefined} onRefund={() => undefined} />);
    act(() => { fireEvent.click([...document.querySelectorAll('button')].find(b => b.textContent === 'Retirer cette écriture')!); });
    expect(document.querySelector('.fiche-corriger')?.textContent).toMatch(/Son remboursement lié \(ZZ TEST — Remboursement/);
  });
});

describe('E44-3 : la Référence d’un apport n’est pas un n° de facture', () => {
  it('indication par genre : facture pour achat/vente/charges, « facultatif » pour apport, prélèvement et remboursement', () => {
    expect(indicationReference('apport')).toBe('Référence, facultatif');
    expect(indicationReference('prel')).toBe('Référence, facultatif');
    expect(indicationReference('rembt')).toBe('Référence, facultatif');
    expect(indicationReference('impot')).toBe('Période, référence');
    for (const g of ['achat', 'loyer', 'abo', 'salaire', 'autreo', 'vente', 'autrei'] as const) expect(indicationReference(g)).toBe('Référence (n° de facture)');
    expect(Object.keys(GENRES).length).toBe(11);
  });
  it('Modifier d’un Apport : l’indication de la Référence est « Référence, facultatif », jamais « N° de facture »', () => {
    const e = preparer({ ...avecGenre(brouillonNeuf('2026-11-20'), 'apport'), cents: 300, nom: 'ZZ TEST — Apport' }, { id: 'TX-AP', maintenant: '2026-11-20T10:00:00Z', transactions: [], tvaInscrit: false });
    StorageService.addTransaction(e.transaction as never);
    render(<EditTransactionModal isOpen transaction={e.transaction as never} onClose={() => undefined} onSave={() => undefined} />);
    const champ = document.querySelector<HTMLInputElement>('[data-modifier-reference]')!;
    expect(champ.placeholder).toBe('Référence, facultatif');
    expect(document.body.textContent).not.toMatch(/N° de facture/);
  });
  it('Modifier d’un Achat garde « n° de facture »', () => {
    const e = preparer({ ...avecGenre(brouillonNeuf('2026-11-20'), 'achat'), cents: 300, nom: 'ZZ TEST — Achat' }, { id: 'TX-AC', maintenant: '2026-11-20T10:00:00Z', transactions: [], tvaInscrit: false });
    StorageService.addTransaction(e.transaction as never);
    render(<EditTransactionModal isOpen transaction={e.transaction as never} onClose={() => undefined} onSave={() => undefined} />);
    expect(document.querySelector<HTMLInputElement>('[data-modifier-reference]')!.placeholder).toMatch(/n° de facture/);
  });
});

describe('Erreurs du serveur : un texte français par code, le message brut reste à la console', () => {
  it('codes connus', () => {
    expect(texteErreurServeur({ code: 'permission-denied', message: 'Missing or insufficient permissions.' })).toMatch(/refuse/);
    expect(texteErreurServeur({ code: 'firestore/permission-denied' })).toBe(texteErreurServeur({ code: 'permission-denied' }));
    expect(texteErreurServeur({ code: 'unavailable' })).toMatch(/injoignable/);
    expect(texteErreurServeur({ code: 'deadline-exceeded' })).toMatch(/à temps/);
    expect(texteErreurServeur({ code: 'unauthenticated' })).toMatch(/connecté/);
  });
  it('autre code ou aucun : « erreur du serveur (code) » ; jamais le message anglais', () => {
    expect(texteErreurServeur({ code: 'internal', message: 'Boom' })).toBe('erreur du serveur (internal)');
    expect(texteErreurServeur(new Error('Missing or insufficient permissions'))).toBe('erreur du serveur (sans code)');
    expect(texteErreurServeur(undefined)).toBe('erreur du serveur (sans code)');
    for (const code of ['permission-denied', 'unavailable', 'deadline-exceeded', 'unauthenticated', 'internal']) expect(texteErreurServeur({ code, message: 'Missing or insufficient permissions' })).not.toMatch(/Missing|insufficient/);
    expect(codeServeur({ code: 'firestore/unavailable' })).toBe('unavailable');
  });
});
