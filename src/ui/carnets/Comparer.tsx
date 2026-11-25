/**
 * Comparer sur le critère, écartés visibles (R06, figé p2:g01-8 et ses compagnons v03-4, g05-8, h04-7, h06-7 ; R26, G20).
 * Le tableau est reçu en props : il est calculé par `comparer.ts` (lot A, `tableau(carnet)`) et passé par `CarnetsVue.tsx`.
 * À 0 ou 1 article, il vaut `null` : l'écran le dit (« le tableau naît au 2e article »), sans geste à faire.
 * Les articles sont en colonnes, les caractéristiques en lignes ; la meilleure valeur de chaque ligne est surlignée ;
 * « moins bien partout » marque un article dominé ; les écartés restent à la fin, grisés, avec leur raison (D-52).
 * Une valeur inconnue est une cellule vide (« – » discret), jamais 0. Choisir s'atteint d'ici seulement (MISSION « Rangé derrière »).
 * Correction 3 : à 390, une ombre de bord et « → n de plus » disent la suite à droite ; les écartés se lisent sous le tableau, nom et
 * raison (« Écartés · n », p2:h04-7), jamais une case vide ; un lien dont la page n'est pas lue s'écrit « Lien sans aperçu » (R04).
 * Lot 4 : la photo lue de chaque article en tête de sa colonne (L-23) ; titre, nombre d'articles et « Classé par » sur une ligne, aucune
 * case vide réservée, colonnes partagées en entier pour que les noms tiennent (L-26) ; un seul article lu (carnet Choisi) a sa colonne (L-27).
 */
import React from 'react';
import { ChevronLeft, ExternalLink, Pin, Scale } from 'lucide-react';
import { estEtranger, MENTION_FRAIS, renduArticle, tauxVersChf } from '../../domain/carnets/prixRendu';
import { sourceDuCritere } from '../../domain/carnets/modele';
import { trierParDecision } from '../../../functions/src/lienFusion';
import { compromisDe, ecartPrixDit, perteDite, groupeDeLigne, LIGNE_CRITERE, LIGNE_LIVRAISON, libelleCaracteristique, libelleEcarte, nombreDe, rangVisible, type Tableau } from '../../domain/carnets/comparer';
import { mentionTaxe, montant, Provenance, rangTexte, STATUT_LIBELLE, texteSelonNom, valeurTexte, type ArticleV, type CritereV, type Sens, type StatutCarnet, type ValeurV } from './EtatIA';
import { Photo } from './pictos';
import { BoutonRelire } from './BoutonRelire';
import { BoutonEscalader } from './BoutonEscalader';
import { Insec, liesParNbsp } from './insecable';
import { BlocPrixParMesure, usePour } from './TableauCarnet';
import {
  aDesPaliers, compromisMatiere, departager, ditDiffèrent, ditIdentiques, estCarnetDeMatiere, largeursBarres, libelleChoisir, lignesSelonLaQuantite, meilleursPrixAuKilo, phraseSelonLaQuantite, plusBasDe,
  classerAuKilo, prixAuKilo, texteChfKg, texteQuantite, uniteExtensive, vendeurCourt, venduPar, type ArticleRegle
} from './tableauRegles';
import './carnets-decider.css';
import './comparer-compact.css';

/** Le tableau tel que `tableau(carnet)` de `comparer.ts` le rend (lot A, critère A9). */
export type TableauV = Tableau;
type LigneT = Tableau['lignes'][number];

/**
 * R40 (PX) : la colonne des prix dit la monnaie de COMPARAISON : le franc (on classe en francs, au kilo ou au litre quand les quantités sont dites), jamais la devise du
 * premier article (« prix EUR » sur ses mots du 24.11 : MotlerHops en tête de ligne).
 */
const unitePrixColonne = (t: Tableau): string => (t.prixParUnite ? (t.prixParUnite === 'volume' ? 'CHF/L' : 'CHF/kg') : 'CHF');

/** Une colonne affichée : les caractéristiques des critères, puis le prix (sens moins, même devise). */
export interface ColonneVue { cle: string; nom: string; unite?: string; sens: Sens; critere: boolean; /** R46 (C61-5) : la mesure cible du critère (« Marmite de brassage 50 L » : 50) ; le meilleur est le plus proche d'elle */ cible?: number }

/**
 * Les colonnes dans l'ordre de g01-8 : les caractéristiques des critères (la 1re, celle qui classe d'abord, est `critere`), puis le prix,
 * puis les valeurs lues sur au moins 2 articles (débit, °C : P10), montrées sans être classées.
 */
export function colonnesVue(t: Tableau): ColonneVue[] {
  const vue = (c: Tableau['colonnes'][number], critere: boolean): ColonneVue => ({ cle: c.nom, nom: c.nom, unite: c.unite, sens: c.sens, critere, ...(c.cible !== undefined ? { cible: c.cible } : {}) });
  const deCriteres = t.colonnes.filter(c => c.critereId);
  const cols: ColonneVue[] = deCriteres.map((c, i) => vue(c, i === 0));
  if (t.lignes.some(l => l.prixCentimes !== undefined)) cols.push({ cle: '__prix', nom: 'prix', unite: unitePrixColonne(t), sens: 'moins', critere: false });
  for (const c of t.colonnes.filter(x => !x.critereId)) cols.push(vue(c, false));
  return cols;
}

/** Les lignes de livraison (CRB-13) : ce que l'article porte déjà ; une ligne n'existe que si un article au moins la dit. */
const LIVRAISON = [{ cle: '__dispo', nom: 'dispo', champ: 'dispo' }, { cle: '__vendeur', nom: 'vendeur', champ: 'vendeur' }, { cle: '__pays', nom: 'pays', champ: 'pays' }] as const;

/**
 * Les lignes de Comparer (CRB-14, C55-4 / R26) : L'OFFRE d'abord et ensemble, le prix TOUJOURS en tête (CRB-2 : une rangée absente ne dit
 * rien, « prix ? » dit qu'on ne sait pas), ce qui classe (sa place décidée), puis dispo, vendeur, pays (CRB-13) ; ensuite les
 * caractéristiques dans l'ordre de la FICHE (`trierParDecision`, le même que `FicheArticle` : température, volume, énergie, froid,
 * dimensions, porte, construction, couleur ; le nom départage, jamais l'ordre de la page). `colonnesVue` reste celle du carnet
 * (CarnetOuvert) : elle n'est pas touchée.
 */
export function colonnesComparer(t: Tableau): ColonneVue[] {
  const deCritere = new Set(t.colonnes.filter(c => c.critereId).map(c => c.nom));
  const prix: ColonneVue = { cle: '__prix', nom: 'prix', unite: unitePrixColonne(t), sens: 'moins', critere: false };
  const livraison: ColonneVue[] = LIVRAISON.filter(x => t.lignes.some(l => !!l[x.champ])).map(x => ({ cle: x.cle, nom: x.nom, sens: 'texte', critere: false }));
  const toutes = [prix, ...colonnesVue(t).filter(c => c.cle !== '__prix'), ...livraison];
  const famille = (c: ColonneVue) => groupeDeLigne(c.nom, deCritere.has(c.cle));
  /* C56-6 (R29) : l'offre reste d'un bloc (prix, dispo, vendeur, pays) ; la ligne qui classe vient JUSTE APRÈS elle, jamais au milieu (tour 56 :
     prix, volume, dispo, vendeur). `LIGNE_CRITERE` (1) ne sert plus qu'à la reconnaître. */
  const rangee = (c: ColonneVue) => (famille(c) === LIGNE_CRITERE ? LIGNE_LIVRAISON + 0.5 : famille(c));
  const offre = toutes.map((c, i) => ({ c, i, g: rangee(c) })).filter(x => x.g <= LIGNE_LIVRAISON + 0.5).sort((a, b) => a.g - b.g || a.i - b.i).map(x => x.c);
  /* la valeur et l'unité lues sur le 1er article qui la porte : un nom que la liste ne connaît pas se range par son unité (« 400 W » : l'énergie) */
  const lue = (c: ColonneVue) => t.lignes.map(l => l.cellules[c.cle]).find(v => v !== undefined);
  const caracteristiques = trierParDecision(toutes.filter(c => famille(c) > LIGNE_LIVRAISON).map(c => ({ nom: c.nom, c })), [], undefined, x => lue(x.c)?.valeur, x => lue(x.c)?.unite ?? x.c.unite).map(x => x.c);
  return [...offre, ...caracteristiques];
}

