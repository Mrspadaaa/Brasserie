// Voie r180-pack : le pack Beer Maverick est installé par le bouton « Sources et modèles » (HopKnowledgePanel.installPack),
// qui envoie chaque clé du pack comme une collection à la validation de sauvegarde (functions/src/backupCore.ts).
// d2 y avait ajouté une clé étrangère (hopBeerMaverickFiches) : « Collection invalide » en production. Les fiches vivent à part.
import { describe, expect, it } from 'vitest';
import pack from '../../../src/data/hopBeerMaverickBootstrap.json';
import fiches from '../../../src/data/hopBeerMaverickFiches.json';
import { parseBackup } from '../../../functions/src/backupCore';

// Même assemblage que HopKnowledgePanel.installPack : une collection par clé, un document par ligne.
const sauvegarde = (p: Record<string, { id: string }[]>) => JSON.stringify({
  schemaVersion: 3, source: 'device', exportedAt: '2026-10-26T10:00:00Z',
  collections: Object.fromEntries(Object.entries(p).filter(([, rows]) => rows.length).map(([nom, rows]) => [nom, rows.map((data) => ({ id: data.id, data }))])),
});

describe('pack Beer Maverick installable', () => {
  it('passe la validation de l\'installation (aucune collection étrangère)', () => {
    expect(() => parseBackup(sauvegarde(pack as unknown as Record<string, { id: string }[]>))).not.toThrow();
  });
  it('ne contient que les cinq collections d\'un pack, comme avant d2', () => {
    expect(Object.keys(pack).sort()).toEqual(['hopKnowledge', 'hopLots', 'hopPredictions', 'hopTastings', 'hopVarieties']);
  });
  it('les 318 dossiers étendus vivent dans leur fichier, un par variété du pack, même ordre', () => {
    expect(fiches).toHaveLength(318);
    expect(fiches.map((f) => f.id)).toEqual(pack.hopVarieties.map((v) => v.id));
  });
});
