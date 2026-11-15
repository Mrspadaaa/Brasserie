import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
const state = vi.hoisted(() => ({ save: vi.fn(), generate: vi.fn(), download: vi.fn(), qr: vi.fn() }));
vi.mock('../../src/services/incomeEntry', () => ({ saveIncomeEntry: (...args: any[]) => state.save(...args), saveIncomeEntryInBackground: async (...args: any[]) => ({ receipt: await state.save(...args), queued: false, confirmed: true }) }));
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null }, storage: {} }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('../../src/services/swissQrBill', async importOriginal => {
  const o = await importOriginal<any>();
  return { ...o, preparerQrFacture: (e: any) => state.qr(e, o.preparerQrFacture), SwissQrBillService: { generateInvoicePdf: (...args: any[]) => state.generate(...args) } };
});
import { QuickActionModal } from '../../src/components/QuickActionModal';
import { StorageService } from '../../src/services/storage';
import { ReceiptService } from '../../src/services/receiptService';
import { QrFactureInvalide } from '../../src/services/swissQrBill';
import { effacerBrouillon } from '../../src/ui/vente/brouillon';
import type { AppConfig, Batch, Client, PricingItem, Transaction } from '../../src/types';

// IBAN d'EXEMPLE public du guide SIX (jamais un vrai).
const IBAN_TEST = 'CH93 0076 2011 6238 5295 7';
const ANNEE = new Date().getFullYear();
const configDe = (fiscal: Partial<AppConfig['fiscal']> = {}, company: Partial<AppConfig['company']> = {}): AppConfig => ({
  fiscal: { isTvaRegistered: false, tvaNormalRate: 0.081, ...fiscal },
  company: { name: 'Brasserie Test', owner: '', uid: 'CHE-123.456.789', iban: IBAN_TEST, address: '', npa: '', canton: '', founded: '', activity: '', communeContact: '',
    adresse: { rue: 'Rue du Test', numero: '1', npa: '1700', localite: 'Fribourg', pays: 'CH' }, ...company },
  brewhouses: []
} as unknown as AppConfig);
const clients: Client[] = [
  { id: 'C1', name: 'Café du Bourg', type: 'Pro', contact: '', phone: '', email: '' },
  { id: 'C2', name: 'Martin Rey', type: 'Privé', contact: '', phone: '', email: '', adresse: { rue: 'Chemin des Fixtures', numero: '4', npa: '1700', localite: 'Fribourg', pays: 'CH' } }
];
const batch = { id: 'B1', name: 'Pale Ale', style: 'Pale Ale', status: 'conditionne', brewDate: '2026-09-05', volumeL: 30, volumePackagedL: 27, packaging: { bottles33: 96, bottles75: 24, kegIds: [] } } as unknown as Batch;
const tarif = (product: string, priceHT: number): PricingItem => ({ product, costIngredients: 0, costLabor: 0, costFixed: 0, costTotal: 0, priceHT, marginCHF: 0, marginPercent: 0 });
const tarifs = [tarif('Pale Ale 33 cl', 5), tarif('Pale Ale 75 cl', 10)]; // pas de fût : « prix ? »

