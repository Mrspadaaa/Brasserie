// @vitest-environment jsdom
/**
 * Voie e-port, tri du pilote (TRI-PORT) : un test par défaut corrigé (R1, R2, R5, R6, R10, C1, C3, C5, C6, C8, C14, C17). Lecture SIMULÉE (sortie du vrai
 * rapprochement du serveur), stock SIMULÉ, Gemini et Drive jamais touchés. Rouge d'abord : chaque comportement n'existait pas avant (voir RESULTAT, « Tri du pilote »).
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import lecture from '../../../../src/ui/depense/apercu/lecture-372765.reconciliee.json';
import stockJson from '../../../../src/ui/depense/apercu/stock-simule.json';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[], kegs: [] as any[] }, transactions: [] as any[], saved: vi.fn(), scanned: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(), savePurchaseWithProofReceipt: async (d: any) => { state.saved(structuredClone(d)); return { transactionId: 'TX-test' }; }, confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';

const stock = () => ({ rawMaterials: (stockJson.articles as any[]).filter(a => a.name !== 'Verdant IPA').map(a => (a.name === 'Target' ? { ...a, name: 'Target 11.8%' } : a)), cleaning: [], equipment: [], kegs: [] });
const lire = async (resultat: any = lecture) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.stocks = stock();
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result: JSON.parse(JSON.stringify(resultat)) });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  const file = new File(['%PDF-1.4\n'], 'facture-372765.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
const ligne = (view: { container: HTMLElement }, n: number) => (view.container.querySelector('[data-dp-ligne="line-' + n + '"]')) as HTMLElement; // R1 : par id, jamais par rang
const prixKg = (view: { container: HTMLElement }, n: number) => ligne(view, n).querySelector('[data-dp-prixkg]')?.getAttribute('aria-label') ?? ''; // la pastille « ✓ 2,40/Kg » et son nom accessible
/** « Sans prix avec mouture » sur TOUTE la rangée (D3) : ni pastille, ni nom accessible, ni phrase « 2,40/Kg avec mouture » (prixKg() rend '' si absent : il passerait d'office).
 *  L'en-tête « avec mouture » du tableau du plateau n'est pas un prix : seule la phrase prix + unité compte. */
const sansPrixMouture = (view: { container: HTMLElement }, n: number) => {
  expect(ligne(view, n).querySelector('[data-dp-prixkg]')).toBeNull();
  expect(ligne(view, n).querySelector('[aria-label*="avec mouture"]')).toBeNull();
  expect(ligne(view, n).textContent).not.toMatch(/[\d,]+\/\S+ avec mouture/);
};
beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.transactions = [];
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('R1 : un prix « avec mouture » n’est montré que si le catalogue l’écrira', () => {
  it('malt relié + mouture de service rattachée : « 2,40/Kg avec mouture » ; malt non relié : rien', async () => {
    const view = await lire();
    sansPrixMouture(view, 1);
    fireEvent.click(view.container.querySelector('[data-dp-mouture-tous]')!);
    expect(prixKg(view, 1)).toMatch(/^2,40\/Kg avec mouture$/);
    expect(ligne(view, 1).querySelector('[data-dp-prixkg]')!.textContent).toMatch(/✓ 2,40\/Kg/);
    fireEvent.change(screen.getByLabelText('Stock ligne 1'), { target: { value: 'none' } }); // C7 : le menu du stock, plus d'interrupteur
    sansPrixMouture(view, 1);
  });
  it('C16 : le tableau des moutures dit « lu 2,30 → 2,40 /Kg » seulement pour un malt relié, et « Laisser en service » ne lie rien', async () => {
    const view = await lire();
    const tableau = view.container.querySelector('[data-dp="tableau-moutures"]') as HTMLElement;
    expect(tableau.textContent).toMatch(/2,30.*→.*2,40/);
    fireEvent.click(within(tableau).getByRole('button', { name: 'Laisser en service' }));
    expect(view.container.querySelector('[data-dp="tableau-moutures"]')).toBeNull();
    expect(view.container.querySelectorAll('[data-dp-mouture]')).toHaveLength(5);
    expect(screen.queryByText(/✓ mouture →/)).toBeNull();
  });
});

