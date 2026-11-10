// @vitest-environment jsdom
/**
 * Voie n1-nom-fr, l'écran « Nouvelle dépense » : le français arrive après la lecture, sans l'attendre (D280). Modèle : `noms-fr/ecran-noms.test.tsx` et `fiche/ecran.test.tsx`.
 * Le VRAI `traduireLignes` tourne (il saute les lignes déjà reliées, `nomsFr.ts:136-137`) ; seul `AiClient.run` est simulé. Lecture et stock simulés, Gemini jamais appelé.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const etat = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[], kegs: [] as any[] }, scanned: vi.fn(), run: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => etat.stocks, getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => etat.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/aiClient', async orig => { const m = await orig<any>(); return { ...m, AiClient: { ...m.AiClient, run: (...a: any[]) => etat.run(...a) } }; });
import { stockDe, suivreAuStock, toucherNature, toucherUnite } from '../aide-plateau';
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import { art } from './aide';

const item = (id: string, name: string, more: Record<string, unknown> = {}) => ({ id, name, kind: 'stock', quantity: 5, unit: 'Kg', amountTTC: 20, stockCategory: 'malt', ...more });
const lecture = (items: any[]) => ({ vendor: 'Fournisseur fictif', date: '09.09.2026', currency: 'CHF', invoiceNumber: 'TEST-NOM-B', description: 'Malts', amountHT: null, tvaRate: null, tvaAmount: null,
  amountTTC: items.reduce((s, i) => s + i.amountTTC, 0), category: 'matieres', subcategory: 'Malt', issues: [] as string[], items });
const reponse = (...noms: Array<[number, string]>) => ({ ok: true, data: { noms: noms.map(([i, nameFr]) => ({ i, nameFr })) } });

async function lire(items: any[], stock: any[] = [], strict = false) {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  etat.stocks = { rawMaterials: stock, cleaning: [], equipment: [], kegs: [] };
  etat.scanned.mockResolvedValueOnce({ ok: true, result: lecture(items), model: 'rejeu', cached: false });
  const sheet = <ExpenseSheet onClose={() => {}} onSaved={() => {}}/>;
  const view = render(strict ? <React.StrictMode>{sheet}</React.StrictMode> : sheet);
  const file = new File(['%PDF-1.4\n'], 'Facture synthétique.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
}
const ligne1 = (view: { container: HTMLElement }) => view.container.querySelector('[data-dp-ligne="line-1"]') as HTMLElement;
const champNom = () => screen.queryByLabelText('Nom de l’article, ligne 1') as HTMLInputElement | null;
const garder = () => screen.queryAllByRole('button', { name: /^Garder l’article « .* », ligne 1$/u });

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); etat.scanned.mockReset(); etat.run.mockReset();
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('N1 — le nom de l\'article neuf à l\'écran', () => {
  it('le champ « article « … » » dit le nom imprimé à la lecture, puis le français à son arrivée ; « Confirmer » avant l\'arrivée : le nom imprimé', async () => {
    let rendre!: (r: unknown) => void;
    etat.run.mockReturnValueOnce(new Promise(r => { rendre = r; }));
    const view = await lire([item('line-1', 'Wiener Malz')]);
    await waitFor(() => expect(champNom()).not.toBeNull());
    expect(champNom()!.value).toBe('Wiener Malz');
    rendre(reponse([0, 'Malt de Vienne']));
    await waitFor(() => expect(champNom()!.value).toBe('Malt de Vienne'));
    expect(ligne1(view)).toBeTruthy();
  });
  it('un nom tapé par le brasseur n\'est jamais remplacé par le français', async () => {
    let rendre!: (r: unknown) => void;
    etat.run.mockReturnValueOnce(new Promise(r => { rendre = r; }));
    await lire([item('line-1', 'Wiener Malz')]);
    await waitFor(() => expect(champNom()).not.toBeNull());
    fireEvent.change(champNom()!, { target: { value: 'Mon Vienna' } });
    rendre(reponse([0, 'Malt de Vienne']));
    await waitFor(() => expect(etat.run).toHaveBeenCalled());
    await new Promise(r => setTimeout(r, 30));
    expect(champNom()!.value).toBe('Mon Vienna');
  });
});

describe('N3 — l\'arrivée du français relie une ligne neuve intacte, comme à la lecture (D295)', () => {
  const relie = () => screen.queryAllByText(/relié à « Malt de Vienne », nom déjà au stock/u);
  it('« Wiener Malz » → « Malt de Vienne » au stock : relié (cube coché, « nom déjà au stock »), pas de « Garder », pas de jaune', async () => {
    let rendre!: (r: unknown) => void;
    etat.run.mockReturnValueOnce(new Promise(r => { rendre = r; }));
    const view = await lire([item('line-1', 'Wiener Malz')], [art('A', 'Malt de Vienne')]);
    expect(relie()).toHaveLength(0);
    rendre(reponse([0, 'Malt de Vienne']));
    await waitFor(() => expect(relie()).toHaveLength(1));
    expect(garder()).toHaveLength(0);
    expect(ligne1(view).querySelector('[data-dp-lien]')?.getAttribute('data-dp-niveau')).toBeNull();
  });
  it('StrictMode (rendu deux fois) : un seul lien, aucun « Garder » (prouve l\'idempotence du rendu ; les refs sont un Set et une Map : le calcul hors updater est prouvé par la lecture du code et la mutation)', async () => {
    let rendre!: (r: unknown) => void;
    etat.run.mockReturnValueOnce(new Promise(r => { rendre = r; }));
    await lire([item('line-1', 'Wiener Malz')], [art('A', 'Malt de Vienne')], true);
    rendre(reponse([0, 'Malt de Vienne']));
    await waitFor(() => expect(relie()).toHaveLength(1));
    expect(garder()).toHaveLength(0);
  });
  it('le vrai saut : « Haferflocken » face à [Flocons d\'Avoine, Haferflocken] est une proposition « Garder » dès la lecture, jamais envoyée à la traduction', async () => {
    etat.run.mockResolvedValue(reponse());
    await lire([item('line-1', 'Haferflocken', { stockCategory: 'cereale' })], [art('F', 'Flocons d\'Avoine'), art('H', 'Haferflocken')]);
    await waitFor(() => expect(garder()).toHaveLength(1));
    expect(garder()[0].getAttribute('aria-label')).toBe('Garder l’article « Haferflocken », ligne 1');
    expect(etat.run).not.toHaveBeenCalled();
  });
  it('une ligne non reliée dont le français désigne deux articles : « plusieurs articles … : choisis », aucun lien d\'office', async () => {
    let rendre!: (r: unknown) => void;
    etat.run.mockReturnValueOnce(new Promise(r => { rendre = r; }));
    const view = await lire([item('line-1', 'Oat Flakes', { stockCategory: 'cereale' })], [art('F', 'Flocons d\'Avoine'), art('G', 'Flocons d\'avoine')]);
    rendre(reponse([0, 'Flocons d\'avoine']));
    await waitFor(() => expect(view.container.querySelector('[data-dp-ambigu]')).not.toBeNull());
    expect(garder()).toHaveLength(0);
  });
});

describe('une ligne « touchée » n\'est jamais reprise', () => {
  const gestes: Array<[string, () => void]> = [
    ['la quantité', () => fireEvent.change(screen.getByLabelText('Quantité ligne 1'), { target: { value: '6' } })],
    ['l\'unité', () => toucherUnite(1, 'g')]/* 28c98cba (pu4d, D350, p-port-pu4d/RESULTAT.md) : l'unité est un segment, le geste est un toucher sur « g » */,
    ['le nom tapé', () => fireEvent.change(champNom()!, { target: { value: 'Mon Vienna' } })],
  ];
  for (const [nom, geste] of gestes) {
    it(`après ${nom} : le français ne relie pas la ligne`, async () => {
      let rendre!: (r: unknown) => void;
      etat.run.mockReturnValueOnce(new Promise(r => { rendre = r; }));
      await lire([item('line-1', 'Wiener Malz')], [art('A', 'Malt de Vienne')]);
      await waitFor(() => expect(champNom()).not.toBeNull());
      geste();
      rendre(reponse([0, 'Malt de Vienne']));
      await waitFor(() => expect(etat.run).toHaveBeenCalled());
      await new Promise(r => setTimeout(r, 30));
      expect(garder()).toHaveLength(0);
      expect(screen.queryAllByText(/nom déjà au stock/u)).toHaveLength(0);
      /* DP-4 (10.11) : un article du stock porte le nom français de la ligne : la vue FACTURE | STOCK et ses trois sorties s'ouvrent (le brasseur choisit), à la place du seul champ du nom. */
      expect(champNom() ?? screen.queryByRole('radiogroup', { name: /Article de la ligne 1/ })).not.toBeNull();
    });
  }
});

