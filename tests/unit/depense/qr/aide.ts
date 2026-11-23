// Charges QR-facture construites à la main d'après les exemples PUBLICS des Swiss Implementation Guidelines QR-bill (SIX) :
// IBAN d'exemple CH5800791123000889012, QR-IBAN CH4431999123000889012, référence QRR 210000000003139471430009017, SCOR RF18539007547034.
// Aucune pièce du brasseur, aucun réseau.
export const IBAN = 'CH5800791123000889012';
export const QR_IBAN = 'CH4431999123000889012';
export const QRR = '210000000003139471430009017';
export const SCOR = 'RF18539007547034';
export const S1_EXEMPLE = '//S1/10/10201409/11/190512/20/1400.000-53/30/106017086/31/180508/32/7.7/40/2:10;0:30';

export interface Options {
  iban?: string;
  creancier?: string[];
  montant?: string;
  devise?: string;
  debiteur?: string[];
  typeRef?: string;
  ref?: string;
  message?: string;
  epd?: string;
  s1?: string;
  alt?: string[];
  version?: string;
}

const CREANCIER_S = ['S', 'Robert Schneider AG', 'Rue du Lac', '1268', '2501', 'Biel', 'CH'];
const DEBITEUR_S = ['S', 'Pia-Maria Rutschmann-Schnyder', 'Grosse Marktgasse', '28', '9400', 'Rorschach', 'CH'];

/** Les lignes de la charge, dans l'ordre des Guidelines (31 à 34 lignes). */
export function lignesQr(o: Options = {}): string[] {
  return [
    'SPC', o.version ?? '0200', '1', o.iban ?? QR_IBAN,
    ...(o.creancier ?? CREANCIER_S),
    '', '', '', '', '', '', '', // créancier final : réservé, vide
    o.montant ?? '1949.75', o.devise ?? 'CHF',
    ...(o.debiteur ?? DEBITEUR_S),
    o.typeRef ?? 'QRR', o.ref ?? QRR, o.message ?? 'Instruction of 03.04.2019', o.epd ?? 'EPD', o.s1 ?? '',
    ...(o.alt ?? []),
  ];
}

export const charge = (o: Options = {}, fin = '\n') => lignesQr(o).join(fin);

/** Une lecture de facture qui s'accorde au QR d'exemple (S1_EXEMPLE : n° 10201409, 12.05.2019). */
export const lectureAccordee = () => ({
  vendor: 'Robert Schneider AG', date: '12.05.2019', currency: 'CHF', invoiceNumber: '10201409', amountTTC: 1949.75,
});
