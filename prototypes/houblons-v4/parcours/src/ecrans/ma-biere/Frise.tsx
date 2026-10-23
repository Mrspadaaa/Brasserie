// La frise verticale du brassin (base v4.10, index.html) : ébullition de sa durée à 0′, whirlpool, la levure,
// fermentation, post-fermentation ; chaque ajout posé à son moment, sa carte à droite, son repère (« 60′ ») sur la
// ligne. Le repère se glisse du doigt de haut en bas : il suit le doigt en continu, seule la valeur s'accroche au
// cran (D46) ; un cran = min(14 px, place jusqu'au bord de l'écran ÷ crans à parcourir) de doigt (D69) ; crans du moteur (cransFrise), par 5′
// à l'ébullition, puis whirlpool et dry hop en jours, comme Dryhopper. Doigt posé, seules les graduations du segment
// sous le doigt apparaissent, sur la ligne, écartées comme sous une loupe (D47, D63) ; rien au repos. L'ébullition
// ouvre l'échelle du temps sous le doigt seulement ; au repos les cartes s'enchaînent (D55). Au clavier : ↑ ↓.
// Contrat (controle-rail --parcours) : [data-role="frise"] aria-orientation="vertical" ; une poignée par ajout
// [data-role="glisser-moment"][role="slider"][aria-orientation="vertical"][data-houblon] ; [data-cran] au geste.
import { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useOuvrir } from '../../coquille/ouvrir';
import { useGestes } from '../../etat/EtatParcours';
import { quandDe } from '../../etat/operations';
import type { AjoutParcours, Quand, RecetteParcours } from '../../etat/types';
import { cransFrise, houblon, type BiereLue } from '../../moteur';
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

/** Le repère du moment (« 60′ ») : la poignée de l'ajout sur la ligne de la frise (role=slider, vertical). Le doigt la
 * prend et la glisse : elle suit le doigt en continu (D46), la valeur avance d'un cran par min(14 px, hauteur de la
 * zone qui défile ÷ crans) de doigt (D69) et s'accroche au cran ; la frise garde sa place jusqu'au lâcher (D68). */
