// @vitest-environment jsdom
/**
 * Voie s6-fiche, l'écran « Nouvelle dépense » : le bouton propose le bon nom (R2, R3, R4), le nom tapé n'est jamais écrasé (R9), le menu « Créer » donne un nom libre (R12, R13),
 * la pastille dit la fiche et sa marque. Lecture SIMULÉE (sortie du vrai rapprochement du serveur), stock SIMULÉ, Gemini et Drive jamais touchés.
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

const article = (ref: string, name: string, category: string, unit: string, more: Record<string, unknown> = {}) => ({ id: ref, ref, name, category, unit, currentStock: 10, minStock: 0, reorder: false, ...more });
const stockDeBase = () => (stockJson.articles as any[]).filter(a => a.name !== 'Verdant IPA').map(a => (a.name === 'Target' ? { ...a, name: 'Target 11.8%' } : a));
/** `items` : modifications de la lecture (index 0 = ligne 1) ; `stock` : articles ajoutés ou remplacés. */
const lire = async (items: Record<number, Record<string, unknown>> = {}, stock: any[] = [], retirer: string[] = []) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.stocks = { rawMaterials: [...stockDeBase().filter(a => !retirer.includes(a.name)), ...stock], cleaning: [], equipment: [], kegs: [] };
  const resultat = JSON.parse(JSON.stringify(lecture));
  for (const [i, patch] of Object.entries(items)) Object.assign(resultat.items[Number(i)], patch);
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result: resultat });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  const file = new File(['%PDF-1.4\n'], 'facture-372765.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
const ligne = (view: { container: HTMLElement }, n: number) => (view.container.querySelector('[data-dp-ligne="line-' + n + '"]')) as HTMLElement; // R1 : par id, jamais par rang (les bandes réordonnent le DOM)
beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.transactions = [];
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('R2, R3, R4 : le bouton dit le nom qui sera écrit', () => {
  it('R2 : « Target 11.3% » face à « Target 11.8% » : « Créer « Target bis » », ⇄ « Choisir un autre article » (r2b) gardé', async () => {
    const view = await lire();
    expect(within(ligne(view, 8)).getByRole('button', { name: 'Garder le nouvel article « Target bis »' })).toBeInTheDocument();
    expect(within(ligne(view, 8)).getAllByRole('button', { name: 'Choisir un autre article' }).length).toBeGreaterThan(0); // D275 (voie f3) : ⇄ de la barre et du plateau
  });
  it('R3 : « Cascade CH » face à « Cascade US » : « Créer « Cascade CH » » et ⇄ (aujourd’hui : aucun bouton, la ligne n’a pas d’α)', async () => {
    const view = await lire({ 8: { name: 'Cascade CH', alphaPct: null, alphaPctLu: null } }, [article('MP-Cascade', 'Cascade US', 'Houblon', 'g')]);
    expect(within(ligne(view, 9)).getByRole('button', { name: 'Garder le nouvel article « Cascade CH »' })).toBeInTheDocument();
    expect(within(ligne(view, 9)).getAllByRole('button', { name: 'Choisir un autre article' }).length).toBeGreaterThan(0); // D275 (voie f3) : ⇄ de la barre et du plateau
  });
  it('R4 : Target et Target bis au stock, « Target 12.5% » : « Créer « Target bis 2 » »', async () => {
    const view = await lire({ 7: { name: 'Target 12.5%', alphaPct: 12.5, alphaPctLu: 12.5 } }, [article('MP-Tbis', 'Target bis', 'Houblon', 'g', { alphaPct: 11.3 })]);
    expect(within(ligne(view, 8)).getByRole('button', { name: 'Garder le nouvel article « Target bis 2 »' })).toBeInTheDocument();
  });
});

describe('R9 : un nom tapé n’est jamais écrasé', () => {
  it('« Créer » ouvre le champ « Nom de l’article » pré-rempli ; ce qu’on y tape reste après un changement de libellé, et part dans le brouillon enregistré', async () => {
    const view = await lire();
    fireEvent.click(within(ligne(view, 8)).getByRole('button', { name: 'Garder le nouvel article « Target bis »' }));
    const champ = await screen.findByLabelText('Nom de l’article, ligne 8');
    expect(champ).toHaveValue('Target bis');
    fireEvent.change(champ, { target: { value: 'Target du Banc' } });
    fireEvent.change(screen.getByLabelText('Libellé ligne 8'), { target: { value: 'Target 11.4%' } });
    expect(screen.getByLabelText('Nom de l’article, ligne 8')).toHaveValue('Target du Banc');
  });
  it('vider le champ rend la main au nom proposé', async () => {
    const view = await lire();
    fireEvent.click(within(ligne(view, 8)).getByRole('button', { name: 'Garder le nouvel article « Target bis »' }));
    const champ = await screen.findByLabelText('Nom de l’article, ligne 8');
    fireEvent.change(champ, { target: { value: 'Autre' } });
    fireEvent.change(champ, { target: { value: '' } });
    await waitFor(() => expect(screen.getByLabelText('Nom de l’article, ligne 8')).toHaveValue('Target bis'));
  });
});

describe('R12, R13 : le menu « Créer un nouvel article »', () => {
  it('R12 : Maris Otter (déjà au stock) relie ; retiré du stock, le menu donne le nom propre « Maris Otter » dans le champ', async () => {
    const view = await lire({}, [], ['Maris Otter']);
    fireEvent.change(screen.getByLabelText('Stock ligne 1'), { target: { value: 'none' } });
    fireEvent.change(screen.getByLabelText('Stock ligne 1'), { target: { value: 'new' } });
    expect(await screen.findByLabelText('Nom de l’article, ligne 1')).toHaveValue('Maris Otter');
    expect(view.container).toBeTruthy();
  });
  it('R13 : « Target » sans α face à Target (11,8) et Target bis (11,3) : pas de bouton « Créer », « plusieurs articles », le menu donne un nom libre', async () => {
    const view = await lire({ 7: { name: 'Target', alphaPct: null, alphaPctLu: null } }, [article('MP-T', 'Target', 'Houblon', 'g', { alphaPct: 11.8 }), article('MP-Tbis', 'Target bis', 'Houblon', 'g', { alphaPct: 11.3 })], ['Target 11.8%']);
    expect(within(ligne(view, 8)).queryByRole('button', { name: /^Créer «/ })).toBeNull();
    expect(ligne(view, 8).textContent).toMatch(/plusieurs articles « Target » : choisis/);
    fireEvent.change(screen.getByLabelText('Stock ligne 8'), { target: { value: 'new' } });
    expect(await screen.findByLabelText('Nom de l’article, ligne 8')).toHaveValue('Target bis 2');
  });
  it('Cascade CH 8% (déjà de la famille « Cascade US ») : l’α et l’origine sont ceux du libellé, le nom tapé part dans le brouillon enregistré', async () => {
    const enregistrer = vi.fn(async () => undefined);
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    const resultat = JSON.parse(JSON.stringify(lecture)); Object.assign(resultat.items[8], { name: 'Cascade CH 8%', alphaPct: 8, alphaPctLu: 8 });
    const stocks = { rawMaterials: [...stockDeBase(), article('MP-C', 'Cascade US', 'Houblon', 'g')], cleaning: [], equipment: [], kegs: [] };
    state.stocks = stocks;
    const apercu = { outcome: { ok: true, result: resultat, proofDataUrl: '', fileName: 'f.pdf', mimeType: 'application/pdf' }, fichier: { name: 'f.pdf', size: 1000, type: 'application/pdf' }, stocks, transactions: [], etat: '3', drive: 'ok', reseau: true, enregistrer } as any;
    const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}} apercu={apercu}/>);
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    fireEvent.click(within(ligne(view, 9)).getByRole('button', { name: 'Garder le nouvel article « Cascade CH »' }));
    fireEvent.change(await screen.findByLabelText('Nom de l’article, ligne 9'), { target: { value: 'Cascade du Banc' } });
    // D275 (voie f3) : Sabro « 30 » prend l'unité de ses voisines (g, jaune) ; plus de « g » à toucher avant d'enregistrer.
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer et enregistrer' }));
    await waitFor(() => expect(enregistrer).toHaveBeenCalledTimes(1), { timeout: 4000 });
    const brouillon = (enregistrer.mock.calls[0] as any[])[0];
    expect(brouillon.lines[8]).toMatchObject({ stockAction: 'new', articleName: 'Cascade du Banc' });
    expect(brouillon.lines.filter((l: any) => l.articleName !== undefined)).toHaveLength(1);
  });
});

