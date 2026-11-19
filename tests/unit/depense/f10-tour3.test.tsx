// @vitest-environment jsdom
/**
 * Carnet tour 3, voie f10 (Dépense, derniers problèmes de la critique v5b) : v3-5 (pied coupé à 390), doc2 (variante de fournisseur comptée en désaccord),
 * LR1-7 (prix déduit dit par la seule couleur), saisie à la main de 3,00 (6 rangées « Ligne sans libellé » ?). Lectures FICTIVES ; Gemini jamais appelé.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ transactions: [] as any[], saved: vi.fn(), scanned: vi.fn(), traduire: vi.fn() }));
vi.mock('../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }), getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../src/services/nomsFr', async importOriginal => ({ ...await importOriginal<any>(), traduireLignes: (...a: any[]) => state.traduire(...a), retenirNomBrasseur: async () => undefined }));
vi.mock('../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(), savePurchaseWithProofReceipt: async (d: any) => { state.saved(structuredClone(d)); return { transactionId: 'TX-test' }; }, confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../src/services/firebaseAuth';
import { lecturesLenteur } from '../../../src/ui/depense/apercuDev';
import { Pied } from '../../../src/ui/depense/Pied';
import { confianceEntete, pointsAMontrer } from '../../../src/ui/depense/confiance';

const sortie = (result: any) => ({ ok: true, model: 'rejeu', proofDataUrl: '', fileName: 'f.pdf', mimeType: 'application/pdf', result });
const fichier = (view: ReturnType<typeof render>) => {
  const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
};
const desaccord = (o: Record<string, unknown>) => ({ code: 'lectures-divergentes', gravite: 'ecart', origine: 'lecture', bloque: false, regle: 'les lectures indépendantes lisent la même valeur', lu: null, calcule: null, ecart: null, unite: 'texte', source: 'désaccord', pese: true, ...o });
/** doc2 (forme) : le règlement (sans ligne) d'abord, puis la variante de la ligne 2 lue par une seule lecture. */
const POINTS_DOC2 = [
  desaccord({ enjeu: 'info', champ: 'paymentEvidence', champs: ['paymentEvidence'], ligne: null, cle: 'lectures-divergentes:-:paymentEvidence', luTexte: 'unknown', message: 'Paiement : lectures divergentes (unknown / unpaid), vérifier le justificatif.', valeurs: [{ lecture: 1, valeur: 'unknown', retenue: true }, { lecture: 2, valeur: 'unpaid', retenue: false }] }),
  desaccord({ enjeu: 'stock', champ: 'items', champs: ['items.2.variant'], ligne: 2, cle: 'lectures-divergentes:2:variant', message: 'Collerette Velfast — taille ou variante : lectures divergentes (absent / ROUGE 25cm), vérifier les articles du justificatif.', valeurs: [{ lecture: 1, valeur: null, retenue: true }, { lecture: 2, valeur: 'ROUGE 25cm', retenue: false }] }),
];
async function lire(maj: (final: any) => void = () => {}) {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const { final } = lecturesLenteur('perdue') as any;
  maj(final);
  state.scanned.mockResolvedValue(sortie(final));
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  fichier(view);
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  await waitFor(() => expect(view.container.querySelector('article[data-purchase-line]')).not.toBeNull());
  return view;
}
const rangees = (view: ReturnType<typeof render>) => [...view.container.querySelectorAll<HTMLElement>('article[data-purchase-line]')];

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.traduire.mockReset(); state.transactions = [];
  state.traduire.mockResolvedValue(new Map());
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const piedVide = (texte: string) => render(<Pied ordre="cat" onOrdre={() => {}} statut={null} courant={null} tout={false} onAllerCourant={() => {}}
  bouton={{ texte, aria: 'Vérification en cours', icone: 'spin', disabled: true, onClick: () => {} }} cible={{ current: null }} racine={{ current: null }} keyboardInset={false} aPoints={false}/>);

