/**
 * D451, voie « afaire » : les règles de l'écran « À faire » (Cette semaine, Fin du mois, Un jour) et de la carte « À ranger » (imprévus).
 * Pures : aucune lecture de magasin, aucun effet. Les groupes se calculent dans le domaine (`aFaireDe`, src/domain/carnets/taches.ts) ;
 * ici : leurs libellés, le coût d'une ligne, le lien « dans À venir », les échéances qu'on propose, le plan d'un achat daté, et la
 * proposition de la carte « À ranger » (option B de la décision « photo seule », PLAN.md : le problème ouvert touché en dernier, sans
 * lire la photo).
 *
 * Honnêteté : un coût absent (ou nul) n'est pas dit ; un coût estimé garde son « ≈ » ; la proposition ne décrit jamais une photo
 * (aucune IA ne l'a lue) et sa raison est ce que l'on sait : la date de la dernière écriture, pas une ouverture à l'écran.
 */
import { ajouterJours, dimancheDe, ecartJours, jourLisible, lundiDe } from '../../domain/calendrier/dates';
import { prixTexte } from '../../domain/carnets/comparer';
import { plier } from '../../domain/carnets/domaines';
import type { CarnetDoc, MessageDoc, PrecisionTache, Tache } from '../../domain/carnets/modele';
import { idPlanDuCarnet, planAuCalendrier, planSuitCarnet } from '../../domain/carnets/operations';
import { etatDe, genreDe, jourLocal, optionRetenue } from '../../domain/carnets/suivi';
import { echeanceDe, finDuMois, type CleGroupe, type TacheVue } from '../../domain/carnets/taches';
import type { FinancialPlan } from '../../domain/finance/types';

/** Un instant, ou l'horloge de la vue (`maintenant` de CarnetsVue : une fonction qui rend la date). */
export type Maintenant = string | number | Date | (() => string | number | Date);

/** Le jour (AAAA-MM-JJ) d'un instant, à l'heure locale (Europe/Zurich sur l'appareil du brasseur). */
export const aujourdhuiDe = (m: Maintenant): string => {
  const v = typeof m === 'function' ? m() : m;
  return typeof v === 'string' ? jourLocal(v) : jourLocal(new Date(v).toISOString());
};

/* ---------- groupes ---------- */

/** Les libellés de la maquette ; « Plus loin » : les mois suivants, que la maquette ne montre pas (sinon ces tâches datées seraient perdues). */
export const LIBELLE_GROUPE: Record<CleGroupe, string> = {
  'cette-semaine': 'Cette semaine', 'fin-du-mois': 'Fin du mois', 'plus-loin': 'Plus loin', 'un-jour': 'Un jour'
};
export const libelleGroupe = (cle: CleGroupe): string => LIBELLE_GROUPE[cle];

/* ---------- coût ---------- */

export interface JetonCout { texte: string; estime: boolean }

/**
 * Le coût d'une tâche tel que le dit le jeton : « 540 CHF », ou « ≈ 35 CHF » s'il est estimé. Absent ou nul : `null` (jamais « 0 CHF » :
 * un coût inconnu ne se dit pas). Autre devise : sa devise (« 45 EUR »), jamais convertie ici.
 */
export function coutDeTache(t: Pick<Tache, 'coutCentimes' | 'devise' | 'coutEstime'>): JetonCout | null {
  if (!(typeof t.coutCentimes === 'number' && t.coutCentimes > 0)) return null;
  const texte = prixTexte(t.coutCentimes, t.devise ?? 'CHF');
  if (texte === null) return null;
  return { texte: t.coutEstime ? `≈ ${texte}` : texte, estime: !!t.coutEstime };
}

/**
 * Un montant ferme qui vient d'un devis du fil (jeton « devis » du message d'origine, même montant) n'est pas une dépense à venir : la
 * maquette le dit dans la sous-ligne (« Écoulement · 850 CHF »), pas en jeton vert. Sans message d'origine, ou sans jeton : jeton.
 */
