/**
 * Voie qr-app : ce que dit le sceau (z2, D246), état par état. Fonctions pures (`qrVue.ts`) ; charges d'après les exemples publics des Guidelines.
 * Les montants fictifs de la maquette : le QR dit 110,40 ; la lecture dit 110,40 (confirme) ou 110,04 (contredit).
 */
import { describe, expect, it } from 'vitest';
import { confronterQr, parseSwissQr, type LectureQr } from '../../../../src/services/qrFacture';
import { ecartMarque, ibanLisible, referenceLisible, resumeQr, vueQr } from '../../../../src/ui/depense/qrVue';
import type { ResultatQr } from '../../../../src/services/qrLecture';
import { charge, QR_IBAN, QRR } from './aide';

const S1 = '//S1/10/F-1001/11/261012/32/8.1/40/0:30';
const lecture = (o: Partial<LectureQr> = {}): LectureQr => ({ vendor: 'Malterie Fictive SA', date: '12.10.2026', currency: 'CHF', invoiceNumber: 'F-1001', amountTTC: 110.4, ...o });
const lu = (o = {}): ResultatQr => ({ statut: 'lu', qr: parseSwissQr(charge({ creancier: ['S', 'Malterie Fictive SA', 'Route de la Malterie', '1', '1000', 'Lausanne', 'CH'], debiteur: ['', '', '', '', '', '', ''], montant: '110.40', s1: S1, ...o }))!, ms: 480 });
const vue = (r: ResultatQr | null, l: LectureQr | null = lecture()) => vueQr(r, r?.statut === 'lu' && l ? confronterQr(r.qr, l) : null, l);

describe('les six états de z2', () => {
  it('confirme : « QR ✓ », quatre coches, IBAN et référence à copier', () => {
    const v = vue(lu())!;
    expect(v).toMatchObject({ etat: 'ok', verdict: 'QR ✓', duel: null, contredit: false, photographier: false });
    expect(v.lignes.filter(l => l.statut === 'ok').map(l => l.cle)).toEqual(['montant', 'facture', 'date', 'creancier']);
    expect(v.lignes.find(l => l.cle === 'montant')).toMatchObject({ valeur: '110,40 CHF', note: '= lu' });
    expect(v.lignes.find(l => l.cle === 'iban')).toMatchObject({ copier: QR_IBAN });
    expect(v.lignes.find(l => l.cle === 'reference')).toMatchObject({ copier: QRR, valeur: '21 00000 00003 13947 14300 09017' });
    expect(v.lignes.find(l => l.cle === 'conditions')?.valeur).toBe('30 jours');
  });
  it('contredit : le verdict est le montant du QR, le duel dit la colonne fautive, rien n’est remplacé', () => {
    const v = vue(lu(), lecture({ amountTTC: 110.04 }))!;
    expect(v).toMatchObject({ etat: 'diff', verdict: '110,40', contredit: true });
    expect(v.duel).toEqual({ lu: '110,04', qr: '110,40', luNombre: 110.04, qrNombre: 110.4, prefixe: '110,', resteLu: '04', resteQr: '40' });
    expect(v.lignes.find(l => l.cle === 'montant')).toMatchObject({ statut: 'ko', valeur: '110,40 CHF', note: 'lu 110,04' });
  });
  it('partiel : un bulletin sans montant, « pas dans le QR » avec la valeur lue à côté, rien coché que devise et créancier', () => {
    const v = vue(lu({ montant: '', s1: '' }))!;
    expect(v).toMatchObject({ etat: 'partiel', verdict: 'partiel', duel: null });
    expect(v.lignes.find(l => l.cle === 'montant')).toMatchObject({ statut: 'abs', valeur: 'pas dans le QR', note: 'lu 110,40' });
    expect(v.lignes.find(l => l.cle === 'facture')).toMatchObject({ statut: 'abs', note: 'lu F-1001' });
    expect(v.lignes.find(l => l.cle === 'date')).toMatchObject({ statut: 'abs', note: 'lu 12.10.2026' });
    expect(v.lignes.filter(l => l.statut === 'ok').map(l => l.cle)).toEqual(['devise', 'creancier']);
  });
  it('illisible : rien décodé, la lecture de la page seulement comme aide, et un geste : photographier', () => {
    const v = vue({ statut: 'illisible' })!;
    expect(v).toMatchObject({ etat: 'off', verdict: 'illisible', photographier: true, duel: null });
    expect(v.lignes.map(l => l.statut)).toEqual(['vide', 'vide', 'vide', 'vide']);
    expect(v.lignes.find(l => l.cle === 'montant')?.valeur).toBe('lu 110,40 · à vérifier sur la page');
    expect(v.lignes.some(l => l.cle === 'iban' || l.cle === 'reference')).toBe(false);
  });
  it('sans : un cercle vide « sans QR », sans verdict ni feuille', () => {
    expect(vue({ statut: 'sans' })).toMatchObject({ etat: 'sans', verdict: '', lignes: [], photographier: false });
  });
  it('lecture : le QR est lu, la facture pas encore : « lecture… », « lu en 0,5 s », les lignes en cours', () => {
    const v = vue(lu(), null)!;
    expect(v).toMatchObject({ etat: 'wait', verdict: 'lecture…' });
    expect(v.lignes.find(l => l.cle === 'montant')).toMatchObject({ valeur: '110,40 CHF', note: 'lu en 0,5 s' });
    expect(v.lignes.find(l => l.cle === 'lignes')?.valeur).toBe('lecture en cours…');
  });
  it('le QR court encore : le sceau attend, sans feuille', () => {
    expect(vueQr(null, null, null)).toMatchObject({ etat: 'wait', verdict: 'lecture…', lignes: [] });
  });
});

