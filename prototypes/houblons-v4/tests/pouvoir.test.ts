import './temoin'; // témoin négatif de check:engine (B3)
// Moteur « pouvoir aromatique » : contrôles de « Ce qui doit en sortir » (fils19-choix/MOTEUR-POUVOIR.md),
// plus la sortie par famille et tous les moments (consignes du pilote, 19.10, soir). Recette 16D S1
// (Nugget 46 g à 60′, US-05, 20 L) ; 4 g/L ; dry hop après fermentation sauf mention.
import { describe, expect, it } from 'vitest';
import dataFile from '../data/composes-houblon.json';
import {
  COMPOSES, FAMILIES, MOMENTS_POUVOIR, comparerComposes, comparerFamilles, pouvoirAjout, pouvoirRecette, profilParMoment, sensPlages, verifications,
  type AjoutPouvoir, type PouvoirAjout, type RecettePouvoir,
} from '../src/engine';
import { predictTriplet, profileOf, tripletOf, type MomentId } from '../src/engine/recipe';
import { s1Recipe } from '../src/pack/buildPack';

const CITRA = 'beermaverick-citra', CASCADE = 'beermaverick-cascade', GALAXY = 'beermaverick-galaxy', IDAHO7 = 'beermaverick-idaho-7';
const S1 = (yeastId = 'fermentis-us05'): RecettePouvoir => ({ ...s1Recipe(), yeastId });
const ajout = (hopKey: string, moment: MomentId = 'dryPost', gL = 4, extra: Partial<AjoutPouvoir> = {}): AjoutPouvoir =>
  ({ id: `${hopKey}@${moment}`, hopKey, moment, grams: gL * 20, ...(moment === 'dryPost' || moment === 'dryActive' ? { dureeJours: 3 } : {}), ...extra });
const seul = (hopKey: string, moment: MomentId = 'dryPost', gL = 4, recette = S1(), extra: Partial<AjoutPouvoir> = {}) => pouvoirAjout(ajout(hopKey, moment, gL, extra), recette);
const recette = (additions: AjoutPouvoir[], yeastId = 'fermentis-us05'): RecettePouvoir => ({ ...S1(yeastId), additions: [...s1Recipe().additions, ...additions] });
const mid = (p: (number | null)[]) => (p[0]! + p[1]!) / 2;
type Data = { varietes: Record<string, { huile: { valeurs: { plage: (number | null)[]; sources: string[] }[] }; composes: Record<string, { valeurs: { plage: (number | null)[]; sources: string[] }[] | null; raison?: string }>; mesuresEnBiere?: unknown[] }> };
const DATA = dataFile as unknown as Data;
const yche = (key: string, src: string, c?: string) => (c ? DATA.varietes[key].composes[c].valeurs! : DATA.varietes[key].huile.valeurs).find((e) => e.sources.includes(src))!.plage;

