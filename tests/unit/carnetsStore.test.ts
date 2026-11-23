import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { fixtureCarnets, ID_EVIER } from '../../src/domain/carnets/fixture';
import { renommer, supprimerCarnet } from '../../src/domain/carnets/operations';
import { magasinMemoire, magasinSur, type PortFirestore } from '../../src/services/carnetsStore';
import type { CreativeItem } from '../../src/types';

describe('magasin mémoire', () => {
  it('lit les documents du carnet seulement, triés ; prévient à chaque écriture ; refuse un autre type', () => {
    const autre: CreativeItem = { id: 'A-0', type: 'recipe-idea', title: 'NEIPA', status: 'idea' };
    const m = magasinMemoire([...fixtureCarnets(), autre]);
    expect(m.lire().some(i => i.id === 'A-0')).toBe(false);
    expect(m.lire().map(i => i.id)).toEqual([...m.lire().map(i => i.id)].sort());
    const rappel = vi.fn();
    const fin = m.ecouter(rappel);
    const r = renommer(m.lire(), { carnetId: ID_EVIER, titre: 'Évier 2 bacs' });
    if (!r.ok) throw new Error(r.raison);
    m.appliquer(r.ecritures);
    expect(rappel).toHaveBeenCalledTimes(1);
    fin();
    m.appliquer(r.inverse);
    expect(rappel).toHaveBeenCalledTimes(1);
    expect(() => m.appliquer([{ op: 'put', doc: autre }])).toThrow();
  });
});

describe('magasin Firestore (port injecté)', () => {
  const port = (docs: CreativeItem[]) => {
    const p: PortFirestore & { poses: string[]; retires: string[]; journal: unknown[] } = {
      poses: [], retires: [], journal: [],
      tous: () => docs,
      poser(id) { this.poses.push(id); },
      retirer(id) { this.retires.push(id); },
      sAbonner: () => () => undefined,
      journaliser(j) { this.journal.push(j); }
    };
    return p;
  };
  it('écrit document par document ; journalise la suppression', () => {
    const docs = fixtureCarnets();
    const p = port([...docs, { id: 'A-0', type: 'event', title: 'fête', status: 'todo' }]);
    const m = magasinSur(p);
    expect(m.lire()).toHaveLength(docs.length);
    const s = supprimerCarnet(m.lire(), { carnetId: ID_EVIER, plans: [] });
    if (!s.ok) throw new Error(s.raison);
    m.appliquer(s.ecritures, s.journal);
    /* tour 3, PCN-167 : son message (qui ne visait que lui) part avec lui, document par document */
    expect(p.retires).toEqual([ID_EVIER, 'ZZ-MSG-E1']);
    expect(p.poses).toEqual([]);
    expect(p.journal).toEqual([{ action: 'Suppression', entityId: ID_EVIER, resume: 'Carnet d\'idées supprimé : ZZ TEST — Évier inox' }]);
  });
});

describe('A7 : jamais la réécriture de toute la liste', () => {
  it('carnetsStore.ts n’appelle ni saveCreativeItems ni syncCollection', () => {
    const source = readFileSync(join(process.cwd(), 'src/services/carnetsStore.ts'), 'utf8');
    expect(source).not.toMatch(/saveCreativeItems|syncCollection/);
    expect(source).toMatch(/FirestoreRepo\.put\('creativeItems'/);
    expect(source).toMatch(/FirestoreRepo\.remove\('creativeItems'/);
  });
});
