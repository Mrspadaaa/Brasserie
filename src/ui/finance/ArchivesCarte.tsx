import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Undo2 } from 'lucide-react';
import type { FinanceTransaction, FinancialPayment, FinancialPlan } from '../../domain/finance/types';
import { isoDate } from '../../domain/finance/ledger';
import { upgradeDetails, upgradeProgress } from '../../domain/finance/upgrades';
import { carteArchives, formeCase, JOUR, montantDansCase, type CaseCarte } from '../../domain/finance/archivesCarte';

/* Atelier › Matériel › Archives et état vide : la maquette ka4 (la carte de l'argent mis de côté). Classes en `ak-`, jetons du thème (`kh-` posés par `.kh`). */
const chf0 = (cents: number) => new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 0 }).format(Math.round(cents / 100));
const moisCourt = (plan: FinancialPlan) => { const d = isoDate(plan.date); return d ? new Date(`${d}T12:00:00`).toLocaleDateString('fr-CH', { month: 'short', year: '2-digit' }) : ''; };
/** Où le projet s'est arrêté : l'étape qu'il avait atteinte (la donnée existe ; le motif de l'archivage, lui, n'est pas enregistré : jamais inventé). */
const ARRET = { idea: 'arrêté à l’idée', research: 'arrêté à l’étude', quote: 'arrêté au devis', ready: 'arrêté, prêt à acheter' } as const;
/** Les exemples du banc portent un identifiant DEMO- : l'écran le dit, comme Atelier › Tarifs (« exemples »). */
const estDemo = (plans: FinancialPlan[]) => plans.some(p => p.id.startsWith('DEMO-'));

export function useLargeur(initiale = 366) {
  const [largeur, setLargeur] = useState(initiale), racine = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = racine.current; if (!el || typeof ResizeObserver === 'undefined') return;
    const mesurer = () => { const w = Math.round(el.clientWidth); if (w >= 200) setLargeur(prev => Math.abs(prev - w) >= 1 ? w : prev); };
    mesurer(); const ro = new ResizeObserver(mesurer); ro.observe(el); return () => ro.disconnect();
  }, []);
  return { largeur, racine };
}

interface Props { plans: FinancialPlan[]; transactions: FinanceTransaction[]; payments: FinancialPayment[]; busy?: string; onOuvrir: (plan: FinancialPlan) => void; onReprendre: (plan: FinancialPlan) => void }

