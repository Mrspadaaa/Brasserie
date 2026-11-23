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
import { prixRendu } from '../../domain/carnets/prixRendu';
import { sourceDuCritere } from '../../domain/carnets/modele';
import { compromisDe, groupeDeLigne, libelleCaracteristique, libelleEcarte, nombreDe, rangVisible, type Tableau } from '../../domain/carnets/comparer';
import { montant, Provenance, rangTexte, STATUT_LIBELLE, valeurTexte, type ArticleV, type CritereV, type Sens, type StatutCarnet, type ValeurV } from './EtatIA';
import { Photo } from './pictos';
import './carnets-decider.css';
import './comparer-compact.css';

/** Le tableau tel que `tableau(carnet)` de `comparer.ts` le rend (lot A, critère A9). */
export type TableauV = Tableau;
type LigneT = Tableau['lignes'][number];

/** Une colonne affichée : les caractéristiques des critères, puis le prix (sens moins, même devise). */
export interface ColonneVue { cle: string; nom: string; unite?: string; sens: Sens; critere: boolean }

/**
 * Les colonnes dans l'ordre de g01-8 : les caractéristiques des critères (la 1re, celle qui classe d'abord, est `critere`), puis le prix,
 * puis les valeurs lues sur au moins 2 articles (débit, °C : P10), montrées sans être classées.
 */
export function colonnesVue(t: Tableau): ColonneVue[] {
  const vue = (c: Tableau['colonnes'][number], critere: boolean): ColonneVue => ({ cle: c.nom, nom: c.nom, unite: c.unite, sens: c.sens, critere });
  const deCriteres = t.colonnes.filter(c => c.critereId);
  const cols: ColonneVue[] = deCriteres.map((c, i) => vue(c, i === 0));
  if (t.lignes.some(l => l.prixCentimes !== undefined)) cols.push({ cle: '__prix', nom: 'prix', unite: t.lignes.find(l => l.devise)?.devise ?? 'CHF', sens: 'moins', critere: false });
  for (const c of t.colonnes.filter(x => !x.critereId)) cols.push(vue(c, false));
  return cols;
}

/** Les lignes de livraison (CRB-13) : ce que l'article porte déjà ; une ligne n'existe que si un article au moins la dit. */
const LIVRAISON = [{ cle: '__dispo', nom: 'dispo', champ: 'dispo' }, { cle: '__vendeur', nom: 'vendeur', champ: 'vendeur' }, { cle: '__pays', nom: 'pays', champ: 'pays' }] as const;

/**
 * Les lignes de Comparer, dans l'ordre de sa décision (CRB-14, `groupeDeLigne`) : le prix TOUJOURS en tête (CRB-2 : une rangée absente ne
 * dit rien, « prix ? » dit qu'on ne sait pas), ce qui classe, le volume, les dimensions, la porte, la livraison (dispo, vendeur, pays :
 * CRB-13), le reste du groupe, la couleur en bas. `colonnesVue` reste celle du carnet (CarnetOuvert) : elle n'est pas touchée.
 */
