import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Sheet } from '../../Sheet';
import { Input } from '../../Input';
import { ChampMontant } from '../../finance/ChampMontant';
import {
  appliquerPuce, aDesJoursActifs, aUneFenetre, aUnMontant, avecNomPose, brouillonVide, choisirJour, etirerFin, etirerPlage, poserHorizon, choisirJours, peutChoisirJour, choisirJourFin, jourDebutPlage, jourFinPlage, peutChoisirJoursPlage, jourPose, libelleMontant, peutMettreDeCote, preteLe, puceJours, puces, resumeFenetre, toucherSemaine,
  type BrouillonAjout, type Confirmation, type ContexteAjout, type Puce
} from '../../../domain/calendrierAjout';
import { prixSemblable, texteIntention } from '../../../domain/horizons';
import { Horizons } from '../../saisie/Horizons';
import { ChoixDate } from '../../ChoixDate';
import { RANGEES, ajouterJours, etiquetteS, francs, jourAvecAnnee, jourLisible, lundiDe, nomRangee, semaineAvecAn, type Rangee, type SemaineCalendrier } from '../../../domain/calendrier';
import { CLASSE_TEINTE } from './Marque';
import { DureeFenetre } from './DureeFenetre';
import './feuille.css';

/**
 * La feuille d'ajout (E34, E45 ; as passes 5 à 9, la feuille du + volant et du carré de rangée). Sans clavier pour les cas courants :
 * le choix de la rangée, des puces (recettes et temps en cuve, clients et ventes probables, noms récents avec leur montant), le signe et
 * les montants récents à toucher, les semaines qui défilent (le début, puis la fin, E45), les jours actifs en puces. Les champs (nom, CHF)
 * restent pour le cas rare. Tout le calcul est dans `domain/calendrierAjout.ts` ; cette feuille ne fait que le montrer et le régler.
 *
 * Mise en page (feuille.css) : au 1280, la feuille est centrée sur le contenu (à droite du rail), 620 px, comme la vue large (E10) ; en
 * paysage, le corps se resserre et défile au-dessus du pied (Ajouter) qui reste fixe. Le Sheet des autres écrans ne change pas.
 */

export type ResultatAjout = { ok: true } | { ok: false; raison: string; confirmer?: Confirmation };

export interface FeuilleAjoutProps {
  mode: 'ajouter' | 'modifier';
  /** Le brouillon de départ : une rangée et une semaine préréglées, ou une proposition acceptée (E47), ou une chose à modifier. */
  initial: BrouillonAjout;
  contexte: ContexteAjout;
  /** Les 52 semaines de la courbe : la rangée des semaines défile dessus (13 à l'écran en paysage et au 1280). */
  semaines: readonly SemaineCalendrier[];
  /** La feuille ne propose pas « Plus de détails › » quand la semaine n'y passerait pas (une proposition de brassin habituel, E47 b). */
  sansPlusDeDetails?: boolean;
  /** Les rangées pour lesquelles l'app a sa propre feuille (Prévoir une dépense, Poser un brassin, Poser une fête). */
  onPlusDeDetails?: (b: BrouillonAjout) => void;
  onAjouter: (b: BrouillonAjout) => Promise<ResultatAjout> | ResultatAjout;
  onFermer: () => void;
  /** Modifier (lot A du test en ligne, 18.11, n° 2, D386) : les fêtes et activités qui durent, auxquelles lier la chose ; vide ou absent : pas de groupe. */
  evenements?: ReadonlyArray<{ id: string; nom: string }>;
}

const RANGEES_AVEC_DETAILS: readonly Rangee[] = ['brassins', 'fetes', 'achats', 'travaux', 'papiers'];

/** Le brouillon lié à cette fête (ou à aucune) ; les autres liens (brassin, client) restent ; plus aucun lien : `liens` part. */
function avecEvenement(b: BrouillonAjout, evenementId: string | undefined): BrouillonAjout {
  const { evenementId: _ancien, ...autres } = b.liens ?? {};
  const liens = { ...autres, ...(evenementId ? { evenementId } : {}) };
  const { liens: _l, ...reste } = b;
  return Object.keys(liens).length ? { ...reste, liens } : reste;
}
/** L'écart entre deux cases de semaine, en px. */
const ECART_SEMAINES = 4;

