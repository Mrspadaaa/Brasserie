import { describe, expect, it } from 'vitest';
import { futsLivrables, futsProposes, livrerFuts, planApresVente, planSoldeParDepense, planSoldeParVente } from '../../src/domain/venteSuites';
import type { KegItem } from '../../src/types';
import type { FinancialPlan } from '../../src/domain/finance/types';

const plan = (over: Partial<FinancialPlan> = {}): FinancialPlan => ({
  id: 'P1', title: 'ZZ TEST La Cigogne, 2 fûts', date: '2026-12-01', amountCents: 28000, direction: 'in', category: 'recettes', source: 'manual',
  status: 'active', createdAt: '2026-11-01T08:00:00.000Z', clientId: 'C1', batchId: 'LOT-PA', ...over
});
const fut = (id: string, over: Partial<KegItem> = {}): KegItem => ({ id, capacityL: 20, state: 'plein', batchRef: 'LOT-PA', fillDate: '01.10.2026', ...over });

describe('B5 : la vente réelle solde la vente promise', () => {
  const v = { clientId: 'C1', batchIds: ['LOT-PA'], dateIso: '2026-11-21' };
  it('trouve la promesse du même client et du même brassin', () => {
    expect(planSoldeParVente([plan()], v)?.id).toBe('P1');
  });
  it('ne devine rien : autre client, sans client, brassin différent, plan annulé, sortie ou récurrent', () => {
    expect(planSoldeParVente([plan({ clientId: 'C2' })], v)).toBeNull();
    expect(planSoldeParVente([plan()], { ...v, clientId: null })).toBeNull();
    expect(planSoldeParVente([plan({ batchId: 'LOT-NE' })], v)).toBeNull();
    expect(planSoldeParVente([plan({ status: 'cancelled' })], v)).toBeNull();
    expect(planSoldeParVente([plan({ direction: 'out' })], v)).toBeNull();
    expect(planSoldeParVente([plan({ recurrence: { frequency: 'monthly' } })], v)).toBeNull();
  });
  it('prend la plus proche de la date de la vente quand il y en a plusieurs', () => {
    expect(planSoldeParVente([plan({ id: 'LOIN', date: '2027-03-01' }), plan({ id: 'PROCHE', date: '2026-11-25' })], v)?.id).toBe('PROCHE');
  });
  it('un plan sans brassin se solde par n\'importe quel brassin du même client', () => {
    expect(planSoldeParVente([plan({ batchId: undefined })], { ...v, batchIds: ['X'] })?.id).toBe('P1');
  });
  it('soldé en entier → completed ; vente partielle → reste actif', () => {
    expect(planApresVente(plan(), 28000, 'now').status).toBe('completed');
    expect(planApresVente(plan(), 14000, 'now').status).toBe('active');
  });
});

describe('B6 : la vente livre les fûts du brassin', () => {
  const kegs = [fut('F-002', { fillDate: '05.10.2026' }), fut('F-001'), fut('F-003', { batchRef: 'LOT-NE' }), fut('F-004', { state: 'livre' }), fut('F-005', { capacityL: 30 })];
  it('liste les pleins du brassin et de la capacité, le plus ancien rempli d\'abord', () => {
    expect(futsLivrables(kegs, { batchId: 'LOT-PA', litresUnite: 20 }).map(k => k.id)).toEqual(['F-001', 'F-002']);
    expect(futsLivrables(kegs, { litresUnite: 20 })).toEqual([]);
  });
  it('propose autant de fûts que vendus, sans dépasser la cave', () => {
    const l = futsLivrables(kegs, { batchId: 'LOT-PA', litresUnite: 20 });
    expect(futsProposes(l, 1)).toEqual(['F-001']);
    expect(futsProposes(l, 5)).toEqual(['F-001', 'F-002']);
  });
  it('livre à ce client le jour de la vente (date de fût JJ.MM.AAAA), sans toucher aux autres', () => {
    const livres = livrerFuts(kegs, ['F-001', 'F-004'], { id: 'C1', name: 'ZZ TEST La Cigogne' }, '2026-11-21');
    expect(livres.map(k => k.id)).toEqual(['F-001']);
    expect(livres[0]).toMatchObject({ state: 'livre', clientId: 'C1', clientName: 'ZZ TEST La Cigogne', deliveryDate: '21.11.2026' });
  });
});

