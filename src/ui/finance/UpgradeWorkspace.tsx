import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Archive, Calendar, Check, ChevronDown, ChevronRight, Mail, PenLine, Phone, Plus, Receipt, Search, Tag, Users, Wrench, X } from 'lucide-react';
import type { FinanceTransaction, FinancialPayment, FinancialPlan } from '../../domain/finance/types';
import { isUpgradePlan, UPGRADE_STAGES, UPGRADE_TIMINGS, upgradeDetails, upgradeProgress, upgradeReadiness } from '../../domain/finance/upgrades';
import { formatCHF, isoDate, todayISO } from '../../domain/finance/ledger';
import { buildForecast, type FinanceForecast } from '../../domain/finance/forecast';
import { anneauDe, avecDevisDemande, avecPrix, dateFacture, estRealise, ETAPES_ANNEAU, parsePrix, type Anneau, type TonAnneau } from '../../domain/finance/upgradeRing';
import type { CreativeItem } from '../../types';
import { MOIS_BANDEAU, REPERES, echelleCaisse, effetProjet, estPose, moisDePlan, partsInconnues, prochainAchat, repereDe, suivants, titreCourt, type EffetProjet } from '../../domain/finance/upgradeForecast';
import { Sheet } from '../Sheet';
import { FinanceService } from '../../services/financeService';
import { StorageService } from '../../services/storage';
import { useStorageValue } from '../../hooks/useLiveData';
import { UpgradeSheet } from './UpgradeSheet';
import { ExpenseSheet } from './ExpenseSheet';
import { useMobileLayout } from '../useViewport';
import { ViewNavigation } from '../ViewNavigation';
import './finance.css';
import './upgrades.css';
import './upgrade-plan.css';

const read = () => ({ ...FinanceService.snapshot(), transactions: StorageService.getTransactions(), batches: StorageService.getBatches(), stocks: StorageService.getStocks(), contacts: StorageService.getCreativeItems().filter(i => i.type === 'prospect') });
export const upgradeDateLabel = (plan: FinancialPlan) => {
  const date = isoDate(plan.date);
  return date ? new Date(`${date}T12:00:00`).toLocaleDateString('fr-CH', { month: 'long', year: 'numeric', ...(upgradeDetails(plan).datePrecision === 'day' ? { day: 'numeric' } : {}) }) : 'Date à choisir';
};

/** CP-13 : un projet entre dans Finances › Prévisions seulement inclus (actif) ET daté et budgété ; le calcul (`forecast.ts`) écarte tout le reste, ici on le dit. */
export const dansLesPrevisions = (plan: FinancialPlan) => isUpgradePlan(plan) && plan.status === 'active' && upgradeReadiness(plan).length === 0;
/** Les projets à venir que les prévisions ne comptent pas, dans l'ordre de la liste « À venir » (échéance, date, nom). */
export function projetsPasComptes(plans: FinancialPlan[]): FinancialPlan[] {
  const ordre = Object.keys(UPGRADE_TIMINGS);
  return plans.filter(p => isUpgradePlan(p) && ['draft', 'active'].includes(p.status) && !dansLesPrevisions(p))
    .sort((a, b) => ordre.indexOf(upgradeDetails(a).timing) - ordre.indexOf(upgradeDetails(b).timing) || (a.date || '9999').localeCompare(b.date || '9999') || a.title.localeCompare(b.title, 'fr'));
}
const moisCourtDe = (plan: FinancialPlan) => { const date = isoDate(plan.date); return date ? new Date(`${date}T12:00:00`).toLocaleDateString('fr-CH', { month: 'short', year: 'numeric' }) : ''; };
const RENVOI_PREVISIONS = 'Datés et budgétés, ils entrent dans Finances › Prévisions';

