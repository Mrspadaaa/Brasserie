import React from 'react';
import ReactDOM from 'react-dom';
import { Link2, Pin, Star } from 'lucide-react';
import { COUT_A_VENIR, ecartJours, etiquetteS, francsSignes, jourLisible, type ChoseCalendrier, type JalonBrassin } from '../../../domain/calendrier';
import { CLASSE_TEINTE, ContenuEtiquette, DureeTexte, PastilleLie, dureeVue, largeurTexte, nomAccessible, type ModeDeuxLignes } from './Marque';
import { usePointeur } from './usePointeur';
import { prisesDuBord, useToucherNom, zoneToucher } from './zoneToucher';
import { ETAPE_BRASSIN, couleurEtape, encreEtape, estEtape, type EtapeBrassin } from './etapes';
import { posee, poseeADroite } from './posee';

/**
 * Une barre de la frise (E24 à E32). Elle porte ses gestes : toucher (le détail), appui long (le menu), glisser (déplacer en direct, f1-a),
 * tirer le bord (allonger, f2-a). Un brassin y montre ses phases et ses jalons (E25) ; les jours actifs sont des points posés en % de la piste
 * (E24, E45) ; une chose proposée est en pointillé (E26, E47). L'étiquette (nom, montant) vit à côté, du côté libre, ou dans la barre.
 * Le calcul des écritures n'est pas ici : la barre dit ce que le doigt a fait, `CalendrierTab` écrit.
 *
 * CRITIQUE-3 n° 27 : le nom posé dans la barre a un fond, les ronds des jalons passent dessous, jamais dessus. N° 30 : « J7 / 35 · prête
 * 21 déc. » n'est jamais coupé (entier, ou sa forme courte « J7 / 35 »). N° 13 : la pastille « lié à … » se touche (aperçu sur place).
 */

/** Écart minimal entre deux icônes d'étape (14 px de disque, D384 « icône plus petit », + 2 px d'air), et largeur sous laquelle seule la fin (la poignée) reste. */
const ESPACE_ICONE = 16;
const BARRE_ETROITE = 40;
/** Qui garde sa place quand deux icônes se touchent : la fin (elle se tire), le dry hop, la garde, la fermentation, puis le brassage (le début de la barre le dit déjà). */
const PRIORITE_ETAPE: Record<EtapeBrassin, number> = { conditionnement: 0, 'dry-hop': 1, garde: 2, fermentation: 3, brassage: 4 };

/**
 * CAL-POINTS-MUETS (18.11, « sans masquer la barre ») : les icônes d'étape qui tiennent sur la barre, dans l'ordre des jours. Deux icônes à
 * moins de 18 px : la plus utile reste ; une barre de moins de 40 px (3 mois, An) ne garde que sa fin. Le détail (toucher) les liste toutes.
 */
export function iconesQuiTiennent(jalons: readonly JalonBrassin[], pourcent: (ecart: number) => number | null, largeur: number): JalonBrassin[] {
  const tous = jalons.filter(j => j.ecart >= 0 && estEtape(j.id) && pourcent(j.ecart) !== null);
  const px = (j: JalonBrassin) => ((pourcent(j.ecart) ?? 0) / 100) * largeur;
  const ordre = [...tous].sort((a, b) => PRIORITE_ETAPE[a.id as EtapeBrassin] - PRIORITE_ETAPE[b.id as EtapeBrassin]);
  const pris: JalonBrassin[] = [];
  for (const j of ordre) {
    if (largeur < BARRE_ETROITE && j.glissable !== 'fin') continue;
    if (pris.every(k => Math.abs(px(k) - px(j)) >= ESPACE_ICONE)) pris.push(j);
  }
  return tous.filter(j => pris.includes(j));
}

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
  /** CRITIQUE-12 n° 4 : à gauche, l'étiquette finit avant la zone du + volant, à `retrait` px de plus de sa barre (absent : collée). */
  retrait?: number;
  /** CAL-PASSE Q n° 8 : la part de la barre, en px à son bout droit, qui passe sous le + volant ; le texte posé dedans (nom, durée) s'arrête avant. */
  reserveDedans?: number;
  /**
   * CRITIQUE-12, doute Porter glissé : la barre est coupée au bord de la fenêtre. `du` : le premier jour montré (coupée à gauche) ; `au` : le
   * dernier (coupée à droite). Ses jalons et ses phases se placent sur les jours montrés ; un jalon hors de la fenêtre est rogné, jamais décalé.
   */
  coupe?: { du?: string; au?: string };
  /** Le nom passe sur deux lignes à côté de la barre (3 mois, quand la rangée le permet : n° 31). */
  deuxLignes?: ModeDeuxLignes;
  /** La pastille « lié à » n'a pas la place à côté du nom : elle n'est pas posée (le badge lien de la barre reste). */
  sansLie?: boolean;
  /** Tour 2 n° 3 : le titre seul dans la barre (« · coût à venir » n'y tient pas avec lui) ; le nom ne sort jamais de sa barre pour lui. */
  titreSeul?: boolean;
  /** La durée à côté du nom d'un brassin, entière (« J0 / 28 · prête 21 déc. ») ou courte (« J0 / 28 »), posée par `disposer` ; absente : dans la barre. */
  dureeACote?: string | null;
  largeurColonne: number;
  /** D385 : la largeur d'un jour pour tirer le bord (une colonne d'un jour, ou 1/7 de semaine) ; absente : 1/7 de colonne. */
  largeurJour?: number;
  /** CAL-JOUR (21.11) : le corps se glisse au jour (`glisseAuJour`) ; `onGlisse` reçoit des semaines par septièmes. */
  parJour?: boolean;
  /** Pas permis pour le glisser : `[min, max]` en semaines. */
  bornes: [number, number];
  /** CAL-PASSE N1 n° 1 : les colonnes hors fenêtre où la barre peut se poser (`[avant, après]`) ; absent : aucune. */
  marge?: [number, number];
  /** CAL-PASSE N1 n° 1 : décale la fenêtre d'une colonne vers le passé (-1) ou le futur (1) quand le doigt tient le bord ; `false` : elle ne peut plus. */
  defile?: (sens: -1 | 1, mode: 'glisse' | 'bord') => false | number;
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
  /* CRITIQUE-12, doute Papiers en An : une série mensuelle posée en une barre dit son montant par mois (as/cap/p-c1d : « −400 / mois ») */
  return `${francsSignes(chose.centimes)}${chose.partiel ? ' + à venir' : ''}${chose.parMois ? ' / mois' : ''}`;
};
const montantDe = montantBarre;

