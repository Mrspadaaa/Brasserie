import React from 'react';
import { Link2, Pin, Star } from 'lucide-react';
import { ecartJours, etiquetteS, francsSignes, type ChoseCalendrier, type JalonBrassin } from '../../../domain/calendrier';
import { CLASSE_TEINTE, ContenuEtiquette, PastilleLie, dureeVue, largeurTexte, nomAccessible, type ModeDeuxLignes } from './Marque';
import { usePointeur } from './usePointeur';

/**
 * Une barre de la frise (E24 à E32). Elle porte ses gestes : toucher (le détail), appui long (le menu), glisser (déplacer en direct, f1-a),
 * tirer le bord (allonger, f2-a). Un brassin y montre ses phases et ses jalons (E25) ; les jours actifs sont des points posés en % de la piste
 * (E24, E45) ; une chose proposée est en pointillé (E26, E47). L'étiquette (nom, montant) vit à côté, du côté libre, ou dans la barre.
 * Le calcul des écritures n'est pas ici : la barre dit ce que le doigt a fait, `CalendrierTab` écrit.
 *
 * CRITIQUE-3 n° 27 : le nom posé dans la barre a un fond, les ronds des jalons passent dessous, jamais dessus. N° 30 : « J7 / 35 · prête
 * 21 déc. » n'est jamais coupé (entier, ou sa forme courte « J7 / 35 »). N° 13 : la pastille « lié à … » se touche (aperçu sur place).
 */

export type CoteEtiquette = 'dedans' | 'gauche' | 'droite';

export interface BarreProps {
  chose: ChoseCalendrier;
  gauche: number;
  largeur: number;
  haut: number;
  hauteur: number;
  cote: CoteEtiquette;
  /** Place de l'étiquette côté libre, en px. */
  placeEtiquette: number;
  /** Le nom passe sur deux lignes à côté de la barre (3 mois, quand la rangée le permet : n° 31). */
  deuxLignes?: ModeDeuxLignes;
  /** La pastille « lié à » n'a pas la place à côté du nom : elle n'est pas posée (le badge lien de la barre reste). */
  sansLie?: boolean;
  /** La durée à côté du nom d'un brassin, entière (« J0 / 28 · prête 21 déc. ») ou courte (« J0 / 28 »), posée par `disposer` ; absente : dans la barre. */
  dureeACote?: string | null;
  largeurColonne: number;
  /** Pas permis pour le glisser : `[min, max]` en semaines. */
  bornes: [number, number];
  epinglee?: boolean;
  etoilee?: boolean;
  selectionnee?: boolean;
  menuOuvert?: boolean;
  /** Pendant un glisser, la barre suit le doigt (px) ; pendant un bord tiré, elle s'allonge (px). */
  decalage?: number;
  allongement?: number;
  /** Le texte « J0 / 35 · prête 21 déc. » pendant ou après un bord tiré. */
  etiquetteDuree?: string;
  /** La pastille « lié à » en nom court (téléphone, 3 mois et plus : CRITIQUE-4 n° 15). */
  lieCourt?: boolean;
  onToucher: (chose: ChoseCalendrier, cible: HTMLElement) => void;
  onAppuiLong: (chose: ChoseCalendrier, cible: HTMLElement) => void;
  onGlisse: (chose: ChoseCalendrier, k: number) => void;
  onLacheGlisse: (chose: ChoseCalendrier, k: number, annule: boolean, jalon?: string) => void;
  onBord: (chose: ChoseCalendrier, jours: number) => void;
  onLacheBord: (chose: ChoseCalendrier, jours: number, annule: boolean) => void;
  onRefus: (chose: ChoseCalendrier, raison: string, jalon?: JalonBrassin) => void;
}

export { PastilleLie };

/** Le montant écrit à côté du nom (« −158 », « 3 j −600 ») : celui que la mise en page mesure (Rangee) est celui qui s'affiche. */
export const montantBarre = (chose: ChoseCalendrier): string | null => {
  if (chose.rangee === 'activites') return chose.joursActifs ? `${chose.joursActifs} j${chose.centimes ? ` ${francsSignes(chose.centimes)}` : ''}` : chose.centimes ? francsSignes(chose.centimes) : null;
  if (chose.centimes === undefined) return null;
  return `${francsSignes(chose.centimes)}${chose.partiel ? ' +' : ''}`;
};
const montantDe = montantBarre;

/**
 * CRITIQUE-5 n° 23 (E25, E29) : une seule forme de durée dans une vue, « J0 / 28 » avec ses espaces. Les formes, de la plus longue à la plus
 * courte : « J0 / 42 · prête 4 janv. », puis « J0 / 42 » : faute de place, c'est « · prête … » qui cède, jamais les espaces. Une durée sans « J »
 * (« pas brassée · prête le 24 nov. ») garde son premier morceau (« pas brassée »).
 */
export function formesDuree(d: string): string[] {
  const morceaux = d.split(' · ');
  return morceaux.length > 1 ? [d, morceaux[0]] : [d];
}

