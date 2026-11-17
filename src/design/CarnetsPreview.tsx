import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CreativeItem } from '../types';
import type { FinancialPlan } from '../domain/finance/types';
import { magasinMemoire } from '../services/carnetsStore';
import { fixtureCarnets, fixturePlanRealise, fixturePlans } from '../domain/carnets/fixture';
import { aidesCarnet, comportementSimule, type AidesCarnet, type ModeCarnetIA } from '../config/carnetIA';
import { appelsSimules, type AppelsIA } from '../ui/carnets/rangement';
import { CarnetsVue, type FinancesCarnet } from '../ui/carnets/CarnetsVue';

const param = (nom: string) => new URLSearchParams(typeof location === 'undefined' ? '' : location.search).get(nom);

export interface BancCarnetsProps {
  vide?: boolean;
  horsLigne?: boolean;
  mode?: ModeCarnetIA;
  appels?: AppelsIA;
  aides?: AidesCarnet;
  /** La variante « plan réalisé » de la fixture (Suppression v2, archiver). */
  realise?: boolean;
  items?: CreativeItem[];
  onPlan?: (plan: FinancialPlan) => void;
}

/** Le banc lui-même (aussi monté par `carnetsParcours.test.tsx`) : magasin mémoire, plans en mémoire, IA simulée. */
export function BancCarnets(p: BancCarnetsProps) {
  const depart = useMemo(() => {
    if (p.items) return { items: p.items, finances: { plans: [], transactions: [], payments: [] } as FinancesCarnet };
    if (p.vide) return { items: [] as CreativeItem[], finances: { plans: [], transactions: [], payments: [] } as FinancesCarnet };
    if (p.realise) { const r = fixturePlanRealise(); return { items: r.items, finances: { plans: r.plans, transactions: r.transactions, payments: r.payments } as FinancesCarnet }; }
    return { items: fixtureCarnets(), finances: { plans: fixturePlans(), transactions: [], payments: [] } as FinancesCarnet };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const magasin = useMemo(() => magasinMemoire(depart.items), [depart]);
  const [finances, setFinances] = useState<FinancesCarnet>(depart.finances);
  const [avis, setAvis] = useState<string | null>(null);
  const mode = p.mode ?? 'simule';
  return (
    <div data-banc-carnets className="flex h-full min-h-0 flex-col">
      <CarnetsVue className="min-h-0 flex-1" magasin={magasin} finances={finances} mode={mode}
        appels={p.appels ?? appelsSimules(comportementSimule())} aides={p.aides ?? aidesCarnet(mode, {}, param('aides'))} horsLigne={p.horsLigne}
        ecrirePlan={plan => { p.onPlan?.(plan); setFinances(f => ({ ...f, plans: [...f.plans.filter(x => x.id !== plan.id), plan] })); }}
        onMessage={setAvis} />
      {avis && <p role="status" className="px-3 py-1 text-sm text-cave-200">{avis}</p>}
      <p hidden data-plans>{finances.plans.map(x => `${x.id}|${x.upgrade?.sourceCarnetTitre ?? ''}`).join(';')}</p>
    </div>
  );
}

/** La page `?preview=carnets` : bandeau « Banc — données simulées », thème, tâches. */
export function CarnetsPreview() {
  const zone = useRef<HTMLDivElement>(null);
  const taches = param('taches') === '1';
  useEffect(() => {
    if (param('theme') === 'sombre') document.documentElement.setAttribute('data-theme', 'cave');
    else if (param('theme') === 'clair') document.documentElement.removeAttribute('data-theme');
  }, []);
  return (
    <div className="flex h-[100dvh] flex-col bg-cave-950 text-cave-50">
      <p className="shrink-0 bg-cave-900 px-3 py-1 text-sm text-cave-200">Banc — données simulées · Stocks › Matériel › Carnets</p>
      {taches && <BandeauTaches zone={zone} />}
      <div ref={zone} className="min-h-0 flex-1">
        <BancCarnets vide={param('vide') === '1'} horsLigne={param('hors-ligne') === '1'} realise={param('realise') === '1'}
          mode={param('ia') === 'eteint' ? 'eteint' : 'simule'} />
      </div>
    </div>
  );
}

/**
 * Banc du carnet d'idées : `?preview=carnets` (dev seulement, absent du paquet : `main.tsx` ne l'importe que sous `import.meta.env.DEV`).
 * **Banc — données simulées** : magasin mémoire, IA simulée, fixture « ZZ TEST — … ». Rien n'est écrit dans Firestore.
 * Paramètres : `&vide=1`, `&hors-ligne=1`, `&ia=eteint|echec|lent`, `&theme=sombre`, `&aides=0`, `&taches=1`.
 */

/* ───── &taches=1 (D-36, R41) : cinq tâches chronométrées, du premier toucher au « ✓ » ───── */

export const TACHES = [
  'Créer « embouteillage »',
  'Ajouter un lien',
  'Ajouter une note en vrac',
  'Comparer et choisir, avec son pourquoi',
  'Retrouver ce pourquoi'
] as const;

export interface TempsTache { tache: string; ms: number; gestes: number; le: string }
const CLE_TACHES = 'banc-carnets-taches';

export function lireTemps(): TempsTache[] {
  try { const v = JSON.parse(localStorage.getItem(CLE_TACHES) ?? '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
export function texteTemps(temps: readonly TempsTache[]): string {
  return temps.map(t => `${t.tache} : ${(t.ms / 1000).toFixed(1)} s, ${t.gestes} geste${t.gestes > 1 ? 's' : ''} (${t.le})`).join('\n');
}

/**
 * Le bandeau des tâches. Le chrono part au premier toucher dans l'app (pas dans le bandeau) et s'arrête au « ✓ ».
 * Un geste = un toucher (pointerdown) ou une touche Entrée dans l'app ; la frappe d'un texte n'en est pas un.
 */
export function BandeauTaches({ zone }: { zone: React.RefObject<HTMLElement | null> }) {
  const [i, setI] = useState(0);
  const [temps, setTemps] = useState<TempsTache[]>(lireTemps);
  const [debut, setDebut] = useState<number | null>(null);
  const [gestes, setGestes] = useState(0);
  const [maintenant, setMaintenant] = useState(Date.now());
  const [copie, setCopie] = useState(false);
  const debutRef = useRef<number | null>(null);
  debutRef.current = debut;

  useEffect(() => {
    const el = zone.current;
    if (!el) return;
    const toucher = () => { if (debutRef.current === null) setDebut(Date.now()); setGestes(g => g + 1); };
    const touche = (e: KeyboardEvent) => { if (e.key === 'Enter') toucher(); };
    el.addEventListener('pointerdown', toucher, true);
    el.addEventListener('keydown', touche, true);
    return () => { el.removeEventListener('pointerdown', toucher, true); el.removeEventListener('keydown', touche, true); };
  }, [zone]);
  useEffect(() => {
    if (debut === null) return;
    const t = setInterval(() => setMaintenant(Date.now()), 250);
    return () => clearInterval(t);
  }, [debut]);

  const fini = i >= TACHES.length;
  const valider = useCallback(() => {
    if (fini || debut === null) return;
    const suite = [...temps, { tache: TACHES[i], ms: Date.now() - debut, gestes, le: new Date().toISOString() }];
    setTemps(suite);
    localStorage.setItem(CLE_TACHES, JSON.stringify(suite));
    setI(i + 1); setDebut(null); setGestes(0);
  }, [fini, debut, temps, i, gestes]);
  const recommencer = () => { localStorage.removeItem(CLE_TACHES); setTemps([]); setI(0); setDebut(null); setGestes(0); };
  const copier = async () => {
    try { await navigator.clipboard.writeText(texteTemps(temps)); setCopie(true); setTimeout(() => setCopie(false), 2000); } catch { setCopie(false); }
  };
  const ecoule = debut === null ? 0 : Math.max(0, maintenant - debut);

  return (
    <section aria-label="Tâches chronométrées" data-taches className="border-b border-cave-800 bg-cave-900 px-3 py-2 text-sm text-cave-50">
      {!fini ? (
        <div className="flex flex-wrap items-center gap-2">
          <b className="min-w-0 flex-1">Tâche {i + 1} / {TACHES.length} · {TACHES[i]}</b>
          <span className="font-mono" aria-live="off">{(ecoule / 1000).toFixed(1)} s · {gestes} geste{gestes > 1 ? 's' : ''}</span>
          <button type="button" className="min-h-11 rounded-control bg-ebc-straw px-3 font-semibold text-cave-950 disabled:opacity-50" disabled={debut === null} onClick={valider}>✓ Fait</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <b className="min-w-0 flex-1">Les 5 tâches sont faites.</b>
          <button type="button" className="min-h-11 rounded-control border border-cave-700 px-3 font-semibold" onClick={() => void copier()}>{copie ? 'Copié' : 'Copier les temps'}</button>
          <button type="button" className="min-h-11 rounded-control border border-cave-700 px-3" onClick={recommencer}>Recommencer</button>
        </div>
      )}
      {temps.length > 0 && <pre data-temps className="mt-1 whitespace-pre-wrap font-mono text-sm text-cave-200">{texteTemps(temps)}</pre>}
    </section>
  );
}
