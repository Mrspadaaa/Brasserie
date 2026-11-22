// D272b (01.11, nuit) : sur sa commande, les deux Flash-Lite oublient la ligne de port (16 lignes), la 3.8 la lit (17 lignes, somme juste).
// C★v8 garde les VALEURS de la 3.8 mais reprenait les phrases du vote à trois, dont « La somme des lignes ne correspond pas au total TTC.
// Écart 29,99 CHF » calculée sur le mélange des lectures. Tant qu'une Flash-Lite prenait le sous-total pour le HT (D272), ce HT « réconciliait »
// la somme et masquait la phrase. Les contrôles de calcul du vote ne s'affichent pas : seuls ceux de la 3.8, dont on garde les valeurs.
import { describe, expect, it } from 'vitest';
import { finalOfStarVote, needsThird } from '../../../../functions/src/invoiceScanVote';
import { finalOfStarVote as finalDuBanc } from '../../../../scripts/banc-lecture-facture';
import { items, lecture, lire, sommeLignes } from './piece';

const sansPort = items().slice(0, -1);
const ttc = lecture().amountTTC;
const r1 = { normalized: lire(lecture({ amountTTC: ttc, amountHT: null }, sansPort)), cause: null };
const r2 = { normalized: lire(lecture({ amountTTC: ttc, amountHT: sommeLignes(sansPort) }, sansPort)), cause: null };
const troisieme = { normalized: lire(lecture()), cause: null };
const parle = (phrases: string[]) => phrases.filter(p => /somme des lignes/i.test(p));

describe('D272b — les phrases de calcul du vote ne contredisent pas la 3.8 qui tranche', () => {
  it('les deux Flash-Lite sans port divergent : la 3.8 est appelée', () => {
    expect(needsThird(r1, r2)).toBe(true);
  });

  it('la 3.8 tranche : ni phrase ni constat d’écart de somme, la somme de la 3.8 est juste', () => {
    const final = finalOfStarVote(r1, r2, troisieme).result;
    expect(final.items).toHaveLength(items().length);
    expect(final.controls.sum.statut).toBe('ok');
    expect(parle(final.issues)).toEqual([]);
    expect(parle(final.review.findings)).toEqual([]);
  });

  it('les désaccords du vote restent (statut et points)', () => {
    const final = finalOfStarVote(r1, r2, troisieme).result;
    expect(final.review.status).toBe('disputed');
    expect(final.points.some((p: any) => p.source === 'désaccord')).toBe(true);
  });

  it('un contrôle de la 3.8 sur ses propres valeurs reste dit (un HT faux à 50)', () => {
    const sienne = lire(lecture({ amountHT: 50 }));
    expect(sienne.issues.length).toBeGreaterThan(0);
    const final = finalOfStarVote(r1, r2, { normalized: sienne, cause: null }).result;
    expect(final.issues).toEqual(expect.arrayContaining(sienne.issues));
  });

  it('le banc compose de même (parité)', () => {
    const auBanc = (read: object, lecture: number) => ({ ...read, meta: { lecture }, ms: 0, costMicroChf: 0 }) as any;
    const banc = finalDuBanc(auBanc(r1, 1), auBanc(r2, 2), auBanc(troisieme, 3)).result;
    expect(parle(banc.issues)).toEqual([]);
    expect(parle(banc.review.findings)).toEqual([]);
  });
});