describe('les autres gestes du brasseur empêchent la reprise', () => {
  const sansLien = async (geste: () => void) => {
    let rendre!: (r: unknown) => void;
    etat.run.mockReturnValueOnce(new Promise(r => { rendre = r; }));
    await lire([item('line-1', 'Wiener Malz')], [art('A', 'Malt de Vienne')]);
    await waitFor(() => expect(champNom()).not.toBeNull());
    geste();
    rendre(reponse([0, 'Malt de Vienne']));
    await waitFor(() => expect(etat.run).toHaveBeenCalled());
    await new Promise(r => setTimeout(r, 30));
    expect(garder()).toHaveLength(0);
    expect(screen.queryAllByText(/nom déjà au stock/u)).toHaveLength(0);
  };
  it('la nature changée (`manuallyClassified`) : la ligne n\'est pas reliée', async () => {
    await sansLien(() => fireEvent.click(within(screen.getByRole('group', { name: 'Type d’achat, ligne 1' })).getByRole('button', { name: 'Service' })));
  });
  it('« Créer un nouvel article » choisi au menu (`neufDOffice` vidé) : la ligne n\'est pas reprise', async () => {
    // 28c98cba (pu4d, D350, p-port-pu4d/RESULTAT.md) : plus de menu « Stock ligne 1 » ; le seul geste qui pose « nouvel article » (et vide `neufDOffice`) est « Suivre au stock » d'une ligne hors stock : on y passe par la nature (Service, puis Ingrédient).
    await sansLien(() => { toucherNature(1, 'Service'); toucherNature(1, 'Ingrédient'); suivreAuStock(1); });
    expect(stockDe(1)).toBe('new');
  });
  it('« Ajouter à un article existant » choisi (lien choisi) : le français ne le remplace pas', async () => {
    // 28c98cba (pu4d, D350, p-port-pu4d/RESULTAT.md) : « Ajouter à un article existant » est le ⇄ « Choisir un autre article ».
    await sansLien(() => fireEvent.click(screen.getByRole('button', { name: 'Choisir un autre article' })));
    expect(stockDe(1)).toBe('existing');
  });
});

