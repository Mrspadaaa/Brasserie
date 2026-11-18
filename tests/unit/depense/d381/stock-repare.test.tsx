// @vitest-environment jsdom
/**
 * Voie s-stock (mission lecture longue, 03.11) : une ligne dont la quantité ou l'unité manquait, réparée à la main, entre-t-elle au stock ?
 * L'écran réel (`ExpenseSheet`), une lecture FICTIVE (Brauhaus Ouest, aucune valeur d'une vraie pièce), un stock SIMULÉ, aucun appel IA.
 * Le « dépôt » simulé rejoue ce que `savePurchase` écrit en stock (purchaseEntry.ts, l. 665-687) avec les VRAIES fonctions (validatePurchase, articlesNeufsDe, stockQuantityFor) :
 * il refuse comme `validatePurchaseCommit`, crée les articles neufs comme `articlesNeufsDe`, ajoute aux articles existants comme `stockQuantityFor`.
 * Ces tests décrivent le comportement RÉEL, sans le changer.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import lecture from '../../../../src/ui/depense/apercu/lecture-372765.reconciliee.json';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[], kegs: [] as any[] }, transactions: [] as any[], depots: [] as any[], scanned: vi.fn(), depot: undefined as any }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
// Le décodeur de QR-facture (zxing-wasm) n'est pas le sujet et n'est pas installé sur ce poste : simulé.
vi.mock('../../../../src/services/qrLecture', () => ({ lireQrDuFichier: async () => ({ statut: 'non-verifie', motif: 'simulé' }) }));
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => {
  const o = await importOriginal<any>();
  return {
    ...o, confirmPurchase: async () => undefined, purchaseDuplicates: () => [],
    savePurchaseWithProofReceipt: async (d: any) => {
      const erreurs: string[] = o.validatePurchase(d, state.stocks, []); // comme validatePurchaseCommit : une erreur, aucune écriture
      if (erreurs.length) throw new Error(erreurs.join('\n'));
      const tous = [...state.stocks.rawMaterials, ...state.stocks.cleaning];
      const neufs = o.articlesNeufsDe(d, tous).map((n: any) => ({ ligne: n.lineId, nom: n.item.name, unite: n.item.unit, stock: n.item.currentStock }));
      const ajouts = d.lines.filter((l: any) => l.stockAction === 'existing').map((l: any) => {
        const item = tous.find(x => x.ref === l.stockRef), c = o.stockQuantityFor({ description: l.description, quantity: l.quantity, unit: o.uniteEffective(l) }, item);
        return { ligne: l.id, ref: item.ref, nom: item.name, ajout: c.quantity, unite: item.unit, avant: item.currentStock };
      });
      const depot = { neufs, ajouts, lignes: d.lines.map((l: any) => ({ id: l.id, stockAction: l.stockAction, stockRef: l.stockRef, quantity: l.quantity, unit: l.unit })) };
      state.depots.push(structuredClone(depot));
      return { transactionId: 'TX-test' };
    },
  };
});
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
type Ligne = { kind?: string; nom: string; q: number | null; u: string; prix: number | null; montant: number; cat: string };
const art = (nom: string, unit: string, category: string, extra: Record<string, unknown> = {}) => ({ id: nom, ref: `MP-${nom}`, name: nom, unit, category, currentStock: 10, minStock: 0, reorder: false, ...extra });

/** Une lecture FICTIVE de la forme du serveur (comme `lecturesLenteur`) : les lignes sont lues « stock », la somme égale le total. */
function piece(lignes: Ligne[]) {
  const result: any = clone(lecture);
  const items = lignes.map((l, i) => ({ id: `line-${i + 1}`, name: l.nom, kind: l.kind ?? 'stock', quantity: l.q, unit: l.u, price: l.prix, amountTTC: l.montant, reference: '', variant: '', stockCategory: l.cat, evidence: '', ambiguity: '', vatCode: 'N', alphaPct: null, alphaPctLu: null }));
  const total = Math.round(lignes.reduce((a, l) => a + l.montant, 0) * 100) / 100;
  Object.assign(result, { proForma: false, vendor: 'Brauhaus Ouest', date: '21.10.2026', invoiceNumber: 'F-4410', orderNumber: '', amountHT: null, tvaRate: null, tvaAmount: null, vat: [], category: 'brassage', amountTTC: total, items, printedLineCount: items.length, linesLost: 0, points: [], fieldWarnings: [], issues: [], remarques: [], description: 'Essai (SIMULÉ)', controls: { lines: { checked: items.length, failed: 0, skipped: 0, skippedIds: [] }, sum: { statut: 'ok', base: 'TTC' }, vat: { statut: 'non-verifiable', base: 'TTC' }, totals: { statut: 'non-verifiable' } }, review: { status: 'checked', findings: [], readers: 2 } });
  return result;
}
async function lire(stock: any[], lignes: Ligne[]) {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.stocks = { rawMaterials: clone(stock), cleaning: [], equipment: [], kegs: [] };
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result: piece(lignes) });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
}
const ligne = (v: ReturnType<typeof render>, n = 1) => v.container.querySelector<HTMLElement>(`[data-dp-ligne="line-${n}"]`)!;
const principal = (v: ReturnType<typeof render>) => v.container.querySelector<HTMLButtonElement>('button[data-primary]')!;
const tape = (label: string, valeur: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: valeur } });
/** L'unité, d'un toucher : la case « unité à remplir » tant que l'unité manque, sinon le segment Kg / g / pièce (quand la quantité est là, l'écran déduit une unité jaune du prix : le segment la corrige). */
const choisirUnite = (v: ReturnType<typeof render>, valeur: string, n = 1) => {
  const l = ligne(v, n), seg = [...l.querySelectorAll<HTMLElement>('[data-dp-unite-segments] button')].find(b => b.textContent === valeur);
  const cas = l.querySelector<HTMLElement>(`[data-dp-cases-unite] button[data-val="${valeur.toLowerCase()}"]`);
  fireEvent.click((seg ?? cas)!);
};
const texte = (v: ReturnType<typeof render>, n = 1) => ligne(v, n).textContent ?? '';
/** Un clic sur « Confirmer et enregistrer » ; rend le dépôt écrit (s'il y en a un) et le message d'erreur affiché (s'il y en a un). */
async function confirmer(v: ReturnType<typeof render>) {
  const avant = state.depots.length;
  await act(async () => { fireEvent.click(principal(v)); await new Promise(r => setTimeout(r, 30)); });
  return { depot: state.depots.length > avant ? state.depots[state.depots.length - 1] : undefined, alerte: v.container.querySelector('[role="alert"]')?.textContent ?? '' };
}

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.scanned.mockReset(); state.transactions = []; state.depots = [];
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

