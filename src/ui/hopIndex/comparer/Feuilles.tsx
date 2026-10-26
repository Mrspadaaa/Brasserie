// Le dock de r6n2 (« r6n2 donne vraiment bien », 23.10 ; « r6n2 : le premier écran de r6a, le reste à un toucher sous
// un dock ») : six touchers sous le pouce, Défi · Égaler · Valeurs · Preuve · Frise · Souche, chacun ouvre UNE feuille
// basse au-dessus du dock, qui reste là (un second toucher, la croix, le voile ou Échap referment ; un autre toucher
// du dock change de feuille). Et les feuilles du « + » (la carte du houblon avant de l'ajouter, L14) et de
// « pourquoi ? ». Tout est lu dans le moteur à l'instant (calcul.ts) ; les vraies valeurs dans valeurs.ts.
import { Input } from '../../Input';
import { CompositionVue } from './Huiles';
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { COULEURS, COURT, Picto, nombre, plage } from './commun';
import { CONDITIONS, H, nomLevure } from './cas';
import { useRecette } from './hote';
import { termes } from './hote';
import { famillesDeLaDemande, useDemande, type DemandeEcran } from './demande';
import { placer, quandDe } from '../parcours/quand';
import { donnees, houblon, ibuAjout, lireBiere, style } from '../parcours/adaptateur';
import type { FamilyId } from '../../../domain/hopIndex/v4';
import { hopRef } from '../parcours/v4';
import {
  ETAPES, ORANGE, biotransformation, couleurHoublon, egaler, enActif, jourApresJour, scoreDefi, souche, tirer, verdict,
  type ColonneLue, type Critere, type Etapes, type Verdict,
} from './calcul';
import {
  IconeAmpoule, IconeAucune, IconeApproche, IconeCroix, IconeEchanger, IconeFleche, IconeGoutte, IconeLivre, IconeOk, IconePanel,
  IconePanier, IconeRisque, IconeSigma, IconeSimule, IconeStock, IconeTirer,
} from './icones';
import { useComplements } from '../fiche/complements-ui';
import { CHIMIE, acides, compose, huile, linalolEnBiere, panelOSU, titreRef, type ValeurReelle } from './valeurs';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export const signeCran = (x: number) => `~${x >= 0 ? '+' : '−'}${nombre(Math.abs(x), 1)}`;
const pc = (x: number) => `${(Math.max(0, Math.min(1, x)) * 100).toFixed(1)}%`;
export const Point = ({ c, couleur }: { c?: ColonneLue; couleur?: string }) => <i className="pq-comparer-pt" style={{ background: couleur ?? c?.couleur }} aria-hidden="true" />;
const Simule = () => <span className="pq-comparer-puce pq-comparer-puce-p" data-nature="simule"><IconeSimule />~ simulé</span>;
const Calcule = () => <span className="pq-comparer-puce pq-comparer-puce-p"><IconeSigma />calculé</span>;

// ---------- la feuille basse, au-dessus du dock ----------
/** La feuille de r6n2 : sous l'en-tête, au-dessus du dock (qui reste touchable), voile sur l'écran. Pas le Sheet de
 * l'app (vaul, modal) : il couvrirait le dock et empêcherait de passer d'une feuille à l'autre. */
export function FeuilleDock({ titre, onFermer, children, id, role = 'feuille' }: { titre: string; onFermer: () => void; children: ReactNode; id?: string; role?: string }) {
  const [bas, setBas] = useState(0);
  const idTitre = useId();
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const mesurer = () => {
      const d = document.querySelector('.pq-outil-comparer [data-role="dock"]');
      setBas(d ? Math.max(0, window.innerHeight - d.getBoundingClientRect().top) : 0);
    };
    mesurer();
    window.addEventListener('resize', mesurer);
    return () => window.removeEventListener('resize', mesurer);
  }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onFermer(); } };
    document.addEventListener('keydown', k, true);
    ref.current?.focus({ preventScroll: true });
    return () => document.removeEventListener('keydown', k, true);
  }, [onFermer]);
  return createPortal(
    <div className="pq-comparer-fd-racine">
      <div className="pq-comparer-fd-voile" style={{ bottom: bas }} onClick={onFermer} aria-hidden="true" />
      <section ref={ref} tabIndex={-1} role="dialog" aria-modal="false" aria-labelledby={idTitre} className="pq-comparer-fd" style={{ bottom: bas }}
        data-role={role} {...(id ? { id } : {})}>
        <header className="pq-comparer-fd-h">
          <h2 id={idTitre}>{titre}</h2>
          <button type="button" className="pq-comparer-fd-x" data-role="retour" aria-label={`Fermer ${titre.toLowerCase()}`} onClick={onFermer}><IconeCroix /></button>
        </header>
        <div className="pq-comparer-fd-c">{children}</div>
      </section>
    </div>,
    document.body,
  );
}

