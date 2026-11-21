import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PeriodeSynthese } from '../../../domain/finance/periodeSynthese';
import { colonnesDe } from './Piles';
import {
  PREMIER_JOUR, ajouterJours, estLundi, etiquettesAxe, fenetreInitiale, finFenetre, jourCourt, joursDeFenetre, joursEntre0,
  plageDuMois, plagesInconnues, texteInconnu, titreJours, xDebut, xFin, type Fenetre, type Plage,
} from './plage';
import { MARGE_BOUTS_PX, cadrerDeuxBouts, poserPlage, roleSous, useGlisse } from '../../geste';

/**
 * La frise des jours (s2ap2, 14.11) : sous les piles, une barre par jour (hauteur = dépense du jour, à l'échelle), le point vert d'une vente sur
 * l'axe, deux poignées rondes qui bornent la plage. Motif WAI-ARIA « multi-thumb slider » : deux `role="slider"`, flèches ±1 jour, Page ±7,
 * Origine/Fin. Les jours d'un mois sans aucune opération saisie sont « inconnus » (voile, ni point ni barre) : l'inconnu n'est jamais 0.
 * Le geste (21.11) est celui de la frise B, réglage temps : R1 (un toucher ne pose rien), R2 (sans saut), R3 (bord ou corps), R4 (les deux bouts
 * visibles, l'échelle s'ajuste), R5 (le corps glisse la plage), R7 (au bord, l'échelle défile ou se resserre), R10 (Échap rend la plage d'avant).
 */
export interface DonneesFrise {
  /** Les piles d'un seul jour (la règle de « dépensé » de `periodeSynthese`, jamais un second calcul). */
  periodeJour: (jour: string) => PeriodeSynthese;
  /** Le mois a-t-il au moins une opération saisie ? Sinon ses jours sont inconnus, pas vides. */
  moisSaisi: (mois: string) => boolean;
}

const HAUTEUR_MAX = 18, ROUTE_MAX = 1500;
/** R7 : l'échelle ne se resserre pas au-delà de six ans de jours. */
const SPAN_MAX = 366 * 6;

type Role = 'a' | 'b' | 'corps';
/** La vue : le jour (fractionnaire) au bord gauche et le nombre de jours sur la largeur. */
interface Vue { v0: number; span: number }
interface Saisie { role: Role; a0: number; b0: number; x0: number; w: number; vue0: Vue; v: Vue; off: number; pan: number }
const enJours = (jour: string): number => joursEntre0(PREMIER_JOUR, jour);
const deJour = (n: number): string => ajouterJours(PREMIER_JOUR, n);
const vueDe = (f: Fenetre): Vue => ({ v0: enJours(f.debut), span: f.nb });
const fenetreDeVue = (v: Vue): Fenetre => {
  const debut = Math.floor(v.v0 + 1e-6);
  return { debut: deJour(debut), nb: Math.max(1, Math.ceil(v.v0 + v.span - 1e-6) - debut) };
};
/** R4 : le début à 56 px du bord gauche, la fin (le soir du dernier jour) à 56 px du bord droit. */
const cadrerVue = (p: Plage, largeur: number): Vue => cadrerDeuxBouts(enJours(p.du), enJours(p.au) + 1, largeur, Math.min(MARGE_BOUTS_PX, largeur / 3));

/** La bulle de la poignée tenue reste dans la frise : collée à gauche ou à droite quand la poignée est près d'un bord (capture du 14.11 : « 22 oct. » coupé). */
const bulleX = (x: number) => (x < 0.22 ? 'gauche' : x > 0.78 ? 'droite' : undefined);

function Sup({ texte }: { texte: string }) {
  const [avant, apres] = texte.split('1er');
  return apres === undefined ? <>{texte}</> : <>{avant}1<sup>er</sup>{apres}</>;
}

