import React from 'react';
import { Beer, Check, ChevronRight, Link2, Receipt, ShoppingCart, Trash2, Unlink, Wheat, X } from 'lucide-react';
import { ETAPE_BRASSIN } from './etapes';
import { libelleRetirer } from '../../../domain/calendrierGestes';
import { dateDeSemaine, ecartJours, etiquetteS, francsSignes, jourLisible, lundiDe, type ChoseCalendrier, type JalonBrassin, type JalonId } from '../../../domain/calendrier';
import { CLASSE_TEINTE, apercuSansNom, champ, dureeVue, lieMontre, nomLie } from './Marque';
import type { LiensPossibles } from './MenuAppuiLong';

/**
 * f4-b (E30) : toucher une chose ouvre son détail sous sa barre. Un brassin : ses étapes datées avec leurs icônes (brassage, fermentation,
 * dry hop, garde, conditionnement, lues dans les jalons de la recette figée, E25, D-191), les courses qui manquent, nommées (« Il manque malt,
 * houblon : à acheter avant le 22 nov. »), « Ouvrir le brassin », « Commander », « Budget › » (D-71, nouveau, à valider). Une autre chose :
 * sa semaine, sa date, le libre de la semaine, avec Modifier et Retirer, et « Fait » pour une activité (D-93). Dans la poche « Sans date »
 * (E46) : « Poser » et « Fait ». × fait 44 px. Jamais « en retard de N j » (D-19) : des dates. Jamais « 22 nov. . » (CRITIQUE-3 n° 37).
 */

export interface DetailChoseProps {
  chose: ChoseCalendrier;
  /** Le libre de la semaine de la chose, en centimes ; absent : courbe inconnue. */
  libreSemaine?: number | null;
  /** Une promesse liée à ce brassin (« 3 fûts promis le 15 déc. »). */
  promesse?: string | null;
  /** « Semaine courante » pour Poser depuis la poche. */
  onFermer: () => void;
  onOuvrir: () => void;
  onCommander?: () => void;
  onBudget?: () => void;
  onModifier?: () => void;
  onRetirer?: () => void;
  /** Paquet F n° 1 : une chose de la poche « Sans date » se supprime (effacée ; Annuler dans le message). */
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
}

const LIBELLE_OUVRIR: Record<ChoseCalendrier['ouvre']['ecran'], string> = {
  brassin: 'Ouvrir le brassin', piece: 'Ouvrir la pièce', plan: 'Ouvrir dans Finances', finances: 'Ouvrir dans Finances', agenda: 'Ouvrir dans l’agenda',
  atelier: 'Ouvrir dans l’atelier', materiel: 'Ouvrir dans le matériel', courses: 'Ouvrir les courses', fournisseur: 'Ouvrir le fournisseur', solde: 'Ouvrir Solde', carnets: 'Ouvrir dans les carnets'
};

/** Le nom d'une étape du brassin, celui que le brasseur emploie (E25). */
/* le même picto que le point de l'étape sur la barre (CAL-POINTS-MUETS) */
const ETAPE = ETAPE_BRASSIN;

/** Une date sans point final doublé : « 22 nov. » se suit d'un deux-points, d'une virgule ou de rien, jamais de « . ». */
const date = (iso: string): string => jourLisible(iso);

/** Le détail sans son morceau « le 10 déc. » quand c'est la date de la chose (déjà dite par « Date ») ; `undefined` s'il ne reste rien. */
export function sansLaDate(detail: string | undefined, debut: string | undefined): string | undefined {
  if (!detail || !debut) return detail || undefined;
  const jour = date(debut);
  const reste = detail.split(' · ').filter(m => m.trim() !== `le ${jour}` && m.trim() !== jour).join(' · ').trim();
  return reste || undefined;
}

/**
 * CRITIQUE-10 n° 4 : « S49, 30 nov. – 6 déc. » ne se coupe jamais au milieu de la plage (« 30 nov. – 6 » puis « déc. ») : la plage est
 * insécable ; faute de place, « S49, » reste seul sur sa ligne et la plage entière passe dessous (la colonne de la grille prend sa largeur).
 */