// ---------- Défi (y1b, r6n2) ----------
const MOTS: Record<Verdict, string> = { atteint: 'Atteint', approche: 'Approche', aucune: 'Aucune', inconnu: 'inconnu' };
const IconeVerdict = ({ v }: { v: Verdict }) => (v === 'atteint' ? <IconeOk /> : v === 'approche' ? <IconeApproche /> : v === 'aucune' ? <IconeAucune /> : <span>?</span>);
/** Initiales distinctes des houblons (I, C, G ; « Ci » si Citra suit Cascade). */
function initiales(cols: ColonneLue[]): Record<string, string> {
  const out: Record<string, string> = {}, pris = new Set<string>();
  for (const c of cols) {
    let n = 1, i = c.houblon.nom.slice(0, 1).toUpperCase();
    while (pris.has(i) && n < c.houblon.nom.length) i = c.houblon.nom.slice(0, ++n).replace(/\s/g, '');
    pris.add(i); out[c.cle] = i;
  }
  return out;
}
function PisteDefi({ cols, f, visee, retenu, ini }: { cols: ColonneLue[]; f: FamilyId; visee: number; retenu: string; ini: Record<string, string> }) {
  const ds = cols.map((c) => c.cellules[f].dCran).filter((d): d is number => d != null);
  const lo = Math.min(-0.4, visee - 0.5, ...ds.map((d) => d - 0.3)), hi = Math.max(0.6, visee + 0.8, ...ds.map((d) => d + 0.4));
  const x = (v: number) => (v - lo) / (hi - lo);
  const sel = cols.find((c) => c.cle === retenu);
  const dSel = sel?.cellules[f].dCran ?? null;
  const mauvais = dSel != null && Math.sign(dSel) !== Math.sign(visee);
  // Les ronds lettrés : empilés quand ils se touchent (moins de 7 % de piste).
  const places = [...cols].filter((c) => c.cellules[f].dCran != null).sort((a, b) => (a.cellules[f].dCran ?? 0) - (b.cellules[f].dCran ?? 0));
  const etage: Record<string, number> = {};
  places.forEach((c, i) => { const p = places[i - 1]; etage[c.cle] = p && x(c.cellules[f].dCran!) - x(p.cellules[f].dCran!) < 0.07 ? etage[p.cle] + 1 : 0; });
  return (
    <div className="pq-comparer-dp" aria-hidden="true">
      <span className="pq-comparer-dp-t" style={{ background: COULEURS[f].fond }} />
      {dSel != null && <span className="pq-comparer-dp-b" style={{ left: pc(Math.min(x(0), x(dSel))), width: pc(Math.abs(x(dSel) - x(0))), background: mauvais ? ORANGE : COULEURS[f].base }} />}
      <span className="pq-comparer-dp-s" style={{ left: pc(x(0)) }} />
      <span className="pq-comparer-dp-v" style={{ left: pc(x(visee)) }}><span>visée</span></span>
      {places.map((c) => (
        <span key={c.cle} className={cx('pq-comparer-dp-r', c.cle === retenu && 'pq-comparer-dp-r-sel')} style={{ left: pc(x(c.cellules[f].dCran!)), top: `${4 + etage[c.cle] * 14}px`, background: c.couleur }}>{ini[c.cle]}</span>
      ))}
    </div>
  );
}
export function FeuilleDefi({ cols, retenu, etapes, onSuggerer, demande }: { cols: ColonneLue[]; retenu: string; etapes: Etapes; onSuggerer: () => void; demande: DemandeEcran }) {
  const recette = useRecette();
  const ini = initiales(cols);
  // Les objectifs sont ceux de sa visée ou de sa dégustation ; sans l'une ni l'autre il n'y en a pas (le style n'est pas un objectif).
  const objectifs = Object.entries(demande.visees) as [FamilyId, number][];
  const noms = (l: FamilyId[]) => l.map((f) => COURT[f].toLowerCase()).join(', ');
  const biere = lireBiere(recette);
  const chauds = recette.additions.filter((a) => { const q = quandDe(a, recette); return q.type === 'ebullition' || q.type === 'premierMout'; });
  const dose10 = (cle: string) => { const i = etapes[cle]?.b10?.ibu?.valeur; return i ? (10 * CONDITIONS.doseGL) / i : null; };
  const doses = cols.map((c) => dose10(c.cle));
  const maxDose = Math.max(...doses.filter((d): d is number => d != null), 0.01);
  const atteints = (f: FamilyId, v: number) => cols.filter((c) => verdict(c.cellules[f].dCran, v) === 'atteint');
  return (
    <div className="pq-comparer-defi" data-element="y1b-defi w2-piste-commune l5b-pistes-objectif l8b-verdicts-pictos-trait y1b-jauge-amertume s5-deux-objectifs">
      <p className="pq-comparer-defi-q" data-demande={demande.origine}>{!demande.voulue
        ? <>Rien n’est visé : ni visée posée, ni dégustation<span>{demande.mot}{demande.plus.length ? ` : ${noms(demande.plus)}` : ''}</span></>
        : <>{[demande.plus.length ? `plus de ${noms(demande.plus)}` : '', demande.moins.length ? `${demande.origine === 'degustation' ? 'trop de' : 'moins de'} ${noms(demande.moins)}` : ''].filter(Boolean).join(', ')}
            <span>{demande.mot}{demande.origine === 'degustation' && termes().degustation ? ` du ${termes().degustation}` : ''}</span></>}</p>
      <div className="pq-comparer-defi-sc">
        {cols.map((c) => { const s = scoreDefi(c, demande.visees); return (
          <span key={c.cle} className={cx('pq-comparer-defi-sc-c', c.cle === retenu && 'pq-comparer-sel')} style={{ ['--pq-h' as string]: c.couleur }}>
            <span>{c.houblon.nom}</span><b className="pq-comparer-nb">{s.points} sur {s.sur}</b>
          </span>
        ); })}
      </div>
      {objectifs.map(([f, v]) => (
        <section key={f} className="pq-comparer-carte" data-objectif={f}>
          <p className="pq-comparer-carte-t" style={{ color: COULEURS[f].texte }}>
            <span aria-hidden="true">{v > 0 ? '↑' : '↓'}</span><Picto famille={f} /><b>{v > 0 ? 'Plus' : 'Moins'} {COURT[f].toLowerCase()}</b>
            <span className="pq-comparer-carte-n">visée {v > 0 ? '+' : '−'}{nombre(Math.abs(v))} cran{v < 0 ? ', absolu' : ''}</span>
          </p>
          <PisteDefi cols={cols} f={f} visee={v} retenu={retenu} ini={ini} />
          <div className="pq-comparer-defi-v" style={{ ['--pq-n' as string]: cols.length }}>
            {cols.map((c) => { const d = c.cellules[f].dCran, w = verdict(d, v); return (
              <span key={c.cle} className={`pq-comparer-defi-w pq-comparer-defi-w-${w}`}>
                <span className="pq-comparer-defi-wm"><IconeVerdict v={w} /><Point c={c} /><b>{MOTS[w]}</b></span>
                <span className="pq-comparer-nb" data-nature="simule">{d == null ? '?' : signeCran(d)}</span>
              </span>
            ); })}
          </div>
          {v < 0 && cols.every((c) => (c.cellules[f].dCran ?? 0) > 0) && (
            <p className="pq-comparer-note">Les {cols.length === 3 ? 'trois' : cols.length} en ajoutent : le {COURT[f].toLowerCase()} se règle hors houblon ({chauds.map((a) => hopRef(a.hopKey)?.name ?? a.hopKey).join(', ') || 'recette'}, levure, garde).</p>
          )}
        </section>
      ))}
      <section className="pq-comparer-carte" data-element="y1b-jauge-amertume">
        <p className="pq-comparer-carte-t"><IconeGoutte /><b>Amertume tenue</b><span className="pq-comparer-carte-n"><i className="pq-comparer-hach" aria-hidden="true" /> à cru : inconnu</span></p>
        <div className="pq-comparer-amer">
          {chauds.map((a) => { const q = quandDe(a, recette); const i = biere.ibuParAjout[a.id]?.ibu; return (
            <span key={a.id} className="pq-comparer-amer-b" title={i ? `calculé, ${nombre(i.min)}–${nombre(i.max)} IBU par la plage d’α` : undefined}>
              {hopRef(a.hopKey)?.name ?? a.hopKey} {q.type === 'ebullition' ? `${q.minutes}′` : 'premier moût'} · {nombre(a.grams)} g{i ? ` · ${nombre(i.valeur)} IBU` : ''}
            </span>
          ); })}
          <span className="pq-comparer-amer-x"><i className="pq-comparer-hach" aria-hidden="true" />+ ?</span>
        </div>
        <p className="pq-comparer-note">{chauds.map((a) => hopRef(a.hopKey)?.name).join(', ')} à chaud fait l’amertume. À cru, l’apport des {cols.length === 3 ? 'trois' : cols.length} n’est pas modélisé : écrit ?, jamais compté 0.</p>
        <p className="pq-comparer-carte-st"><b>Même amertume en ébullition</b><Calcule /></p>
        <p className="pq-comparer-note">pour 10 IBU à 10′, {nombre(recette.volumeL)} L : plus l’α est haut, moins il en faut.</p>
        {cols.map((c, i) => (
          <p key={c.cle} className="pq-comparer-dose-l">
            <span><Point c={c} />{c.houblon.nom}</span>
            <span className="pq-comparer-dose-b">{doses[i] != null && <i style={{ width: pc(doses[i]! / maxDose), background: c.couleur }} />}</span>
            <span className="pq-comparer-nb">{doses[i] != null ? `${nombre(doses[i]!, 2)} g/L` : '?'}</span>
          </p>
        ))}
      </section>
      <section className="pq-comparer-carte">
        <p className="pq-comparer-carte-t"><Picto famille="floral" taille={14} /><b>Dans ta {termes().style}</b><span className="pq-comparer-carte-n">~ simulé</span></p>
        <div className="pq-comparer-defi-v" style={{ ['--pq-n' as string]: cols.length }}>
          {cols.map((c) => (
            <span key={c.cle} className={cx('pq-comparer-defi-wm', c.sorties.length ? 'pq-comparer-defi-w-aucune' : 'pq-comparer-defi-w-atteint')}
              aria-label={`${c.houblon.nom} : ${c.sorties.length ? `sort de ta ${termes().style} (${c.sorties.map((f) => COURT[f].toLowerCase()).join(', ')})` : `reste dans ta ${termes().style}`}`}>
              {c.sorties.length ? <IconeRisque /> : <IconeOk />}<Point c={c} /><b>{c.sorties.length ? 'sort' : 'dedans'}</b>{c.sorties.map((f) => <Picto key={f} famille={f} taille={12} />)}
            </span>
          ))}
        </div>
      </section>
      <div className="pq-comparer-defi-2">
        {objectifs.map(([f, v]) => { const a = atteints(f, v); return (
          <span key={f} className="pq-comparer-carte pq-comparer-defi-2c">
            <Picto famille={f} taille={14} /><span className="pq-comparer-note">{v > 0 ? 'Plus' : 'Moins'} {COURT[f].toLowerCase()}</span>
            <b>{a.length ? <><IconeOk taille={14} /> {a.map((c) => c.houblon.nom).join(', ')}</> : <><IconeAucune taille={14} /> Aucune <span className="pq-comparer-note">voie houblon</span></>}</b>
          </span>
        ); })}
      </div>
      <button type="button" className="pq-comparer-pont-l" data-role="pont-suggerer" onClick={onSuggerer}>
        <IconeAmpoule /><span>Toutes les voies pour tes deux objectifs : <b>Suggérer</b></span><IconeFleche />
      </button>
    </div>
  );
}