describe('Citra ≠ Cascade à 4 g/L en dry hop après fermentation (16D S1)', () => {
  const a = seul(CITRA), b = seul(CASCADE);

  it('4MMP : sur la base commune (Hopsteiner 2024), les plages ne se recouvrent pas, Citra au-dessus, à chaque seuil', () => {
    const ca = a.composes['4MMP'].baseCommune!, cb = b.composes['4MMP'].baseCommune!;
    expect(sensPlages(ca.concentration.plage, cb.concentration.plage)).toBe('a au-dessus');
    // Même bière, même source de seuil : le seuil divise les deux concentrations.
    expect(ca.rapportParSeuil.length).toBeGreaterThanOrEqual(4);
    ca.rapportParSeuil.forEach((s, i) => {
      expect(s.seuil).toBe(cb.rapportParSeuil[i].seuil);
      expect(sensPlages(s.plage, cb.rapportParSeuil[i].plage)).toBe('a au-dessus');
    });
    expect(ca.lecture.classe).toBe('au-dessus du seuil');
    // Citra : 10–38 µg/kg × 4 g/L × 70 % = 28–106 ng/L ; Cascade US : 2,4–3,8 → 6,7–10,6 ng/L.
    expect(ca.concentration.plage!.min).toBeCloseTo(28, 5);
    expect(cb.concentration.plage!.max).toBeCloseTo(10.64, 5);
  });

  it('4MMP : l’enveloppe de toutes les sources se recouvre (littérature Cascade 0,8–16,8 µg/kg) ; le moteur le dit', () => {
    expect(sensPlages(a.composes['4MMP'].concentration.plage, b.composes['4MMP'].concentration.plage)).toBe('recouvrement');
    expect(b.composes['4MMP'].teneur.plage!.max).toBe(16.8);
    expect(b.composes['4MMP'].teneur.base).toMatch(/littérature/);
    // Le lot de 2006 (11,1 µg/kg) atteint la borne basse de Citra : le lot pèse autant que la variété.
    expect(b.composes['4MMP'].lotsHorsPlage.join(' ')).not.toMatch(/kishimoto/); // 11,1 est dans l'enveloppe de littérature
  });

  it('linalol : Citra au-dessus de Cascade en central (≈ ×3 par gramme sur les fiches YCH) ; les plages se recouvrent, seul le sens est vérifié', () => {
    const la = a.composes.linalol, lb = b.composes.linalol;
    expect(sensPlages(la.concentration.plage, lb.concentration.plage)).toBe('recouvrement');
    expect(la.concentration.plage!.central!).toBeGreaterThan(lb.concentration.plage!.central!);
    // H §0 : ≈ ×3 par gramme au milieu des plages YCH (huile × linalol).
    const parGramme = (mid(yche(CITRA, 'H1')) * mid(yche(CITRA, 'H1', 'linalol'))) / (mid(yche(CASCADE, 'H2')) * mid(yche(CASCADE, 'H2', 'linalol')));
    expect(parGramme).toBeGreaterThan(3);
    expect(parGramme).toBeLessThan(4);
    expect(comparerComposes(a, b).linalol.facteurCentral!).toBeGreaterThan(3);
  });

  it('témoin V5.5 : la prédiction existante donne les mêmes agrumes aux deux houblons (39, 54, 55, 78), le pouvoir aromatique les sépare', () => {
    const v55 = (hopKey: string, moment: MomentId, gL: number) => {
      const r = { ...s1Recipe(), additions: [] };
      return profileOf(predictTriplet(tripletOf({ id: 't', hopKey, moment, grams: gL * 20 }, r), {})).citrus.central!;
    };
    for (const [moment, gL, attendu] of [['b10', 2, 39], ['b10', 8, 54], ['dryPost', 2, 55], ['dryPost', 8, 78]] as const) {
      expect(v55(CITRA, moment, gL)).toBe(v55(CASCADE, moment, gL));
      expect(Math.round(v55(CITRA, moment, gL))).toBe(attendu);
    }
    expect(v55(CITRA, 'dryPost', 4)).toBe(v55(CASCADE, 'dryPost', 4));
    expect(comparerFamilles(a, b).tropical.baseCommune).toBe('a au-dessus');
  });
});

