import React from 'react';
import { Beer, CalendarCheck, CalendarDays, Check, ChevronRight, Ellipsis, Link2, Pencil, Receipt, ShoppingCart, Trash2, Unlink, Wallet, Wheat, X } from 'lucide-react';
import { ETAPE_BRASSIN, couleurEtape, encreEtape, type EtapeBrassin } from './etapes';
import { RenommerSurPlace } from '../../saisie/RenommerSurPlace';
import { libelleRetirer } from '../../../domain/calendrierGestes';
import { ajouterJours, dateDeSemaine, ecartJours, etiquetteS, francsSignes, jourLisible, lundiDe, type ChoseCalendrier, type JalonBrassin, type JalonId } from '../../../domain/calendrier';
import { CLASSE_TEINTE, ICONE_RANGEE, apercuSansNom, champ, dureeVue, lieMontre, nomLie } from './Marque';
import type { LiensPossibles } from './MenuAppuiLong';
import './fiche.css';

/**
 * La fiche d'une chose du Calendrier (D412, 21.11) : v02 « Pastilles chiffrées » avec ses modifications. Au repos, ≤ 120 px à 390 et pleine
 * largeur : une souche colorée à gauche (v07 : picto d'état, J79, « en garde »), le nom renommable, le montant et ×, des pastilles icône + valeur
 * (début, fin, CHF inconnu en pointillé, manque en rouge), puis les actions (Ouvrir › large, trois actions en icône + mot, ⋯). Action à la volée :
 * une pastille de date touchée s'élargit en règle avec un pouce, la date bouge en direct et s'écrit au lâcher (Annuler dans le message). Un volet
 * à la fois (v04) : la souche ouvre le fil des étapes datées (v09) et les notes, le manque ouvre les achats, Lier ses puces, ⋯ le reste
 * (Mettre de côté, Ranger sans date, Délier, Supprimer : CHE-2). Jamais « en retard de N j » (D-19) : des dates.
 */

export interface DetailChoseProps {
  chose: ChoseCalendrier;
  /** Le libre de la semaine de la chose, en centimes ; absent : courbe inconnue. */
  libreSemaine?: number | null;
  /** Une promesse liée à ce brassin (« 3 fûts promis le 15 déc. »). */
  promesse?: string | null;
  onFermer: () => void;
  onOuvrir: () => void;
  onCommander?: () => void;
  onBudget?: () => void;
  onModifier?: () => void;
  /** RENOMMER-EVT (R1), CHE-5 : toucher le nom l'ouvre en champ sur place, Entrée renomme ; absent : le nom reste du texte. */
  onRenommer?: (nom: string) => void;
  onRetirer?: () => void;
  /** CHE-2 : une chose créée se supprime (effacée ; Annuler dans le message). */
  onSupprimer?: () => void;
  onFait?: () => void;
  onPoser?: () => void;
  onAccepter?: () => void;
  /** Une vente prévue : « Facturer › » (E37, D-99). */
  onFacturer?: () => void;
  onMettreDeCote?: (actif: boolean) => void;
  /** Lot A du test en ligne (18.11, n° 2, D386) : à quoi la chose peut se lier, les mêmes puces que l'appui long. Avec `onLier`. */
  liens?: LiensPossibles;
  onLier?: (liens: { batchId?: string; clientId?: string; evenementId?: string }, nom: string) => void;
  /** Lot C : retirer les liens de la chose (brassin, client, fête) ; `nom` : à quoi elle était liée, pour le message. */
  onDelier?: (nom: string) => void;
  /** D412, CHE-5 : la pastille du début réglée à la volée, en jours (brassin : le jour du brassage, ses étapes suivent). */
  onDecalerDebut?: (jours: number) => void;
  /** D412 : la pastille de fin réglée à la volée, en jours (brassin : la fin prévue). */
  onDecalerFin?: (jours: number) => void;
}

const LIBELLE_OUVRIR: Record<ChoseCalendrier['ouvre']['ecran'], string> = {
  brassin: 'Ouvrir le brassin', piece: 'Ouvrir la pièce', plan: 'Ouvrir dans Finances', finances: 'Ouvrir dans Finances', agenda: 'Ouvrir dans l’agenda',
  atelier: 'Ouvrir dans l’atelier', materiel: 'Ouvrir dans le matériel', courses: 'Ouvrir les courses', fournisseur: 'Ouvrir le fournisseur', solde: 'Ouvrir Solde', carnets: 'Ouvrir dans les carnets'
};

const ETAPE = ETAPE_BRASSIN;
/** Une date sans point final doublé : « 22 nov. » se suit d'un deux-points, d'une virgule ou de rien, jamais de « . ». */
const date = (iso: string): string => jourLisible(iso);
/** Px de règle par jour : un glissé de 24 px fait 3 j. */
export const PX_JOUR = 8;
const BORNE_JOURS = 120;

