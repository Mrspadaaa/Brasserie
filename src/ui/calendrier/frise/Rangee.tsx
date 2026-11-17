import React from 'react';
import { ChevronRight, Eye, EyeOff, Plus, ShoppingCart } from 'lucide-react';
import { ajouterJours, ecartJours, estMarque, etiquetteS, francsSignes, jourLisible, nomRangee, texteDuree, type ChoseCalendrier, type JalonBrassin, type Rangee as IdRangee } from '../../../domain/calendrier';
import { Barre, type BarreProps, type CoteEtiquette } from './Barre';
import { CLASSE_TEINTE, Marque } from './Marque';

/**
 * Une rangée de la frise (E20 à E23) : son titre à gauche, juste au-dessus de ses barres, le carré de couleur qui porte le + blanc (E21),
 * la pastille r2-c (E23), l'œil qui masque (E22). Sa mise en page est une fonction pure (`disposer`) : une chose se pose sur la première
 * ligne où ni elle ni son nom ne en touchent une autre (E26 : deux ventes de la même semaine ne se chevauchent pas), et une chose de moins
 * de 24 px devient une marque (E27).
 *
 * En paysage (E10, D-174 : « Bien mais pas très compact »), le titre se pose sur la première ligne, à gauche, et les barres prennent la place
 * libre à côté : une rangée d'une ligne fait 28 px. Le nom d'une barre ne passe jamais sous le + volant (`reserveDroite`, D-135), et il n'est
 * jamais rogné en « F. » : il garde son montant et au moins neuf lettres, ou change de côté ou de ligne (CRITIQUE-2 n° 10, 13, 19).
 */

/** Une colonne de la frise : une semaine, ou un mois dans la vue An. */
export interface Colonne { debut: string; fin: string; etiquette: string }

/** Où une chose tombe dans les colonnes affichées ; `null` si elle est entièrement dehors ou sans date. */
export function positionDans(colonnes: readonly Colonne[], chose: { debut: string; fin: string }): { a: number; b: number; coupeAGauche: boolean; coupeADroite: boolean } | null {
  if (!colonnes.length || !chose.debut) return null;
  const fin = chose.fin || chose.debut;
  let a = -1, b = -1;
  colonnes.forEach((c, i) => { if (fin >= c.debut && chose.debut <= c.fin) { if (a < 0) a = i; b = i; } });
  if (a < 0) return null;
  return { a, b, coupeAGauche: chose.debut < colonnes[0].debut, coupeADroite: fin > colonnes[colonnes.length - 1].fin };
}

export interface Mesures { ligne: number; barre: number; titre: number }
/* E43 : en portrait, 6 rangées d'un coup d'œil (une ligne de 30 px porte une barre de 26 px et un texte de 14 px) ; en paysage, 48 px au plus la rangée médiane. */
export const MESURES_PORTRAIT: Mesures = { ligne: 30, barre: 26, titre: 24 };
export const MESURES_PAYSAGE: Mesures = { ligne: 22, barre: 19, titre: 22 };

export interface Disposition {
  chose: ChoseCalendrier;
  a: number; b: number;
  gauche: number; largeur: number;
  ligne: number;
  /** Une icône ronde : trop petite pour une barre (E27), pastille de vente (E26), brassin conditionné, courses d'un brassin. */
  marque: boolean;
  /** Trop petite à cette échelle : l'appui long ouvre les 6 semaines. Sinon la marque se glisse et s'ouvre en menu comme une barre. */
  petite: boolean;
  /** La marque porte son nom et son montant à côté (E13, E26). */
  avecLibelle: boolean;
  /** Le texte « J0 / n · prête le … » tient à côté du nom d'un brassin. */
  duree: boolean;
  cote: CoteEtiquette;
  place: number;
}

const CHAR_PX = 7.6;
const texteVu = (c: ChoseCalendrier): string => c.etiquette ?? c.titre;
const montantTexte = (c: ChoseCalendrier): string => (c.rangee === 'activites' && c.joursActifs ? `${c.joursActifs} j` : c.centimes !== undefined ? francsSignes(c.centimes) : '');

