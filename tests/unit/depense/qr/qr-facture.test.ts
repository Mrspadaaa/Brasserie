// parseSwissQr : charge SPC, contrôles de clé, tolérance des fins de ligne.
import { describe, expect, it } from 'vitest';
import { estQrIban, ibanValide, parseSwissQr, referenceQrrValide, referenceScorValide } from '../../../../src/services/qrFacture';
import { IBAN, QRR, QR_IBAN, SCOR, charge, lignesQr } from './aide';

describe('clés — exemples publics des Guidelines', () => {
  it('IBAN et QR-IBAN d\'exemple valides, la clé fausse refusée', () => {
    expect(ibanValide(IBAN)).toBe(true);
    expect(ibanValide(QR_IBAN)).toBe(true);
    expect(ibanValide('CH4531999123000889012')).toBe(false);
    expect(ibanValide('DE89370400440532013000')).toBe(false); // valide ailleurs, pas un IBAN CH/LI
    expect(estQrIban(QR_IBAN)).toBe(true);
    expect(estQrIban(IBAN)).toBe(false);
  });
  it('QRR : modulo 10 récursif ; un chiffre changé ou une longueur fausse échoue', () => {
    expect(referenceQrrValide(QRR)).toBe(true);
    expect(referenceQrrValide('210000000003139471430009018')).toBe(false);
    expect(referenceQrrValide('21000000000313947143000901')).toBe(false);
  });
  it('SCOR : ISO 11649', () => {
    expect(referenceScorValide(SCOR)).toBe(true);
    expect(referenceScorValide('RF19539007547034')).toBe(false);
    expect(referenceScorValide('XX18539007547034')).toBe(false);
  });
});

describe('parseSwissQr', () => {
  it('QRR avec montant : tous les champs, valide', () => {
    const qr = parseSwissQr(charge({ alt: ['UltraPay005;UP;DE', 'Payment-Test;PT;2'] }))!;
    expect(qr.problemes).toEqual([]);
    expect(qr.valid).toBe(true);
    expect(qr).toMatchObject({
      version: '0200', iban: QR_IBAN, qrIban: true, montant: 1949.75, devise: 'CHF', typeReference: 'QRR', reference: QRR,
      message: 'Instruction of 03.04.2019', epd: 'EPD', infosFacturation: '', procedures: ['UltraPay005;UP;DE', 'Payment-Test;PT;2'], s1: null,
    });
    expect(qr.creancier).toEqual({ type: 'S', nom: 'Robert Schneider AG', rue: 'Rue du Lac', numero: '1268', npa: '2501', lieu: 'Biel', pays: 'CH' });
    expect(qr.debiteur).toEqual({ type: 'S', nom: 'Pia-Maria Rutschmann-Schnyder', rue: 'Grosse Marktgasse', numero: '28', npa: '9400', lieu: 'Rorschach', pays: 'CH' });
  });

  it('SCOR en EUR, créancier à adresse combinée (K)', () => {
    const qr = parseSwissQr(charge({
      iban: IBAN, devise: 'EUR', typeRef: 'SCOR', ref: SCOR, montant: '120.50',
      creancier: ['K', 'Robert Schneider AG', 'Rue du Lac 1268', '2501 Biel', '', '', 'CH'],
    }))!;
    expect(qr.problemes).toEqual([]);
    expect(qr).toMatchObject({ valid: true, devise: 'EUR', typeReference: 'SCOR', reference: SCOR, qrIban: false, montant: 120.5 });
    expect(qr.creancier).toMatchObject({ type: 'K', rue: 'Rue du Lac 1268', numero: '2501 Biel', npa: '', lieu: '' });
  });

  it('NON sans montant (bulletin ouvert) ni débiteur : montant null, jamais 0', () => {
    const qr = parseSwissQr(charge({ iban: IBAN, typeRef: 'NON', ref: '', montant: '', debiteur: ['', '', '', '', '', '', ''], message: '' }))!;
    expect(qr.problemes).toEqual([]);
    expect(qr.valid).toBe(true);
    expect(qr.montant).toBeNull();
    expect(qr.debiteur).toBeNull();
    expect(qr.typeReference).toBe('NON');
    expect(qr.reference).toBe('');
  });

  it('fins de ligne \\r\\n et lignes vides finales tolérées : même résultat que \\n', () => {
    const base = parseSwissQr(charge())!;
    expect(parseSwissQr(charge({}, '\r\n'))).toEqual(base);
    expect(parseSwissQr(charge() + '\n\n')).toEqual(base);
    expect(parseSwissQr(charge({}, '\r\n') + '\r\n')).toEqual(base);
  });

  it('l\'information de facturation S1 est lue dans le QR', () => {
    const qr = parseSwissQr(charge({ s1: '//S1/10/10201409/11/190512/30/106017086' }))!;
    expect(qr.s1).toMatchObject({ numero: '10201409', ide: '106017086' });
  });

  it('clé IBAN fausse : valid false, motif donné', () => {
    const qr = parseSwissQr(charge({ iban: 'CH4531999123000889012' }))!;
    expect(qr.valid).toBe(false);
    expect(qr.problemes.join(' ')).toMatch(/IBAN/);
  });

  it('référence QRR fausse, QRR avec un IBAN ordinaire, SCOR avec un QR-IBAN : invalides', () => {
    expect(parseSwissQr(charge({ ref: '210000000003139471430009018' }))!.valid).toBe(false);
    expect(parseSwissQr(charge({ iban: IBAN }))!.problemes.join(' ')).toMatch(/QR-IBAN/);
    expect(parseSwissQr(charge({ typeRef: 'SCOR', ref: SCOR }))!.valid).toBe(false);
    expect(parseSwissQr(charge({ iban: IBAN, typeRef: 'SCOR', ref: 'RF19539007547034' }))!.valid).toBe(false);
  });

  it('montant illisible, devise inconnue, EPD absent, version 01 : invalides', () => {
    expect(parseSwissQr(charge({ montant: '1 949,75' }))!.valid).toBe(false);
    expect(parseSwissQr(charge({ devise: 'USD' }))!.valid).toBe(false);
    expect(parseSwissQr(charge({ epd: '' }))!.valid).toBe(false);
    expect(parseSwissQr(charge({ version: '0100' }))!.valid).toBe(false);
  });

  it('charge tronquée après l\'IBAN : objet invalide, pas un plantage', () => {
    const qr = parseSwissQr(lignesQr().slice(0, 6).join('\n'))!;
    expect(qr.valid).toBe(false);
    expect(qr.montant).toBeNull();
  });

  it('ce qui n\'est pas un SPC rend null', () => {
    expect(parseSwissQr('')).toBeNull();
    expect(parseSwissQr('https://exemple.ch/facture/1')).toBeNull();
    expect(parseSwissQr('SPCX\n0200\n1')).toBeNull();
    expect(parseSwissQr('BEGIN:VCARD\nVERSION:3.0')).toBeNull();
    expect(parseSwissQr(undefined as unknown as string)).toBeNull();
  });
});
