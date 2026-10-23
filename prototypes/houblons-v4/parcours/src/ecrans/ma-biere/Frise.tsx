// La frise verticale du brassin (base v4.10, index.html) : ébullition de sa durée à 0′, whirlpool, la levure,
// fermentation, post-fermentation ; chaque ajout posé à son moment, sa carte à droite, son repère (« 60′ ») sur la
// ligne. Le repère se glisse du doigt de haut en bas : il suit le doigt en continu, seule la valeur s'accroche au
// cran (D46) ; un cran = min(14 px, hauteur utile ÷ (n − 1)) de doigt (D69) ; crans du moteur (cransFrise), par 5′
// à l'ébullition, puis whirlpool et dry hop en jours, comme Dryhopper. Doigt posé, seules les graduations du segment
// sous le doigt apparaissent, sur la ligne, écartées comme sous une loupe (D47, D63) ; rien au repos. L'ébullition
// est à l'échelle du temps (D61) : 14 px par 5′, la place où le doigt lâche le repère. Au clavier : ↑ ↓.
// Contrat (controle-rail --parcours) : [data-role="frise"] aria-orientation="vertical" ; une poignée par ajout
// [data-role="glisser-moment"][role="slider"][aria-orientation="vertical"][data-houblon] ; [data-cran] au geste.
import { useLayoutEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useOuvrir } from '../../coquille/ouvrir';
import { useGestes } from '../../etat/EtatParcours';
import { quandDe } from '../../etat/operations';
import type { AjoutParcours, Quand, RecetteParcours } from '../../etat/types';
import { cransFrise, type BiereLue } from '../../moteur';
import { Carte } from './Carte';
import { nomLevureBase } from './Base';

const PX_CRAN = 14;

export const etiquette = (q: Quand) =>
  q.type === 'ebullition' ? `${q.minutes}′` : q.type === 'whirlpool' ? 'WP' : q.type === 'premierMout' ? '1er' : `${q.jours} j`;
/** Valeur lue (aria-valuetext) : « 60′ », « whirlpool », « actif · 3 j », « après · 3 j ». */
const valeur = (q: Quand) =>
  q.type === 'ebullition' ? `${q.minutes}′` : q.type === 'whirlpool' ? 'whirlpool' : q.type === 'premierMout' ? 'premier moût' : `${q.phase === 'actif' ? 'actif' : 'après'} · ${q.jours} j`;
const segment = (q: Quand) => (q.type === 'dryhop' ? q.phase : q.type === 'whirlpool' ? 'wp' : 'eb');
const meme = (a: Quand, b: Quand) =>
  a.type === b.type && (a.type !== 'ebullition' || a.minutes === (b as typeof a).minutes) && (a.type !== 'dryhop' || (a.phase === (b as typeof a).phase && a.jours === (b as typeof a).jours));

/** Graduations sous le doigt : un cran voisin à 48 px, puis 14 px par cran plus loin (loupe ×3 et plus, D63). */
const loupe = (d: number) => Math.sign(d) * (Math.abs(d) <= 1 ? 48 * Math.abs(d) : 48 + 14 * (Math.abs(d) - 1));

/** Le repère du moment : une piste verticale fixe pendant le geste (le « rail », role=slider), posée sur la ligne de la
 * frise de sorte que le repère, au repos, soit à côté de sa carte. Le repère suit le doigt ; la valeur s'accroche au
 * cran. Pas par cran : min(14 px, place à l'écran ÷ crans), pour que toute la piste tienne dans l'écran (D69). */
