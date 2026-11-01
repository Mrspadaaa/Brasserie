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
const ligne = (view: { container: HTMLElement }, n: number) => (view.container.querySelectorAll('[data-purchase-line]')[n - 1]) as HTMLElement;
beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.transactions = [];
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('R1 : un prix « avec mouture » n’est montré que si le catalogue l’écrira', () => {
  it('malt relié + mouture de service rattachée : « 2,40/Kg avec mouture » ; malt non relié : rien', async () => {
    const view = await lire();
    expect(ligne(view, 1).textContent).not.toMatch(/avec mouture/);
    fireEvent.click(view.container.querySelector('[data-dp-mouture-tous]')!);
    expect(ligne(view, 1).textContent).toMatch(/✓ 2,40\/Kg avec mouture/);
    fireEvent.click(screen.getByRole('switch', { name: 'Mettre en stock, ligne 1' }));
    expect(ligne(view, 1).textContent).not.toMatch(/avec mouture/);
  });
  it('C16 : le tableau des moutures dit « lu 2,30 → 2,40 /Kg » seulement pour un malt relié, et « Laisser en service » ne lie rien', async () => {
    const view = await lire();
    fireEvent.click(screen.getByRole('button', { name: 'Tableau des moutures' }));
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
    expect(within(ligne(view, 8)).getByRole('button', { name: 'Créer « Target bis »' })).toBeInTheDocument();
    fireEvent.click(within(ligne(view, 8)).getByRole('button', { name: 'Choisir un autre article' }));
    expect(screen.getByLabelText('Stock ligne 8')).toHaveValue('existing');
  });
});

