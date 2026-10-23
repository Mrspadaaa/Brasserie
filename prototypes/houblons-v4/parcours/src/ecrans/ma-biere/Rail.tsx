// Rail du moment d'un ajout, sur sa ligne (le geste de la base : « glisser comme un slider le moment de
// l'ajout », D27) : l'ébullition par 5′ de sa durée à 0′ (D34, D36), le whirlpool, puis le dry hop actif et
// après, en jours de contact. Les crans sont ceux du moteur (cransFrise), comme la frise de Dryhopper.
// Au repos : la piste et le moment seul (pas d'échelle, D47). Doigt posé : une loupe au-dessus du doigt montre
// les crans voisins, le cran visé en grand (« un truc type UX apple qui zoom focus », D47, D63).
// Au doigt et à la souris (pointer events, capture) ; au clavier : ← →. Le défilement vertical reste libre.
import { useRef, useState } from 'react';
import type { Quand, RecetteParcours } from '../../etat/types';
import { cransFrise } from '../../moteur';

const PAD = 14;
/** Doigt posé, un cran demande au moins 14 px de déplacement, même si la piste est plus serrée : la précision
 * d'un curseur fin (« pas clanky », D46), que la loupe rend lisible. */
const PX_CRAN = 14;

export const etiquetteCourte = (q: Quand) =>
  q.type === 'ebullition' ? `${q.minutes}′` : q.type === 'whirlpool' ? 'WP' : q.type === 'premierMout' ? '1er moût' : `${q.phase === 'actif' ? 'actif' : 'après'} ${q.jours} j`;
const etiquetteLongue = (q: Quand) =>
  q.type === 'ebullition' ? `ébullition ${q.minutes}′` : q.type === 'whirlpool' ? 'whirlpool' : q.type === 'premierMout' ? 'premier moût' : `dry hop ${q.phase === 'actif' ? 'actif' : 'après fermentation'}, ${q.jours} j`;

const meme = (a: Quand, b: Quand) =>
  a.type === b.type && (a.type !== 'ebullition' || a.minutes === (b as typeof a).minutes) && (a.type !== 'dryhop' || (a.phase === (b as typeof a).phase && a.jours === (b as typeof a).jours));

export function Rail({ recette, quand, onMoment, nom }: { recette: RecetteParcours; quand: Quand; onMoment: (q: Quand) => void; nom: string }) {
  const crans = cransFrise(recette);
  const n = crans.length;
  const i = crans.findIndex((q) => meme(q, quand));
  const [doigt, setDoigt] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const actif = useRef<{ x: number; k: number } | null>(null);
  const frac = (k: number) => (n > 1 ? k / (n - 1) : 0);
  const left = (k: number) => `calc(${PAD}px + (100% - ${2 * PAD}px) * ${frac(k).toFixed(4)})`;
  const indexA = (x: number) => {
    const b = ref.current!.getBoundingClientRect();
    const f = (x - b.left - PAD) / Math.max(1, b.width - 2 * PAD);
    return Math.max(0, Math.min(n - 1, Math.round(f * (n - 1))));
  };
  const viser = (k: number) => { setDoigt(k); if (k !== i) onMoment(crans[k]); };
  // Segments : ébullition, whirlpool, dry hop actif, après.
  const nbEb = crans.filter((q) => q.type === 'ebullition').length;
  const nbAc = crans.filter((q) => q.type === 'dryhop' && q.phase === 'actif').length;
  const seg = [
    { de: 0, a: nbEb - 1, cls: 'pq-ma-biere-seg-eb' },
    { de: nbEb - 1, a: nbEb + 0.5, cls: 'pq-ma-biere-seg-wp' },
    { de: nbEb + 0.5, a: nbEb + nbAc, cls: 'pq-ma-biere-seg-ac' },
    { de: nbEb + nbAc, a: n - 1, cls: 'pq-ma-biere-seg-ap' },
  ];
  const visible = doigt ?? i;
  const voisins = doigt == null ? [] : [-2, -1, 0, 1, 2].map((d) => doigt + d).filter((k) => k >= 0 && k < n);
  return (
    <div ref={ref} data-role="glisser-moment" role="slider" tabIndex={0}
      aria-label={`Moment de ${nom}`} aria-valuemin={0} aria-valuemax={n - 1} aria-valuenow={Math.max(0, i)}
      aria-valuetext={etiquetteLongue(quand)}
      className="pq-ma-biere-rail relative h-8 select-none cursor-grab active:cursor-grabbing"
      onPointerDown={(e) => {
        e.stopPropagation();
        if (e.button > 0) return;
        ref.current!.setPointerCapture(e.pointerId);
        const k = indexA(e.clientX);
        actif.current = { x: e.clientX, k };
        viser(k);
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        const a = actif.current;
        if (!a) return;
        const larg = ref.current!.getBoundingClientRect().width - 2 * PAD;
        const pas = Math.max(PX_CRAN, larg / Math.max(1, n - 1));
        const k = Math.max(0, Math.min(n - 1, a.k + Math.round((e.clientX - a.x) / pas)));
        if (k !== doigt) viser(k);
      }}
      onPointerUp={(e) => { e.stopPropagation(); actif.current = null; setDoigt(null); }}
      onPointerCancel={() => { actif.current = null; setDoigt(null); }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        const k = Math.max(0, Math.min(n - 1, (i < 0 ? 0 : i) + d));
        if (k !== i) onMoment(crans[k]);
      }}>
      <span aria-hidden="true" className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5">
        {seg.map((s) => (
          <i key={s.cls} className={`absolute inset-y-0 rounded-full ${s.cls}`} style={{ left: left(s.de), width: `calc((100% - ${2 * PAD}px) * ${(frac(s.a) - frac(s.de)).toFixed(4)})` }} />
        ))}
      </span>
      {visible >= 0 && (
        <span aria-hidden="true" data-role="moment-pouce"
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 inline-flex items-center h-6 px-2 rounded-full border-2 font-mono text-xs font-semibold whitespace-nowrap pq-ma-biere-pouce ${doigt != null ? 'pq-ma-biere-pouce-actif' : ''}`}
          style={{ left: left(visible) }}>
          {etiquetteCourte(crans[visible])}
        </span>
      )}
      {doigt != null && (
        <span aria-hidden="true" data-role="loupe" className="pq-ma-biere-loupe absolute bottom-full mb-1 -translate-x-1/2 inline-flex items-end gap-1.5 px-2 py-1 rounded-lg"
          style={{ left: `clamp(70px, ${left(doigt)}, calc(100% - 70px))` }}>
          {voisins.map((k) => (
            <span key={k} data-cran={k} className={`font-mono whitespace-nowrap ${k === doigt ? 'text-base font-semibold text-cave-50' : 'text-2xs text-cave-400'}`}>
              {etiquetteCourte(crans[k])}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
