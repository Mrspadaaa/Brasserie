/**
 * Carnet d'idées : rattacher un texte au carnet le plus proche (repli local ; « ✻ Déjà un carnet proche », G21, G35).
 *
 * État de l'art (MISSION) : recherche floue sur des textes normalisés (NFD, sans accents), fuse.js (déjà présent) ; seuil réglé sur une
 * moitié des phrases et jugé sur l'autre (L20, critère A5). Purement lexical : aucun mot du métier ni gabarit (C2).
 * Score d'un carnet = somme, sur les jetons du texte, du meilleur mot du carnet qui lui ressemble (1 si même racine, sinon 1 − score
 * fuse.js, pour un jeton d'au moins 5 lettres), pondéré par la place du mot (`POIDS` : nom de l'idée 3, phrase, critère et façon 2,
 * reste du titre 1,5, articles et notes 1), divisée par √(nombre
 * de jetons) pour ne pas favoriser les longs textes.
 */
import Fuse from 'fuse.js';
import { jetons } from './analyseLocale';
import { nomArticle, type CarnetDoc } from './modele';

/** Seuil réglé sur la première moitié des phrases de `carnetsRattacher.test.ts` (A5), jugé sur la seconde. */
export const SEUIL_RATTACHER = 1.25;

/**
 * Poids des champs (pondération par champ, comme BM25F). Le premier mot du titre est le nom de l'idée (« Évier » dans « Évier inox »,
 * « Ventilation » dans « Ventilation de la salle de brassage ») ; les autres mots du titre la qualifient et pèsent moins (P9, vision 3 :
 * « tabouret inox » ne rejoint pas « Évier inox », « prochain brassage jeudi » ne rejoint pas Ventilation). Un mot qualifiant seul ne
 * passe le seuil que dans un texte d'un seul mot.
 */
export const POIDS = { nom: 3, titre: 1.5, phrase: 2, critere: 2, facon: 2, faconQualifiant: 1, article: 1, note: 1 } as const;

/** Le nom (premier mot) et les qualifiants d'un intitulé : « Hotte inox + extracteur » → hotte ; inox, extracteur. */
const nomEtQualifiants = (texte: string): [string | undefined, string] => {
  const [nom, ...reste] = jetons(texte);
  return [nom, reste.join(' ')];
};

interface MotIndexe { mot: string; carnetId: string; poids: number }

export interface Proposition { carnetId: string; titre: string; score: number; /** les mots en commun : la raison dite (« comme <titre du carnet> : <mots> ») */ mots: string[] }

const titreSansBanc = (t: string) => t.replace(/^ZZ TEST\s*[—–-]\s*/i, '');

/** Les mots d'un carnet, avec le poids de leur place. */
function motsDe(c: CarnetDoc): MotIndexe[] {
  const d = c.carnet;
  const [nom, qualifiants] = nomEtQualifiants(titreSansBanc(c.title));
  const sources: [string, number][] = [
    [qualifiants, POIDS.titre], [d.phrase, POIDS.phrase],
    ...d.criteres.map((k): [string, number] => [`${k.texte} ${k.caracteristique?.nom ?? ''}`, POIDS.critere]),
    /* une façon, comme le titre : son nom pèse, ses qualifiants (« inox » de « Hotte inox ») moins */
    ...d.facons.flatMap((f): [string, number][] => { const [n, q] = nomEtQualifiants(f.nom); return [[n ?? '', POIDS.facon], [q, POIDS.faconQualifiant]]; }),
    ...d.articles.map((a): [string, number] => [`${a.nom ?? ''} ${a.vendeur ?? ''}`.trim() || nomArticle(a), POIDS.article]),
    ...d.notes.map((n): [string, number] => [n.texte, POIDS.note])
  ];
  const meilleur = new Map<string, number>(nom ? [[nom, POIDS.nom]] : []);
  for (const [texte, poids] of sources) for (const mot of jetons(texte)) meilleur.set(mot, Math.max(meilleur.get(mot) ?? 0, poids));
  return [...meilleur].map(([mot, poids]) => ({ mot, carnetId: c.id, poids }));
}