// ---------- Égaler (y3, r6n2) ----------
// D40 point 5 (r6n2, retenu avec r6a) : par famille, la dose d'un autre houblon pour le même effet, avec sa barre : la famille du
// critère pour le houblon retenu, puis la signature de chaque autre houblon (sa famille qui monte le plus) ; « ~jamais » quand
// le moteur plafonne. Puis la même amertume, à 10′ et au whirlpool.
const DOSE_MAX = 8;
export function FeuilleEgaler({ cols, sel, critere, etapes }: { cols: ColonneLue[]; sel: ColonneLue; critere: Critere; etapes: Etapes }) {
  const recette = useRecette();
  const demande = useDemande(recette);
  const f0: FamilyId = critere.sens > 0 ? critere.famille : demande.plus[0] ?? style(recette.styleCode).order[0];
  const sections = useMemo(() => {
    const out: { ref: ColonneLue; famille: FamilyId; res: { cle: string; doseGL: number | null }[] }[] = [];
    const prises = new Set<FamilyId>();
    const poser = (ref: ColonneLue, famille: FamilyId) => {
      if (prises.has(famille) || ref.cellules[famille]?.dCran == null || (ref.cellules[famille].dCran ?? 0) <= 0) return;
      prises.add(famille);
      out.push({ ref, famille, res: egaler(recette, ref, cols.filter((c) => c.cle !== ref.cle), famille, DOSE_MAX) });
    };
    poser(sel, f0);
    // La signature de chaque houblon : sa famille la plus citée par ses fiches, celle qui monte le plus à égalité.
    for (const c of cols) {
      const part = (g: FamilyId) => { const x = c.houblon.familles[g]; return x.sur ? x.fiches / x.sur + (x.niveau === 'marqué' ? 1 : 0) : 0; };
      const sig = (Object.keys(c.cellules) as FamilyId[]).filter((g) => c.cellules[g].dCran != null && (c.cellules[g].dCran ?? 0) > 0 && c.houblon.familles[g].niveau !== 'non décrit')
        .sort((a, b) => part(b) - part(a) || (c.cellules[b].dCran ?? 0) - (c.cellules[a].dCran ?? 0))[0];
      if (sig) poser(c, sig);
    }
    return out;
  }, [recette, cols, sel, f0]);
  const pc = (g: number) => `${Math.min(100, (g / DOSE_MAX) * 100).toFixed(1)}%`;
  const ibu10 = (cle: string) => etapes[cle]?.b10?.ibu?.valeur ?? null;
  const ibuWp = (cle: string) => {
    const g = CONDITIONS.doseGL * recette.volumeL;
    const a = placer({ id: 'egaler-wp', hopKey: cle, grams: g, moment: 'b10' }, { type: 'whirlpool' }, recette);
    return ibuAjout(a, { ...recette, additions: [...recette.additions, a] }).ibu?.valeur ?? null;
  };
  const pour10 = (i: number | null) => (i ? `${nombre((10 * CONDITIONS.doseGL) / i, 2)} g/L` : '?');
  return (
    <div className="pq-comparer-eg" data-element="y3-pour-egaler">
      <p className="pq-comparer-eg-t">Pour égaler, à {nombre(CONDITIONS.doseGL)} g/L, il faudrait :</p>
      {sections.map(({ ref, famille, res }) => (
        <section key={ref.cle + famille} className="pq-comparer-eg-s" data-famille-egaler={famille} data-ref={ref.cle}>
          <p className="pq-comparer-eg-t">
            <Picto famille={famille} />les {COURT[famille].toLowerCase()} de <b>{ref.houblon.nom} {nombre(CONDITIONS.doseGL)} g/L</b>
            <span className="ml-auto" data-nature="simule">~{nombre(ref.cellules[famille].centre)} sur 100</span>
          </p>
          {cols.map((c) => {
            const estRef = c.cle === ref.cle;
            const r = estRef ? { doseGL: CONDITIONS.doseGL } : res.find((x) => x.cle === c.cle) ?? { doseGL: null };
            const jamais = r.doseGL == null;
            return (
              <p key={c.cle} className="pq-comparer-eg-l">
                <Point c={c} /><span className="pq-comparer-eg-n">{c.houblon.nom}</span>
                <span aria-hidden="true" className={`pq-comparer-eg-b ${jamais ? 'pq-hachure' : ''}`}>
                  {!jamais && <i style={{ width: pc(r.doseGL!), background: COULEURS[famille].base }} />}
                  <i className="pq-comparer-eg-trait" style={{ left: pc(CONDITIONS.doseGL) }} />
                </span>
                {jamais
                  ? <span className="pq-comparer-eg-jamais" data-nature="simule">~jamais, même à {DOSE_MAX} g/L</span>
                  : <span data-nature={estRef ? 'fixe' : 'simule'} className="pq-comparer-nb">{estRef ? `${nombre(r.doseGL!)} g/L · réf.` : `~${nombre(r.doseGL!, 1)} g/L`}</span>}
              </p>
            );
          })}
        </section>
      ))}
      <p className="pq-comparer-vsrc">~ simulé par le moteur ; trait : {nombre(CONDITIONS.doseGL)} g/L, ta dose égale ; échelle 0–{DOSE_MAX} g/L, au-delà, inconnu ; après fermentation, {CONDITIONS.jours} j, {nomLevure(recette.yeastId)}.</p>
      <p className="pq-comparer-carte-st"><b>la même amertume en ébullition</b><Calcule /></p>
      <p className="pq-comparer-eg-l pq-comparer-note"><span className="ml-auto" />10 IBU à 10′<span className="w-24 text-right">5 IBU au whirlpool</span></p>
      {cols.map((c) => (
        <p key={c.cle} className="pq-comparer-eg-l">
          <Point c={c} /><b>{c.houblon.nom}</b>
          <span className="pq-comparer-nb" data-nature="calcule">{pour10(ibu10(c.cle))}</span>
          <span className="pq-comparer-nb w-24 text-right" data-nature="calcule">{ibuWp(c.cle) ? `${nombre((5 * CONDITIONS.doseGL) / ibuWp(c.cle)!, 2)} g/L` : '?'}</span>
        </p>
      ))}
    </div>
  );
}