/** Le détail sans son morceau « le 10 déc. » quand c'est la date de la chose (déjà dite par « Date ») ; `undefined` s'il ne reste rien. */
export function sansLaDate(detail: string | undefined, debut: string | undefined): string | undefined {
  if (!detail || !debut) return detail || undefined;
  const jour = date(debut);
  const reste = detail.split(' · ').filter(m => m.trim() !== `le ${jour}` && m.trim() !== jour).join(' · ').trim();
  return reste || undefined;
}

/** CRITIQUE-10 n° 4 : « S49 » puis sa plage insécable sur sa propre ligne, jamais coupée au milieu. */
function texteSemaine(semaine: string): React.ReactNode {
  const i = semaine.indexOf(', ');
  if (i < 0) return <span className="cal-nowrap" data-plage>{semaine}</span>;
  return <><span className="cal-nowrap">{semaine.slice(0, i)}</span><span className="cal-nowrap block" data-plage>{semaine.slice(i + 2)}</span></>;
}

/** CRITIQUE-12 n° 3 : chaque date (avec le mot qui la précède : « prête 21 déc. ») est un bloc insécable. */
const DATE_LISIBLE = /(?:[\p{L}’']+ )?\d{1,2} (?:janv\.|févr\.|mars|avr\.|mai|juin|juil\.|août|sept\.|oct\.|nov\.|déc\.)/gu;
export function datesInsecables(texte: string): React.ReactNode {
  const morceaux: React.ReactNode[] = [];
  let i = 0;
  for (const m of texte.matchAll(DATE_LISIBLE)) {
    const debut = m.index ?? 0;
    if (debut > i) morceaux.push(texte.slice(i, debut));
    morceaux.push(<span key={debut} className="cal-nowrap" data-date>{m[0]}</span>);
    i = debut + m[0].length;
  }
  if (i < texte.length) morceaux.push(texte.slice(i));
  return morceaux.length === 1 && typeof morceaux[0] === 'string' ? morceaux[0] : <>{morceaux}</>;
}

/** CT4-A-14 : la ligne se coupe ENTRE les groupes séparés par « · », jamais au milieu d'un groupe. */
export function groupesInsecables(texte: string): React.ReactNode {
  const groupes = texte.split(' · ').map(g => g.trim()).filter(Boolean);
  if (groupes.length < 2) return datesInsecables(texte);
  return <>{groupes.map((g, i) => (
    <React.Fragment key={i}>
      <span className="cal-grp" data-groupe>{datesInsecables(g)}{i < groupes.length - 1 ? ' ·' : ''}</span>{i < groupes.length - 1 ? ' ' : ''}
    </React.Fragment>
  ))}</>;
}

type Etape = { id: EtapeBrassin | 'prete'; libelle: string; jour: string };

/** Les étapes datées d'un brassin, une par jalon de la recette figée ; sans jalon : brassage et prête (ou « à préciser »). */
function etapes(chose: ChoseCalendrier): Etape[] {
  const jalons = (chose.jalons ?? []).filter((j): j is JalonBrassin & { id: EtapeBrassin } => j.id !== 'commander' && j.id in ETAPE)
    .slice().sort((a, b) => a.ecart - b.ecart);
  const lignes: Etape[] = jalons.map(j => ({ id: j.id, libelle: ETAPE[j.id].libelle, jour: j.jour }));
  if (!lignes.some(l => l.id === 'brassage') && chose.debut) lignes.unshift({ id: 'brassage', libelle: 'Brassage', jour: chose.debut });
  if (!lignes.some(l => l.id === 'conditionnement')) {
    /* CRITIQUE-7 n° 2 : une bière pas brassée a sa date « prête » au plus tôt (`pretePrevue`) */
    const prete = chose.finInconnue ? '' : chose.preteLe ?? chose.pretePrevue ?? '';
    lignes.push({ id: 'prete', libelle: 'Prête', jour: prete });
  }
  return lignes;
}

const IconeEtape: React.FC<{ id: Etape['id']; size?: number }> = ({ id, size = 16 }) => {
  const I = id === 'prete' ? Check : ETAPE[id].Icone;
  return <I size={size} aria-hidden="true" />;
};

/** Le mot de l'état d'un brassin, celui du brasseur (« en cuve », « en garde ») ; avant le brassage : « à brasser ». */
const MOT_ETAT: Record<Etape['id'], string> = {
  brassage: 'brassée', fermentation: 'en cuve', 'dry-hop': 'dry hop', garde: 'en garde', conditionnement: 'conditionnée', prete: 'prête'
};

/** « malt, houblon » : les articles qui manquent (lot A, `commander.articles`) ; vide s'ils ne sont pas connus. */
function articlesManquants(j: JalonBrassin | undefined): string {
  const a = j ? (j as JalonBrassin & { articles?: unknown }).articles : undefined;
  const liste = Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string' && !!x.trim()) : [];
  return liste.map(x => x.trim().toLocaleLowerCase('fr')).join(', ');
}

/** Les frais d'une chose (lot A, `frais`) : un texte, une liste ou des centimes ; rien d'inventé. */
function texteFrais(c: ChoseCalendrier): string | null {
  const f = champ(c, 'frais');
  if (typeof f === 'string' && f.trim()) return f.trim();
  if (Array.isArray(f)) { const l = f.filter((x): x is string => typeof x === 'string' && !!x.trim()); return l.length ? l.join(', ') : null; }
  if (typeof f === 'number' && Number.isFinite(f)) return francsSignes(f);
  return null;
}

/**
 * CRITIQUE-10, doute m14 : ouvert près du bas, le détail passait sous le + volant. À l'ouverture, la page défile juste assez pour que sa dernière
 * ligne passe au-dessus du + (+ 8 px), sans que la barre touchée passe sous l'en-tête collé. Renvoie le défilement fait (px), pour les tests.
 */
export function degagerDuVolant(det: HTMLElement): number {
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof window.scrollBy !== 'function') return 0;
  const r = det.getBoundingClientRect();
  if (r.height === 0) return 0;
  const enteteEl = document.querySelector<HTMLElement>('[data-entete-zone]');
  const entete = enteteEl?.getBoundingClientRect();
  /* CRITIQUE-11 n° 8 : « Liée à X · Annuler » reste avec le détail, dans sa bande au pied de l'en-tête ; le détail ne monte pas dessous */
  const bande = document.querySelector('[data-entete-zone] [data-msg-bande]')?.getBoundingClientRect();
  const bas = Math.max(entete && entete.height > 0 ? entete.bottom : 0, bande && bande.height > 0 ? bande.bottom : 0);
  const plafond = bas > 0 ? bas + 8 : 8;
  /* CAL-FICHE-CACHE-BARRE (paquet G n° 4) : c'est la barre, pas la fiche, qui borne le défilement */
  const id = det.getAttribute('data-detail');
  const zone = det.closest('[data-frise]') ?? document;
  const barre = id ? [...zone.querySelectorAll<HTMLElement>('[data-chose]')]
    .filter(x => x.getAttribute('data-chose') === id && !det.contains(x))
    .map(x => x.getBoundingClientRect()).find(b => b.height > 0) : undefined;
  const haut = barre ? Math.min(barre.top, r.top) : r.top;
  /* PC-149 : l'en-tête collé cache la chose ; elle remonte juste assez pour revenir à 8 px sous lui */
  const collant = !!enteteEl && ['sticky', 'fixed'].includes(getComputedStyle(enteteEl).position);
  if (collant && bas > 0) {
    const trop = Math.ceil(plafond - haut);
    if (trop > 0) { window.scrollBy({ top: -trop, left: 0, behavior: 'auto' }); return -trop; }
  }
  const volant = document.querySelector('.floating-actions')?.getBoundingClientRect();
  if (!volant || volant.height === 0 || volant.top >= window.innerHeight) return 0;
  const besoin = Math.ceil(r.bottom - (volant.top - 8));
  if (besoin <= 0) return 0;
  const delta = Math.min(besoin, Math.max(0, Math.floor(haut - plafond)));
  if (delta > 0) window.scrollBy({ top: delta, left: 0, behavior: 'auto' });
  return delta;
}

/**
 * L'action à la volée (D412) : la pastille de date touchée devient une règle avec un pouce. Glisser bouge la date en direct (8 px par jour),
 * lâcher l'écrit ; ← → d'un jour, Entrée écrit, Échap renonce. Les gestes ne remontent pas à la frise (pas de défilement ni de pincement).
 */
const Regle: React.FC<{ jour: string; mot: string; icone: React.ReactNode; onValider: (jours: number) => void; onAnnuler: () => void }> = ({ jour, mot, icone, onValider, onAnnuler }) => {
  const [jours, setJours] = React.useState(0);
  const depart = React.useRef<number | null>(null);
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => { ref.current?.focus({ preventScroll: true }); }, []);
  const borne = (n: number) => Math.max(-BORNE_JOURS, Math.min(BORNE_JOURS, n));
  const finir = (n: number) => { depart.current = null; if (n) onValider(n); else onAnnuler(); };
  const valeur = ajouterJours(jour, jours);
  return (
    <div ref={ref} role="slider" tabIndex={0} className="cal-fi-regle" data-regle data-regle-valeur={valeur}
      aria-label={`${mot} : glisser pour changer la date`} aria-valuemin={-BORNE_JOURS} aria-valuemax={BORNE_JOURS} aria-valuenow={jours} aria-valuetext={date(valeur)}
      onPointerDown={e => { e.stopPropagation(); depart.current = e.clientX - jours * PX_JOUR; try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* jsdom */ } }}
      onPointerMove={e => { e.stopPropagation(); if (depart.current !== null) setJours(borne(Math.round((e.clientX - depart.current) / PX_JOUR))); }}
      onPointerUp={e => { e.stopPropagation(); if (depart.current !== null) finir(jours); }}
      onPointerCancel={() => { depart.current = null; setJours(0); }}
      onClick={e => e.stopPropagation()}
      onKeyDown={e => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setJours(j => borne(j + 1)); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setJours(j => borne(j - 1)); }
        else if (e.key === 'Enter') { e.preventDefault(); finir(jours); }
        else if (e.key === 'Escape') { e.preventDefault(); onAnnuler(); }
      }}>
      <span className="cal-fi-rv">{icone}<time dateTime={valeur}>{date(valeur)}</time>{jours ? <small>{jours > 0 ? '+' : '−'}{Math.abs(jours)} j</small> : null}</span>
      <span className="cal-fi-ru" aria-hidden="true" />
      <span className="cal-fi-th" aria-hidden="true" style={{ left: `calc(50% + ${Math.max(-60, Math.min(60, jours * PX_JOUR))}px)` }} />
    </div>
  );
};

