// @vitest-environment jsdom
/**
 * Voie p3c-port : l écran Nouvelle dépense est p3c-3 (bandes, port, ordre, filtre, pied). Facture 372765 SIMULÉE (banc apercuDev), stock SIMULÉ, Gemini jamais appelé,
 * aucune écriture. Ce que jsdom ne prouve pas (hauteur pleine, graisse calculée, alignement, clavier) est mesuré par capturer-p3c.mjs (G7).
 */
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

import { apercuDepense } from '../../../../src/ui/depense/apercuDev';
import { ModalShell } from '../../../../src/ui/ModalShell';
import { Liste } from '../../../../src/ui/depense/Liste';

/** Rend l'écran sur un état du banc (facture 372765 SIMULÉE, stock SIMULÉ, Gemini jamais appelé) et attend la région « Vérification du justificatif ». */
const ouvrir = async (etat: string) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}} apercu={apercuDepense(etat)}/>);
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
const q = (sel: string) => document.querySelector(sel) as HTMLElement;
const qa = (sel: string) => Array.from(document.querySelectorAll(sel)) as HTMLElement[];
const ligne = (id: string) => q(`[data-dp-ligne="${id}"]`);
beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.transactions = [];
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true);
});
afterEach(cleanup);

describe('p3c-3 : les bandes teintées de la facture 372765', () => {
  it('T1 : trois bandes dans l’ordre malt, houblon, levure ; sous-totaux 36,85 · 20,05 · 29,60 ; quantités en gras « 18 Kg », « 270 g + 30 ? », « 7 Stk »', async () => {
    await ouvrir('3');
    const bandes = qa('[data-dp-bande]');
    expect(bandes.map(b => b.getAttribute('data-dp-bande'))).toEqual(['malt', 'houblon', 'levure']);
    expect(bandes.map(b => b.querySelector('[data-dp-sous-montant]')!.textContent)).toEqual(['36,85', '20,05', '29,60']);
    // D275 (voie f3) : une même famille d'unités s'additionne, Sabro « 30 » prend le g de ses voisines (deux l'impriment : sûr) : jamais « ? » quand l'unité se déduit (HEAD : « 270 g + 30 ? »).
    expect(bandes.map(b => b.querySelector('[data-dp-sous-qte]')!.textContent)).toEqual(['18 Kg', '300 g', '7 Stk']);
    expect(bandes[0].querySelector('[data-dp-bande-entete]')!.textContent).toContain('+5 ↳');
    expect(qa('[data-dp-qte]').every(e => e.className.includes('font-semibold'))).toBe(true);
  });
  it('T2 : « 23 lignes », 23 segments de barre, Σ des comptes = 23 (R2) ; « sans stock » est un compte', async () => {
    await ouvrir('3');
    expect(screen.getByRole('button', { name: /^Lecture à confirmer, 23 lignes$/ })).toHaveAttribute('title', 'Lecture à confirmer, 23 lignes');
    expect(qa('[data-dp="barre"] i')).toHaveLength(23);
    const compte = q('[data-dp="compte-liens"]');
    // D277 (voie f3) : « à contrôler » et « à remplir » sont des comptes de niveau, hors de la partition des liens.
    expect(Array.from(compte.querySelectorAll('[data-va]:not([data-dp-niveau]) b')).reduce((n, b) => n + Number(b.textContent), 0)).toBe(23);
    expect(compte.textContent).not.toContain('sans stock'); // D275 : « hors stock » remplace « sans stock » ; ici Goldings et Hallertauer sont nouveaux d'office, aucun hors stock
  });

});