// ---------- Valeurs (v1, d1 rangé, p03, p06) ----------
const milieu = (v: ValeurReelle | null) => (v && v.hi != null && !/^[<>]/.test(v.texte) ? (v.lo + v.hi) / 2 : null);
/** « X en a plus | Y en a plus » (v1) : le retenu face à un autre, composé par composé ; ⇄ change celui d'en face. */
function EnAPlus({ cols, sel }: { cols: ColonneLue[]; sel: ColonneLue }) {
  const autres = cols.filter((c) => c.cle !== sel.cle);
  const [i, setI] = useState(0);
  const b = autres[i % Math.max(1, autres.length)];
  if (!b) return null;
  const lignes: { nom: string; famille?: FamilyId; a: ValeurReelle | null; b: ValeurReelle | null }[] = [
    ...CHIMIE.map((x) => ({ nom: x.nom.replace('­', ''), famille: x.famille, a: compose(sel.cle, x.cle), b: compose(b.cle, x.cle) })),
    { nom: 'huile totale', a: huile(sel.cle), b: huile(b.cle) },
  ];
  return (
    <section className="pq-comparer-carte pq-comparer-plus-c" data-element="v1-en-a-plus" aria-label={`${sel.houblon.nom} face à ${b.houblon.nom}, composé par composé`}>
      <p className="pq-comparer-plus-h">
        <span><Point c={sel} /><b>{sel.houblon.nom}</b> en a plus</span>
        {autres.length > 1 && <button type="button" className="pq-comparer-rond" aria-label={`Changer le houblon d’en face (${b.houblon.nom})`} onClick={() => setI((x) => x + 1)}><IconeEchanger /></button>}
        <span><b>{b.houblon.nom}</b> en a plus <Point c={b} /></span>
      </p>
      {lignes.map((l) => {
        const ma = milieu(l.a), mb = milieu(l.b);
        const r = ma != null && mb != null && ma > 0 && mb > 0 ? ma / mb : null;
        const pareil = r != null && r > 0.9 && r < 1.11;
        const k = r == null || pareil ? 0 : Math.min(1, Math.abs(Math.log10(r)));
        const gauche = r != null && r > 1;
        return (
          <p key={l.nom} className="pq-comparer-plus-l">
            <span className="pq-comparer-plus-n">{l.famille ? <Picto famille={l.famille} taille={14} /> : <IconeGoutte taille={14} />}{l.nom}</span>
            <span className="pq-comparer-plus-b">
              <i className="pq-comparer-plus-axe" />
              {k > 0 && <i style={{ [gauche ? 'right' : 'left']: '50%', width: `${(k * 50).toFixed(1)}%`, background: gauche ? sel.couleur : b.couleur }} />}
            </span>
            <span className="pq-comparer-nb pq-comparer-plus-r" data-nature="mesure">
              {r == null ? (l.a && l.b ? '? borne seule' : '? inconnu') : pareil ? '≈ pareil' : `${gauche ? sel.houblon.nom : b.houblon.nom} ×${nombre(gauche ? r : 1 / r, 1)}`}
            </span>
          </p>
        );
      })}
      <p className="pq-comparer-note">Milieu des plages publiées, rapport écrit ; barre pleine à ×10.</p>
    </section>
  );
}
function LigneValeurs({ cle, nom, unite, famille, icone, cols, cellules, note, quatre }: {
  cle?: string; nom: string; unite: string; famille?: FamilyId; icone?: ReactNode; cols: ColonneLue[]; cellules: (ValeurReelle | null)[]; note?: string; quatre: boolean;
}) {
  const mil = cellules.map((c) => (c ? (c.lo + (c.hi ?? c.lo * 1.6)) / 2 : null));
  const connus = mil.filter((x): x is number => x != null);
  const top = !note && connus.length >= 2 ? mil.indexOf(Math.max(...connus)) : -1;
  const mx = Math.max(...cellules.filter(Boolean).map((c) => Math.max(c!.hi ?? c!.lo * 1.6, c!.lot ?? 0)), 0) * 1.08 || 1;
  return (
    <div className="pq-comparer-grille-tab pq-comparer-vg" {...(cle ? { 'data-compose': cle } : {})}>
      <span className="pq-comparer-vn">{famille ? <Picto famille={famille} /> : icone}{!quatre && <span><b>{nom}</b><span className="pq-comparer-vu">{unite}</span></span>}</span>
      {cols.map((col, i) => {
        const v = cellules[i];
        if (!v) return <span key={col.cle} className="pq-comparer-vc pq-comparer-vc-inc"><i className="pq-comparer-hach" /><span className="pq-comparer-vi">inconnu</span></span>;
        const l = (v.lo / mx) * 100, r = ((v.hi ?? mx) / mx) * 100;
        const refs = v.refs.map((x) => `${x} ${titreRef(x)}`).join(' ; ');
        return (
          <span key={col.cle} className={cx('pq-comparer-vc', i === top && 'pq-comparer-vc-max', v.aConfirmer && 'pq-comparer-vc-verif')} style={{ ['--pq-h' as string]: col.couleur }}>
            <span className="pq-comparer-vv" data-nature="mesure" data-source={refs}>{v.texte}{!quatre && !unite.includes(' g') && <span className="pq-comparer-vu-in"> {unite.split(' ')[0]}</span>}</span>
            <span className="pq-comparer-vb"><i style={{ left: `${l.toFixed(1)}%`, width: `${Math.max(3, r - l).toFixed(1)}%` }} />{v.lot != null && <i className="pq-comparer-vlot" style={{ left: `${((v.lot / mx) * 100).toFixed(1)}%` }} aria-label={`ton lot ${nombre(v.lot, 1)} %`} />}</span>
            <span className="pq-comparer-vr">{v.refs.join(' ')}{v.aConfirmer ? ' · à confirmer' : ''}{v.note ? ` · ${v.note}` : ''}</span>
          </span>
        );
      })}
      {note && <p className="pq-comparer-vnote">{note}</p>}
    </div>
  );
}
/** « Ce que disent les fiches » (p06, r6n2) : par famille, marqué, cité ou non décrit, et combien de fiches. */
function Fiches({ cols, familles }: { cols: ColonneLue[]; familles: FamilyId[] }) {
  return (
    <section className="pq-comparer-fi" data-element="p06-grille-familles" aria-label="Ce que disent les fiches">
      <p className="pq-comparer-carte-st"><b>Ce que disent les fiches</b></p>
      <p className="pq-comparer-fi-leg"><i data-n="marqué" /> marqué <i data-n="cité" /> cité <i data-n="non décrit" /> non décrit</p>
      {familles.map((f) => (
        <div key={f} className="pq-comparer-grille-tab pq-comparer-fi-l">
          <span className="pq-comparer-rn" style={{ color: COULEURS[f].texte }}><Picto famille={f} taille={14} />{COURT[f]}</span>
          {cols.map((c) => { const d = c.houblon.familles[f]; return (
            <span key={c.cle} className="pq-comparer-fi-c" aria-label={`${c.houblon.nom}, ${COURT[f].toLowerCase()} : ${d.niveau}${d.fiches ? `, ${d.fiches} fiche(s) sur ${d.sur}` : ''}`}>
              <i data-n={d.niveau} style={{ ['--pq-f' as string]: COULEURS[f].base, ['--pq-ff' as string]: COULEURS[f].fond }} />{d.fiches > 0 && <span className="pq-comparer-nb">{d.fiches}/{d.sur}</span>}
            </span>
          ); })}
        </div>
      ))}
    </section>
  );
}
export function FeuilleValeurs({ cols, sel, quatre, etapes, familles, onPreuve }: { cols: ColonneLue[]; sel: ColonneLue; quatre: boolean; etapes: Etapes; familles: FamilyId[]; onPreuve: () => void }) {
  useComplements(); // d3b : les valeurs des compléments entrent dans compose() et huile() ; un nouveau rendu à leur arrivée
  const refs = new Set<string>();
  const garder = (v: ValeurReelle | null) => { v?.refs.forEach((r) => refs.add(r)); return v; };
  const alpha = cols.map((c) => garder(acides(c.cle, 'alpha')));
  const beta = cols.map((c) => garder(acides(c.cle, 'beta')));
  const hu = cols.map((c) => garder(huile(c.cle)));
  const chimie = CHIMIE.map((x) => ({ ...x, cellules: cols.map((c) => garder(compose(c.cle, x.cle))) }));
  const lin = cols.map((c) => garder(linalolEnBiere(c.cle, c.houblon.nom)));
  ['H22', 'H77'].forEach((r) => refs.add(r));
  return (
    <div className="pq-comparer-vraies" data-acquis="valeurs" aria-label="Vraies valeurs et chimie"
      data-element="r6a-chimie v1-vraies-valeurs v1-linalol-en-biere d1-tout-ouvert p03-plages-sources">
      <EnAPlus cols={cols} sel={sel} />
      <div className="pq-comparer-grille-tab pq-comparer-vh"><span />{cols.map((c) => <span key={c.cle} style={{ color: c.couleur }}>{c.houblon.nom}</span>)}</div>
      <LigneValeurs nom="α" unite="% masse · toutes fiches" icone={<IconeLivre />} cols={cols} cellules={alpha} quatre={quatre} />
      <LigneValeurs nom="β" unite="% masse" icone={<IconeLivre />} cols={cols} cellules={beta} quatre={quatre} />
      <div className="pq-comparer-chim" data-acquis="chimie" aria-label="Composés de l’huile, rangés par famille">
        <LigneValeurs cle="huile" nom="huile" unite="mL/100 g" icone={<IconeGoutte />} cols={cols} cellules={hu} quatre={quatre} />
        {/* cmc2d : la composition des huiles de Beer Maverick (barres superposées), sous la ligne « huile ». */}
        <CompositionVue cols={cols} />
        {chimie.map((x) => <LigneValeurs key={x.cle} cle={x.cle} nom={x.nom} unite={x.unite} famille={x.famille} cols={cols} cellules={x.cellules} quatre={quatre} />)}
      </div>
      {lin.some(Boolean) && <LigneValeurs cle="linalol-biere" nom="linalol en bière" unite="µg/L" famille="floral" cols={cols} cellules={lin} quatre={quatre}
        note="Pas comparables entre eux : doses, moments et bières diffèrent." />}
      {/* L'IBU aux étapes (D107) : calculé (BrewingMath de l'app, α du lot ou milieu de la plage des fiches), à 4 g/L ;
          à froid, non modélisé (jamais 0). */}
      <div className="pq-comparer-grille-tab pq-comparer-vg" data-role="ibu-etapes" aria-label="IBU selon l’étape, à 4 g/L">
        <span className="pq-comparer-vn"><IconeGoutte />{!quatre && <span><b>IBU</b><span className="pq-comparer-vu">calculé, 4 g/L</span></span>}</span>
        {cols.map((c) => (
          <span key={c.cle} className="pq-comparer-vc pq-comparer-vc-ibu">
            {ETAPES.map((e) => {
              const v = etapes[c.cle]?.[e.code];
              return (
                <span key={e.code} className="pq-comparer-vi-l">
                  <span className="pq-comparer-vu-in">{e.nom}</span>{' '}
                  {v?.ibu
                    ? <span className="pq-comparer-vv" data-nature="simule" data-ibu={e.code} title={`calculé, ${nombre(v.ibu.min, 0)}–${nombre(v.ibu.max, 0)} par la plage d’α`}>~{nombre(v.ibu.valeur, 0)}</span>
                    : <span className="pq-comparer-vi" data-inconnu="" title={v?.raisonIbu?.startsWith('à froid') ? 'à froid : IBU non modélisé' : undefined}>?</span>}
                </span>
              );
            })}
          </span>
        ))}
      </div>
      <Fiches cols={cols} familles={familles} />
      {/* Le panel OSU (mesuré, Cascade) vit dans Preuve (r6n2, D114) ; sa conclusion est rappelée ici, à côté des vraies
          valeurs, avec ses sources, et un toucher mène à la courbe. */}
      <p className="pq-comparer-osu-rap" data-etat="etat-comp-osu etat-acquis-panel-osu" data-element="r6a-osu">
        <IconePanel /><span><b>Panel OSU, Cascade</b> : les agrumes plafonnent dès 8 g/L, l’herbacé monte encore ; 4–8 g/L : retenu par les auteurs.
        <span className="pq-comparer-vr"> H22 Lafontaine 2018 · H77 Brülosophy 2019</span></span>
        <button type="button" className="pq-comparer-lien" onClick={onPreuve}>La courbe : Preuve ›</button>
      </p>
      <p className="pq-comparer-vsrc">mesuré : fiches et études ; plage = du plus bas au plus haut des sources ; la plus haute de chaque rangée à la couleur de son houblon.</p>
      <p className="pq-comparer-vrefs">{[...refs].sort((a, b) => a.localeCompare(b, 'fr', { numeric: true })).map((r) => <span key={r}><b>{r}</b> {titreRef(r)}</span>)}</p>
    </div>
  );
}

