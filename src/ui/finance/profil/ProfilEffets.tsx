import React, { useDeferredValue, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ChampMontant } from '../ChampMontant';
import type { FinancialProfile } from '../../../domain/finance/types';
import { isoDate, summarizeLedger, todayISO } from '../../../domain/finance/ledger';
import { annualBrewFixedCosts } from '../../../domain/finance/brewBudget';
import { brassinDuProfil } from './brassinProfil';
import { tvaThresholdStatus } from '../../../domain/finance/tvaThreshold';
import { FinanceService } from '../../../services/financeService';
import { StorageService } from '../../../services/storage';
import { useStorageValue } from '../../../hooks/useLiveData';
import { litreFr, montant, montantEntier, moisCourt } from '../previsions/format';
import { FormSheet } from '../prevision/base';
import './profil.css';

/**
 * Solde et paramètres = m4pf-c (choix du 15.11) : chaque réglage montre ce qu'il change.
 * Les nombres viennent du domaine, jamais d'une copie : la caisse de `summarizeLedger` (solde de départ essayé comme confirmé),
 * la tendance de `forecast.ts` (6 mois, 3 au moins), les charges fixes de `annualBrewFixedCosts`, le coût du litre de `estimerBrassinsPlanifies`
 * (avec la production du brouillon) et le seuil de `tvaThresholdStatus`. Un nombre qui manque reste « — » : l'inconnu n'est jamais 0.
 * `lire` est une constante de module : `useStorageValue` se réabonne si sa fonction change.
 */
const lire = () => ({ transactions: StorageService.getTransactions(), payments: FinanceService.getPayments(), plans: FinanceService.getPlans(), assets: FinanceService.getAssets(),
  batches: StorageService.getBatches(), stocks: StorageService.getStocks(), config: StorageService.getConfig() });
const LETTRES = ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'];
const NOMS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const PRODUCTION_MAX = 4000;
const jourLong = (iso: string) => `${Number(iso.slice(8, 10))} ${moisCourt(iso)} ${iso.slice(0, 4)}`;
const moisLong = (ym: string) => `${moisCourt(`${ym}-01`)} ${ym.slice(0, 4)}`;
const indexMois = (ym: string) => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1;
const finDuMois = (ym: string) => new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0)).toISOString().slice(0, 10);
const jours = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
const moisDe = (i: number) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;

/** Mois pleins entre le début de l'historique et le mois courant (exclu) : la règle de `forecast.ts` demande 3 de ces mois, au plus 6 servent. */
export function moisCompletsDepuis(depuis: string | undefined, aujourdhui: string): number {
  const iso = isoDate(depuis);
  if (!iso) return 0;
  return Math.max(0, indexMois(aujourdhui.slice(0, 7)) - indexMois(iso.slice(0, 7)));
}

export interface PointCaisse { date: string; cents: number }
/** La caisse de départ à aujourd'hui, mois après mois : chaque point est `summarizeLedger(...).cashCents` du domaine, solde de départ essayé comme confirmé. */
export function courbeDeCaisse(profile: FinancialProfile, cents: number, date: string, aujourdhui: string, donnees: Pick<ReturnType<typeof lire>, 'transactions' | 'payments'>): PointCaisse[] {
  const depart = isoDate(date);
  if (!depart || depart > aujourdhui || !Number.isSafeInteger(cents)) return [];
  const essai: FinancialProfile = { ...profile, openingCash: { date: depart, amountCents: cents, confirmed: true } };
  const valeur = (d: string) => summarizeLedger(donnees.transactions, donnees.payments, essai, d).cashCents;
  const premier = valeur(depart);
  if (premier === null) return [];
  const points: PointCaisse[] = [{ date: depart, cents: premier }];
  let m = indexMois(depart.slice(0, 7));
  const dernier = indexMois(aujourdhui.slice(0, 7));
  const pas = Math.max(1, Math.ceil((dernier - m) / 24));
  for (m += pas; m < dernier; m += pas) { const fin = finDuMois(moisDe(m)); const v = valeur(fin); if (v !== null && fin > depart) points.push({ date: fin, cents: v }); }
  const auj = valeur(aujourdhui);
  if (auj !== null) points.push({ date: aujourdhui, cents: auj });
  return points;
}

