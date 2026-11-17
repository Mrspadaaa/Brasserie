import React from 'react';
import { Beer, Check, ChevronRight, FlaskConical, Leaf, Link2, Package, Receipt, ShoppingCart, Snowflake, Wheat, X } from 'lucide-react';
import { dateDeSemaine, etiquetteS, francsSignes, jourLisible, lundiDe, type ChoseCalendrier, type JalonBrassin, type JalonId } from '../../../domain/calendrier';
import { CLASSE_TEINTE, champ, dureeVue } from './Marque';

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
  onFait?: () => void;
  onPoser?: () => void;
  onAccepter?: () => void;
  /** Une vente prévue : « Facturer › » (E37, D-99). */
  onFacturer?: () => void;
  onMettreDeCote?: (actif: boolean) => void;
}

const LIBELLE_OUVRIR: Record<ChoseCalendrier['ouvre']['ecran'], string> = {
  brassin: 'Ouvrir le brassin', piece: 'Ouvrir la pièce', plan: 'Ouvrir dans Finances', finances: 'Ouvrir dans Finances', agenda: 'Ouvrir dans l’agenda',
  atelier: 'Ouvrir dans l’atelier', materiel: 'Ouvrir dans le matériel', courses: 'Ouvrir les courses', fournisseur: 'Ouvrir le fournisseur', solde: 'Ouvrir Solde'
};

/** Le nom d'une étape du brassin, celui que le brasseur emploie (E25). */
const ETAPE: Record<Exclude<JalonId, 'commander'>, { libelle: string; Icone: typeof Wheat }> = {
  brassage: { libelle: 'Brassage', Icone: Wheat },
  fermentation: { libelle: 'Fermentation', Icone: FlaskConical },
  'dry-hop': { libelle: 'Dry hop', Icone: Leaf },
  garde: { libelle: 'Garde', Icone: Snowflake },
  conditionnement: { libelle: 'Conditionnement', Icone: Package }
};

/** Une date sans point final doublé : « 22 nov. » se suit d'un deux-points, d'une virgule ou de rien, jamais de « . ». */
const date = (iso: string): string => jourLisible(iso);

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
    const prete = chose.finInconnue ? '' : chose.preteLe ?? '';
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

export const DetailChose: React.FC<DetailChoseProps> = props => {
  const { chose, libreSemaine, promesse } = props;
  const brassin = chose.source.genre === 'batch';
  const commander = chose.jalons?.find(j => j.id === 'commander');
  const montant = chose.centimes !== undefined ? francsSignes(chose.centimes) : null;
  const semaine = chose.debut ? dateDeSemaine(lundiDe(chose.debut)) : null;
  const peutMiseDeCote = !!(chose.fenetre && chose.centimes && !brassin && (chose.source.genre === 'creative' || (chose.source.genre === 'plan' && chose.source.origine === 'manual')));
  const proposition = !!chose.proposition;
  const articles = articlesManquants(commander);
  const frais = texteFrais(chose);
  const duree = brassin ? dureeVue(chose) : null;
  const pasBrassee = champ(chose, 'pasBrassee') === true;

  return (
    <div role="region" aria-label={`Détail : ${chose.titre}`} className={`cal-det ${CLASSE_TEINTE[chose.rangee]}`} data-detail={chose.id}>
      <h4 className="cal-det-h">{chose.titre}{montant && <span className={chose.centimes !== undefined && chose.centimes < 0 ? 'cal-neg' : 'cal-pos'}>{chose.reste ? 'reste ' : ''}{montant}{chose.partiel ? ' +' : ''}</span>}{chose.coutAVenir && <span>coût à venir</span>}</h4>
      <button type="button" className="cal-det-x" aria-label="Fermer" onClick={props.onFermer}><X size={22} aria-hidden="true" /></button>

      {brassin ? (
        <>
          {duree && <p className="cal-det-d" data-duree-detail><Beer size={16} aria-hidden="true" />{duree}</p>}
          <div className="cal-det-et cal-det-etapes" data-etapes>
            {etapes(chose).map(e => (
              <div key={e.id} data-etape={e.id}>
                <span>{e.icone}{e.libelle}</span>
                <b>{e.jour ? date(e.jour) : 'à préciser'}{e.id === 'brassage' && pasBrassee ? ' · pas brassée' : ''}</b>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="cal-det-et">
          {semaine && <div><span>Semaine</span><b>{semaine}</b></div>}
          {chose.debut && <div><span>Date</span><b>{date(chose.debut)}{chose.fin && chose.fin !== chose.debut ? ` → ${date(chose.fin)}` : ''}</b></div>}
          {chose.fenetre && <div><span>Fenêtre</span><b>{etiquetteS(chose.fenetre.du)} → {etiquetteS(chose.fenetre.au)}</b></div>}
          {chose.joursActifs ? <div><span>Jours actifs</span><b>{chose.joursActifs} j</b></div> : null}
          {libreSemaine !== undefined && libreSemaine !== null && <div><span>Libre de la semaine</span><b>{francsSignes(libreSemaine).replace(/^\+/, '')}</b></div>}
          {!semaine && <div><span>Date</span><b>Sans date</b></div>}
        </div>
      )}

      {chose.detail && <p className="cal-det-p">{chose.detail}</p>}
      {brassin && commander && (
        <p className="cal-det-p" data-manque>
          <ShoppingCart size={16} aria-hidden="true" />
          <span>Il manque {articles ? <b>{articles}</b> : 'des courses'} : à acheter avant le <b>{date(commander.jour)}</b></span>
        </p>
      )}
      {brassin && chose.courses && <p className="cal-det-p" data-courses><ShoppingCart size={16} aria-hidden="true" /><span>Courses : {chose.courses}</span></p>}
      {brassin && chose.budgetRepris && <p className="cal-det-p" data-budget-repris><Receipt size={16} aria-hidden="true" /><span>{chose.budgetRepris} : à confirmer par Budget ›</span></p>}
      {brassin && chose.coutAVenir && <p className="cal-det-p" data-cout-a-venir><Receipt size={16} aria-hidden="true" /><span>Coût à venir : aucun budget pour cette recette. Budget › le calcule.</span></p>}
      {frais && <p className="cal-det-p" data-frais><Receipt size={16} aria-hidden="true" /><span>Frais : {frais}</span></p>}
      {promesse && <p className="cal-det-p">{promesse}</p>}
      {/* l'aperçu sur place d'une chose liée (D-113, D-126) : « La Cigogne · client ; Blonde d'automne · brassage 23 nov. · prête 21 déc. » */}
      {chose.lie && <p className="cal-det-p" data-apercu-lien><Link2 size={16} aria-hidden="true" /><span><b>{chose.lie.texte}</b> · {chose.lie.apercu}</span></p>}

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
        {props.onRetirer && <button type="button" className="cal-b cal-b-ret" onClick={props.onRetirer}>Retirer</button>}
      </div>
    </div>
  );
};
