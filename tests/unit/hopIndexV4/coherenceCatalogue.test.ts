// Voie d2-import-bm (#180) : cohérence des valeurs importées de Beer Maverick. Aucune valeur n'est inventée : un inconnu est null,
// jamais 0 ; chaque valeur a sa source (page, date de modification publiée, date de relevé) ; les liens entre houblons existent.
import { describe, expect, it } from 'vitest';
import bootstrap from '../../../src/data/hopBeerMaverickBootstrap.json';
import fichesBM from '../../../src/data/hopBeerMaverickFiches.json';
import { BM_AXES, BM_CLASSES_HSI, CATALOGUE } from '../../../src/domain/hopIndex/v4/data';

type Plage = [number, number] | null | undefined;
const PLAGES = (h: (typeof CATALOGUE)[number]): [string, Plage][] => [
  ['alpha', h.alpha], ['beta', h.beta], ['cohumulone', h.cohumulone],
  ['myrcene', h.oils.myrcene], ['humulene', h.oils.humulene], ['caryophyllene', h.oils.caryophyllene],
  ['farnesene', h.oils.farnesene], ['others', h.oils.others],
];
const ids = new Set(CATALOGUE.map((h) => h.id));
const fold = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');

describe('valeurs en plage', () => {
  it('min ≤ max, jamais négatif, jamais au-dessus de 100 %', () => {
    const fautes = CATALOGUE.flatMap((h) => PLAGES(h).flatMap(([nom, p]) => (p && !(p[0] >= 0 && p[0] <= p[1] && p[1] <= 100) ? [`${h.id} ${nom} ${JSON.stringify(p)}`] : [])));
    expect(fautes).toEqual([]);
  });
  it('cohumulone, farnésène et autres huiles : « 0-0 » est un inconnu (null), jamais une plage nulle', () => {
    const fautes = CATALOGUE.flatMap((h) => (['cohumulone', 'farnesene', 'others'] as const).flatMap((k) => {
      const p = k === 'cohumulone' ? h.cohumulone : h.oils[k];
      return p && p[0] === 0 && p[1] === 0 ? [`${h.id} ${k}`] : [];
    }));
    expect(fautes).toEqual([]);
  });
  it('« 0-1 % » reste une vraie plage (Nelson Sauvin : farnésène 0–1 %, cohumulone 20–25 %)', () => {
    const n = CATALOGUE.find((h) => h.id === 'beermaverick-nelson-sauvin')!;
    expect(n.oils.farnesene).toEqual([0, 1]);
    expect(n.cohumulone).toEqual([20, 25]);
    expect(n.oils.others).toEqual([6, 49]);
    expect(n.purpose).toBe('aroma');
  });
  it('les composants de l\'huile ne dépassent pas 100 % en minimum (2 pages de la source font exception, dites ici)', () => {
    // Apolon (101) et Lemondrop (116) : leur « All Others » est aussi illisible ("0--1%", "0--16%") ; la page se contredit, la source est gardée telle quelle.
    const EXCEPTIONS = new Set(['beermaverick-apolon', 'beermaverick-lemondrop']);
    const depassent = CATALOGUE.filter((h) => {
      const mins = [h.oils.myrcene, h.oils.humulene, h.oils.caryophyllene, h.oils.farnesene, h.oils.others].map((p) => p?.[0] ?? 0);
      return mins.reduce((a, b) => a + b, 0) > 100;
    }).map((h) => h.id);
    expect(depassent.filter((i) => !EXCEPTIONS.has(i))).toEqual([]);
    expect(depassent.sort()).toEqual([...EXCEPTIONS].sort());
  });
});

