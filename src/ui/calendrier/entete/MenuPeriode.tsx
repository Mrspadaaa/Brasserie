import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ECHELLES, type Echelle } from '../echelle';

/**
 * Le menu de la période (E07, E40, E46) : un bouton (« 6 sem. ») l'ouvre. On y règle la période (6 sem., 3 mois, 6 mois, An), on passe à la vue
 * Liste, on ouvre la poche « Sans date », on trie les rangées et on filtre par type. Rien de tout cela n'est au premier plan (D-133, pas de
 * cockpit) : un menu, à un toucher.
 *
 * « Sans date · n » n'apparaît que si n > 0 : jamais « Sans date · 0 » (D-67). « Trier les rangées » et « Filtrer par type » appellent leurs
 * rappels : le geste lui-même vit dans la frise (E39). Le jouable n'a, pour le tri, qu'un bouton `data-k15-tri="genre"` sans rien derrière.
 *
 * Borné à l'écran (CRITIQUE-2 n° 14) : le menu est posé dans `document.body` (l'en-tête collé a son propre empilement, sous le + volant), en
 * position fixe, au-dessus du + volant (z-index 60 > 51 de FloatingActions) et de la barre d'onglets ; trop haut pour l'écran, il remonte, puis
 * défile. En paysage, « Filtrer par type » reste visible et touchable.
 */

export const DUREES = [
  { semaines: 6, nom: '6 sem.' },
  { semaines: 13, nom: '3 mois' },
  { semaines: 26, nom: '6 mois' },
  { semaines: 52, nom: 'An' }
] as const;

export interface MenuPeriodeProps {
  /** « 16 nov. → 27 déc. » : la plage réglée, dite comme dans Finances. */
  plage: string;
  semaines: number;
  annee: boolean;
  /** Vue Liste affichée : la ligne « Liste » devient « Calendrier » (retour). */
  liste: boolean;
  sansDate: number;
  onChoisir: (semaines: number) => void;
  onListe: () => void;
  onCalendrier: () => void;
  onSansDate: () => void;
  onTrier?: () => void;
  onFiltrer?: () => void;
  onFermer: () => void;
  /** Le bouton de la période : le menu se pose sous lui. */
  ancre?: HTMLElement | null;
  paysage?: boolean;
  /** D385 (variante D) : la ligne « Échelle » (Jour · Semaine · Mois) au-dessus des durées, et « 2 sem. » qui ouvre la vue Jour. */
  echelle?: Echelle;
  onEchelle?: (echelle: Echelle) => void;
}

const MARGE = 8;

/** Le haut de la barre d'onglets (un `nav` fixe collé en bas), sinon le bas de l'écran. */
export function hautDesOnglets(): number {
  const h = window.innerHeight;
  let haut = h;
  for (const n of Array.from(document.querySelectorAll('nav'))) {
    const r = n.getBoundingClientRect();
    if (r.height > 0 && r.bottom >= h - 2 && r.top > h / 2 && getComputedStyle(n).position === 'fixed') haut = Math.min(haut, r.top);
  }
  return haut;
}

type Place = { top: number; left?: number; right?: number; maxHeight: number };

export function MenuPeriode({ plage, semaines, annee, liste, sansDate, onChoisir, onListe, onCalendrier, onSansDate, onTrier, onFiltrer, onFermer, ancre, paysage = false, echelle, onEchelle }: MenuPeriodeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<Place | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !ancre) return undefined;
    const poser = () => {
      const a = ancre.getBoundingClientRect();
      const bas = hautDesOnglets() - MARGE;
      const hauteur = el.scrollHeight;
      const largeur = el.getBoundingClientRect().width || 260;
      // Sous le bouton ; s'il déborde, il remonte jusqu'à tenir (jamais plus haut que le bord), puis défile.
      const top = Math.max(MARGE, Math.min(a.bottom + 6, bas - hauteur));
      const p: Place = { top, maxHeight: Math.max(120, bas - top) };
      if (paysage) p.left = Math.max(MARGE, Math.min(a.left, window.innerWidth - largeur - MARGE));
      else p.right = Math.max(MARGE, window.innerWidth - a.right);
      setPlace(p);
    };
    poser();
    window.addEventListener('resize', poser);
    return () => window.removeEventListener('resize', poser);
  }, [ancre, paysage, sansDate, liste]);

  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')?.focus({ preventScroll: true });
    const dehors = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t && (ref.current?.contains(t) || t.closest?.('[data-ent-periode]'))) return;
      onFermer();
    };
    const touche = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer(); };
    document.addEventListener('pointerdown', dehors, true);
    document.addEventListener('keydown', touche);
    return () => { document.removeEventListener('pointerdown', dehors, true); document.removeEventListener('keydown', touche); };
  }, [onFermer]);

  const actif = (n: number) => (n === 52 ? annee || semaines >= 52 : !annee && semaines === n);
  const ligne = (texte: string, fn?: () => void, extra?: Record<string, string>) => (
    <button type="button" className="ent-menu-l" onClick={() => { fn?.(); onFermer(); }} {...extra}>{texte}</button>
  );

  const style: React.CSSProperties | undefined = place
    ? { top: place.top, left: place.left, right: place.right, maxHeight: place.maxHeight }
    : undefined;
  const menu = (
    <div ref={ref} className={`ent-port ent-menu${ancre ? ' ent-menu--fixe' : ''}${paysage ? ' ent-menu--paysage' : ''}`} role="dialog" aria-label="Période et vue" data-menu-periode style={style}>
      <p className="ent-menu-plage">{plage}</p>
      {onEchelle && (
        <div className="ent-ech" data-menu-echelle>
          <p className="ent-ech-t" id="ent-ech-t">Échelle</p>
          <div className="ent-ech-seg" role="group" aria-labelledby="ent-ech-t">
            {ECHELLES.map(e => (
              <button key={e.id} type="button" data-echelle={e.id} aria-pressed={!annee && echelle === e.id} onClick={() => { onEchelle(e.id); onFermer(); }}>{e.nom}</button>
            ))}
          </div>
        </div>
      )}
      <div className={`ent-seg${onEchelle ? ' ent-seg--5' : ''}`} role="group" aria-label="Période">
        {onEchelle && <button type="button" aria-pressed={!annee && semaines === 2} onClick={() => { onEchelle('jour'); onFermer(); }}>2 sem.</button>}
        {DUREES.map(d => (
          <button key={d.semaines} type="button" aria-pressed={actif(d.semaines)} onClick={() => { onChoisir(d.semaines); onFermer(); }}>{d.nom}</button>
        ))}
      </div>
      {liste ? ligne('Calendrier', onCalendrier) : ligne('Liste', onListe)}
      {sansDate > 0 && ligne(`Sans date · ${sansDate}`, onSansDate)}
      {ligne('Trier les rangées', onTrier, { 'data-k15-tri': 'genre' })}
      {ligne('Filtrer par type', onFiltrer)}
    </div>
  );
  return ancre && typeof document !== 'undefined' ? createPortal(menu, document.body) : menu;
}