export const largeurEtiquette = (c: ChoseCalendrier): number => {
  const m = montantTexte(c), d = texteDuree(c), l = c.lie?.texte;
  return Math.ceil((texteVu(c).length + (m ? m.length + 1 : 0) + (d ? d.length + 2 : 0) + (l ? l.length + 3 : 0)) * CHAR_PX) + 4;
};
/** Le moins qu'une étiquette garde : son montant entier et dix lettres de son nom (« Facture Ca… +1 200 »), jamais « F. ». */
export const largeurEtiquetteMin = (c: ChoseCalendrier): number => {
  const m = montantTexte(c);
  return Math.ceil((Math.min(texteVu(c).length, 10) + (m ? m.length + 1 : 0)) * CHAR_PX) + 10;
};

/** Une sortie dérivée d'un brassin dont le montant n'est pas renseigné : une icône, son nom vient au toucher (CAL-INFO-TROP). */
const deriveSansMontant = (c: ChoseCalendrier): boolean => c.source.genre === 'prevision-brassin' && c.centimes === undefined;

export interface OptionsDisposer {
  /** Largeur, à droite, où aucun nom ne se pose (le + volant, D-135). */
  reserveDroite?: number;
  /** Paysage : la largeur que le titre occupe sur la première ligne, à gauche. */
  zoneTitre?: number;
  /** Paysage : un nom se raccourcit jusqu'à son minimum plutôt qu'ouvrir une ligne (D-174 : « pas très compact »). */
  compact?: boolean;
}