describe('p3c-3 : le port « Total seulement » (D249)', () => {
  it('T3 : « dont port 8,50 » ; total 95,00 ; 23 lignes ; la ligne de port n’est dans aucune bande mais dans son tiroir ; elle se corrige', async () => {
    await ouvrir('port');
    expect(q('[data-dp="port"]').textContent).toBe('dont port 8,50');
    expect(screen.getByLabelText('Total TTC en CHF')).toHaveValue('95,00');
    expect(screen.getByRole('button', { name: /23 lignes$/ })).toBeInTheDocument();
    expect(qa('[data-dp="barre"] i')).toHaveLength(23);
    const port = ligne('line-24');
    expect(port.closest('[data-dp-bande]')).toBeNull();
    expect(port.closest('[data-dp="port-tiroir"]')).not.toBeNull();
    fireEvent.click(q('[data-dp="port"]'));
    expect(q('[data-dp="port-tiroir"]').className).not.toMatch(/(^|\s)hidden(\s|$)/);
    expect((screen.getByLabelText('Montant ligne 24') as HTMLInputElement).value).toMatch(/^8[,.]5/);
    expect(q('[data-dp="fin"]').textContent).toContain('95,00 / 95,00');
  });
  it('T4 : un port sans montant reste une rangée (Autres), « dont port » se tait, et Confirmer mène au champ de la ligne 24', async () => {
    await ouvrir('port-sans-montant');
    expect(q('[data-dp="port"]')).toBeNull();
    expect(ligne('line-24').closest('[data-dp-bande]')!.getAttribute('data-dp-bande')).toBe('autres');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer et enregistrer' }));
    expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
    await waitFor(() => expect(document.activeElement?.closest('[data-dp-ligne]')?.getAttribute('data-dp-ligne')).toBe('line-24'));
  });
  it('T5 : un document réduit à son port : une rangée, pas de « dont port », « 1 ligne »', async () => {
    await ouvrir('tout-port');
    expect(q('[data-dp="port"]')).toBeNull();
    expect(ligne('line-24').closest('[data-dp-bande]')!.getAttribute('data-dp-bande')).toBe('autres');
    expect(screen.getByRole('button', { name: /1 ligne$/ })).toBeInTheDocument();
  });
  it('T7b : en ordre Papier le port n’est pas une rangée', async () => {
    await ouvrir('port');
    fireEvent.click(screen.getByRole('button', { name: 'Papier' }));
    expect(qa('[data-dp-numero]')).toHaveLength(23);
    expect(q('[data-dp-bande="papier"]').contains(ligne('line-24'))).toBe(false);
  });
});

