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
import { stockDe } from '../aide-plateau';
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

});

describe('zone 2 : nouvel article d’office, aucun « Créer » au repos', () => {
  it('les ingrédients sans article sont « new », avec le picto « nouvel article » ; matériel et emballage sans mouvement ni bouton', async () => {
    await ouvrir();
    expect(document.querySelectorAll('[data-dp-creer]')).toHaveLength(0);
    expect(screen.queryAllByRole('button', { name: /^Créer/ })).toHaveLength(0);
    for (const n of [1, 4, 5, 6, 7, 8]) {
      expect(stockDe(n), `ligne ${n}`).toBe('new'); // 28c98cba (pu4d, D350, p-port-pu4d/RESULTAT.md) : le menu « Stock ligne n » est lu sur la ligne « article » du plateau
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
    // Imprime (Plateau.tsx) sépare par des espaces insécables. 28c98cba (pu4d, D350, p-port-pu4d/RESULTAT.md) : l'imprimé est le texte du papier, tel quel, options allemandes comprises
    // (« Mischung: …, Schrotung: geschrotet »), et la ligne d'options en français (`data-dp-options`, « concassé ») est retirée du plateau (« Retiré sans équivalent »).
    const imprime = ligne(4).querySelector('[data-dp-imprime]')!.textContent!.split(String.fromCharCode(160)).join(' ');
    expect(imprime).toMatch(/^imprimé « Carafa Spezial I®, Kg.*» · MA0301$/);
    expect(ligne(4).querySelector('[data-dp-options]')).toBeNull();
    // Le papier n'est cité qu'à l'imprimé : nulle part ailleurs de la ligne (rangée, plateau) l'allemand ne passe pour du français.
    const reste = ligne(4).cloneNode(true) as HTMLElement; reste.querySelector('[data-dp-imprime]')!.remove();
    expect(reste.textContent).not.toMatch(/Schrotung|geschrotet/);
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

});

describe('zone 5 : le récap compte', () => {
  it('« n nouveaux · n hors stock · n à contrôler · ↳ n moutures +x » ; aucun compte nul', async () => {
    await ouvrir();
    const t = q('[data-dp="compte-liens"]').textContent!;
    expect(t).toMatch(/\d+ nouveaux/);
    expect(t).not.toMatch(/hors stock/); // A3 (g2a) : retiré, dans aucune maquette
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
  d.querySelectorAll('[data-dp-voir-famille]').forEach(e => e.remove()); // 28c98cba (pu4d, D350, p-port-pu4d/RESULTAT.md) : « plus » (champ Famille, D364) remplace l'ancien `data-dp-plus`
  return d;
};
describe('VERDICT-f3 défaut 1 : le plateau ouvert est celui de p3c-3 (p3c-3-geste-plateau.png)', () => {
  const ANCIEN = /Type d’achat|Réception en stock|Nom de l’article|Quantité reçue|Unité lue|Libellé de la facture|Voir l’extrait|Mettre en stock|TTC \(CHF\)|Créer un nouvel article/;
  it('malt concassé neuf : imprimé, état, [q] u × [p] = [m], ✓ au centime, segments, « article « … » · nouvel article ⇄ » ; le reste derrière un seul « plus »', async () => {
    await ouvrir();
    const p = premierPlan(4);
    expect(p.textContent).not.toMatch(ANCIEN);
    expect(p.querySelector('[data-dp-imprime]')).not.toBeNull();
    expect(p.querySelector('[data-dp-options]')).toBeNull(); // 28c98cba (pu4d, D350, p-port-pu4d/RESULTAT.md) : ligne d'options retirée
    const calc = p.querySelector('[data-dp-calcul]')!;
    // 28c98cba (pu4d, D350, p-port-pu4d/RESULTAT.md) : l'unité est le groupe « Unité ligne 4 » (segment) ; D351 : « ✓ au centime » ne se dit plus quand le calcul tombe juste, seul un écart se dit.
    for (const champ of ['Quantité ligne 4', 'Unité ligne 4', 'Prix ligne 4', 'Montant ligne 4']) expect(calc.querySelector(`[aria-label="${champ}"]`), champ).not.toBeNull();
    expect(calc.querySelector('[data-dp-centime]')).toBeNull();
    const segments = Array.from(p.querySelectorAll('[data-dp-nature] button')).map(b => `${b.textContent}${b.getAttribute('aria-pressed') === 'true' ? '*' : ''}`);
    expect(segments).toEqual(['Ingrédient*', 'Service', 'Matériel']);
    expect(p.querySelector('[data-dp-stock]')!.textContent).toMatch(/^article «.*» · nouvel article/); // le nom est le champ, dans la ligne
    expect(p.querySelector('[data-dp-stock] input[aria-label="Nom de l’article, ligne 4"]')).not.toBeNull();
    expect(ligne(4).querySelectorAll('[data-dp-voir-famille]')).toHaveLength(1);
  });


});

describe('VERDICT-f3 défaut 8 : le jaune « à contrôler » a son geste au plateau', () => {
  it('C2 (g2a, critique g3) : l’unité déduite reste jaune à la rangée (raison au survol), sans phrase ni segment sous les champs ; le segment g / kg / Stk n’existe que pour une unité inconnue', async () => {
    await ouvrir();
    // 28c98cba (pu4d, D350, p-port-pu4d/RESULTAT.md) : le segment d'unité est au plateau de toute ligne (pu4d) ; l'unité déduite y est allumée en jaune « repris », sans phrase.
    expect(ligne(7).querySelector('[data-dp-unite-segments]')!.getAttribute('data-dp-niveau')).toBe('repris'); expect(ligne(7).querySelector('[data-dp-unite-deduite]')).toBeNull();
    expect(resume(7).querySelector('[data-dp-qte]')!.getAttribute('data-dp-niveau')).toBe('repris');
    expect(resume(7).getAttribute('title')).toMatch(/./);
    expect(within(ligne(13)).getAllByRole('button', { name: 'kg' }).length).toBeGreaterThan(0); // l'unité inconnue garde son segment
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
