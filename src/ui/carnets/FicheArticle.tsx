/**
 * L'article ouvert (R05, figé p2:h01-6 ; critique 5, n° 8, 28, 36, 37) :
 * - le cadre photo : la photo de la page collée (« photo de la page collée ») ; sans photo, l'objet dessiné en grand dans le même cadre ;
 * - le nom entier, la façon et sa raison ;
 * - le héros du critère : la valeur en gros, sa réglette bornée des deux côtés (la meilleure et la pire valeur connues, chiffrées) et
 *   « la plus haute des 4 » sous la borne du meilleur ; sa propre place (« 3e sur 4 ») près de la valeur quand il n'est pas en tête ;
 * - les offres de la même machine (vendeur, prix « 1 450 CHF », Ouvrir ↗) ;
 * - « Caractéristiques » : une grille de 4 cases au moins, chaque valeur avec son rang (« 2e ») ; les colonnes du carnet que l'article
 *   ne publie pas sont dites « non publié » (jamais 0), puis le délai et l'origine, données de l'article ;
 * - la veille, « Choisir » en vert, et la phrase « Part dans À venir ».
 * Places et rangs : `placesDe(tableau(carnet), id)` de comparer.ts, parmi les articles en lice dont la valeur est connue ; rien n'est
 * inventé. Prix barré : seulement si un prix d'avant existe dans le document ; la relève n'existe pas encore (R31), donc aucun.
 * Veille (R31, D-28) : « Veille du prix, tous les 3 jours », éteinte à la naissance ; allumée et sans relève, « demandée · pas encore
 * relevée » : aucune date de relève, aucun prix relevé, aucune baisse.
 */
import React from 'react';
import { articleHonnete } from '../../domain/carnets/prixUnitaire';
import { FaitsNoteFiche } from './FaitNote';
import { Camera, Check, ChevronLeft, ChevronRight, ExternalLink, Eye, Pencil } from 'lucide-react';
import { Bascule, estExemple, mesureCritere, nombreValeur } from './CarteArticle';
import { dispoDe } from '../../domain/carnets/modele';
import { detailPrix, prixUnique } from './PrixPastille';
import { normaliser } from '../../domain/carnets/analyseLocale';
import { nombreTexte, placesDe, tableau as calculerTableau, valeursLuesDe, type Place } from '../../domain/carnets/comparer';
import { memeCaracteristique, trierParDecision } from '../../../functions/src/lienFusion';
import { parsePrix } from '../../domain/finance/upgradeRing';
import { dateCourte, mentionTaxe, montant, Provenance, rangTexte, texteSelonNom, valeurTexte, type ArticleV, type ContenuCarnetV, type CritereV, type FaconV, type ValeurV } from './EtatIA';
import { BoutonRelire } from './BoutonRelire';
import { BoutonEscalader } from './BoutonEscalader';
import { articleAEscalader, raisonEscalade } from '../../domain/carnets/manques';
import { Insec, liesParNbsp } from './insecable';
import './fiche-article.css';
import { marquerCassee, photoCassee, VignetteObjet } from './pictos';
import { TriangleAlert } from 'lucide-react';
import { jetonArome } from '../../domain/levure/couleurs';
import { nomAlpha } from '../../domain/carnets/alpha';
import { estMatierePesee } from '../../domain/carnets/prixUnitaire';
import { libelleDoute, usePour } from './TableauCarnet';
import {
  alphaDe, aromesCommuns, aromesDe, centimesRendus, conditionnementsDe, ligneDuPour, noteImport, quantiteDuChoix, sachetsSansPrix, recolteDe, textePrixConditionnement, texteChfKg, type ArticleRegle
} from './tableauRegles';

/** R54 : la quantité cochée dans « je prends » (`libelle` : « 1 kg »), son poids et son prix en francs (centimes). */
export interface QuantiteChoisie { kg: number; libelle: string; centimes: number; /** C70-1 : le prix vient d'une conversion (euros, TVA d'import) : l'écran dit « ≈ » */ estime?: boolean }

export interface FicheArticleProps {
  article: ArticleV;
  /** D447 : le taux EUR→CHF (facture ou posé) ; sans lui, le cours du jour lu avec la page. */
  taux?: number;
  titreCarnet: string;
  critere?: CritereV;
  facon?: FaconV;
  /** Le carnet entier : les places (héros, rangs) et les offres de la même machine s'en calculent. */
  carnet?: ContenuCarnetV;
  /** Place de l'article et nombre d'articles comparables (« 1re sur 5 »). */
  rang?: number;
  sur?: number;
  /** Sans `carnet` : les valeurs des autres articles sur la caractéristique du critère, pour la piste. */
  autresMesures?: number[];
  /** Sans `carnet` : rang de chaque caractéristique (« 2e »). */
  rangs?: Record<string, number>;
  /** L'idée est-elle déjà choisie ? Alors pas de Choisir ici (R07). */
  choisi?: boolean;
  onRetour: () => void;
  onVeille: (active: boolean) => void;
  /** R54 : le geste porte la quantité cochée (1 kg) et son prix en francs (62,20), quand la fiche en dit une ; sinon rien (le prix de l'article). */
  onChoisir?: (quantite?: QuantiteChoisie) => void;
  /** Ouvrir une autre offre de la même machine. */
  onOffre?: (articleId: string) => void;
  /** L-9 : poser ou corriger le prix de l'article (centimes, CHF). */
  onPrix?: (centimes: number) => void;
  /** C48-1 : relire la page d'un article lu sans prix (geste du brasseur) ; la lecture dit sa fin en rendant la main. */
  onRelire?: () => void | Promise<void>;
  /** ESCALADER-SUR-MANQUE : relire avec l'IA forte quand un champ manque ou que les deux lectures se contredisent ; absent : pas de bouton. */
  onEscalader?: () => void | Promise<void>;
  /** N2 : « Détacher ma note » : le fait d'une note quitte l'article, la note reste dans le carnet. */
  onDetacherNote?: (messageId: string) => void;
  /** L-16 : l'article suivant ou précédent du carnet (balayer, ou ‹ ›). */
  onSuivant?: () => void;
  onPrecedent?: () => void;
}

