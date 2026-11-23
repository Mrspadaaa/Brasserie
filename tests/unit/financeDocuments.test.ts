import {beforeEach,describe,it,expect,vi} from 'vitest';
const state=vi.hoisted(()=>({docs:new Map<string,any>(),reads:vi.fn()}));
vi.mock('../../src/services/firebase',()=>({db:{}}));
vi.mock('firebase/firestore',()=>({writeBatch:()=>({}),getDocFromServer:async()=>{throw Object.assign(Error('Failed to get document because the client is offline.'),{code:'unavailable'});},doc:(_db:any,_collection:any,id:string)=>id,getDoc:async(id:string)=>{state.reads(id);return{exists:()=>state.docs.has(id),data:()=>state.docs.get(id)};}}));
vi.mock('../../src/services/firestoreRepo',()=>({FirestoreRepo:{find:()=>undefined,put:(_collection:any,id:string,value:any)=>state.docs.set(id,value)}}));
import {prepareFinanceDocument,saveFinanceDocument,loadFinanceDocument,saveFinanceDocumentConfirmed} from '../../src/services/financeDocuments';
beforeEach(()=>{state.docs.clear();state.reads.mockClear();});
describe('Originaux de justificatifs : taille et lecture à la demande',()=>{
  it('ne lit rien au démarrage, prépare sans écrire et reconstruit exactement un original de plus de 1 Mo',async()=>{
    const source='data:image/png;base64,'+'A'.repeat(1_200_000);const prepared=prepareFinanceDocument('proof-test-123',source,'ticket.png','image/png');
    expect(state.docs.size).toBe(0);expect(state.reads).not.toHaveBeenCalled();saveFinanceDocument(prepared);
    expect([...state.docs.values()].filter(doc=>doc.data).every(doc=>doc.data.length<=400_000)).toBe(true);
    expect((await loadFinanceDocument('proof-test-123')).dataUrl).toBe(source);
  });
  it('signale un morceau absent sans présenter un faux justificatif complet',async()=>{
    saveFinanceDocument(prepareFinanceDocument('proof-test-124','data:image/jpeg;base64,'+'A'.repeat(400_004),'ticket.jpg','image/jpeg'));
    state.docs.delete('proof-test-124-1');await expect(loadFinanceDocument('proof-test-124')).rejects.toThrow('indisponible');
  });
  it('refuse les formats actifs, type incohérent et identifiants de chemins',()=>{
    expect(()=>prepareFinanceDocument('proof-test-125','data:text/html;base64,AAAA','a.html','text/html')).toThrow();
    expect(()=>prepareFinanceDocument('proof-test-125','data:image/png;base64,AAAA','a.png','application/pdf')).toThrow();
    expect(()=>prepareFinanceDocument('../private','data:image/png;base64,AAAA','a.png','image/png')).toThrow();
  });
});

describe('JUS-1 (M6) : original hors ligne',()=>{
  it('remplace le message anglais du SDK par la cause et la marche à suivre, sans rien écrire',async()=>{
    const prepared=prepareFinanceDocument('proof-test-126','data:image/png;base64,AAAA','ticket.png','image/png');
    const failure=saveFinanceDocumentConfirmed(prepared,2025);
    await expect(failure).rejects.toThrow('Hors connexion : l’original n’a pas pu être envoyé sur Drive, donc rien n’est enregistré. Réessaie une fois en ligne.');
    await expect(failure).rejects.toMatchObject({code:'unavailable'});
    expect(state.docs.size).toBe(0);
  });
});
