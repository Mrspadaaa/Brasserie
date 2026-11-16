import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../src/services/storage';
import type { AppConfig } from '../../src/types';
import { practicalEquipment } from '../../src/domain/brewEquipment';
import { bilanReglages, diagnosticIban, impotParBouteille, piedOnglet, ventilationVente, volumeAvantEbullition } from '../../src/components/reglages/regles';

const IBAN_JUSTE = 'CH93 0076 2011 6238 5295 7';
const IBAN_CLE = 'CH44 0076 2011 6238 4920 1';
const base = (fiscal: Partial<AppConfig['fiscal']> = {}, company: Partial<AppConfig['company']> = {}): AppConfig => ({
  ...structuredClone(defaultConfig),
  fiscal: { ...structuredClone(defaultConfig).fiscal, beerTaxAnnualReductionPct: undefined, beerTaxReductionYear: undefined, beerTaxPeriod: undefined, ...fiscal },
  company: { ...structuredClone(defaultConfig).company, uid: 'CHE-123.456.789', adresse: { rue: 'Rue du Lac', numero: '5', npa: '1700', localite: 'Fribourg', pays: 'CH' }, ...company }
});

describe('bilan des réglages', () => {
  it('trois trous OFDF et une clé d’IBAN fausse : 1 à corriger, 3 à saisir, 4 bons dans la Fiscalité', () => {
    const b = bilanReglages(base({}, { iban: IBAN_CLE }), { ibanEffectif: IBAN_CLE });
    const fiscal = b.points.filter(p => p.onglet === 'fiscal');
    expect([fiscal.filter(p => p.etat === 'ko').length, fiscal.filter(p => p.etat === 'to').length, fiscal.filter(p => p.etat === 'ok').length]).toEqual([1, 3, 4]);
    expect(b.parOnglet.fiscal).toBe('ko');
  });
  it('les segments vont du plus grave au meilleur, un par point mesuré', () => {
    const b = bilanReglages(base({}, { iban: IBAN_CLE }), { ibanEffectif: IBAN_CLE });
    expect(b.segments.length).toBe(b.ko + b.to + b.ok);
    expect(b.segments[0]).toBe('ko');
    expect(b.segments.at(-1)).toBe('ok');
  });
  it('tout renseigné et IBAN juste : plus de trou ni d’erreur dans la Fiscalité', () => {
    const b = bilanReglages(base({ beerTaxAnnualReductionPct: 15, beerTaxReductionYear: 2026, beerTaxPeriod: 'annual' }, { iban: IBAN_JUSTE }), { ibanEffectif: IBAN_JUSTE });
    expect(b.parOnglet.fiscal).toBe('ok');
  });
  it('un IBAN vide est un trou, jamais une erreur ni un bon', () => {
    const b = bilanReglages(base(), { ibanEffectif: '' });
    expect(b.points.find(p => p.id === 'iban')!.etat).toBe('to');
  });
  it('la date de la dernière copie n’est pas suivie : onglet Sauvegardes inconnu, hors des comptes', () => {
    const b = bilanReglages(base(), { ibanEffectif: IBAN_JUSTE });
    expect(b.parOnglet.backup).toBe('na');
    expect(b.segments).not.toContain('na');
  });
  it('Accès : connecté bon, non connecté à saisir, inconnu sans valeur', () => {
    expect(bilanReglages(base(), { compteConnecte: true }).parOnglet.security).toBe('ok');
    expect(bilanReglages(base(), { compteConnecte: false }).parOnglet.security).toBe('to');
    expect(bilanReglages(base()).parOnglet.security).toBe('na');
  });
  it('Brasserie : limite utile non vérifiée = à saisir ; limite supérieure à la cuve = à corriger', () => {
    const c = base();
    c.brewhouses = [{ ...c.brewhouses[0], equipment: { ...practicalEquipment } }];
    c.activeBrewhouseId = c.brewhouses[0].id;
    expect(bilanReglages(c).parOnglet.brewhouse).toBe('to');
    c.brewhouses[0].equipment!.kettleWorkingL = 99;
    expect(bilanReglages(c).parOnglet.brewhouse).toBe('ko');
  });
});

