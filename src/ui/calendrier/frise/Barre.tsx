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
  /**
   * CRITIQUE-9 n° 3 (E25, E29) : « J0 / 28 · prête 21 déc. » n'a la place ni à côté, ni sur la ligne du nom. `barre` : la barre prend deux
   * lignes, le nom en haut, la phrase entière en bas à droite, sur la piste des phases (as/cap/p-repos) ; `dessous` : la phrase entière sur la
   * ligne sous la barre, de `x` à `x + largeur` (dans le repère de la rangée), quand la barre est trop étroite pour elle.
   */
  phraseBas?: { ou: 'barre' } | { ou: 'dessous'; x: number; dy: number } | null;
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

/**
 * La forme de durée que la barre porte dedans, la première qui tient (entière, puis courte) ; `nomDedans` : le nom et son montant sont sur la
 * même ligne, à gauche. `null` : aucune. Une seule mesure pour `disposer` (Rangee) et la barre, sans quoi l'une promet ce que l'autre coupe.
 */
export function dureeDansBarre(chose: ChoseCalendrier, w: number, nomDedans: boolean): string | null {
  const duree = dureeVue(chose);
  if (!duree) return null;
  const montant = montantBarre(chose);
  const nomEntier = nomDedans ? largeurTexte(chose.etiquette ?? chose.titre, 600) + (montant ? largeurTexte(montant, 700) + 6 : 0) + 12 : 0;
  return formesDuree(duree).find(t => w - 16 - nomEntier >= largeurDuree(t)) ?? null;
}
/** La largeur d'une durée posée dans la barre ou sous elle (son jeu compris). */
export const largeurDuree = (t: string): number => Math.ceil(largeurTexte(t, 600)) + 8;

