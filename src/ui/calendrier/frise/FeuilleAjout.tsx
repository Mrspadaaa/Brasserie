import React, { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Sheet } from '../../Sheet';
import { Input } from '../../Input';
import { ChampMontant } from '../../finance/ChampMontant';
import {
  appliquerPuce, aUneFenetre, aUnMontant, brouillonVide, choisirJours, libelleMontant, peutMettreDeCote, preteLe, puceJours, puces, resumeFenetre, toucherSemaine,
  type BrouillonAjout, type Confirmation, type ContexteAjout, type Puce
} from '../../../domain/calendrierAjout';
import { RANGEES, etiquetteS, francs, jourLisible, nomRangee, type Rangee, type SemaineCalendrier } from '../../../domain/calendrier';
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
}

const RANGEES_AVEC_DETAILS: readonly Rangee[] = ['brassins', 'fetes', 'achats', 'travaux', 'papiers'];

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
      {m && <span id={id} className={`cal-f-m ${m.signe === '+' ? 'text-hop-texte' : 'text-alert-strong'}`}>{m.texte}</span>}
    </button>
  );
}

export const FeuilleAjout: React.FC<FeuilleAjoutProps> = ({ mode, initial, contexte, semaines, sansPlusDeDetails, onPlusDeDetails, onAjouter, onFermer }) => {
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
  const prete = preteLe(b);

  /* la semaine choisie (préréglée, proposée : S26) est dans l'écran à l'ouverture, centrée dans la rangée qui défile (comme le jouable) */
  useLayoutEffect(() => {
    const rangee = rangeeSemaines.current;
    const choisie = rangee?.querySelector<HTMLElement>('button[aria-pressed="true"]');
    if (rangee && choisie) rangee.scrollLeft = Math.max(0, choisie.offsetLeft - (rangee.clientWidth - choisie.offsetWidth) / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b.rangee]);

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
  const libelleAjouter = confirmation ? `Oui, ${francs(b.centimes ?? 0)} CHF` : mode === 'modifier' ? 'Enregistrer' : b.debut ? `Ajouter en ${etiquetteS(b.debut)}` : 'Ajouter';

  return (
    <Sheet
      open
      onClose={onFermer}
      title={nomRangee(b.rangee)}
      subtitle={mode === 'modifier' ? 'Modifier' : 'Ajouter'}
      className="cal-feuille lg:left-[var(--rail-width,88px)] lg:mx-auto lg:max-w-[620px] lg:rounded-t-sheet"
      footer={(
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
            {resume && <b className="text-sm text-cave-50" data-fenetre>{resume}</b>}
            {!resume && b.debut && <span className="text-sm text-cave-50">{etiquetteS(b.debut)}, {jourLisible(b.debut)}</span>}
          </div>
          <div ref={rangeeSemaines} role="group" aria-label="Semaine" data-vaul-no-drag className="cal-f-semaines relative flex gap-1 overflow-x-auto pb-1" style={{ touchAction: 'pan-x' }}>
            {semaines.map(s => {
              const dans = !!b.debut && s.debut >= b.debut && (b.fin ? s.debut <= b.fin : s.debut === b.debut);
              return (
                <button
                  key={s.debut} type="button" data-semaine={s.debut} aria-pressed={s.debut === b.debut || s.debut === b.fin} data-dans={dans ? '' : undefined}
                  onClick={() => regler(toucherSemaine(b, s.debut))}
                  className="cal-f-sem flex min-h-11 shrink-0 flex-col items-center justify-center rounded-control border border-cave-700 text-cave-50 aria-pressed:border-cave-50 data-[dans]:bg-cave-850"
                >
                  <b className="text-sm">S{s.numero}</b>
                  <small className="text-xs text-cave-200">{jourLisible(s.debut)}</small>
                </button>
              );
            })}
          </div>
        </div>

        {fenetre && (
          <div role="group" aria-label="Jours actifs" className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm text-cave-200">Jours actifs</span>
            {puceJours(b).map(p => (
              <button key={p.jours} type="button" aria-pressed={p.choisie} disabled={p.grisee} onClick={() => regler(choisirJours(b, p.jours))}
                className="min-h-9 rounded-full border border-cave-700 px-3 text-sm text-cave-50 aria-pressed:border-cave-50 aria-pressed:bg-cave-850 disabled:opacity-40">{p.jours} j</button>
            ))}
          </div>
        )}

        {peutMettreDeCote(b) && (
          <button
            type="button" aria-pressed={!!b.miseDeCote} onClick={() => regler({ ...b, miseDeCote: !b.miseDeCote })}
            className="min-h-10 w-full rounded-control border border-cave-700 px-3 text-left text-sm font-semibold text-cave-50 aria-pressed:border-cave-50 aria-pressed:bg-cave-850"
          >Mettre de côté <small className="font-normal text-cave-200">· au fil des semaines, rendu au paiement</small></button>
        )}

        {/* le nom au clavier est le cas rare : il vient en dernier, après les puces, le signe, les semaines (CAL-CLAV, D-22, D-39) */}
        {!brassin && (
          <label className="block">
            <span className="mb-0.5 block text-sm text-cave-200">{puces1.length > 0 ? 'Autre nom' : 'Nom'}</span>
            <Input
              type="text" value={b.titre} onChange={e => regler({ ...b, titre: e.target.value })} enterKeyHint="done"
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
