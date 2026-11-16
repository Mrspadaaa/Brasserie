import { describe, expect, it } from 'vitest';
import type { Batch, Client, KegItem, Transaction } from '../../src/types';
import {
  futApresGeste, lignesDesLiens, liensDuBrassin, liensDuClient, liensDuFut, resumeLiens, type DonneesLiens
} from '../../src/domain/suppressionLiee';

const fut = (o: Partial<KegItem> = {}): KegItem => ({ id: 'F-07', capacityL: 30, state: 'lavage', ...o });
const lot = (o: Partial<Batch> = {}): Batch => ({ id: 'L-014', name: 'Blanche d’hiver', status: 'conditionne', ...o } as Batch);
const client = (o: Partial<Client> = {}): Client => ({ id: 'CL-1', name: 'Café du Pont', type: 'Pro', contact: '', phone: '', email: '', ...o });
const vente = (o: Record<string, unknown> = {}) => ({ id: 'V1', date: '10.11.2026', description: 'Vente Café du Pont', category: 'recettes', amountHT: 120, amountTTC: 120, tvaRate: 0, finance: { version: 1, kind: 'income', amountCents: 12000, lines: [], ...(o.finance as object) }, ...o, }) as unknown as Transaction;
const donnees = (o: Partial<DonneesLiens> = {}): DonneesLiens => ({ kegs: [], batches: [], clients: [], transactions: [], ...o });

describe('suppression d’une chose liée : les liens', () => {
  it('un fût vide en cave n’a aucun lien : suppression directe', () => {
    expect(liensDuFut(fut(), donnees({ kegs: [fut()] }))).toEqual([]);
    expect(liensDuFut(fut(), donnees())).toEqual([]);
  });

  it('un fût plein chez un client : le client puis le lot, chacun avec son geste', () => {
    const k = fut({ state: 'livre', batchRef: 'L-014', beerName: 'Blanche d’hiver', clientId: 'CL-1', clientName: 'Café du Pont', deliveryDate: '02.11.2026' });
    const liens = liensDuFut(k, donnees({ kegs: [k] }));
    expect(liens.map((l) => [l.id, l.genre, l.geste?.libelle])).toEqual([['client:F-07', 'client', 'Rentré'], ['lot:F-07', 'brassin', 'Vidé']]);
    expect(liens[0].detail).toBe('l’a chez lui depuis le 02.11');
    expect(liens[1].nom).toBe('L-014 · Blanche d’hiver');
    expect(liens[1].detail).toBe('fût de 30 L, plein');
  });

  it('une date de livraison absente est dite, pas devinée', () => {
    const k = fut({ state: 'livre', clientName: 'Bar La Cave' });
    expect(liensDuFut(k, donnees({ kegs: [k] }))[0].detail).toMatch(/date de livraison non enregistrée/);
  });

  it('un fût plein en cave : un seul lien, le lot', () => {
    const k = fut({ state: 'plein', batchRef: 'L-014', beerName: 'Blanche' });
    expect(liensDuFut(k, donnees({ kegs: [k] })).map((l) => l.genre)).toEqual(['brassin']);
  });

  it('un brassin : ses fûts pleins ou livrés, ses bouteilles (cadenas), ses écritures (cadenas) ; les fûts vides et les écritures annulées ne comptent pas', () => {
    const b = lot({ packaging: { bottles33: 48, bottles75: 0, kegIds: ['F-07'] }, volumePackagedL: 60 });
    const kegs = [
      fut({ id: 'F-07', state: 'livre', batchRef: 'L-014', clientName: 'Café du Pont' }),
      fut({ id: 'F-12', state: 'plein', batchRef: 'L-014', capacityL: 20 }),
      fut({ id: 'F-19', state: 'lavage', batchRef: 'L-014' }),
      fut({ id: 'F-20', state: 'plein', batchRef: 'L-099' })
    ];
    const transactions = [vente({ finance: { batchId: 'L-014', invoiceNumber: '2025-118' } }), vente({ id: 'V2', finance: { batchId: 'L-014', voidedAt: '2026-11-10' } })];
    const liens = liensDuBrassin(b, donnees({ batches: [b], kegs, transactions, litresVendus: () => 12.4 }));
    expect(liens.map((l) => l.id)).toEqual(['fut:F-07', 'fut:F-12', 'stock', 'compta']);
    expect(liens[0].detail).toBe('plein, chez Café du Pont');
    expect(liens[1].detail).toBe('plein, en cave');
    expect(liens[2].nom).toBe('48 bouteilles 33 cl');
    expect(liens[2].geste).toBeUndefined();
    expect(liens[2].detail).toMatch(/47,6 L pas passés en caisse/);
    expect(liens[3].nom).toBe('1 écriture dans les comptes');
    expect(liens[3].detail).toBe('2025-118');
  });

  it('un brassin sans conditionnement ni écriture n’a pas de lien ; le reste à vendre inconnu n’est jamais 0', () => {
    const b = lot({ status: 'planifie' });
    expect(liensDuBrassin(b, donnees({ batches: [b] }))).toEqual([]);
    const c = lot({ packaging: { bottles33: 10, bottles75: 2, kegIds: [] } });
    const [stock] = liensDuBrassin(c, donnees({ batches: [c] }));
    expect(stock.nom).toBe('10 bouteilles 33 cl + 2 bouteilles 75 cl');
    expect(stock.detail).toMatch(/l’app ne le sait pas/);
  });

  it('un client : ses fûts livrés (par identifiant, ou par nom à défaut) et ses ventes non annulées', () => {
    const c = client();
    const kegs = [
      fut({ id: 'F-07', state: 'livre', clientId: 'CL-1', clientName: 'Café du Pont', deliveryDate: '02.11.2026' }),
      fut({ id: 'F-03', state: 'livre', clientName: 'café du pont' }),
      fut({ id: 'F-09', state: 'livre', clientId: 'CL-2', clientName: 'Bar La Cave' }),
      fut({ id: 'F-21', state: 'propre' })
    ];
    const liens = liensDuClient(c, donnees({ clients: [c], kegs, transactions: [vente(), vente({ id: 'V2', finance: { voidedAt: '2026-11-10' } })] }));
    expect(liens.map((l) => l.id)).toEqual(['fut:F-07', 'fut:F-03', 'ventes']);
    expect(liens[2].nom).toMatch(/^1 vente · 120/);
    expect(liens[2].garde).toBe('reste dans les comptes');
  });

  it('un client sans fût dehors ni vente se supprime directement', () => {
    const c = client({ name: 'Marché de Noël Sion' });
    expect(liensDuClient(c, donnees({ clients: [c], transactions: [vente()] }))).toEqual([]);
  });
});

