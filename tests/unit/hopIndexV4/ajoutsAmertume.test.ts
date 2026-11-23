// Voie c9-ajouts-amertume (31.10, D199) : « Il doit manquer des choses ». Les ajouts de c6 sans aucune variable d'amertume étaient 76 sur 188.
// Ces tests échouent sur la version de HEAD (C9_AJOUTS=<copie de HEAD> pour le montrer) : voir RESULTAT.md de la voie.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const RACINE = process.cwd();
const lire = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const ajouts: any[] = lire(process.env.C9_AJOUTS ?? resolve(RACINE, 'src/data/hopV4/catalogue-ajouts.json')).varieties;
const table = lire(resolve(RACINE, 'src/data/hopV4/alias-noms.json'));
const avant: { ids: string[] } = lire(resolve(RACINE, 'scripts/collecte-hop/c9-avant.json'));
const par = new Map(ajouts.map((v) => [v.id, v]));
const sansAmertume = (v: any) => !v.alpha && !v.beta && !v.cohumulone;

describe('c9 : les ajouts et l\'amertume (D199)', () => {
  it('« Bru » n\'est plus une variété à part : c\'est BRU-1 (alias prouvé)', () => {
    expect(par.has('sources-bru')).toBe(false);
    expect(table.alias.bru).toBe('beermaverick-bru-1');
    expect(table.preuvesC9.bru).toMatch(/13–15/);
  });

  it('les doublons prouvés sont fondus, jamais sur un nom proche seul', () => {
    for (const id of ['sources-extra-styrian-dana', 'sources-cluster-fugget', 'sources-hbc-438', 'sources-ycr-1', 'sources-mighty-axe-tropica', 'sources-mighty-axe-julius', 'sources-machops']) expect(par.has(id), id).toBe(false);
    // chaque alias ou synonyme C9 a sa preuve écrite
    for (const k of Object.keys(table.preuvesC9)) expect(k in table.alias || k in table.synonymes, k).toBe(true);
    for (const k of ['bru', 'extra styrian dana', 'cluster fugget', 'hbc 438', 'ycr 1', 'mighty axe tropica']) expect(table.preuvesC9[k], k).toBeTruthy();
  });

  it('ce qui est connu d\'un seul nom reste une variété : les ajouts à une seule source sont montrés', () => {
    expect(par.has('sources-mapuche')).toBe(true);
    expect(par.has('sources-zamba')).toBe(true);
    expect(par.has('sources-bate-s-brewer')).toBe(true); // aucune valeur nulle part : inconnu, mais présent
    expect(par.get('sources-bate-s-brewer').alpha).toBeNull();
  });

  it('au plus 15 ajouts sans α, β ni cohumulone (76 avant), et aucun n\'est un 0', () => {
    const encore = avant.ids.filter((id) => par.has(id) && sansAmertume(par.get(id)));
    expect(avant.ids.length).toBe(76);
    expect(encore.length).toBeLessThanOrEqual(15);
    for (const v of ajouts) for (const champ of ['alpha', 'beta', 'oil']) if (v[champ]) expect(v[champ][0] === 0 && v[champ][1] === 0, `${v.id}.${champ}`).toBe(false);
  });

  it('une valeur déclarée par les recettes est marquée, avec sa source et son compte', () => {
    const zamba = par.get('sources-zamba');
    expect(zamba.alpha).toEqual([9.1, 10.2]);
    expect(zamba.declare).toContain('alpha');
    expect(zamba.croise.alpha.n).toBe(2);
    expect(zamba.croise.alpha.voix.map((x: any[]) => x[0]).sort()).toEqual(['beeranalytics', 'brewersfriend']);
    expect(zamba.croise.alpha.voix.every((x: any[]) => x[3] === 'r')).toBe(true);
    // une valeur de producteur n'est jamais marquée « recettes »
    const mapuche = par.get('sources-mapuche');
    expect(mapuche.declare ?? []).not.toContain('alpha');
    expect(mapuche.alpha).toEqual([6, 7]);
  });

  it('seul ce qui n\'est pas une variété reçoit la nature, preuve à l\'appui', () => {
    const natures = Object.entries(table.natures) as [string, any][];
    expect(natures.length).toBeGreaterThanOrEqual(8);
    for (const [id, n] of natures) {
      expect(['produit', 'inconnu']).toContain(n.nature);
      expect(n.preuve.length, id).toBeGreaterThan(30);
      expect(par.get(id)?.nature, id).toBe(n.nature);
    }
    expect(ajouts.filter((v) => v.nature).length).toBe(natures.length);
    expect(par.get('sources-mapuche').nature).toBeUndefined();
  });

  it('le script c9-ajouts.mjs --verifier rend C9 OK', () => {
    const sortie = execFileSync('node', ['scripts/collecte-hop/c9-ajouts.mjs', '--verifier'], { cwd: RACINE, encoding: 'utf8' });
    expect(sortie).toMatch(/^C9 OK/);
  });
});