describe('p3c-3 : R1, ordre, filtre, mouture, pied', () => {
  it('T6 : une erreur de quantité mène à la ligne 12 par son id, pas par son rang dans le DOM (ordre Catégorie)', async () => {
    await ouvrir('3');
    fireEvent.change(screen.getByLabelText('Quantité ligne 12'), { target: { value: '' } }); fireEvent.blur(screen.getByLabelText('Quantité ligne 12'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer et enregistrer' }));
    await waitFor(() => expect(document.activeElement?.getAttribute('aria-label')).toBe('Quantité ligne 12'));
    expect(document.activeElement?.closest('[data-dp-ligne]')?.getAttribute('data-dp-ligne')).toBe('line-12');
    expect(qa('[data-purchase-line]').indexOf(ligne('line-12'))).not.toBe(11); // le rang du DOM n’est pas celui du brouillon
  });
  it('T7 : « Papier » : une bande, 23 numéros 1 à 23, plus aucune pastille de mouture (les 5 moutures sont des rangées)', async () => {
    await ouvrir('3');
    fireEvent.click(screen.getByRole('button', { name: 'Papier' }));
    expect(qa('[data-dp-bande]').map(b => b.getAttribute('data-dp-bande'))).toEqual(['papier']);
    expect(qa('[data-dp-numero]').map(n => n.textContent)).toEqual(Array.from({ length: 23 }, (_, i) => String(i + 1)));
    expect(screen.getByRole('button', { name: 'Papier' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('T8 : toucher « bis » filtre la liste ; les lignes masquées restent montées ; « Toutes les lignes » la rend', async () => {
    await ouvrir('3');
    const compte = q('[data-dp="compte-liens"] [data-va="bis"]');
    const n = Number(compte.querySelector('b')!.textContent);
    expect(n).toBeGreaterThan(0);
    fireEvent.click(compte);
    expect(q('[data-dp="filtre"]').textContent).toContain(`${n} bis · ${23 - n} masquées`);
    expect(qa('[data-purchase-line][hidden]').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Toutes les lignes/ }));
    expect(q('[data-dp="filtre"]')).toBeNull();
    expect(qa('[data-purchase-line][hidden]')).toHaveLength(0);
  });
  it('T9 : rien ne se rattache sans geste ; « Rattacher les 5 » rattache les 5 et la pastille dit « 2,40/Kg avec mouture »', async () => {
    await ouvrir('3');
    expect(qa('[data-dp-mouture]')).toHaveLength(5);
    expect(ligne('line-1').querySelector('[data-dp-prixkg]')).toBeNull();
    fireEvent.click(q('[data-dp-mouture-tous]'));
    expect(ligne('line-1').querySelector('[data-dp-prixkg]')!.getAttribute('aria-label')).toBe('2,40/Kg avec mouture');
    expect(qa('[data-dp-mouture]').every(b => (b.getAttribute('aria-label') ?? '').includes('rattachée'))).toBe(true);
  });

  it('T10b : pendant la lecture, Confirmer est désactivé et dit pourquoi (seule exception à « jamais bloqué »)', async () => {
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    render(<ExpenseSheet onClose={() => {}} onSaved={() => {}} apercu={apercuDepense('1')}/>);
    const bouton = await screen.findByRole('button', { name: 'Lecture en cours' });
    expect(bouton).toBeDisabled(); expect(bouton).toHaveAttribute('title', 'Lecture en cours');
  });


});

describe('p3c-3 : le picto du justificatif, les propositions, le changement de bande, l’unité', () => {

  // VERDICT-f3-p2, majeur 1 (D277) : HEAD disait « n proposées par la lecture, à vérifier » dans la preuve ; le lien proposé est désormais une pastille jaune « n proposé(s) » à côté de « relié », et la phrase disparaît.
  it('T15 : « n proposé(s) » jaune au récap (n = lignes proposées) ; plus de phrase « proposée par la lecture »', async () => {
    await ouvrir('3');
    const n = qa('[data-dp-stock]').filter(s => s.textContent?.includes('· proposé')).length;
    expect(n).toBeGreaterThan(0);
    const c = q('[data-dp="compte-liens"] [data-va="propose"]');
    expect(c.getAttribute('data-dp-niveau')).toBe('repris');
    expect(c.textContent).toMatch(new RegExp(`^${n} proposés?`));
    expect(document.querySelector('[data-dp="propositions"]')?.textContent ?? '').not.toMatch(/proposée/);
  });
  it('T18 : changer le type d’achat de la ligne 8 la fait passer dans « Autres » ; son plateau reste ouvert', async () => {
    await ouvrir('3');
    const l8 = ligne('line-8');
    (l8.querySelector('details') as HTMLDetailsElement).open = true;
    fireEvent(l8.querySelector('details')!, new Event('toggle')); // jsdom l'émet plus tard : on le joue tout de suite
    fireEvent.change(screen.getByLabelText('Nature ligne 8'), { target: { value: 'packaging' } });
    const apres = ligne('line-8');
    expect(apres.closest('[data-dp-bande]')!.getAttribute('data-dp-bande')).not.toBe('houblon');
    expect((apres.querySelector('details') as HTMLDetailsElement).open).toBe(true);
  });
  it('T19 (D275, voie f3) : Sabro « 30 » prend le g de ses voisines (sûr : deux l’impriment) ; taper « g » ne change rien au prix imprimé', async () => {
    await ouvrir('3');
    const qte = () => ligne('line-20').querySelector('[data-dp-qte]')!;
    expect(qte().textContent).toBe('30 g');
    expect(qte().hasAttribute('data-dp-niveau')).toBe(false);
    expect(within(ligne('line-20')).queryByRole('button', { name: 'g' })).toBeNull(); // la barre rouge n'est que pour une unité qui ne se déduit pas
    expect(screen.getByLabelText('Unité ligne 20')).toHaveValue(''); // l'unité déduite n'est jamais écrite dans le champ (D213)
    const prix = ligne('line-20').querySelector('[data-dp-prix]')!.textContent;
    expect(prix).not.toBe('—');
    fireEvent.change(screen.getByLabelText('Unité ligne 20'), { target: { value: 'g' } });
    expect(qte().hasAttribute('data-dp-niveau')).toBe(false);
    expect(ligne('line-20').querySelector('[data-dp-prix]')!.textContent).toBe(prix);
  });
});

/** Ouvre l'écran sur un état du banc dont on change la lecture avant le rendu (SIMULÉ, aucun appel). */
const ouvrirAvec = async (etat: string, change: (ap: ReturnType<typeof apercuDepense>) => void) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const ap = apercuDepense(etat); change(ap);
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}} apercu={ap}/>);
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
/** Des centimes entiers lus sur un texte d'écran (« 36,85 », « 8,5 », « dont port 8,50 ») ; un montant illisible ou absent fait échouer (NaN), il n'est jamais 0. */
const cts = (s: string) => Math.round(parseFloat((/\d[\d’']*(?:[.,]\d+)?/.exec(s)?.[0] ?? '').replace(/[’']/g, '').replace(',', '.')) * 100);
const lignesDeLecture = (ap: ReturnType<typeof apercuDepense>) => ((ap.outcome as any).result.items as any[]);

describe('p3c-3 : D11 — liste vide, plafond de 35, invariant de somme sur l’écran rendu, « Qté × prix » hors port', () => {
  it('T16 : liste vide. (a) l’écran : une lecture sans ligne reçoit UNE rangée vide à remplir (l’écran ne se vide jamais) et « Ajouter une ligne » reste actif ; (b) la liste seule, sans aucune ligne affichée, dit « Aucune ligne » et garde « Ajouter » actif', async () => {
    await ouvrirAvec('3', ap => { (ap.outcome as any).result.items = []; });
    expect(qa('[data-dp-ligne]')).toHaveLength(1); // le brouillon ajoute une ligne vide quand la lecture n'en a aucune (ExpenseSheet l.295)
    expect(q('[data-dp="aucune-ligne"]')).toBeNull();
    expect(screen.getByRole('button', { name: /Ajouter une ligne/ })).toBeEnabled();
    cleanup();
    const onAjouter = vi.fn();
    render(<Liste ordre="cat" bandes={[]} papier={null} lignes={new Map()} filtre={null} visibles={null} nAffichees={0} onSansFiltre={() => {}} rattacherTous={null}
      pied={{ ajouterOff: false, regrouper: false, detail: null }} onAjouter={onAjouter} onRegrouper={() => {}}/>);
    expect(q('[data-dp="aucune-ligne"]').textContent).toBe('Aucune ligne');
    expect(qa('[data-dp-bande]')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une ligne/ }));
    expect(onAjouter).toHaveBeenCalledOnce();
  });
  it('T17 : 34 lignes affichées + 1 port = 35 : « Ajouter une ligne » est désactivé et dit « port compris » ; à 34 lignes il reste actif', async () => {
    await ouvrirAvec('port', ap => {
      const items = lignesDeLecture(ap), port = items.find(i => i.kind === 'shipping');
      const autres = items.filter(i => i !== port);
      const extra = Array.from({ length: 34 - autres.length }, (_, i) => ({ ...JSON.parse(JSON.stringify(autres[0])), id: `line-${100 + i}`, name: `Malt extra ${i}`, reference: `EXTRA-${i}` }));
      (ap.outcome as any).result.items = [...autres, ...extra, port];
    });
    expect(qa('[data-dp-ligne]')).toHaveLength(35);
    const ajouter = screen.getByRole('button', { name: /Ajouter une ligne/ });
    expect(ajouter).toBeDisabled();
    expect(ajouter.getAttribute('title')).toMatch(/35 lignes au plus, port compris/);
    expect(q('[data-dp="port"]').textContent).toBe('dont port 8,50'); // le port est bien hors bandes : 34 lignes en bandes
    expect(qa('[data-dp-bande] [data-dp-ligne]')).toHaveLength(34);
    cleanup();
    await ouvrirAvec('3', () => {});
    expect(screen.getByRole('button', { name: /Ajouter une ligne/ })).toBeEnabled();
  });
  it.each(['3', 'port'])('invariant (état %s) : Σ sous-totaux des bandes + dont port = Σ des montants du brouillon = « Détail » = Total, lus sur l’écran', async etat => {
    await ouvrir(etat);
    const bandes = qa('[data-dp-bande] [data-dp-sous-montant]').reduce((s, e) => s + cts(e.textContent ?? ''), 0);
    const port = q('[data-dp="port"]') ? cts(q('[data-dp="port"]').textContent ?? '') : 0;
    const brouillon = (Array.from(document.querySelectorAll('input[aria-label^="Montant ligne"]')) as HTMLInputElement[]).reduce((s, i) => s + cts(i.value), 0);
    expect(etat === 'port' ? port : 0).toBe(etat === 'port' ? 850 : 0);
    expect(bandes + port).toBe(brouillon);
    expect(brouillon).toBe(cts((screen.getByLabelText('Total TTC en CHF') as HTMLInputElement).value));
    expect(q('[data-dp="fin"]').textContent).toContain(`Détail ${(brouillon / 100).toFixed(2).replace('.', ',')} / ${(brouillon / 100).toFixed(2).replace('.', ',')}`);
    expect(qa('[data-dp-ligne]').length).toBe(etat === 'port' ? 24 : 23);
  });
  it('D12 : « Qté × prix » compte les lignes LUES hors port : 23/23 avec ou sans la ligne de port (VERDICT-f3 détail 5 : « ✓ Qté × prix 23/23 » comme la base ; HEAD : « 23/23 lues »)', async () => {
    await ouvrir('3');
    expect(q('[data-dp="preuve"]').textContent).toMatch(/Qté × prix\s*23\/23/);
    cleanup();
    await ouvrir('port');
    expect(qa('[data-dp-ligne]')).toHaveLength(24); // 24 lignes dans le brouillon, dont le port
    expect(q('[data-dp="preuve"]').textContent).toMatch(/Qté × prix\s*23\/23/);
    expect(q('[data-dp="preuve"]').textContent).not.toMatch(/24/);
  });
});