/** Archives : la carte en hachures (surface = prix prévu), l'acompte déjà payé en bande bleue au pied de sa case, « hors carte » sous elle, la légende, « Reprendre ». */
export function ArchivesCarte({ plans, transactions, payments, busy, onOuvrir, onReprendre }: Props) {
  const { largeur, racine } = useLargeur();
  const parId = useMemo(() => new Map(plans.map(p => [p.id, p])), [plans]);
  const avances = useMemo(() => new Map(plans.map(p => { const pr = upgradeProgress(p, transactions, payments); return [p.id, pr.invoiceCount > 0 && pr.paymentKnown ? pr.paidCents : null] as const; })), [plans, transactions, payments]);
  const carte = useMemo(() => carteArchives(plans.map(p => ({ id: p.id, cents: upgradeDetails(p).budgetKnown ? p.amountCents : null, payeCents: avances.get(p.id) })), largeur), [plans, avances, largeur]);
  const inconnus = carte.nbProjets - carte.nbPrix;
  const petites = carte.cases.filter(c => formeCase(c) === 'mini');
  /* Une seule case : son montant est déjà la somme ; l'écrire deux fois l'un sous l'autre dirait le même nombre deux fois. */
  const uneSeule = carte.cases.length === 1;
  return <section className="kh ak" aria-label="Projets archivés">
    <div className="ak-tot"><div className="ak-totl">
      {carte.nbPrix === 0 ? <b>Prix à estimer</b> : uneSeule ? <b>Mis de côté</b> : <b className="kh-m">{chf0(carte.totalCents)} CHF</b>}
      <small>{carte.nbPrix === 0 ? `mis de côté · ${carte.nbProjets} projet${carte.nbProjets > 1 ? 's' : ''} sans prix`
        : uneSeule ? (inconnus > 0 ? `1 prix connu sur ${carte.nbProjets}` : '')
        : <>{inconnus > 0 ? 'au moins · ' : ''}mis de côté · {carte.nbPrix} prix connu{carte.nbPrix > 1 ? 's' : ''}{inconnus > 0 ? ` sur ${carte.nbProjets}` : ''}</>}</small></div>
      {estDemo(plans) && <span className="ak-demo">démo</span>}</div>
    {carte.cases.length > 0 && <div className="ak-map" ref={racine} style={{ height: carte.hauteur }} role="group" aria-label="Chaque case est un projet archivé : sa surface suit son prix prévu">
      {carte.cases.map(c => <Case key={c.id} c={c} plan={parId.get(c.id)!} busy={!!busy} onOuvrir={onOuvrir} onReprendre={onReprendre}/>)}
    </div>}
    {carte.cases.length === 0 && <div ref={racine}/>}
    {petites.map(c => { const plan = parId.get(c.id)!, d = upgradeDetails(plan), mois = moisCourt(plan);
      return <div className="ak-nop ak-pm" key={c.id}>
        <i className="ak-sw ak-sw-h ak-pmsw" aria-hidden="true"/>
        <button type="button" className="ak-nopm" onClick={() => onOuvrir(plan)}><b>{plan.title}</b>
          <small>{ARRET[d.stage]}{mois ? ` · ${mois}` : ''}{d.purpose ? ` · ${d.purpose}` : ''}{montantDansCase(c) ? '' : ` · ${chf0(c.cents)} CHF`}</small></button>
        <button type="button" className="ak-repi" aria-label={`Reprendre ${plan.title}`} disabled={!!busy} onClick={() => onReprendre(plan)}><Undo2 size={20} aria-hidden="true"/></button>
      </div>; })}
    {carte.horsCarte.map(h => { const plan = parId.get(h.id)!, mois = moisCourt(plan);
      return <div className="ak-nop" key={h.id}>
        <span className="ak-q" aria-hidden="true">?</span>
        <button type="button" className="ak-nopm" onClick={() => onOuvrir(plan)}><b>{plan.title}</b><small>{h.prixNul ? 'prix à 0 : sans surface' : 'hors carte : prix à estimer'}{mois ? ` · ${mois}` : ''}</small></button>
        <button type="button" className="ak-repi" aria-label={`Reprendre ${plan.title}`} disabled={!!busy} onClick={() => onReprendre(plan)}><Undo2 size={20} aria-hidden="true"/></button>
      </div>; })}
    <div className="ak-leg">
      {carte.cases.length > 0 && <span className="ak-chip"><i className="ak-sw ak-sw-h"/>surface = prix prévu</span>}
      {carte.cases.some(c => c.payeCents != null) && <span className="ak-chip"><i className="ak-sw ak-sw-p"/>déjà payé</span>}
    </div>
  </section>;
}

