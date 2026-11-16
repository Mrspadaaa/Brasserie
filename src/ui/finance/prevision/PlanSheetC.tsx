import React, { useId, useMemo, useState } from 'react';
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { Textarea } from '../../Input';
import { ChampNombre } from '../../depense/ChampNombre';
import { BORNES_FINANCE } from '../../../domain/finance/bornesFinance';
import type { FinanceCategory } from '../../../types';
import type { FinancialPlan } from '../../../domain/finance/types';
import { buildForecast, planOccurrences, type ForecastItem } from '../../../domain/finance/forecast';
import { isoDate, summarizeLedger, todayISO } from '../../../domain/finance/ledger';
import { FinanceService } from '../../../services/financeService';
import { StorageService } from '../../../services/storage';
import { useStorageValue } from '../../../hooks/useLiveData';
import { construireEscalier, dernierJourInclus, graduations, regrouperTendance, titreHorizon, type Escalier } from '../previsions/escalier';
import { jourCourt, montant, montantCourt, montantEntier, moisCourt } from '../previsions/format';
import { CATEGORY_LABELS, FormSheet, idFor } from './base';
import { supprimerPlan } from './supprimerPlan';
import './prevision.css';

/**
 * Ajouter une prévision = m3pr-c (choix du 15.11) : une ligne de champs, trois pastilles, puis le panneau gris où la répétition se lit sur une frise
 * (ronds pleins dans les 90 jours, ronds vides au-delà) et où l'effet sur la fin de l'horizon se lit sur les marches de Prévisions, avant en gris, après en trait noir.
 * Le calcul n'est pas une copie : c'est `buildForecast` (d2, d3), `construireEscalier` et `regrouperTendance` de Prévisions, appelés avec et sans cette prévision.
 * Jamais 0 pour un inconnu : sans montant valide, l'effet reste « — » ; sans solde de départ confirmé, c'est l'écart depuis aujourd'hui qui est dit comme tel.
 */
const lire = () => ({ transactions: StorageService.getTransactions(), payments: FinanceService.getPayments(), plans: FinanceService.getPlans(), profile: FinanceService.getProfile(),
  assets: FinanceService.getAssets(), batches: StorageService.getBatches(), stocks: StorageService.getStocks() });
const FREQUENCES = [['none', 'Une fois'], ['monthly', 'Chaque mois'], ['quarterly', 'Trimestre'], ['yearly', 'Année']] as const;
const HORIZON = 90;
const jourMois = (iso: string) => `${Number(iso.slice(8, 10))}.${iso.slice(5, 7)}`;
const jourLong = (iso: string) => `${Number(iso.slice(8, 10))} ${moisCourt(iso)}`;
const jours = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
const premierDuMoisSuivant = (iso: string, n: number) => new Date(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1 + n, 1)).toISOString().slice(0, 10);
const valeurDe = (e: Escalier, m: Escalier['marches'][number]) => (e.departCents === null ? m.ecartCents : m.soldeApresCents!);

export interface EffetPrevision { avant: Escalier; apres: Escalier; fin: string; occurrences: ForecastItem[] }
/** L'effet de la prévision sur l'horizon de 90 jours : la même chaîne que Prévisions, une fois sans la prévision, une fois avec. */
export function effetDeLaPrevision(brouillon: FinancialPlan, asOf: string, donnees: ReturnType<typeof lire>): EffetPrevision {
  const fin = dernierJourInclus(asOf, HORIZON), stockItems = [...donnees.stocks.rawMaterials, ...donnees.stocks.cleaning];
  const ledger = summarizeLedger(donnees.transactions, donnees.payments, donnees.profile, undefined, { includeScheduled: true });
  const depart = ledger.cashComplete ? ledger.cashCents ?? null : null;
  const autres = donnees.plans.filter(p => p.id !== brouillon.id);
  const calculer = (plans: FinancialPlan[]) => {
    const f = buildForecast({ transactions: donnees.transactions, payments: donnees.payments, plans, profile: donnees.profile, asOf, months: 13, batches: donnees.batches, stockItems, assets: donnees.assets });
    const items = regrouperTendance(f.items.filter(i => i.date <= fin && i.amountCents > 0));
    return { escalier: construireEscalier({ departCents: depart, items, debut: asOf, fin }), items };
  };
  const sans = calculer(autres), avec = calculer([...autres, brouillon]);
  return { avant: sans.escalier, apres: avec.escalier, fin, occurrences: avec.items.filter(i => i.planId === brouillon.id) };
}