/** Les segments de phases d'un brassin : brassage, fermentation, garde, conditionnement, lus dans les jalons de la recette figée (E25). */
function phases(jalons: readonly JalonBrassin[] | undefined, total: number) {
  if (!jalons?.length || total <= 0) return [];
  const sur = jalons.filter(j => j.ecart >= 0 && j.id !== 'commander').sort((a, b) => a.ecart - b.ecart);
  return sur.map((j, i) => {
    const debut = j.ecart, fin = i + 1 < sur.length ? sur[i + 1].ecart : total;
    return { id: j.id, de: Math.min(100, (debut / total) * 100), largeur: Math.max(0, ((Math.min(fin, total) - debut) / total) * 100) };
  });
}

export const Barre: React.FC<BarreProps> = props => {
  const { chose, gauche, largeur, haut, hauteur, cote, placeEtiquette, largeurColonne, bornes, epinglee, etoilee, selectionnee, menuOuvert, decalage = 0, allongement = 0, etiquetteDuree } = props;
  const el = React.useRef<HTMLDivElement | null>(null);
  const proposee = !!(chose.proposition || chose.probable);
  const brassin = chose.source.genre === 'batch';
  const nbJours = Math.max(1, ecartJours(chose.debut, chose.fin) + 1);
  const total = chose.jalons?.length ? Math.max(...chose.jalons.map(j => j.ecart), nbJours - 1) : 0;

  const gestes = usePointeur({
    largeurColonne,
    borne: () => bornes,
    refuseGlisse: cible => {
      const id = cible?.closest?.('[data-jalon]')?.getAttribute('data-jalon');
      const jalon = id ? chose.jalons?.find(j => j.id === id) : undefined;
      if (jalon && jalon.glissable === false) return jalon.raison ?? `${jalon.libelle} suit la recette du brassin`;
      if (chose.deplacable !== true) return chose.deplacable.raison;
      return null;
    },
    onRefus: (raison, cible) => {
      const id = cible?.closest?.('[data-jalon]')?.getAttribute('data-jalon');
      props.onRefus(chose, raison, id ? chose.jalons?.find(j => j.id === id) : undefined);
    },
    onToucher: () => el.current && props.onToucher(chose, el.current),
    onAppuiLong: () => el.current && props.onAppuiLong(chose, el.current),
    onGlisse: k => props.onGlisse(chose, k),
    onLacheGlisse: (k, annule) => props.onLacheGlisse(chose, k, annule),
    /* le bord (et le jalon de fin) se tire au jour : une semaine = 7 jours, le pas du bord est 1/7 de colonne */
    onBord: k => props.onBord(chose, k),
    onLacheBord: (k, annule) => props.onLacheBord(chose, k, annule)
  });

  const peutBord = chose.deplacable === true && (chose.source.genre === 'batch' || chose.source.genre === 'creative' || (chose.source.genre === 'plan' && chose.source.origine === 'manual')) && !proposee;
  const segments = phases(chose.jalons, total);
  const montant = montantDe(chose);
  const w = Math.max(10, largeur + allongement);
  const duree = dureeVue(chose);
  /* dans la barre : la durée à droite du nom entier, jamais coupée (n° 30) : « J0 / 42 · prête 4 janv. », sinon « J0 / 42 » (n° 23) ; sinon
     rien : le nom ne cède jamais pour elle (CRITIQUE-5 n° 14), elle reste au toucher et au lecteur d'écran */
  const nom = chose.etiquette ?? chose.titre;
  const largeurMontant = montant ? largeurTexte(montant, 700) + 6 : 0;
  const nomEntier = cote === 'dedans' ? largeurTexte(nom, 600) + largeurMontant + 12 : 0;
  const dureeDedans = ((): { texte: string; largeur: number } | null => {
    if (!duree || props.dureeACote || props.deuxLignes === 'duree') return null;
    const formes = formesDuree(duree).map(t => ({ texte: t, largeur: Math.ceil(largeurTexte(t, 600)) + 8 }));
    return formes.find(f => w - 16 - nomEntier >= f.largeur) ?? null;
  })();
  /* f2-a (E29, CRITIQUE-5 n° 1) : pendant le geste, « J0 / 35 · prête 21 déc. » ou « pas brassée · prête le 24 nov. » se lit en entier : dans la
     barre s'il y tient, sinon juste à sa droite */
  const dureeHors = !!etiquetteDuree && Math.ceil(largeurTexte(etiquetteDuree, 600)) + 16 > w;
  const n = chose.joursActifs && chose.joursActifs > 0 ? chose.joursActifs : 0;
  const style: React.CSSProperties = { left: gauche, top: haut, width: w, height: hauteur, transform: decalage ? `translateX(${decalage}px)` : undefined };
  const lblStyle: React.CSSProperties = cote === 'gauche'
    ? { right: `calc(100% - ${gauche + decalage}px + 6px)` }
    : cote === 'droite'
      ? { left: gauche + w + decalage + 6 }
      : { left: gauche + decalage + 6 };
  /* deux lignes (n° 31) : 2 × 14 px, la boîte prend la hauteur de la ligne, jamais une lettre rognée */
  const lblHaut = props.deuxLignes ? { top: haut - 2, height: hauteur + 4 } : { top: haut, height: hauteur };
  const lblPlace = { ...lblStyle, ...lblHaut, maxWidth: cote === 'dedans' ? Math.max(0, w - 12 - (dureeDedans ? dureeDedans.largeur + 4 : 0)) : Math.max(40, placeEtiquette) };

  return (
    <>
      <div
        ref={el}
        role="button"
        tabIndex={0}
        data-chose={chose.id}
        data-chose-id={chose.id}
        data-barre
        data-rangee={chose.rangee}
        data-titre={chose.titre}
        {...(chose.debut ? { 'data-semaine': etiquetteS(chose.debut) } : {})}
        {...(chose.proposition ? { 'data-proposition': chose.proposition } : {})}
        {...(proposee ? { 'data-probable': '' } : {})}
        aria-label={`${nomAccessible(chose)}${montant ? `, ${montant}` : ''}${duree ? `, ${duree}` : ''}${chose.lie ? `, ${chose.lie.texte}` : ''}${chose.courses ? `, courses : ${chose.courses}` : ''}`}
        aria-haspopup="menu"
        aria-expanded={menuOuvert || undefined}
        className={`cal-barre ${CLASSE_TEINTE[chose.rangee]}${proposee ? ' cal-pointille' : ''}${epinglee ? ' cal-epi' : ''}${selectionnee ? ' cal-sel' : ''}${decalage || allongement ? ' cal-glisse' : ''}${chose.deplacable === true ? '' : ' cal-fixe'}${chose.finInconnue ? ' cal-coupee' : ''}`}
        style={style}
        {...gestes}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (el.current) props.onToucher(chose, el.current); } }}
      >
        {brassin && segments.length > 0 && (
          <span className="cal-piste" aria-hidden="true">
            {segments.map(s => <i key={s.id} className={`cal-ph cal-ph-${s.id}`} style={{ left: `${s.de}%`, width: `calc(${s.largeur}% - 2px)` }} />)}
          </span>
        )}
        {brassin && chose.jalons?.filter(j => j.ecart >= 0 && j.id !== 'commander').map(j => (
          <i
            key={j.id}
            data-jalon={j.id}
            {...(j.glissable === 'fin' ? { 'data-bord': '' } : {})}
            data-glissable={String(j.glissable)}
            title={j.glissable === false && j.raison ? `${j.libelle} · ${j.raison}` : j.libelle}
            className="cal-jalon"
            /* CRITIQUE-5 n° 29 : le rond reste dans sa barre (borné par frise.css), jamais un demi-point hors de la grille */
            style={{ ['--x' as string]: `${total > 0 ? Math.min(100, (j.ecart / total) * 100) : 0}%` }}
          />
        ))}
        {n > 0 && (
          <span className="cal-pts" aria-hidden="true">
            {Array.from({ length: n }, (_, i) => <i key={i} data-point style={{ left: `${((i + 0.5) / n) * 100}%` }} />)}
          </span>
        )}
        {etiquetteDuree && <em className={`cal-duree${dureeHors ? ' cal-duree-hors' : ''}`} data-duree>{etiquetteDuree}</em>}
        {/* au repos, « J7 / 28 · prête 14 déc. » vit dans la barre du brassin (as/p-repos), quand il n'est pas déjà à côté du nom */}
        {!etiquetteDuree && dureeDedans && <em className="cal-duree cal-duree-in" data-duree>{dureeDedans.texte}</em>}
        {peutBord && <span data-bord data-grip className="cal-grip" aria-hidden="true" />}
        {(epinglee || etoilee || chose.liens) && (
          <span className="cal-badges" aria-hidden="true">
            {epinglee && <Pin size={12} />}
            {etoilee && <Star size={12} />}
            {chose.liens && <Link2 size={12} />}
          </span>
        )}
      </div>
      {/* CRITIQUE-5 n° 26 : sur deux lignes, le nom et son montant restent ensemble ; la pastille « lié à » passe dessous */}
      {/* f2-a : la durée tirée, posée à droite de la barre, prend la place de l'étiquette le temps du geste (jamais l'une sur l'autre) */}
      <span className={`cal-lbl cal-lbl-${cote}${props.deuxLignes ? ' cal-lbl-2n' : ''}${etiquetteDuree && (dureeHors ? cote !== 'dedans' : cote === 'dedans') ? ' cal-lbl-cede' : ''} ${CLASSE_TEINTE[chose.rangee]}`} style={lblPlace}>
        <ContenuEtiquette chose={chose} nom={nom} montant={montant} duree={props.deuxLignes === 'duree' ? duree : props.dureeACote} deux={props.deuxLignes} lieCourt={props.lieCourt} sansLie={props.sansLie} />
      </span>
    </>
  );
};