/**
 * CRITIQUE-5 n° 23 (E25, E29) : une seule forme de durée dans une vue, « J0 / 28 » avec ses espaces. Les formes, de la plus longue à la plus
 * courte : « J0 / 42 · prête 4 janv. », puis « J0 / 42 » : faute de place, c'est « · prête … » qui cède, jamais les espaces. Une durée sans « J »
 * (« pas brassée · prête le 24 nov. ») garde son premier morceau (« pas brassée »).
 */
export function formesDuree(d: string): string[] {
  const morceaux = d.split(' · ');
  if (morceaux.length < 2) return [d];
  /* CAL-BARRE-HAUTE (une ligne de texte par barre de brassin) et CRITIQUE-9 n° 3 (E25, E29 : « prête … » jamais perdue) : entre la phrase
     entière et sa tête (« J0 / 28 », « pas brassée »), la date prête garde sa place : « pas brassée · prête 24 nov. », puis « prête 21 déc. » */
  const fin = morceaux.slice(1).join(' · ');
  const prete = fin.startsWith('prête le ') ? `prête ${fin.slice('prête le '.length)}` : fin;
  /* PC-151 (20.11) : « pas brassée » est la marque du retard ; la date « prête … » seule ne la remplace jamais (à 390, la barre disait « prête 18 déc. »
     sans dire que le brassage prévu était passé) : la dernière forme est « pas brassée », la date reste dans la phrase entière et le détail */
  const formes = morceaux[0] === 'pas brassée' ? [d, `${morceaux[0]} · ${prete}`, morceaux[0]] : [d, `${morceaux[0]} · ${prete}`, prete, morceaux[0]];
  return formes.filter((f, i) => formes.indexOf(f) === i);
}

/**
 * La forme de durée que la barre porte dedans, la première qui tient (entière, puis courte) ; `nomDedans` : le nom et son montant sont sur la
 * même ligne, à gauche. `null` : aucune. Une seule mesure pour `disposer` (Rangee) et la barre, sans quoi l'une promet ce que l'autre coupe.
 */
export function dureeDansBarre(chose: ChoseCalendrier, w: number, nomDedans: boolean, nom: string = chose.etiquette ?? chose.titre): string | null {
  const duree = dureeVue(chose);
  if (!duree) return null;
  const montant = montantBarre(chose);
  const nomEntier = nomDedans ? largeurTexte(nom, 600) + (montant ? largeurTexte(montant, 700) + 6 : 0) + 12 : 0;
  return formesDuree(duree).find(t => w - 16 - nomEntier >= largeurDuree(t)) ?? null;
}
/** La largeur d'une durée posée dans la barre ou sous elle (son jeu compris). */
export const largeurDuree = (t: string): number => Math.ceil(largeurTexte(t, 600)) + 8;

/** CRITIQUE-9 doute f2-a : la zone de prise du bord d'une barre, de part et d'autre du bord, pour un doigt (une rangée de 18 px en paysage). */
/** Frise B, R3 : 22 px de chaque côté du trait (dedans borné au tiers par `surLeBord`). */
export const ZONE_BORD_PX = 22;

/**
 * Les segments de phases d'un brassin : brassage, fermentation, garde, conditionnement, lus dans les jalons de la recette figée (E25).
 * CRITIQUE-12, doute Porter glissé : la barre montre les jours `[o, f]` de la chose (coupée au bord de la fenêtre) ; une phase est rognée au
 * bord, jamais tassée dans la part visible.
 */
