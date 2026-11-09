import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import type { Batch, StockItem, Transaction } from '../../../types';
import type { FinancialAsset, FinancialPayment, FinancialPlan, FinancialProfile } from '../../../domain/finance/types';
import { buildForecast, type ForecastItem } from '../../../domain/finance/forecast';
import { estimerBrassinsPlanifies } from '../../../domain/finance/brewForecast';
import { isUpgradePlan } from '../../../domain/finance/upgrades';
import type { LedgerSummary } from '../../../domain/finance/ledger';
import { StorageService } from '../../../services/storage';
import { UpgradeWorkspace } from '../UpgradeWorkspace';
import { FinanceForecastSummary } from '../FinanceForecastSummary';
import { construireEscalier, dernierJourInclus, notions, regrouperTendance, titreHorizon } from './escalier';
import { EscalierSvg, nomLong, styleDe as styleDeBase } from './EscalierSvg';
import { FicheBrassin, FicheProjet } from './FicheEtiquette';
import { Feuille } from './Feuille';
import { ListeSorties, plansHorsProjets } from './ListeSorties';
import { mesureDuProjet } from './mesureProjet';
import { centimesDeSaisie, jourCourt, litreFr, montant, montantEntier, montantSigne } from './format';
import '../previsions.css';

const HORIZONS = [[30, '30j', '30 jours'], [90, '90j', '90 jours'], [365, '12 mois', '12 mois']] as const;
const CLE_PRIX = 'previsions_prix_bouteille';
type Horizon = 30 | 90 | 365;
type Fiche = { kind: 'projet'; planId: string } | { kind: 'brassin'; batchId: string } | null;
export interface CiblePrevoir { planId: string; batchId?: string; at: number }

export interface PrevisionsProps {
  asOf: string; horizon: Horizon; onHorizon: (h: Horizon) => void;
  transactions: Transaction[]; payments: FinancialPayment[]; plans: FinancialPlan[]; profile: FinancialProfile; assets: FinancialAsset[]; batches: Batch[]; stockItems: StockItem[];
  ledger: LedgerSummary; openingCashReady: boolean;
  avecProjets: boolean; onAvecProjets: (avec: boolean) => void;
  onProfile: () => void; onPayments: () => void; onOpenTransaction: (tx: Transaction) => void; onOpenPlan: (plan: FinancialPlan) => void; onOpenUpgrade: (plan: FinancialPlan | null) => void;
  onAddPlan: () => void; onBudgetPicker: () => void; onOpenBudget: (batch: Batch) => void; onNotice: (texte: string) => void; onSale?: () => void; onJournal?: () => void;
  cible?: CiblePrevoir | null; onCibleTraitee?: () => void; projetsOuverts?: boolean; children?: React.ReactNode;
}

