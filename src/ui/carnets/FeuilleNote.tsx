/**
 * La feuille ··· d'une note (R20, R22 ; g4:v03-11 G24, g4:v02-12) : Modifier, Changer en façon, Changer en critère, Supprimer
 * (rouge), et Déplacer vers un autre carnet (paquet 1). Accès second : elle s'ouvre dans la page, sous la note, jamais en boîte du navigateur. En tête, si
 * `aides.noteEnCritere` et que l'IA l'a vu (G25, g5:v08-19) : « ✻ Ressemble à un critère · Passer en Ce qui compte » [Passer].
 * Supprimer n'a pas de confirmation : le retour « Note supprimée · Annuler » prend la place de la note (G32, Bandeau).
 */
import React from 'react';
import { ArrowRightToLine, GitFork, Pencil, Target, Trash2, X } from 'lucide-react';
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
  /**
   * Paquet 1, PCN-178 et 182 (tests en ligne 2 et 3) : « Déplacer » une note vers un autre carnet (le réfractomètre resté dans le
   * Fermenteur). `carnets` : les autres carnets, le plus proche de la note d'abord.
   */
  carnets?: readonly { id: string; titre: string }[];
  onDeplacer?: (vers: string) => void;
}

export function FeuilleNote(p: FeuilleNoteProps) {
  const [vers, setVers] = React.useState(false);
  const autres = p.onDeplacer ? p.carnets ?? [] : [];
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
      {autres.length > 0 && (
        <button type="button" role="menuitem" className="cn-feuille-item" aria-expanded={vers} onClick={() => setVers(v => !v)}><ArrowRightToLine size={18} aria-hidden /> Déplacer</button>
      )}
      {vers && autres.map(c => (
        <button key={c.id} type="button" role="menuitem" className="cn-feuille-item cn-feuille-vers" onClick={() => p.onDeplacer!(c.id)}><span className="cn-mut">dans</span> {c.titre}</button>
      ))}
      <button type="button" role="menuitem" className="cn-feuille-item cn-rouge" onClick={p.onSupprimer}><Trash2 size={18} aria-hidden /> Supprimer</button>
      <button type="button" className="cn-feuille-item cn-mut" onClick={p.onFermer}><X size={18} aria-hidden /> Fermer</button>
    </div>
  );
}