export function montantDUnDevis(t: Pick<TacheVue, 'carnetId' | 'messageId' | 'coutCentimes' | 'coutEstime'>, messages: readonly MessageDoc[]): boolean {
  if (!t.messageId || t.coutEstime || !(typeof t.coutCentimes === 'number' && t.coutCentimes > 0)) return false;
  const m = messages.find(x => x.id === t.messageId);
  return !!m?.carnetMessage.etiquettes?.some(e => e.sorte === 'devis' && e.carnetId === t.carnetId && e.montantCentimes === t.coutCentimes);
}

/* ---------- lien « dans À venir » ---------- */

type PlanLu = Pick<FinancialPlan, 'id' | 'status'>;
const planActif = (plans: readonly PlanLu[], id: string): boolean => plans.some(p => p.id === id && (p.status === 'draft' || p.status === 'active'));

/**
 * « dans À venir » : la tâche porte un plan (`planId`) encore vivant, ou c'est l'achat de l'option retenue du carnet et son plan
 * `PLAN-CARNET-<id>` (un seul par carnet) est dans À venir. Un plan annulé ou payé ne se dit plus. Une tâche lue du Planning : jamais.
 */
export function dansAVenir(t: Pick<TacheVue, 'carnetId' | 'planId' | 'optionId' | 'derivee'>, c: CarnetDoc | undefined, plans: readonly PlanLu[]): boolean {
  if (t.derivee) return false;
  if (t.planId) return planActif(plans, t.planId);
  const retenue = c ? optionRetenue(c) : undefined;
  return !!retenue && t.optionId === retenue.id && planActif(plans, idPlanDuCarnet(t.carnetId));
}

/**
 * L'achat daté d'une tâche → son plan d'À venir (et donc le Calendrier), clé idempotente `PLAN-CARNET-<id>` : un seul plan par carnet, celui
 * de l'option retenue ; ses prix et date suivent la tâche. Une tâche sans coût (un appel) ou un autre achat restent des tâches (`null`). Pas d'écriture ici :
 * l'appelant écrit le plan (`ecrirePlan`) et, s'il vient d'être créé, la sortie du carnet (`poserSortie`).
 */
export function planDeLAchat(c: CarnetDoc, t: Tache, le: string): FinancialPlan | null {
  const retenue = optionRetenue(c);
  if (!retenue || t.optionId !== retenue.id || !t.echeance || t.faiteLe) return null;
  const centimes = typeof t.coutCentimes === 'number' && t.coutCentimes > 0 && (t.devise ?? 'CHF') === 'CHF' ? t.coutCentimes : undefined;
  /* C67-6 : seul un ACHAT, qui a un coût, entre dans À venir ; un appel, une visite ou un contrôle datés restent une tâche (jamais un plan sans montant) */
  if (centimes === undefined) return null;
  return planSuitCarnet(planAuCalendrier(c, { le, date: t.echeance }), { date: t.echeance, precision: t.precision ?? 'semaine', centimes });
}

/* ---------- changer l'échéance ---------- */

export type CleEcheance = 'cette-semaine' | 'semaine-prochaine' | 'fin-du-mois' | 'mois-prochain' | 'un-jour';
/** `date` : un jour de la période, à donner tel quel à `poserEcheance` (qui range au lundi) ; `echeance` : ce lundi, tel que la tâche le porte. */
export interface ChoixEcheance { cle: CleEcheance; libelle: string; date: string | null; precision: PrecisionTache; echeance: string | null }

/**
 * Les échéances qu'on propose, depuis `maintenant` : cette semaine, la semaine prochaine, fin du mois, le mois prochain, un jour (sans date).
 * « Fin du mois » disparaît quand la semaine courante est déjà la dernière du mois (même échéance que « Cette semaine »).
 */
