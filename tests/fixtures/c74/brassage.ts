/**
 * Fixture de la voie c74-tests (R89 repli avec filtre, R91 classer un sous-domaine par priorité). Tout est EXEMPLE (titres « ZZ TEST — », aucun prix ni lien réel).
 * Brasserie › Brassage : quatre carnets (idées), créés du plus récent (1er) au plus ancien (4e) : l'ordre ACTUEL de la liste est donc 1, 2, 3, 4
 * (`arbreDe` : du plus récent au plus ancien). Brasserie › Fermentation : deux carnets, pour vérifier qu'un déplacement ne touche pas le voisin.
 * `{ cherche: true }` : chaque carnet est à l'état « je cherche » (suivi posé), pour qu'un filtre du coup d'œil les garde.
 * `carnetPlusRecent` : un carnet de plus, jamais déplacé, plus récent que tous (le « jamais déplacé » de la règle).
 */
import type { CreativeItem } from '../../../src/types';

const PREFIXE = 'ZZ TEST — ';
export const TITRES_BRASSAGE = ['Houblons citra', 'Moulin à malt', 'Sonde de température', 'Bac de trempage'] as const;
export const TITRES_FERMENTATION = ['Cuve de garde', 'Joint de bonde'] as const;
export const TITRE_NEUF = 'Tuyau alimentaire';
const t = (titre: string): string => `${PREFIXE}${titre}`;
export interface OptionsBrassage { cherche?: boolean }

function idee(id: string, titre: string, creeLe: string, sousDomaine: string, o: OptionsBrassage): CreativeItem {
  return {
    id, type: 'carnet', title: t(titre), status: 'idea',
    carnet: {
      version: 1, creeLe, phrase: t(titre), criteres: [], facons: [], articles: [], notes: [{ id: `${id}-N`, texte: `exemple : ${titre}`, genre: 'note' }], photos: [],
      genre: { valeur: 'idee', origine: 'vous' }, domaine: { valeur: 'brasserie', origine: 'vous' }, categorie: { chemin: [sousDomaine], origine: 'vous' },
      ...(o.cherche ? { suivi: { etat: 'cherche', evenements: [] } } : {})
    }
  } as unknown as CreativeItem;
}

/** Brassage : 4 carnets ; Fermentation : 2. Copies neuves à chaque appel. */
export function fixtureBrassage(o: OptionsBrassage = {}): CreativeItem[] {
  return JSON.parse(JSON.stringify([
    ...TITRES_BRASSAGE.map((titre, i) => idee(`ZZ-C74-B${i + 1}`, titre, `2026-11-${String(20 - i).padStart(2, '0')}T12:00:00.000Z`, 'Brassage', o)),
    ...TITRES_FERMENTATION.map((titre, i) => idee(`ZZ-C74-F${i + 1}`, titre, `2026-11-${String(10 - i).padStart(2, '0')}T12:00:00.000Z`, 'Fermentation', o))
  ])) as CreativeItem[];
}

/** Un carnet de Brassage créé APRÈS tous les autres (24 nov.), jamais déplacé. */
export const carnetPlusRecent = (o: OptionsBrassage = {}): CreativeItem => JSON.parse(JSON.stringify(idee('ZZ-C74-B0', TITRE_NEUF, '2026-11-24T08:00:00.000Z', 'Brassage', o)));
