import { connectFirestoreEmulator, disableNetwork, enableNetwork, getDocFromServer, setDoc, doc } from 'firebase/firestore';
import { db } from '../../src/services/firebase';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
const email = import.meta.env.VITE_AUTHORIZED_ACCOUNTS.split(',')[0].trim().toLowerCase();
export function initialize() {
  if (db.app.options.projectId !== 'demo-backend-audit') throw new Error('Isolated project required');
  connectFirestoreEmulator(db, '127.0.0.1', 8080, { mockUserToken: { sub: 'test-brewer', email, email_verified: true } });
  FirestoreRepo.startSync();
}
export const ready = () => FirestoreRepo.isReady();
export const status = () => FirestoreRepo.syncStatus();
export const offline = () => disableNetwork(db);
export const online = () => enableNetwork(db);
export const put = (name: any, id: string, data: any) => FirestoreRepo.put(name, id, data);
export const remove = (name: any, id: string) => FirestoreRepo.remove(name, id);
export const wait = () => FirestoreRepo.waitForWrites(8000);
export const waitLot = (id: string) => FirestoreRepo.waitForDocument('batches', id, 8000);
export const read = (name: any, id: string) => FirestoreRepo.all<any>(name).find(d => d.__docId === id);
export async function serverRead(name: string, id: string) { return (await getDocFromServer(doc(db, name, id))).data(); }
export const seedManaged = () => setDoc(doc(db, 'batches', 'PROTECTED'), { id: 'PROTECTED', volumeL: 24, og: '1.050',
  recipeSnapshot: { oldField: true, name: 'Original' }, brewDay: { revision: 8, readings: [{ value: 67 }] } });
