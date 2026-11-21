import React, { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, X } from 'lucide-react';
import type { Batch, KegItem } from '../../../types';
import { BATCH_STATUS } from '../../../domain/batchStatus';
import { fermentationBlockedReason, statusOptions, transitionConsequence } from '../../../domain/batchTransitions';
import { packagingLimitL, validatePackaging } from '../../../domain/batchPackaging';
import { actualBrewDate, breweryDay } from '../../../domain/batchSchedule';
import { todayISO } from '../../../domain/finance/ledger';
import { nombreFr } from '../../../domain/nombreAffiche';
import { futsQuiTiennent, marquerPropre, phraseALaver } from '../../../domain/stock/futsFiche';
import { DateField, swissToday } from '../../DateField';
import { Sheet } from '../../Sheet';
import { Button } from '../../../components/ui/Button';
import { abvFromGravities } from '../../../domain/gravityBounds';
import { parseDecimal } from '../../numericInput';
import { bouteillesMax, datesDeMarches, MARCHES, repartition, teinteBiere, volumesConditionnes } from './ficheModel';
import { Bouteille } from './PostFiche';
import { Cible, Curseur, Mono, Pastille, Puce } from './ui';

/**
 * e4c, l'échelle des étapes : une marche par étape, un palet sur l'étape actuelle, une cible pointillée sur la suivante.
 * Le geste : le palet se touche (avance d'une marche) ou se glisse vers la marche suivante, la marche passée (retour, avec sa
 * confirmation) ou la bande « Abandonner » ; sous 8 px de déplacement, c'est un toucher.
 * Conditionner écrit `packaging`, `volumePackagedL` et `bottlingDate`, puis passe l'étape ; le stock des ingrédients n'est pas touché ici.
 */
export interface Conditionnement { packaging: NonNullable<Batch['packaging']>; volumePackagedL: number; bottlingDate: string }

const NOMS: Record<string, string> = { fermentation: 'Fermentation', garde: 'Garde', conditionne: 'Conditionné', termine: 'Terminé' };
/** « Laisser en garde », « Laisser conditionnée » : l'étape en cours s'accorde avec la bière. */
const LAISSER: Record<string, string> = { fermentation: 'Laisser en fermentation', garde: 'Laisser en garde', conditionne: 'Laisser conditionnée', termine: 'Laisser terminée' };
const MARCHE_LIGNE = 'grid grid-cols-[44px_minmax(0,1fr)] gap-x-2';
const SEUIL_GLISSE = 8;
const hachure = (couleur: string): React.CSSProperties => ({ backgroundImage: `repeating-linear-gradient(135deg, transparent 0 5px, ${couleur} 5px 7px)` });
const HACHURE_PERTES = hachure('rgb(var(--cave-600) / 0.55)');
const HACHURE_ABANDON = hachure('rgb(var(--alert) / 0.3)');
const TEINTES: Record<string, string> = {
  straw: 'border-ebc-straw/60 bg-ebc-straw/15', gold: 'border-ebc-gold/60 bg-ebc-gold/15', amber: 'border-ebc-amber/60 bg-ebc-amber/15',
  copper: 'border-ebc-copper/60 bg-ebc-copper/15', brown: 'border-ebc-brown/60 bg-ebc-brown/15', stout: 'border-ebc-stout/70 bg-ebc-stout/15'
};

const Rail: React.FC<{ ton: 'fait' | 'neutre' | 'rouge'; premier?: boolean; dernier?: boolean; children?: React.ReactNode }> = ({ ton, premier, dernier, children }) => (
  <div className="relative" aria-hidden={children ? undefined : true}>
    <span className={`absolute left-[19px] w-1.5 ${premier ? 'top-[22px] rounded-t' : 'top-0'} ${dernier ? 'bottom-[22px]' : 'bottom-0'} ${ton === 'fait' ? 'bg-hop' : ton === 'rouge' ? 'bg-alert' : 'bg-cave-800'}`} />
    {children}
  </div>
);
const Point: React.FC<{ ton?: string }> = ({ ton = 'bg-hop' }) => <span data-point className={`absolute left-3 top-3.5 h-5 w-5 rounded-full border-[3px] border-cave-900 ${ton}`} />;

