// Dryhopper, son choix D du 26.10 (page m5, « La meilleure D · trois mini graphes ») : sous la bande IBU, côté ébullition, l'espace
// qu'il a barré (« Amertume, hop creep ? Résineux ? ») porte trois mini graphes : la plage d'amertume au dry hop autour de l'IBU à
// chaud, la jauge du hop creep, les familles près de leur limite. Chacun s'ouvre au toucher sous la zone (la feuille repousse le rail)
// et se referme au second toucher. Le dessin est celui de m5/capturer.mjs, variante D, avec les corrections du critique ; les valeurs
// sont celles de froid.ts (voie x1) par ./froidVue.ts. Seulement au dry hop (actif, après) : aux moments chauds l'écran reste A.
// Classes propres préfixées pq-dry-froid- (L26) ; la CSS : ./froid.css.
import { useMemo, useState, type ReactNode } from 'react';
import { bitternessScience } from '../../../domain/hopBitterness';
import { donnees } from '../parcours/adaptateur';
import type { AjoutParcours, RecetteParcours } from '../parcours/types';
import { COULEURS, COURT, Picto } from './commun';
import { useConnaissances } from './hote';
import { froidVueCachee, type VueAmer, type VueCreep, type VueFroid, type VueLimite } from './froidVue';
import './froid.css';

const ACC = '#c2410c';
const INK = 'rgb(var(--cave-50))';
const fr1 = (x: number) => x.toFixed(1).split('.').join(',');
const sg1 = (x: number) => (x < 0 ? '−' : '+') + fr1(Math.abs(x));
const fr0 = (x: number) => String(Math.round(x));

type Cle = 'amer' | 'creep' | 'limite';

/** La plage d'amertume en écart à l'IBU à chaud (0 au milieu) : les essais de la variété en plein, l'enveloppe des essais en hachuré.
 * `grand` : la feuille (légendes et nombres à une décimale) ; sinon la cellule (trois nombres entiers). */
function Plage({ vue, w, h, grand }: { vue: VueAmer; w: number; h: number; grand: boolean }) {
  const chaud = vue.chaud!, [t0, t1] = vue.tous!;
  const d0 = t0 - chaud, d1 = t1 - chaud;
  const dv = vue.variete ? ([vue.variete.plage[0] - chaud, vue.variete.plage[1] - chaud] as const) : null;
  const m = Math.max(6.5, Math.abs(d0), Math.abs(d1));
  const cx = w / 2, k = (w / 2 - 2) / m, X = (d: number) => cx + d * k;
  const y = grand ? 18 : 4;
  const motif = `pq-dry-froid-h-${w}`;
  const txt = { fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontWeight: 700 as const, fontSize: 12 };
  const nb = (v: number) => (grand ? fr1(v) : fr0(v));
  const finProche = (x: number) => Math.abs(x - cx) < (grand ? 20 : 14);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" data-froid-plage={grand ? 'grand' : 'mini'}>
      <defs><pattern id={motif} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.6" height="4" fill="#8a8f9c" /></pattern></defs>
      <rect data-froid-bande="tous" x={X(d0)} y={y} width={Math.max(1, X(d1) - X(d0))} height="6" rx="1.5" fill={`url(#${motif})`} stroke="#aeb4c1" strokeWidth=".8" />
      {dv && <rect data-froid-bande="variete" x={X(dv[0])} y={y} width={Math.max(1, X(dv[1]) - X(dv[0]))} height="6" rx="1.5" fill="#5f6573" />}
      <line data-froid-trait="chaud" x1={cx} x2={cx} y1={y - 3} y2={y + 9} stroke={INK} strokeWidth="2" />
      <text x={X(d0)} y={h - 1} textAnchor="start" fill="#5f6573" style={txt}>{nb(t0)}</text>
      {dv && grand && <text x={X(dv[1])} y={h - 1} textAnchor="middle" fill="#5f6573" style={txt}>{nb(vue.variete!.plage[1])}</text>}
      <text x={cx} y={h - 1} textAnchor="middle" fill={INK} style={txt}>{nb(chaud)}</text>
      {!finProche(X(d1)) && <text x={X(d1)} y={h - 1} textAnchor="end" fill="#8a8f9c" style={txt}>{nb(t1)}</text>}
      {grand && (
        <>
          <text x={dv ? (X(dv[0]) + X(dv[1])) / 2 : (X(d0) + X(d1)) / 2} y="12" textAnchor="middle" fontSize="12" fill={INK} fontFamily="system-ui, sans-serif">
            {vue.variete ? `essais ${vue.variete.nom}` : `essais ${vue.autres.join(' et ')}`}
          </text>
          {dv && vue.autres.length > 0 && (
            <text x={(Math.max(cx, X(dv[1])) + X(d1)) / 2} y="12" textAnchor="middle" fontSize="12" fill="#8a8f9c" fontFamily="system-ui, sans-serif">avec {vue.autres.join(' et ')}</text>
          )}
        </>
      )}
    </svg>
  );
}

