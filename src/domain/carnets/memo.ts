/**
 * Voie c67b-fix (R67, C67-2, C67-8) : trois lectures de SENS du repli local et de l'IA simulée (la vraie IA les lit dans la consigne de
 * `functions/src/carnetIA.ts`, qui dit la même chose). Aucune liste d'objets ni de phrases : la forme de la phrase (le temps du verbe, le besoin, la
 * piste) et le nom de l'objet des carnets existants (premier mot significatif du titre, comme `categorieDe`).
 *
 * État de l'art (MISSION.md « ## État de l'art », L29) : pas d'algorithme neuf. Le rapprochement d'un texte et d'un carnet reste `rattacher.ts`
 * (recherche floue fuse.js, seuil réglé) ; ici seulement un test de forme de phrase (expression régulière sur le temps du verbe : passé composé,
 * besoin, question) et un contrôle « le nom de l'objet du carnet est un mot du message », que le seuil lexical manque dans un texte long (√n).
 */
import { jetons, normaliser } from './analyseLocale';
import type { CarnetDoc } from './modele';
import { propositions, rattacher, type Proposition } from './rattacher';

const SANS_BANC = (t: string): string => t.replace(/^\s*ZZ TEST\s*[—–-]\s*/i, '');
const minuscules = (t: string): string => SANS_BANC(t).toLowerCase().replace(/[’']/g, ' ');

/* Un besoin, un geste à faire, un manque ou une question : jamais un fait accompli. */
const BESOIN = /(?:^|[^a-zà-ÿ])(?:il faut|faut|faudrait|besoin|penser|pense|doit|dois|devra|devrait|prevoir|prévoir|manque|manquent|a (?:acheter|faire|prevoir|prévoir|commander|racheter|changer|remplacer|verifier|vérifier))(?![a-zà-ÿ])/;
const AUXILIAIRE = new Set(['a', 'ont', 'est', 'sont', 'ai', 'avons', 'avait', 'avaient', 'etait', 'étaient', 'était', 'etaient', 'ete', 'été']);
/** Un participe passé écrit (sa forme accentuée garde le -é : « réglé », « recalibrée », « repartie », « tenu »). */
const PARTICIPE = /^[a-zàâçéèêëîïôûùüœ]{3,}(?:é|ée|és|ées|i|ie|is|ies|u|ue|us|ues)$/;
/** Un souci qui se suit (fuite, panne, casse) : un problème, pas un mémo, même au passé (« le joint a cassé »). */
const SOUCI = /\b(?:fuit|fuite|fuites|panne|pannes|casse|bouche|bouchee|probleme|ne \w+ (?:plus|pas)|n \w+ (?:plus|pas)|trop de|bruit anormal)\b/;

/**
 * Un message qui dit un FAIT ACCOMPLI : un verbe au passé composé (auxiliaire + participe, quelques mots entre les deux : « a très bien tenu »,
 * « est bien repartie », « a été recalibrée »), sans besoin, sans question, sans souci. C'est un mémo (« une chose à retenir », un constat qui va
 * dans le carnet de son sujet), jamais une idée neuve.
 */
export function estUnMemo(texte: string): boolean {
  const t = minuscules(texte);
  if (!t.trim() || /\?\s*$/.test(t) || BESOIN.test(t) || SOUCI.test(normaliser(t))) return false;
  const mots = t.split(/[^a-zàâçéèêëîïôûùüœ0-9]+/).filter(Boolean);
  for (let i = 0; i < mots.length; i++) {
    if (!AUXILIAIRE.has(mots[i])) continue;
    for (let j = i + 1; j <= Math.min(i + 3, mots.length - 1); j++) if (PARTICIPE.test(mots[j]) || mots[j] === 'ete' || mots[j] === 'été') return true;
  }
  return false;
}

/** Le nom de l'objet d'un carnet : le premier mot significatif de son titre (« Pompe de transfert du moût » → pompe), comme `categorieDe`. */
const nomDe = (c: Pick<CarnetDoc, 'title'>): string | undefined => jetons(SANS_BANC(c.title))[0];

/**
 * Le carnet existant du MÊME SUJET qu'un message : celui dont le nom d'objet est un mot du message (racine comprise), le plus proche d'abord ; à défaut
 * celui que le rapprochement lexical (`rattacher`) trouve. Un carnet archivé n'est jamais proposé. `null` : aucun carnet n'en parle (carnet neuf).
 */
export function carnetDuSujet(texte: string, carnets: readonly CarnetDoc[]): Proposition | null {
  const ouverts = carnets.filter(c => !c.carnet.archive);
  const mots = new Set(jetons(SANS_BANC(texte)));
  const duNom = ouverts.filter(c => { const n = nomDe(c); return !!n && mots.has(n); });
  if (duNom.length) {
    const rangs = propositions(texte, duNom);
    if (rangs[0]) return rangs[0];
    const c = duNom[0];
    return { carnetId: c.id, titre: c.title, score: 0, mots: [nomDe(c)!] };
  }
  return rattacher(texte, ouverts);
}

/** Un besoin ou un geste à faire dit à l'infinitif (« Racheter des joints… ») : sa ligne, mise en forme, devient une tâche proposée. */
export const commenceParUnInfinitif = (texte: string): boolean => /^[a-zàâçéèêëîïôûùüœ]{4,}(?:er|ir|re)(?![a-zà-ÿ])/i.test(SANS_BANC(texte).trim());

/** Le libellé de tête d'une solution envisagée (« Piste : … », « Option : … ») : le mot de l'appli pour une solution possible d'un problème. */
export const LIBELLE_PISTE = /^\s*(?:piste|pistes|option|solution|solution envisagee|solution envisagée)\s*[:：]\s*/i;

/**
 * Le nom de l'objet d'une piste : ce qui suit son libellé, jusqu'à la première virgule, le premier « chez » ou le premier montant
 * (« Piste : déshumidificateur industriel, 890 CHF chez Brouwland » → « Déshumidificateur industriel »). Vide si rien ne se lit.
 */
export function nomDePiste(texte: string): string {
  const t = SANS_BANC(texte).replace(LIBELLE_PISTE, '').trim();
  const nom = t.split(/\s*[,;]\s*|\s+chez\s+|\s+à\s+(?=\d)|\s+(?=\d[\d\s'’.,]*\s*(?:chf|eur|€|francs?|fr\b))/i)[0]?.trim() ?? '';
  return nom ? nom.charAt(0).toLocaleUpperCase('fr-CH') + nom.slice(1) : '';
}