const REFUS_EXISTE = /Malt Pilsner : cet article existe déjà \(« Malt Pilsner »\) : relie la ligne à cet article\./;
const PILSNER = () => [art('Malt Pilsner', 'kg', 'Malt')];
const CITRA2 = () => [art('Citra 12.5%', 'g', 'Houblon'), art('Citra 13.0%', 'g', 'Houblon')];
const CITRA: Ligne = { nom: 'Citra', q: 100, u: 'g', prix: null, montant: 9, cat: 'hop' };
const relier = (nom: string) => fireEvent.click(screen.getByRole('radio', { name: new RegExp(`Relier à ${nom}`) }));

describe('Cas A : ni quantité ni unité, « nouvel article » d’office (stock vide)', () => {
  const SUCRE: Ligne = { nom: 'Sucre candi', q: null, u: '', prix: null, montant: 5.9, cat: 'sugar' };
  it('A0 : à la lecture la ligne est « nouvel article » ; sans réparation « Confirmer » refuse et dit la quantité : rien n’entre en stock', async () => {
    const v = await lire([], [SUCRE]);
    expect(texte(v)).toMatch(/· nouvel article/);
    const r = await confirmer(v);
    expect(r.depot).toBeUndefined();
    expect(r.alerte).toMatch(/Sucre candi : indique la quantité reçue et son unité\./);
  });
  it('A1 : il tape la quantité (2) puis touche « Kg » : « Confirmer » écrit l’article neuf avec 2 kg', async () => {
    const v = await lire([], [SUCRE]);
    tape('Quantité ligne 1', '2'); choisirUnite(v, 'Kg');
    expect(texte(v)).toMatch(/0 → 2 Kg/);
    const r = await confirmer(v);
    expect(r.alerte).toBe('');
    expect(r.depot.neufs).toEqual([{ ligne: 'line-1', nom: 'Sucre candi', unite: 'kg', stock: 2 }]);
    expect(r.depot.ajouts).toEqual([]);
    expect(r.depot.lignes[0]).toMatchObject({ stockAction: 'new', quantity: 2, unit: 'kg' });
  });
  it('A2 : dans l’autre ordre (l’unité d’abord, via « unité à remplir », puis la quantité) : même écriture', async () => {
    const v = await lire([], [SUCRE]);
    choisirUnite(v, 'Kg'); tape('Quantité ligne 1', '2');
    const r = await confirmer(v);
    expect(r.alerte).toBe('');
    expect(r.depot.neufs).toEqual([{ ligne: 'line-1', nom: 'Sucre candi', unite: 'kg', stock: 2 }]);
  });
  it('A3 : il tape la quantité SEULE : l’écran déduit « pièce » du prix (2 × 2,95, jaune « repris ») et « Confirmer » enregistre cette unité déduite sans autre geste (D277)', async () => {
    const v = await lire([], [SUCRE]);
    tape('Quantité ligne 1', '2');
    expect(ligne(v).querySelector('[data-dp-unite-segments]')?.getAttribute('data-dp-niveau')).toBe('repris');
    const r = await confirmer(v);
    expect(r.alerte).toBe('');
    expect(r.depot.neufs).toHaveLength(1);
    expect(r.depot.neufs[0]).toMatchObject({ nom: 'Sucre candi', stock: 2 });
    expect(r.depot.neufs[0].unite).toBe('Stk'); // l'article est créé « 2 Stk » (la pièce déduite du prix), pas en kg : sans son toucher sur « Kg », une quantité de kilos devient des pièces
  });
});