function phases(jalons: readonly JalonBrassin[] | undefined, total: number, o = 0, f = total) {
  if (!jalons?.length || total <= 0 || f <= o) return [];
  const sur = jalons.filter(j => j.ecart >= 0 && j.id !== 'commander').sort((a, b) => a.ecart - b.ecart);
  const vu = f - o;
  return sur.flatMap((j, i) => {
    /* D384 : le brassage est un jour. Un brassin pas brassé n'a que lui (ses autres phases ne sont pas datées) : son pied n'est coloré que ce
       jour-là, jamais trois semaines de « brassage » ; le reste du pied reste nu (l'inconnu ne prend aucune couleur) */
    const suivant = i + 1 < sur.length ? sur[i + 1].ecart : total;
    const debut = Math.max(o, j.ecart), fin = Math.min(f, j.id === 'brassage' ? Math.min(suivant, j.ecart + 1) : suivant);
    if (fin < debut) return [];
    return [{ id: j.id, de: Math.min(100, ((debut - o) / vu) * 100), largeur: Math.max(0, ((fin - debut) / vu) * 100) }];
  });
}

/**
 * Une position de la piste des phases (en % de la largeur intérieure de la barre) dans le repère de la piste, qui couvre aussi les bords
 * (`--cal-bg` à gauche, `--cal-bd` à droite) : 0 et 100 vont jusqu'au bord extérieur, le reste suit les icônes.
 */
export function posPiste(p: number): string {
  if (p <= 0) return '0px';
  /* D406 : en cqw (la piste est un conteneur), pour se poser par `translate` (frise.css, `.cal-ph`) */
  if (p >= 100) return '100cqw';
  return `(var(--cal-bg) + (100cqw - var(--cal-bg) - var(--cal-bd)) * ${Number((p / 100).toFixed(4))})`;
}

/**
 * CAL-PASSE e (20.11, capture 2) : la durée tirée (« J0 / 55 · prête 13 févr. ») se pose où elle ne couvre ni la barre ni le nom et reste dans l'écran.
 * Ordre : à droite de la barre (le geste de toujours), à sa gauche, dans la barre contre son bord droit (le nom, à gauche, reste lisible), enfin
 * juste au-dessus d'elle. Mesuré au rendu (avant la peinture) : une barre qui court jusqu'au bord droit n'a pas de place à droite.
 */
const PLACES_DUREE: ReadonlyArray<Record<'left' | 'right' | 'top', string>> = [
  { left: '', right: '', top: '' },
  { left: 'auto', right: 'calc(100% + 6px)', top: '' },
  { left: 'auto', right: '8px', top: '' },
  { left: '0px', right: 'auto', top: '-20px' }
];
/**
 * CAL-PASSE Q n° 8 (21.11) : le + volant est fixe, hors de la frise ; ce qui se pose au rendu (durée tirée, bulle « lâcher ici ») le prend pour un
 * mur. `null` : pas de + à l'écran (ou jsdom, sans mise en page).
 */
export function rectVolant(): DOMRect | null {
  if (typeof document === 'undefined') return null;
  const fab = [...document.querySelectorAll<HTMLElement>('button[aria-label]')].find(b => /^Actions rapides/.test(b.getAttribute('aria-label') ?? ''));
  const r = fab?.getBoundingClientRect();
  return r && r.width > 0 && r.height > 0 ? r : null;
}

/**
 * CHV-15 (21.11, « Brassage · 2 nov. » posée sur « Ttt » et son nom caché) : la bulle d'une étape se pose sous la barre, sinon au-dessus, sinon sur la
 * barre elle-même (en haut, là où s'écrit son propre nom) ; jamais sur une autre barre, une marque ou le texte d'une autre étiquette. Mesuré au rendu,
 * comme `placerDuree` : chaque essai se lit tout de suite (sans transition). Rend la place choisie (0 dessous, 1 dessus, 2 sur sa barre).
 */
export function placerBulle(b: HTMLElement, barre: HTMLElement): number {
  const racine = barre.closest('[data-frise]');
  if (!racine || typeof document === 'undefined') return 0;
  const lbl = barre.nextElementSibling;
  const voisins: DOMRect[] = [...racine.querySelectorAll<HTMLElement>('.cal-barre, .cal-marque')].filter(e => e !== barre && !barre.contains(e)).map(e => e.getBoundingClientRect());
  for (const e of racine.querySelectorAll<HTMLElement>('.cal-lbl')) {
    if (e === lbl || getComputedStyle(e).visibility === 'hidden') continue;
    const rg = document.createRange(); rg.selectNodeContents(e);
    if (typeof rg.getBoundingClientRect === 'function') voisins.push(rg.getBoundingClientRect());
  }
  const libres = voisins.filter(v => v.width > 0 && v.height > 0);
  const places: Array<Record<'top' | 'bottom', string>> = [
    { top: '', bottom: '' },
    { top: 'auto', bottom: 'calc(100% + 10px)' },
    { top: '0px', bottom: 'auto' }
  ];
  b.style.transition = 'none';
  const frise = racine.getBoundingClientRect();
  let choisie = 2;
  for (let i = 0; i < places.length - 1; i++) {
    b.style.top = places[i].top; b.style.bottom = places[i].bottom;
    const q = b.getBoundingClientRect();
    const dansFrise = q.top >= frise.top - 0.5 && q.bottom <= frise.bottom + 0.5;
    const surVoisin = libres.some(v => Math.min(q.right, v.right) - Math.max(q.left, v.left) > 1 && Math.min(q.bottom, v.bottom) - Math.max(q.top, v.top) > 1);
    if (dansFrise && !surVoisin) { choisie = i; break; }
  }
  b.style.top = places[choisie].top; b.style.bottom = places[choisie].bottom;
  b.setAttribute('data-place', ['dessous', 'dessus', 'sur-sa-barre'][choisie]);
  return choisie;
}

