// Voie d2-import-bm (#180) : les champs ajoutés au catalogue (cohumulone, farnésène, autres huiles, usage, bloc bm) ne bougent
// aucun résultat du moteur. Les empreintes ci-dessous ont été calculées AVANT l'import, sur le proto-data.json de HEAD (532f96df) ;
// elles couvrent les données lues par le moteur, le profil des 318 houblons et le classement des substituts de 12 houblons.
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { CATALOGUE, engineData } from '../../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';

const sha = (x: unknown) => createHash('sha256').update(JSON.stringify(x)).digest('hex');
const ATTENDU = {
  donneesMoteur: 'aa55e06166f93beeb202b82edb55800e942d06c35e4d2af8db7f7aeaa5f7d32d',
  profils: 'fe77eb818d7d587daca0657a99bb58e20b27ff362c07682e6ecc7e9369fe88b0',
  substituts: 'f3754c80744a017e8da8239476ba5e06c105f9a49bb226550e97cd4a85d61b66',
};
const PHARES = ['citra', 'mosaic', 'nelson-sauvin', 'galaxy', 'motueka', 'idaho-7', 'cascade', 'saaz-cz', 'nugget', 'lotus', 'simcoe', 'east-kent-goldings'].map((s) => `beermaverick-${s}`);

describe('le moteur rend les mêmes résultats qu\'avant l\'import', () => {
  const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
  it('les données que le moteur lit (variétés) sont inchangées', () => {
    expect(sha(m.dans(() => engineData().varieties))).toBe(ATTENDU.donneesMoteur);
  });
  it('le profil de chacun des 318 houblons est inchangé', () => {
    expect(sha(CATALOGUE.map((h) => m.hopProfile(h.id)))).toBe(ATTENDU.profils);
  });
  it('le classement des substituts de 12 houblons est inchangé', () => {
    expect(sha(PHARES.map((k) => m.substitutes(k)))).toBe(ATTENDU.substituts);
  });
});
