// « Un doute ? Relire plus finement » : le geste de l'utilisateur qui doute d'une lecture. Visible sur toute pièce lue (pas seulement en échec), discret : un bouton
// secondaire de la hauteur des autres (28 px), sous la vérification du justificatif. Aucun nom de modèle à l'écran : la lecture plus fine est un mot, le serveur choisit.
// Ce que la relecture remplace est dit avant de partir (la lecture actuelle, tes retouches comprises) : un second toucher confirme, « Annuler » ramène au repos.
import React, { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { MESSAGE_RELECTURE_PAS_MIEUX } from './comparerRelecture';

export const LIBELLE_RELIRE = 'Un doute ? Relire plus finement';

export interface PropsRelireFin {
  /** Une relecture est en route : le bouton est remplacé par l'attente. */
  enCours: boolean;
  /** Le message de la dernière relecture ratée (la lecture actuelle reste en place) ; `null` sinon. */
  erreur: string | null;
  /** La dernière relecture n'a pas fait mieux (moins de lignes ou statut plus mauvais) : la lecture d'avant est gardée, et c'est dit. */
  pasMieux?: boolean;
  /** Hors ligne : le bouton est grisé et dit pourquoi. */
  horsLigne: boolean;
  /** Une autre action tient l'écran (enregistrement, lecture) : le bouton est grisé. */
  desactive?: boolean;
  onRelire: () => void;
}

export function RelireFin(p: PropsRelireFin) {
  const [confirme, setConfirme] = useState(false);
  const bloque = p.horsLigne || p.desactive === true;
  if (p.enCours) return <div data-dp="relire-fin" data-dp-etat="en-cours" role="status" className="flex min-h-7 items-center gap-1.5 px-0.5 text-sm text-cave-200">
    <Loader2 size={14} aria-hidden className="shrink-0 animate-spin text-hop"/>Relecture plus fine en cours… la lecture actuelle reste en place jusqu’au résultat.
  </div>;
  const erreur = p.erreur ? <p data-dp="relire-fin-erreur" role="alert" className="text-sm text-attention">{p.erreur}</p> : null;
  const note = p.pasMieux ? <p data-dp="relire-fin-pas-mieux" role="status" className="text-sm text-cave-300">{MESSAGE_RELECTURE_PAS_MIEUX}</p> : null;
  if (confirme && !bloque) return <div data-dp="relire-fin" data-dp-etat="confirmer" className="space-y-1">
    {erreur}
    <p className="text-xs text-cave-300">La nouvelle lecture remplace celle-ci, tes retouches comprises.</p>
    <div className="flex flex-wrap items-center gap-1.5">
      <button type="button" data-dp-relire-oui onClick={() => { setConfirme(false); p.onRelire(); }} className="inline-flex min-h-7 items-center gap-1 rounded-control border border-ebc-straw bg-ebc-straw px-2.5 text-sm font-semibold text-cave-950"><RefreshCw size={14} aria-hidden/>Relire</button>
      <button type="button" data-dp-relire-non onClick={() => setConfirme(false)} className="min-h-7 rounded-control border border-cave-600 px-2.5 text-sm text-cave-200">Annuler</button>
    </div>
  </div>;
  return <div data-dp="relire-fin" data-dp-etat="repos" className="space-y-1">
    {erreur}{note}
    <button type="button" data-dp-relire disabled={bloque} title={p.horsLigne ? 'Hors ligne : la relecture a besoin du réseau.' : undefined} onClick={() => setConfirme(true)}
      className="inline-flex min-h-7 max-w-full items-center gap-1 rounded-control border border-cave-600 px-2.5 text-sm text-cave-200 disabled:opacity-50">
      <RefreshCw size={14} aria-hidden className="shrink-0"/><span className="min-w-0 truncate">{LIBELLE_RELIRE}</span>
    </button>
    {p.horsLigne ? <p className="text-xs text-cave-400">Hors ligne : la relecture reprend avec le réseau.</p> : null}
  </div>;
}
