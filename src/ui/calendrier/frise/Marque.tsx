import React from 'react';
import { Beer, FileText, Hammer, ListChecks, PartyPopper, ShoppingCart, TrendingUp } from 'lucide-react';
import { etiquetteS, francsSignes, jourLisible, texteDuree, type ChoseCalendrier, type Rangee } from '../../../domain/calendrier';
import { usePointeur } from './usePointeur';

/**
 * La pastille « lié à La Cigogne » (E37, D-113, D-126) : lisible en 3 s (14 px), elle se touche et montre l'aperçu sur place
 * (`lie.apercu` : « La Cigogne · client ; Blonde d'automne · prête 21 déc. »). Elle vit à côté du nom, hors des gestes de la barre.
 */
export function PastilleLie({ lie }: { lie: NonNullable<ChoseCalendrier['lie']> }) {
  const [ouvert, setOuvert] = React.useState(false);
  return (
    <span className="cal-lie-z">
      <button
        type="button" className="cal-lie" data-lie aria-expanded={ouvert} aria-label={`${lie.texte} : aperçu`}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); setOuvert(o => !o); }}
      >{lie.texte}</button>
      {ouvert && <span role="note" className="cal-lie-ap" data-apercu-lien>{lie.apercu}</span>}
    </span>
  );
}

/**
 * La marque (E27, D-198, D-199 ; « les évènements sont trop petits, peut-être utiliser une icône ») : en 3 mois, 6 mois et An, une chose
 * qui ferait moins de 24 px de large devient l'icône de sa rangée, avec un vrai nom pour le lecteur d'écran. Son nom vient aussi au
 * toucher (le détail). Un appui long ouvre la vue 6 semaines centrée sur sa semaine, où elle se déplace (f1-a).
 *
 * La même forme sert de pastille (E26 : « Ventes en pastilles, les livraisons aussi ») et aux sorties dérivées sans montant (le bruit
 * d'Achats, CAL-INFO-TROP) : dans la vue 6 semaines elle se glisse et s'ouvre en menu comme une barre. Elle porte alors son nom et son
 * montant à côté (E13 : « gardent leurs noms et leurs montants »), sauf une sortie dérivée sans montant, dont le nom vient au toucher.
 * **Nouveau, à valider** : la forme de la marque.
 */

export const ICONE_RANGEE: Record<Rangee, typeof Beer> = {
  brassins: Beer, fetes: PartyPopper, ventes: TrendingUp, achats: ShoppingCart, travaux: Hammer, activites: ListChecks, papiers: FileText
};

/** Les couleurs de zone de l'app, une classe par rangée (`frise.css` pose `--c`). */
export const CLASSE_TEINTE: Record<Rangee, string> = {
  brassins: 'cal-t-brassins', fetes: 'cal-t-fetes', ventes: 'cal-t-ventes', achats: 'cal-t-achats', travaux: 'cal-t-travaux', activites: 'cal-t-activites', papiers: 'cal-t-papiers'
};

/** Le nom lu à l'écran : « Frigo, 14 déc., S51 ». Jamais seulement une icône. */
export function nomAccessible(chose: ChoseCalendrier): string {
  const jour = chose.debut ? `${jourLisible(chose.debut)}, ${etiquetteS(chose.debut)}` : 'sans date';
  const propose = chose.proposition || chose.probable ? ', proposé' : '';
  return `${chose.titre}${propose}, ${jour}`;
}

/** « J0 / 28 · prête 14 déc. » : vit dans le domaine (jamais « J0 / 0 »), réexporté pour les vues. */
export { texteDuree };

/** Un champ que le lot A ajoute (`duree`, `pasBrassee`, `frais`) : lu en optionnel, sans supposer son type. */
export const champ = (c: object, k: string): unknown => (c as Record<string, unknown>)[k];

/**
 * La durée montrée d'un brassin (CRITIQUE-3 n° 19, n° 30) : celle du domaine (« J7 / 28 · prête 7 déc. »), « pas brassée » quand la date
 * prévue est passée sans brassage, sinon « durée inconnue ». Jamais une fin inventée ; rien pour ce qui n'est pas un brassin.
 */
export function dureeVue(c: ChoseCalendrier): string | null {
  const d = champ(c, 'duree');
  if (typeof d === 'string' && d.trim()) return d;
  const t = texteDuree(c);
  if (t) return t;
  if (c.rangee !== 'brassins' || c.brassinLie || c.conditionne || c.proposition || c.probable) return null;
  if (champ(c, 'pasBrassee') === true) return 'pas brassée';
  return c.source.genre === 'batch' || c.source.genre === 'prevision-brassin' ? 'durée inconnue' : null;
}

/** Le nom et le montant à côté d'une marque ; `texte` remplace le nom court (le caddie d'un brassin en 6 semaines : « Malt, houblon · Stout maison »). */
export interface LibelleMarque { cote: 'droite' | 'gauche'; place: number; texte?: string }