let message: ReturnType<typeof vi.fn>, close: ReturnType<typeof vi.fn>;
let ledger: Transaction[];
const preparer = (config = configDe()) => {
  vi.spyOn(StorageService, 'getConfig').mockReturnValue(config);
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] } as any);
  vi.spyOn(StorageService, 'getClients').mockReturnValue(clients);
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([batch]);
  vi.spyOn(StorageService, 'getTarifs').mockReturnValue(tarifs);
  vi.spyOn(StorageService, 'getTransactions').mockImplementation(() => ledger);
};
beforeEach(() => {
  effacerBrouillon(); ledger = []; message = vi.fn(); close = vi.fn();
  state.save.mockReset().mockResolvedValue(undefined);
  state.download.mockReset();
  state.generate.mockReset().mockReturnValue({ dataUrl: 'data:application/pdf;filename=test.pdf;base64,JVBERg==', fileName: 'Facture.pdf', doc: { save: state.download }, totals: {} });
  state.qr.mockReset().mockImplementation((e: any, orig: any) => orig({ ...e, rasteriser: async () => `data:image/png;base64,${'A'.repeat(1500)}` }));
  vi.spyOn(ReceiptService, 'generateReceiptPdf').mockReturnValue({ doc: { save: state.download } as any, dataUrl: 'data:application/pdf;filename=q.pdf;base64,JVBERg==', fileName: 'Quittance.pdf' });
  preparer();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const ouvrir = () => render(<QuickActionModal isOpen recipes={[]} onClose={close as any} onSuccessMessage={message as any} initialScreen="quick-sale" />);
const tuile = (nom: RegExp) => screen.getByRole('button', { name: nom });
const ajouter = (nom: RegExp, fois: number) => { for (let i = 0; i < fois; i++) fireEvent.click(tuile(nom)); };
const total = () => screen.getByLabelText('Total');
const primaire = () => screen.getByRole('button', { name: /^(Facturer|Encaisser|Reprendre la confirmation|Enregistrement)/ });
const choisirClient = (nom: RegExp) => fireEvent.click(screen.getByRole('button', { name: nom }));
const lignePrix = (qte: string, prix: string, designation = 'Consigne') => {
  fireEvent.click(tuile(/^Autre/));
  fireEvent.change(screen.getByPlaceholderText('Consigne, verres…'), { target: { value: designation } });
  fireEvent.change(screen.getByLabelText('Quantité'), { target: { value: qte } });
  fireEvent.change(screen.getByLabelText('Prix unitaire'), { target: { value: prix } });
  fireEvent.click(screen.getByRole('button', { name: 'Ajouter la ligne' }));
};

describe('La caisse : un seul écran de vente', () => {
  it('« Vendre » du menu ouvre la caisse dans UN dialogue « Vendre » ; l\'ancien écran n\'existe plus', () => {
    render(<QuickActionModal isOpen recipes={[]} onClose={close as any} />);
    fireEvent.click(screen.getByRole('button', { name: 'Vendre' }));
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog', { name: 'Vendre' })).toHaveFocus();
    expect(screen.queryByLabelText('Montant TTC encaissé')).toBeNull();
    expect(screen.queryByText('Encaisser une vente')).toBeNull();
    expect(screen.getByRole('group', { name: 'À qui' })).toBeTruthy();
  });
  it('ni QuickActionModal ni ClientsTab n\'importent plus InvoiceSheet', () => {
    for (const f of ['src/components/QuickActionModal.tsx', 'src/components/tabs/ClientsTab.tsx']) expect(readFileSync(f, 'utf8')).not.toMatch(/InvoiceSheet/);
  });
  it('le panier : 24 × 33 cl à 5,00 et 6 × 75 cl à 10,00 = 180,00 ; « − » retire une ; le fût sans tarif dit « prix ? »', () => {
    ouvrir();
    ajouter(/^33 cl/, 24); ajouter(/^75 cl/, 6);
    expect(total()).toHaveTextContent('180,00');
    expect(screen.getByText('24 × 33 cl')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retirer un 33 cl' }));
    expect(total()).toHaveTextContent('175,00');
    expect(tuile(/^fût 20 L/)).toHaveTextContent('prix ?');
  });
  it('un fût sans tarif ouvre la ligne libre prérempli : sans prix, refus (« jamais 0 ») et le total reste vide', () => {
    ouvrir();
    fireEvent.click(tuile(/^fût 20 L/));
    expect((screen.getByPlaceholderText('Consigne, verres…') as HTMLInputElement).value).toBe('Pale Ale · fût 20 L');
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter la ligne' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/indique son prix/i);
    fireEvent.change(screen.getByLabelText('Prix unitaire'), { target: { value: '-1' } });
    expect((screen.getByLabelText('Prix unitaire') as HTMLInputElement).title).toMatch(/négative/);
    expect(total()).toHaveTextContent('—');
  });
  it('la jauge montre les litres notés depuis la caisse (24 × 0,33 + 6 × 0,75 = 12,4) sur 27 L nets', () => {
    ledger = [{ id: 'T1', date: '2026-11-09', description: 'v', amountHT: 180, amountTTC: 180, tvaAmount: 0, tvaRate: 0, category: 'recettes', subcategory: '',
      finance: { version: 1, kind: 'income', amountCents: 18000, lines: [
        { id: 'a', description: 'x', kind: 'other', amountCents: 12000, quantity: 24, sourceReference: 'vente:B1:33cl:0.33' },
        { id: 'b', description: 'y', kind: 'other', amountCents: 6000, quantity: 6, sourceReference: 'vente:B1:75cl:0.75' }] } } as Transaction];
    ouvrir();
    expect(screen.getByRole('button', { name: /Pale Ale/ })).toHaveTextContent('12,4/27 L nets');
  });
});

describe('Facture QR', () => {
  it('Facturer : une écriture « à encaisser », n° continu, lignes liées au brassin et au format, échéance 30 j', async () => {
    ouvrir(); choisirClient(/Martin Rey/);
    ajouter(/^33 cl/, 24); ajouter(/^75 cl/, 6);
    fireEvent.click(primaire());
    await waitFor(() => expect(state.save).toHaveBeenCalledOnce());
    const { transaction: tx } = state.save.mock.calls[0][0];
    expect(tx.id).toBe(`FAC-${ANNEE}-0001`);
    expect(tx.finance).toMatchObject({ kind: 'income', amountCents: 18000, paymentStatus: 'unpaid', invoiceNumber: `FAC-${ANNEE}-0001`, batchId: 'B1' });
    expect(tx.finance.lines.map((l: any) => l.sourceReference)).toEqual(['vente:B1:33cl:0.33', 'vente:B1:75cl:0.75']);
    expect(tx.description).toContain('24 × Pale Ale · 33 cl');
    expect(tx.description).toContain('6 × Pale Ale · 75 cl');
    const [, , , numero, options] = state.generate.mock.calls[0];
    expect(numero).toBe(`FAC-${ANNEE}-0001`);
    expect(options.debiteur?.nom).toBe('Martin Rey');
    expect(options.qr).toBeTruthy();
    expect(await screen.findByRole('status')).toHaveTextContent(`Facture FAC-${ANNEE}-0001 enregistrée`);
  });
  it('le numéro suit le grand livre : 0002 quand 0001 existe', async () => {
    ledger = [{ id: `FAC-${ANNEE}-0001`, date: `${ANNEE}-01-05`, description: 'f', amountHT: 1, amountTTC: 1, tvaAmount: 0, tvaRate: 0, category: 'recettes', subcategory: '',
      finance: { version: 1, kind: 'income', amountCents: 100, invoiceNumber: `FAC-${ANNEE}-0001`, lines: [] } } as Transaction];
    ouvrir(); choisirClient(/Martin Rey/); ajouter(/^33 cl/, 1);
    fireEvent.click(primaire());
    await waitFor(() => expect(state.save).toHaveBeenCalledOnce());
    expect(state.save.mock.calls[0][0].transaction.id).toBe(`FAC-${ANNEE}-0002`);
  });
  it('Comptoir : « Facture QR » éteinte, la bande dit qu\'une facture a besoin d\'un client', () => {
    ouvrir(); ajouter(/^33 cl/, 1);
    const qr = screen.getByRole('button', { name: /Facture QR/ });
    expect(qr).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(qr);
    expect(screen.getByText('une facture a besoin d’un client')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Payé ici/ })).toHaveAttribute('aria-pressed', 'true');
  });
  it('un client sans adresse : la facture QR reste permise, sans débiteur, la bande dit « adresse ? »', async () => {
    ouvrir(); choisirClient(/Café du Bourg/); ajouter(/^33 cl/, 2);
    expect(screen.getByText('adresse ?')).toBeTruthy();
    fireEvent.click(primaire());
    await waitFor(() => expect(state.save).toHaveBeenCalledOnce());
    expect(state.generate.mock.calls[0][4].debiteur).toBeUndefined();
  });
  it('hors ligne (QR indisponible) : rien n\'est enregistré, la bande le dit et propose « Réessayer »', async () => {
    state.qr.mockRejectedValue(new QrFactureInvalide(['Hors ligne : QR indisponible. Aucune facture sans QR n\'est enregistrée.']));
    ouvrir(); choisirClient(/Martin Rey/); ajouter(/^33 cl/, 1);
    expect(await screen.findByText(/Hors ligne : QR indisponible/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeTruthy();
    expect(primaire()).toBeDisabled();
    expect(state.save).not.toHaveBeenCalled();
  });
  it('brasserie incomplète (gabarit « Ville ») : « Facture QR » bloquée, « adresse de la brasserie ? » avec son bouton', () => {
    preparer(configDe({}, { adresse: undefined, address: 'Rue de l\'Exemple 1', npa: '1000 Ville' }));
    ouvrir(); choisirClient(/Martin Rey/); ajouter(/^33 cl/, 1);
    expect(screen.getByText('adresse de la brasserie ?')).toBeTruthy();
    expect(screen.getByRole('button', { name: '+ adresse' })).toBeTruthy();
    expect(primaire()).toBeDisabled();
    expect(state.generate).not.toHaveBeenCalled();
  });
  it('assujetti avec l\'UID du gabarit : « n° UID ? » bloque les deux modes', () => {
    preparer(configDe({ isTvaRegistered: true }, { uid: 'CHE-XXX.XXX.XXX' }));
    ouvrir(); ajouter(/^33 cl/, 1); fireEvent.click(screen.getByRole('button', { name: 'TWINT' }));
    expect(screen.getByText('n° UID ?')).toBeTruthy();
    expect(primaire()).toBeDisabled();
  });
  it('la date de l\'annexe se touche : 2025 donne FAC-2025-0001 et l\'échéance suit ; 2062 est refusée', async () => {
    ledger = [{ id: `FAC-${ANNEE}-0007`, date: `${ANNEE}-01-05`, description: 'f', amountHT: 1, amountTTC: 1, tvaAmount: 0, tvaRate: 0, category: 'recettes', subcategory: '',
      finance: { version: 1, kind: 'income', amountCents: 100, invoiceNumber: `FAC-${ANNEE}-0007`, lines: [] } } as Transaction];
    ouvrir(); choisirClient(/Martin Rey/); ajouter(/^33 cl/, 1);
    fireEvent.click(screen.getByRole('button', { name: 'Date de la facture' }));
    fireEvent.change(screen.getByLabelText('Choisir la date'), { target: { value: '2025-03-01' } });
    expect(screen.getByText('FAC-2025-0001')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '10 j' }));
    fireEvent.click(primaire());
    await waitFor(() => expect(state.save).toHaveBeenCalledOnce());
    expect(state.save.mock.calls[0][0].transaction.id).toBe('FAC-2025-0001');
    expect(state.save.mock.calls[0][0].transaction.finance.dueDate).toBe('2025-03-11');
  });
  it('une date en 2062 est refusée : alerte, bouton éteint', () => {
    ouvrir(); choisirClient(/Martin Rey/); ajouter(/^33 cl/, 1);
    fireEvent.click(screen.getByRole('button', { name: 'Date de la facture' }));
    fireEvent.change(screen.getByLabelText('Choisir la date'), { target: { value: '2062-11-08' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/plus d’un an/);
    expect(primaire()).toBeDisabled();
  });
  it('le partage annulé ne réenregistre jamais : « Envoyer le PDF » rappelle le PDF, pas saveIncomeEntry', async () => {
    ouvrir(); choisirClient(/Martin Rey/); ajouter(/^33 cl/, 1);
    fireEvent.click(primaire());
    await screen.findByText(/enregistrée/);
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le PDF' }));
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le PDF' }));
    await waitFor(() => expect(state.download).toHaveBeenCalledTimes(2));
    expect(state.save).toHaveBeenCalledOnce();
    expect(state.generate).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle vente' }));
    expect(total()).toHaveTextContent('—');
  });
});

describe('Payé ici', () => {
  const entree = () => state.save.mock.calls[0][0];
  it('exige TWINT ou espèces : sans choix le bouton attend ; l\'écriture porte le moyen et toutes les lignes', async () => {
    ouvrir(); ajouter(/^33 cl/, 3); ajouter(/^75 cl/, 1);
    expect(primaire()).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'TWINT' }));
    fireEvent.click(primaire());
    await waitFor(() => expect(state.save).toHaveBeenCalledOnce());
    expect(entree().payment).toMatchObject({ method: 'twint', direction: 'in', amountCents: 2500, transactionId: entree().transaction.id });
    expect(entree().transaction.finance.lines.map((l: any) => l.sourceReference)).toEqual(['vente:B1:33cl:0.33', 'vente:B1:75cl:0.75']);
    await waitFor(() => expect(close).toHaveBeenCalled());
  });
  it.each([false, true])('TTC = somme des lignes au centime, HT + TVA = TTC (assujetti=%s)', async assujetti => {
    preparer(configDe({ isTvaRegistered: assujetti }));
    ouvrir(); ajouter(/^33 cl/, 3); ajouter(/^75 cl/, 1);
    fireEvent.click(screen.getByRole('button', { name: 'Espèces' }));
    fireEvent.click(primaire());
    await waitFor(() => expect(state.save).toHaveBeenCalledOnce());
    const { transaction: tx } = entree(), cents = (x: number) => Math.round(x * 100);
    expect(cents(tx.amountHT) + cents(tx.tvaAmount)).toBe(cents(tx.amountTTC));
    expect(tx.finance.lines.reduce((n: number, l: any) => n + l.amountCents, 0)).toBe(tx.finance.amountCents);
    expect(tx.finance.amountCents).toBe(cents(tx.amountTTC));
    if (assujetti) expect([cents(tx.amountHT), cents(tx.tvaAmount), cents(tx.amountTTC)]).toEqual([2500, 203, 2703]);
    const recu = (ReceiptService.generateReceiptPdf as any).mock.calls[0][0];
    expect(recu.beerName).toContain('3 × Pale Ale · 33 cl');
    expect(recu.beerName).toContain('1 × Pale Ale · 75 cl');
    expect(recu.paymentMethod).toBe('Espèces');
  });
  it('MV-38 : 54 000 CHF dépasse la borne : alerte, bouton éteint, rien enregistré', () => {
    ouvrir(); lignePrix('6', '9000');
    fireEvent.click(screen.getByRole('button', { name: 'TWINT' }));
    expect(screen.getByText(/dépasse 50.000 CHF/)).toBeTruthy();
    expect(primaire()).toBeDisabled();
    fireEvent.click(primaire());
    expect(state.save).not.toHaveBeenCalled();
  });
  it('TE-55 : sans preuve Drive le message ne dit pas « dans Drive » ; avec, il le dit', async () => {
    ouvrir(); lignePrix('1', '1');
    fireEvent.click(screen.getByRole('button', { name: 'TWINT' })); fireEvent.click(primaire());
    await waitFor(() => expect(message).toHaveBeenCalled());
    const texte: string = message.mock.calls[0][0];
    expect(texte).toContain('1,00 CHF'); expect(texte).toContain('pas dans Drive'); expect(texte).not.toMatch(/conservée dans Drive/);
    cleanup(); effacerBrouillon(); message.mockClear(); state.save.mockReset().mockResolvedValue({ driveFileId: 'abc' });
    ouvrir(); lignePrix('1', '1');
    fireEvent.click(screen.getByRole('button', { name: 'TWINT' })); fireEvent.click(primaire());
    await waitFor(() => expect(message).toHaveBeenCalled());
    expect(message.mock.calls[0][0]).toContain('Quittance conservée dans Drive.');
  });
});