/** La jauge du hop creep : 3 crans croissants, ceux du niveau allumés. */
function Jauge({ crans, w = 40, h = 12 }: { crans: number; w?: number; h?: number }) {
  return (
    <svg width={w} height={h} aria-hidden="true" data-froid-jauge={crans}>
      {[0, 1, 2].map((n) => <rect key={n} x={n * 13} y={8 - n * 3} width="11" height={4 + n * 3} rx="1.5" style={{ fill: n < crans ? INK : '#d5d8df' }} />)}
    </svg>
  );
}

/** Les colonnes de limite : chacune rapportée à sa borne, sous une même ligne en pointillés ; ce qui dépasse en orange, avec une flèche. */
function Colonnes({ vue }: { vue: VueLimite }) {
  const H = 26, W = 52;
  const cols = vue.lignes.slice(0, 4);
  return (
    <svg width={W} height={H} aria-hidden="true" data-froid-colonnes={cols.length}>
      <line x1="0" x2={W} y1="8" y2="8" stroke={INK} strokeWidth="1.2" strokeDasharray="2 2" />
      {cols.map((l, n) => {
        const r = l.borne > 0 ? l.valeur / l.borne : 1.15, hh = Math.min(1.15, r) * (H - 8), x = 2 + n * 13, y = H - hh;
        return (
          <g key={l.famille} data-froid-colonne={l.famille}>
            <rect x={x} y={y} width="8" height={hh} rx="1.5" fill={l.depasse ? ACC : COULEURS[l.famille].base} />
            {r > 1.15 && <path d={`M${x} ${y + 1} l4 -4 l4 4 z`} fill={ACC} />}
          </g>
        );
      })}
    </svg>
  );
}

const ariaAmer = (a: VueAmer) => (a.calcule
  ? `Amertume au dry hop : de ${fr1(a.tous![0])} à ${fr1(a.tous![1])} pour ${fr1(a.chaud!)} à chaud${a.signe === '?' ? ', signe non établi' : a.signe === '−' ? ', en baisse' : ', en hausse'}`
  : 'Amertume au dry hop : non calculée');

