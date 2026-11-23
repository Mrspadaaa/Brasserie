// Voie d4-descripteurs (#180, D157) : les descripteurs d'arôme de chaque source entrent dans les familles du moteur, une source = une fiche.
// Avant la voie, seules Beer Maverick et Hopsteiner étaient lues : « Fiches lues : Galaxy 1 », alors que BarthHaas, Charles Faram, Crosby, HPA
// publient leurs mots (réclamation du brasseur, 26.10 : « les substituts de Galaxy semble pas super fiable »).
// L'oracle est lu dans les fichiers des sources (src/data/hopSources), pas dans le catalogue : il ne peut pas suivre une erreur du build.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import protoData from '../../../src/data/hopV4/proto-data.json';
import { CATALOGUE, descriptionsDe } from '../../../src/domain/hopIndex/v4/data';
import { FAMILIES } from '../../../src/domain/hopIndex/v4/families';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';

const lire = (id: string) => JSON.parse(readFileSync(resolve(__dirname, '../../../src/data/hopSources', `${id}.json`), 'utf8')) as { fiches: { nom: string; varietyId: string | null; listes?: Record<string, unknown> }[] };
const ecartees = new Set(
  (JSON.parse(readFileSync(resolve(__dirname, '../../../src/data/hopV4/complements-non-rattachees.json'), 'utf8')).fiches as { source: string; nom: string; raison: string }[])
    .filter((x) => /^écarté à la fusion/.test(x.raison)).map((x) => `${x.source}|${x.nom}`));
/** Les sources primaires (hors agrégats HopDatabase et hops-json) et la liste de mots qu'elles publient pour le houblon brut. */
const MOTS: Record<string, string> = {
  barthhaas: 'descripteurs', britishhops: 'descripteurs', bsg: 'aromes', charlesfaram: 'altRub', crosbyhops: 'aromes', freestylehops: 'descripteurs',
  hpa: 'descripteurs', johnihaas: 'descripteurs', nzhops: 'descripteursCouverture', usahops: 'aromes', yakimavalleyhops: 'aromes',
};
const AGREGATS = ['hopdatabase', 'hopsjson'];
const publie = (source: string, champ: string, varietyId: string) =>
  lire(source).fiches.some((f) => f.varietyId === varietyId && !ecartees.has(`${source}|${f.nom}`) && Array.isArray(f.listes?.[champ]) && (f.listes![champ] as unknown[]).length > 0);
const primaires = (varietyId: string) => Object.entries(MOTS).filter(([s, c]) => publie(s, c, varietyId)).map(([s]) => s);

const HOUBLONS = ['galaxy', 'nelson-sauvin', 'citra', 'motueka'].map((s) => `beermaverick-${s}`);
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });

