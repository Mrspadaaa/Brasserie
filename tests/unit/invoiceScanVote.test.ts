// Voie fn-csv8 (D247) : PARITÉ du module de production `invoiceScanVote.ts` avec le banc (`finalOfStarVote`, `withCodesNormalized`).
// Le banc est l'oracle : les mêmes lectures simulées passent par les deux, le résultat doit être égal champ par champ. Aucun appel réel.
import { describe, expect, it } from 'vitest';
import {
  LITE_MODEL, STRONG_MODEL, finalOfStarVote as bancFinalOfStarVote, finalOfLite as bancFinalOfLite, isoCurrency as bancIsoCurrency, needsThirdLite as bancNeedsThirdLite,
  parseReadResponse, readingFromError, readingFromResponse, withCodesNormalized, type Reading, type ReadMeta
} from '../../scripts/banc-lecture-facture';
import {
  finalOfLite, finalOfStarVote, finalOfTwo, isoCurrency, lireCsv8, needsThird, needsThirdLite, type Csv8Io, type LectureVote
} from '../../functions/src/invoiceScanVote';
import { normalizeInvoiceScan } from '../../functions/src/invoiceScanCore';
import { ScanReadCutError } from '../../functions/src/invoiceVisionReview';
import { corpus, lectureA, lectureB, lectureC } from './depense/rapprochement/aide';

const invoice = (kind = 'stock', extra: Record<string, unknown> = {}) => ({ vendor: 'Fournisseur', currency: 'CHF', date: '09.09.2026', invoiceNumber: 'F-42', amountHT: 100, tvaAmount: 8.1, amountTTC: 108.1, tvaRate: .081,
  items: [{ name: 'Article', kind, quantity: 2, unit: 'pièce', price: 54.05, amountTTC: 108.1 }], ...extra });
const answer = (data: any, finishReason = 'STOP') => ({ candidates: [{ finishReason, content: { parts: [{ text: JSON.stringify(data) }] } }], usageMetadata: { promptTokenCount: 2000, candidatesTokenCount: 800, thoughtsTokenCount: 0, totalTokenCount: 2800 } });
const meta = (lecture: 1 | 2 | 3): ReadMeta => ({ id: `Csv8${lecture}`, doc: 'tdoc', tirage: 1, variant: 'Csv8', lecture, model: lecture === 3 ? STRONG_MODEL : LITE_MODEL });

/** Une lecture simulée : des données, une coupure, ou un refus. Le banc la lit avec N (`withCodesNormalized`), comme il lit Csv8 + N. */
type Sim = { data: any } | { cut: true } | { refused: true };
const bancRead = (lecture: 1 | 2 | 3, sim: Sim): Reading => withCodesNormalized('data' in sim ? readingFromResponse(meta(lecture), answer(sim.data), 1000, 1000)
  : 'cut' in sim ? readingFromResponse(meta(lecture), answer(invoice(), 'MAX_TOKENS'), 1000, 1000)
  : readingFromError(meta(lecture), Object.assign(new Error('refus'), { httpStatus: 503 }), 500, 0));
/** La même lecture pour la production : `normalized` (N comprise, via le même parsing que `ai.ts`) et sa cause. */
const prodRead = (sim: Sim): LectureVote => {
  if ('data' in sim) { const decoded = JSON.parse(JSON.stringify(sim.data)); decoded.currency = isoCurrency(decoded.currency); return { normalized: normalizeInvoiceScan(decoded), cause: null }; }
  return { cause: 'cut' in sim ? 'sortie' : null };
};

/** Rejoue un cas sur le banc et sur le module ; retourne les deux finales. */
function rejouer(l1: Sim, l2: Sim, l3?: Sim) {
  const b1 = bancRead(1, l1), b2 = bancRead(2, l2), b3 = l3 ? bancRead(3, l3) : undefined;
  const needs = bancNeedsThirdLite(b1, b2);
  const banc = bancFinalOfStarVote(b1, b2, needs ? b3 : undefined);
  const p1 = prodRead(l1), p2 = prodRead(l2), p3 = l3 ? prodRead(l3) : undefined;
  const prod = finalOfStarVote(p1, p2, needsThirdLite(p1, p2) ? p3 : undefined);
  return { banc, prod, needsBanc: needs, needsProd: needsThirdLite(p1, p2) };
}
const égal = (l1: Sim, l2: Sim, l3?: Sim) => {
  const { banc, prod, needsBanc, needsProd } = rejouer(l1, l2, l3);
  expect(needsProd).toBe(needsBanc);
  expect(prod.result).toEqual(banc.result);
  // Le motif écrit diffère (le banc cite la production, qui lève l'erreur de la première lecture) ; ce qui compte : une finale ou pas.
  expect(Boolean(prod.failure)).toBe(Boolean(banc.failure));
  expect(prod.used).toHaveLength(banc.used.length);
  return { banc, prod };
};

