// s1-sources-lignes (26.10) : un trait par plage qui diffère, jamais deux traits pour la même valeur.
// Ses mots : « si plusieurs sources disent la même chose pas besoin de toutes les montrer ». La fonction partagée
// (src/ui/hopIndex/commun/plagesSources.ts) et la lecture des sources (sourcesMesures.ts) : catalogue et complements.json.
// Données : les fichiers du dépôt ; aucune donnée réelle, aucun appel Gemini.
import { describe, expect, it } from 'vitest';
import { chargerComplements, complementsCharges } from '../../../src/domain/hopIndex/v4/complements';
import { clePlage, dedoublonnerPlages, enveloppeDesPlages, milieuMoyen, titreTrait, type SourcePlage } from '../../../src/ui/hopIndex/commun/plagesSources';
import { sourcesDeBarre, type ChampBarre } from '../../../src/ui/hopIndex/commun/sourcesMesures';
import { acides } from '../../../src/ui/hopIndex/comparer/valeurs';
import { fiches } from '../../../src/ui/hopIndex/parcours/v4';

const s = (nom: string, lo: number, hi: number): SourcePlage => ({ nom, ref: nom.slice(0, 2).toUpperCase(), r: [lo, hi] });
const LOTUS = 'beermaverick-lotus', CITRA = 'beermaverick-citra', GALAXY = 'beermaverick-galaxy', MAGNUM_US = 'beermaverick-magnum-us', SOUTHERN_STAR = 'beermaverick-southern-star';

describe('dedoublonnerPlages : la même plage n\'a qu\'un trait', () => {
  it('deux sources de même plage : un trait, les deux noms', () => {
    const t = dedoublonnerPlages([s('Beer Maverick', 13, 17), s('Hopsteiner', 13, 17)]);
    expect(t).toHaveLength(1);
    expect(t[0].noms).toEqual(['Beer Maverick', 'Hopsteiner']);
    expect(t[0].r).toEqual([13, 17]);
  });

  it('deux plages qui diffèrent : deux traits, dans l\'ordre des sources', () => {
    const t = dedoublonnerPlages([s('Beer Maverick', 5, 6), s('Hopsteiner', 5.5, 6)]);
    expect(t.map((x) => x.r)).toEqual([[5, 6], [5.5, 6]]);
  });

  it('« mêmes bornes une fois arrondies à la précision affichée » : 5–6 et 5,0–6,0 sont la même plage, 5,004 aussi à 2 décimales', () => {
    expect(dedoublonnerPlages([s('A', 5, 6), s('B', 5.0, 6.0), s('C', 5.004, 5.996)])).toHaveLength(1);
    // 0,1 + 0,2 : l'arrondi ne laisse pas une erreur de flottant fabriquer une plage de plus.
    expect(dedoublonnerPlages([s('A', 0.3, 1), s('B', 0.1 + 0.2, 1)])).toHaveLength(1);
    // À la précision affichée, 5,00 et 5,01 diffèrent : deux traits ; à une décimale, la même plage.
    expect(dedoublonnerPlages([s('A', 5, 6), s('B', 5.01, 6)])).toHaveLength(2);
    expect(dedoublonnerPlages([s('A', 5, 6), s('B', 5.04, 6)], 1)).toHaveLength(1);
    expect(clePlage([5, 6])).toBe(clePlage([5.0, 6.0]));
  });

  it('une même source qui donne deux fois la même plage n\'écrit son nom qu\'une fois', () => {
    const t = dedoublonnerPlages([s('Crosby Hops', 11, 14.3), s('Crosby Hops', 11, 14.3), s('BarthHaas', 11, 14.3)]);
    expect(t).toHaveLength(1);
    expect(t[0].noms).toEqual(['Crosby Hops', 'BarthHaas']);
  });

  it('une même source qui donne deux plages différentes a deux traits (deux fiches qui ne disent pas la même chose)', () => {
    expect(dedoublonnerPlages([s('Crosby Hops', 15.9, 19.8), s('Crosby Hops', 12.3, 19.8)])).toHaveLength(2);
  });

  it('une plage à une seule valeur (13,6–13,6) a son trait ; une borne inconnue ou renversée n\'en a pas, sans erreur', () => {
    expect(dedoublonnerPlages([s('Hops Direct', 13.6, 13.6)])).toHaveLength(1);
    expect(dedoublonnerPlages([s('A', NaN, 5), s('B', 7, 3), s('C', 1, 2)]).map((x) => x.noms)).toEqual([['C']]);
    expect(dedoublonnerPlages([])).toEqual([]);
  });

  it('aucun trait n\'est perdu : l\'enveloppe et le milieu moyen des traits sont ceux de toutes les sources', () => {
    const src = [s('A', 11, 16), s('B', 11, 16), s('C', 12.3, 19.8), s('D', 13, 15)];
    const t = dedoublonnerPlages(src);
    expect(t).toHaveLength(3);
    expect(enveloppeDesPlages(t)).toEqual(enveloppeDesPlages(src));
    // Chaque source compte une fois : A et B, d'accord, pèsent deux fois.
    const milieu = src.reduce((a, x) => a + (x.r[0] + x.r[1]) / 2, 0) / src.length;
    expect(milieuMoyen(t)).toBeCloseTo(milieu, 10);
    expect(enveloppeDesPlages([])).toBeNull();
    expect(milieuMoyen([])).toBeNull();
  });

  // s2 (D168, 26.10) : le survol ne nomme plus aucune source (leurs noms vivent dans la section Sources de la fiche) ; il dit la plage
  // et combien de sources la donnent. Les noms restent dans la donnée du trait (`noms`).
  it('le survol dit la plage et le nombre de sources, sans les nommer', () => {
    const [t] = dedoublonnerPlages([s('Beer Maverick', 5.5, 6), s('Hopsteiner', 5.5, 6)]);
    expect(titreTrait(t, (a, b) => `${a}–${b}`)).toBe('5.5–6 · 2 sources d’accord');
    expect(t.noms).toEqual(['Beer Maverick', 'Hopsteiner']);
    const [u] = dedoublonnerPlages([s('Beer Maverick', 5.5, 6)]);
    expect(titreTrait(u, (a, b) => `${a}–${b}`)).toBe('5.5–6');
  });
});

