// La frise verticale du brassin (base v4.10, index.html) : ébullition de sa durée à 0′, whirlpool, la levure,
// fermentation, post-fermentation ; chaque ajout posé à son moment, sa carte à droite. Le repère du moment
// (« 60′ ») se glisse du doigt de haut en bas, par 5′ à l'ébullition puis whirlpool et dry hop en jours (crans du
// moteur, cransFrise, comme Dryhopper) : 14 px de doigt par cran au moins (D46) ; une loupe montre les crans
// voisins, le cran visé en grand (D47). L'ébullition est à l'échelle du temps (D61) : l'écart entre deux ajouts
// suit leurs minutes. Au clavier : ↑ ↓ sur le repère.
import { useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useOuvrir } from '../../coquille/ouvrir';
import { useGestes } from '../../etat/EtatParcours';
import { quandDe } from '../../etat/operations';
import type { AjoutParcours, Quand, RecetteParcours } from '../../etat/types';
import { cransFrise, type BiereLue } from '../../moteur';
import { Carte } from './Carte';
import { nomLevureBase } from './Base';

const PX_CRAN = 14;
const PX_MINUTE = 0.6;

export const etiquette = (q: Quand) =>
  q.type === 'ebullition' ? `${q.minutes}′` : q.type === 'whirlpool' ? 'WP' : q.type === 'premierMout' ? '1er' : `${q.jours} j`;
const longue = (q: Quand) =>
  q.type === 'ebullition' ? `ébullition ${q.minutes}′` : q.type === 'whirlpool' ? 'whirlpool' : q.type === 'premierMout' ? 'premier moût' : `dry hop ${q.phase === 'actif' ? 'en fermentation' : 'après fermentation'}, ${q.jours} j`;
const meme = (a: Quand, b: Quand) =>
  a.type === b.type && (a.type !== 'ebullition' || a.minutes === (b as typeof a).minutes) && (a.type !== 'dryhop' || (a.phase === (b as typeof a).phase && a.jours === (b as typeof a).jours));

