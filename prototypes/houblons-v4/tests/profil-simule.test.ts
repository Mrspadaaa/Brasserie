import './temoin'; // témoin négatif de check:engine (B3)
// Moteur « profil aromatique simulé » (lot 21) : les contrôles demandés par le pilote (19.10, soir), sur la
// stout 16D S1 du lot 20 (Nugget 46 g à 60′, 20 L, dégustation « trop résineuse »).
import { describe, expect, it } from 'vitest';
import corr from '../../../src/data/hopV4/correspondance-familles.json';
import dataFile from '../../../src/data/hopV4/composes-houblon.json';
import {
  FAMILIES, MENTION_RAPPORT, MENTION_SIMULE, partExtraite, pointsSimules, simulerCas,
  type AjoutSimule, type CasSimule, type FamilyId, type MomentSimule,
} from '../../../src/domain/hopIndex/v4';
import { S1_TASTING, s1Recipe } from '../src/pack/buildPack';

const CITRA = 'beermaverick-citra', CASCADE = 'beermaverick-cascade', GALAXY = 'beermaverick-galaxy', IDAHO7 = 'beermaverick-idaho-7';
const US05 = 'fermentis-us05', POMONA = 'lalbrew-pomona';
const aj = (houblon: string, dose_gL: number, moment: MomentSimule, jours = 3, jourDebut?: number, id?: string): AjoutSimule =>
  ({ id: id ?? houblon, houblon, dose_gL, moment, jours, jourDebut: jourDebut ?? (moment === 'dryActive' ? 2 : moment === 'dryPost' ? 7 : null) });
const cas = (ajouts: AjoutSimule[], levure = US05, complet = false): CasSimule => simulerCas({ id: 't', titre: 't', ajouts, levure, recette: s1Recipe(), degustation: S1_TASTING, complet });
const seul = (h: string, m: MomentSimule, d = 4, jours = 3, levure = US05) => cas([aj(h, d, m, jours)], levure);
const AROME: FamilyId[] = ['citrus', 'tropical', 'floral', 'berries'];

describe('Citra ≠ Cascade en dry hop (4 g/L, après fermentation, 3 j)', () => {
  const a = seul(CITRA, 'dryPost'), b = seul(CASCADE, 'dryPost');
  it('le tropical et les agrumes de Citra au-dessus de ceux de Cascade, au centre et en crans', () => {
    for (const f of ['tropical', 'citrus'] as const) {
      expect(a.apres[f].centre).toBeGreaterThan(b.apres[f].centre * 1.4);
      expect(a.apres[f].crans!).toBeGreaterThan(b.apres[f].crans!);
    }
    // Le style 16D le dit : Citra sort du style sur le tropical et les agrumes, Cascade non.
    expect(a.drapeauxIds).toContain('hors-du-style');
    expect(b.drapeauxIds).not.toContain('hors-du-style');
    expect(a.apres.tropical.crans).toBe(4);
  });
  it('le profil est marqué simulé, le centre a sa bande, les vraies valeurs restent à côté', () => {
    const c = simulerCas({ id: 'c', titre: 'c', ajouts: [aj(CITRA, 4, 'dryPost')], levure: US05, recette: s1Recipe(), degustation: S1_TASTING });
    expect(c.simule).toBe(true);
    expect(c.mention).toBe(MENTION_SIMULE);
    // Bornes ordonnées partout, dégustation comprise ; jamais rognées à 100.
    let auDela = 0;
    for (const h of [CITRA, CASCADE, GALAXY, IDAHO7]) for (const m of ['b60', 'b10', 'wp', 'dryActive', 'dryPost'] as const) for (const d of [1, 8]) {
      const x = seul(h, m, d, 3, POMONA);
      for (const f of FAMILIES) {
        const v = x.apres[f];
        expect(v.bas, `${h} ${m} ${d} ${f}`).toBeLessThanOrEqual(v.centre);
        expect(v.centre, `${h} ${m} ${d} ${f}`).toBeLessThanOrEqual(v.haut);
        expect(Number.isFinite(v.haut)).toBe(true);
        if (v.haut > 100) auDela++;
      }
    }
    expect(auDela).toBeGreaterThan(0);
    // Le rapport au seuil n'est jamais l'intensité : il reste réel, avec sa mention, dans mesures[].
    const lin = c.mesures.find((m) => m.type === 'compose' && m.compose === 'linalol')!;
    expect(lin.mention).toBe(MENTION_RAPPORT);
    expect(lin.rapport!.plage!.min).toBeGreaterThan(0);
    expect(lin.rapport!.largeur).toBeGreaterThan(100); // l'ampleur réelle se voit (×100 et plus), jamais rognée
    expect(c.mesures.some((m) => m.type === 'alpha')).toBe(true);
    expect(c.mesures.some((m) => m.type === 'huile' && m.source.length > 0)).toBe(true);
    const mmp = c.mesures.find((m) => m.type === 'compose' && m.compose === '4MMP')!;
    expect(mmp.rapportBaseCommune!.plage!.min).toBeGreaterThan(1);
  });
});

