import React, { useRef, useState } from 'react';
import type { Fermentable, FermentableKind } from '../../types';
import { ChampLigne } from './ChampLigne';
import { CouleurChamp } from './CouleurChamp';
import { Croix, Cube, Tour } from './icones';
import {
  arrondiKg, autresKg, cran, cranPas, grainKg, kgPourPart, kgTxt, MOMENT_SUIVANT, MOT_MOMENT, nu, pas, partN, teinte, voile,
} from './modele';

export interface AnnMoment { i: number; use: Fermentable['use']; dayOffset?: number; t: number }

export interface ActionsLigne {
  selectionner: (i: number) => void;
  retirer: (i: number) => void;
  setKg: (i: number, kg: number) => void;
  setJour: (i: number, jour: number) => void;
  tourner: (i: number) => void;
  annulerMoment: () => void;
  ouvrirEbc: (i: number) => void;
  finEbc: (i: number, mode: 'ok' | 'echap' | 'sortie', v: number | null) => void;
  /** Entrée dans la masse de la ligne i : vrai si le focus est reparti vers le champ d'ajout. */
  entreeMasse: (i: number) => boolean;
  tabMasse: (i: number, decalage: 1 | -1) => boolean;
}

export interface LigneProps {
  f: Fermentable;
  i: number;
  fermentables: readonly Fermentable[];
  selectionnee: boolean;
  neuf: boolean;
  couleurOuverte: boolean;
  annMom: AnnMoment | null;
  nolo: boolean;
  etiquetteFamille: string;
  /** La plage de la barre pour une ligne qui n'est pas une part du grain. */
  echelle: number;
  invalide: boolean;
  decrit?: string;
  a: ActionsLigne;
}

const enPart = (f: Fermentable, i: number, l: readonly Fermentable[]) => f.kind === 'grain' && autresKg(l, i) > 0;

function Pastille({ f, i, ouverte, a }: { f: Fermentable; i: number; ouverte: boolean; a: ActionsLigne }) {
  if (f.kind !== 'grain') return <span className="fer-pas fer-pas-fam" aria-hidden="true"><Cube /></span>;
  const inconnue = f.colorEbc == null;
  // r4e : la couleur se tape sur la ligne. Un toucher sur la pastille la change en champ EBC, à sa place.
  if (ouverte) {
    return (
      <CouleurChamp courante={f.colorEbc ?? null} libelle={`Couleur de ${f.name}, en EBC`} className="fer-ebc"
        marques={{ 'data-role': 'couleur-ligne', 'data-ebcl': i, 'data-booster': 'couleur-sur-ligne' }}
        onFin={(mode, v) => a.finEbc(i, mode, v)} />
    );
  }
  return inconnue ? (
    <button type="button" className="fer-pas fer-inc" data-role="couleur-ligne" data-cl={i} data-booster="couleur-sur-ligne"
      aria-label={`Couleur de ${f.name} à renseigner, en EBC`} onClick={() => a.ouvrirEbc(i)}>?</button>
  ) : (
    <button type="button" className="fer-pas" data-role="couleur-ligne" data-cl={i} data-booster="couleur-sur-ligne"
      style={{ background: teinte(f.colorEbc as number) }} aria-label={`Couleur de ${f.name} : ${String(f.colorEbc).replace('.', ',')} EBC`}
      onClick={() => a.ouvrirEbc(i)} />
  );
}

