/**
 * D451 : le fil d'un problème et les cartes « OK · Non » de l'IA.
 *
 * Fil d'activité (activity stream, comme la timeline de GitHub : commentaires et événements entrelacés ; PLAN § État de l'art) : le fil est une
 * **projection** pure (tri par date, regroupement par jour, plus anciens repliables) des messages (`carnet-message`, déjà un journal), des notes
 * sans message et des événements de `suivi.evenements`. L'état courant reste écrit : lecture simple, hors ligne. Pas d'event sourcing complet.
 */
import type { Etiquette, EvenementSuivi, MessageDoc, Note, PropositionSuivi, Rattache } from './modele';
import { sansIndefinis, type CarnetDoc } from './modele';
import { Brouillon, appliquerEcritures, refus, type Etat, type Resultat } from './operations';
import { jourLocal, poserVeille, fermerParAchat, resoudre, retenirOption, suiviDe } from './suivi';
import { ajouterTache, notePlanningDe, poserEcheance } from './taches';

export type EntreeFil =
  | { sorte: 'message'; id: string; le: string; message: MessageDoc; etiquettes: Etiquette[]; rattache?: Rattache; propositions: PropositionSuivi[] }
  | { sorte: 'note'; id: string; le: string; /** faux : la note n'a pas de date (placée à la création du carnet) */ dateConnue: boolean; note: Note; planning?: { du: string; au?: string; categorie: string } }
  | { sorte: 'evenement'; id: string; le: string; evenement: EvenementSuivi };

export interface JourFil { jour: string; entrees: EntreeFil[] }
/** « ▴ n notes du … au … » : les plus anciens jours, repliés ; `n` compte messages et notes. */
export interface Replie { n: number; du: string; au: string; jours: JourFil[] }
export interface FilCarnet { jours: JourFil[]; replie: Replie | null; total: number }

/** Le fil se replie quand il cache au moins ceci (un « ▴ 1 note » ne vaut pas un toucher). */
export const REPLI_MIN = 3;
/** Entrées gardées visibles avant de replier (les jours entiers, du plus récent). */
export const FIL_GARDE = 12;

const estNote = (e: EntreeFil): boolean => e.sorte !== 'evenement';

/**
 * Le fil du carnet `c` : ses messages (écrits depuis lui, ou dont un effet, une étiquette ou le rattachement le vise), ses notes sans message
 * (datées par `modifieeLe`, sinon à la création du carnet : `dateConnue: false`), ses événements. Du plus ancien au plus récent, regroupés par
 * jour local ; une note du Planning garde ses dates (`planning`).
 */
export function filDe(c: CarnetDoc, messages: readonly MessageDoc[], options: { garde?: number } = {}): FilCarnet {
  const entrees: EntreeFil[] = [];
  const idsMessages = new Set(messages.map(m => m.id));
  for (const m of messages) {
    const cm = m.carnetMessage;
    const etiquettes = (cm.etiquettes ?? []).filter(e => e.carnetId === c.id);
    const propositions = (cm.propositionsSuivi ?? []).filter(p => p.carnetId === c.id);
    const lie = cm.depuis === c.id || cm.effets.some(e => e.carnetId === c.id) || etiquettes.length > 0 || cm.rattache?.carnetId === c.id || propositions.length > 0;
    if (!lie) continue;
    entrees.push({ sorte: 'message', id: m.id, le: cm.le, message: m, etiquettes, ...(cm.rattache && cm.rattache.carnetId === c.id ? { rattache: cm.rattache } : {}), propositions });
  }
  for (const n of c.carnet.notes) {
    if (n.messageId && idsMessages.has(n.messageId)) continue;
    const planning = notePlanningDe(n.texte);
    entrees.push({ sorte: 'note', id: n.id, le: n.modifieeLe ?? c.carnet.creeLe, dateConnue: !!n.modifieeLe, note: n, ...(planning ? { planning } : {}) });
  }
  /* C68-6 : seule la DEMANDE de veille (vers « veille ») est une bulle « veille demandée » ; quitter la veille (écarter, reprendre) est un changement d'option, jamais une seconde demande.
     L'événement écrit reste tel quel (l'historique ne change pas) ; le fil le lit comme un changement d'option. */
  for (const e of suiviDe(c).evenements) entrees.push({ sorte: 'evenement', id: e.id, le: e.le, evenement: e.sorte === 'veille' && e.vers !== 'veille' ? { ...e, sorte: 'option' } : e });
  entrees.sort((a, b) => a.le.localeCompare(b.le) || a.id.localeCompare(b.id));
  const parJour: JourFil[] = [];
  for (const e of entrees) {
    const jour = jourLocal(e.le);
    const dernier = parJour[parJour.length - 1];
    if (dernier?.jour === jour) dernier.entrees.push(e); else parJour.push({ jour, entrees: [e] });
  }
  /* repli : des jours entiers, les plus anciens, tant que les plus récents gardent au moins `garde` entrées */
  const garde = options.garde ?? FIL_GARDE;
  let vus = 0, coupe = 0;
  for (let i = parJour.length - 1; i >= 0 && vus < garde; i -= 1) { vus += parJour[i].entrees.length; coupe = i; }
  const caches = parJour.slice(0, vus >= garde ? coupe : 0);
  const n = caches.reduce((s, j) => s + j.entrees.filter(estNote).length, 0);
  if (n < REPLI_MIN) return { jours: parJour, replie: null, total: entrees.length };
  return { jours: parJour.slice(caches.length), replie: { n, du: caches[0].jour, au: caches[caches.length - 1].jour, jours: caches }, total: entrees.length };
}

