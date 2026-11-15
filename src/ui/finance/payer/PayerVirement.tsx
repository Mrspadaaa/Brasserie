import React, { useMemo, useRef, useState } from 'react';
import { Sheet } from '../../Sheet';
import { ChampVirement } from './ChampVirement';
import { couleursPieces, etiquettesPieces } from './etiquettes';
import type { Transaction } from '../../../types';
import type { FinancialPayment } from '../../../domain/finance/types';
import { formatCHF, isoDate, paymentState, todayISO, transactionVendor } from '../../../domain/finance/ledger';
import { piecesOuvertesDuTiers, refusDuVirement, repartirVirement, totalDu, type PieceOuverte } from '../../../domain/finance/repartition';
import { FinanceService } from '../../../services/financeService';
import { prepareFinanceDocument, saveFinanceDocumentConfirmed } from '../../../services/financeDocuments';
import { driveProofFileName } from '../../../services/purchaseEntry';
import { GeminiScannerService } from '../../../services/geminiScanner';
import { amountOnly, shortDate } from '../financeFormat';
import { contrePaiement, echeance } from '../operations/calculs';
import { GROUPES, type GroupeId } from '../operations/groupes';
import './payer.css';

/**
 * Payer = m5pa-d : un seul montant de virement pour toutes les pièces encore à payer du même tiers ; il solde d'abord la plus ancienne
 * (le retard), puis la suivante ; la dernière peut rester en partie à payer. Une pièce seule : la même feuille, une seule rangée.
 * Écriture : un paiement par pièce touchée (même date, même moyen) par `FinanceService.recordPayment`, l'un après l'autre.
 * Justificatif : un seul original (photo ou fichier), rangé une fois par le mécanisme des pièces jointes (`saveFinanceDocumentConfirmed`),
 * lié à chaque paiement du virement (`proofDocumentId`). Sans justificatif, le paiement s'enregistre quand même.
 */
const MOYENS: Array<{ id: FinancialPayment['method']; texte: string }> = [{ id: 'bank', texte: 'banque' }, { id: 'cash', texte: 'espèces' }, { id: 'twint', texte: 'TWINT' }, { id: 'other', texte: 'autre moyen' }];
const FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const GROUPE_DE: Partial<Record<string, GroupeId>> = { materiel: 'part', renovation: 'part' };
const uuid = () => globalThis.crypto.randomUUID();

const couleurDe = (p: PieceOuverte, aujourdhui: string): string => {
  if (p.echeance && p.echeance < aujourdhui) return 'rgb(var(--alert-strong-texte))';
  const groupe = GROUPES[(GROUPE_DE[p.transaction.category] ?? p.transaction.category) as GroupeId] ?? GROUPES.divers;
  return groupe.liseré;
};

