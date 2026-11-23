import { describe, expect, it } from 'vitest';
import { levure } from '../../../src/domain/levure';

// VERDICT-port-2 N4 : la maquette disait « pêche · agrumes, terpènes forts, thiols moyens » (TROUS-COMBLES, faits-proposes).
describe('LalBrew Pomona : arômes sourcés Lallemand', () => {
  const pomona = () => levure.trouver('lalbrew-pomona')!;
  it('esters : pêche, agrumes, estimés, source Lallemand (fiche technique), jamais Escarpment ni White Labs', () => {
    const v = levure.valeurAxe(pomona(), 'esters')!;
    expect(v).not.toBeNull();
    expect(v.estime).toBe(true);
    expect(v.mots).toEqual(expect.arrayContaining(['pêche', 'agrumes']));
    expect(v.source?.libelle).toMatch(/^Lallemand Brewing/);
    expect(v.source?.url).toMatch(/Pomona-TDS/);
  });
  it('terpènes forts et thiols moyens : tableau Lallemand', () => {
    const t = levure.valeurAxe(pomona(), 'terpenes')!;
    expect(t).toMatchObject({ niveau: 'eleve' });
    expect(t.source?.libelle).toMatch(/^Lallemand Brewing/);
    const th = levure.valeurAxe(pomona(), 'thiols')!;
    expect(th).toMatchObject({ niveau: 'moyen' });
    expect(th.source?.libelle).toMatch(/^Lallemand Brewing/);
  });
  it('la règle « auteur = fabricant » reste : aucune source d’une autre maison sous Pomona', () => {
    for (const axe of ['esters', 'phenols', 'thiols', 'terpenes', 'temperature', 'attenuation', 'tolerance', 'clarte'] as const) {
      const s = levure.valeurAxe(pomona(), axe)?.source;
      if (s) expect(s.libelle, axe).not.toMatch(/Escarpment|White Labs/);
    }
  });
});
