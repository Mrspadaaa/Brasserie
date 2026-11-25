/**
 * R95 (c74c, CARNET-SES-DONNEES-EXISTANTES) : un fil écrit avant le port du suivi (bulles `brut`, aucun jeton, aucune option) se range à l'OUVERTURE, par l'analyse
 * LOCALE : « Autre fournisseur : … » devient une option, « Commandé 2 sacs chez l'autre » se propose en Résolu, « Brassin du 3 déc. à décaler » en tâche.
 *
 * État de l'art (L29) : pas d'algorithme neuf ; trois motifs de texte courts (étiquette « Autre X : », participe passé d'un geste fini, « à + infinitif »), sur la
 * `normaliser` existante (accents et casse ôtés). Jamais un calcul de sens : un motif absent, aucune proposition.
 * Aucune écriture à l'ouverture : `propositionFilAncien` est PURE ; `rangerFilAncien` n'est appelée que par son geste (« Ranger »), en une écriture annulable.
 */
import { normaliser } from './analyseLocale';
import { nouvelIdCarnet, type CarnetDoc, type Facon, type MessageDoc } from './modele';
import { appliquerEcritures, Brouillon, refus, type EcritureCarnet, type Etat, type Resultat } from './operations';
import { poserGenre, resoudre } from './suivi';
import { ajouterTache } from './taches';

export interface PropositionFilAncien {
  carnetId: string;
  /** Les options trouvées (« Autre fournisseur »), dans l'ordre du fil. */
  options: { nom: string; phrase: string }[];
  /** La phrase qui dit le problème fini (« Commandé 2 sacs chez l'autre… ») : proposée en Résolu, jamais passée seule. */
  resolu?: { phrase: string };
  /** Les phrases qui disent quelque chose à faire (« Brassin du 3 déc. à décaler… »). */
  taches: { texte: string }[];
}

const ETIQUETTE_AUTRE = /^\s*(autres?\s+[^:\n]{2,40}?)\s*:\s*\S/i;
export const GESTE_FINI = /^\s*(?:ok\s*[:,]?\s*)?(?:command[ee]s?|achete[es]?s?|regle[es]?s?|resolu|repare[es]?s?|installe[es]?s?|livre[es]?s?|c'est fait)\b/;
const A_FAIRE = /\ba\s+(?:[a-z]+(?:er|ir|re))\b/;
const majuscule = (t: string): string => (t ? t.charAt(0).toLocaleUpperCase('fr-CH') + t.slice(1) : t);

/** Les phrases du fil de CE carnet, dans l'ordre où elles ont été écrites : ses messages `brut`, ou à défaut ses notes. */
function phrasesDuFil(c: CarnetDoc, messages: readonly MessageDoc[]): { phrases: string[]; brutes: boolean } {
  const siens = messages.filter(m => m.carnetMessage.depuis === c.id || m.carnetMessage.effets.some(e => e.carnetId === c.id))
    .sort((a, b) => a.carnetMessage.le.localeCompare(b.carnetMessage.le));
  const brutes = siens.length >= 3 && siens.every(m => m.carnetMessage.rangement === 'brut' && !(m.carnetMessage.etiquettes ?? []).length && !(m.carnetMessage.propositionsSuivi ?? []).length);
  return { phrases: siens.map(m => m.carnetMessage.texte.replace(/^\s*ZZ TEST\s*[—–-]\s*/i, '').trim()).filter(Boolean), brutes };
}

/**
 * La proposition de rangement d'un fil ancien, ou `null` : le carnet n'a ni genre posé, ni option, ni suivi, ni tâche (il n'est pas déjà rangé) et son fil est fait de bulles
 * brutes ; la première bulle (le titre, déjà dit) n'est pas relue.
 */
export function propositionFilAncien(c: CarnetDoc, messages: readonly MessageDoc[]): PropositionFilAncien | null {
  const d = c.carnet;
  if (d.genre || d.suivi || d.facons.length || (d.taches ?? []).length || d.archive) return null;
  const { phrases, brutes } = phrasesDuFil(c, messages);
  if (!brutes) return null;
  const suite = phrases.slice(1);
  const options: PropositionFilAncien['options'] = [];
  const taches: PropositionFilAncien['taches'] = [];
  let resolu: PropositionFilAncien['resolu'];
  suite.forEach((phrase, i) => {
    const n = normaliser(phrase);
    const autre = ETIQUETTE_AUTRE.exec(phrase);
    if (autre) { options.push({ nom: majuscule(autre[1].trim()), phrase }); return; }
    /* le dernier mot du fil dit la fin : un geste fini (« Commandé… ») y est proposé en Résolu ; plus haut, c'est un fait, pas la fin */
    if (i === suite.length - 1 && GESTE_FINI.test(n)) { resolu = { phrase }; return; }
    if (A_FAIRE.test(n) && !/\?\s*$/.test(phrase)) taches.push({ texte: phrase });
  });
  return options.length || resolu || taches.length ? { carnetId: c.id, options, ...(resolu ? { resolu } : {}), taches } : null;
}

/**
 * Son geste « Ranger » : le carnet devient un problème (genre posé par lui), les options entrent en pistes, les tâches en « À faire », et le Résolu seulement si
 * `avecResolu`. Une écriture annulable ; un refus n'écrit rien.
 */
export function rangerFilAncien(etat: Etat, args: { proposition: PropositionFilAncien; le: string; avecResolu: boolean }): Resultat {
  const p = args.proposition;
  let courant: Etat = etat;
  const ecritures: EcritureCarnet[] = [];
  let inverse: EcritureCarnet[] = [];
  /** Passe une étape ; rend la raison d'un refus, sinon null. */
  const passer = (r: Resultat): string | null => {
    if (!r.ok) return (r as { raison: string }).raison;
    const ok = r as Extract<Resultat, { ok: true }>;
    ecritures.push(...ok.ecritures);
    inverse = [...ok.inverse, ...inverse];
    courant = appliquerEcritures(courant, ok.ecritures);
    return null;
  };
  const etapes: Array<() => Resultat> = [
    () => poserGenre(courant, { carnetId: p.carnetId, genre: 'probleme', origine: 'vous' }),
    () => {
      const b = new Brouillon(courant);
      const c = b.carnet(p.carnetId);
      if (!c) return refus('Ce carnet n’existe plus.');
      c.carnet.facons = [...c.carnet.facons, ...p.options.map((o): Facon => ({ id: nouvelIdCarnet('FACON'), nom: o.nom, etat: 'ouverte', origine: 'vous' }))];
      b.ecrire(c);
      return b.resultat('Options posées');
    },
    ...p.taches.map(t => () => ajouterTache(courant, { carnetId: p.carnetId, texte: t.texte, le: args.le, origine: 'vous' })),
    ...(args.avecResolu && p.resolu ? [() => resoudre(courant, { carnetId: p.carnetId, le: args.le, sorte: 'texte', texte: p.resolu!.phrase, origine: 'vous' })] : [])
  ];
  for (const etape of p.options.length ? etapes : etapes.filter((_, i) => i !== 1)) {
    const raison = passer(etape());
    if (raison) return refus(raison);
  }
  return { ok: true, ecritures, inverse, avis: '✓ Fil rangé' };
}