export function Frise({ mois, plage, aujourdhui, jourMax, nbOperations, horsPeriode = '', donnees, onPlage, onMois, resume }: {
  mois: string; plage: Plage | null; aujourdhui: string; jourMax: string; nbOperations: number; horsPeriode?: string; donnees: DonneesFrise;
  onPlage: (du: string, au: string) => void; onMois: () => void;
  /** v1 (33) : quand la période n'est pas la fenêtre dessinée (« Tout l'historique » : la frise montre le mois en cours), la ligne de compte dit la période, jamais « 30 jours » du mois montré. */
  resume?: React.ReactNode;
}) {
  const eff = plage ?? plageDuMois(mois);
  /* Frise B (20.11, réglage temps ; « Très bien fait le portage du système, du mécanisme, pas du visuel... Fait le partout !!! ») : src/ui/geste.
     R4 : au repos, l'échelle s'ajuste pour que le début soit à 56 px du bord gauche et la fin à 56 px du bord droit, quelle que soit la durée.
     Pendant un geste, la vue tenue (`vue`) remplace ce cadrage ; au lâcher elle part et l'échelle se recale (R10). Non mesurée (largeur 0, jsdom) :
     la fenêtre d'avant (le mois, ou la plage). */
  const [largeur, setLargeur] = useState(0);
  const [vue, setVue] = useState<Vue | null>(null);
  const fenEff = vue ? fenetreDeVue(vue) : largeur > 0 ? fenetreDeVue(cadrerVue(eff, largeur)) : fenetreInitiale(plage, mois);
  const [tenue, setTenue] = useState<Role | null>(null);
  const piste = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const tr = piste.current; if (!tr) return;
    const mesurer = () => setLargeur(tr.getBoundingClientRect().width);
    mesurer();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(mesurer); ro.observe(tr);
    return () => ro.disconnect();
  }, []);
  const vif = useRef({ eff, onPlage, jourMax });
  vif.current.eff = eff; vif.current.onPlage = onPlage; vif.current.jourMax = jourMax;

  /** Pose la plage (en jours depuis PREMIER_JOUR, fin incluse) si elle change. */
  const poserJours = (a: number, b: number) => {
    const { eff: e, onPlage: pose } = vif.current;
    const du = deJour(a), au = deJour(b);
    if (du === e.du && au === e.au) return;
    vif.current.eff = { du, au };
    pose(du, au);
  };
  const bornes = () => ({ min: 0, max: enJours(vif.current.jourMax), minLarg: 0, pas: 1 });

  /* R1 R2 R3 R5 R6 R7 R10 R13 : le geste de la frise B, un seul pour l'app (src/ui/geste/useGlisse). */
  const glisse = useGlisse<Saisie>({
    cadre: () => piste.current,
    saisir: (x) => {
      const w = piste.current?.getBoundingClientRect().width ?? 0;
      if (!(w > 0)) return null;
      const e = vif.current.eff, v = vueDe(fenEff), a0 = enJours(e.du), b0 = enJours(e.au);
      const xa = ((a0 - v.v0) / v.span) * w, xb = ((b0 + 1 - v.v0) / v.span) * w;
      const role = roleSous(x, xa, xb);
      setTenue(role);
      return { role, a0, b0, x0: x, w, vue0: v, v, off: role === 'a' ? xa - x : role === 'b' ? xb - x : 0, pan: 0 };
    },
    suivre: (dx, s, x) => {
      const o = bornes(), parPx = s.v.span / s.w;
      if (s.role === 'corps') {
        const p = poserPlage('corps', s.a0, s.b0, Math.round(dx * (s.vue0.span / s.w) + s.pan), o);
        // R5 : un bout arrivé à 56 px du bord, c'est l'échelle qui défile sous la plage (la plage reste entière à l'écran)
        const marge = Math.min(MARGE_BOUTS_PX, s.w / 3) * parPx;
        if (p.a < s.v.v0 + marge) s.v = { ...s.v, v0: p.a - marge };
        else if (p.b + 1 > s.v.v0 + s.v.span - marge) s.v = { ...s.v, v0: p.b + 1 - s.v.span + marge };
        setVue(s.v); poserJours(p.a, p.b);
        return;
      }
      // un bord : il garde son écart au doigt (R2) ; l'unité sous le doigt se lit dans la vue du moment (elle change au bord, R7)
      const u = s.v.v0 + (x + s.off) * parPx;
      const p = s.role === 'a' ? poserPlage('a', s.a0, s.b0, Math.round(u) - s.a0, o) : poserPlage('b', s.a0, s.b0, Math.round(u) - 1 - s.b0, o);
      // R4 pendant le geste : aucun bout ne sort de la frise
      if (p.a < s.v.v0) s.v = { ...s.v, v0: p.a };
      if (p.b + 1 > s.v.v0 + s.v.span) s.v = { ...s.v, v0: p.b + 1 - s.v.span };
      setVue(s.v); poserJours(p.a, p.b);
    },
    // R7 : au bord, le corps fait défiler la plage ; un bord tiré vers l'extérieur resserre l'échelle, l'autre bout reste à sa place à l'écran
    bord: (sens, vitesse, dt, s) => {
      if (s.role === 'corps') { s.pan += sens * vitesse * s.v.span * dt; return; }
      if ((s.role === 'b' && sens > 0) || (s.role === 'a' && sens < 0)) {
        const e = vif.current.eff, ancre = s.role === 'b' ? enJours(e.du) : enJours(e.au) + 1, xAncre = (ancre - s.v.v0) / s.v.span;
        const span = Math.min(SPAN_MAX, s.v.span * (1 + vitesse * 0.6 * dt));
        s.v = { span, v0: ancre - xAncre * span };
      }
    },
    lacher: () => { setVue(null); setTenue(null); },
    annuler: (s) => { setVue(null); setTenue(null); poserJours(s.a0, s.b0); },
  });
  // stable : une ref neuve à chaque rendu détacherait le geste en cours (et l'annulerait)
  const refPiste = useCallback((el: HTMLDivElement | null) => { piste.current = el; glisse(el); }, [glisse]);

  const clavier = (e: React.KeyboardEvent, quelle: 'du' | 'au') => {
    const { eff: p } = vif.current, ici = quelle === 'du' ? p.du : p.au;
    const pas: Record<string, string> = {
      ArrowLeft: ajouterJours(ici, -1), ArrowDown: ajouterJours(ici, -1), ArrowRight: ajouterJours(ici, 1), ArrowUp: ajouterJours(ici, 1),
      PageUp: ajouterJours(ici, 7), PageDown: ajouterJours(ici, -7), Home: quelle === 'du' ? fenEff.debut : p.du, End: quelle === 'du' ? p.au : finFenetre(fenEff),
    };
    if (!(e.key in pas)) return;
    e.preventDefault();
    // R12 : un pas ; l'échelle suit (R4, le cadrage au repos)
    const o = bornes(), a0 = enJours(p.du), b0 = enJours(p.au), d = enJours(pas[e.key]) - (quelle === 'du' ? a0 : b0);
    const r = poserPlage(quelle === 'du' ? 'a' : 'b', a0, b0, d, o);
    poserJours(r.a, r.b);
  };

  const jours = useMemo(() => joursDeFenetre(fenEff), [fenEff]);
  const dessine = fenEff.nb <= ROUTE_MAX;
  const cellules = useMemo(() => dessine ? jours.map(j => donnees.moisSaisi(j.slice(0, 7)) ? donnees.periodeJour(j) : null) : [], [jours, donnees, dessine]);
  const total = (p: PeriodeSynthese) => p.depenseCents + p.materielCents;
  const maxi = Math.max(0, ...cellules.map(p => (p ? total(p) : 0)));
  const inconnus = useMemo(() => plagesInconnues(fenEff, donnees.moisSaisi), [fenEff, donnees]);
  const etiquettes = etiquettesAxe(fenEff, eff, aujourdhui);
  const pct = (x: number) => `${(x * 100).toFixed(3)}%`;
  const duX = xDebut(fenEff, eff.du), auX = xFin(fenEff, eff.au);
  const titre = titreJours(eff, aujourdhui);
  const n = joursEntre0(eff.du, eff.au) + 1;
  const xBulle = tenue === 'a' ? duX : tenue === 'b' ? auX : (duX + auX) / 2;
  const poignee = (quelle: 'du' | 'au') => {
    const jour = quelle === 'du' ? eff.du : eff.au, x = quelle === 'du' ? duX : auX;
    return <span key={quelle} className="ops-h" data-tenue={tenue === (quelle === 'du' ? 'a' : 'b') || undefined} style={{ left: pct(x) }} role="slider" tabIndex={0}
      aria-label={quelle === 'du' ? 'Début' : 'Fin'} aria-orientation="horizontal" aria-valuemin={joursEntre0(PREMIER_JOUR, quelle === 'du' ? PREMIER_JOUR : eff.du)}
      aria-valuemax={joursEntre0(PREMIER_JOUR, quelle === 'du' ? eff.au : jourMax)} aria-valuenow={joursEntre0(PREMIER_JOUR, jour)} aria-valuetext={jourCourt(jour, true, true)}
      onKeyDown={e => clavier(e, quelle)}><i className="ops-gp"/></span>;
  };
  return <>
    {/* FIN-FRISE-AGRANDIR : poignée tenue, la bulle dit la plage à la place de « n jours · n opération », retirée (pas seulement cachée) : elle ne couvre aucun chiffre. La ligne garde sa hauteur. */}
    <div className="ops-frise" data-testid="frise" data-tenue={tenue ? '' : undefined}>
      <div className="ops-fr-rd">
        {tenue ? null : resume ?? <span><b className="ops-m">{n}</b> jour{n > 1 ? 's' : ''} · <b className="ops-m">{nbOperations}</b> opération{nbOperations > 1 ? 's' : ''}{horsPeriode ? <> · <b className="ops-m">{horsPeriode.split(' ')[0]}</b> {horsPeriode.split(' ').slice(1).join(' ')}</> : null}</span>}
        {plage && !resume && !tenue && <button type="button" className="ops-fr-x" aria-label="Revenir au mois entier" onClick={onMois}>× mois entier</button>}
      </div>
      <div className="ops-tr" ref={refPiste}>
        <span className="ops-sel" style={{ left: pct(duX), width: pct(auX - duX) }}/>
        <div className="ops-fjours" role="img" aria-label={`Dépense de chaque jour, ${titre}`} style={{ gridTemplateColumns: `repeat(${fenEff.nb}, minmax(0, 1fr))` }}>
          {jours.map((j, i) => {
            const p = cellules[i], hors = j < eff.du || j > eff.au || undefined;
            if (!dessine) return <span key={j} className="ops-fj" data-hors={hors}/>;
            if (!p) return <span key={j} className="ops-fj" data-hors={hors} data-inconnu=""/>;
            const t = total(p), h = t > 0 ? Math.max(2, Math.round((t / maxi) * HAUTEUR_MAX)) : 0;
            const { charges, materiel } = colonnesDe(p);
            return <span key={j} className="ops-fj" data-hors={hors}>
              {p.entreCents > 0 && <i className="ops-v" title="vente"/>}
              {h > 0 ? <span className="ops-bk" style={{ height: h }}>
                {[...charges, ...(materiel ? [materiel] : [])].map(c => <React.Fragment key={c.cle}>
                  {c.hachureCents > 0 && <i className="ops-hach" style={{ flex: c.hachureCents }}/>}
                  {c.cents - c.hachureCents > 0 && <i style={{ flex: c.cents - c.hachureCents, background: c.couleur }}/>}
                </React.Fragment>)}
              </span> : <i className="ops-z"/>}
            </span>;
          })}
        </div>
        {jours.map((j, i) => estLundi(j) ? <span key={`l${j}`} className="ops-lu" style={{ left: pct((i + 0.5) / fenEff.nb) }}/> : null)}
        {jours.map((j, i) => i > 0 && j.endsWith('-01') ? <span key={`m${j}`} className="ops-mois-1" style={{ left: pct(i / fenEff.nb) }}/> : null)}
        {poignee('du')}{poignee('au')}
        {tenue && <span className="ops-bulle" data-ancre={bulleX(xBulle)} style={{ left: pct(xBulle) }} aria-hidden="true"><Sup texte={titre}/></span>}
      </div>
      <div className="ops-ax" aria-hidden="true">
        {etiquettes.map(e => <span key={`${e.genre}${e.x}`} data-genre={e.genre} data-ancre={e.ancre} style={{ left: pct(e.x) }}><Sup texte={e.texte}/></span>)}
      </div>
    </div>
    {inconnus.length > 0 && <p className="ops-fr-note"><i aria-hidden="true"/>{inconnus.slice(0, 2).map(texteInconnu).join(' ; ')}{inconnus.length > 2 ? ' …' : ''} · aucune opération saisie</p>}
  </>;
}
