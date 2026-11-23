import { describe, expect, it } from 'vitest';
/**
 * Voie f4-enrichir, P1 et D277 : une valeur remplie n'est jamais une valeur lue ; le patch ne remplit que les trous, avec sa trace ; les niveaux.
 * Pur. Égalité profonde (REVUE-bloquant n° 1) : un objet relu de Firestore ou d'IndexedDB est une copie.
 */
import { niveauxDeFiche, patchDeTrous, porteDonneeLue, valeurLueDe, ficheDeS6, estVide, type FicheEnrichie } from '../../../../src/domain/stock/ficheValeurs';
import type { StockItem } from '../../../../src/types';

const LE = '2026-11-01T10:00:00.000Z';
const base = (more: Partial<StockItem> = {}): StockItem => ({ id: 'A', ref: 'A', name: 'Ambre 60', category: 'Malt', unit: 'kg', currentStock: 5, minStock: 0, reorder: false, ...more }) as StockItem;
const enLigne = { par: 'en-ligne' as const, source: 'Fiche du Banc', url: 'https://banc.test/a', niveau: 'repris' as const };
const lien = { id: 'cle:malt||60 ambre', approchee: false, par: 'en-ligne' as const };
const fiche = (i: StockItem) => i.fiche as unknown as FicheEnrichie;

describe('valeurLueDe et porteDonneeLue (P1)', () => {
  it('une valeur remplie par f4 n’est pas lue ; retouchée par lui, elle redevient la sienne', () => {
    const { patch } = patchDeTrous(base(), { colorEbc: 24 }, enLigne, LE, { lien });
    const rempli = { ...base(), ...patch };
    expect(rempli.colorEbc).toBe(24);
    expect(valeurLueDe(rempli, 'colorEbc')).toBeUndefined();
    expect(porteDonneeLue(rempli)).toBe(false);
    const retouche = { ...rempli, colorEbc: 25 };
    expect(valeurLueDe(retouche, 'colorEbc')).toBe(25);
    expect(porteDonneeLue(retouche)).toBe(true);
  });
  it('égalité profonde : un objet rempli relu en copie (structuredClone) reste « rempli »', () => {
    const faits = [{ id: 'temperature', value: { min: 15, max: 22 }, source: 'Fiche' }];
    const { patch } = patchDeTrous(base({ category: 'Levure' }), { yeastTechnicalFacts: faits }, enLigne, LE, { lien });
    const relu = structuredClone({ ...base({ category: 'Levure' }), ...patch });
    expect(valeurLueDe(relu, 'yeastTechnicalFacts')).toBeUndefined();
  });
  it('le lien d’f4 porte `par` (ficheDeS6 faux) ; le lien de s6 n’en a pas (ficheDeS6 vrai)', () => {
    const { patch } = patchDeTrous(base(), {}, enLigne, LE, { lien, cle: 'malt||60 ambre' });
    expect(ficheDeS6({ ...base(), ...patch })).toBe(false);
    expect(ficheDeS6(base({ fiche: { id: 'munich-malt', approchee: false } }))).toBe(true);
  });
});

describe('patchDeTrous', () => {
  it('trous seulement ; 0 compte vide pour le potentiel ; une valeur lue contraire est un écart, jamais écrite', () => {
    const r = patchDeTrous(base({ colorEbc: 20, potentialPpg: 0 }), { colorEbc: 24, potentialPpg: 33 }, enLigne, LE, { lien });
    expect(r.patch.potentialPpg).toBe(33);
    expect(r.patch.colorEbc).toBeUndefined();
    expect(r.ecarts).toEqual([{ champ: 'colorEbc', lue: 20, trouvee: 24 }]);
    expect(estVide(base({ alphaPct: 0 }), 'alphaPct')).toBe(true);
  });
  it('liste blanche : jamais currentStock, name, unit, category, alphaPct, yeastLot, supplier, origin', () => {
    const r = patchDeTrous(base(), { currentStock: 99, name: 'x', unit: 'g', category: 'Houblon', alphaPct: 12, yeastLot: 'L1', supplier: 's', origin: 'DE' } as any, enLigne, LE, { lien });
    expect(Object.keys(r.patch).filter(k => k !== 'fiche')).toEqual([]);
  });
  it('une fiche s6 existante garde `id` et `approchee` ; f4 n’y ajoute que cle, remplis, aControler, propose', () => {
    const s6 = base({ fiche: { id: 'munich-malt', approchee: true } });
    const r = patchDeTrous(s6, { potentialPpg: 37 }, { ...enLigne, par: 'retenue' }, LE, { lien, cle: 'malt||malz munchner', aControler: true, propose: 'autre-fiche' });
    expect(r.patch.fiche).toMatchObject({ id: 'munich-malt', approchee: true, cle: 'malt||malz munchner', aControler: true, propose: 'autre-fiche' });
    expect(fiche({ ...s6, ...r.patch }).par).toBeUndefined();
    expect(Object.keys(r.patch.fiche!).sort()).toEqual(['aControler', 'approchee', 'cle', 'id', 'propose', 'remplis']);
  });
  it('des valeurs sans fiche ni lien : refus (elles n’auraient pas de trace)', () => {
    expect(() => patchDeTrous(base(), { potentialPpg: 33 }, enLigne, LE)).toThrow();
  });
  it('rien de neuf → aucun patch', () => {
    const { patch } = patchDeTrous(base(), { potentialPpg: 33 }, enLigne, LE, { lien, cle: 'k' });
    const apres = { ...base(), ...patch };
    expect(patchDeTrous(apres, { potentialPpg: 33 }, enLigne, LE, { lien, cle: 'k' }).patch).toEqual({});
  });
});

