// Banc visuel « Qui a reçu ce lot » : la vraie fiche du brassin (BatchDetailSheet), les vrais styles, des fûts et clients SIMULÉS (« exemple »).
// Les gestes écrivent dans une mémoire du banc (jamais de donnée réelle) ; thème par ?theme=cave, lot en cuve par ?etat=cuve.
import React from 'react';
import { createRoot } from 'react-dom/client';
import type { Batch, Client, KegItem } from '../../src/types';
import { StorageService } from '../../src/services/storage';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';
import '../../src/index.css';

const q = new URLSearchParams(location.search);
const rempli = { date: '02.11.2026', quoi: 'rempli' as const, detail: 'Blonde d’automne LOT-028' };
const clients: Client[] = [
  { id: 'CL-1', name: 'Café du Pont', type: 'Pro', contact: 'Mme Rochat', phone: '079 412 33 05', email: '' },
  { id: 'CL-2', name: 'La Cave à Jules', type: 'Pro', contact: 'Jules Perret', phone: '078 655 20 14', email: '' },
  { id: 'CL-3', name: 'Bar Le Tilleul', type: 'Pro', contact: 'Nadia Berset', phone: '076 301 88 42', email: '' },
  { id: 'CL-4', name: 'Fête de Corcelles', type: 'Privé', contact: 'P. Jaquet, société de jeunesse', phone: '', email: '' }
];
const livre = (id: string, cl: Client, jour: string): KegItem => ({ id, capacityL: 20, state: 'livre', batchRef: 'LOT-028', beerName: 'Blonde d’automne', clientId: cl.id, clientName: cl.name, deliveryDate: `${jour}.2026`,
  historique: [rempli, { date: `${jour}.2026`, quoi: 'livre', detail: cl.name }] });
const cuve = q.get('etat') === 'cuve';
let kegs: KegItem[] = cuve ? [] : [
  { ...livre('F-22', clients[0], '11.11'), historique: [rempli, { date: '04.11.2026', quoi: 'livre', detail: 'Café du Pont' }, { date: '09.11.2026', quoi: 'retour-vide', detail: 'Café du Pont' },
    { date: '10.11.2026', quoi: 'lave' }, { ...rempli, date: '10.11.2026' }, { date: '11.11.2026', quoi: 'livre', detail: 'Café du Pont' }] },
  livre('F-24', clients[1], '06.11'), livre('F-25', clients[2], '14.11'),
  { id: 'F-26', capacityL: 20, state: 'plein', batchRef: 'LOT-028', historique: [rempli, { date: '08.11.2026', quoi: 'livre', detail: 'Fête de Corcelles' }, { date: '10.11.2026', quoi: 'retour-plein', detail: 'Fête de Corcelles' }] },
  { id: 'F-27', capacityL: 20, state: 'plein', batchRef: 'LOT-028', historique: [rempli] }
];
const ecouteurs = new Set<() => void>();
const S = StorageService as unknown as Record<string, unknown>;
S.getStocks = () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs });
S.getClients = () => clients;
S.getTransactions = () => [];
S.getBatches = () => [];
S.subscribe = (cb: () => void) => { ecouteurs.add(cb); return () => { ecouteurs.delete(cb); }; };
S.updateKeg = (k: KegItem) => { kegs = kegs.map((x) => (x.id === k.id ? k : x)); ecouteurs.forEach((cb) => cb()); };
S.updateBatch = () => undefined;

const batch: Batch = {
  id: 'LOT-028', name: 'Blonde d’automne', style: 'Blonde', volumeL: 100, status: cuve ? 'garde' : 'conditionne', brewDate: '12.10.2026', bottlingDate: cuve ? undefined : '02.11.2026',
  og: '1.046', fg: '1.010', abv: '4.8', packaging: cuve ? undefined : { bottles33: 48, bottles75: 0, kegIds: ['F-22', 'F-24', 'F-25', 'F-26', 'F-27'] }
};
document.documentElement.dataset.theme = q.get('theme') === 'cave' ? 'cave' : 'clair';
createRoot(document.getElementById('root')!).render(<BatchDetailSheet batch={batch} onClose={() => undefined} />);
