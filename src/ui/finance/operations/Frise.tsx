import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PeriodeSynthese } from '../../../domain/finance/periodeSynthese';
import { colonnesDe } from './Piles';
import {
  PREMIER_JOUR, ajouterJours, contient, estLundi, etiquettesAxe, fenetreInitiale, finFenetre, jourCourt, jourDeFenetre, joursDeFenetre, joursEntre0,
  montrer, plageDuMois, plagesInconnues, pousser, texteInconnu, titreJours, xDebut, xFin, type Fenetre, type Plage,
} from './plage';

/**
 * La frise des jours (s2ap2, 14.11) : sous les piles, une barre par jour (hauteur = dépense du jour, à l'échelle), le point vert d'une vente sur
 * l'axe, deux poignées rondes qui bornent la plage. Motif WAI-ARIA « multi-thumb slider » : deux `role="slider"`, flèches ±1 jour, Page ±7,
 * Origine/Fin. Poussée contre le bord : la fenêtre glisse sur le mois voisin. Les jours d'un mois sans aucune opération saisie sont « inconnus »
 * (voile, ni point ni barre) : l'inconnu n'est jamais 0.
 */
export interface DonneesFrise {
  /** Les piles d'un seul jour (la règle de « dépensé » de `periodeSynthese`, jamais un second calcul). */
  periodeJour: (jour: string) => PeriodeSynthese;
  /** Le mois a-t-il au moins une opération saisie ? Sinon ses jours sont inconnus, pas vides. */
  moisSaisi: (mois: string) => boolean;
}

const HAUTEUR_MAX = 18, BORD = 3, ROUTE_MAX = 400;

/** La bulle de la poignée tenue reste dans la frise : collée à gauche ou à droite quand la poignée est près d'un bord (capture du 14.11 : « 22 oct. » coupé). */
const bulleX = (x: number) => (x < 0.22 ? 'gauche' : x > 0.78 ? 'droite' : undefined);

function Sup({ texte }: { texte: string }) {
  const [avant, apres] = texte.split('1er');
  return apres === undefined ? <>{texte}</> : <>{avant}1<sup>er</sup>{apres}</>;
}

