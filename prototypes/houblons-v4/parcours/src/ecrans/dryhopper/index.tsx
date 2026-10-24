// Dryhopper (a1 passe 3, « le rail sous le pouce », y1b affiné) : « Quand ajouter Idaho 7 ? ».
// Un seul facteur libre, le moment (D98) : le rail sous le pouce, l'ébullition par 5′, le whirlpool, le dry hop actif
// puis après fermentation, en jours. Houblon, dose et levure sont fixés sur la ligne de contexte.
// Calcul en direct (frise.ts → simulerMoment → simulerCas) ; le rail est le réglage du simulé (D95), une vraie
// valeur sourcée se tient à côté. Pont : « Puis la levure » → l'étape Levure, le brouillon suit.
// Classes propres préfixées pq-dry- (L26). Place future : src/ui/hops/HopTiming.tsx.
import { useMemo, useRef, useState } from 'react';
import {
  BarreStyle, CadreOutil, COULEURS, COURT, Inconnu, JetonHoublon, Legende, LigneContexte, PiedAnnuler, Picto, nombre, signe, type Echelle,
} from '../../commun';
import { useNavigation } from '../../coquille/navigation';
import { nomLevure } from '../../donnees/cas';
import { useBrouillon, useGestes } from '../../etat/EtatParcours';
import { quandDe, trouver } from '../../etat/operations';
import { effetLevure, houblon, lireBiere, style, type FamilleLue } from '../../moteur';
import type { FamilyId } from '../../../../src/engine';
import { BORNES_SEG, calculerFrise, loupe, meilleur, memeQuand, positions, type Point } from './frise';
import { useFicheSurOutil } from './fiche-sur-outil';
import { mesureDe } from './mesures';
import './dryhopper.css';

