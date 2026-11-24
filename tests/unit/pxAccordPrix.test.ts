/**
 * Voie prix-houblon2 (24.11, D450) : l'accord entre la lecture de la page et celle de l'IA ne doit ni cacher un vrai désaccord ni en inventer un.
 * Constat au banc (65 liens, Flash-Lite sur la page entière, 24.11) : 17 « douteux » sur 58 lectures, dont 13 étaient le MÊME prix :
 *  - l'IA lit « 60 l » (la capacité d'une cuve) à côté du prix, la page ne dit aucune quantité : ce n'est pas un désaccord ;
 *  - la page publie le prix TTC (3 867,49 €), l'IA lit le HT de la même page (3 249,99 €) : ×1,19 au centime.
 * Les vrais désaccords restent dits : 0,10 CHF sans quantité contre 104,40 CHF le kilo, ou 8 € contre 7,29 € pour 100 g.
 */
import { describe, expect, it } from 'vitest';
import { accordPrix, memePrixAvecTaxe, type Gardee } from '../../functions/src/lienIA';

const g = (prix: number, extra: Partial<Gardee> = {}): Gardee => ({ prix, caracteristiques: [], ...extra });
const page = (p: Record<string, unknown>) => ({ statut: 'lue', luLe: 0, url: 'https://x.ch/a', domaine: 'x.ch', ...p }) as any;

describe('accordPrix : le même prix s\'accorde', () => {
  it('une quantité lue par l\'IA que la page ne dit pas (« 60 l ») ne crée pas de désaccord : même prix', () => {
    expect(accordPrix(page({ prix: 79.95, devise: 'AUD' }), g(79.95, { quantite: { valeur: 60, unite: 'l' } }))).toBe(true);
    expect(accordPrix(page({ prix: 72.5, devise: 'CHF' }), g(72.5, { quantite: { valeur: 1, unite: 'kg' } }))).toBe(true);
  });
  it('un prix HT lu par l\'IA et le TTC publié par la page (×1,19 ; ×1,081 ; ×1,2) sont le même prix', () => {
    expect(accordPrix(page({ prix: 3867.49, devise: 'EUR', taxe: 'ttc' }), g(3249.99))).toBe(true);
    expect(accordPrix(page({ prix: 4096.58, devise: 'CHF', taxe: 'ttc' }), g(3789.62))).toBe(true);
    expect(accordPrix(page({ prix: 207.04, devise: 'GBP', taxe: 'ttc' }), g(172.53))).toBe(true);
    expect(accordPrix(page({ prix: 1339.36, devise: 'CHF', taxe: 'ttc' }), g(1239))).toBe(true);
  });
  it('la TVA se compte aussi dans l\'autre sens (page HT, IA TTC)', () => {
    expect(memePrixAvecTaxe(3867.49, 3249.99)).toBe(true);
    expect(memePrixAvecTaxe(3249.99, 3867.49)).toBe(true);
  });
});

describe('accordPrix : un vrai désaccord reste dit', () => {
  it('8 € lus SANS quantité contre « dès 7,29 € » : désaccord (un nombre nu ne précise rien) ; avec « 100 g » écrits, 8 € précise le « dès » (voir pxPrixDes)', () => {
    expect(accordPrix(page({ prix: 7.29, devise: 'EUR', prixDes: true }), g(8))).toBe(false);
    expect(accordPrix(page({ prix: 7.29, devise: 'EUR', prixDes: true }), g(8, { quantite: { valeur: 100, unite: 'g' } }))).toBe(true);
    expect(accordPrix(page({ prix: 7.29, devise: 'EUR', prixDes: true }), g(5, { quantite: { valeur: 100, unite: 'g' } }))).toBe(false); // plus bas que le « dès » : faux
  });
  it('0,10 CHF (prix au gramme arrondi, sans quantité) contre 104,40 CHF le kilo : désaccord', () => {
    expect(accordPrix(page({ prix: 104.4, devise: 'CHF', conditionnement: { valeur: 1, unite: 'kg' } }), g(0.1))).toBe(false);
  });
  it('quand la page dit sa quantité, un autre prix pour la même quantité est un désaccord (le prix de 250 g lu pour 50 g)', () => {
    const p = page({ prix: 3.72, devise: 'EUR', conditionnement: { valeur: 50, unite: 'g' }, offres: [{ valeur: 50, unite: 'g', prix: 3.72 }, { valeur: 250, unite: 'g', prix: 14.06 }] });
    expect(accordPrix(p, g(14.06, { quantite: { valeur: 250, unite: 'g' } }))).toBe(true); // un conditionnement publié : même page
    expect(accordPrix(p, g(14.06, { quantite: { valeur: 50, unite: 'g' } }))).toBe(false); // 14,06 n'est pas le prix de 50 g
  });
  it('une TVA courante n\'excuse pas un écart qui n\'est pas au centime', () => {
    expect(memePrixAvecTaxe(100, 119.5)).toBe(false);
    expect(memePrixAvecTaxe(79.95, 86.9)).toBe(false);
  });
});
