// VI-4 (rejeu b47cd90b n° 4) : « Citra BBC · α 12,3 % · amérisant » dans la liste d'ajout. Citra est un houblon d'arôme (la ligne au-dessus le dit).
// Cause : la règle rôle-α v1 (roles.ts) lit « α ≥ 10 % sans famille marquée » comme « amérisant ». Or « sans famille marquée » veut aussi dire
// « aucune fiche d'arôme » (Citra BBC, une seule source, α seul) : l'absence de données devenait un rôle. L14 / role-continu : « une donnée absente
// laisse le houblon au milieu ; l'inconnu ne recule pas ». Sans arôme documenté, un α ≥ 10 % est « double », jamais « amérisant ».
import { beforeAll, describe, expect, it } from 'vitest';
import { chargerCataloguePlein, DONNEES_FIXTURE, type CatalogueHop } from '../../../src/domain/hopIndex/v4/data';
import { creerMoteur, type Moteur } from '../../../src/domain/hopIndex/v4/moteur';
import { hopRole, roleFromAlpha } from '../../../src/domain/hopIndex/v4/roles';
import { describeFamilies } from '../../../src/domain/hopIndex/v4/hops';
import { FAMILIES } from '../../../src/domain/hopIndex/v4/families';

let plein: CatalogueHop[];
let moteur: Moteur;
beforeAll(async () => {
  plein = await chargerCataloguePlein();
  moteur = creerMoteur({ catalogue: plein, stock: DONNEES_FIXTURE.stock });
}, 60000);
const role = (cle: string) => moteur.dans(() => hopRole(cle));

describe('la règle rôle-α v1 (pure)', () => {
  it('α ≥ 10 % : amérisant seulement si l’arôme est documenté et sans famille marquée', () => {
    expect(roleFromAlpha(12.3, false, true)).toBe('amérisant');
    expect(roleFromAlpha(12.3, true, true)).toBe('double');
    expect(roleFromAlpha(12.3, false, false)).toBe('double');
  });
  it('les autres seuils ne bougent pas, et sans 3e argument la règle d’avant reste (substitutionV2)', () => {
    expect(roleFromAlpha(12.3, false)).toBe('amérisant');
    expect(roleFromAlpha(5, false, false)).toBe('aromatique');
    expect(roleFromAlpha(8, false, false)).toBe('double');
  });
});

describe('le catalogue, confronté aux houblons phares (L14)', () => {
  it('Citra BBC (α 12,3 %, aucune fiche d’arôme) n’est plus « amérisant » : double, et la source le dit', () => {
    const r = role('sources-citra-bbc');
    expect(r.value).toBe('double');
    expect(r.source).toMatch(/règle/);
  });
  it('Citra reste aromatique ; Magnum et Warrior (α 13 à 16 %, arôme documenté) ne passent pas aromatiques : leur rôle ne change pas (double par la règle)', () => {
    expect(role('beermaverick-citra').value).toBe('aromatique');
    expect(role('beermaverick-magnum-gr').value).toBe('double');
    expect(role('beermaverick-warrior').value).toBe('double');
  });
  it('aucun houblon d’arôme de référence n’est « amérisant »', () => {
    for (const k of ['citra', 'mosaic', 'simcoe', 'galaxy', 'nelson-sauvin', 'idaho-7', 'amarillo', 'cascade']) {
      const v = role(`beermaverick-${k}`).value;
      expect(v, `${k} : rôle connu`).not.toBeNull();
      expect(v, k).not.toBe('amérisant');
    }
  });
  it('partout : « amérisant » par la règle exige un arôme documenté (aucun amérisant fait d’absence de données)', () => {
    const faux: string[] = [];
    for (const h of plein) {
      const r = role(h.id);
      if (r.value !== 'amérisant' || !r.source.startsWith('règle')) continue;
      const desc = moteur.dans(() => describeFamilies(h.id));
      if (!FAMILIES.some((f) => desc[f].level !== 'non décrit')) faux.push(h.name);
    }
    expect(faux).toEqual([]);
  });
});
