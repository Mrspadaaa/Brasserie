import type { PlusPageAction, PlusPageDeclaration } from '../ui/plusPage';
import { ajouterPalierDeFin } from '../ui/paliers/ajoutPalier';

/**
 * Les actions que l'assistant de recette met en tête du menu du « + » (b1r, 15.11 : « certaines actions doivent toujours être
 * possible, juste celle de l'écran actuel sont plus mis en avant »). À chaque étape : ajouter un ingrédient de l'étape quand elle
 * en a un, enregistrer la recette, l'exporter. « Partout » reste dessous, entier. Pas de « Aller à » (16.11) : le fil d'étapes,
 * visible en haut de l'écran, le fait déjà, et le menu tient ainsi sous ~300 px à 390.
 *
 * Aucun geste n'est refait ici : « Ajouter » appelle le geste du « + » de l'étape (Paliers : la même fonction que le « + » de la
 * courbe) ou met le curseur dans le champ d'ajout que l'étape montre déjà ; « Enregistrer » et « Exporter » appellent les fonctions
 * de l'assistant. Une étape sans champ d'ajout (Identité, Eau et sels, Récapitulatif : les sels se dosent, ils ne s'ajoutent pas)
 * n'en propose pas : jamais un geste vide.
 */

interface AjoutEtape {
  /** Le libellé quand rien n'est posé ; `libellePose` quand l'étape a déjà son ingrédient (Levure : « Changer de levure »). */
  label: string;
  libellePose?: string;
  /** Le champ que l'étape montre pour ajouter : il prend le curseur. */
  selecteur?: string;
  /** Ce qu'on touche quand le champ n'est pas montré. */
  repli?: string;
  /** Le champ où le curseur arrive après le repli (la vue ouverte par le repli). */
  apresRepli?: string;
  /** Un geste de l'étape, appelé tel quel (il rend `false` s'il n'a rien fait). */
  action?: () => boolean;
}

/** Par identifiant d'étape. Les sélecteurs sont ceux des composants d'étape (`data-booster`, `aria-label`) : un test les exerce. */
export const AJOUT_PAR_ETAPE: Record<string, AjoutEtape | undefined> = {
  fermentescibles: { label: 'Ajouter un malt ou un sucre', selecteur: 'input[data-role="ajout"]' },
  houblons: { label: 'Ajouter un houblon', selecteur: '[data-etat="etat-etape-champ-ajouter"], input[aria-label^="Ajouter un houblon en"]' },
  /* Le champ « Changer de levure » de Ma levure quand il est montré ; sinon l'onglet « Chercher » de l'étape, puis son champ de recherche. */
  levure: {
    label: 'Choisir une levure', libellePose: 'Changer de levure', selecteur: 'input[data-booster="ajout-levure"]',
    repli: 'button[data-vue-id="chercher"]', apresRepli: 'input[aria-label="Nom, fabricant ou code"]'
  },
  /* Paliers : le « + » de la courbe est un élément SVG, pas un bouton : on appelle sa fonction, on ne le cherche pas dans le DOM. */
  paliers: { label: 'Ajouter un palier', action: ajouterPalierDeFin }
};

/** Le curseur dans le champ, quand il apparaît (la vue ouverte par un repli se monte au rendu suivant). */
function focusQuandPresent(selecteur: string, essais = 20): void {
  const champ = document.querySelector<HTMLElement>(selecteur);
  if (champ) { champ.scrollIntoView?.({ block: 'center' }); champ.focus(); return; }
  if (essais > 0) window.setTimeout(() => focusQuandPresent(selecteur, essais - 1), 50);
}

/** Lance l'ajout de l'étape ; `false` : rien n'était à lancer. */
export function lancerAjout(etape: string): boolean {
  const ajout = AJOUT_PAR_ETAPE[etape];
  if (!ajout) return false;
  if (ajout.action) return ajout.action();
  const champ = ajout.selecteur ? document.querySelector<HTMLElement>(ajout.selecteur) : null;
  if (champ) { champ.scrollIntoView?.({ block: 'center' }); champ.focus(); return true; }
  const repli = ajout.repli ? document.querySelector<HTMLElement>(ajout.repli) : null;
  if (!repli) return false;
  repli.click();
  if (ajout.apresRepli) focusQuandPresent(ajout.apresRepli);
  return true;
}

export interface EntreesPlusAssistant {
  steps: ReadonlyArray<{ id: string; label: string; shortLabel?: string }>;
  step: string;
  /** Une levure est déjà posée : « Changer de levure » au lieu de « Choisir une levure ». */
  levurePosee?: boolean;
  /** Enregistrement impossible (en cours, ou brouillon en lecture seule) : ses deux gestes disparaissent. */
  enregistrable: boolean;
  enregistrer: (puisBrasser: boolean) => void;
  exporter: () => void;
  /** Une recette enregistrée (pas une copie ni une nouvelle) : « Supprimer la recette », en dernier et en rouge (16.11, 36). */
  supprimer?: () => void;
}

/** La déclaration du « + » pour l'étape courante, contre le pouce d'abord : ajouter, enregistrer, exporter. */
export function declarationPlusAssistant(e: EntreesPlusAssistant): PlusPageDeclaration {
  const courante = e.steps.find(s => s.id === e.step);
  const ajout = AJOUT_PAR_ETAPE[e.step];
  const actions: PlusPageAction[] = [];
  if (ajout) {
    const label = e.step === 'levure' && e.levurePosee && ajout.libellePose ? ajout.libellePose : ajout.label;
    actions.push({ id: 'ajouter', label, genre: 'ajouter', lancer: () => { lancerAjout(e.step); } });
  }
  if (e.enregistrable) {
    actions.push({ id: 'enregistrer', label: 'Enregistrer la recette', genre: 'enregistrer', lancer: () => e.enregistrer(false) });
    if (e.step === 'recap') actions.push({ id: 'enregistrer-brasser', label: 'Enregistrer et préparer un brassin', genre: 'enregistrer', lancer: () => e.enregistrer(true) });
  }
  actions.push({ id: 'exporter', label: 'Exporter la recette', hint: 'copier le texte', genre: 'exporter', lancer: e.exporter });
  if (e.supprimer) actions.push({ id: 'supprimer', label: 'Supprimer la recette', hint: 'après confirmation', genre: 'supprimer', lancer: e.supprimer });
  return { titre: `Assistant · ${courante?.shortLabel ?? courante?.label ?? ''}`.trim(), actions };
}
