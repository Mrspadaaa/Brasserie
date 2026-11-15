import React from 'react';
import { Sheet } from '../../Sheet';
import { ExerciceField, Field } from '../FinanceForms';
import { moisDeLAnnee, pctSeuil, piecesAClasser } from './calculs';
import type { TvaThresholdStatus } from '../../../domain/finance/tvaThreshold';
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
  // Même règle que la tête et l'étape 4 : une pièce de travaux sans classement est « à classer », ni charge ni matériel tant qu'elle n'est pas rangée.
  const aClasserCents = React.useMemo(() => piecesAClasser(c.transactions, c.assets, c.year).reduce((n, p) => n + p.chargeCents, 0), [c.transactions, c.assets, c.year]);
  const valeur = (m: typeof mois[number]) => vue === 'entre' ? m.entreCents : vue === 'depense' ? m.depenseCents : m.gainCents;
  return <Sheet open title={`Mois par mois · ${c.year}`} onClose={onClose} className="finance-sheet">
    <div className="ann-mm">
      <div className="ann-seg ann-seg-l" role="group" aria-label="Ce que montrent les mois">{([['resultat', 'Résultat'], ['entre', 'Entré'], ['depense', 'Dépensé']] as const).map(([k, l]) => <button type="button" key={k} aria-pressed={vue === k} className={vue === k ? 'on' : ''} onClick={() => setVue(k)}>{l}</button>)}</div>
      <div className="ann-mois ann-mois4">{mois.map(m => m.etat === 'notes'
        ? <div key={m.mois} className={`ann-mo${vue === 'resultat' ? (m.gainCents < 0 ? ' neg' : ' pos') : ''}${choisi?.mois === m.mois ? ' cur' : ''}`}><small>{MOIS[m.mois - 1]}</small><span className="ann-m">{vue === 'resultat' && valeur(m) > 0 ? '+' : ''}{montant(valeur(m))}</span></div>
        : m.etat === 'vide' ? <div key={m.mois} className="ann-mo q ann-hachA"><small>{MOIS[m.mois - 1]}</small><span className="ann-terme">rien noté</span></div>
        : <div key={m.mois} className="ann-mo av"><small>{MOIS[m.mois - 1]}</small><span className="ann-avenir">à venir</span></div>)}</div>
      {choisi && <p className="ann-chip">{MOIS[choisi.mois - 1]} · Entré <span className="ann-m">{montant(choisi.entreCents)}</span> · Dépensé <span className="ann-m">{montant(choisi.depenseCents)}</span></p>}
      {aPart > 0 && <p className="ann-chip">Matériel à part <span className="ann-m">{montant(aPart)}</span>{aClasserCents > 0 ? <> dont à classer <span className="ann-m">{montant(aClasserCents)}</span> : l’année ne le compte pas encore, ni en charge ni en usure.</> : ' : l’année ne compte que son usure.'}</p>}
      {aClasserCents > 0 && <button type="button" className="ann-link" onClick={() => { onClose(); c.act.aller(4); }}>Classer ces pièces (étape 4) ›</button>}
      <p className="ann-terme">Mois par mois, le matériel est à part (comme la Synthèse) ; l’année l’écrit « à classer » tant qu’une pièce n’est pas rangée.</p>
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

/** Le seuil de TVA : le domaine ne rédige de message qu'à partir de 80 % (avertissement) ; en dessous, la feuille disait « rien » et s'ouvrait vide. Elle dit maintenant où en est le brasseur, avec ses chiffres. */
export function TvaFeuille({ statut, assujetti, onClose }: { statut: TvaThresholdStatus; assujetti: boolean; onClose: () => void }) {
  const chf = (cents: number) => `${montant(cents)} CHF`, suisse = (iso: string) => iso.split('-').reverse().join('.');
  return <Sheet open title="TVA" onClose={onClose} className="finance-sheet">
    <div className="finance-form">
      <p><strong>{pctSeuil(statut.ratio * 100)} du seuil de TVA</strong> · {assujetti ? 'assujetti' : 'non assujetti'}</p>
      <p className="finance-muted">Chiffre d’affaires hors taxe <span className="ann-m">{chf(statut.turnoverCents)}</span> sur 12 mois glissants (du {suisse(statut.from)} au {suisse(statut.to)}), pour un seuil de <span className="ann-m">{chf(statut.thresholdCents)}</span> : il reste <span className="ann-m">{chf(Math.max(0, statut.thresholdCents - statut.turnoverCents))}</span>.</p>
      {statut.message && <p className="finance-notice">{statut.message}</p>}
      <p className="finance-muted">Au-delà du seuil, l’assujettissement peut devenir obligatoire (art. 10 LTVA) : à vérifier avec l’AFC ou ta fiduciaire.</p>
    </div>
  </Sheet>;
}