/* L-69 (T11-15) : ce que le brasseur a saisi dans une feuille d'ajout (nom, montant, lien) survit à un rechargement ou à une fermeture ; un brouillon par rangée,
   retiré à l'ajout réussi. Localement seulement (aucune donnée envoyée). */
const CLE_BROUILLON = 'laffinee.calendrier.brouillon';
const aSaisie = (x: BrouillonAjout): boolean => (!x.nomPose && x.titre.trim() !== '') || x.centimes !== undefined;
function brouillons(): Record<string, BrouillonAjout> {
  try { const o = JSON.parse(localStorage.getItem(CLE_BROUILLON) ?? '{}'); return o && typeof o === 'object' ? o : {}; } catch { return {}; }
}
function garderBrouillon(rangee: Rangee, x: BrouillonAjout | null) {
  try {
    const o = brouillons();
    if (x) o[rangee] = x; else delete o[rangee];
    if (Object.keys(o).length) localStorage.setItem(CLE_BROUILLON, JSON.stringify(o)); else localStorage.removeItem(CLE_BROUILLON);
  } catch { /* stockage refusé : la feuille marche sans */ }
}

const PUCE = 'inline-flex min-h-9 items-center gap-1.5 rounded-full border border-cave-700 px-3 text-sm text-cave-50 aria-pressed:border-cave-50 aria-pressed:bg-cave-850';

/** Le montant qu'une puce pose avec elle (nom récent, client, vente probable) ; `null` : aucun montant connu, rien n'est inventé. */
function montantDePuce(p: Puce): { texte: string; signe: '+' | '-' } | null {
  if (p.genre === 'nom' && p.centimes) return { texte: libelleMontant(p.centimes, p.signe ?? '+'), signe: p.signe ?? '+' };
  if ((p.genre === 'client' || p.genre === 'vente-probable') && p.centimes) return { texte: libelleMontant(p.centimes, '+'), signe: '+' };
  return null;
}

/** Une puce de nom, de client ou de vente probable. Son nom accessible est son libellé ; le montant qu'elle pose la décrit. */
function PuceNom({ p, choisie, onChoisir }: { p: Puce; choisie: boolean; onChoisir: () => void }) {
  const id = useId();
  const m = montantDePuce(p);
  const nom = p.genre === 'vente-probable' ? `Vente probable : ${p.libelle}` : p.libelle;
  return (
    <button type="button" aria-pressed={choisie} onClick={onChoisir} data-puce={p.genre} className={PUCE}
      {...(m ? { 'aria-label': nom, 'aria-describedby': id } : p.genre === 'vente-probable' ? { 'aria-label': nom } : {})}>
      {p.genre === 'vente-probable' && <span className="text-xs text-cave-200" aria-hidden="true">probable</span>}
      <span>{p.libelle}</span>
      {/* CRITIQUE-4 n° 16 : la vente habituelle du client, « Café du Pont · 1 fût +130 » ; un toucher la choisit, sans clavier */}
      {p.genre === 'client' && p.quoi && <span className="text-cave-200" data-quoi>· {p.quoi}</span>}
      {m && <span id={id} className={`cal-f-m ${m.signe === '+' ? 'text-hop-texte' : 'text-alert-strong'}`}>{m.texte}</span>}
    </button>
  );
}

