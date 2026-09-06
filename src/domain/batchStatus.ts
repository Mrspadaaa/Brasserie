import { BatchStatus } from '../types';

/**
 * Le cycle de vie d'un brassin, déclaré UNE seule fois.
 *
 * ⚠️ Pourquoi ce fichier existe : la table de correspondance vivait dans
 * `ProductionTab`, écrite à la main, et il y manquait `annule`. Passer un
 * brassin en « annulé » l'enregistrait correctement, mais l'écran retombait sur
 * la valeur par défaut et affichait « Planifié » — l'utilisateur en concluait
 * logiquement que la modification n'avait pas été prise en compte.
 *
 * Le type `Record<BatchStatus, …>` rend cet oubli IMPOSSIBLE : ajouter un statut
 * au type sans le décrire ici casse la compilation.
 */

export interface StatusStyle {
  /** Libellé lu par le brasseur. */
  label: string;
  /** Ce qui se passe réellement à cette étape, pour l'aide contextuelle. */
  hint: string;
  /** Classes de fond et de texte. */
  chip: string;
  /** Le brassin est-il encore en cours ? */
  active: boolean;
  /** Ordre d'avancement, pour trier et pour proposer l'étape suivante. */
  order: number;
}

export const BATCH_STATUS: Record<BatchStatus, StatusStyle> = {
  planifie: {
    label: 'Planifié',
    hint: 'Recette prête, rien n’est encore déstocké',
    chip: 'bg-cave-850 text-cave-200 border-cave-700',
    active: true,
    order: 0
  },
  fermentation: {
    label: 'Fermentation',
    hint: 'En cuve, la levure travaille',
    chip: 'bg-hop/15 text-hop border-hop/40',
    active: true,
    order: 1
  },
  garde: {
    label: 'Garde froide',
    hint: 'Maturation à froid avant conditionnement',
    chip: 'bg-water/15 text-water border-water/40',
    active: true,
    order: 2
  },
  conditionne: {
    label: 'Conditionné',
    hint: 'Mis en bouteille ou en fût, prêt à vendre',
    chip: 'bg-ebc-copper/20 text-ebc-copper border-ebc-copper/40',
    active: true,
    order: 3
  },
  termine: {
    label: 'Terminé',
    hint: 'Entièrement vendu ou consommé',
    chip: 'bg-cave-800 text-cave-400 border-cave-700',
    active: false,
    order: 4
  },
  annule: {
    label: 'Annulé',
    hint: 'Brassin abandonné — ne compte plus nulle part',
    chip: 'bg-alert/15 text-alert border-alert/40',
    active: false,
    order: 5
  }
};

/** Tous les statuts, dans l'ordre du cycle de vie. */
export const BATCH_STATUSES = (Object.keys(BATCH_STATUS) as BatchStatus[]).sort(
  (a, b) => BATCH_STATUS[a].order - BATCH_STATUS[b].order
);

/** Statuts d'un brassin encore en cours. */
export const ACTIVE_STATUSES = BATCH_STATUSES.filter((s) => BATCH_STATUS[s].active);

/**
 * Étape suivante naturelle, pour proposer l'action d'un seul geste
 * (« Passer en garde froide »). `null` quand le brassin est arrivé au bout.
 */
export function nextStatus(current: BatchStatus): BatchStatus | null {
  if (current === 'annule' || current === 'termine') return null;
  const order = BATCH_STATUS[current].order;
  return BATCH_STATUSES.find((s) => BATCH_STATUS[s].order === order + 1) ?? null;
}

/**
 * Le style d'un statut.
 *
 * ⚠️ Un statut ABSENT vaut « planifié » : un brassin qu'on vient de créer n'a
 * pas encore d'état, et c'est le bon défaut.
 *
 * Un statut INCONNU, lui, ne doit surtout pas passer pour « planifié ». C'est
 * exactement le bug qu'on a corrigé : « annulé » s'affichait « Planifié » parce
 * qu'une table incomplète retombait sur le défaut. Une valeur qu'on ne sait pas
 * lire doit se VOIR, pour qu'on aille regarder d'où elle vient.
 */
export function statusOf(status: BatchStatus | undefined): StatusStyle {
  if (status === undefined) return BATCH_STATUS.planifie;
  return (
    BATCH_STATUS[status] ?? {
      label: `Statut inconnu (${status})`,
      hint: 'Ce statut ne figure pas dans la table — signale-le.',
      chip: 'bg-alert/10 text-alert border-alert/40',
      // Sans savoir ce que c'est, on le suppose actif : un brassin qu'on croit
      // fini alors qu'il fermente encore est la plus coûteuse des deux erreurs.
      active: true,
      order: 99
    }
  );
}
