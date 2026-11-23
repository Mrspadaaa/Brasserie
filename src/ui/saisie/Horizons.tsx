import React from 'react';
import { horizonDe, HORIZONS, lundiDHorizon, type Horizon } from '../../domain/horizons';

/**
 * K1, choix C1 (D393, 21.11) : la rangée d'horizons partagée (« aujourd'hui, dans 1 mois, dans 3 mois… 6m 1 ans »). Un toucher pose le
 * lundi de l'horizon (`lundiDHorizon`) ; reporter = toucher une autre puce ; « Plus tard » retire la date. La semaine exacte se règle
 * ensuite au glisser sur la frise, le jour à Brasser. Aucun habillage propre : chaque écran passe la classe de ses puces (son vocabulaire,
 * règle n° 1) ; la rangée passe à la ligne au lieu de défiler (le carrousel de 60 puces cachait la semaine voulue).
 */
export interface HorizonsProps {
  /** La date posée (ISO) ; absente : rien de choisi. */
  date?: string;
  /** Le jour de référence (ISO), injecté pour le banc et les tests. */
  aujourdhui: string;
  onChoisir: (horizon: Horizon, lundi: string | null) => void;
  /** Classe des puces de l'écran hôte (ex. `cn-puce` au Carnet) ; l'état choisi passe par `aria-pressed`. */
  classePuce?: string;
  /** « Plus tard » seulement quand une date est posée (sinon il ne changerait rien). Défaut : vrai. */
  plusTardSiDate?: boolean;
  /** Sans « Plus tard » (V-CAL : une chose posée au Calendrier a toujours une semaine ; « Sans date » est ailleurs). Défaut : faux. */
  sansPlusTard?: boolean;
  etiquette?: string;
  className?: string;
}

export function Horizons({ date, aujourdhui, onChoisir, classePuce, plusTardSiDate = true, sansPlusTard = false, etiquette = 'Quand', className }: HorizonsProps) {
  const choisi = horizonDe(date, aujourdhui);
  const liste = HORIZONS.filter(h => h.cle !== 'plus-tard' || (!sansPlusTard && (!plusTardSiDate || !!date)));
  return (
    <div role="group" aria-label={etiquette} className={className} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {liste.map(h => (
        <button key={h.cle} type="button" className={classePuce} aria-pressed={choisi === h.cle}
          onClick={() => onChoisir(h.cle, lundiDHorizon(h.cle, aujourdhui))}>
          {h.libelle}
        </button>
      ))}
    </div>
  );
}
