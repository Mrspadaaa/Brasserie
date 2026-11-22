// confronterQr : ce que le QR confirme ou contredit dans la lecture, champ par champ.
import { describe, expect, it } from 'vitest';
import { confronterQr, parseSwissQr } from '../../../../src/services/qrFacture';
import { IBAN, QRR, S1_EXEMPLE, SCOR, charge, lectureAccordee } from './aide';

const qrDe = (o = {}) => parseSwissQr(charge({ s1: S1_EXEMPLE, ...o }))!;

describe('confronterQr', () => {
  it('tout confirmé : montant, devise, numéro (sans ponctuation), date, créancier ; IBAN, référence et conditions rendus', () => {
    const c = confronterQr(qrDe(), { ...lectureAccordee(), invoiceNumber: '10 201.409', vendor: 'ROBERT SCHNEIDER AG, Biel' });
    expect(c.etat).toBe('valide');
    expect(c.montant).toEqual({ statut: 'confirme', qr: 1949.75, lecture: 1949.75 });
    expect(c.devise.statut).toBe('confirme');
    expect(c.numero).toEqual({ statut: 'confirme', qr: '10201409', lecture: '10 201.409' });
    expect(c.date).toEqual({ statut: 'confirme', qr: '2019-05-12', lecture: '2019-05-12' });
    expect(c.creancier.statut).toBe('confirme');
    expect(c.iban).toBe('CH4431999123000889012');
    expect(c.reference).toEqual({ type: 'QRR', valeur: QRR });
    expect(c.conditions).toEqual([{ escomptePct: 2, jours: 10 }, { escomptePct: 0, jours: 30 }]);
    expect(c.delaiNetJours).toBe(30);
  });

  it('montant contredit : 110,40 lu contre 110,04 au QR, les deux valeurs rendues', () => {
    const c = confronterQr(qrDe({ montant: '110.04' }), { ...lectureAccordee(), amountTTC: 110.4 });
    expect(c.montant).toEqual({ statut: 'contredit', qr: 110.04, lecture: 110.4 });
    expect(c.devise.statut).toBe('confirme');
  });

  it('montant absent du QR (bulletin ouvert) : absent, et la lecture n\'est pas touchée', () => {
    const c = confronterQr(qrDe({ montant: '' }), lectureAccordee());
    expect(c.montant).toEqual({ statut: 'absent', qr: null, lecture: 1949.75 });
  });

  it('date non lue : non-lu ; montant non lu : non-lu (jamais 0)', () => {
    const c = confronterQr(qrDe(), { ...lectureAccordee(), date: '', amountTTC: null });
    expect(c.date).toEqual({ statut: 'non-lu', qr: '2019-05-12', lecture: null });
    expect(c.montant).toEqual({ statut: 'non-lu', qr: 1949.75, lecture: null });
  });

  it('date, numéro et créancier contredits', () => {
    const c = confronterQr(qrDe(), { ...lectureAccordee(), date: '13.05.2019', invoiceNumber: '10201410', vendor: 'Brasserie du Lac SA' });
    expect(c.date.statut).toBe('contredit');
    expect(c.numero.statut).toBe('contredit');
    expect(c.creancier).toEqual({ statut: 'contredit', qr: 'Robert Schneider AG', lecture: 'Brasserie du Lac SA' });
  });

  it('sans S1 : numéro, date et conditions absents', () => {
    const c = confronterQr(parseSwissQr(charge())!, lectureAccordee());
    expect(c.numero.statut).toBe('absent');
    expect(c.date.statut).toBe('absent');
    expect(c.conditions).toEqual([]);
    expect(c.delaiNetJours).toBeNull();
    expect(c.montant.statut).toBe('confirme');
  });

  it('devise contredite (EUR au QR, CHF lu) : la même somme n\'est pas confirmée', () => {
    const c = confronterQr(qrDe({ iban: IBAN, devise: 'EUR', typeRef: 'SCOR', ref: SCOR }), lectureAccordee());
    expect(c.devise).toEqual({ statut: 'contredit', qr: 'EUR', lecture: 'CHF' });
    expect(c.montant.statut).toBe('contredit');
    expect(c.reference).toEqual({ type: 'SCOR', valeur: SCOR });
  });

  it('un QR invalide (clé IBAN fausse) ne confirme rien, même quand tout concorde', () => {
    const c = confronterQr(qrDe({ iban: 'CH4531999123000889012' }), lectureAccordee());
    expect(c.etat).toBe('invalide');
    expect(c.problemes.join(' ')).toMatch(/IBAN/);
    for (const k of ['montant', 'devise', 'numero', 'date', 'creancier'] as const) expect(c[k].statut).toBe('absent');
    expect(c.iban).toBeNull();
    expect(c.reference).toBeNull();
  });

  it('pas de QR : etat aucun, tout absent', () => {
    const c = confronterQr(null, lectureAccordee());
    expect(c.etat).toBe('aucun');
    expect(c.montant.statut).toBe('absent');
  });

  it('tolérance de montant : un centime d\'écart contredit, l\'égalité à l\'arrondi près confirme', () => {
    expect(confronterQr(qrDe(), { ...lectureAccordee(), amountTTC: 1949.76 }).montant.statut).toBe('contredit');
    expect(confronterQr(qrDe(), { ...lectureAccordee(), amountTTC: 1949.7500001 }).montant.statut).toBe('confirme');
  });
});