// ---------- Preuve (y3, y1b) : le panel OSU, mesuré, et 20 bières tirées ----------
export function PanelOSU({ noms }: { noms: string[] }) {
  const O = useMemo(panelOSU, []);
  if (!O) return null;
  const W = 358, H = 128, x0 = 30, x1 = W - 96, y0 = 10, y1 = H - 22;
  const xs = O.doses.map((_, i) => x0 + ((x1 - x0) * i) / (O.doses.length - 1));
  const y = (v: number) => y1 - ((y1 - y0) * v) / 15;
  const rd = (v: number) => Math.round(v * 10) / 10;
  const iDose = O.doses.findIndex((d) => Math.abs(d - 3.86) < 0.01);
  const iz0 = O.doses.findIndex((d) => d >= 3.86), iz1 = O.doses.findIndex((d) => d >= 8);
  const serie = (vals: number[], couleur: string, nom: string, famille?: FamilyId) => (
    <g key={nom}>
      <polyline points={vals.map((v, i) => `${rd(xs[i])},${rd(y(v))}`).join(' ')} fill="none" stroke={couleur} strokeWidth="2.5" strokeLinejoin="round" />
      {vals.map((v, i) => <circle key={i} cx={rd(xs[i])} cy={rd(y(v))} r="3" className="pq-comparer-osu-pt" stroke={couleur} strokeWidth="2" />)}
      {famille && <svg x={x1 + 4} y={rd(y(vals.at(-1)!) - 7)} width="14" height="14" overflow="visible"><Picto famille={famille} taille={14} /></svg>}
      <text x={x1 + (famille ? 21 : 8)} y={rd(y(vals.at(-1)!) + 4)} className="pq-comparer-osu-l" fill={couleur}>{nom} {nombre(vals.at(-1)!, 1)}</text>
    </g>
  );
  const sans = noms.filter((n) => n !== 'Cascade');
  return (
    <section className="pq-comparer-osu" data-acquis="osu" data-element="r6a-osu y3-panel-osu" data-nature="mesure" data-source="H22 Lafontaine 2018 (E04)" aria-label="Panel OSU">
      <p className="pq-comparer-osu-t"><IconePanel /><span className="pq-comparer-osu-nom">Panel OSU, Cascade</span><span className="pq-comparer-puce">panel</span><span className="pq-comparer-osu-u">sur 15, g/L</span></p>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Panel OSU, Cascade : intensité, herbacé et agrumes selon la dose, sur 15">
        {iz0 >= 0 && iz1 >= 0 && <rect x={xs[iz0]} y={y0} width={xs[iz1] - xs[iz0]} height={y1 - y0} className="pq-comparer-osu-z" />}
        {[0, 5, 10, 15].map((v) => <g key={v}><line x1={x0} x2={x1} y1={rd(y(v))} y2={rd(y(v))} className="pq-comparer-grille" /><text x={x0 - 6} y={rd(y(v) + 4)} textAnchor="end" className="pq-comparer-osu-ax">{v}</text></g>)}
        {O.doses.map((d, i) => <text key={d} x={rd(xs[i])} y={H - 6} textAnchor="middle" className="pq-comparer-osu-ax">{nombre(d, 2)}</text>)}
        {iDose >= 0 && <line x1={rd(xs[iDose])} x2={rd(xs[iDose])} y1={y0 - 4} y2={y1} className="pq-comparer-encre-trait" strokeWidth="2" />}
        {serie(O.intensite, 'rgb(var(--cave-50))', 'intensité')}
        {serie(O.herbace, COULEURS.herbal.texte, 'herbacé', 'herbal')}
        {serie(O.agrumes, COULEURS.citrus.texte, 'agrumes', 'citrus')}
      </svg>
      <p className="pq-comparer-osu-n"><span><i className="pq-comparer-ld" />3,86 g/L ≈ ta dose égale</span><span><i className="pq-comparer-lz" />4–8 g/L : retenu par les auteurs</span></p>
      <p className="pq-comparer-osu-n">Agrumes : plafond dès 8 g/L ; l’herbacé monte encore.{sans.length > 0 && <b> {sans.join(', ')} : pas de panel publié.</b>}</p>
      <p className="pq-comparer-osu-s">H22 Lafontaine 2018 · H77 Brülosophy 2019 : 10 contre 15 g/L non distingués.</p>
    </section>
  );
}
export function FeuillePreuve({ cols, familles }: { cols: ColonneLue[]; familles: FamilyId[] }) {
  const [graine, setGraine] = useState(1);
  const t = useMemo(() => tirer(cols, familles, graine), [cols, familles, graine]);
  return (
    <div className="pq-comparer-preuve" data-element="y1b-tirage-preuve y3-panel-osu">
      <PanelOSU noms={cols.map((c) => c.houblon.nom)} />
      <section className="pq-comparer-tir" aria-label="20 bières tirées">
        <p className="pq-comparer-carte-st"><b>20 bières tirées</b><Simule />
          <button type="button" className="pq-comparer-puce pq-comparer-tir-b" onClick={() => setGraine((g) => g + 1)}><IconeTirer />20 autres</button></p>
        <p className="pq-comparer-note">Combien sortent de ta {termes().style}, famille par famille. Tirées au hasard dans la bande du moteur (une hypothèse : tirage uniforme).</p>
        <div className="pq-comparer-grille-tab pq-comparer-tir-h"><span />{cols.map((c) => <b key={c.cle} style={{ color: c.couleur }}>{c.houblon.nom}</b>)}</div>
        {familles.map((f) => (
          <div key={f} className="pq-comparer-grille-tab pq-comparer-tir-l">
            <span className="pq-comparer-rn" style={{ color: COULEURS[f].texte }}><Picto famille={f} taille={14} />{COURT[f]}</span>
            {cols.map((c) => { const x = t[c.cle]?.[f]; return x == null
              ? <span key={c.cle} className="pq-comparer-tir-c"><i className="pq-comparer-hach" role="img" aria-label={`${c.houblon.nom}, ${COURT[f].toLowerCase()} : inconnu, rien à tirer`} /></span>
              : (
                <span key={c.cle} className="pq-comparer-tir-c" role="img" aria-label={`${c.houblon.nom}, ${COURT[f].toLowerCase()} : ${x.deja ? `ta ${termes().biere} est déjà au-dessus de ta ${termes().style}` : `${x.hors} bières sur 20 sortent de ta {termes().style}`}`}>
                  <span className="pq-comparer-tir-p">{x.points.map((h, i) => <i key={i} style={{ background: h ? ORANGE : COULEURS[f].base }} />)}</span>
                  <span className={cx('pq-comparer-nb', (x.deja || x.hors > 0) && 'pq-comparer-dl-hors')} data-nature="simule">{x.deja ? 'déjà hors' : `${x.hors} sur 20`}</span>
                </span>
              ); })}
          </div>
        ))}
      </section>
    </div>
  );
}