/** CRITIQUE-9 doute f2-a : la zone de prise du bord d'une barre, de part et d'autre du bord, pour un doigt (une rangée de 18 px en paysage). */
export const ZONE_BORD_PX = 12;

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
  const peutBord = chose.deplacable === true && (chose.source.genre === 'batch' || chose.source.genre === 'creative' || (chose.source.genre === 'plan' && chose.source.origine === 'manual')) && !proposee;

  const gestes = usePointeur({
    largeurColonne,
    borne: () => bornes,
    /* doute f2-a (E29, D-47) : un doigt posé à 12 px du bord, dedans ou dehors, tire le bord, même sur une rangée de 18 px */
    zoneBord: peutBord ? ZONE_BORD_PX : 0,
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

  const segments = phases(chose.jalons, total);
  const montant = montantDe(chose);
  const w = Math.max(10, largeur + allongement);
  const duree = dureeVue(chose);
  const nom = chose.etiquette ?? chose.titre;
  /* CRITIQUE-9 n° 3 : la phrase entière en bas de la barre haute (as/cap/p-repos), ou sur la ligne sous elle ; le nom reste seul en haut */
  const bas = props.phraseBas ?? null;
  const formeEntiere = duree ? formesDuree(duree)[0] : null;
  /* dans la barre : la durée à droite du nom entier, jamais coupée (n° 30) : « J0 / 42 · prête 4 janv. », sinon « J0 / 42 » (n° 23) ; sinon
     rien : le nom ne cède jamais pour elle (CRITIQUE-5 n° 14), elle reste au toucher et au lecteur d'écran */
  const dureeDedans = ((): { texte: string; largeur: number } | null => {
    if (!duree || props.dureeACote || props.deuxLignes === 'duree' || bas?.ou === 'dessous') return null;
    if (bas?.ou === 'barre' && formeEntiere) return { texte: formeEntiere, largeur: largeurDuree(formeEntiere) };
    const t = dureeDansBarre(chose, w, cote === 'dedans');
    return t ? { texte: t, largeur: largeurDuree(t) } : null;
  })();
  /* f2-a (E29, CRITIQUE-5 n° 1) : pendant le geste, « J0 / 35 · prête 21 déc. » ou « pas brassée · prête le 24 nov. » se lit en entier : dans la
     barre s'il y tient, sinon juste à sa droite */
  const dureeHors = !!etiquetteDuree && Math.ceil(largeurTexte(etiquetteDuree, 600)) + 16 > w;
  /* CRITIQUE-7 n° 2 (E29) : la durée écrite à côté du nom suit le doigt, elle aussi : jamais l'ancienne « prête le … » à côté de la nouvelle */
  const dureeRepos = props.deuxLignes === 'duree' ? duree : props.dureeACote;
  const dureeEtiquette = dureeRepos && etiquetteDuree ? etiquetteDuree : dureeRepos;
  /* la phrase posée sous la barre suit le doigt de même ; pendant le geste, elle seule dit la nouvelle date (aucune bulle en double) */
  const phraseDessous = bas?.ou === 'dessous' ? (etiquetteDuree ?? formeEntiere) : null;
  const n = chose.joursActifs && chose.joursActifs > 0 ? chose.joursActifs : 0;
  const style: React.CSSProperties = { left: gauche, top: haut, width: w, height: hauteur, transform: decalage ? `translateX(${decalage}px)` : undefined };
  const lblStyle: React.CSSProperties = cote === 'gauche'
    ? { right: `calc(100% - ${gauche + decalage}px + 6px)` }
    : cote === 'droite'
      ? { left: gauche + w + decalage + 6 }
      : { left: gauche + decalage + 6 };
  /* deux lignes (n° 31) : 2 × 14 px, la boîte prend la hauteur de la ligne, jamais une lettre rognée ; la barre haute garde son nom sur sa
     première ligne (la hauteur d'une barre simple) */
  const hautNom = bas?.ou === 'barre' ? Math.max(18, hauteur - Math.round(hauteur / 2) - 2) : hauteur;
  const lblHaut = props.deuxLignes ? { top: haut - 2, height: hauteur + 4 } : { top: haut, height: hautNom };
  const dureeMemeLigne = dureeDedans && bas?.ou !== 'barre' ? dureeDedans.largeur + 4 : 0;
  const lblPlace = { ...lblStyle, ...lblHaut, maxWidth: cote === 'dedans' ? Math.max(0, w - 12 - dureeMemeLigne) : Math.max(40, placeEtiquette) };
  /* pendant f2-a, la durée tirée remplace le nom d'une barre simple ; la barre haute et la phrase du dessous gardent le nom (elles ont leur ligne) */
  const cede = !!etiquetteDuree && !bas && (dureeHors ? cote !== 'dedans' : cote === 'dedans');
  /* CRITIQUE-9 n° 10 (D-113, D-126) : la pastille « lié à » n'a pas la place à côté du nom : l'icône lien du badge de la barre se touche et
     ouvre l'aperçu. Le bouton, nommé « Hotte, liée à Blonde d'automne : aperçu », est posé sur l'icône, hors de la barre (jamais un bouton dans
     un bouton) ; l'icône reste dessinée par le badge (une seule à l'image) */
  const lienIcone = props.sansLie && chose.lie ? chose.lie : null;

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
        className={`cal-barre ${CLASSE_TEINTE[chose.rangee]}${bas?.ou === 'barre' ? ' cal-barre-2l' : ''}${proposee ? ' cal-pointille' : ''}${epinglee ? ' cal-epi' : ''}${selectionnee ? ' cal-sel' : ''}${decalage || allongement ? ' cal-glisse' : ''}${chose.deplacable === true ? '' : ' cal-fixe'}${chose.finInconnue ? ' cal-coupee' : ''}`}
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
          /* CRITIQUE-10 n° 2 (E24, D-9) : un conteneur à part du libellé ; dans la barre haute, il prend la ligne sous le nom */
          <span className={`cal-pts${bas?.ou === 'barre' ? ' cal-pts-bas' : ''}`} data-points={n} aria-hidden="true">
            {Array.from({ length: n }, (_, i) => <i key={i} data-point style={{ left: `${((i + 0.5) / n) * 100}%` }} />)}
          </span>
        )}
        {etiquetteDuree && bas?.ou !== 'dessous' && <em className={`cal-duree${dureeHors && !bas ? ' cal-duree-hors' : ''}${bas ? ' cal-duree-in' : ''}`} data-duree>{etiquetteDuree}</em>}
        {/* au repos, « J7 / 28 · prête 14 déc. » vit dans la barre du brassin (as/p-repos), quand il n'est pas déjà à côté du nom */}
        {!etiquetteDuree && dureeDedans && <em className="cal-duree cal-duree-in" data-duree>{dureeDedans.texte}</em>}
        {peutBord && <span data-bord data-grip className="cal-grip" aria-hidden="true" />}
        {(epinglee || etoilee || chose.liens || lienIcone) && (
          <span className="cal-badges" aria-hidden="true">
            {epinglee && <Pin size={12} />}
            {etoilee && <Star size={12} />}
            {(chose.liens || lienIcone) && <Link2 size={12} />}
          </span>
        )}
      </div>
      {/* CRITIQUE-5 n° 26 : sur deux lignes, le nom et son montant restent ensemble ; la pastille « lié à » passe dessous */}
      {/* f2-a : la durée tirée, posée à droite de la barre, prend la place de l'étiquette le temps du geste (jamais l'une sur l'autre) */}
      <span className={`cal-lbl cal-lbl-${cote}${props.deuxLignes ? ' cal-lbl-2n' : ''}${cede ? ' cal-lbl-cede' : ''} ${CLASSE_TEINTE[chose.rangee]}`} style={lblPlace}>
        <ContenuEtiquette chose={chose} nom={nom} montant={montant} duree={dureeEtiquette} deux={props.deuxLignes} lieCourt={props.lieCourt} sansLie={props.sansLie} />
      </span>
      {bas?.ou === 'dessous' && phraseDessous && (
        <span
          className={`cal-lbl cal-lbl-sous ${CLASSE_TEINTE[chose.rangee]}`} data-phrase-sous={chose.id} aria-hidden="true"
          style={{ left: bas.x + decalage, top: haut + bas.dy, height: hauteur }}
        ><small className="cal-lbl-j">{phraseDessous}</small></span>
      )}
      {lienIcone && (
        <span className={`cal-lie-coin ${CLASSE_TEINTE[chose.rangee]}`} style={{ left: gauche + w + decalage - 16, top: haut - 10 }}>
          <PastilleLie lie={lienIcone} icone={nom} />
        </span>
      )}
    </>
  );
};
