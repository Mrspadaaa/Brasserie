/** La rubrique Quand du carnet ouvert (C1, K2, D2 ; 21.11), sortie de CarnetOuvert.tsx. */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { Horizons } from '../saisie/Horizons';
import { DureeFenetre } from '../calendrier/frise/DureeFenetre';
import { plageDate } from '../plageDate';
import { lundiDe } from '../../domain/calendrier';
import { MOIS_COURTS } from '../../domain/calendrier/dates';
import { ORDRES_DE_GRANDEUR } from '../../domain/horizons';
import { dateDite, jourDit } from '../../domain/carnets/dateDite';
import { montant } from './EtatIA';

/** R78-7 (c78) : l'espace des milliers d'une puce de prix est une espace insécable VISIBLE (« 1 000 CHF ») : l'espace fine insécable de `montant` est rendue à zéro par la police des puces (« 1000 CHF »). */
const montantVu = (centimes?: number): string | null => montant(centimes)?.replace(/\u202F/g, '\u00A0') ?? null;
import type { CarnetOuvertProps } from './carnetOuvertTypes';

/**
 * R78-6 (c78) : la réglette des mois dit l'année d'un mois qui n'est pas de l'année en cours, et au passage d'année (« juin 2027 », « janv. 2027 »), jamais l'année partout.
 * L'année d'un mois est celle de la date la plus proche du repère de la réglette (la frise est centrée sur lui). La frise est celle du Calendrier (hors de cette voie) :
 * l'année s'ajoute à son texte ici, idempotente (le mot du mois est relu avant l'espace), rejouée quand la frise se redessine.
 */
const sansPoint = (m: string) => m.replace(/\./g, '');
export function anneesSurLesMois(frise: HTMLElement, repere: string, aujourdhui: string): void {
  const petites = [...frise.querySelectorAll<HTMLElement>('.cal-f-duree-rep-mois small')];
  const cible = Date.parse(`${repere}T12:00:00Z`), courante = Number(aujourdhui.slice(0, 4));
  if (!petites.length || !Number.isFinite(cible)) return;
  const lignes = petites.map(el => {
    const mot = (el.textContent ?? '').trim().split(' ')[0];
    const m = MOIS_COURTS.findIndex(x => sansPoint(x) === sansPoint(mot));
    if (m < 0) return null;
    const base = Number(repere.slice(0, 4));
    const annee = [base - 1, base, base + 1].map(y => ({ y, d: Math.abs(Date.parse(`${y}-${String(m + 1).padStart(2, '0')}-04T12:00:00Z`) - cible) })).sort((a, b) => a.d - b.d)[0].y;
    return { el, mot, annee };
  });
  lignes.forEach((l, i) => {
    if (!l) return;
    const avant = i > 0 ? lignes[i - 1] : null;
    const dit = l.annee !== courante && (i === 0 || !avant || avant.annee !== l.annee);
    const voulu = dit ? `${l.mot} ${l.annee}` : l.mot;
    if ((l.el.textContent ?? '') !== voulu) l.el.textContent = voulu;
  });
}

export const jourLocal = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * « juste, aujourd'hui, dans 1 mois, dans 3 mois… 6m 1 ans » : une rubrique à filet comme les autres (aucun élément neuf : picto, mot,
 * état en gris, puces du carnet). Un toucher date le projet (« vers févr. »), un autre le reporte. Daté, le prix : le dernier achat
 * semblable à garder d'un toucher (« Pompe 2025 : 420 CHF »), sinon les ordres de grandeur ; posé, « estimé » jusqu'à la facture.
 * Q-5 A (D435, q5-a.png) : au repos, repliée en une ligne « Quand · cette semaine · prix ? › » (40 mots au plus pour le carnet) ; un
 * toucher rouvre les puces, la frise, les pastilles et Au calendrier. Q-1b B (q1b-b.png) : en tête des pastilles, le prix que le carnet
 * connaît déjà, « 400 CHF · budget » (son critère) ou le prix lu d'un lien (« · lu »).
 */