function Repere({ a, recette, onGeste, onGel }: { a: AjoutParcours; recette: RecetteParcours; onGeste: () => void; onGel: (hauteur: number | null) => void }) {
  const gestes = useGestes();
  const crans = cransFrise(recette);
  const n = crans.length;
  const q = quandDe(a, recette);
  // Un moment hors de la frise (ajout à 60′ dans une ébullition de 45′) se lit au cran le plus proche.
  const exact = crans.findIndex((x) => meme(x, q));
  const i = exact >= 0 ? exact : q.type === 'ebullition' ? crans.reduce((m, x, k) => (x.type === 'ebullition' && Math.abs(x.minutes - q.minutes) < Math.abs((crans[m] as { minutes: number }).minutes - q.minutes) ? k : m), 0) : 0;
  const ref = useRef<HTMLSpanElement>(null);
  // rTop, rBas : la tranche de la frise ouverte pour le geste (la ligne tenue, agrandie à l'échelle de son segment) ;
  // les graduations n'en sortent pas, pour ne jamais toucher une étape de la frise (D111).
  const [geste, setGeste] = useState<{ y0: number; k0: number; dy: number; k: number; pas: number; h0: number; h1: number; c0: number; rTop: number; rBas: number; haut: number; repos: number; hc: number; prec: number } | null>(null);
  const zone = () => {
    const z = ref.current?.closest('main')?.getBoundingClientRect();
    return { h0: Math.max(0, z?.top ?? 0) + 6, h1: Math.min(window.innerHeight, z?.bottom ?? window.innerHeight) - 6 };
  };
  const viser = (k: number) => { if (!meme(crans[k], quandDe(a, recette))) { onGeste(); gestes.moment('recette', a.id, crans[k]); } };
  const fin = () => { setGeste(null); onGel(null); };
  // Comme la base (« sous la carte tenue, ils s'effacent ») : le repère d'un autre houblon que la bulle tenue recouvre
  // s'efface le temps du passage, puis revient (D35, plusieurs houblons).
  const tenuActif = !!geste;
  useEffect(() => {
    if (!tenuActif) return;
    const frise = ref.current?.closest('[data-role="frise"]');
    const autres = () => [...(frise?.querySelectorAll<HTMLElement>('[data-role="glisser-moment"]') ?? [])].filter((x) => x !== ref.current);
    return () => { for (const x of autres()) x.classList.remove('pq-ma-biere-fondu'); };
  }, [tenuActif]);
  useEffect(() => {
    if (!geste) return;
    const frise = ref.current?.closest('[data-role="frise"]');
    if (!frise) return;
    const autres = [...frise.querySelectorAll<HTMLElement>('[data-role="glisser-moment"]')].filter((x) => x !== ref.current);
    const t = ref.current!.getBoundingClientRect();
    for (const x of autres) {
      const b = x.getBoundingClientRect();
      x.classList.toggle('pq-ma-biere-fondu', b.top < t.bottom + 4 && b.bottom > t.top - 4);
    }
  });
  const kVu = geste ? geste.k : i;
  const seg = segment(crans[kVu]);
  // La tranche ouverte ne vaut que dans le segment de départ : ailleurs, la carte reprend sa place (sans puce), et les
  // graduations suivent le doigt sur toute la frise, comme avant D111.
  const ouvert = !!geste && seg === segment(crans[geste.k0]);
  // Graduations du segment sous le doigt, dans la zone qui défile (rien sous l'en-tête de la page) et dans la tranche
  // ouverte de la frise (aucune sur une étape : « 0′ », whirlpool, levure).
  const voisins = geste ? crans.map((_, k) => k).filter((k) => {
    if (segment(crans[k]) !== seg) return false;
    const y = geste.c0 + geste.dy + loupe(k - kVu);
    return y > geste.h0 + 8 && y < geste.h1 - 8 && (!ouvert || (y > geste.rTop + 4 && y < geste.rBas - 4));
  }) : [];
  // Les minutes écrites, comme la base : à 22 px du doigt au moins, et 24 px entre deux, en partant du doigt ; les
  // autres crans ne sont qu'un trait.
  // Une minute ne s'écrit pas sur le repère d'un autre houblon posé sur la ligne (D35, plusieurs houblons).
  const autres = geste ? [...(ref.current?.closest('[data-role="frise"]')?.querySelectorAll('[data-role="glisser-moment"]') ?? [])]
    .filter((x) => x !== ref.current).map((x) => { const b = x.getBoundingClientRect(); return [b.top - 16, b.bottom + 16]; }) : [];
  const ecrits = new Set<number>();
  for (const sens of [1, -1]) {
    let dernier = 0;
    for (const k of voisins.filter((x) => Math.sign(x - kVu) === sens).sort((x, y) => Math.abs(x - kVu) - Math.abs(y - kVu))) {
      const o = Math.abs(loupe(k - kVu));
      const y = geste!.c0 + geste!.dy + loupe(k - kVu);
      if (o >= 22 && o - dernier >= 24 && !autres.some(([t, b]) => y > t && y < b)) { ecrits.add(k); dernier = o; }
    }
  }
  return (
    <span className="relative block w-[3.25rem] h-9">
      <span ref={ref} data-role="glisser-moment" data-houblon={a.hopKey} data-ajout-repere={a.id} role="slider" tabIndex={0} aria-orientation="vertical"
        aria-label={`Moment de l'ajout ${a.id}`} aria-valuemin={0} aria-valuemax={n - 1} aria-valuenow={i} aria-valuetext={valeur(crans[i] ?? q)}
        {...(geste ? { 'data-glisse': '' } : {})}
        className={`pq-ma-biere-piste absolute inset-0 inline-flex items-center justify-center rounded-full border-2 font-mono text-sm font-semibold whitespace-nowrap ${geste ? 'pq-ma-biere-pouce-actif' : 'pq-ma-biere-pouce'}`}
        style={geste ? { transform: `translateY(${geste.dy.toFixed(1)}px)` } : undefined}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (e.button > 0) return;
          try { ref.current!.setPointerCapture(e.pointerId); } catch { /* pointeur synthétique */ }
          const { h0, h1 } = zone();
          const r = ref.current!.getBoundingClientRect();
          // Le pas tient la course dans l'écran : d'ici au haut pour les crans d'avant, d'ici au bas pour ceux d'après (D69).
          const c0 = r.top + r.height / 2, H = window.innerHeight;
          const pas = Math.max(4, Math.min(PX_CRAN, i > 0 ? (c0 - 12) / i : Infinity, n - 1 - i > 0 ? (H - 12 - c0) / (n - 1 - i) : Infinity));
          // La frise s'ouvre autour du doigt (base v4.10, D111) : la ligne tenue prend la hauteur des crans de son segment
          // qui la suivent, la carte se replie en puce ; les étapes d'après descendent d'autant.
          const ligneFrise = ref.current!.closest('.pq-ma-biere-ligne-frise')?.getBoundingClientRect();
          const apres = crans.slice(i + 1).filter((x) => segment(x) === segment(crans[i] ?? q)).length;
          const haut = Math.max(ligneFrise?.height ?? 0, apres * pas + 24);
          const rTop = ligneFrise?.top ?? r.top;
          onGel(haut);
          setGeste({ y0: e.clientY, k0: i, dy: 0, k: i, pas, h0, h1, c0, rTop, rBas: rTop + haut, haut, repos: ligneFrise?.height ?? 0, hc: haut, prec: 0 });
        }}
        onPointerMove={(e) => {
          if (!geste) return;
          const brut = e.clientY - geste.y0;
          // Le repère suit le doigt sans sortir de la zone qui défile.
          const dy = Math.max(geste.h0 + 18 - geste.c0, Math.min(geste.h1 - 18 - geste.c0, brut));
          const k = Math.max(0, Math.min(n - 1, geste.k0 + Math.round(brut / geste.pas)));
          // Hors du segment de départ, la ligne ouverte se referme vers sa hauteur de repos, au plus deux fois plus vite que le doigt
          // avance (aucun houblon ne saute d'un bond, D61 bis ; pas de vide dans la frise, D55) ; elle se rouvre au retour.
          const dans = segment(crans[k]) === segment(crans[geste.k0]);
          const vise = dans ? geste.haut : Math.min(geste.haut, geste.repos);
          const pasH = 2 * Math.abs(brut - geste.prec);
          const hc = geste.hc < vise ? Math.min(vise, geste.hc + pasH) : Math.max(vise, geste.hc - pasH);
          setGeste({ ...geste, dy, k, hc, prec: brut });
          if (hc !== geste.hc || dans !== (segment(crans[geste.k]) === segment(crans[geste.k0]))) onGel(dans ? hc : -hc);
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
        <span data-role="moment-pouce">{etiquette(crans[kVu] ?? q)}</span>
        {/* La carte tenue, repliée en puce à côté de la bulle (base v4.10 : « Nugget » près de « 35′ »). */}
        {ouvert && (
          <span data-role="ligne-houblon" data-puce-tenue="" aria-hidden="true"
            className="pq-ma-biere-puce absolute top-1/2 -translate-y-1/2 inline-flex items-center h-9 px-3.5 rounded-full font-sans text-base font-semibold whitespace-nowrap">
            <span className="underline decoration-dotted decoration-cave-600 underline-offset-4">{houblon(a.hopKey).nom}</span>
          </span>
        )}
        {voisins.map((k) => (
          <span key={k} aria-hidden="true" data-cran={k} {...(ecrits.has(k) ? { 'data-ecrit': '' } : {})} {...(ouvert ? {} : { 'data-hors-tranche': '' })}
            className={`pq-ma-biere-graduation absolute left-1/2 -translate-x-1/2 -translate-y-1/2 ${k === kVu ? '-z-10' : ''}`}
            style={{ top: `calc(50% + ${loupe(k - kVu)}px)` }}>
            {ecrits.has(k) && <span className="pq-ma-biere-graduation-mot font-mono text-xs font-semibold whitespace-nowrap">{etiquette(crans[k])}</span>}
          </span>
        ))}
      </span>
    </span>
  );
}