// ---------- Frise (r6n2) : le moment, dans Dryhopper ----------
export function FeuilleFrise({ cols, sel, onDryhopper }: { cols: ColonneLue[]; sel: ColonneLue; onDryhopper: () => void }) {
  const recette = useRecette();
  const sc = style(recette.styleCode);
  const cles = cols.map((c) => c.cle);
  const actif = useMemo(() => enActif(recette, cles), [recette, cles.join()]);
  // La famille suivie jour après jour : la première de sa demande (visée, dégustation), sinon la première attendue du style.
  const demande = useDemande(recette);
  const fam = famillesDeLaDemande(demande, sc, 1)[0];
  const jours = useMemo(() => jourApresJour(recette, cles, fam), [recette, cles.join(), fam]);
  const arrets = [{ n: '60′', ici: true }, { n: '10′', ici: true }, { n: 'whirlpool' }, { n: 'actif' }, { n: 'après', ici: true }, { n: 'puis' }];
  const W = 340, x = (i: number) => 14 + (i * (W - 28)) / (arrets.length - 1);
  const pt = (v: number | null) => (v == null ? '?' : `~${nombre(v, 1)}`);
  return (
    <div className="pq-comparer-frise" data-element="y1b-second-houblon-puis x3b-cuve-jour-apres-jour">
      <svg width={W} height={86} viewBox={`0 0 ${W} 86`} role="img" aria-label="La frise des moments : 60′, 10′, whirlpool, actif, après, puis ; ici, chaque houblon à 60′, 10′ et après fermentation">
        <line x1={x(0)} x2={x(4)} y1={56} y2={56} className="pq-comparer-frise-l" />
        {Array.from({ length: 10 }, (_, i) => x(0) + ((x(1) - x(0)) * (i + 1)) / 11).map((v) => <line key={v} x1={v} x2={v} y1={52} y2={60} className="pq-comparer-frise-t" />)}
        {arrets.map((a, i) => (
          <g key={a.n}>
            {a.n !== 'puis' && <line x1={x(i)} x2={x(i)} y1={48} y2={64} className="pq-comparer-frise-l" />}
            <text x={x(i)} y={80} textAnchor="middle" className={cx('pq-comparer-frise-n', a.ici && 'pq-comparer-frise-ici')}>{a.n}</text>
            {a.ici && cols.map((c, j) => <circle key={c.cle} cx={x(i)} cy={42 - j * 11} r={5} fill={c.couleur} />)}
          </g>
        ))}
        <circle cx={x(5)} cy={42} r={7} className="pq-comparer-frise-puis" /><text x={x(5)} y={46} textAnchor="middle" className="pq-comparer-frise-n">+</text>
      </svg>
      <p className="pq-comparer-note">Ici, chaque houblon est posé à 60′, à 10′ et au dry hop après fermentation, {CONDITIONS.jours} j (les rangées « aux étapes »). La frise se glisse au doigt dans Dryhopper ; « + » enchaîne un second houblon (puis).</p>
      <section className="pq-comparer-carte">
        <p className="pq-comparer-carte-st"><b>Ce qui bouge là-bas : en actif</b><Simule /></p>
        <p className="pq-comparer-note">Le même ajout pendant la fermentation active au lieu d’après, en crans du style.{cols.every((c) => (actif[c.cle]?.resin ?? 0) < -0.05) ? ' Le résineux baisse : ta demande se joue aussi là.' : ''}</p>
        {cols.map((c) => { const top = (Object.entries(actif[c.cle] ?? {}) as [FamilyId, number][]).filter(([, v]) => Math.abs(v) >= 0.05).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 3); return (
          <p key={c.cle} className="pq-comparer-eg-l"><Point c={c} /><b>{c.houblon.nom}</b>
            {top.length ? top.map(([f, v]) => <span key={f} className="pq-comparer-nb pq-comparer-mv" style={{ color: COULEURS[f].texte }} data-nature="simule"><Picto famille={f} taille={14} />{signeCran(v)}</span>) : <span className="pq-comparer-note">≈ rien</span>}
          </p>
        ); })}
      </section>
      <section className="pq-comparer-carte">
        <p className="pq-comparer-carte-st"><b>Jour après jour</b><Simule /></p>
        {(() => {
          const plat = cles.every((k) => { const v = jours[k]; return v.slice(1).every((y) => y != null && v[1] != null && Math.abs(y - v[1]!) < 0.05); });
          return <>
            <p className="pq-comparer-note">À {nombre(CONDITIONS.doseGL)} g/L, {plat ? 'le moteur ne distingue que le premier jour : de 2 à 7 j, même profil. ' : ''}Le {COURT[fam].toLowerCase()}, sur 100 :</p>
            {cols.map((c) => { const v = jours[c.cle]; return (
              <p key={c.cle} className="pq-comparer-eg-l"><Point c={c} /><b>{c.houblon.nom}</b>
                <span className="pq-comparer-nb pq-comparer-mv" style={{ color: COULEURS[fam].texte }} data-nature="simule"><Picto famille={fam} taille={14} />1 j {pt(v[0])} → {plat ? `2 à 7 j ${pt(v[1])}` : `3 j ${pt(v[2])} → 7 j ${pt(v[6])}`}</span>
              </p>
            ); })}
          </>;
        })()}
      </section>
      <button type="button" className="pq-comparer-pont-l" data-role="pont-frise" onClick={onDryhopper}>
        <span>Glisser le moment, enchaîner {sel.houblon.nom} puis un second : <b>Dryhopper</b></span><IconeFleche />
      </button>
      <p className="pq-comparer-vsrc">Moteur : {sc.code}, {nombre(CONDITIONS.doseGL)} g/L, {nomLevure(recette.yeastId)}.</p>
    </div>
  );
}

// ---------- Souche (r6n2) : la levure, dans Levure ----------
export function FeuilleSouche({ cols, sel, familles, onLevure }: { cols: ColonneLue[]; sel: ColonneLue; familles: FamilyId[]; onLevure: () => void }) {
  const recette = useRecette();
  const cles = cols.map((c) => c.cle);
  const s = useMemo(() => souche(recette, cles), [recette, cles.join()]);
  const n = (x: number | undefined) => (x == null ? '?' : Math.abs(x) < 0.05 ? '≈ 0' : signeCran(x));
  const repos = cles.every((k) => Object.values(s.apres[k] ?? {}).every((v) => Math.abs(v ?? 0) < 0.05));
  const top = (k: string) => (Object.entries(s.actif[k] ?? {}) as [FamilyId, number][]).filter(([, v]) => Math.abs(v) >= 0.05).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 3);
  const force = (k: string) => top(k).reduce((m, [, v]) => Math.max(m, Math.abs(v)), 0);
  const ordre = [...cols].sort((a, b) => force(b.cle) - force(a.cle));
  const tete = ordre[0] && force(ordre[0].cle) > 0 ? ordre[0] : null;
  const mx = Math.max(0.5, ...familles.map((f) => Math.abs(sel.cellules[f].dCran ?? 0)), ...familles.map((f) => Math.abs(s.actif[sel.cle]?.[f] ?? 0)));
  return (
    <div className="pq-comparer-souche" data-element="y1b-levure-pastilles a2b-ce-que-la-levure-change">
      <p className="pq-comparer-souche-h">Ici, la souche est fixée : <span className="pq-comparer-puce pq-comparer-puce-pleine">{nomLevure(s.levure)}</span><span className="pq-comparer-puce pq-comparer-puce-p">{nomLevure(s.autre)}</span><Simule /></p>
      <p className="pq-comparer-souche-t">
        {repos ? <>Après fermentation, la levure est au repos : {nomLevure(s.autre)} ne change rien, pour aucun des houblons.</> : <>Après fermentation, {nomLevure(s.autre)} change déjà un peu le profil.</>}
        {tete ? <> En dry hop actif, elle réveille surtout {tete.houblon.nom} :</> : <> En dry hop actif non plus, rien ne bouge.</>}
      </p>
      <p className="pq-comparer-note">{nomLevure(s.autre)} au lieu d’{nomLevure(s.levure)}, ajout pendant la fermentation active, {nombre(CONDITIONS.doseGL)} g/L, {CONDITIONS.jours} j ; en crans du style.</p>
      {ordre.map((c) => { const t = top(c.cle); return (
        <p key={c.cle} className="pq-comparer-eg-l"><Point c={c} /><b>{c.houblon.nom}</b>
          {t.length ? t.map(([f, v]) => <span key={f} className="pq-comparer-nb pq-comparer-mv" style={{ color: COULEURS[f].texte }} data-nature="simule"><Picto famille={f} taille={14} />{signeCran(v)}</span>) : <span className="pq-comparer-note">≈ rien</span>}
        </p>
      ); })}
      <button type="button" className="pq-comparer-pont-l" data-role="pont-levure" onClick={onLevure}>
        <span>Changer de souche, voir ce qu’elle fait : <b>Levure</b></span><IconeFleche />
      </button>
      <section className="pq-comparer-souche-tab" aria-label={`${sel.houblon.nom} : ce que la cuve apporte, et ce que ${nomLevure(s.autre)} change en actif`}>
        <p className="pq-comparer-souche-tab-h"><span><Point c={sel} />{sel.houblon.nom}</span><span>la cuve apporte, ici</span><span>{nomLevure(s.autre)}, en actif</span></p>
        {familles.map((f) => { const a = sel.cellules[f].dCran, b = s.actif[sel.cle]?.[f]; return (
          <p key={f} className="pq-comparer-souche-l">
            <span className="pq-comparer-rn" style={{ color: COULEURS[f].texte }}><Picto famille={f} taille={14} />{COURT[f]}</span>
            <span className="pq-comparer-souche-c"><span className="pq-comparer-dose-b">{a != null && <i style={{ width: pc(Math.abs(a) / mx), background: COULEURS[f].base }} />}</span><span className="pq-comparer-nb" data-nature="simule">{a == null ? '?' : n(a)}</span></span>
            <span className="pq-comparer-souche-c"><span className="pq-comparer-dose-b">{b != null && <i style={{ width: pc(Math.abs(b) / mx), background: COULEURS[f].fond, boxShadow: `inset 0 0 0 1px ${COULEURS[f].base}` }} />}</span><span className="pq-comparer-nb" data-nature="simule">{n(b)}</span></span>
          </p>
        ); })}
      </section>
    </div>
  );
}