function nombre(v?: ValeurV): number | null {
  if (!v) return null;
  if (typeof v.valeur === 'boolean') return v.valeur ? 1 : 0;
  return nombreDe(v.valeur);
}
/** Texte d'une cellule ; `null` si inconnue (cellule vide, jamais 0). */
export function texteCellule(l: LigneT, c: ColonneVue): string | null {
  if (c.cle === '__prix') return montant(l.prixCentimes);
  const liv = LIVRAISON.find(x => x.cle === c.cle);
  if (liv) return l[liv.champ] ?? null;
  return texteSelonNom(c.nom, valeurTexte(l.cellules[c.cle]), l.cellules[c.cle]?.valeur);
}

/**
 * C55-1 (R23) : un libellé de ligne dont un mot est long (« Branchement », « refroidissement » : 11 signes ou plus, plus de 70 px à 14 px) ne
 * tient pas dans les 74 px que le téléphone laisse aux libellés (CRB-3 : ses trois articles se voient à 390). Ce libellé-là, et lui seul, relève
 * son plafond (`th[data-mot-long]`, comparer-compact.css) : sa colonne s'élargit juste de ce qu'il faut, jamais coupée au milieu d'un mot
 * (c48 R2 : « Dimension / s »), jamais sur la valeur voisine. Les libellés courts gardent leurs 74 px.
 */
export const aMotLong = (libelle: string): boolean => libelle.split(/[s/]+/).some(m => [...m].length >= 11);

/**
 * C55-3 (R25) : le grand chiffre de l'en-tête d'une colonne dit son unité (« 242 L », « 2,6 m³ »), une seule fois : la ligne du tableau la dit
 * déjà à sa manière, mais l'en-tête se lit seul. Une valeur qui la porte (« 0 à 8 °C ») reste telle quelle.
 */
export function texteEntete(l: LigneT, c: ColonneVue): string | null {
  const t = texteCellule(l, c);
  const u = c.unite && !c.cle.startsWith('__') ? c.unite : undefined;
  return t && u && !t.includes(u) ? `${t} ${u}` : t;
}

/**
 * CRU-6 : une mesure (nombre, unité, « 1800 x 1500 x 2200 mm », « +2 à +8 °C ») se dit en mono, à droite ; un mot (« blanc »,
 * « Panneaux sandwich, groupe frigorifique monobloc », « en stock ») se dit en police du texte, à gauche (DESIGN : un mot en mono qui
 * n'est pas une mesure est une faute).
 */