describe('bloc bm : sources et liens', () => {
  const avecBm = CATALOGUE.filter((h) => h.bm);
  it('les 318 houblons ont leur bloc, avec date de relevé, et une date de modification ISO ou null (non publiée)', () => {
    expect(avecBm).toHaveLength(318);
    for (const h of avecBm) {
      expect(h.url).toMatch(/^https:\/\/beermaverick\.com\/hop\/[^/]+\/$/);
      expect(h.bm!.releve).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(h.bm!.modifiee === null || /^\d{4}-\d{2}-\d{2}$/.test(h.bm!.modifiee)).toBe(true);
    }
  });
  it('les substituts et accords reliés existent dans le catalogue, jamais le houblon lui-même', () => {
    const fautes: string[] = [];
    for (const h of avecBm) for (const l of [...(h.bm!.substituts ?? []), ...(h.bm!.accords ?? []).map(([x]) => x)]) {
      if (typeof l === 'string') { if (!ids.has(`beermaverick-${l}`) || `beermaverick-${l}` === h.id) fautes.push(`${h.id} → ${l}`); }
      else if (!l.name.trim()) fautes.push(`${h.id} : nom vide`);
    }
    expect(fautes).toEqual([]);
  });
  it('un lien non résolu garde son nom ; la part non résolue reste faible (≤ 5 %)', () => {
    const tous = avecBm.flatMap((h) => [...(h.bm!.substituts ?? []), ...(h.bm!.accords ?? []).map(([x]) => x)]);
    const non = tous.filter((l): l is { name: string } => typeof l !== 'string');
    expect(tous.length).toBeGreaterThan(900);
    expect(non.length).toBe(28);
    expect(non.every((l) => l.name.length > 0)).toBe(true);
    expect(non.length / tous.length).toBeLessThanOrEqual(0.05);
  });
  it('accords : nombres de bières entiers et positifs ; substituts : une liste vide est une réponse (« aucun »), pas un manque', () => {
    for (const h of avecBm) for (const [, n] of h.bm!.accords ?? []) expect(Number.isInteger(n) && n > 0).toBe(true);
    expect(avecBm.filter((h) => h.bm!.substituts?.length === 0).length).toBe(101);
    expect(avecBm.filter((h) => h.bm!.substituts === null).length).toBe(0);
  });
  it('profil d\'arôme : 9 axes entiers de 0 à 5, jamais tout à zéro (tout à zéro = pas de valeurs = null)', () => {
    const profils = avecBm.map((h) => h.bm!.arome).filter((a): a is NonNullable<typeof a> => a !== null);
    expect(profils.length).toBe(181);
    for (const a of profils) {
      expect(a).toHaveLength(BM_AXES.length);
      expect(a.every((x) => Number.isInteger(x) && x >= 0 && x <= 5)).toBe(true);
      expect(a.some((x) => x > 0)).toBe(true);
    }
  });
  it('indice de stockage : pourcentage 0–100, classe connue, indice min ≤ max', () => {
    const hsi = avecBm.map((h) => h.bm!.hsi).filter((x): x is NonNullable<typeof x> => x !== null);
    expect(hsi.length).toBe(71);
    for (const [pct, rang, min, max] of hsi) {
      expect(pct >= 0 && pct <= 100).toBe(true);
      expect(BM_CLASSES_HSI[rang]).toBeDefined();
      expect(min).toBeLessThanOrEqual(max);
    }
  });
});

describe('alias', () => {
  it('aucun alias répété dans une même variété ; un alias égal au nom est un fait de la source (code international = nom), liste fermée', () => {
    const repetes = CATALOGUE.filter((h) => { const l = h.aliases.map(fold); return new Set(l).size !== l.length; }).map((h) => h.id);
    expect(repetes).toEqual([]);
    // BRU-1, CTZ, HBC 586, HORT 9909, HPA-016, X-13459 : Beer Maverick écrit le même code comme nom et comme « International Code ». Laissés tels quels (le moteur lit les alias).
    const egaux = CATALOGUE.filter((h) => h.aliases.map(fold).includes(fold(h.name))).map((h) => h.id).sort();
    expect(egaux).toEqual(['beermaverick-bru-1', 'beermaverick-ctz', 'beermaverick-hbc-586', 'beermaverick-hort9909', 'beermaverick-hpa-016', 'beermaverick-x13459']);
  });
  it('un code partagé entre deux variétés est un fait de la source (même code international pour la version GR et US) : liste fermée, aucun nouveau', () => {
    const parCode = new Map<string, string[]>();
    for (const h of CATALOGUE) for (const a of new Set(h.aliases.map(fold))) parCode.set(a, [...(parCode.get(a) ?? []), h.id]);
    const partages = [...parCode].filter(([, l]) => l.length > 1).map(([k]) => k).sort();
    // Relevés le 26.10 dans le cache du 2026-09-08 ; usda56013 (Cascade et Taiheke) et hal/tet sont à vérifier à la source.
    expect(partages).toEqual(['661313', 'bgo', 'c9a', 'hal', 'hmg', 'hpa016', 'nbr', 'per', 'saz', 'tet', 'usda56013', 'wfb135']);
  });
});

describe('bootstrap : chaque valeur porte sa source et son reçu', () => {
  const fiches = fichesBM as unknown as { id: string; source: { reference: string; kind: string; author: string }; retrievedAt: string; sha256: string; modifiedAt: string | null;
    cohumulone: { min: number; max: number; raw: string } | null; farnesene: { min: number; max: number; raw: string } | null }[];
  it('318 dossiers, un par variété, même ordre d\'identifiants que hopVarieties', () => {
    expect(fiches.map((f) => f.id)).toEqual((bootstrap as unknown as { hopVarieties: { id: string }[] }).hopVarieties.map((v) => v.id));
  });
  it('source Beer Maverick (communauté) avec adresse de la page, date de relevé et reçu sha256', () => {
    for (const f of fiches) {
      expect(f.source.reference).toBe(`https://beermaverick.com/hop/${f.id.replace('beermaverick-', '')}/`);
      expect(f.source.author).toBe('Beer Maverick');
      expect(f.source.kind).toBe('community');
      expect(f.retrievedAt).toMatch(/^2026-09-0\dT/);
      expect(f.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
  });
  it('la valeur brute publiée est gardée à côté des nombres, et les nombres la reproduisent', () => {
    for (const f of fiches) for (const v of [f.cohumulone, f.farnesene]) {
      if (!v) continue;
      const m = v.raw.match(/^(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?%$/)!;
      expect(m).not.toBeNull();
      expect([v.min, v.max]).toEqual([Number(m[1]), m[2] === undefined ? Number(m[1]) : Number(m[2])]);
    }
  });
});
