import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { AppConfig, Batch, Client } from '../../types';
import { StorageService } from '../../services/storage';
import { useStorageValue } from '../../hooks/useLiveData';
import { saveIncomeEntry } from '../../services/incomeEntry';
import { ModalShell } from '../ModalShell';
import { EditClientModal } from '../../components/EditClientModal';
import { ChampNombre } from '../depense/ChampNombre';
import { Input } from '../Input';
import { adresseBrasserie, uidValide, COMPANY_FALLBACK } from '../../domain/companyDefaults';
import { doublonsNumeroFacture, echeanceFacture, prochainNumeroFacture } from '../../domain/finance/numeroFacture';
import { messageDateHorsBornes } from '../../domain/finance/bornesFinance';
import { isoDate, montantChf, todayISO } from '../../domain/finance/ledger';
import { ibanCompact, ibanValide } from '../../domain/finance/iban';
import { nextClientId } from '../../services/refs';
import { preparerQrFacture, problemesAdresse, QrFactureInvalide } from '../../services/swissQrBill';
import { brassinsVendables, jaugeBrassin, litresVendus } from './brassinsVendables';
import { formatsDuBrassin, tarifDuFormat } from './formatsVente';
import { messageBornes, PRIX_UNITAIRE_MAX, problemePanier, QUANTITE_MAX, totauxPanier, versArticles, type LignePanier } from './panier';
import { debiteurDe, preparerVente, type Echeance, type ModeVente, type VentePreparee } from './enregistrerVente';
import { effacerBrouillon, garderBrouillon, lireBrouillon } from './brouillon';
import { IdentiteBrasserieFeuille } from './IdentiteBrasserie';
import { QrExemple } from './QrExemple';
import './caisse.css';

