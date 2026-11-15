/*
 * Proposition du compagnon (maquette p2a) : pièces de `BrewerProposalCard` — BarreChangement, LigneChangement.
 * Props : BarreChangement {barre, unite?} (barre venue de `barreAvantApres`) ; LigneChangement {label, coche, onToggle, barre,
 * avant, apres, unite?, sousLignes?, raison?, disabled?}. Présentatif : la sélection et la décision restent dans la carte.
 */
import { Icone } from './parts';
import type { Barre } from './derive';

/** Un changement numérique en forme : carrés de jours, échelle de température, ou barres avant/après. Un texte ne se dessine pas. */
export function BarreChangement({ barre, unite = '' }: { barre: Barre; unite?: string }) {
  if (barre.genre === 'carres') {
    const commun = Math.min(barre.avant, barre.apres);
    const retires = Math.max(0, barre.avant - barre.apres);
    const ajoutes = Math.max(0, barre.apres - barre.avant);
    return (
      <span className="cmp-jours" role="img" aria-label={`${barre.avant} jours, puis ${barre.apres}`}>
        {Array.from({ length: commun + ajoutes }, (_, i) => (
          <u key={`p${i}`} />
        ))}
        {Array.from({ length: retires }, (_, i) => (
          <u key={`r${i}`} className="cmp-retire" />
        ))}
      </span>
    );
  }
  if (barre.genre === 'echelle') {
    const etendue = barre.max - barre.min || 1;
    const pos = (v: number) => ((v - barre.min) / etendue) * 100;
    const bas = Math.min(barre.avant, barre.apres);
    return (
      <span
        className="cmp-ech"
        role="img"
        aria-label={`Échelle de ${barre.min} à ${barre.max} ${unite || '°C'} : ${barre.avant}, puis ${barre.apres}`}
      >
        {barre.graduations.map((g) => (
          <u key={g} style={{ left: `${pos(g)}%` }} />
        ))}
        <span className="cmp-ech-fl" style={{ left: `${pos(bas)}%`, width: `${Math.abs(pos(barre.apres) - pos(barre.avant))}%` }} />
        <span className="cmp-ech-av" style={{ left: `${pos(barre.avant)}%` }} />
        <span className="cmp-ech-ap" style={{ left: `${pos(barre.apres)}%` }} />
        <small style={{ left: 0 }}>{barre.min}</small>
        <small style={{ left: '100%' }}>{barre.max}</small>
      </span>
    );
  }
  if (barre.genre === 'barre') {
    return (
      <span className="cmp-tr" aria-hidden="true">
        <span className="cmp-av" style={{ width: `${barre.avantPct}%` }} />
        <span className="cmp-ap" style={{ width: `${barre.apresPct}%` }} />
      </span>
    );
  }
  return null;
}

export interface SousLigne {
  label: string;
  avant: string;
  apres: string;
}

/**
 * Une ligne de proposition : case, libellé, barre, avant barré → après. Un changement composé (plusieurs différences)
 * garde son libellé de différence en texte, une sous-ligne par différence ; la raison du serveur reste dessous.
 */
export function LigneChangement({
  label,
  coche,
  onToggle,
  barre,
  avant,
  apres,
  unite,
  sousLignes = [],
  raison,
  disabled = false
}: {
  label: string;
  coche: boolean;
  onToggle: () => void;
  barre: Barre;
  avant?: string;
  apres?: string;
  unite?: string;
  sousLignes?: SousLigne[];
  raison?: string;
  disabled?: boolean;
}) {
  const simple = sousLignes.length === 0;
  return (
    <div className="cmp-ligne-prop">
      <div className={`cmp-br${simple && barre.genre !== 'texte' ? '' : ' cmp-br-simple'}`}>
        <button
          type="button"
          role="checkbox"
          aria-checked={coche}
          aria-label={label}
          disabled={disabled}
          className={`cmp-case${coche ? '' : ' cmp-off'}`}
          onClick={onToggle}
        >
          {coche ? <Icone nom="ok" /> : null}
        </button>
        <span>{label}</span>
        {simple && barre.genre !== 'texte' ? <BarreChangement barre={barre} unite={unite} /> : null}
        {simple ? (
          <span className="cmp-m">
            <span className="sr-only">Actuel : </span>
            <s className="cmp-n">{avant}</s>&nbsp;→&nbsp;<span className="sr-only">Proposé : </span>
            <span className="cmp-n">{apres}</span>
            {unite ? <>&nbsp;{unite}</> : null}
          </span>
        ) : null}
      </div>
      {sousLignes.map((s, i) => (
        <p key={i} className="cmp-sous-ligne">
          <span>{s.label}</span>
          <span className="cmp-m">
            <s className="cmp-n">{s.avant}</s>&nbsp;→&nbsp;<span className="cmp-n">{s.apres}</span>
          </span>
        </p>
      ))}
      {raison ? <small className="cmp-raison">{raison}</small> : null}
    </div>
  );
}
