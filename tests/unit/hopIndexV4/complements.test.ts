// Voie d3a-fusion (#180, D154) : les compléments fusionnés des 18 sources (src/data/hopV4/complements.json), leur chargeur
// (src/domain/hopIndex/v4/complements.ts) et le script qui les produit (scripts/collecte-hop/fusion.mjs).
// Décision de l'utilisateur (26.10) : toutes les sources entrent dans complements.json ; `diffusion` reste dans la table, pour la trace.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import brut from '../../../src/data/hopV4/complements.json';
import protoData from '../../../src/data/hopV4/proto-data.json';
import { chargerComplements, complementsCharges, enveloppeDe, lireComplements, valeursDe, type ComplementsBrut } from '../../../src/domain/hopIndex/v4/complements';

const racine = resolve(__dirname, '../../..');
const C = brut as unknown as ComplementsBrut;
const idsCatalogue = new Set((protoData.varieties as { id: string }[]).map((v) => v.id));
const sha = (p: string) => createHash('sha256').update(readFileSync(resolve(racine, p))).digest('hex');
const FICHIERS = ['src/data/hopV4/complements.json', 'src/data/hopV4/complements-non-rattachees.json', 'work/missions/2026-10-25-integration-houblons/voies/d3a-fusion/rapport.md'];

