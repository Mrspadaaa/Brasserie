import { describe, expect, it } from 'vitest';
import { dansJours, duree, etiquettesAxe, fenetreInitiale, finFenetre, glisser, jourMaxi, lirePlage, periodeSurJours, plageDuMois, pousser, titreJours } from '../../src/ui/finance/operations/plage';
import type { Transaction } from '../../src/types';

const tx = (id: string, date: string, cents: number): Transaction => ({
  id, date, description: id, amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0, category: 'brassage', subcategory: '',
} as unknown as Transaction);

describe('plage du jour au jour (s2ap2)', () => {
  it('le filtre inclut ses deux bornes et rien d\'autre', () => {
    expect(dansJours('2026-11-01', '2026-11-01', '2026-11-15')).toBe(true);
    expect(dansJours('2026-11-15', '2026-11-01', '2026-11-15')).toBe(true);
    expect(dansJours('2026-11-16', '2026-11-01', '2026-11-15')).toBe(false);
    expect(dansJours('2026-10-31', '2026-11-01', '2026-11-15')).toBe(false);
    expect(dansJours('', '2026-11-01', '2026-11-15')).toBe(false);
    expect(dansJours('', null, null)).toBe(true);
  });

  it('une plage à cheval sur deux mois : 15 oct. → 10 nov., 27 jours, fenêtre de 30 jours dès le 15 oct.', () => {
    const p = { du: '2026-10-15', au: '2026-11-10' };
    expect(duree(p)).toBe(27);
    expect(dansJours('2026-10-31', p.du, p.au)).toBe(true);
    expect(dansJours('2026-11-11', p.du, p.au)).toBe(false);
    expect(titreJours(p, '2026-11-14')).toBe('15 oct. → 10 nov.');
    const f = fenetreInitiale(p, '2026-11');
    expect(f).toEqual({ debut: '2026-10-15', nb: 30 });
    expect(finFenetre(f)).toBe('2026-11-13');
  });

  it('‹ › glissent la plage de sa durée', () => {
    const p = { du: '2026-11-01', au: '2026-11-15' };
    expect(glisser(p, -1, '2000-01-01', '2027-11-14')).toEqual({ du: '2026-10-17', au: '2026-10-31' });
    expect(glisser(p, 1, '2000-01-01', '2027-11-14')).toEqual({ du: '2026-11-16', au: '2026-11-30' });
    expect(glisser({ du: '2026-10-15', au: '2026-11-10' }, -1, '2000-01-01', '2027-11-14')).toEqual({ du: '2026-09-18', au: '2026-10-14' });
    expect(glisser({ du: '2000-01-02', au: '2000-01-11' }, -1, '2000-01-01', '2027-11-14')).toEqual({ du: '2000-01-01', au: '2000-01-10' });
    expect(jourMaxi('2026-11-14')).toBe('2027-11-15');
  });

  it('un ancien état AAAA-MM se lit du 1er au dernier jour ; un état invalide ne se lit pas', () => {
    expect(lirePlage('2026-06', '2026-09')).toEqual({ du: '2026-06-01', au: '2026-09-30' });
    expect(lirePlage('2026-02', '2026-02')).toEqual({ du: '2026-02-01', au: '2026-02-28' });
    expect(lirePlage('2026-11-03', '2026-11-09')).toEqual({ du: '2026-11-03', au: '2026-11-09' });
    expect(lirePlage('2026-11-09', '2026-11-03')).toEqual({ du: '2026-11-09', au: '2026-11-09' });
    expect(lirePlage('', '')).toBeNull();
    expect(lirePlage('2026-13', '2026-12')).toBeNull();
    expect(plageDuMois('2026-11')).toEqual({ du: '2026-11-01', au: '2026-11-30' });
  });

  it('la poussée contre le bord glisse la fenêtre sans laisser la plage dehors', () => {
    const f = { debut: '2026-11-01', nb: 30 };
    expect(pousser(f, { du: '2026-11-01', au: '2026-11-15' }, -1)).toEqual({ debut: '2026-10-31', nb: 30 });
    // la fin de la plage dépasserait la fenêtre : elle s'allonge
    expect(pousser(f, { du: '2026-11-01', au: '2026-11-30' }, -1)).toEqual({ debut: '2026-10-31', nb: 31 });
  });

  it('les piles d\'une plage ne comptent que ses jours (mois d\'extrémité compris), pas le mois entier', () => {
    const transactions = [tx('a', '2026-11-03', 10000), tx('b', '2026-11-15', 2000), tx('c', '2026-11-16', 5000), tx('d', '2026-10-20', 7000)];
    const total = (du: string, au: string) => periodeSurJours({ transactions, payments: [], du, au, aujourdhui: '2026-11-14' }).depenseCents;
    expect(total('2026-11-01', '2026-11-15')).toBe(12000);
    expect(total('2026-11-15', '2026-11-16')).toBe(7000);
    expect(total('2026-10-15', '2026-11-10')).toBe(17000);
  });

  it('les étiquettes de l’axe ne se chevauchent pas : « 29 oct. » collé à gauche chasse le « 1er nov. » (capture du 14.11)', () => {
    const plage = { du: '2026-10-29', au: '2026-11-14' }, f = fenetreInitiale(plage, '2026-11');
    const e = etiquettesAxe(f, plage, '2026-11-14');
    expect(e.some(x => x.genre === 'poignee' && x.texte.startsWith('29 oct'))).toBe(true);
    expect(e.some(x => x.genre === 'mois')).toBe(false);
    const mois = etiquettesAxe(fenetreInitiale(null, '2026-11'), plageDuMois('2026-11'), '2026-11-14');
    expect(mois.map(x => x.genre)).toContain('auj');
  });
});