export interface MarqueProps {
  chose: ChoseCalendrier;
  /** Centre de la marque dans la rangée, en px. */
  centre: number;
  haut: number;
  hauteur?: number;
  largeurColonne: number;
  epinglee?: boolean;
  etoilee?: boolean;
  selectionnee?: boolean;
  menuOuvert?: boolean;
  /** Le nom et le montant à côté (pastille) ; absent : le nom vient au toucher. */
  libelle?: LibelleMarque;
  /** Pendant un glisser, la pastille suit le doigt (px). */
  decalage?: number;
  /** Pas permis pour le glisser, en semaines ; présent : la pastille se glisse et s'ouvre en menu comme une barre. */
  bornes?: [number, number];
  onToucher: (chose: ChoseCalendrier, cible: HTMLElement) => void;
  /** Appui long d'une marque en 3 mois, 6 mois ou An : la vue 6 semaines centrée sur cette chose (E27, D-199). Absent : rien. */
  onSixSemaines?: (chose: ChoseCalendrier) => void;
  onAppuiLong?: (chose: ChoseCalendrier, cible: HTMLElement) => void;
  onGlisse?: (chose: ChoseCalendrier, k: number) => void;
  onLacheGlisse?: (chose: ChoseCalendrier, k: number, annule: boolean) => void;
  onRefus?: (chose: ChoseCalendrier, raison: string) => void;
}

const montantDe = (c: ChoseCalendrier): string | null => (c.centimes === undefined ? null : `${francsSignes(c.centimes)}${c.partiel ? ' +' : ''}`);

export const Marque: React.FC<MarqueProps> = props => {
  const { chose, centre, haut, hauteur = 28, largeurColonne, epinglee, etoilee, selectionnee, menuOuvert, libelle, decalage = 0, bornes } = props;
  const cible = React.useRef<HTMLButtonElement | null>(null);
  const Icone = chose.brassinLie ? ShoppingCart : ICONE_RANGEE[chose.rangee];
  const commeBarre = !!bornes;
  const gestes = usePointeur({
    largeurColonne,
    borne: () => bornes ?? [0, 0],
    refuseGlisse: () => (commeBarre && chose.deplacable !== true ? chose.deplacable.raison : commeBarre ? null : 'marque'),
    onRefus: raison => { if (commeBarre) props.onRefus?.(chose, raison); },
    onToucher: () => cible.current && props.onToucher(chose, cible.current),
    onAppuiLong: () => {
      if (commeBarre && cible.current && props.onAppuiLong) props.onAppuiLong(chose, cible.current);
      else props.onSixSemaines?.(chose);
    },
    onGlisse: k => props.onGlisse?.(chose, k),
    onLacheGlisse: (k, annule) => props.onLacheGlisse?.(chose, k, annule)
  });
  const proposee = !!(chose.proposition || chose.probable);
  const montant = montantDe(chose);
  const style: React.CSSProperties = { left: centre - hauteur / 2, top: haut, width: hauteur, height: hauteur, transform: decalage ? `translateX(${decalage}px)` : undefined };
  const lbl: React.CSSProperties | undefined = libelle
    ? {
      top: haut, height: hauteur, maxWidth: Math.max(40, libelle.place),
      ...(libelle.cote === 'droite' ? { left: centre + 14 + decalage + 6 } : { right: `calc(100% - ${centre - 14 + decalage}px + 6px)` })
    }
    : undefined;
  return (
    <>
      <button
        ref={cible}
        type="button"
        data-chose={chose.id}
        data-chose-id={chose.id}
        data-marque
        data-rangee={chose.rangee}
        data-titre={chose.titre}
        {...(chose.debut ? { 'data-semaine': etiquetteS(chose.debut) } : {})}
        {...(chose.brassinLie ? { 'data-brassin-lie': chose.brassinLie } : {})}
        {...(chose.proposition ? { 'data-proposition': chose.proposition } : {})}
        {...(proposee ? { 'data-probable': '' } : {})}
        aria-label={`${nomAccessible(chose)}${montant ? `, ${montant}` : ''}`}
        aria-pressed={selectionnee || undefined}
        aria-haspopup={commeBarre ? 'menu' : undefined}
        aria-expanded={menuOuvert || undefined}
        className={`cal-marque ${CLASSE_TEINTE[chose.rangee]}${proposee ? ' cal-pointille' : ''}${epinglee ? ' cal-epi' : ''}${selectionnee ? ' cal-sel' : ''}${decalage ? ' cal-glisse' : ''}`}
        style={style}
        {...gestes}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (cible.current) props.onToucher(chose, cible.current); } }}
      >
        <Icone size={16} aria-hidden="true" />
        {etoilee && <span className="cal-etoile" aria-hidden="true">★</span>}
      </button>
      {libelle && lbl && (
        <span className={`cal-lbl cal-lbl-${libelle.cote} ${CLASSE_TEINTE[chose.rangee]}`} style={lbl}>
          <span className="cal-lbl-t" aria-hidden="true">{libelle.texte ?? chose.etiquette ?? chose.titre}</span>
          {montant && <b aria-hidden="true" className={`cal-lbl-m${chose.centimes !== undefined && chose.centimes < 0 ? ' cal-neg' : ''}`}>{montant}</b>}
          {chose.lie && <PastilleLie lie={chose.lie} />}
        </span>
      )}
    </>
  );
};
