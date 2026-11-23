/*
 * Pièces communes du compagnon (maquette p2a) : Icone, N, M, AV, Dur, Feu, Piste, Tag, useSecondes.
 * Props : voir chaque fonction. Présentatif ; aucun appel serveur. Les nombres et durées sont en mono (`cmp-n`),
 * un nombre et son unité ne se séparent jamais (espace insécable).
 */
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ICONES } from './icones';
import type { NomIcone } from './icones';
import type { Feu as FeuDuNiveau } from './derive';

/** `nom` : une clé de `ICONES`. Décorative : `aria-hidden`. */
export function Icone({ nom, className = '' }: { nom: NomIcone; className?: string }) {
  const Composant = ICONES[nom];
  return <Composant className={`cmp-i${className ? ' ' + className : ''}`} aria-hidden="true" />;
}

/** Un nombre en police mono. */
export const N = ({ children }: { children: ReactNode }) => <span className="cmp-n">{children}</span>;

/** Un nombre et son unité, insécables : `<M n="19" u="°C" />`. */
export const M = ({ n, u }: { n: ReactNode; u?: string }) => (
  <span className="cmp-m">
    <N>{n}</N>
    {u ? <>&nbsp;{u}</> : null}
  </span>
);

/** Avant barré → après : `<AV avant="3" apres="2" u="j" />`. */
export const AV = ({ avant, apres, u }: { avant: ReactNode; apres: ReactNode; u?: string }) => (
  <span className="cmp-m">
    <s className="cmp-n">{avant}</s>&nbsp;→&nbsp;<N>{apres}</N>
    {u ? <>&nbsp;{u}</> : null}
  </span>
);

/** Trois pastilles de durée/coût relatifs, `n` de 1 à 3 allumées. Décoratif. */
export function Dur({ n }: { n: 1 | 2 | 3 }) {
  return (
    <i className="cmp-dur" aria-hidden="true">
      {[1, 2, 3].map((k) => (
        <u key={k} className={k <= n ? 'cmp-v' : ''} />
      ))}
    </i>
  );
}

/** Pastille de mode d'une tuile : durée relative + libellé. Décorative (le nom de la tuile reste sa question). */
export function Tag({ label, pips }: { label: string; pips: 1 | 2 | 3 }) {
  return (
    <span className="cmp-tag" aria-hidden="true">
      <Dur n={pips} />
      {label}
    </span>
  );
}

/** Feu de niveau : trois lampes, une seule allumée (rouge en haut, ambre au milieu, vert en bas). `feu` vient de `feuDuNiveau`. */
export function Feu({ feu }: { feu: FeuDuNiveau }) {
  const lampe = (position: FeuDuNiveau['allume'], classe: string) => (
    <i className={feu.allume === position ? classe : ''} />
  );
  return (
    <span className="cmp-feu" role="img" aria-label={`Niveau : ${feu.libelle}`}>
      {lampe('haut', 'cmp-on-r')}
      {lampe('milieu', 'cmp-on-a')}
      {lampe('bas', 'cmp-on-v')}
    </span>
  );
}

/** Piste de progression, `pct` de 0 à 100 (bornée). Un pourcentage inconnu ne se dessine pas : l'appelant n'affiche rien. */
export function Piste({ pct, large = false, neutre = false }: { pct: number; large?: boolean; neutre?: boolean }) {
  const p = Math.min(100, Math.max(0, pct));
  return (
    <span className={`cmp-piste${large ? ' cmp-piste-l' : ''}${neutre ? ' cmp-piste-n' : ''}`}>
      <i style={{ width: `${p}%` }} />
    </span>
  );
}

/** Secondes écoulées depuis `debut` (ms), rafraîchies chaque seconde ; arrêtées à `fin` si elle est donnée. */
export function useSecondes(debut: number | undefined, fin?: number): number {
  const lire = () => (debut ? Math.max(0, Math.floor(((fin ?? Date.now()) - debut) / 1000)) : 0);
  const [s, setS] = useState(lire);
  useEffect(() => {
    setS(lire());
    if (fin || !debut) return;
    const id = window.setInterval(() => setS(lire()), 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debut, fin]);
  return s;
}
