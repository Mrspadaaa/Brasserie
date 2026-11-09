import React from 'react';
import { formatCHF } from '../../../domain/finance/ledger';
import { echelle, regrouperPetits, type PeriodeSynthese, type Reste } from '../../../domain/finance/periodeSynthese';
import { amountOnly, shortDate } from '../financeFormat';
import { couleur, hachure, libelleCategorie, fenetreMois, moisCourt, texteSur, titreMois } from './libelles';

/** Hauteur de la plus haute pile, en px : celle de la maquette g3a. */
export const HAUTEUR = 300;
const EN_TETE = 34;

export interface PeriodeChoix { mois: string; tout: boolean }

/** E1 : titre de la période et segment « sept. oct. nov. tout ». */
export function Periode({ courant, choix, onMois, onTout }: { courant: string; choix: PeriodeChoix; onMois: (mois: string) => void; onTout: () => void }) {
  const annee = courant.slice(0, 4);
  return <div className="syn-top">
    <h2>{choix.tout ? 'Tout l’historique' : titreMois(choix.mois, annee)}</h2>
    <div className="syn-seg" role="group" aria-label="Période">
      {fenetreMois(courant, choix.mois).map(mois => <button type="button" key={mois} aria-pressed={!choix.tout && mois === choix.mois} onClick={() => onMois(mois)}>{moisCourt(mois, annee)}</button>)}
      <button type="button" aria-pressed={choix.tout} onClick={onTout}>tout</button>
    </div>
  </div>;
}

/** Un grand nombre (« +1 430,20 ») rétrécit pour rester dans sa colonne. */
const taille = (texte: string): React.CSSProperties => texte.length >= 8 ? { fontSize: 18 } : texte.length >= 6 ? { fontSize: 24 } : {};
const echeance = (r: Reste) => r.echeance ? shortDate(r.echeance) : 'échéance à préciser';

export interface SceneProps {
  periode: PeriodeSynthese;
  /** Libellé de la période pour les noms accessibles (« novembre »). */
  nomPeriode: string;
  onCategorie: (categorie: string) => void;
  onPiece: (id: string) => void;
  onVentes: () => void;
  onMateriel: () => void;
  onPourquoi: () => void;
}