function texteSemaine(semaine: string): React.ReactNode {
  const i = semaine.indexOf(', ');
  if (i < 0) return <span className="cal-nowrap" data-plage>{semaine}</span>;
  /* paquet D n° 7 : « S50, » restait seul en fin de ligne avant « 7 – 13 déc. ». La semaine, puis sa plage sur sa propre ligne, sans virgule */
  return <><span className="cal-nowrap">{semaine.slice(0, i)}</span><span className="cal-nowrap block" data-plage>{semaine.slice(i + 2)}</span></>;
}

/**
 * CRITIQUE-12 n° 3 (critique 10 n° 4, critique 11 n° 7) : à 390, « brassage 23 nov. · prête 21 » puis « déc. ». Chaque date du détail (avec le mot
 * qui la précède : « prête 21 déc. », « le 20 nov. ») est un bloc insécable ; la ligne se coupe entre les morceaux « · ».
 */
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

/** Les étapes datées d'un brassin, une par jalon de la recette figée ; sans jalon : brassage et prête (ou « durée inconnue »). */
function etapes(chose: ChoseCalendrier): Array<{ id: string; libelle: string; jour: string; icone: React.ReactNode }> {
  const jalons = (chose.jalons ?? []).filter((j): j is JalonBrassin & { id: Exclude<JalonId, 'commander'> } => j.id !== 'commander' && j.id in ETAPE)
    .slice().sort((a, b) => a.ecart - b.ecart);
  const lignes = jalons.map((j): { id: string; libelle: string; jour: string; icone: React.ReactNode } => {
    const { libelle, Icone } = ETAPE[j.id];
    return { id: j.id, libelle, jour: j.jour, icone: <Icone size={16} aria-hidden="true" /> };
  });
  if (!lignes.some(l => l.id === 'brassage') && chose.debut) lignes.unshift({ id: 'brassage', libelle: 'Brassage', jour: chose.debut, icone: <Wheat size={16} aria-hidden="true" /> });
  if (!lignes.some(l => l.id === 'conditionnement')) {
    /* CRITIQUE-7 n° 2 : une bière pas brassée a sa date « prête » (au plus tôt, `pretePrevue`) : la grille la dit, comme sa durée, jamais
       « à préciser » à côté de « prête le 16 déc. » */
    const prete = chose.finInconnue ? '' : chose.preteLe ?? chose.pretePrevue ?? '';
    lignes.push({ id: 'prete', libelle: 'Prête', jour: prete, icone: <Check size={16} aria-hidden="true" /> });
  }
  return lignes;
}

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
 * CRITIQUE-10, doute m14 : ouvert près du bas, le détail passait sous le + volant (« à acheter avant le … » couvert). À l'ouverture, la page
 * défile juste assez pour que sa dernière ligne passe au-dessus du + (sa hauteur mesurée, lecture seule, + 8 px), sans que son haut passe
 * sous l'en-tête collé. Rien ne bouge si le + n'est pas là ou si le détail est déjà dégagé. Renvoie le défilement fait (px), pour les tests.
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
  /* CAL-FICHE-CACHE-BARRE (paquet G n° 4) : la fiche s'ouvre sous la barre touchée ; c'est la barre, pas la fiche, qui borne le défilement :
     son haut reste 8 px sous l'en-tête collé (avant, la fiche montait sous l'en-tête et la barre passait dessous) */
  const id = det.getAttribute('data-detail');
  const zone = det.closest('[data-frise]') ?? document;
  const barre = id ? [...zone.querySelectorAll<HTMLElement>('[data-chose]')]
    .filter(x => x.getAttribute('data-chose') === id && !det.contains(x))
    .map(x => x.getBoundingClientRect()).find(b => b.height > 0) : undefined;
  const haut = barre ? Math.min(barre.top, r.top) : r.top;
  /* PC-149 (paysage, appui long qui amène du 3 mois aux 6 semaines, D-199) : la page garde son défilement d'avant, la chose et son détail se
     retrouvent SOUS l'en-tête collé (« Hotte −900 », Semaine, Date, Libre cachés). Elle remonte alors juste assez pour que la chose revienne
     à 8 px sous lui ; seulement si l'en-tête est collé (sticky ou fixe), sinon il part avec la page et rien ne le masque. */
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

