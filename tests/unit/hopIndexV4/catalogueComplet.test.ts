// Voie c6-catalogue-complet (26.10, D98, #187) : toutes les variétés attestées par au moins une source sont au catalogue, et les noms se rattachent bien.
// - alias : « Equinox » est Ekuanot (un seul identifiant), « Cascade CHE » se rattache à Cascade avec son origine non répertoriée ;
// - Krush, Elani, Superdelic sont au catalogue complet, avec ce que leurs sources publient (jamais 0 pour un inconnu) ;
// - une variété `peuDeDonnees` ne passe jamais devant une variété documentée à égalité (D175) ;
// - le démarrage ne grossit pas : les variétés ajoutées vivent dans un fichier chargé à la demande.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { indexer, lireTable, resoudreNom, verifierTable } from '../../../src/data/hopV4/rattachement.mjs';
import protoData from '../../../src/data/hopV4/proto-data.json';
import brutAjouts from '../../../src/data/hopV4/catalogue-ajouts.json';
import brutComplements from '../../../src/data/hopV4/complements.json';
import { ajoutsDejaCharges, CATALOGUE, chargerAjouts, chargerCataloguePlein, hopRef, ID_FUSIONNES, type CatalogueHop } from '../../../src/domain/hopIndex/v4/data';
import { varieteDe } from '../../../src/domain/hopIndex/v4/donneesApp';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import type { ComplementsBrut } from '../../../src/domain/hopIndex/v4/complements';

const racine = resolve(__dirname, '../../..');
const table = lireTable();
const base = CATALOGUE.map((v) => ({ id: v.id, name: v.name, aliases: v.aliases, origin: v.origin }));
const index = indexer(base);
const C = brutComplements as unknown as ComplementsBrut;

describe('la table d\'alias', () => {
  it('ne pointe que vers des variétés du catalogue', () => {
    expect(verifierTable(table, index)).toEqual([]);
  });
  it('Equinox est Ekuanot : un seul identifiant, « Equinox » en alias, l\'ancien identifiant reste valide', () => {
    expect(CATALOGUE.some((v) => v.id === 'beermaverick-equinox')).toBe(false);
    const ekuanot = CATALOGUE.find((v) => v.id === 'beermaverick-ekuanot')!;
    expect(ekuanot.aliases).toContain('Equinox');
    expect(ID_FUSIONNES['beermaverick-equinox']).toBe('beermaverick-ekuanot');
    expect(hopRef('beermaverick-equinox')?.catalogue.id).toBe('beermaverick-ekuanot');
    // Le stock qui s'appelle « Equinox » retrouve Ekuanot par l'alias.
    const v = varieteDe('Houblon Equinox 14.5%', CATALOGUE);
    expect('h' in v && v.h.id).toBe('beermaverick-ekuanot');
    // Un seul identifiant dans les compléments : les fiches d'Equinox (Hopslist) sont chez Ekuanot.
    expect(C.varietes['beermaverick-equinox']).toBeUndefined();
    expect(C.varietes['beermaverick-ekuanot'].f.length).toBeGreaterThan(4);
  });
  it('« Cascade CHE » se rattache à Cascade, avec l\'origine lue (Suisse) : l\'écran mettra un astérisque', () => {
    for (const nom of ['Cascade CHE', 'Cascade (CH)', 'CHE Cascade']) {
      const r = resoudreNom(nom, index, table);
      expect(r.id, nom).toBe('beermaverick-cascade');
      expect(r.origineNonRepertoriee, nom).toBe('Suisse');
    }
    const nz = resoudreNom('NZ Cascade', index, table);
    expect(nz).toMatchObject({ id: 'beermaverick-cascade', origineNonRepertoriee: 'Nouvelle-Zélande' });
    expect(resoudreNom('Cascade (UK)', index, table)).toMatchObject({ id: 'beermaverick-cascade', origineNonRepertoriee: 'Royaume-Uni' });
    // L'origine du catalogue n'est pas une origine non répertoriée.
    expect(resoudreNom('Cascade (US)', index, table).origineNonRepertoriee).toBeUndefined();
    expect(resoudreNom('Cascade', index, table).origineNonRepertoriee).toBeUndefined();
  });
  it('les fiches d\'une origine non répertoriée sont dans les compléments de Cascade, hors de l\'enveloppe, avec l\'origine lue', () => {
    const v = C.varietes['beermaverick-cascade'];
    const origines = v.f.map((f, i) => [i, (f as unknown as [number, string | null, number | null, string?])[3]] as const).filter(([, o]) => o);
    expect(origines.length).toBeGreaterThan(0);
    const indexOrigine = new Set(origines.map(([i]) => i));
    expect(C.raisons['h-origine'][0]).toBe('hors');
    const codes = new Set<string>();
    for (const c of Object.values(v.c)) for (const [fi, , , code] of c.v) if (indexOrigine.has(fi)) { expect(code, 'une valeur de fiche d\'origine non répertoriée reste hors enveloppe').toBeTruthy(); codes.add(code!); }
    expect(codes.has('h-origine')).toBe(true);
  });
  it('les rapprochements sûrs entrent ; les douteux ne rattachent rien', () => {
    expect(resoudreNom('Mt. Hood', index, table).id).toBe('beermaverick-mount-hood');
    expect(resoudreNom('Hallertauer Mittelfrüh', index, table).id).toBe('beermaverick-hallertau-mittelfruh');
    expect(resoudreNom('Hallertauer Magnum', index, table).id).toBe('beermaverick-magnum-gr');
    expect(resoudreNom('Perle (GR)', index, table).id).toBe('beermaverick-perle-gr');
    for (const nom of ['Styrian Gold', 'Cerera', 'HBC 522', 'HS09326', 'Perle', 'Saaz']) expect(resoudreNom(nom, index, table).statut, nom).toBe('aconfirmer');
    expect(resoudreNom('Krush HBC 586', index, table).statut).toBe('nouveau');
    expect(resoudreNom('Citra Cryo', index, table).statut).toBe('forme');
  });
});

