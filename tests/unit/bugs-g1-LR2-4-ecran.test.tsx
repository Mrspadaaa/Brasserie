// @vitest-environment jsdom
// LR2-4 (g1, 20.11), côté écran : l'en-tête disait « 23 lignes · dont port 8,50 » et la rangée « Articles lus 24 » (captures port-*, 20.11).
// Source établie : la FIXTURE de dev-local (état `port`) posait `printedLineCount: items.length` APRÈS avoir ajouté la ligne Port. Une vraie lecture (doc14, 17 lignes dont le port 30,00)
// annonce 16 : le prompt demande « lignes d'articles seulement » (prompts.ts). Le code compare déjà 16 à 16 ; la fixture ne ressemblait pas à une réponse enregistrée.
// Et si un modèle compte pourtant le port dans son annonce (p3c D12), la rangée ne doit pas non plus le compter : le port se dit à part, une seule fois.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { controlesCroises, type EntreeControles } from '../../src/ui/finance/controlesCroises';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[], kegs: [] as any[] }, transactions: [] as any[] }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: vi.fn(), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(), savePurchaseWithProofReceipt: async () => ({ transactionId: 'TX-test' }), confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../src/services/firebaseAuth';
import { apercuDepense } from '../../src/ui/depense/apercuDev';

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.transactions = [];
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true);
});
afterEach(cleanup);

describe('LR2-4 écran : le même nombre de lignes dans l’en-tête et dans la rangée Articles', () => {
  it('état dev-local « port » : la lecture annonce les articles, port exclu (comme une vraie réponse)', () => {
    const r = apercuDepense('port').outcome;
    if (!r.ok) throw new Error('lecture attendue');
    expect(r.result.items).toHaveLength(24);
    expect(r.result.items.filter(i => i.kind === 'shipping')).toHaveLength(1);
    expect(r.result.printedLineCount).toBe(23);
  });
  it('à l’écran : « 23 lignes » en en-tête, « Articles lus 23 » dans la rangée, jamais 24', async () => {
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    render(<ExpenseSheet onClose={() => {}} onSaved={() => {}} apercu={apercuDepense('port')}/>);
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    const entete = Number(/(\d+) lignes?$/.exec(screen.getByRole('button', { name: /\d+ lignes?$/ }).getAttribute('title') ?? '')?.[1]);
    const rangee = document.querySelector('[data-dp-controle-cle="articles"]') as HTMLElement;
    const lus = Number(/Articles lus\D*?(\d+)/.exec(rangee.textContent ?? '')?.[1]);
    expect(entete).toBe(23);
    expect(lus).toBe(entete);
  });
  it('un modèle qui compte le port dans son annonce (24 pour 24 lignes dont le port) : la rangée dit 23, le port est à part', () => {
    const e = { lignesCents: 9500, nLignes: 24, nAjoutes: 0, ajoutsCents: 0, totalCents: 9500, attendus: 24, attendusIndependant: null, nRabais: 0, nSansMontant: 0, nPort: 1, payeCents: null, moyen: null, qte: null } as EntreeControles;
    const r = controlesCroises(e).rangs.find(x => x.cle === 'articles')!;
    expect(r.valeurs).toBe('23');
  });
});