export const DetailChose: React.FC<DetailChoseProps> = props => {
  const { chose, libreSemaine, promesse } = props;
  const racine = React.useRef<HTMLDivElement | null>(null);
  /* à l'ouverture (et quand une autre chose s'y ouvre), après la mise en page de la frise */
  React.useEffect(() => {
    const el = racine.current;
    if (!el || typeof window === 'undefined') return undefined;
    const planifie = (): number | null => (typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame(() => degagerDuVolant(el)) : null);
    let raf = planifie();
    /* PC-149 : ouvert par l'appui long qui change la période (D-199), le détail se pose avant que la frise ait fini sa mise en page (6 semaines :
       rangées et hauteurs autres) ; la chose bouge ensuite sous l'en-tête. Pendant 800 ms, chaque changement de taille de la frise ou du détail
       rejoue le dégagement (idempotent : rien ne bouge s'il est déjà dégagé) ; aucun effet sur un défilement du doigt, qui ne change aucune taille. */
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
  const [lierOuvert, setLierOuvert] = React.useState(false);
  React.useEffect(() => setLierOuvert(false), [chose.id]);
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
    /* lot C (test en ligne, n° 4) : un achat ou une vente se lie d'abord à une fête (on achète, on vend pour elle) ; un achat de matériel ne se
       lie pas à un client. Ailleurs (pilote, 18.11) : Brassins, puis Fêtes et activités, puis Clients */
    const ordre = chose.rangee === 'achats' ? [gF, gB] : chose.rangee === 'ventes' ? [gF, gB, gC] : [gB, gF, gC];
    return ordre.filter(g => g.puces.length > 0);
  })();
  /* lot C (test en ligne, n° 5) : la fiche dit à quoi la chose est liée ; une fête n'a pas d'aperçu (`chose.lie` dit brassin et client) */
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
  /* des jours actifs moins nombreux que les jours de sa fenêtre : la date ne s'écrit pas comme une plage pleine */
  const joursDansFenetre = !brassin && !!chose.joursActifs && !!chose.debut && !!chose.fin && ecartJours(chose.debut, chose.fin) + 1 > chose.joursActifs;
  /* CRITIQUE-5 n° 31 : la date se lit une fois. Hors d'un brassin, « Date 10 déc. » est déjà dans la grille : le morceau « le 10 déc. » du
     détail part (le reste du détail, une note ou « montant non renseigné », reste). */
  const detailSansDate = brassin ? chose.detail : sansLaDate(chose.detail, chose.debut);
  const apercuLien = ((): { texte: string | null; apercu: string } | null => {
    if (!chose.lie) return null;
    /* CRITIQUE-7 n° 6 : « lié à Blonde d’automne · brassage 23 nov. · prête 21 déc. », jamais « … · Blonde d’automne · brassage … » */
    if (lieMontre(chose)) return { texte: chose.lie.texte, apercu: apercuSansNom(chose.lie) };
    const nom = nomLie(chose.lie).toLocaleLowerCase('fr');
    const reste = chose.lie.apercu.split(' ; ').map(x => x.trim()).filter(x => x && !x.toLocaleLowerCase('fr').startsWith(nom));
    return reste.length ? { texte: null, apercu: reste.join(' ; ') } : null;
  })();

  return (
    <div ref={racine} role="region" aria-label={`Détail : ${chose.titre}`} className={`cal-det ${CLASSE_TEINTE[chose.rangee]}`} data-detail={chose.id}>
      <h4 className="cal-det-h">{chose.titre}{montant && <span className={chose.centimes !== undefined && chose.centimes < 0 ? 'cal-neg' : 'cal-pos'}>{chose.reste ? 'reste ' : ''}{montant}{chose.partiel ? ' +' : ''}</span>}{chose.coutAVenir && <span>coût à venir</span>}</h4>
      <button type="button" className="cal-det-x" aria-label="Fermer" onClick={props.onFermer}><X size={22} aria-hidden="true" /></button>

      {brassin ? (
        <>
          {duree && <p className="cal-det-d" data-duree-detail><Beer size={16} aria-hidden="true" />{duree}</p>}
          <div className="cal-det-et cal-det-etapes" data-etapes>
            {etapes(chose).map(e => (
              <div key={e.id} data-etape={e.id}>
                <span>{e.icone}{e.libelle}</span>
                <b>{e.jour ? <time className="cal-nowrap" dateTime={e.jour}>{date(e.jour)}</time> : 'à préciser'}{e.id === 'brassage' && pasBrassee ? ' · pas brassée' : ''}</b>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="cal-det-et">
          {/* PC-NOTE-4, PC-118 : une chose d'un jour ne dit pas deux dates (« S49, 30 nov. – 6 déc. » à côté de « Date 30 nov. ») : « S49 » seul */}
          {semaine && (chose.fin && chose.fin !== chose.debut
            ? <div><span>Semaine</span><b>{texteSemaine(semaine)}</b></div>
            : <div><span>Semaine</span><b className="cal-nowrap" data-semaine-detail>{etiquetteS(lundiDe(chose.debut))}</b></div>)}
          {chose.debut && !joursDansFenetre && <div><span>Date</span><b><time className="cal-nowrap" dateTime={chose.debut}>{date(chose.debut)}</time>{chose.fin && chose.fin !== chose.debut ? <> → <time className="cal-nowrap" dateTime={chose.fin}>{date(chose.fin)}</time></> : ''}</b></div>}
          {/* paquet F n° 5 (PC-141) : une fête de 3 jours posée sur une semaine ne dure pas « 14 déc. → 20 déc. ». Ses jours ne sont pas écrits (la
              feuille choisit des semaines) : la date dit ce qui est su, « 3 j entre le 14 déc. et le 20 déc. », sans jour inventé */}
          {chose.debut && joursDansFenetre && <div data-date-jours><span>Date</span><b>{chose.joursActifs} j entre le <time className="cal-nowrap" dateTime={chose.debut}>{date(chose.debut)}</time> et le <time className="cal-nowrap" dateTime={chose.fin}>{date(chose.fin)}</time></b></div>}
          {chose.fenetre && <div><span>Fenêtre</span><b>{etiquetteS(chose.fenetre.du)} → {etiquetteS(chose.fenetre.au)}</b></div>}
          {chose.joursActifs && !joursDansFenetre ? <div><span>Jours actifs</span><b>{chose.joursActifs} j</b></div> : null}
          {libreSemaine !== undefined && libreSemaine !== null && <div><span>Libre de la semaine</span><b>{francsSignes(libreSemaine).replace(/^\+/, '')}</b></div>}
          {!semaine && <div><span>Date</span><b>Sans date</b></div>}
        </div>
      )}

      {detailSansDate && <p className="cal-det-p">{datesInsecables(detailSansDate)}</p>}
      {brassin && commander && (
        <p className="cal-det-p" data-manque>
          <ShoppingCart size={16} aria-hidden="true" />
          <span>Il manque {articles ? <b>{articles}</b> : 'des courses'} : à acheter avant le <b className="cal-nowrap">{date(commander.jour)}</b></span>
        </p>
      )}
      {brassin && chose.courses && <p className="cal-det-p" data-courses><ShoppingCart size={16} aria-hidden="true" /><span>Courses : {datesInsecables(chose.courses)}</span></p>}
      {brassin && chose.budgetRepris && <p className="cal-det-p" data-budget-repris><Receipt size={16} aria-hidden="true" /><span>{chose.budgetRepris} : à confirmer par Budget ›</span></p>}
      {brassin && chose.coutAVenir && <p className="cal-det-p" data-cout-a-venir><Receipt size={16} aria-hidden="true" /><span>Coût à venir : aucun budget pour cette recette. Budget › le calcule.</span></p>}
      {frais && <p className="cal-det-p" data-frais><Receipt size={16} aria-hidden="true" /><span>Frais : {datesInsecables(frais)}</span></p>}
      {promesse && <p className="cal-det-p">{promesse}</p>}
      {/* l'aperçu sur place d'une chose liée (D-113, D-126) : « La Cigogne · client ; Blonde d'automne · brassage 23 nov. · prête 21 déc. » */}
      {/* CRITIQUE-6 n° 15 : un lien qui répète le titre (« Épicerie du Bourg, 2 cartons » lié à « Épicerie du Bourg ») ne garde que ce qu'il
          ajoute (le brassin promis) ; s'il n'ajoute rien, la ligne part */}
      {/* CRITIQUE-10 n° 7 (E37, D-113, D-126) : un plan lié (la Hotte, liée à Blonde d'automne) porte dans son détail la pastille « lié à … »,
          la même que sur la frise, et son aperçu à côté, sur place ; le détail est déjà l'aperçu ouvert, la pastille ne se re-touche pas */}
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

      <div className="cal-det-bt">
        {props.onAccepter && <button type="button" className="cal-b cal-b-pri" onClick={props.onAccepter}>{proposition ? 'Accepter' : 'Vente confirmée'}</button>}
        {props.onPoser && <button type="button" className="cal-b cal-b-pri" onClick={props.onPoser}>Poser</button>}
        {props.onFacturer && <button type="button" className="cal-b cal-b-pri" onClick={props.onFacturer}>Facturer<ChevronRight size={16} aria-hidden="true" /></button>}
        {!props.onPoser && !props.onAccepter && !props.onFacturer && <button type="button" className="cal-b cal-b-pri" onClick={props.onOuvrir}>{LIBELLE_OUVRIR[chose.ouvre.ecran]}<ChevronRight size={16} aria-hidden="true" /></button>}
        {/* CRITIQUE-4 n° 1 (D-191, E30) : « Commander » dès que le brassin a des courses ou un manque, jamais seulement sur un manque */}
        {brassin && props.onCommander && (commander || chose.courses) && <button type="button" className="cal-b" onClick={props.onCommander}><ShoppingCart size={16} aria-hidden="true" />Commander</button>}
        {brassin && props.onBudget && <button type="button" className="cal-b" onClick={props.onBudget}>Budget ›</button>}
        {props.onFait && <button type="button" className="cal-b" onClick={props.onFait}><Check size={16} aria-hidden="true" />Fait</button>}
        {peutMiseDeCote && props.onMettreDeCote && (
          <button type="button" className="cal-b" aria-pressed={!!chose.miseDeCote} onClick={() => props.onMettreDeCote?.(!chose.miseDeCote)}>Mettre de côté</button>
        )}
        {props.onModifier && <button type="button" className="cal-b" onClick={props.onModifier}>Modifier</button>}
        {lierPossible && <button type="button" className="cal-b" aria-expanded={lierOuvert} onClick={() => setLierOuvert(o => !o)}><Link2 size={16} aria-hidden="true" />Lier</button>}
        {props.onDelier && chose.liens && lieeA.length > 0 && (
          <button type="button" className="cal-b" aria-label={`Délier de ${lieeA.join(' et ')}`} data-delier onClick={() => props.onDelier?.(lieeA.join(' et '))}><Unlink size={16} aria-hidden="true" />Délier</button>
        )}
        {/* paquet F n° 2 : le libellé dit ce que fait le geste (« Ranger sans date », « Annuler la vente ») ; ranger se défait sans perte, pas en rouge */}
        {props.onRetirer && <button type="button" className={chose.source.genre === 'creative' ? 'cal-b' : 'cal-b cal-b-ret'} data-retirer onClick={props.onRetirer}>{libelleRetirer(chose)}</button>}
        {props.onSupprimer && <button type="button" className="cal-b cal-b-ret" data-supprimer onClick={props.onSupprimer}><Trash2 size={16} aria-hidden="true" />Supprimer</button>}
      </div>
      {/* lot A du test en ligne (18.11, n° 2, D386) : « Lier » déplie les puces de l'appui long, groupées ; un toucher pose le lien, la fiche
          reste ouverte et montre « lié à … » */}
      {lierPossible && lierOuvert && props.liens && (
        <div className="cal-det-lier" data-det-lier>
          {groupesLier.map(g => (
            <div key={g.cle} role="group" aria-label={g.titre} className="cal-lier-g" data-lier={g.cle}>
              <span className="cal-lier-t">{g.titre}</span>
              {g.puces.map(p => (
                <button key={p.id} type="button" className="cal-lier-p" data-lier-id={p.id}
                  onClick={() => { setLierOuvert(false); props.onLier?.(g.cle === 'brassins' ? { batchId: p.id } : g.cle === 'clients' ? { clientId: p.id } : { evenementId: p.id }, p.nom); }}>
                  <Link2 size={16} aria-hidden="true" /><span>{p.nom}</span>
                </button>
              ))}
            </div>
          ))}
          {!groupesLier.length && <p className="cal-det-p">Aucun brassin, client ni fête à lier pour l’instant.</p>}
        </div>
      )}
    </div>
  );
};