/* ───── Atelier › Matériel › À venir : la maquette kh1r (carte du prochain achat, liste par horizon, bandeau « Caisse fin de mois », crayon, repères d'état) ───── */
const chf0 = (cents: number) => new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 0 }).format(Math.round(cents / 100));
const chf2 = (cents: number) => new Intl.NumberFormat('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
const nomMois = (mois: string, month: 'short' | 'long') => new Date(`${mois}-15T12:00:00`).toLocaleDateString('fr-CH', { month });

/** Anneau d'étape à trois tiers (kyh1) : un tiers par étape, Besoin · Prix ou devis · Réalisé. Les mesures sont celles de la maquette (32 px par ligne, 16 px à la légende). */
const GEOM = { 32: { r: 13, dash: '24.23 57.45', off: [18.92, -8.31, -35.54], epais: 3.5, fin: 2.5 }, 16: { r: 6, dash: '10.97 26.73', off: [8.62, -3.95, -16.52], epais: 3, fin: 2 } } as const;
const TONS: Record<TonAnneau, string> = { mut: 'var(--kh-mut)', att: 'var(--kh-att)', hop: 'var(--kh-hop)' };
const ICONES = { search: Search, mail: Mail, tag: Tag, check: Check } as const;
function AnneauSvg({ anneau, taille = 32, seul, titre = true }: { anneau: Anneau; taille?: 32 | 16; seul?: 0 | 1 | 2; titre?: boolean }) {
  const g = GEOM[taille], Icone = ICONES[anneau.icone], ton = TONS[anneau.ton];
  return <svg className="kh-ring" width={taille} height={taille} viewBox={taille === 32 ? '0 0 32 32' : '0 0 16 16'} {...(titre ? { role: 'img', 'aria-label': anneau.libelle } : { 'aria-hidden': true })}>
    {titre && <title>{anneau.libelle}</title>}
    {anneau.arcs.map((etat, i) => {
      const plein = seul != null ? seul === i : etat !== 'vide';
      return <circle key={i} cx={taille / 2} cy={taille / 2} r={g.r} fill="none" stroke={plein ? (seul != null ? TONS.hop : ton) : 'var(--kh-line2)'} strokeWidth={plein ? g.epais : g.fin}
        strokeDasharray={g.dash} strokeDashoffset={g.off[i]} {...(etat === 'cours' && seul == null ? { strokeLinecap: 'round' as const } : {})}/>;
    })}
    {taille === 32 && <Icone x={9} y={9} width={14} height={14} strokeWidth={2.4} color={ton}/>}
  </svg>;
}
/** La légende, une fois : les trois étapes, un tiers allumé chacune. */
function Legende() {
  const modele = anneauDe({ upgrade: { stage: 'idea' } } as FinancialPlan);
  return <div className="kh-key" aria-label="Les étapes d’un achat : un tiers par étape">
    {ETAPES_ANNEAU.map((nom, i) => <React.Fragment key={nom}><AnneauSvg anneau={modele} taille={16} seul={i as 0 | 1 | 2} titre={false}/><b>{nom}</b></React.Fragment>)}
  </div>;
}
/** La frise des trois étapes : Besoin fait, Prix ou devis (en cours ou fait), Réalisé (« une fois payé »). */
function Frise({ plan }: { plan: FinancialPlan }) {
  const prix = repereDe(plan) === 'prix';
  return <ol className="kh-fr" style={{ '--pc': prix ? '100%' : '50%' } as React.CSSProperties} aria-label="Étapes : Besoin, Prix ou devis, Réalisé">
    <li className="ok"><i><Check size={15} strokeWidth={2.4}/></i>Besoin</li>
    <li className={prix ? 'ok' : 'now'}><i>{prix ? <Check size={15} strokeWidth={2.4}/> : <Tag size={15} strokeWidth={2.2}/>}</i>Prix ou devis</li>
    <li className={prix ? 'now' : ''}><i>{prix && <Receipt size={15} strokeWidth={2.2}/>}</i>Réalisé{prix && <small>une fois payé</small>}</li>
  </ol>;
}
/** L'étape suivante d'un besoin, posée sous sa ligne : le prix trouvé (CHF TTC) ou un devis demandé à un contact du carnet. Rien n'est envoyé : l'app note la demande. */
function PanneauEtape({ plan, contacts, busy, onPrix, onDevis }: { plan: FinancialPlan; contacts: CreativeItem[]; busy: boolean; onPrix: (cents: number) => void; onDevis: (contact: string) => void }) {
  const [texte, setTexte] = useState(''), [choix, setChoix] = useState<string | null>(null), [tous, setTous] = useState(false);
  const r = repereDe(plan), cents = parsePrix(texte), proposes = tous ? contacts : contacts.slice(0, 2);
  return <div className="kh-pan" role="group" aria-label={`Étapes : ${plan.title}`}>
    <Frise plan={plan}/>
    {r !== 'prix' && <form className="kh-f" onSubmit={e => { e.preventDefault(); if (cents != null) onPrix(cents); }}>
      <label className="kh-in"><small>CHF</small><input type="text" inputMode="decimal" autoComplete="off" placeholder={r === 'devis' ? 'prix du devis' : 'prix trouvé'} aria-label={`Prix de ${plan.title}, CHF TTC`} value={texte} onChange={e => setTexte(e.target.value)}/></label>
      <button type="submit" className="kh-ok" aria-label="Enregistrer le prix" disabled={cents == null || busy}><Check size={20}/></button>
    </form>}
    {r === 'devis' && plan.vendor && <p className="kh-note">Devis demandé à {plan.vendor}.</p>}
    {r === 'chercher' && <>
      <div className="kh-dl">Ou un devis</div>
      {contacts.length === 0 ? <p className="kh-note">Aucun contact dans ton carnet : ajoute-en dans Atelier › Contacts.</p>
        : <div className="kh-ct">{proposes.map(c => <button type="button" key={c.id} aria-pressed={choix === c.title} className={choix === c.title ? 'on' : ''} onClick={() => setChoix(choix === c.title ? null : c.title)}>{c.contactPhone ? <Phone size={16}/> : <Mail size={16}/>}{c.title}</button>)}
          {contacts.length > 2 && !tous && <button type="button" className="more" aria-label="Choisir un autre contact" onClick={() => setTous(true)}><Users size={18}/></button>}</div>}
      {choix && <button type="button" className="kh-cta" disabled={busy} onClick={() => onDevis(choix)}><Mail size={18}/>Devis demandé à {choix}</button>}
    </>}
    {r === 'prix' && <p className="kh-note">Le besoin passe dans Réalisés quand la dépense est payée.</p>}
  </div>;
}
/** L'avis passager quand un besoin devient réalisé : il quitte « À venir », il est dans Réalisés. */
function Avis({ avis, onVoir, onFermer }: { avis: { titre: string; date: string | null }; onVoir: () => void; onFermer: () => void }) {
  const quand = avis.date ? new Date(`${avis.date}T12:00:00`).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' }) : '';
  return <div className="kh-toast" role="status">
    <AnneauSvg anneau={anneauDe({ upgrade: { stage: 'ready', budgetKnown: true } } as FinancialPlan, true)} taille={32} titre={false}/>
    <span className="kh-tt"><b>{avis.titre} · dans Réalisés</b><small>payé{quand ? ` · facture du ${quand}` : ''}</small></span>
    <button type="button" className="kh-voir" onClick={onVoir}>Voir</button>
  </div>;
}
function ChoixMois({ plan, mois, onChoisir }: { plan: FinancialPlan; mois: string[]; onChoisir: (mois: string | null) => void }) {
  const actuel = moisDePlan(plan);
  return <div className="kh-mo" role="group" aria-label={`Poser ${plan.title} sur un mois`}>
    <button type="button" className={actuel ? '' : 'on'} aria-pressed={!actuel} onClick={() => onChoisir(null)}>pas encore</button>
    {mois.map(m => <button type="button" key={m} className={actuel === m ? 'on' : ''} aria-pressed={actuel === m} onClick={() => onChoisir(m)}>{nomMois(m, 'short')}</button>)}
  </div>;
}
/** Ce que l'achat fait à la caisse de fin de mois : la barre entière est la caisse avant l'achat, la part pleine ce qu'il en prend. */
function EffetCaisse({ plan, effet }: { plan: FinancialPlan; effet: EffetProjet }) {
  if (effet.avecCents == null || effet.sansCents == null) return null;
  const avec = effet.avecCents, nom = titreCourt(plan.title), part = effet.sansCents > 0 ? Math.min(1, effet.marcheCents / effet.sansCents) : 1;
  const plus = effet.auPlus ? ' au plus' : '', moisTxt = nomMois(effet.mois, 'long');
  return <div className="kh-eff" role="img" aria-label={`Caisse fin ${moisTxt}${avec < 0 ? `, il manque${effet.auPlus ? ' au moins' : ''} ${chf0(-avec)}` : `, il reste${plus} ${chf0(avec)}`} ; part de l’achat : ${nom}`}>
    <span className="kh-eff-a">{avec < 0 ? <>Fin {moisTxt}, il manque{effet.auPlus ? ' au moins' : ''}<b className="kh-m">{chf0(-avec)}</b></> : <>Fin {moisTxt}, il reste{plus}<b className="kh-m">{chf0(avec)}</b></>}</span>
    <span className="kh-eff-b" style={{ flexBasis: `max(${Math.min(120, 16 + 7 * nom.length)}px, ${(part * 100).toFixed(1)}%)` }}>{nom}</span>
  </div>;
}
/** « Caisse fin de mois » : la courbe en marches de la prévision (mois courant et sept suivants), titres dans un couloir au-dessus ; sans solde de départ, le bandeau le dit. */
function Bandeau({ prevision, hero, effetHero, focus, effetFocus, onPrevisions }: { prevision: FinanceForecast; hero: FinancialPlan | null; effetHero: EffetProjet | null; focus: FinancialPlan | null; effetFocus: EffetProjet | null; onPrevisions: () => void }) {
  const mois = prevision.months.slice(0, MOIS_BANDEAU), vals = mois.map(m => m.balanceCents), connu = vals.every(v => v != null);
  const X0 = 34, X1 = 366, Y0 = 52, Y1 = 10, W = (X1 - X0) / Math.max(1, mois.length), f = (n: number) => +n.toFixed(2);
  const ech = echelleCaisse([...vals, prevision.openingCashCents]), y = (v: number) => Y0 - (v - ech.lo) / (ech.hi - ech.lo) * (Y0 - Y1), cx = (i: number) => X0 + W * (i + .5);
  const encre = 'rgb(var(--cave-texte-50))', mut = 'rgb(var(--cave-texte-400))', halo = { paintOrder: 'stroke', stroke: 'var(--kh-bg)', strokeWidth: 4, strokeLinejoin: 'round' } as React.CSSProperties;
  let ligne = '', aire = '';
  if (connu) {
    ligne = `M${X0} ${f(y(prevision.openingCashCents ?? vals[0]!))}`;
    vals.forEach((v, i) => { ligne += ` V${f(y(v!))} H${f(X0 + W * (i + 1))}`; });
    aire = `${ligne} V${Y0} H${X0} Z`;
  }
  const iH = effetHero ? mois.findIndex(m => m.month === effetHero.mois) : -1, iF = effetFocus && focus?.id !== hero?.id ? mois.findIndex(m => m.month === effetFocus.mois) : -1;
  const titreF = effetFocus && iF >= 0 && effetFocus.avecCents != null ? `${nomMois(effetFocus.mois, 'short')}${effetFocus.auPlus ? ' au plus' : ''} ${chf0(effetFocus.avecCents)}` : '';
  const finF = iF >= 0 && cx(iF) - 16 + titreF.length * 7 > X1;
  return <section className="kh-band" aria-label="Caisse fin de mois">
    <div className="kh-bh">Caisse fin de mois<button type="button" onClick={onPrevisions}>Prévisions<ChevronRight size={16}/></button></div>
    {!connu ? <p className="kh-vide">Solde de départ à renseigner dans Prévisions : sans lui, la caisse reste inconnue (pas de courbe, jamais 0).</p>
      : <svg viewBox="0 0 366 68" role="img" aria-label={`Caisse en fin de mois, de ${nomMois(mois[0].month, 'long')} à ${nomMois(mois[mois.length - 1].month, 'long')}`}>
        {iF >= 0 && <rect x={f(X0 + W * iF)} y={14} width={f(W)} height={38} style={{ fill: 'var(--kh-fin)', opacity: .12 }}/>}
        {[...ech.ticks].map(t => <g key={t}><line x1={X0} y1={f(y(t))} x2={X1} y2={f(y(t))} style={{ stroke: 'rgb(var(--cave-700))', opacity: t === 0 ? 1 : .55 }}/><text x={30} y={f(y(t)) + 4} fontSize={12} textAnchor="end" fill={mut}>{chf0(t)}</text></g>)}
        <path d={aire} style={{ fill: 'var(--kh-fin)', opacity: .1 }}/><path d={ligne} fill="none" strokeWidth={2.5} style={{ stroke: 'var(--kh-fin)' }}/>
        {prevision.openingCashCents != null && <circle cx={X0 + 2} cy={f(y(prevision.openingCashCents))} r={3.5} style={{ fill: 'var(--kh-fin)' }}/>}
        {iH >= 0 && effetHero?.avecCents != null && <><circle cx={f(cx(iH))} cy={f(y(effetHero.avecCents))} r={4.5} strokeWidth={1.5} style={{ fill: 'var(--kh-fin)', stroke: 'var(--kh-bg)' }}/>
          <text x={f(Math.min(342, Math.max(24, cx(iH))))} y={11} fontSize={12} fontWeight={700} textAnchor="middle" style={{ fill: 'var(--kh-fin-t)' }}>{titreCourt(hero!.title)}</text></>}
        {iF >= 0 && effetFocus?.avecCents != null && <><line x1={f(cx(iF))} y1={14} x2={f(cx(iF))} y2={Math.max(14, f(y(effetFocus.avecCents)) - 5)} strokeWidth={1.5} strokeDasharray="2 2" style={{ stroke: 'var(--kh-fin)' }}/>
          <circle cx={f(cx(iF))} cy={f(y(effetFocus.avecCents))} r={4.5} strokeWidth={1.5} style={{ fill: 'var(--kh-fin)', stroke: 'var(--kh-bg)' }}/>
          <text x={f(finF ? X1 : cx(iF) - 16)} y={11} fontSize={13} fontWeight={700} textAnchor={finF ? 'end' : 'start'} style={{ fill: 'var(--kh-fin-t)', ...halo }}>{titreF}</text></>}
        {mois.map((m, i) => <text key={m.month} x={f(cx(i))} y={66} fontSize={12} textAnchor="middle" fontWeight={i === iH ? 700 : 400} fill={i === iH ? encre : mut}>{nomMois(m.month, 'short')}</text>)}
      </svg>}
  </section>;
}
function FicheProjet({ plan, plans, prevision, transactions, payments, mois, busy, onClose, onEdit, onPoser, onInclusion, onStatut, onPrevisions }: { plan: FinancialPlan; plans: FinancialPlan[]; prevision: FinanceForecast; transactions: FinanceTransaction[]; payments: FinancialPayment[]; mois: string[]; busy?: string;
  onClose: () => void; onEdit: () => void; onPoser: (m: string | null) => void; onInclusion: (inc: boolean) => void; onStatut: (s: 'completed' | 'cancelled') => void; onPrevisions: () => void }) {
  const d = upgradeDetails(plan), pose = estPose(plan), effet = pose ? effetProjet(plan, plans, prevision.months, prevision.items) : null, progress = upgradeProgress(plan, transactions, payments);
  const lignes: Array<[string, number | undefined]> = [['Achat', d.purchaseCents], ['Livraison', d.deliveryCents], ['Installation', d.installationCents]], connus = lignes.filter(([, v]) => v != null);
  const etape = REPERES[repereDe(plan)];
  const mTxt = effet ? nomMois(effet.mois, 'long') : '', moisPose = moisDePlan(plan);
  return <Sheet open bare title={plan.title} onClose={onClose} className="kh-feuille">
    <div className="kh kh-sheet" style={{ overflowY: 'auto' }}>
      <div className="kh-sh"><h2>{plan.title}</h2><span className={`kh-tag ${repereDe(plan)}`}>{etape}</span><button type="button" className="kh-x" aria-label="Fermer" onClick={onClose}><X size={18}/></button></div>
      <Frise plan={plan}/>
      <div className="kh-lbl">Coût prévu, CHF TTC</div>
      <div className="kh-cost">{lignes.map(([nom, v]) => <React.Fragment key={nom}><span>{nom}</span>{v != null ? <span className="v kh-m">{chf2(v)}</span> : <span className="kh-u" style={{ justifySelf: 'end' }}>à estimer</span>}</React.Fragment>)}
        {connus.length === 0 ? <><span className="t">Aucun prix</span><span className="v t">à estimer</span></>
          : connus.length === 3 ? <><span className="t">Total</span><span className="v t kh-m">{chf2(plan.amountCents)}</span></>
          : <><span className="t">Au moins <small>· {connus.length} prix sur 3</small></span><span className="v t">{connus.length === 1 && d.purchaseCents != null ? 'l’achat seul' : 'les prix connus'}</span></>}</div>
      <div className="kh-lbl">Posé sur</div>
      {d.budgetKnown ? <ChoixMois plan={plan} mois={mois} onChoisir={onPoser}/> : <p className="finance-muted">Sans prix, rien à poser : chiffre le projet avec Modifier.</p>}
      <button type="button" role="switch" aria-checked={plan.status === 'active'} className="kh-sw" disabled={!!busy} onClick={() => onInclusion(plan.status !== 'active')}><i/>Dans mes prévisions</button>
      {effet && effet.avecCents != null && effet.sansCents != null
        ? <><div className="kh-lbl">Fin {mTxt}</div><div className="kh-vs"><button type="button" className="w" onClick={onPrevisions}><small>Avec {titreCourt(plan.title)}{effet.auPlus ? ', au plus' : ''}</small><b className="kh-m">{chf0(effet.avecCents)}</b></button><div className="wo"><small>Sans</small><b className="kh-m">{chf0(effet.sansCents)}</b></div></div></>
        : !d.budgetKnown ? null
        : <p className="finance-muted" style={{ marginTop: 8 }}>{pose ? 'Caisse inconnue : renseigne ton solde de départ dans Prévisions.'
          : moisPose ? `Posé sur ${nomMois(moisPose, 'long')}, mais hors de tes prévisions : allume l’interrupteur pour le compter.`
          : 'Pas dans tes prévisions : pose-le sur un mois pour voir ce qu’il fait à la caisse.'}</p>}
      <div className="kh-lbl">Achats liés <b>{progress.invoiceCount ? `${progress.invoiceCount} · ${progress.invoicedComplete ? chf0(progress.invoicedCents) : 'à répartir'}` : 'aucun'}</b></div>
      <button type="button" className="kh-cta kh-cta-fiche" onClick={onEdit}><PenLine size={18}/>Modifier</button>
      <details className="kh-fold"><summary>Après l’achat<ChevronDown size={18}/></summary><p>Ta facture se range dans Dépenses › Matériel, liée à ce projet ; la fiche d’usure se lit dans Annuel.</p></details>
      <details className="kh-fold"><summary>Usure et mise en service<ChevronDown size={18}/></summary><p>Durée d’usage : {d.usefulLifeYears != null ? `${String(d.usefulLifeYears).replace('.', ',')} ans` : 'à renseigner'} · Mise en service : {d.inServiceMonth ?? 'à renseigner'}</p></details>
      <div className="kh-ends"><button type="button" style={{ color: 'var(--kh-hop)', fontWeight: 600 }} disabled={!!busy} onClick={() => onStatut('completed')}><Check size={18}/>Marquer comme réalisé</button><button type="button" style={{ color: 'var(--kh-mut)' }} disabled={!!busy} onClick={() => onStatut('cancelled')}><Archive size={18}/>Archiver</button></div>
    </div>
  </Sheet>;
}
interface AVenirProps { plans: FinancialPlan[]; transactions: FinanceTransaction[]; payments: FinancialPayment[]; prevision: FinanceForecast; busy?: string; onEdit: (p: FinancialPlan) => void; onPoser: (p: FinancialPlan, m: string | null) => Promise<boolean>;
  onInclusion: (p: FinancialPlan, inc: boolean) => void; onStatut: (p: FinancialPlan, s: 'completed' | 'cancelled') => Promise<boolean>; onPrevisions: () => void;
  contacts: CreativeItem[]; onPrix: (p: FinancialPlan, cents: number) => Promise<boolean>; onDevis: (p: FinancialPlan, contact: string) => Promise<boolean>;
  avis: { titre: string; date: string | null } | null; onVoirRealises: () => void; onFermerAvis: () => void }
function AVenir({ plans, transactions, payments, prevision, busy, onEdit, onPoser, onInclusion, onStatut, onPrevisions, contacts, onPrix, onDevis, avis, onVoirRealises, onFermerAvis }: AVenirProps) {
  const [picker, setPicker] = useState<string | null>(null), [fiche, setFiche] = useState<string | null>(null), [marque, setMarque] = useState<string | null>(null), [etape, setEtape] = useState<string | null>(null);
  const hero = prochainAchat(plans), { lignes, connuCents, inconnus } = suivants(plans, hero), mois = prevision.months.slice(1, MOIS_BANDEAU).map(m => m.month);
  const effetHero = hero ? effetProjet(hero, plans, prevision.months, prevision.items) : null;
  const focus = plans.find(p => p.id === marque) ?? null, effetFocus = focus && estPose(focus) ? effetProjet(focus, plans, prevision.months, prevision.items) : null;
  const poser = async (plan: FinancialPlan, m: string | null) => { setPicker(null); if (await onPoser(plan, m)) setMarque(m ? plan.id : null); };
  const dansFiche = plans.find(p => p.id === fiche);
  return <div className="kh">
    {hero && <section className="kh-hero" aria-label="Prochain achat">
      <div className="kh-ht"><span className="kh-kick">Prochain achat</span><span className="kh-pill">D’abord · {upgradeDetails(hero).estimateSource === 'quote' ? 'devis reçu' : 'estimation'}</span></div>
      <div className="kh-hm"><h2><button type="button" className="kh-hbtn" onClick={() => setFiche(hero.id)}>{hero.title}</button></h2><b className="kh-big kh-m">{chf0(hero.amountCents)}</b><small>{partsInconnues(hero) ? 'au moins · ' : ''}CHF TTC</small></div>
      {effetHero && <EffetCaisse plan={hero} effet={effetHero}/>}
      <div className="kh-acts"><button type="button" className="kh-mon" aria-expanded={picker === hero.id} aria-label={`Mois de ${hero.title} : ${moisDePlan(hero) ? nomMois(moisDePlan(hero)!, 'long') : 'à poser'}`} onClick={() => setPicker(picker === hero.id ? null : hero.id)}><Calendar size={18}/>{moisDePlan(hero) ? nomMois(moisDePlan(hero)!, 'short') : '+ mois'}<ChevronDown size={14}/></button>
        <button type="button" className="kh-cta" aria-label={`Modifier ${hero.title}`} onClick={() => onEdit(hero)}><PenLine size={18}/>Modifier</button></div>
      {picker === hero.id && <ChoixMois plan={hero} mois={mois} onChoisir={m => void poser(hero, m)}/>}
    </section>}
    {lignes.length > 0 && <>
      <div className="kh-lt">{hero ? 'Les suivants' : 'Mes achats'}<span>{lignes.length} achat{lignes.length > 1 ? 's' : ''} · {connuCents > 0 ? <>{inconnus ? 'au moins ' : ''}<b className="kh-m">{chf0(connuCents)}</b></> : 'prix à estimer'}</span></div>
      <Legende/>
      {Object.entries(UPGRADE_TIMINGS).map(([timing, label]) => {
        const rows = lignes.filter(p => upgradeDetails(p).timing === timing);
        return rows.length ? <section key={timing}><div className="kh-it">{label}</div>{rows.map(plan => {
          const d = upgradeDetails(plan), m = moisDePlan(plan);
          const pose = estPose(plan);
          const anneau = anneauDe(plan), ouvert = etape === plan.id;
          return <React.Fragment key={plan.id}><div className={`kh-r${(marque === plan.id && pose) || ouvert ? ' kh-on' : ''}`}>
            {d.budgetKnown ? <button type="button" className={`kh-chip ${m && estPose(plan) ? 'on' : 'off'}`} aria-expanded={picker === plan.id} aria-label={m ? `Mois de ${plan.title} : ${nomMois(m, 'long')}` : `Poser ${plan.title} sur un mois`} onClick={() => { setEtape(null); setPicker(picker === plan.id ? null : plan.id); }}>{m ? nomMois(m, 'short') : '+ mois'}</button>
              : <span className="kh-chip no" aria-label="Sans prix, rien à poser">–</span>}
            <button type="button" className="kh-rb" aria-expanded={ouvert} aria-label={`${anneau.libelle} : ${plan.title}`} onClick={() => { setPicker(null); setEtape(ouvert ? null : plan.id); }}><AnneauSvg anneau={anneau} titre={false}/></button>
            <button type="button" className="kh-rmain" onClick={() => setFiche(plan.id)}><span className="kh-nm"><b>{plan.title}</b>{repereDe(plan) === 'devis' && plan.vendor && <small>{plan.vendor}</small>}</span>{d.budgetKnown && <span className="kh-a kh-m">{chf0(plan.amountCents)}</span>}</button>
            {d.budgetKnown ? <button type="button" className="kh-ed" aria-label={`Modifier ${plan.title}`} onClick={() => onEdit(plan)}><PenLine size={18}/></button>
              : <button type="button" className="kh-u" aria-label={`Noter le prix : ${plan.title}`} onClick={() => { setPicker(null); setEtape(ouvert ? null : plan.id); }}><span>à estimer</span></button>}
          </div>{picker === plan.id && <ChoixMois plan={plan} mois={mois} onChoisir={v => void poser(plan, v)}/>}
          {ouvert && <PanneauEtape plan={plan} contacts={contacts} busy={!!busy} onPrix={c => void onPrix(plan, c).then(ok => { if (ok) setEtape(null); })} onDevis={n => void onDevis(plan, n).then(ok => { if (ok) setEtape(null); })}/>}</React.Fragment>;
        })}</section> : null;
      })}</>}
    {avis && <Avis avis={avis} onVoir={onVoirRealises} onFermer={onFermerAvis}/>}
    <Bandeau prevision={prevision} hero={hero} effetHero={effetHero} focus={focus} effetFocus={effetFocus} onPrevisions={onPrevisions}/>
    {dansFiche && <FicheProjet plan={dansFiche} plans={plans} prevision={prevision} transactions={transactions} payments={payments} mois={mois} busy={busy} onClose={() => setFiche(null)}
      onEdit={() => { setFiche(null); onEdit(dansFiche); }} onPoser={m => void poser(dansFiche, m)} onInclusion={inc => onInclusion(dansFiche, inc)} onStatut={s => void onStatut(dansFiche, s).then(ok => { if (ok) setFiche(null); })} onPrevisions={() => { setFiche(null); onPrevisions(); }}/>}
  </div>;
}

export function UpgradeWorkspace({ onOpenProject, createRequest, onCreateRequestHandled, onVoirPrevisions }: { onOpenProject?: (plan: FinancialPlan | null) => void; createRequest?: { kind: string; at: number } | null; onCreateRequestHandled?: () => void;
  /** Ouverte depuis Finances › Prévisions, le renvoi referme simplement cette feuille ; absent, il demande à l'app d'ouvrir Finances › Prévisions (`affinee:ouvrir-finances`). */ onVoirPrevisions?: () => void }) {
  const mobile = useMobileLayout();
  const data = useStorageValue(read);
  const [scope, setScope] = useState('future');
  const [editing, setEditing] = useState<FinancialPlan | null | undefined>();
  const [purchase, setPurchase] = useState<FinancialPlan>();
  const [busy, setBusy] = useState<string>(), [error, setError] = useState(''), [ailleurs, setAilleurs] = useState('');
  // CP-13 : sur le modèle de `affinee:ouvrir-reglages` — l'événement annulable est pris par App ; sans écouteur, la ligne dit où aller.
  const voirPrevisions = () => {
    if (onVoirPrevisions) { onVoirPrevisions(); return; }
    const pris = !window.dispatchEvent(new CustomEvent('affinee:ouvrir-finances', { cancelable: true, detail: { onglet: 'previsions' } }));
    setAilleurs(pris ? '' : 'Ouvre Finances › Prévisions : les projets datés et budgétés y sont comptés.');
  };
  const open = (plan: FinancialPlan | null) => onOpenProject ? onOpenProject(plan) : setEditing(plan);
  const handled = React.useRef<number>(undefined);
  React.useEffect(() => { if (createRequest?.kind === 'newIdea' && createRequest.at !== handled.current) { handled.current = createRequest.at; open(null); onCreateRequestHandled?.(); } }, [createRequest?.at]);
  const projects = data.plans.filter(isUpgradePlan);
  /** Réalisé = une dépense liée au projet, payée en entier (dérivé des factures, rien n'est stocké) : le besoin quitte « À venir » et se range dans Réalisés. */
  const realises = useMemo(() => new Set<string>(projects.filter(p => ['draft', 'active'].includes(p.status) && estRealise(p, data.transactions, data.payments)).map(p => p.id)), [data]);
  const aVenir = useMemo(() => projects.filter(p => !realises.has(p.id)), [data, realises]);
  const [avis, setAvis] = useState<{ titre: string; date: string | null } | null>(null);
  const dejaRealises = useRef<Set<string> | null>(null);
  useEffect(() => {
    const avant = dejaRealises.current; dejaRealises.current = realises;
    const nouveau = avant ? projects.find(p => realises.has(p.id) && !avant.has(p.id)) : undefined;
    if (nouveau) setAvis({ titre: nouveau.title, date: dateFacture(nouveau, data.transactions) });
  }, [realises]);
  useEffect(() => { if (!avis) return; const t = setTimeout(() => setAvis(null), 8000); return () => clearTimeout(t); }, [avis]);
  const enregistrer = async (plan: FinancialPlan, suite: FinancialPlan): Promise<boolean> => {
    if (busy) return false;
    setBusy(plan.id); setError('');
    try { await FinanceService.saveUpgrade(suite); return true; }
    catch (e) { setError(e instanceof Error ? e.message : 'Le projet n’a pas pu être mis à jour.'); return false; }
    finally { setBusy(undefined); }
  };
  /** La vue kh1r est celle de l'Atelier ; ouverte depuis Finances › Prévisions (feuille « Mes projets de matériel », `onOpenProject`), la liste compacte d'avant reste. */
  const compact = !!onOpenProject || !!onVoirPrevisions, vueAVenir = !compact && scope === 'future';
  const prevision = useMemo(() => vueAVenir ? buildForecast({ transactions: data.transactions, payments: data.payments, plans: data.plans, profile: data.profile, asOf: todayISO(), months: 13, batches: data.batches,
    stockItems: [...data.stocks.rawMaterials, ...data.stocks.cleaning], assets: data.assets }) : null, [vueAVenir, data]);
  /** Poser un projet sur un mois (ou « pas encore ») : le mois s'enregistre, un projet chiffré entre dans les prévisions, retiré du mois il en sort. */
  const poser = async (plan: FinancialPlan, mois: string | null): Promise<boolean> => {
    if (busy) return false;
    const detail = upgradeDetails(plan), status = mois ? (detail.budgetKnown ? 'active' : plan.status) : plan.status === 'active' ? 'draft' : plan.status;
    setBusy(plan.id); setError('');
    try { await FinanceService.saveUpgrade({ ...plan, date: mois ? `${mois}-01` : '', status, upgrade: { ...detail, datePrecision: 'month' } }); return true; }
    catch (e) { setError(e instanceof Error ? e.message : 'Le projet n’a pas pu être mis à jour.'); return false; }
    finally { setBusy(undefined); }
  };
  const changerStatut = async (plan: FinancialPlan, status: 'completed' | 'cancelled'): Promise<boolean> => {
    if (busy) return false;
    setBusy(plan.id); setError('');
    try { await FinanceService.saveUpgrade({ ...plan, status }); return true; }
    catch (e) { setError(e instanceof Error ? e.message : 'Le projet n’a pas pu être mis à jour.'); return false; }
    finally { setBusy(undefined); }
  };
  const visible = projects.filter(p => scope === 'future' ? ['draft', 'active'].includes(p.status) && !realises.has(p.id) : scope === 'completed' ? p.status === 'completed' || realises.has(p.id) : p.status === 'cancelled');
  const changeInclusion = async (plan: FinancialPlan, include: boolean) => {
    if (busy) return;
    if (include && upgradeReadiness(plan).length) { open(plan); return; }
    setBusy(plan.id); setError('');
    try { await FinanceService.saveUpgrade({ ...plan, status: include ? 'active' : 'draft' }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Le projet n’a pas pu être mis à jour.'); }
    finally { setBusy(undefined); }
  };
  const renderProject = (plan: FinancialPlan) => {
    const detail = upgradeDetails(plan), progress = upgradeProgress(plan, data.transactions, data.payments), missing = upgradeReadiness(plan);
    return <article className="upgrade-item" key={plan.id}>
      <button className="upgrade-project" onClick={() => open(plan)}>
        <span className="finance-row-main"><strong>{plan.title}</strong><span className="finance-muted">{upgradeDateLabel(plan)}{scope === 'future' ? ` · ${UPGRADE_STAGES[detail.stage]}` : ''}{scope === 'future' && <>{' · '}{dansLesPrevisions(plan)
          ? <span className="upgrade-prev upgrade-prev-oui">dans les prévisions · {moisCourtDe(plan)}</span>
          : <span className="upgrade-prev">pas dans les prévisions</span>}</>}</span>{!mobile && detail.purpose && <span className="upgrade-purpose">{detail.purpose}</span>}</span>
        <span className="upgrade-price">{detail.budgetKnown ? formatCHF(plan.amountCents) : 'À estimer'}<ChevronRight size={16}/></span>
      </button>
      {progress.invoiceCount > 0 && <p className="finance-muted upgrade-actual">Achats liés : {progress.invoicedComplete?formatCHF(progress.invoicedCents):'À répartir'}{detail.budgetKnown ? ` sur ${formatCHF(plan.amountCents)} prévus` : ''}</p>}
      {scope === 'future' && <div className="upgrade-project-actions">
        {missing.length && plan.status !== 'active' ? <button className="finance-link" onClick={() => open(plan)}>Budget ou date à compléter<ChevronRight size={16}/></button> : <label className="finance-check"><input type="checkbox" aria-label={`Inclure ${plan.title} dans les prévisions`} checked={plan.status === 'active'} disabled={!!busy} onChange={e => void changeInclusion(plan, e.target.checked)}/>Inclure dans mes prévisions{/* TE-36 : un seul libellé pour la case, cochée ou non (comme la feuille du projet) */}</label>}
        <button className="finance-link" onClick={() => setPurchase(plan)}>Noter l’achat<ArrowRight size={16}/></button>
      </div>}
    </article>;
  };
  return <div className="finance upgrade-workspace">
    {!mobile && <>
    <p className="finance-muted">Priorise tes équipements et choisis les achats à inclure dans tes prévisions.</p>
    <div className="upgrade-toolbar"><button className="finance-action" onClick={() => open(null)}><Plus size={18}/>Ajouter un projet</button></div>
    </>}
    <div className="flex items-center gap-2"><div className={`min-w-0 flex-1${compact ? '' : ' kh-tabs'}`}>
      <ViewNavigation label="Afficher les projets" value={scope} onChange={setScope} options={[{value:'future',label:'À venir'},{value:'completed',label:'Réalisés'},{value:'archived',label:'Archives'}]}>
        <div className="finance-filter upgrade-scopes" role="group" aria-label="Afficher les projets"><button aria-pressed={scope === 'future'} onClick={() => setScope('future')}>À venir</button><button aria-pressed={scope === 'completed'} onClick={() => setScope('completed')}>Réalisés</button><button aria-pressed={scope === 'archived'} onClick={() => setScope('archived')}>Archives</button></div>
      </ViewNavigation>
    </div>{mobile && <button type="button" aria-label="Ajouter un projet" onClick={()=>open(null)} className="touch-target rounded-control bg-ebc-straw text-cave-950"><Plus size={21}/></button>}</div>
    {error && <p className="finance-error" role="alert">{error}</p>}
    {compact && scope === 'future' && visible.length > 0 && <button type="button" className="finance-link upgrade-renvoi" onClick={voirPrevisions}>{RENVOI_PREVISIONS}<ChevronRight size={16}/></button>}
    {ailleurs && <p className="finance-muted" role="status">{ailleurs}</p>}
    {prevision && visible.length > 0 ? <AVenir plans={aVenir} transactions={data.transactions} payments={data.payments} prevision={prevision} busy={busy} onEdit={open} onPoser={poser} onInclusion={(p, inc) => void changeInclusion(p, inc)} onStatut={changerStatut} onPrevisions={voirPrevisions}
      contacts={data.contacts} onPrix={(p, cents) => enregistrer(p, avecPrix(p, cents))} onDevis={(p, contact) => enregistrer(p, avecDevisDemande(p, contact))}
      avis={avis} onVoirRealises={() => { setAvis(null); setScope('completed'); }} onFermerAvis={() => setAvis(null)}/>
    : vueAVenir ? null : scope === 'future' ? Object.entries(UPGRADE_TIMINGS).map(([timing, label]) => {
      const rows = visible.filter(p => upgradeDetails(p).timing === timing).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.title.localeCompare(b.title, 'fr'));
      return rows.length ? <section className="upgrade-stage" key={timing}><h3>{label}</h3>{rows.map(renderProject)}</section> : null;
    }) : visible.map(renderProject)}
    {!visible.length && <div className="finance-empty"><Wrench className="mx-auto"/><h3>{scope === 'future' ? 'Quel matériel te manque ?' : scope === 'completed' ? 'Tes projets réalisés' : 'Tes projets mis de côté'}</h3><p>{scope === 'future' ? 'Commence par le besoin. Le prix et la date pourront venir ensuite.' : scope === 'completed' ? 'Marque un projet comme réalisé pour le retrouver ici avec ses achats.' : 'Un projet archivé se retrouve ici et peut être repris.'}</p></div>}
    {editing !== undefined && <UpgradeSheet plan={editing ?? undefined} onClose={() => setEditing(undefined)}/>}
    {purchase && <ExpenseSheet initialIntent="equipment" initialPlanId={purchase.id} onSaved={() => {}} onClose={() => setPurchase(undefined)}/>}
  </div>;
}

export function UpgradeAnalytics({ plans, transactions, payments, onOpen, onBrowse }: { plans: FinancialPlan[]; transactions: FinanceTransaction[]; payments: FinancialPayment[]; onOpen: (plan: FinancialPlan) => void; onBrowse: () => void }) {
  const projects = plans.filter(isUpgradePlan);
  if (!projects.length) return null;
  const selected = projects.filter(p => p.status === 'active'), retained = selected.reduce((sum, p) => sum + p.amountCents, 0);
  const undecided = projects.filter(p => p.status === 'draft');
  const timingOrder = Object.keys(UPGRADE_TIMINGS);
  const comparisons = [...projects].sort((a,b) => Number(b.status==='active')-Number(a.status==='active') || timingOrder.indexOf(upgradeDetails(a).timing)-timingOrder.indexOf(upgradeDetails(b).timing) || (a.date||'9999').localeCompare(b.date||'9999'))
    .map(plan => ({ plan, progress: upgradeProgress(plan, transactions, payments) })).filter(row => row.plan.status === 'active' || row.progress.invoiceCount > 0).slice(0, 4);
  return <section className="finance-section upgrade-analytics">
    <div className="finance-heading"><h3>Évolution de la brasserie</h3></div>
    <div className="upgrade-budget"><span>Budgets retenus · tous horizons</span><strong className="finance-money">{formatCHF(retained)}</strong></div>
    <p className="finance-muted mt-2">{selected.length} projet{selected.length>1?'s':''} dans les prévisions · {undecided.length} idée{undecided.length>1?'s':''} gardée{undecided.length>1?'s':''} pour plus tard.</p>
    {comparisons.length > 0 && <div className="finance-list mt-3">{comparisons.map(({ plan, progress }) => <button className="finance-row" key={plan.id} onClick={() => onOpen(plan)}><span className="finance-row-main"><strong>{plan.title}</strong><span className="finance-muted">Depuis le début du projet · {progress.invoiceCount} facture{progress.invoiceCount>1?'s':''}</span></span><span className="finance-row-tail"><span className="finance-money">{progress.invoicedComplete?formatCHF(progress.invoicedCents):'À répartir'}</span><br/><span className="finance-muted">{upgradeDetails(plan).budgetKnown ? `sur ${formatCHF(plan.amountCents)} prévus` : 'Budget à estimer'}</span></span><ChevronRight size={16}/></button>)}</div>}
    <p className="finance-muted mt-2">Les budgets sont des intentions. Seules les factures entrent dans tes dépenses et ton dossier annuel.</p>
    <button className="finance-link" onClick={onBrowse}>Voir tous mes projets<ChevronRight size={16}/></button>
  </section>;
}