export function Frise({ mois, plage, aujourdhui, jourMax, nbOperations, donnees, onPlage, onMois }: {
  mois: string; plage: Plage | null; aujourdhui: string; jourMax: string; nbOperations: number; donnees: DonneesFrise;
  onPlage: (du: string, au: string) => void; onMois: () => void;
}) {
  const eff = plage ?? plageDuMois(mois);
  const [fen, setFen] = useState<Fenetre>(() => fenetreInitiale(plage, mois));
  const fenEff = contient(fen, eff) ? fen : fenetreInitiale(plage, mois);
  useEffect(() => { if (fenEff !== fen) setFen(fenEff); }, [fenEff, fen]);
  const [tenue, setTenue] = useState<'du' | 'au' | null>(null);
  const piste = useRef<HTMLDivElement>(null);
  const vif = useRef({ fen: fenEff, eff, onPlage, jourMax });
  vif.current.fen = fenEff; vif.current.eff = eff; vif.current.onPlage = onPlage; vif.current.jourMax = jourMax;
  const glisse = useRef<{ cible: 'du' | 'au' | null; x0: number; decalage: number; sens: -1 | 0 | 1 } | null>(null);
  const poussee = useRef<number | null>(null);
  const arreter = () => { if (poussee.current !== null) { window.clearInterval(poussee.current); poussee.current = null; } };
  useEffect(() => arreter, []);

  /** Pose une borne : jamais hors des bornes de l'app, jamais une poignée au-delà de l'autre. */
  const cadrer = (cible: 'du' | 'au', jour: string): string => {
    const { eff: e, jourMax: max } = vif.current;
    const j = jour < PREMIER_JOUR ? PREMIER_JOUR : jour > max ? max : jour;
    return cible === 'du' ? (j > e.au ? e.au : j) : (j < e.du ? e.du : j);
  };
  const poser = (cible: 'du' | 'au', jour: string) => {
    const { eff: e, onPlage: pose } = vif.current;
    const j = cadrer(cible, jour);
    const [du, au] = cible === 'du' ? [j, e.au] : [e.du, j];
    if (du === e.du && au === e.au) return;
    vif.current.eff = { du, au };
    pose(du, au);
  };
  const pousseUnPas = () => {
    const g = glisse.current;
    if (!g?.cible || !g.sens) return;
    const f = pousser(vif.current.fen, vif.current.eff, g.sens);
    const jour = g.sens < 0 ? f.debut : finFenetre(f);
    if (jour < PREMIER_JOUR || jour > vif.current.jourMax) { arreter(); return; }
    vif.current.fen = f; setFen(f); poser(g.cible, jour);
  };
  const bouger = (clientX: number) => {
    const g = glisse.current, tr = piste.current;
    if (!g || !tr) return;
    const r = tr.getBoundingClientRect(), x = clientX - g.decalage;
    if (!g.cible) {
      if (Math.abs(clientX - g.x0) < 3) return;
      g.cible = clientX < g.x0 ? 'du' : 'au'; setTenue(g.cible);
    }
    const sens = g.cible === 'du' && x < r.left - BORD ? -1 : g.cible === 'au' && x > r.right + BORD ? 1 : 0;
    g.sens = sens;
    if (sens) { if (poussee.current === null) { pousseUnPas(); poussee.current = window.setInterval(pousseUnPas, 110); } return; }
    arreter();
    const { fen: f } = vif.current, cellule = Math.round(((x - r.left) / r.width) * f.nb);
    poser(g.cible, jourDeFenetre(f, g.cible === 'du' ? cellule : cellule - 1));
  };
  const saisir = (e: React.PointerEvent<HTMLElement>, quelle: 'du' | 'au') => {
    const tr = piste.current; if (!tr) return;
    e.preventDefault(); e.currentTarget.setPointerCapture?.(e.pointerId);
    const r = tr.getBoundingClientRect(), { fen: f, eff: p } = vif.current;
    const centre = r.left + (quelle === 'du' ? xDebut(f, p.du) : xFin(f, p.au)) * r.width;
    const egal = p.du === p.au;
    glisse.current = { cible: egal ? null : quelle, x0: e.clientX, decalage: e.clientX - centre, sens: 0 };
    setTenue(egal ? null : quelle);
  };
  const lacher = () => { arreter(); glisse.current = null; setTenue(null); };
  const toucher = (e: React.MouseEvent<HTMLDivElement>) => {
    const tr = piste.current; if (!tr) return;
    const r = tr.getBoundingClientRect(), { fen: f, eff: p } = vif.current;
    const jour = jourDeFenetre(f, Math.floor(((e.clientX - r.left) / r.width) * f.nb));
    const cible = jour < p.du ? 'du' : jour > p.au ? 'au' : joursEntre0(p.du, jour) <= joursEntre0(jour, p.au) ? 'du' : 'au';
    poser(cible, jour);
  };
  const clavier = (e: React.KeyboardEvent, quelle: 'du' | 'au') => {
    const { eff: p, fen: f } = vif.current, ici = quelle === 'du' ? p.du : p.au;
    const pas: Record<string, string> = {
      ArrowLeft: ajouterJours(ici, -1), ArrowDown: ajouterJours(ici, -1), ArrowRight: ajouterJours(ici, 1), ArrowUp: ajouterJours(ici, 1),
      PageUp: ajouterJours(ici, 7), PageDown: ajouterJours(ici, -7), Home: quelle === 'du' ? f.debut : p.du, End: quelle === 'du' ? p.au : finFenetre(f),
    };
    if (!(e.key in pas)) return;
    e.preventDefault();
    const jour = cadrer(quelle, pas[e.key]);
    const nouvelle = montrer(f, p, jour);
    if (nouvelle !== f) { vif.current.fen = nouvelle; setFen(nouvelle); }
    poser(quelle, jour);
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
  const poignee = (quelle: 'du' | 'au') => {
    const jour = quelle === 'du' ? eff.du : eff.au, x = quelle === 'du' ? duX : auX;
    return <span key={quelle} className="ops-h" data-tenue={tenue === quelle || undefined} style={{ left: pct(x) }} role="slider" tabIndex={0}
      aria-label={quelle === 'du' ? 'Début' : 'Fin'} aria-orientation="horizontal" aria-valuemin={joursEntre0(PREMIER_JOUR, quelle === 'du' ? PREMIER_JOUR : eff.du)}
      aria-valuemax={joursEntre0(PREMIER_JOUR, quelle === 'du' ? eff.au : jourMax)} aria-valuenow={joursEntre0(PREMIER_JOUR, jour)} aria-valuetext={jourCourt(jour, true, true)}
      onPointerDown={e => saisir(e, quelle)} onPointerMove={e => bouger(e.clientX)} onPointerUp={lacher} onPointerCancel={lacher} onClick={e => e.stopPropagation()}
      onKeyDown={e => clavier(e, quelle)}><i className="ops-gp"/></span>;
  };
  return <>
    <div className="ops-frise" data-testid="frise">
      <div className="ops-fr-rd">
        <span><b className="ops-m">{n}</b> jour{n > 1 ? 's' : ''} · <b className="ops-m">{nbOperations}</b> opération{nbOperations > 1 ? 's' : ''}</span>
        {plage && <button type="button" className="ops-fr-x" aria-label="Revenir au mois entier" onClick={onMois}>× mois entier</button>}
      </div>
      <div className="ops-tr" ref={piste} onClick={toucher}>
        <span className="ops-sel" style={{ left: pct(duX), width: pct(auX - duX) }}/>
        <div className="ops-fjours" role="img" aria-label={`Dépense de chaque jour, ${titre}`} style={{ gridTemplateColumns: `repeat(${fenEff.nb}, 1fr)` }}>
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
        {tenue && <span className="ops-bulle" data-ancre={bulleX(tenue === 'du' ? duX : auX)} style={{ left: pct(tenue === 'du' ? duX : auX) }} aria-hidden="true"><Sup texte={titre}/></span>}
      </div>
      <div className="ops-ax" aria-hidden="true">
        {etiquettes.map(e => <span key={`${e.genre}${e.x}`} data-genre={e.genre} data-ancre={e.ancre} style={{ left: pct(e.x) }}><Sup texte={e.texte}/></span>)}
      </div>
    </div>
    {inconnus.length > 0 && <p className="ops-fr-note"><i aria-hidden="true"/>{inconnus.slice(0, 2).map(texteInconnu).join(' ; ')}{inconnus.length > 2 ? ' …' : ''} · aucune opération saisie</p>}
  </>;
}