export const FeuilleAjout: React.FC<FeuilleAjoutProps> = ({ mode, initial, contexte, semaines, sansPlusDeDetails, onPlusDeDetails, onAjouter, onFermer, evenements }) => {
  /* un brassin se pose avec son temps en cuve déjà choisi (28 j) : « prête le … » se lit d'emblée (D-22, D-39) */
  /* G3, NOM-OBLIGE (D396) : à l'ajout, Travaux, Activités et Papiers ont leur nom posé (« Travaux · S48 »), qui suit la semaine tant qu'il
     n'est ni tapé ni choisi ; Ajouter se valide sans clavier */
  const avecDefauts = (x: BrouillonAjout): BrouillonAjout => {
    if (mode !== 'ajouter') return x;
    const y = x.rangee === 'brassins' && !x.tempsEnCuve ? { ...x, tempsEnCuve: 28 } : x;
    return avecNomPose(y, contexte.choses);
  };
  const [b, setB] = useState<BrouillonAjout>(() => {
    const base = avecDefauts(initial);
    const d = mode === 'ajouter' ? brouillons()[base.rangee] : undefined;
    if (!d || typeof d.titre !== 'string' || !aSaisie(d)) return base;
    return { ...base, titre: d.titre, nomPose: false, ...(d.centimes !== undefined ? { centimes: d.centimes } : {}), ...(d.signe ? { signe: d.signe } : {}), ...(d.liens ? { liens: d.liens } : {}) };
  });
  /* L-68 (T11-12) : en Modifier, le × ne jette pas les changements sans un mot ; un premier toucher demande, le second abandonne */
  const departRef = useRef(JSON.stringify(b));
  const [abandon, setAbandon] = useState(false);
  const modifie = mode === 'modifier' && JSON.stringify(b) !== departRef.current;
  useEffect(() => { if (mode === 'ajouter') garderBrouillon(b.rangee, aSaisie(b) ? b : null); }, [b, mode]);
  /** D2 : le prix gardé d'un achat semblable (« ZZ TEST Pompe 2026 »), dit « estimé » tant que le montant est le sien. */
  const [prixGarde, setPrixGarde] = useState<{ centimes: number; source: string } | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [refus, setRefus] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const rangeeSemaines = useRef<HTMLDivElement | null>(null);
  const idJours = useId();
  const [joursOuverts, setJoursOuverts] = useState(() => !!initial.joursActifs);

  const lesPuces = useMemo(() => puces(b.rangee, contexte), [b.rangee, contexte]);
  const fenetre = aUneFenetre(b.rangee);
  const argent = aUnMontant(b.rangee);
  const brassin = b.rangee === 'brassins';
  const resume = resumeFenetre(b);
  /* CRITIQUE-7 n° 4 : « prête le » se compte depuis le jour de pose (brassé au plus tôt aujourd'hui, jamais un lundi passé) ; la date dite
     est celle que « Ajouter » écrit (`jourPose`), sauf une fenêtre, qui part du lundi */
  const prete = preteLe(b, contexte.aujourdhui);
  const jourDit = b.debut && b.jour && lundiDe(b.jour) === b.debut ? b.jour : b.debut ? (fenetre && (b.fin || (aDesJoursActifs(b.rangee) && b.joursActifs)) ? b.debut : jourPose(b.debut, contexte.aujourdhui)) : null;

  /* E34, CRITIQUE-3 n° 28 : 13 semaines à l'écran, à 390 aussi (cases de 24 px au moins, la ligne entière se touche), et la rangée défile
     sur les 52 semaines de la courbe. La largeur se mesure ; sans mesure (jsdom), celle de la fenêtre moins les marges de la feuille. */
  const [largeurSemaines, setLargeurSemaines] = useState(0);
  useLayoutEffect(() => {
    const el = rangeeSemaines.current;
    if (!el) return undefined;
    const lire = () => { if (el.clientWidth > 0) setLargeurSemaines(el.clientWidth); };
    lire();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(lire);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const largeurVue = largeurSemaines || (typeof window !== 'undefined' ? Math.max(0, Math.min(window.innerWidth, 620) - 24) : 366);
  /* paquet D n° 3 (WCAG 2.5.8, DESIGN.md) : la cible est toute la colonne (case dessinée + écart), sans zone morte entre deux semaines ;
     à 390, 27 px au lieu de 24 px dessinés entre 4 px morts (deux touchers sur S49 avaient pris S48). Le dessin garde 24 px au moins. */
  const pasSemaine = Math.max(26, Math.floor(largeurVue / 13));
  const caseSemaine = Math.max(24, pasSemaine - ECART_SEMAINES);
  const semainesVisibles = Math.min(semaines.length, Math.floor(largeurVue / pasSemaine));
  const casesEtroites = caseSemaine < 44;

  /* la semaine choisie (préréglée, proposée : S26) est dans l'écran à l'ouverture, centrée dans la rangée qui défile (comme le jouable) */
  /* CAL-PASSE voie S, R2-5 (21.11, feuille Modifier : la rangée s'ouvrait sur S2, la semaine de la chose hors de vue) : le centrage se lit sur les boîtes
     rendues (pas sur `offsetLeft`, qui dépend du parent de mise en page), à l'ouverture, au changement de taille ET une fois la feuille posée (elle glisse
     à l'ouverture : la mesure du premier rendu était faite avant sa largeur finale). */
  useLayoutEffect(() => {
    const centrer = () => {
      const rangee = rangeeSemaines.current;
      const choisie = rangee?.querySelector<HTMLElement>('button[aria-pressed="true"]');
      if (!rangee || !choisie) return;
      const gauche = choisie.getBoundingClientRect().left - rangee.getBoundingClientRect().left + rangee.scrollLeft;
      rangee.scrollLeft = Math.max(0, gauche - (rangee.clientWidth - choisie.offsetWidth) / 2);
    };
    centrer();
    const image = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(centrer) : 0;
    const tard = typeof setTimeout === 'function' ? setTimeout(centrer, 350) : 0;
    return () => { if (image && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(image); if (tard) clearTimeout(tard); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b.rangee, caseSemaine, pasSemaine, largeurVue]);

  const regler = (suite: BrouillonAjout) => { setConfirmation(null); setRefus(null); setB(mode === 'ajouter' ? avecNomPose(suite, contexte.choses) : suite); };
  /* C1 (D393, K1) : à l'ajout, la date se pose en horizons (aujourd'hui, 1 mois, 3 mois…) ; la semaine exacte se règle ensuite au glisser sur
     la frise. CAL-MODIFIER (21.11, « la modification est horrible ») : Modifier reprend la même feuille, horizons puis frise (durée ou date
     seule, passé compris) ; plus de carrousel des semaines. Un brassin rouvert prend la date seule (sa semaine se règle au doigt). */
  const horizons = true;
  const intention = horizons && b.debut ? texteIntention(b.debut, contexte.aujourdhui) : null;
  /* L-67 (T11-6) : « vers févr. » devient « vers févr. 2027 » quand l'année n'est pas la courante ; la frise dessous le dit déjà */
  const anneeDite = b.debut ? ajouterJours(lundiDe(b.debut), 3).slice(0, 4) : '';
  const intentionDite = intention && anneeDite && anneeDite !== contexte.aujourdhui.slice(0, 4) && !intention.includes(anneeDite) && !intention.startsWith('passé') ? `${intention} ${anneeDite}` : intention;
  /* D2 (D393) : le dernier achat semblable au nom tapé, montant non encore donné ; rien de semblable : aucune puce (jamais 0) */
  const prixPropose = argent && (b.rangee === 'travaux' || b.rangee === 'achats') && b.centimes === undefined && !b.nomPose && b.titre.trim().length >= 3 && contexte.achats?.length
    ? prixSemblable({ nom: b.titre }, contexte.achats) : null;
  const choisirRangee = (r: Rangee) => { if (r !== b.rangee) regler(avecDefauts(brouillonVide(r, b.debut))); };
  const choisirPuce = (p: Puce) => regler(appliquerPuce(b, p));
  const puceChoisie = (p: Puce): boolean => {
    switch (p.genre) {
      case 'recette': return b.recetteId === p.recetteId;
      case 'temps': return b.tempsEnCuve === p.jours;
      case 'client': return b.clientId === p.clientId;
      case 'vente-probable': return b.titre === p.libelle;
      case 'nom': return b.titre.trim().toLocaleLowerCase('fr') === p.libelle.toLocaleLowerCase('fr');
      case 'montant': return b.centimes === p.centimes && b.signe === p.signe;
    }
  };

  const ajouter = async (suite: BrouillonAjout = b) => {
    if (enCours) return;
    setEnCours(true);
    try {
      const r = await onAjouter(suite);
      if (r.ok === false) { setConfirmation(r.confirmer ?? null); setRefus(r.confirmer ? null : r.raison); }
      else if (mode === 'ajouter') garderBrouillon(suite.rangee, null);
    } finally { setEnCours(false); }
  };

  const montrerPuces = (genres: Puce['genre'][]) => lesPuces.filter(p => genres.includes(p.genre));
  const puces1 = brassin ? montrerPuces(['recette']) : b.rangee === 'ventes' ? montrerPuces(['vente-probable', 'client']) : montrerPuces(['nom']);
  const temps = brassin ? montrerPuces(['temps']) : [];
  const montants = argent ? montrerPuces(['montant']) : [];
  const libelleAjouter = confirmation ? `Oui, ${francs(b.centimes ?? 0)} CHF` : mode === 'modifier' ? 'Enregistrer' : b.debut && !b.fin ? `Ajouter en ${etiquetteS(b.debut)}` : 'Ajouter';

  return (
    <Sheet
      open
      onClose={() => { if (modifie && !abandon) setAbandon(true); else onFermer(); }}
      title={nomRangee(b.rangee)}
      subtitle={mode === 'modifier' ? 'Modifier' : 'Ajouter'}
      className="cal-feuille lg:left-[var(--rail-width,88px)] lg:mx-auto lg:max-w-[620px] lg:rounded-t-sheet"
      footer={(
        <>
        {/* CRITIQUE-4 n° 10 (E45, D-8) : la fenêtre « S20 → S40 · 21 sem. » est dite dans le pied, toujours visible sans défiler la feuille, à 390
            comme en paysage, juste au-dessus d'« Ajouter » */}
        {abandon && (
          <div role="alert" data-abandon className="mb-1 flex flex-wrap items-center gap-2 rounded-control border border-alert px-2 py-1.5 text-sm text-cave-50">
            <span className="mr-auto">Tes changements ne sont pas enregistrés.</span>
            <button type="button" onClick={() => setAbandon(false)} className="min-h-11 rounded-control px-3 font-semibold underline underline-offset-2">Garder</button>
            <button type="button" data-abandonner onClick={onFermer} className="min-h-11 rounded-control px-3 font-semibold text-alert-strong underline underline-offset-2">Abandonner</button>
          </div>
        )}
        {resume && <p className="cal-f-resume mb-1 text-sm text-cave-50" data-fenetre-pied><b data-fenetre>{resume}</b>{b.joursActifs ? <span> · {b.joursActifs} j actifs</span> : null}</p>}
        <div className="flex items-center gap-2" data-feuille-pied>
          {!sansPlusDeDetails && onPlusDeDetails && RANGEES_AVEC_DETAILS.includes(b.rangee) && (
            <button type="button" onClick={() => onPlusDeDetails(b)} className="min-h-11 shrink-0 rounded-control px-3 text-sm font-semibold text-cave-200 underline underline-offset-2">Plus de détails ›</button>
          )}
          <button
            type="button"
            data-ajouter
            onClick={() => ajouter(confirmation ? { ...b, confirmeGrosseSomme: true } : b)}
            disabled={enCours}
            className="cal-cta ml-auto min-h-11 flex-1 rounded-control px-4 text-base font-bold disabled:opacity-50"
          >{libelleAjouter}</button>
        </div>
        </>
      )}
    >
      <div className="cal-feuille-corps space-y-3 px-3 pb-3 text-sm" data-feuille-rangee={b.rangee} data-mode={mode}>
        <div role="group" aria-label="Quoi" data-feuille-quoi className="flex flex-wrap gap-1.5">
          {RANGEES.map(r => (
            <button
              key={r.id}
              type="button"
              aria-pressed={r.id === b.rangee}
              onClick={() => choisirRangee(r.id)}
              disabled={mode === 'modifier'}
              className={`${CLASSE_TEINTE[r.id]} inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-cave-700 px-3 text-sm font-semibold text-cave-50 aria-pressed:border-cave-50 aria-pressed:bg-cave-850 disabled:opacity-60`}
            >
              <i aria-hidden="true" className="cal-pt-teinte" />{r.nom}
            </button>
          ))}
        </div>

        {puces1.length > 0 && (
          <div role="group" aria-label={brassin ? 'Recettes' : b.rangee === 'ventes' ? 'Clients et ventes probables' : 'Noms récents'} data-feuille-puces className="flex flex-wrap gap-1.5">
            {puces1.map(p => <PuceNom key={p.id} p={p} choisie={puceChoisie(p)} onChoisir={() => choisirPuce(p)} />)}
          </div>
        )}

        {argent && (
          <div role="group" aria-label="Montant" data-feuille-montant className="flex flex-wrap items-center gap-1.5">
            <span className="w-full text-sm text-cave-200">CHF{b.rangee === 'activites' ? ' (facultatif)' : ''}</span>
            <button
              type="button"
              aria-label={b.signe === '-' ? 'Dépense (toucher : rentrée)' : 'Rentrée (toucher : dépense)'}
              onClick={() => regler({ ...b, signe: b.signe === '-' ? '+' : '-' })}
              className={`min-h-10 w-10 shrink-0 rounded-control border-2 text-lg font-bold ${b.signe === '-' ? 'border-alert text-alert-strong' : 'border-hop text-hop-texte'}`}
            >{b.signe === '-' ? '−' : '+'}</button>
            {montants.map(p => (
              <button key={p.id} type="button" aria-pressed={puceChoisie(p)} onClick={() => choisirPuce(p)} data-puce="montant"
                className={`${PUCE} cal-f-m ${p.genre === 'montant' && p.signe === '+' ? 'text-hop-texte' : 'text-alert-strong'}`}>{p.libelle}</button>
            ))}
            {/* le champ est le repli (un montant nouveau) : court, il ne prend pas la ligne */}
            <ChampMontant
              value={b.centimes !== undefined ? b.centimes / 100 : undefined}
              onValue={v => regler({ ...b, centimes: v !== undefined && v > 0 ? Math.round(v * 100) : undefined })}
              max={10_000_000} maxDecimales={2} aria-label="Montant en CHF" placeholder="CHF"
              className="cal-f-chf min-h-10 w-28 rounded-control border border-cave-700 bg-cave-950 px-2 text-right text-base text-cave-50"
            />
            {/* D2 : « ZZ TEST Pompe de brassage 2026 : 420 · Garder » ; un toucher pose le montant, dit « estimé » ensuite (la facture le remplace) */}
            {prixPropose && (
              <button type="button" data-prix-semblable aria-label={`Garder ${francs(prixPropose.centimes)} CHF, prix estimé d’après ${prixPropose.source}`}
                onClick={() => { setPrixGarde({ centimes: prixPropose.centimes, source: prixPropose.source }); regler({ ...b, centimes: prixPropose.centimes, signe: '-' }); }}
                className={`${PUCE} border-dashed`}>
                <span className="cal-f-m text-alert-strong">{francs(prixPropose.centimes)}</span><span className="text-cave-200">{prixPropose.source}</span><b className="font-semibold">Garder</b>
              </button>
            )}
            {prixGarde && b.centimes === prixGarde.centimes && <span data-prix-estime className="text-xs text-cave-200">estimé · {prixGarde.source}</span>}
          </div>
        )}

        {brassin && temps.length > 0 && (
          <div role="group" aria-label="En cuve" className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm text-cave-200">En cuve</span>
            {temps.map(p => (
              <button key={p.id} type="button" aria-pressed={puceChoisie(p)} onClick={() => choisirPuce(p)}
                className="min-h-9 rounded-full border border-cave-700 px-3 text-sm text-cave-50 aria-pressed:border-cave-50 aria-pressed:bg-cave-850">{p.libelle}</button>
            ))}
            {prete && <em className="not-italic font-semibold text-cave-50" data-prete>{prete}</em>}
          </div>
        )}

        <div>
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-sm text-cave-200">{horizons ? 'Quand' : fenetre ? 'Semaines' : 'Semaine'}</span>
            {intention && <b className="text-sm font-semibold text-cave-50" data-intention>{intentionDite}</b>}
            {!fenetre && peutChoisirJour(b) && <span className="text-sm text-cave-50" data-jour-dit>{jourAvecAnnee(b.jour as string, contexte.aujourdhui)}</span>}
            {/* L-67, L-70 (T11-6, T11-17) : la semaine et le jour se disent UNE fois, sur la ligne de la frise (Durée ou Date) ; ici, pour les lecteurs d'écran et les tests */}
            {b.debut && <span className="sr-only" data-feuille-semaine={b.debut}>{semaineAvecAn(b.debut, contexte.aujourdhui)}, {jourAvecAnnee(jourDit ?? b.debut, contexte.aujourdhui)}</span>}
          </div>
          {horizons ? (
            <Horizons date={b.debut ?? undefined} aujourdhui={contexte.aujourdhui} classePuce={PUCE} sansPlusTard etiquette="Quand" className="cal-f-horizons"
              onChoisir={(_, lundi) => { if (lundi) regler(poserHorizon(b, lundi)); }} />
          ) : (
          <div
            ref={rangeeSemaines} role="group" aria-label="Semaine" data-vaul-no-drag data-visibles={semainesVisibles}
            className={`cal-f-semaines relative flex overflow-x-auto pb-1${casesEtroites ? ' cal-f-etroit' : ''}`} style={{ touchAction: 'pan-x', gap: 0 }}
          >
            {semaines.map(s => {
              const dans = !!b.debut && s.debut >= b.debut && (b.fin ? s.debut <= b.fin : s.debut === b.debut);
              const jour = jourLisible(s.debut);
              return (
                <button
                  key={s.debut} type="button" data-semaine={s.debut} aria-pressed={s.debut === b.debut || s.debut === b.fin} data-dans={dans ? '' : undefined}
                  aria-label={`S${s.numero}, ${jour}`}
                  onClick={() => regler(toucherSemaine(b, s.debut))}
                  style={{ width: pasSemaine, minWidth: pasSemaine, padding: `0 ${(pasSemaine - caseSemaine) / 2}px` }}
                  className="cal-f-sem flex min-h-11 shrink-0 items-stretch text-cave-50"
                >
                  <span className="cal-f-sem-c flex w-full flex-col items-center justify-center rounded-control border border-cave-700">
                    <b className="cal-f-sem-n">S{s.numero}</b>
                    {/* étroite (390) : le jour du mois seul ; le mois se lit au-dessus (« S50, 7 déc. ») */}
                    <small className="cal-f-sem-j">{casesEtroites ? Number(s.debut.slice(8)) : jour}</small>
                  </span>
                </button>
              );
            })}
          </div>
          )}
          {/* D404 : l'horizon pose le début ; la durée s'étire au geste de la frise B (fêtes, achats, travaux, activités) */}
          {horizons && fenetre && b.debut && (
            <div className="mt-2">
              <DureeFenetre rangee={b.rangee} etiquette={b.rangee === 'achats' && !b.fin ? 'Date' : 'Durée'} debut={b.debut} fin={b.fin} jourFin={peutChoisirJoursPlage(b) ? jourFinPlage(b) : null} jourSeul={!b.fin && !b.joursActifs ? jourDit : null} onFin={f => regler(etirerFin(b, f))} onPlage={(d, f) => regler(etirerPlage(b, d, f))} />
            </div>
          )}
          {/* D431 (GESTE-DATE-PARTOUT, T11-22 : « rangée L 8 … D 14 sans mois, à côté de la frise partagée ») : le jour exact se choisit sur la frise partagée au jour
              (`ChoixDate` : la pastille dit le jour avec son mois, la frise s'ouvre au toucher), plus de rangée de boutons maison. Une chose d'un jour : « Jour » ; une
              fenêtre rouverte : le jour du début et le jour de la fin (jamais une fin avant le début). */}
          {horizons && fenetre && b.debut && peutChoisirJour(b) && (
            <div className="mt-2 grid grid-cols-[3rem_1fr] items-start gap-x-1" data-jours-choix>
              <span className="flex min-h-11 items-center text-sm text-cave-200">Jour</span>
              <ChoixDate label="Jour" rangee={b.rangee} valeur={b.jour as string} onChange={iso => regler(choisirJour(b, iso))} />
            </div>
          )}
          {horizons && peutChoisirJoursPlage(b) && (
            <div className="mt-2 grid grid-cols-[3rem_1fr] items-start gap-x-1 gap-y-1" data-jours-choix>
              <span className="flex min-h-11 items-center text-sm text-cave-200">Début</span>
              <ChoixDate label="Jour du début" rangee={b.rangee} valeur={jourDebutPlage(b) as string} max={jourFinPlage(b) as string} onChange={iso => regler(choisirJour(b, iso))} />
              <span className="flex min-h-11 items-center text-sm text-cave-200">Fin</span>
              <ChoixDate label="Jour de la fin" rangee={b.rangee} valeur={jourFinPlage(b) as string} min={jourDebutPlage(b) as string} onChange={iso => regler(choisirJourFin(b, iso))} />
            </div>
          )}
          {/* capture-12 (21.11) : une chose à une seule date (vente, papier…) prend la même frise, un seul repère, tirable dans le passé */}
          {/* L-14 (T10-14, GESTE-DATE-PARTOUT) : un brassin posé par le + prend aussi la frise partagée (il n'avait que les horizons) */}
          {horizons && !fenetre && b.debut && (
            <div className="mt-2">
              {peutChoisirJour(b)
                /* D431 : rouverte sur un jour précis, la chose se choisit au jour (la frise de semaine ne le saurait pas) ; le jour se dit avec son mois sur la ligne « Quand » */
                ? <ChoixDate ouvert label="Jour" rangee={b.rangee} valeur={b.jour as string} onChange={iso => regler(choisirJour(b, iso))} />
                : <DureeFenetre seule rangee={b.rangee} debut={b.debut} fin={null} onFin={() => undefined} onPlage={d => regler(etirerPlage(b, d, null))} />}
            </div>
          )}
        </div>

        {/* D404 : les jours actifs restent, repliés sous le choix de période ; ouverts d'emblée quand un nombre est choisi */}
        {aDesJoursActifs(b.rangee) && (
          <div>
            <button type="button" aria-expanded={joursOuverts} aria-controls={idJours} onClick={() => setJoursOuverts(o => !o)} data-jours-actifs-pli
              className="inline-flex min-h-9 items-center gap-1.5 text-sm text-cave-200">
              Jours actifs{b.joursActifs ? <b className="font-semibold text-cave-50">· {b.joursActifs} j</b> : <span>· tous</span>}
              <span aria-hidden="true" className={`inline-block transition-transform${joursOuverts ? ' rotate-90' : ''}`}>›</span>
            </button>
            {joursOuverts && (
              <div id={idJours} role="group" aria-label="Jours actifs" className="flex flex-wrap items-center gap-1.5">
                {puceJours(b).map(p => (
                  <button key={p.jours} type="button" aria-pressed={p.choisie} disabled={p.grisee} onClick={() => regler(choisirJours(b, p.jours))}
                    className="cal-jour-puce min-h-9 rounded-full border border-cave-700 px-3 text-sm text-cave-50 aria-pressed:border-cave-50 aria-pressed:bg-cave-850 aria-pressed:font-bold disabled:opacity-40">{p.jours} j</button>
                ))}
              </div>
            )}
          </div>
        )}

        {peutMettreDeCote(b) && (
          <button
            type="button" aria-pressed={!!b.miseDeCote} onClick={() => regler({ ...b, miseDeCote: !b.miseDeCote })}
            className="min-h-10 w-full rounded-control border border-cave-700 px-3 text-left text-sm font-semibold text-cave-50 aria-pressed:border-cave-50 aria-pressed:bg-cave-850"
          >Mettre de côté <small className="font-normal text-cave-200">· au fil des semaines, rendu au paiement</small></button>
        )}

        {/* lot A du test en ligne (18.11, n° 2, D386) : en Modifier, la fête ou l'activité à laquelle la chose est liée ; une puce choisie se
            retouche pour défaire le lien. Écrit à « Enregistrer » (`evenementId`). */}
        {mode === 'modifier' && !brassin && evenements && evenements.length > 0 && (
          <div role="group" aria-label="Fêtes et activités" data-feuille-evenements className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm text-cave-200">Liée à</span>
            {evenements.map(e => {
              const choisi = b.liens?.evenementId === e.id;
              return (
                <button key={e.id} type="button" aria-pressed={choisi} onClick={() => regler(avecEvenement(b, choisi ? undefined : e.id))}
                  className="min-h-9 rounded-full border border-cave-700 px-3 text-sm text-cave-50 aria-pressed:border-cave-50 aria-pressed:bg-cave-850">{e.nom}</button>
              );
            })}
          </div>
        )}

        {/* le nom au clavier est le cas rare : il vient en dernier, après les puces, le signe, les semaines (CAL-CLAV, D-22, D-39) */}
        {!brassin && (
          <label className="block">
            <span className="mb-0.5 block text-sm text-cave-200">{puces1.length > 0 ? 'Autre nom' : 'Nom'}</span>
            <Input
              type="text" value={b.titre} onChange={e => regler({ ...b, titre: e.target.value, nomPose: false })} data-feuille-nom
              /* le nom posé se remplace d'un coup : le toucher le sélectionne */
              onFocus={e => { if (b.nomPose) e.currentTarget.select(); }}
              /* F-ENTREE (PI-2) : Entrée valide comme le bouton du pied (même confirmation d'une grosse somme), puis ferme le clavier */
              onEntree={() => { void ajouter(confirmation ? { ...b, confirmeGrosseSomme: true } : b); }}
              className="min-h-10 w-full rounded-control border border-cave-700 bg-cave-950 px-2 text-base text-cave-50"
            />
          </label>
        )}

        {confirmation && <p data-confirmation className="rounded-control border border-alert px-2 py-1.5 text-sm text-cave-50"><b className="font-semibold">{francs(b.centimes ?? 0)} CHF</b> : {confirmation.texte}</p>}
        {refus && <p data-refus className="text-sm text-alert-strong">{refus}</p>}
      </div>
    </Sheet>
  );
};