describe('le catalogue complet', () => {
  it('le démarrage ne grossit pas : proto-data.json ne porte que Beer Maverick (317), les ajouts sont dans un fichier à la demande', () => {
    expect((protoData.varieties as { id: string }[]).every((v) => v.id.startsWith('beermaverick-'))).toBe(true);
    expect(CATALOGUE).toHaveLength(317);
    expect(ajoutsDejaCharges()).toBeNull();
    const source = readFileSync(resolve(racine, 'src/domain/hopIndex/v4/data.ts'), 'utf8');
    expect(source).not.toMatch(/import [^;]*catalogue-ajouts\.json/);       // aucun import statique
    expect(source).toMatch(/import\('\.\.\/\.\.\/\.\.\/data\/hopV4\/catalogue-ajouts\.json'\)/); // un import dynamique
  });
  it('Krush, Elani et Superdelic sont au catalogue complet, avec leurs valeurs de source ou un inconnu (jamais 0)', async () => {
    const plein = await chargerCataloguePlein();
    expect(chargerAjouts()).toBe(chargerAjouts());                          // un seul chargement, partagé
    expect(ajoutsDejaCharges()).not.toBeNull();
    const par = new Map(plein.map((v) => [v.name, v]));
    for (const nom of ['Krush', 'Elani', 'Superdelic', 'Dolcita']) expect(par.has(nom), nom).toBe(true);
    const krush = par.get('Krush')!;
    expect(krush.id).toBe('sources-krush');
    expect(krush.nbSources).toBeGreaterThanOrEqual(5);
    expect(krush.peuDeDonnees).toBe(false);
    expect(krush.alpha![0]).toBeGreaterThanOrEqual(8);                       // Krush : 10–14 % (BarthHaas, Crosby, HPA)
    expect(krush.alpha![1]).toBeLessThanOrEqual(25);
    expect(krush.aliases.join(' ')).toMatch(/HBC 586/);
    for (const v of plein.filter((x) => x.id.startsWith('sources-'))) {
      // Une plage vient de l'enveloppe de complements.json (valeurs valides, deux bornes publiées) ; sans enveloppe complète, elle est inconnue (null), jamais 0.
      const champs: [string, [number, number] | null | undefined][] = [['alpha', v.alpha], ['beta', v.beta], ['huile', v.oil], ['cohumulone', v.cohumulone], ['myrcene', v.oils.myrcene],
        ['humulene', v.oils.humulene], ['caryophyllene', v.oils.caryophyllene], ['farnesene', v.oils.farnesene]];
      for (const [champ, r] of champs) {
        const e = C.varietes[v.id]?.c[champ]?.e;
        if (r != null) { expect(r, `${v.id} ${champ}`).toEqual([e![0], e![1]]); expect(r[1]).toBeGreaterThanOrEqual(r[0]); }
        else expect(e == null || e[0] == null || e[1] == null, `${v.id} ${champ} : une enveloppe complète ne peut pas rester inconnue`).toBe(true);
      }
    }
  });
  it('toute variété ajoutée est citée par au moins une source ; une variété à une seule source ou sans α est `peuDeDonnees`', async () => {
    const ajouts = await chargerAjouts();
    expect(ajouts.length).toBeGreaterThan(150);
    for (const v of ajouts) {
      expect(v.id.startsWith('sources-'), v.id).toBe(true);
      expect(v.nbSources, v.id).toBeGreaterThanOrEqual(0);
      expect(v.peuDeDonnees, v.id).toBe((v.nbSources ?? 0) < 2 || !v.alpha);
      expect(v.bm ?? null).toBeNull();
    }
    expect(ajouts.some((v) => v.peuDeDonnees)).toBe(true);
    expect(ajouts.some((v) => !v.peuDeDonnees)).toBe(true);
    // Aucun identifiant en double, et aucun nom qui est déjà une variété de Beer Maverick.
    const ids = new Set([...CATALOGUE, ...ajouts].map((v) => v.id));
    expect(ids.size).toBe(CATALOGUE.length + ajouts.length);
    const noms = new Set(CATALOGUE.map((v) => v.name.toLowerCase()));
    expect(ajouts.filter((v) => noms.has(v.name.toLowerCase())).map((v) => v.name)).toEqual([]);
    expect((brutAjouts as { varieties: unknown[] }).varieties).toHaveLength(ajouts.length);
  });
  it('les valeurs d\'une variété ajoutée sont l\'enveloppe de ses valeurs valides dans complements.json', async () => {
    const ajouts = await chargerAjouts();
    const krush = ajouts.find((v) => v.name === 'Krush')!;
    const e = C.varietes[krush.id].c.alpha.e!;
    expect(krush.alpha).toEqual([e[0], e[1]]);
  });
});