// ---------- le « + » (p4, r6n2) : la carte de chaque houblon du stock avant de l'ajouter (L14) ----------
// D137 (« ni en recherche un ») : le champ cherche tout le catalogue (nom et alias), sans accent ni casse ; vide, la feuille
// montre le stock, comme avant.
const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function FeuilleAjouter({ disponibles, exclus, verbe, suite, onAjouter }: {
  disponibles: string[]; exclus: string[]; verbe: string; suite: string; onAjouter: (cle: string) => void;
}) {
  const [cherche, setCherche] = useState('');
  const q = sansAccent(cherche.trim());
  const trouves = useMemo(() => (q
    ? donnees().catalogue.filter((h) => !exclus.includes(h.id) && [h.name, ...h.aliases].some((n) => sansAccent(n).includes(q))).slice(0, 8).map((h) => h.id)
    : disponibles), [q, disponibles, exclus]);
  return (
    <div className="pq-comparer-ajout" data-element="p4-plus-comparaison l5f-carte-role-alpha">
      <Input type="search" inputMode="search" data-role="chercher-houblon" value={cherche} onChange={(e) => setCherche(e.target.value)}
        placeholder="Chercher un houblon…" aria-label="Chercher un houblon dans le catalogue" className="pq-comparer-chercher" />
      {q && !trouves.length && <p className="pq-comparer-note">aucun houblon du catalogue à ce nom</p>}
      {trouves.map((cle) => {
        const h = houblon(cle), a = h.alpha;
        const familles = (Object.keys(h.familles) as FamilyId[]).filter((f) => h.familles[f].niveau !== 'non décrit')
          .sort((x, y) => (h.familles[y].niveau === 'marqué' ? 1 : 0) - (h.familles[x].niveau === 'marqué' ? 1 : 0)).slice(0, 6);
        const part = h.partSansFamille;
        const lot = !!h.stock && hopRef(cle)?.stock?.alphaFrom === 'fiche de stock';
        return (
          <section key={cle} className="pq-comparer-ajout-c" style={{ ['--pq-h' as string]: couleurHoublon(cle) }} data-houblon-carte={cle}>
            <p className="pq-comparer-ajout-n"><Point couleur={couleurHoublon(cle)} /><b>{h.nom}</b>{h.stock != null && h.stock > 0 ? <IconeStock /> : <IconePanier />}</p>
            <p className="pq-comparer-ajout-l">
              {a ? (lot ? <span className="pq-comparer-al" data-role="alpha">α {nombre(a.valeur, 1)}%{a.horsFiches ? ' ≠' : ''}</span>
                : <span className="pq-comparer-al pq-comparer-al-fi" data-role="alpha"><IconeLivre />{a.plage ? plage(a.plage[0], a.plage[1], 0) : nombre(a.valeur, 1)}%</span>)
                : <span className="pq-comparer-al" data-inconnu="">α ?</span>}
              {h.role.mot && <span className={cx('pq-comparer-us', h.role.source.startsWith('règle') && 'pq-comparer-deduit')}>{h.role.mot}</span>}
              {familles.map((f) => <Picto key={f} famille={f} taille={h.familles[f].niveau === 'marqué' ? 16 : 13} />)}
            </p>
            {part != null && h.motsSansFamille.length > 0 && <>
              <span className="pq-comparer-ajout-b" aria-hidden="true"><i style={{ width: pc(part) }} /></span>
              <p className="pq-comparer-ajout-m"><b className="pq-comparer-nb">{nombre(part * 100)} %</b> de ses mots hors des 12 familles : {h.motsSansFamille.slice(0, 5).join(', ')}</p>
              {part > 0.5 && <p className="pq-comparer-note">Ses fiches le décrivent surtout hors familles : ses barres paraîtront maigres, « {h.motsSansFamille[0]} » n’y est pas.</p>}
            </>}
            <button type="button" className="pq-comparer-ajout-btn" data-ajouter={cle} onClick={() => onAjouter(cle)}>+ {verbe} {h.nom} {suite}</button>
          </section>
        );
      })}
    </div>
  );
}

// ---------- « pourquoi ? » (r6n2) : le classement, ses nombres ----------
export function FeuillePourquoi({ cols, critere }: { cols: ColonneLue[]; critere: Critere }) {
  const f = critere.famille;
  const ordre = [...cols].sort((a, b) => critere.sens * ((b.cellules[f].dCran ?? -99) - (a.cellules[f].dCran ?? -99)));
  const avant = cols[0]?.cellules[f].avant;
  const recouvre = cols.every((a) => cols.every((b) => a.cellules[f].bas <= b.cellules[f].haut && b.cellules[f].bas <= a.cellules[f].haut));
  return (
    <div className="pq-comparer-pq">
      <p className="pq-comparer-note">Par {critere.nom} : le centre simulé de chaque houblon à {nombre(CONDITIONS.doseGL)} g/L, en crans du style, face à ta {termes().biere}{avant != null ? ` (~${nombre(avant, 1)} sur 100)` : ''}.</p>
      {ordre.map((c, i) => { const cel = c.cellules[f]; return (
        <p key={c.cle} className="pq-comparer-pq-l">
          <b className="pq-comparer-pq-r">{i + 1}</b>
          <span><b><Point c={c} /> {c.houblon.nom}</b><span className="pq-comparer-note">{cel.inconnu ? 'inconnu' : `~${nombre(cel.centre)} sur 100, bande ${nombre(cel.bas)}–${nombre(cel.haut)}`} · {c.sorties.length ? `sort de ta ${termes().style} : ${c.sorties.map((x) => COURT[x].toLowerCase()).join(', ')}` : 'dans ta {termes().style}'}</span></span>
          <span className="pq-comparer-nb" data-nature="simule">{cel.dCran == null ? '?' : signeCran(cel.dCran)}</span>
        </p>
      ); })}
      <p className="pq-comparer-note">{recouvre ? 'Les bandes se recouvrent toutes : un écart de moins d’un cran est un indice, pas une preuve.' : 'Les bandes ne se recouvrent pas toutes : l’écart est plus qu’un indice.'} Le seuil de perception dans ta {termes().biere} n’est pas mesuré.</p>
    </div>
  );
}

// ---------- la biotransformation de x3b, dans les étapes (dry hop) ----------
const mu = (x: number) => nombre(x, x >= 10 ? 0 : x >= 1 ? 1 : 2);
export function VoletBio({ cols }: { cols: ColonneLue[] }) {
  const recette = useRecette();
  const b = useMemo(() => biotransformation(recette, cols.map((c) => c.cle)), [recette, cols]);
  const lev = nomLevure(b.levure);
  return (
    <div className="pq-comparer-bio" data-element="x3b-biotransfo">
      <p className="pq-comparer-carte-st"><b>La biotransformation de ce plan</b><Simule /></p>
      <p className="pq-comparer-note">{b.actifIci ? '' : `Au dry hop de cette comparaison (après fermentation), la levure est au repos : rien ne se transforme. `}Pendant la fermentation active ({lev}, {nombre(CONDITIONS.doseGL)} g/L, {CONDITIONS.jours} j), le moteur estime :</p>
      {b.parHoublon.map((x) => { const c = cols.find((y) => y.cle === x.cle)!; return (
        <p key={x.cle} className="pq-comparer-bio-l">
          <Picto famille="floral" taille={14} />
          <span><Point c={c} /><b>{c.houblon.nom}</b> : {x.citronellol
            ? <><span className="pq-comparer-nb" data-nature="simule">~{mu(x.citronellol.centre)} µg/L</span> de citronellol, de {mu(x.citronellol.bas)} à {mu(x.citronellol.haut)} µg/L{x.citronellol.bas === 0 ? ' ; borne basse à 0 : l’ampleur ne se chiffre pas' : ''}</>
            : <span className="pq-comparer-note">citronellol inconnu ({(x.raison ?? 'non évaluable').split(' ; ')[0].replace(/^géraniol de [^:]+: /, 'géraniol ')}), jamais 0</span>}</span>
        </p>
      ); })}
      <p className="pq-comparer-bio-l"><IconeSimule /><span><b>géraniol → citronellol</b> : {lev}, conversion {nombre(b.conv.centre * 100)} % au centre, de {nombre(b.conv.bas * 100)} à {nombre(b.conv.haut * 100)} %{b.texteConv ? ` (${b.texteConv})` : ' [convention]'}.</span></p>
      <p className="pq-comparer-bio-l"><Picto famille="tropical" taille={14} /><span><b>thiols libérés</b> : rendement {plage(b.rend.bas * 1, b.rend.haut * 1, 2)} %{b.texteRend ? ` (${b.texteRend})` : ''} ; {b.parHoublon.some((x) => x.thiols) ? b.parHoublon.filter((x) => x.thiols).map((x) => `${cols.find((y) => y.cle === x.cle)!.houblon.nom} ~${mu(x.thiols!.centre)} ng/L`).join(', ') : 'précurseurs non publiés pour ces houblons'}.</span></p>
      <p className="pq-comparer-vsrc">Aucun taux publié en bière : la biotransformation est une convention du moteur{b.sources.length ? ` (${b.sources.join(', ')})` : ''}. Le moment se règle dans Dryhopper, la souche dans Levure.</p>
    </div>
  );
}