/** Pose les choses d'une rangée sans qu'une barre ni un nom en touche un autre. Pure : `largeur` et `largeurColonne` viennent de la mesure. */
export function disposer(choses: readonly ChoseCalendrier[], colonnes: readonly Colonne[], largeurColonne: number, largeur: number, options: OptionsDisposer = {}): { items: Disposition[]; lignes: number } {
  const reserve = Math.max(0, options.reserveDroite ?? 0);
  const places = choses.flatMap(c => { const p = positionDans(colonnes, c); return p ? [{ c, p }] : []; })
    .sort((x, y) => x.p.a - y.p.a || (y.p.b - y.p.a) - (x.p.b - x.p.a) || x.c.id.localeCompare(y.c.id));
  const lignes: Array<Array<[number, number]>> = [];
  if (options.zoneTitre && options.zoneTitre > 0) lignes.push([[-1000, options.zoneTitre]]);
  const items: Disposition[] = [];
  /* l'année (colonnes d'un mois) : la chose garde sa vraie durée, au jour près ; en semaines, elle prend ses colonnes entières */
  const auJour = colonnes.length > 0 && ecartJours(colonnes[0].debut, colonnes[0].fin) >= 14;
  const xDuJour = (iso: string): number => {
    const i = colonnes.findIndex(c => iso >= c.debut && iso <= c.fin);
    if (i < 0) return iso < colonnes[0].debut ? 0 : colonnes.length * largeurColonne;
    const c = colonnes[i];
    return (i + ecartJours(c.debut, iso) / (ecartJours(c.debut, c.fin) + 1)) * largeurColonne;
  };
  /* le côté de l'étiquette : entière si elle tient, sinon au moins son montant et dix lettres, jamais sous le + volant */
  const cote = (x0: number, x1: number, lab: number, min: number): { cote: 'gauche' | 'droite'; place: number } | null => {
    const libreG = x0 - 8, libreD = largeur - reserve - x1 - 8;
    if (libreD >= lab) return { cote: 'droite', place: lab };
    if (libreG >= lab) return { cote: 'gauche', place: lab };
    if (libreD >= min && libreD >= libreG) return { cote: 'droite', place: libreD };
    if (libreG >= min) return { cote: 'gauche', place: libreG };
    if (libreD >= min) return { cote: 'droite', place: libreD };
    return null;
  };
  const libre = (ligne: number, x0: number, x1: number) => !lignes[ligne]?.some(([a, b]) => x0 < b + 6 && x1 > a - 6);
  for (const { c, p } of places) {
    let gauche = p.a * largeurColonne + 2;
    let w = Math.max(0, (p.b - p.a + 1) * largeurColonne - 4);
    if (auJour) {
      const g = Math.max(0, xDuJour(c.debut)), d = Math.min(colonnes.length * largeurColonne, xDuJour(ajouterJours(c.fin || c.debut, 1)));
      gauche = g + 1; w = Math.max(0, d - g - 2);
    }
    const petite = estMarque(w);
    const pastilleVente = c.rangee === 'ventes' && p.a === p.b && !c.proposition;
    const marque = petite || pastilleVente || deriveSansMontant(c) || !!c.conditionne || !!c.brassinLie;
    /* le caddie d'un brassin n'a pas d'étiquette : il est relié à sa barre par un trait (sa maquette), son nom se lit au toucher */
    const avecLibelle = marque && !deriveSansMontant(c) && !c.brassinLie;
    const lab = largeurEtiquette(c), min = Math.min(lab, largeurEtiquetteMin(c));
    let leCote: CoteEtiquette = 'dedans', place = 0, x0 = gauche, x1 = gauche + (marque ? 28 : w);
    let objet0 = gauche, objet1 = gauche + w;
    if (marque) {
      const centre = auJour ? gauche + w / 2 : (p.a + 0.5) * largeurColonne;
      gauche = centre - 14;
      objet0 = gauche; objet1 = centre + 14;
      x0 = objet0; x1 = objet1;
    }
    if (marque ? avecLibelle : true) {
      const batch = c.source.genre === 'batch';
      /* paysage (w3s) : l'étiquette dans sa barre dès que son minimum y tient ; sinon contre elle */
      const dedans = !marque && (options.compact ? w - 16 >= min : !c.proposition && (batch ? Math.max(objet0 - 8, largeur - reserve - objet1 - 8) < 90 : w - 16 >= lab));
      const choix = dedans ? null : cote(objet0, objet1, lab, min);
      if (dedans || (!choix && !marque && w - 16 >= min)) { leCote = 'dedans'; place = Math.max(0, w - 16); }
      else if (choix) { leCote = choix.cote; place = choix.place; }
      else {
        /* nulle part assez de place : le côté le plus large, avec au moins son montant et dix lettres */
        const libreG = objet0 - 8, libreD = largeur - reserve - objet1 - 8;
        leCote = libreD >= libreG ? 'droite' : 'gauche'; place = Math.max(min, leCote === 'droite' ? libreD : libreG);
      }
      if (leCote === 'droite') x1 = objet1 + 6 + place;
      else if (leCote === 'gauche') x0 = objet0 - 6 - place;
    }
    let ligne = 0;
    while (!libre(ligne, x0, x1)) ligne++;
    /* E43 : plutôt qu'ouvrir une ligne de plus, le nom se raccourcit (…) pour tenir sur une ligne déjà ouverte, jamais sous son minimum */
    if (ligne >= lignes.length && lignes.length > 0 && leCote !== 'dedans' && (!marque || avecLibelle)) {
      const court = options.compact ? min : Math.max(min, Math.min(place, largeur > 700 ? 120 : 96));
      if (court < place) {
        const [y0, y1] = leCote === 'droite' ? [x0, objet1 + 6 + court] : [objet0 - 6 - court, x1];
        const l = lignes.findIndex((_, i) => libre(i, y0, y1));
        if (l >= 0) { ligne = l; place = court; x0 = y0; x1 = y1; }
      }
    }
    (lignes[ligne] ||= []).push([x0, x1]);
    /* « J0 / 28 · prête 7 déc. » ne se montre à côté que s'il tient en entier (jamais coupé en deux) ; sinon il vit dans la barre */
    const duree = !marque && !!texteDuree(c) && leCote !== 'dedans' && place >= lab - 4;
    items.push({ chose: c, a: p.a, b: p.b, gauche, largeur: marque ? 28 : w, ligne, marque, petite, avecLibelle, duree, cote: leCote, place });
  }
  const occupees = lignes.reduce((n, l, i) => (l.some(([a]) => a > -1000) ? i + 1 : n), 0);
  return { items, lignes: occupees };
}