describe('Cas B : même nom qu’un article du stock (« Malt Pilsner », en kg)', () => {
  it('B1 : ni quantité ni unité lues → proposé « Malt Pilsner bis » (nouvel article), PAS relié ; il tape 25 et « Kg » : toujours pas relié, « Confirmer » refuse ; « Relier à Malt Pilsner » (radio) fait entrer 25 kg', async () => {
    const v = await lire(PILSNER(), [{ nom: 'Malt Pilsner', q: null, u: '', prix: null, montant: 36, cat: 'malt' }]);
    expect(texte(v)).toMatch(/Malt Pilsner bis/); expect(texte(v)).not.toMatch(/relié/);
    tape('Quantité ligne 1', '25'); choisirUnite(v, 'Kg');
    expect(texte(v)).toMatch(/à créer à la confirmation/); // la ligne reste « nouvel article » : la quantité tapée ne la relie pas
    const refus = await confirmer(v);
    expect(refus.depot).toBeUndefined();
    expect(refus.alerte).toMatch(REFUS_EXISTE);
    relier('Malt Pilsner');
    expect(texte(v)).toMatch(/10 → 35 Kg/);
    const r = await confirmer(v);
    expect(r.alerte).toBe('');
    expect(r.depot.neufs).toEqual([]);
    expect(r.depot.ajouts).toEqual([{ ligne: 'line-1', ref: 'MP-Malt Pilsner', nom: 'Malt Pilsner', ajout: 25, unite: 'kg', avant: 10 }]);
  });
  it('B2 : unité « kg » lue mais quantité absente → même état (« bis », non relié) ; il tape 25 : « Confirmer » refuse ; « Relier » fait entrer 25 kg', async () => {
    const v = await lire(PILSNER(), [{ nom: 'Malt Pilsner', q: null, u: 'kg', prix: null, montant: 36, cat: 'malt' }]);
    expect(texte(v)).toMatch(/Malt Pilsner bis/);
    tape('Quantité ligne 1', '25');
    const refus = await confirmer(v);
    expect(refus.depot).toBeUndefined(); expect(refus.alerte).toMatch(REFUS_EXISTE);
    relier('Malt Pilsner');
    const r = await confirmer(v);
    expect(r.depot.ajouts).toEqual([{ ligne: 'line-1', ref: 'MP-Malt Pilsner', nom: 'Malt Pilsner', ajout: 25, unite: 'kg', avant: 10 }]);
  });
  it('B3 : quantité lue (25) mais unité absente → la ligne est reliée d’office (jaune « proposé », « unité à préciser ») ; il touche « Kg » : « Confirmer » fait entrer 25 kg sans « Garder »', async () => {
    const v = await lire(PILSNER(), [{ nom: 'Malt Pilsner', q: 25, u: '', prix: null, montant: 36, cat: 'malt' }]);
    expect(texte(v)).toMatch(/article « Malt Pilsner » · proposé · unité à préciser/);
    const avant = await confirmer(v);
    expect(avant.depot).toBeUndefined(); expect(avant.alerte).toMatch(/unité à préciser/);
    choisirUnite(v, 'Kg');
    expect(texte(v)).toMatch(/10 → 35 Kg/);
    const r = await confirmer(v);
    expect(r.alerte).toBe('');
    expect(r.depot.ajouts).toEqual([{ ligne: 'line-1', ref: 'MP-Malt Pilsner', nom: 'Malt Pilsner', ajout: 25, unite: 'kg', avant: 10 }]);
    expect(r.depot.neufs).toEqual([]);
  });
});

