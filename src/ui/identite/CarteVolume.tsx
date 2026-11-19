import React from 'react';
import { ChampNombre } from './ChampNombre';
import { Regle, useRegleFigee } from './Regle';
import {
  VOLUME_SAISIE_MAX, barreCuve, echelleBarre, partEvapDansCuve, etatVolume, etendreVolume, fr, pourcent, zonesPiste,
  type AvantEbullition, type RemedesCuve
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
  /** ID-TROP-AMBIGU (19.11) : les remèdes chiffrés quand la cuve déborde (`remedesCuve`). */
  remedes?: RemedesCuve | null;
  /** Durée d'ébullition, pour dire la cause du débordement. */
  minutes?: number;
  /** L'eau ajoutée pendant ou après l'ébullition, quand il l'a choisie (L froids, > 0). */
  eauAjouteeL?: number;
  onEauAjoutee?: (oui: boolean) => void;
  onMinutes?: (m: number) => void;
  /** Le renvoi vers Eau / grain et Rinçage, à l'étape Eau. */
  onVersEau?: () => void;
}

/**
 * Le volume en fermenteur, r4-a : la grande lecture se tape, le curseur la suit, la règle s'étend, la barre de la cuve
 * se lit sur la même règle (moût d'avant ébullition, part évaporée, et « +N L de trop » quand elle déborde).
 */
export function CarteVolume({ volumeL, onVolume, capaciteL, profilL, conseilL, cuveL, avantEbullition, onOuvrirFermenteur, invalide, decrit,
  remedes, minutes, eauAjouteeL, onEauAjoutee, onMinutes, onVersEau }: CarteVolumeProps) {
  const [refus, setRefus] = React.useState<string | null>(null);
  const voulue = etendreVolume({ cuveL, capaciteL, volumeL });
  const { regle, auToucher } = useRegleFigee(voulue);
  const connu = Number.isFinite(volumeL);
  const etat = etatVolume(volumeL, capaciteL);
  const zones = zonesPiste(volumeL, capaciteL, regle);
  const barre = barreCuve(avantEbullition?.litres, avantEbullition?.evapL, cuveL);
  const echelle = barre ? echelleBarre(barre.total, regle) : 0;
  const evapCuve = barre && Number.isFinite(cuveL) ? partEvapDansCuve(barre, cuveL!) : null;
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
            unite="L"
            onRefus={setRefus}
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
      {refus && <p className="idn-refus" role="alert" data-role="refus">{refus}</p>}
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
                  {/* La barre ne dépasse pas le bout de la règle : ses zones se lisent sur l'échelle de la règle (n° 10). */}
                  {/* Au-delà de la cuve, seules les hachures rouges : ni le moût (or) ni la part évaporée (bleu) ne s'y mêlent. */}
                  <i className="idn-cmout" style={zone(0, Math.min(barre.moutL, cuveL!), echelle)} />
                  {evapCuve && <i className="idn-cevap" style={zone(evapCuve[0], evapCuve[1], echelle)} />}
                  {barre.deborde && <i className="idn-cdep" style={zone(cuveL!, barre.total, echelle)} />}
                  {barre.deborde && <i className="idn-ccuve" style={{ left: `${pourcent(cuveL!, echelle)}%` }} />}
                </>
              )}
            </div>
          </div>
          <div className="idn-ih" style={{ justifyContent: 'space-between', marginTop: 3 }}>
            <span className="idn-k">cuve <b className="idn-m" style={{ color: 'rgb(var(--cave-texte-50))' }}>{fr(cuveL!)}</b> L</span>
            <span className="idn-cv">
              {/* ID-TROP-AMBIGU (19.11) : « +3,7 L de trop » se lisait comme du moût en trop ; c'est la cuve qui est trop petite. */}
              {barre?.deborde && avantEbullition
                ? <span className="idn-trop" role="alert" data-role="debordement">Cuve trop petite : <b data-role="preb">{fr(avantEbullition.litres)} L</b> pour <b>{fr(cuveL!)} L</b></span>
                : avantEbullition ? <><b data-role="preb">~{fr(avantEbullition.litres)} L</b> à chaud avant ébullition</> : <><b data-role="preb">—</b> avant ébullition · sans malts</>}
            </span>
          </div>
          {barre?.deborde && remedes && (
            <div className="idn-remede" data-role="remede">
              {Number.isFinite(minutes) && avantEbullition?.evapL != null && avantEbullition.evapL > 0 && (
                <p className="idn-cause" data-role="cause-cuve">
                  {fr(minutes!)} min d’ébullition évaporent ~{fr(avantEbullition.evapL)} L : plus elle dure, plus il faut de moût au départ.
                </p>
              )}
              {onEauAjoutee && (
                <button type="button" className="idn-ajout" data-role="ajouter-eau" onClick={() => onEauAjoutee(true)}>
                  Ajouter {fr(remedes.eauL)} L d’eau pendant ou après l’ébullition
                </button>
              )}
              <div className="idn-liens idn-autres">
                {remedes.ebullitionMin !== null && onMinutes && (
                  <button type="button" className="idn-lien-ligne" onClick={() => onMinutes(remedes.ebullitionMin!)}>ou ébullition {remedes.ebullitionMin} min</button>
                )}
                {remedes.volumeL !== null && (
                  <button type="button" className="idn-lien-ligne" onClick={() => onVolume(remedes.volumeL!)}>ou {fr(remedes.volumeL)} L</button>
                )}
                {onVersEau && <button type="button" className="idn-lien-ligne" data-role="vers-eau" onClick={onVersEau}>Eau / grain et rinçage ›</button>}
              </div>
            </div>
          )}
          {!barre?.deborde && eauAjouteeL != null && eauAjouteeL > 0 && (
            <p className="idn-remede idn-eau-ok" data-role="eau-ajoutee">
              <span><b className="idn-m">+{fr(eauAjouteeL)} L</b> d’eau pendant ou après l’ébullition</span>
              {onEauAjoutee && <button type="button" className="idn-lien-ligne" aria-label="Retirer l’eau ajoutée" onClick={() => onEauAjoutee(false)}>Retirer</button>}
              {onVersEau && <button type="button" className="idn-lien-ligne" data-role="vers-eau" onClick={onVersEau}>Eau / grain et rinçage ›</button>}
            </p>
          )}
        </>
      )}
    </section>
  );
}
