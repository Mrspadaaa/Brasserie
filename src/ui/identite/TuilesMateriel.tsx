import React, { useEffect, useId, useState } from 'react';
import { ChampNombre } from './ChampNombre';
import { fr } from './regles';

const CHEVRON = (
  <span className="idn-chev" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
  </span>
);

export type BaseEspaceLibre = 'manual' | 'manufacturer' | 'profile' | 'provisional';
const ETIQUETTE: Record<BaseEspaceLibre, string> = { manual: 'choisi', manufacturer: 'levure', profile: 'repère', provisional: 'repère' };

export interface TuilesMaterielProps {
  /** Espace libre du fermenteur retenu pour cette recette ; undefined = pas de matériel chiffré. */
  espaceLibrePct?: number;
  baseEspaceLibre?: BaseEspaceLibre;
  /** Le choix pour ce brassin (réserve, rinçage) : le composant existant. */
  contenuEspace?: React.ReactNode;
  /** Nom du matériel du plan ; undefined = aucun profil. */
  materielNom?: string;
  capaciteL?: number;
  profilL?: number;
  onCapacite: (v: number) => void;
  /** « ↺ profil » : rend la capacité du profil d'équipement. */
  onRaz: () => void;
  /** Une alerte d'installation est en cours : la tuile « Espace libre » (choix pour ce brassin) s'ouvre. */
  alerte?: boolean;
  ouvertMateriel: boolean;
  onOuvertMateriel: (o: boolean) => void;
  /** Adapter la recette, résumé des volumes : ce que l'écran offrait déjà sous le plan. */
  contenuMateriel?: React.ReactNode;
}

/** Les deux tuiles du bas (r4-a) : « Espace libre » et « Matériel », qui se déplient sur place. */
export function TuilesMateriel(p: TuilesMaterielProps) {
  const [ouvertEspace, setOuvertEspace] = useState(false);
  const idEspace = useId();
  const idMateriel = useId();
  useEffect(() => { if (p.alerte) setOuvertEspace(true); }, [p.alerte]);
  const sansProfil = !Number.isFinite(p.capaciteL) || !Number.isFinite(p.profilL);
  const ecart = !sansProfil && p.capaciteL !== p.profilL;
  const base = p.baseEspaceLibre ?? 'provisional';
  if (p.espaceLibrePct === undefined && p.materielNom === undefined) return null;
  return (
    <div className="idn-plis">
      {p.espaceLibrePct !== undefined && (
        <div className={`idn-tuile${ouvertEspace ? ' idn-ouvert' : ''}`} data-element="r4a-espace-libre">
          <button type="button" className="idn-pli" aria-expanded={ouvertEspace} aria-controls={idEspace} onClick={() => setOuvertEspace((o) => !o)}>
            <span className="idn-k">
              <i style={{ display: 'block', width: 22, height: 16, borderRadius: 10, border: '1px solid rgb(var(--cave-700))', background: 'repeating-linear-gradient(135deg, rgb(var(--cave-700)) 0 2px, rgb(var(--cave-950)) 2px 6px)' }} />
              Espace libre
            </span>
            <b>{base === 'manual' || base === 'manufacturer' ? '' : '~'}{fr(p.espaceLibrePct)} %<span className="idn-tagr">{ETIQUETTE[base]}</span></b>
            {CHEVRON}
          </button>
          <div id={idEspace} className="idn-tuile-corps">{p.contenuEspace}</div>
        </div>
      )}
      {p.materielNom !== undefined && (
        <div className={`idn-tuile${p.ouvertMateriel ? ' idn-ouvert' : ''}`} data-role="mat" data-element="r4a-materiel">
          <button type="button" className="idn-pli" aria-expanded={p.ouvertMateriel} aria-controls={idMateriel} data-role="matbtn" onClick={() => p.onOuvertMateriel(!p.ouvertMateriel)}>
            <span className="idn-k">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="6" y="4" width="12" height="17" rx="3" /><path d="M6 11h12M10 2h4" /></svg>
              Matériel
            </span>
            <span>{p.materielNom}</span>
            {CHEVRON}
          </button>
          <div id={idMateriel} className="idn-tuile-corps">
            {Number.isFinite(p.capaciteL) && (
              <label className="idn-lig">
                Fermenteur
                <ChampNombre
                  id="wz-fermenteur"
                  className="idn-fin"
                  data-role="fin"
                  libelle="Capacité du fermenteur pour ce brassin, en litres"
                  valeur={p.capaciteL!}
                  onValeur={(v) => { if (Number.isFinite(v)) p.onCapacite(v); }}
                  pas={1}
                  min={1}
                  max={2000}
                  permettreVide={false}
                />
                L
              </label>
            )}
            <button type="button" className="idn-raz" data-role="raz" hidden={!ecart} onClick={p.onRaz}>↺ profil</button>
            {p.contenuMateriel}
          </div>
        </div>
      )}
    </div>
  );
}