/* ---------- les cartes « OK · Non » ---------- */

/** Retire une proposition du message (le Non d'un toucher, ou le OK une fois appliqué). */
function retirerProposition(etat: Etat, messageId: string, index: number): Resultat {
  const b = new Brouillon(etat);
  const m = b.messages().find(x => x.id === messageId);
  const l = m?.carnetMessage.propositionsSuivi;
  if (!m || !l || !l[index]) return refus('Proposition introuvable.');
  const reste = l.filter((_, i) => i !== index);
  b.ecrire({ ...m, carnetMessage: sansIndefinis({ ...m.carnetMessage, propositionsSuivi: reste.length ? reste : undefined }) });
  return b.resultat('Proposition écartée');
}

/** Le Non : la proposition s'annule d'un toucher, rien d'autre n'est écrit. */
export const refuserPropositionSuivi = (etat: Etat, args: { messageId: string; index: number }): Resultat => retirerProposition(etat, args.messageId, args.index);

/**
 * Le OK : applique ce que l'IA proposait, par l'intention du brasseur (jamais écrit avant) et retire la carte ; une seule écriture annulable.
 * tâche, dater (date une tâche de l'option, sinon en ajoute une), retenir, résoudre (avec une option : fermé par son achat), veiller (de lui).
 * `deplacer` (« Rattacher à … ? ») n'est pas appliqué ici : déplacer des lignes d'un carnet à l'autre appartient au rangement.
 */
export function accepterPropositionSuivi(etat: Etat, args: { messageId: string; index: number; le: string }): Resultat {
  const m = new Brouillon(etat).messages().find(x => x.id === args.messageId);
  const p = m?.carnetMessage.propositionsSuivi?.[args.index];
  if (!m || !p) return refus('Proposition introuvable.');
  const b = new Brouillon(etat);
  const c = b.carnet(p.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  const manque = (): Resultat => refus('La proposition ne dit pas quelle option.');
  let r: Resultat;
  switch (p.sorte) {
    case 'tache':
      r = ajouterTache(etat, { carnetId: p.carnetId, texte: p.texte ?? '', le: args.le, echeance: p.echeance, precision: p.precision, coutCentimes: p.coutCentimes, devise: p.devise, optionId: p.optionId, messageId: m.id, origine: p.origine });
      break;
    case 'dater': {
      const t = (c.carnet.taches ?? []).find(x => !x.faiteLe && p.optionId !== undefined && x.optionId === p.optionId);
      if (t && p.echeance) r = poserEcheance(etat, { carnetId: p.carnetId, tacheId: t.id, echeance: p.echeance, precision: p.precision });
      else r = ajouterTache(etat, { carnetId: p.carnetId, texte: p.texte ?? c.carnet.facons.find(f => f.id === p.optionId)?.nom ?? '', le: args.le, echeance: p.echeance, precision: p.precision, optionId: p.optionId, messageId: m.id, origine: p.origine });
      break;
    }
    case 'retenir':
      r = p.optionId ? retenirOption(etat, { carnetId: p.carnetId, faconId: p.optionId, le: args.le, origine: 'vous' }) : manque();
      break;
    case 'resoudre':
      r = p.optionId ? fermerParAchat(etat, { carnetId: p.carnetId, optionId: p.optionId, le: args.le }) : resoudre(etat, { carnetId: p.carnetId, le: args.le, texte: p.texte });
      break;
    case 'veiller':
      r = p.optionId ? poserVeille(etat, { carnetId: p.carnetId, faconId: p.optionId, active: true, le: args.le, origine: 'vous' }) : manque();
      break;
    default:
      return refus('Rattacher se fait au rangement du message, pas ici.');
  }
  if (!r.ok) return r;
  const apres = appliquerEcritures(etat, r.ecritures);
  const r2 = retirerProposition(apres, args.messageId, args.index);
  if (!r2.ok) return r;
  return { ok: true, ecritures: [...r.ecritures, ...r2.ecritures], inverse: [...r2.inverse, ...r.inverse], avis: r.avis };
}
