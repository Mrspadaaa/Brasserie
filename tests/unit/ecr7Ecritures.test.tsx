// @vitest-environment jsdom
/**
 * Voie ecr7 (24.11, tour 45) : E45-1 (la fin d'une récurrente « à payer d'ici » vient de la même règle que ses dates), E45-2 (les Habituels annoncent
 * la prochaine échéance du Calendrier), E45-3 (la Référence d'un salaire n'est pas un n° de facture). Fixtures simulées, aucune donnée réelle.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

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
const { EditTransactionModal } = await import('../../src/components/EditTransactionModal');
const { avecGenre, brouillonNeuf, preparer, indicationReference, habituels, dateDeFin } = await import('../../src/ui/saisie/modele');
const forecast = await import('../../src/domain/finance/forecast');
const { datesDesOccurrences, planOccurrences, decalageDeLEcheance } = forecast;

beforeEach(() => { store.clear(); localStorage.clear(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-24T10:00:00')); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

const J = '2026-11-24';
const ctx = (id: string) => ({ id, maintenant: `${J}T10:00:00.000Z`, transactions: [], tvaInscrit: false });
/** Une écriture saisie le 24.11, « à payer d'ici le 24.12 », qui revient (comme la carte de fin et l'aperçu la voient). */
const apayer = (genre: 'salaire' | 'loyer', rythme: 'monthly' | 'quarterly', fin: '6m' | '1an' | 'sans') =>
  preparer({ ...avecGenre(brouillonNeuf(J), genre), cents: 500, nom: `ZZ TEST — ${genre}`, rythme, fin, reglement: 'apayer', echeance: '2026-12-24' }, ctx(`T-${genre}`));

describe('E45-1 : la fin d’une récurrente « à payer d’ici » = sa dernière occurrence du Calendrier', () => {
  it('Salaire mensuel, 6 mois, dû le 24.12 : 24.12 … 24.05.27, 6 fois (et non 24.04.27, la fin non décalée)', () => {
    const e = apayer('salaire', 'monthly', '6m');
    expect(dateDeFin(J, 'monthly', '6m')).toBe('2027-04-24'); // la borne du plan, non décalée : la règle du Calendrier
    expect(e.plan?.recurrence?.endDate).toBe('2027-04-24');
    const f = forecast.finDesOccurrences(J, 'monthly', e.plan!.recurrence!.endDate, e.transaction.finance!.dueDate);
    expect(f).toEqual({ fin: '2027-05-24', fois: 6 });
  });
  it('Loyer trimestriel, 6 mois, dû le 24.12 : 24.12 · 24.03.27 (la fin ne tombe plus avant la 2e date), 2 fois', () => {
    const e = apayer('loyer', 'quarterly', '6m');
    const f = forecast.finDesOccurrences(J, 'quarterly', e.plan!.recurrence!.endDate, e.transaction.finance!.dueDate);
    expect(datesDesOccurrences(J, 'quarterly', e.plan!.recurrence!.endDate, '2026-12-24', 9)).toEqual(['2026-12-24', '2027-03-24']);
    expect(f).toEqual({ fin: '2027-03-24', fois: 2 });
  });
  it('la fin est la dernière des dates listées, quelle que soit la série ; payée (sans échéance) : la fin du plan ; sans fin : rien', () => {
    for (const [rythme, fin] of [['monthly', '1an'], ['monthly', '6m'], ['quarterly', '1an'], ['quarterly', '6m']] as const) {
      const bord = dateDeFin(J, rythme, fin);
      for (const echeance of ['2026-12-24', undefined]) {
        const toutes = datesDesOccurrences(J, rythme, bord, echeance, 1000);
        expect(forecast.finDesOccurrences(J, rythme, bord, echeance)).toEqual({ fin: toutes[toutes.length - 1], fois: toutes.length });
      }
    }
    expect(forecast.finDesOccurrences(J, 'monthly', '2027-04-24', undefined)).toEqual({ fin: '2027-04-24', fois: 6 });
    expect(forecast.finDesOccurrences(J, 'monthly', undefined, '2026-12-24')).toBeUndefined();
  });
  it('la fin annoncée est une date que le Calendrier montre (planOccurrences décalée)', () => {
    const e = apayer('salaire', 'monthly', '6m');
    const plan = e.plan!;
    const decaler = decalageDeLEcheance(plan, [e.transaction]);
    const duCalendrier = planOccurrences(plan, J, '9999-12-31').map(o => decaler(o.date));
    expect(forecast.finDesOccurrences(J, 'monthly', plan.recurrence!.endDate, e.transaction.finance!.dueDate)!.fin).toBe(duCalendrier[duCalendrier.length - 1]);
  });
});

describe('E45-2 : les Habituels annoncent la prochaine échéance du Calendrier', () => {
  it('Loyer trimestriel saisi le 24.11 à payer d’ici le 24.12 : prochaine échéance 24.03 (Calendrier), jamais 24.02', () => {
    const e = apayer('loyer', 'quarterly', '1an');
    const h = habituels([e.transaction], [e.plan!], J);
    const loyer = h.find(x => x.cle === `plan:${e.plan!.id}`)!;
    expect(loyer.sous).toBe('échéance le 24.03 · à enregistrer');
    expect(loyer.solde).toEqual({ planId: e.plan!.id, occurrenceId: `${e.plan!.id}:2027-02-24`, date: '2027-03-24' });
  });
  it('Salaire mensuel à payer d’ici le 24.12 : prochaine échéance du plan 24.01, dans le même décalage que le Calendrier', () => {
    const e = apayer('salaire', 'monthly', 'sans');
    const h = habituels([e.transaction], [e.plan!], J);
    expect(h.find(x => x.cle === `plan:${e.plan!.id}`)!.sous).toBe('échéance le 24.01 · à enregistrer');
  });
  it('une écriture payée (sans échéance après sa date) garde les dates de la pièce', () => {
    const e = preparer({ ...avecGenre(brouillonNeuf(J), 'loyer'), cents: 40000, nom: 'Loyer', rythme: 'monthly', fin: 'sans' }, ctx('T-L'));
    expect(habituels([e.transaction], [e.plan!], J).find(x => x.cle === `plan:${e.plan!.id}`)!.sous).toBe('échéance le 24.12 · à enregistrer');
  });
});

describe('E45-3 : la Référence d’un salaire n’est pas un n° de facture', () => {
  it('indication de la saisie : « Référence, facultatif » ; achat, vente, charges gardent le n° de facture', () => {
    expect(indicationReference('salaire')).toBe('Référence, facultatif');
    for (const g of ['achat', 'loyer', 'abo', 'autreo', 'vente', 'autrei'] as const) expect(indicationReference(g)).toBe('Référence (n° de facture)');
  });
  it('Modifier d’un Salaire : « Référence, facultatif », court (tient à 390 px), sans « facture »', () => {
    const e = preparer({ ...avecGenre(brouillonNeuf('2026-11-20'), 'salaire'), cents: 500, nom: 'ZZ TEST — Salaire', rythme: 'une' }, { id: 'TX-SAL', maintenant: '2026-11-20T10:00:00Z', transactions: [], tvaInscrit: false });
    StorageService.addTransaction(e.transaction as never);
    render(<EditTransactionModal isOpen transaction={e.transaction as never} onClose={() => undefined} onSave={() => undefined} />);
    const champ = document.querySelector<HTMLInputElement>('[data-modifier-reference]')!;
    expect(champ.placeholder).toBe('Référence, facultatif');
    expect(champ.placeholder.length).toBeLessThanOrEqual(21);
    expect(champ.placeholder).not.toMatch(/facture/i);
  });
});
