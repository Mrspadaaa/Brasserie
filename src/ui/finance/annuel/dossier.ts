import { useEffect, useRef, useState } from 'react';
import type { AnnualReport, FinanceTransaction, FinancialClosing, FribourgTaxReport } from '../../../domain/finance/types';
import { taxBasisKey, taxCopyValue } from '../../../domain/finance/fribourgTax';
import { FinanceService } from '../../../services/financeService';
import type { TaxArchiveResult } from '../../../services/taxArchive';

/** Téléchargement du dossier, copie des montants et gel de la version : le comportement de l'ancien `TaxWorkspace`, déplacé tel quel (volumes, reprise, abandon, double clic, Drive). */
export function useDossier({ report, closing, tax, transactions, companyName, onVersion }: {
  report: AnnualReport; closing?: FinancialClosing; tax: FribourgTaxReport; transactions: FinanceTransaction[]; companyName: string; onVersion: (id: string) => void;
}) {
  const [notice, setNotice] = useState(''), [copied, setCopied] = useState('');
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState('');
  const [driveAuthError, setDriveAuthError] = useState(false);
  const [archive, setArchive] = useState<{ result: TaxArchiveResult; missingCount: number; volume: number } | null>(null);
  const work = useRef<AbortController | null>(null), busyRef = useRef(false);
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
        const { createTaxArchive, downloadTaxArchive } = await import('../../../services/taxArchive');
        const volume = resume && archive ? archive.volume + 1 : 1;
        const result = await createTaxArchive({ report, transactions, companyName, frozen: !!closing?.report, startIndex: resume ? archive?.result.nextIndex ?? 0 : 0, volume, signal: controller.signal, onProgress: (done, total) => setProgress(`Justificatifs : ${done} sur ${total}`) });
        if (controller.signal.aborted) return;
        downloadTaxArchive(result);
        const missingCount = (resume ? archive?.missingCount ?? 0 : 0) + result.missingCount;
        setArchive({ result, missingCount, volume });
        setNotice(result.nextIndex != null ? `Volume ${volume} téléchargé. Télécharge la suite pour récupérer les justificatifs restants.` : missingCount ? `Dossier téléchargé avec ${missingCount} justificatif(s) non joint(s). Consulte l’index pour les compléter.` : 'Dossier téléchargé. Les originaux récupérés sont indexés ; vérifie leur lisibilité et les pièces demandées par FriTax.');
      } else {
        const { exportAnnualReport } = await import('../../../services/financeExport');
        if (!controller.signal.aborted) { exportAnnualReport(report, companyName, kind); setNotice(kind === 'pdf' ? 'Comptes PDF téléchargés. Les originaux se trouvent dans le dossier ZIP.' : 'Classeur téléchargé avec les calculs et les reports.'); }
      }
    } catch (e) { if (!controller.signal.aborted) { setNotice((e as Error).message); setDriveAuthError((e as { code?: string })?.code === 'drive/auth-required'); } }
    finally { if (work.current === controller) { busyRef.current = false; setBusy(false); setProgress(''); } }
  };
  const freeze = async () => {
    if (!closing || closing.report || busyRef.current) return;
    busyRef.current = true; setBusy(true); setNotice('');
    try { const saved = await FinanceService.finalizeClosing(closing); onVersion(saved.id); setNotice('Version figée : chiffres, corrections et références des originaux conservés.'); }
    catch (e) { setNotice((e as Error).message); setDriveAuthError((e as { code?: string })?.code === 'drive/auth-required'); }
    finally { busyRef.current = false; setBusy(false); }
  };
  return { notice, setNotice, copied, busy, progress, driveAuthError, setDriveAuthError, archive, copy, download, freeze };
}
