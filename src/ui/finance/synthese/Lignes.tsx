import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Batch, Recipe, Transaction } from '../../../types';
import type { FinancialPayment, FinancialPlan } from '../../../domain/finance/types';
import type { BrewBudgetSnapshot } from '../../../domain/finance/brewBudget';
import { netVolumeSaisi } from '../../../domain/finance/brewBudget';
import { coutLitre, litresNets, troisNotions } from '../../../domain/finance/chaineLitre';
import { formatCHF, isActiveTransaction, isoDate, transactionAmount, transactionDirection, transactionKind, transactionVendor, type LedgerSummary } from '../../../domain/finance/ledger';
import type { PeriodeSynthese } from '../../../domain/finance/periodeSynthese';
import type { TvaThresholdStatus } from '../../../domain/finance/tvaThreshold';
import { compte } from '../../../services/plural';
import { nombreFr } from '../../../domain/nombreAffiche';
import type { JournalRequest } from '../TransactionJournal';
import { UpgradeAnalytics } from '../UpgradeWorkspace';
import { amountOnly } from '../financeFormat';

/** Un instantané par brassin ou recette, le plus récent d'abord (reprend l'ancien « Coût des brassins »). */
export function derniersInstantanes(plans: FinancialPlan[]): Array<{ plan: FinancialPlan; snapshot: BrewBudgetSnapshot }> {
  const vus = new Set<string>();
  return plans.filter(p => p.brewEstimate).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).flatMap(plan => {
    const snapshot = plan.brewEstimate as BrewBudgetSnapshot, cle = snapshot.batchId ?? snapshot.recipeId ?? plan.id;
    if (vus.has(cle)) return [];
    vus.add(cle);
    return [{ plan, snapshot }];
  });
}

/** Le CHF/L, par les mêmes trois appels de domaine que le budget de brassin et les Prévisions : aucun calcul ici, l'inconnu reste « À compléter ». */
export function litreDuBrassin(snapshot: BrewBudgetSnapshot, batch?: Batch): { litres: number | null; chfParL: number | null; manque: string[] } {
  const nets = litresNets({ conditionneL: batch?.volumePackagedL, netEnregistreL: netVolumeSaisi(snapshot) });
  const notions = troisNotions(snapshot);
  const litre = coutLitre({ notions, litres: nets?.litres });
  return { litres: nets?.litres ?? null, chfParL: litre?.affiche.complet ?? null, manque: notions?.manque ?? (notions ? [] : ['estimation à rouvrir']) };
}

export interface LitreProps { plans: FinancialPlan[]; batches: Batch[]; recipes: Recipe[]; onOpenBudget: (cible: { batch?: Batch; recipe?: Recipe }) => void; onAbsent: (message: string) => void; onPicker: () => void }

/** E5 : le dernier brassin estimé, son coût du litre tout compris ; « + » ouvre le choix d'un autre brassin. */
export function LigneLitre({ plans, batches, recipes, onOpenBudget, onAbsent, onPicker }: LitreProps) {
  const dernier = derniersInstantanes(plans)[0];
  if (!dernier) return <div className="syn-row" data-ligne="litre">
    <span className="syn-t">Estimer un brassin<small>pour connaître son coût du litre</small></span>
    <button type="button" className="syn-plus" aria-label="Estimer un brassin" onClick={onPicker}>+</button>
  </div>;
  const { snapshot } = dernier;
  const batch = batches.find(b => b.id === snapshot.batchId), recipe = recipes.find(r => r.id === snapshot.recipeId);
  const litre = litreDuBrassin(snapshot, batch);
  const ouvrir = () => batch || recipe ? onOpenBudget({ batch, recipe }) : onAbsent('La recette de ce budget est absente. Le budget enregistré reste conservé.');
  return <div className="syn-row" data-ligne="litre">
    <button type="button" className="syn-t syn-t-bouton" onClick={ouvrir} aria-label={`${snapshot.title}, coût du litre : ouvrir le budget`}>
      {snapshot.title}
      <small>{litre.litres !== null ? `${nombreFr(litre.litres, 1)} L nets` : 'litres nets à saisir'}<i className="syn-dt" aria-hidden="true"/>tout compris<i className="syn-dt" aria-hidden="true"/>estimé</small>
    </button>
    <span className="syn-m syn-litre">{litre.chfParL !== null ? `${formatCHF(Math.round(litre.chfParL * 100))}/L` : 'À compléter'}</span>
    <button type="button" className="syn-plus" aria-label="Coût d’un autre brassin" onClick={onPicker}>+</button>
  </div>;
}