export function placerDuree(d: HTMLElement, barre: HTMLElement, nomCede = false): number {
  /* `nomCede` : le nom posé hors de la barre laisse sa place à la durée (il est caché le temps du geste) ; mesuré comme s'il l'était déjà, la place
     trouvée ne change pas quand la durée, sans place, le laisse revenir (CAL-PASSE voie S2, R2-2) */
  const lbl = barre.nextElementSibling, nom = lbl?.querySelector('.cal-lbl-t'), nomVu = !nomCede && !!nom && !!lbl && getComputedStyle(lbl).visibility !== 'hidden';
  const frise = d.closest('[data-frise]')?.getBoundingClientRect();
  const g = Math.max(0, frise?.left ?? 0), dr = Math.min(window.innerWidth, frise?.right ?? window.innerWidth);
  const br = barre.getBoundingClientRect();
  const racine = d.closest('[data-frise]');
  const voisins = racine ? [...racine.querySelectorAll<HTMLElement>('.cal-barre, .cal-marque, .cal-lbl-t')]
    .filter(e => !barre.contains(e) && !lbl?.contains(e) && e !== barre && !d.contains(e)).map(e => e.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0) : [];
  /* CAL-PASSE voie S, R2-2 (21.11, 390 : « pas brassée · prête le 20 nov. » cachait « Jhhh −45 J34 / 34 » de la ligne du dessus) : le nom seul ne dit pas
     tout le texte d'une étiquette ; son montant et sa durée comptent aussi. Chaque étiquette voisine se mesure à l'étendue de son TEXTE (un Range), pas à sa boîte. */
  if (racine) {
    for (const e of racine.querySelectorAll<HTMLElement>('.cal-lbl')) {
      if (e === lbl || e.contains(d) || getComputedStyle(e).visibility === 'hidden') continue;
      const rg = document.createRange(); rg.selectNodeContents(e);
      if (typeof rg.getBoundingClientRect !== 'function') continue; /* jsdom : pas de mise en page */
      const r = rg.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) voisins.push(r);
    }
  }
  d.style.display = '';
  /* CAL-PASSE Q n° 8 : jamais sous le + volant (Annuler et les montants se lisent) */
  const plus = rectVolant();
  if (plus) voisins.push(plus);
  /* la transition globale (« all 0,01 ms ») ferait lire la mise en page de l'essai d'avant : sans elle, chaque essai se mesure tout de suite */
  d.style.transition = 'none';
  /* aucune place libre : l'étiquette ne se pose pas sur le texte d'une autre ligne ; la durée se lit dans le bandeau du bas (« Hefe : pas brassée · prête le … ») */
  let choisie = -1;
  for (let i = 0; i < PLACES_DUREE.length; i++) {
    const p = PLACES_DUREE[i];
    d.style.left = p.left; d.style.right = p.right; d.style.top = p.top;
    const q = d.getBoundingClientRect();
    const dansEcran = q.left >= g - 0.5 && q.right <= dr + 0.5;
    const surBarre = i !== 2 && Math.min(q.right, br.right) - Math.max(q.left, br.left) > 1 && Math.min(q.bottom, br.bottom) - Math.max(q.top, br.top) > 1;
    const n = nomVu ? nom!.getBoundingClientRect() : null;
    const surNom = !!n && Math.min(q.right, n.right) - Math.max(q.left, n.left) > 1 && Math.min(q.bottom, n.bottom) - Math.max(q.top, n.top) > 1;
    /* CAL-PASSE N1 n° 4 (20.11, « pas brassée · prête le 20 nov. » posée sur la barre Ttt de la même ligne) : ni sur une barre voisine, ni sur un nom voisin */
    const surVoisin = voisins.some(v => Math.min(q.right, v.right) - Math.max(q.left, v.left) > 1 && Math.min(q.bottom, v.bottom) - Math.max(q.top, v.top) > 1);
    if (dansEcran && !surBarre && !surNom && !surVoisin) { choisie = i; break; }
  }
  if (choisie < 0) {
    d.style.display = 'none';
    d.setAttribute('data-place', 'bandeau');
    return -1;
  }
  const p = PLACES_DUREE[choisie];
  d.style.left = p.left; d.style.right = p.right; d.style.top = p.top;
  d.setAttribute('data-place', ['droite', 'gauche', 'dedans', 'dessus'][choisie]);
  return choisie;
}

