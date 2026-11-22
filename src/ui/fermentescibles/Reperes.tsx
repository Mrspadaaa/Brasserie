import React from 'react';
import { Chevron, Rendement, Verre } from './icones';
import { fr, pc, teinte } from './modele';
import { nombreFr } from '../../domain/nombreAffiche';

export interface PropsReperes {
  /** Rendement en fermenteur retenu par la recette (profil, recette ou 75 % par défaut). */
  rendementPct: number;
  /** Faux : personne ne l'a déclaré, 75 % est un repère, pas une mesure. */
  rendementDeclare: boolean;
  /** OG attendue du moteur, `null` si elle est incalculable. */
  og: number | null;
  ogPlage?: { min: number; max: number };
  /** Teinte de la bière du moteur, `null` si un malt n'a pas sa couleur. */
  teinteBiere: { ebc: number; label: string } | null;
  ebcPlage?: { min: number; max: number };
  /** Nombre de grains dont la couleur manque. */
  aRenseigner: number;
  ouvert: boolean;
  onBascule: () => void;
  onRenseigner: () => void;
}

const A = 1.04, B = 1.1;
const ogTxt = (o: number | null) => (o == null ? '—' : `~${fr(o, 3)}`);
const T0 = [0, 2, 4, 7, 12, 20, 35, 40].map((x) => `${teinte(x)} ${nombreFr((x / 40) * 100, 1)}%`).join(',');

/** Les repères de la recette (r4-a) : OG attendue face à celle du style, teinte face à celle du style. Aucun nombre n'est refait ici. */
export const Reperes: React.FC<PropsReperes> = ({ rendementPct, rendementDeclare, og, ogPlage, teinteBiere, ebcPlage, aRenseigner, ouvert, onBascule, onRenseigner }) => {
  const e = teinteBiere?.ebc ?? null;
  const ogMilieu = ogPlage ? (pc(ogPlage.min, A, B) + pc(ogPlage.max, A, B)) / 2 : 0;
  const horsOg = og == null ? null : og > B ? 'haut' : og < A ? 'bas' : null;
  return (
    <section className="fer-reps" data-role="reps" aria-label="Repères de la recette" data-booster="reperes">
      <div className="fer-rh">
        <span className="fer-lb"><Rendement />Rendement</span>
        {!rendementDeclare && <span className="fer-rep">repère</span>}
        <button type="button" className="fer-pl" data-role="pli" aria-expanded={ouvert} aria-label={`${ouvert ? 'Replier' : 'Déplier'} les repères`} onClick={onBascule}>
          <Chevron />
        </button>
        {/* Repliés (d'eux-mêmes quand le pied sortirait du premier écran, ou à la main), les repères gardent le compte des couleurs à renseigner : la saisie à la volée (D211) ne se cache pas. */}
        {!ouvert && aRenseigner > 0 && (
          <button type="button" className="fer-arens fer-arens-court" data-role="arens" data-booster="a-renseigner" onClick={onRenseigner}>
            <span className="fer-m">{aRenseigner}</span><span className="fer-long">&nbsp;couleur{aRenseigner > 1 ? 's' : ''}</span>&nbsp;à renseigner
          </button>
        )}
        <span className="fer-gd">{fr(rendementPct, rendementPct % 1 ? 1 : 0)}<small>%</small></span>
      </div>
      {ouvert && (
        <>
          <div className="fer-ech" role="img" aria-label={`OG attendue ${ogTxt(og)}${horsOg ? ', hors de l’échelle 1,040–1,100' : ''}${ogPlage ? `, plage du style de ${fr(ogPlage.min, 3)} à ${fr(ogPlage.max, 3)}` : ''}`}>
            <div className="fer-tr" style={{ background: 'linear-gradient(90deg,#F2F2F2,#C9C9C9)' }} />
            {ogPlage && <div className="fer-zone" style={{ left: `${pc(ogPlage.min, A, B)}%`, width: `${pc(ogPlage.max, A, B) - pc(ogPlage.min, A, B)}%` }} />}
            {ogPlage && <span className="fer-zl" style={{ left: `${ogMilieu}%` }}>style {fr(ogPlage.min, 3)}–{fr(ogPlage.max, 3)}</span>}
            {og != null && (
              // Hors de l'échelle (1,040–1,100), le repère reste au bord mais le dit : « ~1,290 › » (AM 3 et A11 du 08.11 : rien ne se borne en silence).
              <><b className="fer-mk" style={{ left: `${pc(og, A, B)}%` }} />
                <span className={`fer-ebcl fer-ogl${horsOg ? ' fer-hors' : ''}`} data-hors={horsOg ? 'og' : undefined}
                  style={{ left: `${pc(og, A, B)}%`, ...(horsOg === 'haut' ? { transform: 'translateX(-100%)' } : horsOg === 'bas' ? { transform: 'none' } : {}) }}>
                  {horsOg === 'bas' ? '‹ ' : ''}{ogTxt(og)}{horsOg === 'haut' ? ' ›' : ''}
                </span></>
            )}
          </div>
          <div className="fer-rh">
            <span className="fer-lb"><Verre /></span>
            {aRenseigner > 0 && (
              <button type="button" className="fer-arens" data-role="arens" data-booster="a-renseigner" onClick={onRenseigner}>
                <span className="fer-m">{aRenseigner}</span> couleur{aRenseigner > 1 ? 's' : ''} à renseigner
              </button>
            )}
            <span className="fer-gd fer-mot">{teinteBiere ? teinteBiere.label : '—'}</span>
          </div>
          <div className="fer-ech" role="img" aria-label={`Teinte : échelle de 0 à 40 EBC${e != null && e > 40 ? ', bière hors de l’échelle' : ''}${ebcPlage ? `, style de ${ebcPlage.min} à ${ebcPlage.max}` : ''}${e == null ? ', teinte inconnue' : `, bière à ${fr(e, 1)} EBC`}`}>
            <div className="fer-tr" style={{ background: `linear-gradient(90deg,${T0})` }} />
            {ebcPlage && <div className="fer-zone" style={{ left: `${pc(ebcPlage.min, 0, 40)}%`, width: `${pc(ebcPlage.max, 0, 40) - pc(ebcPlage.min, 0, 40)}%` }} />}
            {/* Une plage tout au bout de l'échelle (style 59–79 pour une stout) : l'étiquette se cale sur le bord droit au lieu de déborder du cadre. */}
            {ebcPlage && <span className="fer-zl" style={pc((ebcPlage.min + ebcPlage.max) / 2, 0, 40) > 80 ? { left: 'auto', right: 8, transform: 'none' } : { left: `${pc((ebcPlage.min + ebcPlage.max) / 2, 0, 40)}%` }}>style {ebcPlage.min}–{ebcPlage.max}</span>}
            {e != null && <b className="fer-mk" style={{ left: `${pc(e, 0, 40)}%` }} />}
            {/* AM-11 : hors de l'échelle (0–40 EBC), le repère reste au bord mais le dit : « 63,3 EBC › » (comme l'OG), jamais collé au bord sans un mot. */}
            {e != null && e > 40 && <span className="fer-ebcl fer-hors" data-hors="ebc" style={{ left: 'auto', right: 8, top: 19, transform: 'none' }}>{fr(e, 1)} EBC ›</span>}
          </div>
        </>
      )}
    </section>
  );
};
