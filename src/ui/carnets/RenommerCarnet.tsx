/**
 * Renommer l'idée (R21 ; g4:v02-14 → g4:v01-13 ; G28 ✎ près du titre, accès direct ; G29 ; G30 dans Bandeau).
 * Le cadre « ✎ Se renomme ici · titre du carnet » s'ouvre sous le titre, avec le titre dans un champ, « Renommer » et
 * « Annuler · Entrée = renommer ». G29 (R46) : si `aides.renommerPropose` et qu'une proposition non appliquée existe, le champ
 * arrive prérempli : « ✻ proposé d'après « <phrase> » · avant : « <titre> » » ; Entrée renomme, un seul geste. Sinon, le titre actuel.
 */
import React, { useId, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Provenance, type AidesV } from './EtatIA';

export interface RenommerCarnetProps {
  titre: string;
  aides: AidesV;
  /** Dernière proposition non appliquée (`carnetMessage.titrePropose`) et la phrase du message qui l'a produite. */
  proposition?: { titre: string; phrase: string } | null;
  onRenommer: (titre: string) => void;
  onAnnuler: () => void;
}

export function RenommerCarnet(p: RenommerCarnetProps) {
  const propose = p.aides.renommerPropose && p.proposition && p.proposition.titre.trim() && p.proposition.titre !== p.titre ? p.proposition : null;
  const [valeur, setValeur] = useState(propose ? propose.titre : p.titre);
  const id = useId();
  const pret = valeur.trim().length > 0 && valeur.trim() !== p.titre;
  return (
    <form
      className="cn-cadre cn-renommer"
      aria-label="Se renomme ici"
      onSubmit={e => { e.preventDefault(); if (pret) p.onRenommer(valeur.trim()); }}
    >
      <div className="cn-cadre-tete"><span className="cn-vert"><Pencil size={16} aria-hidden /> Se renomme ici</span><span className="cn-mut"> · titre du carnet</span></div>
      {propose && (
        <p className="cn-mut"><Provenance origine="ia" /> proposé d'après « {propose.phrase} » · avant : « {p.titre} »</p>
      )}
      <label htmlFor={id} className="cn-cache">Titre du carnet</label>
      <input
        id={id}
        className="cn-entree"
        value={valeur}
        autoFocus
        enterKeyHint="done"
        onChange={e => setValeur(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') p.onAnnuler(); }}
      />
      <div className="cn-rang-boutons">
        <button type="button" className="cn-lien" onClick={p.onAnnuler}>Annuler</button>
        <span className="cn-mut cn-sp">Entrée = renommer</span>
        <button type="submit" className="cn-action" disabled={!pret}>Renommer</button>
      </div>
    </form>
  );
}
