import React, { useEffect, useRef, useState } from 'react';
import type { Fermentable } from '../../types';
import type { LearnIngredient } from '../../domain/ingredientFacts';
import { ChampLigne } from './ChampLigne';
import { Fiche } from './Fiche';
import { CouleurChamp } from './CouleurChamp';
import { Corbeille, Cube, Moins, Plus16, Croix, Tour } from './icones';
import { arrondiKg, cran, fr, graduationsPiste, kgTxt, MOMENT_SUIVANT, MOT_MOMENT, pas, pmax, teinte } from './modele';

/**
 * Le plateau (D212 : toujours visible, clair) : le détail de la ligne choisie. Sa couleur, son moment, la corbeille ; la lecture de la
 * masse avec − et + (un cran) ; la piste graduée (le doigt pose la masse au cran) ; le jour d'ajout quand c'est la fermentation.
 */
export const Plateau: React.FC<{
  f: Fermentable | undefined;
  i: number;
  setKg: (i: number, kg: number) => void;
  setJour: (i: number, jour: number) => void;
  tourner: (i: number) => void;
  retirer: (i: number) => void;
  setCouleur: (i: number, v: number) => void;
  /** La fiche technique du malt (PPG, assistant) : une ligne dans le plateau (D226). */
  patch: (i: number, p: Partial<Fermentable>) => void;
  onLearnIngredient?: LearnIngredient;
  /** Entrée dans la lecture : le focus repart vers le champ d'ajout. */
  versAjout: () => void;
}> = ({ f, i, setKg, setJour, tourner, retirer, setCouleur, patch, onLearnIngredient, versAjout }) => {
  const [saisieEbc, setSaisieEbc] = useState(false);
  const [fixe, setFixe] = useState<number | null>(null);
  const piste = useRef<HTMLDivElement | null>(null);
  const glisse = useRef(false);
  // La plage de la piste reste fixe tant qu'on y travaille ; elle se recalcule quand on change de ligne.
  useEffect(() => { setFixe(null); setSaisieEbc(false); }, [i, f?.name]);

  if (!f) return <section className="fer-bal" id="fer-bal" data-role="bal" aria-label="Détail de l’ingrédient" data-booster="balance" hidden />;

  const grain = f.kind === 'grain';
  const M = fixe ?? pmax(f.weightKg);
  const x = Math.min(100, (f.weightKg / M) * 100);
  const fond = grain && f.colorEbc != null ? teinte(f.colorEbc) : grain ? 'linear-gradient(90deg,#7A7A7A,#333)' : 'radial-gradient(circle,#9E9E9E 1px,transparent 1.4px) 0 0/4px 4px,#E6E6E6';
  const surPiste = (clientX: number, m: number) => {
    const r = piste.current?.getBoundingClientRect();
    if (!r || !r.width) return;
    setKg(i, cran(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * m));
  };
  const graduations = graduationsPiste(M).map((g, k) => <i key={k} className={g.grosse ? 'fer-g' : ''} style={{ left: `${(g.v / M) * 100}%` }} />);

  let sw: React.ReactNode;
  if (!grain) sw = <span className="fer-bpas fer-pas-fam" aria-hidden="true"><Cube /></span>;
  else if (saisieEbc) {
    sw = (
      <CouleurChamp courante={f.colorEbc ?? null} libelle={`Couleur de ${f.name}, en EBC`} className="fer-ebc fer-ebc-p"
        marques={{ 'data-ebc': i }} onFin={(mode, v) => { setSaisieEbc(false); if (mode !== 'echap' && v != null) setCouleur(i, v); }} />
    );
  } else if (f.colorEbc == null) {
    sw = <button type="button" className="fer-bpas fer-inc" data-role="bteinte" data-teinte={i} data-booster="teinte-plateau" aria-label={`Couleur de ${f.name} à renseigner`} onClick={() => setSaisieEbc(true)}>?</button>;
  } else {
    sw = <button type="button" className="fer-bpas" data-role="bteinte" data-teinte={i} data-booster="teinte-plateau" style={{ background: teinte(f.colorEbc) }}
      aria-label={`Couleur de ${f.name} : ${String(f.colorEbc).replace('.', ',')} EBC`} onClick={() => setSaisieEbc(true)} />;
  }

  return (
    <section className="fer-bal" id="fer-bal" data-role="bal" aria-label="Détail de l’ingrédient" data-booster="balance">
      <div className="fer-bh" data-role="bh">
        {sw}<b>{f.name}</b>{saisieEbc && <span className="fer-mo2">EBC, Entrée</span>}
        <button type="button" className="fer-bmo" data-mom={i} data-m={MOT_MOMENT[f.use]} data-booster="moment-cycle"
          aria-label={`Moment de ${f.name} : ${MOT_MOMENT[f.use]}. Toucher : ${MOT_MOMENT[MOMENT_SUIVANT(f.use)]}`}
          onClick={() => tourner(i)}>{MOT_MOMENT[f.use]}<Tour /></button>
        <button type="button" className="fer-del" data-del={i} aria-label={`Supprimer ${f.name} de la recette`} onClick={() => retirer(i)}><Corbeille /></button>
      </div>
      <div className="fer-lect" data-role="lect">
        <button type="button" className="fer-sb" data-pas="-1" aria-label="Retirer un cran" onClick={() => setKg(i, pas(f.weightKg, -1))}><Moins /></button>
        <label className="fer-num">
          <ChampLigne valeur={f.weightKg} onValeur={(v) => setKg(i, v)} format={kgTxt} arrondi={arrondiKg} cran={(v, d) => pas(v, d)}
            libelle={`Masse de ${f.name}, en kg`} className="fer-bin" auContenu videVaut0 zeroAttention marques={{ 'data-role': 'bin' }}
            onEntree={() => { versAjout(); return true; }} />
          <span className="fer-bu">kg</span>
        </label>
        <button type="button" className="fer-sb" data-pas="1" aria-label="Ajouter un cran" onClick={() => setKg(i, pas(f.weightKg, 1))}><Plus16 /></button>
      </div>
      <div className="fer-piste" data-role="piste" data-booster="piste-masse" aria-hidden="true" ref={piste}
        onPointerDown={(e) => { const m = pmax(f.weightKg); setFixe(m); glisse.current = true; e.currentTarget.setPointerCapture(e.pointerId); surPiste(e.clientX, m); }}
        onPointerMove={(e) => { if (glisse.current) surPiste(e.clientX, M); }}
        onPointerUp={() => { glisse.current = false; }} onPointerCancel={() => { glisse.current = false; }}>
        <div className="fer-ptr"><div className="fer-pf" style={{ width: `${x}%`, background: fond }} /></div>
        <b className="fer-pouce2" style={{ left: `${x}%` }} />
      </div>
      <div className="fer-gr" data-role="grad" aria-hidden="true">
        {graduations}
        <span style={{ left: 0, transform: 'none' }}>0</span>
        <span style={{ left: '100%', transform: 'translateX(-100%)' }}>{fr(M, M % 1 ? 1 : 0)} ›</span>
      </div>
      <div data-role="jours">
        {f.use === 'fermentation' && (
          <div className="fer-jours">
            <label>J+
              <ChampLigne valeur={f.dayOffset ?? 0} onValeur={(v) => setJour(i, v)} format={(v) => String(v)} arrondi={(v) => Math.max(0, Math.round(v))}
                cran={(v, d) => Math.max(0, v + d)} zeroValide entier repos={String(f.dayOffset ?? 0)} libelle={`Jour d’ajout de ${f.name}`}
                className="fer-jin" marques={{ 'data-jour': i }} />
            </label>
            <div className="fer-jp">
              <div className="fer-jt" />
              <span className="fer-jl-lab" style={{ left: 0, transform: 'none' }}>J0</span>
              <span className="fer-jl-lab" style={{ left: '50%' }}>J7</span>
              <span className="fer-jl-lab" style={{ left: '100%', transform: 'translateX(-100%)' }}>J14</span>
              <input className="fer-jr" type="range" min={0} max={14} step={1} value={Math.min(14, f.dayOffset ?? 0)} data-jr={i} data-booster="regle-jours"
                aria-label={`Jour d’ajout de ${f.name}, au curseur`} onChange={(e) => setJour(i, Number(e.target.value))} />
            </div>
          </div>
        )}
      </div>
      {grain && <Fiche malt={f} onChange={(p) => patch(i, p)} onLearnIngredient={onLearnIngredient} />}
    </section>
  );
};

export { Croix };
