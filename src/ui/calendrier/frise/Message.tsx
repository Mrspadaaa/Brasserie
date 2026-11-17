import React from 'react';
import { ChevronRight, Undo2 } from 'lucide-react';

/**
 * Le message du calendrier (E33, D-200 ; « Trop d'info quand on bouge qqch, ça devient illisible ») : UN seul à la fois, bandeau Annuler ou
 * alerte de promesse, deux lignes au plus, jamais posé sur un nom. Il part au premier défilement de 24 px, à l'ouverture d'un détail ou
 * d'un menu ; son texte laisse passer le doigt. Il vit en bas, au-dessus des onglets et à gauche du + volant, comme le jouable (passes 7 et 8).
 */

export interface MessageCal {
  /** Change à chaque message : l'ancien est remplacé, jamais empilé. */
  id: number;
  role: 'status' | 'alert';
  /** « S51 : 5 064 → 4 524 » */
  texte: string;
  /** « Sans date › », « dans Finances › », « Ouvrir le brassin › » */
  lien?: { texte: string; agir: () => void };
  annuler?: () => void;
  /** f6-b : [Livrer le 5 janv.]. */
  livrer?: { texte: string; agir: () => void };
  /** Le détail (client, caisse), au toucher de la ligne. */
  detail?: string;
}

export interface MessageProps { message: MessageCal | null; onFermer: () => void; dureeMs?: number }

export const DUREE_MESSAGE_MS = 7000;

export const Message: React.FC<MessageProps> = ({ message, onFermer, dureeMs = DUREE_MESSAGE_MS }) => {
  const [detailOuvert, setDetailOuvert] = React.useState(false);
  const fermer = React.useRef(onFermer);
  fermer.current = onFermer;
  const id = message?.id;
  React.useEffect(() => {
    setDetailOuvert(false);
    if (id === undefined) return;
    const t = setTimeout(() => fermer.current(), dureeMs);
    return () => clearTimeout(t);
  }, [id, dureeMs]);
  if (!message) return null;
  const { role, texte, lien, annuler, livrer, detail } = message;
  const corps = (
    <>
      <span className="cal-msg-t" data-msg-texte>{texte}</span>
      {lien && (
        <>
          <span className="cal-msg-sep"> · </span>
          <button type="button" className="cal-msg-lien" onClick={e => { e.stopPropagation(); lien.agir(); }}>{lien.texte}</button>
        </>
      )}
    </>
  );
  return (
    <div role={role} className={`cal-msg${role === 'alert' ? ' cal-msg-alerte' : ''}`} data-message>
      <div className="cal-msg-l">
        {detail ? (
          <button type="button" className="cal-msg-ligne" aria-expanded={detailOuvert} onClick={() => setDetailOuvert(o => !o)}>
            {corps}
            <ChevronRight size={16} aria-hidden="true" className={detailOuvert ? 'cal-msg-ch cal-msg-ch-o' : 'cal-msg-ch'} />
          </button>
        ) : <p className="cal-msg-ligne">{corps}</p>}
        {detail && detailOuvert && <small className="cal-msg-detail">{detail}</small>}
      </div>
      {(livrer || annuler) && (
        <div className="cal-msg-bt">
          {livrer && <button type="button" className="cal-msg-b cal-msg-b-pri" onClick={livrer.agir}>{livrer.texte}</button>}
          {annuler && (
            <>
              <span className="sr-only"> · </span>
              <button type="button" className="cal-msg-b" onClick={annuler}><Undo2 size={16} aria-hidden="true" />Annuler</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
