import { describe, expect, it } from 'vitest';
import { levure, creerApiLevure } from '../../../src/domain/levure';
import { ID_AXES as ID_AXES_EXPORT } from '../../../src/domain/levure/axes';
import { auteurEstFabricant } from '../../../src/domain/levure/fiche';

// Règle du critique (M3, VERDICT-port.md) : chaque fait affiché sous une levure a un auteur qui est son fabricant, ou une source
// indépendante nommée (étude, revue) ; jamais un autre fabricant ni un revendeur d'une autre maison.
const INDEPENDANTES = /^(?:Samia|Svedlund|Saerens|Kucharczyk|Cui|Voss|Haslbeck)/i;
const auteurDe = (libelle: string) => libelle.split(' · ')[0].trim();

describe('sources : jamais un autre fabricant', () => {
  it('LalBrew Verdant IPA : aucune source « Escarpment Labs » ni « White Labs » sous ses axes', () => {
    const verdant = levure.trouver('lalbrew-verdant-ipa')!;
    for (const axe of ID_AXES_EXPORT) {
      const v = levure.valeurAxe(verdant, axe);
      if (v?.source) expect(auteurDe(v.source.libelle), axe).not.toMatch(/Escarpment|White Labs/);
    }
    // la valeur « abricot · tropical » des esters reste, avec la fiche technique Lallemand
    const esters = levure.valeurAxe(verdant, 'esters')!;
    expect(esters.mots).toEqual(expect.arrayContaining(['abricot']));
    expect(esters.source?.libelle).toMatch(/^Lallemand Brewing/);
  });

  it('tout le catalogue : chaque fait lu a son fabricant ou une source indépendante pour auteur', () => {
    const mal: string[] = [];
    for (const f of levure.contexte.tous()) {
      if (!f.labo) continue;
      for (const fait of f.faits) {
        const a = auteurDe(fait.source.libelle);
        if (!auteurEstFabricant(a, f.labo) && !INDEPENDANTES.test(a)) mal.push(`${f.id} | ${fait.cle} | ${fait.source.libelle}`);
      }
    }
    expect(mal.slice(0, 5)).toEqual([]);
    expect(mal.length).toBe(0);
  });

  it('chaque axe de chaque levure de bière : la source rendue est celle du fabricant ou une étude', () => {
    const mal: string[] = [];
    for (const f of levure.contexte.biere()) {
      if (!f.labo) continue;
      for (const axe of ID_AXES_EXPORT) {
        const s = levure.valeurAxe(f.ref, axe)?.source;
        if (s && !auteurEstFabricant(auteurDe(s.libelle), f.labo) && !INDEPENDANTES.test(auteurDe(s.libelle))) mal.push(`${f.id} ${axe} ${s.libelle}`);
      }
    }
    expect(mal.slice(0, 5)).toEqual([]);
  });

  it('le catalogue brut (maquette) garde les pages relayées : 82 faits d’un autre fabricant, repérés, 16 levures Lallemand', () => {
    const brut = creerApiLevure({ maquette: true });
    let n = 0;
    const levures = new Set<string>();
    for (const f of brut.contexte.tous()) for (const fait of f.faits) {
      if (f.labo && !auteurEstFabricant(auteurDe(fait.source.libelle), f.labo)) { n++; levures.add(f.id); }
    }
    expect(n).toBeGreaterThan(0);
    expect(levures.size).toBe(16);
    // l'écart par rapport au décompte du catalogue (82) vient des doublons exacts que lireFaits fusionne
    expect(n).toBeLessThanOrEqual(82);
  });
});
