// @vitest-environment jsdom
/**
 * Voie r4-port-d (D307, son choix D) : les sous-groupes repliés d'une bande, dans l'écran « Nouvelle dépense ». Pièce SIMULÉE (aperçu `renovation`, « Brico Fictif SA »
 * et une variante réduite) ; Gemini jamais appelé, Drive jamais touché, aucune écriture. Rouges sur l'arbre d'avant (aucune ligne de sous-famille), verts après.
 * Le rendu réel (390 tactile, 1280, clair et sombre, côte à côte avec sa maquette) : `voies/r4-port-d/capturer-d.mjs`.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { apercuDepense } from '../../../../src/ui/depense/apercuDev';
import { Liste } from '../../../../src/ui/depense/Liste';
import { bandes, type LigneBande } from '../../../../src/ui/depense/groupes';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[], kegs: [] as any[] }, transactions: [] as any[], scanned: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.scanned.mockReset(); state.transactions = [];
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

const ligne = (id: number, name: string, kind: string, quantity: number | null, unit: string, price: number | null, amountTTC: number, stockCategory = '') =>
  ({ id: `line-${id}`, name, kind, quantity, unit, price, amountTTC, reference: '', variant: '', stockCategory, evidence: `${name} (page 1)`, ambiguity: '', vatCode: 'N', alphaPct: null, alphaPctLu: null });
/** L'aperçu `renovation` (18 lignes de travaux), ou une liste de lignes à nous ; `ajuste` retouche le résultat avant la lecture. */
const lire = async (items?: Array<ReturnType<typeof ligne>>) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const result = JSON.parse(JSON.stringify((apercuDepense('renovation').outcome as any).result));
  if (items) {
    result.items = items; result.printedLineCount = items.length;
    result.amountTTC = Math.round(items.reduce((a, i) => a + (i.amountTTC ?? 0), 0) * 100) / 100;
  }
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  const file = new File(['%PDF-1.4\n'], 'facture-travaux.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
type Vue = ReturnType<typeof render>;
const bande = (v: Vue, cle: string) => v.container.querySelector<HTMLElement>(`[data-dp-bande="${cle}"]`)!;
const groupes = (v: Vue, cle = 'renovation') => [...bande(v, cle).querySelectorAll<HTMLElement>('[data-dp-sg]')];
const ligneDe = (g: HTMLElement) => g.querySelector<HTMLButtonElement>('[data-dp-sg-ligne]')!;
const corpsDe = (g: HTMLElement) => g.querySelector<HTMLElement>('[data-dp-sg-corps]')!;
const nomsDe = (v: Vue, cle = 'renovation') => groupes(v, cle).map(g => g.getAttribute('data-dp-sg'));
const parNom = (v: Vue, nom: string, cle = 'renovation') => groupes(v, cle).find(g => g.getAttribute('data-dp-sg') === nom)!;
/** Les rangées visibles de la bande (dans un corps replié, elles restent dans le DOM, cachées). */
const visibles = (v: Vue, cle = 'renovation') => [...bande(v, cle).querySelectorAll<HTMLElement>('article[data-dp-ligne]')].filter(a => !a.closest('[hidden]')).map(a => a.getAttribute('data-dp-ligne'));

// Les 17 lignes de la bande Rénovation de l'aperçu, par sous-famille (la fonction pure `sousFamilleDe` les a rangées ainsi, voir la voie r1).
describe('D307 : la bande Rénovation de l\'aperçu, au repos', () => {
  it('les sous-groupes pliables ont une ligne : bouton, aria-expanded=true à l\'arrivée (B2 n° 10, D378), nombre ; leur corps est visible', async () => {
    const v = await lire();
    const noms = nomsDe(v);
    expect(noms.length).toBeGreaterThanOrEqual(2);
    for (const g of groupes(v)) {
      const b = ligneDe(g);
      expect(b.tagName).toBe('BUTTON'); expect(b.getAttribute('type')).toBe('button');
      expect(b.getAttribute('aria-expanded')).toBe('true');
      expect(corpsDe(g).hidden).toBe(false);
      expect(b.querySelector('[data-dp-sg-compte]')!.textContent).toBe(String(corpsDe(g).querySelectorAll('article[data-dp-ligne]').length));
      expect(b.getAttribute('aria-controls')).toBe(corpsDe(g).id);
    }
  });
  it('les sous-groupes sont dans l\'ordre de la Rénovation, la bande garde son en-tête (compte et montant)', async () => {
    const v = await lire();
    const ordre = ['Peinture et sols', 'Outillage', 'Quincaillerie', 'Électricité', 'Plomberie', 'Protection', 'Divers travaux'];
    const noms = nomsDe(v) as string[];
    expect([...noms].sort((a, b) => ordre.indexOf(a) - ordre.indexOf(b))).toEqual(noms);
    expect(bande(v, 'renovation').querySelector('[data-dp-bande-entete] strong')!.textContent).toBe('Rénovation');
    expect(bande(v, 'renovation').querySelector('[data-dp-sous-montant]')!.textContent).toMatch(/^\d/);
  });
  it('un toucher ouvre le groupe (aria-expanded=true, ses rangées apparaissent), un second le ferme', async () => {
    const v = await lire();
    const g = groupes(v)[0], n = corpsDe(g).querySelectorAll('article[data-dp-ligne]').length;
    expect(visibles(v)).toContain(corpsDe(g).querySelector('article')!.getAttribute('data-dp-ligne')); // B2 n° 10 : ouvert à l'arrivée
    fireEvent.click(ligneDe(g));
    expect(ligneDe(g).getAttribute('aria-expanded')).toBe('false'); expect(corpsDe(g).hidden).toBe(true);
    fireEvent.click(ligneDe(g));
    expect(ligneDe(g).getAttribute('aria-expanded')).toBe('true'); expect(corpsDe(g).hidden).toBe(false);
    expect(corpsDe(g).querySelectorAll('article[data-dp-ligne]')).toHaveLength(n);
  });

  it('replier un groupe ferme le plateau de ses rangées ; un plateau ouvert garde son groupe ouvert', async () => {
    const v = await lire();
    const g = groupes(v)[0];
    fireEvent.click(ligneDe(g));
    const a = corpsDe(g).querySelector<HTMLElement>('article[data-dp-ligne]')!, d = a.querySelector<HTMLDetailsElement>('details')!;
    d.open = true; fireEvent(d, new Event('toggle'));
    await waitFor(() => expect(d.open).toBe(true));
    fireEvent.click(ligneDe(g));
    await waitFor(() => expect(ligneDe(groupes(v)[0]).getAttribute('aria-expanded')).toBe('false'));
    expect(corpsDe(groupes(v)[0]).hidden).toBe(true);
    expect(a.querySelector<HTMLDetailsElement>('details')!.open).toBe(false);
  });
  it('la vue « Papier » ne change pas : aucune ligne de sous-famille', async () => {
    const v = await lire();
    fireEvent.click(screen.getByRole('button', { name: 'Papier' }));
    expect(v.container.querySelectorAll('[data-dp-sg]')).toHaveLength(0);
    expect(v.container.querySelectorAll('[data-dp-bande="papier"] article[data-dp-ligne]').length).toBeGreaterThan(10);
  });
});

describe('D307 : bandes sans deux sous-familles, sous-groupe d\'une ligne, ligne à vérifier', () => {
  it('D378 : une seule sous-famille (Outillage seul) : la bande entière se plie par son en-tête, sans ligne de sous-famille, ouverte au repos', async () => {
    const v = await lire([ligne(1, 'Ponceuse excentrique 125 mm', 'equipment', 1, 'Stk', 89, 89), ligne(2, 'Visseuse sans fil 18 V', 'equipment', 1, 'Stk', 99, 99)]);
    expect(nomsDe(v)).toEqual(['Rénovation']);
    expect(bande(v, 'renovation').querySelectorAll('[data-dp-sg-ligne]')).toHaveLength(0);
    expect(visibles(v)).toHaveLength(2);
  });
  it('un sous-groupe d\'une ligne montre sa rangée sans chevron ni ligne', async () => {
    const v = await lire([ligne(1, 'Ponceuse excentrique 125 mm', 'equipment', 1, 'Stk', 89, 89), ligne(2, 'Visseuse sans fil 18 V', 'equipment', 1, 'Stk', 99, 99), ligne(3, 'Mitigeur lavabo chromé', 'equipment', 1, 'Stk', 54, 54)]);
    expect(nomsDe(v)).toEqual(['Outillage']);
    const mitigeur = v.container.querySelector('[data-dp-ligne="line-3"]')!;
    expect(mitigeur.closest('[data-dp-sg]')).toBeNull();
    expect(mitigeur.closest('[hidden]')).toBeNull();
    expect(bande(v, 'renovation').querySelectorAll('[data-dp-sg-ligne]')).toHaveLength(1);
  });
  it('un groupe d\'une ligne jaune ou rouge est ouvert, comme les autres (B2 n° 10, D378 : rien ne se cache à l\'arrivée)', async () => {
    const v = await lire([
      ligne(1, 'Ponceuse excentrique 125 mm', 'equipment', 1, 'Stk', 89, 89), ligne(2, 'Visseuse sans fil 18 V', 'equipment', 1, 'Stk', 99, 99),
      ligne(3, 'Mitigeur lavabo chromé', 'equipment', 1, 'Stk', 54, 54), ligne(4, 'Siphon de sol inox', 'equipment', 1, 'Stk', 46, 46),
      ligne(5, 'Interrupteur va-et-vient blanc', 'equipment', 3, 'Stk', 7.8, 23.4), ligne(6, 'Câble 3G1,5 10 m', 'equipment', null, '', null, 24.9),
    ]);
    const att = Object.fromEntries(groupes(v).map(g => [g.getAttribute('data-dp-sg'), ligneDe(g).getAttribute('aria-expanded')]));
    expect(att['Électricité']).toBe('true');
    expect(att['Outillage']).toBe('true');
    expect(att['Plomberie']).toBe('true');
    expect(corpsDe(parNom(v, 'Électricité')).hidden).toBe(false);
    expect(visibles(v)).toContain('line-6');
    // Le brasseur peut le refermer : son choix prime.
    fireEvent.click(ligneDe(parNom(v, 'Électricité')));
    expect(ligneDe(parNom(v, 'Électricité')).getAttribute('aria-expanded')).toBe('false');
  });
});

describe('D307 : « tout plier, déplier » est prêt, aucun contrôle visible', () => {

  it('Liste appelle son geste sur la ligne de sous-famille avec la bande, le groupe et le sens', () => {
    const l: LigneBande[] = [
      { id: 'a', groupe: 'renovation', sousFamille: 'Outillage', amount: 1, quantity: 1, unit: 'Stk', uniteLisible: true, mouture: false },
      { id: 'b', groupe: 'renovation', sousFamille: 'Outillage', amount: 1, quantity: 1, unit: 'Stk', uniteLisible: true, mouture: false },
      { id: 'c', groupe: 'renovation', sousFamille: 'Plomberie', amount: 1, quantity: 1, unit: 'Stk', uniteLisible: true, mouture: false },
    ];
    const surBascule = vi.fn();
    const lignes = new Map(l.map(x => [x.id, <article key={x.id} data-dp-ligne={x.id}>{x.id}</article>]));
    const r = render(<Liste ordre="cat" bandes={bandes(l)} papier={null} lignes={lignes} filtre={null} visibles={null} nAffichees={3} onSansFiltre={() => {}} rattacherTous={null}
      pied={{ ajouterOff: false, regrouper: false, detail: null }} onAjouter={() => {}} onRegrouper={() => {}} onBasculeGroupe={surBascule}/>);
    fireEvent.click(r.container.querySelector('[data-dp-sg-ligne]')!);
    expect(surBascule).toHaveBeenCalledTimes(1);
    expect(surBascule.mock.calls[0][0]).toBe('renovation'); expect(surBascule.mock.calls[0][1].nom).toBe('Outillage'); expect(surBascule.mock.calls[0][2]).toBe(false); // ouvert à l'arrivée (B2 n° 10) : le toucher le ferme
  });
});