export const Barre: React.FC<BarreProps> = props => {
  const { chose, gauche, largeur, haut, hauteur, cote, placeEtiquette, largeurColonne, bornes, epinglee, etoilee, selectionnee, menuOuvert, decalage = 0, allongement = 0, etiquetteDuree } = props;
  const el = React.useRef<HTMLDivElement | null>(null);
  const dureeEl = React.useRef<HTMLElement | null>(null);
  const proposee = !!(chose.proposition || chose.probable);
  const brassin = chose.source.genre === 'batch';
  const nbJours = Math.max(1, ecartJours(chose.debut, chose.fin) + 1);
  const total = chose.jalons?.length ? Math.max(...chose.jalons.map(j => j.ecart), nbJours - 1) : 0;
  const peutBord = chose.deplacable === true && (chose.source.genre === 'batch' || chose.source.genre === 'creative' || (chose.source.genre === 'plan' && chose.source.origine === 'manual')) && !proposee;
  /* le point d'étape touché (CAL-POINTS-MUETS) : sa bulle reste jusqu'au toucher suivant ailleurs */
  const [pointVu, setPointVu] = React.useState<string | null>(null);
  const bullePoint = React.useRef<HTMLSpanElement | null>(null);
  React.useEffect(() => {
    if (!pointVu) return;
    const ailleurs = (e: PointerEvent) => { if (!(e.target instanceof Element && el.current?.contains(e.target) && e.target.closest('[data-jalon]'))) setPointVu(null); };
    document.addEventListener('pointerdown', ailleurs, true);
    return () => document.removeEventListener('pointerdown', ailleurs, true);
  }, [pointVu]);
  React.useLayoutEffect(() => {
    const b = bullePoint.current;
    if (!b || typeof window === 'undefined') return;
    b.style.marginLeft = '';
    if (el.current) placerBulle(b, el.current);
    const r = b.getBoundingClientRect();
    if (!r.width) return;
    const deborde = r.right - (window.innerWidth - 8);
    if (deborde > 0) b.style.marginLeft = `-${Math.ceil(deborde)}px`;
    else if (r.left < 8) b.style.marginLeft = `${Math.ceil(8 - r.left)}px`;
  }, [pointVu]);

  const gestes = usePointeur({
    largeurColonne,
    ...(props.largeurJour ? { largeurJour: props.largeurJour } : {}),
    ...(props.parJour ? { parJour: true } : {}),
    borne: () => bornes,
    ...(props.marge ? { marge: props.marge } : {}),
    ...(props.defile ? { defile: props.defile } : {}),
    /* doute f2-a (E29, D-47) : un doigt posé à 22 px du bord (R3), dedans ou dehors, tire le bord, même sur une rangée de 18 px */
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
    /* CAL-POINTS-MUETS (« Les petits points là donne pas d'info ») : un point d'étape touché dit son étape et sa date ; le reste de la barre
       ouvre le détail */
    onToucher: cible => {
      const id = brassin ? cible?.closest?.('[data-jalon]')?.getAttribute('data-jalon') : null;
      if (id && chose.jalons?.some(j => j.id === id)) { setPointVu(v => (v === id ? null : id)); return; }
      setPointVu(null);
      if (el.current) props.onToucher(chose, el.current);
    },
    onAppuiLong: () => el.current && props.onAppuiLong(chose, el.current),
    onGlisse: k => props.onGlisse(chose, k),
    onLacheGlisse: (k, annule) => props.onLacheGlisse(chose, k, annule),
    /* le bord (et le jalon de fin) se tire au jour : une semaine = 7 jours, le pas du bord est 1/7 de colonne */
    onBord: k => props.onBord(chose, k),
    onLacheBord: (k, annule) => props.onLacheBord(chose, k, annule)
  });

  /* T2-2 : le nom posé à côté de la barre s'ouvre au toucher comme elle (ni glisser, ni menu) */
  const toucheNom = useToucherNom(() => { setPointVu(null); if (el.current) props.onToucher(chose, el.current); });

  /* les jours montrés, depuis le début de la chose : `[o, f]` (toute la chose quand elle n'est pas coupée : rien ne change) */
  const o = props.coupe?.du ? Math.min(total, Math.max(0, ecartJours(chose.debut, props.coupe.du))) : 0;
  const f = props.coupe?.au ? Math.max(o, Math.min(total, ecartJours(chose.debut, props.coupe.au))) : total;
  const segments = phases(chose.jalons, total, o, f);
  const jalonVu = (ecart: number): number | null => (ecart < o || ecart > f ? null : f > o ? Math.min(100, ((ecart - o) / (f - o)) * 100) : 0);
  const montant = montantDe(chose);
  const w = Math.max(10, largeur + allongement);
  /* CAL-PASSE Q n° 8 : la largeur où le texte de la barre peut s'écrire (la part sous le + volant en est retirée) */
  const rd = Math.max(0, props.reserveDedans ?? 0);
  const wTexte = Math.max(10, w - rd);
  const dureeInStyle: React.CSSProperties | undefined = rd > 0 ? { right: 8 + rd, maxWidth: `calc(100% - ${16 + rd}px)` } : undefined;
  const etapesVues = brassin ? iconesQuiTiennent(chose.jalons ?? [], jalonVu, w) : [];
  const duree = dureeVue(chose);
  const nom = props.titreSeul ? chose.titre : chose.etiquette ?? chose.titre;
  /* CRITIQUE-9 n° 3 : la phrase entière en bas de la barre haute (as/cap/p-repos), ou sur la ligne sous elle ; le nom reste seul en haut */
  const bas = props.phraseBas ?? null;
  const formeEntiere = duree ? formesDuree(duree)[0] : null;
  /* dans la barre : la durée à droite du nom entier, jamais coupée (n° 30) : « J0 / 42 · prête 4 janv. », sinon « J0 / 42 » (n° 23) ; sinon
     rien : le nom ne cède jamais pour elle (CRITIQUE-5 n° 14), elle reste au toucher et au lecteur d'écran */
  const dureeDedans = ((): { texte: string; largeur: number } | null => {
    if (!duree || props.dureeACote || props.deuxLignes === 'duree' || bas?.ou === 'dessous') return null;
    if (bas?.ou === 'barre' && formeEntiere) return { texte: formeEntiere, largeur: largeurDuree(formeEntiere) };
    const t = dureeDansBarre(chose, wTexte, cote === 'dedans', nom);
    return t ? { texte: t, largeur: largeurDuree(t) } : null;
  })();
  /* f2-a (E29, CRITIQUE-5 n° 1) : pendant le geste, « J0 / 35 · prête 21 déc. » ou « pas brassée · prête le 24 nov. » se lit en entier : dans la
     barre s'il y tient, sinon juste à sa droite */
  /* CAL-PASSE e (20.11, capture 2 : « J0 / 55 · prête 13 févr. » posée sur la barre et son nom) : pendant le geste, la durée tirée se pose TOUJOURS à
     côté de la barre (jamais dedans, même quand elle y tient) : elle ne recouvre ni la barre glissée ni son nom, qui reste visible. */
  const dureeHors = !!etiquetteDuree;
  /* CRITIQUE-7 n° 2 (E29) : la durée écrite à côté du nom suit le doigt, elle aussi : jamais l'ancienne « prête le … » à côté de la nouvelle */
  const dureeRepos = props.deuxLignes === 'duree' ? duree : props.dureeACote;
  const dureeEtiquette = dureeRepos && etiquetteDuree ? etiquetteDuree : dureeRepos;
  /* la phrase posée sous la barre suit le doigt de même ; pendant le geste, elle seule dit la nouvelle date (aucune bulle en double) */
  const phraseDessous = bas?.ou === 'dessous' ? (etiquetteDuree ?? formeEntiere) : null;
  const n = chose.joursActifs && chose.joursActifs > 0 ? chose.joursActifs : 0;
  /* PC-143, PC-NOTE-2 (paquet F) : sur un axe en jours, des points répartis sur la semaine passent pour des jours choisis (la feuille ne choisit
     que des semaines) : ils sont groupés au début de la barre, « 3 j » sans date inventée ; en semaines et en mois, répartis comme avant */
  const pointsGroupes = n > 0 && !!props.largeurJour && props.largeurJour >= props.largeurColonne - 0.5;
  /* CAL-PASSE voie S, R2-1 : les zones de prise du bord se réduisent avec la barre (jamais plus du tiers : le milieu d'une barre courte la déplace) */
  const prises = prisesDuBord(w);
  /* D406 : la barre et ce qui l'accompagne se posent par `transform` (posee.ts) ; le glissé s'ajoute à la translation */
  const style: React.CSSProperties = {
    ...posee(gauche + decalage, haut), width: w, height: hauteur,
    ['--bord-in' as string]: `${prises.dedans}px`, ['--fin-in' as string]: `${prises.jalonSup}px`,
  };
  /* deux lignes (n° 31) : 2 × 14 px, la boîte prend la hauteur de la ligne, jamais une lettre rognée ; la barre haute garde son nom sur sa
     première ligne (la hauteur d'une barre simple) */
  const hautNom = bas?.ou === 'barre' ? Math.max(18, hauteur - Math.round(hauteur / 2) - 2) : hauteur;
  /* PC-158 : 34 px au moins, centrée sur la barre (14 + 3 d'air + 16 de pastille « lié à ») */
  const lblHaut = props.deuxLignes ? { top: haut - (Math.max(hauteur + 6, 34) - hauteur) / 2, height: Math.max(hauteur + 6, 34) } : { top: haut, height: hautNom };
  const dureeMemeLigne = dureeDedans && bas?.ou !== 'barre' ? dureeDedans.largeur + 4 : 0;
  const lblMax = cote === 'dedans' ? Math.max(0, wTexte - 12 - dureeMemeLigne) : Math.max(16, placeEtiquette);
  const lblPlace: React.CSSProperties = {
    height: lblHaut.height,
    ...(cote === 'gauche'
      ? poseeADroite(gauche + decalage - (props.retrait ?? 0) - 6, lblHaut.top, lblMax)
      : { ...posee(cote === 'droite' ? gauche + w + decalage + 6 : gauche + decalage + 6, lblHaut.top), maxWidth: lblMax })
  };
  /* pendant f2-a, la durée tirée remplace le nom d'une barre simple ; la barre haute et la phrase du dessous gardent le nom (elles ont leur ligne) */
  /* CAL-PASSE voie S2, R2-2 : sans place libre, la durée se lit dans la bande basse (`sansPlace`) et le nom reste où il est, lisible */
  const [sansPlace, setSansPlace] = React.useState(false);
  const cede = !!etiquetteDuree && !bas && !sansPlace && (dureeHors ? cote !== 'dedans' : cote === 'dedans');
  /* CRITIQUE-9 n° 10 (D-113, D-126) : la pastille « lié à » n'a pas la place à côté du nom : l'icône lien du badge de la barre se touche et
     ouvre l'aperçu. Le bouton, nommé « Hotte, liée à Blonde d'automne : aperçu », est posé sur l'icône, hors de la barre (jamais un bouton dans
     un bouton) ; l'icône reste dessinée par le badge (une seule à l'image) */
  const lienIcone = props.sansLie && chose.lie ? chose.lie : null;
  const zoneBarre = zoneToucher(w, hauteur);
  const nomTouchable = cote !== 'dedans' && !cede;
  React.useLayoutEffect(() => {
    const d = dureeEl.current, b = el.current;
    const sans = !!(d && b && etiquetteDuree && dureeHors && !bas) && placerDuree(d!, b!, cote !== 'dedans') < 0;
    if (sans !== sansPlace) setSansPlace(sans);
  });

  return (
    <>
      <div
        ref={el}
        role="button"
        tabIndex={0}
        data-chose={chose.id}
        data-chose-id={chose.id}
        data-barre
        {...(prises.jalonMuet ? { 'data-fin-muet': '' } : {})}
        data-rangee={chose.rangee}
        data-titre={chose.titre}
        {...(chose.debut ? { 'data-semaine': etiquetteS(chose.debut) } : {})}
        {...(chose.proposition ? { 'data-proposition': chose.proposition } : {})}
        {...(proposee ? { 'data-probable': '' } : {})}
        /* K3-SUITES : « coût à venir » n'entre pas dans la barre (Tour 2 n° 3, le titre seul) ; le nom accessible le dit, comme la rangée et le détail */
        aria-label={`${nomAccessible(chose)}${montant ? `, ${montant}` : chose.coutAVenir ? `, ${COUT_A_VENIR}` : ''}${duree ? `, ${duree}` : ''}${chose.lie ? `, ${chose.lie.texte}` : ''}${chose.courses ? `, courses : ${chose.courses}` : ''}`}
        aria-haspopup="menu"
        aria-expanded={menuOuvert || undefined}
        className={`cal-barre ${CLASSE_TEINTE[chose.rangee]}${bas?.ou === 'barre' ? ' cal-barre-2l' : ''}${proposee ? ' cal-pointille' : ''}${chose.pasBrassee ? ' cal-prevu' : ''}${epinglee ? ' cal-epi' : ''}${selectionnee ? ' cal-sel' : ''}${decalage || allongement ? ' cal-glisse' : ''}${chose.deplacable === true ? '' : ' cal-fixe'}${chose.finInconnue ? ' cal-coupee' : ''}`}
        style={style}
        {...gestes}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (el.current) props.onToucher(chose, el.current); } }}
      >
        {/* T2-2 : zone de toucher d'au moins 44 × 24 px, invisible, sous les points et le reste de la barre (ses gestes remontent à la barre) */}
        {zoneBarre && <i className="cal-zone-tactile" data-zone-tactile aria-hidden="true" style={zoneBarre} />}
        {brassin && segments.length > 0 && (
          /* D384 (jeu C, `.phases`) : le pied de la barre, coloré par phase, d'un bord à l'autre, sans jour ni espace entre deux phases. La
             piste couvre les bords de la barre ; une phase se place sur la largeur intérieure (celle des icônes), la première et la dernière
             s'étendent sous le bord (`--cal-bg`, `--cal-bd`, frise.css). */
          <span className="cal-piste" aria-hidden="true">
            {segments.map(s => {
              const a = posPiste(s.de), b = posPiste(s.de + s.largeur);
              return <i key={s.id} className="cal-ph" data-phase={s.id} style={{ ['--a' as string]: a, ['--b' as string]: b, ...(estEtape(s.id) ? { ['--p' as string]: couleurEtape(s.id) } : {}) }} />;
            })}
          </span>
        )}
        {etapesVues.map(j => {
          /* CAL-POINTS-MUETS (18.11, « plutot utiliser des mini icone. et une couleur pour le type de procédé ») : chaque point est le picto de
             son étape, dans la couleur de son procédé ; sa date au toucher */
          const etape = ETAPE_BRASSIN[j.id as EtapeBrassin];
          return (
            <i
              key={j.id}
              data-jalon={j.id}
              {...(j.glissable === 'fin' ? { 'data-bord': '' } : {})}
              data-glissable={String(j.glissable)}
              title={`${j.libelle} · ${jourLisible(j.jour)}${j.glissable === false && j.raison ? ` · ${j.raison}` : ''}`}
              data-point-texte={`${j.libelle} · ${jourLisible(j.jour)}`}
              className={`cal-jalon${pointVu === j.id ? ' cal-jalon-vu' : ''}`}
              /* CRITIQUE-5 n° 29 : l'icône reste dans sa barre (borné par frise.css), jamais une demi-icône hors de la grille */
              /* D406 : `--x` en cqw (la barre est un conteneur) : l'icône se pose par `translate` (frise.css) */
              style={{ ['--x' as string]: `${total > 0 ? jalonVu(j.ecart) : 0}cqw`, ['--e' as string]: couleurEtape(j.id as EtapeBrassin), ['--ei' as string]: encreEtape(j.id as EtapeBrassin) }}
            >
              <etape.Icone aria-hidden="true" strokeWidth={2.5} />
            </i>
          );
        })}
        {brassin && pointVu && (() => {
          const j = chose.jalons?.find(x => x.id === pointVu);
          const x = j ? jalonVu(j.ecart) : null;
          if (!j || x === null || !estEtape(j.id)) return null;
          const etape = ETAPE_BRASSIN[j.id];
          /* sous la barre, jamais dessus : « Fermentation · 23 nov. », avec le picto de l'étape */
          return (
            <span ref={bullePoint} role="status" className="cal-point-bulle" data-point-bulle={j.id}
              style={{ ['--x' as string]: `${total > 0 ? x : 0}%`, ['--e' as string]: couleurEtape(j.id) }}>
              <etape.Icone aria-hidden="true" size={14} strokeWidth={2.5} />{j.libelle} · {jourLisible(j.jour)}
            </span>
          );
        })()}
        {n > 0 && (
          /* CRITIQUE-10 n° 2 (E24, D-9) : un conteneur à part du libellé ; dans la barre haute, il prend la ligne sous le nom */
          <span className={`cal-pts${bas?.ou === 'barre' ? ' cal-pts-bas' : ''}`} data-points={n} {...(pointsGroupes ? { 'data-points-groupes': '' } : {})} aria-hidden="true">
            {Array.from({ length: n }, (_, i) => <i key={i} data-point style={{ left: pointsGroupes ? `${4 + i * 10}px` : `${((i + 0.5) / n) * 100}%` }} />)}
          </span>
        )}
        {etiquetteDuree && bas?.ou !== 'dessous' && <em ref={dureeEl} className={`cal-duree${dureeHors && !bas ? ' cal-duree-hors' : ''}${bas ? ' cal-duree-in' : ''}`} data-duree {...(bas && dureeInStyle ? { style: dureeInStyle } : {})}><DureeTexte texte={etiquetteDuree} /></em>}
        {/* au repos, « J7 / 28 · prête 14 déc. » vit dans la barre du brassin (as/p-repos), quand il n'est pas déjà à côté du nom */}
        {sansPlace && etiquetteDuree && typeof document !== 'undefined' && ReactDOM.createPortal(
          <div className="cal-duree-bas" data-duree-bas role="status"><b>{chose.titre}</b> <DureeTexte texte={etiquetteDuree} /></div>, document.body)}
        {!etiquetteDuree && dureeDedans && <em className="cal-duree cal-duree-in" data-duree {...(dureeInStyle ? { style: dureeInStyle } : {})}><DureeTexte texte={dureeDedans.texte} /></em>}
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
      <span className={`cal-lbl cal-lbl-${cote}${props.deuxLignes ? ' cal-lbl-2n' : ''}${cede ? ' cal-lbl-cede' : ''} ${CLASSE_TEINTE[chose.rangee]}`} style={lblPlace}
        {...(nomTouchable ? { 'data-nom-touchable': '', ...toucheNom } : {})}
        /* Frise B, R3 : le bord se prend 22 px dehors ; le nom posé à 6 px à droite d'une barre à poignée laisse ses 16 premiers px au bord */
        {...(nomTouchable && peutBord && cote === 'droite' ? { 'data-pres-bord': '' } : {})}>
        <ContenuEtiquette chose={chose} nom={nom} montant={montant} duree={dureeEtiquette} deux={props.deuxLignes} lieCourt={props.lieCourt} sansLie={props.sansLie} />
      </span>
      {bas?.ou === 'dessous' && phraseDessous && (
        <span
          className={`cal-lbl cal-lbl-sous ${CLASSE_TEINTE[chose.rangee]}`} data-phrase-sous={chose.id} aria-hidden="true"
          style={{ ...posee(bas.x + decalage, haut + bas.dy), height: hauteur }}
        ><small className="cal-lbl-j"><DureeTexte texte={phraseDessous} /></small></span>
      )}
      {lienIcone && (
        <span className={`cal-lie-coin ${CLASSE_TEINTE[chose.rangee]}`} style={posee(gauche + w + decalage - 16, haut - 10)}>
          <PastilleLie lie={lienIcone} icone={nom} />
        </span>
      )}
    </>
  );
};
