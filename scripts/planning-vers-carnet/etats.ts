/**
 * États des étapes passées, réponse du brasseur (20.11) : « 6 en cours / Et jusqu'à 11 non pas fait encore » (1 à 5 faites). Une étape
 * faite s'archive (`archiverCarnet`, l'issue du Carnet pour une chose réalisée) ; en cours ou pas encore faite : une note de son état, rangée
 * par `ranger` avec son message (le chemin de l'app). Les dates ne bougent pas. Ids de message fixes : relancer ne réécrit rien.
 */
import type { CreativeItem } from '../../src/types';
import { lireCarnet, lireMessage } from '../../src/domain/carnets/modele';
import { appliquerEcritures, archiverCarnet, ranger, type EcritureCarnet, type Resultat } from '../../src/domain/carnets/operations';
import { idCarnetPlanning } from './correspondance';

export type EtatEtape = 'fait' | 'en-cours' | 'pas-fait';
/** Ses mots, numérotés dans l'ordre des dates : 1 à 5 faites, 6 en cours, 7 à 11 pas encore faites. */
export const ETATS_20_11: Readonly<Record<string, EtatEtape>> = {
  'T-6': 'fait', 'T-7': 'fait', 'T-8': 'fait', 'T-9': 'fait', 'T-10': 'fait',
  'T-11': 'en-cours',
  'T-12': 'pas-fait', 'T-14': 'pas-fait', 'T-16': 'pas-fait', 'T-17': 'pas-fait', 'T-18': 'pas-fait'
};
const TEXTE: Record<Exclude<EtatEtape, 'fait'>, string> = { 'en-cours': 'En cours au 20.11.2026', 'pas-fait': 'Pas encore fait au 20.11.2026' };
export const idMessageEtat = (tacheId: string) => `MSG-ETAT-${idCarnetPlanning(tacheId).replace(/^CARNET-/, '')}`;

export interface PlanEtats { ecritures: EcritureCarnet[]; lignes: string[]; dejaFait: string[]; absents: string[] }

export function planEtats(etat: readonly CreativeItem[], le: string, etats: Readonly<Record<string, EtatEtape>> = ETATS_20_11): PlanEtats {
  let docs = [...etat];
  const plan: PlanEtats = { ecritures: [], lignes: [], dejaFait: [], absents: [] };
  for (const [tacheId, e] of Object.entries(etats)) {
    const id = idCarnetPlanning(tacheId);
    const c = lireCarnet(docs.find(d => d.id === id));
    if (!c) { plan.absents.push(tacheId); continue; }
    let r: Resultat | null = null;
    if (e === 'fait') {
      if (c.carnet.archive) { plan.dejaFait.push(tacheId); continue; }
      r = archiverCarnet(docs, { carnetId: id, le, raison: 'Fait (réponse du brasseur, 20.11)' });
    } else {
      const mid = idMessageEtat(tacheId);
      if (lireMessage(docs.find(d => d.id === mid))) { plan.dejaFait.push(tacheId); continue; }
      r = ranger(docs, { message: { id: mid, texte: TEXTE[e], le, depuis: id, rangement: 'locale' }, lignes: [{ carnetId: id, sorte: 'note', texte: TEXTE[e], genre: 'note' }] });
    }
    if (!r.ok) throw new Error(`${tacheId} : ${(r as { raison: string }).raison}`);
    plan.ecritures.push(...r.ecritures);
    docs = appliquerEcritures(docs, r.ecritures);
    plan.lignes.push(`${tacheId.padEnd(5)} ${c.title} → ${e === 'fait' ? 'archivé (fait)' : TEXTE[e]}`);
  }
  return plan;
}