describe('sourcesDeBarre : le catalogue d\'abord, puis les compléments', () => {
  it('avant le chargement des compléments : le catalogue seul (Beer Maverick, Hopsteiner), sans erreur', () => {
    if (complementsCharges()) return; // un autre fichier de test l'a déjà chargé dans ce processus
    expect(sourcesDeBarre(LOTUS, 'beta').map((x) => x.ref)).toEqual(['BM', 'HS']);
  });

  it('Lotus, β : Beer Maverick 5–6 et Hopsteiner 5,5–6, que Charles Faram redit : 2 traits, pas 3', async () => {
    await chargerComplements();
    const src = sourcesDeBarre(LOTUS, 'beta');
    expect(src.map((x) => x.ref)).toEqual(['BM', 'HS', 'CF']); // HopDatabase est hors enveloppe (unité absente) ; la fiche Hopsteiner des compléments est celle du catalogue
    const t = dedoublonnerPlages(src);
    expect(t.map((x) => x.r)).toEqual([[5, 6], [5.5, 6]]);
    expect(t[1].noms).toEqual(['Hopsteiner', 'Charles Faram']);
  });

  it('Lotus, α : trois sources, une seule plage (13–17) : un trait', () => {
    const t = dedoublonnerPlages(sourcesDeBarre(LOTUS, 'alpha'));
    expect(t).toHaveLength(1);
    expect(t[0].noms).toEqual(['Beer Maverick', 'Hopsteiner', 'Charles Faram']);
  });

  it('Galaxy, α : plus de cinq sources, plusieurs plages qui diffèrent, chacune a son trait ; la valeur hors enveloppe n\'en a pas', async () => {
    await chargerComplements();
    const src = sourcesDeBarre(GALAXY, 'alpha');
    expect(src.length).toBeGreaterThan(5);
    const t = dedoublonnerPlages(src);
    expect(t.length).toBeGreaterThanOrEqual(5);
    expect(t.length).toBeLessThan(src.length); // des sources d'accord (BM et Hopsteiner Hopslist : 11–16 ; Crosby, BarthHaas : 12,3–19,8)
    // HopDatabase (12,3–19,8) et hops-json (11,6–16) : unité absente, hors enveloppe, donc ni source ni trait.
    expect(src.map((x) => x.ref)).not.toContain('HD');
    expect(src.map((x) => x.ref)).not.toContain('HJ');
  });

  it('Magnum (US) : une valeur à un seul chiffre (Hops Direct 13,6) a son trait ; Southern Star : trois plages', async () => {
    await chargerComplements();
    const m = dedoublonnerPlages(sourcesDeBarre(MAGNUM_US, 'alpha'));
    expect(m.some((x) => x.r[0] === 13.6 && x.r[1] === 13.6)).toBe(true);
    const st = dedoublonnerPlages(sourcesDeBarre(SOUTHERN_STAR, 'alpha'));
    expect(st.map((x) => x.r)).toEqual(expect.arrayContaining([[12, 14], [12, 18]]));
  });

  it('Citra : la valeur suspecte (BSG 21–28) n\'est pas un trait', async () => {
    await chargerComplements();
    const t = dedoublonnerPlages(sourcesDeBarre(CITRA, 'alpha'));
    expect(enveloppeDesPlages(t)![1]).toBeLessThan(21);
  });

  it('Comparer lit les mêmes sources : α de Galaxy, l\'enveloppe de tous les traits, une référence par source, aucune en double', async () => {
    await chargerComplements();
    const a = acides(GALAXY, 'alpha')!;
    const env = enveloppeDesPlages(sourcesDeBarre(GALAXY, 'alpha'))!;
    expect([a.lo, a.hi]).toEqual(env);
    expect(a.refs).toEqual([...new Set(a.refs)]);
    expect(a.refs).toEqual(expect.arrayContaining(['BM', 'BH', 'CF', 'CRO', 'HL', 'HPA', 'JH', 'YVH']));
  });
});