/** Lecteurs stables (une identité par module : `useStorageValue` s'abonne dessus). */
const lireClients = () => StorageService.getClients();
const lireBatches = () => StorageService.getBatches();
const lireTarifs = () => StorageService.getTarifs();
const lireTransactions = () => StorageService.getTransactions();
const lireConfig = () => StorageService.getConfig();
const lireFuts = () => StorageService.getStocks()?.kegs ?? [];

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const moisCourt = (b: Batch): string => {
  const brut = b.brewDate || b.plannedBrewDate || '';
  const iso = /^\d{4}-(\d{2})/.exec(brut), suisse = /^\d{2}\.(\d{2})\.\d{4}$/.exec(brut);
  const mois = Number((iso ?? suisse)?.[1]);
  return mois >= 1 && mois <= 12 ? MOIS[mois - 1] : '';
};
const initiales = (nom: string) => nom.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
const fr = (cents: number) => (cents / 100).toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nombre1 = (n: number) => n.toLocaleString('fr-CH', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dateCourte = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' });
const dateLongue = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' });

const Bouteille = ({ grande }: { grande?: boolean }) => <svg viewBox="0 0 16 34" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d={grande ? 'M6 1h4v8l4 5v19H2V14l4-5z' : 'M5 1h4v7l3 5v19H2V13l3-5z'} fill="#F2C14E" /></svg>;
const Fut = () => <svg viewBox="0 0 30 34" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 3h22v28H4z" fill="rgba(128,128,128,.2)" /><path d="M4 10h22M4 24h22" /></svg>;
const Feuille = () => <svg viewBox="0 0 30 34" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 6h18v22H6z" /><path d="M11 13h8M11 18h8M11 23h5" /></svg>;
const Echoppe = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 9l2-5h14l2 5M4 9h16v11H4zM9 20v-6h6v6" /></svg>;
const PictoQr = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="1" y="1" width="5" height="5" /><rect x="10" y="1" width="5" height="5" /><rect x="1" y="10" width="5" height="5" /><rect x="10" y="10" width="2" height="2" /><rect x="13" y="13" width="2" height="2" /></svg>;

interface ContenuProps {
  clientIdInitial?: string;
  onClose: () => void;
  onSaved?: (message: string) => void;
  /** Dit à l'hôte qu'un enregistrement est en cours : il bloque × et Échap. */
  onBusy?: (occupe: boolean) => void;
  /** L'hôte demande s'il peut fermer (faux pendant l'enregistrement ; avec un brouillon, un premier appui avertit). */
  fermetureRef?: React.MutableRefObject<(() => boolean) | null>;
}

type Libre = { designation: string; quantite: number | undefined; prix: number | undefined; formatId: string; batchId?: string; litres: number };
interface Resultat { numero: string; totalCents: number; mode: ModeVente; pdf: VentePreparee['pdf'] }

/** Le contenu de la caisse (v3a) : à qui, quoi, comment. L'hôte (`Caisse` ou `QuickActionModal`) fournit le dialogue. */
export function CaisseContenu({ clientIdInitial, onClose, onSaved, onBusy, fermetureRef }: ContenuProps) {
  const clients = useStorageValue(lireClients);
  const batches = useStorageValue(lireBatches);
  const tarifs = useStorageValue(lireTarifs);
  const transactions = useStorageValue(lireTransactions);
  const config: AppConfig = useStorageValue(lireConfig);
  const futs = useStorageValue(lireFuts);
  const company = config.company ?? ({ name: '', owner: '', uid: '' } as AppConfig['company']);
  const assujetti = config.fiscal?.isTvaRegistered === true, taux = config.fiscal?.tvaNormalRate ?? 0;
  const demo = /Démonstration/i.test(company.name ?? '');

  const reprise = useRef(lireBrouillon()).current;
  const [clientId, setClientId] = useState<string | null>(reprise ? reprise.clientId : clientIdInitial ?? null);
  const [mode, setMode] = useState<ModeVente>(reprise ? reprise.mode : clientIdInitial ? 'qr' : 'paye');
  const [moyen, setMoyen] = useState<'twint' | 'cash' | undefined>(reprise?.moyen);
  const [echeance, setEcheance] = useState<Echeance>(reprise?.echeance ?? 30);
  const [dateIso, setDateIso] = useState(reprise?.dateIso ?? todayISO());
  const [dateOuverte, setDateOuverte] = useState(false);
  const [lignes, setLignes] = useState<LignePanier[]>(reprise?.lignes ?? []);
  const [selection, setSelection] = useState<string[]>([]);
  const [choixBiere, setChoixBiere] = useState(false);
  const [libre, setLibre] = useState<Libre | null>(null);
  const [erreur, setErreur] = useState('');
  const [avertissement, setAvertissement] = useState('');
  const [veutFacture, setVeutFacture] = useState(false);
  const [enAttente, setEnAttente] = useState(Boolean(reprise));
  const [occupe, setOccupe] = useState(false);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [clientEdite, setClientEdite] = useState<Client | null>(null);
  const [identiteOuverte, setIdentiteOuverte] = useState(false);
  const [apercu, setApercu] = useState<{ svg: string; erreur: string } | null>(null);
  const [essai, setEssai] = useState(0);
  const busy = useRef(false), avert = useRef(false);
  const premiereTuile = useRef<HTMLButtonElement>(null);

  const vendables = useMemo(() => brassinsVendables(batches), [batches]);
  useEffect(() => { if (!selection.length && vendables.length) setSelection([vendables[0].id]); }, [vendables, selection.length]);
  const actifId = selection[0];
  const actif = vendables.find(b => b.id === actifId);
  const clientsTries = useMemo(() => [...clients].sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || a.name.localeCompare(b.name, 'fr')), [clients]);
  const client = clients.find(c => c.id === clientId) ?? null;

  /* Le numéro est figé à l'ouverture (et suit l'année choisie) : celui de l'annexe est celui du PDF (REVUE-B 12). */
  const annee = Number(dateIso.slice(0, 4));
  const numeroRef = useRef<{ annee: number; numero: string } | null>(reprise ? { annee: Number(reprise.dateIso.slice(0, 4)), numero: reprise.vente.numero } : null);
  if (!numeroRef.current || numeroRef.current.annee !== annee) numeroRef.current = { annee, numero: prochainNumeroFacture(transactions, annee) };
  const numero = reprise && enAttente ? reprise.vente.numero : numeroRef.current.numero;

  const totaux = totauxPanier(lignes, assujetti, taux);
  const bornes = messageBornes(totaux?.totalCents ?? null);
  const probleme = lignes.length ? problemePanier(lignes) : null;
  const dateErreur = messageDateHorsBornes(dateIso, todayISO());
  const dueDate = (() => { try { return echeanceFacture(dateIso, echeance); } catch { return ''; } })();

  /* Ce qui manque (la bande hachurée de v3a). Chaque manque a son bouton. */
  const creancier = adresseBrasserie(company);
  const manqueBrasserie = problemesAdresse(creancier ?? { nom: company.name ?? '', rue: '', numero: '', npa: '', localite: '', pays: 'CH' }, 'brasserie').length > 0;
  const iban = company.iban || COMPANY_FALLBACK.iban;
  const manqueIban = !ibanCompact(iban) || !ibanValide(iban);
  const manqueUid = assujetti && !uidValide(company.uid);
  const adresseClientManque = Boolean(client) && !debiteurDe(client);
  const doublons = doublonsNumeroFacture(transactions);
  const bloqueQr = mode === 'qr' && (manqueBrasserie || manqueIban);
  const manques: { cle: string; texte: string; bouton?: string; action?: () => void }[] = [];
  if (mode === 'qr' && adresseClientManque) manques.push({ cle: 'client', texte: 'adresse ?', bouton: '+ adresse', action: () => setClientEdite(client) });
  if (mode === 'qr' && manqueBrasserie) manques.push({ cle: 'brasserie', texte: 'adresse de la brasserie ?', bouton: '+ adresse', action: () => setIdentiteOuverte(true) });
  if (mode === 'qr' && !manqueBrasserie && manqueIban) manques.push({ cle: 'iban', texte: 'IBAN ?', bouton: '+ IBAN', action: () => setIdentiteOuverte(true) });
  if (manqueUid) manques.push({ cle: 'uid', texte: 'n° UID ?', bouton: '+ UID', action: () => setIdentiteOuverte(true) });
  if (veutFacture && !client) manques.push({ cle: 'veut', texte: 'une facture a besoin d’un client' });
  if (adresseClientManque && manques.length > 1) manques[0].texte = 'adresse du client ?';
  if (doublons.length) manques.push({ cle: 'doublon', texte: `numéro en double : ${doublons[0].numero}` });
  const manqueQrHorsLigne = mode === 'qr' && apercu?.erreur ? apercu.erreur : '';

  /* L'aperçu du QR de l'annexe : le vrai (swissqrbill), dès que la facture est constructible ; sinon le QR exemple, marqué comme tel. */
  useEffect(() => {
    let vivant = true;
    if (mode !== 'qr' || !client || !totaux || bloqueQr || manqueUid) { setApercu(null); return; }
    (async () => {
      try {
        const prete = await preparerQrFacture({ iban, creancier: creancier!, debiteur: debiteurDe(client), montantCents: totaux.totalCents, numero, rasteriser: async () => `data:image/png;base64,${'A'.repeat(1200)}` });
        const { SwissQRCode } = await import('swissqrbill/svg');
        const svg = new SwissQRCode(prete.donnees, 40).toString();
        if (vivant) setApercu({ svg, erreur: '' });
      } catch (e) { if (vivant) setApercu({ svg: '', erreur: e instanceof QrFactureInvalide ? e.message : 'QR indisponible.' }); }
    })();
    return () => { vivant = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, client?.id, client?.adresse, client?.address, client?.name, totaux?.totalCents, numero, bloqueQr, manqueUid, iban, essai]);

  /* L'hôte demande la fermeture : jamais pendant l'enregistrement ; avec une écriture locale en attente, un premier appui avertit. */
  useEffect(() => {
    if (!fermetureRef) return;
    fermetureRef.current = () => {
      if (busy.current) return false;
      if (lireBrouillon() && !avert.current) { avert.current = true; setAvertissement(`Une écriture locale existe déjà (${lireBrouillon()!.vente.numero}) : elle se confirmera à la reprise. Ferme encore pour la laisser en attente.`); return false; }
      return true;
    };
    return () => { fermetureRef.current = null; };
  }, [fermetureRef]);

  const changerOccupe = (v: boolean) => { busy.current = v; setOccupe(v); onBusy?.(v); };

  const choisirClient = (id: string | null) => {
    setClientId(id); setVeutFacture(false);
    if (id === null && mode === 'qr') setMode('paye');
    if (id !== null && mode === 'paye' && !lignes.length) setMode('qr');
  };

  const cle = (batchId: string | undefined, formatId: string) => `${batchId ?? '-'}:${formatId}`;
  const ajouter = (formatId: string, label: string, litres: number, prix: number | null) => {
    if (enAttente) return;
    const k = cle(actifId, formatId);
    const designation = `${actif ? actif.name : 'Bière'} · ${label}`.trim();
    if (prix === null) { setLibre({ designation, quantite: 1, prix: undefined, formatId, batchId: actifId, litres }); return; }
    setLignes(ls => ls.some(l => l.cle === k)
      ? ls.map(l => l.cle === k ? { ...l, quantite: Math.min(QUANTITE_MAX, l.quantite + 1) } : l)
      : [...ls, { cle: k, batchId: actifId, formatId, designation, litresUnite: litres, quantite: 1, prixHT: prix }]);
  };
  const retirer = (k: string) => { if (!enAttente) setLignes(ls => ls.flatMap(l => l.cle !== k ? [l] : l.quantite > 1 ? [{ ...l, quantite: l.quantite - 1 }] : [])); };
  const poserLibre = () => {
    if (!libre) return;
    if (!libre.designation.trim()) { setErreur('Indique la désignation de la ligne.'); return; }
    if (!(libre.quantite && libre.quantite > 0)) { setErreur('Indique la quantité.'); return; }
    if (libre.prix === undefined || !(libre.prix > 0)) { setErreur('Indique son prix. Un article à 0 CHF ou sans prix ne se facture pas.'); return; }
    setErreur('');
    const k = libre.formatId === 'libre' ? `libre-${Date.now()}-${lignes.length}` : cle(libre.batchId, libre.formatId);
    const ligne: LignePanier = { cle: k, batchId: libre.batchId, formatId: libre.formatId, designation: libre.designation.trim(), litresUnite: libre.litres, quantite: libre.quantite, prixHT: libre.prix };
    setLignes(ls => ls.some(l => l.cle === k) ? ls.map(l => l.cle === k ? ligne : l) : [...ls, ligne]);
    setLibre(null);
  };

  const partager = async (pdf: VentePreparee['pdf']) => {
    try {
      const blob = (pdf.doc as { output?: (t: string) => unknown }).output?.('blob');
      if (blob instanceof Blob && typeof File !== 'undefined' && navigator.canShare) {
        const fichier = new File([blob], pdf.fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [fichier] })) { await navigator.share({ files: [fichier], title: pdf.fileName }); return; }
      }
    } catch (e) { if ((e as Error)?.name === 'AbortError') return; }
    pdf.doc.save(pdf.fileName);
  };

  const soumettre = async (envoyer = false) => {
    if (busy.current) return;
    changerOccupe(true); setErreur(''); setAvertissement(''); avert.current = false;
    try {
      let b = lireBrouillon();
      if (!b) {
        const vente = await preparerVente({ mode, lignes, client, dateIso, echeance, moyen, config, numero });
        b = { vente, lignes, clientId, mode, dateIso, echeance, moyen };
        garderBrouillon(b); setEnAttente(true);
      }
      const recu = await saveIncomeEntry(b.vente.entry);
      effacerBrouillon(); setEnAttente(false);
      const v = b.vente, ttc = v.totalCents / 100;
      onSaved?.(v.mode === 'paye'
        ? `Vente de ${montantChf(ttc)} CHF enregistrée. ${recu ? 'Quittance conservée dans Drive.' : 'Quittance gardée sur cet appareil, pas dans Drive.'}`
        : `Facture ${v.numero} de ${montantChf(ttc)} CHF enregistrée à encaisser. ${recu ? 'Facture conservée dans Drive.' : 'Facture gardée sur cet appareil, pas dans Drive.'}`);
      if (envoyer) await partager(v.pdf);
      if (v.mode === 'paye') { changerOccupe(false); onClose(); return; }
      setResultat({ numero: v.numero, totalCents: v.totalCents, mode: v.mode, pdf: v.pdf });
    } catch (e) {
      setErreur(e instanceof QrFactureInvalide ? e.message : e instanceof Error && e.message ? e.message : 'La vente reste à confirmer. Le brouillon est conservé.');
    } finally { changerOccupe(false); }
  };

  const nouvelleVente = () => { setResultat(null); setLignes([]); setErreur(''); numeroRef.current = null; setDateIso(todayISO()); };

  const peutPrimaire = !occupe && (enAttente || (Boolean(totaux) && !bornes && !dateErreur && !(mode === 'paye' && !moyen) && !(mode === 'qr' && (!client || bloqueQr || manqueQrHorsLigne))) && !manqueUid);
  const libelleTotal = totaux ? fr(totaux.totalCents) : '—';
  const libellePrimaire = occupe ? 'Enregistrement…' : enAttente ? 'Reprendre la confirmation' : null;

  const choisirDate = (valeur: string) => {
    if (!isoDate(valeur)) return;
    setDateIso(valeur);
  };

  /* ---------- rendu ---------- */
  const multiBiere = new Set(lignes.map(l => l.batchId)).size > 1;
  const formats = formatsDuBrassin(actif, futs);
  const jauge = actif ? jaugeBrassin(actif, litresVendus(transactions, actif.id)) : null;
  const fieldsetOff = occupe || enAttente || Boolean(resultat);
  const nomAnnexe = client ? client.name : 'Comptoir';

  return (
    <div className="cs" data-mode={mode}>
      <div className="cs-app">
        <div className="cs-left">
          <div className="cs-who" role="group" aria-label="À qui">
            {clientsTries.map(c => (
              <button key={c.id} type="button" className="cs-av" aria-pressed={clientId === c.id} disabled={fieldsetOff} onClick={() => choisirClient(c.id)}>
                <i>{initiales(c.name)}</i><em className={c.type === 'Privé' ? 'cs-pv' : ''}>{c.type}</em>{c.name}
              </button>
            ))}
            <button type="button" className="cs-av" aria-pressed={clientId === null} disabled={fieldsetOff} onClick={() => choisirClient(null)}><i><Echoppe /></i>Comptoir</button>
            <button type="button" className="cs-av cs-new" disabled={fieldsetOff} onClick={() => setClientEdite({ id: nextClientId(clients.map(c => c.id)), name: '', type: 'Pro', contact: '', phone: '', email: '' })}><i>+</i>client</button>
          </div>

          <div className="cs-beers">
            {selection.map(id => {
              const b = vendables.find(x => x.id === id);
              if (!b) return null;
              const j = jaugeBrassin(b, litresVendus(transactions, b.id));
              return (
                <button key={id} type="button" className="cs-bc" aria-pressed={id === actifId} disabled={fieldsetOff} onClick={() => setSelection(s => [id, ...s.filter(x => x !== id)])}
                  title={j.nets === null ? 'Litres nets à noter' : `Litres notés depuis la caisse, sur ${j.source === 'conditionne' ? 'les litres conditionnés' : 'les litres nets enregistrés'}`}>
                  <svg width="20" height="28" viewBox="0 0 22 30" aria-hidden="true"><path d="M3 3h16l-2 25H5z" fill="#F2C14E" stroke="currentColor" strokeWidth="1.8" /><path d="M3 3h16v4H3z" fill="#fff" stroke="currentColor" strokeWidth="1.8" /></svg>
                  <span><b>{b.name}</b><small>{moisCourt(b)}</small></span>
                  <span className="cs-jg" data-inconnu={j.nets === null ? '' : undefined} data-depasse={j.depasse ? '' : undefined}>
                    <div><i style={{ width: `${Math.round((j.ratio ?? 0) * 100)}%` }} /></div>
                    <p>{j.nets === null ? 'litres à noter' : <><span className="cs-m">{nombre1(j.vendus)}</span>/<span className="cs-m">{Math.round(j.nets * 10) / 10}</span> L nets</>}{j.depasse ? ' · au-delà du conditionné' : ''}</p>
                  </span>
                </button>
              );
            })}
            {!selection.length && <span className="cs-bc cs-vide">aucune bière conditionnée</span>}
            <div className="cs-addwrap">
              <button type="button" className="cs-addb" disabled={fieldsetOff || vendables.length <= selection.length} onClick={() => setChoixBiere(v => !v)}>+ bière</button>
              {choixBiere && <ul className="cs-pick" role="listbox" aria-label="Ajouter une bière">
                {vendables.filter(b => !selection.includes(b.id)).map(b => <li key={b.id}><button type="button" onClick={() => { setSelection(s => [...s, b.id]); setChoixBiere(false); }}>{b.name}</button></li>)}
              </ul>}
            </div>
          </div>

          <div className="cs-tiles" data-mots="lignes">
            {formats.map(({ format, present, aVerifier }, i) => {
              const tarif = tarifDuFormat(tarifs, format.id, actif?.name);
              const prix = tarif?.priceHT ?? null;
              const ligne = lignes.find(l => l.cle === cle(actifId, format.id));
              return (
                <button key={format.id} ref={i === 0 ? premiereTuile : undefined} type="button" className={`cs-t${ligne ? ' cs-has' : ''}${present ? '' : ' cs-off'}`} disabled={fieldsetOff}
                  aria-label={`${format.label}${prix !== null ? `, ${montantChf(prix)} CHF` : ', prix à indiquer'}`} onClick={() => ajouter(format.id, format.label, format.volumeL, prix)}>
                  {ligne && <span className="cs-n cs-m">{ligne.quantite}</span>}
                  {format.id === 'fut' ? <Fut /> : <Bouteille grande={format.id === '75cl'} />}
                  <div><b>{format.label}</b>{aVerifier && <small> · à vérifier</small>}<div className="cs-p">{prix !== null ? <><span className="cs-m">{montantChf(prix)}</span> CHF</> : 'prix ?'}</div></div>
                  {ligne && <span className="cs-minus" role="button" tabIndex={0} aria-label={`Retirer un ${format.label}`} onClick={e => { e.stopPropagation(); retirer(ligne.cle); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); retirer(ligne.cle); } }}>−</span>}
                </button>
              );
            })}
            <button type="button" className="cs-t cs-free" disabled={fieldsetOff} onClick={() => setLibre({ designation: '', quantite: 1, prix: undefined, formatId: 'libre', litres: 0 })}>
              <Feuille /><div><b>Autre</b><div className="cs-p">consigne, verres…</div></div>
            </button>
          </div>

          {libre && (
            <div className="cs-libre" role="group" aria-label="Ligne libre">
              <label>Désignation<Input value={libre.designation} onChange={e => setLibre({ ...libre, designation: e.target.value })} placeholder="Consigne, verres…" /></label>
              <div className="cs-libre-nb">
                <label>Quantité<ChampNombre aria-label="Quantité" value={libre.quantite} onValue={v => setLibre({ ...libre, quantite: v })} max={QUANTITE_MAX} /></label>
                <label>Prix unitaire {assujetti ? 'HT' : '(CHF)'}<ChampNombre aria-label="Prix unitaire" value={libre.prix} onValue={v => setLibre({ ...libre, prix: v })} max={PRIX_UNITAIRE_MAX} fractionDigits={undefined} placeholder="—" /></label>
              </div>
              <div className="cs-libre-act"><button type="button" onClick={() => { setLibre(null); setErreur(''); }}>Annuler</button><button type="button" className="cs-pri" onClick={poserLibre}>Ajouter la ligne</button></div>
            </div>
          )}
        </div>

        <div className="cs-right">
          <section className="cs-ticket" aria-label="Ticket">
            {!lignes.length && <div className="cs-tl cs-muted"><span>rien dans le panier</span></div>}
            {lignes.map((l, i) => (
              <div className="cs-tl" key={l.cle}>
                <span>{String(l.quantite).replace('.', ',')} × {l.formatId !== 'libre' && !multiBiere ? l.designation.split(' · ').slice(-1)[0] : l.designation}</span>
                <span className="cs-m">{totaux ? fr(totaux.lines[i].netCents) : '—'}</span>
                {l.formatId === 'libre' && !fieldsetOff && <button type="button" className="cs-x" aria-label={`Retirer ${l.designation}`} onClick={() => setLignes(ls => ls.filter(x => x.cle !== l.cle))}>×</button>}
              </div>
            ))}
            {assujetti && totaux && <div className="cs-tl"><span>TVA {String((taux * 100).toFixed(1)).replace('.', ',')} %</span><span className="cs-m">{fr(totaux.vatCents)}</span></div>}
            <div className="cs-tt">
              <span>{demo && <span className="cs-ex">prix exemple</span>}<span className="cs-tva">{assujetti ? 'TVA incluse' : 'sans TVA'}</span></span>
              <b className="cs-m" aria-label="Total">{libelleTotal}<small>CHF</small></b>
            </div>
            {bornes && <p role="alert" className="cs-err">{bornes}</p>}
            {probleme && lignes.length > 0 && !libre && <p className="cs-aide">{probleme}</p>}
            <div className="cs-pay" role="group" aria-label="Comment il paie">
              <button type="button" aria-pressed={mode === 'paye'} disabled={fieldsetOff} onClick={() => setMode('paye')}>✓ Payé ici</button>
              <button type="button" aria-pressed={mode === 'qr'} aria-disabled={!client || undefined} disabled={fieldsetOff} title={client ? undefined : 'Une facture a besoin d’un client'}
                onClick={() => { if (!client) { setVeutFacture(true); return; } setMode('qr'); }}><PictoQr />Facture QR</button>
            </div>
            {mode === 'paye'
              ? <div className="cs-due" role="group" aria-label="Moyen de paiement">
                  <span>réglé en</span>
                  <button type="button" aria-pressed={moyen === 'twint'} disabled={fieldsetOff} onClick={() => setMoyen('twint')}>TWINT</button>
                  <button type="button" aria-pressed={moyen === 'cash'} disabled={fieldsetOff} onClick={() => setMoyen('cash')}>Espèces</button>
                </div>
              : <div className="cs-due" role="group" aria-label="Échéance">
                  <button type="button" aria-pressed={echeance === 'reception'} disabled={fieldsetOff} onClick={() => setEcheance('reception')}>à réception</button>
                  <button type="button" aria-pressed={echeance === 10} disabled={fieldsetOff} onClick={() => setEcheance(10)}>10 j</button>
                  <button type="button" aria-pressed={echeance === 30} disabled={fieldsetOff} onClick={() => setEcheance(30)}>30 j</button>
                  <span className="cs-d">→ <span className="cs-m">{dueDate ? dateCourte(dueDate) : '—'}</span></span>
                </div>}
          </section>

          {!resultat
            ? <button type="button" className="cs-go" disabled={!peutPrimaire} onClick={() => void soumettre(false)}>
                {libellePrimaire ?? (mode === 'qr' ? 'Facturer' : 'Encaisser')}{!libellePrimaire && <> <span className="cs-m">{libelleTotal}</span> CHF</>}
              </button>
            : <div className="cs-fait" role="status"><b>Facture {resultat.numero} enregistrée</b><span className="cs-m">{fr(resultat.totalCents)} CHF</span></div>}

          {(manques.length > 0 || erreur || manqueQrHorsLigne || avertissement || dateErreur) && (
            <div className="cs-notes">
              {manques.map(m => <div className="cs-note" key={m.cle}><span>{m.texte}</span>{m.bouton && <button type="button" onClick={m.action}>{m.bouton}</button>}</div>)}
              {manqueQrHorsLigne && <div className="cs-note"><span>{manqueQrHorsLigne}</span><button type="button" onClick={() => { setApercu(null); setEssai(n => n + 1); }}>Réessayer</button></div>}
              {dateErreur && <div className="cs-note" role="alert"><span>{dateErreur}</span></div>}
              {erreur && <div className="cs-note cs-note-err" role="alert"><span>{erreur}</span>{enAttente && !occupe && <button type="button" onClick={() => void soumettre(false)}>Réessayer</button>}</div>}
              {avertissement && <div className="cs-note" role="status"><span>{avertissement}</span></div>}
            </div>
          )}

          <div className="cs-ann">Annexe · {mode === 'qr' ? 'la facture imprimée' : 'la quittance imprimée'}</div>
          <article className="cs-doc" aria-label={mode === 'qr' ? 'Aperçu de la facture' : 'Aperçu de la quittance'}>
            <div className="cs-dh">
              <div>
                <b>{mode === 'qr' ? 'Facture' : 'Quittance'}</b>
                <small>{mode === 'qr' && <>n° <span className="cs-m">{numero}</span> · </>}
                  <button type="button" className="cs-date cs-m" disabled={fieldsetOff} aria-label="Date de la facture" onClick={() => setDateOuverte(v => !v)}>{dateLongue(dateIso)}</button></small>
                {dateOuverte && <input type="date" className="cs-dateinput" aria-label="Choisir la date" value={dateIso} onChange={e => choisirDate(e.target.value)} />}
              </div>
              <div style={{ textAlign: 'right' }}><b style={{ fontSize: 15 }}>{company.name || 'Brasserie'}</b><small>{creancier?.localite ?? ''}</small></div>
            </div>
            <div className="cs-dto"><b>{nomAnnexe}</b>{client ? ` · ${client.type}` : ''}{client && !debiteurDe(client) && <><br /><span className="cs-att">adresse à compléter</span></>}</div>
            {mode === 'qr'
              ? lignes.map((l, i) => <div className="cs-dl" key={l.cle}><span>{l.designation} · {l.quantite} × <span className="cs-m">{montantChf(l.prixHT ?? NaN)}</span></span><span className="cs-m">{totaux ? fr(totaux.lines[i].netCents) : '—'}</span></div>)
              : <div className="cs-dl"><span>quittance : une ligne · {lignes.length ? versArticles(lignes, taux).map(a => `${a.quantity} × ${a.description}`).join(' · ') : '—'}</span><span className="cs-m">{totaux ? fr(totaux.totalCents) : '—'}</span></div>}
            <div className="cs-dsum"><span>Total CHF · {assujetti ? 'TVA incluse' : 'sans TVA'}{mode === 'qr' && dueDate ? <> · payable au <span className="cs-m">{dateLongue(dueDate)}</span></> : mode === 'paye' ? <> · {moyen === 'twint' ? 'payé par TWINT' : moyen === 'cash' ? 'payé en espèces' : 'payé ici'}</> : null}</span><b className="cs-m">{libelleTotal}</b></div>
            {mode === 'qr' && <>
              <div className="cs-cut"><span>✂</span></div>
              <div className="cs-qr">
                {apercu?.svg ? <span className="cs-qrsvg" aria-label="QR-facture" dangerouslySetInnerHTML={{ __html: apercu.svg }} /> : <QrExemple />}
                <div><small>Compte</small><span className="cs-m">CH·· ···· (Réglages)</span><small>Montant</small><span className="cs-m">CHF {libelleTotal}</span>
                  {!apercu?.svg && <span className="cs-ex" style={{ marginTop: 4 }}>QR exemple</span>}</div>
              </div>
            </>}
          </article>
          <div className="cs-sent">
            {resultat
              ? <><button type="button" className="cs-pri" onClick={() => void partager(resultat.pdf)}>Envoyer le PDF</button><button type="button" onClick={nouvelleVente}>Nouvelle vente</button></>
              : <><button type="button" onClick={() => premiereTuile.current?.focus()}>Modifier</button><button type="button" className="cs-pri" disabled={!peutPrimaire || enAttente} onClick={() => void soumettre(true)}>Envoyer le PDF</button></>}
          </div>
        </div>
      </div>

      {clientEdite && createPortal(<EditClientModal isOpen client={clientEdite} onClose={() => setClientEdite(null)} onSave={c => { setClientId(c.id); if (!lignes.length || mode !== 'qr') setMode('qr'); }} />, document.body)}
      {identiteOuverte && createPortal(<IdentiteBrasserieFeuille onClose={() => setIdentiteOuverte(false)} onSaved={() => setApercu(null)} />, document.body)}
    </div>
  );
}

/** La caisse en dialogue propre (Clients › fiche › Facturer). « + › Vendre » monte `CaisseContenu` dans le dialogue de `QuickActionModal` : un seul dialogue dans les deux cas. */
export function Caisse({ clientIdInitial, onClose, onSaved }: { clientIdInitial?: string; onClose: () => void; onSaved?: (message: string) => void }) {
  const [occupe, setOccupe] = useState(false);
  const fermeture = useRef<(() => boolean) | null>(null);
  const fermer = () => { if (fermeture.current && !fermeture.current()) return; onClose(); };
  return (
    <ModalShell open onClose={fermer} size="xl" labelledBy="caisse-titre" dismissible={!occupe}>
      <div className="cs-hd">
        <h2 id="caisse-titre">Vendre</h2>
        <button type="button" aria-label="Fermer la vente" disabled={occupe} onClick={fermer}><X size={18} aria-hidden="true" /></button>
      </div>
      <div className="cs-scroll"><CaisseContenu clientIdInitial={clientIdInitial} onClose={onClose} onSaved={onSaved} onBusy={setOccupe} fermetureRef={fermeture} /></div>
    </ModalShell>
  );
}
