// @vitest-environment jsdom
/**
 * Voie qr-app : le sceau QR de z2 (D246) dans l'écran en ligne. La lecture du QR (`lireQrDuFichier`) est SIMULÉE (le vrai décodage se joue dans Chrome) ;
 * Gemini, Drive et l'enregistrement aussi. Pièce fictive : « Malterie Fictive SA », F-1001, 110,40 CHF, 12.10.2026.
 * Règles tenues : le QR est lu à côté de Gemini (jamais attendu) ; « Confirmer » n'est jamais bloqué ; aucun champ ne change sans un geste du brasseur.
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { charge, QR_IBAN, QRR } from './aide';

const state = vi.hoisted(() => ({ scanned: vi.fn(), saved: vi.fn(), onSaved: vi.fn(), qr: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/qrLecture', () => ({ lireQrDuFichier: (...a: any[]) => state.qr(...a) }));
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(),
  savePurchaseWithProofReceipt: async (draft: any) => { state.saved(structuredClone(draft)); return { transactionId: 'TX-test' }; }, confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import { parseSwissQr } from '../../../../src/services/qrFacture';

const S1 = '//S1/10/F-1001/11/261012/32/8.1/40/0:30';
const CREANCIER = ['S', 'Malterie Fictive SA', 'Route de la Malterie', '1', '1000', 'Lausanne', 'CH'];
const qrLu = (o = {}) => ({ statut: 'lu' as const, ms: 500, qr: parseSwissQr(charge({ creancier: CREANCIER, debiteur: ['', '', '', '', '', '', ''], montant: '110.40', s1: S1, ...o }))! });
const lecture = (montant = 110.4, more: Record<string, unknown> = {}) => ({ documentType: 'invoice', paymentEvidence: 'paid', vendor: 'Malterie Fictive SA', date: '12.10.2026', currency: 'CHF', invoiceNumber: 'F-1001',
  amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: montant, category: 'brassage', subcategory: '', description: 'Malts', issues: [], fieldWarnings: [], review: { status: 'checked', findings: [], readers: 2 },
  items: [{ id: 'line-1', name: 'Maris Otter', kind: 'stock', quantity: 25, unit: 'Kg', price: 2.1, amountTTC: 52.5, stockCategory: '' }, { id: 'line-2', name: 'Pilsner Malz', kind: 'stock', quantity: 30, unit: 'Kg', price: 1.93, amountTTC: 57.9, stockCategory: '' }], ...more });

const send = (view: ReturnType<typeof render>, name = 'facture-qr.png') => {
  const file = new File(['%PDF-1.4\n' + name], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n' + name).buffer });
  fireEvent.change(view.container.querySelector('input[aria-label="Importer un justificatif"]')!, { target: { files: [file] } });
  return file;
};
const open = async (qr: unknown, montant = 110.4, more: Record<string, unknown> = {}) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.qr.mockImplementation(() => qr instanceof Promise ? qr : Promise.resolve(qr));
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'simule', result: lecture(montant, more) });
  const view = render(createElement(ExpenseSheet, { onClose: () => {}, onSaved: state.onSaved }));
  const file = send(view);
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return { view, file };
};
const sceau = () => document.querySelector<HTMLButtonElement>('[data-dp="sceau-qr"]');
const total = () => Number((screen.getByLabelText('Total TTC en CHF') as HTMLInputElement).value.replace(',', '.'));
const confirmer = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Confirmer et enregistrer' }));
  await waitFor(() => expect(state.saved).toHaveBeenCalled());
  return state.saved.mock.calls.at(-1)![0];
};

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.scanned.mockReset(); state.saved.mockReset(); state.onSaved.mockReset(); state.qr.mockReset();
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('le QR est lu à côté de Gemini, avec le fichier choisi', () => {
  it('la lecture du QR reçoit le fichier choisi', async () => {
    const { file } = await open(qrLu());
    await waitFor(() => expect(sceau()).not.toBeNull());
    expect(state.qr).toHaveBeenCalledTimes(1);
    expect(state.qr.mock.calls[0][0]).toBe(file);
  });
  it('un QR qui ne finit jamais ne retarde ni la lecture de Gemini ni « Confirmer » : le sceau attend, la dépense s’enregistre', async () => {
    await open(new Promise(() => undefined));
    expect(sceau()).toHaveAttribute('data-q', 'wait');
    expect(sceau()).toHaveAccessibleName('QR-facture : lecture en cours');
    const sent = await confirmer();
    expect(sent.amount).toBe(110.4);
  });
  it('le QR arrive après Gemini : le sceau passe de « lecture… » à « QR ✓ » sans rien changer d’autre', async () => {
    let fin!: (r: unknown) => void;
    await open(new Promise(r => { fin = r; }));
    expect(sceau()).toHaveAttribute('data-q', 'wait');
    fin(qrLu());
    await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'ok'));
    expect(total()).toBe(110.4);
  });
});

describe('confirme', () => {
  it('le sceau dit « QR ✓ » ; son toucher ouvre « Ce que dit le QR » avec l’IBAN et la référence à copier', async () => {
    await open(qrLu());
    await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'ok'));
    expect(within(sceau()!).getByText('QR ✓')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Ce que dit le QR' })).toBeNull();
    fireEvent.click(sceau()!);
    const fiche = await screen.findByRole('region', { name: 'Ce que dit le QR' });
    expect(within(fiche).getByText('110,40 CHF')).toBeInTheDocument();
    expect(within(fiche).getByText('F-1001')).toBeInTheDocument();
    expect(fiche.textContent).toContain('CH44 3199 9123 0008');
    expect(fiche.textContent).toContain('21 00000 00003 13947 14300 09017');
  });
  it('Copier met l’IBAN (sans espace) dans le presse-papiers et dit « copié » ; la référence aussi', async () => {
    const ecrire = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: ecrire } });
    await open(qrLu());
    await waitFor(() => expect(sceau()).not.toBeNull());
    fireEvent.click(sceau()!);
    const fiche = await screen.findByRole('region', { name: 'Ce que dit le QR' });
    fireEvent.click(within(fiche).getByRole('button', { name: 'Copier IBAN' }));
    await waitFor(() => expect(within(fiche).getByRole('button', { name: 'Copier IBAN' })).toHaveTextContent('copié'));
    expect(ecrire).toHaveBeenCalledWith(QR_IBAN);
    fireEvent.click(within(fiche).getByRole('button', { name: 'Copier Référence' }));
    await waitFor(() => expect(ecrire).toHaveBeenCalledWith(QRR));
  });
  it('« Fermer ce que dit le QR » referme la feuille ; le sceau la rouvre', async () => {
    await open(qrLu());
    await waitFor(() => expect(sceau()).not.toBeNull());
    fireEvent.click(sceau()!);
    fireEvent.click(await screen.findByRole('button', { name: 'Fermer ce que dit le QR' }));
    expect(screen.queryByRole('region', { name: 'Ce que dit le QR' })).toBeNull();
    expect(sceau()).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('contredit : le désaccord côte à côte, sans rien changer sans lui', () => {
  const ouvrir = async () => { await open(qrLu(), 110.04); await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'diff')); };

  it('le sceau dit le montant du QR ; le champ reste ce que la page a dit ; deux tuiles ; la chip ① « Total » renvoie au duel', async () => {
    await ouvrir();
    expect(within(sceau()!).getByText('110,40')).toBeInTheDocument();
    expect(total()).toBe(110.04);
    expect(screen.getByRole('button', { name: 'lu sur la page 110,04' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'QR-facture 110,40' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '1 Total' })).toBeInTheDocument();
    // z2 : « ① Total » est une TUILE de la rangée des tuiles (même rangée que « Règlement »), pas un chip isolé au-dessus (verdict p3c-port, point 8).
    const rangee = document.querySelector('[data-dp="tuile-paye"]')!.parentElement!;
    expect(rangee.contains(screen.getByRole('button', { name: '1 Total' }))).toBe(true);
  });
  it('sans geste, rien n’a changé tout seul ; « Confirmer » reste actif, et seule la règle de la base (détail des lignes = total) parle : le QR ne bloque rien', async () => {
    await ouvrir();
    expect(screen.getByRole('button', { name: 'Confirmer et enregistrer' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer et enregistrer' }));
    const alerte = await screen.findByText('À corriger');
    expect(alerte.parentElement!.textContent).toContain('Le détail des lignes doit correspondre exactement au total TTC.');
    expect(alerte.parentElement!.textContent).not.toMatch(/QR/);
    expect(state.saved).not.toHaveBeenCalled();
    expect(total()).toBe(110.04);
  });
  it('prendre le QR pose 110,40, règle la chip, et la dépense s’enregistre à 110,40 ; reprendre la page remet 110,04', async () => {
    await ouvrir();
    fireEvent.click(screen.getByRole('button', { name: 'QR-facture 110,40' }));
    expect(total()).toBe(110.4);
    expect(screen.getByRole('button', { name: 'QR-facture 110,40' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '1 Total réglé' })).toBeInTheDocument();
    expect(within(sceau()!).getByText('QR ✓')).toBeInTheDocument();
    const sent = await confirmer();
    expect(sent.amount).toBe(110.4);
    fireEvent.click(screen.getByRole('button', { name: 'lu sur la page 110,04' }));
    expect(total()).toBe(110.04);
    expect(screen.getByRole('button', { name: '1 Total réglé' })).toBeInTheDocument();
    expect(within(sceau()!).getByText('lu gardé')).toBeInTheDocument();
  });
  it('garder la page ne change rien au champ', async () => {
    await ouvrir();
    fireEvent.click(screen.getByRole('button', { name: 'lu sur la page 110,04' }));
    expect(total()).toBe(110.04);
  });
  it('le témoin « Somme des lignes 110,40 · deux contre un » n’est dit que parce que les lignes font 110,40', async () => {
    await ouvrir();
    expect(screen.getByText(/deux contre un/)).toBeInTheDocument();
  });
  it('la preuve dit l’écart de la somme (« 110,40 ≠ 110,04 ») et le statut n’est pas « vérifiée »', async () => {
    await ouvrir();
    fireEvent.click(screen.getByRole('button', { name: /^Lecture à confirmer|^Corrections|^Vérification incomplète/ }));
    const preuve = screen.getByRole('region', { name: 'Preuve de la lecture' });
    // t1, 09.11 : la rangée dit ses deux valeurs et l'écart (« Somme ≠ imprimé 110,40 / 110,04 +0,36 ») au lieu de « 110,40 ≠ 110,04 ».
    expect(preuve.textContent).toContain('Somme ≠ imprimé');
    expect(preuve.textContent).toContain('110,40 / 110,04');
    expect(preuve.textContent).toContain('+0,36');
    expect(screen.queryByRole('button', { name: /^Lecture vérifiée/ })).toBeNull();
  });
});

describe('partiel, illisible, sans, non vérifié', () => {
  it('partiel : un bulletin sans montant : « partiel », « pas dans le QR » avec la valeur lue à côté', async () => {
    await open(qrLu({ montant: '', s1: '' }));
    await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'partiel'));
    fireEvent.click(sceau()!);
    const fiche = await screen.findByRole('region', { name: 'Ce que dit le QR' });
    expect(fiche.textContent).toContain('pas dans le QR');
    expect(fiche.textContent).toContain('lu 110,40');
    expect(total()).toBe(110.4);
  });
  it('illisible : le QR est vu, rien n’est décodé ; « Photographier le QR » relit seulement le QR, sans changer la dépense', async () => {
    await open({ statut: 'illisible' });
    await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'off'));
    expect(within(sceau()!).getByText('illisible')).toBeInTheDocument();
    const avant = state.scanned.mock.calls.length;
    const photo = new File(['p'], 'qr.jpg', { type: 'image/jpeg' });
    state.qr.mockResolvedValueOnce(qrLu());
    fireEvent.change(screen.getByLabelText('Photographier le QR', { selector: 'input' }), { target: { files: [photo] } });
    await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'ok'));
    expect(state.qr.mock.calls.at(-1)![0]).toBe(photo);
    expect(state.scanned.mock.calls.length).toBe(avant);
    expect(total()).toBe(110.4);
  });
  it('sans QR : un cercle en pointillé, distinct d’un sceau ; rien à ouvrir', async () => {
    await open({ statut: 'sans' });
    await waitFor(() => expect(document.querySelector('[data-dp="sans-qr"]')).not.toBeNull());
    expect(sceau()).toBeNull();
    expect(screen.getByText('sans QR')).toBeInTheDocument();
  });
  it('non vérifié (bibliothèque non chargée, hors ligne) : ni sceau ni « sans QR », et la dépense se confirme', async () => {
    await open({ statut: 'non-verifie', motif: 'hors ligne' });
    await new Promise(r => setTimeout(r, 20));
    expect(sceau()).toBeNull();
    expect(document.querySelector('[data-dp="sans-qr"]')).toBeNull();
    const sent = await confirmer();
    expect(sent.amount).toBe(110.4);
  });

});

describe('un autre fichier remet le sceau à zéro', () => {
  it('le résultat du premier fichier n’est jamais montré pour le second', async () => {
    const { view } = await open(qrLu());
    await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'ok'));
    state.qr.mockImplementation(() => new Promise(() => undefined));
    state.scanned.mockResolvedValueOnce({ ok: true, model: 'simule', result: lecture(110.4) });
    send(view, 'autre.png');
    await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'wait'));
  });
});

describe('suite 2 : l’ordre de lecture et l’état « lecture » (critique z2)', () => {
  const avant = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

  it('lecture : le montant, la date et le créancier lus par le QR se voient sans toucher le sceau, dans le bloc « Lecture et vérification… »', async () => {
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    state.qr.mockResolvedValue(qrLu());
    state.scanned.mockReturnValue(new Promise(() => undefined)); // Gemini n'a pas fini
    const view = render(createElement(ExpenseSheet, { onClose: () => {}, onSaved: state.onSaved }));
    send(view);
    const bloc = await waitFor(() => { const e = document.querySelector('[data-dp="lecture"] [data-dp="qr-lecture"]'); expect(e).not.toBeNull(); return e!; });
    expect(bloc.textContent).toBe('QR : 110,40 CHF · 12.10.2026 · Malterie Fictive SA');
    expect(screen.queryByRole('region', { name: 'Ce que dit le QR' })).toBeNull();
    expect(document.querySelector('[data-dp="lecture"] [data-dp="sceau-qr"]')).not.toBeNull();
  });
  it('lecture : un QR non conforme ou non lu n’écrit rien (il ne confirme rien)', async () => {
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    state.qr.mockResolvedValue(qrLu({ iban: 'CH0000000000000000000' }));
    state.scanned.mockReturnValue(new Promise(() => undefined));
    const view = render(createElement(ExpenseSheet, { onClose: () => {}, onSaved: state.onSaved }));
    send(view);
    await waitFor(() => expect(document.querySelector('[data-dp="lecture"] [data-dp="sceau-qr"]')?.getAttribute('data-q')).toBe('off'));
    expect(document.querySelector('[data-dp="qr-lecture"]')).toBeNull();
  });


});

describe('suite 3 : « écart » sur un champ hors total (la page lit 13.10.2026, le QR dit 12.10.2026, le total est d’accord)', () => {
  const ouvrirEcart = async () => { await open(qrLu(), 110.4, { date: '13.10.2026' }); await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'diff')); };
  const avant = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

  it('fermé, le sceau dit « écart » ET le champ contesté est marqué (date ambre, pointillé) ; une chip « ① Date » le désigne, avant « ② Règlement »', async () => {
    await ouvrirEcart();
    expect(within(sceau()!).getByText('écart')).toBeInTheDocument();
    const date = within(document.querySelector('[data-dp="bandeau"]') as HTMLElement).getByText('13.10.2026');
    expect(date.className).toContain('border-dotted');
    expect(date.className).toContain('text-attention');
    const chip = screen.getByRole('button', { name: '1 Date' });
    expect(avant(chip, document.querySelector('[data-dp="tuile-paye"]')!)).toBe(true);
    expect(screen.queryByRole('button', { name: '1 Total' })).toBeNull();
    expect(document.querySelector('[data-dp="duel"]')).toBeNull();
  });
  const bandeau = () => document.querySelector('[data-dp="bandeau"]') as HTMLElement;
  const rangee = (cle: string) => document.querySelector(`[data-dp-qr-ligne="${cle}"]`) as HTMLElement;

  it('la chip ouvre la feuille et surligne la rangée « Date » (deux touches) ; elle NE se règle PAS, la marque reste, la date ne change pas', async () => {
    await ouvrirEcart();
    fireEvent.click(screen.getByRole('button', { name: '1 Date' }));
    const fiche = await screen.findByRole('region', { name: 'Ce que dit le QR' });
    const r = fiche.querySelector('[data-dp-qr-ligne="date"]')!;
    expect(r.className).toContain('outline-attention');
    expect(within(r as HTMLElement).getByRole('button', { name: '12.10.2026 · QR' })).toHaveAttribute('aria-pressed', 'false');
    expect(within(r as HTMLElement).getByRole('button', { name: '13.10.2026 · lu' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '1 Date' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1 Date réglé' })).toBeNull();
    const date = within(bandeau()).getByText('13.10.2026');
    expect(date.className).toContain('border-dotted');
    expect(within(sceau()!).getByText('écart')).toBeInTheDocument();
  });
  it('ouvrir la feuille par le sceau ne règle rien non plus', async () => {
    await ouvrirEcart();
    fireEvent.click(sceau()!);
    await screen.findByRole('region', { name: 'Ce que dit le QR' });
    expect(screen.queryByRole('button', { name: '1 Date réglé' })).toBeNull();
    expect(within(bandeau()).getByText('13.10.2026').className).toContain('border-dotted');
  });
  it('prendre le QR : la date de la dépense devient 12.10.2026, la tuile Règlement la suit, la chip se règle, la marque s’efface, le sceau dit « QR ✓ »', async () => {
    await ouvrirEcart();
    fireEvent.click(screen.getByRole('button', { name: '1 Date' }));
    fireEvent.click(await screen.findByRole('button', { name: '12.10.2026 · QR' }));
    expect(screen.getByRole('button', { name: '12.10.2026 · QR' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '1 Date réglé' })).toBeInTheDocument();
    const date = within(bandeau()).getByText('12.10.2026');
    expect(date.className).not.toContain('border-dotted');
    expect(within(bandeau()).queryByText('13.10.2026')).toBeNull();
    expect(document.querySelector('[data-dp="tuile-paye"]')!.textContent).toContain('Payé le 12.10.2026');
    expect(within(sceau()!).getByText('QR ✓')).toBeInTheDocument();
    const sent = await confirmer();
    expect(sent.date).toBe('12.10.2026');
    expect(sent.paymentDate).toBe('12.10.2026');
  });
  it('garder la page : la date reste 13.10.2026, la chip se règle, la marque s’efface, le sceau dit « lu gardé »', async () => {
    await ouvrirEcart();
    fireEvent.click(screen.getByRole('button', { name: '1 Date' }));
    fireEvent.click(await screen.findByRole('button', { name: '13.10.2026 · lu' }));
    expect(screen.getByRole('button', { name: '13.10.2026 · lu' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '1 Date réglé' })).toBeInTheDocument();
    const date = within(bandeau()).getByText('13.10.2026');
    expect(date.className).not.toContain('border-dotted');
    expect(document.querySelector('[data-dp="tuile-paye"]')!.textContent).toContain('Payé le 13.10.2026');
    expect(within(sceau()!).getByText('lu gardé')).toBeInTheDocument();
    const sent = await confirmer();
    expect(sent.date).toBe('13.10.2026');
  });
  it('prendre le QR puis reprendre la page remet 13.10.2026 (rien n’est perdu)', async () => {
    await ouvrirEcart();
    fireEvent.click(sceau()!);
    fireEvent.click(await screen.findByRole('button', { name: '12.10.2026 · QR' }));
    expect(within(bandeau()).getByText('12.10.2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '13.10.2026 · lu' }));
    expect(within(bandeau()).getByText('13.10.2026')).toBeInTheDocument();
    expect(document.querySelector('[data-dp="tuile-paye"]')!.textContent).toContain('Payé le 13.10.2026');
    expect(within(sceau()!).getByText('lu gardé')).toBeInTheDocument();
  });
  it('« Confirmer » n’est jamais bloqué par le QR : la dépense part avec la date lue, aucun champ n’a changé sans geste', async () => {
    await ouvrirEcart();
    expect(screen.getByRole('button', { name: 'Confirmer et enregistrer' })).toBeEnabled();
    const sent = await confirmer();
    expect(sent.date).toBe('13.10.2026');
    expect(sent.amount).toBe(110.4);
  });
  it('le fournisseur contesté : le nom est marqué et la chip s’appelle « Créancier »', async () => {
    await open(qrLu({ creancier: ['S', 'Brasserie Autre SA', 'Rue 1', '1', '1000', 'Lausanne', 'CH'] }), 110.4);
    await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'diff'));
    expect(screen.getByRole('button', { name: '1 Créancier' })).toBeInTheDocument();
    expect(within(document.querySelector('[data-dp="bandeau"]') as HTMLElement).getByText('Malterie Fictive SA').className).toContain('border-dotted');
  });
  const AUTRE = ['S', 'Brasserie Autre SA', 'Rue 1', '1', '1000', 'Lausanne', 'CH'];
  const fournisseur = () => (document.querySelector('#purchase-vendor') as HTMLInputElement).value;
  it('créancier : la chip ne règle rien ; « prendre le QR » écrit le nom du QR dans le fournisseur ; « garder » laisse la page', async () => {
    await open(qrLu({ creancier: AUTRE }), 110.4);
    await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'diff'));
    fireEvent.click(screen.getByRole('button', { name: '1 Créancier' }));
    await screen.findByRole('region', { name: 'Ce que dit le QR' });
    expect(screen.queryByRole('button', { name: '1 Créancier réglé' })).toBeNull();
    expect(fournisseur()).toBe('Malterie Fictive SA');
    fireEvent.click(screen.getByRole('button', { name: 'Brasserie Autre SA · QR' }));
    expect(fournisseur()).toBe('Brasserie Autre SA');
    expect(screen.getByRole('button', { name: '1 Créancier réglé' })).toBeInTheDocument();
    expect(within(sceau()!).getByText('QR ✓')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Malterie Fictive SA · lu' }));
    expect(fournisseur()).toBe('Malterie Fictive SA');
    expect(within(sceau()!).getByText('lu gardé')).toBeInTheDocument();
  });
  it('créancier : garder la page ne change rien au fournisseur et règle la chip', async () => {
    await open(qrLu({ creancier: AUTRE }), 110.4);
    await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'diff'));
    fireEvent.click(screen.getByRole('button', { name: '1 Créancier' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Malterie Fictive SA · lu' }));
    expect(fournisseur()).toBe('Malterie Fictive SA');
    expect(screen.getByRole('button', { name: '1 Créancier réglé' })).toBeInTheDocument();
    expect(within(sceau()!).getByText('lu gardé')).toBeInTheDocument();
  });
  describe('devise (la page lit EUR, le QR dit CHF)', () => {
    const ouvrirDevise = async () => { await open(qrLu(), 110.4, { currency: 'EUR' }); await waitFor(() => expect(sceau()).toHaveAttribute('data-q', 'diff')); };
    const original = () => screen.queryByText(/Montants à renseigner en CHF/);
    it('la chip ne règle rien ; « CHF · QR » écrit la devise du QR ; « EUR · lu » la laisse', async () => {
      await ouvrirDevise();
      expect(original()).not.toBeNull();
      fireEvent.click(screen.getByRole('button', { name: /^\d Devise$/ }));
      await screen.findByRole('region', { name: 'Ce que dit le QR' });
      expect(screen.queryByRole('button', { name: /Devise réglé/ })).toBeNull();
      expect(original()).not.toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'CHF · QR' }));
      expect(screen.getByRole('button', { name: /^\d Devise réglé$/ })).toBeInTheDocument();
      expect(original()).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'EUR · lu' }));
      expect(original()).not.toBeNull();
      expect(within(sceau()!).getByText('lu gardé')).toBeInTheDocument();
    });
  });
});
