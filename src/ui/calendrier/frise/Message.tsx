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

/**
 * CRITIQUE-4 n° 13 b (E33) : l'effet chiffré (« S47 : 3 510 → 3 640 ») n'est jamais coupé. Le texte se sépare en son nom (« Café du Pont, 1 fût ·
 * S47 · vente confirmée »), qui cède le premier (une ligne, points de suite), et son effet, entier sur la seconde ligne avec le lien.
 */
export function separerEffet(texte: string): { nom: string; effet: string | null } {
  const morceaux = texte.split(' · ');
  const i = morceaux.findIndex(m => /^S\d+ : .+ → .+$/.test(m.trim()));
  if (i < 0 || morceaux.length < 2) return { nom: texte, effet: null };
  return { nom: morceaux.filter((_, k) => k !== i).join(' · '), effet: morceaux[i].trim() };
}

/** La boîte du texte d'un titre (le h3 peut être plus large que son mot). */
const texteDe = (t: Element): DOMRect => {
  const g = typeof document.createRange === 'function' ? document.createRange() : null;
  if (!g || typeof g.getBoundingClientRect !== 'function') return t.getBoundingClientRect();
  g.selectNodeContents(t);
  const r = g.getBoundingClientRect();
  return r.width > 0 ? r : t.getBoundingClientRect();
};
/* les noms que le message ne couvre jamais (E33) : titres de rangée, noms et montants des choses, pastilles, renvois */
const TITRES = '[data-rangee] .cal-nom';
const NOMS = '[data-rangee] .cal-nom, [data-frise] .cal-lbl-t, [data-frise] .cal-lbl-m, [data-frise] .cal-lie, [data-frise] .cal-pastille-p, [data-frise] .cal-renvoi';

export const Message: React.FC<MessageProps> = ({ message, onFermer, dureeMs = DUREE_MESSAGE_MS }) => {
  const [detailOuvert, setDetailOuvert] = React.useState(false);
  const racine = React.useRef<HTMLDivElement>(null);
  const fermer = React.useRef(onFermer);
  fermer.current = onFermer;
  const id = message?.id;
  /* CRITIQUE-4 n° 20 : une alerte qui attend une décision (« Livrer le 5 janv. ») ne part pas seule au bout de 7 s ; elle part au défilement,
     à un toucher ailleurs, à l'ouverture d'un détail (E33) ou par ses boutons. Le bandeau Annuler, lui, part seul. */
  const attend = !!message?.livrer;
  React.useEffect(() => {
    setDetailOuvert(false);
    if (id === undefined || attend) return;
    const t = setTimeout(() => fermer.current(), dureeMs);
    return () => clearTimeout(t);
  }, [id, dureeMs, attend]);

  /* jamais sur un titre de rangée. S'il en croise un : il se pousse à droite de la colonne des titres (paysage, 1280), sinon il remonte juste
     au-dessus (au plus trois titres, jamais au-dessus du milieu de l'écran). Recalculé à la rotation et au redimensionnement. */
  React.useLayoutEffect(() => {
    const el = racine.current;
    if (!el || id === undefined) return undefined;
    const placer = () => {
      el.style.transform = ''; el.style.left = '';
      let r = el.getBoundingClientRect();
      if (r.height === 0) return;
      const vus = (sel: string) => [...document.querySelectorAll(sel)].filter(t => !el.contains(t)).map(texteDe).filter(t => t.width > 0 && t.height > 0 && t.bottom > 0 && t.top < window.innerHeight);
      const noms = vus(NOMS);
      const touche = (b: DOMRect, dy: number, dx = 0) => noms.some(t => t.top < b.bottom - dy + 2 && t.bottom > b.top - dy - 2 && t.left < b.right + dx + 2 && t.right > b.left + dx - 2);
      if (!touche(r, 0)) return;
      /* paysage, 1280 : à droite de la colonne des titres, s'il y a la place et qu'aucun nom n'y est */
      const titres = vus(TITRES);
      const croisent = titres.filter(t => t.top < r.bottom && t.bottom > r.top && t.left < r.right && t.right > r.left);
      if (croisent.length) {
        const gauche = Math.max(...croisent.map(t => t.right)) + 8;
        if (r.right - gauche >= 220) {
          el.style.left = Math.round(gauche) + 'px';
          r = el.getBoundingClientRect();
          if (!touche(r, 0)) return;
        }
      }
      /* sinon il remonte jusqu'à la première bande libre de noms, jamais sur l'en-tête collé ; sans bande libre, il reste en bas */
      const entete = document.querySelector('[data-entete-zone]')?.getBoundingClientRect();
      const plafond = Math.max(8, entete && entete.height > 0 ? entete.bottom + 4 : 8);
      /* au 1280 et en paysage, la place libre peut être à côté : chaque hauteur essaie aussi des décalages de côté, dans l'écran */
      const dxMin = Math.min(0, 8 - r.left), dxMax = Math.max(0, window.innerWidth - 8 - r.right);
      const decalages = [0];
      for (let d = 24; d <= Math.max(-dxMin, dxMax); d += 24) { if (d <= dxMax) decalages.push(d); if (-d >= dxMin) decalages.push(-d); }
      for (let dy = 0; r.top - dy >= plafond; dy += 4) {
        const dx = decalages.find(x => !touche(r, dy, x));
        if (dx !== undefined) { el.style.transform = `translate(${dx}px, -${dy}px)`; return; }
      }
      el.style.left = '';
    };
    /* à la rotation, et après une écriture (la frise se remet en page après le message : Livrer, Annuler), on replace après son rendu */
    const minuteries: Array<ReturnType<typeof setTimeout>> = [];
    const surTaille = () => { placer(); minuteries.push(setTimeout(placer, 150), setTimeout(placer, 500)); };
    surTaille();
    window.addEventListener('resize', surTaille);
    return () => { window.removeEventListener('resize', surTaille); minuteries.forEach(clearTimeout); };
  }, [id]);

  if (!message) return null;
  const { role, texte, lien, annuler, livrer, detail } = message;
  const { nom, effet } = separerEffet(texte);
  const boutonLien = lien && (
    <>
      <span className="cal-msg-sep"> · </span>
      <button type="button" className="cal-msg-lien" onClick={e => { e.stopPropagation(); lien.agir(); }}>{lien.texte}</button>
    </>
  );
  /* avec un effet chiffré : le nom sur une ligne (il cède), l'effet entier et le lien sur la seconde ; sinon le texte sur deux lignes au plus */
  const corps = effet ? (
    <>
      <span className="cal-msg-t cal-msg-nom" data-msg-texte>{nom}<span className="sr-only"> · </span></span>
      <span className="cal-msg-effet" data-msg-effet>{effet}{boutonLien}</span>
    </>
  ) : (
    <>
      <span className="cal-msg-t" data-msg-texte>{texte}</span>
      {boutonLien}
    </>
  );
  return (
    <div ref={racine} role={role} className={`cal-msg${role === 'alert' ? ' cal-msg-alerte' : ''}`} data-message data-msg-origine={message.origine ?? 'calendrier'}>
      <div className="cal-msg-l">
        {detail ? (
          <button type="button" className={`cal-msg-ligne${effet ? ' cal-msg-2l' : ''}`} aria-expanded={detailOuvert} onClick={() => setDetailOuvert(o => !o)}>
            {corps}
            <ChevronRight size={16} aria-hidden="true" className={detailOuvert ? 'cal-msg-ch cal-msg-ch-o' : 'cal-msg-ch'} />
          </button>
        ) : <p className={`cal-msg-ligne${effet ? ' cal-msg-2l' : ''}`}>{corps}</p>}
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
