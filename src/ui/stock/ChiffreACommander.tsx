import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Units } from '../../services/units';
import { HORIZONS, etiquetteSemaine, lignesDeHorizon, phraseHorizon, type Horizon, type LigneHorizon, type VueHorizon } from '../../domain/stock/horizon';
import type { StockItem } from '../../types';
import './chiffreACommander.css';

/**
 * Le chiffre clé du Stocks, de la maquette choisie « pastille C » (16.11) : le gros chiffre « à commander », le réglage
 * « S49 · 6 sem. · Tout » qui règle ENSEMBLE ce chiffre et la pastille de l'onglet Stocks, l'histogramme semaine par semaine,
 * la liste par semaine et « Commander ces N ». Les nombres viennent de `domain/stock/horizon.ts`, jamais d'ici.
 * Se corrige (page des choix) : la liste garde une marge basse, le + ne couvre plus une quantité.
 */

const LIGNES_VISIBLES = 6;

const quantite = (l: LigneHorizon) => l.missing > 0 ? `${l.auMoins ? 'au moins ' : ''}${Units.format(l.missing, l.item.unit)}` : 'à définir';

export function ChiffreACommander({ vue, horizon, onHorizon, onOuvrir, onCommander }: {
  vue: VueHorizon;
  horizon: Horizon;
  onHorizon: (h: Horizon) => void;
  onOuvrir: (item: StockItem) => void;
  onCommander: () => void;
}) {
  const [toutes, setToutes] = useState(false);
  const comptees = lignesDeHorizon(vue, horizon);
  const n = comptees.length;
  const rien = vue.comptes.tout === 0;
  const visibles = toutes ? comptees : comptees.slice(0, LIGNES_VISIBLES);
  const plusTard = vue.comptes.tout - n;
  const max = Math.max(1, ...vue.colonnes.map((c) => c.n));
  const limite = horizon === 'brassin' ? vue.limiteBrassin : horizon === 'six' ? vue.limiteSix : Infinity;
  const nomHorizon: Record<Horizon, { t: string; s: string }> = {
    brassin: { t: vue.brassin ? etiquetteSemaine(vue.limiteBrassin) : 'Cette sem.', s: vue.brassin ? 'prochain brassin' : 'aucun brassin prévu' },
    six: { t: '6 sem.', s: `jusqu’à ${etiquetteSemaine(vue.limiteSix)}` },
    tout: { t: 'Tout', s: 'au seuil compris' }
  };
  // Les colonnes comptées : jusqu'à la limite ; « seuil » seulement en Tout. La bordure couvre autant de colonnes.
  const comptee = (semaine: number | null) => horizon === 'tout' || (semaine !== null && semaine <= limite);
  const nCouvertes = vue.colonnes.filter((c) => comptee(c.semaine)).length;

  return (
    <section className="cac" aria-label="À commander" data-testid="chiffre-a-commander">
      <div className="cac-tete">
        <span className="cac-gros" data-testid="cac-gros">{n}</span>
        <p className="cac-phrase" aria-live="polite">
          <span>{rien ? 'rien' : 'à commander'}</span>
          <b>{rien ? 'à commander' : phraseHorizon(vue, horizon)}</b>
        </p>
      </div>

      {rien
        ? <p className="cac-vide" role="status"><b>Rien à commander</b><span>la pastille disparaît · rien au seuil, rien de daté</span></p>
        : <>
          <div className="cac-reglage">
            <p className="cac-lab"><span className="cac-mp" aria-hidden="true">{n}</span>pastille et chiffre comptent jusqu’à</p>
            <div className="cac-seg" role="radiogroup" aria-label="Horizon du chiffre et de la pastille">
              {HORIZONS.map((h) => (
                <button key={h} type="button" role="radio" aria-checked={horizon === h} data-h={h} className={horizon === h ? 'on' : ''} onClick={() => onHorizon(h)}>
                  <b>{nomHorizon[h].t}</b>{nomHorizon[h].s}
                </button>
              ))}
            </div>
          </div>

          <div className="cac-his" aria-hidden="true">
            {vue.colonnes.map((c) => (
              <div key={c.etiquette} style={{ '--c': comptee(c.semaine) ? (c.semaine === null ? 'rgb(var(--attention-texte))' : 'rgb(var(--area-finances))') : 'rgb(var(--cave-600))' } as React.CSSProperties}>
                <span>{c.n || ''}</span><i style={{ height: c.n ? Math.max(6, (c.n / max) * 70) : 0 }} />
              </div>
            ))}
            <b className="cac-br" style={{ width: `calc(${(nCouvertes / vue.colonnes.length) * 100}% + 4px)` }} />
          </div>
          <div className="cac-sem" aria-hidden="true">{vue.colonnes.map((c) => <span key={c.etiquette}>{c.etiquette}</span>)}</div>
          <p className="sr-only">
            {vue.colonnes.map((c) => `${c.etiquette} : ${c.n}`).join(', ')}
          </p>

          <p className="cac-titre"><b>{horizon === 'tout' ? 'Tout, par urgence' : `Avant ${etiquetteSemaine(limite)}, par semaine`}</b></p>
          {n === 0
            ? <p className="cac-vide" role="status"><b>Rien à commander {horizon === 'brassin' && vue.brassin ? `avant ${etiquetteSemaine(vue.limiteBrassin)}` : 'dans ces semaines'}</b><span>{plusTard} {plusTard > 1 ? 'articles viennent' : 'article vient'} plus tard · touchez Tout</span></p>
            : <ul className="cac-liste">
              {visibles.map((l) => (
                <li key={l.item.ref}>
                  <button type="button" className="cac-ligne" aria-label={`Ouvrir ${l.item.name}`} onClick={() => onOuvrir(l.item)}>
                    <i className="cac-pt" style={{ background: l.semaine === null ? 'rgb(var(--attention-texte))' : 'rgb(var(--area-finances))' }} />
                    <span className="cac-tx">
                      <span className="cac-nm">{l.item.name}</span>
                      <span className="cac-sb">
                        {l.semaine !== null
                          ? <><em>{etiquetteSemaine(l.semaine)}</em> · {l.pour}</>
                          : <><em className="cac-seuil">{l.recetteSeule ? 'sans date' : 'au seuil'}</em> · {l.pour ?? 'aucun brassin prévu'}</>}
                      </span>
                    </span>
                    <span className="cac-q">{quantite(l)}</span>
                  </button>
                </li>
              ))}
              {comptees.length > LIGNES_VISIBLES && (
                <li><button type="button" className="cac-plus" aria-expanded={toutes} onClick={() => setToutes((t) => !t)}>
                  {toutes ? 'Replier la liste' : `Voir les ${comptees.length - LIGNES_VISIBLES} autres`}
                </button></li>
              )}
            </ul>}
          {n > 0 && (
            <button type="button" className="cac-cta" onClick={onCommander}>
              <ShoppingCart size={20} aria-hidden="true" />Commander {n > 1 ? `ces ${n}` : 'cet article'}
            </button>
          )}
        </>}
    </section>
  );
}