/* \s dans les nombres : `montant` et `valeurTexte` groupent les milliers par une fine insécable (U+202F) */
const MESURE = /^[<>≈~]?\s*[+−-]?\d[\d\s'’.,]*(?:\s*[x×]\s*[+−-]?\d[\d\s'’.,]*)*(?:\s*(?:à|–|-)\s*[+−-]?\d[\d\s'’.,]*)?\s*(?:[A-Za-zµ°%³²]+(?:\/[A-Za-z³²]+)?)?$/;
export function estMesure(txt: string): boolean { return MESURE.test(txt.trim()); }
/** Un nombre posé par la page (prix compris) est une mesure même sans unité ; sinon la forme du texte en décide. */
export function genreCellule(c: ColonneVue, v: ValeurV | undefined, txt: string): 'mesure' | 'texte' {
  if (c.cle === '__prix' || (v && typeof v.valeur === 'number')) return 'mesure';
  return estMesure(txt) ? 'mesure' : 'texte';
}
/** Une mesure à plusieurs termes (« 1800 x 1500 x 2200 mm ») : un terme par ligne, jamais coupée au milieu d'un nombre. */
function Mesure({ txt }: { txt: string }) {
  const termes = txt.split(/\s*[x×]\s*/).filter(Boolean);
  if (termes.length < 2) return <span className="cn-mono"><Insec t={txt} /></span>;
  return <>{termes.map((s, i) => <span key={i} className="cn-mono cn-terme"><Insec t={s} />{i < termes.length - 1 ? ' ×' : ''}</span>)}</>;
}
/** Les articles en lice qui tiennent la meilleure valeur connue de la colonne (surlignés) ; aucun si moins de 2 valeurs connues. */
export function meilleursDe(t: Tableau, c: ColonneVue): Set<string> {
  if (c.sens === 'texte') return new Set();
  const connus = t.lignes.filter(l => !l.ecarte).map(l => ({ id: l.articleId, n: c.cle === '__prix' ? (l.prixCentimes ?? null) : nombre(l.cellules[c.cle]) })).filter((x): x is { id: string; n: number } => x.n !== null);
  if (connus.length < 2) return new Set();
  /* R46 (C61-5) : un critère à cible (« Marmite de brassage 50 L ») : le vert va au plus proche de la cible, jamais au plus grand */
  if (c.cible !== undefined && (c.sens === 'plus' || c.sens === 'moins')) {
    const proche = Math.min(...connus.map(x => Math.abs(x.n - c.cible!)));
    return new Set(connus.filter(x => Math.abs(x.n - c.cible!) === proche).map(x => x.id));
  }
  const cible = c.sens === 'moins' ? Math.min(...connus.map(x => x.n)) : Math.max(...connus.map(x => x.n));
  return new Set(connus.filter(x => x.n === cible).map(x => x.id));
}

/** Le domaine d'un lien : `domaine` lu, sinon l'hôte de l'adresse (sans « www. ») ; `undefined` si rien ne le dit. */
export function domaineDe(a: Pick<ArticleV, 'domaine' | 'url'>): string | undefined {
  if (a.domaine?.trim()) return a.domaine.trim();
  if (!a.url) return undefined;
  try { return new URL(a.url).hostname.replace(/^www\./, '') || undefined; } catch { return undefined; }
}

/**
 * Un lien sans aperçu (même libellé que la carte R04) : sa page n'est pas lue et rien n'en est connu ; `null` s'il se nomme.
 * « Lien sans aperçu · <domaine> · page non lue » ; pendant la lecture, « <domaine> · lecture… ».
 */
export function sansApercu(a: Pick<ArticleV, 'lecture' | 'nom' | 'domaine' | 'url'>): { titre: string; sous: string; enCours: boolean } | null {
  /* test en ligne 2 (bloquant 6) : un article nommé garde son nom, sa page lue ou non (comme sa carte) ; seul un lien sans nom est « sans aperçu » */
  if (a.lecture === 'lue' || a.nom?.trim()) return null;
  const domaine = domaineDe(a);
  const enCours = a.lecture === 'en-cours' || a.lecture === 'a-lire';
  /* D447 : un lien mort se dit tel (« introuvable »), pas « page non lue » : la page n'existe plus, rien n'est à relire */
  const morte = a.lecture === 'introuvable';
  return { titre: enCours ? (domaine ?? 'Lien') : morte ? 'Lien introuvable' : 'Lien sans aperçu', sous: `${domaine ? `${domaine} · ` : ''}${enCours ? 'lecture…' : morte ? 'ne mène plus à la fiche' : 'page non lue'}`, enCours };
}

/**
 * Paquet 1, PCN-162 (test en ligne 1, n° 7) : un article ne se choisit pas tant que rien n'en est connu ; un prix connu (écrit dans sa
 * phrase) suffit, même si sa page n'a pas été lue. Le message dit « ni nom, ni prix connus » : il ne ment plus quand le prix s'affiche.
 */
export function choixBloque(a: Pick<ArticleV, 'lecture' | 'nom' | 'domaine' | 'url' | 'prixCentimes'>): ReturnType<typeof sansApercu> {
  return a.prixCentimes !== undefined ? null : sansApercu(a);
}

/** Pour `nonLus` : les articles dont la page n'est pas lue, par id, avec leur domaine (à passer par le conteneur). */
export type LienNonLu = Pick<ArticleV, 'lecture' | 'nom' | 'domaine' | 'url'>;
export function nonLusDe(articles: (LienNonLu & { id: string })[]): Record<string, LienNonLu> {
  const sortie: Record<string, LienNonLu> = {};
  for (const a of articles) if (sansApercu(a)) sortie[a.id] = { lecture: a.lecture, nom: a.nom, domaine: a.domaine, url: a.url };
  return sortie;
}

const HOTE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
/**
 * Le libellé d'une colonne sans aperçu. Par `nonLus` quand le conteneur le donne ; sinon, une ligne qui ne porte que son domaine
 * pour nom (`nomArticle` retombe sur le domaine), sans aucune valeur ni prix, est un lien dont la page n'a pas été lue.
 */
export function apercuLigne(l: LigneT, nonLus?: Record<string, Pick<ArticleV, 'lecture' | 'nom' | 'domaine' | 'url'>>): { titre: string; sous: string } | null {
  const a = nonLus?.[l.articleId];
  if (a) return sansApercu(a);
  const rien = l.prixCentimes === undefined && !Object.values(l.cellules).some(Boolean);
  if (rien && HOTE.test(l.nom.trim())) return { titre: 'Lien sans aperçu', sous: `${l.nom.trim()} · page non lue` };
  return null;
}

export interface ComparerProps {
  titre: string;
  /** D421 : le taux EUR→CHF (Finances, sinon posé une fois) ; sans lui, l'euro se dit en euros (« taux ? »). */
  taux?: number;
  /** « 1 façon · 3 articles » (A1) */
  facons?: number;
  /** Les articles dont la page n'est pas lue (`nonLusDe(carnet.articles)`) : « Lien sans aperçu », jamais le domaine seul. */
  nonLus?: Record<string, Pick<ArticleV, 'lecture' | 'nom' | 'domaine' | 'url'>>;
  statut: StatutCarnet;
  critere?: CritereV;
  tableau: TableauV | null;
  /** Photo de chaque article, par id (en-têtes de colonne). */
  photos?: Record<string, string | undefined>;
  /** Vendeurs et prix de la fixture : « exemple » (le simulé est marqué). */
  exemple?: boolean;
  /** « Compromis : … » de l'IA ; sans elle, `compromisDe(tableau)` le calcule sur place (picto local, Q19). */
  compromis?: string;
  /** Le picto de chaque article (lot B), par id, quand il n'a pas de photo : jamais un picto générique. */
  pictos?: Record<string, React.ReactNode>;
  onRetour: () => void;
  onOuvrirArticle?: (articleId: string) => void;
  /** R54 : l'article que le bouton nomme (le 1er du classement au kilo), pour que l'écran Choisir ouvre celui-là. */
  onChoisir?: (articleId?: string) => void;
  /** C48-1 : relire la page d'un article lu dont le prix est « ? » (geste du brasseur) ; absent : pas de bouton. */
  onRelire?: (articleId: string) => void | Promise<void>;
  /** ESCALADER-SUR-MANQUE : relire avec l'IA forte un article dont un champ manque ou dont les lectures se contredisent ; absent : pas de bouton. */
  onEscalader?: (articleId: string) => void | Promise<void>;
  /** Tour 3, PCN-164 : d'où viennent les valeurs (`mentionValeurs`) ; absent : les vendeurs. */
  mention?: string;
  /**
   * D451 (maquettes2/v01) : les articles du carnet (offres, conditionnements, doutes). Avec eux, un carnet de matière pesée dit « Prix au kilo, rendu »
   * à la quantité d'achat du carnet, « Selon la quantité » et son compromis ; sans eux, le prix au kilo se lit sur les lignes du tableau.
   */
  articles?: ReadonlyArray<ArticleRegle & { id: string }>;
}

/** Les barres « moins = mieux » (maquette v01) : le meilleur en vert à 100 % de la place divisée par la plus grande valeur, les autres en gris. */
function BarresPrix({ titre, sous, lignes, calcule }: { titre: string; sous: string; lignes: ReadonlyArray<{ id: string; nom: string; valeur: number; texte: string }>; calcule?: boolean }) {
  const ordre = [...lignes].sort((x, y) => x.valeur - y.valeur);
  const valeurs = new Map<string, number | null>(ordre.map(l => [l.id, l.valeur] as const));
  const meilleurs = plusBasDe(valeurs);
  const barres = largeursBarres(valeurs);
  return (
    <section className="cn-bloc cn-barres" aria-label={titre}>
      <h4><b>{titre}</b> <span className="cn-mut">{sous}</span>{calcule ? <> <Provenance origine="locale" /></> : null}</h4>
      {ordre.map((l, i) => {
        const bon = meilleurs.has(l.id);
        return (
          <div key={l.id} className="cn-barre">
            <span className={`cn-rang${i === 0 ? ' cn-rang-1' : ''}`}>{i + 1}</span>
            <span className="cn-barre-nom">{l.nom}</span>
            <span className="cn-barre-piste" aria-hidden><i className={bon ? undefined : 'cn-barre-autre'} style={{ width: `${barres.get(l.id) ?? 0}%` }} /></span>
            <b className={`cn-mono cn-barre-val${bon ? ' cn-vert' : ''}`}>{l.texte}</b>
          </div>
        );
      })}
    </section>
  );
}

/**
 * « Il y a une suite à droite » : vrai tant que la zone défile encore vers la droite (fondu, 390). Mesuré au rendu, au défilement et
 * au redimensionnement ; sans ResizeObserver (jsdom), seulement au défilement.
 */
function useSuiteADroite(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = React.useRef<HTMLDivElement>(null);
  const [suite, setSuite] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* « → n de plus » : les colonnes d'article pas entièrement visibles à droite (la colonne des noms, collée, n'en est pas). */
    const mesurer = () => {
      /* tour 3, f5c n° 7 : à 390, les colonnes d'articles se partagent la place en entier (3 de 85 px plutôt qu'une 4e coupée au bord) ;
         la suite se dit par l'ombre et « → n de plus ». Rien à 1280, où tout tient. */
      const tetes0 = el.querySelectorAll<HTMLElement>('thead th');
      const nCols = tetes0.length - 1;
      if (nCols > 0) {
        const dispo = el.clientWidth - tetes0[0].offsetWidth;
        const n = Math.max(1, Math.floor(dispo / LARGEUR_COLONNE));
        /* L-26 : la place se partage aussi quand tout tient (2 articles : ~125 px chacun, pas 78) : les noms se lisent en entier */
        if (dispo > 0) el.style.setProperty('--cn-col', `${Math.floor(dispo / Math.min(nCols, n))}px`); else el.style.removeProperty('--cn-col');
      }
      /* CRU-13 : plus de suite à droite = plus d'ombre ; 2 px de tolérance (une position fractionnaire en fin de course, écran dense) */
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) { setSuite(0); return; }
      const bord = el.getBoundingClientRect().right;
      const tetes = [...el.querySelectorAll('thead th')].slice(1);
      setSuite(Math.max(1, tetes.filter(th => th.getBoundingClientRect().right > bord + 1).length));
    };
    mesurer();
    el.addEventListener('scroll', mesurer, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(mesurer) : null;
    ro?.observe(el);
    if (el.firstElementChild) ro?.observe(el.firstElementChild);
    return () => { el.removeEventListener('scroll', mesurer); ro?.disconnect(); };
  }, []);
  return [ref, suite];
}