describe('la pastille dit la fiche et sa marque', () => {
  it('une ligne nouvelle sans fiche reste « nouveau » ; Cascade CH : « fiche Cascade US · approchée » ; Target bis : « fiche Target UK » ; le plateau le redit', async () => {
    const view = await lire({ 8: { name: 'Cascade CH', alphaPct: null, alphaPctLu: null } }, [article('MP-Cascade', 'Cascade US', 'Houblon', 'g')]);
    fireEvent.click(within(ligne(view, 9)).getByRole('button', { name: 'Garder le nouvel article « Cascade CH »' }));
    fireEvent.click(within(ligne(view, 8)).getByRole('button', { name: 'Garder le nouvel article « Target bis »' }));
    await waitFor(() => expect(ligne(view, 9).querySelector('[data-dp-pastille]')?.textContent).toBe('fiche Cascade US · approchée'), { timeout: 5000 });
    expect(ligne(view, 8).querySelector('[data-dp-pastille]')?.textContent).toBe('fiche Target UK');
    // VERDICT-f3 défaut 1 (voie f3) : la fiche ne se dit qu'une fois, par la pastille ; sa phrase entière est son titre (HEAD : un [data-dp-fiche] en plus).
    expect(ligne(view, 9).querySelector('[data-dp-pastille]')?.getAttribute('title')).toBe('fiche Cascade US · approchée (pas exactement la bonne)');
    expect(ligne(view, 20).querySelector('[data-dp-pastille]')?.textContent ?? '').not.toMatch(/fiche/);
  });
});

