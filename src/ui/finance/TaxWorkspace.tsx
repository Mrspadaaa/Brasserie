import React, { useMemo, useRef, useState } from 'react';
import type { StockItem, Batch } from '../../types';
import type { AnnualReport, FinanceTransaction, FinancialAsset, FinancialClosing, FinancialPayment, FinancialPlan, FinancialProfile } from '../../domain/finance/types';
import { buildFribourgTaxReport, taxBasisKey } from '../../domain/finance/fribourgTax';
import { todayISO } from '../../domain/finance/ledger';
import type { TvaThresholdStatus } from '../../domain/finance/tvaThreshold';
import { TaxClosingSheet, type TaxSection } from './TaxClosingSheet';
import type { JournalRequest } from './TransactionJournal';
import { Tete } from './annuel/Tete';
import { Etape1, Etape2, Etape3, Etape4, Etape5 } from './annuel/Etapes';
import { Etape6, Etape7, Etape8, Etape9 } from './annuel/Etapes2';
import { AnneeVersions, MoisParMois, TvaFeuille } from './annuel/Feuilles';
import { etapesPiste, relecturesPerimees } from './annuel/calculs';
import { ecrireTax } from './annuel/Ecrire';
import { useDossier } from './annuel/dossier';
import type { Ctx, OuvertureInventaire } from './annuel/ctx';
import './tax.css';
import './annuel.css';

const BrewerChat = React.lazy(() => import('../BrewerChat').then(m => ({ default: m.BrewerChat })));

/**
 * L'Annuel (g6, choisi le 09.11) : la tête de g4a (l'année à la même échelle), puis les neuf écrans de la clôture.
 * Remplace entièrement les trois onglets « Préparer / Reporter / Dossier » ; les feuilles de saisie restent des feuilles.
 * Tous les nombres viennent du domaine (`report`, `tax`) ; l'écran ne calcule que des rangements (voir `annuel/calculs.ts`).
 */
export function TaxWorkspace({ report, closing, closings = [], year = report.year, transactions, payments = [], assets, plans = [], stockItems = [], batches = [], profile, tvaThreshold = null, companyName, today = todayISO(),
  onYear = () => {}, onProfile, onInventories, onAsset, onVersion, onOperations, onArchives = () => {} }: {
  report: AnnualReport; closing?: FinancialClosing; closings?: FinancialClosing[]; year?: number; transactions: FinanceTransaction[]; payments?: FinancialPayment[]; assets: FinancialAsset[];
  plans?: FinancialPlan[]; stockItems?: StockItem[]; batches?: Batch[]; profile: FinancialProfile; tvaThreshold?: TvaThresholdStatus | null; companyName: string; today?: string;
  onYear?: (year: number) => void; onProfile: () => void; onInventories: (ouverture?: OuvertureInventaire) => void;
  onAsset: (asset: FinancialAsset | null, initial?: Partial<FinancialAsset>) => void; onVersion: (id: string) => void;
  onOperations?: (request: Omit<JournalRequest, 'key'>) => void; onArchives?: () => void;
}) {
  const [etape, setEtape] = useState(0), [feuille, setFeuille] = useState<TaxSection | null>(null), [vue, setVue] = useState<'mois' | 'annee' | 'tva' | null>(null);
  const [question, setQuestion] = useState<string | undefined>();
  const tax = useMemo(() => report.tax ?? buildFribourgTaxReport(report), [report]);
  const dossier = useDossier({ report, closing, tax, transactions, companyName, onVersion });
  const idCourant = useRef(closing?.id);
  idCourant.current = closing?.id;
  const gele = !!closing?.report;
  const ecrire = (patch: Parameters<Ctx['act']['ecrire']>[0]) => {
    try { const saved = ecrireTax(year, report, idCourant.current, patch); if (saved.id !== idCourant.current) { idCourant.current = saved.id; onVersion(saved.id); } dossier.setNotice('Enregistré sur cet appareil.'); }
    catch (e) { dossier.setNotice((e as Error).message); }
  };
  const nouvelleVersion = () => ecrire(() => {});
  const aller = (n: number) => { setEtape(n); if (typeof window !== 'undefined') window.scrollTo?.({ top: 0 }); };
  const c: Ctx = {
    year, today, anneeCourante: Number(today.slice(0, 4)) === year, report, tax, closing, profile, assets, plans, stockItems, batches, transactions, payments, gele,
    perimees: relecturesPerimees(closing, taxBasisKey(report)), etapes: etapesPiste({ report, tax, closing, profile, assets }), dossier,
    act: { ecrire, feuille: setFeuille, onProfile, onInventories, onAsset, onOperations: onOperations ?? (() => {}), onArchives, aller, assistant: setQuestion }
  };
  const tva = tvaThreshold ? { libelle: profile.vatRegistered ? 'assujetti · sur 12 mois à ce jour' : 'non assujetti · sur 12 mois à ce jour', pct: Math.floor(tvaThreshold.ratio * 100) } : null;
  const corps = [null, Etape1, Etape2, Etape3, Etape4, Etape5, Etape6, Etape7, Etape8][etape] as ((p: { c: Ctx }) => React.ReactElement) | null;
  return <div className="ann" onKeyDown={e => { if (e.key === 'Escape' && etape > 0 && !feuille && !vue && question === undefined) aller(0); }}>
    <h2 className="ann-sr">Annuel</h2>
    {dossier.notice && etape !== 9 && <p className="ann-gele" role="status">{dossier.notice}</p>}
    {etape === 0 && <Tete c={c} tva={tva ? { ...tva, libelle: tva.libelle } : null} onAnnee={() => setVue('annee')} onMois={() => setVue('mois')} onTva={() => setVue('tva')}/>}
    {etape >= 1 && etape <= 8 && corps && React.createElement(corps, { c })}
    {etape === 9 && <Etape9 c={c} nouvelleVersion={nouvelleVersion}/>}
    {feuille && <TaxClosingSheet closing={closing} report={report} section={feuille} onClose={() => setFeuille(null)} onSaved={onVersion}/>}
    {vue === 'mois' && <MoisParMois c={c} onClose={() => setVue(null)}/>}
    {vue === 'annee' && <AnneeVersions year={year} onYear={onYear} closings={closings} closing={closing} onVersion={onVersion} onProfile={onProfile} onClose={() => setVue(null)}/>}
    {vue === 'tva' && tvaThreshold && <TvaFeuille message={tvaThreshold.message} onClose={() => setVue(null)}/>}
    {question !== undefined && <React.Suspense fallback={null}><BrewerChat scope={{ kind: 'app', id: 'finances' }} label="Mes finances" phase="Finances de la brasserie" initialOpen hideLauncher initialQuestion={question} suggestedPrompts={[]} onClose={() => setQuestion(undefined)}/></React.Suspense>}
  </div>;
}