describe('v3-5 suite : à 390, le pied dit en entier ce qu’on attend (« 3e lecture en c… » coupé)', () => {
  it('le bouton principal rétrécit et passe à la ligne (jamais coupé, jamais hors de l’écran) ; son texte est entier', () => {
    const view = piedVide('3e lecture en cours…');
    const b = view.container.querySelector<HTMLElement>('[data-primary]')!;
    expect(b.textContent).toContain('3e lecture en cours…');
    // shrink-0 + nowrap : le bouton gardait sa largeur d’une ligne et sortait de l’écran à droite (v35b-0-390-clair).
    expect(b.className).not.toMatch(/\bshrink-0\b|\bwhitespace-nowrap\b|\btruncate\b/);
    const t = b.querySelector<HTMLElement>('[data-dp="pied-texte"]');
    expect(t).not.toBeNull();
    expect(t!.textContent).toBe('3e lecture en cours…');
    expect(t!.className).not.toMatch(/truncate|line-clamp|whitespace-nowrap/);
  });
});

const VENDOR_DOC2 = desaccord({ enjeu: 'info', champ: 'vendor', champs: ['vendor'], ligne: null, cle: 'lectures-divergentes:-:vendor', luTexte: 'Drs H. et I. Gauderon-Comment Sàrl',
  message: 'Fournisseur : lectures divergentes (Drs H. et I. Gauderon-Comment Sàrl / Cabinet Vétérinaire Drs H. et I. Gauderon-Comment Sàrl / Drs H. et I. Gauderon-Comment Sàrl - Médecins vétérinaires), vérifier le justificatif.',
  valeurs: [{ lecture: 1, valeur: 'Drs H. et I. Gauderon-Comment Sàrl', retenue: true }, { lecture: 2, valeur: 'Cabinet Vétérinaire Drs H. et I. Gauderon-Comment Sàrl', retenue: false }, { lecture: 3, valeur: 'Drs H. et I. Gauderon-Comment Sàrl - Médecins vétérinaires', retenue: false }] });
const VENDOR_AUTRE = desaccord({ enjeu: 'info', champ: 'vendor', champs: ['vendor'], ligne: null, cle: 'lectures-divergentes:-:vendor', luTexte: 'Brauhaus Ouest',
  message: 'Fournisseur : lectures divergentes (Brauhaus Ouest / Hopfenhandel Zürich), vérifier le justificatif.',
  valeurs: [{ lecture: 1, valeur: 'Brauhaus Ouest', retenue: true }, { lecture: 2, valeur: 'Hopfenhandel Zürich', retenue: false }] });

