import React from 'react';
import { ChevronRight, Undo2 } from 'lucide-react';
import '../message.css';

/**
 * Le message du calendrier (E33, D-200 ; « Trop d'info quand on bouge qqch, ça devient illisible ») : UN seul canal pour tout l'onglet,
 * tenu par `CalendrierTab`. Les gestes de la frise, les refus, les promesses (f6-b) et les messages de l'en-tête (« Tire jusqu'au bout :
 * l'année », « Tourne le téléphone : 13 semaines », par `onMessage`) y passent : un message chasse le précédent, jamais deux à la fois.
 * Il part au premier défilement de 24 px, à un nouveau geste, à l'ouverture d'un détail, d'un menu, d'une feuille, et au changement de vue.
 *
 * Place : une bande basse, au-dessus des onglets et à gauche du + volant ; l'alerte d'une promesse prend toute la largeur au-dessus du +, son
 * texte entier sur une ligne et ses boutons sur la suivante. Son texte laisse passer le doigt (`pointer-events: none` hors des boutons). Il ne
 * couvre aucun titre de rangée : s'il en croise un, il remonte au-dessus.
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
  /** Un message de l'en-tête : son retrait (`onMessage(null)`) ne chasse que lui. */
  origine?: 'entete';
}

export interface MessageProps { message: MessageCal | null; onFermer: () => void; dureeMs?: number }

export const DUREE_MESSAGE_MS = 7000;

/** Les titres de rangée que le message ne doit jamais couvrir. */
/** La boîte du texte d'un titre (le h3 peut être plus large que son mot). */
const texteDe = (t: Element): DOMRect => {
  const g = typeof document.createRange === 'function' ? document.createRange() : null;
  if (!g || typeof g.getBoundingClientRect !== 'function') return t.getBoundingClientRect();
  g.selectNodeContents(t);
  const r = g.getBoundingClientRect();
  return r.width > 0 ? r : t.getBoundingClientRect();
};
const TITRES = '[data-rangee] .cal-nom';

export const Message: React.FC<MessageProps> = ({ message, onFermer, dureeMs = DUREE_MESSAGE_MS }) => {
  const [detailOuvert, setDetailOuvert] = React.useState(false);
  const racine = React.useRef<HTMLDivElement>(null);
  const fermer = React.useRef(onFermer);
  fermer.current = onFermer;
  const id = message?.id;
  React.useEffect(() => {
    setDetailOuvert(false);
    if (id === undefined) return;
    const t = setTimeout(() => fermer.current(), dureeMs);
    return () => clearTimeout(t);
  }, [id, dureeMs]);

  /* jamais sur un titre de rangée. S'il en croise un : il se pousse à droite de la colonne des titres (paysage, 1280), sinon il remonte juste
     au-dessus (au plus trois titres, jamais au-dessus du milieu de l'écran). Recalculé à la rotation et au redimensionnement. */
  React.useLayoutEffect(() => {
    const el = racine.current;
    if (!el || id === undefined) return undefined;
    const placer = () => {
      el.style.transform = ''; el.style.left = '';
      const r = el.getBoundingClientRect();
      if (r.height === 0) return;
      const titres = [...document.querySelectorAll(TITRES)].map(texteDe).filter(t => t.height > 0 && t.bottom > 0 && t.top < window.innerHeight);
      const croisent = titres.filter(t => t.top < r.bottom && t.bottom > r.top && t.left < r.right && t.right > r.left);
      if (!croisent.length) return;
      const gauche = Math.max(...croisent.map(t => t.right)) + 8;
      const libres = titres.filter(t => t.top < r.bottom && t.bottom > r.top && t.right > gauche);
      if (r.right - gauche >= 220 && libres.length === 0) { el.style.left = Math.round(gauche) + 'px'; return; }
      let haut = r.top, bas = r.bottom, decale = 0;
      const tries = [...titres].sort((a, b) => b.top - a.top);
      for (let essai = 0; essai < 3; essai++) {
        const croise = tries.find(t => t.top < bas && t.bottom > haut && t.left < r.right && t.right > r.left);
        if (!croise) break;
        const d = bas - (croise.top - 4);
        if (haut - d < window.innerHeight / 2) break;
        decale += d; haut -= d; bas -= d;
      }
      if (decale > 0) el.style.transform = 'translateY(-' + Math.round(decale) + 'px)';
    };
    placer();
    /* à la rotation, la frise se remet en page après l'événement : on replace après son rendu */
    const minuteries: Array<ReturnType<typeof setTimeout>> = [];
    const surTaille = () => { placer(); minuteries.push(setTimeout(placer, 150), setTimeout(placer, 500)); };
    window.addEventListener('resize', surTaille);
    return () => { window.removeEventListener('resize', surTaille); minuteries.forEach(clearTimeout); };
  }, [id]);

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
    <div ref={racine} role={role} className={`cal-msg${role === 'alert' ? ' cal-msg-alerte' : ''}`} data-message data-msg-origine={message.origine ?? 'calendrier'}>
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
