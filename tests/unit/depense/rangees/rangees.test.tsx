// @vitest-environment jsdom
/**
 * Voie f3-rangees (D246, D248, D249, D261a, D262b, D262d, D271, D273f, D275, D277) : la rangée de p3c-3 sur une commande en ligne SIMULÉE (banc `commande`,
 * aucune valeur ni désignation de sa pièce), stock SIMULÉ, Gemini jamais appelé, aucune écriture. Témoins : rouges sur HEAD (aucun état `commande`, « Créer » au repos,
 * « 85 ? », « 2 Kg + 5 Kg + 100 g », unité déduite ignorée par la validation).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[], kegs: [] as any[] }, transactions: [] as any[], saved: vi.fn(), scanned: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(), savePurchaseWithProofReceipt: async (d: any) => { state.saved(structuredClone(d)); return { transactionId: 'TX-test' }; }, confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import { apercuDepense } from '../../../../src/ui/depense/apercuDev';
import { bandes as calculerBandes, type LigneBande } from '../../../../src/ui/depense/groupes';
import { validatePurchase, type PurchaseDraft } from '../../../../src/services/purchaseEntry';

const ouvrir = async () => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const ap = apercuDepense('commande');
  expect(ap.etat).toBe('commande'); // HEAD : l'état n'existe pas (le banc retombe sur 372765)
  state.stocks = ap.stocks as any;
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}} apercu={ap}/>);
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
const q = (sel: string) => document.querySelector(sel) as HTMLElement;
const ligne = (n: number) => q(`[data-dp-ligne="line-${n}"]`);
const resume = (n: number) => ligne(n).querySelector('summary') as HTMLElement;
beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.transactions = [];
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true);
});
afterEach(cleanup);

describe('zone 1 : la rangée dit la base et l’état du malt', () => {
  it('« Carafa Spezial I®, Kg » + « Schrotung: geschrotet [+CHF 0.10] » : nom de base, pastille « ↳ 0,20 », libellé accessible', async () => {
    await ouvrir();
    const nom = resume(4).querySelector('[data-dp-nom]')!.textContent!;
    expect(nom).not.toMatch(/, ?Kg|Mischung|Schrotung|\[/);
    expect(nom).toMatch(/^Carafa Spezial I/);
    const etat = resume(4).querySelector('[data-dp-etat]')!;
    expect(etat.getAttribute('aria-label')).toBe('concassé, supplément 0,10 par Kg compris');
    expect(etat.textContent).toContain('0,20'); // ↳ : le picto de la mouture devant le montant
    expect(etat.querySelector('svg')).not.toBeNull();
    expect(resume(6).querySelector('[data-dp-etat]')!.textContent).toContain('0,50');
  });
  it('la quantité est en gras ; le libellé n’est jamais coupé au milieu d’un mot', async () => {
    await ouvrir();
    for (const n of [1, 4, 7]) expect(resume(n).querySelector('[data-dp-qte]')!.className).toMatch(/font-semibold/);
    expect(resume(4).querySelector('[data-dp-nom]')!.className).toMatch(/dp-p3c-nom/);
  });
});

describe('zone 2 : nouvel article d’office, aucun « Créer » au repos', () => {
  it('les ingrédients sans article sont « new », avec le picto « nouvel article » ; matériel et emballage sans mouvement ni bouton', async () => {
    await ouvrir();
    expect(document.querySelectorAll('[data-dp-creer]')).toHaveLength(0);
    expect(screen.queryAllByRole('button', { name: /^Créer/ })).toHaveLength(0);
    for (const n of [1, 4, 5, 6, 7, 8]) {
      expect((screen.getByLabelText(`Stock ligne ${n}`) as HTMLSelectElement).value, `ligne ${n}`).toBe('new');
      expect(resume(n).querySelector('svg[aria-label="nouvel article"]'), `ligne ${n}`).not.toBeNull();
    }
    for (const n of [2, 3, 9]) {
      expect(ligne(n).querySelector('[data-dp-barre]'), `ligne ${n}`).toBeNull();
      expect(ligne(n).querySelector('[data-dp-stock]')?.textContent ?? '', `ligne ${n}`).not.toMatch(/nouvel article|relié/); // matériel : sa fiche matériel ; emballage : « aucun stock »
    }
  });
  it('le plateau dit « article « … » · nouvel article » et son ⇄ ; l’imprimé et sa référence restent', async () => {
    await ouvrir();
    expect(ligne(4).querySelector('[data-dp-stock]')!.textContent).toMatch(/^article «.*» · nouvel article/);
    expect((ligne(4).querySelector('[data-dp-stock] input[aria-label^="Nom de l’article"]') as HTMLInputElement).value).toMatch(/^Carafa Spezial I/);
    expect(within(ligne(4)).getAllByRole('button', { name: 'Choisir un autre article' }).length).toBeGreaterThan(0);
    expect(ligne(4).querySelector('[data-dp-imprime]')!.textContent).toBe('imprimé « Carafa Spezial I®, Kg » · MA0301');
    const options = ligne(4).querySelector('[data-dp-options]')!.textContent!;
    expect(options).toMatch(/concass/);
    expect(options).not.toMatch(/Schrotung|geschrotet/);
  });
});

describe('zones 3 et 4 : trois niveaux, la quantité déduite en jaune, les unités additionnées', () => {
  it('Ekuanot « 85 » : « 85 g » en jaune, jamais « 85 ? » ; seule « Brauzusatz Probe » (ni prix ni famille) est rouge, avec sa barre g / kg / Stk', async () => {
    await ouvrir();
    const qte = resume(7).querySelector('[data-dp-qte]')!;
    expect(qte.textContent).toBe('85 g');
    expect(qte.closest('[data-dp-niveau]')!.getAttribute('data-dp-niveau')).toBe('repris');
    const rouges = Array.from(document.querySelectorAll('summary [data-dp-niveau="inconnu"]')).map(e => e.closest('[data-dp-ligne]')!.getAttribute('data-dp-ligne'));
    expect([...new Set(rouges)]).toEqual(['line-13']);
    expect(within(ligne(13)).getAllByRole('button', { name: 'kg' }).length).toBeGreaterThan(0);
    for (const b of ['malt', 'houblon', 'levure', 'sucre']) expect(q(`[data-dp-bande="${b}"] [data-dp-bande-entete]`).textContent, b).not.toMatch(/\d ?\?/); // l'unité se déduit : jamais « ? »
  });
  it('la bande Malts additionne 2 Kg + 5 Kg + 100 g + 4 Kg en « 11,1 Kg »', async () => {
    await ouvrir();
    expect(q('[data-dp-bande="malt"] [data-dp-sous-qte]').textContent).toBe('11,1 Kg');
  });
  it('pur : 7 Kg + 100 g → « 7,1 Kg » ; une quantité déduite rend le groupe jaune', () => {
    const L = (id: string, quantity: number, unit: string, niveau?: 'repris'): LigneBande => ({ id, groupe: 'malt', amount: 1, quantity, unit, uniteLisible: true, mouture: false, ...(niveau ? { niveau } : {}) });
    const malt = calculerBandes([L('a', 7, 'Kg'), L('b', 100, 'g')]).find(b => b.cle === 'malt')!;
    expect(malt.qte.map(x => `${x.n} ${x.unite}`)).toEqual(['7.1 Kg']);
    const houblon = calculerBandes([{ ...L('c', 85, 'g', 'repris'), groupe: 'houblon' }]).find(b => b.cle === 'houblon')!;
    expect(houblon.qte[0].niveau).toBe('repris');
  });
  it('la date manquante est rouge dans le bandeau ; la rangée des points n’existe plus', async () => {
    await ouvrir();
    expect(q('[data-dp="bandeau"] [data-dp-niveau="inconnu"][aria-label="Date de l’achat à remplir"]')).not.toBeNull();
    expect(document.querySelectorAll('[data-dp="chips"] [data-dp-chip]')).toHaveLength(0);
  });
});

describe('zone 5 : le récap compte', () => {
  it('« n nouveaux · n hors stock · n à contrôler · ↳ n moutures +x » ; aucun compte nul', async () => {
    await ouvrir();
    const t = q('[data-dp="compte-liens"]').textContent!;
    expect(t).toMatch(/\d+ nouveaux/);
    expect(t).toMatch(/\d+ hors stock/);
    expect(t).toMatch(/\d+ à contrôler/);
    expect(t).toMatch(/3 moutures \+0,71/); // 2 × 0,10 + 5 × 0,10 + 100 × 0,0001, compris dans les prix
    expect(t).not.toMatch(/(^|\D)0 (relié|nouveau|bis|hors|mouture|à )/);
    expect(t).toMatch(/1 relié(?!s)/); // Pilsner Malz, relié à l'article du stock simulé
    expect(t).toMatch(/1 bis/); // Target 11.3% face à Target 11.8%
  });
});

describe('zone 7 : « + Ajouter une ligne » reste ; une ligne vide se dit en rouge', () => {
  it('la ligne ajoutée montre son nom et sa quantité en rouge', async () => {
    await ouvrir();
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une ligne/ }));
    const lignes = Array.from(document.querySelectorAll('[data-dp-ligne]')) as HTMLElement[];
    const neuve = lignes.find(l => !/^line-\d+$/.test(l.getAttribute('data-dp-ligne') ?? ''))!;
    expect(neuve).toBeTruthy();
    expect(neuve.querySelector('summary [data-dp-nom]')!.getAttribute('data-dp-niveau')).toBe('inconnu');
    expect(neuve.querySelector('summary [data-dp-niveau="inconnu"]')).not.toBeNull();
  });
});

/** VERDICT-f3 défaut 1 (L13) : le premier plan du plateau = ce qui est sous la rangée, hors du seul « plus » (`[data-dp-plus]`). */
const premierPlan = (n: number) => {
  const d = ligne(n).querySelector('details')!.cloneNode(true) as HTMLElement;
  d.querySelector('summary')?.remove();
  d.querySelectorAll('[data-dp-plus]').forEach(e => e.remove());
  return d;
};
describe('VERDICT-f3 défaut 1 : le plateau ouvert est celui de p3c-3 (p3c-3-geste-plateau.png)', () => {
  const ANCIEN = /Type d’achat|Réception en stock|Nom de l’article|Quantité reçue|Unité lue|Libellé de la facture|Voir l’extrait|Mettre en stock|TTC \(CHF\)|Créer un nouvel article/;
  it('malt concassé neuf : imprimé, état, [q] u × [p] = [m], ✓ au centime, segments, « article « … » · nouvel article ⇄ » ; le reste derrière un seul « plus »', async () => {
    await ouvrir();
    const p = premierPlan(4);
    expect(p.textContent).not.toMatch(ANCIEN);
    expect(p.querySelector('[data-dp-imprime]')).not.toBeNull();
    expect(p.querySelector('[data-dp-options]')!.textContent).toMatch(/concass/);
    const calc = p.querySelector('[data-dp-calcul]')!;
    for (const champ of ['Quantité ligne 4', 'Unité ligne 4', 'Prix ligne 4', 'Montant ligne 4']) expect(calc.querySelector(`[aria-label="${champ}"]`), champ).not.toBeNull();
    expect(calc.textContent).toMatch(/✓ au centime/);
    const segments = Array.from(p.querySelectorAll('[data-dp-nature] button')).map(b => `${b.textContent}${b.getAttribute('aria-pressed') === 'true' ? '*' : ''}`);
    expect(segments).toEqual(['Ingrédient*', 'Service', 'Matériel']);
    expect(p.querySelector('[data-dp-stock]')!.textContent).toMatch(/^article «.*» · nouvel article/); // le nom est le champ, dans la ligne
    expect(p.querySelector('[data-dp-stock] input[aria-label="Nom de l’article, ligne 4"]')).not.toBeNull();
    expect(ligne(4).querySelectorAll('[data-dp-plus]')).toHaveLength(1);
  });
  it('aucun doublon : le nom de l’article se saisit une fois, « nouvel article » et la fiche ne se disent qu’une fois', async () => {
    await ouvrir();
    const tout = ligne(4).querySelector('details')!.cloneNode(true) as HTMLElement;
    tout.querySelector('summary')?.remove();
    expect(tout.querySelectorAll('input[aria-label^="Nom de l’article"]')).toHaveLength(1);
    expect((premierPlan(4).textContent!.match(/nouvel article/g) ?? []).length).toBe(1); // derrière « plus », l'option « Créer un nouvel article » de la liste n'est qu'un choix
    expect((tout.textContent!.match(/approchée/g) ?? []).length).toBeLessThanOrEqual(1);
  });
  it('matériel : « Fiche matériel » est sa seule liste, au premier plan ; ni stock ni nom d’article', async () => {
    await ouvrir();
    const p = premierPlan(2);
    expect(p.textContent).not.toMatch(ANCIEN);
    expect(p.querySelector('select[aria-label="Matériel ligne 2"]')).not.toBeNull();
    expect(p.querySelectorAll('select')).toHaveLength(1);
  });
});