describe('doc2 : trois lectures du même cabinet (variantes d’un même nom) ne sont pas un désaccord', () => {
  it('pointsAMontrer tait la variante de fournisseur, garde un vrai désaccord de fournisseur', () => {
    expect(pointsAMontrer([VENDOR_DOC2 as any])).toEqual([]);
    expect(pointsAMontrer([VENDOR_AUTRE as any])).toHaveLength(1);
  });
  it('l’en-tête : le fournisseur variante reste sûr ; un vrai désaccord le baisse', () => {
    const b = { vendor: 'Drs H. et I. Gauderon-Comment Sàrl', date: '2026-06-25', amount: 768.55 };
    expect(confianceEntete({ points: [VENDOR_DOC2 as any] } as any, b).fournisseur.niveau).toBe('sur');
    expect(confianceEntete({ points: [VENDOR_AUTRE as any] } as any, { ...b, vendor: 'Brauhaus Ouest' }).fournisseur.niveau).not.toBe('sur');
  });
  it('à l’écran (3 lectures) : « Lectures 3/3 d’accord », aucun « 1 valeur en désaccord », aucun « À confirmer » au fournisseur', async () => {
    const view = await lire(f => { f.points = [VENDOR_DOC2]; f.review = { ...f.review, readers: 3 }; });
    await waitFor(() => expect(view.container.textContent).toMatch(/3\/3 d'accord/));
    expect(view.container.textContent).not.toMatch(/valeurs? en désaccord/);
    expect(view.container.querySelector('[data-dp-renvoi="lectures"]')).toBeNull();
    expect(view.container.textContent).not.toMatch(/Fournisseur : lectures divergentes/);
  });
  it('un vrai désaccord de fournisseur se compte toujours (« 1 valeur en désaccord »)', async () => {
    const view = await lire(f => { f.points = [VENDOR_AUTRE]; f.review = { ...f.review, readers: 3 }; });
    await waitFor(() => expect(view.container.textContent).toMatch(/1 valeur en désaccord/));
  });
});

describe('LR1-7 : le prix déduit se dit en mots (title et texte accessible « déduit : 50,00 ÷ 2 »), pas seulement par la couleur', () => {
  it('prix vidé : la rangée dit « prix déduit : 50,00 ÷ 2 » (title et texte lu) ; quantité 4 : le champ écrit par le trio le dit aussi (title, aria-describedby)', async () => {
    const view = await lire(f => { Object.assign(f.items[0], { quantity: 2, unit: '', price: 25, amountTTC: 50 }); });
    const l1 = () => rangees(view)[0];
    const champ = () => l1().querySelector<HTMLInputElement>('[aria-label="Prix ligne 1"]')!;
    await act(async () => { fireEvent.focus(champ()); fireEvent.change(champ(), { target: { value: '' } }); fireEvent.blur(champ()); });
    await waitFor(() => expect(l1().querySelector('[data-dp-prix]')!.textContent).toBe('25,00'));
    const prix = l1().querySelector<HTMLElement>('[data-dp-prix]')!;
    expect(prix.getAttribute('title')).toMatch(/déduit : 50,00 ÷ 2/);
    const lu = l1().querySelector<HTMLElement>('[data-dp-prix-dit]');
    expect(lu).not.toBeNull();
    expect(lu!.className).toMatch(/sr-only/);
    expect(lu!.textContent).toMatch(/prix déduit : 50,00 ÷ 2/);
    const qte = l1().querySelector<HTMLInputElement>('[aria-label="Quantité ligne 1"]')!;
    await act(async () => { fireEvent.focus(qte); fireEvent.change(qte, { target: { value: '4' } }); fireEvent.blur(qte); });
    await waitFor(() => expect(champ().value).toBe('12,50'));
    expect(champ().getAttribute('title')).toMatch(/déduit : 50,00 ÷ 4/);
    const dit = champ().getAttribute('aria-describedby');
    expect(dit).toBeTruthy();
    expect(view.container.querySelector(`[id="${dit}"]`)!.textContent).toMatch(/prix déduit : 50,00 ÷ 4/);
    await act(async () => { fireEvent.focus(champ()); fireEvent.change(champ(), { target: { value: '24' } }); fireEvent.blur(champ()); });
    expect(champ().getAttribute('title')).toBeNull();
    expect(champ().getAttribute('aria-describedby')).toBeNull();
    expect(l1().querySelector('[data-dp-prix-dit]')).toBeNull();
  });
});

describe('saisie à la main d’une dépense de 3,00 : combien de rangées ?', () => {
  it('total 3 : une seule rangée ; « Ajouter une ligne » deux fois : trois rangées, jamais six', async () => {
    const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
    const total = view.container.querySelector<HTMLInputElement>('#purchase-total')!;
    await act(async () => { fireEvent.focus(total); fireEvent.change(total, { target: { value: '3' } }); fireEvent.blur(total); });
    const n = () => rangees(view).length;
    expect(n()).toBeLessThanOrEqual(1);
    const ajouter = () => [...view.container.querySelectorAll<HTMLButtonElement>('button')].find(b => /^\+?\s*Ajouter une ligne$/.test((b.textContent ?? '').trim()))!;
    const avant = n();
    await act(async () => { fireEvent.click(ajouter()); });
    await act(async () => { fireEvent.click(ajouter()); });
    expect(n()).toBe(avant + 2);
    expect(n()).toBeLessThanOrEqual(3);
  });
});