function FriseSolde({ points, confirme }: { points: PointCaisse[]; confirme: boolean }) {
  if (points.length < 2) return <p className="pfc-cap pfc-vide">{points.length ? 'Pas encore de mouvement depuis cette date.' : 'Solde et date à saisir : la courbe de la caisse s’affiche ici.'}</p>;
  const debut = points[0].date, total = Math.max(1, jours(debut, points[points.length - 1].date));
  const vals = points.map(p => p.cents), bas = Math.min(...vals), haut = Math.max(...vals), plage = Math.max(1, haut - bas);
  const X = (d: string) => 4 + (jours(debut, d) / total) * 342, Y = (c: number) => 8 + (1 - (c - bas) / plage) * 44;
  let trace = `M${X(points[0].date).toFixed(1)} ${Y(points[0].cents).toFixed(1)}`;
  for (let i = 1; i < points.length; i++) trace += ` H${X(points[i].date).toFixed(1)} V${Y(points[i].cents).toFixed(1)}`;
  const dernier = points[points.length - 1], long = jours(debut, dernier.date) > 330;
  const etiquettes = Array.from({ length: 6 }, (_, i) => { const d = new Date(Date.parse(`${debut}T12:00:00Z`) + (total * i / 5) * 86_400_000).toISOString().slice(0, 10); return long ? `${moisCourt(d)} ${d.slice(2, 4)}` : moisCourt(d); });
  const pc = (x: number) => `${((x / 350) * 100).toFixed(2)}%`, py = (y: number) => `${((y / 60) * 100).toFixed(2)}%`;
  return <div className="pfc-sol" data-booster="frise-solde">
    <div className="pfc-pin">aujourd’hui <b className="pfc-m">{montant(dernier.cents)}</b></div>
    <div className="pfc-trace">
      <svg viewBox="0 0 350 60" preserveAspectRatio="none" role="img" aria-label={`Caisse du ${jourLong(debut)} à aujourd’hui : de ${montant(points[0].cents)} à ${montant(dernier.cents)}`}><path d={trace} className={confirme ? 'pfc-courbe' : 'pfc-courbe pfc-essai'} /></svg>
      <i className="pfc-pt pfc-pt0" style={{ left: pc(X(points[0].date)), top: py(Y(points[0].cents)) }} /><i className="pfc-pt pfc-pt1" style={{ left: pc(X(dernier.date)), top: py(Y(dernier.cents)) }} />
    </div>
    <div className="pfc-ax" aria-hidden="true">{etiquettes.map((e, i) => <span key={i}>{e}</span>)}</div>
  </div>;
}

