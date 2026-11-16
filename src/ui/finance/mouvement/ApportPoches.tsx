import React, { useRef, useState } from 'react';
import { Input } from '../../Input';
import { ChampNombre } from '../../depense/ChampNombre';
import { BORNES_FINANCE } from '../../../domain/finance/bornesFinance';
import type { FinancialPayment } from '../../../domain/finance/types';
import { todayISO } from '../../../domain/finance/ledger';
import { amountOnly, shortDate } from '../financeFormat';
import { pisteCaisse, pisteResultat, type EffetMouvement } from './effetMois';
import type { PieceJointe } from './justificatif';
import './mouvement.css';

/**
 * Apport ou prélèvement privé = m5ap-a (choisie le 15.11), portée telle quelle : « Ta poche → La brasserie » avec le montant sur la flèche,
 * « Dans l'autre sens : je reprends », l'effet (la caisse change, ventes − dépenses non), Quand, Sur quel compte, Motif, justificatif, Enregistrer.
 * Ajouts de port (la maquette ne les montre pas) : le prélèvement (mêmes places, sens inversé), la date libre sous « autre date… »,
 * l'état « joint » (greffe du critique : vignette « ✓ joint · date · montant »).
 */
const signe = (cents: number) => `${cents > 0 ? '+' : cents < 0 ? '−' : ''}${amountOnly(Math.abs(cents))}`;

const IconePoche = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>;
const IconeBrasserie = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F2C14E" strokeWidth="2.2" aria-hidden="true"><path d="M6 5h10v15H6z" /><path d="M16 9h3v6h-3" /></svg>;
const IconePhoto = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.6" /></svg>;
const IconeFichier = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /><path d="M12 11v6M9.5 14.5L12 17l2.5-2.5" /></svg>;

type Methode = FinancialPayment['method'];
const COMPTES: Array<[Methode, string]> = [['bank', 'Banque'], ['cash', 'Espèces'], ['twint', 'TWINT'], ['other', 'Autre']];

export interface ApportPochesProps {
  kind: 'contribution' | 'withdrawal'; onKind: (k: 'contribution' | 'withdrawal') => void;
  amount: number | undefined; onAmount: (v: number | undefined) => void;
  date: string; onDate: (d: string) => void;
  method: Methode; onMethod: (m: Methode) => void;
  note: string; onNote: (n: string) => void;
  piece: PieceJointe | null; onPiece: (file: File | null) => void; pieceError: string;
  /** Enregistrer sans motif : le champ le dit dans l'app (pas la bulle native du navigateur, posée n'importe où) et prend le focus (t1, problème 6). */
  motifManque?: boolean;
  effet: EffetMouvement;
}

