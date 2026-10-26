// Dryhopper, p4b2f (« L'aire du floral », passe 5 de p4b2, son choix du 24.10 au soir : « Partir sur cette version »,
// D43) : « Quand ajouter Idaho 7 ? ». Reprise r13 : sa maquette telle quelle, tous ses états, sur le moteur en direct.
// - Un seul facteur libre, le moment (D98) : le rail sous l'axe du graphique, l'ébullition par 5′, le whirlpool, le dry
//   hop actif puis après fermentation (1, 2, 3, 5, 7 j). Houblon, dose, levure et base sur la ligne de contexte.
// - Trois courbes de gain sur tous les moments (floral en aire pleine, baies et résineux en traits), l'amertume en une
//   bande de cases, la bosse de la levure sous l'axe, ★ au-dessus ; le trait du doigt traverse les courbes ; les quatre
//   chiffres du moment en gros dans un bandeau ; les 12 barres l5b dessous ; la vraie valeur sourcée ; le pont Levure.
// - Calcul en direct (frise.ts → simulerMoment → simulerCas), aucune grille ; un seul état de recette (le brouillon).
// - Continuité (D129) : la tête des outils (croix D109, titre 18 px), le pied « Annuler · Levure › » (D120) en bas.
// Classes propres préfixées pq-dry- (L26). Place future : src/ui/hops/HopTiming.tsx.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { COULEURS, COURT, JetonHoublon, Legende, LigneContexte, Picto, nombre, signe, type Echelle } from './commun';
import { CadreOutil, PiedAnnuler, useBrouillon, useFicheSurOutil, useGestes, useNavigation, useRecette, useTermes, useAjoutNeuf, useEstMaquette } from './hote';
import { nomLevure } from '../comparer/cas';
import { famillesDeLaDemande, useDemande } from '../comparer/demande';
import { quandDe, trouver } from '../parcours/operations';
import { effetLevure, houblon, lireBiere, style, type ProfilLu } from '../parcours/adaptateur';
import type { FamilyId } from '../../../domain/hopIndex/v4';
import { couleurHoublon } from '../comparer/calcul';
import { BORNES_SEG, calculerFrise, meilleur, memeQuand, positions, type Point } from './frise';
import { dureeDeContact, mesureDe } from './mesures';
import FroidDryhopper from './FroidDryhopper';
import './pied-annuler.css';
import './dryhopper.css';

/** Orangé « hors du style » / « trop amer » (le seul accent d'alerte du standard #142). */
export const ACC = '#c2410c';
/** Les jours de contact du rail (p4b2f) et ceux des boutons sous le rail. */
const JOURS_RAIL = [1, 2, 3, 5, 7];
const JOURS = [1, 2, 3, 7];
const POMONA = 'lalbrew-pomona';
// L'ordre des barres, les trois courbes et le bandeau ne sont plus ceux de la stout du 18.10 (floral, baies, résineux) : ils
// suivent la demande de l'écran (comparer/demande.ts : sa visée, sa dégustation, sinon les familles attendues du style).
/** La géométrie du dessin de p4b2f (unités du viewBox). */
const W = 366, H = 242, TOP = 16, YC = 160, YI0 = 184, YI1 = 202, YAX = 212, GAIN = 26;
/** Pas entre deux cases de la loupe (p4b2f : 66 px). */
const PAS_LOUPE = 66;
/** Un ajout neuf (posé par « Placer ») s'ouvre sur ★ une seule fois, comme le rail de p4b2f ; ensuite son moment fait foi. */
const OUVERTS = new Set<string>();

// S4 (une épaisseur d'icône) : 12 px au trait de 2,5, comme l'icône du stock du jeton (≈ 1,2 px rendus).
const Chevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
);

/** Gain d'Idaho 7 sur une famille à un cran : l'écart à ma bière avant ; si ma bière avant n'est pas décrite pour elle
 * (Noyau, Baies), ce que l'ajout y met (« ? → ~+21 », comme p4b2f) ; null si la famille est inconnue après. */
function gainDe(p: Point, f: FamilyId, avant: ProfilLu): { v: number | null; avInc: boolean } {
  const v = p.profil[f].valeur;
  if (!v) return { v: null, avInc: false };
  if (p.ecart[f] != null) return { v: p.ecart[f], avInc: false };
  if (!avant[f].valeur) return { v: v.centre, avInc: true };
  return { v: null, avInc: false };
}
const sg = (p: Point) => (p.interp ? '≈' : '~');
function fmt(p: Point, v: number | null) {
  if (v == null) return '?';
  if (Math.abs(v) < 0.5) return `${sg(p)}0`;
  return `${sg(p)}${signe(v)}`;
}