/** L-15 : « 2 495,60 CHF », le format de la liste et du carnet (`montant`) ; prix inconnu : null. */
const prixTexte = (centimes: number | undefined, devise: string): string | null => { const m = montant(centimes); return m ? `${m} ${devise}` : null; };
/** L-15 (CA12-M4-8) : le mono est pour ce qui se mesure ; « RAL 9002 », « avec groupe frigorifique » restent en texte. */
const estChiffre = (t: string) => /^[−-]?\d[\d\s\u202f.,']*$/.test(t);
/** L-15 (CA12-M4-9) : « 1.845 » lu sur une page allemande est un millier ; dit par `valeurTexte` (« 1 845 »), jamais « 1,845 ». */
const milliersAPoint = (v: ValeurV) => typeof v.valeur === 'string' && /^\d{1,3}(\.\d{3})+$/.test(v.valeur.trim());

interface Heros { nom: string; libelle: string; texte: string; unite?: string; valeurs: number[] | null; moi: number | null; sens: string; rang?: number; sur: number }

/** Le héros : la 1re place d'un critère qui classe (plus ou moins), sinon la 1re valeur chiffrée ; le prix jamais. */
function herosDe(places: Place[], criteres: CritereV[]): Heros | null {
  const chiffree = (x: Place) => x.nom !== 'prix' && x.valeur !== undefined && (x.sens === 'plus' || x.sens === 'moins');
  const pl = places.find(x => x.critere && chiffree(x)) ?? places.find(chiffree);
  if (!pl) return null;
  const cr = criteres.find(c => c.caracteristique && normaliser(c.caracteristique.nom) === normaliser(pl.nom));
  const suffixe = pl.unite ? ` ${pl.unite}` : '';
  const texte = suffixe && pl.texte.endsWith(suffixe) ? pl.texte.slice(0, -suffixe.length) : pl.texte;
  return { nom: pl.nom, libelle: cr?.texte ?? pl.nom, texte, unite: pl.unite, valeurs: pl.toutes && pl.toutes.length > 1 ? pl.toutes : null, moi: pl.valeur ?? null, sens: pl.sens, rang: pl.rang, sur: pl.toutes?.length ?? pl.sur };
}

/** Les petits mots qu'un titre coupé ne garde pas en dernier (« Ventilation de… » se lit « Ventilation… »). */
const MOTS_VIDES = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'à', 'au', 'aux', 'pour', 'et', 'en', 'sur', 'avec', '—', '-', '·']);

/**
 * Critique 6, n° 33 : le titre du carnet dans le fil d'Ariane, coupé sur un mot (jamais au milieu), sans finir sur un petit mot ni un
 * tiret, suivi de « … » s'il est coupé. `max` en caractères : 22 tient à 390 avec « ‹ Articles · » et la pastille « 2e sur 4 ».
 */
export function filArianeCourt(titre: string, max = 22): string {
  const t = titre.trim();
  if (t.length <= max) return t;
  const garde: string[] = [];
  for (const m of t.split(/\s+/)) {
    if ([...garde, m].join(' ').length > max) break;
    garde.push(m);
  }
  while (garde.length > 1 && MOTS_VIDES.has(garde[garde.length - 1].toLowerCase())) garde.pop();
  return `${garde.length ? garde.join(' ') : t.slice(0, max)}…`;
}

/**
 * T26-2 : une matière qui se pèse ou se compte (houblon, levure, malt, grain, sucre, bouchons, capsules, étiquettes) n'a pas de volume.
 * Le nom de l'article le dit, ou ses valeurs (un taux d'alpha, une année de récolte). Un appareil, une cuve, un fermenteur : volume.
 */
const MATIERE = /houblon|hopfen|\bhops?\b|pellets?|levure|hefe|yeast|\bmalt|malz|\bgrain|getreide|sucre|zucker|bouchon|capsule|kronkorken|[ée]tiquette|etikett|d[ée]sinfectant|sanitizer/i;
const VALEUR_DE_MATIERE = /^(?:alpha|beta|cohumulone|erntejahr|r[ée]colte|hopfentyp|type de houblon)\b/;
const COLONNE_VOLUME = /^(?:volume|volumen|capacit|contenance|fassungsverm|nutzvolumen|nutzinhalt|litres?\b)/;
export function matiereSansVolume(a: Pick<ArticleV, 'nom' | 'valeurs'>): boolean {
  return MATIERE.test(a.nom ?? '') || Object.keys(a.valeurs).some(k => VALEUR_DE_MATIERE.test(normaliser(k)));
}

/**
 * T28-14, C53 (R16) : l'ordre de la grille d'un houblon (acides ensemble, récolte, huiles totales puis chaque huile par part) est celui de
 * `rangDeDecision` (functions/src/lienFusion.ts), le même que la carte et la lecture serveur. Ici seulement : les huiles totales se disent pour 100 g.
 */
const HUILES = /^(?:huiles? totales?|total oils?|gesamtol)\b/;
/** « 0.8ml » ou « 0,8 » + « ml » : les huiles totales d'un houblon se disent pour 100 g (« 0,8 ml/100 g »). */
function huilesDites(v: ValeurV): { texte: string; unite: string } | null {
  const brut = typeof v.valeur === 'string' ? v.valeur : typeof v.valeur === 'number' ? String(v.valeur) : '';
  const m = `${brut} ${v.unite ?? ''}`.trim().match(/^(\d+(?:[.,]\d+)?)\s*(?:ml)?(?:\s*\/\s*100\s*g)?$/i);
  return m && /ml/i.test(`${brut} ${v.unite ?? ''}`) ? { texte: m[1].replace('.', ','), unite: 'ml/100 g' } : null;
}

