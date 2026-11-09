import { describe, expect, it } from 'vitest';
import { deflateSync, inflateSync } from 'node:zlib';
import { calculateQRReferenceChecksum, isQRReferenceValid, isSCORReferenceValid } from 'swissqrbill/utils';
import { SwissQRBill } from 'swissqrbill/svg';
import {
  adresseDepuisTexte, invoiceTotals, libelleFacture, preparerQrFacture, problemesAdresse, QrFactureInvalide, rasteriserNavigateur,
  SwissQrBillService, type AdresseStructuree, type Rasteriseur
} from '../../src/services/swissQrBill';
import { doublonsNumeroFacture, echeanceFacture, prochainNumeroFacture } from '../../src/domain/finance/numeroFacture';
import { initialCompany } from '../../src/data/seedData';
import type { AppConfig, Client } from '../../src/types';
import type { FinanceTransaction } from '../../src/domain/finance/types';

// IBAN publics du guide SIX « Swiss Implementation Guidelines QR-bill » : EXEMPLES DE TEST, jamais l'IBAN de la brasserie.
const IBAN_ORDINAIRE_TEST = 'CH56 0483 5012 3456 7800 9';
const IBAN_QR_TEST = 'CH44 3199 9123 0008 8901 2';
// PNG 32 × 32 valide (bruit, > 1 000 caractères) : le rasteriseur de Vitest (Node, sans canvas) n'a pas à dessiner.
const PNG_TEST = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAAAAABWESUoAAAEK0lEQVR4AQEgBN/7ABYoOAiY6PjI86dLH2NXO+rSNfjIWKhTh6v/wzebLzPnAIv62F5sLOysbMfrPwN3229zwsrNebVB3UlFke0Z/ekAADDIWKi4Ixf7D5PH62cL3yMX+w+TYurSmurSmsLKMnoiAKqS9YEdiYXRyFhD7VBAcOArf0O3Q7cbr7TUdJQ0fPx8APx8/Hz8fPwX+6qSWoKK8jriau0Z1eH96WUxDbmQgLBIANgo0z37D5PH6z+edm4GWRUg0Fvv9BS01HSUNFT0FLTUAHQvM4LA8GAQADCgUEBw4JCAsCDQwPD7D5PIWEO3G0qyAPqiKhLaAgpyumLq0ppdycU5dQGdCQVRrXTKBOREJIRkAMSkBH9DtxtK6MoyeiKqLVkVIdhebCzsrGzH6z8Dd9sKAHK6YupuBr4WKdzc3Nzc3Nzc3Nzc3Nzc3HcS2gIKmpCAALAg0MDwYBAAMDtP0wcrf0NSGt2AsCDQW+/zqLiIGGgTAEcGgR2JhdEt9Eqy+qLFEW00isSkBH9Dt7auRv5+1ullADENVPSvs48TR2u/g5KQgEsfY1fWhDYuxn7WTgGdCQVRAK3ZlTy8PLw8vDxXO0/TByt/Q7cbr7NnC98jF5YOJl42AMnFEQjO5rm4iBhoE0drWoIl8c15tUHdSUWR7bTUdJTPAFOHq//DN5vKMhXkRCQfY1c7T9MvMw+T7/On5lQqEtoCAApyVWF9aeWxjTl1nJycnMSkBOTfWoKK8jriBVFI2CjTAAcrf0NSGkJKsvqiUhpCSrKV1405dQGdpATkRCSEZMSkAATkRL+D91vvG6+01HSUz1OHrGws7NR0LzPni1+jl3uPABNHBr4Wjqbetq5G/lZqUhpCSk35NcFdycWsbCzsrAcrAH9DUhpC5bGN1HSUNFT0FLTUdJTPUyKqklqCivI64gWHAH1p5bGNOXUBnQkF7Kxsx65G/lbO5h727oY+lg4mhnMnAMs64gWIGGh449e7alIaalIaQkqy+j0ppXFN+TXBXclgABAAMKDrP552CQXsrJQ0VI8TRwa+FimlcXUBnQkF7OKgAFDbb3Mny5/j11bOgeD5NVxc0pd7KhLaAgpyumKF0chYAEO3G69OKaVxTZQ0VPQUtNR0lM9Th0b+Vs7mHvbuhtmVAKG9RCSE//kHK39DtxuvTpycnJycN5svM+ezZwvfIxf7AA8u/HyXe48TR2vnWHoiRZHtGdXh/ekAZtR0LzOCihoQAAAwoFBAcOCQgLAg0MCLX6OXFo6m3lGt2ZWhvakl8c15ALVB3eREJB9j8jriau0Z1Xz8fPx8/HyXsV+jMnoiqpJaAIKKjTl1AZ0JBVGtdMpoeEgAMMhYqLiIs2cL3yMX+w+TAMfrP552bqG9qcDwYBAAMKBQQHDgkICwIGu/g/f2ADCgrUz8fut4Oh8AAAAASUVORK5CYII=';
const faux = async () => PNG_TEST;

