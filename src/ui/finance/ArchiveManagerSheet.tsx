import React, { useMemo, useRef, useState } from 'react';
import { Archive } from 'lucide-react';
import type { Transaction } from '../../types';
import type { FinancialArchive, FinancialClosing, FinancialPayment } from '../../domain/finance/types';
import { archiveIndex, isTransactionArchived, limiteRangee, peutRanger, piecesParMois, planRangement } from '../../domain/finance/archive';
import { isActiveTransaction, isoDate, paymentState, todayISO, transactionDirection } from '../../domain/finance/ledger';
import { FinancialArchiveService } from '../../services/financialArchiveService';
import { Sheet } from '../Sheet';
import { amountOnly } from './financeFormat';
import { FriseArchives, type AnneeFrise } from './operations/FriseArchives';
import './operations/archives.css';

/**
 * Archives = m1ar-c (choix du brasseur, 15.11) : la frise des années avec la poignée. Poser la limite range ou remet d'un seul geste ; le bouton
 * du bas écrit (« Ranger 2025 », « Remettre 2025 »), jamais la poignée seule. Rien n'est supprimé, aucune facture n'est marquée payée : une facture
 * ouverte reste au suivi (la pastille rouge de la frise le dit). Règles d'archive du domaine inchangées (`setYearArchived`, une année à la fois).
 */
