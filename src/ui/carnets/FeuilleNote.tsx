/**
 * La feuille ··· d'une note (R20, R22 ; g4:v03-11 G24, g4:v02-12) : Modifier, Changer en façon, Changer en critère, Supprimer
 * (rouge). Accès second : elle s'ouvre dans la page, sous la note, jamais en boîte du navigateur. En tête, si
 * `aides.noteEnCritere` et que l'IA l'a vu (G25, g5:v08-19) : « ✻ Ressemble à un critère · Passer en Ce qui compte » [Passer].
 * Supprimer n'a pas de confirmation : le retour « Note supprimée · Annuler » prend la place de la note (G32, Bandeau).
 */
import React from 'react';
import { GitFork, Pencil, Target, Trash2, X } from 'lucide-react';
import { Provenance, type AidesV, type NoteV } from './EtatIA';

export interface FeuilleNoteProps {
  note: NoteV;
  aides: AidesV;
  /** L'IA a marqué la note `commeCritere` (G25). */
  ressembleCritere?: boolean;
  onPasserCritere?: () => void;
  onModifier: () => void;
  onChangerEnFacon: () => void;
  onChangerEnCritere: () => void;
  onSupprimer: () => void;
  onFermer: () => void;
}

export function FeuilleNote(p: FeuilleNoteProps) {
  return (
    <div className="cn-feuille" role="menu" aria-label={`Note : ${p.note.texte}`}>
      {p.aides.noteEnCritere && p.ressembleCritere && p.onPasserCritere && (
        <div className="cn-aide">
          <span className="cn-sp"><Provenance origine="ia" /> Ressemble à un critère · Passer en Ce qui compte</span>
          <button type="button" className="cn-puce" role="menuitem" onClick={p.onPasserCritere}>Passer</button>
        </div>
      )}
      <button type="button" role="menuitem" className="cn-feuille-item" onClick={p.onModifier}><Pencil size={18} aria-hidden /> Modifier</button>
      <button type="button" role="menuitem" className="cn-feuille-item" onClick={p.onChangerEnFacon}><GitFork size={18} aria-hidden /> Changer en façon</button>
      <button type="button" role="menuitem" className="cn-feuille-item" onClick={p.onChangerEnCritere}><Target size={18} aria-hidden /> Changer en critère</button>
      <button type="button" role="menuitem" className="cn-feuille-item cn-rouge" onClick={p.onSupprimer}><Trash2 size={18} aria-hidden /> Supprimer</button>
      <button type="button" className="cn-feuille-item cn-mut" onClick={p.onFermer}><X size={18} aria-hidden /> Fermer</button>
    </div>
  );
}