describe('Cas C : une ligne restée hors stock (stockAction « none »)', () => {
  it('C0 : plusieurs articles « Citra » : un seul état (p5 : la vue FACTURE | STOCK, jamais « hors stock » à côté d’un picto de stock) ; rien n’est relié ; « Confirmer » l’enregistre SANS stock, sans alerte', async () => {
    const v = await lire(CITRA2(), [CITRA]);
    expect(texte(v)).not.toMatch(/hors stock/); expect(texte(v)).toMatch(/2 articles « Citra »/); expect(ligne(v).querySelectorAll('[data-dp-sortie^="relie-"]')).toHaveLength(2);
    const r = await confirmer(v);
    expect(r.alerte).toBe('');
    expect(r.depot.lignes[0].stockAction).toBe('none');
    expect(r.depot.neufs).toEqual([]); expect(r.depot.ajouts).toEqual([]);
  });
  it('C1 : ⇄ « Choisir un autre article », puis l’article dans « Article » : relié ; « Confirmer » fait entrer 100 g', async () => {
    const v = await lire(CITRA2(), [CITRA]);
    fireEvent.click(within(ligne(v)).getAllByRole('button', { name: 'Choisir un autre article' })[0]);
    expect(texte(v)).toMatch(/article « \? » · à choisir/);
    fireEvent.change(within(ligne(v)).getByLabelText('Article'), { target: { value: 'Citra 12.5' } });
    fireEvent.click(await within(ligne(v)).findByRole('option', { name: /Citra 12\.5%/ }));
    expect(texte(v)).toMatch(/10 → 110 g/);
    const r = await confirmer(v);
    expect(r.alerte).toBe('');
    expect(r.depot.ajouts).toEqual([{ ligne: 'line-1', ref: 'MP-Citra 12.5%', nom: 'Citra 12.5%', ajout: 100, unite: 'g', avant: 10 }]);
  });
  it('C2 : la sortie « bis » de la vue, sur la ligne ambiguë (p5, ex-« Suivre au stock »), → un NOUVEL article « Citra » (à côté de « Citra 12.5% »), le résultat de « Confirmer » est mesuré', async () => {
    const v = await lire(CITRA2(), [CITRA]);
    fireEvent.click(ligne(v).querySelector<HTMLElement>('[data-dp-sortie="bis"]')!);
    expect(texte(v)).toMatch(/à créer à la confirmation/);
    const r = await confirmer(v);
    expect(r.alerte).toBe('');
    expect(r.depot.neufs).toEqual([{ ligne: 'line-1', nom: 'Citra', unite: 'g', stock: 100 }]); // un « Citra » de plus à côté de « Citra 12.5% » et « Citra 13.0% » : le stock se double, rien ne le signale à la confirmation
    expect(r.depot.ajouts).toEqual([]);
  });
  it('C3 : une ligne lue « autre » (hors stock) : « Ingrédient » seul ne la fait PAS entrer au stock ; « Suivre au stock » (second geste) la crée avec 1 kg', async () => {
    const SUCRE_AUTRE: Ligne = { nom: 'Sucre candi', q: 1, u: 'kg', prix: null, montant: 5.9, cat: 'sugar', kind: 'other' };
    const touche = (v: ReturnType<typeof render>) => fireEvent.click([...ligne(v).querySelectorAll<HTMLElement>('[data-dp-nature] button')].find(b => b.textContent === 'Ingrédient')!);
    const seul = await lire([], [SUCRE_AUTRE]);
    expect(texte(seul)).toMatch(/article — · hors stock/);
    touche(seul);
    expect(texte(seul)).toMatch(/Suivre au stock/); expect(texte(seul)).not.toMatch(/nouvel article/);
    const r1 = await confirmer(seul);
    expect(r1.depot.lignes[0].stockAction).toBe('none'); expect(r1.depot.neufs).toEqual([]);
    cleanup(); state.scanned.mockReset();
    const deux = await lire([], [SUCRE_AUTRE]);
    touche(deux); fireEvent.click(ligne(deux).querySelector<HTMLElement>('[data-dp-suivre]')!);
    expect(texte(deux)).toMatch(/0 → 1 Kg/);
    const r2 = await confirmer(deux);
    expect(r2.alerte).toBe('');
    expect(r2.depot.neufs).toEqual([{ ligne: 'line-1', nom: 'Sucre candi', unite: 'kg', stock: 1 }]);
  });
});
