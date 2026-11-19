/**
 * Carnet d'idées — le conteneur (lot D). Il tient le magasin, le rangement (le fil : un champ, l'IA met en forme et range), la navigation
 * interne (liste ↔ carnet ↔ article ↔ comparer ↔ choisir), Annuler et l'état du réseau. Les vues (lot C) sont contrôlées par props :
 * elles ne lisent aucun magasin. Les calculs viennent du lot A (`comparer.ts`, `operations.ts`, `rattacher.ts`, `doublons.ts`) ; l'IA du
 * lot B (`rangement.ts`, `config/carnetIA.ts`). Rien n'est écrit hors de `creativeItems`, sauf le plan d'À venir créé par « Envoyer dans
 * À venir » (le service des plans existant, une fois : clé idempotente).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FinanceTransaction, FinancialPayment, FinancialPlan } from '../../domain/finance/types';
import { FinanceService } from '../../services/financeService';
import { StorageService } from '../../services/storage';
import { useStorageValue } from '../../hooks/useLiveData';
import { magasinFirestore, type MagasinCarnets } from '../../services/carnetsStore';
import { estLienSeul, lireCarnets, lireMessages, nomArticle, nouvelIdCarnet, titreDePhrase, type CarnetDoc } from '../../domain/carnets/modele';
import {
  accepterProposition, archiverCarnet, basculerVeille, changerGenre, changerSorte, choisir, creerCarnet, deplacer, deplacerArticles, detacherPlan, fusionnerNotes, garderAPart,
  etatSortie, liensDe, liensQuiRetiennent, modifierNote, noteEnCritere, planDepuisChoix, poserSortie, ranger, remplacerRangement, renommer, supprimerCarnet, supprimerNote,
  type Destination, type EcritureCarnet, type Journal, type LigneARanger, type Resultat
} from '../../domain/carnets/operations';
import { consequenceApercu, critereQuiTranche, passe, placesDe, tableau as tableauDe } from '../../domain/carnets/comparer';
import { analyserLigne, analyserTexte, decouper, genreLocal, jetons, normaliser, objetDe, PUCES_VA_DANS, vaDansDe, type LigneLocale, type RubriqueVaDans } from '../../domain/carnets/analyseLocale';
import { aucunCarnetNEnParle, carnetProche, rattacher } from '../../domain/carnets/rattacher';
import { doublonsDe, notesEnDouble } from '../../domain/carnets/doublons';
import type { CarnetPourIA, LigneCarnet } from '../../domain/carnets/ia';
import { aidesCourantes, comportementSimule, modeCarnet, type AidesCarnet, type ModeCarnetIA } from '../../config/carnetIA';
import { appelsSimules, creerRangement, planVrac, prixEcrits, retourDuRangement, versLignesAnnoncees, type AppelsIA, type EtatRangement, type PlanVrac, type Rangement as Envoi } from './rangement';
import { ListeCarnets } from './ListeCarnets';
import { CarnetOuvert, type LienV, type RangeeV } from './CarnetOuvert';
import { ChampCarnet } from './ChampCarnet';
import { CadreArrivee, type CadreV } from './CadreArrivee';
import { Bandeau, origineDuTitre, type BandeauV, type TitreDe } from './Bandeau';
import { NoteEnVrac, type LigneVracV } from './NoteEnVrac';
import { FicheArticle } from './FicheArticle';
import { Comparer, nonLusDe } from './Comparer';
import { Choisir } from './Choisir';
import { SupprimerCarnet } from './SupprimerCarnet';
import { FeuilleNote } from './FeuilleNote';
import { PictoObjet, pictoDe } from './pictos';
import { RenommerCarnet, titreProposeDe } from './RenommerCarnet';
import { dateCourte, EtatIA, montant, type ArticleV, type CarnetV, type GenreNote } from './EtatIA';
import { reduirePhoto } from './photo';
import './carnets.css';
import './carnets-fil.css';

export interface FinancesCarnet { plans: FinancialPlan[]; transactions: FinanceTransaction[]; payments: FinancialPayment[] }

export interface CarnetsVueProps {
  className?: string;
  /** Le magasin ; défaut : Firestore (l'app). Le banc et les tests passent le magasin mémoire. */
  magasin?: MagasinCarnets;
  /** Plans, transactions, paiements (liens, Suppression v2) ; défaut : ceux de l'app. */
  finances?: FinancesCarnet;
  /** Écrit le plan d'À venir ; défaut : `FinanceService.saveUpgrade`. */
  ecrirePlan?: (plan: FinancialPlan) => Promise<void> | void;
  mode?: ModeCarnetIA;
  appels?: AppelsIA;
  aides?: AidesCarnet;
  /** Force hors ligne (banc `&hors-ligne=1`) ; sinon `navigator.onLine`. */
  horsLigne?: boolean;
  /** Ouvrir ce carnet (« Ouvrir le carnet » d'À venir, icône du calendrier) ; une idée archivée se rouvre aussi. */
  ouvrir?: { id: string; at: number } | null;
  /** + « Nouvelle idée » : le champ du bas prend le focus. */
  focusChamp?: number | null;
  onVoirAVenir?: () => void;
  /** « Voir » d'un carnet dont le plan est payé (critique 7, n° 5) : Réalisés ; sans lui, À venir. */
  onVoirRealises?: () => void;
  onMessage?: (texte: string) => void;
  maintenant?: () => Date;
  /** Banc seulement (`&texte=…`) : le champ arrive rempli, pour atteindre un état « pendant » par une adresse (D-131). */
  texteInitial?: string;
}

type Vue =
  | { sorte: 'liste' }
  | { sorte: 'carnet'; id: string }
  | { sorte: 'article'; id: string; articleId: string }
  | { sorte: 'comparer'; id: string }
  /* critique 6, n° 4 : « Retenir la hotte » ouvre Choisir sur cette façon */
  | { sorte: 'choisir'; id: string; faconId?: string }
  | { sorte: 'renommer'; id: string }
  | { sorte: 'supprimer'; id: string };

/**
 * Un retour « après » affiché. `id` : sa clé stable (P8, tour 3) ; le bandeau est monté sous cette clé, jamais sous l'index ni le
 * texte. La réponse de l'IA qui complète un retour déjà affiché garde son `id` et son bandeau : seul `inverse` (ce qu'Annuler défait)
 * change, donc le bouton sous le doigt reste le même.
 */
interface Retour {
  id: number; bandeau: BandeauV; inverse: EcritureCarnet[]; messageId?: string; carnetId?: string; consequence?: string;
  /** P22, P36 : l'IA n'a pas rangé (éteinte, hors ligne, en échec) : l'avis le dit dans le bandeau même, une seule ligne d'état. */
  avis?: AvisIA;
  /** Ce qui a été rangé, et où (« Notes : « … » · dans Frigo ») : dit avec l'avis, puisque l'IA n'a pas mis en forme. */
  detail?: string;
}
type AvisIA = { sorte: 'eteint' | 'hors-ligne' | 'echec'; texte: string };
/**
 * Critique 5, n° 43 : la formule vraie selon le code. Rien ne se rerange au retour du réseau (MISSION, § IA, « Déroulé d'un envoi » :
 * aucun rerangement automatique) : l'avis le dit sans ambiguïté, au lieu de « rien ne bougera », qu'on lisait « l'IA rangera-t-elle ? ».
 */
export const AVIS_IA: Record<AvisIA['sorte'], string> = {
  eteint: 'IA éteinte : rangé sur l’appareil, tel quel',
  /* critique 6, n° 24 : court ; au retour du réseau, « Ranger maintenant » d'un toucher (`repriseNode`) */
  'hors-ligne': 'Hors ligne : rangé sur l’appareil, tel quel',
  echec: 'L’IA n’a pas répondu : rangé sur l’appareil, tel quel ; rien n’est perdu'
};
/**
 * P23 (D-35) : un critère que l'IA propose sans le ranger (`propose`, contrat du lot A : gardé sur le message, `propositions`), le plus
 * souvent la caractéristique sur laquelle comparer. Il paraît en puce d'un toucher sous le bandeau du carnet ; le toucher le range sans
 * `propose` (`accepterProposition`).
 */
interface Proposee { cle: string; messageId: string; index: number; carnetId: string; ligne: { texte: string; caracteristique?: { nom: string; unite?: string }; origine: string } }
export function libelleProposee(l: Proposee['ligne']): string {
  const k = l.caracteristique;
  return k ? `Comparer sur ${/^[aeéèêiouyh]/i.test(k.nom) ? 'l’' : 'le '}${k.nom}${k.unite ? ` (${k.unite})` : ''}` : l.texte;
}
type RetourNeuf = Omit<Retour, 'id'>;
/** La photo jointe au champ (P7, tour 3) : `jeton` écarte une lecture finie après un ✕. */
interface Jointe { jeton: number; jpeg?: string }

/**
 * Ce que le cadre « pendant » a annoncé, depuis la liste, et que l'envoi tient (vision 2, m390-1, m390-2, d1280-1) :
 * - `cree` : une phrase (pas un lien seul) crée SON carnet, sa phrase en titre (R10, R11 ; g5:v08-3, g5:v04-4). Le carnet proche de la
 *   bulle ne la prend que par « Y ajouter en façon ». L'IA met en forme dans ce carnet ; elle ne le retitre pas (son titre devient un
 *   titre proposé, G29) et ne range pas ailleurs ;
 * - `vrac` : chaque ligne d'une note va dans le carnet annoncé pour elle (R18, R19 ; `planVrac`). L'IA met en forme et type les lignes.
 * Un lien seul n'a pas d'annonce figée : le cadre dit « range le lien dans le carnet qui en parle, sinon dans un nouveau » (G21).
 */
type Annonce =
  | { sorte: 'cree'; carnetId: string; titre: string; phrase: string }
  /* Critique 5, n° 7 : `vues` et `carnets`, la découpe telle que le pendant « ✻ L'IA découpe votre note » la montre */
  | { sorte: 'vrac'; lignes: { texte: string; dest: Destination; sorte?: LigneLocale['sorte'] }[]; vues: LigneVracV[]; carnets: number }
  /* Critique 5, n° 3 et 6 : écrit dans un carnet ouvert, tout va dans le carnet annoncé (l'ouvert, ou celui que le cadre a nommé) */
  /* Critique 7, n° 3 : `rubrique` : la puce « Va dans » cochée d'avance à l'envoi (Ce qui compte, Note, Façon) ; l'IA met en forme, la
     rubrique annoncée tient */
  /* Test en ligne 2 : `choisi` : le carnet corrigé d'un toucher (« Ici », ou un autre) ; un choix du brasseur, l'IA ne le change pas */
  | { sorte: 'ici'; carnetId: string; rubrique?: RubriqueVaDans; choisi?: true };
const memeTexte = (x: string, y: string) => x.trim().localeCompare(y.trim(), 'fr', { sensitivity: 'base' }) === 0;

/**
 * Critique 5, n° 3 (G4, D-134) : le carnet où ira ce qu'on tape dans un carnet ouvert. Le même calcul sert au cadre, pendant la frappe,
 * et à l'envoi : ce qui est annoncé est ce qui est fait. Le carnet ouvert garde la phrase s'il en parle, ou si aucun autre n'en parle
 * (`rattacher`, fuse.js, lot A) ; un lien, une note de plusieurs lignes, restent toujours ici (n° 6 : un lien collé dans un carnet est
 * l'article de ce carnet).
 */
/** PCN-186 : la ligne de la note d'origine qui partage le plus de mots avec une ligne de l'IA (−1 : aucune). */
export function ligneBrute(texteIA: string, brutes: readonly string[]): number {
  const js = new Set(jetons(texteIA));
  let best = -1, score = 0;
  brutes.forEach((b, i) => { const s = jetons(b).filter(m => js.has(m)).length; if (s > score) { score = s; best = i; } });
  return best;
}

export function destinationDans(texte: string, ouvert: CarnetDoc, carnets: readonly CarnetDoc[]): { carnetId: string; titre: string } {
  const ici = { carnetId: ouvert.id, titre: ouvert.title };
  const t = texte.trim();
  if (!t || plusieursLignes(t) || analyserTexte(t).some(l => l.url)) return ici;
  const autres = carnets.filter(c => c.id !== ouvert.id && !c.carnet.archive);
  /* critique 8, n° 1 : une phrase qui nomme un autre objet ne devient jamais un critère d'ici : un carnet proche, sinon un neuf */
  const objet = autreObjet(t, ouvert);
  if (objet) {
    const proche = rattacher(objet, autres) ?? rattacher(t, autres);
    return proche ? { carnetId: proche.carnetId, titre: proche.titre } : { carnetId: CARNET_NEUF, titre: `${prefixeDe(t)}${objet}` };
  }
  if (rattacher(t, [ouvert])) return ici;
  const autre = rattacher(t, autres);
  return autre ? { carnetId: autre.carnetId, titre: autre.titre } : ici;
}

/** Critique 8, n° 1 : la destination « nouveau carnet » d'une phrase tapée dans un carnet ouvert (titré par son objet). */
export const CARNET_NEUF = 'NOUVEAU-CARNET';
/* Les mots de tête qui ne nomment pas un objet : une exigence (« doit tenir 80 °C »), un seuil, un nombre */
/**
 * Les objets qui vivent à part dans une brasserie : un équipement entier ou une partie du local, chacun l'objet possible d'un carnet. Le mot
 * de tête d'une phrase doit en être pour qu'elle quitte le carnet ouvert ; une pièce ou un réglage de l'appareil n'en est pas (racines de
 * `jetons`, singulier et pluriel confondus).
 */
