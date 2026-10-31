import React from 'react';
import { ChampNombre } from './ChampNombre';
import { Regle, useRegleFigee } from './Regle';
import {
  VOLUME_SAISIE_MAX, barreCuve, etatVolume, etendreVolume, fr, pourcent, zonesPiste,
  type AvantEbullition
} from './regles';

const ICONE_FERMENTEUR = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="6" y="4" width="12" height="17" rx="3" /><path d="M6 11h12M10 2h4" />
  </svg>
);

const zone = (a: number, b: number, regle: number): React.CSSProperties => ({
  left: `${pourcent(a, regle)}%`,
  width: `${pourcent(b, regle) - pourcent(a, regle)}%`
});

export interface CarteVolumeProps {
  /** NaN = effacé. */
  volumeL: number;
  onVolume: (v: number) => void;
  /** Capacité du fermenteur pour ce brassin ; undefined = inconnue (jamais 0). */
  capaciteL?: number;
  /** Capacité du profil d'équipement, pour dire que la puce s'écarte du profil. */
  profilL?: number;
  conseilL?: number;
  /** La limite utile de la cuve (kettleWorkingL), celle du bloc « Volumes et matériel » : pas sa capacité totale. */
  cuveL?: number;
  avantEbullition?: AvantEbullition | null;
  onOuvrirFermenteur: () => void;
  invalide?: boolean;
  decrit?: string;
}

/**
 * Le volume en fermenteur, r4-a : la grande lecture se tape, le curseur la suit, la règle s'étend, la barre de la cuve
 * se lit sur la même règle (moût d'avant ébullition, part évaporée, et « +N L de trop » quand elle déborde).
 */
