/**
 * Le rangement par l'IA de « Noter en vrac » (e9na). La fonction vient de ks4 (la note du Carnet rangée par l'IA, tag atelier-lot8) ;
 * l'écran reste celui de e9na (choisi le 15.11) : la proposition devient les lignes de la carte « Rangement proposé », corrigeables.
 *  - le modèle (réel, ou la réponse SIMULÉE du banc `?dev-local`) rend des effets, relus par le garde `lireReponse` ;
 *  - `proposer` les met en cases, avec les contacts connus ; `prixDevine` lit Tarifs, la bière est une bière connue ;
 *  - ici, chaque case cochée devient une `LigneRangee` : tâche → « À faire », contact noté → « Contact », idée → « Bières ».
 *    Un contact déjà connu n'est pas recréé : il se lie à la tâche (`contactName`).
 * Aucun appel réel hors `mode === 'production'` ; `eteint` : l'appelant garde la lecture locale (`ranger`).
 */
import type { CreativeItem, PricingItem } from '../../types';
import { AiClient } from '../../services/aiClient';
import {
  contactVise, contexteModele, lireReponse, prixDevine, proposer,
  type Contexte, type ModeIA, type NiveauIA, type Proposition
} from '../../domain/rangerNote';
import { reponseSimulee } from './rangerNoteSimule';
import type { LigneRangee } from './atelierModel';

export interface ContexteRangement {
  contacts: readonly CreativeItem[];
  tarifs: readonly PricingItem[];
  /** Bières connues : les recettes et les bières des tarifs. */
  bieres: readonly string[];
}

/** Les bières connues, sans doublon ni blanc, rangées à la française. */
export const bieresConnues = (recettes: readonly string[], tarifs: readonly PricingItem[]): string[] =>
  [...new Set([...recettes, ...tarifs.map(t => t.biere ?? '')].map(b => b?.trim()).filter((b): b is string => Boolean(b)))].sort((a, b) => a.localeCompare(b, 'fr'));

/** Les cases cochées → lignes de la carte. Pure : testée sans réseau. */
export function lignesDePropositions(props: readonly Proposition[], tarifs: readonly PricingItem[]): LigneRangee[] {
  const cochees = props.filter(p => p.coche);
  const contact = contactVise(cochees);
  const lignes: LigneRangee[] = [];
  for (const p of cochees) {
    if (p.sorte === 'tache') {
      const prix = prixDevine(p.nombre, p.contenanceL, p.biere, tarifs);
      lignes.push({
        genre: 'faire', titre: p.biere ? `${p.titre} de ${p.biere}` : p.titre,
        ...(p.date ? { date: p.date } : {}), ...(prix !== undefined ? { targetPrice: prix } : {}), ...(contact ? { contactName: contact.lieu } : {})
      });
    } else if (p.sorte === 'noter-contact') {
      lignes.push({ genre: 'contact', titre: p.lieu, ...(p.personne ? { contactName: p.personne } : {}) });
    } else if (p.sorte === 'idee') {
      lignes.push({ genre: 'biere', titre: p.titre, ...(p.texte ? { description: p.texte } : {}) });
    }
  }
  return lignes;
}

export interface Rangement {
  /** `null` : rien d'utilisable (réponse vide, refusée ou panne) ; l'appelant retombe sur la lecture locale. */
  lignes: LigneRangee[] | null;
  panne: boolean;
}

/**
 * La note part à l'IA : simulée au banc (500 ms, marquée « exemple » par l'écran), réelle seulement si `mode === 'production'`.
 * Une panne n'écrit rien et ne perd rien : la note reste dans la carte.
 */
export async function demanderRangement(note: string, mode: ModeIA, niveau: NiveauIA, ctx: ContexteRangement, saisie: Date = new Date()): Promise<Rangement> {
  const contexte: Contexte = { saisie, contacts: ctx.contacts, tarifs: ctx.tarifs, bieres: ctx.bieres };
  let brut: unknown = null;
  let panne = false;
  if (mode === 'simule') {
    await new Promise(r => setTimeout(r, 500));
    brut = reponseSimulee(note, saisie, ctx.contacts.map(c => c.title));
  } else if (mode === 'production') {
    try {
      const r = await AiClient.run({ task: 'rangerNote', tier: niveau, context: contexteModele(note, contexte) });
      brut = r.ok ? r.data : null;
      panne = !r.ok;
    } catch { panne = true; }
  } else return { lignes: null, panne: false };
  const effets = lireReponse(brut, note, saisie);
  const lignes = effets ? lignesDePropositions(proposer(effets, contexte), ctx.tarifs) : [];
  return { lignes: lignes.length ? lignes : null, panne };
}