const Etoile = ({ taille = 12 }: { taille?: number }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="currentColor" aria-label="le meilleur" role="img"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" /></svg>
);
const Chevron = ({ ouvert = false }: { ouvert?: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    className={`pq-dry-chevron ${ouvert ? 'pq-dry-chevron-ouvert' : ''}`}><path d="m9 6 6 6-6 6" /></svg>
);

/** Orangé « hors du style » / « trop amer » (le seul accent d'alerte du standard #142). */
export const ACC = '#c2410c';
const IBU_MAX = 170;
/** Pas entre deux cases de la loupe, en px. */
const PAS_LOUPE = 56;
const JOURS = [1, 2, 3, 7];
const POMONA = 'lalbrew-pomona';

/** Valeur simulée (« ~ ») ou interpolée (« ≈ »), en écart signé. */
function Ecart({ v, interp, couleur, nom }: { v: number | null; interp: boolean; couleur?: string; nom?: string }) {
  if (v == null) return <Inconnu raison={nom ? `${nom} : ma bière avant n’est pas décrite, l’écart est inconnu` : 'inconnu'} />;
  return (
    <span data-nature="simule" data-valeur={Math.round(v)} className="font-mono tabular-nums" style={couleur ? { color: couleur } : undefined}>
      {`${interp ? '≈' : '~'}${signe(v)}`}
    </span>
  );
}

function Lentille({ echelle, choisir }: { echelle: Echelle; choisir: (e: Echelle) => void }) {
  const opt = (e: Echelle, lib: string) => (
    <button type="button" role="radio" data-e={e} aria-checked={echelle === e} onClick={() => choisir(e)}
      className={`min-h-touch px-2.5 rounded-full text-xs ${echelle === e ? 'font-semibold' : 'text-cave-200'}`}
      style={echelle === e ? { background: 'rgb(var(--cave-50))', color: 'rgb(var(--cave-950))' } : undefined}>{lib}</button>
  );
  return (
    <div role="radiogroup" aria-label="Lecture" data-lecture="" className="inline-flex gap-0.5 p-0.5 rounded-full bg-cave-850 border border-cave-800">
      {opt('style', 'Au style')}{opt('absolu', 'Absolu')}
    </div>
  );
}

/** Le ruban d'une famille : sa valeur à chaque cran du brassin, alignée sur le rail ; la case du moment cerclée. */
function Ruban({ points, x, cw, couleur, courant, valeur }: {
  points: Point[]; x: number[]; cw: number[]; couleur: (p: Point) => string; courant: number;
  valeur: (p: Point) => { t: number | null; hors: boolean };
}) {
  return (
    <span className="pq-dry-ruban" aria-hidden="true">
      {points.map((p) => {
        const v = valeur(p);
        return (
          <i key={p.k} className={`${v.t == null ? 'pq-hachure' : ''} ${v.hors ? 'pq-dry-hors' : ''} ${p.k === courant ? 'pq-dry-ici' : ''}`}
            style={{ left: `${x[p.k]}%`, width: `${cw[p.k]}%`, background: v.t == null ? undefined : couleur(p), opacity: v.t == null ? 1 : (0.3 + 0.7 * v.t) * (p.interp ? 0.7 : 1) }} />
        );
      })}
    </span>
  );
}

export default function Dryhopper({ ajoutId }: { ajoutId: string }) {
  const b = useBrouillon()!;
  const gestes = useGestes();
  const { aller } = useNavigation();
  const recette = b.recette;
  const ajout = trouver(recette, ajoutId);
  const [echelle, setEchelle] = useState<Echelle>('style');
  const [ouvert, setOuvert] = useState(false);
  const [doigt, setDoigt] = useState<number | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const cleHoublon = ajout?.hopKey ?? '';
  const fiche = useFicheSurOutil(cleHoublon);

  const base = useMemo(() => ({ ...recette, additions: recette.additions.filter((a) => a.id !== ajoutId) }), [recette, ajoutId]);
  const cleBase = JSON.stringify(base);
  // Toute la frise, en direct à l'ouverture (28 crans, ~20 ms) ; un geste relit ensuite le cache du moteur.
  const points = useMemo(() => (ajout ? calculerFrise(base, { ...ajout }) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cleBase, ajout?.hopKey, ajout?.grams]);
  const x = useMemo(() => positions(points), [points]);
  const cw = useMemo(() => x.map((v, k) => Math.min(4.2, 0.85 * Math.min(k > 0 ? v - x[k - 1] : 99, k < x.length - 1 ? x[k + 1] - v : 99))), [x]);
  if (!ajout || !points.length) return null;

  const h = houblon(ajout.hopKey);
  const sc = style(recette.styleCode);
  const bande = sc.ibu;
  const quand = quandDe(ajout, recette);
  const i = Math.max(0, points.findIndex((p) => memeQuand(p.q, quand)));
  const p = points[i];
  const best = meilleur(points, bande);
  const pb = points[best];
  const avant = lireBiere(base).profil;
  const trop = (q: Point) => !!bande && q.ibu > bande[1];

  // Familles : repliées si on ne sait rien d'elles à aucun cran, ou si elles bougent peu (moins de 4 points partout).
  const replie = (f: FamilyId) => f !== 'resin' && sc.families[f].status !== 'attendue'
    && points.every((q) => !q.profil[f].valeur || (q.ecart[f] != null && Math.abs(q.ecart[f]!) < 4));
  const vues = sc.order.filter((f) => !replie(f));
  const repliees = sc.order.filter(replie);

  // Le geste : un cran par position du doigt ; la loupe déforme le rail autour du doigt pendant qu'il est posé.
  // La loupe se centre sur le cran sous le doigt : ses voisins s'écartent de part et d'autre, à égale distance.
  // Seule l'étape sous le doigt se déforme ; les autres gardent leur place.
  const X = (k: number) => (doigt == null || points[k].seg !== p.seg ? x[k] : loupe(x[k], x[i], BORNES_SEG[p.seg][0], BORNES_SEG[p.seg][1]));
  const poser = (k: number) => { if (k !== i) gestes.moment('brouillon', ajoutId, points[k].q); };
  const depuis = (clientX: number) => {
    const r = railRef.current?.getBoundingClientRect();
    if (!r || r.width <= 0) return;
    const pct = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    let k = 0;
    for (let j = 1; j < x.length; j++) if (Math.abs(x[j] - pct) < Math.abs(x[k] - pct)) k = j;
    setDoigt(pct);
    poser(k);
  };
  const lacher = () => setDoigt(null);

  // L'étape Levure en aperçu : ce que Pomona changerait à ce moment (la levure n'agit qu'en dry hop actif).
  const apercu = (() => {
    if (recette.yeastId === POMONA) return null;
    const [, e] = effetLevure(base, ajout, [recette.yeastId ?? 'fermentis-us05', POMONA]);
    let top: FamilyId | null = null;
    for (const f of sc.order) { const c = e.ecart[f]?.centre ?? 0; if (Math.abs(c) >= 0.5 && (!top || Math.abs(c) > Math.abs(e.ecart[top]!.centre))) top = f; }
    return top ? { f: top, v: e.ecart[top]!.centre } : 'rien';
  })();

  const contre = (() => {
    if (best < 0 || i === best) return null;
    const df = (p.ecart.floral ?? 0) - (pb.ecart.floral ?? 0), dr = (p.ecart.resin ?? 0) - (pb.ecart.resin ?? 0);
    const amer = trop(p);
    if (Math.round(df) === 0 && Math.round(dr) === 0 && !amer) return null;
    return (
      <p className="text-xs text-cave-400" data-role="contre">
        contre ★ <b className="text-cave-50 font-semibold">{pb.lib}</b> : floral <Ecart v={df} interp={p.interp} /> · résineux <Ecart v={dr} interp={p.interp} />
        {amer && <> · <b style={{ color: ACC }}>trop amer</b></>}
      </p>
    );
  })();

  const ligneFamille = (f: FamilyId) => {
    const fl: FamilleLue = p.profil[f];
    const e = p.ecart[f];
    const hors = fl.horsStyle === 'au-dessus';
    return (
      <div key={f} data-ligne={f} className="pq-dry-ligne">
        <BarreStyle apres={fl} avant={avant[f]} echelle={echelle}
          valeur={<span style={hors && e != null ? { color: ACC } : undefined}><Ecart v={e} interp={p.interp} couleur={hors ? ACC : COULEURS[f].texte} nom={COURT[f]} /></span>} />
        <div className="pq-dry-sous">
          <Ruban points={points} x={x} cw={cw} courant={i} couleur={() => COULEURS[f].base}
            valeur={(q) => {
              const v = q.profil[f].valeur, bd = q.profil[f].bande;
              if (!v) return { t: null, hors: false };
              const t = echelle === 'style' && bd ? Math.min(1, v.centre / bd[1] / 2) : Math.min(1, v.centre / 110);
              return { t, hors: q.profil[f].horsStyle === 'au-dessus' };
            }} />
        </div>
      </div>
    );
  };

  const ibuBase = p.ibu - (p.ibuAjout ?? 0);
  const pc = (v: number) => `${(Math.min(IBU_MAX, Math.max(0, v)) / IBU_MAX) * 100}%`;
  const ligneAmertume = (
    <div data-ligne="amertume" className="pq-dry-ligne">
      <div className="grid grid-cols-[6.25rem_1fr_4.25rem] items-center gap-2 min-h-[1.75rem]">
        <span className="text-sm text-cave-200">Amertume</span>
        <span className="relative h-2.5 rounded-full bg-cave-800/60" title={bande ? `style ${bande[0]}–${bande[1]} IBU` : undefined}>
          {bande && <i data-role="zone" className="absolute inset-y-0 rounded-full bg-cave-700/70" style={{ left: pc(bande[0]), width: `calc(${pc(bande[1])} - ${pc(bande[0])})` }} />}
          <i className="absolute inset-y-0 left-0 rounded-full bg-cave-400" style={{ width: pc(ibuBase) }} />
          {p.cru
            ? <i className="absolute inset-y-0 pq-hachure rounded-full" style={{ left: pc(ibuBase), width: '9%' }} />
            : <i className="absolute inset-y-0 rounded-full pq-dry-anim" style={{ left: pc(ibuBase), width: `calc(${pc(p.ibu)} - ${pc(ibuBase)})`, background: trop(p) ? ACC : 'rgb(var(--cave-50))' }} />}
        </span>
        <span className="text-right text-xs font-mono" data-role="ibu-dry" data-valeur={p.ibu.toFixed(2)} data-cru={p.cru ? '' : undefined} style={trop(p) ? { color: ACC } : undefined}>
          {p.cru ? <>{nombre(ibuBase)}<Inconnu raison="à cru : l’IBU d’Idaho 7 n’est pas modélisée">+?</Inconnu></> : nombre(p.ibu)}
        </span>
      </div>
      <div className="pq-dry-sous">
        <Ruban points={points} x={x} cw={cw} courant={i} couleur={(q) => (trop(q) ? ACC : 'rgb(var(--cave-400))')}
          valeur={(q) => ({ t: Math.max(0.15, Math.min(1, (q.ibu - 40) / 130)), hors: false })} />
      </div>
    </div>
  );

  // La vraie valeur du houblon EN BROUILLON, au moment choisi (L14) ; « ? » s'il n'en a pas, jamais celle d'un autre.
  const vraie = mesureDe(h.nom, p.seg);
  const mesure = p.seg < 2
    ? <span className="px-1.5 rounded bg-cave-900">jamais mesuré à ce moment</span>
    : vraie
      ? <>{vraie.famille && <Picto famille={vraie.famille} taille={14} />}<span><b className="font-semibold text-cave-50">mesuré</b> {vraie.compose} <span data-nature="mesure" data-source={vraie.cle}>{vraie.texte}</span> ({vraie.source})</span></>
      : <span data-role="mesure-absente"><Inconnu raison={`aucune mesure publiée pour ${h.nom} à ce moment`}>?</Inconnu> pas de mesure pour {h.nom}</span>;

  const etapes: { seg: number; lib: string; k: number }[] = (() => {
    const jr = p.seg >= 2 && p.q.type === 'dryhop' ? p.q.jours : 2;
    const k = (seg: number) => points.findIndex((q) => q.seg === seg && (seg < 2 || (q.q.type === 'dryhop' && q.q.jours === jr)));
    return [{ seg: 0, lib: '60′–0′', k: 0 }, { seg: 1, lib: 'WP', k: k(1) }, { seg: 2, lib: 'actif', k: k(2) }, { seg: 3, lib: 'après', k: k(3) }];
  })();
  const kJour = (j: number) => points.findIndex((q) => q.seg === p.seg && q.q.type === 'dryhop' && q.q.jours === j);

  const dock = (
    <div className="pq-dry-dock" data-libre="moment" data-acquis="frise" data-pas="5">
      {/* D120 : en tête du dock, « Annuler » à côté de l'action de Dryhopper, « Puis la levure » (le pont d'a1, déplacé du corps dans le pied, décision du pilote). Au-dessus du geste : la loupe et les étapes restent au bas de l'écran, au-delà du bas du corps (le corps d'a1 dépasse de 40 px sous le dock, ses textes cachés y restent dans l'écran, D35). */}
      {/* Pendant le geste, le pied s'efface comme les étapes (sa place reste) : le doigt est sur le rail, la loupe parle. */}
      <div className="pq-dry-pied" style={doigt != null ? { visibility: 'hidden' } : undefined}>
        <PiedAnnuler>
            <nav aria-label="Étape suivante" data-acquis="levure" data-forme="pont" className="shrink-0">
              <button type="button" data-role="pont-levure" onClick={() => aller({ ecran: 'levure', ajout: ajoutId })}
                className="inline-flex items-center gap-1.5 min-h-touch px-3 rounded-full border border-cave-700 bg-cave-900 text-sm text-cave-50 whitespace-nowrap">
                <b className="font-semibold">Puis la levure</b>
                {apercu === 'rien' ? <span className="text-xs text-cave-200">rien ne change ici</span>
                  : apercu ? <span className="inline-flex items-center gap-1 text-xs text-cave-200">Pomona <Picto famille={apercu.f} taille={14} /><span style={{ color: COULEURS[apercu.f].texte }}><Ecart v={apercu.v} interp={false} /></span></span> : null}
                <Chevron />
              </button>
            </nav>
        </PiedAnnuler>
      </div>
      <div className="pq-dry-geste-zone">
      <div className="pq-dry-haut" style={doigt != null ? { visibility: 'hidden' } : undefined}>
        <div className="grid grid-cols-4 gap-1">
          {etapes.map((e) => (
            <button key={e.seg} type="button" data-etape={e.seg} aria-label={`Moment : ${e.seg === 1 ? 'whirlpool' : e.lib}`} aria-current={p.seg === e.seg}
              onClick={() => { if (p.seg !== e.seg) poser(e.k); }}
              className={`pq-dry-etape ${trop(points[e.k]) ? 'pq-dry-amer' : ''}`}>
              <span>{e.lib}</span>
              <b><Ecart v={points[e.k].ecart.floral} interp={points[e.k].interp} /></b>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1" data-jours="" role="group" aria-label="Jours de contact">
          {JOURS.map((j, n) => {
            const k = kJour(j), on = p.seg >= 2 && k >= 0;
            const prec = on && n > 0 ? points[kJour(JOURS[n - 1])] : null;
            const sansGain = on && prec != null && Math.abs((points[k].ecart.floral ?? 0) - (prec.ecart.floral ?? 0)) < 0.1;
            return (
              <button key={j} type="button" data-jour={j} aria-pressed={on && p.q.type === 'dryhop' && p.q.jours === j} aria-disabled={!on}
                onClick={() => { if (on) poser(k); }} className={`pq-dry-jour ${sansGain ? 'pq-dry-sansgain' : ''}`}>{j} j</button>
            );
          })}
        </div>
      </div>
      {doigt != null && (
        <div className="pq-dry-loupe" aria-hidden="true" data-role="loupe">
          {/* D35 : cinq cases à pas fixe ; au bord, c'est la rangée entière qui se décale, jamais une case sur sa voisine. */}
          {points.filter((q) => Math.abs(q.k - i) <= 2).map((q) => (
            <span key={q.k} className={q.k === i ? 'pq-dry-loupe-ici' : ''}
              style={{ left: `calc(clamp(${24 + Math.min(2, i) * PAS_LOUPE}px, ${X(i)}%, calc(100% - ${24 + Math.min(2, points.length - 1 - i) * PAS_LOUPE}px)) + ${(q.k - i) * PAS_LOUPE}px)` }}>
              <em>{q.court}</em>
              <small style={{ color: COULEURS.floral.texte }}>{q.ecart.floral == null ? '?' : `${q.interp ? '≈' : '~'}${signe(q.ecart.floral)}`}</small>
            </span>
          ))}
        </div>
      )}
      <div data-acquis="geste" data-role="frise" className="pq-dry-geste"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); depuis(e.clientX); }}
        onPointerMove={(e) => { if (doigt != null) depuis(e.clientX); }}
        onPointerUp={lacher} onPointerCancel={lacher} onLostPointerCapture={lacher}>
        <div className="pq-dry-voie" aria-hidden="true">
                    {doigt == null && <span className="pq-dry-etiquette" style={{ left: `${X(i)}%`, transform: x[i] < 10 ? 'translateX(-12px)' : x[i] > 90 ? 'translateX(calc(-100% + 12px))' : 'translateX(-50%)' }}>{p.court}</span>}
        </div>
        <div className="pq-dry-profil" aria-hidden="true">
          {points.map((q) => {
            const gap = Math.min(q.k > 0 ? X(q.k) - X(q.k - 1) : 99, q.k < points.length - 1 ? X(q.k + 1) - X(q.k) : 99);
            const fl = q.ecart.floral;
            return (
              <i key={q.k} className={`${q.k === i ? 'pq-dry-ici' : ''} ${trop(q) ? 'pq-dry-amer' : ''}`} style={{ left: `${X(q.k)}%`, width: `${Math.max(0.6, Math.min(doigt == null ? 4.2 : 9, gap * 0.85))}%` }}>
                {fl == null ? <b className="pq-hachure" style={{ height: '100%' }} /> : <b style={{ height: `${Math.max(6, Math.min(100, (fl / 25) * 100))}%`, background: COULEURS.floral.base, opacity: q.interp ? 0.55 : 1 }} />}
              </i>
            );
          })}
        </div>
        <div ref={railRef} role="slider" tabIndex={0} data-role="reglage" aria-label="Moment de l’ajout"
          aria-valuemin={0} aria-valuemax={points.length - 1} aria-valuenow={i} aria-valuetext={p.lib}
          onKeyDown={(e) => {
            const n = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? points.length - 1 : null;
            if (n == null) return;
            e.preventDefault();
            poser(Math.max(0, Math.min(points.length - 1, n)));
          }}
          className="pq-dry-rail">
          {BORNES_SEG.map(([a, z], s) => <span key={s} className={`pq-dry-zone pq-dry-zone-${s}`} style={{ left: `${a + 0.4}%`, width: `${z - a - 0.8}%` }} />)}
          {/* D47 : « Juste les affiches quand on est à cette emplacement » : les crans du seul segment sous le doigt. */}
          {doigt != null && points.filter((q) => q.seg === p.seg).map((q) => <i key={q.k} data-cran={q.k} className="pq-dry-cran" style={{ left: `${X(q.k)}%` }} />)}
          {best >= 0 && <span className="pq-dry-etoile" style={{ left: `${X(best)}%` }}><Etoile taille={10} /></span>}
          {/* D46 : le pouce suit le doigt en continu ; seule la valeur s'accroche au cran (comme les curseurs de l'app). */}
          <span className="pq-dry-pouce" style={{ left: `${doigt ?? X(i)}%` }} />
        </div>
      </div>
      </div>
    </div>
  );

  return (
    <CadreOutil ecran="dryhopper" question={`Quand ajouter ${h.nom} ?`}
      contexte={<LigneContexte items={[
        { cle: 'houblon', contenu: <span {...fiche.declencheur} className="inline-flex items-center"><JetonHoublon h={h} /></span> },
        { cle: 'dose', contenu: `${nombre(ajout.grams / recette.volumeL)} g/L` },
        { cle: 'levure', contenu: nomLevure(recette.yeastId) },
        { cle: 'base', contenu: `Stout ${sc.code}` },
      ]} />}
      dock={dock}>
      <div className="flex items-center justify-between gap-2">
        <Legende>
          <p>Glisse le pouce sur le rail, de 60′ à 7 j après fermentation ; sous le doigt, la loupe écarte les crans voisins et chiffre leur floral.</p>
          <p>Sous chaque barre, son ruban : la famille à chaque moment du brassin, cerclée là où tu es ; trait orangé : hors du style.</p>
          <p>★ par floral : le meilleur moment pour ta demande du 18.10, plus floral et moins résineux, l’amertume dans le style ({bande ? `${bande[0]}–${bande[1]}` : '?'} IBU).</p>
          <p>~ simulé · ≈ interpolé entre deux crans calculés (60′, 10′, whirlpool) · ? inconnu, hachuré, jamais 0. IBU calculée à la minute ; à cru, non modélisée.</p>
          <p>Mesuré : la vraie valeur de {h.nom} au moment choisi, quand une étude l’a publiée (comparatifs E01 à E10, mesures en bière du moteur) ; sinon « ? ».</p>
        </Legende>
        <Lentille echelle={echelle} choisir={setEchelle} />
      </div>
      <section data-role="simulation" data-etat="etat-acquis-y1b-brassin-au-doigt" aria-label="Ta stout avec Idaho 7, au moment choisi" className="space-y-1 rounded-lg bg-cave-900 border border-cave-800 px-2 py-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5" aria-live="polite">
          <span className="font-semibold text-cave-50">Face à ta stout</span>
          <span className="inline-flex items-center gap-1 font-bold" style={{ color: COULEURS.floral.texte }}>
            <Picto famille="floral" taille={18} /><Ecart v={p.ecart.floral} interp={p.interp} />
          </span>
          <span data-role="critere" className="ml-auto inline-flex items-center gap-1 h-6 px-2 rounded-full border border-cave-700 text-xs text-cave-400">
            <Etoile /> <Picto famille="floral" taille={14} /><b style={{ color: COULEURS.floral.texte }} className="font-semibold">floral</b>
          </span>
          {contre && <div className="basis-full">{contre}</div>}
        </div>
        <div className="pq-dry-figure" id="pq-dry-figure">
          {vues.map(ligneFamille)}
          {ligneAmertume}
          {repliees.length > 0 && (
            <button type="button" className="pq-dry-repli" aria-expanded={ouvert} aria-controls="pq-dry-figure"
              aria-label={`Montrer ${repliees.map((f) => COURT[f]).join(', ')}`} onClick={() => setOuvert((o) => !o)}>
              {repliees.map((f) => <Picto key={f} famille={f} taille={14} nomme={false} />)}
              <Chevron ouvert={ouvert} />
            </button>
          )}
          {ouvert && repliees.map(ligneFamille)}
        </div>
      </section>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-xs text-cave-400 min-w-0" data-acquis="valeurs">{mesure}</p>
      </div>
      {fiche.feuille}
    </CadreOutil>
  );
}