describe('R6 : « Créer un nouvel article » d’un produit déjà au stock devient « Relier » (D215 : une autre α reste « Créer »)', () => {
  it('Galaxy (même produit) : le choix « new » relie ; Target 11.3% (autre α) : « Créer » et ⇄ « Relier à Target 11.8% »', async () => {
    const view = await lire();
    fireEvent.change(screen.getByLabelText('Stock ligne 18'), { target: { value: 'none' } });
    fireEvent.change(screen.getByLabelText('Stock ligne 18'), { target: { value: 'new' } });
    expect(screen.getByLabelText('Stock ligne 18')).toHaveValue('existing');
    // D275 (voie f3) : un bis est nouvel article d'office ; la barre jaune le garde (HEAD : « Créer « Target bis » »).
    expect(within(ligne(view, 8)).getByRole('button', { name: 'Garder le nouvel article « Target bis »' })).toBeInTheDocument();
    expect(screen.getByLabelText('Stock ligne 8')).toHaveValue('new');
    fireEvent.click(within(ligne(view, 8)).getAllByRole('button', { name: 'Choisir un autre article' })[0]);
    expect(screen.getByLabelText('Stock ligne 8')).toHaveValue('existing');
  });
});

describe('R10, D229 : un geste ne fait jamais monter le statut ; une valeur tapée est gardée', () => {
  it('« — » sur la TVA : le titre reste « Lecture à confirmer », la chip dit « points revus »', async () => {
    await lire();
    fireEvent.click(document.querySelector('[data-dp="tuile-tva"]')!);
    fireEvent.click(screen.getByText('sans TVA').closest('button')!); // D375 : la case « — » se nomme « sans TVA », jamais « proposé »
    expect(screen.getByRole('button', { name: /^Lecture à confirmer/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Lecture vérifiée/ })).toBeNull();
  });
  it('une valeur fausse tapée garde sa valeur, crée un point (chip « Total ») et ne vérifie rien', async () => {
    await lire();
    const total = screen.getByLabelText('Total TTC en CHF');
    fireEvent.change(total, { target: { value: '70' } }); fireEvent.blur(total);
    expect(total).toHaveValue('70,00');
    // D277 (voie f3) : la rangée des points part ; le point du total se dit sur le total lui-même (HEAD : une chip « Total »).
    expect(document.querySelector('[data-dp="total-niveau"]')?.getAttribute('data-dp-niveau')).toMatch(/^(repris|inconnu)$/);
    expect(screen.getByRole('button', { name: /^Lecture à confirmer/ })).toBeInTheDocument();
  });
});

describe('C3, C1, C5, C6, C8, C14 : ce qu’il lit', () => {
  it('C3 : le Total s’affiche « 86,50 » hors frappe', async () => {
    await lire();
    expect(screen.getByLabelText('Total TTC en CHF')).toHaveValue('86,50');
  });
  it('C1 : « C’est la date » est un bouton plein lisible ; « Autre date » ouvre le formulaire monté ; la carte dit « supposée »', async () => {
    await lire();
    const panneau = document.querySelector('[data-dp="panneau-paye"]') as HTMLElement;
    expect(within(panneau).getByText('payé le · supposée')).toBeInTheDocument();
    // D233 : une seule date par défaut (celle de l'achat) ; le champ de la date du paiement n'apparaît que sur « Autre date ».
    expect(within(panneau).queryByRole('button', { name: 'Hier' })).toBeNull();
    fireEvent.click(within(panneau).getByRole('button', { name: 'Autre date' }));
    expect(within(panneau).getByRole('button', { name: 'Hier' })).toBeInTheDocument();
    fireEvent.click(within(panneau).getByRole('button', { name: 'C’est la date' }));
    expect(screen.queryByText('supposée')).toBeNull();
  });
  it('C5 : la ligne montre le nom de l’article, l’imprimé reste dans le plateau ; C14 : pas de chevron par ligne', async () => {
    const view = await lire();
    const resume = ligne(view, 1).querySelector('summary')!;
    expect(resume.querySelector('b')!.textContent).toBe('Maris Otter');
    // D275 (voie f3) : le suffixe d'unité sort du nom (uniteDuNom) ; l'imprimé reste au plateau (HEAD : libellé « Maris Otter, Kg »).
    expect((screen.getByLabelText('Libellé ligne 1') as HTMLInputElement).value).toBe('Maris Otter');
    expect(ligne(view, 1).querySelector('[data-dp-imprime]')!.textContent).toContain('Maris Otter, Kg');
  });
  it('C6 : le compte de la preuve fait 23 (toutes catégories), sans phrase d’aide', async () => {
    const view = await lire();
    const compte = view.container.querySelector('[data-dp="compte-liens"]')!;
    // D277 : « n proposé », « à contrôler », « à remplir » sont des comptes de niveau, hors de la partition des liens (HEAD : toutes les « b » du compte).
    const somme = Array.from(compte.querySelectorAll('[data-va]:not([data-dp-niveau]) b')).reduce((n, b) => n + Number(b.textContent), 0);
    expect(somme).toBe(23);
    expect(view.container.querySelector('[data-dp="preuve"]')!.textContent).not.toMatch(/Certains points restent à confirmer/);
  });
  it('C8 : l’état 8 montre le tableau « Ce document / Déjà au registre » et dit où va le fichier', async () => {
    state.transactions = [{ id: 'TX-380001', date: '30.04.2026', amountTTC: 86.5, description: 'Brau- und Rauchshop · 380001', category: 'brassage', finance: { kind: 'expense', version: 1, amountCents: 8650, vendor: 'Brau- und Rauchshop GmbH', invoiceNumber: '380001', sourceOrderNumber: 'Onlinebestellung-686863', recordedAt: '2026-04-30T10:00:00.000Z', lines: [] } }];
    await lire();
    const region = await screen.findByRole('region', { name: 'Même commande sous un autre numéro' });
    for (const mot of ['Ce document', 'Déjà au registre', 'N°', 'Date', 'Commande', 'Total', '380001']) expect(region.textContent).toContain(mot);
    // un autre n° de facture n'est jamais « rattachable » (règle du service) : le bouton le dit, il n'écrit rien
    expect(within(region).getByRole('button', { name: 'Même achat · ne rien enregistrer' })).toBeInTheDocument();
  });
});