function Noeud({ nom, plein = false, petit = false }: { nom: React.ReactNode; plein?: boolean; petit?: boolean }) {
  return (
    <div className={`pq-ma-biere-ligne-frise flex items-center gap-3 ${petit ? 'min-h-[1.5rem]' : 'min-h-[2rem]'}`}>
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
  // L'ajout tenu et la hauteur de sa ligne ouverte pendant le geste (D111).
  const [tenu, setTenu] = useState<{ id: string; haut: number } | null>(null);
  const place = gel ?? recette;
  const avecQuand = recette.additions.map((a) => ({ a, q: quandDe(place.additions.find((x) => x.id === a.id) ?? a, place) }));
  const minutesDe = (q: Quand) => (q.type === 'ebullition' ? q.minutes : recette.boilMin);
  const bouillis = avecQuand.filter((x) => x.q.type === 'ebullition' || x.q.type === 'premierMout').sort((x, y) => minutesDe(y.q) - minutesDe(x.q));
  const wp = avecQuand.filter((x) => x.q.type === 'whirlpool');
  const actif = avecQuand.filter((x) => x.q.type === 'dryhop' && x.q.phase === 'actif');
  const apres = avecQuand.filter((x) => x.q.type === 'dryhop' && x.q.phase === 'apres');
  // Au repos, la frise s'enchaîne comme la base v4.10 (D55 : « autant d'espace ») : 0′ suit la dernière carte. Seul un
  // léger retrait (1 px par minute) au-dessus d'une carte d'ébullition garde l'ordre du temps lisible et la place du
  // repère fidèle à son moment (D61) ; l'échelle pleine (14 px par 5′) et la loupe ne s'ouvrent que sous le doigt.
  const pxMinute = 1;
  // Une seule liste à clés stables : un ajout qui change de segment est déplacé, pas remonté (le geste continue).
  // La carte vient d'abord dans le document (le nom avant la poignée), la poignée s'affiche à gauche.
  const ligne = ({ a }: { a: AjoutParcours }) => {
    // haut < 0 : le doigt a quitté le segment de départ ; la carte revient, la ligne se referme au pas du doigt.
    const t = tenu?.id === a.id;
    const replie = t && tenu.haut > 0;
    return (
      <div key={a.id} className="pq-ma-biere-ligne-frise flex items-start gap-3" style={t ? { minHeight: Math.abs(tenu.haut) } : undefined}>
        <div className={`flex-1 min-w-0 order-2 ${replie ? 'invisible' : ''}`}><Carte a={a} recette={recette} biere={biere} repere={reperes[a.id] ?? null} onGeste={onGeste} /></div>
        <span className="w-[3.25rem] flex justify-center shrink-0 pt-1.5 order-1"><Repere a={a} recette={recette} onGeste={onGeste}
          onGel={(h) => { if (h == null) { setGel(null); setTenu(null); } else { setGel((g) => g ?? recette); setTenu({ id: a.id, haut: h }); } }} /></span>
      </div>
    );
  };
  const ecart = (cle: string, h: number) => (h >= 2 ? <div key={cle} aria-hidden="true" style={{ height: h }} className="pq-ma-biere-ligne-frise" /> : null);
  const lignes: React.ReactNode[] = [<Noeud key="n-eb" nom={<>Ébullition <b className="font-mono text-cave-50">{recette.boilMin}′</b></>} />];
  let minutes = recette.boilMin;
  for (const x of bouillis) {
    const m = minutesDe(x.q);
    lignes.push(ecart('e-' + x.a.id, (minutes - m) * pxMinute), ligne(x));
    minutes = m;
  }
  lignes.push(<Noeud key="n-0" petit nom="0′" />, <Noeud key="n-wp" nom="whirlpool" petit={!wp.length} />, ...wp.map(ligne));
  const levureChangee = reperes.__levure;
  const ajoutLevure = (actif.at(-1) ?? apres.at(-1) ?? avecQuand[0])?.a.id ?? null;
  lignes.push(
    <div key="n-levure" className="pq-ma-biere-ligne-frise flex items-center gap-3">
      <span className="w-[3.25rem] flex justify-center shrink-0"><i aria-hidden="true" className="block w-6 h-6 rounded-full bg-cave-50" /></span>
      <button type="button" data-role="pont-etape-levure" data-element="etape-levure" disabled={!ajoutLevure}
        onClick={() => ajoutLevure && ouvrir({ ecran: 'levure', ajout: ajoutLevure })}
        className={`flex-1 min-w-0 flex items-center gap-2 min-h-[2.5rem] px-3 rounded-lg border bg-cave-900 text-left ${levureChangee ? 'pq-ma-biere-change border-cave-600' : 'border-cave-700'}`}>
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
    <div data-role="frise" data-acquis="frise" aria-orientation="vertical" data-element="etape-frise" {...(tenu ? { 'data-geste': '' } : {})} className="pq-ma-biere-frise relative space-y-0.5">
      {lignes}
    </div>
  );
}
