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
 * l'en-tête) ; faute de place, il va au pied de l'en-tête collé.
 *
 * CRITIQUE-11 n° 2 b (E33 « ne déplace rien sous le doigt », D-200) : au pied de l'en-tête, il entrait dans son flux et poussait les rangées
 * d'environ 85 px au lâcher (le clic qui suit tombait sur l'œil de Brassins). Il s'y pose désormais en surimpression : une bande de la couleur
 * de l'en-tête, accrochée sous lui (`position: absolute; top: 100%`). L'en-tête garde sa hauteur (E43), rien ne bouge à l'écran ; ce qui passe
 * sous la bande est caché comme sous l'en-tête collé, jamais un texte posé sur un autre.
 * N° 3 (E33, E35) : au grand écran (1024 px et plus), il va toujours dans cette zone : en bas, il couvrait Papiers et le + couvrait Annuler.
 * N° 8 (E31, E37, D-126) : le message d'un geste qui ouvre lui-même son détail (Lier) va aussi dans cette zone, et reste avec le détail.
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
  /**
   * CRITIQUE-11 n° 8 (D-126) : le geste ouvre lui-même son détail (Lier : « Liée à X · Annuler » et le détail de la chose liée, ensemble).
   * Ce message se pose dans la zone de l'en-tête et résiste à l'ouverture de ce détail, au défilement qui le dégage du + et au départ
   * « aucun pas ne suffit ». Les autres messages partent toujours à l'ouverture d'un détail (E33).
   */
  ouvreSonDetail?: boolean;
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

/** CRITIQUE-11 n° 3 : le grand écran (rail à gauche, 1024 px et plus), lu comme le CSS le lit. */
export const grandEcran = (): boolean => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 1024px)').matches;

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

/** Une fois par image (défilement) ; sans `requestAnimationFrame`, au tour suivant. */
function prochaineImage(f: () => void): () => void {
  if (typeof window.requestAnimationFrame === 'function') { const n = window.requestAnimationFrame(f); return () => window.cancelAnimationFrame?.(n); }
  const t = setTimeout(f, 16);
  return () => clearTimeout(t);
}

type Boite = { top: number; bottom: number; left: number; right: number };
const decaler = (r: Boite, dx: number, dy: number): Boite => ({ top: r.top + dy, bottom: r.bottom + dy, left: r.left + dx, right: r.right + dx });

/** Les boîtes des noms visibles hors du message (et, en paysage, des barres) : ce qu'il ne couvre jamais. */
function nomsVisibles(el: HTMLElement): Boite[] {
  const vh = window.innerHeight;
  const paysage = !!document.querySelector('[data-frise] .cal-rangee-l');
  const visible = (t: DOMRect) => t.width > 0 && t.height > 0 && t.bottom > 0 && t.top < vh;
  return [
    ...[...document.querySelectorAll(NOMS_MESSAGE)].filter(t => !el.contains(t)).map(texteDe),
    ...(paysage ? [...document.querySelectorAll(OBJETS_PAYSAGE)].filter(t => !el.contains(t)).map(t => t.getBoundingClientRect()) : [])
  ].filter(visible);
}
const toucheUn = (boites: readonly Boite[], b: Boite) => boites.some(t => t.top < b.bottom + 2 && t.bottom > b.top - 2 && t.left < b.right + 2 && t.right > b.left - 2);