describe('VERDICT-f3 défaut 8 : le jaune « à contrôler » a son geste au plateau', () => {
  it('« unité g déduite … à contrôler » suivi de g / kg / Stk, g pré-choisi ; toucher g lève le jaune', async () => {
    await ouvrir();
    const seg = () => Array.from(ligne(7).querySelectorAll('[data-dp-unite-segments] button')) as HTMLButtonElement[];
    expect(seg().map(b => `${b.textContent}${b.getAttribute('aria-pressed') === 'true' ? '*' : ''}`)).toEqual(['g*', 'kg', 'Stk']);
    expect(resume(7).querySelector('[data-dp-qte]')!.getAttribute('data-dp-niveau')).toBe('repris');
    fireEvent.click(seg()[0]);
    expect(resume(7).querySelector('[data-dp-qte]')!.hasAttribute('data-dp-niveau')).toBe(false);
    expect(resume(7).querySelector('[data-dp-prix]')!.textContent).not.toBe('—'); // le prix imprimé reste : l'unité confirmée est celle qu'il avait
  });
});

describe('VERDICT-f3-p2 majeur 1 (D277, « globalement pour tout ») : un lien proposé par la lecture est jaune jusqu’à ce qu’il le confirme', () => {
  it('Pilsner Malz proposé : picto de lien jaune, « 1 proposé » jaune au récap, plus de phrase ; « Garder » le confirme et le jaune tombe', async () => {
    await ouvrir();
    const lien = () => resume(11).querySelector('[data-dp-lien]');
    expect(lien()?.getAttribute('data-dp-niveau')).toBe('repris');
    const propose = () => q('[data-dp="compte-liens"] [data-va="propose"]');
    expect(propose()?.getAttribute('data-dp-niveau')).toBe('repris');
    expect(propose()?.textContent).toMatch(/^1 proposé/);
    expect(document.querySelector('[data-dp="propositions"]')?.textContent ?? '').not.toMatch(/proposée/);
    expect(ligne(11).querySelector('[data-dp-stock]')!.textContent).toMatch(/· proposé/);
    fireEvent.click(within(ligne(11)).getByRole('button', { name: /^Garder l’article « Pilsner Malz »/ }));
    expect(lien()?.hasAttribute('data-dp-niveau')).toBe(false);
    expect(propose()).toBeNull();
    expect(ligne(11).querySelector('[data-dp-stock]')!.textContent).toMatch(/· relié/);
  });
});

