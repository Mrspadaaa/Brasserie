import React, { useMemo, useState } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { BrewerChat } from '../BrewerChat';
import { StorageService } from '../../services/storage';
import { FinanceService } from '../../services/financeService';
import { FinancialArchiveService } from '../../services/financialArchiveService';
import { useStorageValue } from '../../hooks/useLiveData';
import { paymentState, todayISO } from '../../domain/finance/ledger';
import { periodeSynthese } from '../../domain/finance/periodeSynthese';
import { isUpgradePlan } from '../../domain/finance/upgrades';
import { amountOnly } from './financeFormat';
import { CompagnonFeuille, MODES, type ModeReponse, type PastilleVue } from './compagnon/CompagnonFeuille';
import { contexteCompagnon, REGLAGES_DEFAUT, type ReglagesContexte } from './compagnon/contexte';
import { pastilleAPayer, pastilleOperations, pastilleProfil, pastilleSansPiece, periodeDeLaQuestion, posteVise, questionCourte } from './compagnon/vue';

type Vue = 'costs' | 'journal' | 'forecast' | 'projects' | 'annual';
interface Props {
  view: Vue;
  month: string;
  allDates: boolean;
  year: number;
  horizon: number;
  includeEquipmentProjects?: boolean;
  /** Opérations : la question calculée de v6b (« Pourquoi les charges fixes pèsent autant ? ») remplace le libellé et la question de la vue. */
  pose?: { libelle: string; question: string } | null;
}
type Choisie = { libelle: string; question: string };

const readTransactions = () => StorageService.getTransactions();
const readFinance = () => FinanceService.snapshot();
const readArchives = () => FinancialArchiveService.getArchives();
const sansPiece = (t: { proofUrl?: string; finance?: { proofDocumentId?: string } }) => !t.proofUrl && !t.finance?.proofDocumentId;
const MODE_CLE = 'brewer-chat-mode';
const modeEnregistre = (): ModeReponse => {
  try { const m = localStorage.getItem(MODE_CLE); if (MODES.some(x => x.value === m)) return m as ModeReponse; } catch { /* stockage privé : le mode reste Auto */ }
  return 'auto';
};
const nomDuMois = (mois: string) => new Intl.DateTimeFormat('fr-CH', { month: 'long' }).format(new Date(`${mois}-15T12:00:00`));

/**
 * m4ia-c : la feuille « Ce que le compagnon va lire ». Montée seulement ouverte (les lectures et les piles ne coûtent rien tant qu'elle est fermée).
 * Les pastilles décochées sortent du contexte (`contexteCompagnon`) et la consigne qui les nomme part dans la question.
 * LIMITE : `functions/src/brewerFinanceContext.ts` lit tout le registre ; la restriction passe par la consigne, pas par le serveur.
 */
function Feuille({ view, month, allDates, includeEquipmentProjects, pose, choisie, onClose, onEnvoyer }: {
  view: Vue; month: string; allDates: boolean; includeEquipmentProjects: boolean; pose?: Props['pose']; choisie: Choisie;
  onClose: () => void; onEnvoyer: (question: string) => void;
}) {
  const transactions = useStorageValue(readTransactions);
  const data = useStorageValue(readFinance);
  const archives = useStorageValue(readArchives);
  const aujourdhui = todayISO();
  const vueOperations = view === 'costs' || view === 'journal';
  const duree = periodeDeLaQuestion(pose?.question, month, allDates);
  const [r, setR] = useState<ReglagesContexte>(() => ({
    ...REGLAGES_DEFAUT,
    // Prévisions et Annuel parlent de tout le registre : une consigne « ce mois » dégraderait la réponse.
    toutHistorique: vueOperations ? duree === 'tout' : true, periode: vueOperations ? duree !== 'tout' : false,
    projets: view === 'forecast' || view === 'projects' ? includeEquipmentProjects : false,
  }));
  const [mode, setMode] = useState<ModeReponse>(modeEnregistre);

  const synth = useMemo(() => periodeSynthese({ transactions, payments: data.payments, mois: duree === 'tout' || r.toutHistorique ? null : month, aujourdhui, assets: data.assets }),
    [transactions, data.payments, data.assets, duree, r.toutHistorique, month, aujourdhui]);
  const bande = useMemo(() => !vueOperations || duree === 'autre' ? null
    : periodeSynthese({ transactions, payments: data.payments, mois: duree === 'tout' ? null : month, aujourdhui, assets: data.assets }),
  [vueOperations, duree, transactions, data.payments, data.assets, month, aujourdhui]);
  const vise = pose && bande ? posteVise(bande) : null;
  const poste = vise && bande ? bande.postes.find(p => p.categorie === vise) : undefined;
  const court = pose && poste && bande ? questionCourte(pose.libelle, poste.cents, bande.depenseCents, amountOnly) : null;
  const chiffres = court && pose ? court.slice(pose.libelle.length).trim() : '';
  const [texte, setTexte] = useState(court ?? choisie.question);

  const aPayerIds = useMemo(() => transactions.filter(t => { const s = paymentState(t, data.payments, transactions, aujourdhui).state; return s === 'unpaid' || s === 'partial'; }).map(t => t.id), [transactions, data.payments, aujourdhui]);
  const sansPieceIds = useMemo(() => transactions.filter(sansPiece).map(t => t.id), [transactions]);
  const donnees = { mois: month, asOf: aujourdhui, transactions, payments: data.payments, plans: data.plans, assets: data.assets, closings: data.closings, archives, profile: data.profile, aPayerIds, sansPieceIds };
  const lu = contexteCompagnon(r, donnees);
  const tout = contexteCompagnon({ ...r, operations: true, aPayer: true, sansPiece: true }, donnees).transactionIds;
  const nSansPiece = tout.filter(id => sansPieceIds.includes(id)).length;

  const pastilles: PastilleVue[] = [
    { cle: 'periode', libelle: nomDuMois(month), coche: r.periode },
    { cle: 'operations', libelle: pastilleOperations(lu.transactionIds.length), coche: r.operations },
  ];
  const aPayer = pastilleAPayer(synth.aPayer, synth.aPayerCents, amountOnly);
  if (aPayer) pastilles.push({ cle: 'aPayer', libelle: aPayer, coche: r.aPayer, hachure: r.aPayer });
  if (nSansPiece > 0) pastilles.push({ cle: 'sansPiece', libelle: pastilleSansPiece(nSansPiece), coche: r.sansPiece });
  pastilles.push({ cle: 'profil', libelle: pastilleProfil(data.profile.vatRegistered), coche: r.profil },
    { cle: 'toutHistorique', libelle: 'tout l’historique', coche: r.toutHistorique },
    { cle: 'archives', libelle: 'archives', coche: r.archives },
    { cle: 'projets', libelle: 'projets de matériel', coche: r.projets });

  const envoyer = () => {
    const corps = court && pose && texte === court ? `${pose.question} ${chiffres}` : texte;
    // La question d'abord, la consigne du contexte après : dans le champ du chat, la première ligne est celle du brasseur, pas une phrase technique (t1, problème 5).
    onEnvoyer(`${corps}\n\n${lu.consigne}`);
  };
  return <CompagnonFeuille open onClose={onClose} periode={bande} nomPeriode={duree === 'tout' ? 'tout l’historique' : nomDuMois(month)} vise={vise}
    texte={texte} onTexte={setTexte} pastilles={pastilles} onBascule={cle => setR(x => ({ ...x, [cle]: !x[cle] }))}
    mode={mode} onMode={m => { setMode(m); try { localStorage.setItem(MODE_CLE, m); } catch { /* préférence non enregistrée */ } }} onEnvoyer={envoyer}/>;
}