describe('Galaxy et Idaho 7', () => {
  const g = seul(GALAXY), i = seul(IDAHO7);

  it('huile et linalol chiffrés quand les sources existent', () => {
    for (const p of [g, i]) {
      expect(p.huile.plage!.min).not.toBeNull();
      expect(p.huile.plage!.max).not.toBeNull();
      expect(p.composes.linalol.charge.plage!.min).toBeGreaterThan(0);
      expect(p.composes.linalol.concentration.plage!.max).toBeGreaterThan(0);
      expect(p.classeHopsteiner.some((k) => k.classe === 'high')).toBe(true);
    }
    expect(g.huile.plage!.min).toBe(1.8);
    expect(g.huile.plage!.max).toBe(5);
  });

  it('thiols en classe ou « inconnu », jamais 0', () => {
    // Galaxy : 4MMP > 10 µg/kg → charge ≥ 40 ng/L, borne haute non publiée ; 3MH non détecté.
    expect(g.composes['4MMP'].charge.plage!.min).toBe(40);
    expect(g.composes['4MMP'].charge.plage!.max).toBeNull();
    expect(g.composes['3MH'].teneur.plage).toBeNull();
    expect(g.composes['3MH'].teneur.inconnu).toMatch(/non détecté/);
    expect(g.composes.geraniol.teneur.inconnu).toMatch(/non publié/);
    // Idaho 7 : 4MMP présent, < 10 µg/kg (à confirmer) ; 3MH et 3M4MP : seulement leur somme.
    expect(i.composes['4MMP'].teneur.plage!.min).toBeNull();
    expect(i.composes['4MMP'].teneur.plage!.max).toBe(10);
    expect(i.composes['4MMP'].teneur.hypotheses.join(' ')).toMatch(/à confirmer/);
    for (const c of ['3MH', '3M4MP'] as const) {
      expect(i.composes[c].teneur.plage).toBeNull();
      expect(i.composes[c].teneur.inconnu).toMatch(/somme 3MH \+ 3M4MP/);
    }
  });
});

describe('Ajouts successifs', () => {
  const citra3 = ajout(CITRA, 'dryPost', 2, { id: 'citra', day: 7, dureeJours: 3 });
  const galaxy7 = ajout(GALAXY, 'dryPost', 2, { id: 'galaxy', day: 10, dureeJours: 7 });
  const idaho5 = ajout(IDAHO7, 'dryPost', 2, { id: 'idaho7', day: 10, dureeJours: 5 });

  it('Citra 3 j puis Galaxy 7 j : charges cumulées chiffrées, drapeau de durée, ordre et synergie inconnus', () => {
    const r = pouvoirRecette(recette([citra3, galaxy7]));
    const lin = r.composes.linalol;
    const parts = r.ajouts.map((p) => p.composes.linalol.charge.plage!);
    expect(lin.charge.plage!.min).toBeCloseTo(parts.reduce((s, p) => s + p.min!, 0), 6);
    expect(lin.charge.plage!.max).toBeCloseTo(parts.reduce((s, p) => s + p.max!, 0), 6);
    // 4MMP : borne haute de Galaxy non publiée → somme « au moins », au-dessus du seuil.
    expect(r.composes['4MMP'].concentration.plage!.min).toBeGreaterThan(0);
    expect(r.composes['4MMP'].concentration.plage!.minAuMoins).toBe(true);
    expect(r.composes['4MMP'].concentration.plage!.max).toBeNull();
    expect(r.composes['4MMP'].lecture.classe).toBe('au-dessus du seuil');
    const g = r.ajouts.find((p) => p.id === 'galaxy')!, c = r.ajouts.find((p) => p.id === 'citra')!;
    expect(g.drapeaux.find((d) => d.id === 'duree-longue')!.titre).toBe('Au-delà de 3 j : pas d’arôme mesuré en plus ; végétal et hop creep');
    expect(c.drapeaux.some((d) => d.id === 'duree-longue')).toBe(false);
    expect(r.drapeaux.find((d) => d.id === 'ordre')!.statut).toBe('inconnu');
    expect(r.drapeaux.find((d) => d.id === 'synergie')!.statut).toBe('inconnu');
    expect(r.drapeaux.find((d) => d.id === 'masquage')!.statut).toBe('inconnu');
    expect(r.contact).toMatchObject({ debut: 7, fin: 17, jours: 10 });
    expect(r.drapeaux.find((d) => d.id === 'saturation')!.statut).toMatch(/4 g\/L/);
  });

  it('Citra 3 j puis Idaho 7 5 j : même lecture, plus le drapeau géraniol → citronellol si la levure le documente', () => {
    const us05 = pouvoirRecette(recette([citra3, idaho5]));
    const i = us05.ajouts.find((p) => p.id === 'idaho7')!;
    expect(i.drapeaux.some((d) => d.id === 'duree-longue')).toBe(true);
    expect(us05.drapeaux.find((d) => d.id === 'ordre')!.statut).toBe('inconnu');
    expect(i.drapeaux.find((d) => d.id === 'geraniol-citronellol')!.statut).toBe('hors du cas documenté');
    // Dry hop en fermentation active : Pomona documente le glissement (« medium ») ; US-05 non.
    const actif = (a: AjoutPouvoir) => ({ ...a, moment: 'dryActive' as const });
    const pomona = pouvoirRecette(recette([actif(citra3), actif(idaho5)], 'lalbrew-pomona')).ajouts.find((p) => p.id === 'idaho7')!;
    const g = pomona.drapeaux.find((d) => d.id === 'geraniol-citronellol')!;
    expect(g.statut).toBe('documenté pour cette levure');
    expect(g.pourquoi).toMatch(/medium/);
    expect(g.pourquoi).toMatch(/0,5–1/);
    const us05actif = pouvoirRecette(recette([actif(citra3), actif(idaho5)])).ajouts.find((p) => p.id === 'idaho7')!;
    expect(us05actif.drapeaux.find((d) => d.id === 'geraniol-citronellol')!.statut).toBe('possible, non documenté pour cette levure');
    expect(us05actif.drapeaux.find((d) => d.id === 'hop-creep')!.statut).toBe('risque : levure vivante');
  });
});