describe('niveauxDeFiche (D277, T4)', () => {
  it('lu → sûr ; en ligne → repris ; déduit → repris (motif deduit) ; vide → inconnu (à saisir) ; « Vu » après → sûr ; rempli après « Vu » → repris', () => {
    const lu = base({ colorEbc: 20 });
    const { patch } = patchDeTrous(lu, { potentialPpg: 33 }, { ...enLigne, deduit: { potentialPpg: 'PPG ≈ rendement × 46' } }, LE, { lien });
    const item = { ...lu, ...patch };
    const n = niveauxDeFiche(item, 'malt');
    expect(n.colorEbc).toMatchObject({ niveau: 'sur', motif: 'lu' });
    expect(n.potentialPpg).toMatchObject({ niveau: 'repris', motif: 'deduit', source: 'Fiche du Banc', url: 'https://banc.test/a' });
    expect(niveauxDeFiche(base(), 'malt').colorEbc).toMatchObject({ niveau: 'inconnu', motif: 'aSaisir' });
    const vu = { ...item, fiche: { ...fiche(item), vu: '2026-11-02T00:00:00.000Z' } } as unknown as StockItem;
    expect(niveauxDeFiche(vu, 'malt').potentialPpg.niveau).toBe('sur');
    const plusTard = patchDeTrous({ ...vu, colorEbc: undefined }, { colorEbc: 60 }, enLigne, '2026-11-03T00:00:00.000Z', {});
    expect(niveauxDeFiche({ ...vu, colorEbc: undefined, ...plusTard.patch } as StockItem, 'malt').colorEbc.niveau).toBe('repris');
  });
  it('catalogue sûr → sûr ; à contrôler → repris ; houblon sans α → alphaAbsent ; hors catalogue → horsCatalogue', () => {
    const lev = base({ category: 'Levure' });
    const { patch } = patchDeTrous(lev, { yeastLab: 'Lallemand' }, { par: 'catalogue', source: 'Catalogue', niveau: 'sur' }, LE, { lien: { id: 'levure:lalbrew-windsor', approchee: false, par: 'catalogue' } });
    expect(niveauxDeFiche({ ...lev, ...patch }, 'levure').yeastLab).toMatchObject({ niveau: 'sur', motif: 'catalogue' });
    const ctrl = patchDeTrous(lev, { yeastLab: 'Lallemand' }, { par: 'catalogue', source: 'Catalogue', niveau: 'repris' }, LE, { lien: { id: 'levure:lalbrew-windsor', approchee: false, par: 'catalogue' }, aControler: true });
    expect(niveauxDeFiche({ ...lev, ...ctrl.patch }, 'levure').yeastLab).toMatchObject({ niveau: 'repris', motif: 'aControler' });
    const hop = base({ category: 'Houblon', name: 'Houblon du Banc' });
    expect(niveauxDeFiche(hop, 'houblon', { varieteConnue: false })).toMatchObject({ alphaPct: { niveau: 'inconnu', motif: 'alphaAbsent' }, fiche: { niveau: 'inconnu', motif: 'horsCatalogue' } });
  });
});