function FeuilleAmer({ a }: { a: VueAmer }) {
  const v = a.variete;
  return (
    <>
      <h4>Amertume au dry hop <small>équivalent d’amertume, pas un IBU mesuré</small></h4>
      {a.calcule ? (
        <>
          <Plage vue={a} w={330} h={42} grand />
          <p>
            {a.signe === '?' ? <b>Signe non établi</b> : <b>{a.signe === '−' ? 'Baisse' : 'Hausse'} sur les {a.essais} essais</b>}
            {' : '}
            {v && a.deltaVariete ? <>{v.nom} seul {sg1(a.deltaVariete[0])} à {sg1(a.deltaVariete[1])}{a.autres.length ? <> ; avec {a.autres.join(' et ')} jusqu’à {sg1(a.delta![1])}</> : null}.</> : <>de {sg1(a.delta![0])} à {sg1(a.delta![1])} sur les {a.essais} essais.</>}
          </p>
          <p className="pq-dry-froid-src">{a.source} · {a.essais} essais, 16 °C, 1 à 5 j · mg/L éq. iso-α{a.ecartBandeau ? ' · à chaud : α du catalogue' : ''}{a.horsEssais.map((r) => ` · ${r.replace(/\.$/, '').toLowerCase()}`).join('')}</p>
        </>
      ) : (
        <p><b>?</b> {a.raisons.join(' ')}</p>
      )}
    </>
  );
}

function FeuilleCreep({ c }: { c: VueCreep }) {
  return (
    <>
      <h4>Hop creep <b>{c.risque}</b> <span className="pq-dry-froid-jauge" aria-hidden="true" data-froid-jauge-feuille={c.crans}>{[0, 1, 2].map((n) => <i key={n} className={n < c.crans ? 'pq-dry-froid-on' : undefined} />)}</span></h4>
      {c.pourquoi && <p>{c.pourquoi}</p>}
      {c.effets.length > 0 && <p>Effets : {c.effets.join(', ')}.</p>}
      <p>Publié : {c.publie ? <b>{sg1(c.publie[0])} à {sg1(c.publie[1])} % vol.</b> : <b>?</b>} à 10 g/L · ce brassin : <b>?</b></p>
      <p className="pq-dry-froid-src">Niveau {c.points ?? '?'}/6 : une convention, pas une mesure{c.inconnus.length ? ` · Inconnus : ${c.inconnus.join(', ')}` : ''}{c.sources.length ? ` · ${c.sources.join(', ')}` : ''}</p>
    </>
  );
}

function FeuilleLimite({ l, biere, style }: { l: VueLimite; biere: string; style: string }) {
  const groupes = (['indésirable', 'neutre'] as const).map((s) => ({ s, lignes: l.lignes.filter((x) => x.statut === s) })).filter((g) => g.lignes.length);
  return (
    <>
      <h4>Près de la limite <small>{biere} {style}</small></h4>
      {l.lignes.map((x) => {
        const ech = Math.max(x.borne * 1.15, x.valeur * 1.05) || 1;
        return (
          <div key={x.famille} className="pq-dry-froid-lim" data-froid-ligne={x.famille}>
            <Picto famille={x.famille} taille={15} nomme={false} />
            <span>{COURT[x.famille]}</span>
            <i><b style={{ width: `${(x.valeur / ech) * 100}%`, background: x.depasse ? ACC : COULEURS[x.famille].base }} /><u style={{ left: `${(x.borne / ech) * 100}%` }} /></i>
            <span className={`pq-dry-froid-mono ${x.depasse ? 'pq-dry-froid-acc' : ''}`}>{fr1(x.valeur)} / {fr0(x.borne)}</span>
          </div>
        );
      })}
      {l.statut !== 'évalué' && <p>{l.raisons.join(' ')}</p>}
      {l.statut === 'évalué' && !l.lignes.length && <p>Aucune famille que le style n’attend n’approche sa borne.</p>}
      <p className="pq-dry-froid-src">
        {groupes.map((g) => `${g.lignes.map((x) => COURT[x.famille]).join(', ')} : ${g.s === 'indésirable' ? 'indésirables' : 'neutres'} (${g.lignes[0].bande ? `${g.lignes[0].bande[0]}–${g.lignes[0].bande[1]}` : `borne ${g.lignes[0].borne}`})`).join(' · ')}
        {l.lignes.some((x) => x.verdict === 'incertain') ? `${groupes.length ? ' · ' : ''}plages larges, incertain` : ''}
        {l.lignes.length ? ' · ' : ''}simulé, pas une mesure
      </p>
    </>
  );
}