export interface ReplieProps {
  transactions: Transaction[]; payments: FinancialPayment[]; plans: FinancialPlan[];
  mois: string | null;
  onJournal: (request: Omit<JournalRequest, 'key'>) => void;
  onUpgrade: (plan: FinancialPlan) => void; onBrowseProjects: () => void;
}
/** Principaux fournisseurs de la période (≤ 5), avoirs déduits : les montants de l'ancien écran Coûts. */
export function fournisseurs(transactions: Transaction[], mois: string | null): Array<[string, number]> {
  const sommes = new Map<string, number>();
  for (const t of transactions.filter(isActiveTransaction)) {
    const date = isoDate(t.date), kind = transactionKind(t);
    if (!date || mois !== null && !date.startsWith(mois)) continue;
    const sortant = kind === 'expense' || kind === 'refund' && transactionDirection(t, transactions) === 'in';
    if (!sortant) continue;
    const nom = transactionVendor(t) || 'Fournisseur à compléter';
    sommes.set(nom, (sommes.get(nom) ?? 0) + (kind === 'refund' ? -1 : 1) * transactionAmount(t));
  }
  return [...sommes.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
}

/** E6 : « Fournisseurs, matériel », repliée ; dedans, les fournisseurs et l'évolution de la brasserie. */
export function Replie({ transactions, payments, plans, mois, onJournal, onUpgrade, onBrowseProjects }: ReplieProps) {
  const [ouvert, setOuvert] = useState(false);
  const liste = fournisseurs(transactions, mois);
  return <div>
    <button type="button" className="syn-row syn-row-bouton" aria-expanded={ouvert} onClick={() => setOuvert(!ouvert)}>
      <span className="syn-t">Fournisseurs, matériel</span>
      <ChevronDown size={16} aria-hidden="true" className={ouvert ? 'syn-ouvert' : undefined}/>
    </button>
    {ouvert && <div className="syn-replie">
      {liste.length > 0 && <ul className="syn-four" aria-label="Principaux fournisseurs">
        {liste.map(([nom, cents]) => <li key={nom}><button type="button" onClick={() => onJournal({ scope: 'all', query: nom === 'Fournisseur à compléter' ? '' : nom, month: mois ?? undefined, allDates: mois === null })}>
          <span>{nom}</span><span className="syn-m">{amountOnly(cents)}</span><ChevronRight size={14} aria-hidden="true"/></button></li>)}
      </ul>}
      <UpgradeAnalytics plans={plans} transactions={transactions} payments={payments} onOpen={onUpgrade} onBrowse={onBrowseProjects}/>
      {!liste.length && !plans.length && <p className="syn-note">Rien à montrer sur cette période.</p>}
    </div>}
  </div>;
}

export interface VerifierProps {
  periode: PeriodeSynthese; ledger: LedgerSummary; tvaThreshold?: TvaThresholdStatus | null;
  onJournal: (request: Omit<JournalRequest, 'key'>) => void;
}
const Rang = ({ titre, texte, nombre, onClick }: { titre: string; texte?: string; nombre?: number; onClick?: () => void }) => {
  const corps = <><span className="syn-t">{titre}{texte && <small>{texte}</small>}</span>{nombre !== undefined && <span className="syn-n">{nombre}</span>}{onClick && <ChevronRight size={16} aria-hidden="true"/>}</>;
  return onClick ? <button type="button" className="syn-row syn-row-bouton" onClick={onClick}>{corps}</button> : <div className="syn-row">{corps}</div>;
};

/** Seuil de TVA franchi : une alerte réglementaire, jamais repliée ; le niveau « warn » vit dans « À vérifier ». */
export function AlerteTva({ tvaThreshold, onJournal }: { tvaThreshold?: TvaThresholdStatus | null; onJournal: VerifierProps['onJournal'] }) {
  if (!tvaThreshold || tvaThreshold.level !== 'over') return null;
  return <section className="syn-tva" role="alert" aria-label="Seuil de TVA" data-level="over">
    <h3>Seuil de TVA franchi</h3><p>{tvaThreshold.message}</p>
    <button type="button" className="syn-lien" onClick={() => onJournal({ scope: 'all', allDates: true, category: 'recettes' })}>Voir les ventes<ChevronRight size={14} aria-hidden="true"/></button>
  </section>;
}

/** Ce qui rend le chiffre moins sûr. Absent quand il n'y a rien : l'écran est alors celui de la maquette, sans une ligne de plus. */
export function Verifier({ periode: p, ledger, tvaThreshold, onJournal }: VerifierProps) {
  const v = p.aVerifier;
  const soon = tvaThreshold && tvaThreshold.level === 'warn';
  const lignes: React.ReactNode[] = [];
  if (ledger.unknownPaymentCount > 0) lignes.push(<Rang key="paiements" titre="Confirmer les paiements" texte={`${compte(ledger.unknownPaymentCount, 'pièce')} exclue${ledger.unknownPaymentCount > 1 ? 's' : ''} des montants à payer et à encaisser.`} nombre={ledger.unknownPaymentCount} onClick={() => onJournal({ scope: 'all', allDates: true, filter: 'unknown' })}/>);
  if (v.sansDate.length > 0) lignes.push(<Rang key="dates" titre="Vérifier les pièces sans date" texte={`${compte(v.sansDate.length, 'pièce')} avec une date à corriger, à replacer dans la bonne période.`} onClick={() => onJournal({ scope: 'all', allDates: true, filter: 'review' })}/>);
  if (v.avoirsInvalides.length > 0) lignes.push(<Rang key="avoirs" titre="Avoirs sans facture valide" texte={`${compte(v.avoirsInvalides.length, 'avoir')} laissé${v.avoirsInvalides.length > 1 ? 's' : ''} de côté : sans facture d’origine valide.`}/>);
  if (v.avoirsNonDessinesCents > 0) lignes.push(<Rang key="excedent" titre="Avoirs au-delà du poste" texte={`${formatCHF(v.avoirsNonDessinesCents)} d’avoirs dépassent ce que cette période a dépensé : ils ne sont pas dessinés en négatif.`}/>);
  if (v.materielSansRegistre.length > 0) lignes.push(<Rang key="registre" titre="Matériel sans registre" texte={`${v.materielSansRegistre.slice(0, 3).join(', ')} : rangé à part, mais sans immobilisation au registre (l’Annuel le compte autrement).`}/>);
  if (soon) lignes.push(<div key="tva" className="syn-row" role="status"><span className="syn-t">Seuil de TVA bientôt atteint<small>{tvaThreshold.message}</small></span>
    <button type="button" className="syn-lien" onClick={() => onJournal({ scope: 'all', allDates: true, category: 'recettes' })}>Voir les ventes</button></div>);
  if (!lignes.length && !ledger.warnings.length) return null;
  return <section className="syn-verifier" aria-label="À vérifier">
    {lignes}
    {ledger.warnings.length > 0 && <details className="syn-details"><summary>Origine et limites des montants</summary><ul>{ledger.warnings.map(w => <li key={w}>{w}</li>)}</ul></details>}
  </section>;
}