// ---------- les plans de x3b (« Citra seul … Citra 3 j, puis Idaho 7 5 j »), avec les houblons comparés ----------
/** Le sélecteur de plans de x3b, sa source choisie pour les étapes (D107) : le houblon retenu seul, avec le suivant
 * ensemble, ou à la suite ; 4 g/L en tout, après fermentation, calculé par le moteur à chaque toucher. Le réglage fin
 * (jours, ordre, dose) reste à Dryhopper. */
export function VoletPlans({ cols, retenu, onDryhopper }: { cols: ColonneLue[]; retenu: string; onDryhopper: () => void }) {
  const recette = useRecette();
  const sc = style(recette.styleCode);
  // Les deux familles que les plans chiffrent : celles de sa demande (visée, dégustation), sinon les attendues du style.
  const demande = useDemande(recette);
  const fams = famillesDeLaDemande(demande, sc, 2);
  const a = cols.find((c) => c.cle === retenu) ?? cols[0];
  const sens = (f: FamilyId) => (demande.moins.includes(f) ? -1 : 1);
  const b = [...cols].filter((c) => c.cle !== a?.cle).sort((x, y) => sens(fams[0]) * ((y.cellules[fams[0]].dCran ?? -9 * sens(fams[0])) - (x.cellules[fams[0]].dCran ?? -9 * sens(fams[0]))))[0];
  // Les plans de x3b eux-mêmes, pour ta stout (« Ma cuve, jour après jour ») : ton Citra cryo du stock, 2 g/L chacun,
  // pendant la fermentation active ; « ma bière de base -> 1 dry hop, 2 dry hop » (sa note sur x3b, 20.10).
  const citra = donnees().stock.find((x) => x.key.startsWith('beermaverick-citra') && x.grams > 0)?.key ?? null;
  const [i, setI] = useState(2);
  const plans = useMemo(() => {
    if (!a) return [];
    type Ajout = { cle: string; gL: number; phase: 'actif' | 'apres'; jours: number; jour?: number };
    const poser = (x: Ajout, k: number) => {
      const p = placer({ id: `plan-${k}`, hopKey: x.cle, grams: x.gL * recette.volumeL, moment: 'dryPost' }, { type: 'dryhop', phase: x.phase, jours: x.jours }, recette);
      return x.jour != null ? { ...p, day: x.jour } : p;
    };
    const g = CONDITIONS.doseGL, n = (cle: string) => hopRef(cle)?.name ?? cle;
    const liste: { nom: string; groupe: 'ici' | 'x3b'; ajouts: Ajout[] }[] = [{ nom: `${a.houblon.nom} seul`, groupe: 'ici', ajouts: [{ cle: a.cle, gL: g, phase: 'apres', jours: CONDITIONS.jours }] }];
    if (b) {
      liste.push({ nom: `${a.houblon.nom} + ${b.houblon.nom} ensemble`, groupe: 'ici', ajouts: [{ cle: a.cle, gL: g / 2, phase: 'apres', jours: CONDITIONS.jours }, { cle: b.cle, gL: g / 2, phase: 'apres', jours: CONDITIONS.jours }] });
      liste.push({ nom: `${a.houblon.nom} 3 j, puis ${b.houblon.nom} 5 j`, groupe: 'ici', ajouts: [{ cle: a.cle, gL: g / 2, phase: 'apres', jours: 3 }, { cle: b.cle, gL: g / 2, phase: 'apres', jours: 5, jour: CONDITIONS.jourDebut.dryPost + 3 }] });
    }
    if (citra) {
      const C = (jours: number): Ajout => ({ cle: citra, gL: 2, phase: 'actif', jours, jour: 2 });
      liste.push({ nom: 'Citra seul', groupe: 'x3b', ajouts: [C(3)] });
      if (hopRef(H.galaxy)) liste.push({ nom: `Citra + ${n(H.galaxy)} ensemble`, groupe: 'x3b', ajouts: [C(3), { cle: H.galaxy, gL: 2, phase: 'actif', jours: 3, jour: 2 }] });
      if (hopRef(H.idaho7)) liste.push({ nom: `Citra 3 j, puis ${n(H.idaho7)} 5 j`, groupe: 'x3b', ajouts: [C(3), { cle: H.idaho7, gL: 2, phase: 'actif', jours: 5, jour: 5 }] });
    }
    const avant = lireBiere(recette).profil;
    return liste.map((p) => {
      const apres = lireBiere({ ...recette, additions: [...recette.additions, ...p.ajouts.map(poser)] }).profil;
      const d = (f: FamilyId) => { const x = apres[f].valeur, y = avant[f].valeur; return x && y ? (x.centre - y.centre) / sc.families[f].cran : null; };
      const sorties = sc.order.filter((f) => apres[f].horsStyle === 'au-dessus' && avant[f].horsStyle !== 'au-dessus');
      return { ...p, crans: fams.map((f) => d(f)), sorties };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recette, a?.cle, b?.cle, citra, fams.join()]);
  if (!a) return null;
  const p = plans[Math.min(i, plans.length - 1)];
  const puce = (x: (typeof plans)[number], k: number) => <button key={x.nom} type="button" role="radio" aria-checked={k === i} onClick={() => setI(k)}>{x.nom}</button>;
  return (
    <div className="pq-comparer-plans" data-element="x3b-plans">
      <p className="pq-comparer-carte-st"><b>Enchaîner, comme x3b</b><Simule /></p>
      <div className="pq-comparer-plans-ch" role="radiogroup" aria-label="Plan de dry hop, avec tes houblons comparés">
        {plans.map((x, k) => (x.groupe === 'ici' ? puce(x, k) : null))}
      </div>
      {plans.some((x) => x.groupe === 'x3b') && <>
        <p className="pq-comparer-note">Les plans de x3b, ta {termes().biere} : Citra cryo de ton stock, 2 g/L chacun, pendant la fermentation active.</p>
        <div className="pq-comparer-plans-ch" role="radiogroup" aria-label="Les plans de x3b">
          {plans.map((x, k) => (x.groupe === 'x3b' ? puce(x, k) : null))}
        </div>
      </>}
      {p && (
        <p className="pq-comparer-eg-l" aria-live="polite">
          <b>{p.nom}</b>
          {fams.map((f, k) => (
            <span key={f} className={cx('pq-comparer-nb pq-comparer-mv', demande.moins.includes(f) && 'pq-comparer-dl-hors')} style={demande.moins.includes(f) ? undefined : { color: COULEURS[f].texte }} data-nature="simule">
              <Picto famille={f} taille={14} />{p.crans[k] == null ? '?' : signeCran(p.crans[k]!)}
            </span>
          ))}
          {p.sorties.length > 0 ? <span className="pq-comparer-hors-mini">~<IconeRisque />{p.sorties.map((f) => <Picto key={f} famille={f} taille={12} />)}</span> : <span className="pq-comparer-vd-dans"><IconeOk /></span>}
        </p>
      )}
      <p className="pq-comparer-note">Avec tes houblons : {nombre(CONDITIONS.doseGL)} g/L en tout, après fermentation. Crans gagnés sur ta {termes().biere} ; ~⚠ : sort de ta {termes().style}.</p>
      <button type="button" className="pq-comparer-lien" onClick={onDryhopper}>Les jours, l’ordre et la dose : Dryhopper ›</button>
    </div>
  );
}
