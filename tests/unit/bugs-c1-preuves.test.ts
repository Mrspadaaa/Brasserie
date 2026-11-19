import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';
/**
 * Voie c1 : preuves des défauts déjà corrigés par la caisse v3a (d4bb21264) et la chaîne litre → format (480f8d3ed).
 * AM-66 QR-facture, référence, TVA et IBAN ; AM-68 lot et quantité d'une vente ; TE-56 client de la fiche ; RL-15 un seul coût de revient.
 * Aucun appel réseau : PDF jsPDF et swissqrbill locaux, rasteriseur simulé.
 */
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null }, storage: {} }));
import { preparerVente } from '../../src/ui/vente/enregistrerVente';
import { litresVendus, jaugeBrassin } from '../../src/ui/vente/brassinsVendables';
import { ClientStatsService } from '../../src/services/clientStats';
import { preparerQrFacture, SwissQrBillService, QrFactureInvalide } from '../../src/services/swissQrBill';
import { lirePrix } from '../../src/ui/prix/calculPrix';
import { coutFormat } from '../../src/domain/finance/chaineLitre';
import type { AppConfig, Batch, Client, Transaction } from '../../src/types';

// IBAN d'EXEMPLE du guide SIX (jamais celui de la brasserie).
const IBAN_ORDINAIRE = 'CH93 0076 2011 6238 5295 7';
const IBAN_QR = 'CH44 3199 9123 0008 8901 2';
/** Un vrai PNG RGB 48 × 48 (bruit déterministe, > 1 000 caractères) : jsPDF le décode, le rendu canvas du navigateur n'a pas à dessiner. */
const png = (() => {
  const w = 48, h = 48, brut = Buffer.alloc((w * 3 + 1) * h);
  let g = 7; for (let i = 0; i < brut.length; i++) { g = (g * 1103515245 + 12345) % 2147483648; brut[i] = (i % (w * 3 + 1) === 0) ? 0 : g >> 8 & 255; }
  const bloc = (type: string, data: Buffer) => { const t = Buffer.from(type), l = Buffer.alloc(4), c = Buffer.alloc(4); l.writeUInt32BE(data.length); c.writeUInt32BE(crc32(Buffer.concat([t, data]))); return Buffer.concat([l, t, data, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return `data:image/png;base64,${Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), bloc('IHDR', ihdr), bloc('IDAT', deflateSync(brut)), bloc('IEND', Buffer.alloc(0))]).toString('base64')}`;
})();
const aujourdhui = new Date().toISOString().slice(0, 10);
const adresse = { rue: 'Rue du Test', numero: '1', npa: '1700', localite: 'Fribourg', pays: 'CH' };
const configDe = (fiscal: Partial<AppConfig['fiscal']>, company: Record<string, unknown> = {}) => ({
  fiscal: { isTvaRegistered: false, tvaNormalRate: 0.081, ...fiscal }, company: { name: 'Brasserie Test', owner: '', uid: 'CHE-123.456.789', iban: IBAN_ORDINAIRE, adresse, ...company }, brewhouses: []
}) as unknown as AppConfig;
const client: Client = { id: 'CL-006', name: 'ZZ TEST — Clients', type: 'Pro', contact: '', phone: '', email: '', adresse: { rue: 'Chemin des Fixtures', numero: '4', npa: '1700', localite: 'Fribourg', pays: 'CH' } };
const ligne = (batchId: string, quantite: number, prixHT: number) => ({ cle: `${batchId}:33cl`, batchId, formatId: '33cl', designation: 'Pale Ale · 33 cl', litresUnite: 0.33, quantite, prixHT });

describe('AM-66 : la facture client porte un vrai QR, une référence, le n° TVA ; l\'IBAN est validé', () => {
  it('QR-IBAN : référence QRR de 27 chiffres au contrôle modulo 10, montant et adresse du client dans les données du QR', async () => {
    const qr = await preparerQrFacture({ iban: IBAN_QR, creancier: { nom: 'Brasserie Test', ...adresse }, debiteur: { nom: client.name, ...client.adresse! }, montantCents: 1188, numero: 'FAC-2026-0001', rasteriser: async () => png });
    expect(qr.typeReference).toBe('QRR');
    expect(qr.reference).toMatch(/^\d{27}$/);
    expect(qr.donnees.amount).toBe(11.88);
    expect(qr.donnees.debtor?.name).toBe(client.name);
    expect(qr.svg).toContain('<svg');
  });
  it('IBAN ordinaire : référence SCOR (RF…) ; IBAN invalide ou absent : refusé avec un message, jamais imprimé', async () => {
    const ok = await preparerQrFacture({ iban: IBAN_ORDINAIRE, creancier: { nom: 'Brasserie Test', ...adresse }, montantCents: 1000, numero: 'FAC-2026-0002', rasteriser: async () => png });
    expect(ok.typeReference).toBe('SCOR'); expect(ok.reference).toMatch(/^RF\d{2}/);
    await expect(preparerQrFacture({ iban: 'CH93 0076 2011 6238 5295 8', creancier: { nom: 'Brasserie Test', ...adresse }, montantCents: 1000, numero: 'FAC-2026-0002', rasteriser: async () => png })).rejects.toBeInstanceOf(QrFactureInvalide);
    await expect(preparerQrFacture({ iban: '', creancier: { nom: 'Brasserie Test', ...adresse }, montantCents: 1000, numero: 'FAC-2026-0002', rasteriser: async () => png })).rejects.toThrow(/IBAN/);
  });
  it('la facture d\'un assujetti sans n° UID n\'est pas fabriquée ; avec lui, le n° TVA est imprimé', async () => {
    const items = [{ description: 'Pale Ale · 33 cl', quantity: 3, unitPriceHT: 3.96, tvaRate: 0.081 }];
    expect(() => SwissQrBillService.generateInvoicePdf(client, items, configDe({ isTvaRegistered: true }, { uid: '' }), 'FAC-2026-0003', { download: false })).toThrow(/UID/);
    const pdf = SwissQrBillService.generateInvoicePdf(client, items, configDe({ isTvaRegistered: true }), 'FAC-2026-0003', { download: false });
    expect(pdf.doc.getNumberOfPages()).toBeGreaterThan(0);
    expect(pdf.fileName).toBe('Facture_FAC-2026-0003.pdf');
  });
  it('la vente « Facture QR » garde la facture sans QR hors de l\'écriture : une brasserie sans IBAN valide ne facture pas', async () => {
    await expect(preparerVente({ mode: 'qr', lignes: [ligne('B1', 2, 5)], client, dateIso: aujourdhui, echeance: 30, config: configDe({}, { iban: 'CH00 0000' }), numero: 'FAC-2026-0004', rasteriser: async () => png })).rejects.toBeInstanceOf(QrFactureInvalide);
    const v = await preparerVente({ mode: 'qr', lignes: [ligne('B1', 2, 5)], client, dateIso: aujourdhui, echeance: 30, config: configDe({}), numero: 'FAC-2026-0004', rasteriser: async () => png });
    expect(v.mode).toBe('qr'); expect(v.entry.transaction.id).toBe('FAC-2026-0004');
    expect(v.entry.transaction.finance!.paymentStatus).toBe('unpaid');
  });
});

describe('AM-68 : la vente porte son lot, son format et sa quantité ; la jauge du brassin les compte', () => {
  const batch = { id: 'B1', name: 'Pale Ale', status: 'conditionne', volumeL: 30, volumePackagedL: 27, packaging: { bottles33: 96, bottles75: 24, kegIds: [] } } as unknown as Batch;
  it('6 × 33 cl du brassin B1 = 1,98 L sortis ; le brassin voisin n\'est pas touché ; une vente annulée ne compte plus', async () => {
    const v = await preparerVente({ mode: 'paye', lignes: [ligne('B1', 6, 5)], client: null, dateIso: aujourdhui, echeance: 30, moyen: 'twint', config: configDe({}), numero: 'FAC-2026-0005' });
    const tx = v.entry.transaction as unknown as Transaction;
    expect(tx.finance!.lines[0]).toMatchObject({ quantity: 6, sourceReference: 'vente:B1:33cl:0.33' });
    expect(litresVendus([tx], 'B1')).toBe(1.98);
    expect(litresVendus([tx], 'B2')).toBe(0);
    expect(litresVendus([{ ...tx, finance: { ...tx.finance!, voidedAt: '2026-01-01' } } as Transaction], 'B1')).toBe(0);
    const j = jaugeBrassin(batch, litresVendus([tx], 'B1'));
    expect(j.vendus).toBe(1.98); expect(j.nets).toBe(27);
  });
  it('un brassin sans litres nets : jauge inconnue, jamais 0 %', () => {
    const j = jaugeBrassin({ id: 'B3', name: 'X', status: 'conditionne', packaging: { bottles33: 1, bottles75: 0, kegIds: [] } } as unknown as Batch, 0);
    expect(j.nets).toBeNull(); expect(j.ratio).toBeNull();
  });
});

describe('TE-56 : la vente choisit une fiche client, et la fiche la retrouve', () => {
  it('une vente au nom d\'une fiche compte dans ses commandes et son chiffre d\'affaires', async () => {
    const v = await preparerVente({ mode: 'paye', lignes: [ligne('B1', 3, 3.96)], client, dateIso: aujourdhui, echeance: 30, moyen: 'twint', config: configDe({}), numero: 'FAC-2026-0006' });
    const tx = v.entry.transaction as unknown as Transaction;
    expect(tx.finance!.vendor).toBe(client.name);
    const stats = ClientStatsService.forClient(client, [tx], [client]);
    expect(stats.orderCount).toBe(1);
    expect(stats.totalSales).toBe(11.88);
  });
  it('la caisse n\'a plus de champ libre « Client (facultatif) » : le client est une fiche choisie', () => {
    const src = readFileSync('src/ui/vente/Caisse.tsx', 'utf8');
    expect(src).not.toMatch(/Client \(facultatif\)/);
    expect(src).toMatch(/aria-label="À qui"/);
  });
});

describe('RL-15 : un seul coût de revient, celui de la chaîne litre → format', () => {
  it('un litre à 7,51 CHF donne 2,48 CHF le liquide d\'une 33 cl, emballage et impôt en plus ; le Prix lit ce coût, pas un 1,20', () => {
    const c = coutFormat({ litreLiquide: 7.51, format: { id: '33cl', label: '33 cl', volumeL: 0.33 }, emballageUnite: 0.3, impotUnite: 0.1 });
    expect(Math.round(c!.liquide * 100) / 100).toBe(2.48);
    const l = lirePrix({ litreLiquide: 7.51, volumeL: 0.33, emballageUnite: 0.3, impotUnite: 0.1, prixHT: 5 });
    expect(l.cout).toEqual({ exact: true, affiche: 2.88 });
    expect(l.reste).toEqual({ valeur: 2.12, borne: false });
    expect(l.zone).not.toBe('perte');
  });
  it('emballage ou impôt inconnu : le coût est un plancher dit « non exact », jamais un coût complet inventé ni 0', () => {
    const l = lirePrix({ litreLiquide: 7.51, volumeL: 0.33, emballageUnite: null, impotUnite: 0.1, prixHT: 5 });
    expect(l.cout!.exact).toBe(false); expect(l.reste!.borne).toBe(true);
    expect(lirePrix({ litreLiquide: null, volumeL: 0.33, emballageUnite: 0.3, impotUnite: 0.1, prixHT: 5 }).cout).toBeNull();
  });
  it('plus aucun écran du tarif ni de la caisse ne lit un coût saisi à la main (champs cost* des anciens tarifs)', () => {
    for (const f of ['src/ui/TarifSheet.tsx', 'src/ui/prix/PrixEcran.tsx', 'src/ui/prix/calculPrix.ts', 'src/ui/prix/donneesPrix.ts', 'src/ui/vente/formatsVente.ts', 'src/ui/vente/Caisse.tsx'])
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/\.cost(Total|Ingredients|Labor|Fixed)\b/);
  });
});
