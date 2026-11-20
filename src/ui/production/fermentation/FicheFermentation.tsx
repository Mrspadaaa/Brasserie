import React from 'react';
import { createPortal } from 'react-dom';
import { Boxes, Check, Ellipsis, Notebook } from 'lucide-react';
import { nombreFr } from '../../../domain/nombreAffiche';
import { Input } from '../../Input';
import { parseDecimal } from '../../numericInput';
import { JeuPictos, Picto } from '../../hopIndex/Pictos';
import { COULEURS, COURT } from '../../hopIndex/familyTokens';
import { Cible, Curseur } from '../fiche/ui';
import { GrapheTemps, geometrie, type Geometrie } from './GrapheTemps';
import { bornesMesure, titreReponse, type EtatMesure, type Houblon, type ModeleFiche } from './modele';

/**
 * Corps de la fiche d'un brassin en fermentation : le port de gfc (choix du 15.11). Le titre répond d'abord (dry hop demain),
 * puis le graphique dans le temps, les houblons pendus à leur jour par un fil, les tâches de phase, et « Mesurer » au pied.
 * Tout vient de `modeleFiche` ; une donnée absente est dite en mots, jamais un 0.
 */

const OR = 'rgb(var(--ebc-gold, 224 160 46))', VERT = 'rgb(var(--hop))';
const sansZero = (v: number) => String(v).replace('.', ',');

function useLarge(): boolean {
  const q = '(min-width: 1024px)';
  const [large, setLarge] = React.useState(() => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(q).matches);
  React.useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(q), f = () => setLarge(mq.matches);
    f(); mq.addEventListener?.('change', f);
    return () => mq.removeEventListener?.('change', f);
  }, []);
  return large;
}

/**
 * gfc n° 1 : « carnet · stock · dossier » se posent dans l'en-tête de la feuille, à côté du ×, et le titre-réponse garde sa ligne.
 * `Sheet` n'a pas de emplacement pour des actions : une sentinelle dans le corps retrouve l'en-tête de son dialogue et y insère un hôte avant « Fermer ».
 * Hors d'une feuille (aucun dialogue), les boutons restent dans le corps.
 */
function useAccesEnTete() {
  const sentinelle = React.useRef<HTMLSpanElement>(null);
  const [hote, setHote] = React.useState<HTMLElement | null>(null);
  React.useLayoutEffect(() => {
    const entete = sentinelle.current?.closest('[role="dialog"]')?.querySelector('header');
    const fermer = entete?.querySelector('button[aria-label="Fermer"]');
    if (!entete || !fermer) return;
    const div = document.createElement('div');
    div.className = 'flex shrink-0 items-center gap-0.5';
    div.setAttribute('data-acces-fiche', '');
    entete.insertBefore(div, fermer);
    setHote(div);
    return () => { div.remove(); setHote(null); };
  }, []);
  return [sentinelle, hote] as const;
}

/** gfc n° 11 : « baies » et « résineux » ont un ton cave lisible sur le fond sombre (les jetons de famille sont calibrés pour le clair). */
const TON_CAVE: Partial<Record<string, string>> = { berries: '#d48fb8', resin: '#7fc0ae' };
const TON_CLAIR: Partial<Record<string, string>> = { berries: '#9b3f74', resin: '#2f6b5f' };
const baseFamille = (id: keyof typeof COULEURS): string => {
  const cave = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'cave';
  return (cave ? TON_CAVE : TON_CLAIR)[id] ?? COULEURS[id].base;
};

interface Fil { d: string; c: string; w: number; dash?: string; noeud: [number, number] }

export interface FicheFermentationProps {
  m: ModeleFiche;
  /** « levuré » si la levure a une date, sinon « brassé ». */
  verbe: string;
  /** Ajouts réservés au brassin (ligne par article), pour l'accès « stock ». */
  reserve: string[];
  /** « Ajouté auj. » sur la carte d'un houblon : ce houblon sort du stock, les autres restent réservés (gfc n° 3 et 4). */
  onAjoute: (h: Houblon) => void;
  onAcces: (k: 'carnet' | 'dossier') => void;
  /** Coche ou décoche la tâche d'indice i (gfc n° 2). */
  onTache: (i: number) => void;
  /** Le toast sombre après un déstockage : « Stock Citra −100 g » et Annuler (gfc n° 4). */
  toast?: { nom: string; g: number; annuler: () => void } | null;
}