describe('parité module / banc — les cas de la voie', () => {
  const d = (data: any): Sim => ({ data });
  const cas: Array<[string, Sim, Sim, Sim | undefined]> = [
    ['deux Flash-Lite d\'accord : aucune 3.8', d(invoice()), d(invoice()), d(invoice())],
    ['désaccord, la 3.8 donne une majorité', d(invoice('equipment')), d(invoice('maintenance')), d(invoice('maintenance'))],
    ['désaccord à trois valeurs : la 3.8 tranche seule, statut disputed', d(invoice('equipment')), d(invoice('maintenance')), d(invoice('service'))],
    ['désaccord sur le total : trois valeurs', d(invoice()), d({ ...invoice(), amountTTC: 118.1 }), d({ ...invoice(), amountTTC: 128.1 })],
    ['une Flash-Lite coupée, la 3.8 lit : vote à deux', d(invoice()), { cut: true }, d(invoice())],
    ['la première Flash-Lite coupée, la 3.8 lit', { cut: true }, d(invoice('equipment')), d(invoice('equipment'))],
    ['une Flash-Lite refusée (503), la 3.8 lit', d(invoice()), { refused: true }, d(invoice())],
    ['une Flash-Lite coupée, la 3.8 contredit (statut du vote à deux)', d(invoice('equipment')), { cut: true }, d(invoice('maintenance'))],
    ['les deux Flash-Lite coupées : la 3.8 seule', { cut: true }, { cut: true }, d(invoice())],
    ['les deux Flash-Lite refusées : la 3.8 seule, sans cause de coupure', { refused: true }, { refused: true }, d(invoice())],
    ['une coupée et une refusée : la 3.8 seule', { cut: true }, { refused: true }, d(invoice())],
    ['une Flash-Lite coupée et la 3.8 coupée : une lecture, coupure dite', d(invoice()), { cut: true }, { cut: true }],
    ['une Flash-Lite lisible et la 3.8 refusée', d(invoice()), { refused: true }, { refused: true }],
    ['désaccord et la 3.8 coupée : divergences explicites', d(invoice('equipment')), d(invoice('maintenance')), { cut: true }],
    ['désaccord et la 3.8 refusée', d(invoice('equipment')), d(invoice('maintenance')), { refused: true }],
    ['désaccord et la 3.8 sautée (délai global) : delai-saute', d(invoice('equipment')), d(invoice('maintenance')), undefined],
    ['une Flash-Lite coupée et la 3.8 sautée', d(invoice()), { cut: true }, undefined],
    ['rien de lisible : aucune finale', { cut: true }, { cut: true }, { cut: true }],
    ['« Fr. » et « SFr. » : N, même devise, pas de 3.8', d({ ...invoice(), currency: 'Fr.' }), d({ ...invoice(), currency: 'SFr.' }), d(invoice())],
    ['« Fr. » et « CHF » : N, pas de 3.8', d({ ...invoice(), currency: 'Fr.' }), d(invoice()), d(invoice())],
    ['devise étrangère à l\'identique', d({ ...invoice(), currency: 'EUR' }), d({ ...invoice(), currency: 'EUR' }), d(invoice())],
    ['devise « CHF. » de la 3.8 après un désaccord', d(invoice('equipment')), d(invoice('maintenance')), d({ ...invoice('maintenance'), currency: 'CHF.' })],
    ['désaccord sur l\'unité et le nom de ligne', d(invoice()), d({ ...invoice(), items: [{ name: 'Autre article', kind: 'stock', quantity: 2, unit: 'kg', price: 54.05, amountTTC: 108.1 }] }), d(invoice())]
  ];
  for (const [name, l1, l2, l3] of cas) {
    it(name, () => {
      const { banc } = égal(l1, l2, l3);
      // Un cas sans aucune lecture exploitable n'a pas de finale : le banc le dit en `failure`, la production lève l'erreur de la première lecture.
      if (name.startsWith('rien de lisible')) { expect(banc.result).toBeNull(); expect(banc.failure).toContain('aucune lecture exploitable'); }
    });
  }
  it('le banc et le module disent la même chose du nombre de lectures utilisées (2 ou 3) et de la 3.8 appelée', () => {
    expect(rejouer({ data: invoice() }, { data: invoice() }, { data: invoice() }).prod.used).toHaveLength(2);
    expect(rejouer({ data: invoice() }, { cut: true }, { data: invoice() }).prod.used).toHaveLength(3);
    expect(rejouer({ data: invoice('equipment') }, { data: invoice('maintenance') }, { data: invoice('maintenance') }).prod.used).toHaveLength(3);
  });
});

describe('parité module / banc — le corpus de 20 paires du rapprochement, avec la 3.8 qui relit la lecture A', () => {
  for (const [name, a, b] of corpus()) {
    it(name, () => { égal({ data: a }, { data: b }, { data: lectureA() }); });
  }
  it('trois lectures de 372765 qui divergent (A, B, C)', () => { égal({ data: lectureA() }, { data: lectureB() }, { data: lectureC() }); });
  it('B et A, la 3.8 lit C ; A coupée', () => {
    égal({ data: lectureB() }, { data: lectureA() }, { data: lectureC() });
    égal({ cut: true }, { data: lectureA() }, { data: lectureC() });
  });
});