export interface Pastille { texte: string; lecture: string; part: number; solde: number | null; debut: string; fin: string }
/** E23 : « Ventes, confirmé de S47 à S52 : 2 choses, solde +900 ». Ce qui n'est pas chiffré est dit en mots, jamais compté 0. */
export function pastille(rangee: IdRangee, choses: readonly ChoseCalendrier[], colonnes: readonly Colonne[]): Pastille {
  /* le caddie d'un brassin répète une part de son budget : la pastille ne le recompte pas */
  const dedans = choses.filter(c => !c.brassinLie && positionDans(colonnes, c));
  const fermes = dedans.filter(c => !c.probable && !c.proposition);
  const probables = dedans.length - fermes.length;
  const chiffrees = fermes.filter(c => c.centimes !== undefined);
  const sansMontant = fermes.length - chiffrees.length;
  const solde = chiffrees.length ? chiffrees.reduce((s, c) => s + (c.centimes as number), 0) : null;
  const premier = colonnes[0]?.etiquette ?? '', dernier = colonnes[colonnes.length - 1]?.etiquette ?? '';
  const n = fermes.length;
  const morceaux = [`${nomRangee(rangee)}, confirmé de ${premier} à ${dernier} : ${n} chose${n > 1 ? 's' : ''}`];
  const jours = fermes.reduce((s, c) => s + (c.joursActifs ?? 0), 0);
  if (rangee === 'activites') {
    if (jours) morceaux.push(`${jours} j`);
  } else if (solde !== null) morceaux.push(`solde ${francsSignes(solde)}`);
  else if (n) morceaux.push('solde non renseigné');
  if (sansMontant && solde !== null) morceaux.push(`${sansMontant} sans montant`);
  if (probables) morceaux.push(`${probables} probable${probables > 1 ? 's' : ''}`);
  /* le nombre dit ce qu'on voit : toutes les choses de la fenêtre, probables comprises (une étiquette « 4 » devant 5 barres se contredit) */
  const nbVu = dedans.length;
  const texte = rangee === 'activites' ? (jours ? `${jours} j` : nbVu ? `${nbVu}` : '') : solde !== null ? francsSignes(solde) : nbVu ? `${nbVu}` : '';
  return { texte, lecture: morceaux.join(', '), part: solde === null ? 0 : Math.abs(solde), solde, debut: premier, fin: dernier };
}

export interface DragEtat { id: string; mode: 'glisse' | 'bord'; k: number; jours: number }

/** Un renvoi vers une chose hors de la vue (E32 : « Livraison La Cigogne · S1 › »). */
export interface Renvoi { chose: ChoseCalendrier; texte: string }

export interface RangeeProps {
  id: IdRangee;
  /** Toutes les choses de cette rangée (la rangée filtre ce qu'elle montre). */
  choses: readonly ChoseCalendrier[];
  colonnes: readonly Colonne[];
  largeurColonne: number;
  largeur: number;
  mesures: Mesures;
  /** Paysage : le titre sur la première ligne, la rangée compacte (E10). */
  paysage?: boolean;
  /** Largeur à droite où aucun nom ne se pose (le + volant). */
  reserveDroite?: number;
  /** Rangée masquée par l'œil ou par un filtre : seules les choses épinglées restent. */
  masquee: boolean;
  /** Pourquoi : l'œil (réaffichable d'un toucher) ou un filtre de la visite. */
  cause: 'oeil' | 'filtre' | null;
  epingles: readonly string[];
  etoiles: readonly string[];
  /** Part de la plus grosse pastille de la frise (0..1 de |solde| / max). */
  partMax: number;
  selectionId?: string | null;
  menuId?: string | null;
  drag: DragEtat | null;
  /** Une phrase pendant le glisser (« S51 · 14 déc. · lâcher ici »). */
  ici?: string | null;
  etiquetteDuree?: { id: string; texte: string } | null;
  renvois?: readonly Renvoi[];
  onRenvoi?: (chose: ChoseCalendrier) => void;
  onAjouter: (r: IdRangee) => void;
  onBasculerMasque: (r: IdRangee) => void;
  barre: Pick<BarreProps, 'onToucher' | 'onAppuiLong' | 'onGlisse' | 'onLacheGlisse' | 'onBord' | 'onLacheBord' | 'onRefus'>;
  onSixSemaines: (chose: ChoseCalendrier) => void;
  /** Le détail de la chose choisie de cette rangée, posé sous ses barres (f4-b). */
  detail?: React.ReactNode;
}

/** Paysage : la largeur estimée du titre (carré +, nom, œil, pastille), posé sur la première ligne. */
function largeurTitre(nom: string, texteAPart: string): number {
  return Math.ceil(20 + 6 + nom.length * 8.4 + 6 + 24 + 6 + (texteAPart ? Math.max(52, texteAPart.length * 8.4 + 20) : 0) + 10);
}

