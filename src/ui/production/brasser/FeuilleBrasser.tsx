// d1b (choix du brasseur, 15.11), porté tel quel : trois semaines, la cuve sur chaque jour. Rien n'est créé avant « Planifier ».
// Le stock vient de `besoinsDe` (r2a) ; la cuve et la cave, des brassins (cuveModel). Une date absente du modèle est dite en mots.
import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Hop, Thermometer, TriangleAlert } from 'lucide-react';
import type { Batch, Recipe, StockItem } from '../../../types';
import { besoinsDe } from '../recettes/recettesModel';
import {
  dateSuisse, debutDeJour, ecartJours, etatCuve, evenements, evenementsDuJour, jourBouton, jourCourt, jourLong, lundiDe, nomMois,
  occupations, plusJours, premierLibre, raisonDe, type Contexte, type GenreEvenement
} from './cuveModel';
import './brasser.css';

const Bouteille = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 2h4" /><path d="M10.5 2v4.5L8 10v11a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V10l-2.5-3.5V2" /><path d="M8 14h8" />
  </svg>
);
const PICTO: Record<GenreEvenement, { icone: React.ReactNode; mot: string }> = {
  houblon: { icone: <Hop aria-hidden="true" />, mot: 'dry hop' },
  bouteille: { icone: <Bouteille />, mot: 'mise en bouteille' },
  garde: { icone: <Thermometer aria-hidden="true" />, mot: 'début de garde' }
};
const SEMAINE = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'];
const NB_JOURS = 21;

interface Props {
  recipe: Recipe;
  batches: Batch[];
  stock: StockItem[];
  /** Capacité du fermenteur de l'installation ; absente : la cuve n'est pas connue (jamais « libre »). */
  capaciteL?: number;
  /** Volume du brassin si le brasseur l'a adapté au matériel ; sinon celui de la recette. */
  volumeL?: number;
  /** Mise en garde sur le volume et le matériel (AM-47), dite avant « Planifier ». */
  avertissement?: React.ReactNode;
  erreur?: string;
  enCours?: boolean;
  /** Le brassin est déjà écrit à ce jour (« 21.11.2026 ») mais sa confirmation n'est pas reçue : le jour est figé, « Confirmer l'enregistrement » rejoue la confirmation. */
  jourFige?: string;
  maintenant?: number;
  onAnnuler: () => void;
  /** Le jour choisi, en « 21.11.2026 ». */
  onPlanifier: (jour: string) => void;
}

