import React from 'react';
import { ChampNombre } from './ChampNombre';
import { Regle, useRegleFigee } from './Regle';
import { EBULLITION_PAS, EBULLITION_SAISIE_MAX, etendreEbullition, etiquetteEbullition, fr, pourcent, type Evaporation } from './regles';

const ICONE_FLAMME = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.6 1.2 2.5 2 2.5-.6-3 0-5.5 1-8Z" />
  </svg>
);

export interface CarteEbullitionProps {
  /** NaN = effacé. */
  minutes: number;
  onMinutes: (m: number) => void;
  evaporation: Evaporation | null;
  invalide?: boolean;
  decrit?: string;
}

/** La durée d'ébullition, r4-a : se tape (arrondie à 5′), se glisse, et la règle s'ouvre d'une demi-heure au-delà. */
export function CarteEbullition({ minutes, onMinutes, evaporation, invalide, decrit }: CarteEbullitionProps) {
  const [refus, setRefus] = React.useState<string | null>(null);
  const voulue = etendreEbullition(minutes);
  const { regle, auToucher } = useRegleFigee(voulue);
  const connu = Number.isFinite(minutes);
  return (
    <section className="idn-inst" aria-label="Durée d’ébullition" data-carte="ebullition">
      <div className="idn-ih">
        <span className="idn-k">{ICONE_FLAMME}Ébullition · par {EBULLITION_PAS}′</span>
        <label className="idn-num">
          <ChampNombre
            id="wz-boil"
            className="idn-grand"
            data-role="bin"
            data-element="r4a-ebullition-champ"
            libelle="Durée d’ébullition"
            unite="min"
            onRefus={setRefus}
            valeur={minutes}
            onValeur={onMinutes}
            pas={EBULLITION_PAS}
            min={0}
            max={EBULLITION_SAISIE_MAX}
            arrondi={EBULLITION_PAS}
            decimal={false}
            auContenu
            required
            invalide={invalide}
            decrit={decrit}
          />
          <span className="idn-u">min</span>
        </label>
      </div>
      {refus && <p className="idn-refus" role="alert" data-role="refus">{refus}</p>}
      <div className="idn-piste" style={{ marginTop: 30 }} data-element="r4a-curseur-ebullition">
        <div className="idn-bpiste"><i style={{ width: `${pourcent(connu ? minutes : 0, regle)}%` }} /></div>
        {connu && evaporation && (
          <span
            className="idn-bulle"
            data-element="r4a-evaporation"
            style={{ left: `clamp(60px, ${pourcent(minutes, regle)}%, calc(100% - 60px))` }}
          >
            <b data-role="evap">{evaporation.litres > 0 ? `~${fr(evaporation.litres)} L` : '0 L'}</b> évaporés
          </span>
        )}
        <input
          type="range"
          className="idn-range"
          min={0}
          max={regle}
          step={EBULLITION_PAS}
          value={connu ? Math.min(Math.max(minutes, 0), regle) : 0}
          data-vide={connu ? undefined : 'true'}
          aria-label="Durée d’ébullition, curseur"
          aria-valuetext={connu ? `${minutes} minutes` : 'à renseigner'}
          onPointerDown={auToucher}
          onChange={(e) => onMinutes(Number(e.target.value))}
        />
      </div>
      <div data-element="r4a-regle-ebullition"><Regle max={regle} pas={EBULLITION_PAS} etiquette={etiquetteEbullition(regle)} nom="ebullition" /></div>
      {evaporation && evaporation.source !== 'profil' && (
        <p className="idn-note" data-role="evap-source">
          {evaporation.source === 'taux' ? 'évaporation du taux %/h de la brasserie, estimée' : 'repli 10 %/h, estimé'}
        </p>
      )}
    </section>
  );
}