/**
 * Le critère qui classe d'abord (P32) : la 1re colonne de critère du tableau ; le critère passé en props s'il est celui-là (avec son
 * origine), sinon le texte du critère de la colonne. Aucun critère ne classe : `null` (l'en-tête dit alors « rangé par : le prix »).
 */
/** Tour 3, PCN-118 : tous les critères qui classent, dans l'ordre des colonnes ; le 1er comme `critereQuiClasse`. */
export function criteresQuiClassent(t: Tableau | null, critere?: CritereV): Array<{ texte: string; source?: 'phrase' | 'ia' }> {
  return (t?.colonnes ?? []).filter(c => c.critereId && c.sens !== 'texte').map(col => (critere && critere.id === col.critereId
    ? { texte: critere.texte, source: sourceDuCritere(critere) }
    : { texte: col.critereTexte ?? col.nom, ...(col.critereSource ? { source: col.critereSource } : {}) }));
}

/**
 * Tour 3, f5c n° 6 : « classées par … » ne redit pas « Ce qui compte » (déjà au-dessus, critère par critère) ; il ne garde que ce qui
 * s'ajoute : le prix qui départage les ex aequo (« à égalité, le moins cher »). Sans critère qui classe, la règle entière (g01-8).
 */
function texteClassees(t: Tableau, nCriteres: number): string | null {
  if (!t.rangePar) return null;
  if (!nCriteres) return `classées par ${t.rangePar}`;
  return /le prix$/.test(t.rangePar) ? 'à égalité, le moins cher' : null;
}

/**
 * C48-3 : le critère en tête, dit PAR UNE SEULE fonction pour Comparer et pour la feuille Articles (« Classés par ce qui compte ») : le 1er
 * critère qui classe, sinon le prix (« Prix » s'il classe, « Prix ? » quand deux prix ne sont pas lus). Même source que le calcul du rang.
 */
export function teteDeClassement(t: Tableau | null, critere?: CritereV): string {
  const premier = criteresQuiClassent(t, critere)[0];
  if (premier) return premier.texte;
  return t?.rangePar && /le prix/.test(t.rangePar) ? 'Prix' : 'Prix ?';
}

/**
 * C48-4 : une phrase de synthèse qui redit une valeur du tableau (prix, dimensions, volume : une cellule qui porte un chiffre, lue telle que
 * le tableau la dit) recopie le tableau. Comparaison sur le texte normalisé, nombre entier (« 2,6 » n'est pas dans « 12,60 »).
 */
const nettoyer = (s: string) => s.normalize('NFKC').replace(/[\s  ]+/g, ' ').trim().toLowerCase();
export function recopieLeTableau(phrase: string, t: Tableau): boolean {
  const p = nettoyer(phrase);
  return colonnesComparer(t).flatMap(c => t.lignes.map(l => texteCellule(l, c))).filter((x): x is string => !!x).map(nettoyer)
    .filter(x => x.length >= 3 && /\d/.test(x))
    .some(x => { let i = p.indexOf(x); while (i >= 0) { if (!/\d/.test(p[i - 1] ?? ' ') && !/[\d]/.test(p[i + x.length] ?? ' ')) return true; i = p.indexOf(x, i + 1); } return false; });
}

/** Tour 3, f5c n° 7 : « sous votre minimum de 1 500 m³/h » dit court dans sa cellule (« < min. 1 500 », l'unité est sur la ligne). */
export function horsSeuilCourt(h: string): string {
  const m = /^(sous votre minimum|au-dessus de votre maximum) de (.+?)(\s+[^\d\s].*)?$/.exec(h.trim());
  return m ? `${m[1].startsWith('sous') ? '< min.' : '> max.'} ${m[2].trim()}` : h;
}

/** f5c n° 7 : la largeur d'une colonne d'article (nom replié 70 à 78 px, et ses marges). */
const LARGEUR_COLONNE = 82;

export function critereQuiClasse(t: Tableau | null, critere?: CritereV): { texte: string; origine?: CritereV['origine']; source?: 'phrase' | 'ia' } | null {
  const col = t?.colonnes.find(c => c.critereId && c.sens !== 'texte');
  if (!col) return null;
  if (critere && critere.id === col.critereId) return { texte: critere.texte, origine: critere.origine, source: sourceDuCritere(critere) };
  /* critique 6, point 16 : la source du critère qui classe vient de sa colonne (`sourceDuCritere` dans comparer.ts), même quand le critère
     passé en props est un autre (le 1er du carnet, sans valeur) */
  return { texte: col.critereTexte ?? col.nom, ...(col.critereSource ? { source: col.critereSource } : {}) };
}

/**
 * Critique 5, n° 22 : le premier critère du carnet (`critere`, « capter la buée ») ne range rien quand il n'a pas de valeur (aucune
 * caractéristique, ou aucune colonne du tableau ne la porte). L'écran le dit au lieu de laisser croire qu'il classe. `null` s'il range,
 * ou si la règle du tableau (`rangePar`, lot A) le nomme déjà.
 */
export function premierSansValeur(t: Tableau | null, critere?: CritereV): string | null {
  if (!t || !critere?.texte?.trim()) return null;
  const range = t.colonnes.some(c => c.critereId === critere.id && c.sens !== 'texte');
  if (range) return null;
  if (t.rangePar && t.rangePar.includes(critere.texte.trim())) return null;
  return critere.texte.trim();
}

/**
 * Critique 5, n° 23 : « moins bien que la 3e sur tout » au lieu de « moins bien partout ». Le rang du meilleur article en lice qui
 * domine `l` au sens de Pareto, sur les mêmes colonnes que `domine` (lot A, `comparer.ts`) : les critères qui classent (plus, moins,
 * oui-non) et le prix de même devise, comparés seulement où les deux valeurs sont connues (au moins 2), au moins aussi bon partout et
 * meilleur sur une. Le champ `moinsBienQue` du tableau (lot A) prime s'il existe. `null` si personne ne le domine.
 */
export function moinsBienQueDe(t: Tableau, l: LigneT): number | null {
  const duLotA = (l as LigneT & { moinsBienQue?: number | null }).moinsBienQue;
  if (typeof duLotA === 'number') return duLotA;
  /* tour 3, f5d n° 10 : une ligne venue de `tableau()` (elle porte `moinsBienPartout`) : le domaine a jugé, et une colonne lue sans sens
     (débit 40 contre 25 L/min) peut séparer deux articles que les seuls critères diraient dominés. Pas de second calcul. */
  if (typeof (l as LigneT & { moinsBienPartout?: boolean }).moinsBienPartout === 'boolean') return null;
  if (l.rang === null) return null;
  const cols = t.colonnes.filter(c => c.critereId && c.sens !== 'texte');
  const num = (x: LigneT, c: Tableau['colonnes'][number]): number | null => {
    const v = x.cellules[c.nom];
    if (c.sens === 'oui-non' && typeof v?.valeur === 'string') { const s = v.valeur.trim().toLowerCase(); return s === 'oui' ? 1 : s === 'non' ? 0 : null; }
    return nombre(v);
  };
  const domine = (b: LigneT): boolean => {
    const ecarts: number[] = [];
    for (const c of cols) {
      const va = num(l, c), vb = num(b, c);
      if (va === null || vb === null) continue;
      ecarts.push(c.sens === 'moins' ? vb - va : va - vb); /* < 0 : b meilleur */
    }
    if (l.prixCentimes !== undefined && b.prixCentimes !== undefined && (l.devise ?? 'CHF') === (b.devise ?? 'CHF')) ecarts.push(b.prixCentimes - l.prixCentimes);
    return ecarts.length >= 2 && ecarts.every(e => e <= 0) && ecarts.some(e => e < 0);
  };
  const par = t.lignes.filter(b => b.rang !== null && b.articleId !== l.articleId && domine(b)).sort((a, b) => a.rang! - b.rang!)[0];
  return par?.rang ?? null;
}
const rangF = (n: number) => (n === 1 ? 'la 1re' : `la ${n}e`);

