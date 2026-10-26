// Entrée du rapport (lecture seule) : réemploie la règle de rattachement de l'app (hopDescriptorEvidence, termes de EXTRAPOLATION.axes)
// et citations() de hops.ts. Bundlée par rapport.mjs vers os.tmpdir(), jamais dans src/.
import { createHopExtrapolationCache, hopDescriptorEvidence } from '../../../../../functions/src/hopExtrapolationCore';
import { EXTRAPOLATION, varietyById } from '../../../../../src/domain/hopIndex/v4/data';
import { FAMILIES, FAMILY_NAMES } from '../../../../../src/domain/hopIndex/v4/families';
import { citations } from '../../../../../src/domain/hopIndex/v4/hops';

const HOPS: [string, string][] = [
  ['beermaverick-lotus', 'Lotus'],
  ['beermaverick-caliente', 'Caliente'],
  ['beermaverick-citra', 'Citra (et Citra cryo : même id de variété, stock « beermaverick-citra:cryo »)'],
  ['beermaverick-galaxy', 'Galaxy'],
  ['beermaverick-nelson-sauvin', 'Nelson Sauvin'],
];

// Mots de contrôle hors lexique (candidats, anglais ou français) : présents ou non dans les fiches, et rattachés ou non.
const CANDIDATS: Record<string, string[]> = {
  pepins: ['apple', 'pear', 'pomme', 'poire', 'pepin', 'pepins', 'pome', 'pomaceous', 'stone'],
  vegetal: ['green', 'vert', 'verte', 'vegetal', 'vegetale', 'vegetables', 'legume', 'legumes', 'cut grass'],
  herbace: ['herbal', 'herbe', 'herbes', 'herbace', 'herbacee', 'herbaceous', 'grassy', 'grass', 'hay', 'foin'],
  epice: ['spicy', 'spice', 'spices', 'epice', 'epicee', 'epices', 'pepper', 'poivre', 'clove', 'clou', 'cinnamon', 'cannelle'],
  terreux: ['earthy', 'earth', 'terreux', 'terre', 'soil', 'dirt', 'humus', 'woody', 'boise'],
  resine: ['pine', 'pin', 'resin', 'resinous', 'resineux', 'conifere', 'coniferous', 'piney'],
};

const terms = new Map((EXTRAPOLATION.axes as { id: string; terms: string[] }[]).map((a) => [a.id, a.terms]));
const termesDe = (f: string): string[] => terms.get(f) ?? [];
const normaliser = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const cache = createHopExtrapolationCache();

export function rapport() {
  const cat = varietyById();
  const sortie: Record<string, unknown> = {
    noms: Object.fromEntries(FAMILIES.map((f) => [f, FAMILY_NAMES[f]])),
    termes: Object.fromEntries(FAMILIES.map((f) => [f, termesDe(f)])),
  };
  const houblons: Record<string, unknown>[] = [];
  for (const [id, nom] of HOPS) {
    const v = cat.get(id);
    if (!v) { houblons.push({ id, nom, absent: true }); continue; }
    const lues = v.descriptions.filter((d) => d.context !== 'beer');
    const cit = citations(id);
    const familles = Object.fromEntries(FAMILIES.map((f) => {
      const ev = hopDescriptorEvidence(v, termesDe(f), cache);
      return [f, {
        fichesCitantes: ev.length,
        auteurs: ev.map((d) => d.source.author),
        statutCitations: cit[f].status,
        coherent: (ev.length > 0) === (cit[f].status === 'cité'),
      }];
    }));
    // Un mot de liste = un item de « Descripteurs de la fiche : a, b, c ». Rattachement de chaque item seul.
    const items = lues.flatMap((d, i) => {
      const liste = d.text.includes(':') ? d.text.slice(d.text.indexOf(':') + 1) : d.text;
      return liste.split(',').map((m) => m.trim()).filter(Boolean).map((mot) => {
        const seul = { ...v, descriptions: [{ ...d, text: mot }] };
        const rattaches = FAMILIES.filter((f) => hopDescriptorEvidence(seul, termesDe(f), cache).length > 0);
        return { fiche: i + 1, auteur: d.source.author, mot, rattachesA: rattaches };
      });
    });
    // Candidats hors lexique : présents dans une fiche lue (mot entier), et leur rattachement.
    const candidats = Object.entries(CANDIDATS).flatMap(([groupe, mots]) => mots.flatMap((m) => {
      const cherche = normaliser(m);
      const hits = items.filter((it) => (` ${normaliser(it.mot)} `).includes(` ${cherche} `));
      const fichesAvec = lues.filter((d) => (` ${normaliser(d.text)} `).includes(` ${cherche} `)).map((d) => d.source.author);
      return fichesAvec.length ? [{ groupe, mot: m, fiches: fichesAvec, rattache: hits.some((h) => h.rattachesA.length > 0), itemsNonRattaches: hits.filter((h) => h.rattachesA.length === 0).map((h) => h.mot) }] : [];
    }));
    houblons.push({
      id, nom,
      fichesLues: lues.length,
      sourcesDistinctes: new Set(lues.map((d) => `${d.source.author}|${d.source.reference}`)).size,
      textesLus: lues.map((d) => `${d.source.author} : ${d.text}`),
      familles,
      itemsNonRattaches: items.filter((it) => it.rattachesA.length === 0).map((it) => `${it.auteur} : ${it.mot}`),
      candidats,
    });
  }
  sortie.houblons = houblons;
  return sortie;
}