/**
 * Le palet : un bouton rond de 44 px. Avec `glisse`, il suit le doigt (capture du pointeur, `touch-action: none`) ; au relâchement,
 * `elementsFromPoint` cherche le dépôt `[data-depot]` sous le doigt. Un déplacement sous 8 px reste un toucher (`onClick`).
 */
const Palet: React.FC<{ label: string; onClick?: () => void; sens?: 'bas' | 'haut' | 'ok'; alerte?: boolean; glisse?: (depot: string | null) => void }> = ({ label, onClick, sens = 'bas', alerte, glisse }) => {
  const depart = useRef<{ x: number; y: number } | null>(null);
  const bouge = useRef(false);
  const [dy, setDy] = useState(0);
  const prise = glisse ? {
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      depart.current = { x: e.clientX, y: e.clientY }; bouge.current = false;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => {
      const d = depart.current; if (!d) return;
      if (!bouge.current && Math.hypot(e.clientX - d.x, e.clientY - d.y) >= SEUIL_GLISSE) bouge.current = true;
      if (bouge.current) setDy(e.clientY - d.y);
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      const d = depart.current; depart.current = null;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      setDy(0);
      if (!d || !bouge.current) return;
      // Vaul (la feuille) glisse vers le bas pour se fermer : le palet porte data-vaul-no-drag. Un glisser n'est pas un clic : le clic qui suit le relâchement est avalé (sinon il atteint le fond de la feuille et la ferme).
      const avaler = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); };
      window.addEventListener('click', avaler, { capture: true, once: true });
      window.setTimeout(() => window.removeEventListener('click', avaler, true), 60);
      const sous = typeof document.elementsFromPoint === 'function' ? document.elementsFromPoint(e.clientX, e.clientY) : [];
      const depot = sous.map(el => el.closest('[data-depot]')).find(Boolean)?.getAttribute('data-depot') ?? null;
      glisse(depot);
    },
    onPointerCancel: () => { depart.current = null; bouge.current = false; setDy(0); }
  } : {};
  return (
    <button type="button" aria-label={label} data-palet {...(glisse ? { "data-vaul-no-drag": "" } : {})} {...prise}
      onClick={() => { if (bouge.current) { bouge.current = false; return; } onClick?.(); }}
      style={dy ? { transform: `translateY(${dy}px)` } : undefined}
      className={`absolute left-0 top-1.5 z-10 grid h-11 w-11 place-items-center rounded-full border-[3px] border-cave-900 shadow-md ${glisse ? 'touch-none' : ''} ${alerte ? 'bg-alert text-white' : sens === 'ok' ? 'bg-ebc-gold text-cave-950' : 'bg-ebc-straw text-cave-950'}`}>
      {sens === 'haut' ? <ArrowUp size={20} aria-hidden="true" /> : sens === 'ok' ? <Check size={20} aria-hidden="true" /> : <ArrowDown size={20} aria-hidden="true" />}
    </button>
  );
};
const Marche: React.FC<{ cls: string; titre: string; droite?: React.ReactNode; children?: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ cls, titre, droite, children, className = '', style }) => (
  <div style={style} className={`mb-1.5 flex flex-col gap-2 rounded-control border px-2.5 py-2 ${cls} ${className}`}>
    <div className="flex items-baseline justify-between gap-1.5"><b className="text-base font-semibold">{titre}</b>{droite && <span className="text-[13px] opacity-80">{droite}</span>}</div>
    {children}
  </div>
);