/** Les valeurs du tableau sont-elles celles de l'exemple (fixture) ? Une seule cellule « exemple » suffit à le dire. */
function deLExemple(t: Tableau): boolean {
  return t.lignes.some(l => Object.values(l.cellules).some(v => v?.origine === 'exemple'));
}

/** La vignette d'une colonne (g01-8) : la photo, sinon le picto de l'objet (lot B) ; sinon rien, jamais un cube générique. */
function Vignette({ photo, picto }: { photo?: string; picto?: React.ReactNode }) {
  if (photo) return <Photo src={photo} className="cn-vignette cn-cmp-vignette" repli={<Vignette picto={picto} />} />;
  if (picto) return <span className="cn-vignette cn-cmp-vignette cn-vignette-vide" aria-hidden>{picto}</span>;
  /* critique 6 (1280, 22) : sans photo ni picto, la place reste vide et réservée, pour que rangs et noms s'alignent d'une colonne à l'autre */
  return <span className="cn-cmp-vignette cn-cmp-vignette-place" aria-hidden />;
}

/** A1 : la cellule du prix. Inconnu : case hachurée « ? » ; « dès » au-dessus d'un plancher ; en euros, ≈ rendu en brun et l'euro dessous (sans taux : l'euro et « taux ? »). */
function CellulePrix({ l, taux, onRelire, onEscalader, prixKg }: { l: LigneT; taux?: number; onRelire?: (articleId: string) => void | Promise<void>; onEscalader?: (articleId: string) => void | Promise<void>; prixKg?: string | null }) {
  const escalader = onEscalader && !l.ecarte && l.aEscalader?.length ? <BoutonEscalader onEscalader={() => onEscalader(l.articleId)} raison={l.aEscalader.map(x => (x === 'doute' ? 'les deux lectures ne s\u2019accordent pas' : `${x} manquant`)).join(' ; ')} classe="cn-escalader-cellule" /> : null;
  /* C48-1 : l'article est lu mais son prix ne l'est pas : « Relire » est un geste du brasseur (rien ne part tout seul) */
  if (l.prixCentimes === undefined) return <><span className="cn-hach" title="Prix non lu : relire la page de l'article">?</span>{onRelire && !l.ecarte ? <BoutonRelire onRelire={() => onRelire(l.articleId)} classe="cn-relire-cellule" /> : null}{escalader}</>;
  /* D451 (maquette v01, « CHF/kg ≈ 41 ») : un carnet de matière pesée compare le kilo rendu à la quantité d'achat du carnet ; les gestes de la cellule restent */
  if (prixKg) return <><span className="cn-mono">{prixKg}</span>{escalader}</>;
  if (estEtranger(l)) {
    const r = renduArticle(l, taux);
    const dev = (l.devise ?? '').toUpperCase();
    const orig = `${montant(l.prixCentimes)} ${dev === 'EUR' ? '€' : dev}${mentionTaxe(l.taxe)}`;
    return r && r.totalChf !== undefined
      ? <><small className="cn-mut">{r.manque.length ? 'dès' : 'estimé'}</small><span className="cn-mono cn-brun">≈{montant(Math.round(r.totalChf / 100) * 100)}</span><small className="cn-mut cn-mono">{orig}</small>{l.quantite ? <small className="cn-mut">{l.quantite}{l.parUnite ? ` · ${l.parUnite}` : ''}</small> : null}{escalader}</>
      : <><span className="cn-mono">{orig}</span><small className="cn-mut">{dev === 'EUR' ? 'taux ?' : 'cours ?'}</small>{l.quantite ? <small className="cn-mut">{l.quantite}</small> : null}{escalader}</>;
  }
  return <>{l.prixDes ? <small className="cn-mut">dès</small> : null}<Mesure txt={montant(l.prixCentimes) ?? ''} />{l.quantite ? <small className="cn-mut">{l.quantite}{l.parUnite ? ` · ${l.parUnite}` : ''}</small> : null}{l.prixUnite ? <small className="cn-mut">{l.prixUnite}</small> : null}{l.taxe ? <small className="cn-mut">{mentionTaxe(l.taxe).trim()}</small> : null}{escalader}</>;
}

/* C66-5 : les lignes que la page lit en vrac, « Conditionnement g 100 / 50 / ? », ne disent rien d'un houblon vendu en plusieurs sachets : la ligne « vendu par » les remplace */
const CONDITIONNEMENT_NU = /^(?:conditionnement|taille de l.emballage|emballage|verpackung|gebinde)/i;
const NOM_ALPHA = /(?:^|[^a-z])alpha(?:[^a-z]|$)|^α/i;
const sansAccentNom = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