describe('Une 16D', () => {
  it('le pouvoir aromatique est lu face au style (« faible et facultatif »), avec « perception en bière noire non documentée »', () => {
    const r = pouvoirRecette(recette([ajout(CITRA)]));
    expect(r.abv.plage).toEqual([6.3, 8]);
    expect(r.pouvoir.mention).toBe('Rapport au seuil, pas une intensité perçue.');
    expect(r.pouvoir.style.attendu).toMatch(/faible et facultatif/);
    expect(r.pouvoir.style.citation).toBe('Low earthy, herbal, or floral hop aroma optional.');
    expect(r.pouvoir.biereNoire).toMatch(/perception non documentée ; pars de ta dégustation/);
    expect(r.drapeaux.find((d) => d.id === 'biere-noire')!.titre).toBe('Perception en bière noire non documentée');
    // 4MMP de Citra : repère central ≥ ×10 (« au moins » : le Nugget à 60′ n'a pas de thiols chiffrés).
    expect(r.pouvoir.faceAuStyle.statut).toBe('peut-être hors du style');
    expect(r.pouvoir.faceAuStyle.composes).toContain('4MMP');
    expect(r.pouvoir.famillesNonDecrites).toEqual(expect.arrayContaining(['tropical', 'berries']));
    // L'alcool relève les seuils du linalol (×1 à ×2,5 entre 5 et 10 % vol.).
    const s = r.ajouts[1].composes.linalol.seuils.find((x) => x.abv === 4.9)!;
    expect(s.plage.min).toBe(83);
    expect(s.plage.max).toBeCloseTo(207.5, 6);
    // Sans ajout à cru, la recette S1 reste « autour du seuil », sans drapeau hors du style.
    expect(pouvoirRecette(S1()).pouvoir.faceAuStyle.statut).toBe('autour du seuil');
  });
});