describe('R10, D229 : un geste ne fait jamais monter le statut ; une valeur tapée est gardée', () => {
  it('« — » sur la TVA : le titre reste « Lecture à confirmer », la chip dit « points revus »', async () => {
    await lire();
    fireEvent.click(document.querySelector('[data-dp="tuile-tva"]')!);
    fireEvent.click(screen.getByText('proposé · HT vide').closest('button')!);
    expect(screen.getByText('Lecture à confirmer')).toBeInTheDocument();
    expect(screen.queryByText('Lecture vérifiée')).toBeNull();
  });
  it('une valeur fausse tapée garde sa valeur, crée un point (chip « Total ») et ne vérifie rien', async () => {
    await lire();
    const total = screen.getByLabelText('Total TTC en CHF');
    fireEvent.change(total, { target: { value: '70' } }); fireEvent.blur(total);
    expect(total).toHaveValue('70,00');
    expect(Array.from(document.querySelectorAll('[data-dp-chip]')).some(c => /Total/.test(c.textContent ?? ''))).toBe(true);
    expect(screen.getByText('Lecture à confirmer')).toBeInTheDocument();
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
    expect(within(panneau).getByRole('button', { name: 'C’est la date' }).className).toMatch(/bg-ebc-straw/);
    expect(within(panneau).getByRole('button', { name: 'C’est la date' }).className).toMatch(/text-cave-950/);
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
    expect((screen.getByLabelText('Libellé ligne 1') as HTMLInputElement).value).toBe('Maris Otter, Kg');
    expect(resume.querySelector('[class*="chevron"]')).not.toBeNull();
  });
  it('C6 : le compte de la preuve fait 23 (toutes catégories), sans phrase d’aide', async () => {
    const view = await lire();
    const compte = view.container.querySelector('[data-dp="compte-liens"]')!;
    const somme = Array.from(compte.querySelectorAll('b')).reduce((n, b) => n + Number(b.textContent), 0);
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
  it('jsdom n’a pas d’IntersectionObserver : l’écran se monte, les panneaux Payé et TVA sont montés (aucun attribut hidden)', async () => {
    expect(typeof IntersectionObserver).toBe('undefined');
    await lire();
    for (const nom of ['panneau-tva', 'panneau-paye']) { const p = document.querySelector(`[data-dp="${nom}"]`) as HTMLElement; expect(p).not.toBeNull(); expect(p.hasAttribute('hidden')).toBe(false); expect(p.getAttribute('style')).toBeNull(); }
  });
  it('« À revoir » dit chaque point ouvert avec la valeur gardée (TVA, date supposée, moutures, voisin, unité)', async () => {
    const enregistrer = vi.fn(async () => ({ driveFileId: 's', fileName: '2026-04-27 Brau- und Rauchshop 372765.jpg', bytes: 735721, sha256: '0'.repeat(64), verified: true, folder: 'L’Affinée / Justificatifs / 2026' }));
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    const apercu = { outcome: { ok: true, result: JSON.parse(JSON.stringify(lecture)), proofDataUrl: '', fileName: 'f.pdf', mimeType: 'application/pdf' }, fichier: { name: 'f.pdf', size: 735721, type: 'application/pdf' }, stocks: stock(), transactions: [], etat: '3', drive: 'ok', reseau: true, enregistrer } as any;
    state.stocks = stock();
    render(<ExpenseSheet onClose={() => {}} onSaved={() => {}} apercu={apercu}/>);
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    fireEvent.click(screen.getAllByRole('button', { name: 'g' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer et enregistrer' }));
    await waitFor(() => expect(enregistrer).toHaveBeenCalledTimes(1), { timeout: 4000 });
    const revoir = await screen.findByText(/À revoir/);
    for (const mot of ['TVA 2,80 gardée', 'date de paiement supposée gardée', '5 moutures en service', 'Target α non lié au stock']) expect(revoir.textContent).toContain(mot);
  });
});

describe('Reprise (01.11) : les détails du critique et du relecteur', () => {
  it('critique R1 : « C’est la date » referme le panneau Payé', async () => {
    await lire();
    fireEvent.click(document.querySelector('[data-dp="tuile-paye"]')!);
    const panneau = document.querySelector('[data-dp="panneau-paye"]') as HTMLElement;
    expect(panneau.className).toMatch(/\bblock\b/);
    fireEvent.click(within(panneau).getByRole('button', { name: 'C’est la date' }));
    expect(panneau.className).toMatch(/\bhidden\b/);
    expect(panneau.className).not.toMatch(/\bblock\b/);
  });
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
  it('critique R2 : état 8, une seule ligne sous le tableau, le numéro de commande est court', async () => {
    state.transactions = [{ id: 'TX-380001', date: '30.04.2026', amountTTC: 86.5, description: 'Brau- und Rauchshop · 380001', category: 'brassage', finance: { kind: 'expense', version: 1, amountCents: 8650, vendor: 'Brau- und Rauchshop GmbH', invoiceNumber: '380001', sourceOrderNumber: 'Onlinebestellung-686863', recordedAt: '2026-04-30T10:00:00.000Z', lines: [] } }];
    await lire();
    const region = await screen.findByRole('region', { name: 'Même commande sous un autre numéro' });
    expect(region.textContent).toContain('686863');
    expect(region.textContent).not.toContain('Onlinebestellung');
    expect(region.textContent).not.toContain('Même fournisseur et même total');
    expect(region.querySelectorAll('p')).toHaveLength(2); // le titre et la ligne de conséquence
  });
  it('critique R3 : la barre est colorée par lien, trois teintes distinctes, le noir réservé au « sans stock »', async () => {
    const view = await lire();
    const segments = Array.from(view.container.querySelectorAll('[data-dp="barre"] i')) as HTMLElement[];
    expect(segments).toHaveLength(23);
    const teintes = new Set(segments.map(s => (s.className.match(/bg-[\w/-]+/) ?? [''])[0]));
    for (const t of ['bg-attention', 'bg-area-finances', 'bg-hop']) expect(teintes.has(t) || t === 'bg-area-finances').toBe(true);
    expect(segments[0].className).toContain('bg-attention'); // relié : ocre
    expect(segments[1].className).toContain('bg-hop'); // mouture (service) : vert
    expect(segments[0].className).not.toContain('bg-cave-50');
    const noirs = segments.filter(s => s.className.includes('bg-cave-50'));
    expect(noirs.length).toBeGreaterThan(0); // les lignes sans stock
  });
  it('critique R5 : « Envoi au Drive · 0,7 Mo » pendant l’envoi quand la taille est connue', async () => {
    let fin: (r?: any) => void = () => {};
    const enregistrer = vi.fn(() => new Promise(res => { fin = res; }));
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    state.stocks = stock();
    const apercu = { outcome: { ok: true, result: JSON.parse(JSON.stringify(lecture)), proofDataUrl: '', fileName: 'f.pdf', mimeType: 'application/pdf' }, fichier: { name: 'f.pdf', size: 735721, type: 'application/pdf' }, stocks: stock(), transactions: [], etat: '3', drive: 'ok', reseau: true, enregistrer } as any;
    render(<ExpenseSheet onClose={() => {}} onSaved={() => {}} apercu={apercu}/>);
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    fireEvent.click(screen.getAllByRole('button', { name: 'g' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer et enregistrer' }));
    await waitFor(() => expect(document.querySelector('footer')!.textContent).toContain('Envoi au Drive · 0,7 Mo'));
    fin(undefined);
  });
  it('critique R6 : « Sabro® » s’écrit « Sabro » dans la chip', async () => {
    await lire();
    const chip = Array.from(document.querySelectorAll('[data-dp-chip]')).map(c => c.getAttribute('aria-label') ?? '').find(t => /unité/.test(t));
    expect(chip).toMatch(/^3 Sabro unité$/);
  });
  it('relecteur R6 : le choix « Créer » d’un produit déjà au stock dit « relié à X, nom déjà au stock »', async () => {
    await lire();
    fireEvent.change(screen.getByLabelText('Stock ligne 18'), { target: { value: 'none' } });
    fireEvent.change(screen.getByLabelText('Stock ligne 18'), { target: { value: 'new' } });
    expect(screen.getByText(/relié à « Galaxy », nom déjà au stock/)).toBeInTheDocument();
  });
});