export function CarteVolume({ volumeL, onVolume, capaciteL, profilL, conseilL, cuveL, avantEbullition, onOuvrirFermenteur, invalide, decrit }: CarteVolumeProps) {
  const voulue = etendreVolume({ cuveL, capaciteL, volumeL, avantEbullitionL: avantEbullition?.litres });
  const { regle, auToucher } = useRegleFigee(voulue);
  const connu = Number.isFinite(volumeL);
  const etat = etatVolume(volumeL, capaciteL);
  const zones = zonesPiste(volumeL, capaciteL, regle);
  const barre = barreCuve(avantEbullition?.litres, avantEbullition?.evapL, cuveL);
  const modifie = Number.isFinite(capaciteL) && Number.isFinite(profilL) && capaciteL !== profilL;

  const texteEtat =
    etat.genre === 'libre' ? <><span className="idn-m">{fr(etat.litres)} L</span> libres</>
    : etat.genre === 'plein' ? <><span className="idn-m">0 L</span> libre, plein</>
    : etat.genre === 'trop' ? <><span className="idn-m">+{fr(etat.litres)} L</span> de trop</>
    : connu ? null : <>Volume à renseigner</>;

  return (
    <section className="idn-inst" aria-label="Volume et cuve" data-carte="volume">
      <div className="idn-ih">
        <span className="idn-k">{ICONE_FERMENTEUR}Volume ·</span>
        {Number.isFinite(capaciteL) && (
          <button
            type="button"
            className={`idn-cap${modifie ? ' idn-modif' : ''}`}
            data-role="capbtn"
            data-element="r4a-puce-fermenteur"
            aria-label="Changer de fermenteur"
            onClick={onOuvrirFermenteur}
          >
            fermenteur <b data-role="cap">{fr(capaciteL!)}</b> L
          </button>
        )}
        <label className="idn-num">
          <ChampNombre
            id="wz-volume"
            className="idn-grand"
            data-role="vin"
            data-element="r4a-volume-champ"
            libelle="Volume en fermenteur"
            valeur={volumeL}
            onValeur={onVolume}
            pas={1}
            min={1}
            max={VOLUME_SAISIE_MAX}
            auContenu
            required
            invalide={invalide}
            decrit={decrit}
          />
          <span className="idn-u">L</span>
        </label>
      </div>
      {texteEtat && (
        <div className="idn-ih" style={{ justifyContent: 'flex-end' }}>
          <span
            className={`idn-etat${etat.genre === 'plein' ? ' idn-plein' : etat.genre === 'trop' ? ' idn-trop' : etat.genre === 'inconnu' ? ' idn-inconnu' : ''}`}
            data-role="etat"
            data-element="r4a-libres"
            role={etat.genre === 'trop' ? 'alert' : 'status'}
            aria-live="polite"
          >
            {texteEtat}
          </span>
        </div>
      )}
      <div className="idn-piste" data-element="r4a-piste-volume">
        <div className="idn-zone">
          {zones.rempli && <i className="idn-zfill" style={zone(zones.rempli[0], zones.rempli[1], regle)} />}
          {zones.libre && <i className="idn-zlibre" style={zone(zones.libre[0], zones.libre[1], regle)} />}
          {zones.trop && <i className="idn-ztrop" style={zone(zones.trop[0], zones.trop[1], regle)} />}
          {zones.depasse && <i className="idn-zdep" style={zone(zones.depasse[0], zones.depasse[1], regle)} />}
        </div>
        {conseilL !== undefined && (
          <>
            <span className="idn-tick" style={{ left: `${pourcent(conseilL, regle)}%` }} />
            <span className="idn-tlab" style={{ left: `${pourcent(conseilL, regle)}%` }} data-element="r4a-conseil">
              conseil <b>~{fr(conseilL)}</b>
            </span>
          </>
        )}
        {Number.isFinite(capaciteL) && <span className="idn-tick idn-tcap" style={{ left: `${pourcent(capaciteL!, regle)}%` }} />}
        <input
          type="range"
          className="idn-range"
          min={1}
          max={regle}
          step={1}
          value={connu ? Math.min(Math.max(volumeL, 1), regle) : 1}
          data-vide={connu ? undefined : 'true'}
          aria-label="Volume en fermenteur, curseur"
          aria-valuetext={connu ? `${fr(volumeL)} L` : 'à renseigner'}
          onPointerDown={auToucher}
          onChange={(e) => onVolume(Number(e.target.value))}
        />
      </div>
      <div data-element="r4a-regle-volume"><Regle max={regle} pas={1} etiquette={10} nom="volume" /></div>
      {Number.isFinite(cuveL) && (
        <>
          <div className="idn-cbar" data-element="r4a-cuve">
            <div className={`idn-ctrack${barre?.deborde ? ' idn-deb' : ''}`} data-role="cbox" style={{ width: `${pourcent(barre?.total ?? cuveL!, regle)}%` }}>
              {barre && (
                <>
                  <i className="idn-cmout" style={zone(0, barre.moutL, barre.total)} />
                  <i className="idn-cevap" style={zone(barre.moutL, barre.moutL + barre.evapL, barre.total)} />
                  {barre.deborde && <i className="idn-cdep" style={zone(cuveL!, barre.total, barre.total)} />}
                  {barre.deborde && <i className="idn-ccuve" style={{ left: `${pourcent(cuveL!, barre.total)}%` }} />}
                </>
              )}
            </div>
          </div>
          <div className="idn-ih" style={{ justifyContent: 'space-between', marginTop: 3 }}>
            <span className="idn-k">cuve utile <b className="idn-m" style={{ color: 'rgb(var(--cave-texte-50))' }}>{fr(cuveL!)}</b> L</span>
            <span className="idn-cv">
              {avantEbullition ? <><b data-role="preb">~{fr(avantEbullition.litres)} L</b> avant ébullition</> : <>avant ébullition : à calculer</>}
              {barre?.deborde && (
                <> · <span className="idn-trop" role="alert" data-role="debordement"><b>+{fr(barre.depasseL)} L</b> de trop</span></>
              )}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