const OBJETS_A_PART = new Set(jetons([
  'évier lavabo plonge tuyau tuyaux flexible gaine sol mur plafond porte fenêtre local cave étagère rayonnage établi table chariot',
  'transpalette pompe frigo réfrigérateur congélateur chambre hotte extracteur ventilation moulin fermenteur cuve fût fûts keg tank',
  'densimètre réfractomètre balance embouteilleuse tireuse capsuleuse échangeur refroidisseur serpentin chaudière brûleur plaque',
  'osmoseur adoucisseur laveuse nettoyeur karcher lampe éclairage prise tableau onduleur'
].join(' ')));
const TETE_SANS_OBJET =/^(?:doit|doivent|tient|tenir|tiennent|faut|faudrait|il|on|au|aux|minimum|maximum|mini|maxi|min|max|moins|plus|pas|entre|supporte|resiste|assez|trop|tres|bien|mieux|avec|sans|pour|si|et|ou)(?:\s|$)|^\d/;
/**
 * L'objet que nomme une phrase quand il n'est pas celui du carnet ouvert (« tuyau silicone 8 mm, 5 m » dans la Ventilation → « Tuyau
 * silicone » ; « évier 2 bacs » dans le Frigo → « Évier »). `null` : la phrase est une exigence sans objet (« doit tenir 80 °C »,
 * « 1 200 m³/h au moins »), un geste, une question, ou son objet partage un mot avec le carnet (titre, phrase, critères, façons, articles,
 * notes : « hotte murale » dans un carnet de hottes, « fût de 30 L couché » dans l'évier pour les fûts).
 */
export function autreObjet(texte: string, ouvert: CarnetDoc): string | null {
  const t = texte.replace(/^\s*ZZ TEST\s*[—–-]\s*/i, '').trim();
  const g = genreLocal(t);
  if (g === 'a-faire' || g === 'question' || g === 'conseil') return null;
  const objet = objetDe(t);
  const tete = normaliser(objet).replace(/^(?:l |le |la |les |un |une |des |du )/, '');
  if (!tete || TETE_SANS_OBJET.test(tete)) return null;
  const mots = jetons(objet);
  /* reprise chir8 : seul un objet qui vit à part (un équipement, une pièce du local) quitte le carnet ouvert. Une pièce de l'appareil
     (« compresseur silencieux », « filtre à air G4 » dans le frigo) ou une façon (« système isobarique » dans l'embouteillage) y reste. */
  if (!mots.length || !OBJETS_A_PART.has(mots[0])) return null;
  const d = ouvert.carnet;
  const vocab = new Set(jetons([ouvert.title, d.phrase, ...d.criteres.map(k => `${k.texte} ${k.caracteristique?.nom ?? ''}`), ...d.facons.map(f => f.nom),
    ...d.articles.map(a => a.nom ?? ''), ...d.notes.map(n => n.texte)].join(' ')));
  return mots.some(m => vocab.has(m)) ? null : objet;
}

const lireFinances = (): FinancesCarnet => ({
  plans: FinanceService.getPlans(), transactions: StorageService.getTransactions() as unknown as FinanceTransaction[], payments: FinanceService.getPayments()
});
const versV = (c: CarnetDoc): CarnetV => c as unknown as CarnetV;
/** G14 : le lien que tient le presse-papier, seulement si c'est un lien seul ; sans permission ou sans API, rien (refus silencieux). */
async function lirePresse(): Promise<string | undefined> {
  try {
    const t = (await navigator.clipboard?.readText?.())?.trim();
    if (!t) return undefined;
    const l = analyserTexte(t);
    return l.length === 1 && l[0].url ? l[0].url : undefined;
  } catch { return undefined; }
}
/** Critique 6, n° 1 : plusieurs lignes au sens de la découpe (retours à la ligne, « ; », phrases étiquetées sur une ligne). */
const plusieursLignes = (t: string) => decouper(t).length > 1;
/** La marque des données de test du message, reportée sur les carnets neufs qu'il ouvre (L05). */
const prefixeDe = (t: string) => (/^\s*ZZ TEST\s*[—–-]\s*/i.test(t) ? 'ZZ TEST — ' : '');
/** La découpe d'une note en vrac telle que NoteEnVrac la montre (pendant la frappe, puis pendant que l'IA découpe) : même plan. */
function vuesVrac(plan: PlanVrac<LigneLocale>): LigneVracV[] {
  /* critique 8, n° 3 : une exigence (« tient 80 °C », « 1 200 m³/h au moins ») s'annonce critère pendant, comme elle se range après */
  return plan.lignes.map((x, i) => ({ id: String(i), texte: x.ligne.texte,
    genre: (x.ligne.sorte === 'critere' ? 'critere' : x.ligne.genre) as LigneVracV['genre'],
    ...(x.carnetId ? { carnetId: x.carnetId, carnetTitre: x.titre } : { carnetTitre: x.titre, neuf: true }) }));
}

/**
 * Critique 6, n° 12 (R26, G20, g5:v06-11) : le rang d'un article qui vient d'être rangé, dit dans son bandeau. Dans sa façon : « 1re de sa
 * façon, devant <la suivante> », ou « 2e de sa façon, après <la précédente> » ; sans façon, « 1er sur 3 ». Lu sur `tableau` (comparer.ts,
 * tri par les critères, le premier = rang 1) et `placesDe` (la valeur qui le place, quand elle classe) ; `null` hors du tableau ou écarté.
 */
export function rangDuLien(t: NonNullable<ReturnType<typeof tableauDe>>, articleId: string, articles: readonly { id: string; faconId?: string; nom?: string }[]): string | null {
  const ligne = t.lignes.find(l => l.articleId === articleId);
  if (!ligne || ligne.rang === null) return null;
  const facon = articles.find(a => a.id === articleId)?.faconId;
  const enLice = t.lignes.filter(l => l.rang !== null).sort((x, y) => (x.rang ?? 0) - (y.rang ?? 0));
  const memes = facon ? enLice.filter(l => articles.find(a => a.id === l.articleId)?.faconId === facon) : enLice;
  const i = memes.findIndex(l => l.articleId === articleId);
  const n = i + 1;
  const ordinal = n === 1 ? '1re' : `${n}e`;
  const place = placesDe(t, articleId).find(p => p.rang !== undefined);
  const par = place && place.rang === 1 ? ` · ${place.nom} ${place.texte}` : '';
  if (facon && memes.length > 1) return n === 1 ? `${ordinal} de sa façon, devant ${memes[1].nom}${par}` : `${ordinal} de sa façon, après ${memes[i - 1].nom}`;
  if (enLice.length > 1) return `${n === 1 ? '1er' : `${n}e`} sur ${enLice.length}${n === 1 ? par : ''}`;
  return null;
}

/** Test en ligne 2 (bloquant 8) : le délai avant de replier « Créer » quand le champ de la liste perd le focus. */
const PLIER_APRES_MS = 300;
/** G1 (g5:v04-1) : les exemples de Créer · avant, touchables ; un toucher remplit le champ. */
const EXEMPLES_CREER = ['Frigo de garde', 'Ventilation de la salle', 'Évier pour les fûts'];
const RUBRIQUE_DE: Record<string, string> = { critere: 'Ce qui compte', facon: 'Façons', article: 'Articles', note: 'Notes', photo: 'Photos' };
/**
 * P22 : ce qu'un message a rangé, et où, en une ligne (« Notes : « filtre à air G4 » · dans Frigo de garde »), lu sur ses effets tels
 * qu'ils sont. Trois éléments au plus, puis « +n ».
 */
export function detailDe(etat: Parameters<typeof lireCarnets>[0], effets: readonly { carnetId: string; cible: string; id?: string }[]): string | undefined {
  const cs = lireCarnets(etat, { archives: true });
  const parties = effets.filter(e => e.cible !== 'carnet').map(e => {
    const c = cs.find(x => x.id === e.carnetId);
    if (!c) return null;
    const d = c.carnet;
    const quoi = e.cible === 'note' ? d.notes.find(x => x.id === e.id)?.texte
      : e.cible === 'critere' ? d.criteres.find(x => x.id === e.id)?.texte
        : e.cible === 'facon' ? d.facons.find(x => x.id === e.id)?.nom
          : e.cible === 'article' ? (() => { const a = d.articles.find(x => x.id === e.id); return a ? nomArticle(a) : undefined; })()
            : e.cible === 'photo' ? 'une photo' : undefined;
    if (!quoi) return null;
    const cite = e.cible === 'photo' ? quoi : `« ${quoi.length > 48 ? `${quoi.slice(0, 47)}…` : quoi} »`;
    return `${RUBRIQUE_DE[e.cible] ?? e.cible} : ${cite} · dans ${c.title}`;
  }).filter((x): x is string => !!x);
  if (!parties.length) return undefined;
  return parties.length > 3 ? `${parties.slice(0, 3).join(' ; ')} ; +${parties.length - 3}` : parties.join(' ; ');
}

/** Une ligne de l'analyse locale, rangée vers sa destination (picto local, Q19). */
export function depuisLocale(l: LigneLocale, dest: Destination): LigneARanger {
  if (l.sorte === 'article') {
    return { ...dest, sorte: 'article', origine: 'locale', lecture: l.url ? 'a-lire' : 'lue',
      ...(l.url ? { url: l.url, domaine: l.domaine } : { nom: l.texte }), ...(l.prixCentimes !== undefined ? { prixCentimes: l.prixCentimes, devise: l.devise } : {}) } as LigneARanger;
  }
  if (l.sorte === 'critere') return { ...dest, sorte: 'critere', texte: l.texte, origine: 'locale' } as LigneARanger;
  return { ...dest, sorte: 'note', texte: l.texte, genre: l.genre } as LigneARanger;
}

/** Une ligne validée de l'IA (ou de la simulation, « exemple »), rangée vers sa destination. Ce qu'elle ne lit pas reste absent. */
/**
 * Critique 7, n° 3 (R13, R14 ; D-134, D-135) : ce que le cadre a annoncé est ce qui se fait. Une ligne de l'IA (note, critère, façon) d'un
 * message d'une ligne passe dans la rubrique annoncée ; son texte mis en forme et sa caractéristique sont gardés. Un article reste un article.
 */
/**
 * Critique 8, n° 3 (R13, R18, D-139) : en note en vrac, le type annoncé pendant s'applique. Une ligne annoncée critère (« doit tenir 80 °C »,
 * « 1 200 m³/h au moins ») que l'IA rend en note reste un critère ; une note garde le genre annoncé.
 */
export function typerVrac(l: LigneCarnet, sorteAnnoncee: LigneLocale['sorte'] | undefined, genreAnnonce?: string): LigneCarnet {
  if (l.sorte === 'note' && (sorteAnnoncee === 'critere' || genreAnnonce === 'critere')) return versRubrique(l, 'critere', l.texte);
  return l.sorte === 'note' && genreAnnonce && genreAnnonce !== 'critere' && genreAnnonce !== 'facon' ? { ...l, genre: genreAnnonce as LigneCarnet['genre'] } : l;
}

export function versRubrique(l: LigneCarnet, rubrique: RubriqueVaDans, phrase: string): LigneCarnet {
  /* une proposition de l'IA (« ✻ Comparer sur le débit · Ajouter ») n'est pas sa phrase : elle reste proposée */
  if (l.propose || l.sorte === rubrique || !['note', 'critere', 'facon'].includes(l.sorte)) return l;
  if (rubrique === 'critere') {
    const texte = l.sorte === 'note' && memeTexte(l.texte, phrase) ? analyserLigne(phrase).texte : l.texte;
    return { ...l, sorte: 'critere', texte, source: 'phrase', genre: undefined };
  }
  if (rubrique === 'facon') return { ...l, sorte: 'facon', titre: l.titre ?? l.texte, genre: undefined };
  return { ...l, sorte: 'note', genre: l.genre ?? 'note' };
}

export function depuisIA(l: LigneCarnet, dest: Destination): LigneARanger {
  const origine = l.origine;
  switch (l.sorte) {
    case 'idee': return { ...dest, sorte: 'idee' } as LigneARanger;
    /* P23 : `propose` (lot A) suit la ligne : `ranger` la garde sur le message, la puce la range d'un toucher */
    case 'critere': return { ...dest, sorte: 'critere', texte: l.texte, origine, ...(l.caracteristique ? { caracteristique: l.caracteristique } : {}), ...(l.propose ? { propose: true } : {}), ...(l.source ? { source: l.source } : {}) } as LigneARanger;
    case 'facon': return { ...dest, sorte: 'facon', nom: l.titre ?? l.texte, origine } as LigneARanger;
    case 'article': {
      const p = l.page;
      const lue = p ? p.statut === 'lue' : !l.url;
      const valeurs: Record<string, { valeur: string; unite?: string; origine: 'page' }> = {};
      for (const v of p?.valeurs ?? []) valeurs[v.nom] = { valeur: v.valeur, ...(v.unite ? { unite: v.unite } : {}), origine: 'page' };
      return {
        /* test en ligne 2 (bloquant 6) : l'IA passée, les pages ont été lues ; un lien sans page n'attend plus rien (jamais « lecture… » sans fin) */
        ...dest, sorte: 'article', origine, lecture: l.url ? (lue ? 'lue' : 'illisible') : 'lue',
        ...(l.url ? { url: l.url } : {}), ...(p?.domaine ? { domaine: p.domaine } : {}),
        ...(p?.nom ?? l.titre ? { nom: p?.nom ?? l.titre } : !l.url ? { nom: l.texte } : {}),
        ...(l.prixCentimes !== undefined ? { prixCentimes: l.prixCentimes, devise: l.devise ?? 'CHF' } : {}),
        ...(l.vendeur ? { vendeur: l.vendeur } : {}), ...(p?.photo ? { photo: p.photo } : {}),
        ...(p?.dispo ? { dispo: p.dispo === 'en-stock' ? 'en stock' : 'rupture' } : {}),
        ...(Object.keys(valeurs).length ? { valeurs } : {})
      } as LigneARanger;
    }
    default: return { ...dest, sorte: 'note', texte: l.texte, ...(l.genre ? { genre: l.genre } : {}) } as LigneARanger;
  }
}