/* ---- Un vrai rasteriseur pour Node : la section paiement à 300 ppp (2 480 × 1 240 px) depuis les rectangles du SVG de swissqrbill, plus du « texte » simulé
   (bruit déterministe, plus lourd à compresser que le vrai texte : le test juge donc le pire cas). Vitest n'a pas de canvas. ---- */
const PX_MM = 300 / 25.4, QR_X = 67, QR_Y = 17, QR_MM = 46;
const TABLE_CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b: Uint8Array): number => { let c = 0xffffffff; for (const x of b) c = TABLE_CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const blocPng = (type: string, data: Buffer): Buffer => {
  const sortie = Buffer.alloc(12 + data.length), t = Buffer.from(type, 'latin1');
  sortie.writeUInt32BE(data.length, 0); t.copy(sortie, 4); data.copy(sortie, 8); sortie.writeUInt32BE(crc32(Buffer.concat([t, data])), 8 + data.length);
  return sortie;
};
const pngDepuisRgb = (w: number, h: number, rgb: Buffer): string => {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const brut = Buffer.alloc(h * (w * 3 + 1)); for (let y = 0; y < h; y++) rgb.copy(brut, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), blocPng('IHDR', ihdr), blocPng('IDAT', deflateSync(brut)), blocPng('IEND', Buffer.alloc(0))]);
  return `data:image/png;base64,${png.toString('base64')}`;
};
const pngVersRgb = (png: Buffer): Buffer => { // PNG RGB 8 bits sans filtre (celui de pngDepuisRgb)
  const w = png.readUInt32BE(16), h = png.readUInt32BE(20), brut = inflateSync(Buffer.concat(idat(png))), rgb = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) brut.copy(rgb, y * w * 3, y * (w * 3 + 1) + 1, (y + 1) * (w * 3 + 1));
  return rgb;
};
const idat = (png: Buffer): Buffer[] => { const morceaux: Buffer[] = []; for (let i = 8; i < png.length;) { const n = png.readUInt32BE(i), t = png.toString('latin1', i + 4, i + 8); if (t === 'IDAT') morceaux.push(png.subarray(i + 8, i + 8 + n)); i += 12 + n; } return morceaux; };
/** Les modules noirs du QR (rectangles de moins de 1 mm dans le SVG de la section), en mm dans le QR. */
const modulesDuQr = (svg: string): { x: number; y: number; l: number; noir: boolean }[] => {
  const debut = svg.indexOf('width="46mm" height="46mm"'), out: { x: number; y: number; l: number; noir: boolean }[] = [];
  for (const m of svg.slice(debut).matchAll(/<rect x="([\d.]+)mm" y="([\d.]+)mm" width="([\d.]+)mm" height="[\d.]+mm" fill="black"/g)) if (Number(m[3]) < 1) out.push({ x: Number(m[1]), y: Number(m[2]), l: Number(m[3]), noir: true });
  return out;
};
const rasteriseurDeTest: Rasteriseur = async (svg, largeurMm, hauteurMm) => {
  const w = Math.round(largeurMm * PX_MM), h = Math.round(hauteurMm * PX_MM), rgb = Buffer.alloc(w * h * 3, 255);
  let graine = 12345; const alea = () => (graine = (graine * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (const [x0, x1, ya] of [[5, 57, 10], [67, 113, 66], [118, 205, 10]]) for (let y = Math.floor(ya * PX_MM); y < Math.floor(100 * PX_MM); y += 7) for (let x = Math.floor(x0 * PX_MM); x < Math.floor(x1 * PX_MM); x++) if (alea() < 0.08) { const g = Math.floor(alea() * 200); for (let k = 0; k < 2; k++) rgb.fill(g, ((y + k) * w + x) * 3, ((y + k) * w + x) * 3 + 3); }
  for (const m of modulesDuQr(svg)) {
    const x0 = Math.floor((QR_X + m.x) * PX_MM), x1 = Math.floor((QR_X + m.x + m.l) * PX_MM), y0 = Math.floor((QR_Y + m.y) * PX_MM), y1 = Math.floor((QR_Y + m.y + m.l) * PX_MM);
    for (let y = y0; y < y1; y++) rgb.fill(0, (y * w + x0) * 3, (y * w + x1) * 3);
  }
  return pngDepuisRgb(w, h, rgb);
};
/** L'image de la section paiement telle qu'elle est rangée dans le PDF : flux Flate, prédicteur PNG (jsPDF), RGB 8 bits. */
const imageDuPdf = (pdf: Buffer): { w: number; h: number; rgb: Buffer } => {
  const texte = pdf.toString('latin1'), repere = texte.indexOf('/Subtype /Image'), debutObjet = texte.lastIndexOf(' obj', repere), flux = texte.indexOf('stream', repere);
  const dict = texte.slice(debutObjet, flux), nombre = (nom: string, defaut = 0) => Number((new RegExp(`/${nom} (\\d+)`).exec(dict) ?? [])[1] ?? defaut);
  const w = nombre('Width'), h = nombre('Height'), n = nombre('Colors', 3), predicteur = nombre('Predictor', 1), debut = flux + 'stream'.length + (texte[flux + 6] === '\r' ? 2 : 1);
  const brut = /FlateDecode/.test(dict) ? inflateSync(pdf.subarray(debut, debut + nombre('Length'))) : pdf.subarray(debut, debut + nombre('Length'));
  if (predicteur < 10) return { w, h, rgb: Buffer.from(brut) };
  const ligne = w * n, rgb = Buffer.alloc(h * ligne);
  for (let y = 0; y < h; y++) {
    const f = brut[y * (ligne + 1)], src = y * (ligne + 1) + 1;
    for (let i = 0; i < ligne; i++) {
      const x = brut[src + i], a = i >= n ? rgb[y * ligne + i - n] : 0, b = y ? rgb[(y - 1) * ligne + i] : 0, c = i >= n && y ? rgb[(y - 1) * ligne + i - n] : 0;
      let v = x;
      if (f === 1) v = x + a; else if (f === 2) v = x + b; else if (f === 3) v = x + ((a + b) >> 1);
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      rgb[y * ligne + i] = v & 255;
    }
  }
  return { w, h, rgb };
};

const brasserie: AdresseStructuree = { nom: 'Brasserie de test', rue: 'Rue du Test', numero: '1', npa: '1700', localite: 'Fribourg', pays: 'CH' };
const cafe: AdresseStructuree = { nom: 'Café du Bourg', rue: 'Grand-Rue', numero: '12', npa: '1630', localite: 'Bulle', pays: 'CH' };
const entree = (surcharge: Record<string, unknown> = {}) => ({ iban: IBAN_ORDINAIRE_TEST, creancier: brasserie, debiteur: cafe, montantCents: 10_810, numero: 'FAC-2026-0001', rasteriser: faux, ...surcharge });
const echec = async (promesse: Promise<unknown>): Promise<string[]> => {
  try { await promesse; } catch (e) { expect(e).toBeInstanceOf(QrFactureInvalide); return (e as QrFactureInvalide).problemes; }
  throw new Error('devait refuser');
};

const recette = (numero: string, extra: Partial<FinanceTransaction> = {}, kind: 'income' | 'expense' = 'income'): FinanceTransaction => ({
  id: `id-${numero}-${Math.random()}`, date: '2026-09-09', description: 'x', amountHT: 1, amountTTC: 1, tvaAmount: 0, tvaRate: 0,
  category: kind === 'income' ? 'recettes' : 'brassage', subcategory: '',
  finance: { version: 1, kind, amountCents: 100, lines: [], invoiceNumber: numero }, ...extra
} as FinanceTransaction);

describe('Numéro de facture continu (P6)', () => {
  it('1 : FAC-2026-0001 puis 0003 après 0001 et 0002', () => {
    expect(prochainNumeroFacture([], 2026)).toBe('FAC-2026-0001');
    expect(prochainNumeroFacture([recette('FAC-2026-0001'), recette('FAC-2026-0002')], 2026)).toBe('FAC-2026-0003');
  });
  it('2 : repart à 0001 l\'année suivante', () => {
    expect(prochainNumeroFacture([recette('FAC-2026-0007')], 2027)).toBe('FAC-2027-0001');
  });
  it('3 : ignore les autres années et les anciens formats (hex sur 8)', () => {
    const base = [recette('FAC-2025-0099'), recette('FAC-2026-1a2b3c4d'), recette('FAC-2026-12345678')];
    expect(prochainNumeroFacture(base, 2026)).toBe('FAC-2026-0001');
  });
  it('4 : le numéro d\'une facture fournisseur (dépense) ne compte pas', () => {
    expect(prochainNumeroFacture([recette('FAC-2026-0009', {}, 'expense')], 2026)).toBe('FAC-2026-0001');
  });
  it('5 : une recette annulée garde son numéro (jamais réutilisé)', () => {
    const annulee = recette('FAC-2026-0004'); annulee.finance!.voidedAt = '2026-09-10';
    expect(prochainNumeroFacture([annulee], 2026)).toBe('FAC-2026-0005');
  });
  it('5b : lit aussi l\'identifiant de l\'écriture (le numéro y est copié)', () => {
    expect(prochainNumeroFacture([{ ...recette('x'), id: 'FAC-2026-0010', finance: { version: 1, kind: 'income', amountCents: 1, lines: [] } } as FinanceTransaction], 2026)).toBe('FAC-2026-0011');
  });
  it('6 : passe à 5 chiffres après 9999', () => {
    expect(prochainNumeroFacture([recette('FAC-2026-9999')], 2026)).toBe('FAC-2026-10000');
  });
  it('7 : signale un numéro porté par deux recettes', () => {
    const a = recette('FAC-2026-0002', { id: 'a' }), b = recette('FAC-2026-0002', { id: 'b' }), c = recette('FAC-2026-0003', { id: 'c' });
    expect(doublonsNumeroFacture([a, b, c])).toEqual([{ numero: 'FAC-2026-0002', ids: ['a', 'b'] }]);
    expect(doublonsNumeroFacture([a, c])).toEqual([]);
  });
});

describe('Échéance par défaut (problème 21)', () => {
  it('8 : +30 j, +10 j, à réception ; mois, année et 29 février', () => {
    expect(echeanceFacture('2026-09-09')).toBe('2026-10-09');
    expect(echeanceFacture('2026-09-09', 10)).toBe('2026-09-19');
    expect(echeanceFacture('2026-09-09', 'reception')).toBe('2026-09-09');
    expect(echeanceFacture('2026-12-25', 30)).toBe('2027-01-24');
    expect(echeanceFacture('2028-02-15', 30)).toBe('2028-03-16');
    expect(() => echeanceFacture('2026-13-40')).toThrow();
    expect(() => echeanceFacture('2026-02-30')).toThrow();
  });
});

describe('Libellé du journal : tous les articles', () => {
  const art = (description: string, quantity: number) => ({ description, quantity, unitPriceHT: 2, tvaRate: 0.081 });
  it('9 : deux articles, un article, trop long', () => {
    const deux = libelleFacture('Café du Bourg', [art('Pale Ale 33 cl', 24), art('IPA 75 cl', 6)]);
    expect(deux).toContain('Pale Ale 33 cl'); expect(deux).toContain('IPA 75 cl'); expect(deux).toContain('Café du Bourg');
    expect(libelleFacture('Café du Bourg', [art('Fût 20 L', 1)])).toContain('Fût 20 L');
    const long = libelleFacture('Café du Bourg', Array.from({ length: 12 }, (_, i) => art(`Bière artisanale numéro ${i + 1}`, 3)));
    expect(long.length).toBeLessThanOrEqual(140); expect(long).toMatch(/et \d+ autres?$/);
  });
});

describe('Adresse structurée (norme SIX 2.3 § 4.3.1)', () => {
  it('10 : une adresse complète donne une QR-facture, sans ValidationError', async () => {
    const qr = await preparerQrFacture(entree());
    expect(qr.png).toBe(PNG_TEST); expect(qr.svg).toContain('<svg');
  });
  it('11 : la bibliothèque seule accepte un NPA vide ; notre contrôle le refuse', async () => {
    const donnees = { currency: 'CHF' as const, amount: 1, creditor: { account: 'CH5604835012345678009', name: 'B', address: 'Rue', buildingNumber: '1', zip: '', city: 'Fribourg', country: 'CH' } };
    expect(() => new SwissQRBill(donnees)).not.toThrow();
    expect((await echec(preparerQrFacture(entree({ creancier: { ...brasserie, npa: '' } })))).join(' ')).toContain('NPA');
    expect((await echec(preparerQrFacture(entree({ creancier: { ...brasserie, localite: '' } })))).join(' ')).toContain('localité');
    expect((await echec(preparerQrFacture(entree({ creancier: { ...brasserie, pays: 'Suisse' } })))).join(' ')).toContain('pays');
    expect((await echec(preparerQrFacture(entree({ creancier: { ...brasserie, nom: 'x'.repeat(71) } })))).join(' ')).toContain('nom');
  });
  it('12 : brasserie : tout champ vide refuse (P7) ; client : rue et numéro facultatifs', async () => {
    for (const champ of ['rue', 'numero', 'npa', 'localite', 'nom'] as const) {
      const p = await echec(preparerQrFacture(entree({ creancier: { ...brasserie, [champ]: '' } })));
      expect(p.join(' ')).toContain('Réglages');
    }
    await expect(preparerQrFacture(entree({ debiteur: { ...cafe, rue: '', numero: '' } }))).resolves.toBeDefined();
  });
  it('12b : le gabarit du seed (« 1000 Ville », « Exemple », « Ma Brasserie ») est refusé, même découpé depuis l\'ancien texte', async () => {
    const decoupe = adresseDepuisTexte(initialCompany.address, initialCompany.npa)!;
    const depuisSeed: AdresseStructuree = { nom: initialCompany.name, ...decoupe };
    expect(decoupe.npa).toBe('1000');
    const p = await echec(preparerQrFacture(entree({ creancier: depuisSeed })));
    expect(p.join(' ')).toContain('Réglages');
    expect(problemesAdresse(depuisSeed, 'brasserie').join(' ')).toContain('modèle de départ');
    expect(problemesAdresse(brasserie, 'brasserie')).toEqual([]);
  });
  it('13 : sans débiteur (Comptoir) permis ; débiteur incomplet refusé, jamais tronqué', async () => {
    await expect(preparerQrFacture(entree({ debiteur: undefined }))).resolves.toBeDefined();
    expect((await echec(preparerQrFacture(entree({ debiteur: { ...cafe, npa: '' } })))).join(' ')).toContain('client');
  });
  it('13b : adresseDepuisTexte : découpe sans inventer', () => {
    expect(adresseDepuisTexte('Grand-Rue 12', '1630 Bulle')).toEqual({ rue: 'Grand-Rue', numero: '12', npa: '1630', localite: 'Bulle', pays: 'CH' });
    expect(adresseDepuisTexte('Grand-Rue 12, 1630 Bulle')).toEqual({ rue: 'Grand-Rue', numero: '12', npa: '1630', localite: 'Bulle', pays: 'CH' });
    expect(adresseDepuisTexte('Case postale 123', '1630 Bulle')).toEqual({ rue: 'Case postale 123', numero: '', npa: '1630', localite: 'Bulle', pays: 'CH' });
    expect(adresseDepuisTexte('Hauptstrasse 5', '10115 Berlin')).toBeNull();
    expect(adresseDepuisTexte('Grand-Rue 12')).toBeNull();
  });
});

describe('Référence de paiement', () => {
  it('14 : IBAN ordinaire → SCOR valide', async () => {
    const qr = await preparerQrFacture(entree());
    expect(qr.typeReference).toBe('SCOR'); expect(qr.reference).toBe('RF59FAC20260001'); expect(isSCORReferenceValid(qr.reference)).toBe(true);
  });
  it('15 : QR-IBAN → QRR de 27 chiffres, contrôle modulo 10', async () => {
    const qr = await preparerQrFacture(entree({ iban: IBAN_QR_TEST }));
    expect(qr.typeReference).toBe('QRR'); expect(qr.reference).toMatch(/^\d{27}$/); expect(isQRReferenceValid(qr.reference)).toBe(true);
    expect(qr.reference.slice(0, 26)).toBe('20260001'.padStart(26, '0')); expect(qr.reference.slice(26)).toBe(calculateQRReferenceChecksum(qr.reference.slice(0, 26)));
  });
  it('16 : QR-IBAN et numéro non numérique → refus en français', async () => {
    expect((await echec(preparerQrFacture(entree({ iban: IBAN_QR_TEST, numero: 'FAC-2026-1a2b3c4d' })))).join(' ')).toContain('numéro');
  });
});

describe('IBAN et montant', () => {
  it('17 : IBAN vide ou invalide refusé ; le message ne recopie pas l\'IBAN saisi', async () => {
    expect((await echec(preparerQrFacture(entree({ iban: '' })))).join(' ')).toContain('IBAN');
    const p = (await echec(preparerQrFacture(entree({ iban: 'CH00 1234 5678 9012 3456 7' })))).join(' ');
    expect(p).toContain('IBAN'); expect(p).not.toContain('1234'); expect(p).not.toContain('CH00');
  });
  it('18 : montant entier en centimes, de 1 à 99 999 999 999 ; le QR porte 108,10', async () => {
    for (const montantCents of [0, -5, 10.5, 100_000_000_000]) await echec(preparerQrFacture(entree({ montantCents })));
    await expect(preparerQrFacture(entree({ montantCents: 99_999_999_999 }))).resolves.toBeDefined();
    const qr = await preparerQrFacture(entree());
    expect(qr.donnees.amount).toBe(108.1); expect(qr.donnees.currency).toBe('CHF');
    expect(qr.donnees.creditor.zip).toBe('1700'); expect(qr.donnees.debtor?.name).toBe('Café du Bourg');
  });
  it('18b : rasteriseur qui rend un PNG vide ou faux → erreur claire', async () => {
    await expect(preparerQrFacture(entree({ rasteriser: async () => 'data:image/png;base64,' }))).rejects.toThrow('Rendu du QR');
    await expect(preparerQrFacture(entree({ rasteriser: async () => 'pas un png' }))).rejects.toThrow('Rendu du QR');
  });
});

describe('Totaux : centimes entiers, TVA par ligne', () => {
  const ligne = (quantity: number, unitPriceHT: number, tvaRate = 0.081) => ({ description: 'Bière', quantity, unitPriceHT, tvaRate });
  it('19 : 1 × 1,005 = 101 ; deux lignes 3 × 0,35 : TVA 9 + 9 = 18, total 228', () => {
    expect(invoiceTotals([ligne(1, 1.005)], true).lines[0]).toMatchObject({ netCents: 101, vatCents: 8 });
    const t = invoiceTotals([ligne(3, 0.35), ligne(3, 0.35)], true);
    expect(t.lines.map(l => l.vatCents)).toEqual([9, 9]); expect(t.vatCents).toBe(18); expect(t.totalCents).toBe(228);
  });
  it('19b : balayage des demi-centimes x,xx5 : toujours l\'arrondi supérieur', () => {
    const faux: number[] = [];
    for (let n = 0; n < 20_000; n++) { const prix = (10 * n + 5) / 1000; if (invoiceTotals([ligne(1, prix)], false).netCents !== n + 1) faux.push(prix); }
    expect(faux).toEqual([]);
    expect(invoiceTotals([ligne(1, 2.135)], false).netCents).toBe(214);
    expect(invoiceTotals([ligne(1, 4.015)], false).netCents).toBe(402);
  });
  it('19c : un produit infini est refusé, jamais compté 0 centime', () => {
    expect(() => invoiceTotals([ligne(1e308, 10)], false)).toThrow('précision');
  });
});

describe('PDF de la facture', () => {
  const config = { company: { name: 'Brasserie de test', address: 'Rue du Test 1', npa: '1700 Fribourg', iban: IBAN_ORDINAIRE_TEST }, fiscal: { isTvaRegistered: false, tvaNormalRate: 0.081, tvaReducedRate: 0.026 } } as AppConfig;
  const client = { id: 'c', name: 'Café du Bourg', type: 'Pro', contact: '', phone: '', email: '' } as Client;
  const art = (i: number) => ({ description: `Bière ${i}`, quantity: 1, unitPriceHT: 2, tvaRate: 0.081 });
  it('20 : avec le QR : une image, une seule page ; beaucoup d\'articles : la section paiement a sa page', async () => {
    const qr = await preparerQrFacture(entree());
    const un = SwissQrBillService.generateInvoicePdf(client, [art(1)], config, 'FAC-2026-0001', { date: '2026-09-09', dueDate: '2026-10-09', download: false, qr, creancier: brasserie, debiteur: cafe });
    expect(un.doc.output()).toContain('/Subtype /Image'); expect(un.doc.getNumberOfPages()).toBe(1);
    expect(un.doc.output()).toContain('Grand-Rue 12'); expect(un.doc.output()).toContain('1630 Bulle');
    const beaucoup = SwissQrBillService.generateInvoicePdf(client, Array.from({ length: 12 }, (_, i) => art(i)), config, 'FAC-2026-0001', { download: false, qr });
    expect(beaucoup.doc.getNumberOfPages()).toBeGreaterThanOrEqual(2);
    expect(beaucoup.doc.output()).toContain('/Subtype /Image');
  });
  it('20b : le PDF avec la section paiement pèse moins de 300 ko et le QR y est intact, module par module (rouge sans compression : 9 Mo)', async () => {
    const qr = await preparerQrFacture(entree({ rasteriser: rasteriseurDeTest }));
    const octetsPng = Buffer.from(qr.png.split(',')[1], 'base64');
    const pdf = SwissQrBillService.generateInvoicePdf(client, [art(1), art(2)], config, 'FAC-2026-0001', { date: '2026-09-09', dueDate: '2026-10-09', download: false, qr, creancier: brasserie, debiteur: cafe });
    const octets = Buffer.from(new Uint8Array(pdf.doc.output('arraybuffer')));
    expect(octets.length).toBeLessThan(300_000);
    expect(pdf.dataUrl.length).toBeLessThan(400_000); // le plafond de l'enregistrement est de 5 600 000 caractères
    /* Le PDF garde la section sans perte : les pixels extraits du PDF sont ceux du PNG envoyé. */
    const { w, h, rgb } = imageDuPdf(octets);
    expect([w, h]).toEqual([2480, 1240]);
    expect(Buffer.compare(rgb, pngVersRgb(octetsPng))).toBe(0);
    /* La matrice du QR (rectangles de swissqrbill) : chaque module noir est noir, chaque module blanc est blanc, au centre du module. */
    const modules = modulesDuQr(qr.svg), l = modules[0].l, grille = Math.round(QR_MM / l);
    expect(modules.length).toBeGreaterThan(1000);
    const noirs = new Set(modules.map(m => `${Math.round(m.x / l)},${Math.round(m.y / l)}`));
    let verifies = 0;
    for (let cy = 0; cy < grille; cy++) for (let cx = 0; cx < grille; cx++) {
      const x = QR_X + (cx + 0.5) * l, y = QR_Y + (cy + 0.5) * l;
      if (Math.abs(x - QR_X - QR_MM / 2) < 4 && Math.abs(y - QR_Y - QR_MM / 2) < 4) continue; // la croix suisse
      const pixel = rgb[(Math.floor(y * PX_MM) * w + Math.floor(x * PX_MM)) * 3];
      expect(noirs.has(`${cx},${cy}`) ? pixel < 60 : pixel > 195).toBe(true); verifies++;
    }
    expect(verifies).toBeGreaterThan(grille * grille * 0.95); // tout le QR sauf la croix suisse
    /* Un module vaut 9 pixels ou plus à 300 ppp : lisible par un lecteur de téléphone. */
    expect(l * PX_MM).toBeGreaterThanOrEqual(9);
  });
  it('21 : sans le QR : aucune image, rien ne prétend en avoir un', () => {
    const sans = SwissQrBillService.generateInvoicePdf(client, [art(1)], config, 'FAC-2026-0001', { download: false });
    expect(sans.doc.output()).not.toContain('/Subtype /Image'); expect(sans.doc.output()).not.toContain('Swiss QR');
  });
});

describe('Rendu du QR', () => {
  it('22 : hors navigateur, le rasteriseur le dit', async () => {
    await expect(rasteriserNavigateur('<svg/>', 210, 105)).rejects.toThrow('Rendu du QR indisponible');
  });
});