/** E2 + E3 : les deux colonnes, sur la même échelle ; le gain en pastille ; le matériel à part ; la légende. */
export function Scene({ periode: p, nomPeriode, onCategorie, onPiece, onVentes, onMateriel, onPourquoi }: SceneProps) {
  const vide = p.lignes === 0 && p.materielCents === 0;
  const ech = echelle(p.entreCents, p.depenseCents, HAUTEUR);
  const postes = regrouperPetits(p.postes, p.depenseCents, 4);
  const pctDe = (cents: number) => p.depenseCents > 0 ? cents * 100 / p.depenseCents : 0;
  const perte = ech.signe === 'perte', gain = ech.signe === 'gain';
  const pastille = vide ? null : gain
    ? <><b className="syn-m" style={taille(amountOnly(p.gainCents))}>+{amountOnly(p.gainCents)}</b><span>CHF gagnés</span></>
    : perte ? <><b className="syn-m" style={taille(amountOnly(-p.gainCents))}>−{amountOnly(-p.gainCents)}</b><span>Perdu · CHF</span></>
    : <><b className="syn-m">0,00</b><span>ni gain ni perte</span></>;
  const aConfirmer = p.aVerifier.paiementsAConfirmer.length;
  // Le fil relie la pastille au haut de l'écart : il part du haut de la pastille et monte au bord de l'écart, mesuré sur l'échelle, jamais en coordonnées fixes.
  const hautPastille = EN_TETE + 28, hautEcart = EN_TETE + (HAUTEUR - ech.hEntree) + 0;
  const aEncaisserPx = p.entreCents > 0 ? Math.max(14, p.entreAEncaisserCents * ech.hPileEntree / p.entreCents) : 0;

  return <div>
    <div className="syn-scene" style={{ height: HAUTEUR + EN_TETE }} data-signe={ech.signe}>
      <div className="syn-col">
        <div className="syn-hc"><span>Entré</span><span className="syn-m">{amountOnly(p.entreCents)}</span></div>
        {perte && <div className="syn-ecart syn-ecart-perte" style={{ height: ech.hEcart }} aria-hidden="true"/>}
        {p.entreCents > 0
          ? <div className="syn-pile syn-pile-entree" style={{ height: ech.hPileEntree }}>
            <button type="button" className="syn-s syn-s-vente" style={{ flex: Math.max(1, p.entreCents - p.entreAEncaisserCents) }} aria-label={`${p.ventes.libelle ?? 'Ventes'} ${formatCHF(p.entreCents)}, voir ces ventes`} onClick={onVentes}>
              <span className="syn-lib">{p.ventes.libelle}</span>
            </button>
            {p.entreAEncaisserCents > 0 && <div className="syn-s syn-ap syn-ap-vente" style={{ height: aEncaisserPx, flex: 'none' }}>
              <span className="syn-tag">À encaisser <span className="syn-m">{amountOnly(p.entreAEncaisserCents)}</span></span>
            </div>}
          </div>
          : !perte && !vide && <div className="syn-pile syn-pile-zero"/>}
      </div>

      <div className="syn-col">
        <div className="syn-hc"><span>Dépensé</span><span className="syn-m">{amountOnly(p.depenseCents)}</span></div>
        {gain && <div className="syn-ecart syn-ecart-gain" style={{ height: ech.hEcart }} aria-hidden="true"/>}
        {p.depenseCents > 0 && <div className="syn-pile" style={{ height: ech.hPileDepense, borderRadius: gain ? '0 0 10px 10px' : 10 }}>
          {postes.filter(x => x.payeCents > 0).map(x => <button type="button" key={x.categorie} className="syn-s" style={{ flex: x.payeCents, background: couleur(x.categorie), color: texteSur(x.categorie) }}
            aria-label={`${libelleCategorie(x.categorie)} ${formatCHF(x.payeCents)}, voir ces opérations de ${nomPeriode}`} onClick={() => onCategorie(x.categorie)}>
            {pctDe(x.payeCents) >= 4 && <><span className="syn-lib">{libelleCategorie(x.categorie)}</span><span className="syn-m">{amountOnly(x.payeCents)}</span></>}
          </button>)}
          {p.aPayer.map(r => <button type="button" key={r.id} className="syn-s syn-ap" style={{ flex: r.cents, backgroundImage: hachure(r.categorie), flexDirection: 'column', gap: 2 }}
            aria-label={`${r.libelle} ${formatCHF(r.cents)} à payer ${echeance(r)}${r.enRetard ? ', en retard' : ''}, ouvrir la pièce`} onClick={() => onPiece(r.id)}>
            {pctDe(r.cents) >= 4 && <span className={pctDe(r.cents) >= 10 ? 'syn-tag' : 'syn-tag syn-tag-court'}>{r.libelle} <span className="syn-m">{amountOnly(r.cents)}</span></span>}
            {pctDe(r.cents) >= 10 && <span className="syn-tag">à payer {echeance(r)}</span>}
          </button>)}
        </div>}
      </div>

      <div className="syn-col syn-apart">
        {p.materielCents > 0 && <>
          <div className="syn-hc"><span>Matériel</span><span className="syn-m">{amountOnly(p.materielCents)}</span><span>à part</span></div>
          <button type="button" className="syn-pile syn-pile-mat" aria-label={`Matériel ${formatCHF(p.materielCents)} à part, voir ces opérations de ${nomPeriode}`} onClick={onMateriel}/>
        </>}
      </div>

      {gain && <span className="syn-fil" aria-hidden="true" style={{ top: hautEcart + 1, height: Math.max(12, hautPastille - hautEcart) }}/>}
      {pastille && <div className="syn-gain" style={{ top: hautPastille }}>
        <div className={`syn-gb syn-gb-${ech.signe}`} role="status">{pastille}</div>
        <button type="button" className="syn-why" onClick={onPourquoi}><span aria-hidden="true">✦ </span>Pourquoi ?</button>
      </div>}
      {vide && <p className="syn-vide">Aucune écriture sur cette période.</p>}
    </div>
    <div className="syn-leg">
      <span><i style={{ background: couleur('chargesFixes') }}/>payé</span>
      {p.aPayer.length > 0 && <span><i style={{ backgroundImage: hachure('chargesFixes') }}/>à payer</span>}
      {p.aEncaisser.length > 0 && <span><i style={{ backgroundImage: hachure('recettes') }}/>à encaisser</span>}
      {aConfirmer > 0 && <span><i className="syn-confirmer"/>{aConfirmer} à confirmer</span>}
    </div>
  </div>;
}
