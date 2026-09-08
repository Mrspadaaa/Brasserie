import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hopTestLot, hopTestVariety } from '../fixtures/hopIndex';
import { parseBackup } from '../../functions/src/backupCore';
import { publicHopData } from '../fixtures/hopPublicPacks';
import researchNotes from '../../src/data/hopResearchBootstrap.json';
const memory = vi.hoisted(() => ({ docs: new Map<string, any>(), writes: vi.fn() }));
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: {
  all: (name: string) => [...memory.docs.entries()].filter(([key]) => key.startsWith(name + '/')).map(([key, value]) => ({ ...structuredClone(value), __docId: key.split('/')[1] })),
  put: (name: string, id: string, value: any) => { memory.writes(name, id, value); memory.docs.set(`${name}/${id}`, structuredClone(value)); },
  bulkWrite: async (entries: any[]) => { for (const { name, id, data } of entries) { memory.writes(name, id, data); memory.docs.set(`${name}/${id}`, structuredClone(data)); } }
} }));
import { StorageService } from '../../src/services/storage';
beforeEach(() => { memory.docs.clear(); memory.writes.mockClear(); });
const backup = (varieties: any[], lots: any[] = []) => JSON.stringify({ schemaVersion: 3, source: 'device', exportedAt: '2026-09-08T00:00:00.000Z',
  collections: { hopVarieties: varieties.map(data => ({ id: data.id, data })), hopLots: lots.map(data => ({ id: data.id, data })) } });

describe('Persistance du référentiel houblon', () => {
  it('accepte un pack actualisé sans redéploiement, avec la même validation et sans réécriture au rejeu', async () => {
    const pack = { hopVarieties: [hopTestVariety()] };
    expect(await StorageService.importHopIndex(JSON.stringify(pack))).toBe(1);
    pack.hopVarieties[0].name = 'Référence actualisée';
    expect(await StorageService.importHopIndex(JSON.stringify(pack))).toBe(1);
    memory.writes.mockClear(); expect(await StorageService.importHopIndex(JSON.stringify(pack))).toBe(0);
    expect(memory.writes).not.toHaveBeenCalled();
    expect(await StorageService.importHopIndex(JSON.stringify(researchNotes))).toBe(researchNotes.length);
    expect(StorageService.getHopKnowledge().filter(k => k.kind === 'note')).toHaveLength(researchNotes.length);
    await expect(StorageService.importHopIndex(JSON.stringify({ hopVarieties: [{ id: 'incorrect' }] }))).rejects.toThrow();
  });
  it('restaure plus de 450 références et rejoue sans écriture, avec validation du dernier document avant envoi', async () => {
    const varieties = publicHopData().varieties;
    const invalid = structuredClone(varieties); const last = invalid[invalid.length - 1]; (last.analysis[0]?.source ?? last.descriptions[0].source).reference = '';
    await expect(StorageService.importHopIndex(backup(invalid))).rejects.toThrow();
    expect(memory.writes).not.toHaveBeenCalled();
    expect(await StorageService.importHopIndex(backup(varieties))).toBe(766);
    const exported = StorageService.exportHopIndex();
    expect(parseBackup(exported).collections.hopVarieties).toHaveLength(766);
    memory.writes.mockClear();
    expect(await StorageService.importHopIndex(exported)).toBe(0);
    expect(memory.writes).not.toHaveBeenCalled();
  });
  it('conserve la provenance géographique, la récolte et le stockage du lot au retour de sauvegarde', async () => {
    const lot = hopTestLot({ harvestYear: 2025, growingRegion: 'Région témoin', grower: 'Producteur de test', storageNotes: 'Conditionnement documenté dans le COA de test' });
    StorageService.saveHopVariety(hopTestVariety()); StorageService.saveHopLot(lot);
    const exported = StorageService.exportHopIndex(); memory.docs.clear(); await StorageService.importHopIndex(exported);
    expect(StorageService.getHopLots()).toEqual([lot]);
  });
  it('importe les échantillons publiés sans les confondre avec des lots de stock et rejoue sans écriture', async () => {
    const { publicHopPacks } = await import('../fixtures/hopPublicPacks');
    const raw = JSON.stringify(publicHopPacks.publicLots);
    expect(await StorageService.importHopIndex(raw)).toBe(16);
    expect(StorageService.getHopLots().every(l => l.referenceOnly && !l.stockItemRef)).toBe(true);
    memory.writes.mockClear(); expect(await StorageService.importHopIndex(raw)).toBe(0); expect(memory.writes).not.toHaveBeenCalled();
    const exported = StorageService.exportHopIndex(); memory.docs.clear(); await StorageService.importHopIndex(exported);
    expect(StorageService.getHopLots()).toEqual(publicHopPacks.publicLots.hopLots);
  });
  it('conserve un COA partiel et toutes ses sources à l’export/restauration', async () => {
    StorageService.saveHopVariety(hopTestVariety()); StorageService.saveHopLot(hopTestLot());
    const exported = StorageService.exportHopIndex();
    expect(parseBackup(exported).collections.hopLots?.[0].data.analysis).toHaveLength(1);
    memory.docs.clear(); await StorageService.importHopIndex(exported);
    expect(StorageService.getHopVarieties()).toEqual([hopTestVariety()]);
    expect(StorageService.getHopLots()).toEqual([hopTestLot()]);
  });
  it('un réimport identique et une sauvegarde inchangée ne réécrivent rien', async () => {
    const data = backup([hopTestVariety()], [hopTestLot()]);
    expect(await StorageService.importHopIndex(data)).toBe(2);
    memory.writes.mockClear();
    expect(await StorageService.importHopIndex(data)).toBe(0);
    StorageService.saveHopVariety(hopTestVariety()); StorageService.saveHopLot(hopTestLot());
    expect(memory.writes).not.toHaveBeenCalled();
  });
  it('un import partiel préserve les fiches absentes et un renommage conserve l’identité', async () => {
    StorageService.saveHopVariety(hopTestVariety({ id: 'other', name: 'Autre' }));
    await StorageService.importHopIndex(backup([hopTestVariety()]));
    StorageService.saveHopVariety(hopTestVariety({ name: 'Nouveau nom' }));
    expect(StorageService.getHopVarieties().map(v => v.name)).toEqual(['Autre', 'Nouveau nom']);
  });
  it('rejette une erreur tardive avant la première écriture', async () => {
    const invalid = hopTestVariety({ id: 'bad', analysis: [{ ...hopTestVariety().analysis[0], source: undefined! }] });
    await expect(StorageService.importHopIndex(backup([hopTestVariety(), invalid]))).rejects.toThrow();
    expect(memory.writes).not.toHaveBeenCalled();
  });
  it('la restauration générale contrôle aussi les identités et mesures de houblon', async () => {
    const raw = JSON.parse(backup([hopTestVariety()]));
    raw.collections.hopVarieties[0].data.id = 'different';
    expect(() => parseBackup(JSON.stringify(raw))).toThrow(/Identité/);
    await expect(StorageService.importHopIndex(JSON.stringify({ ...raw, collections: { config: [{ id: 'app', data: { name: 'x' } }] } }))).rejects.toThrow(/seulement/);
  });
});