export function choixEcheances(maintenant: Maintenant): ChoixEcheance[] {
  const auj = aujourdhuiDe(maintenant);
  const lundi = lundiDe(auj);
  const finMois = finDuMois(auj);
  const moisSuivant = finDuMois(ajouterJours(finMois, 1));
  const choix = (cle: CleEcheance, libelle: string, date: string | null, precision: PrecisionTache): ChoixEcheance =>
    ({ cle, libelle, date, precision, echeance: date === null ? null : echeanceDe(date, precision) });
  const sortie = [
    choix('cette-semaine', 'Cette semaine', auj, 'semaine'),
    choix('semaine-prochaine', 'La semaine prochaine', ajouterJours(lundi, 7), 'semaine'),
    choix('fin-du-mois', 'Fin du mois', finMois, 'mois'),
    choix('mois-prochain', 'Le mois prochain', moisSuivant, 'mois'),
    choix('un-jour', 'Un jour', null, 'semaine')
  ];
  const dimanche = dimancheDe(auj);
  return sortie.filter(c => c.cle !== 'fin-du-mois' || (c.echeance !== null && c.echeance > dimanche));
}

/** Le choix qui dit l'échéance actuelle d'une tâche (même lundi, même précision ; sans date : « Un jour »), ou `undefined` (date posée ailleurs). */
export function choixActuel(t: Pick<Tache, 'echeance' | 'precision'>, choix: readonly ChoixEcheance[]): ChoixEcheance | undefined {
  if (!t.echeance) return choix.find(c => c.cle === 'un-jour');
  return choix.find(c => c.echeance === t.echeance && c.precision === (t.precision ?? 'semaine'));
}

/* ---------- carte « À ranger » (imprévus) ---------- */

/** Ce qui attend dans « À ranger » : un texte (vague ou non), une photo, ou les deux. `carnetId` : le carnet où la note a été posée, exclu des candidats. */
export interface ElementARanger { carnetId?: string; texte?: string; photo?: string; le: string }

/** Des mots qui ne disent rien du sujet (outils du français et « chose à voir ») : un texte qui n'en a pas d'autres ne range rien. */
const MOTS_VAGUES = new Set([
  'a', 'au', 'aux', 'de', 'du', 'des', 'le', 'la', 'les', 'l', 'un', 'une', 'ca', 'ce', 'cet', 'cette', 'ces', 'ceci', 'cela', 'il', 'y', 'faut', 'que', 'qui', 'ici',
  'est', 'et', 'ou', 'en', 'dans', 'sur', 'pour', 'avec', 'quelque', 'quelques', 'qqch', 'qqc',
  'voir', 'regarder', 'verifier', 'revoir', 'checker', 'check', 'controler', 'noter', 'penser', 'faire', 'todo',
  'truc', 'trucs', 'machin', 'machins', 'chose', 'choses', 'bidule', 'bidules', 'cas', 'affaire'
]);

/** « truc à voir » : rien d'autre que des mots vides. Un chiffre ou un mot de 3 lettres hors liste suffit à dire quelque chose. */
export function texteMince(texte?: string): boolean {
  const mots = plier(texte ?? '').replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean);
  return !mots.some(m => !MOTS_VAGUES.has(m) && (m.length >= 3 || /\d/.test(m)));
}

export type PropositionARanger =
  | { sorte: 'rattacher'; carnetId: string; titre: string; raison: string; le: string }
  | { sorte: 'rien-d-autre' }
  | { sorte: 'aucune' };

const instant = (iso?: string): number => { const n = iso ? Date.parse(iso) : NaN; return Number.isNaN(n) ? -Infinity : n; };