describe('le choix devant le duel (z2)', () => {
  const duel = (choix: 'lu' | 'qr' | null) => vueQr(lu(), confronterQr((lu() as Extract<ResultatQr, { statut: 'lu' }>).qr, lecture({ amountTTC: 110.04 })), lecture({ amountTTC: 110.04 }), choix)!;
  it('prendre le QR : le sceau redit « QR ✓ », la ligne du montant dit « pris », le duel et la chip restent (réglés)', () => {
    expect(duel('qr')).toMatchObject({ etat: 'ok', verdict: 'QR ✓', contredit: true });
    expect(duel('qr').lignes.find(l => l.cle === 'montant')).toMatchObject({ statut: 'ok', note: 'pris' });
  });
  it('garder la page : « lu gardé », le montant du QR reste dit en écart (« lu 110,04 gardé »)', () => {
    expect(duel('lu')).toMatchObject({ etat: 'diff', verdict: 'lu gardé' });
    expect(duel('lu').lignes.find(l => l.cle === 'montant')).toMatchObject({ statut: 'ko', note: 'lu 110,04 gardé' });
  });
  it('sans choix : le montant du QR en verdict', () => {
    expect(duel(null)).toMatchObject({ etat: 'diff', verdict: '110,40' });
  });
});

describe('un champ en écart (date) se tranche par un choix, pas autrement', () => {
  const l = lecture({ date: '13.10.2026' });
  const ecart = (champs: Parameters<typeof vueQr>[4] = { champs: {}, factureVue: false }) => vueQr(lu(), confronterQr((lu() as Extract<ResultatQr, { statut: 'lu' }>).qr, l), l, null, champs)!;
  it('sans choix : « écart », la date lue et celle du QR sont proposées telles qu’elles s’écriraient', () => {
    expect(ecart()).toMatchObject({ etat: 'diff', verdict: 'écart', champs: { date: { lu: '13.10.2026', qr: '12.10.2026' } } });
  });
  it('rien d’autre ne tranche : la rangée « Facture » ouverte ne tranche pas la date', () => {
    expect(ecart({ champs: {}, factureVue: true })).toMatchObject({ etat: 'diff', verdict: 'écart' });
  });
  it('prendre le QR : « QR ✓ » et la rangée dit « pris » ; garder : « lu gardé »', () => {
    const pris = ecart({ champs: { date: 'qr' }, factureVue: false });
    expect(pris).toMatchObject({ etat: 'ok', verdict: 'QR ✓' });
    expect(pris.lignes.find(x => x.cle === 'date')).toMatchObject({ statut: 'ok', note: 'pris' });
    expect(ecart({ champs: { date: 'lu' }, factureVue: false })).toMatchObject({ etat: 'diff', verdict: 'lu gardé' });
  });
  it('un numéro de facture en écart non ouvert empêche de dire « tranché » ; ouvert, il ne compte plus', () => {
    const f = lecture({ date: '13.10.2026', invoiceNumber: 'F-9999' });
    const v = (fv: boolean) => vueQr(lu(), confronterQr((lu() as Extract<ResultatQr, { statut: 'lu' }>).qr, f), f, null, { champs: { date: 'qr' }, factureVue: fv })!;
    expect(v(false)).toMatchObject({ etat: 'diff', verdict: 'écart' });
    expect(v(true)).toMatchObject({ etat: 'ok', verdict: 'QR ✓' });
  });
});

