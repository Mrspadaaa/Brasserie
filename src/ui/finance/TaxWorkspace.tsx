import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, ChevronRight, Copy, FileDown, FileText, Loader2, Plus, Wrench } from 'lucide-react';
import type { AnnualReport, FinanceTransaction, FinancialAsset, FinancialClosing, FinancialProfile } from '../../domain/finance/types';
import { buildFribourgTaxReport, FRIBOURG_TAX_SOURCE, taxBasisKey, taxCopyValue, TAX_REVIEWS } from '../../domain/finance/fribourgTax';
import { formatCHF } from '../../domain/finance/ledger';
import { FinanceService } from '../../services/financeService';
import { TaxClosingSheet, type TaxSection } from './TaxClosingSheet';
import type { TaxArchiveResult } from '../../services/taxArchive';
import { DriveConnection } from './DriveConnection';
import { compte } from '../../services/plural';
import './tax.css';

export function TaxWorkspace({ report, closing, transactions, assets, profile, companyName, onProfile, onInventories, onAsset, onVersion, onOperations }: {
  report: AnnualReport; closing?: FinancialClosing; transactions: FinanceTransaction[]; assets: FinancialAsset[];
  profile: FinancialProfile; companyName: string; onProfile: () => void; onInventories: () => void;
  onAsset: (asset: FinancialAsset | null) => void; onVersion: (id: string) => void;
  onOperations?: () => void;
}) {
  const [step, setStep] = useState<'prepare' | 'copy' | 'documents'>('prepare');
  const [edit, setEdit] = useState<TaxSection | null>(null), [notice, setNotice] = useState(''), [copied, setCopied] = useState('');
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState('');
  const [driveAuthError, setDriveAuthError] = useState(false);
  const [archive, setArchive] = useState<{ result: TaxArchiveResult; missingCount: number; volume: number } | null>(null);
  const assetRegister = useRef<HTMLDetailsElement>(null), work = useRef<AbortController | null>(null), busyRef = useRef(false);
  const tax = useMemo(() => report.tax ?? buildFribourgTaxReport(report), [report]);
  const basis = `${closing?.id ?? ''}:${taxBasisKey(report)}:${JSON.stringify(tax)}`;
  useEffect(() => { setArchive(null); setCopied(''); setNotice(''); work.current?.abort(); setBusy(false); busyRef.current = false; }, [basis]);
  useEffect(() => () => work.current?.abort(), []);
  const copy = async (id: string, cents: number | null) => {
    if (cents == null) return;
    try { await navigator.clipboard.writeText(taxCopyValue(cents)); setCopied(id); setNotice('Montant copié, en CHF sans séparateur de milliers.'); }
    catch { setNotice('Copie automatique indisponible. Sélectionne le montant dans le champ pour le copier.'); }
  };
  const download = async (kind: 'zip' | 'pdf' | 'xlsx', resume = false) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setNotice(''); setDriveAuthError(false); setProgress('Préparation du dossier…');
    const controller = new AbortController(); work.current = controller;
    try {
      if (kind === 'zip') {
        const { createTaxArchive, downloadTaxArchive } = await import('../../services/taxArchive');
        const volume = resume && archive ? archive.volume + 1 : 1;
        const result = await createTaxArchive({ report, transactions, companyName, frozen: !!closing?.report, startIndex: resume ? archive?.result.nextIndex ?? 0 : 0, volume, signal: controller.signal, onProgress: (done, total) => setProgress(`Justificatifs : ${done} sur ${total}`) });
        if (controller.signal.aborted) return;
        downloadTaxArchive(result);
        const missingCount = (resume ? archive?.missingCount ?? 0 : 0) + result.missingCount;
        setArchive({ result, missingCount, volume });
        setNotice(result.nextIndex != null ? `Volume ${volume} téléchargé. Télécharge la suite pour récupérer les justificatifs restants.` : missingCount ? `Dossier téléchargé avec ${missingCount} justificatif(s) non joint(s). Consulte l’index pour les compléter.` : 'Dossier téléchargé. Les originaux récupérés sont indexés ; vérifie leur lisibilité et les pièces demandées par FriTax.');
      } else {
        const { exportAnnualReport } = await import('../../services/financeExport');
        if (!controller.signal.aborted) { exportAnnualReport(report, companyName, kind); setNotice(kind === 'pdf' ? 'Comptes PDF téléchargés. Les originaux se trouvent dans le dossier ZIP.' : 'Classeur téléchargé avec les calculs et les reports.'); }
      }
    } catch (e) { if (!controller.signal.aborted) { setNotice((e as Error).message); setDriveAuthError((e as {code?:string})?.code === 'drive/auth-required'); } }
    finally { if (work.current === controller) { busyRef.current = false; setBusy(false); setProgress(''); } }
  };
  const freeze = async () => {
    if (!closing || busyRef.current) return;
    busyRef.current = true; setBusy(true); setNotice('');
    try { const saved = await FinanceService.finalizeClosing(closing); onVersion(saved.id); setNotice('Version figée : chiffres, corrections et références des originaux conservés.'); }
    catch (e) { setNotice((e as Error).message); setDriveAuthError((e as {code?:string})?.code === 'drive/auth-required'); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const checked = TAX_REVIEWS.filter(r => tax.reviews[r.key]).length;
  const showAssets = () => { if (assetRegister.current) { assetRegister.current.open = true; assetRegister.current.scrollIntoView?.({ block: 'start', behavior: 'smooth' }); assetRegister.current.querySelector('summary')?.focus({ preventScroll: true }); } };
  const assetsToReview = assets.filter(asset => !asset.openingConfirmed || report.depreciation.some(row => row.assetId === asset.id && row.missing.length > 0)).length;
  const nextTask = !profile.openingCash?.confirmed
    ? { title: 'Renseigner le solde de départ', reason: 'Il permet de vérifier la trésorerie de la brasserie.', action: 'Renseigner le solde', run: onProfile }
    : !tax.reviews.journal && onOperations
      ? { title: 'Vérifier les opérations de l’année', reason: 'Confirme les paiements et complète les pièces avant de relire les comptes.', action: 'Ouvrir les opérations', run: onOperations }
      : !closing?.inventoriesConfirmed
        ? { title: 'Compléter les inventaires', reason: 'Le résultat attend les stocks de début et de fin d’année.', action: 'Renseigner les stocks', run: onInventories }
        : assetsToReview > 0
          ? { title: 'Vérifier le matériel à amortir', reason: `${compte(assetsToReview, 'fiche')} attend${assetsToReview > 1 ? 'ent' : ''} une valeur ou une méthode confirmée.`, action: 'Voir le matériel', run: showAssets }
          : { title: 'Relire les vérifications de l’année', reason: 'Confirme les contrôles avant de préparer le report et le dossier.', action: 'Ouvrir les vérifications', run: () => setEdit('checks') };
  return <div className="tax-workspace">
    <div className="tax-intro"><div><h3>Les impôts de ta brasserie</h3><p className="finance-muted">Comptes, reports et justificatifs de {report.year}.</p></div><span className={`finance-status ${tax.ready ? 'paid' : 'unknown'}`}>{closing?.report ? 'Version figée' : 'Brouillon'}</span></div>
    <div className="tax-steps" role="tablist" aria-label="Préparation des impôts">{([['prepare', 'Préparer'], ['copy', 'Reporter'], ['documents', 'Dossier']] as const).map(([key, label], i, steps) => <button type="button" role="tab" aria-selected={step === key} tabIndex={step === key ? 0 : -1} aria-controls={`tax-panel-${key}`} id={`tax-tab-${key}`} key={key} onClick={() => setStep(key)} onKeyDown={e => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return; e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? 2 : (i + (e.key === 'ArrowRight' ? 1 : 2)) % 3; setStep(steps[next][0]); (e.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus(); }}><span aria-hidden="true">{i + 1}</span>{label}</button>)}</div>
    <div role="status" className="tax-status"><span>{tax.ready ? <Check size={16}/> : <AlertCircle size={16}/>}</span><p>{tax.ready ? 'Vérifications renseignées. Relis les comptes et les originaux avant le dépôt.' : 'Comptes provisoires : des informations restent à confirmer.'}</p></div>
    {notice && <p className="finance-notice" role="status">{notice}</p>}
    {driveAuthError && <DriveConnection always onConnected={() => { setDriveAuthError(false); setNotice('Drive connecté. Tu peux reprendre le téléchargement ou figer la version.'); }}/>}
    <div role="tabpanel" id={`tax-panel-${step}`} aria-labelledby={`tax-tab-${step}`}>
      {step === 'prepare' && <>
        {!tax.ready && <div className="tax-next-task"><div><strong>{nextTask.title}</strong><p className="finance-muted">{nextTask.reason}</p></div><button type="button" className="finance-action" onClick={nextTask.run}>{nextTask.action}<ChevronRight size={14}/></button>{onOperations && nextTask.run===onOperations && <button type="button" className="finance-link" onClick={()=>setEdit('checks')}>Confirmer la relecture</button>}</div>}
        <div className="finance-list">
          {onOperations && <button type="button" className="finance-row" onClick={onOperations}><span className="finance-row-main"><strong>Opérations et justificatifs</strong><span className="finance-muted">Paiements, classement et pièces de {report.year}</span></span><span className="finance-muted">{tax.reviews.journal ? 'Vérifiés' : 'À vérifier'}</span><ChevronRight size={16}/></button>}
          <button type="button" className="finance-row" onClick={onProfile}><span className="finance-row-main"><strong>Solde d’ouverture</strong><span className="finance-muted">Point de départ de la trésorerie</span></span><span className="finance-muted">{profile.openingCash?.confirmed ? 'Renseigné' : 'À confirmer'}</span><ChevronRight size={16}/></button>
          <button type="button" className="finance-row" onClick={onInventories}><span className="finance-row-main"><strong>Inventaires et ajustements</strong><span className="finance-muted">Matières, bière en cours et conditionnée</span></span><span className="finance-muted">{closing?.inventoriesConfirmed ? 'Vérifiés' : 'À compléter'}</span><ChevronRight size={16}/></button>
          <button type="button" className="finance-row" aria-controls="finance-asset-register" onClick={showAssets}><span className="finance-row-main"><strong>Matériel à amortir</strong><span className="finance-muted">Valeurs comptables des équipements</span></span><span className="finance-muted">{assetsToReview ? `${assetsToReview} à vérifier` : compte(assets.length, 'fiche')}</span><ChevronRight size={16}/></button>
          <button type="button" className="finance-row" onClick={() => setEdit('balance')}><span className="finance-row-main"><strong>Comptes et dettes</strong><span className="finance-muted">Soldes du 31 décembre et identité des tiers</span></span><ChevronRight size={16}/></button>
          <button type="button" className="finance-row" onClick={() => setEdit('corrections')}><span className="finance-row-main"><strong>Cotisations et parts privées</strong><span className="finance-muted">Vérifier leur effet sur le résultat</span></span><ChevronRight size={16}/></button>
          <button type="button" className="finance-row" onClick={() => setEdit('checks')}><span className="finance-row-main"><strong>Vérifications de l’année</strong><span className="finance-muted">Activité principale ou accessoire et contrôles</span></span><span className="finance-muted">{checked} / {TAX_REVIEWS.length}</span><ChevronRight size={16}/></button>
        </div>
        {!!tax.missing.length && <details className="finance-disclosure"><summary>Voir les points à compléter ({tax.missing.length})</summary><ul className="tax-issues">{tax.missing.map((m, i) => <li key={i}>{m}</li>)}</ul></details>}
        <details ref={assetRegister} id="finance-asset-register" className="finance-disclosure finance-section"><summary>Matériel et amortissements · {compte(assets.length, 'fiche')}</summary><p className="finance-muted mb-3">Amortissement de l’exercice {report.year}. Ouvre un matériel pour vérifier ses valeurs.</p><div className="finance-list">{assets.map(a => { const d = report.depreciation.find(r => r.assetId === a.id); return <button type="button" key={a.id} className="finance-row" onClick={() => onAsset(a)}><Wrench size={19}/><span className="finance-row-main"><strong>{a.name}</strong><span className="finance-muted">{a.openingConfirmed ? `${a.method === 'linear' ? 'Linéaire' : 'Dégressif'} · ${a.ratePct}%` : 'Valeurs à confirmer'}</span></span><span className="finance-money">{!d || d.missing.length ? 'À compléter' : formatCHF(d.depreciationCents)}</span><ChevronRight size={16}/></button>; })}</div>{!assets.length && <p className="finance-muted">Ajoute les équipements à amortir, par exemple une cuve ou un groupe froid.</p>}<button type="button" className="finance-link" onClick={() => onAsset(null)}><Plus size={17}/>Ajouter un amortissement</button></details>
        <button type="button" className="finance-action secondary tax-next" onClick={() => setStep('copy')}>Voir les montants à reporter<ChevronRight size={16}/></button>
      </>}
      {step === 'copy' && <>
        {!tax.mappingVerified && <p className="finance-notice">Les instructions vérifiées concernent {tax.sourceYear}. Tu peux préparer {report.year}, mais ses codes FriTax devront être vérifiés avant le report.</p>}
        {tax.fields.map(f => <section key={f.id} className="tax-copy-card"><div className="tax-copy-heading"><h3>{f.label}</h3>{f.code && <span className="tax-code">Code {f.code}</span>}</div><p className="finance-muted">{f.destination}</p><div className="tax-copy-value"><input aria-label={`Montant à copier : ${f.label}`} readOnly value={f.amountCents == null ? '' : taxCopyValue(f.amountCents)} placeholder="À compléter" onFocus={e => e.target.select()}/><span>CHF</span><button type="button" className="finance-action secondary" disabled={!f.ready} onClick={() => void copy(f.id, f.amountCents)} aria-label={`Copier ${f.label}`}>{copied === f.id ? <Check size={18}/> : <Copy size={18}/>}Copier</button></div><p className="finance-muted">{f.explanation}</p>{!f.ready && <p className="tax-copy-pending">À compléter avant report</p>}{f.id === 'wealth' && <button type="button" className="finance-link" onClick={() => setEdit('wealth')}>Confirmer le report de fortune<ChevronRight size={16}/></button>}</section>)}
        <details className="finance-disclosure"><summary>Comprendre le résultat et remplir les annexes</summary><div className="finance-list">{[['Ventes', report.revenueCents], ['Charges d’exploitation', report.operatingExpensesCents], ['Variation des stocks', report.inventoryChangeCents], ['Amortissements', report.depreciationCents], ['Cessions et ajustements comptables', report.disposalResultCents + report.adjustmentCents], ['Résultat comptable', report.resultCents], ['Corrections fiscales', tax.correctionCents], ['Revenu préparé', tax.taxableResultCents], ['Total des actifs', tax.totalAssetsCents], ['Total des dettes', tax.totalLiabilitiesCents], ['Patrimoine net comptable', tax.netAssetsCents]].map(([label, value]) => <div className="finance-row" key={String(label)}><span className="finance-row-main">{label}</span><span className="finance-money">{value == null ? 'À compléter' : formatCHF(Number(value))}</span></div>)}</div><p className="finance-muted mt-3">Le PDF et Excel donnent le détail des comptes, stocks, amortissements, créances, dettes et corrections. Le patrimoine net comptable ne se reporte pas automatiquement en fortune fiscale.</p></details>
        <p className="finance-muted mt-4">La déclaration personnelle reste à compléter : autres revenus, prévoyance, famille et patrimoine privé.</p>
        <a className="finance-link" href={tax.sourceUrl} target="_blank" rel="noreferrer">Instructions officielles Fribourg {tax.sourceYear}</a>
        <button type="button" className="finance-action tax-next" onClick={() => setStep('documents')}>Préparer mon dossier<ChevronRight size={18}/></button>
      </>}
      {step === 'documents' && <>
        <div className="tax-document-intro"><FileText size={28}/><div><h3>Les comptes et leurs justificatifs</h3><p className="finance-muted">PDF à relire et signer, classeur de calculs, originaux et index des pièces. Les anciens achats utiles aux amortissements sont inclus.</p></div></div>
        <button type="button" className="finance-row" onClick={() => setEdit('attachments')}><span className="finance-row-main"><strong>Pièces complémentaires</strong><span className="finance-muted">Relevés bancaires, AVS, inventaires et annexes signés</span></span><span>{tax.attachments.length}</span><ChevronRight size={16}/></button>
        <button type="button" className="finance-action tax-next" disabled={busy} onClick={() => void download('zip')}>{busy ? <Loader2 size={18} className="animate-spin"/> : <FileDown size={18}/>}Télécharger le dossier avec justificatifs</button>
        {archive?.result.nextIndex != null && <button type="button" className="finance-action secondary tax-next" disabled={busy} onClick={() => void download('zip', true)}>Télécharger la suite · volume {archive.volume + 1}</button>}
        {busy && <p className="finance-muted mt-3" role="status">{progress || 'Enregistrement de la version…'}</p>}
        {archive && archive.missingCount > 0 && <div className="finance-notice"><strong>{archive.missingCount} pièce(s) non jointe(s) dans les volumes téléchargés</strong><p>Le détail se trouve dans chaque index. Remplace les fichiers indisponibles ou ajoute les originaux des liens externes, puis télécharge à nouveau.</p>{archive.result.entries.filter(e => e.required && e.status !== 'included').slice(0, 5).map(e => <p className="mt-2" key={e.id}>{e.label} : {e.status === 'external' ? 'lien externe, original à joindre' : e.detail}</p>)}</div>}
        <div className="finance-actions mt-3"><button type="button" className="finance-action secondary" disabled={busy} onClick={() => void download('pdf')}><FileDown size={18}/>PDF seul</button><button type="button" className="finance-action secondary" disabled={busy} onClick={() => void download('xlsx')}><FileDown size={18}/>Excel</button></div>
        <p className="finance-muted mt-3">Extrais le ZIP pour joindre les documents demandés dans FriTax. Les grands dossiers sont répartis en volumes pour rester utilisables sur téléphone. Conserve l’ensemble pendant dix ans.</p>
        <details className="finance-disclosure"><summary>Conserver une version de référence</summary><p className="finance-muted">Une version figée conserve les chiffres, les corrections et les références des originaux. Une correction ultérieure crée une nouvelle version.</p>{closing && !closing.report && <button type="button" disabled={busy} className="finance-action secondary tax-next" onClick={() => void freeze()}>Figer cette version avec ses points à vérifier</button>}<button type="button" className="finance-link" onClick={() => setEdit('checks')}>{closing?.report ? 'Préparer une nouvelle version' : 'Compléter les vérifications avant de figer'}</button></details>
        <a className="finance-link" href={FRIBOURG_TAX_SOURCE.attachments} target="_blank" rel="noreferrer">Pièces demandées par FriTax</a>
      </>}
    </div>
    {edit && <TaxClosingSheet closing={closing} report={report} section={edit} onClose={() => setEdit(null)} onSaved={onVersion}/>}
  </div>;
}