describe('ce qui est montré est ce qui est écrit : le bouton « bis »', () => {
  it('« Kaskade 7,5 % CH » (français « Houblon Cascade ») face à « Cascade » US : le bouton et le nom disent « Houblon Cascade CH »', async () => {
    let rendre!: (r: unknown) => void;
    etat.run.mockReturnValueOnce(new Promise(r => { rendre = r; }));
    await lire([item('line-1', 'Kaskade 7,5 % CH', { unit: 'g', stockCategory: 'houblon', quantity: 100 })], [art('H', 'Cascade', 'Houblon', 'g', { origin: 'US', alphaPct: 7.5 })]);
    rendre(reponse([0, 'Houblon Cascade']));
    await waitFor(() => expect(screen.queryAllByRole('button', { name: 'Garder le nouvel article « Houblon Cascade CH »' })).toHaveLength(1));
    expect(screen.getByRole('button', { name: 'Garder le nouvel article « Houblon Cascade CH »' }).textContent).toBe('Houblon Cascade CH');
    // 28c98cba (pu4d, D350, p-port-pu4d/RESULTAT.md) : le nom du bis n'a plus de champ (seul « Nouvel article · doublon » en a un) : il est le titre de la sortie « bis » du plateau.
    expect(document.querySelector('[data-dp-ligne="line-1"] [data-dp-sortie="bis"]')!.textContent).toContain('Houblon Cascade CH');
  });
});

describe('confiance = plateau', () => {
  it('une ligne reliée par le français est la même pour la rangée et pour sa pastille de confiance (reliée, sûre : aucun niveau, « article relié »)', async () => {
    let rendre!: (r: unknown) => void;
    etat.run.mockReturnValueOnce(new Promise(r => { rendre = r; }));
    const view = await lire([item('line-1', 'Wiener Malz')], [art('A', 'Malt de Vienne')]);
    rendre(reponse([0, 'Malt de Vienne']));
    await waitFor(() => expect(screen.queryAllByText(/relié à « Malt de Vienne »/u)).toHaveLength(1));
    const rangee = ligne1(view);
    expect(within(rangee).queryAllByText(/aucun article choisi/u)).toHaveLength(0);
    expect(rangee.querySelector('[data-dp-nom][data-dp-niveau]')).toBeNull();
    expect(document.body.textContent).toMatch(/1\s*relié/u); // le récap : « 1 relié »
  });
});