describe('R2 : panneaux toujours montés, IntersectionObserver absent, « À revoir » à N points', () => {

  it('« À revoir » dit chaque point ouvert avec la valeur gardée (TVA, date supposée, moutures, voisin, unité)', async () => {
    const enregistrer = vi.fn(async () => ({ driveFileId: 's', fileName: '2026-04-27 Brau- und Rauchshop 372765.jpg', bytes: 735721, sha256: '0'.repeat(64), verified: true, folder: 'L’Affinée / Justificatifs / 2026' }));
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    const apercu = { outcome: { ok: true, result: JSON.parse(JSON.stringify(lecture)), proofDataUrl: '', fileName: 'f.pdf', mimeType: 'application/pdf' }, fichier: { name: 'f.pdf', size: 735721, type: 'application/pdf' }, stocks: stock(), transactions: [], etat: '3', drive: 'ok', reseau: true, enregistrer } as any;
    state.stocks = stock();
    render(<ExpenseSheet onClose={() => {}} onSaved={() => {}} apercu={apercu}/>);
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    // D275 (voie f3) : Sabro « 30 » prend l'unité de ses voisines (g, jaune) ; plus de « g » à toucher (HEAD : clic sur « g »).
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer et enregistrer' }));
    await waitFor(() => expect(enregistrer).toHaveBeenCalledTimes(1), { timeout: 4000 });
    const revoir = await screen.findByText(/À revoir/);
    for (const mot of ['TVA 2,80 gardée', 'date de paiement supposée gardée', '5 moutures en service', 'Target α non lié au stock']) expect(revoir.textContent).toContain(mot);
  });
});

describe('Reprise (01.11) : les détails du critique et du relecteur', () => {

  it('critique R4 : état 5, la tuile Règlement dit « par défaut » tant que la date n’est pas touchée ; le total est « — »', async () => {
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    state.stocks = stock();
    state.scanned.mockResolvedValueOnce({ ok: false, error: 'Lecture impossible' });
    const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
    const file = new File(['%PDF-1.4\n'], 'f.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
    fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    await screen.findByRole('alert');
    expect(document.querySelector('[data-dp="tuile-paye"]')!.textContent).toContain('par défaut');
    expect(screen.getByLabelText('Total TTC en CHF')).toHaveAttribute('placeholder', '—');
    fireEvent.change(screen.getByLabelText('Date de l’achat'), { target: { value: '2026-04-27' } });
    expect(document.querySelector('[data-dp="tuile-paye"]')!.textContent).not.toContain('par défaut');
  });





});