describe('VERDICT-f3-p2 détails 2 à 4', () => {
  it('détail 2 : le champ d’unité vide dit « ? » en rouge tirets', async () => {
    await ouvrir();
    const u = ligne(13).querySelector('[data-dp-calcul] input[aria-label^="Unité ligne"]') as HTMLInputElement;
    expect(u.placeholder).toBe('?');
    expect(u.getAttribute('data-dp-niveau')).toBe('inconnu');
  });
  it('détail 3 : un bis ouvert n’a qu’un ⇄ ; sa barre se fond dans la ligne « article » du plateau', async () => {
    await ouvrir();
    // fermée : la barre jaune seule (la base)
    expect(ligne(12).querySelector('[data-dp-barre]')).not.toBeNull();
    const d = ligne(12).querySelector('details')!;
    act(() => { d.open = true; fireEvent(d, new Event('toggle')); });
    const corps = ligne(12).querySelector('[data-dp-corps]')!;
    expect(within(ligne(12)).getAllByRole('button', { name: 'Choisir un autre article' })).toHaveLength(1);
    expect(corps.querySelector('[data-dp-stock]')!.textContent).toMatch(/stock : Target α 11,8/);
    expect(within(corps as HTMLElement).getByRole('button', { name: 'Garder le nouvel article « Target bis »' })).toBeTruthy();
    expect(ligne(12).querySelector('[data-dp-barre]')).toBeNull();
    // refermée : la barre revient
    act(() => { d.open = false; fireEvent(d, new Event('toggle')); });
    expect(ligne(12).querySelector('[data-dp-barre]')).not.toBeNull();
  });
  it('détail 4 : la carte « Date de l’achat » est fermée au repos ; « date ? » l’ouvre ; son avertissement tient sur une ligne', async () => {
    await ouvrir();
    const bloc = document.querySelector<HTMLDetailsElement>('[data-purchase-date]')!;
    expect(bloc.open).toBe(false);
    fireEvent.click(q('[data-dp="bandeau"] [aria-label="Date de l’achat à remplir"]'));
    expect(bloc.open).toBe(true);
    expect(bloc.querySelector('#scan-hint-date')!.className).toMatch(/whitespace-nowrap/);
  });
});

