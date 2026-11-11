import React from 'react';
import {
  echelleMaxG, fourchetteG, gParHl, grammesDuChoix, libelleSource, statutDose, type Sachet
} from '../domain/levure/sachet';

/**
 * p3 / 1C : la dose de levure choisie, dite en grammes et en g/hL pour le volume, posée sur la plage du fabricant.
 * Tout vient du catalogue (poids du sachet et plage, avec sa source) ; sans produit sûr, le poids n'est pas dit et la jauge s'efface.
 * « Pour 19 L prévus » : le volume de la recette, ou « relevés » quand le volume au fermenteur est mesuré.
 */
export interface PitchJaugeInfo {
  sachet: Sachet | null;
  volumeL?: number;
  /** `prévus` : volume de la recette ; `relevés` : volume mesuré au fermenteur. */
  volumeBase: 'prévus' | 'relevés';
}

const fr = (n: number, d = 1) => n.toFixed(d).replace('.', ',');
const frSobre = (n: number) => (Number.isInteger(n) ? String(n) : fr(n));

const VERDICT = { sous: 'sous la plage', dans: 'dans la plage', 'au-dessus': 'au-dessus de la plage' } as const;

export function BrewPitchJauge({ info, choix }: { info: PitchJaugeInfo; choix?: { amount?: number; unit?: string } }) {
  const { sachet, volumeL } = info;
  if (!(typeof volumeL === 'number' && volumeL > 0)) return null;
  const g = grammesDuChoix(choix, sachet);
  if (!sachet && g == null) return null;
  const ghl = gParHl(g, volumeL);
  const plage = sachet?.plageGHl;
  const statut = statutDose(ghl, plage);
  const fourchette = fourchetteG(plage, volumeL);
  const max = echelleMaxG(fourchette, g);
  const pc = (x: number) => `${Math.min(100, Math.max(0, (x / max) * 100))}%`;
  const verdict = g == null ? 'à choisir' : statut ? VERDICT[statut] : null;
  return (
    <div className="bz-jauge" role="group" aria-label="Dose de la levure pour le volume" data-statut={statut ?? (g == null ? 'vide' : undefined)}>
      <div className="bz-jauge-tete">
        <span className="bz-jauge-dose">
          Pour {frSobre(volumeL)} L {info.volumeBase}
          {g != null && <> · <b>{fr(g)} g</b> · <span className="bz-m">{Math.round(ghl!)} g/hL</span></>}
        </span>
        {verdict && <span className="bz-jauge-verdict">{verdict}</span>}
      </div>
      <div className="bz-jauge-barre" aria-hidden="true">
        <span className="bz-jauge-rail" />
        {fourchette && <span className="bz-jauge-bande" style={{ left: pc(fourchette.min), width: `calc(${pc(fourchette.max)} - ${pc(fourchette.min)})` }} />}
        <span className="bz-jauge-trait" style={{ left: g != null ? pc(g) : '50%' }} />
      </div>
      <div className="bz-jauge-grad" aria-hidden="true">
        <span className="bz-m">0</span>
        {fourchette && <span className="bz-m bz-jauge-bord" style={{ left: pc(fourchette.min) }}>{fr(fourchette.min)}</span>}
        {fourchette && <span className="bz-m bz-jauge-bord" style={{ left: pc(fourchette.max) }}>{fr(fourchette.max)}</span>}
        <span className="bz-m" style={{ left: '100%' }}>{max} g</span>
      </div>
      {fourchette && <p className="sr-only">Plage du fabricant pour ce volume : {fr(fourchette.min)} à {fr(fourchette.max)} g.</p>}
      {sachet && <p className="bz-jauge-source">{libelleSource(sachet)}</p>}
    </div>
  );
}
