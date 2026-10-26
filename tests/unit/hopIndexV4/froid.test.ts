// Voie x1-amertume-creep (26.10) : amertume au dry hop, hop creep et familles près de leur limite, pour Dryhopper.
// Cas 1 : sa capture (Cascade, 21C, 4 g/L, dry hop après, 3 j ; « IBU 28+? », résineux +27). Cas 2 : Nugget en 16D. Cas 3 : hors domaine.
import { describe, expect, it } from 'vitest';
import { amertumeAFroid, famillesProchesDeLaLimite, hopCreepDe, HOP_CREEP_SEUILS } from '../../../src/domain/hopIndex/v4/froid';
import { bitternessScience } from '../../../src/domain/hopBitterness';
import type { Addition, Recipe } from '../../../src/domain/hopIndex/v4';
import type { AjoutPouvoir } from '../../../src/domain/hopIndex/v4/pouvoir';

// La recette de sa capture : Nugget 20 g à 60′ (alpha 13 % du stock) = 27,9 IBU à chaud, « IBU 28 ».
const r21: Recipe = { name: 'Hazy du jeudi', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05',
  additions: [{ id: 'a60', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }] };
const cascade = (patch: Partial<AjoutPouvoir> = {}): AjoutPouvoir => ({ id: 'dry', hopKey: 'beermaverick-cascade', moment: 'dryPost', grams: 80, day: 7, dureeJours: 3, ...patch });
// Nugget en 16D : 46 g à 60′ visent le milieu de la bande d’IBU du style (50–70).
const r16: Recipe = { name: 'Stout', styleCode: '16D', volumeL: 20, og: 1.065, boilMin: 60, yeastId: 'fermentis-us05',
  additions: [{ id: 'a60', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
const nugget = (patch: Partial<AjoutPouvoir> = {}): AjoutPouvoir => ({ id: 'dry', hopKey: 'beermaverick-nugget', moment: 'dryPost', grams: 80, day: 7, dureeJours: 3, ...patch });

describe('1. Cascade en 21C, 4 g/L, dry hop après, 3 j (sa capture)', () => {
  const a = amertumeAFroid(r21, cascade());
  it('amertume : l’équivalent final et son delta, recalculés à la main sur le tableau 5 de Maye et al. (5 j)', () => {
    expect(a.statut).toBe('conditional');
    expect(a.doseGL).toBe(4);
    expect(a.ibuChaud!.centre).toBeCloseTo(27.906, 2);
    // Indépendant du modèle : 4 g/L = 4 × 31 × 3,785411784 / 453,59237 = 1,0349 lb/bbl ; entre 1 lb/bbl (iso 29 sur 51,3 mg/L, part retrouvée 0,97)
    // et 2 lb/bbl (25 sur 51,3 ; 0,90), puis humulinones 0,26 % × 4 g/L × 10 × part retrouvée × 0,66.
    const lb = (4 * 31 * 3.785411784) / 453.59237, t = lb - 1;
    const iso = (29 + t * (25 - 29)) / 51.3, rec = 0.97 + t * (0.9 - 0.97);
    const final120 = 27.906 * iso + 4 * 0.26 * 10 * rec * 0.66;
    expect(a.scenarios.find((s) => s.experimentId === 'cascade-high-120h')!.finalEquivalent.min).toBeCloseTo(final120, 2);
    expect(a.equivalentFinal!.min).toBeCloseTo(final120, 2);
    expect(a.equivalentFinal!.max).toBeCloseTo(33.99, 1);
    expect(a.delta!.min).toBeCloseTo(-5.57, 1);
    expect(a.delta!.max).toBeCloseTo(6.08, 1);
  });
  it('le sens du delta n’est pas établi : la plage va du négatif au positif ; nature dite, jamais un IBU mesuré', () => {
    expect(a.delta!.min).toBeLessThan(0);
    expect(a.delta!.max).toBeGreaterThan(0);
    expect(a.nature).toMatch(/pas l’IBU du test de laboratoire/);
    expect(a.source!.author).toBe('Maye, Smith et Leker');
    expect(a.version).toBe('2026-09-09.1');
  });
  it('hop creep : moyen (2 points : après fermentation 1 + Cascade 1) ; durée 3 j et dose 4 g/L ne comptent pas ; la température inconnue est dite', () => {
    const c = hopCreepDe(r21, cascade());
    expect(c.statut).toBe('évalué');
    expect(c.risque).toBe('moyen');
    expect(c.points).toBe(2);
    expect(c.facteurs.map((f) => [f.id, f.points])).toEqual([['levure', 1], ['dose', 0], ['duree', 0], ['temperature', null], ['variete', 1]]);
    expect(c.inconnus.join(' ')).toMatch(/Température de contact/);
    expect(c.inconnus.join(' ')).toMatch(/Levure encore viable/);
    expect(c.effets.map((e) => e.id)).toEqual(['attenuation', 'co2', 'diacetyle']);
    // L’ampleur n’est jamais chiffrée pour ce brassin ; les ordres de grandeur publiés portent leur source.
    for (const e of c.effets) expect(e.ampleur).toBeNull();
    expect(c.effets[0].chiffresPublies.flatMap((x) => x.sources.map((s) => s.cle))).toEqual(expect.arrayContaining(['H68', 'H84']));
    expect(c.effets[2].chiffresPublies[0].texte).toMatch(/25 → 200 ppb/);
  });
  it('familles près de leur limite : le résineux à +27 pour une borne de 30, le floral ; le vert et l’herbacé, indésirables, la dépassent', () => {
    const f = famillesProchesDeLaLimite(r21, cascade());
    expect(f.statut).toBe('évalué');
    const resin = f.familles.find((x) => x.famille === 'resin')!;
    expect(resin.apport).toBeCloseTo(26.76, 1);
    expect(Math.round(resin.apport)).toBe(27);
    expect(resin.borne).toBe(30);
    expect(resin.valeur).toBeCloseTo(27.51, 1);
    expect(resin.marge).toBeCloseTo(2.49, 1);
    expect(resin.cran).toBe(10);
    expect(resin.approche).toBe(true);
    expect(resin.depasse).toBe(false);
    expect(resin.statut).toBe('neutre');
    expect(f.familles.find((x) => x.famille === 'floral')!.approche).toBe(true);
    for (const id of ['green', 'herbal'] as const) {
      const x = f.familles.find((y) => y.famille === id)!;
      expect(x.statut).toBe('indésirable');
      expect(x.depasse).toBe(true);
      expect(x.marge).toBeLessThan(0);
    }
    // Les familles attendues du style ne sont jamais citées ; l’ordre va de la plus au-dessus de sa borne à la plus proche.
    expect(f.familles.some((x) => ['citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon'].includes(x.famille))).toBe(false);
    expect(f.familles.map((x) => x.marge)).toEqual([...f.familles.map((x) => x.marge)].sort((p, q) => p - q));
    expect(f.familles[0].famille).toBe('green');
  });
});

describe('2. Nugget en 16D, 4 g/L, dry hop après, 3 j', () => {
  it('amertume : IBU à chaud d’environ 60, équivalent final en plage, delta qui peut être négatif', () => {
    const a = amertumeAFroid(r16, nugget());
    expect(a.statut).toBe('conditional');
    expect(a.ibuChaud!.centre).toBeGreaterThan(55);
    expect(a.ibuChaud!.centre).toBeLessThan(65);
    expect(a.equivalentFinal!.min).toBeLessThan(a.ibuChaud!.centre);
    expect(a.equivalentFinal!.max).toBeGreaterThan(a.equivalentFinal!.min);
    expect(a.delta!.min).toBeLessThan(0);
    // Une bière déjà amère : l’iso-α adsorbé pèse plus que les humulinones, le delta reste négatif en bas de plage (Maye et al., tableau 6).
    expect(a.delta!.min).toBeLessThan(-15);
  });
  it('hop creep : faible après fermentation (Nugget non cité par l’étude : inconnu, jamais « faible » en variété) ; moyen en dry hop actif', () => {
    const apres = hopCreepDe(r16, nugget());
    expect(apres.risque).toBe('faible');
    expect(apres.points).toBe(1);
    expect(apres.facteurs.find((f) => f.id === 'variete')!.connu).toBe(false);
    expect(apres.inconnus.join(' ')).toMatch(/Nugget : activité enzymatique du lot non documentée/);
    const actif = hopCreepDe(r16, nugget({ moment: 'dryActive' }));
    expect(actif.risque).toBe('moyen');
    expect(actif.points).toBe(2);
  });
  it('familles : le résineux est à quelques dixièmes de la borne (neutre, 0–30) ; le floral, attendu en 16D, n’est pas cité', () => {
    const f = famillesProchesDeLaLimite(r16, nugget());
    const resin = f.familles.find((x) => x.famille === 'resin')!;
    expect(resin.borne).toBe(30);
    expect(resin.approche).toBe(true);
    expect(resin.marge).toBeGreaterThanOrEqual(0);
    expect(resin.marge).toBeLessThan(1);
    expect(f.familles.some((x) => x.famille === 'floral' || x.famille === 'herbal' || x.famille === 'earthy')).toBe(false);
    // Le melon n’est décrit par aucune fiche de Nugget : non situé, jamais compté pour 0.
    expect(f.nonSituees.map((x) => x.famille)).toContain('melon');
  });
});

describe('3. Hors du domaine, données absentes, cas limites', () => {
  it('amertume : dose cumulée au-delà des essais (15 g/L > 7,73) : le statut et la raison du modèle, aucune valeur inventée', () => {
    const a = amertumeAFroid(r21, cascade({ grams: 300 }));
    expect(a.statut).toBe('incomplete');
    expect(a.equivalentFinal).toBeNull();
    expect(a.delta).toBeNull();
    expect(a.equivalentFinalAuCentre).toBeNull();
    expect(a.humulinonesMgL).toBeNull();
    expect(a.raisons[0]).toMatch(/Dose cumulée au-delà des essais \(7\.73 g\/L\)/);
    // Le hop creep, lui, lit cette dose : ≥ 10 g/L compte (essais publiés à 10 et 20 g/L).
    expect(hopCreepDe(r21, cascade({ grams: 300 })).facteurs.find((f) => f.id === 'dose')!.points).toBe(1);
  });
  it('amertume : un ajout de plusieurs lignes compte sa dose cumulée (deux fois 40 g = 80 g)', () => {
    const deux: Recipe = { ...r21, additions: [...r21.additions, { id: 'dry1', hopKey: 'beermaverick-cascade', moment: 'dryPost', grams: 40 }] };
    const a = amertumeAFroid(deux, { id: 'dry2', hopKey: 'beermaverick-citra', moment: 'dryPost', grams: 40 } as Addition);
    const un = amertumeAFroid(r21, cascade());
    expect(a.doseGL).toBe(4);
    expect(a.equivalentFinal).toEqual(un.equivalentFinal);
    // Passer un ajout déjà dans la recette ne le compte pas deux fois.
    expect(amertumeAFroid({ ...r21, additions: [...r21.additions, cascade()] }, cascade()).doseGL).toBe(4);
  });
  it('amertume : alpha d’un ajout à chaud inconnu → aucun IBU supposé, rien de calculé', () => {
    const inconnu: Recipe = { ...r21, additions: [...r21.additions, { id: 'x', hopKey: 'houblon-sans-fiche', moment: 'b30', grams: 10 }] };
    const a = amertumeAFroid(inconnu, cascade());
    expect(a.statut).toBe('incomplete');
    expect(a.ibuChaud).toBeNull();
    expect(a.equivalentFinal).toBeNull();
    expect(a.raisons[0]).toMatch(/IBU à chaud incomplets \(alpha inconnu : houblon-sans-fiche\)/);
  });
  it('amertume : science désactivée ou invalide (l’hôte passe undefined) → la raison du modèle ; sans option, la graine activée', () => {
    const science = bitternessScience()!;
    expect(science.enabled).toBe(true);
    const off = amertumeAFroid(r21, cascade(), { science: bitternessScience([{ ...science, enabled: false }]) });
    expect(off.statut).toBe('incomplete');
    expect(off.equivalentFinal).toBeNull();
    expect(off.raisons[0]).toMatch(/absente, désactivée ou invalide/);
    expect(amertumeAFroid(r21, cascade()).statut).toBe('conditional');
    // Une révision enregistrée prime : l’amertume relative modifiée change l’équivalent.
    const revisee = amertumeAFroid(r21, cascade(), { science: bitternessScience([{ ...science, version: 'test', relativeBitterness: { ...science.relativeBitterness, value: 0.5 } }]) });
    expect(revisee.version).toBe('test');
    expect(revisee.equivalentFinal!.max).toBeLessThan(amertumeAFroid(r21, cascade()).equivalentFinal!.max);
  });
  it('amertume : contact ou température hors des essais → une raison de plus, la valeur reste', () => {
    const a = amertumeAFroid(r21, cascade({ dureeJours: 8, temperatureC: 21 }));
    expect(a.statut).toBe('conditional');
    expect(a.raisons.join(' ')).toMatch(/Contact de 8 j : hors des essais/);
    expect(a.raisons.join(' ')).toMatch(/Contact à 21 °C : les essais sont à 16 °C/);
  });
  it('un ajout à chaud : amertume « non applicable », hop creep « sans objet », familles lues quand même', () => {
    const chaud: Addition = { id: 'x', hopKey: 'beermaverick-cascade', moment: 'b10', grams: 40 };
    expect(amertumeAFroid(r21, chaud).statut).toBe('incomplete');
    expect(amertumeAFroid(r21, chaud).equivalentFinal).toBeNull();
    const c = hopCreepDe(r21, chaud);
    expect(c.statut).toBe('sans objet');
    expect(c.risque).toBeNull();
    expect(famillesProchesDeLaLimite(r21, chaud).statut).toBe('évalué');
  });
  it('hop creep : levure déclarée non viable → nul, sans effets ; levure viable après fermentation → 2 points', () => {
    const nul = hopCreepDe(r21, cascade(), { levureViable: false });
    expect(nul.risque).toBe('nul');
    expect(nul.effets).toEqual([]);
    expect(hopCreepDe(r21, cascade(), { levureViable: true }).points).toBe(3);
  });
  it('hop creep : fort seulement à partir de la dose des essais publiés (10 g/L) ; en dessous, plafonné à moyen', () => {
    // Actif 2 + Cascade 1 + 21 °C 1 = 4 points : « fort » par les points, mais 4 g/L est sous 10 g/L.
    const sous = hopCreepDe(r21, cascade({ moment: 'dryActive', temperatureC: 21 }));
    expect(sous.points).toBe(4);
    expect(sous.plafonne).toBe(true);
    expect(sous.risque).toBe('moyen');
    const haut = hopCreepDe(r21, cascade({ moment: 'dryActive', temperatureC: 21, grams: 200, dureeJours: 7 }));
    expect(haut.points).toBe(6);
    expect(haut.plafonne).toBe(false);
    expect(haut.risque).toBe('fort');
    expect(HOP_CREEP_SEUILS.doseGL.valeur).toBe(10);
    // Chaque seuil nomme ses sources, qui existent dans composes-houblon.json (sinon sourcePouvoir lèverait).
    for (const f of haut.facteurs.filter((x) => x.id !== 'levure')) expect(f.sources.length).toBeGreaterThan(0);
  });
  it('familles : style non documenté ou moment non simulé → un statut et sa raison, jamais une liste vide pour « rien à signaler »', () => {
    const inconnu = famillesProchesDeLaLimite({ ...r21, styleCode: 'ZZ9' }, cascade());
    expect(inconnu.statut).toBe('style non documenté');
    expect(inconnu.familles).toEqual([]);
    expect(inconnu.raisons.length).toBeGreaterThan(0);
    const b30 = famillesProchesDeLaLimite(r21, { id: 'x', hopKey: 'beermaverick-cascade', moment: 'b30', grams: 20 });
    expect(b30.statut).toBe('non simulé');
    expect(b30.raisons[0]).toMatch(/b30/);
  });
  it('familles : levure et durée non renseignées sont dites (défauts de l’outil), pas cachées', () => {
    const f = famillesProchesDeLaLimite({ ...r21, yeastId: null }, { id: 'd', hopKey: 'beermaverick-cascade', moment: 'dryPost', grams: 80 });
    expect(f.raisons.join(' ')).toMatch(/Levure non renseignée : fermentis-us05 supposée/);
    expect(f.raisons.join(' ')).toMatch(/3 j supposés/);
  });
});