describe('Le moment : « Pourquoi à 10′ pas à 60′ ? »', () => {
  const b60 = seul(CITRA, 'b60'), b10 = seul(CITRA, 'b10'), wp = seul(CITRA, 'wp'), dry = seul(CITRA, 'dryPost');
  it('à 60′, presque rien en arôme : écarts sous le seuil du style, surtout de l’amertume, avec un drapeau', () => {
    for (const f of FAMILIES) expect(b60.delta[f].crans).toBe('≈');
    for (const f of AROME) expect(dry.delta[f].centre).toBeGreaterThan(3 * b60.delta[f].centre);
    expect(b60.drapeauxIds).toContain('amertume');
    expect(b60.confiance.niveau).toBe('faible');
    const full = simulerCas({ id: 'b60', titre: 'b60', ajouts: [aj(CITRA, 4, 'b60')], levure: US05, recette: s1Recipe(), degustation: S1_TASTING });
    expect(full.drapeaux.find((d) => d.id === 'amertume')!.titre).toMatch(/amertume/);
    expect(full.mesures.find((m) => m.type === 'ibu')!.valeur as number).toBeGreaterThan(50);
  });
  it('10′ et le whirlpool au-dessus de 60′', () => {
    for (const f of AROME) {
      expect(b10.delta[f].centre).toBeGreaterThan(2 * b60.delta[f].centre);
      expect(wp.delta[f].centre).toBeGreaterThan(2 * b60.delta[f].centre);
    }
  });
});