/** La forme compacte d'un carnet pour l'IA (au plus 30, les plus récents). */
function pourIA(carnets: readonly CarnetDoc[]): CarnetPourIA[] {
  return carnets.slice(0, 30).map(c => ({
    id: c.id, titre: c.title, criteres: c.carnet.criteres, facons: c.carnet.facons,
    articles: c.carnet.articles.map(a => ({ nom: a.nom, valeurs: a.valeurs })), notes: c.carnet.notes.map(n => ({ id: n.id, texte: n.texte }))
  }));
}

export function CarnetsVue(p: CarnetsVueProps) {
  const magasin = useMemo(() => p.magasin ?? magasinFirestore(), [p.magasin]);
  const [items, setItems] = useState(() => magasin.lire());
  useEffect(() => { setItems(magasin.lire()); return magasin.ecouter(() => setItems(magasin.lire())); }, [magasin]);
  const financesApp = useStorageValue(lireFinances);
  const finances = p.finances ?? financesApp;
  const mode = p.mode ?? modeCarnet();
  const aides = p.aides ?? aidesCourantes();
  const maintenant = useCallback(() => (p.maintenant ? p.maintenant() : new Date()), [p.maintenant]);
  const [enLigneNav, setEnLigneNav] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false);
  useEffect(() => {
    const maj = () => setEnLigneNav(navigator.onLine !== false);
    window.addEventListener('online', maj); window.addEventListener('offline', maj);
    return () => { window.removeEventListener('online', maj); window.removeEventListener('offline', maj); };
  }, []);
  const enLigne = !p.horsLigne && enLigneNav;

  const carnets = useMemo(() => lireCarnets(items), [items]);
  const tous = useMemo(() => lireCarnets(items, { archives: true }), [items]);
  const messages = useMemo(() => lireMessages(items), [items]);
  const [vue, setVue] = useState<Vue>({ sorte: 'liste' });
  const idOuvert = vue.sorte === 'liste' ? null : vue.id;
  const ouvert = idOuvert ? tous.find(c => c.id === idOuvert) ?? null : null;
  const [texte, setTexte] = useState(p.texteInitial ?? '');
  const [etatR, setEtatR] = useState<EtatRangement<LigneLocale>>({ etape: 'repos' });
  const [retour, setRetourEtat] = useState<Retour | null>(null);
  /** Le retour tel qu'il est maintenant, lu par Annuler et par la fin de l'IA (une fermeture plus ancienne ne le perd pas). */
  const retourRef = useRef<Retour | null>(null);
  const prochainRetour = useRef(0);
  const poserRetourEtat = useCallback((r: Retour | null) => { retourRef.current = r; setRetourEtat(r); }, []);
  const setRetour = useCallback((r: RetourNeuf | null) => {
    poserRetourEtat(r ? { ...r, id: (prochainRetour.current += 1) } : null);
  }, [poserRetourEtat]);
  const [jointe, setJointe] = useState<Jointe | null>(null);
  const jetonJointe = useRef(0);
  const [enTete, setEnTete] = useState<string | undefined>();
  const [vientDEtreCree, setVientDEtreCree] = useState<string | null>(null);
  const [supprime, setSupprime] = useState<{ titre: string; statut: CarnetDoc['status']; inverse: EcritureCarnet[] } | null>(null);
  const [noteSupprimee, setNoteSupprimee] = useState<{ id: string; inverse: EcritureCarnet[] } | null>(null);
  const [feuille, setFeuille] = useState<string | null>(null);
  const [edition, setEdition] = useState<string | null>(null);
  /** P18 (G11) : « Garder à part » touché pendant la frappe ; la proposition de fusion ne revient pas, l'envoi écrit `garderAPart`. */
  const [aPart, setAPart] = useState(false);
  const gardeAPartRef = useRef(false);
  /** P23 (D-35) : les lignes que l'IA propose, en puces d'un toucher. */
  /** Les puces écartées d'un ✕ pendant la session : rangées derrière, pas supprimées (la proposition reste sur son message). */
  const [ecartees, setEcartees] = useState<ReadonlySet<string>>(() => new Set());
  /** P28 (R09) : le champ de la liste a le focus, vide : « Créer · avant » (g5:v03-2, G1, G2). */
  const [focusListe, setFocusListe] = useState(false);
  /**
   * Test en ligne 2 (bloquant 8) : le toucher sur un carnet retire le focus du champ AVANT son clic. Replier « Créer » aussitôt faisait
   * remonter la liste (~120 px) sous le doigt : le clic tombait à côté. Le cadre se replie après le geste (le clic arrive en ~100 ms).
   */
  const pliage = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const plierApresToucher = useCallback(() => { clearTimeout(pliage.current); pliage.current = setTimeout(() => setFocusListe(false), PLIER_APRES_MS); }, []);
  useEffect(() => () => clearTimeout(pliage.current), []);
  const aidesRef = useRef(aides);
  aidesRef.current = aides;
  /** P5 (R13, G10) : la rubrique corrigée d'un toucher sur les puces « Va dans » ; elle prime sur le choix d'avance, jusqu'à l'envoi. */
  const [corrige, setCorrige] = useState<RubriqueVaDans | null>(null);
  /** La rubrique forcée de l'envoi en cours : lue par `ecrireLocal`, puis `ecrireIA` ne reprend pas ce message (sa correction est un choix). */
  const aForcer = useRef<RubriqueVaDans | null>(null);
  const forcee = useRef<string | null>(null);
  /** Critique 5, n° 3 : le carnet corrigé d'un toucher sur la puce « Va dans » (prime sur le calcul, jusqu'à l'envoi). */
  const [corrigeCarnet, setCorrigeCarnet] = useState<string | null>(null);
  /** Le carnet annoncé de l'envoi en cours, lu par `ecrireLocal` (même calcul que le cadre). */
  const destEnvoi = useRef<string | null>(null);
  /** Critique 8, n° 1 : le titre du carnet neuf annoncé pour une phrase qui parle d'un autre objet. */
  const titreNeufEnvoi = useRef<string | null>(null);
  /** Test en ligne 2 : le carnet de l'envoi en cours a été corrigé d'un toucher (un choix : l'IA ne le change pas). */
  const carnetChoisi = useRef(false);
  /** Critique 5, n° 24 : les carnets dont le dernier envoi n'a pas eu l'IA (échec, hors ligne, éteinte) : passés à CarnetOuvert. */
  const [iaManquee, setIaManquee] = useState<Readonly<Record<string, AvisIA['sorte']>>>({});
  /** Critique 6, n° 24 : les messages rangés hors ligne, tels quels ; au retour du réseau, « Ranger maintenant » les passe à l'IA. */
  const [aReprendre, setAReprendre] = useState<{ messageId: string; texte: string }[]>([]);
  /** Critique 5, n° 26 : le titre tapé dans le champ du bas pendant « Se renomme ici ». */
  const [titreEdite, setTitreEdite] = useState('');
  /** G14 (R15) : le lien que le presse-papier tient, lu au focus du champ ; refus silencieux. */
  const [presse, setPresse] = useState<string | undefined>();
  const champRef = useRef<HTMLTextAreaElement>(null);
  /** P1, P2 : le retour de l'écriture locale, tenu en réserve tant que l'IA peut la remplacer ; montré seulement si elle échoue ou est coupée. */
  const attente = useRef<{ messageId: string; retour: RetourNeuf; montre?: boolean; neuf?: string } | null>(null);
  /** L'annonce tenue par chaque envoi en cours (créer, note en vrac), lue par `ecrireIA`. */
  const annonces = useRef(new Map<string, Annonce>());
  /** L'envoi en cours : ✕ le coupe même si la vue a changé entre-temps (le carnet neuf ouvert recrée le déroulé). */
  const envoiActif = useRef<{ envoi: Envoi<LigneLocale>; depuis: string | null } | null>(null);

  useEffect(() => { if (p.ouvrir) { setVue({ sorte: 'carnet', id: p.ouvrir.id }); setRetour(null); } }, [p.ouvrir?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (p.focusChamp) champRef.current?.focus(); }, [p.focusChamp]);
  // P12 : la note en modification a disparu (supprimée, ou autre vue) : le mode se referme et le texte qu'il avait mis dans le champ part.
  useEffect(() => {
    if (edition && !(ouvert && vue.sorte === 'carnet' && ouvert.carnet.notes.some(n => n.id === edition))) { setEdition(null); setTexte(''); }
  }, [edition, ouvert, vue.sorte]);
  // P34 : la note supprimée appartient au carnet ouvert ; un autre carnet, ou la liste, ne garde pas son bandeau.
  useEffect(() => { setNoteSupprimee(null); }, [idOuvert]);
  // Le carnet ouvert a disparu (supprimé ailleurs) : retour à la liste.
  useEffect(() => { if (idOuvert && !ouvert) setVue({ sorte: 'liste' }); }, [idOuvert, ouvert]);
  // Un retour « ✓ … · Annuler » reste au moins 8 s (Q18 : 5 s au moins), puis s'efface.
  useEffect(() => { if (!retour) return; const t = setTimeout(() => setRetour(null), 8000); return () => clearTimeout(t); }, [retour]);

  /** Applique une intention ; un refus est dit, rien n'est écrit. */
  const appliquer = useCallback((r: Resultat): (Resultat & { ok: true }) | null => {
    if (!r.ok) { p.onMessage?.((r as { raison: string }).raison); return null; }
    magasin.appliquer(r.ecritures, r.journal as Journal | undefined);
    return r;
  }, [magasin, p.onMessage]);
  /** P34 : un écouteur du magasin qui échoue après l'écriture (banc : reflet du cache) ne laisse pas l'écran dans l'état d'avant. */
  const annuler = (inverse: EcritureCarnet[]) => {
    if (!inverse.length) return;
    try { magasin.appliquer(inverse); } catch (e) { p.onMessage?.(`Annuler : ${(e as Error)?.message ?? 'erreur'}`); }
  };

  /**
   * P1, P2 : le retour « après » se lit sur les effets du message tels qu'ils sont au bout du compte (magasin), jamais sur l'écriture
   * locale que l'IA a remplacée. Carnet créé (R11, g5:v04-4), rangé ici (R14, g5:v03-8), rangé dans un autre carnet avec le message cité et
   * l'article (G21, g5:v06-14, état 20), ou n lignes dans m carnets (R19, g5:v01-16). `inverse` : tout ce qu'Annuler défait.
   */
  const retourDe = useCallback((messageId: string, txt: string, depuisM: string | null, inverse: EcritureCarnet[], lignesIA?: readonly LigneCarnet[], titresIA?: readonly (string | undefined)[]): RetourNeuf | null => {
    const etat = magasin.lire();
    const effets = lireMessages(etat).find(m => m.id === messageId)?.carnetMessage.effets ?? [];
    const rr = retourDuRangement(effets, { depuis: depuisM, plusieursLignes: plusieursLignes(txt) });
    if (!rr) return null;
    const detail = detailDe(etat, effets);
    if (rr.sorte === 'vrac') return { bandeau: { sorte: 'vrac', lignes: rr.lignes, carnets: rr.carnets }, inverse, messageId, detail };
    const c = lireCarnets(etat, { archives: true }).find(x => x.id === rr.carnetId);
    /* P9 (R25) : un lien seul dont la page n'est pas lue dit lequel, en clair, et qu'il n'est pas lu ; P21 : une photo dit « Photo rangée » */
    const propres = effets.filter(e => e.carnetId === rr.carnetId && e.cible !== 'carnet');
    const art = propres.length === 1 && propres[0].cible === 'article' ? c?.carnet.articles.find(x => x.id === propres[0].id) : undefined;
    if (rr.sorte === 'range') {
      if (art?.url && art.lecture !== 'lue') return { bandeau: { sorte: 'lien', url: art.url, lu: false, ici: true }, inverse, messageId, carnetId: rr.carnetId, detail };
      if (propres.length && propres.every(e => e.cible === 'photo')) return { bandeau: { sorte: 'photo', ici: true }, inverse, messageId, carnetId: rr.carnetId, detail };
      return { bandeau: { sorte: 'range' }, inverse, messageId, carnetId: rr.carnetId, detail };
    }
    if (rr.sorte === 'cree' && propres.length && propres.every(e => e.cible === 'photo')) {
      return { bandeau: { sorte: 'photo', ici: true }, inverse, messageId, carnetId: rr.carnetId, detail };
    }
    if (rr.sorte === 'cree') {
      const titre = c?.title ?? '';
      const nomLu = c?.carnet.articles.some(a => a.nom && a.nom === titre);
      /* « Embouteillage » pour « embouteillage » reste sa phrase en titre (g5:v04-4). `ia` seulement si l'IA a fourni ce titre ; sinon la règle locale */
      const titreDe: TitreDe = origineDuTitre({ titre, titreDePhrase: titreDePhrase(txt), lienSeul: estLienSeul(txt), nomLu: !!nomLu, titresIA });
      return { bandeau: { sorte: 'cree', phrase: txt, titreDe }, inverse, messageId, carnetId: rr.carnetId, detail };
    }
    const effet = effets.find(e => e.cible === 'article' && e.carnetId === rr.carnetId);
    const a = effet ? c?.carnet.articles.find(x => x.id === effet.id) : undefined;
    const prix = a ? montant(a.prixCentimes) : null;
    const detailArt = a ? [a.nom ? a.domaine ?? a.vendeur : a.vendeur, a.pays].filter(Boolean).join(' · ') : '';
    const raison = lignesIA?.find(l => l.carnetId === rr.carnetId && l.raisonCarnet)?.raisonCarnet;
    const bandeau: BandeauV = {
      sorte: 'ailleurs', carnet: c?.title ?? 'un autre carnet', cite: txt, ...(raison ? { raison } : {}),
      ...(a ? { article: { nom: nomArticle(a), ...(detailArt ? { detail: detailArt } : {}), ...(prix ? { prix: `${prix} ${a.devise ?? 'CHF'}` } : {}), ...(a.origine === 'exemple' ? { exemple: true } : {}) } } : {})
    };
    return { bandeau, inverse, messageId, detail, ...(depuisM ? { carnetId: depuisM } : {}) };
  }, [magasin]);

  /** P22 : l'avis de l'IA (éteinte, hors ligne, en échec) se pose sur le retour de ce message, affiché ou tenu en réserve. */
  const poserAvis = useCallback((messageId: string, sorte: AvisIA['sorte'], enReserve?: RetourNeuf | null) => {
    const avis: AvisIA = { sorte, texte: AVIS_IA[sorte] };
    const cur = retourRef.current;
    const vise = cur && cur.messageId === messageId ? cur : enReserve;
    /* n° 24 : le carnet où ce message est rangé sait que l'IA n'y est pas passée (« Ensuite : l'IA cherche… » ne promet plus rien) */
    const carnetVise = vise?.carnetId ?? lireMessages(magasin.lire()).find(m => m.id === messageId)?.carnetMessage.effets[0]?.carnetId;
    if (carnetVise) setIaManquee(m => ({ ...m, [carnetVise]: sorte }));
    if (cur && cur.messageId === messageId) { poserRetourEtat({ ...cur, avis }); return; }
    if (enReserve) setRetour({ ...enReserve, avis });
  }, [poserRetourEtat, setRetour, magasin]);

  /* ---------- le fil : un champ, l'IA met en forme et range ---------- */
  const depuis = ouvert && vue.sorte !== 'liste' ? ouvert.id : null;
  const rangement = useMemo(() => creerRangement<LigneLocale>({
    mode, depuis,
    carnets: () => pourIA(lireCarnets(magasin.lire())),
    enLigne: () => enLigne,
    analyseLocale: analyserTexte,
    appels: p.appels ?? (mode === 'simule' ? appelsSimules(comportementSimule()) : undefined),
    maintenant,
    surEtat: e => {
      setEtatR(e);
      /* l'IA a échoué ou a été coupée : l'écriture locale reste, son retour paraît enfin (avec son Annuler) ; un échec le dit (P36) */
      if ((e.etape === 'echec' || e.etape === 'annule') && attente.current?.messageId === e.messageId) {
        const { retour: local, montre, neuf } = attente.current;
        attente.current = null;
        annonces.current.delete(e.messageId);
        /* PCN-184 : sans réponse de l'IA, l'aperçu local fait foi : le carnet neuf tenu en réserve s'ouvre enfin */
        if (neuf) { setEnTete(neuf); setVientDEtreCree(neuf); setVue({ sorte: 'carnet', id: neuf }); }
        if (e.etape === 'echec') poserAvis(e.messageId, 'echec', montre ? null : local);
        else if (!montre) setRetour(local);
      } else if (e.etape === 'echec') poserAvis(e.messageId, 'echec');
      /* P22 : IA éteinte ou hors ligne : le retour local est déjà affiché ; l'avis s'y ajoute, avec ce qui a été rangé et où */
      if (e.etape === 'hors-ligne') { poserAvis(e.messageId, 'hors-ligne'); setAReprendre(l => [...l.filter(x => x.messageId !== e.messageId), { messageId: e.messageId, texte: e.texte }]); }
      if (e.etape === 'range' && e.rangement === 'locale') poserAvis(e.messageId, 'eteint');
    },
    ecrireLocal: (txt, lignes, { iaAttendue }) => {
      const etat = magasin.lire();
      const le = maintenant().toISOString();
      const message = { id: nouvelIdCarnet('MSG'), texte: txt, le, depuis: depuis ?? 'liste', rangement: 'locale' as const };
      let r: Resultat;
      let neuf: string | null = null;
      const force = aForcer.current; aForcer.current = null;
      /* n° 3 : le carnet annoncé par le cadre (l'ouvert, ou celui qu'il a nommé, corrigé ou non d'un toucher) */
      const titreNeuf = destEnvoi.current === CARNET_NEUF ? titreNeufEnvoi.current : null;
      const ici = depuis && !titreNeuf ? destEnvoi.current ?? depuis : null;
      destEnvoi.current = null; titreNeufEnvoi.current = null;
      const rubrique = ici && !force ? vaDansDe(txt) : null;
      const choisi = carnetChoisi.current; carnetChoisi.current = false;
      let annonce: Annonce | null = ici ? { sorte: 'ici', carnetId: ici, ...(rubrique ? { rubrique } : {}), ...(choisi ? { choisi: true as const } : {}) } : null;
      if (ici && force && lignes.length === 1 && lignes[0].sorte !== 'article') {
        const l0 = lignes[0];
        const ligne: LigneARanger = force === 'critere' ? { carnetId: ici, sorte: 'critere', texte: l0.texte, origine: 'vous' }
          : force === 'facon' ? { carnetId: ici, sorte: 'facon', nom: l0.texte, origine: 'vous' }
          : { carnetId: ici, sorte: 'note', texte: l0.texte, ...(l0.sorte === 'note' ? { genre: l0.genre } : {}) };
        r = ranger(etat, { message, lignes: [ligne] });
        forcee.current = message.id;
      } else if (ici) r = ranger(etat, { message, lignes: lignes.map(l => depuisLocale(l, { carnetId: ici })) });
      if (ici) { /* rangé ci-dessus */ } else if (lignes.length <= 1) {
        neuf = nouvelIdCarnet('CARNET');
        const titre = titreNeuf ?? titreDePhrase(txt);
        /* n° 2 : la phrase entière n'est pas un critère d'elle-même (« Ce qui compte : Moulin à malt… ») ; elle est déjà le titre */
        r = creerCarnet(etat, { id: neuf, message, lignes: lignes.filter(l => l.sorte !== 'note' && !(l.sorte !== 'article' && memeTexte(l.texte, txt))).map(l => depuisLocale(l, { carnetNeuf: { id: neuf!, titre } })) });
        if (!estLienSeul(txt)) annonce = { sorte: 'cree', carnetId: neuf, titre, phrase: txt };
      } else {
        /* la découpe annoncée par le cadre (même `planVrac`, mêmes carnets) : chaque ligne là où elle a été annoncée */
        const cs = lireCarnets(etat);
        const plan = planVrac(lignes, t => rattacher(t, cs), prefixeDe(txt));
        /* critique 6, n° 1 : un carnet neuf par objet, titré par sa ligne */
        const neufsVrac = plan.neufs.map((titre, k) => ({ id: nouvelIdCarnet('CARNET'), titre,
          phrase: lignes.filter((_, i) => plan.lignes[i].neufIndex === k).map(l => l.phrase.replace(/^\s*ZZ TEST\s*[—–-]\s*/i, '')).join('\n') }));
        const dests: Destination[] = plan.lignes.map(x => (x.carnetId ? { carnetId: x.carnetId } : { carnetNeuf: neufsVrac[x.neufIndex ?? 0] }));
        r = ranger(etat, { message, lignes: lignes.map((l, i) => depuisLocale(l, dests[i])) });
        annonce = { sorte: 'vrac', lignes: lignes.map((l, i) => ({ texte: l.texte, dest: dests[i], sorte: l.sorte })), vues: vuesVrac(plan), carnets: plan.carnets };
      }
      const fait = appliquer(r!);
      if (!fait) throw new Error((r! as { raison?: string }).raison ?? 'refus');
      /* P18 (G11) : « Garder à part » touché pendant la frappe : le message le retient, la fusion ne sera pas proposée ni faite */
      if (gardeAPartRef.current) {
        gardeAPartRef.current = false;
        const g = appliquer(garderAPart(magasin.lire(), { messageId: message.id }));
        if (g) fait.inverse.unshift(...g.inverse);
      }
      const local = retourDe(message.id, txt, depuis, fait.inverse) ?? { bandeau: { sorte: 'range' }, inverse: fait.inverse, messageId: message.id };
      /* L'IA va tourner : son rangement peut remplacer celui-ci (P1, P2) ; le retour attend la fin, rien n'est annoncé qui pourrait mentir.
         Sauf à la création, où la cible est tenue : l'IA ne fait que mettre en forme, « Carnet créé » paraît tout de suite. La note en vrac
         montre pendant ce temps « ✻ L'IA découpe votre note » (n° 7), puis « ✓ n lignes rangées dans m carnets ». */
      if (annonce && iaAttendue) annonces.current.set(message.id, annonce);
      /* Paquet 1, PCN-184 (test en ligne 3) : écrit dans un carnet ouvert, le carnet neuf n'est qu'une supposition locale tant que l'IA
         range : l'écran reste sur le carnet ouvert, rien n'est annoncé « créé » ; la réponse dit où c'est allé (D383). */
      const definitif = annonce?.sorte === 'cree' && !(depuis && iaAttendue);
      if (iaAttendue) attente.current = { messageId: message.id, retour: local, montre: definitif, ...(neuf && !definitif ? { neuf } : {}) };
      if (!iaAttendue || definitif) setRetour(local);
      if (neuf && !(depuis && iaAttendue)) { setEnTete(neuf); setVientDEtreCree(neuf); setVue({ sorte: 'carnet', id: neuf }); }
      return { messageId: message.id };
    },
    ecrireIA: (messageId, lignes, mode2) => {
      if (forcee.current === messageId) {
        /* sa correction « Va dans » est un choix : l'IA ne la défait pas ; le retour local, tenu en réserve, paraît */
        forcee.current = null;
        const local = attente.current?.messageId === messageId ? attente.current.retour : null;
        attente.current = null;
        if (local) setRetour(local);
        return;
      }
      const etat = magasin.lire();
      const msg = lireMessages(etat).find(m => m.id === messageId);
      const creePar = msg?.carnetMessage.effets.find(e => e.cible === 'carnet')?.carnetId;
      const an = annonces.current.get(messageId);
      annonces.current.delete(messageId);
      const txt = msg?.carnetMessage.texte ?? '';
      /* Test en ligne 2 (bloquant 5) : un prix écrit dans le message que l'IA n'a pas rendu reste sur son article */
      lignes = prixEcrits(lignes, analyserTexte(txt));
      let aRanger: LigneARanger[];
      let propose: { carnetId: string; titre: string } | undefined;
      /*
       * Test en ligne 2 (18.11) : quand l'IA a répondu, son rangement fait foi : le carnet (connu, ou neuf qu'elle nomme), la sorte et le
       * critère. L'annonce locale n'a été qu'un aperçu en attendant ; elle ne sert plus que quand l'IA ne dit pas où (aucun carnet rendu).
       * Les carnets neufs que l'IA nomme portent la marque des données de test du message (L05).
       */
      const neufsIA = new Map<string, Destination>();
      const versNeufIA = (titre: string): Destination => {
        const t = prefixeDe(txt) && !/^\s*ZZ TEST/i.test(titre) ? `${prefixeDe(txt)}${titre}` : titre;
        const cle = normaliser(t);
        if (!neufsIA.has(cle)) neufsIA.set(cle, { carnetNeuf: { id: nouvelIdCarnet('CARNET'), titre: t } });
        return neufsIA.get(cle)!;
      };
      const connu = (id: string | undefined) => !!id && lireCarnets(etat, { archives: true }).some(c => c.id === id);
      if (an?.sorte === 'cree') {
        /* m390-1, d1280-1, L4-7 : ce qui n'a pas d'autre carnet reste dans SON carnet, sous sa phrase ; un autre titre de l'IA devient un
           titre proposé (G29). Test en ligne 2 (bloquants 3 et 4) : une ligne que l'IA range dans un carnet connu y va ; le carnet créé
           pendant l'attente, resté vide, disparaît. */
        const dest: Destination = { carnetNeuf: { id: an.carnetId, titre: an.titre } };
        const ailleurs = (l: LigneCarnet) => l.sorte !== 'idee' && connu(l.carnetId) && l.carnetId !== an.carnetId;
        const ici = lignes.filter(l => !ailleurs(l));
        /* n° 2 : la phrase recopiée telle quelle (en note ou en critère) n'est pas une mise en forme : elle est déjà le titre ; sauf si elle
           porte une quantité ou un prix (« tuyau silicone 8 mm, 5 m » à acheter : rien n'est perdu) */
        const recopie = (l: LigneCarnet) => l.sorte !== 'article' && memeTexte(l.texte, an.phrase) && l.quantite === undefined && l.prixCentimes === undefined;
        aRanger = [
          ...(ici.length || !lignes.some(ailleurs) ? [{ ...dest, sorte: 'idee' } as LigneARanger] : []),
          ...ici.filter(l => l.sorte !== 'idee' && !recopie(l)).map(l => depuisIA(l, dest)),
          ...lignes.filter(ailleurs).map(l => depuisIA(l, { carnetId: l.carnetId! }))];
        const titreIA = lignes.find(l => l.sorte === 'idee')?.titre ?? lignes.find(l => l.carnetNeuf)?.carnetNeuf ?? lignes.find(l => l.titrePropose)?.titrePropose;
        if (aRanger.some(l => l.sorte === 'idee') && titreIA && !memeTexte(titreIA, an.titre)) propose = { carnetId: an.carnetId, titre: titreIA };
      } else if (an?.sorte === 'vrac') {
        /* Test en ligne 2 (bloquants 1 et 2) : chaque ligne va où l'IA la range (un carnet connu, ou le carnet neuf qu'elle nomme, une idée
           comprise : « Pompe » n'est plus annoncée puis perdue), avec la sorte qu'elle lui donne. Sans carnet rendu : la ligne annoncée. */
        const sansIdee = lignes.filter(l => l.sorte !== 'idee');
        const idx = versLignesAnnoncees(sansIdee.map(l => l.texte), an.lignes.map(x => x.texte));
        const annonceDe = (l: LigneCarnet): Destination => {
          const i = sansIdee.indexOf(l);
          return (i >= 0 ? an.lignes[idx[i]]?.dest : undefined) ?? an.lignes[0].dest;
        };
        aRanger = lignes.flatMap(l => {
          const dest = connu(l.carnetId) ? { carnetId: l.carnetId! } : l.carnetNeuf ? versNeufIA(l.carnetNeuf) : l.sorte === 'idee' ? null : annonceDe(l);
          return dest ? [depuisIA(l, dest)] : [];
        });
        /* Paquet 1, PCN-186 (test en ligne 3) : chaque carnet neuf de l'IA cite ses lignes de la note, pas la note entière */
        const brutes = txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        for (const [cle, d] of neufsIA) {
          const siennes = lignes.filter(l => l.carnetNeuf && normaliser(prefixeDe(txt) && !/^\s*ZZ TEST/i.test(l.carnetNeuf) ? `${prefixeDe(txt)}${l.carnetNeuf}` : l.carnetNeuf) === cle);
          const idx = new Set(siennes.map(l => ligneBrute(l.texte, brutes)).filter(i => i >= 0));
          if (idx.size && d.carnetNeuf) d.carnetNeuf.phrase = brutes.filter((_, i) => idx.has(i)).map(s => s.replace(/^\s*ZZ TEST\s*[—–-]\s*/i, '')).join('\n');
        }
      } else if (an?.sorte === 'ici') {
        /* n° 3 et 6 : écrit dans un carnet ouvert, l'IA met en forme (critère, façon, article lu, note). Test en ligne 2 (bloquant 2) : le
           carnet qu'elle rend fait foi (« doit tenir 80 °C » écrit dans Pompe reste dans Pompe, même si un carnet porte ce titre), et la
           sorte qu'elle donne aussi ; sans carnet rendu, le carnet annoncé. */
        const dest = (l: LigneCarnet): Destination => (an.choisi ? { carnetId: an.carnetId } : connu(l.carnetId) ? { carnetId: l.carnetId! } : l.carnetNeuf ? versNeufIA(l.carnetNeuf) : { carnetId: an.carnetId });
        /* Paquet 1, PCN-183 (test en ligne 3) : une idée que l'IA range dans un carnet neuf (« Réfractomètre », écrit dans le Fermenteur)
           ouvre ce carnet ; elle n'est plus jetée, la phrase brute ne reste pas en note ici (D383). */
        const ideeNeuve = (l: LigneCarnet) => l.sorte === 'idee' && !an.choisi && !connu(l.carnetId) && !!(l.carnetNeuf ?? l.titre);
        aRanger = lignes.filter(l => l.sorte !== 'idee' || ideeNeuve(l))
          .map(l => depuisIA(l, ideeNeuve(l) ? versNeufIA((l.carnetNeuf ?? l.titre)!) : dest(l)));
        const p2 = lignes.find(l => l.titrePropose && l.carnetId === an.carnetId);
        if (p2) propose = { carnetId: an.carnetId, titre: p2.titrePropose! };
        if (!aRanger.length) {
          const local = attente.current?.messageId === messageId ? attente.current.retour : null;
          attente.current = null;
          if (local) setRetour(local);
          return;
        }
      } else {
        const neufs = new Map<string, string>();
        /* un lien seul qui ouvre un carnet : le nom lu sur sa page, sinon son domaine (R16, R17 ; g5:v03-10, g5:v06-10) */
        const pageLue = lignes.find(l => l.sorte === 'article' && l.page)?.page;
        const titreLien = !depuis && estLienSeul(txt) ? (pageLue?.statut === 'lue' && pageLue.nom ? pageLue.nom : titreDePhrase(txt)) : null;
        const dest = (l: LigneCarnet): Destination => {
          if (l.carnetId) return { carnetId: l.carnetId };
          if (depuis && !l.carnetNeuf) return { carnetId: depuis };
          /* critique 6, n° 13 : le besoin que l'IA nomme (« Pompe pour le moût ») d'abord ; le nom lu sur la page à défaut */
          const titre = l.carnetNeuf ?? titreLien ?? l.titre ?? titreDePhrase(l.texte);
          if (!neufs.has(titre)) neufs.set(titre, neufs.size === 0 && creePar ? creePar : nouvelIdCarnet('CARNET'));
          return { carnetNeuf: { id: neufs.get(titre)!, titre } };
        };
        aRanger = lignes.map(l => depuisIA(l, dest(l)));
        const p2 = lignes.find(l => l.titrePropose && l.carnetId);
        if (p2) propose = { carnetId: p2.carnetId!, titre: p2.titrePropose! };
      }
      const r = remplacerRangement(etat, { messageId, rangement: mode2, lignes: aRanger, ...(propose ? { titrePropose: propose } : {}) });
      const fait = appliquer(r);
      const enAttente = attente.current?.messageId === messageId ? attente.current : null;
      const local = enAttente?.retour ?? null;
      attente.current = null;
      if (!fait) { if (local && !enAttente?.montre) setRetour(local); return; }
      /* P18 (G11) : la note qui répète une note connue y est fusionnée (« elles seront fusionnées »), sauf « Garder à part » */
      /* n° 10 : une phrase déjà gardée à part ne se fusionne pas en douce à son retour (la proposition n'est plus montrée, cf. `cadre`) */
      const tousMsg = lireMessages(magasin.lire());
      const garde = tousMsg.find(m => m.id === messageId)?.carnetMessage.gardeAPart
        || tousMsg.some(m => m.id !== messageId && m.carnetMessage.gardeAPart && memeTexte(m.carnetMessage.texte, txt));
      if (aidesRef.current.doublon && !garde) {
        for (const l of lignes) {
          if (l.sorte !== 'note' || !l.doublonDe) continue;
          const cid = an?.sorte === 'ici' ? an.carnetId : l.carnetId ?? depuis;
          const eff = lireMessages(magasin.lire()).find(m => m.id === messageId)?.carnetMessage.effets
            .find(e => e.cible === 'note' && e.carnetId === cid && e.id !== l.doublonDe);
          if (!cid || !eff) continue;
          const fu = appliquer(fusionnerNotes(magasin.lire(), { carnetId: cid, garderId: l.doublonDe, fusionnerId: eff.id, le: maintenant().toISOString() }));
          if (fu) fait.inverse.unshift(...fu.inverse);
        }
      }
      /* Annuler défait le rangement réel : l'écriture de l'IA, puis l'écriture locale qu'elle a remplacée. */
      /* Seule la branche où l'IA choisit le carnet neuf lui doit son titre ; ailleurs (créer, annoncé) le titre reste celui de la règle locale. */
      const titresIA = an ? undefined : lignes.flatMap(l => [l.carnetNeuf, l.titre]);
      const final = retourDe(messageId, txt, depuis, [...fait.inverse, ...(local?.inverse ?? [])], lignes, titresIA);
      /* le retour tenu en réserve paraît aussi quand l'IA réussit sans rien d'autre à dire (d1280-1) */
      if (!final) { if (local && !enAttente?.montre) setRetour(local); return; }
      /* P8 (tour 3) : le retour de ce message est déjà affiché (créer, note en vrac) : il n'est pas remplacé ; même clé, même bandeau,
         seul ce qu'Annuler défait s'étend à l'écriture de l'IA. Un toucher sur Annuler pendant que l'IA finit agit donc toujours. */
      const affiche = retourRef.current;
      if (affiche && affiche.messageId === messageId) {
        /* même sorte : le texte suit la réponse (d'où vient le titre), sous la même clé ; la ligne « Annuler » ne bouge pas. Test en
           ligne 2 : l'IA a rangé ailleurs que le carnet créé pendant l'attente : le retour dit où, sous la même clé */
        poserRetourEtat({ ...affiche, inverse: final.inverse, bandeau: final.bandeau, detail: final.detail,
          ...(final.bandeau.sorte !== affiche.bandeau.sorte ? { carnetId: final.carnetId } : {}) });
      }
      else setRetour(final);
      /* Test en ligne 2 (bloquant 4) : le carnet créé pendant l'attente a disparu (l'IA a rangé dans le carnet ouvert) : on y revient */
      if (enAttente?.montre && final.bandeau.sorte !== 'cree') {
        setEnTete(undefined); setVientDEtreCree(null);
        if (depuis) setVue({ sorte: 'carnet', id: final.carnetId ?? depuis });
      }
      if (final.bandeau.sorte === 'cree' && final.carnetId) {
        setEnTete(final.carnetId); setVientDEtreCree(final.carnetId);
        /* PCN-183/184 : écrit dans un carnet, le carnet neuf que l'IA confirme s'ouvre : on voit où la phrase est allée */
        if (!enAttente?.montre && final.carnetId !== depuis) setVue({ sorte: 'carnet', id: final.carnetId });
      } else if (final.bandeau.sorte === 'vrac') {
        /* la note en vrac reste sur la liste, avec ses lignes rangées (g5:v01-16) */
      } else if (!depuis) {
        /* rangé dans un carnet existant (ou en vrac) : le carnet local a disparu ; retour à la liste, sans carte « créée » en tête */
        setEnTete(undefined); setVientDEtreCree(null); setVue({ sorte: 'liste' });
      }
    }
  }), [mode, depuis, enLigne, magasin, appliquer, maintenant, p.appels, retourDe, setRetour, poserRetourEtat, poserAvis]);

  /** PCN-178/182 : où déplacer une note : les autres carnets, le plus proche de la note d'abord. */
  const autresPour = (id: string, texte: string) => {
    const autres = carnets.filter(x => x.id !== id && !x.carnet.archive);
    const proche = rattacher(texte, autres)?.carnetId;
    return [...autres].sort((a, b) => Number(b.id === proche) - Number(a.id === proche)).map(x => ({ id: x.id, titre: x.title }));
  };
  const lignesApercu = useMemo(() => (texte.trim() ? analyserTexte(texte) : []), [texte]);
  const envoyer = async () => {
    const txt = texte.trim();
    /* P7 : la photo jointe et prête part avec l'envoi (seule, ou avant le texte) ; en lecture, elle attend */
    const ph = jointe?.jpeg && !edition ? jointe.jpeg : null;
    if (!txt && !ph) return;
    if (ph) { setJointe(null); rangerPhoto(ph); }
    if (!txt) return;
    if (edition && ouvert) {
      const r = appliquer(modifierNote(magasin.lire(), { carnetId: ouvert.id, noteId: edition, texte: txt, le: maintenant().toISOString() }));
      if (r) setRetour({ bandeau: { sorte: 'modifiee' }, inverse: r.inverse, carnetId: ouvert.id });
      setEdition(null); setTexte(''); return;
    }
    gardeAPartRef.current = aPart && !!depuis; setAPart(false);
    aForcer.current = depuis && !edition ? corrige : null; setCorrige(null); setPresse(undefined);
    /* n° 3 : le carnet que le cadre a annoncé, par le même calcul, ou celui qu'il a choisi d'un toucher */
    const dEnvoi = ouvert && depuis ? destinationDans(txt, ouvert, carnets) : null;
    destEnvoi.current = dEnvoi ? corrigeCarnet ?? dEnvoi.carnetId : null;
    titreNeufEnvoi.current = destEnvoi.current === CARNET_NEUF && dEnvoi ? dEnvoi.titre : null;
    carnetChoisi.current = !!dEnvoi && !!corrigeCarnet;
    setCorrigeCarnet(null);
    setTexte('');
    envoiActif.current = { envoi: rangement, depuis };
    try { await rangement.envoyer(txt); } catch { setTexte(txt); }
  };
  const couperEnvoi = () => (envoiActif.current?.envoi ?? rangement).annuler();
  /**
   * Critique 6, n° 24 (D-113, D-142) : de retour en ligne, « Ranger maintenant » : chaque message gardé hors ligne passe à l'IA, dans le
   * carnet où il est (le carnet ouvert d'alors, ou celui qu'il a créé) ; rien ne bouge sans ce toucher.
   */
  const rangerMaintenant = async () => {
    const liste = aReprendre;
    setAReprendre([]);
    setIaManquee(m => Object.fromEntries(Object.entries(m).filter(([, s]) => s !== 'hors-ligne')));
    for (const m of liste) {
      const msg = lireMessages(magasin.lire()).find(x => x.id === m.messageId);
      if (!msg) continue;
      const ici = msg.carnetMessage.depuis !== 'liste' ? msg.carnetMessage.depuis : null;
      const cree = msg.carnetMessage.effets.find(e => e.cible === 'carnet')?.carnetId;
      if (ici) annonces.current.set(m.messageId, { sorte: 'ici', carnetId: ici });
      else if (cree && !plusieursLignes(m.texte)) {
        const titre = lireCarnets(magasin.lire(), { archives: true }).find(c => c.id === cree)?.title ?? titreDePhrase(m.texte);
        annonces.current.set(m.messageId, { sorte: 'cree', carnetId: cree, titre, phrase: m.texte });
      }
      envoiActif.current = { envoi: rangement, depuis };
      await rangement.reprendre(m.messageId, m.texte);
    }
  };
  const repriseNode = enLigne && aReprendre.length > 0 && etatR.etape !== 'en-cours' ? (
    <div className="cn-bandeau cnf-reprise" role="status" data-sorte="reprise">
      <div className="cn-bandeau-tete">
        <span className="cn-sp">De retour en ligne : {aReprendre.length} message{aReprendre.length > 1 ? 's' : ''} rangé{aReprendre.length > 1 ? 's' : ''} tel quel</span>
        <button type="button" className="cn-puce" onClick={() => void rangerMaintenant()}>Ranger maintenant</button>
      </div>
    </div>
  ) : null;
  /**
   * P7 (tour 3) : la photo choisie se joint au champ (« photo jointe · lecture… »), avant l'envoi, retirable d'un ✕. Rien n'est
   * rangé avant l'envoi ; une lecture finie après le ✕ est ignorée (jeton).
   */
  const photo = async (fichier: File) => {
    const jeton = (jetonJointe.current += 1);
    setJointe({ jeton });
    const jpeg = await reduirePhoto(fichier);
    if (jetonJointe.current !== jeton) return;
    if (!jpeg) { setJointe(null); p.onMessage?.('Photo illisible : rien n’a été rangé.'); return; }
    setJointe({ jeton, jpeg });
  };
  const retirerJointe = () => { jetonJointe.current += 1; setJointe(null); };
  const rangerPhoto = (jpeg: string) => {
    const etat = magasin.lire();
    const message = { id: nouvelIdCarnet('MSG'), texte: 'photo', le: maintenant().toISOString(), depuis: depuis ?? 'liste', rangement: 'brut' as const };
    const dest: Destination = depuis ? { carnetId: depuis } : { carnetNeuf: { id: nouvelIdCarnet('CARNET'), titre: 'Photo' } };
    const r = appliquer(ranger(etat, { message, lignes: [{ ...dest, sorte: 'photo', jpeg } as LigneARanger] }));
    if (!r) return;
    /* P21 : « ✓ Photo rangée ici · Annuler », là où elle est : le carnet ouvert, ou le carnet neuf qu'elle ouvre depuis la liste */
    setRetour(retourDe(message.id, message.texte, depuis, r.inverse) ?? { bandeau: { sorte: 'photo', ici: true }, inverse: r.inverse, messageId: message.id });
    if (!depuis && dest.carnetNeuf) { setEnTete(dest.carnetNeuf.id); setVientDEtreCree(dest.carnetNeuf.id); setVue({ sorte: 'carnet', id: dest.carnetNeuf.id }); }
  };
  /**
   * P34 : Annuler une suppression de note : la note revient, et le bandeau « Note supprimée · Annuler » part avec tout retour qui la
   * concernait (une seule vérité à l'écran : elle n'est plus supprimée).
   */
  const annulerSuppressionNote = (ns: { id: string; inverse: EcritureCarnet[] }) => {
    setNoteSupprimee(null);
    annuler(ns.inverse);
    const cur = retourRef.current;
    if (cur && (cur.bandeau.sorte === 'note-supprimee' || cur.bandeau.sorte === 'modifiee')) setRetour(null);
  };
  /** P33 (R20, g4:v01-11) : « ✎ Se modifie ici » à la place de la note modifiée, avec son texte ; ✕ Supprimer (G31). */
  const cadreModifier = (n: { id: string; texte: string }): React.ReactNode => {
    if (!ouvert) return null;
    const fermer = () => { setEdition(null); setTexte(''); };
    return <CadreArrivee cadre={{ sorte: 'modifier', texte: n.texte, onSupprimer: () => { const r = appliquer(supprimerNote(magasin.lire(), { carnetId: ouvert.id, noteId: n.id })); if (r) setNoteSupprimee({ id: n.id, inverse: r.inverse }); fermer(); } }} onAnnuler={fermer} aides={aides} />;
  };
  /** P23 : la puce proposée par l'IA, touchée : la ligne est rangée dans son carnet, sans `propose` (un message court la garde au fil). */
  const accepterProposee = (pr: Proposee) => {
    const r = appliquer(accepterProposition(magasin.lire(), { messageId: pr.messageId, index: pr.index }));
    if (r) setRetour({ bandeau: { sorte: 'range' }, inverse: r.inverse, carnetId: pr.carnetId });
  };

  /**
   * Critique 5, n° 26 (g4:v01-13) : « ✎ Se renomme ici » se pose à la place du titre, le carnet reste à l'écran, et le titre se tape dans
   * le champ du bas (« Renommer », « Annuler · Entrée = renommer »). G29 : prérempli par le titre proposé s'il existe et que l'aide est
   * allumée.
   */
  const propositionTitre = (c: CarnetDoc) => {
    const m = [...messages].reverse().find(x => x.carnetMessage.titrePropose?.carnetId === c.id && !x.carnetMessage.titrePropose.applique);
    return m ? { titre: m.carnetMessage.titrePropose!.titre, phrase: m.carnetMessage.texte, messageId: m.id } : null;
  };
  const ouvrirRenommer = (c: CarnetDoc) => {
    const pr = propositionTitre(c);
    const propose = titreProposeDe({ titre: c.title, aides, proposition: pr });
    setTitreEdite(propose ? propose.titre : c.title);
    setFeuille(null); setEdition(null);
    setVue({ sorte: 'renommer', id: c.id });
    setTimeout(() => champRef.current?.focus(), 0);
  };
  const renommerOuvert = (c: CarnetDoc, titre: string) => {
    const t = titre.trim();
    setVue({ sorte: 'carnet', id: c.id });
    if (!t || t === c.title) return;
    const pr = propositionTitre(c);
    const r = appliquer(renommer(magasin.lire(), { carnetId: c.id, titre: t, ...(pr ? { messageId: pr.messageId } : {}) }));
    if (r) setRetour({ bandeau: { sorte: 'renomme', avant: r.avant ?? c.title }, inverse: r.inverse, carnetId: c.id });
  };

  /* ---------- calculs passés aux vues (R44, R45, R47) ---------- */
  const tranche = ouvert ? critereQuiTranche(ouvert) : null;
  /* n° 5 et 21 : la bulle G8 seulement pour « ajouter · avant » (carnet au repos, champ pris et vide : ChampCarnet tient le focus) ;
     jamais sous un retour, une IA en cours ou une modification */
  const suggestion = tranche && vue.sorte === 'carnet' && !retour && etatR.etape !== 'en-cours' && !edition && !feuille
    ? { critere: tranche.critere.texte, a: tranche.entre[0], b: tranche.entre[1] } : null;
  const consequence = ouvert && lignesApercu.length ? consequenceApercu(ouvert, lignesApercu) : null;
  const auto = ouvert && vue.sorte === 'carnet' && !edition ? vaDansDe(texte) : null;
  /* n° 3 : le carnet visé pendant la frappe (même calcul qu'à l'envoi), corrigeable d'un toucher */
  const destCalculee = ouvert && vue.sorte === 'carnet' && !edition && texte.trim() ? destinationDans(texte, ouvert, carnets) : null;
  const destChoisie = destCalculee ? corrigeCarnet ?? destCalculee.carnetId : null;
  const titreDe = (id: string) => (id === CARNET_NEUF ? `Nouveau carnet ${destCalculee?.titre ?? ''}` : tous.find(c => c.id === id)?.title ?? '');
  const vers = ouvert && destChoisie && destChoisie !== ouvert.id ? titreDe(destChoisie) : undefined;
  const vaDansCarnet = ouvert && destCalculee && (destCalculee.carnetId !== ouvert.id || (corrigeCarnet && corrigeCarnet !== ouvert.id))
    ? { options: [...new Set([destCalculee.carnetId, corrigeCarnet, ouvert.id].filter((x): x is string => !!x))].map(id => ({ id, libelle: id === ouvert.id ? 'Ici' : titreDe(id) })),
      choisi: destChoisie!, onChoisir: (id: string) => setCorrigeCarnet(id) }
    : null;
  const rubriqueChoisie = auto ? corrige ?? auto : null;
  const RUBRIQUE_LIBELLE = { critere: 'Ce qui compte', facon: 'Façons', note: 'Notes' } as const;
  const liens: LienV[] = ouvert ? liensDe(ouvert, finances.plans, finances.transactions, finances.payments) : [];
  /* Critique 7, n° 5 : `estRealise` gouverne la liste, la fiche et Choisir ; un plan payé se dit réalisé et « Voir » ouvre Réalisés. */
  const sortieV = (c: CarnetDoc) => {
    const e = etatSortie(c, finances.plans, finances.transactions, finances.payments);
    return e && c.carnet.sortie ? { ...c.carnet.sortie, etat: e.sorte, realiseLe: e.sorte === 'realise' ? e.le : undefined } : null;
  };
  const enV = (c: CarnetDoc): CarnetV => { const s = sortieV(c); return s ? versV({ ...c, carnet: { ...c.carnet, sortie: s } } as CarnetDoc) : versV(c); };
  const voirSortie = (c: CarnetDoc | undefined) => (c && sortieV(c)?.etat === 'realise' && p.onVoirRealises ? p.onVoirRealises() : p.onVoirAVenir?.());
  /* R26 : le tableau vient de `comparer.ts`, passé tel quel aux vues ; `null` à 0 ou 1 article. */
  const tableauV = ouvert ? tableauDe(ouvert) : null;

  /* P25, P26 : une seule ligne d'état à la fois. Le retour de ce message est affiché (créer, note en vrac, IA éteinte, hors ligne, échec) :
     il est l'état ; ni roue dessous, ni « ✓ Rangé » en double. Sinon l'IA en cours se dit, puis s'efface à sa réponse. */
  const retourDuMessage = (messageId: string) => !!retour && retour.messageId === messageId;
  const cadre = (): React.ReactNode => {
    if (etatR.etape === 'en-cours') {
      if (etatR.lecture) {
        const c: CadreV = { sorte: 'lien', url: etatR.lecture.url, phase: 'lecture', depuisListe: (envoiActif.current?.depuis ?? depuis) === null };
        return <CadreArrivee cadre={c} onAnnuler={couperEnvoi} aides={aides} />;
      }
      /* n° 7 (g5:v01-15) : la note en vrac envoyée : « ✻ L'IA découpe votre note : 3 lignes, 2 carnets », la découpe annoncée dessous */
      const an = annonces.current.get(etatR.messageId);
      if (an?.sorte === 'vrac' && !retourDuMessage(etatR.messageId)) {
        return <NoteEnVrac etat="pendant" enCours lignes={an.vues} texteOrigine={etatR.texte} origine={mode === 'production' ? 'ia' : 'exemple'} nbCarnets={an.carnets} onAnnuler={couperEnvoi} />;
      }
      if (!retourDuMessage(etatR.messageId)) return <EtatIA etat="en-cours" quoi={etatR.texte} onAnnuler={couperEnvoi} />;
    }
    if ((etatR.etape === 'echec' || etatR.etape === 'hors-ligne') && !retourDuMessage(etatR.messageId) && !texte.trim()) {
      return <EtatIA etat={etatR.etape} quoi={AVIS_IA[etatR.etape]} />;
    }
    if (edition) return null;
    if (!texte.trim()) {
      /* P28 (R09) : Créer · avant, le champ de la liste pris, vide (g5:v03-2 ; G1 puces exemples ; G2 « Une note en vrac marche aussi. ») */
      /* jamais sous un retour affiché (une note en vrac rangée, un carnet supprimé) : une chose à la fois */
      /* la liste vide (figé p2:i02-2, lot B) dit déjà tout cela : rien en double */
      if (!depuis && focusListe && carnets.length > 0 && !retour && !supprime && etatR.etape !== 'en-cours') {
        return <CadreArrivee cadre={{ sorte: 'avant', exemples: EXEMPLES_CREER, onExemple: t => { setTexte(t); rangement.taper(t); champRef.current?.focus(); } }} onAnnuler={() => champRef.current?.blur()} aides={aides} />;
      }
      return null;
    }
    if (!depuis) {
      if (lignesApercu.length > 1) {
        /* la découpe annoncée : celle que l'envoi appliquera (même `planVrac`) ; le compteur compte le carnet neuf une fois */
        const plan = planVrac(lignesApercu, t => rattacher(t, carnets), prefixeDe(texte));
        return <NoteEnVrac etat="pendant" lignes={vuesVrac(plan)} texteOrigine={texte} origine="locale" nbCarnets={plan.carnets} onAnnuler={() => setTexte('')} />;
      }
      const pr = rattacher(texte, carnets);
      /* n° 2 : la phrase entière n'est pas son propre critère (« Ce qui compte » reste à l'IA), seulement un critère tiré d'elle */
      const critere = lignesApercu.find(l => l.sorte === 'critere' && !memeTexte(l.texte, texte));
      const c: CadreV = { sorte: 'creer', titre: titreDePhrase(texte),
        proche: pr ? { titre: pr.titre, onAjouter: () => setVue({ sorte: 'carnet', id: pr.carnetId }) } : null,
        ...(pr ? {} : { raisonNeuf: !estLienSeul(texte)
          ? `${aucunCarnetNEnParle(carnets.length)} : nouveau carnet, votre phrase en titre`
          : mode !== 'eteint' && enLigne
            ? 'L’IA lit la page, puis range le lien dans le carnet qui en parle, sinon dans un nouveau, nommé d’après le besoin'
            : `${aucunCarnetNEnParle(carnets.length)} : nouveau carnet, le site en titre` }),
        ...(critere ? { ceQuiCompte: critere.texte } : {}) };
      return <CadreArrivee cadre={c} onAnnuler={() => setTexte('')} aides={aides} />;
    }
    const l0 = lignesApercu[0];
    if (l0?.url) return <CadreArrivee cadre={{ sorte: 'lien', url: l0.url, phase: 'avant', lecturePossible: mode !== 'eteint' && enLigne }} onAnnuler={() => setTexte('')} aides={aides} />;
    const rubrique = rubriqueChoisie ? RUBRIQUE_LIBELLE[rubriqueChoisie] : l0?.sorte === 'critere' ? 'Ce qui compte' : l0?.sorte === 'article' ? 'Articles' : 'Notes';
    /* P18 (G11) : la phrase répète une note du carnet (`doublons.ts`, pendant la frappe) : « Même chose que la note du … · Garder à part » */
    /* n° 10 : une phrase déjà gardée à part (message `gardeAPart`) ne repropose pas la fusion ; la note visée doit être dans le carnet
       où la phrase va (un autre carnet annoncé, n° 3 : pas de fusion proposée ici) */
    const dejaAPart = messages.some(m => m.carnetMessage.gardeAPart && memeTexte(m.carnetMessage.texte, texte));
    const dbl = aides.doublon && !aPart && !dejaAPart && !vers && ouvert ? doublonsDe(texte, ouvert.carnet.notes)[0] : undefined;
    const noteDbl = dbl && ouvert ? ouvert.carnet.notes.find(n => n.id === dbl.noteId) : undefined;
    const leDbl = noteDbl ? dateCourte(noteDbl.modifieeLe ?? messages.find(m => m.id === noteDbl.messageId)?.carnetMessage.le ?? ouvert?.carnet.creeLe) : null;
    const doublon = noteDbl ? { le: leDbl ?? '', texte: noteDbl.texte, onGarderAPart: () => setAPart(true) } : null;
    return <CadreArrivee cadre={{ sorte: 'texte', rubrique, texte, origine: 'locale', ...(vers ? { vers } : {}) }} onAnnuler={() => { setTexte(''); setAPart(false); setCorrigeCarnet(null); }} consequence={vers ? null : consequence} aides={aides} doublon={doublon} />;
  };
  /**
   * R14, R17, R25 : la ligne qu'un message vient de ranger dans le carnet ouvert s'éclaire à sa place, sa phrase citée dessous ; pour un
   * article lu sur sa page, la carte complète (« lu sur la page : … », « tient 80 °C : oui »). Un seul effet dans ce carnet, sinon le
   * bandeau seul (note en vrac, critère fusionné).
   */
  const rangee: RangeeV | null = (() => {
    /* avec un avis (IA éteinte, hors ligne, échec), le bandeau seul : il porte l'avis et ce qui a été rangé, où (P22) */
    if (!retour?.messageId || retour.avis || !ouvert || vue.sorte !== 'carnet' || retour.bandeau.sorte !== 'range') return null;
    const msg = messages.find(m => m.id === retour.messageId);
    const effets = (msg?.carnetMessage.effets ?? []).filter(e => e.carnetId === ouvert.id && e.cible !== 'carnet' && e.cible !== 'photo');
    if (effets.length !== 1) return null;
    const e = effets[0];
    const base = { cible: e.cible as RangeeV['cible'], id: e.id, phrase: msg!.carnetMessage.texte, onAnnuler: () => annulerRetour(retour) };
    if (e.cible !== 'article') return ['critere', 'facon', 'note'].includes(e.cible) && ouvert.carnet[e.cible === 'critere' ? 'criteres' : e.cible === 'facon' ? 'facons' : 'notes'].some(x => x.id === e.id) ? base : null;
    const a = ouvert.carnet.articles.find(x => x.id === e.id);
    if (!a || a.lecture !== 'lue' || !a.url) return null;
    const luSurPage = [a.nom && 'nom', a.prixCentimes !== undefined && 'prix', a.photo && 'photo', ...Object.keys(a.valeurs)].filter((x): x is string => !!x);
    const k = ouvert.carnet.criteres.find(x => x.caracteristique?.sens === 'oui-non' && passe(a, x) !== null);
    const verdict = k ? `${k.caracteristique!.nom} : ${passe(a, k) ? 'oui' : 'non'}` : undefined;
    /* critique 6, n° 12 (R26, G20) : le bandeau dit le rang (« 1re de sa façon, devant Hotte inox 120 cm ») ; `rang` suit la ligne (LigneRangee) */
    const rang = tableauV ? rangDuLien(tableauV, a.id, ouvert.carnet.articles) : null;
    return Object.assign({ ...base, luSurPage, ...(verdict ? { verdict } : {}) }, rang ? { rang } : {});
  })();
  /** Annuler un retour : l'IA encore en route pour ce message est coupée d'abord (rien n'est réécrit après), puis tout est défait. */
  function annulerRetour(vu: Retour) {
    /* P8 : le retour tel qu'il est maintenant (l'IA a pu l'étendre pendant le toucher), sous la même clé */
    const rt = retourRef.current && retourRef.current.id === vu.id ? retourRef.current : vu;
    if (rt.messageId && attente.current?.messageId === rt.messageId) {
      attente.current = null;
      annonces.current.delete(rt.messageId);
      couperEnvoi();
    }
    annuler(rt.inverse); setRetour(null);
    /* le carnet créé n'existe plus : retour à la liste (s'il était ouvert, l'effet « carnet disparu » le fait aussi) */
    if (rt.bandeau.sorte === 'cree') { setEnTete(undefined); setVientDEtreCree(null); if (!depuis || depuis === rt.carnetId) setVue({ sorte: 'liste' }); }
  };
  /**
   * R19 (g5:v01-16) : la note en vrac, après. « ✓ n lignes rangées dans m carnets · Annuler », chaque ligne avec son type et son carnet,
   * « › Texte d'origine ». Lu sur les effets du message tels qu'ils sont (n et m comptés là, les mêmes que pendant quand l'IA a suivi
   * l'annonce).
   */
  const vracApres = (rt: Retour): React.ReactNode => {
    const msg = messages.find(m => m.id === rt.messageId);
    if (!msg) return null;
    const effets = msg.carnetMessage.effets;
    const crees = new Set(effets.filter(e => e.cible === 'carnet').map(e => e.carnetId));
    const lignes: LigneVracV[] = effets.filter(e => e.cible !== 'carnet' && e.cible !== 'photo').flatMap(e => {
      const c = tous.find(x => x.id === e.carnetId);
      if (!c) return [];
      const d = c.carnet;
      const el = e.cible === 'note' ? d.notes.find(x => x.id === e.id) : undefined;
      const texteL = el?.texte ?? (e.cible === 'critere' ? d.criteres.find(x => x.id === e.id)?.texte
        : e.cible === 'facon' ? d.facons.find(x => x.id === e.id)?.nom
          : e.cible === 'article' ? (() => { const a = d.articles.find(x => x.id === e.id); return a ? nomArticle(a) : undefined; })() : undefined);
      if (!texteL) return [];
      const genre = (el?.genre ?? (e.cible === 'article' ? 'a-acheter' : e.cible === 'critere' ? 'critere' : e.cible === 'facon' ? 'facon' : 'note')) as LigneVracV['genre'];
      return [{ id: e.id, cible: e.cible as LigneVracV['cible'], texte: texteL, genre, carnetId: c.id, carnetTitre: c.title, neuf: crees.has(c.id) }];
    });
    const origine = msg.carnetMessage.rangement === 'ia' ? 'ia' : msg.carnetMessage.rangement === 'simulee' ? 'exemple' : 'locale';
    /* P11 (g5:v01-16) : chaque ligne se corrige d'un toucher, type ▾ et carnet ▾ ; Annuler défait aussi ces corrections */
    const etendre = (r: (Resultat & { ok: true }) | null) => {
      const cur = retourRef.current;
      if (r && cur && cur.id === rt.id) poserRetourEtat({ ...cur, inverse: [...r.inverse, ...cur.inverse] });
    };
    return <NoteEnVrac etat="apres" lignes={lignes} texteOrigine={msg.carnetMessage.texte} origine={origine} avis={rt.avis ?? null}
      nbCarnets={new Set(lignes.map(l => l.carnetId)).size} onAnnuler={() => annulerRetour(rt)}
      carnets={carnets.map(c => ({ id: c.id, titre: c.title }))}
      onChangerGenre={(id, g) => { const l = lignes.find(x => x.id === id); if (l?.carnetId) etendre(appliquer(changerGenre(magasin.lire(), { carnetId: l.carnetId, noteId: id, genre: g as GenreNote }))); }}
      onChangerCarnet={(id, vers) => { const l = lignes.find(x => x.id === id); if (l?.carnetId && l.cible) etendre(appliquer(deplacer(magasin.lire(), { cible: l.cible, id, depuis: l.carnetId, vers }))); }} />;
  };
  const bandeauNode = retour && !rangee && (!retour.carnetId || retour.carnetId === idOuvert || vue.sorte === 'liste')
    ? retour.bandeau.sorte === 'vrac' && retour.messageId && vue.sorte === 'liste'
      ? <React.Fragment key={retour.id}>{vracApres(retour)}</React.Fragment>
      : <Bandeau key={retour.id} bandeau={retour.bandeau} onAnnuler={() => annulerRetour(retour)} aideConsequence={aides.consequence}
        {...(retour.avis ? { avis: retour.avis, ...(retour.detail ? { detail: retour.detail } : {}) } : {})} />
    : null;
  /* P23 (D-35) : les puces proposées par l'IA pour le carnet ouvert, sous le bandeau ; elles restent jusqu'au toucher ou au ✕ */
  const pucesProposees: Proposee[] = ouvert && vue.sorte === 'carnet'
    ? messages.flatMap(m => (m.carnetMessage.propositions ?? []).map((pp, index) => ({ cle: `${m.id}:${index}:${pp.texte}`, messageId: m.id, index, carnetId: pp.carnetId, ligne: pp })))
      .filter(x => x.carnetId === ouvert.id && !ecartees.has(x.cle))
    : [];
  const proposeesNode = pucesProposees.length ? (
    <div className="cnf-proposees" role="group" aria-label="Proposé par l’IA">
      {pucesProposees.map(x => (
        <span key={x.cle} className="cnf-proposee">
          <span className="cnf-proposee-ia" aria-hidden>✻</span>
          <span className="cnf-proposee-texte">{libelleProposee(x.ligne)}{x.ligne.origine === 'exemple' && <span className="cn-exemple"> exemple</span>}</span>
          <button type="button" className="cn-puce cn-puce-ia" onClick={() => accepterProposee(x)}>Ajouter</button>
          <button type="button" className="cn-x" aria-label={`Écarter « ${libelleProposee(x.ligne)} »`} onClick={() => setEcartees(s => new Set(s).add(x.cle))}>×</button>
        </span>
      ))}
    </div>
  ) : null;

  const renomme = vue.sorte === 'renommer' && ouvert ? ouvert : null;
  const champ = renomme ? (
    /* n° 26 (g4:v01-13) : le titre dans le champ du bas, « Renommer », puis « Annuler · Entrée = renommer » */
    <ChampCarnet valeur={titreEdite} inputRef={champRef} onChange={setTitreEdite} onEnvoyer={() => renommerOuvert(renomme, titreEdite)}
      titreCarnet={renomme.title} libelleEnvoi="Renommer"
      pied={<div className="cnf-renommer-pied"><button type="button" className="cn-lien" onClick={() => setVue({ sorte: 'carnet', id: renomme.id })}>Annuler</button><span className="cn-sp" /><span className="cn-mut">Entrée = renommer</span></div>} />
  ) : (
    <ChampCarnet valeur={texte} inputRef={champRef}
      onChange={t => { setTexte(t); if (!t.trim()) { setCorrige(null); setCorrigeCarnet(null); } if (!edition) rangement.taper(t); }}
      onEnvoyer={() => void envoyer()}
      vaDansCarnet={vaDansCarnet}
      {...(ouvert && vue.sorte !== 'liste' ? { titreCarnet: ouvert.title, libelleEnvoi: edition ? 'Enregistrer' : 'Ajouter' } : {})}
      onBlurChamp={plierApresToucher}
      onPhoto={f => void photo(f)}
      jointe={jointe ? { lecture: !jointe.jpeg, ...(jointe.jpeg ? { apercu: jointe.jpeg } : {}) } : null}
      onRetirerJointe={retirerJointe}
      suggestion={vue.sorte === 'carnet' ? suggestion : null}
      vaDans={auto ? { options: [...PUCES_VA_DANS], choisi: rubriqueChoisie!, onChoisir: id => setCorrige(id as RubriqueVaDans) } : null}
      coller={presse} onColler={() => { if (presse) { setTexte(presse); rangement.taper(presse); setPresse(undefined); } }}
      onFocusChamp={() => { clearTimeout(pliage.current); setFocusListe(true); void lirePresse().then(setPresse); }}
      desactive={vue.sorte === 'supprimer'} />
  );

  /** Le picto de l'objet (lot B) quand l'article n'a pas de photo : déduit du nom, de la façon, puis du carnet. */
  const pictoArticle = (c: { title: string; carnet: { facons: readonly { id: string; nom?: string }[] } }, a: { nom?: string; faconId?: string; photo?: string }) =>
    a.photo ? undefined : <PictoObjet nom={pictoDe(a.nom, c.carnet.facons.find(f => f.id === a.faconId)?.nom, c.title)} taille={24} />;
  const pictosDe = (c: { title: string; carnet: { articles: readonly { id: string; nom?: string; faconId?: string; photo?: string }[]; facons: readonly { id: string; nom?: string }[] } }) =>
    Object.fromEntries(c.carnet.articles.map(a => [a.id, pictoArticle(c, a)] as const).filter(([, v]) => v));

  /* ---------- écrans ---------- */
  let ecran: React.ReactNode;
  if (!ouvert || vue.sorte === 'liste') {
    ecran = <ListeCarnets carnets={carnets.map(enV)}enTete={enTete} messageRecent={retour?.bandeau.sorte === 'vrac' ? (retour.messageId ?? null) : null}
      supprime={supprime ? { titre: supprime.titre, statut: supprime.statut, onAnnuler: () => { annuler(supprime.inverse); setSupprime(null); } } : null}
      enHaut={<>{repriseNode}{bandeauNode}{cadre()}</>}
      onOuvrir={id => { setVue({ sorte: 'carnet', id }); setRetour(null); }}
      onCollerLien={id => { setVue({ sorte: 'carnet', id }); setTimeout(() => champRef.current?.focus(), 0); }}
      onVoirAVenir={id => voirSortie(carnets.find(c => c.id === id))}
      onExemple={t => { setTexte(t); rangement.taper(t); champRef.current?.focus(); }} />;
  } else if (vue.sorte === 'article') {
    const a = ouvert.carnet.articles.find(x => x.id === vue.articleId);
    const ligne = tableauV?.lignes.find(l => l.articleId === vue.articleId);
    ecran = a ? <FicheArticle article={a as unknown as ArticleV} titreCarnet={ouvert.title} critere={ouvert.carnet.criteres[0]}
      facon={ouvert.carnet.facons.find(f => f.id === a.faconId)} {...(ligne?.rang ? { rang: ligne.rang, sur: tableauV!.lignes.filter(l => !l.ecarte).length } : {})}
      choisi={ouvert.carnet.choix?.articleId === a.id}
      onRetour={() => setVue({ sorte: 'carnet', id: ouvert.id })}
      onVeille={() => { appliquer(basculerVeille(magasin.lire(), { carnetId: ouvert.id, articleId: a.id, le: maintenant().toISOString() })); }}
      carnet={ouvert.carnet as never} onOffre={articleId => setVue({ sorte: 'article', id: ouvert.id, articleId })}
      onChoisir={() => setVue({ sorte: 'choisir', id: ouvert.id })} /> : null;
  } else if (vue.sorte === 'comparer') {
    ecran = <Comparer titre={ouvert.title} statut={ouvert.status} critere={ouvert.carnet.criteres[0]} tableau={tableauV}
      onRetour={() => setVue({ sorte: 'carnet', id: ouvert.id })} onOuvrirArticle={articleId => setVue({ sorte: 'article', id: ouvert.id, articleId })}
      nonLus={nonLusDe(ouvert.carnet.articles as never)} pictos={pictosDe(ouvert)}
      onChoisir={() => setVue({ sorte: 'choisir', id: ouvert.id })} />;
  } else if (vue.sorte === 'choisir') {
    const choix = ouvert.carnet.choix;
    const nom = (id: string) => { const a = ouvert.carnet.articles.find(x => x.id === id); return a?.nom ?? a?.domaine ?? 'lien'; };
    if (choix) {
      const a = ouvert.carnet.articles.find(x => x.id === choix.articleId)!;
      ecran = <Choisir etape="choisi" titre={ouvert.title} choix={choix as never} article={a as unknown as ArticleV} critere={ouvert.carnet.criteres[0]} carnet={ouvert.carnet as never} picto={pictoArticle(ouvert, a)}
        facon={ouvert.carnet.facons.find(f => f.id === (choix.faconId ?? a?.faconId))} ecartes={choix.ecartes.map(e => ({ nom: nom(e.articleId), raison: e.raison }))}
        remplaces={choix.remplaces.map(r => ({ nom: nom(r.articleId), pourquoi: r.pourquoi, le: r.le }))} sortie={sortieV(ouvert)}
        onRetour={() => setVue({ sorte: 'carnet', id: ouvert.id })} onEnvoyerAVenir={() => void envoyerAVenir(ouvert)} onVoirAVenir={() => voirSortie(ouvert)} />;
    } else {
      const rangees = (tableauV?.lignes ?? []).filter(l => !l.ecarte);
      /* critique 6, n° 4 : « Retenir la hotte » : le premier de cette façon (g05-11), sinon le premier du tableau */
      const faconVoulue = vue.faconId;
      const dansFacon = faconVoulue ? rangees.find(l => ouvert.carnet.articles.find(x => x.id === l.articleId)?.faconId === faconVoulue) : undefined;
      const premier = ouvert.carnet.articles.find(x => x.id === (dansFacon ?? rangees[0])?.articleId) ?? ouvert.carnet.articles[0];
      ecran = premier ? <Choisir etape="choisir" titre={ouvert.title} carnet={ouvert.carnet as never} picto={pictoArticle(ouvert, premier)} article={premier as unknown as ArticleV} sur={Math.max(rangees.length, 1)} valeurs={[]}
        autres={rangees.slice(1).map((l, i) => ({ article: ouvert.carnet.articles.find(x => x.id === l.articleId) as unknown as ArticleV, rang: l.rang ?? i + 2 }))}
        onRetour={() => setVue({ sorte: 'carnet', id: ouvert.id })}
        onChoisir={pourquoi => { const r = appliquer(choisir(magasin.lire(), { carnetId: ouvert.id, articleId: premier.id, ...(premier.faconId ? { faconId: premier.faconId } : {}), pourquoi, le: maintenant().toISOString() })); if (r) setRetour({ bandeau: { sorte: 'range' }, inverse: r.inverse, carnetId: ouvert.id }); }}
        onEcarter={() => setVue({ sorte: 'comparer', id: ouvert.id })} /> : null;
    }
  } else {
    const c = ouvert;
    const note = feuille ? c.carnet.notes.find(n => n.id === feuille) : undefined;
    const noteEditee = edition && vue.sorte === 'carnet' ? c.carnet.notes.find(n => n.id === edition) : undefined;
    const enVeille = c.carnet.articles.filter(a => a.veille?.active).map(a => a.id);
    /* P20 (G35) : le carnet proche de celui qu'on supprime (`carnetProche`, lot A), pour y déplacer ses articles en veille */
    const proche = vue.sorte === 'supprimer' && enVeille.length ? carnetProche(c, carnets) : null;
    const finance = { plans: finances.plans, transactions: finances.transactions, payments: finances.payments };
    /* P9 (g4:v02-18) : la carte de suppression prend la place du bandeau, sous le titre et la phrase, au-dessus de Ce qui compte : à
       l'écran sans défiler ; le reste du carnet est estompé derrière (`.cn-grise`, qui épargne `.cn-supprimer`). */
    const carteSupprimer = vue.sorte !== 'supprimer' ? null : <SupprimerCarnet titre={c.title} contenu={c.carnet as never}
      liens={liensQuiRetiennent(c, finance.plans, finance.transactions, finance.payments)}
      proche={proche ? { titre: proche.titre, onDeplacer: () => { appliquer(deplacerArticles(magasin.lire(), { depuis: c.id, vers: proche.carnetId, articleIds: enVeille })); } } : null}
      onDetacher={() => { appliquer(detacherPlan(magasin.lire(), { carnetId: c.id, ...finance })); }}
      onArchiver={() => { const r = appliquer(archiverCarnet(magasin.lire(), { carnetId: c.id, le: maintenant().toISOString(), raison: 'plan réalisé' })); if (r) { setVue({ sorte: 'liste' }); setRetour({ bandeau: { sorte: 'range' }, inverse: r.inverse }); } }}
      onSupprimer={() => { const r = appliquer(supprimerCarnet(magasin.lire(), { carnetId: c.id, ...finance })); if (r) { setSupprime({ titre: c.title, statut: c.status, inverse: r.inverse }); setVue({ sorte: 'liste' }); } }}
      onGarder={() => setVue({ sorte: 'carnet', id: c.id })} />;
    /* n° 26 : renommer garde l'en-tête et le contenu ; le cadre se pose à la place du titre (carnets-fil.css, `.cnf-renommer`) */
    const cadreRenommer = vue.sorte === 'renommer' ? (() => {
      const pr = propositionTitre(c);
      return <RenommerCarnet titre={c.title} aides={aides} proposition={pr} champBas={{ valeur: titreEdite }} onRenommer={t => renommerOuvert(c, t)} onAnnuler={() => setVue({ sorte: 'carnet', id: c.id })} />;
    })() : null;
    /* n° 2 (g5:v04-4) : un seul bandeau après la création ; les puces proposées attendent qu'il parte */
    const proposees = retour?.bandeau.sorte === 'cree' ? null : proposeesNode;
    /* n° 24 : l'IA n'est pas passée pour ce carnet (éteinte, hors ligne, échec du dernier envoi) ; prop du lot B, passée telle quelle */
    const manque = iaManquee[c.id];
    const iaIndisponible = mode === 'eteint' ? 'eteinte' : !enLigne ? 'hors-ligne' : manque === 'eteint' ? 'eteinte' : manque ?? null;
        ecran = <>
      <CarnetOuvert carnet={enV(c)}aides={aides as never} liens={liens} tableau={tableauV} iaIndisponible={iaIndisponible}
        bandeau={cadreRenommer ?? carteSupprimer ?? (repriseNode || bandeauNode || proposees ? <>{repriseNode}{bandeauNode}{proposees}</> : null)} rangee={carteSupprimer || cadreRenommer ? null : rangee} cadre={carteSupprimer || cadreRenommer ? null : cadre()}
        vientDEtreCree={vientDEtreCree === c.id} doublons={aides.doublon ? notesEnDouble(c).flat() : []}
        noteSupprimee={noteSupprimee ? { id: noteSupprimee.id, onAnnuler: () => annulerSuppressionNote(noteSupprimee) } : null}
        feuille={noteEditee ? { noteId: noteEditee.id, contenu: cadreModifier(noteEditee) } : note ? { noteId: note.id, contenu: <FeuilleNote note={note as never} aides={aides as never}
          ressembleCritere={aides.noteEnCritere && analyserLigne(note.texte).sorte === 'critere'}
          onPasserCritere={() => { appliquer(noteEnCritere(magasin.lire(), { carnetId: c.id, noteId: note.id })); setFeuille(null); }}
          onModifier={() => { setEdition(note.id); setTexte(note.texte); setFeuille(null); setTimeout(() => champRef.current?.focus(), 0); }}
          onChangerEnFacon={() => { appliquer(changerSorte(magasin.lire(), { carnetId: c.id, cible: 'note', id: note.id, vers: 'facon' })); setFeuille(null); }}
          onChangerEnCritere={() => { appliquer(changerSorte(magasin.lire(), { carnetId: c.id, cible: 'note', id: note.id, vers: 'critere' })); setFeuille(null); }}
          onSupprimer={() => { const r = appliquer(supprimerNote(magasin.lire(), { carnetId: c.id, noteId: note.id })); if (r) setNoteSupprimee({ id: note.id, inverse: r.inverse }); setFeuille(null); }}
          carnets={autresPour(c.id, note.texte)}
          onDeplacer={vers => { const titre = carnets.find(x => x.id === vers)?.title ?? 'un autre carnet'; const r = appliquer(deplacer(magasin.lire(), { cible: 'note', id: note.id, depuis: c.id, vers })); if (r) setRetour({ bandeau: { sorte: 'ailleurs', carnet: titre }, inverse: r.inverse, carnetId: c.id }); setFeuille(null); }}
          onFermer={() => setFeuille(null)} /> } : null}
        grise={vue.sorte === 'supprimer'}
        onRetour={() => { setVue({ sorte: 'liste' }); setVientDEtreCree(null); }}
        onRenommer={() => ouvrirRenommer(c)}
        onSupprimer={() => setVue({ sorte: 'supprimer', id: c.id })}
        onNote={id => setFeuille(f => (f === id ? null : id))}
        onOuvrirArticle={articleId => setVue({ sorte: 'article', id: c.id, articleId })}
        onComparer={() => setVue({ sorte: 'comparer', id: c.id })}
        onRetenirFacon={faconId => setVue({ sorte: 'choisir', id: c.id, faconId })}
        onVeille={articleId => { appliquer(basculerVeille(magasin.lire(), { carnetId: c.id, articleId, le: maintenant().toISOString() })); }}
        onVoirChoix={() => setVue({ sorte: 'choisir', id: c.id })}
        onEnvoyerAVenir={() => void envoyerAVenir(c)}
        onOuvrirLien={l => (l.sorte === 'realise' && p.onVoirRealises ? p.onVoirRealises() : p.onVoirAVenir?.())} />
    </>;
  }

  /** « Envoyer dans À venir » (R32) : un seul plan (clé `PLAN-CARNET-<id>`), puis le carnet le retient ; aucun montant ici. */
  async function envoyerAVenir(c: CarnetDoc) {
    const le = maintenant().toISOString();
    const plan = planDepuisChoix(c, { le });
    if (!plan) { p.onMessage?.('Choisissez d’abord un article.'); return; }
    if (!finances.plans.some(x => x.id === plan.id)) await (p.ecrirePlan ?? ((pl: FinancialPlan) => FinanceService.saveUpgrade(pl)))(plan);
    const r = appliquer(poserSortie(magasin.lire(), { carnetId: c.id, planId: plan.id, le }));
    if (r) p.onMessage?.('Dans À venir.');
  }

  return (
    <div className={`cn ${p.className ?? ''}`} data-carnets data-vue={vue.sorte} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{ecran}</div>
      {champ}
    </div>
  );
}