describe('D175 : une variété peuDeDonnees ne passe jamais devant une variété documentée à égalité', () => {
  const clone = (id: string, nom: string, peu: boolean): CatalogueHop => ({ ...structuredClone(CATALOGUE.find((v) => v.id === id)!), id: `test-${nom}`, name: nom, aliases: [], peuDeDonnees: peu, nbSources: peu ? 1 : 9 });
  it('deux clones identiques de Mosaic : le documenté d\'abord, même quand son nom vient après dans l\'alphabet', () => {
    const catalogue = [...CATALOGUE, clone('beermaverick-mosaic', 'Aaa clone peu de données', true), clone('beermaverick-mosaic', 'Zzz clone documenté', false)];
    const m = creerMoteur({ catalogue, stock: [] });
    const r = m.substitutes('beermaverick-citra', { limit: 400 });
    const rang = (nom: string) => r.remplacants.findIndex((x) => x.name === nom);
    const peu = r.remplacants[rang('Aaa clone peu de données')], doc = r.remplacants[rang('Zzz clone documenté')];
    expect(peu.score).toBe(doc.score);                                       // égalité réelle : même fiche, même score
    expect(rang('Zzz clone documenté')).toBeLessThan(rang('Aaa clone peu de données'));
  });
  it('un jeu où le tri alphabétique donnerait l\'inverse : le même résultat sans limite et avec limite', () => {
    const catalogue = [...CATALOGUE, clone('beermaverick-mosaic', 'Aaa clone peu de données', true), clone('beermaverick-mosaic', 'Zzz clone documenté', false)];
    const m = creerMoteur({ catalogue, stock: [] });
    const tous = m.substitutes('beermaverick-citra', { limit: 400 }).remplacants.map((x) => x.name);
    const dix = m.substitutes('beermaverick-citra', { limit: 10 }).remplacants.map((x) => x.name);
    expect(dix).toEqual(tous.slice(0, 10));
  });
});