export function RubriqueQuand(p: { /** R73-24 (c78) : le projet est dans À venir (sa pastille le dit) : une date passée y est « en retard », jamais « passé » (un seul état) */ dansAVenir?: boolean; /** R96 (c74c) : le début du projet du Planning (AAAA-MM-JJ) : tant que la date est celle de l'import, Quand dit CE jour, pas le lundi d'avant */ planning?: string; /** R101 (c75) : la fin du projet du Planning : la date du plan (le dernier jour) reste « celle de l'import » tant qu'elle est dans le projet */ planningAu?: string; date?: string; precision?: 'semaine' | 'mois'; aujourdhui: string; neuf: boolean; picto: number; onDater: (lundi: string | null, precision?: 'semaine' | 'mois') => void; onAuCalendrier?: () => void;
  prix?: CarnetOuvertProps['prix']; onPrix?: (centimes: number) => void }) {
  /* D431 (GESTE-DATE-PARTOUT, CA12-PW-2) : sous les puces raccourcis, la frise partagée du Calendrier (`DureeFenetre seule`, rangée achats) ; le repère
     suit le doigt (brouillon), la date s'écrit au lâcher (`onDater(lundi)`), jamais à chaque pas. Sans date, le repère attend sur cette semaine, estompé. */
  const lundiPose = p.date && /^\d{4}-\d{2}-\d{2}/.test(p.date) ? lundiDe(p.date.slice(0, 10)) : null;
  const [tire, setTire] = useState<string | null>(null);
  const tireRef = useRef<string | null>(null);
  useEffect(() => { tireRef.current = null; setTire(null); }, [lundiPose]);
  /* R101 (c75) : tant que la date est celle de l'import (le lundi du début, ou un jour du projet : le plan porte son dernier jour), Quand dit le début, avec son année, comme À faire (« 1 mai 2027 »), jamais « S26 » */
  const dansLeProjet = !!p.planning && !!lundiPose && (lundiDe(p.planning) === lundiPose || (!!p.planningAu && lundiPose >= lundiDe(p.planning) && lundiPose <= p.planningAu));
  const jourPlanning = p.planning && dansLeProjet && !tire && p.planning >= p.aujourdhui ? jourDit(p.planning, p.aujourdhui) : null;
  /* R105 (c77) : la même fonction de date que la liste et À faire (`dateDite`) : l'année quand elle n'est pas celle d'aujourd'hui, jamais autrement */
  const enRetard = (t: string | null) => (t && p.dansAVenir ? t.replace(/^passé/, 'en retard') : t);
  const quand = tire ? dateDite(tire, p.aujourdhui, 'semaine') : jourPlanning ?? enRetard(dateDite(p.date, p.aujourdhui, p.precision));
  /* R75-8 (c78) : la réglette est posée sur LA date que Quand dit (le début du projet du Planning), pas sur la fin ; une seule date, une seule semaine */
  const repereFrise = jourPlanning && p.planning ? lundiDe(p.planning) : lundiPose;
  const friseRef = useRef<HTMLDivElement>(null);
  const feuilleRef = useRef<HTMLElement>(null);
  const plage = plageDate(lundiPose ?? p.aujourdhui, p.aujourdhui);
  const [changerPrix, setChangerPrix] = useState(false);
  const pose = p.prix?.centimes;
  /* C46-4 (Q-1 A) : le prix de l'article choisi remplace l'estimé ; il ne s'appelle plus « estimé » */
  const mot = p.prix?.choisi ? '' : ' estimé';
  const semblable = p.prix?.semblable;
  const garder = (x: number) => { p.onPrix?.(x); setChangerPrix(false); };
  const [ouvert, setOuvert] = useState(false);
  const propose = p.prix?.propose;
  /* R73-15 (c78) : toucher Quand AMÈNE la feuille ouverte à l'écran (dans un carnet long, ses puces et sa réglette s'ouvraient sous la barre du bas, hors de vue) */
  useEffect(() => { if (ouvert) feuilleRef.current?.scrollIntoView?.({ block: 'nearest' }); }, [ouvert]);
  const reperePose = tire ?? repereFrise ?? lundiDe(p.aujourdhui);
  useLayoutEffect(() => {
    const el = friseRef.current;
    if (!ouvert || !el) return;
    const poser = () => anneesSurLesMois(el, reperePose, p.aujourdhui);
    poser();
    if (typeof MutationObserver === 'undefined') return;
    const obs = new MutationObserver(poser);
    obs.observe(el, { childList: true, subtree: true, characterData: true });
    return () => obs.disconnect();
  }, [ouvert, reperePose, p.aujourdhui]);
  if (!ouvert) {
    const resume = [quand ?? 'pas encore daté', pose !== undefined ? `${montantVu(pose)} CHF${mot}` : p.prix?.propose?.source === 'budget' ? `${montantVu(p.prix.propose.centimes)} CHF · budget` : quand && p.onPrix ? 'prix ?' : null].filter(Boolean).join(' · ');
    return (
      <section className={`cn-rubrique cn-quand${p.neuf ? ' cn-rubrique-ligne' : ''}`} aria-label="Quand">
        <button type="button" className="cn-rubrique-tete cnq-replie" aria-expanded={false} data-quand-replie="" onClick={() => setOuvert(true)}>
          <CalendarDays size={p.picto} aria-hidden /> <b>Quand</b> <span className="cn-mut cn-sp">· {resume}</span><ChevronRight size={16} aria-hidden className="cnq-chevron" />
        </button>
      </section>
    );
  }
  return (
    <section ref={feuilleRef} className={`cn-rubrique cn-quand${p.neuf ? ' cn-rubrique-ligne' : ''}`} aria-label="Quand">
      <p className="cn-rubrique-tete"><button type="button" className="cnq-replier" aria-expanded onClick={() => setOuvert(false)}><CalendarDays size={p.picto} aria-hidden /> <b>Quand</b></button> <span className="cn-mut">· {quand ?? 'pas encore daté'}</span>
        {quand && pose !== undefined && <span className="cn-mut"> · {montantVu(pose)} CHF{mot}</span>}
        {quand && pose !== undefined && p.onPrix && <> <button type="button" className="cn-lien" aria-expanded={changerPrix} onClick={() => setChangerPrix(v => !v)}>Prix</button></>}</p>
      <Horizons date={p.date} aujourdhui={p.aujourdhui} classePuce="cn-puce" className="cn-horizons" onChoisir={(_, lundi) => p.onDater(lundi)} />
      <div ref={friseRef} className="cn-quand-frise" data-quand-frise data-valeur={repereFrise ?? undefined} data-vide={repereFrise || tire ? undefined : ''}>
        <DureeFenetre seule rangee="achats" debut={tire ?? repereFrise ?? lundiDe(p.aujourdhui)} fin={null} onFin={() => undefined}
          epoque={plage.epoque} dernier={plage.dernier}
          onPlage={d => { tireRef.current = d; setTire(d); }}
          onLacher={() => { const d = tireRef.current; if (d && d !== lundiPose) p.onDater(d, 'semaine'); else { tireRef.current = null; setTire(null); } }} />
      </div>
      {quand && p.onPrix && (pose === undefined || changerPrix) && (
        <div role="group" aria-label="Prix estimé" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 }}>
          {/* les montants seuls ne disaient pas ce qu'ils sont : le mot en gris, comme l'état d'une rubrique */}
          <span className="cn-mut" aria-hidden>Prix estimé ?</span>
          {propose && <button type="button" className="cn-puce" data-prix-propose={propose.source} aria-pressed={pose === propose.centimes} onClick={() => garder(propose.centimes)}>{montantVu(propose.centimes)} CHF <span className="cn-mut">· {propose.source === 'budget' ? 'budget' : 'lu'}</span></button>}
          {semblable
            ? <button type="button" className="cn-puce" onClick={() => garder(semblable.centimes)}>{semblable.source} : {montantVu(semblable.centimes)} CHF · garder</button>
            : ORDRES_DE_GRANDEUR.map(x => <button key={x} type="button" className="cn-puce" aria-pressed={pose === x} onClick={() => garder(x)}>{montantVu(x)} CHF</button>)}
        </div>
      )}
      {p.onAuCalendrier && <button type="button" className="cn-second cn-quand-cal" onClick={p.onAuCalendrier}>Au calendrier <ChevronRight size={16} aria-hidden /></button>}
    </section>
  );
}
