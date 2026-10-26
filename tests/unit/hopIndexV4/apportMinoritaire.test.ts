// Voie g2d-apport-minoritaire : les trois options d'apport minoritaire de Suggérer (c rang seul, m effet si marquée, w effet pondéré).
// Chaque option : le défaut reste inchangé à l'octet, l'option fait ce qu'elle dit (Nelson Sauvin cite « végétal vert » dans 1 fiche sur 9), les barres ne changent que sous m et w.
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { CATALOGUE } from '../../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import { FAMILIES } from '../../../src/domain/hopIndex/v4/families';
import { marquee as marqueeBrut } from '../../../src/domain/hopIndex/v4/hops';
import { APPORTS_MINORITAIRES, partDesFiches as partBrute } from '../../../src/domain/hopIndex/v4/minoritaire';
import type { Recipe } from '../../../src/domain/hopIndex/v4/recipe';
import type { Voie } from '../../../src/domain/hopIndex/v4';

const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const R21C: Recipe = { name: 'Hazy du jeudi (21C)', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
const GRAND = { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['dryActive'] as const };
vi.setConfig({ testTimeout: 120_000 });
// Les lectures de fiches se font dans le contexte du moteur de ce fichier (comme les appels de m).
const marquee = (v: string, f: (typeof FAMILIES)[number]) => m.dans(() => marqueeBrut(v, f));
const partDesFiches = (v: string, f: (typeof FAMILIES)[number]) => m.dans(() => partBrute(v, f));
const NS = 'beermaverick-nelson-sauvin';
const ajout = (key: string, moment: 'b10' | 'dryActive' = 'dryActive', grams = 40) => ({ id: 'x', hopKey: key, moment, grams });
const parHoublon = (vs: Voie[]) => new Map(vs.filter((v) => v.type === 'ajouter').map((v) => [v.actions[0].hopKey, v]));
const position = (vs: Voie[], key: string) => vs.filter((v) => v.type === 'ajouter').findIndex((v) => v.actions[0].hopKey === key) + 1;

describe('le défaut reste inchangé : aucune des options, aucune clé de plus', () => {
  const base = m.proposeVoies(R21C, { citrus: 1 }, { assemblages: true, leviersLevure: true });
  it('sans option, ni overflowRang ni minoritaire dans la réponse', () => {
    const json = JSON.stringify(base);
    expect(json).not.toContain('"overflowRang"');
    expect(json).not.toContain('"minoritaire"');
  });
  it('option absente, undefined ou \'aucun\' : même réponse, à l\'octet près', () => {
    const a = JSON.stringify(base);
    expect(JSON.stringify(m.proposeVoies(R21C, { citrus: 1 }, { assemblages: true, leviersLevure: true, apportMinoritaire: undefined }))).toBe(a);
    expect(JSON.stringify(m.proposeVoies(R21C, { citrus: 1 }, { assemblages: true, leviersLevure: true, apportMinoritaire: 'aucun' }))).toBe(a);
  });
  it('additionEffect sans mode = additionEffect \'aucun\'', () => {
    expect(JSON.stringify(m.additionEffect(ajout(NS), R21C))).toBe(JSON.stringify(m.additionEffect(ajout(NS), R21C, 'aucun')));
  });
  it('les quatre valeurs sont nommées', () => { expect(APPORTS_MINORITAIRES).toEqual(['aucun', 'c', 'm', 'w']); });
});

describe('la part des fiches : le fait de départ', () => {
  it('Nelson Sauvin : « végétal vert » citée par une fiche sur neuf, pas marquée (D90)', () => {
    const p = partDesFiches('beermaverick-nelson-sauvin', 'green');
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(0.5);
    expect(marquee('beermaverick-nelson-sauvin', 'green')).toBe(false);
  });
  it('la part vaut 0 sans fiche citant la famille, jamais une part inventée ; et marquée équivaut à une part d\'au moins 0,5', () => {
    for (const h of CATALOGUE.slice(0, 60)) for (const f of FAMILIES) {
      const p = partDesFiches(h.id, f);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
      expect(marquee(h.id, f)).toBe(p > 0 && p >= 0.5);
    }
  });
  it('houblon inconnu : 0', () => { expect(partDesFiches('inconnu', 'green')).toBe(0); });
});

describe('(c) rang seul : le débordement d\'une famille non marquée ne compte plus dans le rang, les barres ne bougent pas', () => {
  // D99 : la référence est 'aucun' (l'ancien défaut) ; l'option absente vaut désormais 'c' au dry hop.
  const ref = m.proposeVoies(R21C, { citrus: 1 }, { ...GRAND, apportMinoritaire: 'aucun' }).voies;
  const c = m.proposeVoies(R21C, { citrus: 1 }, { ...GRAND, apportMinoritaire: 'c' }).voies;
  it('mêmes voies, mêmes effets, mêmes débordements affichés : seul l\'ordre peut changer', () => {
    expect(c.length).toBe(ref.length);
    const parId = new Map(c.map((v) => [v.id, v]));
    for (const v of ref) {
      const w = parId.get(v.id)!;
      expect(w).toBeDefined();
      expect(JSON.stringify(w.effect)).toBe(JSON.stringify(v.effect));
      expect(JSON.stringify(w.styleOverflow)).toBe(JSON.stringify(v.styleOverflow));
      expect(w.overflowTotal).toBe(v.overflowTotal);
      expect(w.distance.total).toBe(v.distance.total);
    }
  });
  it('à 10′ (plusieurs doses cherchées par houblon) : la dose gardée est la même, donc les barres aussi ; seul l\'ordre peut changer', () => {
    const o = { ...GRAND, moments: ['b10'] as const };
    const a = m.proposeVoies(R21C, { citrus: 1 }, o).voies, b = m.proposeVoies(R21C, { citrus: 1 }, { ...o, apportMinoritaire: 'c' }).voies;
    expect(b.map((v) => v.id).sort()).toEqual(a.map((v) => v.id).sort());
    const parId = new Map(b.map((v) => [v.id, v]));
    for (const v of a) expect(JSON.stringify(parId.get(v.id)!.effect)).toBe(JSON.stringify(v.effect));
    expect(b.map((v) => v.id)).not.toEqual(a.map((v) => v.id)); // l'ordre, lui, change
  });
  it('overflowRang = somme des débordements des familles marquées chez le houblon ajouté, jamais plus que overflowTotal', () => {
    for (const v of c.filter((x) => x.type === 'ajouter')) {
      const variete = m.hopRef(v.actions[0].hopKey)!.varietyId;
      const attendu = Math.round(v.styleOverflow.filter((o) => marquee(variete, o.family)).reduce((s, o) => s + o.crans, 0) * 100) / 100;
      expect(v.overflowRang).toBe(attendu);
      expect(v.overflowRang!).toBeLessThanOrEqual(v.overflowTotal + 1e-9);
    }
  });
  it('Nelson Sauvin remonte : son végétal vert (1 fiche sur 9) ne pèse plus dans le rang', () => {
    const v = parHoublon(c).get(NS)!, avant = parHoublon(ref).get(NS)!;
    expect(avant.overflowTotal).toBeGreaterThan(1); // le débordement mesuré par g2b : 3,88
    expect(v.overflowRang!).toBeLessThan(avant.overflowTotal);
    expect(position(c, NS)).toBeLessThan(position(ref, NS));
  });
  it('une voie sans houblon changé (levure) garde son débordement entier', () => {
    const r = m.proposeVoies(R21C, { citrus: 1 }, { leviersLevure: true, assemblages: false, apportMinoritaire: 'c' });
    for (const v of r.voies.filter((x) => x.type === 'levure' && x.actions.length === 0)) expect(v.overflowRang).toBe(v.overflowTotal);
  });
});

describe('(m) effet si marquée : une famille citée par moins de la moitié des fiches n\'apporte pas d\'effet établi', () => {
  it('Nelson Sauvin : végétal vert établi sans l\'option, non établi et « minoritaire » sous m (le reste identique)', () => {
    const a = m.additionEffect(ajout(NS), R21C, 'aucun')!, b = m.additionEffect(ajout(NS), R21C, 'm')!;
    expect(a.green.established).toBe(true);
    expect(a.green.central!).toBeGreaterThan(0);
    expect(b.green.established).toBe(false);
    expect(b.green.central).toBeNull();
    expect(b.green.minoritaire).toBe(true);
    for (const f of FAMILIES) {
      if (marquee('beermaverick-nelson-sauvin', f)) expect(b[f]).toEqual(a[f]);
      else expect(b[f].established).toBe(false);
    }
  });
  it('une famille sans aucune fiche n\'est pas « minoritaire » : elle n\'est pas citée', () => {
    const b = m.additionEffect(ajout(NS), R21C, 'm')!;
    for (const f of FAMILIES) if (b[f].minoritaire) expect(partDesFiches('beermaverick-nelson-sauvin', f)).toBeGreaterThan(0);
  });
  it('aucune voie n\'établit d\'effet par une famille non marquée ; le pool ne garde que des houblons qui portent la visée marquée', () => {
    const r = m.proposeVoies(R21C, { citrus: 1 }, { ...GRAND, apportMinoritaire: 'm' });
    for (const v of r.voies.filter((x) => x.type === 'ajouter')) {
      const variete = m.hopRef(v.actions[0].hopKey)!.varietyId;
      for (const f of FAMILIES) if (v.effect[f].established) expect(marquee(variete, f)).toBe(true);
      expect(v.effect.citrus.established).toBe(true); // une voie qui n'avance pas la visée n'est pas proposée
    }
  });
  it('Nelson Sauvin (agrumes citée mais pas marquée ?) : sa présence dans la liste suit la règle, sans effet inventé', () => {
    const r = m.proposeVoies(R21C, { citrus: 1 }, { ...GRAND, apportMinoritaire: 'm' });
    const v = parHoublon(r.voies).get(NS);
    if (v) expect(marquee('beermaverick-nelson-sauvin', 'citrus')).toBe(true);
    else expect(marquee('beermaverick-nelson-sauvin', 'citrus')).toBe(false);
  });
  it('le dry hop vrai (g2b) lit la même règle : chaque voie du groupe actif établit la visée', () => {
    const r = m.proposeVoies(R21C, { citrus: 1 }, { maxBuy: 400, limit: 40, buyLimit: 40, perHop: 100, assemblages: false, dryHop: true, apportMinoritaire: 'm' });
    expect(r.dryHop!.actif.length).toBeGreaterThan(0);
    for (const v of r.dryHop!.actif) expect(v.effect.citrus.established).toBe(true);
  });
});

describe('(w) effet pondéré : l\'effet d\'une famille est multiplié par la part des fiches qui la citent', () => {
  it('Nelson Sauvin : chaque effet = l\'effet d\'avant × la part, à l\'arrondi près', () => {
    const a = m.additionEffect(ajout(NS), R21C, 'aucun')!, b = m.additionEffect(ajout(NS), R21C, 'w')!;
    let verifies = 0;
    for (const f of FAMILIES) {
      expect(b[f].established).toBe(a[f].established);
      if (!a[f].established) { expect(b[f].central).toBeNull(); continue; }
      const p = partDesFiches('beermaverick-nelson-sauvin', f);
      expect(Math.abs(b[f].central! - a[f].central! * p)).toBeLessThanOrEqual(0.05 + 0.05 * p + 1e-9);
      expect(Math.abs(b[f].central!)).toBeLessThanOrEqual(Math.abs(a[f].central!) + 1e-9);
      verifies++;
    }
    expect(verifies).toBeGreaterThan(2);
    expect(b.green.central!).toBeLessThan(a.green.central! / 5); // 1 fiche sur 9 : l'effet est divisé par 9, à l'arrondi près
  });
  it('un houblon dont toutes les familles sont citées par toutes ses fiches garde l\'effet d\'avant', () => {
    const plein = CATALOGUE.find((h) => FAMILIES.some((f) => partDesFiches(h.id, f) === 1));
    expect(plein).toBeDefined();
    const f = FAMILIES.find((x) => partDesFiches(plein!.id, x) === 1)!;
    const a = m.additionEffect(ajout(plein!.id), R21C, 'aucun')!, b = m.additionEffect(ajout(plein!.id), R21C, 'w')!;
    expect(b[f].central).toBe(a[f].central);
  });
  it('aucune clé de plus dans la réponse (ni overflowRang ni minoritaire)', () => {
    const json = JSON.stringify(m.proposeVoies(R21C, { citrus: 1 }, { ...GRAND, apportMinoritaire: 'w' }));
    expect(json).not.toContain('"overflowRang"');
    expect(json).not.toContain('"minoritaire"');
  });
});

describe('Substituer v2 ne lit pas ces options', () => {
  it('substitution.ts n\'importe ni cites, ni l\'effet des voies (additionEffect, proposeVoies, effectOf)', () => {
    const src = readFileSync('src/domain/hopIndex/v4/substitution.ts', 'utf8');
    for (const mot of ['additionEffect', 'proposeVoies', 'effectOf', 'cites(', 'citations(']) expect(src).not.toContain(mot);
    expect(src).toContain('marquee'); // D90 (g2c) : sa seule lecture de la règle de moitié
  });
});
