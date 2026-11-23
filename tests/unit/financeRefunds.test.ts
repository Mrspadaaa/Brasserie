import {beforeEach,describe,it,expect,vi} from 'vitest';
import type {FinanceTransaction,FinancialClosing,FinancialPayment,FinancialProfile} from '../../src/domain/finance/types';
const state=vi.hoisted(()=>({transactions:[] as any[],payments:[] as any[],writes:[] as any[]}));
vi.mock('../../src/services/storage',()=>({StorageService:{getTransactions:()=>state.transactions}}));
vi.mock('../../src/services/firestoreRepo',()=>({FirestoreRepo:{all:(name:string)=>name==='financialPayments'?state.payments:[],put:(...args:any[])=>state.writes.push(args),adjustNumber:(...args:any[])=>state.writes.push(args)}}));
import {FinanceService,validateRefundTransaction} from '../../src/services/financeService';
import {paymentState,summarizeLedger,validateFinanceTransaction} from '../../src/domain/finance/ledger';
import {buildAnnualReport} from '../../src/domain/finance/annual';
const profile:FinancialProfile={id:'current',canton:'FR',legalForm:'sole-proprietor',accounting:'simplified',vatRegistered:false,openingCash:{date:'2026-01-01',amountCents:100000,confirmed:true}};
const closing:FinancialClosing={id:'test',year:2026,createdAt:'2026-09-09T00:00:00Z',openingInventory:[],closingInventory:[],inventoriesConfirmed:true,adjustments:[]};
const original=():FinanceTransaction=>({id:'T1',date:'2026-01-01',description:'Malt',category:'brassage',subcategory:'Malt',amountHT:100,amountTTC:100,tvaRate:0,tvaAmount:0,proofUrl:'https://example.test/proof',finance:{version:1,kind:'expense',amountCents:10000,lines:[],paymentStatus:'unpaid'}});
const credit=(amountCents=2000,application:'cash'|'offset'='offset'):FinanceTransaction=>({...original(),id:'C1',date:'2026-01-03',description:'Avoir malt',amountHT:amountCents/100,amountTTC:amountCents/100,finance:{version:1,kind:'refund',amountCents,lines:[],refundOfId:'T1',refundDirection:'in',refundApplication:application,paymentStatus:'unpaid'}});
const payment=(amountCents=8000):FinancialPayment=>({id:'P1',transactionId:'T1',date:'2026-01-04',amountCents,direction:'out',method:'bank',recordedAt:'2026-01-04T12:00:00Z'});
const report=(transactions:FinanceTransaction[],payments:FinancialPayment[]=[])=>buildAnnualReport({year:2026,transactions,payments,assets:[],profile,closing});
beforeEach(()=>{state.transactions=[original()];state.payments=[];state.writes=[];});
describe('Avoir imputé et remboursement d’argent distincts',()=>{
  it('facture100 moins avoir20 puis paiement80 solde les deux pièces sans cash fictif',()=>{
    const txs=[original(),credit()],payments=[payment()];
    expect(paymentState(txs[0],payments,txs,'2026-01-04')).toMatchObject({state:'paid',paidCents:8000,appliedCreditCents:2000,remainingCents:0});
    expect(paymentState(txs[1],payments,txs,'2026-01-04')).toMatchObject({state:'paid',paidCents:0,remainingCents:0});
    expect(summarizeLedger(txs,payments,profile,'2026-01-04')).toMatchObject({cashCents:92000,payablesCents:0,receivablesCents:0,expenseCents:8000});
    expect(report(txs,payments)).toMatchObject({paidCents:8000,receivedCents:0,operatingExpensesCents:8000,categories:[{category:'brassage',amountCents:8000}],resultCents:-8000});
  });
  it('l’avoir est appliqué à sa date, et son annulation restaure le restant dû',()=>{
    const txs=[original(),credit()];
    expect(paymentState(txs[0],[],txs,'2026-01-02').remainingCents).toBe(10000);
    expect(paymentState(txs[0],[],txs,'2026-01-03').remainingCents).toBe(8000);
    txs[1].finance!.voidedAt='2026-01-05T00:00:00Z';
    expect(paymentState(txs[0],[],txs,'2026-01-05').remainingCents).toBe(10000);
  });
  it('une vente client bénéficie du même avoir imputé, avec une créance diminuée',()=>{
    const sale=original();sale.category='recettes';sale.finance!.kind='income';const refund=credit();refund.finance!.refundDirection='out';
    const txs=[sale,refund];expect(summarizeLedger(txs,[],profile,'2026-01-04')).toMatchObject({incomeCents:8000,receivablesCents:8000,payablesCents:0,cashCents:100000});
  });
  it('un remboursement cash attendu reste séparé et ne réduit pas la dette originale',()=>{
    const txs=[original(),credit(2000,'cash')];expect(summarizeLedger(txs,[],profile,'2026-01-04')).toMatchObject({payablesCents:10000,receivablesCents:2000,cashCents:100000});
  });
  it('refuse l’imputation au-delà du restant après acompte et le paiement d’un avoir imputé',()=>{
    state.payments=[payment(9000)];expect(()=>validateRefundTransaction(credit(),state.transactions,state.payments)).toThrow('restant à régler');
    state.transactions.push(credit());expect(()=>FinanceService.recordPayment({...payment(2000),id:'PAY-CREDIT',transactionId:'C1',direction:'in'})).toThrow('sans mouvement');expect(state.writes).toEqual([]);
  });
  it('le paiement de la facture respecte aussi les avoirs imputés',()=>{
    state.transactions.push(credit());expect(()=>FinanceService.recordPayment(payment(8001))).toThrow('restant dû');expect(state.writes).toEqual([]);
    FinanceService.recordPayment(payment(8000));expect(state.writes).toHaveLength(2);
  });
  it('exclut sa propre soumission des avoirs déjà enregistrés lors de la reprise',()=>{
    const refund=credit(8000);expect(()=>validateRefundTransaction(refund,[original(),refund],[])).not.toThrow();
    const second={...credit(3000,'cash'),id:'C2'};expect(()=>validateRefundTransaction(second,[original(),refund],[])).toThrow('dépasser');
  });
  it('refuse un original supprimé ou annulé pendant la saisie, une date impossible et un TTC incohérent',()=>{
    expect(()=>validateRefundTransaction(credit(),[],[])).toThrow('existante et active');
    const tx=original();tx.finance!.voidedAt='2026-01-03T00:00:00Z';expect(()=>validateRefundTransaction(credit(),[tx],[])).toThrow('existante et active');
    expect(()=>validateRefundTransaction({...credit(),date:'31.02.2026'},[original()],[])).toThrow('Date');
    expect(()=>validateFinanceTransaction({...credit(),amountTTC:25})).toThrow('TTC');
  });
});
describe('Compte annuel incomplet signalé sans faux résultat',()=>{
  it('bloque le résultat pour un avoir lié à un original absent ou annulé',()=>{
    expect(report([credit()])).toMatchObject({resultCents:null});
    const tx=original();tx.finance!.voidedAt='2026-01-03T00:00:00Z';const result=report([tx,credit()]);expect(result.resultCents).toBeNull();expect(result.missing.join(' ')).toContain('existante et active');
  });
  it('signale un paiement invalide comme trésorerie incomplète jusque dans le rapport',()=>{
    const invalid={...payment(),date:'2026-02-31'};
    expect(summarizeLedger([original()],[invalid],profile,'2026-09-09').cashComplete).toBe(false);
    expect(report([original()],[invalid]).missing.join(' ')).toContain('paiements ont une date');
  });
  it('une ancienne erreur datée puis annulée ne laisse pas d’alerte permanente',()=>{
    const tx=original();tx.date='31.02.2026';tx.finance!.voidedAt='2026-01-03T00:00:00Z';expect(report([tx]).missing.join(' ')).not.toContain('date valide');
  });
});