function Repere({ a, recette, onGeste, onGel }: { a: AjoutParcours; recette: RecetteParcours; onGeste: () => void; onGel: (actif: boolean) => void }) {
  const gestes = useGestes();
  const crans = cransFrise(recette);
  const n = crans.length;
  const q = quandDe(a, recette);
  // Un moment hors de la frise (ajout à 60′ dans une ébullition de 45′) se lit au cran le plus proche.
  const exact = crans.findIndex((x) => meme(x, q));
  const i = exact >= 0 ? exact : q.type === 'ebullition' ? crans.reduce((m, x, k) => (x.type === 'ebullition' && Math.abs(x.minutes - q.minutes) < Math.abs((crans[m] as { minutes: number }).minutes - q.minutes) ? k : m), 0) : 0;
  const ancre = useRef<HTMLSpanElement>(null);
  const piste = useRef<HTMLSpanElement>(null);
  const [pas, setPas] = useState(PX_CRAN);
  const [geste, setGeste] = useState<{ k0: number; y: number; k: number } | null>(null);
  // La géométrie se règle au repos (montage, défilement, taille), jamais pendant le geste.
  useLayoutEffect(() => {
    if (geste) return;
    const regler = () => {
      const r = ancre.current?.getBoundingClientRect();
      if (!r) return;
      const y = r.top + r.height / 2;
      const haut = i > 0 ? (y - 24) / i : Infinity, bas = n - 1 - i > 0 ? (window.innerHeight - 24 - y) / (n - 1 - i) : Infinity;
      setPas(Math.max(4, Math.min(PX_CRAN, haut, bas)));
    };
    regler();
    let rq = 0;
    const plus = () => { cancelAnimationFrame(rq); rq = requestAnimationFrame(regler); };
    window.addEventListener('scroll', plus, true); window.addEventListener('resize', plus);
    return () => { cancelAnimationFrame(rq); window.removeEventListener('scroll', plus, true); window.removeEventListener('resize', plus); };
  }, [i, n, geste]);
  const k0 = geste ? geste.k0 : i;
  const hauteur = (n - 1) * pas + 28;
  const haut = -(k0 * pas + 14);
  const indexA = (y: number) => {
    const b = piste.current!.getBoundingClientRect();
    return Math.max(0, Math.min(n - 1, Math.round((y - b.top - 14) / pas)));
  };
  const viser = (k: number) => { if (!meme(crans[k], quandDe(a, recette))) { onGeste(); gestes.moment('recette', a.id, crans[k]); } };
  const fin = () => { setGeste(null); onGel(false); };
  const kVu = geste ? geste.k : i;
  const pouceY = geste ? Math.max(14, Math.min(hauteur - 14, geste.y)) : k0 * pas + 14;
  const seg = segment(crans[kVu]);
  const voisins = geste ? crans.map((_, k) => k).filter((k) => segment(crans[k]) === seg && Math.abs(k - kVu) <= 6) : [];
  return (
    <span ref={ancre} className="relative block w-[3.25rem] h-9">
      <span ref={piste} data-role="glisser-moment" data-houblon={a.hopKey} data-ajout-repere={a.id} role="slider" tabIndex={0} aria-orientation="vertical"
        aria-label={`Moment de l'ajout ${a.id}`} aria-valuemin={0} aria-valuemax={n - 1} aria-valuenow={i} aria-valuetext={valeur(crans[i] ?? q)}
        {...(geste ? { 'data-glisse': '' } : {})}
        className="pq-ma-biere-piste absolute left-0 w-full"
        style={{ top: `calc(50% + ${haut}px)`, height: hauteur }}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (e.button > 0) return;
          try { piste.current!.setPointerCapture(e.pointerId); } catch { /* pointeur synthétique */ }
          const b = piste.current!.getBoundingClientRect();
          const k = indexA(e.clientY);
          onGel(true);
          setGeste({ k0: i, y: e.clientY - b.top, k });
          viser(k);
        }}
        onPointerMove={(e) => {
          if (!geste) return;
          const b = piste.current!.getBoundingClientRect();
          const k = indexA(e.clientY);
          setGeste({ ...geste, y: e.clientY - b.top, k });
          if (k !== geste.k) viser(k);
        }}
        onPointerUp={fin}
        onPointerCancel={fin}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          const k = Math.max(0, Math.min(n - 1, i + d));
          if (k !== i) { onGeste(); gestes.moment('recette', a.id, crans[k]); }
        }}>
        <span data-role="moment-pouce"
          className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[3.25rem] h-9 px-2 rounded-full border-2 font-mono text-sm font-semibold whitespace-nowrap ${geste ? 'pq-ma-biere-pouce-actif' : 'pq-ma-biere-pouce'}`}
          style={{ top: pouceY }}>
          {etiquette(crans[kVu] ?? q)}
        </span>
        {voisins.map((k) => (
          <span key={k} aria-hidden="true" data-cran={k}
            className={`pq-ma-biere-graduation ${k === kVu ? 'w-2 h-3 -z-10' : ''} absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-1 rounded font-mono text-[10px] leading-[12px] text-cave-400 whitespace-nowrap`}
            style={{ top: pouceY + loupe(k - kVu) }}>{k === kVu ? null : etiquette(crans[k])}</span>
        ))}
      </span>
    </span>
  );
}


function Noeud({ nom, plein = false, petit = false }: { nom: React.ReactNode; plein?: boolean; petit?: boolean }) {
  return (
    <div className="pq-ma-biere-ligne-frise flex items-center gap-3 min-h-[2rem]">
      <span className="w-[3.25rem] flex justify-center shrink-0">
        <i aria-hidden="true" className={`block rounded-full border-2 border-cave-50 ${plein ? 'w-5 h-5 bg-cave-50' : petit ? 'w-3 h-3 border-cave-400 bg-cave-950' : 'w-5 h-5 bg-cave-950'}`} />
      </span>
      <span className={`flex-1 min-w-0 ${petit ? 'text-sm text-cave-400' : 'text-base text-cave-200'}`}>{nom}</span>
    </div>
  );
}

export function Frise({ recette, biere, reperes, onGeste }: {
  recette: RecetteParcours; biere: BiereLue; reperes: Record<string, string>; onGeste: () => void;
}) {
  const ouvrir = useOuvrir();
  // Pendant un geste, la frise garde la place d'avant (la piste ne bouge pas, D68) ; les valeurs restent en direct.
  const [gel, setGel] = useState<RecetteParcours | null>(null);
  const place = gel ?? recette;
  const avecQuand = recette.additions.map((a) => ({ a, q: quandDe(place.additions.find((x) => x.id === a.id) ?? a, place) }));
  const minutesDe = (q: Quand) => (q.type === 'ebullition' ? q.minutes : recette.boilMin);
  const bouillis = avecQuand.filter((x) => x.q.type === 'ebullition' || x.q.type === 'premierMout').sort((x, y) => minutesDe(y.q) - minutesDe(x.q));
  const wp = avecQuand.filter((x) => x.q.type === 'whirlpool');
  const actif = avecQuand.filter((x) => x.q.type === 'dryhop' && x.q.phase === 'actif');
  const apres = avecQuand.filter((x) => x.q.type === 'dryhop' && x.q.phase === 'apres');
  const pxMinute = PX_CRAN / 5;
  // Une seule liste à clés stables : un ajout qui change de segment est déplacé, pas remonté (le geste continue).
  // La carte vient d'abord dans le document (le nom avant la poignée), la poignée s'affiche à gauche.
  const ligne = ({ a }: { a: AjoutParcours }) => (
    <div key={a.id} className="pq-ma-biere-ligne-frise flex items-start gap-3">
      <div className="flex-1 min-w-0 order-2"><Carte a={a} recette={recette} biere={biere} repere={reperes[a.id] ?? null} onGeste={onGeste} /></div>
      <span className="w-[3.25rem] flex justify-center shrink-0 pt-1.5 order-1"><Repere a={a} recette={recette} onGeste={onGeste} onGel={(v) => setGel(v ? recette : null)} /></span>
    </div>
  );
  const ecart = (cle: string, h: number) => (h >= 2 ? <div key={cle} aria-hidden="true" style={{ height: h }} className="pq-ma-biere-ligne-frise" /> : null);
  const lignes: React.ReactNode[] = [<Noeud key="n-eb" nom={<>Ébullition <b className="font-mono text-cave-50">{recette.boilMin}′</b></>} />];
  let minutes = recette.boilMin;
  for (const x of bouillis) {
    const m = minutesDe(x.q);
    lignes.push(ecart('e-' + x.a.id, (minutes - m) * pxMinute), ligne(x));
    minutes = m;
  }
  lignes.push(ecart('e-fin', minutes * pxMinute), <Noeud key="n-0" petit nom="0′" />, <Noeud key="n-wp" nom="whirlpool" petit={!wp.length} />, ...wp.map(ligne));
  const levureChangee = reperes.__levure;
  const ajoutLevure = (actif.at(-1) ?? apres.at(-1) ?? avecQuand[0])?.a.id ?? null;
  lignes.push(
    <div key="n-levure" className="pq-ma-biere-ligne-frise flex items-center gap-3">
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
    </div>,
    <Noeud key="n-ferm" nom="fermentation" petit={!actif.length} />, ...actif.map(ligne),
    <Noeud key="n-post" nom="post-fermentation" petit={!apres.length} />, ...apres.map(ligne),
  );
  return (
    <div data-role="frise" data-acquis="frise" aria-orientation="vertical" data-element="etape-frise" className="pq-ma-biere-frise relative space-y-1">
      {lignes}
    </div>
  );
}