export function Previsions(p: PrevisionsProps) {
  const { asOf, horizon, ledger } = p;
  const fin = dernierJourInclus(asOf, horizon), titre = titreHorizon(fin, horizon);
  const [teste, setTeste] = useState<string | null>(null), [fiche, setFiche] = useState<Fiche>(null);
  const [annexe, setAnnexe] = useState(false), [limites, setLimites] = useState(false), [projets, setProjets] = useState(!!p.projetsOuverts);
  const [prix, setPrix] = useState(() => StorageService.getUiState<string>(CLE_PRIX, ''));
  const [message, setMessage] = useState(''), [restes, setRestes] = useState<string[]>([]);
  const stockKey = p.stockItems.map(s => `${s.ref}:${s.currentStock}`).join('|');
  const stockRef = useRef(p.stockItems); stockRef.current = p.stockItems;

  // Le domaine fait foi : `buildForecast` (d2 et d3) avec les brassins, le stock et le registre. Deux appels au plus : tout, puis sans le projet testé.
  const avec = useMemo(() => buildForecast({ transactions: p.transactions, payments: p.payments, plans: p.plans, profile: p.profile, asOf, months: 13, batches: p.batches, stockItems: stockRef.current, assets: p.assets }),
    [p.transactions, p.payments, p.plans, p.profile, p.assets, p.batches, stockKey, asOf]);
  const projetsItems = avec.items.filter(i => i.source === 'equipment' && i.planId && i.date <= fin);
  const testeId = useMemo(() => {
    if (teste && projetsItems.some(i => i.planId === teste)) return teste;
    return [...projetsItems].sort((a, b) => b.amountCents - a.amountCents || a.date.localeCompare(b.date))[0]?.planId ?? null;
  }, [teste, projetsItems.map(i => i.id).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  const sans = useMemo(() => testeId ? buildForecast({ transactions: p.transactions, payments: p.payments, plans: p.plans, profile: p.profile, asOf, months: 13, batches: p.batches, stockItems: stockRef.current, assets: p.assets, ignoreUpgradePlanId: testeId }) : null,
    [testeId, p.transactions, p.payments, p.plans, p.profile, p.assets, p.batches, stockKey, asOf]);
  const depart = ledger.cashComplete ? ledger.cashCents ?? null : null;
  // une sortie à 0,00 n'existe pas chez un brasseur : la part inconnue d'un brassin n'est pas une marche (elle est dite dans la fiche du brassin et dans les limites)
  const preparer = (items: ForecastItem[]) => regrouperTendance(items.filter(i => i.date <= fin && i.amountCents > 0));
  const itemsAvec = useMemo(() => preparer(avec.items), [avec, fin]); // eslint-disable-line react-hooks/exhaustive-deps
  const itemsSans = useMemo(() => sans ? preparer(sans.items.filter(i => i.planId !== testeId)) : null, [sans, testeId, fin]); // eslint-disable-line react-hooks/exhaustive-deps
  const debut = asOf;
  const eAvec = useMemo(() => construireEscalier({ departCents: depart, items: itemsAvec, debut, fin }), [depart, itemsAvec, debut, fin]);
  const eSans = useMemo(() => itemsSans ? construireEscalier({ departCents: depart, items: itemsSans, debut, fin }) : null, [depart, itemsSans, debut, fin]);
  const modeSans = !!eSans && !p.avecProjets;
  const affiche = modeSans ? eSans! : eAvec, fantome = eSans ? (modeSans ? eAvec : eSans) : null;
  const plansParId = useMemo(() => new Map(p.plans.map(pl => [pl.id, pl])), [p.plans]);
  const planTeste = testeId ? plansParId.get(testeId) : undefined;

  const mesure = useMemo(() => planTeste ? mesureDuProjet({ plan: planTeste, plans: p.plans, assets: p.assets, transactions: p.transactions, forecast: avec, escalier: eAvec, batches: p.batches, stockItems: stockRef.current,
    profile: p.profile, asOf, fin, prixBouteilleCents: centimesDeSaisie(prix) }) : null, [planTeste, p.plans, p.assets, p.transactions, avec, eAvec, p.batches, stockKey, p.profile, asOf, fin, prix]);
  const sousLignes = useMemo(() => {
    const r: Record<string, string> = {};
    if (mesure && testeId) for (const i of eAvec.marches.flatMap(m => m.items)) if (i.planId === testeId && i.source === 'equipment') r[i.id] = `usure ${mesure.usureParAnCents == null ? '?' : montantEntier(mesure.usureParAnCents)}${mesure.litreApres == null ? '' : `, litre ${litreFr(mesure.litreApres)}`}`;
    return r;
  }, [mesure, eAvec, testeId]);

  // largeur mesurée (repli 370, la maquette : jsdom et premier rendu n'ont pas de mesure)
  const zone = useRef<HTMLDivElement>(null), [largeur, setLargeur] = useState(370);
  useLayoutEffect(() => {
    const el = zone.current; if (!el) return;
    const lire = () => { const w = el.clientWidth; setLargeur(w >= 280 ? w : 370); };
    lire();
    if (typeof ResizeObserver === 'undefined') return;
    const o = new ResizeObserver(lire); o.observe(el); return () => o.disconnect();
  }, []);

  const n = notions(itemsAvec, testeId);
  const visibles = affiche.marches.flatMap(m => m.items);
  const nSorties = visibles.filter(i => i.direction === 'out').length, entrees = visibles.filter(i => i.direction === 'in').reduce((s, i) => s + i.amountCents, 0);
  const aCompleter = useMemo(() => [...new Set(avec.items.filter(i => i.amountCents === 0 && i.date <= fin && i.source === 'brew' && !avec.warnings.some(w => w.startsWith(`${i.label.split(' · ')[0]} :`))).map(i => `${nomLong(i)} : à compléter${i.partial?.length ? ` (${i.partial.join(', ')})` : ''}`))], [avec, fin]);
  const incomplet = avec.warnings.length > 0 || !ledger.cashComplete || aCompleter.length > 0, nLimites = avec.warnings.length + aCompleter.length + (ledger.cashComplete ? 0 : 1) + (avec.undated.length ? 1 : 0);
  const titreDe = nomLong;
  const styleDe = (i: ForecastItem) => styleDeBase(i, testeId);
  const dernier = (s: typeof affiche) => s.soldeFinCents;
  const sousZero = (s: typeof affiche) => s.premierJourSousZero ? `sous zéro ${jourCourt(s.premierJourSousZero)}` : 'au-dessus de zéro';

  const fermerPuis = (fn: () => void) => () => { setAnnexe(false); setLimites(false); setProjets(false); fn(); };
  const ouvrirItem = (item: ForecastItem) => {
    if (item.source === 'equipment' && item.planId) { setTeste(item.planId); setFiche({ kind: 'projet', planId: item.planId }); return; }
    if (item.source === 'brew' && item.batchId) { setFiche({ kind: 'brassin', batchId: item.batchId }); return; }
    if (item.source === 'invoice') { const tx = p.transactions.find(t => `invoice:${t.id}` === item.id); if (tx) { p.onOpenTransaction(tx); return; } }
    const plan = item.planId ? plansParId.get(item.planId) : undefined;
    if (plan) { p.onOpenPlan(plan); return; }
    p.onNotice('Tendance calculée sur les dépenses courantes des mois complets, hors investissements et dépenses déjà planifiées.');
  };

  // « Prévoir » de c3a : amène à l'étiquette du brassin (ou du plan, pour un budget de recette sans lot) ; hors horizon, l'horizon s'élargit.
  const traitee = useRef(0);
  useEffect(() => {
    const c = p.cible; if (!c || traitee.current === c.at) return;
    const duBrassin = c.batchId ? avec.items.filter(i => i.source === 'brew' && i.batchId === c.batchId) : [];
    const duPlan = avec.items.filter(i => i.planId === c.planId && i.source === 'brew');
    const trouves = duBrassin.length ? duBrassin : duPlan;
    if (!trouves.length) {
      if (!plansParId.has(c.planId)) return; // le plan vient d'être écrit : attendre la relecture
      traitee.current = c.at; setMessage(c.batchId ? 'Ce brassin n’a plus de sortie prévue.' : 'Ajouté aux prévisions.'); p.onCibleTraitee?.(); return;
    }
    traitee.current = c.at;
    const premier = trouves.map(i => i.date).sort()[0];
    const h = ([30, 90, 365] as const).find(x => premier <= dernierJourInclus(asOf, x)) ?? 365;
    if (h > horizon) p.onHorizon(h);
    if (c.batchId && duBrassin.length) setFiche({ kind: 'brassin', batchId: c.batchId }); else ouvrirItem(trouves[0]);
    p.onCibleTraitee?.();
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const ficheBrassin = fiche?.kind === 'brassin' ? fiche : null;
  const itemsBrassin = ficheBrassin ? avec.items.filter(i => i.source === 'brew' && i.batchId === ficheBrassin.batchId) : [];
  const batch = ficheBrassin ? p.batches.find(b => b.id === ficheBrassin.batchId) : undefined;
  const litreBrassin = useMemo(() => ficheBrassin ? estimerBrassinsPlanifies({ batches: p.batches, stockItems: stockRef.current, transactions: p.transactions, plans: p.plans, profile: p.profile, assets: p.assets, asOf, fin })
    .brassins.find(b => b.batchId === ficheBrassin.batchId)?.coutLitre?.affiche.complet ?? null : null, [ficheBrassin?.batchId, p.batches, p.transactions, p.plans, p.profile, p.assets, asOf, fin]); // eslint-disable-line react-hooks/exhaustive-deps
  const ficheProjet = fiche?.kind === 'projet' ? plansParId.get(fiche.planId) : undefined;
  const connu = depart !== null;
  const carte = (s: typeof affiche, etiquette: string, actif: boolean | null, onClick?: () => void) => {
    const contenu = <><span>{etiquette}<small>{connu ? sousZero(s) : `écart ${horizon === 365 ? '12 mois' : `${horizon} j`}`}</small></span><b className={`prv-m${(dernier(s) == null ? montantSigne(s.ecartFinCents) : montant(dernier(s)!)).length > 8 ? ' prv-long' : ''}`}>{dernier(s) == null ? montantSigne(s.ecartFinCents) : montant(dernier(s)!)}</b></>;
    return onClick ? <button type="button" aria-pressed={!!actif} className={actif ? 'prv-on' : ''} onClick={onClick}>{contenu}</button> : <div className="prv-seule">{contenu}</div>;
  };

  return <section className="prv" aria-label={`Prévision sur ${horizon === 365 ? '12 mois' : `${horizon} jours`}`}>
    <div className="prv-tete"><h3>{titre}</h3>
      <span className="prv-seg" role="group" aria-label="Horizon de prévision">{HORIZONS.map(([v, court, long]) => <button type="button" key={v} aria-label={long} aria-pressed={horizon === v} onClick={() => p.onHorizon(v)}>{court}</button>)}</span></div>
    {!connu && <button type="button" className="prv-depart" onClick={p.onProfile}><span>Solde de départ à renseigner<small>sans lui, seul l’écart de la période est connu</small></span><ChevronRight size={14} aria-hidden="true" /></button>}
    {eSans && planTeste ? <div className="prv-sw" role="group" aria-label="Avec ou sans le projet de matériel">
      {carte(eAvec, `Avec ${planTeste.title.toLowerCase()}`, !modeSans, () => p.onAvecProjets(true))}
      {carte(eSans, `Sans ${planTeste.title.toLowerCase()}`, modeSans, () => p.onAvecProjets(false))}</div>
      : carte(eAvec, titre, null)}
    <div className="prv-g" ref={zone}>
      {affiche.marches.length === 0 && <p className="prv-vide">Aucune sortie prévue sur {horizon === 365 ? '12 mois' : `${horizon} jours`}.</p>}
      <EscalierSvg e={affiche} fantome={fantome} nomFantome={planTeste ? `${modeSans ? 'avec' : 'sans'} ${planTeste.title.toLowerCase()}` : undefined} largeur={largeur} testeId={modeSans ? null : testeId} sousLignes={sousLignes} asOf={asOf} onEtiquette={ouvrirItem} onRestes={setRestes} />
    </div>
    <div className="prv-leg"><span><i className="prv-dp" />À payer <b className="prv-m">{montant(n.aPayer)}</b></span><span><i className="prv-dv" />Prévu <b className="prv-m">~ {montant(n.prevu)}</b></span></div>
    {restes.length > 0 && <button type="button" className="prv-restes" aria-label={`Voir ${restes.length} ${restes.length > 1 ? 'sorties' : 'sortie'} de plus dans la liste`} onClick={() => setAnnexe(true)}>+ {restes.length} {restes.length > 1 ? 'sorties' : 'sortie'}<ChevronRight size={14} aria-hidden="true" /></button>}
    {(avec.undated.length > 0) && <button type="button" className="prv-sans-date" onClick={() => setLimites(true)}>+ {avec.undated.length} {avec.undated.length > 1 ? 'pièces sans date' : 'pièce sans date'}, {montant(avec.undatedOutCents + avec.undatedInCents)} hors graphe<ChevronRight size={14} aria-hidden="true" /></button>}
    {message && <p className="prv-etat prv-attente" role="status">{message}</p>}
    <div className="prv-pied">
      <span className="prv-plis">
        <button type="button" className="prv-pli" onClick={() => p.onJournal ? p.onJournal() : setAnnexe(true)}>Entrées : {entrees ? montant(entrees) : 'aucune'}<ChevronRight size={14} aria-hidden="true" /></button>
        <button type="button" className="prv-pli" onClick={() => setAnnexe(true)}><b className="prv-m">{nSorties}</b>&nbsp;{nSorties > 1 ? 'sorties' : 'sortie'}<ChevronRight size={14} aria-hidden="true" /></button>
        {(incomplet || nLimites > 0) && <button type="button" className="prv-pli" onClick={() => setLimites(true)}>Limites ({nLimites})<ChevronRight size={14} aria-hidden="true" /></button>}
      </span>
      {p.onSale && <button type="button" className="prv-prim prv-rouge" onClick={p.onSale}><Plus size={16} aria-hidden="true" />Vente</button>}
    </div>
    {p.children}
    {annexe && <ListeSorties marches={affiche.marches} styleDe={styleDe} titreDe={titreDe} plansListes={plansHorsProjets(p.plans)} undated={avec.undated}
      onItem={i => { setAnnexe(false); ouvrirItem(i); }} onPlan={pl => fermerPuis(() => p.onOpenPlan(pl))()} onAdd={fermerPuis(p.onAddPlan)} onBudget={fermerPuis(p.onBudgetPicker)} onProjets={() => { setAnnexe(false); setProjets(true); }} onProfile={fermerPuis(p.onProfile)} onClose={() => setAnnexe(false)} />}
    {limites && <Feuille titre="Limites de cette prévision" onClose={() => setLimites(false)}>
      <FinanceForecastSummary ledger={ledger} openingCashReady={p.openingCashReady} warnings={avec.warnings} undatedCount={avec.undated.length} undatedOutCents={avec.undatedOutCents} undatedInCents={avec.undatedInCents} aCompleter={aCompleter}
        onProfile={fermerPuis(p.onProfile)} onPayments={fermerPuis(p.onPayments)} /></Feuille>}
    {projets && <Feuille titre="Mes projets de matériel" onClose={() => setProjets(false)} haute><UpgradeWorkspace onOpenProject={pl => p.onOpenUpgrade(pl)} /></Feuille>}
    {ficheProjet && mesure && isUpgradePlan(ficheProjet) && <FicheProjet plan={ficheProjet} mesure={mesure} titreFin={titre} prix={prix} onPrix={s => { setPrix(s); StorageService.setUiState(CLE_PRIX, s); }}
      onClose={() => setFiche(null)} onOuvrir={() => { setFiche(null); p.onOpenUpgrade(ficheProjet); }} />}
    {ficheBrassin && itemsBrassin.length > 0 && <FicheBrassin titre={batch?.name ?? itemsBrassin[0].label.split(' · ')[0]} items={itemsBrassin} litre={litreBrassin == null ? null : litreFr(litreBrassin)} onClose={() => setFiche(null)}
      onOuvrir={() => { setFiche(null); if (batch) p.onOpenBudget(batch); }} />}
  </section>;
}