/** Preparing a question never starts a generation: the brewer edits and sends it. */
export function FinanceAssistant({ view, month, allDates, year, horizon, includeEquipmentProjects = true, pose }: Props) {
  const [etape, setEtape] = useState<'feuille' | 'chat'>();
  const [question, setQuestion] = useState('');
  const period = allDates ? 'tout mon historique disponible' : `la période ${month}`;
  const suggestions = [
    { label: 'Comprendre mes dépenses', question: `Analyse mes dépenses pour ${period}. Explique les principaux postes et les variations utiles pour ma brasserie. Distingue les achats, les paiements et les investissements ; signale les données manquantes.` },
    { label: 'Préparer un achat de matériel', question: 'Aide-moi à préparer un achat de matériel et à prioriser mes projets pour la brasserie : besoin réel, horizon bientôt/ensuite/plus tard, budget TTC avec livraison et installation, devis, achats déjà liés et trésorerie. Appuie-toi sur mes projets enregistrés et distingue ceux inclus dans les prévisions des idées mises de côté. Demande les prix et dates manquants. Compare acheter, réparer ou attendre, sans supposer des ventes futures.' },
    { label: 'Prévoir mes prochains paiements', question: `Explique ma prévision sur ${horizon === 365 ? '12 mois' : `${horizon} jours`}, avec les factures à payer, les prévisions actives et les prochains brassins. Le scénario affiché ${includeEquipmentProjects ? 'inclut' : 'exclut'} les projets de matériel encore à acheter ; leurs factures réelles restent prises en compte. Compare l’impact de ces projets. Sépare engagements connus et estimations. Quels montants ou repères manquent encore ?` },
    { label: 'Vérifier mes opérations', question: 'Vérifie les incohérences de mes opérations enregistrées, y compris les archives utiles : doublons possibles, paiements, classement du matériel et pièces à compléter. Identifie les opérations concernées et propose les corrections à vérifier, sans rien modifier.' },
    { label: `Préparer l’année ${year}`, question: `Aide-moi à préparer le dossier annuel ${year} de ma brasserie indépendante en Suisse selon mon profil enregistré. Explique les amortissements, inventaires, créances et dettes à vérifier. Distingue résultat et trésorerie. Si cette année n’est pas couverte par le contexte, dis-le clairement et demande les chiffres nécessaires.` }
  ];
  const selected = pose ? { label: pose.libelle, question: pose.question } : suggestions[view === 'forecast' ? 2 : view === 'annual' ? 4 : view === 'journal' ? 3 : view === 'projects' ? 1 : 0];
  const libelle = selected.label;
  return <>
    <button type="button" className="finance-assistant" onClick={() => setEtape('feuille')}>
      <Sparkles size={19} aria-hidden="true" />
      <span><strong>{libelle}</strong><small>Compagnon brasseur</small></span>
      <ChevronRight size={18} aria-hidden="true" />
    </button>
    {etape === 'feuille' && <Feuille view={view} month={month} allDates={allDates} includeEquipmentProjects={includeEquipmentProjects} pose={pose} choisie={{ libelle, question: selected.question }}
      onClose={() => setEtape(undefined)} onEnvoyer={q => { setQuestion(q); setEtape('chat'); }}/>}
    {etape === 'chat' && <BrewerChat scope={{ kind: 'app', id: 'finances' }} label="Mes finances" phase="Finances de la brasserie" initialOpen hideLauncher classeFeuille="brewer-chat-finances" initialQuestion={question} autoSend suggestedPrompts={suggestions} onClose={() => setEtape(undefined)} />}
  </>;
}