describe('pied « Il reste N trous et N erreurs »', () => {
  it('dit les trous et les erreurs de l’onglet, au pluriel juste', () => {
    const b = bilanReglages(base({}, { iban: IBAN_CLE }), { ibanEffectif: IBAN_CLE });
    expect(piedOnglet(b, 'fiscal', false).texte).toBe('Il reste 3 trous et 1 erreur');
    expect(piedOnglet(b, 'fiscal', false)).toMatchObject({ trous: 3, erreurs: 1 });
  });
  it('rien à dire : Aucune modification, ou Modifications non enregistrées', () => {
    const b = bilanReglages(base({ beerTaxAnnualReductionPct: 15, beerTaxReductionYear: 2026, beerTaxPeriod: 'annual' }, { iban: IBAN_JUSTE }), { ibanEffectif: IBAN_JUSTE });
    expect(piedOnglet(b, 'fiscal', false).texte).toBe('Aucune modification');
    expect(piedOnglet(b, 'fiscal', true).texte).toBe('Modifications non enregistrées');
  });
});

describe('IBAN : l’erreur dite dans sa ligne', () => {
  it('nomme l’étape qui échoue : clé, longueur, format ; vide ou juste : rien', () => {
    expect(diagnosticIban(IBAN_CLE)).toMatchObject({ cause: 'cle', court: 'Clé de contrôle fausse · 21 caractères', cle: [2, 4] });
    expect(diagnosticIban('CH93 0076 2011 6238 5295')?.cause).toBe('longueur');
    expect(diagnosticIban('1234')?.cause).toBe('format');
    expect(diagnosticIban(IBAN_JUSTE)).toBeNull();
    expect(diagnosticIban('')).toBeNull();
  });
});

describe('barres de TVA et impôt', () => {
  it('100 CHF TTC à 8,1 % : 92,51 HT et 7,49 de TVA ; à 2,6 % : 97,47 et 2,53', () => {
    const b = ventilationVente(100, 0.081)!, d = ventilationVente(100, 0.026)!;
    expect([b.ht.toFixed(2), b.tva.toFixed(2)]).toEqual(['92.51', '7.49']);
    expect([d.ht.toFixed(2), d.tva.toFixed(2)]).toEqual(['97.47', '2.53']);
  });
  it('un taux illisible ne donne pas de barre (l’inconnu n’est pas 0)', () => {
    expect(ventilationVente(100, Number.NaN)).toBeNull();
  });
  it('impôt par bouteille de 33 cl : 25,32 CHF/hl donnent 0,084 ; une réduction de 40 % l’abaisse, hors bornes elle est ignorée', () => {
    expect(impotParBouteille(25.32, 33)).toBeCloseTo(0.0836, 4);
    expect(impotParBouteille(25.32, 33, 40)).toBeCloseTo(0.0836 * 0.6, 4);
    expect(impotParBouteille(25.32, 33, 90)).toBeCloseTo(0.0836, 4);
  });
});

describe('volume avant ébullition', () => {
  it('20 L en fermenteur, 1,5 L de pertes, 4 % de rétraction, 3,5 L/h : 25,9 L', () => {
    const bh = { volumeL: 20, deadSpaceL: 1.5, equipment: { ...practicalEquipment, coolingShrinkagePct: 4, boilOffLPerHour: 3.5 } } as never;
    expect(volumeAvantEbullition(bh)).toBeCloseTo(25.9, 1);
  });
  it('sans installation ou rétraction absurde : null, pas 0', () => {
    expect(volumeAvantEbullition({ volumeL: 20, deadSpaceL: 1 } as never)).toBeNull();
    expect(volumeAvantEbullition({ volumeL: 20, deadSpaceL: 1, equipment: { ...practicalEquipment, coolingShrinkagePct: 100 } } as never)).toBeNull();
  });
});