/** Les carnets proches d'un texte, du plus proche au moins proche (score > 0). */
export function propositions(texte: string, carnets: readonly CarnetDoc[]): Proposition[] {
  const requete = [...new Set(jetons(texte))];
  if (!requete.length || !carnets.length) return [];
  const index = carnets.flatMap(motsDe);
  const fuse = new Fuse(index, { keys: ['mot'], includeScore: true, threshold: 0.25, ignoreLocation: true, minMatchCharLength: 4 });
  const scores = new Map<string, { score: number; mots: Set<string> }>();
  for (const j of requete) {
    const parCarnet = new Map<string, { s: number; mot: string }>();
    for (const m of index) if (m.mot === j) parCarnet.set(m.carnetId, { s: m.poids, mot: m.mot });
    if (j.length >= 5) {
      for (const r of fuse.search(j)) {
        const s = (1 - (r.score ?? 1)) * r.item.poids * 0.8;
        if (s > (parCarnet.get(r.item.carnetId)?.s ?? 0)) parCarnet.set(r.item.carnetId, { s, mot: r.item.mot });
      }
    }
    for (const [id, { s, mot }] of parCarnet) {
      const cur = scores.get(id) ?? { score: 0, mots: new Set<string>() };
      cur.score += s;
      cur.mots.add(mot);
      scores.set(id, cur);
    }
  }
  const norme = Math.sqrt(requete.length);
  return carnets
    .filter(c => scores.has(c.id))
    .map(c => ({ carnetId: c.id, titre: c.title, score: Math.round((scores.get(c.id)!.score / norme) * 1000) / 1000, mots: [...scores.get(c.id)!.mots] }))
    .sort((a, b) => b.score - a.score || a.titre.localeCompare(b.titre));
}

/** Le carnet proposé pour un texte, ou `null` si aucun n'atteint le seuil (alors : carnet neuf, avec sa raison). */
export function rattacher(texte: string, carnets: readonly CarnetDoc[], seuil = SEUIL_RATTACHER): Proposition | null {
  const p = propositions(texte, carnets)[0];
  return p && p.score >= seuil ? p : null;
}

/**
 * Critique 6, n° 35 : « aucun de vos 0 carnets » ne se dit pas. 0 : « Aucun carnet encore » ; 1 : « Votre seul carnet n'en parle pas » ;
 * sinon « Aucun de vos n carnets n'en parle ».
 */
export function aucunCarnetNEnParle(n: number): string {
  if (n <= 0) return 'Aucun carnet encore';
  if (n === 1) return 'Votre seul carnet n’en parle pas';
  return `Aucun de vos ${n} carnets n’en parle`;
}

/** La raison dite d'un rattachement : « comme <titre> : <mots> ». Picto local (Q19). */
export const raisonRattachement = (p: Proposition): string => `comme ${titreSansBanc(p.titre)} : ${p.mots.slice(0, 3).join(', ')}`;

/**
 * La catégorie d'objet d'une idée, dérivée de son titre : le nom de l'idée (premier mot significatif, racine ; « Hotte de la salle »
 * → hotte, « Extracteur pour la cave » → extracteur). Aucun champ de catégorie n'existe : `undefined` si le titre n'a pas de mot sûr.
 */
export const categorieDe = (c: Pick<CarnetDoc, 'title'>): string | undefined => nomEtQualifiants(titreSansBanc(c.title))[0];

/**
 * G35 : le carnet le plus proche d'un autre (pour y déplacer ses articles en veille), lui-même exclu. Critique 5, n° 27 : seulement un
 * carnet de même catégorie d'objet (`categorieDe`) ; sans catégorie sûre, ou sans carnet de même catégorie : `null` (G35 ne s'affiche pas).
 */
export function carnetProche(c: CarnetDoc, carnets: readonly CarnetDoc[], seuil = SEUIL_RATTACHER): Proposition | null {
  const cat = categorieDe(c);
  if (!cat) return null;
  /* critique 6, n° 31 : le même objet ne suffit pas, il faut le même besoin. Les qualifiants des titres (« salle de brassage », « cave de
     garde ») se recoupent, ou l'un des deux titres n'en a pas (« Hotte » et « Hotte de la salle ») ; sinon, c'est un autre besoin. */
  const besoin = (x: CarnetDoc) => new Set(jetons(nomEtQualifiants(titreSansBanc(x.title))[1]));
  const ici = besoin(c);
  const memeBesoin = (x: CarnetDoc) => { const la = besoin(x); return !ici.size || !la.size || [...ici].some(m => la.has(m)); };
  const memes = carnets.filter(x => x.id !== c.id && !x.carnet.archive && categorieDe(x) === cat && memeBesoin(x));
  if (!memes.length) return null;
  const texte = [titreSansBanc(c.title), c.carnet.phrase, ...c.carnet.facons.map(f => f.nom), ...c.carnet.articles.map(a => a.nom ?? '')].join(' ');
  /* la même catégorie est le signe sûr : parmi elles, la plus proche (seuil gardé seulement s'il y en a plusieurs à départager) */
  const p = propositions(texte, memes);
  if (memes.length === 1) return p[0] ?? { carnetId: memes[0].id, titre: memes[0].title, score: 0, mots: [cat] };
  return p[0] && p[0].score >= seuil ? p[0] : null;
}