export function FeuilleBrasser({ recipe, batches, stock, capaciteL, volumeL: volumeAdapte, avertissement, erreur, enCours = false, jourFige, maintenant, onAnnuler, onPlanifier }: Props) {
  const aujourdhui = debutDeJour(maintenant ?? Date.now());
  const volumeL = volumeAdapte ?? recipe.volumeL;
  const ctx: Contexte = useMemo(() => ({ occ: occupations(batches), evts: evenements(batches), capaciteL, volumeL, aujourdhui }), [batches, capaciteL, volumeL, aujourdhui]);
  const propose = useMemo(() => premierLibre(ctx), [ctx]);
  // Cuve inconnue : aucun jour n'est dit libre ; demain est proposé, sans raison inventée.
  const [choisiLibre, setChoisi] = useState<number>(() => propose ?? plusJours(aujourdhui, 1));
  const figeLe = jourFige && /^\d{2}\.\d{2}\.\d{4}$/.test(jourFige) ? new Date(Number(jourFige.slice(6)), Number(jourFige.slice(3, 5)) - 1, Number(jourFige.slice(0, 2))).getTime() : undefined;
  const choisi = figeLe ?? choisiLibre;
  const verrou = enCours || figeLe !== undefined;
  const [decalage, setDecalage] = useState(0);
  const [stockOuvert, setStockOuvert] = useState(false);

  const besoins = useMemo(() => besoinsDe(recipe, batches, stock), [recipe, batches, stock]);
  const manques = besoins.filter(b => b.etat === 'manque');
  const inconnus = besoins.filter(b => b.etat === 'inconnu');
  const ton = manques.length ? 'manque' : inconnus.length ? 'inconnu' : 'ok';
  // La maquette dit « malts, Saaz, Hallertau, US-05 » sur une ligne : les malts se regroupent, le reste garde son nom ; le détail est dans le stock déplié.
  const maltsDe = new Set((recipe.fermentables ?? recipe.malts ?? []).map(f => f.name.trim().toLowerCase()));
  const nomsCourts = besoins.filter((b, i) => !maltsDe.has(b.article.trim().toLowerCase()) || besoins.findIndex(x => maltsDe.has(x.article.trim().toLowerCase())) === i)
    .map(b => (maltsDe.has(b.article.trim().toLowerCase()) ? 'malts' : b.article));
  const noms = nomsCourts.join(', ');

  const debut = plusJours(lundiDe(aujourdhui), decalage * 7);
  const jours = Array.from({ length: NB_JOURS }, (_, i) => plusJours(debut, i));
  const mois = [...new Set([jours[0], jours[NB_JOURS - 1]].map(nomMois))];
  const titreMois = (mois.length > 1 ? `${mois[0].slice(0, 4)}. – ${mois[1].slice(0, 4)}.` : mois[0]).replace(/^./, c => c.toUpperCase());

  /** « dry hop NEIPA » : le mot, puis le brassin concerné quand un rendez-vous de la fenêtre le nomme (la maquette : « Pils en bouteille »). */
  const nomsLegende = (g: GenreEvenement) => {
    const noms = [...new Set(ctx.evts.filter(e => e.genre === g && e.jour >= jours[0] && e.jour <= jours[NB_JOURS - 1]).map(e => e.nom))];
    return noms.length ? `${PICTO[g].mot} ${noms.join(', ')}` : PICTO[g].mot;
  };
  const raison = raisonDe(ctx, choisi);
  const finNonDateeVisible = jours.some(j => j >= aujourdhui && etatCuve(ctx.occ, j, capaciteL, volumeL).finNonDatee);
  const premier = propose;

  return (
    <div className="d1b-feuille">
      <button type="button" className="d1b-stock" data-ton={ton} aria-expanded={stockOuvert} onClick={() => setStockOuvert(o => !o)}>
        {ton === 'ok' ? <Check aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}
        <span>
          {ton === 'ok' && <><b>Tout est en stock</b> · {noms || 'rien à vérifier'}</>}
          {ton === 'manque' && <><b>Il manque {manques.map(m => m.manque ?? m.article).join(', ')}</b> · il part aux achats</>}
          {ton === 'inconnu' && <><b>À vérifier</b> · {inconnus.map(i => i.article).join(', ')}</>}
        </span>
        <ChevronDown className="d1b-plus" aria-hidden="true" data-ouvert={stockOuvert ? '' : undefined} />
      </button>
      {stockOuvert && (
        <ul className="d1b-besoins">
          {[...manques, ...inconnus, ...besoins.filter(b => b.etat === 'ok')].map(b => (
            <li key={b.cle} data-etat={b.etat}><span>{b.texte}</span><span>{b.droite}</span></li>
          ))}
        </ul>
      )}

      <div className="d1b-mois">
        <h3>{titreMois}<small>la cuve et la cave, jour par jour</small></h3>
        <button type="button" className="d1b-nav" aria-label="Semaines d'avant" disabled={decalage <= 0 || enCours} onClick={() => setDecalage(d => Math.max(0, d - 1))}><ChevronLeft aria-hidden="true" /></button>
        <button type="button" className="d1b-nav" aria-label="Semaines d'après" disabled={enCours} onClick={() => setDecalage(d => d + 1)}><ChevronRight aria-hidden="true" /></button>
      </div>

      <div className="d1b-grille" role="group" aria-label="Jour du brassin">
        {SEMAINE.map(s => <span key={s} className="d1b-sem" aria-hidden="true">{s}</span>)}
        {jours.map(j => {
          const passe = j < aujourdhui;
          const { etat, finNonDatee } = etatCuve(ctx.occ, j, capaciteL, volumeL);
          const evts = evenementsDuJour(ctx, j);
          const genre = (['houblon', 'bouteille', 'garde'] as GenreEvenement[]).find(g => evts.some(e => e.genre === g));
          const num = new Date(j).getDate();
          if (passe) return <button key={j} type="button" className="d1b-j" data-passe disabled aria-label={`${jourLong(j)}, passé`}><b>{num}</b></button>;
          return (
            <button key={j} type="button" className="d1b-j" disabled={verrou}
              data-cuve={etat} {...(finNonDatee ? { 'data-fin': 'non-datee' } : {})} {...(j === aujourdhui ? { 'data-auj': '' } : {})} {...(j === premier && j !== choisi ? { 'data-propose': '' } : {})}
              aria-pressed={j === choisi}
              aria-label={`${jourLong(j)}${j === aujourdhui ? ', aujourd\'hui' : ''}${etat === 'pleine' ? `, cuve pleine${finNonDatee ? ', fin non datée' : ''}` : etat === 'libre' ? ', cuve libre' : ''}${evts.length ? ', ' + evts.map(e => `${PICTO[e.genre].mot} ${e.nom}`).join(', ') : ''}`}
              onClick={() => setChoisi(j)}>
              <b>{num}</b>
              {genre && PICTO[genre].icone}
              {j === premier && j !== choisi && <small>1er</small>}
            </button>
          );
        })}
      </div>

      <div className="d1b-cles" aria-hidden="true">
        <span><i data-cuve="pleine" />cuve pleine</span>{finNonDateeVisible && <span><i data-cuve="pleine" data-fin="non-datee" />fin non datée</span>}<span><i />cuve libre</span>
        {(['houblon', 'bouteille', 'garde'] as GenreEvenement[]).map(g => <span key={g}>{PICTO[g].icone}{nomsLegende(g)}</span>)}
      </div>

      <div className="d1b-choix" data-ton={raison.conflit ? 'attention' : undefined} role="status" aria-live="polite">
        <span className="d1b-choix-date">{jourCourt(choisi).split(' ')[0]} <span className="d1b-num">{new Date(choisi).getDate()}</span></span>
        <div>
          <p><b>{raison.gras}</b>{raison.reste}</p>
          {!verrou && raison.conflit && raison.alternative !== undefined && raison.alternative !== choisi && (
            <button type="button" className="d1b-btn" disabled={enCours} onClick={() => setChoisi(raison.alternative!)}>
              Prendre {jourBouton(raison.alternative)}, le premier libre
            </button>
          )}
        </div>
      </div>

      {figeLe !== undefined && !enCours && <p role="status" className="d1b-erreur">Le brassin est déjà écrit pour {jourLong(figeLe)} : sa confirmation n'est pas reçue. Le jour ne change plus ; confirme l'enregistrement.</p>}
      {avertissement}
      {erreur && <p role="alert" className="d1b-erreur">{erreur}</p>}

      <div className="d1b-pied">
        <button type="button" className="d1b-btn" disabled={enCours} onClick={onAnnuler}>Annuler</button>
        <button type="button" className={`d1b-btn ${raison.conflit ? '' : 'd1b-primaire'}`} disabled={enCours} onClick={() => onPlanifier(dateSuisse(choisi))}>
          {enCours ? 'Enregistrement…' : figeLe !== undefined ? "Confirmer l'enregistrement" : raison.conflit ? 'Planifier quand même' : `Planifier ${jourBouton(choisi)}`}
        </button>
      </div>
      <p className="sr-only">{ecartJours(aujourdhui, choisi)} jours depuis aujourd'hui</p>
    </div>
  );
}