const FamilleBarre: React.FC<{ h: Houblon }> = ({ h }) => (
  <div className="grid items-center gap-x-1.5 gap-y-1" style={{ gridTemplateColumns: '18px 1fr 18px 1fr' }}>
    {h.familles.map(f => (
      <React.Fragment key={f.id}>
        <Picto famille={f.id} taille={18} />
        <i className="block h-2 rounded-sm" title={`${COURT[f.id]} : ${f.sources} fiches sur ${f.sur}`}
          style={{ background: `linear-gradient(90deg, ${baseFamille(f.id)} ${Math.round(f.part * 100)}%, rgb(var(--cave-850)) ${Math.round(f.part * 100)}%)` }} />
      </React.Fragment>
    ))}
  </div>
);

export const FicheFermentation: React.FC<FicheFermentationProps> = ({ m, verbe, reserve, onAjoute, onAcces, onTache, toast }) => {
  const large = useLarge();
  const [sentinelle, hote] = useAccesEnTete();
  const pend = React.useRef<HTMLDivElement>(null), graf = React.useRef<HTMLDivElement>(null);
  const [W, setW] = React.useState(0);
  const [fils, setFils] = React.useState<Fil[]>([]);
  const [stockOuvert, setStockOuvert] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = graf.current;
    if (!el) return;
    const lire = () => setW(Math.round(el.clientWidth || 340));
    lire();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(lire);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const g: Geometrie | null = W > 0 ? geometrie(W, m.nbJours, large) : null;
  const titre = titreReponse(m);
  const T = m.n;
  const houblons = [...m.houblons].sort((a, b) => (a.jour ?? 99) - (b.jour ?? 99) || a.nom.localeCompare(b.nom, 'fr'));
  const sigCle = houblons.map(h => `${h.cle}:${h.jour}`).join('|') + `|${m.houblons.map(h => h.statut).join('')}|${m.taches.length}|${toast ? 1 : 0}`;

  // les fils : du jour sur l'axe vers chaque dose (houblons) et vers chaque tâche ; mesurés sur le rendu
  React.useLayoutEffect(() => {
    const p = pend.current, gr = graf.current;
    if (!p || !gr || !g) return;
    const calc = () => {
      const P = p.getBoundingClientRect(), gb = gr.getBoundingClientRect();
      const R = (el: Element) => { const b = el.getBoundingClientRect(); return { l: b.left - P.left, r: b.right - P.left, t: b.top - P.top, b: b.bottom - P.top }; };
      const gx = gb.left - P.left, gy = gb.top - P.top, start = gy + g.ya + 46, yAx = gy + g.ya + 48;
      const out: Fil[] = [];
      houblons.forEach(h => {
        if (h.jour === null || h.jour < 0 || h.jour >= m.nbJours) return;
        const carte = p.querySelector(`[data-houblon="${h.cle}"]`), dose = carte?.querySelector('[data-dose]');
        if (!carte || !dose) return;
        const c = R(carte), dd = R(dose), yh = (dd.t + dd.b) / 2;
        const fait = h.statut === 'fait';
        const jour = fait ? (h.ajout?.jour ?? T) : h.jour, xd = gx + g.cx(jour), col = fait ? VERT : OR, auj = jour === T;
        if (!large) {
          if (!auj) out.push({ d: `M${xd} ${start}V${yh}H${c.r - 1}`, c: col, w: 2.5, noeud: [c.r, yh] });
          else out.push({ d: `M${xd} ${start}V${c.t}`, c: col, w: 2.5, noeud: [xd, c.t] });
        } else {
          const ym = yAx - 4 + (auj ? -8 : 0), xr = c.l - 28 - (auj ? 10 : 0);
          out.push({ d: `M${xd} ${start}V${ym + 6}H${xr}V${yh}H${c.l - 1}`, c: col, w: 2.5, noeud: [c.l, yh] });
        }
      });
      m.taches.forEach((t, i) => {
        if (t.jour >= m.nbJours) return;
        const el = p.querySelector(`[data-tache="${i}"]`);
        if (!el) return;
        const c = R(el), x = gx + g.cx(t.jour), ton = m.phases.find(f => f.de === t.jour)?.ton;
        out.push({ d: `M${x} ${gy + g.ya + 46}V${c.t}`, c: ton === 'water' ? 'rgb(var(--water))' : 'rgb(var(--attention))', w: 1.5, dash: '3 3', noeud: [x, c.t] });
      });
      setFils(out);
    };
    calc();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(calc);
    ro.observe(p);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W, large, sigCle]);

  const acces = [
    { k: 'carnet', nom: 'Carnet du brassin', texte: 'carnet', icone: <Notebook size={18} aria-hidden="true" />, f: () => onAcces('carnet') },
    { k: 'stock', nom: 'Stock réservé au brassin', texte: 'stock', icone: <Boxes size={18} aria-hidden="true" />, f: () => setStockOuvert(o => !o) },
    { k: 'dossier', nom: 'Dossier : budget, installation, OG, jour brassé, volume, suppression', texte: 'dossier', icone: <Ellipsis size={18} aria-hidden="true" />, f: () => onAcces('dossier') }
  ] as const;
  const boutons = acces.map(a => (
    <button key={a.k} type="button" aria-label={a.nom} aria-pressed={a.k === 'stock' ? stockOuvert : undefined} onClick={a.f}
      className="relative flex min-h-9 min-w-11 flex-col items-center justify-center gap-0.5 text-xs leading-none text-cave-400 after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']">
      <span className="text-cave-50">{a.icone}</span>{a.texte}
    </button>
  ));

  return (
    <div data-fiche-fermentation className="space-y-0">
      <JeuPictos />
      <span ref={sentinelle} hidden />
      {hote ? createPortal(boutons, hote) : <div className="flex justify-end gap-0.5" data-acces-fiche>{boutons}</div>}
      <div className="px-0.5 pb-2">
        <p className="text-sm text-cave-200"><b className="font-semibold tabular-nums">J+{m.n}</b> · {verbe} le <span className="tabular-nums">{m.depart.slice(0, 5)}</span></p>
        <h2 className="text-[28px] leading-[1.1] font-semibold text-cave-50" data-reponse>
          {titre.repos}{titre.accent && <> <span data-reponse-accent style={{ color: 'rgb(var(--ebc-gold-texte))' }}>{titre.accent}</span></>}
        </h2>
      </div>
      {stockOuvert && (
        <section aria-label="Stock réservé au brassin" className="mb-2 rounded-control border border-cave-800 bg-cave-950 p-2 text-sm text-cave-200">
          {reserve.length
            ? <><p className="font-semibold text-cave-50">Réservé pour ce brassin</p><ul className="mt-1 space-y-0.5">{reserve.map(l => <li key={l}>{l}</li>)}</ul></>
            : <p>{m.ajoutsFaits ? 'Les ajouts de fermentation sont déstockés.' : 'Rien n’est réservé au stock pour ce brassin.'}</p>}
        </section>
      )}
      <div className="flex items-baseline justify-between px-0.5 pb-1 text-xs text-cave-400">
        <span className="font-semibold text-cave-200">Densité</span>
        <span>
          {m.alcool !== null ? <>alc. <span className="tabular-nums">{nombreFr(m.alcool, 1)} %</span></> : 'alc. non calculé'}
          {' · '}{m.attenuation !== null ? <>att. <span className="tabular-nums">{m.attenuation} %</span></> : 'att. non calculée'}
          {!m.fgConfirmee && ' · provisoires'}
        </span>
      </div>
      <div ref={pend} className="relative" data-pend>
        <div className="lg:grid lg:items-start lg:gap-x-16" style={large ? { gridTemplateColumns: houblons.length > 0 ? 'minmax(0,1fr) 23rem' : 'minmax(0,1fr)' } : undefined}>
          <div ref={graf} className="relative lg:col-start-1 lg:row-start-1" data-graphe>
            {g && <GrapheTemps m={m} g={g} />}
          </div>
          <div className={`relative z-[1] mt-2.5 flex items-start justify-between gap-2 lg:contents`}>
            {houblons.length > 0 && (
              <div className="flex w-[55%] flex-col gap-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:w-auto" data-duo>
                {houblons.map(h => {
                  const c = h.signature ? baseFamille(h.signature) : 'rgb(var(--cave-700))';
                  const fait = h.statut === 'fait';
                  return (
                    <section key={h.cle} data-houblon={h.cle} {...(fait ? { 'data-fait': '' } : {})} aria-label={`${h.nom}, ${sansZero(h.doseG)} g`}
                      className={`flex flex-col gap-1.5 rounded-control border border-l-[5px] bg-cave-950 px-2 pb-2 pt-1.5 ${fait ? 'border-hop' : 'border-cave-800'}`}
                      style={{ borderLeftColor: c }}>
                      <header className="flex items-baseline justify-between gap-1.5">
                        <h3 className="text-lg font-semibold text-cave-50">{h.nom}</h3>
                        {fait && h.ajout && <span data-ajout-date className="font-mono text-xs font-semibold text-hop">{h.ajout.date}</span>}
                        <span data-dose className="whitespace-nowrap font-mono text-2xl font-semibold leading-none tabular-nums text-cave-50">{sansZero(h.doseG)}<small className="font-sans text-sm font-normal text-cave-400"> g</small></span>
                      </header>
                      <div className="flex flex-wrap items-baseline gap-x-1 text-[13px] leading-snug text-cave-400">
                        {h.associe
                          ? <>
                              <span className="whitespace-nowrap"><b className="font-semibold text-cave-50">α du lot</b> {h.alpha !== null ? <span className="tabular-nums">{sansZero(h.alpha)} %</span> : '—'}</span>
                              {h.plage && <span className="whitespace-nowrap">· fiches <span className="tabular-nums">{sansZero(h.plage[0])}–{sansZero(h.plage[1])} %</span></span>}
                              {h.role && <span className="whitespace-nowrap">· {h.role}</span>}
                            </>
                          : <span>Variété hors du catalogue : pas de fiche à montrer.</span>}
                      </div>
                      {h.familles.length > 0 && <FamilleBarre h={h} />}
                      {fait
                        ? <div className="flex min-h-11 items-center justify-center gap-2 rounded-control border border-hop bg-hop text-sm font-semibold text-cave-950" aria-label="Ajouté, déstocké">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                            <span className="tabular-nums">−{sansZero(h.doseG)} g au stock</span>
                          </div>
                        : h.statut === 'afaire'
                          ? <Cible onClick={() => onAjoute(h)} className="min-h-11 gap-2 text-sm" data-ajoute><i className="grid h-6 w-6 place-items-center rounded border-2 border-cave-700 bg-cave-950" />Ajouté auj.</Cible>
                          : <p className="text-xs text-cave-400">Pas d’ajout réservé au stock pour ce houblon.</p>}
                    </section>
                  );
                })}
              </div>
            )}
            {(m.taches.length > 0 || toast) && (
              <div className="mt-[22px] flex w-[37%] flex-col gap-2.5 lg:col-start-1 lg:row-start-2 lg:mt-3.5 lg:grid lg:w-auto lg:gap-0"
                style={large ? { gridTemplateColumns: `repeat(${m.nbJours}, minmax(0, 1fr))` } : undefined} data-taches>
                {toast && (
                  <div role="status" data-toast-stock className="flex min-h-11 items-center justify-between gap-2 rounded-control bg-cave-50 px-2.5 text-sm leading-tight lg:mb-2"
                    style={{ color: 'rgb(var(--cave-950))', ...(large ? { gridColumn: '1 / span 6', gridRow: 2 } : {}) }}>
                    <span>Stock <b className="tabular-nums">{toast.nom} −{sansZero(toast.g)} g</b></span>
                    <button type="button" onClick={toast.annuler} className="relative min-h-11 px-1 font-semibold underline underline-offset-2 after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']">Annuler</button>
                  </div>
                )}
                {m.taches.map((t, i) => (
                  <div key={`${t.jour}-${t.titre}`} data-tache={i} {...(t.faite ? { 'data-faite': '' } : {})} role="group" aria-label={`${t.titre}, J+${t.jour}`}
                    className={`flex min-h-16 items-start gap-0.5 rounded-control border bg-cave-950 py-0.5 pl-0.5 pr-2 text-left text-sm font-semibold leading-tight text-cave-50 lg:mr-1.5 ${t.faite ? 'border-hop/70' : 'border-cave-700'}`}
                    style={large ? { gridColumn: `${Math.min(t.jour + 1, m.nbJours - 1)} / span 2`, gridRow: 1 } : undefined}>
                    <button type="button" role="checkbox" aria-checked={t.faite} aria-label={`Cocher : ${t.titre}, J+${t.jour}`} onClick={() => onTache(i)}
                      className="relative grid h-11 w-11 shrink-0 place-items-center">
                      <i className={`grid h-6 w-6 place-items-center rounded border-2 ${t.faite ? 'border-hop bg-hop text-cave-950' : 'border-cave-700 bg-cave-950'}`}>
                        {t.faite && <Check size={16} strokeWidth={3.5} aria-hidden="true" />}
                      </i>
                    </button>
                    <div className="flex min-w-0 flex-col gap-1 pt-1.5">
                      <small className={`font-mono text-xs font-normal tabular-nums ${t.faite ? 'text-hop' : 'text-cave-400'}`}>J+{t.jour} · {t.date}</small>
                      <span>{t.titre}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <svg className="pointer-events-none absolute left-0 top-0 z-0 h-full w-full overflow-visible" aria-hidden="true">
          {fils.map((f, i) => (
            <g key={i}><path d={f.d} fill="none" stroke={f.c} strokeWidth={f.w} strokeLinejoin="round" strokeDasharray={f.dash} /><circle cx={f.noeud[0]} cy={f.noeud[1]} r={4} fill={f.c} /></g>
          ))}
        </svg>
      </div>
    </div>
  );
};

/** gfc n° 6 : une température se règle au curseur (jamais `type="number"`), « Taper » ouvre le clavier décimal, « Non relevée » efface. Sans geste, rien n'est enregistré : le curseur part de la consigne, la valeur reste « non relevée ». */
const ChampTemp: React.FC<{ titre: string; label: string; valeur: string; depart: number; onChange: (v: string) => void }> = ({ titre, label, valeur, depart, onChange }) => {
  const [taper, setTaper] = React.useState(false);
  const dixiemes = (t: string) => { const v = parseDecimal(t); return v === null ? null : Math.round(v * 10); };
  const texte = (d: number) => (d / 10).toFixed(1).replace('.', ',');
  const lu = dixiemes(valeur);
  const courant = Math.max(0, Math.min(300, lu ?? Math.round(depart * 10)));
  const btn = "relative min-h-9 px-2 text-sm text-ebc-straw underline underline-offset-2 after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']";
  return (
    // CT4-B-10 : « non relevée » ne pose pas de pouce (il disait 15 °C au milieu de la piste) ; il paraît au premier geste. Un toucher qui ne bouge pas
    // le curseur (même position que le départ) ne lance aucun changement : on lit alors la valeur du curseur au lever du doigt et on la pose.
    <div className={`space-y-0.5${lu === null && !taper ? ' [&_[data-curseur]_span.pointer-events-none]:hidden' : ''}`} data-temp={label} {...(lu === null ? { 'data-sans-valeur': '' } : {})}
      onPointerUp={lu === null && !taper ? e => {
        const piste = (e.target as HTMLElement).closest('[data-curseur]')?.querySelector<HTMLInputElement>('input[type="range"]');
        if (piste && piste.value !== '') onChange(texte(Number(piste.value)));
      } : undefined}>
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold text-cave-50">{titre}</h4>
        <span className="flex items-baseline gap-1">
          {valeur.trim() !== '' && !taper && <button type="button" className={btn} onClick={() => onChange('')}>Non relevée</button>}
          <button type="button" className={btn} onClick={() => setTaper(t => !t)}>{taper ? 'Curseur' : 'Taper'}</button>
        </span>
      </div>
      {taper
        ? <Input aria-label={label} inputMode="decimal" value={valeur} placeholder="ex. 19,5" onChange={e => onChange(e.target.value)}
            className="w-full min-h-touch px-3 rounded-control bg-cave-950 border border-cave-700 font-mono text-xl text-cave-50" />
        : <>
            <p className={`font-mono text-2xl font-semibold tabular-nums ${lu === null ? 'text-cave-400' : 'text-cave-50'}`} aria-live="polite">{lu === null ? 'non relevée' : `${texte(lu)} °C`}</p>
            <Curseur label={label} min={0} max={300} step={1} value={courant} format={v => `${texte(v)} °C`}
              grads={[{ at: 0, text: '0' }, { at: 300, text: '30 °C' }]} onChange={v => onChange(texte(v))} />
          </>}
    </div>
  );
};

/** Le geste « Mesurer » (m2) : curseur de densité sur la bande FG, « Taper » au clavier, °C de l'échantillon et °C de la cuve, chacun au curseur et facultatif. Jamais `type="number"`. */
export const PanneauMesure: React.FC<{ m: ModeleFiche; etat: EtatMesure; onChange: (e: EtatMesure) => void; /** CT4-B-11 : sans FG visée dans la recette, la plage de la levure (même calcul que la fiche recette). */ fgPlage?: [number, number] | null }> = ({ m, etat, onChange, fgPlage }) => {
  const [min, max] = bornesMesure(m);
  const bande = m.fg ?? fgPlage ?? null;
  const cible: [number, number] | null = bande ? [Math.round(bande[0] * 1000), Math.round(bande[1] * 1000)] : null;
  const sg = (v: number) => (v / 1000).toFixed(3).replace('.', ',');
  // Les bornes seules : la bande visée est dessinée sur la piste et dite dessous (ses deux graduations se chevauchaient).
  const grads = [{ at: min, text: sg(min) }, { at: max, text: sg(max) }];
  const depart = m.consigne ?? 18;
  return (
    <section aria-label="Mesurer" data-mesure className="space-y-2 rounded-control border border-cave-700 bg-cave-900 p-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-cave-50">Densité du jour</h3>
        <button type="button" className="relative min-h-9 px-2 text-sm text-ebc-straw underline underline-offset-2 after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']"
          onClick={() => onChange({ ...etat, taper: !etat.taper, saisie: etat.taper ? etat.saisie : sg(etat.milli), erreur: '' })}>{etat.taper ? 'Curseur' : 'Taper'}</button>
      </div>
      {etat.taper
        ? <Input aria-label="Densité du relevé" inputMode="decimal" autoFocus value={etat.saisie} placeholder="1,016"
            onChange={e => onChange({ ...etat, saisie: e.target.value, erreur: '' })}
            className="w-full min-h-touch px-3 rounded-control bg-cave-950 border border-cave-700 font-mono text-2xl text-cave-50" />
        : <>
            <p className="font-mono text-3xl font-semibold tabular-nums text-cave-50" aria-live="polite">{sg(etat.milli)}</p>
            <Curseur label="Densité du relevé" min={min} max={max} step={1} value={etat.milli} cible={cible} grads={grads} format={sg}
              onChange={v => onChange({ ...etat, milli: v, erreur: '' })} />
            <div className="flex items-center justify-between gap-2 text-sm text-cave-400">
              <Cible aria-label="Un millième de moins" onClick={() => onChange({ ...etat, milli: Math.max(min, etat.milli - 1), erreur: '' })} className="w-12 px-0 text-lg">−</Cible>
              <span>{cible ? (m.fg ? `bande visée ${sg(cible[0])}–${sg(cible[1])}` : `FG ${sg(cible[0])}–${sg(cible[1])} · plage de la levure`) : 'pas de FG visée dans la recette'}</span>
              <Cible aria-label="Un millième de plus" onClick={() => onChange({ ...etat, milli: Math.min(max, etat.milli + 1), erreur: '' })} className="w-12 px-0 text-lg">+</Cible>
            </div>
          </>}
      <ChampTemp titre="°C cuve" label="Température de la cuve" valeur={etat.cuve ?? ''} depart={depart} onChange={v => onChange({ ...etat, cuve: v, erreur: '' })} />
      <ChampTemp titre="°C échantillon" label="Température de l’échantillon" valeur={etat.temp} depart={depart} onChange={v => onChange({ ...etat, temp: v, erreur: '' })} />
      <p className="text-xs text-cave-400">Facultatif : une température non relevée reste vide, jamais la consigne.</p>
      {etat.erreur && <p role="alert" className="text-sm text-alert">{etat.erreur}</p>}
    </section>
  );
};

/** Pied de la feuille : « Mesurer » au repos ; Annuler et Enregistrer pendant le geste. */
export const PiedFermentation: React.FC<{ ouvert: boolean; ouvrir: () => void; annuler: () => void; enregistrer: () => void }> = ({ ouvert, ouvrir, annuler, enregistrer }) => (
  ouvert
    ? <div className="flex gap-2"><Cible onClick={annuler}>Annuler</Cible><Cible ton="prim" className="flex-1 min-h-12 text-base" onClick={enregistrer}>Enregistrer le relevé</Cible></div>
    : <Cible ton="prim" plein onClick={ouvrir} className="min-h-12 flex-col gap-0 text-base leading-tight"><span>Mesurer</span><small className="text-xs font-normal opacity-85">densité · °C cuve</small></Cible>
);