/** Une case de la grille « Caractéristiques » : son nom, sa valeur dite (ou « non publié »), son rang s'il classe ; `puce` : un doute D450 dit à côté (« ⚠ dispo ? »). */
interface Case { nom: string; texte: string | null; unite?: string; rang?: number; exemple?: boolean; puce?: string }

/** Le pays dit en toutes lettres quand la page donne son code (« FR » → « France ») ; un nom déjà écrit reste tel quel. */
function paysDit(pays: string | undefined): string | undefined {
  if (!pays) return undefined;
  if (!/^[A-Za-z]{2}$/.test(pays.trim())) return pays;
  try { return new Intl.DisplayNames(['fr'], { type: 'region' }).of(pays.trim().toUpperCase()) ?? pays; } catch { return pays; }
}

export function FicheArticle(p: FicheArticleProps) {
  const a = articleHonnete(p.article);
  const [, redessiner] = React.useState(0);
  const k = p.carnet;
  const devise = a.devise ?? 'CHF';
  /* D447 : hors franc, le prix converti ; l'original, « HT » et le port se disent sous l'offre (`detailPrix`) */
  const t0 = prixUnique(a, p.taux);
  const prix = t0?.approx ? `≈${t0.montant} ${t0.devise}${t0.rendu ? ' rendu' : ''}` : prixTexte(a.prixCentimes, devise);
  const veille = !!a.veille?.active;
  const lu = dateCourte(Object.values(a.valeurs).find(v => v.luLe)?.luLe);
  const ajoute = dateCourte(a.ajouteLe);

  /* Les places, d'après le carnet (comparer.ts) ; sinon les props d'avant. */
  const t = k ? calculerTableau(k as never) : null;
  const places = t ? placesDe(t, a.id) : [];
  const enLice = t ? t.lignes.filter(l => l.rang !== null) : [];
  const rangLigne = t?.lignes.find(l => l.articleId === a.id)?.rang ?? undefined;
  const rang = p.rang ?? rangLigne;
  const sur = p.sur ?? (enLice.length || undefined);
  const heros: Heros | null = k ? herosDe(places, k.criteres) : (() => {
    const m = mesureCritere(a, p.critere);
    const carac = p.critere?.caracteristique;
    if (!m || !carac) return null;
    const moi = nombreValeur(a.valeurs[carac.nom]);
    const valeurs = p.autresMesures && p.autresMesures.length > 1 ? p.autresMesures : null;
    const mieux = (x: number, y: number) => (carac.sens === 'moins' ? x < y : x > y);
    const r = valeurs && moi !== null ? 1 + valeurs.filter(x => mieux(x, moi)).length : undefined;
    return { nom: carac.nom, libelle: p.critere!.texte, texte: m.texte, unite: m.unite, valeurs, moi, sens: carac.sens, rang: r, sur: valeurs?.length ?? 1 };
  })();
  const nomHeros = heros ? normaliser(heros.nom) : '';
  const rangDe = (nom: string): number | undefined => {
    if (p.rangs?.[nom]) return p.rangs[nom];
    const pl = places.find(x => normaliser(x.nom) === normaliser(nom));
    /* un rang se dit sur une valeur qui classe (plus ou moins) ; une valeur lue dont le sens est inconnu ne se classe pas */
    return pl?.rang && (pl.sens === 'plus' || pl.sens === 'moins') && (pl.toutes?.length ?? pl.sur) > 1 ? pl.rang : undefined;
  };

  /* La grille (h01-6) : les valeurs de l'article (le héros à part), puis les colonnes du carnet qu'il ne publie pas, puis le délai et
     l'origine ; 4 cases au moins quand il y a de quoi les remplir, jamais une valeur inventée. */
  /* C50-1, C50-3, C50-4 : les valeurs telles que le brasseur les lit (synonymes réunis, une unité, ordre de la décision, le même d'une fiche
     à l'autre) ; la caractéristique du critère d'abord, puis ce qui décide */
  const criteresNoms = (k?.criteres ?? (p.critere ? [p.critere] : [])).flatMap(c => (c.caracteristique ? [c.caracteristique.nom] : []));
  const lues = Object.entries(valeursLuesDe(a as never) as Record<string, ValeurV>);
  /* C53 (R16) : par GROUPES (acides, récolte, huiles par part, puis énergie, dimensions…) : l'ordre est celui de `rangDeDecision`, rien d'autre */
  const ordonnees = trierParDecision(lues.map(e => ({ nom: e[0], e })), criteresNoms, undefined, x => x.e[1].valeur, x => x.e[1].unite).map(x => x.e);
  const cases: Case[] = (ordonnees.filter(([nom]) => !(heros && memeCaracteristique(heros.nom, nom)) && normaliser(nom) !== nomHeros).map(([nom, v]: [string, ValeurV]) => {
    const huiles = HUILES.test(normaliser(nom)) ? huilesDites(v) : null;
    if (huiles) return { nom, texte: huiles.texte, unite: huiles.unite, rang: rangDe(nom), exemple: v.origine === 'exemple' };
    const n = typeof v.valeur === 'string' && !milliersAPoint(v) ? nombreValeur(v) : null;
    return { nom, texte: texteSelonNom(nom, n !== null ? nombreTexte(n) : valeurTexte(v), v.valeur), ...(v.unite ? { unite: v.unite } : {}), rang: rangDe(nom), exemple: v.origine === 'exemple' };
  }));
  /* T25-7 : les colonnes du carnet que l'article ne publie pas se disent ensemble, dans UNE phrase sous la grille (« Non publié par le
     vendeur : Malzmenge · Max. Malzmenge · Stromanschluss »), jamais trois cases « non publié » qui font croire à une valeur. L'inconnu
     reste dit (jamais 0), le critère reste nommé. */
  const dits = new Set([nomHeros, ...cases.map(c => normaliser(c.nom))]);
  const manque: string[] = [];
  const sansVolume = matiereSansVolume(a);
  for (const col of t?.colonnes ?? []) {
    /* C50-1 : « non publié » n'est jamais dit d'une valeur lue, sous un synonyme, une plage ou une autre unité (la cellule du tableau fait foi) */
    if (normaliser(col.nom) === 'prix' || dits.has(normaliser(col.nom)) || t?.lignes.find(l => l.articleId === a.id)?.cellules[col.nom] !== undefined
      || cases.some(c => memeCaracteristique(c.nom, col.nom)) || (heros && memeCaracteristique(heros.nom, col.nom))) continue;
    /* T26-2 : « Non publié : Volume » n'a pas de sens pour un houblon, une levure, un malt : la colonne ne se dit que pour un appareil. */
    if (sansVolume && COLONNE_VOLUME.test(normaliser(col.nom))) continue;
    manque.push(col.nom);
    dits.add(normaliser(col.nom));
  }
  if (cases.length < 4 && dispoDe(a)) cases.push({ nom: 'Disponibilité', texte: dispoDe(a)! });
  if (cases.length < 4 && a.pays) cases.push({ nom: 'Origine', texte: a.pays });

  /* D451 (maquettes2/v01, fiche) : un houblon (une matière qu'on pèse, dont la page donne l'alpha) s'ouvre sur son alpha en gros, ses arômes en
     couleur, le tableau « je prends · prix · CHF/kg rendu », puis récolte, forme, origine et dispo (avec son doute D450). Ce que la page dit d'autre
     reste dans la grille, après. Aucune règle ne lit un nom de produit : la matière et l'alpha lu décident. */
  const regle = a as unknown as ArticleRegle;
  const matiere = estMatierePesee(a as never);
  const alpha = matiere ? alphaDe(regle) : null;
  const houblon = alpha !== null;
  const [pour] = usePour(p.titreCarnet);
  const conds = matiere ? conditionnementsDe(regle, p.taux) : [];
  const ligneChoisie = ligneDuPour(conds, regle, pour, p.taux);
  /* R100 (c75) : les sachets que « Poids » dit sans prix (250 g, 500 g) : la table les montre « prix à relire », Relire se propose ; « Choisir » porte le sachet chiffré, jamais « 1 kg » */
  const sansPrix = matiere ? sachetsSansPrix(regle) : [];
  const choix = quantiteDuChoix(regle, pour, p.taux);
  /* R54 (C66-4) : un houblon vendu en plusieurs conditionnements dit le prix du conditionnement COCHÉ (1 kg : 62,20), jamais celui d'un autre (le sachet de 100 g : 6,70) : le bloc Offre, le bouton Choisir et « Part dans À venir » disent le même */
  const prixCoche: string | null = (conds.length > 1 || sansPrix.length > 0) && ligneChoisie && !ligneChoisie.auGramme
    ? (ligneChoisie.chfKg?.estime ? `≈${montant(centimesRendus(ligneChoisie.chfKg.chf, ligneChoisie.kg))} CHF rendu` : prixTexte(ligneChoisie.centimes, ligneChoisie.devise))
    : null;
  const detailCoche: string | null = prixCoche && ligneChoisie
    ? [ligneChoisie.libelle, ligneChoisie.chfKg ? `${ligneChoisie.chfKg.estime ? '≈' : ''}${texteChfKg({ ...ligneChoisie.chfKg, estime: false })} CHF/kg` : null, a.taxe ? mentionTaxe(a.taxe).trim() : null, ligneChoisie.chfKg?.estime && !noteImport(regle, pour, p.taux) ? 'TVA d’import comptée' : null].filter(Boolean).join(' · ')
    : null;
  /* ce que « Choisir » emporte : le conditionnement coché et son prix en francs (le même chiffre que le bloc Offre) */
  const quantiteChoisie: QuantiteChoisie | undefined = prixCoche && ligneChoisie
    ? { kg: ligneChoisie.kg, libelle: ligneChoisie.libelle, centimes: ligneChoisie.devise === 'CHF' ? ligneChoisie.centimes : ligneChoisie.chfKg ? centimesRendus(ligneChoisie.chfKg.chf, ligneChoisie.kg) : 0, ...(ligneChoisie.devise !== 'CHF' && ligneChoisie.chfKg?.estime ? { estime: true } : {}) }
    : undefined;
  /* R104 (c77) : une valeur que le carnet montre (« Arômes lus sur les pages ») est la même sur la fiche de chaque article de la variété : un article dont la page ne dit pas les arômes
     reprend ceux que le carnet dit des autres (jamais « Non publié » quand une autre surface la connaît) ; les arômes d'une fiche se disent une fois (puces), pas aussi dans la grille */
  const aromesLus = houblon ? aromesDe(regle) : [];
  const aromes = aromesLus.length ? aromesLus : houblon && p.carnet ? aromesCommuns(p.carnet.articles as unknown as ArticleRegle[]) : [];
  const estArome = (nom: string) => /^(?:aromes?|saveurs?|aroma|aromen|geschmack)\b/.test(normaliser(nom));
  const recolte = houblon ? recolteDe(regle) : null;
  const puceDoute = libelleDoute(regle.doute);
  /* le doute D450 sur la dispo se dit à côté de la disponibilité (« ⚠ dispo ? ») ; la grille reste celle de la page, dans l'ordre de décision */
  /* R94 (C74B) : l'α d'un houblon se dit UNE fois, dans la tête de fiche ; la grille ne le redit pas (« Alpha 13,6 % » sous « α 13,6 % ») */
  /* c74c (D-25.11 sa plainte : valeur dite une fois) : sur un houblon, « Alpha » SORT de la grille Caractéristiques, la tête de fiche le dit (« α 13,6 % », « α 10–15 % ») */
  const sansAlpha = houblon ? cases.filter(c => !memeCaracteristique(c.nom, 'Alpha') && !/^alpha\b/.test(normaliser(c.nom))) : cases;
  const sansArome = houblon && aromes.length ? sansAlpha.filter(c => !estArome(c.nom)) : sansAlpha;
  const manquesDits = houblon && aromes.length ? manque.filter(n => !estArome(n)) : manque;
  const casesVues: Case[] = puceDoute ? sansArome.map(c => (c.nom === 'Disponibilité' ? { ...c, puce: puceDoute } : c)) : sansArome;

  /* Les offres de la même machine : même nom (normalisé), dans le carnet ; la moins chère d'abord. */
  const offres = k && a.nom
    ? k.articles.filter(x => x.nom && normaliser(x.nom) === normaliser(a.nom!)).map(articleHonnete).sort((x, y) => (x.prixCentimes ?? Infinity) - (y.prixCentimes ?? Infinity))
    : [a];
  const qui = a.vendeur ?? a.domaine;
  const [poserPrix, setPoserPrix] = React.useState(false);
  /* houblon : le tableau « je prends » dit déjà l'offre ; le bloc Offre ne reste que s'il porte un geste ou plusieurs vendeurs */
  /* D446 : toutes les photos de la page, une à la fois (‹ ›), la première d'abord ; une photo cassée est écartée */
  const photos = (a.photos?.length ? a.photos : a.photo ? [a.photo] : []).filter(u => !photoCassee(u));
  const [iPhoto, setIPhoto] = React.useState(0);
  const iP = Math.min(iPhoto, Math.max(photos.length - 1, 0));
  const photoCourante = photos[iP];
  const photoNonLue = !photoCourante && !!a.url && a.lecture === 'lue';
  /* L-16 (CA12-M4-18) : balayer à gauche, l'article suivant ; à droite, le précédent (un geste franc, surtout horizontal) */
  const depart = React.useRef<{ x: number; y: number } | null>(null);
  const balayer = {
    onTouchStart: (e: React.TouchEvent) => { const t = e.touches[0]; depart.current = t ? { x: t.clientX, y: t.clientY } : null; },
    onTouchEnd: (e: React.TouchEvent) => {
      const d = depart.current, t = e.changedTouches[0];
      depart.current = null;
      if (!d || !t) return;
      const dx = t.clientX - d.x, dy = t.clientY - d.y;
      if (Math.abs(dx) < 64 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
      (dx < 0 ? p.onSuivant : p.onPrecedent)?.();
    }
  };

  /* R69 (C67B-9) : une fiche s'ouvre EN HAUT (nom, α, « je prends »), y compris l'article voisin atteint par › depuis le bas de la précédente (la page gardait le défilement d'avant) */
  const haut = React.useRef<HTMLElement>(null);
  React.useEffect(() => { haut.current?.scrollIntoView?.({ block: 'start' }); }, []);
  return (
    <article ref={haut} className="cn-page cn-fiche" {...(p.onSuivant || p.onPrecedent ? balayer : {})}>
      <div className="cn-tete">
        {/* critique 6, n° 33 (h01-6 « ‹ Articles · Embouteillage ») : le fil d'Ariane tient sur une ligne à 390, le titre coupé sur un
            mot (`filArianeCourt`) ; à 1280, le titre entier. Le nom complet reste lu par le lecteur d'écran. */}
        <button type="button" className="cn-retour cn-fil-ariane" onClick={p.onRetour} aria-label={`Articles · ${p.titreCarnet}`}>
          <ChevronLeft size={20} aria-hidden />
          <span className="cn-fil-court" aria-hidden>Articles · <Insec t={filArianeCourt(p.titreCarnet)} /></span>
          <span className="cn-fil-long" aria-hidden>Articles · <Insec t={p.titreCarnet} /></span>
        </button>
        <span className="cn-sp" />
        {rang !== undefined && sur ? <span className="cn-pastille cn-pastille-vert">{rangTexte(rang)} sur {sur}</span> : null}
        {p.onPrecedent && <button type="button" className="cn-ico cn-fiche-nav" aria-label="Article précédent" onClick={p.onPrecedent}><ChevronLeft size={20} aria-hidden /></button>}
        {p.onSuivant && <button type="button" className="cn-ico cn-fiche-nav" aria-label="Article suivant" onClick={p.onSuivant}><ChevronRight size={20} aria-hidden /></button>}
      </div>
      {/* n° 8 : le cadre photo est toujours là (h01-6) ; sans photo, l'objet dessiné en grand. Critique 6, n° 20 (D-78) : la photo lue
          de la page ; celle du banc est simulée et le dit (« exemple »). */}
      {houblon ? null : photoCourante ? (
        <figure className="cn-fiche-photo" data-cadre="photo">
          <img key={photoCourante} onError={() => { marquerCassee(photoCourante); redessiner(n => n + 1); }} src={photoCourante} alt={`photo ${photos.length > 1 ? `${iP + 1} sur ${photos.length} ` : ''}de la page collée : ${a.nom ?? a.domaine ?? 'article'}`} />
          <figcaption><Camera size={16} aria-hidden /> photo{photos.length > 1 ? <> <span className="cn-mono">{iP + 1}/{photos.length}</span></> : null} de la page collée{estExemple(a) ? <> <Provenance origine="exemple" /></> : null}</figcaption>
          {photos.length > 1 && (
            <>
              <button type="button" className="cn-ico cn-fiche-photo-nav cn-fiche-photo-prec" aria-label="Photo précédente" disabled={iP === 0} onClick={() => setIPhoto(iP - 1)}><ChevronLeft size={20} aria-hidden /></button>
              <button type="button" className="cn-ico cn-fiche-photo-nav cn-fiche-photo-suiv" aria-label="Photo suivante" disabled={iP === photos.length - 1} onClick={() => setIPhoto(iP + 1)}><ChevronRight size={20} aria-hidden /></button>
            </>
          )}
        </figure>
      ) : (
        <figure className="cn-fiche-photo cn-fiche-picto" data-cadre="picto" {...(photoNonLue ? {} : { 'aria-hidden': true })}>
          <span aria-hidden><VignetteObjet mots={[a.nom, p.facon?.nom, p.titreCarnet]} classe="cn-vignette-fiche" taille={132} /></span>
          {/* T26-3 : la page est lue mais sa photo ne l'est pas (page bloquée lue par Google, aucune image publiée) : la fiche le dit. */}
          {photoNonLue && <figcaption className="cn-fiche-photo-non-lue"><Camera size={16} aria-hidden /> photo non lue</figcaption>}
        </figure>
      )}
      {houblon ? (
        /* B10 : « la photo en tout petit à la place de l'icône » : une tuile à côté du nom, la photo de la page quand il y en a une, sinon l'objet dessiné */
        <div className="cn-fiche-entete">
          <span className="cn-fiche-tuile" data-cadre={photoCourante ? 'photo' : 'picto'}>
            {photoCourante
              ? <img key={photoCourante} onError={() => { marquerCassee(photoCourante); redessiner(n => n + 1); }} src={photoCourante} alt={`photo de la page collée : ${a.nom ?? a.domaine ?? 'article'}`} />
              : <span aria-hidden><VignetteObjet mots={[a.nom, p.facon?.nom, p.titreCarnet]} classe="cn-vignette" taille={44} /></span>}
          </span>
          <h2 className="cn-titre">{liesParNbsp(a.nom ?? a.domaine ?? 'Lien sans aperçu')}</h2>
        </div>
      ) : <h2 className="cn-titre">{liesParNbsp(a.nom ?? a.domaine ?? 'Lien sans aperçu')}</h2>}
      {/* NOTE-EXPLOITEE (N2) : ce que SES notes disent de l'article, à côté de ce que la page dit (« en stock »), jamais à sa place */}
      {houblon ? null : <FaitsNoteFiche faits={a.notesSur} onDetacher={p.onDetacherNote} />}
      {houblon && (
        <>
          <p className="cn-fiche-qui cn-mut">
            <span className="cn-sp">{[a.vendeur ?? a.domaine, paysDit(a.pays), a.taxe ? `${a.taxe.toUpperCase()}${a.taxe === 'ttc' && a.pays && /^[A-Za-z]{2}$/.test(a.pays.trim()) ? ` ${a.pays.trim().toUpperCase()}` : ''}` : null].filter(Boolean).join(' · ')}</span>
          </p>
          <p className="cn-fiche-alpha"><span className="cn-mut">α{recolte ? ` lot ${recolte}` : ''}</span> <span className="cn-mono cn-fiche-alpha-val">{alpha} %</span></p>
          {aromes.length > 0 && (
            <p className="cn-aromes-liste" aria-label={aromesLus.length ? 'Arômes lus sur la page' : 'Arômes de la variété, lus sur la page d’un autre article'}><span className="cn-mut cn-aromes-nom">arômes{aromesLus.length ? '' : ' · variété'}</span> {aromes.map(m => {
              const j = jetonArome(m);
              return <span key={m} className="cn-arome" style={j ? { background: j.fond, color: j.texte } : undefined}>{m}</span>;
            })}</p>
          )}
          {(conds.length > 1 || sansPrix.length > 0) && (
            <section className="cn-bloc cn-prend" aria-label="Je prends">
              <div className="cn-prend-ligne cn-prend-tete cn-mut"><span>je prends</span><span>prix</span><span>CHF/kg rendu</span></div>
              {conds.map(l => {
                const on = l === ligneChoisie;
                return (
                  <div key={l.kg} className={`cn-prend-ligne${on ? ' cn-prend-on' : ''}`} aria-current={on || undefined}>
                    <span>{l.libelle}{on ? <> <Check size={16} aria-hidden /></> : null}</span>
                    <span className="cn-mono">{textePrixConditionnement(l)}</span>
                    <span className="cn-mono">{on && detailCoche && !a.prixUnite && l.chfKg ? <span className="cn-mut cn-mono" title="Le prix au kilo se lit dans l'offre, juste dessous (une valeur, une fois)">offre ↓</span> : l.chfKg ? <>{l.chfKg.estime ? '≈ ' : ''}{texteChfKg({ ...l.chfKg, estime: false })}</> : <span className="cn-inconnu" aria-label="inconnu">?</span>}{' '}</span>
                  </div>
                );
              })}
              {/* R100 (c75) : les autres sachets de « Poids », sans prix lu : dits « prix à relire » (jamais 0, jamais un prix deviné) ; Relire lit la page, par son geste */}
              {sansPrix.map(l => (
                <div key={`sp-${l.kg}`} className="cn-prend-ligne">
                  <span>{l.libelle}</span>
                  <span className="cn-mut">prix à relire</span>
                  <span><span className="cn-inconnu" aria-label="inconnu">?</span>{' '}</span>
                </div>
              ))}
              {sansPrix.length > 0 && p.onRelire && a.url && <BoutonRelire onRelire={p.onRelire} classe="cn-relire-prix" />}
              {noteImport(regle, pour, p.taux) && <p className="cn-mut cn-prend-note">{noteImport(regle, pour, p.taux)}</p>}
            </section>
          )}
          <FaitsNoteFiche faits={a.notesSur} onDetacher={p.onDetacherNote} />
        </>
      )}
      {(p.facon || ajoute) && (
        <p className="cn-mut">
          {p.facon && <><b className="cn-encre">façon {p.facon.nom.toLowerCase()}</b>{p.facon.raison ? ` : ${p.facon.raison}` : ''}</>}
          {p.facon && ajoute ? ' · ' : ''}{ajoute ? `lien collé le ${ajoute}` : ''}
        </p>
      )}
      {heros && !(houblon && /^alpha\b/i.test(heros.nom)) && (
        <div className="cn-mesure cn-heros">
          <div className="cn-heros-val">
            <span className="cn-mut"><Insec t={heros.libelle} /></span>
            <span className="cn-mesure-val cn-nowrap"><span className="cn-mono">{heros.texte}</span>{heros.unite ? <small> {heros.unite}</small> : null}</span>
            {heros.rang && heros.rang > 1 && heros.sur > 1 ? <span className="cn-mut cn-heros-place">{rangTexte(heros.rang)} sur {heros.sur} · <Insec t={heros.libelle} /></span> : null}
          </div>
          {heros.valeurs && heros.moi !== null ? <Piste valeurs={heros.valeurs} moi={heros.moi} sens={heros.sens} unite={heros.unite} /> : null}
        </div>
      )}
      {(prix || qui || p.onPrix) && (
        <>
          <h3 className="cn-sous">{offres.length > 1 ? <>{offres.length} offres <span className="cn-mut">même machine</span></> : 'Offre'}</h3>
          <div className="cn-offres">
            {offres.map(o => {
              const moi = o.id === a.id;
              const t2 = prixUnique(o, p.taux);
              const p2 = moi && prixCoche ? prixCoche : t2?.approx ? `≈${t2.montant} ${t2.devise}${t2.rendu ? ' rendu' : ''}` :prixTexte(o.prixCentimes, o.devise ?? 'CHF');
              /* R49 : un prix donné à l'unité garde sa ligne (« 0,1044 CHF/g · 80,00 CHF/kg dès 1 kg ») */
              const d2 = moi && detailCoche && !a.prixUnite ? detailCoche : detailPrix(o, p.taux);
              const corps = (
                <>
                  {offres.length > 1 && <span className={`cn-radio${moi ? ' cn-radio-on' : ''}`} aria-hidden />}
                  <span className="cn-sp">
                    <b>{[o.vendeur, o.pays].filter(Boolean).join(' · ') || o.domaine}</b>
                    {/* C52-3 : une vraie espace entre le vendeur, la disponibilité et le prix (jamais « ggmgastro.com2 987,51 CHF ») : le texte seul les sépare, pas le CSS */}
                    {dispoDe(o) && <>{' '}{/* C50-9 : « en stock » ne se coupe jamais en deux (une disponibilité courte tient sur une ligne) */}<span className={`cn-mut${dispoDe(o)!.length <= 16 ? ' cn-nowrap' : ''}`}>{dispoDe(o)}</span></>}
                  </span>
                  {' '}
                  {p2 && <PrixMono texte={p2} />}
                  {!p2 && moi && <span className="cn-mut cn-nowrap">prix ?</span>}
                </>
              );
              return (
                <div key={o.id} className={`cn-offre${moi ? ' cn-offre-moi' : ''}${d2 ? ' cn-offre-avec-detail' : ''}`}>
                  {!moi && p.onOffre ? <button type="button" className="cn-offre-corps" onClick={() => p.onOffre!(o.id)}>{corps}</button> : <span className="cn-offre-corps">{corps}</span>}
                  {/* C50-9 : les gestes de l'offre (Poser le prix, Relire, Ouvrir) vont ensemble, alignés à droite ; la ligne passe à la ligne au lieu de tasser quatre colonnes */}
                  <span className="cn-offre-gestes">
                  {moi && p.onPrix && !poserPrix && (p2
                    ? <button type="button" className="cn-ico" aria-label="Modifier le prix" onClick={() => setPoserPrix(true)}><Pencil size={16} aria-hidden /></button>
                    : <button type="button" className="cn-lien cn-poser-prix-ouvrir" onClick={() => setPoserPrix(true)}>Poser le prix</button>)}
                  {/* C48-1 : un article lu sans prix propose de relire sa page (le geste est le sien, jamais automatique) */}
                  {moi && !p2 && !poserPrix && p.onRelire && a.url && a.lecture === 'lue' && <BoutonRelire onRelire={p.onRelire} classe="cn-relire-prix" />}
                  {moi && !poserPrix && p.onEscalader && articleAEscalader(a).length > 0 && <BoutonEscalader onEscalader={p.onEscalader} raison={raisonEscalade(a)} classe="cn-escalader-prix" />}
                  {o.url && <a className="cn-lien" href={o.url} target="_blank" rel="noreferrer noopener">Ouvrir <ExternalLink size={16} aria-hidden /></a>}
                  </span>
                  {d2 && <span className="cn-mut cn-offre-detail">{d2}</span>}
                </div>
              );
            })}
          </div>
          {poserPrix && p.onPrix && <PoserPrix centimes={a.prixCentimes} onPoser={c => { p.onPrix!(c); setPoserPrix(false); }} onFermer={() => setPoserPrix(false)} />}
        </>
      )}
      {(casesVues.length > 0 || manquesDits.length > 0) && (
        <>
          <h3 className="cn-sous">Caractéristiques {lu && <span className="cn-mut">lues sur la fiche du vendeur, {lu}</span>}</h3>
          <dl className="cn-carac" aria-label="Caractéristiques">
            {casesVues.map(c => (
              <div key={c.nom}>
                <dt>{c.nom}</dt>
                <dd>{c.texte === null ? <span className="cn-mut">non publié</span> : <>{c.unite ? <span className="cn-nowrap"><span className={estChiffre(c.texte) ? 'cn-mono' : undefined}>{c.texte}</span><span> {c.unite}</span></span> : <span className={estChiffre(c.texte) ? 'cn-mono' : undefined}><Insec t={c.texte} /></span>}</>}
                  {c.rang ? <span className="cn-vert cn-carac-rang"> {rangTexte(c.rang)}</span> : null}
                  {c.exemple && <> <Provenance origine="exemple" /></>}
                  {c.puce && <> <span className="cn-tag-att"><TriangleAlert size={14} aria-hidden /> {c.puce}</span></>}
                </dd>
              </div>
            ))}
          </dl>
          {manquesDits.length > 0 && <p className="cn-mut cn-carac-manque">Non publié par le vendeur : {manquesDits.join(' · ')}</p>}
        </>
      )}
      <div className="cn-veille-bloc">
        <div className="cn-veille-ligne">
          <Eye size={18} aria-hidden />
          {/* h01-6 : le réglage et son état sur la même ligne (« tous les 3 jours · revu le 13 nov. ») ; sans relève, « demandée · pas
              encore relevée » (R31) */}
          <span className="cn-sp cn-veille-tx">
            <span>Veille du prix, tous les 3 jours</span>
            {veille && !a.veille?.releveLe && <span className="cn-mut cn-veille-etat">demandée · pas encore relevée</span>}
          </span>
          <Bascule active={veille} onChange={p.onVeille} etiquette="Veille du prix, tous les 3 jours" />
        </div>
      </div>
      {!p.choisi && p.onChoisir && (
        <>
          <button type="button" className="cn-action cn-action-vert cn-large" onClick={() => p.onChoisir!(quantiteChoisie && quantiteChoisie.centimes > 0 ? quantiteChoisie : undefined)}><Check size={18} aria-hidden /> Choisir{a.vendeur ? ` · ${a.vendeur}` : ''}{ligneChoisie && a.vendeur ? `, ${choix.libelle}` : ''}</button>
          <p className="cn-mut">Part dans À venir : {[a.nom, a.vendeur].filter(Boolean).join(', ')}{prixCoche ?? prix ? <>, <PrixMono texte={(prixCoche ?? prix)!} /></> : null}{dispoDe(a) ? `, ${dispoDe(a)}` : ''}, avec le pourquoi.</p>
        </>
      )}
    </article>
  );
}

/**
 * L-9 : le prix de l'article, tapé (« 2495.60 », « 2 495,60 », « 2'495 ») ; jamais type="number" (saisie-mobile), clavier décimal ;
 * illisible : dit, la valeur d'avant reste.
 */
function PoserPrix({ centimes, onPoser, onFermer }: { centimes?: number; onPoser: (centimes: number) => void; onFermer: () => void }) {
  const [texte, setTexte] = React.useState(montant(centimes) ?? '');
  const [refus, setRefus] = React.useState(false);
  const valider = () => { const c = parsePrix(texte); if (c === null) { setRefus(true); return; } onPoser(c); };
  return (
    <form className="cn-poser-prix" onSubmit={e => { e.preventDefault(); valider(); }}>
      <input type="text" inputMode="decimal" enterKeyHint="done" autoComplete="off" autoFocus className="cn-poser-prix-champ" aria-label="Prix de l’article, CHF"
        aria-invalid={refus || undefined} value={texte} onChange={e => { setTexte(e.target.value); setRefus(false); }} />
      <span className="cn-mut">CHF</span>
      <button type="submit" className="cn-action">OK</button>
      <button type="button" className="cn-second" onClick={onFermer}>Annuler</button>
      {refus && <p role="alert" className="cn-poser-prix-refus">« {texte.trim()} » : ce n’est pas un prix.</p>}
    </form>
  );
}

/** « 1 450 CHF » : le nombre en chiffres tabulaires (l'espace de groupe s'y voit, n° 37), la devise en clair. */
function PrixMono({ texte }: { texte: string }) {
  const i = texte.lastIndexOf(' ');
  return <span className="cn-nowrap cn-prix-mono"><span className="cn-mono cn-prix">{texte.slice(0, i)}</span> <span className="cn-mut">{texte.slice(i + 1)}</span></span>;
}

/**
 * La réglette (h01-6 ; n° 36) : un rond par article en lice, le sien plein. C54-3 (R22) : le MÊME SENS que la feuille Articles, partout : le petit à
 * gauche, le grand à droite (fini « 242 la plus haute » à gauche sur la fiche et à droite sur la feuille). Bornée des deux côtés : la plus basse
 * valeur connue à gauche, la plus haute à droite ; « la plus haute des 4 » (ou « la plus basse ») dit celle qui est la meilleure pour ce critère.
 */
function Piste({ valeurs, moi, sens, unite }: { valeurs: number[]; moi: number; sens: string; unite?: string }) {
  const tri = [...valeurs].sort((x, y) => x - y);
  const min = tri[0], max = tri[tri.length - 1];
  const pos = (v: number) => (max === min ? 0 : ((v - min) / (max - min)) * 100);
  const meilleure = sens === 'plus' ? max : min;
  const pire = sens === 'plus' ? min : max;
  const dit = `la plus ${sens === 'moins' ? 'basse' : 'haute'} des ${valeurs.length}`;
  /* C55-3 (R25) : chaque borne dit son unité, une seule fois (« 2,6 m³ », « 6 m³ la plus haute des 2 ») */
  const avecUnite = (v: number) => (unite ? `${nombreTexte(v)} ${unite}` : nombreTexte(v));
  const borne = (v: number) => (v === meilleure
    ? <span className="cn-piste-borne"><span className="cn-mono"><Insec t={avecUnite(v)} /></span> <span className="cn-mut cn-nowrap">{dit}</span></span>
    : <span className="cn-mono cn-mut cn-piste-borne"><Insec t={avecUnite(v)} /></span>);
  return (
    <div className="cn-piste" role="img" aria-label={`${avecUnite(meilleure)}, ${dit} ; ${avecUnite(pire)}, la moins bonne`}>
      <span className="cn-piste-trait" />
      {tri.map((v, i) => <span key={i} className={`cn-piste-rond${v === moi ? ' cn-piste-moi' : ''}`} style={{ left: `${pos(v)}%` }} />)}
      <span className="cn-piste-legende">
        {borne(min)}
        {borne(max)}
      </span>
    </div>
  );
}