describe('§ 3 de f2 : la validation accepte « sur » et « repris », refuse « inconnu »', () => {
  const brouillon = (line: Record<string, unknown>): PurchaseDraft => ({
    submissionId: 'test-f3-rangees', date: '2026-11-01', vendor: 'Boutique fictive', invoiceNumber: '', description: 'test', amount: 4.25, category: 'brassage', paymentMethod: 'card', paymentDate: '01.11.2026',
    lines: [{ id: 'l1', description: 'Ekuanot', kind: 'ingredient', stockAction: 'new', equipmentAction: 'none', quantity: 85, unit: '', unitPrice: 0.05, amount: 4.25, ...line }],
  } as unknown as PurchaseDraft);
  it('une unité déduite « repris » rend la ligne valide, sans écrire l’unité imprimée', () => {
    const avec = validatePurchase(brouillon({ uniteDeduite: { unite: 'g', niveau: 'repris', regle: 'houblon', raison: 'test' } }), { rawMaterials: [], cleaning: [], equipment: [], kegs: [] } as any);
    expect(avec.filter(m => /unité/.test(m))).toEqual([]);
  });
  it('sans unité déduite (inconnu), la ligne reste « unité à préciser »', () => {
    const sans = validatePurchase(brouillon({}), { rawMaterials: [], cleaning: [], equipment: [], kegs: [] } as any);
    expect(sans.some(m => /unité/.test(m))).toBe(true);
  });
});