describe('D157 : chaque source qui publie des descripteurs est une fiche lue par les familles', () => {
  for (const id of HOUBLONS) {
    const sources = primaires(id);
    it(`${id} : l'oracle trouve au moins deux sources primaires (sinon le test ne prouve rien)`, () => {
      expect(sources.length).toBeGreaterThanOrEqual(2);
    });
    it(`${id} : « fiches lues » compte Beer Maverick et chacune des ${sources.length} sources primaires`, () => {
      const lues = Math.max(...FAMILIES.map((f) => m.describeFamilies(id)[f].of));
      expect(lues).toBeGreaterThanOrEqual(1 + sources.length);
      expect(lues).toBeGreaterThanOrEqual(2);
    });
    it(`${id} : chaque source primaire laisse ses mots dans les descriptions du catalogue`, () => {
      const auteurs = new Set(CATALOGUE.find((h) => h.id === id)!.descriptions.map((d) => d.source.author));
      expect(auteurs.size).toBeGreaterThanOrEqual(1 + sources.length);
    });
  }
  it('une famille citée par deux sources indépendantes est « marquée » (Galaxy : agrumes BarthHaas absent, mais Crosby et HPA citent agrumes ; fruits à noyau cité par Charles Faram, HPA, Crosby)', () => {
    const g = m.describeFamilies('beermaverick-galaxy');
    expect(g.stoneFruit.sources).toBeGreaterThanOrEqual(3);
    expect(g.stoneFruit.level).toBe('marqué');
    expect(g.tropical.sources).toBeGreaterThanOrEqual(3);
  });
  it('le contexte « bière » de Charles Faram, s\'il est repris, ne compte pas dans les niveaux', () => {
    for (const id of HOUBLONS) {
      const h = CATALOGUE.find((x) => x.id === id)!;
      const bieres = h.descriptions.filter((d) => d.context === 'beer');
      // Une description « bière » ne change jamais le nombre de familles citées : on retire ces descriptions et on compare.
      const sans = creerMoteur({ catalogue: CATALOGUE.map((x) => (x.id === id ? { ...x, descriptions: x.descriptions.filter((d) => d.context !== 'beer') } : x)), stock: [] });
      for (const f of FAMILIES) expect(sans.describeFamilies(id)[f].sources).toBe(m.describeFamilies(id)[f].sources);
      expect(bieres.every((d) => d.source.author === 'Charles Faram')).toBe(true);
    }
  });
  it('forme compacte (D83) : dépliée, elle donne octet pour octet les descriptions complètes, et ré-encodée elle redonne la forme compacte', () => {
    const brut = protoData as unknown as { varieties: { id: string; descriptions: unknown[]; fiches?: number[][] }[]; descSources: [string, string, string, string][]; descMots: string[] };
    // La description complète attendue de Galaxy chez BarthHaas, écrite à la main (mots lus dans barthhaas.json, 5 descripteurs).
    const galaxy = CATALOGUE.find((h) => h.id === 'beermaverick-galaxy')!.descriptions.find((d) => d.source.author === 'BarthHaas')!;
    expect(JSON.stringify(galaxy)).toBe(JSON.stringify({
      text: 'Descripteurs de la fiche : Peach, Pineapple, Blueberry, Gooseberry, Black Currant', context: 'unspecified',
      source: { title: 'BarthHaas · fiche variété', author: 'BarthHaas', year: null, kind: 'manufacturer', reference: 'https://www.barthhaas.com',
        locator: 'Adresse de la fiche : voir les compléments (complements.json). La référence est le site de la source.' },
    }));
    let n = 0;
    for (const v of brut.varieties) {
      if (!v.fiches) continue;
      const h = CATALOGUE.find((x) => x.id === v.id)!;
      const depliees = h.descriptions.slice(v.descriptions.length);
      expect(JSON.stringify(depliees)).toBe(JSON.stringify(descriptionsDe(v.fiches, brut as never)));
      // Ré-encodage indépendant : source par (auteur, site), mots par texte.
      const recode = depliees.map((d) => [brut.descSources.findIndex(([a, , , r]) => a === d.source.author && r === d.source.reference), d.source.year ?? 0,
        ...d.text.replace('Descripteurs de la fiche : ', '').split(', ').map((m) => brut.descMots.indexOf(m))]);
      expect(recode).toEqual(v.fiches);
      n += depliees.length;
    }
    expect(n).toBeGreaterThan(500);
    // Le chargeur ne laisse pas le champ compact dans le catalogue.
    expect(CATALOGUE.every((h) => !('fiches' in h))).toBe(true);
  });
  it('les agrégats (HopDatabase, hops-json) ne comptent jamais plus d\'une fiche par houblon', () => {
    for (const h of CATALOGUE) {
      const communautaires = new Set(h.descriptions.filter((d) => d.source.kind === 'community' && d.source.author !== 'Beer Maverick').map((d) => `${d.source.author}|${d.source.reference}`));
      expect(communautaires.size).toBeLessThanOrEqual(1);
    }
    expect(AGREGATS.length).toBe(2);
  });
});
