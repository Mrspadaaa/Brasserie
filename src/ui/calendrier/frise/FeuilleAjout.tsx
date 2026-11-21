import React, { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Sheet } from '../../Sheet';
import { Input } from '../../Input';
import { ChampMontant } from '../../finance/ChampMontant';
import {
  appliquerPuce, aDesJoursActifs, aUneFenetre, aUnMontant, brouillonVide, choisirJour, choisirJours, peutChoisirJour, jourPose, libelleMontant, peutMettreDeCote, preteLe, puceJours, puces, resumeFenetre, toucherSemaine,
  type BrouillonAjout, type Confirmation, type ContexteAjout, type Puce
} from '../../../domain/calendrierAjout';
import { RANGEES, ajouterJours, etiquetteS, francs, jourLisible, lundiDe, nomRangee, type Rangee, type SemaineCalendrier } from '../../../domain/calendrier';
import { CLASSE_TEINTE } from './Marque';
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

const JOURS_INITIALES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;
const NOMS_JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] as const;
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
  const avecDefauts = (x: BrouillonAjout): BrouillonAjout => (mode === 'ajouter' && x.rangee === 'brassins' && !x.tempsEnCuve ? { ...x, tempsEnCuve: 28 } : x);
  const [b, setB] = useState<BrouillonAjout>(() => avecDefauts(initial));
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [refus, setRefus] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const rangeeSemaines = useRef<HTMLDivElement | null>(null);

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

  const regler = (suite: BrouillonAjout) => { setConfirmation(null); setRefus(null); setB(suite); };
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
      onClose={onFermer}
      title={nomRangee(b.rangee)}
      subtitle={mode === 'modifier' ? 'Modifier' : 'Ajouter'}
      className="cal-feuille lg:left-[var(--rail-width,88px)] lg:mx-auto lg:max-w-[620px] lg:rounded-t-sheet"
      footer={(
        <>
        {/* CRITIQUE-4 n° 10 (E45, D-8) : la fenêtre « S20 → S40 · 21 sem. » est dite dans le pied, toujours visible sans défiler la feuille, à 390
            comme en paysage, juste au-dessus d'« Ajouter » */}
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
            <span className="text-sm text-cave-200">{fenetre ? 'Semaines' : 'Semaine'}</span>
            {b.debut &&<span className="text-sm text-cave-50">{etiquetteS(b.debut)}, {jourLisible(jourDit ?? b.debut)}</span>}
          </div>
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
          {/* CAL-PASSE (21.11, n° 2) : le JOUR de la semaine choisie, pour une chose à date seule rouverte (mardi reste mardi ; un autre jour se touche) */}
          {peutChoisirJour(b) && (
            <div role="group" aria-label="Jour" data-feuille-jours className="mt-1 flex gap-1" data-vaul-no-drag>
              {JOURS_INITIALES.map((nom, i) => {
                const iso = ajouterJours(b.debut as string, i);
                return (
                  <button key={iso} type="button" data-jour={iso} aria-pressed={iso === b.jour} aria-label={`${NOMS_JOURS[i]} ${jourLisible(iso)}`}
                    onClick={() => regler(choisirJour(b, iso))}
                    className="cal-f-jour flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center rounded-control border border-cave-700 text-cave-50 aria-pressed:border-cave-50 aria-pressed:bg-cave-850 aria-pressed:font-bold">
                    <b className="text-xs font-semibold">{nom}</b>
                    <small className="text-xs text-cave-200">{Number(iso.slice(8))}</small>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {aDesJoursActifs(b.rangee) && (
          <div role="group" aria-label="Jours actifs" className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm text-cave-200">Jours actifs</span>
            {puceJours(b).map(p => (
              <button key={p.jours} type="button" aria-pressed={p.choisie} disabled={p.grisee} onClick={() => regler(choisirJours(b, p.jours))}
                className="cal-jour-puce min-h-9 rounded-full border border-cave-700 px-3 text-sm text-cave-50 aria-pressed:border-cave-50 aria-pressed:bg-cave-850 aria-pressed:font-bold disabled:opacity-40">{p.jours} j</button>
            ))}
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
              type="text" value={b.titre} onChange={e => regler({ ...b, titre: e.target.value })}
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