describe('suppression d’une chose liée : régler, compter, allumer Supprimer', () => {
  it('le compteur descend à chaque lien réglé ; un lien sans geste verrouille Supprimer', () => {
    const k = fut({ id: 'F-07', state: 'livre', batchRef: 'L-014', clientName: 'Café du Pont' });
    const initiaux = liensDuFut(k, donnees({ kegs: [k] }));
    expect(resumeLiens(lignesDesLiens(initiaux, initiaux))).toMatchObject({ restants: 2, libre: false, verrous: [] });

    const rentre = futApresGeste(k, 'rentre', '16.11.2026');
    const apresRentre = liensDuFut(k, donnees({ kegs: [rentre] }));
    const lignes = lignesDesLiens(initiaux, apresRentre);
    expect(lignes.map((l) => l.regle)).toEqual([true, false]);
    expect(resumeLiens(lignes).restants).toBe(1);

    const vide = futApresGeste(rentre, 'vide', '16.11.2026', 'Vendus');
    const fin = resumeLiens(lignesDesLiens(initiaux, liensDuFut(k, donnees({ kegs: [vide] }))));
    expect(fin).toMatchObject({ restants: 0, libre: true });

    const b = lot({ packaging: { bottles33: 48, bottles75: 0, kegIds: [] } });
    const lb = liensDuBrassin(b, donnees({ batches: [b] }));
    const r = resumeLiens(lignesDesLiens(lb, lb));
    expect(r.libre).toBe(false);
    expect(r.verrous.map((l) => l.id)).toEqual(['stock']);
  });

  it('« Vidé vaut pour les deux liens » : un fût livré vidé règle le client et le lot ensemble', () => {
    const k = fut({ id: 'F-07', state: 'livre', batchRef: 'L-014', clientName: 'Café du Pont' });
    const initiaux = liensDuFut(k, donnees({ kegs: [k] }));
    const vide = futApresGeste(k, 'vide', '16.11.2026');
    expect(resumeLiens(lignesDesLiens(initiaux, liensDuFut(k, donnees({ kegs: [vide] }))))).toMatchObject({ restants: 0, libre: true });
  });

  it('les gestes écrivent un fût juste, avec leur étape', () => {
    const k = fut({ state: 'livre', batchRef: 'L-014', beerName: 'Blanche', style: 'Blanche', fillDate: '28.10.2026', clientId: 'CL-1', clientName: 'Café du Pont', deliveryDate: '02.11.2026' });
    const rentre = futApresGeste(k, 'rentre', '16.11.2026');
    expect(rentre).toMatchObject({ state: 'plein', batchRef: 'L-014', beerName: 'Blanche' });
    expect(rentre.clientName).toBeUndefined();
    expect(rentre.historique?.at(-1)).toMatchObject({ quoi: 'retour-plein', date: '16.11.2026' });
    const vide = futApresGeste(rentre, 'vide', '16.11.2026', 'Perdus, versés');
    expect(vide.state).toBe('lavage');
    expect(vide.batchRef).toBeUndefined();
    expect(vide.beerName).toBeUndefined();
    expect(vide.historique?.at(-1)).toMatchObject({ quoi: 'a-laver', detail: 'vidé · perdus, versés' });
  });
});
