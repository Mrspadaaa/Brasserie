import React, { useState } from 'react';
import { formatCHF } from '../../../domain/finance/ledger';
import { echelle, regrouperPetits, type PeriodeSynthese, type Reste } from '../../../domain/finance/periodeSynthese';
import { amountOnly, shortDate } from '../financeFormat';
import { PlageMois } from '../PlageMois';
import { couleur, hachure, libelleCategorie, fenetreMois, moisCourt, texteSur, titreMois, titrePlage } from './libelles';

/** Hauteur de la plus haute pile, en px : celle de la maquette g3a. */
export const HAUTEUR = 300;
const EN_TETE = 34;

/** `plage` : début et fin (`AAAA-MM`, bornes incluses) de la période choisie avec « … » (CP-9) ; elle remplace le mois ou « tout ». */
export interface PeriodeChoix { mois: string; tout: boolean; plage?: { du: string; au: string } | null }

/** Le texte du titre d'une période : la plage, « tout l'historique » ou le mois. */
export function titrePeriode(choix: PeriodeChoix, anneeCourante: string): string {
  return choix.plage ? titrePlage(choix.plage.du, choix.plage.au) : choix.tout ? 'Tout l’historique' : titreMois(choix.mois, anneeCourante);
}

/**
 * E1 : titre de la période et segment « sept. oct. nov. tout … » (g3a). Le dernier élément « … » montre, sous le segment, la rangée
 * « du [mois] au [mois] » (champs mois natifs, bornés au mois courant, du ≤ au). Un mois ou « tout » touché la referme.
 */
export function Periode({ courant, choix, onMois, onTout, onPlage }: { courant: string; choix: PeriodeChoix; onMois: (mois: string) => void; onTout: () => void; onPlage: (du: string, au: string) => void }) {
  const annee = courant.slice(0, 4);
  const [ouvert, setOuvert] = useState(false);
  return <>
    <div className="syn-top">
      <h2>{titrePeriode(choix, annee)}</h2>
      <div className="syn-seg" role="group" aria-label="Période">
        {fenetreMois(courant, choix.mois).map(mois => <button type="button" key={mois} aria-pressed={!choix.tout && !choix.plage && mois === choix.mois} onClick={() => { setOuvert(false); onMois(mois); }}>{moisCourt(mois, annee)}</button>)}
        <button type="button" aria-pressed={choix.tout} onClick={() => { setOuvert(false); onTout(); }}>tout</button>
        <button type="button" className="syn-seg-plus" aria-label="Autre période" aria-expanded={ouvert} aria-pressed={!!choix.plage} onClick={() => setOuvert(!ouvert)}>…</button>
      </div>
    </div>
    {ouvert && <PlageMois courant={courant} du={choix.plage?.du ?? (choix.tout ? courant : choix.mois)} au={choix.plage?.au ?? courant} onPlage={onPlage}/>}
  </>;
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
  // Une étiquette ne s'écrit que si la tranche est assez haute pour la porter : sinon elle déborde sur sa voisine (« tout » : Solde atelier sur Loyer).
  const pxDe = (cents: number) => p.depenseCents > 0 ? cents * ech.hPileDepense / p.depenseCents : 0;
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
            {pxDe(r.cents) >= 22 && <span className={pxDe(r.cents) >= 46 ? 'syn-tag' : 'syn-tag syn-tag-court'}>{r.libelle} <span className="syn-m">{amountOnly(r.cents)}</span></span>}
            {pxDe(r.cents) >= 46 && <span className="syn-tag">à payer {echeance(r)}</span>}
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
