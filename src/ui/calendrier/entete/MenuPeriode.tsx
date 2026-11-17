import React, { useEffect, useRef } from 'react';

/**
 * Le menu de la période (E07, E40, E46) : un bouton (« 6 sem. ») l'ouvre. On y règle la période (6 sem., 3 mois, 6 mois, An), on passe à la vue
 * Liste, on ouvre la poche « Sans date », on trie les rangées et on filtre par type. Rien de tout cela n'est au premier plan (D-133, pas de
 * cockpit) : un menu, à un toucher.
 *
 * « Sans date · n » n'apparaît que si n > 0 : jamais « Sans date · 0 » (D-67). « Trier les rangées » et « Filtrer par type » appellent leurs
 * rappels : le geste lui-même vit dans la frise (E39). Le jouable n'a, pour le tri, qu'un bouton `data-k15-tri="genre"` sans rien derrière.
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
}

export function MenuPeriode({ plage, semaines, annee, liste, sansDate, onChoisir, onListe, onCalendrier, onSansDate, onTrier, onFiltrer, onFermer }: MenuPeriodeProps) {
  const ref = useRef<HTMLDivElement>(null);
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

  return (
    <div ref={ref} className="ent-menu" role="dialog" aria-label="Période et vue">
      <p className="ent-menu-plage">{plage}</p>
      <div className="ent-seg" role="group" aria-label="Période">
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
}