describe('Dose et durée', () => {
  it('8 g/L donne moins que 2 × 4 g/L (saturation)', () => {
    for (const h of [CITRA, CASCADE]) {
      const d4 = seul(h, 'dryPost', 4), d8 = seul(h, 'dryPost', 8);
      for (const f of AROME) {
        expect(d8.delta[f].centre).toBeGreaterThan(d4.delta[f].centre);
        expect(d8.delta[f].centre).toBeLessThan(2 * d4.delta[f].centre);
      }
    }
  });
  it('pas de gain au-delà de 3 jours ; l’essentiel en 24 h', () => {
    const j3 = seul(CITRA, 'dryPost', 4, 3), j5 = seul(CITRA, 'dryPost', 4, 5), j7 = seul(CITRA, 'dryPost', 4, 7), j1 = seul(CITRA, 'dryPost', 4, 1);
    expect(j5.apres).toEqual(j3.apres);
    expect(j7.apres).toEqual(j3.apres);
    expect(partExtraite(1).centre).toBeGreaterThan(0.95);
    for (const f of AROME) expect(j1.apres[f].centre).toBeGreaterThan(0.9 * j3.apres[f].centre);
    expect(j7.drapeauxIds).toContain('duree-longue');
    expect(j3.drapeauxIds).not.toContain('duree-longue');
  });
  it('parJour : J0 vide, puis l’arôme monte et plafonne à 3 j de contact', () => {
    const c = simulerCas({ id: 'k3', titre: 'k3', ajouts: [aj(CITRA, 2, 'dryPost', 3, 7, 'citra'), aj(GALAXY, 2, 'dryPost', 7, 10, 'galaxy')], levure: US05, recette: s1Recipe(), degustation: S1_TASTING });
    expect(c.parJour.map((j) => j.jour)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(c.parJour[0].jourRecette).toBe(7);
    const trop = c.parJour.map((j) => j.familles.tropical.centre);
    expect(trop[1]).toBeGreaterThan(trop[0]);
    expect(trop[4]).toBeGreaterThan(trop[3]); // Galaxy entre à J+10 (jour 3)
    expect(trop[10]).toBe(trop[6]); // Galaxy : plus rien après 3 j de contact
    expect(trop[10]).toBe(c.apres.tropical.centre);
  });
});

describe('Deux ajouts : la saturation est partagée, l’ordre et la synergie inconnus', () => {
  const recetteK3 = simulerCas({ id: 'k3', titre: 'k3', ajouts: [aj(CITRA, 2, 'dryPost', 3, 7, 'citra'), aj(GALAXY, 2, 'dryPost', 7, 10, 'galaxy')], levure: US05, recette: s1Recipe(), degustation: S1_TASTING });
  const c2 = seul(CITRA, 'dryPost', 2), g2 = seul(GALAXY, 'dryPost', 2);
  it('les deux s’additionnent avec la saturation : plus que chacun, moins que la somme', () => {
    for (const f of AROME) {
      const d = recetteK3.delta[f].centre;
      expect(d).toBeGreaterThan(Math.max(c2.delta[f].centre, g2.delta[f].centre));
      expect(d).toBeLessThan(c2.delta[f].centre + g2.delta[f].centre);
      expect(recetteK3.saturation.facteur![f]!).toBeLessThan(1);
    }
    for (const id of ['ordre', 'synergie', 'masquage']) expect(recetteK3.drapeaux.find((x) => x.id === id)!.statut).toBe('inconnu');
    expect(recetteK3.drapeaux.some((x) => x.id === 'saturation-partagee')).toBe(true);
    expect(recetteK3.confiance.pourquoi.join(' ')).toMatch(/ordre, synergie et masquage inconnus/);
  });
  it('K5 : une paire à 2 + 2 g/L donne moins que la somme de deux ajouts seuls (2 g/L, et a fortiori 4 g/L)', () => {
    for (const autre of [GALAXY, IDAHO7, CASCADE]) {
      const p = cas([aj(CITRA, 2, 'dryPost', 3, 7, 'citra'), aj(autre, 2, 'dryPost', 3, 7, 'autre')]);
      const s2 = [seul(CITRA, 'dryPost', 2), seul(autre, 'dryPost', 2)], s4 = [seul(CITRA, 'dryPost', 4), seul(autre, 'dryPost', 4)];
      for (const f of AROME) {
        expect(p.delta[f].centre).toBeLessThan(s2[0].delta[f].centre + s2[1].delta[f].centre);
        expect(p.delta[f].centre).toBeLessThan(s4[0].delta[f].centre + s4[1].delta[f].centre);
        const parts = p.apportsParHoublon.reduce((s, x) => s + x.part[f], 0);
        expect(parts).toBeCloseTo(1, 1);
        expect(p.apportsParHoublon[0].seul[f]).toBeCloseTo(s2[0].delta[f].centre, 6);
      }
      expect(p.saturation.doseACru_gL).toBe(4);
      expect(p.saturation.dansZone).toBe(true);
      expect(p.drapeauxIds).toEqual(expect.arrayContaining(['synergie', 'masquage', 'saturation-partagee']));
    }
  });
});

describe('La levure : biotransformation simulée', () => {
  const k = (levure: string) => cas([aj(CITRA, 2, 'dryActive', 3, 2, 'citra'), aj(IDAHO7, 2, 'dryActive', 5, 5, 'idaho7')], levure);
  const pomona = k(POMONA), us05 = k(US05);
  it('Pomona : plus d’agrumes que US-05 en dry hop actif, avec une confiance faible', () => {
    expect(pomona.apres.citrus.centre).toBeGreaterThan(us05.apres.citrus.centre + 2);
    expect(pomona.confiance.niveau).toBe('faible');
    expect(pomona.confiance.pourquoi.join(' ')).toMatch(/biotransformation simulée par convention/);
    expect(pomona.biotransformation.geraniolCitronellol.centre).toBe(0.5);
    expect(us05.biotransformation.geraniolCitronellol.centre).toBe(0);
    expect(pomona.drapeauxIds).toContain('biotransformation-geraniol');
    const i7 = pomona.biotransformation.parAjout.find((x) => x.ajout === 'idaho7')!;
    expect(i7.citronellol_ugL!.centre).toBeGreaterThan(0);
  });
  it('après fermentation, la levure ne change rien au profil simulé', () => {
    const a = cas([aj(IDAHO7, 4, 'dryPost')], POMONA), b = cas([aj(IDAHO7, 4, 'dryPost')], US05);
    expect(a.apres).toEqual(b.apres);
    expect(a.biotransformation.actif).toBe(false);
  });
});

describe('Houblon sans données, dégustation, déterminisme, table', () => {
  it('un houblon sans données de composés : forme des fiches seules, confiance faible, raison écrite', () => {
    const s = seul('beermaverick-saaz-cz', 'dryPost');
    expect(s.confiance.niveau).toBe('faible');
    expect(s.confiance.pourquoi[0]).toMatch(/aucune donnée de composés ; forme des fiches seules/);
    expect(s.drapeauxIds).toContain('sans-composes');
    expect(FAMILIES.some((f) => s.delta[f].centre > 0)).toBe(true);
  });
  it('la dégustation du brasseur prime : résine « marquée », décalée par l’ajout', () => {
    const c = seul(CITRA, 'dryPost');
    expect(c.avant.resin).toMatchObject({ source: 'dégustation', centre: 83, crans: 4 });
    expect(c.apres.resin.centre).toBeCloseTo(83 + c.delta.resin.centre, 6);
  });
  it('résultat déterministe', () => {
    const run = () => JSON.stringify(simulerCas({ id: 'd', titre: 'd', ajouts: [aj(CITRA, 2, 'dryActive', 3, 2, 'c'), aj(GALAXY, 2, 'dryActive', 3, 2, 'g')], levure: POMONA, recette: s1Recipe(), degustation: S1_TASTING }));
    expect(run()).toBe(run());
  });
  it('l’ancre tient : Cascade 3,86 g/L, 24 h, 4,75 % vol. = 26 points d’agrumes (H22, vérifié par K)', () => {
    expect(pointsSimules(1e-9, 'citrus')).toBeGreaterThan(0);
    const c = simulerCas({ id: 'a', titre: 'a', ajouts: [{ houblon: CASCADE, dose_gL: 3.86, moment: 'dryPost', jours: 1 }], levure: US05,
      recette: { name: 'ancre', styleCode: '', volumeL: 20, og: 1.05, boilMin: 60, yeastId: US05, abv: 4.75, additions: [] }, complet: false });
    expect(c.apres.citrus.centre).toBeCloseTo(26, 1);
  });
  it('chaque poids de la table porte sa source ou « [convention] », et chaque source existe', () => {
    const sources = (dataFile as { sources: Record<string, unknown> }).sources;
    const liens = (corr as unknown as { liens: { composes: Record<string, { lien: string[]; familles: Record<string, { poids: number; chiffre: string }> }> } }).liens.composes;
    for (const [c, l] of Object.entries(liens)) {
      for (const s of l.lien) expect(sources[s], `${c} ${s}`).toBeDefined();
      const somme = Object.values(l.familles).reduce((s, x) => s + x.poids, 0);
      expect(somme, c).toBeCloseTo(1, 6);
      for (const x of Object.values(l.familles)) expect(x.chiffre).toMatch(/\[convention\]|H\d/);
    }
  });
});