export const Rangee: React.FC<RangeeProps> = props => {
  const { id, choses, colonnes, largeurColonne, largeur, mesures, paysage = false, reserveDroite = 0, masquee, cause, epingles, etoiles, partMax, selectionId, menuId, drag, ici, etiquetteDuree, renvois = [] } = props;
  const nom = nomRangee(id);
  const dedans = choses.filter(c => positionDans(colonnes, c));
  const montrees = masquee ? dedans.filter(c => epingles.includes(c.id)) : dedans;
  const cachees = masquee ? dedans.length - montrees.length : 0;
  const p = pastille(id, masquee ? [] : dedans, colonnes);
  const vide = dedans.length === 0;
  const texteCachees = cachees ? `${cachees} chose${cachees > 1 ? 's' : ''} cachée${cachees > 1 ? 's' : ''}` : '';
  const zoneTitre = paysage ? largeurTitre(nom, masquee ? (texteCachees || 'masquée') : vide ? 'vide' : p.texte) + renvois.reduce((s, r) => s + r.texte.length * 7.6 + 24, 0) : 0;
  const { items, lignes } = React.useMemo(
    () => disposer(montrees, colonnes, largeurColonne, largeur, { reserveDroite, zoneTitre, compact: paysage }),
    [montrees, colonnes, largeurColonne, largeur, reserveDroite, zoneTitre, paysage]
  );
  const hauteurLane = lignes === 0 ? 0 : lignes * mesures.ligne + 2;
  const fantome = drag ? items.find(i => i.chose.id === drag.id) : undefined;
  const auJour = colonnes.length > 0 && ecartJours(colonnes[0].debut, colonnes[0].fin) >= 14;
  const parts = partMax > 0 ? Math.max(8, Math.round((p.part / partMax) * 100)) : 0;

  return (
    <section
      className={`cal-rangee ${CLASSE_TEINTE[id]}${masquee ? ' cal-masquee' : ''}${paysage ? ' cal-rangee-l' : ''}`}
      data-rangee={id}
      aria-label={nom}
      style={{ ['--cw' as string]: `${largeurColonne}px`, ...(paysage ? { minHeight: mesures.ligne + 2 } : {}) }}
    >
      <header className="cal-rh" style={{ height: paysage ? mesures.ligne : mesures.titre }}>
        <button type="button" className="cal-plus" data-plus={id} aria-label={`Ajouter dans ${nom}`} onClick={() => props.onAjouter(id)}>
          <Plus size={16} strokeWidth={3} aria-hidden="true" />
        </button>
        <h3 className="cal-nom">{nom}</h3>
        {/* gi2 : l'œil est collé au titre, puis la pastille r2-c (remplie en proportion, avec son montant) et ce qu'elle compte */}
        {cause !== 'filtre' && (
          <button type="button" className="cal-oeil" aria-pressed={masquee} aria-label={masquee ? `Afficher ${nom}` : `Masquer ${nom}`} onClick={() => props.onBasculerMasque(id)}>
            {masquee ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        )}
        {masquee && cause === 'oeil' ? (
          <button type="button" className="cal-cachees" aria-label={`Afficher ${nom}${cachees ? ` : ${texteCachees}` : ''}`} onClick={() => props.onBasculerMasque(id)}>
            {texteCachees || 'masquée'}
          </button>
        ) : masquee ? (
          <span className="cal-cachees-f">{texteCachees}</span>
        ) : vide ? (
          <span className="cal-vide">vide</span>
        ) : (
          <span className="cal-pastille" role="img" aria-label={p.lecture} data-pastille={id}>
            <span className="cal-pastille-p">
              <i className="cal-pastille-fond" style={{ width: `${parts}%` }} />
              <span className="cal-pastille-t">{p.texte}</span>
            </span>
            <span className="cal-conf">confirmé {p.debut}–{p.fin}</span>
          </span>
        )}
        {renvois.map(r => (
          <button key={r.chose.id} type="button" className="cal-renvoi" data-renvoi={r.chose.id} onClick={() => props.onRenvoi?.(r.chose)}>
            {r.texte}<ChevronRight size={14} aria-hidden="true" />
          </button>
        ))}
      </header>
      {hauteurLane > 0 && (
        <div className="cal-lane" style={{ height: hauteurLane }} data-lane={id}>
          {fantome && !fantome.petite && (
            <i className="cal-fantome cal-pointille" aria-hidden="true" data-fantome style={{ left: fantome.gauche, width: fantome.largeur, top: fantome.ligne * mesures.ligne + 2, height: mesures.barre }} />
          )}
          {items.map(d => {
            const c = d.chose;
            const top = d.ligne * mesures.ligne + 2;
            const surDrag = drag && drag.id === c.id;
            if (d.marque) {
              const commeBarre = !d.petite;
              return (
                <Marque
                  key={c.id} chose={c} centre={d.gauche + 14} haut={top} hauteur={mesures.barre + 2} largeurColonne={auJour ? 0 : largeurColonne}
                  epinglee={epingles.includes(c.id)} etoilee={etoiles.includes(c.id)} selectionnee={selectionId === c.id} menuOuvert={menuId === c.id}
                  libelle={d.avecLibelle ? { cote: d.cote === 'gauche' ? 'gauche' : 'droite', place: d.place } : undefined}
                  decalage={surDrag && drag.mode === 'glisse' ? drag.k * largeurColonne : 0}
                  bornes={commeBarre ? [-d.a, colonnes.length - 1 - d.a] : undefined}
                  onToucher={props.barre.onToucher} onSixSemaines={props.onSixSemaines}
                  {...(commeBarre ? { onAppuiLong: props.barre.onAppuiLong, onGlisse: props.barre.onGlisse, onLacheGlisse: props.barre.onLacheGlisse, onRefus: (ch: ChoseCalendrier, raison: string) => props.barre.onRefus(ch, raison) } : {})}
                />
              );
            }
            return (
              <Barre
                key={c.id} chose={c} gauche={d.gauche} largeur={d.largeur} haut={top} hauteur={mesures.barre} cote={d.cote} placeEtiquette={d.place} avecDuree={d.duree}
                largeurColonne={auJour ? 0 : largeurColonne} bornes={[-d.a, colonnes.length - 1 - d.a]}
                epinglee={epingles.includes(c.id)} etoilee={etoiles.includes(c.id)} selectionnee={selectionId === c.id} menuOuvert={menuId === c.id}
                decalage={surDrag && drag.mode === 'glisse' ? drag.k * largeurColonne : 0}
                allongement={surDrag && drag.mode === 'bord' ? (drag.jours * largeurColonne) / 7 : 0}
                etiquetteDuree={etiquetteDuree && etiquetteDuree.id === c.id ? etiquetteDuree.texte : undefined}
                {...props.barre}
              />
            );
          })}
          {items.map(d => {
            const j = d.chose.jalons?.find((x: JalonBrassin) => x.id === 'commander');
            if (!j || d.marque) return null;
            const col = colonnes.findIndex(cl => j.jour >= cl.debut && j.jour <= cl.fin);
            if (col < 0) return null;
            return (
              <span key={`cmd-${d.chose.id}`} data-jalon="commander" className="cal-commander" aria-label={`Commander avant le ${jourLisible(j.jour)} · ${d.chose.titre}`} role="img"
                style={{ left: col * largeurColonne + largeurColonne / 2 - 9, top: d.ligne * mesures.ligne + 2 + mesures.barre - 2 }}>
                <ShoppingCart size={12} aria-hidden="true" />
              </span>
            );
          })}
          {drag && ici && fantome && (
            <span className="cal-ici" data-ici style={{ left: Math.max(4, Math.min(largeur - 8, (fantome.a + drag.k + 0.5) * largeurColonne)), top: fantome.ligne * mesures.ligne + 2 + mesures.barre + 2 }}>{ici}</span>
          )}
        </div>
      )}
      {props.detail}
    </section>
  );
};

/** « Livraison La Cigogne · S1 › » : le renvoi d'une vente liée à un brassin visible, quand la vente est hors de la vue (E32). */
export function texteRenvoi(c: ChoseCalendrier): string {
  return `Livraison ${c.lie?.client ?? c.titre} · ${etiquetteS(c.debut)}`;
}