export function ArchiveManagerSheet({ transactions, payments, archives, closings, onClose, onBrowse, onSaved }: {
  transactions: Transaction[]; payments: FinancialPayment[]; archives: FinancialArchive[]; closings: FinancialClosing[];
  onClose: () => void; onBrowse: (year: number, archived: boolean) => void; onSaved: (message: string) => void;
}) {
  const [choix, setChoix] = useState<number | null | undefined>(undefined); // undefined : la limite enregistrée
  const [occupe, setOccupe] = useState(false), [erreur, setErreur] = useState('');
  const verrou = useRef(false);
  const aujourdhui = todayISO();
  const anneeCourante = Number(aujourdhui.slice(0, 4)), moisCourant = Number(aujourdhui.slice(5, 7));
  const index = useMemo(() => archiveIndex(archives), [archives]);
  const archivees = useMemo(() => new Set([...index.values()].filter(a => a.status === 'archived').map(a => a.year)), [index]);
  const stockee = limiteRangee(archivees);
  const limite = choix === undefined ? stockee : choix;

  const lignes = useMemo(() => transactions.map(transaction => {
    const date = isoDate(transaction.date);
    const etat = paymentState(transaction, payments, transactions, aujourdhui);
    const ouverte = isActiveTransaction(transaction) && (['unpaid', 'partial'].includes(etat.state) || etat.overpaidCents > 0);
    return { transaction, annee: date ? Number(date.slice(0, 4)) : null, mois: date ? Number(date.slice(5, 7)) - 1 : null, rangee: isTransactionArchived(transaction, index),
      ouverte, reste: ouverte ? etat.remainingCents : 0, sens: transactionDirection(transaction, transactions), inconnu: isActiveTransaction(transaction) && etat.state === 'unknown' };
  }), [transactions, payments, index, aujourdhui]);

  const parMois = useMemo(() => piecesParMois(transactions), [transactions]);
  const anneesConnues = useMemo(() => [...new Set([...parMois.keys(), ...archives.map(a => a.year), anneeCourante])].sort((a, b) => a - b), [parMois, archives, anneeCourante]);
  const annees = useMemo(() => anneesConnues.length ? Array.from({ length: anneesConnues[anneesConnues.length - 1] - anneesConnues[0] + 1 }, (_, i) => anneesConnues[0] + i) : [], [anneesConnues]);
  const plan = planRangement(annees, archivees, limite, anneeCourante);
  const rangeApres = (y: number): boolean => plan.aRanger.includes(y) || archivees.has(y) && !plan.aRemettre.includes(y);

  const premier = useMemo(() => { let m = Infinity; for (const [a, mois] of parMois) mois.forEach((n, i) => { if (n) m = Math.min(m, a * 12 + i); }); return m; }, [parMois]);
  const frise = useMemo<AnneeFrise[]>(() => annees.map(annee => {
    const mois = parMois.get(annee) ?? Array<number>(12).fill(0);
    const ouverts = Array<boolean>(12).fill(false);
    for (const l of lignes) if (l.annee === annee && l.mois != null && l.ouverte && rangeApres(annee)) ouverts[l.mois] = true;
    return { annee, mois, affiches: annee === anneeCourante ? moisCourant : 12, total: mois.reduce((a, b) => a + b, 0), ouverts,
      avantDebut: mois.map((_, i) => annee * 12 + i < premier), rangeable: peutRanger(annee, anneeCourante, archivees) };
  }), [annees, parMois, lignes, anneeCourante, moisCourant, archivees, plan.aRanger.join(','), plan.aRemettre.join(','), premier]);
  const maxMois = Math.max(1, ...[...parMois.values()].flat());

  // Ce qui resterait au suivi : factures ouvertes des années rangées ; une somme seulement si toutes vont dans le même sens.
  const suiviLignes = lignes.filter(l => l.ouverte && l.annee != null && rangeApres(l.annee));
  const sens = new Set(suiviLignes.map(l => l.sens));
  const suivi = !suiviLignes.length ? '' : sens.size === 1 ? `${amountOnly(suiviLignes.reduce((n, l) => n + l.reste, 0))} reste au suivi` : `${suiviLignes.length} factures restent au suivi`;

  const gardeAvant = lignes.filter(l => !l.rangee || l.ouverte).length;
  const rangeeApres = (l: typeof lignes[number]) => l.annee != null && (plan.aRanger.includes(l.annee) || l.rangee && !plan.aRemettre.includes(l.annee));
  const gardeApres = lignes.filter(l => !rangeeApres(l) || l.ouverte).length;
  const sansDate = lignes.filter(l => l.annee == null).length;
  const nonConfirmes = lignes.filter(l => l.inconnu && l.annee != null && plan.aRanger.includes(l.annee)).length;
  const peutBouger = annees.some(y => peutRanger(y, anneeCourante, archivees));
  const suivante = annees.find(y => y < anneeCourante && !archivees.has(y) && (limite == null || y > limite));
  const precedente = [...annees].reverse().find(y => archivees.has(y) && (limite == null || y <= limite));

  const nomAnnees = (liste: number[]) => liste.length < 2 ? String(liste[0]) : `${liste[0]} à ${liste[liste.length - 1]}`;
  const ecrire = async (liste: number[], ranger: boolean) => {
    if (verrou.current || !liste.length) return;
    verrou.current = true; setOccupe(true); setErreur('');
    try {
      for (const y of ranger ? liste : [...liste].reverse()) await FinancialArchiveService.setYearArchived(y, ranger);
      onSaved(ranger ? (liste.length > 1 ? `Années ${liste.join(', ')} archivées. Les factures ouvertes restent dans le suivi.` : `Année ${liste[0]} archivée. Les factures ouvertes restent dans le suivi.`)
        : (liste.length > 1 ? `Années ${liste.join(', ')} réintégrées dans le journal courant.` : `Année ${liste[0]} réintégrée dans le journal courant.`));
      setChoix(undefined);
    } catch (e) { setErreur((e as Error).message); }
    finally { verrou.current = false; setOccupe(false); }
  };
  const droite = plan.aRanger.length ? { texte: `Ranger ${nomAnnees(plan.aRanger)}`, action: () => void ecrire(plan.aRanger, true), ecrit: true }
    : { texte: suivante ? `Ranger ${suivante}` : 'Ranger', action: () => suivante && setChoix(suivante), ecrit: false };
  const gauche = plan.aRemettre.length ? { texte: `Remettre ${nomAnnees(plan.aRemettre)}`, action: () => void ecrire(plan.aRemettre, false), ecrit: true }
    : { texte: 'Remettre', action: () => precedente != null && setChoix(annees.filter(y => y < precedente && archivees.has(y)).pop() ?? null), ecrit: false };

  const resume = (annee: number) => {
    const total = parMois.get(annee)?.reduce((a, b) => a + b, 0) ?? 0;
    const enRetard = lignes.filter(l => l.annee === annee && l.ouverte).length;
    const record = index.get(annee), rangee = record?.status === 'archived';
    const nouvelles = rangee ? lignes.filter(l => l.annee === annee && !l.rangee).length : 0;
    return { total, enRetard, record, rangee, nouvelles, fige: closings.some(c => c.year === annee && c.report) };
  };
  const passees = annees.filter(y => resume(y).total > 0 || archivees.has(y));

  return <Sheet open title="Les archives" onClose={onClose} className="finance-sheet"
    footer={<div className="arc-pied">
      <button type="button" className="arc-b" disabled={occupe || (!gauche.ecrit && !archivees.size)} onClick={gauche.action}>{gauche.texte}</button>
      <button type="button" className="arc-b" data-fort="" disabled={occupe || (!droite.ecrit && !suivante)} onClick={droite.action}>{occupe ? 'Écriture en cours…' : droite.texte}</button>
    </div>}>
    <div className="arc">
      <FriseArchives annees={frise} limite={limite} stockee={stockee} maxMois={maxMois} suivi={suivi} onLimite={y => { setChoix(y); setErreur(''); }}/>
      <p className="arc-rd"><span>{limite == null ? 'rien n’est rangé' : <>rangé jusqu’à <b>fin {limite}</b></>}</span><span>rien n’est supprimé</span></p>
      <div className="arc-jr"><p>Le journal de tous les jours garde</p>
        {gardeApres !== gardeAvant ? <><span className="arc-m">{gardeAvant}</span><span aria-hidden="true">→</span><b className="arc-m">{gardeApres}</b></> : <b className="arc-m">{gardeAvant}</b>}
        <span style={{ fontSize: 13 }}>pièces</span></div>
      {nonConfirmes > 0 && <p className="arc-note">{nonConfirmes} règlement(s) historique(s) restent à confirmer ; ils restent dans « À compléter » et dans les contrôles annuels.</p>}
      {sansDate > 0 && <p className="arc-note">{sansDate} pièce(s) sans date valide restent dans le journal courant ; corrige leur date pour les ranger dans la bonne année.</p>}
      {!peutBouger && <p className="arc-note">L’archivage sera disponible dès qu’une année de ton journal sera terminée.</p>}
      {erreur && <p className="arc-erreur" role="alert">{erreur}</p>}
      <div className="arc-ans">{passees.map(annee => {
        const r = resume(annee), courante = annee >= anneeCourante && !r.rangee;
        return <div className="arc-yi" key={annee}>
          <b className="arc-m">{annee}</b>
          <span>{r.rangee && <><Archive size={13} aria-hidden="true"/> {r.record?.archivedAt ? `rangée le ${new Date(r.record.archivedAt).toLocaleDateString('fr-CH')} · ` : 'rangée · '}</>}
            {courante && 'en cours · '}<span className="arc-m">{r.total}</span>
            {r.enRetard > 0 && ` · ${r.enRetard} à suivre`}{r.fige && ' · rapport figé'}
            {r.nouvelles > 0 && <> · {r.nouvelles} nouvelle(s) · <button type="button" className="arc-lien" disabled={occupe} onClick={() => void ecrire([annee], true)}>Classer</button></>}</span>
          {courante ? <span/> : <button type="button" className="arc-lien" aria-label={`Consulter ${annee}`} onClick={() => onBrowse(annee, r.rangee)}>Consulter ›</button>}
        </div>;
      })}</div>
    </div>
  </Sheet>;
}