describe('tri n° 5 à 9 : les vraies valeurs, le bouton court, la pastille d’attention, le libellé, Sabro', () => {
  it('n° 5 : « 40 g · α 11,3 » sous la ligne, l’article grisé « Target α 11,8 », puis « α 11,3 » à côté de la fiche dans le plateau', async () => {
    const view = await lire();
    expect(ligne(view, 8).querySelector('[data-dp-qte]')?.textContent).toMatch(/40 g/); expect(ligne(view, 8).querySelector('[data-dp-alpha]')?.textContent).toMatch(/α.*11,3/);
    expect(ligne(view, 8).textContent).toContain('Target α 11,8');
    fireEvent.click(within(ligne(view, 8)).getByRole('button', { name: 'Garder le nouvel article « Target bis »' }));
    await screen.findByLabelText('Nom de l’article, ligne 8');
    expect(ligne(view, 8).querySelector('[data-dp-valeurs]')?.textContent).toBe('α 11,3');
    expect(ligne(view, 8).querySelector('[data-dp-alpha]')?.textContent).toMatch(/α.*11,3/);
  });
  it('n° 5 : l’origine et l’EBC lus, jamais une valeur inconnue (Cascade CH sans α : pas d’α)', async () => {
    const view = await lire({ 8: { name: 'Cascade CH', alphaPct: null, alphaPctLu: null }, 0: { name: 'Münchner Malz 15 EBC' } }, [article('MP-C', 'Cascade US', 'Houblon', 'g'), article('MP-M', 'Münchner Malz', 'Malt', 'kg', { colorEbc: 20 })], ['Maris Otter']);
    expect(ligne(view, 1).textContent).toMatch(/15 EBC/);
    expect(ligne(view, 1).textContent).toContain('Münchner Malz 20 EBC');
    expect(ligne(view, 9).textContent).not.toMatch(/α/);
    expect(ligne(view, 9).textContent).toContain('Cascade US');
    fireEvent.click(within(ligne(view, 9)).getByRole('button', { name: 'Garder le nouvel article « Cascade CH »' }));
    await screen.findByLabelText('Nom de l’article, ligne 9');
    expect(ligne(view, 9).querySelector('[data-dp-valeurs]')?.textContent).toBe('origine CH');
  });



  it('n° 9 (D275, voie f3) : une ligne d’ingrédient inconnue (Goldings East Kent) est nouvel article d’office, picto « nouvel article », aucun bouton « Créer »', async () => {
    const view = await lire();
    expect(within(ligne(view, 9)).queryByRole('button', { name: /^Créer/ })).toBeNull();
    expect(ligne(view, 9).querySelector('[data-dp-creer]')).toBeNull();
    expect(within(ligne(view, 9)).queryByRole('button', { name: /^Relier à/ })).toBeNull();
    expect(ligne(view, 9).querySelector('summary svg[aria-label="nouvel article"]')).not.toBeNull();
    expect(screen.getByLabelText('Stock ligne 9')).toHaveValue('new');
    expect(await screen.findByLabelText('Nom de l’article, ligne 9')).toHaveValue('Goldings East Kent');
  });
});

