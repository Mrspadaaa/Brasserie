import React from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, Undo2 } from 'lucide-react';
import '../message.css';

/**
 * Le message du calendrier (E33, D-200 ; « Trop d'info quand on bouge qqch, ça devient illisible ») : UN seul canal pour tout l'onglet,
 * tenu par `CalendrierTab`. Les gestes de la frise, les refus, les promesses (f6-b) et les messages de l'en-tête (« Tire jusqu'au bout :
 * l'année », « Tourne le téléphone : 13 semaines », par `onMessage`) y passent : un message chasse le précédent, jamais deux à la fois.
 * Il part au premier défilement de 24 px, à un nouveau geste, à l'ouverture d'un détail, d'un menu, d'une feuille, et au changement de vue.
 *
 * Place : une bande basse, au-dessus des onglets et à gauche du + volant ; l'alerte d'une promesse prend toute la largeur au-dessus du +, son
 * texte entier sur une ligne et ses boutons sur la suivante. Son texte laisse passer le doigt (`pointer-events: none` hors des boutons).
 *
 * CRITIQUE-5 n° 5 (E31, E33, D-114) : le lien n'est jamais coupé. Il passe avec les boutons (« Finances › », forme courte, puis « Annuler ») ;
 * le texte et son effet (« Annulé · S49 : 1 088 → 1 988 ») tiennent la première ligne, les boutons la seconde quand la place manque.
 * N° 13 (E33, D-200) : jamais sur un nom de rangée ni de chose. Il cherche une bande libre (au-dessus des onglets, puis plus haut jusque sous
 * l'en-tête) ; faute de place, il déplace la vue : il entre au pied de l'en-tête collé, dans son flux, et la frise descend de sa hauteur.
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
 * S47 · vente confirmée »), qui cède le premier (une ligne, points de suite), et son effet, entier.
 */
export function separerEffet(texte: string): { nom: string; effet: string | null } {
  const morceaux = texte.split(' · ');
  const i = morceaux.findIndex(m => /^S\d+ : .+ → .+$/.test(m.trim()));
  if (i < 0 || morceaux.length < 2) return { nom: texte, effet: null };
  return { nom: morceaux.filter((_, k) => k !== i).join(' · '), effet: morceaux[i].trim() };
}

/** N° 5 : la forme courte d'un lien du message (« dans Finances › » devient « Finances › ») : elle tient avec « Annuler » à 390. */
export const lienCourt = (texte: string): string => texte.replace(/^dans\s+/i, '');

/** La boîte du texte d'un titre (le h3 peut être plus large que son mot). */
const texteDe = (t: Element): DOMRect => {
  const g = typeof document.createRange === 'function' ? document.createRange() : null;
  if (!g || typeof g.getBoundingClientRect !== 'function') return t.getBoundingClientRect();
  g.selectNodeContents(t);
  const r = g.getBoundingClientRect();
  return r.width > 0 ? r : t.getBoundingClientRect();
};
/* les noms que le message ne couvre jamais (E33) : titres de rangée, noms et montants des choses, pastilles, renvois */
const TITRES = '[data-nom-rangee], [data-rangee] .cal-nom';
export const NOMS_MESSAGE = `${TITRES}, [data-frise] .cal-lbl-t, [data-frise] .cal-lbl-m, [data-frise] .cal-lbl-j, [data-frise] .cal-duree, [data-frise] .cal-lie, [data-frise] .cal-pastille-p, [data-frise] .cal-renvoi`;
/* en paysage, les barres et les marques elles-mêmes (leur nom et leur durée vivent dedans) */
const OBJETS_PAYSAGE = '[data-frise] [data-chose], [data-frise] .cal-lbl';

type Boite = { top: number; bottom: number; left: number; right: number };
const decaler = (r: Boite, dx: number, dy: number): Boite => ({ top: r.top + dy, bottom: r.bottom + dy, left: r.left + dx, right: r.right + dx });