export function ApportPoches(p: ApportPochesProps) {
  const entrant = p.kind === 'contribution';
  const aujourdhui = todayISO();
  const [autre, setAutre] = useState(p.date !== aujourdhui);
  const photo = useRef<HTMLInputElement>(null), fichier = useRef<HTMLInputElement>(null), champMotif = useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (p.motifManque) { champMotif.current?.scrollIntoView?.({ block: 'center' }); champMotif.current?.focus(); } }, [p.motifManque]);
  const { effet } = p;
  const piste = pisteCaisse(effet), resultat = pisteResultat(effet);
  const choisir = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) p.onPiece(f); };
  const poche = <div className="mvt-who"><span className="mvt-me"><IconePoche /></span>Ta poche</div>;
  const brasserie = <div className="mvt-who"><span className="mvt-br"><IconeBrasserie /></span>La brasserie</div>;
  return <div className="mvt" data-sens={entrant ? 'in' : 'out'}>
    <div className="mvt-flow" data-booster="deux-poches">
      {entrant ? poche : brasserie}
      <div className="mvt-arrow">
        <ChampNombre aria-label="Montant (CHF)" className="mvt-montant" placeholder="0,00" value={p.amount == null ? undefined : p.amount / 100}
          onValue={v => p.onAmount(v == null ? undefined : Math.round(v * 100))} max={BORNES_FINANCE.operationCents.valeur / 100} maxDecimales={2} fractionDigits={2} dire />
      </div>
      {entrant ? brasserie : poche}
    </div>
    <div className="mvt-flip"><button type="button" className="mvt-lien" onClick={() => p.onKind(entrant ? 'withdrawal' : 'contribution')}><span aria-hidden="true">⇄</span> Dans l’autre sens : {entrant ? 'je reprends' : 'j’apporte'}</button></div>

    <div className="mvt-eff" data-booster="effet-mois" aria-label="Effet de ce mouvement">
      <div className="mvt-ln"><span>Caisse</span>
        <span className="mvt-tr" data-etat={piste ? undefined : 'inconnue'}>
          {piste && <><i style={{ left: 0, width: `${piste.base}%` }} className="mvt-base" /><i style={{ left: `${piste.base}%`, width: `${piste.segment}%` }} className="mvt-seg" /></>}
          {!piste && <i style={{ left: 0, width: '100%' }} className="mvt-seg" />}
        </span>
        <b className="mvt-m" data-sens={entrant ? 'in' : 'out'}>{effet.deltaCents === null ? '—' : signe(effet.deltaCents)}</b></div>
      <div className="mvt-ln"><span>Ventes − dépenses</span>
        <span className="mvt-tr"><i style={{ left: 0, width: `${resultat}%` }} className="mvt-res" /></span>
        <b className="mvt-m mvt-m-neutre">{signe(effet.resultatCents)}</b></div>
      <p className="mvt-res-t">inchangé : {entrant ? 'un apport n’est pas une vente' : 'un prélèvement n’est pas une dépense'}{effet.caisseCents === null ? ' · caisse actuelle inconnue (solde de départ à confirmer)' : ''}</p>
    </div>

    <div className="mvt-f"><span id="mvt-quand">Quand</span>
      <div className="mvt-chips" role="radiogroup" aria-labelledby="mvt-quand">
        <button type="button" role="radio" aria-checked={!autre} className="mvt-c" onClick={() => { setAutre(false); p.onDate(aujourdhui); }}>aujourd’hui · {shortDate(aujourdhui)}</button>
        <button type="button" role="radio" aria-checked={autre} className="mvt-c" onClick={() => setAutre(true)}>{autre && p.date !== aujourdhui ? shortDate(p.date) : 'autre date…'}</button>
      </div>
      {autre && <label className="mvt-in mvt-date"><input type="date" aria-label="Date" value={p.date} max={aujourdhui} onChange={e => p.onDate(e.target.value)} required /></label>}
    </div>
    <div className="mvt-f"><span id="mvt-compte">Sur quel compte</span>
      <div className="mvt-chips" role="radiogroup" aria-labelledby="mvt-compte">
        {COMPTES.map(([valeur, nom]) => <button key={valeur} type="button" role="radio" aria-checked={p.method === valeur} className="mvt-c" onClick={() => p.onMethod(valeur)}>{nom}</button>)}
      </div>
    </div>
    <label className="mvt-f"><span>Motif</span><span className="mvt-in" data-manque={p.motifManque ? 'true' : undefined}><Input ref={champMotif} aria-label="Motif" aria-invalid={p.motifManque ? true : undefined} aria-describedby={p.motifManque ? 'mvt-motif-err' : undefined} value={p.note} onChange={e => p.onNote(e.target.value)} placeholder={entrant ? 'Apport pour le malt de décembre' : 'Prélèvement personnel…'} /></span>{p.motifManque && <span id="mvt-motif-err" role="alert" className="mvt-err">{entrant ? 'Dis à quoi sert cet apport (le motif) pour l’enregistrer.' : 'Dis à quoi sert ce prélèvement (le motif) pour l’enregistrer.'}</span>}</label>

    <div className="mvt-f" role="group" aria-labelledby="mvt-just"><span id="mvt-just">Justificatif · relevé ou quittance</span>
      <input ref={photo} type="file" accept="image/*" capture="environment" hidden aria-label="Justificatif : photo" onChange={choisir} />
      <input ref={fichier} type="file" accept="image/jpeg,image/png,image/webp,application/pdf,.pdf" hidden aria-label="Justificatif : fichier ou PDF" onChange={choisir} />
      {p.piece
        ? <div className="mvt-jf" data-booster="justificatif" data-etat="joint">
            <span className="mvt-th" aria-hidden="true">{p.piece.mime.startsWith('image/') ? <img src={p.piece.dataUrl} alt="" /> : <IconeFichier />}</span>
            <span className="mvt-jt"><b>{p.piece.name}</b><small>✓ joint · {shortDate(p.date)}{p.amount ? <> · <span className="mvt-m">{amountOnly(p.amount)}</span></> : null}</small></span>
            <button type="button" className="mvt-mini" onClick={() => fichier.current?.click()}>Changer</button>
            <button type="button" className="mvt-mini" onClick={() => p.onPiece(null)}>Retirer</button>
          </div>
        : <div className="mvt-js" data-booster="justificatif" data-etat="sans-piece">
            <button type="button" onClick={() => photo.current?.click()}><IconePhoto />Photo</button>
            <button type="button" onClick={() => fichier.current?.click()}><IconeFichier />Fichier ou PDF</button>
          </div>}
      {p.pieceError && <p role="alert" className="mvt-err">{p.pieceError}</p>}
    </div>
  </div>;
}