describe('Enregistrement : hors ligne, double toucher, fermeture', () => {
  it.each(['qr', 'paye'] as const)('hors ligne (%s) : saveIncomeEntry rejeté, message dans la bande, la reprise rejoue la MÊME entrée', async mode => {
    state.save.mockRejectedValueOnce(new Error('Hors ligne : l\'enregistrement attend le réseau.'));
    ouvrir();
    if (mode === 'qr') choisirClient(/Martin Rey/);
    ajouter(/^33 cl/, 1);
    if (mode === 'paye') fireEvent.click(screen.getByRole('button', { name: 'TWINT' }));
    fireEvent.click(primaire());
    expect(await screen.findByRole('alert')).toHaveTextContent(/attend le réseau/);
    expect(close).not.toHaveBeenCalled();
    const premiere = state.save.mock.calls[0][0];
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre la confirmation' }));
    await waitFor(() => expect(state.save).toHaveBeenCalledTimes(2));
    expect(state.save.mock.calls[1][0]).toBe(premiere);
    expect(state.generate.mock.calls.length + (ReceiptService.generateReceiptPdf as any).mock.calls.length).toBe(1);
  });
  it('deux clics synchrones sur Facturer, le QR encore en préparation : une seule écriture, un seul PDF', async () => {
    let ouvrirPorte!: () => void;
    const porte = new Promise<void>(r => { ouvrirPorte = r; });
    state.qr.mockImplementation(async (e: any, orig: any) => { await porte; return orig({ ...e, rasteriser: async () => `data:image/png;base64,${'A'.repeat(1500)}` }); });
    ouvrir(); choisirClient(/Martin Rey/); ajouter(/^33 cl/, 1);
    const bouton = primaire();
    /* Deux clics dans le MÊME lot de rendu : le bouton n'a pas eu le temps de s'éteindre, seule la garde `busy` (posée avant le premier await) les distingue. */
    act(() => { bouton.click(); bouton.click(); });
    ouvrirPorte();
    await waitFor(() => expect(state.save).toHaveBeenCalledOnce());
    expect(state.generate).toHaveBeenCalledOnce();
  });
  it('rejet, fermeture (avertie), réouverture : la même entrée se reprend, jamais une 2e vente ni un 2e numéro', async () => {
    state.save.mockRejectedValueOnce(new Error('Confirmation en attente'));
    const vue = ouvrir(); choisirClient(/Martin Rey/); ajouter(/^33 cl/, 1);
    fireEvent.click(primaire());
    expect(await screen.findByRole('alert')).toHaveTextContent('Confirmation en attente');
    const premiere = state.save.mock.calls[0][0];
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByText(/écriture locale existe déjà/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(close).toHaveBeenCalledOnce();
    vue.unmount(); cleanup();
    ouvrir();
    expect(screen.getByRole('button', { name: /Martin Rey/ })).toHaveAttribute('aria-pressed', 'true');
    expect(total()).toHaveTextContent('5,00');
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre la confirmation' }));
    await waitFor(() => expect(state.save).toHaveBeenCalledTimes(2));
    expect(state.save.mock.calls[1][0]).toBe(premiere);
    expect(state.generate).toHaveBeenCalledOnce();
  });
  it('× et Échap sont bloqués pendant l\'enregistrement', async () => {
    let fin!: () => void;
    state.save.mockImplementation(() => new Promise<void>(r => { fin = r; }));
    ouvrir(); choisirClient(/Martin Rey/); ajouter(/^33 cl/, 1);
    fireEvent.click(primaire());
    await waitFor(() => expect(state.save).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(close).not.toHaveBeenCalled();
    fin();
    await screen.findByText(/enregistrée/);
  });
});

describe('Clients › fiche › Facturer ouvre la même caisse', () => {
  it('la caisse s\'ouvre, le client est choisi, un seul dialogue « Vendre »', async () => {
    const { ClientsTab } = await import('../../src/components/tabs/ClientsTab');
    render(<ClientsTab clients={clients} batches={[batch]} tarifs={tarifs} config={configDe()} onOpenQuickAction={() => {}} />);
    fireEvent.click(screen.getByText('Café du Bourg'));
    const ligneClient = screen.getByText('Café du Bourg').closest('details')!;
    fireEvent.click(within(ligneClient).getByRole('button', { name: 'Facturer' }));
    const dialogue = await screen.findByRole('dialog', { name: 'Vendre' });
    expect(within(dialogue).getByRole('button', { name: /Café du Bourg/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });
});

describe('Constats du test d\'écran (vx, 09.11)', () => {
  it('1 et 2 : un PDF trop lourd est dit avec les mots de la caisse (« facture »), rien n\'est enregistré, jamais « justificatif »', async () => {
    state.generate.mockReturnValue({ dataUrl: `data:application/pdf;base64,${'A'.repeat(5_700_000)}`, fileName: 'Facture.pdf', doc: { save: state.download }, totals: {} });
    ouvrir(); choisirClient(/Martin Rey/); ajouter(/^33 cl/, 1);
    fireEvent.click(primaire());
    const alerte = await screen.findByText(/n’a pas pu être produite/);
    expect(alerte).toHaveTextContent('La facture n’a pas pu être produite');
    expect(alerte).toHaveTextContent('Rien n’est enregistré');
    expect(screen.queryByText(/ustificatif/)).toBeNull();
    expect(state.save).not.toHaveBeenCalled();
  });
  it('3 : sans vente notée depuis la caisse, la jauge ne dit pas « 0,0/27 » (inconnu, jamais 0) : « 27 L nets », barre hachurée', () => {
    ouvrir();
    const bouton = screen.getByRole('button', { name: /Pale Ale/ });
    expect(bouton).toHaveTextContent('27 L nets');
    expect(bouton).not.toHaveTextContent('0,0');
    expect(bouton.querySelector('.cs-jg')).toHaveAttribute('data-inconnu');
  });
  it('4 : Échap ou × avec un panier plein avertit d\'abord, puis ferme au second appui ; un panier qui change réarme l\'avertissement', () => {
    ouvrir(); ajouter(/^33 cl/, 24); ajouter(/^75 cl/, 6);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Le panier (2 lignes) sera perdu');
    ajouter(/^33 cl/, 1);
    expect(screen.queryByText(/Le panier \(/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Le panier (2 lignes) sera perdu');
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(close).toHaveBeenCalledTimes(1);
  });
  it('4b : un panier vide se ferme sans avertir', () => {
    ouvrir();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(close).toHaveBeenCalledTimes(1);
  });
  it('5 : la quittance n\'emploie pas « une ligne » : elle liste les articles', () => {
    ouvrir(); ajouter(/^33 cl/, 24); ajouter(/^75 cl/, 6);
    const quittance = screen.getByLabelText('Aperçu de la quittance');
    expect(quittance).toHaveTextContent('24 × Pale Ale · 33 cl · 6 × Pale Ale · 75 cl');
    expect(quittance).not.toHaveTextContent(/une ligne/);
  });
  it('6 : les initiales ignorent la particule : Café du Bourg → CB, Martin Rey → MR', () => {
    ouvrir();
    expect(within(screen.getByRole('button', { name: /Café du Bourg/ })).getByText('CB')).toBeTruthy();
    expect(within(screen.getByRole('button', { name: /Martin Rey/ })).getByText('MR')).toBeTruthy();
  });
  it('7 : l\'en-tête de l\'annexe peut passer à la ligne sans couper « n° … · date » (nom de brasserie à deux mots)', () => {
    const css = readFileSync('src/ui/vente/caisse.css', 'utf8');
    expect(css).toMatch(/\.cs-dh \{[^}]*flex-wrap: wrap/);
    expect(css).toMatch(/\.cs-dh > div:first-child \{[^}]*white-space: nowrap/);
  });
  it('8 : la caisse seule (Clients › Facturer) a le même en-tête que « + › Vendre » : étincelle, titre, × plat « Fermer »', async () => {
    const hote = render(<QuickActionModal isOpen recipes={[]} onClose={close as any} initialScreen="quick-sale" />);
    const enteteHote = within(screen.getByRole('dialog')).getByRole('button', { name: 'Fermer' }).className;
    const iconeHote = screen.getByRole('dialog').querySelector('h2')!.previousElementSibling!.getAttribute('class');
    hote.unmount(); cleanup();
    const { Caisse } = await import('../../src/ui/vente/Caisse');
    render(<Caisse onClose={close as any} />);
    const seule = screen.getByRole('dialog', { name: 'Vendre' });
    expect(within(seule).getByRole('button', { name: 'Fermer' }).className).toBe(enteteHote);
    expect(seule.querySelector('h2')!.previousElementSibling!.getAttribute('class')).toBe(iconeHote);
    expect(within(seule).queryByRole('button', { name: 'Fermer la vente' })).toBeNull();
  });
});