describe('tri n° 13 à 17 : le nom refusé, le ⇄ de r2b, la bande collante, les accords, « origine CH »', () => {
  it('n° 13 : tant que le nom tapé est refusé, la tête de ligne garde le nom proposé ; le nom tapé reste dans son champ avec le message', async () => {
    const view = await lire({}, [], []);
    fireEvent.click(within(ligne(view, 8)).getByRole('button', { name: 'Garder le nouvel article « Target bis »' }));
    const champ = await screen.findByLabelText('Nom de l’article, ligne 8');
    fireEvent.change(champ, { target: { value: 'Galaxy' } });
    expect(ligne(view, 8).querySelector('[data-dp-nom]')?.textContent).toBe('Target bis');
    expect(ligne(view, 8).querySelector('[role="alert"]')?.textContent).toMatch(/Un article porte déjà ce nom/);
    expect(screen.getByLabelText('Nom de l’article, ligne 8')).toHaveValue('Galaxy');
    fireEvent.change(champ, { target: { value: 'Target du Banc' } });
    expect(ligne(view, 8).querySelector('[data-dp-nom]')?.textContent).toBe('Target du Banc');
    expect(ligne(view, 8).querySelector('[role="alert"]')).toBeNull();
  });
  it('n° 14 : ⇄ « Choisir un autre article » ouvre le plateau sur le choix de l’article et ne relie rien ; l’article se choisit dans le plateau', async () => {
    const view = await lire({ 8: { name: 'Cascade CH', alphaPct: null, alphaPctLu: null } }, [article('MP-Cascade', 'Cascade US', 'Houblon', 'g')]);
    fireEvent.click(within(ligne(view, 9)).getAllByRole('button', { name: 'Choisir un autre article' })[0]); // D275 (voie f3) : le ⇄ de la barre et celui du plateau (« article « … » · nouvel article ⇄ »)
    expect(screen.getByLabelText('Stock ligne 9')).toHaveValue('existing');
    expect(ligne(view, 9).querySelector('[data-dp-pastille]')).toBeNull(); // C1 (g2a) : une seule pastille, « article « ? » · à choisir »
    expect(within(ligne(view, 9)).getByLabelText('Article')).toBeInTheDocument();
    expect(within(ligne(view, 9)).queryByText(/^\+20 g$/)).toBeNull();
    fireEvent.change(within(ligne(view, 9)).getByLabelText('Article'), { target: { value: 'Cascade US' } });
    fireEvent.click(await within(ligne(view, 9)).findByRole('option', { name: /Cascade US/ }));
    await waitFor(() => expect(ligne(view, 9).querySelector('[data-dp-pastille]')?.textContent).toBe('+20 g'));
  });

  it('n° 16 : le compteur accorde le nombre', async () => {
    const view = await lire();
    const compte = () => view.container.querySelector('[data-dp="compte-liens"]')?.textContent ?? '';
    expect(compte()).toMatch(/\d+ relié/);
    expect(compte()).not.toMatch(/\b0 nouveau/); // verdict p3c-port, point 2 : un compte à zéro n'est pas affiché (HEAD : « 0 nouveau » attendu)
    // D275 (voie f3) : les ingrédients sans article sont nouveaux d'office ; un bis compte « bis » tant qu'il n'est pas gardé, puis « nouveau ».
    const n = () => Number(/(\d+) nouveaux?/.exec(compte())?.[1] ?? 0);
    const avant = n();
    expect(avant).toBeGreaterThan(1);
    expect(compte()).toMatch(new RegExp(`${avant} ${avant > 1 ? 'nouveaux' : 'nouveau(?!x)'}`));
    fireEvent.click(within(ligne(view, 8)).getByRole('button', { name: 'Garder le nouvel article « Target bis »' }));
    await waitFor(() => expect(n()).toBe(avant + 1));
    fireEvent.change(screen.getByLabelText('Stock ligne 9'), { target: { value: 'none' } });
    await waitFor(() => expect(n()).toBe(avant));
    expect(compte()).not.toMatch(/hors stock/); // A3 (g2a) : « hors stock » n'est dans aucune maquette
  });
});