describe('WFA-15 : la facture solde la dépense prévue', () => {
  const plan = (id: string, o: object = {}) => ({ id, title: 'Commande de malt', date: '2026-11-26', amountCents: 42000, direction: 'out', category: 'brassage', source: 'manual', status: 'active', vendor: 'ZZ TEST', createdAt: '2026-11-01', ...o }) as never;
  it('même fournisseur, montant à ±10 % : le plan est lié (421,57 pour 420)', () => {
    expect(planSoldeParDepense([plan('P-MALT')], { vendor: 'zz test', category: 'brassage', amountCents: 42157 })?.id).toBe('P-MALT');
  });
  it('autre fournisseur, montant éloigné, plan récurrent, dérivé d\'un brassin ou annulé : rien', () => {
    expect(planSoldeParDepense([plan('P')], { vendor: 'Autre', category: 'brassage', amountCents: 42157 })).toBeNull();
    expect(planSoldeParDepense([plan('P')], { vendor: 'ZZ TEST', amountCents: 60000 })).toBeNull();
    expect(planSoldeParDepense([plan('P', { recurrence: { frequency: 'monthly' } })], { vendor: 'ZZ TEST', amountCents: 42000 })).toBeNull();
    expect(planSoldeParDepense([plan('P', { source: 'brew' })], { vendor: 'ZZ TEST', amountCents: 42000 })).toBeNull();
    expect(planSoldeParDepense([plan('P', { status: 'cancelled' })], { vendor: 'ZZ TEST', amountCents: 42000 })).toBeNull();
  });
  it('sans fournisseur au plan : la catégorie', () => {
    expect(planSoldeParDepense([plan('P', { vendor: undefined })], { category: 'brassage', amountCents: 41000 })?.id).toBe('P');
    expect(planSoldeParDepense([plan('P', { vendor: undefined })], { category: 'materiel', amountCents: 41000 })).toBeNull();
  });
  it('PD-2 : le fournisseur de la facture s\'écrit un peu plus long que celui du plan (formes juridiques, accents)', () => {
    expect(planSoldeParDepense([plan('P')], { vendor: 'ZZ TEST Brouwland', category: 'brassage', amountCents: 42157 })?.id).toBe('P');
    expect(planSoldeParDepense([plan('P', { vendor: 'Brouwland' })], { vendor: 'Brouwland BVBA', amountCents: 42157 })?.id).toBe('P');
    expect(planSoldeParDepense([plan('P', { vendor: 'Brasserie Müller' })], { vendor: 'Brasserie Muller SA', amountCents: 42157 })?.id).toBe('P');
    expect(planSoldeParDepense([plan('P', { vendor: 'Brouwland' })], { vendor: 'Brouw', amountCents: 42157 })).toBeNull();
    expect(planSoldeParDepense([plan('P')], { amountCents: 42157 })).toBeNull();
  });
  it('PD-2 : un projet de matériel prévu (actif ou en projet) est soldé comme un prévu manuel', () => {
    const pompe = (o: object = {}) => plan('P-POMPE', { title: 'Pompe de transfert', amountCents: 45000, category: 'materiel', source: 'equipment', vendor: 'ZZ TEST Brewferm', ...o });
    expect(planSoldeParDepense([pompe()], { vendor: 'ZZ TEST Brewferm', category: 'materiel', amountCents: 45000 })?.id).toBe('P-POMPE');
    expect(planSoldeParDepense([pompe({ status: 'draft' })], { vendor: 'ZZ TEST Brewferm', category: 'materiel', amountCents: 45000 })?.id).toBe('P-POMPE');
    expect(planSoldeParDepense([plan('P', { source: 'manual', status: 'draft' })], { vendor: 'ZZ TEST', amountCents: 42000 })).toBeNull();
  });
  it('PD-2 : la pompe et la commande de malt partagent « ZZ TEST » : le fournisseur écrit pareil passe avant le sous-ensemble', () => {
    const pompe = plan('P-POMPE', { title: 'Pompe', amountCents: 45000, category: 'materiel', source: 'equipment', vendor: 'ZZ TEST Brewferm', date: '2026-12-20' });
    expect(planSoldeParDepense([plan('P-MALT', { amountCents: 45000, date: '2026-11-26' }), pompe], { vendor: 'ZZ TEST Brewferm', category: 'materiel', amountCents: 45000, dateIso: '2026-11-24' })?.id).toBe('P-POMPE');
  });
  it('PD-2 : plusieurs candidats, comme à la caisse : le plus proche de la date de la pièce, puis du montant (jamais deux soldés)', () => {
    const d = { vendor: 'ZZ TEST', amountCents: 42000, dateIso: '2026-11-24' };
    expect(planSoldeParDepense([plan('LOIN', { date: '2027-02-01' }), plan('PROCHE', { date: '2026-11-26' })], d)?.id).toBe('PROCHE');
    expect(planSoldeParDepense([plan('A', { amountCents: 43000 }), plan('B', { amountCents: 42100 })], d)?.id).toBe('B');
    expect(planSoldeParDepense([plan('B'), plan('A')], d)?.id).toBe('A');
  });
});