function Pastille({ texte, icone, children, className = '' }: { texte: string; icone?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <label className={`pvc-pill ${className}`.trim()}>{icone}<span>{texte}</span><ChevronDown size={14} aria-hidden="true" />{children}</label>;
}

function Frise({ asOf, fin, dates }: { asOf: string; fin: string; dates: string[] }) {
  const fenetre = premierDuMoisSuivant(asOf, 5), total = Math.max(1, jours(asOf, fenetre)), x = (iso: string) => 6 + (jours(asOf, iso) / total) * 334;
  const mois: string[] = [];
  for (let n = 1; n <= 4; n++) mois.push(premierDuMoisSuivant(asOf, n));
  const xFin = x(fin) + (334 / total);
  return <svg className="pvc-g" viewBox="0 0 346 56" role="img" aria-label={dates.length ? `Échéances : ${dates.map(jourMois).join(', ')}` : 'Aucune échéance dans les cinq mois'} data-booster="frise-repetition">
    <rect x={xFin} y={0} width={Math.max(0, 340 - xFin)} height={56} rx={6} className="pvc-zone" /><text x={xFin + 4} y={12} className="pvc-hz">après les {HORIZON} jours</text>
    <line x1={6} y1={34} x2={340} y2={34} className="pvc-ax" /><line x1={6} y1={30} x2={6} y2={38} className="pvc-ax" /><text x={9} y={52} className="pvc-mo">{moisCourt(asOf)}</text>
    {mois.map(m => <React.Fragment key={m}><line x1={x(m)} y1={30} x2={x(m)} y2={38} className="pvc-ax" /><text x={x(m) + 3} y={52} className="pvc-mo">{moisCourt(m)}</text></React.Fragment>)}
    {dates.map(d => d <= fin
      ? <React.Fragment key={d}><circle cx={x(d)} cy={34} r={6} className="pvc-oc" /><text x={x(d)} y={22} textAnchor="middle" className="pvc-ol">{jourMois(d)}</text></React.Fragment>
      : <circle key={d} cx={x(d)} cy={34} r={5} className="pvc-oc pvc-oh" />)}
    <line x1={6} y1={26} x2={6} y2={42} className="pvc-auj" />
  </svg>;
}

function Marches({ effet, planId, asOf, signe }: { effet: EffetPrevision; planId: string; asOf: string; signe: boolean }) {
  const { avant, apres, fin } = effet, id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const valeurs = [avant, apres].flatMap(e => [e.min, e.max]);
  const { ticks, bas, haut } = graduations(Math.min(...valeurs), Math.max(...valeurs));
  const X0 = 40, X1 = 346, Y0 = 10.5, Y1 = 142, total = Math.max(1, jours(asOf, fin) + 1);
  const x = (iso: string) => X0 + (Math.max(0, Math.min(total, jours(asOf, iso))) / total) * (X1 - X0), y = (v: number) => Y0 + ((haut - v) / Math.max(1, haut - bas)) * (Y1 - Y0);
  const depart = (e: Escalier) => (e.departCents === null ? 0 : e.departCents);
  const chemin = (e: Escalier) => {
    let d = `M${X0},${y(depart(e)).toFixed(1)}`;
    for (const m of e.marches) d += ` H${x(m.date).toFixed(1)} V${y(valeurDe(e, m)).toFixed(1)}`;
    return `${d} H${X1}`;
  };
  const dApres = chemin(apres), zero = y(0);
  const etiquettes = apres.marches.flatMap(m => m.items.filter(i => i.planId === planId).map(i => ({ id: i.id, x: x(m.date), y: y(valeurDe(apres, m)), v: i.direction === 'out' ? -i.amountCents : i.amountCents })));
  return <svg className="pvc-g" viewBox="0 0 346 172" role="img" aria-label={`Solde prévu jusqu’au ${jourLong(fin)}, avant et après cette prévision`} data-booster="marches-fin-horizon">
    {ticks.map(t => <React.Fragment key={t}><line className="pvc-gr" x1={X0} x2={X1} y1={y(t)} y2={y(t)} /><text className="pvc-ech" x={X0 - 4} y={y(t) + 4} textAnchor="end">{montantEntier(t)}</text></React.Fragment>)}
    <defs><clipPath id={`${id}h`}><rect x={0} y={0} width={346} height={Math.max(0, zero)} /></clipPath><clipPath id={`${id}b`}><rect x={0} y={Math.max(0, zero)} width={346} height={172} /></clipPath></defs>
    <path className="pvc-aire" clipPath={`url(#${id}h)`} d={`${dApres} V${zero} H${X0} Z`} /><path className="pvc-sous" clipPath={`url(#${id}b)`} d={`${dApres} V${zero} H${X0} Z`} />
    <line className="pvc-zero" x1={X0} x2={X1} y1={zero} y2={zero} />
    <path className="pvc-avant" d={chemin(avant)} /><path className="pvc-apres" d={dApres} />
    {/* t1, problème 7 : l'étiquette se pose SOUS la marche (dans l'aire), décalée de l'axe des francs : jamais sur la marche de départ collée à « 4 000 ». */}
    {etiquettes.map(l => <text key={l.id} className="pvc-pt" x={Math.max(X0 + 8, Math.min(l.x + 6, X1 - 34))} y={Math.min(l.y + 15, Y1 - 3)}>{montantCourt(l.v)}</text>)}
    <text className="pvc-mo" x={X0} y={168}>aujourd’hui</text><text className="pvc-mo" x={X1} y={168} textAnchor="end">{jourLong(fin)}</text>
  </svg>;
}

export function PlanSheetC({ plan, onClose }: { plan?: FinancialPlan; onClose: () => void }) {
  const donnees = useStorageValue(lire), asOf = todayISO();
  const [draft, setDraft] = useState<FinancialPlan>(() => plan ?? { id: idFor('PREV'), title: '', date: asOf, amountCents: 0, direction: 'out', category: 'chargesFixes', source: 'manual', status: 'active', createdAt: new Date().toISOString() });
  const field = <K extends keyof FinancialPlan>(key: K, value: FinancialPlan[K]) => setDraft(d => ({ ...d, [key]: value }));
  const frequence = draft.recurrence?.frequency ?? 'none', valide = draft.amountCents > 0 && !!isoDate(draft.date);
  const effet = useMemo(() => effetDeLaPrevision({ ...draft, title: draft.title.trim() || 'Prévision', amountCents: valide ? draft.amountCents : 0 }, asOf, donnees),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [donnees, asOf, valide, draft.id, draft.title, draft.date, draft.amountCents, draft.direction, draft.category, draft.status, draft.recurrence, draft.costAllocation, draft.vendor]);
  const fenetre = premierDuMoisSuivant(asOf, 5);
  const datesFrise = useMemo(() => (valide ? planOccurrences({ ...draft, status: 'active' }, asOf, fenetre).map(o => o.date) : []), [valide, draft, asOf, fenetre]);
  const dansHorizon = effet.occurrences.filter(i => i.planId === draft.id);
  const sansSolde = effet.avant.departCents === null;
  const val = (e: Escalier) => (sansSolde ? e.ecartFinCents : e.soldeFinCents!);
  const n = dansHorizon.length, unitaire = n ? dansHorizon[0].amountCents : draft.amountCents;
  const rien = !valide || (draft.status !== 'active');
  const titreFin = titreHorizon(effet.fin, HORIZON);
  const [ouvert, setOuvert] = useState(false);
  return <FormSheet className="pvc-sheet" title={plan ? 'Modifier la prévision' : 'Prévoir une dépense'}
    onSave={() => { if (!draft.title.trim() || draft.amountCents <= 0) throw Error('Un libellé et un montant positif sont nécessaires.'); FinanceService.savePlan({ ...draft, title: draft.title.trim() }); }} onClose={onClose}
    suppression={plan ? { etiquette: 'Supprimer cette prévision', question: `Supprimer « ${plan.title} » ?`, detail: `${plan.recurrence ? 'Toutes ses échéances disparaissent des prévisions. ' : ''}Les pièces déjà saisies ne bougent pas. Pour la garder sans la compter : état « Annulée ».`, faire: () => supprimerPlan(plan.id) } : undefined}>
    <div className="pvc">
      <div className="pvc-r">
        <label><span className="pvc-lab">Libellé</span><input className="pvc-in" value={draft.title} onChange={e => field('title', e.target.value)} placeholder="Loyer, commande de malt, vente prévue…" required autoComplete="off" /></label>
        <label><span className="pvc-lab">CHF</span><ChampNombre aria-label="Montant (CHF)" className="pvc-in pvc-m" value={draft.amountCents ? draft.amountCents / 100 : undefined} onValue={v => field('amountCents', v == null ? 0 : Math.round(v * 100))} max={BORNES_FINANCE.operationCents.valeur / 100} maxDecimales={2} fractionDigits={2} dire /></label>
      </div>
      <div className="pvc-pills">
        <Pastille texte={draft.direction === 'out' ? 'À payer' : 'À recevoir'} className="pvc-pay"><select aria-label="Mouvement" value={draft.direction} onChange={e => field('direction', e.target.value as 'in' | 'out')}><option value="out">À payer</option><option value="in">À recevoir</option></select></Pastille>
        <Pastille texte={CATEGORY_LABELS[draft.category]}><select aria-label="Catégorie" value={draft.category} onChange={e => field('category', e.target.value as FinanceCategory)}>{Object.entries(CATEGORY_LABELS).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></Pastille>
        <Pastille texte={isoDate(draft.date) ? jourLong(draft.date) : 'Date'} icone={<Calendar size={14} aria-hidden="true" />}><input type="date" aria-label="Date de paiement prévue" value={draft.date} onChange={e => field('date', e.target.value)} onClick={e => { try { e.currentTarget.showPicker?.(); } catch { /* le champ reste saisissable au clavier */ } }} required /></Pastille>
      </div>
      <div className="pvc-pan">
        <div className="pvc-seg" role="group" aria-label="Répétition" data-booster="repetition">
          {FREQUENCES.map(([valeur, texte]) => <button key={valeur} type="button" aria-pressed={frequence === valeur}
            onClick={() => setDraft(d => ({ ...d, source: valeur === 'none' ? 'manual' : 'recurring', recurrence: valeur === 'none' ? undefined : { frequency: valeur, endDate: d.recurrence?.endDate } }))}>{texte}</button>)}
        </div>
        <Frise asOf={asOf} fin={effet.fin} dates={datesFrise} />
        <Marches effet={effet} planId={draft.id} asOf={asOf} signe={!sansSolde} />
        <div className="pvc-fin"><i className="pvc-fl" />{draft.title.trim() ? `avec ${draft.title.trim().toLowerCase()}` : 'avec cette prévision'}<i className="pvc-fl pvc-fa" />sans</div>
        <div className="pvc-eff" aria-live="polite">
          <span>{titreFin}{sansSolde ? ' · écart' : ''}<small>{rien ? (valide ? 'cette prévision n’est pas à venir : aucun effet' : 'montant à saisir pour voir l’effet') : n ? `${n} × ${montant(unitaire)} dans les ${HORIZON} jours` : `aucune échéance dans les ${HORIZON} jours`}</small></span>
          <s>{montant(val(effet.avant))}</s><b className="pvc-m">{valide ? montant(val(effet.apres)) : '—'}</b>
        </div>
        {sansSolde && <small className="pvc-note">Solde de départ non confirmé : c’est l’écart depuis aujourd’hui, pas un solde.</small>}
      </div>
      {draft.recurrence && draft.direction === 'out' && <details className="pvc-row" data-booster="cout-brassin"><summary><span>Compte dans mon litre ?</span><em>{draft.costAllocation === 'fixed' ? 'charge fixe' : draft.costAllocation === 'brew' ? 'déjà par brassin' : 'à décider'}</em><ChevronDown size={18} aria-hidden="true" /></summary>
        <div className="pvc-ouvert"><select aria-label="Coût de revient des brassins" value={draft.costAllocation ?? ''} onChange={e => field('costAllocation', (e.target.value || undefined) as 'fixed' | 'brew' | undefined)}><option value="">À confirmer dans le budget du brassin</option><option value="fixed">Charge fixe à répartir (loyer, assurance…)</option><option value="brew">Déjà estimé par brassin (eau, énergie…)</option></select></div></details>}
      <details className="pvc-row" open={ouvert} onToggle={e => setOuvert((e.currentTarget as HTMLDetailsElement).open)}><summary><span>{draft.recurrence ? 'Fournisseur, note, fin de la répétition' : 'Fournisseur, note'}{plan ? ', état' : ''}</span><ChevronRight size={18} aria-hidden="true" className="pvc-chev" /></summary>
        <div className="pvc-ouvert pvc-champs">
          <label><span className="pvc-lab">Fournisseur ou client</span><input className="pvc-in" value={draft.vendor ?? ''} onChange={e => field('vendor', e.target.value)} /></label>
          <label><span className="pvc-lab">Note</span><Textarea rows={2} className="pvc-in pvc-ta" value={draft.notes ?? ''} onChange={e => field('notes', e.target.value)} /></label>
          {draft.recurrence && <label><span className="pvc-lab">Fin de la répétition (facultatif)</span><input type="date" className="pvc-in" value={draft.recurrence.endDate ?? ''} onChange={e => field('recurrence', { ...draft.recurrence!, endDate: e.target.value || undefined })} /></label>}
          {plan && <label><span className="pvc-lab">État</span><select className="pvc-in" value={draft.status} onChange={e => field('status', e.target.value as FinancialPlan['status'])}><option value="draft">Brouillon</option><option value="active">À venir</option><option value="completed">Terminée</option><option value="cancelled">Annulée</option></select></label>}
          <p className="pvc-note">Cette prévision n’ajoute aucune écriture comptable. Relie la facture à cette prévision lors de son enregistrement.</p>
        </div></details>
    </div>
  </FormSheet>;
}
