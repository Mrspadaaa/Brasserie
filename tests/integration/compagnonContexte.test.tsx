import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FinanceAssistant } from '../../src/ui/finance/FinanceAssistant';
import { contexteCompagnon, REGLAGES_DEFAUT, type DonneesContexte } from '../../src/ui/finance/compagnon/contexte';

const MOCK = vi.hoisted(() => ({ tx: [] as unknown[], chat: vi.fn() }));
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getTransactions: () => MOCK.tx, subscribe: () => () => {} } }));
vi.mock('../../src/services/financeService', () => ({ FinanceService: { snapshot: () => ({ profile: { id: 'current', vatRegistered: false }, plans: [], payments: [], assets: [], closings: [] }) } }));
vi.mock('../../src/services/financialArchiveService', () => ({ FinancialArchiveService: { getArchives: () => [] } }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children }: any) => open ? <div role="dialog" aria-label={title}>{children}</div> : null }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: (p: any) => { MOCK.chat(p); return <div role="dialog" aria-label="Chat">{p.initialQuestion}</div>; } }));

/** Le contexte du compagnon est celui du domaine, bâti sur les pastilles cochées seulement (Gemini n'est jamais appelé). */
const tx = (id: string, date: string, description: string, cents: number) => ({ id, date, description, category: 'divers', amountTTC: cents / 100, amountHT: cents / 100, finance: { version: 2, kind: 'expense', amountCents: cents, lines: [] } });
const donnees = (): DonneesContexte => ({
  mois: '2026-11', asOf: '2026-11-15',
  transactions: [tx('T-NOV', '2026-11-03', 'Loyer atelier novembre', 40000), tx('T-OCT', '2026-10-03', 'Facture octobre brasserie', 12000), tx('T-NOV2', '2026-11-09', 'Malt Pilsner', 9000)] as never,
  payments: [{ id: 'P1', transactionId: 'T-NOV2', date: '2026-11-09', amountCents: 9000, direction: 'out', method: 'bank', recordedAt: '2026-11-09T10:00:00Z' }] as never,
  plans: [{ id: 'PL-MAT', title: 'Projet cuve inox', date: '2027-01-10', amountCents: 250000, direction: 'out', category: 'materiel', source: 'equipment', status: 'active', createdAt: '2026-11-01T00:00:00Z' }] as never,
  assets: [], closings: [], archives: [{ id: 'A-2024', year: 2024, status: 'archived', archivedAt: '2025-02-01T00:00:00Z' }] as never,
  profile: { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified' } as never,
  aPayerIds: ['T-NOV'], sansPieceIds: ['T-OCT', 'T-NOV2'],
});
const json = (r: Partial<typeof REGLAGES_DEFAUT>) => JSON.stringify(contexteCompagnon({ ...REGLAGES_DEFAUT, ...r }, donnees()).contexte);

describe('compagnon m4ia-c : ce que le contexte contient', () => {
  it('par défaut : les opérations de novembre, pas octobre', () => {
    const r = contexteCompagnon(REGLAGES_DEFAUT, donnees());
    expect(r.transactionIds.sort()).toEqual(['T-NOV', 'T-NOV2']);
    expect(json({})).toContain('Loyer atelier novembre');
    expect(json({})).not.toContain('Facture octobre brasserie');
  });
  it('« tout l’historique » coché ajoute octobre', () => {
    expect(json({ toutHistorique: true })).toContain('Facture octobre brasserie');
  });
  it('pastille « loyer à payer » décochée : le loyer n’est plus dans le contexte ; « sans pièce » décochée : ces pièces non plus', () => {
    expect(json({ aPayer: false })).not.toContain('Loyer atelier novembre');
    expect(json({ sansPiece: false })).not.toContain('Malt Pilsner');
    expect(json({ sansPiece: false })).toContain('Loyer atelier novembre');
  });
  it('« novembre » et « opérations » décochées : aucune opération', () => {
    expect(contexteCompagnon({ ...REGLAGES_DEFAUT, periode: false }, donnees()).transactionIds).toEqual([]);
    expect(contexteCompagnon({ ...REGLAGES_DEFAUT, operations: false }, donnees()).transactionIds).toEqual([]);
  });
  it('projets de matériel : absents tant que la pastille n’est pas cochée, présents ensuite', () => {
    expect(json({})).not.toContain('Projet cuve inox');
    expect(json({ projets: true })).toContain('Projet cuve inox');
  });
  it('w2 : le contexte et la consigne n’ont ni « TX- » ni nom de champ interne (cashComplete…) ; les pièces y sont nommées par leurs mots', () => {
    const d = donnees();
    d.transactions = [tx('TX-8F3A21', '2026-11-03', 'Loyer atelier novembre', 40000), tx('TX-77B0C4', '2026-11-09', 'Malt Pilsner', 9000)] as never;
    d.payments = [{ id: 'PAY-9', transactionId: 'TX-77B0C4', date: '2026-11-09', amountCents: 9000, direction: 'out', method: 'bank', recordedAt: '2026-11-09T10:00:00Z' }] as never;
    d.aPayerIds = ['TX-8F3A21']; d.sansPieceIds = ['TX-77B0C4'];
    const { contexte, consigne } = contexteCompagnon({ ...REGLAGES_DEFAUT, projets: true }, d);
    const lu = JSON.stringify(contexte) + consigne;
    expect(lu).not.toMatch(/TX-|PAY-9|PL-MAT/);
    for (const champ of ['cashComplete', 'sourceIds', 'proofId', 'planId', 'refundOfId']) expect(lu).not.toContain(champ);
    expect(lu).toContain('Loyer atelier novembre');
    expect(lu).toContain('Projet cuve inox');
  });
  it('la consigne écrite dans la question nomme ce qui est exclu', () => {
    const { consigne } = contexteCompagnon({ ...REGLAGES_DEFAUT, aPayer: false }, donnees());
    expect(consigne).toContain('le mois novembre 2026');
    expect(consigne).toContain('N’utilise pas');
    expect(consigne).toContain('les pièces à payer');
    expect(consigne).toContain('les archives');
  });
});

/** La feuille m4ia-c, jouée : la pile visée, les pastilles, la question qui part préremplie dans le chat (jamais envoyée seule). */
const depense = (id: string, date: string, description: string, category: string, cents: number, proof = false, impaye = false) => ({
  id, date, description, category, amountTTC: cents / 100, amountHT: cents / 100, proofUrl: proof ? 'https://exemple.test/p.pdf' : undefined,
  finance: { version: 2, kind: 'expense', amountCents: cents, lines: [], paymentStatus: impaye ? 'unpaid' : undefined },
});
const POSE = { libelle: 'Pourquoi les charges fixes pèsent autant ?', question: 'Pourquoi les charges fixes pèsent autant sur le mois novembre 2026 ? Explique ce qui compose ce poste.' };
const jeu = () => {
  MOCK.tx = [depense('T1', '2026-11-03', 'Loyer atelier', 'chargesFixes', 40000, false, true), depense('T2', '2026-11-09', 'Malt Pilsner', 'brassage', 9000, true), depense('T3', '2026-10-02', 'Facture octobre', 'chargesFixes', 12000)];
};
const ouvrir = (extra: Partial<React.ComponentProps<typeof FinanceAssistant>> = {}) => {
  render(<FinanceAssistant view="journal" month="2026-11" allDates={false} year={2026} horizon={90} pose={POSE} {...extra}/>);
  fireEvent.click(screen.getByRole('button', { name: /Pourquoi les charges fixes|Vérifier mes opérations|Prévoir mes prochains/ }));
  return screen.getByRole('dialog', { name: /Compagnon brasseur/ });
};
describe('feuille m4ia-c : jouée', () => {
  afterEach(() => { cleanup(); MOCK.chat.mockClear(); localStorage.clear(); });

  it('la puce ouvre la feuille, pas le chat ; la pile visée (charges fixes) est entourée, la question est courte et modifiable', () => {
    jeu(); const f = within(ouvrir());
    expect(screen.queryByRole('dialog', { name: 'Chat' })).toBeNull();
    const vise = document.querySelector('[data-vise]') as HTMLElement;
    expect(vise.getAttribute('data-pile')).toBe('chargesFixes');
    expect(within(vise).getByText('400,00')).toBeTruthy();
    expect((f.getByLabelText('Ta question') as HTMLTextAreaElement).value).toBe('Pourquoi les charges fixes pèsent autant ? 400,00 sur 490,00 dépensés.');
    expect(f.getByRole('button', { name: 'novembre' })).toHaveAttribute('aria-pressed', 'true');
    expect(f.getByRole('button', { name: '2 opérations' })).toHaveAttribute('aria-pressed', 'true');
    expect(f.getByRole('button', { name: 'Loyer atelier à payer 400,00' })).toHaveAttribute('aria-pressed', 'true');
    expect(f.getByRole('button', { name: '1 sans pièce' })).toHaveAttribute('aria-pressed', 'true');
    expect(f.getByRole('button', { name: 'profil : sans TVA' })).toHaveAttribute('aria-pressed', 'true');
    for (const n of ['tout l’historique', 'archives', 'projets de matériel']) expect(f.getByRole('button', { name: n })).toHaveAttribute('aria-pressed', 'false');
    expect(f.queryByText(/Il lit aussi le registre/)).toBeNull(); // t3 : phrase absente de m4ia-c, retirée
  });

  it('une pastille décochée sort du contexte : le compte baisse, la consigne la nomme, la question part préremplie et le chat ne démarre pas seul', () => {
    jeu(); const f = within(ouvrir());
    fireEvent.click(f.getByRole('button', { name: 'Loyer atelier à payer 400,00' }));
    expect(f.getByRole('button', { name: '1 opération' })).toBeTruthy();
    fireEvent.click(f.getByRole('button', { name: 'Envoyer' }));
    expect(screen.queryByRole('dialog', { name: /Compagnon brasseur/ })).toBeNull();
    const envoye = MOCK.chat.mock.calls.at(-1)![0].initialQuestion as string;
    expect(MOCK.chat.mock.calls.at(-1)![0].autoSend).toBe(true); expect(envoye).not.toMatch(/2026-11/); // t2, points 4 et 5
    expect(envoye).toContain('Contexte choisi par le brasseur : le mois novembre 2026');
    expect(envoye).toContain('les pièces à payer');
    expect(envoye).toContain('Pourquoi les charges fixes pèsent autant sur le mois novembre 2026');
    expect(envoye).toContain('400,00 sur 490,00 dépensés.');
    expect(screen.getByRole('dialog', { name: 'Chat' })).toBeTruthy();
  });

  it('« tout l’historique » coché ajoute octobre au compte ; une question modifiée part telle quelle', () => {
    jeu(); const f = within(ouvrir());
    fireEvent.click(f.getByRole('button', { name: 'tout l’historique' }));
    expect(f.getByRole('button', { name: '3 opérations' })).toBeTruthy();
    fireEvent.change(f.getByLabelText('Ta question'), { target: { value: 'Et le loyer ?' } });
    fireEvent.click(f.getByRole('button', { name: 'Envoyer' }));
    const envoye = MOCK.chat.mock.calls.at(-1)![0].initialQuestion as string;
    expect(MOCK.chat.mock.calls.at(-1)![0].autoSend).toBe(true); expect(envoye).not.toMatch(/2026-11/); // t2, points 4 et 5
    expect(envoye).toContain('tout l’historique');
    // t1, problème 5 : la question du brasseur est la première ligne du champ du chat, la consigne du contexte vient après.
    expect(envoye.startsWith('Et le loyer ?')).toBe(true);
  });

  it('le mode de réponse choisi est celui que le chat relit', () => {
    jeu(); const f = within(ouvrir());
    fireEvent.change(f.getByLabelText('Mode de réponse'), { target: { value: 'deep' } });
    expect(localStorage.getItem('brewer-chat-mode')).toBe('deep');
  });

  it('Prévisions : pas de bande de piles, et la période n’est pas restreinte au mois', () => {
    jeu(); const f = within(ouvrir({ view: 'forecast', pose: null }));
    expect(document.querySelector('[data-bande]')).toBeNull();
    expect(f.getByRole('button', { name: 'tout l’historique' })).toHaveAttribute('aria-pressed', 'true');
    expect((f.getByLabelText('Ta question') as HTMLTextAreaElement).value).toMatch(/prévision/);
  });

  it('une plage que la feuille ne connaît pas : pas de bande qui contredirait la question', () => {
    jeu(); ouvrir({ pose: { ...POSE, question: 'Pourquoi les charges fixes pèsent autant sur la période du 1 au 9 nov. ?' } });
    expect(document.querySelector('[data-bande]')).toBeNull();
  });
});
