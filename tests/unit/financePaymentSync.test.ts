import {describe,it,expect} from 'vitest';
import {summarizeLedger} from '../../src/domain/finance/ledger';
import type {FinanceTransaction,FinancialPayment,FinancialProfile} from '../../src/domain/finance/types';
const profile:FinancialProfile={id:'current',canton:'FR',legalForm:'sole-proprietor',vatRegistered:false,accounting:'simplified',openingCash:{date:'2026-01-01',amountCents:10000,confirmed:true}};
const transaction:FinanceTransaction={id:'T1',date:'2026-01-01',description:'Malt',category:'brassage',amountHT:50,amountTTC:50,tvaRate:0,tvaAmount:0,settlementBalanceCents:5000,finance:{version:1,kind:'expense',amountCents:5000,lines:[],paymentStatus:'unpaid'}};
const payment:FinancialPayment={id:'P1',transactionId:'T1',date:'2026-02-01',amountCents:5000,direction:'out',method:'bank',recordedAt:'2026-02-01T12:00:00Z'};
describe('Registre en cours de restauration ou synchronisation',()=>{
  it('ne présente pas une trésorerie complète avant réception des paiements du guard',()=>{
    const result=summarizeLedger([transaction],[],profile,'2026-03-01');expect(result.cashComplete).toBe(false);expect(result.warnings.join(' ')).toContain('registre de paiements');
  });
  it('compare le guard au registre complet même quand le rapport porte sur une date antérieure',()=>{
    const result=summarizeLedger([transaction],[payment],profile,'2026-01-15');expect(result.cashComplete).toBe(true);expect(result.cashCents).toBe(10000);expect(result.warnings.join(' ')).not.toContain('registre de paiements');
  });
});