type Volet = 'dates' | 'achats' | 'lier' | 'plus';
type Action = { cle: string; mot: string; aria?: string; icone: React.ReactNode; onClick: () => void; attrs?: Record<string, string | boolean>; classe?: string; presse?: boolean };

export const DetailChose: React.FC<DetailChoseProps> = props => {
  const { chose, libreSemaine, promesse } = props;
  const racine = React.useRef<HTMLDivElement | null>(null);
  /* à l'ouverture (et quand une autre chose s'y ouvre), après la mise en page de la frise */
  React.useEffect(() => {
    const el = racine.current;
    if (!el || typeof window === 'undefined') return undefined;
    const planifie = (): number | null => (typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame(() => degagerDuVolant(el)) : null);
    let raf = planifie();
    /* PC-149 : pendant 800 ms, chaque changement de taille de la frise ou du détail rejoue le dégagement (idempotent) */
    const zone = el.closest('[data-frise]');
    let ro: ResizeObserver | null = null;
    let minuterie: ReturnType<typeof setTimeout> | null = null;
    if (zone && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => { if (raf !== null) window.cancelAnimationFrame?.(raf); raf = planifie(); });
      ro.observe(zone); ro.observe(el);
      minuterie = setTimeout(() => ro?.disconnect(), 800);
    }
    return () => { if (raf !== null) window.cancelAnimationFrame?.(raf); ro?.disconnect(); if (minuterie) clearTimeout(minuterie); };
  }, [chose.id]);
  const brassin = chose.source.genre === 'batch';
  const sansEcranPropre = chose.ouvre.ecran === 'agenda' || chose.ouvre.ecran === 'atelier';
  const [volet, setVolet] = React.useState<Volet | null>(null);
  const [regle, setRegle] = React.useState<'debut' | 'fin' | null>(null);
  React.useEffect(() => { setVolet(null); setRegle(null); }, [chose.id]);
  const basculer = (v: Volet) => setVolet(o => (o === v ? null : v));
  const lierPossible = !!(props.onLier && props.liens);
  /* les mêmes groupes que l'appui long : un brassin ne se lie pas à lui-même (deux du même nom : un bouton), une fête non plus */
  const groupesLier = ((): Array<{ cle: 'brassins' | 'clients' | 'evenements'; titre: string; puces: ReadonlyArray<{ id: string; nom: string }> }> => {
    const l = props.liens;
    if (!l) return [];
    const soi = chose.source.genre === 'batch' || chose.source.genre === 'creative' ? (chose.source as { id: string }).id : '';
    const brassins = l.brassins.filter(b => b.id !== soi).filter((b, i, t) => t.map(x => x.nom).lastIndexOf(b.nom) === i);
    const evenements = (l.evenements ?? []).filter(e => e.id !== soi);
    const gB = { cle: 'brassins' as const, titre: 'Brassins', puces: brassins };
    const gF = { cle: 'evenements' as const, titre: 'Fêtes et activités', puces: evenements };
    const gC = { cle: 'clients' as const, titre: 'Clients', puces: l.clients };
    /* lot C (n° 4) : un achat ou une vente se lie d'abord à une fête ; un achat de matériel ne se lie pas à un client */
    const ordre = chose.rangee === 'achats' ? [gF, gB] : chose.rangee === 'ventes' ? [gF, gB, gC] : [gB, gF, gC];
    return ordre.filter(g => g.puces.length > 0);
  })();
  /* lot C (n° 5) : la fiche dit à quoi la chose est liée ; une fête n'a pas d'aperçu (`chose.lie` dit brassin et client) */
  const nomFeteLiee = chose.liens?.evenementId
    ? (props.liens?.evenements?.find(e => e.id === chose.liens?.evenementId)?.nom ?? 'une fête')
    : null;
  const lieeA = [nomFeteLiee, chose.lie ? nomLie(chose.lie) : null].filter((x): x is string => !!x);
  const commander = chose.jalons?.find(j => j.id === 'commander');
  const montant = chose.centimes !== undefined ? francsSignes(chose.centimes) : null;
  const semaine = chose.debut ? dateDeSemaine(lundiDe(chose.debut)) : null;
  const peutMiseDeCote = !!(chose.fenetre && chose.centimes && !brassin && (chose.source.genre === 'creative' || (chose.source.genre === 'plan' && chose.source.origine === 'manual')));
  const proposition = !!chose.proposition;
  const articles = articlesManquants(commander);
  const frais = texteFrais(chose);
  const duree = brassin ? dureeVue(chose) : null;
  const pasBrassee = champ(chose, 'pasBrassee') === true;
  const maintenant = new Date();
  const aujourdhuiIso = `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}-${String(maintenant.getDate()).padStart(2, '0')}`;
  /* T3-2 : le jour prévu du brassage est passé et il n'est pas fait : « en retard », les étapes se comptent depuis aujourd'hui */
  const brassageEnRetard = brassin && pasBrassee && !!chose.debut && chose.debut < aujourdhuiIso;
  const joursDansFenetre = !brassin && !!chose.joursActifs && !!chose.debut && !!chose.fin && ecartJours(chose.debut, chose.fin) + 1 > chose.joursActifs;
  /* CRITIQUE-5 n° 31 : la date se lit une fois */
  const detailSansDate = brassin ? chose.detail : sansLaDate(chose.detail, chose.debut);
  const apercuLien = ((): { texte: string | null; apercu: string } | null => {
    if (!chose.lie) return null;
    if (lieMontre(chose)) return { texte: chose.lie.texte, apercu: apercuSansNom(chose.lie) };
    const nom = nomLie(chose.lie).toLocaleLowerCase('fr');
    const reste = chose.lie.apercu.split(' ; ').map(x => x.trim()).filter(x => x && !x.toLocaleLowerCase('fr').startsWith(nom));
    return reste.length ? { texte: null, apercu: reste.join(' ; ') } : null;
  })();

  /* ---------- la souche (v07) : picto d'état, J79, mot d'état ; sa couleur est celle de l'étape en cours, ou de la rangée ---------- */
  const lesEtapes = brassin ? etapes(chose) : [];
  const enCours = brassin ? [...lesEtapes].reverse().find(e => !!e.jour && e.jour <= aujourdhuiIso) : undefined;
  const avantBrassage = brassin && (pasBrassee || !enCours || (!!chose.debut && chose.debut > aujourdhuiIso));
  const etapeSouche: EtapeBrassin | null = brassin ? (avantBrassage ? 'brassage' : enCours && enCours.id !== 'prete' ? enCours.id : 'conditionnement') : null;
  const IconeRangee = ICONE_RANGEE[chose.rangee];
  const ecartDebut = chose.debut ? ecartJours(chose.debut, aujourdhuiIso) : null;
  const souche = brassin
    ? {
      icone: avantBrassage ? <Wheat size={18} aria-hidden="true" /> : <IconeEtape id={enCours?.id ?? 'conditionnement'} size={18} />,
      chiffre: ecartDebut === null ? '?' : ecartDebut >= 0 ? `J${ecartDebut}` : `J−${-ecartDebut}`,
      mot: avantBrassage ? (brassageEnRetard ? 'en retard' : 'à brasser') : MOT_ETAT[enCours?.id ?? 'prete'],
      style: etapeSouche ? { background: couleurEtape(etapeSouche), color: encreEtape(etapeSouche) } : undefined
    }
    : {
      icone: <IconeRangee size={18} aria-hidden="true" />,
      chiffre: chose.debut ? etiquetteS(lundiDe(chose.debut)) : '—',
      mot: !chose.debut ? 'sans date' : chose.joursActifs ? `${chose.joursActifs} j` : chose.fin && chose.fin !== chose.debut ? `${ecartJours(chose.debut, chose.fin) + 1} j` : '1 j',
      style: undefined
    };

  /* ---------- les pastilles (v02) : icône + valeur ; l'inconnu en pointillé ---------- */
  const finJour = brassin ? (lesEtapes.find(e => e.id === 'conditionnement')?.jour || (chose.finInconnue ? '' : chose.preteLe ?? chose.pretePrevue ?? chose.fin ?? '')) : chose.fin && chose.fin !== chose.debut ? chose.fin : '';
  const finMot = brassin ? (lesEtapes.some(e => e.id === 'conditionnement') ? 'Conditionnement' : 'Prête') : 'Fin';
  const iconeFin = brassin ? (lesEtapes.some(e => e.id === 'conditionnement') ? <IconeEtape id="conditionnement" /> : <Check size={16} aria-hidden="true" />) : <CalendarCheck size={16} aria-hidden="true" />;
  const iconeDebut = brassin ? <Wheat size={16} aria-hidden="true" /> : <CalendarDays size={16} aria-hidden="true" />;
  const pastilleDate = (cle: 'debut' | 'fin', jour: string, mot: string, icone: React.ReactNode, regler?: (j: number) => void) => {
    if (regle === cle && regler && jour) {
      return <div key={cle} className="cal-fi-p cal-fi-p-regle"><Regle jour={jour} mot={mot} icone={icone} onAnnuler={() => setRegle(null)} onValider={j => { setRegle(null); regler(j); }} /></div>;
    }
    if (!jour) return <span key={cle} className="cal-fi-p cal-fi-q" data-pastille={cle} aria-label={`${mot} : à préciser`}>{icone}<b>?</b></span>;
    return regler
      ? <button key={cle} type="button" className="cal-fi-p" data-pastille={cle} aria-label={`${mot} ${date(jour)} : régler`} onClick={() => { setVolet(null); setRegle(cle); }}>{icone}<b><time dateTime={jour}>{date(jour)}</time></b></button>
      : <span key={cle} className="cal-fi-p" data-pastille={cle} aria-label={`${mot} ${date(jour)}`}>{icone}<b><time dateTime={jour}>{date(jour)}</time></b></span>;
  };
  const pastilles: React.ReactNode[] = [];
  if (chose.debut) pastilles.push(pastilleDate('debut', chose.debut, brassin ? 'Brassage' : 'Début', iconeDebut, props.onDecalerDebut));
  if (brassin || finJour) pastilles.push(pastilleDate('fin', finJour, finMot, iconeFin, props.onDecalerFin));
  if (brassin && chose.coutAVenir) {
    pastilles.push(props.onBudget
      ? <button key="chf" type="button" className="cal-fi-p cal-fi-q" data-pastille="chf" aria-label="Coût à venir : Budget" onClick={props.onBudget}><Receipt size={16} aria-hidden="true" /><b>CHF ?</b></button>
      : <span key="chf" className="cal-fi-p cal-fi-q" data-pastille="chf" aria-label="Coût à venir"><Receipt size={16} aria-hidden="true" /><b>CHF ?</b></span>);
  }
  if (brassin && (commander || chose.courses)) {
    pastilles.push(<button key="manque" type="button" className={`cal-fi-p${commander ? ' cal-fi-rouge' : ''}`} data-pastille="manque" aria-expanded={volet === 'achats'}
      aria-label={commander ? `Il manque des courses, avant le ${date(commander.jour)}` : 'Courses'} onClick={() => basculer('achats')}>
      <ShoppingCart size={16} aria-hidden="true" /><b>{commander ? <time dateTime={commander.jour}>{date(commander.jour)}</time> : 'courses'}</b></button>);
  }
  if (!chose.debut) pastilles.push(<span key="sans" className="cal-fi-p cal-fi-q" data-pastille="debut"><CalendarDays size={16} aria-hidden="true" /><b>Sans date</b></span>);

  /* ---------- les actions : la principale large, trois en icône + mot, le reste sous ⋯ ---------- */
  const principale: Action = props.onAccepter ? { cle: 'accepter', mot: proposition ? 'Accepter' : 'Vente confirmée', icone: <Check size={16} aria-hidden="true" />, onClick: props.onAccepter }
    : props.onPoser ? { cle: 'poser', mot: 'Poser', icone: <CalendarDays size={16} aria-hidden="true" />, onClick: props.onPoser }
    : props.onFacturer ? { cle: 'facturer', mot: 'Facturer', icone: <ChevronRight size={16} aria-hidden="true" />, onClick: props.onFacturer }
    /* CAL-PASSE : une fête ou une activité n'a pas d'autre écran que sa feuille (Modifier) */
    : sansEcranPropre && props.onModifier ? { cle: 'feuille', mot: 'Modifier', icone: <ChevronRight size={16} aria-hidden="true" />, onClick: props.onModifier, attrs: { 'data-ouvrir-feuille': true } }
    : { cle: 'ouvrir', mot: 'Ouvrir', aria: LIBELLE_OUVRIR[chose.ouvre.ecran], icone: <ChevronRight size={16} aria-hidden="true" />, onClick: props.onOuvrir };
  const secondaires: Action[] = [];
  /* CRITIQUE-4 n° 1 : « Commander » dès que le brassin a des courses ou un manque */
  if (brassin && props.onCommander && (commander || chose.courses)) secondaires.push({ cle: 'commander', mot: 'Commander', icone: <ShoppingCart size={16} aria-hidden="true" />, onClick: props.onCommander });
  if (brassin && props.onBudget) secondaires.push({ cle: 'budget', mot: 'Budget', icone: <Wallet size={16} aria-hidden="true" />, onClick: props.onBudget });
  if (props.onFait) secondaires.push({ cle: 'fait', mot: 'Fait', icone: <Check size={16} aria-hidden="true" />, onClick: props.onFait });
  if (props.onModifier && principale.cle !== 'feuille') secondaires.push({ cle: 'modifier', mot: 'Modifier', icone: <Pencil size={16} aria-hidden="true" />, onClick: props.onModifier });
  if (lierPossible) secondaires.push({ cle: 'lier', mot: 'Lier', icone: <Link2 size={16} aria-hidden="true" />, onClick: () => basculer('lier'), presse: volet === 'lier' });
  const enPlus: Action[] = secondaires.splice(3);
  if (peutMiseDeCote && props.onMettreDeCote) enPlus.push({ cle: 'cote', mot: 'Mettre de côté', icone: <Receipt size={16} aria-hidden="true" />, onClick: () => props.onMettreDeCote?.(!chose.miseDeCote), presse: !!chose.miseDeCote });
  if (props.onDelier && chose.liens && lieeA.length > 0) enPlus.push({ cle: 'delier', mot: 'Délier', aria: `Délier de ${lieeA.join(' et ')}`, icone: <Unlink size={16} aria-hidden="true" />, onClick: () => props.onDelier?.(lieeA.join(' et ')), attrs: { 'data-delier': true } });
  /* paquet F n° 2 : le libellé dit ce que fait le geste ; ranger se défait sans perte, pas en rouge */
  if (props.onRetirer) enPlus.push({ cle: 'retirer', mot: libelleRetirer(chose), icone: <CalendarDays size={16} aria-hidden="true" />, onClick: props.onRetirer, attrs: { 'data-retirer': true }, ...(chose.source.genre === 'creative' ? {} : { classe: 'cal-fi-ret' }) });
  if (props.onSupprimer) enPlus.push({ cle: 'supprimer', mot: 'Supprimer', icone: <Trash2 size={16} aria-hidden="true" />, onClick: props.onSupprimer, attrs: { 'data-supprimer': true }, classe: 'cal-fi-ret' });
  const bouton = (a: Action, classe: string) => (
    <button key={a.cle} type="button" className={`${classe}${a.classe ? ` ${a.classe}` : ''}`} onClick={a.onClick} {...(a.aria ? { 'aria-label': a.aria } : {})}
      {...(a.presse !== undefined ? (a.cle === 'lier' ? { 'aria-expanded': a.presse } : { 'aria-pressed': a.presse }) : {})} {...a.attrs}>
      {a.icone}<span>{a.mot}</span>
    </button>
  );

  return (
    <div ref={racine} role="region" aria-label={`Détail : ${chose.titre}`} className={`cal-det cal-fiche ${CLASSE_TEINTE[chose.rangee]}`} data-detail={chose.id}>
      <button type="button" className="cal-fi-souche" data-souche style={souche.style} aria-expanded={volet === 'dates'}
        aria-label={`${souche.mot}, ${souche.chiffre} : ${brassin ? 'les étapes datées' : 'les dates et notes'}`} onClick={() => basculer('dates')}>
        {souche.icone}<b>{souche.chiffre}</b><span>{souche.mot}</span>
      </button>
      <div className="cal-fi-a">
        <h4 className="cal-fi-nom">{props.onRenommer ? <RenommerSurPlace as="span" valeur={chose.titre} onRenommer={props.onRenommer} quoi="le nom" /> : chose.titre}</h4>
        {montant && <span className={`cal-fi-m ${chose.centimes !== undefined && chose.centimes < 0 ? 'cal-neg' : 'cal-pos'}`} data-montant>{chose.reste ? 'reste ' : ''}{montant}{chose.partiel ? ' + à venir' : ''}</span>}
        <button type="button" className="cal-fi-x" aria-label="Fermer" onClick={props.onFermer}><X size={20} aria-hidden="true" /></button>
      </div>
      <div className={`cal-fi-b${regle ? ' cal-fi-b-regle' : ''}`}>{pastilles}</div>
      <div className="cal-fi-c">
        {bouton(principale, 'cal-fi-pri')}
        {secondaires.map(a => bouton(a, 'cal-fi-act'))}
        {enPlus.length > 0 && (
          <button type="button" className="cal-fi-act cal-fi-plus" data-plus aria-label="Plus d’actions" aria-expanded={volet === 'plus'} onClick={() => basculer('plus')}>
            <Ellipsis size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {volet === 'dates' && (
        <div className="cal-fi-volet" data-volet="dates">
          {brassin ? (
            <>
              {duree && <p className="cal-det-d" data-duree-detail><Beer size={16} aria-hidden="true" />{duree}</p>}
              <ol className="cal-fi-fil" data-etapes>
                {lesEtapes.map(e => (
                  <li key={e.id} data-etape={e.id} style={e.id !== 'prete' ? { ['--e' as string]: couleurEtape(e.id), ['--ee' as string]: encreEtape(e.id) } : undefined}>
                    <span className="cal-fi-pt"><IconeEtape id={e.id} size={14} /></span>
                    <span>{e.libelle}</span>
                    <b>{e.jour ? <time className="cal-nowrap" dateTime={e.jour}>{date(e.jour)}</time> : 'à préciser'}{e.id === 'brassage' && pasBrassee ? (brassageEnRetard ? ' · pas brassée, en retard' : ' · pas brassée') : ''}</b>
                  </li>
                ))}
              </ol>
              {brassageEnRetard && <p className="cal-det-d" data-etapes-recalees>Étapes comptées depuis aujourd’hui : le brassage n’est pas fait.</p>}
            </>
          ) : (
            <div className="cal-det-et">
              {/* PC-NOTE-4, PC-118 : une chose d'un jour ne dit pas deux dates : « S49 » seul */}
              {semaine && (chose.fin && chose.fin !== chose.debut
                ? <div><span>Semaine</span><b>{texteSemaine(semaine)}</b></div>
                : <div><span>Semaine</span><b className="cal-nowrap" data-semaine-detail>{etiquetteS(lundiDe(chose.debut))}</b></div>)}
              {chose.debut && !joursDansFenetre && <div><span>Date</span><b><time className="cal-nowrap" dateTime={chose.debut}>{date(chose.debut)}</time>{chose.fin && chose.fin !== chose.debut ? <> → <time className="cal-nowrap" dateTime={chose.fin}>{date(chose.fin)}</time></> : ''}</b></div>}
              {/* paquet F n° 5 (PC-141) : « 3 j entre le 14 déc. et le 20 déc. », sans jour inventé */}
              {chose.debut && joursDansFenetre && <div data-date-jours><span>Date</span><b>{chose.joursActifs} j entre le <time className="cal-nowrap" dateTime={chose.debut}>{date(chose.debut)}</time> et le <time className="cal-nowrap" dateTime={chose.fin}>{date(chose.fin)}</time></b></div>}
              {chose.fenetre && <div><span>Fenêtre</span><b>{etiquetteS(chose.fenetre.du)} → {etiquetteS(chose.fenetre.au)}</b></div>}
              {chose.joursActifs && !joursDansFenetre ? <div><span>Jours actifs</span><b>{chose.joursActifs} j</b></div> : null}
              {libreSemaine !== undefined && libreSemaine !== null && <div><span>Libre de la semaine</span><b>{francsSignes(libreSemaine).replace(/^\+/, '')}</b></div>}
              {!semaine && <div><span>Date</span><b>Sans date</b></div>}
            </div>
          )}
          {detailSansDate && <p className="cal-det-p"><span data-detail-texte>{groupesInsecables(detailSansDate)}</span></p>}
          {brassin && chose.budgetRepris && <p className="cal-det-p" data-budget-repris><Receipt size={16} aria-hidden="true" /><span>{chose.budgetRepris} : à confirmer par Budget ›</span></p>}
          {/* CHD-11 : `coutAVenir` dit qu'un montant manque (aucun budget, ou un emballage, des courses sans montant), pas qu'il n'y a aucun budget */}
          {brassin && chose.coutAVenir && <p className="cal-det-p" data-cout-a-venir><Receipt size={16} aria-hidden="true" /><span>Coût à venir : un montant manque encore. Budget › le calcule.</span></p>}
          {frais && <p className="cal-det-p" data-frais><Receipt size={16} aria-hidden="true" /><span>Frais : {datesInsecables(frais)}</span></p>}
          {promesse && <p className="cal-det-p">{promesse}</p>}
          {/* D-113, D-126, CRITIQUE-6 n° 15, CRITIQUE-10 n° 7 : l'aperçu sur place d'une chose liée, sans répéter le titre */}
          {apercuLien && (
            <p className="cal-det-p cal-det-lie" data-apercu-lien>
              {apercuLien.texte
                ? <><span className="cal-lie" data-lie data-lie-detail><Link2 size={14} aria-hidden="true" /><span>{apercuLien.texte}</span></span><span className="sr-only"> · </span></>
                : <Link2 size={16} aria-hidden="true" />}
              <span>{datesInsecables(apercuLien.apercu)}</span>
            </p>
          )}
          {nomFeteLiee && (
            <p className="cal-det-p cal-det-lie" data-lien-fete>
              <span className="cal-lie" data-lie data-lie-detail><Link2 size={14} aria-hidden="true" /><span>lié à {nomFeteLiee}</span></span>
            </p>
          )}
        </div>
      )}

      {volet === 'achats' && (
        <div className="cal-fi-volet" data-volet="achats">
          {commander && (
            <p className="cal-det-p" data-manque>
              <ShoppingCart size={16} aria-hidden="true" />
              <span>Il manque {articles ? <b>{articles}</b> : 'des courses'} : à acheter avant le <b className="cal-nowrap">{date(commander.jour)}</b></span>
            </p>
          )}
          {chose.courses && <p className="cal-det-p" data-courses><ShoppingCart size={16} aria-hidden="true" /><span>Courses : {datesInsecables(chose.courses)}</span></p>}
          {props.onCommander && <button type="button" className="cal-fi-pri cal-fi-volet-b" onClick={props.onCommander}><ShoppingCart size={16} aria-hidden="true" /><span>Commander</span></button>}
        </div>
      )}

      {/* lot A (18.11, n° 2, D386) : « Lier » déplie les puces de l'appui long, groupées ; un toucher pose le lien, la fiche reste ouverte */}
      {volet === 'lier' && lierPossible && props.liens && (
        <div className="cal-fi-volet cal-det-lier" data-det-lier>
          {groupesLier.map(g => (
            <div key={g.cle} role="group" aria-label={g.titre} className="cal-lier-g" data-lier={g.cle}>
              <span className="cal-lier-t">{g.titre}</span>
              {g.puces.map(p => (
                <button key={p.id} type="button" className="cal-lier-p" data-lier-id={p.id}
                  onClick={() => { setVolet(null); props.onLier?.(g.cle === 'brassins' ? { batchId: p.id } : g.cle === 'clients' ? { clientId: p.id } : { evenementId: p.id }, p.nom); }}>
                  <Link2 size={16} aria-hidden="true" /><span>{p.nom}</span>
                </button>
              ))}
            </div>
          ))}
          {!groupesLier.length && <p className="cal-det-p">Aucun brassin, client ni fête à lier pour l’instant.</p>}
        </div>
      )}

      {volet === 'plus' && (
        <div className="cal-fi-volet cal-fi-volet-plus" data-volet="plus">
          {enPlus.map(a => bouton(a, 'cal-fi-act cal-fi-act-l'))}
        </div>
      )}
    </div>
  );
};