describe('parité module / banc — le repli finalOfLite et N', () => {
  it('finalOfLite : une Flash-Lite lisible et la 3.8 votent à deux', () => {
    const b = bancFinalOfLite(bancRead(1, { data: invoice() }), bancRead(2, { cut: true }), bancRead(3, { data: invoice() }));
    const p = finalOfLite(prodRead({ data: invoice() }), prodRead({ cut: true }), prodRead({ data: invoice() }));
    expect(p.result).toEqual(b.result);
  });
  it('isoCurrency : la même table que le banc', () => {
    for (const value of ['Fr.', 'fr', 'SFr.', 's fr', 'CHF', 'chf.', ' CHF ', 'EUR', 'USD', '€', '', 'Franc', 'Fr.s', null, undefined, 3, {}])
      expect(isoCurrency(value)).toEqual(bancIsoCurrency(value));
    expect(isoCurrency('Fr.')).toBe('CHF');
    expect(isoCurrency('EUR')).toBe('EUR');
    expect(isoCurrency(undefined)).toBeUndefined();
  });
  it('N sur la réponse brute : le parsing du banc (codes) donne la devise du module', () => {
    for (const currency of ['Fr.', 'SFr.', 'CHF.', 'EUR'])
      expect(parseReadResponse(answer({ ...invoice(), currency }), true).currency).toBe(isoCurrency(currency));
  });
});

describe('le module est pur et ne dépend pas du banc', () => {
  it('finalOfTwo : sans lecture exploitable, pas de finale ; une lecture, unavailable', () => {
    expect(finalOfTwo({ cause: null }, { cause: 'sortie' }).result).toBeNull();
    const single = finalOfTwo(prodRead({ data: invoice() }), { cause: 'sortie' });
    expect(single.result.review).toMatchObject({ status: 'unavailable', readers: 1 });
  });
  it('needsThird / needsThirdLite : lecture manquante → vrai ; deux lectures d\'accord → faux', () => {
    const ok = prodRead({ data: invoice() });
    expect(needsThird(ok, ok)).toBe(false);
    expect(needsThirdLite(ok, ok)).toBe(false);
    expect(needsThird(ok, { cause: null })).toBe(false);
    expect(needsThirdLite(ok, { cause: null })).toBe(true);
    expect(needsThirdLite(prodRead({ data: invoice('equipment') }), prodRead({ data: invoice('maintenance') }))).toBe(true);
  });
});

describe('lireCsv8 — l\'ordre des appels', () => {
  const lecture = (sim: Sim) => async () => { const read = prodRead(sim); if (!read.normalized) throw read.cause === 'sortie' ? new ScanReadCutError('MAX_TOKENS') : new Error('refus'); return read.normalized; };
  const io = (l1: Sim, l2: Sim, l3: Sim | 'jamais', over: Partial<Csv8Io> = {}) => {
    const calls: string[] = [];
    const wrapped: Csv8Io = {
      readLite: n => { calls.push(`lite${n}`); return lecture(n === 1 ? l1 : l2)(); },
      readStrong: () => { calls.push('3.8'); return l3 === 'jamais' ? Promise.reject(new Error('3.8 imprévue')) : lecture(l3)(); },
      causeOf: reason => (reason instanceof ScanReadCutError ? 'sortie' : null),
      deadlineReached: () => false, ...over
    };
    return { calls, wrapped };
  };
  it('deux lectures d\'accord : la 3.8 n\'est jamais appelée', async () => {
    const { calls, wrapped } = io({ data: invoice() }, { data: invoice() }, 'jamais');
    expect((await lireCsv8(wrapped)).review).toMatchObject({ status: 'checked', readers: 2 });
    expect(calls).toEqual(['lite1', 'lite2']);
  });
  it('désaccord ou lecture manquante : la 3.8 est appelée, une fois', async () => {
    for (const [l1, l2] of [[{ data: invoice('equipment') }, { data: invoice('maintenance') }], [{ data: invoice() }, { cut: true }], [{ cut: true }, { cut: true }]] as Array<[Sim, Sim]>) {
      const { calls, wrapped } = io(l1, l2, { data: invoice() });
      await lireCsv8(wrapped);
      expect(calls).toEqual(['lite1', 'lite2', '3.8']);
    }
  });
  it('délai global atteint : la 3.8 est sautée, « delai-saute » dit', async () => {
    const { calls, wrapped } = io({ data: invoice('equipment') }, { data: invoice('maintenance') }, 'jamais', { deadlineReached: () => true });
    const result = await lireCsv8(wrapped);
    expect(calls).toEqual(['lite1', 'lite2']);
    expect(result.points.find((p: any) => p.code === 'lecture-coupee')).toMatchObject({ luTexte: 'delai-saute' });
  });
  it('rien de lisible : l\'erreur de la première Flash-Lite remonte', async () => {
    const { wrapped } = io({ cut: true }, { refused: true }, { refused: true });
    await expect(lireCsv8(wrapped)).rejects.toThrow('Lecture incomplète');
  });
});