export function ProfilEffets({ profile, onClose, parametres = false }: { profile: FinancialProfile; onClose: () => void; parametres?: boolean }) {
  const donnees = useStorageValue(lire);
  const aujourdhui = todayISO(), moisCourant = aujourdhui.slice(0, 7);
  const [draft, setDraft] = useState(profile), [cash, setCash] = useState(profile.openingCash?.amountCents), [date, setDate] = useState(profile.openingCash?.date ?? aujourdhui), [confirmed, setConfirmed] = useState(profile.openingCash?.confirmed ?? false);
  const renvoiFait = useRef(false);
  /* Le contenu de la feuille se monte dans un portail, après ce composant : le renvoi se fait quand la carte est posée, une seule fois. */
  const carteMois = (el: HTMLElement | null) => { if (el && parametres && !renvoiFait.current) { renvoiFait.current = true; el.scrollIntoView?.({ block: 'center' }); } };

  const points = useMemo(() => (cash == null ? [] : courbeDeCaisse(draft, cash, date, aujourdhui, donnees)), [cash, date, aujourdhui, draft, donnees]);
  const complets = moisCompletsDepuis(draft.historyCompleteFrom, aujourdhui);
  const depuisMois = isoDate(draft.historyCompleteFrom)?.slice(0, 7);
  const annee = aujourdhui.slice(0, 4);
  const phraseMois = !depuisMois ? 'Aucun mois confirmé : pas de tendance.' : complets >= 3 ? `${complets} mois complets : la tendance est calculée.`
    : complets === 0 ? 'Aucun mois complet encore : pas de tendance.' : `${complets} mois complet${complets > 1 ? 's' : ''} : pas encore de tendance, il en faut 3.`;

  const litres = draft.annualProductionL != null && draft.annualProductionL > 0 ? draft.annualProductionL : undefined;
  const litresDiffere = useDeferredValue(litres);
  const fixes = useMemo(() => annualBrewFixedCosts(donnees.plans), [donnees.plans]);
  const sortie = useMemo(() => {
    const finAn = `${Number(aujourdhui.slice(0, 4)) + 1}${aujourdhui.slice(4)}`;
    try { return brassinDuProfil({ batches: donnees.batches, stockItems: [...donnees.stocks.rawMaterials, ...donnees.stocks.cleaning], transactions: donnees.transactions, plans: donnees.plans, profile: { ...profile, annualProductionL: litresDiffere }, assets: donnees.assets, config: donnees.config, asOf: aujourdhui, fin: finAn }); } catch { return null; }
  }, [donnees, profile, litresDiffere, aujourdhui]);
  /* Un brassin planifié, sinon le prochain budget de brassin prévu : Prévisions le compte, le profil ne dit pas « aucun brassin » (t1, problème 3). */
  const brassin = sortie;
  const coutFixes = litres != null && fixes.amountCHF != null ? fixes.amountCHF / litres : null;
  const nbBrassins = litres != null && brassin?.litres ? litres / brassin.litres : null;
  const litreBrassin = brassin?.litre ?? null;
  const seuil = donnees.config.fiscal.tvaThresholdTurnover, assujetti = !!donnees.config.fiscal.isTvaRegistered || !!draft.vatRegistered;
  const tva = useMemo(() => tvaThresholdStatus(donnees.transactions, aujourdhui, seuil, assujetti), [donnees.transactions, aujourdhui, seuil, assujetti]);

  const save = () => { if (cash != null && !isoDate(date)) throw Error('Choisis la date du solde.'); FinanceService.saveProfile({ ...draft, openingCash: cash != null ? { date, amountCents: cash, confirmed } : undefined }); };
  const placerMois = (m: number) => setDraft(d => ({ ...d, historyCompleteFrom: `${annee}-${String(m + 1).padStart(2, '0')}-01` }));

  return <FormSheet className="fx4-sheet pfc-sheet" title="Solde et paramètres" onClose={onClose} onSave={save}>
    <div className="pfc">
      <section className="pfc-card" aria-label="Solde de départ">
        <div className="pfc-top"><h3>Solde de départ</h3><span className="pfc-val"><ChampMontant aria-label="Solde de départ (CHF)" className="pfc-nb pfc-m" value={cash == null ? undefined : cash / 100} onValue={v => { setCash(v == null ? undefined : Math.round(v * 100)); setConfirmed(false); }} fractionDigits={2} maxDecimales={2} max={99_999_999} negatif /> <small>CHF</small></span></div>
        <FriseSolde points={points} confirme={confirmed} />
        <div className="pfc-vr">
          <label className="pfc-pill"><span>{isoDate(date) ? jourLong(date) : 'Date'}</span><ChevronDown size={14} aria-hidden="true" />
            <input type="date" aria-label="Date du solde" value={date} max={aujourdhui} required onChange={e => { setDate(e.target.value); setConfirmed(false); }} onClick={e => { try { e.currentTarget.showPicker?.(); } catch { /* saisie au clavier */ } }} /></label>
          <label className="pfc-tg"><input type="checkbox" checked={confirmed} aria-label="J’ai vérifié ce solde, avant les paiements de cette journée." onChange={e => setConfirmed(e.target.checked)} /><span className="pfc-sw" aria-hidden="true" /><b>Vérifié</b></label>
        </div>
        {cash != null && !confirmed && <p className="pfc-cap" role="note">Sans cette case, ce solde n’est compté ni dans la caisse ni dans les prévisions.</p>}
      </section>

      <section className="pfc-card" ref={carteMois} aria-label="Tout est noté depuis" data-booster="mois-couverts">
        <div className="pfc-top"><h3>Tout est noté depuis</h3>
          <label className="pfc-pill pfc-pill-l"><span>{depuisMois ? moisLong(depuisMois) : 'à choisir'}</span><ChevronDown size={14} aria-hidden="true" />
            <input type="month" aria-label="Historique des dépenses complet depuis" value={depuisMois ?? ''} onChange={e => setDraft(d => ({ ...d, historyCompleteFrom: e.target.value ? `${e.target.value}-01` : undefined }))} /></label></div>
        <div className="pfc-mois" role="group" aria-label={`Mois de ${annee}`}>
          {LETTRES.map((l, m) => {
            const ym = `${annee}-${String(m + 1).padStart(2, '0')}`, futur = ym > moisCourant, courant = ym === moisCourant, plein = !!depuisMois && ym >= depuisMois && ym < moisCourant;
            return <button key={m} type="button" disabled={futur} className={plein ? 'pfc-on' : courant ? 'pfc-cur' : 'pfc-no'} aria-pressed={plein} aria-label={`Tout est noté depuis ${NOMS[m]} ${annee}`} onClick={() => placerMois(m)}>{l}</button>;
          })}
        </div>
        <p className="pfc-cap" aria-live="polite">{phraseMois}</p>
      </section>

      <section className="pfc-card" aria-label="Production prévue" data-booster="curseur-production">
        <div className="pfc-top"><h3>Production prévue</h3><span className="pfc-val"><ChampMontant aria-label="Production annuelle prévue (litres conditionnés)" className="pfc-nb pfc-m" value={draft.annualProductionL} onValue={v => setDraft(d => ({ ...d, annualProductionL: v ?? undefined }))} min={1} max={1_000_000} integer /> <small>L/an</small></span></div>
        <input type="range" className="pfc-range" min={0} max={PRODUCTION_MAX} step={50} aria-label="Production annuelle, curseur" aria-valuetext={litres == null ? 'non renseignée' : `${montantEntier(litres * 100)} litres par an`}
          value={Math.min(PRODUCTION_MAX, litres ?? 0)} style={{ ['--pos' as string]: `${(Math.min(PRODUCTION_MAX, litres ?? 0) / PRODUCTION_MAX) * 100}%` }}
          onChange={e => { const v = Number(e.target.value); setDraft(d => ({ ...d, annualProductionL: v > 0 ? v : undefined })); }} />
        <div className="pfc-ticks pfc-m" aria-hidden="true"><span>0</span><span>2 000</span><span>4 000 L</span></div>
        <div className="pfc-eff" aria-live="polite">
          <span>charges fixes<b className="pfc-m">{coutFixes != null ? `${litreFr(coutFixes)}/L` : '—'}</b>{coutFixes != null ? `${montantEntier(Math.round(fixes.amountCHF! * 100))} ÷ ${montantEntier(litres! * 100)}` : litres == null ? 'production à saisir' : fixes.amountCHF == null ? 'charges à classer' : ''}</span>
          <span>soit<b className="pfc-m">{nbBrassins != null ? `≈ ${Math.round(nbBrassins)}` : '—'}</b>{brassin?.litres ? `brassins de ${montantEntier(Math.round(brassin.litres) * 100)} L` : 'aucun brassin planifié'}</span>
          <span><i className="pfc-nom">{brassin?.titre ?? 'Prochain brassin'}</i><b className="pfc-m">{litreBrassin != null ? `${litreFr(litreBrassin)}/L` : '—'}</b>{litreBrassin != null ? 'avec ce réglage' : brassin?.manque ? `manque : ${brassin.manque}` : 'coût à compléter'}</span>
        </div>
      </section>

      <section className="pfc-card" aria-label="TVA">
        <div className="pfc-top"><h3>Indépendant · Fribourg · TVA</h3><span className={`pfc-tva pfc-${tva?.level ?? 'ok'}`}>{assujetti ? 'avec TVA' : tva?.level === 'over' ? '⚠ seuil franchi' : tva?.level === 'warn' ? '⚠ proche du seuil' : tva ? '✓ sans TVA' : '—'}</span></div>
        {tva && <p className="pfc-cap">ventes sur 12 mois <b className="pfc-m">{montantEntier(tva.turnoverCents)}</b> sur le seuil <b className="pfc-m">{montantEntier(tva.thresholdCents)}</b> CHF</p>}
      </section>

      <details className="pfc-row"><summary><span>Précisions</span><ChevronRight size={18} aria-hidden="true" className="pfc-chev" /></summary>
        <div className="pfc-ouvert"><p>La tendance n’est calculée qu’avec au moins trois mois complets ; six au plus servent. Les anciens paiements inconnus restent à confirmer.</p>
          <p>La production sert à répartir les charges fixes entre les brassins. Ton temps personnel n’est pas compté. Le solde de départ sert à calculer l’argent disponible après les paiements enregistrés.</p></div></details>
    </div>
  </FormSheet>;
}