/** La dernière écriture dans un carnet (ISO) : message du fil, événement du suivi, tâche, note, ou sa création. `null` si rien n'est daté. */
export function dernierTouche(c: CarnetDoc, messages: readonly MessageDoc[]): string | null {
  const d = c.carnet;
  const dates: (string | undefined)[] = [
    d.creeLe, ...d.notes.map(n => n.modifieeLe), ...(d.suivi?.evenements ?? []).map(e => e.le), ...(d.taches ?? []).flatMap(t => [t.creeeLe, t.faiteLe]),
    ...messages.filter(m => m.carnetMessage.effets.some(e => e.carnetId === c.id)).map(m => m.carnetMessage.le)
  ];
  let meilleur: string | null = null;
  for (const x of dates) if (x && instant(x) > (meilleur === null ? -Infinity : instant(meilleur))) meilleur = x;
  return meilleur;
}

/** « aujourd'hui », « hier », « il y a 3 jours », puis la date (« 12 nov. ») : ce que l'on sait, sans promettre une ouverture à l'écran. */
export function quandTouche(le: string, maintenant: Maintenant): string {
  const ecart = ecartJours(jourLocal(le), aujourdhuiDe(maintenant));
  if (ecart <= 0) return 'aujourd’hui';
  if (ecart === 1) return 'hier';
  if (ecart < 7) return `il y a ${ecart} jours`;
  return `le ${jourLisible(jourLocal(le))}`;
}

/**
 * Option B (PLAN, « photo seule ») : une photo sans mots (ou avec des mots vides) est proposée au problème ouvert touché en dernier, avec sa
 * raison ; la photo n'est jamais décrite. Sans problème ouvert : `aucune` (Nouveau problème, Laisser). Un texte vague sans photo : `rien-d-autre`
 * (la carte dit « rien d'autre écrit : reste ici » et propose Laisser d'abord). Un texte qui dit quelque chose se range ailleurs : `aucune`.
 */
export function propositionARanger(el: ElementARanger, carnets: readonly CarnetDoc[], messages: readonly MessageDoc[], maintenant: Maintenant): PropositionARanger {
  const mince = texteMince(el.texte);
  if (!(el.photo && mince)) return mince ? { sorte: 'rien-d-autre' } : { sorte: 'aucune' };
  /* R66 (C67B-4) : « ouvert » se dit comme le coup d'œil de la liste (« 8 je cherche ») : un carnet en recherche ou décidé, quel que soit son genre (un achat qui cherche, une idée décidée), et tout
     problème non résolu ; le genre « problème » seul laissait « Aucun problème ouvert » devant 8 carnets « je cherche ». Archivé : jamais. */
  const ouverts = carnets.filter(c => c.id !== el.carnetId && !c.carnet.archive && etatDe(c) !== 'resolu'
    && (genreDe(c) === 'probleme' || etatDe(c) === 'cherche' || etatDe(c) === 'decide'));
  let choisi: { c: CarnetDoc; le: string } | null = null;
  for (const c of ouverts) {
    const le = dernierTouche(c, messages);
    if (!le) continue;
    if (!choisi || instant(le) > instant(choisi.le) || (instant(le) === instant(choisi.le) && c.title.localeCompare(choisi.c.title, 'fr') < 0)) choisi = { c, le };
  }
  if (!choisi) return { sorte: 'aucune' };
  return { sorte: 'rattacher', carnetId: choisi.c.id, titre: choisi.c.title, raison: `dernier touché : ${quandTouche(choisi.le, maintenant)}`, le: choisi.le };
}

/** Ce que la carte dit en tête et au corps, hors la proposition de rattachement. */
export function motsDeLaCarte(el: ElementARanger, p: PropositionARanger): { tete: string; corps: string | null } {
  if (p.sorte === 'rien-d-autre') return { tete: 'à ranger', corps: 'rien d’autre écrit : reste ici' };
  const sansTexte = !(el.texte ?? '').trim();
  const tete = el.photo && sansTexte ? 'photo seule, sans texte' : 'à ranger';
  return { tete, corps: p.sorte === 'aucune' ? (el.photo && sansTexte ? 'Aucun problème ouvert où la ranger.' : 'Pas de proposition.') : null };
}