export interface FroidDryhopperProps {
  /** Le brouillon (l'ajout y est compris) et l'ajout à froid tenu. */
  recette: RecetteParcours;
  ajout: AjoutParcours;
  /** L'IBU à chaud du bandeau (α du lot), pour dire quand froid.ts (α du catalogue) en diffère. */
  ibuBase: number | null;
  biere: string;
}

export default function FroidDryhopper({ recette, ajout, ibuBase, biere }: FroidDryhopperProps) {
  const [ouvert, setOuvert] = useState<Cle | null>(null);
  const connaissances = useConnaissances();
  const science = useMemo(() => (connaissances ? { science: bitternessScience(connaissances) } : {}), [connaissances]);
  const vue: VueFroid = froidVueCachee(recette, ajout, { ...science, degustation: donnees().degustation?.tasting ?? null, ibuBandeau: ibuBase });
  const { amer, creep, limite } = vue;
  const bascule = (c: Cle) => setOuvert((o) => (o === c ? null : c));
  const cel = (c: Cle, aria: string, enfants: ReactNode) => (
    <button type="button" className={`pq-dry-froid-cel ${ouvert === c ? 'pq-dry-froid-cel-on' : ''}`} data-froid={c} {...(c === 'creep' && creep.points != null ? { 'data-points': creep.points } : {})} aria-expanded={ouvert === c} aria-label={aria} onClick={() => bascule(c)}>{enfants}</button>
  );
  return (
    <>
      <div className="pq-dry-froid-z" data-role="froid" data-etat="etat-dryh-froid">
        <div className="pq-dry-froid-d">
          {cel('amer', ariaAmer(amer), <>
            <span>amer <b className="pq-dry-froid-mono pq-dry-froid-gris">{amer.signe}</b></span>
            {amer.calcule ? <Plage vue={amer} w={70} h={26} grand={false} /> : <span className="pq-dry-froid-vide" data-nature="inconnu" title={amer.raisons.join(' ')}>?</span>}
          </>)}
          {cel('creep', creep.risque ? `Hop creep : risque ${creep.risque}` : 'Hop creep : sans objet', <>
            <span>creep</span>
            <Jauge crans={creep.crans} />
            <b className="pq-dry-froid-mono" style={{ marginTop: 2 }}>{creep.risque ?? '?'}</b>
          </>)}
          {cel('limite', `Familles près de leur limite : ${limite.lignes.length ? limite.lignes.map((x) => `${COURT[x.famille]} ${fr1(x.valeur)} sur ${fr0(x.borne)}`).join(', ') : 'aucune'}`, <>
            <span>limite</span>
            <Colonnes vue={limite} />
            <span className="pq-dry-froid-pics">
              {limite.lignes.slice(0, 4).map((x) => <span key={x.famille} className="pq-dry-froid-pic"><Picto famille={x.famille} taille={12} nomme={false} /></span>)}
              {limite.statut !== 'évalué' && <span className="pq-dry-froid-mono pq-dry-froid-gris" title={limite.raisons.join(' ')}>?</span>}
              {limite.statut === 'évalué' && !limite.lignes.length && <span className="pq-dry-froid-gris">aucune</span>}
            </span>
          </>)}
        </div>
      </div>
      {ouvert && (
        <div className="pq-dry-froid-feuille" data-froid-feuille={ouvert} role="region" aria-label={ouvert === 'amer' ? 'Amertume au dry hop' : ouvert === 'creep' ? 'Hop creep' : 'Familles près de leur limite'}>
          {ouvert === 'amer' && <FeuilleAmer a={amer} />}
          {ouvert === 'creep' && <FeuilleCreep c={creep} />}
          {ouvert === 'limite' && <FeuilleLimite l={limite} biere={biere} style={recette.styleCode} />}
        </div>
      )}
    </>
  );
}