describe('Signal par famille : Citra contre Cascade', () => {
  const a = seul(CITRA), b = seul(CASCADE);
  const cmp = comparerFamilles(a, b);

  it('tropical et petits fruits : Citra au-dessus de Cascade sans recouvrement (4MMP, base commune)', () => {
    for (const f of ['tropical', 'berries'] as const) {
      expect(cmp[f].aDominant).toBe('4MMP');
      expect(cmp[f].bDominant).toBe('4MMP');
      expect(cmp[f].baseCommune).toBe('a au-dessus');
      expect(cmp[f].central.sens).toBe('a');
      // Enveloppe de toutes les sources : recouvrement (littérature de Cascade), dit tel quel.
      expect(cmp[f].aSeuilEgal).toBe('recouvrement');
      expect(a.familles[f].mention).toMatch(/ni une intensité 0–100/);
    }
  });

  it('floral et agrumes : Citra au-dessus en central (linalol) ; les plages se recouvrent, le test le dit', () => {
    for (const f of ['floral', 'citrus'] as const) {
      expect(cmp[f].aDominant).toBe('linalol');
      expect(cmp[f].signaux).toBe('recouvrement');
      expect(cmp[f].central.sens).toBe('a');
    }
    expect(a.familles.citrus.incomplet.join(' ')).toMatch(/3M4MP/);
  });

  it('ce que Cascade a de plus : farnésène (×5 et plus) vers boisé, vert, herbacé ; humulène vers épicé ; géraniol en bière mesuré pour Cascade seulement', () => {
    const fa = a.composes.farnesene.charge.plage!.central!, fb = b.composes.farnesene.charge.plage!.central!;
    expect(fb / fa).toBeGreaterThanOrEqual(5);
    // Herbacé : seul marqueur, le farnésène, sans seuil → inconnu, avec la raison.
    for (const p of [a, b]) {
      expect(p.familles.herbal.signal).toBeNull();
      expect(p.familles.herbal.inconnu).toMatch(/farnésène : aucun seuil/);
      // Vert et boisé : dominés par le myrcène ; la part du farnésène reste inconnue.
      for (const f of ['green', 'resin'] as const) {
        expect(p.familles[f].dominant).toBe('myrcene');
        expect(p.familles[f].incomplet.join(' ')).toMatch(/farnésène/);
      }
    }
    expect(cmp.green.central.sens).toBe('a'); // myrcène : Citra un peu plus
    expect(cmp.spice.aDominant).toBe('humulene');
    expect(cmp.spice.central.sens).toBe('b'); // humulène : Cascade un peu plus (H §1.1)
    // Géraniol en bière : mesuré pour Cascade (82,8 µg/L à 2 g/L, Kishimoto) ; aucune mesure pour Citra dans H.
    expect(DATA.varietes[CITRA].mesuresEnBiere).toBeUndefined();
    expect(verifications().find((v) => v.id === 'kishimoto-geraniol')!.mesure.min).toBe(82.8);
    // Par la teneur, Citra porte autant ou plus de géraniol que Cascade en central : la mesure en bière ne se compare pas.
    expect(a.composes.geraniol.charge.plage!.central!).toBeGreaterThan(b.composes.geraniol.charge.plage!.central!);
  });

  it('à 60′ : l’écart de 4MMP se réduit (−91 %), α et IBU restent différents, « surtout de l’amertume »', () => {
    const a60 = seul(CITRA, 'b60'), b60 = seul(CASCADE, 'b60');
    const bc = (p: PouvoirAjout) => p.composes['4MMP'].baseCommune!.concentration.plage!;
    expect(bc(a60).max!).toBeCloseTo((bc(a).max! * 9) / 70, 6);
    expect(bc(b60).max!).toBeCloseTo((bc(b).max! * 9) / 70, 6);
    expect(bc(a60).max! - bc(b60).max!).toBeLessThan(bc(a).max! - bc(b).max!);
    expect(bc(a60).min).toBeNull(); // borne basse inconnue, jamais 0
    expect(a60.composes.myrcene.transfert.plage!.max).toBeLessThanOrEqual(1);
    expect(a60.amertume.alpha!.valeur).not.toBe(b60.amertume.alpha!.valeur);
    expect(a60.amertume.ibu!.valeur).toBeGreaterThan(b60.amertume.ibu!.valeur * 1.5);
    expect(a60.amertume.lecture).toMatch(/Surtout de l’amertume/);
    expect(a60.drapeaux.some((d) => d.id === 'amertume')).toBe(true);
  });

  it('à chaud et à froid les profils diffèrent : deux profils par variété', () => {
    const p = Object.fromEntries(profilParMoment(CITRA, 4, S1()).map((x) => [x.moment, x.pouvoir]));
    expect(p.dryPost.familles.tropical.lecture.classe).toBe('au-dessus du seuil');
    expect(p.b10.familles.tropical.lecture.classe).toBe('inconnu');
    expect(p.b10.familles.tropical.inconnu).toMatch(/10′ non mesurée/);
    expect(p.b60.familles.tropical.signal!.min).toBeNull();
    const lectures = (x: PouvoirAjout) => FAMILIES.map((f) => x.familles[f].lecture.classe).join('|');
    expect(lectures(p.b60)).not.toBe(lectures(p.dryPost));
    expect(lectures(p.b10)).not.toBe(lectures(p.dryPost));
    // Fermentation active : le géraniol perd sa borne basse (biotransformation, non chiffrée).
    expect(p.dryActive.composes.geraniol.concentration.plage!.min).toBeNull();
    expect(p.dryPost.composes.geraniol.concentration.plage!.min).toBeGreaterThan(0);
  });

  it('tous les moments sont couverts : 60′, 10′, whirlpool, dry hop actif, dry hop après fermentation', () => {
    expect(MOMENTS_POUVOIR).toEqual(['b60', 'b10', 'wp', 'dryActive', 'dryPost']);
    for (const key of [CITRA, CASCADE]) for (const { pouvoir } of profilParMoment(key, 4, S1())) for (const f of FAMILIES) {
      const s = pouvoir.familles[f];
      expect(s.signal !== null || !!s.inconnu).toBe(true);
    }
    // Whirlpool : 4MMP sur le repère le plus proche (−23 % à 90 °C), niveau [H] ; 3MH inconnu avec sa raison.
    const wp = seul(CITRA, 'wp');
    expect(wp.composes['4MMP'].transfert.base).toMatch(/repère le plus proche.*90 °C.*80 °C non mesuré/);
    expect(wp.composes['4MMP'].transfert.niveau).toBe('H');
    expect(wp.composes['3MH'].concentration.plage).toBeNull();
    expect(wp.composes['3MH'].concentration.inconnu).toMatch(/augmente à l'ébullition/);
    expect(wp.composes.linalol.transfert.plage).toMatchObject({ min: 60, max: 63 });
  });
});

describe('Aucune valeur inconnue n’est 0 ; chaque chiffre porte sa base, sa source et son niveau', () => {
  const varietes = Object.keys(DATA.varietes);

  it('données : chaque composé a des valeurs ou une raison, aucune plage à 0', () => {
    for (const k of varietes) {
      const v = DATA.varietes[k];
      expect(v.huile.valeurs.length).toBeGreaterThan(0);
      for (const c of COMPOSES) {
        const x = v.composes[c];
        expect(x, `${k} ${c}`).toBeDefined();
        if (x.valeurs === null) expect(x.raison, `${k} ${c}`).toBeTruthy();
        else for (const e of x.valeurs) for (const b of e.plage) expect(b === null || b > 0, `${k} ${c}`).toBe(true);
      }
    }
  });

  it('sorties : toute grandeur chiffrée a une base, des sources datées ou expliquées et un niveau ; aucun zéro', () => {
    const sorties: unknown[] = [];
    for (const k of varietes) for (const m of MOMENTS_POUVOIR) sorties.push(seul(k, m));
    sorties.push(pouvoirRecette(recette([ajout(CITRA, 'dryPost', 2, { day: 7, dureeJours: 3 }), ajout(GALAXY, 'dryPost', 2, { id: 'g', day: 10, dureeJours: 7 })])));
    sorties.push(pouvoirRecette(recette([ajout('beermaverick-citra:cryo', 'dryPost', 2)])), seul('beermaverick-saaz-cz', 'dryPost'), seul(CASCADE, 'dryPost', 4, S1(), { lot: 'CAS-2400' }));
    let n = 0;
    const walk = (o: unknown, chemin: string) => {
      if (Array.isArray(o)) return o.forEach((x, i) => walk(x, `${chemin}[${i}]`));
      if (!o || typeof o !== 'object') return;
      const r = o as Record<string, unknown>;
      if ('min' in r && 'max' in r && 'central' in r) for (const b of ['min', 'max', 'central']) {
        const x = r[b];
        expect(x === null || (typeof x === 'number' && x > 0 && Number.isFinite(x)), `${chemin}.${b} = ${x}`).toBe(true);
      }
      if ('plage' in r && 'unite' in r && 'base' in r) {
        n++;
        expect(r.base, chemin).toBeTruthy();
        if (r.plage) {
          expect(['P', 'F', 'S', 'H'], `${chemin}.niveau`).toContain(r.niveau);
          expect((r.sources as unknown[]).length, `${chemin}.sources`).toBeGreaterThan(0);
        } else expect(r.inconnu, `${chemin}.inconnu`).toBeTruthy();
      }
      if ('cle' in r && 'url' in r) {
        expect(r.url, chemin).toBeTruthy();
        expect(typeof r.annee === 'number' || !!r.anneeNote, `${chemin} : année ou raison`).toBe(true);
        expect(['P', 'F', 'S', 'H']).toContain(r.niveau);
      }
      for (const [k, v] of Object.entries(r)) walk(v, `${chemin}.${k}`);
    };
    sorties.forEach((s, i) => walk(s, `sortie${i}`));
    expect(n).toBeGreaterThan(1000);
  });

  it('cryo, lot, variété absente : inconnu avec la raison ; le lot remplace la plage', () => {
    const cryo = seul('beermaverick-citra:cryo');
    expect(cryo.chargeHuile.plage).toMatchObject({ min: 8, max: 24 }); // 2–6 mL/100 g × 4 g/L ÷ 10
    expect(cryo.composes.linalol.charge.plage).toBeNull();
    expect(cryo.composes.linalol.charge.inconnu).toMatch(/cryo/);
    expect(cryo.drapeaux.some((d) => d.id === 'cryo')).toBe(true);
    const lot = seul(CASCADE, 'dryPost', 4, S1(), { lot: 'CAS-2400' });
    expect(lot.composes.linalol.teneur.plage).toMatchObject({ min: 0.03, max: 0.03 });
    expect(lot.drapeaux.find((d) => d.id === 'hsi')!.statut).toMatch(/≤ 0,31/);
    expect(seul(CASCADE).drapeaux.find((d) => d.id === 'lots-hors-plage')!.pourquoi).toMatch(/CAS-2401.*0,02/);
    const saaz = seul('beermaverick-saaz-cz');
    expect(saaz.huile.plage).toBeNull();
    for (const f of FAMILIES) expect(saaz.familles[f].signal).toBeNull();
  });
});

describe('Vérification sur les mesures en bière (H §5, §7.4)', () => {
  const v = Object.fromEntries(verifications().map((x) => [x.id, x]));
  it('le calcul encadre le linalol et le 4MMP mesurés ; il sous-estime le 3MH (Lafontaine 2019) et le moteur le dit', () => {
    expect(v['kishimoto-linalol'].verdict).toBe('le calcul encadre la mesure');
    expect(v['lafontaine-4mmp'].verdictBaseCommune).toBe('le calcul tombe dans la mesure');
    expect(v['lafontaine-4mmp'].verdict).toBe('le calcul encadre la mesure');
    expect(v['lafontaine-3mh'].verdict).toBe('calcul sous la mesure');
  });
});