interface Joint { nom: string; dataUrl: string; mime: string }
const IcoDoc = ({ plein }: { plein?: boolean }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray={plein ? undefined : '3 2.4'} aria-hidden="true"><path d="M7 3h7l4 4v14H7z" />{plein && <path d="M9.5 14l2 2 3.5-4" />}</svg>;

export function PayerVirement({ transaction, payments: paiementsBruts, transactions, onClose, remplace }: { transaction: Transaction; payments: FinancialPayment[]; transactions: Transaction[]; onClose: () => void; remplace?: FinancialPayment }) {
  const aujourdhui = todayISO();
  /** « Autre montant » : le paiement rapide à remplacer ne compte pas (ni son inversion, une fois écrite) : la pièce se lit comme avant ce paiement, avec son montant comme reste. */
  const payments = useMemo(() => remplace ? paiementsBruts.filter(p => p.id !== remplace.id && p.reversalOfId !== remplace.id) : paiementsBruts, [paiementsBruts, remplace]);
  const pieces = useMemo(() => piecesOuvertesDuTiers(transaction, transactions, payments), [transaction, transactions, payments]);
  const entrant = pieces[0]?.entrant ?? false;
  const inconnu = paymentState(transaction, payments, transactions).state === 'unknown';
  const tiers = transactionVendor(transaction);
  // Avec un paiement à remplacer, la feuille s'ouvre sur cette seule pièce : les autres du tiers restent à cocher.
  const [exclues, setExclues] = useState<Set<string>>(() => new Set(remplace ? pieces.filter(p => p.id !== transaction.id).map(p => p.id) : []));
  /** `null` : le montant par défaut (tout ce qui reste sur les pièces cochées) ; sinon la saisie du brasseur (`undefined` : champ vidé). */
  const [saisi, setSaisi] = useState<number | undefined | null>(null);
  const [modeDate, setModeDate] = useState<'auj' | 'autre'>(inconnu ? 'autre' : 'auj');
  const [autreDate, setAutreDate] = useState('');
  const [moyen, setMoyen] = useState<FinancialPayment['method']>('bank');
  const [moyensOuverts, setMoyensOuverts] = useState(false);
  const [joint, setJoint] = useState<Joint | null>(null);
  const [erreurJoint, setErreurJoint] = useState('');
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);
  const fichier = useRef<HTMLInputElement>(null), photo = useRef<HTMLInputElement>(null);
  // Un virement = une écriture reprise à l'identique si on réessaie : mêmes identifiants, même horodatage (un paiement est immuable).
  const virement = useRef({ id: `VIR-${uuid()}`, recordedAt: new Date().toISOString(), paiements: new Map<string, string>(), inverse: false, preuve: undefined as { id: string; nom: string } | undefined });

  const choisies = pieces.filter(p => !exclues.has(p.id));
  const total = totalDu(choisies);
  // Une seule valeur (q6, points 2, 3, 9) : jamais au-delà du total dû des pièces cochées ; décocher une pièce recale un montant qui le dépassait.
  const valeur = saisi === null ? (choisies.length ? total : undefined) : saisi === undefined ? undefined : Math.min(saisi, total);
  const refus = choisies.length === 0 ? 'Coche au moins une pièce.' : refusDuVirement(choisies, valeur);
  const rep = refus ? null : repartirVirement(choisies, valeur!);
  const dateRef = useRef<HTMLInputElement>(null);
  const parts = new Map((rep?.parts ?? []).map(p => [p.id, p]));
  const touchees = (rep?.parts ?? []).filter(p => p.partCents > 0);
  const date = modeDate === 'auj' ? aujourdhui : autreDate;
  const dateOk = !!isoDate(date) && date <= aujourdhui;
  const nbJointes = touchees.length || choisies.length;
  const verbe = entrant ? 'Encaisser' : 'Payer';

  const choisirFichier = async (liste: FileList | null) => {
    const f = liste?.[0];
    if (!f) return;
    const mime = GeminiScannerService.normalizeMimeType(f);
    setErreurJoint('');
    if (!FORMATS.includes(mime)) { setErreurJoint('Format non pris en charge : photo JPEG, PNG, WebP ou PDF.'); return; }
    if (f.size > 4_000_000) { setErreurJoint('Fichier trop lourd (4 Mo au plus).'); return; }
    try { setJoint({ nom: f.name, dataUrl: await GeminiScannerService.fileToDataUrl(f), mime }); }
    catch (e) { setErreurJoint(e instanceof Error ? e.message : 'Le justificatif ne peut pas être lu.'); }
  };

  const enregistrer = async () => {
    if (occupe || !rep || !dateOk) return;
    setOccupe(true); setErreur('');
    let ecrites = 0;
    try {
      const v = virement.current;
      if (joint && !v.preuve) {
        const nom = driveProofFileName({ date, vendor: tiers, invoiceNumber: 'virement', mimeType: joint.mime, originalName: joint.nom });
        const prepare = prepareFinanceDocument(`proof-${v.id}`, joint.dataUrl, nom, joint.mime);
        const recu = await saveFinanceDocumentConfirmed(prepare, +date.slice(0, 4));
        v.preuve = { id: prepare.id, nom: recu?.fileName ?? nom };
      }
      const preuve = joint ? v.preuve : undefined;
      // Un lot par étape : d'abord l'inversion du paiement rapide ; si elle échoue, rien d'autre n'est écrit. Une reprise ne la rejoue pas.
      if (remplace && !v.inverse) { FinanceService.recordPayment(contrePaiement(remplace, v.recordedAt)); v.inverse = true; await Promise.resolve(); }
      for (const part of touchees) {
        const piece = pieces.find(p => p.id === part.id)!;
        if (!v.paiements.has(part.id)) v.paiements.set(part.id, `PAI-${uuid()}`);
        FinanceService.recordPayment({
          id: v.paiements.get(part.id)!, transactionId: part.id, date, amountCents: part.partCents, direction: piece.entrant ? 'in' : 'out', method: moyen, recordedAt: v.recordedAt,
          ...(touchees.length > 1 ? { note: `Virement de ${formatCHF(rep.imputeCents)} réparti sur ${touchees.length} pièces` } : {}),
          ...(preuve ? { proofDocumentId: preuve.id, proofFileName: preuve.nom } : {})
        });
        ecrites += part.partCents;
      }
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Enregistrement impossible.';
      if (ecrites === 0 && virement.current.inverse) {
        setErreur(`${message} Déjà enregistré : le paiement rapide est inversé. Le nouveau paiement n’est pas écrit.`);
      } else if (ecrites > 0) {
        // Les pièces déjà payées quittent la liste ; le montant restant à virer est ce qui n'a pas pu être écrit.
        setSaisi(Math.max(0, valeur! - ecrites));
        setErreur(`${message} Déjà enregistré : ${formatCHF(ecrites)}. Le reste du virement n’est pas écrit.`);
      } else if (joint && !virement.current.preuve && ((e as { code?: string })?.code === 'unavailable' || /^hors connexion/i.test(message))) {
        // Hors ligne, l'original ne part pas sur Drive : rien n'est écrit. Le geste qui débloque (M5) : sans justificatif, le paiement s'enregistre et se synchronise plus tard.
        setErreur(`${message} Retirer le justificatif pour payer maintenant.`);
      } else setErreur(message);
    } finally { setOccupe(false); }
  };

  // « Payer l’Atelier » (m5pa-d) : l'article s'élide devant une voyelle ; sinon « Payer » et le nom tel quel (q6, point 8).
  const voyelle = /^[aeiou]/i.test((tiers ?? '').normalize('NFD').replace(/\p{M}/gu, '').trim());
  const titre = tiers ? `${verbe} ${voyelle ? 'l’' : ''}${tiers}` : `${verbe} ${transaction.description}`;
  const n = pieces.length;
  const sousTitre = n > 1 ? `${n} pièces à ${entrant ? 'encaisser du même client' : 'payer au même fournisseur'}` : `Une pièce à ${entrant ? 'encaisser' : 'payer'}`;

  // Tronçons et légende : un par pièce touchée (la plus ancienne d'abord), puis le reste hachuré ; au-delà de trois pièces, la fin se regroupe.
  const reste = rep ? total - rep.imputeCents : 0;
  const troncons = touchees.map(t => ({ ...t, piece: pieces.find(p => p.id === t.id)! }));
  const legende: string[] = [];
  // FN-3, FN-4 : une couleur par pièce (celles de m5pa-d, variées si deux pièces ont la même) et un nom court qui les distingue.
  const teintes = couleursPieces(troncons.map(t => couleurDe(t.piece, aujourdhui)));
  const noms = etiquettesPieces(troncons.map(t => t.piece.transaction.description));
  const enRetard = troncons.filter(t => t.piece.echeance && t.piece.echeance < aujourdhui).length;
  troncons.slice(0, troncons.length > 3 ? 2 : 3).forEach((t, i) => legende.push(`${t.piece.echeance && t.piece.echeance < aujourdhui ? (enRetard > 1 ? `retard · ${noms[i]}` : 'retard') : noms[i]} ${amountOnly(t.partCents)}`));
  if (troncons.length > 3) legende.push(`${troncons.length - 2} autres ${amountOnly(troncons.slice(2).reduce((s, t) => s + t.partCents, 0))}`);
  if (reste > 0) legende.push(`reste ${amountOnly(reste)}`);

  return <Sheet open title={titre} subtitle={sousTitre} onClose={onClose} dismissible={!occupe} className="finance-sheet pay" footer={
    <div className="pay-ft">
      <button type="button" className="pay-b2" onClick={onClose} disabled={occupe}>Annuler</button>
      <button type="button" className="pay-b1" data-attend={!dateOk && !!rep && !occupe ? '' : undefined} aria-disabled={!dateOk && !!rep && !occupe ? true : undefined}
        onClick={() => { if (rep && !dateOk && !occupe) { dateRef.current?.focus(); return; } void enregistrer(); }} disabled={occupe || !rep}>{occupe ? 'Enregistrement…' : rep && !dateOk ? 'Choisis la date' : <>✓ {verbe} <span className="pay-m">{valeur != null && rep ? amountOnly(valeur) : '—'}</span></>}</button>
    </div>}>
    <div className="pay-corps">
      {inconnu && <p className="pay-note" role="note">Le paiement historique est inconnu. Indique la date et le montant réellement réglés.</p>}
      <ChampVirement libelle={entrant ? 'Ton encaissement' : 'Ton virement'} aria={entrant ? 'Montant de l’encaissement (CHF)' : 'Montant du virement (CHF)'} valeurCents={valeur} maxCents={Math.max(total, 1)}
        onValeur={v => setSaisi(v)} />
      {refus && saisi !== null && !(saisi !== undefined && saisi > total) && <p className="pay-err" role="alert">{refus}</p>}
      <div className="pay-flow" data-booster="repartition" aria-hidden="true">
        {troncons.map((t, i) => <i key={t.id} style={{ flex: t.partCents, background: teintes[i] }} />)}
        {reste > 0 && <i className="pay-hach" style={{ flex: reste }} />}
      </div>
      <div className="pay-fk">{legende.map((l, i) => <span key={i}>{l}</span>)}</div>
      {n > 1 && <p className="pay-cap">Le plus ancien d’abord</p>}
      {pieces.map(p => {
        const choisie = !exclues.has(p.id), part = parts.get(p.id), retard = !!p.echeance && p.echeance < aujourdhui;
        return <div className="pay-it" key={p.id} data-exclue={choisie ? undefined : ''} style={retard ? { ['--pay-couleur' as string]: couleurDe(p, aujourdhui) } : undefined}>
          <button type="button" role="checkbox" aria-checked={choisie} aria-label={`Inclure ${p.transaction.description} dans le virement`} className="pay-ck" disabled={n === 1}
            onClick={() => { const s = new Set(exclues); if (choisie) s.add(p.id); else s.delete(p.id); setExclues(s); }}><i aria-hidden="true">✓</i></button>
          <span className={`pay-br${retard ? '' : ' pay-hach'}`} aria-hidden="true" />
          <span className="pay-qui"><b>{p.transaction.description}</b>
            <span className={`pay-tg ${retard ? 'pay-tg-late' : 'pay-tg-pay'}`}>{retard ? echeance(p.echeance, aujourdhui).texte : `${entrant ? 'à encaisser' : 'à payer'}${p.echeance ? ` · ${shortDate(p.echeance)}` : ''}`}</span></span>
          <span className="pay-fill">
            {choisie && part && part.partCents > 0
              ? <><span className="pay-m">{amountOnly(part.partCents)}</span>{part.soldee ? <small data-ok="">✓ soldé</small> : <small>sur {amountOnly(p.resteCents)} · reste {amountOnly(part.resteApresCents)}</small>}</>
              : <><span className="pay-m">{choisie && rep ? '—' : amountOnly(p.resteCents)}</span><small>{choisie && rep ? `pas touchée · reste ${amountOnly(p.resteCents)}` : choisie ? `reste ${amountOnly(p.resteCents)}` : 'pas dans ce virement'}</small></>}
          </span>
        </div>;
      })}
      <div className="pay-jv" data-booster="justificatif" data-joint={joint ? '' : undefined}>
        <IcoDoc plein={!!joint} />
        <span className="pay-jx"><b>{joint ? joint.nom : entrant ? 'Justificatif de l’encaissement' : 'Justificatif du virement'}</b>
          <small>{joint ? `joint ${nbJointes > 1 ? `aux ${nbJointes} pièces` : 'à la pièce'}` : `sera joint ${nbJointes > 1 ? `aux ${nbJointes} pièces` : 'à la pièce'}`}</small></span>
        {joint
          ? <><button type="button" onClick={() => fichier.current?.click()}>Changer</button><button type="button" onClick={() => { setJoint(null); virement.current.preuve = undefined; }}>Retirer</button></>
          : <><button type="button" onClick={() => photo.current?.click()}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.6" /></svg>Photo</button>
            <button type="button" onClick={() => fichier.current?.click()}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /><path d="M12 11v6M9.5 14.5L12 17l2.5-2.5" /></svg>Fichier</button></>}
        <input hidden ref={photo} aria-label="Photographier le justificatif du virement" type="file" accept="image/*" capture="environment" onChange={e => { void choisirFichier(e.target.files); e.target.value = ''; }} />
        <input hidden ref={fichier} aria-label="Choisir le fichier du justificatif du virement" type="file" accept="image/*,application/pdf" onChange={e => { void choisirFichier(e.target.files); e.target.value = ''; }} />
      </div>
      {erreurJoint && <p className="pay-jerr" role="alert">{erreurJoint}</p>}
      <div className="pay-row2">
        <span>Le</span>
        <button type="button" aria-pressed={modeDate === 'auj'} onClick={() => setModeDate('auj')}>aujourd’hui</button>
        <button type="button" aria-pressed={modeDate === 'autre'} onClick={() => setModeDate('autre')}>autre</button>
        <span>avec</span>
        <button type="button" aria-pressed={moyen === 'bank'} onClick={() => setMoyen('bank')}>banque</button>
        <button type="button" aria-label="Autres moyens de paiement" aria-expanded={moyensOuverts || moyen !== 'bank'} onClick={() => setMoyensOuverts(!moyensOuverts)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 9l7 7 7-7" /></svg></button>
      </div>
      {(moyensOuverts || moyen !== 'bank') && <div className="pay-moyens" role="group" aria-label="Moyen de paiement">{MOYENS.filter(m => m.id !== 'bank').map(m => <button type="button" key={m.id} aria-pressed={moyen === m.id} onClick={() => setMoyen(m.id)}>{m.texte}</button>)}</div>}
      {modeDate === 'autre' && <label className="pay-date">Date réelle du paiement<input ref={dateRef} type="date" value={autreDate} max={aujourdhui} onChange={e => setAutreDate(e.target.value)} required /></label>}
      {erreur && <p className="pay-err" role="alert" style={{ marginTop: 8 }}>{erreur}</p>}
    </div>
  </Sheet>;
}