export const Message: React.FC<MessageProps> = ({ message, onFermer, dureeMs = DUREE_MESSAGE_MS }) => {
  const [detailOuvert, setDetailOuvert] = React.useState(false);
  /* n° 13 : l'en-tête collé sous lequel le message est posé ; `null` : il flotte à sa place */
  const [entete, setEntete] = React.useState<Element | null>(null);
  const idPose = React.useRef<number | undefined>(undefined);
  if (idPose.current !== message?.id) { idPose.current = message?.id; if (entete) setEntete(null); }
  const racine = React.useRef<HTMLDivElement>(null);
  const fermer = React.useRef(onFermer);
  fermer.current = onFermer;
  const id = message?.id;
  /* CRITIQUE-11 n° 8 : un geste qui ouvre son détail pose son message dans la zone de l'en-tête, d'emblée */
  const saZone = !!message?.ouvreSonDetail;
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
     remontant jusque sous l'en-tête, avec des décalages de côté ; faute de place, au pied de l'en-tête collé, en surimpression (CRITIQUE-11
     n° 2 b). Au grand écran et pour un geste qui ouvre son détail, directement au pied de l'en-tête (n° 3, n° 8). Recalculé à la rotation, au
     redimensionnement et après le rendu d'une écriture. */
  React.useLayoutEffect(() => {
    const el = racine.current;
    if (!el || id === undefined || entete) return undefined;
    const zoneEntete = () => document.querySelector('[data-entete-zone]');
    if (saZone || grandEcran()) {
      const zone = zoneEntete();
      if (zone) { el.dataset.place = 'sous-entete'; setEntete(zone); return undefined; }
    }
    const placer = () => {
      if (!el.isConnected) return;
      el.style.transform = ''; el.style.left = ''; delete el.dataset.place;
      let r: Boite = el.getBoundingClientRect();
      if (r.bottom - r.top === 0) return;
      /* CRITIQUE-9 n° 7 (E33, D-200) : en paysage, une rangée fait 20 px et la barre porte son nom et « J0 / 28 · prête … » : le message ne se
         pose sur aucune barre (as-gestes.js : `.bar` est un obstacle), il va entre la bande et les rangées, comme en portrait */
      const paysage = !!document.querySelector('[data-frise] .cal-rangee-l');
      const boites = nomsVisibles(el);
      const touche = (b: Boite) => toucheUn(boites, b);
      if (!touche(r)) { el.dataset.place = 'bas'; return; }
      /* à droite de la colonne des titres, s'il y a la place et qu'aucun nom n'y est ; jamais en paysage, où cette place est sur les barres */
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
      const haut = zoneEntete()?.getBoundingClientRect();
      const plafond = Math.max(8, haut && haut.height > 0 ? haut.bottom + 4 : 8);
      /* la place libre peut être à côté : chaque hauteur essaie aussi des décalages de côté, dans l'écran */
      const dxMin = Math.min(0, 8 - r.left), dxMax = Math.max(0, window.innerWidth - 8 - r.right);
      const decalages = [0];
      for (let d = 24; d <= Math.max(-dxMin, dxMax); d += 24) { if (d <= dxMax) decalages.push(d); if (-d >= dxMin) decalages.push(-d); }
      for (let dy = 0; r.top - dy >= plafond; dy += 4) {
        const dx = decalages.find(x => !touche(decaler(r, x, -dy)));
        if (dx !== undefined) { el.style.transform = `translate(${dx}px, -${dy}px)`; el.dataset.place = 'bande'; return; }
      }
      /* faute de place : au pied de l'en-tête collé, en surimpression (CRITIQUE-11 n° 2 b) ; l'en-tête ne grandit pas, les rangées restent */
      const zone = zoneEntete();
      if (zone) { el.dataset.place = 'sous-entete'; setEntete(zone); return; }
      el.dataset.place = 'sur-nom';
    };
    /* à la rotation, et après une écriture (la frise se remet en page après le message : Livrer, Annuler), on replace après son rendu */
    const minuteries: Array<ReturnType<typeof setTimeout>> = [];
    placer();
    minuteries.push(setTimeout(placer, 150), setTimeout(placer, 500));
    const surTaille = () => { placer(); minuteries.push(setTimeout(placer, 150)); };
    window.addEventListener('resize', surTaille);
    /* CRITIQUE-10, doute m38 (E33) : avant ses 24 px de départ, un défilement fait passer des noms sous le message ; il se replace à chaque
       défilement (une fois par image), jamais posé sur un nom qui arrive */
    let image: (() => void) | null = null;
    const surDefilement = () => { if (image === null) image = prochaineImage(() => { image = null; placer(); }); };
    window.addEventListener('scroll', surDefilement, { passive: true, capture: true });
    return () => {
      window.removeEventListener('resize', surTaille); window.removeEventListener('scroll', surDefilement, { capture: true });
      minuteries.forEach(clearTimeout); image?.();
    };
  }, [id, entete, saZone]);

  /* CRITIQUE-10, doute m38 (E33 : « jamais sur un nom ») : posé au pied de l'en-tête collé, si la page est défilée, un nom de la frise peut se
     trouver à moitié sous lui (« Tourne le téléphone » posé sur « Saison de ferme »). La page se décale du plus petit pas qui dégage ce nom (le
     montrer entier, ou le passer entier sous la bande), toujours moins de 24 px ; sans un tel pas, le message part. Ensuite, au défilement, un
     nom qui passe sous lui le fait partir aussitôt (avant ses 24 px). */
  React.useLayoutEffect(() => {
    const el = racine.current;
    /* seulement l'invite de l'en-tête (« Tourne le téléphone ») : « Liée à X · Annuler » (n° 8) et les autres bandeaux de geste ne partent pas ainsi */
    if (!el || id === undefined || !entete || message?.origine !== 'entete' || saZone) return undefined;
    const coupes = (): { monte: number; descend: number } | null => {
      if (!el.isConnected) return null;
      const r = el.getBoundingClientRect();
      if (r.height === 0) return null;
      const noms = [...document.querySelectorAll(NOMS_MESSAGE)].filter(t => !el.contains(t)).map(texteDe)
        .filter(t => t.width > 0 && t.height > 0 && t.left < r.right && t.right > r.left && t.top < r.bottom && t.bottom > r.bottom);
      if (!noms.length) return null;
      return { monte: Math.ceil(Math.max(...noms.map(t => r.bottom + 2 - t.top))), descend: Math.ceil(Math.max(...noms.map(t => t.bottom - r.bottom + 2))) };
    };
    const c = coupes();
    if (c) {
      const page = document.scrollingElement ?? document.documentElement;
      const reste = page ? page.scrollHeight - window.innerHeight - window.scrollY : 0;
      /* le défilement vers le haut ramène le nom entier sous le message ; vers le bas, il passe entier sous la bande */
      const pas = [window.scrollY >= c.monte ? -c.monte : null, reste >= c.descend ? c.descend : null]
        .filter((x): x is number => x !== null && Math.abs(x) < 24)
        .sort((a, b) => Math.abs(a) - Math.abs(b))[0];
      if (pas !== undefined && typeof window.scrollBy === 'function') window.scrollBy({ top: pas, left: 0, behavior: 'auto' });
      else fermer.current();
    }
    let image: (() => void) | null = null;
    const surDefilement = () => { if (image === null) image = prochaineImage(() => { image = null; if (coupes()) fermer.current(); }); };
    window.addEventListener('scroll', surDefilement, { passive: true, capture: true });
    return () => { window.removeEventListener('scroll', surDefilement, { capture: true }); image?.(); };
  }, [id, entete, saZone]);

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
      {...(message.ouvreSonDetail ? { 'data-ouvre-son-detail': '' } : {})}
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
  /* au pied de l'en-tête collé (n° 13, CRITIQUE-11 n° 2 b) : une bande de sa couleur, accrochée sous lui, en surimpression ; l'en-tête garde
     sa hauteur. La bande prend le doigt (rien de caché dessous ne se touche) ; la toucher hors des boutons chasse le message. */
  return entete && entete.isConnected ? createPortal(<div className="cal-msg-bande" data-msg-bande>{boite}</div>, entete) : boite;
};