function Case({ c, plan, busy, onOuvrir, onReprendre }: { c: CaseCarte; plan: FinancialPlan; busy: boolean; onOuvrir: (p: FinancialPlan) => void; onReprendre: (p: FinancialPlan) => void }) {
  const forme = formeCase(c), h = c.h - 2 * JOUR, w = c.w - 2 * JOUR, mois = moisCourt(plan), { stage, purpose } = upgradeDetails(plan), etat = ARRET[stage];
  const place = { left: c.x + JOUR, top: c.y + JOUR, width: w, height: h };
  const bande = c.payeCents != null && <span className="ak-paye" style={{ height: Math.max(3, c.partPayee * h) }} role="img" aria-label={`Déjà payé : ${chf0(c.payeCents)} sur ${chf0(c.cents)} CHF`}/>;
  /* Case trop petite pour un texte et un bouton de 44 px : le montant seul (maquette : « petites cases sans libellé, montant seul ») ; le projet, lui, se lit et se reprend dans la liste du dessous. */
  if (forme === 'mini') return <div className="ak-c ak-mi" style={place} role="img" aria-label={`${plan.title} : ${chf0(c.cents)} CHF`} onClick={() => onOuvrir(plan)}>
    {montantDansCase(c) && <span className="ak-a kh-m" aria-hidden="true">{chf0(c.cents)}</span>}{bande}</div>;
  const grande = forme === 'grande';
  /* La même information quelle que soit la taille : la raison (« malt acheté concassé ») est dans la ligne de la case basse comme dans la puce de la grande. Seule la grande dit aussi l'étape. */
  const quand = `${purpose ? `${purpose} · ` : ''}${etat}${mois ? ` · ${mois}` : ''}`;
  const ligne = forme === 'bande' && purpose ? `${mois ? `${mois} · ` : ''}${purpose}` : `${etat}${mois ? ` · ${mois}` : ''}${purpose ? ` · ${purpose}` : ''}`;
  return <div className={`ak-c ${grande ? 'ak-gr' : forme === 'etroite' ? 'ak-et' : 'ak-pt'}`} style={place}>
    <button type="button" className="ak-main" onClick={() => onOuvrir(plan)}>
      <span className="ak-n">{plan.title}</span>
      {grande ? <><span className="ak-a kh-m">{chf0(c.cents)}<small>CHF</small></span><span className="ak-tag">{quand}</span></>
        : <><span className="ak-s">{ligne}</span><span className="ak-a kh-m">{chf0(c.cents)}</span></>}
    </button>
    {bande}
    {c.payeCents != null && grande && <span className="ak-payel" style={{ bottom: Math.max(3, c.partPayee * h) }}><i aria-hidden="true">▮</i> {c.payeCents < c.cents ? 'acompte payé' : 'payé'} <b className="kh-m">{chf0(c.payeCents)}</b></span>}
    {grande
      ? <button type="button" className="ak-rep" aria-label={`Reprendre ${plan.title}`} disabled={busy} onClick={() => onReprendre(plan)}><Undo2 size={20} aria-hidden="true"/>Reprendre</button>
      : <button type="button" className="ak-repi" aria-label={`Reprendre ${plan.title}`} disabled={busy} onClick={() => onReprendre(plan)}><Undo2 size={20} aria-hidden="true"/></button>}
  </div>;
}

/** À venir sans projet : la carte en pointillés attend sa première case ; la légende dit les couleurs à venir ; le geste est celui de « + Besoin » (même `onAjouter`). */
export function CarteVide({ onAjouter }: { onAjouter: () => void }) {
  return <section className="kh ak" aria-label="Aucun besoin à venir">
    <div className="ak-frame" role="group" aria-label="Ta carte de l’argent, vide">
      <i className="ak-gh" style={{ left: '2.2%', top: '2.4%', width: '49.2%', height: '94.5%' }}/><i className="ak-gh" style={{ left: '53%', top: '2.4%', width: '44.3%', height: '39.4%' }}/>
      <i className="ak-gh" style={{ left: '53%', top: '43.6%', width: '21.9%', height: '53.3%' }}/><i className="ak-gh" style={{ left: '76.5%', top: '43.6%', width: '20.8%', height: '53.3%' }}/>
      <div className="ak-mid"><h3>Ta carte de l’argent</h3><p>Chaque besoin y prend la place de son prix.</p>
        <button type="button" onClick={onAjouter}><Plus size={20} aria-hidden="true"/>Premier besoin</button></div>
    </div>
    <div className="ak-leg">
      <span className="ak-chip"><i className="ak-sw ak-sw-pret"/>Prêt</span><span className="ak-chip"><i className="ak-sw ak-sw-devis"/>Devis</span><span className="ak-chip"><i className="ak-sw ak-sw-idee"/>Idée</span>
      <span className="ak-chip ak-chip-d">sans prix : hors carte</span>
    </div>
  </section>;
}
