// @vitest-environment jsdom
/**
 * Voie e-port : l'écran r2b rend la facture 372765 (lecture SIMULÉE = sortie du vrai rapprochement du serveur, stock SIMULÉ). Gemini jamais appelé,
 * Drive jamais touché, aucune écriture. Le rouge de comportement : avant la voie, aucune chip, aucune pastille, aucun interrupteur, aucun S8.
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

const lire = async (patch?: (r: any) => void) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.stocks = { rawMaterials: (stockJson.articles as any[]).filter(a => a.name !== 'Verdant IPA').map(a => (a.name === 'Target' ? { ...a, name: 'Target 11.8%' } : a)), cleaning: [], equipment: [], kegs: [] };
  const resultat = JSON.parse(JSON.stringify(lecture)); patch?.(resultat);
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result: resultat });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  const file = new File(['%PDF-1.4\n'], 'facture-372765.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.transactions = [];
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('r2b : les points qui pèsent, la pastille, l’interrupteur', () => {
  it('les chips sont les points typés qui pèsent, l’argent d’abord ; le statut est « à confirmer » ; rien n’est écrit', async () => {
    const view = await lire();
    // Un nom par rôle (D6) : `data-dp-chip` = une chip qu'on touche (tuile, ChipsBar) ; `data-dp-rond` = le rond numéroté d'un compte (non cliquable, même numéro).
    // Les ronds précèdent les tuiles dans le DOM : les points se lisent triés par leur numéro (l'ordre de risque), et ce numéro doit courir de 1 à n sans trou.
    const chips = Array.from(view.container.querySelectorAll('[data-dp-chip],[data-dp-rond]')).map(c => c.getAttribute('aria-label') ?? c.textContent ?? '').sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));
    const numeros = Array.from(new Set(chips.map(c => Number.parseInt(c, 10))));
    expect(numeros).toEqual(numeros.map((_, i) => i + 1));
    expect(view.container.querySelectorAll('[data-dp-chip][role="img"]')).toHaveLength(0); // aucun rond sous le nom d'une chip
    // C12 : les tuiles TVA et Payé portent les numéros 1 et 2 ; les chips suivantes ont les libellés de la maquette.
    expect(chips[0]).toMatch(/^1\s*TVA/);
    expect(chips[1]).toMatch(/^2\s*Règlement/);
    expect(chips.some(c => /Sabro\S* unité/.test(c))).toBe(false); // D275 (voie f3) : l'unité de Sabro se déduit (g, jaune) ; plus de point « unité » (HEAD : true)
    expect(chips.some(c => /mouture ×5 \+1,50/.test(c))).toBe(true);
    expect(chips.some(c => /Target α/.test(c))).toBe(true);
    expect(screen.getByRole('button', { name: /^Lecture à confirmer/ })).toBeInTheDocument();
    expect(view.container.textContent).not.toMatch(/assujetti/i);
    expect(state.saved).not.toHaveBeenCalled();
  });
  it('la pastille-mot dit l’effet au stock (« +6 kg », « unité à préciser ») ; aucune pastille sur la mouture', async () => {
    const view = await lire();
    const lignes = Array.from(view.container.querySelectorAll('[data-purchase-line]')) as HTMLElement[];
    const ligneId = (id: string) => view.container.querySelector('[data-dp-ligne="' + id + '"]') as HTMLElement; // R1 : par id
    expect(lignes).toHaveLength(18); // 28c98cba (pu4d, p-port-pu4d/RESULTAT.md) : la mouture est une pastille de sa ligne, plus une rangée imbriquée : 23 → 18
    // 28c98cba (pu4d, p-port-pu4d/RESULTAT.md) : la pastille « +6 kg » est devenue « avant → après » au plateau (`[data-dp-apres]`, Plateau.tsx) : 6 kg reçus = 6 de plus.
    const apres = (ligneId('line-1').querySelector('[data-dp-apres]')!.textContent ?? '').match(/^([0-9 ]+(?:,[0-9]+)?) → ([0-9 ]+(?:,[0-9]+)?) Kg$/)!;
    const nb = (t: string) => Number(t.replace(/[^0-9,]/g, '').replace(',', '.'));
    expect(nb(apres[2]) - nb(apres[1])).toBe(6);
    // La mouture (line-2) n'est plus une rangée (28c98cba) : elle est la pastille « 0,60 » de son malt, sans pastille de stock.
    expect(ligneId('line-2')).toBeNull();
    expect(ligneId('line-1').querySelector('[data-dp-mouture="line-2"]')).not.toBeNull();
    expect(ligneId('line-1').querySelector('[data-dp-pastille]')).toBeNull();
    // D275 (voie f3) : Sabro n'est plus « unité à préciser » : le plateau dit l'unité déduite et pourquoi, à contrôler (HEAD : « unité à préciser »).
    expect(within(ligneId('line-20')).queryAllByText(/unité à préciser/)).toHaveLength(0);
    expect(ligneId('line-20').querySelector('[data-dp-unite-deduite]')).toBeNull(); // C2 (g2a, critique g3) : aucune phrase d'unité sous les champs ; la raison est au survol de la rangée (titre)
  });
  it('T4 : Confirmer avec une unité à préciser reste cliquable, n’écrit rien, dit « 1 unité à préciser » et mène au champ', async () => {
    // D275 (voie f3) : Sabro se déduit désormais ; la lecture n'a plus que « Maris Otter » 6 sans unité, ni prix, ni voisine, ni indice dans le nom (« 6 ? », rouge).
    await lire(r => { r.items = [{ ...r.items[0], name: 'Maris Otter', unit: '', price: null }]; r.amountTTC = r.items[0].amountTTC; r.printedLineCount = 1; });
    const confirmer = screen.getByRole('button', { name: 'Confirmer et enregistrer' });
    expect(confirmer).toBeEnabled();
    fireEvent.click(confirmer);
    expect(state.saved).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('À corriger');
    expect(screen.getByText('1 unité à préciser')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmer et enregistrer' })).toBeEnabled();
    expect(screen.getByLabelText('Unité à remplir, ligne 1')).toHaveFocus(); // 28c98cba (pu4d, D350) : l'unité qui manque est un groupe de cinq cases « Unité à remplir », plus un champ « Unité ligne n »
  });
  it('S8 : même commande sous un autre numéro = un signal, jamais un blocage ; « Même achat · ne rien enregistrer » n’écrit rien', async () => {
    state.transactions = [{ id: 'TX-380001', date: '30.04.2026', amountTTC: 86.5, description: 'Brau- und Rauchshop · 380001', category: 'brassage', finance: { kind: 'expense', version: 1, amountCents: 8650, vendor: 'Brau- und Rauchshop GmbH', invoiceNumber: '380001', sourceOrderNumber: 'Onlinebestellung-686863', recordedAt: '2026-04-30T10:00:00.000Z', lines: [] } }];
    await lire();
    const region = await screen.findByRole('region', { name: 'Même commande sous un autre numéro' });
    expect(region).toHaveTextContent('380001');
    fireEvent.click(within(region).getByRole('button', { name: 'Même achat · ne rien enregistrer' }));
    expect(screen.getByRole('button', { name: 'Fermer sans rien enregistrer' })).toBeEnabled();
    expect(state.saved).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Confirmer et enregistrer' })).toBeNull());
  });
});

describe('le banc de développement n’atteint jamais l’enregistrement réel', () => {
  it('avec `apercu`, ni Gemini ni l’enregistrement réel ne sont appelés ; l’enregistrement simulé rend le reçu qui reste', async () => {
    const enregistrer = vi.fn(async () => ({ driveFileId: 's', fileName: '2026-04-27 Brau- und Rauchshop 372765.jpg', bytes: 735721, sha256: '0'.repeat(64), verified: true, folder: 'L’Affinée / Justificatifs / 2026' }));
    const onClose = vi.fn();
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    const apercu = { outcome: { ok: true, result: JSON.parse(JSON.stringify(lecture)), proofDataUrl: '', fileName: 'f.pdf', mimeType: 'application/pdf' }, fichier: { name: 'f.pdf', size: 735721, type: 'application/pdf' },
      stocks: { rawMaterials: [], cleaning: [], equipment: [], kegs: [] }, transactions: [], etat: '3', drive: 'ok', reseau: true, enregistrer } as any;
    render(<ExpenseSheet onClose={onClose} onSaved={() => {}} apercu={apercu}/>);
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    expect(state.scanned).not.toHaveBeenCalled();
    // C7 (menu « Stock ligne 20 » → aucun mouvement) : supprimé par 28c98cba (pu4d, D350 : aucun menu) ; la ligne 20 reste un nouvel article, le test vérifie la fermeture du banc.
    // D275 (voie f3) : Sabro « 30 » prend le g de ses voisines ; plus de « g » à toucher (HEAD : clic sur « g »).
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer et enregistrer' }));
    await waitFor(() => expect(enregistrer.mock.calls.length + (screen.queryByRole('alert') ? 1 : 0)).toBeGreaterThan(0));
    expect(state.saved).not.toHaveBeenCalled();
  });
});