export function colonnesComparer(t: Tableau): ColonneVue[] {
  const deCritere = new Set(t.colonnes.filter(c => c.critereId).map(c => c.nom));
  const prix: ColonneVue = { cle: '__prix', nom: 'prix', unite: t.lignes.find(l => l.devise)?.devise ?? 'CHF', sens: 'moins', critere: false };
  const livraison: ColonneVue[] = LIVRAISON.filter(x => t.lignes.some(l => !!l[x.champ])).map(x => ({ cle: x.cle, nom: x.nom, sens: 'texte', critere: false }));
  const toutes = [prix, ...colonnesVue(t).filter(c => c.cle !== '__prix'), ...livraison];
  return toutes.map((c, i) => ({ c, i, g: groupeDeLigne(c.nom, deCritere.has(c.cle)) })).sort((a, b) => a.g - b.g || a.i - b.i).map(x => x.c);
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
  return valeurTexte(l.cellules[c.cle]);
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
  if (termes.length < 2) return <span className="cn-mono">{txt}</span>;
  return <>{termes.map((s, i) => <span key={i} className="cn-mono cn-terme">{s}{i < termes.length - 1 ? ' ×' : ''}</span>)}</>;
}
/** Les articles en lice qui tiennent la meilleure valeur connue de la colonne (surlignés) ; aucun si moins de 2 valeurs connues. */
export function meilleursDe(t: Tableau, c: ColonneVue): Set<string> {
  if (c.sens === 'texte') return new Set();
  const connus = t.lignes.filter(l => !l.ecarte).map(l => ({ id: l.articleId, n: c.cle === '__prix' ? (l.prixCentimes ?? null) : nombre(l.cellules[c.cle]) })).filter((x): x is { id: string; n: number } => x.n !== null);
  if (connus.length < 2) return new Set();
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
  return { titre: enCours ? (domaine ?? 'Lien') : 'Lien sans aperçu', sous: `${domaine ? `${domaine} · ` : ''}${enCours ? 'lecture…' : 'page non lue'}`, enCours };
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
  onChoisir?: () => void;
  /** Tour 3, PCN-164 : d'où viennent les valeurs (`mentionValeurs`) ; absent : les vendeurs. */
  mention?: string;
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
function CellulePrix({ l, taux }: { l: LigneT; taux?: number }) {
  if (l.prixCentimes === undefined) return <span className="cn-hach" title="Prix non lu : relire la page de l'article">?</span>;
  if (l.devise === 'EUR') {
    const r = prixRendu({ eurCentimes: l.prixCentimes, taux });
    const eur = `${montant(Math.round(l.prixCentimes / 100) * 100)} €`;
    return r.totalChf !== undefined
      ? <><small className="cn-mut">{r.manque.length ? 'dès' : 'estimé'}</small><span className="cn-mono cn-brun">≈{montant(Math.round(r.totalChf / 100) * 100)}</span><small className="cn-mut cn-mono">{eur}</small></>
      : <><span className="cn-mono">{eur}</span><small className="cn-mut">taux ?</small></>;
  }
  return <>{l.prixDes ? <small className="cn-mut">dès</small> : null}<Mesure txt={montant(l.prixCentimes) ?? ''} /></>;
}

export function Comparer(p: ComparerProps) {
  const t = p.tableau;
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
  const prixClasse = prixConnus.length >= 2 && new Set(prixConnus.map(l => l.devise ?? 'CHF')).size === 1;
  const aUnEuro = actifs.some(l => l.devise === 'EUR' && l.prixCentimes !== undefined);
  const compromisLocal = p.compromis ? null : compromisDe(t);
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
  const lignesVues = t ? cols.filter(c => c.cle.startsWith('__') || t.lignes.some(l => l.cellules[c.cle] !== undefined)) : [];
  const sansValeurLue = t ? cols.filter(c => !lignesVues.includes(c)) : [];
  /* A1 : la ligne épinglée (verte) est celle qui classe : le prix s'il classe, sinon la caractéristique du critère, sinon la rangée prix (en attente) */
  const cleEpinglee = prixClasse ? '__prix' : (lignesVues.find(c => c.critere)?.cle ?? '__prix');
  const colEntete = lignesVues.find(c => c.critere) ?? lignesVues.find(c => /volume/i.test(c.nom));
  return (
    <article className="cn-page cn-comparer">
      <div className="cn-tete">
        {/* A1 (D419) : le fil porte le nom du carnet, le titre dit l'écran : « ‹ Chambre froide », « Comparer » */}
        <button type="button" className="cn-retour" onClick={p.onRetour}><ChevronLeft size={20} aria-hidden /> {p.titre}</button>
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
            <b className={prixClasse ? 'cn-on' : 'cn-trou'}><span role="img" aria-label="épinglé" className="cn-pin-ico"><Pin size={14} aria-hidden /></span> {prixClasse ? 'Prix' : 'Prix ?'}</b>
            {cqc.map((x, i) => <React.Fragment key={i}><span aria-hidden>›</span><b className={!prixClasse && i === 0 ? 'cn-on' : undefined}>{x.texte}</b>{!sourceUnique && x.source === 'ia' ? <span className="cn-mut"> (proposé par l'IA)</span> : null}</React.Fragment>)}
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
          <div className="cn-tableau-cadre" data-suite={suite ? true : undefined}>
          <div className="cn-tableau-zone" ref={zone}>
            <table className="cn-tableau cn-tableau-comparer">
              <thead>
                <tr>
                  <th scope="col"><span className="cn-cache">Caractéristique</span></th>
                  {ordre.map(l => {
                    const sa = apercuLigne(l, p.nonLus);
                    return (
                      <th key={l.articleId} scope="col" className={`${l.ecarte ? 'cn-ecarte' : ''}${!l.ecarte && l.rang === 1 && rangVisible(t, l) ? ' cn-c1' : ''}`.trim() || undefined} data-apercu={sa ? 'aucun' : undefined}>
                        <button type="button" className="cn-col-tete" onClick={() => p.onOuvrirArticle?.(l.articleId)} disabled={!p.onOuvrirArticle} title={sa ? undefined : l.nom}>
                          {vignettes && <Vignette photo={photoDe(l)} picto={p.pictos?.[l.articleId]} />}
                          {/* CRB-5 : le rang ne se dit que si un critère ou le prix classe ; sinon aucune pastille. A1 : rond de 26 px sur le bas du picto */}
                          {l.ecarte ? <b>écarté</b> : rangVisible(t, l) ? <b className={`cn-cmp-rang${rangVisible(t, l) === 1 ? ' cn-cmp-rang-1' : ''}`}>{rangVisible(t, l)}</b> : null}
                          {colEntete && texteCellule(l, colEntete) ? <span className="cn-mono cn-cmp-gros">{texteCellule(l, colEntete)}</span> : null}
                          <span className="cn-cmp-nom">{sa ? sa.titre : l.nom}</span>
                          {(l.vendeur || l.pays) && <span className="cn-mut cn-cmp-vend">{[l.vendeur, l.pays].filter(Boolean).join(' · ')}</span>}
                          {sa && <span className="cn-mut cn-sans-apercu">{sa.sous}</span>}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {lignesVues.map(c => {
                  const meilleurs = meilleursDe(t, c);
                  /* n° 7 (L14) : la ligne porte le nom de sa caractéristique (« ambiance max °C »), jamais l'unité seule */
                  const libelle = c.cle === '__prix' ? c.nom : libelleCaracteristique(c.nom);
                  return (
                    <tr key={c.cle} className={`${c.critere ? 'cn-ligne-critere' : ''}${c.cle === cleEpinglee ? ' cn-ligne-epinglee' : ''}`.trim() || undefined}>
                      <th scope="row" title={libelle !== c.nom ? c.nom : undefined}>{c.cle === cleEpinglee ? <span role="img" aria-label="épinglé" className="cn-epingle"><Pin size={14} aria-hidden /></span> : null}{libelle}{c.unite ? <span className="cn-mut"> {c.unite}</span> : null}</th>
                      {ordre.map(l => {
                        const txt = texteCellule(l, c);
                        const v = c.cle === '__prix' || c.cle.startsWith('__') ? undefined : l.cellules[c.cle];
                        const genre = txt ? genreCellule(c, v, txt) : null;
                        /* n° 18 : « non » lu sur sa façon (« ne tient pas 80 °C ») ; doute D-122 : « sous votre minimum » */
                        const deFacon = v?.origine === 'locale' && typeof v.valeur === 'boolean';
                        const hors = l.horsSeuil?.[c.cle];
                        return (
                          <td key={l.articleId} className={`${l.rang === 1 && !l.ecarte && rangVisible(t, l) ? 'cn-c1 ' : ''}${meilleurs.has(l.articleId) ? 'cn-meilleur' : ''}${l.ecarte ? ' cn-ecarte' : ''}${genre === 'texte' ? ' cn-cell-texte' : ''}`} title={deFacon ? 'd’après sa façon' : undefined}>
                            {c.cle === '__prix' ? <CellulePrix l={l} taux={p.taux} />
                              : txt ? (genre === 'mesure' ? <Mesure txt={txt} /> : <span className="cn-valeur-texte">{txt}</span>)
                              : <span className="cn-inconnu" aria-label="inconnu">–</span>}
                            {hors && <span className="cn-hors-seuil" title={hors}><span aria-hidden>{horsSeuilCourt(hors)}</span><span className="cn-cache">{hors}</span></span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
          {suite > 0 && <p className="cn-suite-indice" aria-hidden>→ {suite} de plus</p>}
          {seul && p.statut !== 'validated' && <p className="cn-mut cn-cmp-seul">Un 2e article lu se compare à celui-ci : collez un 2e lien dans le champ.</p>}
          {sansValeurLue.length > 0 && <p className="cn-mut cn-cmp-sans-lue">Aucune valeur lue pour : {sansValeurLue.map(c => libelleCaracteristique(c.nom)).join(', ')}</p>}
          {domines.length > 0 && (
            <ul className="cn-cmp-domines" aria-label="Moins bien sur tout">
              {domines.map(({ l, par }) => <li key={l.articleId}><b className="cn-encre">{rangF(l.rang!)}, {l.nom}</b> : moins bien que {rangF(par)} sur tout</li>)}
            </ul>
          )}
          {/* g01-8 : « Compromis : la 1re, … », de l'IA, sinon calculé sur place avec les valeurs du tableau (picto local, pas le ✻ : Q19). */}
          {(p.compromis || compromisLocal) && (
            <p className="cn-encart cn-compromis" data-source={p.compromis ? 'ia' : 'locale'}>
              <Scale size={20} role="img" aria-label="Compromis" className="cn-ok" />
              <span><b>Compromis :</b> {p.compromis ?? compromisLocal} <Provenance origine={p.compromis ? 'ia' : 'locale'} /></span>
            </p>
          )}
          {aUnEuro && <p className="cn-mut cn-annonce cn-annonce-eur">{p.taux ? '≈ rendu chez toi : TVA d’import 8,1 %, port et frais « ? » tant qu’inconnus, estimé' : 'Euros : le taux se pose dans la liste des articles'}</p>}
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
                      <th scope="row">{sa ? `${sa.titre} · ${sa.sous}` : l.nom}</th>
                      <td className="cn-ecarte cn-ecarte-raison">{libelleEcarte(l.ecarte!.raison)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <ARelire articles={aRelire} />
          {p.onChoisir && p.statut !== 'validated' && <button type="button" className="cn-action" onClick={p.onChoisir}>Choisir</button>}
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
            <span className="cn-sp"><b>{a.nom?.trim() || 'Lien sans aperçu'}</b><span className="cn-mut">{domaine ? `${domaine} · ` : ''}{a.lecture === 'en-cours' || a.lecture === 'a-lire' ? 'lecture…' : 'à relire'}</span></span>
            {a.url && <a className="cn-lien" href={a.url} target="_blank" rel="noreferrer noopener" aria-label={`Ouvrir ${domaine ?? 'le lien'}, nouvel onglet`}>Ouvrir <ExternalLink size={16} aria-hidden /></a>}
          </li>
        );
      })}
    </ul>
  );
}