export const StageLadder: React.FC<{
  batch: Batch; now: number; kegs: KegItem[]; onClose: () => void;
  onAvancer: (cible: Batch['status']) => void;
  onConditionner: (valeurs: Conditionnement, fustsId: string[]) => void;
  onRetour: (cible: Batch['status']) => void;
  onAbandonner: () => void;
  /** K7 : « 2 à laver · marquer propres » écrit ces fûts propres (le parent relit le parc). */
  onMarquerPropres?: (laves: KegItem[]) => void;
}> = ({ batch, now, kegs, onClose, onAvancer, onConditionner, onRetour, onAbandonner, onMarquerPropres }) => {
  const c = MARCHES.indexOf(batch.status as (typeof MARCHES)[number]);
  const options = statusOptions(batch);
  const retour = options.find(o => o.kind === 'back')?.status;
  const [ouvert, setOuvert] = useState<'retour' | 'abandon' | null>(null);
  const [bt, setBt] = useState(batch.packaging?.bottles33 ?? 0);
  const [sel, setSel] = useState<string[]>(batch.packaging?.kegIds ?? []);
  const [date, setDate] = useState(batch.bottlingDate || swissToday());
  const [autre, setAutre] = useState(false);
  const [essai, setEssai] = useState(false);
  const cuveL = packagingLimitL(batch);
  const mesure = Number(batch.volumeBrewedL) > 0;
  /** K7 : les fûts qui tiennent ce qui reste après les bouteilles, lavage compris ; ils passent en tête des fûts proposés. */
  const proposition = futsQuiTiennent(cuveL === null ? undefined : Math.max(0, cuveL - bt * 0.33), kegs);
  const rang = (k: KegItem) => { const i = proposition.futs.findIndex(f => f.id === k.id); return i < 0 ? proposition.futs.length : i; };
  const libres = kegs.filter(k => k.state === 'propre' || k.batchRef === batch.id).sort((x, y) => rang(x) - rang(y));
  const aLaver = onMarquerPropres ? proposition.aLaver : [];
  const laverEtPrendre = () => {
    onMarquerPropres?.(aLaver.map(k => marquerPropre(k, swissToday())));
    setSel(s => [...s, ...proposition.futs.map(k => k.id).filter(id => !s.includes(id))]);
  };
  const pris = kegs.find(k => k.state === 'plein' && k.batchRef !== batch.id);
  const futs = libres.filter(k => sel.includes(k.id));
  const futsL = cuveL === null ? 0 : Math.min(cuveL, futs.reduce((s, k) => s + k.capacityL, 0));
  const maxBt = cuveL === null ? 0 : bouteillesMax(cuveL, futsL);
  const echelle = cuveL === null ? 0 : Math.max(10, Math.ceil(cuveL / 0.33 / 10) * 10);
  const rep = cuveL === null ? null : repartition(cuveL, Math.min(bt, maxBt), futs);
  const total = rep ? rep.totalL : 0;
  const verdict = validatePackaging({ volumeL: total > 0 ? total : null, maxL: cuveL, date, brewDate: actualBrewDate(batch) ?? undefined, today: todayISO() });
  const valide = verdict.ok;
  const og = parseDecimal(batch.og || ''), fg = parseDecimal(batch.fg || ''), abv = abvFromGravities(og, fg);
  const hier = swissToday(-1), auj = swissToday();
  const dates = datesDeMarches(batch, now);
  const conditionner = () => {
    setEssai(true);
    if (!valide || !rep) return;
    onConditionner({ packaging: { bottles33: Math.min(bt, maxBt), bottles75: batch.packaging?.bottles75 ?? 0, kegIds: sel }, volumePackagedL: rep.totalL, bottlingDate: date }, sel);
  };
  const avancer = () => batch.status === 'garde' ? conditionner() : onAvancer('garde');
  /** Le dépôt du glisser : avancer = comme le toucher ; retour et abandon ouvrent leur confirmation, jamais l'acte direct. */
  const deposer = (depot: string | null) => {
    if (depot === 'avancer') avancer();
    else if (depot === 'retour' && retour) setOuvert('retour');
    else if (depot === 'abandon') setOuvert('abandon');
  };
  const nA = (s: string) => NOMS[s] ?? s;
  const titre: React.ReactNode = ouvert === 'retour' && retour ? `${batch.name} : retour en ${nA(retour).toLowerCase()} ?`
    : batch.status === 'garde' ? <>Garde finie : {cuveL !== null ? <span className="text-water">{`≈ ${nombreFr(cuveL, 0)} L${mesure ? '' : ' visés'} à tirer`}</span> : 'volume en cuve inconnu'}</>
    : batch.status === 'conditionne' ? `${batch.name} en bouteilles et en fût`
    : batch.status === 'termine' ? `${batch.name} : tout écoulé`
    : batch.status === 'fermentation' ? `${batch.name} : et ensuite ?` : `${batch.name} : prêt à brasser ?`;

  const ligne = (i: number) => {
    const s = MARCHES[i], nom = NOMS[s];
    const premier = i === 0 && c >= 0;
    if (c < 0 && i > 0) return null;
    const dateMarche = dates[s] ? <Mono>{dates[s]}</Mono> : undefined;
    if (i < c) {
      const cible = i === c - 1 && retour === s;
      const enRetour = cible && ouvert === 'retour';
      return (
        <div key={s} className={MARCHE_LIGNE} {...(cible ? { 'data-depot': 'retour' } : {})}>
          <Rail ton={enRetour ? 'rouge' : 'fait'} premier={premier}>{enRetour ? <Palet label="Palet de retour" alerte sens="haut" /> : <Point />}</Rail>
          {enRetour
            ? <Marche cls="border-2 border-water bg-water/15" titre={nom} droite="retour ?">
                <p className="flex items-start gap-1.5 text-sm text-cave-50"><Check size={16} className="mt-0.5 shrink-0 text-hop" aria-hidden="true" />
                  <span>{batch.packaging ? <>Gardés : <Mono className="font-semibold">{batch.packaging.bottles33} × 33 cl</Mono>{batch.packaging.kegIds.map(id => <React.Fragment key={id}> · <Mono className="font-semibold">{id}</Mono></React.Fragment>)}{abv !== null && <> · <Mono className="font-semibold">{nombreFr(abv, 1)} %</Mono></>}</> : 'Rien d’autre ne change'}</span></p>
                <p className="flex items-start gap-1.5 text-sm text-cave-200"><X size={16} className="mt-0.5 shrink-0 text-alert" aria-hidden="true" /><span>{batch.stockConsumption?.appliedAt ? 'Aucun ingrédient remis en rayon' : transitionConsequence(batch, s)}</span></p>
                <div className="flex gap-2"><Cible className="min-w-0 flex-1 px-2 text-center leading-tight" onClick={() => setOuvert(null)}>{LAISSER[batch.status] ?? 'Laisser'}</Cible><Cible plein={false} className="min-w-0 flex-1 px-2 text-center leading-tight !border-alert !bg-alert !text-white" onClick={() => onRetour(s)}>Revenir en {nom.toLowerCase()}</Cible></div>
              </Marche>
            : <button type="button" disabled={!cible} onClick={() => setOuvert('retour')} className="text-left disabled:cursor-default" aria-label={cible ? `Revenir à ${nom}` : nom}>
                <Marche cls="min-h-11 justify-center border-cave-800 bg-cave-850 text-cave-50" titre={nom} droite={dateMarche} />
              </button>}
        </div>
      );
    }
    if (i === c) {
      const aVenir = MARCHES[i + 1];
      const teinte = batch.status === 'conditionne' ? teinteBiere(batch) : null;
      const vol = batch.status === 'conditionne' ? volumesConditionnes(batch, kegs.filter(k => batch.packaging?.kegIds.includes(k.id))) : null;
      const assiette = cuveL ?? batch.volumePackagedL ?? 0;
      const pertes = cuveL !== null && batch.volumePackagedL != null ? Math.max(0, cuveL - batch.volumePackagedL) : 0;
      const pct = (l: number) => `${assiette > 0 ? Math.min(100, (l / assiette) * 100) : 0}%`;
      return (
        <div key={s} className={MARCHE_LIGNE}>
          <Rail ton={batch.status === 'conditionne' || batch.status === 'termine' ? 'fait' : 'neutre'} premier={premier}>
            {ouvert === 'retour' ? <Point ton="bg-ebc-stout" />
              : batch.status === 'garde' || batch.status === 'fermentation'
              ? <Palet label={`Palet d’étape : descendre en ${NOMS[aVenir]}`} onClick={avancer} glisse={deposer} />
              : batch.status === 'conditionne' ? <Palet label="Étape actuelle" sens="ok" /> : <Point />}
          </Rail>
          <Marche cls={batch.status === 'conditionne' ? `border-2 ${teinte ? TEINTES[teinte] : 'border-ebc-amber bg-ebc-gold/15'}` : 'border-2 border-water bg-water/15 min-h-16'} titre={nom}
            droite={dateMarche}>
            {batch.status === 'conditionne' && <>
              <span className="flex items-baseline gap-1"><b className="font-mono text-3xl font-semibold tabular-nums text-cave-50">{batch.volumePackagedL != null ? nombreFr(batch.volumePackagedL, 2) : '—'}</b><span className="text-sm text-cave-400">L</span></span>
              {vol && assiette > 0 && <div data-barre-conditionne className="flex h-6 overflow-hidden rounded-control bg-cave-900 text-xs font-semibold text-cave-950">
                {vol.bouteillesL > 0 && <i className="grid place-items-center overflow-hidden bg-ebc-gold not-italic" style={{ width: pct(vol.bouteillesL) }}>{batch.packaging?.bottles33} bt</i>}
                {vol.enFutL != null && vol.enFutL > 0 && <i className="grid place-items-center overflow-hidden bg-ebc-amber not-italic" style={{ width: pct(vol.enFutL) }}>{(batch.packaging?.kegIds ?? []).join(' · ')} · {nombreFr(vol.enFutL, 1)} L</i>}
                {pertes > 0 && <i className="ml-auto not-italic" style={{ ...HACHURE_PERTES, width: pct(pertes) }} title="pertes" />}
              </div>}
              <div className="flex flex-wrap gap-1.5">{batch.packaging && <Pastille><Mono>{batch.packaging.bottles33} × 33</Mono> cl</Pastille>}{batch.packaging?.kegIds.map(id => <Pastille key={id}>fût <Mono>{id}</Mono></Pastille>)}{abv !== null && <Pastille>alcool <Mono>{nombreFr(abv, 1)}</Mono> %</Pastille>}{cuveL !== null && batch.volumePackagedL != null && <Pastille>pertes <Mono>{nombreFr(pertes, 2)}</Mono> L</Pastille>}</div>
            </>}
            {batch.status === 'garde' && <div className="flex flex-wrap gap-1.5">{fg !== null ? <Pastille ton="hop"><Check size={13} aria-hidden="true" /> FG <Mono>{nombreFr(fg, 3)}</Mono></Pastille> : <Pastille ton="attention">FG à confirmer</Pastille>}</div>}
          </Marche>
        </div>
      );
    }
    // marches à venir
    const suivante = i === c + 1 || c < 0;
    if (!suivante) {
      return (
        <div key={s} className={MARCHE_LIGNE}><Rail ton="neutre" /><Marche cls="min-h-11 justify-center border-cave-800 bg-cave-850 text-cave-400" titre={nom} /></div>
      );
    }
    if (s === 'conditionne') {
      return (
        <div key={s} className={MARCHE_LIGNE} data-depot="avancer">
          <Rail ton="neutre"><span className="absolute left-0 top-1.5 h-11 w-11 rounded-full border-2 border-dashed border-cave-600 bg-cave-900" /></Rail>
          <Marche cls="border-2 border-cave-600 bg-cave-950" titre={nom} droite={<Mono>{date.slice(0, 5)}</Mono>}>
            <div className="flex flex-wrap gap-1.5">
              <Pastille>alcool <Mono>{abv !== null ? `${nombreFr(abv, 1)} %` : '—'}</Mono></Pastille>
              {og === null && <Pastille ton="attention">OG — · à poser</Pastille>}
            </div>
            {cuveL === null ? <p role="alert" className="text-sm text-alert-strong">Volume en fermenteur inconnu : renseigne-le au jour de brassage avant de conditionner.</p> : <>
              <div className="flex items-center gap-1.5" data-curseur-bouteilles>
                <span className="w-3.5 shrink-0" aria-hidden="true"><Bouteille /></span>
                <Cible aria-label="Une bouteille de moins" onClick={() => setBt(Math.max(0, bt - 1))} className="w-8 min-h-8 px-0 text-lg">−</Cible>
                <div className="min-w-0 flex-1"><Curseur label="Bouteilles de 33 cl" min={0} max={echelle} value={Math.min(bt, echelle)} onChange={v => setBt(Math.min(v, maxBt))} cible={[0, maxBt]}
                  grads={[{ at: 0, text: '0' }, { at: Math.round(echelle / 2), text: String(Math.round(echelle / 2)) }, { at: echelle, text: String(echelle) }]} /></div>
                <Cible aria-label="Une bouteille de plus" onClick={() => setBt(Math.min(maxBt, bt + 1))} className="w-8 min-h-8 px-0 text-lg">+</Cible>
                <span className="min-w-10 text-right font-mono text-lg font-semibold text-cave-50" aria-live="polite">{Math.min(bt, maxBt)}</span>
              </div>
              {(libres.length > 0 || pris) && <div data-futs className="grid grid-cols-3 gap-1.5">
                {libres.slice(0, 5).map(k => (
                  <button key={k.id} type="button" aria-pressed={sel.includes(k.id)} onClick={() => setSel(sel.includes(k.id) ? sel.filter(x => x !== k.id) : [...sel, k.id])}
                    className={`relative flex min-h-10 items-center justify-center gap-1.5 rounded-control border text-sm font-semibold after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[''] ${sel.includes(k.id) ? 'border-hop bg-hop/15 text-cave-50' : 'border-cave-700 bg-cave-950 text-cave-50'}`}>
                    <Mono>{k.id}</Mono><span className="font-normal text-cave-400"><Mono>{nombreFr(k.capacityL, 0)}</Mono> L</span></button>))}
                {pris && <span className="flex min-h-10 items-center justify-center gap-1.5 rounded-control border border-dashed border-cave-700 bg-cave-900 text-sm font-semibold text-cave-400"><Mono>{pris.id}</Mono>{pris.beerName ?? 'pris'}</span>}
              </div>}
              {aLaver.length > 0 && <button type="button" data-a-laver onClick={laverEtPrendre}
                className="flex min-h-11 w-full flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-control border border-dashed border-cave-600 px-2.5 py-1.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-ebc-straw">
                <span className="text-sm font-semibold text-cave-50 underline underline-offset-2">{phraseALaver(aLaver.length)}</span>
                <span className="font-mono text-xs text-cave-400">{aLaver.map(k => k.id).join(', ')}</span>
              </button>}
              <div data-jauge className="flex h-7 overflow-hidden rounded-control bg-ebc-gold/25 text-xs font-semibold text-cave-950">
                {rep && rep.bouteillesL > 0 && <i className="grid place-items-center bg-ebc-gold not-italic" style={{ width: `${(rep.bouteillesL / cuveL) * 100}%` }}>{Math.min(bt, maxBt)}</i>}
                {rep?.futs.filter(f => f.litres > 0).map(f => <i key={f.id} className="grid place-items-center bg-ebc-amber not-italic" style={{ width: `${(f.litres / cuveL) * 100}%` }}>{f.id}</i>)}
                {/* Le libellé est un seul <span> : en flex, l'espace avant un <Mono> séparé disparaissait (« ≈43L »). Il ne s'affiche que tant que rien n'est posé. */}
                <i data-jauge-reste className="flex flex-1 items-center justify-center not-italic text-cave-200" style={HACHURE_PERTES}>
                  {total === 0
                    ? <span className="rounded bg-cave-950/70 px-1.5">{`≈ ${nombreFr(cuveL, 1)} L ${mesure ? 'en cuve' : 'visés'}`}</span>
                    : rep && rep.pertesL > 0.05 ? <span className="rounded bg-cave-950/70 px-1.5">{`≈ ${nombreFr(rep.pertesL, 1)} L`}</span> : null}
                </i>
              </div>
              <div data-date className="flex gap-1.5">
                <Puce actif={date === auj && !autre} onClick={() => { setDate(auj); setAutre(false); }}>Auj. <Mono>{auj.slice(0, 5)}</Mono></Puce>
                <Puce actif={date === hier && !autre} onClick={() => { setDate(hier); setAutre(false); }}>Hier</Puce>
                <Puce actif={autre} onClick={() => setAutre(true)}>Autre…</Puce>
              </div>
              {autre && <DateField value={date} onChange={setDate} label="Date de conditionnement" />}
              {essai && 'error' in verdict && <p role="alert" className="text-xs text-alert-strong">{verdict.error}</p>}
              <Cible ton="prim" plein onClick={conditionner}>Conditionner {rep ? `${nombreFr(rep.totalL, 2)} L` : ''}</Cible>
            </>}
          </Marche>
        </div>
      );
    }
    const peutAvancer = options.some(o => o.status === s && o.kind === 'forward');
    return (
      <div key={s} className={MARCHE_LIGNE} data-depot="avancer">
        <Rail ton="neutre" dernier={false}><span className="absolute left-0 top-1.5 h-11 w-11 rounded-full border-2 border-dashed border-cave-600 bg-cave-900" /></Rail>
        <Marche cls="border-2 border-cave-600 bg-cave-950" titre={nom} droite={s === 'termine' ? 'tout vendu' : undefined}>
          {peutAvancer
            ? <Cible ton={s === 'termine' ? 'sec' : 'prim'} plein={ouvert !== 'retour'} className={ouvert === 'retour' ? 'self-end min-h-8 px-3' : ''} onClick={() => onAvancer(s)}>{s === 'termine' ? 'Clôturer' : `Passer en ${nom.toLowerCase()}`}</Cible>
            : <p className="text-sm text-cave-400">{fermentationBlockedReason(batch) ?? 'Pas encore permis depuis cette étape.'}</p>}
        </Marche>
      </div>
    );
  };

  const peutAbandonner = options.some(o => o.kind === 'cancel');
  return (
    <Sheet open onClose={onClose} title={batch.name} subtitle={`${batch.id}${batch.style ? ` · ${batch.style}` : ''}`} className="md:max-w-2xl md:mx-auto"
      footer={<Button intent="secondary" full onClick={onClose}>Fermer</Button>}>
      <div className="space-y-2" data-echelle>
        <h2 className="text-2xl font-semibold leading-tight text-cave-50">{titre}</h2>
        <div className="flex flex-col">
          {MARCHES.map((_, i) => ligne(i))}
          {c < 0 && <p className="text-sm text-cave-400">Le brassage commence au jour de brassage : la fermentation suit l’ajout réel de la levure.</p>}
          {peutAbandonner && (
            <div className={MARCHE_LIGNE} data-depot="abandon">
              <Rail ton="neutre" dernier />
              {ouvert === 'abandon'
                ? <Marche cls="border-[1.5px] border-dashed border-alert bg-alert/10" titre="Abandonner le lot" style={HACHURE_ABANDON}>
                    <p className="text-sm text-cave-200">{transitionConsequence(batch, 'annule')}</p>
                    <div className="flex gap-2"><Cible className="flex-1" onClick={() => setOuvert(null)}>Garder le lot</Cible><Cible ton="danger" className="flex-1" onClick={onAbandonner}>Abandonner</Cible></div>
                  </Marche>
                : <button type="button" onClick={() => setOuvert('abandon')} className="text-left"><Marche cls="min-h-11 justify-center border-[1.5px] border-dashed border-alert bg-alert/10 text-alert" titre="Abandonner le lot" droite="toucher ou glisser ici" style={HACHURE_ABANDON} /></button>}
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
};
export const jourDuJour = (now: number) => breweryDay(now);