/** Une ligne du ticket (s1) : le nom, la masse tapée, le moment sans pilule, la part, et la barre qui porte la masse. */
export const Ligne: React.FC<LigneProps> = ({ f, i, fermentables, selectionnee, neuf, couleurOuverte, annMom, nolo, etiquetteFamille, echelle, invalide, decrit, a }) => {
  const [tire, setTire] = useState(false);
  const geste = useRef<{ id: number; x0: number; g: number; w: number; av: number; bouge: boolean; part: boolean } | null>(null);
  const grain = f.kind === 'grain';
  const part = enPart(f, i, fermentables);
  const total = grainKg(fermentables);
  const largeur = part ? (total ? (f.weightKg / total) * 100 : 0) : Math.min(100, (f.weightKg / echelle) * 100);
  const maxCur = part ? kgPourPart(fermentables, i, 95) ?? f.weightKg : echelle;
  const fond = grain && f.colorEbc != null ? { ['--fond' as string]: voile(f.colorEbc) } : undefined;
  const suivant = MOMENT_SUIVANT(f.use);
  const ferm = f.use === 'fermentation';
  const jour = f.dayOffset ?? 0;
  const ann = annMom && annMom.i === i ? annMom : null;

  const poser = (x: number) => {
    const g = geste.current;
    if (!g) return;
    const kg = g.part ? kgPourPart(fermentables, i, Math.round(Math.min(0.95, x) * 100)) : x * echelle;
    if (kg != null) a.setKg(i, cran(kg));
  };
  const clic = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, label, .fer-bw')) return;
    a.selectionner(i);
  };

  const pc = grain
    ? <span className="fer-pc" data-pc={i}><span className="fer-pn">{total ? partN(fermentables, f) : '—'}</span> %{ann ? '' : ' du grain'}</span>
    : <span className="fer-pc" data-pc={i}>{nolo && f.use === 'fermentation' ? 'Sucres : bilan NOLO' : `${f.fermentabilityPct ?? 100} % ferm.`}</span>;

  const bouton = (
    <button type="button" className="fer-mo" data-role="moment-ligne" data-ml={i} data-m={ferm ? undefined : MOT_MOMENT[f.use]} data-booster="moment-tourne"
      aria-label={`Moment de ${f.name} : ${MOT_MOMENT[f.use]}. Toucher : ${MOT_MOMENT[suivant]}`} onClick={() => a.tourner(i)}>
      {ferm ? 'J+' : <>{MOT_MOMENT[f.use]}<Tour /></>}
    </button>
  );

  return (
    <li className={`fer-li${neuf ? ' fer-neuf' : ''}${couleurOuverte ? ' fer-ebcon' : ''}${tire ? ' fer-tire' : ''}`}
      data-sel={i} aria-current={selectionnee ? 'true' : undefined} style={fond} onClick={clic}>
      <Pastille f={f} i={i} ouverte={couleurOuverte} a={a} />
      <span className="fer-nm">
        <button type="button" id={`fer-nom-${i}`} className="fer-nom" data-role="nom" data-booster="nom-detail" aria-expanded={selectionnee} aria-controls="fer-bal"
          onClick={() => a.selectionner(i)}><b>{f.name}</b></button>
        {/* Une étiquette de famille ne répète jamais le nom de la ligne (B1 n° 11 : « Lactose · Lactose »). */}
        {!grain && nu(etiquetteFamille) !== nu(f.name) && <span className="fer-tag">{etiquetteFamille}</span>}
      </span>
      <label className="fer-kg fer-kgl" data-tk={i}>
        <ChampLigne valeur={f.weightKg} onValeur={(v) => a.setKg(i, v)} format={kgTxt} arrondi={arrondiKg} cran={(v, d) => pas(v, d)}
          libelle="Quantité en kg" id={`wz-fermentable-${i}`} className="fer-kgin" auContenu videVaut0 zeroAttention invalide={invalide} decrit={`${decrit ? decrit + ' ' : ''}fer-nom-${i}`}
          marques={{ 'data-role': 'kg-ligne', 'data-kl': i, 'data-booster': 'masse-sur-ligne' }}
          onEntree={() => a.entreeMasse(i)} onTab={(d) => a.tabMasse(i, d)} />
        <small>kg</small>
      </label>
      <span className="fer-l2">
        {ferm ? (
          <span className="fer-mf" data-m="fermentation">
            {bouton}
            <ChampLigne valeur={jour} onValeur={(v) => a.setJour(i, v)} format={(v) => String(v)} arrondi={(v) => Math.max(0, Math.round(v))}
              cran={(v, d) => Math.max(0, v + d)} zeroValide entier repos={String(jour)} libelle={`Jour d’ajout de ${f.name} en fermentation`}
              className="fer-jl" marques={{ 'data-role': 'jour-ligne', 'data-jl': i }} />
          </span>
        ) : bouton}
        {pc}
        {ann && (
          <button type="button" className="fer-annm" data-role="annuler-moment" data-am={i} aria-label={`Annuler : rendre ${MOT_MOMENT[ann.use]}`}
            onClick={a.annulerMoment}>
            Annuler<i className="fer-file" style={{ animationDelay: `-${Date.now() - ann.t}ms` }} aria-hidden="true" />
          </button>
        )}
        <span className="fer-bw" data-role={grain ? 'part-ligne' : undefined} data-bw={i} data-booster="masse-barre-tiree"
          onPointerDown={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            geste.current = { id: e.pointerId, x0: e.clientX, g: r.left, w: r.width, av: f.weightKg, bouge: false, part };
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* le doigt a déjà quitté */ }
          }}
          onPointerMove={(e) => {
            const g = geste.current;
            if (!g || e.pointerId !== g.id) return;
            if (!g.bouge && Math.abs(e.clientX - g.x0) < 4) return;
            if (!g.bouge) { g.bouge = true; setTire(true); }
            poser(Math.max(0, Math.min(1, (e.clientX - g.g) / g.w)));
          }}
          onPointerUp={(e) => { if (geste.current && e.pointerId === geste.current.id) { geste.current = null; setTire(false); } }}
          onPointerCancel={(e) => {
            const g = geste.current;
            if (!g || e.pointerId !== g.id) return;
            geste.current = null; setTire(false); a.setKg(i, g.av);
          }}>
          <span className="fer-cur" data-role="masse-curseur" data-mk={i} role="slider" tabIndex={0} aria-label={`Masse de ${f.name}`}
            aria-valuemin={0} aria-valuemax={maxCur} aria-valuenow={f.weightKg} aria-valuetext={`${kgTxt(f.weightKg)} kg`}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && geste.current) { e.preventDefault(); const g = geste.current; geste.current = null; setTire(false); a.setKg(i, g.av); return; }
              const d = ({ ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 } as Record<string, number>)[e.key];
              if (!d) return;
              e.preventDefault();
              let kg = f.weightKg;
              for (let n = 0; n < (e.shiftKey ? 10 : 1); n++) kg = cranPas(kg, d);
              a.setKg(i, kg);
            }}>
            <i className="fer-barre" aria-hidden="true">
              <i data-bar={i} className={grain ? (f.colorEbc == null ? 'fer-inc' : '') : 'fer-pt'}
                style={{ width: `${largeur}%`, ...(grain && f.colorEbc != null ? { background: teinte(f.colorEbc) } : {}) }} />
            </i>
            <b className="fer-pouce" data-po={i} style={{ left: `${largeur}%` }} />
          </span>
        </span>
      </span>
      <button type="button" className="fer-ret" data-role="retirer" data-ret={i} data-booster="retrait-annulable" aria-label={`Retirer ${f.name}`}
        onClick={() => a.retirer(i)}><Croix /></button>
    </li>
  );
};

export type { FermentableKind };