describe('cohérence de complements.json', () => {
  it('chaque variété est du catalogue ; chaque fiche et chaque raison existent', () => {
    for (const [id, v] of Object.entries(C.varietes)) {
      expect(idsCatalogue.has(id), id).toBe(true);
      for (const f of v.f) expect(C.sources[f[0]], `${id} source`).toBeTruthy();
      for (const c of Object.values(v.c)) for (const [fi, , , code] of c.v) {
        expect(v.f[fi], `${id} fiche ${fi}`).toBeTruthy();
        if (code) expect(C.raisons[code], `${id} ${code}`).toBeTruthy();
      }
    }
  });
  it('min ≤ max partout où les deux existent, dans l\'enveloppe comme dans les valeurs valides', () => {
    for (const [id, v] of Object.entries(C.varietes)) for (const [champ, c] of Object.entries(v.c)) {
      if (c.e && c.e[0] != null && c.e[1] != null) expect(c.e[0], `${id} ${champ} enveloppe`).toBeLessThanOrEqual(c.e[1]);
      for (const [, min, max, code] of c.v) {
        expect(min != null || max != null, `${id} ${champ} valeur vide (un inconnu est absent)`).toBe(true);
        if (!code && min != null && max != null) expect(min, `${id} ${champ}`).toBeLessThanOrEqual(max);
      }
    }
  });
  it('l\'enveloppe est exactement du plus bas au plus haut des valeurs valides : aucune valeur valide hors bornes, aucune moyenne', () => {
    let nb = 0;
    for (const [id, v] of Object.entries(C.varietes)) for (const [champ, c] of Object.entries(v.c)) {
      const ok = c.v.filter((x) => !x[3]);
      if (!ok.length) { expect(c.e, `${id} ${champ} sans valeur valide`).toBeUndefined(); continue; }
      const mins = ok.map((x) => x[1]).filter((x): x is number => x != null);
      const maxs = ok.map((x) => x[2]).filter((x): x is number => x != null);
      expect(c.e, `${id} ${champ}`).toEqual([mins.length ? Math.min(...mins) : null, maxs.length ? Math.max(...maxs) : null]);
      nb++;
    }
    expect(nb).toBeGreaterThan(2000);
  });
  it('les valeurs suspectes ou hors enveloppe sont gardées avec leur raison, jamais dans l\'enveloppe', () => {
    let suspects = 0;
    let hors = 0;
    for (const v of Object.values(C.varietes)) for (const c of Object.values(v.c)) for (const x of c.v) {
      if (!x[3]) continue;
      if (C.raisons[x[3]][0] === 'suspect') suspects++; else hors++;
    }
    expect(suspects).toBeGreaterThan(0);
    expect(hors).toBeGreaterThan(0);
    const cf = lireComplements(C).valeursDe('beermaverick-admiral', 'huile').find((x) => x.source.id === 'charlesfaram');
    expect(cf?.suspect).toBe(true);
    expect(cf?.horsEnveloppe).toBe(true);
  });
  it('les 18 sources sont dans la table, avec leur diffusion et ce qui a été lu ; les restreintes y sont aussi (décision du 26.10)', () => {
    expect(C.sources).toHaveLength(18);
    for (const s of C.sources) {
      expect(['libre', 'restreinte', 'inconnue']).toContain(s.diffusion);
      expect(s.lu.length, s.id).toBeGreaterThan(20);
    }
    const restreintes = C.sources.filter((s) => s.diffusion === 'restreinte').map((s) => s.id).sort();
    expect(restreintes).toEqual(['hopsteiner', 'johnihaas']);
    for (const id of restreintes) expect(C.sources.find((s) => s.id === id)?.decision).toContain('pas de problème');
    const utilisees = new Set(Object.values(C.varietes).flatMap((v) => v.f.map((f) => C.sources[f[0]].id)));
    expect(utilisees.has('hopsteiner') && utilisees.has('johnihaas')).toBe(true);
    expect(C.sources.filter((s) => s.diffusion === 'libre').map((s) => s.id).sort()).toEqual(['hopdatabase', 'hopsjson', 'usda']);
  });
  it('une valeur d\'une source vient de son URL : toute fiche a une URL de l\'hôte de sa source (ou de l\'agrégat)', () => {
    for (const v of Object.values(C.varietes)) for (const [si, url] of v.f) {
      expect(url, C.sources[si].id).toMatch(/^https:\/\//);
    }
  });
});

describe('valeurs fausses repérées par d3b : hors de l\'enveloppe', () => {
  const m = lireComplements(C);
  const de = (id: string, champ: Parameters<typeof m.valeursDe>[1], source: string) => m.valeursDe(id, champ).filter((x) => x.source.id === source);
  it('Hopslist, Nelson Sauvin : farnésène 10,7 = son caryophyllène → suspect ; l\'enveloppe ne monte plus à 10,7', () => {
    const v = de('beermaverick-nelson-sauvin', 'farnesene', 'hopslist');
    expect(v.map((x) => [x.min, x.max])).toEqual([[10.7, 10.7]]);
    expect(v[0].suspect).toBe(true);
    expect(v[0].horsEnveloppe).toBe(true);
    expect(v[0].raison).toBe('même valeur que caryophyllène');
    expect(m.enveloppeDe('beermaverick-nelson-sauvin', 'farnesene')![1]!).toBeLessThan(5);
  });
  it('HPA, fiches PDF appariées par l\'ordre du flux : farnésène de Citra et de Mosaic, myrcène de Mosaic → suspects', () => {
    for (const [id, champ, bornes] of [['beermaverick-citra', 'farnesene', [6, 8]], ['beermaverick-mosaic', 'farnesene', [5, 8]], ['beermaverick-mosaic', 'myrcene', [1, 1.5]]] as const) {
      const v = de(id, champ, 'hpa');
      expect(v.map((x) => [x.min, x.max]), `${id} ${champ}`).toContainEqual([...bornes]);
      const x = v.find((y) => y.min === bornes[0] && y.max === bornes[1])!;
      expect(x.suspect, `${id} ${champ}`).toBe(true);
      expect(x.horsEnveloppe).toBe(true);
    }
    expect(m.enveloppeDe('beermaverick-citra', 'farnesene')![1]!).toBeLessThan(5);
    expect(m.enveloppeDe('beermaverick-mosaic', 'farnesene')![1]!).toBeLessThan(5);
    expect(m.enveloppeDe('beermaverick-mosaic', 'myrcene')![0]!).toBeGreaterThan(10);
  });
  it('aucune valeur d\'une fiche PDF appariée ne reste dans l\'enveloppe sans recouper une autre source', () => {
    for (const id of m.ids()) for (const champ of Object.keys(C.varietes[id].c) as Parameters<typeof m.valeursDe>[1][]) {
      const l = m.valeursDe(id, champ);
      const valides = l.filter((x) => !x.horsEnveloppe);
      const autres = (x: (typeof l)[number]) => valides.filter((y) => y.source.id !== x.source.id);
      for (const x of valides.filter((y) => y.source.id === 'hpa' && (y.url ?? '').endsWith('.pdf'))) {
        expect(autres(x).some((y) => (x.min ?? 0) <= (y.max ?? Infinity) && (y.min ?? 0) <= (x.max ?? Infinity)), `${id} ${champ} ${x.min}-${x.max}`).toBe(true);
      }
    }
  });
  it('les règles d\'aberrance écartent des valeurs, avec leur raison, et la copie nomme le composé copié', () => {
    const raisons = new Set<string>();
    for (const v of Object.values(C.varietes)) for (const c of Object.values(v.c)) for (const x of c.v) if (x[3]) raisons.add(x[3]);
    expect(raisons.has('s-ecart')).toBe(true);
    expect(raisons.has('s-pdf-ordre')).toBe(true);
    expect([...raisons].some((r) => r.startsWith('s-copie-'))).toBe(true);
    expect(C.raisons['s-ecart'][1]).toBe('écart aux autres sources');
  });
});

describe('le chargeur', () => {
  const mini: ComplementsBrut = {
    version: 1,
    sources: [
      { id: 'a', nom: 'Source A', hote: 'a.example', type: null, diffusion: 'libre', lu: 'MIT, notice à conserver', releve: '2026-10-26' },
      { id: 'b', nom: 'Source B', hote: 'b.example', type: null, diffusion: 'restreinte', lu: 'accord écrit demandé par la page de conditions', releve: null },
    ],
    champs: { linalol: { libelle: 'linalol', unite: '%', base: '% de l\'huile' } },
    raisons: { 'h-unite-absente': ['hors', 'unité non écrite par la source'], 's-sup100': ['suspect', 'pourcentage au-dessus de 100'] },
    varietes: {
      v1: {
        f: [[0, 'https://a.example/v1', 2024], [1, 'https://b.example/v1', null], [1, 'https://b.example/v1-bis', null]],
        c: { linalol: { e: [0.3, 0.9], v: [[0, 0.3, 0.6], [1, 0.5, 0.9], [2, 12, 13, 'h-unite-absente']] } },
      },
      v2: { f: [[1, 'https://b.example/v2', null]], c: { linalol: { e: [null, 2], v: [[0, null, 2]] } } },
    },
  };
  const m = lireComplements(mini);
  it('rend les valeurs par source, avec URL, année, hors enveloppe et raison', () => {
    const v = m.valeursDe('v1', 'linalol');
    expect(v.map((x) => [x.source.id, x.min, x.max, x.annee, x.url, x.horsEnveloppe])).toEqual([
      ['a', 0.3, 0.6, 2024, 'https://a.example/v1', false],
      ['b', 0.5, 0.9, null, 'https://b.example/v1', false],
      ['b', 12, 13, null, 'https://b.example/v1-bis', true],
    ]);
    expect(v[2].raison).toBe('unité non écrite par la source');
    expect(v[2].suspect).toBe(false);
  });
  it('rend l\'enveloppe, une borne manquante restant null (jamais 0), et rien pour l\'inconnu', () => {
    expect(m.enveloppeDe('v1', 'linalol')).toEqual([0.3, 0.9]);
    expect(m.enveloppeDe('v2', 'linalol')).toEqual([null, 2]);
    expect(m.enveloppeDe('v1', 'geraniol')).toBeNull();
    expect(m.enveloppeDe('absente', 'linalol')).toBeNull();
    expect(m.valeursDe('absente', 'linalol')).toEqual([]);
    expect(m.ids()).toEqual(['v1', 'v2']);
  });
  it('charge à la demande : rien avant, puis le vrai fichier, un seul chargement partagé', async () => {
    expect(complementsCharges()).toBeNull();
    expect(valeursDe('beermaverick-citra', 'alpha')).toEqual([]);
    expect(enveloppeDe('beermaverick-citra', 'alpha')).toBeNull();
    const p = chargerComplements();
    expect(chargerComplements()).toBe(p);
    const c = await p;
    expect(complementsCharges()).toBe(c);
    expect(c.ids().length).toBeGreaterThan(200);
    const e = enveloppeDe('beermaverick-citra', 'alpha');
    expect(e && e[0]! >= 8 && e[1]! <= 16).toBe(true);
    expect(valeursDe('beermaverick-citra', 'alpha').length).toBeGreaterThan(3);
    expect(new Set(valeursDe('beermaverick-citra', 'alpha').map((x) => x.source.id)).size).toBeGreaterThan(3);
  });
});

describe('le moteur et le démarrage ne touchent pas aux compléments', () => {
  const lister = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? lister(p) : /\.(ts|tsx)$/.test(f) ? [p] : []; });
  it('seul le chargeur importe complements.json ; le moteur et le démarrage ne passent pas par lui ; aucun fichier de src n\'importe src/data/hopSources', () => {
    const fichiers = [...lister(resolve(racine, 'src')), ...lister(resolve(racine, 'functions/src'))];
    const rel = (f: string) => f.slice(racine.length + 1).replace(/\\/g, '/');
    // d3b (#180) : le fichier de données n'est lu que par le chargeur ; l'affichage passe par le chargeur, dans Comparer et la fiche seulement.
    const donnees = fichiers.filter((f) => /from\s+['"][^'"]*complements\.json['"]|import\(\s*['"][^'"]*complements\.json/.test(readFileSync(f, 'utf8')));
    expect(donnees.map(rel)).toEqual(['src/domain/hopIndex/v4/complements.ts']);
    const lecteurs = fichiers.filter((f) => /from\s+['"][^'"]*\/complements['"]/.test(readFileSync(f, 'utf8')));
    expect(lecteurs.map(rel).filter((f) => !/^src\/ui\/hopIndex\/(comparer|fiche)\//.test(f))).toEqual([]);
    const sources = fichiers.filter((f) => /hopSources/.test(readFileSync(f, 'utf8')) && !/complements\.ts$/.test(f));
    expect(sources.map((f) => f.slice(racine.length + 1).replace(/\\/g, '/'))).toEqual([]);
  });
});

describe('déterminisme du script de fusion', () => {
  it('deux passes donnent le même sha256 pour les trois sorties, identique à celui des fichiers écrits', () => {
    const passe = () => execFileSync(process.execPath, ['scripts/collecte-hop/fusion.mjs', '--sans-ecriture'], { cwd: racine, encoding: 'utf8', maxBuffer: 1 << 24 })
      .split('\n').filter((l) => / sha256 [0-9a-f]{64}/.test(l)).map((l) => l.match(/^(\S+) sha256 ([0-9a-f]{64})/)!.slice(1, 3).join(' '));
    const a = passe();
    const b = passe();
    expect(a).toHaveLength(3);
    expect(b).toEqual(a);
    expect(a).toEqual(FICHIERS.map((f) => `${f} ${sha(f)}`));
  }, 60_000);
});
