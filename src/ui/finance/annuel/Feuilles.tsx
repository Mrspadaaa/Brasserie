import React from 'react';
import { Sheet } from '../../Sheet';
import { ExerciceField, Field } from '../FinanceForms';
import { moisDeLAnnee } from './calculs';
import { montant } from '../previsions/format';
import type { Ctx } from './ctx';
import type { FinancialClosing } from '../../../domain/finance/types';

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** « Mois par mois » (g4a-etat) : base Synthèse (matériel à part), dite sur l'écran ; ce n'est pas le résultat de l'année. */
export function MoisParMois({ c, onClose }: { c: Ctx; onClose: () => void }) {
  const [vue, setVue] = React.useState<'resultat' | 'entre' | 'depense'>('resultat');
  const mois = React.useMemo(() => moisDeLAnnee(c.transactions, c.payments, c.year, c.today), [c.transactions, c.payments, c.year, c.today]);
  const courant = c.anneeCourante ? Number(c.today.slice(5, 7)) : 0;
  const choisi = mois.find(m => m.mois === courant) ?? mois.filter(m => m.etat === 'notes').slice(-1)[0];
  const aPart = mois.reduce((n, m) => n + m.materielCents, 0);
  const valeur = (m: typeof mois[number]) => vue === 'entre' ? m.entreCents : vue === 'depense' ? m.depenseCents : m.gainCents;
  return <Sheet open title={`Mois par mois · ${c.year}`} onClose={onClose} className="finance-sheet">
    <div className="ann-mm">
      <div className="ann-seg ann-seg-l" role="group" aria-label="Ce que montrent les mois">{([['resultat', 'Résultat'], ['entre', 'Entré'], ['depense', 'Dépensé']] as const).map(([k, l]) => <button type="button" key={k} aria-pressed={vue === k} className={vue === k ? 'on' : ''} onClick={() => setVue(k)}>{l}</button>)}</div>
      <div className="ann-mois ann-mois4">{mois.map(m => m.etat === 'notes'
        ? <div key={m.mois} className={`ann-mo${vue === 'resultat' ? (m.gainCents < 0 ? ' neg' : ' pos') : ''}${choisi?.mois === m.mois ? ' cur' : ''}`}><small>{MOIS[m.mois - 1]}</small><span className="ann-m">{vue === 'resultat' && valeur(m) > 0 ? '+' : ''}{montant(valeur(m))}</span></div>
        : m.etat === 'vide' ? <div key={m.mois} className="ann-mo q ann-hachA"><small>{MOIS[m.mois - 1]}</small><span className="ann-terme">rien noté</span></div>
        : <div key={m.mois} className="ann-mo av"><small>{MOIS[m.mois - 1]}</small><span className="ann-avenir">à venir</span></div>)}</div>
      {choisi && <p className="ann-chip">{MOIS[choisi.mois - 1]} · Entré <span className="ann-m">{montant(choisi.entreCents)}</span> · Dépensé <span className="ann-m">{montant(choisi.depenseCents)}</span></p>}
      {aPart > 0 && <p className="ann-chip">Matériel à part <span className="ann-m">{montant(aPart)}</span> : dans l’année, il compte en charge.</p>}
      <p className="ann-terme">Mois par mois, le matériel est à part (comme la Synthèse) ; l’année le compte en charge tant qu’il n’est pas au registre.</p>
    </div>
  </Sheet>;
}

/** Ce que `2026 ⌄` ouvre (non dessiné par la maquette, § 7 D7) : l'exercice validé, la version et le solde. */
export function AnneeVersions({ year, onYear, closings, closing, onVersion, onProfile, onClose }: { year: number; onYear: (y: number) => void; closings: FinancialClosing[]; closing?: FinancialClosing; onVersion: (id: string) => void; onProfile: () => void; onClose: () => void }) {
  return <Sheet open title="Année et versions" onClose={onClose} className="finance-sheet">
    <div className="finance-form">
      <ExerciceField year={year} onYear={onYear}/>
      {!!closings.length && <Field label="Version de l’année"><select value={closing?.id ?? ''} onChange={e => onVersion(e.target.value)}>{closings.map(x => <option key={x.id} value={x.id}>{x.report ? 'Version figée' : 'Brouillon'} · {new Date(x.createdAt).toLocaleString('fr-CH')}</option>)}</select></Field>}
      <button type="button" className="finance-link" onClick={() => { onClose(); onProfile(); }}>Solde et paramètres financiers</button>
    </div>
  </Sheet>;
}

export function TvaFeuille({ message, onClose }: { message: string; onClose: () => void }) {
  return <Sheet open title="TVA" onClose={onClose} className="finance-sheet"><p className="finance-muted">{message}</p></Sheet>;
}
