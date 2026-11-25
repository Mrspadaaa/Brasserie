/**
 * C79-fix (EXA-6, EXA-2) : chaque bulle du fil a son ⋯. Une bulle n'a pas toujours UNE note : sa phrase est rangée en note, en critère, en façon,
 * en article (ou en deux notes, ou chez un autre carnet). Ce module dit, pour un message et un carnet, ce que la bulle a rangé ICI, et la clé qui
 * désigne sa feuille ⋯ (l'id de la note quand la bulle n'en a qu'une, sinon « msg:<id du message> »).
 */
import type { CarnetDoc, MessageDoc, Note } from './modele';

export type CibleBulle = 'note' | 'critere' | 'facon' | 'article';
export interface LigneBulle { cible: CibleBulle; id: string; texte: string }

export const PREFIXE_BULLE = 'msg:';
export const estCleBulle = (cle: string | null | undefined): cle is string => !!cle && cle.startsWith(PREFIXE_BULLE);
export const messageDeLaCle = (cle: string): string => cle.slice(PREFIXE_BULLE.length);

/** Ce que ce message a rangé dans CE carnet : ses effets d'ici, et toute ligne qui porte son id. Une ligne disparue n'est pas comptée. */
export function lignesDeLaBulle(c: CarnetDoc, m: MessageDoc): LigneBulle[] {
  const d = c.carnet;
  const sorties: LigneBulle[] = [];
  const poser = (l: LigneBulle) => { if (!sorties.some(x => x.cible === l.cible && x.id === l.id)) sorties.push(l); };
  const trouver = (cible: CibleBulle, id: string): LigneBulle | undefined => {
    if (cible === 'note') { const n = d.notes.find(x => x.id === id); return n && { cible, id, texte: n.texte }; }
    if (cible === 'critere') { const k = d.criteres.find(x => x.id === id); return k && { cible, id, texte: k.texte }; }
    if (cible === 'facon') { const f = d.facons.find(x => x.id === id); return f && { cible, id, texte: f.nom }; }
    const a = d.articles.find(x => x.id === id);
    return a && { cible, id, texte: a.nom ?? a.domaine ?? 'lien' };
  };
  for (const e of m.carnetMessage.effets) {
    if (e.carnetId !== c.id) continue;
    if (e.cible !== 'note' && e.cible !== 'critere' && e.cible !== 'facon' && e.cible !== 'article') continue;
    const l = trouver(e.cible, e.id);
    if (l) poser(l);
  }
  for (const n of d.notes) if (n.messageId === m.id) poser({ cible: 'note', id: n.id, texte: n.texte });
  for (const k of d.criteres) if (k.messageId === m.id) poser({ cible: 'critere', id: k.id, texte: k.texte });
  for (const f of d.facons) if (f.messageId === m.id) poser({ cible: 'facon', id: f.id, texte: f.nom });
  for (const a of d.articles) if (a.messageId === m.id) poser({ cible: 'article', id: a.id, texte: a.nom ?? a.domaine ?? 'lien' });
  return sorties;
}

/** Les carnets (autres que celui-ci) où ce message a rangé quelque chose : ce que « Supprimer » ne touche pas. */
export const carnetsAilleursDe = (c: CarnetDoc, m: MessageDoc): string[] =>
  [...new Set(m.carnetMessage.effets.filter(e => e.cible !== 'carnet' && e.carnetId !== c.id && !e.carnetSupprime).map(e => e.carnetId))];

/**
 * La clé de la feuille ⋯ d'une note : son id quand la bulle du fil n'a que cette note (ou quand la note est une ligne seule du fil), sinon la clé de sa bulle.
 * Même règle que `FilCarnet` (ce qui est dit ici est ce que le fil pose).
 */
export function cleDeLaNote(c: CarnetDoc, messages: readonly MessageDoc[], n: Note): string {
  if (!n.messageId || !messages.some(m => m.id === n.messageId)) return n.id;
  return c.carnet.notes.filter(x => x.messageId === n.messageId).length === 1 ? n.id : `${PREFIXE_BULLE}${n.messageId}`;
}