describe('contrôle sur tout le catalogue : jamais deux traits de même plage, aucune plage qui diffère sans trait', () => {
  const CHAMPS: ChampBarre[] = ['alpha', 'beta', 'myrcene', 'humulene', 'caryophyllene', 'linalol'];
  it('chaque houblon, chaque champ de barre', async () => {
    await chargerComplements();
    const ids = fiches().map((f) => f.id);
    expect(ids.length).toBeGreaterThan(200);
    const fautes: string[] = [];
    let avecTraits = 0, sourcesTotal = 0, traitsTotal = 0;
    for (const id of ids) {
      for (const champ of CHAMPS) {
        const src = sourcesDeBarre(id, champ);
        const traits = dedoublonnerPlages(src);
        sourcesTotal += src.length; traitsTotal += traits.length;
        if (traits.length) avecTraits++;
        const cles = traits.map((t) => clePlage(t.r));
        if (new Set(cles).size !== cles.length) fautes.push(`${id} ${champ} : deux traits de même plage`);
        for (const x of src) if (!cles.includes(clePlage(x.r))) fautes.push(`${id} ${champ} : la plage ${x.r.join('–')} (${x.nom}) n'a pas de trait`);
        for (const t of traits) if (!src.some((x) => clePlage(x.r) === clePlage(t.r) && t.noms.includes(x.nom))) fautes.push(`${id} ${champ} : un trait sans source`);
        // Un nom de source ne se perd pas : tous ceux qui donnent une plage se retrouvent au survol de l'un des traits.
        const noms = new Set(traits.flatMap((t) => t.noms));
        for (const x of src) if (!noms.has(x.nom)) fautes.push(`${id} ${champ} : ${x.nom} absent des survols`);
      }
    }
    expect(fautes.slice(0, 10)).toEqual([]);
    expect(avecTraits).toBeGreaterThan(1000);
    // Le dédoublonnage retire bien quelque chose : sans lui, des traits de même plage s'empileraient.
    expect(traitsTotal).toBeLessThan(sourcesTotal);
  }, 60000);
});