/** Le repère du moment, sur la ligne de la frise : glissé de haut en bas. */
function Repere({ a, recette, onGeste }: { a: AjoutParcours; recette: RecetteParcours; onGeste: () => void }) {
  const gestes = useGestes();
  const crans = cransFrise(recette);
  const q = quandDe(a, recette);
  const i = crans.findIndex((x) => meme(x, q));
  const depart = useRef<{ y: number; k: number } | null>(null);
  const [doigt, setDoigt] = useState<number | null>(null);
  const viser = (k: number) => { setDoigt(k); if (k !== i) { onGeste(); gestes.moment('recette', a.id, crans[k]); } };
  const visible = doigt ?? i;
  return (
    <span className="relative inline-flex">
      <button type="button" data-role="glisser-moment" data-ajout-repere={a.id} role="slider" aria-label={`Moment de l'ajout ${a.id}`}
        aria-valuemin={0} aria-valuemax={crans.length - 1} aria-valuenow={Math.max(0, i)} aria-valuetext={longue(q)}
        className={`pq-ma-biere-repere-moment inline-flex items-center justify-center min-w-[3.25rem] h-9 px-2 rounded-full border-2 font-mono text-sm font-semibold ${doigt != null ? 'pq-ma-biere-pouce-actif' : 'pq-ma-biere-pouce'}`}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (e.button > 0) return;
          try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* pointeur synthétique */ }
          depart.current = { y: e.clientY, k: Math.max(0, i) };
          setDoigt(Math.max(0, i));
        }}
        onPointerMove={(e) => {
          const d = depart.current;
          if (!d) return;
          const k = Math.max(0, Math.min(crans.length - 1, d.k + Math.round((e.clientY - d.y) / PX_CRAN)));
          if (k !== doigt) viser(k);
        }}
        onPointerUp={() => { depart.current = null; setDoigt(null); }}
        onPointerCancel={() => { depart.current = null; setDoigt(null); }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          const k = Math.max(0, Math.min(crans.length - 1, Math.max(0, i) + d));
          if (k !== i) { onGeste(); gestes.moment('recette', a.id, crans[k]); }
        }}>
        <span data-role="moment-pouce">{etiquette(crans[visible] ?? q)}</span>
      </button>
      {doigt != null && (
        <span aria-hidden="true" data-role="loupe" className="pq-ma-biere-loupe absolute left-full ml-2 top-1/2 -translate-y-1/2 flex flex-col items-start px-2 py-1 rounded-lg">
          {[-2, -1, 0, 1, 2].map((d) => doigt + d).filter((k) => k >= 0 && k < crans.length).map((k) => (
            <span key={k} data-cran={k} className={`font-mono whitespace-nowrap leading-tight ${k === doigt ? 'text-lg font-semibold text-cave-50' : 'text-xs text-cave-400'}`}>
              {longue(crans[k])}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

function Noeud({ nom, plein = false, petit = false, droite }: { nom: React.ReactNode; plein?: boolean; petit?: boolean; droite?: React.ReactNode }) {
  return (
    <div className="pq-ma-biere-ligne-frise flex items-center gap-3 min-h-[2rem]">
      <span className="w-[3.25rem] flex justify-center shrink-0">
        <i aria-hidden="true" className={`block rounded-full border-2 border-cave-50 ${plein ? 'w-5 h-5 bg-cave-50' : petit ? 'w-3 h-3 border-cave-400 bg-cave-950' : 'w-5 h-5 bg-cave-950'}`} />
      </span>
      <span className={`flex-1 min-w-0 ${petit ? 'text-sm text-cave-400' : 'text-base text-cave-200'}`}>{nom}</span>
      {droite}
    </div>
  );
}

function Ecart({ hauteur }: { hauteur: number }) {
  if (hauteur < 2) return null;
  return <div aria-hidden="true" style={{ height: hauteur }} className="pq-ma-biere-ligne-frise" />;
}

export function Frise({ recette, biere, reperes, onGeste }: {
  recette: RecetteParcours; biere: BiereLue; reperes: Record<string, string>; onGeste: () => void;
}) {
  const ouvrir = useOuvrir();
  const avecQuand = recette.additions.map((a) => ({ a, q: quandDe(a, recette) }));
  const minutesDe = (q: Quand) => (q.type === 'ebullition' ? q.minutes : 999);
  const bouillis = avecQuand.filter((x) => x.q.type === 'ebullition' || x.q.type === 'premierMout').sort((x, y) => minutesDe(y.q) - minutesDe(x.q));
  const wp = avecQuand.filter((x) => x.q.type === 'whirlpool');
  const actif = avecQuand.filter((x) => x.q.type === 'dryhop' && x.q.phase === 'actif');
  const apres = avecQuand.filter((x) => x.q.type === 'dryhop' && x.q.phase === 'apres');
  const ligne = ({ a }: { a: AjoutParcours }) => (
    <div key={a.id} className="pq-ma-biere-ligne-frise flex items-start gap-3">
      <span className="w-[3.25rem] flex justify-center shrink-0 pt-2"><Repere a={a} recette={recette} onGeste={onGeste} /></span>
      <div className="flex-1 min-w-0"><Carte a={a} recette={recette} biere={biere} repere={reperes[a.id] ?? null} onGeste={onGeste} /></div>
    </div>
  );
  let minutes = recette.boilMin;
  const ebullition = bouillis.map((x) => {
    const m = x.q.type === 'ebullition' ? x.q.minutes : recette.boilMin;
    const h = (minutes - m) * PX_MINUTE;
    minutes = m;
    return [<Ecart key={x.a.id + '-e'} hauteur={h} />, ligne(x)];
  });
  const levureChangee = reperes.__levure;
  const ajoutLevure = (actif.at(-1) ?? apres.at(-1) ?? avecQuand[0])?.a.id ?? null;
  return (
    <div data-role="frise-brassin" data-element="etape-frise" className="pq-ma-biere-frise relative space-y-1">
      <Noeud nom={<>Ébullition <b className="font-mono text-cave-50">{recette.boilMin}′</b></>} />
      {ebullition}
      <Ecart hauteur={minutes * PX_MINUTE} />
      <Noeud petit nom="0′" />
      <Noeud nom="whirlpool" petit={!wp.length} />
      {wp.map(ligne)}
      <div className="pq-ma-biere-ligne-frise flex items-center gap-3">
        <span className="w-[3.25rem] flex justify-center shrink-0"><i aria-hidden="true" className="block w-6 h-6 rounded-full bg-cave-50" /></span>
        <button type="button" data-role="pont-etape-levure" data-element="etape-levure" disabled={!ajoutLevure}
          onClick={() => ajoutLevure && ouvrir({ ecran: 'levure', ajout: ajoutLevure })}
          className={`flex-1 min-w-0 flex items-center gap-2 min-h-[2.75rem] px-3 rounded-lg border bg-cave-900 text-left ${levureChangee ? 'pq-ma-biere-change border-cave-600' : 'border-cave-700'}`}>
          <i aria-hidden="true" className="block w-4 h-4 rounded-full border-2 border-cave-400 relative after:absolute after:inset-1 after:rounded-full after:bg-cave-400" />
          <span className="text-base text-cave-50 truncate">{nomLevureBase(recette.yeastId)}</span>
          <span className="text-sm text-cave-400">caractérisée</span>
          {levureChangee && <span data-role="vient-de-changer" className="pq-ma-biere-repere text-xs truncate">{levureChangee}</span>}
          <ChevronRight className="ml-auto w-4 h-4 text-cave-400 shrink-0" aria-hidden="true" />
        </button>
      </div>
      <Noeud nom="fermentation" petit={!actif.length} />
      {actif.map(ligne)}
      <Noeud nom="post-fermentation" petit={!apres.length} />
      {apres.map(ligne)}
    </div>
  );
}