describe('« sans QR » n’est pas « pas vérifié »', () => {
  it('non vérifié (hors ligne, erreur) : aucun sceau, aucun cercle', () => {
    expect(vueQr({ statut: 'non-verifie', motif: 'hors ligne' }, null, lecture())).toBeNull();
  });
  it('sans QR : un cercle dit l’absence ; non vérifié : rien ne dit ni oui ni non', () => {
    expect(vue({ statut: 'sans' })).not.toBeNull();
    expect(vueQr({ statut: 'non-verifie', motif: 'x' }, null, null)).toBeNull();
  });
});

describe('ce que le QR ne confirme pas', () => {
  it('un QR non conforme (IBAN faux) ne confirme rien : « invalide », ses problèmes, aucun IBAN à copier', () => {
    const v = vue(lu({ iban: 'CH0000000000000000000' }))!;
    expect(v).toMatchObject({ etat: 'off', verdict: 'invalide', photographier: true });
    expect(v.lignes.some(l => l.cle === 'iban' || l.cle === 'montant')).toBe(false);
    expect(v.lignes.some(l => l.cle === 'probleme' && /IBAN/.test(l.valeur))).toBe(true);
  });
  it('un autre champ contredit (date) : ambre, mais pas de duel de total', () => {
    const v = vue(lu(), lecture({ date: '13.10.2026' }))!;
    expect(v).toMatchObject({ etat: 'diff', verdict: 'écart', duel: null, contredit: false });
    expect(v.lignes.find(l => l.cle === 'date')).toMatchObject({ statut: 'ko', note: 'lu 13.10.2026' });
  });
  it('une devise contredite : pas de duel (110,04 EUR n’est pas 110,04 CHF)', () => {
    const v = vue(lu(), lecture({ amountTTC: 110.4, currency: 'EUR' }))!;
    expect(v.duel).toBeNull();
    expect(v.verdict).toBe('devise');
  });
  it('le montant du QR sans montant lu : « non lu », jamais 0', () => {
    const v = vue(lu(), lecture({ amountTTC: null as never }))!;
    expect(v.etat).toBe('partiel');
    expect(v.lignes.find(l => l.cle === 'montant')).toMatchObject({ statut: 'vide', note: 'non lu', valeur: '110,40 CHF' });
  });
});

describe('les écritures', () => {
  it('le début commun puis la fin qui diffère', () => {
    expect(ecartMarque('110,04', '110,40')).toEqual({ prefixe: '110,', resteA: '04', resteB: '40' });
    expect(ecartMarque('99,00', '110,40')).toEqual({ prefixe: '', resteA: '99,00', resteB: '110,40' });
  });
  it('l’IBAN par groupes de quatre, la référence QRR par groupes de cinq depuis la droite, la SCOR par quatre', () => {
    expect(ibanLisible(QR_IBAN)).toBe('CH44 3199 9123 0008 8901 2');
    expect(referenceLisible('QRR', QRR)).toBe('21 00000 00003 13947 14300 09017');
    expect(referenceLisible('SCOR', 'RF18539007547034')).toBe('RF18 5390 0754 7034');
  });
  it('la feuille met l’IBAN sur deux lignes (quatre groupes, puis le reste)', () => {
    expect(vue(lu())!.lignes.find(l => l.cle === 'iban')?.valeur).toBe('CH44 3199 9123 0008\n8901 2');
  });
});

describe('resumeQr : la ligne du bloc « Lecture et vérification… »', () => {
  it('dit le montant, la date et le créancier du QR, rien d’autre', () => {
    expect(resumeQr(lu())).toBe('QR : 110,40 CHF · 12.10.2026 · Malterie Fictive SA');
  });
  it('un bulletin sans montant ni S1 : seulement le créancier ; jamais un 0', () => {
    expect(resumeQr(lu({ montant: '', s1: '' }))).toBe('QR : Malterie Fictive SA');
  });
  it('QR non lu, illisible, sans, non conforme : rien', () => {
    expect(resumeQr(null)).toBeNull();
    expect(resumeQr(undefined)).toBeNull();
    expect(resumeQr({ statut: 'illisible' })).toBeNull();
    expect(resumeQr({ statut: 'sans' })).toBeNull();
    expect(resumeQr(lu({ iban: 'CH0000000000000000000' }))).toBeNull();
  });
});