export const Message: React.FC<MessageProps> = ({ message, onFermer, dureeMs = DUREE_MESSAGE_MS }) => {
  const [detailOuvert, setDetailOuvert] = React.useState(false);
  /* n° 13 : l'en-tête collé où le message est entré faute de bande libre ; `null` : il flotte à sa place */
  const [entete, setEntete] = React.useState<Element | null>(null);
  const idPose = React.useRef<number | undefined>(undefined);
  if (idPose.current !== message?.id) { idPose.current = message?.id; if (entete) setEntete(null); }
  /* l'ancrage du défilement de la page, coupé le temps que le message vit dans l'en-tête, puis rendu tel quel */
  const ancrage = React.useRef<{ el: HTMLElement; avant: string } | null>(null);
  React.useEffect(() => {
    if (entete) return undefined;
    const a = ancrage.current;
    if (a) { a.el.style.overflowAnchor = a.avant; ancrage.current = null; }
    return undefined;
  }, [entete]);
  React.useEffect(() => () => { const a = ancrage.current; if (a) a.el.style.overflowAnchor = a.avant; }, []);
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

  /* Jamais sur un nom (n° 13). Ordre : sa place (bande basse) ; à droite de la colonne des titres (paysage, 1280) ; la première bande libre en
     remontant jusque sous l'en-tête, avec des décalages de côté ; faute de place, il entre au pied de l'en-tête collé et la frise descend
     d'autant. Recalculé à la rotation, au redimensionnement et après le rendu d'une écriture. */
  React.useLayoutEffect(() => {
    const el = racine.current;
    if (!el || id === undefined || entete) return undefined;
    const placer = () => {
      if (!el.isConnected) return;
      el.style.transform = ''; el.style.left = ''; delete el.dataset.place;
      let r: Boite = el.getBoundingClientRect();
      if (r.bottom - r.top === 0) return;
      const vh = window.innerHeight;
      /* CRITIQUE-9 n° 7 (E33, D-200) : en paysage, une rangée fait 20 px et la barre porte son nom et « J0 / 28 · prête … » : le message ne se
         pose sur aucune barre (as-gestes.js : `.bar` est un obstacle), il va entre la bande et les rangées, comme en portrait */
      const paysage = !!document.querySelector('[data-frise] .cal-rangee-l');
      const visible = (t: DOMRect) => t.width > 0 && t.height > 0 && t.bottom > 0 && t.top < vh;
      const boites = [
        ...[...document.querySelectorAll(NOMS_MESSAGE)].filter(t => !el.contains(t)).map(texteDe),
        ...(paysage ? [...document.querySelectorAll(OBJETS_PAYSAGE)].filter(t => !el.contains(t)).map(t => t.getBoundingClientRect()) : [])
      ].filter(visible);
      const touche = (b: Boite) => boites.some(t => t.top < b.bottom + 2 && t.bottom > b.top - 2 && t.left < b.right + 2 && t.right > b.left - 2);
      if (!touche(r)) { el.dataset.place = 'bas'; return; }
      /* 1280 : à droite de la colonne des titres, s'il y a la place et qu'aucun nom n'y est ; jamais en paysage, où cette place est sur les barres */
      const titres = [...document.querySelectorAll(TITRES)].filter(t => !el.contains(t)).map(texteDe).filter(t => t.width > 0 && t.height > 0);
      const croisent = paysage ? [] : titres.filter(t => t.top < r.bottom && t.bottom > r.top && t.left < r.right && t.right > r.left);
      if (croisent.length) {
        const gauche = Math.max(...croisent.map(t => t.right)) + 8;
        if (r.right - gauche >= 220) {
          el.style.left = Math.round(gauche) + 'px';
          r = el.getBoundingClientRect();
          if (!touche(r)) { el.dataset.place = 'cote'; return; }
          el.style.left = '';
          r = el.getBoundingClientRect();
        }
      }
      const entete = document.querySelector('[data-entete-zone]')?.getBoundingClientRect();
      const plafond = Math.max(8, entete && entete.height > 0 ? entete.bottom + 4 : 8);
      /* au 1280 et en paysage, la place libre peut être à côté : chaque hauteur essaie aussi des décalages de côté, dans l'écran */
      const dxMin = Math.min(0, 8 - r.left), dxMax = Math.max(0, window.innerWidth - 8 - r.right);
      const decalages = [0];
      for (let d = 24; d <= Math.max(-dxMin, dxMax); d += 24) { if (d <= dxMax) decalages.push(d); if (-d >= dxMin) decalages.push(-d); }
      for (let dy = 0; r.top - dy >= plafond; dy += 4) {
        const dx = decalages.find(x => !touche(decaler(r, x, -dy)));
        if (dx !== undefined) { el.style.transform = `translate(${dx}px, -${dy}px)`; el.dataset.place = 'bande'; return; }
      }
      /* faute de place : la vue se déplace. Le message entre au pied de l'en-tête collé (dans son flux) : l'en-tête grandit de sa hauteur et
         la frise passe dessous, décalée d'autant ; aucun nom n'est couvert, la position du défilement ne change pas (le départ à 24 px tient) */
      const zone = document.querySelector('[data-entete-zone]');
      if (zone) {
        /* sans ancrage du défilement : le navigateur ne compense pas la croissance de l'en-tête en défilant (ce défilement chasserait le message) */
        const page = document.scrollingElement as HTMLElement | null;
        if (page && !ancrage.current) { ancrage.current = { el: page, avant: page.style.overflowAnchor }; page.style.overflowAnchor = 'none'; }
        el.dataset.place = 'sous-entete'; setEntete(zone); return;
      }
      el.dataset.place = 'sur-nom';
    };
    /* à la rotation, et après une écriture (la frise se remet en page après le message : Livrer, Annuler), on replace après son rendu */
    const minuteries: Array<ReturnType<typeof setTimeout>> = [];
    placer();
    minuteries.push(setTimeout(placer, 150), setTimeout(placer, 500));
    const surTaille = () => { placer(); minuteries.push(setTimeout(placer, 150)); };
    window.addEventListener('resize', surTaille);
    return () => { window.removeEventListener('resize', surTaille); minuteries.forEach(clearTimeout); };
  }, [id, entete]);

  if (!message) return null;
  const { role, texte, lien, annuler, livrer, detail } = message;
  const { nom, effet } = separerEffet(texte);
  /* avec un effet chiffré : le nom cède (points de suite), « · S49 : 1 088 → 1 988 » reste entier ; sinon le texte, deux lignes au plus */
  const corps = effet ? (
    <>
      <span className="cal-msg-t cal-msg-nom" data-msg-texte>{nom}</span>
      <span className="cal-msg-sep-v"> · </span>
      <span className="cal-msg-effet" data-msg-effet>{effet}</span>
    </>
  ) : <span className="cal-msg-t" data-msg-texte>{texte}</span>;
  const boite = (
    <div
      ref={racine} role={role} className={`cal-msg${role === 'alert' ? ' cal-msg-alerte' : ''}${entete ? ' cal-msg-entete' : ''}`} data-message
      data-msg-origine={message.origine ?? 'calendrier'} data-place={entete ? 'sous-entete' : undefined}
    >
      <div className={`cal-msg-l${effet ? ' cal-msg-l-effet' : ''}`}>
        {detail ? (
          <button type="button" className={`cal-msg-ligne${effet ? ' cal-msg-2l' : ''}`} aria-expanded={detailOuvert} onClick={() => setDetailOuvert(o => !o)}>
            {corps}
            <ChevronRight size={16} aria-hidden="true" className={detailOuvert ? 'cal-msg-ch cal-msg-ch-o' : 'cal-msg-ch'} />
          </button>
        ) : <p className={`cal-msg-ligne${effet ? ' cal-msg-2l' : ''}`}>{corps}</p>}
        {detail && detailOuvert && <small className="cal-msg-detail">{detail}</small>}
      </div>
      {(lien || livrer || annuler) && (
        <div className="cal-msg-bt" data-msg-boutons>
          {lien && (
            <>
              <span className="sr-only"> · </span>
              <button type="button" className="cal-msg-lien" data-msg-lien aria-label={lien.texte} onClick={e => { e.stopPropagation(); lien.agir(); }}>{lienCourt(lien.texte)}</button>
            </>
          )}
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
  /* au pied de l'en-tête collé (n° 13) : dans son flux, la frise passe dessous */
  return entete && entete.isConnected ? createPortal(boite, entete) : boite;
};