/** Lecture au style / absolu (la pilule de p4b2f : gris, l'option tenue en blanc). */
function Lentille({ echelle, choisir }: { echelle: Echelle; choisir: (e: Echelle) => void }) {
  const opt = (e: Echelle, lib: string) => (
    <button type="button" role="radio" data-e={e} aria-checked={echelle === e} onClick={() => choisir(e)} data-etat={e === 'absolu' ? 'etat-dryh-absolu' : undefined}
      className={`pq-dry-lent-o ${echelle === e ? 'pq-dry-lent-on' : ''}`}>{lib}</button>
  );
  return <div role="radiogroup" aria-label="Lecture" data-lecture="" className="pq-dry-lent">{opt('style', 'Au style')}{opt('absolu', 'Absolu')}</div>;
}

export default function Dryhopper({ ajoutId }: { ajoutId: string }) {
  const b = useBrouillon()!;
  const inscrite = useRecette();
  const gestes = useGestes();
  const { aller } = useNavigation();
  const recette = b.recette;
  const ajout = trouver(recette, ajoutId);
  const [echelle, setEchelle] = useState<Echelle>('style');
  const [touche, setTouche] = useState(false);
  const [doigt, setDoigt] = useState<number | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const cleHoublon = ajout?.hopKey ?? '';
  const fiche = useFicheSurOutil(cleHoublon);
  const T = useTermes();
  const estNeuf = useAjoutNeuf();

  // Les jours du rail : ceux de p4b2f, plus celui de l'ajout s'il est ailleurs (un moment existant n'est jamais perdu).
  const [jours] = useState(() => {
    const q = ajout ? quandDe(ajout, recette) : null;
    return q && q.type === 'dryhop' && !JOURS_RAIL.includes(q.jours) ? [...JOURS_RAIL, q.jours].sort((x, y) => x - y) : JOURS_RAIL;
  });
  const base = useMemo(() => ({ ...recette, additions: recette.additions.filter((a) => a.id !== ajoutId) }), [recette, ajoutId]);
  const cleBase = JSON.stringify(base);
  // Toute la frise, en direct à l'ouverture (24 crans) ; un geste relit ensuite le cache du moteur.
  const points = useMemo(() => (ajout ? calculerFrise(base, { ...ajout }, jours) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cleBase, ajout?.hopKey, ajout?.grams, jours]);
  const x = useMemo(() => positions(points), [points]);
  const sc = style(recette.styleCode);
  const demande = useDemande(recette);
  // Les trois familles montrées d'abord (bandeau, courbes) : celles de la demande, complétées par les attendues du style ; la
  // première porte l'aire pleine, la loupe et « Face à ta bière ». Les 12 barres : l'ordre du style (attendues d'abord).
  // La maquette (hôte sans `termes`) garde le dessin choisi de p4b2f : floral, baies, résineux, et ses mots (D43).
  const maquette = useEstMaquette();
  const fams = useMemo<FamilyId[]>(() => (maquette ? ['floral', 'berries', 'resin'] : famillesDeLaDemande(demande, sc, 3)), [demande, sc, maquette]);
  const COURBES = useMemo(() => [...fams].reverse(), [fams]);
  const BANDEAU = fams;
  const principale = fams[0];
  const liste = (l: string[]) => (l.length > 1 ? `${l.slice(0, -1).join(', ')} et ${l[l.length - 1]}` : l[0] ?? '');
  // Pour qui est ★ : sa demande (la maquette dit « ta demande du 18.10 »), ou, sans demande, les familles du style.
  const quiVise = demande.voulue ? `${maquette ? 'ta demande' : demande.mot}${demande.origine === 'degustation' ? T.duDeg : ''}` : `les familles du style (${demande.mot})`;
  const detailVise = maquette ? 'plus floral, moins résineux' : [demande.plus.length ? `plus : ${demande.plus.map((f) => COURT[f].toLowerCase()).join(', ')}` : '', demande.moins.length ? `moins : ${demande.moins.map((f) => COURT[f].toLowerCase()).join(', ')}` : ''].filter(Boolean).join(' ; ');
  const best = useMemo(() => meilleur(points, sc.ibu, demande), [points, sc.ibu, demande]);

  // p4b2f s'ouvre sur ★ : un ajout neuf (pas encore dans ma bière) y est posé une fois, dans le brouillon seulement.
  useEffect(() => {
    if (!ajout || best < 0 || OUVERTS.has(ajoutId)) return;
    OUVERTS.add(ajoutId);
    if (inscrite.additions.some((a) => a.id === ajoutId) && !estNeuf(ajoutId)) return;
    if (!memeQuand(points[best].q, quandDe(ajout, recette))) gestes.moment('brouillon', ajoutId, points[best].q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ajoutId, best]);

  if (!ajout || !points.length) return null;

  const h = houblon(ajout.hopKey);
  const bande = sc.ibu;
  const quand = quandDe(ajout, recette);
  const i = Math.max(0, points.findIndex((q) => memeQuand(q.q, quand)));
  const p = points[i];
  const pb = best >= 0 ? points[best] : null;
  const avant = lireBiere(base).profil;
  const N = points.length - 1;
  const trop = (q: Point) => !!bande && !q.cru && q.ibu > bande[1];
  const gain = (q: Point, f: FamilyId) => gainDe(q, f, avant);
  const ibuBase = p.ibu - (p.ibuAjout ?? 0);
  const ibuTexte = (q: Point) => (q.cru ? `${nombre(q.ibu - (q.ibuAjout ?? 0))}+?` : `~${nombre(q.ibu)}`);

  // ---------- Le geste : un cran par position du doigt ; le pouce suit le doigt, la valeur s'accroche au cran (D46).
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
  const lacher = () => { setTouche(false); setDoigt(null); };

  // ---------- Le dessin de p4b2f, en unités du viewBox.
  const px = (k: number) => (x[k] / 100) * W;
  const yc = (g: number | null) => YC - (Math.max(0, Math.min(GAIN + 1, g ?? 0)) / GAIN) * (YC - TOP);
  const segX = (s: number, bout: 0 | 1) => (BORNES_SEG[s][bout] / 100) * W;
  const xa = segX(2, 0), xb = segX(2, 1), xcc = segX(3, 0);
  const cw = (k: number) => {
    let g = 1e9;
    if (k > 0) g = Math.min(g, x[k] - x[k - 1]);
    if (k < N) g = Math.min(g, x[k + 1] - x[k]);
    return (Math.min(4.2, g * 0.85) / 100) * W * 1.15;
  };
  const kDe = (seg: number, j: number) => points.findIndex((q) => q.seg === seg && (seg < 2 || (q.q.type === 'dryhop' && q.q.jours === j)));
  const mesureActif = mesureDe(h.nom, 2, fams);
  const duree = dureeDeContact();
  const marques = [
    { k: kDe(2, 2), texte: mesureActif?.texte ?? null },
    { k: kDe(3, 2), texte: duree?.texte ?? null },
  ].filter((m) => m.k >= 0 && m.texte);
  // Les noms des courbes au bout de leur ligne, écartés de 17 au moins ; écartés aussi des anneaux quand le doigt y est.
  const noms = (() => {
    const it = COURBES.map((f) => ({ f, nom: true, y: yc(gain(points[N], f).v) - 6 }));
    if (px(i) >= W - 110) COURBES.forEach((f) => it.push({ f, nom: false, y: yc(gain(p, f).v) + 4 }));
    it.sort((a, c) => a.y - c.y);
    for (let n = 1; n < it.length; n++) if (it[n].y - it[n - 1].y < 17) it[n].y = it[n - 1].y + 17;
    return it.filter((e) => e.nom);
  })();
  const aire = (() => {
    let d = `M${px(0)} ${YC}`;
    for (let k = 0; k <= N; k++) d += ` L${px(k)} ${yc(gain(points[k], principale).v)}`;
    return `${d} L${px(N)} ${YC} Z`;
  })();

  const graphe = (
    <svg className="pq-dry-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" data-role="graphe" data-etat="etat-dryh-courbes etat-dryh-mesures-axe">
      <defs>
        <pattern id="pq-dry-hachb" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="6" fill="#3b5f8a" opacity=".45" /></pattern>
        <pattern id="pq-dry-hach" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="6" fill="#c9cdd6" /></pattern>
      </defs>
      {BORNES_SEG.map(([a, z], s) => (s % 2 === 1 ? <rect key={s} x={(a / 100) * W} y={TOP} width={((z - a) / 100) * W} height={YAX - TOP} fill="#f1f2f5" /> : null))}
      <line className="pq-dry-grid" x1="0" x2={W} y1={yc(10)} y2={yc(10)} />
      <line className="pq-dry-grid" x1="0" x2={W} y1={yc(20)} y2={yc(20)} />
      <text className="pq-dry-lb" x="2" y={yc(10) - 3}>+10</text>
      <text className="pq-dry-lb" x="2" y={yc(20) - 3}>+20</text>
      <line x1="0" x2={W} y1={YC} y2={YC} stroke="#c9cdd6" />
      {/* La levure : une bosse d'activité sur l'actif, qui retombe avant l'après (illustrative, « non chiffrée »). */}
      <path className="pq-dry-lev" data-role="bosse-levure" data-etat="etat-dryh-bosse-levure"
        d={`M${xa - 6} ${YAX} C${xa + 6} ${YAX} ${xa + 8} ${YAX - 11} ${xa + 22} ${YAX - 11} S${xb - 14} ${YAX - 5} ${xb - 2} ${YAX - 2} L${xcc} ${YAX} Z`} />
      <text className="pq-dry-lb" x={xa + 2} y={YAX + 12}>levure active</text>
      {/* D35 : les deux lignes à 16 d’écart et « levure finie » au début de l'après, sur la première (sur p4b2f, à 12 d'écart
          et calée à droite, « possible, non chiffrée » passait sous « levure finie »). */}
      <text className="pq-dry-lb" x={xa + 2} y={YAX + 28}>possible, non chiffrée</text>
      <text className="pq-dry-lb" x={xcc + 2} y={YAX + 12}>levure finie</text>
      {/* L'amertume en une bande de cases : orangée au-delà du style, grise dedans, hachurée à cru (non modélisée). */}
      <g data-role="bande-ibu" data-etat="etat-dryh-amertume">
        {points.map((q) => {
          const w = cw(q.k);
          return q.cru
            ? <rect key={q.k} x={px(q.k) - w / 2} y={YI0} width={w} height={YI1 - YI0} fill="url(#pq-dry-hach)" stroke="#c9cdd6" />
            : <rect key={q.k} className={`pq-dry-ibu ${trop(q) ? 'pq-dry-trop' : ''}`} x={px(q.k) - w / 2} y={YI0} width={w} height={YI1 - YI0} />;
        })}
      </g>
      <text className="pq-dry-lb" x="2" y={YI0 - 4}>IBU</text>
      <path className="pq-dry-aire" d={aire} />
      {COURBES.map((f) => {
        const c = COULEURS[f].texte;
        const pts = points.map((q) => [px(q.k), yc(gain(q, f).v), q.interp] as const);
        return (
          <g key={f} data-courbe={f}>
            {pts.slice(1).map((pt, n) => (
              <line key={n} x1={pts[n][0]} y1={pts[n][1]} x2={pt[0]} y2={pt[1]} stroke={c} strokeWidth={f === principale ? 4 : 2.5} strokeLinecap="round"
                className={pt[2] || pts[n][2] ? 'pq-dry-ip' : undefined} />
            ))}
            {pts.map((pt, k) => (pt[2] ? null : <circle key={k} cx={pt[0]} cy={pt[1]} r="3.5" fill={c} />))}
          </g>
        );
      })}
      {noms.map((e) => <text key={e.f} className="pq-dry-nom" x={W - 2} y={e.y} textAnchor="end" fill={COULEURS[e.f].texte}>{COURT[e.f].toLowerCase()}</text>)}
      {/* Les moments mesurés, sur l'axe (● plein). */}
      {marques.map((m) => (
        <g key={m.k} data-role="moment-mesure">
          <circle cx={px(m.k)} cy={YAX - 1} r="3" fill="rgb(var(--cave-50))" />
          <text className="pq-dry-lb" x={px(m.k) + 6} y={YAX - 4}>{m.texte}</text>
        </g>
      ))}
      {/* Le trait du doigt et ses anneaux : il traverse les courbes au moment tenu ; les chiffres sont dans le bandeau. */}
      <g data-role="trait-doigt">
        <line x1={px(i)} x2={px(i)} y1={TOP} y2={YAX} stroke="rgb(var(--cave-50))" strokeWidth="2" />
        {COURBES.map((f) => {
          const v = gain(p, f).v;
          return v == null ? null : <circle key={f} cx={px(i)} cy={yc(v)} r="6" fill="#fff" stroke={COULEURS[f].texte} strokeWidth="2.4" />;
        })}
      </g>
      {/* ★ en dernier, donc au-dessus de tout : quand le gain dépasse le haut de l'échelle (floral +29 à 1 j), l'anneau du doigt est
          calé sur TOP et recouvrait le ★ (a3-etoile). Contrôle : tests/integration/controle-etoile-dryhopper.mjs. */}
      {best >= 0 && <text className="pq-dry-etoile" x={px(best)} y={TOP - 3} textAnchor="middle" style={{ strokeWidth: 1.5 }}>★</text>}
    </svg>
  );

  // ---------- Les quatre étapes en tête de figure : des sauts.
  const jourCourant = p.q.type === 'dryhop' ? p.q.jours : 2;
  const etapes = [
    { seg: 0, lib: 'ébullition', aria: 'ébullition', k: 0, etat: 'etat-dryh-etape-ebullition' },
    { seg: 1, lib: 'WP', aria: 'whirlpool', k: kDe(1, 0), etat: 'etat-dryh-etape-wp' },
    { seg: 2, lib: 'actif', aria: 'dry hop actif', k: kDe(2, jourCourant) >= 0 ? kDe(2, jourCourant) : kDe(2, 2), etat: undefined },
    { seg: 3, lib: 'après', aria: 'après fermentation', k: kDe(3, jourCourant) >= 0 ? kDe(3, jourCourant) : kDe(3, 2), etat: 'etat-dryh-etape-apres' },
  ];
  const kJour = (j: number) => (p.seg >= 2 ? points.findIndex((q) => q.seg === p.seg && q.q.type === 'dryhop' && q.q.jours === j) : -1);

  // ---------- La loupe sous le rail, pendant le geste : cinq cases à pas fixe ; au bord, la rangée entière se décale (D35).
  const fenetre = (() => {
    const a = Math.max(0, Math.min(N - 4, i - 2));
    return points.slice(a, a + 5);
  })();
  const centreLoupe = fenetre.length ? fenetre[Math.floor(fenetre.length / 2)].k : i;

  const contre = (() => {
    if (!pb || i === best) return null;
    const g = (f: FamilyId) => Math.round((gain(p, f).v ?? 0) - (gain(pb, f).v ?? 0));
    const t = (n: number) => `${sg(p)}${n >= 0 ? '+' : '−'}${Math.abs(n)}`;
    return (
      <span className="pq-dry-contre" data-role="contre">
        contre ★ : {BANDEAU.map((f, k) => <span key={f}>{k > 0 && ' · '}{COURT[f].toLowerCase()} {t(g(f))}</span>)}{trop(p) && <> · <b className="pq-dry-moins">trop amer</b></>}
      </span>
    );
  })();

  // ---------- L'étape Levure en aperçu : ce que Pomona changerait à ce moment (la levure n'agit qu'en dry hop actif).
  const apercu = (() => {
    if (recette.yeastId === POMONA) return null;
    const [, e] = effetLevure(base, ajout, [recette.yeastId ?? 'fermentis-us05', POMONA]);
    let top: FamilyId | null = null;
    for (const f of sc.order) { const c = e.ecart[f]?.centre ?? 0; if (Math.abs(c) >= 0.5 && (!top || Math.abs(c) > Math.abs(e.ecart[top]!.centre))) top = f; }
    return top ? `Pomona ~${signe(e.ecart[top]!.centre)} ${COURT[top].toLowerCase()}` : 'rien ne change ici';
  })();

  // ---------- La vraie valeur du moment, toujours celle du houblon en brouillon (L14) ; « jamais mesuré » sinon.
  const mesure: ReactNode = (() => {
    if (p.seg === 2) {
      const m = mesureDe(h.nom, 2, fams);
      if (m) return <>{m.famille && <Picto famille={m.famille} taille={14} />}<span><b>mesuré</b> {m.compose} <span data-nature="mesure" data-source={m.cle}>{m.texte}</span> {`(${m.source})`}</span></>;
    }
    if (p.seg === 3 && duree) return <span><b>mesuré</b> <span data-nature="mesure" data-source={duree.cle}>{duree.texte}</span> {`au nez (${duree.source}, sur ${duree.variete})`}</span>;
    return null;
  })();

  const valeurBarre = (f: FamilyId) => {
    const g = gain(p, f);
    if (g.v == null) return '?';
    return `${g.avInc ? '?→' : ''}${fmt(p, g.v)}`;
  };
  const pc = (v: number) => `${Math.max(0, Math.min(100, v)).toFixed(1)}%`;
  const larg = (v: number, f: FamilyId) => {
    const haut = p.profil[f].bande?.[1] ?? 30;
    return echelle === 'style' ? pc((v / haut) * 50) : pc((v / 110) * 100);
  };
  const barre = (f: FamilyId) => {
    const fl = p.profil[f], av = avant[f], g = gain(p, f);
    const inc = !fl.valeur;
    const hors = fl.horsStyle === 'au-dessus';
    const zone = echelle === 'style' ? '50%' : pc(((fl.bande?.[1] ?? 30) / 110) * 100);
    return (
      <div key={f} className={`pq-dry-ba ${p.interp ? 'pq-dry-ipr' : ''}`} data-ligne={f} data-barre={f} data-echelle={echelle}>
        <span className={`pq-dry-n ${fl.statut === 'attendue' ? 'pq-dry-att' : ''}`}><Picto famille={f} /><span>{COURT[f]}</span></span>
        <span className={`pq-dry-p ${g.avInc ? 'pq-dry-avinc' : ''}`} {...(inc ? { 'data-inconnu': '', title: fl.raison ?? 'inconnu' } : {})}>
          <i data-role="zone" className="pq-dry-z" style={{ width: zone }} />
          {!inc && <i data-role="apres" className="pq-dry-b" style={{ width: larg(fl.valeur!.centre, f), background: COULEURS[f].base }} />}
          {av.valeur && !g.avInc && <i data-role="avant" className="pq-dry-av" style={{ left: `clamp(7px, ${larg(av.valeur.centre, f)}, calc(100% - 7px))` }} />}
          {inc && <i className="pq-dry-h" />}
        </span>
        <span className="pq-dry-v" style={{ color: inc ? 'rgb(var(--cave-400))' : hors ? ACC : COULEURS[f].texte }}>
          {g.v == null ? <span data-nature="inconnu" title={fl.raison ?? 'inconnu'}>?</span>
            : <span data-nature="simule" data-valeur={Math.round(g.v)} title={g.avInc ? `${COURT[f]} : ma bière avant n’est pas décrite ; ${h.nom} y met ${fmt(p, g.v)}` : undefined}>{valeurBarre(f)}</span>}
        </span>
      </div>
    );
  };

  // La vraie valeur sourcée et le pont Levure se tiennent ensemble au bas de p4b2f : la valeur passe au-dessus du pied.
  const valeur = <span className={`pq-dry-mes ${mesure ? '' : 'pq-dry-jamais'}`} data-acquis="valeurs" data-etat="etat-dryh-mesure">{mesure ?? <span data-role="mesure-absente" title={`aucune mesure publiée pour ${h.nom} à ce moment`}>jamais mesuré à ce moment</span>}</span>;
  const dock = (
    <PiedAnnuler resume={valeur}>
      <nav aria-label="Étape suivante" data-acquis="levure" data-forme="pont" className="shrink-0" data-etat="etat-dryh-annuler">
        <button type="button" data-role="pont-levure" data-etat="etat-dryh-pont-levure etat-dryh-pont-levure-toucher" onClick={() => aller({ ecran: 'levure', ajout: ajoutId })}
          className="inline-flex items-center gap-1.5 min-h-touch px-3 rounded-full bg-ebc-straw text-sm whitespace-nowrap">
          <b className="font-semibold">Levure</b>
          {apercu && <span className="pq-dry-apercu" data-role="apercu-levure">{apercu}</span>}
          <Chevron />
        </button>
      </nav>
    </PiedAnnuler>
  );

  return (
    <CadreOutil ecran="dryhopper" question={`Quand ajouter ${h.nom} ?`} dock={dock}>
      <div className="pq-dry-ecran">
      {/* Le contexte, puis « ? » et la lecture sur la même ligne que sa fin (p4b2f les pose dessous : 40 px rendus aux barres). */}
      <div className="pq-dry-ctx">
      <LigneContexte sansMot items={[
        { cle: 'houblon', contenu: <span {...fiche.declencheur} data-etat="etat-dryh-fiche" className="inline-flex items-center"><JetonHoublon h={h} couleur={couleurHoublon(h.cle)} /></span> },
        { cle: 'dose', contenu: `${nombre(ajout.grams / recette.volumeL)} g/L` },
        { cle: 'levure', contenu: nomLevure(recette.yeastId) },
        { cle: 'base', contenu: `${T.Biere} ${sc.code}` },
      ]} />
        <span data-etat="etat-dryh-legende" className="inline-block"><Legende>
          <p>Courbes : ce qu’{h.nom} ajoute à ta {T.biere} en {liste(BANDEAU.map((f) => COURT[f].toLowerCase()))} à chaque moment du brassin{maquette ? '' : ` (${quiVise})`}. Point plein : calculé par le moteur ; pointillé : interpolé entre 60′, 10′ et whirlpool.</p>
          <p>Cases sous l’axe : l’amertume de la bière, orangée au-delà de ton style ({bande ? `${bande[0]}–${bande[1]}` : '?'} IBU) ; hachurée à cru (non modélisée). Calculée à la minute.</p>
          <p>Sous l’axe, dans l’actif : la levure travaille (biotransformation possible, non quantifiée) ; fin vers J+5, à confirmer à la densité.</p>
          <p>Glisse le pouce sur le rail, par 5′ : le trait traverse les courbes ; la loupe chiffre les moments voisins. ● sur l’axe : un moment mesuré.</p>
          <p>Barres : les 12 familles au style, rond : avant ; hachuré « ? » : jamais décrit, pas zéro. « ? → » : ta {T.biere} avant n’est pas décrite. ★ : le meilleur pour {quiVise}.</p>
        </Legende></span>
        <Lentille echelle={echelle} choisir={setEchelle} />
      </div>
      <div className="pq-dry-rep" aria-live="polite" data-role="reponse" data-etat="etat-dryh-repos">
        <span className="pq-dry-face">Face à ta {T.biere}</span>
        <span className="pq-dry-fl" data-famille={principale}><Picto famille={principale} taille={18} /><span data-role="principale-moment">{fmt(p, gain(p, principale).v)}</span></span>
        {pb && (
          <span className={`pq-dry-star ${i === best ? 'pq-dry-star-ici' : ''}`} data-role="critere" data-etat="etat-dryh-etoile" title={`le meilleur moment pour ${quiVise} : ${detailVise}, l’amertume dans le style`}>
            ★ <b>{pb.lib}</b>
          </span>
        )}
        {contre}
      </div>
      <section className="pq-dry-bloc pq-dry-fig" data-role="simulation" data-libre="moment" data-acquis="frise" data-etat="etat-acquis-y1b-brassin-au-doigt"
        aria-label={`Le brassin : ce qu’${h.nom} ajoute à ta ${T.biere}, moment par moment`}>
        <div className="pq-dry-seg">
          {etapes.map((e) => (
            <button key={e.seg} type="button" data-etape={e.seg} data-etat={e.etat} aria-label={`Moment : ${e.aria}`} aria-current={p.seg === e.seg}
              className={e.k >= 0 && trop(points[e.k]) ? 'pq-dry-amer' : undefined}
              onClick={() => { if (p.seg !== e.seg && e.k >= 0) poser(e.k); }}>{e.lib}</button>
          ))}
        </div>
        <div className="pq-dry-call" aria-live="polite" data-role="bandeau" data-etat="etat-dryh-bandeau">
          {BANDEAU.map((f) => {
            const g = gain(p, f);
            const hors = p.profil[f].horsStyle === 'au-dessus';
            return <span key={f} data-bandeau={f} style={{ color: hors ? ACC : COULEURS[f].texte }}><Picto famille={f} taille={16} />{g.v == null ? '?' : fmt(p, g.v)}</span>;
          })}
          <span className={trop(p) ? 'pq-dry-trop' : undefined} data-role="ibu-dry" data-valeur={p.ibu.toFixed(2)} {...(p.cru ? { 'data-cru': '' } : {})}
            title={p.cru ? `à cru : l’IBU d’${h.nom} n’est pas modélisée (${nombre(ibuBase)} IBU sans lui)` : undefined}>
            <small>IBU</small>{ibuTexte(p)}
          </span>
        </div>
        {graphe}
        {/* Son choix D du 26.10 (m5) : trois mini graphes dans l'espace vide sous la bande IBU, au dry hop seulement (actif, après) ; aux
            moments chauds rien n'y est dessiné, mais les 18 px du bas de la zone sont réservés : le rail, que son doigt glisse, ne bouge pas
            d'une étape à l'autre (D149 ; tests/integration/controle-froid-dryhopper.mjs). */}
        {p.seg >= 2 ? <FroidDryhopper recette={recette} ajout={ajout} ibuBase={ibuBase} biere={T.biere} /> : <div className="pq-dry-froid-reserve" data-role="froid-reserve" aria-hidden="true" />}
        <div className={`pq-dry-geste ${touche ? 'pq-dry-touche' : ''}`} data-role="frise" data-acquis="geste">
          <div ref={railRef} role="slider" tabIndex={0} data-role="reglage" data-etat="etat-dryh-rail etat-dryh-loupe" data-pas="5" aria-label="Moment de l’ajout"
            aria-valuemin={0} aria-valuemax={N} aria-valuenow={i} aria-valuetext={p.lib} className="pq-dry-rail"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setTouche(true); depuis(e.clientX); }}
            onPointerMove={(e) => { if (touche) depuis(e.clientX); }}
            onPointerUp={lacher} onPointerCancel={lacher} onLostPointerCapture={lacher}
            onKeyDown={(e) => {
              const n = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? N : null;
              if (n == null) return;
              e.preventDefault();
              poser(Math.max(0, Math.min(N, n)));
            }}>
            {BORNES_SEG.map(([a, z], s) => <span key={s} className={`pq-dry-zone pq-dry-zone-${s}`} style={{ left: `${a}%`, width: `${z - a}%` }} />)}
            {points.map((q) => (q.interp ? null : <i key={q.k} className="pq-dry-calc" style={{ left: `${x[q.k]}%` }} />))}
            {/* D47 : pendant le geste, les seuls crans de l'étape sous le doigt. */}
            {touche && points.filter((q) => q.seg === p.seg).map((q) => <i key={`c${q.k}`} className="pq-dry-cran" style={{ left: `${x[q.k]}%` }} />)}
            <span className="pq-dry-pouce" style={{ left: `${doigt ?? x[i]}%` }}>
              <span className="pq-dry-pl" style={{ transform: x[i] < 12 ? 'translateX(-14px)' : x[i] > 88 ? 'translateX(calc(-100% + 14px))' : undefined }}>
                <i className="pq-dry-pt" style={{ background: couleurHoublon(h.cle) }} />{p.court}
              </span>
            </span>
          </div>
          {touche && (
            <div className="pq-dry-loupe" aria-hidden="true" data-role="loupe">
              {fenetre.map((q) => {
                const g = gain(q, principale).v;
                const prec = q.k > 0 ? points[q.k - 1] : null;
                const sansGain = q.seg >= 2 && !!prec && prec.seg === q.seg && Math.abs((g ?? 0) - (gain(prec, principale).v ?? 0)) < 0.1;
                return (
                  <span key={q.k} data-cran={q.k} className={`${q.k === i ? 'pq-dry-ici' : ''} ${q.interp ? 'pq-dry-lip' : ''}`}
                    style={{ left: `calc(50% + ${(q.k - centreLoupe) * PAS_LOUPE}px)` }}>
                    <em>{q.court}</em>
                    <i><b style={{ width: `${Math.min(100, ((g ?? 0) / 25) * 100).toFixed(0)}%` }} /></i>
                    <small className={sansGain ? 'pq-dry-sg' : undefined}>{sansGain ? 'sans gain' : fmt(q, g)}</small>
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <div className="pq-dry-jr" role="group" aria-label="Jours de contact">
          {JOURS.map((j, n) => {
            const k = kJour(j), on = k >= 0;
            const prec = on && n > 0 ? points[kJour(JOURS[n - 1])] : null;
            const sansGain = on && !!prec && Math.abs((gain(points[k], principale).v ?? 0) - (gain(prec, principale).v ?? 0)) < 0.1;
            return (
              <button key={j} type="button" data-jour={j} data-etat={j === 1 || j === 7 ? `etat-dryh-jour-${j}` : undefined} aria-pressed={on && p.q.type === 'dryhop' && p.q.jours === j} aria-disabled={!on}
                className={sansGain ? 'pq-dry-sg' : undefined} onClick={() => { if (on) poser(k); }}>{j} j</button>
            );
          })}
        </div>
      </section>
      <section className="pq-dry-bloc pq-dry-bars" data-etat="etat-dryh-barres etat-dryh-avant-inconnu" aria-label="Les 12 familles d’arômes au style, à ce moment">
        {sc.order.map(barre)}
      </section>
      {fiche.feuille}
      </div>
    </CadreOutil>
  );
}
