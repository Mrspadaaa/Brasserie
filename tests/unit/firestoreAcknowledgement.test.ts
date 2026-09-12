import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
const sdk=vi.hoisted(()=>({commit:vi.fn(),read:vi.fn(),globalWait:vi.fn()}));
vi.mock('../../src/services/firebase',()=>({db:{}}));
vi.mock('firebase/firestore',()=>({collection:(_:unknown,name:string)=>name,doc:(_:unknown,name:string,id:string)=>({name,id}),onSnapshot:vi.fn(),writeBatch:()=>({set:vi.fn(),delete:vi.fn(),commit:()=>sdk.commit()}),getDocFromServer:(...args:any[])=>sdk.read(...args),waitForPendingWrites:()=>sdk.globalWait(),getDocs:vi.fn(),getDocsFromServer:vi.fn(),deleteField:vi.fn(),increment:vi.fn(),query:vi.fn(),limit:vi.fn()}));
import {FirestoreRepo,isConfirmedWriteRejection} from '../../src/services/firestoreRepo';
const deferred=()=>{let resolve!:()=>void,reject!:(error:unknown)=>void;const promise=new Promise<void>((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const snapshot=(id='TX-1',value:any={id:'TX-1',amount:100},metadata={hasPendingWrites:false,fromCache:false})=>({id,exists:()=>value!==null,data:()=>value,metadata});
beforeEach(()=>{FirestoreRepo.stopSync();sdk.commit.mockReset().mockResolvedValue(undefined);sdk.read.mockReset().mockResolvedValue(snapshot());sdk.globalWait.mockReset();vi.spyOn(console,'error').mockImplementation(()=>{});});
afterEach(()=>{FirestoreRepo.stopSync();vi.restoreAllMocks();});
describe('Acquittement ciblé : aucun succès provenant d’une autre écriture',()=>{
  it('suit queued/pending/confirmed puis vérifie le document serveur exact sans attendre une autre file',async()=>{
    const commit=deferred();sdk.commit.mockReturnValue(commit.promise);sdk.globalWait.mockReturnValue(new Promise(()=>{}));
    FirestoreRepo.put('transactions','TX-1',{id:'TX-1',amount:100});expect(FirestoreRepo.documentWriteState('transactions','TX-1').status).toBe('queued');
    const ack=FirestoreRepo.waitForDocument<any>('transactions','TX-1',1000,value=>value.amount===100);
    expect(FirestoreRepo.documentWriteState('transactions','TX-1').status).toBe('pending');expect(sdk.read).not.toHaveBeenCalled();
    commit.resolve();expect(await ack).toMatchObject({id:'TX-1',amount:100});expect(FirestoreRepo.documentWriteState('transactions','TX-1').status).toBe('confirmed');expect(sdk.globalWait).not.toHaveBeenCalled();
  });
  it('un refus confirmé reste refusé après le succès d’une autre opération',async()=>{
    sdk.commit.mockRejectedValueOnce({code:'permission-denied',message:'Accès refusé'});sdk.read.mockResolvedValueOnce(snapshot('TX-1',null));
    FirestoreRepo.put('transactions','TX-1',{id:'TX-1'});
    const failure=await FirestoreRepo.waitForDocument('transactions','TX-1').catch(error=>error);expect(isConfirmedWriteRejection(failure)).toBe(true);
    FirestoreRepo.put('transactions','TX-2',{id:'TX-2'});sdk.read.mockResolvedValueOnce(snapshot('TX-2',{id:'TX-2'}));await FirestoreRepo.waitForDocument('transactions','TX-2');
    expect(FirestoreRepo.documentWriteState('transactions','TX-1').status).toBe('rejected');
    sdk.read.mockResolvedValueOnce(snapshot('TX-1',null));await expect(FirestoreRepo.waitForDocument('transactions','TX-1')).rejects.toMatchObject({status:'rejected'});
  });
  it('une rupture réseau ou une absence non prouvée ne débloque jamais la resoumission',async()=>{
    sdk.commit.mockRejectedValueOnce({code:'unavailable',message:'Réseau interrompu'});sdk.read.mockResolvedValue(snapshot('TX-1',null));
    FirestoreRepo.put('transactions','TX-1',{id:'TX-1'});const error=await FirestoreRepo.waitForDocument('transactions','TX-1').catch(e=>e);
    expect(isConfirmedWriteRejection(error)).toBe(false);expect(error.status).toBe('pending');expect(FirestoreRepo.documentWriteState('transactions','TX-1').status).toBe('pending');
  });
  it('un refus connu avec lecture serveur indisponible reste incertain jusqu’à preuve d’absence',async()=>{
    sdk.commit.mockRejectedValueOnce({code:'permission-denied',message:'Refus'});sdk.read.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(snapshot('TX-1',null));
    FirestoreRepo.put('transactions','TX-1',{id:'TX-1'});await expect(FirestoreRepo.waitForDocument('transactions','TX-1')).rejects.toMatchObject({status:'pending'});
    await expect(FirestoreRepo.waitForDocument('transactions','TX-1')).rejects.toMatchObject({status:'rejected'});expect(sdk.commit).toHaveBeenCalledOnce();
  });
  it('un timeout reprend seulement la lecture et confirme tardivement sans refaire la mutation',async()=>{
    const commit=deferred();sdk.commit.mockReturnValue(commit.promise);FirestoreRepo.put('transactions','TX-1',{id:'TX-1',amount:100});
    await expect(FirestoreRepo.waitForDocument('transactions','TX-1',5)).rejects.toMatchObject({status:'pending'});commit.resolve();
    await expect(FirestoreRepo.waitForDocument('transactions','TX-1')).resolves.toMatchObject({id:'TX-1'});expect(sdk.commit).toHaveBeenCalledOnce();
  });
  it('refuse un document dont le chemin, l’identifiant ou le montant ne correspond pas',async()=>{
    sdk.read.mockResolvedValueOnce(snapshot('TX-other')).mockResolvedValueOnce(snapshot('TX-1',{id:'TX-other'})).mockResolvedValueOnce(snapshot('TX-1',{id:'TX-1',amount:999}));
    for(let i=0;i<3;i++)await expect(FirestoreRepo.waitForDocument<any>('transactions','TX-1',1000,value=>value.amount===100)).rejects.toMatchObject({status:'conflict'});
  });
  it('un succès de commit avec un document encore local ne suffit pas pour confirmer',async()=>{
    sdk.read.mockResolvedValue(snapshot('TX-1',{id:'TX-1'},{hasPendingWrites:true,fromCache:false}));FirestoreRepo.put('transactions','TX-1',{id:'TX-1'});
    await expect(FirestoreRepo.waitForDocument('transactions','TX-1')).rejects.toMatchObject({status:'pending'});
  });
  it('le rejet tardif d’une version antérieure ne remplace pas le statut de sa nouvelle écriture',async()=>{
    const older=deferred();sdk.commit.mockReturnValueOnce(older.promise);FirestoreRepo.put('transactions','TX-1',{id:'TX-1',amount:1});await Promise.resolve();
    FirestoreRepo.put('transactions','TX-1',{id:'TX-1',amount:100});await Promise.resolve();await Promise.resolve();older.reject({code:'permission-denied',message:'Ancienne version refusée'});
    await FirestoreRepo.waitForDocument('transactions','TX-1');expect(FirestoreRepo.documentWriteState('transactions','TX-1').status).toBe('confirmed');
  });
});