export function Comparer(p: ComparerProps) {
  /* R53 (C66-3) : le même classement au kilo rendu que les cartes et le tableau (la colonne ①, le bouton Choisir, les barres et le compromis disent le même gagnant) */
  const [pour] = usePour(p.titre);
  const t = p.tableau && p.articles ? classerAuKilo(p.tableau, p.articles as never, pour, p.taux) : p.tableau;
  const actifs = t ? t.lignes.filter(l => !l.ecarte) : [];
  const ecartes = t ? t.lignes.filter(l => l.ecarte) : [];
  const ordre = [...actifs, ...ecartes];
  const cols = t ? colonnesComparer(t) : [];
  const aRelire = t?.aRelire ?? [];
  const [zone, suite] = useSuiteADroite();
  const classe = critereQuiClasse(t, p.critere);
  /* tour 3, f5c n° 6 : la source se dit une fois quand tous les critères ont la même (« · proposé par l'IA ») */
  const cqc = criteresQuiClassent(t, p.critere);
  const sourceUnique = cqc.length > 0 && cqc.every(x => x.source === cqc[0].source) ? cqc[0].source : undefined;
  /* A1 : le prix classe s'il est connu sur au moins 2 articles en lice de même devise ; sinon son rang reste pointillé (« Prix ? ») */
  const prixConnus = actifs.filter(l => l.prixCentimes !== undefined);
  /* D451 : un carnet de matière pesée classe au kilo rendu ; ses articles viennent de `articles` */
  const enLice = p.articles ? actifs.flatMap(l => { const a = p.articles!.find(x => x.id === l.articleId); return a ? [a] : []; }) : [];
  const matiere = enLice.length > 1 && estCarnetDeMatiere(enLice);
  const prixClasse = matiere || (prixConnus.length >= 2 && new Set(prixConnus.map(l => l.devise ?? 'CHF')).size === 1);
  const aUnEuro = actifs.some(l => estEtranger(l));
  const aUnTaux = actifs.some(l => estEtranger(l) && tauxVersChf(l, p.taux));
  /* C48-4 (décision (b)) : sans critère qui classe, un compromis (de l'IA ou calculé) qui recopie les valeurs du tableau n'apprend rien : il
     n'est pas montré (l'IA récitant, le calcul local prend sa place, qui ne récite jamais). Avec un critère, la phrase de la maquette g01-8 reste. */
  /* C58-4 (R32, arbitrage du pilote 24.11) : une phrase qui DIT L'ÉCART DE PRIX apprend ce que le tableau ne dit pas (le gain) ; la perte se dit par les valeurs
     qui distinguent les articles, même si le tableau les montre. Seule une phrase sans écart, qui recopie le tableau, est écartée (c48Regles R4). */
  const recite = (phrase: string) => cqc.length === 0 && !!t && recopieLeTableau(phrase, t) && !(!!ecartPrixDit(t) && ditLEcart(phrase));
  /* C50-5 : un compromis (de l'IA) qui ne dit pas l'écart de prix ne dit pas ce qu'on gagne et ce qu'on perd (tour 50 : « la 1re, 2 697,74 CHF, la moins
     chère », que le tableau dit déjà) : le calcul local, qui le dit, prend sa place. Aucun écart à dire (un seul prix) : la phrase de l'IA reste. */
  const ecartDit = ecartPrixDit(t);
  const ditLEcart = (phrase: string) => !ecartDit || phrase.replace(/[\s  ]/g, '').includes(ecartDit.replace(/\s?[A-Z]{3}$/, '').replace(/[\s  ]/g, ''));
  /* seul un compromis qui RECOPIE le tableau sans dire l'écart est écarté : « la 1re gagne un mètre cube de place, mais coûte plus cher » (sans valeur du tableau) reste */
  const recopieSansEcart = (phrase: string) => !!t && !ditLEcart(phrase) && recopieLeTableau(phrase, t);
  /* C58-4 : un compromis d'IA qui dit le gain sans la perte (« 289,77 CHF de moins que la 2e ») reçoit la perte du tableau (« la 2e a le volume 4,06 m³ au lieu de 2,6 m³ ») */
  const perte = perteDite(t);
  const completeParPerte = (phrase: string) => {
    if (!perte) return phrase;
    const nu = phrase.replace(/[s  ]/g, '');
    return perte.nombres.every(n => nu.includes(n.replace(/[s  ]/g, ''))) ? phrase : `${phrase.replace(/[s.;]+$/, '')}, mais ${perte.texte}`;
  };
  const compromisIA = p.compromis && !recite(p.compromis) && !recopieSansEcart(p.compromis) ? completeParPerte(p.compromis) : null;
  /* D451 : un carnet de matière pesée dit son compromis au kilo rendu (gain, α perdu, dispo douteuse) ; calculé plus bas, où `matiere` est connu */
  const compromisLocal = compromisIA ? null : (() => { const c = compromisDe(t); return c && !recite(c) ? c : null; })();
  /* le tableau naît au 2e article LU : un lien non lu n'en tient pas lieu (P6). L-27 : un seul article lu (le choisi, et des liens non
     lus) a sa colonne ; seul un tableau sans aucun article lu reste à naître */
  const naissant = !t || ordre.length === 0;
  const seul = !naissant && ordre.length === 1;
  /* L-26 : aucune case vide réservée au-dessus des noms quand aucune colonne n'a ni photo ni picto */
  const photoDe = (l: LigneT) => p.photos?.[l.articleId] ?? l.photo;
  const vignettes = ordre.some(l => !!photoDe(l) || !!p.pictos?.[l.articleId]);
  const sansValeur = premierSansValeur(t, p.critere);
  /* n° 23 : la phrase dite sous le tableau, pas une pastille dans l'en-tête (elle creusait ~100 px de vide sous les noms, n° 9) */
  const domines = t ? actifs.map(l => ({ l, par: moinsBienQueDe(t, l) })).filter((x): x is { l: LigneT; par: number } => x.par !== null) : [];
  /* n° 17 : une caractéristique dont personne n'a la valeur n'a pas de ligne (une rangée de « – » ne compare rien) ; elle se nomme dessous */
  const lignesLues = t ? cols.filter(c => c.cle.startsWith('__') || (!(matiere && CONDITIONNEMENT_NU.test(sansAccentNom(c.nom))) && t.lignes.some(l => l.cellules[c.cle] !== undefined))) : [];
  /* v01 : « vendu par 50 g à 1 kg » juste après le prix, pour un carnet de matière dont un article dit ses conditionnements ; l'inconnu reste « ? » */
  const venduParDe = new Map(enLice.map(a => [a.id, matiere ? venduPar(a as never) : null] as const));
  const iPrix = lignesLues.findIndex(c => c.cle === '__prix');
  const lignesVues = matiere && [...venduParDe.values()].some(Boolean) && iPrix >= 0
    ? [...lignesLues.slice(0, iPrix + 1), { cle: '__vendu', nom: 'vendu par', sens: 'texte' as Sens, critere: false } as ColonneVue, ...lignesLues.slice(iPrix + 1)]
    : lignesLues;
  const texteDe = (l: LigneT, c: ColonneVue): string | null => (c.cle === '__vendu' ? venduParDe.get(l.articleId) ?? null : texteCellule(l, c));
  const sansValeurLue = t ? cols.filter(c => !lignesLues.includes(c) && !(matiere && CONDITIONNEMENT_NU.test(sansAccentNom(c.nom)))) : [];
  /* A1 : la ligne épinglée (verte) est celle qui classe : le prix s'il classe, sinon la caractéristique du critère, sinon la rangée prix (en attente) */
  const cleEpinglee = prixClasse ? '__prix' : (lignesVues.find(c => c.critere)?.cle ?? '__prix');
  const colEntete = lignesVues.find(c => c.critere) ?? lignesVues.find(c => /volume/i.test(c.nom));
  /* D451 (maquettes2/v01) : un carnet de matière pesée se compare au kilo rendu, à la quantité d'achat du carnet ; le reste se compare à ses mesures. */
  const kilos = new Map(enLice.map(a => [a.id, matiere ? prixAuKilo(a, pour, p.taux) : null] as const));
  const prixKgDe = new Map([...kilos].flatMap(([id, pk]) => (pk ? [[id, texteChfKg(pk)] as const] : [])));
  const meilleursKg = meilleursPrixAuKilo(kilos);
  const barresMatiere = (() => {
    if (matiere) {
      const rows = enLice.flatMap(a => { const pk = prixAuKilo(a, pour, p.taux); return pk ? [{ id: a.id, nom: vendeurCourt(a), valeur: pk.chf, texte: texteChfKg(pk) }] : []; });
      return rows.length > 1 ? { titre: 'Prix au kilo, rendu', sous: `moins = mieux · ${texteQuantite(pour)}`, rows, calcule: true } : null;
    }
    return null;
  })();
  const quantites = matiere && aDesPaliers(enLice) ? lignesSelonLaQuantite(enLice, p.taux) : [];
  const phraseQuantite = quantites.length ? phraseSelonLaQuantite(quantites, id => { const a = enLice.find(x => x.id === id); return a ? vendeurCourt(a) : ''; }) : null;
  /* « 5 diffèrent » d'abord, « 18 identiques ▸ » repliés (B12) : ce qui classe (prix, critère) reste en vue même identique */
  const [identiquesDepliees, setIdentiquesDepliees] = React.useState(false);
  const comparables = lignesVues.map(c => ({ c, cle: c.cle, cellules: actifs.map(l => texteDe(l, c) ?? null) }));
  /* l'ordre des lignes ne change pas (offre en tête, ordre de la fiche) : les identiques se replient sur place et une ligne dépliante les dit en bas ; C66-5 : pour un houblon, une seule ligne égale se replie aussi (v01, « 1 identique ▸ ») ; ailleurs, un seul égal ne se replie pas (carnetsGreffeP2Cartes) */
  const separes = actifs.length >= 2 ? departager(comparables, new Set([cleEpinglee, ...lignesVues.filter(c => c.critere).map(c => c.cle)])) : null;
  const identiques = separes && separes.identiques.length >= (matiere ? 1 : 2) ? separes.identiques : [];
  const diffèrent = separes && identiques.length ? separes.diffèrent : comparables;
  const lignesAffichees = comparables;
  const premier = actifs.find(l => l.rang === 1);
  const libelleBouton = libelleChoisir({
    ...(matiere && premier ? (() => { const a = enLice.find(x => x.id === premier.articleId); return a ? { vendeur: vendeurCourt(a), pourKg: pour } : {}; })() : {}),
    tete: !matiere && premier && colEntete && uniteExtensive(colEntete.unite) ? texteEntete(premier, colEntete) : null
  });
  const compromisMat = !compromisIA && matiere ? compromisMatiere(enLice, pour, p.taux) : null;
  const compromisAffiche = compromisIA ?? compromisMat ?? compromisLocal;
  return (
    <article className="cn-page cn-comparer">
      <div className="cn-tete">
        {/* A1 (D419) : le fil porte le nom du carnet, le titre dit l'écran : « ‹ Chambre froide », « Comparer » */}
        <button type="button" className="cn-retour" onClick={p.onRetour}><ChevronLeft size={20} aria-hidden /> <span className="cn-retour-titre"><Insec t={p.titre} /></span></button>
        <span className="cn-sp" />
        <span className={`cn-pastille cn-statut-${p.statut}`}>{STATUT_LIBELLE[p.statut]}</span>
      </div>
      {/* L-26 : le titre, le nombre d'articles et « Classé par » partagent une ligne (elle se replie si la place manque) */}
      <div className="cn-cmp-entete">
        <h2 className="cn-titre">Comparer</h2>
        <p className="cn-mut cn-cmp-sous">{p.facons ? <>{p.facons} façon{p.facons > 1 ? 's' : ''} · </> : null}{actifs.length} article{actifs.length > 1 ? 's' : ''}</p>
        {/* A1 : « Classé par [Prix épinglé] › … » ; le prix s'il classe, sinon « Prix ? » pointillé et la caractéristique qui classe en noir */}
        {!naissant && !seul && (
          <p className="cn-chaine" aria-label="Classé par">
            <span className="cn-mut">Classé par</span>
            {/* C48-3 (décision (a) du pilote) : la chaîne dit le VRAI tri, critère d'abord puis le prix (comme `tableau` et la feuille Articles) ;
                la ligne Prix reste épinglée en haut du tableau, comme dans sa maquette : l'épingle suit celle des deux qui est épinglée. */}
            {cqc.length === 0 && <b className={prixClasse ? 'cn-on' : 'cn-trou'}><span role="img" aria-label="épinglé" className="cn-pin-ico"><Pin size={14} aria-hidden /></span> {prixClasse ? 'Prix' : 'Prix ?'}</b>}
            {cqc.map((x, i) => <React.Fragment key={i}>{i > 0 ? <span aria-hidden>›</span> : null}<b className={!prixClasse && i === 0 ? 'cn-on' : undefined}>{!prixClasse && i === 0 ? <><span role="img" aria-label="épinglé" className="cn-pin-ico"><Pin size={14} aria-hidden /></span> </> : null}<Insec t={x.texte} /></b>{!sourceUnique && x.source === 'ia' ? <span className="cn-mut"> (proposé par l'IA)</span> : null}</React.Fragment>)}
            {cqc.length > 0 && prixClasse && <><span aria-hidden>›</span><b className="cn-on"><span role="img" aria-label="épinglé" className="cn-pin-ico"><Pin size={14} aria-hidden /></span> Prix</b></>}
            {sourceUnique === 'ia' ? <span className="cn-mut cn-cmp-source">proposé par l'IA</span> : null}
          </p>
        )}
      </div>
      {classe && sansValeur && <p className="cn-mut cn-cmp-sans-valeur">« {sansValeur} » : sans valeur à comparer, il ne range pas</p>}
      {naissant ? (
        <>
          <p className="cn-vide">Le tableau naît au 2e article lu : collez un 2e lien dans le champ.</p>
          <ARelire articles={aRelire} />
        </>
      ) : (
        <>
          {/* À 1280, tout tient (noms et raisons repliés) ; à 390, la colonne des noms reste fixe et un fondu dit la suite à droite. */}
          {barresMatiere && <BarresPrix titre={barresMatiere.titre} sous={barresMatiere.sous} lignes={barresMatiere.rows} calcule={barresMatiere.calcule} />}
          {!seul && (cqc.length > 0 || !!barresMatiere) && <h3 className="cn-cote-a-cote"><b>Côte à côte</b> <span className="cn-mut">le meilleur coché</span></h3>}
          <div className="cn-tableau-cadre" data-suite={suite ? true : undefined}>
          <div className="cn-tableau-zone" ref={zone}>
            <table className="cn-tableau cn-tableau-comparer">
              <thead>
                <tr>
                  <th scope="col">{identiques.length > 0 ? <span className="cn-mut cn-cmp-differents">{ditDiffèrent(diffèrent.length)}</span> : <span className="cn-cache">Caractéristique</span>}</th>
                  {ordre.map(l => {
                    const sa = apercuLigne(l, p.nonLus);
                    return (
                      <th key={l.articleId} scope="col" className={`${l.ecarte ? 'cn-ecarte' : ''}${!l.ecarte && l.rang === 1 && rangVisible(t, l) ? ' cn-c1' : ''}`.trim() || undefined} data-apercu={sa ? 'aucun' : undefined}>
                        <button type="button" className="cn-col-tete" onClick={() => p.onOuvrirArticle?.(l.articleId)} disabled={!p.onOuvrirArticle} title={sa ? undefined : l.nom}>
                          {vignettes && <Vignette photo={photoDe(l)} picto={p.pictos?.[l.articleId]} />}
                          {/* CRB-5 : le rang ne se dit que si un critère ou le prix classe ; sinon aucune pastille. A1 : rond de 26 px sur le bas du picto */}
                          {l.ecarte ? <b>écarté</b> : rangVisible(t, l) ? <b className={`cn-cmp-rang${rangVisible(t, l) === 1 ? ' cn-cmp-rang-1' : ''}`}>{rangVisible(t, l)}</b> : null}
                          {colEntete && texteCellule(l, colEntete) ? <span className="cn-mono cn-cmp-gros"><Insec t={texteEntete(l, colEntete)} /></span> : null}
                          <span className="cn-cmp-nom">{liesParNbsp(sa ? sa.titre : l.nom)}</span>
                          {(l.vendeur || l.pays) && <span className="cn-mut cn-cmp-vend">{[l.vendeur, l.pays].filter(Boolean).join(' · ')}</span>}
                          {sa && <span className="cn-mut cn-sans-apercu">{sa.sous}</span>}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {lignesAffichees.map(({ c }) => {
                  /* C66-5 : le meilleur est coché sur CHAQUE ligne chiffrée qui diffère : le kilo rendu, et l'alpha le plus haut (le prix n'est pas la seule ligne cochée) */
                  const meilleurs = matiere && c.cle === '__prix' ? meilleursKg : meilleursDe(t, matiere && NOM_ALPHA.test(sansAccentNom(c.nom)) ? { ...c, sens: 'plus' } : c);
                  const replie = identiques.some(x => x.cle === c.cle) && !identiquesDepliees;
                  /* n° 7 (L14) : la ligne porte le nom de sa caractéristique (« ambiance max °C »), jamais l'unité seule */
                  const libelle = c.cle === '__prix' ? c.nom : libelleCaracteristique(c.nom);
                  /* C50-6 : l'unité se dit une fois, dans l'en-tête de la ligne (g01-8 « O₂ ppb ») ; une valeur qui la porte déjà (« 0 à 8 °C ») la dit seule, et la cellule qui ne la porte pas la garde pour le lecteur d'écran */
                  const unite = c.unite && !c.cle.startsWith('__') ? c.unite : undefined;
                  const porteUnite = (txt: string | null) => !!unite && !!txt && txt.includes(unite);
                  const uniteEntete = unite && !ordre.some(l => porteUnite(texteDe(l, c))) ? unite : undefined;
                  return (
                    <React.Fragment key={c.cle}>
                    <tr hidden={replie || undefined} className={`${c.critere ? 'cn-ligne-critere' : ''}${c.cle === cleEpinglee ? ' cn-ligne-epinglee' : ''}`.trim() || undefined}>
                      <th scope="row" title={libelle !== c.nom ? c.nom : undefined} data-mot-long={aMotLong(libelle) ? true : undefined}>{c.cle === cleEpinglee ? <span role="img" aria-label="épinglé" className="cn-epingle"><Pin size={14} aria-hidden /></span> : null}{libelle}{c.cle.startsWith('__') ? (c.unite ? <span className="cn-mut"> {c.unite}</span> : null) : uniteEntete ? <span className="cn-mut"> {uniteEntete}</span> : null}</th>
                      {ordre.map(l => {
                        const txt = texteDe(l, c);
                        const v = c.cle === '__prix' || c.cle.startsWith('__') ? undefined : l.cellules[c.cle];
                        const genre = txt ? genreCellule(c, v, txt) : null;
                        /* n° 18 : « non » lu sur sa façon (« ne tient pas 80 °C ») ; doute D-122 : « sous votre minimum » */
                        const deFacon = v?.origine === 'locale' && typeof v.valeur === 'boolean';
                        const hors = l.horsSeuil?.[c.cle];
                        return (
                          <td key={l.articleId} className={`${l.rang === 1 && !l.ecarte && rangVisible(t, l) ? 'cn-c1 ' : ''}${meilleurs.has(l.articleId) ? 'cn-meilleur' : ''}${l.ecarte ? ' cn-ecarte' : ''}${genre === 'texte' ? ' cn-cell-texte' : ''}`} title={deFacon ? 'd’après sa façon' : undefined}>
                            {c.cle === '__prix' ? <CellulePrix l={l} taux={p.taux} onRelire={p.onRelire} onEscalader={p.onEscalader} prixKg={matiere ? prixKgDe.get(l.articleId) ?? null : null} />
                              : txt ? <>{genre === 'mesure' ? <Mesure txt={txt} /> : <span className="cn-valeur-texte"><Insec t={txt} /></span>}{unite && !porteUnite(txt) ? <span className="cn-cache"> {unite}</span> : null}</>
                              : <span className="cn-inconnu" aria-label="inconnu">?</span>}
                            {hors && <span className="cn-hors-seuil" title={hors}><span aria-hidden>{horsSeuilCourt(hors)}</span><span className="cn-cache">{hors}</span></span>}{' '}{/* C58-2 : une espace en fin de cellule (invisible) : copiée ou lue d'un bloc, « 11,5 » et « 12,5 » ne se recollent pas en « 11,512,5 » */}
                          </td>
                        );
                      })}
                    </tr>
                    </React.Fragment>
                  );
                })}
                {/* « 18 identiques ▸ » : une ligne pour tout ce qui ne départage pas, dépliable ; les lignes restent dans le tableau, à leur place */}

              </tbody>
              {identiques.length > 0 && <tfoot>
                  <tr className="cn-cmp-identiques">
                    <td colSpan={ordre.length + 1}>
                      <button type="button" className="cn-cmp-identiques-bouton" aria-expanded={identiquesDepliees} onClick={() => setIdentiquesDepliees(o => !o)}>
                        <b>{ditIdentiques(identiques.length)}</b> <span aria-hidden>{identiquesDepliees ? '▾' : '▸'}</span>
                        {!identiquesDepliees && <span className="cn-mut cn-cmp-identiques-apercu">{identiques.map(x => x.cellules[0]).filter(Boolean).join(', ')}</span>}
                      </button>
                    </td>
                  </tr>
              </tfoot>}
            </table>
          </div>
          </div>
          {suite > 0 && <p className="cn-suite-indice" aria-hidden>→ {suite} de plus</p>}
          {seul && p.statut !== 'validated' && <p className="cn-mut cn-cmp-seul">Un 2e article lu se compare à celui-ci : collez un 2e lien dans le champ.</p>}
          {sansValeurLue.length > 0 && <p className="cn-mut cn-cmp-sans-lue">Aucune valeur lue pour : {sansValeurLue.map(c => libelleCaracteristique(c.nom)).join(', ')}</p>}
          {domines.length > 0 && (
            <ul className="cn-cmp-domines" aria-label="Moins bien sur tout">
              {domines.map(({ l, par }) => <li key={l.articleId}><b className="cn-encre">{rangF(l.rang!)}, {liesParNbsp(l.nom)}</b> : moins bien que {rangF(par)} sur tout</li>)}
            </ul>
          )}
          {/* g01-8 : « Compromis : la 1re, … », de l'IA, sinon calculé sur place avec les valeurs du tableau (picto local, pas le ✻ : Q19). */}
          {phraseQuantite && <p className="cn-bloc cn-quantite-phrase"><b>Selon la quantité</b> : <Insec t={phraseQuantite} /></p>}
          {!matiere && !barresMatiere && lignesAffichees.length > 0 && <BlocPrixParMesure lignes={actifs as never} cols={cols} enBarres />}
          {compromisAffiche && (
            <p className="cn-encart cn-compromis" data-source={compromisIA ? 'ia' : 'locale'}>
              <Scale size={20} role="img" aria-label="Compromis" className="cn-ok" />
              <span><b>Compromis :</b> <Insec t={compromisAffiche} /> <Provenance origine={compromisIA ? 'ia' : 'locale'} /></span>
            </p>
          )}
          {aUnEuro && <p className="cn-mut cn-annonce cn-annonce-eur">{aUnTaux ? `≈ rendu chez toi : TVA d’import 8,1 %, port lu sinon « ? », ${MENTION_FRAIS}, estimé` : 'Euros : le taux se pose dans la liste des articles'}</p>}
          <p className="cn-mut cn-annonce">{p.mention ?? 'Valeurs annoncées par les vendeurs'}{p.exemple || (t && deLExemple(t)) ? <> · <Provenance origine="exemple" /></> : null}</p>
          {/* La ligne « Écarté » (D-52) : chaque écarté, son nom et sa raison, lisibles sans défiler (p2:h04-7) ; aucun écarté, aucune ligne. */}
          {ecartes.length > 0 && (
            <table className="cn-ecartes" aria-label={`Écartés, ${ecartes.length}`}>
              <caption>Écartés · <span className="cn-mono">{ecartes.length}</span></caption>
              <tbody>
                {ecartes.map(l => {
                  const sa = apercuLigne(l, p.nonLus);
                  return (
                    <tr key={l.articleId}>
                      <th scope="row">{liesParNbsp(sa ? `${sa.titre} · ${sa.sous}` : l.nom)}</th>
                      <td className="cn-ecarte cn-ecarte-raison">{libelleEcarte(l.ecarte!.raison)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <ARelire articles={aRelire} />
          {p.onChoisir && p.statut !== 'validated' && <button type="button" className="cn-action" onClick={() => p.onChoisir!(premier?.articleId)}>{libelleBouton}</button>}
        </>
      )}
    </article>
  );
}

/**
 * Les liens à relire (P6, h05-3) : « ? Lien sans aperçu · <domaine> · à relire · Ouvrir ↗ ». Jamais classés, jamais une colonne
 * « – – – ». Aucun : rien.
 */
export function ARelire({ articles }: { articles: readonly { id: string; url?: string; domaine?: string; lecture?: string; nom?: string }[] }) {
  if (!articles.length) return null;
  return (
    <ul className="cn-a-relire" aria-label={`À relire, ${articles.length}`}>
      {articles.map(a => {
        const domaine = domaineDe(a);
        return (
          <li key={a.id}>
            <span className="cn-a-relire-q" aria-hidden>?</span>
            {/* test en ligne 2 (bloquant 6) : un lien que l'IA a nommé garde son nom */}
            <span className="cn-sp"><b>{a.nom?.trim() || (a.lecture === 'introuvable' ? 'Lien introuvable' : 'Lien sans aperçu')}</b><span className="cn-mut">{domaine ? `${domaine} · ` : ''}{a.lecture === 'en-cours' || a.lecture === 'a-lire' ? 'lecture…' : a.lecture === 'introuvable' ? 'ne mène plus à la fiche' : 'à relire'}</span></span>
            {a.url && <a className="cn-lien" href={a.url} target="_blank" rel="noreferrer noopener" aria-label={`Ouvrir ${domaine ?? 'le lien'}, nouvel onglet`}>Ouvrir <ExternalLink size={16} aria-hidden /></a>}
          </li>
        );
      })}
    </ul>
  );
}
